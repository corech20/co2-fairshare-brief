import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CalculatorProvider } from "@/context/CalculatorContext";
import Index from "./pages/Index.tsx";
import CalculatorPage from "./pages/Calculator.tsx";
import ResultsPage from "./pages/Results.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CalculatorProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rechner" element={<CalculatorPage />} />
            <Route path="/ergebnis" element={<ResultsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CalculatorProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
