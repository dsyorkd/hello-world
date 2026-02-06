import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { RetirementChatUI, ChatMessage } from "@/components/RetirementChatUI";
import { Landmark } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome! I'm your AI retirement planning assistant. Let's set up your financial profile together. Tell me a bit about yourself - your age, income, and what you're hoping for in retirement.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [completeness, setCompleteness] = useState(0);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await api.chat({
          user_id: user.id,
          message: content,
          conversation_id: conversationId,
        });

        setConversationId(response.conversation_id);

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update completeness if extracted
        if (response.extracted_parameters?.completeness) {
          setCompleteness(Math.round(response.extracted_parameters.completeness * 100));
        }

        // If onboarding is complete, redirect to dashboard
        if (response.onboarding_complete) {
          await refreshUser();
          setTimeout(() => navigate("/"), 1500);
        }
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I had trouble processing that. Could you try again?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [user, conversationId, navigate, refreshUser]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-primary">RetireWise</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Setting up your profile...
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Let's Plan Your Retirement
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Chat with our AI assistant to set up your financial profile
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Profile completeness</span>
              <span>{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
          </div>
        </div>

        <RetirementChatUI
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Tell me about your retirement goals..."
          className="min-h-[500px]"
        />
      </main>
    </div>
  );
}
