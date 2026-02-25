import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-800 break-words">{value || "—"}</div>
    </div>
  );
}

export default function View() {
  const initialHmId = useMemo(() => (getQueryParam("hm_id") || "").trim(), []);
  const [hmId, setHmId] = useState(initialHmId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const load = async (id) => {
    const v = (id || "").trim();
    if (!v) return;
    setLoading(true);
    setError("");
    setProfile(null);
    try {
      const r = await fetch(`${API}/api/profile/${encodeURIComponent(v)}`);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        if (r.status === 403) throw new Error("This profile is pending admin approval.");
        throw new Error(d.error || "Profile not found");
      }
      const data = await r.json();
      setProfile(data);

      const url = new URL(window.location.href);
      url.searchParams.set("hm_id", v);
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialHmId) load(initialHmId);
  }, [initialHmId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white shadow-md print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Happiest Minds COE — Profile Viewer</h1>
            <p className="text-green-200 text-xs mt-0.5">Read-only profile view</p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-green-800 hover:bg-green-900 text-white text-sm px-4 py-2 rounded"
            disabled={!profile}
          >
            Print / Save as PDF
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 items-end print:hidden">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Enter HM ID to view submitted profile</label>
            <input
              value={hmId}
              onChange={(e) => setHmId(e.target.value)}
              placeholder="e.g. HM12345"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <button
            onClick={() => load(hmId)}
            className="bg-gray-700 text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? "Loading..." : "View"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 print:hidden">
            {error}
          </div>
        )}

        {profile && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-5 border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500">HM ID</div>
                  <div className="text-lg font-bold text-green-700">{profile.hm_id}</div>
                  <div className="text-sm text-gray-700 mt-1">{profile.name}</div>
                </div>
                {profile.profile_pic && (
                  <img
                    src={profile.profile_pic}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                )}
              </div>
            </div>

            <div className="p-5 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Competency" value={profile.competency} />
                <Field label="Joining Date" value={profile.joining_date} />
                <Field label="Primary Role" value={profile.primary_role} />
                <Field label="Total Experience" value={`${profile.total_exp_years || 0}y ${profile.total_exp_months || 0}m`} />
                <Field label="Relevant Experience" value={`${profile.relevant_exp_years || 0}y ${profile.relevant_exp_months || 0}m`} />
                <Field
                  label="Reporting Location"
                  value={profile.reporting_location_type === "customer" ? (profile.customer_name || "Customer") : (profile.office_city || "Office")}
                />
              </div>

              {Array.isArray(profile.industries) && profile.industries.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Industries</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.industries.map((i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Skills</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-green-700 text-white">
                          {["Skill ID", "Skill Name", "Platform Group", "Primary/Secondary/N/A", "Years", "Self Assessment"].map((h) => (
                            <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {profile.skills.map((s, idx) => (
                          <tr key={s.skill_id || `${s.skill_name}-${idx}`} className="border-b border-gray-100">
                            <td className="px-2 py-2 font-mono text-gray-500">{s.skill_id || "—"}</td>
                            <td className="px-2 py-2 font-medium text-gray-800">{s.skill_name || "—"}</td>
                            <td className="px-2 py-2 text-gray-500">{s.platform_group || "—"}</td>
                            <td className="px-2 py-2">{s.primary_secondary || "—"}</td>
                            <td className="px-2 py-2">{s.years_exp || "—"}</td>
                            <td className="px-2 py-2">{s.self_assessment || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {Array.isArray(profile.certifications) && profile.certifications.filter((c) => c?.name).length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Certifications</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-green-700 text-white">
                          {["Name", "Provider", "Date", "Expiry"].map((h) => (
                            <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {profile.certifications.filter((c) => c?.name).map((c, idx) => (
                          <tr key={`${c.name}-${idx}`} className="border-b border-gray-100">
                            <td className="px-2 py-2 font-medium">{c.name}</td>
                            <td className="px-2 py-2">{c.provider || "—"}</td>
                            <td className="px-2 py-2">{c.date || "—"}</td>
                            <td className="px-2 py-2">{c.expiry || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {Array.isArray(profile.projects) && profile.projects.filter((p) => p?.title).length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Projects</div>
                  <div className="space-y-3">
                    {profile.projects.filter((p) => p?.title).map((p, idx) => (
                      <div key={`${p.title}-${idx}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="font-semibold text-green-700">{p.title}</div>
                        <div className="text-xs text-gray-600 mt-1">Role: {p.role || "—"} | {p.duration || "—"}</div>
                        {p.tools && <div className="text-xs text-gray-500 mt-1">Tools: {p.tools}</div>}
                        {p.description && <div className="text-xs text-gray-700 mt-2">{p.description}</div>}
                        {p.responsibility && <div className="text-xs text-gray-700 mt-2"><span className="text-gray-500">Responsibility:</span> {p.responsibility}</div>}
                        {p.awards && <div className="text-xs text-gray-700 mt-2"><span className="text-gray-500">Awards:</span> {p.awards}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!profile && !error && (
          <div className="text-sm text-gray-500 text-center py-12">
            Enter your HM ID to view your submitted profile.
          </div>
        )}
      </div>
    </div>
  );
}
