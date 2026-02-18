#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Work Time Tracker Deployment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo -e "${GREEN}Docker is running.${NC}"

# Stop any existing containers
echo -e "${BLUE}Stopping existing containers...${NC}"
docker-compose down

# Build key environment variables for internal use
# Note: The .env file should be present for local development, but Docker uses values from docker-compose.yml
# Use this section if you need to load secrets dynamically

# Build and start containers
echo -e "${BLUE}Building and starting containers...${NC}"
docker-compose up -d --build

echo -e "${GREEN}Containers are up and running!${NC}"

# Wait for database to be ready
echo -e "${BLUE}Waiting for database to initialize (10s)...${NC}"
sleep 10

# Run Prisma Migrations
echo -e "${BLUE}Running database migrations...${NC}"
# We run migration inside the app container which has Prisma installed
docker-compose exec app npx prisma migrate deploy

echo -e "${GREEN}Database migrated successfully!${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "Access the app at: ${BLUE}http://localhost:3000${NC}"
