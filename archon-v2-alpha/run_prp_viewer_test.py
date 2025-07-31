#!/usr/bin/env python3
"""
Run PRP Viewer Test from host machine

This wrapper script runs the test from the host machine where it can properly
access the UI server on localhost:3738
"""

import os
import sys
import subprocess
from pathlib import Path

# Add the server testing directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "python" / "src" / "server" / "testing"))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Check required environment variables
required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "ARCHON_UI_PORT"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please ensure your .env file contains these variables")
    sys.exit(1)

# Get project ID from command line
if len(sys.argv) < 2:
    print("Usage: python run_prp_viewer_test.py <PROJECT_ID>")
    sys.exit(1)

project_id = sys.argv[1]

# Install required packages if needed
try:
    import playwright
except ImportError:
    print("Installing playwright...")
    subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], check=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)

try:
    import aiohttp
except ImportError:
    print("Installing aiohttp...")
    subprocess.run([sys.executable, "-m", "pip", "install", "aiohttp"], check=True)

# Run the test
print(f"Running PRP Viewer test for project {project_id}...")
result = subprocess.run([
    sys.executable,
    "python/src/server/testing/prp_viewer_test.py",
    "--project-id", project_id,
    "--output-dir", "./test_results"
], env=os.environ.copy())

sys.exit(result.returncode)