/*
 * Lo que cambia sin tocar el código de la página.
 */
window.ETAPAS_CONFIG = {
  // URL que recibe cada lead por POST (Make, Zapier, n8n, Apps Script, HubSpot…).
  // Vacío = la página NO pide datos personales y lleva directo a la guía: no se pide nada que no vaya a llegar a ningún lado.
  // Con valor = aparece la pantalla de contacto antes del resultado.
  webhookUrl: "",

  privacyUrl: "https://30x.com/legal/politica-de-privacidad",
  instagramUrl: "https://www.instagram.com/crece30x/",

  // Solo se ofrecen estos dos programas (política de CTAs desde ago 2026). El resto de los casos invita a seguir la cuenta.
  programas: {
    salesMachine: {
      nombre: "Sales Machine",
      texto: "Construye tu máquina de ventas: un sistema comercial repetible, medible y predecible.",
      url: "https://30x.com/programas/sales-machine",
      boton: "Ver Sales Machine"
    },
    aiExecutives: {
      nombre: "AI for Executives",
      texto: "Programa ejecutivo online, sin código, para C-Level, dueños y líderes: una estrategia de IA con adopción y resultados.",
      url: "https://30x.com/ai-for-executives",
      boton: "Ver AI for Executives"
    }
  }
};
