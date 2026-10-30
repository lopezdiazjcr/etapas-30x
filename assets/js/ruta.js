/*
 * La lógica del diagnóstico, sin nada de pantalla, para poder probarla con node.
 *
 * Hasta 4 personas el tamaño no dice mucho: un equipo de 3 sin una venta sigue en la etapa 1.
 * Ahí decide cómo van las ventas. De 5 personas en adelante decide el tamaño.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ETAPAS_RUTA = factory();
})(this, function () {
  var PREGUNTAS = {
    equipo: {
      titulo: "Sin contarte a ti, ¿cuántas personas trabajan a tiempo completo en tu negocio?",
      opciones: [
        { id: "solo", texto: "Ninguna, solo yo" },
        { id: "freelancers", texto: "Ninguna fija, trabajo con freelancers" },
        { id: "1-4", texto: "1 a 4" },
        { id: "5-9", texto: "5 a 9", etapa: 4 },
        { id: "10-20", texto: "10 a 20", etapa: 5 },
        { id: "21-49", texto: "21 a 49", etapa: 6 },
        { id: "50-99", texto: "50 a 99", etapa: 7 },
        { id: "100-249", texto: "100 a 249", etapa: 8 },
        { id: "250-499", texto: "250 a 499", etapa: 9 },
        { id: "500+", texto: "500 o más", etapa: 9 }
      ]
    },
    ventas: {
      titulo: "¿Cómo van las ventas hoy?",
      opciones: [
        { id: "idea", texto: "Es una idea: todavía nadie lo usa", etapa: 0 },
        { id: "gratis", texto: "Lo usan gratis, pero nadie me ha pagado", etapa: 1 },
        { id: "rachas", texto: "Ya vendí, pero unos meses sí y otros no", etapa: 2 },
        { id: "constante", texto: "Vendo todos los meses", etapa: 3 }
      ]
    },
    freno: {
      titulo: "¿Qué es lo que más te frena hoy?",
      opciones: [
        { id: "marketing", texto: "Me faltan clientes nuevos" },
        { id: "ventas", texto: "Llegan interesados, pero no cierro" },
        { id: "servicio", texto: "Mis clientes se quejan o se van" },
        { id: "producto", texto: "Mi oferta no da para más" },
        { id: "equipo", texto: "Contratar y armar equipo" },
        { id: "finanzas", texto: "No tengo claros mis números" }
      ]
    }
  };

  function opcion(pregunta, id) {
    return PREGUNTAS[pregunta].opciones.filter(function (o) { return o.id === id; })[0] || null;
  }

  // Las preguntas que le tocan a esta persona según lo que ya respondió.
  function pasos(respuestas) {
    var equipo = opcion("equipo", respuestas.equipo);
    if (equipo && equipo.etapa != null) return ["equipo", "freno"];
    return ["equipo", "ventas", "freno"];
  }

  function etapa(respuestas) {
    var equipo = opcion("equipo", respuestas.equipo);
    if (equipo && equipo.etapa != null) return equipo.etapa;
    var ventas = opcion("ventas", respuestas.ventas);
    return ventas ? ventas.etapa : null;
  }

  // Las etapas que siguen en juego: se usa para ir apagando portadas mientras la persona responde.
  function candidatas(respuestas) {
    var e = etapa(respuestas);
    if (e != null) return [e];
    return respuestas.equipo ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  // Cada resultado ofrece como máximo un programa. Si ninguno empata, el llamado es seguir la cuenta.
  function programa(numeroEtapa, freno) {
    if (freno === "ventas" && numeroEtapa >= 2) return "salesMachine";
    if (numeroEtapa >= 6) return "aiExecutives";
    return null;
  }

  return { PREGUNTAS: PREGUNTAS, opcion: opcion, pasos: pasos, etapa: etapa, candidatas: candidatas, programa: programa };
});
