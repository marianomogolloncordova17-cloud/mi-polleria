// ============================================================
// mi-polleria — app.js (COMPLETO: Orden 3a + Orden 3b)
// SPA de pedidos en mesa con envío por WhatsApp.
// Reglas: secciones 3, 5, 7, 8, 10, 11, 12, 16 del SPEC.md
// Carrito SOLO en memoria. Carga por inyección de script.
// ============================================================

(function () {
  "use strict";

  // ---------- Utilidades base ----------

  function $(id) {
    return document.getElementById(id);
  }

  function mostrarPantalla(nombre) {
    // Solo una pantalla visible a la vez (sección 7)
    var pantallas = [
      "pantalla-lista",
      "pantalla-carrito",
      "pantalla-confirmacion",
      "pantalla-aviso"
    ];

    pantallas.forEach(function (p) {
      $(p).hidden = (p !== nombre);
    });

    // El botón flotante solo se muestra en la pantalla de lista (sección 7)
    $("boton-ver-pedido").hidden = (nombre !== "pantalla-lista");
  }

  function mostrarAviso(texto) {
    // Pantalla de cortesía (sección 12): jamás pantalla en blanco
    $("aviso-texto").textContent = texto;
    $("aviso-mesa-selector").hidden = true;
    mostrarPantalla("pantalla-aviso");
  }

  // ---------- Estado global (en memoria; PROHIBIDO localStorage) ----------

  var LOCAL = null;
  var mesaActual = null;
  var carrito = [];

  // ---------- Lectura de la URL (sección 3) ----------

  function leerParametros() {
    var params = new URLSearchParams(window.location.search);

    return {
      local: params.get("local"),
      mesa: params.get("mesa")
    };
  }

  // ---------- Selector de mesa cuando falta (sección 3 y 12) ----------

  function mostrarSelectorMesa() {
    var cont = $("aviso-mesa-selector");

    cont.innerHTML = "";
    cont.hidden = false;

    $("aviso-texto").textContent =
      "Elige tu mesa para continuar:";

    var select = document.createElement("select");
    select.id = "selector-mesa";

    var opcionVacia = document.createElement("option");
    opcionVacia.value = "";
    opcionVacia.textContent = "— Elige tu mesa —";
    select.appendChild(opcionVacia);

    for (var i = 1; i <= 30; i++) {
      var op = document.createElement("option");

      op.value = String(i);
      op.textContent = "Mesa " + i;

      select.appendChild(op);
    }

    select.addEventListener("change", function () {
      if (select.value !== "") {
        mesaActual = parseInt(select.value, 10);

        $("mesa-numero").textContent = String(mesaActual);
        $("badge-mesa").hidden = false;

        renderMenu();
      }
    });

    cont.appendChild(select);
  }

  // ---------- Carga del archivo de datos (secciones 16.1, 16.2, 16.3) ----------
  // Inyección dinámica de <script>. PROHIBIDO fetch / XMLHttpRequest.

  function cargarDatos(localId, alCargarBien, alFallar) {
    var ruta = (localId === "demo")
      ? "menu.js"
      : "clientes/" + localId + ".js";

    var script = document.createElement("script");
    script.src = ruta;

    // Caso a): el archivo no se encuentra o no se puede cargar.
    // Sección 12: informar que el local no es válido.
    script.onerror = function () {
      alFallar(
        "Local no válido. Escanea el QR de tu mesa."
      );
    };

    // Caso b): el archivo se carga, pero LOCAL no es válido,
    // el menú está vacío o falta su estructura principal.
    script.onload = function () {
      if (
        typeof window.LOCAL === "undefined" ||
        !window.LOCAL ||
        !window.LOCAL.menu ||
        window.LOCAL.menu.length === 0
      ) {
        alFallar();
        return;
      }

      LOCAL = window.LOCAL;
      alCargarBien();
    };

    // Limpiar cualquier resto de una carga anterior (robustez 16.2)
    try {
      delete window.LOCAL;
    } catch (e) {
      window.LOCAL = undefined;
    }

    document.body.appendChild(script);
  }

  // ---------- Aplicar configuración del local (sección 4 y 11) ----------

  function aplicarConfiguracionLocal() {
    // Colores desde LOCAL.colores a las variables CSS.
    // Los colores llegan desde el archivo de datos del local.
    var raiz = document.documentElement.style;

    if (LOCAL.colores) {
      if (LOCAL.colores.primario) {
        raiz.setProperty(
          "--color-primario",
          LOCAL.colores.primario
        );
      }

      if (LOCAL.colores.fondo) {
        raiz.setProperty(
          "--color-fondo",
          LOCAL.colores.fondo
        );
      }

      if (LOCAL.colores.texto) {
        raiz.setProperty(
          "--color-texto",
          LOCAL.colores.texto
        );
      }
    }

    // Nombre y logo del local en el encabezado.
    $("local-nombre").textContent = LOCAL.nombre || "";

    if (LOCAL.logoUrl) {
      $("local-logo").src = LOCAL.logoUrl;
      $("local-logo").hidden = false;
    }

    // Etiqueta DEMO (sección 16.3).
    if (LOCAL.id === "demo") {
      $("etiqueta-demo").hidden = false;
    }

    // Indicador de mesa, si ya se conoce.
    if (mesaActual !== null) {
      $("mesa-numero").textContent = String(mesaActual);
      $("badge-mesa").hidden = false;
    }
  }

  // ============================================================
  // MOTOR: MENÚ, CARRITO, CONFIRMACIÓN Y WHATSAPP (Orden 3b)
  // Secciones 5, 7, 8 y 10 del SPEC.md
  // ============================================================

  // ---------- Lógica de precios (sección 8): TODO en centavos ----------

  function aCentavos(precio) {
    return Math.round(precio * 100);
  }

  function formatearSoles(centavos) {
    return "S/ " + (centavos / 100).toFixed(2);
  }

  // Precio más bajo de un producto con opciones,
  // para mostrar "desde S/ X.XX".
  function precioBaseItem(item) {
    if (item.opciones && item.opciones.length > 0) {
      var precios = [];

      item.opciones.forEach(function (op) {
        op.choices.forEach(function (ch) {
          if (typeof ch.precio === "number") {
            precios.push(aCentavos(ch.precio));
          }
        });
      });

      if (precios.length > 0) {
        return Math.min.apply(null, precios);
      }
    }

    return aCentavos(item.precio);
  }

  // Precio de una selección: procede de los datos.
  // Si varios grupos tienen precios definidos, se suman.
  function precioDeSeleccion(item, seleccion) {
    var precio = 0;
    var tienePrecio = false;

    (item.opciones || []).forEach(function (op) {
      var elegida = (
        seleccion &&
        seleccion[op.tipo] !== undefined
      )
        ? seleccion[op.tipo]
        : op.choices[0].nombre;

      (op.choices || []).forEach(function (ch) {
        if (
          ch.nombre === elegida &&
          typeof ch.precio === "number"
        ) {
          precio += aCentavos(ch.precio);
          tienePrecio = true;
        }
      });
    });

    if (!tienePrecio) {
      return aCentavos(item.precio);
    }

    return precio;
  }

  // ---------- Carrito en memoria (prohibido localStorage, sección 7) ----------

  function claveLinea(itemId, seleccion) {
    // Mismo producto + mismas opciones = una sola línea.
    var partes = [itemId];

    Object.keys(seleccion || {}).sort().forEach(function (k) {
      partes.push(k + "=" + seleccion[k]);
    });

    return partes.join("|");
  }

  function agregarAlCarrito(item, seleccion, precioCentavos) {
    var clave = claveLinea(item.id, seleccion);

    for (var i = 0; i < carrito.length; i++) {
      if (carrito[i].clave === clave) {
        carrito[i].cantidad++;

        renderCarrito();
        actualizarBotonFlotante();

        return;
      }
    }

    var etiquetaOpciones = Object.keys(seleccion || {})
      .map(function (k) {
        return seleccion[k];
      })
      .join(", ");

    carrito.push({
      clave: clave,
      itemId: item.id,
      nombre: item.nombre,
      opcionesLabel: etiquetaOpciones,
      incluye: item.incluye || null,
      precioCentavos: precioCentavos,
      cantidad: 1
    });

    renderCarrito();
    actualizarBotonFlotante();
  }

  function totalCarritoCentavos() {
    var total = 0;

    carrito.forEach(function (l) {
      total += l.precioCentavos * l.cantidad;
    });

    return total;
  }

  function cantidadCarrito() {
    var n = 0;

    carrito.forEach(function (l) {
      n += l.cantidad;
    });

    return n;
  }

  function actualizarBotonFlotante() {
    $("boton-ver-pedido").textContent =
      "Ver pedido (" +
      cantidadCarrito() +
      ") — " +
      formatearSoles(totalCarritoCentavos());
  }

  // ---------- Renderizado del menú (secciones 5 y 7) ----------

  function renderMenu() {
    var cont = $("lista-menu");

    cont.innerHTML = "";

    LOCAL.menu.forEach(function (categoria) {
      var h = document.createElement("h2");

      h.className = "titulo-pantalla";
      h.textContent = categoria.categoria;

      cont.appendChild(h);

      categoria.items.forEach(function (item) {
        cont.appendChild(crearTarjeta(item));
      });
    });

    mostrarPantalla("pantalla-lista");
    actualizarBotonFlotante();
  }

  function activarSinFoto(contFoto, nombre) {
    // Variante sin foto: jamás mostrar una imagen rota.
    contFoto.classList.add("sin-foto");
    contFoto.textContent = nombre.charAt(0).toUpperCase();
  }

  function crearTarjeta(item) {
    var tieneOpciones =
      item.opciones &&
      item.opciones.length > 0;

    var tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";

    // Foto opcional, carga diferida y texto alternativo.
    var contFoto = document.createElement("div");
    contFoto.className = "foto-producto";

    if (item.fotoUrl) {
      var img = document.createElement("img");

      img.src = item.fotoUrl;
      img.alt = item.nombre;
      img.loading = "lazy";
      img.width = 500;
      img.height = 500;

      img.onerror = function () {
        img.remove();
        activarSinFoto(contFoto, item.nombre);
      };

      contFoto.appendChild(img);
    } else {
      activarSinFoto(contFoto, item.nombre);
    }

    tarjeta.appendChild(contFoto);

    // Textos del producto.
    var info = document.createElement("div");
    var nombre = document.createElement("p");

    nombre.className = "nombre-producto";
    nombre.textContent = item.nombre;

    info.appendChild(nombre);

    if (item.incluye && item.incluye.length > 0) {
      var inc = document.createElement("p");

      inc.className = "incluye-producto";
      inc.textContent =
        "Incluye: " +
        item.incluye.join(", ");

      info.appendChild(inc);
    }

    var precio = document.createElement("p");
    precio.className = "precio-producto";

    precio.textContent = tieneOpciones
      ? "desde " + formatearSoles(precioBaseItem(item))
      : formatearSoles(aCentavos(item.precio));

    info.appendChild(precio);
    tarjeta.appendChild(info);

    // Botón para añadir productos.
    var boton = document.createElement("button");

    boton.type = "button";
    boton.className = "boton-mas";
    boton.textContent = "+";

    tarjeta.appendChild(boton);

    // Producto sin opciones: agregar directamente.
    if (!tieneOpciones) {
      boton.addEventListener("click", function () {
        agregarAlCarrito(
          item,
          {},
          aCentavos(item.precio)
        );
      });

      return tarjeta;
    }

    // Producto con opciones: mostrar panel de selección.
    boton.addEventListener("click", function () {
      var existente = tarjeta.querySelector(".opciones-inline");

      if (existente) {
        existente.remove();
        boton.textContent = "+";
        return;
      }

      var panel = document.createElement("div");
      panel.className = "opciones-inline";

      var seleccion = {};

      item.opciones.forEach(function (op, indiceOp) {
        var nombreUnico =
          "op-" +
          item.id +
          "-" +
          indiceOp +
          "-" +
          Date.now();

        op.choices.forEach(function (ch, indiceCh) {
          var wrap = document.createElement("span");
          wrap.className = "opcion";

          var radio = document.createElement("input");

          radio.type = "radio";
          radio.name = nombreUnico;
          radio.value = ch.nombre;
          radio.id =
            nombreUnico +
            "-" +
            indiceCh;

          // Primera opción seleccionada por defecto.
          if (indiceCh === 0) {
            radio.checked = true;
            seleccion[op.tipo] = ch.nombre;
          }

          var label = document.createElement("label");

          label.htmlFor = radio.id;
          label.textContent = ch.nombre;

          radio.addEventListener("change", function () {
            seleccion[op.tipo] = ch.nombre;

            botonAgregar.textContent =
              "Agregar — " +
              formatearSoles(
                precioDeSeleccion(item, seleccion)
              );
          });

          wrap.appendChild(radio);
          wrap.appendChild(label);

          panel.appendChild(wrap);
        });
      });

      var botonAgregar = document.createElement("button");

      botonAgregar.type = "button";
      botonAgregar.className = "boton-agregar";

      botonAgregar.textContent =
        "Agregar — " +
        formatearSoles(
          precioDeSeleccion(item, seleccion)
        );

      botonAgregar.addEventListener("click", function () {
        agregarAlCarrito(
          item,
          seleccion,
          precioDeSeleccion(item, seleccion)
        );

        panel.remove();
        boton.textContent = "+";
      });

      panel.appendChild(botonAgregar);
      tarjeta.appendChild(panel);

      boton.textContent = "×";
    });

    return tarjeta;
  }

  // ---------- Renderizado del carrito (sección 7) ----------

  function renderCarrito() {
    var cont = $("lineas-carrito");

    cont.innerHTML = "";

    if (carrito.length === 0) {
      cont.innerHTML =
        "<p>Tu pedido está vacío. Agrega productos desde el menú.</p>";
    }

    carrito.forEach(function (linea, indice) {
      var fila = document.createElement("div");
      fila.className = "linea-carrito";

      var nombre = document.createElement("span");

      nombre.className = "nombre-linea";
      nombre.textContent =
        linea.cantidad +
        "x " +
        linea.nombre;

      fila.appendChild(nombre);

      if (linea.opcionesLabel) {
        var ops = document.createElement("span");

        ops.className = "opciones-linea";
        ops.textContent =
          "(" +
          linea.opcionesLabel +
          ")";

        fila.appendChild(ops);
      }

      var controles = document.createElement("div");
      controles.className = "controles-cantidad";

      var menos = document.createElement("button");

      menos.type = "button";
      menos.className = "boton-cantidad";
      menos.textContent = "−";

      menos.addEventListener("click", function () {
        if (linea.cantidad > 1) {
          linea.cantidad--;
        } else {
          carrito.splice(indice, 1);
        }

        renderCarrito();
        actualizarBotonFlotante();
      });

      var cant = document.createElement("span");

      cant.className = "cantidad";
      cant.textContent = String(linea.cantidad);

      var mas = document.createElement("button");

      mas.type = "button";
      mas.className = "boton-cantidad";
      mas.textContent = "+";

      mas.addEventListener("click", function () {
        linea.cantidad++;

        renderCarrito();
        actualizarBotonFlotante();
      });

      controles.appendChild(menos);
      controles.appendChild(cant);
      controles.appendChild(mas);

      fila.appendChild(controles);

      var precioLinea = document.createElement("span");

      precioLinea.className = "precio-linea";
      precioLinea.textContent =
        formatearSoles(
          linea.precioCentavos *
          linea.cantidad
        );

      fila.appendChild(precioLinea);

      var quitar = document.createElement("button");

      quitar.type = "button";
      quitar.className = "boton-quitar";
      quitar.textContent = "quitar";

      quitar.addEventListener("click", function () {
        carrito.splice(indice, 1);

        renderCarrito();
        actualizarBotonFlotante();
      });

      fila.appendChild(quitar);
      cont.appendChild(fila);
    });

    $("total-carrito").textContent =
      "TOTAL: " +
      formatearSoles(totalCarritoCentavos());
  }

  // ---------- Pantalla de confirmación (sección 7) ----------

  function renderConfirmacion() {
    var cont = $("resumen-confirmacion");

    cont.innerHTML = "";

    var mesa = document.createElement("p");

    mesa.textContent = "MESA " + mesaActual;
    cont.appendChild(mesa);

    carrito.forEach(function (linea) {
      var p = document.createElement("p");

      p.textContent =
        linea.cantidad +
        "x " +
        linea.nombre +
        (linea.opcionesLabel
          ? " (" + linea.opcionesLabel + ")"
          : "") +
        " — " +
        formatearSoles(
          linea.precioCentavos *
          linea.cantidad
        );

      cont.appendChild(p);
    });

    var total = document.createElement("p");

    total.style.fontWeight = "800";
    total.textContent =
      "TOTAL: " +
      formatearSoles(totalCarritoCentavos());

    cont.appendChild(total);

    // Nota general opcional: máximo 80 caracteres.
    var nota = $("nota-pedido");

    nota.value = "";
    $("contador-nota").textContent = "0/80";

    nota.oninput = function () {
      $("contador-nota").textContent =
        nota.value.length + "/80";
    };

    mostrarPantalla("pantalla-confirmacion");
  }

  // ---------- Mensaje de WhatsApp (sección 10) ----------

  function generarMensajeWhatsApp() {
    var lineas = [];

    lineas.push(
      "🛒 *NUEVO PEDIDO — " +
      LOCAL.nombre +
      "*"
    );

    lineas.push(
      "📌 *MESA " +
      mesaActual +
      "*"
    );

    carrito.forEach(function (linea) {
      var texto =
        linea.cantidad +
        "x " +
        linea.nombre;

      if (linea.opcionesLabel) {
        texto +=
          " (" +
          linea.opcionesLabel +
          ")";
      }

      texto +=
        " — " +
        formatearSoles(
          linea.precioCentavos *
          linea.cantidad
        );

      if (linea.incluye) {
        texto +=
          " + " +
          linea.incluye.join(", ");
      }

      lineas.push(texto);
    });

    lineas.push(
      "💰 *TOTAL: " +
      formatearSoles(totalCarritoCentavos()) +
      "*"
    );

    var nota = $("nota-pedido").value.trim();

    if (nota !== "") {
      lineas.push("📝 Nota: " + nota);
    }

    return lineas.join("\n");
  }

  function enviarWhatsApp() {
    var mensaje = generarMensajeWhatsApp();
    var codificado = encodeURIComponent(mensaje);

    // Móvil: wa.me | Escritorio: WhatsApp Web.
    var esMovil =
      /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent
      );

    var url;

    if (esMovil) {
      url =
        "https://wa.me/" +
        LOCAL.whatsappCaja +
        "?text=" +
        codificado;
    } else {
      url =
        "https://web.whatsapp.com/send?phone=" +
        LOCAL.whatsappCaja +
        "&text=" +
        codificado;
    }

    // El cliente presiona Enviar manualmente.
    window.location.href = url;
  }

  // ---------- Conexión de botones (pantallas 7) ----------

  document.addEventListener("DOMContentLoaded", function () {
    $("boton-ver-pedido").addEventListener("click", function () {
      if (carrito.length > 0) {
        renderCarrito();
        mostrarPantalla("pantalla-carrito");
      }
    });

    $("boton-volver-lista").addEventListener("click", function () {
      mostrarPantalla("pantalla-lista");
    });

    $("boton-confirmar").addEventListener("click", function () {
      if (carrito.length > 0) {
        renderConfirmacion();
      }
    });

    $("boton-editar-pedido").addEventListener("click", function () {
      renderCarrito();
      mostrarPantalla("pantalla-carrito");
    });

    $("boton-enviar-whatsapp").addEventListener(
      "click",
      enviarWhatsApp
    );
  });

  // ---------- Arranque (Orden 3a) ----------

  function iniciar() {
    var params = leerParametros();

    // 1) Sin identificador del local: mostrar aviso correspondiente.
    if (!params.local) {
      mostrarAviso(
        "Local no válido. Escanea el QR de tu mesa."
      );
      return;
    }

    // 2) La mesa debe ser un entero entre 1 y 30.
    var mesaUrl = Number(params.mesa);

    if (
      params.mesa !== null &&
      Number.isInteger(mesaUrl) &&
      mesaUrl >= 1 &&
      mesaUrl <= 30
    ) {
      mesaActual = mesaUrl;
    }

    // 3) Cargar los datos y distinguir los tipos de fallo.
    cargarDatos(
      params.local,

      function alCargarBien() {
        // Si los datos están mal estructurados y el menú falla
        // durante el arranque, mostrar la pantalla de cortesía.
        try {
          aplicarConfiguracionLocal();

          if (mesaActual === null) {
            mostrarSelectorMesa();
          } else {
            renderMenu();
          }
        } catch (e) {
          mostrarAviso(
            "El menú no está disponible en este momento. Pide la carta al mozo."
          );
        }
      },

      function alFallar(mensaje) {
        // Si no se proporciona un mensaje específico, se considera
        // que el archivo existe, pero el menú no es válido.
        mostrarAviso(
          mensaje ||
          "El menú no está disponible en este momento. Pide la carta al mozo."
        );
      }
    );
  }

  document.addEventListener("DOMContentLoaded", iniciar);

})();