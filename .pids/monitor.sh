#!/bin/bash
while true; do
    # Check API server
    if ! curl -s "http://localhost:4000/api/health" >/dev/null 2>&1; then
        echo "[$(date +'%H:%M:%S')] API server down, restarting..."
        node dev-api-server.js >> logs/API_Server.log 2>&1 &
    fi
    
    # Check frontend
    if ! curl -s "http://localhost:3001/" >/dev/null 2>&1; then
        echo "[$(date +'%H:%M:%S')] Frontend down, restarting..."
        cd apps/web && npm run dev >> ../../logs/Frontend_Server.log 2>&1 &
        cd ../..
    fi
    
    sleep 30
done
