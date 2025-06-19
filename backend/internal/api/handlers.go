package api

import (
	"fmt"
	"net/http"
)

// RegisterRoutes adds all HTTP routes to the mux
func RegisterRoutes(mux *http.ServeMux){
	mux.HandleFunc("/register", RegisterHandler)
}

// Placeholder: /register
func RegisterHandler(w http.ResponseWriter, r *http.Request){
	fmt.Fprintln(w, "Register endpoint is live")
}