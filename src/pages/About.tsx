import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Shield, Users, Award, Phone, Mail, MapPin } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

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

        <div className="mb-8 text-center">
          <img 
            src="/logo.jpg" 
            alt="Amena Diagnostic Center Logo" 
            className="h-32 w-32 object-contain mx-auto mb-4 rounded-xl"
          />
          <h1 className="text-4xl font-bold mb-2">Amena Diagnostic Center</h1>
          <p className="text-xl text-muted-foreground">Premium Healthcare Solutions</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-muted-foreground">
                  To provide accurate, reliable, and timely diagnostic services with compassion and care, 
                  ensuring the best possible healthcare outcomes for our patients.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">
                  State-of-the-art equipment and internationally certified processes ensure 
                  the highest standards of accuracy and reliability in all our diagnostic services.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
                <p className="text-muted-foreground">
                  Our team of highly qualified pathologists, technicians, and healthcare professionals 
                  work together to deliver exceptional diagnostic services.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <Award className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                <p className="text-muted-foreground">
                  Committed to continuous improvement and innovation, we strive to set 
                  new standards in diagnostic healthcare services.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Services</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Blood Tests</h4>
              <p className="text-sm text-muted-foreground">
                Complete Blood Count, Lipid Profile, Liver & Kidney Function Tests
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Radiology</h4>
              <p className="text-sm text-muted-foreground">
                X-Ray, Ultrasound, ECG and other imaging services
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Specialized Tests</h4>
              <p className="text-sm text-muted-foreground">
                Hormone Tests, Thyroid Profile, HbA1c and more
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Contact Us</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Phone</h4>
                <p className="text-sm text-muted-foreground">+880-XXX-XXXXXX</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/10 p-2">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Email</h4>
                <p className="text-sm text-muted-foreground">info@amenadiagnostic.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <MapPin className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Address</h4>
                <p className="text-sm text-muted-foreground">To be configured</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Amena Diagnostic Center. All rights reserved.</p>
          <p className="mt-2">Version 2.0.0 - PWA Edition</p>
        </div>
      </main>
    </div>
  );
}
