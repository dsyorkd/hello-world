import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  subtitle?: string;
  progress?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  subtitle,
  progress,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("metric-card animate-fade-in", className)}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-sm font-medium",
              trend.direction === "up" ? "trend-positive" : "trend-negative"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
