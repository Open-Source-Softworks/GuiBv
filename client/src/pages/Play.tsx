import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Filter, SortAsc, Gamepad2, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameGrid } from "@/components/GameCard";
import { PageLayout } from "@/components/PageLayout";
import type { Game, Settings } from "@shared/schema";

const categories = ["All", "HTML5", "Flash", "Port", "Popular", "Arcade", "Action", "Puzzle", "Sports", "Racing", "Adventure"];

export default function Play() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  // Get current settings to determine game source
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Map user-friendly source names to API source keys
  const sourceMap: Record<string, string> = {
    "GN-Math": "gnmath",
    "Selenite": "selenite",
    "Truffled": "truffled",
    "Velara": "velara",
    "DuckMath": "duckmath",
    "PlayerNation": "PlayerNation",
  };
  const gameSource = sourceMap[settings?.gameSource || "PlayerNation"] || "PlayerNation";

  // Fetch titles from the selected source using unified API with source parameter
  const { data: titles = [], isLoading, refetch } = useQuery<Game[]>({
    queryKey: ["/api/library", { source: gameSource }],
    queryFn: async () => {
      const response = await fetch(`/api/library?source=${gameSource}`);
      if (!response.ok) throw new Error("Failed to fetch titles");
      return response.json();
    },
    enabled: !!gameSource,
  });

  const filteredTitles = useMemo(() => {
    let result = [...titles];

    if (searchQuery) {
      result = result.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (sortBy === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "za") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [titles, searchQuery, selectedCategory, sortBy]);

  const handleTitleClick = (item: Game) => {
    // Use bridge proxy for URLs, add gameMode to hide URL bar
    const bridgeUrl = `/!!/` + item.url;
    setLocation(`/browser?url=${encodeURIComponent(bridgeUrl)}&gameMode=true&title=${encodeURIComponent(item.title)}`);
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-titles"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="az">A-Z</SelectItem>
              <SelectItem value="za">Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
              data-testid={`filter-${category.toLowerCase().replace(/\./g, "")}`}
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredTitles.length} titles from {settings?.gameSource || "PlayerNation"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-titles"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {selectedCategory !== "All" && (
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3 w-3" />
            {selectedCategory}
            <button
              onClick={() => setSelectedCategory("All")}
              className="ml-1 hover:text-destructive"
              data-testid="button-clear-filter"
            >
              x
            </button>
          </Badge>
        )}
      </div>

        <GameGrid games={filteredTitles} isLoading={isLoading} onGameClick={handleTitleClick} />
      </div>
    </PageLayout>
  );
}
