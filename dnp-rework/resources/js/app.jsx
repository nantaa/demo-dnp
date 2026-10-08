import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'DNP Monitoring System';

// Global route fallback helper to prevent ReferenceError: route is not defined
if (typeof window !== 'undefined') {
    window.route = window.route || function(name, params) {
        var routes = {
            'login': '/login',
            'logout': '/logout',
            'dashboard': '/',
            'kanban': '/kanban',
            'jobs.index': '/jobs',
            'jobs.create': '/jobs/create',
            'reminder.suket': '/reminder-suket',
            'inventory': '/inventory',
            'pelaporan.index': '/pelaporan',
            'profile.edit': '/profile',
            'users.index': '/users'
        };
        var target = routes[name] || ('/' + (name || '').replace(/\./g, '/'));
        if (params && typeof params === 'object') {
            var qs = Object.keys(params).map(function(k){
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
            return qs ? target + '?' + qs : target;
        }
        return target;
    };
}

// Safely extract initial page data whether Inertia rendered it in a script tag or on dataset.page
let initialPageData = undefined;
if (typeof window !== 'undefined') {
    const appEl = document.getElementById('app');
    const scriptEl = document.querySelector('script[data-page="app"]');
    const raw = (appEl && appEl.dataset && appEl.dataset.page) || (scriptEl && scriptEl.textContent);
    if (raw) {
        try {
            initialPageData = JSON.parse(raw);
            if (appEl && appEl.dataset && !appEl.dataset.page) {
                appEl.dataset.page = raw;
            }
        } catch (e) {
            console.error('Failed to parse initial Inertia page data:', e);
        }
    }
}

createInertiaApp({
    page: initialPageData,
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#00A8E8',
    },
});
