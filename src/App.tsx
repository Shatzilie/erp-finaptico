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
import TreasuryPageWithLayout from "./pages/TreasuryPageWithLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/young-minds/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/:tenant/dashboard" element={<Dashboard />} />
            <Route path="/:tenant/treasury" element={<TreasuryPageWithLayout />} />
            <Route path="/:tenant/invoicing" element={<StubPageWithLayout title="Facturación" />} />
            <Route path="/:tenant/expenses" element={<StubPageWithLayout title="Gastos" />} />
            <Route path="/:tenant/vat" element={<StubPageWithLayout title="IVA" />} />
            <Route path="/:tenant/irpf" element={<StubPageWithLayout title="IRPF" />} />
            <Route path="/:tenant/is" element={<StubPageWithLayout title="Impuesto de Sociedades" />} />
            <Route path="/:tenant/calendar" element={<StubPageWithLayout title="Calendario fiscal" />} />
            <Route path="/:tenant/docs" element={<StubPageWithLayout title="Documentación" />} />
            <Route path="/:tenant/advisory" element={<StubPageWithLayout title="Asesoría" />} />
            <Route path="/:tenant/company" element={<StubPageWithLayout title="Mi empresa" />} />
            <Route path="/:tenant/:section" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
