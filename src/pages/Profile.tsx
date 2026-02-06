import { useState, useEffect } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Calendar, DollarSign, Target, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(35);
  const [retireAge, setRetireAge] = useState(65);
  const [annualIncome, setAnnualIncome] = useState(95000);
  const [currentSavings, setCurrentSavings] = useState(125000);
  const [monthlyContribution, setMonthlyContribution] = useState(1500);
  const [socialSecurity, setSocialSecurity] = useState(2000);
  const [isSaving, setIsSaving] = useState(false);

  const userName = user?.name || "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Load user data and financial profile
  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    if (user.age) setAge(user.age);
    if (user.retirement_age) setRetireAge(user.retirement_age);

    const loadProfile = async () => {
      try {
        const profile = await api.getFinancialProfile(user.id);
        if (profile) {
          if (profile.annual_income) setAnnualIncome(profile.annual_income);
          if (profile.current_savings) setCurrentSavings(profile.current_savings);
          if (profile.monthly_contribution) setMonthlyContribution(profile.monthly_contribution);
          if (profile.social_security_monthly) setSocialSecurity(profile.social_security_monthly);
        }
      } catch {
        // No profile yet, use defaults
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Update user profile
      await api.updateUser(user.id, {
        name,
        age,
        retirement_age: retireAge,
      });

      // Update financial profile
      try {
        await api.updateFinancialProfile(user.id, {
          annual_income: annualIncome,
          current_savings: currentSavings,
          monthly_contribution: monthlyContribution,
          social_security_monthly: socialSecurity,
        });
      } catch {
        // Profile may not exist yet, try creating it
        await api.createFinancialProfile({
          user_id: user.id,
          annual_income: annualIncome,
          current_savings: currentSavings,
          monthly_contribution: monthlyContribution,
          social_security_monthly: socialSecurity,
        });
      }

      await refreshUser();
      toast("Profile saved successfully");
    } catch {
      toast("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DisclaimerBanner />
      <Navigation userName={userName} />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your financial planning information
          </p>
        </div>

        {/* Profile Header */}
        <Card className="p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{userName}</h2>
              <p className="text-sm text-muted-foreground">
                Member since {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}
              </p>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card
          className="p-6 mb-6 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Current Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retire-age">Target Retirement Age</Label>
              <Input
                id="retire-age"
                type="number"
                value={retireAge}
                onChange={(e) => setRetireAge(Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        {/* Financial Overview */}
        <Card
          className="p-6 mb-6 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Overview
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="income">Annual Income</Label>
              <Input
                id="income"
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings">Current Savings</Label>
              <Input
                id="savings"
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly Contribution</Label>
              <Input
                id="monthly"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ss">Expected Social Security</Label>
              <Input
                id="ss"
                type="number"
                value={socialSecurity}
                onChange={(e) => setSocialSecurity(Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div
          className="flex gap-3 justify-end animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button variant="cta" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}
