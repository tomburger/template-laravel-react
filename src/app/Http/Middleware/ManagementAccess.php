<?php

namespace App\Http\Middleware;

use App\Models\Allocation;
use App\Models\Location;
use App\Models\Season;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ManagementAccess
{
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $user = $request->user();
        abort_if(!$user || $user->is_deactivated, 403);

        $location = $request->route('location');
        $season = $request->route('season');
        $allocation = $request->route('allocation');

        $allowed = match ($ability) {
            'read' => $user->isAdmin() || $user->isManager()
                || $user->ownedLocations()->exists() || $user->ownedSeasons()->exists(),
            'read-members' => $user->isManager()
                || $user->ownedLocations()->exists() || $user->ownedSeasons()->exists(),
            'admin' => $user->isAdmin(),
            'manager' => $user->isManager(),
            'edit-location' => $user->isManager() || ($location instanceof Location && $location->owners()->whereKey($user->id)->exists()),
            'own-location' => $location instanceof Location && $location->owners()->whereKey($user->id)->exists(),
            'edit-season' => $user->isManager() || ($season instanceof Season && $season->owners()->whereKey($user->id)->exists()),
            'own-season' => $season instanceof Season && $season->owners()->whereKey($user->id)->exists(),
            'own-allocation' => $allocation instanceof Allocation
                && $allocation->unitSeason->season->owners()->whereKey($user->id)->exists(),
            default => false,
        };

        abort_unless($allowed, 403);

        return $next($request);
    }
}
