# REST API Specification & Architecture Guide

## Platform: AI Farm Co-Pilot & Market Optimizer
- **Base URL:** `http://localhost:8080/api`
- **Interactive Swagger Documentation:** `http://localhost:8080/docs`
- **ReDoc Documentation:** `http://localhost:8080/redoc`

---

## 1. Authentication & Role Authorization (`/api/auth`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/auth/register` | POST | Public | Register new user with optional farmer/expert profile |
| `/auth/token` | POST | Public | OAuth2 form login returning JWT access token |
| `/auth/login` | POST | Public | JSON login endpoint returning token & user details |
| `/auth/me` | GET | Authenticated | Retrieve current user profile and role |

### Supported Roles:
- `FARMER`
- `AGRICULTURAL_EXPERT`
- `SELLER`
- `BUYER`
- `ADMIN`

---

## 2. Farm & Field Management (`/api/farms`, `/api/fields`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/farms` | GET | Farmer, Admin | List farms registered to current farmer |
| `/farms` | POST | Farmer, Admin | Create a new farm with GPS coordinates and soil type |
| `/farms/{id}` | GET | Farmer, Admin | Farm details with attached fields and history |
| `/fields` | GET | Farmer, Admin | List individual fields/plots with current health badges |
| `/fields` | POST | Farmer, Admin | Create new field with crop, growth stage, irrigation |
| `/fields/{id}/status`| PUT | Farmer, Admin | Update visual health status (`healthy`, `attention`, `disease_risk`, `water_stress`) |

---

## 3. Leaf Disease Detection & Computer Vision (`/api/disease`)

### `POST /api/disease/predict`
Executes foliar leaf disease prediction.

**Supported Input Modalities:**
1. `image`: Binary file upload (`multipart/form-data`)
2. `image_base64`: Base64 encoded snapshot from browser webcam
3. `webcam_url`: **URL link to IP webcam or remote camera snapshot feed**

**Request Fields (multipart/form-data):**
- `crop` (string): Selected crop name (e.g. "Tomato", "Rice", "Potato")
- `farm_id` (optional int): Linked farm ID
- `field_id` (optional int): Linked field ID
- `image` (optional file): Leaf photo
- `image_base64` (optional string): Live webcam frame
- `webcam_url` (optional string): Direct URL link of webcam

**Response Schema:**
```json
{
  "prediction_id": 1,
  "crop": "Tomato",
  "disease": "Early Blight",
  "confidence": 0.94,
  "severity": "Moderate",
  "image_url": "/uploads/leaves/abc123_leaf.jpg",
  "symptoms": "Dark brown circular spots with concentric target rings...",
  "possible_causes": "Warm temperatures (24-29°C) and alternating humid wet periods.",
  "prevention": "Prune lower leaves, avoid overhead irrigation, practice crop rotation.",
  "management": "Destroy blighted foliage residues immediately.",
  "treatment_guidance": [
    {
      "treatment_type": "Chemical",
      "product_name": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
      "active_ingredient": "Azoxystrobin + Difenoconazole",
      "dosage": "1.0 ml / Litre of water",
      "guidance": "Foliar mist covering both leaf surfaces.",
      "safety_warning": "Pre-harvest interval: 5 days. Wear protective mask.",
      "pre_harvest_interval_days": 5
    }
  ],
  "needs_expert_review": false,
  "model_version": "AgroVision-Ensemble-v1.0",
  "is_reviewed_by_expert": false,
  "created_at": "2026-09-26T00:15:00"
}
```

---

## 4. Conversational AI Farm Co-Pilot (`/api/copilot`)

### `POST /api/copilot/chat`
Context-aware conversational assistant responding in English, Odia, or Hindi.

**Request:**
```json
{
  "message": "My tomato leaves are turning yellow",
  "language": "en",
  "farm_id": 1
}
```

**Context Injected by Backend:**
- Active farm soil parameters (pH, N, P, K)
- Live weather (temperature, humidity, rainfall)
- Recent disease history
- Recorded expenses

---

## 5. Weather Intelligence & Smart Alerts (`/api/weather`)

### `GET /api/weather`
Fetches live Open-Meteo forecasts for farm coordinates and generates dynamic agricultural alerts:
- **Disease Risk Alert:** Triggers when humidity > 80% and temp 20-30°C.
- **Precipitation Advisory:** Triggers when expected rainfall > 10 mm.
- **Evapotranspiration Alert:** Triggers during heatwaves and low moisture.

---

## 6. Soil Intelligence (`/api/soil`)

- `POST /api/soil/analyze`: Evaluates pH, N, P, K, organic carbon, moisture, and returns crop suitability index for all 15 crops.
- `POST /api/soil/test`: Records soil test and recommendations for a farm.

---

## 7. Farm Business Maker & Expenses (`/api/business`, `/api/expenses`, `/api/income`)

- `POST /api/business/calculate`: Simulates crop cost, expected revenue, and net ROI %.
- `POST /api/expenses/parse-voice`: Multilingual NLP voice extraction:
  - English: `"I spent 1500 on fertilizer"` -> `{"amount": 1500, "category": "Fertilizer"}`
  - Odia: `"ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି"` -> `{"amount": 1500, "category": "Fertilizer"}`
  - Hindi: `"खाद पर 1500 रुपये खर्च किए"` -> `{"amount": 1500, "category": "Fertilizer"}`
- `GET /api/expenses/summary`: Total expenses and category distribution.
- `POST /api/income`: Record harvest sales with freight deduction and net realization.

---

## 8. Market Optimizer (`/api/markets`)

### `POST /api/markets/optimize`
Calculates transparent Net Realization across regional APMC Mandis:
$$\text{Net Realization} = (\text{Quantity} \times \text{Modal Price}) - \text{Transport Freight} - \text{Mandi Cess}$$

Ranks mandis and highlights the **Highest Net Profit** option.

---

## 9. Specialized Portals
- **Agricultural Expert Portal:** `/api/experts/queue`, `/api/experts/consultations/{id}/prescribe`, `/api/experts/corrections`
- **Seller Input Store:** `/api/sellers/products`, `/api/sellers/products/{id}/stock`
- **Admin Model Registry:** `/api/admin/overview`, `/api/admin/models`, `/api/admin/models/switch`
