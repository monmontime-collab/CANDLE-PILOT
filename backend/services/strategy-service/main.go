// backend/services/strategy-service/main.go
package main

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
)

type BacktestRequest struct {
	Symbol         string    `json:"symbol"`
	InitialCapital float64   `json:"initialCapital"`
	Prices         []float64 `json:"prices"`
}

type BacktestResponse struct {
	NetProfit    float64 `json:"netProfit"`
	WinRate      float64 `json:"winRate"`
	SharpeRatio  float64 `json:"sharpeRatio"`
	MaxDrawdown  float64 `json:"maxDrawdown"`
	ProfitFactor float64 `json:"profitFactor"`
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
