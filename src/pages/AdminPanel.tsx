import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Eye, Trash2, TestTube } from "lucide-react";
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

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button
            onClick={() => navigate("/tests")}
            variant="outline"
            className="gap-2"
          >
            <TestTube className="h-4 w-4" />
            Manage Tests
          </Button>
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
                    <th className="pb-3 font-semibold">Serial</th>
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
                      <td className="py-3">{patient.serial}</td>
                      <td className="py-3 font-medium">{patient.name}</td>
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
                            onClick={() => navigate(`/receipt/${patient.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteId(patient.id)}
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
