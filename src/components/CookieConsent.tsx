import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'finaptico-cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si ya hay consentimiento guardado
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
      <div className="container mx-auto max-w-6xl">
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 text-sm">
              Utilizamos cookies propias y de terceros para mejorar nuestros servicios. 
              {' '}
              <a 
                href="https://finaptico.com/politica-de-cookies" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Más información
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReject}>
                Rechazar
              </Button>
              <Button size="sm" onClick={handleAccept}>
                Aceptar todas
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
