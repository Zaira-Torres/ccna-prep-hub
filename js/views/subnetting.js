/* ==========================================================================
   CCNA Prep Hub - View: Subnetting Dojo (Speed Drill)
   Infinite IPv4 / CIDR practice generator, step-by-step block size explanation,
   speed challenge, and integrated CIDR cheat sheet.
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  App.view("subnet", function (host) {
    let currentProblem = null;
    let checked = false;
    let results = {};
    let cheatSheetOpen = false;

    function ipToInt(ip) {
      return ip
        .split(".")
        .reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0);
    }

    function intToIp(int) {
      return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255,
      ].join(".");
    }

    function generateProblem() {
      // Pick common CCNA prefixes: /16 to /30 (or occasional /8 to /15)
      const prefixes = [
        24, 25, 26, 27, 28, 29, 30,
        16, 17, 18, 19, 20, 21, 22, 23,
        12, 13, 14, 15
      ];
      const cidr = prefixes[Math.floor(Math.random() * prefixes.length)];

      // Random IPv4
      const oct1 = [10, 172, 192, 11, 100, 172][Math.floor(Math.random() * 6)];
      const oct2 = oct1 === 172 ? 16 + Math.floor(Math.random() * 16) : Math.floor(Math.random() * 256);
      const oct3 = Math.floor(Math.random() * 256);
      const oct4 = 1 + Math.floor(Math.random() * 254);
      const ip = `${oct1}.${oct2}.${oct3}.${oct4}`;

      const ipNum = ipToInt(ip);
      const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
      const wildcardNum = (~maskNum) >>> 0;
      const netNum = (ipNum & maskNum) >>> 0;
      const bcastNum = (netNum | wildcardNum) >>> 0;
      const firstNum = cidr >= 31 ? netNum : netNum + 1;
      const lastNum = cidr >= 31 ? bcastNum : bcastNum - 1;
      const totalHosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : Math.pow(2, 32 - cidr) - 2;

      // Octet of interest & magic number
      const interestingOctet = Math.floor((cidr - 1) / 8) + 1;
      const bitsInOctet = cidr % 8 === 0 ? 8 : cidr % 8;
      const magicNumber = Math.pow(2, 8 - bitsInOctet);

      currentProblem = {
        ip,
        cidr,
        mask: intToIp(maskNum),
        wildcard: intToIp(wildcardNum),
        network: intToIp(netNum),
        broadcast: intToIp(bcastNum),
        first: intToIp(firstNum),
        last: intToIp(lastNum),
        hosts: totalHosts,
        interestingOctet,
        magicNumber,
      };

      checked = false;
      results = {};
    }

    function checkAnswers() {
      const p = currentProblem;
      const netInput = (App.$("#inputNet").value || "").trim();
      const bcastInput = (App.$("#inputBcast").value || "").trim();
      const firstInput = (App.$("#inputFirst").value || "").trim();
      const lastInput = (App.$("#inputLast").value || "").trim();
      const maskInput = (App.$("#inputMask").value || "").trim();
      const wildInput = (App.$("#inputWild").value || "").trim();

      results = {
        network: netInput === p.network,
        broadcast: bcastInput === p.broadcast,
        first: firstInput === p.first,
        last: lastInput === p.last,
        mask: maskInput === p.mask,
        wildcard: wildInput === p.wildcard,
      };

      const allOk = Object.values(results).every(Boolean);

      // Record in state
      const s = App.state.subnet;
      s.attempts++;
      if (allOk) {
        s.correct++;
        s.streak = (s.streak || 0) + 1;
        if (s.streak > (s.best || 0)) s.best = s.streak;
      } else {
        s.streak = 0;
      }
      App.save();

      checked = true;
      render();
    }

    function render() {
      const p = currentProblem;
      const sub = App.state.subnet;

      host.innerHTML = `
        <div class="page-head">
          <div>
            <div class="eyebrow">Gimnasio de Redes</div>
            <h1>Subnetting Dojo &bull; Speed Drill</h1>
            <p>El cálculo mental rápido de subredes es vital para no perder tiempo en el examen CCNA.</p>
          </div>
          <div class="row">
            <button class="btn btn-sm ${cheatSheetOpen ? "is-on" : ""}" id="btnToggleCheat">
              ${App.icon("layers")} ${cheatSheetOpen ? "Ocultar Tabla CIDR" : "Ver Tabla CIDR / Powers of 2"}
            </button>
            <button class="btn btn-primary btn-sm" id="btnNewProblem">
              ${App.icon("bolt")} Generar Otra IP
            </button>
          </div>
        </div>

        <!-- Subnetting Stats -->
        <div class="grid grid-3" style="margin-bottom: 22px;">
          <div class="card stat" style="padding: 16px 20px;">
            <span class="stat-label">Racha actual</span>
            <span class="stat-value" style="color: var(--accent);">${sub.streak || 0} <small style="font-size: 1rem; color: var(--text-2);">consecutivas</small></span>
          </div>
          <div class="card stat" style="padding: 16px 20px;">
            <span class="stat-label">Mejor racha</span>
            <span class="stat-value" style="color: var(--success);">${sub.best || 0}</span>
          </div>
          <div class="card stat" style="padding: 16px 20px;">
            <span class="stat-label">Efectividad global</span>
            <span class="stat-value">${sub.attempts ? Math.round((sub.correct / sub.attempts) * 100) : 0}%</span>
            <span class="stat-sub">${sub.correct || 0} de ${sub.attempts || 0} ejercicios</span>
          </div>
        </div>

        ${
          cheatSheetOpen
            ? `
          <div class="card" style="margin-bottom: 22px; animation: viewIn 0.3s ease;">
            <div class="card-title">
              <h3>${App.icon("layers")} Tabla de Referencia Rápida (CIDR & Magic Number)</h3>
            </div>
            <div style="overflow-x: auto;">
              <table class="table">
                <thead>
                  <tr>
                    <th>CIDR</th>
                    <th>Máscara Decimal</th>
                    <th>Wildcard Mask</th>
                    <th>Magic Number (Paso)</th>
                    <th>Hosts Útiles (2^H - 2)</th>
                  </tr>
                </thead>
                <tbody>
                  ${[
                    { c: "/24", m: "255.255.255.0", w: "0.0.0.255", s: "1", h: "254" },
                    { c: "/25", m: "255.255.255.128", w: "0.0.0.127", s: "128", h: "126" },
                    { c: "/26", m: "255.255.255.192", w: "0.0.0.63", s: "64", h: "62" },
                    { c: "/27", m: "255.255.255.224", w: "0.0.0.31", s: "32", h: "30" },
                    { c: "/28", m: "255.255.255.240", w: "0.0.0.15", s: "16", h: "14" },
                    { c: "/29", m: "255.255.255.248", w: "0.0.0.7", s: "8", h: "6" },
                    { c: "/30", m: "255.255.255.252", w: "0.0.0.3", s: "4", h: "2 (Enlaces WAN)" },
                  ]
                    .map(
                      (row) => `
                    <tr>
                      <td class="mono" style="font-weight: 700; color: var(--accent);">${row.c}</td>
                      <td class="mono">${row.m}</td>
                      <td class="mono">${row.w}</td>
                      <td class="mono" style="color: var(--success); font-weight: 700;">${row.s}</td>
                      <td class="mono">${row.h}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ""
        }

        <!-- Drill Card -->
        <div class="card" style="padding: 30px; margin-bottom: 22px;">
          <div style="text-align: center; margin-bottom: 26px;">
            <div class="eyebrow">Calcula los parámetros para:</div>
            <div class="subnet-prompt">${p.ip} /${p.cidr}</div>
            <div class="small muted" style="margin-top: 6px;">
              Octeto crítico: <b>${p.interestingOctet}° octeto</b> &bull; Bloque / Magic Number: <b>${p.magicNumber}</b>
            </div>
          </div>

          <div class="subnet-fields">
            <div class="field">
              <label>Network Address (ID de Red)</label>
              <input type="text" class="input mono ${checked ? (results.network ? "ok" : "bad") : ""}" id="inputNet" placeholder="ej. 192.168.1.0" ${checked ? "disabled" : ""}>
              ${checked ? `<div class="answer-key">Respuesta: ${p.network}</div>` : ""}
            </div>

            <div class="field">
              <label>Broadcast Address</label>
              <input type="text" class="input mono ${checked ? (results.broadcast ? "ok" : "bad") : ""}" id="inputBcast" placeholder="ej. 192.168.1.255" ${checked ? "disabled" : ""}>
              ${checked ? `<div class="answer-key">Respuesta: ${p.broadcast}</div>` : ""}
            </div>

            <div class="field">
              <label>Primer Host Útil (First Usable)</label>
              <input type="text" class="input mono ${checked ? (results.first ? "ok" : "bad") : ""}" id="inputFirst" placeholder="ej. 192.168.1.1" ${checked ? "disabled" : ""}>
              ${checked ? `<div class="answer-key">Respuesta: ${p.first}</div>` : ""}
            </div>

            <div class="field">
              <label>Último Host Útil (Last Usable)</label>
              <input type="text" class="input mono ${checked ? (results.last ? "ok" : "bad") : ""}" id="inputLast" placeholder="ej. 192.168.1.254" ${checked ? "disabled" : ""}>
              ${checked ? `<div class="answer-key">Respuesta: ${p.last}</div>` : ""}
            </div>

            <div class="field">
              <label>Máscara de Subred (Subnet Mask)</label>
              <input type="text" class="input mono ${checked ? (results.mask ? "ok" : "bad") : ""}" id="inputMask" placeholder="ej. 255.255.255.0" ${checked ? "disabled" : ""}>
              ${checked ? `<div class="answer-key">Respuesta: ${p.mask}</div>` : ""}
            </div>

            <div class="field">
              <label>Máscara Wildcard</label>
              <input type="text" class="input mono ${checked ? (results.wildcard ? "ok" : "bad") : ""}" id="inputWild" placeholder="ej. 0.0.0.255" ${checked ? "disabled" : ""}>
              ${checked ? `<div class="answer-key">Respuesta: ${p.wildcard}</div>` : ""}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
            ${
              !checked
                ? `<button class="btn btn-primary btn-lg" id="btnCheckSubnet">Comprobar Respuestas</button>`
                : `<button class="btn btn-primary btn-lg" id="btnNextSubnet">Siguiente Ejercicio ${App.icon("arrowR")}</button>`
            }
          </div>

          ${
            checked
              ? `
            <div class="feedback ok" style="margin-top: 24px;">
              <h4>${App.icon("bolt")} Explicación Rápida &bull; Método Magic Number</h4>
              <p>
                1. La máscara <b>/${p.cidr}</b> modifica el <b>${p.interestingOctet}° octeto</b>.<br>
                2. Paso del bloque (Magic Number): <b>256 - valor_octeto = ${p.magicNumber}</b>.<br>
                3. Las subredes van en múltiplos de <b>${p.magicNumber}</b> (0, ${p.magicNumber}, ${p.magicNumber * 2}, ${p.magicNumber * 3}...).<br>
                4. La red que contiene a esta IP es <b>${p.network}</b> y su broadcast es <b>${p.broadcast}</b>.<br>
                5. Total de hosts útiles disponibles: <b>${p.hosts.toLocaleString()} hosts</b>.
              </p>
            </div>
          `
              : ""
          }
        </div>
      `;

      attachSubnetEvents();
    }

    function attachSubnetEvents() {
      const btnNew = App.$("#btnNewProblem", host);
      if (btnNew) {
        btnNew.addEventListener("click", () => {
          generateProblem();
          render();
        });
      }

      const btnToggle = App.$("#btnToggleCheat", host);
      if (btnToggle) {
        btnToggle.addEventListener("click", () => {
          cheatSheetOpen = !cheatSheetOpen;
          render();
        });
      }

      const btnCheck = App.$("#btnCheckSubnet", host);
      if (btnCheck) btnCheck.addEventListener("click", checkAnswers);

      const btnNext = App.$("#btnNextSubnet", host);
      if (btnNext) {
        btnNext.addEventListener("click", () => {
          generateProblem();
          render();
        });
      }

      // Enter key submits or moves next
      host.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            if (!checked) checkAnswers();
            else {
              generateProblem();
              render();
            }
          }
        });
      });
    }

    // Initial problem
    generateProblem();
    render();
  });
})();
