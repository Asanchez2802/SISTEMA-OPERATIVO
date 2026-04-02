import { useState, useEffect } from "react";
import { OrdenInstalacion } from "@/entities/OrdenInstalacion";
import { ConfiguracionApp } from "@/entities/ConfiguracionApp";
import { format } from "date-fns";
import { Save, Camera, MapPin, Upload } from "lucide-react";
import { uploadFile } from "@/utils";

export default function InstalacionesRegistro() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    numero_orden: "",
    fecha_ingreso: format(new Date(), "yyyy-MM-dd"),
    cliente: "",
    sede: "",
    celular: "",
    contrato_tiene: false,
    plan: "",
    capacidad_modulo: "",
    equipo: "",
    foto_fachada_url: "",
    coordenadas: "",
    comentario: "",
    asesor: "",
    tipo_servicio: "",
    prioridad: "Normal",
    plazo_dias: 3,
    estado: "PEXT"
  });

  useEffect(() => {
    ConfiguracionApp.list("-createdAt", 1).then(confs => {
      if (confs.length > 0) setConfig(confs[0]);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await uploadFile(file, { isPublic: true });
      setForm(f => ({ ...f, foto_fachada_url: url }));
    } catch (err) {
      alert("Error al subir foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await OrdenInstalacion.create({ ...form, plazo_dias: Number(form.plazo_dias) });
    setSuccess(true);
    setLoading(false);
    
    // Reset Form
    setForm({
      numero_orden: "", fecha_ingreso: format(new Date(), "yyyy-MM-dd"), cliente: "",
      sede: "", celular: "", contrato_tiene: false, plan: "", capacidad_modulo: "",
      equipo: "", foto_fachada_url: "", coordenadas: "", comentario: "",
      asesor: "", tipo_servicio: "", prioridad: "Normal", plazo_dias: 3, estado: "PEXT"
    });
    setTimeout(() => setSuccess(false), 3000);
  };

  const asesores = config?.asesores || ["Asesor 1", "Asesor 2"];
  const capacidades = config?.capacidades_modulo || ["8", "16", "32", "64"];
  const tiposServ = config?.tipos_servicio || ["FTTH", "HFC", "Cobre", "Radio Enlace"];
  const planes = config?.planes || ["Básico", "Avanzado", "Premium", "Empresarial"];
  const prioridades = config?.prioridades || ["Baja", "Normal", "Alta", "Urgente"];

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Registrar Orden de Instalación</h2>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200 shadow-sm animate-in fade-in">
          ✅ Orden registrada correctamente. Ha sido derivada a PEXT.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-b pb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">N° Orden *</label>
              <input required type="text" name="numero_orden" value={form.numero_orden} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Ingreso *</label>
              <input required type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente *</label>
              <input required type="text" name="cliente" value={form.cliente} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-b pb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sede</label>
              <input type="text" name="sede" value={form.sede} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Celular</label>
              <input type="tel" name="celular" value={form.celular} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input type="checkbox" name="contrato_tiene" checked={form.contrato_tiene} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                ¿Tiene contrato firmado?
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 border-b pb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Asesor</label>
              <select name="asesor" value={form.asesor} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {asesores.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
              <select name="plan" value={form.plan} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {planes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Servicio</label>
              <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {tiposServ.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cap. Módulo</label>
              <select name="capacidad_modulo" value={form.capacidad_modulo} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {capacidades.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-b pb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo a instalar</label>
              <input type="text" name="equipo" value={form.equipo} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridad</label>
              <select name="prioridad" value={form.prioridad} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500">
                {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo de Instalación (Días)</label>
              <select name="plazo_dias" value={form.plazo_dias} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500">
                {[1,2,3,4,5,7,10,15].map(d => <option key={d} value={d}>{d} días</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500"/> Coordenadas GPS</label>
                <input type="text" name="coordenadas" value={form.coordenadas} onChange={handleChange} placeholder="Lat, Lng" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Comentarios / Observaciones</label>
                <textarea rows={3} name="comentario" value={form.comentario} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Foto Fachada</label>
              <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-gray-100 transition">
                {form.foto_fachada_url ? (
                  <>
                    <img src={form.foto_fachada_url} alt="Fachada" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg text-xs font-medium"><Upload className="w-3 h-3 inline"/> Cambiar<input type="file" className="hidden" accept="image/*" onChange={handleFile} /></label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500">
                    {uploading ? <div className="animate-spin w-6 h-6 border-b-2 border-blue-500 rounded-full mb-1" /> : <Camera className="w-6 h-6 mb-1" />}
                    <span className="text-xs font-medium text-center">{uploading ? "Subiendo..." : "Subir Foto"}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={loading || uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
              {loading ? "Registrando..." : "Derivar a PEXT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}