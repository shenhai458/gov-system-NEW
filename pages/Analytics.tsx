import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";
import { TrendingUp, Trophy, Clock, Zap, RefreshCw, Download, Plus, Edit, Trash2, X, Save, FolderOpen } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp, Trophy, Clock, Zap, FolderOpen, Plus,
};

const COLOR_STYLES: Record<string, string> = {
  indigo: "bg-gradient-to-br from-indigo-500 to-purple-600",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-500",
  amber: "bg-gradient-to-br from-amber-500 to-orange-500",
  blue: "bg-gradient-to-br from-blue-500 to-cyan-500",
  red: "bg-gradient-to-br from-red-500 to-rose-500",
  purple: "bg-gradient-to-br from-purple-500 to-pink-500",
};

const CARD_TYPE_LABELS: Record<string, string> = {
  total: "总项目数",
  inProgress: "进行中项目",
  completed: "已完成项目",
  failed: "未通过项目",
  pending: "待审核项目",
  totalAmount: "总金额",
  successRate: "成功率",
  activeProjects: "活跃项目",
};

export default function Analytics() {
  const { isAdmin } = useAuth();
  const utils = trpc.useUtils();

  const { data: overview } = trpc.analytics.overview.useQuery();
  const { data: monthlyTrend } = trpc.analytics.monthlyTrend.useQuery();
  const { data: deptDist } = trpc.analytics.departmentDistribution.useQuery();
  const { data: statusAnalysis } = trpc.analytics.statusAnalysis.useQuery();
  const { data: applicantPerf } = trpc.analytics.applicantPerformance.useQuery();
  const { data: monthlyAmount } = trpc.analytics.monthlyAmount.useQuery();
  const { data: deptSuccess } = trpc.analytics.departmentSuccess.useQuery();
  const { data: cards } = trpc.analytics.cards.list.useQuery();

  const createCard = trpc.analytics.cards.create.useMutation({
    onSuccess: () => utils.analytics.cards.list.invalidate(),
  });
  const updateCard = trpc.analytics.cards.update.useMutation({
    onSuccess: () => utils.analytics.cards.list.invalidate(),
  });
  const deleteCard = trpc.analytics.cards.delete.useMutation({
    onSuccess: () => utils.analytics.cards.list.invalidate(),
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<{
    id?: number;
    title: string;
    type: string;
    icon: string;
    color: string;
    order: number;
    isVisible: boolean;
  } | null>(null);

  const visibleCards = (cards || []).filter((c) => c.isVisible).sort((a, b) => a.order - b.order);

  const trendData = (monthlyTrend || []).map((m) => ({
    month: m.month,
    申报数量: m.applyCount,
    成功数量: m.successCount,
  }));

  const getCardValue = (type: string) => {
    switch (type) {
      case "total": return overview?.totalProjects || 0;
      case "inProgress": return (overview?.totalProjects || 0) - (overview?.completedProjects || 0) - (overview?.failedProjects || 0);
      case "completed": return overview?.completedProjects || 0;
      case "failed": return overview?.failedProjects || 0;
      case "pending": return (overview?.totalProjects || 0) - (overview?.completedProjects || 0) - (overview?.failedProjects || 0);
      case "totalAmount":
        return overview?.totalApplyAmount && overview.totalApplyAmount >= 10000
          ? `${(overview.totalApplyAmount / 10000).toFixed(1)}万`
          : `${overview?.totalApplyAmount || 0}`;
      case "successRate": return `${overview?.successRate || 0}%`;
      case "activeProjects": return overview?.activeProjects || 0;
      default: return "-";
    }
  };

  const openCardCreate = () => {
    setEditingCard({ title: "", type: "total", icon: "FolderOpen", color: "indigo", order: 0, isVisible: true });
    setShowModal(true);
  };

  const openCardEdit = (c: typeof visibleCards[0]) => {
    setEditingCard({
      id: c.id,
      title: c.title,
      type: c.type,
      icon: c.icon,
      color: c.color,
      order: c.order,
      isVisible: c.isVisible,
    });
    setShowModal(true);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard?.title) return;
    if (editingCard.id) {
      updateCard.mutate({
        id: editingCard.id,
        title: editingCard.title,
        type: editingCard.type as any,
        icon: editingCard.icon,
        color: editingCard.color,
        order: editingCard.order,
        isVisible: editingCard.isVisible,
      });
    } else {
      createCard.mutate({
        title: editingCard.title,
        type: editingCard.type as any,
        icon: editingCard.icon,
        color: editingCard.color,
        order: editingCard.order,
        isVisible: editingCard.isVisible,
      });
    }
    setShowModal(false);
    setEditingCard(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">数据分析</h2>
          <p className="text-sm text-gray-500 mt-1">深度分析项目申报数据与趋势</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={openCardCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加卡片
            </button>
          )}
          <button
            onClick={() => {
              utils.analytics.overview.invalidate();
              utils.analytics.monthlyTrend.invalidate();
              utils.analytics.departmentDistribution.invalidate();
              utils.analytics.statusAnalysis.invalidate();
              utils.analytics.applicantPerformance.invalidate();
              utils.analytics.monthlyAmount.invalidate();
              utils.analytics.departmentSuccess.invalidate();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          当前为只读模式，您仅可查看分析数据。
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {visibleCards.length === 0 ? (
          <div className="col-span-4 text-center py-8 text-gray-400">暂无分析卡片</div>
        ) : (
          visibleCards.map((card) => {
            const Icon = ICON_MAP[card.icon] || TrendingUp;
            return (
              <div key={card.id} className={`${COLOR_STYLES[card.color] || COLOR_STYLES.indigo} rounded-xl p-5 text-white relative group`}>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openCardEdit(card)} className="p-1 bg-white/20 rounded hover:bg-white/30">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button onClick={() => { if (confirm("确定删除此卡片？")) deleteCard.mutate({ id: card.id }); }} className="p-1 bg-white/20 rounded hover:bg-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/80 text-sm">{card.title}</p>
                  <Icon className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-3xl font-bold">{getCardValue(card.type)}</p>
                <p className="text-white/60 text-xs mt-1">{CARD_TYPE_LABELS[card.type]}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">申报趋势分析</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="申报数量" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="成功数量" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">部门项目分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={deptDist || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {(deptDist || []).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">项目状态分析</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusAnalysis || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">申报人绩效分析</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={applicantPerf || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="项目数量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="success" name="成功数量" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">月度金额趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyAmount || []}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`} />
              <Area type="monotone" dataKey="amount" name="申报金额" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">部门成功率对比</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptSuccess || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="rate" name="成功率" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card Modal */}
      {showModal && editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md m-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editingCard.id ? "编辑卡片" : "添加卡片"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCardSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">标题</label>
                <input type="text" value={editingCard.title} onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">指标类型</label>
                <select value={editingCard.type} onChange={(e) => setEditingCard({ ...editingCard, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(CARD_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">图标名</label>
                  <input type="text" value={editingCard.icon} onChange={(e) => setEditingCard({ ...editingCard, icon: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">颜色</label>
                  <select value={editingCard.color} onChange={(e) => setEditingCard({ ...editingCard, color: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="indigo">Indigo</option>
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
                <input type="number" value={editingCard.order} onChange={(e) => setEditingCard({ ...editingCard, order: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editingCard.isVisible} onChange={(e) => setEditingCard({ ...editingCard, isVisible: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">显示</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">取消</button>
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
