#!/usr/bin/env python3
"""
Code Titans - Presentation Generator for Problem Statement CB SW 4
Generates a 12-slide widescreen PowerPoint deck (.pptx)
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_filename="Code_Titans_CB_SW_4_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette Definitions
    C_EMERALD_DARK = RGBColor(6, 78, 59)      # Deep Forest Emerald #064E3B
    C_EMERALD_MED  = RGBColor(16, 149, 106)   # #10956A
    C_EMERALD_LIGHT= RGBColor(236, 253, 245)  # #ECFDF5
    C_TEAL_DARK    = RGBColor(19, 78, 74)     # #134E4A
    C_SLATE_DARK   = RGBColor(15, 23, 42)     # #0F172A
    C_SLATE_CARD   = RGBColor(30, 41, 59)     # #1E293B
    C_SLATE_TEXT   = RGBColor(51, 65, 85)     # #334155
    C_SLATE_MUTED  = RGBColor(100, 116, 139)  # #64748B
    C_WHITE        = RGBColor(255, 255, 255)
    C_GOLD         = RGBColor(245, 158, 11)   # #F59E0B
    C_AMBER_LIGHT  = RGBColor(254, 243, 199)  # #FEF3C7
    C_BLUE         = RGBColor(37, 99, 235)    # #2563EB
    C_BLUE_LIGHT   = RGBColor(239, 246, 255)  # #EFF6FF
    C_RED_ACCENT   = RGBColor(220, 38, 38)    # #DC2626
    C_RED_LIGHT    = RGBColor(254, 242, 242)  # #FEF2F2
    C_CARD_BG      = RGBColor(248, 250, 252)  # #F8FAFC
    C_CARD_BORDER  = RGBColor(226, 232, 240)  # #E2E8F0

    def add_header(slide, title_text, category_tag="CB SW 4 • AGRI-TECH & RURAL INNOVATION", current_slide=1, total_slides=12):
        # Header banner container
        header_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        header_box.fill.solid()
        header_box.fill.fore_color.rgb = C_EMERALD_DARK
        header_box.line.color.rgb = C_EMERALD_MED
        header_box.line.width = Pt(1.5)

        # Category pill badge
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.18), Inches(4.8), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_EMERALD_MED
        pill.line.fill.background()
        tf_pill = pill.text_frame
        tf_pill.word_wrap = True
        p_pill = tf_pill.paragraphs[0]
        p_pill.text = f"⚡ {category_tag}"
        p_pill.font.size = Pt(10)
        p_pill.font.bold = True
        p_pill.font.color.rgb = C_WHITE
        p_pill.alignment = PP_ALIGN.CENTER

        # Slide title text
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.48), Inches(10.5), Inches(0.6))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = C_WHITE

        # Team Tag on Header Right
        team_tag = slide.shapes.add_textbox(Inches(9.5), Inches(0.2), Inches(3.2), Inches(0.7))
        tf_team = team_tag.text_frame
        p_team = tf_team.paragraphs[0]
        p_team.text = "Team: CODE TITANS"
        p_team.font.size = Pt(12)
        p_team.font.bold = True
        p_team.font.color.rgb = C_GOLD
        p_team.alignment = PP_ALIGN.RIGHT
        p_inst = tf_team.add_paragraph()
        p_inst.text = "GITAM College"
        p_inst.font.size = Pt(10)
        p_inst.font.color.rgb = C_EMERALD_LIGHT
        p_inst.alignment = PP_ALIGN.RIGHT

        # Footer
        footer = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(7.05), Inches(13.333), Inches(0.45))
        footer.fill.solid()
        footer.fill.fore_color.rgb = C_SLATE_DARK
        footer.line.fill.background()

        f_text = slide.shapes.add_textbox(Inches(0.8), Inches(7.08), Inches(6.0), Inches(0.35))
        p_f1 = f_text.text_frame.paragraphs[0]
        p_f1.text = "Code Titans • Gandhi Institute of Technology and Management"
        p_f1.font.size = Pt(10)
        p_f1.font.color.rgb = C_WHITE

        f_link = slide.shapes.add_textbox(Inches(6.8), Inches(7.08), Inches(4.5), Inches(0.35))
        p_fl = f_link.text_frame.paragraphs[0]
        p_fl.text = "Live: ai-farm-copilot-bfbq.onrender.com"
        p_fl.font.size = Pt(9.5)
        p_fl.font.color.rgb = C_EMERALD_MED

        f_pg = slide.shapes.add_textbox(Inches(11.5), Inches(7.08), Inches(1.2), Inches(0.35))
        p_pg = f_pg.text_frame.paragraphs[0]
        p_pg.text = f"{current_slide} / {total_slides}"
        p_pg.font.size = Pt(10)
        p_pg.font.bold = True
        p_pg.font.color.rgb = C_WHITE
        p_pg.alignment = PP_ALIGN.RIGHT

    def create_card(slide, left, top, width, height, bg_color=C_CARD_BG, border_color=C_CARD_BORDER, border_width=1.5):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(border_width)
        return card

    # =========================================================================
    # SLIDE 1: HERO TITLE SLIDE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_SLATE_DARK
    bg1.line.fill.background()

    # Emerald Top Accent Bar
    accent_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.3))
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = C_EMERALD_MED
    accent_bar.line.fill.background()

    # Problem Statement Badge
    badge1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(0.7), Inches(5.2), Inches(0.42))
    badge1.fill.solid()
    badge1.fill.fore_color.rgb = C_EMERALD_DARK
    badge1.line.color.rgb = C_EMERALD_MED
    badge1.line.width = Pt(1.5)
    p_b1 = badge1.text_frame.paragraphs[0]
    p_b1.text = "🎯 PROBLEM STATEMENT: CB SW 4 • AGRI-TECH & RURAL INNOVATION"
    p_b1.font.size = Pt(11)
    p_b1.font.bold = True
    p_b1.font.color.rgb = C_WHITE
    p_b1.alignment = PP_ALIGN.CENTER

    # Main Project Title
    t_box1 = slide1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.3), Inches(1.8))
    tf1 = t_box1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "Unified AI Farm Copilot, Risk Intelligence\n& Market Optimizer"
    p1.font.size = Pt(34)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.space_after = Pt(8)

    p1_sub = tf1.add_paragraph()
    p1_sub.text = "A Connected, Explainable & Multimodal Agricultural Operating System for Indian Farmers"
    p1_sub.font.size = Pt(16)
    p1_sub.font.color.rgb = C_EMERALD_MED
    p1_sub.font.bold = True

    # 3-Pillar Highlight Grid in Slide 1
    p1_card = create_card(slide1, Inches(1.0), Inches(3.2), Inches(3.6), Inches(1.6), bg_color=C_SLATE_CARD, border_color=C_EMERALD_MED)
    tf_c1 = p1_card.text_frame
    tf_c1.word_wrap = True
    p_c1_t = tf_c1.paragraphs[0]
    p_c1_t.text = "🌾 Module 1: Farm Copilot"
    p_c1_t.font.size = Pt(14)
    p_c1_t.font.bold = True
    p_c1_t.font.color.rgb = C_GOLD
    p_c1_d = tf_c1.add_paragraph()
    p_c1_d.text = "• Odia, Hindi & English Voice/Text\n• Computer Vision Leaf Diagnostics\n• History & Weather-Aware Guidance"
    p_c1_d.font.size = Pt(11)
    p_c1_d.font.color.rgb = C_CARD_BG

    p2_card = create_card(slide1, Inches(4.85), Inches(3.2), Inches(3.6), Inches(1.6), bg_color=C_SLATE_CARD, border_color=C_EMERALD_MED)
    tf_c2 = p2_card.text_frame
    tf_c2.word_wrap = True
    p_c2_t = tf_c2.paragraphs[0]
    p_c2_t.text = "⚠️ Module 2: Risk Intelligence"
    p_c2_t.font.size = Pt(14)
    p_c2_t.font.bold = True
    p_c2_t.font.color.rgb = C_GOLD
    p_c2_d = tf_c2.add_paragraph()
    p_c2_d.text = "• Multi-threat early warning models\n• Explainable AI ('Why' alerts)\n• Urgency ranking & IPM remedies"
    p_c2_d.font.size = Pt(11)
    p_c2_d.font.color.rgb = C_CARD_BG

    p3_card = create_card(slide1, Inches(8.7), Inches(3.2), Inches(3.6), Inches(1.6), bg_color=C_SLATE_CARD, border_color=C_EMERALD_MED)
    tf_c3 = p3_card.text_frame
    tf_c3.word_wrap = True
    p_c3_t = tf_c3.paragraphs[0]
    p_c3_t.text = "💰 Module 3: Market Optimizer"
    p_c3_t.font.size = Pt(14)
    p_c3_t.font.bold = True
    p_c3_t.font.color.rgb = C_GOLD
    p_c3_d = tf_c3.add_paragraph()
    p_c3_d.text = "• 21 Odisha APMC Mandi tracker\n• Net Profit = Price - Freight - 1.5% Fee\n• Sell vs. Hold advisory & direct sale"
    p_c3_d.font.size = Pt(11)
    p_c3_d.font.color.rgb = C_CARD_BG

    # Team & Institution Info Box (Bottom)
    team_box = create_card(slide1, Inches(1.0), Inches(5.05), Inches(11.3), Inches(1.9), bg_color=RGBColor(24, 33, 47), border_color=C_EMERALD_MED)
    tf_tb = team_box.text_frame
    tf_tb.word_wrap = True
    p_tb_h = tf_tb.paragraphs[0]
    p_tb_h.text = "TEAM: CODE TITANS  |  COLLEGE: GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)"
    p_tb_h.font.size = Pt(12)
    p_tb_h.font.bold = True
    p_tb_h.font.color.rgb = C_GOLD

    p_mem = tf_tb.add_paragraph()
    p_mem.text = "👨‍💻 Team Leader: Swaviman Nayak  •  👨‍💻 Member 2: Lokanath Bala  •  👨‍💻 Member 3: Alok Kumar Swain  •  👨‍💻 Member 4: Gurudatta Ojha"
    p_mem.font.size = Pt(11.5)
    p_mem.font.bold = True
    p_mem.font.color.rgb = C_WHITE

    p_links = tf_tb.add_paragraph()
    p_links.text = "🌐 Live Application: https://ai-farm-copilot-bfbq.onrender.com   |   💻 GitHub: https://github.com/lokanathbala273-beep/ai-farm-copilot.git"
    p_links.font.size = Pt(10.5)
    p_links.font.color.rgb = C_EMERALD_MED

    # =========================================================================
    # SLIDE 2: THE PROBLEM CONTEXT (THE THREE BROKEN SILOS)
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2, "The Core Problem: Indian Agriculture's Three Disconnected Silos", current_slide=2)

    # Subtitle introduction
    intro_box = slide2.shapes.add_textbox(Inches(0.8), Inches(1.25), Inches(11.7), Inches(0.65))
    tf_intro = intro_box.text_frame
    tf_intro.word_wrap = True
    p_in = tf_intro.paragraphs[0]
    p_in.text = "A farmer's journey is continuous, yet modern digital farming tools force farmers to stitch together three isolated, disconnected apps with zero shared context."
    p_in.font.size = Pt(13.5)
    p_in.font.color.rgb = C_SLATE_TEXT

    # 3 Broken Silo Cards
    silo1 = create_card(slide2, Inches(0.8), Inches(2.0), Inches(3.7), Inches(4.7), bg_color=C_WHITE, border_color=C_RED_ACCENT)
    tf_s1 = silo1.text_frame
    tf_s1.word_wrap = True
    p_s1_h = tf_s1.paragraphs[0]
    p_s1_h.text = "❌ SILO 1: ADVISORY GAP"
    p_s1_h.font.size = Pt(14)
    p_s1_h.font.bold = True
    p_s1_h.font.color.rgb = C_RED_ACCENT
    p_s1_sub = tf_s1.add_paragraph()
    p_s1_sub.text = "No Personalised Multimodal Guidance"
    p_s1_sub.font.size = Pt(12)
    p_s1_sub.font.bold = True
    p_s1_sub.font.color.rgb = C_SLATE_DARK
    p_s1_b = tf_s1.add_paragraph()
    p_s1_b.text = (
        "\n• Generic & Text-Heavy: Most tools provide boilerplate advice ignoring local dialect (Odia, Sambalpuri, Hindi).\n\n"
        "• Ignores Visuals: Farmers cannot speak naturally or upload a damaged leaf photo to get immediate verified dosage.\n\n"
        "• Memoryless: Solutions forget historical soil chemistry (NPK, pH), prior fertilizer treatments, and crop cycles."
    )
    p_s1_b.font.size = Pt(11)
    p_s1_b.font.color.rgb = C_SLATE_TEXT

    silo2 = create_card(slide2, Inches(4.8), Inches(2.0), Inches(3.7), Inches(4.7), bg_color=C_WHITE, border_color=C_GOLD)
    tf_s2 = silo2.text_frame
    tf_s2.word_wrap = True
    p_s2_h = tf_s2.paragraphs[0]
    p_s2_h.text = "❌ SILO 2: RISK GAP"
    p_s2_h.font.size = Pt(14)
    p_s2_h.font.bold = True
    p_s2_h.font.color.rgb = C_GOLD
    p_s2_sub = tf_s2.add_paragraph()
    p_s2_sub.text = "Late & Unexplained Warnings"
    p_s2_sub.font.size = Pt(12)
    p_s2_sub.font.bold = True
    p_s2_sub.font.color.rgb = C_SLATE_DARK
    p_s2_b = tf_s2.add_paragraph()
    p_s2_b.text = (
        "\n• Reactive, Not Proactive: Disease outbreaks, pest attacks, and heat stress are flagged only AFTER crops are ruined.\n\n"
        "• Black-Box Opaque Alerts: Warnings flash red without explaining WHY (e.g. humidity + rainfall + temperature spike).\n\n"
        "• Lacks Actionability: Farmers receive scary alerts with zero verified, scientifically approved IPM mitigation steps."
    )
    p_s2_b.font.size = Pt(11)
    p_s2_b.font.color.rgb = C_SLATE_TEXT

    silo3 = create_card(slide2, Inches(8.8), Inches(2.0), Inches(3.7), Inches(4.7), bg_color=C_WHITE, border_color=C_BLUE)
    tf_s3 = silo3.text_frame
    tf_s3.word_wrap = True
    p_s3_h = tf_s3.paragraphs[0]
    p_s3_h.text = "❌ SILO 3: MARKET GAP"
    p_s3_h.font.size = Pt(14)
    p_s3_h.font.bold = True
    p_s3_h.font.color.rgb = C_BLUE
    p_s3_sub = tf_s3.add_paragraph()
    p_s3_sub.text = "Blind 'What & Where to Sell' Decisions"
    p_s3_sub.font.size = Pt(12)
    p_s3_sub.font.bold = True
    p_s3_sub.font.color.rgb = C_SLATE_DARK
    p_s3_b = tf_s3.add_paragraph()
    p_s3_b.text = (
        "\n• Blind Sowing Choices: Farmers plant without forecasting yield potential, seasonal demand, or market glut.\n\n"
        "• The Mandi Illusion: Distant mandis post higher rates, but transport freight and 1.5% APMC fees wipe out margins.\n\n"
        "• Sell vs. Hold Dilemma: Farmers sell at panic bottom prices without knowing storage viability and price recovery curves."
    )
    p_s3_b.font.size = Pt(11)
    p_s3_b.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 3: OUR UNIFIED SOLUTION (THE CONNECTED TRIAD)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3, "The Code Titans Solution: A Connected, Single-Platform Triad", current_slide=3)

    # Core concept highlight
    core_box = create_card(slide3, Inches(0.8), Inches(1.3), Inches(11.7), Inches(1.0), bg_color=C_EMERALD_LIGHT, border_color=C_EMERALD_MED)
    tf_core = core_box.text_frame
    tf_core.word_wrap = True
    p_cor_h = tf_core.paragraphs[0]
    p_cor_h.text = "💡 Single Shared Data Model Across All Modules"
    p_cor_h.font.size = Pt(13.5)
    p_cor_h.font.bold = True
    p_cor_h.font.color.rgb = C_EMERALD_DARK
    p_cor_d = tf_core.add_paragraph()
    p_cor_d.text = "Rather than three standalone apps, our engine shares 1 Unified Farmer Profile, Farm GPS Location, Soil History, and Crop Stage across Advisory, Risk, and Market Engines."
    p_cor_d.font.size = Pt(11.5)
    p_cor_d.font.color.rgb = C_SLATE_TEXT

    # 3 Solution Columns
    sol1 = create_card(slide3, Inches(0.8), Inches(2.45), Inches(3.7), Inches(4.35), bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_sol1 = sol1.text_frame
    tf_sol1.word_wrap = True
    p_sl1 = tf_sol1.paragraphs[0]
    p_sl1.text = "🌾 MODULE 1\nAI Farm Copilot"
    p_sl1.font.size = Pt(14)
    p_sl1.font.bold = True
    p_sl1.font.color.rgb = C_EMERALD_DARK
    p_sl1_d = tf_sol1.add_paragraph()
    p_sl1_d.text = (
        "\n• Multilingual Natural Voice: Odia, Hindi, English speech-to-text & TTS.\n\n"
        "• MobileNetV3 Foliar Scanner: In-browser & backend plant disease vision with foliar tissue verification.\n\n"
        "• Stage-Aware Personalisation: Guidance tailored to sowing, vegetative, flowering, and harvest stages.\n\n"
        "• Tele-Pathology Escalation: Low confidence scans route to OUAT clinical experts."
    )
    p_sl1_d.font.size = Pt(11)
    p_sl1_d.font.color.rgb = C_SLATE_TEXT

    sol2 = create_card(slide3, Inches(4.8), Inches(2.45), Inches(3.7), Inches(4.35), bg_color=C_WHITE, border_color=C_GOLD)
    tf_sol2 = sol2.text_frame
    tf_sol2.word_wrap = True
    p_sl2 = tf_sol2.paragraphs[0]
    p_sl2.text = "⚠️ MODULE 2\nCrop Risk Intelligence"
    p_sl2.font.size = Pt(14)
    p_sl2.font.bold = True
    p_sl2.font.color.rgb = C_GOLD
    p_sl2_d = tf_sol2.add_paragraph()
    p_sl2_d.text = (
        "\n• Multi-Threat Risk Modeling: Correlates disease, weather, pests, and price risks simultaneously.\n\n"
        "• Explainable AI (XAI): Transparent causal chain (e.g. '88% Humidity + 28°C = Fungal Risk').\n\n"
        "• Severity & Urgency Ranking: Prioritizes critical field interventions.\n\n"
        "• Conversational Feedback: Risk warnings appear automatically in the Copilot stream."
    )
    p_sl2_d.font.size = Pt(11)
    p_sl2_d.font.color.rgb = C_SLATE_TEXT

    sol3 = create_card(slide3, Inches(8.8), Inches(2.45), Inches(3.7), Inches(4.35), bg_color=C_WHITE, border_color=C_BLUE)
    tf_sol3 = sol3.text_frame
    tf_sol3.word_wrap = True
    p_sl3 = tf_sol3.paragraphs[0]
    p_sl3.text = "💰 MODULE 3\nFarm-to-Market Optimizer"
    p_sl3.font.size = Pt(14)
    p_sl3.font.bold = True
    p_sl3.font.color.rgb = C_BLUE
    p_sl3_d = tf_sol3.add_paragraph()
    p_sl3_d.text = (
        "\n• Odisha 21-Mandi Network: Real-time modal price tracking across APMC mandis.\n\n"
        "• True Net Realization: Deducts distance-based freight and 1.5% statutory mandi tax.\n\n"
        "• Sell vs. Hold Advisory: Data-backed holding strategy based on price recovery curves.\n\n"
        "• Direct B2B Marketplace: Trade directly with verified wholesalers and millers."
    )
    p_sl3_d.font.size = Pt(11)
    p_sl3_d.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 4: MODULE 1 IN-DEPTH (AI MULTILINGUAL FARM COPILOT)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4, "Module 1: Personalised Multilingual Advisory & Computer Vision", current_slide=4)

    # Left Column: Multilingual Voice Copilot
    c1_box = create_card(slide4, Inches(0.8), Inches(1.35), Inches(5.7), Inches(5.45), bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_c1 = c1_box.text_frame
    tf_c1.word_wrap = True
    p_c1_h = tf_c1.paragraphs[0]
    p_c1_h.text = "🎙️ Multilingual Voice & Vernacular AI Assistant"
    p_c1_h.font.size = Pt(14.5)
    p_c1_h.font.bold = True
    p_c1_h.font.color.rgb = C_EMERALD_DARK

    p_c1_items = tf_c1.add_paragraph()
    p_c1_items.text = (
        "\n• Seamless Vernacular Voice Input: Native Web Speech API integration supporting Odia (ଓଡ଼ିଆ), Hindi (हिंदी), and English with dialect tolerance.\n\n"
        "• Context-Aware Natural Language Processing: Understands local colloquial agricultural terms (e.g., 'ଖତ', 'ଧାନ ପତ୍ର ପୋଡ଼ା', 'ସାର ପ୍ରୟୋଗ').\n\n"
        "• Farm History Grounding: Copilot injects farmer's actual acre size (e.g. 6.5 Acres), current crop (e.g. Paddy / Tomato), and recent field sprays into prompt context.\n\n"
        "• Multichannel Delivery: Accessible via web application and WhatsApp / SMS gateway simulation for low-literacy farmers."
    )
    p_c1_items.font.size = Pt(11.5)
    p_c1_items.font.color.rgb = C_SLATE_TEXT

    # Right Column: Computer Vision Leaf Scanner
    c2_box = create_card(slide4, Inches(6.8), Inches(1.35), Inches(5.7), Inches(5.45), bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_c2 = c2_box.text_frame
    tf_c2.word_wrap = True
    p_c2_h = tf_c2.paragraphs[0]
    p_c2_h.text = "📷 AI Foliar Pathology & Computer Vision Scanner"
    p_c2_h.font.size = Pt(14.5)
    p_c2_h.font.bold = True
    p_c2_h.font.color.rgb = C_EMERALD_DARK

    p_c2_items = tf_c2.add_paragraph()
    p_c2_items.text = (
        "\n• MobileNetV3 / Vision Ensemble: Real-time leaf pathology classification detecting Early Blight, Late Blight, Blast, Bacterial Wilt, and Rust.\n\n"
        "• Folate Verification Engine (Anti-Hallucination): Computes Excess Green Index (EGI) & HSV chromaticity to verify actual plant tissue before processing (rejects random objects).\n\n"
        "• ICAR-Verified Clinical Prescriptions: Yields chemical dosage (e.g. Mancozeb 75% WP @ 2g/L) alongside organic neem oil IPM alternatives.\n\n"
        "• Expert Tele-Pathology Queue: If model confidence < 65%, case automatically routes to agricultural research scientists (e.g. OUAT) for human review."
    )
    p_c2_items.font.size = Pt(11.5)
    p_c2_items.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 5: MODULE 2 IN-DEPTH (CROP RISK INTELLIGENCE & EXPLAINABLE AI)
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5, "Module 2: Crop Risk Intelligence & Explainable Early Warning", current_slide=5)

    # Top highlight banner: What makes it explainable
    xai_banner = create_card(slide5, Inches(0.8), Inches(1.3), Inches(11.7), Inches(1.1), bg_color=C_AMBER_LIGHT, border_color=C_GOLD)
    tf_xb = xai_banner.text_frame
    tf_xb.word_wrap = True
    p_xb_h = tf_xb.paragraphs[0]
    p_xb_h.text = "🔍 Explainable AI (XAI) Principle: 'No Black-Box Red Flags'"
    p_xb_h.font.size = Pt(13.5)
    p_xb_h.font.bold = True
    p_xb_h.font.color.rgb = RGBColor(180, 83, 9)
    p_xb_d = tf_xb.add_paragraph()
    p_xb_d.text = "Every risk warning explicitly articulates CAUSE → EFFECT → MITIGATION. Farmers are never shown an unexplained red alert, building trust and enabling prompt preventive action."
    p_xb_d.font.size = Pt(11.5)
    p_xb_d.font.color.rgb = C_SLATE_TEXT

    # 4 Multi-Threat Risk Modeling Pillars
    r_w = Inches(2.75)
    r_gap = Inches(0.23)
    r_top = Inches(2.55)
    r_h = Inches(4.25)

    # Risk 1
    rk1 = create_card(slide5, Inches(0.8) + 0 * (r_w + r_gap), r_top, r_w, r_h, bg_color=C_WHITE, border_color=C_RED_ACCENT)
    tf_rk1 = rk1.text_frame
    tf_rk1.word_wrap = True
    p_r1 = tf_rk1.paragraphs[0]
    p_r1.text = "🦠 Outbreak Risk\n(Disease Spores)"
    p_r1.font.size = Pt(13)
    p_r1.font.bold = True
    p_r1.font.color.rgb = C_RED_ACCENT
    p_r1_b = tf_rk1.add_paragraph()
    p_r1_b.text = (
        "\n• Triggers: Relative Humidity > 85%, Canopy Temp 24-29°C, Consecutive damp days.\n\n"
        "• Explanation: 'High moisture creates ideal spore germination for fungal blight.'\n\n"
        "• Action: Preventive systemic fungicide application before symptom eruption."
    )
    p_r1_b.font.size = Pt(10.5)
    p_r1_b.font.color.rgb = C_SLATE_TEXT

    # Risk 2
    rk2 = create_card(slide5, Inches(0.8) + 1 * (r_w + r_gap), r_top, r_w, r_h, bg_color=C_WHITE, border_color=C_GOLD)
    tf_rk2 = rk2.text_frame
    tf_rk2.word_wrap = True
    p_r2 = tf_rk2.paragraphs[0]
    p_r2.text = "🐛 Pest Pressure\n(Infestation Waves)"
    p_r2.font.size = Pt(13)
    p_r2.font.bold = True
    p_r2.font.color.rgb = C_GOLD
    p_r2_b = tf_rk2.add_paragraph()
    p_r2_b.text = (
        "\n• Triggers: Degree-day heat accumulations, vegetative crop tenderness, monsoon breaks.\n\n"
        "• Explanation: 'Temperature window triggers Stem Borer egg hatchings in Paddy.'\n\n"
        "• Action: Deploy yellow sticky traps, light traps, and biopesticides immediately."
    )
    p_r2_b.font.size = Pt(10.5)
    p_r2_b.font.color.rgb = C_SLATE_TEXT

    # Risk 3
    rk3 = create_card(slide5, Inches(0.8) + 2 * (r_w + r_gap), r_top, r_w, r_h, bg_color=C_WHITE, border_color=C_BLUE)
    tf_rk3 = rk3.text_frame
    tf_rk3.word_wrap = True
    p_r3 = tf_rk3.paragraphs[0]
    p_r3.text = "🌦️ Microclimate Stress\n(Weather Extremes)"
    p_r3.font.size = Pt(13)
    p_r3.font.bold = True
    p_r3.font.color.rgb = C_BLUE
    p_r3_b = tf_rk3.add_paragraph()
    p_r3_b.text = (
        "\n• Triggers: Live GPS satellite synchronization, sudden downpour or heatwave.\n\n"
        "• Explanation: 'Forecast predicts 42mm rain in 6h; soil waterlogging expected.'\n\n"
        "• Action: Open field drainage furrows; postpone fertilizer top-dressing."
    )
    p_r3_b.font.size = Pt(10.5)
    p_r3_b.font.color.rgb = C_SLATE_TEXT

    # Risk 4
    rk4 = create_card(slide5, Inches(0.8) + 3 * (r_w + r_gap), r_top, r_w, r_h, bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_rk4 = rk4.text_frame
    tf_rk4.word_wrap = True
    p_r4 = tf_rk4.paragraphs[0]
    p_r4.text = "📉 Market Volatility\n(Price Crash Risk)"
    p_r4.font.size = Pt(13)
    p_r4.font.bold = True
    p_r4.font.color.rgb = C_EMERALD_DARK
    p_r4_b = tf_rk4.add_paragraph()
    p_r4_b.text = (
        "\n• Triggers: Oversupply arrivals from neighboring districts, seasonal glut.\n\n"
        "• Explanation: 'Cuttack arrivals surged 40%; price drop expected in 48h.'\n\n"
        "• Action: Divert produce to Bhubaneswar or utilize local cold storage."
    )
    p_r4_b.font.size = Pt(10.5)
    p_r4_b.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 6: MODULE 3 IN-DEPTH (FARM-TO-MARKET & LOGISTICS OPTIMIZER)
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6, "Module 3: Farm-to-Market Optimizer & Logistics Freight Intelligence", current_slide=6)

    # Highlight Formula Box
    formula_box = create_card(slide6, Inches(0.8), Inches(1.3), Inches(11.7), Inches(1.2), bg_color=C_BLUE_LIGHT, border_color=C_BLUE)
    tf_fb = formula_box.text_frame
    tf_fb.word_wrap = True
    p_fb_h = tf_fb.paragraphs[0]
    p_fb_h.text = "📊 The Code Titans True Net Realization Equation:"
    p_fb_h.font.size = Pt(13)
    p_fb_h.font.bold = True
    p_fb_h.font.color.rgb = C_BLUE
    p_fb_eq = tf_fb.add_paragraph()
    p_fb_eq.text = "Net Profit (₹/Qtl) = Mandi Modal Price - [Distance (km) × Freight Rate (₹/km)] - [1.5% Statutory APMC Mandi Fee]"
    p_fb_eq.font.size = Pt(14)
    p_fb_eq.font.bold = True
    p_fb_eq.font.color.rgb = C_SLATE_DARK

    # Left Box: Odisha 21-Mandi Network Analysis
    m_left = create_card(slide6, Inches(0.8), Inches(2.65), Inches(5.7), Inches(4.15), bg_color=C_WHITE, border_color=C_BLUE)
    tf_ml = m_left.text_frame
    tf_ml.word_wrap = True
    p_ml_h = tf_ml.paragraphs[0]
    p_ml_h.text = "🏛️ 21 Odisha State-Wise APMC/RMC Mandis"
    p_ml_h.font.size = Pt(14)
    p_ml_h.font.bold = True
    p_ml_h.font.color.rgb = C_BLUE
    p_ml_b = tf_ml.add_paragraph()
    p_ml_b.text = (
        "\n• Complete Coverage: Real-time price tracking across Cuttack, Bhubaneswar, Sambalpur, Bargarh, Berhampur, Balasore, Jeypore, and 14 other mandis.\n\n"
        "• Eliminating the 'Gross Price' Trap: A mandi offering ₹2,400/Qtl 80km away may leave the farmer with LESS profit than a local mandi at ₹2,200/Qtl after diesel and loading costs.\n\n"
        "• Transparent APMC Deductions: Enforces exact 1.5% statutory market committee cess so farmers see 100% authentic cash-in-hand figures."
    )
    p_ml_b.font.size = Pt(11)
    p_ml_b.font.color.rgb = C_SLATE_TEXT

    # Right Box: Sell-Timing & B2B Marketplace
    m_right = create_card(slide6, Inches(6.8), Inches(2.65), Inches(5.7), Inches(4.15), bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_mr = m_right.text_frame
    tf_mr.word_wrap = True
    p_mr_h = tf_mr.paragraphs[0]
    p_mr_h.text = "📈 Sell-vs-Hold Guidance & Direct Marketplace"
    p_mr_h.font.size = Pt(14)
    p_mr_h.font.bold = True
    p_mr_h.font.color.rgb = C_EMERALD_DARK
    p_mr_b = tf_mr.add_paragraph()
    p_mr_b.text = (
        "\n• Algorithmic Hold-or-Sell Decision: Balances commodity perishability against historical 7-day price trajectory curves.\n\n"
        "• Cold Storage ROI Calculator: Tells farmer whether 15 days in cold storage at ₹80/bag will pay off based on forecasted festival demand.\n\n"
        "• Direct B2B Wholesaler Marketplace: Verified portal where millers, food processors, and supermarket buyers place direct orders, removing exploitative middleman cuts."
    )
    p_mr_b.font.size = Pt(11)
    p_mr_b.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 7: SOIL INTELLIGENCE & FARM BUSINESS MAKER
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header(slide7, "Pre-Sowing Soil Intelligence & Farm Financial Simulation", current_slide=7)

    # Left Box: Soil Intelligence & Crop Choice
    s_left = create_card(slide7, Inches(0.8), Inches(1.35), Inches(5.7), Inches(5.45), bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_sl = s_left.text_frame
    tf_sl.word_wrap = True
    p_sl_h = tf_sl.paragraphs[0]
    p_sl_h.text = "🧪 Soil Chemistry & Crop Suitability Matrix"
    p_sl_h.font.size = Pt(14.5)
    p_sl_h.font.bold = True
    p_sl_h.font.color.rgb = C_EMERALD_DARK
    p_sl_b = tf_sl.add_paragraph()
    p_sl_b.text = (
        "\n• 6-Point Soil Analysis: Calibrates Nitrogen (N), Phosphorus (P), Potassium (K), Soil Organic Carbon (SOC), and pH levels.\n\n"
        "• Crop Choice Recommendation Engine: Before planting, ranks top matching crops (e.g. Paddy 94%, Tomato 89%, Mustard 76%) based on soil chemistry, seasonal rainfall, and market demand.\n\n"
        "• Fertilizer Advisory: Calculates precision dosage (Urea, DAP, MOP in kg/acre) preventing both nutrient burn and costly overspending."
    )
    p_sl_b.font.size = Pt(11.5)
    p_sl_b.font.color.rgb = C_SLATE_TEXT

    # Right Box: Farm Business Simulator & Voice Expense Logger
    s_right = create_card(slide7, Inches(6.8), Inches(1.35), Inches(5.7), Inches(5.45), bg_color=C_WHITE, border_color=C_GOLD)
    tf_sr = s_right.text_frame
    tf_sr.word_wrap = True
    p_sr_h = tf_sr.paragraphs[0]
    p_sr_h.text = "📊 Farm Business Simulator & Voice Expense Logger"
    p_sr_h.font.size = Pt(14.5)
    p_sr_h.font.bold = True
    p_sr_h.font.color.rgb = RGBColor(180, 83, 9)
    p_sr_b = tf_sr.add_paragraph()
    p_sr_b.text = (
        "\n• Scenario Budget Simulation: Computes full-season capital requirements (Seed, Land Prep, Fertilizers, Labor, Diesel, Transport) vs. projected harvest yields.\n\n"
        "• Hands-Free Voice Expense Logger: Farmers speak daily cash outflows naturally (e.g. 'ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି' / 'I spent 1500 on fertilizer'). System parses category and amount automatically.\n\n"
        "• Net Margin & P&L Telemetry: Live ledger tracks gross revenue vs. operating expenses, giving smallholders total financial clarity."
    )
    p_sr_b.font.size = Pt(11.5)
    p_sr_b.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 8: END-TO-END CROP CYCLE (HOW A FARMER USES IT)
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_header(slide8, "Complete Crop-Cycle Coverage: A Farmer's 4-Phase Journey", current_slide=8)

    # 4 Journey Steps
    j_w = Inches(2.75)
    j_gap = Inches(0.23)
    j_top = Inches(1.4)
    j_h = Inches(5.4)

    steps_data = [
        ("PHASE 1", "🌱 PRE-SOWING\n& PLANNING", C_EMERALD_DARK, [
            "Input soil test results (N-P-K, pH).",
            "View AI crop suitability ranking matrix.",
            "Run farm business budget simulation.",
            "Select high-demand crop & purchase certified seeds from Input Store."
        ]),
        ("PHASE 2", "🌿 VEGETATIVE\n& GROWTH", C_EMERALD_MED, [
            "Synchronize GPS microclimate weather alerts.",
            "Ask AI Copilot in Odia/Hindi for irrigation timing.",
            "Log daily field expenses by voice command.",
            "Track plot vigour on private dashboard."
        ]),
        ("PHASE 3", "🛡️ RISK WATCH\n& MITIGATION", C_GOLD, [
            "Receive explainable outbreak alerts.",
            "Photograph diseased leaf on AI Scanner.",
            "Get instant ICAR-verified dosage prescription.",
            "Escalate edge cases to OUAT plant pathologists."
        ]),
        ("PHASE 4", "💰 HARVEST, LOGISTICS & SALE", C_BLUE, [
            "Check real-time price trends across 21 mandis.",
            "Calculate Net Realization minus freight & 1.5% fee.",
            "Receive Sell vs. Hold advisory.",
            "List harvest on B2B Marketplace for direct wholesale buyer deals."
        ])
    ]

    for i, (p_tag, p_title, p_color, p_bullets) in enumerate(steps_data):
        card = create_card(slide8, Inches(0.8) + i * (j_w + j_gap), j_top, j_w, j_h, bg_color=C_WHITE, border_color=p_color)
        tf = card.text_frame
        tf.word_wrap = True

        tag = tf.paragraphs[0]
        tag.text = p_tag
        tag.font.size = Pt(11)
        tag.font.bold = True
        tag.font.color.rgb = p_color

        h = tf.add_paragraph()
        h.text = p_title
        h.font.size = Pt(13)
        h.font.bold = True
        h.font.color.rgb = C_SLATE_DARK

        body = tf.add_paragraph()
        body.text = "\n" + "\n\n".join([f"✓ {b}" for b in p_bullets])
        body.font.size = Pt(10.5)
        body.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 9: TECHNICAL ARCHITECTURE & STACK
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_header(slide9, "System Architecture: Lightweight, Scalable & Offline-Resilient", current_slide=9)

    # 4 Architecture Layers
    l_w = Inches(11.7)
    l_h = Inches(1.22)
    l_left = Inches(0.8)

    layers = [
        ("📱 1. PRESENTATION & MULTIMODAL CLIENT TIER",
         "Responsive PWA (Mobile-first) • Web Speech API (Odia/Hindi/English Voice Engine) • HTML5 Canvas Leaf Viewfinder • TailwindCSS Micro-UI",
         C_EMERALD_LIGHT, C_EMERALD_MED, C_EMERALD_DARK),
        ("⚙️ 2. BACKEND API & ORCHESTRATION ENGINE",
         "FastAPI (Python 3.14 Asynchronous Engine) • Role-Based Auth (Farmer, Expert, Seller, Admin) • Business Simulation Logic • Mandi Freight Pipeline",
         C_BLUE_LIGHT, C_BLUE, C_BLUE),
        ("🤖 3. AI, COMPUTER VISION & EXPLAINABILITY ENGINE",
         "MobileNetV3 / Vision Ensemble • Excess Green Index (EGI) & HSV Foliar Filter • Disease Severity Segmenter • Explainable Decision Rules Engine",
         C_AMBER_LIGHT, C_GOLD, RGBColor(180, 83, 9)),
        ("💾 4. DATA, TELEMETRY & PERSISTENCE TIER",
         "SQLite / PostgreSQL with SQLAlchemy ORM • OpenWeatherMap GPS Microclimate Feeds • 21 Odisha APMC Mandi Datasets • Render Cloud CI/CD Hosting",
         C_CARD_BG, C_CARD_BORDER, C_SLATE_DARK)
    ]

    for idx, (title, content, bg_c, border_c, title_c) in enumerate(layers):
        card = create_card(slide9, l_left, Inches(1.35) + idx * Inches(1.38), l_w, l_h, bg_color=bg_c, border_color=border_c)
        tf = card.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(12.5)
        p_t.font.bold = True
        p_t.font.color.rgb = title_c

        p_c = tf.add_paragraph()
        p_c.text = content
        p_c.font.size = Pt(11)
        p_c.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 10: HACKATHON EVALUATION ALIGNMENT (WHY CODE TITANS WINS)
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_header(slide10, "Hackathon Evaluation Alignment: Meeting Every Problem Statement Criterion", current_slide=10)

    # 2x3 Grid of Evaluation Metrics
    eval_cards = [
        ("🎯 True Integration (Not 3 Bolted Apps)",
         "Unified farmer profile, farm acres, and GPS location seamlessly shared across Copilot, Risk, and Market modules under a single persistent database state.",
         C_EMERALD_MED),
        ("🗣️ Multimodal & Vernacular Robustness",
         "Real voice recognition in Odia & Hindi, live camera leaf scanning, and low-bandwidth SMS/WhatsApp simulation for maximum rural accessibility.",
         C_BLUE),
        ("💡 Explainability Throughout (XAI)",
         "Every risk alert and market forecast transparently communicates the underlying biological and economic causality, not just an opaque conclusion.",
         C_GOLD),
        ("🌾 Full End-to-End Crop Cycle",
         "Genuinely spans from pre-sowing soil suitability and budget simulations, to in-season disease mitigation, to post-harvest mandi price optimization.",
         C_EMERALD_DARK),
        ("⚡ Actionability Over Observations",
         "Every scan and alert pairs with concrete, verified ICAR agronomic actions, dosage ratios, and direct market routing rather than mere notifications.",
         C_RED_ACCENT),
        ("🌐 Deployed & Production-Ready",
         "Fully functional, live on Render Cloud PaaS (ai-farm-copilot-bfbq.onrender.com) and version-controlled on GitHub with 100% passing test suite.",
         C_SLATE_DARK)
    ]

    col_w = Inches(5.7)
    row_h = Inches(1.65)
    for idx, (title, desc, accent) in enumerate(eval_cards):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8) + col * Inches(6.0)
        y = Inches(1.35) + row * Inches(1.85)

        card = create_card(slide10, x, y, col_w, row_h, bg_color=C_WHITE, border_color=accent)
        tf = card.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 11: QUANTIFIABLE IMPACT & FUTURE ROADMAP
    # =========================================================================
    slide11 = prs.slides.add_slide(blank_layout)
    add_header(slide11, "Quantifiable Economic Impact & Future Scalability Roadmap", current_slide=11)

    # Top Metrics Banner
    m1 = create_card(slide11, Inches(0.8), Inches(1.35), Inches(3.7), Inches(1.6), bg_color=C_EMERALD_LIGHT, border_color=C_EMERALD_MED)
    tf_m1 = m1.text_frame
    tf_m1.word_wrap = True
    p_m1_v = tf_m1.paragraphs[0]
    p_m1_v.text = "20% – 35%"
    p_m1_v.font.size = Pt(26)
    p_m1_v.font.bold = True
    p_m1_v.font.color.rgb = C_EMERALD_DARK
    p_m1_l = tf_m1.add_paragraph()
    p_m1_l.text = "Reduction in Crop Loss via 3-Day Early Disease & Weather Outbreak Warnings"
    p_m1_l.font.size = Pt(10.5)
    p_m1_l.font.color.rgb = C_SLATE_TEXT

    m2 = create_card(slide11, Inches(4.8), Inches(1.35), Inches(3.7), Inches(1.6), bg_color=C_BLUE_LIGHT, border_color=C_BLUE)
    tf_m2 = m2.text_frame
    tf_m2.word_wrap = True
    p_m2_v = tf_m2.paragraphs[0]
    p_m2_v.text = "15% – 25%"
    p_m2_v.font.size = Pt(26)
    p_m2_v.font.bold = True
    p_m2_v.font.color.rgb = C_BLUE
    p_m2_l = tf_m2.add_paragraph()
    p_m2_l.text = "Higher Net Income per Quintal via Logistics & APMC Mandi Freight Optimization"
    p_m2_l.font.size = Pt(10.5)
    p_m2_l.font.color.rgb = C_SLATE_TEXT

    m3 = create_card(slide11, Inches(8.8), Inches(1.35), Inches(3.7), Inches(1.6), bg_color=C_AMBER_LIGHT, border_color=C_GOLD)
    tf_m3 = m3.text_frame
    tf_m3.word_wrap = True
    p_m3_v = tf_m3.paragraphs[0]
    p_m3_v.text = "30% Savings"
    p_m3_v.font.size = Pt(26)
    p_m3_v.font.bold = True
    p_m3_v.font.color.rgb = RGBColor(180, 83, 9)
    p_m3_l = tf_m3.add_paragraph()
    p_m3_l.text = "In Input Costs through Precision NPK Dosage and Integrated Pest Management"
    p_m3_l.font.size = Pt(10.5)
    p_m3_l.font.color.rgb = C_SLATE_TEXT

    # Strategic Roadmap Box
    road_box = create_card(slide11, Inches(0.8), Inches(3.15), Inches(11.7), Inches(3.65), bg_color=C_WHITE, border_color=C_EMERALD_MED)
    tf_rb = road_box.text_frame
    tf_rb.word_wrap = True
    p_rb_h = tf_rb.paragraphs[0]
    p_rb_h.text = "🗺️ Strategic Future Roadmap & Ecosystem Expansion"
    p_rb_h.font.size = Pt(14)
    p_rb_h.font.bold = True
    p_rb_h.font.color.rgb = C_EMERALD_DARK

    p_rb_b = tf_rb.add_paragraph()
    p_rb_b.text = (
        "\n• Phase 1 (Current): Deployed web application with Odia/Hindi voice copilot, MobileNetV3 disease vision, 21 Odisha mandis, and tele-pathologist review.\n\n"
        "• Phase 2 (Next 6 Months): LoRaWAN & ESP32 IoT Soil Telemetry — automated NPK and soil moisture streaming for autonomous irrigation scheduling.\n\n"
        "• Phase 3 (12 Months): Pan-India APMC Integration — scaling from 21 Odisha mandis to 500+ national mandis across Andhra Pradesh, Telangana, and West Bengal.\n\n"
        "• Phase 4: FPO (Farmer Producer Organization) Collective Bargaining — bulk truck-sharing aggregation to cut freight costs by an additional 40%."
    )
    p_rb_b.font.size = Pt(11.5)
    p_rb_b.font.color.rgb = C_SLATE_TEXT

    # =========================================================================
    # SLIDE 12: CONCLUSION, TEAM CODE TITANS & Q&A
    # =========================================================================
    slide12 = prs.slides.add_slide(blank_layout)
    bg12 = slide12.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg12.fill.solid()
    bg12.fill.fore_color.rgb = C_SLATE_DARK
    bg12.line.fill.background()

    # Top bar
    accent_bar12 = slide12.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.25))
    accent_bar12.fill.solid()
    accent_bar12.fill.fore_color.rgb = C_EMERALD_MED
    accent_bar12.line.fill.background()

    # Header
    t12 = slide12.shapes.add_textbox(Inches(1.0), Inches(0.6), Inches(11.3), Inches(1.1))
    tf12 = t12.text_frame
    p12_h = tf12.paragraphs[0]
    p12_h.text = "TEAM CODE TITANS"
    p12_h.font.size = Pt(28)
    p12_h.font.bold = True
    p12_h.font.color.rgb = C_WHITE
    p12_sub = tf12.add_paragraph()
    p12_sub.text = "Gandhi Institute of Technology and Management (GITAM)  •  Problem Statement: CB SW 4"
    p12_sub.font.size = Pt(14)
    p12_sub.font.color.rgb = C_GOLD

    # 4 Team Member Cards
    tm_w = Inches(2.65)
    tm_gap = Inches(0.23)
    tm_top = Inches(1.8)
    tm_h = Inches(2.9)

    members = [
        ("👑 Swaviman Nayak", "Team Leader", "• System Architecture\n• Multi-Threat Risk Modeling\n• Full-Stack Integration"),
        ("⚡ Lokanath Bala", "Core AI & Backend", "• Computer Vision Scanner\n• FastAPI & ML Pipelines\n• Deployment & DB Schemas"),
        ("🎨 Alok Kumar Swain", "Frontend & Multilingual UX", "• Odia/Hindi Voice Copilot\n• Web Speech API Integration\n• PWA Responsive Micro-UI"),
        ("📈 Gurudatta Ojha", "Data & Agri-Economics", "• 21 Odisha Mandi Freight Matrix\n• Net Realization Formula\n• Soil & Agronomy Datasets")
    ]

    for idx, (name, role, resp) in enumerate(members):
        card = create_card(slide12, Inches(1.0) + idx * (tm_w + tm_gap), tm_top, tm_w, tm_h, bg_color=C_SLATE_CARD, border_color=C_EMERALD_MED)
        tf = card.text_frame
        tf.word_wrap = True
        p_n = tf.paragraphs[0]
        p_n.text = name
        p_n.font.size = Pt(13)
        p_n.font.bold = True
        p_n.font.color.rgb = C_WHITE

        p_r = tf.add_paragraph()
        p_r.text = role
        p_r.font.size = Pt(11)
        p_r.font.bold = True
        p_r.font.color.rgb = C_GOLD

        p_d = tf.add_paragraph()
        p_d.text = "\n" + resp
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = C_CARD_BG

    # Bottom Contact & Demo Banner
    demo_box = create_card(slide12, Inches(1.0), Inches(4.95), Inches(11.3), Inches(1.95), bg_color=RGBColor(24, 33, 47), border_color=C_EMERALD_MED)
    tf_db = demo_box.text_frame
    tf_db.word_wrap = True
    p_db_t = tf_db.paragraphs[0]
    p_db_t.text = "🚀 PROJECT REPOSITORY & LIVE WORKING PROTOTYPE"
    p_db_t.font.size = Pt(13)
    p_db_t.font.bold = True
    p_db_t.font.color.rgb = C_GOLD

    p_db_l1 = tf_db.add_paragraph()
    p_db_l1.text = "🌐 Live Application: https://ai-farm-copilot-bfbq.onrender.com"
    p_db_l1.font.size = Pt(11.5)
    p_db_l1.font.bold = True
    p_db_l1.font.color.rgb = C_WHITE

    p_db_l2 = tf_db.add_paragraph()
    p_db_l2.text = "💻 GitHub Repository: https://github.com/lokanathbala273-beep/ai-farm-copilot.git"
    p_db_l2.font.size = Pt(11.5)
    p_db_l2.font.bold = True
    p_db_l2.font.color.rgb = C_EMERALD_LIGHT

    p_qa = tf_db.add_paragraph()
    p_qa.text = "🙏 Thank You! We are open for Questions & Live Demonstration."
    p_qa.font.size = Pt(13)
    p_qa.font.bold = True
    p_qa.font.color.rgb = C_GOLD

    # Save presentation
    prs.save(output_filename)
    print(f"Presentation saved successfully to: {output_filename}")

if __name__ == "__main__":
    create_deck()
