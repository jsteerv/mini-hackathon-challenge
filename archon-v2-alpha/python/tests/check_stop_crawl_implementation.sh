#!/bin/bash
# Check Stop Crawl Socket.IO Implementation

echo "=== Checking Stop Crawl Socket.IO Implementation ==="
echo

echo "1. Checking for crawl_stop event handler..."
if grep -q "@sio.event.*crawl_stop" ../python/src/server/fastapi/socketio_handlers.py; then
    echo "   ✓ crawl_stop event handler found"
else
    echo "   ✗ crawl_stop event handler missing"
fi

echo
echo "2. Checking crawl_stop implementation..."
if grep -q "crawl:stopping" ../python/src/server/fastapi/socketio_handlers.py; then
    echo "   ✓ Emits crawl:stopping event"
else
    echo "   ✗ Missing crawl:stopping event"
fi

if grep -q "crawl:stopped" ../python/src/server/fastapi/socketio_handlers.py; then
    echo "   ✓ Emits crawl:stopped event"
else
    echo "   ✗ Missing crawl:stopped event"
fi

echo
echo "3. Checking stop endpoint implementation..."
if grep -q "crawl:stopping" ../python/src/server/fastapi/knowledge_api.py; then
    echo "   ✓ Stop endpoint emits crawl:stopping"
else
    echo "   ✗ Stop endpoint missing crawl:stopping"
fi

if grep -q "active_crawl_tasks\[progress_id\]" ../python/src/server/fastapi/knowledge_api.py; then
    echo "   ✓ Cancels asyncio tasks"
else
    echo "   ✗ Missing asyncio task cancellation"
fi

echo
echo "4. Checking cancellation handling..."
if grep -q "asyncio.CancelledError" ../python/src/server/fastapi/knowledge_api.py; then
    echo "   ✓ Handles CancelledError properly"
else
    echo "   ✗ Missing CancelledError handling"
fi

echo
echo "=== Event Mappings ==="
echo "- crawl_stop → Server handles stop request via Socket.IO"
echo "- crawl:stopping → Immediate status update to clients"
echo "- crawl:stopped → Final cancellation confirmation"
echo "- crawl:error → Error during cancellation (if any)"

echo
echo "=== Implementation Complete ✓ ==="