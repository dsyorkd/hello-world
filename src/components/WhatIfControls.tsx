import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play } from "lucide-react";

interface WhatIfControlsProps {
  retireAge: number;
  monthlySavings: number;
  initialInvestment: number;
  riskLevel: string;
  socialSecurity: number;
  onRetireAgeChange: (value: number) => void;
  onMonthlySavingsChange: (value: number) => void;
  onInitialInvestmentChange: (value: number) => void;
  onRiskLevelChange: (value: string) => void;
  onSocialSecurityChange: (value: number) => void;
  onSimulate: () => void;
}

export function WhatIfControls({
  retireAge,
  monthlySavings,
  initialInvestment,
  riskLevel,
  socialSecurity,
  onRetireAgeChange,
  onMonthlySavingsChange,
  onInitialInvestmentChange,
  onRiskLevelChange,
  onSocialSecurityChange,
  onSimulate,
}: WhatIfControlsProps) {
  return (
    <div className="control-panel animate-fade-in">
      <h3 className="text-base font-semibold text-foreground mb-4">
        What-If Controls
      </h3>
      <div className="space-y-5">
        {/* Retirement Age */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Retire at</Label>
            <span className="text-sm font-mono font-semibold text-foreground">
              {retireAge}
            </span>
          </div>
          <Slider
            value={[retireAge]}
            onValueChange={([value]) => onRetireAgeChange(value)}
            min={35}
            max={75}
            step={1}
            className="w-full"
          />
        </div>

        {/* Initial Investment / Current Lump Sum */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Current Portfolio</Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={initialInvestment}
                onChange={(e) => onInitialInvestmentChange(Number(e.target.value))}
                className="w-24 h-7 text-right font-mono text-sm"
              />
            </div>
          </div>
          <Slider
            value={[initialInvestment]}
            onValueChange={([value]) => onInitialInvestmentChange(value)}
            min={0}
            max={1000000}
            step={5000}
            className="w-full"
          />
        </div>

        {/* Monthly Savings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Save/mo</Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={monthlySavings}
                onChange={(e) => onMonthlySavingsChange(Number(e.target.value))}
                className="w-20 h-7 text-right font-mono text-sm"
              />
            </div>
          </div>
          <Slider
            value={[monthlySavings]}
            onValueChange={([value]) => onMonthlySavingsChange(value)}
            min={0}
            max={5000}
            step={100}
            className="w-full"
          />
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Risk</Label>
          <Select value={riskLevel} onValueChange={onRiskLevelChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Social Security */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">SS/mo</Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={socialSecurity}
                onChange={(e) => onSocialSecurityChange(Number(e.target.value))}
                className="w-20 h-7 text-right font-mono text-sm"
              />
            </div>
          </div>
          <Slider
            value={[socialSecurity]}
            onValueChange={([value]) => onSocialSecurityChange(value)}
            min={0}
            max={4000}
            step={100}
            className="w-full"
          />
        </div>

        <Button
          variant="cta"
          className="w-full mt-2"
          onClick={onSimulate}
        >
          <Play className="h-4 w-4" />
          Run Simulation
        </Button>
      </div>
    </div>
  );
}
