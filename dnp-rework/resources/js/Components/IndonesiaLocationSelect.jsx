import React, { useState, useEffect } from 'react';

// Fallback list of Indonesia 38 Provinces in case API is unreachable
const FALLBACK_PROVINCES = [
    { id: "11", name: "Aceh" },
    { id: "12", name: "Sumatera Utara" },
    { id: "13", name: "Sumatera Barat" },
    { id: "14", name: "Riau" },
    { id: "15", name: "Jambi" },
    { id: "16", name: "Sumatera Selatan" },
    { id: "17", name: "Bengkulu" },
    { id: "18", name: "Lampung" },
    { id: "19", name: "Kepulauan Bangka Belitung" },
    { id: "21", name: "Kepulauan Riau" },
    { id: "31", name: "DKI Jakarta" },
    { id: "32", name: "Jawa Barat" },
    { id: "33", name: "Jawa Tengah" },
    { id: "34", name: "DI Yogyakarta" },
    { id: "35", name: "Jawa Timur" },
    { id: "36", name: "Banten" },
    { id: "51", name: "Bali" },
    { id: "52", name: "Nusa Tenggara Barat" },
    { id: "53", name: "Nusa Tenggara Timur" },
    { id: "61", name: "Kalimantan Barat" },
    { id: "62", name: "Kalimantan Tengah" },
    { id: "63", name: "Kalimantan Selatan" },
    { id: "64", name: "Kalimantan Timur" },
    { id: "65", name: "Kalimantan Utara" },
    { id: "71", name: "Sulawesi Utara" },
    { id: "72", name: "Sulawesi Tengah" },
    { id: "73", name: "Sulawesi Selatan" },
    { id: "74", name: "Sulawesi Tenggara" },
    { id: "75", name: "Gorontalo" },
    { id: "76", name: "Sulawesi Barat" },
    { id: "81", name: "Maluku" },
    { id: "82", name: "Maluku Utara" },
    { id: "91", name: "Papua Barat" },
    { id: "92", name: "Papua" },
    { id: "93", name: "Papua Selatan" },
    { id: "94", name: "Papua Tengah" },
    { id: "95", name: "Papua Pegunungan" },
    { id: "96", name: "Papua Barat Daya" }
];

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(?:^|\s|-)\S/g, (m) => m.toUpperCase());
};

export default function IndonesiaLocationSelect({ value = '', onChange, required = false, error = null }) {
    const [provinces, setProvinces] = useState(FALLBACK_PROVINCES);
    const [cities, setCities] = useState([]);
    const [selectedProvId, setSelectedProvId] = useState('');
    const [selectedProvName, setSelectedProvName] = useState('');
    const [selectedCityName, setSelectedCityName] = useState('');
    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Fetch provinces from API on mount
    useEffect(() => {
        setLoadingProv(true);
        fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
            .then(res => {
                if (!res.ok) throw new Error('Network error');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const formatted = data.map(p => ({
                        id: String(p.id),
                        name: toTitleCase(p.name)
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setProvinces(formatted);
                }
            })
            .catch(err => {
                console.warn('Using fallback provinces due to API fetch error:', err);
            })
            .finally(() => setLoadingProv(false));
    }, []);

    // Sync state when initial value or value changes from parent
    useEffect(() => {
        if (value && provinces.length > 0 && !selectedProvId) {
            const parts = value.split(',').map(s => s.trim());
            if (parts.length >= 2) {
                const cityName = parts[0];
                const provName = parts[1];
                const foundProv = provinces.find(p => p.name.toLowerCase() === provName.toLowerCase());
                if (foundProv) {
                    setSelectedProvId(foundProv.id);
                    setSelectedProvName(foundProv.name);
                    setSelectedCityName(cityName);
                }
            } else if (parts.length === 1) {
                const foundProv = provinces.find(p => p.name.toLowerCase() === parts[0].toLowerCase());
                if (foundProv) {
                    setSelectedProvId(foundProv.id);
                    setSelectedProvName(foundProv.name);
                }
            }
        }
    }, [value, provinces]);

    // Fetch regencies/cities when province changes
    useEffect(() => {
        if (!selectedProvId) {
            setCities([]);
            return;
        }
        setLoadingCities(true);
        fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
            .then(res => {
                if (!res.ok) throw new Error('Network error');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const formatted = data.map(c => ({
                        id: String(c.id),
                        name: toTitleCase(c.name)
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setCities(formatted);
                }
            })
            .catch(err => {
                console.error('Failed to fetch cities:', err);
                setCities([]);
            })
            .finally(() => setLoadingCities(false));
    }, [selectedProvId]);

    const handleProvChange = (e) => {
        const provId = e.target.value;
        setSelectedProvId(provId);
        const provObj = provinces.find(p => p.id === provId);
        const provName = provObj ? provObj.name : '';
        setSelectedProvName(provName);
        setSelectedCityName('');

        // Notify parent
        if (provName) {
            onChange(provName);
        } else {
            onChange('');
        }
    };

    const handleCityChange = (e) => {
        const cityName = e.target.value;
        setSelectedCityName(cityName);

        if (cityName && selectedProvName) {
            onChange(`${cityName}, ${selectedProvName}`);
        } else if (cityName) {
            onChange(cityName);
        } else if (selectedProvName) {
            onChange(selectedProvName);
        } else {
            onChange('');
        }
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provinsi Dropdown */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        Provinsi {required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        value={selectedProvId}
                        onChange={handleProvChange}
                        className="w-full px-3 py-2 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white"
                        required={required}
                    >
                        <option value="">
                            {loadingProv ? '-- Memuat Provinsi... --' : '-- Pilih Provinsi --'}
                        </option>
                        {provinces.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Kota / Kabupaten Dropdown */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        Kota / Kabupaten {required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        value={selectedCityName}
                        onChange={handleCityChange}
                        disabled={!selectedProvId || loadingCities}
                        className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-1 focus:ring-blue-500 bg-white"
                        required={required}
                    >
                        <option value="">
                            {loadingCities
                                ? '-- Memuat Kota/Kab... --'
                                : !selectedProvId
                                ? '-- Pilih Provinsi Terlebih Dahulu --'
                                : '-- Pilih Kota / Kabupaten --'}
                        </option>
                        {cities.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );
}
