/* Barre d'onglets du bas sur iPhone (appli installée sur l'écran d'accueil) : après la fermeture du clavier, iOS garde
   parfois la hauteur d'écran réduite, et une barre « position: fixed; bottom: 0 » reste à mi-hauteur, la page défilant
   dessous (bug WebKit d'iOS 26, aussi signalé avec « Réduire les animations »). Quand la barre ne touche plus le bas de
   l'écran, on force WebKit à recalculer la fenêtre (masquage et réaffichage de la page, défilement conservé) ; si elle
   reste décalée, on la redescend de l'écart mesuré. Rien ne se passe sur ordinateur ni dans Safari. */
(function () {
  "use strict";
  var standalone = navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  if (!standalone || !/iPhone|iPad|iPod/.test(navigator.userAgent)) return;
  var full = {}, healed = false; // plus grande hauteur vue, par largeur (orientation) ; recalcul déjà tenté
  function typing() { var a = document.activeElement; return !!(a && a.matches && a.matches("input:not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable]")); }
  function bar() { var b = document.getElementById("bottomnav"); return b && b.getClientRects().length ? b : null; }
  function gap(b) {
    var w = innerWidth, h = innerHeight; full[w] = Math.max(full[w] || 0, h);
    return Math.max(full[w] - h, h - b.getBoundingClientRect().bottom);
  }
  function check() {
    var b = bar(); if (!b || typing()) return;
    b.style.transform = "";
    var g = gap(b);
    if (g <= 4) { healed = false; return; }
    if (!healed) { // une fois par épisode : un recalcul complet de la page coûte cher
      healed = true;
      var y = scrollY, x = scrollX, el = document.body;
      el.style.display = "none"; void el.offsetHeight; el.style.display = "";
      scrollTo(x, y); g = gap(b);
    }
    if (g > 4) b.style.transform = "translateY(" + g + "px)";
  }
  var t = 0;
  function soon(ms) { clearTimeout(t); t = setTimeout(check, ms); }
  document.addEventListener("focusout", function () { soon(150); setTimeout(check, 700); });
  addEventListener("resize", function () { soon(150); });
  if (window.visualViewport) visualViewport.addEventListener("resize", function () { soon(150); });
  addEventListener("orientationchange", function () { full = {}; soon(400); });
  addEventListener("pageshow", function () { soon(300); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) soon(300); });
  addEventListener("scroll", function () { soon(250); }, { passive: true });
  soon(500);
})();
