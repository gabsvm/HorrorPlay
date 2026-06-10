# HorrorPlay - Innsmouth Chronicles

> Un punto y click Lovecraftiano ambientado en el infame pueblo pesquero de Innsmouth, 1926.

![Godot 4.6](https://img.shields.io/badge/Godot-4.6-blue.svg)
![License](https://img.shields.io/badge/License-CC--BY--NC--SA--4.0-lightgrey.svg)

## 📖 Sinopsis

Octubre de 1926. Como inspector de policía de Boston, investigo el misterioso caso de tres guardacostas desaparecidos cerca del Arrecife del Diablo, en las proximidades del pueblo prohibido de Innsmouth.

Lo que encuentro en esa niebla eterna desafía toda comprensión humana...

## 🎮 Características

- **Narrativa gótica** inspirada en H.P. Lovecraft y Outlast
- **Mecánicas de punto y click** clásicas con UI táctil optimizada
- **Sistema de cordura** que afecta la percepción del jugador
- **Horror biológico** con lore inspirado en El Abismo de Innsmouth
- **Progresión no lineal** con múltiples caminos de investigación
- **Exportación multiplataforma** (PC, Android, iOS)

## 🛠️ Requisitos

### Para jugar
- **PC:** Windows 10+, macOS 10.14+, Linux (x86_64)
- **Móvil:** Android 7.0+ (API 24+), iOS 12.0+
- **RAM mínima:** 4GB
- **Almacenamiento:** 200MB libres

### Para desarrollar
- **Godot Engine 4.6+** (https://godotengine.org)
- **Git** para control de versiones
- **Android Studio** (solo para exportación a Android)

## 🚀 Instalación y Ejecución

### Clonar el repositorio
```bash
git clone https://github.com/gabsvm/HorrorPlay.git
cd HorrorPlay
```

### Ejecutar en Godot
1. Abrir el proyecto en Godot 4.6+
2. Presionar **F5** para correr
3. El juego se ejecutará en ventana 1280x720

### Exportar a Android
```bash
# Instalar template de exportación
godot --headless --import --export-debug "Android" .

# Exportar APK de debug
godot --headless --export-debug "Android" build/HorrorPlay-debug.apk

# Exportar APK de release (requiere keystore configurado)
godot --headless --export-release "Android" build/HorrorPlay-release.apk
```

## 📁 Estructura del Proyecto

```
HorrorPlay/
├── assets/                    # Recursos del juego
│   ├── audio/                 # Música y SFX
│   │   └── music/
│   │       └── gothic_village.ogg
│   └── images/                # Sprites y backgrounds
│       ├── backgrounds/
│       ├── characters/
│       ├── items/
│       └── props/
├── src/                       # Código fuente
│   ├── autoload/              # Singletons globales
│   │   ├── game_state.gd      # Persistencia de flags
│   │   ├── inventory.gd       # Sistema de inventario
│   │   └── sanity.gd          # Sistema de cordura
│   ├── common/                # Clases y UI compartidas
│   │   ├── ui/
│   │   │   ├── dialogue_balloon.gd
│   │   │   └── ui_hud.gd
│   │   └── classes/
│   └── rooms/                 # Escenas de cada habitación
│       ├── room_00_intro/
│       ├── room_01_office/
│       ├── room_02_streets/
│       └── room_03_tavern/
├── .gitignore                 # Ignorados de Git
├── .gitattributes             # Configuración de line endings
└── project.godot              # Configuración del proyecto
```

## 🎨 Estilo Visual y Auditivo

- **Estética:** Pixel art oscuro con paleta limitada (inspirado en Gothicvania)
- **Música:** Ambient gótico con sintetizadores procedurales
- **UI:** Minimalista con animaciones de "juicy feedback"
- **Idioma:** Español (Rioplatense) con toques de jerga de 1920s

## 📝 Sistema de Guardado

El juego utiliza un sistema de guardado manual en slots:
- **Slot 1:** Archivo de guardado principal
- Ubicación: `user://savegame_1.sav`

## 🔧 Configuración Técnica

### Rendering
- **Renderer:** Mobile (optimizado para 2D)
- **Compresión de texturas:** ETC2/ASTC
- **Viewport:** 1920x1080 (escalado a 1280x720)
- **Stretch mode:** canvas_items

### Audio
- **Bus principal:** Master
- **Sub-buses:** Music, SFX
- **SFX procedurales:** Sí (sintetizador 8-bit)

### Input
- **Soporte multi-touch:** Sí
- **Safe area detection:** Sí (para notches y system bars)
- **Touch targets:** 140x100px mínimo

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia **CC BY-NC-SA 4.0** - ver archivo [LICENSE](LICENSE) para detalles.

**Uso no comercial únicamente.** No se permite la distribución comercial ni derivados con fines lucrativos.

## 🙏 Agradecimientos

- **Godot Engine** por el motor gratuito y de código abierto
- **HP Lovecraft** por la inspiración original
- **Comunidad de Godot** por los recursos y soporte

## 📬 Contacto

- **GitHub:** [@gabsvm](https://github.com/gabsvm)
- **Issues:** https://github.com/gabsvm/HorrorPlay/issues

---

*Que mi fe me guarde de lo que me aguarda en la niebla...* 🌊🐟
