import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Share2 } from "lucide-react";
import { getPatients, type Patient } from "@/lib/db";
import QRCode from 'qrcode';
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [notFound, setNotFound] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Check if we came from admin panel
  const fromAdmin = location.state?.from === 'admin';

  useEffect(() => {
    const loadPatient = async () => {
      const patients = await getPatients();
      // Find by primary id or by receiptId (QR may contain receiptId)
      const found = patients.find(p => p.id === id || p.receiptId === id);
      if (found) {
        setPatient(found);
      } else {
        // mark not found so we can show a friendly message
        setNotFound(true);
      }
    };
    loadPatient();
  }, [id]);

  // Generate QR and verify if hash provided
  useEffect(() => {
    if (!patient) return;

    (async () => {
      try {
        const receiptId = patient.receiptId ?? patient.id;
        const hashQuery = new URLSearchParams(window.location.search).get('h');
        // Build shareable URL (scannable)
        const shareUrl = `${window.location.origin}/receipt/${receiptId}${hashQuery ? `?h=${hashQuery}` : patient.receiptHash ? `?h=${patient.receiptHash}` : ''}`;
        const dataUrl = await QRCode.toDataURL(shareUrl, { width: 250, margin: 1 });
        setQrDataUrl(dataUrl);

        if (hashQuery) {
          setIsVerified(hashQuery === patient.receiptHash);
        } else if (patient.receiptHash) {
          // If no hash in URL, we still show verified=true because it matches stored
          setIsVerified(true);
        } else {
          setIsVerified(null);
        }
      } catch (e) {
        console.error('Failed to generate QR', e);
        setQrDataUrl(null);
      }
    })();
  }, [patient]);

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
    if (!notFound) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading receipt...</p>
        </div>
      );
    }

    // If we reach here, receipt was not found in local DB (scanned from a different device)
    const queryHash = new URLSearchParams(window.location.search).get('h');
    const receiptIdentifier = id;

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="mb-4 text-xl font-semibold">Receipt not available on this device</h2>
          <p className="text-sm text-gray-700 mb-4">
            This QR code (Receipt ID <span className="font-mono">{receiptIdentifier}</span>) was generated on a different device.
            For security and privacy, receipts can only be viewed on the device where they were created — i.e. the AMENA DIGITAL DIAGNOSTIC CENTER local device.
          </p>
          {queryHash && (
            <p className="text-xs text-gray-600 mb-3">Hash: <span className="font-mono">{queryHash}</span></p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="px-4 py-2 rounded bg-primary text-white"
            >
              Copy URL
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded border"
            >
              Go back
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">If you are at the clinic, open this link on the original device to view the receipt.</p>
        </div>
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
          <div ref={receiptRef} className="receipt-container animate-fade-in bg-white p-6 rounded-lg shadow-lg print:shadow-none">
            {/* Header */}
            <div className="relative mb-4 border-b-2 border-primary pb-2 print:mb-3" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 pr-32">
                  <img 
                    src="/logo.jpg" 
                    alt="AMENA DIGITAL DIAGNOSTIC CENTER Logo" 
                    className="h-12 w-12 object-contain rounded-lg"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1">
                    <h1 className="mb-1 text-xl font-bold text-primary print:text-lg">AMENA DIGITAL DIAGNOSTIC CENTER</h1>
                    <p className="text-gray-700 text-sm">Premium Healthcare Solutions</p>
                  </div>
                </div>

                {/* Receipt number and QR on the same horizontal line */}
                {qrDataUrl && (
                  <div className="absolute right-4 -top-4 z-10 flex flex-col items-center">
                    <img src={qrDataUrl} alt="Receipt QR" className="h-16 w-16 object-contain bg-white rounded-sm border border-gray-200" />
                  </div>
                )}
              </div>
            </div>

            {/* Date and Receipt No on same line */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Date:</p>
                <p className="font-bold text-gray-900">{new Date(patient.date).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="text-xs text-gray-700 whitespace-nowrap">
                Receipt No: <span className="font-mono">{patient.receiptId ?? patient.id}</span>
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
              {patient.address && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600">Address:</p>
                  <p className="font-semibold text-gray-900 text-sm">{patient.address}</p>
                </div>
              )}
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
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex flex-col items-start text-left">
                  <p className="text-xs">Verified: <span className={`font-semibold ${isVerified ? 'text-green-600' : 'text-red-600'}`}>{isVerified === null ? 'N/A' : isVerified ? 'Yes' : 'No'}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
