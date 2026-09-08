import { useEffect, useState } from "react";
import { Settings, User, Bell, Shield, MonitorSmartphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSimulation } from "@/context/SimulationContext";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
  const sim = useSimulation();
  const { user, updateProfile, isDemoMode } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setEmail(user.email || "");
  }, [user?.id]);

  async function saveProfile() {
    if (saving) return;

    setSaving(true);
    setSaved(false);

    const updated = await updateProfile(name);

    setSaving(false);
    setSaved(updated);

    toast.push(
      updated
        ? "Profile updated successfully"
        : "Unable to update your profile. Please try again.",
      updated ? "success" : "error"
    );

    if (updated) {
      window.setTimeout(() => setSaved(false), 1800);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHeader icon={Settings} eyebrow="Account" title="Settings"
        description="Your GreenVest profile and product preferences." />

      <GlassCard className="p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950"><User className="h-5 w-5 text-forest-600" /> Profile</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Label t="Full name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              autoComplete="name"
              placeholder="Enter your full name"
            />
          </Label>
          <Label t="Email">
            <input
              type="email"
              value={email}
              className="input"
              readOnly
              autoComplete="email"
            />
          </Label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <AnimatedButton size="md" onClick={() => void saveProfile()}>
            {saved ? "Saved ✓" : "Save changes"}
          </AnimatedButton>
          <StatusBadge tone={isDemoMode ? "mint" : "emerald"}>{isDemoMode ? "Demo profile session" : "Supabase profile synced"}</StatusBadge>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-6">
          <Bell className="h-5 w-5 text-forest-600" />
          <h4 className="mt-3 font-display text-base font-semibold text-forest-950">Notifications</h4>
          <div className="mt-3 space-y-2">
            {["Analysis saved", "Scenario saved", "Report generated"].map((n) => (
              <label key={n} className="flex items-center justify-between text-sm text-slate-600">
                {n}
                <input type="checkbox" defaultChecked className="accent-forest-600 h-4 w-4" />
              </label>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <MonitorSmartphone className="h-5 w-5 text-forest-600" />
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h4 className="font-display text-base font-semibold text-forest-950">{isDemoMode ? "Demo Mode" : "Cloud Sync"}</h4>
              <p className="text-sm text-slate-400">{isDemoMode ? "Simulated estimates active" : "Supabase session active"}</p>
            </div>
            <StatusBadge tone={isDemoMode ? "mint" : "emerald"} dot>{isDemoMode ? "ON" : "LIVE"}</StatusBadge>
          </div>
          <div className="mt-4 rounded-xl bg-forest-50 p-3 text-xs text-forest-800">
            <b>Current plan data:</b> {sim.analyzed ? `${sim.land.location} · ${sim.land.area} acres` : "No analysis yet"}.
          </div>
        </GlassCard>
      </div>

      <GlassCard className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-slate-400" />
          <div>
            <p className="font-semibold text-forest-950">Plan</p>
            <p className="text-sm text-slate-400">You are on the <b>Free</b> tier</p>
          </div>
        </div>
        <ComingSoonBadge label="Upgrade in next stage" />
      </GlassCard>
    </div>
  );

  function Label({ t, children }: { t: string; children: React.ReactNode }) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-forest-900">{t}</span>
        {children}
      </label>
    );
  }
}
