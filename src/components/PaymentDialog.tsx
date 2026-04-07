import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentLabel: string;
  documentDescription: string;
  onPaymentComplete: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  documentLabel,
  documentDescription,
  onPaymentComplete,
}: PaymentDialogProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'done'>('confirm');

  const handlePay = () => {
    setStep('processing');
    // Mock payment – simulate a short delay
    setTimeout(() => {
      setStep('done');
      setTimeout(() => {
        onPaymentComplete();
        onOpenChange(false);
        setStep('confirm');
      }, 1200);
    }, 1500);
  };

  const handleClose = (v: boolean) => {
    if (step === 'processing') return;
    onOpenChange(v);
    if (!v) setStep('confirm');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">{documentLabel}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {documentDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">2,00 €</p>
              <p className="text-xs text-muted-foreground">Einmaliger Betrag · kein Abonnement</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Abbrechen
              </Button>
              <Button variant="cta" className="flex-1" onClick={handlePay}>
                Kostenpflichtig erstellen
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Zahlung wird verarbeitet…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="h-8 w-8 text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground">Dokument wird erstellt…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
