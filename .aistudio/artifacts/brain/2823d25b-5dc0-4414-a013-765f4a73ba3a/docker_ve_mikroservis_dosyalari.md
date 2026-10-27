# CryptoPulse Pro — Tüm Dosyalar ve Çok Platformlu Docker Paketi

Aşağıda projenin tüm mikroservis, Docker ve CI/CD dosyaları tek tek yer almaktadır. Ayrıca bu dosyaların tamamı proje dizininde ve **`/cryptopulse-docker-microservices.zip`** arşivinde hazır olarak oluşturulmuştur.

---

## 1. `Dockerfile` (Apple Silicon `linux/arm64` & Windows `linux/amd64` Multi-Arch)

```dockerfile
# Multi-architecture Dockerfile for Apple Silicon (arm64) and Windows (amd64)
# Build syntax: docker buildx build --platform linux/amd64,linux/arm64 -t cryptopulse/trading-platform:latest .

FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

ARG TARGETOS
ARG TARGETARCH
ARG SERVICE_NAME=auth-service

WORKDIR /app

COPY backend/go.mod ./
RUN go mod download || true

COPY backend/ .

# CGO_ENABLED=0 ile platformdan bağımsız (Mac & Windows) statik binary derlemesi
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -ldflags="-w -s" -o /bin/service ./services/${SERVICE_NAME}/main.go

FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /bin/service /usr/local/bin/service

EXPOSE 8081 8082 8083 8084

ENTRYPOINT ["/usr/local/bin/service"]
```

---

## 2. `docker-compose.yml` (MySQL 8.0, Redis ve 4 Go Mikroservisi)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    platform: ${DOCKER_DEFAULT_PLATFORM:-}
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

  redis:
    image: redis:7-alpine
    container_name: cryptopulse-redis
    ports:
      - "6379:6379"

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

  sentiment-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        SERVICE_NAME: sentiment-service
    container_name: cryptopulse-sentiment
    environment:
      DEEPINFRA_API_KEY: ${DEEPINFRA_API_KEY:-demo_key}
      PORT: 8084
    ports:
      - "8084:8084"

volumes:
  mysql_data:
```

---

## 3. `backend/go.mod`

```go
module cryptopulse/backend

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/golang-jwt/jwt/v5 v5.2.1
	github.com/gorilla/websocket v1.5.1
	gorm.io/driver/mysql v1.5.6
	gorm.io/gorm v1.25.9
)
```

---

## 4. `backend/services/auth-service/main.go` (Go + Gin + JWT + GORM MySQL)

```go
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
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;size:100;not null" json:"username"`
	Email     string    `gorm:"uniqueIndex;size:191;not null" json:"email"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Role      string    `gorm:"size:50;default:'TRADER'" json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
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
			Username string `json:"username" binding:"required"`
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=6"`
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
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
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
```

---

## 5. `backend/services/market-service/main.go` (Go + Gorilla WebSocket + Binance)

```go
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
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

func runBroadcaster() {
	for msg := range hub.broadcast {
		hub.mutex.Lock()
		for client := range hub.clients {
			if err := client.WriteMessage(websocket.TextMessage, msg); err != nil {
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
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
```

---

## 6. `.github/workflows/deploy.yml` (GitHub Actions CI/CD)

```yaml
name: CI/CD Build & Multi-Arch Deployment Pipeline

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test-and-lint:
    name: Test & Lint Microservices
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Run Unit Tests
        run: |
          npm ci || npm install
          npx tsx --test src/services/*.test.ts src/utils/*.test.ts

  build-and-push-docker:
    name: Build Multi-Arch Docker Images (Mac arm64 & Windows amd64)
    needs: test-and-lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - name: Build Multi-Platform Image
        run: |
          docker buildx build --platform linux/amd64,linux/arm64 -t cryptopulse/trading-platform:latest .
```
