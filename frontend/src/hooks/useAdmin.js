import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { authKeys } from "./useAuth";

export const adminKeys = {
  users: ["admin", "users"],
};

/**
 * The account list for the admin panel.
 *
 * The server caps this at 100 records, so there is no pagination to keep in
 * sync here yet. When there is, this hook is the only thing that changes.
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: () => api.get("/admin/users").then((r) => r.users),
    staleTime: 10_000,
  });
}

/**
 * Change someone's role.
 *
 * Invalidates the list so the row reflects the server's answer rather than the
 * optimistic guess. Optimism is deliberately not used: a role change is rare
 * and consequential, and the failure mode of showing a stale "admin" badge is
 * worse than the 100ms of a disabled button.
 */
export function useSetRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users });
      // If an admin demotes themselves, the store copy of their own profile is
      // now wrong — the sidebar would keep showing the admin link and /admin
      // would bounce. Re-pull it.
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
