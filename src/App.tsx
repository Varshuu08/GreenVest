import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SimulationProvider } from "@/context/SimulationContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import LandingPage from "@/pages/Landing";
import { ForgotPasswordPage, SignInPage, SignUpPage } from "@/pages/Auth";
import AuthCallbackPage from "@/pages/AuthCallback";
import ResetPasswordPage from "@/pages/ResetPassword";
import DashboardPage from "@/pages/Dashboard";
import AnalyzePage from "@/pages/Analyze";
import StrategiesPage from "@/pages/Strategies";
import StressTestPage from "@/pages/StressTest";
import SimulatorPage from "@/pages/Simulator";
import ZoningPage from "@/pages/Zoning";
import RecommendationPage from "@/pages/Recommendation";
import AIAdvisorPage from "@/pages/AIAdvisor";
import ReportPage from "@/pages/Report";
import SettingsPage from "@/pages/Settings";
import PlansPage from "@/pages/Plans";
import AnalysesPage from "@/pages/Analyses";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <SimulationProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/analyze" element={<AnalyzePage />} />
                  <Route path="/strategies" element={<StrategiesPage />} />
                  <Route path="/stress-test" element={<StressTestPage />} />
                  <Route path="/simulator" element={<SimulatorPage />} />
                  <Route path="/zoning" element={<ZoningPage />} />
                  <Route path="/recommendation" element={<RecommendationPage />} />
                  <Route path="/ai-advisor" element={<AIAdvisorPage />} />
                  <Route path="/analyses" element={<AnalysesPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/plans" element={<PlansPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SimulationProvider>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
