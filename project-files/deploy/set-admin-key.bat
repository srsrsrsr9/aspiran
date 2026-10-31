@echo off
setlocal
title Set the UPSC Pods admin key
cd /d "C:\Users\Srinivas Vedantham\Documents\Personal\app\server" || (
  echo Could not find the app's server folder.
  pause
  exit /b 1
)

echo This sets the admin key for the LIVE UPSC Pods server.
echo You'll use this key to sign in to the admin console.
echo.
choice /c GT /m "Press G to generate a strong key for you, or T to type your own"
if errorlevel 2 goto typeown

for /f "delims=" %%K in ('powershell -NoProfile -Command "$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [BitConverter]::ToString($b).Replace('-','').ToLower()"') do set "KEY=%%K"
if not defined KEY (
  echo Could not generate a key. Run this again and press T to type your own.
  pause
  exit /b 1
)
echo %KEY%| clip
echo.
echo Saving the new key to the live server...
echo %KEY%| npx wrangler secret put ADMIN_TOKEN --env production
if errorlevel 1 goto failed
set "KEY="
echo.
echo Done. The new key is on your clipboard.
echo 1. Paste it into your password manager now. It is not saved anywhere else.
echo 2. Open https://upsc-pods-production.chotu-aec.workers.dev/admin and paste it to sign in.
echo Never paste this key into a chat.
goto end

:typeown
echo.
echo Type your key at the prompt below and press Enter. Use at least 32 characters.
call npx wrangler secret put ADMIN_TOKEN --env production
if errorlevel 1 goto failed
echo.
echo Done. Sign in at https://upsc-pods-production.chotu-aec.workers.dev/admin with that key.
goto end

:failed
set "KEY="
echo.
echo That didn't work. If it mentions logging in, run:  npx wrangler login
echo then run this file again.

:end
echo.
pause
