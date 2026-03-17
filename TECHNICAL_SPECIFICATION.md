# RESILINK v2 - Complete Technical Specification

**Version**: 2.0  
**Date**: February 2026  
**Author**: Axel Cazaux - UPPA  
**License**: UPPA  

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Data Model](#3-data-model)
4. [REST API - Endpoints](#4-rest-api---endpoints)
5. [Business Features](#5-business-features)
6. [Security and Authentication](#6-security-and-authentication)
7. [Multi-Server Federation](#7-multi-server-federation)
8. [Technologies and Stack](#8-technologies-and-stack)
9. [Configuration and Deployment](#9-configuration-and-deployment)
10. [Logging and Monitoring](#10-logging-and-monitoring)
11. [Flow Diagrams](#11-flow-diagrams)
12. [Appendices](#12-appendices)

---

## 1. Overview

### 1.1 Project Description

**RESILINK v2** (MainWithoutODEP branch) is a Node.js/Express middleware platform that facilitates **resource/asset discovery and contact exchange** between users (prosumers) in a **decentralized federated network**. It acts as a peer-to-peer marketplace enabling:

- **Offer publication** (resources, products, or services for sale/rental)
- **Offer discovery** from local server and federated servers
- **Contact information access** (transactions are externalized - users contact each other directly)
- **Data aggregation** from multiple RESILINK servers
- **Smart recommendations** based on user behavior

**Important**: This version focuses on **offer discovery and contact exchange**. The actual transaction/exchange process is handled **outside the platform** (direct contact between prosumers). Contracts and Requests endpoints exist but are **not implemented** in this branch.

### 1.2 Business Objectives

| Objective | Description |
|-----------|-------------|
| **Generic Resource Marketplace** | Enable prosumers to create, browse, and exchange offers for any type of resource (energy, electronics, furniture, services, etc.) |
| **Decentralized Federation** | Join RESILINK server networks to extend marketplace catalogs across domains or regions |
| **Multi-Domain Support** | Deployable for energy, electronics, household products, services, or any custom marketplace |
| **Multi-Actor Management** | Users, Prosumers, Regulators with distinct roles and permissions |
| **Blockchain Ready** | Interface ready for blockchain integration via ODEP (currently out of scope in MainWithoutODEP branch) |
| **Scalability** | Modular architecture supporting horizontal growth of federated networks across domains |

### 1.3 Scope

**Included:**
- Complete REST API for generic marketplace discovery (any domain)
- Offer publication and discovery (local + federated)
- Contact information access for direct prosumer-to-prosumer communication
- MongoDB database for local persistence
- Multi-server federation system (cross-domain or same-domain)
- JWT authentication and AES-256 encryption
- Interactive Swagger documentation
- Personalized recommendation system
- Per-server blocked offers management
- Customizable AssetTypes for any marketplace domain

**Excluded (MainWithoutODEP version):**
- ODEP blockchain integration - see `main` branch
- **Contract management** (endpoints exist but not implemented - transactions externalized)
- **Request management** (endpoints exist but not implemented)
- Frontend user interface (consumed by mobile application)
- Payment processing
- Transaction execution (users contact each other directly outside the platform)

**Philosophy**: This version acts as a **discovery and contact platform**. Users find offers, view prosumer contact details, and handle transactions independently. The focus is on marketplace visibility, not transaction execution.

---

## 2. System Architecture

### 2.1 Global Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE APPLICATION                         │
│                    (External Client - out of scope)             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESILINK v2 SERVER (Node.js)                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Routes     │→ │ Controllers  │→ │  Services    │           │
│  │  (Swagger)   │  │   (HTTP)     │  │ (Business)   │           │
│  └──────────────┘  └──────────────┘  └──────┬───────┘           │
│                                              │                  │
│                                              ▼                  │
│                                      ┌──────────────┐           │
│                                      │  Database    │           │
│                                      │   Layer      │           │
│                                      └──────┬───────┘           │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
            │   MongoDB     │        │  MongoDB      │        │  Main Server  │
            │   Resilink    │        │    Logs       │        │  (Registry)   │
            │  (Main DB)    │        │  (Winston)    │        │  Optional     │
            └───────────────┘        └───────────────┘        └───────────────┘
```

### 2.2 Architecture Interne (MVC+S)

**Pattern**: Model-View-Controller + Service Layer

```
src/
├── index.js                    # Entry point, server initialization
├── middlewares/
│   ├── serverAuth.js          # Network key auth for other servers
│   └── optionalAuth.js        # Optional auth for public routes
└── v2/
    ├── config.js              # Environment variables loader
    ├── errors.js              # Custom error classes
    ├── loggers.js             # Winston loggers configuration
    ├── swaggerV2.js           # Swagger documentation setup
    │
    ├── routes/                # HTTP Routes + Swagger annotations
    │   ├── UserRoute.js
    │   ├── ProsummerRoute.js
    │   ├── OfferRoute.js
    │   ├── AssetRoute.js
    │   ├── AssetTypeRoute.js
    │   ├── RegulatorRoute.js
    │   ├── ContractRoute.js
    │   ├── NewsRoute.js
    │   ├── RatingRoute.js
    │   ├── RecommendationStatsRoute.js
    │   ├── RegisteredServersRoute.js
    │   └── FavoriteServersRoute.js
    │
    ├── controllers/           # HTTP handlers (req/res)
    │   ├── UserController.js
    │   ├── ProsummerController.js
    │   ├── OfferController.js
    │   ├── AssetController.js
    │   ├── AssetTypeController.js
    │   ├── RegulatorController.js
    │   ├── ContractController.js
    │   ├── NewsController.js
    │   ├── RatingController.js
    │   ├── RecommendationStatsController.js
    │   ├── RegisteredServersController.js
    │   └── FavoriteServersController.js
    │
    ├── services/              # Business logic
    │   ├── UserService.js
    │   ├── ProsummerService.js
    │   ├── OfferService.js
    │   ├── AssetService.js
    │   ├── AssetTypeService.js
    │   ├── RegulatorService.js
    │   ├── ContractService.js
    │   ├── NewsService.js
    │   ├── RatingService.js
    │   ├── RecommendationStatsService.js
    │   ├── RegisteredServersService.js
    │   ├── FavoriteServersService.js
    │   └── Utils.js           # HTTP fetch utilities
    │
    └── database/              # Data access layer
        ├── ConnectDB.js       # MongoDB connection manager
        ├── InitDB.js          # Database indexes initialization
        ├── CryptoDB.js        # AES-256 encryption utilities
        ├── CronFunction.js    # Scheduled jobs
        ├── UserDB.js
        ├── ProsummerDB.js
        ├── OfferDB.js
        ├── AssetDB.js
        ├── AssetTypeDB.js
        ├── NewsDB.js
        ├── RatingDB.js
        ├── RecommendationStatsDB.js
        ├── RegisteredServersDB.js
        └── FavoriteServersDB.js
```

### 2.3 Flow de Requête

```
Client → Routes → Middleware Auth → Controller → Service → Database → MongoDB
                                                    ↓
                                              Utils (External API)
                                                    ↓
                                          Federated Servers
```

**Exemple concret: GET /v2/offers/federated/all**

1. **Client** sends `GET /v2/offers/federated/all` with `Authorization: Bearer <JWT>`
2. **Route** (`OfferRoute.js`) matches pattern and applies `auth({ required: false })`
3. **Middleware** (`optionalAuth.js`) decodes JWT if present, attaches `req.user`
4. **Controller** (`OfferController.js`) calls `OfferService.getFederatedOffersCustom(req.user)`
5. **Service** (`OfferService.js`):
   - Retrieves local offers via `OfferDB.getAllOffers()`
   - Retrieves favorite servers via `FavoriteServersDB.getFavoriteServers(username)`
   - For each external server: fetch via `Utils.fetchJSONData()`
   - Filters blocked offers according to `ProsummerDB.getProsumerBlockedOffers()`
   - Aggregates and formats results
6. **Response** sent to client: `{ actualServer: {...}, "https://server1.com": {...} }`

---

## 3. Data Model

### 3.1 MongoDB Database

**Databases:**
- `ResilinkWithoutODEP` - Main database (business data)
- `Logs` - Winston logs (monitoring)

### 3.2 Collections and Schemas

#### 3.2.1 Collection `user`

**Description**: Authenticated platform users.

```javascript
{
  _id: ObjectId("..."),
  userName: "john_doe",              // UNIQUE - User identifier
  email: "john@example.com",         // Encrypted (AES-256-CBC)
  firstName: "john",
  lastName: "doe",
  roleOfUser: "prosumer",            // "prosumer" | "regulator"
  phoneNumber: "+33612345678",       // Encrypted (AES-256-CBC)
  password: "hashed_password",       // bcrypt hash (salt rounds: 10)
  accessToken: "jwt_token...",       // Temporary JWT (cleaned daily by CRON)
  gps: "<48.855874,2.346568>",       // GPS coordinates
  createdAt: "2026-02-10T10:00:00Z",
  updatedAt: "2026-02-10T14:30:00Z"
}
```

**Indexes:**
- `userName` (unique)

**Note:** Email uniqueness is enforced at the application level (scan + decrypt) since AES-256-CBC random IV prevents DB-level indexing on encrypted values.

**Required value fields**: userName, firstName, lastName, roleOfUser, email, password

**Encryption**: `email` and `phoneNumber` use AES-256-CBC (see `CryptoDB.js`); `password` uses bcrypt (salt rounds: 10). Email uniqueness is enforced at the application level (scan + decrypt) since AES random IV prevents DB-level unique indexing.

---

#### 3.2.2 Collection `prosumer`

**Description**: Prosumer (producer-consumer) profile linked to a user. Applicable to any domain (energy, electronics, household products, services, etc.).

```javascript
{
  _id: ObjectId("..."),
  id: "john_doe",                    // UNIQUE - References userName
  sharingAccount: 1500.50,           // Sharing account 
  balance: 2500.75,                  // Main balance (virtual currency)
  activityDomain: "Electronics",     // Activity sector (Energy, Electronics, Furniture, Services, etc.)
  specificActivity: "Consumer Tech", // Specific activity (customizable)
  location: "Paris",           // Geographic location
  bookMarked: [                      // Favorite news IDs
    "news_id_1",
    "news_id_2"
  ],
  blockedOffers: {                   // Multi-server blocking map (NEW v2.1)
    "actualServer": [123, 456],      // Blocked offers from local server
    "https://server1.com": [789],    // Blocked offers from server1
    "https://server2.com": [101]     // Blocked offers from server2
  }
}
```

**Indexes:**
- `id` (unique)

**Schema Evolution**: `blockedOffers` can be Array (legacy) or Object (new). Automatic migration.

---

#### 3.2.3 Collection `AssetType`

**Description**: Standardized asset types. **Fully customizable** - each RESILINK deployment can define its own asset types based on its domain.

```javascript
{
  _id: ObjectId("..."),
  name: "Solar Panel",              // UNIQUE - Type name (customizable)
  description: "Photovoltaic panels", // Description
  nature: "measurableByQuantity",   // "measurableByQuantity" | "measurableByTime"
  unit: "kWh",                      // Unit of measure if nature = measurable
  subjectOfQuantity: true,          // Indicates if asset is subject to quantity limits
  regulator: "EnergyCorp",          // Regulator (optional)
  sharingIncentive: true,           // Sharing incentive enabled (optional)
  assetDataModel: [                 // Specific attributes definition
    {
      name: "capacity",
      type: "numeric",              // string | numeric | boolean | listAsset | geographicPoint
      mandatory: "true",            // "true" | "false"
      valueList: ""                 // For listAsset: "value1,value2,value3"
    },
    {
      name: "efficiency",
      type: "string",
      mandatory: "false",
      valueList: ""
    }
  ]
}

// Domain Examples:
// Energy: {name: "Solar Panel", nature: "measurableByQuantity", unit: "kWh", ...}
// Electronics: {name: "Laptop", nature: "measurableByTime", unit: "hour", ...}
// Furniture: {name: "Office Chair", nature: "measurableByTime", unit: "day", ...}
// Services: {name: "Web Development", nature: "measurableByTime", unit: "hour", ...}
```

**Indexes:**
- `name` (unique)

**Required value fields**: description, nature, subjectOfQuantity

**Nature:**
- `measurableByQuantity`: Quantifiable assets (energy, materials, bulk items)
- `measurableByTime`: Time-based assets (services, rentals)

**assetDataModel**: Defines specific attributes that assets of this type must/can have (can be empty)

---

#### 3.2.4 Collection `Asset`

**Description**: Assets/resources owned by prosumers. Generic structure supporting any domain. 

```javascript
{
  _id: ObjectId("..."),
  id: 789,                          // UNIQUE - Auto-incremented
  name: "My Solar Panel",           // Asset name
  description: "10kW solar panel on rooftop", // Description
  assetType: "Solar Panel",         // References AssetType.name
  owner: "john_doe",                // userName of owner
  unit: "kWh",                      // Unit (can override AssetType unit)
  multiAccess: true,                // Can accept multiple requests
  totalQuantity: 10000,             // Total quantity available (for measurableByQuantity)
  remainingQuantity: 7500,          // Remaining quantity
  regulator: "tax",                 // Regulator ID (optional)   
  regulatedId: "SOLAR-PAU-001",     // Regulatory ID (optional)
  images: [                         // Asset images
    "https://domain/.../789/panel1.jpg",
    "https://domain/.../789/panel2.jpg"
  ],
  specificAttributes: [             // Attributes defined by AssetType.assetDataModel
    {
      attributeName: "capacity",
      value: "10"
    },
    {
      attributeName: "efficiency",
      value: "18%"
    }
  ],
}

// Domain Example:
// Electronics: {name: "HP Laptop", description: "", assetType: "Laptop", owner: john_doe", specificAttributes: [{attributeName: "ram", value: "16GB"}], ...}
```

**Indexes:**
- `id` (unique)
- `owner` (for queries)

**Required fields**: name, description, assetType, Images (NaN), totalQuantity, multiAccess

**Relations:**
- `assetType` → `AssetType.name`
- `owner` → `user.userName`

---

#### 3.2.5 Collection `Offer`

**Description**: Asset/resource offers published by prosumers. Generic structure applicable to any marketplace domain.

```javascript
{
  _id: ObjectId("..."),
  id: 12345,                        // UNIQUE - Auto-incremented via Counters
  offerer: "john_doe",              // userName of creator
  assetId: 789,                     // References Asset.id
  transactionType: "sale/purchase", // "sale/purchase" | "rent"
  beginTimeSlot: "2026-03-01T08:00:00Z",   // Start date/time
  endTimeSlot: "2026-03-01T18:00:00Z",     // End date/time (required for rent or measurableByQuantity assets)
  validityLimit: "2026-12-31T23:59:59Z",   // Expiration date
  publicationDate: "2026-02-10T10:00:00Z", // Creation date (auto-generated)
  offeredQuantity: 1000,            // Offered quantity (for measurableByQuantity)
  remainingQuantity: 750,           // Remaining quantity (auto-managed)
  price: 150.00,                    // Price (in Account Units per unit or per hour)
  deposit: 50.00,                   // Deposit (0-100% of asset price, for rent)
  phoneNumber: "+33612345678",      // Contact phone (decrypted on GET)
  cancellationFee: 10.00,           // Cancellation fee
  paymentMethod: "total",           // "total" | "periodic"
  paymentFrequency: 1,              // Payment frequency (for periodic)
  country: "France",                // Country of origin
  rentInformation: {                // Required for rent transactions
    delayMargin: 5.0,               // % of rental period
    lateRestitutionPenality: 10.0,  // % of asset price
    deteriorationPenality: 20.0,    // % of asset price
    nonRestitutionPenality: 100.0   // % of asset price
  }
}

// Examples across domains:
// Energy: {transactionType: "sale/purchase", offeredQuantity: 1000, price per kWh}
// Electronics rent: {transactionType: "rent", deposit: 300, rentInformation: {...}}
// Services: {transactionType: "sale/purchase", price per hour}
```

**Indexes:**
- `id` (unique)
- `offerer` (for queries)
- `assetId` (for queries)

**Required fields**: All

**Auto-increment**: `id` generated via `Counters` collection { _id: 'offerId', seq: 12345 }

**Business Rules:**
- `remainingQuantity`: Informational only in MainWithoutODEP (not automatically decremented since contracts not implemented)
- `endTimeSlot`: Required for measurableByQuantity assets or rent transactions
- Expired offers (`validityLimit < now`) filtered at service layer
- Depleted offers (`remainingQuantity <= 0`) automatically filtered
- `phoneNumber`: Encrypted in DB (AES-256), decrypted on retrieval

---

#### 3.2.6 Collection `News`

**Description**: Platform link of news and publications.

```javascript
{
  _id: ObjectId("..."),
  id: "456",                          // UNIQUE
  url: "New solar plant in Pau",      // URL of the news
  country: "France",                  // Country of origin of the news
  institue: "admin",                  // Institution's name
  img: "2026-02-08T12:00:00Z",        // image representing the news
  platform: "Instagram",              // From where is the news
  public: "false"                     // Confidentiality
}
```

**Functionality**: Prosumers can bookmark via `prosumer.bookMarked[]`

---

#### 3.2.7 Collection `Rating`

**Description**: User ratings (ratings of the application (web/mobile)).

```javascript
{
  _id: ObjectId("..."),
  userId: "john_doe",               // UNIQUE - Rater
  ratings: 4,
}
```

**Indexes:**
- `userId` (unique)

**Calculation**: Aggregated ratings to calculate overall reputation

---

#### 3.2.8 Collection `RecommendationStats`

**Description**: User consultation statistics (recommendation system).

```javascript
{
  _id: ObjectId("..."),
  name: "john_doe",                 // UNIQUE - userName
  totalOffersCreated: 26            // User-created offer
  assetType: {                      // View counters by AssetType
    "Laptop": 15,
    "Solar Panel": 8,
    "Office Chair": 3
  },
  lastUpdated: "2026-02-10T16:00:00Z"
}
```

**Indexes:**
- `name` (unique)

**Usage**: Incremented on each offer view for personalized recommendations

---

#### 3.2.9 Collection `GlobalRecommendationStats`

**Description**: Global stats aggregation (recalculated daily by CRON).

```javascript
{
  _id: ObjectId("..."),
  assetType: {
    "Laptop": 523,                  // Sum across all users
    "Solar Panel": 189,
    "Office Chair": 67
  },
  lastUpdated: "2026-02-10T00:00:00Z" // Updated at midnight
}
```

**Update**: CRON job `0 0 * * *` (see `CronFunction.js`)

---

#### 3.2.10 Collection `RegisteredServers`

**Description**: Directory of known RESILINK servers (for federation).

```javascript
{
  _id: ObjectId("..."),
  serverName: "Resilink Pau",            // UNIQUE - Server name
  serverUrl: "https://resilink-pau.org", // UNIQUE - Access URL
  createdAt: "2026-01-01T00:00:00Z",
  lastUpdated: "2026-02-10T10:00:00Z"
}
```

**Indexes:**
- `serverName` (unique)
- `serverUrl` (unique)

**Usage**: 
- Local server registration
- Global registration on main server via `CENTRAL_SERVER_URL`

---

#### 3.2.11 Collection `FavoriteServers`

**Description**: Favorite servers per user (for personalized aggregation).

```javascript
{
  _id: ObjectId("..."),
  id: "john_doe",                   // UNIQUE - userName
  servers: [                        // Array of favorite server URLs
    "https://resilink-toulouse.org",
    "https://resilink-bordeaux.org"
  ],
  createdAt: "2026-01-15T10:00:00Z",
  lastUpdated: "2026-02-10T11:00:00Z"
}
```

**Indexes:**
- `id` (unique)

**Behavior**:
- GET `/v2/offers/federated/all` aggregates offers from favorite servers
- Users without favorites → local offers only

---

#### 3.2.12 Collection `Counters`

**Description**: Auto-increment management (MongoDB workaround).

```javascript
{
  _id: "offerId",                   // Counter type
  seq: 12345                        // Current value
}
```

**Used for**: 
- `offerId` (Offer.id)
- `assetId` (Asset.id)
- `newsId` (News._id)

---

### 3.3 Relationship Diagram

```
user (userName) ──┬─> prosumer (id)
                  │
                  ├─> Asset (owner)
                  │
                  ├─> Offer (offerer)
                  │
                  ├─> Rating (userId)
                  │
                  ├─> RecommendationStats (name)
                  │
                  └─> FavoriteServers (id)

AssetType (name) ──> Asset (assetType)

Asset (id) ──> Offer (assetId)

prosumer.blockedOffers ──> Offers (multi-server)

FavoriteServers.servers[] ──> RegisteredServers (external URLs)
```

**Key relationships:**
1. `user.userName` → `prosumer.id` (1:1) - Each user has one prosumer profile
2. `user.userName` → `Asset.owner` (1:N) - One user can own multiple assets
3. `user.userName` → `Offer.offerer` (1:N) - One user can create multiple offers
4. `AssetType.name` → `Asset.assetType` (1:N) - One asset type can be used by multiple assets
5. `Asset.id` → `Offer.assetId` (1:N) - One asset can have multiple offers
6. `prosumer.blockedOffers` → `Offer.id` (N:N) - Multi-server offer blocking
7. `FavoriteServers.servers[]` → External server URLs (N:N) - Federated aggregation

---

## 4. REST API - Endpoints

### 4.1 URL Structure

**Base URL**: `https://resilink-dp.org/v2`  
**Documentation**: `https://resilink-dp.org/api-docs` (Swagger UI)

### 4.2 Authentication

**Header**: `Authorization: Bearer <JWT_TOKEN>`

**Types**:
- `auth({ required: true })` - JWT required
- `auth({ required: false })` - JWT optional (public access + personalization if authenticated)
- `networkKeyAuth` - RESILINK network key (`X-Resilink-Network-Key`)

### 4.3 Endpoints by Resource

#### 4.3.1 Users (`/users`)

|  Method  | Endpoint | Auth (Token mandatory) | Description |
|----------|----------|------|-------------|
| POST | `/users/auth/sign_in` | ❌ | Authentication (returns JWT) |
| POST | `/users` | ✅ | Create user account |
| GET | `/users` | 🔧 TOKEN_REQUIRED | List all users |
| GET | `/users/:userId` | 🔧 TOKEN_REQUIRED | User details |
| GET | `/users/getUserByEmail/:userEmail` | 🔧 TOKEN_REQUIRED | User details by email |
| GET | `/users/getUserByUserName/:userName` | 🔧 TOKEN_REQUIRED | User details by username |
| PUT | `/users/:userId` | ✅ | Update user profile |
| DELETE | `/users/:userId` | ✅ | Delete account profile|
| DELETE | `/users/allData/:userName` | ✅ | Delete account logs + profile|
| DELETE | `/users/logs/:userName` | ✅ | Delete account logs|

**🔧 TOKEN_REQUIRED**: Authentication dependent on the environment variable `TOKEN_REQUIRED` in `.env`

**Examples:**

```bash
# Login
POST /v2/users/auth/sign_in
{
  "userName": "john_doe",
  "password": "SecurePass123!"
}
→ Response: { "accessToken": "eyJhbGc...", "userName": "john_doe", ... }
```

---

#### 4.3.2 Prosumers (`/prosumers`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/prosumers/new` | ✅ | Create user and prosumer profile |
| POST | `/prosumers` | ✅ | Create prosumer profile |
| POST | `/prosumers/:id/blocked-offers/server` | ✅ | Block offer by server |
| GET | `/prosumers/all` | 🔧 TOKEN_REQUIRED | List all prosumers |
| GET | `/prosumers/:id` | 🔧 TOKEN_REQUIRED | Prosumer details |
| GET | `/prosumers/:id/blocked-offers/server/:serverName` | ✅ | Blocked offers from a server |
| GET | `/prosumers/:id/blocked-offers/all` | ✅ | All blocked offers |
| PUT | `/prosumers/:prosumerId` | ✅ | Update personal data |
| PUT | `/prosumers/:id/addBookmark` | ✅ | Add news to favorites |
| PUT | `/prosumers/:id/addBlockedOffer` | ✅ | Block offer (legacy array) |
| PATCH | `/prosumers/:id/balance` | ✅ | Adjust balance |
| PATCH | `/prosumers/:id/activityDomain` | ✅ | Update activityDomain |
| PATCH | `/prosumers/:id/sharingAccount` | ✅ | Adjust sharing account |
| DELETE | `/prosumers/delBookmark/id` | ✅ | Remove news from favorites |
| DELETE | `/prosumers/delBlockedOffer/id` | ✅ | Unblock offer (legacy) |
| DELETE | `/prosumers/:id/blocked-offers/server/:serverName/:offerId` | ✅ | Unblock offer by server |
| DELETE | `/prosumers/:id` | ✅ | Delete prosumer |

**🔧 TOKEN_REQUIRED**: Authentication dependent on the environment variable `TOKEN_REQUIRED` in `.env`

**Examples:**

```bash
# Block offer from external server
POST /v2/prosumers/john_doe/blocked-offers/server
{
  "serverName": "https://resilink-toulouse.org",
  "offerId": "789"
}

# View all blocked offers
GET /v2/prosumers/john_doe/blocked-offers/all
→ Response: {
  "blockedOffers": \{
    "actualServer": ["123", "456"\],
    "https://resilink-toulouse.org": ["789"]
  }
}
```

---

#### 4.3.3 Offers (`/offers`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/offers` | ✅ | Create new offer |
| POST | `/offers/all/resilink/filtered` | 🔧 TOKEN_REQUIRED | Get filtered offers |
| POST | `/offers/createOfferAsset` | ✅ | Create offer with asset |
| GET | `/offers/local/all` | ❌ | Local server offers only (in map format)|
| GET | `/offers/federated/all` | ✅ | Local + favorite servers offers |
| GET | `/offers/all/Mapped` | 🔧 TOKEN_REQUIRED | All offers (federated alias - DEPRECATED) |
| GET | `/offers/suggested` | ✅ | Suggested offers for user |
| GET | `/offers/LimitedOffer` | ✅ | Limited offers |
| GET | `/offers/owner/blockedOffer/:id` | ✅ | Blocked offers for user |
| GET | `/offers/owner` | ✅ | Owner's offers |
| GET | `/offers/owner/purchase` | ✅ | Owner's purchase offers |
| GET | `/offers/all` | 🔧 TOKEN_REQUIRED | All offers (list format)|
| GET | `/offers/:id` | 🔧 TOKEN_REQUIRED | Offer details |
| PUT | `/offers/:id` | ✅ | Update offer |
| PUT | `/offers/:id/updateOfferAsset` | ✅ | Update offer and asset |
| DELETE | `/offers/:id` | ✅ | Delete offer |

**🔧 TOKEN_REQUIRED**: Authentication dependent on the environment variable `TOKEN_REQUIRED` in `.env`

**Automatic filtering:**
- Expired offers (`validityLimit < now`)
- Depleted offers (`remainingQuantity <= 0`)
- Blocked offers by user (`prosumer.blockedOffers`)

**Examples:**

```bash
# Create offer (Energy example)
POST /v2/offers
Authorization: Bearer <token>
{
  "assetId": 789,
  "transactionType": "sale/purchase"
  "beginTimeSlot": "2026-01-01T00:00:00.417Z",
  "endTimeSlot": "2026-12-01T00:00:00.417Z",
  "validityLimit": "2026-12-01T00:00:00.417Z",
  "price": 150.00,
  "deposit": 0,
  "cancellationFee": 0,
  "paymentMethod": "total",
  "paymentFrequency": 0,
  "country": "France",
  "offeredQuantity": 1000,
  "rentInformation": \{
    "delayMargin": 0,
    "lateRestitutionPenalty": 0,
    "deteriorationPenalty": 0,
    "nonRestitutionPenalty": 0,
  },
}

# Local offers only
GET /v2/offers/local/all
→ Response: {
  "actualServer": {
    "123": { id: 123, price: 150, ... },
    "456": { id: 456, price: 200, ... }
  }
}

# Federated offers (local + user favorites)
GET /v2/offers/federated/all
Authorization: Bearer <token>
→ Response: \{
  "actualServer": { "123": {...}, "456": {...} },
  "https://resilink-toulouse.org": { "789": {...} },
  "https://resilink-bordeaux.org": { "101": {...} }
}
```

---

#### 4.3.4 Assets (`/assets`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/assets` | ✅ | Create asset |
| POST | `/assets/img` | ✅ | Add images to asset |
| GET | `/assets/owner` | ✅ | Get assets by owner |
| GET | `/assets/all` | 🔧 TOKEN_REQUIRED | List all assets |
| GET | `/assets/:id` | 🔧 TOKEN_REQUIRED | Asset details |
| GET | `/asset/allAssetMapped` | 🔧 TOKEN_REQUIRED | All assets mapped format |
| PUT | `/assets/:id` | ✅ | Update asset |
| DELETE | `/assets/:id` | ✅ | Delete asset |
| DELETE | `/assets/img/:id` | ✅ | Delete asset images |

**🔧 TOKEN_REQUIRED**: Authentication dependent on the environment variable `TOKEN_REQUIRED` in `.env`

---

#### 4.3.5 AssetTypes (`/assetTypes`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/assetTypes` | ✅ | Create asset type |
| GET | `/assetTypes/all` | 🔧 TOKEN_REQUIRED | List all types |
| GET | `/assetTypes/:id` | 🔧 TOKEN_REQUIRED | Type details |
| GET | `/assetTypes/all/mapFormat` | 🔧 TOKEN_REQUIRED | All types mapped format |
| PUT | `/assetTypes/:id` | ✅ | Update type |
| DELETE | `/assetTypes/:id` | ✅ | Delete type |

**🔧 TOKEN_REQUIRED**: Authentication dependent on the environment variable `TOKEN_REQUIRED` in `.env`

---

#### 4.3.6 Contracts (`/contracts`)

**⚠️ NOT IMPLEMENTED in MainWithoutODEP**: These endpoints exist for API completeness but are **not functional** in this version. Transaction execution is **externalized** - users contact each other directly using prosumer contact information.

**Rationale**: This version focuses on **offer discovery and contact exchange**. The platform provides contact details (email, phone) so prosumers can negotiate and finalize transactions independently.

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/contracts` | ✅ | ⚠️ Not implemented |
| GET | `/contracts/all` | ✅ | ⚠️ Not implemented |
| GET | `/contracts/owner/ongoing/:id` | ✅ | ⚠️ Not implemented |
| GET | `/contracts/owner/:id` | ✅ | ⚠️ Not implemented |
| GET | `/contracts/:id` | ✅ | ⚠️ Not implemented |
| PATCH | `/contracts/immaterialContract/:id` | ✅ | ⚠️ Not implemented |
| PATCH | `/contracts/purchaseMaterialContract/:id` | ✅ | ⚠️ Not implemented |
| PATCH | `/contracts/rentMaterialContract/:id` | ✅ | ⚠️ Not implemented |
| PATCH | `/contracts/cancelContract/:id` | ✅ | ⚠️ Not implemented |

**For ODEP-integrated contract management**, see the `main` branch.

---

#### 4.3.7 News (`/news`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/news` | ✅ | Publish news |
| POST | `/news/:id` | ✅ | Create personal news |
| GET | `/news/all` | 🔧 TOKEN_REQUIRED | List all news |
| GET | `/news/country` | 🔧 TOKEN_REQUIRED | News from country |
| GET | `/news/ids` | 🔧 TOKEN_REQUIRED | News from id list |
| GET | `/news/owner/:id` | ✅ | News from owner |
| GET | `/news/countryOwner` | ✅ | News from country without user news |
| PUT | `/news/:id` | ✅ | Update news |
| DELETE | `/news/:id` | ✅ | Delete news |

**🔧 TOKEN_REQUIRED**: Authentification dépendante de la variable d'environnement `TOKEN_REQUIRED` dans `.env`

---

#### 4.3.8 Ratings (`/rating`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/rating` | ✅ | Create/initialize user rating |
| GET | `/rating/all` | 🔧 TOKEN_REQUIRED | List all ratings |
| GET | `/rating/average` | 🔧 TOKEN_REQUIRED | Average ratings |
| GET | `/rating/:userId` | 🔧 TOKEN_REQUIRED | User ratings |
| PUT | `/rating/:userId` | ✅ | Update/modify rating |
| DELETE | `/rating/:userId` | ✅ | Delete rating |

**🔧 TOKEN_REQUIRED**: Authentification dépendante de la variable d'environnement `TOKEN_REQUIRED` dans `.env`

**Example:**

```bash
PUT /v2/rating/john_doe
{
  "userId": "alice_smith",
  "rating": 4.5
}
```

---

#### 4.3.9 RecommendationStats (`/recommendationstats`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/recommendationstats` | ✅ | Initialize user stats |
| GET | `/recommendationstats` | ✅ | List all recommendation stats |
| GET | `/recommendationstats/:name` | ✅ | User stats |
| PUT | `/recommendationstats/:name` | ✅ | Update recommendation stats |
| PATCH | `/recommendationstats/:name/increment/:assetType` | ✅ | Increment assetType count |
| DELETE | `/recommendationstats/:name` | ✅ | Delete recommendation stats |

**Usage**: Automatically called when viewing offer

---

#### 4.3.10 RegisteredServers (`/registeredservers`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/registeredservers` | 🔑 Network Key | Register server (requires X-Resilink-Network-Key) |
| POST | `/registeredservers/global` | 🔑 Network Key | Register on global/main server (requires X-Resilink-Network-Key) |
| GET | `/registeredservers` | 🔧 TOKEN_REQUIRED | List registered servers |
| GET | `/registeredservers/global` | 🔧 TOKEN_REQUIRED | List global registered servers |
| GET | `/registeredservers/:serverName` | 🔧 TOKEN_REQUIRED | Server details |
| PUT | `/registeredservers/:serverName` | ✅ | Update server |
| DELETE | `/registeredservers/:serverName` | ✅ | Delete server |

**Auth**: 
- 🔑 **Network Key**: Authentification via header `X-Resilink-Network-Key` (variable d'environnement `RESILINK_NETWORK_KEY`)
- 🔧 **TOKEN_REQUIRED**: Authentification dépendante de la variable d'environnement `TOKEN_REQUIRED` dans `.env`
- ✅ **JWT User**: Authentification JWT obligatoire

---

#### 4.3.11 FavoriteServers (`/favoriteServers`)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/favoriteServers` | ✅ | Initialize user favorites |
| POST | `/favoriteServers/:username/add/:serverName` | ✅ | Add favorite server |
| GET | `/favoriteServers` | ✅ | List all favorite servers |
| GET | `/favoriteServers/:username` | ✅ | User favorites |
| PUT | `/favoriteServers/:username` | ✅ | Update favorite servers |
| DELETE | `/favoriteServers/:username/remove/:serverName` | ✅ | Remove favorite server |
| DELETE | `/favoriteServers/:username` | ✅ | Delete all user favorites |

**Example:**

```bash

# View favorites
GET /v2/favoriteServers/john_doe
→ Response: \{
  "id": "john_doe",
  "servers": [
    "https://resilink-toulouse.org",
    "https://resilink-bordeaux.org"
  ]
}
```

---

#### 4.3.12 Regulators (`/ODEP/regulators`)

**Note**: Regulatory entities (detailed out of current scope - ODEP feature)
**⚠️ NOT IMPLEMENTED in MainWithoutODEP**: These endpoints exist but are **not functional** in this version. The Request feature (posting demand/needs) is out of scope.

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/ODEP/regulators` | ✅ | Create regulator | ⚠️ Not implemented |
| GET | `/ODEP/regulators/all` | ✅ | List all regulators | ⚠️ Not implemented |
| GET | `/ODEP/regulators/:id` | ✅ | Regulator details | ⚠️ Not implemented |
| PATCH | `/ODEP/regulators/:id` | ✅ | Update regulator | ⚠️ Not implemented |
| DELETE | `/ODEP/regulators/:id` | ✅ | Delete regulator | ⚠️ Not implemented |

---

#### 4.3.13 Requests (`/ODEP/requests`)

**⚠️ NOT IMPLEMENTED in MainWithoutODEP**: These endpoints exist but are **not functional** in this version. The Request feature (posting demand/needs) is out of scope.

**Current workflow**: Users can only:
1. Browse existing offers (local + federated)
2. View prosumer contact information
3. Contact the prosumer directly (external to platform)

| Method | Endpoint | Auth (Token mandatory) | Description |
|---------|----------|------|-------------|
| POST | `/ODEP/requests` | ✅ | ⚠️ Not implemented |
| GET | `/ODEP/requests/all` | ✅ | ⚠️ Not implemented |
| GET | `/ODEP/requests/:id` | ✅ | ⚠️ Not implemented |
| PUT | `/ODEP/requests/:id` | ✅ | ⚠️ Not implemented |
| DELETE | `/ODEP/requests/:id` | ✅ | ⚠️ Not implemented |

**Use case**: If implemented, Requests would allow users to post "I'm looking for X" instead of just browsing existing offers. Not available in MainWithoutODEP.

---

### 4.4 HTTP Response Codes

| Code | Meaning | Usage |
|------|---------------|-------|
| 200 | OK | Operation success |
| 400 | Bad Request | Invalid data |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Server error |

---

## 5. Business Features

### 5.1 Offer Management

#### 5.1.1 Offer Publication

**Flow:**
1. Prosumer creates Asset (if new)
2. Prosumer publishes Offer linked to Asset
3. System generates auto-incremented `offerId`
4. `remainingQuantity` initialized to `offeredQuantity`
5. `publicationDate` auto-generated
6. Offer immediately visible in `/offers/local/all`

**Business Rules:**
- `assetId` must exist
- Asset `owner` must be the `offerer`
- Future `validityLimit` required
- `price > 0`

#### 5.1.2 Offer Discovery (Core Feature)

**This is the primary use case in MainWithoutODEP**: Users discover available offers and obtain prosumer contact information for direct negotiation.

**Modes:**

| Mode | Endpoint | Description | Use Case |
|------|----------|-------------|----------|
| **Local** | `/offers/local/all` | Current server only | Performance, local regulatory compliance |
| **Federated** | `/offers/federated/all` | Local + user favorite servers | Extended marketplace, inter-regional discovery |

**Smart Filtering:**
- ❌ Expired offers (`validityLimit < now`)
- ❌ Depleted offers (`remainingQuantity <= 0` for measurable AssetType)
- ❌ Blocked offers by user (via `prosumer.blockedOffers`)

**Offer Response includes contact details:**
```json
{
  "offerId": 123,
  "assetType": "Laptop",
  "price": 300.00,
  "offerer": "john_doe",
  "phoneNumber": "+33612345678",
  "description": "HP 15, i7, 16GB RAM...",
  ...
}
```

**Next steps after discovery**: User contacts prosumer directly via email/phone to finalize transaction (external to platform).

**Performance:**
- Local offers: direct MongoDB read (~10-50ms)
- Federated offers: parallel HTTP aggregation (~200-800ms depending on server count)

#### 5.1.3 Offer Blocking (Multi-Server)

**New system v2.1:**

```javascript
// blockedOffers structure
prosumer.blockedOffers = {
  "actualServer": [123, 456],           // Local
  "https://resilink-toulouse.org": [789], // Server1
  "https://resilink-bordeaux.org": [101]  // Server2
}
```

**API:**
- `POST /prosumers/:id/blocked-offers/server` - Block
- `GET /prosumers/:id/blocked-offers/all` - View all
- `DELETE /prosumers/:id/blocked-offers/server/:serverName/:offerId` - Unblock

**Use Case:** User views federated offers, blocks irrelevant offers from each server independently.

#### 5.1.4 Personalized Recommendations

**System:**
1. Viewing offer → Increments `RecommendationStats[user].assetType[type]`
2. Frontend can sort offers by popularity or user affinity

**CRON Job:**
- Daily midnight: aggregates `RecommendationStats` → `GlobalRecommendationStats`

---

### 5.2 Multi-Server Federation

#### 5.2.1 Federal Architecture

```
                    ┌────────────────────┐
                    │  Central Server    │
                    │     (Paris)        │
                    └────────┬───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌────▼──────┐
    │  Server A │      │  Server B │      │  Server C │
    │   (Pau)   │      │ (Toulouse)│      │ (Bordeaux)│
    └───────────┘      └───────────┘      └───────────┘
          ▲
          │ User adds to FavoriteServers
          │
    ┌─────┴──────┐
    │   Client   │
    │  (Mobile)  │
    └────────────┘
```

#### 5.2.2 Server Registration

**Local:**
```bash
POST /v2/registeredservers
Headers:
  X-Resilink-Network-Key: <NETWORK_KEY>
{
  "serverName": "Resilink Pau",
  "serverUrl": "https://resilink-pau.org",
}
```

**Global (Central Server):**
```bash
POST https://central.resilink.org/v2/registeredservers
Headers:
  X-Resilink-Network-Key: <NETWORK_KEY>
Body: { ... }
```

#### 5.2.3 Aggregation Federated Offers

**Algorithm:**

```javascript
async function getFederatedOffersCustom(user) {
  // 1. Local offers
  const localOffers = await getLocalOffersOnlyCustom(user);
  
  // 2. If user authenticated → load favorites
  if (user) {
    const favorites = await FavoriteServersDB.getFavoriteServers(user.username);
    
    // 3. For each favorite server
    for (serverUrl of favorites.servers) {
      // External fetch
      const externalOffers = await fetch(`${serverUrl}/v2/offers/local/all`);
      
      // 4. Filter blocked offers for this server
      const blockedOffers = user.blockedOffers[serverUrl] || [];
      const filtered = filterBlocked(externalOffers, blockedOffers);
      
      // 5. Add to result
      result[serverUrl] = filtered;
    }
  }
  
  return result;
}
```

**Error handling:**
- Serveur externe injoignable → skip silencieux (log warning)
- Timeout 5s → skip
- Format incompatible → skip

---

### 5.3 User Management

#### 5.3.1 Registration

**Flow:**
1. `POST /users` with `userName`, `email`, `password`, `phoneNumber`, `roleOfUser`, etc.
2. **Validation:**
   - `userName` unique (MongoDB unique index)
   - `email` valid format (must contain `@`)
   - `roleOfUser` must be `'prosumer'` or `'regulator'`
   - `userName` cannot be `'anonymous'` or `'token not required'`
3. **Encryption / Hashing:**
   - `email` → AES-256-CBC
   - `phoneNumber` → AES-256-CBC
   - `password` → bcrypt hash (salt rounds: 10)
4. **Insertion** MongoDB `user` collection

**Note:** The prosumer profile is NOT automatically created by `POST /users`. Use `POST /prosumers/new` to create both user and prosumer in one call, or `POST /prosumers` to create a prosumer for an existing user.

#### 5.3.2 Authentication

**Flow:**
1. `POST /users/auth/sign_in` with `userName`, `password`
2. **Verification** password via `bcrypt.compare()` against stored hash
3. **JWT Generation:**
   ```javascript
   jwt.sign(
     { userId: userName },
     TOKEN_KEY,
     { expiresIn: '2h' }
   )
   ```
4. **Storage** JWT in `user.accessToken` field and in-memory `userTokenStore` (Map supporting multi-device sessions)
5. **Return** token + user data (decrypted phoneNumber if available)

#### 5.3.3 Authorization

**Middleware `optionalAuth.js`:**
```javascript
module.exports = function auth({ required = true } = {}) {
  return (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!required) {
      if (!authHeader) {
        req.user = null; // Anonymous access
      } else {
        if (Utils.validityToken(authHeader)) {
          req.user = {
            username: Utils.getUserIdFromToken(authHeader.replace(/^Bearer\s+/i, "")),
            token: authHeader
          };
        } else {
          req.user = null;
        }
      }
    } else {
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorize: no token provided" });
      }
      if (!Utils.validityToken(authHeader)) {
        return res.status(401).send({ message: "Unauthorize: no user associated with the token" });
      }
      req.user = {
        username: Utils.getUserIdFromToken(authHeader.replace(/^Bearer\s+/i, "")),
        token: authHeader
      };
    }
    next();
  };
};
```

**Token validation** (`Utils.validityToken`) performs three checks:
1. JWT signature verification via `jwt.verify()`
2. Token expiration check
3. Active session verification in `userTokenStore` (in-memory Map)

---

### 5.4 Transaction Management (MainWithoutODEP)

**⚠️ NOT IMPLEMENTED**: Contract management and request features are **not available** in the MainWithoutODEP branch.

**Current workflow (Contact Exchange Model):**

1. **User browses offers** (local or federated)
   ```bash
   GET /v2/offers/federated/all
   ```

2. **User views offer details** including prosumer information:
   ```json
   {
     "offerId": 123,
     "offerer": "john_doe",
     "price": 300.00,
     "description": "Laptop HP 15...",
     "phoneNumber": "+33612345678",
     ...
   }
   ```

3. **User contacts prosumer directly** (external to platform)
   - Email, phone, or other means
   - Transaction negotiation happens outside RESILINK
   - Payment, delivery, contracts handled independently


**Why externalized?**
- Original use case: Personal mobile app for RESILINK project
- Focus on **discovery** rather than transaction execution
- Legal/payment complexity avoided
- Flexibility for prosumers to negotiate terms

**For contract management with blockchain**: See `main` branch (ODEP integration).

## 6. Security and Authentication

### 6.1 Data Encryption

**Algorithm**: AES-256-CBC

**File**: `database/CryptoDB.js`

```javascript
// Encryption
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY, 'hex'), iv);
encrypted = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
return iv.toString('hex') + ':' + encrypted;

// Decryption
const [ivHex, encryptedText] = ciphertext.split(':');
const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, Buffer.from(ivHex, 'hex'));
decrypted = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
```

**Encrypted data (AES-256-CBC):**
- `user.phoneNumber`
- `user.email`

**Hashed data (bcrypt):**
- `user.password`

**Key**: `ENCRYPTION_KEY` (64 hex chars) in `.env`

---

### 6.2 JWT Authentication

**Library**: `jsonwebtoken`

**Configuration:**
- **Secret**: `TOKEN_KEY` (64 hex chars)
- **Expiration**: 2h
- **Payload**: `{ userId, iat, exp }`

**HTTP Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verification**: Middleware `middlewares/optionalAuth.js`

**Session management**: In-memory `userTokenStore` (Map) supporting multi-device sessions with automatic expired token cleanup (2h TTL).

---

### 6.3 Federated Network Security

**RESILINK network key:**
- Header: `X-Resilink-Network-Key`
- Value: `RESILINK_NETWORK_KEY` (env var)
- Usage: Server-to-server communication (main server registration)

**Middleware**: `middlewares/serverAuth.js#networkKeyAuth`

**Validation:**
```javascript
if (req.header('X-Resilink-Network-Key') !== RESILINK_NETWORK_KEY) {
  return res.status(403).json({ message: 'Invalid network key' });
}
```

---

### 6.4 Database Protection

**MongoDB Atlas:**
- **IP Whitelist**: Atlas configuration
- **Connection String**: Encrypted in `.env`
- **Database User**: Limited read/write permissions

**Unique Indexes:**
- `user.userName`
- `prosumer.id`
- `Offer.id`
- `Asset.id`
- `AssetType.name`
- `RegisteredServers.serverName`
- `RegisteredServers.serverUrl`

**Prevention:**
- Duplicate key errors (code 11000) caught
- Input validation at Service layer
- Parameterized queries (injection protection)

---

### 6.5 CORS

**Configuration**: `cors` middleware enabled

```javascript
app.use(cors()); // Allow all origins (prod: restrict)
```

**Production**: Restrict allowed origins:
```javascript
app.use(cors({
  origin: ['https://resilink-mobile.app'],
  credentials: true
}));
```

---

## 7. Multi-Server Federation

### 7.1 Decentralized Network Architecture

**Principle**: Each RESILINK server is autonomous and can:
- **Operate independently** with local offers
- **Create a network** by becoming the main server (registry)
- **Join an existing network** by registering with a main server
- **Aggregate offers** from other network servers directly

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| **Main Server** | A full RESILINK server that also acts as a **showcase (vitrine)** for the network: it stores the list of registered servers and allows users to register/browse all servers in the network. Defined by `CENTRAL_SERVER_URL` in `.env` |
| **Member Server** | Server that joined a network by registering itself with the main server using `RESILINK_NETWORK_KEY` |
| **Standalone Server** | Server operating without joining any network (CENTRAL_SERVER_URL = its own URL) |
| **Favorite Servers** | User-selected servers from which to aggregate offers |
| **Domain Specialization** | Each server can specialize in specific domains (energy-only, electronics-only, mixed marketplace, etc.) by customizing AssetTypes |

**Domain Flexibility Examples:**
- **Energy Network**: All servers specialize in energy resources (solar panels, batteries, renewable energy)
- **Electronics Network**: Servers focused on tech products (laptops, smartphones, components)
- **Cross-Domain Network**: Mixed servers (energy + electronics + household products)
- **Geographic Specialization**: Regional servers handling multiple domains for their locale

**Important**: The main server is a **full RESILINK server** (with its own offers, users, etc.) that additionally serves as a **showcase (vitrine)** for the network — it allows servers to register and users to browse all available servers. However, offer aggregation is performed by each individual server based on the user's favorite server list, not centrally by the main server.

**Architecture benefits:**
- ✅ **Resilience**: Server failure doesn't affect others
- ✅ **Scalability**: Add servers without architectural refactoring
- ✅ **Compliance**: Data hosted locally (GDPR-friendly)
- ✅ **Performance**: Local caching possible
- ✅ **Autonomy**: Each server controls its own data

---

### 7.2 Main Server (Network Showcase)

#### 7.2.1 Main Server Role

The main server is a **full RESILINK server** that additionally acts as a **showcase (vitrine)** for the network:
- **Operates as a complete server** with its own offers, users, assets, and all standard features
- Stores the list of registered servers in the network
- Provides `/registeredservers` API for server registration and discovery
- Validates network key (`RESILINK_NETWORK_KEY`) for server registration
- Allows users to browse all available servers and add them to favorites

**Note**: Offer aggregation is not centralized on the main server — each server performs its own aggregation based on the user's favorite server list.

#### 7.2.2 Configuration

**Scenario 1: This server IS the main server**
```bash
# .env configuration
CENTRAL_SERVER_URL=https://resilink-pau.org  # Its own URL
RESILINK_NETWORK_KEY=your_unique_network_key_here
```

When `CENTRAL_SERVER_URL` equals the server's own URL, it becomes the **main server** (showcase) of the network, while still operating as a regular RESILINK server.

**Scenario 2: This server JOINS an existing network**
```bash
# .env configuration
CENTRAL_SERVER_URL=https://main-server.resilink.org  # Main server URL
RESILINK_NETWORK_KEY=main_server_provided_key        # Key provided by main server
```

When `CENTRAL_SERVER_URL` points to another server, this server will **join that network** by registering itself.

#### 7.2.3 Server Registration Flow

```
┌─────────────────┐              ┌──────────────────┐
│  Member Server  │              │   Main Server    │
│   (Toulouse)    │              │     (Pau)        │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         │  1. POST /registeredservers    │
         │     Headers:                   │
         │       X-Resilink-Network-Key   │
         │     Body:                      │
         │       { serverName,            │
         │         serverUrl,             │
         │         capabilities }         │
         ├───────────────────────────────>│
         │                                │
         │                        2. Validate Key
         │                        3. Store in MongoDB
         │                           RegisteredServers
         │                                │
         │ 4. 200 OK                      │
         │    { message: "Registered" }   │
         │<───────────────────────────────┤
         │                                │
```

**API Endpoint:**
```bash
POST https://main-server.resilink.org/v2/registeredservers
Headers:
  X-Resilink-Network-Key: <NETWORK_KEY>
  Content-Type: application/json
Body:
  {
    "serverName": "Resilink Toulouse",
    "serverUrl": "https://resilink-toulouse.org",
  }

Response: 200 OK
{
  "message": "RegisteredServer created: Resilink Toulouse"
}
```

#### 7.2.4 Server Discovery

Any server (main or member) can query the network registry:

```bash
GET https://any-server.resilink.org/v2/registeredservers

Response: 200 OK
[
  {
    "serverName": "Resilink Pau",
    "serverUrl": "https://resilink-pau.org",
    "status": "active",
    "capabilities": ["offers", "news"]
  },
  {
    "serverName": "Resilink Toulouse",
    "serverUrl": "https://resilink-toulouse.org",
    "status": "active",
    "capabilities": ["offers"]
  },
  {
    "serverName": "Resilink Bordeaux",
    "serverUrl": "https://resilink-bordeaux.org",
    "status": "active",
    "capabilities": ["offers"]
  }
]
```

**Note**: In MainWithoutODEP, servers typically only advertise `["offers"]` capability since contracts/requests are not implemented.

---

### 7.3 User Favorite Servers

#### 7.3.1 Concept

Each user can **select favorite servers** from the network to aggregate their offers. This provides:
- **Personalization**: User chooses which servers to include
- **Performance**: Only selected servers are queried
- **Geographic preferences**: Users can favor local/regional servers

#### 7.3.2 Workflow

```
┌────────┐         ┌─────────────┐          ┌─────────────┐
│ Client │         │  Server A   │          │ Main Server │
│ (App)  │         │ (Connected) │          │  (Registry) │
└───┬────┘         └──────┬──────┘          └──────┬──────┘
    │                     │                        │
    │  1. GET /registeredservers                   │
    ├────────────────────>│                        │
    │                     │ 2. Forward (optional)  │
    │                     ├───────────────────────>│
    │                     │                        │
    │                     │ 3. Server list         │
    │                     │<───────────────────────┤
    │ 4. Server list      │                        │
    │<────────────────────┤                        │
    │                     │                        │
    │ 5. User selects:    │                        │
    │    - Main Server    │                        │
    │    - Server B       │                        │
    │                     │                        │
    │ 6. POST /favoriteServers/john_doe/add/serverName │
    ├────────────────────>│                        │
    │                     │                        │
    │ (Repeat for each favorite)                   │
    │                     │                        │
```

#### 7.3.3 API Examples

**Add favorite server:**
```bash
POST /v2/favoriteServers/john_doe/add/resilink-toulouse
Authorization: Bearer <JWT>

Response: 200 OK
{
  "message": "Server resilink-toulouse added successfully"
}
```

**View user's favorites:**
```bash
GET /v2/favoriteservers/john_doe
Authorization: Bearer <JWT>

Response: 200 OK
{
  "id": "john_doe",
  "servers": [
    "https://resilink-pau.org",
    "https://resilink-toulouse.org",
    "https://resilink-bordeaux.org"
  ],
  "createdAt": "2026-01-15T10:00:00Z",
  "lastUpdated": "2026-02-10T11:00:00Z"
}
```

---

### 7.4 Federated Offers Aggregation

#### 7.4.1 Who Aggregates?

**Important**: The **server receiving the user request** performs the aggregation (this can be the main server or any member server):

```
Client → Server A (Toulouse)
         ├─ Fetch local offers (Server A database)
         ├─ Get user's favorite servers
         ├─ Fetch https://resilink-pau.org/v2/offers/all/Mapped
         ├─ Fetch https://resilink-bordeaux.org/v2/offers/all/Mapped
         └─ Aggregate all results and return to client
```

Offer aggregation is **not centralized** — each server (including the main server) aggregates offers based on its own user's favorite server list. The main server's additional role is to serve as a **showcase** for server registration and discovery.

#### 7.4.2 Aggregation Algorithm

**Endpoint**: `GET /v2/offers/federated/all`

**Implemented in**: `OfferService.js#getFederatedOffersCustom()`

```javascript
async function getFederatedOffersCustom(user) {
  // 1. Get local offers (already filtered by actualServer blocked offers)
  const [localOffers, localCode] = await getLocalOffersOnlyCustom(user);

  if (localCode !== 200) {
    return [localOffers, localCode];
  }

  const resultOffers = localOffers; // { actualServer: {...} }

  // 2. If user authenticated → aggregate favorite servers
  if (user) {
    // Get blockedOffers map for filtering external servers
    const blockedOffersMap = await PosumerDB.getProsumerBlockedOffers(username) || {};
    const isLegacyFormat = Array.isArray(blockedOffersMap);

    const favorites = await FavoriteServersDB.getFavoriteServers(username);

    // 3. Parallel fetch from all favorite servers (Promise.allSettled)
    const results = await Promise.allSettled(
      favorites.servers.map(async (serverUrl) => {
        const externalOffers = await getOffersFromFavoriteServer(
          serverUrl, "/v2/offers/local/all"
        );
        return { serverUrl, externalOffers };
      })
    );

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value.externalOffers) continue;

      const { serverUrl, externalOffers } = result.value;

      // 4. Filter blocked offers for this specific server (new Map format only)
      if (!isLegacyFormat && blockedOffersMap[serverUrl]) {
        const blockedSet = new Set(
          blockedOffersMap[serverUrl].map(id => id.toString())
        );
        const filteredOffers = {};
        for (const offerId in externalOffers) {
          if (!blockedSet.has(offerId.toString())) {
            filteredOffers[offerId] = externalOffers[offerId];
          }
        }
        resultOffers[serverUrl] = filteredOffers;
      } else {
        resultOffers[serverUrl] = externalOffers;
      }
    }
  }

  return [resultOffers, 200];
}
```

**Note:** External server fetching uses **`Promise.allSettled`** for parallel execution. Each server is fetched simultaneously via `getOffersFromFavoriteServer()` which authenticates with a public account (`POST /v2/users/auth/sign_in`), then retrieves offers. `Promise.allSettled` guarantees that **one server's failure never blocks others** — rejected promises are simply skipped.

#### 7.4.3 Response Format

```json
{
  "actualServer": {
    "123": {
      "id": 123,
      "offerer": "john_doe",
      "price": 150.00,
      "assetType": "Solar Panel",
      ...
    },
    "456": { ... }
  },
  "https://resilink-pau.org": {
    "789": {
      "id": 789,
      "offerer": "alice_smith",
      "price": 200.00,
      ...
    }
  },
  "https://resilink-bordeaux.org": {
    "101": { ... },
    "202": { ... }
  }
}
```

#### 7.4.4 Error Handling

| Error | Behavior |
|-------|----------|
| Timeout (> 5s) | Skip server, log warning, continue |
| Network error | Skip server, log warning, continue |
| HTTP 4xx/5xx | Skip server, log warning, continue |
| Invalid JSON | Skip server, log warning, continue |
| Main server down | Only local offers returned |
| All favorites down | Only local offers returned |

**Critical**: One server's failure does NOT block the entire request. The client always receives at least local offers.

#### 7.4.5 Performance Optimization

**Parallel fetching with `Promise.allSettled`:**
```javascript
const results = await Promise.allSettled(
  favorites.servers.map(async (serverUrl) => {
    const externalOffers = await getOffersFromFavoriteServer(serverUrl, "/v2/offers/all/Mapped");
    return { serverUrl, externalOffers };
  })
);
// Each result: { status: 'fulfilled', value } or { status: 'rejected', reason }
// Rejected/null results are silently skipped
```

**Why `Promise.allSettled` over sequential:**
- **Performance**: N servers fetched simultaneously → total time = max(latency) instead of sum(latency)
- **Safety**: Unlike `Promise.all`, `Promise.allSettled` **never rejects** — each failure is isolated
- **Independence**: Requests share no state; each authenticates independently

**Recommended client-side caching:**
- TTL: 60 seconds
- Cache key: `user_id + favorite_servers_hash`
- Invalidate on favorite servers change

**Expected response times:**
- Local only: 10-50ms
- Federated (3 servers): 200-500ms (parallel — depends on slowest server)

---

### 7.5 Network Topologies

#### 7.5.1 Single Main Server Network

```
                  ┌───────────────────┐
                  │   Main Server     │
                  │      (Pau)        │
                  │   - Registry      │
                  │   - Local offers  │
                  └────────┬──────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌─────▼────┐
    │Server A  │      │Server B  │      │ Server C │
    │(Toulouse)│      │(Bordeaux)│      │(Bayonne) │
    │- Offers  │      │- Offers  │      │- Offers  │
    └──────────┘      └──────────┘      └──────────┘

Registration: A, B, C use CENTRAL_SERVER_URL=https://pau.org
```

#### 7.5.2 Multiple Independent Networks

```
Network 1 (France)           Network 2 (Spain)
┌─────────────┐              ┌─────────────┐
│Main (Paris) │              │Main(Madrid) │
├─────────────┤              ├─────────────┤
│ - Lyon      │              │ - Valencia  │
│ - Marseille │              │ - Sevilla   │
└─────────────┘              └─────────────┘

No cross-network federation (different NETWORK_KEY)
```

#### 7.5.3 Standalone Server

```
┌──────────────┐
│   Server     │
│   (Pau)      │
│ Standalone   │
│              │
│ CENTRAL_URL  │
│ = self URL   │
└──────────────┘

No network participation, only local offers
```

---

### 7.6 API Version Compatibility

**Endpoint versioning:**
- `/v2/offers/local/all` - Current version

**Cross-version compatibility:**
- V2 servers can fetch from other V2 servers
- Response format standardized as JSON object with server URLs as keys

**Required for federation:**
- HTTPS in production (HTTP allowed in development)
- JSON response format
- `/v2/` prefix in URL

---

### 7.7 Security in Federation

**Network Key (`RESILINK_NETWORK_KEY`):**
- Required to register with main server
- Validates server authenticity
- Must be kept secret
- Different networks use different keys

**Server-to-Server Communication:**
- HTTPS enforced in production
- No JWT required for public offer endpoints
- Optional authentication for private endpoints

**User Privacy:**
- User JWT not transmitted to external servers
- Only public offer data is fetched
- User-specific filtering (blocked offers) done locally

---

## 8. Technologies and Stack

### 8.1 Backend

| Technology | Version | Usage |
|-------------|---------|-------|
| **Node.js** | ≥18.x | Server JavaScript runtime |
| **Express.js** | 4.18.2 | Web framework REST API |
| **body-parser** | 2.2.0 | Request body parsing compatibility |
| **dotenv** | 16.4.5 | Environment variables loading |
| **MongoDB** | 6.1.0 (driver) | NoSQL database |
| **JWT** | jsonwebtoken 9.0.2 | Authentication tokens |
| **bcrypt** | 6.0.0 | Password hashing |
| **crypto-js** | 4.2.0 | AES helper utilities |
| **Winston** | 3.11.0 | System logging |
| **express-winston** | 4.2.0 | HTTP/request log integration |
| **winston-mongodb** | 5.1.1 | Log persistence in MongoDB |
| **Morgan** | 1.10.0 | HTTP access logs |
| **Socket.IO** | 4.7.2 | Real-time communication support |
| **Swagger** | swagger-ui-express 5.0.0 | API documentation |
| **swagger-jsdoc** | 6.2.8 | OpenAPI generation from JSDoc |
| **swagger-parser** | 10.0.3 | OpenAPI validation/parsing |
| **Crypto** | Native Node.js | AES-256 encryption |
| **child_process** | 1.0.2 | System command/process execution helpers |
| **CORS** | cors 2.8.5 | Cross-Origin Resource Sharing |

### 8.2 NPM Dependencies

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "body-parser": "^2.2.0",
    "child_process": "^1.0.2",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "crypto-js": "^4.2.0",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "express-winston": "^4.2.0",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.1.0",
    "morgan": "^1.10.0",
    "socket.io": "^4.7.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-parser": "^10.0.3",
    "swagger-ui-express": "^5.0.0",
    "winston": "^3.11.0",
    "winston-mongodb": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 8.3 Project Structure

```
RESILINK_Render_Server/
├── package.json
├── README.md
├── TECHNICAL_SPECIFICATION.md (this document)
├── RESILINK_Server.env (configuration)
│
├── public/
│   ├── Confidentiality.html
│   ├── TECHNICAL_SPECIFICATION.html
│   └── images/
│       ├── 0/, 1/, ..., 75/ (AssetType images)
│       └── NaN/
│
└── src/
    ├── index.js (entry point)
    ├── middlewares/
    │   ├── serverAuth.js
    │   └── optionalAuth.js
    │
    └── v2/
        ├── config.js
        ├── errors.js
        ├── loggers.js
        ├── swaggerV2.js
        │
        ├── routes/ (13 files)
        ├── controllers/ (13 files)
        ├── services/ (14 files)
        └── database/ (14 files)
```

---

## 9. Configuration and Deployment

### 9.1 Environment Variables

**File**: `RESILINK_Server.env` (project root)

```bash
# Server
IP_ADDRESS=resilink-dp.org
PORT=9990
SWAGGER_URL=https://resilink-dp.org

# Security
ENCRYPTION_KEY=your_encryption_key_here
TOKEN_KEY=your_token_key_here
TOKEN_REQUIRED=true

# Federation
CENTRAL_SERVER_URL=https://central.resilink.org
RESILINK_NETWORK_KEY=your_network_key_here

# Database
DB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ResilinkWithoutODEP
DB_LOGS_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Logs
```

**⚠️ Security:**
- **NEVER** commit `.env` to Git
- Generate `ENCRYPTION_KEY` and `TOKEN_KEY` with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Restrict MongoDB access via IP Whitelist

---

### 9.2 Installation

```bash
# 1. Clone repository
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd RESILINK_Render_Server

# 2. Install dependencies
npm install

# 3. Configure .env
cp RESILINK_Server.env.example RESILINK_Server.env
nano RESILINK_Server.env
# → Fill all variables

# 4. Verify MongoDB connection
# → Test with MongoDB Compass: mongodb+srv://...

# 5. Start server
node src/index.js

# Expected output:
# Connected to MongoDB
# API is listening on port 9990
# Swagger docs available at http://localhost:9990/api-docs
```

---

### 9.3 Production Deployment

#### 9.3.1 Linux Server (Systemd)

**File**: `/etc/systemd/system/resilink.service`

```ini
[Unit]
Description=RESILINK v2 API Server
After=network.target

[Service]
Type=simple
User=resilink
WorkingDirectory=/opt/resilink
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=resilink

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Commands:**
```bash
sudo systemctl enable resilink
sudo systemctl start resilink
sudo systemctl status resilink
sudo journalctl -u resilink -f
```

#### 9.3.2 Reverse Proxy Nginx

**File**: `/etc/nginx/sites-available/resilink`

```nginx
server {
    listen 443 ssl http2;
    server_name resilink-dp.org;

    ssl_certificate /etc/letsencrypt/live/resilink-dp.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resilink-dp.org/privkey.pem;

    location / {
        proxy_pass http://localhost:9990;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api-docs {
        proxy_pass http://localhost:9990/api-docs;
    }
}

server {
    listen 80;
    server_name resilink-dp.org;
    return 301 https://$host$request_uri;
}
```

**Activation:**
```bash
sudo ln -s /etc/nginx/sites-available/resilink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 9.3.3 SSL/TLS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d resilink-dp.org
sudo certbot renew --dry-run
```

---

### 9.4 Monitoring

#### 9.4.1 Winston Logs

**Log files**: MongoDB `Logs` database

**Collections:**
- `GetDataLogger` - DB reads
- `UpdateDataResilinkLogger` - DB writes
- `DeleteDataResilinkLogger` - DB deletions
- `ConnectDBResilinkLogger` - DB connections
- `SecurityLogger` - Security events

**Query:**
```bash
mongo "mongodb+srv://..." --eval "db.getSiblingDB('Logs').GetDataLogger.find().limit(10).pretty()"
```

#### 9.4.2 Morgan

**HTTP Logs**: Console stdout (dev mode)

```
GET /v2/offers/local/all 200 45.123 ms - 1245
POST /v2/users/auth/sign_in 200 123.456 ms - 532
```

---

### 9.5 Database Backup

**MongoDB Atlas:**
- Automatic backups (Cloud Atlas Plan)
- Point-in-time recovery

**Manual:**
```bash
mongodump --uri="mongodb+srv://..." --out=/backup/resilink_$(date +%Y%m%d)
```

**Restore:**
```bash
mongorestore --uri="mongodb+srv://..." /backup/resilink_20260210
```

---

## 10. Logging et Monitoring

### 10.1 Winston Loggers

**Configuration**: `src/v2/loggers.js`

**Available loggers:**

| Logger | Usage | Transport |
|--------|-------|-----------|
| GetDataLogger | DB reads | MongoDB + Console |
| UpdateDataResilinkLogger | DB writes/modifications | MongoDB + Console |
| DeleteDataResilinkLogger | DB deletions | MongoDB + Console |
| ConnectDBResilinkLogger | DB connections | MongoDB + Console |
| SecurityLogger | Auth, JWT, Network Key | MongoDB + Console |

**Format:**
```json
{
  "level": "info",
  "message": "Success retrieving all offers",
  "from": "getAllOffers",
  "username": "john_doe",
  "timestamp": "2026-02-10T15:30:45.123Z"
}
```

**Niveaux:**
- `info` - Opérations normales
- `warn` - Avertissements (ex: serveur externe timeout)
- `error` - Erreurs nécessitant attention

---

### 10.2 CRON Jobs

**File**: `src/v2/database/CronFunction.js`

**Scheduled jobs:**

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 0 * * *` | updateGlobalRecommendationStats | Stats aggregation at midnight |

**CRON Logs:**
```
2026-02-10 00:00:00 - INFO - 🕛 CRON: Starting GlobalRecommendationStats update...
2026-02-10 00:00:05 - INFO - ✅ GlobalRecommendationStats successfully updated
```

---

### 10.3 Health Check

**⚠️ Not currently implemented**

**Recommendation:**

```javascript
// GET /health
app.get('/health', async (req, res) => {
  try {
    const db = await connectToDatabase.connectToDatabase();
    await db.admin().ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mongodb: 'connected',
      version: '2.0'
    });
  } catch (e) {
    res.status(503).json({
      status: 'unhealthy',
      error: e.message
    });
  }
});
```

**External monitoring:**
- UptimeRobot: ping `/health` every 5 minutes
- Nagios/Zabbix: alert if 503 or timeout

---

## 11. Flow Diagrams

### 11.1 Authentication Flow

```
┌────────┐                 ┌─────────┐                 ┌──────────┐
│ Client │                 │ Server  │                 │ MongoDB  │
└───┬────┘                 └────┬────┘                 └────┬─────┘
    │                           │                           │
    │ POST /users/auth/sign_in  │                           │
    │ {username, password}      │                           │
    ├──────────────────────────>│                           │
    │                           │ findOne(userName)         │
    │                           ├──────────────────────────>│
    │                           │                           │
    │                           │ user document             │
    │                           │<──────────────────────────┤
    │                           │                           │
    │                           │ verify password hash      │
    │                           │                           │
    │                           │ generate JWT              │
    │                           │ (username, role, exp)     │
    │                           │                           │
    │                           │ updateOne(AccessToken)    │
    │                           ├──────────────────────────>│
    │                           │                           │
    │  200 OK                   │                           │
    │  {token, user}            │                           │
    │<──────────────────────────┤                           │
    │                           │                           │
    │ Subsequent requests       │                           │
    │ Authorization: Bearer ... │                           │
    ├──────────────────────────>│                           │
    │                           │                           │
    │                           │ jwt.verify(token)         │
    │                           │ → req.user = decoded      │
    │                           │                           │
```

---

### 11.2 Offer Creation Flow

```
┌────────┐     ┌────────────┐     ┌──────────┐      ┌─────────┐     ┌──────────┐
│ Client │     │ Controller │     │ Service  │      │Database │     │ MongoDB  │
└───┬────┘     └─────┬──────┘     └────┬─────┘      └────┬────┘     └────┬─────┘
    │                │                  │                │               │
    │ POST /offers   │                  │                │               │
    │ {assetId, ...} │                  │                │               │
    ├───────────────>│                  │                │               │
    │                │                  │                │               │
    │                │ createOffer()    │                │               │
    │                ├─────────────────>│                │               │
    │                │                  │                │               │
    │                │                  │ Validate data  │               │
    │                │                  │                │               │
    │                │                  │ newOffer()     │               │
    │                │                  ├───────────────>│               │
    │                │                  │                │               │
    │                │                  │                │ findOneAndUpdate│
    │                │                  │                │ Counters(offerId)│
    │                │                  │                ├──────────────>│
    │                │                  │                │               │
    │                │                  │                │ {seq: 12346}  │
    │                │                  │                │<──────────────┤
    │                │                  │                │               │
    │                │                  │                │ insertOne     │
    │                │                  │                │ {id:12346,... }│
    │                │                  │                ├──────────────>│
    │                │                  │                │               │
    │                │                  │                │ acknowledged  │
    │                │                  │                │<──────────────┤
    │                │                  │                │               │
    │                │                  │ return result  │               │
    │                │                  │<───────────────┤               │
    │                │                  │                │               │
    │                │ [offer, 200]     │                │               │
    │                │<─────────────────┤                │               │
    │                │                  │                │               │
    │  201 Created   │                  │                │               │
    │  {offer}       │                  │                │               │
    │<───────────────┤                  │                │               │
    │                │                  │                │               │
```

---

### 11.3 Federated Offers Flow

```
┌────────┐     ┌──────────┐     ┌──────────────────┐       ┌──────────┐     ┌──────────────┐
│ Client │     │ Server A │     │ FavoriteServersDB│       │Server B  │     │  Server C    │
└───┬────┘     └────┬─────┘     └─────────┬────────┘       └────┬─────┘     └──────┬───────┘
    │               │                     │                     │                  │
    │ GET /offers   │                     │                     │                  │
    │ /federated/all│                     │                     │                  │
    ├──────────────>│                     │                     │                  │
    │               │                     │                     │                  │
    │               │ Extract JWT         │                     │                  │
    │               │ → user.username     │                     │                  │
    │               │                     │                     │                  │
    │               │ getLocalOffersOnlyCustom()                │                  │
    │               │ → {actualServer:{...}}                    │                  │
    │               │                     │                     │                  │
    │               │ getFavoriteServers  │                     │                  │
    │               ├────────────────────>│                     │                  │
    │               │                     │                     │                  │
    │               │  {servers:[B, C]}   │                     │                  │
    │               │<────────────────────┤                     │                  │
    │               │                     │                     │                  │
    │               │ fetch(B/offers)     │                     │                  │
    │               ├─────────────────────┼────────────────────>│                  │
    │               │                     │                     │                  │
    │               │                     │         {offers_B}  │                  │
    │               │<────────────────────┼─────────────────────┤                  │
    │               │                     │                     │                  │
    │               │ fetch(C/offers)     │                     │                  │
    │               ├─────────────────────┼─────────────────────┼─────────────────>│
    │               │                     │                     │                  │
    │               │                     │                     │      {offers_C}  │
    │               │<────────────────────┼─────────────────────┼──────────────────┤
    │               │                     │                     │                  │
    │               │ Filter blockedOffers│                     │                  │
    │               │ Aggregate results   │                     │                  │
    │               │                     │                     │                  │
    │ 200 OK        │                     │                     │                  │
    │ {actualServer:│                     │                     │                  │
    │  {...},       │                     │                     │                  │
    │  serverB:{...}│                     │                     │                  │
    │  serverC:{...}│                     │                     │                  │
    │ }             │                     │                     │                  │
    │<──────────────┤                     │                     │                  │
    │               │                     │                     │                  │
```

---

## 12. Appendices

### 12.1 Custom Error Codes

**File**: `src/v2/errors.js`

```javascript
class getDBError extends Error {
  constructor(message) {
    super(message);
    this.name = 'getDBError';
  }
}

class InsertDBError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InsertDBError';
  }
}

class UpdateDBError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UpdateDBError';
  }
}

class DeleteDBError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DeleteDBError';
  }
}

class IDNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IDNotFoundError';
  }
}

class notValidBody extends Error {
  constructor(message) {
    super(message);
    this.name = 'notValidBody';
  }
}
```

**Usage:**
```javascript
if (!prosumer) {
  throw new IDNotFoundError(`Prosumer ${id} not found`);
}
```

---

### 12.2 HTTP Utilities

**File**: `src/v2/services/Utils.js`

**Function `fetchJSONData`:**
```javascript
async function fetchJSONData(method, url, headers, body) {
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  const response = await fetch(url, options);
  return response;
}
```

**Function `streamToJSON`:**
```javascript
async function streamToJSON(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return JSON.parse(buffer.toString('utf8'));
}
```

---

### 12.3 cURL Request Examples

#### Authentication
```bash
curl -X POST https://resilink-dp.org/v2/users/auth/sign_in \
  -H "Content-Type: application/json" \
  -d '{"userName":"john_doe","password":"SecurePass123!"}'
```

#### Create Offer
```bash
curl -X POST https://resilink-dp.org/v2/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "assetId": 789,
    "offerer": "john_doe",
    "offerType": "sale",
    "price": 150.00,
    "currency": "EUR",
    "offeredQuantity": 1000,
    "unit": "kWh",
    "validityLimit": "2026-12-31T23:59:59Z"
  }'
```

#### Federated Offers
```bash
curl -X GET "https://resilink-dp.org/v2/offers/federated/all" \
  -H "Authorization: Bearer eyJhbGc..."
```

#### Block Offer
```bash
curl -X POST https://resilink-dp.org/v2/prosumers/john_doe/blocked-offers/server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"serverName":"https://resilink-toulouse.org","offerId":"789"}'
```

---

### 12.4 Glossary

| Term | Definition |
|-------|------------|
| **Prosumer** | Producer-Consumer: user who can produce and consume resources (applicable to any domain) |
| **Asset** | Any resource/product (examples: solar panel, laptop, furniture, consulting service) |
| **AssetType** | Standardized category (Solar Panel, Laptop, Office Chair, etc.) - customizable per deployment |
| **Offer** | Sale/rental/service offer for an asset or resource |
| **Contact Exchange** | MainWithoutODEP model: platform provides prosumer contact info, actual transaction happens externally |
| **Federation** | Network of interconnected RESILINK servers (can be domain-specific or geographic) |
| **Favorite Server** | External server added by user for aggregation |
| **Blocked Offer** | Offer hidden by user |
| **JWT** | JSON Web Token: authentication token |
| **AES-256** | Advanced Encryption Standard 256 bits |
| **ODEP** | Orange Digital Energy Platform (blockchain) - see `main` branch |
| **CRON** | Scheduled task (scheduled job) |
| **Swagger** | Interactive API documentation |
| **MainWithoutODEP** | Current branch: focus on discovery/contact exchange, transactions externalized |

---

### 12.5 Roadmap

**v2.0 MainWithoutODEP** (Current - Production):
- ✅ Complete REST API for offer discovery
- ✅ Contact exchange model (transactions externalized)
- ✅ Multi-server federation
- ✅ Multi-server offer blocking
- ✅ Recommendations system
- ✅ JWT + AES-256
- ❌ Contracts/Requests not implemented (by design)

**v2.1** (Upcoming):
- ⬜ Rate limiting
- ⬜ Health check endpoint
- ⬜ Prometheus metrics
- ⬜ Unit tests (Jest)
- ⬜ CI/CD pipeline
- ⬜ Docker containerization

**v3.0 - `main` branch** (ODEP integration):
- ⬜ ODEP blockchain integration
- ⬜ Smart contract execution
- ⬜ Transaction management (on-chain)
- ⬜ Request system implementation
- ⬜ WebSocket real-time updates
- ⬜ GraphQL API
- ⬜ Machine Learning recommendations

---

### 12.6 Contacts and Support

**Lead Developer:**
- Axel Cazaux
- UPPA (University of Pau and Pays de l'Adour)

**Repository:**
- GitHub: https://github.com/ZiQuwi/RESILINK_Render_Server
- Branch: `MainWithoutODEP` (production)
- Branch: `main` (with ODEP)

**Documentation:**
- Swagger: https://resilink-dp.org/api-docs
- README: https://github.com/ZiQuwi/RESILINK_Render_Server/blob/MainWithoutODEP/README.md

---

### 12.7 License

**License**: UPPA  
**Copyright**: © 2026 Axel Cazaux - UPPA

Usage authorized within the RESILINK project framework only.

---

## End of Document

**Version**: 2.0  
**Last Updated**: February 10, 2026  
**Pages**: ~50  
**Word Count**: ~12,000

---
