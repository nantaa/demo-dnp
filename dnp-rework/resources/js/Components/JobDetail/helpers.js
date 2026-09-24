export const parseJsonArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
};

export const parseJsonObject = (v) => {
    if (!v) return {};
    if (typeof v === 'object' && !Array.isArray(v) && v !== null) return v;
    try {
        const parsed = JSON.parse(v);
        return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch { return {}; }
};

export const parseLhppLinks = (rawLink, unitCount = 1) => {
    const count = Math.max(1, parseInt(unitCount) || 1);
    let list = [];

    if (typeof rawLink === 'string' && rawLink.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(rawLink);
            if (Array.isArray(parsed) && parsed.length > 0) {
                list = parsed.map((item, idx) => ({
                    id: item?.id || `unit-${idx + 1}`,
                    unit_no: item?.unit_no || idx + 1,
                    label: item?.label || (typeof item === 'string' ? `Unit ${idx + 1}` : `Unit ${idx + 1}`),
                    url: item?.url || (typeof item === 'string' ? item : ''),
                    notes: item?.notes || '',
                }));
            }
        } catch {
            list = [];
        }
    } else if (Array.isArray(rawLink) && rawLink.length > 0) {
        list = rawLink.map((item, idx) => ({
            id: item?.id || `unit-${idx + 1}`,
            unit_no: item?.unit_no || idx + 1,
            label: item?.label || `Unit ${idx + 1}`,
            url: item?.url || (typeof item === 'string' ? item : ''),
            notes: item?.notes || '',
        }));
    } else if (typeof rawLink === 'string' && rawLink.trim()) {
        list = [
            { id: 'unit-1', unit_no: 1, label: 'Unit 1 / Folder Utama', url: rawLink.trim(), notes: '' }
        ];
    }

    if (list.length === 0) {
        return Array.from({ length: count }, (_, i) => ({
            id: `unit-${i + 1}`,
            unit_no: i + 1,
            label: `Unit ${i + 1}`,
            url: '',
            notes: '',
        }));
    }

    while (list.length < count) {
        const nextIdx = list.length + 1;
        list.push({
            id: `unit-${nextIdx}-${Date.now()}`,
            unit_no: nextIdx,
            label: `Unit ${nextIdx}`,
            url: '',
            notes: '',
        });
    }

    return list;
};

export const hasValidLhppLink = (links) => {
    if (!Array.isArray(links)) return false;
    return links.some(item => typeof item?.url === 'string' && item.url.trim().length > 0);
};

export const fmt = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    d ? new Date(d).toLocaleDateString('id-ID', opts) : '—';

export const fmtCurrency = (n) =>
    n != null && n !== '' ? 'Rp ' + Number(n).toLocaleString('id-ID') : '—';

export const fmtSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};

export const daysElapsed = (from) => {
    if (!from) return null;
    return Math.ceil((new Date() - new Date(from)) / 86400000);
};

export const isSlaOverdue = (days, slaLimit) => days != null && slaLimit && days > slaLimit;

export const getSlaBadge = (days, slaLimit) => {
    if (days == null || !slaLimit) return null;
    const diff = days - slaLimit;
    if (diff > 0) return { text: `+${diff}h OVERDUE`, cls: 'bg-red-500 text-white' };
    if (diff === 0) return { text: 'Hari Terakhir', cls: 'bg-orange-500 text-white' };
    return { text: `${Math.abs(diff)}h tersisa`, cls: 'bg-green-600 text-white' };
};

export const getSlaTag = (days, slaLimit) => {
    if (days == null || !slaLimit) return null;
    if (days > slaLimit)  return { label: 'OVERDUE',  cls: 'bg-red-100 text-red-800 font-bold' };
    if (days >= slaLimit) return { label: 'LAST DAY', cls: 'bg-orange-100 text-orange-800 font-bold' };
    return { label: 'ON TRACK', cls: 'bg-green-100 text-green-800' };
};

export const getDocumentUrl = (doc, fallbackJobId) => {
    if (!doc) return '#';
    const jId = doc.job_id || doc.jobId || fallbackJobId;
    if (doc.id && jId) {
        const encodedName = encodeURIComponent(doc.name || 'Dokumen.pdf');
        return `/jobs/${jId}/documents/${doc.id}/file/${encodedName}`;
    }
    return doc.path ? `/storage/${doc.path}` : '#';
};

export const getDocDownloadUrl = (doc, fallbackJobId) => getDocumentUrl(doc, fallbackJobId);

export const isPoLockedForIns = (doc, isINS) => {
    if (!isINS || !doc) return false;
    const type = String(doc.type || '').toUpperCase();
    const name = String(doc.name || '').toUpperCase();
    return (
        type.includes('PO') ||
        type.includes('SPK') ||
        name.includes('PO') ||
        name.includes('SPK')
    );
};
