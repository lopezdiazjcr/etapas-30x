"""Genera assets/js/data.js, las portadas y las copias de los PDFs a partir de las guías originales.

Uso: python3 -I scripts/generar-datos.py "<carpeta con los PDF de Etapa N>"
El texto de tapón, salida y regla sale literal de cada guía. Lo único escrito a mano son los títulos
que el PDF parte en dos columnas (TITULOS) y qué sección responde a cada freno (AREAS).
"""
import glob, json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]

SLUG = {
    0: "de-cero-a-tus-primeros-usuarios", 1: "de-gratis-a-tu-primera-venta",
    2: "de-ventas-sueltas-a-clientes-constantes", 3: "de-emprendedor-solo-a-tu-primer-equipo",
    4: "ya-no-puedes-hacerlo-todo", 5: "tu-cliente-ya-te-compro", 6: "crece-haciendo-mejor",
    7: "cuando-todo-esta-regado-ordena", 8: "poda-enfoca-especializa", 9: "la-siguiente-gran-apuesta",
}
PARA = {
    0: "Tienes una idea, pero nadie la usa todavía", 1: "Te usan gratis, pero nadie te ha pagado",
    2: "Ya vendes, pero por rachas", 3: "De 1 a 4 personas contigo",
    4: "Equipo de 5 a 9", 5: "Equipo de 10 a 20", 6: "Equipo de 20 a 49",
    7: "Empresas de 50 a 99", 8: "Empresas de 100 a 250", 9: "Empresas de 250 a 499",
}
TITULO = {
    0: "De cero a tus primeros usuarios", 1: "De gratis a tu primera venta",
    2: "De ventas sueltas a clientes constantes", 3: "De emprendedor solo a tu primer equipo",
    4: "Ya no puedes hacerlo todo. Elige.", 5: "Tu cliente ya te compró. ¿Y ahora qué?",
    6: "Crece haciendo mejor, no más", 7: "Cuando todo está regado, ordena",
    8: "Poda. Enfoca. Especializa.", 9: "La siguiente gran apuesta",
}
TITULOS = {
    (5, "02"): "Marketing: puedes gastar más si sabes cuánto vale un cliente",
    (7, "02"): "Marketing: el segundo canal se paga con lo que ya tienes",
    (7, "06"): "Talento: una tubería para candidatos y otra para tu gente",
    (9, "01"): "Producto: no toques la vaca. Compra o construye la estrella",
    (9, "08"): "Finanzas: deja la casa lista para vender (aunque no vendas)",
}
AREAS = {
    0: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="06", finanzas="07"),
    1: dict(producto="01", marketing="03", ventas="04", servicio="05", equipo="06", finanzas="07"),
    2: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="05", finanzas="06"),
    3: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="06", finanzas="07"),
    4: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="06", finanzas="07"),
    5: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="05", finanzas="07"),
    6: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="06", finanzas="07"),
    7: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="06", finanzas="07"),
    8: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="06", finanzas="08"),
    9: dict(producto="01", marketing="02", ventas="03", servicio="04", equipo="07", finanzas="08"),
}


def texto(path, p=None):
    args = ["pdftotext", "-layout"]
    if p:
        args += ["-f", str(p), "-l", str(p)]
    return subprocess.run(args + [path, "-"], capture_output=True, text=True).stdout


def secciones(path, n):
    paginas = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", path], capture_output=True, text=True).stdout).group(1))
    out = {}
    for p in range(1, paginas + 1):
        lineas = [l.strip() for l in texto(path, p).splitlines()]
        i = 0
        while i < len(lineas):
            m = re.match(r"^(0[1-9]) +(.+)$", lineas[i])
            if not m:
                i += 1
                continue
            s = {"num": m.group(1), "titulo": TITULOS.get((n, m.group(1)), m.group(2)), "pagina": p, "tapon": "", "salida": ""}
            i += 1
            campo = None
            while i < len(lineas):
                l = lineas[i]
                if re.match(r"^0[1-9] +", l):
                    break
                if l.startswith("EL TAPÓN"):
                    campo, l = "tapon", l[8:].strip()
                elif l.startswith("LA SALIDA"):
                    campo, l = "salida", l[9:].strip()
                elif not l:
                    if campo == "salida" and s["salida"]:
                        break
                    i += 1
                    continue
                elif campo is None:
                    i += 1
                    continue
                s[campo] = (s[campo] + " " + l).strip()
                i += 1
            out[s["num"]] = s
    return out


def regla(path):
    lineas = [l.strip() for l in texto(path, 2).splitlines() if l.strip()]
    for i, l in enumerate(lineas):
        if l.startswith("LA REGLA DE"):
            partes = []
            for x in lineas[i + 1:]:
                if x.startswith("Guía 30X"):
                    break
                partes.append(x)
            return " ".join(partes)
    return ""


def bajada(path):
    lineas = [l.strip() for l in texto(path, 1).splitlines() if l.strip()]
    i = next(k for k, l in enumerate(lineas) if l.startswith("El mapa") or l.startswith("Cómo "))
    partes = []
    for x in lineas[i:]:
        if x.startswith("Inspirado"):
            break
        partes.append(x)
    return " ".join(partes)


guias = []
for n in range(10):
    path = glob.glob(os.path.join(SRC, f"Etapa {n} - *.pdf"))[0]
    pdf = f"guias/etapa-{n}-{SLUG[n]}.pdf"
    shutil.copyfile(path, os.path.join(ROOT, pdf))
    portada = f"assets/img/portadas/etapa-{n}.png"
    subprocess.run(["pdftoppm", "-f", "1", "-l", "1", "-singlefile", "-scale-to-x", "720", "-scale-to-y", "-1", "-png", path,
                    os.path.join(ROOT, portada[:-4])], stderr=subprocess.DEVNULL, check=True)
    s = secciones(path, n)
    guias.append({"etapa": n, "titulo": TITULO[n], "para": PARA[n], "bajada": bajada(path), "regla": regla(path), "pdf": pdf,
                  "portada": portada, "areas": {k: s[v] for k, v in AREAS[n].items()}})

with open(os.path.join(ROOT, "assets/js/data.js"), "w") as f:
    f.write("// Generado por scripts/generar-datos.py desde los PDF. No editar a mano.\nwindow.GUIAS = ")
    json.dump(guias, f, ensure_ascii=False, indent=1)
    f.write(";\n")
for g in guias:
    print(g["etapa"], "|", g["bajada"], "\n   REGLA:", g["regla"])
    print("   ", {k: (v["num"], v["pagina"], v["titulo"].split(":")[0]) for k, v in g["areas"].items()})
