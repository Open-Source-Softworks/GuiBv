import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Globe, Bookmark, ArrowRight, Sprout, Sparkles } from "lucide-react";
import { GameGrid } from "@/components/GameCard";
import { PageLayout } from "@/components/PageLayout";
import type { Game } from "@shared/schema";

const quickActions = [
  {
    title: "Arcade",
    description: "Browse & play titles",
    icon: Gamepad2,
    href: "/play",
    color: "from-yellow-500 to-amber-500",
  },
  {
    title: "Browser",
    description: "Surf the web",
    icon: Globe,
    href: "/browser",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Bookmarks",
    description: "Quick access links",
    icon: Bookmark,
    href: "/bookmarks",
    color: "from-orange-500 to-yellow-500",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  
  const { data: titles = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/library"],
  });

  const featuredTitles = titles.slice(0, 5);

  const handleGameClick = (game: Game) => {
    setLocation(`/browser?url=${encodeURIComponent(game.url)}`);
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-8">
        <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-amber-900/20 to-background p-8 border border-primary/20">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sprout className="h-10 w-10 text-primary" />
            <h1 className="font-heading text-4xl font-bold bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
              GuiBV
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mb-6">
            Your custom browser platform. Play titles, browse the web, and manage your bookmarks all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/play" data-testid="button-browse-arcade">
                <Gamepad2 className="mr-2 h-4 w-4" />
                Browse Arcade
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/browser" data-testid="button-open-browser">
                <Globe className="mr-2 h-4 w-4" />
                Open Browser
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            v1.0.0
          </Badge>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link href={action.href} key={action.title}>
              <Card className="group hover-elevate cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-1 flex items-center gap-2">
                    {action.title}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-xl">Featured Titles</h2>
          <Button variant="ghost" asChild size="sm">
            <Link href="/play" data-testid="link-view-all-titles">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <GameGrid games={featuredTitles} isLoading={isLoading} onGameClick={handleGameClick} />
      </section>

      <section className="p-6 rounded-lg bg-card border border-card-border">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-1">Help The Website Grow!</h3>
            <p className="text-sm text-muted-foreground">
              Share this website with all your friends to help keep the traffic up and everything else running smoothly!
            </p>
          </div>
        </div>
      </section>
      </div>
    </PageLayout>
  );
}
