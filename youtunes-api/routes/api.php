<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RecommendationController;

Route::post('spotify/token',   [AuthController::class, 'exchangeToken']);
Route::get ('recommendations', [RecommendationController::class, 'index']);
Route::post('playlists',       [RecommendationController::class, 'store']);
