import io
import pandas as pd
from typing import List, Tuple, Dict
from app.models import Question

REQUIRED_COLUMNS = [
    "Pregunta",
    "Opción A",
    "Opción B",
    "Opción C",
    "Respuesta Correcta"
]

def load_excel_questions(file_bytes: bytes) -> Tuple[List[Question], Dict[int, str]]:
    """
    Carga preguntas desde un archivo Excel en bytes.
    Retorna:
        - List[Question]: Lista de preguntas para el frontend (sin la respuesta correcta).
        - Dict[int, str]: Diccionario {id_pregunta: respuesta_correcta} para la validación.
    """
    try:
        # Leer el Excel usando pandas
        df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Error al leer el archivo Excel: {str(e)}")

    # Limpiar nombres de columnas (quitar espacios adicionales)
    df.columns = [str(col).strip() for col in df.columns]

    # Verificar presencia de columnas requeridas
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(f"El archivo Excel no contiene las columnas requeridas: {', '.join(missing_cols)}")

    questions = []
    correct_answers = {}

    for idx, row in df.iterrows():
        # Generar un ID basado en el índice (1-indexed)
        q_id = int(idx + 1)
        
        pregunta = str(row["Pregunta"]).strip()
        opcion_a = str(row["Opción A"]).strip()
        opcion_b = str(row["Opción B"]).strip()
        opcion_c = str(row["Opción C"]).strip()
        
        # Validar que no haya campos vacíos esenciales
        if not pregunta or pd.isna(row["Pregunta"]):
            continue  # Saltar filas vacías
            
        respuesta_correcta = str(row["Respuesta Correcta"]).strip().upper()

        # Validar formato de la respuesta correcta (debe ser A, B o C)
        # Soportar formatos como "OPCIÓN A", "OPCION A", "A", etc.
        if "A" in respuesta_correcta:
            clean_correct = "A"
        elif "B" in respuesta_correcta:
            clean_correct = "B"
        elif "C" in respuesta_correcta:
            clean_correct = "C"
        else:
            raise ValueError(
                f"Respuesta incorrecta inválida en la fila {q_id}: '{respuesta_correcta}'. "
                f"Debe ser A, B o C."
            )

        # Crear modelo de la pregunta (sin incluir la respuesta correcta por seguridad)
        question = Question(
            id=q_id,
            pregunta=pregunta,
            opcion_a=opcion_a,
            opcion_b=opcion_b,
            opcion_c=opcion_c
        )
        
        questions.append(question)
        correct_answers[q_id] = clean_correct

    if not questions:
        raise ValueError("El archivo Excel no contiene preguntas válidas o está vacío.")

    return questions, correct_answers
