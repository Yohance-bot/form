import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";

function useAdmin() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [valid, setValid] = useState(false);

  const login = async (username, password) => {
    const r = await fetch(`${API}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) throw new Error("Invalid credentials");
    const { token } = await r.json();
    localStorage.setItem("admin_token", token);
    setToken(token);
    setValid(true);
    return token;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setValid(false);
  };

  const authFetch = (url, opts = {}) =>
    fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } });

  useEffect(() => {
    if (token) setValid(true);
  }, []);

  return { token, valid, login, logout, authFetch };
}

export default function Admin() {
  const { valid, login, logout, authFetch } = useAdmin();
  const [loginData, setLoginData] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [tab, setTab] = useState("profiles");

  const handleLogin = async () => {
    try {
      await login(loginData.username, loginData.password);
      setLoginError("");
    } catch (e) { setLoginError(e.message); }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API}/api/admin/profiles?search=${search}&page=${page}&per_page=20`);
      const data = await r.json();
      setProfiles(data.profiles || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch { }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const r = await authFetch(`${API}/api/admin/stats`);
      setStats(await r.json());
    } catch { }
  };

  useEffect(() => {
    if (valid) { fetchProfiles(); fetchStats(); }
  }, [valid, page, search]);

  const deleteProfile = async (id) => {
    if (!confirm("Delete this profile?")) return;
    await authFetch(`${API}/api/admin/profiles/${id}`, { method: "DELETE" });
    fetchProfiles();
    fetchStats();
  };

  const setApproval = async (profile, approved) => {
    await authFetch(`${API}/api/admin/profiles/${profile.id}/approval`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    await fetchProfiles();
    if (selectedProfile?.id === profile.id) {
      setSelectedProfile(p => ({ ...p, approved }));
    }
  };

  const exportFile = async (type) => {
    const r = await authFetch(`${API}/api/admin/export/${type}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profiles.${type}`;
    a.click();
  };

  if (!valid) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Admin Login</h2>
          <p className="text-sm text-gray-500">Happiest Minds COE Profiling</p>
        </div>
        {loginError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{loginError}</div>}
        <input value={loginData.username} onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))}
          placeholder="Username" className="w-full border rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-600" />
        <input type="password" value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="Password" className="w-full border rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-green-600" />
        <button onClick={handleLogin} className="w-full bg-green-700 text-white py-2 rounded font-medium hover:bg-green-800">
          Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Admin Dashboard</h1>
            <p className="text-green-200 text-xs">Happiest Minds COE — Skill Profiles</p>
          </div>
          <button onClick={logout} className="text-xs bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded">
            Logout
          </button>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-700">{stats.total_profiles}</div>
            <div className="text-xs text-gray-500 mt-1">Total Profiles</div>
          </div>
          {Object.entries(stats.by_role || {}).slice(0, 3).map(([role, count]) => (
            <div key={role} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{count}</div>
              <div className="text-xs text-gray-500 mt-1">{role}</div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or HM ID..."
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:border-green-600" />
          <div className="flex gap-2">
            <button onClick={() => exportFile("csv")} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button onClick={() => exportFile("excel")} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b text-sm text-gray-500">{total} profiles found</div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["HM ID", "Name", "Competency", "Role", "Approved", "Total Exp", "Skills", "Submitted", ""].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-3 font-mono text-xs font-medium text-green-700">{p.hm_id}</td>
                      <td className="px-3 py-3 font-medium">{p.name}</td>
                      <td className="px-3 py-3">{p.competency}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{p.primary_role}</td>
                      <td className="px-3 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded ${p.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>
                          {p.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs">{p.total_exp_years}y {p.total_exp_months}m</td>
                      <td className="px-3 py-3 text-xs">{(p.skills || []).length} skills</td>
                      <td className="px-3 py-3 text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-3 flex gap-2">
                        <button onClick={() => setSelectedProfile(p)} className="text-xs text-blue-600 hover:underline">View</button>
                        <button onClick={() => deleteProfile(p.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profiles.length === 0 && <div className="text-center py-8 text-gray-400">No profiles found.</div>}
            </div>
          )}
          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-green-700 text-white rounded-t-xl">
              <h2 className="font-bold">{selectedProfile.name} — {selectedProfile.hm_id}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setApproval(selectedProfile, !selectedProfile.approved)}
                  className={`text-xs px-3 py-1.5 rounded ${selectedProfile.approved ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-800 hover:bg-green-900"}`}
                >
                  {selectedProfile.approved ? "Set Pending" : "Approve"}
                </button>
                <a
                  href={`/#/view?hm_id=${encodeURIComponent(selectedProfile.hm_id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded"
                >
                  Print / PDF
                </a>
                <button onClick={() => setSelectedProfile(null)} className="text-green-200 hover:text-white text-xl">×</button>
              </div>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[["Competency", selectedProfile.competency],["Role", selectedProfile.primary_role],
                  ["Joining Date", selectedProfile.joining_date],
                  ["Total Experience", `${selectedProfile.total_exp_years}y ${selectedProfile.total_exp_months}m`],
                  ["Relevant Experience", `${selectedProfile.relevant_exp_years}y ${selectedProfile.relevant_exp_months}m`],
                  ["Location", selectedProfile.reporting_location_type === "customer" ? selectedProfile.customer_name : selectedProfile.office_city]
                ].map(([k, v]) => (
                  <div key={k}><span className="text-gray-500 text-xs">{k}</span><div className="font-medium">{v || "—"}</div></div>
                ))}
              </div>
              {selectedProfile.industries?.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Industries</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedProfile.industries.map(i => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{i}</span>)}
                  </div>
                </div>
              )}
              {selectedProfile.skills?.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Skills ({selectedProfile.skills.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedProfile.skills.map(s => {
                      const name = (typeof s === "string") ? s : (s.skill_name || "");
                      const key = (typeof s === "string") ? s : (s.skill_id || s.skill_name);
                      const rating = (typeof s === "string") ? "?" : (s.self_assessment?.split(" - ")[0] || "?");
                      const ps = (typeof s === "string") ? "Secondary" : (s.primary_secondary || "Secondary");
                      return (
                        <span key={key} className={`text-xs px-2 py-0.5 rounded ${ps === "Primary" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {name} · {rating}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedProfile.certifications?.filter(c => c.name).length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Certifications</div>
                  {selectedProfile.certifications.filter(c => c.name).map((c, i) => (
                    <div key={i} className="text-xs">{c.name} — {c.provider} ({c.date})</div>
                  ))}
                </div>
              )}
              {selectedProfile.projects?.filter(p => p.title).length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Projects</div>
                  {selectedProfile.projects.filter(p => p.title).map((proj, i) => (
                    <div key={i} className="border rounded p-3 mb-2 text-xs">
                      <div className="font-semibold text-green-700 mb-1">{proj.title}</div>
                      <div className="text-gray-600">Role: {proj.role} | {proj.duration}</div>
                      {proj.tools && <div className="text-gray-500 mt-1">Tools: {proj.tools}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
