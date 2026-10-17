// ============================================================
// mi-polleria — app.js (v4 — Fusión Marketing)
// SPA de pedidos en mesa con envío por WhatsApp a Caja o Cocina.
// Reglas: secciones 3, 5, 7, 8, 10, 11, 12, 16 del SPEC.md
// Carrito SOLO en memoria. Carga por inyección de script.
//
// NUEVO en v4 (aditivo, no rompe nada del SPEC):
//  - Destino del pedido: Caja (por defecto) o Cocina, usando
//    LOCAL.whatsappCaja y LOCAL.whatsappCocina (opcional).
//  - Marketing opcional via LOCAL.marketing (banda de marca,
//    promo del día con cuenta regresiva, testimonios, club,
//    ubicación/horarios, footer). Si no existe, nada se muestra.
//  - Toast de feedback al agregar + rebote del botón flotante.
//  - Monograma si el local no definió logoUrl.
//  - Animación de aparición (respeta prefers-reduced-motion).
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

  function mostrarAviso(texto, emoji) {
    // Pantalla de cortesía (sección 12): jamás pantalla en blanco
    $("aviso-texto").textContent = texto;
    $("aviso-emoji").textContent = emoji || "🐓";
    $("aviso-mesa-selector").hidden = true;
    mostrarPantalla("pantalla-aviso");
  }

  // ---------- Toast (nuevo v4) ----------

  var toastTimer = null;

  function mostrarToast(texto) {
    var t = $("toast");

    t.textContent = texto;
    t.classList.add("visible");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("visible");
    }, 2200);
  }

  // ---------- Estado global (en memoria; PROHIBIDO localStorage) ----------

  var LOCAL = null;
  var mesaActual = null;
  var carrito = [];
  var destinoWhatsApp = "caja"; // nuevo v4: "caja" | "cocina"

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
    $("aviso-emoji").textContent = "🪑";

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
      $("local-monograma").style.display = "none";

      // Si el logo falla al cargar: monograma, jamás imagen rota.
      $("local-logo").onerror = function () {
        $("local-logo").hidden = true;
        activarMonograma();
      };
    } else {
      activarMonograma();
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

  function activarMonograma() {
    var m = $("local-monograma");
    var inicial = (LOCAL && LOCAL.nombre ? LOCAL.nombre : "?")
      .trim()
      .charAt(0)
      .toUpperCase();

    m.textContent = inicial;
    m.style.display = "flex";
  }

  // ============================================================
  // MOTOR: MENÚ, CARRITO, CONFIRMACIÓN Y WHATSAPP
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
      var total = 0;
      var algunGrupoConPrecio = false;
      item.opciones.forEach(function (op) {
        var minGrupo = null;
        (op.choices || []).forEach(function (ch) {
          if (typeof ch.precio === "number") {
            if (minGrupo === null || ch.precio < minGrupo) {
              minGrupo = ch.precio;
            }
          }
        });
        if (minGrupo !== null) {
          total += minGrupo;
          algunGrupoConPrecio = true;
        }
      });
      if (algunGrupoConPrecio) {
        return aCentavos(total);
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
        feedbackAgregado(item.nombre, carrito[i].cantidad);

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
    feedbackAgregado(item.nombre, 1);
  }

  // Nuevo v4: feedback visual al agregar (toast + rebote).
  function feedbackAgregado(nombre, cantidad) {
    mostrarToast("✓ " + nombre + " agregado (" + cantidad + " en tu pedido)");

    var boton = $("boton-ver-pedido");
    boton.classList.remove("rebote");
    // Reinicia la animación
    void boton.offsetWidth;
    boton.classList.add("rebote");
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

    // Marketing opcional (v4): se rellena después del menú.
    renderMarketing();
    observarReveals();

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

    // Badge de prueba social (solo si el item define 'destacado').
    // FIX v4: el badge es position:absolute en CSS y JAMÁS participa
    // del flujo de la tarjeta (bug de pantalla vertical corregido).
    if (item.destacado) {
      var badge = document.createElement("span");
      badge.className = "badge-destacado";
      badge.textContent = item.destacado;
      tarjeta.appendChild(badge);
    }

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
    info.className = "info-producto";

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
    boton.setAttribute("aria-label", "Agregar " + item.nombre + " al pedido");

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
        var titulo = document.createElement("span");
        titulo.className = "opcion-tipo";
        titulo.textContent = op.tipo;
        panel.appendChild(titulo);

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

  // Barra de Recompensa (nuevo v4.1 — Efecto Gradiente de Meta):
  // es SOLO informativa (no inventa precios). Si el pedido supera
  // la meta, el cliente ve "¡Felicidades!" y el mensaje de WhatsApp
  // lleva la línea del bono; el cajero decide si la aplica, igual
  // que la confirmación humana del SPEC. Si el dueño borra el
  // objeto 'recompensa' de menu.js, la barra desaparece sola.
  function renderRecompensa(totalCentavos, prefijo) {
    var barra = $(prefijo + "barra-recompensa");
    var texto = $(prefijo + "texto-recompensa");
    var progreso = $(prefijo + "progreso-barra");

    // Sin recompensa configurada o pedido vacío: la barra se oculta.
    if (
      !LOCAL ||
      !LOCAL.marketing ||
      !LOCAL.marketing.recompensa ||
      totalCentavos === 0 ||
      !barra ||
      !texto ||
      !progreso
    ) {
      if (barra) {
        barra.hidden = true;
      }
      return;
    }

    var meta = LOCAL.marketing.recompensa.meta * 100;
    var premio = LOCAL.marketing.recompensa.premio || "";
    var pct = Math.min(100, Math.round((totalCentavos / meta) * 100));

    barra.hidden = false;

    if (totalCentavos >= meta) {
      texto.textContent = "🎉 ¡Felicidades! Has ganado: " + premio;
      progreso.style.width = "100%";
      progreso.classList.add("completa");
    } else {
      texto.textContent =
        "Te faltan " +
        formatearSoles(meta - totalCentavos) +
        " para llevarte: " +
        premio;
      progreso.style.width = pct + "%";
      progreso.classList.remove("completa");
    }
  }

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
      menos.setAttribute("aria-label", "Quitar uno: " + linea.nombre);

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
      mas.setAttribute("aria-label", "Agregar uno: " + linea.nombre);

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

    // Barra de Recompensa (v4.1): sin prefijo (IDs del carrito).
    renderRecompensa(totalCarritoCentavos(), "");
  }

  // ---------- Pantalla de confirmación (sección 7) ----------

  function renderConfirmacion() {
    var cont = $("resumen-confirmacion");

    cont.innerHTML = "";

    var mesa = document.createElement("span");

    mesa.className = "resumen-mesa";
    mesa.textContent = "📌 MESA " + mesaActual;
    cont.appendChild(mesa);

    carrito.forEach(function (linea) {
      var p = document.createElement("p");

      p.className = "resumen-linea";
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

    total.className = "resumen-linea res-total";
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

    // Nuevo v4: mostrar Cocina solo si el local definió su WhatsApp.
    var tieneCocina = !!(LOCAL && LOCAL.whatsappCocina);

    $("op-cocina").hidden = !tieneCocina;
    destinoWhatsApp = "caja";
    $("dest-caja").checked = true;

    $("aviso-destino").textContent = tieneCocina
      ? "Se abre WhatsApp con el pedido listo. Tú presionas Enviar."
      : "Se abre WhatsApp con el pedido listo para enviar a caja. Tú presionas Enviar.";

    mostrarPantalla("pantalla-confirmacion");

    // Barra de Recompensa (v4.1): IDs con prefijo conf-.
    renderRecompensa(totalCarritoCentavos(), "conf-");
  }

  // ---------- Mensaje de WhatsApp (sección 10) ----------
  // La plantilla es EXACTAMENTE la del SPEC; lo único que cambia
  // según el destino (caja/cocina) es el NÚMERO al que llega.

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

    // Nuevo v4.1: si el pedido superó la meta de la recompensa,
    // el mensaje lleva la línea del bono (informativa: el cajero
    // decide si la aplica, no inventa precios).
    if (LOCAL.marketing && LOCAL.marketing.recompensa) {
      var meta = LOCAL.marketing.recompensa.meta * 100;

      if (totalCarritoCentavos() >= meta) {
        lineas.push("🎁 *BONUS*: " + LOCAL.marketing.recompensa.premio + " (Promo > S/ " + LOCAL.marketing.recompensa.meta + ")");
      }
    }

    return lineas.join("\n");
  }

  function enviarWhatsApp() {
    var mensaje = generarMensajeWhatsApp();
    var codificado = encodeURIComponent(mensaje);

    // Nuevo v4: el destino lo elige el cliente en la confirmación.
    var numero = (destinoWhatsApp === "cocina" && LOCAL.whatsappCocina)
      ? LOCAL.whatsappCocina
      : LOCAL.whatsappCaja;

    // Móvil: wa.me | Escritorio: WhatsApp Web.
    var esMovil =
      /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent
      );

    var url;

    if (esMovil) {
      url =
        "https://wa.me/" +
        numero +
        "?text=" +
        codificado;
    } else {
      url =
        "https://web.whatsapp.com/send?phone=" +
        numero +
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

    // Nuevo v4: destino del pedido (caja / cocina).
    ["dest-caja", "dest-cocina"].forEach(function (id) {
      var radio = $(id);

      if (radio) {
        radio.addEventListener("change", function () {
          destinoWhatsApp = radio.value;

          $("aviso-destino").textContent = (radio.value === "cocina")
            ? "👨‍🍳 El pedido irá directo al chat de cocina (la caja lo ve al cobrar)."
            : "🧾 El pedido irá al chat de caja (cocina lo recibe por el mozo).";
        });
      }
    });
  });

  // ============================================================
  // MARKETING OPCIONAL (v4) — LOCAL.marketing
  // Todo es aditivo: si LOCAL.marketing no existe, no se muestra
  // nada y la web queda exactamente como el SPEC v3.
  // ============================================================

  function renderMarketing() {
    var mk = (LOCAL && LOCAL.marketing) || null;

    if (!mk) {
      return; // sin marketing: web idéntica al SPEC v3
    }

    // --- Banda de marca ---
    if (mk.eslogan) {
      $("bm-kicker-txt").textContent = mk.kicker || "Carta digital · Pide desde tu mesa";
      $("bm-titulo").innerHTML = "";
      // El eslogan admite resaltar una palabra entre asteriscos: "texto *brasa* texto"
      var partes = String(mk.eslogan).split("*");
      var h = $("bm-titulo");

      partes.forEach(function (parte, i) {
        if (i % 2 === 1) {
          var b = document.createElement("span");
          b.className = "brasa";
          b.textContent = parte;
          h.appendChild(b);
        } else {
          h.appendChild(document.createTextNode(parte));
        }
      });

      $("bm-sub").textContent = mk.subeslogan || "";

      var chips = $("bm-chips");
      chips.innerHTML = "";

      (mk.chips || []).forEach(function (chip) {
        var c = document.createElement("span");
        c.className = "bm-chip";
        c.textContent = chip;
        chips.appendChild(c);
      });

      $("banda-marca").hidden = false;
    }

    // --- Promo del día ---
    var promo = mk.promoDia;

    if (promo && promo.titulo) {
      $("pd-titulo").textContent = promo.titulo;
      $("pd-detalle").textContent = promo.detalle || "";
      $("pd-precio").textContent = formatearSoles(aCentavos(promo.precio));

      if (promo.precioAntes) {
        $("pd-antes").textContent = formatearSoles(aCentavos(promo.precioAntes));
        $("pd-antes").hidden = false;
      }

      iniciarCountdownPromo(promo.horaFin || 22);

      // Agregar promo: busca el ítem real del menú (mismo flujo del SPEC).
      var itemPromo = promo.itemId ? buscarItem(promo.itemId) : null;

      if (itemPromo) {
        $("pd-boton").hidden = false;
        $("pd-boton").onclick = function () {
          if (itemPromo.opciones && itemPromo.opciones.length > 0) {
            // Con opciones: bajar hasta la tarjeta y abrir su panel.
            agregarConPrimeraOpcion(itemPromo);
          } else {
            agregarAlCarrito(itemPromo, {}, aCentavos(itemPromo.precio));
          }
        };
      } else {
        $("pd-boton").hidden = true;
      }

      $("promo-dia").hidden = false;
    }

    // --- Testimonios ---
    if (mk.testimonios && mk.testimonios.length > 0) {
      var lista = $("mk-testi-lista");
      lista.innerHTML = "";

      mk.testimonios.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "testi-card";

        var estrellas = document.createElement("div");
        estrellas.className = "testi-estrellas";
        estrellas.textContent = "★★★★★".slice(0, t.estrellas || 5);
        estrellas.setAttribute("aria-label", (t.estrellas || 5) + " de 5 estrellas");
        card.appendChild(estrellas);

        var texto = document.createElement("p");
        texto.className = "testi-texto";
        texto.textContent = "“" + (t.texto || "") + "”";
        card.appendChild(texto);

        var pie = document.createElement("div");
        pie.className = "testi-pie";

        var avatar = document.createElement("span");
        avatar.className = "testi-avatar";
        avatar.textContent = (t.nombre || "?").charAt(0).toUpperCase();
        pie.appendChild(avatar);

        var quien = document.createElement("span");
        quien.innerHTML = "<span class='testi-nombre'></span><br><span class='testi-zona'></span>";
        quien.querySelector(".testi-nombre").textContent = t.nombre || "";
        quien.querySelector(".testi-zona").textContent = t.zona || "";
        pie.appendChild(quien);

        var verificado = document.createElement("span");
        verificado.className = "testi-verificado";
        verificado.textContent = "✓ Pedido verificado";
        pie.appendChild(verificado);

        card.appendChild(pie);
        lista.appendChild(card);
      });

      $("mk-testimonios").hidden = false;
    }

    // --- Club ---
    if (mk.club && mk.club.activo) {
      $("club-titulo").textContent = mk.club.titulo || "Club de la casa 🐔";
      $("club-texto").textContent = mk.club.texto || "";

      var sellos = $("club-sellos");
      sellos.innerHTML = "";

      var total = mk.club.sellos || 10;
      var llenos = Math.min(mk.club.sellosLlenos || 0, total);

      for (var s = 0; s < total; s++) {
        var sello = document.createElement("span");
        sello.className = "club-sello" + (s < llenos ? " on" : "");
        sello.textContent = "🐓";
        sellos.appendChild(sello);
      }

      $("mk-club").hidden = false;
    }

    // --- Ubicación y horarios ---
    if (mk.direccion || (mk.horarios && mk.horarios.length > 0)) {
      $("ubi-direccion").textContent = mk.direccion || "";
      $("ubi-referencia").textContent = mk.referencia || "";

      if (mk.telefono) {
        $("ubi-telefono").innerHTML = "";
        $("ubi-telefono").textContent = mk.telefono;
        $("ubi-telefono-fila").hidden = false;
      } else {
        $("ubi-telefono-fila").hidden = true;
      }

      var tabla = $("ubi-horarios");
      tabla.innerHTML = "";

      (mk.horarios || []).forEach(function (h) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");

        td1.textContent = h.dias || "";
        td2.textContent = h.hora || "";

        tr.appendChild(td1);
        tr.appendChild(td2);
        tabla.appendChild(tr);
      });

      var zonas = $("ubi-zonas");
      zonas.innerHTML = "";

      (mk.zonas || []).forEach(function (z) {
        var div = document.createElement("div");
        div.className = "ubi-zona";

        var n = document.createElement("span");
        n.textContent = z.nombre || "";

        var t = document.createElement("b");
        t.textContent = z.tiempo || "";

        div.appendChild(n);
        div.appendChild(t);
        zonas.appendChild(div);
      });

      $("mk-ubicacion").hidden = false;
    }

    // --- Footer ---
    $("mf-nombre").textContent = LOCAL.nombre || "";
    $("mf-eslogan").textContent = mk.footerEslogan || "";
    $("mf-contacto").textContent = mk.footerContacto || "";

    var pagos = $("mf-pagos");
    pagos.innerHTML = "";

    (mk.pagos || []).forEach(function (p) {
      var chip = document.createElement("span");
      chip.className = "mf-pago";
      chip.textContent = p;
      pagos.appendChild(chip);
    });

    $("mk-footer").hidden = false;

    // FIX v4.1 (bug crítico): los hijos de #zona-marketing se
    // desocultan arriba, pero el PADRE seguía oculto y, por la
    // regla [hidden] { display:none !important; } de estilo.css,
    // toda la zona inferior (testimonios, club, ubicación) era
    // invisible. Si al menos una sección tiene contenido, el
    // contenedor se muestra.
    if (
      !$("mk-testimonios").hidden ||
      !$("mk-club").hidden ||
      !$("mk-ubicacion").hidden
    ) {
      $("zona-marketing").hidden = false;
    }
  }

  function buscarItem(itemId) {
    var encontrado = null;

    LOCAL.menu.forEach(function (cat) {
      cat.items.forEach(function (item) {
        if (item.id === itemId) {
          encontrado = item;
        }
      });
    });

    return encontrado;
  }

  function agregarConPrimeraOpcion(item) {
    // Agrega el producto con la primera opción de cada grupo
    // (el panel completo siempre está disponible en su tarjeta).
    var seleccion = {};

    (item.opciones || []).forEach(function (op) {
      seleccion[op.tipo] = op.choices[0].nombre;
    });

    agregarAlCarrito(item, seleccion, precioDeSeleccion(item, seleccion));

    if (typeof mostrarToast === "function") {
      mostrarToast("✓ " + item.nombre + " agregado — elige opciones en la carta si quieres");
    }
  }

  // ---------- Cuenta regresiva de la promo ----------

  var countdownTimer = null;

  function iniciarCountdownPromo(horaFin) {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }

    function tick() {
      var ahora = new Date();
      var fin = new Date();

      fin.setHours(horaFin, 0, 0, 0);

      if (ahora >= fin) {
        fin.setDate(fin.getDate() + 1);
      }

      var diff = Math.max(0, Math.floor((fin - ahora) / 1000));
      var h = Math.floor(diff / 3600);
      var m = Math.floor((diff % 3600) / 60);
      var s = diff % 60;

      $("pd-h").textContent = (h < 10 ? "0" : "") + h;
      $("pd-m").textContent = (m < 10 ? "0" : "") + m;
      $("pd-s").textContent = (s < 10 ? "0" : "") + s;
    }

    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // ---------- Animación de aparición (respeta reduced-motion) ----------

  var revealObs = null;

  function observarReveals() {
    var elementos = document.querySelectorAll(".reveal");

    if (!elementos.length) {
      return;
    }

    var reducido = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducido || !("IntersectionObserver" in window)) {
      elementos.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    if (!revealObs) {
      revealObs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("visible");
            revealObs.unobserve(en.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -30px 0px" });
    }

    elementos.forEach(function (el) {
      revealObs.observe(el);
    });
  }

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
