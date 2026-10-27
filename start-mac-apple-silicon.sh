#!/bin/bash
echo "=========================================================="
echo "  CryptoPulse Pro - Apple Silicon (arm64) & macOS Başlatıcı"
echo "=========================================================="

if ! command -v docker &> /dev/null; then
    echo "HATA: Docker bulunamadı! Lütfen Docker Desktop for Mac kurun."
    exit 1
fi

echo "[1/2] Çoklu mimari (arm64) Docker imajları derleniyor..."
docker compose build

echo "[2/2] MySQL, Redis ve Go Mikroservisleri başlatılıyor..."
docker compose up -d

echo ""
echo "Başarıyla çalıştırıldı!"
echo "- Frontend Arayüz:                http://localhost:3000"
echo "- Auth Microservice (JWT + GORM): http://localhost:8081"
echo "- Market WebSocket Service:       ws://localhost:8082/ws/market"
