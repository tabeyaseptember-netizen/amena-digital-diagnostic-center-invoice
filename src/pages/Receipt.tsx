import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Share2 } from "lucide-react";
import { getPatients, type Patient } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Check if we came from admin panel
  const fromAdmin = location.state?.from === 'admin';

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

  const handleDownload = async () => {
    if (!receiptRef.current || !patient) return;
    
    setIsDownloading(true);
    toast({
      title: "Generating PDF",
      description: "Please wait...",
    });

    try {
      // Temporarily hide any Lovable badges
      const lovableBadges = document.querySelectorAll('[class*="lovable"], [id*="lovable"], [data-lovable]');
      lovableBadges.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Get the receipt container element
      const element = receiptRef.current;
      
      // Create canvas from the element with higher quality
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // Calculate dimensions with proper margins
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 20; // 2cm margin on each side
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add image to PDF with margins
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', margin, 15, contentWidth, contentHeight);

      // Save PDF
      const fileName = `AMENA_DIGITAL_DIAGNOSTIC_CENTER_-_Premium_Healthcare_Management.pdf`;
      pdf.save(fileName);

      // Restore Lovable badges
      lovableBadges.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
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
          <Button onClick={() => navigate(fromAdmin ? "/admin" : "/")} variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={handleDownload} 
            variant="outline"
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Generating..." : "PDF"}
          </Button>
          <Button onClick={handleShare} variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Receipt */}
        <div className="mx-auto max-w-3xl">
          <div ref={receiptRef} className="receipt-container animate-fade-in bg-white p-8 rounded-lg shadow-lg print:shadow-none">
            {/* Header */}
            <div className="mb-6 border-b-2 border-primary pb-4 print:mb-4">
              <div className="flex items-start gap-4">
                <img 
                  src="/logo.jpg" 
                  alt="AMENA DIGITAL DIAGNOSTIC CENTER Logo" 
                  className="h-16 w-16 object-contain rounded-lg"
                  crossOrigin="anonymous"
                />
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-bold text-primary print:text-xl">AMENA DIGITAL DIAGNOSTIC CENTER</h1>
                  <p className="text-gray-700 text-sm">Premium Healthcare Solutions</p>
                  <p className="text-xs text-gray-600">
                    Phone: +880-XXX-XXXXXX | Email: info@amenadiagnostic.com
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Info */}
            <div className="mb-4 grid grid-cols-2 gap-4 print:mb-3">
              <div>
                <p className="text-xs text-gray-600">Receipt No:</p>
                <p className="font-bold text-gray-900">#{patient.serial}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Date:</p>
                <p className="font-bold text-gray-900">
                  {new Date(patient.date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4 print:mb-3">
              <h3 className="mb-2 font-semibold text-primary text-sm">Patient Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Name:</p>
                  <p className="font-semibold text-gray-900 text-sm">{patient.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone:</p>
                  <p className="font-semibold text-gray-900 text-sm">{patient.phone}</p>
                </div>
                {patient.age && (
                  <div>
                    <p className="text-xs text-gray-600">Age:</p>
                    <p className="font-semibold text-gray-900 text-sm">{patient.age} years</p>
                  </div>
                )}
                {patient.gender && (
                  <div>
                    <p className="text-xs text-gray-600">Gender:</p>
                    <p className="font-semibold text-gray-900 text-sm">{patient.gender}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tests Table */}
            <div className="mb-4 print:mb-3">
              <h3 className="mb-2 font-semibold text-primary text-sm">Tests Conducted</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="pb-2 text-left text-sm font-semibold text-gray-900">Test Name</th>
                    <th className="pb-2 text-right text-sm font-semibold text-gray-900">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.tests.map((test, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2 text-sm text-gray-800">{test.name}</td>
                      <td className="py-2 text-right text-sm text-gray-800">৳{test.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Summary */}
            <div className="space-y-2 border-t-2 border-primary pt-3 print:pt-2">
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">৳{patient.total.toLocaleString()}</span>
              </div>
              {patient.discount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-৳{patient.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2 text-xl font-bold print:text-lg">
                <span className="text-gray-900">Total Amount:</span>
                <span className="text-primary">৳{patient.finalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 border-t border-gray-300 pt-2 text-center text-xs text-gray-600 print:mt-3">
              <p>Thank you for choosing AMENA DIGITAL DIAGNOSTIC CENTER</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
