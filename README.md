# 🪙 XENEA Token (ERC-20)

Deploy token ERC-20 **XENEA** dengan supply 1 Billion ke jaringan **XENEA Chain (1096)**.

## Info Token

| Field | Value |
|-------|-------|
| Name | XENEA |
| Ticker | XENEA |
| Supply | 1,000,000,000 (1B) |
| Decimals | 18 |
| Chain | XENEA (Chain ID: 1096) |
| RPC | https://rpc-ubusuna.xeneascan.com |
| Explorer | https://ubusuna.xeneascan.com |

## Requirements

- **Node.js** v18+
- **npm** atau **yarn**
- **TXENE** (native token) untuk gas fee

## Setup

### 1. Install dependencies

```bash
cd xenea-token
npm install
```

### 2. Setup private key

```bash
cp .env.example .env
nano .env
```

Isi `PRIVATE_KEY` dengan private key wallet kamu (tanpa `0x`):

```
PRIVATE_KEY=abc123your_private_key_here
```

### 3. Pastikan punya TXENE untuk gas

Cek balance di: https://ubusuna.xeneascan.com/address/WALLET_KAMU

## Deploy & Verify

Satu command langsung deploy + auto verify:

```bash
npx hardhat run scripts/deploy.cjs --network xenea
```

Output:
```
🚀 Deploying XENEA Token
👛 Deployer: 0x...
⏳ Deploying...
✅ XENEA Token deployed!
📄 Contract: 0x...
🔍 Verifying contract...
✅ Contract verified!
```

## Verify Manual (kalau auto gagal)

```bash
npx hardhat verify --network xenea CONTRACT_ADDRESS
```

## Cek Token

Setelah deploy, semua 1B XENEA langsung masuk ke wallet deployer.

Lihat di explorer: `https://ubusuna.xeneascan.com/address/CONTRACT_ADDRESS`

## Struktur File

```
xenea-token/
├── contracts/
│   └── XENEA.sol          # Smart contract ERC-20
├── scripts/
│   └── deploy.cjs         # Deploy + verify script
├── hardhat.config.cjs     # Hardhat config (XENEA chain)
├── .env.example            # Template private key
├── .gitignore
├── package.json
└── README.md
```
