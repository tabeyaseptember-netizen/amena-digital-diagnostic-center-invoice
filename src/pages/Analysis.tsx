import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, DollarSign, FileText, TrendingUp } from "lucide-react";
import { getPatients, type Patient } from "@/lib/db";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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

  // Daily revenue data for the last 30 days
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toDateString();
    const dayPatients = patients.filter(p => new Date(p.date).toDateString() === dateStr);
    const revenue = dayPatients.reduce((sum, p) => sum + p.finalAmount, 0);
    return {
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      revenue,
      patients: dayPatients.length
    };
  });

  // Weekly revenue data for the last 12 weeks
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weekPatients = patients.filter(p => {
      const pDate = new Date(p.date);
      return pDate >= weekStart && pDate <= weekEnd;
    });
    const revenue = weekPatients.reduce((sum, p) => sum + p.finalAmount, 0);
    
    return {
      week: `Week ${12 - i}`,
      revenue,
      patients: weekPatients.length
    };
  }).reverse();

  // Monthly revenue data for the last 12 months
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    const monthPatients = patients.filter(p => {
      const pDate = new Date(p.date);
      return pDate.getMonth() === month.getMonth() && pDate.getFullYear() === month.getFullYear();
    });
    const revenue = monthPatients.reduce((sum, p) => sum + p.finalAmount, 0);
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      revenue,
      patients: monthPatients.length
    };
  });

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
        <div className="mb-8">
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

        {/* Revenue Trends */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Revenue Trends</h2>
            </div>

            {/* Daily Revenue Chart */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Daily Revenue (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Daily Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Weekly Revenue Chart */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Revenue (Last 12 Weeks)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" name="Weekly Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Monthly Revenue Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Revenue (Last 12 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" name="Monthly Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Amena Diagnostic Center. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
