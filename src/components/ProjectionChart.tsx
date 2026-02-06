import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProjectionDataPoint {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

interface ProjectionChartProps {
  data: ProjectionDataPoint[];
  goalAmount?: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

export function ProjectionChart({ data, goalAmount = 1200000 }: ProjectionChartProps) {
  return (
    <div className="chart-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Portfolio Projection
          </h3>
          <p className="text-sm text-muted-foreground">
            Monte Carlo simulation with confidence bands
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-primary opacity-30" />
            <span className="text-muted-foreground">10th-90th</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-primary opacity-50" />
            <span className="text-muted-foreground">25th-75th</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-primary" />
            <span className="text-muted-foreground">Median</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 bg-chart-accent" style={{ borderStyle: "dashed" }} />
            <span className="text-muted-foreground">Goal</span>
          </div>
        </div>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorP75" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.6} />
                <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="age"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={formatCurrency}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  p90: "90th percentile",
                  p75: "75th percentile",
                  p50: "Median",
                  p25: "25th percentile",
                  p10: "10th percentile",
                };
                return [formatCurrency(value), labels[name] || name];
              }}
              labelFormatter={(label) => `Age ${label}`}
            />
            {/* 10th-90th percentile band */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="none"
              fill="url(#colorP90)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="p10"
              stroke="none"
              fill="hsl(var(--background))"
              fillOpacity={1}
            />
            {/* 25th-75th percentile band */}
            <Area
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill="url(#colorP75)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="p25"
              stroke="none"
              fill="hsl(var(--background))"
              fillOpacity={1}
            />
            {/* Median line */}
            <Area
              type="monotone"
              dataKey="p50"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={3}
              fill="none"
            />
            {/* Goal line */}
            <ReferenceLine
              y={goalAmount}
              stroke="hsl(var(--chart-accent))"
              strokeDasharray="8 4"
              strokeWidth={2.5}
              label={{
                value: "Goal",
                position: "right",
                fill: "hsl(var(--chart-accent))",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
