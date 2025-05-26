<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RecommendationController extends Controller
{
    protected $lastfmKey;
    protected $lastfmEndpoint;
    protected $spotifyEndpoint;

    public function __construct()
    {
        $this->lastfmKey       = config('services.lastfm.api_key');
        $this->lastfmEndpoint  = config('services.lastfm.endpoint');
        $this->spotifyEndpoint = config('services.spotify.endpoint');
    }

    /**
     * GET /api/recommendations?genres[]=Rock&genres[]=Pop&mood=Happy&count=10
     */
    public function index(Request $request)
    {
        // 1) Read query params
        $genres = $request->query('genres', []);
        if (! is_array($genres)) {
            // handle comma-separated fallback
            $genres = explode(',', $genres);
        }
        $mood  = $request->query('mood');
        $count = (int) $request->query('count', 10);

        // 2) Fetch & merge top tracks for each selected genre
        $genreTracks = [];
        foreach ($genres as $g) {
            $genreTracks = array_merge($genreTracks, $this->fetchLastfmTracks($g));
        }
        // Deduplicate genreTracks by “track|artist”
        $uniqueG = [];
        foreach ($genreTracks as $t) {
            $key = "{$t['name']}|{$t['artist']['name']}";
            if (! isset($uniqueG[$key])) {
                $uniqueG[$key] = $t;
            }
        }
        $genreTracks = array_values($uniqueG);

        // 3) Fetch top tracks for the mood tag
        $moodTracks = $mood ? $this->fetchLastfmTracks($mood) : [];

        // 4) Shuffle & intersect (preferring tracks that appear in both sets)
        shuffle($genreTracks);
        shuffle($moodTracks);

        // Build a lookup from genre set
        $setG = [];
        foreach ($genreTracks as $t) {
            $setG["{$t['name']}|{$t['artist']['name']}"] = true;
        }
        // Filter moodTracks to those also in genreTracks
        $both = array_filter($moodTracks, function($t) use ($setG) {
            return isset($setG["{$t['name']}|{$t['artist']['name']}"]);
        });

        // If we don’t have enough, merge & reshuffle
        if (count($both) < $count) {
            $combined = array_merge($moodTracks, $genreTracks);
            // Dedupe combined
            $uniqueC = [];
            foreach ($combined as $t) {
                $key = "{$t['name']}|{$t['artist']['name']}";
                if (! isset($uniqueC[$key])) {
                    $uniqueC[$key] = $t;
                }
            }
            $combined = array_values($uniqueC);
            shuffle($combined);
            $both = array_slice($combined, 0, $count);
        } else {
            $both = array_slice($both, 0, $count);
        }

        // 5) Look up each track on Spotify
        $token  = $request->header('Authorization'); // “Bearer …”
        $access = substr($token, 7);
        $results = [];

        foreach ($both as $t) {
            $res = Http::withToken($access)
                      ->get("{$this->spotifyEndpoint}search", [
                          'q'     => "track:{$t['name']} artist:{$t['artist']['name']}",
                          'type'  => 'track',
                          'limit' => 1,
                      ])->json();

            if (! empty($res['tracks']['items'][0])) {
                $item = $res['tracks']['items'][0];
                $id   = last(explode(':', $item['uri']));
                $results[] = [
                    'uri'   => $item['uri'],
                    'embed' => "https://open.spotify.com/embed/track/{$id}",
                ];
            }
        }

        return response()->json($results);
    }

    /**
     * POST /api/playlists
     * { uris: [...], name: "...", description: "..." }
     */
    public function store(Request $request)
    {
        $token = $request->header('Authorization'); // “Bearer …”
        $access = substr($token, 7);

        $payload = $request->validate([
            'name'        => 'required|string',
            'description' => 'string',
            'uris'        => 'required|array|min:1',
        ]);

        // 1) Get current user’s Spotify ID
        $me = Http::withToken($access)
                  ->get("{$this->spotifyEndpoint}me")
                  ->json();

        // 2) Create a new (private) playlist
        $pl = Http::withToken($access)
                  ->post("{$this->spotifyEndpoint}users/{$me['id']}/playlists", [
                      'name'        => $payload['name'],
                      'description' => $payload['description'] ?? '',
                      'public'      => false,
                  ])->json();

        // 3) Add the selected URIs to the playlist
        Http::withToken($access)
            ->post("{$this->spotifyEndpoint}playlists/{$pl['id']}/tracks", [
                'uris' => $payload['uris'],
            ]);

        return response()->json([
            'playlist_url' => "https://open.spotify.com/playlist/{$pl['id']}",
        ]);
    }

    /**
     * Helper: call Last.fm’s tag.gettoptracks
     */
    protected function fetchLastfmTracks(string $tag): array
    {
        $res = Http::get($this->lastfmEndpoint, [
            'method'  => 'tag.gettoptracks',
            'tag'     => strtolower($tag),
            'api_key' => $this->lastfmKey,
            'format'  => 'json',
            'limit'   => 100,
        ])->json();

        return $res['tracks']['track'] ?? [];
    }
}
