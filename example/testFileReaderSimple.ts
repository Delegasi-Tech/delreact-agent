import { fileReaderToolDef } from '../core/tools/fileReader';
import * as path from 'path';

async function testFileReader() {
  try {
    console.log('Testing CSV file reading...');
    
    const csvPath = path.join(process.cwd(), 'example', 'sample-data', 'employees.csv');
    console.log('CSV path:', csvPath);
    
    const csvResult = await fileReaderToolDef.invoke({
      filePath: csvPath,
      options: {
        maxRows: 3,
        includeHeaders: true
      }
    });
    
    console.log('CSV Result:', csvResult);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test Excel file
    console.log('Testing Excel file reading...');
    
    const excelPath = path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx');
    console.log('Excel path:', excelPath);
    
    const excelResult = await fileReaderToolDef.invoke({
      filePath: excelPath,
      options: {
        maxRows: 3,
        sheetName: 'Sales'
      }
    });
    
    console.log('Excel Result (Sales sheet):', excelResult);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test second sheet
    const employeeSheetResult = await fileReaderToolDef.invoke({
      filePath: excelPath,
      options: {
        maxRows: 3,
        sheetName: 'Employees'
      }
    });
    
    console.log('Excel Result (Employees sheet):', employeeSheetResult);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFileReader();