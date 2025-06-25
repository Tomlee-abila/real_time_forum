package main

import (
	"log"
	"net/http"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/api"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
)

func main(){
	//database initialization and migration
	database.Init()

	// Register routes
	mux := http.NewServeMux()
	api.RegisterRoutes(mux)

	port := ":8080"

	// start the server
	log.Printf("Server started at http://localhost:%s", port)
	if err := http.ListenAndServe(port, mux); err != nil{
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}