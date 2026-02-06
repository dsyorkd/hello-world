/**
 * Unit tests for the Monte Carlo simulation engine and all financial models.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  RISK_PROFILES,
  boxMullerRandom,
  normalRandom,
  runSingleSimulation,
  runMonteCarlo,
  runFixedReturn,
  runThreeScenario,
} from '../../functions/lib/simulation.js';

// ─── Risk Profiles ───────────────────────────────────────────────────────────

describe('RISK_PROFILES', () => {
  it('should define conservative, moderate, and aggressive profiles', () => {
    expect(RISK_PROFILES).toHaveProperty('conservative');
    expect(RISK_PROFILES).toHaveProperty('moderate');
    expect(RISK_PROFILES).toHaveProperty('aggressive');
  });

  it('conservative should have lower mean and std than moderate', () => {
    expect(RISK_PROFILES.conservative.mean).toBeLessThan(RISK_PROFILES.moderate.mean);
    expect(RISK_PROFILES.conservative.std).toBeLessThan(RISK_PROFILES.moderate.std);
  });

  it('moderate should have lower mean and std than aggressive', () => {
    expect(RISK_PROFILES.moderate.mean).toBeLessThan(RISK_PROFILES.aggressive.mean);
    expect(RISK_PROFILES.moderate.std).toBeLessThan(RISK_PROFILES.aggressive.std);
  });

  it('should have the correct specific values', () => {
    expect(RISK_PROFILES.conservative).toEqual({ mean: 0.06, std: 0.08 });
    expect(RISK_PROFILES.moderate).toEqual({ mean: 0.08, std: 0.12 });
    expect(RISK_PROFILES.aggressive).toEqual({ mean: 0.10, std: 0.16 });
  });
});

// ─── Box-Muller Random ──────────────────────────────────────────────────────

describe('boxMullerRandom', () => {
  it('should return a number', () => {
    const val = boxMullerRandom();
    expect(typeof val).toBe('number');
    expect(isNaN(val)).toBe(false);
  });

  it('should produce values roughly following standard normal distribution', () => {
    const N = 10000;
    const values = [];
    for (let i = 0; i < N; i++) {
      values.push(boxMullerRandom());
    }

    const mean = values.reduce((a, b) => a + b, 0) / N;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / N;

    // Mean should be close to 0 (within 0.1 for 10k samples)
    expect(Math.abs(mean)).toBeLessThan(0.1);
    // Variance should be close to 1 (within 0.2 for 10k samples)
    expect(Math.abs(variance - 1)).toBeLessThan(0.2);
  });

  it('should never return NaN or Infinity', () => {
    for (let i = 0; i < 1000; i++) {
      const val = boxMullerRandom();
      expect(isFinite(val)).toBe(true);
    }
  });
});

// ─── Normal Random ──────────────────────────────────────────────────────────

describe('normalRandom', () => {
  it('should shift the distribution by mean', () => {
    const N = 10000;
    const mean = 5;
    const std = 1;
    const values = [];
    for (let i = 0; i < N; i++) {
      values.push(normalRandom(mean, std));
    }

    const actualMean = values.reduce((a, b) => a + b, 0) / N;
    expect(Math.abs(actualMean - mean)).toBeLessThan(0.15);
  });

  it('should scale the distribution by std', () => {
    const N = 10000;
    const mean = 0;
    const std = 3;
    const values = [];
    for (let i = 0; i < N; i++) {
      values.push(normalRandom(mean, std));
    }

    const actualMean = values.reduce((a, b) => a + b, 0) / N;
    const actualVariance = values.reduce((a, b) => a + (b - actualMean) ** 2, 0) / N;
    const actualStd = Math.sqrt(actualVariance);

    expect(Math.abs(actualStd - std)).toBeLessThan(0.3);
  });

  it('should return the mean when std is 0', () => {
    const val = normalRandom(5, 0);
    expect(val).toBe(5);
  });
});

// ─── Single Simulation ─────────────────────────────────────────────────────

describe('runSingleSimulation', () => {
  // Deterministic random function for testing
  const fixedReturn = (mean, _std) => mean;

  it('should return balances array with correct length', () => {
    const result = runSingleSimulation({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      meanReturn: 0.08,
      stdDev: 0.12,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 2000,
      randomFn: fixedReturn,
    });

    // maxAge - currentAge + 1 entries (age 30 through 95)
    expect(result.balances.length).toBe(66);
  });

  it('should start with currentSavings at index 0', () => {
    const result = runSingleSimulation({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 50000,
      monthlyContribution: 500,
      meanReturn: 0.08,
      stdDev: 0.12,
      retirementMonthlySpending: 3000,
      socialSecurityMonthly: 1500,
      randomFn: fixedReturn,
    });

    expect(result.balances[0]).toBe(50000);
  });

  it('should grow during accumulation phase with positive returns', () => {
    const result = runSingleSimulation({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      meanReturn: 0.08,
      stdDev: 0,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 2000,
      randomFn: fixedReturn,
    });

    // Balance at age 31 should be > starting balance
    expect(result.balances[1]).toBeGreaterThan(100000);
    // Balance at retirement should be much greater
    const retirementIdx = 65 - 30; // index 35
    expect(result.balances[retirementIdx]).toBeGreaterThan(result.balances[0]);
  });

  it('should decrease during distribution phase when withdrawals exceed returns', () => {
    const result = runSingleSimulation({
      currentAge: 60,
      retirementAge: 62,
      maxAge: 70,
      currentSavings: 100000,
      monthlyContribution: 1000,
      meanReturn: 0.02,
      stdDev: 0,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 0,
      randomFn: fixedReturn,
    });

    // After retirement, balance should decrease due to large withdrawals
    const retirementIdx = 62 - 60; // index 2
    // Post-retirement balance should decrease
    expect(result.balances[retirementIdx + 1]).toBeLessThan(result.balances[retirementIdx]);
  });

  it('should floor balance at zero', () => {
    const result = runSingleSimulation({
      currentAge: 60,
      retirementAge: 62,
      maxAge: 80,
      currentSavings: 10000,
      monthlyContribution: 0,
      meanReturn: 0.01,
      stdDev: 0,
      retirementMonthlySpending: 10000,
      socialSecurityMonthly: 0,
      randomFn: fixedReturn,
    });

    // All balances should be >= 0
    for (const b of result.balances) {
      expect(b).toBeGreaterThanOrEqual(0);
    }
  });

  it('should report ranOutAtAge when funds are depleted', () => {
    const result = runSingleSimulation({
      currentAge: 60,
      retirementAge: 62,
      maxAge: 90,
      currentSavings: 10000,
      monthlyContribution: 0,
      meanReturn: 0.01,
      stdDev: 0,
      retirementMonthlySpending: 10000,
      socialSecurityMonthly: 0,
      randomFn: fixedReturn,
    });

    expect(result.ranOutAtAge).not.toBeNull();
    expect(result.ranOutAtAge).toBeGreaterThan(62);
    expect(result.ranOutAtAge).toBeLessThanOrEqual(90);
  });

  it('should return null ranOutAtAge when funds last to maxAge', () => {
    const result = runSingleSimulation({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 1000000,
      monthlyContribution: 2000,
      meanReturn: 0.08,
      stdDev: 0,
      retirementMonthlySpending: 3000,
      socialSecurityMonthly: 2000,
      randomFn: fixedReturn,
    });

    expect(result.ranOutAtAge).toBeNull();
  });

  it('should apply reduced returns in retirement (70% of accumulation)', () => {
    // Track the returns that were requested
    const returnCalls = [];
    const trackingFn = (mean, std) => {
      returnCalls.push({ mean, std });
      return mean;
    };

    runSingleSimulation({
      currentAge: 63,
      retirementAge: 65,
      maxAge: 68,
      currentSavings: 500000,
      monthlyContribution: 1000,
      meanReturn: 0.10,
      stdDev: 0.16,
      retirementMonthlySpending: 3000,
      socialSecurityMonthly: 1500,
      randomFn: trackingFn,
    });

    // Years: 64 (accum), 65 (accum boundary), 66 (distrib), 67, 68
    // Accumulation calls (age 64, 65): mean=0.10, std=0.16
    // Distribution calls (age 66, 67, 68): mean=0.07, std=0.112
    const accumCalls = returnCalls.filter(c => Math.abs(c.mean - 0.10) < 0.001);
    const distribCalls = returnCalls.filter(c => Math.abs(c.mean - 0.07) < 0.001);

    expect(accumCalls.length).toBeGreaterThan(0);
    expect(distribCalls.length).toBeGreaterThan(0);

    for (const c of distribCalls) {
      expect(c.std).toBeCloseTo(0.16 * 0.7, 5);
    }
  });

  it('should account for social security reducing withdrawals', () => {
    const withSS = runSingleSimulation({
      currentAge: 64,
      retirementAge: 65,
      maxAge: 75,
      currentSavings: 500000,
      monthlyContribution: 0,
      meanReturn: 0.05,
      stdDev: 0,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 2000,
      randomFn: fixedReturn,
    });

    const withoutSS = runSingleSimulation({
      currentAge: 64,
      retirementAge: 65,
      maxAge: 75,
      currentSavings: 500000,
      monthlyContribution: 0,
      meanReturn: 0.05,
      stdDev: 0,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 0,
      randomFn: fixedReturn,
    });

    // With SS, balance should be higher at any post-retirement year
    for (let i = 2; i < withSS.balances.length; i++) {
      expect(withSS.balances[i]).toBeGreaterThanOrEqual(withoutSS.balances[i]);
    }
  });
});

// ─── Monte Carlo (Full) ────────────────────────────────────────────────────

describe('runMonteCarlo', () => {
  it('should return all required output fields', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    expect(result).toHaveProperty('percentile_paths');
    expect(result).toHaveProperty('success_rate');
    expect(result).toHaveProperty('median_at_retirement');
    expect(result).toHaveProperty('worst_case_at_retirement');
    expect(result).toHaveProperty('best_case_at_retirement');
    expect(result).toHaveProperty('simulation_count');
  });

  it('should include p10, p25, p50, p75, p90 percentile paths', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    expect(result.percentile_paths).toHaveProperty('p10');
    expect(result.percentile_paths).toHaveProperty('p25');
    expect(result.percentile_paths).toHaveProperty('p50');
    expect(result.percentile_paths).toHaveProperty('p75');
    expect(result.percentile_paths).toHaveProperty('p90');
  });

  it('should have percentile paths with correct length', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    const expectedLength = 95 - 30 + 1; // 66
    expect(result.percentile_paths.p50.length).toBe(expectedLength);
  });

  it('each percentile point should have age, year, and value', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    const point = result.percentile_paths.p50[0];
    expect(point).toHaveProperty('age');
    expect(point).toHaveProperty('year');
    expect(point).toHaveProperty('value');
    expect(point.age).toBe(30);
    expect(typeof point.value).toBe('number');
  });

  it('p10 <= p25 <= p50 <= p75 <= p90 at each year', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 500,
    });

    for (let i = 0; i < result.percentile_paths.p50.length; i++) {
      expect(result.percentile_paths.p10[i].value).toBeLessThanOrEqual(result.percentile_paths.p25[i].value);
      expect(result.percentile_paths.p25[i].value).toBeLessThanOrEqual(result.percentile_paths.p50[i].value);
      expect(result.percentile_paths.p50[i].value).toBeLessThanOrEqual(result.percentile_paths.p75[i].value);
      expect(result.percentile_paths.p75[i].value).toBeLessThanOrEqual(result.percentile_paths.p90[i].value);
    }
  });

  it('success_rate should be between 0 and 100', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    expect(result.success_rate).toBeGreaterThanOrEqual(0);
    expect(result.success_rate).toBeLessThanOrEqual(100);
  });

  it('should have 100% success rate with very large savings and small withdrawals', () => {
    const result = runMonteCarlo({
      currentAge: 60,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 10000000,
      monthlyContribution: 5000,
      riskTolerance: 'conservative',
      retirementMonthlySpending: 1000,
      socialSecurityMonthly: 2000,
      simulationCount: 200,
    });

    expect(result.success_rate).toBe(100);
  });

  it('should have low success rate with tiny savings and huge withdrawals', () => {
    const result = runMonteCarlo({
      currentAge: 60,
      retirementAge: 62,
      maxAge: 95,
      currentSavings: 1000,
      monthlyContribution: 0,
      riskTolerance: 'aggressive',
      retirementMonthlySpending: 10000,
      socialSecurityMonthly: 0,
      simulationCount: 200,
    });

    expect(result.success_rate).toBeLessThan(10);
  });

  it('should respect simulation_count', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 250,
    });

    expect(result.simulation_count).toBe(250);
  });

  it('should use the correct risk profile', () => {
    // With deterministic RNG, conservative should produce lower returns
    const deterministicFn = (mean, _std) => mean;

    const conservativeResult = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'conservative',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 10,
      randomFn: deterministicFn,
    });

    const aggressiveResult = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'aggressive',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 10,
      randomFn: deterministicFn,
    });

    // With deterministic returns, aggressive should always beat conservative
    expect(aggressiveResult.median_at_retirement).toBeGreaterThan(conservativeResult.median_at_retirement);
  });

  it('worst_case <= median <= best_case at retirement', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 500,
    });

    expect(result.worst_case_at_retirement).toBeLessThanOrEqual(result.median_at_retirement);
    expect(result.median_at_retirement).toBeLessThanOrEqual(result.best_case_at_retirement);
  });

  it('should default to moderate risk tolerance for unknown values', () => {
    const deterministicFn = (mean, _std) => mean;

    const moderateResult = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 10,
      randomFn: deterministicFn,
    });

    const unknownResult = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'unknown_value',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 10,
      randomFn: deterministicFn,
    });

    expect(unknownResult.median_at_retirement).toBe(moderateResult.median_at_retirement);
  });

  it('should handle zero monthly contribution', () => {
    const result = runMonteCarlo({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 500000,
      monthlyContribution: 0,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    expect(result).toHaveProperty('percentile_paths');
    expect(result.simulation_count).toBe(100);
  });

  it('should handle zero current savings', () => {
    const result = runMonteCarlo({
      currentAge: 25,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 0,
      monthlyContribution: 2000,
      riskTolerance: 'moderate',
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
      simulationCount: 100,
    });

    expect(result.percentile_paths.p50[0].value).toBe(0);
    // Should still accumulate over time
    expect(result.median_at_retirement).toBeGreaterThan(0);
  });
});

// ─── Fixed Return ───────────────────────────────────────────────────────────

describe('runFixedReturn', () => {
  it('should return all required fields', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      annualReturn: 0.07,
      inflationRate: 0.03,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    expect(result).toHaveProperty('projection');
    expect(result).toHaveProperty('balance_at_retirement');
    expect(result).toHaveProperty('years_funds_last');
    expect(result).toHaveProperty('monthly_retirement_income');
    expect(result).toHaveProperty('meets_goal');
  });

  it('projection should start at currentSavings', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 50000,
      monthlyContribution: 500,
      annualReturn: 0.07,
      inflationRate: 0.03,
      retirementMonthlySpending: 3000,
      socialSecurityMonthly: 1500,
    });

    expect(result.projection[0].value).toBe(50000);
    expect(result.projection[0].age).toBe(30);
  });

  it('projection should have correct length', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      annualReturn: 0.07,
      inflationRate: 0.03,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    expect(result.projection.length).toBe(66); // 95 - 30 + 1
  });

  it('balance should grow during accumulation with positive real return', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      annualReturn: 0.07,
      inflationRate: 0.02,
      retirementMonthlySpending: 3000,
      socialSecurityMonthly: 1500,
    });

    expect(result.projection[1].value).toBeGreaterThan(result.projection[0].value);
    expect(result.balance_at_retirement).toBeGreaterThan(100000);
  });

  it('should use risk tolerance default return when annual_return not provided', () => {
    const withExplicit = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 100000,
      monthlyContribution: 1000,
      annualReturn: 0.08, // same as moderate mean
      inflationRate: 0.03,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    const withRisk = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 100000,
      monthlyContribution: 1000,
      riskTolerance: 'moderate',
      inflationRate: 0.03,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    expect(withExplicit.balance_at_retirement).toBe(withRisk.balance_at_retirement);
  });

  it('meets_goal should be true when funds last to max age', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 1000000,
      monthlyContribution: 2000,
      annualReturn: 0.07,
      inflationRate: 0.03,
      retirementMonthlySpending: 3000,
      socialSecurityMonthly: 2000,
    });

    expect(result.meets_goal).toBe(true);
  });

  it('meets_goal should be false when funds run out early', () => {
    const result = runFixedReturn({
      currentAge: 60,
      retirementAge: 62,
      maxAge: 95,
      currentSavings: 10000,
      monthlyContribution: 0,
      annualReturn: 0.03,
      inflationRate: 0.03,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 0,
    });

    expect(result.meets_goal).toBe(false);
  });

  it('should never have negative balances in projection', () => {
    const result = runFixedReturn({
      currentAge: 60,
      retirementAge: 62,
      maxAge: 95,
      currentSavings: 5000,
      monthlyContribution: 0,
      annualReturn: 0.02,
      inflationRate: 0.03,
      retirementMonthlySpending: 5000,
      socialSecurityMonthly: 0,
    });

    for (const point of result.projection) {
      expect(point.value).toBeGreaterThanOrEqual(0);
    }
  });

  it('monthly_retirement_income should include social security', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      annualReturn: 0.07,
      inflationRate: 0.03,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 2000,
    });

    expect(result.monthly_retirement_income).toBeGreaterThanOrEqual(2000);
  });

  it('should handle inflation exceeding returns (negative real return)', () => {
    const result = runFixedReturn({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      annualReturn: 0.02,
      inflationRate: 0.04,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    // Should still return valid result
    expect(result).toHaveProperty('projection');
    expect(result.projection.length).toBeGreaterThan(0);
  });
});

// ─── Three Scenario ─────────────────────────────────────────────────────────

describe('runThreeScenario', () => {
  it('should return best_case, expected, and worst_case', () => {
    const result = runThreeScenario({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    expect(result).toHaveProperty('best_case');
    expect(result).toHaveProperty('expected');
    expect(result).toHaveProperty('worst_case');
  });

  it('each scenario should have required fields', () => {
    const result = runThreeScenario({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    for (const key of ['best_case', 'expected', 'worst_case']) {
      expect(result[key]).toHaveProperty('annual_return');
      expect(result[key]).toHaveProperty('projection');
      expect(result[key]).toHaveProperty('balance_at_retirement');
      expect(result[key]).toHaveProperty('years_funds_last');
      expect(result[key]).toHaveProperty('meets_goal');
    }
  });

  it('best_case should use aggressive return, worst_case should use conservative', () => {
    const result = runThreeScenario({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    expect(result.best_case.annual_return).toBe(RISK_PROFILES.aggressive.mean);
    expect(result.expected.annual_return).toBe(RISK_PROFILES.moderate.mean);
    expect(result.worst_case.annual_return).toBe(RISK_PROFILES.conservative.mean);
  });

  it('best_case balance >= expected balance >= worst_case balance at retirement', () => {
    const result = runThreeScenario({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    expect(result.best_case.balance_at_retirement).toBeGreaterThanOrEqual(
      result.expected.balance_at_retirement
    );
    expect(result.expected.balance_at_retirement).toBeGreaterThanOrEqual(
      result.worst_case.balance_at_retirement
    );
  });

  it('projections should have correct length', () => {
    const result = runThreeScenario({
      currentAge: 40,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
      retirementMonthlySpending: 4000,
      socialSecurityMonthly: 1500,
    });

    const expectedLen = 95 - 40 + 1; // 56
    expect(result.best_case.projection.length).toBe(expectedLen);
    expect(result.expected.projection.length).toBe(expectedLen);
    expect(result.worst_case.projection.length).toBe(expectedLen);
  });

  it('should handle default retirement spending of 0', () => {
    const result = runThreeScenario({
      currentAge: 30,
      retirementAge: 65,
      maxAge: 95,
      currentSavings: 100000,
      monthlyContribution: 1000,
    });

    expect(result).toHaveProperty('best_case');
    // With 0 spending and 0 SS, balance should only grow
    expect(result.best_case.balance_at_retirement).toBeGreaterThan(100000);
  });
});
