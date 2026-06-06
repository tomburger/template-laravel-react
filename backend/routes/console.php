<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance and receives
| all of the arguments and options passed to the command.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quotes()->random());
})->purpose('Display an inspiring quote');
