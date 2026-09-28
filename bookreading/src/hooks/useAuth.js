import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export const authKeys = {
  me: ["auth", "me"],
  config: ["auth", "config"],
};

/** The signed-in user. Disabled until the store has a token to send. */
export function useMe() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: () => api.get("/auth/me").then((r) => r.user),
    enabled: status === "authenticated",
    // The store already holds the user from the refresh response; this query is
    // a revalidation, so a long staleTime avoids a request on every mount.
    staleTime: 60_000,
    initialData: user ?? undefined,
  });

  // The OAuth callback can only put an access token in the URL fragment, so the
  // store starts out with no user. The server is the authority on who is
  // signed in — mirror its answer back into the store rather than leaving
  // components to guess from a null user.
  useEffect(() => {
    if (query.data && query.data !== user) setUser(query.data);
  }, [query.data, user, setUser]);

  return query;
}

/** Which sign-in providers the server has configured. */
export function useAuthConfig() {
  return useQuery({
    queryKey: authKeys.config,
    queryFn: () => api.get("/auth/config", { auth: false }),
    staleTime: Infinity,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: () => api.post("/auth/logout", undefined, { auth: false }),
    // The local session goes regardless: if the network call fails the cookie
    // may still be alive, but the user asked to sign out and should look signed
    // out immediately.
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useActiveSessions() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: [...authKeys.me, "sessions"],
    queryFn: () => api.get("/auth/sessions").then((r) => r.sessions),
    enabled: status === "authenticated",
  });
}
