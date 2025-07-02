package main

import (
	"log"
	"net/http"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/api"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/websocket"
)

func main() {
	//database initialization and migration
	database.Init()

	// Create and start WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Register routes
	mux := http.NewServeMux()
	api.RegisterRoutes(mux)

	// Add WebSocket endpoint
	mux.HandleFunc("/ws", websocket.CreateWebSocketHandler(hub))

	port := ":8080"

	// start the server
	log.Printf("Server started at http://localhost%s", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
