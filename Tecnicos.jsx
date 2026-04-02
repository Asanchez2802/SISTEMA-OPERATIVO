import { useState, useEffect } from "react";
import { ReporteTendido } from "@/entities/ReporteTendido";
import { GrupoTendido } from "@/entities/GrupoTendido";
import * as RechartsPrimitive from "recharts";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import TendidoMap from "@/components/TendidoMap";
import { Trophy, TrendingUp, Target, Activity, Users, Map, Calendar, Layers } from "lucide-react";

const META_DIARIA = 1000;

function KpiCard({ title, value, subtitle, icon: Icon, color = "blue", extra }) {
  const bgColors = { blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", orange: "bg-orange-50 text-orange-600", purple: "bg-purple-50 text-purple-600" };
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${bgColors[color].split(" ")[0]}`} />
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={`p-2 rounded-xl ${bgColors[color]}`}><Icon className="w-4 h-4" /></div>
      </div>
      <div className="flex items-end gap-2">
        <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
        {extra && <span className="text-sm font-medium text-gray-500 mb-1">{extra}</span>}
      </div>
      <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}

export default function Dashboard() {
  const [reportes, setReportes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaRanking, setVistaRanking] = useState("persona"); // "persona" | "grupo"

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [r, g] = await Promise.all([
      ReporteTendido.list("-fecha", 2000),
      GrupoTendido.list("nombre", 50)
    ]);
    setReportes(r);
    setGrupos(g);
    setLoading(false);
  };

  // Filtrado
  const filtrados = reportes.filter((r) => {
    let dMatch = true;
    if (startDate && endDate && r.fecha) {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      const rf = parseISO(r.fecha);
      dMatch = rf >= s && rf <= e;
    }
    let gMatch = true;
    if (filtroGrupo !== "todos") {
      gMatch = r.grupo_nombre === filtroGrupo;
    }
    return dMatch && gMatch;
  });

  // KPIs
  const totalMetraje = filtrados.reduce((s, r) => s + (r.metraje_tendido || 0), 0);
  const fechasUnicas = new Set(filtrados.map(r => r.fecha)).size || 1;
  const metaTotalEsperada = fechasUnicas * META_DIARIA;
  const promedioDiarioGeneral = Math.round(totalMetraje / fechasUnicas);

  // Ranking por Persona
  const statsTecnico = {};
  filtrados.forEach(r => {
    const n = r.tecnico_nombre || "Desconocido";
    if (!statsTecnico[n]) statsTecnico[n] = { nombre: n, metros: 0, diasLaborados: new Set(), grupo: r.grupo_nombre || "" };
    statsTecnico[n].metros += (r.metraje_tendido || 0);
    statsTecnico[n].diasLaborados.add(r.fecha);
  });
  const rankingPersona = Object.values(statsTecnico).map(st => {
    const dias = st.diasLaborados.size || 1;
    const promedio = Math.round(st.metros / dias);
    const eficiencia = Math.round((st.metros / (dias * META_DIARIA)) * 100) || 0;
    return { ...st, promedio, eficiencia, dias };
  }).sort((a, b) => b.eficiencia - a.eficiencia);

  // Ranking por Grupo
  const statsGrupo = {};
  filtrados.forEach(r => {
    const g = r.grupo_nombre || "Sin Grupo";
    if (!statsGrupo[g]) statsGrupo[g] = { nombre: g, metros: 0, diasLaborados: new Set() };
    statsGrupo[g].metros += (r.metraje_tendido || 0);
    statsGrupo[g].diasLaborados.add(r.fecha);
  });
  const rankingGrupo = Object.values(statsGrupo).map(sg => {
    const dias = sg.diasLaborados.size || 1;
    const promedio = Math.round(sg.metros / dias);
    const eficiencia = Math.round((sg.metros / (dias * META_DIARIA)) * 100) || 0;
    return { ...sg, promedio, eficiencia, dias };
  }).sort((a, b) => b.metros - a.metros);

  // Gráfica Tendencia
  const endObj = parseISO(endDate);
  const startObj = parseISO(startDate);
  const daysDiff = Math.min(differenceInDays(endObj, startObj), 60);
  const tendenciaArr = [];
  for (let i = 0; i <= daysDiff; i++) {
    const dStr = format(subDays(endObj, daysDiff - i), "yyyy-MM-dd");
    const m = filtrados.filter(r => r.fecha === dStr).reduce((s, r) => s + (r.metraje_tendido || 0), 0);
    tendenciaArr.push({ dia: dStr.slice(-5), metros: m });
  }

  // Puntos del Mapa — coordenada_inicial
  const puntosMapa = [];
  filtrados.forEach(r => {
    if (r.coordenada_inicial && r.coordenada_inicial.includes(",")) {
      const parts = r.coordenada_inicial.split(",");
      const lat = parseFloat(parts[0]?.trim());
      const lng = parseFloat(parts[1]?.trim());
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        puntosMapa.push({ lat, lng, tipo: "INICIO", tecnico: r.tecnico_nombre, fecha: r.fecha, metros: r.metraje_tendido });
      }
    }
  });

  const rankingActual = vistaRanking === "persona" ? rankingPersona : rankingGrupo;

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Analítica de Producción</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-gray-50 p-2 rounded-xl border">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm font-medium focus:outline-none text-gray-700 bg-transparent" />
            <span className="text-gray-300">|</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm font-medium focus:outline-none text-gray-700 bg-transparent" />
          </div>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 shadow-sm min-w-[180px]">
            <Layers className="w-4 h-4 text-gray-400" />
            <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="text-sm font-medium w-full focus:outline-none text-gray-700 bg-transparent">
              <option value="todos">Todos los grupos</option>
              {grupos.map(g => <option key={g.id} value={g.nombre}>{g.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Tendido Total" value={totalMetraje.toLocaleString()} extra="m" subtitle={`Meta: ${metaTotalEsperada.toLocaleString()} m`} icon={TrendingUp} color="blue" />
        <KpiCard title="Promedio Diario" value={promedioDiarioGeneral.toLocaleString()} extra="m/día" subtitle={`Objetivo: ${META_DIARIA} m/día`} icon={Activity} color={promedioDiarioGeneral >= META_DIARIA ? "green" : "orange"} />
        <KpiCard title="Días Trabajados" value={fechasUnicas} extra="días" subtitle="En el rango seleccionado" icon={Calendar} color="purple" />
        <KpiCard title="Eficiencia Total" value={`${Math.round((totalMetraje / (metaTotalEsperada || 1)) * 100)}%`} subtitle="Cumplimiento vs. Meta (1km)" icon={Trophy} color={(totalMetraje / (metaTotalEsperada || 1)) >= 1 ? "green" : "orange"} />
      </div>

      {/* RANKING + GRÁFICA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border flex flex-col overflow-hidden h-[420px]">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Ranking</h3>
            <div className="flex bg-gray-200 rounded-lg p-0.5 text-xs">
              <button onClick={() => setVistaRanking("persona")} className={`px-2 py-1 rounded-md font-semibold transition ${vistaRanking === "persona" ? "bg-white shadow text-blue-700" : "text-gray-500"}`}>Persona</button>
              <button onClick={() => setVistaRanking("grupo")} className={`px-2 py-1 rounded-md font-semibold transition ${vistaRanking === "grupo" ? "bg-white shadow text-blue-700" : "text-gray-500"}`}>Grupo</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {rankingActual.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">Sin datos</p>
            ) : rankingActual.map((item, idx) => (
              <div key={item.nombre} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:border-blue-300 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-600"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate text-sm">{item.nombre}</p>
                  {vistaRanking === "persona" && item.grupo && <p className="text-[10px] text-gray-400">{item.grupo}</p>}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>Prom: <b className="text-gray-700">{item.promedio}m/d</b></span>
                    <span className="text-gray-400">Total: {item.metros}m</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${item.eficiencia >= 100 ? "bg-green-500" : "bg-orange-500"}`} style={{ width: `${Math.min(item.eficiencia, 100)}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-black ${item.eficiencia >= 100 ? "text-green-600" : "text-orange-500"}`}>{item.eficiencia}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-[420px]">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Histórico de Tendido (Diario)</h3>
          <div className="flex-1 w-full min-h-0">
            <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
              <RechartsPrimitive.ComposedChart data={tendenciaArr} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <RechartsPrimitive.XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <RechartsPrimitive.YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <RechartsPrimitive.ReferenceLine y={META_DIARIA} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} label={{ position: "top", value: "Meta (1km)", fill: "#ef4444", fontSize: 10 }} />
                <RechartsPrimitive.Bar dataKey="metros" fill="url(#barColor)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </RechartsPrimitive.ComposedChart>
            </RechartsPrimitive.ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MAPA */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden h-[400px] flex flex-col relative">
        <div className="absolute top-4 left-4 z-[500] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-100 pointer-events-none">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Map className="w-5 h-5 text-blue-600" /> Mapa de Tendidos</h3>
          <p className="text-xs text-gray-500 mt-0.5">{puntosMapa.length} punto(s) con coordenadas registradas</p>
        </div>
        <div className="flex-1 w-full relative z-0">
          <TendidoMap puntos={puntosMapa} />
        </div>
      </div>
    </div>
  );
}