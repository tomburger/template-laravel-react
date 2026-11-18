<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\Request;

abstract class Controller
{
    protected function currentMember(Request $request): Member
    {
        $user = $request->user();
        abort_if($user->is_deactivated, 403);
        $member = $user->member()->first();
        abort_unless($member, 403, 'Membership is required.');

        return $member;
    }
}
