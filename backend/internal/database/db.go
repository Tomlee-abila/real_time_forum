package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Init() {
	var openErr error

	DB, openErr = sql.Open("sqlite3", "forum.db")

	if openErr != nil {
		log.Fatalf("Failed to open database: %v", openErr)
	}

	DB.SetMaxOpenConns(10) //allow up to 10 concurrent connections
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(0)

	//Test the connection
	if pingErr := DB.Ping(); pingErr != nil {
		log.Fatalf("Failed to connect to database: %v", pingErr)
	}

	//Run migration
	if migrateErr := runMigrations("migrations/001_init.sql"); migrateErr != nil {
		log.Fatalf("Failed to run migrations: %v", migrateErr)
	}

	log.Println("Database initialized and migrations applied successfully.")
}

func runMigrations(filepath string) error {

	content, err := os.ReadFile(filepath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	_, err = DB.Exec(string(content))
	if err != nil {
		return fmt.Errorf("migration execution failed: %w", err)
	}
	return nil
}
