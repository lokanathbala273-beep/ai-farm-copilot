#!/bin/bash
# ==============================================================================
# AI Farm Co-Pilot & Market Optimizer – One-Click Startup Script
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Determine Python interpreter
if [ -f "/Users/lokanath/.gemini/antigravity/scratch/venv314/bin/python" ]; then
    PYTHON_CMD="/Users/lokanath/.gemini/antigravity/scratch/venv314/bin/python"
elif [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
else
    PYTHON_CMD="python3"
fi

echo "🌾 Using Python: $($PYTHON_CMD --version)"

# Seed database if not present
if [ ! -f "database/farm_copilot.db" ]; then
    echo "🌱 Seeding initial database tables and demo accounts..."
    $PYTHON_CMD database/seed/seed_data.py
fi

# Determine Port (default 8080)
PORT=${PORT:-8080}

echo "🚀 Starting AI Farm Co-Pilot on http://localhost:$PORT ..."
echo "--------------------------------------------------------"
echo "👨‍🌾 Demo Farmer:  farmer.ramesh@aifarm.org  /  Farmer@1234"
echo "🩺 Demo Expert:  dr.mohapatra@aifarm.org   /  Expert@1234"
echo "🏪 Demo Seller:  seller.kisan@aifarm.org   /  Seller@1234"
echo "🛒 Demo Buyer:   buyer.trading@aifarm.org  /  Buyer@1234"
echo "⚙️ Demo Admin:   admin@aifarm.org          /  Admin@1234"
echo "--------------------------------------------------------"
echo "API Documentation: http://localhost:$PORT/docs"
echo "--------------------------------------------------------"

exec $PYTHON_CMD -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --reload
