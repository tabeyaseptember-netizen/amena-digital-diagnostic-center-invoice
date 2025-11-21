import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="mb-6 text-3xl font-bold">Settings</h1>

        <div className="mx-auto max-w-2xl space-y-6">
          <div className="stat-card">
            <h2 className="mb-4 text-xl font-semibold">About</h2>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Amena Diagnostic Center</p>
                  <p className="text-sm">Version 1.0.0</p>
                </div>
              </div>
              <p className="text-sm">
                Premium healthcare receipt management system with offline-first capabilities.
              </p>
            </div>
          </div>

          <div className="stat-card">
            <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Phone:</span> +880-XXX-XXXXXX</p>
              <p><span className="font-semibold">Email:</span> info@amenadiagnostic.com</p>
              <p><span className="font-semibold">Address:</span> To be configured</p>
            </div>
          </div>

          <div className="stat-card">
            <h2 className="mb-4 text-xl font-semibold">Data Storage</h2>
            <p className="text-sm text-muted-foreground">
              All data is stored locally in your browser using IndexedDB. This ensures your data remains private and accessible offline.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
