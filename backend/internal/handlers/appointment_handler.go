package handlers

import (
	"errors"
	"net/http"

	"blush-salon/backend/internal/middleware"
	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/services"
	"blush-salon/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AppointmentHandler serves customer appointment endpoints.
type AppointmentHandler struct {
	store *repositories.Store
	svc   *services.AppointmentService
	avail *services.AvailabilityService
}

func NewAppointmentHandler(store *repositories.Store, svc *services.AppointmentService, avail *services.AvailabilityService) *AppointmentHandler {
	return &AppointmentHandler{store: store, svc: svc, avail: avail}
}

type createAppointmentRequest struct {
	ServiceID uuid.UUID  `json:"service_id" binding:"required"`
	StaffID   *uuid.UUID `json:"staff_id"`
	Date      string     `json:"date" binding:"required"`
	StartTime string     `json:"start_time" binding:"required"`
	Notes     string     `json:"notes"`
}

func (h *AppointmentHandler) Create(c *gin.Context) {
	var req createAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "service, date and start time are required")
		return
	}
	appt, err := h.svc.Create(services.CreateInput{
		CustomerID: middleware.CurrentUserID(c), ServiceID: req.ServiceID,
		StaffID: req.StaffID, Date: req.Date, StartTime: req.StartTime, Notes: req.Notes,
	})
	if err != nil {
		if errors.Is(err, services.ErrSlotUnavailable) {
			utils.Fail(c, http.StatusConflict, err.Error())
			return
		}
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.Created(c, "Appointment created successfully", appt)
}

// MyAppointments returns the caller's appointments, newest first.
func (h *AppointmentHandler) MyAppointments(c *gin.Context) {
	var out []models.Appointment
	err := h.store.DB.Preload("Service").Preload("Staff").
		Where("customer_id = ?", middleware.CurrentUserID(c)).
		Order("date DESC, start_time DESC").Find(&out).Error
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load appointments")
		return
	}
	if out == nil {
		out = []models.Appointment{}
	}
	utils.OK(c, "Your appointments", out)
}

func (h *AppointmentHandler) Get(c *gin.Context) {
	appt, ok := h.loadOwnedOrAdmin(c)
	if !ok {
		return
	}
	utils.OK(c, "Appointment", appt)
}

func (h *AppointmentHandler) Cancel(c *gin.Context) {
	appt, ok := h.loadOwnedOrAdmin(c)
	if !ok {
		return
	}
	if err := h.svc.Cancel(appt, middleware.CurrentRole(c) == models.RoleAdmin); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "Appointment cancelled", appt)
}

func (h *AppointmentHandler) Reschedule(c *gin.Context) {
	appt, ok := h.loadOwnedOrAdmin(c)
	if !ok {
		return
	}
	var req struct {
		Date      string `json:"date" binding:"required"`
		StartTime string `json:"start_time" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "date and start time are required")
		return
	}
	updated, err := h.svc.Reschedule(appt, req.Date, req.StartTime)
	if err != nil {
		if errors.Is(err, services.ErrSlotUnavailable) {
			utils.Fail(c, http.StatusConflict, err.Error())
			return
		}
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "Appointment rescheduled", updated)
}

// loadOwnedOrAdmin loads an appointment and enforces ownership (or admin).
func (h *AppointmentHandler) loadOwnedOrAdmin(c *gin.Context) (*models.Appointment, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid appointment id")
		return nil, false
	}
	appt, err := h.store.FindAppointment(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Appointment not found")
		return nil, false
	}
	if middleware.CurrentRole(c) != models.RoleAdmin && appt.CustomerID != middleware.CurrentUserID(c) {
		utils.Fail(c, http.StatusForbidden, "You do not have permission to view this appointment")
		return nil, false
	}
	return appt, true
}

// AvailabilityHandler serves public slot lookups.
type AvailabilityHandler struct {
	store *repositories.Store
	avail *services.AvailabilityService
}

func NewAvailabilityHandler(store *repositories.Store, avail *services.AvailabilityService) *AvailabilityHandler {
	return &AvailabilityHandler{store: store, avail: avail}
}

func (h *AvailabilityHandler) Slots(c *gin.Context) {
	serviceID, err := uuid.Parse(c.Query("service_id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "service_id is required")
		return
	}
	svc, err := h.store.FindService(serviceID)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Service not found")
		return
	}
	date := c.Query("date")
	if date == "" {
		utils.Fail(c, http.StatusBadRequest, "date is required (YYYY-MM-DD)")
		return
	}
	var staffID *uuid.UUID
	if raw := c.Query("staff_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			utils.Fail(c, http.StatusBadRequest, "Invalid staff_id")
			return
		}
		staffID = &id
	}
	slots, err := h.avail.AvailableSlots(svc, staffID, date)
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "Available slots", gin.H{"date": date, "slots": slots})
}
