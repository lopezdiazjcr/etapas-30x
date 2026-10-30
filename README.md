# Guías 30X por etapa

Landing con un mini diagnóstico: la persona responde hasta 3 preguntas y llega a la guía de su etapa, con la sección por la que debe empezar. Sitio estático en GitHub Pages: https://lopezdiazjcr.github.io/etapas-30x/

## Cómo decide

| Pregunta | Para qué sirve |
|---|---|
| Personas a tiempo completo | De 5 en adelante decide la etapa (4 a 9) |
| Cómo van las ventas | Solo si son menos de 5: idea → 0, gratis → 1, por rachas → 2, todos los meses → 3 |
| Qué te frena | No cambia la etapa: elige la sección de la guía (tapón, salida y página) y el llamado final |

Llamado final: Sales Machine si el freno son las ventas (desde la etapa 2), AI for Executives desde la etapa 6, y seguir a @crece30x en el resto.

## Qué tocar

- **`assets/js/config.js`**: webhook de leads, enlaces y texto de los programas.
- **`assets/js/ruta.js`**: preguntas y reglas.
- **`assets/js/data.js`**: no se edita. Sale de los PDF con `python3 -I scripts/generar-datos.py "<carpeta de los PDF>"`, junto con las portadas y las copias en `guias/`.

## Captura de leads

Con `webhookUrl` vacío la página no pide datos personales y lleva directo a la guía. Al ponerle una URL aparece la pantalla de nombre, correo, WhatsApp y autorización antes del resultado, y cada lead sale por POST como JSON con la etapa, las respuestas y las UTM.

## Antes de subir cambios

```bash
node tests/ruta.test.js
```

La prueba también falla si en la página aparece un nombre de etapa de Acquisition.com, "$100M" o "250.000".
