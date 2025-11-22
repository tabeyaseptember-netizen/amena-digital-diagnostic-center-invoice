import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Check } from "lucide-react";
import { getPatients, getTests, updatePatient, type Patient, type Test } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check if we came from admin panel
  const fromAdmin = location.state?.from === 'admin';
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const patients = await getPatients();
      const found = patients.find(p => p.id === id);
      if (found) {
        setPatient(found);
        setName(found.name);
        setPhone(found.phone);
        setAge(found.age?.toString() || "");
        setGender(found.gender || "");
        setSelectedTests(found.tests.map(t => t.id));
        
        // Calculate discount type from existing data
        if (found.discount > 0) {
          const percentDiscount = (found.discount / found.total) * 100;
          if (Math.round(percentDiscount) === percentDiscount) {
            setDiscountType("percent");
            setDiscount(percentDiscount);
          } else {
            setDiscountType("flat");
            setDiscount(found.discount);
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Patient not found",
          variant: "destructive"
        });
        navigate("/");
      }
      
      const allTests = await getTests();
      setTests(allTests);
      setLoading(false);
    };
    loadData();
  }, [id, navigate, toast]);

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
    (test.category && test.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || selectedTests.length === 0 || !patient) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedTestsData = selectedTests.map((testId) => {
      const test = tests.find((t) => t.id === testId);
      return {
        id: test!.id,
        name: test!.name,
        price: test!.price,
        category: test!.category,
      };
    });

    // CRITICAL: Preserve original serial, ID, and date
    const updatedPatient: Patient = {
      ...patient,
      name,
      phone,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      tests: selectedTestsData,
      discount: discountAmount,
      total,
      finalAmount,
      // KEEP ORIGINAL: id, serial, date
    };

    await updatePatient(updatedPatient);
    
    toast({
      title: "Success",
      description: "Patient updated successfully",
    });

    navigate(`/receipt/${patient.id}`, { state: { from: fromAdmin ? 'admin' : undefined } });
  };

  if (loading || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate(`/receipt/${patient.id}`, { state: { from: fromAdmin ? 'admin' : undefined } })}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Receipt
        </Button>

        <div className="mb-4 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Editing Patient Record</strong> - Serial #{patient.serial} | 
            Original Date: {new Date(patient.date).toLocaleString('en-GB')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Note: Serial number and date will remain unchanged
          </p>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Edit Patient Information</h2>
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
                    placeholder="Age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="w-full">
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
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

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
                                {test.category && <div className="text-xs text-muted-foreground mt-1">{test.category}</div>}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-primary mt-auto">৳{test.price}</div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

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

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/receipt/${patient.id}`, { state: { from: fromAdmin ? 'admin' : undefined } })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Update & Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

