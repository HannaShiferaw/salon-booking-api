package middleware

import (
	"github.com/gin-gonic/gin"
)

// CORS allows the configured frontend origins. Credentials are not used
// (auth is via Bearer tokens), so a permissive-but-listed policy is enough.
func CORS(origins []string) gin.HandlerFunc {
	allowed := map[string]bool{}
	for _, o := range origins {
		allowed[o] = true
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// Logger is a small request logger (method, path, status, latency).
func Logger() gin.HandlerFunc { return gin.Logger() }
