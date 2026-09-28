import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";

/**
 * Story bible — characters, places, sections.
 *
 * One hook set for three collections, because they share a route shape, a
 * reconcile contract and a portrait pipeline, and three parallel copies of that
 * is three places for the invalidation keys to drift apart.
 *
 * The collections differ only in their URL segment, so `kind` is the only thing
 * that varies here. The server's contract, which this file depends on:
 *
 *   PUT /api/books/:id/<kind>   body { items: [...] }  — full reconcile, matched
 *                                by each item's client-generated `key`. An
 *                                omitted keyful item is deleted; a keyless record
 *                                the form never knew about is left alone.
 *
 * The form therefore generates a `key` for every entry the moment it is created
 * and keeps it for the life of the entry, which is what makes a reorder or a
 * partial edit an update rather than a delete-and-recreate.
 */

/** URL segment -> singular noun. */
export const KINDS = {
  characters: { singular: "character", plural: "characters" },
  places: { singular: "place", plural: "places" },
  sections: { singular: "section", plural: "sections" },
};

export const entityKeys = {
  list: (bookId, kind) => ["books", bookId, kind],
  portrait: (bookId, kind, entityId) => ["books", bookId, kind, entityId, "portrait"],
};

/**
 * A stable client-side identity for a new entry.
 *
 * `crypto.randomUUID` is not universal — it is absent on insecure origins, which
 * includes a plain-http LAN address someone might be developing against — so
 * this falls back rather than throwing inside a click handler.
 */
export function newEntityKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Everything the form holds about one entry, minus whatever is server-only.
 *
 * A whitelist, not a denylist: a loaded entry is a whole API document, carrying
 * `book`, `id`, `createdAt` and `updatedAt` alongside its own fields. The server
 * takes the first three from the URL and the row position — never from the
 * body — so they are not merely noise: Joi rejects them as unknown keys, and the
 * save dies with no visible reason. A whitelist cannot be surprised by the next
 * server-owned field the API starts returning.
 *
 * A `portraitFile` is dropped for the same reason it always was: a File cannot
 * be JSON-serialised, and the portrait is uploaded separately once the entry
 * has a server id.
 */
export function toEntityPayload(item) {
  const { key, name, aliases, role, description, age, firstAppearance, title, kind, summary, tags, order } = item;
  const out = { key };
  for (const [k, v] of Object.entries({
    name, aliases, role, description, age, firstAppearance, title, kind, summary, tags,
  })) {
    if (v !== undefined) out[k] = v;
  }
  if (order !== undefined) out.order = order;
  return out;
}

/** The fields a form row is allowed to carry to the server. */
export function stripLocalFields(items) {
  return items.map((item) => toEntityPayload(item));
}

/**
 * Load one collection for a book.
 *
 * Disabled unless a book id is present, because on the create form there is
 * nothing to load and the entries live in component state until save.
 */
export function useStoryEntities(bookId, kind) {
  return useQuery({
    queryKey: entityKeys.list(bookId, kind),
    enabled: Boolean(bookId),
    queryFn: () => api.get(`/books/${bookId}/${kind}`).then((r) => r[kind] ?? []),
  });
}

/**
 * Reconcile a whole collection.
 *
 * Used by the book form rather than per-entry mutations, because the form owns
 * the array — including its order — and a per-entry PATCH per keystroke would
 * mean N requests for one save and no way to express a reorder.
 */
export function useSyncStoryEntities(bookId, kind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items) => api.put(`/books/${bookId}/${kind}`, { items }),
    onSuccess: (data) => {
      const list = data[kind] ?? [];
      queryClient.setQueryData(entityKeys.list(bookId, kind), list);
    },
  });
}

export function useDeleteStoryEntity(bookId, kind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId) => api.delete(`/books/${bookId}/${kind}/${entityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.list(bookId, kind) });
    },
  });
}

/** Upload or replace an entity portrait. Raw bytes, like a cover. */
export function useUploadPortrait(bookId, kind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, file }) => {
      const res = await apiFetch(`/books/${bookId}/${kind}/${entityId}/portrait`, {
        method: "PUT",
        body: file,
        raw: true,
        headers: { "content-type": file.type },
      });
      return res;
    },
    onSuccess: (_data, { entityId }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.portrait(bookId, kind, entityId) });
      queryClient.invalidateQueries({ queryKey: entityKeys.list(bookId, kind) });
    },
  });
}

export function useDeletePortrait(bookId, kind) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId) => api.delete(`/books/${bookId}/${kind}/${entityId}/portrait`),
    onSuccess: (_data, entityId) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.portrait(bookId, kind, entityId) });
      queryClient.invalidateQueries({ queryKey: entityKeys.list(bookId, kind) });
    },
  });
}

/**
 * Fetch an entity portrait as a blob and expose it as an object URL.
 *
 * Same reasoning as `useCoverImage`: the endpoint needs a bearer token, so an
 * `<img src>` would 401. The cache holds the **Blob** and the URL is derived per
 * mount — caching the URL string would hand back a revoked URL on remount and
 * render a broken image with no refetch to fix it.
 */
export function useEntityPortrait(bookId, kind, entityId, hasPortrait) {
  const [objectUrl, setObjectUrl] = useState(null);

  const query = useQuery({
    queryKey: entityKeys.portrait(bookId, kind, entityId),
    enabled: Boolean(bookId && entityId && hasPortrait),
    queryFn: () => apiFetch(`/books/${bookId}/${kind}/${entityId}/portrait`, { blob: true }),
  });

  useEffect(() => {
    if (!query.data) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(query.data);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [query.data]);

  return { url: objectUrl, isLoading: query.isLoading };
}
