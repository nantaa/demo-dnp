import React, { useState, useEffect } from 'react';

// Official list of 38 Indonesian Provinces
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

// 100% Comprehensive dictionary of all 514 Kota & Kabupaten in Indonesia by Province ID
const FALLBACK_CITIES = {
    // 11 Aceh (23)
    "11": ["Kabupaten Aceh Barat", "Kabupaten Aceh Barat Daya", "Kabupaten Aceh Besar", "Kabupaten Aceh Jaya", "Kabupaten Aceh Selatan", "Kabupaten Aceh Singkil", "Kabupaten Aceh Tamiang", "Kabupaten Aceh Tengah", "Kabupaten Aceh Tenggara", "Kabupaten Aceh Timur", "Kabupaten Aceh Utara", "Kabupaten Bener Meriah", "Kabupaten Bireuen", "Kabupaten Gayo Lues", "Kabupaten Nagan Raya", "Kabupaten Pidie", "Kabupaten Pidie Jaya", "Kabupaten Simeulue", "Kota Banda Aceh", "Kota Langsa", "Kota Lhokseumawe", "Kota Sabang", "Kota Subulussalam"],
    
    // 12 Sumatera Utara (33)
    "12": ["Kabupaten Asahan", "Kabupaten Batu Bara", "Kabupaten Dairi", "Kabupaten Deli Serdang", "Kabupaten Humbang Hasundutan", "Kabupaten Karo", "Kabupaten Labuhanbatu", "Kabupaten Labuhanbatu Selatan", "Kabupaten Labuhanbatu Utara", "Kabupaten Langkat", "Kabupaten Mandailing Natal", "Kabupaten Nias", "Kabupaten Nias Barat", "Kabupaten Nias Selatan", "Kabupaten Nias Utara", "Kabupaten Padang Lawas", "Kabupaten Padang Lawas Utara", "Kabupaten Pakpak Bharat", "Kabupaten Samosir", "Kabupaten Serdang Bedagai", "Kabupaten Simalungun", "Kabupaten Tapanuli Selatan", "Kabupaten Tapanuli Tengah", "Kabupaten Tapanuli Utara", "Kabupaten Toba", "Kota Binjai", "Kota Gunungsitoli", "Kota Medan", "Kota Padangsidimpuan", "Kota Pematangsiantar", "Kota Sibolga", "Kota Tanjungbalai", "Kota Tebing Tinggi"],
    
    // 13 Sumatera Barat (19)
    "13": ["Kabupaten Agam", "Kabupaten Dharmasraya", "Kabupaten Kepulauan Mentawai", "Kabupaten Lima Puluh Kota", "Kabupaten Padang Pariaman", "Kabupaten Pasaman", "Kabupaten Pasaman Barat", "Kabupaten Pesisir Selatan", "Kabupaten Sijunjung", "Kabupaten Solok", "Kabupaten Solok Selatan", "Kabupaten Tanah Datar", "Kota Bukittinggi", "Kota Padang", "Kota Padang Panjang", "Kota Pariaman", "Kota Payakumbuh", "Kota Sawahlunto", "Kota Solok"],
    
    // 14 Riau (12)
    "14": ["Kabupaten Bengkalis", "Kabupaten Indragiri Hilir", "Kabupaten Indragiri Hulu", "Kabupaten Kampar", "Kabupaten Kepulauan Meranti", "Kabupaten Kuantan Singingi", "Kabupaten Pelalawan", "Kabupaten Rokan Hilir", "Kabupaten Rokan Hulu", "Kabupaten Siak", "Kota Dumai", "Kota Pekanbaru"],
    
    // 15 Jambi (11)
    "15": ["Kabupaten Batanghari", "Kabupaten Bungo", "Kabupaten Kerinci", "Kabupaten Merangin", "Kabupaten Muaro Jambi", "Kabupaten Sarolangun", "Kabupaten Tanjung Jabung Barat", "Kabupaten Tanjung Jabung Timur", "Kabupaten Tebo", "Kota Jambi", "Kota Sungai Penuh"],
    
    // 16 Sumatera Selatan (17)
    "16": ["Kabupaten Banyuasin", "Kabupaten Empat Lawang", "Kabupaten Lahat", "Kabupaten Muara Enim", "Kabupaten Musi Banyuasin", "Kabupaten Musi Rawas", "Kabupaten Musi Rawas Utara", "Kabupaten Ogan Ilir", "Kabupaten Ogan Komering Ilir", "Kabupaten Ogan Komering Ulu", "Kabupaten Ogan Komering Ulu Selatan", "Kabupaten Ogan Komering Ulu Timur", "Kabupaten Penukal Abab Lematang Ilir", "Kota Lubuklinggau", "Kota Pagar Alam", "Kota Palembang", "Kota Prabumulih"],
    
    // 17 Bengkulu (10)
    "17": ["Kabupaten Bengkulu Selatan", "Kabupaten Bengkulu Tengah", "Kabupaten Bengkulu Utara", "Kabupaten Kaur", "Kabupaten Kepahiang", "Kabupaten Lebong", "Kabupaten Mukomuko", "Kabupaten Rejang Lebong", "Kabupaten Seluma", "Kota Bengkulu"],
    
    // 18 Lampung (15)
    "18": ["Kabupaten Lampung Barat", "Kabupaten Lampung Selatan", "Kabupaten Lampung Tengah", "Kabupaten Lampung Timur", "Kabupaten Lampung Utara", "Kabupaten Mesuji", "Kabupaten Pesawaran", "Kabupaten Pesisir Barat", "Kabupaten Pringsewu", "Kabupaten Tanggamus", "Kabupaten Tulang Bawang", "Kabupaten Tulang Bawang Barat", "Kabupaten Way Kanan", "Kota Bandar Lampung", "Kota Metro"],
    
    // 19 Kepulauan Bangka Belitung (7)
    "19": ["Kabupaten Bangka", "Kabupaten Bangka Barat", "Kabupaten Bangka Selatan", "Kabupaten Bangka Tengah", "Kabupaten Belitung", "Kabupaten Belitung Timur", "Kota Pangkalpinang"],
    
    // 21 Kepulauan Riau (7)
    "21": ["Kabupaten Bintan", "Kabupaten Karimun", "Kabupaten Kepulauan Anambas", "Kabupaten Lingga", "Kabupaten Natuna", "Kota Batam", "Kota Tanjungpinang"],
    
    // 31 DKI Jakarta (6)
    "31": ["Kabupaten Administrasi Kepulauan Seribu", "Kota Administrasi Jakarta Barat", "Kota Administrasi Jakarta Pusat", "Kota Administrasi Jakarta Selatan", "Kota Administrasi Jakarta Timur", "Kota Administrasi Jakarta Utara"],
    
    // 32 Jawa Barat (27)
    "32": ["Kabupaten Bandung", "Kabupaten Bandung Barat", "Kabupaten Bekasi", "Kabupaten Bogor", "Kabupaten Ciamis", "Kabupaten Cianjur", "Kabupaten Cirebon", "Kabupaten Garut", "Kabupaten Indramayu", "Kabupaten Karawang", "Kabupaten Kuningan", "Kabupaten Majalengka", "Kabupaten Pangandaran", "Kabupaten Purwakarta", "Kabupaten Subang", "Kabupaten Sukabumi", "Kabupaten Sumedang", "Kabupaten Tasikmalaya", "Kota Bandung", "Kota Banjar", "Kota Bekasi", "Kota Bogor", "Kota Cimahi", "Kota Cirebon", "Kota Depok", "Kota Sukabumi", "Kota Tasikmalaya"],
    
    // 33 Jawa Tengah (35)
    "33": ["Kabupaten Banjarnegara", "Kabupaten Banyumas", "Kabupaten Batang", "Kabupaten Blora", "Kabupaten Boyolali", "Kabupaten Brebes", "Kabupaten Cilacap", "Kabupaten Demak", "Kabupaten Grobogan", "Kabupaten Jepara", "Kabupaten Karanganyar", "Kabupaten Kebumen", "Kabupaten Kendal", "Kabupaten Klaten", "Kabupaten Kudus", "Kabupaten Magelang", "Kabupaten Pati", "Kabupaten Pekalongan", "Kabupaten Pemalang", "Kabupaten Purbalingga", "Kabupaten Purworejo", "Kabupaten Rembang", "Kabupaten Semarang", "Kabupaten Sragen", "Kabupaten Sukoharjo", "Kabupaten Tegal", "Kabupaten Temanggung", "Kabupaten Wonogiri", "Kabupaten Wonosobo", "Kota Magelang", "Kota Pekalongan", "Kota Salatiga", "Kota Semarang", "Kota Surakarta", "Kota Tegal"],
    
    // 34 DI Yogyakarta (5)
    "34": ["Kabupaten Bantul", "Kabupaten Gunungkidul", "Kabupaten Kulon Progo", "Kabupaten Sleman", "Kota Yogyakarta"],
    
    // 35 Jawa Timur (38)
    "35": ["Kabupaten Bangkalan", "Kabupaten Banyuwangi", "Kabupaten Blitar", "Kabupaten Bojonegoro", "Kabupaten Bondowoso", "Kabupaten Gresik", "Kabupaten Jember", "Kabupaten Jombang", "Kabupaten Kediri", "Kabupaten Lamongan", "Kabupaten Lumajang", "Kabupaten Madiun", "Kabupaten Magetan", "Kabupaten Malang", "Kabupaten Mojokerto", "Kabupaten Nganjuk", "Kabupaten Ngawi", "Kabupaten Pacitan", "Kabupaten Pamekasan", "Kabupaten Pasuruan", "Kabupaten Ponorogo", "Kabupaten Probolinggo", "Kabupaten Sampang", "Kabupaten Sidoarjo", "Kabupaten Situbondo", "Kabupaten Sumenep", "Kabupaten Trenggalek", "Kabupaten Tuban", "Kabupaten Tulungagung", "Kota Batu", "Kota Blitar", "Kota Kediri", "Kota Madiun", "Kota Malang", "Kota Mojokerto", "Kota Pasuruan", "Kota Probolinggo", "Kota Surabaya"],
    
    // 36 Banten (8)
    "36": ["Kabupaten Lebak", "Kabupaten Pandeglang", "Kabupaten Serang", "Kabupaten Tangerang", "Kota Cilegon", "Kota Serang", "Kota Tangerang", "Kota Tangerang Selatan"],
    
    // 51 Bali (9)
    "51": ["Kabupaten Badung", "Kabupaten Bangli", "Kabupaten Buleleng", "Kabupaten Gianyar", "Kabupaten Jembrana", "Kabupaten Karangasem", "Kabupaten Klungkung", "Kabupaten Tabanan", "Kota Denpasar"],
    
    // 52 Nusa Tenggara Barat (10)
    "52": ["Kabupaten Bima", "Kabupaten Dompu", "Kabupaten Lombok Barat", "Kabupaten Lombok Tengah", "Kabupaten Lombok Timur", "Kabupaten Lombok Utara", "Kabupaten Sumbawa", "Kabupaten Sumbawa Barat", "Kota Bima", "Kota Mataram"],
    
    // 53 Nusa Tenggara Timur (22)
    "53": ["Kabupaten Alor", "Kabupaten Belu", "Kabupaten Ende", "Kabupaten Flores Timur", "Kabupaten Kupang", "Kabupaten Lembata", "Kabupaten Malaka", "Kabupaten Manggarai", "Kabupaten Manggarai Barat", "Kabupaten Manggarai Timur", "Kabupaten Nagekeo", "Kabupaten Ngada", "Kabupaten Rote Ndao", "Kabupaten Sabu Raijua", "Kabupaten Sikka", "Kabupaten Sumba Barat", "Kabupaten Sumba Barat Daya", "Kabupaten Sumba Tengah", "Kabupaten Sumba Timur", "Kabupaten Timor Tengah Selatan", "Kabupaten Timor Tengah Utara", "Kota Kupang"],
    
    // 61 Kalimantan Barat (14)
    "61": ["Kabupaten Bengkayang", "Kabupaten Kapuas Hulu", "Kabupaten Kayong Utara", "Kabupaten Ketapang", "Kabupaten Kubu Raya", "Kabupaten Landak", "Kabupaten Melawi", "Kabupaten Mempawah", "Kabupaten Sambas", "Kabupaten Sanggau", "Kabupaten Sekadau", "Kabupaten Sintang", "Kota Pontianak", "Kota Singkawang"],
    
    // 62 Kalimantan Tengah (14)
    "62": ["Kabupaten Barito Selatan", "Kabupaten Barito Timur", "Kabupaten Barito Utara", "Kabupaten Gunung Mas", "Kabupaten Kapuas", "Kabupaten Katingan", "Kabupaten Kotawaringin Barat", "Kabupaten Kotawaringin Timur", "Kabupaten Lamandau", "Kabupaten Murung Raya", "Kabupaten Pulang Pisau", "Kabupaten Sukamara", "Kabupaten Seruyan", "Kota Palangka Raya"],
    
    // 63 Kalimantan Selatan (13)
    "63": ["Kabupaten Balangan", "Kabupaten Banjar", "Kabupaten Barito Kuala", "Kabupaten Hulu Sungai Selatan", "Kabupaten Hulu Sungai Tengah", "Kabupaten Hulu Sungai Utara", "Kabupaten Kotabaru", "Kabupaten Tabalong", "Kabupaten Tanah Bumbu", "Kabupaten Tanah Laut", "Kabupaten Tapin", "Kota Banjarbaru", "Kota Banjarmasin"],
    
    // 64 Kalimantan Timur (10)
    "64": ["Kabupaten Berau", "Kabupaten Kutai Barat", "Kabupaten Kutai Kartanegara", "Kabupaten Kutai Timur", "Kabupaten Mahakam Ulu", "Kabupaten Paser", "Kabupaten Penajam Paser Utara", "Kota Balikpapan", "Kota Bontang", "Kota Samarinda"],
    
    // 65 Kalimantan Utara (5)
    "65": ["Kabupaten Bulungan", "Kabupaten Malinau", "Kabupaten Nunukan", "Kabupaten Tana Tidung", "Kota Tarakan"],
    
    // 71 Sulawesi Utara (15)
    "71": ["Kabupaten Bolaang Mongondow", "Kabupaten Bolaang Mongondow Selatan", "Kabupaten Bolaang Mongondow Timur", "Kabupaten Bolaang Mongondow Utara", "Kabupaten Kepulauan Sangihe", "Kabupaten Kepulauan Siau Tagulandang Biaro", "Kabupaten Kepulauan Talaud", "Kabupaten Minahasa", "Kabupaten Minahasa Selatan", "Kabupaten Minahasa Tenggara", "Kabupaten Minahasa Utara", "Kota Bitung", "Kota Kotamobagu", "Kota Manado", "Kota Tomohon"],
    
    // 72 Sulawesi Tengah (13)
    "72": ["Kabupaten Banggai", "Kabupaten Banggai Kepulauan", "Kabupaten Banggai Laut", "Kabupaten Buol", "Kabupaten Donggala", "Kabupaten Morowali", "Kabupaten Morowali Utara", "Kabupaten Parigi Moutong", "Kabupaten Poso", "Kabupaten Sigi", "Kabupaten Tojo Una-Una", "Kabupaten Tolitoli", "Kota Palu"],
    
    // 73 Sulawesi Selatan (24)
    "73": ["Kabupaten Bantaeng", "Kabupaten Barru", "Kabupaten Bone", "Kabupaten Bulukumba", "Kabupaten Enrekang", "Kabupaten Gowa", "Kabupaten Jeneponto", "Kabupaten Kepulauan Selayar", "Kabupaten Luwu", "Kabupaten Luwu Timur", "Kabupaten Luwu Utara", "Kabupaten Maros", "Kabupaten Pangkajene dan Kepulauan", "Kabupaten Pinrang", "Kabupaten Sidenreng Rappang", "Kabupaten Sinjai", "Kabupaten Soppeng", "Kabupaten Takalar", "Kabupaten Tana Toraja", "Kabupaten Toraja Utara", "Kabupaten Wajo", "Kota Makassar", "Kota Palopo", "Kota Parepare"],
    
    // 74 Sulawesi Tenggara (17)
    "74": ["Kabupaten Bombana", "Kabupaten Buton", "Kabupaten Buton Selatan", "Kabupaten Buton Tengah", "Kabupaten Buton Utara", "Kabupaten Kolaka", "Kabupaten Kolaka Timur", "Kabupaten Kolaka Utara", "Kabupaten Konawe", "Kabupaten Konawe Kepulauan", "Kabupaten Konawe Selatan", "Kabupaten Konawe Utara", "Kabupaten Muna", "Kabupaten Muna Barat", "Kabupaten Wakatobi", "Kota Baubau", "Kota Kendari"],
    
    // 75 Gorontalo (6)
    "75": ["Kabupaten Boalemo", "Kabupaten Bone Bolango", "Kabupaten Gorontalo", "Kabupaten Gorontalo Utara", "Kabupaten Pohuwato", "Kota Gorontalo"],
    
    // 76 Sulawesi Barat (6)
    "76": ["Kabupaten Majene", "Kabupaten Mamasa", "Kabupaten Mamuju", "Kabupaten Mamuju Tengah", "Kabupaten Pasangkayu", "Kabupaten Polewali Mandar"],
    
    // 81 Maluku (11)
    "81": ["Kabupaten Buru", "Kabupaten Buru Selatan", "Kabupaten Kepulauan Aru", "Kabupaten Kepulauan Tanimbar", "Kabupaten Maluku Barat Daya", "Kabupaten Maluku Tengah", "Kabupaten Maluku Tenggara", "Kabupaten Seram Bagian Barat", "Kabupaten Seram Bagian Timur", "Kota Ambon", "Kota Tual"],
    
    // 82 Maluku Utara (10)
    "82": ["Kabupaten Halmahera Barat", "Kabupaten Halmahera Tengah", "Kabupaten Halmahera Timur", "Kabupaten Halmahera Selatan", "Kabupaten Halmahera Utara", "Kabupaten Kepulauan Sula", "Kabupaten Pulau Morotai", "Kabupaten Pulau Taliabu", "Kota Ternate", "Kota Tidore Kepulauan"],
    
    // 91 Papua Barat (7)
    "91": ["Kabupaten Fakfak", "Kabupaten Kaimana", "Kabupaten Manokwari", "Kabupaten Manokwari Selatan", "Kabupaten Pegunungan Arfak", "Kabupaten Teluk Bintuni", "Kabupaten Teluk Wondama"],
    
    // 92 Papua (9)
    "92": ["Kabupaten Biak Numfor", "Kabupaten Jayapura", "Kabupaten Keerom", "Kabupaten Kepulauan Yapen", "Kabupaten Mamberamo Raya", "Kabupaten Sarmi", "Kabupaten Supiori", "Kabupaten Waropen", "Kota Jayapura"],
    
    // 93 Papua Selatan (4)
    "93": ["Kabupaten Asmat", "Kabupaten Boven Digoel", "Kabupaten Mappi", "Kabupaten Merauke"],
    
    // 94 Papua Tengah (8)
    "94": ["Kabupaten Deiyai", "Kabupaten Dogiyai", "Kabupaten Intan Jaya", "Kabupaten Mimika", "Kabupaten Nabire", "Kabupaten Paniai", "Kabupaten Puncak", "Kabupaten Puncak Jaya"],
    
    // 95 Papua Pegunungan (8)
    "95": ["Kabupaten Jayawijaya", "Kabupaten Lanny Jaya", "Kabupaten Mamberamo Tengah", "Kabupaten Nduga", "Kabupaten Pegunungan Bintang", "Kabupaten Yalimo", "Kabupaten Yahukimo", "Kabupaten Tolikara"],
    
    // 96 Papua Barat Daya (6)
    "96": ["Kabupaten Maybrat", "Kabupaten Raja Ampat", "Kabupaten Sorong", "Kabupaten Sorong Selatan", "Kabupaten Tambrauw", "Kota Sorong"]
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

        // Try API fetch asynchronously to get complete list if available online
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
