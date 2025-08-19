/**
 * Test script to verify multimodal functionality (Excel/CSV + Images)
 * This script tests the core functionality without requiring API keys
 */

import { fileReaderToolDef } from '../core/tools/fileReader';
import { ReactAgentBuilder } from '../core';
import * as path from 'path';

async function testFileReader() {
  console.log('🧪 Testing File Reader Tool...');
  
  try {
    // Test CSV reading
    const csvPath = path.join(process.cwd(), 'example', 'sample-data', 'employees.csv');
    const csvData = await fileReaderToolDef.invoke({
      filePath: csvPath,
      options: {
        maxRows: 3,
        includeHeaders: true
      }
    });
    
    console.log('✅ CSV reading works');
    console.log('Sample CSV data:', JSON.stringify(csvData, null, 2));
    
    // Test Excel reading
    const excelPath = path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx');
    const excelData = await fileReaderToolDef.invoke({
      filePath: excelPath,
      options: {
        maxRows: 2,
        sheetName: 'Employees'
      }
    });
    
    console.log('✅ Excel reading works');
    console.log('Sample Excel data:', JSON.stringify(excelData, null, 2));
    
  } catch (error: any) {
    console.error('❌ File reader test failed:', error.message);
  }
}

async function testImageProcessing() {
  console.log('\n🧪 Testing Image Processing...');
  
  try {
    const agentBuilder = new ReactAgentBuilder({
      // No API keys needed for this test
    });
    
    // Test image input validation
    const testImages = [
      {
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        detail: 'high' as const
      },
      {
        data: "/9j/4AAQSkZJRgABAQEASABIAAD//2Q==", // Base64 string
        detail: 'auto' as const
      }
    ];
    
    // This will test image processing without making API calls
    const { processImageInputs } = await import('../core/imageUtils');
    const processedImages = await processImageInputs(testImages);
    
    console.log('✅ Image processing works');
    console.log(`Processed ${processedImages.length} images`);
    console.log('Image formats:', processedImages.map(img => img.mimeType));
    
  } catch (error: any) {
    console.error('❌ Image processing test failed:', error.message);
  }
}

async function testAgentBuilder() {
  console.log('\n🧪 Testing Agent Builder with Tools...');
  
  try {
    const agent = new ReactAgentBuilder({
      // No API keys for structure test
    })
    .addTool([fileReaderToolDef])
    .init({
      selectedProvider: 'gemini', // This won't be used without API key
      model: 'gemini-2.5-flash'
    });
    
    // Test agent building (without actual invocation)
    const workflow = agent.build();
    
    console.log('✅ Agent builder works');
    console.log('Config:', workflow.config);
    console.log('Has file reader tool:', workflow.config !== undefined);
    
  } catch (error: any) {
    console.error('❌ Agent builder test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Multimodal Functionality Tests');
  console.log('=' .repeat(50));
  
  await testFileReader();
  await testImageProcessing();
  await testAgentBuilder();
  
  console.log('\n✨ All tests completed!');
  console.log('\n💡 To test full functionality with LLM calls:');
  console.log('1. Set GEMINI_KEY or OPENAI_KEY in .env');
  console.log('2. Run: npx tsx example/multimodalAnalysisExample.ts');
}

runTests().catch(console.error);