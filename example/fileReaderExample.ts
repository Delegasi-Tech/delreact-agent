/**
 * File Reader Tool Example
 * 
 * This example demonstrates how to use the file reader tool to analyze CSV and Excel files
 * with the ReactAgentBuilder framework.
 */

import { ReactAgentBuilder } from '../core/index';
import { fileReaderToolDef } from '../core/tools/fileReader';
import * as path from 'path';

async function demonstrateFileReading() {
  console.log('🔧 File Reader Tool Demonstration\n');

  // Create agent with file reading capabilities
  const agent = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY,
    anthropicKey: process.env.ANTHROPIC_KEY,
    useEnhancedPrompt: true,
    memory: "in-memory"
  })
  .addTool([fileReaderToolDef])
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash'
  })
  .build();

  // Test CSV file reading
  console.log('📊 Testing CSV File Reading...');
  const csvResult = await agent.invoke({
    objective: "Read the employees.csv file and analyze the salary distribution by department",
    outputInstruction: "Provide insights about salary trends, average salaries by department, and any patterns you notice",
    tools: [{
      name: "read-data-file",
      filePath: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
      options: {
        maxRows: 100,
        includeHeaders: true
      }
    }]
  });

  console.log('CSV Analysis Result:');
  console.log(csvResult.result);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test Excel file reading
  console.log('📈 Testing Excel File Reading...');
  const excelResult = await agent.invoke({
    objective: "Read the company-data.xlsx file (Sales sheet) and analyze the financial performance trends",
    outputInstruction: "Analyze revenue, expenses, and profit trends. Calculate key financial metrics and provide insights",
    tools: [{
      name: "read-data-file", 
      filePath: path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx'),
      options: {
        maxRows: 50,
        sheetName: "Sales"
      }
    }]
  });

  console.log('Excel Analysis Result:');
  console.log(excelResult.result);
  console.log('\n' + '='.repeat(80) + '\n');

  // Test multiple file analysis
  console.log('🔍 Testing Multiple File Analysis...');
  const multiFileResult = await agent.invoke({
    objective: "Compare employee data from CSV with financial performance from Excel to identify correlations",
    outputInstruction: "Provide insights about the relationship between employee metrics and financial performance",
    // Note: The agent will use multiple tool calls to read both files
  });

  console.log('Multi-file Analysis Result:');
  console.log(multiFileResult.result);
}

async function demonstrateDirectToolUsage() {
  console.log('\n🛠️  Direct Tool Usage Examples\n');

  // Direct CSV reading
  console.log('Reading CSV file directly...');
  const csvData = await fileReaderToolDef.invoke({
    filePath: path.join(process.cwd(), 'example', 'sample-data', 'employees.csv'),
    options: {
      maxRows: 5,
      includeHeaders: true
    }
  });
  console.log('CSV Data (first 5 rows):');
  console.log(csvData);
  console.log('\n');

  // Direct Excel reading
  console.log('Reading Excel file directly...');
  const excelData = await fileReaderToolDef.invoke({
    filePath: path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx'),
    options: {
      maxRows: 3,
      sheetName: 'Employees'
    }
  });
  console.log('Excel Data (Employees sheet, first 3 rows):');
  console.log(excelData);
  console.log('\n');

  // Test with sales data CSV
  console.log('Reading sales data CSV...');
  const salesData = await fileReaderToolDef.invoke({
    filePath: path.join(process.cwd(), 'example', 'sample-data', 'sales-data.csv'),
    options: {
      maxRows: 5,
      includeHeaders: true
    }
  });
  console.log('Sales Data:');
  console.log(salesData);
}

async function runFileReaderExample() {
  try {
    console.log('🚀 Starting File Reader Tool Example\n');

    // Check if sample files exist
    const csvPath = path.join(process.cwd(), 'example', 'sample-data', 'employees.csv');
    const excelPath = path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx');
    
    console.log('Sample files:');
    console.log(`📄 CSV: ${csvPath}`);
    console.log(`📊 Excel: ${excelPath}\n`);

    // Run direct tool usage examples first
    await demonstrateDirectToolUsage();

    // Run agent-based examples (commented out for now due to API requirements)
    console.log('🤖 Agent-based analysis requires API keys to be configured');
    console.log('To run full agent examples, ensure GEMINI_KEY, OPENAI_KEY, or ANTHROPIC_KEY is set\n');
    
    // Uncomment below when API keys are available:
    // await demonstrateFileReading();

    console.log('✅ File Reader Tool demonstration completed!');

  } catch (error) {
    console.error('❌ Error during demonstration:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
  }
}

// Run the example
runFileReaderExample();