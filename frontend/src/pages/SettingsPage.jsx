import { useState } from "react";
import { Moon, Sun, Type, Bell, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

const densities = [
  { id: "compact", label: "Compact" },
  { id: "comfortable", label: "Comfortable" },
  { id: "spacious", label: "Spacious" },
];

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-black" : "bg-zinc-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

function Row({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-zinc-100 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-zinc-500" />
        <div>
          <p className="font-body text-sm font-bold text-zinc-950">{title}</p>
          <p className="font-code text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  const [density, setDensity] = useState("comfortable");
  const [digest, setDigest] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  return (
    <div className="max-w-[820px]">
      <h1 className="mb-6 font-heading text-3xl font-semibold tracking-wide text-zinc-950">Settings</h1>

      <Card className="mb-4 p-5">
        <h2 className="mb-1 font-heading text-xl font-semibold tracking-wide text-zinc-950">Appearance</h2>
        <p className="mb-2 font-code text-xs text-zinc-500">Strict monochrome edition</p>

        <Row icon={dark ? Moon : Sun} title="Dark mode" description="Invert the monochrome palette">
          <Toggle checked={dark} onChange={(v) => setTheme(v ? "dark" : "light")} label="Dark mode" />
        </Row>

        <Row icon={Type} title="Density" description="Spacing scale for reading and writing">
          <div className="flex gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5">
            {densities.map((d) => (
              <button
                key={d.id}
                onClick={() => setDensity(d.id)}
                className={cn(
                  "rounded-full px-3 py-1 font-mono text-[11px] transition-colors",
                  density === d.id ? "bg-black font-semibold text-white" : "text-zinc-600 hover:text-black"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Row>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 font-heading text-xl font-semibold tracking-wide text-zinc-950">Privacy & Alerts</h2>
        <p className="mb-2 font-code text-xs text-zinc-500">Control what the feed shows you</p>

        <Row icon={Bell} title="Weekly digest" description="A Monday recap of your reading circle">
          <Toggle checked={digest} onChange={setDigest} label="Weekly digest" />
        </Row>

        <Row icon={Eye} title="Public profile" description="Let readers find your manuscripts">
          <Toggle checked={publicProfile} onChange={setPublicProfile} label="Public profile" />
        </Row>
      </Card>
    </div>
  );
}

export { SettingsPage };
