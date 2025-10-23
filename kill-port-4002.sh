#!/bin/bash

echo "=== Finding and killing process on port 4002 ==="
echo ""

# Find the process ID using port 4002
echo "1. Finding process on port 4002..."
PID=$(lsof -ti:4002)

if [ -z "$PID" ]; then
    echo "No process found running on port 4002"
    exit 0
fi

echo "Found process ID: $PID"
echo ""

# Show process details
echo "2. Process details:"
ps -p $PID -o pid,ppid,command
echo ""

# Kill the process
echo "3. Killing process $PID..."
kill $PID

# Wait a moment and check if it's still running
sleep 2
if kill -0 $PID 2>/dev/null; then
    echo "Process still running, using force kill..."
    kill -9 $PID
    sleep 1
    if kill -0 $PID 2>/dev/null; then
        echo "❌ Failed to kill process $PID"
        exit 1
    else
        echo "✅ Process $PID force killed successfully"
    fi
else
    echo "✅ Process $PID killed successfully"
fi

echo ""
echo "4. Verifying port 4002 is now free..."
NEW_PID=$(lsof -ti:4002)
if [ -z "$NEW_PID" ]; then
    echo "✅ Port 4002 is now free"
else
    echo "❌ Port 4002 is still occupied by process $NEW_PID"
fi
