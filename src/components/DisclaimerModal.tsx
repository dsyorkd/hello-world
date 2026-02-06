import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const DISCLAIMER_ACCEPTED_KEY = "retirewise_disclaimer_accepted";

export function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if already acknowledged via API user data or localStorage
    if (user?.disclaimer_acknowledged_at) {
      localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
      return;
    }
    const accepted = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!accepted) {
      setIsOpen(true);
    }
  }, [user]);

  const handleAccept = async () => {
    localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
    setIsOpen(false);

    // Also acknowledge on the server if user is logged in
    if (user?.id) {
      try {
        await api.acknowledgeDisclaimer(user.id);
      } catch {
        // Non-blocking - localStorage is the primary check
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning">
            <AlertTriangle className="h-7 w-7 text-warning-foreground" />
          </div>
          <DialogTitle className="text-xl">Important Notice</DialogTitle>
          <DialogDescription className="text-left space-y-4 pt-4">
            <p>
              <strong>RetireWise</strong> is for educational and entertainment
              purposes only.
            </p>
            <p>
              This application does <strong>NOT</strong> provide financial advice.
              Results are based on mathematical models and do not guarantee future
              performance.
            </p>
            <p>
              Always consult a qualified financial advisor before making financial
              decisions.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Button
            variant="cta"
            size="lg"
            className="w-full"
            onClick={handleAccept}
          >
            I Understand and Agree
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
