package utils

import (
	"regexp"
	"strings"
	"time"
)

var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// IsValidEmail reports whether s looks like a deliverable email address.
func IsValidEmail(s string) bool { return emailRe.MatchString(strings.TrimSpace(s)) }

// IsValidPassword enforces the minimum password policy (8+ chars).
func IsValidPassword(s string) bool { return len(s) >= 8 }

// ParseDate parses a YYYY-MM-DD date, returning ok=false on bad input.
func ParseDate(s string) (time.Time, bool) {
	t, err := time.Parse("2006-01-02", s)
	return t, err == nil
}

// ToMinutes converts "HH:MM" to minutes since midnight.
func ToMinutes(hhmm string) (int, bool) {
	t, err := time.Parse("15:04", hhmm)
	if err != nil {
		return 0, false
	}
	return t.Hour()*60 + t.Minute(), true
}

// FromMinutes converts minutes since midnight back to "HH:MM".
func FromMinutes(m int) string {
	return time.Date(0, 1, 1, m/60, m%60, 0, 0, time.UTC).Format("15:04")
}

// Overlaps reports whether [startA,endA) overlaps [startB,endB).
// Times are minutes since midnight; touching endpoints do not overlap.
func Overlaps(startA, endA, startB, endB int) bool {
	return startA < endB && endA > startB
}
