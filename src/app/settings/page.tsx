"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion } from "framer-motion";
import { Settings, Eye, Type, Palette, Globe, Clock, Volume2, Bell, Shield, Trash2, Download, User, Check, Loader2, Save } from "lucide-react";
import { useUser } from "@/context/user-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-[#00B4D8]' : 'bg-slate-900/10'}`}>
      <motion.div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" animate={{ left: enabled ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/profile/${user.user_id}`);
        const data = await res.json();
        setSettings({
          dyslexia_mode: data.accessibility?.dyslexia_mode || false,
          high_contrast: data.accessibility?.high_contrast || false,
          reduce_motion: data.accessibility?.reduce_motion || false,
          font_size: data.accessibility?.font_size || "normal",
          language: data.language || "en",
          sessionLength: 30,
          notifications: true
        });
      } catch (e) {
        console.error(e);
        // Fallback defaults
        setSettings({
          dyslexia_mode: false, high_contrast: false, reduce_motion: false,
          font_size: "normal", language: "en", sessionLength: 30, notifications: true
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const toggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const saveSettings = async (newSettings: any) => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await fetch(`${API_BASE_URL}/auth/profile/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: newSettings.language,
          accessibility: {
            dyslexia_mode: newSettings.dyslexia_mode,
            high_contrast: newSettings.high_contrast,
            reduce_motion: newSettings.reduce_motion,
            font_size: newSettings.font_size,
          }
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/${user.user_id}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurolearn-profile-${user.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <AppShell><div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-[#00B4D8] animate-spin" /></div></AppShell>;

  const userName = user?.name || "User";
  const userEmail = user?.email || "user@neurolearn.ai";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-[#00B4D8]" /> Settings</h1>
            <p className="text-slate-800/40 text-sm mt-1">Customize your learning experience</p>
          </motion.div>
          <div className="flex items-center gap-2">
            {isSaving && <div className="text-[10px] text-[#00B4D8] animate-pulse flex items-center gap-1"><Save className="w-3 h-3" /> Saving...</div>}
            {saveSuccess && <div className="text-[10px] text-[#10B981] flex items-center gap-1"><Check className="w-3 h-3" /> Saved!</div>}
          </div>
        </div>

        {/* Accessibility */}
        <motion.div className="glass p-6 space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-slate-800/60 uppercase tracking-wider flex items-center gap-2"><Eye className="w-4 h-4" /> Accessibility</h3>
          <div className="space-y-4">
            {[
              { key: "dyslexia_mode", label: "Dyslexia-Friendly Font", desc: "Use OpenDyslexic font for better readability", icon: Type },
              { key: "high_contrast", label: "High Contrast Mode", desc: "Increase contrast for better visibility", icon: Palette },
              { key: "reduce_motion", label: "Reduce Animations", desc: "Minimize motion for motion-sensitive users", icon: Eye },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/[0.02]">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-slate-800/30" />
                  <div><div className="text-sm text-slate-800/80">{item.label}</div><div className="text-[10px] text-slate-800/30">{item.desc}</div></div>
                </div>
                <Toggle enabled={settings?.[item.key] || false} onChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Learning Preferences */}
        <motion.div className="glass p-6 space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-slate-800/60 uppercase tracking-wider flex items-center gap-2"><Globe className="w-4 h-4" /> Learning Preferences</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900/[0.02]">
              <label className="text-sm text-slate-800/80 mb-2 block">Preferred Language</label>
              <select value={settings?.language || "en"} onChange={e => { const newS = { ...settings, language: e.target.value }; setSettings(newS); saveSettings(newS); }} className="w-full bg-slate-900/[0.04] border border-slate-900/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none appearance-none cursor-pointer">
                {[
                  { code: "en", name: "English" },
                  { code: "hi", name: "Hindi" },
                  { code: "es", name: "Spanish" },
                  { code: "fr", name: "French" },
                  { code: "de", name: "German" },
                  { code: "ar", name: "Arabic" },
                ].map(l => <option key={l.code} value={l.code} className="bg-white">{l.name}</option>)}
              </select>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/[0.02]">
              <div className="text-sm text-slate-800/80 mb-2">Session Length</div>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map(mins => (
                  <button key={mins} onClick={() => { setSettings({ ...settings, sessionLength: mins }); }} className={`flex-1 py-2 rounded-lg text-xs ${settings?.sessionLength === mins ? 'bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20' : 'bg-slate-900/[0.02] text-slate-800/30 border border-transparent hover:bg-slate-900/[0.04]'}`}>{mins}min</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/[0.02]">
              <div className="flex items-center gap-3"><Bell className="w-4 h-4 text-slate-800/30" /><span className="text-sm text-slate-800/80">Notifications</span></div>
              <Toggle enabled={settings?.notifications || false} onChange={() => toggle("notifications")} />
            </div>
          </div>
        </motion.div>

        {/* Account */}
        <motion.div className="glass p-6 space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-slate-800/60 uppercase tracking-wider flex items-center gap-2"><User className="w-4 h-4" /> Account</h3>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/[0.02]">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-slate-800 font-bold text-lg">{userInitial}</div>
            <div><div className="text-sm font-medium text-slate-800/80">{userName}</div><div className="text-xs text-slate-800/30">{userEmail}</div></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={exportData} className="btn-ghost py-2 px-4 text-xs flex items-center gap-1"><Download className="w-3 h-3" /> Export Data</button>
            <button className="py-2 px-4 rounded-xl border border-[#FF3366]/20 text-[#FF3366] text-xs flex items-center gap-1 hover:bg-[#FF3366]/5"><Trash2 className="w-3 h-3" /> Delete Account</button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
