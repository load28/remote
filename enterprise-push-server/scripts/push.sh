#!/bin/bash
set -e

# Push all service images to registry
# Usage: ./scripts/push.sh [registry] [tag]

REGISTRY=${1:-localhost:5000}
TAG=${2:-latest}

echo "Pushing all services to $REGISTRY..."

SERVICES=("auth-service" "gateway-service" "message-service" "presence-service" "push-service")

for SERVICE in "${SERVICES[@]}"; do
    echo "Pushing $SERVICE..."
    docker push "$REGISTRY/$SERVICE:$TAG"
done

echo ""
echo "All services pushed successfully!"
