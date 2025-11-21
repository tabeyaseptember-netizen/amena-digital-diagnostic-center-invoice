import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { exportAllData, importData, createBackup, getBackups, type Backup } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Upload, Database, AlertCircle, CheckCircle2, HardDrive, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backups = [] } = useQuery({
    queryKey: ['backups'],
    queryFn: getBackups
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
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
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully."
      });
    }
  });

  const backupMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({
        title: "Backup Created",
        description: "A new backup has been created successfully."
      });
    }
  });

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      toast({
        title: "Import Successful",
        description: "Data has been imported successfully."
      });
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive"
      });
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

        <h1 className="mb-6 text-3xl font-bold">Settings</h1>

        <div className="mx-auto max-w-2xl space-y-6">
          {/* Data Persistence Warning */}
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Data Persistence Active</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your data is stored locally and <strong>NEVER deleted automatically</strong>. 
              App updates, reinstalls, or refreshes will NOT erase any records. 
              Data will only be removed if you manually clear browser storage from your browser settings.
            </AlertDescription>
          </Alert>

          {/* Storage Information */}
          <div className="stat-card">
            <div className="mb-4 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Storage Information</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Your data is stored permanently in IndexedDB</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Database Name</div>
                <div className="font-mono font-semibold">amena_diagno_db</div>
              </div>
              <div>
                <div className="text-muted-foreground">Auto-Backup</div>
                <div className="font-semibold text-green-600">Every 24 hours</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Backups</div>
                <div className="font-semibold">{backups.length} / 30</div>
              </div>
              <div>
                <div className="text-muted-foreground">Write-Ahead Log</div>
                <div className="font-semibold text-green-600">Active</div>
              </div>
            </div>
          </div>

          {/* Backup & Export */}
          <div className="stat-card">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Backup & Export</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Manage your data backups and exports</p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={() => backupMutation.mutate()}
                  disabled={backupMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Create Backup Now
                </Button>
                <Button 
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to File
                </Button>
              </div>

              <div>
                <Label htmlFor="import" className="cursor-pointer">
                  <Button variant="outline" className="w-full" asChild>
                    <div>
                      <Upload className="mr-2 h-4 w-4" />
                      Import from File
                    </div>
                  </Button>
                </Label>
                <Input
                  id="import"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>

              {backups.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Recent Backups:</div>
                  <div className="space-y-1">
                    {backups.slice(0, 5).map((backup) => (
                      <div key={backup.id} className="text-xs font-mono text-muted-foreground">
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="stat-card">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">About</h2>
            </div>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">AMENA DIGITAL DIAGNOSTIC CENTER</p>
                <p className="text-sm">Version 2.0.0 - PWA Edition</p>
              </div>
              <p className="text-sm">
                Premium healthcare receipt management system with offline-first capabilities and permanent data persistence.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="stat-card">
            <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Phone:</span> +880-XXX-XXXXXX</p>
              <p><span className="font-semibold">Email:</span> info@amenadiagnostic.com</p>
              <p><span className="font-semibold">Address:</span> To be configured</p>
            </div>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How to Delete Data</AlertTitle>
            <AlertDescription>
              To completely remove all data, you must manually clear browser storage:
              <br />
              <strong>Browser Settings → Privacy → Clear Browsing Data → Site Data</strong>
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}
