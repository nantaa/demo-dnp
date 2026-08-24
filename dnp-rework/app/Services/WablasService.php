<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WablasService
{
    /**
     * Send WhatsApp message via Wablas API.
     *
     * @param string $phone Target phone number (format: 628xxxxxxxx)
     * @param string $message Text message to send
     * @return bool Success status
     */
    public static function send(string $phone, string $message): bool
    {
        $token = env('WABLAS_TOKEN', '');
        $baseUrl = env('WABLAS_DOMAIN', 'https://solo.wablas.com');

        if (empty($token)) {
            Log::warning('Wablas token is empty. Message not sent: ' . $message);
            return false;
        }

        // Format phone number to start with 62
        $formattedPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($formattedPhone, '0')) {
            $formattedPhone = '62' . substr($formattedPhone, 1);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post("{$baseUrl}/api/send-message", [
                'phone'   => $formattedPhone,
                'message' => $message,
                'isGroup' => false,
            ]);

            if ($response->successful()) {
                Log::info("Wablas WA sent successfully to {$formattedPhone}");
                return true;
            } else {
                Log::error("Wablas WA failed to {$formattedPhone}: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Wablas WA Exception: " . $e->getMessage());
            return false;
        }
    }
}
