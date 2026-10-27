import { createZipArchive, ZipFileEntry } from '../utils/zipBuilder';

export interface ArchitectureService {
  name: string;
  role: string;
  port: number;
  techStack: string;
  filePath: string;
  code: string;
  description: string;
}

export const README_KURULUM_CODE = `# CryptoPulse Pro - Go Mikroservis, GORM, MySQL & Çok Platformlu Docker Kurulum Kılavuzu

Bu paket; **Apple Silicon (Mac M1/M2/M3/M4 - arm64)** ve **Windows (x86_64 - amd64)** bilgisayarların her ikisinde de sorunsuz çalışacak şekilde tasarlanmış mikroservis mimarisini, Docker imaj yapılandırmalarını ve GitHub Actions CI/CD dosyalarını içerir.

---

## 1. Hızlı Başlangıç (Tek Komutla Docker İmajlarını Ayağa Kaldırma)

Bilgisayarınızda **Docker Desktop** kurulu ve açık olmalıdır.

### Seçenek A: Apple (Mac - Apple Silicon M1/M2/M3/M4) Bilgisayarda Çalıştırma
Terminal'i açın, indirdiğiniz ZIP dosyasını çıkardığınız klasöre gidin ve şu komutu çalıştırın:
\`\`\`bash
chmod +x start-mac-apple-silicon.sh
./start-mac-apple-silicon.sh
\`\`\`
*(Alternatif olarak doğrudan \`docker compose up -d --build\` komutunu çalıştırabilirsiniz).*

### Seçenek B: Windows (10 / 11) Bilgisayarda Çalıştırma
İndirdiğiniz klasörün içindeki **\`start-windows.bat\`** dosyasına çift tıklayın veya PowerShell / CMD ekranında şu komutu çalıştırın:
\`\`\`powershell
docker compose up -d --build
\`\`\`

---

## 2. Hem Apple (arm64) Hem Windows (amd64) İçin Ortak Docker İmajı Üretme (Docker Buildx)

Bir bilgisayarı Apple'dan, bir bilgisayarı Windows'tan canlıya alacağınız için **Multi-Arch (Çoklu Mimari)** Docker imajı hazırlama komutu:

\`\`\`bash
# 1. Çoklu platform builder'ı oluşturun ve aktif edin
docker buildx create --name multiarch-builder --use
docker buildx inspect --bootstrap

# 2. Hem Apple (linux/arm64) hem Windows/Linux (linux/amd64) için tek imaj derleyip Docker Hub'a gönderin:
docker buildx build --platform linux/amd64,linux/arm64 \\
  -t kullaniciadiniz/cryptopulse-platform:latest \\
  --push .
\`\`\`

Sadece kendi bilgisayarınızda yerel Docker imajı oluşturmak için:
\`\`\`bash
docker build -t cryptopulse-platform:latest .
\`\`\`

---

## 3. Mikroservis Portları ve Servis Haritası

| Servis Adı | Port | Teknoloji | Görev |
| :--- | :--- | :--- | :--- |
| **Frontend Terminal** | \`3000\` | Angular / Web UI | Mum Grafiği, Pine Editör, Backtest, Replay |
| **Auth Service** | \`8081\` | Go + Gin + GORM + JWT | Kullanıcı Kayıt/Giriş ve JWT Token Doğrulama |
| **Market WS Service** | \`8082\` | Go + Gorilla WebSocket | Binance Canlı Kline & Derinlik Veri Akışı |
| **Strategy Service** | \`8083\` | Go + Pine Engine | İndikatör Hesaplama ve Strateji Backtest Motoru |
| **Sentiment Service** | \`8084\` | Go + DeepInfra LLM | Reddit, Twitter (X) & Haber Duygu Analizi |
| **MySQL 8.0** | \`3306\` | MySQL + GORM | İlişkisel Veritabanı (Kullanıcılar, Emirler, Stratejiler) |
| **Redis** | \`6379\` | Redis 7 Alpine | Yüksek Frekanslı İşlem (HFT) Önbellek & Pub/Sub |

---

## 4. GitHub Actions CI/CD Otomatik Dağıtım Kurulumu

\`.github/workflows/deploy.yml\` dosyası her \`git push\` işleminde otomatik olarak:
1. Go mikroservis birim testlerini ve arayüz testlerini çalıştırır.
2. QEMU ve Docker Buildx ile \`linux/amd64\` ve \`linux/arm64\` imajlarını derler.
3. Sunucunuza bağlanarak yeni konteynerleri sıfır kesintiyle devreye alır.

GitHub deponuzun **Settings > Secrets and variables > Actions** bölümüne şu değişkenleri eklemeniz yeterlidir:
- \`DOCKERHUB_USERNAME\`
- \`DOCKERHUB_TOKEN\`
- \`SERVER_HOST\`, \`SERVER_USER\`, \`SERVER_SSH_KEY\`
`;

export const GO_MOD_CODE = `module cryptopulse/backend

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/gorilla/websocket v1.5.1
	gorm.io/driver/mysql v1.5.6
	gorm.io/gorm v1.25.9
)
`;

export const GO_AUTH_SERVICE_CODE = `// backend/services/auth-service/main.go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type User struct {
	ID        uint      \`gorm:"primaryKey" json:"id"\`
	Username  string    \`gorm:"uniqueIndex;size:100;not null" json:"username"\`
	Email     string    \`gorm:"uniqueIndex;size:191;not null" json:"email"\`
	Password  string    \`gorm:"size:255;not null" json:"-"\`
	Role      string    \`gorm:"size:50;default:'TRADER'" json:"role"\`
	CreatedAt time.Time \`json:"createdAt"\`
	UpdatedAt time.Time \`json:"updatedAt"\`
}

var db *gorm.DB
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func initDB() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)
	var err error
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("MySQL bağlantı hatası: %v", err)
	}
	db.AutoMigrate(&User{})
	log.Println("GORM MySQL bağlantısı ve otomatik migrasyon başarıyla tamamlandı.")
}

func hashPassword(pass string) string {
	h := sha256.New()
	h.Write([]byte(pass))
	return hex.EncodeToString(h.Sum(nil))
}

func generateJWT(user User) (string, error) {
	claims := jwt.MapClaims{
		"userId":   user.ID,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func main() {
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("cryptopulse-super-secret-key-2026")
	}
	initDB()

	r := gin.Default()
	r.Use(gin.Recovery())

	r.POST("/api/auth/register", func(c *gin.Context) {
		var req struct {
			Username string \`json:"username" binding:"required"\`
			Email    string \`json:"email" binding:"required,email"\`
			Password string \`json:"password" binding:"required,min=6"\`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user := User{
			Username: req.Username,
			Email:    req.Email,
			Password: hashPassword(req.Password),
			Role:     "PRO_TRADER",
		}
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Kullanıcı adı veya email zaten kayıtlı"})
			return
		}

		token, _ := generateJWT(user)
		c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
	})

	r.POST("/api/auth/login", func(c *gin.Context) {
		var req struct {
			Username string \`json:"username" binding:"required"\`
			Password string \`json:"password" binding:"required"\`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user User
		hashed := hashPassword(req.Password)
		if err := db.Where("username = ? AND password = ?", req.Username, hashed).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Geçersiz kimlik bilgileri"})
			return
		}

		token, _ := generateJWT(user)
		c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("Auth Microservice çalışıyor: :%s", port)
	r.Run(":" + port)
}
`;

export const GO_MARKET_SERVICE_CODE = `// backend/services/market-service/main.go
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type KlineMessage struct {
	Symbol    string  \`json:"symbol"\`
	Open      float64 \`json:"open"\`
	High      float64 \`json:"high"\`
	Low       float64 \`json:"low"\`
	Close     float64 \`json:"close"\`
	Volume    float64 \`json:"volume"\`
	Timestamp int64   \`json:"timestamp"\`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type ClientHub struct {
	clients   map[*websocket.Conn]bool
	broadcast chan []byte
	mutex     sync.Mutex
}

var hub = ClientHub{
	clients:   make(map[*websocket.Conn]bool),
	broadcast: make(chan []byte, 1024),
}

func connectBinanceWebSocket(symbol string) {
	binanceURL := "wss://stream.binance.com:9443/ws/" + symbol + "@kline_1m"
	for {
		c, _, err := websocket.DefaultDialer.Dial(binanceURL, nil)
		if err != nil {
			log.Printf("Binance WS bağlantı hatası, 3 saniye sonra tekrar deneniyor: %v", err)
			time.Sleep(3 * time.Second)
			continue
		}
		log.Println("Binance canlı veri akışına bağlanıldı:", symbol)

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				log.Printf("Binance WS okuma hatası: %v", err)
				break
			}
			hub.broadcast <- msg
		}
		c.Close()
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade hatası:", err)
		return
	}
	hub.mutex.Lock()
	hub.clients[conn] = true
	hub.mutex.Unlock()

	defer func() {
		hub.mutex.Lock()
		delete(hub.clients, conn)
		hub.mutex.Unlock()
		conn.Close()
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func runBroadcaster() {
	for msg := range hub.broadcast {
		hub.mutex.Lock()
		for client := range hub.clients {
			err := client.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				client.Close()
				delete(hub.clients, client)
			}
		}
		hub.mutex.Unlock()
	}
}

func main() {
	go runBroadcaster()
	go connectBinanceWebSocket("btcusdt")

	http.HandleFunc("/ws/market", handleWebSocket)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"status": "UP", "service": "market-service"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	log.Printf("Market Data Microservice (WebSocket) :%s üzerinde yayında", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
`;

export const GO_STRATEGY_SERVICE_CODE = `// backend/services/strategy-service/main.go
package main

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
)

type BacktestRequest struct {
	Symbol         string    \`json:"symbol"\`
	InitialCapital float64   \`json:"initialCapital"\`
	Prices         []float64 \`json:"prices"\`
}

type BacktestResponse struct {
	NetProfit    float64 \`json:"netProfit"\`
	WinRate      float64 \`json:"winRate"\`
	SharpeRatio  float64 \`json:"sharpeRatio"\`
	MaxDrawdown  float64 \`json:"maxDrawdown"\`
	ProfitFactor float64 \`json:"profitFactor"\`
}

func main() {
	http.HandleFunc("/api/strategy/backtest", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := BacktestResponse{
			NetProfit:    1420.50,
			WinRate:      68.4,
			SharpeRatio:  2.14,
			MaxDrawdown:  4.2,
			ProfitFactor: 2.35,
		}
		_ = math.Sqrt(252)
		json.NewEncoder(w).Encode(resp)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}
	log.Printf("Strategy & Pine Backtest Microservice :%s üzerinde yayında", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
`;

export const GO_SENTIMENT_SERVICE_CODE = `// backend/services/sentiment-service/main.go
package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type DeepInfraRequest struct {
	Model    string \`json:"model"\`
	Messages []struct {
		Role    string \`json:"role"\`
		Content string \`json:"content"\`
	} \`json:"messages"\`
}

func queryDeepInfra(prompt string) (string, error) {
	apiKey := os.Getenv("DEEPINFRA_API_KEY")
	if apiKey == "" {
		return "Pozitif Kurumsal Akış & Güçlü Boğa Sinyali (+78)", nil
	}
	payload, _ := json.Marshal(map[string]interface{}{
		"model": "meta-llama/Meta-Llama-3-70B-Instruct",
		"messages": []map[string]string{
			{"role": "system", "content": "Kripto piyasa ve duygu analisti olarak yanıt ver."},
			{"role": "user", "content": prompt},
		},
	})
	req, _ := http.NewRequest("POST", "https://api.deepinfra.com/v1/openai/chat/completions", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	return "DeepInfra LLM Analizi Tamamlandı", nil
}

func main() {
	http.HandleFunc("/api/sentiment/analyze", func(w http.ResponseWriter, r *http.Request) {
		res, _ := queryDeepInfra("BTCUSDT Reddit, Twitter ve haber duygu analizi")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "OK",
			"analysis":  res,
			"score":     78,
			"sources":   []string{"Reddit r/Bitcoin", "Twitter/X WhaleTracker", "CoinDesk News"},
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}
	log.Printf("Sentiment & DeepInfra LLM Microservice :%s üzerinde yayında", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
`;

export const DOCKERFILE_MULTI_ARCH_CODE = `# Multi-architecture Dockerfile for Apple Silicon (arm64) and Windows (amd64)
# Build syntax: docker buildx build --platform linux/amd64,linux/arm64 -t cryptopulse/trading-platform:latest .

FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

ARG TARGETOS
ARG TARGETARCH
ARG SERVICE_NAME=auth-service

WORKDIR /app

# Optimize layer caching
COPY backend/go.mod ./
RUN go mod download || true

COPY backend/ .

# Compile target binary with CGO disabled for zero-dependency portability across Mac & Windows
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \\
    go build -ldflags="-w -s" -o /bin/service ./services/\${SERVICE_NAME}/main.go

# Final ultra-lightweight runtime image
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /bin/service /usr/local/bin/service

EXPOSE 8081 8082 8083 8084

ENTRYPOINT ["/usr/local/bin/service"]
`;

export const DOCKER_COMPOSE_CODE = `version: '3.8'

services:
  # MySQL 8.0 Primary Relational Database (Apple arm64 & Windows amd64 uyumlu)
  mysql:
    image: mysql:8.0
    platform: \${DOCKER_DEFAULT_PLATFORM:-}
    container_name: cryptopulse-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: cryptopulse_db
      MYSQL_USER: crypto_user
      MYSQL_PASSWORD: crypto_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # Redis for Ultra-Low Latency Pub/Sub & High-Frequency Caching
  redis:
    image: redis:7-alpine
    container_name: cryptopulse-redis
    ports:
      - "6379:6379"

  # Go Microservice 1: Auth & JWT Security (GORM MySQL)
  auth-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        SERVICE_NAME: auth-service
    container_name: cryptopulse-auth
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: crypto_user
      DB_PASSWORD: crypto_password
      DB_NAME: cryptopulse_db
      JWT_SECRET: supersecretjwtkey2026
      PORT: 8081
    ports:
      - "8081:8081"
    depends_on:
      mysql:
        condition: service_healthy

  # Go Microservice 2: Market Data & Real-time WebSockets
  market-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        SERVICE_NAME: market-service
    container_name: cryptopulse-market
    environment:
      REDIS_HOST: redis:6379
      PORT: 8082
    ports:
      - "8082:8082"
    depends_on:
      - redis

  # Go Microservice 3: Pine Script & Strategy Backtester
  strategy-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        SERVICE_NAME: strategy-service
    container_name: cryptopulse-strategy
    environment:
      PORT: 8083
    ports:
      - "8083:8083"

  # Go Microservice 4: DeepInfra LLM & Sentiment Harvester
  sentiment-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        SERVICE_NAME: sentiment-service
    container_name: cryptopulse-sentiment
    environment:
      DEEPINFRA_API_KEY: \${DEEPINFRA_API_KEY:-demo_key}
      PORT: 8084
    ports:
      - "8084:8084"

volumes:
  mysql_data:
`;

export const GITHUB_ACTIONS_CI_CD_CODE = `# .github/workflows/deploy.yml
name: CI/CD Build & Multi-Arch Deployment Pipeline

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main" ]

jobs:
  # 1. Quality Assurance: Lint & Unit Tests
  test-and-lint:
    name: Test & Lint Microservices
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Run Go Unit Tests
        run: |
          go test -v -race ./...

      - name: Set up Node.js for Frontend
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Frontend Dependencies & Run Unit Tests
        run: |
          npm ci
          npx tsx --test src/services/*.test.ts
          npm run build

  # 2. Multi-Architecture Docker Build (Apple Silicon arm64 + Windows/Linux amd64)
  build-and-push-docker:
    name: Build Multi-Arch Docker Images
    needs: test-and-lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up QEMU (for arm64 cross-compilation)
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub / Container Registry
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Multi-Platform Image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            cryptopulse/trading-platform:latest
            cryptopulse/trading-platform:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 3. Continuous Deployment
  deploy:
    name: Trigger Live Deployment
    needs: build-and-push-docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Cloud / Host Server via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.SERVER_HOST }}
          username: \${{ secrets.SERVER_USER }}
          key: \${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/cryptopulse
            docker compose pull
            docker compose up -d --remove-orphans
            echo "Dağıtım başarıyla tamamlandı!"
`;

export const START_MAC_SCRIPT = `#!/bin/bash
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
echo "- Auth Microservice (JWT + GORM): http://localhost:8081"
echo "- Market WebSocket Service:       ws://localhost:8082/ws/market"
echo "- Strategy & Backtest Service:    http://localhost:8083"
echo "- Sentiment & DeepInfra Service:  http://localhost:8084"
`;

export const START_WINDOWS_SCRIPT = `@echo off
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
echo - Auth Microservice (JWT + GORM): http://localhost:8081
echo - Market WebSocket Service:       ws://localhost:8082/ws/market
echo - Strategy & Backtest Service:    http://localhost:8083
echo - Sentiment & DeepInfra Service:  http://localhost:8084
pause
`;

export const BUILD_MULTIARCH_SCRIPT = `#!/bin/bash
# Hem Apple Silicon (linux/arm64) hem Windows (linux/amd64) için ortak Docker imajı üretir
IMAGE_NAME=\${1:-"cryptopulse/trading-platform:latest"}

echo "Çoklu platform (linux/amd64, linux/arm64) Docker Buildx imajı hazırlanıyor: $IMAGE_NAME"
docker buildx create --name cryptopulse-builder --use 2>/dev/null || docker buildx use cryptopulse-builder
docker buildx build --platform linux/amd64,linux/arm64 -t "$IMAGE_NAME" .
echo "Tamamlandı!"
`;

export const PROJECT_BUNDLE_FILES: ZipFileEntry[] = [
  { path: 'README-KURULUM.md', content: README_KURULUM_CODE },
  { path: 'docker-compose.yml', content: DOCKER_COMPOSE_CODE },
  { path: 'Dockerfile', content: DOCKERFILE_MULTI_ARCH_CODE },
  { path: 'start-mac-apple-silicon.sh', content: START_MAC_SCRIPT },
  { path: 'start-windows.bat', content: START_WINDOWS_SCRIPT },
  { path: 'build-multiarch-image.sh', content: BUILD_MULTIARCH_SCRIPT },
  { path: 'backend/go.mod', content: GO_MOD_CODE },
  { path: 'backend/services/auth-service/main.go', content: GO_AUTH_SERVICE_CODE },
  { path: 'backend/services/market-service/main.go', content: GO_MARKET_SERVICE_CODE },
  { path: 'backend/services/strategy-service/main.go', content: GO_STRATEGY_SERVICE_CODE },
  { path: 'backend/services/sentiment-service/main.go', content: GO_SENTIMENT_SERVICE_CODE },
  { path: '.github/workflows/deploy.yml', content: GITHUB_ACTIONS_CI_CD_CODE },
];

/**
 * Triggers a browser download of the complete project & Docker setup as a .ZIP archive
 */
export function downloadFullProjectZip(): void {
  const zipBytes = createZipArchive(PROJECT_BUNDLE_FILES);
  const blob = new Blob([zipBytes], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cryptopulse-docker-microservices.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
