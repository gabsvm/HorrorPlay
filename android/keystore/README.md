# Configuración de Keystore para Android

## Generar Keystore (si no tenés uno existente)

```bash
keytool -genkey -v -keystore horrorplay.keystore -alias horrorplay_key -keyalg RSA -keysize 2048 -validity 10000
```

**Parámetros importantes:**
- `keystore`: Nombre del archivo (ej: `horrorplay.keystore`)
- `alias`: Nombre del alias (ej: `horrorplay_key`)
- `validity`: Años de validez (10000 = ~27 años)

## Guardar el Keystore

1. Mover `horrorplay.keystore` a esta carpeta `android/keystore/`
2. **NO committear el keystore a Git** (ya está en .gitignore)
3. Guardar una copia de seguridad en un lugar seguro

## Configurar en Godot

1. Abrir **Project > Export**
2. Seleccionar **Android**
3. En la pestaña **Options**:
   - **Keystore Path:** `/absolute/path/to/HorrorPlay/android/keystore/horrorplay.keystore`
   - **Keystore User:** `horrorplay_key`
   - **Keystore Password:** `[tu contraseña]`

## Permisos en AndroidManifest

Los siguientes permisos ya están configurados en `project.godot`:
- `android.permission.VIBRATE` - Feedback háptico
- `android.permission.READ_EXTERNAL_STORAGE` - Cargar saves
- `android.permission.WRITE_EXTERNAL_STORAGE` - Guardar partidas

## Exportar APK

```bash
# Debug (sin firmar)
godot --headless --export-debug "Android" build/HorrorPlay-debug.apk

# Release (firmado con keystore)
godot --headless --export-release "Android" build/HorrorPlay-release.apk
```
