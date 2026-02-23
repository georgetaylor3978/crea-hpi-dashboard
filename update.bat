@echo off
echo.
echo ======================================
echo   CREA HPI Dashboard - Data Updater
echo ======================================
echo.

REM Check if the xlsx file exists
if not exist "House Price Import.xlsx" (
    echo ERROR: "House Price Import.xlsx" not found!
    echo.
    echo Please download the latest HPI data from CREA and 
    echo place it in this folder:
    echo   %CD%
    echo.
    pause
    exit /b 1
)

REM Step 1: Convert xlsx to json
echo [1/3] Converting Excel data to JSON...
node update-data.js
if errorlevel 1 (
    echo.
    echo ERROR: Data conversion failed!
    pause
    exit /b 1
)

REM Step 2: Git add and commit
echo [2/3] Committing updated data...
"C:\Program Files\Git\cmd\git.exe" add data.json
"C:\Program Files\Git\cmd\git.exe" commit -m "Update HPI data - %date%"

REM Step 3: Push to GitHub
echo [3/3] Pushing to GitHub Pages...
"C:\Program Files\Git\cmd\git.exe" push

echo.
echo ======================================
echo   Done! Your site will update in ~1 min.
echo ======================================
echo.
pause
