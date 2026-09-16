
const API = '/api/am';
const APIKEY = '';
const TELEGRAM_TOKEN = '';
const TELEGRAM_CHAT_ID = '';
const TIKWM = 'https://tikwm.com/api/';

async function postAPI(action, data = {}) {
    const token = localStorage.getItem('daapv_session') || '';
    const response = await fetch(API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: JSON.stringify({ action, ...data })
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
        throw new Error(json.message || 'Server error: ' + response.status);
    }
    return json;
}

let currentEmail = '';
let currentUsername = '';
let userIP = 'Tidak diketahui';
let ttMode = 'auto';
let encMethod = 'base64enc';
let qrInstance = null;
let _toastTimeout = null;

const STATE = {
    username: 'User',
    uid: 'DAAPV-2026-001',
    expiredDate: '2025-12-31',
    bgIndex: 0,
    bgPath: '',
    isBgFromGallery: false,
    defaultBgPaths: [
        'https://files.catbox.moe/4sllfm.jpeg',
        'https://files.catbox.moe/wmojlt.jpeg',
        'https://files.catbox.moe/m8h9ni.png',
        'https://files.catbox.moe/0fu9j3.png',
    ],
    btcPrices: [],
    btcPrice: 118240.34,
    btcHigh: 118240.34,
    btcLow: 118240.34,
    btcVolume: 42000,
    btcFunding: 0.010,
    isPriceUp: true,
    btcChange: '+0.00',
    theme: 'light',
};

async function sendTelegram(text) { return null; }
async function notifyLogin(username) { return null; }
async function notifyAMSuccess(username, email, code) { return null; }
async function notifyToolUsage(toolName, extraInfo = '') {
    const username = currentUsername || 'Guest';
    let msg = `🛠️ <b>${toolName} Digunakan</b>\n👤 Username: <code>${username}</code>\n🕐 Waktu: ${getTimeString()}\n📱 IP: ${userIP}`;
    if (extraInfo) msg += `\n📝 Info: ${extraInfo}`;
    await sendTelegram(msg);
}
function getTimeString() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min} WIB`;
}
async function getIP() {
    try { const res = await fetch('https://api.ipify.org?format=json'); const data = await res.json(); return data.ip || 'Tidak diketahui'; }
    catch { return 'Tidak diketahui'; }
}
getIP().then(ip => { userIP = ip; });

function initDashboard() {
    loadSavedTheme();
    document.getElementById('uidValue').textContent = STATE.uid;
    renderNews();
    initBTC();
    renderBgThumbnails();
    initGetCodeTool();
    goToStep(1);
    loadUsername();
    initiPhoneQuote();
    initTelegramSpam();
    initBannerCarousel();
    initQuickActions();
    initSystemCard();
    initDevMessage();
    updateStatsFromAPI();

    if (typeof Story !== 'undefined' && Story.init && !Story._initialized) {
        Story._initialized = true;
        try { Story.init(); } catch (e) { console.warn('Story init error:', e); }
    }

    let online = 142;
    setInterval(() => {
        online += Math.round((Math.random() - 0.5) * 4);
        online = Math.max(20, online);
        const el = document.getElementById('statOnlineUsers');
        if (el) el.textContent = online;
        const rowEl = document.getElementById('rowOnline');
        if (rowEl) rowEl.textContent = online + ' aktif';
    }, 5000);

    let conns = 89;
    setInterval(() => {
        conns += Math.round((Math.random() - 0.5) * 3);
        conns = Math.max(10, conns);
        const el = document.getElementById('statActiveConns');
        if (el) el.textContent = conns;
        const rowEl = document.getElementById('rowConns');
        if (rowEl) rowEl.textContent = conns + ' active';
    }, 6000);

    setInterval(rotateAI, 4000);
    window.addEventListener('resize', () => { try { drawBTC(); } catch(e){} });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    });
    console.log('🚀 DAAPV Dashboard loaded!');
}

function loadUsername() {
    const saved = localStorage.getItem('daapv_username') || localStorage.getItem('4vell_username');
    if (saved) {
        currentUsername = saved;
        STATE.username = saved;
        const topUser = document.getElementById('topUsername');
        if (topUser) topUser.textContent = saved;
        const profileName = document.getElementById('profileName');
        if (profileName) profileName.textContent = saved;
        const devMsgUser = document.getElementById('devMsgUser');
        if (devMsgUser) devMsgUser.textContent = saved;
    }
    const statExpired = document.getElementById('statExpired');
    if (statExpired) statExpired.textContent = STATE.expiredDate;
}

async function updateStatsFromAPI() {
    try {
        const data = await postAPI('stats');
        if (data.success && data.onlineUsers) {
            document.getElementById('statOnlineUsers').textContent = data.onlineUsers;
            document.getElementById('rowOnline').textContent = data.onlineUsers + ' aktif';
        }
    } catch(e) {}
}

function initBannerCarousel() {
    const slides = document.querySelectorAll('#bannerCarousel .banner-slide');
    const dots = document.querySelectorAll('#bannerDots .dot');
    if (!slides.length) return;
    let idx = 0, total = slides.length;
    function go(i) {
        idx = (i + total) % total;
        slides.forEach((s, k) => s.classList.toggle('active', k === idx));
        dots.forEach((d, k) => d.classList.toggle('active', k === idx));
    }
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    setInterval(() => go(idx + 1), 5000);
}

function initQuickActions() {
    const actions = [
        { title: 'Generator', sub: 'Buat akun Alight Motion Premium', icon: 'fa-wrench', page: 'generator', bg: 'linear-gradient(135deg,#7C3AED,#2C0845)' },
        { title: 'Chat Room', sub: 'Global chat room', icon: 'fa-comment-dots', page: null, bg: 'linear-gradient(135deg,#A78BFA,#4C1D95)' },
        { title: 'Join Channel', sub: 'Info Channel DAAPV', icon: 'fa-telegram', page: null, link: 'https://t.me/daapv', bg: 'linear-gradient(135deg,#E62429,#7C3AED)' },
        { title: 'Tools Center', sub: '26 Tools siap pakai', icon: 'fa-toolbox', page: 'tools', bg: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
        { title: 'BTC Chart', sub: 'Real-time BTC/USDT', icon: 'fa-bitcoin-sign', page: null, bg: 'linear-gradient(135deg,#FBBF24,#7C3AED)' },
        { title: 'Rules', sub: 'Peraturan & Sanksi', icon: 'fa-gavel', page: 'rules', bg: 'linear-gradient(135deg,#22D3EE,#7C3AED)' },
    ];
    const wrap = document.getElementById('quickScroll');
    const dots = document.getElementById('quickDots');
    if (!wrap) return;
    wrap.innerHTML = ''; dots.innerHTML = '';
    actions.forEach((a, i) => {
        const el = document.createElement('div');
        el.className = 'quick-card';
        el.style.background = a.bg;
        el.innerHTML = `
            <i class="fas ${a.icon} bg-icon"></i>
            <div class="q-icon"><i class="fas ${a.icon}"></i></div>
            <div class="tap-btn">Tap →</div>
            <div class="q-title">${a.title}</div>
            <div class="q-sub">${a.sub}</div>
        `;
        el.addEventListener('click', () => {
            if (a.page) switchPage(a.page);
            else if (a.link) window.open(a.link, '_blank');
            else showToast('Fitur "' + a.title + '" segera hadir', '#A78BFA');
        });
        wrap.appendChild(el);
        const d = document.createElement('span');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => wrap.scrollTo({ left: i * wrap.clientWidth * 0.82, behavior: 'smooth' }));
        dots.appendChild(d);
    });
    wrap.addEventListener('scroll', () => {
        const i = Math.round(wrap.scrollLeft / (wrap.clientWidth * 0.82));
        dots.querySelectorAll('.dot').forEach((el, k) => el.classList.toggle('active', k === Math.min(i, actions.length - 1)));
    });
}

function initSystemCard() {
    const ua = navigator.userAgent;
    let device = 'Web Browser';
    if (/Android/i.test(ua)) device = 'Android Device';
    else if (/iPhone|iPad|iPod/i.test(ua)) device = 'Apple iOS';
    else if (/Windows/i.test(ua)) device = 'Windows PC';
    else if (/Mac/i.test(ua)) device = 'Mac OS';
    else if (/Linux/i.test(ua)) device = 'Linux';
    const deviceText = document.getElementById('deviceText');
    if (deviceText) deviceText.textContent = device + ' · ' + (navigator.platform || 'Web');

    if (navigator.getBattery) {
        navigator.getBattery().then(b => {
            const update = () => {
                const pct = Math.round(b.level * 100);
                const bv = document.getElementById('batteryValue');
                if (bv) bv.textContent = pct + '%';
                const ring = document.getElementById('ringBattery');
                if (ring) ring.setAttribute('stroke-dasharray', pct + ' 100');
            };
            update();
            b.addEventListener('levelchange', update);
        }).catch(() => {});
    } else {
        const bv = document.getElementById('batteryValue');
        if (bv) bv.textContent = '85%';
    }

    if (navigator.connection) {
        const conn = navigator.connection;
        const down = conn.downlink ? Math.min(100, conn.downlink * 10) : 85;
        const sv = document.getElementById('signalValue');
        if (sv) sv.textContent = Math.round(down) + '%';
        const ring = document.getElementById('ringSignal');
        if (ring) ring.setAttribute('stroke-dasharray', down + ' 100');
    } else {
        const sv = document.getElementById('signalValue');
        if (sv) sv.textContent = '85%';
    }

    const ram = navigator.deviceMemory || 4;
    const rv = document.getElementById('ramValue');
    if (rv) rv.textContent = ram + 'GB';

    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(est => {
            const used = Math.round((est.usage / est.quota) * 100);
            const sve = document.getElementById('storageValue');
            if (sve) sve.textContent = used + '%';
        }).catch(() => {});
    } else {
        const sve = document.getElementById('storageValue');
        if (sve) sve.textContent = '50%';
    }

    const start = Date.now();
    setInterval(() => {
        const s = Math.floor((Date.now() - start) / 1000);
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const sec = String(s % 60).padStart(2, '0');
        const el = document.getElementById('rowSession');
        if (el) el.textContent = `${h}:${m}:${sec}`;
    }, 1000);
}

function initDevMessage() {
    const btn = document.getElementById('closeDevMsg');
    if (btn) btn.addEventListener('click', () => {
        const card = document.getElementById('devMessageCard');
        if (card) card.style.display = 'none';
    });
}

function showToast(msg, color = '#00E676') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const toastMsg = document.getElementById('toastMsg');
    if (toastMsg) toastMsg.textContent = msg;
    toast.style.borderColor = color + '44';
    const icon = toast.querySelector('i');
    if (icon) icon.style.color = color;
    toast.classList.add('show');
    clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}
function showNotification(message, icon = 'fa-circle-check') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) document.body.removeChild(notification); }, 2500);
}

function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('show'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('show'); }
function showInfoDialog() { openModal('infoModal'); }

function openQRIS() { const el = document.getElementById('qrisModal'); if (el) el.classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeQRIS(e) {
    if (e && e.target !== e.currentTarget) return;
    const el = document.getElementById('qrisModal');
    if (el) el.classList.remove('show');
    document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeQRIS(); });

function switchPage(page) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    const toolMap = {
        'encryption': 'toolEncryption', 'getcode': 'toolGetCode', 'qrgenerator': 'toolQRGenerator',
        'capcut': 'toolCapCut', 'iphonequote': 'tooliPhoneQuote', 'spamtelegram': 'toolSpamTelegram'
    };
    if (toolMap[page]) {
        const target = document.getElementById(toolMap[page]);
        if (target) target.classList.add('active');
        document.getElementById('pageTools').classList.add('active');
    } else {
        const pageMap = { 'dashboard': 'pageDashboard', 'generator': 'pageGenerator', 'tools': 'pageTools', 'rules': 'pageRules' };
        const targetId = pageMap[page];
        if (targetId) { const target = document.getElementById(targetId); if (target) target.classList.add('active'); }
    }
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.page === 'page' + page.charAt(0).toUpperCase() + page.slice(1)) el.classList.add('active');
    });
    if (toolMap[page]) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
            if (el.dataset.page === 'pageTools') el.classList.add('active');
        });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showToolPage(tool) {
    const toolNames = { 'encryption': 'Encryption Tools', 'getcode': 'Get Code Tool', 'qrgenerator': 'QR Generator', 'capcut': 'CapCut Search', 'iphonequote': 'iPhone Quote Generator', 'spamtelegram': 'Spam Telegram' };
    notifyToolUsage(toolNames[tool] || tool);
    switchPage(tool);
}

function switchFeature(feat) {
    document.querySelectorAll('.feature-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.feature-panel').forEach(p => p.classList.remove('active'));
    if (feat === 'am') {
        document.getElementById('tabAM').classList.add('active');
        document.getElementById('panelAM').classList.add('active');
    } else {
        document.getElementById('tabTT').classList.add('active');
        document.getElementById('panelTT').classList.add('active');
    }
}

function goToStep(n) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('step' + n);
    if (target) target.classList.add('active');
    const dots = document.querySelectorAll('#progress span');
    dots.forEach((d, i) => {
        d.classList.remove('active', 'done');
        if (i + 1 < n) d.classList.add('done');
        if (i + 1 === n) d.classList.add('active');
    });
    const step2Btn = document.getElementById('goToStep2Btn');
    if (step2Btn) step2Btn.style.display = (n === 1) ? 'none' : 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showAlert(id, type, msg) {
    const el = document.getElementById(id);
    if (el) { el.className = 'alert show alert-' + type; el.innerHTML = msg; }
}
function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) { el.className = 'alert'; el.innerHTML = ''; }
}
function setLoading(btnId, loading, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:24px;height:24px;"></div> ' + (text || 'Processing...'); }
    else { btn.disabled = false; btn.innerHTML = text; }
}

let currentOrderId = '';

async function getPaymentStatus(email) {
    const token = localStorage.getItem('daapv_session') || '';
    const res = await fetch('/api/payment?email=' + encodeURIComponent(email), {
        headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal mengambil status pembayaran.');
    return data;
}

function showPaymentModal(data) {
    let modal = document.getElementById('daapvPaymentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'daapvPaymentModal';
        modal.innerHTML = `
        <div class="daapv-pay-backdrop"></div>
        <div class="daapv-pay-card">
          <button class="daapv-pay-close" onclick="closeDaapvPayment()">×</button>
          <h2>💳 Pembayaran Daapv</h2>
          <p class="daapv-pay-status" id="daapvPayStatus"></p>
          <img id="daapvQris" class="daapv-qris" alt="QRIS All Payment">
          <p class="daapv-pay-order" id="daapvPayOrder"></p>
          <div class="daapv-pay-actions">
            <button onclick="submitDaapvPayment()">Saya Sudah Bayar</button>
            <button class="secondary" onclick="refreshDaapvPayment()">Cek Status</button>
          </div>
          <small>Setelah pembayaran, tunggu Owner menyetujui order. Verifikasi email akan dibuka setelah disetujui.</small>
        </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    document.getElementById('daapvQris').src = data.qrisImageUrl;
    document.getElementById('daapvPayOrder').textContent = 'Order: ' + data.order.id + ' • Rp' + Number(data.order.amount || 0).toLocaleString('id-ID');
    document.getElementById('daapvPayStatus').textContent = data.order.status === 'PAYMENT_APPROVED'
      ? '✅ Pembayaran disetujui Owner.'
      : '⏳ Status: ' + data.order.status;
    currentOrderId = data.order.id;
}
function closeDaapvPayment() {
    const m = document.getElementById('daapvPaymentModal');
    if (m) m.style.display = 'none';
}
async function submitDaapvPayment() {
    if (!currentOrderId) return;
    try {
        const token = localStorage.getItem('daapv_session') || '';
        const res = await fetch('/api/payment', {
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
            body:JSON.stringify({orderId:currentOrderId})
        });
        const data=await res.json();
        if(!res.ok) throw new Error(data.message || 'Gagal.');
        showToast('✅ Pembayaran dikirim ke Owner untuk dicek.', '#25D366');
        await refreshDaapvPayment();
    } catch(e) { showToast('❌ '+e.message, '#E62429'); }
}
async function refreshDaapvPayment() {
    if (!currentEmail) return;
    try {
        const data=await getPaymentStatus(currentEmail);
        showPaymentModal(data);
        if(data.order.status==='PAYMENT_APPROVED') showToast('✅ Pembayaran sudah disetujui. Silakan kirim verifikasi email.', '#25D366');
    } catch(e) { showToast('❌ '+e.message, '#E62429'); }
}
async function ensurePaymentApproved(email) {
    const data = await getPaymentStatus(email);
    currentOrderId = data.order.id;
    if (data.order.status !== 'PAYMENT_APPROVED') {
        showPaymentModal(data);
        return false;
    }
    closeDaapvPayment();
    return true;
}

async function sendMagicLink() {
    const email = document.getElementById('email').value.trim();
    hideAlert('alert1');
    if (!email || !email.includes('@') || !email.includes('.')) {
        showAlert('alert1', 'error', '<i class="fas fa-exclamation-circle"></i> Format email tidak valid.');
        return;
    }
    setLoading('btnSend', true, 'Mengirim...');
    try {
        const paid = await ensurePaymentApproved(email);
        if (!paid) { setLoading('btnSend', false, '<i class="fas fa-paper-plane"></i> Send Link'); return; }
        const data = await postAPI('send-magiclink', { email: email, orderId: currentOrderId });
        if (data.success) {
            currentEmail = email;
            document.getElementById('sentEmail').textContent = email;
            showNotification('✅ Magic link terkirim! Cek email', 'fa-paper-plane');
            goToStep(2);
        } else {
            showAlert('alert1', 'error', '<i class="fas fa-exclamation-circle"></i> ' + (data.message || 'Gagal mengirim.'));
        }
    } catch (err) {
        showAlert('alert1', 'error', '<i class="fas fa-exclamation-circle"></i> ' + (err.message || 'Koneksi gagal.'));
    } finally {
        setLoading('btnSend', false, '<i class="fas fa-paper-plane"></i> Send Link');
    }
}
async function verifyLink() {
    const url = document.getElementById('magicUrl').value.trim();
    hideAlert('alert2');
    if (!url || !url.startsWith('http')) { showAlert('alert2', 'error', '<i class="fas fa-exclamation-circle"></i> Link tidak valid.'); return; }
    if (!currentEmail) { showAlert('alert2', 'error', '<i class="fas fa-exclamation-circle"></i> Email tidak ditemukan.'); return; }
    setLoading('btnVerif', true, 'Memverifikasi...');
    try {
        const verification = await postAPI('verify-account', { email: currentEmail, rawLink: url });
        if (!verification.success) throw new Error(verification.message || 'Verifikasi link gagal.');
        const idToken = verification.idToken || (verification.profile && verification.profile.idToken);
        if (!idToken) throw new Error('idToken tidak ditemukan.');
        setLoading('btnVerif', true, 'Injeksi Premium...');
        const premium = await postAPI('apply-premium', { email: currentEmail, idToken: idToken });
        if (!premium.success) throw new Error(premium.message || 'Gagal menyuntikkan Premium.');
        const code = premium.codeorder || premium.code || 'PREMIUM-OK';
        document.getElementById('codeOrder').textContent = code;
        showNotification('🎉 Akun berhasil diaktifkan!', 'fa-check-circle');
        goToStep(3);
        await notifyAMSuccess(currentUsername || 'Guest', currentEmail, code);
    } catch (err) {
        showAlert('alert2', 'error', '<i class="fas fa-exclamation-circle"></i> ' + (err.message || 'Koneksi gagal.'));
    } finally {
        setLoading('btnVerif', false, '<i class="fas fa-check"></i> Verify');
    }
}
function cancelProcess() {
    currentEmail = '';
    document.getElementById('email').value = '';
    document.getElementById('magicUrl').value = '';
    hideAlert('alert1'); hideAlert('alert2');
    goToStep(1); showToast('Proses dibatalkan');
}
function resetAll() {
    currentEmail = '';
    document.getElementById('email').value = '';
    document.getElementById('magicUrl').value = '';
    hideAlert('alert1'); hideAlert('alert2');
    goToStep(1);
}

function setTTMode(mode) {
    ttMode = mode;
    document.querySelectorAll('.mode-chip').forEach(c => c.classList.toggle('active', c.dataset.mode === mode));
    hideAlert('ttAlert');
    document.getElementById('ttResult').classList.remove('show');
}
function isValidTikTokUrl(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.includes('tiktok.com') || u.includes('vt.tiktok.com') || u.includes('vm.tiktok.com') || u.includes('t.tiktok.com');
}
async function forceDownload(url, filename) {
    if (!url) throw new Error('URL kosong');
    try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl; a.download = filename || 'download'; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(objUrl); a.remove(); }, 1500);
        return true;
    } catch (err) {
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.download = filename || 'download';
        document.body.appendChild(a); a.click(); a.remove();
        return false;
    }
}
async function downloadTikTok() {
    await notifyToolUsage('TikTok Downloader', `Mode: ${ttMode}`);
    const url = document.getElementById('ttUrl').value.trim();
    hideAlert('ttAlert');
    document.getElementById('ttResult').classList.remove('show');
    if (!url) { showAlert('ttAlert', 'error', '<i class="fas fa-exclamation-circle"></i> Masukkan link TikTok.'); return; }
    if (!isValidTikTokUrl(url)) { showAlert('ttAlert', 'error', '<i class="fas fa-exclamation-circle"></i> Link tidak valid.'); return; }
    const btn = document.getElementById('btnTT');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:24px;height:24px;"></div> Memproses...';
    try {
        if (ttMode === 'mp3') await handleMP3(url);
        else await handleAuto(url);
    } catch (err) {
        showAlert('ttAlert', 'error', '<i class="fas fa-exclamation-circle"></i> ' + (err.message || 'Gagal memproses.'));
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Download';
    }
}
async function handleAuto(url) {
    let data = null;
    try {
        const res = await fetch(TIKWM + '?url=' + encodeURIComponent(url) + '&hd=1');
        const json = await res.json();
        if (json.code === 0 && json.data) data = json.data;
    } catch (e) {}
    if (!data) {
        try {
            const res = await fetch(API + '/api/videodownloader?url=' + encodeURIComponent(url) + '&apikey=' + APIKEY);
            const json = await res.json();
            if (json.status) {
                data = { title: json.title, cover: json.thumbnail, play: json.download_url, duration: 0,
                    author: { unique_id: json.author, nickname: json.author }, images: json.images || [] };
            }
        } catch (e) {}
    }
    if (!data) throw new Error('Gagal mengambil data TikTok.');
    const images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    const isSlide = images.length > 0;
    const videoUrl = data.hdplay || data.play || data.download_url || null;
    const musicUrl = (data.music_info && data.music_info.play) || data.music || null;
    const title = data.title || 'TikTok';
    const authorObj = data.author || {};
    const author = String(authorObj.unique_id || authorObj.nickname || authorObj || '-').replace(/^@/, '');
    const cover = data.cover || data.origin_cover || data.thumbnail || (images[0] || '');
    const duration = data.duration || 0;
    document.getElementById('ttTitle').textContent = title;
    document.getElementById('ttAuthor').textContent = '@' + author;
    document.getElementById('ttInfo').textContent = isSlide ? (images.length + ' foto · Slide') : ((duration ? duration + 's · ' : '') + 'No Watermark');
    const badge = document.getElementById('ttTypeBadge');
    if (badge) badge.textContent = isSlide ? 'SLIDE' : 'VIDEO';
    const thumb = document.getElementById('ttThumb');
    if (cover) { thumb.src = cover; thumb.style.display = 'block'; } else { thumb.style.display = 'none'; }
    const body = document.getElementById('ttBody');
    body.innerHTML = '';
    if (isSlide) {
        const grid = document.createElement('div');
        grid.className = 'slide-grid';
        images.forEach((imgUrl, i) => {
            const src = typeof imgUrl === 'string' ? imgUrl : (imgUrl.url || imgUrl);
            if (!src) return;
            const card = document.createElement('div');
            card.className = 'slide-card';
            card.innerHTML = '<div class="slide-img-wrap"><img src="' + src + '" alt="Slide ' + (i + 1) + '" loading="lazy" /><div class="slide-num">' + (i + 1) + '</div></div>';
            const dlBtn = document.createElement('button');
            dlBtn.className = 'slide-dl';
            dlBtn.innerHTML = '↓ Download';
            dlBtn.onclick = async () => {
                dlBtn.disabled = true;
                dlBtn.innerHTML = '<div class="spinner spinner-white" style="width:20px;height:20px;"></div>';
                const ok = await forceDownload(src, 'tiktok-slide-' + (i + 1) + '.jpg');
                showToast(ok ? ('✅ Slide ' + (i + 1) + ' terdownload') : '📂 Dibuka di tab baru');
                dlBtn.disabled = false; dlBtn.innerHTML = '↓ Download';
            };
            card.appendChild(dlBtn);
            grid.appendChild(card);
        });
        body.appendChild(grid);
        if (musicUrl) {
            const musicBtn = document.createElement('button');
            musicBtn.className = 'btn-download';
            musicBtn.style.background = 'rgba(167,139,250,0.06)';
            musicBtn.style.color = 'var(--text-secondary)';
            musicBtn.style.border = '1px solid var(--border-color)';
            musicBtn.textContent = '🎵 Download Audio (MP3)';
            musicBtn.onclick = async () => {
                musicBtn.disabled = true;
                const ok = await forceDownload(musicUrl, 'tiktok-audio.mp3');
                showToast(ok ? '✅ Audio terdownload' : '📂 Dibuka di tab baru');
                musicBtn.disabled = false;
            };
            body.appendChild(musicBtn);
        }
    } else {
        if (!videoUrl) throw new Error('Link video tidak ditemukan.');
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn-download';
        dlBtn.innerHTML = '⬇ Download Video (No Watermark)';
        dlBtn.onclick = async () => {
            dlBtn.disabled = true;
            dlBtn.innerHTML = '<div class="spinner spinner-white" style="width:20px;height:20px;"></div> Mengunduh...';
            const ok = await forceDownload(videoUrl, 'tiktok-nowm.mp4');
            showToast(ok ? '✅ Video terdownload!' : '📂 Dibuka di tab baru');
            dlBtn.disabled = false;
            dlBtn.innerHTML = '⬇ Download Video (No Watermark)';
        };
        body.appendChild(dlBtn);
    }
    document.getElementById('ttResult').classList.add('show');
    showToast(isSlide ? ('✅ ' + images.length + ' slide ditemukan') : '✅ Video siap diunduh');
}
async function handleMP3(url) {
    let musicUrl = null;
    let meta = { title: 'TikTok Audio', author: '-', cover: '' };
    try {
        const res = await fetch(TIKWM + '?url=' + encodeURIComponent(url));
        const json = await res.json();
        if (json.code === 0 && json.data) {
            const d = json.data;
            musicUrl = (d.music_info && d.music_info.play) || d.music || null;
            meta.title = d.title || meta.title;
            meta.author = (d.author && (d.author.unique_id || d.author.nickname)) || meta.author;
            meta.cover = d.cover || '';
        }
    } catch (e) {}
    if (!musicUrl) throw new Error('Audio tidak tersedia.');
    document.getElementById('ttTitle').textContent = meta.title;
    document.getElementById('ttAuthor').textContent = '@' + String(meta.author).replace(/^@/, '');
    document.getElementById('ttInfo').textContent = 'MP3 · Audio only';
    const badge = document.getElementById('ttTypeBadge');
    if (badge) badge.textContent = 'MP3';
    const thumb = document.getElementById('ttThumb');
    if (meta.cover) { thumb.src = meta.cover; thumb.style.display = 'block'; } else { thumb.style.display = 'none'; }
    const body = document.getElementById('ttBody');
    body.innerHTML = '';
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn-download';
    dlBtn.innerHTML = '⬇ Download MP3';
    dlBtn.onclick = async () => {
        dlBtn.disabled = true;
        const ok = await forceDownload(musicUrl, 'tiktok-audio.mp3');
        showToast(ok ? '✅ MP3 terdownload!' : '📂 Dibuka di tab baru');
        dlBtn.disabled = false;
        dlBtn.innerHTML = '⬇ Download MP3';
    };
    body.appendChild(dlBtn);
    document.getElementById('ttResult').classList.add('show');
}

function selectEncMethod(el) {
    document.querySelectorAll('#toolEncryption .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    encMethod = el.dataset.method;
}
function rot13(str) {
    return str.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}
async function processEncryption() {
    const input = document.getElementById('encInput').value;
    let output = '';
    let methodName = '';
    try {
        switch (encMethod) {
            case 'base64enc': output = btoa(unescape(encodeURIComponent(input))); methodName = 'Base64 Encode'; break;
            case 'base64dec': output = decodeURIComponent(escape(atob(input))); methodName = 'Base64 Decode'; break;
            case 'md5': output = CryptoJS.MD5(input).toString(); methodName = 'MD5 Hash'; break;
            case 'sha256': output = CryptoJS.SHA256(input).toString(); methodName = 'SHA256 Hash'; break;
            case 'sha512': output = CryptoJS.SHA512(input).toString(); methodName = 'SHA512 Hash'; break;
            case 'rot13': output = rot13(input); methodName = 'ROT13'; break;
            default: output = 'Invalid method';
        }
        if (output && output !== 'Invalid method' && input) {
            await notifyToolUsage('Encryption Tools', `Method: ${methodName}`);
        }
    } catch (e) { output = 'Error: ' + e.message; }
    document.getElementById('encOutput').textContent = output;
    document.getElementById('encResult').classList.add('active');
}
function copyEncOutput() {
    const text = document.getElementById('encOutput').textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('#encResult .copy-btn');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
    });
}

const proxyServers = [
    { name: 'AllOrigins', url: 'https://api.allorigins.win/raw?url=' },
    { name: 'CORSProxyIO', url: 'https://corsproxy.io/?' },
    { name: 'CORSAnywhere', url: 'https://cors-anywhere.herokuapp.com/' },
    { name: 'Direct', url: '' }
];
function initGetCodeTool() {
    const form = document.getElementById('getCodeForm');
    if (!form) return;
    const loading = document.getElementById('gcLoader');
    const resultSection = document.getElementById('gcResult');
    const codeContent = document.getElementById('gcCodeContent');
    const copyBtn = document.getElementById('gcCopyBtn');
    const errorMessage = document.getElementById('gcError');
    const errorText = document.getElementById('gcErrorText');
    const codeSize = document.getElementById('gcSize');
    const proxyStatus = document.getElementById('gcProxyStatus');
    const downloadSection = document.getElementById('gcDownloadSection');
    const downloadBtn = document.getElementById('gcDownloadBtn');
    let lastExtractedHTML = '', lastExtractedURL = '';
    async function fetchHTMLWithProxies(url) {
        let lastError = null;
        const proxyDots = [document.getElementById('gcProxy0'), document.getElementById('gcProxy1'), document.getElementById('gcProxy2'), document.getElementById('gcProxy3')];
        proxyStatus.classList.add('active');
        proxyDots.forEach(dot => { if (dot) dot.className = 'proxy-dot pending'; });
        for (let i = 0; i < proxyServers.length; i++) {
            const proxy = proxyServers[i];
            if (proxyDots[i]) proxyDots[i].className = 'proxy-dot trying';
            try {
                const targetUrl = proxy.url + encodeURIComponent(url);
                const response = await fetch(targetUrl, { method: 'GET', mode: 'cors' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                if (html.length < 50) throw new Error('Invalid response');
                if (proxyDots[i]) proxyDots[i].className = 'proxy-dot success';
                return { html, proxy: proxy.name };
            } catch (error) {
                lastError = error;
                if (proxyDots[i]) proxyDots[i].className = 'proxy-dot fail';
            }
        }
        throw new Error(`All methods failed: ${lastError ? lastError.message : 'Unknown'}`);
    }
    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const urlInput = document.getElementById('gcUrl');
        let url = urlInput.value.trim();
        if (!url) { showToast('Enter a valid URL'); return; }
        if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; urlInput.value = url; }
        try { new URL(url); } catch (err) { showToast('Invalid URL'); return; }
        await notifyToolUsage('Get Code Tool', `URL: ${url}`);
        loading.style.display = 'block';
        resultSection.classList.remove('active');
        errorMessage.classList.remove('active');
        downloadSection.classList.remove('active');
        proxyStatus.classList.remove('active');
        try {
            const { html, proxy } = await fetchHTMLWithProxies(url);
            lastExtractedHTML = html; lastExtractedURL = url;
            codeContent.textContent = html;
            codeSize.textContent = formatSize(new Blob([html]).size);
            resultSection.classList.add('active');
            errorMessage.classList.remove('active');
            downloadSection.classList.add('active');
            showToast(`Code extracted via ${proxy}`);
        } catch (error) {
            errorMessage.classList.add('active');
            errorText.innerHTML = `<strong>Extraction Failed</strong><br>${error.message}`;
            showToast('Failed to extract');
        } finally { loading.style.display = 'none'; }
    });
    copyBtn.addEventListener('click', function() {
        const code = codeContent.textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED!';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> COPY'; }, 2000);
            showToast('Copied!');
        });
    });
    downloadBtn.addEventListener('click', function() {
        if (lastExtractedHTML && lastExtractedURL) {
            try {
                const blob = new Blob([lastExtractedHTML], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                let filename = 'source.html';
                try { const urlObj = new URL(lastExtractedURL); filename = urlObj.hostname.replace(/\./g, '_') + '.html'; } catch (e) {}
                a.download = filename;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                showToast('File downloaded!');
            } catch (e) { showToast('Download failed'); }
        }
    });
}

function generateQRCode() {
    const text = document.getElementById('qrInput').value.trim();
    const errorToast = document.getElementById('qrError');
    if (!text) {
        errorToast.textContent = '⚠️ Masukkan text atau URL!';
        errorToast.classList.add('visible');
        setTimeout(() => errorToast.classList.remove('visible'), 3000);
        return;
    }
    errorToast.classList.remove('visible');
    notifyToolUsage('QR Generator', `Data: ${text.substring(0, 50)}`);
    const container = document.getElementById('qrcode');
    const qrWrapper = document.getElementById('qrWrapper');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const qrActions = document.getElementById('qrActions');
    container.innerHTML = '';
    qrWrapper.classList.remove('active');
    qrActions.classList.remove('active');
    qrPlaceholder.style.display = 'flex';
    if (qrInstance) qrInstance = null;
    try {
        qrInstance = new QRCode(container, { text: text, width: 200, height: 200, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
        setTimeout(() => {
            qrPlaceholder.style.display = 'none';
            qrWrapper.classList.add('active');
            qrActions.classList.add('active');
            showToast('✅ QR Code berhasil di-generate!');
        }, 100);
    } catch (err) {
        errorToast.textContent = '❌ Gagal membuat QR Code.';
        errorToast.classList.add('visible');
        setTimeout(() => errorToast.classList.remove('visible'), 3000);
    }
}
function downloadQRCode() {
    const img = document.querySelector('#qrcode img');
    const canvas = document.querySelector('#qrcode canvas');
    let url = null;
    if (img) url = img.src; else if (canvas) url = canvas.toDataURL('image/png');
    if (!url) { showToast('⚠️ Tidak ada QR Code'); return; }
    const link = document.createElement('a');
    link.href = url; link.download = `QR_Code_${Date.now()}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast('⬇️ Download dimulai!');
}
function resetQRCode() {
    const container = document.getElementById('qrcode');
    const qrWrapper = document.getElementById('qrWrapper');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const qrActions = document.getElementById('qrActions');
    const inputField = document.getElementById('qrInput');
    if (qrInstance) { qrInstance.clear(); qrInstance = null; }
    container.innerHTML = '';
    qrWrapper.classList.remove('active');
    qrActions.classList.remove('active');
    qrPlaceholder.style.display = 'flex';
    inputField.value = ''; inputField.focus();
    document.getElementById('qrError').classList.remove('visible');
    showToast('🔄 QR Generator di-reset');
}

function quickCapCut(el, q) {
    document.querySelectorAll('#toolCapCut .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('ccSearchInput').value = q;
    searchCapCut(q || 'trending');
    if (q) document.getElementById('capcutLink').href = 'https://www.capcut.com/templates/search?query=' + encodeURIComponent(q);
}
function searchCapCut(query) {
    if (query === undefined) query = document.getElementById('ccSearchInput').value.trim();
    if (!query) query = 'trending';
    notifyToolUsage('CapCut Search', `Query: ${query}`);
    const loading = document.getElementById('ccLoading');
    const results = document.getElementById('ccTemplateResults');
    loading.classList.add('show');
    results.innerHTML = '';
    setTimeout(() => { loading.classList.remove('show'); renderCapCutFallback(query); }, 800);
}
function renderCapCutFallback(query) {
    const categories = [
        { name: 'Trending Now', desc: 'Most popular templates', icon: '🔥', url: 'https://www.capcut.com/templates' },
        { name: 'Lyrics Templates', desc: 'Music & lyrics video', icon: '🎵', url: 'https://www.capcut.com/templates/search?query=lyrics' },
        { name: 'Transition Pack', desc: 'Smooth transitions', icon: '✨', url: 'https://www.capcut.com/templates/search?query=transition' },
        { name: 'Vlog Templates', desc: 'For daily vlogs', icon: '📹', url: 'https://www.capcut.com/templates/search?query=vlog' },
        { name: 'Cinematic Edit', desc: 'Film-style templates', icon: '🎬', url: 'https://www.capcut.com/templates/search?query=cinematic' },
    ];
    document.getElementById('ccResultCount').textContent = 'Browse popular template categories';
    document.getElementById('ccTemplateResults').innerHTML = categories.map(c => `
        <div style="display:flex;align-items:center;gap:12px;padding:14px;margin-bottom:8px;border-radius:14px;border:1px solid var(--tool-card-border);background:var(--bg-card);cursor:pointer;" onclick="window.open('${c.url}','_blank')">
            <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(167,139,250,0.08);font-size:20px;flex-shrink:0;">${c.icon}</div>
            <div style="flex:1;">
                <div style="font-family:var(--font-display);font-size:13px;font-weight:bold;color:var(--text-primary);margin-bottom:2px;">${c.name}</div>
                <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);">${c.desc}</div>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--spiderman-blue);font-size:12px;"></i>
        </div>
    `).join('') + `<div class="suggestion-text">Search results open directly on CapCut.</div>`;
}

function initBTC() {
    let price = 118240.34;
    STATE.btcPrices = [];
    for (let i = 0; i < 100; i++) {
        price += (Math.random() - 0.5) * 200;
        price = Math.max(115000, Math.min(122000, price));
        STATE.btcPrices.push(price);
    }
    STATE.btcPrice = STATE.btcPrices[STATE.btcPrices.length - 1];
    STATE.btcHigh = Math.max(...STATE.btcPrices);
    STATE.btcLow = Math.min(...STATE.btcPrices);
    drawBTC();
    setInterval(updateBTC, 150);
}
function updateBTC() {
    const change = (Math.random() - 0.5) * 20;
    let newPrice = STATE.btcPrice + change;
    newPrice = Math.max(115000, Math.min(122000, newPrice));
    STATE.btcPrices.push(newPrice);
    if (STATE.btcPrices.length > 150) STATE.btcPrices.shift();
    STATE.btcPrice = newPrice;
    if (newPrice > STATE.btcHigh) STATE.btcHigh = newPrice;
    if (newPrice < STATE.btcLow) STATE.btcLow = newPrice;
    if (STATE.btcPrices.length > 10) {
        const oldPrice = STATE.btcPrices[STATE.btcPrices.length - 10];
        const pct = ((newPrice - oldPrice) / oldPrice) * 100;
        STATE.isPriceUp = pct >= 0;
        STATE.btcChange = (pct >= 0 ? '+' : '') + pct.toFixed(2);
    }
    STATE.btcVolume += (Math.random() - 0.5) * 50;
    STATE.btcVolume = Math.max(38000, Math.min(42000, STATE.btcVolume));
    STATE.btcFunding += (Math.random() - 0.5) * 0.0001;
    STATE.btcFunding = Math.max(-0.008, Math.min(0.008, STATE.btcFunding));
    drawBTC(); updateBTCDisplay();
}
function drawBTC() {
    const canvas = document.getElementById('btcCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width - 32;
    const h = 70;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    const prices = STATE.btcPrices;
    if (prices.length < 2) return;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = 4;
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    const color = STATE.isPriceUp ? '#A78BFA' : '#E62429';
    grad.addColorStop(0, color + '22');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
        const x = (i / (prices.length - 1)) * w;
        const y = h - (((prices[i] - min) / range) * (h - padding * 2) + padding);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
        const x = (i / (prices.length - 1)) * w;
        const y = h - (((prices[i] - min) / range) * (h - padding * 2) + padding);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
}
function updateBTCDisplay() {
    document.getElementById('btcPrice').textContent = '$' + STATE.btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const changeEl = document.getElementById('btcChange');
    changeEl.textContent = STATE.btcChange + '%';
    changeEl.style.color = STATE.isPriceUp ? '#A78BFA' : '#E62429';
    document.getElementById('btcHigh').textContent = '$' + STATE.btcHigh.toFixed(0);
    document.getElementById('btcLow').textContent = '$' + STATE.btcLow.toFixed(0);
    document.getElementById('btcVol').textContent = STATE.btcVolume.toFixed(0);
    document.getElementById('btcFunding').textContent = (STATE.btcFunding * 100).toFixed(3) + '%';
}

function renderNews() {
    const newsData = [
        { title: 'Update Tools Baru!', desc: 'Tools canggih untuk produktivitas', image: 'https://files.catbox.moe/4sllfm.jpeg' },
        { title: 'BTC Mencapai ATH', desc: 'Bitcoin tembus $120,000', image: 'https://files.catbox.moe/wmojlt.jpeg' },
        { title: 'Fitur Generator Hadir', desc: 'Buat akun Alight Motion Premium', image: 'https://files.catbox.moe/m8h9ni.png' },
    ];
    const carousel = document.getElementById('newsCarousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    newsData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'news-card';
        const imgSrc = item.image;
        div.innerHTML = `
            <img src="${imgSrc}" alt="${item.title}" onerror="this.src='https://placehold.co/400x200/A78BFA/FFFFFF?text=DAAPV'" />
            <div class="gradient-overlay"></div>
            <span class="badge-news">NEWS</span>
            <div class="news-content">
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
            </div>
        `;
        carousel.appendChild(div);
    });
    document.getElementById('newsCount').textContent = newsData.length + ' Item';
}

function renderBgThumbnails() {
    const container = document.getElementById('bgThumbnails');
    if (!container) return;
    container.innerHTML = '';
    STATE.defaultBgPaths.forEach((path, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-thumb' + (idx === STATE.bgIndex && !STATE.isBgFromGallery ? ' active' : '');
        div.innerHTML = `
            <img src="${path}" alt="BG ${idx+1}" onerror="this.src='https://placehold.co/70x70/A78BFA/FFFFFF?text=BG${idx+1}'" />
            ${idx === STATE.bgIndex && !STATE.isBgFromGallery ? '<div class="check"><i class="fas fa-check-circle"></i></div>' : ''}
        `;
        div.onclick = () => selectBg(idx);
        container.appendChild(div);
    });
}
function selectBg(idx) {
    STATE.bgIndex = idx;
    STATE.isBgFromGallery = false;
    STATE.bgPath = STATE.defaultBgPaths[idx];
    applyBackground(STATE.bgPath);
    renderBgThumbnails();
    showToast('Background diubah!', '#A78BFA');
    closeModal('bgModal');
}
function applyBackground(path) {
    document.body.style.backgroundImage = `url(${path})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundColor = 'transparent';
    const overlay = document.getElementById('bgOverlayStyle');
    if (overlay) overlay.remove();
    const style = document.createElement('style');
    style.id = 'bgOverlayStyle';
    style.textContent = `body::before { content: ''; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: -1; pointer-events: none; }`;
    document.head.appendChild(style);
}
function resetBackground() {
    STATE.isBgFromGallery = false;
    STATE.bgPath = STATE.defaultBgPaths[0];
    STATE.bgIndex = 0;
    const style = document.getElementById('bgOverlayStyle');
    if (style) style.remove();
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = 'var(--bg-primary)';
    renderBgThumbnails();
    showToast('Background direset!', '#A78BFA');
    closeModal('bgModal');
}
function pickFromGallery() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            STATE.isBgFromGallery = true;
            STATE.bgPath = ev.target.result;
            applyBackground(STATE.bgPath);
            showToast('Gambar dari galeri dipilih!', '#00E676');
            closeModal('bgModal');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}
function openBgPicker() { renderBgThumbnails(); openModal('bgModal'); }

function copyUID() {
    const val = document.getElementById('uidValue').textContent;
    navigator.clipboard.writeText(val).then(() => showToast('✅ UID berhasil disalin!', '#A78BFA'))
    .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = val; document.body.appendChild(textarea);
        textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea);
        showToast('✅ UID berhasil disalin!', '#A78BFA');
    });
}

function handleLogout() { openModal('logoutModal'); }
function confirmLogout() {
    closeModal('logoutModal');
    localStorage.removeItem('4vell_session');
    localStorage.removeItem('daapv_session');
    localStorage.removeItem('daapv_role');
    localStorage.removeItem('4vell_username');
    showToast('👋 Logout berhasil!', '#E62429');
    setTimeout(() => { location.reload(); }, 500);
}

const AI_MESSAGES = [
    "Halo! Selamat datang di DAAPV 🚀",
    "Ayo buka fitur canggih nya! 🔥",
    "Jangan lupa cek generator terbaru! 📸",
    "BTC: $118,240 🚀",
    "Gabung channel DAAPV untuk info update! 📢",
    "Selamat berkarya dengan DAAPV! ✨",
    "Fitur terbaru sudah menunggumu! 🎯",
    "Ayo eksplor semua tools yang tersedia! 🛠️",
    "DAAPV siap jadi partner terbaikmu! 💪",
    "Jangan lewatkan berita terbaru! 📰",
    "Keamanan adalah prioritas utama kami! 🔒",
    "Teruslah berkarya dan berinovasi! 🌟",
    "DAAPV selalu update untukmu! 🔄",
    "Yuk coba fitur Generator! 🎬",
];
let aiIndex = 0;
function rotateAI() {
    aiIndex = (aiIndex + 1) % AI_MESSAGES.length;
    const el = document.getElementById('aiMessage');
    if (el) el.textContent = AI_MESSAGES[aiIndex];
}
let isDragging = false, startX, startY, origX, origY;
const aiBubble = document.getElementById('aiBubble');
if (aiBubble) {
    aiBubble.addEventListener('mousedown', (e) => {
        if (e.target.closest('.avatar') || e.target.closest('.message')) {
            isDragging = true;
            const rect = aiBubble.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY;
            origX = rect.left; origY = rect.top;
            aiBubble.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newX = origX + dx;
        let newY = origY + dy;
        const maxX = window.innerWidth - aiBubble.offsetWidth - 10;
        const maxY = window.innerHeight - aiBubble.offsetHeight - 80;
        newX = Math.max(10, Math.min(maxX, newX));
        newY = Math.max(80, Math.min(maxY, newY));
        aiBubble.style.left = newX + 'px';
        aiBubble.style.top = newY + 'px';
        aiBubble.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => { isDragging = false; aiBubble.style.cursor = 'grab'; });
    aiBubble.addEventListener('click', (e) => {
        if (isDragging) return;
        aiBubble.classList.toggle('expanded');
        const icon = aiBubble.querySelector('.expand-icon i');
        if (aiBubble.classList.contains('expanded')) {
            icon.className = 'fas fa-chevron-up';
            aiBubble.style.maxWidth = '260px';
        } else {
            icon.className = 'fas fa-chevron-down';
            aiBubble.style.maxWidth = '200px';
        }
    });
}

/* ============================================================
   STORY MANAGER — DUMMY LOCALSTORAGE
   ============================================================ */
const Store = {
    KEY_STORIES: '4vell_stories',
    KEY_VIEWS: '4vell_story_views',
    KEY_LIKES: '4vell_story_likes',
    getStories() { try { return JSON.parse(localStorage.getItem(this.KEY_STORIES) || '[]'); } catch { return []; } },
    setStories(arr) {
        try {
            localStorage.setItem(this.KEY_STORIES, JSON.stringify(arr));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    addStory(s) {
        const arr = this.getStories();
        arr.unshift(s);
        const ok = this.setStories(arr);
        if (!ok) throw new Error('Storage penuh! Coba foto lebih kecil.');
        return ok;
    },
    removeStory(id) { this.setStories(this.getStories().filter(s => s.storyId !== id)); },
    getViews() { try { return JSON.parse(localStorage.getItem(this.KEY_VIEWS) || '[]'); } catch { return []; } },
    addView(id) { const v = this.getViews(); if (!v.includes(id)) { v.push(id); try { localStorage.setItem(this.KEY_VIEWS, JSON.stringify(v)); } catch(e){} } },
    hasViewed(id) { return this.getViews().includes(id); },
    getLikes() { try { return JSON.parse(localStorage.getItem(this.KEY_LIKES) || '[]'); } catch { return []; } },
    toggleLike(id) {
        const l = this.getLikes(); const i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1); else l.push(id);
        try { localStorage.setItem(this.KEY_LIKES, JSON.stringify(l)); } catch(e){}
        return i < 0;
    },
    isLiked(id) { return this.getLikes().includes(id); }
};

const StoryAPI = {
    async getStories() { return this._dummyGetStories(); },
    async uploadStory(file, type, caption) { return this._dummyUpload(file, type, caption); },
    async deleteStory(storyId) { Store.removeStory(storyId); return { valid: true }; },
    async viewStory(storyId) { Store.addView(storyId); return { valid: true }; },
    async likeStory(storyId) { const liked = Store.toggleLike(storyId); return { valid: true, liked }; },

    _dummyGetStories() {
        const raw = Store.getStories();
        const views = Store.getViews();
        const likes = Store.getLikes();
        if (raw.length === 0) {
            const samples = [
                { username: 'DAAPV_Official', type: 'image', caption: 'Welcome to DAAPV System 🚀', url: 'https://files.catbox.moe/4sllfm.jpeg' },
                { username: 'Daapv', type: 'image', caption: 'Gacor hari ini 🔥', url: 'https://files.catbox.moe/wmojlt.jpeg' },
                { username: 'DAAPV_Dev', type: 'image', caption: 'Update DAAPV ready', url: 'https://files.catbox.moe/m8h9ni.png' },
            ];
            samples.forEach((s, i) => {
                raw.push({
                    storyId: 'seed-' + i, username: s.username, mediaUrl: s.url, mediaType: s.type,
                    caption: s.caption, likeCount: 0, viewCount: 0, isLiked: false, isOwner: false,
                    createdAt: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').slice(0, 19)
                });
            });
            Store.setStories(raw);
        }
        return {
            valid: true,
            stories: raw.map(s => ({
                ...s,
                view_count: views.includes(s.storyId) ? 1 : 0,
                is_liked: likes.includes(s.storyId),
                is_owner: s.username === currentUsername
            }))
        };
    },

    async _dummyUpload(file, type, caption) {
        return new Promise((resolve, reject) => {
            if (type === 'video') {
                if (file.size > 1 * 1024 * 1024) {
                    reject(new Error('Video terlalu besar (max 1MB)'));
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const story = {
                            storyId: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
                            username: currentUsername || 'Daapv_User',
                            mediaUrl: reader.result,
                            mediaType: 'video',
                            caption: caption || '',
                            likeCount: 0, viewCount: 0, isLiked: false, isOwner: true,
                            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
                        };
                        Store.addStory(story);
                        resolve({ valid: true });
                    } catch (e) {
                        reject(new Error('Storage penuh! Video terlalu besar.'));
                    }
                };
                reader.onerror = () => reject(new Error('Gagal baca video'));
                reader.readAsDataURL(file);
                return;
            }

            const img = new Image();
            const objUrl = URL.createObjectURL(file);
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const MAX = 640;
                    let w = img.width, h = img.height;
                    if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
                    else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    let dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    if (dataUrl.length > 800 * 1024) {
                        dataUrl = canvas.toDataURL('image/jpeg', 0.4);
                    }
                    URL.revokeObjectURL(objUrl);

                    const story = {
                        storyId: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
                        username: currentUsername || 'Daapv_User',
                        mediaUrl: dataUrl,
                        mediaType: 'image',
                        caption: caption || '',
                        likeCount: 0, viewCount: 0, isLiked: false, isOwner: true,
                        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
                    };
                    Store.addStory(story);
                    console.log('✅ Story tersimpan:', story.storyId, 'Ukuran:', Math.round(dataUrl.length/1024) + 'KB');
                    resolve({ valid: true });
                } catch (e) {
                    URL.revokeObjectURL(objUrl);
                    reject(new Error('Gagal simpan gambar: ' + e.message));
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objUrl);
                reject(new Error('Gagal baca gambar'));
            };
            img.src = objUrl;
        });
    }
};

function timeAgo(dateStr) {
    if (!dateStr) return 'baru saja';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    return Math.floor(diff / 86400) + ' hari lalu';
}
function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const Story = {
    _initialized: false,
    allStories: [],
    groups: [],
    currentGroupIdx: 0,
    currentStoryIdx: 0,
    progressTimer: null,
    currentVideo: null,
    IMAGE_DURATION: 20000,
    _pendingFile: null,
    _pendingType: null,
    _pendingSource: null,

    async init() {
        this.bindStatic();
        await this.refresh();
        setInterval(() => this.refresh(), 60000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.refresh();
        });
    },
    bindStatic() {
        const addBtn = document.getElementById('addStoryBtn');
        const myItem = document.getElementById('myStoryItem');
        const overlay = document.getElementById('uploadOverlay');
        const closeViewer = document.getElementById('svCloseBtn');
        const prevBtn = document.getElementById('svPrev');
        const nextBtn = document.getElementById('svNext');
        const likeBtn = document.getElementById('svLikeBtn');
        const deleteBtn = document.getElementById('svDeleteBtn');
        if (addBtn) addBtn.addEventListener('click', (e) => { e.stopPropagation(); this.openUploadSheet(); });
        if (myItem) myItem.addEventListener('click', () => this.onMyStoryClick());
        if (overlay) overlay.addEventListener('click', () => this.closeUploadSheet());
        if (closeViewer) closeViewer.addEventListener('click', () => this.closeViewer());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStory());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStory());
        if (likeBtn) likeBtn.addEventListener('click', () => this.toggleLike());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteCurrent());
        document.querySelectorAll('.upload-option').forEach(el => {
            el.addEventListener('click', () => {
                const source = el.dataset.source;
                const type = el.dataset.type;
                this.closeUploadSheet();
                this.pickFile(source, type);
            });
        });
        const capCancel = document.getElementById('captionCancel');
        const capUpload = document.getElementById('captionUpload');
        const prevCancel = document.getElementById('previewCancel');
        const prevSend = document.getElementById('previewSend');
        if (capCancel) capCancel.addEventListener('click', () => this.cancelCaption());
        if (capUpload) capUpload.addEventListener('click', () => this.confirmCaption());
        if (prevCancel) prevCancel.addEventListener('click', () => this.cancelPreview());
        if (prevSend) prevSend.addEventListener('click', () => this.confirmUpload());
        const imgIn = document.getElementById('imageInput');
        const vidIn = document.getElementById('videoInput');
        const galVidIn = document.getElementById('galleryVideoInput');
        if (imgIn) imgIn.addEventListener('change', (e) => this.onFilePicked(e, 'image'));
        if (vidIn) vidIn.addEventListener('change', (e) => this.onFilePicked(e, 'video'));
        if (galVidIn) galVidIn.addEventListener('change', (e) => this.onFilePicked(e, 'video'));
        document.addEventListener('keydown', (e) => {
            const viewer = document.getElementById('storyViewer');
            if (!viewer || !viewer.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') this.prevStory();
            if (e.key === 'ArrowRight') this.nextStory();
            if (e.key === 'Escape') this.closeViewer();
        });
    },
    async refresh() {
        try {
            const data = await StoryAPI.getStories();
            this.allStories = (data.stories || []).map(s => ({
                storyId: s.storyId, username: s.username, mediaUrl: s.mediaUrl, mediaType: s.mediaType,
                caption: s.caption, likeCount: Number(s.likeCount || 0), viewCount: Number(s.view_count || s.viewCount || 0),
                isLiked: !!s.is_liked || !!s.isLiked, isOwner: !!s.is_owner, createdAt: s.createdAt
            }));
            const map = {};
            this.allStories.forEach(s => {
                if (!s.username) return;
                (map[s.username] = map[s.username] || []).push(s);
            });
            this.groups = Object.keys(map).map(u => ({
                username: u, avatar: map[u][0]?.mediaUrl || '',
                stories: map[u], hasUnviewed: map[u].some(s => !Store.hasViewed(s.storyId))
            }));
            this.groups.sort((a, b) => {
                if (a.username === currentUsername) return -1;
                if (b.username === currentUsername) return 1;
                return 0;
            });
            this.renderBar();
        } catch (err) { console.warn('Story refresh error:', err); }
    },
    renderBar() {
        const scroll = document.getElementById('storiesScroll');
        if (!scroll) return;
        [...scroll.querySelectorAll('.story-item:not(.my-story)')].forEach(el => el.remove());
        const mine = this.groups.find(g => g.username === currentUsername);
        const myRing = document.getElementById('myStoryRing');
        if (myRing) {
            if (mine && mine.stories.length > 0) {
                myRing.classList.remove('my-ring');
                myRing.classList.add(mine.hasUnviewed ? 'unviewed' : 'viewed');
            } else {
                myRing.classList.remove('unviewed', 'viewed');
                myRing.classList.add('my-ring');
            }
        }
        this.groups.forEach((g, idx) => {
            if (g.username === currentUsername) return;
            const first = g.stories[0];
            const initial = g.username.charAt(0).toUpperCase();
            const isImg = first && first.mediaType === 'image' && first.mediaUrl;
            const ringClass = g.hasUnviewed ? 'unviewed' : 'viewed';
            const div = document.createElement('div');
            div.className = 'story-item';
            div.dataset.groupIdx = idx;
            div.innerHTML = `
                <div class="story-avatar-wrap">
                    <div class="story-ring ${ringClass}">
                        <div class="story-avatar">
                            ${isImg ? `<img src="${escHtml(first.mediaUrl)}" onerror="this.parentElement.innerHTML='<span class=\\'initial\\'>${escHtml(initial)}</span>'">` : `<span class="initial">${escHtml(initial)}</span>`}
                        </div>
                    </div>
                </div>
                <span class="story-label">${escHtml(g.username)}</span>
            `;
            div.addEventListener('click', () => this.openViewer(idx));
            scroll.appendChild(div);
        });
    },
    onMyStoryClick() {
        const idx = this.groups.findIndex(g => g.username === currentUsername);
        if (idx >= 0 && this.groups[idx].stories.length > 0) this.openViewer(idx);
        else this.openUploadSheet();
    },
    openUploadSheet() {
        const o = document.getElementById('uploadOverlay');
        const s = document.getElementById('uploadSheet');
        if (o) o.classList.add('active');
        if (s) s.classList.add('active');
    },
    closeUploadSheet() {
        const o = document.getElementById('uploadOverlay');
        const s = document.getElementById('uploadSheet');
        if (o) o.classList.remove('active');
        if (s) s.classList.remove('active');
    },
    pickFile(source, type) {
        this._pendingSource = source;
        this._pendingType = type;
        if (type === 'image') {
            const imgInput = document.getElementById('imageInput');
            if (source === 'camera') imgInput.setAttribute('capture', 'environment');
            else imgInput.removeAttribute('capture');
            imgInput.click();
        } else {
            if (source === 'camera') document.getElementById('videoInput').click();
            else document.getElementById('galleryVideoInput').click();
        }
    },
    onFilePicked(e, type) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        this._pendingFile = file;
        this._pendingType = type;
        this.showPreview(file, type);
    },
    showPreview(file, type) {
        const wrap = document.getElementById('previewMedia');
        wrap.innerHTML = '';
        const url = URL.createObjectURL(file);
        let el;
        if (type === 'video') { el = document.createElement('video'); el.src = url; el.controls = true; el.playsInline = true; }
        else { el = document.createElement('img'); el.src = url; }
        wrap.appendChild(el);
        document.getElementById('previewDialog').classList.add('active');
    },
    cancelPreview() {
        document.getElementById('previewDialog').classList.remove('active');
        document.getElementById('previewMedia').innerHTML = '';
        this._pendingFile = null;
    },
    confirmUpload() {
        document.getElementById('previewDialog').classList.remove('active');
        if (!this._pendingFile) return;
        document.getElementById('captionInput').value = '';
        document.getElementById('captionDialog').classList.add('active');
    },
    cancelCaption() {
        document.getElementById('captionDialog').classList.remove('active');
        this._pendingFile = null;
        this._pendingType = null;
    },
    async confirmCaption() {
        const caption = document.getElementById('captionInput').value.trim();
        document.getElementById('captionDialog').classList.remove('active');
        if (!this._pendingFile) return;

        const file = this._pendingFile;
        const type = this._pendingType || 'image';
        this._pendingFile = null;
        this._pendingType = null;

        showToast('⏳ Mengunggah story...', '#A78BFA');

        try {
            const res = await StoryAPI.uploadStory(file, type, caption);
            if (res && res.valid) {
                showToast('✅ Story berhasil diunggah!', '#25D366');
                await new Promise(r => setTimeout(r, 400));
                await this.refresh();
            } else {
                showToast('❌ Gagal upload', '#E03030');
            }
        } catch (err) {
            console.error('Upload error:', err);
            showToast('❌ ' + err.message, '#E03030');
        }
    },
    openViewer(groupIdx) {
        if (!this.groups[groupIdx]) return;
        this.currentGroupIdx = groupIdx;
        const stories = this.groups[groupIdx].stories;
        let startIdx = stories.findIndex(s => !Store.hasViewed(s.storyId));
        if (startIdx < 0) startIdx = 0;
        this.currentStoryIdx = startIdx;
        document.getElementById('storyViewer').classList.add('active');
        this.renderViewer();
    },
    closeViewer() {
        document.getElementById('storyViewer').classList.remove('active');
        this.stopProgress();
        if (this.currentVideo) { this.currentVideo.pause(); this.currentVideo = null; }
        this.refresh();
    },
    renderViewer() {
        const group = this.groups[this.currentGroupIdx];
        if (!group) return this.closeViewer();
        const story = group.stories[this.currentStoryIdx];
        if (!story) return this.closeViewer();
        const bar = document.getElementById('svProgressBar');
        bar.innerHTML = '';
        group.stories.forEach((s, i) => {
            const item = document.createElement('div');
            item.className = 'sv-progress-item';
            if (i < this.currentStoryIdx) item.classList.add('done');
            if (i === this.currentStoryIdx) item.classList.add('current');
            item.innerHTML = '<div class="sv-progress-fill"></div>';
            bar.appendChild(item);
        });
        const initial = group.username.charAt(0).toUpperCase();
        document.getElementById('svAvatar').innerHTML = story.mediaType === 'image' && story.mediaUrl
            ? `<img src="${escHtml(story.mediaUrl)}" onerror="this.outerHTML='${escHtml(initial)}'">`
            : escHtml(initial);
        document.getElementById('svUsername').textContent = group.username;
        document.getElementById('svTime').textContent = timeAgo(story.createdAt);
        document.getElementById('svCaption').textContent = story.caption || '';
        const liked = Store.isLiked(story.storyId);
        const likeBtn = document.getElementById('svLikeBtn');
        likeBtn.classList.toggle('liked', liked);
        likeBtn.innerHTML = liked ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        document.getElementById('svLikeCount').textContent = story.likeCount || 0;
        document.getElementById('svViewCount').textContent = story.viewCount || 0;
        const isOwner = story.username === currentUsername;
        document.getElementById('svDeleteBtn').style.display = isOwner ? 'flex' : 'none';
        const img = document.getElementById('svImage');
        const vid = document.getElementById('svVideo');
        const blur = document.getElementById('svMediaBlur');
        if (this.currentVideo) { this.currentVideo.pause(); this.currentVideo = null; }
        vid.pause(); vid.removeAttribute('src'); vid.load();
        if (story.mediaType === 'video') {
            img.style.display = 'none';
            vid.style.display = 'block';
            vid.src = story.mediaUrl;
            this.currentVideo = vid;
            blur.style.backgroundImage = `url(${story.mediaUrl})`;
            vid.play().catch(() => {});
            vid.onloadedmetadata = () => {
                const dur = vid.duration && vid.duration > 1 ? vid.duration * 1000 : 15000;
                this.startProgress(dur);
            };
            setTimeout(() => { if (!this.progressTimer) this.startProgress(15000); }, 500);
        } else {
            vid.style.display = 'none';
            img.style.display = 'block';
            img.src = story.mediaUrl;
            blur.style.backgroundImage = `url(${story.mediaUrl})`;
            this.startProgress(this.IMAGE_DURATION);
        }
        StoryAPI.viewStory(story.storyId);
        Store.addView(story.storyId);
        story.viewCount = 1;
        document.getElementById('svViewCount').textContent = story.viewCount;
    },
    startProgress(duration) {
        this.stopProgress();
        const curBar = document.querySelector('.sv-progress-item.current .sv-progress-fill');
        if (!curBar) return;
        curBar.style.width = '0%';
        const start = Date.now();
        this.progressTimer = setInterval(() => {
            const p = Math.min(100, ((Date.now() - start) / duration) * 100);
            curBar.style.width = p + '%';
            if (p >= 100) { this.stopProgress(); this.nextStory(); }
        }, 50);
    },
    stopProgress() { if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; } },
    nextStory() {
        const group = this.groups[this.currentGroupIdx];
        if (!group) return;
        if (this.currentStoryIdx < group.stories.length - 1) {
            this.currentStoryIdx++;
            this.renderViewer();
        } else {
            let nextGroup = this.currentGroupIdx + 1;
            while (nextGroup < this.groups.length && this.groups[nextGroup].stories.length === 0) nextGroup++;
            if (nextGroup < this.groups.length) {
                this.currentGroupIdx = nextGroup;
                this.currentStoryIdx = 0;
                this.renderViewer();
            } else this.closeViewer();
        }
    },
    prevStory() {
        if (this.currentStoryIdx > 0) {
            this.currentStoryIdx--;
            this.renderViewer();
        } else {
            let prevGroup = this.currentGroupIdx - 1;
            while (prevGroup >= 0 && this.groups[prevGroup].stories.length === 0) prevGroup--;
            if (prevGroup >= 0) {
                this.currentGroupIdx = prevGroup;
                this.currentStoryIdx = this.groups[prevGroup].stories.length - 1;
                this.renderViewer();
            } else { this.currentStoryIdx = 0; this.renderViewer(); }
        }
    },
    async toggleLike() {
        const group = this.groups[this.currentGroupIdx];
        if (!group) return;
        const story = group.stories[this.currentStoryIdx];
        const res = await StoryAPI.likeStory(story.storyId);
        const liked = res.liked !== undefined ? res.liked : Store.isLiked(story.storyId);
        story.isLiked = liked;
        story.likeCount = Math.max(0, (story.likeCount || 0) + (liked ? 1 : -1));
        const btn = document.getElementById('svLikeBtn');
        btn.classList.toggle('liked', liked);
        btn.innerHTML = liked ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        document.getElementById('svLikeCount').textContent = story.likeCount;
    },
    async deleteCurrent() {
        const group = this.groups[this.currentGroupIdx];
        if (!group) return;
        const story = group.stories[this.currentStoryIdx];
        if (story.username !== currentUsername) return;
        if (!confirm('Hapus story ini?')) return;
        try {
            await StoryAPI.deleteStory(story.storyId);
            showToast('Story dihapus', '#A78BFA');
            await this.refresh();
            const newGroup = this.groups.find(g => g.username === group.username);
            if (!newGroup || newGroup.stories.length === 0) this.closeViewer();
            else {
                this.currentGroupIdx = this.groups.indexOf(newGroup);
                if (this.currentStoryIdx >= newGroup.stories.length) this.currentStoryIdx = newGroup.stories.length - 1;
                this.renderViewer();
            }
        } catch (e) { showToast('Gagal hapus', '#E03030'); }
    }
};

function initiPhoneQuote() {
    const timeInput = document.getElementById('iqTimeInput');
    if (!timeInput) return;
    const batteryInput = document.getElementById('iqBatteryInput');
    const carrierInput = document.getElementById('iqCarrierInput');
    const messageInput = document.getElementById('iqMessageInput');
    const generateBtn = document.getElementById('iqGenerateBtn');
    const loader = document.getElementById('iqLoader');
    const resultCard = document.getElementById('iqResultCard');
    const resultImg = document.getElementById('iqResultImg');
    const downloadBtn = document.getElementById('iqDownloadBtn');
    const resetBtn = document.getElementById('iqResetBtn');
    const errorToast = document.getElementById('iqErrorToast');
    let currentApiUrl = '';
    const now = new Date();
    timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    batteryInput.value = '100';
    carrierInput.value = 'Telkomsel';
    function showError(message) {
        errorToast.textContent = message;
        errorToast.classList.add('visible');
        setTimeout(() => errorToast.classList.remove('visible'), 3000);
    }
    generateBtn.addEventListener('click', async function() {
        const time = timeInput.value.trim();
        const battery = batteryInput.value.trim();
        const carrier = carrierInput.value.trim();
        const message = messageInput.value.trim();
        if (!time || !battery || !carrier || !message) { showError("All fields must be filled!"); return; }
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) { showError("Invalid time format!"); return; }
        const batteryNum = parseInt(battery);
        if (isNaN(batteryNum) || batteryNum < 1 || batteryNum > 100) { showError("Battery 1-100!"); return; }
        errorToast.classList.remove('visible');
        resultCard.classList.remove('active');
        loader.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        await notifyToolUsage('iPhone Quote Generator', `Time: ${time}, Battery: ${battery}%`);
        currentApiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(carrier)}&messageText=${encodeURIComponent(message)}&emojiStyle=apple`;
        resultImg.src = currentApiUrl;
        resultImg.onload = () => {
            loader.style.display = 'none';
            resultCard.classList.add('active');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Quote';
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        resultImg.onerror = () => {
            loader.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Quote';
            showError("Failed to generate image.");
        };
    });
    downloadBtn.addEventListener('click', () => {
        if (!currentApiUrl) { showError("No quote to download."); return; }
        const link = document.createElement('a');
        link.href = currentApiUrl;
        link.download = `iphone_quote_${Date.now()}.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });
    resetBtn.addEventListener('click', () => {
        messageInput.value = '';
        resultCard.classList.remove('active');
        resultImg.src = '';
        currentApiUrl = '';
        messageInput.focus();
    });
}

function initTelegramSpam() {
    const tgEl = {
        statusMsgCount: document.getElementById('tgStatusMsgCount'),
        statusBot: document.getElementById('tgStatusBot'),
        heroMsgCount: document.getElementById('tgHeroMsgCount'),
        heroBotStatus: document.getElementById('tgHeroBotStatus'),
        heroSpamStatus: document.getElementById('tgHeroSpamStatus'),
        botToken: document.getElementById('tgBotToken'),
        targetId: document.getElementById('tgTargetId'),
        testBtn: document.getElementById('tgTestBtn'),
        spamText: document.getElementById('tgSpamText'),
        messagePreview: document.getElementById('tgMessagePreview'),
        count: document.getElementById('tgCount'),
        countRange: document.getElementById('tgCountRange'),
        delay: document.getElementById('tgDelay'),
        delayRange: document.getElementById('tgDelayRange'),
        startBtn: document.getElementById('tgStartBtn'),
        stopBtn: document.getElementById('tgStopBtn'),
        logContainer: document.getElementById('tgLogContainer')
    };
    if (!tgEl.botToken) return;
    const tgState = { botToken: '', targetId: '', isConnected: false, isSpamming: false, messageCount: 0, customMessage: 'Hallo' };
    function tgShowToast(message, type) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        toastMsg.textContent = message;
        let color = '#A78BFA';
        if (type === 'error') color = '#E03030';
        else if (type === 'success') color = '#25D366';
        else if (type === 'warning') color = '#FBBF24';
        toast.style.borderColor = color + '44';
        toast.querySelector('i').style.color = color;
        toast.classList.add('show');
        clearTimeout(_toastTimeout);
        _toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }
    function tgLogMessage(message, type) {
        type = type || 'info';
        const entry = document.createElement('div');
        entry.className = 'tg-log-entry tg-log-' + type;
        const now = new Date();
        const time = now.toLocaleTimeString('en-GB', { hour12: false });
        entry.textContent = '[' + time + '] ' + message;
        tgEl.logContainer.appendChild(entry);
        tgEl.logContainer.scrollTop = tgEl.logContainer.scrollHeight;
    }
    function tgUpdateBotStatus(online) {
        tgState.isConnected = online;
        if (online) {
            tgEl.statusBot.textContent = 'Online';
            tgEl.statusBot.className = 'tg-status-value tg-online';
            tgEl.heroBotStatus.textContent = 'Online';
            tgEl.heroBotStatus.style.color = 'var(--green)';
        } else {
            tgEl.statusBot.textContent = 'Offline';
            tgEl.statusBot.className = 'tg-status-value tg-offline';
            tgEl.heroBotStatus.textContent = 'Offline';
            tgEl.heroBotStatus.style.color = 'var(--red)';
        }
    }
    function tgUpdateMessageCount(count) {
        tgState.messageCount = count;
        tgEl.statusMsgCount.textContent = count;
        tgEl.heroMsgCount.textContent = count;
    }
    function tgSyncInputs(rangeId, numberId) {
        const range = document.getElementById(rangeId);
        const number = document.getElementById(numberId);
        range.addEventListener('input', () => { number.value = range.value; });
        number.addEventListener('input', () => {
            let val = parseInt(number.value);
            if (isNaN(val)) val = parseInt(range.min);
            val = Math.min(parseInt(range.max), Math.max(parseInt(range.min), val));
            number.value = val; range.value = val;
        });
    }
    function tgUpdateMessagePreview() {
        const text = tgEl.spamText.value.trim();
        if (text) { tgEl.messagePreview.textContent = text; tgState.customMessage = text; }
        else { tgEl.messagePreview.textContent = 'No message entered'; tgState.customMessage = ''; }
    }
    function tgLoadConfig() {
        const token = localStorage.getItem('tg_bot_token');
        const target = localStorage.getItem('tg_chat_id');
        if (token) tgEl.botToken.value = token;
        if (target) tgEl.targetId.value = target;
    }
    window.tgSwitchTab = function(tabName) {
        document.querySelectorAll('#toolSpamTelegram .feature-tab').forEach(t => t.classList.remove('active'));
        document.getElementById('tgTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');
        document.querySelectorAll('#toolSpamTelegram .feature-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('tgPanel' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');
    };
    window.tgTestConnection = async function() {
        const token = tgEl.botToken.value.trim();
        if (!token) { tgShowToast('Enter bot token first!', 'error'); return; }
        tgState.botToken = token;
        tgState.targetId = tgEl.targetId.value.trim();
        tgLogMessage('Testing connection...', 'info');
        tgEl.testBtn.disabled = true;
        tgEl.testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        try {
            const response = await fetch('https://api.telegram.org/bot' + token + '/getMe');
            const data = await response.json();
            if (data.ok && data.result) {
                tgUpdateBotStatus(true);
                tgLogMessage('Bot connected: @' + data.result.username, 'success');
                tgShowToast('Connected: @' + data.result.username, 'success');
            } else throw new Error(data.description || 'Connection failed');
        } catch (error) {
            tgUpdateBotStatus(false);
            tgLogMessage('Connection failed: ' + error.message, 'error');
            tgShowToast('Connection failed', 'error');
        } finally {
            tgEl.testBtn.disabled = false;
            tgEl.testBtn.innerHTML = '<i class="fas fa-network-wired"></i> Test Connection';
        }
    };
    window.tgSaveConfig = function() {
        const token = tgEl.botToken.value.trim();
        const target = tgEl.targetId.value.trim();
        if (!token) { tgShowToast('Enter bot token first!', 'warning'); return; }
        localStorage.setItem('tg_bot_token', token);
        localStorage.setItem('tg_chat_id', target);
        tgState.botToken = token; tgState.targetId = target;
        tgLogMessage('Configuration saved', 'success');
        tgShowToast('Configuration saved', 'success');
    };
    window.tgStartSpam = async function() {
        if (!tgState.isConnected) { tgShowToast('Connect bot first!', 'error'); return; }
        const message = tgEl.spamText.value.trim();
        if (!message) { tgShowToast('Enter a message!', 'error'); return; }
        let count = parseInt(tgEl.count.value) || 10;
        let delayMs = parseInt(tgEl.delay.value) || 0;
        count = Math.max(1, Math.min(100, count));
        delayMs = Math.max(0, Math.min(5000, delayMs));
        tgState.isSpamming = true;
        tgState.customMessage = message;
        tgEl.startBtn.style.display = 'none';
        tgEl.stopBtn.style.display = 'inline-flex';
        tgEl.heroSpamStatus.textContent = 'Active';
        tgEl.heroSpamStatus.style.color = 'var(--gold)';
        tgLogMessage('--- SPAM STARTED ---', 'warning');
        let successCount = 0, failCount = 0;
        for (let i = 0; i < count; i++) {
            if (!tgState.isSpamming) break;
            try {
                const resp = await fetch('https://api.telegram.org/bot' + tgState.botToken + '/sendMessage', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: tgState.targetId, text: tgState.customMessage })
                });
                const respData = await resp.json();
                if (resp.ok && respData.ok) {
                    successCount++;
                    tgUpdateMessageCount(tgState.messageCount + 1);
                    if ((i + 1) % 5 === 0 || i === 0) tgLogMessage('Sent ' + (i + 1) + '/' + count, 'success');
                } else { failCount++; tgLogMessage('Failed #' + (i + 1), 'error'); }
            } catch (err) { failCount++; tgLogMessage('Error #' + (i + 1) + ': ' + err.message, 'error'); }
            if (delayMs > 0 && i < count - 1 && tgState.isSpamming) await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        tgFinishSpam(successCount, failCount, count);
    };
    window.tgStopSpam = function() {
        if (tgState.isSpamming) {
            tgState.isSpamming = false;
            tgLogMessage('Spam stopped by user', 'warning');
            tgShowToast('Spam stopped', 'warning');
        }
    };
    function tgFinishSpam(success, failed, total) {
        tgState.isSpamming = false;
        tgEl.startBtn.style.display = 'inline-flex';
        tgEl.stopBtn.style.display = 'none';
        tgEl.heroSpamStatus.textContent = 'Idle';
        tgEl.heroSpamStatus.style.color = '';
        tgLogMessage('--- SPAM COMPLETED ---', 'warning');
        tgLogMessage('Results: ' + success + '/' + total, 'success');
        tgShowToast('Done: ' + success + '/' + total, 'success');
    }
    tgSyncInputs('tgCountRange', 'tgCount');
    tgSyncInputs('tgDelayRange', 'tgDelay');
    tgLoadConfig();
    tgEl.spamText.addEventListener('input', tgUpdateMessagePreview);
    setTimeout(function() {
        tgLogMessage('Telegram Bot Spam Tool ready', 'success');
        tgUpdateMessagePreview();
    }, 400);
}

console.log('🚀 DAAPV Dashboard with DUMMY Story loaded!');
