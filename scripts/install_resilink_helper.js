// =============================================================================
// RESILINK Server Setup Helper (called by install_resilink.bat)
// Handles: key generation, MongoDB setup, admin creation, .env configuration
// =============================================================================

const crypto = require("crypto");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");

const projectDir = path.resolve(__dirname, "..");
const uri = "mongodb://127.0.0.1:27017";

(async () => {
  try {
    // ---------------------------------------------------
    // 1) Generate encryption, token, and network keys
    // ---------------------------------------------------
    const ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
    const TOKEN_KEY = crypto.randomBytes(32).toString("hex");
    const RESILINK_NETWORK_KEY = crypto.randomBytes(32).toString("hex");

    console.log("=========================================================");
    console.log("Generated keys (save these safely):");
    console.log(`  ENCRYPTION_KEY=${ENCRYPTION_KEY}`);
    console.log(`  TOKEN_KEY=${TOKEN_KEY}`);
    console.log(`  RESILINK_NETWORK_KEY=${RESILINK_NETWORK_KEY}`);
    console.log("Use them in your RESILINK_Server.env");
    console.log("=========================================================");

    // Save keys to user home directory
    const keyFile = path.join(os.homedir(), "resilink_keys.txt");
    const keyContent = [
      `# RESILINK Server Keys - Generated on ${new Date().toISOString()}`,
      "# Keep this file safe and remove it after configuring your .env",
      "",
      `ENCRYPTION_KEY=${ENCRYPTION_KEY}`,
      `TOKEN_KEY=${TOKEN_KEY}`,
      `RESILINK_NETWORK_KEY=${RESILINK_NETWORK_KEY}`,
    ].join("\n");
    fs.writeFileSync(keyFile, keyContent, "utf8");
    console.log(`Keys saved to: ${keyFile}`);
    console.log("=========================================================");

    // ---------------------------------------------------
    // 2) Wait for MongoDB to be ready
    // ---------------------------------------------------
    console.log("Waiting for MongoDB to start...");
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 15) {
      try {
        execSync('mongosh --quiet --eval "db.adminCommand(\'ping\')"', { stdio: "ignore" });
        ready = true;
      } catch {
        console.log("MongoDB not ready yet, waiting...");
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
      }
    }
    if (!ready) {
      console.error("ERROR: MongoDB did not become ready after 30 seconds.");
      console.error("Please ensure MongoDB is running and try again.");
      process.exit(1);
    }
    console.log("MongoDB is up!");
    console.log("=========================================================");

    // ---------------------------------------------------
    // 3) Create databases and collections
    // ---------------------------------------------------
    console.log("Creating databases and collections...");
    const client = new MongoClient(uri);
    await client.connect();

    // Logs database
    const logsDb = client.db("Logs");
    for (const col of ["ConnectionLogs", "DeleteLogs", "GetLogs", "PatchLogs", "PutLogs", "SecurityLogs"]) {
      await logsDb.createCollection(col).catch(() => {});
    }
    console.log("Logs database collections created.");

    // Main application database
    const mainDb = client.db("ResilinkWithoutODEP");
    const collections = [
      "Asset", "AssetType", "Counters", "FavoriteServers",
      "GlobalRecommendationStats", "News", "Offer", "Rating",
      "RecommendationStats", "RegisteredServers", "prosumer", "user",
    ];
    for (const col of collections) {
      await mainDb.createCollection(col).catch(() => {});
    }

    // Create unique indexes
    await mainDb.collection("RegisteredServers").createIndex({ serverName: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("RegisteredServers").createIndex({ serverUrl: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("Offer").createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("Asset").createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("AssetType").createIndex({ name: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("FavoriteServers").createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("Rating").createIndex({ userId: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("RecommendationStats").createIndex({ name: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("prosumer").createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("user").createIndex({ userName: 1 }, { unique: true }).catch(() => {});
    await mainDb.collection("user").createIndex({ email: 1 }, { unique: true }).catch(() => {});

    console.log("ResilinkWithoutODEP database collections and indexes created.");
    console.log("=========================================================");

    // ---------------------------------------------------
    // 4) Create admin user with bcrypt-hashed password
    // ---------------------------------------------------
    console.log("Creating admin user...");
    const encryptionKey = Buffer.from(ENCRYPTION_KEY, "hex");

    function encryptAES(value) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
      let encrypted = cipher.update(value, "utf8", "hex");
      encrypted += cipher.final("hex");
      return iv.toString("hex") + ":" + encrypted;
    }

    const userCol = mainDb.collection("user");
    const existing = await userCol.findOne({ userName: "admin" });
    if (existing) {
      console.log("Admin user already exists. Skipping.");
    } else {
      const hashedPassword = await bcrypt.hash("123456", 10);
      const adminUser = {
        _id: new ObjectId().toString(),
        phoneNumber: "",
        userName: "admin",
        firstName: "admin",
        lastName: "admin",
        roleOfUser: "admin",
        email: encryptAES("admin@gmail.com"),
        password: hashedPassword,
        gps: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessToken: "",
      };
      await userCol.insertOne(adminUser);
      console.log("Admin user created successfully (password: bcrypt, email: AES-encrypted).");
    }

    await client.close();
    console.log("=========================================================");

    // ---------------------------------------------------
    // 5) Configure the .env file with generated keys
    // ---------------------------------------------------
    const envFile = path.join(projectDir, "RESILINK_Server.env");
    if (fs.existsSync(envFile)) {
      console.log("Updating RESILINK_Server.env with generated keys...");
      let content = fs.readFileSync(envFile, "utf8");
      content = content.replace(/^ENCRYPTION_KEY=.*/m, `ENCRYPTION_KEY=${ENCRYPTION_KEY}`);
      content = content.replace(/^TOKEN_KEY=.*/m, `TOKEN_KEY=${TOKEN_KEY}`);
      content = content.replace(/^RESILINK_NETWORK_KEY=.*/m, `RESILINK_NETWORK_KEY=${RESILINK_NETWORK_KEY}`);
      fs.writeFileSync(envFile, content, "utf8");
      console.log("Keys updated in RESILINK_Server.env");
    } else {
      console.log("RESILINK_Server.env not found. Creating it with generated keys...");
      const envContent = [
        `ENCRYPTION_KEY=${ENCRYPTION_KEY}`,
        `TOKEN_KEY=${TOKEN_KEY}`,
        `RESILINK_NETWORK_KEY=${RESILINK_NETWORK_KEY}`,
        "IP_ADDRESS=",
        "PORT=",
        "SWAGGER_URL=",
        "SERVER_NAME=",
        "TOKEN_REQUIRED=",
        "CENTRAL_SERVER_URL=",
        "DB_MODE=local",
        "DB_URL=mongodb://127.0.0.1:27017/ResilinkWithoutODEP",
        "DB_LOGS_URL=mongodb://127.0.0.1:27017/Logs",
      ].join("\n");
      fs.writeFileSync(envFile, envContent, "utf8");
      console.log("RESILINK_Server.env created. Don't forget to fill in the remaining fields.");
    }
    console.log("=========================================================");

  } catch (err) {
    console.error("Setup failed:", err);
    process.exit(1);
  }
})();
