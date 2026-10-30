/*
 * Las tres vistas de la página: portada, preguntas y resultado.
 * El resultado vive en el hash (#etapa-4/ventas), así que se puede recargar y compartir.
 */
(function () {
  var CFG = window.ETAPAS_CONFIG;
  var RUTA = window.ETAPAS_RUTA;
  var GUIAS = window.GUIAS;

  var vistas = { portada: $("#portada"), quiz: $("#quiz"), resultado: $("#resultado") };
  var respuestas = {};
  var indice = 0;
  var enContacto = false;

  function $(s) { return document.querySelector(s); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function mostrar(nombre) {
    Object.keys(vistas).forEach(function (k) { vistas[k].hidden = k !== nombre; });
    window.scrollTo(0, 0);
  }

  function pideContacto() { return !!CFG.webhookUrl; }

  function pintarGrilla() {
    $("#grilla").innerHTML = GUIAS.map(function (g) {
      return '<li><button class="guia" type="button" data-empezar>' +
        '<img src="' + g.portada + '" alt="Portada de la guía: ' + esc(g.titulo) + '" width="720" height="932" loading="lazy">' +
        '<span class="guia-etapa">Etapa ' + g.etapa + '</span>' +
        '<span class="guia-para">' + esc(g.para) + "</span></button></li>";
    }).join("");
    $("#riel").innerHTML = GUIAS.map(function (g) {
      return '<img src="' + g.portada + '" alt="" data-etapa="' + g.etapa + '" width="720" height="932">';
    }).join("");
    if (!pideContacto()) {
      document.querySelectorAll("[data-sin-registro]").forEach(function (n) { n.hidden = false; });
    }
  }

  function pintarRiel() {
    var vivas = RUTA.candidatas(respuestas);
    document.querySelectorAll("#riel img").forEach(function (img) {
      img.classList.toggle("apagada", vivas.indexOf(Number(img.dataset.etapa)) < 0);
    });
  }

  function empezar() {
    respuestas = {};
    indice = 0;
    enContacto = false;
    if (location.hash) history.pushState("", "", location.pathname + location.search);
    mostrar("quiz");
    pintarPregunta();
  }

  function pintarPregunta() {
    enContacto = false;
    var lista = RUTA.pasos(respuestas);
    var clave = lista[indice];
    var pregunta = RUTA.PREGUNTAS[clave];
    $("#progreso").textContent = "Pregunta " + (indice + 1) + " de " + lista.length;
    $("#barra").style.width = ((indice + 1) / lista.length * 100) + "%";
    $("#panel").innerHTML =
      '<h1 class="pregunta" tabindex="-1">' + esc(pregunta.titulo) + "</h1>" +
      '<div class="opciones' + (pregunta.opciones.length > 6 ? " dos" : "") + '">' +
      pregunta.opciones.map(function (o) {
        var activa = respuestas[clave] === o.id ? " activa" : "";
        return '<button class="opcion' + activa + '" type="button" data-id="' + esc(o.id) + '">' + esc(o.texto) + "</button>";
      }).join("") + "</div>";
    pintarRiel();
    $("#panel .pregunta").focus({ preventScroll: true });
    $("#panel").querySelectorAll(".opcion").forEach(function (b) {
      b.addEventListener("click", function () { responder(clave, b.dataset.id); });
    });
  }

  function responder(clave, id) {
    respuestas[clave] = id;
    if (clave === "equipo" && RUTA.opcion("equipo", id).etapa != null) delete respuestas.ventas;
    var lista = RUTA.pasos(respuestas);
    if (indice < lista.length - 1) {
      indice++;
      pintarPregunta();
    } else if (pideContacto()) {
      pintarContacto();
    } else {
      irAlResultado();
    }
  }

  function atras() {
    if (enContacto) return pintarPregunta();
    if (indice === 0) {
      mostrar("portada");
      return;
    }
    indice--;
    pintarPregunta();
  }

  function pintarContacto() {
    enContacto = true;
    var g = GUIAS[RUTA.etapa(respuestas)];
    $("#progreso").textContent = "Tu guía está lista";
    $("#barra").style.width = "100%";
    $("#panel").innerHTML =
      '<h1 class="pregunta" tabindex="-1">¿A nombre de quién dejamos tu guía?</h1>' +
      '<p class="nota-panel">Ya encontramos tu etapa: «' + esc(g.titulo) + "».</p>" +
      '<form class="contacto" id="contacto" novalidate>' +
      '<label>Nombre<input name="nombre" autocomplete="name" required></label>' +
      '<label>Correo<input name="correo" type="email" autocomplete="email" required></label>' +
      '<label>WhatsApp <span>(opcional)</span><input name="whatsapp" type="tel" autocomplete="tel"></label>' +
      '<label class="acepto"><input name="acepto" type="checkbox" required> <span>Acepto que 30X me contacte y trate mis datos según su <a href="' +
      esc(CFG.privacyUrl) + '" target="_blank" rel="noopener">política de privacidad</a>.</span></label>' +
      '<p class="error" id="error" role="alert" hidden></p>' +
      '<button class="boton" type="submit">Ver mi guía</button></form>';
    pintarRiel();
    $("#panel .pregunta").focus({ preventScroll: true });
    $("#contacto").addEventListener("submit", enviarContacto);
  }

  function enviarContacto(ev) {
    ev.preventDefault();
    var f = ev.target;
    var nombre = f.nombre.value.trim();
    var correo = f.correo.value.trim();
    var error = "";
    if (!nombre) error = "Escribe tu nombre.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) error = "Revisa tu correo.";
    else if (!f.acepto.checked) error = "Necesitamos tu autorización para continuar.";
    var nodo = $("#error");
    nodo.hidden = !error;
    nodo.textContent = error;
    if (error) return;
    var e = RUTA.etapa(respuestas);
    var params = new URLSearchParams(location.search);
    var lead = {
      nombre: nombre,
      correo: correo,
      whatsapp: f.whatsapp.value.trim(),
      etapa: e,
      guia: GUIAS[e].titulo,
      equipo: respuestas.equipo,
      ventas: respuestas.ventas || "",
      freno: respuestas.freno,
      fecha: new Date().toISOString()
    };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) {
      if (params.get(k)) lead[k] = params.get(k);
    });
    // text/plain evita la consulta previa de CORS, que la mayoría de webhooks no contesta.
    fetch(CFG.webhookUrl, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(lead), keepalive: true, mode: "no-cors" })
      .catch(function () {});
    irAlResultado();
  }

  function irAlResultado() {
    var e = RUTA.etapa(respuestas);
    var grande = respuestas.equipo === "500+";
    location.hash = "etapa-" + e + "/" + respuestas.freno + (grande ? "/500" : "");
    // Se pinta desde las respuestas: hashchange llega tarde y el hash solo sirve para recargar y compartir.
    pintarResultado(e, respuestas.freno, grande);
  }

  function pintarResultado(e, freno, grande) {
    var g = GUIAS[e];
    var area = g.areas[freno];
    var clave = RUTA.programa(e, freno);
    var prog = clave ? CFG.programas[clave] : null;
    var html =
      '<div class="res-portada"><img src="' + g.portada + '" alt="Portada de la guía: ' + esc(g.titulo) + '" width="720" height="932"></div>' +
      '<div class="res-texto">' +
      '<p class="eyebrow">Tu etapa: ' + e + " · " + esc(g.para) + "</p>" +
      '<h1 tabindex="-1">' + esc(g.titulo) + "</h1>" +
      '<p class="bajada">' + esc(g.bajada) + "</p>";
    if (grande) {
      html += '<p class="aviso">Con más de 500 personas ya pasaste el tamaño de estas guías. Esta es la más cercana a tu realidad.</p>';
    }
    html += '<a class="boton" href="' + g.pdf + '" download>Descargar mi guía (PDF)</a>';
    if (area) {
      html += '<section class="tapon"><p class="eyebrow">Empieza por aquí · Página ' + area.pagina + "</p>" +
        "<h2>" + esc(area.titulo) + "</h2>" +
        "<dl><dt>El tapón</dt><dd>" + esc(area.tapon) + "</dd><dt>La salida</dt><dd>" + esc(area.salida) + "</dd></dl>" +
        '<a class="enlace" href="' + g.pdf + "#page=" + area.pagina + '" target="_blank" rel="noopener">Abrir la guía en la página ' + area.pagina + "</a></section>";
    }
    if (g.regla) {
      html += '<blockquote class="regla"><span>La regla de esta etapa</span>' + esc(g.regla) + "</blockquote>";
    }
    html += prog
      ? '<section class="siguiente"><p class="eyebrow">Si quieres ir más a fondo</p><h2>' + esc(prog.nombre) + "</h2><p>" + esc(prog.texto) +
        '</p><a class="enlace" href="' + esc(prog.url) + '" target="_blank" rel="noopener">' + esc(prog.boton) + "</a></section>"
      : '<section class="siguiente"><p class="eyebrow">Lo que sigue</p><h2>Síguenos en @crece30x</h2>' +
        "<p>Compartimos todas las semanas lo que aprendemos con founders y empresarios de LatAm.</p>" +
        '<a class="enlace" href="' + esc(CFG.instagramUrl) + '" target="_blank" rel="noopener">Ir a Instagram</a></section>';
    html += '<button class="reiniciar" type="button" data-empezar>Volver a responder</button></div>';
    $("#res-contenido").innerHTML = html;
    mostrar("resultado");
    $("#res-contenido h1").focus({ preventScroll: true });
  }

  function leerHash() {
    var m = /^#etapa-(\d)(?:\/([a-z]+))?(\/500)?$/.exec(location.hash);
    if (m && GUIAS[Number(m[1])]) {
      pintarResultado(Number(m[1]), m[2], !!m[3]);
      return true;
    }
    return false;
  }

  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-empezar]")) empezar();
  });
  $("#atras").addEventListener("click", atras);
  window.addEventListener("hashchange", function () {
    if (!leerHash()) mostrar("portada");
  });

  pintarGrilla();
  leerHash();
})();
