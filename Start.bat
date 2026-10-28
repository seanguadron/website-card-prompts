@echo off
REM generated from amazing.json by launch:apply (Amazing OS Core, launch/): change amazing.json and apply again, never this file.
REM Start.bat: starts Digi Tools for development on port 5100. Close the window or press Ctrl+C to stop it.
setlocal
title Digi Tools - http://localhost:5100
cd /d "%~dp0"
set "PORT=5100"

call :holder %PORT%
if defined HOLDER goto :taken

if not exist ".\node_modules\" (
  echo   First run: npm install in ., which takes a minute...
  pushd "."
  call npm install
  if errorlevel 1 goto :install_failed
  popd
)
REM A clean .next each start: a production build left in it makes Turbopack panic ("package not found").
REM rmdir /s /q removes a junction without following it.
if exist ".next" rmdir /s /q ".next"

echo.
echo   Starting Digi Tools on http://localhost:5100
echo   From another device on this network: http://%COMPUTERNAME%:%PORT%
echo   ^(the name stays; the IP address changes, and a new address means signing in again^)
echo   The browser opens once the port answers.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 600; $i++) { foreach ($a in '127.0.0.1', '::1') { try { (New-Object Net.Sockets.TcpClient($a, 5100)).Close(); Start-Process 'http://localhost:5100'; exit } catch {} }; Start-Sleep -Milliseconds 500 }"
echo.
call npm run dev
echo.
echo   Digi Tools stopped.
pause
exit /b 0

:taken
echo.
setlocal EnableDelayedExpansion
echo   Port %PORT% is taken by !HOLDER!
endlocal
echo   Nothing was started and nothing was stopped: this window stops only what it starts.
echo   If that is Digi Tools already running, it is at http://localhost:5100
echo   Otherwise close what holds the port, then run this again.
echo.
pause
exit /b 1

:install_failed
echo.
echo   npm install failed: the lines above say why.
pause
exit /b 1

:holder
REM Sets HOLDER to the process listening on port %1 (its id, name and start), or empty when the port is free.
REM netstat and Get-Process: tasklist and the WMI readings take a minute on a busy machine.
set "HOLDER="
set "HOLDER_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%1  *[^ ]*  *LISTENING"') do if not defined HOLDER_PID set "HOLDER_PID=%%p"
if not defined HOLDER_PID exit /b 0
set "HOLDER=process %HOLDER_PID%"
for /f "usebackq delims=" %%n in (`powershell -NoProfile -Command "try { $p = Get-Process -Id %HOLDER_PID% -ErrorAction Stop; $s = try { ', started ' + $p.StartTime.ToString('yyyy-MM-dd HH:mm') } catch { '' }; ' (' + $p.ProcessName + '.exe' + $s + ')' } catch { '' }"`) do set "HOLDER=process %HOLDER_PID%%%n"
exit /b 0
