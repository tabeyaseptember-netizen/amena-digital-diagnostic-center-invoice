import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Eye, Trash2 } from "lucide-react";
import { getPatients, deletePatient, type Patient } from "@/lib/db";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const loadPatients = async () => {
    const allPatients = await getPatients();
    setPatients(allPatients.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.serial.toString().includes(searchTerm)
  );

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
      
      <main className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="mb-4 text-3xl font-bold">Patient History</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or receipt number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
