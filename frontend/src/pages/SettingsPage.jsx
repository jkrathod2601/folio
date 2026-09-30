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

/**
 * A label and its control on one line.
 *
 * `flex-wrap` and the `min-w-0` on the label are both load-bearing at 390px. The
 * Density control is 258px wide and cannot shrink, so beside a non-shrinking
 * title it overflowed the card by 17px and pushed the whole document to 407px
 * — which then widened the layout viewport and dragged the fixed header and
 * scrim out with it. The label yields first, and the control drops to its own
 * line only when there is genuinely no room.
 */
function Row({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-zinc-100 py-4 last:border-0">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-zinc-500" />
        <div className="min-w-0">
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
          <div className="flex shrink-0 gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5">
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
