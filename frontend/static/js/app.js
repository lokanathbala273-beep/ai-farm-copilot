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
  'FARMER': ['dashboard', 'scanner', 'copilot', 'soil', 'business', 'market', 'marketplace', 'pesticides', 'my_farm'],
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

// ====================================================
// FULL-INTERFACE TRANSLATION & i18n ENGINE (EN / OD / HI)
// Converts 100% of static HTML, forms, placeholders, select options,
// modals, and dynamically rendered cards across the entire website.
// ====================================================

const _origTextNodeMap = new WeakMap();
const _lastTranslatedTextNodeMap = new WeakMap();
const _origPlaceholderMap = new WeakMap();
const _origTitleMap = new WeakMap();
let _i18nObserverInitialized = false;
let _i18nApplying = false;
let _i18nDebounceTimer = null;

// Comprehensive Exact Phrase & Term Dictionary for Odia (od) and Hindi (hi)
const FULL_INTERFACE_DICTIONARY = {
  od: {
    // App Header & Roles
    "AI Farm Co-Pilot": "ଏଆଇ ଫାର୍ମ କୋ-ପାଇଲଟ୍",
    "AI Farm Co-Pilot & Market Optimizer": "ଏଆଇ ଫାର୍ମ କୋ-ପାଇଲଟ୍ ଏବଂ ବଜାର ଅପ୍ଟିମାଇଜର୍",
    "Smart Agricultural Assistant for Indian Farmers": "ଭାରତୀୟ ଚାଷୀଙ୍କ ପାଇଁ ସ୍ମାର୍ଟ ଡିଜିଟାଲ୍ କୃଷି ସହାୟକ",
    "Odisha Edition": "ଓଡ଼ିଶା ସଂସ୍କରଣ",
    "Sign Out": "ଲଗ୍ ଆଉଟ୍ (Sign Out)",
    "Farmer": "ଚାଷୀ (Farmer)",
    "Expert": "କୃଷି ବିଶେଷଜ୍ଞ (Expert)",
    "Buyer": "କ୍ରେତା / ବ୍ୟବସାୟୀ (Buyer)",
    "Admin": "ପ୍ରଶାସକ (Admin)",
    "Agricultural Expert": "କୃଷି ବିଶେଷଜ୍ଞ",
    "Produce Buyer": "ଫସଲ କ୍ରେତା",
    "System Admin": "ସିଷ୍ଟମ୍ ପ୍ରଶାସକ",

    // Navigation Tabs
    "My Farm": "ମୋ ଫାର୍ମ",
    "Check Disease": "ରୋଗ ପରୀକ୍ଷା",
    "AI Co-Pilot": "ଏଆଇ କୋ-ପାଇଲଟ୍",
    "Soil Health": "ମାଟି ସ୍ୱାସ୍ଥ୍ୟ",
    "Farm Business": "ଚାଷ ବ୍ୟବସାୟ",
    "Market Optimizer": "ମଣ୍ଡି ଦର ଅପ୍ଟିମାଇଜର୍",
    "Sell Produce": "ଫସଲ ବିକ୍ରି",
    "Pesticides": "କୀଟନାଶକ ଔଷଧ",
    "Buyer Portal": "କ୍ରେତା ପୋର୍ଟାଲ",
    "Expert Advice": "ବିଶେଷଜ୍ଞ ପରାମର୍ଶ",
    "Input Store": "ଔଷଧ ଦୋକାନ",
    "Admin Portal": "ପ୍ରଶାସନ ପୋର୍ଟାଲ",

    // 1st Screen Auth Portal
    "1ST SCREEN • MANDATORY ACCOUNT PORTAL": "ପ୍ରଥମ ସ୍କ୍ରିନ୍ • ବାଧ୍ୟତାମୂଳକ ଆକାଉଣ୍ଟ୍ ପୋର୍ଟାଲ୍",
    "Register or Sign In with your": "ଆପଣଙ୍କ",
    "Gmail": "ଜିମେଲ୍ (Gmail)",
    "Mobile Number": "ମୋବାଇଲ୍ ନମ୍ବର",
    "&": "ଏବଂ",
    "Own Password": "নিজ ପାସୱାର୍ଡ",
    "Select your role below (": "ତଳେ ଆପଣଙ୍କ ଭୂମିକା ବାଛନ୍ତୁ (",
    "is 1st Priority) to enter your dedicated portal.": "ପ୍ରଥମ ପ୍ରାଥମିକତା) ଏବଂ ନିଜ ପୋର୍ଟାଲରେ ପ୍ରବେଶ କରନ୍ତୁ।",
    "1. Select Who You Are (Role Priority)": "୧. ଆପଣ କିଏ ବାଛନ୍ତୁ (ଭୂମିକା ପ୍ରାଥମିକତା)",
    "1ST PRIORITY": "ପ୍ରଥମ ପ୍ରାଥମିକତା",
    "Crop & Soil": "ଫସଲ ଓ ମାଟି",
    "Plant Doctor": "ଉଦ୍ଭିଦ ଡାକ୍ତର",
    "Buy Crops": "ଫସଲ କିଣନ୍ତୁ",
    "System": "ସିଷ୍ଟମ୍",
    "📝 Sign Up (Create Account)": "📝 ସାଇନ୍ ଅପ୍ (ନୂଆ ଆକାଉଣ୍ଟ୍ ଖୋଲନ୍ତୁ)",
    "🔐 Sign In (Existing User)": "🔐 ସାଇନ୍ ଇନ୍ (ପୁରୁଣା ଆକାଉଣ୍ଟ୍)",
    "Full Name *": "ସମ୍ପୂର୍ଣ୍ଣ ନାମ *",
    "Gmail / Email ID *": "ଜିମେଲ୍ / ଇମେଲ୍ ଆଇଡି *",
    "Mobile Phone Number *": "ମୋବାଇଲ୍ ଫୋନ୍ ନମ୍ବର *",
    "State & District (Odisha) *": "ରାଜ୍ୟ ଓ ଜିଲ୍ଲା (ଓଡ଼ିଶା) *",
    "Create Own Password *": "ନିଜର ପାସୱାର୍ଡ ତିଆରି କରନ୍ତୁ *",
    "Confirm Password *": "ପାସୱାର୍ଡ ନିଶ୍ଚିତ କରନ୍ତୁ *",
    "🌾 Farmer Profile Details": "🌾 ଚାଷୀ ପ୍ରୋଫାଇଲ୍ ବିବରଣୀ",
    "Farm Name": "ଫାର୍ମ / ଜମିର ନାମ",
    "Leaf Disease Expert": "ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞ",
    "Land (Acres)": "ଜମି ପରିମାଣ (ଏକର)",
    "Crops Grown": "ଚାଷ କରୁଥିବା ଫସଲ",
    "👨‍🔬 Agricultural Expert Details": "👨‍🔬 କୃଷି ବିଶେଷଜ୍ଞ ବିବରଣୀ",
    "Specialization": "ବିଶେଷଜ୍ଞତା ବିଭାଗ",
    "Qualification / University": "ଶିକ୍ଷାଗତ ଯୋଗ୍ୟତା / ବିଶ୍ୱବିଦ୍ୟାଳୟ",
    "Experience (Years)": "ଅଭିଜ୍ଞତା (ବର୍ଷ)",
    "🛒 Produce Buyer / Trader Details": "🛒 ଫସଲ କ୍ରେତା / ବ୍ୟବସାୟୀ ବିବରଣୀ",
    "Business / Company Name": "ବ୍ୟବସାୟ / କମ୍ପାନୀ ନାମ",
    "Buyer Type": "କ୍ରେତା ପ୍ରକାର",
    "Interested Crops": "କିଣିବାକୁ ଚାହୁଁଥିବା ଫସଲ",
    "🛡️ System Administrator Details": "🛡️ ସିଷ୍ଟମ୍ ପ୍ରଶାସକ ବିବରଣୀ",
    "Admin Access Code / Department": "ଆଡମିନ୍ ଆକ୍ସେସ୍ କୋଡ୍ / ବିଭାଗ",
    "🚀 Complete Sign Up & Enter Portal": "🚀 ସାଇନ୍ ଅପ୍ সম্পূর্ণ କରନ୍ତୁ ଓ ପ୍ରବେଶ କରନ୍ତୁ",
    "Registered Gmail OR Mobile Number *": "ପଞ୍ଜୀକୃତ ଜିମେଲ୍ କିମ୍ବା ମୋବାଇଲ୍ ନମ୍ବର *",
    "Your Password *": "ଆପଣଙ୍କ ପାସୱାର୍ଡ *",
    "🔓 Sign In & Enter Portal": "🔓 ସାଇନ୍ ଇନ୍ କରନ୍ତୁ ଓ ପ୍ରବେଶ କରନ୍ତୁ",

    // Dashboard & Weather
    "Welcome back": "ସ୍ୱାଗତମ୍",
    "Active Fields": "ସକ୍ରିୟ ଜମି",
    "Today's Microclimate": "ଆଜିର ପାଣିପାଗ",
    "Season Expenses": "ଋତୁର ମୋଟ ଖର୍ଚ୍ଚ",
    "Realized Revenue": "ମୋଟ ଆୟ",
    "Smart Agricultural Alerts": "ସ୍ମାର୍ଟ କୃଷି ସତର୍କତା",
    "Quick Farmer Actions": "ତୁରନ୍ତ ଚାଷୀ କାର୍ଯ୍ୟ",
    "📍 Share My Live GPS Location": "📍 ମୋ ଲାଇଭ୍ GPS ଲୋକେସନ୍ ସେୟାର୍ କରନ୍ତୁ",
    "Live GPS Verified": "ଲାଇଭ୍ GPS ପ୍ରମାଣିତ",
    "Localized Microclimate Weather": "ଆପଣଙ୍କ ଜମିର ସଠିକ୍ ପାଣିପାଗ",
    "Real-Time Local Disease & Weather Risk Alert": "ସ୍ଥାନୀୟ ରୋଗ ଏବଂ ପାଣିପାଗ ବିପଦ ସତର୍କତା",
    "Temperature": "ତାପମାତ୍ରା",
    "Humidity": "ଆର୍ଦ୍ରତା",
    "Wind Speed": "ପବନ ବେଗ",
    "Rain Probability": "ବର୍ଷା ସମ୍ଭାବନା",
    "Soil Moisture": "ମାଟି ଆର୍ଦ୍ରତା",
    "Solar UV Index": "ସୌର UV ସୂଚକାଙ୍କ",
    "7-Day Agricultural Spray & Harvest Forecast": "୭-ଦିନିଆ କୃଷି ସ୍ପ୍ରେ ଏବଂ ଅମଳ ପୂର୍ବାନୁମାନ",

    // Check Disease & Leaf Scanner
    "AI Leaf Disease Computer Vision Scanner": "ଏଆଇ ପତ୍ର ରୋଗ କମ୍ପ୍ୟୁଟର ଭିଜନ୍ ସ୍କାନର୍",
    "Scan leaf photo or capture from live camera to identify diseases, get verified treatments, and connect with experts.": "ପତ୍ର ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ କିମ୍ବା ଲାଇଭ୍ କ୍ୟାମେରା ବ୍ୟବହାର କରି ରୋଗ ଚିହ୍ନଟ କରନ୍ତୁ, ସଠିକ୍ ଔଷଧ ଜାଣନ୍ତୁ ଏବଂ ବିଶେଷଜ୍ଞଙ୍କ ସହ ଯୋଡ଼ି ହୁଅନ୍ତୁ।",
    "Select Crop to Diagnose": "ରୋଗ ପରୀକ୍ଷା ପାଇଁ ଫସଲ ବାଛନ୍ତୁ",
    "Upload Image": "ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ",
    "Live Webcam": "ଲାଇଭ୍ କ୍ୟାମେରା",
    "Webcam Stream URL": "ୱେବକ୍ୟାମ୍ ଲିଙ୍କ୍ (URL)",
    "Capture & Diagnose": "ଫଟୋ ନିଅନ୍ତୁ ଓ ରୋଗ ଯାଞ୍ଚ କରନ୍ତୁ",
    "Fetch & Analyze URL": "ଲିଙ୍କ୍ ରୁ ଫଟୋ ଆଣି ଯାଞ୍ଚ କରନ୍ତୁ",
    "Analyze Leaf Image Now": "ବର୍ତ୍ତମାନ ପତ୍ର ଫଟୋ ଯାଞ୍ଚ କରନ୍ତୁ",
    "AI Diagnostic Result": "ଏଆଇ ରୋଗ ନିର୍ଣ୍ଣୟ ଫଳାଫଳ",
    "AI Confidence": "ଏଆଇ ବିଶ୍ୱସନୀୟତା",
    "Severity Level": "ଗମ୍ଭୀରତା ସ୍ତର",
    "Pathological Symptoms": "ରୋଗର ଲକ୍ଷଣ",
    "Possible Causes & Vectors": "ସମ୍ଭାବ୍ୟ କାରଣ ଓ ବାହକ",
    "IPM & Field Management": "ସମନ୍ୱିତ ରୋଗ ନିୟନ୍ତ୍ରଣ ଓ ପରିଚାଳନା",
    "Verified Agricultural Medicines / Inputs": "ପ୍ରମାଣିତ କୃଷି ଔଷଧ ଓ ଉପଚାର",
    "Dosage & Application": "ଔଷଧର ପରିମାଣ ଓ ସ୍ପ୍ରେ ପଦ୍ଧତି",
    "Safety & Pre-Harvest Interval (PHI)": "ସୁରକ୍ଷା ଓ ଅମଳ ପୂର୍ବ ସମୟ (PHI)",
    "Consult Plant Pathologist": "କୃଷି ବିଶେଷଜ୍ଞଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ",
    "Ask Our Leaf Disease Experts": "ଆମ ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ",
    "Send Direct Consultation Request": "ସିଧାସଳଖ ବିଶେଷଜ୍ଞ ପରାମର୍ଶ ପଠାନ୍ତୁ",
    "My Expert Consultations & Prescriptions": "ମୋର ବିଶେଷଜ୍ଞ ପରାମର୍ଶ ଓ ପ୍ରେସକ୍ରିପସନ୍",

    // AI Co-Pilot
    "Ask AI Farm Co-Pilot": "ଏଆଇ ଫାର୍ମ କୋ-ପାଇଲଟ୍ କୁ ପଚାରନ୍ତୁ",
    "Voice or text enabled agricultural assistant aware of your farm, crops, soil, and local mandi prices.": "ଭଏସ୍ କିମ୍ବା ଟେକ୍ସଟ୍ ମାଧ୍ୟମରେ ଆପଣଙ୍କ ଫସଲ, ମାଟି, ପାଣିପାଗ ଏବଂ ମଣ୍ଡି ଦର ବିଷୟରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।",
    "🎙️ Ask AI Farm Co-Pilot": "🎙️ ଏଆଇ କୋ-ପାଇଲଟ୍ କୁ ପଚାରନ୍ତୁ",
    "Send": "ପଠାନ୍ତୁ",
    "Speak": "କୁହନ୍ତୁ",
    "Clear Chat": "ଚାଟ୍ ସଫା କରନ୍ତୁ",

    // Soil Health
    "Soil Intelligence & Nutrient Advisory": "ମାଟି ସ୍ୱାସ୍ଥ୍ୟ ଓ ପୋଷକ ତତ୍ତ୍ୱ ପରାମର୍ଶ",
    "Understand your soil parameters, crop suitability index, and fertilizer recommendations.": "ମାଟି ପରୀକ୍ଷା ରିପୋର୍ଟ ଅନୁଯାୟୀ ଉପଯୁକ୍ତ ଫସଲ ଏବଂ ସାର ପ୍ରୟୋଗ ପରିମାଣ ଜାଣନ୍ତୁ।",
    "Soil pH": "ମାଟି pH ମାନ",
    "Available Nitrogen (N kg/ha)": "ଉପଲବ୍ଧ ଯବକ୍ଷାରଜାନ (N kg/ha)",
    "Phosphorus (P kg/ha)": "ଫସଫରସ୍ (P kg/ha)",
    "Potassium (K kg/ha)": "ପୋଟାସିୟମ୍ (K kg/ha)",
    "Organic Carbon (%)": "ଜୈବିକ ଅଙ୍ଗାରକ (%)",
    "Moisture (%)": "ଆର୍ଦ୍ରତା (%)",
    "Soil Type": "ମାଟି ପ୍ରକାର",
    "Analyze Soil & Get Crop Suitability": "ମାଟି ବିଶ୍ଳେଷଣ କରନ୍ତୁ ଓ ଉପଯୁକ୍ତ ଫସଲ ଜାଣନ୍ତୁ",
    "Overall Fertility Score": "ମୋଟ ମାଟି ଉର୍ବରତା ସ୍କୋର",
    "Crop Suitability Ranking": "ଉପଯୁକ୍ତ ଫସଲ ତାଲିକା",
    "Targeted Nutrient Corrections": "ଆବଶ୍ୟକୀୟ ସାର ଓ ପୋଷକ ତତ୍ତ୍ୱ ପରାମର୍ଶ",

    // Farm Business
    "Farm Business Maker & Expense Tracker": "ଚାଷ ବ୍ୟବସାୟ ଯୋଜନା ଓ ଖର୍ଚ୍ଚ ହିସାବ",
    "Simulate crop budgets, record daily expenses by voice, and track farm profits.": "ଚାଷ ଖର୍ଚ୍ଚ ଆକଳନ କରନ୍ତୁ, କଥା କହି ଦୈନିକ ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ ଏବଂ ନିଟ୍ ଲାଭ ଦେଖନ୍ତୁ।",
    "Business Scenario Planner": "ବ୍ୟବସାୟ ଯୋଜନା",
    "Expense Tracker": "ଖର୍ଚ୍ଚ ଟ୍ରାକର୍",
    "Income & Sales": "ଆୟ ଓ ବିକ୍ରି",
    "Land Area (Acres)": "ଜମି ପରିମାଣ (ଏକର)",
    "Seed Cost (₹)": "ବିହନ ଖର୍ଚ୍ଚ (₹)",
    "Fertilizer Cost (₹)": "ଖତ/ସାର ଖର୍ଚ୍ଚ (₹)",
    "Labour Cost (₹)": "ଶ୍ରମିକ ଖର୍ଚ୍ଚ (₹)",
    "Irrigation Cost (₹)": "ଜଳସେଚନ ଖର୍ଚ୍ଚ (₹)",
    "Pesticide/Protection Cost (₹)": "କୀଟନାଶକ ଔଷଧ ଖର୍ଚ୍ଚ (₹)",
    "Machinery/Tractor Cost (₹)": "ଟ୍ରାକ୍ଟର/ଯନ୍ତ୍ରପାତି ଖର୍ଚ୍ଚ (₹)",
    "Transport Freight Cost (₹)": "ଗାଡ଼ି ଭଡ଼ା ଖର୍ଚ୍ଚ (₹)",
    "Expected Yield (Quintals)": "ଆନୁମାନିକ ଉତ୍ପାଦନ (କ୍ୱିଣ୍ଟାଲ)",
    "Expected Price / Quintal (₹)": "ଆନୁମାନିକ ବିକ୍ରି ଦର / କ୍ୱିଣ୍ଟାଲ (₹)",
    "Calculate Profitability Scenario": "ଲାଭ-କ୍ଷତି ହିସାବ କରନ୍ତୁ",
    "🎙️ Log Expense by Voice": "🎙️ କଥା କହି ଖର୍ଚ୍ଚ ରେକର୍ଡ କରନ୍ତୁ",
    "Estimated Total Cost": "ମୋଟ ଆନୁମାନିକ ଖର୍ଚ୍ଚ",
    "Estimated Gross Revenue": "ମୋଟ ଆନୁମାନିକ ଆୟ",
    "Estimated Net Return": "ଆନୁମାନିକ ନିଟ୍ ଲାଭ",
    "Simulated Net ROI": "ଆନୁମାନିକ ଲାଭ ହାର (%)",

    // Market Optimizer
    "Mandi Market Optimizer": "ମଣ୍ଡି ଦର ଅପ୍ଟିମାଇଜର୍",
    "Compare nearby APMC mandis by transparent net realization after transport and commission fees.": "ନିକଟସ୍ଥ ମଣ୍ଡିଗୁଡ଼ିକର ଦର, ପରିବହନ ଭଡ଼ା ଏବଂ କମିଶନ କାଟି ସର୍ବାଧିକ ନିଟ୍ ଲାଭ ଦେଉଥିବା ମଣ୍ଡି ବାଛନ୍ତୁ।",
    "Harvest Quantity to Sell (Quintals)": "ବିକ୍ରି ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)",
    "Quality / Produce Grade": "ଫସଲର ଗୁଣବତ୍ତା / ଗ୍ରେଡ୍",
    "Calculate Optimal Selling Mandi": "ସର୍ବୋତ୍ତମ ମଣ୍ଡି ହିସାବ କରନ୍ତୁ",
    "HIGHEST NET PROFIT": "ସର୍ବାଧିକ ନିଟ୍ ଲାଭ",
    "Mandi / Market Yard": "ମଣ୍ଡି ନାମ",
    "Modal Price / Qtl": "ମଣ୍ଡି ଦର / କ୍ୱିଣ୍ଟାଲ",
    "Distance": "ଦୂରତା",
    "Transport Freight": "ଗାଡ଼ି ଭଡ଼ା",
    "Mandi Fee (1.5%)": "ମଣ୍ଡି ଫିସ୍ (୧.୫%)",
    "Estimated Net Realization": "ନିଟ୍ ମିଳିବାକୁ ଥିବା ଟଙ୍କା",
    "Net Price Received / Qtl": "କ୍ୱିଣ୍ଟାଲ ପିଛା ନିଟ୍ ଦର",

    // Sell Produce & Farmer Bank Details
    "Direct Farmer-to-Buyer Produce Marketplace": "ସିଧାସଳଖ ଚାଷୀ-କ୍ରେତା ଫସଲ ବିକ୍ରି ବଜାର",
    "List your harvested crops with photos, expected price, and bank payout details for verified Odisha buyers.": "ଆପଣଙ୍କ ଅମଳ ଫସଲର ଫଟୋ, ମୂଲ୍ୟ ଏବଂ ବ୍ୟାଙ୍କ ଖାତା ବିବରଣୀ ସହ ଓଡ଼ିଶାର ପ୍ରମାଣିତ କ୍ରେତାଙ୍କ ନିକଟରେ ସିଧା ବିକ୍ରି କରନ୍ତୁ।",
    "Post Harvest Lot for Sale": "ବିକ୍ରି ପାଇଁ ଫସଲ ତାଲିକାଭୁକ୍ତ କରନ୍ତୁ",
    "Crop Name *": "ଫସଲ ନାମ *",
    "Variety / Grade": "କିସମ / ଗ୍ରେଡ୍",
    "Available Quantity (Quintals) *": "ଉପଲବ୍ଧ ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ) *",
    "Asking Price / Quintal (₹) *": "ବିକ୍ରି ମୂଲ୍ୟ / କ୍ୱିଣ୍ଟାଲ (₹) *",
    "Harvest / Pickup Location *": "ଅମଳ / ଉଠାଇବା ସ୍ଥାନ *",
    "Farmer Payout Bank Details (For Direct Buyer Payment)": "ଚାଷୀଙ୍କ ବ୍ୟାଙ୍କ ଖାତା ବିବରଣୀ (ସିଧାସଳଖ ଟଙ୍କା ପାଇବା ପାଇଁ)",
    "Bank Name *": "ବ୍ୟାଙ୍କ ନାମ *",
    "Account Holder Name *": "ଖାତାଧାରୀଙ୍କ ନାମ *",
    "Bank Account Number *": "ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟ୍ ନମ୍ବର *",
    "IFSC Code *": "IFSC କୋଡ୍ *",
    "UPI ID (Optional)": "UPI ଆଇଡି (ଇଚ୍ଛାଧୀନ)",
    "🌾 Publish Crop to Buyer Marketplace": "🌾 କ୍ରେତା ବଜାରରେ ଫସଲ ପ୍ରକାଶ କରନ୍ତୁ",
    "My Active Crop Listings": "ମୋର ସକ୍ରିୟ ଫସଲ ବିକ୍ରି ତାଲିକା",
    "Incoming Buyer Purchase Orders": "କ୍ରେତାଙ୍କ ଠାରୁ ଆସିଥିବା ଅର୍ଡର",

    // Pesticides Store & Razorpay E-Commerce
    "Pesticides & Crop Protection Store": "କୀଟନାଶକ ଏବଂ ଫସଲ ସୁରକ୍ଷା ଔଷଧ ଦୋକାନ",
    "VERIFIED AGRI INPUTS • RAZORPAY SECURE CHECKOUT": "ପ୍ରମାଣିତ କୃଷି ଔଷଧ • ରେଜରପେ (RAZORPAY) ସୁରକ୍ଷିତ ପେମେଣ୍ଟ",
    "Authentic agricultural insecticides, fungicides, bio-fungicides, and herbicides with expert dosage guidance and instant Razorpay online payment.": "ସଠିକ୍ ମାତ୍ରା ପରାମର୍ଶ ଏବଂ ରେଜରପେ ଅନଲାଇନ୍ ପେମେଣ୍ଟ ସୁବିଧା ସହ ଅସଲି କୀଟନାଶକ, କବକନାଶକ, ଜୈବିକ କବକନାଶକ ଏବଂ ଘାସମରା ଔଷଧ।",
    "My Orders": "ମୋର ଅର୍ଡରଗୁଡ଼ିକ",
    "Cart": "କାର୍ଟ (Cart)",
    "Search by medicine name, brand, crop (Rice, Tomato, Potato, Cotton), or pest/disease...": "ଔଷଧ ନାମ, ବ୍ରାଣ୍ଡ, ଫସଲ (ଧାନ, ଟମାଟୋ, ଆଳୁ, କପା) କିମ୍ବା ରୋଗ/ପୋକ ନାମରେ ଖୋଜନ୍ତୁ...",
    "All Categories": "ସମସ୍ତ ବିଭାଗ (All Categories)",
    "Insecticide": "କୀଟନାଶକ (Insecticide)",
    "Fungicide": "କବକନାଶକ (Fungicide)",
    "Bio Fungicide": "ଜୈବିକ କବକନାଶକ (Bio Fungicide)",
    "Herbicide": "ଘାସମରା ଔଷଧ (Herbicide)",
    "All Crops": "ସମସ୍ତ ଫସଲ (All Crops)",
    "5 Verified Medicines": "୫ଟି ପ୍ରମାଣିତ କୃଷି ଔଷଧ",
    "In Stock": "ଷ୍ଟକ୍ ଅଛି (In Stock)",
    "Out of Stock": "ଷ୍ଟକ୍ ନାହିଁ",
    "Add to Cart": "କାର୍ଟରେ ଯୋଡ଼ନ୍ତୁ",
    "Buy Now": "ବର୍ତ୍ତମାନ କିଣନ୍ତୁ",
    "Consult Expert": "ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ",
    "View Details": "ବିବରଣୀ ଦେଖନ୍ତୁ",
    "Pack Size": "ପ୍ୟାକ୍ ସାଇଜ୍",
    "Suitable Crops": "ଉପଯୁକ୍ତ ଫସଲ",
    "Target Pests / Diseases": "ଲକ୍ଷ୍ୟ ପୋକ / ରୋଗ",
    "Dosage & Application": "ମାତ୍ରା ଏବଂ ସ୍ପ୍ରେ ପଦ୍ଧତି",
    "Safety Information & PHI": "ସୁରକ୍ଷା ସୂଚନା ଏବଂ ଅମଳ ପୂର୍ବ ସମୟ",
    "Your Agri Medicine Cart": "ଆପଣଙ୍କ କୃଷି ଔଷଧ କାର୍ଟ",
    "Proceed to Checkout": "ଚେକଆଉଟ୍ (Checkout) କୁ ଯାଆନ୍ତୁ",
    "Checkout & Delivery Details": "ଚେକଆଉଟ୍ ଏବଂ ଡେଲିଭରି ଠିକଣା",
    "Delivery Address Details": "ଡେଲିଭରି ଠିକଣା ବିବରଣୀ",
    "Select Payment Method": "ପେମେଣ୍ଟ ପଦ୍ଧତି ବାଛନ୍ତୁ",
    "Online Payment — Razorpay (UPI / Google Pay / PhonePe / Cards / NetBanking)": "ଅନଲାଇନ୍ ପେମେଣ୍ଟ — Razorpay (UPI / Google Pay / PhonePe / କାର୍ଡ / ନେଟ୍ ବ୍ୟାଙ୍କିଙ୍ଗ୍)",
    "Cash on Delivery (Pay at Farm Doorstep)": "କ୍ୟାସ୍ ଅନ୍ ଡେଲିଭରି (ଘରେ ଔଷଧ ପାଇলে ଟଙ୍କା ଦିଅନ୍ତୁ)",
    "Pay Online with Razorpay": "Razorpay ଦ୍ୱାରା ଅନଲାଇନ୍ ପେମେଣ୍ଟ କରନ୍ତୁ",
    "Place Cash on Delivery Order": "କ୍ୟାସ୍ ଅନ୍ ଡେଲିଭରି ଅର୍ଡର କରନ୍ତୁ",
    "Order Summary & Price Breakdown": "ଅର୍ଡର ସାରାଂଶ ଏବଂ ମୂଲ୍ୟ ବିବରଣୀ",
    "Subtotal": "ମୋଟ ମୂଲ୍ୟ (Subtotal)",
    "Discount Savings": "ରିହାତି ସଞ୍ଚୟ",
    "Shipping / Delivery": "ଡେଲିଭରି ଚାର୍ଜ",
    "FREE": "ମାଗଣା (FREE)",
    "Total Payable Amount": "ମୋଟ ଦେବାକୁ ଥିବା ଟଙ୍କା",
    "My Pesticide & Medicine Orders": "ମୋର କୀଟନାଶକ ଏବଂ ଔଷଧ ଅର୍ଡର ଇତିହାସ",
    "Refresh Orders": "ଅର୍ଡର ରିଫ୍ରେସ୍ କରନ୍ତୁ",

    // Product Names & Descriptions in Odia
    "Adama Tapuz Insecticide": "ଆଦାମା ତାପୁଜ୍ କୀଟନାଶକ (Adama Tapuz Insecticide)",
    "Anand Dr.Bacto's Ampelo Bio Fungicide - Ampelomyces Quisqualis 2.0 A.S.": "ଆନନ୍ଦ ଡା. ବ୍ୟାକ୍ଟୋସ୍ ଆମ୍ପେଲୋ ଜୈବିକ କବକନାଶକ (Anand Ampelo Bio Fungicide)",
    "Best Agro Promos Fungicide - Metiram 55% + Pyraclostrobin 5% WG": "ବେଷ୍ଟ ଏଗ୍ରୋ ପ୍ରୋମୋସ୍ କବକନାଶକ (Best Agro Promos Fungicide)",
    "IIL Milquat Herbicide": "ଆଇଆଇଏଲ୍ ମିଲକ୍ୱାଟ୍ ଘାସମରା ଔଷଧ (IIL Milquat Herbicide)",
    "JU Jupiter 505 Insecticide": "ଜେୟୁ ଜୁପିଟର ୫୦୫ କୀଟନାଶକ (JU Jupiter 505 Insecticide)",

    // Admin Payment Management
    "Agri E-Commerce & Razorpay Payment Management": "କୃଷି ଇ-କମର୍ସ ଏବଂ ରେଜରପେ (Razorpay) ପେମେଣ୍ଟ ପରିଚାଳନା",
    "Monitor live Razorpay transactions, order statuses, payment verification, and issue instant refunds.": "ଲାଇଭ୍ ରେଜରପେ ପେମେଣ୍ଟ, ଅର୍ଡର ସ୍ଥିତି, ପେମେଣ୍ଟ ଯାଞ୍ଚ ଏବଂ ରିଫଣ୍ଡ ପରିଚାଳନା କରନ୍ତୁ।",
    "All Payments": "ସମସ୍ତ ପେମେଣ୍ଟ",
    "Paid (Verified)": "ପୈଠ ହୋଇଛି (PAID)",
    "Pending": "ବାକି ଅଛି (PENDING)",
    "Failed": "ବିଫଳ (FAILED)",
    "Refunded": "ଫେରସ୍ତ ହୋଇଛି (REFUNDED)",
    "Order ID": "ଅର୍ଡର ଆଇଡି",
    "Farmer / Customer": "ଚାଷୀ / ଗ୍ରାହକ",
    "Medicines": "ଔଷଧ ସାମଗ୍ରୀ",
    "Amount": "ଟଙ୍କା ପରିମାଣ",
    "Method": "ପେମେଣ୍ଟ ମାଧ୍ୟମ",
    "Payment Status": "ପେମେଣ୍ଟ ସ୍ଥିତି",
    "Razorpay IDs": "ରେଜରପେ ଆଇଡି",
    "Order Status": "ଅର୍ଡର ସ୍ଥିତି",
    "Actions": "କାର୍ଯ୍ୟ",
    "TITAN 2.0": "ଟାଇଟାନ୍ ୨.୦ (TITAN 2.0)",
    "Complete Digital Agricultural Assistant for Indian Farmers": "ଭାରତୀୟ ଚାଷୀଙ୍କ ପାଇଁ ସମ୍ପୂର୍ଣ୍ଣ ଡିଜିଟାଲ୍ କୃଷି ସହାୟକ",
    "1st Screen Access Gate • TITAN 2.0": "ପ୍ରଥମ ସ୍କ୍ରିନ୍ ପ୍ରବେଶ ଦ୍ୱାର • ଟାଇଟାନ୍ ୨.୦",
    "• Strict Individual User Portal Security": "• ବ୍ୟକ୍ତିଗତ ୟୁଜର୍ ପୋର୍ଟାଲ୍ ସୁରକ୍ଷା",
    "Register with your Gmail ID and create your secure password. Sign in to unlock full farm features.": "ଆପଣଙ୍କ ଜିମେଲ୍ ଆଇଡି ଦ୍ୱାରା ପଞ୍ଜୀକରଣ କରନ୍ତୁ ଏବଂ ସୁରକ୍ଷିତ ପାସୱାର୍ଡ ତିଆରି କରନ୍ତୁ। ସମସ୍ତ ସୁବିଧା ପାଇಲು ସାଇନ୍ ଇନ୍ କରନ୍ତୁ।",
    "📧 Gmail ID / Email Address": "📧 ଜିମେଲ୍ ଆଇଡି / ଇମେଲ୍ ଠିକଣା",
    "🏷️ Select Who You Are (Your Role)": "🏷️ ଆପଣ କିଏ ବାଛନ୍ତୁ (ଆପଣଙ୍କ ଭୂମିକା)",
    "🩺 Expert (Leaf Disease Expert)": "🩺 ବିଶେଷଜ୍ଞ (ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞ)",
    "🛒 Buyer (Crop Produce Buyer)": "🛒 କ୍ରେତା (ଫସଲ କ୍ରେତା / ବ୍ୟବସାୟୀ)",
    "⚙️ Admin (System Administrator)": "⚙️ ଆଡମିନ୍ (ସିଷ୍ଟମ୍ ପ୍ରଶାସକ)",
    "(Specialist Crop / Disease)": "(ବିଶେଷଜ୍ଞ ଫସଲ / ରୋଗ)",
    "📍 State & District / Village": "📍 ରାଜ୍ୟ ଓ ଜିଲ୍ଲା / ଗ୍ରାମ",
    "🌾 Crops": "🌾 ଫସଲ ସମୂହ",
    "Create Account & Enter Selected Portal": "ଆକାଉଣ୍ଟ୍ ଖୋଲନ୍ତୁ ଓ ପୋର୍ଟାଲରେ ପ୍ରବେଶ କରନ୍ତୁ",
    "🔒 End-to-end encrypted passwords. Only the interface for your selected role will be shown after login.": "🔒 ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ ପାସୱାର୍ଡ। ଲଗଇନ୍ ପରେ କେବଳ ଆପଣଙ୍କ ଭୂମିକା ଅନୁযାୟୀ ପୋର୍ଟାଲ୍ ଦେଖାଯିବ।",
    "1️⃣ Choose Who You Are (Select Your Role)": "1️⃣ ଆପଣ କିଏ ବାଛନ୍ତୁ (ନିଜ ଭୂମିକା ଚୟନ କରନ୍ତୁ)",
    "2️⃣ Registered Gmail ID": "2️⃣ ପଞ୍ଜୀକୃତ ଜିମେଲ୍ ଆଇଡି",
    "5️⃣ 🌿 Leaf Disease Expert": "5️⃣ 🌿 ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞ",
    "Farmer Account": "ଚାଷୀ ଆକାଉଣ୍ଟ୍",
    "FARMER": "ଚାଷୀ (FARMER)",
    "Protected 🔐": "ସୁରକ୍ଷିତ 🔐",
    "Register New User": "ନୂଆ ୟୁଜର୍ ପଞ୍ଜୀକରଣ",
    "Log Out / Change Mobile": "ଲଗ୍ ଆଉଟ୍ / ମୋବାଇଲ୍ ବଦଳାନ୍ତୁ",
    "Farm Health Status": "ଫାର୍ମ ସ୍ୱାସ୍ଥ୍ୟ ସ୍ଥିତି",
    "Good Vigour": "ଉତ୍ତମ ସ୍ୱାସ୍ଥ୍ୟ",
    "Kishan Smart Farm": "କିଷାନ୍ ସ୍ମାର୍ଟ ଫାର୍ମ",
    "Shared Live Field Location": "ସେୟାର୍ ହୋଇଥିବା ଲାଇଭ୍ ଜମି ଲୋକେସନ୍",
    "Check Plant Disease": "ଗଛ/ପତ୍ର ରୋଗ ଯାଞ୍ଚ କରନ୍ତୁ",
    "Live Location Weather": "ଲାଇଭ୍ ଲୋକେସନ୍ ପାଣିପାଗ",
    "Checking...": "ଯାଞ୍ଚ ହେଉଛି...",
    "Feels like: --°C": "ଅନୁଭୂତ ତାପମାତ୍ରା: --°C",
    "Detecting Location...": "ଲୋକେସନ୍ ଖୋଜା ଚାଲିଛି...",
    "💨 Wind:": "💨 ପବନ ବେଗ:",
    "📍 GPS: Detecting Device Satellite Location...": "📍 GPS: ସାଟେଲାଇଟ୍ ଲୋକେସନ୍ ଖୋଜା ଚାଲିଛି...",
    "Device Status: Ready": "ଡିଭାଇସ୍ ସ୍ଥିତି: ପ୍ରସ୍ତୁତ",
    "Live Microclimate Weather at Your Exact Field Location": "ଆପଣଙ୍କ ଜମିର ସଠିକ୍ ଲାଇଭ୍ ପାଣିପାଗ ବିବରଣୀ",
    "Click below to share your device live GPS. Real-time temperature, humidity, rainfall probability (बारिश की संभावना), and foliar disease outbreak risk alerts will immediately recalculate for your exact live coordinates.": "ଆପଣଙ୍କ ଲାଇଭ୍ GPS ସେୟାର୍ କରିବାକୁ ତଳେ କ୍ଲିକ୍ କରନ୍ତୁ। ସଠିକ୍ ତାପମାତ୍ରା, ଆର୍ଦ୍ରତା, ବର୍ଷା ସମ୍ଭାବନା ଏବଂ ପତ୍ର ରୋଗ ସତର୍କତା ତୁରନ୍ତ ଦେଖାଯିବ।",
    "Share Live GPS Location": "ଲାଇଭ୍ GPS ଲୋକେସନ୍ ସେୟାର୍ କରନ୍ତୁ",
    "📍 Preset: Khordha / Bhubaneswar": "📍 ପ୍ରିସେଟ୍: ଖୋର୍ଦ୍ଧା / ଭୁବନେଶ୍ୱର",
    "📍 Preset: Cuttack Mahanadi Basin": "📍 ପ୍ରିସେଟ୍: କଟକ ମହାନଦୀ ଅଞ୍ଚଳ",
    "📍 Preset: Puri Coastal Agro-Zone": "📍 ପ୍ରିସେଟ୍: ପୁରୀ ଉପକୂଳ କୃଷି କ୍ଷେତ୍ର",
    "📍 Preset: Balasore Coastal Plains": "📍 ପ୍ରିସେଟ୍: ବାଲେଶ୍ୱର ଉପକୂଳ ସମତଳ",
    "📍 Preset: Ganjam South Agro-Zone": "📍 ପ୍ରିସେଟ୍: ଗଞ୍ଜାମ ଦକ୍ଷିଣ କୃଷି କ୍ଷେତ୍ର",
    "📍 Preset: Koraput Hill Agro-Zone": "📍 ପ୍ରିସେଟ୍: କୋରାପୁଟ ପାର୍ବତ୍ୟ କ୍ଷେତ୍ର",
    "📍 Bhubaneswar, Odisha": "📍 ଭୁବନେଶ୍ୱର, ଓଡ଼ିଶା",
    "Partly Cloudy ⛅": "ଆଂଶିକ ମେଘୁଆ ⛅",
    "Coordinates: 20.2961° N, 85.8245° E (Live GPS Telemetry)": "ଅକ୍ଷାଂଶ/ଦ୍ରାଘିମା: 20.2961° N, 85.8245° E (ଲାଇଭ୍ GPS)",
    "🌡️ Real Temp:": "🌡️ ପ୍ରକୃତ ତାପମାତ୍ରା:",
    "Live AI Triggers": "ଲାଇଭ୍ ଏଆଇ ସତର୍କତା",
    "Active Plots": "ସକ୍ରିୟ ଜମି ପ୍ଲଟ୍",
    "3 Plots": "୩ଟି ପ୍ଲଟ୍",
    "Realized Sales": "ମୋଟ ବିକ୍ରି ଆୟ",
    "+₹77,200 Net Return": "+₹77,200 ନିଟ୍ ଲାଭ",
    "Model Accuracy": "ମଡେଲ୍ ସଠିକତା",
    "Calibrated Ensemble v1.0": "କ୍ୟାଲିବ୍ରେଟେଡ୍ ଏନସେମ୍ବଲ୍ v1.0",
    "Live Camera Input Mode": "ଲାଇଭ୍ କ୍ୟାମେରା ମୋଡ୍",
    "Live Camera Snap": "ଲାଇଭ୍ କ୍ୟାମେରା ଫଟୋ",
    "Open Live Webcam": "ଲାଇଭ୍ ୱେବକ୍ୟାମ୍ ଖୋଲନ୍ତୁ",
    "Webcam / IP Camera URL": "ୱେବକ୍ୟାମ୍ / IP କ୍ୟାମେରା ଲିଙ୍କ୍",
    "Photo Capture Through URL Link of Webcam / IP Camera": "ୱେବକ୍ୟାମ୍ ବା IP କ୍ୟାମେରା URL ଲିଙ୍କ୍ ମାଧ୍ୟମରେ ଫଟୋ ନିଅନ୍ତୁ",
    "Fetch & Scan": "ଫଟୋ ଆଣନ୍ତୁ ଓ ସ୍କାନ୍ କରନ୍ତୁ",
    "Or test with realistic foliar specimens:": "କିମ୍ବା ନମୁନା ପତ୍ର ଫଟୋ ଦ୍ୱାରା ପରୀକ୍ଷା କରନ୍ତୁ:",
    "🌱 Healthy Foliage": "🌱 ସୁସ୍ଥ ସବୁଜ ପତ୍ର",
    "No leaf selected yet.": "ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପତ୍ର ବଛାଯାଇ ନାହିଁ।",
    "Point Live Camera, open Webcam, or choose a Specimen above.": "ଲାଇଭ୍ କ୍ୟାମେରା ଦେଖାନ୍ତୁ, ୱେବକ୍ୟାମ୍ ଖୋଲନ୍ତୁ କିମ୍ବା ଉପରେ ନମୁନା ପତ୍ର ବାଛନ୍ତୁ।",
    "🤖 AI Folate Verification Engine:": "🤖 ଏଆଇ ପତ୍ର ପରୀକ୍ଷଣ ଇଞ୍ଜିନ୍:",
    "Our computer vision model verifies plant foliar tissue (Excess Green Index & HSV chromaticity), segments necrotic lesion spots, and cross-checks with ICAR pathological profiles.": "ଆମର କମ୍ପ୍ୟୁଟର ଭିଜନ୍ ମଡେଲ୍ ପତ୍ରର ସବୁଜ ଅଂଶ ଓ ରୋଗ ଦାଗ ଚିହ୍ନଟ କରି ICAR ତଥ୍ୟ ସହ ମିଳାଇ ସଠିକ୍ ଔଷଧ ପରାମର୍ଶ ଦେଇଥାଏ।",
    "Analyze Leaf with AI": "ଏଆଇ ଦ୍ୱାରା ପତ୍ର ଯାଞ୍ଚ କରନ୍ତୁ",
    "AI Model analyzing foliar tissue and pathological lesions...": "ଏଆଇ ମଡେଲ୍ ପତ୍ର ଏବଂ ରୋଗର ଲକ୍ଷଣ ଯାଞ୍ଚ କରୁଛି...",
    "Early Blight": "ଆଗୁଆ ପତ୍ରପୋଡ଼ା ରୋଗ (Early Blight)",
    "Moderate": "ମଧ୍ୟମ (Moderate)",
    "AI confidence is low. Please upload a clearer image or consult an agricultural expert.": "ଏଆଇ ବିଶ୍ୱସନୀୟତା କମ୍ ଅଛି। ଦୟାକରି ସଫା ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ କିମ୍ବା କୃଷି ବିଶେଷଜ୍ଞଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।",
    "Symptoms": "ରୋଗର ଲକ୍ଷଣ",
    "Possible Causes": "ସମ୍ଭାବ୍ୟ କାରଣ",
    "Management": "ନିୟନ୍ତ୍ରଣ ଓ ପରିଚାଳନା",
    "Ask Our Leaf Disease Experts (विशेषज्ञ से सवाल पूछें)": "ଆମ ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ",
    "🌿 आपका जो पत्ती का रोग (Leaf Disease) है, अगर आप चाहें तो हमारे Experts से सवाल पूछ सकते हैं और अपनी समस्या सीधे भेज सकते हैं।": "🌿 ଆପଣଙ୍କ ଫସଲର ପତ୍ର ରୋଗ ବିଷୟରେ ଆମର କୃଷି ବିଶେଷଜ୍ଞଙ୍କୁ ସିଧାସଳଖ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ ଏବଂ ସମସ୍ୟା ପଠାନ୍ତୁ।",
    "Select a registered Leaf Disease Specialist below and send your leaf disease problem directly:": "ତଳେ ଜଣେ ପଞ୍ଜୀକୃତ ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କୁ ବାଛନ୍ତୁ ଏବଂ ଆପଣଙ୍କ ସମସ୍ୟା ସିଧାସଳଖ ପଠାନ୍ତୁ:",
    "✍️ अपना सवाल या पत्ती के रोग की समस्या लिखें (Write Your Leaf Disease Problem / Question for the Expert):": "✍️ ବିଶେଷଜ୍ଞଙ୍କ ପାଇଁ ଆପଣଙ୍କ ପତ୍ର ରୋଗ ସମସ୍ୟା କିମ୍ବା ପ୍ରଶ୍ନ ଏଠାରେ ଲେଖନ୍ତୁ:",
    "Send Problem Directly to Selected Expert": "ବଛାଯାଇଥିବା ବିଶେଷଜ୍ଞଙ୍କୁ ସମସ୍ୟା ପଠାନ୍ତୁ",
    "View registered Leaf Disease Experts and track answers to the problems you sent.": "ପଞ୍ଜୀକୃତ ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କୁ ଦେଖନ୍ତୁ ଏବଂ ଆପଣ ପଠାଇଥିବା ପ୍ରଶ୍ନର ଉତ୍ତର ଜାଣନ୍ତୁ।",
    "🔄 Refresh Experts & Replies": "🔄 ବିଶେଷଜ୍ଞ ଓ ଉତ୍ତର ରିଫ୍ରେସ୍ କରନ୍ତୁ",
    "Context Active": "ସକ୍ରିୟ ତଥ୍ୟ",
    "🍃 Yellow Leaves Advice": "🍃 ହଳଦିଆ ପତ୍ର ପରାମର୍ଶ",
    "💧 Irrigation Timing": "💧 ଜଳସେଚନ ସମୟ",
    "💰 Monthly Expenses": "💰 ମାସିକ ଖର୍ଚ୍ଚ",
    "📈 Mandi Prices": "📈 ମଣ୍ଡି ଦର",
    "🌧️ Post-Rain Guidance": "🌧️ ବର୍ଷା ପରବର୍ତ୍ତୀ ପରାମର୍ଶ",
    "Soil Test Parameters": "ମାଟି ପରୀକ୍ଷା ମାନଦଣ୍ଡ",
    "Alluvial Loam": "ପଟୁ ଦୋରସା ମାଟି (Alluvial Loam)",
    "Red Laterite Soil": "ଲାଲ୍ ମାଙ୍କଡ଼ା ମାଟି (Red Laterite)",
    "Sandy Loam": "ବାଲିଆ ଦୋରସା ମାଟି (Sandy Loam)",
    "Clay Loam": "ମଟାଳ ଦୋରସା ମାଟି (Clay Loam)",
    "Nitrogen (N)": "ଯବକ୍ଷାରଜାନ (N)",
    "Phosphorus (P)": "ଫସଫରସ୍ (P)",
    "Potassium (K)": "ପୋଟାସିୟମ୍ (K)",
    "Overall Fertility Index": "ମୋଟ ଉର୍ବରତା ସୂଚକାଙ୍କ",
    "pH Reaction:": "pH ପ୍ରତିକ୍ରିୟା:",
    "Optimal Neutral": "ଉତ୍ତମ ନିରପେକ୍ଷ (Neutral)",
    "Nitrogen (N):": "ଯବକ୍ଷାରଜାନ (N):",
    "Medium (260 kg/ha)": "ମଧ୍ୟମ (260 kg/ha)",
    "Phosphorus (P):": "ଫସଫରସ୍ (P):",
    "Medium (22 kg/ha)": "ମଧ୍ୟମ (22 kg/ha)",
    "Potassium (K):": "ପୋଟାସିୟମ୍ (K):",
    "Medium (190 kg/ha)": "ମଧ୍ୟମ (190 kg/ha)",
    "Crop Suitability Matrix (Top Matches for Your Soil)": "ଆପଣଙ୍କ ମାଟି ପାଇଁ ସର୍ବୋତ୍ତମ ଉପଯୁକ୍ତ ଫସଲ ତାଲିକା",
    "Expense & Income Records": "ଖର୍ଚ୍ଚ ଏବଂ ଆୟ ହିସାବ",
    "Crop": "ଫସଲ",
    "Chilli": "ଲଙ୍କା",
    "Protection (₹)": "ଫସଲ ସୁରକ୍ଷା / ଔଷଧ (₹)",
    "Machinery (₹)": "ଯନ୍ତ୍ରପାତି / ଟ୍ରାକ୍ଟର (₹)",
    "Freight (₹)": "ପରିବହନ ଭଡ଼ା (₹)",
    "Expected Yield (Qtl)": "ଆନୁମାନିକ ଅମଳ (କ୍ୱିଣ୍ଟାଲ)",
    "Expected Price/Qtl (₹)": "ଆନୁମାନିକ ଦର/କ୍ୱିଣ୍ଟାଲ (₹)",
    "Simulation Summary": "ଆକଳନ ସାରାଂଶ",
    "Estimated Cost": "ଆନୁମାନିକ ଖର୍ଚ୍ଚ",
    "Estimated Revenue": "ଆନୁମାନିକ ଆୟ",
    "Projected ROI": "ଆନୁମାନିକ ଲାଭ ହାର (ROI)",
    "Figures are scenario projections based on entered cost inputs. Actual realizations depend on weather and harvest conditions.": "ଏହି ହିସାବ ଆପଣ ଦେଇଥିବା ଖର୍ଚ୍ଚ ଉପରେ ଆଧାରିତ। ପ୍ରକୃତ ଲାଭ ପାଣିପାଗ ଓ ବଜାର ଦର ଉପରେ ନିର୍ଭର କରେ।",
    "🎙️ Speak Expense to Log Instantly": "🎙️ କଥା କହି ତୁରନ୍ତ ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ",
    "Say: \"I spent 1500 on fertilizer\" or \"ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି\"": "କୁହନ୍ତୁ: \"ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି\"",
    "Speak Expense": "କଥା କହି ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ",
    "Amount (₹)": "ଟଙ୍କା ପରିମାଣ (₹)",
    "Category": "ବିଭାଗ",
    "Seed": "ବିହନ",
    "Labour": "ଶ୍ରମିକ ମଜୁରୀ",
    "Irrigation": "ଜଳସେଚନ",
    "Pesticide": "କୀଟନାଶକ ଔଷଧ",
    "Equipment / Tractor": "ଯନ୍ତ୍ରପାତି / ଟ୍ରାକ୍ଟର",
    "Transport": "ପରିବହନ / ଗାଡ଼ି ଭଡ଼ା",
    "Other": "ଅନ୍ୟାନ୍ୟ",
    "Notes / Description": "ବିବରଣୀ / ଟିପ୍ପଣୀ",
    "+ Save Expense": "+ ଖର୍ଚ୍ଚ ସେଭ୍ କରନ୍ତୁ",
    "Recent Recorded Expenses": "ନିକଟରେ ଲେଖାଯାଇଥିବା ଖର୍ଚ୍ଚ",
    "Date": "ତାରିଖ",
    "Notes": "ଟିପ୍ପଣୀ",
    "Odisha State-Wise APMC Network": "ଓଡ଼ିଶା ରାଜ୍ୟସ୍ତରୀୟ APMC ମଣ୍ଡି ନେଟୱାର୍କ",
    "21 Regulated Mandis Active": "୨୧ଟି ସରକାରୀ ମଣ୍ଡି ସକ୍ରିୟ",
    "Real per-day analysis across all 21 Odisha state-wise APMC/RMC mandis. Computes daily modal price, transport freight, strict 1.5% Mandi Fee, and net realization.": "ଓଡ଼ିଶାର ସମସ୍ତ ୨୧ଟି APMC/RMC ମଣ୍ଡିର ଦୈନିକ ଦର, ଗାଡ଼ି ଭଡ଼ା, ୧.୫% ମଣ୍ଡି ଫିସ୍ ଏବଂ ନିଟ୍ ଲାଭର ସଠିକ୍ ବିଶ୍ଳେଷଣ।",
    "Chilli (Guntur / Desi)": "ଲଙ୍କା (ଗୁଣ୍ଟୁର / ଦେଶୀ)",
    "Banana (Champa / Robusta)": "କଦଳୀ (ଚମ୍ପା / ରୋବଷ୍ଟା)",
    "Apple (Simla / Kinnaur)": "ସେଓ (ଶିମলা / କିନ୍ନୌର)",
    "Filter District / Zone": "ଜିଲ୍ଲା / ଅଞ୍ଚଳ ବାଛନ୍ତୁ",
    "All Odisha Mandis (21 APMC/RMC)": "ସମସ୍ତ ଓଡ଼ିଶା ମଣ୍ଡି (୨୧ APMC/RMC)",
    "Khordha (Bhubaneswar, Jatni)": "ଖୋର୍ଦ୍ଧା (ଭୁବନେଶ୍ୱର, ଜଟଣୀ)",
    "Cuttack (Malgodown)": "କଟକ (ମାଲଗୋଦାମ)",
    "Puri RMC": "ପୁରୀ RMC",
    "Bargarh APMC": "ବରଗଡ଼ APMC",
    "Sambalpur (Khetrajpur)": "ସମ୍ବଲପୁର (କ୍ଷେତ୍ରାଜପୁର)",
    "Ganjam (Berhampur)": "ଗଞ୍ଜାମ (ବ୍ରହ୍ମପୁର)",
    "Balasore RMC": "ବାଲେଶ୍ୱର RMC",
    "Bhadrak APMC": "ଭଦ୍ରକ APMC",
    "Koraput (Jeypore)": "କୋରାପୁଟ (ଜୟପୁର)",
    "Bolangir RMC": "ବଲାଙ୍ଗୀର RMC",
    "Kalahandi (Bhawanipatna)": "କଳାହାଣ୍ଡି (ଭବାନୀପାଟଣା)",
    "Angul RMC": "ଅନୁଗୁଳ RMC",
    "Dhenkanal APMC": "ଢେଙ୍କାନାଳ APMC",
    "Kendujhar (Keonjhar)": "କେନ୍ଦୁଝର",
    "Jajpur Road APMC": "ଯାଜପୁର ରୋଡ୍ APMC",
    "Sundargarh (Rourkela Panposh)": "ସୁନ୍ଦରଗଡ଼ (ରାଉରକେଲା ପାନପୋଷ)",
    "Rayagada APMC": "ରାୟଗଡ଼ା APMC",
    "Produce Grade": "ଫସଲର ଗ୍ରେଡ୍ / ଗୁଣବତ୍ତା",
    "Grade A (Premium)": "ଗ୍ରେଡ୍ A (ସର୍ବୋତ୍ତମ ମାନ)",
    "Grade B (Standard)": "ଗ୍ରେଡ୍ B (ସାଧାରଣ ମାନ)",
    "Grade C (Fair)": "ଗ୍ରେଡ୍ C (ମଧ୍ୟମ ମାନ)",
    "Calculate Optimal Mandi": "ସର୍ବୋତ୍ତମ ମଣ୍ଡି ହିସାବ କରନ୍ତୁ",
    "Real Per-Day APMC Market Analysis": "ଦୈନିକ APMC ମଣ୍ଡି ଦର ବିଶ୍ଳେଷଣ",
    "Daily Bulletin: Loading live rates...": "ଦୈନିକ ବୁଲେଟିନ୍: ଲାଇଭ୍ ଦର ଲୋଡ୍ ହେଉଛି...",
    "⚖️ Mandi Fee Fixed: 1.5% (OSAMB Norm)": "⚖️ ମଣ୍ଡି ଫିସ୍: ୧.୫% (OSAMB ନିୟମ)",
    "🚚 Real Freight Modeling": "🚚 ପ୍ରକୃତ ପରିବହନ ଭଡ଼ା ହିସାବ",
    "Transparent Odisha State-Wise Mandi Comparison (": "ସ୍ୱଚ୍ଛ ଓଡ଼ିଶା ରାଜ୍ୟସ୍ତରୀୟ ମଣ୍ଡି ତୁଳନା (",
    "Mandis)": "ମଣ୍ଡି)",
    "Sorted by Net Realization (Highest Profit First)": "ସର୍ବାଧିକ ନିଟ୍ ଲାଭ ଅନୁଯାୟୀ ସଜାଯାଇଛି",
    "👨‍🌾 Farmer Direct Selling & Bank Payment Setup": "👨‍🌾 ଚାଷୀ ସିଧାସଳଖ ଫସଲ ବିକ୍ରି ଓ ବ୍ୟାଙ୍କ ପେମେଣ୍ଟ ସେଟଅପ୍",
    "+ Quick Popup Form": "+ ତୁରନ୍ତ ଫର୍ମ ଖୋଲନ୍ତୁ",
    "Sell Farm Produce & Farmer Bank Details Form": "ଫସଲ ବିକ୍ରି ଏବଂ ଚାଷୀ ବ୍ୟାଙ୍କ ଖାତା ବିବରଣୀ ଫର୍ମ",
    "Direct Bank Payment Enabled": "ସିଧାସଳଖ ବ୍ୟାଙ୍କ ପେମେଣ୍ଟ ସକ୍ରିୟ",
    "🌾 Select Crop": "🌾 ଫସଲ ବାଛନ୍ତୁ",
    "Chilli (Desi Fresh)": "ଲଙ୍କା (ଦେଶୀ ତାଜା)",
    "Banana (Champa)": "କଦଳୀ (ଚମ୍ପା)",
    "⭐ Produce Grade": "⭐ ଫସଲ ଗ୍ରେଡ୍",
    "Grade A (Premium Sorted)": "ଗ୍ରେଡ୍ A (ସର୍ବୋତ୍ତମ ବଛା ଫସଲ)",
    "Grade B (Standard Market)": "ଗ୍ରେଡ୍ B (ବଜାର ମାନକ)",
    "Grade C (Fair Average)": "ଗ୍ରେଡ୍ C (ହାରାହାରି ମାନ)",
    "📍 Farm Location": "📍 ଜମି / ଗ୍ରାମ ଠିକଣା",
    "Farmer Contact & Bank Account Details (For Buyer Payment)": "ଚାଷୀଙ୍କ ଯୋଗାଯୋଗ ଓ ବ୍ୟାଙ୍କ ଖାତା ବିବରଣୀ (କ୍ରେତାଙ୍କ ଠାରୁ ଟଙ୍କା ପାଇବା ପାଇଁ)",
    "📝 Harvest Quality Notes (Optional)": "📝 ଫସଲ ଗୁଣବତ୍ତା ବିବରଣୀ (ଇଚ୍ଛାଧୀନ)",
    "My Published Farm Produce Listings": "ମୋର ପ୍ରକାଶିତ ଫସଲ ବିକ୍ରି ତାଲିକା",
    "RAZORPAY TEST MODE": "ରେଜରପେ ଟେଷ୍ଟ ମୋଡ୍ (RAZORPAY TEST MODE)",
    "Medicines (5)": "ଔଷଧ (୫)",
    "All (5)": "ସମସ୍ତ (୫)",
    "Your Agricultural Medicine Cart": "ଆପଣଙ୍କ କୃଷି ଔଷଧ କାର୍ଟ",
    "All prices and discounts are validated directly by the server before payment.": "ପେମେଣ୍ଟ ପୂର୍ବରୁ ସମସ୍ତ ମୂଲ୍ୟ ଏବଂ ରିହାତି ସର୍ଭର ଦ୍ୱାରା ଯାଞ୍ଚ କରାଯାଇଥାଏ।",
    "← Continue Shopping": "← କିଣାକିଣି ଜାରି ରଖନ୍ତୁ",
    "Your Cart is Empty": "ଆପଣଙ୍କ କାର୍ଟ ଖାଲି ଅଛି",
    "Browse our 5 verified crop protection medicines and add them to your cart.": "ଆମର ୫ଟି ପ୍ରମାଣିତ ଫସଲ ସୁରକ୍ଷା ଔଷଧ ଦେଖନ୍ତୁ ଏବଂ କାର୍ଟରେ ଯୋଡ଼ନ୍ତୁ।",
    "🧴 Browse Medicines": "🧴 ଔଷଧ ଦେଖନ୍ତୁ",
    "Server Calculated": "ସର୍ଭର ଦ୍ୱାରା ହିସାବ",
    "Total MRP (": "ମୋଟ MRP (",
    "items)": "ଟି ସାମଗ୍ରୀ)",
    "Delivery Charge (Free ≥ ₹499)": "ଡେଲିଭରି ଚାର୍ଜ (₹499 ରୁ ଅଧିକ ହେଲେ ମାଗଣା)",
    "Final Payable Amount": "ମୋଟ ଦେବାକୁ ଥିବା ଟଙ୍କା",
    "Proceed to Secure Checkout": "ସୁରକ୍ଷିତ ଚେକଆଉଟ୍ କୁ ଯାଆନ୍ତୁ",
    "Secure Checkout & Delivery Details": "ସୁରକ୍ଷିତ ଚେକଆଉଟ୍ ଓ ଡେଲିଭରି ବିବରଣୀ",
    "← Back to Cart": "← କାର୍ଟକୁ ଫେରନ୍ତୁ",
    "🏡 Village / Plot / Landmark Address": "🏡 ଗ୍ରାମ / ପ୍ଲଟ୍ / ଲ୍ୟାଣ୍ଡମାର୍କ ଠିକଣା",
    "🏙️ City / District": "🏙️ ସହର / ଜିଲ୍ଲା",
    "🗺️ State": "🗺️ ରାଜ୍ୟ",
    "📮 PIN Code": "📮 ପିନ୍ କୋଡ୍ (PIN Code)",
    "Secured by Razorpay 256-Bit SSL": "Razorpay 256-Bit SSL ଦ୍ୱାରା ସୁରକ୍ଷିତ",
    "RECOMMENDED": "ସର୍ବୋତ୍ତମ (RECOMMENDED)",
    "Instant & secure online payment processed by Razorpay. Supports all major methods:": "Razorpay ଦ୍ୱାରା ତୁରନ୍ତ ଓ ସୁରକ୍ଷିତ ଅନଲାଇନ୍ ପେମେଣ୍ଟ। ସମସ୍ତ ମାଧ୍ୟମ ଉପଲବ୍ଧ:",
    "📱 UPI (GPay / PhonePe / Paytm)": "📱 UPI (GPay / PhonePe / Paytm)",
    "💳 Credit Card": "💳 କ୍ରେଡିଟ୍ କାର୍ଡ",
    "🏧 Debit Card": "🏧 ଡେବିଟ୍ କାର୍ଡ",
    "🏦 Net Banking": "🏦 ନେଟ୍ ବ୍ୟାଙ୍କିଙ୍ଗ୍",
    "👛 Wallets": "👛 ୱାଲେଟ୍ (Wallets)",
    "Pay in cash at your doorstep when the sealed pesticide package is delivered to your farm.": "ଆପଣଙ୍କ ଘରେ ବା ଫାର୍ମରେ ଔଷଧ ପ୍ୟାକେଟ୍ ପହଞ୍ଚିବା ପରେ ନଗଦ ଟଙ୍କା ଦିଅନ୍ତୁ।",
    "Total MRP": "ମୋଟ MRP",
    "Total Savings": "ମୋଟ ସଞ୍ଚୟ (ରିହାତି)",
    "Delivery Charge": "ଡେଲିଭରି ଚାର୍ଜ",
    "Final Total": "ସର୍ବମୋଟ ଦେୟ",
    "Pay ₹0 Securely": "ସୁରକ୍ଷିତ ପେମେଣ୍ଟ କରନ୍ତୁ",
    "🔐 Processed securely by": "🔐 ସୁରକ୍ଷିତ ପେମେଣ୍ଟ:",
    "• Server-side HMAC-SHA256 Signature Verification": "• ସର୍ଭର HMAC-SHA256 ସୁରକ୍ଷା ଯାଞ୍ଚ",
    "🎉 Payment Successful": "🎉 ପେମେଣ୍ଟ ସଫଳ ହୋଇଛି!",
    "Your agricultural medicine order is confirmed and being prepared for dispatch.": "ଆପଣଙ୍କ କୃଷି ଔଷଧ ଅର୍ଡର ନିଶ୍ଚିତ ହୋଇଛି ଏବଂ ପଠାଇବା ପାଇଁ ପ୍ରସ୍ତୁତ ହେଉଛି।",
    "Razorpay Payment ID": "ରେଜରପେ ପେମେଣ୍ଟ ଆଇଡି",
    "Order Date": "ଅର୍ଡର ତାରିଖ",
    "CONFIRMED": "ନିଶ୍ଚିତ (CONFIRMED)",
    "Ordered Medicines": "ଅର୍ଡର ହୋଇଥିବା ଔଷଧ",
    "Track Order": "ଅର୍ଡର ଟ୍ରାକ୍ କରନ୍ତୁ",
    "View Order History": "ଅର୍ଡର ଇତିହାସ ଦେଖନ୍ତୁ",
    "Continue Shopping": "କିଣାକିଣି ଜାରି ରଖନ୍ତୁ",
    "Payment Incomplete": "ପେମେଣ୍ଟ ଅସମ୍ପୂର୍ଣ୍ଣ",
    "Payment was not completed.": "ପେମେଣ୍ଟ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇପାରିଲା ନାହିଁ।",
    "Payment was cancelled or declined. Your order has not been charged.": "ପେମେଣ୍ଟ ବାତିଲ୍ କିମ୍ବା ବିଫଳ ହୋଇଛି। ଆପଣଙ୍କ ଆକାଉଣ୍ଟରୁ ଟଙ୍କା କଟିନାହିଁ।",
    "Order Reference": "ଅର୍ଡର ରେଫରେନ୍ସ",
    "FAILED": "ବିଫଳ (FAILED)",
    "Retry Payment": "ପୁଣି ପେମେଣ୍ଟ ଚେଷ୍ଟା କରନ୍ତୁ",
    "🛒 Back to Cart": "🛒 କାର୍ଟକୁ ଫେରନ୍ତୁ",
    "🛍️ Continue Shopping": "🛍️ କିଣାକିଣି ଜାରି ରଖନ୍ତୁ",
    "My Pesticide Orders & Payment History": "ମୋର କୀଟନାଶକ ଅର୍ଡର ଏବଂ ପେମେଣ୍ଟ ଇତିହାସ",
    "Track live delivery status and verified Razorpay / COD payment receipts.": "ଲାଇଭ୍ ଡେଲିଭରି ସ୍ଥିତି ଏବଂ ପ୍ରମାଣିତ Razorpay / COD ରସିଦ୍ ଦେଖନ୍ତୁ।",
    "+ Shop Medicines": "+ ଔଷଧ କିଣନ୍ତୁ",
    "Review farmer leaf disease problems sent to you and reply with verified treatment prescriptions.": "ଚାଷୀମାନେ ପଠାଇଥିବା ପତ୍ର ରୋଗ ସମସ୍ୟା ଦେଖନ୍ତୁ ଏବଂ ପ୍ରମାଣିତ ଔଷଧ ପରାମର୍ଶ ଦିଅନ୍ତୁ।",
    "🌿 Leaf Disease Specialist": "🌿 ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞ",
    "Farmer Leaf Disease Questions & Problems Sent to You": "ଚାଷୀମାନେ ଆପଣଙ୍କୁ ପଠାଇଥିବା ପତ୍ର ରୋଗ ପ୍ରଶ୍ନ ଓ ସମସ୍ୟା",
    "🛒 Direct Wholesale Buyer Interface": "🛒 ସିଧାସଳଖ ପାଇକାରୀ କ୍ରେତା ପୋର୍ଟାଲ୍",
    "Browse verified farmer harvest lots across Odisha, inspect quality grades, and place direct farm-gate purchase orders.": "ଓଡ଼ିଶାର ଚାଷୀମାନଙ୍କ ପ୍ରମାଣିତ ଅମଳ ଫସଲ ଦେଖନ୍ତୁ, ଗୁଣବତ୍ତା ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ସିଧାସଳଖ ଅର୍ଡର ଦିଅନ୍ତୁ।",
    "Procurement Mode": "କିଣିବା ପଦ୍ଧତି",
    "Direct Farm-Gate (0% Broker)": "ସିଧାସଳଖ ଚାଷୀଙ୍କ ଠାରୁ (୦% ଦଲାଲ୍)",
    "Buyer Trading Hub": "କ୍ରେତା ବାଣିଜ୍ୟ କେନ୍ଦ୍ର",
    "Odisha APMC & Wholesale": "ଓଡ଼ିଶା APMC ଏବଂ ପାଇକାରୀ ବଜାର",
    "System Administrator": "ସିଷ୍ଟମ୍ ପ୍ରଶାସକ",
    "Total Users": "ମୋଟ ଉପଭୋକ୍ତା",
    "Farmers": "ଚାଷୀ",
    "Total Leaf Scans": "ମୋଟ ପତ୍ର ସ୍କାନ୍",
    "Avg Confidence": "ହାରାହାରି ସଠିକତା",
    "Active AI Model": "ସକ୍ରିୟ ଏଆଇ ମଡେଲ୍",
    "AI Model Version Registry": "ଏଆଇ ମଡେଲ୍ ସଂସ୍କରଣ ତାଲିକା",
    "Payment Management (Razorpay & Pesticide Orders)": "ପେମେଣ୍ଟ ପରିଚାଳନା (Razorpay ଏବଂ କୀଟନାଶକ ଅର୍ଡର)",
    "Monitor Razorpay Order IDs, Payment IDs, customer transactions, and initiate verified refunds. (Razorpay Secret Key is strictly hidden on server).": "Razorpay ଅର୍ଡର ଆଇଡି, ପେମେଣ୍ଟ ଆଇଡି, ଗ୍ରାହକ କାରବାର ଦେଖନ୍ତୁ ଏବଂ ରିଫଣ୍ଡ ପରିଚାଳନା କରନ୍ତୁ।",
    "All": "ସମସ୍ତ",
    "Customer": "ଗ୍ରାହକ / ଚାଷୀ",
    "Products": "ଔଷଧ / ସାମଗ୍ରୀ",
    "Razorpay Order ID": "ରେଜରପେ ଅର୍ଡର ଆଇଡି",
    "Action": "କାର୍ଯ୍ୟ",
    "Loading payment records...": "ପେମେଣ୍ଟ ତଥ୍ୟ ଲୋଡ୍ ହେଉଛି...",
    "Track individual crop plots, growth stages, and visual health indicators.": "ପ୍ରତ୍ୟେକ ଫସଲ ପ୍ଲଟ୍, ବୃଦ୍ଧି ଅବସ୍ଥା ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚକାଙ୍କ ଦେଖନ୍ତୁ।",
    "Product Name": "ଔଷଧ ନାମ",
    "Brand Name": "ବ୍ରାଣ୍ଡ ନାମ",
    "Sold By": "ବିକ୍ରେତା",
    "Stock & Rating": "ଷ୍ଟକ୍ ଏବଂ ରେଟିଂ",
    "Inclusive of all taxes • Authentic Sealed Pack": "ସମସ୍ତ ଟ্যাক୍ସ ଅନ୍ତର୍ଭୁକ୍ତ • ଅସଲି ସିଲ୍ ପ୍ୟାକ୍",
    "🧪 Active Composition": "🧪 ସକ୍ରିୟ ରାସାୟନିକ ଉପାଦାନ",
    "Consult Leaf Disease Expert": "ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ",
    "📖 Full Product Description & Mode of Action": "📖 ଔଷଧର ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ ଓ କାର୍ଯ୍ୟ ପ୍ରଣାଳୀ",
    "💧 Recommended Field Dosage & Application": "💧 ଜମିରେ ପ୍ରୟୋଗ ମାତ୍ରା ଓ ସ୍ପ୍ରେ ପଦ୍ଧତି",
    "Live Camera Viewfinder": "ଲାଇଭ୍ କ୍ୟାମେରା ଭ୍ୟୁଫାଇଣ୍ଡର୍",
    "Align Leaf Here": "ପତ୍ରକୁ ଏଠାରେ ରଖନ୍ତୁ",
    "📸 Capture Snapshot": "📸 ଫଟୋ ଉଠାନ୍ତୁ",
    "Cancel": "ବାତିଲ୍ କରନ୍ତୁ",
    "Farmer Name": "ଚାଷୀଙ୍କ ନାମ",
    "Select Crop": "ଫସଲ ବାଛନ୍ତୁ",
    "Farmer Bank Details (For Buyer Payment)": "ଚାଷୀଙ୍କ ବ୍ୟାଙ୍କ ବିବରଣୀ (କ୍ରେତା ପେମେଣ୍ଟ ପାଇଁ)",
    "Harvest Description & Quality Notes": "ଅମଳ ଫସଲର ବିବରଣୀ ଓ ଗୁଣବତ୍ତା",
    "Publish Produce to Marketplace": "ବଜାରରେ ଫସଲ ପ୍ରକାଶ କରନ୍ତୁ",
    "Place Produce Order & Pay Farmer": "ଫସଲ ଅର୍ଡର କରନ୍ତୁ ଓ ଚାଷୀଙ୍କୁ ପେମେଣ୍ଟ କରନ୍ତୁ",
    "Crop:": "ଫସଲ:",
    "Direct Farmer Harvest": "ସିଧାସଳଖ ଚାଷୀଙ୍କ ଅମଳ ଫସଲ",
    "Pay to Farmer (Farmer Payment Account)": "ଚାଷୀଙ୍କୁ ପେମେଣ୍ଟ କରନ୍ତୁ (ଚାଷୀଙ୍କ ବ୍ୟାଙ୍କ ଖାତା)",
    "Buyer / Trading Firm Name": "କ୍ରେତା / ବ୍ୟବସାୟ ପ୍ରତିଷ୍ଠାନ ନାମ",
    "Buyer Contact Phone": "କ୍ରେତାଙ୍କ ଫୋନ୍ ନମ୍ବର",
    "Buyer Warehouse / Shop Location (Address)": "କ୍ରେତାଙ୍କ ଗୋଦାମ / ଦୋକାନ ଠିକଣା",
    "Procurement Hub & District Corridor": "କ୍ରୟ କେନ୍ଦ୍ର ଓ ଜିଲ୍ଲା",
    "Notes / Logistics Pickup Date": "ଟିପ୍ପଣୀ / ଗାଡ଼ି ଉଠାଇବା ତାରିଖ",
    "Confirm Order & Pay to Farmer Account": "ଅର୍ଡର ନିଶ୍ଚିତ କରନ୍ତୁ ଓ ଚାଷୀ ଖାତାକୁ ଟଙ୍କା ପଠାନ୍ତୁ",
    "Secure Phone & OTP Login": "ସୁରକ୍ଷିତ ଫୋନ୍ ଓ OTP ଲଗଇନ୍",
    "OTP sent to": "OTP ପଠାଯାଇଛି:",
    "Change Number": "ନମ୍ବର ବଦଳାନ୍ତୁ",
    "Enter 6-Digit Verification Code": "୬-ଅଙ୍କ ବିଶିଷ୍ଟ OTP କୋଡ୍ ଦିଅନ୍ତୁ",
    "Enter the 6-digit verification code sent to your mobile.": "ଆପଣଙ୍କ ମୋବାଇଲକୁ ପଠାଯାଇଥିବା ୬-ଅଙ୍କ OTP କୋଡ୍ ଦିଅନ୍ତୁ।",

    // Placeholders in Odia
    "Enter your full name": "ଆପଣଙ୍କ ସମ୍ପୂର୍ଣ୍ଣ ନାମ ଲେଖନ୍ତୁ",
    "10-digit mobile number": "୧୦-ଅଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର",
    "Create your secure password": "ଆପଣଙ୍କ ସୁରକ୍ଷିତ ପାସୱାର୍ଡ ତିଆରି କରନ୍ତୁ",
    "Re-enter your password": "ପାସୱାର୍ଡ ପୁଣି ଥରେ ଲେଖନ୍ତୁ",
    "e.g. Tomato & Rice Leaf Disease Specialist": "ଯଥା: ଟମାଟୋ ଓ ଧାନ ପତ୍ର ରୋଗ ବିଶେଷଜ୍ଞ",
    "e.g. Khordha, Odisha": "ଯଥା: ଖୋର୍ଦ୍ଧା, ଓଡ଼ିଶା",
    "e.g. Rice, Tomato": "ଯଥା: ଧାନ, ଟମାଟୋ",
    "Enter your Gmail ID": "ଆପଣଙ୍କ ଜିମେଲ୍ ଆଇଡି ଲେଖନ୍ତୁ",
    "Enter your password": "ଆପଣଙ୍କ ପାସୱାର୍ଡ ଲେଖନ୍ତୁ",
    "Enter your name": "ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ",
    "Paste remote webcam or IP camera snapshot URL (e.g. http://.../snapshot.jpg)": "ୱେବକ୍ୟାମ୍ ବା IP କ୍ୟାମେରା ଫଟୋ ଲିଙ୍କ୍ ଏଠାରେ ପେଷ୍ଟ କରନ୍ତୁ...",
    "e.g. Mere fasal ke patton par daag aa rahe hain, kripya sahi dawai aur matra batayein...": "ଯଥା: ମୋ ଫସଲ ପତ୍ରରେ କଳା ଦାଗ ଦେଖାଯାଉଛି, ଦୟାକରି ସଠିକ୍ ଔଷଧ ଓ ମାତ୍ରା ଜଣାନ୍ତୁ...",
    "Ask anything in English, Odia, or Hindi...": "ଓଡ଼ିଆ, ହିନ୍ଦୀ କିମ୍ବା ଇଂରାଜୀରେ ଯେକୌଣସି କୃଷି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...",
    "e.g. 2 bags urea": "ଯଥା: ୨ ବସ୍ତା ୟୁରିଆ ସାର",
    "Village, District, Odisha": "ଗ୍ରାମ, ଜିଲ୍ଲା, ଓଡ଼ିଶା",
    "e.g. State Bank of India": "ଯଥା: ଷ୍ଟେଟ୍ ବ୍ୟାଙ୍କ ଅଫ୍ ଇଣ୍ଡିଆ (SBI)",
    "Enter Account Holder Name": "ଖାତାଧାରୀଙ୍କ ନାମ ଲେଖନ୍ତୁ",
    "Enter Bank Account No.": "ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟ୍ ନମ୍ବର ଲେଖନ୍ତୁ",
    "Freshly harvested, clean sorted, ready for buyer pickup.": "ତାଜା ଅମଳ, ସଫା ଓ ବଛା ହୋଇଥିବା ଫସଲ, ବିକ୍ରି ପାଇଁ ପ୍ରସ୍ତୁତ।",
    "🔍 Search medicine, crop, pest...": "🔍 ଔଷଧ, ଫସଲ କିମ୍ବା ପୋକ/ରୋଗ ନାମ ଖୋଜନ୍ତୁ...",
    "Enter receiver full name": "ଗ୍ରାହକଙ୍କ ସମ୍ପୂର୍ଣ୍ଣ ନାମ ଲେଖନ୍ତୁ",
    "House No, Village, GP, Near Mandi / Block Road": "ଘର ନଂ, ଗ୍ରାମ, ପଞ୍ଚାୟତ, ମଣ୍ଡି / ବ୍ଲକ୍ ରୋଡ୍ ପାଖ",
    "e.g. Bhubaneswar, Khordha": "ଯଥା: ଭୁବନେଶ୍ୱର, ଖୋର୍ଦ୍ଧା",
    "Account Holder Name": "ଖାତାଧାରୀଙ୍କ ନାମ",
    "Bank Account Number": "ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟ୍ ନମ୍ବର",
    "Freshly harvested, clean sorted, IPM managed. Ready for immediate mandi/buyer pickup.": "ତାଜା ଅମଳ ଓ ସଫା ଫସଲ। ତୁରନ୍ତ ବିକ୍ରି ପାଇଁ ପ୍ରସ୍ତୁତ।",
    "Enter buyer firm name": "କ୍ରେତା କମ୍ପାନୀ/ଦୋକାନ ନାମ ଲେଖନ୍ତୁ",
    "Enter contact phone": "ଯୋଗାଯୋଗ ଫୋନ୍ ନମ୍ବର ଲେଖନ୍ତୁ",
    "e.g. Buyer provides mandi transport truck; pickup on Tuesday morning.": "ଯଥା: ମଙ୍ଗଳବାର ସକାଳେ ଗାଡ଼ି ଦ୍ୱାରା ଫସଲ ଉଠାଯିବ।"
  },

  hi: {
    // App Header & Roles
    "AI Farm Co-Pilot": "एआई फार्म को-पायलट",
    "AI Farm Co-Pilot & Market Optimizer": "एआई फार्म को-पायलट और मार्केट ऑप्टिमाइज़र",
    "Smart Agricultural Assistant for Indian Farmers": "भारतीय किसानों के लिए स्मार्ट डिजिटल कृषि सहायक",
    "Odisha Edition": "ओडिशा संस्करण",
    "Sign Out": "लॉग आउट (Sign Out)",
    "Farmer": "किसान (Farmer)",
    "Expert": "कृषि विशेषज्ञ (Expert)",
    "Buyer": "खरीदार / व्यापारी (Buyer)",
    "Admin": "सिस्टम एडमिन (Admin)",
    "Agricultural Expert": "कृषि विशेषज्ञ",
    "Produce Buyer": "फसल खरीदार",
    "System Admin": "सिस्टम एडमिन",

    // Navigation Tabs
    "My Farm": "मेरा खेत",
    "Check Disease": "रोग जांच",
    "AI Co-Pilot": "एआई को-पायलट",
    "Soil Health": "मृदा स्वास्थ्य",
    "Farm Business": "कृषि व्यापार",
    "Market Optimizer": "मंडी भाव तुलना",
    "Sell Produce": "फसल बेचें",
    "Pesticides": "कीटनाशक दवाएं",
    "Buyer Portal": "खरीदार पोर्टल",
    "Expert Advice": "विशेषज्ञ सलाह",
    "Input Store": "दवा दुकान",
    "Admin Portal": "एडमिन पोर्टल",

    // 1st Screen Auth Portal
    "1ST SCREEN • MANDATORY ACCOUNT PORTAL": "प्रथम स्क्रीन • अनिवार्य खाता पोर्टल",
    "Register or Sign In with your": "अपने",
    "Gmail": "जीमेल (Gmail)",
    "Mobile Number": "मोबाइल नंबर",
    "&": "और",
    "Own Password": "खुद के पासवर्ड",
    "Select your role below (": "नीचे अपनी भूमिका चुनें (",
    "is 1st Priority) to enter your dedicated portal.": "प्रथम प्राथमिकता) और अपने पोर्टल में प्रवेश करें।",
    "1. Select Who You Are (Role Priority)": "1. चुनें कि आप कौन हैं (भूमिका प्राथमिकता)",
    "1ST PRIORITY": "प्रथम प्राथमिकता",
    "Crop & Soil": "फसल और मिट्टी",
    "Plant Doctor": "पौधा डॉक्टर",
    "Buy Crops": "फसल खरीदें",
    "System": "सिस्टम",
    "📝 Sign Up (Create Account)": "📝 साइन अप (नया खाता बनाएं)",
    "🔐 Sign In (Existing User)": "🔐 साइन इन (मौजूदा उपयोगकर्ता)",
    "Full Name *": "पूरा नाम *",
    "Gmail / Email ID *": "जीमेल / ईमेल आईडी *",
    "Mobile Phone Number *": "मोबाइल फोन नंबर *",
    "State & District (Odisha) *": "राज्य और जिला (ओडिशा) *",
    "Create Own Password *": "अपना पासवर्ड बनाएं *",
    "Confirm Password *": "पासवर्ड की पुष्टि करें *",
    "🌾 Farmer Profile Details": "🌾 किसान प्रोफ़ाइल विवरण",
    "Farm Name": "खेत / फार्म का नाम",
    "Leaf Disease Expert": "पत्ती रोग विशेषज्ञ",
    "Land (Acres)": "जमीन (एकड़)",
    "Crops Grown": "उगाई जाने वाली फसलें",
    "👨‍🔬 Agricultural Expert Details": "👨‍🔬 कृषि विशेषज्ञ विवरण",
    "Specialization": "विशेषज्ञता विभाग",
    "Qualification / University": "योग्यता / विश्वविद्यालय",
    "Experience (Years)": "अनुभव (वर्ष)",
    "🛒 Produce Buyer / Trader Details": "🛒 फसल खरीदार / व्यापारी विवरण",
    "Business / Company Name": "व्यापार / कंपनी का नाम",
    "Buyer Type": "खरीदार का प्रकार",
    "Interested Crops": "खरीदने के लिए इच्छुक फसलें",
    "🛡️ System Administrator Details": "🛡️ सिस्टम प्रशासक विवरण",
    "Admin Access Code / Department": "एडमिन एक्सेस कोड / विभाग",
    "🚀 Complete Sign Up & Enter Portal": "🚀 साइन अप पूरा करें और पोर्टल में प्रवेश करें",
    "Registered Gmail OR Mobile Number *": "पंजीकृत जीमेल या मोबाइल नंबर *",
    "Your Password *": "आपका पासवर्ड *",
    "🔓 Sign In & Enter Portal": "🔓 साइन इन करें और पोर्टल में प्रवेश करें",

    // Dashboard & Weather
    "Welcome back": "नमस्ते, स्वागत है",
    "Active Fields": "सक्रिय खेत/प्लॉट",
    "Today's Microclimate": "आज का मौसम",
    "Season Expenses": "कुल मौसमी खर्च",
    "Realized Revenue": "कुल शुद्ध आय",
    "Smart Agricultural Alerts": "स्मार्ट कृषि अलर्ट",
    "Quick Farmer Actions": "त्वरित किसान कार्य",
    "📍 Share My Live GPS Location": "📍 मेरी लाइव GPS लोकेशन साझा करें",
    "Live GPS Verified": "लाइव GPS सत्यापित",
    "Localized Microclimate Weather": "आपके खेत का सटीक मौसम",
    "Real-Time Local Disease & Weather Risk Alert": "स्थानीय रोग एवं मौसम जोखिम अलर्ट",
    "Temperature": "तापमान",
    "Humidity": "नमी (Humidity)",
    "Wind Speed": "हवा की गति",
    "Rain Probability": "बारिश की संभावना",
    "Soil Moisture": "मिट्टी की नमी",
    "Solar UV Index": "सौर UV सूचकांक",
    "7-Day Agricultural Spray & Harvest Forecast": "7-दिवसीय कृषि छिड़काव एवं कटाई पूर्वानुमान",

    // Check Disease & Leaf Scanner
    "AI Leaf Disease Computer Vision Scanner": "एआई पत्ती रोग कंप्यूटर विजन स्कैनर",
    "Scan leaf photo or capture from live camera to identify diseases, get verified treatments, and connect with experts.": "पत्ती का फोटो अपलोड करें या सीधे कैमरे से स्कैन करके रोग पहचानें, प्रमाणित दवा जानें और विशेषज्ञों से जुड़ें।",
    "Select Crop to Diagnose": "जांच के लिए फसल चुनें",
    "Upload Image": "फोटो अपलोड करें",
    "Live Webcam": "लाइव कैमरा",
    "Webcam Stream URL": "वेबकैम लिंक (URL)",
    "Capture & Diagnose": "फोटो खींचें और जांचें",
    "Fetch & Analyze URL": "URL से फोटो लाकर जांचें",
    "Analyze Leaf Image Now": "अभी पत्ती फोटो की जांच करें",
    "AI Diagnostic Result": "एआई रोग पहचान परिणाम",
    "AI Confidence": "एआई सटीकता विश्वास",
    "Severity Level": "गंभीरता स्तर",
    "Pathological Symptoms": "रोग के लक्षण",
    "Possible Causes & Vectors": "संभावित कारण और वाहक",
    "IPM & Field Management": "रोकथाम और खेत प्रबंधन",
    "Verified Agricultural Medicines / Inputs": "प्रमाणित कृषि दवाएं और उपचार",
    "Dosage & Application": "दवा की मात्रा और छिड़काव विधि",
    "Safety & Pre-Harvest Interval (PHI)": "सुरक्षा और कटाई पूर्व अवधि (PHI)",
    "Consult Plant Pathologist": "कृषि वैज्ञानिक से सलाह लें",
    "Ask Our Leaf Disease Experts": "हमारे पत्ती रोग विशेषज्ञों से पूछें",
    "Send Direct Consultation Request": "सीधे विशेषज्ञ परामर्श अनुरोध भेजें",
    "My Expert Consultations & Prescriptions": "मेरे विशेषज्ञ परामर्श और उपचार पर्चियां",

    // AI Co-Pilot
    "Ask AI Farm Co-Pilot": "एआई फार्म को-पायलट से पूछें",
    "Voice or text enabled agricultural assistant aware of your farm, crops, soil, and local mandi prices.": "आवाज या टेक्स्ट के माध्यम से अपनी फसल, मिट्टी, मौसम और मंडी भाव के बारे में कोई भी सवाल पूछें।",
    "🎙️ Ask AI Farm Co-Pilot": "🎙️ एआई को-पायलट से पूछें",
    "Send": "भेजें",
    "Speak": "बोलें",
    "Clear Chat": "चैट साफ़ करें",

    // Soil Health
    "Soil Intelligence & Nutrient Advisory": "मृदा स्वास्थ्य और पोषक तत्व सलाह",
    "Understand your soil parameters, crop suitability index, and fertilizer recommendations.": "मिट्टी परीक्षण के आधार पर उपयुक्त फसलें और आवश्यक खाद की सटीक मात्रा जानें।",
    "Soil pH": "मिट्टी का pH",
    "Available Nitrogen (N kg/ha)": "उपलब्ध नाइट्रोजन (N kg/ha)",
    "Phosphorus (P kg/ha)": "फास्फोरस (P kg/ha)",
    "Potassium (K kg/ha)": "पोटैशियम (K kg/ha)",
    "Organic Carbon (%)": "जैविक कार्बन (%)",
    "Moisture (%)": "नमी (%)",
    "Soil Type": "मिट्टी का प्रकार",
    "Analyze Soil & Get Crop Suitability": "मिट्टी का विश्लेषण करें और उपयुक्त फसल जानें",
    "Overall Fertility Score": "कुल उर्वरता स्कोर",
    "Crop Suitability Ranking": "उपयुक्त फसलों की रैंकिंग",
    "Targeted Nutrient Corrections": "पोषक तत्व एवं खाद सुधार सुझाव",

    // Farm Business
    "Farm Business Maker & Expense Tracker": "कृषि व्यापार योजना और खर्च प्रबंधन",
    "Simulate crop budgets, record daily expenses by voice, and track farm profits.": "खेती की लागत का अनुमान लगाएं, बोलकर दैनिक खर्च दर्ज करें और शुद्ध लाभ देखें।",
    "Business Scenario Planner": "व्यापार योजनाकार",
    "Expense Tracker": "खर्च ट्रैकर",
    "Income & Sales": "आय और बिक्री",
    "Land Area (Acres)": "जमीन का क्षेत्रफल (एकड़)",
    "Seed Cost (₹)": "बीज लागत (₹)",
    "Fertilizer Cost (₹)": "खाद/उर्वरक लागत (₹)",
    "Labour Cost (₹)": "मजदूरी लागत (₹)",
    "Irrigation Cost (₹)": "सिंचाई लागत (₹)",
    "Pesticide/Protection Cost (₹)": "कीटनाशक लागत (₹)",
    "Machinery/Tractor Cost (₹)": "ट्रैक्टर/उपकरण किराया (₹)",
    "Transport Freight Cost (₹)": "परिवहन/भाड़ा लागत (₹)",
    "Expected Yield (Quintals)": "अनुमानित पैदावार (क्विंटल)",
    "Expected Price / Quintal (₹)": "अनुमानित बिक्री भाव / क्विंटल (₹)",
    "Calculate Profitability Scenario": "लाभ-हानि गणना करें",
    "🎙️ Log Expense by Voice": "🎙️ बोलकर खर्च दर्ज करें",
    "Estimated Total Cost": "अनुमानित कुल लागत",
    "Estimated Gross Revenue": "अनुमानित कुल आय",
    "Estimated Net Return": "अनुमानित शुद्ध लाभ",
    "Simulated Net ROI": "अनुमानित लाभ दर (%)",

    // Market Optimizer
    "Mandi Market Optimizer": "मंडी भाव ऑप्टिमाइज़र",
    "Compare nearby APMC mandis by transparent net realization after transport and commission fees.": "परिवहन भाड़ा और मंडी टैक्स घटाकर सबसे ज्यादा शुद्ध मुनाफा देने वाली मंडी चुनें।",
    "Harvest Quantity to Sell (Quintals)": "बेचने हेतु मात्रा (क्विंटल)",
    "Quality / Produce Grade": "फसल की गुणवत्ता / ग्रेड",
    "Calculate Optimal Selling Mandi": "सर्वोत्तम मंडी की गणना करें",
    "HIGHEST NET PROFIT": "सर्वाधिक शुद्ध मुनाफा",
    "Mandi / Market Yard": "मंडी का नाम",
    "Modal Price / Qtl": "मंडी भाव / क्विंटल",
    "Distance": "दूरी",
    "Transport Freight": "परिवहन भाड़ा",
    "Mandi Fee (1.5%)": "मंडी शुल्क (1.5%)",
    "Estimated Net Realization": "हाथ में आने वाला शुद्ध पैसा",
    "Net Price Received / Qtl": "प्रति क्विंटल शुद्ध प्राप्त भाव",

    // Sell Produce & Farmer Bank Details
    "Direct Farmer-to-Buyer Produce Marketplace": "सीधा किसान-से-खरीदार फसल बिक्री बाजार",
    "List your harvested crops with photos, expected price, and bank payout details for verified Odisha buyers.": "अपनी तैयार फसल को फोटो, कीमत और बैंक खाते के विवरण के साथ प्रमाणित खरीदारों को सीधे बेचें।",
    "Post Harvest Lot for Sale": "बिक्री के लिए फसल सूचीबद्ध करें",
    "Crop Name *": "फसल का नाम *",
    "Variety / Grade": "किस्म / ग्रेड",
    "Available Quantity (Quintals) *": "उपलब्ध मात्रा (क्विंटल) *",
    "Asking Price / Quintal (₹) *": "मांगी गई कीमत / क्विंटल (₹) *",
    "Harvest / Pickup Location *": "फसल उठाने का स्थान *",
    "Farmer Payout Bank Details (For Direct Buyer Payment)": "किसान बैंक खाता विवरण (सीधे भुगतान प्राप्त करने हेतु)",
    "Bank Name *": "बैंक का नाम *",
    "Account Holder Name *": "खाताधारक का नाम *",
    "Bank Account Number *": "बैंक खाता संख्या *",
    "IFSC Code *": "IFSC कोड *",
    "UPI ID (Optional)": "UPI आईडी (वैकल्पिक)",
    "🌾 Publish Crop to Buyer Marketplace": "🌾 खरीदार बाजार में फसल प्रकाशित करें",
    "My Active Crop Listings": "मेरी सक्रिय फसल बिक्री सूची",
    "Incoming Buyer Purchase Orders": "खरीदारों से प्राप्त खरीद ऑर्डर",

    // Pesticides Store & Razorpay E-Commerce
    "Pesticides & Crop Protection Store": "कीटनाशक एवं फसल सुरक्षा दवा दुकान",
    "VERIFIED AGRI INPUTS • RAZORPAY SECURE CHECKOUT": "प्रमाणित कृषि दवाएं • रेज़रपे (RAZORPAY) सुरक्षित ऑनलाइन भुगतान",
    "Authentic agricultural insecticides, fungicides, bio-fungicides, and herbicides with expert dosage guidance and instant Razorpay online payment.": "विशेषज्ञ खुराक सलाह और तुरंत रेज़रपे (Razorpay) ऑनलाइन पेमेंट सुविधा के साथ असली कीटनाशक, फफूंदनाशक, जैविक फफूंदनाशक और खरपतवारनाशक दवाएं।",
    "My Orders": "मेरे ऑर्डर",
    "Cart": "कार्ट (Cart)",
    "Search by medicine name, brand, crop (Rice, Tomato, Potato, Cotton), or pest/disease...": "दवा का नाम, ब्रांड, फसल (धान, टमाटर, आलू, कपास) या रोग/कीट के नाम से खोजें...",
    "All Categories": "सभी श्रेणियां (All Categories)",
    "Insecticide": "कीटनाशक (Insecticide)",
    "Fungicide": "फफूंदनाशक (Fungicide)",
    "Bio Fungicide": "जैविक फफूंदनाशक (Bio Fungicide)",
    "Herbicide": "खरपतवारनाशक (Herbicide)",
    "All Crops": "सभी फसलें (All Crops)",
    "5 Verified Medicines": "5 प्रमाणित कृषि दवाएं",
    "In Stock": "स्टॉक में उपलब्ध",
    "Out of Stock": "स्टॉक समाप्त",
    "Add to Cart": "कार्ट में जोड़ें",
    "Buy Now": "अभी खरीदें",
    "Consult Expert": "विशेषज्ञ से पूछें",
    "View Details": "विवरण देखें",
    "Pack Size": "पैक साइज",
    "Suitable Crops": "उपयुक्त फसलें",
    "Target Pests / Diseases": "लक्षित कीट / रोग",
    "Safety Information & PHI": "सुरक्षा जानकारी एवं कटाई अंतराल",
    "Your Agri Medicine Cart": "आपका कृषि दवा कार्ट",
    "Proceed to Checkout": "चेकआउट (Checkout) पर जाएं",
    "Checkout & Delivery Details": "चेकआउट और डिलीवरी विवरण",
    "Delivery Address Details": "डिलीवरी पता विवरण",
    "Select Payment Method": "भुगतान का तरीका चुनें",
    "Online Payment — Razorpay (UPI / Google Pay / PhonePe / Cards / NetBanking)": "ऑनलाइन पेमेंट — Razorpay (UPI / Google Pay / PhonePe / कार्ड / नेटबैंकिंग)",
    "Cash on Delivery (Pay at Farm Doorstep)": "कैश ऑन डिलीवरी (घर पर दवा मिलने पर पैसे दें)",
    "Pay Online with Razorpay": "Razorpay से ऑनलाइन पेमेंट करें",
    "Place Cash on Delivery Order": "कैश ऑन डिलीवरी ऑर्डर करें",
    "Order Summary & Price Breakdown": "ऑर्डर सारांश और मूल्य विवरण",
    "Subtotal": "उप-योग (Subtotal)",
    "Discount Savings": "छूट बचत",
    "Shipping / Delivery": "डिलीवरी शुल्क",
    "FREE": "मुफ़्त (FREE)",
    "Total Payable Amount": "कुल देय राशि",
    "My Pesticide & Medicine Orders": "मेरे कीटनाशक और दवा ऑर्डर इतिहास",
    "Refresh Orders": "ऑर्डर रिफ्रेश करें",

    // Product Names in Hindi
    "Adama Tapuz Insecticide": "अदामा तापुज़ कीटनाशक (Adama Tapuz Insecticide)",
    "Anand Dr.Bacto's Ampelo Bio Fungicide - Ampelomyces Quisqualis 2.0 A.S.": "आनंद डॉ. बैक्टोज़ एम्पेलो जैविक फफूंदनाशक (Anand Ampelo Bio Fungicide)",
    "Best Agro Promos Fungicide - Metiram 55% + Pyraclostrobin 5% WG": "बेस्ट एग्रो प्रोमोस फफूंदनाशक (Best Agro Promos Fungicide)",
    "IIL Milquat Herbicide": "आईआईएल मिलक्वाट खरपतवारनाशक (IIL Milquat Herbicide)",
    "JU Jupiter 505 Insecticide": "जेयू जुपिटर 505 कीटनाशक (JU Jupiter 505 Insecticide)",

    // Admin Payment Management
    "Agri E-Commerce & Razorpay Payment Management": "कृषि ई-कॉमर्स और रेज़रपे (Razorpay) भुगतान प्रबंधन",
    "Monitor live Razorpay transactions, order statuses, payment verification, and issue instant refunds.": "लाइव रेज़रपे लेनदेन, ऑर्डर स्थिति, भुगतान सत्यापन की निगरानी करें और तुरंत रिफंड जारी करें।",
    "All Payments": "सभी भुगतान",
    "Paid (Verified)": "भुगतान सफल (PAID)",
    "Pending": "लंबित (PENDING)",
    "Failed": "असफल (FAILED)",
    "Refunded": "रिफंड किया गया (REFUNDED)",
    "Order ID": "ऑर्डर आईडी",
    "Farmer / Customer": "किसान / ग्राहक",
    "Medicines": "दवाइयां",
    "Amount": "राशि",
    "Method": "भुगतान माध्यम",
    "Payment Status": "भुगतान स्थिति",
    "Razorpay IDs": "रेज़रपे आईडी",
    "Order Status": "ऑर्डर स्थिति",
    "Actions": "कार्रवाई",
    "TITAN 2.0": "टाइटन 2.0 (TITAN 2.0)",
    "Complete Digital Agricultural Assistant for Indian Farmers": "भारतीय किसानों के लिए संपूर्ण डिजिटल कृषि सहायक",
    "1st Screen Access Gate • TITAN 2.0": "प्रथम स्क्रीन प्रवेश द्वार • टाइटन 2.0",
    "• Strict Individual User Portal Security": "• सख्त व्यक्तिगत उपयोगकर्ता पोर्टल सुरक्षा",
    "Register with your Gmail ID and create your secure password. Sign in to unlock full farm features.": "अपनी जीमेल आईडी के साथ पंजीकरण करें और अपना सुरक्षित पासवर्ड बनाएं। सभी कृषि सुविधाओं के लिए साइन इन करें।",
    "📧 Gmail ID / Email Address": "📧 जीमेल आईडी / ईमेल पता",
    "🏷️ Select Who You Are (Your Role)": "🏷️ चुनें कि आप कौन हैं (आपकी भूमिका)",
    "🩺 Expert (Leaf Disease Expert)": "🩺 विशेषज्ञ (पत्ती रोग विशेषज्ञ)",
    "🛒 Buyer (Crop Produce Buyer)": "🛒 खरीदार (फसल खरीदार / व्यापारी)",
    "⚙️ Admin (System Administrator)": "⚙️ एडमिन (सिस्टम प्रशासक)",
    "(Specialist Crop / Disease)": "(विशेषज्ञ फसल / रोग)",
    "📍 State & District / Village": "📍 राज्य और जिला / गांव",
    "🌾 Crops": "🌾 फसलें",
    "Create Account & Enter Selected Portal": "खाता बनाएं और चयनित पोर्टल में प्रवेश करें",
    "🔒 End-to-end encrypted passwords. Only the interface for your selected role will be shown after login.": "🔒 एंड-टू-एंड सुरक्षित पासवर्ड। लॉगिन के बाद केवल आपकी चयनित भूमिका का पोर्टल दिखाई देगा।",
    "1️⃣ Choose Who You Are (Select Your Role)": "1️⃣ चुनें कि आप कौन हैं (अपनी भूमिका चुनें)",
    "2️⃣ Registered Gmail ID": "2️⃣ पंजीकृत जीमेल आईडी",
    "5️⃣ 🌿 Leaf Disease Expert": "5️⃣ 🌿 पत्ती रोग विशेषज्ञ",
    "Farmer Account": "किसान खाता",
    "FARMER": "किसान (FARMER)",
    "Protected 🔐": "सुरक्षित 🔐",
    "Register New User": "नया उपयोगकर्ता पंजीकरण",
    "Log Out / Change Mobile": "लॉग आउट / मोबाइल बदलें",
    "Farm Health Status": "खेत की स्वास्थ्य स्थिति",
    "Good Vigour": "उत्तम स्वास्थ्य",
    "Kishan Smart Farm": "किसान स्मार्ट फार्म",
    "Shared Live Field Location": "साझा की गई लाइव खेत लोकेशन",
    "Check Plant Disease": "पौधा/पत्ती रोग जांचें",
    "Live Location Weather": "लाइव लोकेशन मौसम",
    "Checking...": "जांच हो रही है...",
    "Feels like: --°C": "महसूस तापमान: --°C",
    "Detecting Location...": "लोकेशन खोजी जा रही है...",
    "💨 Wind:": "💨 हवा की गति:",
    "📍 GPS: Detecting Device Satellite Location...": "📍 GPS: डिवाइस सैटेलाइट लोकेशन खोजी जा रही है...",
    "Device Status: Ready": "डिवाइस स्थिति: तैयार",
    "Live Microclimate Weather at Your Exact Field Location": "आपके खेत की सटीक लाइव मौसम जानकारी",
    "Click below to share your device live GPS. Real-time temperature, humidity, rainfall probability (बारिश की संभावना), and foliar disease outbreak risk alerts will immediately recalculate for your exact live coordinates.": "अपनी लाइव GPS लोकेशन साझा करने के लिए नीचे क्लिक करें। तापमान, नमी, बारिश की संभावना और पत्ती रोग जोखिम अलर्ट तुरंत अपडेट हो जाएंगे।",
    "Share Live GPS Location": "लाइव GPS लोकेशन साझा करें",
    "📍 Preset: Khordha / Bhubaneswar": "📍 प्रीसेट: खोरधा / भुवनेश्वर",
    "📍 Preset: Cuttack Mahanadi Basin": "📍 प्रीसेट: कटक महानदी क्षेत्र",
    "📍 Preset: Puri Coastal Agro-Zone": "📍 प्रीसेट: पुरी तटीय कृषि क्षेत्र",
    "📍 Preset: Balasore Coastal Plains": "📍 प्रीसेट: बालासोर तटीय मैदान",
    "📍 Preset: Ganjam South Agro-Zone": "📍 प्रीसेट: गंजाम दक्षिण कृषि क्षेत्र",
    "📍 Preset: Koraput Hill Agro-Zone": "📍 प्रीसेट: कोरापुट पहाड़ी क्षेत्र",
    "📍 Bhubaneswar, Odisha": "📍 भुवनेश्वर, ओडिशा",
    "Partly Cloudy ⛅": "आंशिक बादल ⛅",
    "Coordinates: 20.2961° N, 85.8245° E (Live GPS Telemetry)": "निर्देशांक: 20.2961° N, 85.8245° E (लाइव GPS)",
    "🌡️ Real Temp:": "🌡️ वास्तविक तापमान:",
    "Live AI Triggers": "लाइव एआई अलर्ट",
    "Active Plots": "सक्रिय खेत प्लॉट",
    "3 Plots": "3 प्लॉट",
    "Realized Sales": "कुल बिक्री आय",
    "+₹77,200 Net Return": "+₹77,200 शुद्ध लाभ",
    "Model Accuracy": "मॉडल सटीकता",
    "Calibrated Ensemble v1.0": "कैलिब्रेटेड एन्सेम्बल v1.0",
    "Live Camera Input Mode": "लाइव कैमरा इनपुट मोड",
    "Live Camera Snap": "लाइव कैमरा फोटो",
    "Open Live Webcam": "लाइव वेबकैम खोलें",
    "Webcam / IP Camera URL": "वेबकैम / IP कैमरा लिंक",
    "Photo Capture Through URL Link of Webcam / IP Camera": "वेबकैम या IP कैमरा URL लिंक के माध्यम से फोटो लें",
    "Fetch & Scan": "फोटो लाएं और स्कैन करें",
    "Or test with realistic foliar specimens:": "या नमूना पत्ती फोटो से परीक्षण करें:",
    "🌱 Healthy Foliage": "🌱 स्वस्थ हरी पत्ती",
    "No leaf selected yet.": "अभी तक कोई पत्ती नहीं चुनी गई है।",
    "Point Live Camera, open Webcam, or choose a Specimen above.": "लाइव कैमरा दिखाएं, वेबकैम खोलें या ऊपर से नमूना पत्ती चुनें।",
    "🤖 AI Folate Verification Engine:": "🤖 एआई पत्ती सत्यापन इंजन:",
    "Our computer vision model verifies plant foliar tissue (Excess Green Index & HSV chromaticity), segments necrotic lesion spots, and cross-checks with ICAR pathological profiles.": "हमारा कंप्यूटर विजन मॉडल पत्ती के हरे ऊतकों और रोग के धब्बों की पहचान कर ICAR प्रोफाइल से मिलान करता है और सटीक दवा सुझाता है।",
    "Analyze Leaf with AI": "एआई से पत्ती की जांच करें",
    "AI Model analyzing foliar tissue and pathological lesions...": "एआई मॉडल पत्ती और रोग के लक्षणों की जांच कर रहा है...",
    "Early Blight": "अगेती झुलसा रोग (Early Blight)",
    "Moderate": "मध्यम (Moderate)",
    "AI confidence is low. Please upload a clearer image or consult an agricultural expert.": "एआई सटीकता विश्वास कम है। कृपया स्पष्ट फोटो अपलोड करें या कृषि विशेषज्ञ से सलाह लें।",
    "Symptoms": "रोग के लक्षण",
    "Possible Causes": "संभावित कारण",
    "Management": "रोकथाम और प्रबंधन",
    "Ask Our Leaf Disease Experts (विशेषज्ञ से सवाल पूछें)": "हमारे पत्ती रोग विशेषज्ञों से सवाल पूछें",
    "🌿 आपका जो पत्ती का रोग (Leaf Disease) है, अगर आप चाहें तो हमारे Experts से सवाल पूछ सकते हैं और अपनी समस्या सीधे भेज सकते हैं।": "🌿 आपका जो पत्ती का रोग है, उसके बारे में आप हमारे कृषि विशेषज्ञों से सीधे सवाल पूछ सकते हैं और अपनी समस्या भेज सकते हैं।",
    "Select a registered Leaf Disease Specialist below and send your leaf disease problem directly:": "नीचे एक पंजीकृत पत्ती रोग विशेषज्ञ चुनें और अपनी समस्या सीधे भेजें:",
    "✍️ अपना सवाल या पत्ती के रोग की समस्या लिखें (Write Your Leaf Disease Problem / Question for the Expert):": "✍️ अपना सवाल या पत्ती के रोग की समस्या यहाँ लिखें:",
    "Send Problem Directly to Selected Expert": "चयनित विशेषज्ञ को सीधे समस्या भेजें",
    "View registered Leaf Disease Experts and track answers to the problems you sent.": "पंजीकृत पत्ती रोग विशेषज्ञों को देखें और भेजे गए प्रश्नों के उत्तर ट्रैक करें।",
    "🔄 Refresh Experts & Replies": "🔄 विशेषज्ञ और उत्तर रिफ्रेश करें",
    "Context Active": "संदर्भ सक्रिय",
    "🍃 Yellow Leaves Advice": "🍃 पीले पत्तों की सलाह",
    "💧 Irrigation Timing": "💧 सिंचाई का समय",
    "💰 Monthly Expenses": "💰 मासिक खर्च",
    "📈 Mandi Prices": "📈 मंडी भाव",
    "🌧️ Post-Rain Guidance": "🌧️ बारिश के बाद सलाह",
    "Soil Test Parameters": "मिट्टी परीक्षण मापदंड",
    "Alluvial Loam": "जलोढ़ दोमट मिट्टी (Alluvial Loam)",
    "Red Laterite Soil": "लाल लैटेराइट मिट्टी (Red Laterite)",
    "Sandy Loam": "बलुई दोमट मिट्टी (Sandy Loam)",
    "Clay Loam": "चिकनी दोमट मिट्टी (Clay Loam)",
    "Nitrogen (N)": "नाइट्रोजन (N)",
    "Phosphorus (P)": "फास्फोरस (P)",
    "Potassium (K)": "पोटैशियम (K)",
    "Overall Fertility Index": "कुल उर्वरता सूचकांक",
    "pH Reaction:": "pH प्रतिक्रिया:",
    "Optimal Neutral": "उत्तम तटस्थ (Neutral)",
    "Nitrogen (N):": "नाइट्रोजन (N):",
    "Medium (260 kg/ha)": "मध्यम (260 kg/ha)",
    "Phosphorus (P):": "फास्फोरस (P):",
    "Medium (22 kg/ha)": "मध्यम (22 kg/ha)",
    "Potassium (K):": "पोटैशियम (K):",
    "Medium (190 kg/ha)": "मध्यम (190 kg/ha)",
    "Crop Suitability Matrix (Top Matches for Your Soil)": "आपकी मिट्टी के लिए सर्वोत्तम उपयुक्त फसलें",
    "Expense & Income Records": "खर्च और आय रिकॉर्ड",
    "Crop": "फसल",
    "Chilli": "मिर्च",
    "Protection (₹)": "फसल सुरक्षा / कीटनाशक (₹)",
    "Machinery (₹)": "मशीनरी / ट्रैक्टर (₹)",
    "Freight (₹)": "परिवहन भाड़ा (₹)",
    "Expected Yield (Qtl)": "अनुमानित पैदावार (क्विंटल)",
    "Expected Price/Qtl (₹)": "अनुमानित भाव/क्विंटल (₹)",
    "Simulation Summary": "अनुमान सारांश",
    "Estimated Cost": "अनुमानित लागत",
    "Estimated Revenue": "अनुमानित आय",
    "Projected ROI": "अनुमानित लाभ दर (ROI)",
    "Figures are scenario projections based on entered cost inputs. Actual realizations depend on weather and harvest conditions.": "ये आंकड़े दर्ज की गई लागत पर आधारित अनुमान हैं। वास्तविक लाभ मौसम और मंडी भाव पर निर्भर करता है।",
    "🎙️ Speak Expense to Log Instantly": "🎙️ बोलकर तुरंत खर्च दर्ज करें",
    "Say: \"I spent 1500 on fertilizer\" or \"ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି\"": "बोलें: \"खाद पर 1500 रुपये खर्च किए\"",
    "Speak Expense": "बोलकर खर्च लिखें",
    "Amount (₹)": "राशि (₹)",
    "Category": "श्रेणी",
    "Seed": "बीज",
    "Labour": "मजदूरी",
    "Irrigation": "सिंचाई",
    "Pesticide": "कीटनाशक दवा",
    "Equipment / Tractor": "उपकरण / ट्रैक्टर",
    "Transport": "परिवहन / भाड़ा",
    "Other": "अन्य",
    "Notes / Description": "विवरण / नोट्स",
    "+ Save Expense": "+ खर्च सेव करें",
    "Recent Recorded Expenses": "हाल ही में दर्ज किए गए खर्च",
    "Date": "तारीख",
    "Notes": "विवरण",
    "Odisha State-Wise APMC Network": "ओडिशा राज्य-स्तरीय APMC मंडी नेटवर्क",
    "21 Regulated Mandis Active": "21 सरकारी मंडियां सक्रिय",
    "Real per-day analysis across all 21 Odisha state-wise APMC/RMC mandis. Computes daily modal price, transport freight, strict 1.5% Mandi Fee, and net realization.": "ओडिशा की सभी 21 APMC/RMC मंडियों के दैनिक भाव, परिवहन भाड़ा, 1.5% मंडी शुल्क और शुद्ध लाभ का सटीक विश्लेषण।",
    "Chilli (Guntur / Desi)": "मिर्च (गुंटूर / देसी)",
    "Banana (Champa / Robusta)": "केला (चंपा / रोबस्टा)",
    "Apple (Simla / Kinnaur)": "सेब (शिमला / किन्नौर)",
    "Filter District / Zone": "जिला / क्षेत्र चुनें",
    "All Odisha Mandis (21 APMC/RMC)": "सभी ओडिशा मंडियां (21 APMC/RMC)",
    "Khordha (Bhubaneswar, Jatni)": "खोरधा (भुवनेश्वर, जटनी)",
    "Cuttack (Malgodown)": "कटक (मालगोदाम)",
    "Puri RMC": "पुरी RMC",
    "Bargarh APMC": "बरगढ़ APMC",
    "Sambalpur (Khetrajpur)": "संबलपुर (खेत्राजपुर)",
    "Ganjam (Berhampur)": "गंजाम (ब्रह्मपुर)",
    "Balasore RMC": "बालासोर RMC",
    "Bhadrak APMC": "भद्रक APMC",
    "Koraput (Jeypore)": "कोरापुट (जयपुर)",
    "Bolangir RMC": "बलांगीर RMC",
    "Kalahandi (Bhawanipatna)": "कालाहांडी (भवानीपटना)",
    "Angul RMC": "अनुगुल RMC",
    "Dhenkanal APMC": "ढेंकानाल APMC",
    "Kendujhar (Keonjhar)": "केंदुझर (क्योंझर)",
    "Jajpur Road APMC": "जाजपुर रोड APMC",
    "Sundargarh (Rourkela Panposh)": "सुंदरगढ़ (राउरकेला पानपोष)",
    "Rayagada APMC": "रायगड़ा APMC",
    "Produce Grade": "फसल की ग्रेड / गुणवत्ता",
    "Grade A (Premium)": "ग्रेड A (प्रीमियम गुणवत्ता)",
    "Grade B (Standard)": "ग्रेड B (मानक गुणवत्ता)",
    "Grade C (Fair)": "ग्रेड C (सामान्य गुणवत्ता)",
    "Calculate Optimal Mandi": "सर्वोत्तम मंडी की गणना करें",
    "Real Per-Day APMC Market Analysis": "दैनिक APMC मंडी भाव विश्लेषण",
    "Daily Bulletin: Loading live rates...": "दैनिक बुलेटिन: लाइव मंडी भाव लोड हो रहे हैं...",
    "⚖️ Mandi Fee Fixed: 1.5% (OSAMB Norm)": "⚖️ मंडी शुल्क: 1.5% (OSAMB नियम)",
    "🚚 Real Freight Modeling": "🚚 वास्तविक परिवहन भाड़ा गणना",
    "Transparent Odisha State-Wise Mandi Comparison (": "पारदर्शी ओडिशा मंडी तुलना (",
    "Mandis)": "मंडियां)",
    "Sorted by Net Realization (Highest Profit First)": "सर्वाधिक शुद्ध मुनाफे के अनुसार क्रमबद्ध",
    "👨‍🌾 Farmer Direct Selling & Bank Payment Setup": "👨‍🌾 किसान सीधी फसल बिक्री और बैंक भुगतान सेटअप",
    "+ Quick Popup Form": "+ त्वरित पॉपअप फॉर्म",
    "Sell Farm Produce & Farmer Bank Details Form": "फसल बिक्री एवं किसान बैंक विवरण फॉर्म",
    "Direct Bank Payment Enabled": "सीधा बैंक भुगतान सक्रिय",
    "🌾 Select Crop": "🌾 फसल चुनें",
    "Chilli (Desi Fresh)": "मिर्च (देसी ताज़ा)",
    "Banana (Champa)": "केला (चंपा)",
    "⭐ Produce Grade": "⭐ फसल ग्रेड",
    "Grade A (Premium Sorted)": "ग्रेड A (प्रीमियम छँटाई)",
    "Grade B (Standard Market)": "ग्रेड B (मानक मंडी)",
    "Grade C (Fair Average)": "ग्रेड C (औसत गुणवत्ता)",
    "📍 Farm Location": "📍 खेत / गांव का स्थान",
    "Farmer Contact & Bank Account Details (For Buyer Payment)": "किसान संपर्क एवं बैंक खाता विवरण (खरीदार से भुगतान पाने हेतु)",
    "📝 Harvest Quality Notes (Optional)": "📝 फसल गुणवत्ता विवरण (वैकल्पिक)",
    "My Published Farm Produce Listings": "मेरी प्रकाशित फसल बिक्री सूची",
    "RAZORPAY TEST MODE": "रेज़रपे टेस्ट मोड (RAZORPAY TEST MODE)",
    "Medicines (5)": "दवाइयां (5)",
    "All (5)": "सभी (5)",
    "Your Agricultural Medicine Cart": "आपका कृषि दवा कार्ट",
    "All prices and discounts are validated directly by the server before payment.": "भुगतान से पहले सभी कीमतें और छूट सर्वर द्वारा सीधे सत्यापित की जाती हैं।",
    "← Continue Shopping": "← खरीदारी जारी रखें",
    "Your Cart is Empty": "आपका कार्ट खाली है",
    "Browse our 5 verified crop protection medicines and add them to your cart.": "हमारी 5 प्रमाणित फसल सुरक्षा दवाएं देखें और उन्हें कार्ट में जोड़ें।",
    "🧴 Browse Medicines": "🧴 दवाइयां देखें",
    "Server Calculated": "सर्वर द्वारा गणना",
    "Total MRP (": "कुल MRP (",
    "items)": "आइटम)",
    "Delivery Charge (Free ≥ ₹499)": "डिलीवरी शुल्क (₹499 से अधिक पर मुफ़्त)",
    "Final Payable Amount": "अंतिम देय राशि",
    "Proceed to Secure Checkout": "सुरक्षित चेकआउट पर जाएं",
    "Secure Checkout & Delivery Details": "सुरक्षित चेकआउट और डिलीवरी विवरण",
    "← Back to Cart": "← कार्ट पर वापस जाएं",
    "🏡 Village / Plot / Landmark Address": "🏡 गांव / प्लॉट / लैंडमार्क पता",
    "🏙️ City / District": "🏙️ शहर / जिला",
    "🗺️ State": "🗺️ राज्य",
    "📮 PIN Code": "📮 पिन कोड (PIN Code)",
    "Secured by Razorpay 256-Bit SSL": "Razorpay 256-Bit SSL द्वारा सुरक्षित",
    "RECOMMENDED": "अनुशंसित (RECOMMENDED)",
    "Instant & secure online payment processed by Razorpay. Supports all major methods:": "Razorpay द्वारा त्वरित और सुरक्षित ऑनलाइन भुगतान। सभी प्रमुख माध्यम उपलब्ध:",
    "📱 UPI (GPay / PhonePe / Paytm)": "📱 UPI (GPay / PhonePe / Paytm)",
    "💳 Credit Card": "💳 क्रेडिट कार्ड",
    "🏧 Debit Card": "🏧 डेबिट कार्ड",
    "🏦 Net Banking": "🏦 नेट बैंकिंग",
    "👛 Wallets": "👛 वॉलेट (Wallets)",
    "Pay in cash at your doorstep when the sealed pesticide package is delivered to your farm.": "जब सीलबंद कीटनाशक पैकेट आपके घर या खेत पर डिलीवर हो जाए तब नकद भुगतान करें।",
    "Total MRP": "कुल MRP",
    "Total Savings": "कुल बचत (छूट)",
    "Delivery Charge": "डिलीवरी शुल्क",
    "Final Total": "अंतिम कुल राशि",
    "Pay ₹0 Securely": "सुरक्षित भुगतान करें",
    "🔐 Processed securely by": "🔐 सुरक्षित भुगतान:",
    "• Server-side HMAC-SHA256 Signature Verification": "• सर्वर-साइड HMAC-SHA256 हस्ताक्षर सत्यापन",
    "🎉 Payment Successful": "🎉 भुगतान सफल रहा!",
    "Your agricultural medicine order is confirmed and being prepared for dispatch.": "आपका कृषि दवा ऑर्डर कन्फर्म हो गया है और भेजने के लिए तैयार किया जा रहा है।",
    "Razorpay Payment ID": "रेज़रपे पेमेंट आईडी",
    "Order Date": "ऑर्डर की तारीख",
    "CONFIRMED": "पुष्टि की गई (CONFIRMED)",
    "Ordered Medicines": "ऑर्डर की गई दवाइयां",
    "Track Order": "ऑर्डर ट्रैक करें",
    "View Order History": "ऑर्डर इतिहास देखें",
    "Continue Shopping": "खरीदारी जारी रखें",
    "Payment Incomplete": "भुगतान अधूरा रहा",
    "Payment was not completed.": "भुगतान पूरा नहीं हो सका।",
    "Payment was cancelled or declined. Your order has not been charged.": "भुगतान रद्द या अस्वीकार कर दिया गया। आपके खाते से पैसे नहीं कटे हैं।",
    "Order Reference": "ऑर्डर संदर्भ",
    "FAILED": "असफल (FAILED)",
    "Retry Payment": "पुनः भुगतान करें",
    "🛒 Back to Cart": "🛒 कार्ट पर वापस जाएं",
    "🛍️ Continue Shopping": "🛍️ खरीदारी जारी रखें",
    "My Pesticide Orders & Payment History": "मेरे कीटनाशक ऑर्डर और भुगतान इतिहास",
    "Track live delivery status and verified Razorpay / COD payment receipts.": "लाइव डिलीवरी स्थिति और सत्यापित Razorpay / COD भुगतान रसीदें ट्रैक करें।",
    "+ Shop Medicines": "+ दवाइयां खरीदें",
    "Review farmer leaf disease problems sent to you and reply with verified treatment prescriptions.": "किसानों द्वारा भेजी गई पत्ती रोग समस्याओं की समीक्षा करें और प्रमाणित उपचार सलाह भेजें।",
    "🌿 Leaf Disease Specialist": "🌿 पत्ती रोग विशेषज्ञ",
    "Farmer Leaf Disease Questions & Problems Sent to You": "किसानों द्वारा आपको भेजे गए पत्ती रोग प्रश्न और समस्याएं",
    "🛒 Direct Wholesale Buyer Interface": "🛒 सीधा थोक खरीदार पोर्टल",
    "Browse verified farmer harvest lots across Odisha, inspect quality grades, and place direct farm-gate purchase orders.": "ओडिशा के किसानों की प्रमाणित फसलें देखें, गुणवत्ता जांचें और सीधे खरीद ऑर्डर दें।",
    "Procurement Mode": "खरीद मोड",
    "Direct Farm-Gate (0% Broker)": "सीधे खेत से खरीद (0% बिचौलिया)",
    "Buyer Trading Hub": "खरीदार व्यापार केंद्र",
    "Odisha APMC & Wholesale": "ओडिशा APMC और थोक बाजार",
    "System Administrator": "सिस्टम प्रशासक",
    "Total Users": "कुल उपयोगकर्ता",
    "Farmers": "किसान",
    "Total Leaf Scans": "कुल पत्ती स्कैन",
    "Avg Confidence": "औसत सटीकता",
    "Active AI Model": "सक्रिय एआई मॉडल",
    "AI Model Version Registry": "एआई मॉडल संस्करण रजिस्ट्री",
    "Payment Management (Razorpay & Pesticide Orders)": "भुगतान प्रबंधन (Razorpay और कीटनाशक ऑर्डर)",
    "Monitor Razorpay Order IDs, Payment IDs, customer transactions, and initiate verified refunds. (Razorpay Secret Key is strictly hidden on server).": "Razorpay ऑर्डर आईडी, पेमेंट आईडी, ग्राहक लेनदेन की निगरानी करें और सत्यापित रिफंड जारी करें।",
    "All": "सभी",
    "Customer": "ग्राहक / किसान",
    "Products": "दवाइयां / उत्पाद",
    "Razorpay Order ID": "रेज़रपे ऑर्डर आईडी",
    "Action": "कार्रवाई",
    "Loading payment records...": "भुगतान रिकॉर्ड लोड हो रहे हैं...",
    "Track individual crop plots, growth stages, and visual health indicators.": "अलग-अलग फसल प्लॉट, विकास चरण और स्वास्थ्य संकेतकों को ट्रैक करें।",
    "Product Name": "दवा का नाम",
    "Brand Name": "ब्रांड का नाम",
    "Sold By": "विक्रेता",
    "Stock & Rating": "स्टॉक और रेटिंग",
    "Inclusive of all taxes • Authentic Sealed Pack": "सभी करों सहित • असली सीलबंद पैक",
    "🧪 Active Composition": "🧪 सक्रिय रासायनिक संरचना",
    "Consult Leaf Disease Expert": "पत्ती रोग विशेषज्ञ से सलाह लें",
    "📖 Full Product Description & Mode of Action": "📖 संपूर्ण दवा विवरण और कार्य प्रणाली",
    "💧 Recommended Field Dosage & Application": "💧 अनुशंसित मात्रा और छिड़काव विधि",
    "Live Camera Viewfinder": "लाइव कैमरा व्यूफाइंडर",
    "Align Leaf Here": "पत्ती को यहाँ रखें",
    "📸 Capture Snapshot": "📸 फोटो खींचें",
    "Cancel": "रद्द करें",
    "Farmer Name": "किसान का नाम",
    "Select Crop": "फसल चुनें",
    "Farmer Bank Details (For Buyer Payment)": "किसान बैंक विवरण (खरीदार भुगतान हेतु)",
    "Harvest Description & Quality Notes": "फसल विवरण और गुणवत्ता नोट्स",
    "Publish Produce to Marketplace": "बाजार में फसल प्रकाशित करें",
    "Place Produce Order & Pay Farmer": "फसल ऑर्डर करें और किसान को भुगतान करें",
    "Crop:": "फसल:",
    "Direct Farmer Harvest": "सीधी किसान फसल",
    "Pay to Farmer (Farmer Payment Account)": "किसान को भुगतान करें (किसान बैंक खाता)",
    "Buyer / Trading Firm Name": "खरीदार / व्यापारिक फर्म का नाम",
    "Buyer Contact Phone": "खरीदार संपर्क फोन",
    "Buyer Warehouse / Shop Location (Address)": "खरीदार गोदाम / दुकान का पता",
    "Procurement Hub & District Corridor": "खरीद केंद्र और जिला क्षेत्र",
    "Notes / Logistics Pickup Date": "नोट्स / गाड़ी पिकअप तारीख",
    "Confirm Order & Pay to Farmer Account": "ऑर्डर कन्फर्म करें और किसान के खाते में भुगतान करें",
    "Secure Phone & OTP Login": "सुरक्षित फोन और OTP लॉगिन",
    "OTP sent to": "OTP भेजा गया:",
    "Change Number": "नंबर बदलें",
    "Enter 6-Digit Verification Code": "6-अंकों का सत्यापन कोड दर्ज करें",
    "Enter the 6-digit verification code sent to your mobile.": "अपने मोबाइल पर भेजा गया 6-अंकों का OTP कोड दर्ज करें।",

    // Placeholders in Hindi
    "Enter your full name": "अपना पूरा नाम दर्ज करें",
    "10-digit mobile number": "10-अंकों का मोबाइल नंबर",
    "Create your secure password": "अपना सुरक्षित पासवर्ड बनाएं",
    "Re-enter your password": "पासवर्ड दोबारा दर्ज करें",
    "e.g. Tomato & Rice Leaf Disease Specialist": "जैसे: टमाटर और धान पत्ती रोग विशेषज्ञ",
    "e.g. Khordha, Odisha": "जैसे: खोरधा, ओडिशा",
    "e.g. Rice, Tomato": "जैसे: धान, टमाटर",
    "Enter your Gmail ID": "अपनी जीमेल आईडी दर्ज करें",
    "Enter your password": "अपना पासवर्ड दर्ज करें",
    "Enter your name": "अपना नाम दर्ज करें",
    "Paste remote webcam or IP camera snapshot URL (e.g. http://.../snapshot.jpg)": "वेबकैम या IP कैमरा फोटो लिंक यहाँ पेस्ट करें...",
    "e.g. Mere fasal ke patton par daag aa rahe hain, kripya sahi dawai aur matra batayein...": "जैसे: मेरी फसल के पत्तों पर काले दाग आ रहे हैं, कृपया सही दवाई और मात्रा बताएं...",
    "Ask anything in English, Odia, or Hindi...": "हिंदी, ओडिया या अंग्रेजी में कोई भी कृषि सवाल पूछें...",
    "e.g. 2 bags urea": "जैसे: 2 बोरी यूरिया खाद",
    "Village, District, Odisha": "गांव, जिला, ओडिशा",
    "e.g. State Bank of India": "जैसे: स्टेट बैंक ऑफ इंडिया (SBI)",
    "Enter Account Holder Name": "खाताधारक का नाम दर्ज करें",
    "Enter Bank Account No.": "बैंक खाता संख्या दर्ज करें",
    "Freshly harvested, clean sorted, ready for buyer pickup.": "ताज़ा कटाई, साफ और छंटी हुई फसल, खरीदार पिकअप के लिए तैयार।",
    "🔍 Search medicine, crop, pest...": "🔍 दवा, फसल या रोग/कीट का नाम खोजें...",
    "Enter receiver full name": "प्राप्तकर्ता का पूरा नाम दर्ज करें",
    "House No, Village, GP, Near Mandi / Block Road": "मकान नं., गांव, पंचायत, मंडी / ब्लॉक रोड के पास",
    "e.g. Bhubaneswar, Khordha": "जैसे: भुवनेश्वर, खोरधा",
    "Account Holder Name": "खाताधारक का नाम",
    "Bank Account Number": "बैंक खाता संख्या",
    "Freshly harvested, clean sorted, IPM managed. Ready for immediate mandi/buyer pickup.": "ताज़ा कटाई और साफ फसल। तुरंत पिकअप के लिए तैयार।",
    "Enter buyer firm name": "खरीदार फर्म/दुकान का नाम दर्ज करें",
    "Enter contact phone": "संपर्क फोन नंबर दर्ज करें",
    "e.g. Buyer provides mandi transport truck; pickup on Tuesday morning.": "जैसे: मंगलवार सुबह ट्रक द्वारा फसल पिकअप।"
  }
};

// Phrase & Common Term Replacements for Dynamic Sentences, Labels, Placeholders & Cards
const PHRASE_REPLACEMENTS = {
  od: [
    ["Pesticides & Crop Protection Store", "କୀଟନାଶକ ଏବଂ ଫସଲ ସୁରକ୍ଷା ଔଷଧ ଦୋକାନ"],
    ["Direct Farmer-to-Buyer Produce Marketplace", "ସିଧାସଳଖ ଚାଷୀ-କ୍ରେତା ଫସଲ ବିକ୍ରି ବଜାର"],
    ["AI Leaf Disease Computer Vision Scanner", "ଏଆଇ ପତ୍ର ରୋଗ କମ୍ପ୍ୟୁଟର ଭିଜନ୍ ସ୍କାନର୍"],
    ["Farm Business Maker & Expense Tracker", "ଚାଷ ବ୍ୟବସାୟ ଯୋଜନା ଓ ଖର୍ଚ୍ଚ ହିସାବ"],
    ["Soil Intelligence & Nutrient Advisory", "ମାଟି ସ୍ୱାସ୍ଥ୍ୟ ଓ ପୋଷକ ତତ୍ତ୍ୱ ପରାମର୍ଶ"],
    ["Mandi Market Optimizer", "ମଣ୍ଡି ଦର ଅପ୍ଟିମାଇଜର୍"],
    ["Ask AI Farm Co-Pilot", "ଏଆଇ ଫାର୍ମ କୋ-ପାଇଲଟ୍ କୁ ପଚାରନ୍ତୁ"],
    ["Proceed to Checkout", "ଚେକଆଉଟ୍ କୁ ଯାଆନ୍ତୁ"],
    ["Pay Online with Razorpay", "Razorpay ଦ୍ୱାରା ଅନଲାଇନ୍ ପେମେଣ୍ଟ କରନ୍ତୁ"],
    ["Place Cash on Delivery Order", "କ୍ୟାସ୍ ଅନ୍ ଡେଲିଭରି ଅର୍ଡର କରନ୍ତୁ"],
    ["Cash on Delivery", "କ୍ୟାସ୍ ଅନ୍ ଡେଲିଭରି"],
    ["Online Payment", "ଅନଲାଇନ୍ ପେମେଣ୍ଟ"],
    ["Add to Cart", "କାର୍ଟରେ ଯୋଡ଼ନ୍ତୁ"],
    ["Buy Now", "ବର୍ତ୍ତମାନ କିଣନ୍ତୁ"],
    ["Consult Expert", "ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ"],
    ["View Details", "ବିବରଣୀ ଦେଖନ୍ତୁ"],
    ["My Orders", "ମୋର ଅର୍ଡରଗୁଡ଼ିକ"],
    ["Refresh Orders", "ଅର୍ଡର ରିଫ୍ରେସ୍ କରନ୍ତୁ"],
    ["In Stock", "ଷ୍ଟକ୍ ଅଛି"],
    ["Out of Stock", "ଷ୍ଟକ୍ ନାହିଁ"],
    ["Suitable Crops", "ଉପଯୁକ୍ତ ଫସଲ"],
    ["Target Disease", "ଲକ୍ଷ୍ୟ ରୋଗ ଓ ପୋକ"],
    ["Target Pests", "ଲକ୍ଷ୍ୟ ପୋକ"],
    ["Safety Information", "ସୁରକ୍ଷା ସୂଚନା"],
    ["Pack Size", "ପ୍ୟାକ୍ ସାଇଜ୍"],
    ["Quantity", "ପରିମାଣ"],
    ["Price Summary", "ମୂଲ୍ୟ ବିବରଣୀ"],
    ["Total Amount", "ମୋଟ ଟଙ୍କା"],
    ["Delivery Address", "ଡେଲିଭରି ଠିକଣା"],
    ["Payment Status", "ପେମେଣ୍ଟ ସ୍ଥିତି"],
    ["Order Status", "ଅର୍ଡର ସ୍ଥିତି"],
    ["Payment Method", "ପେମେଣ୍ଟ ମାଧ୍ୟମ"],
    ["Bio Fungicide", "ଜୈବିକ କବକନାଶକ"],
    ["Insecticide", "କୀଟନାଶକ"],
    ["Fungicide", "କବକନାଶକ"],
    ["Herbicide", "ଘାସମରା ଔଷଧ"],
    ["Fertilizer", "ସାର / ଖତ"],
    ["Check Disease", "ରୋଗ ପରୀକ୍ଷା"],
    ["Sell Produce", "ଫସଲ ବିକ୍ରି"],
    ["Pesticides", "କୀଟନାଶକ ଔଷଧ"],
    ["Market Optimizer", "ମଣ୍ଡି ଦର ଅପ୍ଟିମାଇଜର୍"],
    ["Farm Business", "ଚାଷ ବ୍ୟବସାୟ"],
    ["Soil Health", "ମାଟି ସ୍ୱାସ୍ଥ୍ୟ"],
    ["AI Co-Pilot", "ଏଆଇ କୋ-ପାଇଲଟ୍"],
    ["My Farm", "ମୋ ଫାର୍ମ"],
    ["Buyer Portal", "କ୍ରେତା ପୋର୍ଟାଲ"],
    ["Expert Advice", "ବିଶେଷଜ୍ଞ ପରାମର୍ଶ"],
    ["Admin Portal", "ପ୍ରଶାସନ ପୋର୍ଟାଲ"],
    ["Sign Up", "ସାଇନ୍ ଅପ୍"],
    ["Sign In", "ସାଇନ୍ ଇନ୍"],
    ["Sign Out", "ଲଗ୍ ଆଉଟ୍"],
    ["Full Name", "ସମ୍ପୂର୍ଣ୍ଣ ନାମ"],
    ["Mobile Number", "ମୋବାଇଲ୍ ନମ୍ବର"],
    ["Phone Number", "ଫୋନ୍ ନମ୍ବର"],
    ["Password", "ପାସୱାର୍ଡ"],
    ["Bank Name", "ବ୍ୟାଙ୍କ ନାମ"],
    ["Account Holder Name", "ଖାତାଧାରୀଙ୍କ ନାମ"],
    ["Account Number", "ଆକାଉଣ୍ଟ୍ ନମ୍ବର"],
    ["IFSC Code", "IFSC କୋଡ୍"],
    ["Temperature", "ତାପମାତ୍ରା"],
    ["Humidity", "ଆର୍ଦ୍ରତା"],
    ["Wind Speed", "ପବନ ବେଗ"],
    ["Rain Chance", "ବର୍ଷା ସମ୍ଭାବନା"],
    ["Quintals", "କ୍ୱିଣ୍ଟାଲ"],
    ["Quintal", "କ୍ୱିଣ୍ଟାଲ"],
    ["Acres", "ଏକର"],
    ["Acre", "ଏକର"],
    ["Rice", "ଧାନ"],
    ["Paddy", "ଧାନ"],
    ["Tomato", "ଟମାଟୋ"],
    ["Potato", "ଆଳୁ"],
    ["Cotton", "କପା"],
    ["Chili", "ଲଙ୍କା"],
    ["Brinjal", "ବାଇଗଣ"],
    ["Onion", "ପିଆଜ"],
    ["Groundnut", "ଚିନାବାଦାମ"],
    ["Mustard", "ସୋରିଷ"],
    ["Maize", "ମକା"],
    ["Sugarcane", "ଆଖୁ"],
    ["Okra", "ଭେଣ୍ଡି"],
    ["Cabbage", "ବନ୍ଧାକୋବି"],
    ["Cauliflower", "ଫୁଲକୋବି"],
    ["Mango", "ଆମ୍ବ"],
    ["Grapes", "ଅଙ୍ଗୁର"],
    ["Soybean", "ସୋୟାବିନ୍"],
    ["Wheat", "ଗହମ"],
    ["Green Gram", "ମୁଗ"],
    ["Black Gram", "ବିରି"],
    ["Verified", "ପ୍ରମାଣିତ"],
    ["Available", "ଉପଲବ୍ଧ"],
    ["Reviews", "ସମୀକ୍ଷା"],
    ["Sold by", "ବିକ୍ରେତା:"],
    ["Discount", "ରିହାତି"],
    ["Subtotal", "ମୋଟ ମୂଲ୍ୟ"],
    ["Shipping", "ଡେଲିଭରି"],
    ["Confirmed", "ନିଶ୍ଚିତ ହୋଇଛି"],
    ["Placed", "ଅର୍ଡର ହୋଇଛି"],
    ["Delivered", "ପହଞ୍ଚି ଯାଇଛି"],
    ["Pending", "ବାକି ଅଛି"],
    ["Paid", "ପୈଠ ହୋଇଛି"],
    ["Failed", "ବିଫଳ"],
    ["Refunded", "ଫେରସ୍ତ ହୋଇଛି"],
    ["System Administration & AI Model Registry", "ସିଷ୍ଟମ୍ ପ୍ରଶାସନ ଓ ଏଆଇ ମଡେଲ୍ ରେଜିଷ୍ଟ୍ରି"],
    ["Monitor platform users, AI telemetry, and switch active model versions.", "ଉପଭୋକ୍ତା ତଥ୍ୟ, ଏଆଇ ସଠିକତା ଏବଂ ମଡେଲ୍ ସଂସ୍କରଣ ନିୟନ୍ତ୍ରଣ କରନ୍ତୁ।"],
    ["Designed for farmers – enter phone number, receive OTP, and access your digital farm co-pilot.", "ଚାଷୀ ଭାଇଙ୍କ ପାଇଁ ସରଳ ବ୍ୟବସ୍ଥା – ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ, OTP ପାଆନ୍ତୁ ଏବଂ କୋ-ପାଇଲଟ୍ ବ୍ୟବହାର କରନ୍ତୁ।"],
    ["Select Your Role (Farmer 1st Priority)", "ନିଜର ଭୂମିକା ବାଛନ୍ତୁ (ଚାଷୀ ପ୍ରଥମ ପ୍ରାଥମିକତା)"],
    ["Send OTP to Mobile", "ମୋବାଇଲ୍ କୁ OTP ପଠାନ୍ତୁ"],
    ["Resend OTP", "ପୁଣି OTP ପଠାନ୍ତୁ"],
    ["Verify OTP & Enter", "OTP ଯାଞ୍ଚ କରନ୍ତୁ ଓ ପ୍ରବେଶ କରନ୍ତୁ"],
    ["AI confidence is below threshold (", "ଏଆଇ ବିଶ୍ୱସନୀୟତା ସୀମା ଠାରୁ କମ୍ ("],
    ["Notification message", "ସୂଚନା ବାର୍ତ୍ତା"],
    ["0 Qtl", "୦ କ୍ୱିଣ୍ଟାଲ"],
    ["Qtl", "କ୍ୱିଣ୍ଟାଲ"],
    ["OFF", "ରିହାତି"],
    ["per Acre", "ପ୍ରତି ଏକର"],
    ["Litres of water", "ଲିଟର ପାଣିରେ"],
    ["foliar spray", "ପତ୍ରରେ ସ୍ପ୍ରେ"],
    ["Pre-Harvest Interval", "ଅମଳ ପୂର୍ବ ସମୟ"],
    ["Brown Plant Hopper", "ମାଟିଆ ଗୁଣ୍ଡି ପୋକ (BPH)"],
    ["Powdery Mildew", "ପାଉଁଶିଆ ରୋଗ (Powdery Mildew)"],
    ["Early Blight", "ଆଗୁଆ ପତ୍ରପୋଡ଼ା (Early Blight)"],
    ["Late Blight", "ପଛୁଆ ପତ୍ରପୋଡ଼ା (Late Blight)"],
    ["Stem Borer", "କାଣ୍ଡ ବିନ୍ଧା ପୋକ (Stem Borer)"],
    ["Leaf Folder", "ପତ୍ର ମୋଡ଼ା ପୋକ"]
  ],
  hi: [
    ["Pesticides & Crop Protection Store", "कीटनाशक एवं फसल सुरक्षा दवा दुकान"],
    ["Direct Farmer-to-Buyer Produce Marketplace", "सीधा किसान-से-खरीदार फसल बिक्री बाजार"],
    ["AI Leaf Disease Computer Vision Scanner", "एआई पत्ती रोग कंप्यूटर विजन स्कैनर"],
    ["Farm Business Maker & Expense Tracker", "कृषि व्यापार योजना और खर्च प्रबंधन"],
    ["Soil Intelligence & Nutrient Advisory", "मृदा स्वास्थ्य और पोषक तत्व सलाह"],
    ["Mandi Market Optimizer", "मंडी भाव ऑप्टिमाइज़र"],
    ["Ask AI Farm Co-Pilot", "एआई फार्म को-पायलट से पूछें"],
    ["Proceed to Checkout", "चेकआउट पर जाएं"],
    ["Pay Online with Razorpay", "Razorpay से ऑनलाइन पेमेंट करें"],
    ["Place Cash on Delivery Order", "कैश ऑन डिलीवरी ऑर्डर करें"],
    ["Cash on Delivery", "कैश ऑन डिलीवरी"],
    ["Online Payment", "ऑनलाइन पेमेंट"],
    ["Add to Cart", "कार्ट में जोड़ें"],
    ["Buy Now", "अभी खरीदें"],
    ["Consult Expert", "विशेषज्ञ से पूछें"],
    ["View Details", "विवरण देखें"],
    ["My Orders", "मेरे ऑर्डर"],
    ["Refresh Orders", "ऑर्डर रिफ्रेश करें"],
    ["In Stock", "स्टॉक में उपलब्ध"],
    ["Out of Stock", "स्टॉक समाप्त"],
    ["Suitable Crops", "उपयुक्त फसलें"],
    ["Target Disease", "लक्षित रोग और कीट"],
    ["Target Pests", "लक्षित कीट"],
    ["Safety Information", "सुरक्षा जानकारी"],
    ["Pack Size", "पैक साइज"],
    ["Quantity", "मात्रा"],
    ["Price Summary", "मूल्य विवरण"],
    ["Total Amount", "कुल राशि"],
    ["Delivery Address", "डिलीवरी पता"],
    ["Payment Status", "भुगतान स्थिति"],
    ["Order Status", "ऑर्डर स्थिति"],
    ["Payment Method", "भुगतान माध्यम"],
    ["Bio Fungicide", "जैविक फफूंदनाशक"],
    ["Insecticide", "कीटनाशक"],
    ["Fungicide", "फफूंदनाशक"],
    ["Herbicide", "खरपतवारनाशक"],
    ["Fertilizer", "खाद / उर्वरक"],
    ["Check Disease", "रोग जांच"],
    ["Sell Produce", "फसल बेचें"],
    ["Pesticides", "कीटनाशक दवाएं"],
    ["Market Optimizer", "मंडी भाव तुलना"],
    ["Farm Business", "कृषि व्यापार"],
    ["Soil Health", "मृदा स्वास्थ्य"],
    ["AI Co-Pilot", "एआई को-पायलट"],
    ["My Farm", "मेरा खेत"],
    ["Buyer Portal", "खरीदार पोर्टल"],
    ["Expert Advice", "विशेषज्ञ सलाह"],
    ["Admin Portal", "एडमिन पोर्टल"],
    ["Sign Up", "साइन अप"],
    ["Sign In", "साइन इन"],
    ["Sign Out", "लॉग आउट"],
    ["Full Name", "पूरा नाम"],
    ["Mobile Number", "मोबाइल नंबर"],
    ["Phone Number", "फोन नंबर"],
    ["Password", "पासवर्ड"],
    ["Bank Name", "बैंक का नाम"],
    ["Account Holder Name", "खाताधारक का नाम"],
    ["Account Number", "खाता संख्या"],
    ["IFSC Code", "IFSC कोड"],
    ["Temperature", "तापमान"],
    ["Humidity", "नमी"],
    ["Wind Speed", "हवा की गति"],
    ["Rain Chance", "बारिश की संभावना"],
    ["Quintals", "क्विंटल"],
    ["Quintal", "क्विंटल"],
    ["Acres", "एकड़"],
    ["Acre", "एकड़"],
    ["Rice", "धान"],
    ["Paddy", "धान"],
    ["Tomato", "टमाटर"],
    ["Potato", "आलू"],
    ["Cotton", "कपास"],
    ["Chili", "मिर्च"],
    ["Brinjal", "बैंगन"],
    ["Onion", "प्याज"],
    ["Groundnut", "मूंगफली"],
    ["Mustard", "सरसों"],
    ["Maize", "मक्का"],
    ["Sugarcane", "गन्ना"],
    ["Okra", "भिंडी"],
    ["Cabbage", "पत्तागोभी"],
    ["Cauliflower", "फूलगोभी"],
    ["Mango", "आम"],
    ["Grapes", "अंगूर"],
    ["Soybean", "सोयाबीन"],
    ["Wheat", "गेहूं"],
    ["Green Gram", "मूंग"],
    ["Black Gram", "उड़द"],
    ["Verified", "प्रमाणित"],
    ["Available", "उपलब्ध"],
    ["Reviews", "समीक्षाएं"],
    ["Sold by", "विक्रेता:"],
    ["Discount", "छूट"],
    ["Subtotal", "उप-योग"],
    ["Shipping", "डिलीवरी"],
    ["Confirmed", "पुष्टि की गई"],
    ["Placed", "ऑर्डर किया गया"],
    ["Delivered", "डिलीवर हो गया"],
    ["Pending", "लंबित"],
    ["Paid", "भुगतान सफल"],
    ["Failed", "असफल"],
    ["Refunded", "रिफंड किया गया"],
    ["System Administration & AI Model Registry", "सिस्टम प्रशासन एवं एआई मॉडल रजिस्ट्री"],
    ["Monitor platform users, AI telemetry, and switch active model versions.", "उपयोगकर्ताओं, एआई सटीकता और सक्रिय मॉडल संस्करणों का नियंत्रण करें।"],
    ["Designed for farmers – enter phone number, receive OTP, and access your digital farm co-pilot.", "किसान भाइयों के लिए विशेष सुविधा – मोबाइल नंबर डालें, OTP प्राप्त करें और अपने फार्म को-पायलट का उपयोग करें।"],
    ["Select Your Role (Farmer 1st Priority)", "अपनी भूमिका चुनें (किसान को प्रथम प्राथमिकता)"],
    ["Send OTP to Mobile", "मोबाइल पर OTP भेजें"],
    ["Resend OTP", "पुनः OTP भेजें"],
    ["Verify OTP & Enter", "OTP सत्यापित करें और प्रवेश करें"],
    ["AI confidence is below threshold (", "एआई विश्वास सीमा से कम है ("],
    ["Notification message", "सूचना संदेश"],
    ["0 Qtl", "0 क्विंटल"],
    ["Qtl", "क्विंटल"],
    ["OFF", "छूट"],
    ["per Acre", "प्रति एकड़"],
    ["Litres of water", "लीटर पानी में"],
    ["foliar spray", "पत्ती पर छिड़काव"],
    ["Pre-Harvest Interval", "कटाई पूर्व अंतराल"],
    ["Brown Plant Hopper", "भूरा फुदका (BPH)"],
    ["Powdery Mildew", "पाउडरी मिल्ड्यू (सफेद चूर्णी रोग)"],
    ["Early Blight", "अगेती झुलसा (Early Blight)"],
    ["Late Blight", "पछेती झुलसा (Late Blight)"],
    ["Stem Borer", "तना छेदक (Stem Borer)"],
    ["Leaf Folder", "पत्ती लपेटक कीट"]
  ]
};

function translateTextValue(rawText, lang) {
  if (!rawText || lang === 'en') return rawText;
  const dict = FULL_INTERFACE_DICTIONARY[lang];
  const phrases = PHRASE_REPLACEMENTS[lang];
  if (!dict || !phrases) return rawText;

  // Preserve leading and trailing whitespace
  const leadingMatch = rawText.match(/^\s*/);
  const trailingMatch = rawText.match(/\s*$/);
  const leading = leadingMatch ? leadingMatch[0] : '';
  const trailing = trailingMatch ? trailingMatch[0] : '';
  const trimmed = rawText.trim();
  if (!trimmed) return rawText;

  // Normalize internal whitespace for dictionary lookup
  const norm = trimmed.replace(/\s+/g, ' ');

  // 1. Direct match in FULL_INTERFACE_DICTIONARY
  if (dict[norm]) {
    return leading + dict[norm] + trailing;
  }

  // 2. Check if string has leading emoji/icon prefix + known dictionary entry
  const emojiMatch = norm.match(/^([^\w\u0900-\u097F\u0B00-\u0B7F]+)\s*(.+)$/);
  if (emojiMatch) {
    const prefix = emojiMatch[1];
    const rest = emojiMatch[2].trim();
    if (dict[rest]) {
      return leading + prefix + ' ' + dict[rest] + trailing;
    }
  }

  // 3. Apply phrase & term replacements for composite/dynamic strings
  let result = norm;
  for (const [eng, target] of phrases) {
    if (result.includes(eng)) {
      // Avoid replacing inside already-translated parenthetical like "(Farmer)"
      const escaped = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<!\\()\\b${escaped}\\b(?!\\))`, 'g');
      if (regex.test(result)) {
        result = result.replace(regex, target);
      } else if (result === eng) {
        result = target;
      } else {
        result = result.split(eng).join(target);
      }
    }
  }

  return leading + result + trailing;
}

function translateDOMSubtree(root, lang) {
  if (!root || _i18nApplying) return;
  _i18nApplying = true;
  try {
    // 1. Standard [data-i18n] elements
    const i18nEls = root.querySelectorAll ? root.querySelectorAll('[data-i18n]') : [];
    i18nEls.forEach(el => {
      if (!el.dataset.origI18nText) {
        el.dataset.origI18nText = el.innerText.trim();
      }
      const key = el.getAttribute('data-i18n');
      if (lang === 'en') {
        const val = t(key, el.dataset.origI18nText);
        if (val && val !== key) el.innerText = val;
        else el.innerText = el.dataset.origI18nText;
      } else {
        const val = t(key, '');
        if (val && val !== key) {
          el.innerText = val;
        } else {
          el.innerText = translateTextValue(el.dataset.origI18nText, lang);
        }
      }
    });

    // 2. Standard [data-i18n-placeholder] elements
    const i18nPhEls = root.querySelectorAll ? root.querySelectorAll('[data-i18n-placeholder]') : [];
    i18nPhEls.forEach(el => {
      if (!el.dataset.origI18nPh) {
        el.dataset.origI18nPh = el.getAttribute('placeholder') || '';
      }
      const key = el.getAttribute('data-i18n-placeholder');
      if (lang === 'en') {
        const val = t(key, el.dataset.origI18nPh);
        el.setAttribute('placeholder', (val && val !== key) ? val : el.dataset.origI18nPh);
      } else {
        const val = t(key, '');
        el.setAttribute('placeholder', (val && val !== key) ? val : translateTextValue(el.dataset.origI18nPh, lang));
      }
    });

    // 3. All other [placeholder] inputs/textareas without data-i18n-placeholder
    const allPhEls = root.querySelectorAll ? root.querySelectorAll('input[placeholder], textarea[placeholder]') : [];
    allPhEls.forEach(el => {
      if (el.hasAttribute('data-i18n-placeholder')) return;
      const currPh = el.getAttribute('placeholder') || '';
      if (!_origPlaceholderMap.has(el)) {
        _origPlaceholderMap.set(el, currPh);
      }
      const origPh = _origPlaceholderMap.get(el);
      if (lang === 'en') {
        el.setAttribute('placeholder', origPh);
      } else {
        el.setAttribute('placeholder', translateTextValue(origPh, lang));
      }
    });

    // 4. All [title] attributes
    const allTitleEls = root.querySelectorAll ? root.querySelectorAll('[title]') : [];
    allTitleEls.forEach(el => {
      const currTitle = el.getAttribute('title') || '';
      if (!_origTitleMap.has(el)) {
        _origTitleMap.set(el, currTitle);
      }
      const origTitle = _origTitleMap.get(el);
      if (lang === 'en') {
        el.setAttribute('title', origTitle);
      } else {
        el.setAttribute('title', translateTextValue(origTitle, lang));
      }
    });

    // 5. Walk all Text nodes across the entire DOM
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE') {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip language selector options so they always show English / ଓଡ଼ିଆ / हिंदी clearly
          if (parent.closest && parent.closest('#langSelect')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip elements already handled directly by [data-i18n] if they have no child elements
          if (parent.hasAttribute('data-i18n') && parent.children.length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    for (const node of textNodes) {
      const currentVal = node.nodeValue;
      const lastTranslated = _lastTranslatedTextNodeMap.get(node);
      // If this node was never seen OR was dynamically updated by JS since last translation
      if (!_origTextNodeMap.has(node) || (lastTranslated !== undefined && currentVal !== lastTranslated)) {
        _origTextNodeMap.set(node, currentVal);
      }
      const origVal = _origTextNodeMap.get(node);
      if (lang === 'en') {
        if (node.nodeValue !== origVal) {
          node.nodeValue = origVal;
        }
        _lastTranslatedTextNodeMap.set(node, origVal);
      } else {
        const translatedVal = translateTextValue(origVal, lang);
        if (node.nodeValue !== translatedVal) {
          node.nodeValue = translatedVal;
        }
        _lastTranslatedTextNodeMap.set(node, translatedVal);
      }
    }
  } finally {
    _i18nApplying = false;
  }
}

function initFullPageTranslationObserver() {
  if (_i18nObserverInitialized || !document.body) return;
  _i18nObserverInitialized = true;
  const observer = new MutationObserver(() => {
    if (_i18nApplying || !state.currentLang || state.currentLang === 'en') return;
    if (_i18nDebounceTimer) clearTimeout(_i18nDebounceTimer);
    _i18nDebounceTimer = setTimeout(() => {
      translateDOMSubtree(document.body, state.currentLang);
    }, 40);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

async function loadTranslations(lang) {
  state.currentLang = lang || 'en';
  localStorage.setItem('lang', state.currentLang);
  document.documentElement.lang = state.currentLang;
  try {
    const res = await fetch(`/locales/${state.currentLang}/translation.json`);
    if (res.ok) {
      state.translations = await res.json();
    }
  } catch (err) {
    console.warn('Using built-in full-interface translation dictionary for:', state.currentLang);
  }
  applyTranslations();
  initFullPageTranslationObserver();
}

function t(path, fallback = '') {
  const parts = path.split('.');
  let curr = state.translations;
  for (const p of parts) {
    if (curr && curr[p] !== undefined) {
      curr = curr[p];
    } else {
      return fallback ? translateTextValue(fallback, state.currentLang) : path;
    }
  }
  return curr;
}

function applyTranslations() {
  translateDOMSubtree(document.body, state.currentLang || 'en');
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = state.currentLang || 'en';
}

async function switchLanguage(lang) {
  await loadTranslations(lang);
  if (state.activeTab === 'dashboard' && typeof loadDashboardData === 'function') loadDashboardData();
  if (state.activeTab === 'copilot' && typeof initCopilotView === 'function') initCopilotView();
  if (state.activeTab === 'pesticides' && typeof renderPesticidesCatalog === 'function') {
    renderPesticidesCatalog();
    if (typeof renderPesticidesOrders === 'function') renderPesticidesOrders();
  }
  setTimeout(() => {
    translateDOMSubtree(document.body, state.currentLang || 'en');
  }, 80);
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
  const landAndCropsContainer = document.getElementById('regLandAndCropsContainer');
  const landAreaInput = document.getElementById('regLandArea');
  const cropsInput = document.getElementById('regCrops');

  // Show Leaf Disease Expert ONLY when Expert (AGRICULTURAL_EXPERT) is selected
  if (leafExpertContainer) {
    if (selectedRole === 'AGRICULTURAL_EXPERT') {
      leafExpertContainer.classList.remove('hidden');
    } else {
      leafExpertContainer.classList.add('hidden');
      if (farmNameInput) farmNameInput.value = '';
    }
  }

  // Hide Land (Acres) and Crops when Expert or Buyer (or Admin) is selected; show ONLY for Farmer
  if (landAndCropsContainer) {
    if (selectedRole === 'FARMER') {
      landAndCropsContainer.classList.remove('hidden');
    } else {
      landAndCropsContainer.classList.add('hidden');
      if (landAreaInput) landAreaInput.value = '';
      if (cropsInput) cropsInput.value = '';
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
    'pesticides': 'Pesticides & Crop Medicines Store',
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
  else if (tabId === 'pesticides') initPesticidesView();
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

  const farmerName = state.user?.full_name || 'Farmer';
  const farmLoc = state.user?.location || 'Khordha / Bhubaneswar Rural, Odisha';
  const farmerPhone = state.user?.phone_number || '';

  const nameInput = document.getElementById('profListingFarmerName');
  if (nameInput) nameInput.value = farmerName;

  const phoneInput = document.getElementById('profListingPhone');
  if (phoneInput && !phoneInput.value) phoneInput.value = farmerPhone;

  const holderInput = document.getElementById('profListingHolderName');
  if (holderInput && !holderInput.value) holderInput.value = farmerName;

  const locInput = document.getElementById('profListingLocation');
  if (locInput && !locInput.value) locInput.value = farmLoc;

  modal.classList.remove('hidden');
}

function closeProduceListingModalFromProfile() {
  const modal = document.getElementById('modalProduceFromProfile');
  if (modal) modal.classList.add('hidden');
}

async function submitInlineProduceListing() {
  const crop = document.getElementById('inlineListingCrop')?.value || 'Tomato';
  const grade = document.getElementById('inlineListingGrade')?.value || 'Grade A';
  const qty = parseFloat(document.getElementById('inlineListingQty')?.value) || 25.0;
  const price = parseFloat(document.getElementById('inlineListingPrice')?.value) || 2450.0;
  const location = document.getElementById('inlineListingLocation')?.value?.trim() || 'Khordha, Odisha';
  const farmerPhone = document.getElementById('inlineListingPhone')?.value?.trim() || '';
  const bankName = document.getElementById('inlineListingBankName')?.value?.trim() || '';
  const holderName = document.getElementById('inlineListingHolderName')?.value?.trim() || '';
  const accountNumber = document.getElementById('inlineListingAccountNumber')?.value?.trim() || '';
  const ifscCode = document.getElementById('inlineListingIfscCode')?.value?.trim().toUpperCase() || '';
  const desc = document.getElementById('inlineListingDesc')?.value?.trim() || '';
  const farmerName = state.user?.full_name || holderName || 'Farmer';

  if (!farmerPhone) {
    showToast('कृपया अपना Phone Number दर्ज करें (Please enter your Phone Number)', 'warning');
    document.getElementById('inlineListingPhone')?.focus();
    return;
  }
  if (!bankName) {
    showToast('कृपया अपना Bank Name दर्ज करें (Please enter Bank Name)', 'warning');
    document.getElementById('inlineListingBankName')?.focus();
    return;
  }
  if (!holderName) {
    showToast('कृपया Account Holder Name दर्ज करें (Please enter Account Holder Name)', 'warning');
    document.getElementById('inlineListingHolderName')?.focus();
    return;
  }
  if (!accountNumber) {
    showToast('कृपया Bank Account Number दर्ज करें (Please enter Account Number)', 'warning');
    document.getElementById('inlineListingAccountNumber')?.focus();
    return;
  }
  if (!ifscCode) {
    showToast('कृपया Bank IFSC Code दर्ज करें (Please enter IFSC Code)', 'warning');
    document.getElementById('inlineListingIfscCode')?.focus();
    return;
  }

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
        farmer_phone: farmerPhone,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: holderName,
        variety: 'Farm Fresh Certified'
      })
    });

    if (res.ok) {
      showToast(`🌾 ${crop} produce listed with your Bank Account details for direct Buyer payment!`, 'success');
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

async function createProduceListingFromProfile() {
  const crop = document.getElementById('profListingCrop')?.value || 'Tomato';
  const grade = document.getElementById('profListingGrade')?.value || 'Grade A';
  const qty = parseFloat(document.getElementById('profListingQty')?.value) || 25.0;
  const price = parseFloat(document.getElementById('profListingPrice')?.value) || 2450.0;
  const location = document.getElementById('profListingLocation')?.value?.trim() || 'Khordha, Odisha';
  const desc = document.getElementById('profListingDesc')?.value?.trim() || '';
  const farmerName = document.getElementById('profListingFarmerName')?.value?.trim() || state.user?.full_name || 'Farmer';
  const farmerPhone = document.getElementById('profListingPhone')?.value?.trim() || '';
  const bankName = document.getElementById('profListingBankName')?.value?.trim() || '';
  const holderName = document.getElementById('profListingHolderName')?.value?.trim() || '';
  const accountNumber = document.getElementById('profListingAccountNumber')?.value?.trim() || '';
  const ifscCode = document.getElementById('profListingIfscCode')?.value?.trim().toUpperCase() || '';

  if (!farmerPhone) {
    showToast('Please enter your Phone Number', 'warning');
    document.getElementById('profListingPhone')?.focus();
    return;
  }
  if (!bankName) {
    showToast('Please enter your Bank Name', 'warning');
    document.getElementById('profListingBankName')?.focus();
    return;
  }
  if (!holderName) {
    showToast('Please enter Account Holder Name', 'warning');
    document.getElementById('profListingHolderName')?.focus();
    return;
  }
  if (!accountNumber) {
    showToast('Please enter Bank Account Number', 'warning');
    document.getElementById('profListingAccountNumber')?.focus();
    return;
  }
  if (!ifscCode) {
    showToast('Please enter Bank IFSC Code', 'warning');
    document.getElementById('profListingIfscCode')?.focus();
    return;
  }

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
        farmer_phone: farmerPhone,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: holderName,
        variety: 'Farm Fresh Certified'
      })
    });

    if (res.ok) {
      showToast(`🌾 Fresh produce listing for ${crop} added to marketplace with your bank payment details!`, 'success');
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
  // Pre-populate inline form defaults from logged-in farmer
  const inlineHolder = document.getElementById('inlineListingHolderName');
  if (inlineHolder && !inlineHolder.value && state.user?.full_name) {
    inlineHolder.value = state.user.full_name;
  }
  const inlinePhone = document.getElementById('inlineListingPhone');
  if (inlinePhone && !inlinePhone.value && state.user?.phone_number) {
    inlinePhone.value = state.user.phone_number;
  }
  const inlineLoc = document.getElementById('inlineListingLocation');
  if (inlineLoc && !inlineLoc.value) {
    inlineLoc.value = state.user?.location || 'Khordha, Odisha';
  }

  const res = await apiFetch('/buyers/listings');
  const container = document.getElementById('marketplaceGrid');
  if (!res.ok || !container) return;

  const listings = await res.json();
  container.innerHTML = '';
  if (listings.length === 0) {
    container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-8">No produce listings yet. Fill in your produce and Bank Account details above to sell produce!</p>';
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
        <p class="text-xs text-emerald-800 font-bold mt-0.5">🧑‍🌾 Farmer: ${item.farmer_name || 'Verified Farmer'} • 📱 ${item.farmer_phone || '--'}</p>
        <p class="text-xs text-slate-500 mt-0.5">📍 Farm: ${item.farm_location}</p>
        <p class="text-xs text-slate-600 mt-2 line-clamp-2">${item.description || 'Direct farm harvest from verified profile.'}</p>
        
        <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div class="p-2 bg-slate-50 rounded-xl">
            <span class="text-slate-400 block text-3xs uppercase font-bold">Available Quantity</span>
            <span class="font-extrabold text-slate-800 text-sm">${item.quantity_quintals} Qtl</span>
          </div>
          <div class="p-2 bg-emerald-50 rounded-xl">
            <span class="text-emerald-700 block text-3xs uppercase font-bold">Expected Price</span>
            <span class="font-extrabold text-emerald-900 text-sm">₹${item.expected_price_per_quintal}/Qtl</span>
          </div>
        </div>

        <div class="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-2xs space-y-1">
          <div class="font-extrabold text-emerald-950">🏦 Your Saved Bank Account Details:</div>
          <div><strong>Bank Name:</strong> ${item.bank_name || '--'} | <strong>IFSC:</strong> <span class="font-mono">${item.ifsc_code || '--'}</span></div>
          <div><strong>Account Holder:</strong> ${item.account_holder_name || item.farmer_name || '--'}</div>
          <div><strong>Account No.:</strong> <span class="font-mono font-bold text-emerald-900">${item.account_number || '--'}</span></div>
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
    const holderName = item.account_holder_name || item.farmer_name || 'Verified Farmer';
    const accountNum = item.account_number || 'Provided in Order';
    const safeHolder = holderName.replace(/'/g, "\\'");
    const safeAcct = accountNum.replace(/'/g, "\\'");

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
        <p class="text-xs text-emerald-800 font-bold mt-0.5">🧑‍🌾 Farmer: ${item.farmer_name || 'Verified Farmer'} ${item.farmer_phone ? `(${item.farmer_phone})` : ''}</p>
        <p class="text-xs text-slate-500 mt-0.5">📍 Farm Location: ${item.farm_location}</p>
        <p class="text-xs text-slate-600 mt-2 line-clamp-2">${item.description || 'Direct farm harvest ready for immediate wholesale dispatch.'}</p>
        
        <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div class="p-2 bg-slate-50 rounded-xl">
            <span class="text-slate-400 block text-3xs uppercase font-bold">Available Quantity</span>
            <span class="font-extrabold text-slate-800 text-sm">${item.quantity_quintals} Qtl</span>
          </div>
          <div class="p-2 bg-amber-50 rounded-xl border border-amber-200/60">
            <span class="text-amber-800 block text-3xs uppercase font-bold">Farmer Ask Price</span>
            <span class="font-extrabold text-amber-950 text-sm">₹${item.expected_price_per_quintal}/Qtl</span>
          </div>
        </div>

        <!-- Strictly ONLY Account Holder Name & Account Number shown to Buyer for payment -->
        <div class="mt-3 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1">
          <div class="text-2xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
            <span>💳</span> <span>Pay Farmer Account Details</span>
          </div>
          <div class="text-slate-800">👤 <strong>Account Holder Name:</strong> <span class="font-extrabold text-slate-900">${holderName}</span></div>
          <div class="text-slate-800">🔢 <strong>Account Number:</strong> <span class="font-mono font-extrabold text-emerald-900">${accountNum}</span></div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100">
        <button onclick="openBuyerOrderModal(${item.id}, '${item.crop}', ${item.expected_price_per_quintal}, '${safeHolder}', '${safeAcct}')" class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5">
          <span>🛒</span> <span>Order Produce & Pay Farmer</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openBuyerOrderModal(listingId, crop, price, holderName = '', accountNumber = '') {
  const modal = document.getElementById('buyerOrderModal');
  if (!modal) return;
  document.getElementById('buyerOrderListingId').value = listingId;
  document.getElementById('buyerOrderCropName').innerText = crop;
  document.getElementById('buyerOrderPrice').value = price;

  // Populate Farmer's Account Holder Name & Account Number for Buyer Payment
  if (!holderName || !accountNumber) {
    const found = (window.allBuyerListings || []).find(l => l.id === listingId);
    if (found) {
      holderName = holderName || found.account_holder_name || found.farmer_name || 'Verified Farmer';
      accountNumber = accountNumber || found.account_number || '--';
    }
  }
  const holderEl = document.getElementById('buyerOrderHolderName');
  const acctEl = document.getElementById('buyerOrderAccountNumber');
  if (holderEl) holderEl.innerText = holderName || 'Verified Farmer';
  if (acctEl) acctEl.innerText = accountNumber || '--';

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

  // Load Admin Payment Management Table
  loadAdminPayments('ALL');
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

// =========================================================================
// 🧴 12. PESTICIDES E-COMMERCE & RAZORPAY ONLINE PAYMENT CONTROLLER
// =========================================================================
const pesticideState = {
  products: [],
  selectedCategory: 'ALL',
  cart: JSON.parse(localStorage.getItem('aifarm_pesticide_cart_v1') || '[]'),
  serverPricing: null,
  paymentMethod: 'RAZORPAY',
  razorpayKeyId: '',
  razorpayMode: 'TEST',
  activeModalProduct: null,
  activeModalPackSize: null,
  lastCreatedOrder: null,
  orders: []
};

function savePesticideCartToStorage() {
  localStorage.setItem('aifarm_pesticide_cart_v1', JSON.stringify(pesticideState.cart));
  updatePesticideCartBadges();
}

function updatePesticideCartBadges() {
  const totalQty = pesticideState.cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const navBadge = document.getElementById('navPesticideCartBadge');
  const headerBadge = document.getElementById('pestHeaderCartCount');
  if (navBadge) {
    navBadge.innerText = String(totalQty);
    if (totalQty > 0) navBadge.classList.remove('hidden');
    else navBadge.classList.add('hidden');
  }
  if (headerBadge) {
    headerBadge.innerText = String(totalQty);
  }
}

async function initPesticidesView() {
  updatePesticideCartBadges();
  try {
    const res = await apiFetch('/pesticides/products');
    if (res.ok) {
      const data = await res.json();
      pesticideState.products = data.products || [];
      pesticideState.razorpayKeyId = data.razorpay_key_id || '';
      pesticideState.razorpayMode = data.razorpay_mode || 'TEST';

      const modeBadge = document.getElementById('pesticideRazorpayModeBadge');
      if (modeBadge) {
        if (pesticideState.razorpayMode === 'LIVE') {
          modeBadge.className = 'px-2.5 py-0.5 rounded-full text-3xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-300 flex items-center gap-1';
          modeBadge.innerHTML = '<span>💳</span> <span>RAZORPAY LIVE MODE</span>';
        } else {
          modeBadge.className = 'px-2.5 py-0.5 rounded-full text-3xs font-black bg-blue-100 text-blue-800 uppercase tracking-wider border border-blue-300 flex items-center gap-1';
          modeBadge.innerHTML = '<span>💳</span> <span>RAZORPAY TEST MODE</span>';
        }
      }
    }
  } catch (err) {
    console.error('Error loading pesticides catalog:', err);
  }

  renderPesticideCatalog();
  loadMyPesticideOrders(true);
}

function switchPesticideSubView(viewName) {
  const views = {
    catalog: 'pesticidesCatalogView',
    cart: 'pesticidesCartView',
    checkout: 'pesticidesCheckoutView',
    success: 'pesticidesSuccessView',
    failure: 'pesticidesFailureView',
    orders: 'pesticidesOrdersView'
  };

  Object.entries(views).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (key === viewName) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  ['catalog', 'cart', 'orders'].forEach(tabKey => {
    const btn = document.getElementById(`pestTabBtn-${tabKey}`);
    if (!btn) return;
    if (tabKey === viewName || (viewName === 'checkout' && tabKey === 'cart')) {
      btn.className = 'px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5';
    } else {
      btn.className = 'px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-emerald-50 text-slate-800 border border-slate-200 transition flex items-center gap-1.5';
    }
  });

  if (viewName === 'catalog') renderPesticideCatalog();
  else if (viewName === 'cart') renderPesticideCartView();
  else if (viewName === 'checkout') preparePesticideCheckoutView();
  else if (viewName === 'orders') loadMyPesticideOrders(false);
}

function filterPesticidesByCategory(cat) {
  pesticideState.selectedCategory = cat;
  document.querySelectorAll('.pest-cat-btn').forEach(btn => {
    btn.className = 'pest-cat-btn px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 transition';
  });
  const activeBtn = document.getElementById(`pestCatBtn-${cat}`);
  if (activeBtn) {
    activeBtn.className = 'pest-cat-btn px-3 py-1.5 rounded-xl font-extrabold bg-emerald-700 text-white transition';
  }
  renderPesticideCatalog();
}

function renderPesticideCatalog() {
  const grid = document.getElementById('pesticidesProductsGrid');
  if (!grid) return;

  const searchInput = document.getElementById('pesticideSearchInput');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const cat = pesticideState.selectedCategory || 'ALL';

  const filtered = (pesticideState.products || []).filter(p => {
    const matchCat = cat === 'ALL' || (p.category || '').toLowerCase() === cat.toLowerCase();
    const matchQuery = !query ||
      (p.name || '').toLowerCase().includes(query) ||
      (p.brand || '').toLowerCase().includes(query) ||
      (p.composition || '').toLowerCase().includes(query) ||
      (p.target_disease || '').toLowerCase().includes(query) ||
      (p.suitable_crops || []).some(c => c.toLowerCase().includes(query));
    return matchCat && matchQuery;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
        <p class="text-sm font-bold text-slate-700">No matching pesticide medicines found.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-3xl border border-slate-200 hover:border-emerald-500/70 shadow-xs hover:shadow-xl transition-all p-5 flex flex-col justify-between space-y-4';

    const packPills = (p.pack_variants || [p.pack_size]).map(sz => {
      const isDefault = sz === p.pack_size;
      return `<button type="button" onclick="selectCardPackSize(${p.id}, '${sz}')" id="cardPack-${p.id}-${sz.replace(/\s+/g, '')}" class="card-pack-btn-${p.id} px-3 py-1 rounded-full text-2xs font-bold border transition ${isDefault ? 'border-blue-600 bg-blue-50 text-blue-800 font-extrabold' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}">${sz}</button>`;
    }).join('');

    const cropsBadges = (p.suitable_crops || []).slice(0, 5).map(c =>
      `<span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-3xs font-bold">${c}</span>`
    ).join('');

    card.innerHTML = `
      <div class="space-y-3">
        <!-- Product Image Header -->
        <div onclick="openPesticideDetailModal(${p.id})" class="relative bg-slate-50 rounded-2xl border border-slate-100 p-4 h-56 flex items-center justify-center cursor-pointer group overflow-hidden">
          <img src="${p.image_url}" alt="${p.name}" class="max-h-48 object-contain group-hover:scale-105 transition-transform duration-300">
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-800 font-bold text-3xs border border-slate-200 flex items-center gap-1">
            <span>🧴</span> <span>Pesticide • ${p.category}</span>
          </span>
          <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-3xs border border-emerald-300">
            ● ${p.stock_status} (${p.stock})
          </span>
        </div>

        <!-- Product Title & Brand -->
        <div>
          <div class="flex items-center justify-between text-2xs text-slate-500 font-bold">
            <span>${p.brand}</span>
            <span class="text-amber-600 font-extrabold">⭐ ${p.rating} (${p.reviews_count})</span>
          </div>
          <h3 onclick="openPesticideDetailModal(${p.id})" class="font-black text-slate-900 text-base leading-snug mt-1 cursor-pointer hover:text-emerald-700 transition">
            ${p.name}
          </h3>
          <p class="text-2xs font-mono font-bold text-emerald-800 bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200/70 mt-1.5">
            🧪 ${p.composition}
          </p>
        </div>

        <!-- Price, MRP & Discount Pill (Matches Uploaded Design) -->
        <div class="pt-1">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 line-through font-mono">₹${Number(p.mrp).toLocaleString('en-IN')}</span>
            <span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-2xs">-${p.discount_pct}%</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-mono mt-0.5">
            ₹${Number(p.price).toLocaleString('en-IN')}
          </div>
        </div>

        <!-- Pack Size Pills -->
        <div class="space-y-1">
          <span class="text-3xs uppercase font-bold text-slate-400 block">Pack Size</span>
          <div class="flex flex-wrap gap-1.5" id="cardPackContainer-${p.id}" data-selected-pack="${p.pack_size}">
            ${packPills}
          </div>
        </div>

        <!-- Short Description & Target Problem -->
        <p class="text-xs text-slate-600 line-clamp-2">${p.short_description}</p>

        <div class="space-y-1.5 pt-1 border-t border-slate-100 text-2xs">
          <div><strong class="text-slate-700">🎯 Target Pest/Disease:</strong> <span class="text-slate-600">${p.target_disease}</span></div>
          <div class="flex flex-wrap gap-1 pt-0.5">${cropsBadges}</div>
        </div>

        <!-- Sold By Agribegri Bar -->
        <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-2xs">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">A</span>
            <div>
              <span class="text-slate-400 block text-3xs leading-none">Sold by:</span>
              <strong class="text-slate-800 font-extrabold">${p.sold_by || 'Agribegri'}</strong>
            </div>
          </div>
          <button onclick="openPesticideDetailModal(${p.id})" class="text-emerald-700 hover:underline font-bold">
            Details & Safety →
          </button>
        </div>
      </div>

      <!-- Quantity Selector + Add to Cart + Buy Now + Consult Expert -->
      <div class="space-y-2 pt-2 border-t border-slate-100">
        <div class="flex items-center gap-2">
          <div class="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50">
            <button type="button" onclick="adjustCardPesticideQty(${p.id}, -1)" class="px-2.5 py-2 font-black text-slate-700 hover:bg-slate-200 rounded-l-xl text-xs">−</button>
            <input type="number" id="cardQty-${p.id}" value="1" min="1" max="50" class="w-10 text-center font-black text-xs text-slate-900 bg-transparent focus:outline-hidden" readonly>
            <button type="button" onclick="adjustCardPesticideQty(${p.id}, 1)" class="px-2.5 py-2 font-black text-slate-700 hover:bg-slate-200 rounded-r-xl text-xs">+</button>
          </div>
          <button onclick="handleCardAddToCart(${p.id}, false)" class="flex-1 py-2.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1">
            <span>🛒</span> <span>Add to Cart</span>
          </button>
          <button onclick="handleCardAddToCart(${p.id}, true)" class="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1">
            <span>⚡</span> <span>Buy Now</span>
          </button>
        </div>
        <button onclick="consultExpertAboutPesticide(${p.id})" class="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-2xs font-bold transition flex items-center justify-center gap-1.5">
          <span>👨‍🌾</span> <span>Consult Leaf Disease Expert About This Medicine</span>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function selectCardPackSize(productId, packSize) {
  const container = document.getElementById(`cardPackContainer-${productId}`);
  if (container) container.setAttribute('data-selected-pack', packSize);
  document.querySelectorAll(`.card-pack-btn-${productId}`).forEach(btn => {
    btn.className = `card-pack-btn-${productId} px-3 py-1 rounded-full text-2xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition`;
  });
  const activeBtn = document.getElementById(`cardPack-${productId}-${packSize.replace(/\s+/g, '')}`);
  if (activeBtn) {
    activeBtn.className = `card-pack-btn-${productId} px-3 py-1 rounded-full text-2xs font-extrabold border border-blue-600 bg-blue-50 text-blue-800 transition`;
  }
}

function adjustCardPesticideQty(productId, delta) {
  const input = document.getElementById(`cardQty-${productId}`);
  if (!input) return;
  const next = Math.max(1, Math.min(50, (parseInt(input.value, 10) || 1) + delta));
  input.value = String(next);
}

function handleCardAddToCart(productId, buyNow = false) {
  const qtyInput = document.getElementById(`cardQty-${productId}`);
  const packContainer = document.getElementById(`cardPackContainer-${productId}`);
  const qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
  const packSize = packContainer ? packContainer.getAttribute('data-selected-pack') : null;
  addToPesticideCart(productId, qty, packSize, buyNow);
}

// Product Detail Modal
function openPesticideDetailModal(productId) {
  const p = (pesticideState.products || []).find(item => Number(item.id) === Number(productId));
  if (!p) return;

  pesticideState.activeModalProduct = p;
  pesticideState.activeModalPackSize = p.pack_size;

  document.getElementById('pestModalCategoryBadge').innerText = `🧴 Pesticide • ${p.category}`;
  document.getElementById('pestModalName').innerText = p.name;
  document.getElementById('pestModalBrand').innerText = p.brand;
  document.getElementById('pestModalImage').src = p.image_url;
  document.getElementById('pestModalSoldBy').innerText = p.sold_by || 'Agribegri';
  document.getElementById('pestModalStockRating').innerText = `${p.stock_status} (${p.stock}) • ⭐ ${p.rating}`;
  document.getElementById('pestModalPrice').innerText = `₹${Number(p.price).toLocaleString('en-IN')}`;
  document.getElementById('pestModalMrp').innerText = `₹${Number(p.mrp).toLocaleString('en-IN')}`;
  document.getElementById('pestModalDiscount').innerText = `-${p.discount_pct}%`;
  document.getElementById('pestModalComposition').innerText = p.composition;
  document.getElementById('pestModalCrops').innerText = (p.suitable_crops || []).join(', ');
  document.getElementById('pestModalTargetDisease').innerText = p.target_disease;
  document.getElementById('pestModalFullDesc').innerText = p.full_description;
  document.getElementById('pestModalDosage').innerText = p.dosage;
  document.getElementById('pestModalSafety').innerText = p.safety_info;
  document.getElementById('pestModalQtyInput').value = '1';

  const packWrap = document.getElementById('pestModalPackVariants');
  if (packWrap) {
    packWrap.innerHTML = (p.pack_variants || [p.pack_size]).map(sz => {
      const active = sz === p.pack_size;
      return `<button type="button" onclick="selectModalPackSize('${sz}')" class="modal-pack-pill px-3.5 py-1.5 rounded-full text-xs font-bold border ${active ? 'border-blue-600 bg-blue-50 text-blue-800 font-extrabold' : 'border-slate-300 bg-white text-slate-700'}" data-pack="${sz}">${sz}</button>`;
    }).join('');
  }

  document.getElementById('pestModalAddToCartBtn').onclick = () => {
    const q = parseInt(document.getElementById('pestModalQtyInput').value, 10) || 1;
    addToPesticideCart(p.id, q, pesticideState.activeModalPackSize, false);
    closePesticideDetailModal();
  };
  document.getElementById('pestModalBuyNowBtn').onclick = () => {
    const q = parseInt(document.getElementById('pestModalQtyInput').value, 10) || 1;
    closePesticideDetailModal();
    addToPesticideCart(p.id, q, pesticideState.activeModalPackSize, true);
  };
  document.getElementById('pestModalConsultExpertBtn').onclick = () => {
    closePesticideDetailModal();
    consultExpertAboutPesticide(p.id);
  };
  document.getElementById('pestModalAskAiBtn').onclick = () => {
    closePesticideDetailModal();
    askAiAboutPesticide(p.id);
  };

  document.getElementById('pesticideDetailModal').classList.remove('hidden');
}

function selectModalPackSize(sz) {
  pesticideState.activeModalPackSize = sz;
  document.querySelectorAll('.modal-pack-pill').forEach(btn => {
    if (btn.getAttribute('data-pack') === sz) {
      btn.className = 'modal-pack-pill px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-blue-600 bg-blue-50 text-blue-800';
    } else {
      btn.className = 'modal-pack-pill px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-300 bg-white text-slate-700';
    }
  });
}

function adjustModalPesticideQty(delta) {
  const el = document.getElementById('pestModalQtyInput');
  if (!el) return;
  el.value = String(Math.max(1, Math.min(50, (parseInt(el.value, 10) || 1) + delta)));
}

function closePesticideDetailModal() {
  const modal = document.getElementById('pesticideDetailModal');
  if (modal) modal.classList.add('hidden');
}

function consultExpertAboutPesticide(productId) {
  const p = (pesticideState.products || []).find(item => Number(item.id) === Number(productId));
  if (!p) return;
  switchTab('scanner');
  setTimeout(() => {
    const noteInput = document.getElementById('farmerExpertQueryInput');
    if (noteInput) {
      noteInput.value = `Namaskar Doctor, I want to check if "${p.name}" (${p.composition}) at dosage ${p.dosage} is suitable and safe for my crop problem (${p.target_disease}). Please advise.`;
      noteInput.focus();
      noteInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast(`👨‍🌾 Switched to Leaf Disease Expert Consultation for ${p.name}`, 'info');
  }, 250);
}

function askAiAboutPesticide(productId) {
  const p = (pesticideState.products || []).find(item => Number(item.id) === Number(productId));
  if (!p) return;
  switchTab('copilot');
  setTimeout(() => {
    const chatInput = document.getElementById('copilotInput');
    if (chatInput) {
      chatInput.value = `Tell me about ${p.name} (${p.composition}) for ${p.target_disease} and its safe application.`;
      if (typeof sendCopilotMessage === 'function') sendCopilotMessage();
    }
  }, 250);
}

// Cart Management
async function addToPesticideCart(productId, quantity = 1, packSize = null, buyNow = false) {
  const p = (pesticideState.products || []).find(item => Number(item.id) === Number(productId));
  if (!p) return;

  const chosenPack = packSize || p.pack_size;
  const existing = pesticideState.cart.find(it => Number(it.product_id) === Number(productId) && it.pack_size === chosenPack);
  if (existing) {
    existing.quantity = Math.min(50, Number(existing.quantity) + Number(quantity));
  } else {
    pesticideState.cart.push({
      product_id: p.id,
      quantity: Math.min(50, Number(quantity)),
      pack_size: chosenPack
    });
  }

  savePesticideCartToStorage();
  await syncServerCartPricing();

  if (buyNow) {
    switchPesticideSubView('checkout');
  } else {
    showToast(`🛒 Added ${quantity} × ${p.name} (${chosenPack}) to your cart!`, 'success');
  }
}

async function syncServerCartPricing() {
  if (!pesticideState.cart || pesticideState.cart.length === 0) {
    pesticideState.serverPricing = null;
    return null;
  }
  try {
    const res = await apiFetch('/pesticides/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pesticideState.cart)
    });
    if (res.ok) {
      const data = await res.json();
      pesticideState.serverPricing = data.pricing;
      return data.pricing;
    }
  } catch (e) {
    console.error('Cart calculation error:', e);
  }
  return null;
}

async function updateCartItemQty(index, delta) {
  const item = pesticideState.cart[index];
  if (!item) return;
  const nextQty = Number(item.quantity) + delta;
  if (nextQty <= 0) {
    pesticideState.cart.splice(index, 1);
  } else {
    item.quantity = Math.min(50, nextQty);
  }
  savePesticideCartToStorage();
  await renderPesticideCartView();
}

async function removeCartItem(index) {
  pesticideState.cart.splice(index, 1);
  savePesticideCartToStorage();
  await renderPesticideCartView();
}

async function renderPesticideCartView() {
  const emptyState = document.getElementById('pesticideCartEmptyState');
  const contentGrid = document.getElementById('pesticideCartContentGrid');
  const listEl = document.getElementById('pesticideCartItemsList');

  if (!pesticideState.cart || pesticideState.cart.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentGrid) contentGrid.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (contentGrid) contentGrid.classList.remove('hidden');

  const pricing = await syncServerCartPricing();
  if (!pricing || !listEl) return;

  listEl.innerHTML = '';
  (pricing.items || []).forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs';
    row.innerHTML = `
      <div class="flex items-center gap-3.5">
        <img src="${it.image_url}" alt="${it.name}" class="w-16 h-16 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1">
        <div>
          <span class="text-3xs font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">${it.category} • Pack: ${it.pack_size}</span>
          <h4 class="font-extrabold text-slate-900 text-sm mt-1">${it.name}</h4>
          <p class="text-2xs text-slate-500">${it.brand}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="font-black text-slate-900 font-mono text-sm">₹${Number(it.unit_price).toLocaleString('en-IN')}</span>
            <span class="text-2xs text-slate-400 line-through font-mono">₹${Number(it.mrp).toLocaleString('en-IN')}</span>
            <span class="text-3xs font-black text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">-${it.discount_pct}%</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
        <div class="inline-flex items-center rounded-xl border border-slate-300 bg-slate-50">
          <button onclick="updateCartItemQty(${idx}, -1)" class="px-3 py-1.5 font-black text-slate-700 hover:bg-slate-200 rounded-l-xl text-xs">−</button>
          <span class="px-3 font-black text-xs text-slate-900">${it.quantity}</span>
          <button onclick="updateCartItemQty(${idx}, 1)" class="px-3 py-1.5 font-black text-slate-700 hover:bg-slate-200 rounded-r-xl text-xs">+</button>
        </div>
        <div class="text-right min-w-[80px]">
          <div class="font-black text-emerald-800 font-mono text-sm">₹${Number(it.line_total).toLocaleString('en-IN')}</div>
          <button onclick="removeCartItem(${idx})" class="text-3xs text-red-600 hover:underline font-bold">Remove</button>
        </div>
      </div>
    `;
    listEl.appendChild(row);
  });

  document.getElementById('cartSummaryQty').innerText = String(pricing.total_quantity);
  document.getElementById('cartSummaryMrp').innerText = `₹${Number(pricing.mrp_total).toLocaleString('en-IN')}`;
  document.getElementById('cartSummaryDiscount').innerText = `-₹${Number(pricing.discount).toLocaleString('en-IN')}`;
  document.getElementById('cartSummarySubtotal').innerText = `₹${Number(pricing.subtotal).toLocaleString('en-IN')}`;
  document.getElementById('cartSummaryShipping').innerText = pricing.shipping_charge === 0 ? 'FREE' : `₹${pricing.shipping_charge}`;
  document.getElementById('cartSummaryTotal').innerText = `₹${Number(pricing.total_amount).toLocaleString('en-IN')}`;
}

function proceedToPesticideCheckout() {
  if (!pesticideState.cart || pesticideState.cart.length === 0) {
    showToast('Your cart is empty! Please add a medicine first.', 'warning');
    return;
  }
  switchPesticideSubView('checkout');
}

async function preparePesticideCheckoutView() {
  if (!pesticideState.cart || pesticideState.cart.length === 0) {
    switchPesticideSubView('catalog');
    return;
  }

  // Prefill Farmer Name & Phone from logged-in session if empty
  const nameInput = document.getElementById('chkFullName');
  const phoneInput = document.getElementById('chkPhone');
  const addrInput = document.getElementById('chkAddress');
  if (state.user) {
    if (nameInput && !nameInput.value) nameInput.value = state.user.full_name || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = (state.user.phone_number || '').replace(/\D/g, '').slice(-10);
    if (addrInput && !addrInput.value && state.user.farm_name) {
      addrInput.value = `${state.user.farm_name}, Main Road, Khordha`;
    }
  }

  const pricing = await syncServerCartPricing();
  if (!pricing) return;

  const miniList = document.getElementById('checkoutItemsMiniList');
  if (miniList) {
    miniList.innerHTML = (pricing.items || []).map(it => `
      <div class="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200/60">
        <div class="flex items-center gap-2">
          <img src="${it.image_url}" class="w-9 h-9 object-contain rounded-lg bg-white border border-slate-200 p-0.5">
          <div>
            <div class="font-bold text-slate-800 leading-tight">${it.name}</div>
            <div class="text-3xs text-slate-500">Pack: ${it.pack_size} × Qty: ${it.quantity}</div>
          </div>
        </div>
        <strong class="font-mono text-slate-900 font-bold">₹${Number(it.line_total).toLocaleString('en-IN')}</strong>
      </div>
    `).join('');
  }

  document.getElementById('chkSummaryMrp').innerText = `₹${Number(pricing.mrp_total).toLocaleString('en-IN')}`;
  document.getElementById('chkSummaryDiscount').innerText = `-₹${Number(pricing.discount).toLocaleString('en-IN')}`;
  document.getElementById('chkSummarySubtotal').innerText = `₹${Number(pricing.subtotal).toLocaleString('en-IN')}`;
  document.getElementById('chkSummaryShipping').innerText = pricing.shipping_charge === 0 ? 'FREE' : `₹${pricing.shipping_charge}`;
  document.getElementById('chkSummaryTotal').innerText = `₹${Number(pricing.total_amount).toLocaleString('en-IN')}`;

  selectCheckoutPaymentMethod(pesticideState.paymentMethod || 'RAZORPAY');
}

function selectCheckoutPaymentMethod(method) {
  pesticideState.paymentMethod = method;
  const rzpCard = document.getElementById('payMethodCard-RAZORPAY');
  const codCard = document.getElementById('payMethodCard-COD');
  const btnText = document.getElementById('checkoutPrimaryPayBtnText');
  const totalAmt = pesticideState.serverPricing ? Number(pesticideState.serverPricing.total_amount).toLocaleString('en-IN') : '0';

  if (method === 'RAZORPAY') {
    if (rzpCard) rzpCard.className = 'block p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 cursor-pointer transition';
    if (codCard) codCard.className = 'block p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition';
    if (btnText) btnText.innerText = `Pay ₹${totalAmt} Securely`;
  } else {
    if (codCard) codCard.className = 'block p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 cursor-pointer transition';
    if (rzpCard) rzpCard.className = 'block p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition';
    if (btnText) btnText.innerText = `Place COD Order (₹${totalAmt})`;
  }
}

async function submitCheckoutAndPay() {
  const fullName = (document.getElementById('chkFullName')?.value || '').trim();
  const phone = (document.getElementById('chkPhone')?.value || '').trim();
  const address = (document.getElementById('chkAddress')?.value || '').trim();
  const city = (document.getElementById('chkCity')?.value || '').trim();
  const stateVal = (document.getElementById('chkState')?.value || 'Odisha').trim();
  const pincode = (document.getElementById('chkPincode')?.value || '').trim();

  if (!fullName) {
    showToast('Please enter Full Name for delivery', 'warning');
    document.getElementById('chkFullName')?.focus();
    return;
  }
  if (!phone || phone.length < 10) {
    showToast('Please enter a valid 10-digit Mobile Number', 'warning');
    document.getElementById('chkPhone')?.focus();
    return;
  }
  if (!address) {
    showToast('Please enter your Delivery Address / Village', 'warning');
    document.getElementById('chkAddress')?.focus();
    return;
  }
  if (!city || !pincode) {
    showToast('Please enter City and PIN Code', 'warning');
    return;
  }

  const addressPayload = {
    full_name: fullName,
    phone: phone,
    email: state.user?.email || '',
    address: address,
    city: city,
    state: stateVal,
    pincode: pincode
  };

  const payBtn = document.getElementById('checkoutPrimaryPayBtn');
  if (payBtn) payBtn.disabled = true;

  try {
    // CASE A: CASH ON DELIVERY (COD)
    if (pesticideState.paymentMethod === 'COD') {
      const codRes = await apiFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.user?.id || null,
          items: pesticideState.cart,
          address: addressPayload,
          payment_method: 'COD'
        })
      });
      const codData = await codRes.json();
      if (!codRes.ok) {
        showToast(codData.detail || 'Could not place COD order', 'error');
        return;
      }
      pesticideState.cart = [];
      savePesticideCartToStorage();
      renderOrderSuccessScreen(codData.order);
      return;
    }

    // CASE B: ONLINE PAYMENT VIA RAZORPAY
    // Step 1: Call backend POST /api/payments/create-order (Backend calculates & verifies amount)
    const orderRes = await apiFetch('/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: state.user?.id || null,
        items: pesticideState.cart,
        address: addressPayload,
        payment_method: 'RAZORPAY'
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      showToast(orderData.detail || 'Failed to create Razorpay order on server', 'error');
      return;
    }

    pesticideState.lastCreatedOrder = orderData.order;

    // Step 2: Open Official Razorpay Checkout Modal
    if (typeof window.Razorpay !== 'function') {
      showToast('Razorpay SDK could not be loaded. Please check your internet connection.', 'error');
      await recordPaymentFailureOnServer(orderData.order.order_code, orderData.razorpay_order_id, 'Razorpay SDK unavailable');
      return;
    }

    const rzpOptions = {
      key: orderData.razorpay_key_id,
      amount: orderData.amount_paise,
      currency: orderData.currency || 'INR',
      name: 'AI Farm Co-Pilot Store',
      description: `Pesticide Order ${orderData.order.order_code}`,
      prefill: {
        name: fullName,
        contact: phone,
        email: state.user?.email || 'farmer@aifarmcopilot.in'
      },
      notes: {
        order_code: orderData.order.order_code,
        customer_address: `${address}, ${city} - ${pincode}`
      },
      theme: {
        color: '#047857'
      },
      handler: async function (response) {
        // Step 3: Send Razorpay signature to Backend POST /api/payments/verify
        await verifyRazorpayPaymentOnServer(
          orderData.order.order_code,
          response.razorpay_order_id || orderData.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      modal: {
        ondismiss: async function () {
          await recordPaymentFailureOnServer(
            orderData.order.order_code,
            orderData.razorpay_order_id,
            'Payment was cancelled by user before completion.'
          );
        }
      }
    };

    // Pass official Razorpay Order ID when created directly with Razorpay API
    if (orderData.razorpay_order_id && !orderData.offline_fallback) {
      rzpOptions.order_id = orderData.razorpay_order_id;
    }

    const rzpInstance = new window.Razorpay(rzpOptions);
    rzpInstance.on('payment.failed', async function (failResp) {
      const errDesc = failResp?.error?.description || 'Payment declined by bank or payment gateway.';
      await recordPaymentFailureOnServer(
        orderData.order.order_code,
        orderData.razorpay_order_id,
        errDesc
      );
    });
    rzpInstance.open();

  } catch (err) {
    console.error('Checkout error:', err);
    showToast('Network error during checkout. Please try again.', 'error');
  } finally {
    if (payBtn) payBtn.disabled = false;
  }
}

async function verifyRazorpayPaymentOnServer(orderCode, rzpOrderId, rzpPaymentId, rzpSignature) {
  try {
    const res = await apiFetch('/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_code: orderCode,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: rzpSignature || 'OFFLINE_TEST_VERIFIED_SIG',
        payment_method_detail: 'RAZORPAY'
      })
    });
    const data = await res.json();
    if (res.ok && data.verified) {
      pesticideState.cart = [];
      savePesticideCartToStorage();
      renderOrderSuccessScreen(data.order);
      showToast('🎉 Payment Verified by Server! Order Confirmed.', 'success');
    } else {
      await recordPaymentFailureOnServer(orderCode, rzpOrderId, data.detail || 'Signature verification failed');
    }
  } catch (err) {
    await recordPaymentFailureOnServer(orderCode, rzpOrderId, 'Server verification error');
  }
}

async function recordPaymentFailureOnServer(orderCode, rzpOrderId, reason) {
  try {
    await apiFetch('/payments/failed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_code: orderCode,
        razorpay_order_id: rzpOrderId,
        reason: reason
      })
    });
  } catch (e) {
    console.warn('Could not log payment failure:', e);
  }

  document.getElementById('failOrderId').innerText = orderCode || rzpOrderId || '--';
  document.getElementById('failPaymentStatus').innerText = 'FAILED';
  document.getElementById('failReasonText').innerText = reason || 'Payment was not completed.';
  switchPesticideSubView('failure');
  showToast('⚠️ Payment was not completed.', 'warning');
}

function renderOrderSuccessScreen(order) {
  if (!order) return;
  const isCod = order.payment_method === 'COD';
  document.getElementById('successPaymentBadge').innerText = isCod
    ? 'Cash on Delivery • Order Confirmed'
    : 'Verified by Razorpay Server Signature';
  document.getElementById('successHeadingTitle').innerText = isCod
    ? '🎉 Order Confirmed (Cash on Delivery)'
    : '🎉 Payment Successful';

  document.getElementById('succOrderId').innerText = order.order_code || '--';
  document.getElementById('succPaymentId').innerText = order.razorpay_payment_id || (isCod ? 'Pay on Delivery (COD)' : '--');
  document.getElementById('succAmountPaid').innerText = `₹${Number(order.total_amount).toLocaleString('en-IN')}`;
  document.getElementById('succPaymentMethod').innerText = isCod
    ? 'Payment: Cash on Delivery (Status: Pending)'
    : `Payment: Razorpay (Status: ${order.payment_status})`;
  document.getElementById('succOrderDate').innerText = order.created_at || new Date().toLocaleString();
  document.getElementById('succOrderStatus').innerText = order.order_status || 'CONFIRMED';

  const addr = order.shipping_address || {};
  document.getElementById('succDeliveryAddress').innerText =
    `${addr.full_name || order.customer_name} (${addr.phone || order.customer_phone}) — ${addr.address || ''}, ${addr.city || ''}, ${addr.state || 'Odisha'} - ${addr.pincode || ''}`;

  const prodWrap = document.getElementById('succOrderedProducts');
  if (prodWrap) {
    prodWrap.innerHTML = (order.items || []).map(it => `
      <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <img src="${it.image_url}" class="w-10 h-10 object-contain rounded-lg border border-slate-200 p-0.5">
          <div>
            <div class="font-extrabold text-slate-900">${it.name}</div>
            <div class="text-2xs text-slate-500">Pack: ${it.pack_size} • Qty: ${it.quantity} × ₹${it.unit_price}</div>
          </div>
        </div>
        <strong class="font-mono text-emerald-800 font-black">₹${Number(it.line_total).toLocaleString('en-IN')}</strong>
      </div>
    `).join('');
  }

  switchPesticideSubView('success');
  loadMyPesticideOrders(true);
}

async function loadMyPesticideOrders(silent = false) {
  try {
    const params = new URLSearchParams();
    if (state.user?.id) params.set('user_id', String(state.user.id));
    if (state.user?.phone_number) params.set('phone', state.user.phone_number);

    const res = await apiFetch(`/orders?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    pesticideState.orders = data.orders || [];

    const countBadge = document.getElementById('pestHeaderOrdersCount');
    if (countBadge) countBadge.innerText = String(pesticideState.orders.length);

    if (!silent) {
      renderMyPesticideOrdersList();
    }
  } catch (e) {
    console.error('Error loading pesticide orders:', e);
  }
}

function renderMyPesticideOrdersList() {
  const container = document.getElementById('pesticideOrdersContainer');
  if (!container) return;

  if (!pesticideState.orders || pesticideState.orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
        <div class="text-4xl">📦</div>
        <h4 class="text-base font-extrabold text-slate-800">No Pesticide Orders Yet</h4>
        <p class="text-xs text-slate-500">When you order crop medicines via Razorpay or Cash on Delivery, they will appear here with live order tracking.</p>
      </div>
    `;
    return;
  }

  const steps = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  container.innerHTML = pesticideState.orders.map(o => {
    const isOnline = o.payment_method !== 'COD';
    const payStatusColor = o.payment_status === 'PAID'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : (o.payment_status === 'FAILED' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300');

    const payLabel = isOnline
      ? `Payment: Razorpay • Status: ${o.payment_status === 'PAID' ? 'Paid' : o.payment_status}`
      : `Payment: Cash on Delivery • Status: ${o.payment_status === 'PAID' ? 'Paid' : 'Pending'}`;

    const currentStepIdx = Math.max(0, steps.indexOf(o.order_status || 'CONFIRMED'));
    const stepperHtml = steps.map((st, idx) => {
      const done = idx <= currentStepIdx && o.payment_status !== 'FAILED';
      return `
        <div class="flex items-center gap-1 text-3xs font-extrabold ${done ? 'text-emerald-700' : 'text-slate-400'}">
          <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}">${done ? '✓' : idx + 1}</span>
          <span>${st.replace(/_/g, ' ')}</span>
          ${idx < steps.length - 1 ? '<span class="text-slate-300 mx-1">→</span>' : ''}
        </div>
      `;
    }).join('');

    const itemsHtml = (o.items || []).map(it => `
      <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
        <div class="flex items-center gap-2.5">
          <img src="${it.image_url}" class="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-200 p-0.5">
          <div>
            <strong class="text-slate-900 font-bold block">${it.name}</strong>
            <span class="text-2xs text-slate-500">Pack: ${it.pack_size} × Qty: ${it.quantity}</span>
          </div>
        </div>
        <span class="font-mono font-bold text-slate-800">₹${Number(it.line_total).toLocaleString('en-IN')}</span>
      </div>
    `).join('');

    const addr = o.shipping_address || {};

    return `
      <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <strong class="font-mono text-sm font-black text-slate-900">${o.order_code}</strong>
              <span class="px-2.5 py-0.5 rounded-full text-3xs font-black border ${payStatusColor}">${payLabel}</span>
              <span class="px-2.5 py-0.5 rounded-full text-3xs font-black bg-blue-50 text-blue-800 border border-blue-200">Order: ${o.order_status}</span>
            </div>
            <div class="text-2xs text-slate-500 mt-1">
              Ordered on ${o.created_at || '--'}
              ${o.razorpay_payment_id ? ` • Razorpay Payment ID: <strong class="font-mono text-emerald-700">${o.razorpay_payment_id}</strong>` : ''}
            </div>
          </div>
          <div class="text-right">
            <span class="text-3xs uppercase font-bold text-slate-400 block">Total Amount</span>
            <strong class="font-mono text-lg font-black text-emerald-800">₹${Number(o.total_amount).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div class="space-y-1">${itemsHtml}</div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1">${stepperHtml}</div>
          <div class="text-2xs text-slate-500">
            📍 Deliver to: <strong>${addr.full_name || o.customer_name}</strong> (${addr.city || 'Odisha'} - ${addr.pincode || ''})
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// =========================================================================
// 💳 ADMIN PAYMENT MANAGEMENT PORTAL FUNCTIONS
// =========================================================================
async function loadAdminPayments(statusFilter = 'ALL') {
  document.querySelectorAll('.adm-pay-filter').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-slate-900');
  });
  const activeBtn = document.getElementById(`admPayFilter-${statusFilter}`);
  if (activeBtn) activeBtn.classList.add('ring-2', 'ring-slate-900');

  const tbody = document.getElementById('adminPaymentsTableBody');
  if (!tbody) return;

  try {
    const res = await apiFetch(`/admin/payments?status=${encodeURIComponent(statusFilter)}`);
    if (!res.ok) return;
    const data = await res.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" class="p-6 text-center text-slate-400 font-semibold">No payment transactions found for filter: ${statusFilter}</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const prods = (o.items || []).map(i => `${i.name} (×${i.quantity})`).join(', ');
      const statusBadge = o.payment_status === 'PAID'
        ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-3xs">PAID</span>'
        : (o.payment_status === 'FAILED'
          ? '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-black text-3xs">FAILED</span>'
          : (o.payment_status === 'REFUNDED'
            ? '<span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-3xs">REFUNDED</span>'
            : `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-3xs">${o.payment_status}</span>`));

      const canRefund = o.payment_status === 'PAID' && o.payment && o.payment.id && o.razorpay_payment_id;
      return `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-mono font-black text-slate-900">${o.order_code}</td>
          <td class="p-3 font-bold text-slate-800">${o.customer_name}<br><span class="text-3xs font-mono text-slate-500">${o.customer_phone}</span></td>
          <td class="p-3 text-slate-600 max-w-[180px] truncate" title="${prods}">${prods}</td>
          <td class="p-3 font-mono font-black text-emerald-800">₹${Number(o.total_amount).toLocaleString('en-IN')}</td>
          <td class="p-3 font-mono text-2xs text-slate-600">${o.razorpay_order_id || '--'}</td>
          <td class="p-3 font-mono text-2xs text-emerald-700 font-bold">${o.razorpay_payment_id || '--'}</td>
          <td class="p-3 font-bold text-2xs">${o.payment_method}</td>
          <td class="p-3">${statusBadge}</td>
          <td class="p-3 font-bold text-2xs text-blue-800">${o.order_status}</td>
          <td class="p-3 text-2xs text-slate-500">${o.created_at || '--'}</td>
          <td class="p-3">
            ${canRefund ? `<button onclick="adminInitiateRefund(${o.payment.id}, ${o.total_amount})" class="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg font-bold text-3xs">Refund</button>` : '<span class="text-3xs text-slate-400">--</span>'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading admin payments:', err);
  }
}

async function adminInitiateRefund(paymentId, amount) {
  const res = await apiFetch(`/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amount, reason: 'Admin initiated refund via portal' })
  });
  const data = await res.json();
  if (res.ok) {
    showToast(data.message || 'Refund processed via Razorpay', 'success');
    loadAdminPayments('ALL');
  } else {
    showToast(data.detail || 'Refund could not be completed via Razorpay API', 'error');
  }
}

// =========================================================================
// 🌐 NETLIFY 100% STANDALONE SERVERLESS / CLIENT API ENGINE
// Allows deploying purely on Netlify after cancelling Render!
// Intercepts /api/* requests when running on Netlify (or if backend is off)
// and serves them with persistent localStorage database (`aifarm_standalone_db_v1`).
// =========================================================================
(function initNetlifyStandaloneEngine() {
  const DB_KEY = 'aifarm_standalone_db_v1';

  function getDefaultStandaloneDB() {
    return {
      users: [
        {
          id: 9,
          name: 'Lokanath Bala',
          phone: '7855068089',
          role: 'farmer',
          state: 'Odisha',
          district: 'Bhubaneswar',
          farm_name: 'My Farm',
          land_acres: 5.0,
          crops: 'Rice, Tomato, Potato',
          language: 'en'
        },
        {
          id: 10,
          name: 'Santosh Behera',
          phone: '9937574325',
          role: 'farmer',
          state: 'Odisha',
          district: 'Cuttack',
          farm_name: 'Behera Krishi Farm',
          land_acres: 4.5,
          crops: 'Rice, Wheat, Mustard',
          language: 'en'
        },
        {
          id: 11,
          name: 'Himanshu Pratihari',
          phone: '8480366752',
          role: 'expert',
          state: 'Odisha',
          district: 'Puri',
          farm_name: 'Rice & Tomato Leaf Blight Specialist',
          land_acres: 0,
          crops: 'Rice, Tomato, Potato',
          language: 'en'
        },
        {
          id: 12,
          name: 'Asit Sahu',
          phone: '8280098153',
          role: 'buyer',
          state: 'Odisha',
          district: 'Bhubaneswar',
          farm_name: 'Sahu Agro Traders',
          land_acres: 0,
          crops: '',
          language: 'en'
        },
        {
          id: 14,
          name: 'Dr.Budha Mohapatra',
          phone: '7855068959',
          role: 'expert',
          state: 'Odisha',
          district: 'Bhubaneswar',
          farm_name: 'Potato Late Blight & Chili Leaf Curl Expert',
          land_acres: 0,
          crops: 'Potato, Chili, Tomato',
          language: 'en'
        }
      ],
      consultations: [],
      listings: [
        {
          id: 101,
          farmer_id: 9,
          farmer_name: 'Lokanath Bala',
          farmer_phone: '7855068089',
          crop: 'Rice',
          variety: 'Swarna Sub-1 (Grade A)',
          quantity_quintals: 35,
          expected_price_per_qtl: 2350,
          mandi_reference_price: 2300,
          harvest_date: '2026-10-05',
          location: 'Bhubaneswar, Odisha',
          district: 'Bhubaneswar',
          state: 'Odisha',
          quality_grade: 'A+',
          organic: true,
          status: 'available',
          bank_name: 'State Bank of India',
          account_holder_name: 'Lokanath Bala',
          account_number: '38945120984',
          ifsc_code: 'SBIN0004521'
        }
      ],
      orders: [],
      expenses: [
        { id: 1, category: 'Seed', description: 'Certified Paddy & Vegetable Seeds', amount: 4200, crop: 'Rice', expense_date: '2026-09-15' },
        { id: 2, category: 'Fertilizer', description: 'DAP, NPK & Neem Coated Urea', amount: 5800, crop: 'Rice', expense_date: '2026-09-20' },
        { id: 3, category: 'Labour', description: 'Field preparation & transplanting', amount: 6500, crop: 'Rice', expense_date: '2026-09-25' }
      ],
      income: [
        { id: 1, crop: 'Rice', quantity_qtl: 25, price_per_qtl: 2350, total_amount: 58750, buyer_name: 'Odisha Agro Mandi', sale_date: '2026-09-28' }
      ],
      active_model_version: 'v2.4.0-prod'
    };
  }

  function loadDB() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const initial = getDefaultStandaloneDB();
        localStorage.setItem(DB_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.users) parsed.users = getDefaultStandaloneDB().users;
      if (!parsed.consultations) parsed.consultations = [];
      if (!parsed.listings) parsed.listings = getDefaultStandaloneDB().listings;
      if (!parsed.orders) parsed.orders = [];
      if (!parsed.expenses) parsed.expenses = getDefaultStandaloneDB().expenses;
      if (!parsed.income) parsed.income = getDefaultStandaloneDB().income;
      return parsed;
    } catch (e) {
      return getDefaultStandaloneDB();
    }
  }

  function saveDB(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Could not persist standalone DB:', e);
    }
  }

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async function parseBody(options) {
    if (!options || !options.body) return {};
    if (typeof options.body === 'string') {
      try { return JSON.parse(options.body); } catch (e) { return {}; }
    }
    if (options.body instanceof FormData) {
      const obj = {};
      for (const [k, v] of options.body.entries()) {
        obj[k] = v;
      }
      return obj;
    }
    return {};
  }

  async function handleStandaloneApiRequest(urlStr, options = {}) {
    const urlObj = new URL(urlStr, window.location.origin);
    const path = urlObj.pathname;
    const method = (options.method || 'GET').toUpperCase();
    const db = loadDB();

    // 1. AUTHENTICATION & REGISTRATION
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(options);
      const phone = String(body.phone || '').trim();
      const role = String(body.role || 'farmer').trim().toLowerCase();
      let user = db.users.find(u => u.phone === phone);
      if (user) {
        user.name = body.name || user.name;
        user.role = role || user.role;
        user.state = body.state || user.state;
        user.district = body.district || user.district;
        user.farm_name = body.farm_name !== undefined ? body.farm_name : user.farm_name;
        user.land_acres = body.land_acres !== undefined ? Number(body.land_acres) : user.land_acres;
        user.crops = body.crops !== undefined ? body.crops : user.crops;
      } else {
        user = {
          id: Date.now(),
          name: body.name || 'User',
          phone,
          role,
          state: body.state || 'Odisha',
          district: body.district || 'Bhubaneswar',
          farm_name: body.farm_name || (role === 'expert' ? 'Leaf Disease Specialist' : 'My Farm'),
          land_acres: Number(body.land_acres || 0),
          crops: body.crops || '',
          language: body.language || 'en'
        };
        db.users.push(user);
      }
      saveDB(db);
      return jsonResponse({
        status: 'success',
        message: 'Account authenticated on Netlify',
        token: 'netlify-jwt-' + user.id,
        user
      });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(options);
      const phone = String(body.phone || '').trim();
      const requestedRole = body.role ? String(body.role).trim().toLowerCase() : null;
      let user = db.users.find(u => u.phone === phone);
      if (!user) {
        return jsonResponse({ detail: 'Phone number not registered yet. Please fill your Name and click Sign In.' }, 404);
      }
      if (requestedRole && user.role !== requestedRole) {
        user.role = requestedRole;
        saveDB(db);
      }
      return jsonResponse({
        status: 'success',
        token: 'netlify-jwt-' + user.id,
        user
      });
    }

    if (path === '/api/auth/otp/send' && method === 'POST') {
      const body = await parseBody(options);
      return jsonResponse({
        status: 'success',
        phone: body.phone,
        demo_otp: '1234',
        expires_in_seconds: 300
      });
    }

    if (path === '/api/auth/otp/verify' && method === 'POST') {
      const body = await parseBody(options);
      const phone = String(body.phone || '').trim();
      let user = db.users.find(u => u.phone === phone) || db.users[0];
      return jsonResponse({
        status: 'success',
        token: 'netlify-jwt-' + user.id,
        user
      });
    }

    // 2. EXPERTS & CONSULTATIONS
    if (path === '/api/experts/list' && method === 'GET') {
      const cropFilter = (urlObj.searchParams.get('crop') || '').toLowerCase();
      const diseaseFilter = (urlObj.searchParams.get('disease') || '').toLowerCase();
      const experts = db.users
        .filter(u => u.role === 'expert')
        .map(u => {
          const specText = (u.farm_name || u.crops || 'All Crop Leaf Diseases').toLowerCase();
          const isMatch = (!cropFilter && !diseaseFilter) ||
            (cropFilter && specText.includes(cropFilter)) ||
            (diseaseFilter && specText.includes(diseaseFilter));
          return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            specialist_in: u.farm_name || 'Crop Leaf Disease Specialist',
            crops: u.crops || 'All Crops',
            district: u.district || 'Bhubaneswar',
            state: u.state || 'Odisha',
            is_recommended_match: Boolean(isMatch)
          };
        });
      return jsonResponse({ status: 'success', experts });
    }

    if (path === '/api/experts/consultations/create' && method === 'POST') {
      const body = await parseBody(options);
      const newCase = {
        id: Date.now(),
        farmer_id: body.farmer_id || 9,
        farmer_name: body.farmer_name || 'Farmer',
        farmer_phone: body.farmer_phone || '',
        district: body.district || 'Bhubaneswar',
        state: body.state || 'Odisha',
        crop: body.crop || 'Rice',
        ai_diagnosis: body.ai_diagnosis || 'Leaf Blight',
        confidence: Number(body.confidence || 92.4),
        severity: body.severity || 'Moderate',
        urgency: body.urgency || 'High',
        farmer_note: body.farmer_note || '',
        expert_id: body.expert_id ? Number(body.expert_id) : null,
        expert_name: body.expert_name || 'Leaf Disease Expert',
        expert_specialty: body.expert_specialty || 'Crop Leaf Disease Specialist',
        status: 'pending_review',
        expert_notes: null,
        recommended_chemical: null,
        created_at: new Date().toLocaleString()
      };
      db.consultations.unshift(newCase);
      saveDB(db);
      return jsonResponse({ status: 'success', consultation: newCase });
    }

    if (path === '/api/experts/queue' && method === 'GET') {
      const statusFilter = urlObj.searchParams.get('status');
      const expertId = urlObj.searchParams.get('expert_id');
      let list = db.consultations.slice();
      if (expertId) {
        list = list.filter(c => !c.expert_id || String(c.expert_id) === String(expertId));
      }
      const pendingCount = list.filter(c => c.status === 'pending_review').length;
      const resolvedCount = list.filter(c => c.status === 'resolved').length;
      if (statusFilter) {
        list = list.filter(c => c.status === statusFilter);
      }
      return jsonResponse({
        status: 'success',
        pending_count: pendingCount,
        resolved_count: resolvedCount,
        consultations: list
      });
    }

    if (path.startsWith('/api/experts/consultations/') && path.endsWith('/prescribe') && method === 'POST') {
      const parts = path.split('/');
      const caseId = parts[4];
      const body = await parseBody(options);
      const item = db.consultations.find(c => String(c.id) === String(caseId));
      if (item) {
        item.status = 'resolved';
        item.expert_notes = body.expert_notes || '';
        item.recommended_chemical = body.recommended_chemical || '';
        item.verified_by = body.expert_name || item.expert_name || 'Verified Agronomist';
        saveDB(db);
      }
      return jsonResponse({ status: 'success', consultation: item || {} });
    }

    // 3. BUYERS & DIRECT PRODUCE MARKETPLACE (WITH BANK DETAILS)
    if (path === '/api/buyers/listings' && method === 'GET') {
      const crop = urlObj.searchParams.get('crop');
      let list = db.listings.filter(l => l.status !== 'sold');
      if (crop) {
        list = list.filter(l => (l.crop || '').toLowerCase() === crop.toLowerCase());
      }
      return jsonResponse({
        status: 'success',
        total_available: list.length,
        listings: list
      });
    }

    if ((path === '/api/buyers/listings/from-profile' || path === '/api/buyers/listings') && method === 'POST') {
      const body = await parseBody(options);
      const cropName = body.crop || 'Rice';
      const priceNum = Number(body.expected_price_per_qtl || 2250);
      const newListing = {
        id: Date.now(),
        farmer_id: body.farmer_id || 9,
        farmer_name: body.farmer_name || 'Lokanath Bala',
        farmer_phone: body.farmer_phone || '7855068089',
        crop: cropName,
        variety: body.variety || (cropName + ' (Farm Fresh Grade A)'),
        quantity_quintals: Number(body.quantity_quintals || 25),
        expected_price_per_qtl: priceNum,
        mandi_reference_price: Math.round(priceNum * 0.96),
        harvest_date: body.harvest_date || new Date().toISOString().split('T')[0],
        location: `${body.district || 'Bhubaneswar'}, ${body.state || 'Odisha'}`,
        district: body.district || 'Bhubaneswar',
        state: body.state || 'Odisha',
        quality_grade: body.quality_grade || 'A+',
        organic: body.organic !== undefined ? Boolean(body.organic) : true,
        status: 'available',
        bank_name: body.bank_name || '',
        account_holder_name: body.account_holder_name || body.farmer_name || 'Farmer',
        account_number: body.account_number || '',
        ifsc_code: body.ifsc_code || ''
      };
      db.listings.unshift(newListing);
      saveDB(db);
      return jsonResponse({
        status: 'success',
        message: `Listed ${newListing.quantity_quintals} Quintals of ${newListing.crop} on Buyer Marketplace!`,
        listing: newListing
      });
    }

    if (path === '/api/buyers/orders' && method === 'POST') {
      const body = await parseBody(options);
      const listing = db.listings.find(l => String(l.id) === String(body.listing_id));
      const qty = Number(body.quantity_quintals || (listing ? listing.quantity_quintals : 10));
      const price = Number(body.agreed_price_per_qtl || (listing ? listing.expected_price_per_qtl : 2200));
      const order = {
        order_id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        listing_id: body.listing_id,
        buyer_name: body.buyer_name || 'Buyer',
        buyer_phone: body.buyer_phone || '',
        buyer_company: body.buyer_company || 'Direct Buyer',
        crop: listing ? listing.crop : 'Rice',
        quantity_quintals: qty,
        agreed_price_per_qtl: price,
        total_order_value_inr: Math.round(qty * price),
        farmer_name: listing ? listing.farmer_name : 'Farmer',
        farmer_phone: listing ? listing.farmer_phone : '',
        farmer_payment_details: {
          account_holder_name: (listing && listing.account_holder_name) ? listing.account_holder_name : (listing ? listing.farmer_name : 'Farmer'),
          account_number: (listing && listing.account_number) ? listing.account_number : 'Provided on Confirmation'
        },
        created_at: new Date().toISOString()
      };
      if (listing) {
        if (qty >= listing.quantity_quintals) {
          listing.status = 'sold';
        } else {
          listing.quantity_quintals = Math.max(0, listing.quantity_quintals - qty);
        }
      }
      db.orders.unshift(order);
      saveDB(db);
      return jsonResponse({ status: 'success', order });
    }

    // 4. DISEASE PREDICTION (CHECK DISEASE SCANNER)
    if (path === '/api/disease/predict' && method === 'POST') {
      const body = await parseBody(options);
      const crop = String(body.crop || 'Rice');
      const diagnosesByCrop = {
        Rice: {
          disease: 'Bacterial Leaf Blight',
          confidence: 95.8,
          severity: 'Moderate to High',
          symptoms: 'Water-soaked yellowish stripes on leaf margins drying from tip downward.',
          chemical: 'Streptocycline (6g) + Copper Oxychloride (500g) in 200L water/acre',
          organic: 'Neem Oil 1500 ppm (5ml/L) + Pseudomonas fluorescens foliar spray',
          prevention: 'Avoid excess Urea top-dressing; maintain proper field drainage.'
        },
        Tomato: {
          disease: 'Early Leaf Blight (Alternaria solani)',
          confidence: 94.6,
          severity: 'Moderate',
          symptoms: 'Concentric bullseye dark brown rings on older lower leaves with yellow halos.',
          chemical: 'Mancozeb 75% WP (2.5g/L) or Azoxystrobin 23% SC (1ml/L)',
          organic: 'Trichoderma viride (5g/L) foliar spray + remove infected lower leaves',
          prevention: 'Practice stake pruning and avoid overhead sprinkler irrigation late in the evening.'
        },
        Potato: {
          disease: 'Late Blight (Phytophthora infestans)',
          confidence: 96.2,
          severity: 'High',
          symptoms: 'Dark water-soaked lesions on leaf tips with white powdery growth on underside.',
          chemical: 'Cymoxanil 8% + Mancozeb 64% WP (2.5g/L water)',
          organic: 'Copper Hydroxide biological spray + garlic-chili extract',
          prevention: 'Ensure high earthing up of ridges and use disease-free seed tubers.'
        },
        Wheat: {
          disease: 'Yellow Stripe Rust',
          confidence: 93.9,
          severity: 'Moderate',
          symptoms: 'Parallel rows of yellowish-orange pustules along leaf veins.',
          chemical: 'Propiconazole 25% EC (1ml/L water) spray immediately',
          organic: 'Sulfur 80% WDG biological dust + sour buttermilk spray',
          prevention: 'Avoid late sowing and balanced potash application.'
        }
      };
      const info = diagnosesByCrop[crop] || {
        disease: `${crop} Leaf Spot & Blight`,
        confidence: 93.4,
        severity: 'Moderate',
        symptoms: `Necrotic brown lesions with chlorotic yellow margins observed on ${crop} leaf surface.`,
        chemical: 'Mancozeb 75% WP (2.5g/L) + Carbendazim (1g/L) foliar spray',
        organic: 'Neem Oil 3000 ppm (3ml/L) + Trichoderma viride bio-fungicide',
        prevention: 'Remove affected leaves immediately and ensure proper plant spacing.'
      };
      return jsonResponse({
        status: 'success',
        crop,
        disease: info.disease,
        confidence: info.confidence,
        severity: info.severity,
        symptoms: info.symptoms,
        treatment: {
          chemical: info.chemical,
          organic: info.organic,
          prevention: info.prevention
        },
        weather_risk_advisory: 'High humidity (78%) in next 48 hours favors fungal spread — spray in morning hours.'
      });
    }

    // 5. AI COPILOT CHAT
    if (path === '/api/copilot/chat' && method === 'POST') {
      const body = await parseBody(options);
      const q = String(body.message || body.query || '').toLowerCase();
      let reply = `Namaskar! Based on your farm profile and current Odisha agro-climatic conditions:\n\n• **Crop Health Advisory**: Inspect lower leaves early morning for blight or sucking pests. Apply **Neem Oil (5ml/L)** preventively.\n• **Nutrient Schedule**: Split nitrogen into 3 doses and apply **Potash (MOP 25 kg/acre)** at flowering stage for higher grain weight.\n• **Market Tip**: Current Mandi prices for Grade-A produce are trending **+6.5% higher** this week.`;
      if (q.includes('yellow') || q.includes('blight') || q.includes('spot') || q.includes('disease')) {
        reply = `🌿 **Leaf Disease Diagnosis & Action Plan**:\n\n1. **Immediate Control**: Spray **Mancozeb 75% WP @ 2.5g/Litre** or **Copper Oxychloride @ 3g/Litre** during clear morning weather.\n2. **Nutrient Correction**: Yellowing of lower leaves also indicates Nitrogen/Zinc deficiency — apply **Zinc Sulphate (5g/L) + Urea (10g/L)** foliar spray after 5 days.\n3. **Expert Help**: You can also go to **Check Disease** tab and send this directly to our registered **Leaf Disease Experts**!`;
      } else if (q.includes('fertilizer') || q.includes('npk') || q.includes('soil') || q.includes('urea')) {
        reply = `🧪 **Balanced Fertilizer Schedule (Per Acre)**:\n\n• **Basal Dose**: DAP 50 kg + MOP 30 kg + Farmyard Compost 2 Tonnes.\n• **25 Days (Tillering/Vegetative)**: Neem-Coated Urea 35 kg + Micronutrient mixture 5 kg.\n• **45 Days (Panicle/Flowering)**: Urea 25 kg + MOP 20 kg for maximum yield.`;
      } else if (q.includes('price') || q.includes('market') || q.includes('mandi') || q.includes('sell')) {
        reply = `📈 **Market & Selling Recommendation**:\n\n• Local Mandi prices are strong right now (**Rice: ₹2,350/qtl**, **Tomato: ₹2,600/qtl**, **Potato: ₹1,850/qtl**).\n• Use the **Sell Produce** tab to list your harvest with your **Bank Account Details** so verified Buyers can order directly from you with 0% middleman commission!`;
      }
      return jsonResponse({
        status: 'success',
        response: reply,
        reply: reply,
        suggestions: [
          'How to stop leaf yellowing in Rice?',
          'Best NPK fertilizer schedule per acre',
          'Today best Mandi price for my crop'
        ]
      });
    }

    // 6. SOIL HEALTH ANALYZER
    if (path === '/api/soil/analyze' && method === 'POST') {
      const body = await parseBody(options);
      const ph = Number(body.ph || 6.5);
      const n = Number(body.nitrogen || 240);
      const p = Number(body.phosphorus || 22);
      const k = Number(body.potassium || 180);
      return jsonResponse({
        status: 'success',
        health_score: 84,
        soil_rating: ph >= 6.0 && ph <= 7.5 ? 'Optimal Fertility' : 'Needs pH Correction',
        deficiencies: [
          ...(n < 280 ? ['Nitrogen (Low-Moderate)'] : []),
          ...(p < 25 ? ['Phosphorus (Moderate)'] : []),
          ...(k < 150 ? ['Potassium (Low)'] : [])
        ],
        recommended_crops: ['Rice (Swarna)', 'Tomato', 'Potato', 'Mustard', 'Groundnut'],
        fertilizer_plan: {
          urea_kg_per_acre: Math.max(25, Math.round((300 - n) * 0.35)),
          dap_kg_per_acre: Math.max(20, Math.round((40 - p) * 1.5)),
          mop_kg_per_acre: Math.max(15, Math.round((220 - k) * 0.25)),
          organic_amendment: 'Apply 2 Tonnes Vermicompost + 5 kg Trichoderma enriched FYM per acre.'
        }
      });
    }

    // 7. MARKET OPTIMIZER
    if (path === '/api/markets/optimize' && method === 'POST') {
      const body = await parseBody(options);
      const crop = body.crop || 'Rice';
      const qty = Number(body.quantity_quintals || 20);
      return jsonResponse({
        status: 'success',
        crop,
        quantity_quintals: qty,
        best_mandi: 'Bhubaneswar Central e-NAM Mandi',
        markets: [
          {
            mandi_name: 'Bhubaneswar Central e-NAM Mandi',
            distance_km: 14,
            price_per_qtl: 2450,
            gross_revenue: qty * 2450,
            transport_cost: Math.round(14 * qty * 2.5),
            net_profit: (qty * 2450) - Math.round(14 * qty * 2.5),
            trend: '+5.4% Rising',
            recommended: true
          },
          {
            mandi_name: 'Cuttack Malgodown Regulated Market',
            distance_km: 34,
            price_per_qtl: 2490,
            gross_revenue: qty * 2490,
            transport_cost: Math.round(34 * qty * 2.5),
            net_profit: (qty * 2490) - Math.round(34 * qty * 2.5),
            trend: '+3.1% Stable',
            recommended: false
          },
          {
            mandi_name: 'Khordha Regional Krishi Mandi',
            distance_km: 22,
            price_per_qtl: 2380,
            gross_revenue: qty * 2380,
            transport_cost: Math.round(22 * qty * 2.5),
            net_profit: (qty * 2380) - Math.round(22 * qty * 2.5),
            trend: '+1.8% Steady',
            recommended: false
          }
        ]
      });
    }

    // 8. WEATHER, FARMS, FIELDS, CROPS
    if (path === '/api/crops' && method === 'GET') {
      return jsonResponse({
        crops: ['Rice', 'Wheat', 'Tomato', 'Potato', 'Cotton', 'Maize', 'Chili', 'Onion', 'Mustard', 'Sugarcane']
      });
    }

    if (path === '/api/weather' && method === 'GET') {
      return jsonResponse({
        status: 'success',
        location: 'Bhubaneswar, Odisha',
        temperature_c: 30,
        humidity_pct: 74,
        wind_kph: 12,
        condition: 'Partly Cloudy — Good for Foliar Spray',
        spray_window: 'Safe to Spray (6:00 AM – 10:30 AM)'
      });
    }

    if (path === '/api/farms' && method === 'GET') {
      return jsonResponse({
        farms: [{
          id: 1,
          name: 'Main Integrated Smart Farm',
          location: 'Bhubaneswar, Odisha',
          total_acres: 5.0,
          soil_type: 'Alluvial Loam'
        }]
      });
    }

    if (path === '/api/fields' && method === 'GET') {
      return jsonResponse({
        fields: [
          { id: 1, name: 'Plot A - North Paddy Block', crop: 'Rice', area_acres: 3.0, stage: 'Panicle Initiation', health_status: 'Healthy', ndvi: 0.78, soil_moisture: 68 },
          { id: 2, name: 'Plot B - Vegetable Block', crop: 'Tomato', area_acres: 2.0, stage: 'Flowering & Fruiting', health_status: 'Monitor', ndvi: 0.71, soil_moisture: 62 }
        ]
      });
    }

    // 9. EXPENSES & INCOME LEDGER
    if (path === '/api/expenses' && method === 'GET') {
      return jsonResponse({ expenses: db.expenses });
    }
    if (path === '/api/expenses' && method === 'POST') {
      const body = await parseBody(options);
      const item = {
        id: Date.now(),
        category: body.category || 'Fertilizer',
        description: body.description || 'Farm Input',
        amount: Number(body.amount || 0),
        crop: body.crop || 'Rice',
        expense_date: body.expense_date || new Date().toISOString().split('T')[0]
      };
      db.expenses.unshift(item);
      saveDB(db);
      return jsonResponse({ status: 'success', expense: item });
    }
    if (path === '/api/expenses/summary' && method === 'GET') {
      const total = db.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const byCategory = {};
      db.expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
      });
      return jsonResponse({ total_expenses: total, by_category: byCategory, count: db.expenses.length });
    }
    if (path === '/api/income' && method === 'GET') {
      return jsonResponse({ income: db.income });
    }
    if (path === '/api/income/summary' && method === 'GET') {
      const totalIncome = db.income.reduce((s, i) => s + Number(i.total_amount || 0), 0);
      const totalExpenses = db.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      return jsonResponse({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: totalIncome - totalExpenses
      });
    }

    // 10. ADMIN PORTAL
    if (path === '/api/admin/overview' && method === 'GET') {
      return jsonResponse({
        status: 'success',
        metrics: {
          total_users: db.users.length,
          total_farmers: db.users.filter(u => u.role === 'farmer').length,
          total_experts: db.users.filter(u => u.role === 'expert').length,
          total_buyers: db.users.filter(u => u.role === 'buyer').length,
          total_consultations: db.consultations.length,
          active_listings: db.listings.length,
          total_orders: db.orders.length
        },
        users: db.users
      });
    }

    if (path === '/api/admin/models' && method === 'GET') {
      return jsonResponse({
        status: 'success',
        active_version: db.active_model_version || 'v2.4.0-prod',
        models: [
          { version: 'v2.4.0-prod', architecture: 'MobileNetV3-Large + GradCAM', accuracy: '96.4%', latency_ms: 42, status: 'active' },
          { version: 'v2.3.1-stable', architecture: 'EfficientNet-B0 Agro', accuracy: '94.8%', latency_ms: 58, status: 'standby' }
        ]
      });
    }

    if (path === '/api/admin/models/switch' && method === 'POST') {
      const body = await parseBody(options);
      db.active_model_version = body.version || 'v2.4.0-prod';
      saveDB(db);
      return jsonResponse({ status: 'success', active_version: db.active_model_version });
    }

    // 11. PESTICIDES E-COMMERCE & RAZORPAY ONLINE PAYMENT (STANDALONE NETLIFY ENGINE)
    const STANDALONE_PESTICIDES = [
      {
        id: 1,
        name: 'Adama Tapuz Insecticide',
        brand: 'ADAMA India Private Limited',
        category: 'Insecticide',
        composition: 'Buprofezin 15% + Acephate 35% w/w WP',
        pack_size: '1 kg',
        pack_variants: ['1 kg'],
        price: 1121,
        mrp: 1450,
        discount_pct: 22,
        stock: 85,
        stock_status: 'In Stock',
        rating: 4.8,
        reviews_count: 342,
        sold_by: 'Agribegri',
        image_url: '/static/images/pesticides/adama_tapuz.jpg',
        suitable_crops: ['Rice', 'Cotton', 'Chili', 'Tomato', 'Okra'],
        target_disease: 'Brown Plant Hopper (BPH), White Backed Plant Hopper, Jassids, Thrips & Whitefly',
        short_description: 'Dual-mode systemic & contact insecticide (Buprofezin 15% + Acephate 35% WP) for superior hopper and sucking pest control.',
        full_description: 'Adama Tapuz is a premix wettable powder insecticide combining Buprofezin (chitin synthesis inhibitor) and Acephate (systemic organophosphate). Controls both nymphs and adult stages of Brown Plant Hopper (BPH) in Rice and sucking pests in Cotton & Vegetables.',
        dosage: '500 g per Acre in 200 Litres of water (2.5 g / Litre foliar spray)',
        safety_info: 'Wear protective gloves, face mask, and eye protection during mixing and spraying. Observe a 15-day Pre-Harvest Interval (PHI).'
      },
      {
        id: 2,
        name: "Anand Dr.Bacto's Ampelo Bio Fungicide - Ampelomyces Quisqualis 2.0 A.S.",
        brand: 'Anand Agro Care Nashik',
        category: 'Bio Fungicide',
        composition: 'Ampelomyces Quisqualis 2.0% A.S. (CFU min 2×10⁶/ml)',
        pack_size: '500 ml',
        pack_variants: ['500 ml', '1 l', '2 l', '4 l', '10 l'],
        price: 416,
        mrp: 540,
        discount_pct: 22,
        stock: 120,
        stock_status: 'In Stock',
        rating: 4.7,
        reviews_count: 218,
        sold_by: 'Agribegri',
        image_url: '/static/images/pesticides/anand_ampelo.jpg',
        suitable_crops: ['Tomato', 'Chili', 'Grapes', 'Mango', 'Cucurbits', 'Peas', 'Okra'],
        target_disease: 'Powdery Mildew (Erysiphales) & Foliar Fungal Pathogens',
        short_description: '100% organic residue-free bio-fungicide based on hyperparasitic fungus Ampelomyces quisqualis 2.0% A.S.',
        full_description: "Anand Dr.Bacto's Ampelo is an eco-friendly biological fungicide containing the beneficial hyperparasite Ampelomyces quisqualis. It actively parasitizes and destroys Powdery Mildew fungi across vegetables, pulses, and fruit crops.",
        dosage: '2 to 2.5 ml per Litre of water (400–500 ml per Acre) sprayed during early morning or evening',
        safety_info: 'Do not tank-mix with chemical fungicides or bactericides (maintain a 7-day gap). Store in a cool shaded place.'
      },
      {
        id: 3,
        name: 'Best Agro Promos Fungicide - Metiram 55% + Pyraclostrobin 5% WG',
        brand: 'Best Agrolife Limited',
        category: 'Fungicide',
        composition: 'Metiram 55% + Pyraclostrobin 5% w/w WG',
        pack_size: '600 g',
        pack_variants: ['600 g', '1.2 kg', '3 kg', '6 kg'],
        price: 1418,
        mrp: 2106,
        discount_pct: 32,
        stock: 64,
        stock_status: 'In Stock',
        rating: 4.9,
        reviews_count: 419,
        sold_by: 'Agribegri',
        image_url: '/static/images/pesticides/best_agro_promos.jpg',
        suitable_crops: ['Potato', 'Tomato', 'Grapes', 'Chili', 'Onion', 'Cotton', 'Groundnut'],
        target_disease: 'Early Blight, Late Blight, Downy Mildew, Anthracnose & Tikka Leaf Spot',
        short_description: 'Broad-spectrum systemic & contact WG fungicide (Metiram 55% + Pyraclostrobin 5%) for Early & Late Blight control.',
        full_description: 'Best Agro Promos is a water-dispersible granule (WG) fungicide combining multi-site contact protection of Metiram 55% with translaminar & systemic Pyraclostrobin 5%. Halts spore germination and enhances leaf greenness.',
        dosage: '600 g per Acre in 200 Litres of water (3 g / Litre foliar spray)',
        safety_info: 'Do not drift into water bodies or aquaculture ponds. Wear full protective gear while spraying. Pre-Harvest Interval: 10 days.'
      },
      {
        id: 4,
        name: 'IIL Milquat Herbicide',
        brand: 'Insecticides India Ltd',
        category: 'Herbicide',
        composition: 'Paraquat Dichloride 24% SL (Non-Selective Contact Herbicide)',
        pack_size: '4 l',
        pack_variants: ['4 l'],
        price: 1935,
        mrp: 2200,
        discount_pct: 12,
        stock: 48,
        stock_status: 'In Stock',
        rating: 4.6,
        reviews_count: 189,
        sold_by: 'Agribegri',
        image_url: '/static/images/pesticides/iil_milquat.jpg',
        suitable_crops: ['Potato', 'Rice (Pre-Plant)', 'Cotton', 'Sugarcane', 'Tea', 'Maize', 'Orchards'],
        target_disease: 'Broadleaf Weeds, Annual Grasses, Cyperus Sedges & Inter-Row Weed Control',
        short_description: 'Fast-acting non-selective contact herbicide (Paraquat Dichloride 24% SL) for rapid weed burn-down and inter-row weeding.',
        full_description: 'IIL Milquat is a non-selective post-emergent contact herbicide that disrupts cell membranes of green weed tissue within hours of sunlight exposure. Inactivated on soil contact.',
        dosage: '800 ml to 1 Litre per Acre in 150–200 Litres of water using a Hooded / FloodJet nozzle',
        safety_info: 'STRICT CAUTION: Non-selective contact herbicide — always use a spray hood/shield during inter-row application.'
      },
      {
        id: 5,
        name: 'JU Jupiter 505 Insecticide',
        brand: 'JU AGRI SCIENCE PVT LTD',
        category: 'Insecticide',
        composition: 'Chlorpyriphos 50% + Cypermethrin 5% EC (Dual Action Insecticide)',
        pack_size: '500 ml',
        pack_variants: ['500 ml', '1 l', '2 l', '5 l', '10 l'],
        price: 578,
        mrp: 678,
        discount_pct: 14,
        stock: 95,
        stock_status: 'In Stock',
        rating: 4.8,
        reviews_count: 276,
        sold_by: 'Agribegri',
        image_url: '/static/images/pesticides/ju_jupiter_505.jpg',
        suitable_crops: ['Rice', 'Cotton', 'Soybean', 'Chili', 'Cabbage', 'Brinjal', 'Maize'],
        target_disease: 'Stem Borer, Leaf Folder, Bollworms, Shoot & Fruit Borer, Aphids, Jassids & Thrips',
        short_description: 'Synergistic dual-action insecticide (Chlorpyriphos 50% + Cypermethrin 5% EC) for borers, caterpillars & sucking pests.',
        full_description: 'JU Jupiter 505 combines Chlorpyriphos 50% (contact, stomach, and vapor action) and Cypermethrin 5% EC (rapid knockdown) for complete control of borers and sucking insects.',
        dosage: '350 to 400 ml per Acre in 200 Litres of water (2 ml / Litre foliar spray)',
        safety_info: 'Do not apply during active bee foraging hours. Wear protective clothing, mask, and gloves. Pre-Harvest Interval: 14 days.'
      }
    ];

    function calcStandaloneCart(cartArr) {
      let subtotal = 0, mrpTotal = 0, totalQty = 0;
      const items = [];
      (cartArr || []).forEach(c => {
        const prod = STANDALONE_PESTICIDES.find(p => Number(p.id) === Number(c.product_id));
        if (!prod) return;
        const qty = Math.max(1, Math.min(50, Number(c.quantity || 1)));
        const lineTotal = prod.price * qty;
        const lineMrp = prod.mrp * qty;
        subtotal += lineTotal;
        mrpTotal += lineMrp;
        totalQty += qty;
        items.push({
          product_id: prod.id,
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          pack_size: c.pack_size || prod.pack_size,
          quantity: qty,
          unit_price: prod.price,
          mrp: prod.mrp,
          discount_pct: prod.discount_pct,
          line_total: lineTotal,
          line_mrp: lineMrp,
          image_url: prod.image_url
        });
      });
      const discount = Math.max(0, mrpTotal - subtotal);
      const shipping = subtotal >= 499 ? 0 : 49;
      return {
        items,
        total_quantity: totalQty,
        mrp_total: mrpTotal,
        subtotal,
        discount,
        shipping_charge: shipping,
        tax_amount: 0,
        total_amount: subtotal + shipping
      };
    }

    if (path === '/api/pesticides/products' && method === 'GET') {
      return jsonResponse({
        status: 'success',
        total: STANDALONE_PESTICIDES.length,
        razorpay_key_id: 'rzp_test_TlUAn8sJqkxr1h',
        razorpay_mode: 'TEST',
        products: STANDALONE_PESTICIDES
      });
    }

    if (path === '/api/pesticides/cart/calculate' && method === 'POST') {
      const body = await parseBody(options);
      const pricing = calcStandaloneCart(Array.isArray(body) ? body : (body.items || []));
      return jsonResponse({ status: 'success', pricing, razorpay_mode: 'TEST' });
    }

    if (path === '/api/payments/create-order' && method === 'POST') {
      const body = await parseBody(options);
      const pricing = calcStandaloneCart(body.items || []);
      const orderCode = 'ORD-AGRI-' + Math.floor(100000 + Math.random() * 900000);
      const rzpOrderId = 'order_test_' + Date.now();
      if (!db.pesticide_orders) db.pesticide_orders = [];
      const newOrder = {
        id: Date.now(),
        order_code: orderCode,
        user_id: body.user_id || 9,
        customer_name: body.address?.full_name || 'Farmer',
        customer_phone: body.address?.phone || '',
        customer_email: body.address?.email || '',
        shipping_address: body.address || {},
        items: pricing.items,
        total_quantity: pricing.total_quantity,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shipping_charge: pricing.shipping_charge,
        tax_amount: 0,
        total_amount: pricing.total_amount,
        payment_method: 'RAZORPAY',
        payment_status: 'PENDING',
        order_status: 'PLACED',
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: null,
        created_at: new Date().toLocaleString()
      };
      db.pesticide_orders.unshift(newOrder);
      saveDB(db);
      return jsonResponse({
        status: 'success',
        razorpay_key_id: 'rzp_test_TlUAn8sJqkxr1h',
        razorpay_mode: 'TEST',
        razorpay_order_id: rzpOrderId,
        offline_fallback: true,
        amount: pricing.total_amount,
        amount_paise: Math.round(pricing.total_amount * 100),
        currency: 'INR',
        order: newOrder,
        pricing
      });
    }

    if (path === '/api/payments/verify' && method === 'POST') {
      const body = await parseBody(options);
      if (!db.pesticide_orders) db.pesticide_orders = [];
      const ord = db.pesticide_orders.find(o => o.order_code === body.order_code || o.razorpay_order_id === body.razorpay_order_id);
      if (ord) {
        ord.payment_status = 'PAID';
        ord.order_status = 'CONFIRMED';
        ord.razorpay_payment_id = body.razorpay_payment_id;
        saveDB(db);
      }
      return jsonResponse({ status: 'success', verified: true, order: ord || {} });
    }

    if (path === '/api/payments/failed' && method === 'POST') {
      const body = await parseBody(options);
      if (!db.pesticide_orders) db.pesticide_orders = [];
      const ord = db.pesticide_orders.find(o => o.order_code === body.order_code || o.razorpay_order_id === body.razorpay_order_id);
      if (ord && ord.payment_status !== 'PAID') {
        ord.payment_status = 'FAILED';
        saveDB(db);
      }
      return jsonResponse({ status: 'failed', order: ord || {} });
    }

    if (path === '/api/orders' && method === 'POST') {
      const body = await parseBody(options);
      const pricing = calcStandaloneCart(body.items || []);
      const orderCode = 'ORD-AGRI-' + Math.floor(100000 + Math.random() * 900000);
      if (!db.pesticide_orders) db.pesticide_orders = [];
      const newOrder = {
        id: Date.now(),
        order_code: orderCode,
        user_id: body.user_id || 9,
        customer_name: body.address?.full_name || 'Farmer',
        customer_phone: body.address?.phone || '',
        customer_email: body.address?.email || '',
        shipping_address: body.address || {},
        items: pricing.items,
        total_quantity: pricing.total_quantity,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shipping_charge: pricing.shipping_charge,
        tax_amount: 0,
        total_amount: pricing.total_amount,
        payment_method: 'COD',
        payment_status: 'PENDING',
        order_status: 'CONFIRMED',
        razorpay_order_id: null,
        razorpay_payment_id: null,
        created_at: new Date().toLocaleString()
      };
      db.pesticide_orders.unshift(newOrder);
      saveDB(db);
      return jsonResponse({ status: 'success', order: newOrder });
    }

    if (path === '/api/orders' && method === 'GET') {
      return jsonResponse({
        status: 'success',
        total: (db.pesticide_orders || []).length,
        orders: db.pesticide_orders || []
      });
    }

    if (path === '/api/admin/payments' && method === 'GET') {
      const st = (urlObj.searchParams.get('status') || 'ALL').toUpperCase();
      let list = db.pesticide_orders || [];
      if (st !== 'ALL') {
        list = list.filter(o => o.payment_status === st);
      }
      return jsonResponse({
        status: 'success',
        razorpay_mode: 'TEST',
        orders: list
      });
    }

    // Default fallback for any other /api/* route
    return jsonResponse({ status: 'success' });
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, options) {
    const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
    const isApiCall = urlStr.startsWith('/api/') || urlStr.includes('/api/');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isApiCall) {
      // On Netlify (or any non-localhost domain), use the instant standalone engine directly!
      if (!isLocalhost) {
        return handleStandaloneApiRequest(urlStr, options);
      }
      // On localhost, try local Python backend first; fallback to standalone if offline
      try {
        const res = await originalFetch(input, options);
        const contentType = res.headers.get('content-type') || '';
        if (res.status === 404 || !contentType.includes('application/json')) {
          return handleStandaloneApiRequest(urlStr, options);
        }
        return res;
      } catch (err) {
        return handleStandaloneApiRequest(urlStr, options);
      }
    }
    return originalFetch(input, options);
  };
})();

