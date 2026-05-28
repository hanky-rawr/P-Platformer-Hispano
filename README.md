# GD Platformer Hispano - Demon List

Una plataforma web moderna para gestionar y visualizar un ranking de niveles de plataforma de Geometry Dash, creada para la comunidad hispanohablante.

## 🎮 Qué es esto

**GD Platformer Hispano** es una *Demon List* interactiva para niveles de plataforma de Geometry Dash. Funciona como:

- **Ranking semi oficial** de niveles de plataforma ordenados por dificultad
- **Leaderboard comunitario** con estadísticas de jugadores por país
- **Base de datos de récords** verificados y visualizables
- **Portal informativo** con datos de staff y objetivos de la comunidad

## 🌐 Cómo funciona la página

### Vistas principales

1. **Lista de Niveles** (pestaña "Lista")
   - Muestra todos los niveles ordenados por dificultad
   - Cada nivel muestra: ranking, nombre, autor y puntos asociados
   - Al seleccionar un nivel, muestra en detalle:
     - Información del creador y verificador
     - Video de verificación oficial
     - Contraseña del nivel
     - Tabla completa de récords con usuario, dispositivo, país, Hz y video

2. **Leaderboard** (pestaña "Leaderboard")
   - **Jugadores**: Top global de jugadores con más puntos acumulados
   - **Países**: Ranking de países por puntos totales
   - **Hardest**: Demonios más difíciles completados por país
   - Filtrable por país
   - Estadísticas: jugadores, demons completados, puntos acumulados

3. **Info** (pestaña "Info")
   - Descripción de la comunidad
   - Objetivos y valores
   - Staff y moderadores
   - Enlaces a Discord y formulario de envío de records

### Funcionalidades

- 🔍 **Búsqueda en tiempo real**: por nombre de nivel o creador
- 🌍 **Filtro por país**: visualiza estadísticas por nación
- 📱 **Diseño responsivo**: funciona perfectamente en móvil y desktop
- 🏷️ **Etiquetas**: clasificación de niveles (ej: "No rated")
- 📊 **Sistema de puntos**: cada nivel tiene valor según su posición

## 📂 Estructura del proyecto

```
P-Platformer-Hispano/
├── index.html              # Página HTML principal
├── css/
│   └── styles.css         # Estilos (sin compilar, CSS puro)
├── js/
│   └── app.js             # Lógica principal en JavaScript puro
├── data/
│   ├── comunidad.json     # Información de la comunidad
│   ├── staff.json         # Datos del staff y moderadores
│   ├── imgs/              # Imágenes (logo, avatares, etc)
│   └── levels/
│       ├── _list.json     # Índice ordenado de niveles
│       └── [nivel].json   # Archivos individuales de cada nivel
└── README.md              # Este archivo
```

## 📝 Cómo crear y subir un nuevo nivel

### Paso 1: Crear el archivo JSON del nivel

En `data/levels/`, crea un archivo con nombre **igual al que irá en _list.json**. Ejemplo: `NombreDelNivel.json`

**Estructura requerida:**

```json
{
    "id": 123456789,
    "name": "Nombre Visible del Nivel",
    "tag": "Etiqueta",
    "author": "Nombre del Autor",
    "creators": ["Autor1", "Autor2"],
    "verifier": "Nombre del Verificador",
    "verification": "https://www.youtube.com/watch?v=VIDEO_ID",
    "password": "contraseña_opcional",
    "records": []
}
```

**Campos obligatorios:**
- `id`: ID numérico del nivel en Geometry Dash
- `name`: Nombre del nivel como aparecerá en la web
- `author`: Creador principal
- `creators`: Lista de todos los creadores
- `verifier`: Quien verificó el nivel
- `verification`: URL del video de verificación (YouTube)

**Campos opcionales:**
- `tag`: Etiqueta descriptiva ("No rated", "New", etc) - puede ser string vacío
- `password`: Contraseña de entrada
- `records`: Array vacío inicialmente (se llena con récords)

### Paso 2: Agregar el nivel a _list.json

En `data/levels/_list.json`, agrega el **nombre del archivo** (sin .json) en el orden que desees:

```json
[
    "Nautical_Nightmares",
    "Abyss_Deathless",
    "Mi_Nuevo_Nivel",
    "Breakout"
]
```

**Importante:** El orden de este archivo determina el ranking. El primero es #1, el segundo es #2, etc.

### Paso 3: Calcular puntos automáticamente

Los puntos se calculan automáticamente con esta fórmula:
```
Puntos = Math.max(10, 250 - ((posición - 1) * 15))
```

Ejemplos:
- Posición #1 → 250 puntos
- Posición #5 → 190 puntos
- Posición #10 → 115 puntos
- Posición #20 → -40 → 10 puntos (mínimo)

## 📊 Cómo cargar un récord en un nivel

Los records se cargan en el array `records` dentro de cada archivo de nivel. 

**Estructura de un récord:**

```json
{
    "user": "Nombre del Jugador",
    "device": "PC",
    "time": "HH:MM:SS",
    "country": "País",
    "link": "https://youtube.com/...",
    "hz": 360
}
```

**Campos:**
- `user`: Nombre del jugador en Geometry Dash
- `device`: "PC", "Mobile" o "Nintendo Switch"
- `time`: Tiempo de completion (formato horas:minutos:segundos)
- `country`: País del jugador (ej: "Argentina", "México", "Chile")
- `link`: URL del video de YouTube con la prueba
- `hz`: Hz del dispositivo (típicamente 60, 120, 144, 240, 360)

**Ejemplo completo de un nivel con récords:**

```json
{
    "id": 133884015,
    "name": "Breakout",
    "tag": "",
    "author": "iIShadowIi",
    "creators": ["iIShadowIi"],
    "verifier": "iIShadowIi",
    "verification": "https://www.youtube.com/watch?v=9oklLaljcoo",
    "password": "",
    "records": [
        {
            "user": "josema",
            "device": "PC",
            "time": "11:34:09",
            "country": "Chile",
            "link": "https://youtube.com/watch?v=ejemplo1",
            "hz": 360
        },
        {
            "user": "GamePlayer",
            "device": "Mobile",
            "time": "08:45:23",
            "country": "México",
            "link": "https://youtube.com/watch?v=ejemplo2",
            "hz": 120
        }
    ]
}
```

## 🏆 Sistema de Puntos y Leaderboard

### Cálculo de puntos por jugador

Cada jugador acumula **puntos según los niveles que completa**, pero **solo cuenta una vez por nivel** (aunque tenga múltiples records en distintos niveles).

**Ejemplo:**
- Si completa el nivel #1 (250 pts) y #2 (235 pts) → Total: 485 puntos
- Si hay 3 records diferentes de un jugador en el nivel #1 → Sigue siendo 250 pts (no se repite)

### Estadísticas por país

Cada país acumula:
- **Jugadores únicos**: cuántas personas han completado levels
- **Demons distintos**: cuántos niveles diferentes han completado
- **Puntos totales**: suma de puntos (un nivel por vez)
- **Hardest del país**: nivel más difícil completado por ese país

### Ordenamiento del Leaderboard

1. **Jugadores**: Ordenados por puntos totales (descendente)
2. **Países**: Ordenados por puntos totales (descendente), con demon count como criterio secundario
3. **Hardest**: Ordenados por posición del nivel más difícil completado

## 🎨 Personalización y Datos

### Cambiar información de la comunidad

En `data/comunidad.json`:
```json
{
    "description": "Descripción de la comunidad...",
    "objectives": [
        "Objetivo 1",
        "Objetivo 2"
    ],
    "links": [
        { "label": "Discord", "url": "https://discord.gg/..." }
    ]
}
```

### Cambiar staff y moderadores

En `data/staff.json`:
```json
{
    "creator": {
        "name": "Nombre",
        "avatar": "data/imgs/imagen.png",
        "bio": "Descripción"
    },
    "staff_members": [
        { "name": "Moderador", "role": "Rol", "color": "#HEXCOLOR" }
    ]
}
```

## 💡 Notas importantes

### Nombres de archivos
- Los nombres de archivos JSON deben coincidir exactamente con los de _list.json
- Se recomienda usar notación UpperCamelCase: `NombreDelNivel.json`
- Evitar espacios, caracteres especiales o acentos

### Validación de datos
- **IDs únicos**: Cada nivel debe tener un ID diferente de Geometry Dash
- **URLs válidas**: Los links de YouTube deben ser direcciones correctas
- **Países válidos**: Se recomiendan nombres de países en español (Argentina, México, Chile, etc)
- **Dispositivos**: Solo "PC", "Mobile" o "Nintendo Switch"

### Performance
- El sistema carga todos los niveles al inicio
- Soporta búsqueda y filtrado en tiempo real
- Funciona sin necesidad de backend o base de datos
- Todo es almacenamiento estático en JSON

## 🔧 Desarrollo técnico

### Stack
- **Frontend**: HTML5, CSS3 (sin frameworks), JavaScript Vanilla ES6+
- **Datos**: JSON estático
- **Deployment**: Estático (GitHub Pages, Netlify, etc)

### Características de código
- Responsive design con media queries
- Animaciones y transiciones suaves
- Modal overlay para información detallada
- Búsqueda y filtrado dinámico
- Cálculos en tiempo real sin servidor

### Navegadores soportados
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers modernos

## 📋 Checklist para agregar un nuevo nivel

- [ ] Crear `data/levels/NombreDelNivel.json` con estructura correcta
- [ ] Agregar el nombre a `data/levels/_list.json` en la posición deseada
- [ ] Verificar que el JSON sea válido (sin errores de sintaxis)
- [ ] Confirmar que los URLs de YouTube sean correctos
- [ ] Testear que el nivel aparece en la lista
- [ ] Verificar que los puntos se calculan correctamente

## 📝 Checklist para agregar un récord

- [ ] Seleccionar el nivel correcto en `data/levels/[Nivel].json`
- [ ] Agregar el nuevo objeto al array `records`
- [ ] Validar: usuario, dispositivo, país, video
- [ ] Confirmar que el JSON sea válido
- [ ] Testear que el récord aparece en la tabla de la web

## 🤝 Contribuir

Para agregar nuevos niveles o récords:
1. Edita los archivos JSON correspondientes
2. Valida la sintaxis JSON
3. Recarga la página para ver los cambios
4. Haz un commit con una descripción clara

## 📞 Contacto y links

- **Discord oficial**: https://discord.gg/SwGG7n4duy
- **Formulario de récords**: https://forms.gle/4gPTiRLUFHLv1xXQ9

---

**Última actualización**: Mayo 2026  
**Versión**: 2.0  
**Desarrolladores**: Drak y Ezequiel
