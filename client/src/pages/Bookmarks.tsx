import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Bookmark } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import type { Bookmark as BookmarkType, InsertBookmark } from "@shared/schema";

export default function Bookmarks() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [newBookmark, setNewBookmark] = useState({ title: "", url: "" });

  const { data: bookmarks = [], isLoading } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBookmark) => {
      const res = await apiRequest("POST", "/api/bookmarks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setNewBookmark({ title: "", url: "" });
      setIsAddDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBookmark> }) => {
      const res = await apiRequest("PATCH", `/api/bookmarks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setEditingBookmark(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
  });

  const handleAddBookmark = () => {
    if (!newBookmark.title || !newBookmark.url) return;

    createMutation.mutate({
      title: newBookmark.title,
      url: newBookmark.url.startsWith("http") ? newBookmark.url : `https://${newBookmark.url}`,
    });
  };

  const handleEditBookmark = () => {
    if (!editingBookmark) return;

    updateMutation.mutate({
      id: editingBookmark.id,
      data: {
        title: editingBookmark.title,
        url: editingBookmark.url,
      },
    });
  };

  const handleDeleteBookmark = (id: string) => {
    deleteMutation.mutate(id);
  };

  const openBookmark = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="font-heading font-bold text-2xl">Bookmarks</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-bookmark">
              <Plus className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bookmark</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="My Bookmark"
                  data-testid="input-bookmark-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newBookmark.url}
                  onChange={(e) => setNewBookmark((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  data-testid="input-bookmark-url"
                />
              </div>
              <Button
                onClick={handleAddBookmark}
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-save-bookmark"
              >
                {createMutation.isPending ? "Adding..." : "Add Bookmark"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bookmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-medium text-lg mb-1">No bookmarks yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your favorite websites for quick access
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bookmark
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {bookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className="group hover-elevate cursor-pointer relative"
              data-testid={`bookmark-${bookmark.id}`}
            >
              <CardContent className="p-4">
                <button
                  onClick={() => openBookmark(bookmark.url)}
                  className="w-full text-left"
                >
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-3 mx-auto">
                    <span className="text-lg font-bold text-primary">
                      {bookmark.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm text-center truncate mb-1">
                    {bookmark.title}
                  </h3>
                  <p className="text-xs text-muted-foreground text-center truncate">
                    {(() => {
                      try {
                        return new URL(bookmark.url).hostname;
                      } catch {
                        return bookmark.url;
                      }
                    })()}
                  </p>
                </button>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setEditingBookmark(bookmark)}
                        data-testid={`button-edit-${bookmark.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Bookmark</DialogTitle>
                      </DialogHeader>
                      {editingBookmark && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                              id="edit-title"
                              value={editingBookmark.title}
                              onChange={(e) =>
                                setEditingBookmark((prev) =>
                                  prev ? { ...prev, title: e.target.value } : null
                                )
                              }
                              data-testid="input-edit-title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-url">URL</Label>
                            <Input
                              id="edit-url"
                              value={editingBookmark.url}
                              onChange={(e) =>
                                setEditingBookmark((prev) =>
                                  prev ? { ...prev, url: e.target.value } : null
                                )
                              }
                              data-testid="input-edit-url"
                            />
                          </div>
                          <Button
                            onClick={handleEditBookmark}
                            className="w-full"
                            disabled={updateMutation.isPending}
                            data-testid="button-update-bookmark"
                          >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${bookmark.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </PageLayout>
  );
}
