import { useState, useEffect } from "react";
import { ReporteTendido } from "@/entities/ReporteTendido";
import { Search, Trash2, Calendar, MapPin, Eye, Edit, Save, X, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";

export default function Historial() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modales
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Cargamos muchos para filtrar localmente y manejar la paginación rápido
    const data = await ReporteTendido.list("-fecha", 500);
    setReportes(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este reporte?")) {
      await ReporteTendido.delete(id);
      loadData();
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    const calc = Math.max(0, (Number(editing.metraje_salida) || 0) - (Number(editing.metraje_liquidacion) || 0));
    const toSave = { ...editing, metraje_tendido: calc };
    await ReporteTendido.update(editing.id, toSave);
    setEditing(null);
    loadData();
  };

  const filtrados = reportes.filter((r) => {
    const sMatch = (r.tecnico_nombre || "").toLowerCase().includes(search.toLowerCase()) || 
                   (r.proyecto || "").toLowerCase().includes(search.toLowerCase()) ||
                   (r.cliente || "").toLowerCase().includes(search.toLowerCase());
    
    // Filtrado de fechas
    let dMatch = true;
    if (startDate && endDate && r.fecha) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const repDate = parseISO(r.fecha);
      dMatch = repDate >= start && repDate <= end;
    }

    return sMatch && dMatch;
  });

  const totalPages = pageSize === "all" ? 1 : Math.ceil(filtrados.length / Number(pageSize));
  const pageData = pageSize === "all" ? filtrados : filtrados.slice((page - 1) * Number(pageSize), page * Number(pageSize));

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, startDate, endDate, pageSize]);

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600"/> Registro de Producción
          </h2>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input type="text" placeholder="Buscar por técnico, proyecto, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
              <span className="text-gray-400">a</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : pageData.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No se encontraron reportes en este período.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 font-semibold">Técnico</th>
                  <th className="px-5 py-3 font-semibold">Cliente / Proyecto</th>
                  <th className="px-5 py-3 font-semibold text-right">M. Salida</th>
                  <th className="px-5 py-3 font-semibold text-right">M. Liquidación</th>
                  <th className="px-5 py-3 font-semibold text-right text-blue-600">Tendido</th>
                  <th className="px-5 py-3 font-semibold text-center">Evidencia</th>
                  <th className="px-5 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-5 py-3 text-gray-600 font-medium">{r.fecha}</td>
                    <td className="px-5 py-3 text-gray-800 font-semibold">{r.tecnico_nombre}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.cliente && <span className="font-medium">{r.cliente}</span>}
                      {r.cliente && r.proyecto && " - "}
                      {r.proyecto && <span className="text-gray-500">{r.proyecto}</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 font-mono">{r.metraje_salida || 0}</td>
                    <td className="px-5 py-3 text-right text-gray-500 font-mono">{r.metraje_liquidacion || 0}</td>
                    <td className="px-5 py-3 text-right font-bold text-blue-600 font-mono bg-blue-50/30">
                      {r.metraje_tendido || 0} <span className="text-xs text-blue-400 font-normal">m</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {r.foto_url ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                          <ImageIcon className="w-3 h-3" /> Sí
                        </span>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewing(r)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Ver Detalles">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditing(r)} className="p-1.5 text-orange-500 hover:bg-orange-100 rounded" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div className="px-5 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Mostrar</span>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="border-gray-300 rounded px-2 py-1 focus:ring-blue-500">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Todos</option>
            </select>
            <span>registros de {filtrados.length}</span>
          </div>

          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 px-3">
                Página {page} de {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal VIEW (Ojito) */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                Detalle del Tendido <span className="text-sm font-normal text-gray-500">#{viewing.id.slice(-5)}</span>
              </h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><p className="text-xs text-gray-500 mb-1">Técnico</p><p className="font-bold text-gray-800">{viewing.tecnico_nombre}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500 mb-1">Fecha</p><p className="font-medium">{viewing.fecha}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Estado</p><p className="font-medium text-green-600">{viewing.estado}</p></div>
                </div>
                <div><p className="text-xs text-gray-500 mb-1">Cliente / Proyecto</p><p className="font-medium">{viewing.cliente || "-"} / {viewing.proyecto || "-"}</p></div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 uppercase mb-3">Bobina y Metraje</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Salida</span>
                    <span className="font-mono font-medium">{viewing.metraje_salida || 0} m</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Liquidación</span>
                    <span className="font-mono font-medium">{viewing.metraje_liquidacion || 0} m</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm font-bold text-blue-900">Total Utilizado</span>
                    <span className="font-mono font-bold text-blue-700 text-lg">{viewing.metraje_tendido || 0} m</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm border">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Coordenadas</p>
                  <p className="text-gray-700 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500"/> {viewing.coordenada_inicial || "No registradas"}</p>
                  <p className="text-gray-700 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-green-500"/> {viewing.coordenada_final || "-"}</p>
                </div>
              </div>
              
              <div className="space-y-4 flex flex-col">
                <div className="flex-1 bg-gray-100 rounded-xl border overflow-hidden min-h-[200px] flex flex-col">
                  {viewing.foto_url ? (
                    <img src={viewing.foto_url} alt="Evidencia" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">Sin evidencia fotográfica</p>
                    </div>
                  )}
                </div>
                {viewing.observaciones && (
                  <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Comentarios</p>
                    <p className="text-sm text-gray-700">{viewing.observaciones}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal EDITAR */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Editar Registro</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Metraje Salida (m)</label>
                  <input type="number" required value={editing.metraje_salida || ""} onChange={(e) => setEditing({...editing, metraje_salida: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Metraje Liquidación (m)</label>
                  <input type="number" required value={editing.metraje_liquidacion || ""} onChange={(e) => setEditing({...editing, metraje_liquidacion: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Coordenada Inicial</label>
                  <input type="text" value={editing.coordenada_inicial || ""} onChange={(e) => setEditing({...editing, coordenada_inicial: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Coordenada Final</label>
                  <input type="text" value={editing.coordenada_final || ""} onChange={(e) => setEditing({...editing, coordenada_final: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
                <textarea rows={2} value={editing.observaciones || ""} onChange={(e) => setEditing({...editing, observaciones: e.target.value})} className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md">Actualizar Datos</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function History({className}) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>; }