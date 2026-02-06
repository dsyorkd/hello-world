import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DisclaimerBanner() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="disclaimer-banner sticky top-0 z-50 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {isExpanded ? (
            <p className="text-sm">
              <span className="font-medium">For educational purposes only.</span>{" "}
              Not financial advice. Consult a qualified advisor.
            </p>
          ) : (
            <p className="text-sm font-medium">Educational purposes only</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className="text-warning-foreground hover:bg-warning-foreground/10 gap-1 text-xs"
            >
              Learn More
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-warning-foreground hover:bg-warning-foreground/10"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
