=======================================================
MORIKU · DNP Monitor - PT Delta Nusantara Persada
{{ $edition_title }} - {{ $date_formatted }}
=======================================================

{{ $greeting }}, {{ $user->name }}

Berikut adalah ringkasan pekerjaan riksa uji yang membutuhkan tindakan dari Anda:

Total Pekerjaan: {{ $total_tasks }}
Melebihi SLA   : {{ $overdue_count }}

DAFTAR PEKERJAAN:
-------------------------------------------------------
@foreach($tasks as $t)
* [{{ $t['job_no'] }}] {{ $t['client_name'] }}
  Tahap   : {{ $t['stage_name'] }}
  Tindakan: {{ $t['action_required'] }}
  Status  : {{ $t['is_overdue'] ? 'OVERDUE (' . $t['days_elapsed'] . ' hari)' : $t['days_elapsed'] . ' hari' }}
  Link    : {{ $base_url }}/kanban?job_id={{ $t['job_id'] }}

@endforeach
-------------------------------------------------------
Akses Papan Kanban: {{ $base_url }}/kanban

(c) {{ date('Y') }} PT Delta Nusantara Persada.
Email otomatis dari sistem DNP Monitor.
