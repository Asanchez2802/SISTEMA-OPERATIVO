{
  "name": "ReporteFusion",
  "type": "object",
  "properties": {
    "fecha": { "type": "string", "format": "date" },
    "fusionador_id": { "type": "string" },
    "fusionador_nombre": { "type": "string" },
    "orden_trabajo": { "type": "string" },
    "id_mufa": { "type": "string" },
    "tipo_trabajo": { "type": "string" },
    "cierre_final": { "type": "boolean", "default": false },
    "hilos_trabajados": { "type": "string", "description": "Ej: 1-12, 15" },
    "cantidad_hilos": { "type": "number", "default": 0 },
    "reapertura_detectada": { "type": "boolean", "default": false },
    "up": { "type": "string" },
    "produccion_neta": { "type": "number", "default": 0 }
  },
  "required": ["fecha", "fusionador_nombre", "orden_trabajo", "id_mufa"]
}