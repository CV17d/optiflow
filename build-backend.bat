@echo off
echo ========================================================
echo   OptiFlow - Compilacion Backend Python (Windows)
echo ========================================================

cd /d "%~dp0"
if not exist "resources\backend" mkdir "resources\backend"

set PYTHON_BIN=optiflow-engine\.venv\Scripts\python.exe
if not exist "%PYTHON_BIN%" set PYTHON_BIN=python

"%PYTHON_BIN%" -m PyInstaller --clean --distpath "%~dp0resources\backend" --workpath "%~dp0optiflow-engine\build" "%~dp0optiflow-engine\optiflow-engine.spec"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend compilado exitosamente en resources\backend\optiflow-engine.exe
) else (
    echo [ERROR] Fallo la compilacion de PyInstaller
    exit /b %ERRORLEVEL%
)
