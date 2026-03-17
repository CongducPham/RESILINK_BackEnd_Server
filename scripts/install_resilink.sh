#!/bin/bash

echo "=== RESILINK Server Installation and Database Setup (Linux) ==="
echo "=== Version: MainWithoutODEP                                ==="
echo "========================================================="

# 1) Update system
sudo apt update -y
echo "========================================================="

# 2) Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "MongoDB not found. Installing..."

    # Import the MongoDB public GPG key (modern method)
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

    # Add the MongoDB 6.0 repository for Ubuntu 22.04+
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" \
        | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

    sudo apt update
    sudo apt install -y mongodb-org

    sudo systemctl enable mongod
    sudo systemctl start mongod

    echo "MongoDB installed successfully."
else
    echo "MongoDB already installed."
    sudo systemctl restart mongod
fi
echo "========================================================="

# 3) Generate encryption, token, and network keys
ENCRYPTION_KEY=$(openssl rand -hex 32)
TOKEN_KEY=$(openssl rand -hex 32)
RESILINK_NETWORK_KEY=$(openssl rand -hex 32)

echo "Generated keys (save these safely):"
echo "  ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "  TOKEN_KEY=$TOKEN_KEY"
echo "  RESILINK_NETWORK_KEY=$RESILINK_NETWORK_KEY"
echo "Use them in your RESILINK_Server.env"
echo "========================================================="

# Save keys to home directory in readable format
KEY_FILE="$HOME/resilink_keys.txt"
{
  echo "# RESILINK Server Keys - Generated on $(date)"
  echo "# Keep this file safe and remove it after configuring your .env"
  echo ""
  echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
  echo "TOKEN_KEY=$TOKEN_KEY"
  echo "RESILINK_NETWORK_KEY=$RESILINK_NETWORK_KEY"
} > "$KEY_FILE"

echo "Keys saved to: $KEY_FILE"
echo "========================================================="

# 4) Install Node.js if missing
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    sudo apt install -y nodejs npm
else
    echo "Node.js already installed: $(node -v)"
fi
echo "========================================================="

# 5) Install project dependencies
echo "Installing Node.js project dependencies..."
PROJECT_DIR="$(dirname "$(pwd)")"
cd "$PROJECT_DIR" || exit 1
npm install
echo "========================================================="

# 6) Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
until mongosh --eval "db.adminCommand('ping')" &>/dev/null; do
  echo "MongoDB not ready yet, waiting..."
  sleep 2
done
echo "MongoDB is up!"
echo "========================================================="

# 7) Create MongoDB databases and collections
echo "Creating databases and collections..."
mongosh <<EOF

// === Logs Database ===
use Logs
db.createCollection("ConnectionLogs")
db.createCollection("DeleteLogs")
db.createCollection("GetLogs")
db.createCollection("PatchLogs")
db.createCollection("PutLogs")
db.createCollection("SecurityLogs")
print("Logs database collections created.")

// === Main Application Database ===
use ResilinkWithoutODEP
db.createCollection("Asset")
db.createCollection("AssetType")
db.createCollection("Counters")
db.createCollection("FavoriteServers")
db.createCollection("GlobalRecommendationStats")
db.createCollection("News")
db.createCollection("Offer")
db.createCollection("Rating")
db.createCollection("RecommendationStats")
db.createCollection("RegisteredServers")
db.createCollection("prosumer")
db.createCollection("user")

// === Create unique indexes ===
db.RegisteredServers.createIndex({ serverName: 1 }, { unique: true })
db.RegisteredServers.createIndex({ serverUrl: 1 }, { unique: true })
db.Offer.createIndex({ id: 1 }, { unique: true })
db.Asset.createIndex({ id: 1 }, { unique: true })
db.AssetType.createIndex({ name: 1 }, { unique: true })
db.FavoriteServers.createIndex({ id: 1 }, { unique: true })
db.Rating.createIndex({ userId: 1 }, { unique: true })
db.RecommendationStats.createIndex({ name: 1 }, { unique: true })
db.prosumer.createIndex({ id: 1 }, { unique: true })
db.user.createIndex({ userName: 1 }, { unique: true })
db.user.createIndex({ email: 1 }, { unique: true })
print("ResilinkWithoutODEP database collections and indexes created.")

EOF
echo "Collections and indexes created."
echo "========================================================="

# 8) Create admin user with bcrypt-hashed password
CREATE_ADMIN_FILE="$PROJECT_DIR/createAdmin.js"
cat > "$CREATE_ADMIN_FILE" <<'SCRIPT_START'
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";
SCRIPT_START

# Inject the encryption key value (outside single-quoted heredoc so variable expands)
echo "const encryptionKey = Buffer.from(\"$ENCRYPTION_KEY\", \"hex\");" >> "$CREATE_ADMIN_FILE"

cat >> "$CREATE_ADMIN_FILE" <<'SCRIPT_END'

function encryptAES(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("ResilinkWithoutODEP");
    const userCol = db.collection("user");

    const existing = await userCol.findOne({ userName: "admin" });
    if (existing) {
      console.log("Admin user already exists. Skipping.");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

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
      accessToken: ""
    };

    await userCol.insertOne(adminUser);
    console.log("Admin user created successfully (password: bcrypt, email: AES-encrypted).");
  } catch (err) {
    console.error("Error creating admin user:", err);
  } finally {
    await client.close();
  }
})();
SCRIPT_END

# Run the admin creation script within project context (bcrypt is installed via npm)
echo "Running admin creation script..."
node "$CREATE_ADMIN_FILE"
rm "$CREATE_ADMIN_FILE"
echo "========================================================="

# 9) Configure the .env file with generated keys
ENV_FILE="$PROJECT_DIR/RESILINK_Server.env"
if [ -f "$ENV_FILE" ]; then
    echo "Updating RESILINK_Server.env with generated keys..."
    sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
    sed -i "s/^TOKEN_KEY=.*/TOKEN_KEY=$TOKEN_KEY/" "$ENV_FILE"
    sed -i "s/^RESILINK_NETWORK_KEY=.*/RESILINK_NETWORK_KEY=$RESILINK_NETWORK_KEY/" "$ENV_FILE"
    echo "Keys updated in RESILINK_Server.env"
else
    echo "WARNING: RESILINK_Server.env not found at $ENV_FILE"
    echo "You will need to manually configure your .env file with the generated keys."
fi
echo "========================================================="

echo ""
echo "=== Setup completed successfully ==="
echo ""
echo "Next steps:"
echo "  1. Review and configure RESILINK_Server.env:"
echo "     - IP_ADDRESS, PORT, SWAGGER_URL"
echo "     - SERVER_NAME (display name for federated server discovery)"
echo "     - TOKEN_REQUIRED (true/false — controls GET endpoint authentication)"
echo "     - CENTRAL_SERVER_URL (URL of the central federation server)"
echo "     - DB_URL (MongoDB connection string for ResilinkWithoutODEP)"
echo "     - DB_LOGS_URL (MongoDB connection string for Logs database)"
echo "  2. Start the server: node src/index.js"
echo "  3. Default admin credentials: admin / admin123"
echo ""
