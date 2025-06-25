package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/utils"
)

// RegisterRoutes adds all HTTP routes to the mux
func RegisterRoutes(mux *http.ServeMux){

	// Serve the Single page front-end
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/static/index.html")
	})

	// Authentication routes
	mux.HandleFunc("/register", RegisterHandler)
	mux.HandleFunc("/logout", LogoutHandler)
}

// Placeholder: /register
func RegisterHandler(w http.ResponseWriter, r *http.Request){
	fmt.Fprintln(w, "Register endpoint is live")
}

// LogoutHandler handles user logout
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Set content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Get session from cookie
	session, err := utils.GetSessionFromCookie(r)
	if err != nil {
		// If no session found, still return success (idempotent operation)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
		return
	}

	// Delete session from database
	if err := utils.DeleteSession(session.Token); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to logout"})
		return
	}

	// Clear session cookie
	utils.ClearSessionCookie(w)

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
}