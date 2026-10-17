mi-polleria — Carta digital QR + pedidos por WhatsApp 🐓
Carta digital para pollerías: el cliente escanea el QR de su mesa, arma su
pedido viendo fotos y lo envía por WhatsApp a Caja o Cocina. Sin apps,
sin registro, sin backend, sin costo mensual.
> **v4 — Fusión Marketing**: mantiene 100% la lógica del MVP (cálculo del
> pedido, plantilla de WhatsApp, QR por mesa) y añade capa de marketing
> visual opcional + el fix del bug de pantalla vertical.
Estructura
```
mi-polleria/
├── index.html          ← única página (SPA simple)
├── estilo.css          ← diseño mobile-first + marketing
├── app.js              ← lógica: URL, menú, carrito, WhatsApp
├── menu.js             ← DATOS EJEMPLO (local=demo) + reglas de edición
├── clientes/
│   └── polleria-1.js   ← ejemplo de archivo de cliente real
├── fotos/              ← imágenes .webp 500x500 ≤ 120KB
├── validador.html      ← herramienta interna: valida los datos
├── empaquetador.html   ← herramienta interna: recorta fotos a webp 500x500
├── SPEC.md             ← especificación completa (v3 + addendum v4)
└── README.md           ← este archivo
```
Probar en local
Abre `index.html?local=demo&mesa=4` en el navegador (también funciona con
doble clic directo, sin servidor — `file://`).
`?local=demo&mesa=4` → demo completa con marketing
`?local=polleria-1&mesa=2` → ejemplo de cliente real
`?local=demo` (sin mesa) → selector de mesa 1-30
`?local=xyz` → pantalla amable "Local no válido"
Publicar gratis
Opción A — GitHub Pages
Crea una cuenta gratis en github.com y un
repositorio nuevo llamado `mi-polleria` (público).
Sube todos los archivos y carpetas de este proyecto
(botón "uploading an existing file", o con git:
`git init && git add . && git commit -m "v4" && git remote add origin <URL> && git push -u origin main`).
En el repositorio: Settings → Pages → Source: Deploy from a branch →
Branch: `main` / `(root)` → Save.
En 1-2 minutos tu web estará en:
`https://TU-USUARIO.github.io/mi-polleria/index.html?local=demo&mesa=4`
Opción B — Firebase Hosting
Instala las herramientas: `npm install -g firebase-tools` y entra con
`firebase login`.
En la carpeta del proyecto: `firebase init hosting`
public directory: `.` (punto, la carpeta actual)
single-page app: No
GitHub deploys: No (opcional)
Publica: `firebase deploy`
Tu web estará en `https://TU-PROYECTO.web.app/index.html?local=demo&mesa=4`
Generar los QR de las mesas
Con la URL pública lista, usa un generador gratuito
(qr-code-generator.com, o el que prefieras) y crea un QR por mesa
apuntando a la URL completa, por ejemplo:
```
https://TU-USUARIO.github.io/mi-polleria/index.html?local=demo&mesa=4
```
Cambia `mesa=N` en cada QR. Prueba cada QR con 2 celulares distintos
antes de imprimirlo.
Configurar tu pollería (para el dueño)
Copia `clientes/polleria-1.js` como base, cámbiale el nombre
(ej. `mi-polleria.js`) y edita: nombre, WhatsApp de caja, colores y menú.
`whatsappCaja`: número que recibe los pedidos (sin "+" ni espacios)
`whatsappCocina` (opcional): si existe, la pantalla de confirmación
muestra el botón "Cocina 👨‍🍳" para enviar el pedido directo a la parrilla
Coloca tus fotos en `fotos/` (usa `empaquetador.html`: sube cualquier
foto y descarga el `.webp` 500×500 listo).
Valida siempre con `validador.html` después de editar.
El QR de cada mesa usa `?local=mi-polleria&mesa=N`.
Qué hay de nuevo en v4 (Fusión Marketing)
Nuevo	Detalle
🧾👨‍🍳 Destino del pedido	En la confirmación el cliente elige Caja (por defecto) o Cocina si `whatsappCocina` está definido. La plantilla del mensaje no cambia: solo el número de destino.
🎨 Banda de marca	Eslogan con palabra resaltada, chips de prueba social. Solo si defines `LOCAL.marketing`.
⏰ Promo del día	Con precio "antes/ahora", cuenta regresiva a la hora que elijas y botón que agrega el ítem real del menú al carrito.
⭐ Testimonios verificados	Tarjetas con estrellas y zona de mesa.
🐓 Club de la casa	Sellos de fidelización visuales.
📍 Ubicación y horarios	Dirección, referencia, teléfono, horarios y zonas.
🔔 Toast + rebote	Feedback visual cada vez que se agrega un producto.
🖼️ Fotos listas	`fotos/` incluye 12 fotos .webp EJEMPLO generadas (500×500, ≤120KB). Reemplázalas con `empaquetador.html`.
🛠️ Fix vertical	Tarjeta de producto reconstruida con flex: foto + textos + botón se ven perfectos en vertical y horizontal en cualquier pantalla. El badge destacado es siempre absoluto (ya no se desplaza).

Qué hay de nuevo en v4.1 (Barra de Recompensa + auditoría)
Cambio	Detalle
🎁 Barra de Recompensa	En el carrito y la confirmación el cliente ve cuánto le falta para ganar un premio (`LOCAL.marketing.recompensa`). Al alcanzar la meta la barra se pone verde con "¡Felicidades!" y el WhatsApp lleva la línea `🎁 BONUS`. Es solo informativa: no inventa precios, caja decide. Borrar `recompensa` de `menu.js` la desactiva.
🐞 Fix zona marketing	La zona inferior (testimonios, club, ubicación) a veces no aparecía: el contenedor padre quedaba oculto. Corregido.
🔒 Cocina desactivada por defecto	`whatsappCocina` ahora viene vacío: el pedido va a Caja salvo que el local decida activar la comanda directa (llenar el número).
📱 Menú visible antes en celulares	La banda de marca y la promo se compactan en móviles: la carta asoma en la primera pantalla sin hacer scroll (mejora de 71px).
Todo lo nuevo es OPCIONAL: si tu archivo de cliente no tiene
`marketing` ni `whatsappCocina`, la web funciona exactamente igual que la
versión anterior del SPEC.
