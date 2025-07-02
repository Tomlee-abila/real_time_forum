package websocket

import (
	"log"
	"net/http"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/utils"
)

// WebSocketHandler handles WebSocket upgrade requests
func WebSocketHandler(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// Get user from session
	token, err := utils.GetSessionFromRequest(r)
	if err != nil {
		http.Error(w, "Authentication required", http.StatusUnauthorized)
		return
	}

	session, err := utils.GetSessionByToken(token)
	if err != nil {
		http.Error(w, "Invalid or expired session", http.StatusUnauthorized)
		return
	}

	user, err := database.GetUserByID(session.UserID)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Create new client
	client := NewClient(hub, conn, user.ID, user.Nickname)

	// Register client with hub
	hub.register <- client

	// Start goroutines for reading and writing
	go client.WritePump()
	go client.ReadPump()
}

// CreateWebSocketHandler creates a WebSocket handler with hub dependency injection
func CreateWebSocketHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		WebSocketHandler(hub, w, r)
	}
}
