import { useState } from "react";
import { Users, Timer, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const circles = [
  { id: 1, name: "15-min Sprint Room", topic: "Daily word goal", members: 42, live: true, initials: [] },
  { id: 2, name: "Hindi Poetry Circle", topic: "Shayari & micro-fiction", members: 128, live: true, initials: ["AK", "MR", "SZ"] },
  { id: 3, name: "Travel Writers Guild", topic: "Postcards from the road", members: 76, live: false, initials: ["VP", "RN"] },
  { id: 4, name: "Beta Reading Guild", topic: "Swap drafts, sharpen prose", members: 214, live: false, initials: ["SC", "JL", "PD", "HK"] },
];

function CirclesPage() {
  const [joined, setJoined] = useState([]);

  const toggle = (id) =>
    setJoined((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="max-w-[820px]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold tracking-wide text-zinc-950">Writing Circles</h1>
        <span className="font-mono text-xs text-zinc-500">{circles.length} active</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {circles.map((circle) => {
          const isJoined = joined.includes(circle.id);
          return (
            <Card key={circle.id} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-[18px] w-[18px] text-black" />
                  <h2 className="font-heading text-xl font-semibold tracking-wide text-zinc-950">{circle.name}</h2>
                </div>
                {circle.live && (
                  <span className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-black">
                    <span className="h-1.5 w-1.5 rounded-full bg-black" />
                    Live
                  </span>
                )}
              </div>

              <p className="mb-4 font-body text-sm text-zinc-600">{circle.topic}</p>

              {circle.initials.length > 0 && (
                <div className="-space-x-2 mb-4 flex">
                  {circle.initials.map((i) => (
                    <span
                      key={i}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-200 font-mono text-[10px] font-semibold text-zinc-700"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-xs text-zinc-500">
                  <Timer className="h-3.5 w-3.5" />
                  {circle.members} members
                </span>
                <Button
                  variant={isJoined ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggle(circle.id)}
                >
                  {isJoined ? "Joined" : "Join Circle"}
                  {!isJoined && <ArrowUpRight className="h-[18px] w-[18px]" />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { CirclesPage };
