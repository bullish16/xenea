# 🪙 XENEA Token + Staking

Deploy **XENEA** ERC-20 token + **Staking Contract** ke XENEA Chain (1096).

## Contracts

### 1. XENEA Token (ERC-20)
| Field | Value |
|-------|-------|
| Name | XENEA |
| Ticker | XENEA |
| Supply | 1,000,000,000 (1B) |
| Decimals | 18 |

### 2. Staking Contract
| Feature | Detail |
|---------|--------|
| Stake | TokenA atau TokenB |
| Reward | XENEA token |
| Rate | **0.001 XENEA per menit** per 100,000 token staked |
| Lock | Tidak ada (bebas unstake kapan saja) |
| Functions | `stakeTokenA`, `stakeTokenB`, `unstakeTokenA`, `unstakeTokenB`, `claim`, `exitAll` |

### Reward Calculation
```
reward = (jumlah_staked / 100,000) × 0.001 XENEA × menit
```
Contoh: Stake 500,000 TokenA selama 60 menit = `(500000/100000) × 0.001 × 60 = 0.3 XENEA`

## Setup

### 1. Install

```bash
cd xenea-token
npm install
```

### 2. Config `.env`

```bash
cp .env.example .env
nano .env
```

Isi:
```env
PRIVATE_KEY=your_private_key_here
TOKEN_A=0x...address_tokenA...
TOKEN_B=0x...address_tokenB...
```

### 3. Pastikan punya TXENE untuk gas

## Deploy

### Deploy semua sekaligus (XENEA Token + Staking + Fund + Verify):

```bash
npx hardhat run scripts/deploy-all.cjs --network xenea
```

Ini akan:
1. Deploy XENEA Token (1B supply)
2. Deploy Staking Contract (TokenA, TokenB → XENEA reward)
3. Fund 100M XENEA ke staking contract
4. Auto verify kedua contract di explorer

### Deploy XENEA Token saja:

```bash
npx hardhat run scripts/deploy.cjs --network xenea
```

## Verify Manual

```bash
# XENEA Token
npx hardhat verify --network xenea TOKEN_ADDRESS

# Staking Contract
npx hardhat verify --network xenea STAKING_ADDRESS TOKEN_A TOKEN_B XENEA_ADDRESS
```

## Staking Functions

| Function | Keterangan |
|----------|-----------|
| `stakeTokenA(amount)` | Stake TokenA |
| `stakeTokenB(amount)` | Stake TokenB |
| `unstakeTokenA(amount)` | Unstake sebagian/semua TokenA |
| `unstakeTokenB(amount)` | Unstake sebagian/semua TokenB |
| `claim()` | Ambil reward XENEA |
| `exitAll()` | Unstake semua + claim reward (1 tx) |
| `pendingReward(address)` | Cek reward yang belum di-claim |
| `rewardsAvailable()` | Cek sisa XENEA di contract |

## Owner Functions

| Function | Keterangan |
|----------|-----------|
| `fundRewards(amount)` | Tambah XENEA ke reward pool |
| `emergencyWithdraw(token, amount)` | Tarik token stuck (darurat) |

## File Structure

```
xenea-token/
├── contracts/
│   ├── XENEA.sol              # ERC-20 token
│   └── XENEAStaking.sol       # Staking contract
├── scripts/
│   ├── deploy.cjs             # Deploy token saja
│   └── deploy-all.cjs         # Deploy semua + fund + verify
├── hardhat.config.cjs
├── .env.example
└── README.md
```
