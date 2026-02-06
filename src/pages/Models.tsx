import { useState, useCallback } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, BarChart3, TrendingUp, GitBranch, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  metrics: {
    label: string;
    value: string;
    positive?: boolean;
  }[];
}

const defaultModels: ModelOption[] = [
  {
    id: "monte-carlo",
    name: "Monte Carlo",
    description: "Probabilistic simulation with confidence bands",
    icon: BarChart3,
    metrics: [
      { label: "Success", value: "78%", positive: true },
      { label: "Median", value: "$1.2M" },
    ],
  },
  {
    id: "fixed-return",
    name: "Fixed Return",
    description: "Consistent annual return assumption",
    icon: TrendingUp,
    metrics: [
      { label: "Meets goal", value: "Yes", positive: true },
      { label: "Balance", value: "$1.1M" },
    ],
  },
  {
    id: "three-scenario",
    name: "3-Scenario",
    description: "Best, expected, and worst case projections",
    icon: GitBranch,
    metrics: [
      { label: "Best", value: "Pass", positive: true },
      { label: "Expected", value: "Pass", positive: true },
      { label: "Worst", value: "Fail" },
    ],
  },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export default function Models() {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState("monte-carlo");
  const [models, setModels] = useState(defaultModels);
  const [isComparing, setIsComparing] = useState(false);
  const userName = user?.name || "User";

  const handleCompare = useCallback(async () => {
    if (!user) return;
    setIsComparing(true);

    try {
      const result = await api.compareModels({
        user_id: user.id,
        model_types: ["monte_carlo", "fixed_return", "three_scenario"],
      });

      if (result?.comparisons) {
        const updated = defaultModels.map((model) => {
          const comparison = result.comparisons.find(
            (c: any) =>
              c.model_type === model.id.replace("-", "_")
          );
          if (!comparison?.summary) return model;

          const s = comparison.summary;
          if (model.id === "monte-carlo") {
            return {
              ...model,
              metrics: [
                { label: "Success", value: `${Math.round(s.success_rate || 0)}%`, positive: (s.success_rate || 0) >= 70 },
                { label: "Median", value: formatCurrency(s.balance_at_retirement || 0) },
              ],
            };
          }
          if (model.id === "fixed-return") {
            return {
              ...model,
              metrics: [
                { label: "Meets goal", value: s.meets_goal ? "Yes" : "No", positive: s.meets_goal },
                { label: "Balance", value: formatCurrency(s.balance_at_retirement || 0) },
              ],
            };
          }
          if (model.id === "three-scenario") {
            return {
              ...model,
              metrics: [
                { label: "Meets goal", value: s.meets_goal ? "Yes" : "No", positive: s.meets_goal },
                { label: "Funds last", value: `${s.years_funds_last || "?"}yr` },
              ],
            };
          }
          return model;
        });
        setModels(updated);
      }
    } catch {
      console.warn("Model comparison failed, showing defaults");
    } finally {
      setIsComparing(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <DisclaimerBanner />
      <Navigation userName={userName} />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Compare Models</h1>
          <p className="text-sm text-muted-foreground">
            Choose the projection model that best fits your planning style
          </p>
        </div>

        {/* Compare Button */}
        <div className="mb-6">
          <Button
            variant="cta"
            onClick={handleCompare}
            disabled={isComparing}
          >
            {isComparing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running comparisons...
              </>
            ) : (
              "Run All Comparisons"
            )}
          </Button>
        </div>

        {/* Model Cards Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {models.map((model, index) => {
            const isSelected = selectedModel === model.id;
            return (
              <Card
                key={model.id}
                className={cn(
                  "p-5 cursor-pointer transition-all duration-200 animate-fade-in",
                  isSelected
                    ? "ring-2 ring-primary shadow-md"
                    : "hover:shadow-md hover:-translate-y-0.5"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <model.icon className="h-5 w-5 text-primary" />
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success">
                      <Check className="h-3.5 w-3.5 text-success-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {model.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {model.description}
                </p>
                <div className="space-y-2 pt-4 border-t border-border">
                  {model.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{metric.label}:</span>
                      <span
                        className={cn(
                          "font-medium",
                          metric.positive ? "text-success" : "text-foreground"
                        )}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full mt-4"
                >
                  {isSelected ? "Selected" : "Select"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Overlay Chart Placeholder */}
        <Card className="p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Model Comparison Chart
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Selected models superimposed for easy comparison
          </p>
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Comparison chart visualization
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently showing: {models.find((m) => m.id === selectedModel)?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-6 bg-chart-primary" />
              <span className="text-muted-foreground">MC median</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-0.5 w-6 bg-chart-success"
                style={{ borderStyle: "dashed" }}
              />
              <span className="text-muted-foreground">Fixed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-6 bg-chart-accent opacity-70" />
              <span className="text-muted-foreground">Expected</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
