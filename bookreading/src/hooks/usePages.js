import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Pages — the writing surface's server state.
 *
 * One hook set for the collection and the mutations because they share a cache
 * shape: every write invalidates the book's page list (the TOC) and the book
 * itself (`pageCount` moves with it), so the two cannot be updated separately
 * without the TOC and the counter drifting apart.
 */

export const pageKeys = {
  list: (bookId) => ["books", bookId, "pages"],
  detail: (bookId, pageId) => ["books", bookId, "pages", pageId],
};

/** A book's pages, in ordinal order. */
export function usePages(bookId) {
  return useQuery({
    queryKey: pageKeys.list(bookId),
    enabled: Boolean(bookId),
    queryFn: () => api.get(`/books/${bookId}/pages`).then((r) => r.pages),
  });
}

/** One page. */
export function usePage(bookId, pageId) {
  return useQuery({
    queryKey: pageKeys.detail(bookId, pageId),
    enabled: Boolean(bookId && pageId),
    queryFn: () => api.get(`/books/${bookId}/pages/${pageId}`).then((r) => r.page),
  });
}

/** Invalidate everything the page list and its counters live in. */
function invalidatePages(queryClient, bookId) {
  queryClient.invalidateQueries({ queryKey: pageKeys.list(bookId) });
  queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] });
  queryClient.invalidateQueries({ queryKey: ["books"] });
}

/** Append a page to the end of the book. */
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, ...payload }) => api.post(`/books/${bookId}/pages`, payload),
    onSuccess: (_data, { bookId }) => invalidatePages(queryClient, bookId),
  });
}

/** Edit a page, or publish/unpublish it. */
export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, pageId, ...patch }) =>
      api.patch(`/books/${bookId}/pages/${pageId}`, patch),
    onSuccess: (_data, { bookId }) => invalidatePages(queryClient, bookId),
  });
}

/** Delete a page. */
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, pageId }) => api.delete(`/books/${bookId}/pages/${pageId}`),
    onSuccess: (_data, { bookId }) => invalidatePages(queryClient, bookId),
  });
}
