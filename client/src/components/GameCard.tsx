import type { Game } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

function getProxiedThumbnail(thumbnail: string): string {
  if (!thumbnail) return '';
  if (thumbnail.startsWith('/') || thumbnail.startsWith('data:')) {
    return thumbnail;
  }
  return `/!!/` + thumbnail;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const thumbnailUrl = getProxiedThumbnail(game.thumbnail);
  
  return (
    <button
      onClick={() => onClick(game)}
      className="group relative aspect-[3/4] overflow-hidden rounded-md bg-card border border-card-border transition-colors duration-200 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      data-testid={`game-card-${game.id}`}
    >
      <img
        src={thumbnailUrl}
        alt={game.title}
        className="absolute inset-0 w-full h-full object-cover rounded-md"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23333" width="400" height="300"/><text fill="%23666" font-size="20" x="50%" y="50%" text-anchor="middle" dy=".3em">Game Image</text></svg>';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
          <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-heading font-medium text-sm text-white truncate">
          {game.title}
        </h3>
        {game.category && (
          <p className="text-xs text-white/60 truncate mt-0.5">
            {game.category}
          </p>
        )}
      </div>
    </button>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="aspect-[3/4] overflow-hidden rounded-md">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

interface GameGridProps {
  games: Game[];
  isLoading?: boolean;
  onGameClick: (game: Game) => void;
}

export function GameGrid({ games, isLoading, onGameClick }: GameGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Play className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-heading font-medium text-lg mb-1">No games found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onClick={onGameClick} />
      ))}
    </div>
  );
}
