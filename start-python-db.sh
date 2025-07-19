#!/bin/bash
# Start Python Database Service
echo "Starting Python Database Service on port 8000..."
cd python-db-service
python main.py &
PYTHON_PID=$!
echo "Python DB service started with PID: $PYTHON_PID"

# Wait a moment for service to start
sleep 2

# Test the service
echo "Testing Python DB service..."
curl -f http://localhost:8000/health || {
    echo "Python DB service health check failed"
    kill $PYTHON_PID 2>/dev/null
    exit 1
}

echo "✓ Python Database Service is running and healthy"
echo "PID: $PYTHON_PID"

# Keep the service running
wait $PYTHON_PID