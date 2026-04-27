@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ==============================================================
::  QuizCraft (fast_q) - Windows Project Runner
:: ==============================================================

:: -- Project paths ---------------------------------------------
set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

set "API_DIR=%PROJECT_ROOT%\api"
set "REALTIME_DIR=%PROJECT_ROOT%\realtime"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "DB_DIR=%PROJECT_ROOT%\database"
set "PID_DIR=%PROJECT_ROOT%\scripts\.pids"

if not exist "%PID_DIR%" mkdir "%PID_DIR%"

:: -- Load .env defaults ----------------------------------------
set "DB_HOST=127.0.0.1"
set "DB_PORT=3306"
set "DB_NAME=fast_q"
set "DB_USER=root"
set "DB_PASS="
set "JWT_SECRET=change-me-to-a-strong-random-secret-in-production"
set "PHP_PORT=8000"
set "REALTIME_PORT=3001"
set "FRONTEND_PORT=8080"
set "PMA_PORT=8888"
set "FRONTEND_URL=http://localhost:8080"

:: -- Load .env file overrides ----------------------------------
if exist "%PROJECT_ROOT%\.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%PROJECT_ROOT%\.env") do (
        if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
    )
)

:: -- PATH Preparation ------------------------------------------
call :prepare_path

:: -- Route command ---------------------------------------------
set "CMD=%~1"
if "%CMD%"=="" goto :show_help

if /i "%CMD%"=="check"          goto :cmd_check
if /i "%CMD%"=="install"        goto :cmd_install
if /i "%CMD%"=="db:setup"       goto :cmd_db_setup
if /i "%CMD%"=="db:reset"       goto :cmd_db_reset
if /i "%CMD%"=="db:query"       goto :cmd_db_query
if /i "%CMD%"=="start"          goto :cmd_start
if /i "%CMD%"=="start:php"      goto :cmd_start_php
if /i "%CMD%"=="start:node"     goto :cmd_start_node
if /i "%CMD%"=="start:frontend" goto :cmd_start_frontend
if /i "%CMD%"=="stop"           goto :cmd_stop
if /i "%CMD%"=="restart"        goto :cmd_restart
if /i "%CMD%"=="status"         goto :cmd_status
if /i "%CMD%"=="logs:php"       goto :cmd_logs_php
if /i "%CMD%"=="logs:node"      goto :cmd_logs_node
if /i "%CMD%"=="logs:frontend"  goto :cmd_logs_frontend
if /i "%CMD%"=="help"           goto :show_help
if /i "%CMD%"=="--help"         goto :show_help
if /i "%CMD%"=="-h"             goto :show_help

echo [ERR]   Unknown command: %CMD%
echo         Run "run.bat help" for available commands.
exit /b 1


:: ==============================================================
::  PATH PREPARATION
:: ==============================================================
:prepare_path

    :: --- PHP ---
    if exist "C:\xampp\php\php.exe" set "PATH=C:\xampp\php;%PATH%"
    if exist "C:\wamp64\bin\php" (
        for /d %%D in ("C:\wamp64\bin\php\php*") do set "PATH=%%~fD;!PATH!"
    )
    if exist "C:\wamp\bin\php" (
        for /d %%D in ("C:\wamp\bin\php\php*") do set "PATH=%%~fD;!PATH!"
    )
    if exist "C:\laragon\bin\php" (
        for /d %%D in ("C:\laragon\bin\php\php*") do set "PATH=%%~fD;!PATH!"
    )
    if exist "%USERPROFILE%\scoop\apps\php\current\php.exe" set "PATH=%USERPROFILE%\scoop\apps\php\current;!PATH!"
    if exist "C:\tools\php\php.exe" set "PATH=C:\tools\php;!PATH!"
    if exist "C:\tools\php83\php.exe" set "PATH=C:\tools\php83;!PATH!"
    if exist "C:\tools\php82\php.exe" set "PATH=C:\tools\php82;!PATH!"
    if exist "C:\php\php.exe" set "PATH=C:\php;!PATH!"

    :: --- Composer ---
    if exist "%APPDATA%\Composer\vendor\bin" set "PATH=%APPDATA%\Composer\vendor\bin;!PATH!"
    if exist "C:\ProgramData\ComposerSetup\bin" set "PATH=C:\ProgramData\ComposerSetup\bin;!PATH!"
    if exist "%USERPROFILE%\scoop\apps\composer\current" set "PATH=%USERPROFILE%\scoop\apps\composer\current;!PATH!"

    :: --- Node.js / npm ---
    if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;!PATH!"
    if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;!PATH!"
    if exist "%APPDATA%\nvm" (
        for /d %%D in ("%APPDATA%\nvm\v*") do set "PATH=%%~fD;!PATH!"
    )
    if exist "%USERPROFILE%\scoop\apps\nodejs\current" set "PATH=%USERPROFILE%\scoop\apps\nodejs\current;!PATH!"
    if exist "%APPDATA%\npm" set "PATH=%APPDATA%\npm;!PATH!"

    :: --- MySQL ---
    if exist "C:\Program Files\MySQL" (
        for /d %%D in ("C:\Program Files\MySQL\MySQL Server *") do set "PATH=%%~fD\bin;!PATH!"
    )
    if exist "C:\xampp\mysql\bin\mysql.exe" set "PATH=C:\xampp\mysql\bin;!PATH!"
    if exist "C:\wamp64\bin\mysql" (
        for /d %%D in ("C:\wamp64\bin\mysql\mysql*") do set "PATH=%%~fD\bin;!PATH!"
    )
    if exist "C:\wamp\bin\mysql" (
        for /d %%D in ("C:\wamp\bin\mysql\mysql*") do set "PATH=%%~fD\bin;!PATH!"
    )
    if exist "C:\laragon\bin\mysql" (
        for /d %%D in ("C:\laragon\bin\mysql\mysql*") do set "PATH=%%~fD\bin;!PATH!"
    )
    if exist "C:\Program Files\MariaDB*" (
        for /d %%D in ("C:\Program Files\MariaDB *") do set "PATH=%%~fD\bin;!PATH!"
    )
    if exist "%USERPROFILE%\scoop\apps\mysql\current\bin" set "PATH=%USERPROFILE%\scoop\apps\mysql\current\bin;!PATH!"

    :: --- Git ---
    if exist "C:\Program Files\Git\cmd" set "PATH=C:\Program Files\Git\cmd;!PATH!"

    exit /b 0


:: ==============================================================
::  CHECK and AUTO-INSTALL MISSING DEPENDENCIES
:: ==============================================================
:cmd_check
    echo.
    echo  ========================================================
    echo   QuizCraft - Dependency Checker and Auto-Installer
    echo  ========================================================
    echo.

    set "MISSING_COUNT=0"
    set "HAS_WINGET=0"
    set "HAS_CHOCO=0"
    set "HAS_SCOOP=0"

    :: Detect available package managers
    where winget >nul 2>nul
    if !errorlevel! equ 0 set "HAS_WINGET=1"
    where choco >nul 2>nul
    if !errorlevel! equ 0 set "HAS_CHOCO=1"
    where scoop >nul 2>nul
    if !errorlevel! equ 0 set "HAS_SCOOP=1"

    if "!HAS_WINGET!"=="1" (
        echo  [OK]    Package manager: winget detected
    ) else if "!HAS_CHOCO!"=="1" (
        echo  [OK]    Package manager: Chocolatey detected
    ) else if "!HAS_SCOOP!"=="1" (
        echo  [OK]    Package manager: Scoop detected
    ) else (
        echo  [WARN]  No package manager found. Install one of:
        echo          - winget: built into Windows 10/11
        echo          - Chocolatey: https://chocolatey.org/install
        echo          - Scoop: https://scoop.sh
    )
    echo.

    :: -- Check PHP --
    echo  --- PHP 8.2+ ---
    where php >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [MISS]  PHP is NOT installed or not in PATH
        set /a MISSING_COUNT+=1
        call :auto_install_php
    ) else (
        php -r "echo PHP_VERSION;" > "%TEMP%\qc_phpver.txt" 2>nul
        set /p PHP_VER=<"%TEMP%\qc_phpver.txt"
        del "%TEMP%\qc_phpver.txt" >nul 2>nul
        echo  [OK]    PHP !PHP_VER! found
        call :check_php_extensions
    )
    echo.

    :: -- Check Composer --
    echo  --- Composer ---
    where composer >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [MISS]  Composer is NOT installed or not in PATH
        set /a MISSING_COUNT+=1
        call :auto_install_composer
    ) else (
        echo  [OK]    Composer found
    )
    echo.

    :: -- Check Node.js --
    echo  --- Node.js 18+ ---
    where node >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [MISS]  Node.js is NOT installed or not in PATH
        set /a MISSING_COUNT+=1
        call :auto_install_node
    ) else (
        for /f "tokens=*" %%V in ('node --version 2^>nul') do set "NODE_VER=%%V"
        echo  [OK]    Node.js !NODE_VER! found
    )
    echo.

    :: -- Check npm --
    echo  --- npm ---
    where npm >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [MISS]  npm is NOT installed. It comes with Node.js.
        set /a MISSING_COUNT+=1
    ) else (
        for /f "tokens=*" %%V in ('npm --version 2^>nul') do set "NPM_VER=%%V"
        echo  [OK]    npm !NPM_VER! found
    )
    echo.

    :: -- Check MySQL --
    echo  --- MySQL 8+ ---
    where mysql >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [MISS]  MySQL client is NOT installed or not in PATH
        set /a MISSING_COUNT+=1
        call :auto_install_mysql
    ) else (
        for /f "tokens=*" %%V in ('mysql --version 2^>nul') do set "MYSQL_VER=%%V"
        echo  [OK]    !MYSQL_VER!
        call :check_mysql_connection
    )
    echo.

    :: -- Check Git --
    echo  --- Git ---
    where git >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [MISS]  Git is NOT installed or not in PATH
        set /a MISSING_COUNT+=1
        call :auto_install_git
    ) else (
        for /f "tokens=*" %%V in ('git --version 2^>nul') do set "GIT_VER=%%V"
        echo  [OK]    !GIT_VER!
    )
    echo.

    :: -- Check .env --
    echo  --- Configuration ---
    if exist "%PROJECT_ROOT%\.env" (
        echo  [OK]    .env file exists
    ) else (
        echo  [WARN]  .env file not found - creating from .env.example
        if exist "%PROJECT_ROOT%\.env.example" (
            copy "%PROJECT_ROOT%\.env.example" "%PROJECT_ROOT%\.env" >nul
            echo  [OK]    .env created. Edit it to set your database credentials.
        ) else (
            echo  [ERR]   .env.example not found either
        )
    )
    echo.

    :: -- Summary --
    echo  ========================================================
    if !MISSING_COUNT! equ 0 (
        echo   All dependencies are installed! You are ready to go.
        echo.
        echo   Next steps:
        echo     run.bat install     Install project packages
        echo     run.bat db:setup    Setup the database
        echo     run.bat start       Start all services
    ) else (
        echo   !MISSING_COUNT! tool^(s^) missing or could not be auto-installed.
        echo.
        echo   After installing, RESTART your terminal and run
        echo   "run.bat check" again to verify.
    )
    echo  ========================================================
    echo.
    exit /b 0


:: -- PHP extension checker -------------------------------------
:check_php_extensions
    set "EXT_MISSING=0"
    php -m > "%TEMP%\qc_phpext.txt" 2>nul
    for %%E in (pdo_mysql mbstring openssl json tokenizer) do (
        findstr /i "%%E" "%TEMP%\qc_phpext.txt" >nul 2>nul
        if !errorlevel! neq 0 (
            echo  [WARN]  PHP extension "%%E" not enabled. Uncomment it in php.ini.
            set /a EXT_MISSING+=1
        )
    )
    del "%TEMP%\qc_phpext.txt" >nul 2>nul
    if !EXT_MISSING! equ 0 (
        echo  [OK]    All required PHP extensions enabled
    ) else (
        echo  [INFO]  Find php.ini location with: php --ini
    )
    exit /b 0


:: -- MySQL connection checker ----------------------------------
:check_mysql_connection
    set "MCMD=mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER%"
    if not "%DB_PASS%"=="" set "MCMD=!MCMD! -p%DB_PASS%"
    !MCMD! -e "SELECT 1" >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [WARN]  MySQL server not reachable at %DB_HOST%:%DB_PORT%
        echo          Make sure MySQL service is running.
    ) else (
        echo  [OK]    MySQL server reachable at %DB_HOST%:%DB_PORT%
        !MCMD! -e "USE %DB_NAME%" >nul 2>nul
        if !errorlevel! neq 0 (
            echo  [WARN]  Database "%DB_NAME%" does not exist yet. Run: run.bat db:setup
        ) else (
            echo  [OK]    Database "%DB_NAME%" exists
        )
    )
    exit /b 0


:: -- Auto-install PHP ------------------------------------------
:auto_install_php
    echo  [INFO]  Attempting to auto-install PHP...
    if "!HAS_WINGET!"=="1" (
        echo  [INFO]  Running: winget install PHP.PHP.8.2
        winget install PHP.PHP.8.2 --accept-package-agreements --accept-source-agreements
        if !errorlevel! equ 0 (
            echo  [OK]    PHP installed via winget. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_CHOCO!"=="1" (
        echo  [INFO]  Running: choco install php -y
        choco install php -y
        if !errorlevel! equ 0 (
            echo  [OK]    PHP installed via Chocolatey. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_SCOOP!"=="1" (
        echo  [INFO]  Running: scoop install php
        scoop install php
        if !errorlevel! equ 0 (
            echo  [OK]    PHP installed via Scoop. RESTART your terminal.
            exit /b 0
        )
    )
    echo  [ERR]   Could not auto-install PHP. Install manually:
    echo          - https://windows.php.net/download
    echo          - Or XAMPP: https://www.apachefriends.org
    echo          - Or: winget install PHP.PHP.8.2
    exit /b 1

:: -- Auto-install Composer -------------------------------------
:auto_install_composer
    echo  [INFO]  Attempting to auto-install Composer...
    if "!HAS_WINGET!"=="1" (
        echo  [INFO]  Running: winget install Composer.Composer
        winget install Composer.Composer --accept-package-agreements --accept-source-agreements
        if !errorlevel! equ 0 (
            echo  [OK]    Composer installed via winget. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_CHOCO!"=="1" (
        echo  [INFO]  Running: choco install composer -y
        choco install composer -y
        if !errorlevel! equ 0 (
            echo  [OK]    Composer installed via Chocolatey. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_SCOOP!"=="1" (
        echo  [INFO]  Running: scoop install composer
        scoop install composer
        if !errorlevel! equ 0 (
            echo  [OK]    Composer installed via Scoop. RESTART your terminal.
            exit /b 0
        )
    )
    echo  [ERR]   Could not auto-install Composer. Install manually:
    echo          - https://getcomposer.org/Composer-Setup.exe
    exit /b 1

:: -- Auto-install Node.js --------------------------------------
:auto_install_node
    echo  [INFO]  Attempting to auto-install Node.js...
    if "!HAS_WINGET!"=="1" (
        echo  [INFO]  Running: winget install OpenJS.NodeJS.LTS
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        if !errorlevel! equ 0 (
            echo  [OK]    Node.js installed via winget. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_CHOCO!"=="1" (
        echo  [INFO]  Running: choco install nodejs-lts -y
        choco install nodejs-lts -y
        if !errorlevel! equ 0 (
            echo  [OK]    Node.js installed via Chocolatey. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_SCOOP!"=="1" (
        echo  [INFO]  Running: scoop install nodejs-lts
        scoop install nodejs-lts
        if !errorlevel! equ 0 (
            echo  [OK]    Node.js installed via Scoop. RESTART your terminal.
            exit /b 0
        )
    )
    echo  [ERR]   Could not auto-install Node.js. Install manually:
    echo          - https://nodejs.org
    exit /b 1

:: -- Auto-install MySQL ----------------------------------------
:auto_install_mysql
    echo  [INFO]  Attempting to auto-install MySQL...
    if "!HAS_WINGET!"=="1" (
        echo  [INFO]  Running: winget install Oracle.MySQL
        winget install Oracle.MySQL --accept-package-agreements --accept-source-agreements
        if !errorlevel! equ 0 (
            echo  [OK]    MySQL installed via winget. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_CHOCO!"=="1" (
        echo  [INFO]  Running: choco install mysql -y
        choco install mysql -y
        if !errorlevel! equ 0 (
            echo  [OK]    MySQL installed via Chocolatey. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_SCOOP!"=="1" (
        echo  [INFO]  Running: scoop install mysql
        scoop install mysql
        if !errorlevel! equ 0 (
            echo  [OK]    MySQL installed via Scoop. RESTART your terminal.
            exit /b 0
        )
    )
    echo  [ERR]   Could not auto-install MySQL. Install manually:
    echo          - https://dev.mysql.com/downloads/installer/
    echo          - Or XAMPP: https://www.apachefriends.org
    exit /b 1

:: -- Auto-install Git ------------------------------------------
:auto_install_git
    echo  [INFO]  Attempting to auto-install Git...
    if "!HAS_WINGET!"=="1" (
        echo  [INFO]  Running: winget install Git.Git
        winget install Git.Git --accept-package-agreements --accept-source-agreements
        if !errorlevel! equ 0 (
            echo  [OK]    Git installed via winget. RESTART your terminal.
            exit /b 0
        )
    )
    if "!HAS_CHOCO!"=="1" (
        echo  [INFO]  Running: choco install git -y
        choco install git -y
        if !errorlevel! equ 0 (
            echo  [OK]    Git installed via Chocolatey. RESTART your terminal.
            exit /b 0
        )
    )
    echo  [ERR]   Could not auto-install Git. Download: https://git-scm.com
    exit /b 1


:: ==============================================================
::  INSTALL - Project dependencies
:: ==============================================================
:cmd_install
    echo.
    echo  -- Installing dependencies --
    echo.

    :: PHP API
    echo  [INFO]  Installing PHP dependencies via Composer...
    pushd "%API_DIR%"
    if exist "composer.lock" (
        call composer install --no-interaction
    ) else (
        call composer install --no-interaction --prefer-dist
    )
    if !errorlevel! neq 0 (
        echo  [ERR]   Composer install failed
        popd
        exit /b 1
    )
    popd
    echo  [OK]    PHP dependencies installed
    echo.

    :: Node.js Realtime
    echo  [INFO]  Installing Node.js realtime dependencies...
    pushd "%REALTIME_DIR%"
    call npm install
    if !errorlevel! neq 0 (
        echo  [ERR]   npm install failed for realtime
        popd
        exit /b 1
    )
    popd
    echo  [OK]    Realtime dependencies installed
    echo.

    :: Frontend
    echo  [INFO]  Installing frontend dependencies...
    pushd "%FRONTEND_DIR%"
    call npm install
    if !errorlevel! neq 0 (
        echo  [ERR]   npm install failed for frontend
        popd
        exit /b 1
    )
    popd
    echo  [OK]    Frontend dependencies installed
    echo.

    echo  [OK]    All dependencies installed.
    exit /b 0


:: ==============================================================
::  DATABASE COMMANDS
:: ==============================================================
:cmd_db_setup
    echo.
    echo  -- Database Setup --
    echo.

    set "MCMD=mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER%"
    if not "%DB_PASS%"=="" set "MCMD=!MCMD! -p%DB_PASS%"

    echo  [INFO]  Creating database "%DB_NAME%" if not exists...
    !MCMD! -e "CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if !errorlevel! neq 0 (
        echo  [ERR]   Failed to create database. Is MySQL running?
        exit /b 1
    )
    echo  [OK]    Database ready
    echo.

    echo  [INFO]  Running schema.sql...
    !MCMD! "%DB_NAME%" < "%DB_DIR%\schema.sql"
    if !errorlevel! neq 0 (
        echo  [ERR]   Failed to apply schema
        exit /b 1
    )
    echo  [OK]    Schema applied
    echo.

    set /p "SEED_ANSWER=  Load seed/demo data? [y/N]: "
    if /i "!SEED_ANSWER!"=="y" (
        echo  [INFO]  Running seed.sql...
        !MCMD! "%DB_NAME%" < "%DB_DIR%\seed.sql"
        echo  [OK]    Seed data inserted
    ) else (
        echo  [INFO]  Skipped seed data
    )
    echo.
    echo  [OK]    Database setup complete.
    exit /b 0

:cmd_db_reset
    echo.
    echo  -- Database Reset --
    echo.
    echo  [WARN]  This will DROP the entire "%DB_NAME%" database!
    set /p "RESET_ANSWER=  Are you sure? [y/N]: "
    if /i not "!RESET_ANSWER!"=="y" (
        echo  [INFO]  Aborted.
        exit /b 0
    )

    set "MCMD=mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER%"
    if not "%DB_PASS%"=="" set "MCMD=!MCMD! -p%DB_PASS%"

    echo  [INFO]  Dropping database "%DB_NAME%"...
    !MCMD! -e "DROP DATABASE IF EXISTS `%DB_NAME%`;"
    echo  [OK]    Database dropped
    echo.

    echo  [INFO]  Recreating with schema and seed data...
    !MCMD! -e "CREATE DATABASE IF NOT EXISTS `%DB_NAME%` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    !MCMD! "%DB_NAME%" < "%DB_DIR%\schema.sql"
    echo  [OK]    Schema applied
    !MCMD! "%DB_NAME%" < "%DB_DIR%\seed.sql"
    echo  [OK]    Seed data inserted
    echo.
    echo  [OK]    Database reset complete.
    exit /b 0

:cmd_db_query
    set "MCMD=mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER%"
    if not "%DB_PASS%"=="" set "MCMD=!MCMD! -p%DB_PASS%"

    if not "%~2"=="" (
        echo.
        echo  -- Running query --
        !MCMD! "%DB_NAME%" -e "%~2"
    ) else (
        echo.
        echo  -- MySQL Interactive Shell --
        echo  [INFO]  Connected to: %DB_USER%@%DB_HOST%:%DB_PORT%/%DB_NAME%
        echo.
        !MCMD! "%DB_NAME%"
    )
    exit /b 0


:: ==============================================================
::  START SERVERS
:: ==============================================================
:cmd_start
    echo.
    echo  -- Starting all QuizCraft services --
    echo.
    call :start_php_server
    call :start_node_server
    call :start_frontend_server
    echo.
    echo  ========================================================
    echo   All services are running
    echo  --------------------------------------------------------
    echo   Frontend     : http://localhost:%FRONTEND_PORT%
    echo   PHP API      : http://127.0.0.1:%PHP_PORT%
    echo   Realtime     : http://127.0.0.1:%REALTIME_PORT%
    echo  --------------------------------------------------------
    echo   Stop all     : run.bat stop
    echo   View status  : run.bat status
    echo  ========================================================
    echo.
    exit /b 0

:cmd_start_php
    echo.
    echo  -- PHP API Server --
    call :start_php_server
    exit /b 0

:cmd_start_node
    echo.
    echo  -- Node.js Realtime Service --
    call :start_node_server
    exit /b 0

:cmd_start_frontend
    echo.
    echo  -- Frontend Dev Server --
    call :start_frontend_server
    exit /b 0


:: -- Server launcher: PHP --------------------------------------
:start_php_server
    if exist "%PID_DIR%\php.pid" (
        set /p PHP_PID=<"%PID_DIR%\php.pid"
        tasklist /FI "PID eq !PHP_PID!" 2>nul | findstr /r "[0-9]" >nul 2>nul
        if !errorlevel! equ 0 (
            echo  [WARN]  PHP server already running, PID !PHP_PID!
            exit /b 0
        )
    )
    if not exist "%API_DIR%\vendor" (
        echo  [ERR]   Composer dependencies not installed. Run: run.bat install
        exit /b 1
    )
    echo  [INFO]  Starting PHP server on http://127.0.0.1:%PHP_PORT% ...
    pushd "%API_DIR%"
    start "QuizCraft-PHP" /b cmd /c "php -S 127.0.0.1:%PHP_PORT% -t public > "!PID_DIR!\php.log" 2>&1"
    popd
    timeout /t 2 /nobreak >nul
    set "NEW_PID="
    for /f "skip=1 tokens=2" %%P in ('wmic process where "commandline like '%%127.0.0.1:%PHP_PORT%%%' and name='php.exe'" get processid 2^>nul') do (
        if not "%%P"=="" set "NEW_PID=%%P"
    )
    if defined NEW_PID (
        >"%PID_DIR%\php.pid" echo !NEW_PID!
        echo  [OK]    PHP server started, PID !NEW_PID! : http://127.0.0.1:%PHP_PORT%
    ) else (
        echo  [WARN]  PHP server may have started. Check: run.bat logs:php
    )
    exit /b 0

:: -- Server launcher: Node.js ---------------------------------
:start_node_server
    if exist "%PID_DIR%\node.pid" (
        set /p NODE_PID=<"%PID_DIR%\node.pid"
        tasklist /FI "PID eq !NODE_PID!" 2>nul | findstr /r "[0-9]" >nul 2>nul
        if !errorlevel! equ 0 (
            echo  [WARN]  Node.js server already running, PID !NODE_PID!
            exit /b 0
        )
    )
    if not exist "%REALTIME_DIR%\node_modules" (
        echo  [ERR]   Node dependencies not installed. Run: run.bat install
        exit /b 1
    )
    echo  [INFO]  Starting realtime service on http://127.0.0.1:%REALTIME_PORT% ...
    pushd "%REALTIME_DIR%"
    start "QuizCraft-Node" /b cmd /c "node server.js > "!PID_DIR!\node.log" 2>&1"
    popd
    timeout /t 2 /nobreak >nul
    set "NEW_PID="
    for /f "skip=1 tokens=2" %%P in ('wmic process where "commandline like '%%server.js%%' and name='node.exe'" get processid 2^>nul') do (
        if not "%%P"=="" set "NEW_PID=%%P"
    )
    if defined NEW_PID (
        >"%PID_DIR%\node.pid" echo !NEW_PID!
        echo  [OK]    Realtime started, PID !NEW_PID! : http://127.0.0.1:%REALTIME_PORT%
    ) else (
        echo  [WARN]  Node.js server may have started. Check: run.bat logs:node
    )
    exit /b 0

:: -- Server launcher: Frontend ---------------------------------
:start_frontend_server
    if exist "%PID_DIR%\frontend.pid" (
        set /p FE_PID=<"%PID_DIR%\frontend.pid"
        tasklist /FI "PID eq !FE_PID!" 2>nul | findstr /r "[0-9]" >nul 2>nul
        if !errorlevel! equ 0 (
            echo  [WARN]  Frontend already running, PID !FE_PID!
            exit /b 0
        )
    )
    if not exist "%FRONTEND_DIR%\node_modules" (
        echo  [ERR]   Frontend dependencies not installed. Run: run.bat install
        exit /b 1
    )
    echo  [INFO]  Starting Vite dev server on http://localhost:%FRONTEND_PORT% ...
    pushd "%FRONTEND_DIR%"
    start "QuizCraft-Frontend" /b cmd /c "npx vite --host --port %FRONTEND_PORT% > "!PID_DIR!\frontend.log" 2>&1"
    popd
    timeout /t 3 /nobreak >nul
    set "NEW_PID="
    for /f "skip=1 tokens=2" %%P in ('wmic process where "commandline like '%%vite%%--port %FRONTEND_PORT%%%'" get processid 2^>nul') do (
        if not "%%P"=="" set "NEW_PID=%%P"
    )
    if defined NEW_PID (
        >"%PID_DIR%\frontend.pid" echo !NEW_PID!
        echo  [OK]    Frontend started, PID !NEW_PID! : http://localhost:%FRONTEND_PORT%
    ) else (
        echo  [WARN]  Frontend may have started. Check: run.bat logs:frontend
    )
    exit /b 0


:: ==============================================================
::  STOP SERVERS
:: ==============================================================
:cmd_stop
    echo.
    echo  -- Stopping all QuizCraft services --
    echo.

    set "STOPPED=0"

    for %%S in (php node frontend) do (
        if exist "%PID_DIR%\%%S.pid" (
            set /p SVC_PID=<"%PID_DIR%\%%S.pid"
            tasklist /FI "PID eq !SVC_PID!" 2>nul | findstr /r "[0-9]" >nul 2>nul
            if !errorlevel! equ 0 (
                taskkill /PID !SVC_PID! /T /F >nul 2>nul
                echo  [OK]    Stopped %%S, PID !SVC_PID!
                set /a STOPPED+=1
            ) else (
                echo  [INFO]  %%S was not running, stale PID !SVC_PID!
            )
            del "%PID_DIR%\%%S.pid" >nul 2>nul
        ) else (
            echo  [INFO]  No PID file for %%S
        )
    )

    if !STOPPED! equ 0 (
        echo  [INFO]  No services were running.
    ) else (
        echo.
        echo  [OK]    Stopped !STOPPED! service(s).
    )
    exit /b 0


:: ==============================================================
::  RESTART
:: ==============================================================
:cmd_restart
    call :cmd_stop
    echo.
    call :cmd_start
    exit /b 0


:: ==============================================================
::  STATUS
:: ==============================================================
:cmd_status
    echo.
    echo  -- QuizCraft Service Status --
    echo.
    echo  SERVICE         STATUS     PID       URL
    echo  --------------  --------   --------  ----------------------------

    for %%S in (php node frontend) do (
        if "%%S"=="php"      set "SVC_URL=http://127.0.0.1:%PHP_PORT%"
        if "%%S"=="node"     set "SVC_URL=http://127.0.0.1:%REALTIME_PORT%"
        if "%%S"=="frontend" set "SVC_URL=http://localhost:%FRONTEND_PORT%"

        if exist "%PID_DIR%\%%S.pid" (
            set /p SVC_PID=<"%PID_DIR%\%%S.pid"
            tasklist /FI "PID eq !SVC_PID!" 2>nul | findstr /r "[0-9]" >nul 2>nul
            if !errorlevel! equ 0 (
                echo  %%S              running    !SVC_PID!       !SVC_URL!
            ) else (
                echo  %%S              stopped    -         !SVC_URL!
            )
        ) else (
            echo  %%S              stopped    -         !SVC_URL!
        )
    )
    echo.

    :: Check MySQL
    set "MCMD=mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER%"
    if not "%DB_PASS%"=="" set "MCMD=!MCMD! -p%DB_PASS%"
    !MCMD! -e "SELECT 1" >nul 2>nul
    if !errorlevel! equ 0 (
        echo  mysql            running    -         %DB_HOST%:%DB_PORT%
        !MCMD! -e "USE %DB_NAME%" >nul 2>nul
        if !errorlevel! equ 0 (
            echo  database         ready      -         %DB_NAME%
        ) else (
            echo  database         missing    -         Run: run.bat db:setup
        )
    ) else (
        echo  mysql            stopped    -         %DB_HOST%:%DB_PORT%
    )
    echo.
    exit /b 0


:: ==============================================================
::  LOGS
:: ==============================================================
:cmd_logs_php
    echo.
    echo  -- PHP Server Log --
    if exist "%PID_DIR%\php.log" (
        type "%PID_DIR%\php.log"
    ) else (
        echo  [INFO]  No PHP log file found.
    )
    exit /b 0

:cmd_logs_node
    echo.
    echo  -- Node.js Server Log --
    if exist "%PID_DIR%\node.log" (
        type "%PID_DIR%\node.log"
    ) else (
        echo  [INFO]  No Node.js log file found.
    )
    exit /b 0

:cmd_logs_frontend
    echo.
    echo  -- Frontend Server Log --
    if exist "%PID_DIR%\frontend.log" (
        type "%PID_DIR%\frontend.log"
    ) else (
        echo  [INFO]  No frontend log file found.
    )
    exit /b 0


:: ==============================================================
::  HELP
:: ==============================================================
:show_help
    echo.
    echo   QuizCraft (fast_q) - Windows Project Runner
    echo.
    echo   Usage: run.bat [command]
    echo.
    echo   First Time Setup:
    echo     check           Check system for missing tools and auto-install them
    echo     install         Install all project dependencies (Composer + npm)
    echo     db:setup        Create database and apply schema
    echo     db:reset        Drop and recreate database with seed data
    echo     db:query [sql]  Open MySQL shell or run a one-off query
    echo.
    echo   Servers:
    echo     start           Start all servers (PHP + Node + Frontend)
    echo     start:php       Start PHP API server only
    echo     start:node      Start Node.js realtime only
    echo     start:frontend  Start frontend dev server only
    echo     stop            Stop all running servers
    echo     restart         Stop then start all servers
    echo.
    echo   Monitoring:
    echo     status          Show status of all services
    echo     logs:php        Show PHP server log
    echo     logs:node       Show Node.js server log
    echo     logs:frontend   Show frontend server log
    echo.
    echo   Recommended first-time workflow:
    echo     1. run.bat check        (scan and install missing tools)
    echo     2. run.bat install      (install project packages)
    echo     3. run.bat db:setup     (create database)
    echo     4. run.bat start        (launch everything)
    echo.
    exit /b 0
