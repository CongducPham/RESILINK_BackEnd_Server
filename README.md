# RESILINK v3 - Node.js API for Resource Discovery and Contact Exchange

**RESILINK v3** (feature/without-odep branch) is a Node.js/Express middleware platform that facilitates **resource/asset discovery and contact exchange** between users (prosumers) in a **decentralized federated network**.

It acts as a generic peer-to-peer marketplace enabling offer publication, multi-server offer discovery, and prosumer contact information access. Transactions are handled externally — users contact each other directly.

## Main Features

- **RESTful API** built with **Express** and documented with **Swagger**
- **Multi-server federation**: interconnect autonomous RESILINK servers to extend marketplace catalogs
- **Offer discovery**: local and federated offer browsing with smart filtering (expired, depleted, blocked)
- **Contact exchange model**: platform provides prosumer contact info, transactions happen externally
- **Personalized recommendations**: based on user consultation statistics (CRON-aggregated)
- **MongoDB** database with two databases (business data + logs)
- **Security**: JWT authentication (2h expiry), AES-256-CBC encryption (emails, phone numbers), bcrypt password hashing
- **Multi-domain support**: deployable for energy, electronics, services, or any custom marketplace via customizable AssetTypes
- **Per-server blocked offers**: users can block irrelevant offers from each federated server independently

## Prerequisites

- **Node.js** (v18 or later)
- **MongoDB** (Cloud MongoDB Atlas cluster or local instance)

## Installation

RESILINK v3 supports two database modes. Choose the one that fits your setup:

### Option A: Automated Local Installation (recommended for first setup)

Installation scripts are provided in `scripts/` for **Linux** and **Windows**. They handle everything automatically:
- Install MongoDB locally (if not present)
- Install Node.js (if not present)
- Generate cryptographic keys (`ENCRYPTION_KEY`, `TOKEN_KEY`, `RESILINK_NETWORK_KEY`)
- Install npm dependencies
- Create databases, collections, and indexes
- Create a default admin user (`admin` / `admin123`)
- Update `RESILINK_Server.env` with the generated keys

**Linux/Ubuntu:**
```bash
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server
cd scripts
chmod +x install_resilink.sh
./install_resilink.sh
```

**Windows (PowerShell as Administrator):**
```powershell
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server
cd scripts
.\install_resilink.ps1
```

> **Note (Windows):** MongoDB and mongosh must be installed manually before running the script.  
> Download from: https://www.mongodb.com/try/download/community

After the script completes:
1. Review and adjust `RESILINK_Server.env` (IP, port, server name, federation settings)
2. Start the server:
   ```bash
   node src/index.js
   ```

### Option B: Manual Installation with MongoDB Atlas

Use this if you already have a MongoDB Atlas cluster or prefer cloud hosting.

**1. Clone and install:**
```bash
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server
npm install
```

**2. Create MongoDB databases:**

On your Atlas cluster (via mongosh, Compass, or Atlas UI), create two databases:

**Database `ResilinkWithoutODEP`** (main business data):
```
Asset, AssetType, Counters, FavoriteServers, GlobalRecommendationStats,
News, Offer, Rating, RecommendationStats, RegisteredServers, prosumer, user
```

**Database `Logs`** (Winston logging):
```
ConnectionLogs, DeleteLogs, GetLogs, PatchLogs, PutLogs, SecurityLogs
```

> **Note:** You don't need to create the collections manually. `InitDB.js` creates unique indexes at startup, which implicitly creates the indexed collections (user, prosumer, Offer, Asset, AssetType, RegisteredServers, FavoriteServers, Rating, RecommendationStats). The remaining collections (News, Counters, GlobalRecommendationStats, Logs collections) are created automatically on first document insertion by the application or Winston.

**3. Configure environment variables:**

Create `RESILINK_Server.env` at the project root (see [Environment Variables](#environment-variables) below).

**4. Start the server:**
```bash
node src/index.js
```

### Expected Output

```
Connected to MongoDB
API is listening on port 9990
Swagger docs available at http://localhost:9990/api-docs
```

## Environment Variables

Create a file named **`RESILINK_Server.env`** at the root of the project:

```env
# Server
IP_ADDRESS=0.0.0.0
PORT=9990
SWAGGER_URL=https://my-resilink.example.com
SERVER_NAME=RESILINK Pau

# Security
ENCRYPTION_KEY=<64 hex chars>
TOKEN_KEY=<64 hex chars>
TOKEN_REQUIRED=true

# Federation
CENTRAL_SERVER_URL=https://main.resilink.org
RESILINK_NETWORK_KEY=<64 hex chars>

# Database
DB_MODE=atlas
DB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/ResilinkWithoutODEP
DB_LOGS_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/Logs
```

**`DB_MODE`**: Set to `atlas` to use a MongoDB Atlas cluster (requires `DB_URL` and `DB_LOGS_URL`), or `local` to use a local MongoDB instance at `mongodb://127.0.0.1:27017` (DB_URL and DB_LOGS_URL are then ignored).

Generate cryptographic keys with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Never commit `RESILINK_Server.env` to Git.** Add it to `.gitignore`.

## API Routes

The API is available at `/v3` and documented via Swagger at `/api-docs`.

**Core Resources:**
- **`/users`** — Account management, authentication (JWT)
- **`/prosumers`** — Prosumer profiles, blocked offers management
- **`/offers`** — Offer CRUD, local/federated discovery, smart filtering
- **`/assets`** — Asset management, image upload
- **`/assetTypes`** — Customizable asset categories

**Social & Recommendations:**
- **`/news`** — Platform news and publications
- **`/rating`** — User ratings
- **`/recommendationstats`** — Consultation statistics for recommendations

**Federation:**
- **`/registeredservers`** — Federation server registry
- **`/favoriteServers`** — User favorite servers for offer aggregation

**Not Implemented (feature/without-odep):**
- ⚠️ **`/contracts`** — Contract management (see `main` branch)
- ⚠️ **`/ODEP/regulators`** — Regulator management (see `main` branch)
- ⚠️ **`/ODEP/requests`** — Request management (see `main` branch)

## Project Structure

```
RESILINK_Render_Server/
├── package.json
├── README.md
├── TECHNICAL_SPECIFICATION.md
├── RESILINK_Server.env
├── public/                         # Static files (HTML, images)
└── src/
    ├── index.js                    # Entry point
    ├── middlewares/
    │   ├── serverAuth.js           # Network key auth (federation)
    │   └── optionalAuth.js         # JWT auth (required or optional)
    └── v3/
        ├── config.js               # Environment variables loader
        ├── errors.js               # Custom error classes
        ├── loggers.js              # Winston loggers configuration
        ├── swaggerV3.js            # Swagger documentation setup
        ├── routes/                 # HTTP Routes + Swagger annotations (13 files)
        ├── controllers/            # HTTP handlers - req/res (13 files)
        ├── services/               # Business logic (14 files)
        └── database/               # Data access layer (14 files)
```

**Architecture**: MVC+S (Model-View-Controller + Service Layer)

```
Client → Routes → Middleware Auth → Controller → Service → Database → MongoDB
                                                    ↓
                                              Federated Servers
```

## Federation

RESILINK supports a **decentralized federated network** where autonomous servers interconnect:

- A **main server** acts as a network showcase/registry (stores registered servers list)
- **Member servers** join the network by registering with the main server using `RESILINK_NETWORK_KEY`
- Users select **favorite servers** to aggregate offers from
- Offer aggregation is performed **per-server** (parallel fetching via `Promise.allSettled`)
- One server's failure never blocks the entire request

```
                  ┌───────────────────┐
                  │   Main Server     │
                  │      (Pau)        │
                  └────────┬──────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌─────▼────┐
    │Server A  │      │Server B  │      │ Server C │
    │(Toulouse)│      │(Bordeaux)│      │(Bayonne) │
    └──────────┘      └──────────┘      └──────────┘
```

## Branches

- **`feature/without-odep`** — **Current** — Production without blockchain (MainWithoutODEP)
- **`main`** — Production with ODEP blockchain integration
- **`deploy/render`** — Deployment for a specific hosting provider
- **`dev`** — Development

## Documentation

- **Swagger UI**: `https://<your-server>/v3/api-docs`
- **Technical Specification**: [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)

## License

**License**: UPPA
**Copyright**: © 2026 Axel Cazaux - UPPA

Usage authorized within the RESILINK project framework only.


