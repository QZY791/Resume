@echo off
setlocal
title Resume Material Library

rem ============================================================
rem  This launcher only needs Node.js. All user-facing text is
rem  printed by server.mjs, so this file stays pure ASCII to
rem  avoid Windows console codepage garbling.
rem ============================================================

set "NODE_EXE="

rem 1) node.exe already on PATH
for /f "delims=" %%I in ('where node.exe 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%I"
)

rem 2) Node bundled with WorkBuddy (pick the newest version folder)
if not defined NODE_EXE (
  for /f "delims=" %%D in ('dir /b /o-n "%USERPROFILE%\.workbuddy\binaries\node\versions" 2^>nul') do (
    if not defined NODE_EXE if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\%%D\node.exe" set "NODE_EXE=%USERPROFILE%\.workbuddy\binaries\node\versions\%%D\node.exe"
  )
)

rem 3) common install locations
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\nodejs\node.exe" set "NODE_EXE=C:\nodejs\node.exe"

if not defined NODE_EXE (
  echo.
  echo   [ERROR] Node.js was not found on this computer.
  echo.
  echo   This launcher needs Node.js 18 or newer.
  echo   Download the LTS build from:  https://nodejs.org/
  echo   After installing, double-click this file again.
  echo.
  pause
  exit /b 1
)

rem Start the local server (it opens your browser automatically)
"%NODE_EXE%" "%~dp0server.mjs"

if errorlevel 1 (
  echo.
  echo   The server exited with an error. See the message above.
  echo.
  pause
)

endlocal
