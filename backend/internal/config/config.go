package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration, loaded from the environment.
// Secrets are never hardcoded here; see .env.example for placeholders.
type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	CORSOrigins []string
	SeedDemo    bool
	AdminEmail  string
	AdminPass   string
	SalonName   string
	Environment string
}

func Load() *Config {
	_ = godotenv.Load() // optional: .env file for local dev only

	c := &Config{
		Port:        envOr("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   envOr("JWT_SECRET", "dev-only-change-me-in-production"),
		SalonName:   envOr("SALON_NAME", "Blush Beauty Salon"),
		Environment: envOr("ENV", "development"),
		AdminEmail:  envOr("ADMIN_EMAIL", "admin@blushsalon.com"),
		AdminPass:   envOr("ADMIN_PASSWORD", "Admin123!"),
		SeedDemo:    envBool("SEED_DEMO", true),
	}
	origins := envOr("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173,https://hannashiferaw.github.io")
	parts := strings.Split(origins, ",")
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			c.CORSOrigins = append(c.CORSOrigins, p)
		}
	}
	return c
}

// IsSQLite reports whether the configured database is SQLite (local fallback).
func (c *Config) IsSQLite() bool {
	return c.DatabaseURL == "" || strings.HasPrefix(c.DatabaseURL, "sqlite:")
}

// SQLitePath returns the SQLite file path, defaulting to blush.db.
func (c *Config) SQLitePath() string {
	if strings.HasPrefix(c.DatabaseURL, "sqlite:") {
		return strings.TrimPrefix(c.DatabaseURL, "sqlite:")
	}
	return "blush.db"
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}
