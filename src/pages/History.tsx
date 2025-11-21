import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Eye, Trash2, Download, Calendar, Filter } from "lucide-react";
import { getPatients, deletePatient, getTests, type Patient, type Test } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function History() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [testFilter, setTestFilter] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const loadPatients = async () => {
    const allPatients = await getPatients();
    const allTests = await getTests();
    setPatients(allPatients.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
    setTests(allTests);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    // Search filter
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.serial.toString().includes(searchTerm);
    
    // Date filter
    let matchesDate = true;
    if (dateFilter) {
      const patientDate = new Date(patient.date);
      const today = new Date();
      const filterDate = new Date(dateFilter);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = patientDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = patientDate >= weekAgo;
          break;
        case 'month':
          matchesDate = patientDate.getMonth() === today.getMonth() && 
                        patientDate.getFullYear() === today.getFullYear();
          break;
        default:
          matchesDate = true;
      }
    }
    
    // Test filter
    const matchesTest = !testFilter || patient.tests.some(t => t.id === testFilter);
    
    // Price filter
    const matchesPrice = (!minPrice || patient.finalAmount >= Number(minPrice)) &&
                         (!maxPrice || patient.finalAmount <= Number(maxPrice));
    
    return matchesSearch && matchesDate && matchesTest && matchesPrice;
  });

  const exportToCSV = () => {
    const headers = ["Serial", "Name", "Phone", "Date", "Tests", "Amount"];
    const rows = filteredPatients.map(p => [
      p.serial,
      p.name,
      p.phone,
      new Date(p.date).toLocaleDateString('en-GB'),
      p.tests.map(t => t.name).join('; '),
      p.finalAmount
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Patient history exported to CSV"
    });
  };

  const handleDelete = async () => {
    if (deletePassword !== "ab437620") {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive",
      });
      return;
    }

    if (deleteId) {
      await deletePatient(deleteId);
      toast({
        title: "Success",
        description: "Patient record deleted successfully",
      });
      setDeleteId(null);
      setDeletePassword("");
      loadPatients();
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteId(null);
    setDeletePassword("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <h1 className="mb-6 text-3xl font-bold">Patient History</h1>

        {/* Filters */}
        <div className="stat-card mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, phone, serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter">
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-filter">Test Type</Label>
              <Select value={testFilter} onValueChange={setTestFilter}>
                <SelectTrigger id="test-filter">
                  <SelectValue placeholder="All tests" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="">All tests</SelectItem>
                  {tests.map(test => (
                    <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price-range">Price Range (৳)</Label>
              <div className="flex gap-2">
                <Input
                  id="price-range"
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {(searchTerm || dateFilter || testFilter || minPrice || maxPrice) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
                setTestFilter("");
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="stat-card mb-4">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
          </p>
        </div>

        <div className="stat-card">
          {filteredPatients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left">Receipt #</th>
                    <th className="pb-3 text-left">Name</th>
                    <th className="pb-3 text-left">Phone</th>
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-right">Tests</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-mono">#{patient.serial}</td>
                      <td className="py-3 font-semibold">{patient.name}</td>
                      <td className="py-3">{patient.phone}</td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {new Date(patient.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 text-right">{patient.tests.length}</td>
                      <td className="py-3 text-right font-semibold text-primary">
                        ৳{patient.finalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => navigate(`/receipt/${patient.id}`)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteId(patient.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={handleDeleteDialogClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patient Record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Enter the password to permanently delete this patient record and receipt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
