#!/bin/bash
# Hem Apple Silicon (linux/arm64) hem Windows (linux/amd64) için ortak Docker imajı üretir
IMAGE_NAME=${1:-"cryptopulse/trading-platform:latest"}

echo "Çoklu platform (linux/amd64, linux/arm64) Docker Buildx imajı hazırlanıyor: $IMAGE_NAME"
docker buildx create --name cryptopulse-builder --use 2>/dev/null || docker buildx use cryptopulse-builder
docker buildx build --platform linux/amd64,linux/arm64 -t "$IMAGE_NAME" .
echo "Tamamlandı!"
