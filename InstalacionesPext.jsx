import { useState, useEffect } from "react";
import { ConfiguracionApp } from "@/entities/ConfiguracionApp";
import { RolUsuario } from "@/entities/RolUsuario";
import { User } from "@/entities/User";
import {
  Save, Plus, Trash2, Shield, Palette, ListOrdered,
  XCircle, Settings, Users, Eye, EyeOff, Edit2, Key, UserPlus, Image, Upload
} from "lucide-react";
import { uploadFile } from "@/utils";

// ─── Sección: Gestión de Usuarios ───────────────────────────────────────────
function GestionUsuarios({ roles, onRolesChange }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", rol: "Colaborador" });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const list = await User.list("-createdAt", 100);
      setUsuarios(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ firstName: "", lastName: "", email: "", password: "", rol: "Colaborador" });
    setShowForm(true);
  };

  const openEdit = (u) => {
    const rolObj = roles.find(r => r.email === u.email);
    setEditingUser(u);
    setForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email, password: "", rol: rolObj?.rol || "Colaborador" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        // Actualizar nombre
        const updateData = { firstName: form.firstName, lastName: form.lastName };
        if (form.password) updateData.password = form.password;
        await User.update(editingUser.id, updateData);

        // Actualizar rol en RolUsuario
        const rolExistente = roles.find(r => r.email === editingUser.email);
        if (rolExistente) {
          await RolUsuario.update(rolExistente.id, { rol: form.rol });
          const newRoles = roles.map(r => r.id === rolExistente.id ? { ...r, rol: form.rol } : r);
          onRolesChange(newRoles);
        } else {
          const nuevo = await RolUsuario.create({ email: editingUser.email, rol: form.rol });
          onRolesChange([nuevo, ...roles]);
        }
      } else {
        // Crear usuario nuevo
        const newUser = await User.create({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName
        });
        // Asignar rol
        const nuevo = await RolUsuario.create({ email: form.email, rol: form.rol });
        onRolesChange([nuevo, ...roles]);
      }
      await loadUsers();
      setShowForm(false);
    } catch (err) {
      alert("Error: " + (err.message || "No se pudo guardar el usuario."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar al usuario ${u.email}?`)) return;
    try {
      await User.delete(u.id);
      const rolObj = roles.find(r => r.email === u.email);
      if (rolObj) {
        await RolUsuario.delete(rolObj.id);
        onRolesChange(roles.filter(r => r.id !== rolObj.id));
      }
      setUsuarios(usuarios.filter(x => x.id !== u.id));
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const getRolBadge = (email) => {
    const r = roles.find(x => x.email === email);
    const rol = r?.rol || "Sin rol";
    const colors = { Administrador: "bg-red-100 text-red-700", Colaborador: "bg-blue-100 text-blue-700", Evaluador: "bg-green-100 text-green-700", "Sin rol": "bg-gray-100 text-gray-500" };
    return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colors[rol] || colors["Sin rol"]}`}>{rol}</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Usuarios del Sistema</h3>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition">
          <UserPlus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {loadingUsers ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-b-2 border-blue-600 rounded-full" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold text-center">Rol</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center">{getRolBadge(u.email)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar">
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

      {/* Modal Crear/Editar Usuario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {editingUser ? <><Edit2 className="w-4 h-4 text-blue-600" /> Editar Usuario</> : <><UserPlus className="w-4 h-4 text-green-600" /> Nuevo Usuario</>}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                  <input required type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editingUser} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3" /> {editingUser ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required={!editingUser}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editingUser ? "••••••••" : "Mínimo 6 caracteres"}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rol del Sistema *</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="Administrador">Administrador — Acceso total</option>
                  <option value="Colaborador">Colaborador — Ve y edita todo (sin Ajustes)</option>
                  <option value="Evaluador">Evaluador — Solo Dashboards</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow disabled:opacity-50">
                  {saving ? "Guardando..." : editingUser ? "Actualizar" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sección: Listas Desplegables ────────────────────────────────────────────
function ListasEditor({ listas, onChange }) {
  const [nuevoItem, setNuevoItem] = useState({ key: "", value: "" });

  const handleAdd = (key) => {
    if (!nuevoItem.value || nuevoItem.key !== key) return;
    onChange({ ...listas, [key]: [...listas[key], nuevoItem.value] });
    setNuevoItem({ key: "", value: "" });
  };

  const handleRemove = (key, idx) => {
    const l = [...listas[key]];
    l.splice(idx, 1);
    onChange({ ...listas, [key]: l });
  };

  const renderList = (key, label) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <h4 className="font-semibold text-gray-700 text-sm mb-3">{label}</h4>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
        {listas[key].map((item, idx) => (
          <span key={idx} className="bg-white border text-gray-700 text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            {item}
            <button onClick={() => handleRemove(key, idx)} className="text-red-400 hover:text-red-600 ml-0.5">
              <XCircle className="w-3 h-3" />
            </button>
          </span>
        ))}
        {listas[key].length === 0 && <span className="text-xs text-gray-400 italic">Sin elementos</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Agregar elemento..."
          value={nuevoItem.key === key ? nuevoItem.value : ""}
          onChange={e => setNuevoItem({ key, value: e.target.value })}
          onKeyDown={e => e.key === "Enter" && handleAdd(key)}
          className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
        />
        <button onClick={() => handleAdd(key)} className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-md text-xs font-bold">+</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <ListOrdered className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-800">Personalizar Desplegables del Sistema</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {renderList("asesores", "Asesores")}
        {renderList("capacidades_modulo", "Capacidades de Módulo")}
        {renderList("tipos_servicio", "Tipos de Servicio")}
        {renderList("tipos_trabajo_fusion", "Tipos de Trabajo (Fusión)")}
        {renderList("planes", "Planes y Paquetes")}
        {renderList("prioridades", "Prioridades")}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Opciones() {
  const [config, setConfig] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [miRol, setMiRol] = useState("Cargando...");

  const [theme, setTheme] = useState("#1e3a8a");
  const [bg, setBg] = useState("#f9fafb");
  const [tituloApp, setTituloApp] = useState("FiberTrack");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [listas, setListas] = useState({
    asesores: [], capacidades_modulo: [], tipos_servicio: [],
    tipos_trabajo_fusion: [], planes: [], prioridades: ["Baja", "Normal", "Alta", "Urgente"]
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const me = await User.me();
      const misRoles = await RolUsuario.list("-createdAt", 100);
      const mR = misRoles.find(r => r.email === me.email);
      setMiRol(mR ? mR.rol : "Administrador");
      setRoles(misRoles);

      const confs = await ConfiguracionApp.list("-createdAt", 1);
      if (confs.length > 0) {
        const c = confs[0];
        setConfig(c);
        setTheme(c.tema || "#1e3a8a");
        setBg(c.fondo || "#f9fafb");
        setTituloApp(c.titulo_app || "FiberTrack");
        setLogoUrl(c.logo_url || "");
        setListas({
          asesores: c.asesores || [],
          capacidades_modulo: c.capacidades_modulo || [],
          tipos_servicio: c.tipos_servicio || [],
          tipos_trabajo_fusion: c.tipos_trabajo_fusion || [],
          planes: c.planes || [],
          prioridades: c.prioridades || ["Baja", "Normal", "Alta", "Urgente"]
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    const toSave = { tema: theme, fondo: bg, titulo_app: tituloApp, logo_url: logoUrl, ...listas };
    try {
      if (config) {
        await ConfiguracionApp.update(config.id, toSave);
      } else {
        const nueva = await ConfiguracionApp.create(toSave);
        setConfig(nueva);
      }
      alert("✅ Configuración guardada. La página se recargará para aplicar los cambios.");
      window.location.reload();
    } catch (e) {
      alert("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full" /></div>;

  if (miRol !== "Administrador" && miRol !== "Cargando...") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <Shield className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold">Acceso Denegado</h2>
        <p className="mt-2 text-gray-600">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header con botón guardar */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-600" /> Ajustes Generales
        </h2>
        <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 transition disabled:opacity-50">
          <Save className="w-5 h-5" /> {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* Apariencia */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <Palette className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Apariencia del Sistema</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del Sistema */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Sistema</label>
            <input
              type="text"
              value={tituloApp}
              onChange={e => setTituloApp(e.target.value)}
              placeholder="Ej: FiberTrack, Mi Sistema, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          {/* Logo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Image className="w-4 h-4" /> Logo del Sistema</label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Image className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className={`flex items-center gap-2 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition w-fit ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? "Subiendo..." : "Subir Logo"}
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploadingLogo(true);
                    try {
                      const { url } = await uploadFile(file, { isPublic: true });
                      setLogoUrl(url);
                    } catch (err) {
                      alert("Error al subir logo");
                    } finally {
                      setUploadingLogo(false);
                    }
                  }} disabled={uploadingLogo} />
                </label>
                <p className="text-xs text-gray-500">O pega la URL directamente:</p>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl("")} className="text-xs text-red-500 hover:text-red-700 font-medium">✕ Quitar logo</button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Color del Menú (Sidebar)</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={theme} onChange={e => setTheme(e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-200 shadow-sm" />
              <input type="text" value={theme} onChange={e => setTheme(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500" />
              <div className="w-10 h-10 rounded-lg border shadow-inner" style={{ backgroundColor: theme }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Color de Fondo General</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-200 shadow-sm" />
              <input type="text" value={bg} onChange={e => setBg(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500" />
              <div className="w-10 h-10 rounded-lg border shadow-inner" style={{ backgroundColor: bg }} />
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de Usuarios */}
      <GestionUsuarios roles={roles} onRolesChange={setRoles} />

      {/* Listas Desplegables */}
      <ListasEditor listas={listas} onChange={setListas} />
    </div>
  );
}