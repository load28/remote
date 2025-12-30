#!/bin/bash

# Scale services in Docker Swarm
# Usage: ./scripts/scale.sh <service> <replicas> [stack-name]

SERVICE=$1
REPLICAS=$2
STACK_NAME=${3:-push-server}

if [ -z "$SERVICE" ] || [ -z "$REPLICAS" ]; then
    echo "Usage: ./scripts/scale.sh <service> <replicas> [stack-name]"
    echo ""
    echo "Services: auth, gateway, message, presence, push"
    echo ""
    echo "Examples:"
    echo "  ./scripts/scale.sh gateway 5"
    echo "  ./scripts/scale.sh auth 3 my-stack"
    exit 1
fi

echo "Scaling ${STACK_NAME}_${SERVICE} to ${REPLICAS} replicas..."

docker service scale "${STACK_NAME}_${SERVICE}=${REPLICAS}"

echo ""
echo "Current service status:"
docker service ls --filter "name=${STACK_NAME}"
