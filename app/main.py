import os
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import pandas as pd
import io

from app.models import (
    Question, QuestionResult, QuizResult, QuizSubmission, AnswerSubmission
)
from app.services.excel_loader import load_excel_questions

app = FastAPI(
    title="Evaluador Técnico de Conocimiento",
    description="API para procesar y evaluar cuestionarios desde archivos Excel estilo IDE.",
    version="1.0.0"
)

# Almacenamiento en memoria para sesiones activas
# En producción esto usaría Redis o base de datos, pero en memoria es perfecto para uso local.
SESSIONS: Dict[str, Dict[str, Any]] = {}

# Ruta del archivo de historial de resultados
HISTORIAL_FILE = "resultados_historial.json"

def guardar_en_historial(result: QuizResult):
    """Guarda un resultado en un archivo JSON local para almacenar historial."""
    historial = []
    if os.path.exists(HISTORIAL_FILE):
        try:
            with open(HISTORIAL_FILE, "r", encoding="utf-8") as f:
                historial = json.load(f)
        except Exception:
            # Si el archivo está corrupto o vacío, empezamos de nuevo
            historial = []
            
    # Convertir el modelo a dict compatible con JSON
    result_dict = result.dict()
    historial.insert(0, result_dict) # Insertar al principio para ver el más reciente primero
    
    try:
        with open(HISTORIAL_FILE, "w", encoding="utf-8") as f:
            json.dump(historial, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error al guardar historial local: {e}")

@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)):
    """
    Sube un archivo Excel con preguntas y respuestas.
    Crea una sesión de cuestionario y retorna las preguntas sin las respuestas correctas.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo inválido. Debe ser un archivo Excel (.xlsx o .xls)."
        )
        
    try:
        file_bytes = await file.read()
        questions, correct_answers = load_excel_questions(file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al procesar el Excel: {str(e)}"
        )

    # Crear una sesión única
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "questions": questions,
        "correct_answers": correct_answers,
        "created_at": datetime.now()
    }

    return {
        "session_id": session_id,
        "questions": questions,
        "total_preguntas": len(questions)
    }

@app.post("/api/evaluate", response_model=QuizResult)
async def evaluate_quiz(submission: QuizSubmission):
    """
    Evalúa las respuestas de un cuestionario.
    Compara contra las respuestas correctas en memoria, calcula estadísticas e historial.
    """
    session_id = submission.session_id
    if session_id not in SESSIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La sesión de evaluación no existe o ha expirado. Por favor, sube el Excel de nuevo."
        )

    session_data = SESSIONS[session_id]
    original_questions: List[Question] = session_data["questions"]
    correct_answers: Dict[int, str] = session_data["correct_answers"]

    # Mapear respuestas enviadas por el usuario por ID de pregunta
    respuestas_usuario = {r.question_id: r.respuesta for r in submission.respuestas}

    correctas_count = 0
    incorrectas_count = 0
    detalles: List[QuestionResult] = []

    for q in original_questions:
        ans_user = respuestas_usuario.get(q.id)
        if ans_user:
            ans_user = ans_user.strip().upper()
            
        ans_correct = correct_answers.get(q.id)

        es_correcta = (ans_user == ans_correct)
        
        if es_correcta:
            correctas_count += 1
        else:
            incorrectas_count += 1

        detalles.append(
            QuestionResult(
                id=q.id,
                pregunta=q.pregunta,
                opcion_a=q.opcion_a,
                opcion_b=q.opcion_b,
                opcion_c=q.opcion_c,
                respuesta_usuario=ans_user,
                respuesta_correcta=ans_correct,
                es_correcta=es_correcta
            )
        )

    total_preguntas = len(original_questions)
    porcentaje = 0.0
    if total_preguntas > 0:
        porcentaje = round((correctas_count / total_preguntas) * 100, 2)

    # Criterio de aprobación: >= 75%
    aprobado = (porcentaje >= 75.0)

    resultado = QuizResult(
        correctas=correctas_count,
        incorrectas=incorrectas_count,
        total=total_preguntas,
        porcentaje_aprobacion=porcentaje,
        aprobado=aprobado,
        detalles=detalles,
        fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

    # Guardar en archivo local
    guardar_en_historial(resultado)

    # Limpiar sesión para no ocupar memoria indefinidamente
    # En desarrollo local lo mantenemos o eliminamos según el caso.
    # Por comodidad, lo dejamos en memoria en caso de que quieran consultar,
    # pero podríamos borrarlo si quisiéramos.

    return resultado

@app.get("/api/history")
async def get_history():
    """Retorna el historial de evaluaciones guardadas localmente."""
    if not os.path.exists(HISTORIAL_FILE):
        return []
    try:
        with open(HISTORIAL_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al leer el archivo de historial: {str(e)}"
        )

@app.get("/api/download-template")
async def download_template():
    """Genera dinámicamente una plantilla Excel para pruebas."""
    # Preguntas interesantes con temática SQL / Backend para encajar en la estética técnica
    data = {
        "Pregunta": [
            "¿Cuál de las siguientes cláusulas SQL se utiliza para filtrar grupos de resultados devueltos por GROUP BY?",
            "En el diseño de bases de datos relacionales, ¿qué representa una Clave Primaria (Primary Key)?",
            "¿Cuál es el propósito principal del comando git merge?",
            "¿Qué tipo de indexación en bases de datos es mejor para búsquedas de rangos de valores?",
            "En arquitecturas REST, ¿cuál es el método HTTP correcto para actualizar parcialmente un recurso existente?"
        ],
        "Opción A": [
            "WHERE",
            "Un campo que almacena contraseñas cifradas.",
            "Guardar los cambios en el repositorio remoto.",
            "Índice Clusterizado (B-Tree)",
            "PUT"
        ],
        "Opción B": [
            "HAVING",
            "Un identificador único para cada registro en una tabla.",
            "Integrar cambios de una rama de desarrollo en otra rama activa.",
            "Índice Hash",
            "PATCH"
        ],
        "Opción C": [
            "ORDER BY",
            "Un campo que enlaza dos tablas distintas (Foreign Key).",
            "Crear una copia exacta del repositorio local.",
            "Índice Full-Text",
            "POST"
        ],
        "Respuesta Correcta": [
            "B",
            "B",
            "B",
            "A",
            "B"
        ]
    }

    df = pd.DataFrame(data)
    
    # Crear un buffer en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Evaluacion")
        
        # Ajustar ancho de columnas para que se vea premium
        workbook = writer.book
        worksheet = writer.sheets["Evaluacion"]
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            worksheet.column_dimensions[col_letter].width = max(max_len + 3, 12)
            
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="plantilla_preguntas.xlsx"'
    }
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

# Servir frontend estático
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print(f"Advertencia: Directorio estático '{static_dir}' no encontrado. Se creará al escribir los archivos del frontend.")
