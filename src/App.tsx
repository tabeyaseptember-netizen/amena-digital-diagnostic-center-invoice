import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Receipt from "./pages/Receipt";
import EditPatient from "./pages/EditPatient";
import Tests from "./pages/Tests";
import Settings from "./pages/Settings";
import Analysis from "./pages/Analysis";
import NotFound from "./pages/NotFound";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider forcedTheme="light">
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            } />
            <Route path="/receipt/:id" element={<Receipt />} />
            <Route path="/edit-patient/:id" element={
              <ProtectedAdminRoute>
                <EditPatient />
              </ProtectedAdminRoute>
            } />
            <Route path="/tests" element={<Tests />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analysis" element={<Analysis />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
