package api

import (
	"net/http"
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
