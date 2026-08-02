import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Search, Edit, Trash2, X, Save, RefreshCw, Award, Calendar, AlertTriangle,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "honor", label: "荣誉" },
  { value: "qualification", label: "资质" },
  { value: "certification", label: "认证" },
  { value: "other", label: "其他" },
];

const TYPE_LABELS: Record<string, string> = {
  honor: "荣誉", qualification: "资质", certification: "认证", other: "其他",
};

const LEVEL_LABELS: Record<string, string> = {
  national: "国家级", provincial: "省级", city: "市级", district: "区级", other: "其他",
};

const STATUS_COLORS: Record<string, string> = {
  valid: "bg-emerald-100 text-emerald-700",
  expiring: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  valid: "有效", expiring: "即将到期", expired: "已过期",
};

interface HonorItem {
  id: number;
  title: string;
  type: "honor" | "qualification" | "certification" | "other";
  level: "national" | "provincial" | "city" | "district" | "other" | null;
  issuingAuthority: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  reviewCycleMonths: number | null;
  attachmentUrl: string | null;
  notes: string | null;
  projectId: number | null;
}

export default function Honors() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<{
    status: "all" | "valid" | "expiring" | "expired";
    type: "all" | "honor" | "qualification" | "certification" | "other";
    search: string;
  }>({ status: "all", type: "all", search: "" });
  const [showModal, setShowModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedHonorId, setSelectedHonorId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "honor" as "honor" | "qualification" | "certification" | "other",
    level: "other" as "national" | "provincial" | "city" | "district" | "other",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    reviewCycleMonths: "" as string,
    attachmentUrl: "",
    notes: "",
    projectId: "" as string,
  });

  const [renewalForm, setRenewalForm] = useState({
    id: null as number | null,
    plannedDate: "",
    actualDate: "",
    status: "planned" as "planned" | "in_progress" | "completed" | "overdue",
    cost: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: honors, isLoading } = trpc.honor.list.useQuery(filters);
  const { data: stats } = trpc.honor.stats.useQuery();

  const createMutation = trpc.honor.create.useMutation({
    onSuccess: () => { utils.honor.list.invalidate(); utils.honor.stats.invalidate(); setShowModal(false); resetForm(); },
  });
  const updateMutation = trpc.honor.update.useMutation({
    onSuccess: () => { utils.honor.list.invalidate(); utils.honor.stats.invalidate(); setShowModal(false); resetForm(); },
  });
  const deleteMutation = trpc.honor.delete.useMutation({
    onSuccess: () => { utils.honor.list.invalidate(); utils.honor.stats.invalidate(); },
  });

  const { data: renewals } = trpc.honor.renewals.list.useQuery(
    { honorId: selectedHonorId || 0 },
    { enabled: !!selectedHonorId }
  );
  const createRenewalMutation = trpc.honor.renewals.create.useMutation({
    onSuccess: () => utils.honor.renewals.list.invalidate(),
  });
  const updateRenewalMutation = trpc.honor.renewals.update.useMutation({
    onSuccess: () => utils.honor.renewals.list.invalidate(),
  });
  const deleteRenewalMutation = trpc.honor.renewals.delete.useMutation({
    onSuccess: () => utils.honor.renewals.list.invalidate(),
  });

  const resetForm = () => {
    setForm({
      title: "", type: "honor", level: "other", issuingAuthority: "", issueDate: "",
      expiryDate: "", reviewCycleMonths: "", attachmentUrl: "", notes: "", projectId: "",
    });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (h: HonorItem) => {
    setEditingId(h.id);
    setForm({
      title: h.title,
      type: h.type,
      level: h.level || "other",
      issuingAuthority: h.issuingAuthority || "",
      issueDate: h.issueDate ? new Date(h.issueDate).toISOString().split("T")[0] : "",
      expiryDate: h.expiryDate ? new Date(h.expiryDate).toISOString().split("T")[0] : "",
      reviewCycleMonths: h.reviewCycleMonths ? String(h.reviewCycleMonths) : "",
      attachmentUrl: h.attachmentUrl || "",
      notes: h.notes || "",
      projectId: h.projectId ? String(h.projectId) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      reviewCycleMonths: form.reviewCycleMonths ? parseInt(form.reviewCycleMonths) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openRenewals = (honorId: number) => {
    setSelectedHonorId(honorId);
    setRenewalForm({ id: null, plannedDate: "", actualDate: "", status: "planned", cost: "", notes: "" });
    setShowRenewalModal(true);
  };

  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHonorId) return;
    const payload = {
      honorId: selectedHonorId,
      plannedDate: renewalForm.plannedDate || null,
      actualDate: renewalForm.actualDate || null,
      status: renewalForm.status,
      cost: renewalForm.cost || null,
      notes: renewalForm.notes || null,
    };
    if (renewalForm.id) {
      updateRenewalMutation.mutate({ id: renewalForm.id, ...payload });
    } else {
      createRenewalMutation.mutate(payload);
    }
    setRenewalForm({ id: null, plannedDate: "", actualDate: "", status: "planned", cost: "", notes: "" });
  };

  const daysUntil = (date: string | Date | null) => {
    if (!date) return null;
    const d = new Date(date).getTime();
    const now = Date.now();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">企业荣誉库</h2>
          <p className="text-sm text-gray-500 mt-1">管理企业荣誉、资质认证与复审周期</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" />
              添加荣誉
            </button>
          )}
          <button onClick={() => utils.honor.list.invalidate()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          当前为只读模式，您仅可查看荣誉资质数据。
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">荣誉总数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">有效</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.valid || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">即将到期</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.expiring || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">已过期</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats?.expired || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">状态:</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as typeof filters.status })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">全部状态</option>
            <option value="valid">有效</option>
            <option value="expiring">即将到期</option>
            <option value="expired">已过期</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">类型:</label>
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value as typeof filters.type })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索荣誉..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Honors Grid */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-8 text-gray-400">加载中...</div>
        ) : honors?.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-400">暂无荣誉资质</div>
        ) : (
          honors?.map((h) => {
            const days = daysUntil(h.expiryDate);
            return (
              <div key={h.id} className="bg-white rounded-xl p-5 shadow-sm relative group">
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(h)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (confirm("确定删除此荣誉？")) deleteMutation.mutate({ id: h.id }); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{h.title}</h3>
                    <p className="text-xs text-gray-500">{TYPE_LABELS[h.type]} · {LEVEL_LABELS[h.level || "other"]}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">颁发机构</span>
                    <span className="text-gray-800 truncate max-w-[150px]">{h.issuingAuthority || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">颁发日期</span>
                    <span className="text-gray-800">{h.issueDate ? new Date(h.issueDate).toLocaleDateString("zh-CN") : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">到期日期</span>
                    <span className="text-gray-800">{h.expiryDate ? new Date(h.expiryDate).toLocaleDateString("zh-CN") : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">复审周期</span>
                    <span className="text-gray-800">{h.reviewCycleMonths ? `${h.reviewCycleMonths}个月` : "-"}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[h.status || "valid"]}`}>
                    {STATUS_LABELS[h.status || "valid"]}
                  </span>
                  {days !== null && days <= 90 && days >= 0 && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      还剩 {days} 天
                    </span>
                  )}
                </div>
                <button
                  onClick={() => openRenewals(h.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  复审记录
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Honor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">{editingId ? "编辑荣誉" : "添加荣誉"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">名称 <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {TYPE_OPTIONS.filter((o) => o.value !== "all").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">级别</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(LEVEL_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">颁发机构</label>
                <input type="text" value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">复审周期（月）</label>
                <input type="number" value={form.reviewCycleMonths} onChange={(e) => setForm({ ...form, reviewCycleMonths: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">颁发日期</label>
                <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">到期日期</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">附件链接</label>
                <input type="url" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">取消</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renewals Modal */}
      {showRenewalModal && selectedHonorId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">复审记录</h3>
              <button onClick={() => setShowRenewalModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              {isAdmin && (
                <form onSubmit={handleRenewalSubmit} className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">计划复审日期</label>
                    <input type="date" value={renewalForm.plannedDate} onChange={(e) => setRenewalForm({ ...renewalForm, plannedDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">实际复审日期</label>
                    <input type="date" value={renewalForm.actualDate} onChange={(e) => setRenewalForm({ ...renewalForm, actualDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">状态</label>
                    <select value={renewalForm.status} onChange={(e) => setRenewalForm({ ...renewalForm, status: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <option value="planned">计划中</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="overdue">已逾期</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">费用</label>
                    <input type="text" value={renewalForm.cost} onChange={(e) => setRenewalForm({ ...renewalForm, cost: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">备注</label>
                    <textarea value={renewalForm.notes} onChange={(e) => setRenewalForm({ ...renewalForm, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      添加复审记录
                    </button>
                  </div>
                </form>
              )}

              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3">计划日期</th>
                    <th className="text-left py-2 px-3">实际日期</th>
                    <th className="text-left py-2 px-3">状态</th>
                    <th className="text-left py-2 px-3">费用</th>
                    {isAdmin && <th className="text-left py-2 px-3">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {(renewals || []).length === 0 ? (
                    <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-6 text-gray-400">暂无复审记录</td></tr>
                  ) : (
                    (renewals || []).map((r) => (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="py-2 px-3">{r.plannedDate ? new Date(r.plannedDate).toLocaleDateString("zh-CN") : "-"}</td>
                        <td className="py-2 px-3">{r.actualDate ? new Date(r.actualDate).toLocaleDateString("zh-CN") : "-"}</td>
                        <td className="py-2 px-3">{r.status}</td>
                        <td className="py-2 px-3">{r.cost || "-"}</td>
                        {isAdmin && (
                          <td className="py-2 px-3">
                            <button onClick={() => { if (confirm("确定删除此记录？")) deleteRenewalMutation.mutate({ id: r.id }); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
