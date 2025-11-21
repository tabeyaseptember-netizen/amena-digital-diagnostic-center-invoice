import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Share2 } from "lucide-react";
import { getPatients, type Patient } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const loadPatient = async () => {
      const patients = await getPatients();
      const found = patients.find(p => p.id === id);
      if (found) {
        setPatient(found);
      }
    };
    loadPatient();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast({
      title: "Coming Soon",
      description: "PDF download feature will be available soon",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt - ${patient?.name}`,
          text: `Receipt for ${patient?.name} - ৳${patient?.finalAmount}`,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      toast({
        title: "Share not supported",
        description: "Your browser doesn't support sharing",
      });
    }
  };

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading receipt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Header />
        <Navbar />
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-3 print:hidden">
          <Button onClick={() => navigate("/")} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handleShare} variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Receipt */}
        <div className="mx-auto max-w-3xl">
          <div className="receipt-container animate-fade-in">
            {/* Header */}
            <div className="mb-8 border-b-2 border-primary pb-6 text-center">
              <h1 className="mb-2 text-3xl font-bold text-primary">Amena Diagnostic Center</h1>
              <p className="text-muted-foreground">Premium Healthcare Solutions</p>
              <p className="text-sm text-muted-foreground">
                Phone: +880-XXX-XXXXXX | Email: info@amenadiagnostic.com
              </p>
            </div>

            {/* Receipt Info */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt No:</p>
                <p className="font-bold">#{patient.serial}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date:</p>
                <p className="font-bold">
                  {new Date(patient.date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <h3 className="mb-3 font-semibold text-primary">Patient Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name:</p>
                  <p className="font-semibold">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone:</p>
                  <p className="font-semibold">{patient.phone}</p>
                </div>
                {patient.age && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age:</p>
                    <p className="font-semibold">{patient.age} years</p>
                  </div>
                )}
                {patient.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Gender:</p>
                    <p className="font-semibold">{patient.gender}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tests Table */}
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-primary">Tests Conducted</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left">Test Name</th>
                    <th className="pb-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.tests.map((test, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2">{test.name}</td>
                      <td className="py-2 text-right">৳{test.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Summary */}
            <div className="space-y-2 border-t-2 border-primary pt-4">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-semibold">৳{patient.total.toLocaleString()}</span>
              </div>
              {patient.discount > 0 && (
                <div className="flex justify-between text-lg text-success">
                  <span>Discount:</span>
                  <span className="font-semibold">-৳{patient.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-2xl font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">৳{patient.finalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              <p>Thank you for choosing Amena Diagnostic Center</p>
              <p className="mt-2">This is a computer-generated receipt</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
