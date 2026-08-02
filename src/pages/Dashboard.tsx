import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FolderOpen, Clock, CheckCircle2, CircleDollarSign, Plus, RefreshCw, Download, AlertTriangle,
  Edit, Trash2, X, Save, TrendingUp, Trophy, Zap,
} from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6b7280"];
const STATUS_LABELS: Record<string, string> = { ok: "已通过", failed: "未通过", in_progress: "进行中", pending: "待审核" };

const ICON_MAP: Record<string, React.ElementType> = {
  FolderOpen, Clock, CheckCircle2, CircleDollarSign, TrendingUp, Trophy, Zap, Plus,
};

const COLOR_STYLES: Record<string, string> = {
  indigo: "bg-gradient-to-br from-indigo-500 to-purple-600",
  blue: "bg-gradient-to-br from-blue-500 to-cyan-500",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-500",
  amber: "bg-gradient-to-br from-amber-500 to-orange-500",
  red: "bg-gradient-to-br from-red-500 to-rose-500",
  purple: "bg-gradient-to-br from-purple-500 to-pink-500",
};

const WIDGET_TYPE_LABELS: Record<string, string> = {
  total: "总项目数",
  inProgress: "进行中项目",
  completed: "已完成项目",
  failed: "未通过项目",
  pending: "待审核项目",
  totalAmount: "总金额",
  successRate: "成功率",
  activeProjects: "活跃项目",
};

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const utils = trpc.useUtils();

  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: widgets, isLoading: widgetsLoading } = trpc.dashboard.widgets.list.useQuery();
  const { data: recentProjects } = trpc.dashboard.recentProjects.useQuery();
  const { data: expiringProjects } = trpc.dashboard.expiringProjects.useQuery();
  const { data: statusData } = trpc.analytics.statusAnalysis.useQuery();
  const { data: monthlyTrend } = trpc.analytics.monthlyTrend.useQuery();

  const createWidget = trpc.dashboard.widgets.create.useMutation({
    onSuccess: () => utils.dashboard.widgets.list.invalidate(),
  });
  const updateWidget = trpc.dashboard.widgets.update.useMutation({
    onSuccess: () => utils.dashboard.widgets.list.invalidate(),
  });
  const deleteWidget = trpc.dashboard.widgets.delete.useMutation({
    onSuccess: () => utils.dashboard.widgets.list.invalidate(),
  });

  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState<{
    id?: number;
    title: string;
    type: string;
    icon: string;
    color: string;
    order: number;
    isVisible: boolean;
  } | null>(null);

  const visibleWidgets = (widgets || []).filter((w) => w.isVisible).sort((a, b) => a.order - b.order);

  const formatAmount = (val: string | null) => {
    if (!val) return "-";
    if (val === "荣誉") return "荣誉";
    const num = parseFloat(val);
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    return `${num}`;
  };

  const getWidgetValue = (type: string) => {
    switch (type) {
      case "total": return stats?.total || 0;
      case "inProgress": return stats?.inProgress || 0;
      case "completed": return stats?.completed || 0;
      case "failed": return stats?.failed || 0;
      case "pending": return stats?.pending || 0;
      case "totalAmount":
        return stats?.totalAmount && stats.totalAmount >= 10000
          ? `${(stats.totalAmount / 10000).toFixed(1)}万`
          : `${stats?.totalAmount || 0}`;
      case "successRate": return `${stats?.successRate || 0}%`;
      case "activeProjects": return stats?.activeProjects || 0;
      default: return "-";
    }
  };

  const statusPieData = statusData || [];
  const trendData = (monthlyTrend || []).map((m) => ({
    name: m.month,
    申报项目: m.applyCount,
    完成项目: m.successCount,
  }));

  const openWidgetCreate = () => {
    setEditingWidget({ title: "", type: "total", icon: "FolderOpen", color: "blue", order: 0, isVisible: true });
    setShowWidgetModal(true);
  };

  const openWidgetEdit = (w: typeof visibleWidgets[0]) => {
    setEditingWidget({
      id: w.id,
      title: w.title,
      type: w.type,
      icon: w.icon,
      color: w.color,
      order: w.order,
      isVisible: w.isVisible,
    });
    setShowWidgetModal(true);
  };

  const handleWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWidget?.title) return;
    if (editingWidget.id) {
      updateWidget.mutate({
        id: editingWidget.id,
        title: editingWidget.title,
        type: editingWidget.type as any,
        icon: editingWidget.icon,
        color: editingWidget.color,
        order: editingWidget.order,
        isVisible: editingWidget.isVisible,
      });
    } else {
      createWidget.mutate({
        title: editingWidget.title,
        type: editingWidget.type as any,
        icon: editingWidget.icon,
        color: editingWidget.color,
        order: editingWidget.order,
        isVisible: editingWidget.isVisible,
      });
    }
    setShowWidgetModal(false);
    setEditingWidget(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">项目申报管理仪表板</h2>
          <p className="text-sm text-gray-500 mt-1">实时监控项目进度与状态</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={openWidgetCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加卡片
            </button>
          )}
          <Link
            to="/projects"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </Link>
          <button
            onClick={() => {
              utils.dashboard.stats.invalidate();
              utils.dashboard.widgets.list.invalidate();
              utils.dashboard.recentProjects.invalidate();
              utils.dashboard.expiringProjects.invalidate();
              utils.analytics.statusAnalysis.invalidate();
              utils.analytics.monthlyTrend.invalidate();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            同步数据
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          当前为只读模式，您仅可查看数据，无法进行修改、添加或删除操作。
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {widgetsLoading ? (
          <div className="col-span-4 text-center py-8 text-gray-400">加载中...</div>
        ) : visibleWidgets.length === 0 ? (
          <div className="col-span-4 text-center py-8 text-gray-400">暂无仪表盘卡片</div>
        ) : (
          visibleWidgets.map((widget) => {
            const Icon = ICON_MAP[widget.icon] || FolderOpen;
            return (
              <div
                key={widget.id}
                className={`${COLOR_STYLES[widget.color] || COLOR_STYLES.blue} rounded-xl p-5 text-white relative group`}
              >
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openWidgetEdit(widget)} className="p-1 bg-white/20 rounded hover:bg-white/30">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => { if (confirm("确定删除此卡片？")) deleteWidget.mutate({ id: widget.id }); }}
                      className="p-1 bg-white/20 rounded hover:bg-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/80 text-sm">{widget.title}</p>
                  <Icon className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-3xl font-bold">{getWidgetValue(widget.type)}</p>
                <p className="text-white/60 text-xs mt-1">{WIDGET_TYPE_LABELS[widget.type]}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">项目状态分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
              >
                {statusPieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusPieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">月度申报趋势</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorApply" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="申报项目" stroke="#3b82f6" fillOpacity={1} fill="url(#colorApply)" />
              <Area type="monotone" dataKey="完成项目" stroke="#10b981" fillOpacity={1} fill="url(#colorDone)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Projects */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">最近添加</h3>
          </div>
          <div className="space-y-3">
            {(recentProjects || []).slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.department}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    project.status === "ok"
                      ? "bg-emerald-100 text-emerald-700"
                      : project.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {STATUS_LABELS[project.status] || project.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">即将到期</h3>
          </div>
          {(expiringProjects || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p className="text-sm">暂无即将到期的项目</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(expiringProjects || []).slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                    <p className="text-xs text-gray-500">
                      截止: {project.deadline ? new Date(project.deadline).toLocaleDateString("zh-CN") : "-"}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                    {Math.ceil((new Date(project.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">快速统计</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">本月新增</span>
              <span className="text-sm font-semibold text-blue-600">
                {(recentProjects || []).filter((p) => p.createdAt && new Date(p.createdAt).getMonth() === new Date().getMonth()).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">本月完成</span>
              <span className="text-sm font-semibold text-emerald-600">
                {(recentProjects || []).filter((p) => p.status === "ok" && p.receiveDate && new Date(p.receiveDate).getMonth() === new Date().getMonth()).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">成功率</span>
              <span className="text-sm font-semibold text-purple-600">
                {stats?.successRate || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">荣誉资质</span>
              <span className="text-sm font-semibold text-amber-600">-</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project List Table */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">项目列表</h3>
          <Link to="/projects" className="text-blue-600 text-xs hover:underline">
            查看全部
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-gray-600 font-medium">项目名称</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">对接部门</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">申报金额</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">截止时间</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">状态</th>
                <th className="text-left py-3 px-2 text-gray-600 font-medium">申报人</th>
              </tr>
            </thead>
            <tbody>
              {(recentProjects || []).map((project) => (
                <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-800">{project.name}</td>
                  <td className="py-3 px-2 text-gray-600">{project.department || "-"}</td>
                  <td className="py-3 px-2 text-gray-600">{formatAmount(project.applyAmount)}</td>
                  <td className="py-3 px-2 text-gray-600">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString("zh-CN") : "-"}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        project.status === "ok"
                          ? "bg-emerald-100 text-emerald-700"
                          : project.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : project.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {STATUS_LABELS[project.status] || project.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{project.applicant || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Widget Modal */}
      {showWidgetModal && editingWidget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md m-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editingWidget.id ? "编辑卡片" : "添加卡片"}</h3>
              <button onClick={() => setShowWidgetModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleWidgetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">指标类型</label>
                <select
                  value={editingWidget.type}
                  onChange={(e) => setEditingWidget({ ...editingWidget, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(WIDGET_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">图标名</label>
                  <input
                    type="text"
                    value={editingWidget.icon}
                    onChange={(e) => setEditingWidget({ ...editingWidget, icon: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">颜色</label>
                  <select
                    value={editingWidget.color}
                    onChange={(e) => setEditingWidget({ ...editingWidget, color: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="indigo"> Indigo </option>
                    <option value="blue">Blue</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="red">Red</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">排序</label>
                <input
                  type="number"
                  value={editingWidget.order}
                  onChange={(e) => setEditingWidget({ ...editingWidget, order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingWidget.isVisible}
                  onChange={(e) => setEditingWidget({ ...editingWidget, isVisible: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">显示</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowWidgetModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
