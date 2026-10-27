# CryptoPulse Pro - Go Mikroservis, GORM, MySQL & Çok Platformlu Docker Kurulum Kılavuzu

Bu paket; **Apple Silicon (Mac M1/M2/M3/M4 - arm64)** ve **Windows (x86_64 - amd64)** bilgisayarların her ikisinde de sorunsuz çalışacak şekilde tasarlanmış mikroservis mimarisini, Docker imaj yapılandırmalarını ve GitHub Actions CI/CD dosyalarını içerir.

## 1. Hızlı Başlangıç (Tek Komutla Docker İmajlarını Ayağa Kaldırma)

Bilgisayarınızda **Docker Desktop** kurulu ve açık olmalıdır.

### Seçenek A: Apple (Mac - Apple Silicon M1/M2/M3/M4) Bilgisayarda Çalıştırma
```bash
chmod +x start-mac-apple-silicon.sh
./start-mac-apple-silicon.sh
```

### Seçenek B: Windows (10 / 11) Bilgisayarda Çalıştırma
`start-windows.bat` dosyasına çift tıklayın veya PowerShell'de şu komutu çalıştırın:
```powershell
docker compose up -d --build
```

## 2. Hem Apple (arm64) Hem Windows (amd64) İçin Ortak Docker İmajı Üretme (Docker Buildx)
```bash
docker buildx create --name multiarch-builder --use
docker buildx build --platform linux/amd64,linux/arm64 -t kullaniciadiniz/cryptopulse-platform:latest --push .
```
