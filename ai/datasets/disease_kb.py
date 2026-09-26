"""
Comprehensive Botanical Knowledge Base for 15 Major Agricultural Crops.
Standardized across ICAR, OUAT, and international plant pathology compendiums.
"""

CROPS_METADATA = {
    "Rice": {
        "scientific_name": "Oryza sativa",
        "category": "Cereal",
        "optimal_temp_min": 20.0,
        "optimal_temp_max": 35.0,
        "optimal_humidity_min": 70.0,
        "optimal_humidity_max": 90.0,
        "water_requirement_mm": 1200.0,
        "growth_duration_days": 125
    },
    "Wheat": {
        "scientific_name": "Triticum aestivum",
        "category": "Cereal",
        "optimal_temp_min": 12.0,
        "optimal_temp_max": 25.0,
        "optimal_humidity_min": 50.0,
        "optimal_humidity_max": 75.0,
        "water_requirement_mm": 450.0,
        "growth_duration_days": 120
    },
    "Potato": {
        "scientific_name": "Solanum tuberosum",
        "category": "Tuber / Vegetable",
        "optimal_temp_min": 15.0,
        "optimal_temp_max": 24.0,
        "optimal_humidity_min": 65.0,
        "optimal_humidity_max": 85.0,
        "water_requirement_mm": 500.0,
        "growth_duration_days": 95
    },
    "Onion": {
        "scientific_name": "Allium cepa",
        "category": "Vegetable / Bulb",
        "optimal_temp_min": 13.0,
        "optimal_temp_max": 28.0,
        "optimal_humidity_min": 55.0,
        "optimal_humidity_max": 75.0,
        "water_requirement_mm": 400.0,
        "growth_duration_days": 110
    },
    "Tomato": {
        "scientific_name": "Solanum lycopersicum",
        "category": "Vegetable / Solanaceae",
        "optimal_temp_min": 18.0,
        "optimal_temp_max": 30.0,
        "optimal_humidity_min": 60.0,
        "optimal_humidity_max": 80.0,
        "water_requirement_mm": 600.0,
        "growth_duration_days": 105
    },
    "Apple": {
        "scientific_name": "Malus domestica",
        "category": "Fruit / Temperate",
        "optimal_temp_min": 10.0,
        "optimal_temp_max": 25.0,
        "optimal_humidity_min": 60.0,
        "optimal_humidity_max": 80.0,
        "water_requirement_mm": 800.0,
        "growth_duration_days": 160
    },
    "Mango": {
        "scientific_name": "Mangifera indica",
        "category": "Fruit / Tropical",
        "optimal_temp_min": 24.0,
        "optimal_temp_max": 38.0,
        "optimal_humidity_min": 50.0,
        "optimal_humidity_max": 85.0,
        "water_requirement_mm": 900.0,
        "growth_duration_days": 150
    },
    "Banana": {
        "scientific_name": "Musa acuminata",
        "category": "Fruit / Tropical",
        "optimal_temp_min": 22.0,
        "optimal_temp_max": 35.0,
        "optimal_humidity_min": 75.0,
        "optimal_humidity_max": 95.0,
        "water_requirement_mm": 1500.0,
        "growth_duration_days": 300
    },
    "Brinjal": {
        "scientific_name": "Solanum melongena",
        "category": "Vegetable / Solanaceae",
        "optimal_temp_min": 20.0,
        "optimal_temp_max": 32.0,
        "optimal_humidity_min": 55.0,
        "optimal_humidity_max": 75.0,
        "water_requirement_mm": 550.0,
        "growth_duration_days": 120
    },
    "Chilli": {
        "scientific_name": "Capsicum annuum",
        "category": "Spice / Vegetable",
        "optimal_temp_min": 20.0,
        "optimal_temp_max": 32.0,
        "optimal_humidity_min": 50.0,
        "optimal_humidity_max": 75.0,
        "water_requirement_mm": 500.0,
        "growth_duration_days": 130
    },
    "Maize": {
        "scientific_name": "Zea mays",
        "category": "Cereal",
        "optimal_temp_min": 18.0,
        "optimal_temp_max": 32.0,
        "optimal_humidity_min": 55.0,
        "optimal_humidity_max": 80.0,
        "water_requirement_mm": 550.0,
        "growth_duration_days": 100
    },
    "Cotton": {
        "scientific_name": "Gossypium hirsutum",
        "category": "Cash / Fibre",
        "optimal_temp_min": 21.0,
        "optimal_temp_max": 35.0,
        "optimal_humidity_min": 50.0,
        "optimal_humidity_max": 75.0,
        "water_requirement_mm": 700.0,
        "growth_duration_days": 160
    },
    "Groundnut": {
        "scientific_name": "Arachis hypogaea",
        "category": "Oilseed / Legume",
        "optimal_temp_min": 22.0,
        "optimal_temp_max": 32.0,
        "optimal_humidity_min": 50.0,
        "optimal_humidity_max": 70.0,
        "water_requirement_mm": 450.0,
        "growth_duration_days": 115
    },
    "Mustard": {
        "scientific_name": "Brassica juncea",
        "category": "Oilseed",
        "optimal_temp_min": 12.0,
        "optimal_temp_max": 25.0,
        "optimal_humidity_min": 45.0,
        "optimal_humidity_max": 70.0,
        "water_requirement_mm": 350.0,
        "growth_duration_days": 105
    },
    "Soybean": {
        "scientific_name": "Glycine max",
        "category": "Legume / Oilseed",
        "optimal_temp_min": 20.0,
        "optimal_temp_max": 32.0,
        "optimal_humidity_min": 60.0,
        "optimal_humidity_max": 85.0,
        "water_requirement_mm": 600.0,
        "growth_duration_days": 105
    }
}

DISEASE_DATABASE = {
    # 1. RICE
    "Rice": {
        "Bacterial Leaf Blight": {
            "scientific_name": "Xanthomonas oryzae pv. oryzae",
            "disease_type": "Bacterial",
            "symptoms": "Water-soaked stripes starting from leaf tips and margins, later enlarging and turning yellowish-white with wavy margins.",
            "visual_symptoms": "Yellow to straw-colored lesions along leaf margins with wavy borders. Bacterial ooze droplets during humid mornings.",
            "possible_causes": "High humidity (>85%), warm temperatures (25-34°C), excess nitrogen application, and typhoon/monsoon wind rainstorms.",
            "risk_factors": "Submerged flooding, overhead irrigation, uncertified seeds.",
            "prevention": "Use resistant cultivars (Swarna-Sub1, Pooja), balanced fertilization with split potash, avoid water stagnation.",
            "management": "Drain excess standing water from the field. Avoid nitrogen top dressing during active infection.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Streptomycin Sulphate + Tetracycline (90:10)",
                    "active_ingredient": "Streptocycline",
                    "dosage": "6 g per 50 Litres of water + Copper Oxychloride @ 50 g",
                    "guidance": "Foliar spray in early morning. Ensure thorough coverage of leaf canopy.",
                    "safety_warning": "Wear protective gear. Pre-harvest interval: 15 days.",
                    "pre_harvest_interval_days": 15
                },
                {
                    "treatment_type": "Biological",
                    "product_name": "Pseudomonas fluorescens 1.5% WP",
                    "active_ingredient": "Pseudomonas fluorescens",
                    "dosage": "2.5 kg/ha foliar spray or seed treatment @ 10 g/kg",
                    "guidance": "Prophylactic bio-spray before disease onset to induce systemic resistance.",
                    "safety_warning": "Safe for beneficial insects and pollinators.",
                    "pre_harvest_interval_days": 0
                }
            ]
        },
        "Rice Blast": {
            "scientific_name": "Magnaporthe oryzae",
            "disease_type": "Fungal",
            "symptoms": "Spindle-shaped or eye-shaped lesions with grey or whitish centers and brown margins on leaves, nodes, and panicles.",
            "visual_symptoms": "Spindle-shaped elliptical lesions with pointed ends.",
            "possible_causes": "Prolonged leaf wetness (>9 hours), night temperatures around 20-22°C, high relative humidity (>90%).",
            "risk_factors": "Over-fertilization with urea, dense planting.",
            "prevention": "Seed treatment with Tricyclazole 75 WP @ 2g/kg seed. Maintain optimal planting distance.",
            "management": "Avoid application of nitrogenous fertilizers. Maintain shallow water depth.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Tricyclazole 75% WP",
                    "active_ingredient": "Tricyclazole",
                    "dosage": "0.6 g / Litre of water (120 g / acre)",
                    "guidance": "Spray at first appearance of leaf spots. Repeat after 12-14 days if wet weather continues.",
                    "safety_warning": "PHI: 21 days. Do not graze livestock in treated fields.",
                    "pre_harvest_interval_days": 21
                }
            ]
        },
        "Brown Spot": {
            "scientific_name": "Bipolaris oryzae",
            "disease_type": "Fungal",
            "symptoms": "Small, circular to oval dark brown spots on leaves, glumes, and coleoptiles. Lesions may coalesce.",
            "visual_symptoms": "Cinnamon-brown oval spots with yellow halo surrounding the dark center.",
            "possible_causes": "Nutrient-depleted soils, silica and potash deficiency, drought stress followed by high humidity.",
            "risk_factors": "Poorly fertilized rainfed fields, light sandy soils.",
            "prevention": "Soil testing, application of farmyard manure (FYM), balanced NPK + Zinc.",
            "management": "Apply foliar potassium spray (1% KCl) to strengthen plant cell walls.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Mancozeb 75% WP",
                    "active_ingredient": "Mancozeb",
                    "dosage": "2.5 g / Litre of water",
                    "guidance": "Apply at early tillering and panicle initiation stages.",
                    "safety_warning": "Wear protective gloves. PHI: 14 days.",
                    "pre_harvest_interval_days": 14
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "No visible lesions, uniform vibrant green foliar tissue, healthy vein structure.",
            "visual_symptoms": "Clear green blades, upright turgid leaves, absence of necrotic margins.",
            "possible_causes": "Balanced nutrition, optimal irrigation, good crop protection practices.",
            "risk_factors": "None currently detected.",
            "prevention": "Continue standard crop calendar, scout regularly for stem borer and blast.",
            "management": "Maintain balanced micronutrient sprays (Zinc & Boron) at tillering.",
            "treatments": []
        }
    },

    # 2. WHEAT
    "Wheat": {
        "Yellow Rust": {
            "scientific_name": "Puccinia striiformis f. sp. tritici",
            "disease_type": "Fungal",
            "symptoms": "Yellow-orange pustules arranged in distinct narrow parallel linear stripes along leaf blades.",
            "visual_symptoms": "Stripe-like lines of powdery yellow pustules that wipe off onto fingers.",
            "possible_causes": "Cool moist weather (10-18°C), persistent dew or light drizzling rain.",
            "risk_factors": "Susceptible varieties, northern foothill climates, early sowing in fog-prone zones.",
            "prevention": "Grow rust-resistant cultivars (HD 2967, DBW 187, PBW 550).",
            "management": "Eradicate alternate host plants and volunteer wheat along field borders.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Propiconazole 25% EC",
                    "active_ingredient": "Propiconazole",
                    "dosage": "1.0 ml / Litre of water (200 ml / acre in 200L water)",
                    "guidance": "Spray immediately when first yellow pustules appear on flag leaves.",
                    "safety_warning": "PHI: 30 days. Toxic to aquatic life; prevent runoff into ponds.",
                    "pre_harvest_interval_days": 30
                }
            ]
        },
        "Loose Smut": {
            "scientific_name": "Ustilago tritici",
            "disease_type": "Fungal",
            "symptoms": "Entire wheat ear converted into a black powdery mass of fungal spores covered by a delicate silvery membrane.",
            "visual_symptoms": "Black sooty spikes, naked rachis remaining after spores blow away.",
            "possible_causes": "Internally seed-borne pathogen dormant inside the seed embryo.",
            "risk_factors": "Planting saved uncertified seed from previously infected crop.",
            "prevention": "Solar heat seed treatment in May-June or chemical seed dressing with Carboxin.",
            "management": "Rogue out and burn infected smutted heads inside plastic bags before spores disperse.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Carboxin 37.5% + Thiram 37.5% WS",
                    "active_ingredient": "Carboxin + Thiram",
                    "dosage": "2.5 g / kg seed",
                    "guidance": "Pre-sowing seed treatment only. Thoroughly mix with damp seed.",
                    "safety_warning": "Treated seed must never be used for food, feed, or oil purposes.",
                    "pre_harvest_interval_days": 90
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Uniform erect tillers, healthy dark green flag leaves, normal spike emergence.",
            "visual_symptoms": "Vigorous foliage free of pustules or necrotic lesions.",
            "possible_causes": "Favorable winter temperatures, proper nitrogen split, optimal crown root irrigation.",
            "risk_factors": "None currently.",
            "prevention": "Ensure timely irrigation at CRI (Crown Root Initiation) and boot stages.",
            "management": "Monitor weekly for aphid buildup and powdery mildew.",
            "treatments": []
        }
    },

    # 3. POTATO
    "Potato": {
        "Early Blight": {
            "scientific_name": "Alternaria solani",
            "disease_type": "Fungal",
            "symptoms": "Target-board or concentric circular ring lesions on older lower leaves first, spreading upwards.",
            "visual_symptoms": "Dark brown to black concentric rings resembling a target board with yellow chlorotic halo.",
            "possible_causes": "Alternating dry and humid warm conditions (24-29°C), stressed or senescent foliage.",
            "risk_factors": "Nitrogen or potassium deficiency, overhead sprinkler irrigation.",
            "prevention": "Crop rotation with non-solanaceous crops, avoid sprinkler irrigation late in the evening.",
            "management": "Remove lower infected foliage. Ensure balanced potash nutrition.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Chlorothalonil 75% WP",
                    "active_ingredient": "Chlorothalonil",
                    "dosage": "2.0 g / Litre of water",
                    "guidance": "Apply as soon as concentric spots appear on bottom canopy leaves.",
                    "safety_warning": "PHI: 14 days. Avoid inhalation; use respirator mask.",
                    "pre_harvest_interval_days": 14
                }
            ]
        },
        "Late Blight": {
            "scientific_name": "Phytophthora infestans",
            "disease_type": "Oomycete / Water Mold",
            "symptoms": "Large, irregular water-soaked spots on leaf tips and margins, rapidly turning black and necrotic.",
            "visual_symptoms": "Rapid blighting, white cottony mildew growth visible on leaf undersides in morning dew.",
            "possible_causes": "Cool moist weather (15-20°C, RH >90%), persistent rainfall, fog, cloud cover.",
            "risk_factors": "Uncertified seed tubers, microclimate dampness in dense plant canopy.",
            "prevention": "Use certified disease-free seed tubers (Kufri Pukhraj, Kufri Jyoti), earthing up high.",
            "management": "Cut and burn haulms (foliage) if severe infection occurs 10 days before tuber digging.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Metalaxyl 8% + Mancozeb 64% WP",
                    "active_ingredient": "Metalaxyl + Mancozeb",
                    "dosage": "2.5 g / Litre of water",
                    "guidance": "Curative systemic spray. Spray thoroughly under and over leaf surfaces.",
                    "safety_warning": "PHI: 14 days. Maximum 2 consecutive applications to avoid resistance.",
                    "pre_harvest_interval_days": 14
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Lush compound leaves, deep green canopy, turgid stems, healthy tuber formation.",
            "visual_symptoms": "Intact leaf blades, no chlorosis or necrosis.",
            "possible_causes": "Adequate soil organic matter, controlled drip irrigation, balanced NPK.",
            "risk_factors": "None currently.",
            "prevention": "Maintain soil ridge height to prevent sun-greening of tubers.",
            "management": "Apply preventive copper spray if relative humidity exceeds 85% for 48 hours.",
            "treatments": []
        }
    },

    # 4. ONION
    "Onion": {
        "Purple Blotch": {
            "scientific_name": "Alternaria porri",
            "disease_type": "Fungal",
            "symptoms": "Sunken, elliptical or lens-shaped lesions on leaves and seed stalks with purplish centers and yellow borders.",
            "visual_symptoms": "Distinct purple cast in the center of necrotic tan lesions.",
            "possible_causes": "Warm humid weather (21-30°C, RH 80-90%), frequent showers or overhead irrigation.",
            "risk_factors": "Thrips feeding injuries that create entry wounds for the fungus.",
            "prevention": "Control onion thrips using blue sticky traps, practice 3-year crop rotation.",
            "management": "Avoid overhead sprinkler irrigation; switch to drip or furrow irrigation.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Difenoconazole 25% EC",
                    "active_ingredient": "Difenoconazole",
                    "dosage": "1.0 ml / Litre of water with sticker (Sandovit @ 0.5 ml/L)",
                    "guidance": "Apply with a wetting agent/sticker because onion leaves have waxy cuticles.",
                    "safety_warning": "PHI: 15 days.",
                    "pre_harvest_interval_days": 15
                }
            ]
        },
        "Downy Mildew": {
            "scientific_name": "Peronospora destructor",
            "disease_type": "Oomycete",
            "symptoms": "Pale greenish-yellow oval patches on leaves, covered with violet-grey downy fungal growth.",
            "visual_symptoms": "Foliage collapses and bends downwards at the lesion site.",
            "possible_causes": "Cool, damp nights (10-15°C) with persistent fog or dew.",
            "risk_factors": "Dense planting, poorly drained soils.",
            "prevention": "Wide spacing for rapid leaf drying, use clean onion sets/seedlings.",
            "management": "Destroy crop residues after harvest.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Cymoxanil 8% + Mancozeb 64% WP",
                    "active_ingredient": "Cymoxanil + Mancozeb",
                    "dosage": "2.0 g / Litre of water",
                    "guidance": "Apply immediately upon disease sighting in cold dewy weather.",
                    "safety_warning": "PHI: 10 days.",
                    "pre_harvest_interval_days": 10
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Upright, tubular bluish-green leaves with thick waxy cuticles, developing firm bulbs.",
            "visual_symptoms": "Clean foliage, uniform bulb swelling, no tipping.",
            "possible_causes": "Optimal sulfur and potassium availability, disciplined moisture management.",
            "risk_factors": "None currently.",
            "prevention": "Stop irrigation 10-15 days before harvest to ensure proper bulb curing.",
            "management": "Inspect under leaf sheaths for early thrips nymphs.",
            "treatments": []
        }
    },

    # 5. TOMATO
    "Tomato": {
        "Early Blight": {
            "scientific_name": "Alternaria solani",
            "disease_type": "Fungal",
            "symptoms": "Dark brown spots with prominent concentric rings (target pattern) on older lower leaves.",
            "visual_symptoms": "Concentric rings surrounded by a halo of chlorotic yellow tissue.",
            "possible_causes": "High humidity, warm temperatures (24-29°C), splashing rainwater.",
            "risk_factors": "Dense foliage, plant contact with soil, unpruned lower suckers.",
            "prevention": "Mulching to prevent soil splashing onto bottom leaves, staking/trellising plants.",
            "management": "Prune infected bottom leaves up to 30 cm from ground level and destroy them.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
                    "active_ingredient": "Azoxystrobin + Difenoconazole",
                    "dosage": "1.0 ml / Litre of water",
                    "guidance": "Systemic and translaminar action. Spray evenly on both leaf surfaces.",
                    "safety_warning": "PHI: 5 days. Wear gloves during picking.",
                    "pre_harvest_interval_days": 5
                }
            ]
        },
        "Tomato Yellow Leaf Curl": {
            "scientific_name": "Tomato yellow leaf curl virus (TYLCV)",
            "disease_type": "Viral",
            "symptoms": "Severe upward curling and cupping of leaflets, marked yellowing (chlorosis) of leaf margins, severe plant stunting.",
            "visual_symptoms": "Bushy stunted plant, leathery upward-curled leaves, flower drop.",
            "possible_causes": "Transmission by sweetpotato whitefly (*Bemisia tabaci*).",
            "risk_factors": "Hot dry weather promoting whitefly vector populations.",
            "prevention": "Install yellow sticky traps (15-20 traps/acre), use nylon insect netting in nursery.",
            "management": "Rogue out infected virus-harboring plants immediately and bury them.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Diafenthiuron 50% WP (Vector Control)",
                    "active_ingredient": "Diafenthiuron",
                    "dosage": "1.2 g / Litre of water",
                    "guidance": "Controls whitefly insect vectors. Direct spray to underside of leaves.",
                    "safety_warning": "PHI: 7 days. Harmful to bees; do not spray during peak pollination hours.",
                    "pre_harvest_interval_days": 7
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Deep green compound leaves, robust stems, abundant yellow blossom clusters, healthy fruit set.",
            "visual_symptoms": "Uniform healthy foliage without mottling or spots.",
            "possible_causes": "Balanced calcium and boron nutrition, proper drip fertigation.",
            "risk_factors": "None currently.",
            "prevention": "Maintain regular watering to prevent calcium-deficiency blossom end rot.",
            "management": "Treillage training and pruning of unproductive side shoots.",
            "treatments": []
        }
    },

    # 6. APPLE
    "Apple": {
        "Apple Scab": {
            "scientific_name": "Venturia inaequalis",
            "disease_type": "Fungal",
            "symptoms": "Olive-green to velvety brown or black spots on leaves, followed by corky scabby lesions on fruit.",
            "visual_symptoms": "Velvety circular spots that turn dark and brittle, causing leaves to curl and drop prematurely.",
            "possible_causes": "Spring rains with temperatures between 16-24°C, overwintered spores on dead leaves.",
            "risk_factors": "Unraked orchard floor litter, dense canopy restricting airflow.",
            "prevention": "Post-harvest orchard sanitation (shredding fallen leaves), preventive spring fungicide schedule.",
            "management": "Prune trees annually to allow sunlight penetration and rapid foliage drying.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Captan 50% WP",
                    "active_ingredient": "Captan",
                    "dosage": "2.5 g / Litre of water",
                    "guidance": "Protective spray applied at green tip and pink bud stage.",
                    "safety_warning": "PHI: 21 days.",
                    "pre_harvest_interval_days": 21
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Broad glossy green leaves, clean bark, uniform fruit spurs.",
            "visual_symptoms": "Smooth leaves without spots or necrotic margins.",
            "possible_causes": "Adequate winter chilling hours, timely post-bloom nutrition.",
            "risk_factors": "None currently.",
            "prevention": "Apply dormant oil spray in winter to smother overwintering mite eggs.",
            "management": "Thin heavy fruit clusters to encourage uniform sizing.",
            "treatments": []
        }
    },

    # 7. MANGO
    "Mango": {
        "Anthracnose": {
            "scientific_name": "Colletotrichum gloeosporioides",
            "disease_type": "Fungal",
            "symptoms": "Small brown circular spots on tender leaves and blossoms that coalesce into large dark necrotic tears.",
            "visual_symptoms": "Shot-hole appearance on leaves, black tear-stain streaks on maturing fruit.",
            "possible_causes": "Frequent rains, heavy morning dews (RH >95%), warm temperatures (24-30°C).",
            "risk_factors": "Overcrowded orchards, dense unpruned tree centers.",
            "prevention": "Prune dead criss-crossing twigs after harvest and paste cuts with Bordeaux paste.",
            "management": "Collect and destroy fallen infected leaves and mummified panicles.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Copper Oxychloride 50% WP",
                    "active_ingredient": "Copper Oxychloride",
                    "dosage": "3.0 g / Litre of water",
                    "guidance": "Spray before flowering and at pea-size fruit stage.",
                    "safety_warning": "PHI: 15 days.",
                    "pre_harvest_interval_days": 15
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Glossy lanceolate leathery leaves, copper-colored healthy new flushes, clean panicles.",
            "visual_symptoms": "Intact leaves without leaf blight or black sooty mold.",
            "possible_causes": "Proper canopy open-center pruning, preventive pre-bloom spray.",
            "risk_factors": "None currently.",
            "prevention": "Avoid irrigation during the 2 months preceding flower bud differentiation.",
            "management": "Monitor for mango hopper pests on young inflorescences.",
            "treatments": []
        }
    },

    # 8. BANANA
    "Banana": {
        "Panama Disease (Fusarium Wilt)": {
            "scientific_name": "Fusarium oxysporum f. sp. cubense (TR4)",
            "disease_type": "Fungal / Vascular",
            "symptoms": "Yellowing of lower leaf margins progressing inward, leaf petiole buckling, collapse of leaves forming a skirt around the pseudostem.",
            "visual_symptoms": "Pronounced skirt of dead leaves hanging down pseudostem, internal vascular browning.",
            "possible_causes": "Soil-borne chlamydospores persisting for decades in soil, spread via contaminated suckers or irrigation water.",
            "risk_factors": "Acidic soils, monocropping of susceptible Cavendish or Grand Naine.",
            "prevention": "Use certified tissue-culture plantlets only. Disinfect farm tools in 10% bleach.",
            "management": "Quarantine infected mats. Drench soil with bioagent Trichoderma viride.",
            "treatments": [
                {
                    "treatment_type": "Biological",
                    "product_name": "Trichoderma harzianum 2% WP",
                    "active_ingredient": "Trichoderma harzianum",
                    "dosage": "50 g per plant mixed with 5 kg well-rotted FYM/Neem cake",
                    "guidance": "Apply to root zone during planting and earthing-up.",
                    "safety_warning": "Completely non-toxic biological agent.",
                    "pre_harvest_interval_days": 0
                }
            ]
        },
        "Black Sigatoka": {
            "scientific_name": "Pseudocercospora fijiensis",
            "disease_type": "Fungal",
            "symptoms": "Minute reddish-brown streaks parallel to leaf veins, developing into elliptical black lesions with sunken grey centers.",
            "visual_symptoms": "Extensive foliar necrosis causing premature leaf death and small unmarketable bunches.",
            "possible_causes": "High humidity, continuous warm temperatures (27°C), heavy rainfall.",
            "risk_factors": "Poor plantation drainage, excessive sucker retention.",
            "prevention": "De-leafing of infected lower leaves, de-suckering to maintain 1 mother + 1 follower.",
            "management": "Improve plantation aeration by pruning side suckers.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Propiconazole 25% EC + Mineral Oil",
                    "active_ingredient": "Propiconazole",
                    "dosage": "1.0 ml / Litre of water + 1% agricultural mineral oil",
                    "guidance": "Foliar mist directed at underside of top 3 functional leaves.",
                    "safety_warning": "PHI: 21 days.",
                    "pre_harvest_interval_days": 21
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Large broad bright green leaves (minimum 8-10 healthy functional leaves at bunching), sturdy upright pseudostem.",
            "visual_symptoms": "Clean unblemished lamina, turgid midrib.",
            "possible_causes": "Generous organic mulching, regular potassium fertigation.",
            "risk_factors": "None currently.",
            "prevention": "Bag emerging bunches with non-woven polypropylene covers to prevent thrips blemish.",
            "management": "Support heavy fruit bunches with bamboo or casuarina propping poles.",
            "treatments": []
        }
    },

    # 9. BRINJAL / EGGPLANT
    "Brinjal": {
        "Phomopsis Blight": {
            "scientific_name": "Phomopsis vexans",
            "disease_type": "Fungal",
            "symptoms": "Circular or irregular brown spots on leaves, soft watery fruit rot with black pycnidia in concentric circles.",
            "visual_symptoms": "Leaves turn yellow and drop. Dark mummified fruit hanging on plant.",
            "possible_causes": "High temperature (28-32°C) combined with high relative humidity.",
            "risk_factors": "Planting infected seed, continuous brinjal cultivation in the same plot.",
            "prevention": "Seed treatment with Thiram 3g/kg seed. Use certified resistant varieties.",
            "management": "Collect and burn infected fruits and blighted plant debris.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Carbendazim 50% WP",
                    "active_ingredient": "Carbendazim",
                    "dosage": "1.0 g / Litre of water",
                    "guidance": "Foliar spray at 15-day intervals during flowering and fruiting.",
                    "safety_warning": "PHI: 7 days.",
                    "pre_harvest_interval_days": 7
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Broad lobed pubescent green leaves, purple flowers, glossy firm fruits.",
            "visual_symptoms": "Uniform healthy foliage without wilting or spotting.",
            "possible_causes": "Balanced organic fertilization, regular drip irrigation.",
            "risk_factors": "None currently.",
            "prevention": "Install pheromone traps for brinjal shoot and fruit borer.",
            "management": "Regular weeding and mulching with crop straw.",
            "treatments": []
        }
    },

    # 10. CHILLI
    "Chilli": {
        "Anthracnose / Fruit Rot": {
            "scientific_name": "Colletotrichum capsici",
            "disease_type": "Fungal",
            "symptoms": "Circular sunken spots on ripe red chilli pods with concentric rings of black acervuli; dieback of twigs from tip downward.",
            "visual_symptoms": "Dieback of twigs starting from branch tips, bleached straw-colored drying twigs.",
            "possible_causes": "High humidity (>80%) and temperatures around 28°C during fruit ripening stage.",
            "risk_factors": "Overhead watering during harvest season, unharvested rotting pods.",
            "prevention": "Use seed from disease-free fields, treat seed with Trichoderma viride.",
            "management": "Prune back dry twigs 2-3 cm into healthy green wood.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Tebuconazole 25.9% m/m EC",
                    "active_ingredient": "Tebuconazole",
                    "dosage": "1.0 ml / Litre of water",
                    "guidance": "Spray thoroughly on fruits and branches at first onset of twig drying.",
                    "safety_warning": "PHI: 7 days.",
                    "pre_harvest_interval_days": 7
                }
            ]
        },
        "Chilli Leaf Curl": {
            "scientific_name": "Chilli leaf curl virus (ChiLCV)",
            "disease_type": "Viral",
            "symptoms": "Upward curling of leaf margins, puckering, reduction of leaf size, thickening of veins, severe bushy stunting.",
            "visual_symptoms": "Cup-shaped upward curled leaves, stunted shortened internodes.",
            "possible_causes": "Whitefly (*Bemisia tabaci*) and thrips vector transmission.",
            "risk_factors": "Prolonged dry spells with dusty conditions favoring vector breeding.",
            "prevention": "Grow barrier crops (2 rows of maize or bajra around the chilli field).",
            "management": "Uproot severely infected plants. Use yellow and blue sticky traps.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Imidacloprid 17.8% SL",
                    "active_ingredient": "Imidacloprid",
                    "dosage": "0.3 ml / Litre of water",
                    "guidance": "Controls sucking pest vector. Apply early morning.",
                    "safety_warning": "PHI: 15 days. Toxic to honeybees.",
                    "pre_harvest_interval_days": 15
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Dark green lanceolate leaves, white flowers, firm glossy pungent green/red chillies.",
            "visual_symptoms": "Flat open leaves without curling or chlorosis.",
            "possible_causes": "Optimal soil calcium and potassium, efficient pest vector control.",
            "risk_factors": "None currently.",
            "prevention": "Neem oil prophylactic spray (5 ml/L) every 14 days.",
            "management": "Maintain light but frequent furrow or drip irrigation.",
            "treatments": []
        }
    },

    # 11. MAIZE
    "Maize": {
        "Northern Corn Leaf Blight": {
            "scientific_name": "Exserohilum turcicum",
            "disease_type": "Fungal",
            "symptoms": "Long, elliptical, cigar-shaped greyish-green or tan lesions on leaves, 2.5 to 15 cm long.",
            "visual_symptoms": "Distinct elongated cigar-shaped lesions progressing from lower to upper leaves.",
            "possible_causes": "Moderate temperatures (18-27°C) and heavy dew/frequent rains.",
            "risk_factors": "Minimum-till or no-till fields with heavy corn residue from prior year.",
            "prevention": "Plant resistant maize hybrids, deep ploughing of previous crop residue.",
            "management": "Rotate fields out of maize for at least one year.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Mancozeb 75% WP",
                    "active_ingredient": "Mancozeb",
                    "dosage": "2.5 g / Litre of water",
                    "guidance": "Spray at knee-high stage and repeat at silking if weather remains moist.",
                    "safety_warning": "PHI: 15 days.",
                    "pre_harvest_interval_days": 15
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Broad arching green leaf ribbons, thick sturdy stalk, vigorous ear development with clean silks.",
            "visual_symptoms": "Flawless dark green leaf blades with prominent midrib.",
            "possible_causes": "Adequate nitrogen split application at knee-high and tasseling.",
            "risk_factors": "None currently.",
            "prevention": "Scout for Fall Armyworm whorl damage early in the season.",
            "management": "Side-dress urea at 35-40 days after sowing.",
            "treatments": []
        }
    },

    # 12. COTTON
    "Cotton": {
        "Bacterial Blight (Angular Leaf Spot)": {
            "scientific_name": "Xanthomonas citri pv. malvacearum",
            "disease_type": "Bacterial",
            "symptoms": "Small, angular, water-soaked spots bounded by leaf veinlets; black lesions running along the main leaf veins (Black arm).",
            "visual_symptoms": "Angular geometric lesions that turn brown to purplish-black.",
            "possible_causes": "Warm temperatures (30-35°C), high humidity, wind-driven rain.",
            "risk_factors": "Acid-delinted seed not used, overhead rain splashing.",
            "prevention": "Acid delinting of cotton seeds with commercial sulphuric acid @ 100 ml/kg seed.",
            "management": "Burn or bury crop stalks deeply after harvest.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Copper Oxychloride + Streptocycline",
                    "active_ingredient": "Copper Oxychloride 50 WP + Streptomycin",
                    "dosage": "2.5 g COC + 100 mg Streptocycline per Litre of water",
                    "guidance": "Spray at first sign of angular leaf lesions on square formation stage.",
                    "safety_warning": "PHI: 20 days.",
                    "pre_harvest_interval_days": 20
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Deep green palmate leaves, robust sympodial branches, firm healthy squares and developing bolls.",
            "visual_symptoms": "Clean green foliage free of angular spots or curl.",
            "possible_causes": "Balanced micronutrient management (Magnesium & Boron), optimal boll spacing.",
            "risk_factors": "None currently.",
            "prevention": "Monitor whitefly and pink bollworm using pheromone delta traps.",
            "management": "Maintain good field drainage during heavy monsoon showers.",
            "treatments": []
        }
    },

    # 13. GROUNDNUT
    "Groundnut": {
        "Tikka Disease (Leaf Spot)": {
            "scientific_name": "Cercospora arachidicola (Early) & Phaeoisariopsis personata (Late)",
            "disease_type": "Fungal",
            "symptoms": "Small circular brown spots with prominent yellow halo (early) or carbon black spots without yellow halo (late).",
            "visual_symptoms": "Dark brown circular spots on upper leaf surface, severe premature defoliation leaving stems bare.",
            "possible_causes": "High humidity (>85%), warm temperatures (25-30°C), continuous wet weather.",
            "risk_factors": "Continuous groundnut monoculture without rotation.",
            "prevention": "Seed treatment with Carbendazim @ 2g/kg seed. Early sowing.",
            "management": "Apply balanced gypsum at pegging stage to improve pod filling.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Hexaconazole 5% SC",
                    "active_ingredient": "Hexaconazole",
                    "dosage": "2.0 ml / Litre of water",
                    "guidance": "Spray at 35-40 days after sowing and repeat 15 days later.",
                    "safety_warning": "PHI: 30 days.",
                    "pre_harvest_interval_days": 30
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Four-foliolate bright green leaflets, cheerful yellow flowers, healthy pegs penetrating soil.",
            "visual_symptoms": "Lush green carpet canopy with no leaf spots.",
            "possible_causes": "Rhizobium inoculation, adequate gypsum (calcium & sulfur) application.",
            "risk_factors": "None currently.",
            "prevention": "Ensure light soil structure for easy peg penetration.",
            "management": "Light earthing up at flowering time.",
            "treatments": []
        }
    },

    # 14. MUSTARD
    "Mustard": {
        "White Rust": {
            "scientific_name": "Albugo candida",
            "disease_type": "Oomycete",
            "symptoms": "Prominent creamy-white raised blister-like pustules on lower leaf surfaces; floral malformation (staghead).",
            "visual_symptoms": "White pustules on leaves; distorted swollen floral branches resembling a stag's antlers.",
            "possible_causes": "Cool moist weather (12-18°C, RH >80%), heavy dew during December-January.",
            "risk_factors": "Late sowing, dense plant population.",
            "prevention": "Early sowing (before mid-October). Seed treatment with Metalaxyl-M (Apron XL @ 6g/kg).",
            "management": "Clip off and destroy malformed staghead shoots immediately.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Metalaxyl 35% WS",
                    "active_ingredient": "Metalaxyl",
                    "dosage": "2.0 g / Litre of water foliar spray",
                    "guidance": "Spray at 45 and 60 days after sowing upon white blister appearance.",
                    "safety_warning": "PHI: 21 days.",
                    "pre_harvest_interval_days": 21
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Lush lyrate-pinnatifid green leaves, dense golden yellow raceme flowers, developing siliquae.",
            "visual_symptoms": "Clean leaves free of white blisters or black spots.",
            "possible_causes": "Timely sowing, adequate basal sulfur nutrition.",
            "risk_factors": "None currently.",
            "prevention": "Monitor for mustard aphid (*Lipaphis erysimi*) during cold overcast days.",
            "management": "Maintain soil moisture at flowering and pod filling stage.",
            "treatments": []
        }
    },

    # 15. SOYBEAN
    "Soybean": {
        "Soybean Rust": {
            "scientific_name": "Phakopsora pachyrhizi",
            "disease_type": "Fungal",
            "symptoms": "Tiny, grey to reddish-brown polygonal pustules on lower leaf surface, causing rapid leaf yellowing and severe defoliation.",
            "visual_symptoms": "Powdery reddish-brown raised pustules resembling sand grains on leaf undersides.",
            "possible_causes": "Prolonged leaf wetness (>6 hours), temperatures between 15-28°C.",
            "risk_factors": "Airborne spores carried by monsoon winds, monoculture.",
            "prevention": "Grow tolerant cultivars (JS 97-52, DS 228), timely planting in June.",
            "management": "Ensure adequate spacing for good sunlight penetration into lower canopy.",
            "treatments": [
                {
                    "treatment_type": "Chemical",
                    "product_name": "Tebuconazole 10% + Sulphur 65% WG",
                    "active_ingredient": "Tebuconazole + Sulphur",
                    "dosage": "2.5 g / Litre of water (500 g / acre)",
                    "guidance": "Spray at pod initiation stage or at first symptom detection.",
                    "safety_warning": "PHI: 20 days.",
                    "pre_harvest_interval_days": 20
                }
            ]
        },
        "Healthy": {
            "scientific_name": "N/A",
            "disease_type": "Healthy Crop",
            "symptoms": "Trifoliate dark green leaves, sturdy stems with nodules on roots, healthy flowering and pod clusters.",
            "visual_symptoms": "Clean uniform leaves, no premature yellowing or pustules.",
            "possible_causes": "Bradyrhizobium japonicum seed inoculation, phosphorus fertilization.",
            "risk_factors": "None currently.",
            "prevention": "Avoid waterlogging in heavy black cotton soils.",
            "management": "Intercrop with pigeon pea or maize to enhance ecosystem biodiversity.",
            "treatments": []
        }
    }
}
