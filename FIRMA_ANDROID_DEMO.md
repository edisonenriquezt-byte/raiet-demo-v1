# Activación única de la firma permanente RAIET DEMO PRO

Este documento se aplica **únicamente** a `edisonenriquezt-byte/raiet-demo-v1`. No reutilizar las claves de ESABAS. La firma no es el token de Telegram.

## Por qué se necesita
Las APK de prueba usan el paquete `com.esabas.raiet.demo.beta` y una firma temporal del compilador. Android no garantiza instalarlas como actualización de otra compilación. El APK definitivo usa `com.esabas.raiet.demo`, firma permanente y aviso de versiones nuevas. Los datos operativos residen en el proyecto DEMO separado; no desinstalar la beta hasta comprobar la instalación definitiva.

## Preparar la clave desde una PC Windows (una sola vez)
1. Instalar Java JDK 21 si el comando `keytool` todavía no está disponible.
2. Abrir PowerShell en una carpeta local privada y ejecutar:

```powershell
keytool -genkeypair -v -keystore .\raiet-demo-pro.jks -alias raietdemo -keyalg RSA -keysize 3072 -validity 10000
```

Elegir una **contraseña nueva**; registrar la contraseña del almacén y la de la clave. Si se usa la misma contraseña para ambas, indicarla en los dos secretos respectivos. Guardar una copia cifrada del archivo JKS y las contraseñas fuera de GitHub. **Nunca** subir el archivo JKS al repositorio ni compartirlo en chats.

3. Desde la misma carpeta en PowerShell, copiar su contenido como Base64 al portapapeles:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path '.\raiet-demo-pro.jks'))) | Set-Clipboard
```

4. En [GitHub / RAIET DEMO / Secrets and variables / Actions](https://github.com/edisonenriquezt-byte/raiet-demo-v1/settings/secrets/actions) crear estos cuatro **Repository secrets**:

| Nombre exacto | Contenido |
| --- | --- |
| `RAIET_DEMO_ANDROID_KEYSTORE_B64` | Pegar desde el portapapeles el Base64 del archivo JKS |
| `RAIET_DEMO_ANDROID_STORE_PASSWORD` | Contraseña del almacén JKS |
| `RAIET_DEMO_ANDROID_ALIAS` | `raietdemo` |
| `RAIET_DEMO_ANDROID_KEY_PASSWORD` | Contraseña de la clave `raietdemo` |

No incluir comillas adicionales en los secretos. No sustituir la clave por una nueva en builds posteriores: cambiar de firma rompe la actualización de Android.

5. Ir a [Actions / Crear APK Android RAIET DEMO PRO](https://github.com/edisonenriquezt-byte/raiet-demo-v1/actions/workflows/raiet-apk.yml) y pulsar `Run workflow` sobre `main`.

6. Cuando finalice **Success**, comprobar que aparece una publicación **definitiva, no preliminar** en [Releases](https://github.com/edisonenriquezt-byte/raiet-demo-v1/releases). Descargar `RAIET-DEMO.apk` e instalarla. La versión se muestra en la pantalla de acceso y dentro de la aplicación.

## Validaciones integradas
- Si faltan 1–3 de los cuatro secretos, la compilación falla de forma visible en vez de generar una APK engañosa.
- Si no hay ninguno, se permite una APK de prueba como artifact del workflow, **sin publicarla como nueva versión oficial**.
- Se verifica que el JKS y el alias sean válidos, que la APK esté firmada y que el identificador Android corresponda a la variante.
- La función de actualizaciones solo compara APK definitivas; una instalación beta ofrece migrar a la definitiva sin prometer una actualización incompatible.
- **La app principal ESABAS y sus claves no se modifican.**
