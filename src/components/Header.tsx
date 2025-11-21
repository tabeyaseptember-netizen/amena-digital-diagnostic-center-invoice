import { Activity } from "lucide-react";

export const Header = () => {
  return (
    <header className="medical-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Amena Diagnostic Center</h1>
              <p className="text-sm text-white/90">Premium Healthcare Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
