import { useState, useEffect } from "react";
import { OrdenInstalacion } from "@/entities/OrdenInstalacion";
import { Eye, ArrowRightCircle, CheckCircle2, Clock, MapPin, AlertCircle, Search, X } from "lucide-react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";

export default function InstalacionesPext() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);

  // Pagination
  const [pageSize, setPageSize] = useState("10");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await OrdenInstalacion.list("-createdAt", 200);
    // Solo mostramos las que están en PEXT
    setOrdenes(data.filter(o => o.estado === "PEXT"));
    setLoading(false);
  };

  const handleUpdateField = async (id, field, value) => {
    await OrdenInstalacion.update(id, { [field]: value });
    setOrdenes(ordenes.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleDerivar = async (id, toEstado) => {
    if (!confirm(`¿Estás seguro de mover esta orden a ${toEstado}?`)) return;
    const updateData = { estado: toEstado };
    if (toEstado === "INGENIERIA") updateData.fecha_derivacion_ing = format(new Date(), "yyyy-MM-dd");
    
    await OrdenInstalacion.update(id, updateData);
    setOrdenes(ordenes.filter(o => o.id !== id));
  };

  const filtradas = ordenes.filter(o => 
    (o.numero_orden || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.cliente || "").toLowerCase().includes(search.toLowerCase())
  );

  const displayed = pageSize === "all" ? filtradas : filtradas.slice(0, Number(pageSize));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Módulo PEXT</h2>
            <p className="text-sm text-gray-500">Gestión de planta externa, ruteo, tendido y fusión</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-64">
              <input type="text" placeholder="Buscar orden o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50">
              <option value="10">10 ord</option>
              <option value="20">20 ord</option>
              <option value="50">50 ord</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full"/></div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">No hay órdenes pendientes en PEXT.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Orden</th>
                  <th className="px-4 py-3 font-semibold">Cliente / Sede</th>
                  <th className="px-4 py-3 font-semibold">Plazos</th>
                  <th className="px-4 py-3 font-semibold">Asignado A</th>
                  <th className="px-4 py-3 font-semibold text-center">Progreso (R - T - F)</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado Ref</th>
                  <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((o) => {
                  const fIngreso = o.fecha_ingreso ? parseISO(o.fecha_ingreso) : new Date();
                  const fFinal = addDays(fIngreso, o.plazo_dias || 3);
                  const diasRestantes = differenceInDays(fFinal, new Date());
                  
                  const isUrgente = o.prioridad === "Urgente" || diasRestantes <= 0;
                  const progresoText = (o.pext_ruteo && o.pext_tendido && o.pext_fusion) ? "Listo para derivar" : 
                                       (o.pext_ruteo || o.pext_tendido || o.pext_fusion) ? "En proceso" : "Pendiente";
                  
                  return (
                    <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-800">{o.numero_orden}</span>
                        <div className="text-xs text-gray-500">{o.fecha_ingreso}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800 block truncate max-w-[150px]">{o.cliente}</span>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{o.sede} | {o.tipo_servicio}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 text-xs font-bold ${diasRestantes < 0 ? 'text-red-600' : diasRestantes === 0 ? 'text-orange-500' : 'text-green-600'}`}>
                          <Clock className="w-3.5 h-3.5" /> 
                          {diasRestantes < 0 ? `Vencido (${Math.abs(diasRestantes)}d)` : diasRestantes === 0 ? 'Vence Hoy' : `Quedan ${diasRestantes} d`}
                        </div>
                        {isUrgente && <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Urgente</span>}
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          placeholder="Nombre asignado" 
                          value={o.asignado_a || ""} 
                          onChange={(e) => handleUpdateField(o.id, "asignado_a", e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <label className="flex flex-col items-center gap-1 cursor-pointer" title="Ruteo">
                            <input type="checkbox" checked={o.pext_ruteo || false} onChange={(e) => handleUpdateField(o.id, "pext_ruteo", e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            <span className="text-[10px] text-gray-500 font-bold">R</span>
                          </label>
                          <label className="flex flex-col items-center gap-1 cursor-pointer" title="Tendido">
                            <input type="checkbox" checked={o.pext_tendido || false} onChange={(e) => handleUpdateField(o.id, "pext_tendido", e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            <span className="text-[10px] text-gray-500 font-bold">T</span>
                          </label>
                          <label className="flex flex-col items-center gap-1 cursor-pointer" title="Fusión">
                            <input type="checkbox" checked={o.pext_fusion || false} onChange={(e) => handleUpdateField(o.id, "pext_fusion", e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                            <span className="text-[10px] text-gray-500 font-bold">F</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${progresoText === 'Listo para derivar' ? 'bg-green-100 text-green-700' : progresoText === 'En proceso' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {progresoText}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewing(o)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalles">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDerivar(o.id, "INGENIERIA")} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Derivar a Ingeniería">
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDerivar(o.id, "COMPLETADO")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Cerrar como Completado">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal View Details (Ojito) */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Orden: {viewing.numero_orden}</h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
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
                <p className="text-xs text-gray-500 mb-1">Fechas y Prioridad</p>
                <p className="font-medium text-red-600">Prioridad: {viewing.prioridad}</p>
                <p className="text-gray-600">Ingresó: {viewing.fecha_ingreso}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Comentarios</p>
                <p className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">{viewing.comentario || "Sin comentarios."}</p>
              </div>
              {viewing.foto_fachada_url && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Foto Fachada</p>
                  <img src={viewing.foto_fachada_url} alt="Fachada" className="w-full h-48 object-cover rounded-lg border" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}