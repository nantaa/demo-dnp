<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'DNP Monitoring System') }}</title>
    <link rel="icon" type="image/png" href="/moriku-logo.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Global Route Fallback Helper -->
    <script>
      window.route = window.route || function(name, params) {
        var routes = {
          'login': '/login',
          'logout': '/logout',
          'dashboard': '/',
          'kanban': '/kanban',
          'jobs.index': '/jobs',
          'jobs.create': '/jobs/create',
          'reminder.suket': '/reminder-suket',
          'inventory': '/inventory',
          'pelaporan.index': '/pelaporan',
          'profile.edit': '/profile',
          'users.index': '/users'
        };
        var target = routes[name] || ('/' + (name || '').replace(/\./g, '/'));
        if (params && typeof params === 'object') {
          var qs = Object.keys(params).map(function(k){
            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
          }).join('&');
          return qs ? target + '?' + qs : target;
        }
        return target;
      };
    </script>

    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>
<body class="font-sans antialiased bg-slate-50 text-slate-800">
    @inertia
</body>
</html>
