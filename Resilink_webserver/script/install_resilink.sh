#!/bin/bash

echo "=== RESILINK Server Installation and Database Setup (Linux) ==="
echo "=== Version: Main (ODEP)                                    ==="
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

# 3) Generate encryption and token keys
ENCRYPTION_KEY=$(openssl rand -hex 32)
TOKEN_KEY=$(openssl rand -hex 32)

echo "Generated keys (save these safely):"
echo "  ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "  TOKEN_KEY=$TOKEN_KEY"
echo "Use them in your RESILINK_Server.env"
echo "========================================================="

# Save keys to home directory in readable format
KEY_FILE="$HOME/resilink_keys.txt"
{
  echo "# RESILINK Server Keys (ODEP) - Generated on $(date)"
  echo "# Keep this file safe and remove it after configuring your .env"
  echo ""
  echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
  echo "TOKEN_KEY=$TOKEN_KEY"
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
print("Logs database collections created.")

// === Main Application Database ===
use Resilink
db.createCollection("Asset")
db.createCollection("Counters")
db.createCollection("News")
db.createCollection("Offer")
db.createCollection("Rating")
db.createCollection("prosumer")
db.createCollection("user")

// === Create unique index ===
db.Rating.createIndex({ userId: 1 }, { unique: true })
print("Resilink database collections and indexes created.")

EOF
echo "Collections and indexes created."
echo "========================================================="

# 8) Configure the .env file with generated keys
ENV_FILE="$PROJECT_DIR/RESILINK_Server.env"
if [ -f "$ENV_FILE" ]; then
    echo "Updating RESILINK_Server.env with generated keys..."
    sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
    sed -i "s/^TOKEN_KEY=.*/TOKEN_KEY=$TOKEN_KEY/" "$ENV_FILE"
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
echo "     - DB_MODE (atlas or local)"
echo "     - DB_URL, DB_LOGS_URL (if DB_MODE=atlas)"
echo "     - PATH_ODEP_* (ODEP API URLs — confidential, request from ORANGE)"
echo "  2. Start the server: node src/index.js"
echo ""
