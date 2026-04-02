import { useState, useEffect } from "react";
import { ReporteFusion } from "@/entities/ReporteFusion";
import { Search, Calendar, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function FusionRegistro() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await ReporteFusion.list("-createdAt", 500);
    setReportes(data);
    setLoading(false);
  };

  const filtrados = reportes.filter(r => 
    (r.fusionador_nombre || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.orden_trabajo || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.id_mufa || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-orange-700">Registro Diario de Fusión</h2>
            <p className="text-sm text-gray-500">Histórico de todas las fusiones realizadas</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <input type="text" placeholder="Buscar técnico, OT, mufa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-b-2 border-orange-600 rounded-full"/></div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500 flex flex-col items-center">
          <Activity className="w-12 h-12 text-gray-300 mb-3" />
          <p>No se encontraron registros de fusión.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-orange-50 text-orange-900 border-b border-orange-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Fusionador</th>
                  <th className="px-4 py-3 font-semibold">OT / Mufa</th>
                  <th className="px-4 py-3 font-semibold">Trabajo / UP</th>
                  <th className="px-4 py-3 font-semibold text-center">Hilos Rango / Cantidad</th>
                  <th className="px-4 py-3 font-semibold text-center">Cierre</th>
                  <th className="px-4 py-3 font-semibold text-center">Reapertura</th>
                  <th className="px-4 py-3 font-semibold text-right text-orange-700">Prod. Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id.slice(-5).toUpperCase()}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>{r.fecha}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">{r.fusionador_nombre}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.orden_trabajo}</p>
                      <p className="text-xs text-gray-500 uppercase">{r.id_mufa}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{r.tipo_trabajo || "-"}</p>
                      <p className="text-xs text-gray-500">{r.up || "Normal"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 rounded mb-1 border border-gray-200">{r.hilos_trabajados}</span>
                        <span className="font-bold text-gray-800">{r.cantidad_hilos} hilos</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.cierre_final ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.reapertura_detectada ? <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" title="Descontado a anterior" /> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-black text-lg ${r.produccion_neta < r.cantidad_hilos ? 'text-red-600' : 'text-orange-600'}`}>
                        {r.produccion_neta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}