@echo off
REM generated from amazing.json by launch:apply (Amazing OS Core, launch/): change amazing.json and apply again, never this file.
REM Build.bat: builds Card Prompts from a clean main into current-build\app, with current-build\BUILD.txt naming the commit.
setlocal
title Build Card Prompts
cd /d "%~dp0"
set "PORT=5100"

set "BRANCH="
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
if not "%BRANCH%"=="main" goto :not_main
for /f "delims=" %%m in ('git rev-parse --git-path MERGE_HEAD') do if exist "%%m" goto :merging
for /f "delims=" %%s in ('git status --porcelain -uno') do goto :dirty
for /f "delims=" %%c in ('git rev-parse HEAD') do set "HEAD_AT_START=%%c"

REM The dev server and the build share .next: a build under a running dev server breaks both.
call :holder %PORT%
if defined HOLDER goto :dev_running

if not exist ".\node_modules\" (
  echo   First run: npm install in ., which takes a minute...
  pushd "."
  call npm install
  if errorlevel 1 goto :install_failed
  popd
)
echo.
echo   Building Card Prompts from main...
echo.
call npm run build
if errorlevel 1 goto :build_failed
for /f "delims=" %%c in ('git rev-parse HEAD') do if not "%%c"=="%HEAD_AT_START%" goto :moved

REM Copied beside the current build first, then swapped in, so a failed copy leaves the last good build.
set "OUT=current-build"
if not exist "%OUT%\" mkdir "%OUT%"
if exist "%OUT%\app.new\" rmdir /s /q "%OUT%\app.new"
robocopy ".next" "%OUT%\app.new\.next" /E /XD "%CD%\.next\cache" "%CD%\.next\dev" /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto :copy_failed
if exist "public\" robocopy "public" "%OUT%\app.new\public" /E /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto :copy_failed
copy /y "package.json" "%OUT%\app.new\" >nul || goto :copy_failed
for %%f in (next.config.*) do copy /y "%%f" "%OUT%\app.new\" >nul || goto :copy_failed
if exist "%OUT%\app.old\" rmdir /s /q "%OUT%\app.old"
if exist "%OUT%\app\" ren "%OUT%\app" app.old
if exist "%OUT%\app\" goto :in_use
ren "%OUT%\app.new" app
REM The old build goes only once the new one is in place; otherwise it comes back.
if not exist "%OUT%\app\" goto :swap_failed
if exist "%OUT%\app.old\" rmdir /s /q "%OUT%\app.old"

set "INFO=%OUT%\BUILD.txt"
> "%INFO%" echo name: Card Prompts
>> "%INFO%" node -p "'version: ' + (require('./package.json').version || 'none')"
>> "%INFO%" echo branch: %BRANCH%
>> "%INFO%" git log -1 "--format=commit: %%h%%nsubject: %%s"
>> "%INFO%" node -p "'built: ' + new Date().toLocaleString('sv-SE').slice(0, 16)"
>> "%INFO%" echo by: Build.bat, generated from amazing.json
echo.
echo   Built into current-build\app:
type "%INFO%"
echo   Start-Build.bat runs it.
echo.
pause
exit /b 0

:not_main
echo.
echo   Build.bat builds only main, and this checkout is on %BRANCH%.
echo   A build is always a commit of main: switch to it in the main checkout, or merge first.
goto :refused

:merging
echo.
echo   A merge is in progress: finish it with git commit, or stop it with git merge --abort, first.
goto :refused

:dirty
echo.
echo   main has changes not committed, so the build would be no commit:
git status --short -uno
echo   Commit them first.
goto :refused

:dev_running
echo.
setlocal EnableDelayedExpansion
echo   Port %PORT% is taken by !HOLDER!
endlocal
echo   If that is the dev server, stop it first: it and the build share .next.
goto :refused

:install_failed
echo.
echo   npm install failed: the lines above say why.
goto :refused

:build_failed
echo.
echo   The build failed: the lines above say why. current-build keeps the last good build.
goto :refused

:moved
echo.
echo   HEAD moved during the build, so it may mix two commits. current-build is left as it was. Run it again.
goto :refused

:no_output
echo.
echo   The build wrote no : amazing.json's output names the wrong thing.
goto :refused

:copy_failed
echo.
echo   Copying the build into current-build\app.new failed: the lines above say why. current-build\app is the last good build.
goto :refused

:in_use
echo.
echo   current-build\app is in use, so the new build could not take its place: close what runs it
echo   ^(Start-Build.bat^), then run Build.bat again. The new build waits in current-build\app.new.
goto :refused

:swap_failed
if exist "%OUT%\app.old\" ren "%OUT%\app.old" app
echo.
echo   The new build could not take its place, so current-build\app is the last good build again.
goto :refused

:refused
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
