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
  id: "demo",
  nombre: "Pollería Demo (EJEMPLO)",
  logoUrl: "",
  colores: {
    primario: "#C8102E",
    fondo: "#FFF8F0",
    texto: "#222222"
  },
  whatsappCaja: "51900000000",
  menu: [
    { categoria: "Pollos", items: [
      { id: "pollo4", nombre: "1/4 Pollo a la brasa", precio: 18, fotoUrl: "fotos/cuarto-pollo.webp", opciones: [{ tipo: "Pieza", requerido: true, choices: [{ nombre: "Pechuga", precio: 18 }, { nombre: "Pierna", precio: 18 }] }], incluye: ["Papas", "Ensalada"] },
      { id: "pollo8", nombre: "1/2 Pollo a la brasa", precio: 32, fotoUrl: "fotos/medio-pollo.webp", opciones: [{ tipo: "Pieza", requerido: true, choices: [{ nombre: "Pechuga", precio: 32 }, { nombre: "Pierna", precio: 32 }] }], incluye: ["Papas", "Ensalada"] },
      { id: "pollo-ent", nombre: "Pollo Entero", precio: 58, destacado: "EL MÁS PEDIDO", fotoUrl: "fotos/pollo-entero.webp", opciones: [], incluye: ["Papas x2", "Ensalada x2"] }
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
