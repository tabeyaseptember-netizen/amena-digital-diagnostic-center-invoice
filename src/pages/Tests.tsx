import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { getTests, addTest, updateTest, deleteTest, type Test } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

export default function Tests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
  });

  const loadTests = async () => {
    const allTests = await getTests();
    setTests(allTests);
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleOpenDialog = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        price: test.price.toString(),
        category: test.category || "",
      });
    } else {
      setEditingTest(null);
      setFormData({ name: "", price: "", category: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in test name and price",
        variant: "destructive",
      });
      return;
    }

    const testData: Test = {
      id: editingTest?.id || crypto.randomUUID(),
      name: formData.name,
      price: parseInt(formData.price),
      category: formData.category || undefined,
    };

    if (editingTest) {
      await updateTest(testData);
      toast({
        title: "Success",
        description: "Test updated successfully",
      });
    } else {
      await addTest(testData);
      toast({
        title: "Success",
        description: "Test added successfully",
      });
    }

    setIsDialogOpen(false);
    loadTests();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTest(deleteId);
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
      setDeleteId(null);
      loadTests();
    }
  };

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

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Tests</h1>
          <Button onClick={() => handleOpenDialog()} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Test
          </Button>
        </div>

        <div className="stat-card">
          {tests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No tests available</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-semibold">{test.name}</p>
                    {test.category && (
                      <p className="text-xs text-muted-foreground">{test.category}</p>
                    )}
                    <p className="mt-1 text-lg font-bold text-primary">৳{test.price}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleOpenDialog(test)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setDeleteId(test.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTest ? "Edit Test" : "Add New Test"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="test-name">Test Name *</Label>
                <Input
                  id="test-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter test name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="test-price">Price (৳) *</Label>
                <Input
                  id="test-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                  required
                />
              </div>
              <div>
                <Label htmlFor="test-category">Category</Label>
                <Input
                  id="test-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Blood Test, Radiology"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  {editingTest ? "Update" : "Add"} Test
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Test?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this test.
              </AlertDialogDescription>
            </AlertDialogHeader>
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
