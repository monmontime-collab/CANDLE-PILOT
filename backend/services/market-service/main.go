// backend/services/market-service/main.go
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
	Symbol    string  `json:"symbol"`
	Open      float64 `json:"open"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
	Close     float64 `json:"close"`
	Volume    float64 `json:"volume"`
	Timestamp int64   `json:"timestamp"`
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
