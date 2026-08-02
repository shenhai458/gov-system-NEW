import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Search, Plus, Edit, Ban, Trash2, X, UserCheck,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  user: "普通用户",
  visitor: "访客",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  user: "bg-blue-100 text-blue-700",
  visitor: "bg-gray-100 text-gray-700",
};

export default function Users() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    realName: "",
    role: "user" as "admin" | "user" | "visitor",
    department: "",
    status: "active" as "active" | "disabled",
  });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.user.list.useQuery({ search: search || undefined });
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => { utils.user.list.invalidate(); setShowModal(false); resetForm(); },
  });
  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => { utils.user.list.invalidate(); setShowModal(false); resetForm(); },
  });
  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  });

  const users = data?.list || [];
  const total = data?.total || 0;

  const admins = users.filter((u) => u.role === "admin").length;
  const regularUsers = users.filter((u) => u.role === "user").length;
  const activeUsers = users.filter((u) => u.status === "active").length;

  const resetForm = () => {
    setForm({ username: "", password: "", realName: "", role: "user", department: "", status: "active" });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (user: (typeof users)[0]) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: "",
      realName: user.realName,
      role: user.role as "admin" | "user" | "visitor",
      department: user.department || "",
      status: user.status as "active" | "disabled",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.realName.trim()) return;
    if (editingId) {
      const updateData: Record<string, unknown> = {
        realName: form.realName,
        role: form.role,
        department: form.department || null,
        status: form.status,
      };
      if (form.password) updateData.password = form.password;
      updateMutation.mutate({ id: editingId, ...updateData });
    } else {
      if (!form.password) return;
      createMutation.mutate({
        username: form.username,
        password: form.password,
        realName: form.realName,
        role: form.role,
        department: form.department || null,
        status: form.status,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">用户管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理系统用户和权限</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
            />
          </div>
          {isAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" />
              添加用户
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          当前为只读模式，您仅可查看用户信息。
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">总用户数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">管理员</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{admins}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">普通用户</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{regularUsers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">活跃用户</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeUsers}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">用户列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">用户ID</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">用户名</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">真实姓名</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">角色</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">部门</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">状态</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">最后登录</th>
                {isAdmin && <th className="text-left py-3 px-2 text-gray-600 font-medium">操作</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-400">加载中...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-400">暂无数据</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500">{user.id}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{user.realName?.[0] || user.username[0]}</span>
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{user.realName}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">{user.department || "-"}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {user.status === "active" ? "活跃" : "禁用"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{user.lastLogin ? new Date(user.lastLogin).toLocaleString("zh-CN") : "-"}</td>
                    {isAdmin && (
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(user)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => updateMutation.mutate({ id: user.id, status: user.status === "active" ? "disabled" : "active" })}
                            className={`p-1 rounded ${user.status === "active" ? "text-orange-600 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                          >
                            {user.status === "active" ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { if (confirm("确定删除此用户？")) deleteMutation.mutate({ id: user.id }); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md m-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{editingId ? "编辑用户" : "添加用户"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">用户名</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editingId} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{editingId ? "密码（留空不修改）" : "密码"} {editingId ? "" : "*"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required={!editingId} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">真实姓名</label>
                <input type="text" value={form.realName} onChange={(e) => setForm({ ...form, realName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">角色</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="admin">管理员</option>
                    <option value="user">普通用户</option>
                    <option value="visitor">访客</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">部门</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">请选择</option>
                    <option value="科技局">科技局</option>
                    <option value="发改委">发改委</option>
                    <option value="人社局">人社局</option>
                    <option value="商务局">商务局</option>
                    <option value="工信局">工信局</option>
                    <option value="强质办">强质办</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="active">活跃</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">取消</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
