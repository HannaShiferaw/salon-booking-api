package database

import (
	"fmt"

	"blush-salon/backend/internal/config"
	"blush-salon/backend/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Connect opens the database. PostgreSQL is used when DATABASE_URL is set
// to a Postgres DSN; otherwise a local SQLite file is used so the app runs
// with zero setup. This fallback is for local development only.
func Connect(cfg *config.Config) (*gorm.DB, error) {
	var db *gorm.DB
	var err error
	if cfg.IsSQLite() {
		path := cfg.SQLitePath()
		db, err = gorm.Open(sqlite.Open(path), &gorm.Config{})
		if err != nil {
			return nil, fmt.Errorf("open sqlite %s: %w", path, err)
		}
	} else {
		db, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
		if err != nil {
			return nil, fmt.Errorf("open postgres: %w", err)
		}
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Service{},
		&models.Staff{},
		&models.StaffService{},
		&models.StaffSchedule{},
		&models.BlockedDate{},
		&models.Appointment{},
		&models.SalonSetting{},
	); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}
	if cfg.SeedDemo {
		if err := Seed(db, cfg); err != nil {
			return nil, fmt.Errorf("seed: %w", err)
		}
	}
	return db, nil
}
