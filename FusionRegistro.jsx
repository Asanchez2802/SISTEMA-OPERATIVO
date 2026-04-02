import { useState, useEffect } from "react";
import { OrdenInstalacion } from "@/entities/OrdenInstalacion";
import { Eye, CheckCircle2, Search, X, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function InstalacionesIngenieria() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  
  // Culminar Modal
  const [culminando, setCulminando] = useState(null);
  const [formCulminar, setFormCulminar] = useState({
    fecha_activacion: format(new Date(), "yyyy-MM-dd"),
    activado_por: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await OrdenInstalacion.list("-createdAt", 200);
    // Solo mostramos las que están en INGENIERIA
    setOrdenes(data.filter(o => o.estado === "INGENIERIA"));
    setLoading(false);
  };

  const handleUpdateField = async (id, field, value) => {
    await OrdenInstalacion.update(id, { [field]: value });
    setOrdenes(ordenes.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const submitCulminar = async (e) => {
    e.preventDefault();
    if (!culminando) return;
    
    await OrdenInstalacion.update(culminando.id, { 
      estado: "COMPLETADO",
      fecha_activacion: formCulminar.fecha_activacion,
      activado_por: formCulminar.activado_por
    });
    
    setOrdenes(ordenes.filter(o => o.id !== culminando.id));
    setCulminando(null);
  };

  const filtradas = ordenes.filter(o => 
    (o.numero_orden || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.cliente || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-purple-800">Módulo Ingeniería</h2>
            <p className="text-sm text-gray-500">Activaciones y validaciones de servicio en central</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="Buscar orden o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-b-2 border-purple-600 rounded-full"/></div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">No hay órdenes derivadas a Ingeniería.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-purple-50 text-purple-900 border-b border-purple-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Orden</th>
                  <th className="px-4 py-3 font-semibold">Cliente / Sede</th>
                  <th className="px-4 py-3 font-semibold">Servicio / Capacidad</th>
                  <th className="px-4 py-3 font-semibold">Derivado el</th>
                  <th className="px-4 py-3 font-semibold">Asignado A</th>
                  <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map((o) => (
                  <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">{o.numero_orden}</span>
                      {o.prioridad === "Urgente" && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded uppercase font-bold">Urg</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800 block truncate max-w-[150px]">{o.cliente}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[150px] block">{o.sede}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-700">{o.tipo_servicio} - {o.plan}</div>
                      <div className="text-xs text-purple-600">Eq: {o.equipo || "-"} | Cap: {o.capacidad_modulo || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {o.fecha_derivacion_ing || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        placeholder="Ingeniero asignado" 
                        value={o.asignado_a || ""} 
                        onChange={(e) => handleUpdateField(o.id, "asignado_a", e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewing(o)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalles">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCulminando(o)} className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1.5 rounded text-xs font-bold transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Culminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Culminar */}
      {culminando && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-green-50 flex justify-between items-center">
              <h3 className="font-bold text-green-800">Activar y Culminar Orden</h3>
              <button onClick={() => setCulminando(null)} className="text-green-600 hover:text-green-800"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={submitCulminar} className="p-5 space-y-4">
              <p className="text-sm text-gray-600 mb-2">Orden: <strong className="text-gray-800">{culminando.numero_orden}</strong></p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de Activación *</label>
                <input type="date" required value={formCulminar.fecha_activacion} onChange={(e) => setFormCulminar({...formCulminar, fecha_activacion: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Activado Por *</label>
                <input type="text" required placeholder="Nombre de quien activó" value={formCulminar.activado_por} onChange={(e) => setFormCulminar({...formCulminar, activado_por: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setCulminando(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow">Confirmar Cierre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Details (Ojito) - Reutilizado pero básico para visualizar */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Orden: {viewing.numero_orden}</h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="font-bold text-gray-800">{viewing.cliente}</p>
                <p className="text-gray-600">{viewing.celular || "Sin celular"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Sede / Coordenadas</p>
                <p className="font-medium">{viewing.sede || "-"}</p>
                <p className="text-blue-600 flex items-center gap-1"><MapPin className="w-3 h-3"/> {viewing.coordenadas || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Servicio / Plan</p>
                <p className="font-medium">{viewing.tipo_servicio} - {viewing.plan}</p>
                <p className="text-gray-600">Capacidad: {viewing.capacidad_modulo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fechas</p>
                <p className="text-gray-600">Ingresó: {viewing.fecha_ingreso}</p>
                <p className="text-gray-600">Derivada Ing: {viewing.fecha_derivacion_ing}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Comentarios</p>
                <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">{viewing.comentario || "Sin comentarios."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}