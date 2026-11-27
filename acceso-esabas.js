
/*
  RAIET DEMO PRO
  Acceso privado de administrador
  Primera versión: contraseña y bloqueo automático
*/

(function () {
  "use strict";

  // El acceso se valida en el proyecto DEMO mediante una lista de usuarios.
  const MINUTOS_INACTIVIDAD = 10;
  const TIEMPO_BLOQUEO = MINUTOS_INACTIVIDAD * 60 * 1000;
  const TIEMPO_SEGUNDO_PLANO = 5 * 60 * 1000;
  let desdeSegundoPlano = null;
  let nativoActivo = true;

  let temporizador = null;
  let inicioRealizado = false;
  let ultimaActividad = Date.now();
  let bloqueoEnCurso = false;
  const SERVIDOR_HUELLA = "raiet-demo-supabase-lhqyibxpstrterlckaax";
  const URL_VERSIONES = "https://api.github.com/repos/edisonenriquezt-byte/raiet-demo-v1/releases?per_page=100";
  const ID_FINAL = "com.esabas.raiet.demo";
  let actualizacionConsultada = false;
  let autenticacionEnCurso = false;
  const CLAVE_ACTIVIDAD_WEB = "raiet_demo_web_ultima_actividad";
  const VERSION_WEB = "1.11";
  function leerActividadWeb() {
    try { return Number(sessionStorage.getItem(CLAVE_ACTIVIDAD_WEB)) || 0; }
    catch (_) { return 0; }
  }
  function guardarActividadWeb() {
    if (puente()) return;
    try { sessionStorage.setItem(CLAVE_ACTIVIDAD_WEB, String(ultimaActividad)); }
    catch (_) {}
  }
  function borrarActividadWeb() {
    try { sessionStorage.removeItem(CLAVE_ACTIVIDAD_WEB); } catch (_) {}
  }

  // El navegador web no expone la huella de Android.
  const puente = () => window.RAIET_NATIVE && window.RAIET_NATIVE.enabled ? window.RAIET_NATIVE : null;
  const lectorHuella = () => puente() && puente().biometric;


  const raiz = document.documentElement;
  raiz.classList.add("raiet-bloqueado");

  const estilos = document.createElement("style");

  estilos.textContent = `
    html.raiet-bloqueado body > :not(#raiet-acceso) {
      visibility: hidden !important;
    }

    html.raiet-en-segundo-plano body > * {
      visibility: hidden !important;
    }
    html.raiet-en-segundo-plano, html.raiet-en-segundo-plano body {
      background: #080a10 !important;
    }

    #raiet-acceso {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #080a10;
      color: #f8fafc;
      font-family: Arial, sans-serif;
    }

    html:not(.raiet-bloqueado) #raiet-acceso {
      display: none;
    }

    #raiet-acceso .acceso-tarjeta {
      width: 100%;
      max-width: 390px;
      padding: 28px;
      border-radius: 18px;
      background: #111520;
      border: 1px solid #263247;
      box-sizing: border-box;
    }

    #raiet-acceso h1 {
      color: #ffffff;
      font-size: 25px;
      margin: 0 0 8px;
    }

    #raiet-acceso p {
      color: #a7b3c5;
      font-size: 14px;
      line-height: 1.5;
    }

    #raiet-acceso label {
      display: block;
      margin: 16px 0 6px;
      font-size: 13px;
      font-weight: bold;
    }

    #raiet-acceso input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px;
      border-radius: 9px;
      border: 1px solid #37465d;
      background: #080a10;
      color: white;
      font-size: 16px;
    }

    #raiet-acceso button {
      display: block;
      width: 100%;
      margin-top: 20px;
      padding: 14px;
      border: 0;
      border-radius: 9px;
      color: white;
      background: #2563eb;
      font-weight: bold;
      cursor: pointer;
    }

    #raiet-acceso button:disabled {
      opacity: 0.6;
    }

    #raiet-acceso .mensaje {
      min-height: 20px;
      margin-top: 14px;
      color: #fca5a5;
      font-size: 13px;
    }

    #raiet-acceso [hidden] { display: none !important; }

    #raiet-huella {
      background: #0f766e !important;
      margin-top: 12px !important;
    }

    #raiet-olvidar-huella {
      background: transparent !important;
      color: #a7b3c5 !important;
      border: 1px solid #37465d !important;
      font-size: 12px !important;
      margin-top: 10px !important;
    }

    #raiet-revisar-version {
      position: fixed;
      top: 49px;
      right: 12px;
      z-index: 99998;
      background: #1e40af;
      border: 0;
      border-radius: 8px;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 8px 10px;
      cursor: pointer;
    }

    #raiet-aviso-actualizacion {
      position: fixed;
      left: 14px;
      right: 14px;
      bottom: 90px;
      z-index: 99995;
      padding: 14px;
      background: #102a43;
      border: 1px solid #38bdf8;
      border-radius: 12px;
      color: white;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font: 13px Arial, sans-serif;
    }
    #raiet-aviso-actualizacion button {
      border: 0;
      background: #2563eb;
      border-radius: 6px;
      color: white;
      padding: 8px 10px;
      cursor: pointer;
    }
    html.raiet-bloqueado #raiet-revisar-version,
    html.raiet-bloqueado #raiet-aviso-actualizacion { display: none !important; }

    #raiet-version-web { position: fixed; top: 12px; left: 12px; z-index: 99997; pointer-events:none; color:#94a3b8; background:#101827; padding:5px 8px; border:1px solid #334155; border-radius:6px; font:11px Arial,sans-serif; }
    html.raiet-bloqueado #raiet-version-web { display:none; }
    #raiet-cerrar-sesion {
      position: fixed;
      right: 12px;
      top: 12px;
      z-index: 99999;
      padding: 8px 12px;
      background: #991b1b;
      color: white;
      border: 0;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }

    html.raiet-bloqueado #raiet-cerrar-sesion {
      display: none;
    }
  `;

  document.head.appendChild(estilos);

  document.addEventListener("DOMContentLoaded", async function () {
    const cliente = window.db;

    const acceso = document.createElement("div");
    acceso.id = "raiet-acceso";

    acceso.innerHTML = `
      <div class="acceso-tarjeta">
        <img src="./icon-192.png" alt="RAIET" style="display:block;width:76px;height:76px;border-radius:18px;margin:0 auto 12px;object-fit:contain"><h1>RAIET DEMO PRO</h1>
        <p>Sistema privado de gestión profesional</p>

        <form id="raiet-formulario-acceso">
          <label for="raiet-email">Correo electrónico</label>
          <input
            type="email"
            id="raiet-email"
            autocomplete="username"
            required
          >

          <label for="raiet-clave">Contraseña</label>
          <input
            type="password"
            id="raiet-clave"
            autocomplete="current-password"
            required
          >

          <button type="submit" id="raiet-entrar">
            Iniciar sesión
          </button>
        </form>

        <button type="button" id="raiet-huella" hidden>
          🔐 Entrar con huella
        </button>
        <button type="button" id="raiet-olvidar-huella" hidden>
          Olvidar huella de este dispositivo
        </button>

        <p class="mensaje" id="raiet-mensaje" role="status"></p>
        <p id="raiet-activar-web" style="font-size:12px"><a href="./activar.html" style="color:#93c5fd">Activar cuenta o recuperar contraseña</a></p>
        <p id="raiet-version-acceso" style="text-align:center;font-size:11px;color:#94a3b8;margin-top:14px">WEB · v1.10</p>
      </div>
    `;

    document.body.appendChild(acceso);
    // La activación por correo pertenece a la web HTTPS, no a la WebView Android.
    if (puente()) {
      const enlaceActivacion = acceso.querySelector("#raiet-activar-web");
      if (enlaceActivacion) enlaceActivacion.hidden = true;
    }

    const salir = document.createElement("button");
    salir.id = "raiet-cerrar-sesion";
    salir.type = "button";
    salir.textContent = "Cerrar sesión";

    document.body.appendChild(salir);
    // Mostrar siempre la versión: navegador, pantalla de acceso y APK Android.
    const etiquetaVersion = document.createElement("span");
    etiquetaVersion.id = "raiet-version-web";
    etiquetaVersion.title = "Versión de RAIET DEMO PRO";
    document.body.appendChild(etiquetaVersion);
    const versionAcceso = acceso.querySelector("#raiet-version-acceso");
    function escribirVersion(texto) {
      etiquetaVersion.textContent = texto;
      if (versionAcceso) versionAcceso.textContent = texto;
    }
    const nativoVersion = puente();
    if (nativoVersion && nativoVersion.app) {
      escribirVersion("APP · consultando versión");
      void nativoVersion.app.getInfo().then(info => {
        const esDefinitiva = info.id === ID_FINAL;
        escribirVersion("APP · v" + String(info.version || "?") + (esDefinitiva ? "" : " · PRUEBA"));
      }).catch(() => escribirVersion("APP · versión no disponible"));
    } else {
      escribirVersion("WEB · v" + VERSION_WEB);
    }

    const revisarBoton = document.createElement("button");
    revisarBoton.id = "raiet-revisar-version";
    revisarBoton.type = "button";
    revisarBoton.textContent = "↻ Comprobar actualización";
    revisarBoton.hidden = !puente();
    document.body.appendChild(revisarBoton);

    const formulario = document.getElementById(
      "raiet-formulario-acceso"
    );

    const mensaje = document.getElementById("raiet-mensaje");
    const botonEntrar = document.getElementById("raiet-entrar");
    const botonHuella = document.getElementById("raiet-huella");
    const botonOlvidarHuella = document.getElementById("raiet-olvidar-huella");

    async function comprobarHuellaGuardada() {
      const lector = lectorHuella();
      botonHuella.hidden = true;
      botonOlvidarHuella.hidden = true;
      if (!lector) return;
      try {
        const [estado, guardada] = await Promise.all([
          lector.isAvailable({ useFallback: false }),
          lector.isCredentialsSaved({ server: SERVIDOR_HUELLA })
        ]);
        const disponible = !!(estado.isAvailable && estado.strongBiometryIsAvailable);
        botonHuella.hidden = !(disponible && guardada.isSaved);
        botonOlvidarHuella.hidden = !guardada.isSaved;
      } catch (_) {
        // Si falla el sensor, nunca bloqueamos el acceso con contraseña.
      }
    }

    async function ofrecerHuella(email, password) {
      const lector = lectorHuella();
      if (!lector) return;
      try {
        const estado = await lector.isAvailable({ useFallback: false });
        if (!estado.isAvailable || !estado.strongBiometryIsAvailable) return;
        const guardada = await lector.isCredentialsSaved({ server: SERVIDOR_HUELLA });
        if (!guardada.isSaved &&
            window.confirm("¿Activar el acceso con huella para no volver a escribir correo y contraseña en este teléfono? Android protegerá tus credenciales en su almacén seguro.")) {
          await lector.setCredentials({
            server: SERVIDOR_HUELLA,
            username: email,
            password: password,
            accessControl: 1,  // BIOMETRY_CURRENT_SET: exige huella y se invalida al modificar huellas
            authValidityDuration: 0,
            title: "Activar huella RAIET DEMO PRO",
            negativeButtonText: "Cancelar"
          });
        }
      } catch (error) {
        // El usuario puede cancelar la activación sin perder el acceso normal.
      }
      await comprobarHuellaGuardada();
    }

    async function autenticarYVerificar(email, password) {
      const resultado = await cliente.auth.signInWithPassword({ email, password });
      if (resultado.error) {
        throw new Error("Credenciales incorrectas.");
      }
      if (!resultado.data.user || !(await window.RAIET_DEMO_AUTORIZADO())) {
        await cliente.auth.signOut({ scope: "local" });
        throw new Error("Usuario no autorizado.");
      }
    }

    async function abrirEnNavegador(url) {
      const nativo = puente();
      if (nativo && nativo.browser) {
        await nativo.browser.open({ url });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }

    async function revisarActualizaciones(manual) {
      const nativo = puente();
      if (!nativo || !nativo.app || (!manual && actualizacionConsultada)) return;
      actualizacionConsultada = true;
      try {
        const info = await nativo.app.getInfo();
        const esDefinitiva = info.id === ID_FINAL;
        if (!esDefinitiva && info.id !== "com.esabas.raiet.demo.beta") {
          if (manual) window.alert("Esta instalación no corresponde a RAIET DEMO PRO.");
          return;
        }
        // GitHub /releases/latest no incluye versiones preliminares y devuelve 404
        // cuando todavía no existe una firma definitiva.
        const res = await fetch(URL_VERSIONES, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo consultar la lista de versiones.");
        const datos = await res.json();
        if (!Array.isArray(datos)) throw new Error("Formato de versiones inválido.");
        const versiones = datos.filter(r => r && !r.draft && !r.prerelease)
          .map(r => {
            const etiqueta = /^raiet-demo-android-(\d+)$/.exec(String(r.tag_name || ""));
            const archivo = Array.isArray(r.assets) ? r.assets.find(a => a.name === "RAIET-DEMO.apk") : null;
            const url = archivo && String(archivo.browser_download_url || "");
            const autorizada = /^https:\/\/github\.com\/edisonenriquezt-byte\/raiet-demo-v1\/releases\/download\/raiet-demo-android-\d+\/RAIET-DEMO\.apk$/.test(url);
            return etiqueta && autorizada ? { numero: Number(etiqueta[1]), url } : null;
          }).filter(Boolean).sort((a, b) => b.numero - a.numero);
        const nueva = versiones[0];
        if (!nueva) {
          if (manual) window.alert(esDefinitiva
            ? "Todavía no hay una publicación definitiva disponible."
            : "Esta es una edición de prueba. La actualización se habilitará al publicar la versión con firma permanente.");
          return;
        }
        const instalada = Number(info.build);
        if (esDefinitiva && (!Number.isFinite(instalada) || nueva.numero <= instalada)) {
          if (manual) window.alert("RAIET DEMO PRO está actualizado: APP v" + String(info.version || "?") + ".");
          return;
        }

        let aviso = document.getElementById("raiet-aviso-actualizacion");
        if (!aviso) {
          aviso = document.createElement("div");
          aviso.id = "raiet-aviso-actualizacion";
          const mensaje = document.createElement("span");
          mensaje.textContent = esDefinitiva
            ? "Hay una nueva versión de RAIET DEMO PRO (v1.0." + nueva.numero + ")."
            : "Ya existe RAIET DEMO PRO definitivo. Se instala como otra aplicación: conserva la edición de prueba hasta comprobar tus datos.";
          const descargar = document.createElement("button");
          descargar.type = "button";
          descargar.textContent = esDefinitiva ? "Descargar actualización" : "Instalar versión definitiva";
          descargar.addEventListener("click", () => {
            abrirEnNavegador(nueva.url).catch(() => window.alert("No se pudo abrir la descarga."));
          });
          const cerrar = document.createElement("button");
          cerrar.type = "button";
          cerrar.textContent = "Ahora no";
          cerrar.addEventListener("click", () => aviso.remove());
          aviso.append(mensaje, descargar, cerrar);
          document.body.appendChild(aviso);
        }
      } catch (error) {
        if (manual) window.alert("No se pudieron consultar las versiones. Revisa tu conexión a internet.");
        console.warn("Comprobación de actualización DEMO no disponible:", error);
      }
    }

    function mostrarMensaje(texto) {
      mensaje.textContent = texto;
    }

    function vencimiento() {
      return Math.min(ultimaActividad + TIEMPO_BLOQUEO,
        desdeSegundoPlano === null ? Infinity : desdeSegundoPlano + TIEMPO_SEGUNDO_PLANO);
    }

    function vencido() {
      const ahora = Date.now();
      return ahora < ultimaActividad ||
        (desdeSegundoPlano !== null && ahora < desdeSegundoPlano) || ahora >= vencimiento();
    }

    function controlarInactividad() {
      clearTimeout(temporizador);
      if (raiz.classList.contains("raiet-bloqueado")) return;
      temporizador = setTimeout(function () {
        if (vencido()) void bloquearAplicacion();
        else controlarInactividad();
      }, Math.max(0, vencimiento() - Date.now()));
    }

    function registrarActividad() {
      if (raiz.classList.contains("raiet-bloqueado") ||
          (puente() && (!nativoActivo || document.hidden || desdeSegundoPlano !== null))) return;
      if (vencido()) { void bloquearAplicacion(); return; }
      ultimaActividad = Date.now();
      guardarActividadWeb();
      controlarInactividad();
    }

    function sincronizarVisibilidad() {
      if (!puente()) {
        if (!document.hidden && !raiz.classList.contains("raiet-bloqueado") && vencido())
          void bloquearAplicacion();
        return;
      }
      if (document.hidden || !nativoActivo) {
        raiz.classList.add("raiet-en-segundo-plano");
        if (!raiz.classList.contains("raiet-bloqueado") && desdeSegundoPlano === null)
          desdeSegundoPlano = Date.now();
        controlarInactividad();
        return;
      }
      // Los temporizadores de Android pueden quedar suspendidos: comprobar el reloj
      // antes de volver a mostrar datos, sin reiniciar el plazo al regresar.
      if (!raiz.classList.contains("raiet-bloqueado") && vencido())
        void bloquearAplicacion();
      desdeSegundoPlano = null;
      raiz.classList.remove("raiet-en-segundo-plano");
      controlarInactividad();
    }

    async function bloquearAplicacion() {
      if (bloqueoEnCurso) return;

      bloqueoEnCurso = true;
      desdeSegundoPlano = null;
      actualizacionConsultada = false;
      document.getElementById("raiet-aviso-actualizacion")?.remove();

      raiz.classList.add("raiet-bloqueado");
      clearTimeout(temporizador);
      borrarActividadWeb();

      document.getElementById("raiet-clave").value = "";

      if (cliente) {
        try {
          await cliente.auth.signOut({ scope: "local" });
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        }
      }

      mostrarMensaje("Identifícate con huella o con tus credenciales para continuar.");
      try { await comprobarHuellaGuardada(); }
      finally { bloqueoEnCurso = false; }
    }

    function abrirAplicacion() {
      desdeSegundoPlano = null;
      ultimaActividad = Date.now();
      raiz.classList.remove("raiet-bloqueado");
      sincronizarVisibilidad();

      mostrarMensaje("");
      document.getElementById("raiet-clave").value = "";

      if (!inicioRealizado) {
        inicioRealizado = true;

        if (typeof window.raietArrancar === "function") {
          window.raietArrancar();
        }
      } else if (typeof window.raietArrancar === "function") {
        window.raietArrancar();
      }

      ultimaActividad = Date.now();
      guardarActividadWeb();
      controlarInactividad();
      void revisarActualizaciones(false);
    }

    botonHuella.addEventListener("click", async function () {
      if (bloqueoEnCurso || autenticacionEnCurso || !cliente || !lectorHuella()) return;
      autenticacionEnCurso = true;
      botonHuella.disabled = true;
      mostrarMensaje("Verificando huella...");
      try {
        // Android Keystore solo libera el secreto tras la autenticación biométrica.
        const credenciales = await lectorHuella().getSecureCredentials({
          server: SERVIDOR_HUELLA,
          title: "Entrar a RAIET DEMO PRO",
          subtitle: "Confirma tu huella",
          negativeButtonText: "Usar contraseña"
        });
        await autenticarYVerificar(credenciales.username, credenciales.password);
        abrirAplicacion();
      } catch (error) {
        mostrarMensaje(error && error.message === "Usuario no autorizado"
          ? "Usuario no autorizado."
          : "No se pudo usar la huella. Puedes ingresar con tu contraseña.");
      } finally {
        botonHuella.disabled = false;
        autenticacionEnCurso = false;
      }
    });

    botonOlvidarHuella.addEventListener("click", async function () {
      if (!lectorHuella()) return;
      if (!window.confirm("¿Quitar el acceso con huella guardado en este teléfono?")) return;
      try {
        await lectorHuella().deleteCredentials({ server: SERVIDOR_HUELLA });
        mostrarMensaje("Acceso con huella eliminado de este dispositivo.");
      } catch (_) {
        mostrarMensaje("No se pudo quitar la huella.");
      }
      await comprobarHuellaGuardada();
    });

    revisarBoton.addEventListener("click", function () {
      void revisarActualizaciones(true);
    });

    formulario.addEventListener("submit", async function (evento) {
      evento.preventDefault();

      if (!cliente) {
        mostrarMensaje("No se pudo conectar con Supabase.");
        return;
      }

      const email = document.getElementById("raiet-email")
        .value.trim();

      const password = document.getElementById("raiet-clave").value;

      if (bloqueoEnCurso || autenticacionEnCurso) return;
      autenticacionEnCurso = true;
      botonEntrar.disabled = true;
      mostrarMensaje("Verificando acceso...");

      try {
        await autenticarYVerificar(email, password);
        await ofrecerHuella(email, password);
        abrirAplicacion();
      } catch (error) {
        mostrarMensaje(error && error.message === "Usuario no autorizado."
          ? "Usuario no autorizado."
          : "No se pudo iniciar sesión. Revisa las credenciales y la conexión.");
      } finally {
        autenticacionEnCurso = false;
        botonEntrar.disabled = false;
      }
    });

    salir.addEventListener("click", bloquearAplicacion);

    ["click", "keydown", "touchstart", "pointerdown"].forEach(
      function (evento) {
        document.addEventListener(evento, registrarActividad, {
          passive: true
        });
      }
    );

    document.addEventListener("visibilitychange", sincronizarVisibilidad);
    const appNativa = puente()?.app;
    if (appNativa) {
      // Los eventos nativos complementan visibilitychange durante cámara,
      // navegador, cambio de aplicación o bloqueo de pantalla.
      try {
        await appNativa.addListener("appStateChange", ({isActive}) => {
          nativoActivo = !!isActive;
          sincronizarVisibilidad();
        });
        const estado = await appNativa.getState();
        nativoActivo = !!estado.isActive;
        sincronizarVisibilidad();
      } catch (_) { /* visibilitychange permanece como respaldo */ }
      try {
        await appNativa.addListener("backButton", ({canGoBack}) => {
          if (canGoBack) window.history.back();
          else void appNativa.minimizeApp().catch(() => {});
        });
      } catch (_) { /* comportamiento Android predeterminado */ }
    }

    if (!cliente) {
      mostrarMensaje("No se encontró la conexión con Supabase.");
      return;
    }

    // La web conserva su sesión al refrescar sólo si hubo actividad reciente.
    // Android exige autenticación al arrancar y bloquea al vencer el plazo.
    const ultimaWeb = !puente() ? leerActividadWeb() : 0;
    const transcurrido = Date.now() - ultimaWeb;
    if (!puente() && ultimaWeb > 0 && transcurrido >= 0 && transcurrido < TIEMPO_BLOQUEO) {
      try {
        const identidad = await cliente.auth.getUser();
        if (!identidad.error && identidad.data?.user && await window.RAIET_DEMO_AUTORIZADO()) {
          abrirAplicacion();
          return;
        }
        if (identidad.error) {
          mostrarMensaje("No fue posible comprobar la sesión. Revisa tu conexión y actualiza.");
          await comprobarHuellaGuardada();
          return;
        }
      } catch (error) {
        mostrarMensaje("Sin conexión para comprobar la sesión. Revisa internet y vuelve a cargar.");
        await comprobarHuellaGuardada();
        return;
      }
    }

    borrarActividadWeb();
    try {
      await cliente.auth.signOut({ scope: "local" });
    } catch (error) {
      console.warn("No se pudo cerrar una sesión local anterior.");
    }
    mostrarMensaje("");
    await comprobarHuellaGuardada();
  });
})();
