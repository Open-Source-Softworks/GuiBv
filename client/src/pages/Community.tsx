import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, Lightbulb, RefreshCw, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/PageLayout";
import type { ChatMessage, Recommendation } from "@shared/schema";

export default function Community() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [suggestionName, setSuggestionName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { username: string; message: string }) => {
      return apiRequest("POST", "/api/chat", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const sendRecommendationMutation = useMutation({
    mutationFn: async (data: { suggestion: string; submittedBy?: string }) => {
      return apiRequest("POST", "/api/recommendations", data);
    },
    onSuccess: () => {
      setSuggestion("");
      setSuggestionName("");
      toast({
        title: "Thank you!",
        description: "Your recommendation has been submitted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit recommendation",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to chat",
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      username: username.trim(),
      message: message.trim(),
    });
  };

  const handleSendRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) {
      toast({
        title: "Empty suggestion",
        description: "Please enter your recommendation",
        variant: "destructive",
      });
      return;
    }

    sendRecommendationMutation.mutate({
      suggestion: suggestion.trim(),
      submittedBy: suggestionName.trim() || undefined,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <PageLayout>
      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading">Community</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-4rem)]">
          <Card className="lg:col-span-2 flex flex-col h-full min-h-[400px] max-h-[600px]">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1"
                  maxLength={20}
                  data-testid="input-chat-username"
                />
              </div>

              <ScrollArea className="flex-1 border rounded-md bg-muted/20 p-3">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                    <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="group flex gap-2 items-start hover:bg-muted/30 p-1.5 rounded transition-colors"
                        data-testid={`chat-message-${msg.id}`}
                      >
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(msg.timestamp)}
                        </span>
                        <span className="font-semibold text-primary shrink-0">
                          {msg.username}:
                        </span>
                        <span className="text-foreground break-words">{msg.message}</span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                  maxLength={500}
                  data-testid="input-chat-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sendMessageMutation.isPending || !message.trim()}
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full min-h-[400px] max-h-[600px]">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-3">
              <p className="text-sm text-muted-foreground">
                Have an idea for a feature or game? Let us know!
              </p>
              <form onSubmit={handleSendRecommendation} className="flex flex-col gap-3 flex-1">
                <Input
                  placeholder="Your name (optional)"
                  value={suggestionName}
                  onChange={(e) => setSuggestionName(e.target.value)}
                  maxLength={30}
                  data-testid="input-recommendation-name"
                />
                <Textarea
                  placeholder="Describe your idea or suggestion..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="flex-1 min-h-[120px] resize-none"
                  maxLength={1000}
                  data-testid="input-recommendation-suggestion"
                />
                <Button
                  type="submit"
                  disabled={sendRecommendationMutation.isPending || !suggestion.trim()}
                  className="w-full"
                  data-testid="button-submit-recommendation"
                >
                  {sendRecommendationMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Recommendation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </PageLayout>
  );
}
