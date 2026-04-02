import { useState, useEffect } from "react";
import { Tecnico } from "@/entities/Tecnico";
import { Plus, Edit2, Trash2, Phone, MapPin, UserSquare2, CheckCircle2, XCircle, Search } from "lucide-react";

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    zona: "",
    estado: "activo",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await Tecnico.list("-createdAt", 100);
    setTecnicos(data);
    setLoading(false);
  };

  const handleOpen = (t = null) => {
    if (t) {
      setEditingId(t.id);
      setForm({
        nombre: t.nombre,
        apellido: t.apellido,
        cedula: t.cedula,
        telefono: t.telefono || "",
        zona: t.zona || "",
        estado: t.estado || "activo",
      });
    } else {
      setEditingId(null);
      setForm({ nombre: "", apellido: "", cedula: "", telefono: "", zona: "", estado: "activo" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await Tecnico.update(editingId, form);
    } else {
      await Tecnico.create(form);
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar a este técnico?")) {
      await Tecnico.delete(id);
      loadData();
    }
  };

  const filtrados = tecnicos.filter((t) =>
    `${t.nombre} ${t.apellido} ${t.cedula}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Directorio de Técnicos</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={() => handleOpen()}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Técnico</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          No se encontraron técnicos.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="p-5 flex flex-col items-center text-center border-b bg-gray-50/50 relative">
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button onClick={() => handleOpen(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <UserSquare2 className="w-8 h-8" />
                </div>
                
                <h3 className="font-bold text-gray-800 leading-tight">
                  {t.nombre} {t.apellido}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">C.I. {t.cedula}</p>
                
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  t.estado === "activo" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {t.estado === "activo" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {t.estado === "activo" ? "Activo" : "Inactivo"}
                </div>
              </div>
              
              <div className="p-4 space-y-3 bg-white text-sm">
                <div className="flex items-start gap-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{t.telefono || "Sin teléfono"}</span>
                </div>
                <div className="flex items-start gap-3 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{t.zona || "Sin zona asignada"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {editingId ? "Editar Técnico" : "Nuevo Técnico"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
                <input
                  type="text"
                  required
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona Asignada</label>
                <input
                  type="text"
                  value={form.zona}
                  onChange={(e) => setForm({ ...form, zona: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}