@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo EcomPilot V1-Plus local startup
echo ========================================
echo Runtime: Windows local + SQLite + uploads/exports/backups/logs/trash
echo URL: http://localhost:3000
echo Logs: logs\app.log and logs\error.log
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Please install Node.js first, then rerun start.bat.
  goto :error
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Please check your Node.js installation.
  goto :error
)

if not exist ".env" (
  echo [SETUP] .env not found.
  if not exist ".env.example" (
    echo [ERROR] .env.example was not found. Please create .env manually before startup.
    goto :error
  )
  echo [SETUP] Creating .env from .env.example...
  copy /Y ".env.example" ".env" >nul
  if errorlevel 1 goto :error
  echo [SETUP] .env created. Review it if you need to change DATABASE_URL or AI settings.
)

for %%D in (uploads exports backups logs trash) do (
  if not exist "%%D" (
    echo [SETUP] %%D directory not found. Creating %%D...
    mkdir "%%D"
    if errorlevel 1 (
      echo [ERROR] Could not create %%D. Please check folder permissions.
      goto :error
    )
  ) else (
    echo [CHECK] %%D directory found.
  )
)

if not exist "node_modules" (
  echo [SETUP] node_modules not found. Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

if not exist "prisma\dev.db" (
  echo [SETUP] SQLite database not found. Running Prisma migration...
  call npx prisma migrate dev
  if errorlevel 1 goto :error
) else (
  echo [CHECK] SQLite database found.
)

echo [CHECK] Syncing default banned words...
call npm run prisma:seed
if errorlevel 1 goto :error

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo [ERROR] Port 3000 is already in use.
  echo Close the process using port 3000, or run EcomPilot with another port manually:
  echo   npm run dev -- -p 3001
  goto :error
)

echo [START] Opening browser shortly...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"

echo [START] Starting EcomPilot V1-Plus at http://localhost:3000
echo [START] If startup fails, check logs\app.log, logs\error.log, and the message below.
echo Press Ctrl+C to stop the local server.
call npm run dev
if errorlevel 1 goto :error

exit /b 0

:error
echo.
echo Startup failed. Please review the message above.
echo This window will stay open so you can read the error.
echo Common fixes:
echo - If dependencies are missing, rerun start.bat after npm install finishes.
echo - If Prisma reports an EPERM file lock, close local Node / Next / Prisma processes and rerun start.bat.
echo - If port 3000 is occupied, stop that process or run npm run dev -- -p 3001.
echo - If the browser did not open automatically, visit http://localhost:3000 after the server starts.
pause
exit /b 1
