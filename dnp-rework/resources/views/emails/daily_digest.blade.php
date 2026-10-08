<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $edition_title }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; -webkit-text-size-adjust: 100%;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A1F3A 0%, #0A385C 50%, #063970 100%); padding: 28px 32px; text-align: left;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <div style="font-size: 11px; font-weight: 800; color: #00A8E8; text-transform: uppercase; letter-spacing: 2px;">
                                            PT Delta Nusantara Persada
                                        </div>
                                        <div style="font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; margin-top: 4px;">
                                            MORIKU · DNP Monitor
                                        </div>
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <div style="display: inline-block; background-color: rgba(0, 168, 232, 0.15); border: 1px solid rgba(0, 168, 232, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #ffffff;">
                                            {{ $edition === 'afternoon' ? 'Edisi Sore (16:00)' : 'Edisi Pagi (08:00)' }}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px;">
                            
                            <!-- Greeting & Summary Card -->
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                                {{ $greeting }}, {{ $user->name }}
                            </div>
                            <div style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
                                Berikut adalah ringkasan pekerjaan riksa uji yang saat ini membutuhkan tindakan atau pemantauan dari Anda pada <strong>{{ $date_formatted }}</strong>.
                            </div>

                            <!-- Overdue Alert Banner if Any -->
                            @if($overdue_count > 0)
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 14px 18px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="28" style="vertical-align: top; font-size: 18px;">⚠️</td>
                                                <td style="font-size: 12px; color: #b91c1c; font-weight: 600; line-height: 1.4;">
                                                    <strong>Perhatian Khusus:</strong> Terdapat <strong>{{ $overdue_count }} pekerjaan</strong> yang telah melampaui batas waktu SLA standar. Harap prioritaskan penanganan pekerjaan ini.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- Summary Metric Pills -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                                        <div style="font-size: 20px; font-weight: 800; color: #0A385C;">{{ $total_tasks }}</div>
                                        <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total Pekerjaan Terkait</div>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background-color: {{ $overdue_count > 0 ? '#fef2f2' : '#f0fdf4' }}; border: 1px solid {{ $overdue_count > 0 ? '#fecaca' : '#bbf7d0' }}; border-radius: 10px; padding: 12px; text-align: center;">
                                        <div style="font-size: 20px; font-weight: 800; color: {{ $overdue_count > 0 ? '#dc2626' : '#16a34a' }};">{{ $overdue_count }}</div>
                                        <div style="font-size: 11px; font-weight: 600; color: {{ $overdue_count > 0 ? '#991b1b' : '#15803d' }}; text-transform: uppercase;">Melebihi SLA</div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Task Table -->
                            <div style="font-size: 13px; font-weight: 800; color: #0A385C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                                Daftar Pekerjaan Aktif
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                                <tr style="background-color: #f8fafc;">
                                    <th align="left" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">No Job / Klien</th>
                                    <th align="left" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">Tahap & Tindakan</th>
                                    <th align="center" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">Status SLA</th>
                                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0;">Aksi</th>
                                </tr>

                                @foreach($tasks as $t)
                                <tr style="background-color: {{ $loop->even ? '#f8fafc' : '#ffffff' }};">
                                    <td style="padding: 12px 14px; font-size: 12px; border-bottom: {{ $loop->last ? 'none' : '1px solid #e2e8f0' }}; vertical-align: top;">
                                        <div style="font-weight: 700; color: #0A385C;">{{ $t['job_no'] }}</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">{{ $t['client_name'] }}</div>
                                    </td>
                                    <td style="padding: 12px 14px; font-size: 12px; border-bottom: {{ $loop->last ? 'none' : '1px solid #e2e8f0' }}; vertical-align: top;">
                                        <div style="font-weight: 600; color: #1e293b;">{{ $t['stage_name'] }}</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 3px; font-style: italic;">
                                            {{ $t['action_required'] }}
                                        </div>
                                    </td>
                                    <td align="center" style="padding: 12px 14px; border-bottom: {{ $loop->last ? 'none' : '1px solid #e2e8f0' }}; vertical-align: top;">
                                        @if($t['is_overdue'])
                                        <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #fca5a5;">
                                            OVERDUE ({{ $t['days_elapsed'] }}h)
                                        </span>
                                        @else
                                        <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                                            {{ $t['days_elapsed'] }} hari
                                        </span>
                                        @endif
                                    </td>
                                    <td align="right" style="padding: 12px 14px; border-bottom: {{ $loop->last ? 'none' : '1px solid #e2e8f0' }}; vertical-align: middle;">
                                        <a href="{{ $base_url }}/kanban?job_id={{ $t['job_id'] }}" style="display: inline-block; background-color: #00A8E8; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 6px;">
                                            Buka &rarr;
                                        </a>
                                    </td>
                                </tr>
                                @endforeach
                            </table>

                            <!-- Direct CTA Button -->
                            <div style="text-align: center; margin-top: 28px;">
                                <a href="{{ $base_url }}/kanban" style="display: inline-block; background: linear-gradient(135deg, #0A385C 0%, #00A8E8 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 168, 232, 0.3);">
                                    Buka Papan Kanban DNP Monitor &rarr;
                                </a>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                            <div>&copy; {{ date('Y') }} PT Delta Nusantara Persada. Seluruh hak cipta dilindungi.</div>
                            <div style="margin-top: 4px;">
                                Email ini dikirimkan otomatis oleh sistem <strong>MORIKU (DNP Monitor)</strong> untuk staf resmi.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
