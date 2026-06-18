# SQL Knowledge Studio - Herramienta de Evaluación de Conocimientos

Esta es una aplicación web interactiva estilo Single Page Application (SPA) para realizar evaluaciones de conocimientos a partir de preguntas y respuestas cargadas desde un archivo Excel.

La interfaz de usuario está inspirada en editores y administradores de bases de datos modernos como **Visual Studio Code**, **SQL Server Management Studio (SSMS)** y **Azure Data Studio**, ofreciendo un tema oscuro elegante y profesional diseñado especialmente para perfiles técnicos y de desarrollo.

## Características principales

- **Tema Oscuro Premium**: Fondo oscuro de alto contraste (`#1E1E1E`), fuentes monoespaciadas, y acentos de color basados en sintaxis SQL/Código.
- **Micro-animaciones**: Transiciones fluidas en la selección de opciones, barra de progreso interactiva y animaciones de carga.
- **Motor de Carga de Excel**: Carga y validación automática de columnas de preguntas y opciones directamente desde un archivo Excel.
- **Criterio de Calificación**: Validación estricta con porcentaje mínimo del **75% para aprobar**.
- **Dashboard de Resultados**: Reporte estilo cuadrícula de base de datos que detalla la cantidad de aciertos, desaciertos y si aprobó, además de un desglose por cada pregunta indicando tu respuesta y la correcta en caso de error.
- **Historial Local**: Registro automático de evaluaciones pasadas persistido en un archivo JSON local (`resultados_historial.json`).
- **Descarga de Plantilla**: Botón integrado para descargar una plantilla modelo con preguntas técnicas directamente desde la aplicación.

---

## Requisitos Previos

- Python 3.8 o superior.
- Administrador de paquetes de Python (`pip`).

---

## Estructura del Archivo Excel

El archivo Excel a cargar debe contar con una hoja de datos y obligatoriamente tener las siguientes columnas en su primera fila (los nombres son sensibles a los acentos):

1. **`Pregunta`**: El texto explicativo de la pregunta.
2. **`Opción A`**: Opción de respuesta A.
3. **`Opción B`**: Opción de respuesta B.
4. **`Opción C`**: Opción de respuesta C.
5. **`Respuesta Correcta`**: La letra que representa la respuesta correcta (`A`, `B` o `C`). Se admiten minúsculas o mayúsculas.

---

## Instrucciones de Ejecución Local

### 1. Clonar o acceder a la carpeta del proyecto
Abre la consola y navega al directorio del proyecto:
```bash
cd C:\Users\ndmunozp.S\.gemini\scratch\evaluador_conocimiento
```

### 2. Crear y activar un entorno virtual (Recomendado)
Para mantener limpias las dependencias de tu sistema:

**En Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**En macOS/Linux (Bash):**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar las dependencias requeridas
Utiliza el archivo `requirements.txt` provisto:
```bash
pip install -r requirements.txt
```

### 4. Generar archivo Excel de ejemplo (Opcional)
Si deseas generar una plantilla lista para probar de inmediato:
```bash
python generate_sample.py
```
Esto creará un archivo llamado `plantilla_preguntas.xlsx` en la raíz del proyecto.

### 5. Iniciar el servidor de desarrollo
Ejecuta el servidor FastAPI usando `uvicorn`:
```bash
uvicorn app.main:app --reload
```

El servidor se iniciará en `http://127.0.0.1:8000`.

### 6. Usar la aplicación
1. Abre tu navegador web e ingresa a `http://127.0.0.1:8000`.
2. Arrastra tu archivo Excel (`plantilla_preguntas.xlsx`) o haz clic en la zona de importación para seleccionarlo.
3. Presiona el botón verde **Ejecutar Cuestionario**.
4. Responde cada pregunta de forma interactiva navegando con "Siguiente" o usando los círculos en la parte inferior.
5. Al finalizar presiona **Calificar Evaluación** o presiona la tecla rápida en el botón verde.
6. Analiza tus resultados en la consola de salida y revisa el historial si deseas ver evaluaciones anteriores.
