#!/bin/bash
set -e

# Deploy the stack to Docker Swarm
# Usage: ./scripts/deploy.sh [stack-name] [registry] [tag]

STACK_NAME=${1:-push-server}
REGISTRY=${2:-localhost:5000}
TAG=${3:-latest}

echo "========================================"
echo "Deploying Push Server Stack"
echo "========================================"
echo "Stack Name: $STACK_NAME"
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo ""

# Check if swarm is initialized
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "Docker Swarm is not active. Initializing..."
    docker swarm init --advertise-addr $(hostname -I | awk '{print $1}') || true
fi

# Create secrets if they don't exist
echo "Setting up secrets..."
if ! docker secret inspect jwt_secret >/dev/null 2>&1; then
    echo "Creating JWT secret..."
    openssl rand -base64 32 | docker secret create jwt_secret -
fi

# Export environment variables
export REGISTRY=$REGISTRY
export TAG=$TAG

# Deploy the stack
echo ""
echo "Deploying stack..."
docker stack deploy \
    -c docker-stack.yml \
    --with-registry-auth \
    $STACK_NAME

echo ""
echo "========================================"
echo "Deployment initiated!"
echo "========================================"
echo ""
echo "Check status with:"
echo "  docker stack services $STACK_NAME"
echo ""
echo "View logs with:"
echo "  docker service logs ${STACK_NAME}_gateway"
echo ""
echo "Scale services with:"
echo "  docker service scale ${STACK_NAME}_gateway=5"
