@echo off
setlocal
title Finance Flow - Inicializacao local

set "APP_PORT=%~1"
if "%APP_PORT%"=="" set "APP_PORT=3050"
set "APP_URL=http://127.0.0.1:%APP_PORT%"

cd /d "%~dp0"

if not exist "node_modules" (
  echo.
  echo [0/3] Instalando dependencias...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Falha ao instalar as dependencias.
    pause
    exit /b %errorlevel%
  )
)

if not exist ".env" (
  echo Arquivo .env nao encontrado.
  echo Crie o .env a partir do .env.example antes de iniciar o aplicativo.
  pause
  exit /b 1
)

echo.
echo [1/3] Validando o banco configurado...
call npm.cmd run db:deploy
if errorlevel 1 (
  echo.
  echo Falha ao validar o banco configurado.
  pause
  exit /b %errorlevel%
)

echo.
echo [2/3] Preparando abertura do navegador...
echo O aplicativo sera aberto em: %APP_URL%

echo.
echo [3/3] Iniciando o aplicativo...
echo Aguarde a mensagem "Ready" e acesse: %APP_URL%
echo.
call npm.cmd run dev -- --hostname 127.0.0.1 --port %APP_PORT%
if errorlevel 1 (
  echo.
  echo O servidor nao conseguiu iniciar corretamente.
  pause
  exit /b %errorlevel%
)
