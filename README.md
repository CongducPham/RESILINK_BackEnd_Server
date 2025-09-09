# RESILINK - Node.js API for a User Exchange Platform

RESILINK is an API built with **Node.js** and **Express**, using **Swagger** for documentation. This API allows you to develop a platform for exchanges between users, with data stored in a **MongoDB** database. It integrates with **ODEP**, an API provided by **ORANGE** to structure interactions between users. The API is free, accessible to everyone, and can be deployed locally by developers.

**Note**: A variant of this platform is available in the `MainWithoutODEP` branch. It is a self-contained v2 version that does **not** rely on the **ODEP API**, making it fully **self-deployed** without external dependencies.

## Main Features

- RESTful API built with **Express** and documented with **Swagger**.
- Connection to a **MongoDB** database for managing users and exchanges.
- Integration with the **ODEP API** by ORANGE to structure interactions.
- Encryption of sensitive data using AES-256.
- Easy local or server deployment with configuration via an `.env` file.

## Prerequisites

- **Node.js** (v18.20 or later)
- **MongoDB** (Cloud MongoDB cluster(may be on a local MongoDB instance in the future if needed))
- **ODEP API** (URLs to be requested from ORANGE)

## Installation

At the root of the project folder:

1. **Clone the project**:

```bash
git clone https://github.com/ZiQuwi/RESILINK_Render_Server
```

2. **Install dependencies**:

```bash
npm install
```

3. **Configure environment variables**:

Create a file named **`RESILINK_Server.env`** at the root of the project with the following variables:

```
IP_ADDRESS= 0.0.0.0
PORT=3000
SWAGGER_URL=http://0.0.0.0:3000
ENCRYPTION_KEY=b32c32aac9c6afd06ab3554415de5edbafc14ef97cc6d0e4ffa678220a57b39f
TOKEN_KEY=f0d8cd085ada735ac45c30e3368b5b4c87a8e7fb9828a2289af5065bad05b015
DB_URL= e.g. mongodb+srv://username:password@cluster.mongodb.net/db_name
DB_LOGS_URL= e.g. mongodb+srv://username:password@cluster.mongodb.net/db_name
# URLs to access the ODEP API (must be requested from ORANGE or the following address: axel.cazaux@univ-pau.fr)
PATH_ODEP_USER=https://api.orange.com/odep/user
PATH_ODEP_PROSUMER=https://api.orange.com/odep/prosumer
PATH_ODEP_REGULATOR=https://api.orange.com/odep/regulator
PATH_ODEP_ASSET=https://api.orange.com/odep/asset
PATH_ODEP_ASSETTYPE=https://api.orange.com/odep/assettype
PATH_ODEP_OFFER=https://api.orange.com/odep/offer
PATH_ODEP_REQUEST=https://api.orange.com/odep/request
PATH_ODEP_CONTRACT=https://api.orange.com/odep/contract
```

> **Note**: Replace the placeholder values with your actual keys and URLs.

The API automatically imports the `RESILINK_Server.env` file. Ensure that the file is named correctly to avoid manual updates in the code.

4. **Start the server**:

```bash
node src/index.js
```

By default, the server will start on the port defined in the `.env` file (or port 3000 if not specified). You can access your Swagger documentation for the API at the following address after starting the server:

```
http://localhost:3000/api-docs
```

## Usage

The **RESILINK** API allows interaction between users on the platform through various routes, following the structure of the **ODEP API** to organize exchanges.

The main routes manage:
- **Users** (USER)
- **Prosumers** (PROSUMER)
- **Regulators** (REGULATOR)
- **Assets** (ASSET)
- **Asset Types** (ASSETTYPE)
- **Offers** (OFFER)
- **Requests** (REQUEST)
- **Contracts** (CONTRACT)
- **News** (NEWS)
- **Rating** (RATING)

## Project Structure

```
/src
    /v1
        /controllers      # Handles HTTP requests and responses, interacts with services
        /services         # Business logic for the API
        /database         # Manage data in MongoDB
        /models           # Entity models
        /routes           # API route definitions with swagger annotations
        config.js         # Configuration variable
        errors.js         # Definitions of the various errors
        loggers.js        # Log management
        swaggersV1.js     # Definition of the swagger page 
    index.js            # Main entry point of the API
RESILINK_Server.env   # Environment variables configuration file
package.json	      # Packages files
```

## API Documentation

The complete documentation for the API is available through **Swagger**. You can view the RESILINK documentation at the following URL:

```
https://resilink-api.onrender.com/v1/api-docs
```

This documentation provides details about the HTTP methods, expected parameters, and responses for each route.

## Deployment

To deploy this API in a production environment, ensure that all environment variables are correctly configured, including the MongoDB cluster URL and the ODEP API URLs.

## License

University of Pau and the Pays de l'Adour.
