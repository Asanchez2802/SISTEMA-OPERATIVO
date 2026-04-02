import { useState, useEffect } from "react";
import { ReporteTendido } from "@/entities/ReporteTendido";
import { GrupoTendido } from "@/entities/GrupoTendido";
import { format } from "date-fns";
import { Save, Upload, Camera, MapPin, Calculator, Users, ChevronDown } from "lucide-react";
import { uploadFile } from "@/utils";

export default function RegistrarTendido() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modoRegistro, setModoRegistro] = useState("grupo"); // "grupo" | "individual"
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const [form, setForm] = useState({
    grupo_id: "",
    grupo_nombre: "",
    tecnico_nombre: "", // para modo individual
    fecha: format(new Date(), "yyyy-MM-dd"),
    proyecto: "",
    cliente: "",
    zona: "",
    coordenada_inicial: "",
    coordenada_final: "",
    tipo_fibra: "ADSS",
    metraje_salida: "",
    metraje_liquidacion: "",
    metraje_meta: 1000,
    tiempo_horas: "",
    observaciones: "",
    estado: "completado",
    foto_url: "",
  });

  useEffect(() => {
    GrupoTendido.filter({ activo: true }, "nombre", 50).then(setGrupos);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleGrupo = (id) => {
    const g = grupos.find((g) => g.id === id);
    setGrupoSeleccionado(g || null);
    setForm((f) => ({ ...f, grupo_id: id, grupo_nombre: g?.nombre || "" }));
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await uploadFile(file, { isPublic: true });
      setForm((f) => ({ ...f, foto_url: url }));
    } catch (err) {
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const metrajeCalculado = Math.max(0, (Number(form.metraje_salida) || 0) - (Number(form.metraje_liquidacion) || 0));

  // Metraje por persona = metraje total / cantidad de integrantes del grupo
  const integrantes = grupoSeleccionado?.integrantes || [];
  const cantIntegrantes = modoRegistro === "grupo" ? (integrantes.length || 1) : 1;
  const metraje_por_persona = cantIntegrantes > 0 ? Math.round(metrajeCalculado / cantIntegrantes) : metrajeCalculado;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modoRegistro === "grupo" && !form.grupo_id) {
      alert("Selecciona un grupo");
      return;
    }
    if (modoRegistro === "individual" && !form.tecnico_nombre.trim()) {
      alert("Ingresa el nombre del técnico");
      return;
    }

    setLoading(true);

    const baseData = {
      ...form,
      metraje_salida: parseFloat(form.metraje_salida) || 0,
      metraje_liquidacion: parseFloat(form.metraje_liquidacion) || 0,
      metraje_tendido: metrajeCalculado,
      metraje_meta: parseFloat(form.metraje_meta) || 1000,
      tiempo_horas: parseFloat(form.tiempo_horas) || 0,
    };

    if (modoRegistro === "grupo" && integrantes.length > 0) {
      // Crear un registro por cada integrante del grupo con el metraje dividido
      const registros = integrantes.map((nombre) => ({
        ...baseData,
        tecnico_nombre: nombre,
        tecnico_id: `${form.grupo_id}_${nombre}`,
        metraje_tendido: metraje_por_persona,
        es_registro_grupo: true,
        grupo_nombre: form.grupo_nombre,
      }));
      await ReporteTendido.bulkCreate(registros);
    } else {
      // Registro individual
      await ReporteTendido.create({
        ...baseData,
        tecnico_id: `ind_${form.tecnico_nombre}`,
        es_registro_grupo: false,
      });
    }

    setSuccess(true);
    setLoading(false);
    setForm({
      grupo_id: "", grupo_nombre: "", tecnico_nombre: "",
      fecha: format(new Date(), "yyyy-MM-dd"), proyecto: "", cliente: "", zona: "",
      coordenada_inicial: "", coordenada_final: "", tipo_fibra: "ADSS",
      metraje_salida: "", metraje_liquidacion: "", metraje_meta: 1000,
      tiempo_horas: "", observaciones: "", estado: "completado", foto_url: "",
    });
    setGrupoSeleccionado(null);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 flex items-center gap-2 text-sm shadow-sm">
          ✅ {modoRegistro === "grupo" && integrantes.length > 0
            ? `Tendido registrado para ${integrantes.length} integrantes del ${form.grupo_nombre || "grupo"} (${metraje_por_persona}m c/u)`
            : "Registro de tendido guardado exitosamente"}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
          <Calculator className="w-6 h-6 text-white opacity-80" />
          <h2 className="text-xl font-bold text-white tracking-wide">Nuevo Control de Tendido</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* MODO DE REGISTRO */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Modo de Registro</h3>
            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => setModoRegistro("grupo")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${modoRegistro === "grupo" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                <Users className="w-4 h-4" /> Registro por Grupo
              </button>
              <button
                type="button"
                onClick={() => setModoRegistro("individual")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${modoRegistro === "individual" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                <ChevronDown className="w-4 h-4" /> Registro Individual
              </button>
            </div>

            {modoRegistro === "grupo" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Seleccionar Grupo *</label>
                  <select
                    value={form.grupo_id}
                    onChange={(e) => handleGrupo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  >
                    <option value="">Seleccionar grupo...</option>
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                </div>

                {grupoSeleccionado && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-2">Integrantes del {grupoSeleccionado.nombre}</p>
                    <div className="flex flex-wrap gap-2">
                      {grupoSeleccionado.integrantes.map((nombre, i) => (
                        <span key={i} className="bg-white border border-blue-200 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                          👤 {nombre}
                        </span>
                      ))}
                    </div>
                    {metrajeCalculado > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">
                          📊 Distribución: <strong>{metrajeCalculado}m ÷ {grupoSeleccionado.integrantes.length} personas = <span className="text-blue-800 text-sm">{metraje_por_persona}m por persona</span></strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del Técnico *</label>
                <input
                  type="text"
                  name="tecnico_nombre"
                  value={form.tecnico_nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo del técnico"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>
            )}
          </div>

          {/* INFORMACIÓN GENERAL */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Información General</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha *</label>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cliente</label>
                <input type="text" name="cliente" value={form.cliente} onChange={handleChange} placeholder="Nombre del cliente" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Proyecto / ODT</label>
                <input type="text" name="proyecto" value={form.proyecto} onChange={handleChange} placeholder="Referencia del proyecto" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Zona</label>
                <input type="text" name="zona" value={form.zona} onChange={handleChange} placeholder="Sector de trabajo" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border">
                  <option value="completado">Completado</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* METRAJES */}
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Control de Bobina y Metraje
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Metraje Salida (m) *</label>
                <input type="number" name="metraje_salida" value={form.metraje_salida} onChange={handleChange} required min="0" placeholder="Ej: 1500" className="w-full border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-white border font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Metraje Liquidación (m) *</label>
                <input type="number" name="metraje_liquidacion" value={form.metraje_liquidacion} onChange={handleChange} required min="0" placeholder="Ej: 200" className="w-full border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-white border font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {modoRegistro === "grupo" && integrantes.length > 0 ? `Total Tendido (÷${integrantes.length} = ${metraje_por_persona}m c/u)` : "Fibra Utilizada (Tendido)"}
                </label>
                <div className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-lg font-bold shadow-inner flex items-center justify-between font-mono">
                  <span>{metrajeCalculado}</span> <span className="text-blue-200 text-sm">metros</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meta Diaria (m)</label>
                <input type="number" name="metraje_meta" value={form.metraje_meta} onChange={handleChange} min="0" className="w-full border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-white border font-mono text-gray-500" />
              </div>
            </div>
          </div>

          {/* GEOREFERENCIA */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Georeferencia y Evidencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500"/> Coordenada Inicial</label>
                  <input type="text" name="coordenada_inicial" value={form.coordenada_inicial} onChange={handleChange} placeholder="-2.123, -79.456" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-green-500"/> Coordenada Final</label>
                  <input type="text" name="coordenada_final" value={form.coordenada_final} onChange={handleChange} placeholder="-2.124, -79.458" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border font-mono text-xs" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Observaciones</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} placeholder="Detalles, tipo de poste, obstáculos..." className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm bg-gray-50 border resize-none" />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Foto de Evidencia</label>
                <div className="flex-1 min-h-[120px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-gray-100 transition">
                  {form.foto_url ? (
                    <>
                      <img src={form.foto_url} alt="Evidencia" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm text-xs font-medium flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Cambiar
                          <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-6 text-gray-400 hover:text-blue-500 transition-colors">
                      {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" /> : <Camera className="w-8 h-8 mb-2" />}
                      <span className="text-xs font-medium text-center">{uploading ? "Subiendo..." : "Clic para subir foto"}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => window.history.back()} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading || uploading} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
              <Save className="w-5 h-5" />
              {loading ? "Guardando..." : "Confirmar Tendido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}