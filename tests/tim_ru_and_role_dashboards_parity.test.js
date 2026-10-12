import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dashboardPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Dashboard/Index.jsx');
const userModelPath = path.join(rootDir, 'dnp-rework/app/Models/User.php');
const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
const sheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

describe('Tim RU & Role Dashboards Parity Suite', () => {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    const userModelContent = fs.readFileSync(userModelPath, 'utf8');
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    it('1. Backend User.php recognizes tim_ru as a valid alias for Stage 4 & 5', () => {
        assert.ok(
            userModelContent.includes("'tim_ru'") && userModelContent.includes("'inspektur'"),
            'User.php must include tim_ru alias alongside inspektur'
        );
    });

    it('2. Constants.js maps tim_ru to Tim Riksa Uji and TRU badge', () => {
        assert.ok(
            constantsContent.includes("tim_ru: { name: 'Tim Riksa Uji', label: 'TRU' }") ||
            constantsContent.includes('tim_ru:'),
            'Constants.js must define tim_ru role'
        );
    });

    it('3. Tim RU Dashboard: lhppJobs must not filter out jobs based on peer_review_status', () => {
        const lhppJobsMatch = dashboardContent.match(/const lhppJobs = isINS[\s\S]*?\.map\(/);
        assert.ok(lhppJobsMatch, 'lhppJobs filter must exist');
        assert.ok(
            !lhppJobsMatch[0].includes("peer_review_status === 'draft'"),
            'lhppJobs must not check peer_review_status (which is a Stage 2 bypass flag)'
        );
    });

    it('4. Manager Dashboard: workloadByInspektur must count Stage 5 as active LHPP drafting', () => {
        const lhppCountMatch = dashboardContent.match(/const lhppCount = activeInspJobs\.filter\(j => ([^)]+)\)\.length;/);
        assert.ok(lhppCountMatch, 'lhppCount must exist');
        assert.ok(
            lhppCountMatch[1].includes('5'),
            'lhppCount must include Stage 5 (Penyusunan LHPP)'
        );
    });

    it('5. Admin Dashboard: must render interactive table for Stage 2 antrianVerifikasi', () => {
        assert.ok(
            dashboardContent.includes('Antrean Verifikasi Dokumen & Surat Permohonan') ||
            dashboardContent.includes('Antrean Verifikasi · Tahap 02'),
            'AdmDashboard must render interactive table for Stage 2'
        );
        assert.ok(
            dashboardContent.includes('Verifikasi Dokumen &rarr;') || dashboardContent.includes('Verifikasi &rarr;'),
            'AdmDashboard must have direct action button for Stage 2 jobs'
        );
    });

    it('6. Admin Dashboard: must provide actionable list for H-5 Disnaker warning', () => {
        assert.ok(
            dashboardContent.includes('Daftar Job Peringatan H-5 Disnaker') ||
            dashboardContent.includes('Peringatan H-5 Disnaker · Belum Lapor Teman K3'),
            'AdmDashboard must provide actionable table/list for H-5 pending jobs'
        );
    });

    it('7. Tim RU Naming: Dashboard title and UI labels use Tim RU / Tim Riksa Uji', () => {
        assert.ok(
            dashboardContent.includes('Dashboard Tim Riksa Uji') || dashboardContent.includes('Dashboard Tim RU'),
            'Dashboard title for isINS must use Tim Riksa Uji / Tim RU'
        );
        assert.ok(
            dashboardContent.includes('Beban Kerja Tim Riksa Uji (Tim RU)') ||
            dashboardContent.includes('Beban Kerja Tim RU'),
            'Manager dashboard workload header must use Tim RU'
        );
        assert.ok(
            dashboardContent.includes('Semua Personel Tim RU'),
            'Calendar dropdown must use Semua Personel Tim RU'
        );
    });

    it('8. JobDetailSheet displays Personel Tim RU instead of Inspektur Bertugas', () => {
        assert.ok(
            sheetContent.includes('Personel Tim RU Bertugas') ||
            sheetContent.includes('Tim Riksa Uji (Tim RU)'),
            'JobDetailSheet must display Tim RU terminology'
        );
    });
});
