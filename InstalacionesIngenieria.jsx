import { useState, useEffect } from "react";
import { OrdenInstalacion } from "@/entities/OrdenInstalacion";
import * as RechartsPrimitive from "recharts";
import { Activity, ClipboardCheck, Clock, CheckCircle2, AlertCircle, Cpu, Cable } from "lucide-react";

export default function InstalacionesDashboard() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    OrdenInstalacion.list("-createdAt", 1000).then(data => {
      setOrdenes(data);
      setLoading(false);
    });
  }, []);

  const total = ordenes.length;
  const enPext = ordenes.filter(o => o.estado === "PEXT").length;
  const enIngenieria = ordenes.filter(o => o.estado === "INGENIERIA").length;
  const completadas = ordenes.filter(o => o.estado === "COMPLETADO").length;
  const enProceso = enPext + enIngenieria;
  const urgentes = ordenes.filter(o => o.prioridad === "Urgente" && o.estado !== "COMPLETADO").length;

  // Gráfico por Tipo de Servicio
  const porServicio = {};
  ordenes.forEach(o => {
    const ts = o.tipo_servicio || "No definido";
    porServicio[ts] = (porServicio[ts] || 0) + 1;
  });
  const dataServicios = Object.entries(porServicio).map(([name, value]) => ({ name, value }));

  // Gráfico por Estado
  const dataEstados = [
    { name: 'PEXT', value: enPext, fill: '#3b82f6' },
    { name: 'INGENIERÍA', value: enIngenieria, fill: '#8b5cf6' },
    { name: 'COMPLETADO', value: completadas, fill: '#10b981' },
  ];

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Dashboard de Instalaciones</h2>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Órdenes</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">En Proceso</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{enProceso}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Completadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completadas}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-red-600 uppercase font-semibold">Urgentes Activas</p>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-700 mt-1">{urgentes}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-blue-600 uppercase font-semibold">Activas en PEXT</p>
            <Cable className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{enPext}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-xs text-purple-600 uppercase font-semibold">En Ingeniería</p>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-1">{enIngenieria}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Órdenes por Tipo de Servicio</h3>
          <div className="h-64">
            <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
              <RechartsPrimitive.BarChart data={dataServicios} margin={{ left: -20 }}>
                <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} />
                <RechartsPrimitive.XAxis dataKey="name" tick={{fontSize: 12}} />
                <RechartsPrimitive.YAxis tick={{fontSize: 12}} />
                <RechartsPrimitive.Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
              </RechartsPrimitive.BarChart>
            </RechartsPrimitive.ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col items-center">
          <h3 className="font-semibold text-gray-800 w-full mb-4">Distribución por Estados</h3>
          <div className="h-64 w-full">
            <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
              <RechartsPrimitive.PieChart>
                <RechartsPrimitive.Pie
                  data={dataEstados}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataEstados.map((entry, index) => (
                    <RechartsPrimitive.Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RechartsPrimitive.Pie>
              </RechartsPrimitive.PieChart>
            </RechartsPrimitive.ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-2">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> PEXT ({enPext})</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> Ing. ({enIngenieria})</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Completadas ({completadas})</div>
          </div>
        </div>
      </div>
    </div>
  );
}