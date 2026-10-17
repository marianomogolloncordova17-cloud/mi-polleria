// ============================================================
// clientes/polleria-1.js — EJEMPLO de archivo de cliente real
// (sección 4 del SPEC). Un archivo por negocio.
// El dueño edita SOLO precios, nombres y agrega/borra líneas
// siguiendo las REGLAS DE ORO. Cambios estructurales
// (opciones, categorías, fotos nuevas) los hace el proveedor.
// ============================================================

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

var LOCAL = {
  id: "polleria-1", // igual al archivo y al ?local=
  nombre: "Pollería El Piloto", // EJEMPLO — reemplazar
  logoUrl: "fotos/logo.webp", // opcional
  colores: {
    primario: "#C8102E", // EJEMPLO
    fondo: "#FFF8F0", // EJEMPLO
    texto: "#222222" // EJEMPLO
  },
  whatsappCaja: "51987654321", // EJEMPLO — sin "+" ni espacios
  whatsappCocina: "51987654322", // EJEMPLO — OPCIONAL: borra esta línea si solo quieres caja
  marketing: { // EJEMPLO — OPCIONAL: borra todo el bloque marketing y la web queda simple
    kicker: "Carta digital · Pide desde tu mesa",
    eslogan: "El pollo *a la brasa* de la esquina",
    subeslogan: "Arma tu pedido con fotos y envíalo por WhatsApp a caja. El mozo confirma mirando tu mesa.",
    chips: ["⭐ 4.8 (800 reseñas)", "🔥 Brasa de leña"],
    promoDia: { titulo: "Promo del Día", detalle: "Pollo Entero + Papas x2 + Ensalada x2", precio: 52, precioAntes: 58, itemId: "pollo-ent", horaFin: 22 },
    testimonios: [
      { nombre: "Familia Quispe", zona: "Mesa 4 — vecinos", texto: "Pedimos desde la mesa sin esperar al mozo, rapidísimo.", estrellas: 5 }
    ],
    direccion: "Av. Ejemplo 456, Lima",
    referencia: "Frente al parque.",
    telefono: "(01) 000-0000",
    horarios: [
      { dias: "Lunes — Domingo", hora: "12:00 — 22:00" }
    ],
    footerEslogan: "Tu pollería de confianza desde 2010.",
    footerContacto: "Av. Ejemplo 456 · (01) 000-0000",
    pagos: ["EFECTIVO", "YAPE"]
  },
  menu: [
    { categoria: "Pollos", items: [
      { id: "pollo4", nombre: "1/4 Pollo a la brasa", precio: 18, fotoUrl: "fotos/cuarto-pollo.webp", opciones: [ { tipo: "Pieza", requerido: true, choices: [ { nombre: "Pechuga", precio: 18 }, { nombre: "Pierna", precio: 18 } ] } ], incluye: ["Papas", "Ensalada"] },
      { id: "pollo8", nombre: "1/2 Pollo a la brasa", precio: 32, fotoUrl: "fotos/medio-pollo.webp", opciones: [ { tipo: "Pieza", requerido: true, choices: [ { nombre: "Pechuga", precio: 32 }, { nombre: "Pierna", precio: 32 } ] } ], incluye: ["Papas", "Ensalada"] },
      { id: "pollo-ent", nombre: "Pollo Entero", precio: 58, fotoUrl: "fotos/pollo-entero.webp", opciones: [], incluye: ["Papas x2", "Ensalada x2"] }
    ] },
    { categoria: "Cremas", items: [
      { id: "crema-aji", nombre: "Ají de la casa", precio: 2, fotoUrl: "fotos/cremas.webp" },
      { id: "crema-mayo", nombre: "Mayonesa", precio: 2, fotoUrl: "" },
      { id: "crema-ocopa", nombre: "Ocopa", precio: 2.5, fotoUrl: "" }
    ] },
    { categoria: "Bebidas", items: [
      { id: "chicha-j", nombre: "Chicha morada jarra", precio: 12, fotoUrl: "fotos/chicha.webp" },
      { id: "inka-15", nombre: "Inca Kola 1.5L", precio: 10, fotoUrl: "" }
    ] },
    { categoria: "Adicionales", items: [
      { id: "aguadito", nombre: "Aguadito de pollo", precio: 10, fotoUrl: "fotos/aguadito.webp" },
      { id: "teque", nombre: "Tequeños de pollo (6u)", precio: 14, fotoUrl: "" }
    ] }
  ]
};
