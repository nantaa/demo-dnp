import db from '../server/db.js';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  baseURL: 'https://monitor-dnp.deltaindo.co.id',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
  timeout: 30000,
  maxRedirects: 5,
}));

async function scrapeProduction() {
  console.log('--- 1. Fetching login page & CSRF token ---');
  const loginPageRes = await client.get('/login');
  const html = loginPageRes.data;
  
  // Extract CSRF token from meta or input or Inertia page data
  let csrfToken = '';
  const tokenMatch = html.match(/name="_token" value="([^"]+)"/) ||
                     html.match(/name="csrf-token" content="([^"]+)"/) ||
                     html.match(/"csrfToken":"([^"]+)"/);
  if (tokenMatch) {
    csrfToken = tokenMatch[1];
  } else {
    // Try inertia page data-page
    const dataPageMatch = html.match(/data-page="([^"]+)"/);
    if (dataPageMatch) {
      try {
        const decoded = JSON.parse(dataPageMatch[1].replace(/&quot;/g, '"'));
        csrfToken = decoded.props?.csrf_token || decoded.csrfToken || '';
      } catch (e) {}
    }
  }

  // Also check cookies for XSRF-TOKEN
  const cookies = await jar.getCookies('https://monitor-dnp.deltaindo.co.id');
  const xsrfCookie = cookies.find(c => c.key === 'XSRF-TOKEN');
  const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : csrfToken;

  console.log('CSRF Token found:', csrfToken ? 'Yes' : 'No', 'XSRF Cookie:', xsrfToken ? 'Yes' : 'No');

  console.log('--- 2. Authenticating as superadmin@deltaindo.co.id ---');
  const loginRes = await client.post('/login', {
    _token: csrfToken,
    email: 'superadmin@deltaindo.co.id',
    password: 'password123',
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-XSRF-TOKEN': xsrfToken,
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });
  console.log('Login response status:', loginRes.status);

  const inertiaHeaders = {
    'X-Inertia': 'true',
    'X-Inertia-Version': '1.0',
    'Accept': 'text/html, application/xhtml+xml',
  };

  console.log('--- 3. Fetching /api/master-data ---');
  let masterData = { alat_uji: [], sertifikat_pjk3: [] };
  try {
    const mdRes = await client.get('/api/master-data');
    if (mdRes.data) {
      masterData = mdRes.data;
      console.log(`Retrieved master data: ${masterData.alat_uji?.length || 0} alat uji, ${masterData.sertifikat_pjk3?.length || 0} sertifikat.`);
    }
  } catch (e) {
    console.warn('api/master-data warning:', e.message);
  }

  console.log('--- 4. Fetching /inventory (Equipment, Inspectors, Certificates) ---');
  let inventoryData = null;
  try {
    const invRes = await client.get('/inventory', { headers: inertiaHeaders });
    if (invRes.data && invRes.data.props) {
      inventoryData = invRes.data.props;
      console.log('Retrieved inventory props keys:', Object.keys(inventoryData));
    }
  } catch (e) {
    console.warn('inventory fetch warning:', e.message);
  }

  console.log('--- 5. Fetching /users ---');
  let usersList = [];
  try {
    const usersRes = await client.get('/users', { headers: inertiaHeaders });
    if (usersRes.data && usersRes.data.props) {
      usersList = usersRes.data.props.users || [];
      console.log(`Retrieved ${usersList.length} users from production.`);
    }
  } catch (e) {
    console.warn('users fetch warning:', e.message);
  }

  console.log('--- 6. Fetching /kanban (All Production Jobs) ---');
  let jobsList = [];
  try {
    const kanbanRes = await client.get('/kanban', { headers: inertiaHeaders });
    if (kanbanRes.data && kanbanRes.data.props) {
      jobsList = kanbanRes.data.props.jobs || [];
      console.log(`Retrieved ${jobsList.length} jobs from production.`);
    }
  } catch (e) {
    console.warn('kanban fetch warning:', e.message);
  }

  console.log('--- 7. Ingesting into local SQLite database ---');
  // Store master data in app_state
  if (masterData.alat_uji?.length || inventoryData?.alatUji?.length) {
    const finalAlatUji = masterData.alat_uji?.length ? masterData.alat_uji : inventoryData?.alatUji || [];
    const finalCerts = masterData.sertifikat_pjk3?.length ? masterData.sertifikat_pjk3 : inventoryData?.sertifikatPjk3 || [];
    
    db.prepare("INSERT INTO app_state (key, value) VALUES ('master:data', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(JSON.stringify({
        alat_uji: finalAlatUji,
        sertifikat_pjk3: finalCerts,
        regulasi: inventoryData?.regulasiK3 || [],
        form_disnaker: inventoryData?.formDisnaker || [],
      }));
    console.log(`✓ Stored ${finalAlatUji.length} alat uji and ${finalCerts.length} certificates in app_state.`);
  }

  // Store users & inspectors
  if (usersList.length > 0 || inventoryData?.inspectors?.length) {
    const inspectors = inventoryData?.inspectors || usersList.filter(u => u.role === 'inspektur' || u.inspector_profile || u.inspectorProfile);
    db.prepare("INSERT INTO app_state (key, value) VALUES ('app:users', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(JSON.stringify(usersList));
    db.prepare("INSERT INTO app_state (key, value) VALUES ('app:inspectors', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(JSON.stringify(inspectors));
    console.log(`✓ Stored ${usersList.length} users and ${inspectors.length} inspector profiles in app_state.`);
  }

  // Store jobs
  if (jobsList.length > 0) {
    const insert = db.prepare('INSERT INTO jobs (id, data, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at');
    const ts = new Date().toISOString();
    const insertMany = db.transaction((list) => {
      for (const j of list) {
        insert.run(j.id, JSON.stringify(j), j.created_at || ts, j.updated_at || ts);
      }
    });
    insertMany(jobsList);
    console.log(`✓ Upserted ${jobsList.length} production jobs into jobs table.`);
  }

  console.log('=== SCRAPE AND INGESTION COMPLETED SUCCESSFULLY ===');
}

scrapeProduction().catch(err => {
  console.error('Fatal scraping error:', err);
  process.exit(1);
});
