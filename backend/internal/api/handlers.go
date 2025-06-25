package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
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
	mux.HandleFunc("/login", LoginHandler)
}

// Placeholder: /register
func RegisterHandler(w http.ResponseWriter, r *http.Request){
	fmt.Fprintln(w, "Register endpoint is live")
}

// LoginHandler handles user login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Set content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var loginReq models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if loginReq.EmailOrNickname == "" || loginReq.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email/nickname and password are required"})
		return
	}

	// Get user from database
	user, err := database.GetUserByEmailOrNickname(loginReq.EmailOrNickname)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Verify password
	if err := database.VerifyPassword(user.Password, loginReq.Password); err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Generate session token
	session, err := utils.GenerateSessionToken(user.ID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create session"})
		return
	}

	// Set session cookie
	utils.SetSessionCookie(w, session.Token)

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"user": map[string]interface{}{
			"id":         user.ID,
			"nickname":   user.Nickname,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"email":      user.Email,
		},
	})
}