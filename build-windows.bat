@echo off
echo ============================================================
echo   Small AI Studio - Windows 11 Build Script
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Rust / Cargo is not installed. Please install Rust from https://rustup.rs
    pause
    exit /b 1
)

echo [1/3] Installing NPM dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building frontend assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Compiling native Windows 11 executable with Tauri 2.0...
call npm run tauri build
if %errorlevel% neq 0 (
    echo [ERROR] Tauri build failed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo [SUCCESS] Build finished!
echo Executable located at: src-tauri\target\release\small-ai-studio.exe
echo Installer located at:  src-tauri\target\release\bundle\nsis\
echo ============================================================
pause
