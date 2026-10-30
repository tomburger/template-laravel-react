<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMemberRequest;
use App\Http\Requests\UpdateMemberRequest;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class MemberController extends Controller
{
    /**
     * List members
     *
     * @endpoint
     * @authenticated
     * @responseField members object[] List of members including the linked user's name and email
     */
    public function index(): JsonResponse
    {
        $members = Member::with('user:id,name,email')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (Member $member) => $this->present($member));

        return response()->json(['members' => $members]);
    }

    /**
     * List users that are not members yet
     *
     * @endpoint
     * @authenticated
     * @responseField users object[] Users without a member record
     */
    public function candidates(): JsonResponse
    {
        $users = User::whereNotIn('id', Member::select('id'))
            ->orderBy('email')
            ->get(['id', 'name', 'email']);

        return response()->json(['users' => $users]);
    }

    /**
     * Create member
     *
     * @endpoint
     * @authenticated
     * @bodyParam user_id integer required ID of an existing user that is not a member yet.
     * @bodyParam first_name string required First name.
     * @bodyParam last_name string required Last name.
     * @bodyParam phone_number string Phone number.
     * @bodyParam category string Member category.
     */
    public function store(StoreMemberRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['id'] = $data['user_id'];
        unset($data['user_id']);

        $member = Member::create($data);

        return response()->json(['member' => $this->present($member->load('user:id,name,email'))], 201);
    }

    /**
     * Update member
     *
     * @endpoint
     * @authenticated
     * @urlParam member integer required The member (user) ID.
     * @bodyParam first_name string required First name.
     * @bodyParam last_name string required Last name.
     * @bodyParam phone_number string Phone number.
     * @bodyParam category string Member category.
     */
    public function update(UpdateMemberRequest $request, Member $member): JsonResponse
    {
        $member->update($request->validated());

        return response()->json(['member' => $this->present($member->load('user:id,name,email'))]);
    }

    /**
     * Delete member
     *
     * Removes the member record only; the user account is kept.
     *
     * @endpoint
     * @authenticated
     * @urlParam member integer required The member (user) ID.
     */
    public function destroy(Member $member): JsonResponse
    {
        $member->delete();

        return response()->json(['message' => 'Member deleted']);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Member $member): array
    {
        return [
            'id' => $member->id,
            'first_name' => $member->first_name,
            'last_name' => $member->last_name,
            'phone_number' => $member->phone_number,
            'category' => $member->category,
            'email' => $member->user?->email,
            'user_name' => $member->user?->name,
        ];
    }
}
