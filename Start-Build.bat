@echo off
REM generated from amazing.json by launch:apply (Amazing OS Core, launch/): change amazing.json and apply again, never this file.
REM Start-Build.bat: runs Card Prompts's current build, what Build.bat last put in current-build\app. Close the window or press Ctrl+C to stop it.
setlocal
title Card Prompts, current build - http://localhost:5100
cd /d "%~dp0"
set "PORT=5100"

if not exist "current-build\app\" goto :none
echo.
if exist "current-build\BUILD.txt" type "current-build\BUILD.txt"

call :holder %PORT%
if defined HOLDER goto :taken
set "NEXT_DIST_DIR="
REM next start reads the .env files in the build's folder: the repo's own, copied in fresh each start.
for %%f in (.env .env.local .env.production .env.production.local) do if exist "%%f" copy /y "%%f" "current-build\app\" >nul
echo.
echo   Starting Card Prompts's current build on http://localhost:5100
echo   The browser opens once the port answers.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 600; $i++) { foreach ($a in '127.0.0.1', '::1') { try { (New-Object Net.Sockets.TcpClient($a, 5100)).Close(); Start-Process 'http://localhost:5100'; exit } catch {} }; Start-Sleep -Milliseconds 500 }"
echo.
call npx next start current-build/app -p 5100
echo.
echo   Card Prompts's current build stopped.
pause
exit /b 0

:none
echo.
echo   There is no current build yet: Build.bat makes one from a clean main.
echo.
pause
exit /b 1

:taken
echo.
setlocal EnableDelayedExpansion
echo   Port %PORT% is taken by !HOLDER!
endlocal
echo   Nothing was started and nothing was stopped: this window stops only what it starts.
echo   If that is Card Prompts already running, it is at http://localhost:5100
echo   Otherwise close what holds the port, then run this again.
echo.
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
