# =============================================================================
# RESILINK Server Installation and Database Setup (Windows PowerShell)
# Version: Main (ODEP)
# =============================================================================

Write-Host "=== RESILINK Server Installation and Database Setup (Windows) ===" -ForegroundColor Cyan
Write-Host "=== Version: Main (ODEP)                                      ===" -ForegroundColor Cyan
Write-Host "========================================================="

# ---------------------------------------------------
# 1) Check if MongoDB is installed, attempt auto-install via winget
# ---------------------------------------------------
$mongod = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongod) {
    Write-Host "MongoDB not found. Attempting automatic installation via winget..." -ForegroundColor Yellow

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "Installing MongoDB Community Server via winget..."
        & winget install --id MongoDB.Server --accept-source-agreements --accept-package-agreements
        # Refresh PATH after installation
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $mongod = Get-Command mongod -ErrorAction SilentlyContinue
    }

    if (-not $mongod) {
        Write-Host "Automatic installation failed or winget not available." -ForegroundColor Red
        Write-Host "Please install MongoDB Community Server manually from:"
        Write-Host "  https://www.mongodb.com/try/download/community" -ForegroundColor Green
        Write-Host "After installation, re-run this script."
        exit 1
    } else {
        Write-Host "MongoDB installed successfully." -ForegroundColor Green
    }
} else {
    Write-Host "MongoDB found: $($mongod.Source)" -ForegroundColor Green
}

$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongosh) {
    Write-Host "mongosh (MongoDB Shell) not found. Attempting installation via winget..." -ForegroundColor Yellow

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        & winget install --id MongoDB.Shell --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
    }

    if (-not $mongosh) {
        Write-Host "Automatic installation failed or winget not available." -ForegroundColor Red
        Write-Host "Please install mongosh manually from:"
        Write-Host "  https://www.mongodb.com/try/download/shell" -ForegroundColor Green
        Write-Host "After installation, re-run this script."
        exit 1
    } else {
        Write-Host "mongosh installed successfully." -ForegroundColor Green
    }
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
# 3) Generate encryption and token keys
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

Write-Host "Generated keys (save these safely):" -ForegroundColor Cyan
Write-Host "  ENCRYPTION_KEY=$ENCRYPTION_KEY"
Write-Host "  TOKEN_KEY=$TOKEN_KEY"
Write-Host "Use them in your RESILINK_Server.env"
Write-Host "========================================================="

# Save keys to user profile directory
$keyFile = Join-Path $env:USERPROFILE "resilink_keys.txt"
@"
# RESILINK Server Keys (ODEP) - Generated on $(Get-Date)
# Keep this file safe and remove it after configuring your .env

ENCRYPTION_KEY=$ENCRYPTION_KEY
TOKEN_KEY=$TOKEN_KEY
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

// === Create unique index (only Rating is fully managed locally) ===
db.Rating.createIndex({ userId: 1 }, { unique: true })
print("Resilink database collections and indexes created.")
"@

$mongoScriptFile = Join-Path $projectDir "setup_collections.js"
$mongoScript | Out-File -FilePath $mongoScriptFile -Encoding UTF8
& mongosh --file $mongoScriptFile
Remove-Item $mongoScriptFile -Force

Write-Host "Collections and indexes created." -ForegroundColor Green
Write-Host "========================================================="

# ---------------------------------------------------
# 8) Configure the .env file with generated keys
# ---------------------------------------------------
$envFile = Join-Path $projectDir "RESILINK_Server.env"
if (Test-Path $envFile) {
    Write-Host "Updating RESILINK_Server.env with generated keys..."
    $content = Get-Content $envFile -Raw
    $content = $content -replace "(?m)^ENCRYPTION_KEY=.*", "ENCRYPTION_KEY=$ENCRYPTION_KEY"
    $content = $content -replace "(?m)^TOKEN_KEY=.*", "TOKEN_KEY=$TOKEN_KEY"
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
Write-Host "     - DB_MODE (atlas or local)"
Write-Host "     - DB_URL, DB_LOGS_URL (if DB_MODE=atlas)"
Write-Host "     - PATH_ODEP_* (ODEP API URLs - confidential, request from ORANGE)"
Write-Host "  2. Start the server: node src/index.js"
Write-Host ""
