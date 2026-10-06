#!/bin/bash

set -e

echo "Updating packages..."
apt-get update

echo "Installing required packages..."
apt-get install -y \
  docker.io \
  docker-compose-v2 \
  git

echo "Starting Docker..."
systemctl enable docker
systemctl start docker

echo "Adding ubuntu user to docker group..."
usermod -aG docker ubuntu

echo "Creating application directory..."
mkdir -p /opt/mental-health

chown ubuntu:ubuntu /opt/mental-health

cd /opt/mental-health

git clone https://github.com/Mental-HealthTeam/mental-health.git

cd ./mental-health

docker compose -f docker-compose.yml --build

echo "Server setup completed."