@echo off
cd src
start "Laravel Development Server" cmd /k "php artisan serve"
start "Vite Dev Server" cmd /k "npm run dev"
timeout /t 3 /nobreak
start http://localhost:8000

