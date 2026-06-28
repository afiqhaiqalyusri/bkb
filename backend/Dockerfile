# ─────────────────────────────────────────────────────────────
#  BKB Backend Dockerfile — Hardened (non-root, minimal image)
# ─────────────────────────────────────────────────────────────

# Stage 1: Build
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Download dependencies first (layer cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build the application
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Runtime — minimal JRE image
FROM eclipse-temurin:17-jre-alpine

# Security: create non-root user
RUN addgroup -g 1001 -S bkb && \
    adduser -u 1001 -S bkb -G bkb

WORKDIR /app
RUN mkdir -p /app/uploads && chown -R bkb:bkb /app

# Copy jar with correct ownership — never run as root
COPY --from=build --chown=bkb:bkb /app/target/bkb-backend-1.0.0.jar app.jar

# Switch to non-root user
USER bkb

EXPOSE 8081

# JVM flags: reduce memory footprint, disable attack surface
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod}", \
  "-jar", "app.jar"]
