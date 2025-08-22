import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import EventDetail from "./pages/EventDetail";
import Registration from "./pages/Registration";
import EventRegistration from "./pages/EventRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEventForm from "./pages/AdminEventForm";
import AdminFees from "./pages/AdminFees";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/register" element={<EventRegistration />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events/:id" element={<AdminEventForm />} />
            <Route path="/admin/fees" element={<AdminFees />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
