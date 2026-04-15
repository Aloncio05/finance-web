@echo off
setlocal

set "APP_PORT=3050"
set "APP_URL=http://127.0.0.1:%APP_PORT%"

cd /d "%~dp0"

call :wait_for_port >nul 2>nul
if not errorlevel 1 goto open_browser

start "Finance Flow" cmd /k "start-dev.cmd %APP_PORT%"

echo Aguardando o aplicativo responder em %APP_URL% ...
call :wait_for_port

if errorlevel 1 (
  echo.
  echo O aplicativo nao respondeu a tempo. Verifique a janela "Finance Flow".
  pause
  exit /b 1
)

:open_browser
start "" "%APP_URL%"
exit /b 0

:wait_for_port
powershell -NoProfile -Command "$max=90; for($i=0; $i -lt $max; $i++){ if (Test-NetConnection -ComputerName 127.0.0.1 -Port %APP_PORT% -InformationLevel Quiet) { exit 0 }; Start-Sleep -Seconds 1 }; exit 1"
exit /b %errorlevel%
