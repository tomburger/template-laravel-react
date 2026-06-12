<?php

use Illuminate\Support\Facades\Route;

// Serve React SPA for all non-API routes
Route::get('{path?}', fn() => view('app'))
    ->where('path', '^(?!api/).*')
    ->name('spa');
