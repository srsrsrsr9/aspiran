@echo off
rem Double-click to publish the app to Cloudflare. The steps live in scripts\publish.mjs.
setlocal
cd /d "%~dp0"
title Publish UPSC Pods

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js isn't installed on this computer, so the app can't be uploaded yet.
  echo Install the LTS version from https://nodejs.org, then double-click publish.bat again.
  echo.
  echo If you get stuck, send a screenshot of this window to Claude.
  goto :end
)

if not exist "node_modules\wrangler\bin\wrangler.js" (
  echo Installing the app's tools. This happens once and takes a few minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo The tools didn't install. Please send a screenshot of this window to Claude.
    goto :end
  )
  echo.
)

node "scripts\publish.mjs" %*

:end
echo.
echo Press any key to close.
pause >nul
endlocal
