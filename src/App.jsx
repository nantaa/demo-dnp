import React, { useEffect, useState } from 'react';
import { App as InertiaApp, router } from '@inertiajs/react';
import KanbanIndex from '../dnp-rework/resources/js/Pages/Kanban/Index.jsx';
import StageRailIndex from '../dnp-rework/resources/js/Pages/StageRail/Index.jsx';
import JobList from '../dnp-rework/resources/js/Pages/Jobs/List.jsx';
import JobCreate from '../dnp-rework/resources/js/Pages/Jobs/Create.jsx';
import DashboardIndex from '../dnp-rework/resources/js/Pages/Dashboard/Index.jsx';
import AlatSkp from '../dnp-rework/resources/js/Pages/Dashboard/AlatSkp.jsx';
import ReminderSuket from '../dnp-rework/resources/js/Pages/Dashboard/ReminderSuket.jsx';
import UsersIndex from '../dnp-rework/resources/js/Pages/Users/Index.jsx';
import PelaporanIndex from '../dnp-rework/resources/js/Pages/Pelaporan/Index.jsx';

const PAGES = {
  'Kanban/Index': KanbanIndex,
  'StageRail/Index': StageRailIndex,
  'Jobs/List': JobList,
  'Jobs/Create': JobCreate,
  'Dashboard/Index': DashboardIndex,
  'Dashboard/AlatSkp': AlatSkp,
  'Dashboard/ReminderSuket': ReminderSuket,
  'Users/Index': UsersIndex,
  'Pelaporan/Index': PelaporanIndex,
};

// Define route helper globally for Inertia components
if (typeof window !== 'undefined') {
  window.route = (name) => {
    if (name === 'logout') return '/logout';
    if (name === 'jobs.create') return '/jobs/create';
    if (name === 'jobs.index') return '/jobs';
    if (name === 'kanban') return '/kanban';
    if (name === 'stagerail' || name === 'stage-rail') return '/stage-rail';
    if (name === 'dashboard') return '/';
    return '/' + (name || '').replace('.', '/');
  };

  // Prevent Inertia modal error dialog
  router.on('invalid', (event) => {
    event.preventDefault();
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
          <span className="text-sm font-semibold">Memuat Kanban Board DNP Monitor...</span>
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