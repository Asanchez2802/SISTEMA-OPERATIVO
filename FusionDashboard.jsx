import { useState, useEffect } from "react";
import { OrdenInstalacion } from "@/entities/OrdenInstalacion";
import { Search, MapPin, Eye, CheckCircle2, Calendar, FileText } from "lucide-react";

export default function InstalacionesCompletados() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await OrdenInstalacion.list("-createdAt", 500);
    // Solo mostramos las que están en COMPLETADO
    setOrdenes(data.filter(o => o.estado === "COMPLETADO"));
    setLoading(false);
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
            <h2 className="text-xl font-bold text-green-700">Órdenes Completadas</h2>
            <p className="text-sm text-gray-500">Histórico de servicios cerrados y activados</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="Buscar por orden o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-b-2 border-green-600 rounded-full"/></div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500 flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
          <p>No se encontraron órdenes completadas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-green-50 text-green-900 border-b border-green-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">N° Orden</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Servicio / Plan</th>
                  <th className="px-5 py-3 font-semibold text-center">Fecha Ingreso</th>
                  <th className="px-5 py-3 font-semibold text-center">Fecha Activación</th>
                  <th className="px-5 py-3 font-semibold">Activado Por</th>
                  <th className="px-5 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map((o) => (
                  <tr key={o.id} className="hover:bg-green-50/20 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        {o.numero_orden}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">{o.cliente}</p>
                      <p className="text-xs text-gray-500">{o.sede || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-700">{o.tipo_servicio}</p>
                      <p className="text-xs text-gray-500">{o.plan || "-"}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-600 font-mono text-xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {o.fecha_ingreso}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-green-700 font-mono font-bold text-xs bg-green-50 px-2 py-1 rounded-full border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        {o.fecha_activacion || o.fecha_ingreso}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm">
                      {o.activado_por || "-"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => setViewing(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors" title="Ver Detalles">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal View Details (Ojito) */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" /> Orden Completada: {viewing.numero_orden}
              </h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:bg-gray-200 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Cliente</p>
                  <p className="font-bold text-gray-800 text-base">{viewing.cliente}</p>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">📞 {viewing.celular || "Sin celular"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Servicio / Plan</p>
                  <p className="font-medium text-gray-800">{viewing.tipo_servicio} - {viewing.plan}</p>
                  <p className="text-gray-600 mt-0.5">Equipo: {viewing.equipo || "-"} | Cap: {viewing.capacidad_modulo}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Ubicación</p>
                  <p className="font-medium text-gray-800">{viewing.sede || "-"}</p>
                  <p className="text-blue-600 flex items-center gap-1 mt-1 font-mono text-xs"><MapPin className="w-3.5 h-3.5"/> {viewing.coordenadas || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs text-green-800 mb-2 uppercase tracking-wider font-bold">Línea de Tiempo</p>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-green-200/50 pb-1">
                      <span className="text-gray-600">Ingresó:</span>
                      <span className="font-mono font-medium">{viewing.fecha_ingreso}</span>
                    </div>
                    {viewing.fecha_derivacion_ing && (
                      <div className="flex justify-between border-b border-green-200/50 pb-1">
                        <span className="text-gray-600">A Ingeniería:</span>
                        <span className="font-mono font-medium">{viewing.fecha_derivacion_ing}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1">
                      <span className="text-green-800 font-bold">Activación:</span>
                      <span className="font-mono font-bold text-green-700">{viewing.fecha_activacion || "-"}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-xs">
                      <span className="text-gray-600">Por:</span>
                      <span className="font-medium text-gray-800">{viewing.activado_por || "-"}</span>
                    </div>
                  </div>
                </div>

                {viewing.comentario && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Comentarios Registrados</p>
                    <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-gray-700 leading-relaxed">{viewing.comentario}</p>
                  </div>
                )}
              </div>
              
              {viewing.foto_fachada_url && (
                <div className="col-span-2 mt-2">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Foto Fachada</p>
                  <img src={viewing.foto_fachada_url} alt="Fachada" className="w-full h-64 object-cover rounded-xl border shadow-sm" />
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button onClick={() => setViewing(null)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({className}) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; }