# RESILINK v3 (ODEP) - Node.js Middleware API for Blockchain-Based Resource Exchange

RESILINK (2022-2026) is a project funded by the PRIMA Programme supported by the European Union. The project web site is https://resilink.eu/.

**RESILINK v3** (main/dev branch) is a Node.js/Express **middleware platform** that acts as an intermediary layer between a mobile application and the **ODEP (Orange Digital Energy Platform)** blockchain API. It facilitates **resource/asset exchange** between users (prosumers).

It proxies CRUD operations to the ODEP blockchain for core business entities, enriches ODEP data with local metadata (images, GPS, phone numbers), and manages local-only features (news, ratings).
feature/without-odep

> A standalone variant is available in the `feature/without-odep` branch — it does **not rely on the ODEP API** and operates fully autonomously with local MongoDB storage, multi-server federation, and recommendations (more advanced version).

## Main Features

- **RESTful API** built with **Express** and documented with **Swagger**
- **ODEP blockchain integration**: proxies users, prosumers, assets, offers, contracts, requests, and regulators to ODEP
- **Dual endpoint system**: ODEP-only (`/v3/ODEP/...`) and enriched (`/v3/...`) endpoints
- **MongoDB enrichment**: images, GPS, phone numbers, transaction types, bookmarks, blocked offers
- **Full transaction lifecycle**: offer → request → contract workflow via ODEP
- **Local-only features**: news feed, user ratings (entirely managed in MongoDB)
- **Security**: ODEP token-based authentication, AES-256-CBC encryption of sensitive local data
- **Database initialization**: automatic index creation and deduplication at startup (`InitDB.js`)

## Prerequisites

- **Node.js** (v18.20 or later)
- **MongoDB** (Atlas cluster *or* local installation)
- **ODEP API** (URLs are **confidential** — must be requested from ORANGE or from `Congduc.Pham@univ-pau.fr`)

## Installation

RESILINK v3 (ODEP) supports two database modes. Choose the one that fits your setup:

### Option A: Automated Local Installation (recommended for first setup)

Installation scripts are provided in `Resilink_webserver/script/` for **Linux** and **Windows**. They install MongoDB locally if not present and set up the database.

**Linux/Ubuntu:**
```bash
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server/Resilink_webserver/script
chmod +x install_resilink.sh
./install_resilink.sh
```

**Windows (PowerShell as Administrator):**
```powershell
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server\Resilink_webserver\script
.\install_resilink.ps1
```

> **Note (Windows):** The script attempts to install MongoDB and mongosh automatically via `winget` (available on Windows 10 1709+). If `winget` is not available, you will be prompted to install them manually from https://www.mongodb.com/try/download/community before re-running the script.

After the script completes:
1. Configure `RESILINK_Server.env` (see [Environment Variables](#environment-variables) below)
2. Start the server:
   ```bash
   cd Resilink_webserver
   node src/index.js
   ```

### Option B: Manual Installation with MongoDB Atlas

Use this if you already have a MongoDB Atlas cluster or prefer cloud hosting.

**1. Clone and install:**
```bash
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server/Resilink_webserver
npm install
```

**2. Create MongoDB databases:**

On your Atlas cluster (via mongosh, Compass, or Atlas UI), create two databases:

**Database `Logs`** (Winston logging):
```
use Logs

db.createCollection("ConnectionLogs")
db.createCollection("DeleteLogs")
db.createCollection("GetLogs")
db.createCollection("PatchLogs")
db.createCollection("PutLogs")
```

**Database `Resilink`** (main business data):
```
use Resilink

db.createCollection("Asset")
db.createCollection("Counters")
db.createCollection("News")
db.createCollection("Offer")
db.createCollection("Rating")
db.createCollection("prosumer")
db.createCollection("user")
```



**3. Configure environment variables:**

Create `RESILINK_Server.env` in the `Resilink_webserver/` directory (see [Environment Variables](#environment-variables) below).

**4. Start the server:**
```bash
node src/index.js
```

### Expected Output

```
Connected to MongoDB
API is listening on port 9990 and using ip 0.0.0.0
Swagger docs available at http://0.0.0.0:9990/v3/api-docs
```

## Environment Variables

Create a file named **`RESILINK_Server.env`** in the `Resilink_webserver/` directory:

```env
# Server
IP_ADDRESS=0.0.0.0
PORT=9990
SWAGGER_URL=http://0.0.0.0:9990

# Security
ENCRYPTION_KEY=<64 hex chars>
TOKEN_KEY=<64 hex chars>

# Database
DB_MODE=atlas
DB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
DB_LOGS_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/Logs

# ODEP API (confidential — request URLs from ORANGE)
PATH_ODEP_USER=https://<ODEP_HOST>/oauth/api/v1.0.0/
PATH_ODEP_PROSUMER=https://<ODEP_HOST>/restapi/api/v3/prosumers/
PATH_ODEP_REGULATOR=https://<ODEP_HOST>/restapi/api/v3/regulators/
PATH_ODEP_ASSET=https://<ODEP_HOST>/restapi/api/v3/assets/
PATH_ODEP_ASSETTYPE=https://<ODEP_HOST>/restapi/api/v3/assetTypes/
PATH_ODEP_OFFER=https://<ODEP_HOST>/restapi/api/v3/offers/
PATH_ODEP_REQUEST=https://<ODEP_HOST>/restapi/api/v3/requests/
PATH_ODEP_CONTRACT=https://<ODEP_HOST>/restapi/api/v3/contracts/
```

**`DB_MODE`**: Set to `atlas` to use a MongoDB Atlas cluster (requires `DB_URL` and `DB_LOGS_URL`), or `local` to use a local MongoDB instance at `mongodb://127.0.0.1:27017` (DB_URL and DB_LOGS_URL are then ignored).

Generate cryptographic keys with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Never commit `RESILINK_Server.env` to Git.** Add it to `.gitignore`.

## API Routes

The API is available at `/v3` and documented via Swagger at `/v3/api-docs`.

**Core Resources (ODEP-proxied + locally enriched):**
- **`/users`** — Account management, authentication (ODEP tokens)
- **`/prosumers`** — Prosumer profiles, bookmarks, blocked offers
- **`/offers`** — Offer CRUD, filtering, pagination, suggestions
- **`/assets`** — Asset management, image upload (Base64 → PNG)
- **`/assetTypes`** — Asset categories (ODEP-managed)
- **`/contracts`** — Transaction contracts (ODEP-managed)
- **`/requests`** — Purchase/rental requests (ODEP-managed)
- **`/regulators`** — Regulatory entities (ODEP-managed)

**Local-Only Resources:**
- **`/news`** — Platform news and publications
- **`/rating`** — User ratings

**Dual Endpoint Pattern:**
- `GET /v3/ODEP/assets/all/` → Raw ODEP data only
- `GET /v3/assets/all` → ODEP data enriched with local images and metadata

## Project Structure

```
Resilink_webserver/
├── package.json
├── RESILINK_Server.env             # Environment variables (not committed)
├── public/
│   └── images/                     # Asset images (PNG, organized by asset ID)
├── script/
│   ├── install_resilink.sh         # Linux installation script
│   ├── install_resilink.ps1        # Windows installation script
└── src/
    ├── index.js                    # Entry point, server initialization
    └── v3/
        ├── config.js               # Environment variables loader
        ├── errors.js               # Custom error classes
        ├── loggers.js              # Winston loggers configuration
        ├── swaggerV3.js            # Swagger documentation setup
        ├── routes/                 # HTTP Routes + Swagger annotations (10 files)
        ├── controllers/            # HTTP handlers - req/res (10 files)
        ├── services/               # Business logic (10 files + Utils.js)
        └── database/               # Data access layer (8 files + InitDB.js)
```

**Architecture**: MVC+S (Model-View-Controller + Service Layer)

```
Client → Routes → Controller → Service ─┬─> ODEP API (fetch HTTP)
                                        │
                                        └─> Database Layer → MongoDB (local enrichment)
```

## Branches

- **`main`** — Production with ODEP blockchain integration
- **`dev`** — **Current** — Development with ODEP
- **`feature/without-odep`** — Standalone version without blockchain (federation, recommendations)
- **`deploy/render`** — Deployment for a specific hosting provider

## Documentation

- **Swagger UI**: `http://<IP_ADDRESS>:<PORT>/v3/api-docs`
- **Technical Specification**: [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)

## License

**License**: UPPA
**Copyright**: © 2026 Axel Cazaux - UPPA

Usage authorized within the RESILINK project framework only.
