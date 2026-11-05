# dr.clinic — Strategy and Phase-wise Build Prompts

## 1. The decision

**Concept: the "dr.clinic Care Navigator".** It is an independent care-navigation hub with a patient-to-clinic matching marketplace on top.

The domain reads "doctor clinic". People who type that want to **find and choose care**, which is commercial intent. A generic symptoms encyclopedia would compete head-on with Mayo Clinic, Cleveland Clinic, WebMD and the NHS for YMYL rankings, and it would lose. The defensible wedge is the step *before* treatment:

- where to go (ER vs urgent care vs telehealth vs primary care),
- which specialist,
- how to choose a clinic,
- how to prepare,
- what the numbers mean.

Each of those pages naturally ends in "get matched with a clinic", and that click is worth far more than an ad click.

### Revenue stack (most to least valuable at scale)

| Engine | How it pays | Benchmarks used |
|---|---|---|
| 1. Patient lead gen | Sell consented match requests to clinics, $10–$150 by specialty | Healthcare CPL averages ~$162 (range $36–$286). Dental implants run $180–$450 per lead on Google Ads. Dermatology is ~$19 and urgent care ~$32. Our price list undercuts paid search, which makes the sale easy. |
| 2. Clinic subscriptions | Featured partner at $149/mo; hub sponsorships are custom | The Zocdoc, Healthgrades and WhatClinic "list your practice" model |
| 3. Google AdSense | Auto ads on content and tool pages | Health/wellness RPM is typically $10–$25 in tier-1 markets. Health insurance CPCs run $20–$35. |
| 4. Sponsorships | Sponsored tools, newsletter slots, contest prizes | The WebMD/Healthline sponsored-module model |
| 5. Supporters | Pledges for operations, marketing, hiring, prizes | Hospital "Give" model |
| 6. Asset sale/lease | Broker banner to web.works/contact on every page | — |

**Worked example at 100k pageviews/month (~60k sessions):**

- AdSense at a $12 RPM is about **$1,200/mo**.
- Lead gen: 1% of sessions request a match, giving 600 requests. If 50% sell at an average of $30, that is about **$9,000/mo**.
- Lead gen is the business. AdSense is the floor. Optimise every page for the match CTA first and ad density second. This is why ads are switched off on the funnel pages.

### Hard constraints (repeat in every phase)

- Domain **dr.clinic**. AdSense publisher **ca-pub-6620975821265271**, with the AdSense script in `<head>`.
- `ads.txt` contains `google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`.
- On top of every page: "contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership", linked to https://web.works/contact.
- One inbox only for all forms. It is **never written in the page**. Encode it in JS and route all forms through FormSubmit AJAX.
- Trademark: "DR. CLINIC" is a live USPTO mark (Reg. 6,258,855, Classes 3 and 5, cosmetics/pharma, third-party owner). Use "dr.clinic" only as the web address. Brand the service as "Care Navigator", claim no ™/®, publish a disclosure page, and sell no cosmetics or pharma goods.
- Hosting: GitHub Pages free plan, repo `WEBWORKSA1/dr-clinic`, **main branch / root**, built natively by Jekyll. No paid services.
- YMYL safety: emergency warning signs wherever a decision may be urgent. No diagnosis, no dosing, and sources on every guide.

---

## 2. Phase-wise prompts (copy each into your builder)

### Phase 0 — Research and positioning

> Study at least 35 leading health, clinic, telehealth and medical-directory sites. Include Mayo Clinic, Cleveland Clinic, WebMD, Healthline, Zocdoc, Practo, NHS, MedlinePlus, healthdirect, WhatClinic, Solv, Healthgrades, GoodRx, Drugs.com, One Medical, Teladoc, PlushCare, Sesame, Ada, K Health, MDLIVE, Lybrate, Apollo 24|7, Tata 1mg, Patient.info, Bookimed, Carbon Health, HealthTap, Max Healthcare, Kaiser Permanente, Ro, Mount Sinai, Docplanner, CVS MinuteClinic and RateMDs.
>
> For each, record: navigation, tools, forms and their fields, lead CTAs, provider-side offer, monetization, trust signals and design patterns. Output a features matrix and pick the positioning with the highest commercial intent that does not require out-ranking hospital encyclopedias. Back the revenue model with CPC, RPM and cost-per-lead benchmarks.

### Phase 1 — Information architecture and design system

> Design a calm, clinical-editorial system: ink navy #0b2239, teal #0f9f8f, coral CTA #ff6a3d, paper #f5f8fb, with full dark mode. Use Fraunces for display and Plus Jakarta Sans for UI.
>
> Components:
> - sticky header with search, theme toggle and CTA
> - broker top bar
> - hero with a "What do you need right now?" navigator card
> - cards, chips and choice cards
> - stepper, tool panels with result gauges
> - lead band, pricing tiers, FAQ accordions, emergency callouts, responsive tables
> - lite-YouTube blocks, cookie notice, print styles
>
> Use a single SVG icon sprite. Meet WCAG 2.2 AA (skip link, focus rings, labels, reduced motion). Mobile-first, collapsing to a slide-in menu at 1040px.
>
> IA:
> - Home
> - Find care
> - Get matched
> - For clinics
> - Specialists (34)
> - Clinic types (17) with a scoring checklist
> - Tools hub (15) and tool pages
> - Health library hub and guides
> - Videos, news pulse
> - Support, contests, careers, advertise
> - About, editorial policy, contact
> - Privacy, terms, disclaimer, cookies, trademark, accessibility
> - Search, 404, thank-you

### Phase 2 — Engine (Jekyll on GitHub Pages)

> Build on Jekyll so GitHub Pages compiles from main with no build step.
>
> - `_config.yml` with `permalink: pretty`, kramdown GFM, and the plugins `jekyll-sitemap` and `jekyll-seo-tag`.
> - A `health` collection at `/health/:name/` with front-matter defaults.
> - Layouts: `default`, `article` (breadcrumb, takeaways, auto ToC, sources, lead CTA, disclaimer, share, related guides, MedicalWebPage and Breadcrumb JSON-LD) and `tool` (breadcrumb, related tools, WebApplication JSON-LD).
> - Includes: `head` (SEO tag, AdSense script unless `ads: false`, Organization and WebSite SearchAction JSON-LD), `topbar`, `header`, `footer`, `page-hero`, `lead-cta`, `faq` (with FAQPage JSON-LD), `emergency`, `med-note`, `share`.
> - Drive everything from `_data/`: needs, specialties, clinic_types, tools, videos, tips, observances, news.
> - Generate `search.json` and `feed.xml` with Liquid.
> - Static `ads.txt`, `robots.txt`, `CNAME`, `site.webmanifest`.

### Phase 3 — Care navigator and finders

> 1. **Find care:** a 3-question wizard (emergency signs, urgency, issue type). It outputs one of 12 recommendations (ER, crisis line, urgent care, telehealth, primary care, dentist, eye, dermatology, women's health, pediatrics, mental health, pharmacist). Each comes with why, what to bring, and a "Get matched" deep link. Add a care-settings comparison table, international nurse lines and an embedded explainer video.
> 2. **Specialists:** 34 cards (treats, when to see, aliases) with text search, `?q=` prefill and 17 body-area chips. Each card deep-links to `/get-matched/?need=…`.
> 3. **Clinics:** 17 clinic types (best for, services, cost tier, wait, the question to ask). Add a weighted 12-item checklist that scores any clinic live, plus red flags.

### Phase 4 — Fifteen private tools (client-side only)

> Build these in one `tools.js` with metric/US toggles, mode toggles, sex-specific fields, validation, results with gauges and plain-language interpretation, and explanatory content and FAQs on each page:
> - BMI (with gauge and Asian action points)
> - Calories (Mifflin–St Jeor)
> - Body fat (US Navy)
> - Healthy weight (BMI range plus Devine, Robinson and Miller)
> - Waist-to-height (NICE)
> - Blood pressure (AHA/ACC categories, severe-reading guidance, local log with average and CSV)
> - Heart-rate zones (220−age, Tanaka, Karvonen, CDC intensity bands)
> - Fever/temperature (°C/°F, adult and infant thresholds)
> - Due date (LMP or conception, gestational age, trimester, milestones)
> - Ovulation (3 cycles)
> - Water (National Academies)
> - Sleep cycles (wake / bed / now)
> - Visit-prep builder (printable sheet, question bank by visit type)
> - Symptom journal (localStorage, CSV, print)
> - Medication schedule (time-slot grid, print)

### Phase 5 — Lead-generation funnels (the profit engine)

> 1. **Patient match** (`/get-matched/`, ads off): a 4-step form.
>    - Step 1: need cards (16 types) that auto-advance.
>    - Step 2: timeframe, visit type, city, country, postcode.
>    - Step 3: payment, insurer, language, clinician preference, budget, short note with a "no medical details" warning.
>    - Step 4: name, email, phone, contact method, two required consents, newsletter opt-in.
>
>    Add a progress bar, prefill from `?need=&city=`, per-step validation and a success panel. The sidebar carries how-it-works, trust ticks and emergency info, plus an FAQ.
> 2. **Mini-lead band** on every content page and tool: need plus city, which deep-links into step 2.
> 3. **For clinics** (ads off): value props; plans (Free / Pay-per-lead from $15 / Featured $149/mo / Hub sponsor); indicative price table by specialty; how-it-works; standards; application form with plan prefill.
> 4. All forms POST JSON to FormSubmit AJAX with an obfuscated inbox, honeypot, `_subject`, `_template=table` and page URL. On failure, show a one-click mailto fallback pre-filled with the answers.

### Phase 6 — Monetization and community pages

> - **Support:** allocation bars (operations 35 / hiring 25 / promotion 20 / contests 20), amount picker, payment buttons that appear only when links are set in `_config.yml`, a pledge form, "sponsor a prize / fund a role / back outreach" cards, and a not-tax-deductible disclosure.
> - **Contests:** 30-Day Know Your Numbers Challenge, Explain It Simply (video/article), Clinic Hero Awards. Entry/nomination form, key rules (no purchase necessary, 18+, void where prohibited, official rules per contest, skill-testing question where required), sponsor CTA.
> - **Careers:** 7 remote roles (writer, licensed clinical reviewer, video creator, SEO, front-end, partnerships on commission, community), application form, hiring steps, scam warning.
> - **Advertise:** 6 placements, ad standards, inquiry form, broker callout.

### Phase 7 — Content for AdSense approval

> Write 22 original guides (600–900 words each). Each needs takeaways, emergency callouts where relevant, tables, internal links to tools and the match funnel, a `need` for CTA prefill, and 2–3 authoritative sources (WHO, CDC, NIH/MedlinePlus, NHS, NICE, AHA, AAD, USPSTF, HealthCare.gov).
>
> Topics: urgent care vs ER, choosing a primary care doctor, telehealth, appointment prep, second opinions, choosing a clinic, treatment abroad, insurance terms, annual checkup, lab tests, high blood pressure, prediabetes/type 2 diabetes, cold/flu/COVID/allergies, fever, back pain, headaches, cholesterol, skin/moles, sleep, stress/anxiety (with crisis lines), dental checkups, physiotherapy.
>
> Add a curated video library: only embeddable videos from official channels, verified via YouTube oEmbed, click-to-load on youtube-nocookie.

### Phase 8 — Compliance and trust

> Publish:
> - Privacy: AdSense cookie wording, Google Ads Settings and aboutads opt-outs, consent message, FormSubmit/GitHub processors, GDPR/UK/PIPEDA/Law 25/CCPA/DPDP rights, HIPAA position, children.
> - Terms: matching service, clinic fees disclosure, contests, contributions.
> - Medical disclaimer with ad, sponsor and clinic-fee disclosures.
> - Cookie table with a "privacy choices" button that calls `googlefc.showRevocationMessage`.
> - Trademark and copyright disclosure.
> - Accessibility statement.
> - Editorial policy: sourcing hierarchy, AI-assist disclosure, clinical-review program, corrections.
> - About: how we are funded.
>
> In AdSense, enable **Privacy & messaging → European regulations and US states messages** so Google's certified CMP runs.

### Phase 9 — Automation (self-updating)

> - Client-side: tip of the day (by day-of-year), this month's health observance, "x days ago" stamps.
> - Build-time: copyright year, observance fallback, latest guides, sitemap, RSS and search index regenerate on every commit.
> - Daily GitHub Action `update-news.yml` runs `scripts/update_news.py`. It pulls NIH, FDA and ScienceDaily RSS, writes `_data/news.json` only when headlines change, commits, and requests a Pages build.

### Phase 10 — QA, deploy, apply

> Build locally and fail on any of the following:
> - broken internal links
> - missing broker banner
> - missing AdSense on content pages, or ads on funnel pages
> - email string anywhere in the repo or output
> - unrendered Liquid, invalid JSON-LD, search.json or feed.xml
> - unbalanced tags, duplicate IDs, more or fewer than one H1 per page
>
> Run functional browser tests on every calculator, the navigator, the multi-step funnel (including the fallback), filters and search. Take desktop, mobile and dark-mode screenshots.
>
> Then: push to main → Settings → Pages → Deploy from branch `main` / root → set DNS → enforce HTTPS. Submit the sitemap in Search Console. Add the site in AdSense and request review. Activate FormSubmit by submitting one form and clicking the confirmation email.

### Phase 11 — Growth after approval

> 1. Specialty × city hub pages (start with the top 20 metros × 6 high-CPL specialties) carrying real local information.
> 2. Recruit 2–3 licensed reviewers and show reviewer bylines.
> 3. Turn on Stripe/PayPal support links and a supporters wall.
> 4. Add a lightweight lead-routing sheet or CRM, and invoice clinics monthly.
> 5. Add Spanish and Hindi versions of the navigator and top tools.
> 6. Launch the weekly newsletter with one sponsor slot.
> 7. Add a YouTube channel of tool walkthroughs, embedded back into tool pages.
> 8. Add manual AdSense units (in-article, below the result panel) once Auto ads data shows the winners.
