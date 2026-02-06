import { useState, useMemo, useCallback, useEffect } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { ProjectionChart } from "@/components/ProjectionChart";
import { WhatIfControls } from "@/components/WhatIfControls";
import { GoalsProgress } from "@/components/GoalsProgress";
import { RetirementChatUI, ChatMessage } from "@/components/RetirementChatUI";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { format } from "date-fns";

// Generate mock Monte Carlo projection data (used as fallback when API unavailable)
const generateProjectionData = (
  startAge: number,
  retireAge: number,
  startBalance: number,
  monthlySavings: number,
  riskMultiplier: number
) => {
  const data = [];
  let balance = startBalance;

  for (let age = startAge; age <= 95; age++) {
    const yearsFromStart = age - startAge;
    const isRetired = age >= retireAge;

    const baseGrowth = isRetired ? 0.04 : 0.07;
    const volatility = riskMultiplier * (isRetired ? 0.08 : 0.15);

    const median = balance * Math.pow(1 + baseGrowth, yearsFromStart);
    const contribution = isRetired ? 0 : monthlySavings * 12 * yearsFromStart;

    const p50 = median + contribution;
    const p10 = p50 * (1 - volatility * 1.5 * Math.sqrt(yearsFromStart / 10));
    const p25 = p50 * (1 - volatility * 0.8 * Math.sqrt(yearsFromStart / 10));
    const p75 = p50 * (1 + volatility * 0.8 * Math.sqrt(yearsFromStart / 10));
    const p90 = p50 * (1 + volatility * 1.5 * Math.sqrt(yearsFromStart / 10));

    data.push({
      age,
      p10: Math.max(0, Math.round(p10)),
      p25: Math.max(0, Math.round(p25)),
      p50: Math.round(p50),
      p75: Math.round(p75),
      p90: Math.round(p90),
    });
  }

  return data;
};

export default function Index() {
  const { user } = useAuth();
  const [retireAge, setRetireAge] = useState(65);
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [initialInvestment, setInitialInvestment] = useState(125000);
  const [riskLevel, setRiskLevel] = useState("moderate");
  const [socialSecurity, setSocialSecurity] = useState(2000);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [apiProjectionData, setApiProjectionData] = useState<any[] | null>(null);
  const [apiSuccessRate, setApiSuccessRate] = useState<number | null>(null);
  const [goals, setGoals] = useState([
    { id: "1", label: "$5k/mo income", completed: true },
    { id: "2", label: "$100k legacy", completed: true },
    { id: "3", label: "Home at 45", completed: false },
  ]);

  const userName = user?.name || "User";
  const userAge = user?.age || 35;

  // Load financial profile on mount
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const profile = await api.getFinancialProfile(user.id);
        if (profile) {
          if (profile.current_savings) setInitialInvestment(profile.current_savings);
          if (profile.monthly_contribution) setMonthlySavings(profile.monthly_contribution);
          if (profile.social_security_monthly) setSocialSecurity(profile.social_security_monthly);
        }
        if (user.retirement_age) setRetireAge(user.retirement_age);
        if (user.risk_tolerance) setRiskLevel(user.risk_tolerance);
      } catch {
        // Profile not found, use defaults
      }
    };
    loadProfile();
  }, [user]);

  // Load goals on mount
  useEffect(() => {
    if (!user) return;
    const loadGoals = async () => {
      try {
        const result = await api.getGoals(user.id);
        if (result?.goals?.length > 0) {
          setGoals(
            result.goals.map((g: any) => ({
              id: g.id,
              label: g.description || g.goal_type,
              completed: false, // goals from API don't track "completed" the same way
            }))
          );
        }
      } catch {
        // Use defaults
      }
    };
    loadGoals();
  }, [user]);

  const riskMultiplier =
    riskLevel === "conservative" ? 0.7 : riskLevel === "aggressive" ? 1.3 : 1;

  const localProjectionData = useMemo(
    () =>
      generateProjectionData(userAge, retireAge, initialInvestment, monthlySavings, riskMultiplier),
    [userAge, retireAge, initialInvestment, monthlySavings, riskMultiplier]
  );

  const projectionData = apiProjectionData || localProjectionData;
  const medianAtRetirement = projectionData.find((d) => d.age === retireAge)?.p50 || 0;
  const successRate = apiSuccessRate ?? Math.min(95, Math.max(50, 78 + (monthlySavings - 1500) / 100));

  const handleSimulate = useCallback(async () => {
    if (!user) return;
    try {
      const result = await api.runMonteCarlo({
        user_id: user.id,
        simulation_count: 1000,
        max_age: 95,
        override_params: {
          retirement_age: retireAge,
          monthly_contribution: monthlySavings,
          risk_tolerance: riskLevel,
          current_savings: initialInvestment,
          social_security_monthly: socialSecurity,
        },
      });

      if (result.percentile_paths) {
        // Transform API data to chart format
        const p10 = result.percentile_paths.p10 || [];
        const p25 = result.percentile_paths.p25 || [];
        const p50 = result.percentile_paths.p50 || [];
        const p75 = result.percentile_paths.p75 || [];
        const p90 = result.percentile_paths.p90 || [];

        const chartData = p50.map((point: any, i: number) => ({
          age: point.age,
          p10: p10[i]?.value || 0,
          p25: p25[i]?.value || 0,
          p50: point.value || 0,
          p75: p75[i]?.value || 0,
          p90: p90[i]?.value || 0,
        }));
        setApiProjectionData(chartData);
      }

      if (result.success_rate != null) {
        setApiSuccessRate(result.success_rate);
      }
    } catch {
      // Fall back to local simulation
      console.warn("API simulation failed, using local projection");
    }
  }, [user, retireAge, monthlySavings, riskLevel, initialInvestment, socialSecurity]);

  // Chat handler - wired to real API
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setIsChatLoading(true);

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
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Apply extracted parameters to the what-if controls
        const params = response.extracted_parameters;
        if (params) {
          if (params.retirement_age) setRetireAge(params.retirement_age);
          if (params.monthly_contribution) setMonthlySavings(params.monthly_contribution);
          if (params.current_savings) setInitialInvestment(params.current_savings);
          if (params.risk_tolerance) setRiskLevel(params.risk_tolerance);
          if (params.social_security_monthly) setSocialSecurity(params.social_security_monthly);
        }
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I had trouble processing that. Please try again.",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [user, conversationId]
  );

  return (
    <div className="min-h-screen bg-background">
      <DisclaimerModal />
      <DisclaimerBanner />
      <Navigation userName={userName} />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {userName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="Portfolio"
            value={`$${initialInvestment.toLocaleString()}`}
            trend={{ value: "+12.5%", direction: "up" }}
          />
          <MetricCard
            label="Monthly Savings"
            value={`$${monthlySavings.toLocaleString()}`}
            subtitle="savings"
          />
          <MetricCard
            label="Projected"
            value={`$${(medianAtRetirement / 1000000).toFixed(1)}M`}
            subtitle="median"
          />
          <MetricCard
            label="Success Rate"
            value={`${Math.round(successRate)}%`}
            subtitle="probability"
          />
          <MetricCard
            label="Readiness Score"
            value="72/100"
            progress={72}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* AI Chat Section */}
        <div className="mb-6">
          <RetirementChatUI
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart - takes 2 columns */}
          <div className="lg:col-span-2">
            <ProjectionChart data={projectionData} goalAmount={1200000} />
          </div>

          {/* Controls - 1 column */}
          <div className="space-y-6">
            <WhatIfControls
              retireAge={retireAge}
              monthlySavings={monthlySavings}
              initialInvestment={initialInvestment}
              riskLevel={riskLevel}
              socialSecurity={socialSecurity}
              onRetireAgeChange={setRetireAge}
              onMonthlySavingsChange={setMonthlySavings}
              onInitialInvestmentChange={setInitialInvestment}
              onRiskLevelChange={setRiskLevel}
              onSocialSecurityChange={setSocialSecurity}
              onSimulate={handleSimulate}
            />
            <GoalsProgress goals={goals} />
          </div>
        </div>

        {/* Retirement Timeline */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Retirement in{" "}
            <span className="font-semibold text-foreground">
              {retireAge - userAge} years
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
