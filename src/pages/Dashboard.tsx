import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, FileText, TestTube, Plus, History, Settings } from "lucide-react";
import { getPatients, initDB, initDefaultTests, type Patient } from "@/lib/db";

export default function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await initDB();
      await initDefaultTests();
      const allPatients = await getPatients();
      setPatients(allPatients);
      setLoading(false);
    };
    initialize();
  }, []);

  const today = new Date().toDateString();
  const todayPatients = patients.filter(p => new Date(p.date).toDateString() === today);
  const todayRevenue = todayPatients.reduce((sum, p) => sum + p.finalAmount, 0);
  
  const thisMonth = new Date().getMonth();
  const monthPatients = patients.filter(p => new Date(p.date).getMonth() === thisMonth);
  const monthRevenue = monthPatients.reduce((sum, p) => sum + p.finalAmount, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button 
            onClick={() => navigate("/add-patient")}
            className="btn-primary h-auto flex-col gap-2 py-6"
            size="lg"
          >
            <Plus className="h-6 w-6" />
            <span className="text-lg font-semibold">Add Patient</span>
          </Button>
          <Button 
            onClick={() => navigate("/history")}
            variant="outline"
            className="h-auto flex-col gap-2 py-6 hover:bg-muted"
            size="lg"
          >
            <History className="h-6 w-6" />
            <span className="text-lg font-semibold">History</span>
          </Button>
          <Button 
            onClick={() => navigate("/tests")}
            variant="outline"
            className="h-auto flex-col gap-2 py-6 hover:bg-muted"
            size="lg"
          >
            <TestTube className="h-6 w-6" />
            <span className="text-lg font-semibold">Manage Tests</span>
          </Button>
          <Button 
            onClick={() => navigate("/settings")}
            variant="outline"
            className="h-auto flex-col gap-2 py-6 hover:bg-muted"
            size="lg"
          >
            <Settings className="h-6 w-6" />
            <span className="text-lg font-semibold">Settings</span>
          </Button>
        </div>

        {/* Today's Stats */}
        <div className="mb-6">
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
        <div>
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

        {/* Recent Patients */}
        {todayPatients.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold">Recent Patients</h2>
            <div className="stat-card">
              <div className="space-y-3">
                {todayPatients.slice(-5).reverse().map((patient) => (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">৳{patient.finalAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{patient.tests.length} test(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
