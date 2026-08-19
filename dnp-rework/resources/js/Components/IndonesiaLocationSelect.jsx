import React, { useState, useEffect } from 'react';

// Fallback list of Indonesia 38 Provinces
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

// Offline fallback Cities dictionary by Province ID
const FALLBACK_CITIES = {
    "36": ["Kabupaten Lebak", "Kabupaten Pandeglang", "Kabupaten Serang", "Kabupaten Tangerang", "Kota Cilegon", "Kota Serang", "Kota Tangerang", "Kota Tangerang Selatan"],
    "31": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"],
    "32": ["Kabupaten Bandung", "Kabupaten Bandung Barat", "Kabupaten Bekasi", "Kabupaten Bogor", "Kabupaten Ciamis", "Kabupaten Cianjur", "Kabupaten Cirebon", "Kabupaten Garut", "Kabupaten Indramayu", "Kabupaten Karawang", "Kabupaten Kuningan", "Kabupaten Majalengka", "Kabupaten Pangandaran", "Kabupaten Purwakarta", "Kabupaten Subang", "Kabupaten Sukabumi", "Kabupaten Sumedang", "Kabupaten Tasikmalaya", "Kota Bandung", "Kota Banjar", "Kota Bekasi", "Kota Bogor", "Kota Cimahi", "Kota Cirebon", "Kota Depok", "Kota Sukabumi", "Kota Tasikmalaya"],
    "33": ["Kabupaten Banjarnegara", "Kabupaten Banyumas", "Kabupaten Batang", "Kabupaten Blora", "Kabupaten Boyolali", "Kabupaten Brebes", "Kabupaten Cilacap", "Kabupaten Demak", "Kabupaten Grobogan", "Kabupaten Jepara", "Kabupaten Karanganyar", "Kabupaten Kebumen", "Kabupaten Kendal", "Kabupaten Klaten", "Kabupaten Kudus", "Kabupaten Magelang", "Kabupaten Pati", "Kabupaten Pekalongan", "Kabupaten Pemalang", "Kabupaten Purbalingga", "Kabupaten Purworejo", "Kabupaten Rembang", "Kabupaten Semarang", "Kabupaten Sragen", "Kabupaten Sukoharjo", "Kabupaten Tegal", "Kabupaten Temanggung", "Kabupaten Wonogiri", "Kabupaten Wonosobo", "Kota Magelang", "Kota Pekalongan", "Kota Salatiga", "Kota Semarang", "Kota Surakarta", "Kota Tegal"],
    "34": ["Kabupaten Bantul", "Kabupaten Gunungkidul", "Kabupaten Kulon Progo", "Kabupaten Sleman", "Kota Yogyakarta"],
    "35": ["Kabupaten Bangkalan", "Kabupaten Banyuwangi", "Kabupaten Blitar", "Kabupaten Bojonegoro", "Kabupaten Bondowoso", "Kabupaten Gresik", "Kabupaten Jember", "Kabupaten Jombang", "Kabupaten Kediri", "Kabupaten Lamongan", "Kabupaten Lumajang", "Kabupaten Madiun", "Kabupaten Magetan", "Kabupaten Malang", "Kabupaten Mojokerto", "Kabupaten Nganjuk", "Kabupaten Ngawi", "Kabupaten Pacitan", "Kabupaten Pamekasan", "Kabupaten Pasuruan", "Kabupaten Ponorogo", "Kabupaten Probolinggo", "Kabupaten Sampang", "Kabupaten Sidoarjo", "Kabupaten Situbondo", "Kabupaten Sumenep", "Kabupaten Trenggalek", "Kabupaten Tuban", "Kabupaten Tulungagung", "Kota Batu", "Kota Blitar", "Kota Kediri", "Kota Madiun", "Kota Malang", "Kota Mojokerto", "Kota Pasuruan", "Kota Probolinggo", "Kota Surabaya"],
    "51": ["Kabupaten Badung", "Kabupaten Bangli", "Kabupaten Buleleng", "Kabupaten Gianyar", "Kabupaten Jembrana", "Kabupaten Karangasem", "Kabupaten Klungkung", "Kabupaten Tabanan", "Kota Denpasar"],
    "52": ["Kabupaten Bima", "Kabupaten Dompu", "Kabupaten Lombok Barat", "Kabupaten Lombok Tengah", "Kabupaten Lombok Timur", "Kabupaten Lombok Utara", "Kabupaten Sumbawa", "Kabupaten Sumbawa Barat", "Kota Bima", "Kota Mataram"],
    "11": ["Kabupaten Aceh Barat", "Kabupaten Aceh Besar", "Kabupaten Aceh Selatan", "Kabupaten Aceh Timur", "Kota Banda Aceh", "Kota Langsa", "Kota Lhokseumawe", "Kota Sabang"],
    "12": ["Kabupaten Asahan", "Kabupaten Deli Serdang", "Kabupaten Karo", "Kabupaten Simalungun", "Kota Binjai", "Kota Medan", "Kota Pematangsiantar", "Kota Tebing Tinggi"],
    "13": ["Kabupaten Agam", "Kabupaten Tanah Datar", "Kota Bukittinggi", "Kota Padang", "Kota Payakumbuh"],
    "14": ["Kabupaten Bengkalis", "Kabupaten Kampar", "Kota Dumai", "Kota Pekanbaru"],
    "15": ["Kabupaten Batanghari", "Kabupaten Muaro Jambi", "Kota Jambi", "Kota Sungai Penuh"],
    "16": ["Kabupaten Banyuasin", "Kabupaten Musi Banyuasin", "Kota Palembang", "Kota Prabumulih"],
    "18": ["Kabupaten Lampung Selatan", "Kabupaten Lampung Tengah", "Kota Bandar Lampung", "Kota Metro"],
    "21": ["Kabupaten Bintan", "Kabupaten Karimun", "Kota Batam", "Kota Tanjungpinang"],
    "61": ["Kabupaten Kubu Raya", "Kabupaten Mempawah", "Kota Pontianak", "Kota Singkawang"],
    "63": ["Kabupaten Banjar", "Kabupaten Barito Kuala", "Kota Banjarbaru", "Kota Banjarmasin"],
    "64": ["Kabupaten Berau", "Kabupaten Kutai Kartanegara", "Kota Balikpapan", "Kota Bontang", "Kota Samarinda"],
    "71": ["Kabupaten Minahasa", "Kota Bitung", "Kota Manado", "Kota Tomohon"],
    "73": ["Kabupaten Gowa", "Kabupaten Maros", "Kota Makassar", "Kota Palopo", "Kota Parepare"]
};

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
    const [isManualInput, setIsManualInput] = useState(false);
    const [customCityText, setCustomCityText] = useState('');

    // Fetch provinces from API on mount
    useEffect(() => {
        fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const formatted = data.map(p => ({
                        id: String(p.id),
                        name: toTitleCase(p.name)
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setProvinces(formatted);
                }
            })
            .catch(() => {
                // Fallback provinces are already set
            });
    }, []);

    // Sync state from parent value (e.g. "Kota Tangerang, Banten" or "Banten")
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
                } else {
                    setCustomCityText(cityName);
                    setIsManualInput(true);
                }
            } else if (parts.length === 1) {
                const foundProv = provinces.find(p => p.name.toLowerCase() === parts[0].toLowerCase());
                if (foundProv) {
                    setSelectedProvId(foundProv.id);
                    setSelectedProvName(foundProv.name);
                } else {
                    setCustomCityText(parts[0]);
                    setIsManualInput(true);
                }
            }
        }
    }, [value, provinces]);

    // Load cities whenever selectedProvId changes
    useEffect(() => {
        if (!selectedProvId) {
            setCities([]);
            return;
        }

        // Immediately set offline fallback cities if available
        const fallbackList = (FALLBACK_CITIES[selectedProvId] || []).map((name, idx) => ({
            id: `${selectedProvId}_${idx}`,
            name
        }));
        setCities(fallbackList);

        // Try API fetch asynchronously to get complete list
        fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const formatted = data.map(c => ({
                        id: String(c.id),
                        name: toTitleCase(c.name)
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setCities(formatted);
                }
            })
            .catch(() => {
                // Keep the fallback list already loaded
            });
    }, [selectedProvId]);

    const handleProvChange = (e) => {
        const provId = e.target.value;
        setSelectedProvId(provId);
        const provObj = provinces.find(p => p.id === provId);
        const provName = provObj ? provObj.name : '';
        setSelectedProvName(provName);
        setSelectedCityName('');
        setIsManualInput(false);
        setCustomCityText('');

        if (provName) {
            onChange(provName);
        } else {
            onChange('');
        }
    };

    const handleCityChange = (e) => {
        const val = e.target.value;
        if (val === '__MANUAL__') {
            setIsManualInput(true);
            setSelectedCityName('');
            return;
        }

        setIsManualInput(false);
        setSelectedCityName(val);

        if (val && selectedProvName) {
            onChange(`${val}, ${selectedProvName}`);
        } else if (val) {
            onChange(val);
        } else if (selectedProvName) {
            onChange(selectedProvName);
        } else {
            onChange('');
        }
    };

    const handleCustomCityChange = (e) => {
        const text = e.target.value;
        setCustomCityText(text);

        if (text && selectedProvName) {
            onChange(`${text}, ${selectedProvName}`);
        } else if (text) {
            onChange(text);
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
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required={required}
                    >
                        <option value="">-- Pilih Provinsi --</option>
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
                    {isManualInput ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customCityText}
                                onChange={handleCustomCityChange}
                                placeholder="Ketik nama Kota/Kab..."
                                className="w-full px-3 py-2 border border-blue-500 rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                                required={required}
                            />
                            <button
                                type="button"
                                onClick={() => setIsManualInput(false)}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 whitespace-nowrap"
                                title="Kembali ke Dropdown"
                            >
                                📋 List
                            </button>
                        </div>
                    ) : (
                        <select
                            value={selectedCityName}
                            onChange={handleCityChange}
                            disabled={!selectedProvId}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                            required={required}
                        >
                            <option value="">
                                {!selectedProvId ? '-- Pilih Provinsi Terlebih Dahulu --' : '-- Pilih Kota / Kabupaten --'}
                            </option>
                            {cities.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                            {selectedProvId && (
                                <option value="__MANUAL__">✏️ Lainnya... (Ketik Manual)</option>
                            )}
                        </select>
                    )}
                </div>
            </div>

            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );
}
