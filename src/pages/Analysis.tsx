import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, FileText } from "lucide-react";
import { getPatients, type Patient } from "@/lib/db";

export default function Analysis() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      const allPatients = await getPatients();
      setPatients(allPatients);
      setLoading(false);
    };
    loadPatients();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toDateString();
  const todayPatients = patients.filter(p => new Date(p.date).toDateString() === today);
  const todayRevenue = todayPatients.reduce((sum, p) => sum + p.finalAmount, 0);
  
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthPatients = patients.filter(p => new Date(p.date).getMonth() === thisMonth);
  const monthRevenue = monthPatients.reduce((sum, p) => sum + p.finalAmount, 0);
  
  const yearPatients = patients.filter(p => new Date(p.date).getFullYear() === thisYear);
  const yearRevenue = yearPatients.reduce((sum, p) => sum + p.finalAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8 text-center">
          <img 
            src="/logo.jpg" 
            alt="Amena Diagnostic Center Logo" 
            className="h-32 w-32 object-contain mx-auto mb-4 rounded-xl"
          />
          <h1 className="text-4xl font-bold mb-2">Amena Diagnostic Center</h1>
          <p className="text-xl text-muted-foreground">Business Analytics</p>
        </div>

        {/* Today's Stats */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Today's Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Patients Today"
              value={todayPatients.length}
              icon={Users}
              iconBgColor="bg-primary/10"
              iconColor="text-primary"
            />
            <StatCard
              title="Revenue Today"
              value={`৳${todayRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconBgColor="bg-accent/10"
              iconColor="text-accent"
            />
            <StatCard
              title="Total Patients"
              value={patients.length}
              icon={FileText}
              iconBgColor="bg-secondary/10"
              iconColor="text-secondary"
            />
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">This Month</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Monthly Patients"
              value={monthPatients.length}
              icon={Users}
              iconBgColor="bg-info/10"
              iconColor="text-info"
            />
            <StatCard
              title="Monthly Revenue"
              value={`৳${monthRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconBgColor="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              title="Avg. Per Patient"
              value={monthPatients.length > 0 ? `৳${Math.round(monthRevenue / monthPatients.length).toLocaleString()}` : '৳0'}
              icon={FileText}
              iconBgColor="bg-warning/10"
              iconColor="text-warning"
            />
          </div>
        </div>

        {/* Yearly Stats */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">This Year</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Yearly Patients"
              value={yearPatients.length}
              icon={Users}
              iconBgColor="bg-purple-500/10"
              iconColor="text-purple-500"
            />
            <StatCard
              title="Yearly Revenue"
              value={`৳${yearRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconBgColor="bg-blue-500/10"
              iconColor="text-blue-500"
            />
            <StatCard
              title="Avg. Per Patient"
              value={yearPatients.length > 0 ? `৳${Math.round(yearRevenue / yearPatients.length).toLocaleString()}` : '৳0'}
              icon={FileText}
              iconBgColor="bg-green-500/10"
              iconColor="text-green-500"
            />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Amena Diagnostic Center. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
