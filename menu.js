// ===== REGLAS DE ORO PARA EDITAR ESTE ARCHIVO =====
//
// 1. Para agregar un producto: copia una línea de producto que ya exista,
//    pégala y cambia los valores. NUNCA la escribas de memoria.
//
// 2. NUNCA borres llaves, corchetes, dos puntos, comas ni comillas.
//
// 3. Los precios van en números, sin "S/" (ejemplo: 18).
//
// 4. Después de editar, abre validador.html y espera el mensaje OK.
//
// 5. Si la web se ve rara o en blanco, deshaz tu último cambio y
//    avisa al proveedor.
//
// ===================================================
//
// NUEVO v4 — Dos campos OPCIONALES que puedes borrar sin romper nada:
//   whatsappCocina: WhatsApp de cocina (aparece el botón "Cocina"
//                   en la confirmación). Si lo borras, solo va a caja.
//   marketing:      textos de la banda de marca, promo del día con
//                   cuenta regresiva, testimonios, club, ubicación y
//                   pie de página. Si lo borras, la web queda simple
//                   como antes (solo carta).

var LOCAL = {
  id: "demo",
  nombre: "Pollería Demo (EJEMPLO)",
  logoUrl: "fotos/logo.webp",
  colores: {
    primario: "#C8102E",
    fondo: "#FFF8F0",
    texto: "#222222"
  },
  whatsappCaja: "51900000000",
  whatsappCocina: "", // Opcional: llenar solo si el local opera con comanda directa a cocina.
  marketing: {
    kicker: "Carta digital · Pide desde tu mesa",
    eslogan: "El pollo *a la brasa* que reúne a la familia",
    subeslogan: "Brasa de leña, receta de la casa y delivery del mozo a tu mesa. Arma tu pedido abajo con fotos y envíalo por WhatsApp.",
    chips: ["⭐ 4.9 (2,300 reseñas)", "🔥 Brasa de leña", "🐓 Marinado 12 h"],
    promoDia: { titulo: "Promo del Día", detalle: "Pollo Entero + Papas XL + Inca Kola 1.5L", precio: 45, precioAntes: 56, itemId: "promo-dia", horaFin: 22 },
    // Barra de Recompensa (nuevo v4.1): si el pedido alcanza la
    // 'meta' (en soles), el cliente ve "¡Felicidades!" y el pedido
    // por WhatsApp lleva la línea del bono (caja decide si lo
    // cobra). BORRA esta línea para desactivar la barra entera.
    recompensa: { meta: 50, premio: "Porción de papas familiares gratis" },
    testimonios: [
      { nombre: "Rosa Mendoza", zona: "Mesa 6 — clienta frecuente", texto: "El crocante de la piel es de otro nivel. Pido todos los domingos para la familia y nunca falla.", estrellas: 5 },
      { nombre: "Carlos Ticona", zona: "Mesa 2 — reunionero", texto: "El Banquete del Patrón salvó el cumpleaños de mi mamá. 10 personas comieron sobrado.", estrellas: 5 },
      { nombre: "Lucía Paredes", zona: "Mesa 9 — vecina", texto: "La chicha morada sabe a la de mi abuela, en serio. Y las papas vienen generosas.", estrellas: 5 }
    ],
    club: { activo: true, titulo: "Club del Patrón 🐔", texto: "Por cada 10 pollos, el 11° es gratis. Tu nombre y tu hambre valen — pregúntale a caja por tu tarjeta.", sellos: 10, sellosLlenos: 7 },
    direccion: "Av. Los Pollos 123, Surquillo — Lima",
    referencia: "A 1 cuadra del Parque Central, al costado del banco.",
    telefono: "(01) 555-1234 · WhatsApp 987 654 321",
    horarios: [
      { dias: "Lunes — Jueves", hora: "12:00 — 22:00" },
      { dias: "Viernes — Domingo", hora: "12:00 — 23:00" },
      { dias: "Feriados", hora: "¡Abrimos! 🔥" }
    ],
    zonas: [
      { nombre: "Local (Comer aquí)", tiempo: "15–25 min" },
      { nombre: "Recojo en caja", tiempo: "10–15 min" }
    ],
    footerEslogan: "Desde 2009 haciendo el mejor pollo a la brasa de Lima.",
    footerContacto: "Av. Los Pollos 123, Surquillo · (01) 555-1234",
    pagos: ["YAPE", "PLIN", "EFECTIVO", "TARJETAS"]
  },
  menu: [
    { categoria: "Listo en minutos", items: [
      { id: "combo-exp4", nombre: "Combo Exprés 1/4", precio: 24, destacado: "SALE RÁPIDO", fotoUrl: "fotos/combo-exp4.webp", opciones: [], incluye: ["1/4 Pollo", "Papas fritas", "Gaseosa personal"] },
      { id: "combo-exp8", nombre: "Combo Exprés 1/2", precio: 42, fotoUrl: "fotos/combo-exp8.webp", opciones: [], incluye: ["1/2 Pollo", "Papas XL", "Jarra mediana"] },
      { id: "promo-dia", nombre: "Promo del Día", precio: 45, destacado: "−20% HOY", fotoUrl: "fotos/pollo-entero.webp", opciones: [], incluye: ["Pollo entero", "Papas XL", "Inca Kola 1.5L"] },
      { id: "combo-exp-fam", nombre: "Combo Exprés Familiar", precio: 68, destacado: "MÁS VENDIDO", fotoUrl: "fotos/combo-exp-fam.webp", opciones: [], incluye: ["Pollo entero", "Papas x2", "Gaseosa 2L"] }
    ] },
    { categoria: "Pollos", items: [
      { id: "banquete-patron", nombre: "Banquete del Patrón", precio: 140, destacado: "PARA 8-10 PERSONAS", fotoUrl: "fotos/banquete.webp", opciones: [ { tipo: "Bebidas", requerido: true, choices: [ { nombre: "2 Inca Kola 2L heladas" }, { nombre: "2 Jarras chicha morada" }, { nombre: "1 Inca 2L + 1 Jarra" } ] }, { tipo: "Cremas", requerido: true, choices: [ { nombre: "Ají + Mayonesa" }, { nombre: "Ocopa + Ají" }, { nombre: "Las 4 cremas de la casa" } ] } ], incluye: ["2 Pollos enteros", "Papas XL", "Chaufa familiar"] },
      { id: "pollo4", nombre: "1/4 Pollo a la brasa", precio: 18, fotoUrl: "fotos/cuarto-pollo.webp", opciones: [ { tipo: "Pieza", requerido: true, choices: [ { nombre: "Pechuga", precio: 18 }, { nombre: "Pierna", precio: 16 } ] }, { tipo: "Bebida", requerido: true, choices: [ { nombre: "Sin bebida", precio: 0 }, { nombre: "Vaso chicha helada", precio: 6 }, { nombre: "Inca Kola personal helada", precio: 5.5 }, { nombre: "Vaso chicha + Inca", precio: 11 } ] } ], incluye: ["Papas", "Ensalada"] },
      { id: "pollo8", nombre: "1/2 Pollo a la brasa", precio: 32, fotoUrl: "fotos/medio-pollo.webp", opciones: [ { tipo: "Pieza", requerido: true, choices: [ { nombre: "Pechuga", precio: 32 }, { nombre: "Pierna", precio: 30 } ] }, { tipo: "Bebida", requerido: true, choices: [ { nombre: "Sin bebida", precio: 0 }, { nombre: "Vaso chicha helada", precio: 6 }, { nombre: "Jarra chicha mediana", precio: 10 }, { nombre: "Jarra chicha grande", precio: 14 }, { nombre: "Inca 1.5L helada", precio: 10 } ] }, { tipo: "Extra", requerido: true, choices: [ { nombre: "Sin extra", precio: 0 }, { nombre: "Papas familiares", precio: 12 }, { nombre: "Ensalada extra", precio: 8 } ] } ], incluye: ["Papas", "Ensalada"] },
      { id: "pollo-ent", nombre: "Pollo Entero", precio: 58, destacado: "EL MÁS PEDIDO", fotoUrl: "fotos/pollo-entero.webp", opciones: [ { tipo: "Bebida", requerido: true, choices: [ { nombre: "Sin bebida", precio: 58 }, { nombre: "Jarra chicha grande", precio: 72 }, { nombre: "Inca 1.5L helada", precio: 68 } ] }, { tipo: "Extra", requerido: true, choices: [ { nombre: "Sin extra", precio: 0 }, { nombre: "Papas familiares", precio: 12 } ] } ], incluye: ["Papas x2", "Ensalada x2", "🎁 Escribe AJIEXTRA en la nota para 1 crema extra"] }
    ] },
    { categoria: "Cremas", items: [
      { id: "crema-aji", nombre: "Nuestro ají pollero clásico", precio: 2, fotoUrl: "fotos/cremas.webp" },
      { id: "crema-mayo", nombre: "Mayonesa casera", precio: 2, fotoUrl: "" },
      { id: "crema-ocopa", nombre: "Ocopa de la casa", precio: 2.5, fotoUrl: "" }
    ] },
    { categoria: "Bebidas", items: [
      { id: "chicha-j", nombre: "Chicha morada (Del día)", precio: 12, fotoUrl: "fotos/chicha.webp" },
      { id: "inka-15", nombre: "Inca Kola 1.5L (Helada)", precio: 10, fotoUrl: "fotos/inca.webp" }
    ] },
    { categoria: "Adicionales", items: [
      { id: "aguadito", nombre: "Aguadito servido caliente", precio: 10, fotoUrl: "fotos/aguadito.webp" },
      { id: "teque", nombre: "Tequeños crujientes (6u)", precio: 14, fotoUrl: "" }
    ] }
  ]
};
