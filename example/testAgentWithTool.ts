import dotenv from "dotenv";
import { ReactAgentBuilder, createAgentTool } from "../core";

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;
const BRAVE_API_KEY = process.env.braveApiKey;

// ✅ Break-Even Point Calculator Tool
const breakEvenCalculatorTool = createAgentTool({
  name: "break-even-calculator",
  description: "Calculate the break-even point (units and revenue) for a business. Use this for determining when a business will start making a profit.",
  schema: {
    fixedCosts: { type: "number", description: "Total fixed costs (rent, salaries, utilities, etc.) in dollars" },
    variableCostPerUnit: { type: "number", description: "Variable cost per unit produced/sold in dollars" },
    sellingPricePerUnit: { type: "number", description: "Selling price per unit in dollars" },
    agentConfig: { type: "object", description: "Agent configuration (automatically provided)", optional: true }
  },
  async run({ fixedCosts, variableCostPerUnit, sellingPricePerUnit }) {
    const bepUnits = fixedCosts / (sellingPricePerUnit - variableCostPerUnit);
    const bepRevenue = bepUnits * sellingPricePerUnit;
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
    const marginRatio = (contributionMargin / sellingPricePerUnit) * 100;
    return {
      breakEvenUnits: Math.ceil(bepUnits),
      breakEvenRevenue: Math.round(bepRevenue),
      contributionMargin,
      marginRatio: marginRatio.toFixed(2) + '%',
      analysis: `Break-even at ${Math.ceil(bepUnits)} units or $${Math.round(bepRevenue)} revenue`,
      formula: `BEP = Fixed Costs / (Selling Price - Variable Cost) = $${fixedCosts} / ($${sellingPricePerUnit} - $${variableCostPerUnit})`
    };
  }
});

// ✅ Profit Target Calculator Tool
const profitTargetCalculatorTool = createAgentTool({
  name: "profit-target-calculator",
  description: "Calculate required sales volume (units and revenue) to achieve a specific profit target. Use this for sales planning and goal setting.",
  schema: {
    fixedCosts: { type: "number", description: "Total fixed costs in dollars" },
    variableCostPerUnit: { type: "number", description: "Variable cost per unit in dollars" },
    sellingPricePerUnit: { type: "number", description: "Selling price per unit in dollars" },
    targetProfit: { type: "number", description: "Desired profit target in dollars" },
    agentConfig: { type: "object", description: "Agent configuration (automatically provided)", optional: true }
  },
  async run({ fixedCosts, variableCostPerUnit, sellingPricePerUnit, targetProfit }) {
    const requiredUnits = (fixedCosts + targetProfit) / (sellingPricePerUnit - variableCostPerUnit);
    const requiredRevenue = requiredUnits * sellingPricePerUnit;
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
    return {
      targetProfit,
      requiredUnits: Math.ceil(requiredUnits),
      requiredRevenue: Math.round(requiredRevenue),
      contributionMargin,
      analysis: `Need ${Math.ceil(requiredUnits)} units or $${Math.round(requiredRevenue)} revenue to achieve $${targetProfit} profit`,
      formula: `Required Units = (Fixed Costs + Target Profit) / (Selling Price - Variable Cost) = ($${fixedCosts} + $${targetProfit}) / ($${sellingPricePerUnit} - $${variableCostPerUnit})`
    };
  }
});

// ✅ Pricing Sensitivity Analysis Tool
const pricingSensitivityTool = createAgentTool({
  name: "pricing-sensitivity-analyzer",
  description: "Analyze how different pricing levels (low, medium, high) affect break-even points and profitability. Use this for pricing strategy and market analysis.",
  schema: {
    fixedCosts: { type: "number", description: "Total fixed costs in dollars" },
    variableCostPerUnit: { type: "number", description: "Variable cost per unit in dollars" },
    lowPrice: { type: "number", description: "Low price strategy - competitive pricing in dollars" },
    mediumPrice: { type: "number", description: "Medium price strategy - balanced pricing in dollars" },
    highPrice: { type: "number", description: "High price strategy - premium pricing in dollars" },
    agentConfig: { type: "object", description: "Agent configuration (automatically provided)", optional: true }
  },
  async run({ fixedCosts, variableCostPerUnit, lowPrice, mediumPrice, highPrice }) {
    const scenarios = [
      { name: "Low Price Strategy", sellingPrice: lowPrice, impact: "Competitive pricing, higher volume needed" },
      { name: "Medium Price Strategy", sellingPrice: mediumPrice, impact: "Balanced approach, moderate volume" },
      { name: "High Price Strategy", sellingPrice: highPrice, impact: "Premium pricing, lower volume needed" }
    ];
    const results = scenarios.map((scenario) => {
      const bep = fixedCosts / (scenario.sellingPrice - variableCostPerUnit);
      const bepRevenue = bep * scenario.sellingPrice;
      const contributionMargin = scenario.sellingPrice - variableCostPerUnit;
      const marginRatio = (contributionMargin / scenario.sellingPrice) * 100;
      return {
        scenario: scenario.name,
        sellingPrice: scenario.sellingPrice,
        breakEvenUnits: Math.ceil(bep),
        breakEvenRevenue: Math.round(bepRevenue),
        contributionMargin,
        marginRatio: marginRatio.toFixed(2) + '%',
        impact: scenario.impact
      };
    });
    return {
      sensitivityAnalysis: results,
      summary: `Analyzed 3 pricing scenarios (low: $${lowPrice}, medium: $${mediumPrice}, high: $${highPrice}) for break-even variations`,
      baseData: {
        fixedCosts,
        variableCostPerUnit
      },
      recommendations: {
        lowestBreakEven: results.reduce((min, curr) => curr.breakEvenUnits < min.breakEvenUnits ? curr : min),
        highestMargin: results.reduce((max, curr) => parseFloat(curr.marginRatio) > parseFloat(max.marginRatio) ? curr : max)
      }
    };
  }
});

// ✅ Cost Structure Analysis Tool
const costStructureAnalyzerTool = createAgentTool({
  name: "cost-structure-analyzer",
  description: "Analyze cost structure, profitability, and provide recommendations. Use this for financial health assessment and optimization planning.",
  schema: {
    fixedCosts: { type: "number", description: "Total fixed costs in dollars" },
    variableCosts: { type: "number", description: "Total variable costs in dollars" },
    totalRevenue: { type: "number", description: "Total revenue in dollars" },
    unitsSold: { type: "number", description: "Total number of units sold" },
    agentConfig: { type: "object", description: "Agent configuration (automatically provided)", optional: true }
  },
  async run({ fixedCosts, variableCosts, totalRevenue, unitsSold }) {
    const totalCosts = fixedCosts + variableCosts;
    const profit = totalRevenue - totalCosts;
    const variableCostPerUnit = variableCosts / unitsSold;
    const averagePrice = totalRevenue / unitsSold;
    const costBreakdown = {
      fixedCostPercentage: ((fixedCosts / totalCosts) * 100).toFixed(2) + '%',
      variableCostPercentage: ((variableCosts / totalCosts) * 100).toFixed(2) + '%',
      profitMargin: ((profit / totalRevenue) * 100).toFixed(2) + '%',
      contributionMargin: ((totalRevenue - variableCosts) / totalRevenue * 100).toFixed(2) + '%'
    };
    return {
      costBreakdown,
      totalCosts,
      profit,
      variableCostPerUnit,
      averagePrice,
      analysis: `Fixed costs: ${costBreakdown.fixedCostPercentage}, Variable costs: ${costBreakdown.variableCostPercentage}, Profit margin: ${costBreakdown.profitMargin}`,
      recommendations: profit > 0 ?
        "Business is profitable. Consider scaling opportunities." :
        "Business is not profitable. Review pricing strategy and cost structure."
    };
  }
});

async function testFinanceUseCase(useCase: string, objective: string, outputInstruction: string) {
  try {
    console.log(`\n💰 Testing Finance Use Case: ${useCase}`);
    console.log(`📋 Objective: ${objective}`);
    

    const agentBuilder = new ReactAgentBuilder({
      openaiKey: OPENAI_KEY,
      heliconeKey: process.env.HELICONE_KEY,
      memory: "in-memory",
      sessionId: `finance-${useCase.toLowerCase().replace(/\s+/g, '-')}`,
      braveApiKey: BRAVE_API_KEY
    })
    .addTool([
      breakEvenCalculatorTool,
      profitTargetCalculatorTool,
      pricingSensitivityTool,
      costStructureAnalyzerTool
    ]); // ✅ Pass as array of specific tools
    
    agentBuilder.on("taskBreakdown", (payload) => {
      console.log(`${payload.agent}:`, payload.data);
    });
    agentBuilder.on("taskReplan", (payload) => {
      console.log(`${payload.agent}:`, payload.data);
    });
    
    const financeAgent = agentBuilder.init({
      selectedProvider: 'openai',
      model: 'gpt-4.1-mini',
    }).build();

    const result = await financeAgent.invoke({
      objective,
      outputInstruction
    }, {
      configurable: {
        observability: {
          enabled: false,
        }
     }});

    console.log(`✅ ${useCase} - Result:`, result.conclusion.substring(0, 500) + "...");
    return result;
  } catch (error) {
    console.error(`❌ ${useCase} - Error:`, error);
    return null;
  }
}

async function runFinanceUseCases() {
  const financeUseCases = [
    {
      name: "Startup Break-Even Analysis",
      objective: "A tech startup needs financial guidance for their new SaaS product. They have $50,000 in fixed costs, $20 variable cost per unit, and are considering a $100 selling price. Help them understand their financial position and explore pricing strategies to maximize profitability.",
      outputInstruction: "Provide comprehensive financial insights and strategic recommendations to help the startup make informed business decisions."
    },
    // {
    //   name: "Profit Target Planning",
    //   objective: "A manufacturing company wants to set realistic sales targets for the upcoming year. They have $100,000 fixed costs, $50 variable cost per unit, and $150 selling price. Help them understand what sales volumes are needed to achieve different profit goals and assess the feasibility of their targets.",
    //   outputInstruction: "Create actionable insights and strategic recommendations for achieving their profit objectives."
    // },
    // {
    //   name: "Cost Structure Optimization",
    //   objective: "A retail business is struggling with profitability despite $200,000 in revenue. They have $75,000 fixed costs, $30,000 variable costs, and sold 1,000 units. Help them identify optimization opportunities and develop strategies to improve their financial performance.",
    //   outputInstruction: "Provide detailed analysis and practical recommendations to enhance profitability and operational efficiency."
    // }
  ];

  console.log("💰 Starting finance use case testing...");
  
  for (const useCase of financeUseCases) {
    await testFinanceUseCase(useCase.name, useCase.objective, useCase.outputInstruction);
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log("\n🎉 All finance use cases completed!");
}

// Run finance use cases
runFinanceUseCases();