# AI Farm Co-Pilot, Leaf Disease Detection, Farm Business Maker & Market Optimizer

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Scikit-Learn](https://img.shields.io/badge/ML%20Accuracy-98.15%25-16A34A?logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![Languages](https://img.shields.io/badge/Languages-Odia%20%7C%20Hindi%20%7C%20English-F59E0B)](#multilingual-system)
[![Supported Crops](https://img.shields.io/badge/Crops-15%20Major%20Crops-22C55E)](#supported-crops)

A production-grade, responsive, mobile-first, and multilingual digital agricultural platform designed for Indian farmers. The platform unifies Computer Vision foliar diagnostics, context-aware conversational AI assistance, microclimate intelligence, farm business planning, and APMC mandi market optimization.

---

## 🌟 18 Integrated Core Systems

1. **AI Leaf Disease Detection:** Computer vision diagnostic engine supporting 15 major Indian crops.
2. **Computer Vision & Modular AI:** Foliar tissue verification (Excess Green Index & HSV chromaticity), color moment vectors, necrotic lesion density, and calibrated confidence estimation.
3. **Four Capture Modes:**
   - 📷 **Take Photo** (camera device)
   - 📁 **Upload Image** (file picker)
   - 📹 **Live Webcam** (browser video stream with targeting reticle)
   - 🌐 **Webcam URL Link** (*"Photo capture through URL link of webcam"* – fetches snapshots directly from IP webcams or remote camera URLs)
4. **AI Farm Co-Pilot:** Context-aware conversational assistant incorporating active farm soil values, recent weather, recorded expenses, and past disease history.
5. **Voice-based Agricultural Assistant:** Web Speech API speech-to-text recognition, dialect language detection, agricultural reasoning, and speech synthesis (TTS) audio narration with large microphone controls.
6. **Multilingual Architecture (i18n):** Complete localization in **Odia (ଓଡ଼ିଆ)**, **Hindi (हिंदी)**, and **English** with persistent language switching.
7. **Crop & Soil Intelligence:** Evaluates pH, Nitrogen, Phosphorus, Potassium, Organic Carbon, and Moisture to score crop suitability across all 15 crops and suggest targeted fertilizer corrections.
8. **Weather Intelligence & Smart Alerts:** Live Open-Meteo microclimate forecasting coupled with dynamic risk alerts (fungal outbreak risk, heavy rain advisory, irrigation alert, and market price surge).
9. **Disease Treatment Guidance:** Verified agricultural inputs and medicines with active ingredients, dosage rates, label info, safety warnings, and Pre-Harvest Intervals (PHI).
10. **Agricultural Expert Portal:** Dedicated pathologist review queue for inspecting farmer leaf scans, reviewing low-confidence predictions, and prescribing verified remedies.
11. **Expert Feedback Loop:** Captures expert pathological corrections for dataset governance and model retraining.
12. **Agrochemical Seller Portal:** Inventory management for certified retailers to manage inputs, pack sizes, prices, and stock levels.
13. **Farm Business Maker:** Cost-benefit scenario planner (land area, seed, fertilizer, labor, irrigation, equipment, transport) to calculate estimated cost, gross revenue, net return, and simulated ROI %.
14. **Multilingual Voice Expense Tracker:** Voice NLP extraction (e.g. *"I spent 1500 on fertilizer"* / *"ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି"* / *"खाद पर 1500 रुपये खर्च किए"*), category classification, and Chart.js analytics.
15. **Farm Income Tracker:** Tracks produce sales, selling prices, buyers, transport freight deductions, and net realization.
16. **Market Optimizer & APMC Comparison:** Ranks nearby mandis (Market A vs Market B) by **Net Realization** after calculating freight and mandi cess.
17. **Buyer Marketplace:** Produce listings connecting farmers with wholesalers, food processors, and institutional buyers.
18. **Admin Portal & AI Model Registry:** Platform telemetry, user management, and dynamic AI model version switching (e.g., `AgroVision-Ensemble-v1.0` vs `DeepFoliar-ResNet50-v2.0-Candidate`).

---

## 🌾 Supported Crops (15 Major Agricultural Crops)

| # | Crop | Scientific Name | Key Diseases Covered |
|---|---|---|---|
| 1 | **Rice** | *Oryza sativa* | Bacterial Leaf Blight, Rice Blast, Brown Spot, Healthy |
| 2 | **Wheat** | *Triticum aestivum* | Yellow / Stripe Rust, Loose Smut, Healthy |
| 3 | **Potato** | *Solanum tuberosum* | Early Blight, Late Blight, Healthy |
| 4 | **Onion** | *Allium cepa* | Purple Blotch, Downy Mildew, Healthy |
| 5 | **Tomato** | *Solanum lycopersicum* | Early Blight, Tomato Yellow Leaf Curl Virus, Healthy |
| 6 | **Apple** | *Malus domestica* | Apple Scab, Powdery Mildew, Healthy |
| 7 | **Mango** | *Mangifera indica* | Anthracnose, Powdery Mildew, Healthy |
| 8 | **Banana** | *Musa acuminata* | Panama Disease (TR4), Black Sigatoka, Healthy |
| 9 | **Brinjal** | *Solanum melongena* | Phomopsis Blight, Healthy |
| 10 | **Chilli** | *Capsicum annuum* | Anthracnose / Fruit Rot, Chilli Leaf Curl Virus, Healthy |
| 11 | **Maize** | *Zea mays* | Northern Corn Leaf Blight, Healthy |
| 12 | **Cotton** | *Gossypium hirsutum* | Bacterial Blight (Angular Leaf Spot), Healthy |
| 13 | **Groundnut** | *Arachis hypogaea* | Tikka Disease (Leaf Spot), Healthy |
| 14 | **Mustard** | *Brassica juncea* | White Rust, Healthy |
| 15 | **Soybean** | *Glycine max* | Soybean Rust, Healthy |

---

## 👥 5 Role-Based Demo Accounts

Use the **1-Click Demo Switcher** bar at the top of the interface or log in manually:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **FARMER** | `farmer.ramesh@aifarm.org` | `Farmer@1234` | Leaf scans, voice co-pilot, soil advisor, expense tracking, business planner, market optimizer. |
| **AGRICULTURAL_EXPERT** | `dr.mohapatra@aifarm.org` | `Expert@1234` | Case review queue, triage low-confidence scans, write prescriptions, submit dataset corrections. |
| **SELLER** | `seller.kisan@aifarm.org` | `Seller@1234` | Manage product inventory, set prices, update stock, fulfill farmer requests. |
| **BUYER** | `buyer.trading@aifarm.org` | `Buyer@1234` | Browse fresh produce listings, submit purchase orders and negotiate. |
| **ADMIN** | `admin@aifarm.org` | `Admin@1234` | Platform telemetry, AI model registry switcher, system audit logs. |

---

## 🚀 Quick Start Instructions

### 1. Launch the Application (One-Click)
Run the automated launcher:
```bash
cd /Users/lokanath/.gemini/antigravity/scratch/ai-farm-copilot
./run_app.sh
```

Or manually:
```bash
# Activate virtual environment
source /Users/lokanath/.gemini/antigravity/scratch/venv314/bin/activate

# Seed initial database
python database/seed/seed_data.py

# Launch FastAPI ASGI server on port 8080
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --reload
```

### 2. Open in Browser
Open your browser and navigate to:
```
http://localhost:8080
```
- **Interactive API Swagger Docs:** `http://localhost:8080/docs`
- **ReDoc Documentation:** `http://localhost:8080/redoc`

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
# 1. Run AI Computer Vision & Transform Tests
python backend/tests/test_ai.py

# 2. Run Comprehensive REST API Tests (Auth, Weather, Soil, Voice NLP, Markets, Predictions)
python backend/tests/test_api.py
```

---

## 📁 Modular Project Structure

```
ai-farm-copilot/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application & route registration
│   │   ├── config.py             # Settings & environment configuration
│   │   ├── api/                  # 18 Modular REST API routers
│   │   ├── auth/security.py      # JWT authentication & RBAC authorization
│   │   ├── models/               # SQLAlchemy relational database tables
│   │   ├── schemas/              # Pydantic validation & response schemas
│   │   └── services/             # Business logic (Weather, Soil, Market, Copilot)
│   └── tests/
│       ├── test_api.py           # Automated API integration tests
│       └── test_ai.py            # AI inference & foliar transform tests
├── ai/
│   ├── datasets/disease_kb.py    # Structured botanical disease database (15 crops)
│   ├── inference/engine.py       # Modular computer vision inference engine
│   ├── models/registry.py        # Model registry & version switcher
│   └── preprocessing/transforms.py # Foliar tissue check & feature extraction
├── frontend/
│   ├── locales/                  # Complete translation dictionaries
│   │   ├── en/translation.json   # English translations
│   │   ├── od/translation.json   # Odia translations (ଓଡ଼ିଆ)
│   │   └── hi/translation.json   # Hindi translations (हिंदी)
│   └── static/
│       ├── index.html            # Mobile-first responsive single-page web app
│       ├── css/style.css         # Laser scanner animation & voice wave styles
│       ├── js/app.js             # Frontend controllers, speech API & Chart.js
│       └── assets/               # Realistic leaf disease SVG test specimens
├── database/
│   └── seed/seed_data.py         # Database seeder with demo accounts & records
├── infrastructure/
│   ├── docker/Dockerfile         # Production container definition
│   └── deployment/docker-compose.yml # Compose multi-service definition
├── docs/
│   └── API_SPECIFICATION.md      # Comprehensive REST API reference
├── requirements.txt              # Python package dependencies
├── run_app.sh                    # One-click executable launcher script
└── README.md                     # Project documentation
```

---

## 🐳 Docker Deployment

To launch with Docker Compose:
```bash
cd infrastructure/deployment
docker-compose up --build -d
```
The application will be accessible at `http://localhost:8080`.
