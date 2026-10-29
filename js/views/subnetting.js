/* ==========================================================================
   CCNA Prep Hub - View: Subnetting Dojo & IPv6 Mastery
   Tabs:
   1. IPv4 Dojo (Infinite CIDR drill, Magic Number method, CIDR Cheat Sheet)
   2. IPv6 Subnetting (Prefix math, /48 to /64 subnet calculation, compression rules)
   3. Laboratorio EUI-64 (Interactive MAC -> EUI-64 converter + 7th bit flip drill)
   4. Tipos de IPv6 (Study cards for GUA, ULA, LLA, Multicast + Speed recognition quiz)
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  App.view("subnet", function (host) {
    let activeTab = "ipv4"; // "ipv4" | "ipv6" | "eui64" | "types"

    /* ==========================================================================
       TAB 1: IPv4 Subnetting State & Logic
       ========================================================================== */
    let currentV4Problem = null;
    let v4Checked = false;
    let v4Results = {};
    let v4CheatOpen = false;

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

    function generateV4Problem() {
      const prefixes = [
        24, 25, 26, 27, 28, 29, 30,
        16, 17, 18, 19, 20, 21, 22, 23,
        12, 13, 14, 15
      ];
      const cidr = prefixes[Math.floor(Math.random() * prefixes.length)];

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

      const interestingOctet = Math.floor((cidr - 1) / 8) + 1;
      const bitsInOctet = cidr % 8 === 0 ? 8 : cidr % 8;
      const magicNumber = Math.pow(2, 8 - bitsInOctet);

      currentV4Problem = {
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

      v4Checked = false;
      v4Results = {};
    }

    function checkV4Answers() {
      const p = currentV4Problem;
      const netInput = (App.$("#inputNet", host)?.value || "").trim();
      const bcastInput = (App.$("#inputBcast", host)?.value || "").trim();
      const firstInput = (App.$("#inputFirst", host)?.value || "").trim();
      const lastInput = (App.$("#inputLast", host)?.value || "").trim();
      const maskInput = (App.$("#inputMask", host)?.value || "").trim();
      const wildInput = (App.$("#inputWild", host)?.value || "").trim();

      v4Results = {
        network: netInput === p.network,
        broadcast: bcastInput === p.broadcast,
        first: firstInput === p.first,
        last: lastInput === p.last,
        mask: maskInput === p.mask,
        wildcard: wildInput === p.wildcard,
      };

      const allOk = Object.values(v4Results).every(Boolean);

      const s = App.state.subnet;
      s.attempts = (s.attempts || 0) + 1;
      if (allOk) {
        s.correct = (s.correct || 0) + 1;
        s.streak = (s.streak || 0) + 1;
        if (s.streak > (s.best || 0)) s.best = s.streak;
      } else {
        s.streak = 0;
      }
      App.save();

      v4Checked = true;
      render();
    }

    /* ==========================================================================
       TAB 2: IPv6 Subnetting & Prefix Math
       ========================================================================== */
    let currentV6Problem = null;
    let v6Checked = false;
    let v6Results = {};

    function generateV6Problem() {
      const globalPrefixes = [
        "2001:db8:acad",
        "2001:db8:cafe",
        "2001:db8:1234",
        "2001:db8:aaaa",
        "2001:db8:9876",
        "2001:db8:c001"
      ];
      const gPrefix = globalPrefixes[Math.floor(Math.random() * globalPrefixes.length)];
      const prefixLen = [48, 56][Math.floor(Math.random() * 2)];
      const subnetNum = [1, 2, 5, 10, 15, 16, 25, 255, 4096][Math.floor(Math.random() * 9)];
      const subnetHex = subnetNum.toString(16);

      const subnetBits = 64 - prefixLen;
      const totalSubnets = Math.pow(2, subnetBits);

      // In a /48, subnet ID occupies hextet 4
      // In a /56, prefix occupies 2 hextets + 8 bits of 4th hextet
      let fullSubnetPrefix = "";
      if (prefixLen === 48) {
        fullSubnetPrefix = `${gPrefix}:${subnetHex}::/64`;
      } else {
        // /56: gPrefix is 3 hextets + 2 hex digits in 4th hextet
        fullSubnetPrefix = `${gPrefix}:00${subnetHex}::/64`;
      }

      currentV6Problem = {
        gPrefix,
        prefixLen,
        targetLen: 64,
        subnetNum,
        subnetHex,
        subnetBits,
        totalSubnets,
        expectedSubnet: fullSubnetPrefix.toLowerCase(),
      };

      v6Checked = false;
      v6Results = {};
    }

    function checkV6Answers() {
      const p = currentV6Problem;
      const userSubnet = (App.$("#inputV6Subnet", host)?.value || "").trim().toLowerCase();
      const userBits = parseInt((App.$("#inputV6Bits", host)?.value || "").trim(), 10);
      const userTotal = parseInt((App.$("#inputV6Total", host)?.value || "").trim().replace(/,/g, ""), 10);

      // Normalization: allow with or without /64
      let cleanUserSubnet = userSubnet;
      if (!cleanUserSubnet.endsWith("/64") && cleanUserSubnet.length > 0) {
        cleanUserSubnet += "/64";
      }

      v6Results = {
        subnet: cleanUserSubnet === p.expectedSubnet,
        bits: userBits === p.subnetBits,
        total: userTotal === p.totalSubnets,
      };

      v6Checked = true;
      render();
    }

    /* ==========================================================================
       TAB 3: EUI-64 Laboratory & Drill
       ========================================================================== */
    let euiInputMac = "00:60:2F:3A:07:BC";
    let euiDrillProblem = null;
    let euiDrillAnswered = false;
    let euiDrillResult = null;
    let euiScore = { correct: 0, total: 0 };

    function cleanMac(mac) {
      return (mac || "").replace(/[^0-9a-fA-F]/g, "").toLowerCase();
    }

    function computeEui64(rawMac) {
      const clean = cleanMac(rawMac);
      if (clean.length !== 12) return null;

      const byte1Int = parseInt(clean.substring(0, 2), 16);
      const byte1Flipped = byte1Int ^ 0x02;
      const byte1Hex = byte1Flipped.toString(16).padStart(2, "0");
      const byte1Bin = byte1Int.toString(2).padStart(8, "0");
      const byte1FlippedBin = byte1Flipped.toString(2).padStart(8, "0");

      const left = clean.substring(0, 6);
      const right = clean.substring(6, 12);
      const full64 = byte1Hex + clean.substring(2, 6) + "fffe" + right;

      const hextets = [
        full64.substring(0, 4),
        full64.substring(4, 8),
        full64.substring(8, 12),
        full64.substring(12, 16),
      ];

      const iid = hextets.join(":");
      const iidCompressed = hextets.map((h) => h.replace(/^0+(?!$)/, "")).join(":");

      return {
        raw: rawMac,
        clean,
        byte1Int,
        byte1Hex: clean.substring(0, 2),
        byte1Bin,
        byte1Flipped,
        byte1FlippedHex: byte1Hex,
        byte1FlippedBin,
        left,
        right,
        full64,
        hextets,
        iid,
        iidCompressed,
        linkLocal: `fe80::${iidCompressed}`,
        globalExample: `2001:db8:acad:1::${iidCompressed}`,
      };
    }

    function generateEuiDrill() {
      const hex = "0123456789abcdef";
      let randomMac = "";
      for (let i = 0; i < 12; i++) {
        randomMac += hex[Math.floor(Math.random() * 16)];
      }
      const formatted = `${randomMac.substring(0, 4)}.${randomMac.substring(4, 8)}.${randomMac.substring(8, 12)}`;
      const calc = computeEui64(randomMac);

      euiDrillProblem = {
        mac: formatted,
        calc,
      };
      euiDrillAnswered = false;
      euiDrillResult = null;
    }

    function checkEuiDrill() {
      if (!euiDrillProblem) return;
      const userB1 = (App.$("#inputEuiB1", host)?.value || "").trim().toLowerCase();
      const userIid = (App.$("#inputEuiIid", host)?.value || "").trim().toLowerCase().replace(/\s+/g, "");

      const calc = euiDrillProblem.calc;
      const b1Ok = userB1 === calc.byte1FlippedHex;

      // Allow either raw iid, compressed, or full link-local
      const cleanInput = userIid.replace(/^fe80::/, "");
      const iidOk =
        cleanInput === calc.iid ||
        cleanInput === calc.iidCompressed ||
        userIid === calc.linkLocal;

      euiDrillResult = {
        b1Ok,
        iidOk,
        allOk: b1Ok && iidOk,
      };

      euiDrillAnswered = true;
      euiScore.total++;
      if (euiDrillResult.allOk) euiScore.correct++;
      render();
    }

    /* ==========================================================================
       TAB 4: IPv6 Types & Speed Quiz
       ========================================================================== */
    const IPV6_TYPES = [
      {
        id: "gua",
        name: "Global Unicast (GUA)",
        prefix: "2000::/3",
        range: "2000:: a 3FFF:FFFF:...",
        color: "var(--accent)",
        scope: "Global (Internet)",
        desc: "Direcciones públicas enrutables globalmente en Internet. Equivalentes a las IPs públicas en IPv4.",
        rules: "Asignadas por IANA a RIRs, y por ISPs a clientes. Formato típico: Prefijo Global (48 bits) + Subnet ID (16 bits) + Interface ID (64 bits).",
      },
      {
        id: "ula",
        name: "Unique Local (ULA)",
        prefix: "FC00::/7 (habitual FD00::/8)",
        range: "FC00:: a FDFF:FFFF:...",
        color: "var(--warning)",
        scope: "Local de Organización (Site-Local)",
        desc: "Direcciones privadas no enrutables en Internet. Equivalente exacto a RFC 1918 (10.0.0.0, 172.16.0.0, 192.168.0.0) de IPv4.",
        rules: "El 8° bit siempre se fija en 1 (L=1), por lo que en la práctica siempre inician con FD (ej. fd12:3456:789a::/48).",
      },
      {
        id: "lla",
        name: "Link-Local (LLA)",
        prefix: "FE80::/10",
        range: "FE80:: a FEBF:FFFF:...",
        color: "var(--d-access)",
        scope: "Enlace Local (Link-Local, 1 salto)",
        desc: "Obligatoria en toda interfaz IPv6 activa. No es enrutable y los routers nunca reenvían paquetes LLA a otros enlaces.",
        rules: "Utilizada como Next-Hop en tablas de enrutamiento y para establecer adyacencias OSPFv3/EIGRPv6. Se autoconfigura con EUI-64 o aleatorio.",
      },
      {
        id: "multicast",
        name: "Multicast",
        prefix: "FF00::/8",
        range: "FF00:: a FFFF:FFFF:...",
        color: "var(--d-services)",
        scope: "Uno a varios (Reemplaza al Broadcast)",
        desc: "IPv6 NO tiene broadcast; usa Multicast para enviar tráfico a grupos de dispositivos específicos.",
        rules: "Direcciones críticas en CCNA: FF02::1 (All Nodes), FF02::2 (All Routers), FF02::5 (OSPFv3 All), FF02::6 (OSPFv3 DR/BDR), FF02::A (EIGRPv6).",
      },
      {
        id: "loopback",
        name: "Loopback & Especiales",
        prefix: "::1/128 y ::/128",
        range: "::1 (Loopback) | :: (Unspecified)",
        color: "var(--success)",
        scope: "Host Local",
        desc: "::1/128 prueba la pila TCP/IP interna del host (equivale a 127.0.0.1). ::/128 es la dirección no especificada (usada antes de obtener IP).",
        rules: "No se asignan a interfaces físicas de red.",
      },
    ];

    const IPV6_QUIZ_POOL = [
      { ip: "2001:0db8:acad:0001::1", type: "gua", reason: "Inicia con 2001, perteneciente al rango Global Unicast 2000::/3." },
      { ip: "2607:f8b0:4005:805::200e", type: "gua", reason: "Inicia con 2607 (dentro de 2000::/3), es una dirección pública enrutable." },
      { ip: "fd12:3456:789a:0001::10", type: "ula", reason: "Inicia con FD, el rango estándar de Unique Local (FC00::/7 con bit L=1)." },
      { ip: "fc00:abcd:1234::5", type: "ula", reason: "Inicia con FC, dentro del bloque Unique Local FC00::/7." },
      { ip: "fe80::260:2fff:fe3a:7bc", type: "lla", reason: "Inicia con FE80::, correspondiente al prefijo Link-Local FE80::/10." },
      { ip: "fe80::1", type: "lla", reason: "Dirección Link-Local estática habitual para puertas de enlace (default gateway)." },
      { ip: "ff02::1", type: "multicast", reason: "Multicast All-Nodes: alcanza a todos los dispositivos IPv6 en el enlace." },
      { ip: "ff02::2", type: "multicast", reason: "Multicast All-Routers: alcanza a todos los routers IPv6 en el enlace." },
      { ip: "ff02::5", type: "multicast", reason: "Multicast reservada para routers OSPFv3 en IPv6." },
      { ip: "ff02::6", type: "multicast", reason: "Multicast reservada para OSPFv3 DR y BDR." },
      { ip: "ff02::a", type: "multicast", reason: "Multicast reservada para EIGRPv6." },
      { ip: "ff02::1:ff34:5678", type: "multicast", reason: "Solicited-Node Multicast, usada por NDP y DAD para resolución de direcciones." },
      { ip: "::1", type: "loopback", reason: "Loopback address (127 bits de ceros y 1 al final), prueba el stack TCP/IP." },
      { ip: "::", type: "loopback", reason: "Dirección no especificada (Unspecified Address ::/128)." },
    ];

    let currentTypeQuiz = null;
    let quizSelectedAnswer = null;
    let quizStreak = 0;
    let quizTotal = 0;

    function pickNextTypeQuiz() {
      const item = IPV6_QUIZ_POOL[Math.floor(Math.random() * IPV6_QUIZ_POOL.length)];
      currentTypeQuiz = item;
      quizSelectedAnswer = null;
    }

    /* ==========================================================================
       MAIN RENDER ROUTER
       ========================================================================== */
    function render() {
      host.innerHTML = `
        <div class="page-head">
          <div>
            <div class="eyebrow">Gimnasio de Redes &bull; IPv4 / IPv6 / EUI-64</div>
            <h1>Subnetting Dojo</h1>
            <p>Entrenamiento de velocidad en cálculo de subredes, conversión EUI-64 y tipos de direcciones para el CCNA 200-301.</p>
          </div>
          <div class="row">
            <div class="segmented" id="tabsSubnet">
              <button class="${activeTab === "ipv4" ? "active" : ""}" data-tab="ipv4">IPv4 Subnetting</button>
              <button class="${activeTab === "ipv6" ? "active" : ""}" data-tab="ipv6">IPv6 Subnetting</button>
              <button class="${activeTab === "eui64" ? "active" : ""}" data-tab="eui64">Laboratorio EUI-64</button>
              <button class="${activeTab === "types" ? "active" : ""}" data-tab="types">Tipos de IPv6</button>
            </div>
          </div>
        </div>

        ${activeTab === "ipv4" ? renderIpv4Tab() : ""}
        ${activeTab === "ipv6" ? renderIpv6Tab() : ""}
        ${activeTab === "eui64" ? renderEui64Tab() : ""}
        ${activeTab === "types" ? renderTypesTab() : ""}
      `;

      attachAllEvents();
    }

    /* ==========================================================================
       TAB RENDERING FUNCTIONS
       ========================================================================== */
    function renderIpv4Tab() {
      const p = currentV4Problem;
      const sub = App.state.subnet;

      return `
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

        <div class="row" style="margin-bottom: 18px; justify-content: flex-end; gap: 8px;">
          <button class="btn btn-sm ${v4CheatOpen ? "is-on" : ""}" id="btnToggleCheat">
            ${App.icon("layers")} ${v4CheatOpen ? "Ocultar Tabla CIDR" : "Ver Tabla CIDR / Powers of 2"}
          </button>
          <button class="btn btn-primary btn-sm" id="btnNewV4Problem">
            ${App.icon("bolt")} Generar Otra IP
          </button>
        </div>

        ${
          v4CheatOpen
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
              <input type="text" class="input mono ${v4Checked ? (v4Results.network ? "ok" : "bad") : ""}" id="inputNet" placeholder="ej. 192.168.1.0" ${v4Checked ? "disabled" : ""}>
              ${v4Checked ? `<div class="answer-key">Respuesta: ${p.network}</div>` : ""}
            </div>

            <div class="field">
              <label>Broadcast Address</label>
              <input type="text" class="input mono ${v4Checked ? (v4Results.broadcast ? "ok" : "bad") : ""}" id="inputBcast" placeholder="ej. 192.168.1.255" ${v4Checked ? "disabled" : ""}>
              ${v4Checked ? `<div class="answer-key">Respuesta: ${p.broadcast}</div>` : ""}
            </div>

            <div class="field">
              <label>Primer Host Útil (First Usable)</label>
              <input type="text" class="input mono ${v4Checked ? (v4Results.first ? "ok" : "bad") : ""}" id="inputFirst" placeholder="ej. 192.168.1.1" ${v4Checked ? "disabled" : ""}>
              ${v4Checked ? `<div class="answer-key">Respuesta: ${p.first}</div>` : ""}
            </div>

            <div class="field">
              <label>Último Host Útil (Last Usable)</label>
              <input type="text" class="input mono ${v4Checked ? (v4Results.last ? "ok" : "bad") : ""}" id="inputLast" placeholder="ej. 192.168.1.254" ${v4Checked ? "disabled" : ""}>
              ${v4Checked ? `<div class="answer-key">Respuesta: ${p.last}</div>` : ""}
            </div>

            <div class="field">
              <label>Máscara de Subred (Subnet Mask)</label>
              <input type="text" class="input mono ${v4Checked ? (v4Results.mask ? "ok" : "bad") : ""}" id="inputMask" placeholder="ej. 255.255.255.0" ${v4Checked ? "disabled" : ""}>
              ${v4Checked ? `<div class="answer-key">Respuesta: ${p.mask}</div>` : ""}
            </div>

            <div class="field">
              <label>Máscara Wildcard</label>
              <input type="text" class="input mono ${v4Checked ? (v4Results.wildcard ? "ok" : "bad") : ""}" id="inputWild" placeholder="ej. 0.0.0.255" ${v4Checked ? "disabled" : ""}>
              ${v4Checked ? `<div class="answer-key">Respuesta: ${p.wildcard}</div>` : ""}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
            ${
              !v4Checked
                ? `<button class="btn btn-primary btn-lg" id="btnCheckV4">Comprobar Respuestas</button>`
                : `<button class="btn btn-primary btn-lg" id="btnNextV4">Siguiente Ejercicio ${App.icon("arrowR")}</button>`
            }
          </div>

          ${
            v4Checked
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
    }

    function renderIpv6Tab() {
      const p = currentV6Problem;

      return `
        <div class="grid grid-2" style="margin-bottom: 22px;">
          <div class="card" style="padding: 24px;">
            <div class="card-title">
              <h3>${App.icon("layers")} Anatomía del Subneteo IPv6</h3>
            </div>
            <p class="small muted" style="margin-bottom: 16px;">
              En el estándar del CCNA, un proveedor asigna un <b>Prefijo Global /48</b>. La empresa subnetea a <b>/64</b> para cada red LAN local (dejando 64 bits exactos para SLAAC o EUI-64).
            </p>
            <div style="display: flex; gap: 4px; font-family: var(--mono); font-size: 0.85rem; text-align: center; margin-bottom: 14px;">
              <div style="flex: 3; background: rgba(34, 211, 238, 0.15); border: 1px solid var(--accent); padding: 8px; border-radius: 6px;">
                <div style="font-weight: 800; color: var(--accent);">48 bits</div>
                <div style="font-size: 0.72rem; color: var(--text-1);">Global Routing Prefix</div>
              </div>
              <div style="flex: 1; background: rgba(251, 191, 36, 0.15); border: 1px solid var(--warning); padding: 8px; border-radius: 6px;">
                <div style="font-weight: 800; color: var(--warning);">16 bits</div>
                <div style="font-size: 0.72rem; color: var(--text-1);">Subnet ID</div>
              </div>
              <div style="flex: 4; background: rgba(52, 211, 153, 0.15); border: 1px solid var(--success); padding: 8px; border-radius: 6px;">
                <div style="font-weight: 800; color: var(--success);">64 bits</div>
                <div style="font-size: 0.72rem; color: var(--text-1);">Interface ID (Host)</div>
              </div>
            </div>
            <div class="small muted">
              &bull; <b>16 bits de subred</b> = 2^16 = <b>65,536 subredes /64</b> para la organización.<br>
              &bull; Cada subred /64 alberga <b>1.84 &times; 10^19 hosts</b> (2^64).
            </div>
          </div>

          <div class="card" style="padding: 24px;">
            <div class="card-title">
              <h3>${App.icon("check")} Reglas de Abreviación RFC 5952</h3>
            </div>
            <ul style="padding-left: 20px; line-height: 1.8; color: var(--text-1); font-size: 0.88rem; margin: 0;">
              <li><b>Omitir ceros iniciales:</b> En cada hexteto, los ceros a la izquierda son opcionales (<code>0db8</code> &rarr; <code>db8</code>; <code>0001</code> &rarr; <code>1</code>; <code>0000</code> &rarr; <code>0</code>).</li>
              <li><b>Compresión doble dos puntos (::):</b> Una secuencia contigua de uno o más hextetos de solo ceros puede reemplazarse por <code>::</code>.</li>
              <li><b>Regla crucial del examen:</b> <code>::</code> <b>SOLO se puede usar UNA SOLA VEZ</b> por dirección IPv6 (usarlo 2 veces genera ambigüedad).</li>
            </ul>
          </div>
        </div>

        <!-- IPv6 Subnet Drill Card -->
        <div class="card" style="padding: 30px; margin-bottom: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="eyebrow">Desafío de Subneteo IPv6</div>
              <h2>Cálculo de Subred para Prefijo /${p.prefixLen}</h2>
            </div>
            <button class="btn btn-sm btn-ghost" id="btnNewV6Problem">${App.icon("bolt")} Generar Otro Desafío</button>
          </div>

          <div style="background: rgba(148, 178, 255, 0.04); border: 1px solid var(--border); padding: 20px; border-radius: var(--radius); margin-bottom: 24px; text-align: center;">
            <div class="small muted" style="margin-bottom: 6px;">La organización recibe el siguiente bloque del proveedor:</div>
            <div style="font-family: var(--mono); font-size: 1.6rem; font-weight: 800; color: var(--accent);">${p.gPrefix}::/${p.prefixLen}</div>
            <div style="margin-top: 10px; font-size: 0.95rem;">
              Calcula la dirección de red de la <b>Subred #${p.subnetNum}</b> (en hexadecimal: <code>0x${p.subnetHex}</code>) para una máscara estándar <b>/64</b>:
            </div>
          </div>

          <div class="grid grid-3" style="gap: 16px;">
            <div class="field span-2">
              <label>Dirección de Subred /64 Resultante</label>
              <input type="text" class="input mono ${v6Checked ? (v6Results.subnet ? "ok" : "bad") : ""}" id="inputV6Subnet" placeholder="ej. ${p.gPrefix}:${p.subnetHex}::/64" ${v6Checked ? "disabled" : ""}>
              ${v6Checked ? `<div class="answer-key">Respuesta: ${p.expectedSubnet}</div>` : ""}
            </div>

            <div class="field">
              <label>Bits usados para subredes</label>
              <input type="number" class="input mono ${v6Checked ? (v6Results.bits ? "ok" : "bad") : ""}" id="inputV6Bits" placeholder="ej. 16" ${v6Checked ? "disabled" : ""}>
              ${v6Checked ? `<div class="answer-key">Respuesta: ${p.subnetBits} bits (64 - ${p.prefixLen})</div>` : ""}
            </div>

            <div class="field span-3">
              <label>Total de subredes /64 disponibles para el cliente (2^bits)</label>
              <input type="text" class="input mono ${v6Checked ? (v6Results.total ? "ok" : "bad") : ""}" id="inputV6Total" placeholder="ej. ${p.totalSubnets}" ${v6Checked ? "disabled" : ""}>
              ${v6Checked ? `<div class="answer-key">Respuesta: ${p.totalSubnets.toLocaleString()} subredes</div>` : ""}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
            ${
              !v6Checked
                ? `<button class="btn btn-primary btn-lg" id="btnCheckV6">Comprobar Respuestas</button>`
                : `<button class="btn btn-primary btn-lg" id="btnNextV6">Siguiente Desafío ${App.icon("arrowR")}</button>`
            }
          </div>
        </div>
      `;
    }

    function renderEui64Tab() {
      const calc = computeEui64(euiInputMac) || computeEui64("00:60:2F:3A:07:BC");
      const drill = euiDrillProblem;

      return `
        <!-- EUI-64 Explanatory Hero -->
        <div class="card" style="padding: 24px; margin-bottom: 22px;">
          <div class="card-title">
            <h3>${App.icon("layers")} ¿Cómo funciona EUI-64 Modificado? (48-bit MAC &rarr; 64-bit Interface ID)</h3>
          </div>
          <p class="small muted" style="line-height: 1.7; margin-bottom: 16px;">
            En SLAAC (Stateless Address Autoconfiguration), un host puede generar automáticamente su <b>Interface ID de 64 bits</b> a partir de su dirección MAC física de 48 bits mediante tres pasos fundamentales:
          </p>

          <div class="grid grid-3" style="gap: 14px;">
            <div class="card stat" style="padding: 16px; border: 1px solid var(--border);">
              <strong style="color: var(--accent);">Paso 1: Dividir la MAC</strong>
              <p class="small muted" style="margin-top: 4px;">Divide los 6 bytes de la MAC en 2 mitades de 3 bytes (OUI de fabricante y NIC asignada).</p>
            </div>
            <div class="card stat" style="padding: 16px; border: 1px solid var(--warning);">
              <strong style="color: var(--warning);">Paso 2: Insertar FFFE</strong>
              <p class="small muted" style="margin-top: 4px;">Inserta el valor hexadecimal fijo <b>FF:FE</b> justo en el centro de ambas mitades.</p>
            </div>
            <div class="card stat" style="padding: 16px; border: 1px solid var(--success);">
              <strong style="color: var(--success);">Paso 3: Invertir 7° Bit (U/L)</strong>
              <p class="small muted" style="margin-top: 4px;">Invierte el 7° bit del primer byte (bit Universal/Local). Si era 0 cambia a 1; si era 1 cambia a 0.</p>
            </div>
          </div>
        </div>

        <!-- Interactive EUI-64 Visualizer -->
        <div class="card" style="padding: 28px; margin-bottom: 22px;">
          <div class="row-between" style="margin-bottom: 20px;">
            <div>
              <div class="eyebrow">Simulador en Tiempo Real</div>
              <h2>Convertidor Interactivo Paso a Paso</h2>
            </div>
            <button class="btn btn-sm btn-ghost" id="btnRandomMac">${App.icon("bolt")} Probar MAC Aleatoria</button>
          </div>

          <div class="field" style="max-width: 480px; margin-bottom: 24px;">
            <label>Ingresa cualquier dirección MAC (formatos: xx:xx:xx:xx:xx:xx o xxxx.xxxx.xxxx)</label>
            <input type="text" class="input mono" id="inputEuiMacLive" value="${calc.raw}" placeholder="ej. 00:60:2F:3A:07:BC">
          </div>

          <!-- Step by Step Visual Breakdown -->
          <div class="eui-flow">
            <!-- Step 1 -->
            <div class="eui-step">
              <h4>1. División de mitades de la MAC (48 bits):</h4>
              <div class="eui-blocks">
                <span class="eui-byte highlight">${calc.clean.substring(0, 2)}</span>
                <span class="eui-byte">${calc.clean.substring(2, 4)}</span>
                <span class="eui-byte">${calc.clean.substring(4, 6)}</span>
                <span style="color: var(--text-2); font-weight: 700; padding: 0 8px;">(Centro)</span>
                <span class="eui-byte">${calc.clean.substring(6, 8)}</span>
                <span class="eui-byte">${calc.clean.substring(8, 10)}</span>
                <span class="eui-byte">${calc.clean.substring(10, 12)}</span>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="eui-step">
              <h4>2. Inserción de 16 bits en el medio (FF:FE):</h4>
              <div class="eui-blocks">
                <span class="eui-byte highlight">${calc.clean.substring(0, 2)}</span>
                <span class="eui-byte">${calc.clean.substring(2, 4)}</span>
                <span class="eui-byte">${calc.clean.substring(4, 6)}</span>
                <span class="eui-byte insert">FF</span>
                <span class="eui-byte insert">FE</span>
                <span class="eui-byte">${calc.clean.substring(6, 8)}</span>
                <span class="eui-byte">${calc.clean.substring(8, 10)}</span>
                <span class="eui-byte">${calc.clean.substring(10, 12)}</span>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="eui-step">
              <h4>3. Inversión del 7° bit en el primer byte (${calc.byte1Hex.toUpperCase()} &rarr; ${calc.byte1FlippedHex.toUpperCase()}):</h4>
              <div style="margin-top: 10px; font-size: 0.88rem;">
                <div style="margin-bottom: 6px;">Byte original <b>0x${calc.byte1Hex.toUpperCase()}</b> en binario:</div>
                <div class="bit-row">
                  ${calc.byte1Bin
                    .split("")
                    .map(
                      (b, idx) =>
                        `<div class="bit-box ${idx === 6 ? "flip" : ""}" title="Bit ${idx + 1}">${b}</div>`
                    )
                    .join("")}
                </div>
                <div class="small muted" style="margin-top: 4px;">El 7° bit (resaltado) es <b>${calc.byte1Bin[6]}</b>. Al invertirlo cambia a <b>${calc.byte1FlippedBin[6]}</b>:</div>
                <div class="bit-row" style="margin-top: 6px;">
                  ${calc.byte1FlippedBin
                    .split("")
                    .map(
                      (b, idx) =>
                        `<div class="bit-box ${idx === 6 ? "flip" : ""}" title="Bit ${idx + 1}">${b}</div>`
                    )
                    .join("")}
                </div>
                <div style="margin-top: 6px; font-weight: 700; color: var(--accent);">
                  Nuevo primer byte: <b>0x${calc.byte1FlippedHex.toUpperCase()}</b>
                </div>
              </div>
            </div>

            <!-- Result -->
            <div class="eui-step" style="background: rgba(34, 211, 238, 0.08); border-color: rgba(34, 211, 238, 0.3);">
              <h4>${App.icon("check")} Interface ID Resultante (64 bits):</h4>
              <div style="font-family: var(--mono); font-size: 1.35rem; font-weight: 800; color: var(--accent); margin: 8px 0;">
                ${calc.iid}
              </div>
              <div style="margin-top: 8px; font-size: 0.88rem; line-height: 1.7;">
                &bull; Dirección <b>Link-Local</b> completa: <code style="color: var(--success);">${calc.linkLocal}/64</code><br>
                &bull; Dirección <b>Global Unicast</b> de ejemplo: <code style="color: var(--text-0);">${calc.globalExample}/64</code>
              </div>
            </div>
          </div>
        </div>

        <!-- EUI-64 Speed Drill Challenge -->
        <div class="card" style="padding: 28px;">
          <div class="row-between" style="margin-bottom: 20px;">
            <div>
              <div class="eyebrow">Desafío Rápido de Examen</div>
              <h2>Drill de Conversión EUI-64</h2>
            </div>
            <div class="pill mono">Aciertos: ${euiScore.correct} / ${euiScore.total}</div>
          </div>

          <div style="background: rgba(148, 178, 255, 0.04); border: 1px solid var(--border); padding: 20px; border-radius: var(--radius); margin-bottom: 24px; text-align: center;">
            <div class="small muted" style="margin-bottom: 4px;">Dada la dirección MAC física del router:</div>
            <div style="font-family: var(--mono); font-size: 1.6rem; font-weight: 800; color: var(--warning);">${drill.mac}</div>
          </div>

          <div class="grid grid-2" style="gap: 16px;">
            <div class="field">
              <label>1. ¿En qué valor hexadecimal se convierte el primer byte tras invertir el 7° bit?</label>
              <input type="text" class="input mono ${euiDrillAnswered ? (euiDrillResult.b1Ok ? "ok" : "bad") : ""}" id="inputEuiB1" placeholder="ej. 02" maxlength="2" ${euiDrillAnswered ? "disabled" : ""}>
              ${euiDrillAnswered ? `<div class="answer-key">Respuesta: ${drill.calc.byte1FlippedHex}</div>` : ""}
            </div>

            <div class="field">
              <label>2. Interface ID completo (o Link-Local fe80::...)</label>
              <input type="text" class="input mono ${euiDrillAnswered ? (euiDrillResult.iidOk ? "ok" : "bad") : ""}" id="inputEuiIid" placeholder="ej. ${drill.calc.iid}" ${euiDrillAnswered ? "disabled" : ""}>
              ${euiDrillAnswered ? `<div class="answer-key">Respuesta: ${drill.calc.linkLocal}</div>` : ""}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
            ${
              !euiDrillAnswered
                ? `<button class="btn btn-primary btn-lg" id="btnCheckEuiDrill">Comprobar Respuesta</button>`
                : `<button class="btn btn-primary btn-lg" id="btnNextEuiDrill">Siguiente MAC ${App.icon("arrowR")}</button>`
            }
          </div>
        </div>
      `;
    }

    function renderTypesTab() {
      const q = currentTypeQuiz;

      return `
        <!-- IPv6 Types Flashcards -->
        <div class="card" style="padding: 24px; margin-bottom: 22px;">
          <div class="card-title">
            <h3>${App.icon("layers")} Tipos de Direcciones IPv6 Oficiales del CCNA</h3>
          </div>
          <p class="small muted" style="margin-bottom: 16px;">
            Aprende los prefijos, rangos y casos de uso requeridos para aprobar la certificación Cisco 200-301:
          </p>

          <div class="ipv6-types-grid">
            ${IPV6_TYPES.map(
              (t) => `
              <div class="ipv6-card" style="--c: ${t.color};">
                <div class="row-between">
                  <span class="pill" style="color: ${t.color}; border-color: ${t.color}; font-weight: 700;">${t.prefix}</span>
                  <span class="small muted">${t.scope}</span>
                </div>
                <h4 style="color: var(--text-0); margin-top: 4px;">${t.name}</h4>
                <div class="mono small" style="color: var(--text-1); background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 6px;">
                  ${t.range}
                </div>
                <p class="small" style="color: var(--text-1); line-height: 1.6; margin-top: 4px;">
                  ${t.desc}
                </p>
                <div class="small muted" style="margin-top: auto; border-top: 1px solid var(--border); padding-top: 8px;">
                  ${t.rules}
                </div>
              </div>
            `
            ).join("")}
          </div>
        </div>

        <!-- IPv6 Recognition Speed Quiz -->
        <div class="card" style="padding: 30px;">
          <div class="row-between" style="margin-bottom: 20px;">
            <div>
              <div class="eyebrow">Evaluación Rápida de Reconocimiento</div>
              <h2>¿Qué tipo de dirección IPv6 es esta?</h2>
            </div>
            <div class="pill mono">🔥 Racha: ${quizStreak} | Total: ${quizTotal}</div>
          </div>

          <div style="background: rgba(148, 178, 255, 0.04); border: 1px solid var(--border); padding: 26px; border-radius: var(--radius); text-align: center; margin-bottom: 24px;">
            <div class="small muted" style="margin-bottom: 6px;">Analiza el prefijo de la dirección:</div>
            <div style="font-family: var(--mono); font-size: clamp(1.4rem, 3.5vw, 2.2rem); font-weight: 800; color: var(--accent);">
              ${q.ip}
            </div>
          </div>

          <!-- Answer Option Buttons -->
          <div class="quiz-options">
            ${IPV6_TYPES.map((t) => {
              let cls = "btn btn-lg";
              if (quizSelectedAnswer) {
                if (t.id === q.type) cls += " btn-primary";
                else if (quizSelectedAnswer === t.id && t.id !== q.type) cls += " btn-ghost";
              } else {
                cls += " btn-ghost";
              }
              return `
                <button class="${cls}" data-type="${t.id}" ${quizSelectedAnswer ? "disabled" : ""} style="text-align: left; justify-content: flex-start; padding: 14px 16px;">
                  <span class="dot" style="--c: ${t.color}; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px;"></span>
                  ${t.name}
                </button>
              `;
            }).join("")}
          </div>

          ${
            quizSelectedAnswer
              ? `
            <div class="feedback ${quizSelectedAnswer === q.type ? "ok" : "bad"}" style="margin-top: 24px;">
              <h4>
                ${quizSelectedAnswer === q.type ? App.icon("check") + " ¡Correcto!" : App.icon("x") + " Respuesta Incorrecta"}
              </h4>
              <p>${q.reason}</p>
              <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
                <button class="btn btn-primary" id="btnNextQuiz">Siguiente Pregunta ${App.icon("arrowR")}</button>
              </div>
            </div>
          `
              : ""
          }
        </div>
      `;
    }

    /* ==========================================================================
       EVENT BINDINGS
       ========================================================================== */
    function attachAllEvents() {
      // Subnet Tabs
      App.$$("#tabsSubnet button", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTab = btn.dataset.tab;
          render();
        });
      });

      // TAB 1: IPv4 Events
      const btnNewV4 = App.$("#btnNewV4Problem", host);
      if (btnNewV4) {
        btnNewV4.addEventListener("click", () => {
          generateV4Problem();
          render();
        });
      }

      const btnToggleCheat = App.$("#btnToggleCheat", host);
      if (btnToggleCheat) {
        btnToggleCheat.addEventListener("click", () => {
          v4CheatOpen = !v4CheatOpen;
          render();
        });
      }

      const btnCheckV4 = App.$("#btnCheckV4", host);
      if (btnCheckV4) btnCheckV4.addEventListener("click", checkV4Answers);

      const btnNextV4 = App.$("#btnNextV4", host);
      if (btnNextV4) {
        btnNextV4.addEventListener("click", () => {
          generateV4Problem();
          render();
        });
      }

      // TAB 2: IPv6 Events
      const btnNewV6 = App.$("#btnNewV6Problem", host);
      if (btnNewV6) {
        btnNewV6.addEventListener("click", () => {
          generateV6Problem();
          render();
        });
      }

      const btnCheckV6 = App.$("#btnCheckV6", host);
      if (btnCheckV6) btnCheckV6.addEventListener("click", checkV6Answers);

      const btnNextV6 = App.$("#btnNextV6", host);
      if (btnNextV6) {
        btnNextV6.addEventListener("click", () => {
          generateV6Problem();
          render();
        });
      }

      // TAB 3: EUI-64 Events
      const inputEuiLive = App.$("#inputEuiMacLive", host);
      if (inputEuiLive) {
        inputEuiLive.addEventListener("input", (e) => {
          euiInputMac = e.target.value;
          render();
        });
      }

      const btnRandomMac = App.$("#btnRandomMac", host);
      if (btnRandomMac) {
        btnRandomMac.addEventListener("click", () => {
          const hex = "0123456789abcdef";
          let r = "";
          for (let i = 0; i < 12; i++) r += hex[Math.floor(Math.random() * 16)];
          euiInputMac = `${r.substring(0, 2)}:${r.substring(2, 4)}:${r.substring(4, 6)}:${r.substring(6, 8)}:${r.substring(8, 10)}:${r.substring(10, 12)}`;
          render();
        });
      }

      const btnCheckEui = App.$("#btnCheckEuiDrill", host);
      if (btnCheckEui) btnCheckEui.addEventListener("click", checkEuiDrill);

      const btnNextEui = App.$("#btnNextEuiDrill", host);
      if (btnNextEui) {
        btnNextEui.addEventListener("click", () => {
          generateEuiDrill();
          render();
        });
      }

      // TAB 4: Types Events
      App.$$(".quiz-options button[data-type]", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          if (quizSelectedAnswer) return;
          const chosen = btn.dataset.type;
          quizSelectedAnswer = chosen;
          quizTotal++;
          if (chosen === currentTypeQuiz.type) {
            quizStreak++;
          } else {
            quizStreak = 0;
          }
          render();
        });
      });

      const btnNextQuiz = App.$("#btnNextQuiz", host);
      if (btnNextQuiz) {
        btnNextQuiz.addEventListener("click", () => {
          pickNextTypeQuiz();
          render();
        });
      }

      // Global enter key listener on text inputs
      host.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            if (activeTab === "ipv4") {
              if (!v4Checked) checkV4Answers();
              else {
                generateV4Problem();
                render();
              }
            } else if (activeTab === "ipv6") {
              if (!v6Checked) checkV6Answers();
              else {
                generateV6Problem();
                render();
              }
            } else if (activeTab === "eui64") {
              if (!euiDrillAnswered) checkEuiDrill();
              else {
                generateEuiDrill();
                render();
              }
            }
          }
        });
      });
    }

    // Initial setup for all modules
    generateV4Problem();
    generateV6Problem();
    generateEuiDrill();
    pickNextTypeQuiz();
    render();
  });
})();
