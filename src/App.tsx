import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import StubPageWithLayout from "./pages/stubs/StubPageWithLayout";
import CalendarioFiscal from "./pages/CalendarioFiscal";
import TreasuryPageWithLayout from "./pages/TreasuryPageWithLayout";
import InvoicingPageWithLayout from "./pages/InvoicingPageWithLayout";
import ExpensesPageWithLayout from "./pages/ExpensesPageWithLayout";
import VatPageWithLayout from "./pages/VatPageWithLayout";
import IRPFPageWithLayout from "./pages/IRPFPageWithLayout";
import SociedadesPageWithLayout from "./pages/SociedadesPageWithLayout";
import MyAccountWithLayout from "./pages/MyAccountWithLayout";
import MonitoringPageWithLayout from "./pages/MonitoringPageWithLayout";
import { RateLimitIndicator } from '@/components/RateLimitIndicator';
import { SessionExpiredBanner } from '@/components/SessionExpiredBanner';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/Footer';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <SessionExpiredBanner />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/monitoring" element={<MonitoringPageWithLayout />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/treasury" element={<TreasuryPageWithLayout />} />
                <Route path="/invoicing" element={<InvoicingPageWithLayout />} />
                <Route path="/expenses" element={<ExpensesPageWithLayout />} />
                <Route path="/vat" element={<VatPageWithLayout />} />
                <Route path="/irpf" element={<IRPFPageWithLayout />} />
                <Route path="/is" element={<SociedadesPageWithLayout />} />
                <Route path="/calendar" element={<CalendarioFiscal />} />
                <Route path="/docs" element={<StubPageWithLayout title="Documentación" />} />
                <Route path="/advisory" element={<StubPageWithLayout title="Asesoría" />} />
                <Route path="/company" element={<StubPageWithLayout title="Mi empresa" />} />
                <Route path="/account" element={<MyAccountWithLayout />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <RateLimitIndicator />
            </div>
            <Footer />
            <CookieConsent />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
