pushd backend
start cmd /k "php artisan serve"
popd
pushd frontend
start cmd /k "npm run dev"
popd
start http://localhost:8000
start http://localhost:5173

