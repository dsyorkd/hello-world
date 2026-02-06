# RetireWise - UI/UX Design Prompt (Lovable App)

Use this prompt to generate a polished, production-grade financial planning interface.

---

## Design Brief

Design a **retirement financial planning web application** called **RetireWise** that feels trustworthy, modern, and approachable. The app should inspire confidence without being intimidating - think "friendly financial advisor" not "Wall Street trading desk."

## Brand Identity

- **Name:** RetireWise
- **Tagline:** "Your retirement, visualized."
- **Tone:** Confident, approachable, educational, empowering
- **NOT:** Intimidating, overly complex, salesy, or clinical

## Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Primary | `#1E3A5F` (Deep Navy) | Headers, primary buttons, nav |
| Secondary | `#2E7D32` (Financial Green) | Positive indicators, success states |
| Accent | `#FF8F00` (Warm Amber) | CTAs, highlights, attention points |
| Warning | `#D32F2F` (Alert Red) | Negative indicators, disclaimer banner |
| Background | `#F8FAFC` (Cool White) | Page background |
| Surface | `#FFFFFF` | Cards, panels |
| Text Primary | `#1A1A2E` | Body text |
| Text Secondary | `#64748B` | Labels, descriptions |
| Chart Colors | `#1E3A5F`, `#2E7D32`, `#FF8F00`, `#7C3AED`, `#06B6D4` | Distinct, colorblind-safe |

## Typography

- **Headings:** Inter or DM Sans (bold, clean)
- **Body:** Inter (regular, readable at small sizes)
- **Numbers/Data:** Tabular figures, monospace for financial data (JetBrains Mono or SF Mono)
- **Scale:** 14px base, 1.5 line height for body

## Layout Structure

### 1. Disclaimer Banner (Always Visible)
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ For educational purposes only. Not financial advice.      │
│ Consult a qualified advisor.                          [Learn More] │
└──────────────────────────────────────────────────────────────┘
```
- Fixed at top, `#FFF3E0` background with `#E65100` text
- Subtle but always present
- Collapsible to single line after first view

### 2. Disclaimer Modal (Every Login)
```
┌─────────────────────────────────────────┐
│                                         │
│         ⚠️  Important Notice            │
│                                         │
│  RetireWise is for educational and      │
│  entertainment purposes only.           │
│                                         │
│  This application does NOT provide      │
│  financial advice. Results are based    │
│  on mathematical models and do not      │
│  guarantee future performance.          │
│                                         │
│  Always consult a qualified financial   │
│  advisor before making financial        │
│  decisions.                             │
│                                         │
│      [✓ I Understand and Agree]         │
│                                         │
└─────────────────────────────────────────┘
```
- Centered modal with backdrop blur
- Cannot be dismissed without clicking the button
- Checkbox not required, just the button click

### 3. Navigation
```
┌─────────────────────────────────────────────────────────────┐
│ 🏦 RetireWise          Dashboard | Models | Profile    [JD] │
└─────────────────────────────────────────────────────────────┘
```
- Clean horizontal nav
- User avatar/initials on right
- Active state with bottom border accent

### 4. Onboarding Chat Interface
```
┌─────────────────────────────────────────────────────────────┐
│  Let's build your retirement plan                           │
│  ─────────────────────────────────                          │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │ 🤖 Hi! I'm your RetireWise assistant.  │               │
│  │ Let's get to know your financial        │               │
│  │ situation so I can help you plan.       │               │
│  │                                         │               │
│  │ What's your name and how old are you?   │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │ I'm Alex, 35 years old              │             │
│         └─────────────────────────────────────┘             │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │ Type your response...        [→] │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
│  Progress: ████████░░░░░░░░ 45% complete                    │
│  ✓ Personal Info  ✓ Income  ○ Savings  ○ Goals              │
└─────────────────────────────────────────────────────────────┘
```
- Chat bubbles: AI on left (light bg), User on right (primary color bg)
- Progress bar showing onboarding completion
- Category checklist below progress bar
- Smooth animations for new messages

### 5. Dashboard (Primary View After Onboarding)
```
┌─────────────────────────────────────────────────────────────┐
│ Welcome back, Alex                    Retirement in 30 yrs  │
│ Last updated: Feb 6, 2026                                   │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Portfolio │ Monthly  │ Projected│ Success  │ Readiness      │
│ $125,000  │ $1,500   │ $1.2M    │ 78%      │ Score: 72/100  │
│ +12.5%▲   │ savings  │ median   │ rate     │ ██████████░░   │
├──────────┴──────────┴──────────┴──────────┴────────────────┤
│                                                             │
│  Portfolio Projection (Monte Carlo)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         ╱‾‾‾‾‾‾‾‾‾‾‾‾╲  90th                      │   │
│  │       ╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲                          │   │
│  │     ╱   _______________   ╲  75th                   │   │
│  │   ╱  ╱                 ╲   ╲                        │   │
│  │  ╱ ╱                     ╲  ╲  50th (median)        │   │
│  │ ╱╱   ─ ─ ─ GOAL ─ ─ ─    ╲╲                        │   │
│  │╱╱                           ╲╲  25th                │   │
│  │╱___________________________╲  10th                   │   │
│  │                                                     │   │
│  │ 35    45    55    65    75    85    95  Age          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ What-If Controls   │  │ Goals Progress     │            │
│  │                    │  │                    │            │
│  │ Retire at: [65] ◄►│  │ ✓ $5k/mo income   │            │
│  │ Save/mo:  [$1500]◄►│  │ ○ $100k legacy    │            │
│  │ Risk:  [Moderate]◄►│  │ ○ Home at 45      │            │
│  │ SS: [$2000/mo]  ◄►│  │                    │            │
│  │                    │  │ On track: 2 of 3   │            │
│  │ [Run Simulation]   │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 6. Model Comparison View
```
┌─────────────────────────────────────────────────────────────┐
│ Compare Models                                              │
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Monte Carlo  │ │ Fixed Return │ │ 3-Scenario   │        │
│ │              │ │              │ │              │        │
│ │ 📊 Fan chart │ │ 📈 Line      │ │ 📉 3 lines   │        │
│ │              │ │              │ │              │        │
│ │ Success: 78% │ │ Meets goal:  │ │ Best: ✓      │        │
│ │ Median: $1.2M│ │ ✓ Yes       │ │ Expected: ✓  │        │
│ │              │ │ Balance:     │ │ Worst: ✗     │        │
│ │ [Selected ✓] │ │ $1.1M       │ │              │        │
│ │              │ │ [Select]     │ │ [Select]     │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│ Overlay Chart (selected models superimposed):               │
│ ┌─────────────────────────────────────────────────────┐    │
│ │  MC median ──── Fixed ─ ─ ─ Expected ╌╌╌╌          │    │
│ └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Component Design Specs

### Metrics Cards
- White card with subtle shadow (`box-shadow: 0 1px 3px rgba(0,0,0,0.1)`)
- Large number (24px+), bold
- Label below (12px, secondary color)
- Trend indicator (green up arrow / red down arrow)
- Hover: slight lift effect

### Charts
- Use `Chart.js` with `react-chartjs-2`
- Fan chart: semi-transparent fills between percentile bands
- Smooth curves (tension: 0.4)
- Goal line: dashed, amber colored
- Gridlines: very light (#F1F5F9)
- Tooltips showing exact values on hover
- Responsive, maintains aspect ratio

### Form Controls / Sliders
- Range sliders with visible track fill
- Number input beside slider for exact values
- Instant chart update on change (debounced 200ms)
- Labels above, current value displayed prominently

### Chat Bubbles
- AI: Left-aligned, light gray background, rounded corners
- User: Right-aligned, primary color background, white text
- Typing indicator: 3 animated dots
- Smooth scroll to latest message

## Responsive Behavior

- **Desktop (1200px+):** Full layout as shown above
- **Tablet (768-1199px):** Stack metrics cards 2x2, charts full width
- **Mobile (<768px):** Single column, collapsible sections, bottom nav

## Animations

- Page transitions: Fade in (200ms)
- Chart data updates: Smooth transition (400ms)
- Card hover: translateY(-2px) + shadow increase
- New chat messages: Slide up + fade in
- Progress bar: Smooth width transition
- Number counters: Count-up animation on load

## Accessibility

- All interactive elements focusable via keyboard
- ARIA labels on charts and data visualizations
- Color is never the sole indicator (always paired with icon/text)
- Contrast ratio minimum 4.5:1 for text
- Screen reader descriptions for chart data
- Skip-to-content link
