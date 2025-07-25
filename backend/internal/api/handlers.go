package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/utils"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/websocket"
)

// Global WebSocket hub reference
var wsHub *websocket.Hub

// RegisterRoutes adds all HTTP routes to the mux
func RegisterRoutes(mux *http.ServeMux, hub *websocket.Hub) {
	// Store hub reference for use in handlers
	wsHub = hub
	// Serve the Single page front-end
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/static/index.html")
	})

	// serve css
	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("frontend/static/css"))))

	// serve js
	mux.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("frontend/static/js"))))

	// Authentication endpoints
	mux.HandleFunc("/register", RegisterHandler)
	mux.HandleFunc("/login", LoginHandler)
	mux.HandleFunc("/logout", LogoutHandler)
	mux.HandleFunc("/me", GetCurrentUserHandler)

	// Post endpoints
	mux.HandleFunc("/posts", PostsHandler)
	mux.HandleFunc("/posts/", PostDetailHandler) // For /posts/{id} and /posts/{id}/comments
	mux.HandleFunc("/categories", CategoriesHandler)

	// Message endpoints
	mux.HandleFunc("/api/messages/conversations", GetConversationsHandler)
	mux.HandleFunc("/api/messages/history/", GetMessageHistoryHandler) // For /api/messages/history/{userID}
	mux.HandleFunc("/api/messages", MessagesHandler)                   // GET all messages, POST new message
	mux.HandleFunc("/api/messages/read/", MarkMessagesReadHandler)     // PUT /api/messages/read/{userID}
	mux.HandleFunc("/api/users/online", GetOnlineUsersHandler)
	mux.HandleFunc("/api/users/stats", GetUserStatsHandler)
}

// PostsHandler handles GET /posts (get all posts) and POST /posts (create post)
func PostsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetPostsHandler(w, r)
	case http.MethodPost:
		CreatePostHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// CreatePostHandler handles POST /posts - create new post
func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from session
	userID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var postData models.PostCreation
	if err := json.NewDecoder(r.Body).Decode(&postData); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	// Validate input
	if err := postData.Validate(); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Create post
	post, err := database.CreatePost(userID, &postData)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Post created successfully",
		"post":    post,
	})
}

// PostDetailHandler handles /posts/{id} and /posts/{id}/comments
func PostDetailHandler(w http.ResponseWriter, r *http.Request) {
	// Extract post ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/posts/")
	parts := strings.Split(path, "/")

	if len(parts) == 0 || parts[0] == "" {
		http.Error(w, "Post ID required", http.StatusBadRequest)
		return
	}

	postID := parts[0]

	// Check if this is a comment request
	if len(parts) > 1 && parts[1] == "comments" {
		if r.Method == http.MethodPost {
			CreateCommentHandler(w, r, postID)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// Handle post detail requests
	switch r.Method {
	case http.MethodGet:
		GetPostDetailHandler(w, r, postID)
	case http.MethodDelete:
		DeletePostHandler(w, r, postID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GetPostDetailHandler handles GET /posts/{id} - get post with comments
func GetPostDetailHandler(w http.ResponseWriter, r *http.Request, postID string) {
	postWithComments, err := database.GetPostWithComments(postID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondWithError(w, http.StatusNotFound, "Post not found")
		} else {
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve post")
		}
		return
	}

	respondWithJSON(w, http.StatusOK, postWithComments)
}

// CreateCommentHandler handles POST /posts/{id}/comments - create comment
func CreateCommentHandler(w http.ResponseWriter, r *http.Request, postID string) {
	// Get user from session
	userID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var commentData models.CommentCreation
	if err := json.NewDecoder(r.Body).Decode(&commentData); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	// Validate input
	if err := commentData.Validate(); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Create comment
	comment, err := database.CreateComment(userID, postID, &commentData)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondWithError(w, http.StatusNotFound, "Post not found")
		} else {
			respondWithError(w, http.StatusInternalServerError, "Failed to create comment")
		}
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Comment created successfully",
		"comment": comment,
	})
}

// DeletePostHandler handles DELETE /posts/{id} - delete post
func DeletePostHandler(w http.ResponseWriter, r *http.Request, postID string) {
	// Get user from session
	userID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Delete post
	err = database.DeletePost(postID, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			respondWithError(w, http.StatusNotFound, "Post not found")
		} else if strings.Contains(err.Error(), "unauthorized") {
			respondWithError(w, http.StatusForbidden, err.Error())
		} else {
			respondWithError(w, http.StatusInternalServerError, "Failed to delete post")
		}
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Post deleted successfully",
	})
}

// CategoriesHandler handles GET /categories - get available categories
func CategoriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	categories := models.GetValidCategories()
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"categories": categories,
	})
}

// Helper function to get user ID from session
func getUserIDFromSession(r *http.Request) (string, error) {
	token, err := utils.GetSessionFromRequest(r)
	if err != nil {
		return "", err
	}

	session, err := utils.GetSessionByToken(token)
	if err != nil {
		return "", err
	}

	return session.UserID, nil
}

// GetPostsHandler handles GET /posts - retrieve posts feed
func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	category := r.URL.Query().Get("category")

	// Set default values
	limit := 10
	offset := 0

	// Parse limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 50 {
			limit = parsedLimit
		}
	}

	// Parse offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	var posts []models.Post
	var err error

	// Get posts by category or all posts
	if category != "" {
		posts, err = database.GetPostsByCategory(category, limit, offset)
	} else {
		posts, err = database.GetAllPosts(limit, offset)
	}

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	// Get total count for pagination
	var totalCount int
	if category != "" {
		totalCount, _ = database.GetPostCountByCategory(category)
	} else {
		totalCount, _ = database.GetPostCount()
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"posts":       posts,
		"total_count": totalCount,
		"limit":       limit,
		"offset":      offset,
	})
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

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// Middleware to check authentication (for future use)
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := utils.GetSessionFromRequest(r)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		session, err := utils.GetSessionByToken(token)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "Invalid or expired session")
			return
		}

		// Add user ID to request context for use in handlers
		r.Header.Set("X-User-ID", session.UserID)
		next(w, r)
	}
}

// GetConversationsHandler handles GET /api/messages/conversations
func GetConversationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from session
	userID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Get conversations from database
	conversations, err := database.GetConversations(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get conversations")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"conversations": conversations,
	})
}

// GetMessageHistoryHandler handles GET /api/messages/history/{userID}
func GetMessageHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from session
	currentUserID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Extract other user ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/messages/history/")
	if path == "" {
		respondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}
	otherUserID := path

	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 10 // Default limit
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 50 {
			limit = parsedLimit
		}
	}

	offset := 0 // Default offset
	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	// Get message history from database
	messageHistory, err := database.GetMessageHistory(currentUserID, otherUserID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get message history")
		return
	}

	respondWithJSON(w, http.StatusOK, messageHistory)
}

// MessagesHandler handles GET /api/messages and POST /api/messages
func MessagesHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		CreateMessageHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// CreateMessageHandler handles POST /api/messages - create new message
func CreateMessageHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from session
	userID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Parse request body
	var messageCreation models.MessageCreation
	if err := json.Unmarshal([]byte(r.FormValue("data")), &messageCreation); err != nil {
		// Try reading from request body if form data fails
		decoder := json.NewDecoder(r.Body)
		if err := decoder.Decode(&messageCreation); err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
	}

	// Validate message
	if err := messageCreation.Validate(); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Create message in database
	message, err := database.CreateMessage(userID, &messageCreation)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create message")
		return
	}

	// Broadcast message via WebSocket if hub is available
	if wsHub != nil {
		messageEvent := websocket.CreateMessageEvent(message)
		wsHub.BroadcastMessageFromAPI(messageEvent, message.ReceiverID)
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Message sent successfully",
		"data":    message,
	})
}

// MarkMessagesReadHandler handles PUT /api/messages/read/{userID}
func MarkMessagesReadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from session
	currentUserID, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Extract sender user ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/messages/read/")
	if path == "" {
		respondWithError(w, http.StatusBadRequest, "Sender user ID is required")
		return
	}
	senderUserID := path

	// Mark messages as read
	err = database.MarkMessagesAsRead(currentUserID, senderUserID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to mark messages as read")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Messages marked as read",
	})
}

// GetOnlineUsersHandler handles GET /api/users/online
func GetOnlineUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from session (authentication required)
	_, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Get online users from active sessions (users with valid sessions)
	onlineUsers, err := database.GetActiveSessionUsers()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get online users")
		return
	}

	// Enhance with WebSocket connection status if hub is available
	if wsHub != nil {
		wsUsers := wsHub.GetOnlineUserDetails()
		wsUserMap := make(map[string]bool)

		// Create map of WebSocket connected users
		for _, wsUser := range wsUsers {
			if userID, ok := wsUser["user_id"].(string); ok {
				wsUserMap[userID] = true
			}
		}

		// Mark session users with WebSocket connection status
		for i := range onlineUsers {
			if userID, ok := onlineUsers[i]["user_id"].(string); ok {
				onlineUsers[i]["websocket_connected"] = wsUserMap[userID]
			} else {
				onlineUsers[i]["websocket_connected"] = false
			}
		}
	} else {
		// If no WebSocket hub, mark all as not WebSocket connected
		for i := range onlineUsers {
			onlineUsers[i]["websocket_connected"] = false
		}
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"users": onlineUsers,
		"count": len(onlineUsers),
	})
}

// GetUserStatsHandler handles GET /api/users/stats
func GetUserStatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Authenticate user
	_, err := getUserIDFromSession(r)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Get online user count from active sessions (users with valid sessions)
	onlineCount, err := database.GetActiveSessionCount()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get online user count")
		return
	}

	// Get total registered users from database
	totalUsers, err := database.GetTotalUserCount()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get user statistics")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total_users":   totalUsers,
		"online_users":  onlineCount,
		"offline_users": totalUsers - onlineCount,
	})
}
