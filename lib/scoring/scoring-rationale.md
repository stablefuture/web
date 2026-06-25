# Pathway Test — scoring rationale (v2)

Audit trail for `scoring.yaml` v2. Each entry feeds the quiz's verdict panel:
**2–3 specific data points + £-figure anchor + 1-line tier explanation.**

Sources are §-references into `docs/research/job-market.md` unless noted. Edit
this file when the research evolves; the quiz reads `rationale_key` from
`scoring.yaml` and pulls the matching entry here.

Two sections:
- **Sectors** — shown when user is sector-sure but job-unsure.
- **Paths** — shown when user matches a specific (sector + job).

---

# Sectors

## sector_uni_healthcare_practitioner
- Anthropic §3 Healthcare practitioners 0.60T / 0.05O — large gap; work is
  physical, regulated and high-tacit.
- UK structural shortage across NHS (260–360k unfilled by 2036/37, §4.1);
  social-care 470k posts needed by 2040.
- **Default reading (job unsure):** exposure_score 2, tier 2. Specific jobs
  (medicine, nursing, dentistry, vet, optometry, physio/OT, midwifery,
  pharmacy, paramedic) score individually — see paths.

## sector_uni_engineering
- Anthropic §3 Architecture & engineering 0.85T / 0.05O — high theoretical
  exposure but observed coverage near zero; Chartered sign-off + on-site
  responsibility hold the moat.
- Demand drivers: National Grid £35bn programme (§4.4), £75bn defence SDR
  (§4.5), hyperscale DC capex (§4.3).
- **Default reading (job unsure):** exposure_score 3, tier 2. Specific jobs
  (civil, mech/aero, elec, architecture, building surveying, town planning)
  score individually — see paths.

## sector_uni_compsci_maths
- Anthropic §3 Computer & maths **0.90T / 0.35O** — **the bullseye AI-exposure
  category** (§3). Highest observed-coverage rating in the table.
- Brynjolfsson Aug 2025: 13% employment drop in the 22–25 SWE cohort 2022→25;
  graduate intake at top firms down 30%+ (§2.3, §2.4).
- **Default reading (job unsure):** exposure_score 9, tier 4. The modal
  CS/AI/maths graduate route is the most-exposed white-collar entry pipeline
  in the doc. Surviving niches (AI safety, embedded, cleared cyber) require
  early specialisation — see paths.

## sector_uni_natural_sciences
- Anthropic §3 Life & social sciences 0.80T / 0.10O — high theoretical
  exposure on research/analysis tasks; tenure-track academia shrinking
  independently (§3).
- Modal landing for chem/bio/physics grads is lab work, regulatory science or
  pivot into business / data — most of which are exposed routes.
- **Default reading (job unsure):** exposure_score 6, tier 3. Real career
  ceiling is constrained unless paired with a regulated specialism (pharmacy,
  clinical biochem, medical physics) — see paths.

## sector_uni_business_finance
- Anthropic §3 Business & finance 0.95T / 0.30O — among the most exposed.
- Big-4 UK grad intake 2025: KPMG −29%, EY −11%, PwC −6%, Deloitte −18%;
  job adverts −44% YoY (§2.4).
- **Default reading (job unsure):** exposure_score 9, tier 4. The graduate
  funnel is contracting structurally, not cyclically. Audit sign-off doesn't
  move the needle on AI displacement of the analyst layer.

## sector_uni_law
- Anthropic §3 Legal 0.90T / 0.20O — document review, contract drafting and
  case-law search are exactly what LLMs are best at (§3, §7 Tier 4).
- Specialist barrister (commercial / chancery / regulatory) survives but the
  pupillage funnel is brutally competitive and outcome-binary (§7 row 17).
- **Default reading (job unsure):** exposure_score 8, tier 4. The generic LPC
  route does not survive default-case; specialist bar is a narrow exception.

## sector_uni_humanities
- Modal humanities-graduate landing is Office & admin (Anthropic 0.90T /
  0.35O) — the single most-exposed white-collar category (§3).
- No direct vocational route from the degree itself; pay typically starts
  £24–28k in an admin or service role.
- **Default reading (job unsure):** exposure_score 8, tier 4. Humanities is
  valuable for the student personally; not a default route to a UK middle-
  class career under AI. Pair with a hard skill / regulated qualification.

## sector_uni_arts_creative
- Anthropic §3 Arts & media 0.80T / 0.20O — generative tools have collapsed
  the baseline for creative production work; middle-tier hollowing out (§3).
- Bimodal pay outcomes: top 1% fine, middle wiped out. Not a default plan.
- **Default reading (job unsure):** exposure_score 7, tier 4. Surviving niches
  (top-end performance, narrow specialism, owned creative business) are rare;
  marketing/media analyst route is exposed (see `uni_marketing`).

## sector_uni_social_sciences
- Anthropic §3 Life & social sciences 0.80T / 0.10O on the research/analyst
  side; relational practice (social work, counselling) is more resistant.
- Regulated practice routes (clinical psych, social work) have specialist
  moats; generic BSc does not.
- **Default reading (job unsure):** exposure_score 6, tier 3. Hedge — useful
  if paired with a regulated post-grad path (DClinPsy, SWE registration);
  weak as a standalone default.

## sector_uni_education
- Anthropic §3 Education & library 0.60T / 0.20O — relational content
  provides partial moat; pay constrained by state funding (§3, §7 Tier 3).
- Recession-resistant, pension-bearing, ageing workforce.
- **Default reading (job unsure):** exposure_score 5, tier 3. Strong R and
  pension; pay ceiling is the constraint — middle-class but not affluent.

## sector_uni_undecided
- "Undecided on subject" defaults to the modal graduate landing, which is
  Office & admin (Anthropic 0.90T / 0.35O) — the most-exposed category.
- The action item here is **the 30-min call**, not the quiz score.
- **Default reading:** exposure_score 8, tier 4. Treat as a planning gap that
  compounds. Y9–Y10 normal; Y12–Y13 = book the call.

## sector_uni_other
- "Other (not listed)" means the user has a specific uni subject in mind that
  isn't in the rubric yet. Free text captured for analytics + future inclusion.
- No Anthropic mapping until the subject is identified.
- **Default reading:** exposure_score 6, tier 3. Mid-risk placeholder — we
  can't say target or avoid without more info. The 30-min call resolves it
  case-by-case.

## sector_app_trades
- Anthropic §3 Installation & repair 0.20T / 0.00O **and** Construction
  0.20T / 0.00O — both among the most-resistant categories (§3).
- Statutory / regulatory moats (Part P, Gas Safe, F-Gas) keep human-in-loop
  install for the foreseeable horizon; replacement demand large (§4.2).
- **Default reading (job unsure):** exposure_score 1, tier 1. Trade
  apprenticeship is the highest-EV default category in the entire rubric.

## sector_app_engineering
- Anthropic §3 Architecture & engineering 0.85T / 0.05O; the engineering
  apprentice route lands in the same moat as the uni route, debt-free.
- Demand drivers same as uni engineering (DC capex, grid, defence).
- **Default reading (job unsure):** exposure_score 3, tier 2. Specific jobs
  (mech, elec, civil, aero) score individually — see paths.

## sector_app_defence_manufacturing
- Anthropic §3 Production 0.20T / 0.00O — resistant short-term (robotics
  threat is 2030s+); clearance adds a sovereign moat (§4.5).
- £75bn SDR + AUKUS / Dreadnought / Hinkley / SMR = decade-long demand.
- **Default reading (job unsure):** exposure_score 1, tier 1. The specialism
  (coded welder, cleared engineer) is where the moat is — see paths.

## sector_app_energy_utilities
- Anthropic §3 Architecture & engineering 0.85T / 0.05O on the engineering
  side; Installation & repair 0.20T / 0.00O on the install side.
- National Grid £35bn programme; 25% utilities workforce retiring this
  decade; SMR fleet build; offshore wind 55–112k jobs by 2030 (§4.4).
- **Default reading (job unsure):** exposure_score 2, tier 1. Sovereign /
  regulated / physical / retirement-pulled.

## sector_app_aviation_maritime
- Anthropic §3 Transportation 0.10T / 0.00O — autonomy regulated extremely
  conservatively in aviation and maritime; named-person certification (§4.11,
  §4.12).
- UK MRO acute shortage; worldwide ship-officer shortage; Air Service
  Training collapse (Apr 2025) cut Part-66 training capacity 20%.
- **Default reading (job unsure):** exposure_score 2, tier 1. Most under-
  known high-EV sector in the doc — see `app_aircraft_maintenance`,
  `app_merchant_navy`, `app_pilot`.

## sector_app_protective_services
- Anthropic §3 Protective service 0.30T / 0.00O; statutory authority +
  defined-benefit pensions = sovereign moat (§4.9).
- Workforce gaps: police −YoY first time since 2018; fire 60% retirement
  leavers; armed forces 64% of recruitment target.
- **Default reading (job unsure):** exposure_score 1, tier 2. Pay ceiling
  modest but pension is among the most valuable in UK; direct entry at 18.

## sector_app_healthcare
- Anthropic §3 Healthcare practitioners 0.60T / 0.05O + Healthcare support
  0.30T / 0.05O — both physical, regulated, demographically-pulled.
- NHS shortfall 260–360k by 2036/37 (§4.1); degree-apprentice routes
  (Nursing, allied health) avoid debt — same destination as uni, debt-free.
- **Default reading (job unsure):** exposure_score 2, tier 1. Strongest
  combined R+D+S of any apprentice sector for an academically-able student.

## sector_app_business_digital
- Same Anthropic exposure as `sector_uni_business_finance` /
  `sector_uni_compsci_maths` — apprentice route doesn't change the
  underlying job risk; target market is what determines the score.
- Apprentice format is good (debt-free, earning); the *job* is exposed.
- **Default reading (job unsure):** exposure_score 9, tier 4. Pivot to
  embedded / cleared / regulated niches if route is sticky — see paths.

## sector_app_surveying_planning
- Anthropic §3 Architecture & engineering 0.85T / 0.05O; Chartered MRICS /
  RTPI registration is the moat (§7 rows 25, 26).
- Building Safety Regulator (post-Grenfell) hardens the building-surveyor
  moat specifically; QS partially exposed to BIM / AI cost-estimation.
- **Default reading (job unsure):** exposure_score 4, tier 2. Building
  surveying / town planning are stronger than QS — see paths.

## sector_app_undecided
- "Undecided on apprenticeship sector" — defaults toward the apprenticeship
  *category* average, which is generally less AI-exposed than uni (Anthropic
  Installation & repair 0.20T / 0.00O as anchor).
- The action item is the 30-min call to map to a specific trade / sector.
- **Default reading:** exposure_score 5, tier 3. Even the "I'm not sure which
  apprenticeship" answer scores better than most uni defaults.

## sector_app_other
- "Other (not listed)" means the user has a specific apprenticeship sector
  in mind that isn't in the rubric yet. Free text captured for analytics +
  future inclusion.
- Apprenticeship-direction baseline is less AI-exposed than uni, so the
  default leans slightly lower than `sector_uni_other`.
- **Default reading:** exposure_score 4, tier 3. Mid-risk placeholder — the
  30-min call identifies the specific sector and scores it live.

## sector_work_care
- Anthropic §3 Personal care 0.20T / 0.00O — physical, relational, robotics-
  resistant for decades; demographics tailwind (§4.1).
- 1.71M jobs, 111k vacancies (7%), 24.7% annual turnover; 470k posts needed
  by 2040.
- **Default reading (job unsure):** exposure_score 2, tier 1. Strong sector
  but the *role* is low-pay — use as a stepping stone into NDA / PA / social
  work apprentice within 2–3 years.

## sector_work_retail
- Anthropic §3 Sales 0.60T / 0.30O — mid-exposure category; in-person retail
  resists displacement at the point of sale, but supervisory and stock-
  control layers don't.
- Modal Y9–Y13 first job; permanent in this sector means flat real wages and
  no career ladder (§4.8).
- **Default reading (job unsure):** exposure_score 7, tier 4. Useful as part-
  time alongside study; get an exit plan within 12 months.

## sector_work_hospitality
- Anthropic §3 Food & serving 0.20T / 0.00O — physical, relational, robotics-
  resistant on a 10y+ horizon.
- Pay floors stuck at NLW (£11.44/h adult, 2024); no career ladder without
  leaving the sector or moving into management.
- **Default reading (job unsure):** exposure_score 3, tier 4. **Low AI risk
  but low career value** — the tier reflects no progression ceiling, not AI
  displacement. Useful part-time alongside study.

## sector_work_office_admin
- Anthropic §3 Office & admin 0.90T / 0.35O — **the single most-exposed
  white-collar category** in the doc; PAYE RTI retail/admin shrinkage
  already underway (§2.2, §3).
- Customer service / SDR is even more exposed; entry-level admin is the
  modal job being deleted.
- **Default reading (job unsure):** exposure_score 10, tier 4. Treat as a
  holding pattern, not a destination.

## sector_work_construction
- Anthropic §3 Construction 0.20T / 0.00O — physical, robotics-resistant for
  decades.
- Labouring/groundwork is *the* entry point into the trades (electrician,
  plumber, brickwork etc.) at 18–20 without a formal apprenticeship slot.
- **Default reading (job unsure):** exposure_score 2, tier 3. Use it as a
  6–24-month stepping stone to a Tier 1 apprenticeship — not a destination.

## sector_work_driving
- Anthropic §3 Transportation 0.10T / 0.00O on capability; **but** RL-amenable
  and autonomy already partial (driverless metros, supervised trucking) —
  regulatory pace is the only delay (§3).
- Driver licensing creates a short-term moat; long-term it doesn't survive.
- **Default reading (job unsure):** exposure_score 7, tier 4. 5–10y category
  compression on the horizon — don't anchor a career here.

## sector_work_undecided
- "Undecided on work sector" likely lands in retail / hospitality / admin —
  the modal school-leaver outcome, two of which are heavily AI-exposed.
- **Default reading:** exposure_score 8, tier 4. Book the call to map to a
  specific sector or to flip the direction toward an apprenticeship.

## sector_work_other
- "Other (not listed)" means the user has a specific work sector in mind that
  isn't in the rubric yet. Free text captured for analytics + future inclusion.
- Most school-leaver "other" sectors land in service / clerical work with
  limited career ladder, so the default tier is 4 (career-ceiling, not AI).
- **Default reading:** exposure_score 6, tier 4. The 30-min call resolves the
  specific sector and either upgrades the score or maps to an apprenticeship.

## sector_undecided
- "Undecided on everything" — no signal, default to high-risk because the
  modal graduate / school-leaver outcome is the AI-exposed white-collar funnel.
- **Default reading:** exposure_score 8, tier 4. The action item is the
  30-min call — use it to map a specific direction.

## sector_other
- "Other" = the path is bespoke / not in the standard taxonomy. The scoring
  rubric cannot generate a meaningful tier without specifics.
- **Default reading:** exposure_score 8, tier 4. The 30-min call is the
  entire value here — explain the specific situation and we score it live.

---

# Paths

## uni_medicine
- NHS shortfall 260–360k posts by 2036/37; 100k currently unfilled (§4.1).
- Regulated practitioner; physical exam + clinical judgement = robotics- and
  agent-resistant (Anthropic 0.60T / 0.05O).
- **Pay anchor:** £70–100k qual'd salaried (ASHE 2211/2212 £70k); £100k+
  partner / consultant base / private.
- **Tier 2:** high R, S and D — but 5y med school + 5–10y training is long,
  debt-loaded; suits academically strong + temperamentally suited only.

## uni_nursing
- NHS shortfall 260–360k by 2036/37; 100k unfilled now; Skills Imperative
  projects +10.8% workforce growth 2024→35 (§4.1).
- Regulated (NMC), physical + relational, low AI exposure (0.60T / 0.05O).
- **Pay anchor:** £29k Band 5 → £47k Band 7 → £55–80k consultant nurse.
- **Tier 1:** structural NHS shortage + regulated + degree-apprentice route
  (debt-free at Band 5 entry) makes this one of the strongest uni paths.

## uni_midwifery
- Same NMC registration + NHS shortage profile as nursing; midwives sit
  inside the broader workforce-plan funding (§4.1).
- Anthropic Healthcare practitioners 0.60T / 0.05O.
- **Pay anchor:** £29k Band 5 → £47k Band 7 consultant midwife.
- **Tier 1:** regulated, physical, demographic + statutory demand; entry from
  18 via BSc or degree apprenticeship.

## uni_dentistry
- UK dentist supply constrained; NHS dentistry throughput crisis; high
  private-pay ceiling (§4.1, §7).
- Regulated (GDC), physical, robotics-resistant for decades.
- **Pay anchor:** £60k associate; £80k+ NHS principal; £120k+ private partner.
- **Tier 2:** strong D/S/R; long study route (5y BDS + foundation) drags Y.

## uni_vet
- Acute UK vet shortage; RCVS workforce data; physical + regulated.
- Anthropic Healthcare practitioners 0.60T / 0.05O — large gap, plus
  physicality / regulation moat.
- **Pay anchor:** £35k new grad → £50–75k experienced → £80–120k partner.
- **Tier 2:** strong R/S; long study route (5y), demand is steady not booming.

## uni_optometry
- Ageing demographics drive eye-exam volume; regulated (GOC); robotics-
  resistant physical exam (§7 row 12).
- AOP / College of Optometrists data: chronic FT recruitment difficulty in
  independents; chain locum market is liquid.
- **Pay anchor:** £35k qual'd → £45–65k experienced (ASHE 2252 median £39k) →
  £80–120k practice owner.
- **Tier 2:** physical regulated exam = strong R; demand demographic-driven.

## uni_physio_ot
- NHS Long-Term Workforce Plan funds allied-health expansion; ageing-driven
  demand (§4.1).
- Anthropic Healthcare practitioners 0.60T / 0.05O; degree-apprentice route
  avoids debt.
- **Pay anchor:** £28k trainee → £40–55k qual'd → £55–75k specialist.
- **Tier 1:** R, S and D all strong; degree-apprentice route lifts Y vs
  conventional BSc.

## uni_pharmacy
- Regulated (GPhC); community pharmacy supply constrained; NHS pharmacist
  prescribing role expanding (post-2024 NHS England prescribing pathway).
- Anthropic exposure mixed — dispensing partially automated by robotics +
  ePrescribing, but consultations and prescribing decisions are regulated and
  relational.
- **Pay anchor:** £35k newly qual'd → £45–55k senior; £55–70k specialist /
  hospital band 7; £80k+ pharmacy owner.
- **Tier 2:** R partial (dispensing automation eating into traditional role)
  but the prescribing pathway preserves long-term demand. Strong S and D.

## uni_paramedic
- NHS ambulance service shortage; degree-apprentice route opening up; HCPC
  registered.
- Anthropic Healthcare practitioners 0.60T / 0.05O — physical, time-critical,
  relational decisions in the field.
- **Pay anchor:** £28k newly qual'd Band 5 → £40k Band 6 specialist → £50k+
  advanced practitioner.
- **Tier 2:** physical + regulated + demographic-pulled; Band ceiling is the
  pay constraint.

## uni_civil_eng
- National Grid £35bn programme; water, transport, housing capex underway
  (§4.4).
- Anthropic Architecture & engineering 0.85T / 0.05O — large gap; site
  responsibility + Chartered sign-off hedge AI exposure to design.
- **Pay anchor:** £28k grad → £45–60k qual'd → £65–95k chartered.
- **Tier 2:** Chartered moat partial; design tools are AI-exposed but on-site
  judgement + statutory sign-off survive.

## uni_mech_aero_eng
- Defence £75bn SDR; BAE / Rolls-Royce / Babcock hiring at scale; aerospace
  fleet expansion (§4.5).
- Anthropic Architecture & engineering 0.85T / 0.05O; security-cleared work
  has the strongest moat.
- **Pay anchor:** £28k grad → £45–60k qual'd → £70–95k principal.
- **Tier 1:** defence/sovereign-capability demand + physical product +
  clearance = full marks on D, S, R; long degree drags Y.

## uni_elec_eng
- Hyperscale data-centre capex committed (Microsoft, Google, AWS multi-bn UK
  announcements); National Grid £35bn programme; SMR fleet build (§4.3, §4.4).
- Anthropic Architecture & engineering 0.85T / 0.05O.
- **Pay anchor:** £28k grad → £45–60k qual'd → £70–110k SMR / DC commissioning.
- **Tier 1:** AI capex IS the demand driver here — every hyperscale watt needs
  electrical engineers. Strongest forward-looking case in the doc.

## uni_architecture
- Anthropic Architecture & engineering 0.85T / 0.05O, but design-side
  workflows (CAD, BIM, conceptual generation) more AI-exposed than civil eng.
- RIBA Chartered registration creates a regulatory moat for sign-off but not
  for the production work that fills the entry years.
- **Pay anchor:** £25k Part 1 → £35k Part 2 → £45–55k Part 3 qual'd → £60–80k
  senior architect.
- **Tier 3:** long debt-loaded route (5–7y), early-career design work most
  AI-exposed; chartered practice partial moat. Hedge.

## uni_computer_science
- Anthropic Computer & maths 0.90T / **0.35O** — the bullseye AI-exposure
  category (§3).
- Brynjolfsson Aug 2025: 13% employment drop in the 22–25 SWE cohort 2022→25;
  graduate intake at top firms down 30%+ (§2.3, §2.4).
- **Pay anchor:** £30–45k grad → was £60–80k mid-career → trajectory now
  uncertain; lab-internal ML safety / embedded niches survive at very low
  headcount.
- **Tier 4:** highest-exposure white-collar route. ML infra / AI safety
  niches survive — the modal grad SWE role does not. Default is avoid.

## uni_ai_ml
- Recursive self-improvement (RSI) means ML engineering is among the *first*
  roles AI will wipe out, not the last (§7 Tier 4 row).
- Top frontier-lab "design the next model" niche persists at vanishingly small
  headcount; everything below it is being automated by the models.
- **Pay anchor:** £40–60k grad ML; £100–300k+ frontier lab (tiny pool).
- **Tier 4:** RSI exposure is *structural* not cyclical. Specialist pivot into
  AI safety / alignment research is the survivable subset (see `uni_ai_safety`).

## uni_cybersec
- Frontier AI is already capable of autonomous offensive and defensive cyber
  operations (Anthropic threat-research reporting, §7 Tier 4).
- Mid-skill SOC, pen-test, vuln-research work directly in firing line.
- **Pay anchor:** £30–45k grad SOC; £50–70k mid; cleared OT / CNI niche £70k+.
- **Tier 4:** the cleared, OT / critical-national-infrastructure subset
  retains a moat — generic cybersec route does not.

## uni_ai_safety
- §6: large absolute pay at top firms (£100–300k+) but very small absolute
  pool; rewards only top entrants.
- ASHE 2162 researcher median £42k confirms the niche-vs-bucket gap —
  frontier-lab pay is not in ASHE.
- **Pay anchor:** £100–300k+ frontier lab; £40–70k policy / academic-track.
- **Tier 3:** worth pursuing for absolute top students (maths/CS/philosophy);
  not a pipeline strategy.

## uni_accounting_finance
- KPMG −29%, EY −11%, PwC −6%, Deloitte −18% UK grad intake in 2025;
  job adverts −44% YoY (§2.4).
- Anthropic Business & finance 0.95T / 0.30O — among the most exposed.
- **Pay anchor:** £30–35k grad scheme; once-default mid-career £55–70k under
  pressure; partner still survives but the funnel doesn't.
- **Tier 4:** structural, not cyclical. Audit sign-off doesn't move the needle
  on AI-displacement of the analyst funnel.

## uni_quant_finance
- Quant / hedge fund / IB roles are exactly the cognitive tasks AI accelerates
  fastest — alpha generation, model building, execution research (§7 Tier 4).
- Top frontier hedge fund / prop shop intake survives at very low headcount;
  the broader quant-analyst route does not.
- **Pay anchor:** £80–120k grad-year at top firms (tiny pool); broader quant-
  analyst £55–80k under structural pressure.
- **Tier 4:** elite niche survives at vanishingly small headcount; the
  modal route does not. Pair with bespoke specialism if pursued.

## uni_marketing
- Anthropic Arts & media 0.80T / 0.20O; mid-tier hollowing out, bimodal pay
  (§7 Tier 4).
- Generative tools have collapsed copywriting / creative-asset baselines.
- **Pay anchor:** £25–32k grad; mid-tier flat; senior brand £50–70k where it
  exists.
- **Tier 4:** generalist marketing route is among the more exposed white-
  collar routes; performance / data-marketing niche survives narrowly.

## uni_law
- Document review and contract drafting are exactly what LLMs are best at
  (Anthropic Legal 0.90T / 0.20O).
- Specialist barrister (commercial / chancery / regulatory) excepted — but the
  pupillage funnel is brutally competitive and binary (§7 row 17).
- **Pay anchor:** £30–55k mid-tier solicitor; £80–150k elite commercial junior
  bar (ASHE 2411 all-bar median £34k confirms the long tail).
- **Tier 4:** generic LPC route does not survive. Specialist bar is a Tier 2
  exception with binary outcome risk.

## uni_psychology
- Anthropic Life & social sciences 0.80T / 0.10O — high theoretical exposure;
  tenure-track shrinking independently.
- Clinical psychology (DClinPsy) is a hedge — small intake, regulated, but
  long competitive route.
- **Pay anchor:** £25–30k grad; £45–55k clin psych Band 7; £65–80k consultant.
- **Tier 4 default (Tier 3 if clinical-pathway committed):** generic
  psychology BSc lacks moat; the DClinPsy subset is a separate, narrower bet.

## uni_social_work
- Social Work England registration; 20% children's-services vacancy rate;
  LGPS defined-benefit pension (§4.14, §7 Tier 3).
- Anthropic Social services 0.50T / 0.05O — relational, statutory, resistant.
- **Pay anchor:** £32k NQ → £40–45k experienced → £55–75k principal /
  service manager.
- **Tier 3:** strong R + regulated; pay ceiling lower than Tier 1/2 because LA
  funding is the constraint. Degree-apprentice route (`app_social_work_*`)
  preferred over uni route for debt reasons.

## uni_education
- Recession-resistant, pension-bearing, ageing teacher workforce (§7 Tier 3).
- Anthropic Education & library 0.60T / 0.20O — relational content provides
  partial moat.
- **Pay anchor:** £30k NQT → £45k UPS3 → £55–75k UK state ceiling; £80–120k
  top private.
- **Tier 3:** strong R, pension is valuable; pay ceiling is the constraint —
  middle-class but not affluent.

## uni_building_surveying
- 9-in-10 surveyors report skills shortages; building surveying among the most
  acute (§4.13).
- Building Safety Regulator (post-Grenfell) requires named human sign-off —
  hardens the moat specifically for building surveying vs. QS.
- **Pay anchor:** £20–25k degree apprentice → £42–65k qual'd MRICS → £60–80k
  senior → six-figure FRICS / partner.
- **Tier 2:** strong on R / D / S; Chartered moat plus statutory sign-off.

## uni_town_planning
- Chronic LA planning shortages; statutory planning regime is democratically
  protected; appeals & inquiries human-led (§4.13).
- RTPI chartership; planning decisions sit inside political/legal context AI
  can't replace.
- **Pay anchor:** £20–25k apprentice / £28–32k grad → £45–75k qual'd → £80–
  110k senior LA / Planning Inspector / consultancy.
- **Tier 2:** statutory authority + chartership = high R; LA funding caps the
  pay ceiling.

## app_electrician
- UK Electrical Contractors' Association: net workforce shrinking even as
  EV / PV / heat-pump / data-centre M&E demand explodes (§4.2, §4.3).
- Part P regulatory moat keeps human-in-loop install; Anthropic Installation &
  repair 0.20T / 0.00O.
- **Pay anchor:** £20k apprentice → £45k qual'd → £70–120k self-employed /
  specialist.
- **Tier 1 — top pick (12/12):** AI capex + retirements + regulation = best
  R+Y+D+S balance in the doc. Apprentice from 16.

## app_plumber_heating
- Future Homes Standard tripling heat-pump install (new-build only since
  existing-home ban scrapped); 41,600 net new heating engineers needed by 2033
  (§4.2).
- Gas Safe regulatory moat; Anthropic Installation & repair 0.20T / 0.00O.
- **Pay anchor:** £20k apprentice → £40k qual'd → £55–80k specialist; £70k+
  self-employed.
- **Tier 1:** physical + regulated + retirement-pulled. Heat-pump bull case
  softer than 18 months ago (boiler-ban policy reversal) but demand still real.

## app_gas_engineer
- Gas Safe registration is a named-person regulatory moat; gas installation
  unaffected by the heat-pump policy debate (existing-home boiler ban
  scrapped).
- 21M UK gas-heated households need ongoing service / repair / installation
  for 15+ years; ageing engineer workforce.
- **Pay anchor:** £20k apprentice → £40k qual'd → £55–75k specialist;
  self-employed £70k+.
- **Tier 1:** same regulatory + physical + retirement profile as plumbing;
  more bullet-proof on demand because not policy-dependent.

## app_specialist_trade
- Construction labour permanently short; **"become a plumber" is the default
  career-advice** — the generic trade is well-trodden (§7 row 16).
- **Specialisms (heritage carpenter, defence-cleared scaffolder, listed-
  building brick) are overlooked and where the moat is.** Robotics resistance
  very high (bricklaying robots emerging in research only).
- **Pay anchor:** £20k apprentice → £35–45k qual'd → £55–80k self-employed.
- **Tier 2:** strong R + Y; D/S are 2 because the generic route is crowded.
  Push the student toward a specialism, not the default.

## app_coded_welder
- Defence Nuclear Enterprise → 65k jobs by 2030; Babcock alone needs +5,500;
  AUKUS / Dreadnought / Hinkley / SMR (§4.10).
- Generic welding is *not* in shortage; **coded + cleared = binding constraint**.
- **Pay anchor:** £22k apprentice → £45–60k qual'd → £80–110k+ specialist
  (AUKUS / SMR).
- **Tier 1:** specialism is the moat. Frame the coded + cleared specialism,
  not the trade. Apprentice from 16.

## app_hvac
- Data-centre cooling (AI capex driver), supermarkets, healthcare; F-Gas
  certification gating (§4.2, §7 row 7).
- Anthropic Installation & repair 0.20T / 0.00O; adjacent to electrician /
  plumber moat.
- **Pay anchor:** £22k apprentice → £42k qual'd → £55–75k specialist.
- **Tier 2:** regulated, physical, AI-capex-pulled via DC cooling.

## app_aircraft_maintenance
- Acute UK MRO shortage; ~20% training capacity lost to Air Service Training
  collapse (Apr 2025); RAeS evidence (§4.11).
- Part-66 licence is named-person, type-rated, periodically re-certified —
  strong regulatory moat; Anthropic Installation & repair 0.20T / 0.00O.
- **Pay anchor:** £25–35k unlicensed → £60,880 avg B1 licensed → £85–110k
  multi-type / senior.
- **Tier 1:** licensed segment is the binding constraint, regulation is the
  most conservative globally. Apprentice from 16.

## app_pilot
- Pilot supply constrained; commercial autonomy regulated extremely
  conservatively; physically present, licenced, judgement-bearing (§7 row 15).
- Two routes: BA/easyJet cadet (£25k+ cost) or RAF cadet (paid). RAF preferred
  for cost.
- **Pay anchor:** £25k cadet (commercial) or RAF salary → £55–90k First
  Officer → £90–180k captain.
- **Tier 1:** licensed + regulated + physical-presence + sovereign moat
  (RAF); commercial route faces cost barrier but is genuine career.

## app_merchant_navy
- Worldwide officer shortage; fully sponsored 3–4y cadetship (tuition +
  accommodation + food + salary, £12–18k); MCA Certificate of Competency
  (§4.12).
- Seafarers' Earnings Deduction = tax-free UK income at 183+ sea-days.
- **Pay anchor:** £12–18k all-found cadet → £28–35k jnr officer → £36–78k
  Chief → £50–120k+ Master / Chief Engineer.
- **Tier 1 — most under-known path in the doc.** Lifestyle (sea time) is the
  constraint, not the economics. Apply at 17–18.

## app_wind_turbine
- Offshore wind 55–112k jobs by 2030 (§4.4); work-at-height + sea-state
  hostile to robotics for decades.
- No clean SOC4 — sector-source judgement; route via electrical apprenticeship
  → GWO certifications.
- **Pay anchor:** £30k trainee → £45–55k offshore qual'd → £65–80k specialist
  (rotation premium).
- **Tier 1:** new enough that no incumbents exist (high Y); hostile environment
  + regulated certification = strong R/S.

## app_hv_grid
- National Grid £35bn programme; 25% utility workforce retiring this decade
  (§4.4).
- Security-cleared niches (CNI, SMR commissioning) add a sovereign moat on top
  of the engineering moat.
- **Pay anchor:** £25k apprentice → £55–85k qual'd → £70–110k SMR /
  commissioning; Chartered adds £20k+.
- **Tier 1:** retirement-pulled, capex-pulled, sovereign-pulled. Specialism
  (SMR / cleared CNI) is the moat.

## app_defence_engineering
- £75bn SDR funding; BAE / Rolls-Royce / Babcock hiring at scale; security-
  cleared work; long programme cycles (§4.5).
- Earn-while-you-learn degree apprentice = no student debt; sovereign-
  capability protected from AI / offshoring.
- **Pay anchor:** £22k apprentice (with funded degree) → £45–60k qual'd →
  £70–95k principal.
- **Tier 1:** clearance + sovereign + degree-apprentice = full marks on D/S/R;
  long programme tempo softens Y vs trade route.

## app_vehicle_technician
- ICE vehicle servicing demand declining as EV transition accelerates; EV
  servicing is different skill profile and partly takes work to manufacturer.
- Generic mechanic role faces structural decline; EV specialist is a hedge.
- **Pay anchor:** £18k apprentice → £30k qual'd → £35–45k senior; £45k+
  diagnostic / EV specialist.
- **Tier 3:** physical work resists AI directly; sector demand declining as
  fleet electrifies. Pivot to EV / hybrid specialism.

## app_nursing_degree
- Nursing Degree Apprenticeship = debt-free Band 5 entry; same demand drivers
  as `uni_nursing` (260–360k NHS shortfall by 2036/37, §4.1).
- Y axis lifts vs uni route — earning + qualifying simultaneously, no debt.
- **Pay anchor:** £29k Band 5 → £47k Band 7 → £55–80k consultant nurse.
- **Tier 1:** strongest healthcare entry route — same destination as uni
  nursing but earns while learning and avoids debt.

## app_dental_nurse_therapist
- Dental therapist / hygienist supply constrained; NHS dentistry throughput
  crisis pulls demand into adjacent registered roles (§7 row 10).
- Heavy PT prevalence in dental hygiene — ASHE residual SOC bucket suppresses
  apparent median; doc bands hold against BDA salary surveys.
- **Pay anchor:** £18k dental nurse apprentice → £30k qual'd dental nurse →
  £40–55k qual'd therapist / hygienist → £60–80k private high-end.
- **Tier 1:** apprentice ladder leads to a regulated, physical, demographic-
  pulled allied-health role with strong private-pay ceiling.

## app_vet_nurse
- RCVS workforce model projects 22% oversupply by 2035; BVNA contests on
  scope-of-practice grounds (§4.15, §7 row "Veterinary nurse").
- Anthropic Healthcare practitioners 0.60T / 0.05O — relational/physical,
  AI-resistant — but supply outpacing demand caps the upside.
- **Pay anchor:** £18k apprentice → £24k qual'd RVN → £28–32k senior; £35k+
  head nurse.
- **Tier 3:** strong R, weak S (RCVS oversupply projection). Vet (the doctor)
  is the higher-EV veterinary path — see `uni_vet`.

## app_police
- First YoY police workforce decline since 2018; voluntary resignations 53%
  of leavers (§4.9).
- Statutory powers + defined-benefit Police Pension; direct entry at 18 or
  PEQF degree-apprentice route.
- **Pay anchor:** £28–30k constable → £45–50k sergeant → £55–65k inspector;
  £65–100k+ chief inspector.
- **Tier 2:** sovereign + statutory + pension; binding constraint is retention
  not recruitment (which is your opportunity).

## app_firefighter
- Retirement = 60% of wholetime leavers; on-call pool fragile (§4.9).
- NJC pension; statutory protective service; direct entry at 18.
- **Pay anchor:** £27,750 trainee → £37,397 competent → £42–55k crew / watch
  manager.
- **Tier 2:** physical + sovereign + pension; lower pay ceiling than police
  but stronger Y for physical-capacity-first entry.

## app_armed_forces
- Recruitment running at 64% of target; ~5k net annual exit goes unreplaced
  (§4.9); £75bn SDR (§4.5).
- AFPS defined-benefit pension is among the most valuable in UK; **Armed
  Forces Gap Year (Mar 2026, £26k for under-25s) is a free-option entry.**
- **Pay anchor:** £25.2k Private → £39–50k Cpl → £45–56k Sgt → £52k WO2 →
  £60–71k WO1; officer scales higher.
- **Tier 1:** sovereign + statutory + pension + free-option gap year; strongest
  Y axis in the doc (physical capacity is the entry currency).

## app_building_surveyor
- Same demand profile as `uni_building_surveying`: 9-in-10 surveyors report
  skills shortages; building surveying among the most acute (§4.13).
- **Apprentice route is debt-free** — same MRICS destination as uni route.
- **Pay anchor:** £20–25k apprentice → £42–65k qual'd MRICS → £60–80k senior
  → six-figure FRICS / partner.
- **Tier 1:** Chartered + statutory sign-off (Building Safety Regulator) +
  debt-free route = highest-EV surveying path.

## app_town_planner
- Same demand profile as `uni_town_planning`: chronic LA planning shortages;
  statutory planning regime democratically protected (§4.13).
- RTPI chartership debt-free via apprenticeship route.
- **Pay anchor:** £20–25k apprentice → £45–75k qual'd → £80–110k senior LA /
  Planning Inspector / consultancy.
- **Tier 1:** statutory authority + RTPI chartership + debt-free = top
  apprentice route for academically-able student averse to trades.

## app_quantity_surveyor
- 93% of QS employers report recruitment difficulty (§7 Tier 3).
- **BUT** cost-estimation, BIM take-offs and drone-survey workflows are
  agentically exposed; chartered moat is partial.
- **Pay anchor:** £50k qual'd rising to £80k chartered/senior (ASHE 2453
  median £52k).
- **Tier 3 hedge:** building surveying (`app_building_surveyor` /
  `uni_building_surveying`) is the safer chartered route — same Chartered
  moat, less AI exposure.

## app_software_digital
- Same Anthropic Computer & maths 0.90T / 0.35O exposure as `uni_computer_
  science`; apprenticeship route doesn't change the underlying job risk (§3).
- Modal grad-SWE role is being deleted; apprentice version lands in the same
  market, often at lower pay.
- **Pay anchor:** £18–22k apprentice → £30–40k qual'd; mid-career flat.
- **Tier 4:** apprentice format is good; the *target job* is the issue. Pivot
  to embedded / cleared / specialist niches if route is sticky.

## app_accounting
- Same dynamics as `uni_accounting_finance`; AAT / ACA apprentice lands in
  the funnel the Big-4 are cutting (KPMG −29%, EY −11%, PwC −6%, Deloitte
  −18% in 2025, §2.4).
- **Pay anchor:** £18–22k apprentice → £28–35k qual'd; partner route binary.
- **Tier 4:** route is debt-free which helps personally; target market is
  shrinking faster than apprentice intake.

## work_care_worker
- 1.71M jobs, 111k vacancies (7%), 24.7% annual turnover; 470k care posts
  needed by 2040 (§4.1).
- Anthropic Personal care 0.20T / 0.00O; robotics-resistant for decades.
- **Pay anchor:** £21–24k starting; £25–28k senior care; route into HCA / PA
  / nursing via NDA apprenticeship lifts ceiling materially.
- **Tier 1 as an entry point — not as a career.** Use it as a stepping stone
  into NDA, PA route or social work degree apprentice within 2–3 years.

## work_retail
- Modal Y9–Y13 first job; permanent in retail = flat real wages and no career
  ladder (§4.8).
- Some AI exposure rising (self-checkout, automated ordering); in-person
  service work resists displacement at the point of sale.
- **Pay anchor:** £11.44/h adult minimum wage; £22–25k full-time; no upward
  ladder without moving into management or out of sector.
- **Tier 4 as a career; useful as part-time alongside study.** Plan exit
  within 12 months.

## work_hospitality
- Anthropic Food & serving 0.20T / 0.00O — low AI risk *per se* (the work is
  in-person, physical, relational).
- Pay floors stuck at NLW; no career ladder without moving into management.
- **Pay anchor:** £11.44/h NLW adult; £22–26k FT; £30–40k restaurant manager;
  hotel GM / chef-patron ceiling £50–70k.
- **Tier 4 as a career — but for *AI-displacement* reasons it's safer than
  retail.** Tier reflects pay ceiling + no progression, not AI risk. Useful
  part-time alongside study.

## work_office_admin
- Anthropic Office & admin 0.90T / 0.35O — **the single most exposed white-
  collar category** (§3).
- PAYE RTI shows retail / admin shrinkage already underway (§2.2).
- **Pay anchor:** £21–25k entry; mid-career flat; no defended ladder.
- **Tier 4:** the modal job being deleted. Treat as a holding pattern, not a
  destination.

## work_construction_labourer
- Anthropic Construction 0.20T / 0.00O — physical, robotics-resistant for
  decades.
- Labouring is a known entry point into the trades for school-leavers without
  a formal apprenticeship slot; many electricians / plumbers started this way.
- **Pay anchor:** £22–28k labourer (CSCS); £30–35k experienced groundworker;
  ceiling at £40k without trade qualification.
- **Tier 2 explicitly as a stepping stone — not as a destination.** Use it
  as a 6–24-month bridge to a Tier 1 apprenticeship.

## work_sales_sdr
- Anthropic Sales 0.60T / 0.30O — already substantially automated;
  Brynjolfsson finds steepest entry-level declines here (§3, §7 Tier 4).
- SDR / inside sales work is exactly what LLMs do well; field / enterprise
  sales has narrower moat.
- **Pay anchor:** £22–28k SDR base + commission; £40–60k AE; £80k+ enterprise
  AE (small pool, hard route).
- **Tier 4:** entry-level SDR is in the firing line; enterprise field sales
  is a narrow exception requiring specific industry knowledge.

## work_driving_delivery
- RL-amenable; autonomy already partial (driverless metros, supervised
  trucking); regulatory pace is the only delay (§3).
- Driver licensing creates short-term moat; long-term it doesn't survive.
- **Pay anchor:** £24–32k HGV; £18–24k delivery; gig economy variable.
- **Tier 4:** capability is here, deployment is paced by regulation. 5–10y
  horizon for category compression. Don't anchor a career here.

## undecided_default
- "Undecided" at Y9–Y10 is normal; at Y12–Y13 it's a planning gap that
  compounds.
- Default Tier 4 reflects that an *unspecified* path lands in the modal
  graduate funnel — which is the AI-exposed white-collar category.
- **Pay anchor:** n/a — depends entirely on direction chosen.
- **Tier 4 as a placeholder:** the action item is the 30-min call, not the
  score. Use the call to map a specific direction.

## other_default
- "Other" = path is bespoke / not in the standard taxonomy. The scoring rubric
  cannot generate a meaningful tier without specifics.
- **Pay anchor:** n/a.
- **Tier 4 as a placeholder:** the 30-min call is the entire value here —
  the parent / teen explains their specific situation and we score it live.
