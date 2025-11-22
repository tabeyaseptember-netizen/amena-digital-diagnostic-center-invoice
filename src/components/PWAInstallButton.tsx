import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('💾 PWA Install prompt available');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('✅ PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also listen to custom event from index.html
    const handleCustomInstallAvailable = () => {
      setIsInstallable(true);
    };
    
    window.addEventListener('pwa-install-available', handleCustomInstallAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-install-available', handleCustomInstallAvailable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // Try to use the global function from index.html
      if (typeof (window as any).triggerPWAInstall === 'function') {
        const result = await (window as any).triggerPWAInstall();
        if (result) {
          setIsInstalled(true);
          setIsInstallable(false);
        }
      }
      return;
    }

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      setIsInstalled(true);
      setIsInstallable(false);
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    // Clear the prompt
    setInstallPrompt(null);
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if not installable
  if (!isInstallable) {
    return null;
  }

  // Show banner
  if (showBanner) {
    return (
      <Card className="mb-6 p-4 border-2 border-primary/20 bg-primary/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Install App on Your Device</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Install this app for faster access, offline support, and a better experience
              </p>
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Install Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // If banner is hidden, show compact button
  return (
    <Button 
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
