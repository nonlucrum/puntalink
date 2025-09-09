[README.txt](https://github.com/user-attachments/files/22225214/README.txt)
README — PuntaLink (análisis + pilares/“muertos” + reportes)
============================================================================

Aplicación Node/Express con interfaz web para:
- procesar datos CSV simples (frecuencias),
- calcular cargas de viento y disposición de braces,
- dimensionar bloques de “muertos” (pág. 3–5),
- estimar acero (longitudinal + estribos) y alambre de amarre,
- construir y descargar un reporte (PDF/DOCX) con todo (pág. 6).

----------------------------------------------------------------------------
REQUISITOS
----------------------------------------------------------------------------
- Node.js >= 18 (recomendado LTS 20) y npm
  Verifica:
    node -v
    npm -v

- (Opcional) Git para clonar.

Windows – si “npm/node no se reconoce”:
1) Instala Node LTS con Winget o instalador oficial:
    winget install OpenJS.NodeJS.LTS
2) Cierra y vuelve a abrir PowerShell/VS Code.
3) Verifica: node -v  y  npm -v
   Si sigue sin verse, agrega a PATH y reinicia la terminal:
    C:\Program Files\nodejs

----------------------------------------------------------------------------
INSTALACIÓN
----------------------------------------------------------------------------
1) Clonar (o descargar ZIP):
    git clone <tu-repo> puntalink
    cd puntalink

2) Instalar dependencias:
    npm install

3) (Opcional) crear .env (si existe .env.example):
    cp .env.example .env
   Variables disponibles:
    PORT=3000

----------------------------------------------------------------------------
EJECUTAR
----------------------------------------------------------------------------
Desarrollo (recarga automática):
    npm run dev
La app estará en:
    http://localhost:3000

Producción:
    npm start
o con puerto distinto:
    PORT=4000 npm start

----------------------------------------------------------------------------
ESTRUCTURA DEL PROYECTO (resumen)
----------------------------------------------------------------------------
.
├─ app.js                         # servidor Express
├─ routes/
│  ├─ pilares.js                  # /api/pilares/compute
│  ├─ reportes.js                 # /api/reportes/pilares/:format
│  └─ informes.js                 # /api/informes/export/:format  (CSV)
├─ controllers/
│  ├─ pilaresController.js        # orquesta servicios y valida req
│  ├─ reportePilaresController.js # genera PDF/DOCX (pág. 6)
│  └─ informeController.js        # export CSV a PDF/DOCX
├─ services/
│  └─ pilares.js                  # lógica de cálculo (pág. 1–5)
├─ public/
│  ├─ index.html                  # UI completa
│  ├─ script.js                   # lógica front (CSV + pilares + reportes)
│  └─ styles.css                  # estilos
└─ package.json

Nota: los nombres exactos pueden variar según tu repo; arriba está lo que usamos en esta implementación.

----------------------------------------------------------------------------
USO (UI)
----------------------------------------------------------------------------
1) CSV
   - Pega texto "Variable,Frecuencia" y pulsa "Procesar Datos".
   - Exporta desde “Resultados” a PDF/DOCX.

2) Pilares / Viento (pág. 1–2)
   - Elige Tipo de Pilar (corrido/aislado).
   - Completa V, FRz, Kzt, Fx, T, P.
   - En Brace: θ, NB (opcional), tipo, Y inserto.
   - (Opcional) Segmentación: sMax y/o longitudes por segmento.

3) Muertos (pág. 3–5)
   - Parámetros generales (µ, densidad, SF, “braces por grupo”).
   - Dimensiones L, A, h mínima.
   - Armado: recubrimiento, espac. longitudinal inicial, tipo de varilla (o φ),
     s de estribos y barras por nivel (sup/med/inf).
   - Alambre: La por nudo y Ø alambre.
   - Pulsa “Calcular pilar” → verás KPIs y tablas (segmentos, bloque, acero,
     alambre, totales).

4) Reporte (pág. 6)
   - En “6/7 — Generar Reporte” escribe Eje y Muro.
   - “Agregar Deadman” → precarga X y espaciamientos desde lo calculado
     (puedes editar).
   - “Agregar Brace” → precarga cantidad/ángulo/NB/Y desde lo calculado.
   - Descarga Reporte (PDF) o (DOCX).

----------------------------------------------------------------------------
ENDPOINTS (para test rápido)
----------------------------------------------------------------------------
1) Cálculo de pilares
   POST /api/pilares/compute
   Content-Type: application/json

   Body mínimo (pilar corrido):
   {
     "tipoPilar":"corrido",
     "sitio":{"V":32,"FRz":1,"Kzt":1,"Fx":1,"T":20,"P":1013.25},
     "geom":{"h":3,"L":5},
     "coeficientes":{"Cp_muro":0.8},
     "brace":{"theta":45,"NB":1.2,"yInserto":3,"tipo":"B04"},
     "diseno":{"sMax":4},
     "segmentos":[5],
     "muerto":{
       "mu":0.4,"densidad":2400,"sf":1.0,"grupoSize":2,
       "dim":{"L":1.0,"A":0.6,"hMin":0.5},
       "armado":{
         "rec":0.04,"espLongIni":0.25,
         "tipoLong":"#4","tipoEstr":"#3",
         "sEstribo_m":0.2,"nSup":2,"nMed":0,"nInf":2
       },
       "alambre":{"La":0.25,"d_mm":1.2}
     }
   }

2) Reporte (PDF/DOCX)
   POST /api/reportes/pilares/pdf
   POST /api/reportes/pilares/docx

   Body:
   {
     "reporte": {
       "deadman":[{"eje":"A","muro":"Muro 1","tipo":"rect","espLong":0.25,"espTransv":0.2,"X":1.6}],
       "braces":[{"eje":"A","muro":"Muro 1","tipo":"B04","cantidad":4,"X":1.6,"theta":45,"NB":1.2,"Y":3}]
     },
     "calculos": { ...respuesta de /api/pilares/compute... }
   }

----------------------------------------------------------------------------
DATOS DE EJEMPLO RÁPIDOS
----------------------------------------------------------------------------
seed.csv
Variable,Frecuencia
48,1
49,2
50,3
51,4
52,5

----------------------------------------------------------------------------
SCRIPTS DISPONIBLES
----------------------------------------------------------------------------
En package.json:
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }

----------------------------------------------------------------------------
SOLUCIÓN DE PROBLEMAS
----------------------------------------------------------------------------
- “app crashed – waiting for file changes”:
  Revisa la consola: suele ser un error de sintaxis en algún .js.
  Corrige y nodemon se reinicia solo.

- Puerto en uso:
    PORT=4000 npm start

- PDF/DOCX no descargan:
    npm i pdfkit docx
  Revisa que app.js tenga montadas las rutas reportes e informes.

- Windows: “npm/node no se reconoce”:
  Reinstala Node LTS y asegúrate de que
    C:\Program Files\nodejs
  esté en PATH. Cierra y reabre la terminal.

----------------------------------------------------------------------------
ESTADO / ROADMAP
----------------------------------------------------------------------------
- Pág. 1–6 implementadas (incluye alambre y reporte).
- Deadman triangular y aislado: placeholders en UI; cálculo específico pendiente.

----------------------------------------------------------------------------
LICENCIA
----------------------------------------------------------------------------
Uso interno/educativo (ajústalo según tus necesidades).
