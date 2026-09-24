import React from 'react';

const NoteField = React.memo(function NoteField({ value, onChange }) {
    return (
        <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan / Keterangan</label>
            <textarea
                rows={2}
                value={value || ''}
                onChange={onChange}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400"
                placeholder="Tulis catatan atau keterangan..."
            />
        </div>
    );
});

export default NoteField;
