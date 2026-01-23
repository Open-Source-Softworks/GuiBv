import { useQuery } from "@tanstack/react-query";
import { AdBanner, AdPlaceholder } from "@/components/AdBanner";
import { Disclaimer } from "@/components/Disclaimer";
import type { Ad } from "@shared/schema";

interface PageLayoutProps {
  children: React.ReactNode;
  showAds?: boolean;
  showDisclaimer?: boolean;
  className?: string;
}

export function PageLayout({ 
  children, 
  showAds = true, 
  showDisclaimer = true,
  className = "" 
}: PageLayoutProps) {
  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads/active"],
  });

  const hasActiveAds = ads.length > 0;

  return (
    <div className={`flex flex-col min-h-full ${className}`}>
      <div className="flex-1">
        {children}
      </div>
      
      {(showAds || showDisclaimer) && (
        <div className="p-6 pt-0 space-y-4">
          {showAds && (
            hasActiveAds ? <AdBanner /> : <AdPlaceholder />
          )}
          {showDisclaimer && <Disclaimer />}
        </div>
      )}
    </div>
  );
}
