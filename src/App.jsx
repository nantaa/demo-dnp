import React, { useEffect, useState } from 'react';
import { App as InertiaApp, router } from '@inertiajs/react';
import { showError } from '@/swal';
import KanbanIndex from '@/Pages/Kanban/Index.jsx';
import JobList from '@/Pages/Jobs/List.jsx';
import JobCreate from '@/Pages/Jobs/Create.jsx';
import DashboardIndex from '@/Pages/Dashboard/Index.jsx';
import AlatSkp from '@/Pages/Dashboard/AlatSkp.jsx';
import ReminderSuket from '@/Pages/Dashboard/ReminderSuket.jsx';
import UsersIndex from '@/Pages/Users/Index.jsx';
import PelaporanIndex from '@/Pages/Pelaporan/Index.jsx';
import AuthLogin from '@/Pages/Auth/Login.jsx';
import ProfileEdit from '@/Pages/Profile/Edit.jsx';

const PAGES = {
  'Kanban/Index': KanbanIndex,
  'Jobs/List': JobList,
  'Jobs/Index': JobList,
  'Jobs/Create': JobCreate,
  'Dashboard/Index': DashboardIndex,
  'Dashboard/AlatSkp': AlatSkp,
  'Dashboard/ReminderSuket': ReminderSuket,
  'Users/Index': UsersIndex,
  'Pelaporan/Index': PelaporanIndex,
  'Auth/Login': AuthLogin,
  'Profile/Edit': ProfileEdit,
};

// Global route helper for Inertia links
if (typeof window !== 'undefined') {
  window.route = (name) => {
    if (name === 'logout') return '/logout';
    if (name === 'jobs.create') return '/jobs/create';
    if (name === 'jobs.index') return '/jobs';
    if (name === 'kanban') return '/kanban';
    if (name === 'dashboard') return '/';
    return '/' + (name || '').replace('.', '/');
  };

  // Handle unexpected non-Inertia HTTP responses (419 CSRF, 500 server crash, etc.) with visible alerts
  router.on('invalid', (event) => {
    event.preventDefault();
    const status = event.detail.response?.status;
    let title = 'Komunikasi Server Gagal';
    let msg = 'Terjadi kesalahan komunikasi dengan server.';
    if (status === 419) {
      title = 'Sesi Kedaluwarsa (419)';
      msg = 'Sesi keamanan Anda telah habis. Silakan muat ulang (refresh) halaman untuk melanjutkan.';
    } else if (status === 429) {
      title = 'Terlalu Banyak Permintaan (429)';
      msg = 'Terlalu banyak permintaan dalam waktu singkat. Harap tunggu beberapa saat.';
    } else if (status === 500) {
      title = 'Kesalahan Server (500)';
      msg = 'Terjadi kesalahan sistem internal pada server. Harap hubungi administrator.';
    } else if (status === 502 || status === 503 || status === 504) {
      title = `Layanan Tidak Tersedia (${status})`;
      msg = 'Server sedang dalam pemeliharaan atau tidak dapat dijangkau.';
    }
    showError(title, msg);
  });
}

export default function App() {
  const [initialPage, setInitialPage] = useState(null);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const targetUrl = (currentPath === '/' || currentPath === '') ? '/kanban' : currentPath;
    fetch(targetUrl, { headers: { 'x-inertia': 'true' } })
      .then(res => res.json())
      .then(data => {
        if (data?.url && window.location.pathname !== data.url) {
          window.history.replaceState({}, '', data.url);
        }
        setInitialPage(data);
      })
      .catch(err => {
        console.error('Failed to fetch initial page:', err);
      });
  }, []);

  if (!initialPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 text-slate-600 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#00A8E8] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Memuat DNP Monitor...</span>
        </div>
      </div>
    );
  }

  return (
    <InertiaApp
      initialPage={initialPage}
      initialComponent={PAGES[initialPage.component] || KanbanIndex}
      resolveComponent={(name) => PAGES[name] || KanbanIndex}
    />
  );
}
