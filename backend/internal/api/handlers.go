package api

import (
	"fmt"
	"net/http"
)

// RegisterRoutes adds all HTTP routes to the mux
func RegisterRoutes(mux *http.ServeMux){

	// Serve the Single page front-end
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/static/index.html")
	})

	// serve css
	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("frontend/static/css"))))

	// serve js
	mux.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("frontend/static/js"))))

	mux.HandleFunc("/register", RegisterHandler)
}

// Placeholder: /register
func RegisterHandler(w http.ResponseWriter, r *http.Request){
	fmt.Fprintln(w, "Register endpoint is live")
}