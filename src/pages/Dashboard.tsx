import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, DollarSign, FileText } from "lucide-react";
import { getPatients, initDB, initDefaultTests, getTests, addPatient, getNextSerial, type Patient, type Test } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const initialize = async () => {
      await initDB();
      await initDefaultTests();
      const allPatients = await getPatients();
      const allTests = await getTests();
      setPatients(allPatients);
      setTests(allTests);
      setLoading(false);
    };
    initialize();
  }, []);

  const loadPatients = async () => {
    const allPatients = await getPatients();
    setPatients(allPatients);
  };

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const calculateTotal = () => {
    return selectedTests.reduce((sum, testId) => {
      const test = tests.find((t) => t.id === testId);
      return sum + (test?.price || 0);
    }, 0);
  };

  const total = calculateTotal();
  const finalAmount = total - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const serial = await getNextSerial();
    const patientId = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const selectedTestsData = selectedTests.map((testId) => {
      const test = tests.find((t) => t.id === testId);
      return {
        id: test!.id,
        name: test!.name,
        price: test!.price,
        category: test!.category,
      };
    });

    const newPatient: Patient = {
      id: patientId,
      serial,
      name,
      phone,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      tests: selectedTestsData,
      discount,
      total,
      finalAmount,
      date: new Date().toISOString(),
    };

    await addPatient(newPatient);
    
    toast({
      title: "Success",
      description: "Patient added successfully",
    });

    // Reset form
    setName("");
    setPhone("");
    setAge("");
    setGender("");
    setSelectedTests([]);
    setDiscount(0);
    
    loadPatients();
    navigate(`/receipt/${patientId}`);
  };

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
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Add Patient Form */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Add New Patient</h2>
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Patient name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Gender"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Select Tests *</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={test.id}
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={() => toggleTest(test.id)}
                      />
                      <label
                        htmlFor={test.id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">{test.name}</div>
                        <div className="text-primary">৳{test.price}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="discount">Discount (৳)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max={total}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between text-lg">
                  <span>Total:</span>
                  <span className="font-semibold">৳{total.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Discount:</span>
                      <span>-৳{discount.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xl font-bold text-primary">
                      <span>Final Amount:</span>
                      <span>৳{finalAmount.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <Button type="submit" className="w-full btn-primary" size="lg">
                Add Patient & Generate Receipt
              </Button>
            </form>
          </Card>
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
            <Card className="p-6">
              <div className="space-y-3">
                {todayPatients.slice(-5).reverse().map((patient) => (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded"
                    onClick={() => navigate(`/receipt/${patient.id}`)}
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
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
