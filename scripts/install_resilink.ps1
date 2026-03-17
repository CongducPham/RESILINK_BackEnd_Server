# =============================================================================
# RESILINK Server Installation and Database Setup (Windows PowerShell)
# Version: MainWithoutODEP
# =============================================================================

Write-Host "=== RESILINK Server Installation and Database Setup (Windows) ===" -ForegroundColor Cyan
Write-Host "=== Version: MainWithoutODEP                                  ===" -ForegroundColor Cyan
Write-Host "========================================================="

# ---------------------------------------------------
# 1) Check if MongoDB is installed
# ---------------------------------------------------
$mongod = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongod) {
    Write-Host "MongoDB not found." -ForegroundColor Yellow
    Write-Host "Please install MongoDB Community Server manually from:"
    Write-Host "  https://www.mongodb.com/try/download/community" -ForegroundColor Green
    Write-Host "After installation, re-run this script."
    exit 1
} else {
    Write-Host "MongoDB found: $($mongod.Source)" -ForegroundColor Green
}

$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongosh) {
    Write-Host "mongosh (MongoDB Shell) not found." -ForegroundColor Yellow
    Write-Host "Please install mongosh from:"
    Write-Host "  https://www.mongodb.com/try/download/shell" -ForegroundColor Green
    Write-Host "After installation, re-run this script."
    exit 1
} else {
    Write-Host "mongosh found: $($mongosh.Source)" -ForegroundColor Green
}
Write-Host "========================================================="

# ---------------------------------------------------
# 2) Ensure MongoDB service is running
# ---------------------------------------------------
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    if ($mongoService.Status -ne "Running") {
        Write-Host "Starting MongoDB service..."
        Start-Service -Name "MongoDB"
    } else {
        Write-Host "MongoDB service is running." -ForegroundColor Green
    }
} else {
    Write-Host "MongoDB service not found. Make sure mongod is running manually." -ForegroundColor Yellow
}
Write-Host "========================================================="

# ---------------------------------------------------
# 3) Generate encryption, token, and network keys
# ---------------------------------------------------
function New-HexKey {
    param([int]$Bytes = 32)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buffer = New-Object byte[] $Bytes
    $rng.GetBytes($buffer)
    return ($buffer | ForEach-Object { $_.ToString("x2") }) -join ""
}

$ENCRYPTION_KEY = New-HexKey -Bytes 32
$TOKEN_KEY = New-HexKey -Bytes 32
$RESILINK_NETWORK_KEY = New-HexKey -Bytes 32

Write-Host "Generated keys (save these safely):" -ForegroundColor Cyan
Write-Host "  ENCRYPTION_KEY=$ENCRYPTION_KEY"
Write-Host "  TOKEN_KEY=$TOKEN_KEY"
Write-Host "  RESILINK_NETWORK_KEY=$RESILINK_NETWORK_KEY"
Write-Host "Use them in your RESILINK_Server.env"
Write-Host "========================================================="

# Save keys to user profile directory
$keyFile = Join-Path $env:USERPROFILE "resilink_keys.txt"
@"
# RESILINK Server Keys - Generated on $(Get-Date)
# Keep this file safe and remove it after configuring your .env

ENCRYPTION_KEY=$ENCRYPTION_KEY
TOKEN_KEY=$TOKEN_KEY
RESILINK_NETWORK_KEY=$RESILINK_NETWORK_KEY
"@ | Out-File -FilePath $keyFile -Encoding UTF8

Write-Host "Keys saved to: $keyFile" -ForegroundColor Green
Write-Host "========================================================="

# ---------------------------------------------------
# 4) Check Node.js
# ---------------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js not found." -ForegroundColor Yellow
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Green
    Write-Host "After installation, re-run this script."
    exit 1
} else {
    $nodeVersion = & node -v
    Write-Host "Node.js already installed: $nodeVersion" -ForegroundColor Green
}
Write-Host "========================================================="

# ---------------------------------------------------
# 5) Install project dependencies
# ---------------------------------------------------
Write-Host "Installing Node.js project dependencies..."
$projectDir = Split-Path -Parent (Get-Location)
Set-Location $projectDir
& npm install
Write-Host "========================================================="

# ---------------------------------------------------
# 6) Wait for MongoDB to be ready
# ---------------------------------------------------
Write-Host "Waiting for MongoDB to start..."
$ready = $false
$attempts = 0
while (-not $ready -and $attempts -lt 15) {
    try {
        $result = & mongosh --quiet --eval "db.adminCommand('ping')" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
        }
    } catch {}
    if (-not $ready) {
        Write-Host "MongoDB not ready yet, waiting..."
        Start-Sleep -Seconds 2
        $attempts++
    }
}
if (-not $ready) {
    Write-Host "ERROR: MongoDB did not become ready after 30 seconds." -ForegroundColor Red
    Write-Host "Please ensure MongoDB is running and try again."
    exit 1
}
Write-Host "MongoDB is up!" -ForegroundColor Green
Write-Host "========================================================="

# ---------------------------------------------------
# 7) Create MongoDB databases and collections
# ---------------------------------------------------
Write-Host "Creating databases and collections..."

$mongoScript = @"
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
"@

$mongoScriptFile = Join-Path $projectDir "setup_collections.js"
$mongoScript | Out-File -FilePath $mongoScriptFile -Encoding UTF8
& mongosh --file $mongoScriptFile
Remove-Item $mongoScriptFile -Force

Write-Host "Collections and indexes created." -ForegroundColor Green
Write-Host "========================================================="

# ---------------------------------------------------
# 8) Create admin user with bcrypt-hashed password
# ---------------------------------------------------
$createAdminScript = @"
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";
const encryptionKey = Buffer.from("$ENCRYPTION_KEY", "hex");

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
"@

$adminScriptFile = Join-Path $projectDir "createAdmin.js"
$createAdminScript | Out-File -FilePath $adminScriptFile -Encoding UTF8

Write-Host "Running admin creation script..."
& node $adminScriptFile
Remove-Item $adminScriptFile -Force
Write-Host "========================================================="

# ---------------------------------------------------
# 9) Configure the .env file with generated keys
# ---------------------------------------------------
$envFile = Join-Path $projectDir "RESILINK_Server.env"
if (Test-Path $envFile) {
    Write-Host "Updating RESILINK_Server.env with generated keys..."
    $content = Get-Content $envFile -Raw
    $content = $content -replace "(?m)^ENCRYPTION_KEY=.*", "ENCRYPTION_KEY=$ENCRYPTION_KEY"
    $content = $content -replace "(?m)^TOKEN_KEY=.*", "TOKEN_KEY=$TOKEN_KEY"
    $content = $content -replace "(?m)^RESILINK_NETWORK_KEY=.*", "RESILINK_NETWORK_KEY=$RESILINK_NETWORK_KEY"
    $content | Set-Content $envFile -Encoding UTF8
    Write-Host "Keys updated in RESILINK_Server.env" -ForegroundColor Green
} else {
    Write-Host "WARNING: RESILINK_Server.env not found at $envFile" -ForegroundColor Yellow
    Write-Host "You will need to manually configure your .env file with the generated keys."
}
Write-Host "========================================================="

Write-Host ""
Write-Host "=== Setup completed successfully ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review and configure RESILINK_Server.env:"
Write-Host "     - IP_ADDRESS, PORT, SWAGGER_URL"
Write-Host "     - SERVER_NAME (display name for federated server discovery)"
Write-Host "     - TOKEN_REQUIRED (true/false - controls GET endpoint authentication)"
Write-Host "     - CENTRAL_SERVER_URL (URL of the central federation server)"
Write-Host "     - DB_URL (MongoDB connection string for ResilinkWithoutODEP)"
Write-Host "     - DB_LOGS_URL (MongoDB connection string for Logs database)"
Write-Host "  2. Start the server: node src/index.js"
Write-Host "  3. Default admin credentials: admin / admin123"
Write-Host ""
