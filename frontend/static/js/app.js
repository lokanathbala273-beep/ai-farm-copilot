/**
 * AI Farm Co-Pilot, Leaf Disease Computer Vision Scanner,
 * Farm Business Maker & Market Optimizer Frontend Controller
 */

// Clear any previous cached session on fresh entry so website ALWAYS starts on the 1st Login/Sign Up page
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('farmer_otp_verified');

// Application State
const state = {
  token: '',
  user: null,
  currentLang: localStorage.getItem('lang') || 'en',
  translations: {},
  currentCrop: 'Tomato',
  activeTab: 'dashboard',
  selectedImageFile: null,
  selectedImageBase64: null,
  selectedWebcamUrl: null,
  activeFarmId: null,
  isRecording: false,
  speechRecognition: null,
  charts: {},
  currentLat: 20.2961,
  currentLon: 85.8245,
  currentLocationName: 'Shared Live Field Location',
  authModalRole: 'FARMER',
  signinSelectedRole: 'FARMER',
  isFarmerVerified: false,
  enrolledBiometricToken: null,
  enrolledFaceToken: null,
  activeLoginBiometricToken: null,
  activeLoginFaceToken: null
};

// Helper: Check if user has an active authenticated session
function isUserAuthenticated() {
  return !!(state.token && state.user && (state.user.email || state.user.id));
}

// Strict Role-to-Default-Tab & Allowed-Tabs Mapping
function getRoleDefaultTab(role) {
  if (role === 'AGRICULTURAL_EXPERT') return 'expert_portal';
  if (role === 'BUYER') return 'buyer_portal';
  if (role === 'ADMIN') return 'admin_portal';
  return 'dashboard';
}

const ROLE_ALLOWED_TABS = {
  'FARMER': ['dashboard', 'scanner', 'copilot', 'soil', 'business', 'market', 'marketplace', 'my_farm'],
  'AGRICULTURAL_EXPERT': ['expert_portal'],
  'BUYER': ['buyer_portal'],
  'ADMIN': ['admin_portal']
};

// Initialize Application (Always starts strictly on 1st Login / Sign Up screen)
document.addEventListener('DOMContentLoaded', async () => {
  await loadTranslations(state.currentLang);
  initSpeechRecognition();
  setupEventListeners();
  init3DScene();

  // Ensure Leaf Disease Expert field is hidden by default when Farmer is selected
  handleRegRoleChange();
  selectSignInRole('FARMER');

  // Always start unauthenticated on 1st Login / Registration screen
  updateUserUI();
  applyFarmerGateState();
  switchTab('dashboard');
});

// ==============================================================================
// 3D ILLUMINATION FARMING SCENE (VIVID 3D FIELDS & SUNBURST RAYS - CRYSTAL CLEAR)
// ==============================================================================
const VIVID_3D_THEME = {
  url: '/static/assets/farmer_pure_vivid_3d.jpg',
  glow1: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(34, 197, 94, 0.12) 40%, transparent 70%)',
  glow2: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(6, 95, 70, 0.08) 45%, transparent 70%)'
};

function init3DScene() {
  const bgImg = document.getElementById('farm3dBgImage');
  const glow1 = document.querySelector('.farm-3d-illumination-glow');
  const glow2 = document.querySelector('.farm-3d-illumination-glow-left');
  if (bgImg) {
    bgImg.style.backgroundImage = `url('${VIVID_3D_THEME.url}')`;
    bgImg.style.opacity = '1';
  }
  if (glow1) glow1.style.background = VIVID_3D_THEME.glow1;
  if (glow2) glow2.style.background = VIVID_3D_THEME.glow2;
  create3DParticles();
}

function set3DBackgroundTheme() {
  init3DScene();
}

function create3DParticles() {
  const container = document.getElementById('farm3dParticles');
  if (!container) return;
  container.innerHTML = '';

  const count = 28;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'farm-particle';

    const size = Math.random() * 4 + 2;
    const posX = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 12;
    const color = Math.random() > 0.4 ? 'rgba(234, 179, 8, 0.7)' : 'rgba(74, 222, 128, 0.7)';

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.background = color;
    particle.style.boxShadow = `0 0 ${size * 3}px ${color}`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    container.appendChild(particle);
  }
}

// Translation & i18n Engine
async function loadTranslations(lang) {
  try {
    const res = await fetch(`/locales/${lang}/translation.json`);
    if (res.ok) {
      state.translations = await res.json();
      state.currentLang = lang;
      localStorage.setItem('lang', lang);
      applyTranslations();
    }
  } catch (err) {
    console.error('Failed to load translations:', err);
  }
}

function t(path, fallback = '') {
  const parts = path.split('.');
  let curr = state.translations;
  for (const p of parts) {
    if (curr && curr[p] !== undefined) {
      curr = curr[p];
    } else {
      return fallback || path;
    }
  }
  return curr;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerText = t(key, el.innerText);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key, el.getAttribute('placeholder')));
  });
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = state.currentLang;
}

async function switchLanguage(lang) {
  await loadTranslations(lang);
  if (state.activeTab === 'dashboard') loadDashboardData();
  if (state.activeTab === 'copilot') initCopilotView();
}

// ----------------------------------------------------
// PHONE NUMBER + OTP AUTHENTICATION & ROLE SWITCHER
// Priority 1: FARMER, followed by EXPERT, SELLER, BUYER, ADMIN
// ----------------------------------------------------

// Demo directory purged - only real registered user accounts are allowed
const DEMO_PHONE_DIRECTORY = {};

function openPhoneLoginModal(preferredRole = 'FARMER') {
  const modal = document.getElementById('modalPhoneAuth');
  if (!modal) return;

  setAuthModalRole(preferredRole);

  const step1 = document.getElementById('otpStep1');
  const step2 = document.getElementById('otpStep2');
  if (step1) step1.classList.remove('hidden');
  if (step2) step2.classList.add('hidden');

  const phoneInput = document.getElementById('authInputPhone');
  const nameInput = document.getElementById('authInputFullName');
  const otpInput = document.getElementById('authInputOtpCode');
  if (otpInput) otpInput.value = '';

  modal.classList.remove('hidden');
}

function closePhoneLoginModal() {
  const modal = document.getElementById('modalPhoneAuth');
  if (modal) modal.classList.add('hidden');
}

function setAuthModalRole(role) {
  state.authModalRole = role || 'FARMER';

  const roleBtns = {
    'FARMER': document.getElementById('authRoleBtn-FARMER'),
    'AGRICULTURAL_EXPERT': document.getElementById('authRoleBtn-AGRICULTURAL_EXPERT'),
    'BUYER': document.getElementById('authRoleBtn-BUYER'),
    'ADMIN': document.getElementById('authRoleBtn-ADMIN')
  };

  Object.entries(roleBtns).forEach(([r, btn]) => {
    if (!btn) return;
    if (r === role) {
      if (r === 'FARMER') {
        btn.className = 'col-span-2 sm:col-span-1 p-2.5 rounded-xl font-extrabold border-2 border-emerald-600 bg-emerald-600 text-white flex items-center justify-center gap-1.5 shadow-md transition ring-2 ring-emerald-300';
      } else {
        btn.className = 'p-2.5 rounded-xl font-bold border-2 border-emerald-600 bg-emerald-50 text-emerald-800 flex items-center justify-center gap-1.5 shadow-xs transition ring-1 ring-emerald-300';
      }
    } else {
      if (r === 'FARMER') {
        btn.className = 'col-span-2 sm:col-span-1 p-2.5 rounded-xl font-bold border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition';
      } else {
        btn.className = 'p-2.5 rounded-xl font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition';
      }
    }
  });
}

async function requestPhoneOtp() {
  const phoneInput = document.getElementById('authInputPhone');
  const nameInput = document.getElementById('authInputFullName');

  let rawPhone = phoneInput ? phoneInput.value.trim() : '';
  let cleanDigits = rawPhone.replace(/\D/g, '');
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    cleanDigits = cleanDigits.substring(2);
  }
  if (cleanDigits.length !== 10) {
    showToast('Please enter a valid 10-digit mobile phone number', 'warning');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const normalizedPhone = `+91${cleanDigits}`;
  const fullName = nameInput ? nameInput.value.trim() : '';
  const role = state.authModalRole || 'FARMER';

  try {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: normalizedPhone,
        role: role,
        full_name: fullName || undefined
      })
    });

    const data = await res.json();
    if (res.ok) {
      const step1 = document.getElementById('otpStep1');
      const step2 = document.getElementById('otpStep2');
      if (step1) step1.classList.add('hidden');
      if (step2) step2.classList.remove('hidden');

      const phoneDisp = document.getElementById('authOtpPhoneDisplay');
      if (phoneDisp) phoneDisp.innerText = data.phone_number;

      const otpInput = document.getElementById('authInputOtpCode');
      if (otpInput) {
        otpInput.value = data.demo_otp || '123456';
        otpInput.focus();
      }

      showToast(`📲 OTP Sent: ${data.demo_otp || '123456'} (SMS simulation active)`, 'success');
    } else {
      showToast(data.detail || 'Failed to dispatch SMS OTP', 'error');
    }
  } catch (err) {
    console.error('OTP send request error:', err);
    showToast('Network error while requesting phone OTP', 'error');
  }
}

async function submitPhoneOtp() {
  const phoneInput = document.getElementById('authInputPhone');
  const nameInput = document.getElementById('authInputFullName');
  const otpInput = document.getElementById('authInputOtpCode');

  let rawPhone = phoneInput ? phoneInput.value.trim() : '';
  let cleanDigits = rawPhone.replace(/\D/g, '');
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    cleanDigits = cleanDigits.substring(2);
  }
  const normalizedPhone = `+91${cleanDigits}`;
  const otpCode = otpInput ? otpInput.value.trim() : '';
  const fullName = nameInput ? nameInput.value.trim() : '';
  const role = state.authModalRole || 'FARMER';

  if (!otpCode || otpCode.length < 4) {
    showToast('Please enter the 6-digit verification code', 'warning');
    if (otpInput) otpInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: normalizedPhone,
        otp_code: otpCode,
        role: role,
        full_name: fullName || undefined
      })
    });

    const data = await res.json();
    if (res.ok) {
      state.token = data.access_token;
      state.user = {
        id: data.user_id,
        email: data.email,
        phone_number: data.phone_number,
        role: data.role,
        full_name: data.full_name,
        preferred_language: data.preferred_language
      };
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));

      closePhoneLoginModal();
      localStorage.setItem('farmer_otp_verified', 'true');
      state.isFarmerVerified = true;
      updateUserUI();
      applyFarmerGateState();

      // Route to view based on authenticated role
      const targetTab = getRoleDefaultTab(data.role);
      switchTab(targetTab);
      if (data.role === 'FARMER') {
        loadDashboardData();
      }

      showToast(`Verified! Welcome ${data.full_name} (${data.role})`, 'success');
    } else {
      showToast(data.detail || 'Invalid or expired OTP code', 'error');
    }
  } catch (err) {
    console.error('OTP verify request error:', err);
    showToast('Network error while verifying OTP', 'error');
  }
}

// Direct demo logins disabled — users must sign in or create an account with their selected role
async function quickDemoPhoneLogin(role = 'FARMER') {
  openRegistrationInterface('signin');
  selectSignInRole(role);
}
const quickDemoLegacyLogin = quickDemoPhoneLogin;
const quickDemoLogin = quickDemoPhoneLogin;

// ----------------------------------------------------
// FARMER PORTAL ON-SCREEN MOBILE OTP SECURITY GATE
// ----------------------------------------------------

async function requestGateOtp() {
  const phoneInput = document.getElementById('gateInputPhone');
  const nameInput = document.getElementById('gateInputFullName');

  let rawPhone = phoneInput ? phoneInput.value.trim() : '';
  let cleanDigits = rawPhone.replace(/\D/g, '');
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    cleanDigits = cleanDigits.substring(2);
  }
  if (cleanDigits.length !== 10) {
    showToast('Please enter a valid 10-digit mobile phone number', 'warning');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const normalizedPhone = `+91${cleanDigits}`;
  const fullName = nameInput ? nameInput.value.trim() : 'Farmer';

  try {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: normalizedPhone,
        role: 'FARMER',
        full_name: fullName
      })
    });

    const data = await res.json();
    if (res.ok) {
      const s1 = document.getElementById('gateStep1');
      const s2 = document.getElementById('gateStep2');
      if (s1) s1.classList.add('hidden');
      if (s2) s2.classList.remove('hidden');

      const phoneDisp = document.getElementById('gateOtpPhoneDisplay');
      if (phoneDisp) phoneDisp.innerText = data.phone_number;

      const otpInput = document.getElementById('gateInputOtpCode');
      if (otpInput) {
        otpInput.value = data.demo_otp || '123456';
        otpInput.focus();
      }

      showToast(`📲 OTP Sent to Farmer Mobile: ${data.demo_otp || '123456'}`, 'success');
    } else {
      showToast(data.detail || 'Failed to dispatch SMS OTP', 'error');
    }
  } catch (err) {
    console.error('Gate OTP request error:', err);
    showToast('Network error while requesting phone OTP', 'error');
  }
}

// ==============================================================================
// 1ST SCREEN: SIGN UP & NEW USER REGISTRATION CONTROLLER
// ==============================================================================

function switchFirstScreenAuthTab(tab) {
  const btnSignup = document.getElementById('authTabBtn-signup');
  const btnSignin = document.getElementById('authTabBtn-signin');
  const tabSignup = document.getElementById('tabContent-signup');
  const tabSignin = document.getElementById('tabContent-signin');

  if (tab === 'signup') {
    if (btnSignup) {
      btnSignup.className = 'px-4 py-2 rounded-xl text-xs font-black transition shadow-xs bg-white text-emerald-800 border border-slate-200 flex items-center gap-1.5';
    }
    if (btnSignin) {
      btnSignin.className = 'px-4 py-2 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5';
    }
    if (tabSignup) tabSignup.classList.remove('hidden');
    if (tabSignin) tabSignin.classList.add('hidden');
  } else {
    if (btnSignup) {
      btnSignup.className = 'px-4 py-2 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5';
    }
    if (btnSignin) {
      btnSignin.className = 'px-4 py-2 rounded-xl text-xs font-black transition shadow-xs bg-white text-emerald-800 border border-slate-200 flex items-center gap-1.5';
    }
    if (tabSignup) tabSignup.classList.add('hidden');
    if (tabSignin) tabSignin.classList.remove('hidden');
  }
}

function openRegistrationInterface(tab = 'signup') {
  document.querySelectorAll('.app-section').forEach(sec => sec.classList.add('hidden'));
  const dashSec = document.getElementById('section-dashboard');
  if (dashSec) dashSec.classList.remove('hidden');

  const dashPrivate = document.getElementById('farmerPrivateDashboard');
  if (dashPrivate) dashPrivate.classList.add('hidden');

  if (tab === 'signin') {
    showSignInForm();
  } else {
    showSignUpForm();
  }
  const portal = document.getElementById('firstScreenAuthPortal');
  if (portal) {
    portal.classList.remove('hidden');
    portal.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function showSignUpForm() {
  const portal = document.getElementById('firstScreenAuthPortal');
  const banner = document.getElementById('activeSessionBanner');
  const tabSignup = document.getElementById('tabContent-signup');
  const tabSignin = document.getElementById('tabContent-signin');

  if (portal) portal.classList.remove('hidden');
  if (banner) banner.classList.add('hidden');
  if (tabSignup) tabSignup.classList.remove('hidden');
  if (tabSignin) tabSignin.classList.add('hidden');
  switchFirstScreenAuthTab('signup');
  const nameInput = document.getElementById('regFullName');
  if (nameInput) nameInput.focus();
}

function showSignInForm() {
  const portal = document.getElementById('firstScreenAuthPortal');
  const banner = document.getElementById('activeSessionBanner');
  const tabSignup = document.getElementById('tabContent-signup');
  const tabSignin = document.getElementById('tabContent-signin');

  if (portal) portal.classList.remove('hidden');
  if (banner) banner.classList.add('hidden');
  if (tabSignup) tabSignup.classList.add('hidden');
  if (tabSignin) tabSignin.classList.remove('hidden');
  switchFirstScreenAuthTab('signin');
  const emailInput = document.getElementById('signinEmail');
  if (emailInput) emailInput.focus();
}

function togglePasswordVisibility(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ----------------------------------------------------
// REAL DEVICE FINGERPRINT BIOMETRIC SENSOR (WEBAUTHN API / TOUCH ID)
// ----------------------------------------------------

// ==============================================================
// INTERACTIVE LIVE BIOMETRIC FINGERPRINT SCANNER (MOBILE & PC)
// NO USB / PASSKEY PROMPTS - STRICT FARMER SECURITY ISOLATION
// ==============================================================

let liveFingerprintTimer = null;
let liveFingerprintProgress = 0;
let liveFingerprintMode = 'verify'; // 'enroll' or 'verify'
let autoSubmitAfterFingerprint = false;
let liveAudioCtx = null;
let fingerprintListenersBound = false;
let isProcessingFingerTouch = false;

function playScannerAudioBeep(freq = 600, type = 'sine', duration = 0.08) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!liveAudioCtx) liveAudioCtx = new AudioContext();
    if (liveAudioCtx.state === 'suspended') liveAudioCtx.resume();

    const osc = liveAudioCtx.createOscillator();
    const gain = liveAudioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, liveAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, liveAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, liveAudioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(liveAudioCtx.destination);
    osc.start();
    osc.stop(liveAudioCtx.currentTime + duration);
  } catch (e) {}
}

function playSuccessChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!liveAudioCtx) liveAudioCtx = new AudioContext();
    if (liveAudioCtx.state === 'suspended') liveAudioCtx.resume();

    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => {
        const osc = liveAudioCtx.createOscillator();
        const gain = liveAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, liveAudioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, liveAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, liveAudioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(liveAudioCtx.destination);
        osc.start();
        osc.stop(liveAudioCtx.currentTime + 0.35);
      }, idx * 90);
    });
  } catch (e) {}
}

// Biometric authentication (fingerprint and face) removed as per user request
function openLiveFingerprintModal() {}
function closeLiveFingerprintModal() {}
function openLiveFaceModal() {}
function closeLiveFaceModal() {}
function updateBiometricSummaryBadge() {}
const scanAndEnrollFingerprint = () => {};
const performBiometricLogin = () => {};

// ----------------------------------------------------
// REGISTRATION & SIGN IN WITH GMAIL + PASSWORD + LIVE FINGERPRINT
// STRICT ISOLATION: ONE FARMER CANNOT USE ANOTHER'S PORTAL
// ----------------------------------------------------

function handleRegRoleChange() {
  const roleSelect = document.getElementById('regRole');
  const selectedRole = roleSelect ? roleSelect.value : 'FARMER';
  const leafExpertContainer = document.getElementById('regLeafExpertContainer');
  const farmNameInput = document.getElementById('regFarmName');

  if (leafExpertContainer) {
    if (selectedRole === 'AGRICULTURAL_EXPERT') {
      leafExpertContainer.classList.remove('hidden');
    } else {
      leafExpertContainer.classList.add('hidden');
      if (farmNameInput) farmNameInput.value = '';
    }
  }
}

async function submitRegistrationWithPassword() {
  const nameInput = document.getElementById('regFullName');
  const emailInput = document.getElementById('regEmail');
  const phoneInput = document.getElementById('regPhone');
  const passInput = document.getElementById('regPassword');
  const confirmPassInput = document.getElementById('regConfirmPassword');
  const roleSelect = document.getElementById('regRole');
  const farmNameInput = document.getElementById('regFarmName');
  const locationInput = document.getElementById('regLocation');
  const landAreaInput = document.getElementById('regLandArea');
  const cropsInput = document.getElementById('regCrops');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  let rawPhone = phoneInput ? phoneInput.value.trim() : '';
  let cleanDigits = rawPhone.replace(/\D/g, '');
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    cleanDigits = cleanDigits.substring(2);
  }
  const phone = cleanDigits ? `+91${cleanDigits}` : null;
  const password = passInput ? passInput.value : '';
  const confirmPassword = confirmPassInput ? confirmPassInput.value : '';
  const role = roleSelect ? roleSelect.value : 'FARMER';
  const leafExpertOrEst = (role === 'AGRICULTURAL_EXPERT' && farmNameInput) ? farmNameInput.value.trim() : '';
  const location = locationInput ? locationInput.value.trim() : 'Khordha, Odisha';

  // Strict Validation
  if (!fullName) {
    showToast('Please enter your full name', 'warning');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid Gmail ID / Email Address', 'warning');
    if (emailInput) emailInput.focus();
    return;
  }
  if (!password || password.length < 4) {
    showToast('Please create a password of at least 4 characters', 'warning');
    if (passInput) passInput.focus();
    return;
  }
  if (password !== confirmPassword) {
    showToast('Passwords do not match! Please confirm your password correctly.', 'error');
    if (confirmPassInput) confirmPassInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
        full_name: fullName,
        phone_number: phone,
        role: role,
        leaf_disease_expert: leafExpertOrEst,
        farm_name: leafExpertOrEst,
        location: location
      })
    });

    const data = await res.json();
    if (res.ok) {
      state.token = data.access_token;
      state.user = {
        id: data.user_id,
        email: data.email,
        phone_number: data.phone_number || phone,
        role: data.role,
        full_name: data.full_name || fullName,
        preferred_language: data.preferred_language || 'en',
        specialization: data.specialization || leafExpertOrEst || 'Crop Leaf Disease Specialist',
        farm_name: data.farm_name || leafExpertOrEst || `${fullName}'s Farm`,
        location: location
      };
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
      localStorage.setItem('farmer_otp_verified', 'true');
      state.isFarmerVerified = true;

      // Update dashboard UI labels
      const farmNameEl = document.getElementById('dashFarmName');
      if (farmNameEl) farmNameEl.innerText = state.user.farm_name;
      const farmLocEl = document.getElementById('dashFarmLoc');
      if (farmLocEl) farmLocEl.innerText = location || 'Local Field';

      updateUserUI();
      applyFarmerGateState();
      const targetTab = getRoleDefaultTab(data.role);
      switchTab(targetTab);
      if (data.role === 'FARMER') {
        loadDashboardData();
      }

      showToast(`🎉 Account Created! Welcome ${data.full_name} (${data.role}).`, 'success');
    } else {
      showToast(data.detail || 'Registration failed. Please verify credentials.', 'error');
    }
  } catch (err) {
    console.error('Registration error:', err);
    showToast('Network error during user registration', 'error');
  }
}

function selectSignInRole(role) {
  state.signinSelectedRole = role || 'FARMER';
  const roleInput = document.getElementById('signinRole');
  if (roleInput) roleInput.value = state.signinSelectedRole;

  const roleLabels = {
    'FARMER': 'Create / Sign In as Farmer & Open Farmer Interface',
    'AGRICULTURAL_EXPERT': 'Create / Sign In as Expert & Open Expert Advice Interface',
    'BUYER': 'Create / Sign In as Buyer & Open Buyer Portal Interface',
    'ADMIN': 'Create / Sign In as Admin & Open Admin Portal Interface'
  };

  const btnLabel = document.getElementById('signinSubmitBtnLabel');
  if (btnLabel) {
    btnLabel.innerText = roleLabels[state.signinSelectedRole] || 'Create / Sign In to Selected Role Portal';
  }

  // Show "Leaf Disease Expert (Specialist Crop / Disease)" ONLY when Expert is selected; hide completely for Farmer / Buyer / Admin
  const signinLeafExpertContainer = document.getElementById('signinLeafExpertContainer');
  const signinLeafExpertInput = document.getElementById('signinLeafExpert');
  if (signinLeafExpertContainer) {
    if (state.signinSelectedRole === 'AGRICULTURAL_EXPERT') {
      signinLeafExpertContainer.classList.remove('hidden');
    } else {
      signinLeafExpertContainer.classList.add('hidden');
      if (signinLeafExpertInput) signinLeafExpertInput.value = '';
    }
  }

  const allRoles = ['FARMER', 'AGRICULTURAL_EXPERT', 'BUYER', 'ADMIN'];
  allRoles.forEach(r => {
    const card = document.getElementById(`signinRoleCard-${r}`);
    if (!card) return;
    if (r === state.signinSelectedRole) {
      card.className = 'signin-role-card p-3 rounded-xl border-2 border-emerald-600 bg-emerald-600 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md transition ring-2 ring-emerald-300';
    } else {
      card.className = 'signin-role-card p-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs flex flex-col items-center justify-center gap-1 transition';
    }
  });
}

async function submitSignInWithPassword() {
  const emailInput = document.getElementById('signinEmail');
  const passInput = document.getElementById('signinPassword');
  const roleInput = document.getElementById('signinRole');
  const nameInput = document.getElementById('signinFullName');
  const leafExpertInput = document.getElementById('signinLeafExpert');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value : '';
  const selectedRole = (roleInput ? roleInput.value : state.signinSelectedRole) || 'FARMER';
  const enteredName = nameInput ? nameInput.value.trim() : '';
  const enteredLeafExpert = (selectedRole === 'AGRICULTURAL_EXPERT' && leafExpertInput) ? leafExpertInput.value.trim() : '';

  if (!email || !email.includes('@')) {
    showToast('Please enter your registered Gmail ID', 'warning');
    if (emailInput) emailInput.focus();
    return;
  }
  if (!password) {
    showToast('Please enter your password', 'warning');
    if (passInput) passInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
        role: selectedRole,
        full_name: enteredName || undefined,
        leaf_disease_expert: enteredLeafExpert || undefined,
        farm_name: enteredLeafExpert || undefined
      })
    });

    const data = await res.json();
    if (res.ok) {
      const effectiveRole = selectedRole || data.role || 'FARMER';
      state.token = data.access_token;
      state.user = {
        id: data.user_id,
        email: data.email,
        phone_number: data.phone_number,
        role: effectiveRole,
        full_name: data.full_name,
        preferred_language: data.preferred_language || 'en',
        specialization: data.specialization || enteredLeafExpert || 'Crop Leaf Disease Specialist',
        farm_name: data.farm_name || enteredLeafExpert || `${data.full_name}'s Farm`
      };
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
      localStorage.setItem('farmer_otp_verified', 'true');
      state.isFarmerVerified = true;

      updateUserUI();
      applyFarmerGateState();

      const targetTab = getRoleDefaultTab(effectiveRole);
      switchTab(targetTab);
      if (effectiveRole === 'FARMER') {
        loadDashboardData();
      }

      showToast(`🔓 Sign In Successful! Welcome ${data.full_name} (${effectiveRole}).`, 'success');
    } else {
      const errorMsg = data.detail || 'Incorrect password or Gmail ID. Access denied.';
      showToast(`🚫 Unauthorized Access Blocked: ${errorMsg}`, 'error');

      // Visual shake effect on signin password
      if (passInput) {
        passInput.classList.add('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-400');
        setTimeout(() => {
          passInput.classList.remove('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-400');
        }, 3000);
        passInput.focus();
      }
    }
  } catch (err) {
    console.error('submitSignInWithPassword error:', err);
    showToast('Network error while verifying sign in credentials', 'error');
  }
}

// ----------------------------------------------------
// VISUAL LOCKING & GATE STATE CONTROLLER
// ----------------------------------------------------

function updateNavTabsLockVisual(isUnlocked) {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (tab === 'dashboard') return;
    if (isUnlocked) {
      btn.classList.remove('opacity-60', 'cursor-not-allowed');
      btn.removeAttribute('title');
      const lockBadge = btn.querySelector('.nav-lock-badge');
      if (lockBadge) lockBadge.remove();
    } else {
      btn.classList.add('opacity-60', 'cursor-not-allowed');
      btn.setAttribute('title', 'Sign In or Register with Gmail & Password to unlock this feature');
      if (!btn.querySelector('.nav-lock-badge')) {
        const lock = document.createElement('span');
        lock.className = 'nav-lock-badge text-3xs ml-1 text-amber-500 font-bold';
        lock.innerText = '🔒';
        btn.appendChild(lock);
      }
    }
  });
}

function applyFarmerGateState() {
  const isAuth = isUserAuthenticated();
  const role = state.user ? state.user.role : 'FARMER';
  const portalEl = document.getElementById('firstScreenAuthPortal');
  const bannerEl = document.getElementById('activeSessionBanner');
  const tabSignupEl = document.getElementById('tabContent-signup');
  const tabSigninEl = document.getElementById('tabContent-signin');
  const dashEl = document.getElementById('farmerPrivateDashboard');
  const navEl = document.getElementById('mainAppNav');
  const headerProfileBadge = document.getElementById('headerUserProfileBadge');

  if (isAuth) {
    if (headerProfileBadge) {
      headerProfileBadge.classList.remove('hidden');
      headerProfileBadge.classList.add('flex');
    }
    // Only show Farmer Private Dashboard & Farmer Session Banner if role is strictly FARMER
    if (dashEl) {
      if (role === 'FARMER') {
        dashEl.classList.remove('hidden');
      } else {
        dashEl.classList.add('hidden');
      }
    }
    if (bannerEl) {
      if (role === 'FARMER') {
        bannerEl.classList.remove('hidden');
      } else {
        bannerEl.classList.add('hidden');
      }
    }
    if (portalEl) portalEl.classList.add('hidden');
    if (tabSignupEl) tabSignupEl.classList.add('hidden');
    if (tabSigninEl) tabSigninEl.classList.add('hidden');
    if (navEl) navEl.classList.remove('hidden');

    const nameSession = document.getElementById('activeSessionName');
    const roleSession = document.getElementById('activeSessionRole');
    const emailSession = document.getElementById('activeSessionEmail');
    const farmSession = document.getElementById('activeSessionFarm');
    if (nameSession) nameSession.innerText = state.user.full_name || 'Farmer Account';
    if (roleSession) roleSession.innerText = state.user.role || 'FARMER';
    if (emailSession) emailSession.innerText = state.user.email || '--';
    if (farmSession) farmSession.innerText = state.user.farm_name || 'My Farm';

    const phoneBadge = document.getElementById('dashVerifiedPhone');
    const nameBadge = document.getElementById('dashVerifiedName');
    const farmNameEl = document.getElementById('dashFarmName');
    if (phoneBadge) phoneBadge.innerText = state.user.phone_number || state.user.email || '--';
    if (nameBadge) nameBadge.innerText = state.user.full_name || 'Farmer Account';
    if (farmNameEl && state.user.farm_name) farmNameEl.innerText = state.user.farm_name;

    // Update role-specific portal header user names & specialist badges
    const expName = document.getElementById('expertPortalUserName');
    const expBadge = document.getElementById('expertPortalSpecialistBadge');
    if (role === 'AGRICULTURAL_EXPERT') {
      const specText = state.user.specialization || 'Crop Leaf Disease Specialist';
      if (expName) expName.innerText = `${state.user.full_name} — ${specText}`;
      if (expBadge) expBadge.innerText = `🌿 ${specText}`;
    }
    const buyName = document.getElementById('buyerPortalUserName');
    if (buyName && role === 'BUYER') buyName.innerText = state.user.full_name;
    const admName = document.getElementById('adminPortalUserName');
    if (admName && role === 'ADMIN') admName.innerText = state.user.full_name;

    adjustNavigationForRole();
    updateNavTabsLockVisual(true);
  } else {
    // 1st screen presentation for new / unverified user: strictly show Sign Up / Sign In portal
    if (headerProfileBadge) {
      headerProfileBadge.classList.add('hidden');
      headerProfileBadge.classList.remove('flex');
    }
    if (dashEl) dashEl.classList.add('hidden');
    if (bannerEl) bannerEl.classList.add('hidden');
    if (portalEl) portalEl.classList.remove('hidden');
    if (tabSignupEl) tabSignupEl.classList.remove('hidden');
    if (tabSigninEl) tabSigninEl.classList.add('hidden');
    if (navEl) navEl.classList.add('hidden');

    updateNavTabsLockVisual(false);
  }
}

function logoutFarmerSession() {
  localStorage.removeItem('farmer_otp_verified');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('biometric_token');
  localStorage.removeItem('face_token');
  localStorage.removeItem('active_login_biometric');
  localStorage.removeItem('active_login_face');
  state.token = '';
  state.user = null;
  state.isFarmerVerified = false;
  state.enrolledBiometricToken = null;
  state.enrolledFaceToken = null;
  state.activeLoginBiometricToken = null;
  state.activeLoginFaceToken = null;

  // Clear all input fields so no credentials remain visible
  ['signinEmail', 'signinPassword', 'signinFullName', 'signinLeafExpert', 'regFullName', 'regEmail', 'regPhone', 'regPassword', 'regConfirmPassword', 'regFarmName', 'regLocation', 'regLandArea', 'regCrops'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const regRoleSelect = document.getElementById('regRole');
  if (regRoleSelect) regRoleSelect.value = 'FARMER';
  handleRegRoleChange();
  selectSignInRole('FARMER');

  updateUserUI();
  applyFarmerGateState();
  switchTab('dashboard');
  showSignUpForm();
  showToast('🔒 Session locked and signed out. Please Sign In or Register to access website.', 'info');
}

function promptFarmerLoginOrSwitch() {
  switchTab('dashboard');
  if (!isUserAuthenticated()) {
    applyFarmerGateState();
    showSignUpForm();
    const nameInput = document.getElementById('regFullName');
    if (nameInput) nameInput.focus();
  }
}

function updateUserUI() {
  const nameEl = document.getElementById('headerUserName');
  const roleEl = document.getElementById('headerUserRole');
  const headerProfileBadge = document.getElementById('headerUserProfileBadge');
  if (state.user && isUserAuthenticated()) {
    if (nameEl) nameEl.innerText = state.user.full_name;
    if (roleEl) roleEl.innerText = state.user.role;
    if (headerProfileBadge) {
      headerProfileBadge.classList.remove('hidden');
      headerProfileBadge.classList.add('flex');
    }
  } else {
    if (nameEl) nameEl.innerText = '--';
    if (roleEl) roleEl.innerText = '--';
    if (headerProfileBadge) {
      headerProfileBadge.classList.add('hidden');
      headerProfileBadge.classList.remove('flex');
    }
  }

  // Adjust visible navigation items strictly according to role
  adjustNavigationForRole();
}

function adjustNavigationForRole() {
  const role = state.user ? state.user.role : 'FARMER';
  document.querySelectorAll('#mainAppNav .nav-tab').forEach(btn => {
    const tabRoleGroup = btn.getAttribute('data-role-group') || 'FARMER';
    if (tabRoleGroup === role) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  });
}

function getTabDisplayName(tabId) {
  const names = {
    'scanner': 'Check Plant Disease Scanner',
    'copilot': 'AI Co-Pilot Voice Assistant',
    'soil': 'Soil Health & NPK Analyzer',
    'business': 'Farm Business Planner',
    'market': 'Market Optimizer',
    'marketplace': 'Sell Produce Marketplace',
    'expert_portal': 'Expert Advice Portal',
    'buyer_portal': 'Buyer Procurement Portal',
    'admin_portal': 'System Admin Portal',
    'my_farm': 'My Smart Farm'
  };
  return names[tabId] || tabId;
}

// Navigation Tabs with Strict Unauthenticated Access Gate & Strict Role Isolation
function switchTab(tabId) {
  // STRICT GATE: If user is not authenticated and tries to open any tab other than dashboard
  if (!isUserAuthenticated() && tabId !== 'dashboard') {
    const tabName = getTabDisplayName(tabId);
    showToast(`🔒 Access Restricted: Please Sign Up or Sign In with your Gmail ID and Password first to unlock ${tabName}!`, 'warning');
    tabId = 'dashboard';
    const portal = document.getElementById('firstScreenAuthPortal');
    if (portal) {
      portal.classList.remove('hidden');
      portal.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  // STRICT ROLE ISOLATION: Ensure authenticated user only accesses tabs belonging to their role
  if (isUserAuthenticated() && state.user && state.user.role) {
    const role = state.user.role;
    const allowed = ROLE_ALLOWED_TABS[role] || ['dashboard'];
    if (!allowed.includes(tabId)) {
      tabId = getRoleDefaultTab(role);
    }
  }

  state.activeTab = tabId;
  document.querySelectorAll('.app-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(`section-${tabId}`);
  if (target) target.classList.remove('hidden');

  // Update navigation active state
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('border-emerald-600', 'text-emerald-700', 'font-bold', 'bg-emerald-50');
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('border-emerald-600', 'text-emerald-700', 'font-bold', 'bg-emerald-50');
    }
  });

  // Tab specific data loads
  if (tabId === 'dashboard') {
    applyFarmerGateState();
    if (isUserAuthenticated() && state.user?.role === 'FARMER') {
      loadDashboardData();
    }
  }
  else if (tabId === 'scanner') initScannerView();
  else if (tabId === 'copilot') initCopilotView();
  else if (tabId === 'soil') initSoilView();
  else if (tabId === 'business') initBusinessView();
  else if (tabId === 'market') initMarketView();
  else if (tabId === 'marketplace') initMarketplaceView();
  else if (tabId === 'expert_portal') initExpertPortalView();
  else if (tabId === 'buyer_portal') initBuyerPortalView();
  else if (tabId === 'admin_portal') initAdminPortalView();
  else if (tabId === 'my_farm') initMyFarmView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// API Helper
async function apiFetch(endpoint, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  const response = await fetch(`/api${endpoint}`, { ...options, headers });
  if (response.status === 401) {
    // Session expired
    if (isUserAuthenticated()) {
      showToast('Session expired. Please sign in with your password again.', 'warning');
      logoutFarmerSession();
    }
  }
  return response;
}

// Toast Notifications
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  const toastText = document.getElementById('toastText');
  const toastIcon = document.getElementById('toastIcon');

  toast.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 text-white font-medium ';
  if (type === 'success') toast.className += 'bg-emerald-700';
  else if (type === 'error') toast.className += 'bg-red-600';
  else if (type === 'warning') toast.className += 'bg-amber-600';
  else toast.className += 'bg-slate-800';

  if (toastText) toastText.innerText = msg;
  toast.classList.remove('hidden', 'opacity-0');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 4000);
}

// ----------------------------------------------------
// 1. DASHBOARD MODULE & LIVE GPS WEATHER INTELLIGENCE
// ----------------------------------------------------
async function loadDashboardData() {
  try {
    // 1. Fetch Localized Weather & Microclimate Risk Alerts for Farmer's Location
    const wUrl = (state.currentLat && state.currentLon)
      ? `/weather?lat=${state.currentLat}&lon=${state.currentLon}&location_name=${encodeURIComponent(state.currentLocationName || '')}`
      : '/weather';

    const wRes = await apiFetch(wUrl);
    if (wRes.ok) {
      const wData = await wRes.json();
      renderWeatherWidget(wData.weather);
      renderSmartAlerts(wData.smart_alerts);
    }

    // 2. Fetch Farms & Fields
    const fRes = await apiFetch('/farms');
    if (fRes.ok) {
      const farms = await fRes.json();
      if (farms.length > 0) {
        state.activeFarmId = farms[0].id;
        renderFarmsWidget(farms[0]);
      }
    }

    // 3. Fetch Expenses & Income Summary
    const expRes = await apiFetch('/expenses/summary');
    if (expRes.ok) {
      const expData = await expRes.json();
      const expEl = document.getElementById('dashTotalExpenses');
      if (expEl) expEl.innerText = `₹${expData.total_expenses.toLocaleString()}`;
    }

    const incRes = await apiFetch('/income/summary');
    if (incRes.ok) {
      const incData = await incRes.json();
      const incEl = document.getElementById('dashNetIncome');
      if (incEl) incEl.innerText = `₹${incData.total_net_income.toLocaleString()}`;
    }

    // Attempt automatic live location sync if browser permissions allow
    checkAndAutoSyncLiveLocation();
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

// Helper: Reverse Geocoding via BigDataCloud free client API
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      const district = data.localityInfo?.administrative?.find(a => a.adminLevel === 5)?.name || '';
      const stateName = data.principalSubdivision || '';
      if (city && district && district !== city) return `${city}, ${district}, ${stateName}`;
      if (city && stateName) return `${city}, ${stateName}`;
      if (city) return city;
    }
  } catch (e) {
    console.warn('Reverse geocoding error:', e);
  }
  return `Live Field (${lat}° N, ${lon}° E)`;
}

// Client-side direct Open-Meteo fallback for zero-latency live weather
async function fetchDirectOpenMeteo(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&forecast_days=3&timezone=auto`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const cur = data.current || {};
      const daily = data.daily || {};
      const hourly = data.hourly || {};
      const dailyProbs = daily.precipitation_probability_max || [];
      const todayProb = dailyProbs[0] || 0;
      const curTime = cur.time || '';
      const hTimes = hourly.time || [];
      const hProbs = hourly.precipitation_probability || [];
      let curProb = todayProb;
      if (curTime && hTimes.includes(curTime)) {
        curProb = hProbs[hTimes.indexOf(curTime)];
      }
      const effProb = Math.max(curProb, Math.round(todayProb * 0.8));

      const wmoMap = {
        0: 'Clear Sky ☀️', 1: 'Mainly Clear 🌤️', 2: 'Partly Cloudy ⛅', 3: 'Overcast ☁️',
        45: 'Foggy 🌫️', 51: 'Light Drizzle 🌦️', 53: 'Moderate Drizzle 🌦️', 55: 'Dense Drizzle 🌧️',
        61: 'Slight Rain 🌧️', 63: 'Moderate Rain 🌧️', 65: 'Heavy Rain ⛈️',
        80: 'Rain Showers 🌦️', 81: 'Heavy Showers 🌧️', 95: 'Thunderstorm ⚡⛈️'
      };
      const cond = wmoMap[cur.weather_code] || 'Partly Cloudy ⛅';

      return {
        source: 'Open-Meteo Live Satellite Direct',
        temperature: cur.temperature_2m,
        apparent_temperature: cur.apparent_temperature || cur.temperature_2m,
        humidity: cur.relative_humidity_2m,
        wind_speed_kmh: cur.wind_speed_10m || 10,
        rain_probability_pct: effProb,
        rain_probability_max_today: todayProb,
        rainfall_mm: (daily.precipitation_sum && daily.precipitation_sum[0]) || 0,
        condition: cond,
        weather_code: cur.weather_code || 2
      };
    }
  } catch (e) {
    console.warn('Client direct Open-Meteo fetch error:', e);
  }
  return null;
}

// Share Farmer Live GPS Location (Real-time Exact Coordinates, Real Temp & Rain Chance)
async function shareLiveLocation() {
  const btn = document.getElementById('btnShareLiveGps');
  const statusEl = document.getElementById('dashLiveGpsStatus');
  const accEl = document.getElementById('dashGpsAccuracy');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>📡</span> <span>Connecting Satellite GPS & Radar...</span>';
  }

  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser. Using Regional Agro-Station coordinates.', 'warning');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>📍</span> <span>Share Live GPS Location</span>';
    }
    return;
  }

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = parseFloat(position.coords.latitude.toFixed(4));
      const lon = parseFloat(position.coords.longitude.toFixed(4));
      const acc = Math.round(position.coords.accuracy || 10);

      // Perform real reverse geocoding to resolve exact city and district
      const detectedCity = await reverseGeocode(lat, lon);
      const liveName = detectedCity || `Live GPS (${lat}° N, ${lon}° E)`;

      state.currentLat = lat;
      state.currentLon = lon;
      state.currentLocationName = liveName;

      const farmNameEl = document.getElementById('dashFarmName');
      if (farmNameEl) farmNameEl.innerText = 'Kishan Smart Farm';

      const farmLocEl = document.getElementById('dashFarmLoc');
      if (farmLocEl) farmLocEl.innerText = `${liveName} (Live GPS)`;

      const weatherLocEl = document.getElementById('dashWeatherLocation');
      if (weatherLocEl) weatherLocEl.innerText = liveName;

      const coordsEl = document.getElementById('dashWeatherCoords');
      if (coordsEl) coordsEl.innerText = `${lat}° N, ${lon}° E`;

      if (statusEl) {
        statusEl.innerText = `📍 Live GPS Fix: ${liveName} (${lat}° N, ${lon}° E)`;
      }
      if (accEl) {
        accEl.innerText = `Satellite Fix Accuracy: ±${acc}m (High Precision)`;
        accEl.className = 'text-3xs text-emerald-800 font-mono bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold';
      }

      // Sync GPS with Farmer's active farm record in backend
      try {
        await apiFetch('/farms/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farm_id: state.activeFarmId,
            latitude: lat,
            longitude: lon,
            location_name: liveName
          })
        });
      } catch (e) {
        console.error('Failed to sync location to backend farm:', e);
      }

      // Fetch real weather and recalculate risk alerts for shared live location
      await fetchLocalizedWeather(lat, lon, liveName);

      const rainVal = document.getElementById('dashWeatherRain')?.innerText || '--%';
      const tempVal = document.getElementById('dashWeatherTemp')?.innerText || '--°C';

      showToast(`📍 Live GPS Connected: ${liveName}! Real Temp: ${tempVal}, Rain Chance (बारिश): ${rainVal}.`, 'success');

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📍</span> <span>Share Live GPS Location</span>';
      }
    },
    async (error) => {
      console.warn('Geolocation error / permission fallback:', error.message);
      // Fallback for desktop / sandbox / permission denied: Use selected regional agro-zone
      const select = document.getElementById('selectQuickAgroZone');
      const val = select ? select.value : '20.2961,85.8245,Khordha / Bhubaneswar (Central)';
      const [latStr, lonStr, zoneName] = val.split(',');
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      state.currentLat = lat;
      state.currentLon = lon;
      state.currentLocationName = zoneName;

      const farmNameEl = document.getElementById('dashFarmName');
      if (farmNameEl) farmNameEl.innerText = 'Kishan Smart Farm';

      const farmLocEl = document.getElementById('dashFarmLoc');
      if (farmLocEl) farmLocEl.innerText = zoneName;

      const weatherLocEl = document.getElementById('dashWeatherLocation');
      if (weatherLocEl) weatherLocEl.innerText = zoneName;

      const coordsEl = document.getElementById('dashWeatherCoords');
      if (coordsEl) coordsEl.innerText = `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;

      if (statusEl) {
        statusEl.innerText = `📍 Regional Agro-Zone: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E (${zoneName})`;
      }
      if (accEl) {
        accEl.innerText = `Station Fix: Regional Agro-Meteorological Node`;
        accEl.className = 'text-3xs text-blue-800 font-mono bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300 font-semibold';
      }

      await fetchLocalizedWeather(lat, lon, zoneName);

      showToast(`Device GPS prompt bypassed/unavailable. Synchronized with high-precision Agro-Station: ${zoneName}.`, 'info');

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📍</span> <span>Share Live GPS Location</span>';
      }
    },
    geoOptions
  );
}

// Auto-request live location on page load if browser allows
function checkAndAutoSyncLiveLocation() {
  if (!navigator.geolocation) return;
  // If browser permission is available, attempt a low-friction fix
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = parseFloat(pos.coords.latitude.toFixed(4));
      const lon = parseFloat(pos.coords.longitude.toFixed(4));
      const detectedCity = await reverseGeocode(lat, lon);
      state.currentLat = lat;
      state.currentLon = lon;
      state.currentLocationName = detectedCity;
      await fetchLocalizedWeather(lat, lon, detectedCity);
    },
    () => {
      // Permission not yet granted; will sync on button click
    },
    { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false }
  );
}

// Preset Agricultural Zones in Odisha
async function changeAgroZonePreset(val) {
  if (!val) return;
  const [latStr, lonStr, zoneName] = val.split(',');
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  state.currentLat = lat;
  state.currentLon = lon;
  state.currentLocationName = zoneName;

  const farmNameEl = document.getElementById('dashFarmName');
  if (farmNameEl) farmNameEl.innerText = 'Kishan Smart Farm';

  const farmLocEl = document.getElementById('dashFarmLoc');
  if (farmLocEl) farmLocEl.innerText = zoneName;

  const weatherLocEl = document.getElementById('dashWeatherLocation');
  if (weatherLocEl) weatherLocEl.innerText = zoneName;

  const coordsEl = document.getElementById('dashWeatherCoords');
  if (coordsEl) coordsEl.innerText = `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;

  const statusEl = document.getElementById('dashLiveGpsStatus');
  const accEl = document.getElementById('dashGpsAccuracy');

  if (statusEl) {
    statusEl.innerText = `📍 Agro-Zone: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E (${zoneName})`;
  }
  if (accEl) {
    accEl.innerText = `Agro-Climatic Station Sync`;
    accEl.className = 'text-3xs text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300';
  }

  // Sync to farm profile
  try {
    await apiFetch('/farms/update-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farm_id: state.activeFarmId,
        latitude: lat,
        longitude: lon,
        location_name: zoneName
      })
    });
  } catch (e) {
    console.error('Failed to update farm location:', e);
  }

  await fetchLocalizedWeather(lat, lon, zoneName);
  showToast(`Switched microclimate zone to ${zoneName}. Recalculating crop disease risk...`, 'info');
}

// Fetch localized microclimate weather and risk alerts with dual backend & direct fallback
async function fetchLocalizedWeather(lat, lon, locationName) {
  try {
    const url = `/weather?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(locationName || '')}`;
    const res = await apiFetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.weather) {
        renderWeatherWidget(data.weather);
        renderSmartAlerts(data.smart_alerts);
        return;
      }
    }
  } catch (err) {
    console.warn('Backend weather fetch error, attempting direct client fetch:', err);
  }

  // Fallback: Direct client-side Open-Meteo live request
  const directW = await fetchDirectOpenMeteo(lat, lon);
  if (directW) {
    renderWeatherWidget(directW);
  }
}

function renderWeatherWidget(weather) {
  if (!weather) return;
  const tempEl = document.getElementById('dashWeatherTemp');
  const feelsLikeEl = document.getElementById('dashWeatherFeelsLike');
  const rhEl = document.getElementById('dashWeatherHumidity');
  const windEl = document.getElementById('dashWeatherWind');
  const rainEl = document.getElementById('dashWeatherRain');
  const condEl = document.getElementById('dashWeatherCond');
  const locEl = document.getElementById('dashWeatherLocation');
  const coordsEl = document.getElementById('dashWeatherCoords');

  // Mini Glance Widget
  const tempVal = typeof weather.temperature === 'number' ? weather.temperature.toFixed(1) : weather.temperature;
  const feelsVal = typeof weather.apparent_temperature === 'number' ? weather.apparent_temperature.toFixed(1) : tempVal;
  const rainVal = typeof weather.rain_probability_pct === 'number' ? weather.rain_probability_pct.toFixed(0) : (weather.rain_probability_pct || 0);

  if (tempEl) tempEl.innerText = `${tempVal}°C`;
  if (feelsLikeEl) feelsLikeEl.innerText = `Feels like: ${feelsVal}°C`;
  if (rhEl) rhEl.innerText = `${weather.humidity ? weather.humidity.toFixed(0) : '--'}%`;
  if (windEl) windEl.innerText = `${weather.wind_speed_kmh || '--'} km/h`;
  if (rainEl) rainEl.innerText = `${rainVal}%`;
  if (condEl) condEl.innerText = weather.condition || 'Partly Cloudy ⛅';
  if (locEl) locEl.innerText = state.currentLocationName || 'Shared Live Location';
  if (coordsEl && state.currentLat && state.currentLon) {
    coordsEl.innerText = `${state.currentLat.toFixed(2)}° N, ${state.currentLon.toFixed(2)}° E`;
  }

  // Location Tracker Card Summary Bar
  const locCityEl = document.getElementById('locBarCityName');
  const locCondEl = document.getElementById('locBarCondition');
  const locCoordsEl = document.getElementById('locBarCoordinates');
  const locTempEl = document.getElementById('locBarTemp');
  const locRainEl = document.getElementById('locBarRainProb');

  if (locCityEl) locCityEl.innerText = `📍 ${state.currentLocationName || 'Live GPS Location'}`;
  if (locCondEl) locCondEl.innerText = weather.condition || 'Partly Cloudy ⛅';
  if (locCoordsEl && state.currentLat && state.currentLon) {
    locCoordsEl.innerText = `Coordinates: ${state.currentLat}° N, ${state.currentLon}° E (Live GPS Telemetry)`;
  }
  if (locTempEl) locTempEl.innerText = `${tempVal}°C`;
  if (locRainEl) locRainEl.innerText = `${rainVal}%`;
}

function renderSmartAlerts(alerts) {
  const container = document.getElementById('dashAlertsList');
  if (!container) return;
  container.innerHTML = '';

  if (!alerts || alerts.length === 0) {
    container.innerHTML = '<p class="text-sm text-slate-500 py-3">No critical alerts currently active for your fields.</p>';
    return;
  }

  alerts.forEach(a => {
    let icon = '⚠️';
    let borderClass = 'border-amber-400 bg-amber-50';
    if (a.type === 'disease_risk') {
      icon = '🔴';
      borderClass = 'border-red-400 bg-red-50';
    } else if (a.type === 'market') {
      icon = '💰';
      borderClass = 'border-emerald-400 bg-emerald-50';
    }

    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border-l-4 ${borderClass} shadow-sm`;
    card.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">${icon}</span>
        <div class="flex-1">
          <h4 class="font-bold text-slate-800 text-sm md:text-base">${a.title}</h4>
          <p class="text-xs md:text-sm text-slate-600 mt-1">${a.message}</p>
          <div class="mt-2 text-xs font-semibold text-emerald-800 bg-white/70 inline-block px-2.5 py-1 rounded-md border border-slate-200">
            👉 Recommendation: ${a.action}
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderFarmsWidget(farm) {
  const nameEl = document.getElementById('dashFarmName');
  const areaEl = document.getElementById('dashFarmArea');
  const locEl = document.getElementById('dashFarmLoc');

  // Strictly Kishan Smart Farm only (not 'Kisan Smart Farm - Khordha')
  if (nameEl) nameEl.innerText = 'Kishan Smart Farm';
  if (areaEl) areaEl.innerText = `${farm.area} Acres`;
  if (locEl) locEl.innerText = state.currentLocationName || farm.location || 'Shared Live Location';
}

// ----------------------------------------------------
// 2. LEAF DISEASE SCANNER MODULE
// ----------------------------------------------------
let webcamStream = null;

function initScannerView() {
  loadCropsSelector();
  const cropSelect = document.getElementById('scannerCropSelect');
  const currentCrop = document.getElementById('resCropName')?.innerText || cropSelect?.value || '';
  const currentDisease = document.getElementById('resDiseaseName')?.innerText || '';
  loadRegisteredExpertsForScanner(currentCrop !== '---' ? currentCrop : '', currentDisease !== '---' ? currentDisease : '');
  loadFarmerConsultationsHistory();
}

async function loadCropsSelector() {
  const select = document.getElementById('scannerCropSelect');
  if (!select) return;
  if (select.children.length > 0) return; // already loaded

  try {
    const res = await apiFetch('/crops');
    if (res.ok) {
      const crops = await res.json();
      crops.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.innerText = `${c.name} (${c.scientific_name})`;
        if (c.name === 'Tomato') opt.selected = true;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// Sample Specimen Loader
function loadSampleSpecimen(specimenKey) {
  const preview = document.getElementById('scannerImagePreview');
  const previewPlaceholder = document.getElementById('scannerPreviewPlaceholder');
  const analyzeBtn = document.getElementById('analyzeLeafBtn');

  const specimenMap = {
    'tomato_early_blight': '/static/assets/leaf_tomato_early_blight.svg',
    'potato_late_blight': '/static/assets/leaf_potato_late_blight.svg',
    'rice_blast': '/static/assets/leaf_rice_blast.svg',
    'healthy_leaf': '/static/assets/leaf_healthy.svg'
  };

  const cropMap = {
    'tomato_early_blight': 'Tomato',
    'potato_late_blight': 'Potato',
    'rice_blast': 'Rice',
    'healthy_leaf': 'Tomato'
  };

  const url = specimenMap[specimenKey];
  if (!url) return;

  // Set corresponding crop in dropdown
  const cropSelect = document.getElementById('scannerCropSelect');
  if (cropSelect) cropSelect.value = cropMap[specimenKey];

  // Load preview
  preview.src = url;
  preview.classList.remove('hidden');
  previewPlaceholder.classList.add('hidden');
  analyzeBtn.disabled = false;

  // Convert to image file blob
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      state.selectedImageFile = new File([blob], `${specimenKey}.png`, { type: 'image/png' });
      state.selectedImageBase64 = null;
      state.selectedWebcamUrl = null;
      showToast(`Loaded realistic specimen: ${specimenKey.replace(/_/g, ' ')}`, 'info');
    });
}

// Camera & Input Handlers
function handleLeafFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.selectedImageFile = file;
  state.selectedImageBase64 = null;
  state.selectedWebcamUrl = null;

  const reader = new FileReader();
  reader.onload = (event) => {
    const preview = document.getElementById('scannerImagePreview');
    const previewPlaceholder = document.getElementById('scannerPreviewPlaceholder');
    const analyzeBtn = document.getElementById('analyzeLeafBtn');

    preview.src = event.target.result;
    preview.classList.remove('hidden');
    previewPlaceholder.classList.add('hidden');
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

// Live Webcam Modal & Stream
async function openLiveWebcam() {
  const modal = document.getElementById('webcamModal');
  const video = document.getElementById('webcamVideo');
  modal.classList.remove('hidden');

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = webcamStream;
  } catch (err) {
    console.error('Webcam access error:', err);
    showToast('Camera access blocked or not available. Use file upload or Webcam URL Link instead.', 'warning');
    closeLiveWebcam();
  }
}

function captureWebcamSnapshot() {
  const video = document.getElementById('webcamVideo');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  state.selectedImageBase64 = dataUrl;
  state.selectedImageFile = null;
  state.selectedWebcamUrl = null;

  const preview = document.getElementById('scannerImagePreview');
  const previewPlaceholder = document.getElementById('scannerPreviewPlaceholder');
  const analyzeBtn = document.getElementById('analyzeLeafBtn');

  preview.src = dataUrl;
  preview.classList.remove('hidden');
  previewPlaceholder.classList.add('hidden');
  analyzeBtn.disabled = false;

  closeLiveWebcam();
  showToast('Webcam snapshot captured successfully!', 'success');
}

function closeLiveWebcam() {
  const modal = document.getElementById('webcamModal');
  modal.classList.add('hidden');
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
}

// ** Photo capture through URL link of webcam ** (Explicitly requested feature)
function handleWebcamUrlCapture() {
  const urlInput = document.getElementById('scannerWebcamUrlInput');
  const url = urlInput ? urlInput.value.trim() : '';

  if (!url) {
    showToast('Please enter a valid webcam snapshot or camera stream URL', 'warning');
    return;
  }

  state.selectedWebcamUrl = url;
  state.selectedImageFile = null;
  state.selectedImageBase64 = null;

  const preview = document.getElementById('scannerImagePreview');
  const previewPlaceholder = document.getElementById('scannerPreviewPlaceholder');
  const analyzeBtn = document.getElementById('analyzeLeafBtn');

  preview.src = url;
  preview.classList.remove('hidden');
  previewPlaceholder.classList.add('hidden');
  analyzeBtn.disabled = false;

  showToast('Webcam URL link configured. Ready to analyze!', 'info');
}

// Run AI Inference
async function runLeafDiagnosis() {
  const cropSelect = document.getElementById('scannerCropSelect');
  const selectedCrop = cropSelect ? cropSelect.value : 'Tomato';
  const laserContainer = document.getElementById('scannerLaserContainer');
  const loadingIndicator = document.getElementById('scannerLoading');
  const resultsContainer = document.getElementById('scannerResults');
  const analyzeBtn = document.getElementById('analyzeLeafBtn');

  if (!state.selectedImageFile && !state.selectedImageBase64 && !state.selectedWebcamUrl) {
    showToast('Please select, capture, or link a leaf image first', 'warning');
    return;
  }

  // UI state: Scanning
  laserContainer.classList.add('scanning');
  loadingIndicator.classList.remove('hidden');
  resultsContainer.classList.add('hidden');
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append('crop', selectedCrop);
  if (state.activeFarmId) formData.append('farm_id', state.activeFarmId);

  if (state.selectedWebcamUrl) {
    formData.append('webcam_url', state.selectedWebcamUrl);
  } else if (state.selectedImageBase64) {
    formData.append('image_base64', state.selectedImageBase64);
  } else if (state.selectedImageFile) {
    formData.append('image', state.selectedImageFile);
  }

  try {
    const res = await apiFetch('/disease/predict', {
      method: 'POST',
      body: formData
    });

    laserContainer.classList.remove('scanning');
    loadingIndicator.classList.add('hidden');
    analyzeBtn.disabled = false;

    if (res.ok) {
      const result = await res.json();
      renderDiagnosticResult(result);
      showToast(`Diagnosis completed: ${result.disease}`, 'success');
    } else {
      const err = await res.json();
      showToast(err.detail || 'Prediction failed. Please ensure clear foliage.', 'error');
    }
  } catch (err) {
    laserContainer.classList.remove('scanning');
    loadingIndicator.classList.add('hidden');
    analyzeBtn.disabled = false;
    console.error(err);
    showToast('Network error during AI prediction', 'error');
  }
}

function renderDiagnosticResult(res) {
  const container = document.getElementById('scannerResults');
  container.classList.remove('hidden');

  const cropEl = document.getElementById('resCropName');
  const diseaseEl = document.getElementById('resDiseaseName');
  const confEl = document.getElementById('resConfidence');
  const confBar = document.getElementById('resConfidenceBar');
  const sevEl = document.getElementById('resSeverity');
  const symptomsEl = document.getElementById('resSymptoms');
  const causesEl = document.getElementById('resCauses');
  const mgmtEl = document.getElementById('resManagement');
  const warnBanner = document.getElementById('resLowConfidenceWarn');
  const treatmentsContainer = document.getElementById('resTreatmentsList');

  if (cropEl) cropEl.innerText = res.crop;
  if (diseaseEl) diseaseEl.innerText = res.disease;

  const confPct = Math.round(res.confidence * 100);
  if (confEl) confEl.innerText = `${confPct}%`;
  if (confBar) confBar.style.width = `${confPct}%`;

  if (sevEl) {
    sevEl.innerText = res.severity;
    sevEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ';
    if (res.severity === 'Healthy') sevEl.className += 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    else if (res.severity === 'Mild') sevEl.className += 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    else if (res.severity === 'Moderate') sevEl.className += 'bg-amber-100 text-amber-800 border border-amber-300';
    else sevEl.className += 'bg-red-100 text-red-800 border border-red-300';
  }

  // Low confidence warning (< 70%)
  if (warnBanner) {
    if (res.needs_expert_review || res.confidence < 0.70) {
      warnBanner.classList.remove('hidden');
    } else {
      warnBanner.classList.add('hidden');
    }
  }

  if (symptomsEl) symptomsEl.innerText = res.symptoms || 'None reported.';
  if (causesEl) causesEl.innerText = res.possible_causes || 'Standard agricultural conditions.';
  if (mgmtEl) mgmtEl.innerText = res.management || 'Maintain optimal plant hygiene.';

  // Verified Treatments
  if (treatmentsContainer) {
    treatmentsContainer.innerHTML = '';
    if (!res.treatment_guidance || res.treatment_guidance.length === 0) {
      treatmentsContainer.innerHTML = '<p class="text-xs text-slate-500 py-2">No chemical pesticide needed. Crop is healthy or maintain standard cultural care.</p>';
    } else {
      res.treatment_guidance.forEach(t => {
        const item = document.createElement('div');
        item.className = 'p-3.5 bg-slate-50 rounded-xl border border-slate-200 mt-2';
        item.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 text-sm">${t.product_name}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">${t.treatment_type}</span>
          </div>
          <div class="text-xs text-slate-600 mt-1"><strong>Active:</strong> ${t.active_ingredient}</div>
          <div class="text-xs text-emerald-700 font-medium mt-1"><strong>Dosage:</strong> ${t.dosage}</div>
          <div class="text-xs text-slate-500 mt-1">${t.guidance}</div>
          <div class="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
            ⚠️ <strong>Safety Warning:</strong> ${t.safety_warning} | <strong>PHI:</strong> ${t.pre_harvest_interval_days} Days
          </div>
        `;
        treatmentsContainer.appendChild(item);
      });
    }
  }

  // Load registered Leaf Disease Experts matched to this crop & leaf disease
  loadRegisteredExpertsForScanner(res.crop || '', res.disease || '');
  loadFarmerConsultationsHistory();

  // Pre-fill problem input with detected crop & leaf disease if empty
  const problemInput = document.getElementById('farmerExpertProblemInput');
  if (problemInput && !problemInput.value.trim()) {
    problemInput.value = `नमस्ते Expert जी, मेरी ${res.crop} फसल की पत्तियों में "${res.disease}" (${res.severity} severity) के लक्षण दिख रहे हैं (${res.symptoms || 'पत्तियों पर धब्बे'})। कृपया सही दवा और खुराक बताएं।`;
  }

  // Scroll smoothly down to results
  container.scrollIntoView({ behavior: 'smooth' });
}

// ----------------------------------------------------
// 3. AI FARM CO-PILOT & VOICE ASSISTANT MODULE
// ----------------------------------------------------
function initCopilotView() {
  const feed = document.getElementById('copilotChatFeed');
  if (feed && feed.children.length === 0) {
    appendCopilotMessage(
      'ai',
      state.currentLang === 'od'
        ? "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ଏଆଇ ଫାର୍ମ କୋ-ପାଇଲଟ୍। ଆପଣଙ୍କ ଫସଲ, ପାଣିପାଗ କିମ୍ବା ମଣ୍ଡି ବିଷୟରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।"
        : (state.currentLang === 'hi'
            ? "नमस्ते! मैं आपका एआई फार्म को-पायलट हूँ। अपनी फसल, मौसम या मंडी भाव के बारे में कोई भी प्रश्न पूछें।"
            : "Hello! I am your AI Farm Co-Pilot. Ask me anything about your crops, irrigation, expenses, or mandi prices.")
    );
  }
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech API not supported on this browser.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    state.isRecording = true;
    updateVoiceUI(true);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    state.isRecording = false;
    updateVoiceUI(false);
    handleUserVoiceQuery(transcript);
  };

  recognition.onerror = (event) => {
    state.isRecording = false;
    updateVoiceUI(false);
    showToast(`Speech recognition error: ${event.error}`, 'warning');
  };

  recognition.onend = () => {
    state.isRecording = false;
    updateVoiceUI(false);
  };

  state.speechRecognition = recognition;
}

function toggleVoiceAssistant() {
  if (!state.speechRecognition) {
    showToast('Speech recognition not supported in this browser. Please type your question.', 'warning');
    return;
  }

  if (state.isRecording) {
    state.speechRecognition.stop();
  } else {
    // Set recognition dialect based on active language
    if (state.currentLang === 'od') state.speechRecognition.lang = 'or-IN';
    else if (state.currentLang === 'hi') state.speechRecognition.lang = 'hi-IN';
    else state.speechRecognition.lang = 'en-IN';

    state.speechRecognition.start();
  }
}

function updateVoiceUI(isRecording) {
  const micBtn = document.getElementById('copilotMicBtn');
  const waves = document.getElementById('copilotVoiceWaves');
  const statusText = document.getElementById('copilotVoiceStatus');

  if (micBtn) {
    micBtn.classList.toggle('bg-red-600', isRecording);
    micBtn.classList.toggle('animate-pulse', isRecording);
  }
  if (waves) {
    waves.classList.toggle('listening', isRecording);
  }
  if (statusText) {
    statusText.innerText = isRecording ? t('copilot.listening', 'Listening...') : '';
  }
}

async function handleUserVoiceQuery(transcript) {
  appendCopilotMessage('user', transcript);
  await sendCopilotMessage(transcript);
}

async function handleSendTextCopilot() {
  const input = document.getElementById('copilotTextInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  input.value = '';
  appendCopilotMessage('user', text);
  await sendCopilotMessage(text);
}

function handleQuickPrompt(promptText) {
  appendCopilotMessage('user', promptText);
  sendCopilotMessage(promptText);
}

async function sendCopilotMessage(msg) {
  const feed = document.getElementById('copilotChatFeed');
  const typingIndicator = document.getElementById('copilotTyping');
  if (typingIndicator) typingIndicator.classList.remove('hidden');

  try {
    const res = await apiFetch('/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        language: state.currentLang,
        farm_id: state.activeFarmId
      })
    });

    if (typingIndicator) typingIndicator.classList.add('hidden');

    if (res.ok) {
      const data = await res.json();
      appendCopilotMessage('ai', data.reply, data.action_suggested);
      // Play audio TTS
      speakTextResponse(data.reply);
    } else {
      appendCopilotMessage('ai', 'Sorry, I encountered an issue processing your agricultural question.');
    }
  } catch (err) {
    if (typingIndicator) typingIndicator.classList.add('hidden');
    console.error(err);
    appendCopilotMessage('ai', 'Network connection issue. Please check your internet connection.');
  }
}

function appendCopilotMessage(sender, text, action = null) {
  const feed = document.getElementById('copilotChatFeed');
  if (!feed) return;

  const msgDiv = document.createElement('div');
  const isUser = sender === 'user';
  msgDiv.className = `flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`;

  let actionHtml = '';
  if (action && !isUser) {
    actionHtml = `<div class="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
      ⚡ Suggested Action: ${action}
    </div>`;
  }

  msgDiv.innerHTML = `
    ${!isUser ? '<div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">🌾</div>' : ''}
    <div class="max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl ${isUser ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none'}">
      <p class="text-sm leading-relaxed">${text}</p>
      ${actionHtml}
      ${!isUser ? `<button onclick="speakTextResponse('${text.replace(/'/g, "\\'")}')" class="mt-2 text-xs text-slate-400 hover:text-emerald-700 flex items-center gap-1">🔊 Play Voice</button>` : ''}
    </div>
    ${isUser ? '<div class="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0">👤</div>' : ''}
  `;

  feed.appendChild(msgDiv);
  feed.scrollTop = feed.scrollHeight;
}

// Text-to-Speech Output
function speakTextResponse(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // stop any current audio

  const utterance = new SpeechSynthesisUtterance(text);
  if (state.currentLang === 'od') utterance.lang = 'or-IN';
  else if (state.currentLang === 'hi') utterance.lang = 'hi-IN';
  else utterance.lang = 'en-IN';

  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ----------------------------------------------------
// 4. SOIL INTELLIGENCE MODULE
// ----------------------------------------------------
function initSoilView() {
  analyzeSoilParams();
}

async function analyzeSoilParams() {
  const ph = parseFloat(document.getElementById('soilInputPH').value) || 6.5;
  const n = parseFloat(document.getElementById('soilInputN').value) || 240.0;
  const p = parseFloat(document.getElementById('soilInputP').value) || 22.0;
  const k = parseFloat(document.getElementById('soilInputK').value) || 180.0;
  const oc = parseFloat(document.getElementById('soilInputOC').value) || 0.55;
  const moisture = parseFloat(document.getElementById('soilInputMoisture').value) || 45.0;
  const soilType = document.getElementById('soilInputType').value || 'Alluvial Loam';

  try {
    const res = await apiFetch('/soil/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farm_id: state.activeFarmId || 1,
        ph, nitrogen_kg_ha: n, phosphorus_kg_ha: p, potassium_kg_ha: k,
        organic_carbon_pct: oc, moisture_pct: moisture, soil_type: soilType
      })
    });

    if (res.ok) {
      const data = await res.json();
      renderSoilAnalysisResult(data);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderSoilAnalysisResult(data) {
  const scoreEl = document.getElementById('soilFertilityScore');
  const phStatusEl = document.getElementById('soilPHStatus');
  const nStatusEl = document.getElementById('soilNStatus');
  const pStatusEl = document.getElementById('soilPStatus');
  const kStatusEl = document.getElementById('soilKStatus');
  const guidanceEl = document.getElementById('soilGuidanceText');
  const recsContainer = document.getElementById('soilRecsList');
  const cropsContainer = document.getElementById('soilCropSuitabilityList');

  if (scoreEl) scoreEl.innerText = `${data.overall_fertility_score}/100`;
  if (phStatusEl) phStatusEl.innerText = data.ph_status;
  if (nStatusEl) nStatusEl.innerText = data.nitrogen_status;
  if (pStatusEl) pStatusEl.innerText = data.phosphorus_status;
  if (kStatusEl) kStatusEl.innerText = data.potassium_status;
  if (guidanceEl) guidanceEl.innerText = data.management_guidance;

  if (recsContainer) {
    recsContainer.innerHTML = '';
    data.recommendations.forEach(r => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2 text-xs md:text-sm text-slate-700 py-1';
      li.innerHTML = `<span class="text-emerald-600 font-bold">✔</span> <span>${r}</span>`;
      recsContainer.appendChild(li);
    });
  }

  if (cropsContainer) {
    cropsContainer.innerHTML = '';
    data.crop_suitability.slice(0, 8).forEach(c => {
      const item = document.createElement('div');
      item.className = 'p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs';
      item.innerHTML = `
        <div>
          <h5 class="font-bold text-slate-800 text-sm">${c.crop}</h5>
          <p class="text-xs text-slate-400 italic">${c.scientific_name}</p>
        </div>
        <div class="text-right">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${c.suitability_score >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}">
            ${c.suitability_score}% Match
          </span>
        </div>
      `;
      cropsContainer.appendChild(item);
    });
  }
}

// ----------------------------------------------------
// 5. FARM BUSINESS MAKER & EXPENSE TRACKER MODULE
// ----------------------------------------------------
function initBusinessView() {
  calculateBusinessScenario();
  loadExpensesList();
  loadIncomeList();
}

function calculateBusinessScenario() {
  const crop = document.getElementById('bizCropSelect').value || 'Tomato';
  const acres = parseFloat(document.getElementById('bizAcres').value) || 2.0;
  const seed = parseFloat(document.getElementById('bizSeed').value) || 3500;
  const fertilizer = parseFloat(document.getElementById('bizFertilizer').value) || 7000;
  const labour = parseFloat(document.getElementById('bizLabour').value) || 14000;
  const irrigation = parseFloat(document.getElementById('bizIrrigation').value) || 3000;
  const protection = parseFloat(document.getElementById('bizProtection').value) || 4500;
  const equipment = parseFloat(document.getElementById('bizEquipment').value) || 4000;
  const transport = parseFloat(document.getElementById('bizTransport').value) || 2500;
  const yieldQtl = parseFloat(document.getElementById('bizYield').value) || 90;
  const priceQtl = parseFloat(document.getElementById('bizPrice').value) || 2350;

  const totalCost = seed + fertilizer + labour + irrigation + protection + equipment + transport;
  const totalRevenue = yieldQtl * priceQtl;
  const netReturn = totalRevenue - totalCost;
  const roi = ((netReturn / totalCost) * 100).toFixed(1);

  document.getElementById('bizResTotalCost').innerText = `₹${totalCost.toLocaleString()}`;
  document.getElementById('bizResRevenue').innerText = `₹${totalRevenue.toLocaleString()}`;
  document.getElementById('bizResNetReturn').innerText = `₹${netReturn.toLocaleString()}`;
  document.getElementById('bizResROI').innerText = `${roi}%`;

  renderBusinessChart({
    Seed: seed, Fertilizer: fertilizer, Labour: labour,
    Irrigation: irrigation, Protection: protection, Equipment: equipment, Transport: transport
  });
}

function renderBusinessChart(breakdown) {
  const ctx = document.getElementById('bizCostChart');
  if (!ctx) return;

  if (state.charts.business) state.charts.business.destroy();

  state.charts.business = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(breakdown),
      datasets: [{
        data: Object.values(breakdown),
        backgroundColor: [
          '#10b981', '#059669', '#047857', '#065f46',
          '#f59e0b', '#d97706', '#3b82f6'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
      }
    }
  });
}

// Voice Expense Parsing
async function triggerVoiceExpense() {
  if (!state.speechRecognition) {
    showToast('Speech recognition not available. Please type expense manually.', 'warning');
    return;
  }

  showToast('Listening for expense... (e.g. "I spent 1500 on fertilizer" or "ଖତ 1500")', 'info');
  const tempRec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  tempRec.lang = state.currentLang === 'od' ? 'or-IN' : (state.currentLang === 'hi' ? 'hi-IN' : 'en-IN');
  tempRec.start();

  tempRec.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    showToast(`Heard: "${transcript}"`, 'info');

    // Parse via backend NLP
    const parseRes = await apiFetch('/expenses/parse-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });

    if (parseRes.ok) {
      const parsed = await parseRes.json();
      if (parsed.amount) {
        // Auto-fill expense form
        document.getElementById('expAmountInput').value = parsed.amount;
        document.getElementById('expCategoryInput').value = parsed.category;
        document.getElementById('expNotesInput').value = transcript;
        showToast(`Parsed: ₹${parsed.amount} for ${parsed.category}. Tap Save.`, 'success');
      } else {
        showToast('Could not extract numeric amount. Please enter manually.', 'warning');
      }
    }
  };
}

async function saveManualExpense() {
  const amount = parseFloat(document.getElementById('expAmountInput').value);
  const category = document.getElementById('expCategoryInput').value;
  const notes = document.getElementById('expNotesInput').value;

  if (!amount || amount <= 0) {
    showToast('Please enter a valid expense amount', 'warning');
    return;
  }

  const res = await apiFetch('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farm_id: state.activeFarmId || 1,
      amount,
      category,
      date: new Date().toISOString().split('T')[0],
      notes
    })
  });

  if (res.ok) {
    showToast('Expense successfully recorded!', 'success');
    document.getElementById('expAmountInput').value = '';
    document.getElementById('expNotesInput').value = '';
    loadExpensesList();
    loadDashboardData();
  }
}

async function loadExpensesList() {
  const res = await apiFetch('/expenses');
  const container = document.getElementById('expensesTableBody');
  if (!res.ok || !container) return;

  const expenses = await res.json();
  container.innerHTML = '';
  expenses.slice(0, 10).forEach(e => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50 text-xs md:text-sm';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-800">${e.date}</td>
      <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">${e.category}</span></td>
      <td class="py-2.5 px-3 font-bold text-slate-800">₹${e.amount.toLocaleString()}</td>
      <td class="py-2.5 px-3 text-slate-500">${e.notes || '-'}</td>
    `;
    container.appendChild(tr);
  });
}

async function loadIncomeList() {
  const res = await apiFetch('/income');
  const container = document.getElementById('incomeTableBody');
  if (!res.ok || !container) return;

  const incomes = await res.json();
  container.innerHTML = '';
  incomes.slice(0, 10).forEach(i => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50 text-xs md:text-sm';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-800">${i.date}</td>
      <td class="py-2.5 px-3 font-bold text-emerald-800">${i.crop}</td>
      <td class="py-2.5 px-3">${i.quantity_quintals} Qtl</td>
      <td class="py-2.5 px-3">₹${i.selling_price_per_quintal}/Qtl</td>
      <td class="py-2.5 px-3 font-bold text-slate-900">₹${i.net_realization.toLocaleString()}</td>
    `;
    container.appendChild(tr);
  });
}

// ----------------------------------------------------
// 6. MARKET OPTIMIZER MODULE
// ----------------------------------------------------
function initMarketView() {
  runMarketComparison();
}

// ----------------------------------------------------
// 6. ODISHA STATE-WISE MANDI MARKET OPTIMIZER
// ----------------------------------------------------
window.allOdishaMandis = [];

async function runMarketComparison() {
  const crop = document.getElementById('mktCropSelect')?.value || 'Tomato';
  const qty = parseFloat(document.getElementById('mktQtyInput')?.value) || 50.0;
  const grade = document.getElementById('mktGradeSelect')?.value || 'Grade A';

  try {
    const res = await apiFetch('/markets/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop,
        quantity_quintals: qty,
        grade
      })
    });

    if (res.ok) {
      const mandis = await res.json();
      window.allOdishaMandis = mandis;

      // Update Real Daily Analysis Date Bulletin
      const dateLabel = document.getElementById('mktDailyDateLabel');
      if (dateLabel) {
        if (mandis[0]?.daily_analysis_day) {
          dateLabel.innerText = `Daily Bulletin: ${mandis[0].daily_analysis_day} (${mandis.length} Odisha APMC/RMC Mandis)`;
        } else {
          const nowStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
          dateLabel.innerText = `Daily Bulletin: ${nowStr} (${mandis.length} Odisha APMC/RMC Mandis)`;
        }
      }

      // Update Mandi Count Badge
      const countBadge = document.getElementById('mktCountBadge');
      if (countBadge) countBadge.innerText = mandis.length;

      // Render Optimal Selling Mandi Top Banner
      renderOptimalMandiBanner(mandis[0], qty);

      // Render all cards
      filterMandiCardsByDistrict();
    }
  } catch (err) {
    console.error('Market comparison error:', err);
  }
}

function renderOptimalMandiBanner(topMandi, qty) {
  const banner = document.getElementById('mktOptimalBanner');
  if (!banner || !topMandi) return;

  const transportVal = topMandi.total_transport_cost || topMandi.transport_cost || 0;
  const feeVal = topMandi.total_mandi_fee || topMandi.market_fees || 0;

  banner.classList.remove('hidden');
  banner.innerHTML = `
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white tracking-wider animate-pulse flex items-center gap-1">
            <span>🏆</span> <span>#1 OPTIMAL SELLING MANDI IN ODISHA</span>
          </span>
          <span class="text-xs font-bold text-emerald-800">${topMandi.district} District</span>
        </div>
        <h3 class="text-xl md:text-2xl font-black text-slate-900 mt-1">${topMandi.market_name}</h3>
        <p class="text-xs text-slate-600 mt-0.5">
          📍 ${topMandi.district}, Odisha • ${topMandi.distance_km} km away • Source: <span class="font-semibold text-emerald-800">${topMandi.source}</span>
        </p>
      </div>

      <div class="flex items-baseline gap-2 bg-white px-5 py-3 rounded-2xl border border-emerald-300 shadow-xs">
        <div class="text-right">
          <span class="text-3xs uppercase font-extrabold text-slate-400 block">Total Net Farmer Realization</span>
          <strong class="text-2xl md:text-3xl font-black text-emerald-800">₹${topMandi.net_realization.toLocaleString()}</strong>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-200 text-xs">
      <div class="p-2.5 bg-white rounded-xl border border-emerald-200">
        <span class="text-slate-400 block text-3xs uppercase font-bold">Today's Modal Price</span>
        <span class="font-black text-slate-900 text-sm md:text-base">₹${topMandi.modal_price_per_quintal.toFixed(0)}/Qtl</span>
      </div>
      <div class="p-2.5 bg-white rounded-xl border border-emerald-200">
        <span class="text-slate-400 block text-3xs uppercase font-bold">Transport Freight</span>
        <span class="font-bold text-amber-800 text-sm md:text-base">- ₹${transportVal.toLocaleString()}</span>
        <span class="text-3xs text-slate-400 block">₹${topMandi.transport_cost_per_qtl || Math.round(transportVal / qty)}/Qtl</span>
      </div>
      <div class="p-2.5 bg-white rounded-xl border border-emerald-200">
        <span class="text-slate-400 block text-3xs uppercase font-bold">Mandi Cess (Strictly 1.5%)</span>
        <span class="font-bold text-slate-700 text-sm md:text-base">- ₹${feeVal.toLocaleString()}</span>
        <span class="text-3xs text-slate-400 block">OSAMB Mandated 1.5%</span>
      </div>
      <div class="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
        <span class="text-emerald-200 block text-3xs uppercase font-bold">Net Farmer Price</span>
        <span class="font-black text-white text-base md:text-lg">₹${topMandi.net_price_per_quintal.toFixed(0)}/Qtl</span>
        <span class="text-3xs text-emerald-100 block">Net realization per quintal</span>
      </div>
    </div>
  `;
}

function filterMandiCardsByDistrict() {
  const filterVal = document.getElementById('mktDistrictFilter')?.value || 'ALL';
  const mandis = window.allOdishaMandis || [];

  if (filterVal === 'ALL') {
    renderMarketCards(mandis);
  } else {
    const filtered = mandis.filter(m => m.district && m.district.toLowerCase() === filterVal.toLowerCase());
    renderMarketCards(filtered);
  }
}

function renderMarketCards(mandis) {
  const container = document.getElementById('mktResultsGrid');
  if (!container) return;
  container.innerHTML = '';

  if (mandis.length === 0) {
    container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-8">No mandis found matching the selected district filter.</p>';
    return;
  }

  mandis.forEach((m, idx) => {
    const card = document.createElement('div');
    const isTop = m.is_recommended || idx === 0;
    const rank = m.rank || (idx + 1);
    const transportVal = m.total_transport_cost || m.transport_cost || 0;
    const feeVal = m.total_mandi_fee || m.market_fees || 0;

    card.className = `p-5 rounded-2xl border transition-all ${isTop ? 'border-2 border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500/30' : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'}`;

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${isTop ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}">
            #${rank}
          </span>
          <h4 class="font-black text-slate-800 text-sm md:text-base leading-snug">${m.market_name}</h4>
        </div>
        ${isTop ? '<span class="px-2.5 py-0.5 rounded-full text-3xs font-black bg-emerald-600 text-white tracking-wider uppercase shrink-0">Optimal</span>' : ''}
      </div>
      <p class="text-xs text-slate-500 mt-1">📍 ${m.district}, ${m.state} • ${m.distance_km} km road freight</p>

      <div class="grid grid-cols-2 gap-2.5 mt-3 text-xs">
        <div class="p-2 bg-slate-50 rounded-xl">
          <span class="text-slate-400 block text-3xs uppercase font-bold">Modal Price</span>
          <span class="font-extrabold text-slate-900 text-sm">₹${m.modal_price_per_quintal.toFixed(0)}/Qtl</span>
        </div>
        <div class="p-2 bg-slate-50 rounded-xl">
          <span class="text-slate-400 block text-3xs uppercase font-bold">Transport Freight</span>
          <span class="font-bold text-amber-800 text-sm">- ₹${transportVal.toLocaleString()}</span>
        </div>
        <div class="p-2 bg-slate-50 rounded-xl">
          <span class="text-slate-400 block text-3xs uppercase font-bold">Mandi Fee (1.5%)</span>
          <span class="font-bold text-slate-700 text-sm">- ₹${feeVal.toLocaleString()}</span>
        </div>
        <div class="p-2 bg-emerald-100/90 rounded-xl">
          <span class="text-emerald-800 block text-3xs uppercase font-black">Net Realization</span>
          <span class="font-black text-emerald-950 text-base">₹${m.net_realization.toLocaleString()}</span>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
        <span>Net Price: <strong class="text-slate-800 font-extrabold">₹${m.net_price_per_quintal.toFixed(0)}/Qtl</strong></span>
        <span>${m.daily_analysis_day || m.daily_date || 'Today'}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ----------------------------------------------------
// 7. BUYER MARKETPLACE MODULE (DIRECT FARMER PROFILE LISTINGS)
// ----------------------------------------------------
function openProduceListingModalFromProfile() {
  const modal = document.getElementById('modalProduceFromProfile');
  if (!modal) return;

  const farmerName = state.user?.full_name || localStorage.getItem('farmer_name') || 'Lokanath Bala (Farmer)';
  const farmLoc = state.user?.location || 'Khordha / Bhubaneswar Rural, Odisha';

  const nameInput = document.getElementById('profListingFarmerName');
  if (nameInput) nameInput.value = farmerName;

  const locInput = document.getElementById('profListingLocation');
  if (locInput) locInput.value = farmLoc;

  modal.classList.remove('hidden');
}

function closeProduceListingModalFromProfile() {
  const modal = document.getElementById('modalProduceFromProfile');
  if (modal) modal.classList.add('hidden');
}

async function createProduceListingFromProfile() {
  const crop = document.getElementById('profListingCrop')?.value || 'Tomato';
  const grade = document.getElementById('profListingGrade')?.value || 'Grade A';
  const qty = parseFloat(document.getElementById('profListingQty')?.value) || 25.0;
  const price = parseFloat(document.getElementById('profListingPrice')?.value) || 2450.0;
  const location = document.getElementById('profListingLocation')?.value || 'Khordha, Odisha';
  const desc = document.getElementById('profListingDesc')?.value || '';
  const farmerName = document.getElementById('profListingFarmerName')?.value || state.user?.full_name || 'Farmer';

  try {
    const res = await apiFetch('/buyers/listings/from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop,
        grade,
        quantity_quintals: qty,
        expected_price_per_quintal: price,
        farm_location: location,
        description: desc,
        farmer_name: farmerName,
        variety: 'Farm Fresh Certified'
      })
    });

    if (res.ok) {
      showToast(`🌾 Fresh produce listing for ${crop} added to marketplace directly from your profile!`, 'success');
      closeProduceListingModalFromProfile();
      initMarketplaceView();
    } else {
      const err = await res.json();
      showToast(err.detail || 'Failed to list produce', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Network error while listing produce', 'error');
  }
}

async function initMarketplaceView() {
  const res = await apiFetch('/buyers/listings');
  const container = document.getElementById('marketplaceGrid');
  if (!res.ok || !container) return;

  const listings = await res.json();
  container.innerHTML = '';
  if (listings.length === 0) {
    container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-8">No produce listings yet. Click "+ List Produce Directly from Profile" above to create one!</p>';
    return;
  }

  listings.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide flex items-center gap-1">
            <span>👨‍🌾</span> <span>Farmer Direct Harvest</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-700">${item.grade}</span>
        </div>
        <h4 class="font-black text-slate-900 text-lg mt-2">${item.crop} <span class="text-xs text-slate-500 font-normal">(${item.variety})</span></h4>
        <p class="text-xs text-emerald-800 font-bold mt-0.5">🧑‍🌾 Farmer: ${item.farmer_name || 'Verified Farmer'} (${item.farmer_phone || '+91-9437012345'})</p>
        <p class="text-xs text-slate-500 mt-0.5">📍 Farm: ${item.farm_location}</p>
        <p class="text-xs text-slate-600 mt-2.5 line-clamp-2">${item.description || 'Direct farm harvest from verified profile.'}</p>
        
        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div class="p-2 bg-slate-50 rounded-xl">
            <span class="text-slate-400 block text-3xs uppercase font-bold">Available Quantity</span>
            <span class="font-extrabold text-slate-800 text-sm">${item.quantity_quintals} Qtl</span>
          </div>
          <div class="p-2 bg-emerald-50 rounded-xl">
            <span class="text-emerald-700 block text-3xs uppercase font-bold">Expected Price</span>
            <span class="font-extrabold text-emerald-900 text-sm">₹${item.expected_price_per_quintal}/Qtl</span>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 w-full text-center">
          ✔ Active in Buyer Procurement Portal
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ----------------------------------------------------
// 7B. DEDICATED BUYER PORTAL MODULE (BUYER ONLY)
// ----------------------------------------------------
async function initBuyerPortalView() {
  const res = await apiFetch('/buyers/listings');
  const container = document.getElementById('buyerPortalListingsGrid');
  if (!res.ok || !container) return;

  const listings = await res.json();
  window.allBuyerListings = listings || [];

  const totalLotsEl = document.getElementById('buyerTotalLots');
  const totalQtlEl = document.getElementById('buyerTotalQuintals');
  if (totalLotsEl) totalLotsEl.innerText = listings.length;
  if (totalQtlEl) {
    const sumQtl = listings.reduce((acc, item) => acc + (parseFloat(item.quantity_quintals) || 0), 0);
    totalQtlEl.innerText = `${sumQtl.toFixed(0)} Qtl`;
  }

  renderBuyerPortalListings(listings);
}

function filterBuyerPortalListings() {
  const cropFilter = document.getElementById('buyerCropFilter')?.value || 'ALL';
  const listings = window.allBuyerListings || [];
  if (cropFilter === 'ALL') {
    renderBuyerPortalListings(listings);
  } else {
    const filtered = listings.filter(item => item.crop && item.crop.toLowerCase().includes(cropFilter.toLowerCase()));
    renderBuyerPortalListings(filtered);
  }
}

function renderBuyerPortalListings(listings) {
  const container = document.getElementById('buyerPortalListingsGrid');
  if (!container) return;
  container.innerHTML = '';

  if (!listings || listings.length === 0) {
    container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-8">No matching farmer harvest lots currently available.</p>';
    return;
  }

  listings.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wide flex items-center gap-1">
            <span>🌾</span> <span>Verified Farmer Lot</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-700">${item.grade}</span>
        </div>
        <h4 class="font-black text-slate-900 text-lg mt-2">${item.crop} <span class="text-xs text-slate-500 font-normal">(${item.variety})</span></h4>
        <p class="text-xs text-emerald-800 font-bold mt-0.5">🧑‍🌾 Farmer: ${item.farmer_name || 'Verified Farmer'} (${item.farmer_phone || '+91-9437012345'})</p>
        <p class="text-xs text-slate-500 mt-0.5">📍 Farm Location: ${item.farm_location}</p>
        <p class="text-xs text-slate-600 mt-2.5 line-clamp-2">${item.description || 'Direct farm harvest ready for immediate wholesale dispatch.'}</p>
        
        <div class="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div class="p-2 bg-slate-50 rounded-xl">
            <span class="text-slate-400 block text-3xs uppercase font-bold">Available Quantity</span>
            <span class="font-extrabold text-slate-800 text-sm">${item.quantity_quintals} Qtl</span>
          </div>
          <div class="p-2 bg-amber-50 rounded-xl border border-amber-200/60">
            <span class="text-amber-800 block text-3xs uppercase font-bold">Farmer Ask Price</span>
            <span class="font-extrabold text-amber-950 text-sm">₹${item.expected_price_per_quintal}/Qtl</span>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100">
        <button onclick="openBuyerOrderModal(${item.id}, '${item.crop}', ${item.expected_price_per_quintal})" class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5">
          <span>🛒</span> <span>Place Purchase Offer</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openBuyerOrderModal(listingId, crop, price) {
  const modal = document.getElementById('buyerOrderModal');
  if (!modal) return;
  document.getElementById('buyerOrderListingId').value = listingId;
  document.getElementById('buyerOrderCropName').innerText = crop;
  document.getElementById('buyerOrderPrice').value = price;
  const firmInput = document.getElementById('buyerOrderFirmName');
  const phoneInput = document.getElementById('buyerOrderPhone');
  if (firmInput && !firmInput.value) {
    firmInput.value = state.user?.specialization || state.user?.farm_name || state.user?.full_name || '';
  }
  if (phoneInput && !phoneInput.value) {
    phoneInput.value = state.user?.phone_number || '';
  }
  modal.classList.remove('hidden');
}

async function submitBuyerOrder() {
  const listingId = parseInt(document.getElementById('buyerOrderListingId')?.value);
  const qty = parseFloat(document.getElementById('buyerOrderQty')?.value);
  const price = parseFloat(document.getElementById('buyerOrderPrice')?.value);
  const notes = document.getElementById('buyerOrderNotes')?.value || '';
  const firmName = document.getElementById('buyerOrderFirmName')?.value || state.user?.specialization || state.user?.full_name || 'Verified Buyer';
  const buyerPhone = document.getElementById('buyerOrderPhone')?.value || state.user?.phone_number || '';
  const buyerLocation = document.getElementById('buyerOrderLocation')?.value || 'Bhubaneswar, Khordha, Odisha';
  const buyerHub = document.getElementById('buyerOrderHub')?.value || 'Odisha Wholesale Hub';

  const res = await apiFetch('/buyers/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listing_id: listingId,
      quantity_requested: qty,
      offered_price_per_quintal: price,
      notes: notes,
      buyer_name: firmName,
      buyer_phone: buyerPhone,
      buyer_location: buyerLocation,
      buyer_hub: buyerHub
    })
  });

  if (res.ok) {
    showToast('✅ Purchase order inquiry sent to Farmer with your verified buyer coordinates!', 'success');
    document.getElementById('buyerOrderModal')?.classList.add('hidden');
  } else {
    showToast('Failed to submit order', 'error');
  }
}

// ----------------------------------------------------
// 8. AGRICULTURAL EXPERT & PATHOLOGIST PORTAL
// ----------------------------------------------------
async function loadRegisteredExpertsForScanner(crop = '', disease = '') {
  const scannerListEl = document.getElementById('scannerExpertsListContainer');
  const standaloneListEl = document.getElementById('scannerStandaloneExpertsList');
  try {
    const query = new URLSearchParams();
    if (crop) query.set('crop', crop);
    if (disease) query.set('disease', disease);
    const res = await apiFetch(`/experts/list?${query.toString()}`);
    if (!res.ok) return;
    const experts = await res.json();

    const selectedInput = document.getElementById('selectedExpertIdForCase');
    if (experts.length > 0 && selectedInput && !selectedInput.value) {
      selectedInput.value = experts[0].expert_id;
    }

    const renderExpertCards = (targetEl, isInteractive) => {
      if (!targetEl) return;
      targetEl.innerHTML = '';
      if (!experts || experts.length === 0) {
        targetEl.innerHTML = `
          <div class="p-3.5 rounded-xl bg-white border border-purple-200 text-xs text-slate-600">
            अभी कोई Leaf Disease Expert लॉग-इन/रजिस्टर्ड नहीं है। जैसे ही कोई Expert लॉग-इन पेज पर <strong>"Leaf Disease Expert"</strong> में अपनी फसल/रोग विशेषज्ञता भरकर अकाउंट बनाएगा या लॉग-इन करेगा, उसका नाम और विशेषज्ञता यहाँ दिखाई देगी। आप फिर भी अपना सवाल नीचे भेज सकते हैं।
          </div>
        `;
        return;
      }

      const activeExpertId = parseInt(document.getElementById('selectedExpertIdForCase')?.value || experts[0].expert_id);
      experts.forEach(exp => {
        const isSelected = exp.expert_id === activeExpertId;
        const card = document.createElement('div');
        card.className = `p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isSelected
            ? 'bg-purple-100/90 border-purple-600 ring-2 ring-purple-500/40 shadow-xs'
            : 'bg-white border-purple-200 hover:border-purple-400'
        }`;
        const safeName = (exp.expert_name || 'Leaf Disease Expert').replace(/'/g, "\\'");
        const safeSpec = (exp.specialization || 'Crop Leaf Disease Specialist').replace(/'/g, "\\'");
        card.onclick = () => selectExpertForConsultation(exp.expert_id, safeName, safeSpec, crop, disease);
        card.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-base shrink-0">
              👨‍🔬
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-extrabold text-slate-900 text-sm">${exp.expert_name}</span>
                ${exp.is_specialist_match ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-3xs font-black uppercase">★ Matched Disease Specialist</span>' : ''}
              </div>
              <div class="text-xs font-bold text-purple-900 mt-0.5">
                🌿 Leaf Disease Expert Specialist: <span class="underline decoration-purple-400">${exp.specialization || 'All Crop Leaf Diseases'}</span>
              </div>
              <div class="text-2xs text-slate-500 mt-0.5">
                📍 ${exp.institution || 'Verified Leaf Disease Specialist'} ${exp.expert_phone ? `• 📞 ${exp.expert_phone}` : ''}
              </div>
            </div>
          </div>
          <div class="shrink-0">
            <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold ${
              isSelected ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 border border-purple-200'
            }">
              ${isSelected ? '✔ Selected Expert' : 'Select Expert'}
            </span>
          </div>
        `;
        targetEl.appendChild(card);
      });
    };

    renderExpertCards(scannerListEl, true);
    renderExpertCards(standaloneListEl, false);
  } catch (err) {
    console.error('Error loading registered experts:', err);
  }
}

function selectExpertForConsultation(expertId, expertName, expertSpec, crop = '', disease = '') {
  const selectedInput = document.getElementById('selectedExpertIdForCase');
  if (selectedInput) selectedInput.value = expertId;
  showToast(`👨‍🔬 Selected ${expertName} (${expertSpec})`, 'info');
  loadRegisteredExpertsForScanner(crop, disease);
}

async function loadFarmerConsultationsHistory() {
  const container = document.getElementById('farmerConsultationsHistory');
  if (!container) return;
  try {
    const res = await apiFetch('/experts/queue');
    if (!res.ok) return;
    const cases = await res.json();
    container.innerHTML = '';
    if (!cases || cases.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500">आपने अभी तक किसी Leaf Disease Expert को कोई सवाल नहीं भेजा है।</p>';
      return;
    }
    cases.forEach(c => {
      const isCompleted = c.status === 'COMPLETED';
      const item = document.createElement('div');
      item.className = `p-3.5 rounded-xl border ${isCompleted ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'} text-xs space-y-1.5`;
      item.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-extrabold text-slate-900">${c.crop} • ${c.ai_disease}</span>
          <span class="px-2.5 py-0.5 rounded-full text-3xs font-black uppercase ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${isCompleted ? '✔ Expert Reply Received' : '⏳ Sent to Expert'}
          </span>
        </div>
        <div class="text-purple-900 font-bold">
          👨‍🔬 To Expert: ${c.expert_name || 'Leaf Disease Expert'} (${c.expert_specialization || 'Crop Leaf Disease Specialist'})
        </div>
        <div class="text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
          <strong>आपका सवाल (Your Problem):</strong> "${c.farmer_query}"
        </div>
        ${isCompleted && c.expert_prescription ? `
          <div class="p-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-950">
            <strong>🩺 ${c.expert_name} (${c.expert_specialization}) की सलाह / Prescription:</strong>
            <div class="mt-1 font-medium">${c.expert_prescription}</div>
          </div>
        ` : ''}
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading farmer consultations history:', err);
  }
}

async function submitCaseToExpertPathologist() {
  const cropSelect = document.getElementById('scannerCropSelect');
  const rawCrop = document.getElementById('resCropName')?.innerText || cropSelect?.value || 'Tomato';
  const crop = rawCrop !== '---' ? rawCrop : (cropSelect?.value || 'Tomato');
  const rawDisease = document.getElementById('resDiseaseName')?.innerText || 'Leaf Disease';
  const disease = rawDisease !== '---' ? rawDisease : 'Leaf Disease';
  const confText = document.getElementById('resConfidence')?.innerText || '90%';
  const confidence = parseFloat(confText.replace('%', '')) / 100.0 || 0.90;
  const severityEl = document.getElementById('resSeverity')?.innerText || 'Moderate';
  const severity = severityEl !== '---' ? severityEl : 'Moderate';
  const symptoms = document.getElementById('resSymptoms')?.innerText || 'Leaf spots and disease symptoms reported by farmer.';
  const farmerName = state.user?.full_name || 'Farmer';
  const farmerPhone = state.user?.phone_number || '';
  const selectedExpertIdVal = document.getElementById('selectedExpertIdForCase')?.value;
  const expertId = selectedExpertIdVal ? parseInt(selectedExpertIdVal) : null;
  const customProblem = document.getElementById('farmerExpertProblemInput')?.value?.trim();
  const farmerQuery = customProblem || `मेरी ${crop} फसल की पत्तियों में ${disease} की समस्या है। कृपया उचित उपचार और दवा की सलाह दें।`;

  const btn = document.getElementById('btnSubmitToPathologist');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> <span>Sending Problem to Expert...</span>';
  }

  try {
    const res = await apiFetch('/experts/consultations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop,
        disease,
        confidence,
        severity,
        symptoms,
        expert_id: expertId,
        farmer_name: farmerName,
        farmer_phone: farmerPhone,
        farmer_query: farmerQuery
      })
    });

    if (res.ok) {
      const data = await res.json();
      showToast(`🩺 आपका सवाल ${data.expert_name || 'Leaf Disease Expert'} (${data.expert_specialization || 'Specialist'}) को सफलतापूर्वक भेज दिया गया है!`, 'success');
      loadFarmerConsultationsHistory();
    } else {
      showToast('Failed to send problem to expert', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Network error sending problem to expert', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>✔</span> <span>Problem Sent to Leaf Disease Expert</span>';
    }
  }
}

async function initExpertPortalView() {
  const expertNameEl = document.getElementById('expertPortalUserName');
  const expertBadgeEl = document.getElementById('expertPortalSpecialistBadge');
  if (expertNameEl && state.user?.full_name) {
    expertNameEl.innerText = state.user.full_name;
  }
  if (expertBadgeEl) {
    const spec = state.user?.specialization || state.user?.farm_name || 'Crop Leaf Disease Specialist';
    expertBadgeEl.innerText = `🌿 Leaf Disease Expert: ${spec}`;
  }

  const res = await apiFetch('/experts/queue');
  const container = document.getElementById('expertQueueContainer');
  if (!res.ok || !container) return;

  const cases = await res.json();
  container.innerHTML = '';
  if (cases.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-center py-8">अभी किसी किसान का सवाल पेंडिंग नहीं है (No farmer leaf disease problems in queue yet). जब किसान Check Disease पेज से आपको अपनी समस्या भेजेंगे, तो वह यहाँ दिखाई देगी।</p>';
    return;
  }

  const loggedExpertName = state.user?.full_name || 'Leaf Disease Expert';
  const loggedExpertSpec = state.user?.specialization || state.user?.farm_name || 'Crop Leaf Disease Specialist';

  cases.forEach(c => {
    const card = document.createElement('div');
    const isCompleted = c.status === 'COMPLETED';
    const displayExpertName = c.expert_name || loggedExpertName;
    const displayExpertSpec = c.expert_specialization || loggedExpertSpec;
    card.className = `p-5 bg-white rounded-2xl border ${isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-purple-200'} shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between`;
    
    card.innerHTML = `
      <div class="flex gap-4 items-start">
        <img src="${c.image_url || '/static/assets/leaf_tomato_early_blight.svg'}" class="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs" onerror="this.src='/static/assets/leaf_tomato_early_blight.svg'">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-black px-2.5 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'} uppercase tracking-wide">
              ${c.status === 'COMPLETED' ? '✔ PRESCRIBED & RESOLVED' : '⏳ FARMER QUESTION AWAITING YOUR ADVICE'}
            </span>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
              🌿 Specialist: ${displayExpertSpec}
            </span>
            <span class="text-xs text-slate-400 font-mono">${c.created_at ? c.created_at.split('T')[0] : 'Today'}</span>
          </div>
          <h4 class="font-extrabold text-slate-900 text-lg mt-1">${c.crop} • ${c.ai_disease}</h4>
          <p class="text-xs text-slate-500">AI Confidence: <strong>${Math.round(c.ai_confidence * 100)}%</strong> • Severity: <strong>${c.severity}</strong></p>
          <p class="text-xs text-slate-800 font-semibold mt-1">👨‍🌾 <strong>Farmer:</strong> ${c.farmer_name} ${c.farmer_phone ? `(${c.farmer_phone})` : ''}</p>
          <p class="text-xs text-purple-900 bg-purple-50 p-2.5 rounded-xl mt-2 border border-purple-200">
            <strong>Farmer's Question / Problem:</strong> "${c.farmer_query}"
          </p>
          ${isCompleted ? `
            <div class="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              <strong>🩺 ${displayExpertName} (${displayExpertSpec}) - Clinical Prescription:</strong>
              <div class="mt-1">${c.expert_prescription || 'Prescription recorded.'}</div>
            </div>
          ` : ''}
        </div>
      </div>

      ${!isCompleted ? `
        <div class="w-full md:w-80 shrink-0 space-y-2">
          <label class="block text-2xs font-extrabold uppercase tracking-wider text-purple-900">${displayExpertName} (${displayExpertSpec}) - Prescription</label>
          <textarea id="expertPrescription_${c.consultation_id}" class="w-full text-xs p-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white shadow-xs" rows="3" placeholder="Type verified leaf disease diagnosis, medicine name, and dosage for the farmer...">${c.expert_prescription || ''}</textarea>
          <button onclick="submitExpertPrescription(${c.consultation_id}, ${c.prediction_id}, '${c.ai_disease}')" class="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5">
            <span>✔</span> <span>Send Advice & Prescription to Farmer</span>
          </button>
        </div>
      ` : `
        <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1 shrink-0">
          <span>✔</span> <span>Prescription Sent</span>
        </span>
      `}
    `;
    container.appendChild(card);
  });
}

async function submitExpertPrescription(consultationId, predictionId, currentDisease) {
  const textarea = document.getElementById(`expertPrescription_${consultationId}`);
  const text = textarea ? textarea.value.trim() : '';

  if (!text) {
    showToast('Please type prescription recommendations first', 'warning');
    return;
  }

  const res = await apiFetch(`/experts/consultations/${consultationId}/prescribe?diagnosis=${encodeURIComponent(currentDisease)}&prescription=${encodeURIComponent(text)}`, {
    method: 'POST'
  });

  if (res.ok) {
    showToast('✔ Prescription recorded and farmer notified!', 'success');
    initExpertPortalView();
  }
}

// ----------------------------------------------------
// 9. SYSTEM ADMIN PORTAL MODULE
// ----------------------------------------------------
async function initAdminPortalView() {
  const res = await apiFetch('/admin/overview');
  if (!res.ok) return;

  const data = await res.json();
  document.getElementById('admTotalUsers').innerText = data.users.total;
  document.getElementById('admTotalFarmers').innerText = data.users.farmers;
  document.getElementById('admTotalPredictions').innerText = data.ai_telemetry.total_predictions;
  document.getElementById('admAvgConfidence').innerText = `${data.ai_telemetry.average_confidence}%`;
  document.getElementById('admActiveModel').innerText = data.ai_telemetry.active_model_version;

  // Load Model Versions
  const mRes = await apiFetch('/admin/models');
  if (mRes.ok) {
    const models = await mRes.json();
    const container = document.getElementById('admModelsList');
    container.innerHTML = '';
    models.forEach(m => {
      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border flex items-center justify-between ${m.is_active ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'}`;
      card.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <h5 class="font-bold text-slate-800 text-sm">${m.model_name}</h5>
            ${m.is_active ? '<span class="px-2 py-0.5 rounded bg-emerald-600 text-white text-2xs font-bold">ACTIVE</span>' : ''}
          </div>
          <p class="text-xs text-slate-500 mt-1">${m.version} • Framework: ${m.framework} • Accuracy: <strong>${m.accuracy}%</strong></p>
        </div>
        ${!m.is_active ? `<button onclick="switchAdminModel('${m.version}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold">Activate</button>` : ''}
      `;
      container.appendChild(card);
    });
  }
}

async function switchAdminModel(version) {
  const res = await apiFetch(`/admin/models/switch?model_version=${encodeURIComponent(version)}`, { method: 'POST' });
  if (res.ok) {
    showToast(`Switched active AI model to ${version}`, 'success');
    initAdminPortalView();
  }
}

// ----------------------------------------------------
// 11. MY FARM & FIELDS MODULE
// ----------------------------------------------------
async function initMyFarmView() {
  const res = await apiFetch('/fields');
  const container = document.getElementById('myFieldsContainer');
  if (!res.ok || !container) return;

  const fields = await res.json();
  container.innerHTML = '';

  fields.forEach(f => {
    let healthBadge = '<span class="badge-healthy px-2.5 py-0.5 rounded-full text-xs font-bold">🌱 Healthy</span>';
    if (f.current_health === 'attention') healthBadge = '<span class="badge-attention px-2.5 py-0.5 rounded-full text-xs font-bold">🟡 Attention</span>';
    else if (f.current_health === 'disease_risk') healthBadge = '<span class="badge-risk px-2.5 py-0.5 rounded-full text-xs font-bold">🔴 Disease Risk</span>';
    else if (f.current_health === 'water_stress') healthBadge = '<span class="badge-water px-2.5 py-0.5 rounded-full text-xs font-bold">🟠 Water Stress</span>';

    const card = document.createElement('div');
    card.className = 'p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-800 text-base">${f.field_name}</h4>
          ${healthBadge}
        </div>
        <p class="text-xs text-slate-500 mt-1">${f.crop} (${f.variety}) • ${f.area} Acres</p>
        <p class="text-xs text-slate-600 mt-2"><strong>Stage:</strong> ${f.growth_stage}</p>
        <p class="text-xs text-slate-600 mt-1"><strong>Irrigation:</strong> ${f.irrigation} | <strong>Soil:</strong> ${f.soil_type}</p>
        <p class="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg">${f.notes || 'Normal crop development'}</p>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button onclick="quickScanField('${f.crop}', ${f.id})" class="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold">📷 Scan Leaf</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function quickScanField(crop, fieldId) {
  switchTab('scanner');
  const cropSelect = document.getElementById('scannerCropSelect');
  if (cropSelect) cropSelect.value = crop;
}

// Event Listeners setup
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  // Language selector
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => switchLanguage(e.target.value));
  }

  // File upload input
  const fileInput = document.getElementById('leafFileInput');
  if (fileInput) fileInput.addEventListener('change', handleLeafFileUpload);

  // Business inputs calculate on change
  ['bizCropSelect', 'bizAcres', 'bizSeed', 'bizFertilizer', 'bizLabour', 'bizIrrigation', 'bizProtection', 'bizEquipment', 'bizTransport', 'bizYield', 'bizPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateBusinessScenario);
  });

  // Soil inputs calculate on change
  ['soilInputPH', 'soilInputN', 'soilInputP', 'soilInputK', 'soilInputOC', 'soilInputMoisture', 'soilInputType'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', analyzeSoilParams);
  });
}
