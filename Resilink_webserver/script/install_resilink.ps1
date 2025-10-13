Write-Host "=== MongoDB Installation and Database Setup (Windows) ==="

# --- 1) Check if MongoDB is installed ---
if (-Not (Get-Command mongod -ErrorAction SilentlyContinue)) {
    Write-Host "MongoDB not found. Installing..."

    # Download and install MongoDB 4.4 MSI (Community Edition)
    $mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.0-signed.msi"
    $installerPath = "$env:TEMP\mongodb.msi"

    Invoke-WebRequest -Uri $mongoUrl -OutFile $installerPath
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installerPath`" /quiet INSTALLLOCATION=`"C:\Program Files\MongoDB\Server\4.4\`" ADDLOCAL=All"
    
    Write-Host "MongoDB installed."
} else {
    Write-Host "MongoDB already installed."
}

# --- 2) Start MongoDB service ---
Write-Host "Starting MongoDB service..."
Start-Service "MongoDB" -ErrorAction SilentlyContinue
Set-Service "MongoDB" -StartupType Automatic

# --- 3) Generate encryption key ---
$encryptionKey = -join ((65..70 + 48..57 + 97..102) | Get-Random -Count 64 | % {[char]$_})
Write-Host "Generated encryption key (save this safely):"
Write-Host $encryptionKey

# Save key to user profile (optional)
$keyFile = "$env:USERPROFILE\resilink_key.txt"
$encryptionKey | Out-File -FilePath $keyFile -Encoding ascii
Write-Host "Encryption key also saved to: $keyFile"

# --- 4) Create MongoDB databases and collections ---
$mongoCommands = @"
use Logs
db.createCollection("ConnectionLogs")
db.createCollection("DeleteLogs")
db.createCollection("GetLogs")
db.createCollection("PatchLogs")
db.createCollection("PutLogs")

use Resilink
db.createCollection("Asset")
db.createCollection("AssetType")
db.createCollection("AssetTypeCounter")
db.createCollection("News")
db.createCollection("Offer")
db.createCollection("Rating")
db.createCollection("prosumer")
db.createCollection("user")
"@

$mongoCommands | & "C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe"

# --- 5) Create admin user with encrypted password ---
$createAdminJs = @"
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017";
const encryptionKey = Buffer.from("$encryptionKey", "hex");

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
  password: encryptAES("123456"),
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
      console.log("Admin user created.");
    } else {
      console.log("Admin user already exists.");
    }
  } finally {
    await client.close();
  }
})();
"@

$adminScriptPath = "$env:TEMP\createAdmin.js"
$createAdminJs | Out-File -FilePath $adminScriptPath -Encoding utf8

& "node.exe" $adminScriptPath

Remove-Item $adminScriptPath

Write-Host "=== Setup completed successfully! ==="

