package middleware

import (
	"strings"
	"time"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken issues a 24h JWT for a user.
func GenerateToken(secret string, user *models.User) (string, error) {
	claims := Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

// Auth validates the Bearer token and stores user id/role in the context.
func Auth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			utils.Fail(c, 401, "Authentication required")
			c.Abort()
			return
		}
		token, err := jwt.ParseWithClaims(strings.TrimPrefix(h, "Bearer "), &Claims{}, func(t *jwt.Token) (any, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			utils.Fail(c, 401, "Invalid or expired token")
			c.Abort()
			return
		}
		claims, ok := token.Claims.(*Claims)
		if !ok {
			utils.Fail(c, 401, "Invalid token")
			c.Abort()
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}

// RequireRole aborts unless the authenticated user has one of the roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("userRole")
		for _, r := range roles {
			if role == r {
				c.Next()
				return
			}
		}
		utils.Fail(c, 403, "You do not have permission to do that")
		c.Abort()
	}
}

// CurrentUserID returns the authenticated user's id from the context.
func CurrentUserID(c *gin.Context) uuid.UUID {
	id, _ := c.Get("userID")
	uid, _ := id.(uuid.UUID)
	return uid
}

// CurrentRole returns the authenticated user's role.
func CurrentRole(c *gin.Context) string {
	role, _ := c.Get("userRole")
	r, _ := role.(string)
	return r
}
