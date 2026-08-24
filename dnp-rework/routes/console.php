<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('notifications:wa-escalate')->everyFiveMinutes();
