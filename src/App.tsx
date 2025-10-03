import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Farmers from "./pages/Farmers";
import Inputs from "./pages/Inputs";
import Loans from "./pages/Loans";
import Crops from "./pages/Crops";
import CropForm from "./pages/CropForm";
import Livestock from "./pages/Livestock";
import Assistant from "./pages/Assistant";
import WeatherInsights from "./pages/WeatherInsights";
import Settings from "./pages/Settings";
import MarketPrices from "./pages/MarketPrices";
import CropVarieties from "./pages/CropVarieties";  
import ExtensionServices from "./pages/ExtensionServices";
import FinancialServices from "./pages/FinancialServices";
import Applications from "./pages/Applications";
import SetupOrganization from "./pages/SetupOrganization";
import KnowledgeCenter from "./pages/KnowledgeCenter";

// A wrapper component that applies the AppLayout to all protected routes
import { Outlet } from 'react-router-dom';

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedLayout />}>
              <Route index element={<Index />} />
              <Route path="/" element={<Index />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/inputs" element={<Inputs />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/crops" element={<Crops />} />
              <Route path="/crops/new" element={<CropForm />} />
              <Route path="/crops/:id/edit" element={<CropForm />} />
              <Route path="/livestock" element={<Livestock />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/weather-insights" element={<WeatherInsights />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/market-prices" element={<MarketPrices />} />
              <Route path="/crop-varieties" element={<CropVarieties />} />
              <Route path="/extension-services" element={<ExtensionServices />} />
              <Route path="/financial-services" element={<FinancialServices />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/setup-organization" element={
                <ProtectedRoute requireOrganization={false}>
                  <SetupOrganization />
                </ProtectedRoute>
              } />
              <Route path="/knowledge" element={<KnowledgeCenter />} />
              <Route path="/knowledge/*" element={<KnowledgeCenter />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
