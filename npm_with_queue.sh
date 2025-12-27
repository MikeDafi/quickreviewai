#!/bin/bash
MY_ID="agent_$$_$(date +%s)"
QUEUE_FILE="npm_queue.txt"
QUEUE_LOCK="lock_queue.txt"
NPM_LOCK="lock_npm.txt"

# Function to acquire queue lock
acquire_queue_lock() {
    while ! (set -o noclobber; echo "$MY_ID" > "$QUEUE_LOCK") 2>/dev/null; do
        sleep 0.5
    done
}

# Function to release queue lock
release_queue_lock() {
    rm -f "$QUEUE_LOCK"
}

# Add myself to queue
acquire_queue_lock
echo "$MY_ID" >> "$QUEUE_FILE"
echo "Added to queue: $MY_ID"
cat "$QUEUE_FILE"
release_queue_lock

# Wait until I'm first in queue
while true; do
    acquire_queue_lock
    FIRST=$(head -1 "$QUEUE_FILE" 2>/dev/null)
    release_queue_lock
    
    if [ "$FIRST" = "$MY_ID" ]; then
        echo "I'm first in queue!"
        break
    fi
    echo "Waiting in queue... (first is: $FIRST)"
    sleep 2
done

# Now wait for npm lock
while [ -f "$NPM_LOCK" ]; do
    echo "Waiting for npm lock..."
    sleep 1
done

# Acquire npm lock
echo "$MY_ID" > "$NPM_LOCK"
echo "NPM lock acquired by $MY_ID"

# Run the actual npm commands
echo "=== Running npm install ==="
npm install

echo "=== Running npm build ==="
npm run build
BUILD_EXIT=$?

# Release npm lock
rm -f "$NPM_LOCK"
echo "NPM lock released"

# Remove myself from queue
acquire_queue_lock
grep -v "$MY_ID" "$QUEUE_FILE" > "${QUEUE_FILE}.tmp" 2>/dev/null || true
mv "${QUEUE_FILE}.tmp" "$QUEUE_FILE" 2>/dev/null || rm -f "$QUEUE_FILE"
release_queue_lock
echo "Removed from queue"

exit $BUILD_EXIT
