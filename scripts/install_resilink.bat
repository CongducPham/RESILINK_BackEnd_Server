@echo off
REM Resolve project directory from the script's location
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

echo === RESILINK Server Installation and Database Setup (Windows) ===
echo === Version: MainWithoutODEP                                  ===
echo =========================================================

REM Scan common install directories to detect previously installed tools
call :refresh_path

REM ---------------------------------------------------
REM 1) Check and install MongoDB Server
REM ---------------------------------------------------
echo Checking for MongoDB Server...
mongod --version >nul 2>&1
if %errorlevel% equ 0 goto :mongod_ok

REM Try to find mongod.exe in known locations even if not in PATH
call :find_mongod
if defined MONGOD_BIN goto :mongod_ok

echo MongoDB Server not found. Attempting automatic installation...
call :install_mongod
call :refresh_path

mongod --version >nul 2>&1
if %errorlevel% equ 0 goto :mongod_installed

call :find_mongod
if defined MONGOD_BIN goto :mongod_installed

echo ============================================================
echo ERROR: Automatic MongoDB installation failed.
echo Please install MongoDB Community Server manually from:
echo   https://www.mongodb.com/try/download/community
echo Then re-run this script.
echo ============================================================
pause
exit /b 1

:mongod_installed
echo MongoDB Server installed successfully.
goto :mongod_done
:mongod_ok
echo MongoDB Server found.
:mongod_done
REM Always inject MONGOD_BIN into PATH if found
if defined MONGOD_BIN (
    set "PATH=%MONGOD_BIN%;%PATH%"
    echo   Added to PATH: %MONGOD_BIN%
)
echo =========================================================

REM ---------------------------------------------------
REM 2) Check and install mongosh
REM ---------------------------------------------------
echo Checking for mongosh...
mongosh --version >nul 2>&1
if %errorlevel% equ 0 goto :mongosh_ok

call :find_mongosh
if defined MONGOSH_BIN goto :mongosh_ok

echo mongosh not found. Attempting automatic installation...
call :install_mongosh
call :refresh_path

mongosh --version >nul 2>&1
if %errorlevel% equ 0 goto :mongosh_installed

call :find_mongosh
if defined MONGOSH_BIN goto :mongosh_installed

echo ============================================================
echo ERROR: Automatic mongosh installation failed.
echo Please install mongosh manually from:
echo   https://www.mongodb.com/try/download/shell
echo Then re-run this script.
echo ============================================================
pause
exit /b 1

:mongosh_installed
echo mongosh installed successfully.
goto :mongosh_done
:mongosh_ok
echo mongosh found.
:mongosh_done
REM Always inject MONGOSH_BIN into PATH if found
if defined MONGOSH_BIN (
    set "PATH=%MONGOSH_BIN%;%PATH%"
    echo   Added to PATH: %MONGOSH_BIN%
)
echo =========================================================

REM ---------------------------------------------------
REM 3) Ensure MongoDB service is running
REM ---------------------------------------------------
echo Checking MongoDB service...
net start MongoDB >nul 2>&1
net start "MongoDB Server" >nul 2>&1
REM Verify MongoDB is actually responding (up to 3 attempts)
set MONGO_READY=0
for /L %%i in (1,1,3) do (
    mongosh --eval "db.runCommand({ping:1})" --quiet >nul 2>&1
    if not errorlevel 1 set MONGO_READY=1
)
if "%MONGO_READY%"=="1" goto :mongo_svc_ok

REM Try with full path if mongosh is not in PATH yet
if defined MONGOSH_BIN (
    for /L %%i in (1,1,3) do (
        "%MONGOSH_BIN%mongosh.exe" --eval "db.runCommand({ping:1})" --quiet >nul 2>&1
        if not errorlevel 1 set MONGO_READY=1
    )
)
if "%MONGO_READY%"=="1" goto :mongo_svc_ok

REM Service may not be registered - try starting mongod directly
echo   Service not responding, starting mongod directly...
call :find_mongod
if not defined MONGOD_BIN goto :mongo_svc_fail
if not exist "C:\data\db" mkdir "C:\data\db" >nul 2>&1
start "mongod" "%MONGOD_BIN%mongod.exe" --dbpath "C:\data\db"
set "MONGOD_STARTED_BY_SCRIPT=1"
timeout /t 5 /nobreak >nul
mongosh --eval "db.runCommand({ping:1})" --quiet >nul 2>&1
if %errorlevel% equ 0 goto :mongo_svc_ok
if defined MONGOSH_BIN (
    "%MONGOSH_BIN%mongosh.exe" --eval "db.runCommand({ping:1})" --quiet >nul 2>&1
    if not errorlevel 1 goto :mongo_svc_ok
)
:mongo_svc_fail
echo ============================================================
echo ERROR: Could not start MongoDB.
echo Please start the MongoDB service manually and re-run this script.
echo ============================================================
pause
exit /b 1
:mongo_svc_ok
echo MongoDB is running.
echo =========================================================

REM ---------------------------------------------------
REM 4) Check and install Node.js
REM ---------------------------------------------------
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 goto :node_ok
REM Check common install path even if not in PATH
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :node_ok
)
echo Node.js not found. Attempting automatic installation...
call :install_node
call :refresh_path
node --version >nul 2>&1
if %errorlevel% equ 0 goto :node_installed
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :node_installed
)
echo ============================================================
echo ERROR: Automatic Node.js installation failed.
echo Please install Node.js manually from: https://nodejs.org/
echo Then re-run this script.
echo ============================================================
pause
exit /b 1
:node_installed
echo Node.js installed successfully.
goto :node_done
:node_ok
for /f "tokens=*" %%v in ('node -v') do echo Node.js already installed: %%v
:node_done
echo =========================================================

REM ---------------------------------------------------
REM 5) Install project dependencies
REM ---------------------------------------------------
echo Installing Node.js project dependencies...
cd /d "%PROJECT_DIR%"
call npm install
echo =========================================================

REM ---------------------------------------------------
REM 6) Run the setup helper (keys, DB, admin, .env)
REM ---------------------------------------------------
echo Running setup helper...
node "%SCRIPT_DIR%install_resilink_helper.js"

if %errorlevel% neq 0 (
    echo ERROR: Setup helper failed.
    if "%MONGOD_STARTED_BY_SCRIPT%"=="1" (
        echo Stopping mongod started by this script...
        taskkill /FI "WINDOWTITLE eq mongod" /F >nul 2>&1
    )
    pause
    exit /b 1
)
echo =========================================================

REM ---------------------------------------------------
REM 7) Shut down mongod if WE started it (not a service)
REM ---------------------------------------------------
if "%MONGOD_STARTED_BY_SCRIPT%"=="1" (
    echo Stopping temporary mongod instance...
    taskkill /FI "WINDOWTITLE eq mongod" /F >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo mongod stopped.
    echo =========================================================
)

echo.
echo === Setup completed successfully ===
echo.
echo Next steps:
echo   1. Review and configure RESILINK_Server.env:
echo      - IP_ADDRESS, PORT, SWAGGER_URL
echo      - SERVER_NAME (display name for federated server discovery)
echo      - TOKEN_REQUIRED (true/false - controls GET endpoint authentication)
echo      - CENTRAL_SERVER_URL (URL of the central federation server)
echo      - DB_URL (MongoDB connection string for ResilinkWithoutODEP)
echo      - DB_LOGS_URL (MongoDB connection string for Logs database)
echo   2. Start the server: node src\index.js
echo   3. Default admin credentials: admin / admin123
echo.
pause
exit /b 0

REM ===================================================================
REM Subroutines
REM ===================================================================

REM ---------------------------------------------------
REM Find mongod.exe in all known MongoDB install locations
REM ---------------------------------------------------
:find_mongod
set "MONGOD_BIN="
REM Most common: C:\Program Files\MongoDB\Server\<version>\bin\
for /d %%v in ("C:\Program Files\MongoDB\Server\*") do (
    if exist "%%v\bin\mongod.exe" set "MONGOD_BIN=%%v\bin\"
)
REM Fallback: recursive search in case of non-standard layout
if not defined MONGOD_BIN (
    for /r "C:\Program Files\MongoDB" %%f in (mongod.exe) do (
        if exist "%%f" set "MONGOD_BIN=%%~dpf"
    )
)
goto :eof

REM ---------------------------------------------------
REM Find mongosh.exe in all known locations
REM ---------------------------------------------------
:find_mongosh
set "MONGOSH_BIN="
REM Bundled with MongoDB server (older installs)
for /d %%v in ("C:\Program Files\MongoDB\Server\*") do (
    if exist "%%v\bin\mongosh.exe" set "MONGOSH_BIN=%%v\bin\"
)
REM Standalone mongosh install in Program Files
if not defined MONGOSH_BIN (
    for /d %%v in ("C:\Program Files\mongosh\*") do (
        if exist "%%v\bin\mongosh.exe" set "MONGOSH_BIN=%%v\bin\"
    )
)
REM Also check root of mongosh folder (some versions put exe directly here)
if not defined MONGOSH_BIN (
    if exist "C:\Program Files\mongosh\mongosh.exe" set "MONGOSH_BIN=C:\Program Files\mongosh\"
)
REM Standalone mongosh install in AppData
if not defined MONGOSH_BIN (
    for /r "%LOCALAPPDATA%\Programs\mongosh" %%f in (mongosh.exe) do (
        if exist "%%f" set "MONGOSH_BIN=%%~dpf"
    )
)
REM Recursive fallback in MongoDB folder
if not defined MONGOSH_BIN (
    for /r "C:\Program Files\MongoDB" %%f in (mongosh.exe) do (
        if exist "%%f" set "MONGOSH_BIN=%%~dpf"
    )
)
goto :eof

REM ---------------------------------------------------
REM Install MongoDB Server
REM ---------------------------------------------------
:install_mongod
echo   Downloading MongoDB 6.0.27 installer...
set "MONGO_MSI=%TEMP%\mongodb-6.0.27.msi"
REM Use --output instead of -o to avoid silent failure on some curl builds
curl -L --progress-bar --output "%MONGO_MSI%" "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.27-signed.msi"
if not exist "%MONGO_MSI%" goto :mongod_try_winget
REM Check the file is not empty / truncated (should be ~500MB)
for %%F in ("%MONGO_MSI%") do if %%~zF LSS 1000000 (
    echo   Downloaded file is too small, installer may be corrupt.
    del "%MONGO_MSI%" >nul 2>&1
    goto :mongod_try_winget
)
echo   Installing MongoDB 6.0.27 silently (this may take a minute)...
%windir%\system32\msiexec.exe /i "%MONGO_MSI%" /qn /norestart SHOULD_INSTALL_COMPASS=0
set "MSI_RC=%errorlevel%"
del "%MONGO_MSI%" >nul 2>&1
echo   msiexec exit code: %MSI_RC%
call :find_mongod
if defined MONGOD_BIN goto :mongod_done_sub
echo   MSI install did not produce mongod.exe, trying next method...

:mongod_try_winget
winget --version >nul 2>&1
if %errorlevel% neq 0 goto :mongod_try_choco
echo   Trying winget...
winget install -e --id MongoDB.Server --accept-package-agreements --accept-source-agreements
if %errorlevel% equ 0 (
    call :find_mongod
    if defined MONGOD_BIN goto :mongod_done_sub
)
echo   winget install failed, trying next method...

:mongod_try_choco
choco --version >nul 2>&1
if %errorlevel% neq 0 goto :mongod_fail
echo   Trying Chocolatey...
choco install mongodb -y
if %errorlevel% equ 0 (
    call :find_mongod
    if defined MONGOD_BIN goto :mongod_done_sub
)
:mongod_fail
echo   No installation method succeeded for MongoDB Server.
:mongod_done_sub
goto :eof

REM ---------------------------------------------------
REM Install mongosh
REM ---------------------------------------------------
:install_mongosh
echo   Downloading mongosh 2.5.0 installer...
set "MONGOSH_MSI=%TEMP%\mongosh-2.5.0.msi"
curl -L --progress-bar --output "%MONGOSH_MSI%" "https://downloads.mongodb.com/compass/mongosh-2.5.0-x64.msi"
if not exist "%MONGOSH_MSI%" goto :mongosh_try_winget
for %%F in ("%MONGOSH_MSI%") do if %%~zF LSS 100000 (
    echo   Downloaded file is too small, installer may be corrupt.
    del "%MONGOSH_MSI%" >nul 2>&1
    goto :mongosh_try_winget
)
echo   Installing mongosh 2.5.0 silently...
%windir%\system32\msiexec.exe /i "%MONGOSH_MSI%" /qn /norestart
set "MSI_MONGOSH_RC=%errorlevel%"
del "%MONGOSH_MSI%" >nul 2>&1
echo   msiexec exit code: %MSI_MONGOSH_RC%
call :find_mongosh
if defined MONGOSH_BIN (
    echo   Found mongosh at: %MONGOSH_BIN%
    goto :mongosh_done_sub
)
echo   MSI install did not produce mongosh.exe, trying next method...

:mongosh_try_winget
winget --version >nul 2>&1
if %errorlevel% neq 0 goto :mongosh_try_choco
echo   Trying winget...
winget install -e --id MongoDB.Shell --accept-package-agreements --accept-source-agreements
call :find_mongosh
if defined MONGOSH_BIN goto :mongosh_done_sub
echo   winget install failed, trying next method...

:mongosh_try_choco
choco --version >nul 2>&1
if %errorlevel% neq 0 goto :mongosh_fail
echo   Trying Chocolatey...
choco install mongosh -y
if %errorlevel% equ 0 (
    call :find_mongosh
    if defined MONGOSH_BIN goto :mongosh_done_sub
)
:mongosh_fail
echo   No installation method succeeded for mongosh.
:mongosh_done_sub
goto :eof

REM ---------------------------------------------------
REM Install Node.js
REM ---------------------------------------------------
:install_node
echo   Downloading Node.js 18.17.1 LTS installer...
set "NODE_MSI=%TEMP%\nodejs-18.17.1.msi"
curl -L --progress-bar --output "%NODE_MSI%" "https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
if not exist "%NODE_MSI%" goto :node_try_winget
for %%F in ("%NODE_MSI%") do if %%~zF LSS 1000000 (
    echo   Downloaded file is too small, installer may be corrupt.
    del "%NODE_MSI%" >nul 2>&1
    goto :node_try_winget
)
echo   Installing Node.js 18.17.1 silently...
%windir%\system32\msiexec.exe /i "%NODE_MSI%" /qn /norestart
del "%NODE_MSI%" >nul 2>&1
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :node_done_sub
)
echo   MSI install did not produce node.exe, trying next method...

:node_try_winget
winget --version >nul 2>&1
if %errorlevel% neq 0 goto :node_try_choco
echo   Trying winget...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
if %errorlevel% equ 0 goto :node_done_sub
echo   winget install failed, trying next method...

:node_try_choco
choco --version >nul 2>&1
if %errorlevel% neq 0 goto :node_fail
echo   Trying Chocolatey...
choco install nodejs-lts -y
if %errorlevel% equ 0 goto :node_done_sub

:node_fail
echo   No installation method succeeded for Node.js.
:node_done_sub
goto :eof

REM ---------------------------------------------------
REM Refresh PATH with all known tool locations
REM ---------------------------------------------------
:refresh_path
call :find_mongod
if defined MONGOD_BIN set "PATH=%MONGOD_BIN%;%PATH%"

call :find_mongosh
if defined MONGOSH_BIN set "PATH=%MONGOSH_BIN%;%PATH%"

if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
goto :eof