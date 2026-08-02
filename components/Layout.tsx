import { Outlet, Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Shield,
  Building2,
  Award,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "仪表板", icon: LayoutDashboard },
  { path: "/projects", label: "项目管理", icon: FolderKanban },
  { path: "/analytics", label: "数据分析", icon: BarChart3 },
  { path: "/honors", label: "企业荣誉库", icon: Award },
  { path: "/users", label: "用户管理", icon: Users },
  { path: "/settings", label: "系统设置", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">项目管理系统</h1>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-white/20 text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.realName || user?.username}
                </p>
                <p className="text-white/60 text-xs">
                  {isAdmin ? "管理员" : "只读用户"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 text-white text-xs py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gray-100/95 m-2 rounded-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
