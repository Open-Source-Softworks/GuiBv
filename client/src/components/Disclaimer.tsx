import { Card } from "@/components/ui/card";
import { AlertTriangle, Mail } from "lucide-react";

interface DisclaimerProps {
  className?: string;
}

export function Disclaimer({ className = "" }: DisclaimerProps) {
  return (
    <Card className={`p-4 border-dashed ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-heading font-semibold text-sm mb-1">Disclaimer</h4>
          <p className="text-xs text-muted-foreground mb-2">
            GuiBV does not host any content. All titles are embedded from external sources. 
            We do not claim ownership of any content displayed on this platform.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Want to upload content or have it removed? Email{" "}
              <a
                href="mailto:gc893806@gmail.com"
                className="text-primary hover:underline font-medium"
                data-testid="link-disclaimer-email"
              >
                gc893806@gmail.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
