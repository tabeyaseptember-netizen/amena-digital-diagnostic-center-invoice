import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Lottie from "lottie-react";
import passwordAnimation from "@/assets/Password_Authentication.json";

const ADMIN_PASSWORD = "ab437620";
const AUTH_SESSION_KEY = "admin_authenticated";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function ProtectedAdminRoute({ 
  children, 
  title = "Admin Panel Access",
  description = "Enter password to access the admin panel",
  buttonText = "Access Admin Panel"
}: ProtectedAdminRouteProps) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check sessionStorage on initial load
    return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
  });
  const { toast } = useToast();

  useEffect(() => {
    // Sync authentication state with sessionStorage
    if (isAuthenticated) {
      sessionStorage.setItem(AUTH_SESSION_KEY, "true");
    }
  }, [isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Success",
        description: "Access granted to Admin Panel",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 w-48">
              <Lottie animationData={passwordAnimation} loop={true} />
            </div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
              />
            </div>
            
            <Button type="submit" className="w-full">
              {buttonText}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
