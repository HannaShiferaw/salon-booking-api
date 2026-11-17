package tests

import (
	"path/filepath"
	"testing"

	"blush-salon/backend/internal/config"
	"blush-salon/backend/internal/database"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/services"
)

func testStore(t *testing.T) *repositories.Store {
	t.Helper()
	cfg := &config.Config{DatabaseURL: "sqlite:" + filepath.Join(t.TempDir(), "test.db"), SeedDemo: false}
	db, err := database.Connect(cfg)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	return repositories.New(db)
}

func TestRegisterAndLogin(t *testing.T) {
	store := testStore(t)
	auth := services.NewAuthService(store)

	u, err := auth.Register("Test User", "test@example.com", "+251900000000", "Password123")
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if u.Role != "customer" {
		t.Fatalf("expected customer role, got %s", u.Role)
	}
	if u.PasswordHash == "Password123" {
		t.Fatal("password must be hashed, not stored in plain text")
	}

	// Duplicate email must fail.
	if _, err := auth.Register("Other", "test@example.com", "", "Password123"); err == nil {
		t.Fatal("expected duplicate email to fail")
	}
	// Invalid email and short password must fail.
	if _, err := auth.Register("Bad", "not-an-email", "", "Password123"); err == nil {
		t.Fatal("expected invalid email to fail")
	}
	if _, err := auth.Register("Bad", "bad2@example.com", "", "short"); err == nil {
		t.Fatal("expected short password to fail")
	}

	// Login succeeds with correct password, fails with wrong one.
	if _, err := auth.Login("test@example.com", "Password123"); err != nil {
		t.Fatalf("login: %v", err)
	}
	if _, err := auth.Login("test@example.com", "WrongPass123"); err == nil {
		t.Fatal("expected wrong password to fail")
	}
	if _, err := auth.Login("nobody@example.com", "Password123"); err == nil {
		t.Fatal("expected unknown email to fail")
	}
}
