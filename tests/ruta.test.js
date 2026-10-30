// node tests/ruta.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const R = require("../assets/js/ruta.js");

const raiz = path.join(__dirname, "..");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(raiz, "assets/js/data.js"), "utf8"), ctx);
vm.runInNewContext(fs.readFileSync(path.join(raiz, "assets/js/config.js"), "utf8"), ctx);
const GUIAS = ctx.window.GUIAS;
const CFG = ctx.window.ETAPAS_CONFIG;

// Tamaño: de 5 personas en adelante decide el equipo y sobra la pregunta de ventas.
[["5-9", 4], ["10-20", 5], ["21-49", 6], ["50-99", 7], ["100-249", 8], ["250-499", 9], ["500+", 9]].forEach(([equipo, esperada]) => {
  assert.strictEqual(R.etapa({ equipo }), esperada, equipo);
  assert.deepStrictEqual(R.pasos({ equipo }), ["equipo", "freno"], equipo);
});

// Hasta 4 personas decide cómo van las ventas, sea cual sea el tamaño.
["solo", "freelancers", "1-4"].forEach((equipo) => {
  assert.deepStrictEqual(R.pasos({ equipo }), ["equipo", "ventas", "freno"], equipo);
  assert.strictEqual(R.etapa({ equipo }), null, equipo);
  [["idea", 0], ["gratis", 1], ["rachas", 2], ["constante", 3]].forEach(([ventas, esperada]) => {
    assert.strictEqual(R.etapa({ equipo, ventas }), esperada, equipo + "/" + ventas);
  });
});

// Toda etapa es alcanzable.
const alcanzadas = new Set();
R.PREGUNTAS.equipo.opciones.forEach((e) => {
  R.PREGUNTAS.ventas.opciones.forEach((v) => alcanzadas.add(R.etapa({ equipo: e.id, ventas: v.id })));
});
assert.deepStrictEqual([...alcanzadas].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// Candidatas: el riel se va cerrando.
assert.strictEqual(R.candidatas({}).length, 10);
assert.deepStrictEqual(R.candidatas({ equipo: "1-4" }), [0, 1, 2, 3]);
assert.deepStrictEqual(R.candidatas({ equipo: "5-9" }), [4]);
assert.deepStrictEqual(R.candidatas({ equipo: "solo", ventas: "gratis" }), [1]);

// Todas las combinaciones etapa × freno llevan a una sección completa y a un archivo real.
assert.strictEqual(GUIAS.length, 10);
GUIAS.forEach((g, i) => {
  assert.strictEqual(g.etapa, i);
  assert.ok(fs.existsSync(path.join(raiz, g.pdf)), g.pdf);
  assert.ok(fs.existsSync(path.join(raiz, g.portada)), g.portada);
  assert.ok(g.bajada.length > 20, "bajada " + i);
  assert.ok(g.regla.length > 10, "regla " + i);
  R.PREGUNTAS.freno.opciones.forEach((f) => {
    const s = g.areas[f.id];
    assert.ok(s, `falta ${f.id} en etapa ${i}`);
    assert.ok(s.tapon && s.salida && s.pagina >= 3 && /^[^:]+[:]?/.test(s.titulo), `incompleta ${f.id} en etapa ${i}`);
  });
});

// Política de CTAs: solo Sales Machine, AI for Executives o seguir la cuenta.
assert.deepStrictEqual(Object.keys(CFG.programas).sort(), ["aiExecutives", "salesMachine"]);
assert.strictEqual(R.programa(0, "ventas"), null);
assert.strictEqual(R.programa(1, "ventas"), null);
assert.strictEqual(R.programa(2, "ventas"), "salesMachine");
assert.strictEqual(R.programa(9, "ventas"), "salesMachine");
assert.strictEqual(R.programa(5, "marketing"), null);
assert.strictEqual(R.programa(6, "marketing"), "aiExecutives");
GUIAS.forEach((g) => R.PREGUNTAS.freno.opciones.forEach((f) => {
  const p = R.programa(g.etapa, f.id);
  assert.ok(p === null || CFG.programas[p]);
}));

// Lo que no puede aparecer en la superficie de la página.
const superficie = ["index.html", "assets/js/data.js", "assets/js/ruta.js", "assets/js/app.js"].map((f) => fs.readFileSync(path.join(raiz, f), "utf8")).join("\n");
["Improvise", "Monetize", "Advertise", "Stabilize", "Prioritize", "Productize", "Optimize", "Categorize", "Specialize", "Capitalize", "$100M", "250,000", "250.000"].forEach((t) => {
  assert.ok(!superficie.includes(t), "aparece: " + t);
});

console.log("ok");
