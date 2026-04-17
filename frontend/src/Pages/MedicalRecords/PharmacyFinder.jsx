import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("patientToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/* ── Tiny helpers ─────────────────────────────────────────────── */
const ScoreBar = ({ value, color, label }) => (
  <div className="pf-score-row">
    <span className="pf-score-label">{label}</span>
    <div className="pf-bar-track">
      <div
        className="pf-bar-fill"
        style={{ width: `${Math.round((1 - value) * 100)}%`, background: color }}
      />
    </div>
    <span className="pf-score-num">{((1 - value) * 100).toFixed(0)}%</span>
  </div>
);

const RankBadge = ({ rank }) => {
  const cfg = {
    1: { bg: "#fbbf24", color: "#78350f", label: "🥇 Best" },
    2: { bg: "#94a3b8", color: "#1e293b", label: "🥈 2nd" },
    3: { bg: "#cd7c54", color: "#fff",     label: "🥉 3rd" },
  }[rank] || { bg: "#6366f1", color: "#fff", label: `#${rank}` };
  return (
    <span className="pf-rank-badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

/* ── Main component ───────────────────────────────────────────── */
const PharmacyFinder = () => {
  const [prescriptions,        setPrescriptions]        = useState([]);
  const [prescriptionId,       setPrescriptionId]       = useState("");
  const [address,              setAddress]              = useState("");
  const [results,              setResults]              = useState([]);
  const [rankingCriteria,      setRankingCriteria]      = useState(null);
  const [loading,              setLoading]              = useState(false);
  const [fetchingPrescriptions,setFetchingPrescriptions]= useState(true);
  const [message,              setMessage]              = useState("");
  const [expandedMap,          setExpandedMap]          = useState(null); // pharmacyId

  /* Load patient's prescriptions for dropdown */
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API}/prescriptions/patient/mine`, { headers: authHeaders() });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load prescriptions");
        setPrescriptions(json.data || []);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setFetchingPrescriptions(false);
      }
    };
    load();
  }, []);

  /* Search handler */
  const onFind = async () => {
    if (!prescriptionId || !address.trim()) {
      setMessage("Please select a prescription and provide your address.");
      return;
    }
    setLoading(true);
    setMessage("");
    setResults([]);
    setRankingCriteria(null);
    setExpandedMap(null);
    try {
      const res  = await fetch(`${API}/finder/finder`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ prescriptionId, address }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Search failed");
      if (!json.success) {
        setMessage(json.message || "No pharmacies found.");
        return;
      }
      setResults(json.topPharmacies || []);
      setRankingCriteria(json.rankingCriteria || null);
    } catch (err) {
      setMessage(err.message || "Unable to find pharmacies right now.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMap = (pharmacyId) =>
    setExpandedMap((prev) => (prev === pharmacyId ? null : pharmacyId));

  return (
    <>
      <style>{`
        /* ── Layout ─────────────────────── */
        .pf-wrap       { background:#fff; border-radius:1.25rem; padding:1.75rem; box-shadow:0 1px 6px rgba(0,0,0,.07); }
        .pf-title      { font-size:1.5rem; font-weight:700; color:#1e293b; margin:0 0 .25rem; }
        .pf-subtitle   { font-size:.875rem; color:#64748b; margin:0 0 1.5rem; }

        /* ── Search bar ─────────────────── */
        .pf-search     { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
        @media(max-width:640px){ .pf-search{ grid-template-columns:1fr; } }
        .pf-select, .pf-input {
          border:1.5px solid #e2e8f0; border-radius:.75rem; padding:.75rem 1rem;
          font-size:.9rem; color:#1e293b; background:#f8fafc; outline:none; width:100%; transition:border-color .2s;
        }
        .pf-select:focus, .pf-input:focus { border-color:#059669; background:#fff; }
        .pf-btn {
          background:linear-gradient(135deg,#059669,#047857); color:#fff;
          border:none; border-radius:.75rem; padding:.8rem 1.75rem;
          font-size:.95rem; font-weight:600; cursor:pointer; transition:opacity .2s, transform .15s;
          display:inline-flex; align-items:center; gap:.5rem;
        }
        .pf-btn:hover:not(:disabled){ opacity:.9; transform:translateY(-1px); }
        .pf-btn:disabled{ opacity:.65; cursor:not-allowed; }

        /* ── Criteria pill ──────────────── */
        .pf-criteria   { display:flex; gap:.75rem; flex-wrap:wrap; margin:1.25rem 0; }
        .pf-pill       {
          display:flex; align-items:center; gap:.4rem;
          background:#f0fdf4; border:1px solid #bbf7d0; border-radius:2rem;
          padding:.35rem .9rem; font-size:.8rem; color:#065f46; font-weight:600;
        }
        .pf-pill span  { font-weight:400; color:#047857; }

        /* ── Error / info message ───────── */
        .pf-msg        { margin-top:1rem; padding:.75rem 1rem; border-radius:.75rem; font-size:.875rem; }
        .pf-msg-err    { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
        .pf-msg-info   { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }

        /* ── Results section ────────────── */
        .pf-results    { margin-top:1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
        .pf-card       {
          border:1.5px solid #e2e8f0; border-radius:1rem; overflow:hidden;
          transition:box-shadow .2s, border-color .2s;
        }
        .pf-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.1); border-color:#a7f3d0; }
        .pf-card-head  {
          display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:.5rem;
          padding:1.1rem 1.25rem .9rem; background:#f8fafc;
          border-bottom:1px solid #e2e8f0;
        }
        .pf-card-name  { font-size:1.05rem; font-weight:700; color:#1e293b; margin:0 0 .2rem; }
        .pf-card-addr  { font-size:.82rem; color:#64748b; margin:0; }
        .pf-card-meta  { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
        .pf-dist-badge {
          background:#ecfdf5; color:#047857; border:1px solid #6ee7b7;
          border-radius:2rem; padding:.25rem .75rem; font-size:.8rem; font-weight:600;
        }
        .pf-24h-badge  {
          background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd;
          border-radius:2rem; padding:.25rem .75rem; font-size:.8rem; font-weight:600;
        }
        .pf-verified   { font-size:.8rem; color:#059669; font-weight:600; }

        /* ── Rank badge ─────────────────── */
        .pf-rank-badge {
          display:inline-block; border-radius:2rem; padding:.3rem .85rem;
          font-size:.82rem; font-weight:700; letter-spacing:.02em;
        }

        /* ── Card body ──────────────────── */
        .pf-card-body  { padding:1.1rem 1.25rem; display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
        @media(max-width:640px){ .pf-card-body{ grid-template-columns:1fr; } }

        /* ── Score panel ────────────────── */
        .pf-scores     { display:flex; flex-direction:column; gap:.6rem; }
        .pf-scores-ttl { font-size:.8rem; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
        .pf-score-row  { display:flex; align-items:center; gap:.6rem; }
        .pf-score-label{ font-size:.78rem; color:#64748b; min-width:90px; }
        .pf-bar-track  { flex:1; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
        .pf-bar-fill   { height:100%; border-radius:4px; transition:width .6s ease; }
        .pf-score-num  { font-size:.78rem; font-weight:700; color:#1e293b; min-width:32px; text-align:right; }
        .pf-combined   {
          margin-top:.5rem; padding:.5rem .75rem; border-radius:.6rem;
          background:linear-gradient(135deg,#ecfdf5,#f0fdf4); border:1px solid #bbf7d0;
          display:flex; justify-content:space-between; align-items:center;
        }
        .pf-combined-lbl{ font-size:.78rem; color:#065f46; font-weight:600; }
        .pf-combined-val{ font-size:1rem; font-weight:800; color:#047857; }

        /* ── Medicine table ─────────────── */
        .pf-med-ttl    { font-size:.8rem; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.5rem; }
        .pf-med-table  { width:100%; border-collapse:collapse; font-size:.8rem; }
        .pf-med-table th{ text-align:left; color:#94a3b8; font-weight:600; padding:.3rem .4rem; border-bottom:1px solid #f1f5f9; }
        .pf-med-table td{ padding:.4rem .4rem; color:#334155; border-bottom:1px solid #f8fafc; }
        .pf-in-stock   { color:#059669; font-weight:700; }
        .pf-out-stock  { color:#dc2626; font-weight:700; }

        /* ── Price footer ────────────────── */
        .pf-card-foot  {
          padding:.9rem 1.25rem; border-top:1px solid #f1f5f9;
          display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.75rem;
          background:#fafafa;
        }
        .pf-price      { font-size:1.15rem; font-weight:800; color:#059669; }
        .pf-price-sub  { font-size:.78rem; color:#94a3b8; }
        .pf-actions    { display:flex; gap:.6rem; flex-wrap:wrap; }
        .pf-map-btn    {
          background:#fff; border:1.5px solid #e2e8f0; color:#334155;
          border-radius:.65rem; padding:.5rem 1rem; font-size:.82rem; font-weight:600;
          cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:.4rem;
        }
        .pf-map-btn:hover    { border-color:#059669; color:#059669; background:#f0fdf4; }
        .pf-map-btn.active   { border-color:#059669; color:#fff; background:#059669; }
        .pf-call-btn    {
          background:#fff; border:1.5px solid #e2e8f0; color:#334155;
          border-radius:.65rem; padding:.5rem 1rem; font-size:.82rem; font-weight:600;
          cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:.4rem;
          text-decoration:none;
        }
        .pf-call-btn:hover{ border-color:#6366f1; color:#6366f1; background:#f5f3ff; }

        /* ── Inline map ─────────────────── */
        .pf-map-wrap   {
          border-top:1px dashed #e2e8f0; overflow:hidden;
          animation:slideDown .3s ease;
        }
        @keyframes slideDown{ from{max-height:0;opacity:0} to{max-height:400px;opacity:1} }
        .pf-map-frame  { width:100%; height:300px; border:none; display:block; }
        .pf-map-footer {
          padding:.6rem 1.25rem; background:#f8fafc; border-top:1px solid #e2e8f0;
          display:flex; justify-content:space-between; align-items:center;
        }
        .pf-map-coords { font-size:.75rem; color:#94a3b8; }
        .pf-osm-link   { font-size:.78rem; color:#059669; font-weight:600; text-decoration:none; }
        .pf-osm-link:hover{ text-decoration:underline; }

        /* ── Empty/loading state ────────── */
        .pf-empty      { text-align:center; padding:3rem 1rem; color:#94a3b8; }
        .pf-empty-icon { font-size:3rem; margin-bottom:.75rem; }
        .pf-spinner    { display:inline-block; width:18px; height:18px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin{ to{transform:rotate(360deg)} }
      `}</style>

      <div className="pf-wrap">
        <h2 className="pf-title">🏥 Find Best Pharmacy</h2>
        <p className="pf-subtitle">
          Select your active prescription and location — we rank nearby pharmacies by price &amp; distance.
        </p>

        {/* ── Search controls ─────────────────────────────────────── */}
        <div className="pf-search">
          <select
            className="pf-select"
            value={prescriptionId}
            onChange={(e) => setPrescriptionId(e.target.value)}
            disabled={fetchingPrescriptions}
          >
            <option value="">
              {fetchingPrescriptions ? "Loading prescriptions…" : "Select prescription"}
            </option>
            {prescriptions.map((p) => (
              <option key={p._id} value={p.prescriptionId}>
                {p.prescriptionId} · {p.patientName} · {p.status}
              </option>
            ))}
          </select>

          <input
            className="pf-input"
            placeholder="Enter your current address (e.g. Colombo 03, Sri Lanka)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onFind()}
          />
        </div>

        <button className="pf-btn" onClick={onFind} disabled={loading}>
          {loading ? <span className="pf-spinner" /> : "🔍"}
          {loading ? "Searching…" : "Find Pharmacies"}
        </button>

        {/* ── Error / warning message ──────────────────────────────── */}
        {message && (
          <div className={`pf-msg ${results.length === 0 ? "pf-msg-err" : "pf-msg-info"}`}>
            {message}
          </div>
        )}

        {/* ── Ranking criteria pills ───────────────────────────────── */}
        {rankingCriteria && (
          <div className="pf-criteria">
            <div className="pf-pill">
              💰 Price weight <span>{(rankingCriteria.priceWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="pf-pill">
              📍 Distance weight <span>{(rankingCriteria.distanceWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="pf-pill">
              📊 <span>Lower combined score = better rank</span>
            </div>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────── */}
        {results.length > 0 && (
          <div className="pf-results">
            {results.map((r) => {
              const pid = r.pharmacy.pharmacyId;
              const hasMap = r.pharmacy.latitude && r.pharmacy.longitude;
              const mapSrc = hasMap
                ? `https://www.openstreetmap.org/export/embed.html?bbox=${r.pharmacy.longitude - 0.005}%2C${r.pharmacy.latitude - 0.005}%2C${r.pharmacy.longitude + 0.005}%2C${r.pharmacy.latitude + 0.005}&layer=mapnik&marker=${r.pharmacy.latitude}%2C${r.pharmacy.longitude}`
                : null;

              return (
                <div key={pid} className="pf-card">
                  {/* ── Card header ───────────────────────────── */}
                  <div className="pf-card-head">
                    <div>
                      <p className="pf-card-name">
                        {r.pharmacy.name}
                        {r.pharmacy.isVerified && (
                          <span className="pf-verified" style={{ marginLeft: ".5rem" }}>✔ Verified</span>
                        )}
                      </p>
                      <p className="pf-card-addr">
                        {r.pharmacy.address?.street && `${r.pharmacy.address.street}, `}
                        {r.pharmacy.address?.city}
                        {r.pharmacy.address?.province && `, ${r.pharmacy.address.province}`}
                      </p>
                    </div>
                    <div className="pf-card-meta">
                      <RankBadge rank={r.rank} />
                      <span className="pf-dist-badge">📍 {r.pharmacy.distanceLabel}</span>
                      {r.pharmacy.is24Hours && <span className="pf-24h-badge">🕛 24h</span>}
                    </div>
                  </div>

                  {/* ── Card body — scores + medicines ────────── */}
                  <div className="pf-card-body">
                    {/* Score breakdown */}
                    <div className="pf-scores">
                      <p className="pf-scores-ttl">Ranking Scores</p>

                      <ScoreBar
                        label="Price score"
                        value={r.scoreBreakdown ? r.scoreBreakdown.priceScore : 0}
                        color="linear-gradient(90deg,#059669,#34d399)"
                      />
                      <ScoreBar
                        label="Distance score"
                        value={r.scoreBreakdown ? r.scoreBreakdown.distanceScore : 0}
                        color="linear-gradient(90deg,#6366f1,#a5b4fc)"
                      />

                      <div className="pf-combined">
                        <span className="pf-combined-lbl">
                          Combined score
                          {r.scoreBreakdown && (
                            <span style={{ fontWeight: 400, marginLeft: ".3rem", color: "#047857" }}>
                              ({(r.scoreBreakdown.priceWeight * 100).toFixed(0)}% price +{" "}
                              {(r.scoreBreakdown.distanceWeight * 100).toFixed(0)}% dist)
                            </span>
                          )}
                        </span>
                        <span className="pf-combined-val">
                          {r.score != null
                            ? `${((1 - r.score) * 100).toFixed(0)}%`
                            : "N/A"}
                        </span>
                      </div>

                      {r.scoreBreakdown && (
                        <div style={{ fontSize: ".73rem", color: "#94a3b8", marginTop: ".25rem" }}>
                          Price score: {(r.scoreBreakdown.priceScore * 100).toFixed(1)}% · 
                          Distance score: {(r.scoreBreakdown.distanceScore * 100).toFixed(1)}% · 
                          Raw combined: {r.score}
                        </div>
                      )}
                    </div>

                    {/* Medicine availability */}
                    <div>
                      <p className="pf-med-ttl">Medicine Availability</p>
                      <table className="pf-med-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Strength</th>
                            <th>Price</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.medicines.map((m, i) => (
                            <tr key={i}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{m.genericName || "—"}</div>
                                {m.brandName && m.brandName !== "Generic" && (
                                  <div style={{ fontSize: ".72rem", color: "#94a3b8" }}>
                                    {m.brandName}
                                  </div>
                                )}
                              </td>
                              <td>{m.strength || m.dosageForm || "—"}</td>
                              <td>
                                {m.currency} {m.pricePerUnit?.toFixed(2)}
                              </td>
                              <td>
                                {m.inStock ? (
                                  <span className="pf-in-stock">✓ {m.quantityInStock}</span>
                                ) : (
                                  <span className="pf-out-stock">✗</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Card footer — price + actions ─────────── */}
                  <div className="pf-card-foot">
                    <div>
                      <div className="pf-price">{r.pricing.cheapestLabel}</div>
                      <div className="pf-price-sub">Total for this prescription</div>
                    </div>
                    <div className="pf-actions">
                      {r.pharmacy.phone && (
                        <a
                          href={`tel:${r.pharmacy.phone}`}
                          className="pf-call-btn"
                        >
                          📞 {r.pharmacy.phone}
                        </a>
                      )}
                      {hasMap && (
                        <button
                          className={`pf-map-btn${expandedMap === pid ? " active" : ""}`}
                          onClick={() => toggleMap(pid)}
                        >
                          🗺️ {expandedMap === pid ? "Hide Map" : "Show on Map"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Inline map (no redirect) ───────────────── */}
                  {expandedMap === pid && hasMap && (
                    <div className="pf-map-wrap">
                      <iframe
                        className="pf-map-frame"
                        src={mapSrc}
                        title={`Map for ${r.pharmacy.name}`}
                        loading="lazy"
                      />
                      <div className="pf-map-footer">
                        <span className="pf-map-coords">
                          {r.pharmacy.latitude?.toFixed(5)}, {r.pharmacy.longitude?.toFixed(5)}
                        </span>
                        <a
                          href={r.pharmacy.directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pf-osm-link"
                        >
                          Open full map ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Empty state (after search, no results) ──────────────── */}
        {!loading && results.length === 0 && !message && (
          <div className="pf-empty">
            <div className="pf-empty-icon">🏪</div>
            <p>Select a prescription and enter your address to find nearby pharmacies.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PharmacyFinder;
