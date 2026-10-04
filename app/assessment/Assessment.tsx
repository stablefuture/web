"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CareerCard, CareerExplorer } from "./Exploration";
import { PlanBuilder, PlanReport } from "./CareerPlan";
import { emptyPlan, readPlan, PLAN_KEY, SLOTS, type CareerPlan } from "./career-plan";
import { alexProfile } from "./test-profile";
import {
  APPRENTICESHIPS,
  DIMENSIONS,
  EDUCATION_PLANS,
  GRADES,
  MODEL_VERSION,
  QUESTIONS,
  STAGES,
  availableEducationPlanIds,
  initialProfile,
  interests,
  rankJobs,
  subjectEvidence,
  targetJobIds,
  visibleRoutes,
  linkedRoutes,
  type InterestData,
  type InterestArea,
  type Job,
  type Profile,
  type Qualification,
  type SpecificChoice,
} from "./model";
import styles from "./assessment.module.css";

const STEPS = ["Your starting point", "What you enjoy", "Your qualifications", "AI & connections", "Your career plan"];
const ROUTES = ["Keep my options open", "University", "Apprenticeship", "Straight into work"];
const PATHS = ["jobs", "degrees", "apprenticeships"] as const;
const PATH_LABELS = { jobs: "Jobs", degrees: "Degrees", apprenticeships: "Apprenticeships" };
const AI_OPTIONS = ["1 — I want to avoid AI-heavy work", "2 — I’d prefer less AI use", "3 — I don’t mind either way", "4 — I want to use AI often", "5 — I use AI heavily whenever it helps"];
const SALARY_OPTIONS = ["Not important", "Somewhat important", "Very important", "Top priority"];
const FEEDBACK_KEY = "stable-future-assessment-feedback-v1";
const unitKind = (unit: Job) => unit.path === "degrees" ? "Degree subject" : unit.path === "apprenticeships" ? `Level ${unit.level} apprenticeship` : "Career";

function Choices({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <fieldset className={styles.fieldset}><legend>{label}</legend><div className={styles.choices}>{options.map(option => <label key={option} className={`${styles.choice} ${value === option ? styles.chosen : ""}`}><input type="radio" name={label} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div></fieldset>;
}

const searchWords = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(word => word.replace(/s$/, ""));

function searchUnits(units: Job[], query: string) {
  const tokens = searchWords(query);
  if (!tokens.length) return [];
  const full = tokens.join(" ");
  const score = (label: string) => {
    const words = searchWords(label);
    const joined = words.join(" ");
    return joined === full ? 3 : joined.startsWith(full) ? 2 : tokens.every(token => words.some(word => word.startsWith(token))) ? 1 : 0;
  };
  return units.map((unit, index) => ({ unit, index, score: score(unit.label) || ((unit.aka ?? []).some(alias => score(alias)) ? .5 : 0) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(result => result.unit);
}

function SearchPicker({ label, search, setSearch, units, selected, onAdd, onRemove }: { label: string; search: string; setSearch: (value: string) => void; units: Job[]; selected: string[]; onAdd: (id: string) => void; onRemove: (id: string) => void }) {
  const [path, setPath] = useState<(typeof PATHS)[number]>("jobs");
  const matches = searchUnits(units.filter(unit => unit.path === path && !selected.includes(unit.id)), search).slice(0, 10);
  const query = search.trim();
  return <div className={styles.picker}>
    <span className={styles.pickerLabel}>{label}</span><div className={styles.pathTabs} role="group" aria-label="Path type">{PATHS.map(option => <button type="button" key={option} aria-pressed={path === option} onClick={() => { setPath(option); setSearch(""); }}>{PATH_LABELS[option]}</button>)}</div>
    <label className={styles.label}>Keyword<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${PATH_LABELS[path].toLowerCase()}`} /></label>
    {!!selected.length && <div className={styles.tags}>{selected.map(id => { const unit = units.find(item => item.id === id); return unit ? <button type="button" key={id} onClick={() => onRemove(id)}>{unit.label} <span>×</span></button> : null; })}</div>}
    {!!matches.length && <div className={styles.pickerResults}>{matches.map(unit => <button type="button" key={unit.id} onClick={() => { onAdd(unit.id); setSearch(""); }}><span>{unit.label}<small>{unitKind(unit)}</small></span><strong>Add +</strong></button>)}</div>}
    {!!query && !matches.length && <p className={styles.fine}>No matches. Try a broader term.</p>}
  </div>;
}

function NetworkAreaPicker({ areas, selected, onChange }: { areas: InterestArea[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return <div className={styles.picker}>
    <label className={styles.label}>Their career interest areas<select value="" onChange={event => { if (event.target.value) onChange([...selected, event.target.value]); }}><option value="">Choose an area</option>{areas.filter(area => !selected.includes(area.id)).map(area => <option key={area.id} value={area.id}>{area.label}</option>)}</select></label>
    {!!selected.length && <div className={styles.tags}>{selected.map(id => { const area = areas.find(item => item.id === id); return area ? <button type="button" key={id} onClick={() => onChange(selected.filter(areaId => areaId !== id))}>{area.label} <span>×</span></button> : null; })}</div>}
  </div>;
}

export default function Assessment() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [units, setUnits] = useState<Job[]>([]);
  const [data, setData] = useState<InterestData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [targetSearch, setTargetSearch] = useState("");
  const [interestPosition, setInterestPosition] = useState(0);
  const [resultSearch, setResultSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(36);
  const [notice, setNotice] = useState("");
  const [careerPlan, setCareerPlan] = useState<CareerPlan>(emptyPlan);
  const [resultView, setResultView] = useState<"explore" | "plan">("explore");
  const [browseOnly, setBrowseOnly] = useState(false);
  const [furthestStep, setFurthestStep] = useState(0);
  const restoredPlan = useRef(false);
  const [activeCareer, setActiveCareer] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextId = useRef(1);
  const sessionId = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    Promise.all(["/assessment-careers.json", "/assessment-direct-interests.json"].map(url => fetch(url, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json(); })))
      .then(([careerData, interestData]) => {
        setUnits(careerData.units); setData(interestData); setError("");
        if (!restoredPlan.current) {
          restoredPlan.current = true;
          try {
            const previous = readPlan(localStorage.getItem(PLAN_KEY));
            if (previous) { setCareerPlan(previous); setNotice("Your saved plan is available in My A/B/Z plan."); }
          } catch { /* Device storage is optional. */ }
        }
        const params = new URLSearchParams(window.location.search);
        setActiveCareer(params.get("career"));
        if (process.env.NODE_ENV === "development" && params.get("testUser") === "alex") {
          const sample = alexProfile(interestData);
          setProfile(sample);
          nextId.current = 4;
          setStep(4); setFurthestStep(4);
        }
      })
      .catch(() => { if (!controller.signal.aborted || !document.hidden) setError("We couldn’t load the career data. Your answers are still here. Please try again."); })
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [attempt]);

  useEffect(() => {
    const syncCareer = () => setActiveCareer(new URLSearchParams(window.location.search).get("career"));
    window.addEventListener("popstate", syncCareer);
    return () => window.removeEventListener("popstate", syncCareer);
  }, []);

  function exploreCareer(id: string | null) {
    setActiveCareer(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("career", id); else url.searchParams.delete("career");
    window.history.pushState({}, "", url);
  }

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile(current => ({ ...current, [key]: value }));
  const go = (nextStep: number) => { setStep(nextStep); setFurthestStep(current => Math.max(current, nextStep)); setNotice(""); window.scrollTo({ top: 0, behavior: "instant" }); setTimeout(() => heading.current?.focus(), 0); };
  const jobs = useMemo(() => units.filter(unit => unit.path === "jobs"), [units]);
  const ranked = useMemo(() => data ? rankJobs(jobs, data, profile, units) : [], [jobs, data, profile, units]);
  const vectors = interests(profile.answers);
  const flat = Math.max(...vectors) - Math.min(...vectors) < 6;
  const qualificationSummary = subjectEvidence(profile.qualifications);
  const educationPlanIds = availableEducationPlanIds(profile.stage);
  const selectedTargets = profile.targetIds.map(id => units.find(unit => unit.id === id)).filter((unit): unit is Job => !!unit);
  const networkAreas = data?.areas.filter(area => profile.networkAreaIds.includes(area.id)) ?? [];
  const pursuedAreas = data?.areas.filter(area => profile.specificInterests[area.id] === "pursue") ?? [];
  const isBroadInterest = interestPosition < QUESTIONS.length;
  const broadQuestion = isBroadInterest ? QUESTIONS[interestPosition] : null;
  const specificIndex = interestPosition - QUESTIONS.length;
  const specificArea = !isBroadInterest ? data?.areas[specificIndex] : null;
  const resultQuery = resultSearch.trim().toLowerCase();
  const ordered = useMemo(() => {
    const targets = targetJobIds(units, profile.targetIds);
    const results = browseOnly
      ? jobs.map(job => ({ job, target: targets.has(job.id), matchedAreas: [], dimensions: [] }))
        .sort((a, b) => Number(b.target) - Number(a.target) || a.job.label.localeCompare(b.job.label))
      : ranked;
    return results.filter(result => !hidden.includes(result.job.id) && (!resultQuery || [result.job.label, ...(result.job.aka ?? []), ...result.matchedAreas.map(area => area.label)].some(value => value.toLowerCase().includes(resultQuery))))
      .sort((a, b) => Number(saved.includes(b.job.id)) - Number(saved.includes(a.job.id)));
  }, [ranked, jobs, units, profile.targetIds, browseOnly, hidden, resultQuery, saved]);
  const shown = ordered.slice(0, visibleCount);
  const hasPartialQualification = profile.qualifications.some(qualification => !qualification.subject.trim() || !qualification.grade.trim());
  const plan = EDUCATION_PLANS[profile.educationPlan || "unsure"];

  function answerBroadInterest(rating: number) {
    update("answers", profile.answers.map((answer, index) => index === interestPosition ? rating : answer));
    setInterestPosition(position => position + 1);
  }

  function answerSpecificInterest(choice: SpecificChoice) {
    if (!specificArea) return;
    update("specificInterests", { ...profile.specificInterests, [specificArea.id]: choice });
    if (specificIndex < (data?.areas.length ?? 0) - 1) setInterestPosition(position => position + 1);
    else go(2);
  }

  function previousInterest() {
    if (interestPosition > 0) setInterestPosition(position => position - 1);
    else go(0);
  }

  function setStage(stage: string) {
    const available = availableEducationPlanIds(stage);
    setProfile(current => ({ ...current, stage, educationPlan: current.educationPlan && available.includes(current.educationPlan) ? current.educationPlan : "" }));
  }

  function recordFeedback(action: string, jobId: string) {
    if (!sessionId.current) sessionId.current = crypto.randomUUID();
    try {
    const parsed = JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? "[]");
    const existing = Array.isArray(parsed) ? parsed : [];
    const record = {
      sessionId: sessionId.current,
      at: new Date().toISOString(),
      model: MODEL_VERSION,
      action,
      jobId,
      rank: ranked.findIndex(result => result.job.id === jobId) + 1,
    };
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...existing, record].slice(-1000)));
    } catch { /* Saving a career still works when browser storage is unavailable. */ }
  }

  function toggleSaved(id: string) {
    if (saved.includes(id)) {
      setSaved(saved.filter(savedId => savedId !== id));
      recordFeedback("unsave", id);
    } else {
      setSaved([...saved, id]);
      recordFeedback("save", id);
      setNotice("Saved careers move to the top.");
    }
  }

  function hideJob(id: string) {
    setHidden([...hidden, id]);
    setSaved(saved.filter(savedId => savedId !== id));
    recordFeedback("hide", id);
  }

  function addQualification() {
    update("qualifications", [...profile.qualifications, { id: nextId.current++, kind: "A level", subject: "", grade: "", institution: "", detail: "" }]);
  }

  function changeQualification(id: number, patch: Partial<Qualification>) {
    update("qualifications", profile.qualifications.map(qualification => qualification.id === id ? { ...qualification, ...patch } : qualification));
  }

  function openPlan() {
    setResultView("plan"); go(4);
  }

  function clearSavedCopy() {
    try { localStorage.removeItem(PLAN_KEY); setNotice("Saved copy removed from this device. Your open plan is still here."); }
    catch { setNotice("This browser could not remove the saved copy. Clear this site's data in your browser settings."); }
  }

  function reset() {
    const url = new URL(window.location.href);
    url.searchParams.delete("testUser");
    url.searchParams.delete("career");
    window.history.replaceState({}, "", url);
    setProfile({ ...initialProfile, answers: [...initialProfile.answers], qualifications: [], specificInterests: {}, targetIds: [], networkAreaIds: [] });
    setSaved([]);
    setHidden([]);
    setTargetSearch("");
    setInterestPosition(0);
    setResultSearch("");
    setVisibleCount(36);
    setCareerPlan(emptyPlan());
    setResultView("explore");
    setBrowseOnly(false);
    setFurthestStep(0);
    setActiveCareer(null);
    try { localStorage.removeItem(PLAN_KEY); localStorage.removeItem(FEEDBACK_KEY); } catch { /* Storage may be disabled. */ }
    go(0);
  }

  return <main className={`${styles.page} ph-no-capture ph-no-recording`} data-private>
    <div className={styles.topline}><span className={styles.eyebrow}>PATHFINDER</span><span className={styles.badge}>V1 prototype</span></div>
    {process.env.NODE_ENV === "development" && <p className={styles.notice}>Local test profile: Alex · sixth form · maths, computing, and engineering · uses AI often. <a href="/pathfinder?testUser=alex">Load Alex → step 05</a></p>}
    <div className={styles.intro}><div><h1 ref={heading} tabIndex={-1}>{step === 4 ? "Your future. Your choices." : "Find work that fits you."}</h1><p>{step === 4 ? "Explore the work, compare your options, and build a plan you can act on." : "Your interests, education plans, and views on AI, brought together."}</p></div><p className={styles.parentNote}>For students and young people.<br /><strong>Parents support. Students answer.</strong></p></div>
    {step !== 4 && <div className={styles.quickStart}><div><strong>Already have some ideas?</strong><p>Explore careers and build your plan now. You can take the interests assessment later.</p></div><button className={styles.secondary} disabled={!units.length} onClick={() => { setBrowseOnly(true); setResultView("explore"); go(4); }}>Explore careers →</button>{SLOTS.some(slot => careerPlan.choices[slot].unitId) && <button className={styles.secondary} onClick={() => { setBrowseOnly(true); openPlan(); }}>Open saved plan</button>}</div>}
    {error && <p role="alert" className={styles.notice}>{error} <button className={styles.textButton} onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
    <nav aria-label="Pathfinder progress" className={styles.steps}>{STEPS.map((label, index) => <button key={label} disabled={index > furthestStep} aria-current={index === step ? "step" : undefined} onClick={() => { if (index === 1) setBrowseOnly(false); go(index); }}><span>{index < step ? "✓" : `0${index + 1}`}</span>{label}</button>)}</nav>

    {step === 0 && <div className={styles.layout}><section className={styles.panel}><div className={styles.sectionTitle}><span>01 / START HERE</span><h2>Where are you going from here?</h2><p>Your current stage removes finish points that are already behind you. Your plan sets the amount of education and training in your recommendations.</p></div>
      <Choices label="Your current stage" options={STAGES} value={profile.stage} onChange={setStage} />
      <Choices label="When do you plan to move on from education?" options={educationPlanIds.map(id => EDUCATION_PLANS[id].label)} value={profile.educationPlan ? EDUCATION_PLANS[profile.educationPlan].label : ""} onChange={value => update("educationPlan", educationPlanIds.find(id => EDUCATION_PLANS[id].label === value) ?? "")} />
      <Choices label="Which route interests you most?" options={ROUTES} value={profile.route} onChange={value => update("route", value)} />
      {profile.route === "Apprenticeship" && <label className={styles.label}>Where in the UK are you based?<select value={profile.nation} onChange={event => update("nation", event.target.value)}>{Object.keys(APPRENTICESHIPS).map(nation => <option key={nation}>{nation}</option>)}</select><span className={styles.fine}>We only use this to link to the right apprenticeship search service.</span></label>}
      <div className={styles.divider} />
      <h3>Do you already have paths in mind?</h3><p>Add as many careers, degree subjects, or apprenticeships as you like. We will show their linked careers first, then help you explore alternatives.</p>
      <SearchPicker label="Search paths" search={targetSearch} setSearch={setTargetSearch} units={units} selected={profile.targetIds} onAdd={id => update("targetIds", [...profile.targetIds, id])} onRemove={id => update("targetIds", profile.targetIds.filter(targetId => targetId !== id))} />
      <div className={styles.actions}><button className={styles.primary} disabled={!profile.stage || !profile.educationPlan || !profile.route} onClick={() => { setBrowseOnly(false); go(1); }}>Explore your interests <span>→</span></button><span>About 10 minutes</span></div>
    </section><aside className={styles.aside}><span className={styles.smallNumber}>HOW THIS WORKS</span><h2>Your plan comes first.</h2><ul><li>Explore now or start with your interests.</li><li>Your targets appear first.</li><li>Your planned education sets the preparation range.</li><li>You can save or remove any result.</li></ul></aside></div>}

    {step === 1 && <section className={`${styles.panel} ${styles.flowPanel}`}>
      <div className={styles.flowHeader}><span>{isBroadInterest ? "O*NET INTEREST PROFILER" : "SPECIFIC INTEREST AREAS"}</span><strong>{isBroadInterest ? `${interestPosition + 1} of ${QUESTIONS.length}` : `${specificIndex + 1} of ${data?.areas.length ?? 41}`}</strong></div>
      <div className={styles.flowTrack}><i style={{ width: `${(interestPosition + 1) / (QUESTIONS.length + (data?.areas.length ?? 41)) * 100}%` }} /></div>
      {broadQuestion ? <div className={styles.flowCard}><span className={styles.flowNumber}>{String(interestPosition + 1).padStart(2, "0")}</span><h2>{broadQuestion[0]}</h2><div className={styles.flowAnswers}>{["Strongly dislike", "Dislike", "Unsure", "Like", "Strongly like"].map((label, index) => <button type="button" key={label} aria-pressed={profile.answers[interestPosition] === index + 1} onClick={() => answerBroadInterest(index + 1)}>{label}</button>)}</div></div>
        : specificArea ? <div className={styles.flowCard}><span className={styles.flowNumber}>{String(specificIndex + 1).padStart(2, "0")}</span><h2>{specificArea.label}</h2><p>{specificArea.description}</p><div className={`${styles.flowAnswers} ${styles.specificAnswers}`}>{(["avoid", "neutral", "pursue"] as SpecificChoice[]).map(choice => <button type="button" key={choice} aria-pressed={profile.specificInterests[specificArea.id] === choice} onClick={() => answerSpecificInterest(choice)}>{choice === "avoid" ? "Avoid" : choice === "pursue" ? "Pursue" : "Neutral"}</button>)}</div></div>
          : <div className={styles.flowCard}><h2>Loading interest areas…</h2></div>}
      <div className={styles.flowFooter}><button className={styles.textButton} onClick={previousInterest}>← Previous</button><span>O*NET Interest Profiler Short Form © National Center for O*NET Development.</span></div>
    </section>}

    {step === 2 && <section className={styles.panel}><div className={styles.sectionTitle}><span>03 / QUALIFICATIONS</span><h2>What have you achieved?</h2><p>Add achieved qualifications and subject choices. They will inform routes later, but do not remove careers in v1.</p></div>
      {profile.qualifications.map((qualification, index) => <div className={styles.qualification} key={qualification.id}><div className={styles.rowHead}><strong>Qualification {index + 1}</strong><button className={styles.textButton} onClick={() => update("qualifications", profile.qualifications.filter(item => item.id !== qualification.id))}>Remove</button></div><div className={styles.formGrid}>
        <label className={styles.label}>Qualification<select value={qualification.kind} onChange={event => changeQualification(qualification.id, { kind: event.target.value, grade: "" })}>{Object.keys(GRADES).map(grade => <option key={grade}>{grade}</option>)}</select></label>
        <label className={styles.label}>Subject or course<input maxLength={100} value={qualification.subject} placeholder="e.g. Mathematics, Law, Engineering" onChange={event => changeQualification(qualification.id, { subject: event.target.value })} /></label>
        <label className={styles.label}>Grade{qualification.kind === "Other" ? <input value={qualification.grade} maxLength={30} onChange={event => changeQualification(qualification.id, { grade: event.target.value })} /> : <select value={qualification.grade} onChange={event => changeQualification(qualification.id, { grade: event.target.value })}><option value="">Choose a grade</option>{GRADES[qualification.kind].map(grade => <option key={grade}>{grade}</option>)}</select>}</label>
        {["Bachelor’s degree", "Master’s degree"].includes(qualification.kind) && <label className={styles.label}>University or institution (optional)<input value={qualification.institution} maxLength={100} onChange={event => changeQualification(qualification.id, { institution: event.target.value })} /></label>}
        {["Apprenticeship", "Other"].includes(qualification.kind) && <label className={styles.label}>Full qualification title and level<input value={qualification.detail} maxLength={120} onChange={event => changeQualification(qualification.id, { detail: event.target.value })} /></label>}
      </div></div>)}
      <button className={styles.secondary} onClick={addQualification}>+ Add a qualification</button><p className={styles.fine}>Leave this blank if you do not have results or subject choices yet.</p>
      <div className={styles.actions}><button className={styles.secondary} onClick={() => go(1)}>← Back</button><button className={styles.primary} disabled={hasPartialQualification} onClick={() => go(3)}>AI, salary, and connections →</button></div>{hasPartialQualification && <p className={styles.fine}>Add a subject and grade for each row, or remove the unfinished row.</p>}
    </section>}

    {step === 3 && <div className={styles.layout}><section className={styles.panel}><div className={styles.sectionTitle}><span>04 / THE WAY YOU WANT TO WORK</span><h2>How do you feel about AI?</h2><p>This changes the order of exposed and less-exposed careers.</p></div>
      <Choices label="Using AI regularly at work" options={AI_OPTIONS} value={profile.ai ? AI_OPTIONS[profile.ai - 1] : ""} onChange={value => update("ai", AI_OPTIONS.indexOf(value) + 1)} />
      <Choices label="How important is salary?" options={SALARY_OPTIONS} value={profile.salaryImportance >= 0 ? SALARY_OPTIONS[profile.salaryImportance] : ""} onChange={value => update("salaryImportance", SALARY_OPTIONS.indexOf(value))} />
      <div className={styles.divider} /><h2>Who could help you explore?</h2><Choices label="Do you know anyone, such as family or friends, in any of these sectors you might be interested in working in who could help you gain work experience?" options={["Yes", "No"]} value={profile.network === "yes" ? "Yes" : profile.network === "no" ? "No" : ""} onChange={value => { update("network", value === "Yes" ? "yes" : "no"); if (value === "No") update("networkAreaIds", []); }} />
      {profile.network === "yes" && <NetworkAreaPicker areas={data?.areas ?? []} selected={profile.networkAreaIds} onChange={ids => update("networkAreaIds", ids)} />}
      <Choices label="How do you feel about asking for help?" options={["Comfortable", "I’d like help with what to say", "Not sure yet"]} value={profile.confidence} onChange={value => update("confidence", value)} />
      <div className={styles.actions}><button className={styles.secondary} onClick={() => go(2)}>← Back</button><button className={styles.primary} disabled={!profile.ai || profile.salaryImportance < 0 || !profile.network || (profile.network === "yes" && !profile.networkAreaIds.length) || !profile.confidence || !data} onClick={() => { setBrowseOnly(false); go(4); }}>{data ? "Build my career plan →" : "Loading career data…"}</button></div>{error && <p role="alert">{error} <button className={styles.textButton} onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
    </section><aside className={styles.aside}><span className={styles.smallNumber}>REAL ACCESS</span><h2>Connections can change a route.</h2><p>A relevant contact adds a moderate boost to linked careers and shapes your next step.</p></aside></div>}

    {step === 4 && <>
      <div className={styles.resultTabs} role="group" aria-label="Explore or plan"><button aria-pressed={resultView === "explore"} onClick={() => setResultView("explore")}>Explore careers</button><button aria-pressed={resultView === "plan"} onClick={openPlan}>My A/B/Z plan <span>{SLOTS.filter(slot => careerPlan.choices[slot].unitId).length}/3</span></button></div>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      {resultView === "plan" ? <PlanBuilder plan={careerPlan} setPlan={setCareerPlan} units={units} savedIds={saved} onExplore={exploreCareer} onBrowse={() => setResultView("explore")} onClearSaved={clearSavedCopy} /> : <>
      {browseOnly ? <div className={styles.browseIntro}><div><span className={styles.eyebrow}>START WITH YOUR IDEAS</span><h2>What work would you like to explore?</h2><p>Search, read about the work, and save a shortlist. Then choose your A, B, and Z.</p></div><button className={styles.secondary} onClick={() => { setBrowseOnly(false); go(0); }}>Find options from my interests</button></div> : <div className={styles.summary}><div><span className={styles.eyebrow}>YOUR BROAD INTERESTS</span><h2>{flat ? "Keep exploring widely." : [...vectors].map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value).slice(0, 2).map(item => DIMENSIONS[item.index]).join(" + ")}</h2><p>{pursuedAreas.length ? `You chose to pursue ${pursuedAreas.map(area => area.label).join(", ")}.` : "You did not mark any specific area to pursue, so the broad questions carry more of the ranking."}</p></div><div className={styles.interestBars}>{DIMENSIONS.map((dimension, index) => <div key={dimension}><span>{dimension} · {vectors[index]}/50</span><div><i style={{ width: `${Math.max(0, vectors[index] - 10) / 40 * 100}%` }} /></div></div>)}</div></div>}
      <div className={styles.resultHeading}><div><span className={styles.eyebrow}>{browseOnly ? "BROWSE THE CAREER LIBRARY" : "TARGETS FIRST, THEN DISCOVERY"}</span><h2>{ordered.length} careers to explore.</h2><p>Save careers to your shortlist, then compare them in your plan.</p></div><button className={styles.secondary} onClick={openPlan}>Build my A/B/Z plan →</button></div>
      <div className={styles.toolbar}><label>Filter results<input value={resultSearch} onChange={event => { setResultSearch(event.target.value); setVisibleCount(36); }} placeholder="Search jobs or interests" /></label><span>{browseOnly ? "Alphabetical · saved careers first" : <>Education: <strong>{plan.label}</strong></>}</span>{!!hidden.length && <button className={styles.textButton} onClick={() => setHidden([])}>Restore {hidden.length} hidden</button>}</div>
      {selectedTargets.length > 0 && <p className={styles.notice}>Targets shown first: {selectedTargets.map(unit => unit.label).join(", ")}.</p>}
      <div className={styles.cards}>{shown.map(result => { const preferred = visibleRoutes(result.job, units, profile); const routes = preferred.length ? preferred : linkedRoutes(result.job, units); return <CareerCard key={result.job.id} job={result.job} routes={routes} saved={saved.includes(result.job.id)} target={result.target} onOpen={() => exploreCareer(result.job.id)} onSave={() => toggleSaved(result.job.id)} onHide={() => hideJob(result.job.id)}/>; })}</div>
      {!shown.length && <p className={styles.notice}>No careers match this search and your current filters.</p>}
      {visibleCount < ordered.length && <div className={styles.loadMore}><button className={styles.secondary} onClick={() => setVisibleCount(count => count + 36)}>Show 36 more</button></div>}
      {!browseOnly && <section className={styles.panel}><div className={styles.sectionTitle}><span>YOUR EVIDENCE</span><h2>Qualifications recorded.</h2></div>{qualificationSummary.length ? <ul className={styles.evidence}>{qualificationSummary.map((qualification, index) => <li key={index}>{qualification}</li>)}</ul> : <p>You have not added qualifications. They do not change career ranking in v1.</p>}<p className={styles.notice}>V1 records your achieved subjects and grades but does not yet use them to remove or downweight careers.</p><button className={styles.textButton} onClick={() => go(2)}>Edit qualifications →</button></section>}
      <section className={styles.plan}><span className={styles.eyebrow}>YOUR NEXT STEP</span><h2>Turn your shortlist into a plan.</h2><p>{saved.length ? `${saved.length} career${saved.length === 1 ? "" : "s"} saved. Choose your preferred route, an alternative, and a fallback.` : "You can choose careers, degree subjects, or apprenticeships for your plan."}</p><button className={styles.primary} onClick={openPlan}>Build my A/B/Z plan →</button></section>
      <details className={styles.method}><summary>About these results and the data</summary>{browseOnly && <p>Browse mode shows all careers in alphabetical order, with saved careers and named targets first. It does not claim to match your interests.</p>}<p>In assessment mode, v1 applies hard filters before scoring: your planned Job Zone cap and strongly avoided Specific Interest Areas. Named targets stay visible. Qualifications are recorded but do not filter careers.</p><p>The core score has 100 available points: 40 for RIASEC interest fit, 40 for Specific Interest Area fit, and 20 for projected openings. Preferred Job Zones add 10 points. Salary adds 0–10 points, your 1–5 AI preference adds −20 to +10, and a relevant connection adds 10. Model version: {MODEL_VERSION}.</p><p>{data?.meta.mapped} of {data?.meta.total} O*NET occupations have interest profiles. Salary and projected openings are broader UK-group proxies shared across occupations; they are not occupation-specific counts. Training routes use reviewed direct links, not SOC4 expansion. Unmapped careers stay out of discovery results but remain available as named targets. Save/remove feedback is stored in this browser only, without assessment answers, and is not yet used to change recommendations.</p><p>Includes information from the <a href="https://www.onetcenter.org/database.html">O*NET Database</a> and <a href="https://www.onetcenter.org/IP.html">O*NET Interest Profiler</a> by the US Department of Labor, Employment and Training Administration. O*NET® is a trademark of USDOL/ETA. USDOL/ETA has not approved, endorsed, or tested these changes.</p></details>
      </>}
      <button className={styles.textButton} onClick={() => { if (window.confirm("Clear your answers, plan, and saved copy on this device?")) reset(); }}>Clear answers and start again</button>
    </>}
    {activeCareer && jobs.find(job => job.id === activeCareer) && <CareerExplorer key={activeCareer} job={jobs.find(job => job.id === activeCareer)!} units={units} profile={profile} reason={(() => {const result = ordered.find(r => r.job.id === activeCareer); return result?.matchedAreas.length ? `Matches ${result.matchedAreas.map(a => a.label).join(', ')}.` : result?.dimensions.length ? `Combines ${result.dimensions.map(d => DIMENSIONS[d].toLowerCase()).join(' and ')} activities.` : 'A wider career to explore.';})()} saved={saved.includes(activeCareer)} onSave={() => toggleSaved(activeCareer)} onClose={() => exploreCareer(null)}/>}
    <div className={styles.printPlan}><PlanReport plan={careerPlan} units={units} /></div>
  </main>;
}
