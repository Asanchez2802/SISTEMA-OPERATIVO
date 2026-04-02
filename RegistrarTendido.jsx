{
  "name": "GrupoTendido",
  "type": "object",
  "properties": {
    "nombre": {
      "type": "string",
      "description": "Nombre del grupo (ej: Grupo 1, Grupo Alpha)"
    },
    "integrantes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Lista de nombres de los integrantes del grupo"
    },
    "activo": {
      "type": "boolean",
      "default": true
    },
    "descripcion": {
      "type": "string"
    }
  },
  "required": ["nombre", "integrantes"]
}