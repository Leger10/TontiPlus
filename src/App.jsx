import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext.jsx";
import ScrollToTop from "@/components/ScrollToTop.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import RoleBasedRoute from "@/components/RoleBasedRoute.jsx";
import Header from "@/components/Header.jsx";

import LoginPage from "@/pages/LoginPage.jsx";
import SignupPage from "@/pages/SignupPage.jsx";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage.jsx";
import HomePage from "@/pages/HomePage.jsx";
import TontinesBrowsePage from "@/pages/TontinesBrowsePage.jsx";
import TontineCreationPage from "@/pages/TontineCreationPage.jsx";
import TontineDetailPage from "@/pages/TontineDetailPage.jsx";
import TontineAdhesionPage from "@/pages/TontineAdhesionPage.jsx";
import CotisationTrackingPage from "@/pages/CotisationTrackingPage.jsx";
import AdhesionManagementPage from "@/pages/AdhesionManagementPage.jsx";
import NotificationsPage from "@/pages/NotificationsPage.jsx";
import ProfilePage from "@/pages/ProfilePage.jsx";

import TontinierDashboardPage from "@/pages/TontinierDashboardPage.jsx";
import TontinePaymentsPage from "@/pages/TontinePaymentsPage.jsx";

import MyContributionsPage from "@/pages/MyContributionsPage.jsx";
import ContributionPaymentPage from "@/pages/ContributionPaymentPage.jsx";

import WalletPage from "@/pages/WalletPage.jsx";
import DepositFormPage from "@/pages/DepositFormPage.jsx";
import DepositHistoryPage from "@/pages/DepositHistoryPage.jsx";
import AdminDepositValidationPage from "@/pages/AdminDepositValidationPage.jsx";

import AdminDashboardPage from "@/pages/AdminDashboardPage.jsx";
import TontinesManagementPage from "@/pages/TontinesManagementPage.jsx";
import MembersManagementPage from "@/pages/MembersManagementPage.jsx";
import ReportsPage from "@/pages/ReportsPage.jsx";
import ModerationAlertsPage from "@/pages/ModerationAlertsPage.jsx";
import AuditLogPage from "@/pages/AuditLogPage.jsx";
import AdminSubscriptionManagementPage from "@/pages/AdminSubscriptionManagementPage.jsx";

import SuperAdminDashboard from "@/pages/SuperAdminDashboard.jsx";
import SecretaireNationalDashboard from "@/pages/SecretaireNationalDashboard.jsx";
import DGPaysDashboard from "@/pages/DGPaysDashboard.jsx";
import SecretairePaysDashboard from "@/pages/SecretairePaysDashboard.jsx";
import SubscriptionPending from "@/pages/SubscriptionPending.jsx";

import SubscriptionManagementPage from "@/pages/SubscriptionManagementPage.jsx";
import SubscriptionPaymentCallback from "@/pages/SubscriptionPaymentCallback.jsx";

import { Toaster } from "@/components/ui/sonner.jsx";

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Conteneur principal avec les classes CSS */}
        <div className="min-h-screen bg-background text-foreground animate-fade-in">
          <ScrollToTop />
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Routes publiques */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Routes d'abonnement */}
              <Route path="/subscription-callback" element={<SubscriptionPaymentCallback />} />
              <Route path="/subscription-pending" element={<SubscriptionPending />} />
              
              {/* Routes protégées */}
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/tontines" element={<ProtectedRoute><TontinesBrowsePage /></ProtectedRoute>} />
              <Route path="/create-tontine" element={<ProtectedRoute><TontineCreationPage /></ProtectedRoute>} />
              <Route path="/tontine/:id" element={<ProtectedRoute><TontineDetailPage /></ProtectedRoute>} />
              <Route path="/tontine/:id/adhesion" element={<ProtectedRoute><TontineAdhesionPage /></ProtectedRoute>} />
              <Route path="/tontine/:id/cotisations" element={<ProtectedRoute><CotisationTrackingPage /></ProtectedRoute>} />
              <Route path="/tontine/:id/adhesions" element={<ProtectedRoute><AdhesionManagementPage /></ProtectedRoute>} />
              <Route path="/tontine/:id/paiements" element={<ProtectedRoute><TontinePaymentsPage /></ProtectedRoute>} />
              <Route path="/my-contributions" element={<ProtectedRoute><MyContributionsPage /></ProtectedRoute>} />
              <Route path="/contribution-payment/:id" element={<ProtectedRoute><ContributionPaymentPage /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
              <Route path="/wallet/deposit" element={<ProtectedRoute><DepositFormPage /></ProtectedRoute>} />
              <Route path="/wallet/history" element={<ProtectedRoute><DepositHistoryPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/subscription-management" element={<ProtectedRoute><SubscriptionManagementPage /></ProtectedRoute>} />
              
              {/* Routes Tontinier */}
              <Route path="/tontinier/dashboard/:id" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national", "dg_pays", "secretaire_pays", "tontinier"]}>
                  <TontinierDashboardPage />
                </RoleBasedRoute>
              } />
              <Route path="/organizer-dashboard/:id" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national", "dg_pays", "secretaire_pays", "tontinier"]}>
                  <TontinierDashboardPage />
                </RoleBasedRoute>
              } />
              
              {/* Routes Admin */}
              <Route path="/admin/dashboard" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <AdminDashboardPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/tontines" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <TontinesManagementPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/tontines/:id" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <TontineDetailPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/members" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <MembersManagementPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/reports" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <ReportsPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/moderation" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <ModerationAlertsPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/audit" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <AuditLogPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/deposits" element={
                <RoleBasedRoute requiredRole="super_admin">
                  <AdminDepositValidationPage />
                </RoleBasedRoute>
              } />
              <Route path="/admin/subscriptions-management" element={
                <RoleBasedRoute requiredRole="super_admin">
                  <AdminSubscriptionManagementPage />
                </RoleBasedRoute>
              } />
              <Route path="/deposit-history" element={
                <RoleBasedRoute requiredRole="super_admin">
                  <DepositHistoryPage />
                </RoleBasedRoute>
              } />
              
              {/* Routes Super Admin */}
              <Route path="/super-admin-dashboard" element={
                <RoleBasedRoute requiredRole="super_admin">
                  <SuperAdminDashboard />
                </RoleBasedRoute>
              } />
              <Route path="/secretaire-national-dashboard" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national"]}>
                  <SecretaireNationalDashboard />
                </RoleBasedRoute>
              } />
              <Route path="/dg-pays-dashboard" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national", "dg_pays"]}>
                  <DGPaysDashboard />
                </RoleBasedRoute>
              } />
              <Route path="/secretaire-pays-dashboard" element={
                <RoleBasedRoute requiredRole={["super_admin", "secretaire_national", "dg_pays", "pays_secretaire"]}>
                  <SecretairePaysDashboard />
                </RoleBasedRoute>
              } />
              
              {/* Route 404 */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                  <p className="text-xl text-muted-foreground mb-8">Page introuvable</p>
                  <a href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-md">
                    Retour à l'accueil
                  </a>
                </div>
              } />
            </Routes>
          </main>
          <Toaster position="top-center" toastOptions={{ className: "font-sans" }} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;