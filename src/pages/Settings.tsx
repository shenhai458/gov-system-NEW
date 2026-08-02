import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Save, RotateCcw, Shield, Bell, Database } from "lucide-react";

export default function Settings() {
  const { isAdmin } = useAuth();
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.setting.get.useQuery();
  const updateMutation = trpc.setting.update.useMutation({
    onSuccess: () => utils.setting.get.invalidate(),
  });

  const [form, setForm] = useState({
    systemName: "政府项目申报管理系统",
    timezone: "Asia/Shanghai",
    emailNotification: "on" as "on" | "off",
    expiryReminder: "on" as "on" | "off",
    reminderDays: 7,
    passwordComplexity: "on" as "on" | "off",
    loginLock: "on" as "on" | "off",
    sessionTimeout: 30,
    autoBackup: "off" as "on" | "off",
    backupFrequency: "daily",
    backupRetention: 30,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        systemName: settings.systemName || "政府项目申报管理系统",
        timezone: settings.timezone || "Asia/Shanghai",
        emailNotification: (settings.emailNotification as "on" | "off") || "on",
        expiryReminder: (settings.expiryReminder as "on" | "off") || "on",
        reminderDays: settings.reminderDays || 7,
        passwordComplexity: (settings.passwordComplexity as "on" | "off") || "on",
        loginLock: (settings.loginLock as "on" | "off") || "on",
        sessionTimeout: settings.sessionTimeout || 30,
        autoBackup: (settings.autoBackup as "on" | "off") || "off",
        backupFrequency: settings.backupFrequency || "daily",
        backupRetention: settings.backupRetention || 30,
      });
    }
  }, [settings]);

  const handleSave = () => {
    if (!isAdmin) return;
    updateMutation.mutate(form);
  };

  const handleReset = () => {
    if (settings) {
      setForm({
        systemName: settings.systemName || "政府项目申报管理系统",
        timezone: settings.timezone || "Asia/Shanghai",
        emailNotification: (settings.emailNotification as "on" | "off") || "on",
        expiryReminder: (settings.expiryReminder as "on" | "off") || "on",
        reminderDays: settings.reminderDays || 7,
        passwordComplexity: (settings.passwordComplexity as "on" | "off") || "on",
        loginLock: (settings.loginLock as "on" | "off") || "on",
        sessionTimeout: settings.sessionTimeout || 30,
        autoBackup: (settings.autoBackup as "on" | "off") || "off",
        backupFrequency: settings.backupFrequency || "daily",
        backupRetention: settings.backupRetention || 30,
      });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">系统设置</h2>
          <p className="text-sm text-gray-500 mt-1">配置系统参数和偏好设置</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "保存中..." : "保存设置"}
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm transition-colors">
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
          当前为只读模式，仅管理员可修改系统设置。
        </div>
      )}

      {/* Basic Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">基本设置</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">系统名称</p>
              <p className="text-xs text-gray-500">设置系统的显示名称</p>
            </div>
            <input
              type="text"
              value={form.systemName}
              onChange={(e) => setForm({ ...form, systemName: e.target.value })}
              disabled={!isAdmin}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 disabled:bg-gray-50"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">时区设置</p>
              <p className="text-xs text-gray-500">选择系统使用的时区</p>
            </div>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              disabled={!isAdmin}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 disabled:bg-gray-50"
            >
              <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
              <option value="Asia/Hong_Kong">香港时间 (UTC+8)</option>
              <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
              <option value="America/New_York">纽约时间 (UTC-5)</option>
              <option value="Europe/London">伦敦时间 (UTC+0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-800">通知设置</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">邮件通知</p>
              <p className="text-xs text-gray-500">启用邮件通知功能</p>
            </div>
            <button
              onClick={() => isAdmin && setForm({ ...form, emailNotification: form.emailNotification === "on" ? "off" : "on" })}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${form.emailNotification === "on" ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.emailNotification === "on" ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">项目到期提醒</p>
              <p className="text-xs text-gray-500">项目即将到期时发送提醒</p>
            </div>
            <button
              onClick={() => isAdmin && setForm({ ...form, expiryReminder: form.expiryReminder === "on" ? "off" : "on" })}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${form.expiryReminder === "on" ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.expiryReminder === "on" ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">提醒时间</p>
              <p className="text-xs text-gray-500">设置提前多少天发送提醒</p>
            </div>
            <select
              value={form.reminderDays}
              onChange={(e) => setForm({ ...form, reminderDays: parseInt(e.target.value) })}
              disabled={!isAdmin}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 disabled:bg-gray-50"
            >
              <option value={1}>1天</option>
              <option value={3}>3天</option>
              <option value={7}>7天</option>
              <option value={14}>14天</option>
              <option value={30}>30天</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-800">安全设置</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">密码复杂度要求</p>
              <p className="text-xs text-gray-500">要求密码包含大小写字母、数字和特殊字符</p>
            </div>
            <button
              onClick={() => isAdmin && setForm({ ...form, passwordComplexity: form.passwordComplexity === "on" ? "off" : "on" })}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${form.passwordComplexity === "on" ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.passwordComplexity === "on" ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">登录失败锁定</p>
              <p className="text-xs text-gray-500">连续登录失败5次后锁定账户30分钟</p>
            </div>
            <button
              onClick={() => isAdmin && setForm({ ...form, loginLock: form.loginLock === "on" ? "off" : "on" })}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${form.loginLock === "on" ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.loginLock === "on" ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">会话超时时间</p>
              <p className="text-xs text-gray-500">设置用户无操作后的自动登出时间（分钟）</p>
            </div>
            <input
              type="number"
              value={form.sessionTimeout}
              onChange={(e) => setForm({ ...form, sessionTimeout: parseInt(e.target.value) || 30 })}
              disabled={!isAdmin}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Database className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">数据备份</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">自动备份</p>
              <p className="text-xs text-gray-500">启用自动数据备份功能</p>
            </div>
            <button
              onClick={() => isAdmin && setForm({ ...form, autoBackup: form.autoBackup === "on" ? "off" : "on" })}
              disabled={!isAdmin}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${form.autoBackup === "on" ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.autoBackup === "on" ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">备份频率</p>
              <p className="text-xs text-gray-500">设置数据备份的频率</p>
            </div>
            <select
              value={form.backupFrequency}
              onChange={(e) => setForm({ ...form, backupFrequency: e.target.value })}
              disabled={!isAdmin}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 disabled:bg-gray-50"
            >
              <option value="hourly">每小时</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">备份保留时间</p>
              <p className="text-xs text-gray-500">设置备份文件的保留期限（天）</p>
            </div>
            <input
              type="number"
              value={form.backupRetention}
              onChange={(e) => setForm({ ...form, backupRetention: parseInt(e.target.value) || 30 })}
              disabled={!isAdmin}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
