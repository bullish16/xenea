// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title XENEAStaking
 * @notice Stake TokenA or TokenB, earn XENEA rewards
 * @dev Reward rate: 0.001 XENEA per minute per 100,000 staked tokens
 *      = 0.00000001 XENEA per minute per 1 token (scaled)
 */
contract XENEAStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Tokens ──
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    IERC20 public immutable rewardToken; // XENEA

    // ── Reward Config ──
    // 0.001 XENEA per minute per 100,000 tokens staked
    // = 0.001e18 / 60 / 100_000e18 per second per wei
    // = 1e15 / 60 / 1e23 = 1e15 / 6e24 per second per wei
    // Simplified: rewardPerSecond = staked * REWARD_RATE / RATE_PRECISION
    // REWARD_RATE = 0.001e18 / 60 = 16666666666666 (~1.667e13) per 100_000e18 staked per second
    uint256 public constant REWARD_PER_MINUTE = 0.001 ether;   // 0.001 XENEA
    uint256 public constant STAKE_UNIT = 100_000 ether;         // per 100,000 tokens
    uint256 public constant RATE_PRECISION = 1e18;

    // ── User State ──
    struct UserStake {
        uint256 amountA;         // TokenA staked
        uint256 amountB;         // TokenB staked
        uint256 pendingRewards;  // Unclaimed XENEA
        uint256 lastUpdateTime;  // Last reward calculation
    }

    mapping(address => UserStake) public stakes;

    // ── Stats ──
    uint256 public totalStakedA;
    uint256 public totalStakedB;

    // ── Events ──
    event Staked(address indexed user, address indexed token, uint256 amount);
    event Unstaked(address indexed user, address indexed token, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);

    constructor(
        address _tokenA,
        address _tokenB,
        address _rewardToken
    ) Ownable(msg.sender) {
        require(_tokenA != address(0) && _tokenB != address(0) && _rewardToken != address(0), "Zero address");
        require(_tokenA != _tokenB, "Same tokens");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        rewardToken = IERC20(_rewardToken);
    }

    // ═══════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Calculate pending rewards for a user
     * @dev reward = (totalStaked / 100_000e18) * 0.001e18 * minutesElapsed
     */
    function pendingReward(address user) public view returns (uint256) {
        UserStake storage s = stakes[user];
        if (s.lastUpdateTime == 0) return 0;

        uint256 totalStaked = s.amountA + s.amountB;
        if (totalStaked == 0) return s.pendingRewards;

        uint256 elapsed = block.timestamp - s.lastUpdateTime;
        // reward = totalStaked * REWARD_PER_MINUTE * elapsed / STAKE_UNIT / 60
        uint256 newReward = (totalStaked * REWARD_PER_MINUTE * elapsed) / STAKE_UNIT / 60;

        return s.pendingRewards + newReward;
    }

    /**
     * @notice Check remaining reward tokens in contract
     */
    function rewardsAvailable() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    // ═══════════════════════════════════════════
    // USER FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Stake TokenA
     */
    function stakeTokenA(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        _updateRewards(msg.sender);

        tokenA.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amountA += amount;
        totalStakedA += amount;

        emit Staked(msg.sender, address(tokenA), amount);
    }

    /**
     * @notice Stake TokenB
     */
    function stakeTokenB(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        _updateRewards(msg.sender);

        tokenB.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amountB += amount;
        totalStakedB += amount;

        emit Staked(msg.sender, address(tokenB), amount);
    }

    /**
     * @notice Unstake TokenA (partial or full)
     */
    function unstakeTokenA(uint256 amount) external nonReentrant {
        UserStake storage s = stakes[msg.sender];
        require(amount > 0 && amount <= s.amountA, "Invalid amount");
        _updateRewards(msg.sender);

        s.amountA -= amount;
        totalStakedA -= amount;
        tokenA.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, address(tokenA), amount);
    }

    /**
     * @notice Unstake TokenB (partial or full)
     */
    function unstakeTokenB(uint256 amount) external nonReentrant {
        UserStake storage s = stakes[msg.sender];
        require(amount > 0 && amount <= s.amountB, "Invalid amount");
        _updateRewards(msg.sender);

        s.amountB -= amount;
        totalStakedB -= amount;
        tokenB.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, address(tokenB), amount);
    }

    /**
     * @notice Claim accumulated XENEA rewards
     */
    function claim() external nonReentrant {
        _updateRewards(msg.sender);

        uint256 reward = stakes[msg.sender].pendingRewards;
        require(reward > 0, "No rewards");

        stakes[msg.sender].pendingRewards = 0;

        uint256 available = rewardToken.balanceOf(address(this));
        require(available >= reward, "Insufficient reward balance");

        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Unstake all + claim rewards in one tx
     */
    function exitAll() external nonReentrant {
        _updateRewards(msg.sender);
        UserStake storage s = stakes[msg.sender];

        uint256 amtA = s.amountA;
        uint256 amtB = s.amountB;
        uint256 reward = s.pendingRewards;

        s.amountA = 0;
        s.amountB = 0;
        s.pendingRewards = 0;

        if (amtA > 0) {
            totalStakedA -= amtA;
            tokenA.safeTransfer(msg.sender, amtA);
            emit Unstaked(msg.sender, address(tokenA), amtA);
        }
        if (amtB > 0) {
            totalStakedB -= amtB;
            tokenB.safeTransfer(msg.sender, amtB);
            emit Unstaked(msg.sender, address(tokenB), amtB);
        }
        if (reward > 0) {
            uint256 available = rewardToken.balanceOf(address(this));
            if (available >= reward) {
                rewardToken.safeTransfer(msg.sender, reward);
                emit RewardClaimed(msg.sender, reward);
            }
        }
    }

    // ═══════════════════════════════════════════
    // OWNER FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Fund the contract with XENEA reward tokens
     * @dev Owner must approve this contract first
     */
    function fundRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    /**
     * @notice Emergency withdraw stuck tokens (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    // ═══════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════

    function _updateRewards(address user) internal {
        UserStake storage s = stakes[user];

        if (s.lastUpdateTime > 0) {
            uint256 totalStaked = s.amountA + s.amountB;
            if (totalStaked > 0) {
                uint256 elapsed = block.timestamp - s.lastUpdateTime;
                uint256 newReward = (totalStaked * REWARD_PER_MINUTE * elapsed) / STAKE_UNIT / 60;
                s.pendingRewards += newReward;
            }
        }

        s.lastUpdateTime = block.timestamp;
    }
}
