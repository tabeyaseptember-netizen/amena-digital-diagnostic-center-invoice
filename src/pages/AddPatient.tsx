import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { getTests, addPatient, getNextSerial, type Test, type Patient } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function AddPatient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
  });
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadTests = async () => {
      const allTests = await getTests();
      setTests(allTests);
    };
    loadTests();
  }, []);

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTest = (test: Test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      }
      return [...prev, test];
    });
  };

  const total = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const finalAmount = total - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in name and phone number",
        variant: "destructive",
      });
      return;
    }

    if (selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive",
      });
      return;
    }

    const serial = await getNextSerial();
    const patient: Patient = {
      id: crypto.randomUUID(),
      serial,
      name: formData.name,
      phone: formData.phone,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
      address: formData.address.trim() || undefined,
      tests: selectedTests,
      discount,
      total,
      finalAmount,
      date: new Date().toISOString(),
    };

    await addPatient(patient);
    
    toast({
      title: "Success",
      description: "Patient added successfully",
    });

    navigate(`/receipt/${patient.id}`);
  };

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

        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">Add New Patient</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div className="stat-card animate-fade-in">
              <h2 className="mb-4 text-xl font-semibold">Patient Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter patient name"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Enter age"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              {/* Optional Address Field */}
              <div className="mt-4 rounded-lg bg-muted/30 p-4">
                <Label htmlFor="address">
                  Address <span className="text-xs text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Test Selection */}
            <div className="stat-card animate-fade-in">
              <h2 className="mb-4 text-xl font-semibold">Select Tests</h2>
              <Input
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-border p-4">
                {filteredTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTests.some(t => t.id === test.id)}
                        onCheckedChange={() => toggleTest(test)}
                      />
                      <div>
                        <p className="font-medium">{test.name}</p>
                        {test.category && (
                          <p className="text-xs text-muted-foreground">{test.category}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-semibold text-primary">৳{test.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="stat-card animate-fade-in">
              <h2 className="mb-4 text-xl font-semibold">Price Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Selected Tests:</span>
                  <span className="font-semibold">{selectedTests.length}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span className="font-semibold">৳{total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="discount">Discount:</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-32"
                    min="0"
                  />
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-xl font-bold">
                  <span>Final Amount:</span>
                  <span className="text-primary">৳{finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="btn-primary w-full" size="lg">
              <Save className="mr-2 h-5 w-5" />
              Save & Generate Receipt
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
