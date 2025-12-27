#!/bin/bash

AGENT_ID="agent_$$_$(date +%s)"
QUEUE_FILE="npm_queue.txt"
QUEUE_LOCK="lock_queue.txt"
NPM_LOCK="lock_npm.txt"

acquire_queue_lock() {
    while [ -f "$QUEUE_LOCK" ]; do sleep 0.5; done
    echo "$AGENT_ID" > "$QUEUE_LOCK"
}

release_queue_lock() {
    rm -f "$QUEUE_LOCK"
}

add_to_queue() {
    acquire_queue_lock
    echo "$AGENT_ID" >> "$QUEUE_FILE"
    release_queue_lock
    echo "Added to queue: $AGENT_ID"
}

am_i_first() {
    [ "$(head -1 "$QUEUE_FILE" 2>/dev/null)" = "$AGENT_ID" ]
}

wait_my_turn() {
    echo "Waiting for turn..."
    while ! am_i_first; do sleep 1; done
    echo "My turn!"
}

acquire_npm_lock() {
    while [ -f "$NPM_LOCK" ]; do sleep 0.5; done
    echo "$AGENT_ID - $(date)" > "$NPM_LOCK"
    echo "NPM lock acquired"
}

release_npm_lock() {
    rm -f "$NPM_LOCK"
    echo "NPM lock released"
}

remove_from_queue() {
    acquire_queue_lock
    tail -n +2 "$QUEUE_FILE" > "$QUEUE_FILE.tmp" 2>/dev/null && mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
    release_queue_lock
    echo "Removed from queue"
}

# Main flow
add_to_queue
wait_my_turn
acquire_npm_lock
