<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use SpotifyWebAPI\SpotifyWebAPI;

class SpotifyController extends Controller
{
    /**
     * Step 1: Redirect user to Spotify /authorize with a PKCE challenge.
     */
    public function redirectToProvider(Request $request)
    {
        // 1) generate & store verifier
        $verifier  = bin2hex(random_bytes(64));
        $challenge = rtrim(
            strtr(
                base64_encode(hash('sha256', $verifier, true)),
                '+/',
                '-_'
            ),
            '='
        );
        $request->session()->put('spotify_code_verifier', $verifier);

        // 2) build authorize URL
        $params = [
            'response_type'         => 'code',
            'client_id'             => config('services.spotify.client_id'),
            'scope'                 => implode(' ', [
                                          'playlist-modify-public',
                                          'playlist-modify-private',
                                          'user-read-private',
                                          'user-read-email',
                                      ]),
            'redirect_uri'          => config('services.spotify.redirect_uri'),
            'code_challenge_method' => 'S256',
            'code_challenge'        => $challenge,
            'show_dialog'           => 'true',
        ];

        return redirect('https://accounts.spotify.com/authorize?' . http_build_query($params));
    }

    /**
     * Step 2: Handle Spotify’s callback. Pull verifier from session
     *         and exchange code+verifier for tokens.
     */
    public function handleProviderCallback(Request $request)
    {
        $code     = $request->query('code');
        $verifier = $request->session()->pull('spotify_code_verifier');

        if (! $verifier) {
            abort(400, 'PKCE code_verifier missing from session');
        }

        // 1) Exchange code + verifier for an access token
        $response = Http::asForm()->post('https://accounts.spotify.com/api/token', [
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'redirect_uri'  => config('services.spotify.redirect_uri'),
            'client_id'     => config('services.spotify.client_id'),
            'code_verifier' => $verifier,
        ]);

        $data = $response->json();
        if (! isset($data['access_token'])) {
            abort($response->status(), 'Spotify token exchange failed: ' . json_encode($data));
        }

        // 2) Fetch the user's profile to get their display name
        $api = new SpotifyWebAPI();
        $api->setAccessToken($data['access_token']);
        $me = $api->me();
        $displayName = $me->display_name ?? $me->id;

        // 3) Redirect back to your React app with both token & user
        return redirect(
            config('services.frontend.url')
            . '?token=' . urlencode($data['access_token'])
            . '&user='  . urlencode($displayName)
        );
    }

    // Log out
    public function logout(Request $request)
    {
        // Remove only the PKCE verifier (if you want to keep other session data)
        $request->session()->forget('spotify_code_verifier');

        // Or to be safe, you can invalidate the entire session
        $request->session()->invalidate();

        // Return a 204 No Content so fetch().ok === true
        return response()->noContent();
    }
}
