from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Question(BaseModel):
    id: int = Field(..., description="ID único de la pregunta (1-indexed)")
    pregunta: str = Field(..., description="El texto de la pregunta")
    opcion_a: str = Field(..., description="Opción A")
    opcion_b: str = Field(..., description="Opción B")
    opcion_c: str = Field(..., description="Opción C")

class QuestionResult(BaseModel):
    id: int
    pregunta: str
    opcion_a: str
    opcion_b: str
    opcion_c: str
    respuesta_usuario: Optional[str] = Field(None, description="La respuesta seleccionada por el usuario (A, B, C o None)")
    respuesta_correcta: str = Field(..., description="La respuesta correcta real (A, B o C)")
    es_correcta: bool = Field(..., description="Indica si la respuesta del usuario es correcta")

class QuizResult(BaseModel):
    correctas: int = Field(..., description="Cantidad de respuestas correctas")
    incorrectas: int = Field(..., description="Cantidad de respuestas incorrectas")
    total: int = Field(..., description="Total de preguntas evaluadas")
    porcentaje_aprobacion: float = Field(..., description="Porcentaje de aciertos (0-100)")
    aprobado: bool = Field(..., description="Indica si aprobó con >= 75%")
    detalles: List[QuestionResult] = Field(..., description="Detalle de cada pregunta calificada")
    fecha: str = Field(..., description="Fecha y hora de la evaluación")

class AnswerSubmission(BaseModel):
    question_id: int
    respuesta: Optional[str] = None  # Puede ser "A", "B", "C" o vacío si no se contestó

class QuizSubmission(BaseModel):
    session_id: str
    respuestas: List[AnswerSubmission]
