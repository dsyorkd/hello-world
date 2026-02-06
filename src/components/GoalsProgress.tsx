import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  label: string;
  completed: boolean;
}

interface GoalsProgressProps {
  goals: Goal[];
}

export function GoalsProgress({ goals }: GoalsProgressProps) {
  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <div className="control-panel animate-fade-in">
      <h3 className="text-base font-semibold text-foreground mb-4">
        Goals Progress
      </h3>
      <ul className="space-y-3">
        {goals.map((goal) => (
          <li key={goal.id} className="flex items-center gap-3">
            {goal.completed ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success">
                <Check className="h-3 w-3 text-success-foreground" />
              </div>
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-sm",
                goal.completed ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {goal.label}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          On track:{" "}
          <span className="font-semibold text-foreground">
            {completedCount} of {goals.length}
          </span>
        </p>
      </div>
    </div>
  );
}
