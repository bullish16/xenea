# 🪙 XENEA Token + Staking

## Scripts

Semua script terpisah, jalankan satu-satu sesuai urutan.

### Deploy (urut 1→4)

```bash
# 1. Deploy TokenA
npx hardhat run scripts/1-deploy-tokenA.cjs --network xenea
# → copy address ke .env: TOKEN_A=0x...

# 2. Deploy TokenB
npx hardhat run scripts/2-deploy-tokenB.cjs --network xenea
# → copy address ke .env: TOKEN_B=0x...

# 3. Deploy XENEA Token (1B supply)
npx hardhat run scripts/3-deploy-xenea.cjs --network xenea
# → copy address ke .env: XENEA_TOKEN=0x...

# 4. Deploy Staking + Fund 100M XENEA reward
npx hardhat run scripts/4-deploy-staking.cjs --network xenea
# → copy address ke .env: STAKING_CONTRACT=0x...
```

### Interact

```bash
# Stake TokenA (100,000)
STAKE_TOKEN=A STAKE_AMOUNT=100000 npx hardhat run scripts/stake.cjs --network xenea

# Stake TokenB (50,000)
STAKE_TOKEN=B STAKE_AMOUNT=50000 npx hardhat run scripts/stake.cjs --network xenea

# Unstake TokenA (semua)
STAKE_TOKEN=A UNSTAKE_AMOUNT=all npx hardhat run scripts/unstake.cjs --network xenea

# Unstake TokenB (sebagian)
STAKE_TOKEN=B UNSTAKE_AMOUNT=25000 npx hardhat run scripts/unstake.cjs --network xenea

# Claim reward XENEA
npx hardhat run scripts/claim.cjs --network xenea

# Cek status
npx hardhat run scripts/status.cjs --network xenea
```

## .env Config

```env
PRIVATE_KEY=your_private_key

# Token addresses (isi setelah deploy)
TOKEN_A=0x...
TOKEN_B=0x...
XENEA_TOKEN=0x...
STAKING_CONTRACT=0x...

# Optional: nama/symbol untuk MockToken
TOKEN_A_NAME=Token A
TOKEN_A_SYMBOL=TKA
TOKEN_B_NAME=Token B
TOKEN_B_SYMBOL=TKB

# Optional: jumlah reward (default 100M)
REWARD_AMOUNT=100000000
```

## Reward Rate

**0.001 XENEA per menit** per 100,000 token staked

| Staked | Per Menit | Per Jam | Per Hari |
|--------|-----------|---------|----------|
| 100,000 | 0.001 | 0.06 | 1.44 |
| 500,000 | 0.005 | 0.30 | 7.20 |
| 1,000,000 | 0.010 | 0.60 | 14.40 |

## File Structure

```
scripts/
├── 1-deploy-tokenA.cjs    # Deploy TokenA
├── 2-deploy-tokenB.cjs    # Deploy TokenB
├── 3-deploy-xenea.cjs     # Deploy XENEA token
├── 4-deploy-staking.cjs   # Deploy staking + fund rewards
├── stake.cjs              # Stake TokenA/B
├── unstake.cjs            # Unstake TokenA/B
├── claim.cjs              # Claim XENEA rewards
└── status.cjs             # Cek posisi & reward
```
