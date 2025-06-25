package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB


func Init(){
	var err error

	DB, err = sql.Open("sqlite3", "forum.db")

	if err != nil{
		log.Fatalf("Failed to open database: %v", err)
	}

	DB.SetMaxOpenConns(10) //allow up to 10 concurrent connections
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(0)

	//Test the connection
	if err := DB.Ping(); err != nil{
		log.Fatalf("Failed to connect to database: %v", err)
	}

	//Run migration
	if err := runMigrations("migrations/001_init.sql"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Database initialized and migrations applied successfully.")
}

func runMigrations(filepath string) error{

	content, err := os.ReadFile(filepath)
	if err != nil{
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	_, err = DB.Exec(string(content))
	if err != nil{
		return fmt.Errorf("migration execution failed: %w", err)
	}
	return nil
}