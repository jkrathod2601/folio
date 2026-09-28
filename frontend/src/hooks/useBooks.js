import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";

export const bookKeys = {
  all: ["books"],
  list: (filters) => ["books", "list", filters],
  detail: (id) => ["books", "detail", id],
  cover: (id) => ["books", "cover", id],
};

const LIST_FILTERS = ["status"];

function listKey(filters = {}) {
  // Stable key: `{limit: 5}` and `{limit: 5}` must not be two different caches.
  const clean = {};
  for (const k of LIST_FILTERS) if (filters[k] != null) clean[k] = filters[k];
  return Object.keys(clean).length ? clean : "all";
}

/**
 * The signed-in author's own shelf.
 *
 * Scoped to `/books` (mine) rather than a public feed, because the public
 * catalog is still mock data in `data/books.js` and mixing the two would show
 * Jay's real drafts next to seeded books with the same ids.
 */
export function useMyBooks(filters = {}) {
  return useQuery({
    queryKey: bookKeys.list(listKey(filters)),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (filters.status) qs.set("status", filters.status);
      const suffix = qs.toString();
      return api.get(`/books${suffix ? `?${suffix}` : ""}`).then((r) => r.books);
    },
  });
}

export function useBook(id) {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => api.get(`/books/${id}`).then((r) => r.book),
    enabled: Boolean(id),
  });
}

/**
 * The public catalog — every published, public book, newest first.
 *
 * A separate query key from the author's shelf because it is a different
 * population (everyone's published books, not mine) that happens to change
 * when anyone publishes.
 */
export function usePublicBooks() {
  return useQuery({
    queryKey: ["books", "discover"],
    queryFn: () => api.get("/books/discover").then((r) => r.books),
  });
}

/**
 * Create a book.
 *
 * No optimistic update: the server assigns the id and stamps `createdAt`, and a
 * temporary row in the shelf would flicker the new book to the top, then
 * reorder underneath the reader. Cheap to avoid for a form that navigates away
 * on success.
 */
export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (book) => api.post("/books", book),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

/** Patch a book. `design` is merged server-side, so a partial design is safe. */
export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...patch }) => api.patch(`/books/${id}`, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(bookKeys.detail(data.book.id), data.book);
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

/**
 * Upload a cover image.
 *
 * The file is the request body, not base64 in a JSON payload — that keeps the
 * server's 1 MB `maxBytes` an honest wire limit instead of a 1.4 MB one. The
 * `content-type` header carries the format; the server allowlists it.
 */
export function useUploadCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }) => {
      const res = await apiFetch(`/books/${id}/cover`, {
        method: "PUT",
        body: file,
        raw: true,
        headers: { "content-type": file.type },
      });
      return res.book;
    },
    onSuccess: (_data, { id }) => {
      // The bytes and the metadata are separate cache entries: the image cache
      // because the picture changed, the book because `cover` now exists.
      queryClient.invalidateQueries({ queryKey: bookKeys.cover(id) });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useDeleteCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/books/${id}/cover`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.cover(id) });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

/**
 * Fetch a cover as a blob and expose it as an object URL.
 *
 * Not `<img src="/api/books/:id/cover">`: that endpoint requires a bearer token
 * and the browser would send none, so the image would 401. `useQuery` holds the
 * auth header; this turns the response into something an <img> can paint.
 *
 * The cache holds the **Blob**, and the object URL is derived per-mount in the
 * effect. Caching the URL string instead would be a trap: the effect revokes it
 * on unmount, so a remount would read a revoked URL straight out of the cache
 * and render a broken image with no refetch to fix it (staleTime: Infinity).
 *
 * Revoking here rather than nowhere matters too — an object URL pins its blob
 * for the life of the document, which is a real leak once a profile page shows
 * twenty covers.
 */
export function useCoverImage(bookId, hasCover) {
  const [objectUrl, setObjectUrl] = useState(null);

  const query = useQuery({
    queryKey: bookKeys.cover(bookId),
    enabled: Boolean(bookId) && Boolean(hasCover),
    queryFn: () => apiFetch(`/books/${bookId}/cover`, { blob: true }),
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

  return { url: objectUrl, isLoading: query.isLoading, error: query.error };
}
