import { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { BookPage } from "@/pages/BookPage";
import { CreatePage } from "@/pages/CreatePage";
import { LibraryPage } from "@/pages/LibraryPage";
import { AuthorProfilePage } from "@/pages/AuthorProfilePage";
import { MyProfilePage } from "@/pages/MyProfilePage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { PageDetailPage } from "@/pages/PageDetailPage";
import { CirclesPage } from "@/pages/CirclesPage";
import { ZenReaderPage } from "@/pages/ZenReaderPage";
import { NewBookPage, BookEditPage } from "@/pages/BookForm";
import { SettingsPage } from "@/pages/SettingsPage";
import { LoginPage } from "@/pages/LoginPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { NotFound } from "@/pages/NotFound";
import { AdminPage } from "@/pages/AdminPage";
import { AuthProvider } from "@/components/auth/AuthProvider";
import {
  RequireAuth,
  RequireAdmin,
  RedirectIfAuthed,
} from "@/components/auth/RequireAuth";
import { ThemeProvider } from "@/lib/theme";
import { ApiError } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The API client already refreshes an expired token and replays the
      // request, so a 401 means the session is genuinely gone, not that this
      // query happened to run at the wrong moment.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status === 401) && failureCount < 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// Without this a render throw unmounts the tree and the browser shows a blank
// white page with no clue what happened.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8">
        <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl text-zinc-950">Something broke</h1>
          <p className="mt-2 font-body text-sm text-zinc-600">
            This page failed to render. Reloading usually clears it.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-100">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Routes>
                {/* Sign-in lives outside Layout too — a login screen wrapped in
                    the app shell reads as a page you are already inside. The
                    callback has to be reachable while signed out, since it is
                    the only place a brand-new session exists yet. */}
                <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                {/* Everything else needs an account. Folding the guard into the
                    Layout route means a new page cannot be added by accident
                    and shipped publicly — the default is closed, which is the
                    only safe default for a writer's own manuscripts. */}
                <Route
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route path="/" element={<HomePage />} />
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/book/:id" element={<BookPage />} />
                  <Route path="/page/:bookId/:pageId" element={<PageDetailPage />} />
                  <Route path="/page/:id" element={<PageDetailPage />} />
                  <Route path="/write" element={<CreatePage />} />
                  <Route path="/books/new" element={<NewBookPage />} />
                  <Route path="/books/:id/edit" element={<BookEditPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  {/* Your own profile, backed by the API. The public
                      /author/:username route below still reads mock data until
                      an authors endpoint exists, so the two are kept apart. */}
                  <Route path="/profile" element={<MyProfilePage />} />
                  <Route path="/author/:username" element={<AuthorProfilePage />} />
                  <Route path="/circles" element={<CirclesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Double-guarded on purpose: RequireAuth holds the shell,
                      RequireAdmin holds the role. The server would reject a
                      reader either way, but the client check keeps the nav
                      honest and gives a reader a redirect instead of a 403. */}
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminPage />
                      </RequireAdmin>
                    }
                  />
                  {/* Inside the group on purpose: an unknown path must not
                      become a way to see the signed-in shell. */}
                  <Route path="*" element={<NotFound />} />
                </Route>
                {/* Zen reading is deliberately outside Layout: no sidebar, no
                    header, no rails, just the page. It stays behind the guard —
                    a manuscript is not public just because it reads calmly. */}
                <Route
                  path="/book/:bookId/read/:pageId"
                  element={
                    <RequireAuth>
                      <ZenReaderPage />
                    </RequireAuth>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
