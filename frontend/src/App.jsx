import { useState, useEffect, useRef, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "";

const COMPETENCIES = ["Intern", "Apprentice", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"];
const PRIMARY_ROLES = ["Data Scientist", "Data Engineer", "ML Engineer", "Data Analyst", "AI Architect",
  "Platform Engineer", "Analytics Engineer", "Business Intelligence Developer", "Research Scientist"];
const INDUSTRIES = [
  "Banking", "Insurance", "Other Fin Services", "FinOps", "Education Tech",
  "IT Platform Vendors (Hi-Tech)", "IT Services Providers", "Media", "Entertainment",
  "Retail supermarts", "eRetailer", "CPG mfg & sellers", "Logistics",
  "Other Manufacturing", "Large Industrial Mfg", "Energy", "Utilities",
  "Healthcare providers", "Healthcare insurance", "Lifesciences", "Pharma & drugs",
  "Agri sciences", "Other Professional Services", "Any others",
];
const SELF_ASSESSMENT = ["Basic", "Intermediate", "Advanced"];

function SkillSearch({ onAdd }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);

  const search = useCallback((val) => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (!val.trim()) { setResults([]); return; }
      try {
        const r = await fetch(`${API}/api/skills?q=${encodeURIComponent(val)}`);
        const data = await r.json();
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
    }, 200);
  }, []);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={e => { setQ(e.target.value); search(e.target.value); }}
        onFocus={() => q && setOpen(true)}
        placeholder="Search and select a skill..."
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
          {results.map(s => (
            <div key={s.skill_id || s.skill_name} className="px-3 py-2 text-sm hover:bg-green-50 cursor-pointer"
              onMouseDown={() => { onAdd(s); setQ(""); setOpen(false); }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-800">{s.skill_name}</span>
                <span className="text-xs text-gray-400">{s.platform_group}{s.skill_id ? ` · ${s.skill_id}` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children, step, active, onClick }) {
  return (
    <div className={`border rounded-lg mb-4 overflow-hidden transition-all ${active ? "border-green-600 shadow-md" : "border-gray-200"}`}>
      <button onClick={onClick} className={`w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm ${active ? "bg-green-700 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
        <span className="flex items-center gap-3">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-white text-green-700" : "bg-green-700 text-white"}`}>{step}</span>
          {title}
        </span>
        <span>{active ? "▲" : "▼"}</span>
      </button>
      {active && <div className="p-5 bg-white">{children}</div>}
    </div>
  );
}

function Input({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600" {...props} />
    </div>
  );
}

function Select({ label, required, options, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600 bg-white" {...props}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  const [profile, setProfile] = useState({
    hm_id: "", name: "", competency: "", joining_date: "",
    total_exp_years: "", total_exp_months: "",
    relevant_exp_years: "", relevant_exp_months: "",
    reporting_location_type: "office",
    customer_name: "", customer_address: "", office_city: "",
    industries: [], primary_role: "", profile_pic: "",
    education: [{ degree: "", specialisation: "", institution: "", year: "", grade: "" }],
    skills: [],
    certifications: [{ name: "", provider: "", date: "", expiry: "" }],
    projects: [{ title: "", role: "", duration: "", tools: "", description: "", responsibility: "", awards: "" }],
  });

  const update = (field, value) => setProfile(p => ({ ...p, [field]: value }));

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setError("Profile picture must be under 1MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      update("profile_pic", ev.target.result);
      setProfilePicPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const loadProfile = async () => {
    if (!lookupId.trim()) return;
    try {
      const r = await fetch(`${API}/api/profile/${lookupId.trim()}`);
      if (!r.ok) { setError("Profile not found. You can fill in the form to create it."); return; }
      const data = await r.json();
      setProfile({ ...profile, ...data });
      if (data.profile_pic) setProfilePicPreview(data.profile_pic);
      setError("");
    } catch { setError("Failed to load profile."); }
  };

  const handleSubmit = async () => {
    if (!profile.hm_id || !profile.name) {
      setError("Happiest Minds ID and Name are required.");
      setActiveSection(0);
      return;
    }
    const invalidSkills = (profile.skills || []).filter(sk => {
      const ps = sk.primary_secondary;
      if (ps === "N/A") return false;
      const years = Number(sk.years_exp);
      if (!Number.isFinite(years) || years <= 0) return true;
      if (!sk.self_assessment) return true;
      return false;
    });
    if (invalidSkills.length > 0) {
      setError("Please complete Years of Experience (> 0) and Self Assessment for all Primary/Secondary skills (or mark them N/A).");
      setActiveSection(1);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Submission failed"); }
      setSubmitted(true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const viewLink = profile.hm_id ? `${window.location.origin}/view?hm_id=${encodeURIComponent(profile.hm_id)}` : "";

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Submitted!</h2>
        <p className="text-gray-500 mb-6">Your profile has been saved successfully and is pending admin approval.</p>
        {viewLink && (
          <div className="text-left mb-6">
            <div className="text-xs font-medium text-gray-600 mb-2">Your view link</div>
            <div className="flex gap-2">
              <input
                value={viewLink}
                readOnly
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none"
              />
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(viewLink); }
                  catch { }
                }}
                className="bg-gray-700 text-white px-3 py-2 rounded text-xs hover:bg-gray-800"
              >
                Copy
              </button>
            </div>
            <div className="text-[11px] text-gray-400 mt-2">This link will work only after an admin approves your profile.</div>
            <a href={viewLink} className="text-xs text-green-700 hover:underline mt-2 inline-block">Open view page</a>
          </div>
        )}
        <button onClick={() => { setSubmitted(false); setActiveSection(0); }}
          className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800">
          Submit Another
        </button>
      </div>
    </div>
  );

  // Education rows
  const addEdu = () => update("education", [...profile.education, { degree: "", specialisation: "", institution: "", year: "", grade: "" }]);
  const updateEdu = (i, field, val) => {
    const rows = [...profile.education];
    rows[i] = { ...rows[i], [field]: val };
    update("education", rows);
  };
  const removeEdu = (i) => update("education", profile.education.filter((_, idx) => idx !== i));

  // Skills
  const addSkill = (skill) => {
    const idKey = (skill?.skill_id || "").trim();
    const nameKey = (skill?.skill_name || "").trim();
    if (!nameKey) return;
    if (profile.skills.find(s => (idKey && s.skill_id === idKey) || s.skill_name === nameKey)) return;
    update("skills", [...profile.skills, {
      skill_id: skill.skill_id || "",
      skill_name: skill.skill_name,
      platform_group: skill.platform_group || "",
      primary_secondary: "Primary",
      years_exp: "",
      self_assessment: "",
    }]);
  };
  const updateSkill = (i, field, val) => {
    const rows = [...profile.skills];
    const next = { ...rows[i], [field]: val };
    if (field === "primary_secondary" && val === "N/A") {
      next.years_exp = "";
      next.self_assessment = "";
    }
    rows[i] = next;
    update("skills", rows);
  };
  const removeSkill = (i) => update("skills", profile.skills.filter((_, idx) => idx !== i));

  // Certs
  const addCert = () => update("certifications", [...profile.certifications, { name: "", provider: "", date: "", expiry: "" }]);
  const updateCert = (i, field, val) => {
    const rows = [...profile.certifications];
    rows[i] = { ...rows[i], [field]: val };
    update("certifications", rows);
  };
  const removeCert = (i) => update("certifications", profile.certifications.filter((_, idx) => idx !== i));

  // Projects
  const addProject = () => update("projects", [...profile.projects, { title: "", role: "", duration: "", tools: "", description: "", responsibility: "", awards: "" }]);
  const updateProject = (i, field, val) => {
    const rows = [...profile.projects];
    rows[i] = { ...rows[i], [field]: val };
    update("projects", rows);
  };
  const removeProject = (i) => update("projects", profile.projects.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Happiest Minds COE — Skill Profiling</h1>
            <p className="text-green-200 text-xs mt-0.5">Data & AI Center of Excellence</p>
          </div>
          <div className="text-right text-xs text-green-200">
            <div>Born Digital. Born Agile.</div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Lookup */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Load existing profile by HM ID</label>
            <input value={lookupId} onChange={e => setLookupId(e.target.value)}
              placeholder="e.g. HM12345"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600" />
          </div>
          <button onClick={loadProfile} className="bg-gray-700 text-white px-4 py-2 rounded text-sm hover:bg-gray-800">
            Load Profile
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Section 1: Profile */}
        <Section title="Profile Information" step="1" active={activeSection === 0} onClick={() => setActiveSection(activeSection === 0 ? -1 : 0)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Profile pic */}
            <div className="md:col-span-1 flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {profilePicPreview
                  ? <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                  : <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              </div>
              <label className="text-xs text-green-700 cursor-pointer hover:underline">
                Upload Photo
                <input type="file" accept="image/*" onChange={handlePicUpload} className="hidden" />
              </label>
              <p className="text-xs text-gray-400">Max 1MB, JPG/PNG</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <Input label="Happiest Minds ID" required value={profile.hm_id} onChange={e => update("hm_id", e.target.value)} placeholder="e.g. HM12345" />
              <Input label="Full Name" required value={profile.name} onChange={e => update("name", e.target.value)} />
              <Select label="Competency" required options={COMPETENCIES} value={profile.competency} onChange={e => update("competency", e.target.value)} />
              <Input label="HM Joining Date" type="date" value={profile.joining_date} onChange={e => update("joining_date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Input label="Total Exp (Years)" type="number" min="0" value={profile.total_exp_years} onChange={e => update("total_exp_years", e.target.value)} />
            <Input label="Total Exp (Months)" type="number" min="0" max="11" value={profile.total_exp_months} onChange={e => update("total_exp_months", e.target.value)} />
            <Input label="Relevant Exp (Years)" type="number" min="0" value={profile.relevant_exp_years} onChange={e => update("relevant_exp_years", e.target.value)} />
            <Input label="Relevant Exp (Months)" type="number" min="0" max="11" value={profile.relevant_exp_months} onChange={e => update("relevant_exp_months", e.target.value)} />
          </div>

          {/* Reporting Location */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Reporting Location</label>
            <div className="flex gap-6">
              {["customer", "office"].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" value={t} checked={profile.reporting_location_type === t}
                    onChange={() => update("reporting_location_type", t)} className="accent-green-700" />
                  {t === "customer" ? "Customer Location" : "Happiest Minds Office"}
                </label>
              ))}
            </div>
            {profile.reporting_location_type === "customer" && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input label="Customer Name" value={profile.customer_name} onChange={e => update("customer_name", e.target.value)} />
                <Input label="Customer Address" value={profile.customer_address} onChange={e => update("customer_address", e.target.value)} />
              </div>
            )}
            {profile.reporting_location_type === "office" && (
              <div className="mt-3 max-w-xs">
                <Input label="Office City" value={profile.office_city} onChange={e => update("office_city", e.target.value)} />
              </div>
            )}
          </div>

          {/* Industries */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Industries Worked In (select all that apply)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {INDUSTRIES.map(ind => (
                <label key={ind} className="flex items-center gap-2 text-xs cursor-pointer hover:text-green-700">
                  <input type="checkbox" checked={profile.industries.includes(ind)}
                    onChange={e => update("industries", e.target.checked
                      ? [...profile.industries, ind]
                      : profile.industries.filter(i => i !== ind))}
                    className="accent-green-700 flex-shrink-0" />
                  {ind}
                </label>
              ))}
            </div>
          </div>

          {/* Primary Role */}
          <Select label="Primary Role in COE" required options={PRIMARY_ROLES}
            value={profile.primary_role} onChange={e => update("primary_role", e.target.value)} />

          {/* Education */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-600">Education Details</label>
              <button onClick={addEdu} className="text-xs text-green-700 hover:underline">+ Add Row</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-green-700 text-white">
                    {["Degree", "Specialisation", "Institution", "Year", "CGPA / %", ""].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profile.education.map((edu, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {["degree", "specialisation", "institution", "year", "grade"].map(f => (
                        <td key={f} className="px-1 py-1">
                          <input value={edu[f]} onChange={e => updateEdu(i, f, e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-600" />
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <button onClick={() => removeEdu(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={() => setActiveSection(1)} className="bg-green-700 text-white px-5 py-2 rounded text-sm hover:bg-green-800">
              Next: Skills →
            </button>
          </div>
        </Section>

        {/* Section 2: Skills */}
        <Section title="Skills" step="2" active={activeSection === 1} onClick={() => setActiveSection(activeSection === 1 ? -1 : 1)}>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Search and add skills</label>
            <SkillSearch onAdd={addSkill} />
          </div>
          {profile.skills.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-green-700 text-white">
                    {["Skill ID", "Skill Name", "Platform Group", "Primary / Secondary / N/A", "Years of Experience", "Self Assessment", ""].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profile.skills.map((sk, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-2 font-mono text-gray-500">{sk.skill_id || "—"}</td>
                      <td className="px-2 py-2 font-medium text-gray-700">{sk.skill_name}</td>
                      <td className="px-2 py-2 text-gray-500">{sk.platform_group || "—"}</td>
                      <td className="px-1 py-1">
                        <select value={sk.primary_secondary} onChange={e => updateSkill(i, "primary_secondary", e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-green-600">
                          <option>Primary</option><option>Secondary</option><option>N/A</option>
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        <input type="number" step="0.5" min="0" max="50" value={sk.years_exp}
                          onChange={e => updateSkill(i, "years_exp", e.target.value)}
                          disabled={sk.primary_secondary === "N/A"}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-600 disabled:bg-gray-100" />
                      </td>
                      <td className="px-1 py-1">
                        <select value={sk.self_assessment} onChange={e => updateSkill(i, "self_assessment", e.target.value)}
                          disabled={sk.primary_secondary === "N/A"}
                          className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-green-600">
                          <option value="">Select</option>
                          {SELF_ASSESSMENT.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        <button onClick={() => removeSkill(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {profile.skills.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-6">No skills added yet. Search above to add skills.</p>
          )}
          <div className="mt-4 flex justify-between">
            <button onClick={() => setActiveSection(0)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
            <button onClick={() => setActiveSection(2)} className="bg-green-700 text-white px-5 py-2 rounded text-sm hover:bg-green-800">
              Next: Certifications →
            </button>
          </div>
        </Section>

        {/* Section 3: Certifications */}
        <Section title="Certifications" step="3" active={activeSection === 2} onClick={() => setActiveSection(activeSection === 2 ? -1 : 2)}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-green-700 text-white">
                  {["Certification Name", "Provider", "Date Obtained", "Expiry Date", ""].map(h => (
                    <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.certifications.map((cert, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-1 py-1">
                      <input value={cert.name} onChange={e => updateCert(i, "name", e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-600" placeholder="AWS Certified..." />
                    </td>
                    <td className="px-1 py-1">
                      <input value={cert.provider} onChange={e => updateCert(i, "provider", e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-600" placeholder="Amazon" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="date" value={cert.date} onChange={e => updateCert(i, "date", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-600" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="date" value={cert.expiry} onChange={e => updateCert(i, "expiry", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-green-600" />
                    </td>
                    <td className="px-1 py-1">
                      <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addCert} className="mt-3 text-xs text-green-700 hover:underline">+ Add Certification</button>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setActiveSection(1)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
            <button onClick={() => setActiveSection(3)} className="bg-green-700 text-white px-5 py-2 rounded text-sm hover:bg-green-800">
              Next: Projects →
            </button>
          </div>
        </Section>

        {/* Section 4: Projects */}
        <Section title="Project Experience" step="4" active={activeSection === 3} onClick={() => setActiveSection(activeSection === 3 ? -1 : 3)}>
          {profile.projects.map((proj, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4 relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-green-700">Project {i + 1}</h3>
                {profile.projects.length > 1 && (
                  <button onClick={() => removeProject(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Input label="Project Title" value={proj.title} onChange={e => updateProject(i, "title", e.target.value)} />
                <Input label="Your Role" value={proj.role} onChange={e => updateProject(i, "role", e.target.value)} />
                <Input label="Duration (e.g. Jan 2023 – Mar 2024)" value={proj.duration} onChange={e => updateProject(i, "duration", e.target.value)} />
                <Input label="Tools & Technologies" value={proj.tools} onChange={e => updateProject(i, "tools", e.target.value)} placeholder="Python, Spark, AWS..." />
              </div>
              {["description", "responsibility", "awards"].map(field => (
                <div key={field} className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {field === "awards" ? "Appreciations & Awards" : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <textarea rows={3} value={proj[field]} onChange={e => updateProject(i, field, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600 resize-none" />
                </div>
              ))}
            </div>
          ))}
          <button onClick={addProject} className="text-xs text-green-700 hover:underline">+ Add Another Project</button>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setActiveSection(2)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
          </div>
        </Section>

        {/* Submit */}
        <div className="mt-6 flex flex-col items-end gap-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-green-700 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-md">
            {submitting ? "Submitting..." : "Submit Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
