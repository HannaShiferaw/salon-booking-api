package handlers

import (
	"errors"
	"net/http"

	"blush-salon/backend/internal/middleware"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/services"
	"blush-salon/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth   *services.AuthService
	store  *repositories.Store
	secret string
}

func NewAuthHandler(auth *services.AuthService, store *repositories.Store, secret string) *AuthHandler {
	return &AuthHandler{auth: auth, store: store, secret: secret}
}

type registerRequest struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Phone    string `json:"phone"`
	Password string `json:"password" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "full name, email and password are required")
		return
	}
	u, err := h.auth.Register(req.FullName, req.Email, req.Phone, req.Password)
	if err != nil {
		if errors.Is(err, services.ErrDuplicateEmail) {
			utils.Fail(c, http.StatusConflict, err.Error())
			return
		}
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	// Return 201 with token; reuse helper but override status via Created.
	token, err := middleware.GenerateToken(h.secret, u)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "could not create session")
		return
	}
	utils.Created(c, "Account created successfully", gin.H{"token": token, "user": u.Public()})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "email and password are required")
		return
	}
	u, err := h.auth.Login(req.Email, req.Password)
	if err != nil {
		utils.Fail(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}
	token, err := middleware.GenerateToken(h.secret, u)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "could not create session")
		return
	}
	utils.OK(c, "Logged in successfully", gin.H{"token": token, "user": u.Public()})
}

func (h *AuthHandler) Me(c *gin.Context) {
	u, err := h.store.FindUserByID(middleware.CurrentUserID(c))
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "User not found")
		return
	}
	utils.OK(c, "Profile", u.Public())
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	var req struct {
		FullName string `json:"full_name"`
		Phone    string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid request")
		return
	}
	u, err := h.store.FindUserByID(middleware.CurrentUserID(c))
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "User not found")
		return
	}
	if req.FullName != "" {
		u.FullName = req.FullName
	}
	if req.Phone != "" {
		u.Phone = req.Phone
	}
	if err := h.store.DB.Save(u).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not update profile")
		return
	}
	utils.OK(c, "Profile updated", u.Public())
}
