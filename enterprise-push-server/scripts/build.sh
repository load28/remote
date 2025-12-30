#!/bin/bash
set -e

# Build all service images
# Usage: ./scripts/build.sh [registry] [tag]

REGISTRY=${1:-localhost:5000}
TAG=${2:-latest}

echo "Building all services..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"

SERVICES=("auth-service" "gateway-service" "message-service" "presence-service" "push-service")

for SERVICE in "${SERVICES[@]}"; do
    echo ""
    echo "========================================"
    echo "Building $SERVICE..."
    echo "========================================"

    docker build \
        --target "$SERVICE" \
        -t "$REGISTRY/$SERVICE:$TAG" \
        -f Dockerfile \
        .

    echo "$SERVICE built successfully!"
done

echo ""
echo "========================================"
echo "All services built successfully!"
echo "========================================"
echo ""
echo "To push images, run:"
echo "  ./scripts/push.sh $REGISTRY $TAG"
