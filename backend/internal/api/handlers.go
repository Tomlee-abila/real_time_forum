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
func RegisterRoutes(mux *http.ServeMux) {
	// Serve the Single page front-end
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/static/index.html")
	})

	// serve css
	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("frontend/static/css"))))

	// serve js
	mux.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("frontend/static/js"))))

	// API endpoints
	mux.HandleFunc("/register", RegisterHandler)
	mux.HandleFunc("/login", LoginHandler)
	mux.HandleFunc("/logout", LogoutHandler)
	mux.HandleFunc("/me", GetCurrentUserHandler)
}

// RegisterHandler handles user registration
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var userReg models.UserRegistration
	if err := json.NewDecoder(r.Body).Decode(&userReg); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	// Validate input
	if err := userReg.Validate(); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check if email already exists
	emailExists, err := database.CheckEmailExists(userReg.Email)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if emailExists {
		respondWithError(w, http.StatusConflict, "Email already exists")
		return
	}

	// Check if nickname already exists
	nicknameExists, err := database.CheckNicknameExists(userReg.Nickname)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if nicknameExists {
		respondWithError(w, http.StatusConflict, "Nickname already exists")
		return
	}

	// Create user
	user, err := database.CreateUser(&userReg)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Create session
	session, err := utils.CreateSession(user.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Set session cookie
	utils.SetSessionCookie(w, session.Token)

	// Respond with user data
	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "User registered successfully",
		"user":    user,
	})
}

// LoginHandler handles user login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var loginData models.UserLogin
	if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	// Validate input
	if err := loginData.Validate(); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate credentials
	user, err := database.ValidateUserCredentials(loginData.EmailOrNickname, loginData.Password)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Create session
	session, err := utils.CreateSession(user.ID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Set session cookie
	utils.SetSessionCookie(w, session.Token)

	// Respond with user data
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Login successful",
		"user":    user,
	})
}

// LogoutHandler handles user logout
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session token from cookie
	token, err := utils.GetSessionFromRequest(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "No active session")
		return
	}

	// Delete session from database
	if err := utils.DeleteSession(token); err != nil {
		// Even if deletion fails, clear the cookie
		fmt.Printf("Failed to delete session: %v\n", err)
	}

	// Clear session cookie
	utils.ClearSessionCookie(w)

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Logout successful",
	})
}

// GetCurrentUserHandler returns the current logged-in user
func GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session token from cookie
	token, err := utils.GetSessionFromRequest(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "No active session")
		return
	}

	// Get session from database
	session, err := utils.GetSessionByToken(token)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid or expired session")
		return
	}

	// Get user data
	user, err := database.GetUserByID(session.UserID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get user data")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

// Helper functions
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}
