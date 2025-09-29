import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Farmers from "./pages/Farmers";
import Inputs from "./pages/Inputs";
import Loans from "./pages/Loans";
import Crops from "./pages/Crops";
import CropForm from "./pages/CropForm";
import Livestock from "./pages/Livestock";
// LivestockForm is now imported within the Livestock component
// import LivestockForm from "./pages/LivestockForm";
// Import will be handled by the Livestock component
import Assistant from "./pages/Assistant";
import WeatherInsights from "./pages/WeatherInsights";
import Settings from "./pages/Settings";
import MarketPrices from "./pages/MarketPrices";
import CropVarieties from "./pages/CropVarieties";  
import ExtensionServices from "./pages/ExtensionServices";
import FinancialServices from "./pages/FinancialServices";
import Applications from "./pages/Applications";
import SetupOrganization from "./pages/SetupOrganization";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
              <Route path="/setup-organization" element={<SetupOrganization />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
