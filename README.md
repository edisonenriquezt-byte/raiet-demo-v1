# RAIET DEMO V1

Instalación de demostración **independiente** de RAIET ESABAS, sin copiar datos reales.

## Componentes
- Código GitHub: `edisonenriquezt-byte/raiet-demo-v1`.
- Supabase DEMO: `lhqyibxpstrterlckaax`. Todas las tablas tienen RLS, con autorización explícita `demo_privado.usuarios_autorizados`.
- Módulos conservados: Clientes, Asuntos, Actuaciones, Gestión, Agenda, Cobros, Pagos, Inventario PEPS/CPP e Historia Clínica.
- Archivos: buckets privados DEMO en su propio proyecto Supabase.
- Bot Telegram DEMO: **pendiente**. El disparador está desactivado hasta conectar el bot independiente.
- Web DEMO: Service Worker con avisos de actualización. **No publicar bajo el mismo origen `edisonenriquezt-byte.github.io` que ESABAS**, pues `localStorage` comparte origen incluso entre carpetas diferentes. Usar otro hostname, por ejemplo Cloudflare Pages bajo subdominio `*.pages.dev`.

## Habilitar cuenta de colaboradora
Crear/invitar su usuario en Supabase DEMO, luego identificar su UUID y ejecutar SOLO EN DEMO:
```sql
INSERT INTO demo_privado.usuarios_autorizados(user_id,activo)
VALUES ('UUID-DEL-USUARIO-DEMO'::uuid,true)
ON CONFLICT (user_id) DO UPDATE SET activo=true;
```
El frontend comprueba `public.demo_acceso_habilitado()`. No usar las credenciales privadas ESABAS.

## APK y actualizaciones propias
El flujo `.github/workflows/raiet-apk.yml` crea APK de prueba `com.esabas.raiet.demo.beta` sin firma permanente, o versión definitiva `com.esabas.raiet.demo` con nuevos secretos de firma:
- `RAIET_DEMO_ANDROID_KEYSTORE_B64`
- `RAIET_DEMO_ANDROID_STORE_PASSWORD`
- `RAIET_DEMO_ANDROID_ALIAS`
- `RAIET_DEMO_ANDROID_KEY_PASSWORD`

No reutilizar el keystore de ESABAS. Generar y custodiar una firma JKS distinta para poder actualizar la misma app sin reinstalar. El repositorio DEMO publica `RAIET-DEMO.apk` en Releases `raiet-demo-android-N`; la APK busca actualizaciones solo en DEMO. La APK beta no es la versión instalable definitiva y no ofrece actualización estable.

## Versión web
Cambiar `VERSION_WEB` en `acceso-esabas.js`, el sufijo `?v=` en `index.html`, y el `CACHE_NAME` + assets en `sw.js` en futuras versiones.

## Pendientes de entrega
Configurar usuario colaboradora, bot independiente, firma APK estable, origen web distinto y efectuar pruebas de acceso, operaciones y aislamiento entre ESABAS y DEMO. **No entregar a terceros sin estas verificaciones.**


## Versiones y firma Android (noviembre de 2026)
La versión web figura en `acceso-esabas.js` y se presenta en la pantalla de acceso. La APK muestra `APP · v1.0.N` y, cuando corresponde, la etiqueta `PRUEBA`.

El comprobador consulta las publicaciones definitivas del repositorio; una beta nunca se presenta falsamente como actualizable encima de una firma diferente. Las versiones definitivas solo se publican si están presentes los **cuatro secretos de firma** de DEMO. Instrucciones completas: [FIRMA_ANDROID_DEMO.md](FIRMA_ANDROID_DEMO.md).
