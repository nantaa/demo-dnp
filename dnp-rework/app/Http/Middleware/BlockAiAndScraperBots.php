<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockAiAndScraperBots
{
    /**
     * AI crawlers, scrapers, automated HTTP clients, and headless browser signatures.
     */
    protected array $blockedPatterns = [
        // Commercial & Open AI Crawlers
        'gptbot',
        'chatgpt',
        'claudebot',
        'anthropic',
        'perplexity',
        'bytespider',
        'ccbot',
        'diffbot',
        'cohere-ai',
        'omgilibot',
        'amazonbot',
        'applebot-extended',
        'meta-externalagent',
        'google-extended',
        // Automated scrapers & script libraries
        'scrapy',
        'python-requests',
        'aiohttp',
        'httpx',
        'curl',
        'wget',
        'httpclient',
        'postmanruntime',
        'headlesschrome',
        'phantomjs',
        'selenium',
        'puppeteer',
        'playwright',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Kill-switch check for zero-downtime emergency bypass
        if (env('APP_DISABLE_ANTI_BOT', false) === true) {
            return $next($request);
        }

        // 2. Allow local development, unit tests, and loopback requests
        if (app()->environment('local', 'testing') || in_array($request->ip(), ['127.0.0.1', '::1'])) {
            return $this->addSecurityHeaders($next($request));
        }

        // 3. Reject empty or missing User-Agent header (typical of raw automated scrapers)
        $userAgent = trim((string) $request->userAgent());
        if ($userAgent === '') {
            return response()->json([
                'error' => 'Access denied: Empty User-Agent header.',
            ], 403);
        }

        // 4. Inspect User-Agent against blocked bot & scraper patterns
        $lowerUserAgent = strtolower($userAgent);
        foreach ($this->blockedPatterns as $pattern) {
            if (str_contains($lowerUserAgent, strtolower($pattern))) {
                return response()->json([
                    'error' => 'Access denied: Automated scraping or bot access is prohibited.',
                ], 403);
            }
        }

        // 5. Proceed and attach defensive security headers
        return $this->addSecurityHeaders($next($request));
    }

    /**
     * Attach standard defensive headers to the response.
     */
    protected function addSecurityHeaders(Response $response): Response
    {
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        return $response;
    }
}
