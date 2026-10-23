/* ==========================================================================
   CCNA Prep Hub - View: Review (Banco de Errores & Spaced Repetition)
   Leitner 5-box system, daily review queue, error bank search & flashcards.
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  App.view("review", function (host) {
    let activeBoxFilter = "all"; // all | 1 | 2 | 3 | 4 | 5
    let searchQuery = "";

    function getBoxCounts() {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      Object.values(App.state.attempts).forEach((a) => {
        if (a.everWrong && a.box >= 1 && a.box <= 5) {
          counts[a.box]++;
        }
      });
      return counts;
    }

    function render() {
      const dueList = App.dueReview();
      const allErrors = App.errorBank();
      const boxCounts = getBoxCounts();

      let filtered = allErrors;
      if (activeBoxFilter !== "all") {
        const boxNum = parseInt(activeBoxFilter, 10);
        filtered = filtered.filter((x) => x.a.box === boxNum);
      }
      if (searchQuery.trim()) {
        const qLower = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (x) =>
            x.q.question.toLowerCase().includes(qLower) ||
            (x.q.explanation && x.q.explanation.toLowerCase().includes(qLower))
        );
      }

      host.innerHTML = `
        <div class="page-head">
          <div>
            <div class="eyebrow">Repetición Espaciada (Método Leitner)</div>
            <h1>Banco de Errores & Memoria Activa</h1>
            <p>La técnica más efectiva para no volver a cometer los mismos fallos en el examen oficial.</p>
          </div>
          <div class="row">
            ${
              dueList.length > 0
                ? `
              <button class="btn btn-primary btn-lg" id="btnStartDueReview">
                ${App.icon("fire")} Repasar Pendientes de Hoy (${dueList.length})
              </button>
            `
                : `
              <span class="pill success" style="padding: 8px 14px; font-size: 0.88rem;">
                ${App.icon("check")} ¡Estás al día con tus repasos!
              </span>
            `
            }
          </div>
        </div>

        <!-- Leitner Boxes Header -->
        <div class="card" style="margin-bottom: 22px;">
          <div class="card-title">
            <h3>${App.icon("layers")} Cajas de Memoria a Largo Plazo</h3>
            <span class="small muted">Cada acierto asciende la pregunta de caja; cada fallo la regresa a la Caja 1.</span>
          </div>

          <div class="boxes">
            ${[
              { box: 1, name: "Caja 1", freq: "Cada 1 día", color: "var(--danger)" },
              { box: 2, name: "Caja 2", freq: "Cada 3 días", color: "var(--warning)" },
              { box: 3, name: "Caja 3", freq: "Cada 7 días", color: "var(--accent)" },
              { box: 4, name: "Caja 4", freq: "Cada 16 días", color: "var(--d-access)" },
              { box: 5, name: "Caja 5", freq: "Dominadas (35d)", color: "var(--success)" },
            ]
              .map((b) => {
                const count = boxCounts[b.box] || 0;
                const isActive = activeBoxFilter === String(b.box);
                return `
                <div class="box-cell ${isActive ? "active" : ""}" style="cursor: pointer; ${isActive ? `border-color: ${b.color}; background: color-mix(in srgb, ${b.color} 12%, transparent);` : ""}" data-box="${b.box}">
                  <strong style="color: ${b.color};">${count}</strong>
                  <div style="font-weight: 700; font-size: 0.85rem; margin-top: 4px;">${b.name}</div>
                  <span>${b.freq}</span>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>

        <!-- Search & Filter bar -->
        <div class="card" style="padding: 16px 20px; margin-bottom: 20px;">
          <div class="row-between">
            <div class="row" style="gap: 8px;">
              <span class="small muted" style="font-weight: 600;">Ver caja:</span>
              <button class="chip ${activeBoxFilter === "all" ? "active" : ""}" data-box-filter="all">
                Todas (${allErrors.length})
              </button>
              ${[1, 2, 3, 4, 5]
                .map(
                  (b) => `
                <button class="chip ${activeBoxFilter === String(b) ? "active" : ""}" data-box-filter="${b}">
                  Caja ${b} (${boxCounts[b] || 0})
                </button>
              `
                )
                .join("")}
            </div>

            <div style="min-width: 280px;">
              <input type="text" class="input" id="searchErrors" placeholder="Buscar concepto o palabra clave..." value="${App.esc(searchQuery)}">
            </div>
          </div>
        </div>

        <!-- Question List -->
        ${
          filtered.length === 0
            ? `
          <div class="card empty">
            ${App.icon("check")}
            <h3>No hay preguntas en esta vista</h3>
            <p class="small muted">
              ${allErrors.length === 0 ? "¡Excelente! Aún no has fallado preguntas o has dominado todas." : "No se encontraron coincidencias para la búsqueda seleccionada."}
            </p>
          </div>
        `
            : `
          <div class="q-list">
            ${filtered
              .map(({ q, a }) => {
                const d = App.domain(q.domain);
                const isDue = a.due <= Date.now();
                return `
                <div class="card q-item" data-qid="${q.id}">
                  <div>
                    <div class="title">${App.esc(q.question)}</div>
                    <div class="meta">
                      ${App.domainPill(q.domain)}
                      <span class="pill" style="color: var(--accent);">Caja ${a.box} / 5</span>
                      <span class="pill ${isDue ? "danger" : "warning"}">
                        ${isDue ? "Pendiente para hoy" : `Próximo repaso en ${Math.max(1, Math.round((a.due - Date.now()) / 86400000))} días`}
                      </span>
                      <span class="pill">Visto ${a.seen} veces (${a.correct} aciertos)</span>
                    </div>
                  </div>

                  <div class="row">
                    <button class="btn btn-sm btn-primary btn-practice-one" data-qid="${q.id}">
                      Practicar ${App.icon("arrowR")}
                    </button>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        `
        }
      `;

      attachReviewEvents();
    }

    function attachReviewEvents() {
      // Box clicks from cards and chips
      App.$$(".box-cell[data-box], .chip[data-box-filter]", host).forEach((el) => {
        el.addEventListener("click", () => {
          const b = el.dataset.box || el.dataset.boxFilter;
          activeBoxFilter = activeBoxFilter === b ? "all" : b;
          render();
        });
      });

      // Search input
      const searchInp = App.$("#searchErrors", host);
      if (searchInp) {
        searchInp.addEventListener("input", (e) => {
          searchQuery = e.target.value;
          render();
        });
      }

      // Start due review
      const btnStartDue = App.$("#btnStartDueReview", host);
      if (btnStartDue) {
        btnStartDue.addEventListener("click", () => {
          App.go("practice/all/due");
        });
      }

      // Practice one question
      App.$$(".btn-practice-one", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          const qid = btn.dataset.qid;
          App.go(`practice`);
        });
      });
    }

    render();
  });
})();
