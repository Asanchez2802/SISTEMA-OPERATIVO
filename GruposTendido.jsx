import { useState, useEffect } from "react";
import { ReporteFusion } from "@/entities/ReporteFusion";
import { Tecnico } from "@/entities/Tecnico";
import { ConfiguracionApp } from "@/entities/ConfiguracionApp";
import { format } from "date-fns";
import { Save, AlertTriangle, Calculator, UserPlus } from "lucide-react";

function calcularHilos(str) {
  if (!str) return 0;
  const partes = str.split(',').map(s => s.trim());
  let total = 0;
  partes.forEach(p => {
    if (p.includes('-')) {
      const [start, end] = p.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        total += (end - start + 1);
      }
    } else {
      const val = Number(p);
      if (!isNaN(val)) total += 1;
    }
  });
  return total;
}

export default function FusionFormulario() {
  const [tecnicos, setTecnicos] = useState([]);
  const [tiposTrabajo, setTiposTrabajo] = useState(["Empalme", "Mantenimiento", "Derivación", "Corte"]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const [form, setForm] = useState({
    fecha: format(new Date(), "yyyy-MM-dd"),
    fusionador_id: "",
    fusionador_nombre: "",
    orden_trabajo: "",
    id_mufa: "",
    tipo_trabajo: "",
    cierre_final: false,
    hilos_trabajados: "",
    reapertura_detectada: false,
    up: "Normal"
  });

  useEffect(() => {
    Tecnico.filter({ estado: "activo" }, "nombre", 100).then(setTecnicos);
    ConfiguracionApp.list("-createdAt", 1).then(confs => {
      if (confs.length > 0 && confs[0].tipos_trabajo_fusion) {
        setTiposTrabajo(confs[0].tipos_trabajo_fusion);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFusionador = (id) => {
    const t = tecnicos.find((t) => t.id === id);
    setForm(f => ({
      ...f,
      fusionador_id: id,
      fusionador_nombre: t ? `${t.nombre} ${t.apellido}` : ""
    }));
  };

  const cantidadHilos = calcularHilos(form.hilos_trabajados);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWarningMsg("");
    setSuccessMsg("");

    try {
      let prodNeta = cantidadHilos;

      if (form.reapertura_detectada) {
        // Buscar el último reporte de esa MUFA para descontarle
        const prevReports = await ReporteFusion.filter({ id_mufa: form.id_mufa }, "-createdAt", 5);
        if (prevReports.length > 0) {
          // Tomar el más reciente que no sea del mismo técnico
          const prevTech = prevReports.find(r => r.fusionador_id !== form.fusionador_id);
          if (prevTech) {
            const nuevaProd = Math.max(0, (prevTech.produccion_neta || 0) - cantidadHilos);
            await ReporteFusion.update(prevTech.id, { produccion_neta: nuevaProd });
            setWarningMsg(`Reapertura detectada. Se han descontado ${cantidadHilos} hilos al técnico anterior: ${prevTech.fusionador_nombre}.`);
          } else {
            setWarningMsg("Reapertura marcada, pero no se encontró otro técnico previo en esta mufa para descontar.");
          }
        }
      }

      await ReporteFusion.create({
        ...form,
        cantidad_hilos: cantidadHilos,
        produccion_neta: prodNeta
      });
      
      if (!form.reapertura_detectada) setSuccessMsg("Fusión registrada exitosamente.");

      // Reset
      setForm({
        ...form,
        orden_trabajo: "",
        id_mufa: "",
        cierre_final: false,
        hilos_trabajados: "",
        reapertura_detectada: false
      });
      setTimeout(() => { setSuccessMsg(""); setWarningMsg(""); }, 6000);
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-800">Formulario de Fusión</h2>
      </div>

      {successMsg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200">✅ {successMsg}</div>}
      {warningMsg && <div className="bg-orange-50 text-orange-800 px-4 py-3 rounded-lg border border-orange-200 flex gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0" /> {warningMsg}</div>}

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b pb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha *</label>
              <input type="date" required name="fecha" value={form.fecha} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fusionador *</label>
              <select required name="fusionador_id" value={form.fusionador_id} onChange={(e) => handleFusionador(e.target.value)} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 bg-gray-50 border">
                <option value="">Seleccionar técnico...</option>
                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Orden de Trabajo (OT) *</label>
              <input type="text" required name="orden_trabajo" value={form.orden_trabajo} onChange={handleChange} placeholder="N° de OT" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ID de Mufa *</label>
              <input type="text" required name="id_mufa" value={form.id_mufa} onChange={handleChange} placeholder="Identificador de la Mufa" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 uppercase" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b pb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Trabajo</label>
              <select name="tipo_trabajo" value={form.tipo_trabajo} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500">
                <option value="">Seleccionar...</option>
                {tiposTrabajo.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">UP (Unidad de Producción)</label>
              <select name="up" value={form.up} onChange={handleChange} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500">
                <option value="Normal">Normal</option>
                <option value="Emergencia">Emergencia</option>
                <option value="Proyecto Especial">Proyecto Especial</option>
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                Hilos Trabajados (Separar con coma y guion) * 
                <span className="font-normal text-gray-400 text-[10px] ml-2">Ej: "1-12, 15, 20-24"</span>
              </label>
              <div className="flex gap-4 items-start">
                <input type="text" required name="hilos_trabajados" value={form.hilos_trabajados} onChange={handleChange} placeholder="1-12, 15, 20-24" className="flex-1 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-orange-500 font-mono shadow-sm border bg-white" />
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center justify-center min-w-[120px]">
                  <Calculator className="w-4 h-4 text-orange-500 mr-2" />
                  <span className="font-bold text-orange-700 text-lg leading-none">{cantidadHilos}</span>
                  <span className="text-xs text-orange-600 ml-1">hilos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pb-2">
            <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${form.cierre_final ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
              <input type="checkbox" name="cierre_final" checked={form.cierre_final} onChange={handleChange} className="w-5 h-5 text-green-600 rounded" />
              <div>
                <span className="block font-semibold text-gray-800 text-sm">Cierre Final de Mufa</span>
                <span className="text-xs text-gray-500">Marca si la mufa quedó sellada.</span>
              </div>
            </label>
            
            <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${form.reapertura_detectada ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
              <input type="checkbox" name="reapertura_detectada" checked={form.reapertura_detectada} onChange={handleChange} className="w-5 h-5 text-red-600 rounded" />
              <div>
                <span className="block font-semibold text-gray-800 text-sm flex items-center gap-1">
                  Reapertura Detectada <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </span>
                <span className="text-xs text-gray-500 leading-tight">Mufa ya trabajada mal. Descuenta producción al técnico anterior.</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50">
              <Save className="w-5 h-5 inline mr-2" />
              {loading ? "Guardando..." : "Registrar Fusión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}