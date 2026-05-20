@echo off
title AI Rural Healthcare Assistant
color 0A
echo.
echo  =====================================================
echo   AI Multimodal Rural Healthcare Assistant
echo   Starting... Please wait.
echo  =====================================================
echo.

REM Check if Ollama is running
echo [1/2] Checking Ollama AI engine...
curl -s http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    echo  WARNING: Ollama is not running!
    echo  Please start Ollama first: run 'ollama serve' in another terminal.
    echo  The symptom checker ML will still work without it.
    echo.
)

REM Start the backend (which also serves the frontend)
echo [2/2] Starting Healthcare AI Server...
echo.
echo  =====================================================
echo   App ready! Open your browser and go to:
echo   http://localhost:8000
echo  =====================================================
echo.
cd /d "%~dp0backend"
..\venv\Scripts\python.exe -m app.main

pause
