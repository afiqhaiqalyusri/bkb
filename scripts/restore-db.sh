#!/bin/bash
# Revert listen_addresses so Docker containers can reach PostgreSQL.
# UFW already blocks port 5432 from the internet — that IS the real protection.

set -e

echo "=== Restoring PostgreSQL listen_addresses to * ==="
PG_CONF="/etc/postgresql/16/main/postgresql.conf"
sed -i "s/^listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"
grep "listen_addresses" "$PG_CONF"
systemctl restart postgresql
echo "PostgreSQL restarted."

echo "=== Verifying UFW still blocks port 5432 ==="
ufw status | grep -E "(5432|Status)"

echo "=== Restarting backend container ==="
cd /home/afiqhaiqal/bkb
docker compose -f docker-compose.prod.yml restart backend
echo "Waiting 50s for Spring Boot to start..."
sleep 50

echo "=== Health check ==="
curl -s http://localhost:8081/actuator/health
echo ""

echo "=== Docker user ==="
docker exec bkb_backend whoami

echo "=== Container status ==="
docker ps --filter name=bkb --format "table {{.Names}}\t{{.Status}}"
