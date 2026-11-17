package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse is the single consistent envelope for every API response.
type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func OK(c *gin.Context, message string, data any) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Message: message, Data: data})
}

func Created(c *gin.Context, message string, data any) {
	c.JSON(http.StatusCreated, APIResponse{Success: true, Message: message, Data: data})
}

func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, APIResponse{Success: false, Error: message})
}

// PagedData wraps list results with pagination metadata.
type PagedData struct {
	Items any   `json:"items"`
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
}
