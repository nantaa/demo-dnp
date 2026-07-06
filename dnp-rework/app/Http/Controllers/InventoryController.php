<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AlatUji;
use App\Models\InspectorProfile;
use App\Models\SertifikatPjk3;
use App\Models\RegulasiK3;
use App\Models\FormDisnaker;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    private function canManage(): bool
    {
        $role = Auth::user()->role;
        return in_array($role, ['superadmin', 'admin', 'manager']);
    }

    // ─── Alat Uji ────────────────────────────────────────────────────────
    public function storeAlat(Request $request)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'kode_alat'          => 'required|string|max:50|unique:alat_ujis,kode_alat',
            'nama'               => 'required|string|max:255',
            'merk'               => 'nullable|string|max:100',
            'serial'             => 'nullable|string|max:100',
            'kategori'           => 'nullable|array',
            'kalibrasi_terakhir' => 'nullable|date',
            'kalibrasi_expired'  => 'nullable|date',
            'lab'                => 'nullable|string|max:100',
            'status'             => 'required|string|in:tersedia,sedang dipakai,rusak',
        ]);

        AlatUji::create($validated);
        return back()->with('success', 'Alat berhasil ditambahkan.');
    }

    public function updateAlat(Request $request, AlatUji $alatUji)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'nama'               => 'required|string|max:255',
            'merk'               => 'nullable|string|max:100',
            'serial'             => 'nullable|string|max:100',
            'kategori'           => 'nullable|array',
            'kalibrasi_terakhir' => 'nullable|date',
            'kalibrasi_expired'  => 'nullable|date',
            'lab'                => 'nullable|string|max:100',
            'status'             => 'required|string|in:tersedia,sedang dipakai,rusak',
        ]);

        $alatUji->update($validated);
        return back()->with('success', 'Alat berhasil diperbarui.');
    }

    public function destroyAlat(AlatUji $alatUji)
    {
        if (!$this->canManage()) abort(403);
        $alatUji->delete();
        return back()->with('success', 'Alat berhasil dihapus.');
    }

    // ─── Inspector / SKP ─────────────────────────────────────────────────
    public function storeInspector(Request $request)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'user_id'       => 'required|exists:users,id',
            'skp'           => 'nullable|string|max:100',
            'skp_expired_at' => 'nullable|date',
            'spesialisasi'  => 'nullable|array',
            'domisili'      => 'nullable|string|max:100',
            'senior_level'  => 'nullable|boolean',
        ]);

        // Prevent duplicate profile
        if (InspectorProfile::where('user_id', $validated['user_id'])->exists()) {
            return back()->withErrors(['user_id' => 'User ini sudah memiliki profil inspektur.']);
        }

        InspectorProfile::create($validated);
        return back()->with('success', 'Profil inspektur berhasil ditambahkan.');
    }

    public function updateInspector(Request $request, InspectorProfile $inspectorProfile)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'skp'           => 'nullable|string|max:100',
            'skp_expired_at' => 'nullable|date',
            'spesialisasi'  => 'nullable|array',
            'domisili'      => 'nullable|string|max:100',
            'senior_level'  => 'nullable|boolean',
        ]);

        $inspectorProfile->update($validated);
        return back()->with('success', 'Profil inspektur berhasil diperbarui.');
    }

    public function destroyInspector(InspectorProfile $inspectorProfile)
    {
        if (!$this->canManage()) abort(403);
        $inspectorProfile->delete();
        return back()->with('success', 'Profil inspektur berhasil dihapus.');
    }

    // ─── Sertifikat PJK3 ─────────────────────────────────────────────────
    public function storeSertifikat(Request $request)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'kode_cert' => 'required|string|max:50',
            'nama'      => 'required|string|max:255',
            'no_sk'     => 'nullable|string|max:255',
            'terbit'    => 'nullable|date',
            'expired'   => 'nullable|date',
            'file'      => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png,zip,doc,docx,xls,xlsx',
            'kategori'  => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('master-documents/sertifikat', 'public');
            $validated['file'] = $path;
        }

        SertifikatPjk3::create($validated);
        return back()->with('success', 'Sertifikat berhasil ditambahkan.');
    }

    public function updateSertifikat(Request $request, SertifikatPjk3 $sertifikatPjk3)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'no_sk'     => 'nullable|string|max:255',
            'terbit'    => 'nullable|date',
            'expired'   => 'nullable|date',
            'file'      => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png,zip,doc,docx,xls,xlsx',
            'kategori'  => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('file')) {
            if ($sertifikatPjk3->file) {
                Storage::disk('public')->delete($sertifikatPjk3->file);
            }
            $path = $request->file('file')->store('master-documents/sertifikat', 'public');
            $validated['file'] = $path;
        }

        $sertifikatPjk3->update($validated);
        return back()->with('success', 'Sertifikat berhasil diperbarui.');
    }

    public function destroySertifikat(SertifikatPjk3 $sertifikatPjk3)
    {
        if (!$this->canManage()) abort(403);
        if ($sertifikatPjk3->file) {
            Storage::disk('public')->delete($sertifikatPjk3->file);
        }
        $sertifikatPjk3->delete();
        return back()->with('success', 'Sertifikat berhasil dihapus.');
    }

    // ─── Regulasi K3 ─────────────────────────────────────────────────────
    public function storeRegulasi(Request $request)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'kode_reg'        => 'required|string|max:50|unique:regulasi_k3s,kode_reg',
            'kategori'        => 'nullable|string|max:100',
            'nama'            => 'required|string|max:255',
            'tentang'         => 'nullable|string',
            'terbit'          => 'nullable|date',
            'status'          => 'nullable|string|max:50',
            'file'            => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png,zip,doc,docx,xls,xlsx',
            'revisi_terakhir' => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('master-documents/regulasi', 'public');
            $validated['source'] = $path;
        }

        RegulasiK3::create($validated);
        return back()->with('success', 'Regulasi berhasil ditambahkan.');
    }

    public function updateRegulasi(Request $request, RegulasiK3 $regulasiK3)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'kategori'        => 'nullable|string|max:100',
            'nama'            => 'required|string|max:255',
            'tentang'         => 'nullable|string',
            'terbit'          => 'nullable|date',
            'status'          => 'nullable|string|max:50',
            'file'            => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png,zip,doc,docx,xls,xlsx',
            'revisi_terakhir' => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('file')) {
            if ($regulasiK3->source) {
                Storage::disk('public')->delete($regulasiK3->source);
            }
            $path = $request->file('file')->store('master-documents/regulasi', 'public');
            $validated['source'] = $path;
        }

        $regulasiK3->update($validated);
        return back()->with('success', 'Regulasi berhasil diperbarui.');
    }

    public function destroyRegulasi(RegulasiK3 $regulasiK3)
    {
        if (!$this->canManage()) abort(403);
        if ($regulasiK3->source) {
            Storage::disk('public')->delete($regulasiK3->source);
        }
        $regulasiK3->delete();
        return back()->with('success', 'Regulasi berhasil dihapus.');
    }

    // ─── Form Disnaker ───────────────────────────────────────────────────
    public function storeFormDisnaker(Request $request)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'kode_form'     => 'required|string|max:50|unique:form_disnakers,kode_form',
            'kode_disnaker' => 'nullable|string|max:50',
            'nama'          => 'required|string|max:255',
            'pesawat'       => 'nullable|string|max:255',
            'revisi'        => 'nullable|string|max:100',
            'last_updated'  => 'nullable|date',
            'file'          => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png,zip,doc,docx,xls,xlsx',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('master-documents/form-disnaker', 'public');
            $validated['file'] = $path;
        }

        FormDisnaker::create($validated);
        return back()->with('success', 'Form Disnaker berhasil ditambahkan.');
    }

    public function updateFormDisnaker(Request $request, FormDisnaker $formDisnaker)
    {
        if (!$this->canManage()) abort(403);

        $validated = $request->validate([
            'kode_disnaker' => 'nullable|string|max:50',
            'nama'          => 'required|string|max:255',
            'pesawat'       => 'nullable|string|max:255',
            'revisi'        => 'nullable|string|max:100',
            'last_updated'  => 'nullable|date',
            'file'          => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png,zip,doc,docx,xls,xlsx',
        ]);

        if ($request->hasFile('file')) {
            if ($formDisnaker->file) {
                Storage::disk('public')->delete($formDisnaker->file);
            }
            $path = $request->file('file')->store('master-documents/form-disnaker', 'public');
            $validated['file'] = $path;
        }

        $formDisnaker->update($validated);
        return back()->with('success', 'Form Disnaker berhasil diperbarui.');
    }

    public function destroyFormDisnaker(FormDisnaker $formDisnaker)
    {
        if (!$this->canManage()) abort(403);
        if ($formDisnaker->file) {
            Storage::disk('public')->delete($formDisnaker->file);
        }
        $formDisnaker->delete();
        return back()->with('success', 'Form Disnaker berhasil dihapus.');
    }
}
