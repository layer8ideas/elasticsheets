@echo off

SETLOCAL

set SCRIPT_DIR=%~dp0
for %%I in ("%SCRIPT_DIR%..") do set DIR=%%~dpfI

set NODE=%DIR%\node\node.exe
set SERVER=%DIR%\src\app.js
set NODE_ENV="production"

TITLE ElasticSheets

"%NODE%" "%SERVER%" %*

:finally

ENDLOCAL


