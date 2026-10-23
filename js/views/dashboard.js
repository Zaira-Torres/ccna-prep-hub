/* ==========================================================================
   CCNA Prep Hub - View: Dashboard
   Readiness score ring, Cisco blueprint breakdown, exam history, activity.
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  App.view("dashboard", function (host) {
    const totals = App.totals();
    const r = App.readiness();
    const streak = App.streakDays();
    const dueCount = App.dueReview().length;
    const errorCount = App.errorBank().length;
    const ds = r.domains;

    const lastExam = App.state.exams.length
      ? App.state.exams[App.state.exams.length - 1]
      : null;

    host.innerHTML = `
      <div class="page-head">
        <div>
          <div class="eyebrow">Plataforma de Entrenamiento</div>
          <h1>Dashboard de Preparación CCNA 200-301</h1>
          <p>Mide tu nivel real con base en los 6 dominios oficiales del blueprint de Cisco.</p>
        </div>
        <div class="row">
          <button class="btn btn-primary btn-lg" onclick="App.go('exam')">
            ${App.icon("play")} Iniciar Simulacro Oficial (120 min)
          </button>
        </div>
      </div>

      <!-- Top stats -->
      <div class="grid grid-4" style="margin-bottom: 22px;">
        <div class="card stat">
          <div class="stat-icon">${App.icon("fire")}</div>
          <span class="stat-label">Racha de estudio</span>
          <span class="stat-value">${streak} <small style="font-size: 1.1rem; font-weight: 600;">días</small></span>
          <span class="stat-sub">${App.today()} &bull; Activo</span>
        </div>

        <div class="card stat">
          <div class="stat-icon">${App.icon("target")}</div>
          <span class="stat-label">Preguntas respondidas</span>
          <span class="stat-value">${totals.seen} <small style="font-size: 1.1rem; color: var(--text-2);">/ ${App.questions.length}</small></span>
          <span class="stat-sub">${Math.round((totals.seen / Math.max(1, App.questions.length)) * 100)}% de cobertura del banco</span>
        </div>

        <div class="card stat">
          <div class="stat-icon">${App.icon("check")}</div>
          <span class="stat-label">Precisión global</span>
          <span class="stat-value">${Math.round(totals.accuracy * 100)}%</span>
          <span class="stat-sub">${totals.correct} aciertos de ${totals.attempts} intentos</span>
        </div>

        <div class="card stat">
          <div class="stat-icon" style="color: var(--danger);">${App.icon("review")}</div>
          <span class="stat-label">Banco de errores</span>
          <span class="stat-value">${errorCount}</span>
          <span class="stat-sub">${dueCount ? `<b style="color: var(--danger);">${dueCount} listas para repasar hoy</b>` : "Al día con el repaso"}</span>
        </div>
      </div>

      <!-- Readiness Hero + Blueprint Radar -->
      <div class="grid grid-2" style="margin-bottom: 22px;">
        <div class="card score-hero">
          <div class="ring" style="width: 190px; height: 190px;">
            ${App.ring(r.readiness, 190, 14)}
            <div class="ring-label">
              <strong>${r.readiness}%</strong>
              <span>Readiness</span>
            </div>
          </div>
          <div>
            <div class="eyebrow" style="margin-bottom: 4px;">Índice de Preparación</div>
            <h2 style="font-size: 1.45rem; margin-bottom: 8px;">
              ${r.readiness >= 85 ? "¡Listo para el Examen Oficial!" : r.readiness >= 70 ? "Buen progreso &bull; En zona de consolidación" : "En fase de estudio y absorción"}
            </h2>
            <p class="small muted" style="margin-bottom: 14px;">
              Calculado ponderando tu precisión en cada dominio según su peso oficial en el CCNA 200-301 (Network Fundamentals 20%, IP Connectivity 25%, etc.).
            </p>
            <div class="row">
              <span class="pill ${r.readiness >= 85 ? "success" : "warning"}">Meta para agendar: &ge; 85%</span>
              <span class="pill">Cobertura: ${r.coverage}%</span>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="card">
          <div class="card-title">
            <h3>${App.icon("bolt")} Accesos Directos</h3>
          </div>
          <div class="grid grid-2" style="gap: 12px;">
            <div class="card hoverable" style="padding: 14px;" onclick="App.go('practice')">
              <div class="row" style="gap: 10px; margin-bottom: 6px;">
                <span class="pill domain" style="--c: var(--accent);">${App.icon("practice")} Práctica</span>
              </div>
              <strong style="display: block; font-size: 0.95rem;">Modo Estudio por Dominio</strong>
              <span class="small muted">Feedback inmediato con explicaciones.</span>
            </div>

            <div class="card hoverable" style="padding: 14px;" onclick="App.go('subnet')">
              <div class="row" style="gap: 10px; margin-bottom: 6px;">
                <span class="pill domain" style="--c: var(--d-automation);">${App.icon("subnet")} Dojo</span>
              </div>
              <strong style="display: block; font-size: 0.95rem;">Subnetting Speed Drill</strong>
              <span class="small muted">Ejercicios infinitos de cálculo rápido CIDR.</span>
            </div>

            <div class="card hoverable" style="padding: 14px;" onclick="App.go('review')">
              <div class="row" style="gap: 10px; margin-bottom: 6px;">
                <span class="pill danger">${App.icon("review")} Errores (${dueCount})</span>
              </div>
              <strong style="display: block; font-size: 0.95rem;">Repetición Espaciada</strong>
              <span class="small muted">Repasa solo lo que has fallado (Leitner).</span>
            </div>

            <div class="card hoverable" style="padding: 14px;" onclick="App.go('exam')">
              <div class="row" style="gap: 10px; margin-bottom: 6px;">
                <span class="pill domain" style="--c: var(--d-services);">${App.icon("exam")} Simulador</span>
              </div>
              <strong style="display: block; font-size: 0.95rem;">Examen Pearson VUE</strong>
              <span class="small muted">100 preguntas, 120 min, puntaje 300-1000.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Domain breakdown -->
      <div class="grid grid-2" style="margin-bottom: 22px;">
        <div class="card">
          <div class="card-title">
            <h3>${App.icon("layers")} Desglose por Dominio Oficial Cisco</h3>
            <span class="small muted">Blueprint CCNA 200-301</span>
          </div>
          <div class="stack" style="gap: 16px;">
            ${App.DOMAINS.map((d) => {
              const st = ds[d.id] || { total: 0, seen: 0, accuracy: 0 };
              const pct = Math.round(st.accuracy * 100);
              return `
                <div class="domain-row">
                  <div class="name">
                    <span class="dot" style="--c: ${d.color};"></span>
                    <span>${App.esc(d.name)}</span>
                    <span class="pill" style="font-size: 0.68rem;">Peso: ${Math.round(d.weight * 100)}%</span>
                  </div>
                  <div class="pct" style="color: ${pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)"};">
                    ${pct}%
                  </div>
                  <div class="bar">
                    <span style="--c: ${d.color}; width: ${pct}%;"></span>
                  </div>
                  <div class="meta">
                    ${st.seen} vistas de ${st.total} preguntas disponibles en este dominio
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Recent exam & activity -->
        <div class="card">
          <div class="card-title">
            <h3>${App.icon("trophy")} Último Simulacro</h3>
            ${lastExam ? `<span class="small muted">${App.fmtDate(lastExam.date)}</span>` : ""}
          </div>
          ${
            lastExam
              ? `
            <div style="text-align: center; padding: 18px 0;">
              <div class="verdict ${lastExam.passed ? "pass" : "fail"}" style="font-size: 2.2rem; margin-bottom: 4px;">
                ${lastExam.score} <small style="font-size: 1.1rem; color: var(--text-2);">/ 1000</small>
              </div>
              <div style="font-weight: 700; margin-bottom: 12px; color: ${lastExam.passed ? "var(--success)" : "var(--danger)"};">
                ${lastExam.passed ? "APROBADO (Superó los 825 puntos requeridos)" : "NO APROBADO (Puntaje mínimo: 825)"}
              </div>
              <div class="row" style="justify-content: center; gap: 16px; margin-bottom: 18px;">
                <span class="pill">Aciertos: ${lastExam.correct}/${lastExam.total} (${Math.round((lastExam.correct / lastExam.total) * 100)}%)</span>
                <span class="pill">Tiempo: ${App.fmtTime(lastExam.timeSpent)}</span>
              </div>
              <button class="btn btn-sm" onclick="App.go('exam')">Repetir Simulacro</button>
            </div>
          `
              : `
            <div class="empty" style="padding: 30px 10px;">
              ${App.icon("exam")}
              <h3>Aún no has realizado ningún simulacro</h3>
              <p class="small muted" style="margin-bottom: 14px;">Pon a prueba tus conocimientos con el formato cronometrado de Pearson VUE.</p>
              <button class="btn btn-primary btn-sm" onclick="App.go('exam')">Hacer mi primer simulacro</button>
            </div>
          `
          }

          <div class="divider"></div>
          <div class="card-title" style="margin-bottom: 10px;">
            <h3>${App.icon("clock")} Actividad Reciente</h3>
            <span class="small muted">Últimos 14 días</span>
          </div>
          <div class="heatmap">
            ${Array.from({ length: 14 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (13 - i));
              const key = App.today(d);
              const count = App.state.activity[key] || 0;
              const lvl = count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : count < 50 ? 3 : 4;
              return `<i data-l="${lvl}" title="${key}: ${count} respuestas"></i>`;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    App.animateRings(host);
  });
})();
