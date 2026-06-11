import pandas as pd
import os

def generate_excel_sample():
    filename = "plantilla_preguntas.xlsx"
    
    # Datos de ejemplo
    data = {
        "Pregunta": [
            "¿Cuál de las siguientes cláusulas SQL se utiliza para filtrar grupos de resultados devueltos por GROUP BY?",
            "En el diseño de bases de datos relacionales, ¿qué representa una Clave Primaria (Primary Key)?",
            "¿Cuál es el propósito principal del comando git merge?",
            "¿Qué tipo de indexación en bases de datos es mejor para búsquedas de rangos de valores?",
            "En arquitecturas REST, ¿cuál es el método HTTP correcto para actualizar parcialmente un recurso existente?",
            "¿Cuál es el principal beneficio de la compilación JIT (Just-In-Time)?",
            "En Python, ¿qué estructura de datos es mutable?",
            "¿Qué comando SQL se utiliza para agregar una nueva columna a una tabla existente?"
        ],
        "Opción A": [
            "WHERE",
            "Un campo que almacena contraseñas cifradas.",
            "Guardar los cambios en el repositorio remoto.",
            "Índice Clusterizado (B-Tree)",
            "PUT",
            "Reducir el espacio de almacenamiento del ejecutable.",
            "Tupla",
            "UPDATE TABLE",
        ],
        "Opción B": [
            "HAVING",
            "Un identificador único para cada registro en una tabla.",
            "Integrar cambios de una rama de desarrollo en otra rama activa.",
            "Índice Hash",
            "PATCH",
            "Mejorar la velocidad de ejecución de código en tiempo de ejecución.",
            "Lista",
            "ALTER TABLE ADD",
        ],
        "Opción C": [
            "ORDER BY",
            "Un campo que enlaza dos tablas distintas (Foreign Key).",
            "Crear una copia exacta del repositorio local.",
            "Índice Full-Text",
            "POST",
            "Garantizar la seguridad de red en la ejecución.",
            "Diccionario (solo las claves)",
            "INSERT INTO COLUMN",
        ],
        "Respuesta Correcta": [
            "B",
            "B",
            "B",
            "A",
            "B",
            "B",
            "B",
            "B"
        ]
    }

    df = pd.DataFrame(data)
    
    print(f"Generando plantilla de ejemplo en Excel: '{filename}'...")
    
    try:
        # Guardar como Excel
        df.to_excel(filename, index=False, sheet_name="Preguntas")
        print("¡Éxito! Archivo creado exitosamente.")
        print(f"Ruta completa: {os.path.abspath(filename)}")
        print("\nColumnas incluidas:")
        for col in df.columns:
            print(f" - {col}")
    except Exception as e:
        print(f"Error al generar el archivo Excel: {e}")

if __name__ == "__main__":
    generate_excel_sample()
