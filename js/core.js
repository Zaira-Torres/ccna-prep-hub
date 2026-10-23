/* ==========================================================================
   CCNA Prep Hub - Core: domains, storage, stats, spaced repetition, router, UI utils.
   Classic script (no ES modules) so the app runs from file:// without a server.
   ========================================================================== */
(function () {
  "use strict";

  const App = (window.App = window.App || {});

  /* ---------------- Cisco CCNA 200-301 blueprint ---------------- */
  App.DOMAINS = [
    { id: "fundamentals", name: "Network Fundamentals", es: "Fundamentos de redes", weight: 0.20, color: "var(--d-fundamentals)" },
    { id: "access", name: "Network Access", es: "Acceso a la red", weight: 0.20, color: "var(--d-access)" },
    { id: "connectivity", name: "IP Connectivity", es: "Conectividad IP", weight: 0.25, color: "var(--d-connectivity)" },
    { id: "services", name: "IP Services", es: "Servicios IP", weight: 0.10, color: "var(--d-services)" },
    { id: "security", name: "Security Fundamentals", es: "Fundamentos de seguridad", weight: 0.15, color: "var(--d-security)" },
    { id: "automation", name: "Automation & Programmability", es: "Automatización y programabilidad", weight: 0.10, color: "var(--d-automation)" },
  ];
  App.domain = (id) => App.DOMAINS.find((d) => d.id === id) || App.DOMAINS[0];

  App.EXAM = { questions: 100, minutes: 120, passScaled: 825 };
  App.READY = { readiness: 85, coverage: 70, exams: 2 };

  /* ---------------- Question bank ---------------- */
  const data = window.CCNA_DATA || { questions: [] };
  App.questions = data.questions;
  App.byId = new Map(App.questions.map((q) => [q.id, q]));
  App.dataInfo = data.meta || {};

  App.isMulti = (q) => q.type !== "drag-drop" && (q.answer || []).length > 1;
  App.optionKeys = (q) => (q.type === "image-choice" ? q.letters : Object.keys(q.options || {}));

  /* ---------------- Storage ---------------- */
  const KEY = "ccna-hub-v1";
  const blank = () => ({ attempts: {}, exams: [], activity: {}, subnet: { attempts: 0, correct: 0, best: 0, history: [] }, session: null });

  App.state = (() => {
    try {
      return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (e) {
      return blank();
    }
  })();

  App.save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(App.state));
    } catch (e) {
      App.toast("No se pudo guardar el progreso (almacenamiento lleno).");
    }
  };

  App.resetAll = () => {
    App.state = blank();
    App.save();
  };

  App.exportProgress = () => {
    const blob = new Blob([JSON.stringify(App.state, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ccna-progreso-${App.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  App.importProgress = (file) =>
    file.text().then((txt) => {
      const parsed = JSON.parse(txt);
      if (!parsed || typeof parsed.attempts !== "object") throw new Error("Archivo inválido");
      App.state = Object.assign(blank(), parsed);
      App.save();
    });

  /* ---------------- Spaced repetition (Leitner, 5 boxes) ---------------- */
  const DAY = 86400000;
  App.BOX_DAYS = [0, 1, 3, 7, 16, 35];

  App.today = (d = new Date()) => {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  };

  /** Record an answer for a question; updates accuracy, streaks and Leitner box. */
  App.record = (qid, correct) => {
    const s = App.state;
    const a = s.attempts[qid] || { seen: 0, correct: 0, box: 0, due: 0, last: 0, lastOk: null, everWrong: false };
    a.seen += 1;
    a.last = Date.now();
    a.lastOk = !!correct;
    if (correct) {
      a.correct += 1;
      a.box = Math.min(5, (a.box || 0) + 1);
    } else {
      a.everWrong = true;
      a.box = 1;
    }
    a.due = Date.now() + App.BOX_DAYS[a.box] * DAY;
    s.attempts[qid] = a;
    const t = App.today();
    s.activity[t] = (s.activity[t] || 0) + 1;
    App.save();
  };

  /** Questions in the error bank: answered wrong at some point and not yet mastered (box < 5). */
  App.errorBank = () =>
    Object.entries(App.state.attempts)
      .filter(([id, a]) => a.everWrong && a.box < 5 && App.byId.has(id))
      .map(([id, a]) => ({ q: App.byId.get(id), a }));

  App.dueReview = () => App.errorBank().filter((x) => x.a.due <= Date.now());

  /* ---------------- Statistics ---------------- */
  App.domainStats = () => {
    const out = {};
    App.DOMAINS.forEach((d) => (out[d.id] = { total: 0, seen: 0, correctLast: 0, attempts: 0, correct: 0 }));
    App.questions.forEach((q) => {
      const st = out[q.domain];
      if (!st) return;
      st.total += 1;
      const a = App.state.attempts[q.id];
      if (a) {
        st.seen += 1;
        st.attempts += a.seen;
        st.correct += a.correct;
        if (a.lastOk) st.correctLast += 1;
      }
    });
    Object.values(out).forEach((st) => {
      // accuracy on the latest attempt of each seen question (reflects current knowledge)
      st.accuracy = st.seen ? st.correctLast / st.seen : 0;
      st.coverage = st.total ? st.seen / st.total : 0;
    });
    return out;
  };

  /** Blueprint-weighted readiness (0-100) and coverage (0-100). */
  App.readiness = () => {
    const ds = App.domainStats();
    let r = 0;
    let c = 0;
    App.DOMAINS.forEach((d) => {
      const st = ds[d.id];
      // Shrink accuracy toward 0 when very few questions have been seen, so 3/3 doesn't read as 100%.
      const confidence = Math.min(1, st.seen / 15);
      r += d.weight * st.accuracy * confidence;
      c += d.weight * st.coverage;
    });
    return { readiness: Math.round(r * 100), coverage: Math.round(c * 100), domains: ds };
  };

  App.totals = () => {
    const vals = Object.values(App.state.attempts);
    const seen = vals.length;
    const attempts = vals.reduce((s, a) => s + a.seen, 0);
    const correct = vals.reduce((s, a) => s + a.correct, 0);
    return { seen, attempts, correct, accuracy: attempts ? correct / attempts : 0 };
  };

  App.streakDays = () => {
    let n = 0;
    const d = new Date();
    if (!App.state.activity[App.today(d)]) d.setDate(d.getDate() - 1);
    while (App.state.activity[App.today(d)]) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  App.scaled = (pct) => Math.round(300 + 700 * pct);

  /* ---------------- Selection helpers ---------------- */
  App.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /** Pick `n` questions distributed across domains by blueprint weight. */
  App.pickWeighted = (pool, n, onlyAnswerable = true) => {
    let sourcePool = pool;
    if (onlyAnswerable) {
      const filtered = pool.filter(App.answerable);
      if (filtered.length >= n) sourcePool = filtered;
    }
    const byDom = {};
    App.shuffle(sourcePool).forEach((q) => (byDom[q.domain] = byDom[q.domain] || []).push(q));
    const picked = [];
    App.DOMAINS.forEach((d) => {
      const want = Math.round(n * d.weight);
      picked.push(...(byDom[d.id] || []).splice(0, want));
    });
    const rest = App.shuffle(Object.values(byDom).flat());
    while (picked.length < n && rest.length) picked.push(rest.pop());
    return App.shuffle(picked.slice(0, n));
  };

  /** Answerable = has the exhibit it needs (or doesn't need one). */
  App.answerable = (q) => !q.needsExhibit || !!q.image || q.type === "image-choice";

  /* ---------------- DOM helpers ---------------- */
  App.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /** Escape then linkify URLs (explanations often cite cisco.com docs). */
  App.richText = (s) =>
    App.esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  App.$ = (sel, root = document) => root.querySelector(sel);
  App.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  App.toast = (msg, ms = 2600) => {
    let wrap = App.$(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), ms);
  };

  App.lightbox = (src) => {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<img src="${App.esc(src)}" alt="Exhibit ampliado">`;
    lb.addEventListener("click", () => lb.remove());
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") {
        lb.remove();
        document.removeEventListener("keydown", onKey);
      }
    });
    document.body.appendChild(lb);
  };

  App.fmtTime = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const z = (n) => String(n).padStart(2, "0");
    return h ? `${h}:${z(m)}:${z(s)}` : `${z(m)}:${z(s)}`;
  };

  App.fmtDate = (ts) =>
    new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  App.ring = (pct, size = 190, stroke = 14, color = "url(#ringGrad)") => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#22d3ee"/><stop offset="60%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a855f7"/>
      </linearGradient></defs>
      <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
      <circle class="value" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke="${color}"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" data-offset="${off}"/>
    </svg>`;
  };

  /** Animate rings after insertion (CSS transition from full offset to target). */
  App.animateRings = (root = document) =>
    requestAnimationFrame(() =>
      App.$$(".ring .value", root).forEach((el) => el.setAttribute("stroke-dashoffset", el.dataset.offset))
    );

  App.domainPill = (id) => {
    const d = App.domain(id);
    return `<span class="pill domain" style="--c:${d.color}">${App.esc(d.es)}</span>`;
  };

  /* ---------------- Icons ---------------- */
  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    practice: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14.5"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20"/><path d="M9 7h6M9 11h6"/>',
    exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/>',
    subnet: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-2.5a1.5 1.5 0 0 1 1.5-1.5h11a1.5 1.5 0 0 1 1.5 1.5V17"/>',
    review: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    bank: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    fire: '<path d="M12 22c4.4 0 7-2.9 7-6.8 0-3.6-2.5-6-4.3-8.2-.4 2-1.4 3.2-2.7 3.9.3-3.3-1.2-6.5-4-8.9.2 3.5-3 6.1-3 10.6C5 19.1 7.6 22 12 22Z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    play: '<path d="M6 4l14 8-14 8V4Z"/>',
    brain: '<path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.3A3 3 0 0 0 4.5 9a3 3 0 0 0 0 5.6A3 3 0 0 0 7 19.2v.3A2.5 2.5 0 0 0 12 19.5V4.5A2.5 2.5 0 0 0 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.3A3 3 0 0 1 19.5 9a3 3 0 0 1 0 5.6 3 3 0 0 1-2.5 4.6v.3a2.5 2.5 0 0 1-5 0"/>',
  };
  App.icon = (name, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${P[name] || ""}</svg>`;

  /* ---------------- Router ---------------- */
  App.views = {};
  App.view = (name, render) => (App.views[name] = render);
  App.cleanup = null;

  App.go = (hash) => {
    if (location.hash === hash) App.route();
    else location.hash = hash;
  };

  App.route = () => {
    const [name, ...params] = (location.hash.replace(/^#\/?/, "") || "dashboard").split("/");
    const render = App.views[name] || App.views.dashboard;
    if (typeof App.cleanup === "function") App.cleanup();
    App.cleanup = null;
    const main = App.$("#main");
    main.innerHTML = "";
    const host = document.createElement("div");
    host.className = "view";
    main.appendChild(host);
    render(host, params);
    App.$$(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.route === name));
    App.$(".sidebar").classList.remove("open");
    App.refreshChrome();
    window.scrollTo({ top: 0 });
  };

  App.refreshChrome = () => {
    const due = App.dueReview().length;
    const badge = App.$("#reviewBadge");
    if (badge) badge.textContent = due ? String(due) : "";
    const r = App.readiness();
    const el = App.$("#sideReadiness");
    if (el) el.textContent = `${r.readiness}%`;
  };
})();
