<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SpotifyController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Test route (optional)
Route::get('/hello', fn() => 'Hello, Laravel is working!');

// Spotify OAuth start
Route::get('/api/spotify/authorize', [SpotifyController::class, 'redirectToProvider']);

// Spotify OAuth callback
Route::get('/api/spotify/callback',  [SpotifyController::class, 'handleProviderCallback']);

// Return the current Spotify user’s profile or 401 if not logged in
Route::get('/api/spotify/user', [SpotifyController::class, 'user']);

// Log out (clears session tokens)
Route::post('/api/spotify/logout', [SpotifyController::class, 'logout']);