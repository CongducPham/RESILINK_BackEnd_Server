#!/bin/bash

echo "=== MongoDB Installation and Database Setup (Linux) ==="

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

# 3) Generate encryption and token keys
ENCRYPTION_KEY=$(openssl rand -hex 32)
TOKEN_KEY=$(openssl rand -hex 32)

echo "Generated encryption & token keys (save this safely):"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "TOKEN_KEY=$TOKEN_KEY"
echo "Use them in your RESILINK_Server.env"
echo "========================================================="

# Save keys to home directory in readable format
KEY_FILE="$HOME/resilink_key.txt"
{
  echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
  echo "TOKEN_KEY=$TOKEN_KEY"
} > "$KEY_FILE"

echo "Keys saved to: $KEY_FILE"

# 4) Install Node.js if missing
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    sudo apt install -y nodejs npm
else
    echo "Node.js already installed."
fi

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
mongosh <<EOF
use Logs
db.createCollection("ConnectionLogs")
db.createCollection("DeleteLogs")
db.createCollection("GetLogs")
db.createCollection("PatchLogs")
db.createCollection("PutLogs")

use Resilink
db.createCollection("Asset")
db.createCollection("AssetType")
db.createCollection("News")
db.createCollection("Offer")
db.createCollection("Rating")
db.createCollection("prosumer")
db.createCollection("user")
EOF
echo "Collections created."
echo "========================================================="

# 8) Create admin user with encrypted password
CREATE_ADMIN_FILE="$PROJECT_DIR/createAdmin.js"
echo $CREATE_ADMIN_FILE
cat > "$CREATE_ADMIN_FILE" <<EOL
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";
const encryptionKey = Buffer.from("$ENCRYPTION_KEY", "hex");

function encryptAES(password) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

const adminUser = {
  userName: "admin",
  firstName: "admin",
  lastName: "admin",
  roleOfUser: "admin",
  email: "admin@gmail.com",
  password: encryptAES("admin123"),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessToken: ""
};

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("Resilink");
    const userCol = db.collection("user");
    const existing = await userCol.findOne({ userName: "admin" });
    if (!existing) {
      await userCol.insertOne(adminUser);
      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (err) {
    console.error("Error creating admin user:", err);
  } finally {
    await client.close();
  }
})();
EOL

# Run the admin creation script within project context
echo "Running admin creation script..."
node "$CREATE_ADMIN_FILE"
rm "$CREATE_ADMIN_FILE"

echo "=== Setup completed successfully ==="
