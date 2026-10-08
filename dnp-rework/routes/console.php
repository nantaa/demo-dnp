<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('notifications:wa-escalate')->everyFiveMinutes();

// Daily Digest Email Reports (Monday to Friday only to prevent weekend spam)
Schedule::command('report:daily-digest --time=morning')
    ->weekdays()
    ->dailyAt('08:00');

Schedule::command('report:daily-digest --time=afternoon')
    ->weekdays()
    ->dailyAt('16:00');
