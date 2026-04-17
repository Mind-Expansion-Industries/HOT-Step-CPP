@echo off
echo =============================================
echo   HOT-Step 9000 CPP - Production
echo =============================================
echo.

REM Build UI if dist doesn't exist
if not exist "%~dp0ui\dist" (
    echo Building UI...
    cd /d "%~dp0ui"
    call npm run build
)

REM Start server (which spawns ace-server)
cd /d "%~dp0server"
echo Starting server...
call npx tsx src/index.ts
