package handlers

import (
	"net/http"

	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PublicHandler serves read-only public data: services and staff.
type PublicHandler struct {
	store *repositories.Store
}

func NewPublicHandler(store *repositories.Store) *PublicHandler { return &PublicHandler{store: store} }

func (h *PublicHandler) ListServices(c *gin.Context) {
	services, err := h.store.ListServices(c.Query("category"), true)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load services")
		return
	}
	utils.OK(c, "Services", services)
}

func (h *PublicHandler) GetService(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid service id")
		return
	}
	svc, err := h.store.FindService(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Service not found")
		return
	}
	utils.OK(c, "Service", svc)
}

func (h *PublicHandler) ListStaff(c *gin.Context) {
	staff, err := h.store.ListStaff(true)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load staff")
		return
	}
	utils.OK(c, "Staff", staff)
}

func (h *PublicHandler) GetStaff(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid staff id")
		return
	}
	st, err := h.store.FindStaff(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Staff member not found")
		return
	}
	utils.OK(c, "Staff member", st)
}
