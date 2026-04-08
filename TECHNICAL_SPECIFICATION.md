# RESILINK v3 (ODEP) - Complete Technical Specification

**Version**: 3.0  
**Date**: April 2026  
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
7. [Technologies and Stack](#7-technologies-and-stack)
8. [Configuration and Installation](#8-configuration-and-installation)
9. [Logging and Monitoring](#9-logging-and-monitoring)
10. [Flow Diagrams](#10-flow-diagrams)
11. [Appendices](#11-appendices)

---

## 1. Overview

### 1.1 Project Description

**RESILINK v3** (main/dev branch) is a Node.js/Express **middleware platform** that acts as an intermediary layer between a mobile application and the **ODEP (Orange Digital Energy Platform)** blockchain API. It facilitates **resource/asset exchange** between users (prosumers) by:

- **Proxying CRUD operations** to the ODEP blockchain API for core business entities (users, prosumers, assets, offers, contracts, requests, regulators)
- **Enriching ODEP data** with additional metadata stored locally in MongoDB (images, phone numbers, GPS coordinates, activity domains, bookmarks, blocked offers)
- **Managing local-only features** (news, ratings) not supported by ODEP
- **Providing interactive Swagger documentation** for the complete API surface

**Important**: In this version, the **core business logic is handled by ODEP**. The RESILINK server acts as a **middleware/proxy** that enriches ODEP data with local supplementary information. Unlike the `MainWithoutODEP` variant, this version **does not operate standalone** — it requires an active ODEP API connection to function. Contracts, Requests, and Regulators **are functional** as they are managed by ODEP.

### 1.2 Business Objectives

| Objective | Description |
|-----------|-------------|
| **Blockchain-Based Exchange** | Leverage ODEP blockchain for secure, traceable transactions between prosumers |
| **Middleware Enrichment** | Enhance ODEP data with images, GPS, phone numbers, and user preferences |
| **Full Transaction Lifecycle** | Support complete offer → request → contract workflow via ODEP |
| **Multi-Actor Management** | Users, Prosumers, Regulators with distinct roles managed by ODEP |
| **Data Sovereignty** | Core data on ODEP blockchain; supplementary data on local MongoDB |
| **Mobile-First API** | Designed as backend for the RESILINK mobile application |

### 1.3 Scope

**Included:**
- Complete REST API as middleware between mobile app and ODEP
- Dual endpoint system (ODEP-only and RESILINK-enriched)
- ODEP blockchain integration for Users, Prosumers, Assets, AssetTypes, Offers, Requests, Contracts, Regulators
- MongoDB database for local supplementary data (images, metadata, news, ratings)
- AES-256 encryption of sensitive local data
- Interactive Swagger documentation
- Asset image management (Base64 upload, PNG storage)
- Offer filtering, pagination, and suggestions

**Excluded (main/ODEP version):**
- **Multi-server federation** (no RegisteredServers, no FavoriteServers — not applicable with ODEP architecture)
- **Federated offer aggregation** (single ODEP instance serves as centralized backend)
- **Recommendation statistics** (no RecommendationStats, no GlobalRecommendationStats)
- **CRON scheduled tasks** (no periodic aggregation needed)
- **Standalone operation** (requires active ODEP API connection)
- Frontend user interface (consumed by mobile application)
- Payment processing (managed outside the platform)

**Comparison with MainWithoutODEP:**

| Feature | Main (ODEP) | MainWithoutODEP |
|---------|-------------|-----------------|
| Core data storage | ODEP blockchain | Local MongoDB |
| Authentication | ODEP token system | Local JWT generation |
| Contracts | ✅ Fully functional (ODEP) | ❌ Not implemented |
| Requests | ✅ Fully functional (ODEP) | ❌ Not implemented |
| Regulators | ✅ Fully functional (ODEP) | ❌ Not implemented |
| Federation | ❌ Not applicable | ✅ Multi-server network |
| Recommendations | ❌ Not included | ✅ User stats + CRON |
| Standalone mode | ❌ Requires ODEP | ✅ Fully autonomous |
| Offer discovery | Single ODEP instance | Local + federated servers |

**Philosophy**: This version acts as a **middleware enrichment layer** on top of ODEP. ODEP handles the blockchain-based business logic (user management, asset ownership, contract enforcement), while RESILINK adds mobile-oriented features (images, GPS, phone numbers, news feed, ratings, blocked offers).

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
┌──────────────────────────────────────────────────────────────────┐
│              RESILINK v3 MIDDLEWARE SERVER (Node.js)             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐   ┌──────────────┐           │
│  │   Routes     │→ │ Controllers  │→  │  Services    │           │
│  │  (Swagger)   │  │   (HTTP)     │   │ (Business)   │           │
│  └──────────────┘  └──────────────┘   └──────┬───────┘           │
│                                              │                   │
│                                     ┌────────┴────────┐          │
│                                     │                 │          │
│                                     ▼                 ▼          │
│                              ┌──────────┐     ┌────────────┐     │
│                              │ Database │     │  ODEP API  │     │
│                              │  Layer   │     │  (fetch)   │     │
│                              └────┬─────┘     └─────┬──────┘     │
└───────────────────────────────────┼─────────────────┼────────────┘
                                    │                 │
                                    ▼                 ▼
                            ┌───────────────┐ ┌───────────────────┐
                            │   MongoDB     │ │    ODEP API       │
                            │   Resilink    │ │  (Orange Cloud)   │
                            │ (Supplement.) │ │  (Blockchain)     │
                            └───────────────┘ └───────────────────┘
                                    │
                            ┌───────────────┐
                            │   MongoDB     │
                            │     Logs      │
                            │  (Winston)    │
                            └───────────────┘
```

### 2.2 Architecture Interne (MVC+S)

**Pattern**: Model-View-Controller + Service Layer

```
src/
├── index.js                    # Entry point, server initialization
└── v3/
    ├── config.js              # Environment variables loader (ODEP paths included)
    ├── errors.js              # Custom error classes
    ├── loggers.js             # Winston loggers configuration
    ├── swaggerV3.js           # Swagger documentation setup
    │
    ├── routes/                # HTTP Routes + Swagger annotations
    │   ├── UserRoute.js
    │   ├── ProsummerRoute.js
    │   ├── OfferRoute.js
    │   ├── AssetRoute.js
    │   ├── AssetTypeRoute.js
    │   ├── RegulatorRoute.js
    │   ├── ContractRoute.js
    │   ├── RequestRoute.js
    │   ├── NewsRoute.js
    │   └── RatingRoute.js
    │
    ├── controllers/           # HTTP handlers (req/res)
    │   ├── UserController.js
    │   ├── ProsummerController.js
    │   ├── OfferController.js
    │   ├── AssetController.js
    │   ├── AssetTypeController.js
    │   ├── RegulatorController.js
    │   ├── ContractController.js
    │   ├── RequestController.js
    │   ├── NewsController.js
    │   └── RatingController.js
    │
    ├── services/              # Business logic + ODEP HTTP calls
    │   ├── UserService.js
    │   ├── ProsummerService.js
    │   ├── OfferService.js
    │   ├── AssetService.js
    │   ├── AssetTypeService.js
    │   ├── RegulatorService.js
    │   ├── ContractService.js
    │   ├── RequestService.js
    │   ├── NewsService.js
    │   ├── RatingService.js
    │   └── Utils.js           # HTTP fetch utilities, token mgmt, validation
    │
    └── database/              # Data access layer (local MongoDB)
        ├── ConnectDB.js       # MongoDB connection manager (singleton)
        ├── CryptoDB.js        # AES-256 encryption utilities
        ├── UserDB.js          # Supplementary user data (phone, GPS)
        ├── ProsummerDB.js     # Supplementary prosumer data (bookmarks, blocked offers)
        ├── OfferDB.js         # Supplementary offer data (transactionType, country)
        ├── AssetDB.js         # Asset images and unit metadata
        ├── NewsDB.js          # News management (local-only)
        └── RatingDB.js        # Rating management (local-only)
```

### 2.3 Dual Endpoint Pattern

A key architectural feature is the **dual endpoint system**:

| Pattern | URL | Data Source | Use Case |
|---------|-----|-------------|----------|
| **ODEP-only** | `/v3/ODEP/...` | ODEP API only | Direct ODEP access, admin/debug |
| **Custom/Enriched** | `/v3/...` | ODEP + local MongoDB | Mobile app consumption (enriched data) |

**Example:**
- `GET /v3/ODEP/assets/all/` → Returns raw ODEP asset data
- `GET /v3/assets/all` → Returns ODEP data enriched with images and unit from local MongoDB

### 2.4 Request Flow

```
Client → Routes → Controller → Service ─┬─> ODEP API (fetch HTTP)
                                        │
                                        └─> Database Layer → MongoDB (local enrichment)
```

**Concrete example: GET /v3/assets/all (Custom/Enriched)**

1. **Client** sends `GET /v3/assets/all` with `Authorization: Bearer <ODEP_TOKEN>`
2. **Route** (`AssetRoute.js`) matches pattern
3. **Controller** (`AssetController.js`) calls `assetService.getAllAssetCustom()`
4. **Service** (`AssetService.js`):
   - Sends `GET` to `{PATH_ODEP_ASSET}all` with token forwarded
   - Receives ODEP response (all assets)
   - Calls `AssetDB.getAndCompleteAssetByAssets(data)` to enrich with local images + unit
5. **Response** sent to client: enriched assets with images and metadata

**Concrete example: POST /v3/offers (Create Offer)**

1. **Client** sends `POST /v3/offers` with offer data
2. **Service** (`OfferService.js`):
   - Extracts RESILINK-specific fields (`transactionType`, `country`) from body
   - Sends remaining fields to `{PATH_ODEP_OFFER}` via HTTP POST
   - Stores `transactionType` and `country` in local MongoDB via `OfferDB.newOffer()`
3. **Response** sent to client: ODEP response + local fields

---

## 3. Data Model

### 3.1 Dual Storage Architecture

This version uses a **dual storage** approach:

| Storage | Purpose | Collections |
|---------|---------|-------------|
| **ODEP (Blockchain)** | Core business data | Users, Prosumers, Assets, AssetTypes, Offers, Requests, Contracts, Regulators |
| **MongoDB `Resilink`** | Supplementary/enrichment data | user, prosumer, Asset, Offer, News, Rating |
| **MongoDB `Logs`** | Operation logging | GetLogs, PutLogs, DeleteLogs, PatchLogs, ConnectionLogs |

### 3.2 Entities

Each entity below lists **all its fields** with their **storage source** (`ODEP` = blockchain API, `MongoDB` = local database). Entities with dual storage are enriched at runtime by merging data from both sources.

> **Legend**: 🔷 ODEP (blockchain) · 🟠 MongoDB (local)

---

#### 3.2.1 User

**Storage**: ODEP + MongoDB  
**ODEP API**: `PATH_ODEP_USER`  
**MongoDB collection**: `user`

| Field | Source | Description |
|-------|--------|-------------|
| `userName` | 🔷 ODEP | Unique user identifier (primary key link between both systems) |
| `firstName` | 🔷 ODEP | First name |
| `lastName` | 🔷 ODEP | Last name |
| `email` | 🔷 ODEP | Email address |
| `password` | 🔷 ODEP | Authentication credentials |
| `roleOfUser` | 🔷 ODEP | Role (`prosumer` \| `regulator`) |
| `accessToken` | 🔷 ODEP | ODEP JWT token (returned on login) |
| `phoneNumber` | 🟠 MongoDB | Phone number — **encrypted** (AES-256-CBC, format `hexIV:hexCiphertext`) |
| `gps` | 🟠 MongoDB | GPS coordinates (format `<lat,lon>`) |

**MongoDB document:**
```javascript
{
  _id: "6602d2cf60c4c70987e7c96a",    // ObjectId
  phoneNumber: "a1b2c3...:d4e5f6...", // Encrypted (AES-256-CBC)
  userName: "john_doe",               // Links to ODEP user.userName
  gps: "<48.855874,2.346568>"
}
```

**Note**: `phoneNumber` decryption heuristic: decrypted only if `length > 15`.

---

#### 3.2.2 Prosumer

**Storage**: ODEP + MongoDB  
**ODEP API**: `PATH_ODEP_PROSUMER`  
**MongoDB collection**: `prosumer`

| Field | Source | Description |
|-------|--------|-------------|
| `id` | 🔷 ODEP | Prosumer identifier (= `userName`) |
| `sharingAccount` | 🔷 ODEP | Sharing account value |
| `balance` | 🔷 ODEP | Account balance |
| `bookMarked` | 🟠 MongoDB | Favorite news IDs (array of strings) |
| `blockedOffers` | 🟠 MongoDB | Blocked offer IDs (simple array) |
| `location` | 🟠 MongoDB | Geographic location (text) |
| `activityDomain` | 🟠 MongoDB | Activity sector |
| `specificActivity` | 🟠 MongoDB | Specific activity within domain |

**MongoDB document:**
```javascript
{
  _id: "john_doe",                   // Links to ODEP prosumer.id
  bookMarked: ["1", "2"],
  blockedOffers: ["123", "456"],
  location: "Paris",
  activityDomain: "Electronics",
  specificActivity: "Consumer Tech"
}
```

**Note**: Unlike the MainWithoutODEP version, `blockedOffers` is a **simple array** (not a per-server map), since there is no multi-server federation in the ODEP version.

---

#### 3.2.3 AssetType

**Storage**: ODEP only  
**ODEP API**: `PATH_ODEP_ASSETTYPE`

| Field | Source | Description |
|-------|--------|-------------|
| `name` | 🔷 ODEP | Type name (unique) |
| `description` | 🔷 ODEP | Type description |
| `nature` | 🔷 ODEP | `measurableByQuantity` \| `measurableByTime` |
| `unit` | 🔷 ODEP | Unit of measure |
| `subjectOfQuantity` | 🔷 ODEP | Quantity limit indicator |
| `regulator` | 🔷 ODEP | Associated regulator |
| `sharingIncentive` | 🔷 ODEP | Sharing incentive flag |
| `assetDataModel` | 🔷 ODEP | Specific attributes definition |

**RESILINK filter**: `getAllAssetTypes()` returns only types with `description == "RESILINK"`

---

#### 3.2.4 Asset

**Storage**: ODEP + MongoDB  
**ODEP API**: `PATH_ODEP_ASSET`  
**MongoDB collection**: `Asset`

| Field | Source | Description |
|-------|--------|-------------|
| `id` | 🔷 ODEP | Asset identifier (unique, numeric) |
| `name` | 🔷 ODEP | Asset name |
| `description` | 🔷 ODEP | Asset description |
| `assetType` | 🔷 ODEP | References AssetType.name |
| `owner` | 🔷 ODEP | Owner username |
| `multiAccess` | 🔷 ODEP | Multi-request support |
| `totalQuantity` | 🔷 ODEP | Total quantity available |
| `remainingQuantity` | 🔷 ODEP | Remaining quantity |
| `regulator` | 🔷 ODEP | Regulatory entity |
| `regulatedId` | 🔷 ODEP | Regulated asset identifier |
| `specificAttributes` | 🔷 ODEP | AssetType-specific attributes |
| `images` | 🟠 MongoDB | Image URL paths (max 2, stored as PNG on disk) |
| `unit` | 🟠 MongoDB | Unit of measure (RESILINK-specific display) |

**MongoDB document:**
```javascript
{
  id: 789,                           // Links to ODEP asset.id
  owner: "john_doe",
  images: [
    "https://domain/.../789/image0.png",
    "https://domain/.../789/image1.png"
  ],
  unit: "kWh"
}
```

**Image storage**: Images submitted as Base64, converted to PNG files at `public/images/{assetId}/image{i}.png`.

---

#### 3.2.5 Offer

**Storage**: ODEP + MongoDB  
**ODEP API**: `PATH_ODEP_OFFER`  
**MongoDB collection**: `Offer`

| Field | Source | Description |
|-------|--------|-------------|
| `id` | 🔷 ODEP | Offer identifier (auto-incremented) |
| `offerer` | 🔷 ODEP | Creator username |
| `assetId` | 🔷 ODEP | References Asset.id |
| `beginTimeSlot` | 🔷 ODEP | Start of time range |
| `endTimeSlot` | 🔷 ODEP | End of time range |
| `validityLimit` | 🔷 ODEP | Expiration date |
| `publicationDate` | 🔷 ODEP | Creation date |
| `offeredQuantity` | 🔷 ODEP | Offered quantity |
| `remainingQuantity` | 🔷 ODEP | Remaining quantity |
| `price` | 🔷 ODEP | Price per unit |
| `deposit` | 🔷 ODEP | Deposit amount |
| `cancellationFee` | 🔷 ODEP | Cancellation fee |
| `paymentMethod` | 🔷 ODEP | `total` \| `periodic` |
| `paymentFrequency` | 🔷 ODEP | Payment frequency |
| `rentInformation` | 🔷 ODEP | Rental terms (delayMargin, penalties) |
| `transactionType` | 🟠 MongoDB | `sale/purchase` \| `rent` (RESILINK-specific) |
| `country` | 🟠 MongoDB | Country of origin (RESILINK-specific) |

**MongoDB document:**
```javascript
{
  id: 12345,                         // Links to ODEP offer.id
  transactionType: "sale/purchase",
  country: "France"
}
```

**Note**: `transactionType` and `country` are extracted from the request body before forwarding to ODEP, then stored locally in MongoDB.

---

#### 3.2.6 Request

**Storage**: ODEP only  
**ODEP API**: `PATH_ODEP_REQUEST`

| Field | Source | Description |
|-------|--------|-------------|
| Request identifier | 🔷 ODEP | Unique request ID |
| Associated offer | 🔷 ODEP | References Offer.id |
| Requester information | 🔷 ODEP | Requesting prosumer |
| Quantity/terms | 🔷 ODEP | Requested quantity and conditions |

**Description**: Purchase/rental requests expressing prosumer interest in an offer. Fully functional in this version.

---

#### 3.2.7 Contract

**Storage**: ODEP only  
**ODEP API**: `PATH_ODEP_CONTRACT`

| Field | Source | Description |
|-------|--------|-------------|
| Contract identifier | 🔷 ODEP | Unique contract ID |
| Buyer/seller references | 🔷 ODEP | Both parties |
| Associated offer | 🔷 ODEP | References Offer.id |
| Contract state | 🔷 ODEP | Lifecycle management |
| Quantity/time measurements | 🔷 ODEP | Consumption tracking |

**Description**: Formalized agreements between prosumers. Fully functional in this version.

**Contract state machine** (terminal states):
- `cancelled`
- `endOfConsumption`
- `assetReceived`
- `assetNotReceived`
- `assetReturned`

**Contract types by asset nature:**
- `measurableByQuantity` → Update via `PATCH measurableByQuantityContract/{id}`
- `measurableByTime` → Update via `PATCH measurableByTimeContract/{id}`

---

#### 3.2.8 Regulator

**Storage**: ODEP only  
**ODEP API**: `PATH_ODEP_REGULATOR`

| Field | Source | Description |
|-------|--------|-------------|
| Regulator identifier | 🔷 ODEP | Unique regulator ID |
| Name | 🔷 ODEP | Regulator name |
| Regulated asset types | 🔷 ODEP | List of controlled AssetTypes |

**Description**: Regulatory entities overseeing compliance for specific asset types. Fully functional in this version.

---

#### 3.2.9 News

**Storage**: MongoDB only  
**MongoDB collection**: `News`

| Field | Source | Description |
|-------|--------|-------------|
| `_id` | 🟠 MongoDB | Auto-incremented via Counters collection |
| `url` | 🟠 MongoDB | News article URL |
| `country` | 🟠 MongoDB | Country (capitalized) |
| `institute` | 🟠 MongoDB | Institution name |
| `img` | 🟠 MongoDB | Image (Base64 encoded) |
| `platform` | 🟠 MongoDB | Source platform (e.g., "Instagram") |
| `public` | 🟠 MongoDB | Confidentiality (`"true"` \| `"false"` string) |
| `createdAt` | 🟠 MongoDB | Creation timestamp |

**MongoDB document:**
```javascript
{
  _id: "456",
  url: "https://example.com/article",
  country: "France",
  institute: "admin",
  img: "base64...",
  platform: "Instagram",
  public: "false",
  createdAt: "2026-02-10T12:00:00Z"
}
```

**Auto-increment**: `_id` generated via `Counters` collection `{ _id: "newsId", seq: 456 }`

---

#### 3.2.10 Rating

**Storage**: MongoDB only  
**MongoDB collection**: `Rating`

| Field | Source | Description |
|-------|--------|-------------|
| `userId` | 🟠 MongoDB | User identifier (unique, one rating per user) |
| `rating` | 🟠 MongoDB | Rating value (numeric) |

**MongoDB document:**
```javascript
{
  userId: "john_doe",
  rating: 4
}
```

**Constraint**: One rating per user (checked at insert time).

---

#### 3.2.11 Counters (internal)

**Storage**: MongoDB only  
**MongoDB collection**: `Counters`

| Field | Source | Description |
|-------|--------|-------------|
| `_id` | 🟠 MongoDB | Counter type (e.g., `"newsId"`) |
| `seq` | 🟠 MongoDB | Current auto-increment value |

**Used for**: `newsId` (News._id)

**Note**: Unlike MainWithoutODEP, offer and asset IDs are managed by ODEP, not by local counters.

---

### 3.3 Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ODEP (Blockchain)                            │
│                                                                      │
│  User (userName) ──┬──> Prosumer (id)                                │
│                    ├──> Asset (owner)                                │
│                    └──> Offer (offerer)                              │
│                                                                      │
│  AssetType (name) ──> Asset (assetType)                              │
│  Asset (id) ──> Offer (assetId)                                      │
│  Offer (id) ──> Request (offerId)                                    │
│  Request ──> Contract                                                │
│  Regulator ──> AssetType (regulatedAssetTypes)                       │
└──────────────────────────────────────────────────────────────────────┘
         │ Linked by userName/ID
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     MongoDB Resilink (Local)                        │
│                                                                     │
│  user (userName = userName) ──> phoneNumber (encrypted), gps        │
│  prosumer (_id = userName) ──> bookMarked[], blockedOffers[],       │
│                                location, activityDomain             │
│  Asset (id) ──> images[], unit                                      │
│  Offer (id) ──> transactionType, country                            │
│                                                                     │
│  News (_id) <── prosumer.bookMarked[]                               │
│  Rating (userId) <── user.userName                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Key relationships:**
1. `ODEP user.userName` → `MongoDB user.userName` (1:1) — Supplementary phone/GPS data
2. `ODEP prosumer.id` → `MongoDB prosumer._id` (1:1) — Bookmarks, blocked offers, location
3. `ODEP asset.id` → `MongoDB Asset.id` (1:1) — Images and unit metadata
4. `ODEP offer.id` → `MongoDB Offer.id` (1:1) — Transaction type and country
5. `MongoDB prosumer.bookMarked[]` → `MongoDB News._id` (N:N) — News bookmarking
6. `MongoDB prosumer.blockedOffers[]` → `ODEP Offer.id` (N:N) — Offer filtering

---

## 4. REST API - Endpoints

### 4.1 URL Structure

**Base URL**: `{SWAGGER_URL}/v3`  
**Documentation**: `{SWAGGER_URL}/v3/api-docs` (Swagger UI)

> `SWAGGER_URL` is defined in the environment configuration file (see [section 8.1](#81-environment-variables)). No fixed public URL exists — it depends on the deployment environment.

### 4.2 Authentication

**Header**: `Authorization: Bearer <ODEP_TOKEN>`

Authentication is handled by ODEP. The RESILINK server forwards the token to ODEP for validation on each proxied request.

- Login endpoint (`/users/auth/sign_in`) authenticates against ODEP and returns an ODEP access token
- All subsequent requests forward this token to ODEP via HTTP headers

### 4.3 Endpoints by Resource

#### 4.3.1 Users (`/users`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/users/auth/sign_in` | ODEP | Authentication (returns ODEP token) |
| POST | `/ODEP/users` | ODEP only | Create user (ODEP only) |
| POST | `/users` | ODEP + MongoDB | Create user (ODEP + local phone/GPS) |
| GET | `/ODEP/users` | ODEP only | List all users |
| GET | `/users` | ODEP + MongoDB | List all users (enriched with phone/GPS) |
| GET | `/ODEP/users/:userId` | ODEP only | User details by ID |
| GET | `/ODEP/users/getUserByEmail/:userEmail` | ODEP only | User by email |
| GET | `/users/getUserByEmail/:userEmail` | ODEP + MongoDB | User by email (enriched) |
| GET | `/ODEP/users/getUserByUserName/:userName` | ODEP only | User by username |
| GET | `/users/getUserByUserName/:userName` | ODEP + MongoDB | User by username (enriched) |
| DELETE | `/ODEP/users/:userId` | ODEP only | Delete user (ODEP only) |
| DELETE | `/users/:userId` | ODEP + MongoDB | Delete user (both systems) |

**Authentication flow:**
```bash
# Login via ODEP
POST /v3/users/auth/sign_in
{
  "userName": "john_doe",
  "password": "SecurePass123!"
}
→ Response: { "accessToken": "odep_token...", "userName": "john_doe", ... }
```

**User creation with ODEP provider retry:**
The user creation endpoint uses a **load-balanced provider pattern**. ODEP exposes multiple provider ports (22000-22006). If one provider returns `401 "No available accounts"`, the system retries with the next provider.

```
Attempt: POST {PATH_ODEP_USER}users?provider=http://127.0.0.1:22000
  → 401 → Retry with port 22001
  → 401 → Retry with port 22002
  → 200 OK (success)
```

---

#### 4.3.2 Prosumers (`/prosumers`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/prosumers/new` | ODEP only | Create prosumer in ODEP |
| POST | `/prosumers/newAccount` | ODEP + MongoDB | Create user + prosumer (full onboarding) |
| GET | `/ODEP/prosumers/all` | ODEP only | List all prosumers |
| GET | `/prosumers/all` | ODEP + MongoDB | List all prosumers (enriched) |
| GET | `/ODEP/prosumers/:id` | ODEP only | Prosumer details |
| GET | `/prosumers/:id` | ODEP + MongoDB | Prosumer details (enriched) |
| PUT | `/prosumers/:id` | ODEP + MongoDB | Update personal data |
| PATCH | `/ODEP/prosumers/:id/balance` | ODEP only | Adjust balance |
| PATCH | `/prosumers/:id/activityDomain` | MongoDB only | Update activity domain |
| PATCH | `/prosumers/:id/sharingAccount` | ODEP only | Adjust sharing account |
| PUT | `/prosumers/:id/addBookmark` | MongoDB only | Add news to favorites |
| PUT | `/prosumers/:id/addBlockedOffer` | MongoDB only | Block an offer |
| DELETE | `/prosumers/delBookmark/:id` | MongoDB only | Remove news from favorites |
| DELETE | `/prosumers/delBlockedOffer/:id` | MongoDB only | Unblock an offer |
| DELETE | `/ODEP/prosumers/:id` | ODEP only | Delete prosumer (ODEP only) |
| DELETE | `/prosumers/:id` | ODEP + MongoDB | Delete prosumer (both systems) |

**Full onboarding flow (`POST /prosumers/newAccount`):**
1. Authenticates as admin to obtain ODEP token
2. Creates user in ODEP via `UserService.createUserResilink()` (with provider retry)
3. Creates prosumer in ODEP with `{ id: userName, sharingAccount: 100, balance: 0 }`
4. Stores supplementary data in local MongoDB (location, activityDomain, specificActivity)

---

#### 4.3.3 Offers (`/offers`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/offers` | ODEP + MongoDB | Create new offer |
| POST | `/offers/all/resilink/filtered` | ODEP + MongoDB | Get filtered offers |
| POST | `/offers/createOfferAsset` | ODEP + MongoDB | Create offer with new asset |
| GET | `/offers/all/Mapped` | ODEP + MongoDB | All offers (enriched, map format) |
| GET | `/offers/suggested/:id` | ODEP + MongoDB | Suggested offers for user |
| GET | `/offers/LimitedOffer` | ODEP + MongoDB | Paginated offers |
| GET | `/offers/owner/blockedOffer/:id` | ODEP + MongoDB | Blocked offers for user |
| GET | `/offers/owner` | ODEP + MongoDB | Owner's offers |
| GET | `/offers/owner/purchase` | ODEP + MongoDB | Owner's purchase contracts + offers |
| GET | `/offers/all` | ODEP + MongoDB | All offers (list format) |
| GET | `/offers/:id` | ODEP + MongoDB | Offer details |
| PUT | `/offers/:id` | ODEP + MongoDB | Update offer |
| PUT | `/offers/:id/updateOfferAsset` | ODEP + MongoDB | Update offer and linked asset |
| DELETE | `/offers/:id` | ODEP + MongoDB | Delete offer |

**Automatic filtering (on enriched endpoints):**

See [section 5.1.2](#512-offer-discovery) for the full filtering logic.

**Offer creation data flow:**
```
Client body: { assetId, price, transactionType, country, ... }
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  ODEP receives:          MongoDB receives:
  { assetId, price, ... } { id, transactionType, country }
```

**Examples:**

```bash
# Create offer
POST /v3/offers
Authorization: Bearer <odep_token>
{
  "assetId": 789,
  "transactionType": "sale/purchase",
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
  "rentInformation": {
    "delayMargin": 0,
    "lateRestitutionPenalty": 0,
    "deteriorationPenalty": 0,
    "nonRestitutionPenalty": 0
  }
}

# Get all enriched offers (map format)
GET /v3/offers/all/Mapped
Authorization: Bearer <odep_token>
→ Response: {
  "123": { id: 123, price: 150, transactionType: "sale/purchase", phoneNumber: "+33...", ... },
  "456": { id: 456, price: 200, transactionType: "rent", phoneNumber: "+33...", ... }
}
```

---

#### 4.3.4 Assets (`/assets`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/ODEP/assets` | ODEP only | Create asset |
| POST | `/assets` | ODEP + MongoDB | Create asset (with images/unit) |
| POST | `/assets/img` | MongoDB only | Add images to existing asset |
| GET | `/ODEP/assets/owner` | ODEP only | Owner's assets |
| GET | `/assets/owner` | ODEP + MongoDB | Owner's assets (enriched) |
| GET | `/ODEP/assets/all` | ODEP only | List all assets |
| GET | `/assets/all` | ODEP + MongoDB | List all assets (enriched) |
| GET | `/ODEP/assets/:id` | ODEP only | Asset details |
| GET | `/assets/:id` | ODEP + MongoDB | Asset details (enriched) |
| GET | `/asset/allAssetMapped` | ODEP + MongoDB | All assets (map format, enriched) |
| GET | `/assets/assetImg/:id` | MongoDB only | Get asset images |
| PUT | `/ODEP/assets/:id` | ODEP only | Update asset |
| PUT | `/assets/:id` | ODEP + MongoDB | Update asset (with images/unit) |

**Image handling:**
- Images submitted as Base64 strings (max 2 per asset)
- Validated: `Utils.isBase64()` and `Utils.areAllBase64()`
- Converted to PNG and stored at: `public/images/{assetId}/image{i}.png`
- Accessible via: `{SWAGGER_URL}/public/images/{assetId}/image{i}.png`

---

#### 4.3.5 AssetTypes (`/assetTypes`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/ODEP/assetTypes` | ODEP only | Create asset type |
| GET | `/assetTypes/all` | ODEP only | List all RESILINK asset types (filtered by description) |
| GET | `/ODEP/assetTypes/all` | ODEP only | List all asset types (unfiltered, dev) |
| GET | `/assetTypes/:id` | ODEP only | Type details |
| PUT | `/assetTypes/:id` | ODEP only | Update type |

**Note**: All AssetType operations are ODEP-only. No local MongoDB enrichment is needed for asset types. The `getAllAssetTypes()` endpoint filters to return only types with `description == "RESILINK"`, while the ODEP-prefixed endpoint returns all types unfiltered.

---

#### 4.3.6 Contracts (`/contracts`)

Contract management is handled entirely by ODEP. The RESILINK server proxies all contract operations to the ODEP API.

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/contracts` | ODEP only | Create contract (formalize transaction) |
| GET | `/contracts/all` | ODEP only | List all contracts |
| GET | `/contracts/owner/ongoing` | ODEP + enrichment | Active contracts for user (enriched with asset nature) |
| GET | `/contracts/owner` | ODEP only | User's contracts |
| PATCH | `/contracts/measurableByQuantityContract/:id` | ODEP only | Update quantity-based contract |
| PATCH | `/contracts/measurableByTimeContract/:id` | ODEP only | Update time-based contract |
| PATCH | `/contracts/cancelContract/:id` | ODEP only | Cancel contract |

**Contract lifecycle:**

See [section 5.2](#52-transaction-lifecycle-odep-managed) for the full transaction lifecycle.

**Enrichment for ongoing contracts:**
`GET /contracts/owner/ongoing` enriches each contract with the `nature` field from the associated AssetType (via cross-reference: contract → offer → asset → assetType). This allows the mobile UI to display the correct input interface:
- `measurableByQuantity` → quantity input
- `measurableByTime` → date/time input

---

#### 4.3.7 Requests (`/ODEP/requests`)

Request management is handled entirely by ODEP.

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/ODEP/requests` | ODEP only | Create purchase/rental request |
| GET | `/ODEP/requests/all` | ODEP only | List all requests |
| GET | `/ODEP/requests/:id` | ODEP only | Request details |
| PUT | `/ODEP/requests/:id` | ODEP only | Update request |
| DELETE | `/ODEP/requests/:id` | ODEP only | Delete/withdraw request |

**Workflow**: A prosumer expresses interest in an offer by creating a Request. The Request can then be formalized into a Contract.

---

#### 4.3.8 Regulators (`/ODEP/regulators`)

Regulator management is handled entirely by ODEP.

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/ODEP/regulators` | ODEP only | Create regulator |
| GET | `/ODEP/regulators/all` | ODEP only | List all regulators |
| GET | `/ODEP/regulators/:id` | ODEP only | Regulator details |
| PATCH | `/ODEP/regulators/:id` | ODEP only | Update regulator |
| DELETE | `/ODEP/regulators/:id` | ODEP only | Delete regulator |

---

#### 4.3.9 News (`/news`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/news` | MongoDB only | Publish news |
| POST | `/news/:id` | MongoDB only | Create personal news (with auto-bookmark) |
| GET | `/news/all` | MongoDB only | List all news |
| GET | `/news/country` | MongoDB only | News from country |
| GET | `/news/ids` | MongoDB only | News from ID list |
| GET | `/news/owner/:id` | MongoDB only | News from owner (bookmarked) |
| GET | `/news/countryOwner` | MongoDB only | News from country excluding user's bookmarks |
| PUT | `/news/:id` | MongoDB only | Update news |
| DELETE | `/news/:id` | MongoDB only | Delete news |

**News management is entirely local** — ODEP has no news functionality. Bookmarking links news to prosumer profiles via `prosumer.bookMarked[]`.

---

#### 4.3.10 Ratings (`/rating`)

| Method | Endpoint | Storage | Description |
|--------|----------|---------|-------------|
| POST | `/rating` | MongoDB only | Create user rating |
| GET | `/rating/all` | MongoDB only | List all ratings |
| GET | `/rating/average` | MongoDB only | Average rating |
| GET | `/rating/:userId` | MongoDB only | User's rating |
| PUT | `/rating/:userId` | MongoDB only | Update rating |
| DELETE | `/rating/:userId` | MongoDB only | Delete rating |

**Rating management is entirely local** — ODEP has no rating functionality.

---

### 4.4 HTTP Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Operation success |
| 201 | Created | Resource created (user creation via ODEP) |
| 202 | Accepted | Deletion acknowledged (ODEP user deletion) |
| 400 | Bad Request | Invalid data |
| 401 | Unauthorized | Invalid/expired ODEP token |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Server error / ODEP unreachable |

---

## 5. Business Features

### 5.1 Offer Management

#### 5.1.1 Offer Publication

**Flow:**
1. Prosumer creates Asset via ODEP (with optional images stored locally)
2. Prosumer publishes Offer:
   - Core data sent to ODEP API
   - `transactionType` and `country` extracted and stored in local MongoDB
3. ODEP generates offer ID
4. Offer immediately queryable via ODEP API

**Business Rules (enforced by ODEP):**
- `assetId` must exist in ODEP
- Valid time slots and validity limits
- `price > 0`

**RESILINK-specific:**
- `transactionType` must be `"sale/purchase"` or `"rent"`
- Phone number of offerer enriched on retrieval

#### 5.1.2 Offer Discovery

**Modes:**

| Mode | Endpoint | Description |
|------|----------|-------------|
| **All offers** | `/offers/all/Mapped` | All valid offers enriched with RESILINK data |
| **Suggested** | `/offers/suggested/:id` | 3 random valid offers excluding user's own + blocked |
| **Paginated** | `/offers/LimitedOffer` | Paginated offers with `offerNbr` and `iteration` |
| **Filtered** | `/offers/all/resilink/filtered` | Advanced multi-criteria filtering |
| **Owner** | `/offers/owner` | Authenticated user's offers |
| **Blocked** | `/offers/owner/blockedOffer/:id` | User's blocked offer list |

**Smart Filtering (enriched endpoints):**
- ❌ Expired offers (`validityLimit < now`)
- ❌ Depleted offers (`remainingQuantity <= 0` for measurableByQuantity)
- ❌ Non-RESILINK asset types (filtered by `description == "RESILINK"`)
- ❌ Blocked offers by user (via local `prosumer.blockedOffers`)

**Enrichment data added to offers:**
- `phoneNumber` — Offerer's phone number (decrypted from local MongoDB)
- `transactionType` — `sale/purchase` or `rent` (from local MongoDB)
- `country` — Country of origin (from local MongoDB)

#### 5.1.3 Advanced Offer Filtering

**Endpoint**: `POST /offers/all/resilink/filtered`

**Supported filter criteria (all optional):**

| Filter | Type | Description |
|--------|------|-------------|
| `assetType` | string | Filter by asset type name |
| `properties` | object | Specific attribute matching |
| `latitude`, `longitude`, `distance` | number | GPS perimeter filter (Haversine) |
| `cityVillage` | string | Text-based location filter |
| `name` | string | Asset name/description search |
| `country` | string | Country filter |
| `transactionType` | string | `sale/purchase` or `rent` |
| `minPrice`, `maxPrice` | number | Price range |
| `minQuantity`, `maxQuantity` | number | Quantity range |
| `minDate`, `maxDate` | string | Date range |

#### 5.1.4 Offer Blocking

**Simple array structure (no multi-server):**
```javascript
prosumer.blockedOffers = ["123", "456", "789"]
```

**API:**
- `PUT /prosumers/:id/addBlockedOffer` — Block offer
- `DELETE /prosumers/delBlockedOffer/:id` — Unblock offer

**Note**: Unlike MainWithoutODEP which uses a per-server blocking map, the ODEP version uses a simple array since all offers come from a single ODEP instance.

#### 5.1.5 Offer + Asset Atomic Creation

**Endpoint**: `POST /offers/createOfferAsset`

Creates both an asset and an offer in a single request:
1. Creates asset in ODEP (with optional images stored locally)
2. Retrieves generated `assetId` from ODEP response
3. Injects `assetId` into offer payload
4. Creates offer in ODEP + stores `transactionType`/`country` locally

---

### 5.2 Transaction Lifecycle (ODEP-Managed)

**✅ FULLY FUNCTIONAL** in this version (unlike MainWithoutODEP).

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
│  Offer   │ ──>│ Request  │ ──>│ Contract │ ──>│  Execution   │
│ (Publish)│    │ (Express │    │(Formalize│    │  (Updates)   │
│          │    │ interest)│    │agreement)│    │              │
└──────────┘    └──────────┘    └──────────┘    └──────┬───────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                    ┌──────────┐ ┌──────────┐ ┌──────────┐
                                    │ Quantity │ │   Time   │ │  Cancel  │
                                    │  Update  │ │  Update  │ │          │
                                    └──────────┘ └──────────┘ └──────────┘
```

**Step 1: Offer Publication**
- Prosumer publishes offer linked to their asset
- Offer visible to all platform users

**Step 2: Request Creation**
- Interested prosumer creates a Request for the offer
- Request expresses intent to purchase/rent

**Step 3: Contract Formalization**
- Request is formalized into a Contract
- Both parties agree to terms

**Step 4: Contract Execution**
- **measurableByQuantity**: Buyer confirms consumption quantity
  - `PATCH /contracts/measurableByQuantityContract/:id`
- **measurableByTime**: Parties report asset receipt/return
  - `PATCH /contracts/measurableByTimeContract/:id`
- **Cancellation**: Either party can cancel
  - `PATCH /contracts/cancelContract/:id`

**Terminal states**: See [section 3.2.7](#327-contract).

---

### 5.3 User Management

#### 5.3.1 Registration

**Flow (Custom endpoint `POST /users`):**
1. **Validation:** userName, password, phoneNumber, gps (see [section 6.3](#63-input-validation) for regex details)
   - Check for duplicate `userName` and `email` via ODEP queries
2. **ODEP User Creation:**
   - Sends user data (without `phoneNumber` and `gps`) to ODEP
   - Uses load-balanced provider retry pattern (ports 22000-22006)
3. **Local Storage:**
   - `phoneNumber` encrypted with AES-256-CBC → stored in MongoDB `user` collection
   - `gps` stored in MongoDB `user` collection

#### 5.3.2 Authentication

**Flow:**
1. `POST /users/auth/sign_in` with `{ userName, password }`
2. **Service** sends credentials to ODEP authentication endpoint: `POST {PATH_ODEP_USER}auth/sign_in`
3. ODEP validates credentials and returns access token
4. Token stored in local memory via `Utils.saveUserToken(userName, token)` (in-memory Map)
5. User data synced to local MongoDB if not admin
6. Token returned to client

**Note**: Unlike MainWithoutODEP, the RESILINK server does **not generate JWT tokens locally**. Token generation and validation is handled entirely by ODEP. The local `userTokenStore` Map is used only for logging/tracking purposes (mapping tokens to usernames).

#### 5.3.3 Token Management

**In-memory `userTokenStore` (Map):**
- `Utils.saveUserToken(userId, token)` — Stores userId→token mapping
- `Utils.getUserIdFromToken(token)` — Reverse lookup: token→userId (for logging)

**Token forwarding pattern:**
- Client sends: `Authorization: Bearer <odep_token>`
- Service extracts token and forwards to ODEP: `Authorization: token` or `Authorization: Bearer token`

---

### 5.4 Data Enrichment Pattern

The core architectural pattern of this server is **ODEP Data Enrichment**:

```
1. Fetch data from ODEP API
2. For each record, query local MongoDB for supplementary fields
3. Merge ODEP data + local data
4. Return enriched response to client
```

The enrichment fields for each entity are documented in [section 3.2](#32-entities).

**In-place mutation pattern:**
The database layer functions (e.g., `AssetDB.getAndCompleteAssetByAssets()`, `UserDB.getUser()`, `OfferDB.getAllOffer()`) mutate the input ODEP data objects **in-place** by adding local MongoDB fields directly to the existing objects.

---

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
- `user.phoneNumber` (local MongoDB)

**Key**: `ENCRYPTION_KEY` (64 hex chars) in `.env`

**Decryption heuristic**: Phone number is decrypted only if `length > 15` (indicating encrypted format `iv:ciphertext`).

### 6.2 ODEP Token Authentication

**Token provider**: ODEP (Orange Digital Energy Platform)

The full authentication flow is described in [section 5.3.2](#532-authentication).

**Key points:**
- The RESILINK server does **not verify tokens locally**. Token validation is performed by ODEP when requests are proxied.
- Local in-memory `userTokenStore` (Map) used only for logging/tracking (mapping tokens to usernames) — not for validation.
- If ODEP rejects the token, the error is forwarded to the client.

### 6.3 Input Validation

**Validation functions** in `Utils.js`:

| Function | Regex | Usage |
|----------|-------|-------|
| `containsNonRomanCharacters(str)` | `/^[a-zA-Z0-9?!%-_]+$/` | userName, password validation |
| `isNumeric(str)` | `/^\d+$/` | phoneNumber validation |
| `isValidGeographicalPoint(str)` | `<lat,lon>` format, lat∈[-90,90], lon∈[-180,180] | GPS validation |
| `isBase64(str)` | Base64 regex pattern | Image validation |
| `areAllBase64(list)` | Maps `isBase64()` over array | Multiple image validation |

---

## 7. Technologies and Stack

### 7.1 Backend

| Technology | Version | Usage |
|------------|---------|-------|
| **Node.js** | ≥18.x | Server JavaScript runtime |
| **Express.js** | 4.18.2 | Web framework REST API |
| **body-parser** | (bundled) | Request body parsing |
| **dotenv** | 16.4.5 | Environment variables loading |
| **MongoDB** | 6.1.0 (driver) | NoSQL database (supplementary data) |
| **JWT** | jsonwebtoken 9.0.2 | Token parsing/utilities (ODEP provides tokens) |
| **Winston** | 3.11.0 | System logging |
| **winston-mongodb** | 5.1.1 | Log persistence in MongoDB |
| **Morgan** | 1.10.0 | HTTP access logs (dev) |
| **Swagger** | swagger-ui-express 5.0.0 | API documentation |
| **swagger-jsdoc** | 6.2.8 | OpenAPI generation from JSDoc |
| **Crypto** | Native Node.js | AES-256 encryption |
| **child_process** | 1.0.2 | System command execution helpers |
| **CORS** | cors 2.8.5 | Cross-Origin Resource Sharing |

### 7.2 External Dependencies

| Dependency | Usage |
|------------|-------|
| **ODEP API (Orange)** | Core business logic — blockchain-based data management |
| **MongoDB Atlas** | Supplementary data storage (or local MongoDB) |

### 7.3 NPM Dependencies

```json
{
  "dependencies": {
    "child_process": "^1.0.2",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.1.0",
    "morgan": "^1.10.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "winston": "^3.11.0",
    "winston-mongodb": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 7.4 Project Structure

```
RESILINK_Render_Server/
├── package.json
├── README.md
├── TECHNICAL_SPECIFICATION.md     (this document)
├── Resilink_webserver/
│   ├── RESILINK_Server.env        (configuration)
│   ├── public/                    (static files, asset images)
│   │   └── images/                (uploaded asset images)
│   ├── script/                    (installation scripts)
│   │   ├── install_resilink.ps1
│   │   ├── install_resilink.sh
│   └── src/                       (application source)
│       ├── index.js               (entry point)
│       └── v3/                    (MVC+S architecture)
```

---

## 8. Configuration and Installation

### 8.1 Environment Variables

**File**: `RESILINK_Server.env` (in `Resilink_webserver/` directory)

#### Server

| Variable | Description | Example |
|----------|-------------|---------|
| `IP_ADDRESS` | IP address the server binds to | `0.0.0.0` |
| `PORT` | TCP port | `3000` |
| `SWAGGER_URL` | Public base URL for Swagger UI | `http://0.0.0.0:3000` |

#### Security

| Variable | Description | Example |
|----------|-------------|---------|
| `ENCRYPTION_KEY` | 256-bit hex key (64 chars) for AES-256-CBC encryption of phone numbers | `b32c32aac9c6afd...` |
| `TOKEN_KEY` | 256-bit hex key (64 chars) for JWT utilities | `f0d8cd085ada735...` |

**Key generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | MongoDB connection string (main DB) | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_LOGS_URL` | MongoDB connection string (logs DB) | `mongodb+srv://user:pass@cluster.mongodb.net/Logs` |
| `DB_MODE` | Database mode: `atlas` or `local` | `atlas` |

When `DB_MODE=local`, connection strings are overridden to `mongodb://127.0.0.1:27017/Resilink` and `mongodb://127.0.0.1:27017/Logs`.

#### ODEP API Paths

| Variable | Description | Format |
|----------|-------------|--------|
| `PATH_ODEP_USER` | ODEP Authentication/User API URL | `https://<ODEP_HOST>/oauth/api/v1.0.0/` |
| `PATH_ODEP_PROSUMER` | ODEP Prosumer API URL | `https://<ODEP_HOST>/restapi/api/v3/prosumers/` |
| `PATH_ODEP_REGULATOR` | ODEP Regulator API URL | `https://<ODEP_HOST>/restapi/api/v3/regulators/` |
| `PATH_ODEP_ASSET` | ODEP Asset API URL | `https://<ODEP_HOST>/restapi/api/v3/assets/` |
| `PATH_ODEP_ASSETTYPE` | ODEP AssetType API URL | `https://<ODEP_HOST>/restapi/api/v3/assetTypes/` |
| `PATH_ODEP_OFFER` | ODEP Offer API URL | `https://<ODEP_HOST>/restapi/api/v3/offers/` |
| `PATH_ODEP_REQUEST` | ODEP Request API URL | `https://<ODEP_HOST>/restapi/api/v3/requests/` |
| `PATH_ODEP_CONTRACT` | ODEP Contract API URL | `https://<ODEP_HOST>/restapi/api/v3/contracts/` |

> **Note**: The actual `<ODEP_HOST>` value is **confidential**. ODEP API URLs must be requested from ORANGE or from `Congduc.Pham@univ-pau.fr`.

**⚠️ Security:**
- **NEVER** commit `.env` to Git
- `ENCRYPTION_KEY` and `TOKEN_KEY` must be cryptographically random
- ODEP API URLs are confidential
- Restrict MongoDB access via IP Whitelist

---

### 8.2 Installation

#### Prerequisites

- **Node.js** (v18.20 or later)
- **MongoDB** (Atlas cluster *or* local installation)
- **ODEP API** (URLs to be requested from ORANGE)

#### Database Setup

**Database 1: `Logs`**
```
use Logs

db.createCollection("ConnectionLogs")
db.createCollection("DeleteLogs")
db.createCollection("GetLogs")
db.createCollection("PatchLogs")
db.createCollection("PutLogs")
```

**Database 2: `Resilink`**
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

> **Note**: The `Counters` collection is used for News auto-increment IDs (see [section 3.2.11](#3211-counters-internal)). It is automatically initialized on first News insertion via `upsert`.
> The `AssetType` collection listed in the MainWithoutODEP version is **not needed** here — asset types are managed entirely by ODEP.

**Database Initialization (InitDB)**

On server startup, `InitDB.js` ensures **unique indexes** and **deduplication** for local MongoDB collections:

| Collection | Indexed Field | Type | Justification |
|------------|--------------|------|---------------|
| `Rating` | `userId` | Unique | Only entity fully managed locally (one rating per user) |

This runs automatically at launch (see `src/v3/database/InitDB.js`). Pre-existing duplicates are cleaned before indexes are created.

#### Installation Steps

```bash
# 1. Clone the project
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
cd Resilink_webserver

# 2. Install dependencies
npm install

# 3. Create and configure the environment file
cp RESILINK_Server.env.example RESILINK_Server.env
# Then edit RESILINK_Server.env and fill in the required values:
#   - IP_ADDRESS, PORT, SWAGGER_URL
#   - ENCRYPTION_KEY, TOKEN_KEY (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
#   - DB_URL, DB_LOGS_URL, DB_MODE (atlas or local)
#   - PATH_ODEP_* (ODEP API URLs — confidential, request from ORANGE)
# See section 8.1 for full variable reference.

# 4. Start the server
node src/index.js
```

> **⚠️ Important**: The `.env` file contains **credentials and confidential URLs**. It must **never** be committed to Git. Ensure `RESILINK_Server.env` is listed in `.gitignore`.

#### Local MongoDB Installation (Optional)

For local MongoDB setup, use the included scripts:

```bash
# Linux/Ubuntu
cd Resilink_webserver/script
./install_resilink.sh

# Windows (PowerShell as Administrator)
cd Resilink_webserver/script
./install_resilink.ps1
```

#### Verification

After startup, access Swagger documentation:
```
http://<IP_ADDRESS>:<PORT>/v3/api-docs
```

---

## 9. Logging and Monitoring

### 9.1 Winston Loggers

**Configuration**: `src/v3/loggers.js`

**Available loggers:**

| Logger | Usage | MongoDB Collection |
|--------|-------|-------------------|
| `GetDataLogger` | Read operations (GET) | `GetLogs` |
| `UpdateDataODEPLogger` | ODEP write operations (POST/PUT) | `PutLogs` |
| `UpdateDataResilinkLogger` | Local MongoDB write operations | `PutLogs` |
| `DeleteDataODEPLogger` | ODEP delete operations | `DeleteLogs` |
| `DeleteDataResilinkLogger` | Local MongoDB delete operations | `DeleteLogs` |
| `ConnectDBResilinkLogger` | MongoDB connections | `ConnectionLogs` |
| `PatchDataODEPLogger` | ODEP patch operations | `PatchLogs` |

**Log format:**
```json
{
  "level": "info",
  "message": "Success retrieving all offers",
  "metadata": {
    "from": "getAllOfferForResilinkCustom",
    "username": "john_doe",
    "tokenUsed": "eyJhbGc..."
  },
  "timestamp": "2026-04-02T15:30:45.123Z"
}
```

**Levels:**
- `info` — Normal operations
- `warn` — Warnings (e.g., ODEP error response)
- `error` — Errors requiring attention

### 9.2 Morgan (Development)

HTTP access logging via Morgan in `dev` format:
```
GET /v3/offers/all/Mapped 200 45.123 ms
POST /v3/users/auth/sign_in 200 120.456 ms
```

### 9.3 Log Separation (ODEP vs RESILINK)

Loggers distinguish between **ODEP operations** and **local RESILINK operations**:
- `UpdateDataODEPLogger` / `DeleteDataODEPLogger` — Track HTTP calls to ODEP
- `UpdateDataResilinkLogger` / `DeleteDataResilinkLogger` — Track local MongoDB operations

This separation allows monitoring ODEP availability and performance independently from local database operations.

---

## 10. Flow Diagrams

### 10.1 Authentication Flow (via ODEP)

```
┌────────┐                 ┌──────────────┐                ┌──────────┐
│ Client │                 │  RESILINK    │                │   ODEP   │
│ (App)  │                 │  Server      │                │   API    │
└───┬────┘                 └──────┬───────┘                └────┬─────┘
    │                             │                             │
    │ POST /users/auth/sign_in    │                             │
    │ {userName, password}        │                             │
    ├────────────────────────────>│                             │
    │                             │                             │
    │                             │ POST {PATH_ODEP_USER}       │
    │                             │ auth/sign_in                │
    │                             │ {userName, password}        │
    │                             ├────────────────────────────>│
    │                             │                             │
    │                             │ {accessToken, userName,...} │
    │                             │<────────────────────────────┤
    │                             │                             │
    │                             │ saveUserToken(userName,     │
    │                             │   token) → in-memory Map    │
    │                             │                             │
    │                             │ sync user to local MongoDB  │
    │                             │                             │
    │  200 OK                     │                             │
    │  {accessToken, userName,..} │                             │
    │<────────────────────────────┤                             │
    │                             │                             │
```

### 10.2 Enriched Data Retrieval Flow

```
┌────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│ Client │     │   RESILINK   │     │   ODEP   │     │ MongoDB  │
│ (App)  │     │   Server     │     │   API    │     │ (Local)  │
└───┬────┘     └──────┬───────┘     └────┬─────┘     └────┬─────┘
    │                 │                   │                 │
    │ GET /assets/all │                   │                 │
    │ Auth: Bearer .. │                   │                 │
    ├────────────────>│                   │                 │
    │                 │                   │                 │
    │                 │ GET {ODEP}/all    │                 │
    │                 │ Auth: token       │                 │
    │                 ├──────────────────>│                 │
    │                 │                   │                 │
    │                 │ [asset1, asset2]  │                 │
    │                 │<──────────────────┤                 │
    │                 │                   │                 │
    │                 │ For each asset:   │                 │
    │                 │ findOne({id})     │                 │
    │                 ├────────────────────────────────────>│
    │                 │                   │                 │
    │                 │ {images, unit}    │                 │
    │                 │<────────────────────────────────────┤
    │                 │                   │                 │
    │                 │ Merge: asset +    │                 │
    │                 │   images + unit   │                 │
    │                 │                   │                 │
    │ 200 OK          │                   │                 │
    │ [enriched data] │                   │                 │
    │<────────────────┤                   │                 │
    │                 │                   │                 │
```

### 10.3 Offer Creation Flow (Dual Storage)

```
┌────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│ Client │     │   RESILINK   │     │   ODEP   │     │ MongoDB  │
│ (App)  │     │   Server     │     │   API    │     │ (Local)  │
└───┬────┘     └──────┬───────┘     └────┬─────┘     └────┬─────┘
    │                 │                   │                 │
    │ POST /offers    │                   │                 │
    │ {assetId,       │                   │                 │
    │  transactionType│                   │                 │
    │  country, ...}  │                   │                 │
    ├────────────────>│                   │                 │
    │                 │                   │                 │
    │                 │ Extract:          │                 │
    │                 │  transactionType  │                 │
    │                 │  country          │                 │
    │                 │                   │                 │
    │                 │ POST {ODEP_OFFER} │                 │
    │                 │ {assetId, price,  │                 │
    │                 │  validity, ...}   │                 │
    │                 ├──────────────────>│                 │
    │                 │                   │                 │
    │                 │ {offerId: 12345}  │                 │
    │                 │<──────────────────┤                 │
    │                 │                   │                 │
    │                 │ insertOne({id:    │                 │
    │                 │  12345,           │                 │
    │                 │  transactionType, │                 │
    │                 │  country})        │                 │
    │                 ├──────────────────────────────────── >│
    │                 │                   │                 │
    │                 │ acknowledged      │                 │
    │                 │<────────────────────────────────────┤
    │                 │                   │                 │
    │ 200 OK          │                   │                 │
    │ {offer}         │                   │                 │
    │<────────────────┤                   │                 │
    │                 │                   │                 │
```

### 10.4 Contract Lifecycle Flow (ODEP)

```
┌──────────┐        ┌──────────────┐        ┌──────────┐
│  Buyer   │        │   RESILINK   │        │   ODEP   │
│  (App)   │        │   Server     │        │   API    │
└────┬─────┘        └──────┬───────┘        └────┬─────┘
     │                     │                     │
     │ 1. POST /requests   │                     │
     │ {offerId, qty, ...} │                     │
     ├────────────────────>│                     │
     │                     │ POST {ODEP_REQUEST} │
     │                     ├────────────────────>│
     │                     │ {requestId}         │
     │                     │<────────────────────┤
     │ {requestId}         │                     │
     │<────────────────────┤                     │
     │                     │                     │
     │ 2. POST /contracts  │                     │
     │ {requestId, ...}    │                     │
     ├────────────────────>│                     │
     │                     │ POST {ODEP_CONTRACT}│
     │                     ├────────────────────>│
     │                     │ {contractId}        │
     │                     │<────────────────────┤
     │ {contractId}        │                     │
     │<────────────────────┤                     │
     │                     │                     │
     │ 3. PATCH /contracts │                     │
     │ /measurableBy...    │                     │
     │ /:contractId        │                     │
     ├────────────────────>│                     │
     │                     │ PATCH {ODEP}        │
     │                     ├────────────────────>│
     │                     │ {updated contract}  │
     │                     │<────────────────────┤
     │ {contract}          │                     │
     │<────────────────────┤                     │
     │                     │                     │
```

---

## 11. Appendices

### 11.1 Custom Error Codes

**File**: `src/v3/errors.js`

```javascript
class getDBError extends Error { ... }      // Database read failure
class InsertDBError extends Error { ... }   // Database insert failure
class UpdateDBError extends Error { ... }   // Database update failure
class DeleteDBError extends Error { ... }   // Database delete failure
class IDNotFoundError extends Error { ... } // ID not found in collection
class notValidBody extends Error { ... }    // Request body validation failure
```

**Usage:**
```javascript
if (!prosumer) {
  throw new IDNotFoundError(`Prosumer ${id} not found`);
}
```

### 11.2 HTTP Utilities

**File**: `src/v3/services/Utils.js`

**Core functions:**

| Function | Description |
|----------|-------------|
| `fetchJSONData(method, url, headers, body)` | Native `fetch` wrapper for all ODEP HTTP calls |
| `streamToJSON(stream)` | Convert ODEP response stream to parsed JSON |
| `streamToString(stream)` | Convert Readable stream to UTF-8 string |
| `haversine(lat1, lon1, lat2, lon2)` | Great-circle distance (km) between two GPS points |
| `isInPerimeter(lat1, lon1, lat2, lon2, radius)` | Check if two points are within radius (km) |
| `saveUserToken(userId, token)` | Store token in memory Map |
| `getUserIdFromToken(token)` | Reverse lookup token→userId |
| `customSorter(a, b)` | Swagger route sorting (GET→POST→PUT→PATCH→DELETE) |

Validation functions (`containsNonRomanCharacters`, `isNumeric`, `isBase64`, `areAllBase64`, `isValidGeographicalPoint`) are documented in [section 6.3](#63-input-validation).

**ODEP HTTP call pattern:**
```javascript
const headers = {
  'accept': 'application/json',
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'  // for POST/PUT/PATCH
};
const response = await Utils.fetchJSONData('GET', url, headers);
const data = await Utils.streamToJSON(response.body);
```

### 11.3 ODEP API Call Patterns

**Standard ODEP HTTP patterns:**

| Operation | Method | URL Pattern | Headers |
|-----------|--------|-------------|---------|
| List all | GET | `{PATH}/all` | accept, Authorization |
| Get one | GET | `{PATH}/{id}` | accept, Authorization |
| Get owner's | GET | `{PATH}/owner` | accept, Authorization |
| Create | POST | `{PATH}` | accept, Authorization, Content-Type |
| Update | PUT | `{PATH}/{id}` | accept, Authorization, Content-Type |
| Partial update | PATCH | `{PATH}/{action}/{id}` | accept, Authorization, Content-Type |
| Delete | DELETE | `{PATH}/{id}` | accept, Authorization |

**User creation with provider retry:**
```
POST {PATH_ODEP_USER}users?provider=http%3A%2F%2F127.0.0.1%3A{port}

Ports tried in sequence: 22000, 22001, 22002, 22003, 22004, 22005, 22006
Retry condition: HTTP 401 with "No available accounts"
```

### 11.4 cURL Request Examples

#### Authentication
```bash
curl -X POST {SWAGGER_URL}/v3/users/auth/sign_in \
  -H "Content-Type: application/json" \
  -d '{"userName":"john_doe","password":"SecurePass123!"}'
```

#### Create Offer
```bash
curl -X POST {SWAGGER_URL}/v3/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <odep_token>" \
  -d '{
    "assetId": 789,
    "transactionType": "sale/purchase",
    "price": 150.00,
    "offeredQuantity": 1000,
    "validityLimit": "2026-12-31T23:59:59Z",
    "country": "France"
  }'
```

#### Get enriched offers
```bash
curl -X GET "{SWAGGER_URL}/v3/offers/all/Mapped" \
  -H "Authorization: Bearer <odep_token>"
```

#### Create contract
```bash
curl -X POST {SWAGGER_URL}/v3/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <odep_token>" \
  -d '{"offerId": 12345, "quantity": 500}'
```

### 11.5 Glossary

| Term | Definition |
|------|------------|
| **ODEP** | Orange Digital Energy Platform — blockchain API managing core business data |
| **Prosumer** | Producer-Consumer: user who can produce and consume resources |
| **Asset** | Resource/product owned by a prosumer |
| **AssetType** | Standardized asset category (nature: measurableByQuantity or measurableByTime) |
| **Offer** | Sale/rental offer for an asset |
| **Request** | Expression of interest in an offer (precedes contract) |
| **Contract** | Formalized agreement between buyer and seller |
| **Regulator** | Regulatory entity overseeing compliance for asset types |
| **Enrichment** | Pattern of merging ODEP data with local MongoDB supplementary data |
| **Custom Endpoint** | RESILINK endpoint that combines ODEP + local data (vs ODEP-only endpoint) |
| **JWT** | JSON Web Token — authentication token (provided by ODEP) |
| **AES-256** | Advanced Encryption Standard 256 bits (phone number encryption) |
| **Swagger** | Interactive API documentation |
| **Provider Retry** | Load-balancing pattern for ODEP user creation (ports 22000-22006) |

### 11.6 Contacts and Support

**Lead Developer:**
- Axel Cazaux
- UPPA (University of Pau and Pays de l'Adour)

**Repository:**
- GitHub: https://github.com/ZiQuwi/RESILINK_Render_Server
- Branch: `main` (production with ODEP)
- Branch: `dev` (development with ODEP)
- Branch: `MainWithoutODEP` (autonomous version without ODEP)

**Documentation:**
- Swagger: `{SWAGGER_URL}/v3/api-docs`
- README: https://github.com/ZiQuwi/RESILINK_Render_Server/blob/main/README.md

### 11.7 License

**License**: UPPA  
**Copyright**: © 2026 Axel Cazaux - UPPA

Usage authorized within the RESILINK project framework only.

---

## End of Document

**Version**: 3.0  
**Last Updated**: April 2, 2026  
**Pages**: ~40  
**Word Count**: ~10,000
