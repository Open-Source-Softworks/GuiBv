import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Ad } from "@shared/schema";

interface AdBannerProps {
  className?: string;
}

export function AdBanner({ className = "" }: AdBannerProps) {
  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads/active"],
  });

  if (ads.length === 0) {
    return null;
  }

  const randomAd = ads[Math.floor(Math.random() * ads.length)];

  return (
    <a
      href={randomAd.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${className}`}
      data-testid={`ad-banner-${randomAd.id}`}
    >
      <Card className="relative overflow-hidden hover-elevate">
        <div className="relative aspect-[4/1] sm:aspect-[6/1]">
          <img
            src={randomAd.imageUrl}
            alt={randomAd.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent flex items-center">
            <div className="p-4">
              <Badge variant="outline" className="mb-2 text-xs">
                Sponsored
              </Badge>
              <h3 className="font-heading font-semibold text-lg">
                {randomAd.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {randomAd.advertiser}
              </p>
            </div>
          </div>
          <ExternalLink className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </a>
  );
}

export function AdPlaceholder() {
  return (
    <Card className="p-6 text-center border-dashed">
      <p className="text-sm text-muted-foreground">
        Want to advertise here? Contact{" "}
        <a 
          href="mailto:gc893806@gmail.com" 
          className="text-primary hover:underline"
          data-testid="link-ad-contact"
        >
          gc893806@gmail.com
        </a>{" "}
        to promote your product or service!
      </p>
    </Card>
  );
}
