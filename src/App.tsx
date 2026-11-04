import type { RouteRecord } from "vite-react-ssg";
import { Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CalculatorProvider } from "@/context/CalculatorContext";
import Index from "./pages/Index.tsx";
import CalculatorPage from "./pages/Calculator.tsx";
import ResultsPage from "./pages/Results.tsx";
import HistoryPage from "./pages/History.tsx";
import ImpressumPage from "./pages/Impressum.tsx";
import DatenschutzPage from "./pages/Datenschutz.tsx";
import PartnerLanding from "./pages/PartnerLanding.tsx";
import RatgeberPage from "./pages/Ratgeber.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function Layout() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CalculatorProvider>
          <Outlet />
        </CalculatorProvider>
      </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <Layout />,
    entry: "src/App.tsx",
    children: [
      { index: true, element: <Index />, entry: "src/pages/Index.tsx" },
      { path: "rechner", element: <CalculatorPage />, entry: "src/pages/Calculator.tsx" },
      { path: "impressum", element: <ImpressumPage />, entry: "src/pages/Impressum.tsx" },
      { path: "datenschutz", element: <DatenschutzPage />, entry: "src/pages/Datenschutz.tsx" },
      { path: "ratgeber", element: <RatgeberPage />, entry: "src/pages/Ratgeber.tsx" },
      { path: "ergebnis", element: <ResultsPage /> },
      { path: "verlauf", element: <HistoryPage /> },
      { path: ":slug", element: <PartnerLanding /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
