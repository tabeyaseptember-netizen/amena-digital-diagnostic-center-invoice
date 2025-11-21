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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, FileText, Search, Check } from "lucide-react";
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
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [searchTerm, setSearchTerm] = useState("");

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
  const discountAmount = discountType === "percent" ? (total * discount) / 100 : discount;
  const finalAmount = total - discountAmount;

  const filteredTests = tests.filter((test) =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      discount: discountAmount,
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
    setDiscountType("flat");
    setSearchTerm("");
    
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('phone')?.focus();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && phone.length === 11) {
                        e.preventDefault();
                        document.getElementById('age')?.focus();
                      }
                    }}
                    placeholder="Phone number"
                    maxLength={11}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('gender-trigger')?.click();
                      }
                    }}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender-trigger" className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-lg font-semibold">Select Tests *</Label>
                
                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Bordered Scrollable Tests Area */}
                <div className="rounded-lg border-2 border-border bg-card">
                  <ScrollArea className="h-[300px] w-full p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {filteredTests.map((test) => {
                        const isSelected = selectedTests.includes(test.id);
                        return (
                          <div
                            key={test.id}
                            onClick={() => toggleTest(test.id)}
                            className={`flex flex-col rounded-lg border-2 p-3 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-border bg-background hover:border-primary hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start space-x-2 mb-2">
                              <div className={`flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 ${
                                isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-foreground text-sm leading-tight">{test.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">{test.category}</div>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-primary mt-auto">৳{test.price}</div>
                          </div>
                        );
                      })}
                      {filteredTests.length === 0 && (
                        <div className="col-span-2 lg:col-span-4 py-8 text-center text-muted-foreground">
                          No tests found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Price Summary Section */}
              <div className="rounded-lg border-2 border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Price Summary</h3>
                
                <div className="flex justify-between items-center text-base">
                  <span className="text-muted-foreground">Selected Tests:</span>
                  <span className="font-semibold">{selectedTests.length}</span>
                </div>

                <div className="flex justify-between items-center text-base">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">৳{total.toLocaleString()}</span>
                </div>

                {/* Discount Input with Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max={discountType === "percent" ? 100 : total}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="0"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant={discountType === "flat" ? "default" : "outline"}
                      onClick={() => {
                        setDiscountType("flat");
                        setDiscount(0);
                      }}
                      className="w-16"
                    >
                      ৳
                    </Button>
                    <Button
                      type="button"
                      variant={discountType === "percent" ? "default" : "outline"}
                      onClick={() => {
                        setDiscountType("percent");
                        setDiscount(0);
                      }}
                      className="w-16"
                    >
                      %
                    </Button>
                  </div>
                  {discount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Discount: -{discountType === "percent" ? `${discount}%` : `৳${discount}`} 
                      {discountType === "percent" && ` (৳${discountAmount.toLocaleString()})`}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Final Amount:</span>
                    <span className="text-2xl font-bold text-primary">৳{finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Save & Generate Receipt
              </Button>
            </form>
          </Card>
        </div>

        {/* Recent Entries - Last 20 */}
        {patients.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold">Recent Entries</h2>
            <Card className="p-6">
              <div className="space-y-3">
                {patients
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((patient) => (
                    <div 
                      key={patient.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                      onClick={() => navigate(`/receipt/${patient.id}`)}
                    >
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.phone} • {new Date(patient.date).toLocaleDateString('en-GB')}
                        </p>
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
