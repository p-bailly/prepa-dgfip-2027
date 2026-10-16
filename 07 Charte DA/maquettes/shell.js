// Gabarit des maquettes : barre d'appli, onglets, barre du bas et pictogrammes.
// <body data-app="qcm|qrc" data-tab="..."> ; ?theme=dark|light force le thème.
(function () {
  var q = new URLSearchParams(location.search);
  var th = q.get("theme");
  if (th === "dark" || th === "light") document.documentElement.setAttribute("data-theme", th);

  var I = {
    today: '<path d="M4 7.5h16M8 3.5v3M16 3.5v3"/><rect x="4" y="5" width="16" height="15.5" rx="2.5"/><path d="m9 14 2 2 4-4.5"/>',
    exam: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M10 3h4M19 6.5l-1.5 1.5"/>',
    chart: '<path d="M4 20h16M7 16.5v-5M12 16.5V6.5M17 16.5v-8"/>',
    bank: '<path d="M4 7.5 12 4l8 3.5-8 3.5z"/><path d="m4 12 8 3.5 8-3.5M4 16.5 12 20l8-3.5"/>',
    more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    gauge: '<path d="M4.5 17a8 8 0 1 1 15 0"/><path d="m12 13 3.5-4"/><circle cx="12" cy="13.5" r="1.2"/>',
    pen: '<path d="M14.5 5.5 18.5 9.5 9 19H5v-4z"/><path d="m12.5 7.5 4 4"/>',
    book: '<path d="M4.5 5.5c2.5-1 5-1 7.5.5v13c-2.5-1.5-5-1.5-7.5-.5zM19.5 5.5c-2.5-1-5-1-7.5.5v13c2.5-1.5 5-1.5 7.5-.5z"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-10M10 12.5h4"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    cross: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
    bolt: '<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    link: '<path d="M9.5 14.5 14.5 9.5M10 6.5 11.5 5a4 4 0 0 1 5.5 5.5L15.5 12M14 17.5 12.5 19A4 4 0 0 1 7 13.5L8.5 12"/>',
    flag: '<path d="M5.5 21V4.5M5.5 5h11l-2 4 2 4h-11"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    scale: '<path d="M12 4v16M7 20h10M4.5 8h15M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z"/>'
  };
  window.ico = function (n, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + '>' + I[n] + '</svg>';
  };
  // Logos : tuile d'encre + pictogramme. QCM = cases de la feuille de réponse ; QRC = compte en T.
  window.LOGO = {
    qcm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" fill="currentColor"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>',
    qrc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><path d="M3 6.5h18M12 6.5V21" stroke-width="2.4"/><path d="M5 11h4.5M5 14.5h3M14.5 11h4.5M14.5 14.5h3M14.5 18h4" stroke-width="1.7"/></svg>'
  };

  var APPS = {
    qcm: {
      name: "QCM DGFiP 2027", sub: "Épreuve écrite n° 2 · partie QCM",
      stamp: ["J-52", "écrit inspecteur · 7 déc."],
      tabs: [["jour", "Aujourd'hui", "today", "qcm-aujourdhui.html", "23"], ["examen", "Examen blanc", "exam", "qcm-examen.html"], ["progres", "Progrès", "chart", "qcm-progres.html"], ["banque", "Banque", "bank", "#"], ["plus", "Plus", "more", "#"]]
    },
    qrc: {
      name: "Atelier QRC compta", sub: "Comptabilité et analyse financière",
      stamp: ["J-52", "écrit inspecteur · 7 déc."],
      tabs: [["dash", "Progression", "gauge", "qrc-progression.html"], ["train", "Entraînement", "pen", "qrc-exercice.html"], ["exam", "Épreuve", "exam", "#"], ["fiches", "Fiches", "book", "qrc-fiches.html"], ["annales", "Sujets réels", "archive", "#"]]
    }
  };

  var b = document.body, A = APPS[b.dataset.app], cur = b.dataset.tab;
  var head = document.createElement("header");
  head.className = "appbar";
  head.innerHTML =
    '<div class="wrap appbar-in">' +
      '<a class="brand" href="index.html"><span class="logo">' + LOGO[b.dataset.app] + '</span><span class="brand-t"><b>' + A.name + '</b><small>' + A.sub + '</small></span></a>' +
      '<div class="appbar-r"><span class="stamp" title="Compte à rebours"><b>' + A.stamp[0] + '</b><span>' + A.stamp[1] + '</span></span>' +
      '<div class="seg" role="group" aria-label="Programme"><button aria-pressed="true">Insp.</button><button aria-pressed="false">Contr.</button></div></div>' +
    '</div>' +
    '<nav class="wrap tabs" aria-label="Sections">' + A.tabs.map(function (t) {
      return '<a href="' + t[3] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + ico(t[2]) + t[1] + (t[4] ? ' <span class="count">' + t[4] + '</span>' : '') + '</a>';
    }).join("") + '</nav>';
  b.insertBefore(head, b.firstChild);

  var bot = document.createElement("nav");
  bot.className = "bottomnav";
  bot.setAttribute("aria-label", "Sections");
  bot.innerHTML = A.tabs.map(function (t) {
    return '<a href="' + t[3] + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + ico(t[2]) + '<span>' + t[1].replace("Examen blanc", "Examen").replace("Entraînement", "S'entraîner").replace("Sujets réels", "Annales") + '</span></a>';
  }).join("");
  b.appendChild(bot);

  document.querySelectorAll("[data-ico]").forEach(function (el) { el.insertAdjacentHTML("afterbegin", ico(el.dataset.ico)); });
  document.querySelectorAll("[data-logo]").forEach(function (el) { el.innerHTML = LOGO[el.dataset.logo]; });
})();
