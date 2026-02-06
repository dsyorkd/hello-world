/**
 * Monte Carlo Simulation Engine and Financial Model Library.
 *
 * Pure computational functions with no external dependencies.
 * Uses Box-Muller transform for normally distributed random numbers.
 */

// Risk profile parameters: mean annual return and standard deviation
export const RISK_PROFILES = {
  conservative: { mean: 0.06, std: 0.08 },
  moderate:     { mean: 0.08, std: 0.12 },
  aggressive:   { mean: 0.10, std: 0.16 },
};

/**
 * Box-Muller transform: generates a pair of independent standard normal
 * random variables from two uniform random variables.
 * Returns a single standard normal value.
 */
export function boxMullerRandom() {
  let u1, u2;
  // Avoid log(0)
  do {
    u1 = Math.random();
  } while (u1 === 0);
  u2 = Math.random();

  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Generate a normally distributed random number with given mean and std dev.
 */
export function normalRandom(mean, std) {
  return mean + std * boxMullerRandom();
}

/**
 * Run a single Monte Carlo simulation path.
 *
 * @param {object} params
 * @param {number} params.currentAge
 * @param {number} params.retirementAge
 * @param {number} params.maxAge
 * @param {number} params.currentSavings
 * @param {number} params.monthlyContribution
 * @param {number} params.meanReturn - annual mean return (e.g. 0.08)
 * @param {number} params.stdDev - annual return std dev (e.g. 0.12)
 * @param {number} params.retirementMonthlySpending - monthly spending in retirement
 * @param {number} params.socialSecurityMonthly - monthly SS benefit
 * @param {function} [params.randomFn] - optional RNG for testing (defaults to normalRandom)
 * @returns {object} { balances: number[], ranOutAtAge: number|null }
 */
export function runSingleSimulation(params) {
  const {
    currentAge,
    retirementAge,
    maxAge,
    currentSavings,
    monthlyContribution,
    meanReturn,
    stdDev,
    retirementMonthlySpending,
    socialSecurityMonthly,
    randomFn,
  } = params;

  const rng = randomFn || normalRandom;
  const years = maxAge - currentAge;
  const balances = new Array(years + 1);
  let balance = currentSavings;
  balances[0] = balance;

  for (let i = 1; i <= years; i++) {
    const age = currentAge + i;

    if (age <= retirementAge) {
      // Accumulation phase: add annual contributions
      balance += monthlyContribution * 12;
      // Apply random annual return
      const annualReturn = rng(meanReturn, stdDev);
      balance *= (1 + annualReturn);
    } else {
      // Distribution phase: withdraw spending minus social security
      const annualWithdrawal = (retirementMonthlySpending - socialSecurityMonthly) * 12;
      balance -= annualWithdrawal;
      // Apply reduced returns in retirement (70% of accumulation)
      const annualReturn = rng(meanReturn * 0.7, stdDev * 0.7);
      balance *= (1 + annualReturn);
    }

    // Floor at zero -- can't have negative portfolio
    if (balance < 0) balance = 0;
    balances[i] = balance;
  }

  // Determine if funds ran out
  let ranOutAtAge = null;
  for (let i = 1; i <= years; i++) {
    if (balances[i] <= 0 && currentAge + i > retirementAge) {
      ranOutAtAge = currentAge + i;
      break;
    }
  }

  return { balances, ranOutAtAge };
}

/**
 * Run full Monte Carlo simulation with multiple paths.
 *
 * @param {object} params
 * @param {number} params.currentAge
 * @param {number} params.retirementAge
 * @param {number} params.maxAge - default 95
 * @param {number} params.currentSavings
 * @param {number} params.monthlyContribution
 * @param {string} params.riskTolerance - 'conservative'|'moderate'|'aggressive'
 * @param {number} params.retirementMonthlySpending
 * @param {number} params.socialSecurityMonthly
 * @param {number} params.simulationCount - default 1000
 * @param {function} [params.randomFn] - optional RNG for testing
 * @returns {object} MonteCarloResult
 */
export function runMonteCarlo(params) {
  const {
    currentAge,
    retirementAge,
    maxAge = 95,
    currentSavings,
    monthlyContribution,
    riskTolerance = 'moderate',
    retirementMonthlySpending = 0,
    socialSecurityMonthly = 0,
    simulationCount = 1000,
    randomFn,
  } = params;

  const profile = RISK_PROFILES[riskTolerance] || RISK_PROFILES.moderate;
  const years = maxAge - currentAge;
  const numYears = years + 1;

  // Collect all simulation balances: simulations x years
  const allBalances = [];
  let successCount = 0;

  for (let sim = 0; sim < simulationCount; sim++) {
    const result = runSingleSimulation({
      currentAge,
      retirementAge,
      maxAge,
      currentSavings,
      monthlyContribution,
      meanReturn: profile.mean,
      stdDev: profile.std,
      retirementMonthlySpending,
      socialSecurityMonthly,
      randomFn,
    });

    allBalances.push(result.balances);

    // Success = funds last to maxAge (balance > 0 at final year)
    if (result.ranOutAtAge === null) {
      successCount++;
    }
  }

  // Compute percentiles at each year
  const percentileKeys = [10, 25, 50, 75, 90];
  const percentilePaths = {};
  for (const p of percentileKeys) {
    percentilePaths[`p${p}`] = [];
  }

  for (let yearIdx = 0; yearIdx < numYears; yearIdx++) {
    // Collect all balances for this year index across simulations
    const yearBalances = allBalances.map(b => b[yearIdx]);
    yearBalances.sort((a, b) => a - b);

    const age = currentAge + yearIdx;
    const year = new Date().getFullYear() + yearIdx;

    for (const p of percentileKeys) {
      const idx = Math.floor((p / 100) * yearBalances.length);
      const clampedIdx = Math.min(idx, yearBalances.length - 1);
      percentilePaths[`p${p}`].push({
        age,
        year,
        value: Math.round(yearBalances[clampedIdx] * 100) / 100,
      });
    }
  }

  // Get retirement year index
  const retirementYearIdx = retirementAge - currentAge;

  // Get balances at retirement age across all simulations
  const retirementBalances = allBalances.map(b => b[Math.min(retirementYearIdx, numYears - 1)]);
  retirementBalances.sort((a, b) => a - b);

  const p10Idx = Math.floor(0.10 * retirementBalances.length);
  const p50Idx = Math.floor(0.50 * retirementBalances.length);
  const p90Idx = Math.floor(0.90 * retirementBalances.length);

  return {
    percentile_paths: percentilePaths,
    success_rate: Math.round((successCount / simulationCount) * 10000) / 100,
    median_at_retirement: Math.round(retirementBalances[Math.min(p50Idx, retirementBalances.length - 1)] * 100) / 100,
    worst_case_at_retirement: Math.round(retirementBalances[Math.min(p10Idx, retirementBalances.length - 1)] * 100) / 100,
    best_case_at_retirement: Math.round(retirementBalances[Math.min(p90Idx, retirementBalances.length - 1)] * 100) / 100,
    simulation_count: simulationCount,
  };
}

/**
 * Run a fixed return projection.
 *
 * @param {object} params
 * @param {number} params.currentAge
 * @param {number} params.retirementAge
 * @param {number} params.maxAge - default 95
 * @param {number} params.currentSavings
 * @param {number} params.monthlyContribution
 * @param {number} params.annualReturn - fixed annual return (e.g. 0.07)
 * @param {number} params.inflationRate - annual inflation (default 0.03)
 * @param {number} params.retirementMonthlySpending
 * @param {number} params.socialSecurityMonthly
 * @param {string} [params.riskTolerance] - used for default annual return if not provided
 * @returns {object} FixedReturnResult
 */
export function runFixedReturn(params) {
  const {
    currentAge,
    retirementAge,
    maxAge = 95,
    currentSavings,
    monthlyContribution,
    annualReturn: overrideReturn,
    inflationRate = 0.03,
    retirementMonthlySpending = 0,
    socialSecurityMonthly = 0,
    riskTolerance = 'moderate',
  } = params;

  // Use override return or risk-based default
  const annualReturn = overrideReturn !== undefined && overrideReturn !== null
    ? overrideReturn
    : RISK_PROFILES[riskTolerance]?.mean || RISK_PROFILES.moderate.mean;

  const realReturn = annualReturn - inflationRate;
  const years = maxAge - currentAge;
  const projection = [];
  let balance = currentSavings;
  let yearsFundsLast = years;
  let fundsRanOut = false;

  for (let i = 0; i <= years; i++) {
    const age = currentAge + i;
    const year = new Date().getFullYear() + i;

    projection.push({
      age,
      year,
      value: Math.round(balance * 100) / 100,
    });

    if (i < years) {
      if (age < retirementAge) {
        // Accumulation: contributions + growth
        balance += monthlyContribution * 12;
        balance *= (1 + realReturn);
      } else {
        // Distribution: withdrawals + reduced growth
        const annualWithdrawal = (retirementMonthlySpending - socialSecurityMonthly) * 12;
        balance -= annualWithdrawal;
        balance *= (1 + realReturn * 0.7);
      }

      if (balance < 0) {
        balance = 0;
        if (!fundsRanOut) {
          yearsFundsLast = i;
          fundsRanOut = true;
        }
      }
    }
  }

  const retirementIdx = Math.min(retirementAge - currentAge, projection.length - 1);
  const balanceAtRetirement = projection[retirementIdx].value;

  // Calculate monthly retirement income (simple: balance / years in retirement / 12)
  const yearsInRetirement = maxAge - retirementAge;
  const monthlyRetirementIncome = yearsInRetirement > 0
    ? Math.round((balanceAtRetirement / yearsInRetirement / 12) * 100) / 100
    : 0;

  // Meets goal if funds last through max age
  const meetsGoal = !fundsRanOut;

  return {
    projection,
    balance_at_retirement: balanceAtRetirement,
    years_funds_last: yearsFundsLast,
    monthly_retirement_income: monthlyRetirementIncome + socialSecurityMonthly,
    meets_goal: meetsGoal,
  };
}

/**
 * Run three-scenario projection (best, expected, worst).
 *
 * @param {object} params - same as fixedReturn but without annualReturn
 * @returns {object} ThreeScenarioResult
 */
export function runThreeScenario(params) {
  const {
    currentAge,
    retirementAge,
    maxAge = 95,
    currentSavings,
    monthlyContribution,
    retirementMonthlySpending = 0,
    socialSecurityMonthly = 0,
  } = params;

  const scenarios = {
    best_case: {
      annualReturn: RISK_PROFILES.aggressive.mean,
      label: 'best_case',
    },
    expected: {
      annualReturn: RISK_PROFILES.moderate.mean,
      label: 'expected',
    },
    worst_case: {
      annualReturn: RISK_PROFILES.conservative.mean,
      label: 'worst_case',
    },
  };

  const result = {};

  for (const [key, scenario] of Object.entries(scenarios)) {
    const fixedResult = runFixedReturn({
      currentAge,
      retirementAge,
      maxAge,
      currentSavings,
      monthlyContribution,
      annualReturn: scenario.annualReturn,
      inflationRate: 0.03,
      retirementMonthlySpending,
      socialSecurityMonthly,
    });

    result[key] = {
      annual_return: scenario.annualReturn,
      projection: fixedResult.projection,
      balance_at_retirement: fixedResult.balance_at_retirement,
      years_funds_last: fixedResult.years_funds_last,
      meets_goal: fixedResult.meets_goal,
    };
  }

  return result;
}
