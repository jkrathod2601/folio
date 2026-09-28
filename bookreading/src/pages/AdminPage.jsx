import { useState } from "react";
import { ShieldCheck, Loader2, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBadge } from "@/components/AdminBadge";
import { useAdminUsers, useSetRole } from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function Avatar({ user }) {
  const initials =
    (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return user.portraitUrl ? (
    <img
      src={user.portraitUrl}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full object-cover"
      loading="lazy"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-mono text-xs font-bold text-zinc-600"
    >
      {initials}
    </span>
  );
}

function RoleControl({ user, onSet, pending }) {
  const promoting = user.role !== "admin";

  return (
    <Button
      variant={promoting ? "default" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() => onSet(user.id, promoting ? "admin" : "reader")}
      title={
        promoting
          ? `Grant admin to ${user.email}`
          : `Remove admin from ${user.email}`
      }
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : promoting ? (
        "Make Admin"
      ) : (
        "Remove Admin"
      )}
    </Button>
  );
}

function AdminPage() {
  const { data: users, isLoading, error } = useAdminUsers();
  const setRole = useSetRole();
  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const visible = (users ?? []).filter((u) =>
    q
      ? [u.name, u.email, u.username].some((f) =>
          (f ?? "").toLowerCase().includes(q)
        )
      : true
  );

  const adminCount = (users ?? []).filter((u) => u.role === "admin").length;

  return (
    <div className="max-w-[1000px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-wide text-zinc-950">
            Administration
          </h1>
          <p className="mt-1 font-code text-xs text-zinc-500">
            Accounts and roles. Everyone else sees only their own profile.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-zinc-950">
              {adminCount}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              admins
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-zinc-950">
              {users?.length ?? "—"}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              accounts
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-4 flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <p className="font-body text-sm text-zinc-600">
          Admins can promote any account. The last admin cannot be demoted —
          promote a second admin first, or nobody can restore access.
        </p>
      </Card>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or username"
          aria-label="Search accounts"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 font-body text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-16 font-mono text-xs uppercase tracking-wider text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading accounts
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="font-body text-sm font-semibold text-zinc-950">
            Could not load accounts
          </p>
          <p className="mt-1 font-code text-xs text-zinc-500">
            {error?.message ?? "Unknown error"}
          </p>
        </div>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <Users className="h-5 w-5 text-zinc-300" />
          <p className="font-body text-sm text-zinc-600">
            {users?.length
              ? "No accounts match that search."
              : "No accounts yet."}
          </p>
        </div>
      )}

      {visible.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Accounts and their roles. Admins can change any role.
            </caption>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th
                  scope="col"
                  className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                >
                  Account
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 sm:table-cell"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:table-cell"
                >
                  Joined
                </th>
                <th scope="col" className="px-4 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => {
                const isSelf = user.id === me?.id;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-body text-sm font-semibold text-zinc-950">
                            <span className="truncate">
                              {user.name || user.email.split("@")[0]}
                            </span>
                            {isSelf && (
                              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                                you
                              </span>
                            )}
                          </p>
                          <p className="truncate font-code text-xs text-zinc-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <AdminBadge role={user.role} />
                    </td>
                    <td className="hidden px-4 py-3 font-code text-xs text-zinc-500 md:table-cell">
                      {formatDate(user.joined)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="sm:hidden">
                          <AdminBadge role={user.role} />
                        </span>
                        <RoleControl
                          user={user}
                          pending={
                            setRole.isPending && setRole.variables?.id === user.id
                          }
                          onSet={(id, role) => setRole.mutate({ id, role })}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {setRole.error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 font-code text-xs text-zinc-700"
        >
          {setRole.error?.message ?? "Could not change that role."}
        </p>
      )}
    </div>
  );
}

export { AdminPage };
