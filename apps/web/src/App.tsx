import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { BlockerPage } from "./pages/BlockerPage";
import { CoachPage } from "./pages/CoachPage";
import { HomePage } from "./pages/HomePage";
import { JournalPage } from "./pages/JournalPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SegmentPage } from "./pages/SegmentPage";
import { UrgesPage } from "./pages/UrgesPage";

function Splash() {
  return (
    <div className="splash">
      <span className="wordmark">Meglio</span>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// The single place that redirects after login/register, so no second navigate() can race it.
function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading, isNewUser } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to={isNewUser ? "/onboarding" : "/"} replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

/** Everything except the router, so the claude.ai demo can mount it in a MemoryRouter. */
export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<HomePage />} />
          <Route path="bereiche/:id" element={<SegmentPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="urges" element={<UrgesPage />} />
          <Route path="urges/:id/blocker" element={<BlockerPage />} />
          <Route path="coach" element={<CoachPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
