@echo off
echo Starting Orphic Task Manager Frontend...

if not exist "E:\CSharp" (
    mklink /J "E:\CSharp" "E:\C#" 2>nul
)

pushd "E:\CSharp\orphic Task manager\frontend" 2>nul

if not exist node_modules (
    echo Installing node dependencies...
    call npm install
)

if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite 2>nul
)

set NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main
echo Starting Vite Development Server...
call npm run dev -- --force
