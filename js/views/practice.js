/* ==========================================================================
   CCNA Prep Hub - View: Practice
   Filtered domain practice, study vs test mode, instant explanations,
   drag-and-drop matching, keyboard navigation (1-4, A-D, Enter, Right).
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  App.view("practice", function (host, params) {
    let currentDomain = params[0] || "all";
    let filterStatus = "all"; // all | unseen | failed | flagged
    let hideMissingExhibits = true; // Hide questions where diagram is missing
    let studyMode = true; // true = instant explanation
    let currentIndex = 0;
    let questions = [];
    let selectedAnswers = new Set();
    let checked = false;
    let isCorrect = false;

    // Drag-drop state: mapping of left index to chosen right option
    let matchPicks = {};

    function updateQuestionList() {
      let pool = App.questions.slice();
      if (hideMissingExhibits) {
        pool = pool.filter(App.answerable);
      }
      if (currentDomain !== "all") {
        pool = pool.filter((q) => q.domain === currentDomain);
      }
      if (filterStatus === "unseen") {
        pool = pool.filter((q) => !App.state.attempts[q.id]);
      } else if (filterStatus === "failed") {
        pool = pool.filter((q) => {
          const a = App.state.attempts[q.id];
          return a && a.everWrong && a.box < 5;
        });
      } else if (filterStatus === "flagged") {
        pool = pool.filter((q) => {
          const a = App.state.attempts[q.id];
          return a && a.flagged;
        });
      }
      questions = pool;
      if (currentIndex >= questions.length) currentIndex = 0;
      resetQuestionState();
    }

    function resetQuestionState() {
      selectedAnswers = new Set();
      matchPicks = {};
      checked = false;
      isCorrect = false;
    }

    function render() {
      const q = questions[currentIndex];
      const total = questions.length;
      const attempt = q ? App.state.attempts[q.id] : null;
      const isFlagged = attempt && attempt.flagged;

      host.innerHTML = `
        <div class="page-head">
          <div>
            <div class="eyebrow">Modo Entrenamiento</div>
            <h1>Práctica por Dominio</h1>
            <p>Selecciona un tema específico del CCNA y refuerza conceptos con retroalimentación inmediata.</p>
          </div>
          <div class="row">
            <div class="segmented">
              <button class="${studyMode ? "active" : ""}" id="btnModeStudy">Modo Estudio (Explicación)</button>
              <button class="${!studyMode ? "active" : ""}" id="btnModeQuiz">Modo Test Rápido</button>
            </div>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="card" style="padding: 16px 20px; margin-bottom: 20px;">
          <div class="row-between">
            <div class="row" style="gap: 8px;">
              <span class="small muted" style="font-weight: 600;">Dominio:</span>
              <button class="chip ${currentDomain === "all" ? "active" : ""}" data-domain="all">
                <span class="dot" style="--c: var(--accent);"></span> Todos (${App.questions.length})
              </button>
              ${App.DOMAINS.map(
                (d) => `
                <button class="chip ${currentDomain === d.id ? "active" : ""}" data-domain="${d.id}" style="--c: ${d.color};">
                  <span class="dot"></span> ${App.esc(d.name)}
                </button>
              `
              ).join("")}
            </div>

            <div class="row" style="gap: 8px;">
              <button class="chip ${hideMissingExhibits ? "active" : ""}" id="btnToggleHideMissing" style="--c: var(--accent);" title="Ocultar preguntas del banco original que no traen topología">
                <span class="dot"></span> ${hideMissingExhibits ? "Ocultando sin diagrama" : "Mostrando todas"}
              </button>

              <span class="small muted" style="font-weight: 600;">Filtrar:</span>
              <select class="input mono" id="selFilter" style="width: auto; padding: 7px 12px; font-size: 0.84rem;">
                <option value="all" ${filterStatus === "all" ? "selected" : ""}>Todas las preguntas</option>
                <option value="unseen" ${filterStatus === "unseen" ? "selected" : ""}>Sin responder aún</option>
                <option value="failed" ${filterStatus === "failed" ? "selected" : ""}>Falladas anteriormente</option>
                <option value="flagged" ${filterStatus === "flagged" ? "selected" : ""}>Marcadas con bandera</option>
              </select>
            </div>
          </div>
        </div>

        ${
          !q
            ? `
          <div class="card empty">
            ${App.icon("search")}
            <h3>No hay preguntas con los filtros seleccionados</h3>
            <p class="small muted" style="margin-bottom: 14px;">Prueba seleccionando otro dominio o cambiando el filtro.</p>
            <button class="btn btn-primary btn-sm" id="btnResetFilters">Ver todas las preguntas</button>
          </div>
        `
            : `
          <div class="runner no-side">
            <div>
              <div class="runner-top">
                <div class="row">
                  <span class="pill" style="font-weight: 700; font-family: var(--mono);">Pregunta ${currentIndex + 1} de ${total}</span>
                  ${App.domainPill(q.domain)}
                  <span class="pill">${q.type === "drag-drop" ? "Drag & Drop" : App.isMulti(q) ? "Múltiple respuesta" : "Opción única"}</span>
                  <span class="pill" style="text-transform: capitalize;">Dificultad: ${App.esc(q.difficulty || "media")}</span>
                </div>
                <div class="row">
                  <button class="btn btn-sm ${isFlagged ? "is-on" : ""}" id="btnFlag" title="Marcar para repasar después">
                    ${App.icon("flag")} ${isFlagged ? "Marcada" : "Marcar"}
                  </button>
                </div>
              </div>

              <div class="card q-card">
                <div class="q-text">${App.esc(q.question)}</div>

                ${
                  q.needsExhibit && !q.image
                    ? `
                  <div class="exhibit-missing" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div>
                      ${App.icon("image", 'style="width: 16px; height: 16px; vertical-align: -2px;"')}
                      Esta pregunta hace referencia a una topología o salida de comando no incluida en el banco original.
                    </div>
                    <button class="btn btn-sm btn-ghost" id="btnSkipMissing" style="background: rgba(251, 191, 36, 0.15); color: var(--warning); border: 1px solid rgba(251, 191, 36, 0.3);">
                      Saltar a la siguiente &rarr;
                    </button>
                  </div>
                `
                    : ""
                }

                ${
                  q.image
                    ? `
                  <div class="exhibit" onclick="App.lightbox('${App.esc(q.image)}')">
                    <img src="${App.esc(q.image)}" alt="Exhibit" loading="lazy">
                    <span class="exhibit-tag">Clic para ampliar</span>
                  </div>
                `
                    : ""
                }

                ${
                  q.type === "drag-drop"
                    ? renderDragDrop(q)
                    : renderOptions(q)
                }

                ${
                  checked && studyMode
                    ? `
                  <div class="feedback ${isCorrect ? "ok" : "bad"}">
                    <h4>
                      ${isCorrect ? App.icon("check") : App.icon("x")}
                      ${isCorrect ? "¡Respuesta Correcta!" : "Respuesta Incorrecta"}
                    </h4>
                    <p>${App.richText(q.explanation || "No hay explicación adicional registrada para esta pregunta.")}</p>
                    ${!isCorrect && q.answer && q.answer.length ? `<div style="margin-top: 8px; font-weight: 700; color: var(--success);">Respuesta oficial: ${q.answer.join(", ")}</div>` : ""}
                  </div>
                `
                    : ""
                }

                <div class="q-actions">
                  <button class="btn" id="btnPrev" ${currentIndex === 0 ? "disabled" : ""}>
                    ${App.icon("arrowL")} Anterior
                  </button>

                  <div class="row">
                    ${
                      !checked
                        ? `<button class="btn btn-primary" id="btnCheck" ${!canCheck(q) ? "disabled" : ""}>Comprobar Respuesta</button>`
                        : `<button class="btn btn-primary" id="btnNext">Siguiente Pregunta ${App.icon("arrowR")}</button>`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
        }
      `;

      attachEvents();
    }

    function renderOptions(q) {
      if (q.type === "image-choice") {
        const letters = q.letters || Object.keys(q.options || {}) || ["A", "B", "C", "D"];
        const multi = App.isMulti(q);

        return `
          <div style="margin-top: 18px;">
            <div class="q-hint" style="margin-bottom: 8px;">
              ${multi ? `Selecciona tus respuestas (${q.answer.length} opciones):` : "Selecciona tu respuesta:"}
            </div>
            <div class="letter-grid">
              ${letters
                .map((k) => {
                  const isSelected = selectedAnswers.has(k);
                  let cls = "option";
                  if (isSelected) cls += " selected";
                  if (checked) {
                    const correct = (q.answer || []).includes(k);
                    if (correct) cls += " correct";
                    else if (isSelected) cls += " wrong";
                  }
                  return `
                    <button class="${cls}" data-key="${k}" ${checked ? "disabled" : ""}>
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

      const keys = Object.keys(q.options || {});
      const multi = App.isMulti(q);

      return `
        <div class="options">
          ${multi ? `<div class="q-hint">Selecciona todas las opciones que correspondan (${q.answer.length} opciones).</div>` : ""}
          ${keys
            .map((k) => {
              const text = q.options[k];
              const isSelected = selectedAnswers.has(k);
              let cls = "option";
              if (multi) cls += " multi";
              if (isSelected) cls += " selected";
              if (checked) {
                const correct = (q.answer || []).includes(k);
                if (correct) cls += " correct";
                else if (isSelected) cls += " wrong";
              }
              return `
                <button class="${cls}" data-key="${k}" ${checked ? "disabled" : ""}>
                  <span class="key">${k}</span>
                  <span class="txt">${App.esc(text)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function renderDragDrop(q) {
      const pairs = q.pairs || [];
      const rights = App.shuffle([...new Set(pairs.map((p) => p.right))]);

      return `
        <div class="match">
          <div class="q-hint" style="margin-bottom: 6px;">Empareja cada elemento de la izquierda con su correspondiente de la derecha:</div>
          ${pairs
            .map((p, idx) => {
              const currentPick = matchPicks[idx] || "";
              let rowCls = "match-row";
              if (checked) {
                rowCls += currentPick === p.right ? " correct" : " wrong";
              }
              return `
                <div class="${rowCls}">
                  <div><strong>${App.esc(p.left)}</strong></div>
                  <div>
                    <select class="input mono sel-match" data-idx="${idx}" ${checked ? "disabled" : ""}>
                      <option value="">-- Seleccionar --</option>
                      ${rights
                        .map(
                          (r) => `<option value="${App.esc(r)}" ${currentPick === r ? "selected" : ""}>${App.esc(r)}</option>`
                        )
                        .join("")}
                    </select>
                  </div>
                  ${checked && currentPick !== p.right ? `<div class="fix">Correcto: <b>${App.esc(p.right)}</b></div>` : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function canCheck(q) {
      if (q.type === "drag-drop") {
        const pairs = q.pairs || [];
        return pairs.length > 0 && Object.keys(matchPicks).length === pairs.length;
      }
      return selectedAnswers.size > 0;
    }

    function checkAnswer() {
      const q = questions[currentIndex];
      if (!q || checked) return;

      if (q.type === "drag-drop") {
        const pairs = q.pairs || [];
        isCorrect = pairs.every((p, idx) => matchPicks[idx] === p.right);
      } else {
        const target = new Set(q.answer || []);
        isCorrect =
          selectedAnswers.size === target.size &&
          [...selectedAnswers].every((x) => target.has(x));
      }

      checked = true;
      App.record(q.id, isCorrect);
      render();
    }

    function nextQuestion() {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        resetQuestionState();
        render();
      } else {
        App.toast("¡Has completado todas las preguntas de esta sección!");
      }
    }

    function prevQuestion() {
      if (currentIndex > 0) {
        currentIndex--;
        resetQuestionState();
        render();
      }
    }

    function toggleFlag() {
      const q = questions[currentIndex];
      if (!q) return;
      const att = App.state.attempts[q.id] || { seen: 0, correct: 0, box: 0, due: 0, last: 0, lastOk: null, everWrong: false };
      att.flagged = !att.flagged;
      App.state.attempts[q.id] = att;
      App.save();
      render();
    }

    function attachEvents() {
      // Domain chips
      App.$$(".chip[data-domain]", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          currentDomain = btn.dataset.domain;
          currentIndex = 0;
          updateQuestionList();
          render();
        });
      });

      // Toggle hide missing exhibits
      const btnToggleHideMissing = App.$("#btnToggleHideMissing", host);
      if (btnToggleHideMissing) {
        btnToggleHideMissing.addEventListener("click", () => {
          hideMissingExhibits = !hideMissingExhibits;
          currentIndex = 0;
          updateQuestionList();
          render();
        });
      }

      // Skip missing exhibit question button
      const btnSkipMissing = App.$("#btnSkipMissing", host);
      if (btnSkipMissing) {
        btnSkipMissing.addEventListener("click", nextQuestion);
      }

      // Filter select
      const selFilter = App.$("#selFilter", host);
      if (selFilter) {
        selFilter.addEventListener("change", (e) => {
          filterStatus = e.target.value;
          currentIndex = 0;
          updateQuestionList();
          render();
        });
      }

      // Mode toggle
      const btnModeStudy = App.$("#btnModeStudy", host);
      const btnModeQuiz = App.$("#btnModeQuiz", host);
      if (btnModeStudy && btnModeQuiz) {
        btnModeStudy.addEventListener("click", () => {
          studyMode = true;
          render();
        });
        btnModeQuiz.addEventListener("click", () => {
          studyMode = false;
          render();
        });
      }

      // Reset filters button
      const btnReset = App.$("#btnResetFilters", host);
      if (btnReset) {
        btnReset.addEventListener("click", () => {
          currentDomain = "all";
          filterStatus = "all";
          currentIndex = 0;
          updateQuestionList();
          render();
        });
      }

      // Option clicks
      App.$$(".option[data-key]", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          const q = questions[currentIndex];
          if (!q || checked) return;

          if (App.isMulti(q)) {
            if (selectedAnswers.has(key)) selectedAnswers.delete(key);
            else selectedAnswers.add(key);
          } else {
            selectedAnswers = new Set([key]);
          }
          render();
        });
      });

      // Drag drop selects
      App.$$(".sel-match", host).forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const idx = parseInt(e.target.dataset.idx, 10);
          matchPicks[idx] = e.target.value;
          const btnCheck = App.$("#btnCheck", host);
          if (btnCheck) {
            const q = questions[currentIndex];
            btnCheck.disabled = !canCheck(q);
          }
        });
      });

      // Check / Next / Prev / Flag
      const btnCheck = App.$("#btnCheck", host);
      if (btnCheck) btnCheck.addEventListener("click", checkAnswer);

      const btnNext = App.$("#btnNext", host);
      if (btnNext) btnNext.addEventListener("click", nextQuestion);

      const btnPrev = App.$("#btnPrev", host);
      if (btnPrev) btnPrev.addEventListener("click", prevQuestion);

      const btnFlag = App.$("#btnFlag", host);
      if (btnFlag) btnFlag.addEventListener("click", toggleFlag);
    }

    // Keyboard shortcuts
    function onKeyDown(e) {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      const key = e.key.toUpperCase();
      const q = questions[currentIndex];
      if (!q) return;

      if (!checked && ["A", "B", "C", "D", "E", "F"].includes(key) && q.options && q.options[key]) {
        if (App.isMulti(q)) {
          if (selectedAnswers.has(key)) selectedAnswers.delete(key);
          else selectedAnswers.add(key);
        } else {
          selectedAnswers = new Set([key]);
        }
        render();
      } else if (e.key === "Enter") {
        if (!checked && canCheck(q)) checkAnswer();
        else if (checked) nextQuestion();
      } else if (e.key === "ArrowRight") {
        if (checked) nextQuestion();
      } else if (e.key === "ArrowLeft") {
        prevQuestion();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    App.cleanup = () => document.removeEventListener("keydown", onKeyDown);

    // Initial setup
    updateQuestionList();
    render();
  });
})();
