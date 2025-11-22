import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, Edit, TestTube, Trash2, Download } from "lucide-react";
import { getPatients, deletePatient, exportAllData, type Patient } from "@/lib/db";
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

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const loadPatients = async () => {
    const allPatients = await getPatients();
    setPatients(allPatients);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.tests.some((test) =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    
    try {
      await deletePatient(patientToDelete.id);
      await loadPatients();
      toast({
        title: "Patient Deleted",
        description: `${patientToDelete.name}'s record has been removed from the database.`,
      });
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete patient record.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/tests")}
              variant="outline"
              className="gap-2"
            >
              <TestTube className="h-4 w-4" />
              Manage Tests
            </Button>
            <Button
              onClick={async () => {
                try {
                  const data = await exportAllData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `amena-backup-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast({ title: 'Export Successful', description: 'All data downloaded as JSON.' });
                } catch (error) {
                  toast({ title: 'Export Failed', description: 'Unable to export data.', variant: 'destructive' });
                }
              }}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        <Card className="mb-6 p-4">
          <Input
            type="text"
            placeholder="Search by name, phone, or test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </Card>

        <div className="stat-card">
          {filteredPatients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchTerm ? "No matching records found" : "No patient records yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    {/* Serial removed from Admin list display */}
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Phone</th>
                    <th className="pb-3 font-semibold">Tests</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b last:border-0">
                      {/* serial removed */}
                      <td className="py-3 font-medium">{patient.name}</td>
                      <td className="py-3">{patient.phone}</td>
                      <td className="py-3">{patient.tests.length}</td>
                      <td className="py-3">{patient.phone}</td>
                      <td className="py-3">{patient.tests.length}</td>
                      <td className="py-3 font-semibold text-primary">
                        ৳{patient.finalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {new Date(patient.date).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/receipt/${patient.id}`, { state: { from: 'admin' } })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/edit-patient/${patient.id}`, { state: { from: 'admin' } })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(patient)}
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
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {patientToDelete?.name}'s record? 
              This will permanently remove all data including tests and payment information from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
