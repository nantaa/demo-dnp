import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { showToast } from '@/swal';

export default function NotificationBell({ onSelectJob }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const prevNotifIdsRef = useRef(null);

    const fetchNotifications = () => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => {
                const fetchedNotifs = data.notifications || [];
                const newUnreadCount = data.unread_count || 0;

                // Show corner toast alert for new unread notifications
                if (prevNotifIdsRef.current !== null) {
                    const newNotifs = fetchedNotifs.filter(
                        n => !n.is_read && !prevNotifIdsRef.current.has(n.id)
                    );
                    newNotifs.forEach(notif => {
                        let iconType = 'info';
                        if (notif.type === 'rejected' || notif.type === 'returned_stage1') {
                            iconType = 'warning';
                        } else if (notif.type === 'approved' || notif.type === 'completed') {
                            iconType = 'success';
                        }
                        showToast(notif.title, notif.body, iconType);
                    });
                }

                // Store current notification IDs to detect newly arrived notifications
                prevNotifIdsRef.current = new Set(fetchedNotifs.map(n => n.id));

                setNotifications(fetchedNotifs);
                setUnreadCount(newUnreadCount);
            })
            .catch(console.error);
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 8 seconds for fast real-time corner alerts
        const interval = setInterval(fetchNotifications, 8000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = (id) => {
        fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': getCsrfToken() } })
            .then(() => fetchNotifications())
            .catch(console.error);
    };

    const markAllRead = () => {
        fetch('/api/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': getCsrfToken() } })
            .then(() => fetchNotifications())
            .catch(console.error);
    };

    const getCsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const handleNotificationClick = (notif) => {
        if (!notif.is_read) {
            markAsRead(notif.id);
        }
        setIsOpen(false);
        if (notif.job_id) {
            // Navigate or open job detail sheet
            if (window.location.pathname.includes('/kanban') && onSelectJob && notif.job) {
                onSelectJob(notif.job);
            } else {
                router.visit(`/kanban`);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors focus:outline-none"
                title="Notifikasi"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden text-xs">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-black" />
                            <span className="font-bold text-sm text-gray-900">Notifikasi</span>
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                    {unreadCount} Baru
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                            >
                                <CheckCheck size={14} /> Tandai Semua Dibaca
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400">
                                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                Tidak ada notifikasi saat ini
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-3.5 cursor-pointer transition-colors hover:bg-gray-50 flex items-start gap-3 ${
                                        !notif.is_read ? 'bg-blue-50/60 font-medium' : ''
                                    }`}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {!notif.is_read ? (
                                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span>
                                        ) : (
                                            <span className="w-2.5 h-2.5 bg-gray-300 rounded-full inline-block"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-bold text-gray-900 truncate pr-2">{notif.title}</h4>
                                            <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-0.5">
                                                <Clock size={10} />
                                                {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 line-clamp-2 leading-tight text-[11px]">{notif.body}</p>
                                        {notif.job && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-gray-400">
                                                <ExternalLink size={10} /> {notif.job.kode} · {notif.job.klien}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 border-t text-center">
                        <span className="text-[10px] text-gray-400">DNP Monitor Notification Hub</span>
                    </div>
                </div>
            )}
        </div>
    );
}
