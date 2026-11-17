# syntax=docker/dockerfile:1
FROM golang:1.23-alpine AS build
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o /server ./cmd/server

FROM alpine:3.20
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=build /server /app/server
COPY backend/migrations/ /app/migrations/
ENV PORT=8080
EXPOSE 8080
CMD ["/app/server"]
