<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserStagePermission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index()
    {
        // Only superadmin can access user management
        if (Auth::user()->role !== 'superadmin') {
            abort(403, 'Unauthorized. Superadmin access required.');
        }

        $users = User::with(['stagePermissions', 'inspectorProfile'])->orderBy('created_at', 'desc')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'auth' => [
                'user' => Auth::user(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'superadmin') abort(403);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|string|email|max:255|unique:users',
            'password'       => 'required|string|min:8',
            'role'           => 'required|string',
            'skp'            => 'nullable|string|max:100',
            'skp_expired_at' => 'nullable|date',
            'spesialisasi'   => 'nullable|array',
            'domisili'       => 'nullable|string|max:100',
            'senior_level'   => 'nullable|boolean',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        if ($user->role === 'inspektur') {
            $user->inspectorProfile()->create([
                'skp'            => $validated['skp'] ?? '',
                'skp_expired_at' => $validated['skp_expired_at'] ?? null,
                'spesialisasi'   => $validated['spesialisasi'] ?? [],
                'domisili'       => $validated['domisili'] ?? '',
                'senior_level'   => $validated['senior_level'] ?? false,
                'active'         => true,
            ]);
        }

        return back()->with('success', 'User created successfully.');
    }

    public function updatePermissions(Request $request, User $user)
    {
        if (Auth::user()->role !== 'superadmin') abort(403);

        $validated = $request->validate([
            'stages' => 'array',
            'stages.*' => 'integer|min:1|max:11',
        ]);

        // Wipe old permissions
        $user->stagePermissions()->delete();

        // Add new permissions
        foreach ($validated['stages'] as $stage) {
            UserStagePermission::create([
                'user_id' => $user->id,
                'stage' => $stage,
                'is_owner' => 1,
                'can_view' => 1,
            ]);
        }

        return back()->with('success', 'Permissions updated successfully.');
    }

    public function destroy(User $user)
    {
        if (Auth::user()->role !== 'superadmin') abort(403);
        if ($user->id === Auth::id()) abort(400, 'Cannot delete yourself.');

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
