/* ==========================================================================
   CCNA Prep Hub - View: Exam (Pearson VUE Simulation)
   120 min countdown, 100 blueprint-weighted questions, question grid navigator,
   flag for review, Cisco scaled scoring (300-1000, 825 passing mark), domain breakdown.
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  App.view("exam", function (host) {
    let examActive = false;
    let questions = [];
    let userAnswers = {}; // qid -> Set(keys) or { idx: rightVal }
    let flagged = new Set();
    let currentIndex = 0;
    let timeLeft = App.EXAM.minutes * 60; // 120 min in seconds
    let timerId = null;
    let examFinished = false;
    let examResult = null;
    let reviewMode = false;

    function startExam(count = 100) {
      questions = App.pickWeighted(App.questions, Math.min(count, App.questions.length));
      userAnswers = {};
      flagged = new Set();
      currentIndex = 0;
      timeLeft = Math.round((App.EXAM.minutes * 60 * questions.length) / 100);
      examActive = true;
      examFinished = false;
      examResult = null;
      reviewMode = false;

      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        timeLeft--;
        const el = App.$("#examTimer");
        if (el) {
          el.innerHTML = `${App.icon("clock")} ${App.fmtTime(timeLeft)}`;
          if (timeLeft <= 300) el.classList.add("low");
        }
        if (timeLeft <= 0) {
          clearInterval(timerId);
          finishExam();
        }
      }, 1000);

      renderExamUI();
    }

    function renderStartScreen() {
      host.innerHTML = `
        <div class="page-head">
          <div>
            <div class="eyebrow">Simulador Oficial</div>
            <h1>Simulador de Examen CCNA 200-301</h1>
            <p>Experiencia de prueba idéntica a Pearson VUE para evaluar tu preparación real.</p>
          </div>
        </div>

        <div class="grid grid-2" style="max-width: 1040px; margin: 0 auto;">
          <div class="card">
            <div class="card-title">
              <h3>${App.icon("exam")} Condiciones del Examen</h3>
            </div>
            <ul style="padding-left: 20px; line-height: 1.8; color: var(--text-1); margin-bottom: 24px;">
              <li><b>100 preguntas</b> seleccionadas por ponderación oficial del blueprint.</li>
              <li><b>120 minutos</b> de tiempo límite sin pausas.</li>
              <li>Puntaje escalado oficial de Cisco: de <b>300 a 1000 puntos</b>.</li>
              <li>Puntaje mínimo de aprobación: <b>825 puntos (~82.5%)</b>.</li>
              <li>Incluye preguntas de opción múltiple y arrastrar/soltar (Drag & Drop).</li>
              <li>Puedes marcar preguntas con bandera (Flag) para revisarlas antes de entregar.</li>
            </ul>

            <div class="row" style="gap: 14px;">
              <button class="btn btn-primary btn-lg" id="btnStartFull">
                ${App.icon("play")} Iniciar Examen Completo (100 preguntas)
              </button>
              <button class="btn btn-lg" id="btnStartQuick">
                Modo Express (30 preguntas &bull; 36 min)
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-title">
              <h3>${App.icon("layers")} Distribución por Dominio</h3>
            </div>
            <div class="stack" style="gap: 12px;">
              ${App.DOMAINS.map(
                (d) => `
                <div class="row-between" style="padding: 10px 12px; border-radius: 10px; background: rgba(148, 178, 255, 0.04);">
                  <div class="row" style="gap: 10px;">
                    <span class="dot" style="--c: ${d.color}; width: 10px; height: 10px; border-radius: 3px;"></span>
                    <strong style="font-size: 0.9rem;">${App.esc(d.name)}</strong>
                  </div>
                  <span class="pill domain" style="--c: ${d.color};">${Math.round(d.weight * 100)}%</span>
                </div>
              `
              ).join("")}
            </div>
          </div>
        </div>
      `;

      App.$("#btnStartFull").addEventListener("click", () => startExam(100));
      App.$("#btnStartQuick").addEventListener("click", () => startExam(30));
    }

    function renderExamUI() {
      const q = questions[currentIndex];
      const isFlagged = flagged.has(q.id);
      const isAnswered = isQuestionAnswered(q);

      host.innerHTML = `
        <div class="runner">
          <div>
            <div class="runner-top">
              <div class="row">
                <span class="pill" style="font-family: var(--mono); font-weight: 700; font-size: 0.88rem;">
                  Pregunta ${currentIndex + 1} de ${questions.length}
                </span>
                ${App.domainPill(q.domain)}
                <span class="pill">${q.type === "drag-drop" ? "Drag & Drop" : App.isMulti(q) ? "Múltiple respuesta" : "Opción única"}</span>
              </div>

              <div class="row">
                <div class="timer ${timeLeft <= 300 ? "low" : ""}" id="examTimer">
                  ${App.icon("clock")} ${App.fmtTime(timeLeft)}
                </div>
                <button class="btn btn-sm ${isFlagged ? "is-on" : ""}" id="btnExamFlag">
                  ${App.icon("flag")} ${isFlagged ? "Marcada" : "Marcar para revisión"}
                </button>
              </div>
            </div>

            <div class="card q-card">
              <div class="q-text">${App.esc(q.question)}</div>

              ${
                q.needsExhibit && !q.image
                  ? `
                <div class="exhibit-missing">
                  ${App.icon("image", 'style="width: 16px; height: 16px; vertical-align: -2px;"')}
                  Esta pregunta hace referencia a una topología o salida de comando (exhibit).
                </div>
              `
                  : ""
              }

              ${
                q.image
                  ? `
                <div class="exhibit" onclick="App.lightbox('${App.esc(q.image)}')">
                  <img src="${App.esc(q.image)}" alt="Exhibit">
                  <span class="exhibit-tag">Clic para ampliar</span>
                </div>
              `
                  : ""
              }

              ${
                q.type === "drag-drop"
                  ? renderExamDragDrop(q)
                  : renderExamOptions(q)
              }

              ${
                reviewMode
                  ? `
                <div class="feedback ${isQuestionCorrect(q) ? "ok" : "bad"}">
                  <h4>
                    ${isQuestionCorrect(q) ? App.icon("check") : App.icon("x")}
                    ${isQuestionCorrect(q) ? "Respuesta Correcta" : "Respuesta Incorrecta"}
                  </h4>
                  <p>${App.richText(q.explanation || "Sin explicación registrada.")}</p>
                  ${!isQuestionCorrect(q) && q.answer && q.answer.length ? `<div style="margin-top: 8px; font-weight: 700; color: var(--success);">Respuesta oficial: ${q.answer.join(", ")}</div>` : ""}
                </div>
              `
                  : ""
              }

              <div class="q-actions">
                <button class="btn" id="btnExamPrev" ${currentIndex === 0 ? "disabled" : ""}>
                  ${App.icon("arrowL")} Anterior
                </button>

                <div class="row">
                  ${
                    currentIndex < questions.length - 1
                      ? `<button class="btn btn-primary" id="btnExamNext">Siguiente ${App.icon("arrowR")}</button>`
                      : !reviewMode
                      ? `<button class="btn btn-primary" id="btnExamFinish">Finalizar y Calificar Examen</button>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Navigator Sidebar -->
          <div class="card navigator">
            <div class="card-title" style="margin-bottom: 12px;">
              <h3>${App.icon("layers")} Navegador</h3>
              <span class="small muted">${Object.keys(userAnswers).length}/${questions.length}</span>
            </div>

            <div class="nav-grid">
              ${questions
                .map((item, idx) => {
                  let cls = "nav-cell";
                  if (idx === currentIndex) cls += " current";
                  if (reviewMode) {
                    cls += isQuestionCorrect(item) ? " correct" : " wrong";
                  } else {
                    if (isQuestionAnswered(item)) cls += " answered";
                  }
                  if (flagged.has(item.id)) cls += " flagged";
                  return `<button class="${cls}" data-nav="${idx}">${idx + 1}</button>`;
                })
                .join("")}
            </div>

            <div class="legend">
              <span><i style="background: rgba(34, 211, 238, 0.2); border: 1px solid var(--accent);"></i> Respondida</span>
              <span><i style="background: var(--warning); border-radius: 50%;"></i> Marcada</span>
              <span><i style="background: rgba(148, 178, 255, 0.05); border: 1px solid var(--border);"></i> Pendiente</span>
            </div>

            ${
              !reviewMode
                ? `
              <div class="divider"></div>
              <button class="btn btn-danger btn-sm" id="btnEndExamDirect" style="width: 100%;">
                Entregar Examen Ahora
              </button>
            `
                : `
              <div class="divider"></div>
              <button class="btn btn-primary btn-sm" id="btnBackToReport" style="width: 100%;">
                Volver al Reporte de Calificación
              </button>
            `
            }
          </div>
        </div>
      `;

      attachExamEvents();
    }

    function renderExamOptions(q) {
      const multi = App.isMulti(q);
      const chosen = userAnswers[q.id] || new Set();

      if (q.type === "image-choice") {
        const letters = q.letters || Object.keys(q.options || {}) || ["A", "B", "C", "D"];
        return `
          <div style="margin-top: 18px;">
            <div class="q-hint" style="margin-bottom: 8px;">
              ${multi ? `Selecciona tus respuestas (${q.answer.length} opciones):` : "Selecciona tu respuesta:"}
            </div>
            <div class="letter-grid">
              ${letters
                .map((k) => {
                  const isSelected = chosen.has(k);
                  let cls = "option";
                  if (isSelected) cls += " selected";
                  if (reviewMode) {
                    const correct = (q.answer || []).includes(k);
                    if (correct) cls += " correct";
                    else if (isSelected) cls += " wrong";
                  }
                  return `
                    <button class="${cls}" data-key="${k}" ${reviewMode ? "disabled" : ""}>
                      <span class="key">${k}</span>
                      <span class="txt" style="font-weight: 700;">Opción ${k}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>
        `;
      }

      return `
        <div class="options">
          ${multi ? `<div class="q-hint">Selecciona todas las opciones que correspondan (${q.answer.length} opciones).</div>` : ""}
          ${Object.keys(q.options || {})
            .map((k) => {
              const text = q.options[k];
              const isSelected = chosen.has(k);
              let cls = "option";
              if (multi) cls += " multi";
              if (isSelected) cls += " selected";
              if (reviewMode) {
                const correct = (q.answer || []).includes(k);
                if (correct) cls += " correct";
                else if (isSelected) cls += " wrong";
              }
              return `
                <button class="${cls}" data-key="${k}" ${reviewMode ? "disabled" : ""}>
                  <span class="key">${k}</span>
                  <span class="txt">${App.esc(text)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function renderExamDragDrop(q) {
      const pairs = q.pairs || [];
      const rights = App.shuffle([...new Set(pairs.map((p) => p.right))]);
      const currentMap = userAnswers[q.id] || {};

      return `
        <div class="match">
          <div class="q-hint" style="margin-bottom: 6px;">Empareja los elementos:</div>
          ${pairs
            .map((p, idx) => {
              const val = currentMap[idx] || "";
              let rowCls = "match-row";
              if (reviewMode) rowCls += val === p.right ? " correct" : " wrong";
              return `
                <div class="${rowCls}">
                  <div><strong>${App.esc(p.left)}</strong></div>
                  <div>
                    <select class="input mono sel-exam-match" data-idx="${idx}" ${reviewMode ? "disabled" : ""}>
                      <option value="">-- Seleccionar --</option>
                      ${rights
                        .map(
                          (r) => `<option value="${App.esc(r)}" ${val === r ? "selected" : ""}>${App.esc(r)}</option>`
                        )
                        .join("")}
                    </select>
                  </div>
                  ${reviewMode && val !== p.right ? `<div class="fix">Correcto: <b>${App.esc(p.right)}</b></div>` : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function isQuestionAnswered(q) {
      const a = userAnswers[q.id];
      if (!a) return false;
      if (q.type === "drag-drop") {
        return Object.keys(a).length === (q.pairs || []).length;
      }
      return a.size > 0;
    }

    function isQuestionCorrect(q) {
      const a = userAnswers[q.id];
      if (!a) return false;
      if (q.type === "drag-drop") {
        return (q.pairs || []).every((p, idx) => a[idx] === p.right);
      }
      const target = new Set(q.answer || []);
      return a.size === target.size && [...a].every((x) => target.has(x));
    }

    function attachExamEvents() {
      // Option clicks
      App.$$(".option[data-key]", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          if (reviewMode) return;
          const k = btn.dataset.key;
          const q = questions[currentIndex];
          if (!userAnswers[q.id]) userAnswers[q.id] = new Set();
          const cur = userAnswers[q.id];

          if (App.isMulti(q)) {
            if (cur.has(k)) cur.delete(k);
            else cur.add(k);
          } else {
            userAnswers[q.id] = new Set([k]);
          }
          renderExamUI();
        });
      });

      // Match select
      App.$$(".sel-exam-match", host).forEach((sel) => {
        sel.addEventListener("change", (e) => {
          if (reviewMode) return;
          const q = questions[currentIndex];
          if (!userAnswers[q.id]) userAnswers[q.id] = {};
          userAnswers[q.id][parseInt(e.target.dataset.idx, 10)] = e.target.value;
          renderExamUI();
        });
      });

      // Navigation
      App.$$(".nav-cell[data-nav]", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          currentIndex = parseInt(btn.dataset.nav, 10);
          renderExamUI();
        });
      });

      // Flag
      const btnFlag = App.$("#btnExamFlag", host);
      if (btnFlag) {
        btnFlag.addEventListener("click", () => {
          const q = questions[currentIndex];
          if (flagged.has(q.id)) flagged.delete(q.id);
          else flagged.add(q.id);
          renderExamUI();
        });
      }

      // Prev / Next
      const btnPrev = App.$("#btnExamPrev", host);
      if (btnPrev) {
        btnPrev.addEventListener("click", () => {
          if (currentIndex > 0) {
            currentIndex--;
            renderExamUI();
          }
        });
      }

      const btnNext = App.$("#btnExamNext", host);
      if (btnNext) {
        btnNext.addEventListener("click", () => {
          if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderExamUI();
          }
        });
      }

      // Finish / End
      const btnFinish = App.$("#btnExamFinish", host);
      const btnEndDirect = App.$("#btnEndExamDirect", host);
      const handleFinish = () => {
        const unanswered = questions.length - Object.keys(userAnswers).length;
        const msg = unanswered > 0
          ? `Tienes ${unanswered} preguntas sin responder y ${flagged.size} marcadas para revisión.\n¿Deseas finalizar y calificar ahora?`
          : `Has respondido las ${questions.length} preguntas.\n¿Confirmas la entrega del examen?`;
        if (confirm(msg)) finishExam();
      };

      if (btnFinish) btnFinish.addEventListener("click", handleFinish);
      if (btnEndDirect) btnEndDirect.addEventListener("click", handleFinish);

      // Back to report
      const btnBack = App.$("#btnBackToReport", host);
      if (btnBack) btnBack.addEventListener("click", renderResultScreen);
    }

    function finishExam() {
      if (timerId) clearInterval(timerId);
      examActive = false;
      examFinished = true;

      let correctCount = 0;
      const domainBreakdown = {};
      App.DOMAINS.forEach((d) => (domainBreakdown[d.id] = { total: 0, correct: 0 }));

      questions.forEach((q) => {
        const ok = isQuestionCorrect(q);
        if (ok) correctCount++;
        App.record(q.id, ok); // saves into global stats & error bank
        if (domainBreakdown[q.domain]) {
          domainBreakdown[q.domain].total++;
          if (ok) domainBreakdown[q.domain].correct++;
        }
      });

      const total = questions.length;
      const pct = total ? correctCount / total : 0;
      const scaledScore = App.scaled(pct);
      const passed = scaledScore >= App.EXAM.passScaled;
      const timeSpent = (App.EXAM.minutes * 60) - Math.max(0, timeLeft);

      examResult = {
        date: Date.now(),
        total,
        correct: correctCount,
        score: scaledScore,
        passed,
        timeSpent,
        domainBreakdown,
      };

      App.state.exams.push(examResult);
      App.save();
      renderResultScreen();
    }

    function renderResultScreen() {
      const res = examResult;
      host.innerHTML = `
        <div class="page-head">
          <div>
            <div class="eyebrow">Reporte de Calificación Oficial</div>
            <h1>Resultado del Simulacro CCNA</h1>
            <p>Evaluación generada con el modelo de puntuación escalada Pearson VUE / Cisco.</p>
          </div>
          <div class="row">
            <button class="btn btn-primary" id="btnReviewAll">
              ${App.icon("search")} Revisar Preguntas con Explicaciones
            </button>
            <button class="btn" onclick="App.go('dashboard')">
              Volver al Dashboard
            </button>
          </div>
        </div>

        <!-- Hero score -->
        <div class="card score-hero" style="margin-bottom: 24px;">
          <div class="ring" style="width: 190px; height: 190px;">
            ${App.ring(Math.round((res.correct / res.total) * 100), 190, 14, res.passed ? "var(--success)" : "var(--danger)")}
            <div class="ring-label">
              <strong>${res.score}</strong>
              <span>de 1000</span>
            </div>
          </div>
          <div>
            <div class="verdict ${res.passed ? "pass" : "fail"}">
              ${res.passed ? "¡APROBADO! PASS" : "NO APROBADO &bull; FAIL"}
            </div>
            <p style="margin-top: 6px; font-size: 1.05rem; color: var(--text-1);">
              ${
                res.passed
                  ? "¡Excelente trabajo! Has superado la puntuación mínima oficial requerida (825 / 1000)."
                  : "Estuviste cerca. La certificación oficial CCNA requiere al menos 825 puntos para aprobar. Revisa las áreas débiles a continuación."
              }
            </p>
            <div class="row" style="margin-top: 14px; gap: 12px;">
              <span class="pill ${res.passed ? "success" : "danger"}">Puntaje Mínimo: 825</span>
              <span class="pill">Aciertos: ${res.correct} / ${res.total} (${Math.round((res.correct / res.total) * 100)}%)</span>
              <span class="pill">Tiempo empleado: ${App.fmtTime(res.timeSpent)}</span>
            </div>
          </div>
        </div>

        <!-- Domain Diagnostic Breakdown -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-title">
            <h3>${App.icon("layers")} Diagnóstico por Dominio Oficial</h3>
            <span class="small muted">Métricas por tema de este examen</span>
          </div>
          <div class="stack" style="gap: 16px;">
            ${App.DOMAINS.map((d) => {
              const b = res.domainBreakdown[d.id] || { total: 0, correct: 0 };
              const domPct = b.total ? Math.round((b.correct / b.total) * 100) : 0;
              const statusCls = domPct >= 80 ? "success" : domPct >= 65 ? "warning" : "danger";
              const statusTxt = domPct >= 80 ? "Sólido" : domPct >= 65 ? "Aceptable" : "Requiere Refuerzo";

              return `
                <div class="domain-row">
                  <div class="name">
                    <span class="dot" style="--c: ${d.color};"></span>
                    <span>${App.esc(d.name)}</span>
                    <span class="pill ${statusCls}">${statusTxt}</span>
                  </div>
                  <div class="pct" style="color: var(--${statusCls});">
                    ${b.correct} / ${b.total} (${domPct}%)
                  </div>
                  <div class="bar">
                    <span style="--c: ${d.color}; width: ${domPct}%;"></span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;

      App.animateRings(host);

      App.$("#btnReviewAll").addEventListener("click", () => {
        reviewMode = true;
        currentIndex = 0;
        renderExamUI();
      });
    }

    App.cleanup = () => {
      if (timerId) clearInterval(timerId);
    };

    // Initial render
    renderStartScreen();
  });
})();
