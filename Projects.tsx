import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Search, Download, Upload, Trash2, Edit, X, Settings2, Save,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "ok", label: "已通过" },
  { value: "in_progress", label: "进行中" },
  { value: "failed", label: "未通过" },
  { value: "pending", label: "待审核" },
];

const DEPT_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "厦门市科学技术局", label: "科技局" },
  { value: "发改委", label: "发改委" },
  { value: "人社局", label: "人社局" },
  { value: "商务局", label: "商务局" },
  { value: "工信局", label: "工信局" },
  { value: "厦门市强质办", label: "强质办" },
  { value: "其他", label: "其他" },
];

const WARNING_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "normal", label: "正常" },
  { value: "7days", label: "7天内结束" },
  { value: "15days", label: "半个月结束" },
  { value: "30days", label: "一个月结束" },
];

const STATUS_LABELS: Record<string, string> = {
  ok: "已通过", failed: "未通过", in_progress: "进行中", pending: "待审核",
};

const STATUS_COLORS: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "文本", number: "数字", date: "日期", select: "下拉选项", textarea: "多行文本",
};

interface ProjectForm {
  name: string;
  deadline: string;
  department: string;
  applyAmount: string;
  receiveAmount: string;
  status: "ok" | "failed" | "in_progress" | "pending";
  applicant: string;
  applyDate: string;
  receiveDate: string;
  noticeUrl: string;
  publicUrl: string;
  notes: string;
  warning: "normal" | "7days" | "15days" | "30days";
  customData: Record<string, any>;
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    applicant: "all",
    warning: "all",
    search: "",
    page: 1,
    pageSize: 10,
  });
  const [showModal, setShowModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectForm>({
    name: "",
    deadline: "",
    department: "",
    applyAmount: "",
    receiveAmount: "",
    status: "pending",
    applicant: "其他",
    applyDate: "",
    receiveDate: "",
    noticeUrl: "",
    publicUrl: "",
    notes: "",
    warning: "normal",
    customData: {},
  });

  const [fieldForm, setFieldForm] = useState({
    id: null as number | null,
    key: "",
    label: "",
    fieldType: "text" as "text" | "number" | "date" | "select" | "textarea",
    options: "" as string,
    required: false,
    order: 0,
    isVisible: true,
  });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.project.list.useQuery(filters);
  const { data: fields } = trpc.project.fields.list.useQuery();
  const { data: stats } = trpc.project.stats.useQuery();

  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => { utils.project.list.invalidate(); utils.project.stats.invalidate(); setShowModal(false); resetForm(); },
  });
  const updateMutation = trpc.project.update.useMutation({
    onSuccess: () => { utils.project.list.invalidate(); utils.project.stats.invalidate(); setShowModal(false); resetForm(); },
  });
  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => { utils.project.list.invalidate(); utils.project.stats.invalidate(); },
  });
  const createFieldMutation = trpc.project.fields.create.useMutation({
    onSuccess: () => utils.project.fields.list.invalidate(),
  });
  const updateFieldMutation = trpc.project.fields.update.useMutation({
    onSuccess: () => utils.project.fields.list.invalidate(),
  });
  const deleteFieldMutation = trpc.project.fields.delete.useMutation({
    onSuccess: () => utils.project.fields.list.invalidate(),
  });

  const projects = data?.list || [];
  const total = data?.total || 0;
  const applicants = data?.applicants || [];
  const visibleFields = (fields || []).filter((f) => f.isVisible);

  const resetForm = () => {
    setForm({
      name: "", deadline: "", department: "", applyAmount: "", receiveAmount: "",
      status: "pending", applicant: "", applyDate: "", receiveDate: "",
      noticeUrl: "", publicUrl: "", notes: "", warning: "normal", customData: {},
    });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (project: (typeof projects)[0]) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
      department: project.department || "",
      applyAmount: project.applyAmount || "",
      receiveAmount: project.receiveAmount || "",
      status: project.status,
      applicant: project.applicant || "其他",
      applyDate: project.applyDate ? new Date(project.applyDate).toISOString().split("T")[0] : "",
      receiveDate: project.receiveDate ? new Date(project.receiveDate).toISOString().split("T")[0] : "",
      noticeUrl: project.noticeUrl || "",
      publicUrl: project.publicUrl || "",
      notes: project.notes || "",
      warning: project.warning || "normal",
      customData: (project.customData as Record<string, any>) || {},
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleCustomChange = (key: string, value: any) => {
    setForm({ ...form, customData: { ...form.customData, [key]: value } });
  };

  const formatAmount = (val: string | null) => {
    if (!val) return "-";
    if (val === "荣誉") return "荣誉";
    const num = parseFloat(val);
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    return `${num}`;
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  const openFieldCreate = () => {
    setFieldForm({ id: null, key: "", label: "", fieldType: "text", options: "", required: false, order: 0, isVisible: true });
    setShowFieldModal(true);
  };

  const openFieldEdit = (f: typeof visibleFields[0]) => {
    setFieldForm({
      id: f.id,
      key: f.key,
      label: f.label,
      fieldType: f.fieldType,
      options: Array.isArray(f.options) ? f.options.join("\n") : "",
      required: f.required,
      order: f.order,
      isVisible: f.isVisible,
    });
    setShowFieldModal(true);
  };

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) return;
    const payload = {
      key: fieldForm.key,
      label: fieldForm.label,
      fieldType: fieldForm.fieldType,
      options: fieldForm.options.split("\n").map((s) => s.trim()).filter(Boolean),
      required: fieldForm.required,
      order: fieldForm.order,
      isVisible: fieldForm.isVisible,
    };
    if (fieldForm.id) {
      updateFieldMutation.mutate({ id: fieldForm.id, ...payload });
    } else {
      createFieldMutation.mutate(payload);
    }
    setShowFieldModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">项目管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理所有政府项目申报</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={openFieldCreate}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                字段配置
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建项目
              </button>
            </>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
            <Upload className="w-4 h-4" />
            导入数据
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" />
            导出全部
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          当前为只读模式，您仅可查看项目数据。
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">状态:</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">部门:</label>
          <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            {DEPT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">申报人:</label>
          <select value={filters.applicant} onChange={(e) => setFilters({ ...filters, applicant: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">全部</option>
            {applicants.filter((a): a is string => !!a).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">预警:</label>
          <select value={filters.warning} onChange={(e) => setFilters({ ...filters, warning: e.target.value, page: 1 })} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            {WARNING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索项目..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => setFilters({ status: "all", department: "all", applicant: "all", warning: "all", search: "", page: 1, pageSize: 10 })}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          清除筛选
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">总项目数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.inProgress || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.completed || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">总金额</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats?.totalAmount ? (stats.totalAmount >= 10000 ? `${(stats.totalAmount / 10000).toFixed(1)}万` : `${stats.totalAmount}`) : "0"}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">项目列表</h3>
          <span className="text-xs text-gray-500">共 {total} 条记录</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 font-medium w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">序号</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">项目名称</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">截止时间</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">对接部门</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">申报金额</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">到账金额</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">状态</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">申报人</th>
                {visibleFields.map((f) => (
                  <th key={f.id} className="text-left py-3 px-2 text-gray-600 font-medium">{f.label}</th>
                ))}
                {isAdmin && <th className="text-left py-3 px-2 text-gray-600 font-medium">操作</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10 + visibleFields.length} className="text-center py-8 text-gray-400">加载中...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={10 + visibleFields.length} className="text-center py-8 text-gray-400">暂无数据</td></tr>
              ) : (
                projects.map((project, idx) => {
                  const customData = (project.customData as Record<string, any>) || {};
                  return (
                    <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4"><input type="checkbox" className="rounded" /></td>
                      <td className="py-3 px-2 text-gray-500">{(filters.page - 1) * filters.pageSize + idx + 1}</td>
                      <td className="py-3 px-2 font-medium text-gray-800">{project.name}</td>
                      <td className="py-3 px-2 text-gray-600">{project.deadline ? new Date(project.deadline).toLocaleDateString("zh-CN") : "-"}</td>
                      <td className="py-3 px-2 text-gray-600">{project.department || "-"}</td>
                      <td className="py-3 px-2 text-gray-600">{formatAmount(project.applyAmount)}</td>
                      <td className="py-3 px-2 text-gray-600">{formatAmount(project.receiveAmount)}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{project.applicant || "-"}</td>
                      {visibleFields.map((f) => (
                        <td key={f.id} className="py-3 px-2 text-gray-600">{customData[f.key] || "-"}</td>
                      ))}
                      {isAdmin && (
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(project)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { if (confirm("确定删除此项目？")) deleteMutation.mutate({ id: project.id }); }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              显示第 {(filters.page - 1) * filters.pageSize + 1} 到 {Math.min(filters.page * filters.pageSize, total)} 条，共 {total} 条记录
            </span>
            <div className="flex gap-1">
              <button onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })} disabled={filters.page === 1} className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50">上一页</button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{filters.page}</span>
              <button onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })} disabled={filters.page === totalPages} className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">{editingId ? "编辑项目" : "添加项目"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">项目名称 <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">截止时间</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">对接部门</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">请选择部门</option>
                  {DEPT_OPTIONS.filter((o) => o.value !== "all").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">申报金额</label>
                <input type="text" value={form.applyAmount} onChange={(e) => setForm({ ...form, applyAmount: e.target.value })} placeholder="如: 100000或荣誉" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">状态 <span className="text-red-500">*</span></label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectForm["status"] })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">申报时间</label>
                <input type="date" value={form.applyDate} onChange={(e) => setForm({ ...form, applyDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">到账日期</label>
                <input type="date" value={form.receiveDate} onChange={(e) => setForm({ ...form, receiveDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">到账金额</label>
                <input type="text" value={form.receiveAmount} onChange={(e) => setForm({ ...form, receiveAmount: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">申报人</label>
                <select value={form.applicant} onChange={(e) => setForm({ ...form, applicant: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">请选择申报人</option>
                  {applicants.filter((a): a is string => !!a).map((a) => <option key={a} value={a}>{a}</option>)}
                  <option value="其他">其他</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">申报通知网站</label>
                <input type="url" value={form.noticeUrl} onChange={(e) => setForm({ ...form, noticeUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">公示链接</label>
                <input type="url" value={form.publicUrl} onChange={(e) => setForm({ ...form, publicUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Custom Fields */}
              {visibleFields.length > 0 && (
                <>
                  <div className="col-span-2 border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-800">自定义字段</h4>
                  </div>
                  {visibleFields.map((f) => (
                    <div key={f.id} className={f.fieldType === "textarea" ? "col-span-2" : ""}>
                      <label className="block text-sm text-gray-700 mb-1">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
                      {f.fieldType === "select" ? (
                        <select
                          value={form.customData[f.key] || ""}
                          onChange={(e) => handleCustomChange(f.key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          required={f.required}
                        >
                          <option value="">请选择</option>
                          {Array.isArray(f.options) && f.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : f.fieldType === "textarea" ? (
                        <textarea
                          value={form.customData[f.key] || ""}
                          onChange={(e) => handleCustomChange(f.key, e.target.value)}
                          rows={3}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          required={f.required}
                        />
                      ) : (
                        <input
                          type={f.fieldType === "number" ? "number" : f.fieldType === "date" ? "date" : "text"}
                          value={form.customData[f.key] || ""}
                          onChange={(e) => handleCustomChange(f.key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          required={f.required}
                        />
                      )}
                    </div>
                  ))}
                </>
              )}

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

      {/* Field Config Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">字段配置</h3>
              <button onClick={() => setShowFieldModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <form onSubmit={handleFieldSubmit} className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">字段标识 <span className="text-red-500">*</span></label>
                  <input type="text" value={fieldForm.key} onChange={(e) => setFieldForm({ ...fieldForm, key: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" disabled={!!fieldForm.id} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">字段名称 <span className="text-red-500">*</span></label>
                  <input type="text" value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">类型</label>
                  <select value={fieldForm.fieldType} onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value as any })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(FIELD_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">排序</label>
                  <input type="number" value={fieldForm.order} onChange={(e) => setFieldForm({ ...fieldForm, order: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                {fieldForm.fieldType === "select" && (
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">选项（每行一个）</label>
                    <textarea value={fieldForm.options} onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                )}
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={fieldForm.required} onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })} className="rounded" />
                    必填
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={fieldForm.isVisible} onChange={(e) => setFieldForm({ ...fieldForm, isVisible: e.target.checked })} className="rounded" />
                    显示
                  </label>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button type="button" onClick={openFieldCreate} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">新增</button>
                  <button type="submit" disabled={createFieldMutation.isPending || updateFieldMutation.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </form>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-800 mb-3">已有字段</h4>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3">字段名</th>
                      <th className="text-left py-2 px-3">类型</th>
                      <th className="text-left py-2 px-3">排序</th>
                      <th className="text-left py-2 px-3">显示</th>
                      <th className="text-left py-2 px-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fields || []).sort((a, b) => a.order - b.order).map((f) => (
                      <tr key={f.id} className="border-b border-gray-50">
                        <td className="py-2 px-3">{f.label} <span className="text-gray-400 text-xs">({f.key})</span></td>
                        <td className="py-2 px-3">{FIELD_TYPE_LABELS[f.fieldType]}</td>
                        <td className="py-2 px-3">{f.order}</td>
                        <td className="py-2 px-3">{f.isVisible ? "是" : "否"}</td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <button onClick={() => openFieldEdit(f)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { if (confirm("确定删除此字段？")) deleteFieldMutation.mutate({ id: f.id }); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
