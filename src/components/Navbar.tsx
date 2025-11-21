import { Home, Settings, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export const Navbar = () => {
  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              activeClassName="text-primary bg-primary/10 font-medium"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            
            <NavLink
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              activeClassName="text-primary bg-primary/10 font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </NavLink>
            
            <NavLink
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              activeClassName="text-primary bg-primary/10 font-medium"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};
