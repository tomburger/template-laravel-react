<?php

namespace App\Http\Controllers;

use App\Http\Requests\EnrollMemberRequest;
use App\Models\Member;
use App\Models\MemberSeason;
use App\Models\Season;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeasonMemberController extends Controller
{
    /**
     * List members enrolled in a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @responseField enrollments object[] Enrollments with the member's name, season category and current member category.
     */
    public function index(Season $season): JsonResponse
    {
        $enrollments = $season->memberSeasons()
            ->with('member')
            ->get()
            ->sortBy(fn (MemberSeason $item) => mb_strtolower($item->member->last_name.' '.$item->member->first_name))
            ->values()
            ->map(fn (MemberSeason $item) => $this->present($item));

        return response()->json(['enrollments' => $enrollments]);
    }

    /**
     * List members not yet enrolled in a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @responseField members object[] Members that can still be enrolled
     */
    public function available(Season $season): JsonResponse
    {
        $members = Member::whereNotIn('id', $season->memberSeasons()->select('member_id'))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'category']);

        return response()->json(['members' => $members]);
    }

    /**
     * Enroll member in a season
     *
     * The member's current category is copied to the enrollment.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @bodyParam member_id integer required ID of the member to enroll.
     */
    public function store(EnrollMemberRequest $request, Season $season): JsonResponse
    {
        $member = Member::findOrFail($request->validated('member_id'));

        $enrollment = $season->memberSeasons()->create([
            'member_id' => $member->id,
            'category' => $member->category,
        ]);

        return response()->json(['enrollment' => $this->present($enrollment->load('member'))], 201);
    }

    /**
     * Update a member's category for this season.
     *
     * This does not change the member's category or existing allocation amounts.
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @urlParam memberSeason integer required The enrollment ID.
     * @bodyParam category string nullable required Season-specific category, or null.
     * @responseField enrollment object Updated enrollment.
     */
    public function update(Request $request, Season $season, MemberSeason $memberSeason): JsonResponse
    {
        abort_unless($memberSeason->season_id === $season->id, 404);

        $data = $request->validate([
            'category' => 'present|nullable|string|max:100',
        ]);
        $memberSeason->update($data);

        return response()->json(['enrollment' => $this->present($memberSeason->load('member'))]);
    }

    /**
     * Remove member enrollment from a season
     *
     * @endpoint
     * @authenticated
     * @urlParam season integer required The season ID.
     * @urlParam memberSeason integer required The enrollment ID.
     */
    public function destroy(Season $season, MemberSeason $memberSeason): JsonResponse
    {
        abort_unless($memberSeason->season_id === $season->id, 404);

        if ($memberSeason->allocations()->exists()) {
            return response()->json(['message' => 'Member has allocations in this season and cannot be removed'], 409);
        }

        $memberSeason->delete();

        return response()->json(['message' => 'Enrollment removed']);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(MemberSeason $item): array
    {
        return [
            'id' => $item->id,
            'season_id' => $item->season_id,
            'member_id' => $item->member_id,
            'first_name' => $item->member->first_name,
            'last_name' => $item->member->last_name,
            'category' => $item->category,
            'member_category' => $item->member->category,
        ];
    }
}
