@echo off
echo ==========================================================
echo   CryptoPulse Pro - Windows (amd64) Docker Baslatici
echo ==========================================================

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Docker bulunamadi! Lutfen Docker Desktop for Windows kurun ve acin.
    pause
    exit /b 1
)

echo [1/2] Windows amd64 Docker imajlari derleniyor...
docker compose build

echo [2/2] MySQL, Redis ve Go Mikroservisleri baslatiliyor...
docker compose up -d

echo.
echo Basariyla calistirildi!
echo - Frontend Arayuz:                http://localhost:3000
echo - Auth Microservice (JWT + GORM): http://localhost:8081
echo - Market WebSocket Service:       ws://localhost:8082/ws/market
pause
