# Instalación independiente: RAIET DEMO V1

## Estado comprobado
- Repositorio nuevo: `edisonenriquezt-byte/raiet-demo-v1`.
- Supabase exclusivo: `lhqyibxpstrterlckaax`, región us-east-2.
- 24 tablas funcionales, 26 claves foráneas, 41 índices y 24 triggers.
- RLS: solo usuarios incorporados a `demo_privado.usuarios_autorizados`.
- Bot: funciones y receptor Edge separados, pero SIN BOT ACTIVADO ni token asignado.
- Android: APK beta compilada con éxito; las versiones definitivas requieren firma propia.
- Datos: se detectaron 19 registros anteriores en la base DEMO (3 clientes, 3 acreedores, 2 agenda, 3 cargos cobro, 2 abonos cobro, 3 cargos pago, 3 abonos pago). NO fueron copiados desde ESABAS ni borrados.
- Respaldo y módulos clínicos pertenecen exclusivamente al proyecto DEMO.

## 1. Usuario de la colaboradora
En Supabase DEMO → Authentication → Users, crear/invitar su usuario. Copiar su UUID y ejecutar ÚNICAMENTE en la base `raiet-demo`:
```sql
INSERT INTO demo_privado.usuarios_autorizados(user_id,activo)
VALUES ('UUID-COLABORADORA'::uuid,true)
ON CONFLICT (user_id) DO UPDATE SET activo=true;
```
Verificar que el identificador corresponda al proyecto DEMO. No compartir usuario, contraseña ni sesiones de ESABAS.

## 2. Publicación web (Cloudflare Pages)
**No utilizar GitHub Pages bajo `edisonenriquezt-byte.github.io`** mientras ESABAS utilice ese mismo origen: compartirían `localStorage`. Usar un nuevo proyecto Cloudflare Pages con su subdominio independiente `*.pages.dev`.
- Repositorio fuente: `edisonenriquezt-byte/raiet-demo-v1`.
- Rama: `main`.
- Comando de compilación: `sh scripts/preparar_web_demo.sh`.
- Carpeta de salida: `dist`.
- URL de producción: será la dirección `*.pages.dev` asignada por Cloudflare.
- No modificar DNS, correo, n8n ni proyectos Pages de ESABAS.

## 3. Bot Telegram propio
En el Telegram DEL PROPIETARIO abrir @BotFather:
- `/newbot`
- Nombre visible: **RAIET DEMO V1**
- Username sugerido: **RAIETDemoV1Bot**, sujeto a disponibilidad.
- El token recibido es un SECRETO: no pegarlo en GitHub, en un chat ni en un archivo público.

La colaboradora necesita su propio `chat_id` numérico; se debe verificar que corresponda a su cuenta y no al Telegram privado ESABAS.

En el SQL Editor de **Supabase DEMO**, completar los valores con el UUID del usuario que ya está autorizado:
```sql
UPDATE demo_privado.telegram_bot_config
 SET owner_user_id='UUID-COLABORADORA'::uuid,
     chat_id='CHAT-ID-COLABORADORA',
     bot_token='TOKEN-NUEVO-DE-BOTFATHER',
     activo=false,
     modificado_el=now()
 WHERE id=1;
```
Revisar antes si los 19 registros antiguos, citas o alarmas anteriores deben conservarse. Activar únicamente tras confirmar la información.
Después registrar el menú y el webhook desde SQL Editor DEMO:
```sql
SELECT demo_privado.telegram_registrar_webhook_y_menu();
```
Se obtienen identificadores de tres solicitudes HTTP para `setMyCommands`, `setWebhook` y `setChatMenuButton`. Verificar respuestas HTTP 200/ok de Telegram en la tabla técnica `net._http_response`, consultando esos IDs (no compartir URLs de llamadas con el token). Finalmente:
```sql
UPDATE demo_privado.telegram_bot_config SET activo=true WHERE id=1;
```
El bot tiene 17 comandos. /programar guarda fecha y alarma iguales; selección de hora distinta para Telegram es mejora de V2. Las alarmas se revisan cada minuto con pg_cron, cuando el bot está activo.

## 4. Android: firma y actualizaciones
Nunca usar los secretos ni el keystore de ESABAS. El propietario tiene el paquete privado de firma DEMO generado durante la preparación de este proyecto.
Abrir `https://github.com/edisonenriquezt-byte/raiet-demo-v1/settings/secrets/actions` y crear cuatro secrets:
- `RAIET_DEMO_ANDROID_KEYSTORE_B64`
- `RAIET_DEMO_ANDROID_STORE_PASSWORD`
- `RAIET_DEMO_ANDROID_ALIAS`
- `RAIET_DEMO_ANDROID_KEY_PASSWORD`

Los valores están en el ZIP PRIVADO, no en GitHub. Ejecutar workflow `Crear APK Android RAIET DEMO V1` mediante `Run workflow`. La APK oficial usa `com.esabas.raiet.demo` y se publica en Releases `raiet-demo-android-N`. Conserva el keystore indefinidamente: es indispensable para futuras actualizaciones.

## 5. Pruebas antes de entregar
1. Inicio y bloqueo biométrico con usuario DEMO.
2. Clientes, Asuntos, Actuaciones, Gestión y Agenda.
3. Cobros y Pagos: saldos, abonos, cuotas, auditoría.
4. Inventario: compras/ventas, PEPS, CPP y anulaciones.
5. Historia Clínica: pacientes, consultas, recetas, exámenes, documentos privados, citas.
6. Bot: todos sus comandos, confirmaciones y alarmas automáticas.
7. Web: aviso de nueva versión, recarga sin perder formulario incompleto hasta confirmar.
8. Android: instalar paquete firmado y actualizarlo con otra versión firmada igual.
9. Prueba de aislamiento: registros DEMO nunca aparecen en ESABAS; ESABAS nunca aparece en DEMO.
10. Respaldo cifrado y verificación del archivo .raietbak.

**No entregar como producción mientras falten usuario, bot, firma, publicación web y prueba de aislamiento.**
