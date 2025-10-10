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
import PayrollPageWithLayout from "./pages/PayrollPageWithLayout";
import Modelo111PageWithLayout from "./pages/Modelo111PageWithLayout";
import MyAccountWithLayout from "./pages/MyAccountWithLayout";
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
                <Route path="/" element={<Navigate to="/young-minds/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/:tenant/dashboard" element={<Dashboard />} />
                <Route path="/:tenant/treasury" element={<TreasuryPageWithLayout />} />
                <Route path="/:tenant/invoicing" element={<InvoicingPageWithLayout />} />
                <Route path="/:tenant/expenses" element={<ExpensesPageWithLayout />} />
                <Route path="/:tenant/vat" element={<VatPageWithLayout />} />
                <Route path="/:tenant/irpf" element={<IRPFPageWithLayout />} />
                <Route path="/:tenant/is" element={<SociedadesPageWithLayout />} />
                <Route path="/:tenant/payroll" element={<PayrollPageWithLayout />} />
                <Route path="/:tenant/modelo-111" element={<Modelo111PageWithLayout />} />
                <Route path="/:tenant/calendar" element={<CalendarioFiscal />} />
                <Route path="/:tenant/calendario-fiscal" element={<CalendarioFiscal />} />
                <Route path="/:tenant/docs" element={<StubPageWithLayout title="Documentación" />} />
                <Route path="/:tenant/advisory" element={<StubPageWithLayout title="Asesoría" />} />
                <Route path="/:tenant/company" element={<StubPageWithLayout title="Mi empresa" />} />
                <Route path="/:tenant/account" element={<MyAccountWithLayout />} />
                <Route path="/:tenant/:section" element={<Dashboard />} />
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
