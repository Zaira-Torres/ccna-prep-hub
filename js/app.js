/* ==========================================================================
   CCNA Prep Hub - Application Bootstrapper
   Backdrop network nodes animation, global sidebar controls, backup/restore.
   ========================================================================== */
(function () {
  "use strict";
  const App = window.App;

  // Background network topology canvas animation
  function initNetworkBackdrop() {
    const canvas = document.getElementById("netCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const nodeCount = Math.min(45, Math.floor((w * h) / 30000));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1.5,
    }));

    function frame() {
      ctx.clearRect(0, 0, w, h);

      // Links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.16;
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        ctx.fillStyle = "rgba(99, 102, 241, 0.45)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // Backup & Reset handlers
  function initDataControls() {
    const btnExport = document.getElementById("btnExportData");
    if (btnExport) btnExport.addEventListener("click", App.exportProgress);

    const btnImport = document.getElementById("btnImportData");
    const fileImport = document.getElementById("fileImportData");
    if (btnImport && fileImport) {
      btnImport.addEventListener("click", () => fileImport.click());
      fileImport.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        App.importProgress(file)
          .then(() => {
            App.toast("¡Progreso importado con éxito!");
            App.route();
          })
          .catch((err) => App.toast("Error al importar: archivo inválido."));
      });
    }

    const btnReset = document.getElementById("btnResetData");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (
          confirm(
            "¿Estás seguro de que deseas reiniciar todo tu progreso, historial de simulacros y banco de errores?"
          )
        ) {
          App.resetAll();
          App.toast("Progreso reiniciado a cero.");
          App.route();
        }
      });
    }

    // Mobile sidebar toggle
    const toggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");
    if (toggle && sidebar) {
      toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
  }

  // Bootstrapping
  window.addEventListener("DOMContentLoaded", () => {
    initNetworkBackdrop();
    initDataControls();
    window.addEventListener("hashchange", App.route);
    App.route();
  });
})();
