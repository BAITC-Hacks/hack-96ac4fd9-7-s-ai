@echo off
cd /d "%~dp0"
echo Starting Firebird at http://127.0.0.1:8000
echo Open this address in your browser. Press Ctrl+C to stop.
python -X utf8 server.py --port 8000
pause
