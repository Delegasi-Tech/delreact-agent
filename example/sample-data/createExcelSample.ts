import * as XLSX from 'xlsx';
import * as path from 'path';

// Create sample Excel data
const salesData = [
  ['Month', 'Revenue', 'Expenses', 'Profit', 'Growth_%'],
  ['January', 125000, 85000, 40000, 12.5],
  ['February', 138000, 89000, 49000, 22.5],
  ['March', 142000, 92000, 50000, 2.0],
  ['April', 156000, 98000, 58000, 16.0],
  ['May', 169000, 105000, 64000, 10.3],
  ['June', 183000, 112000, 71000, 10.9]
];

const employeeData = [
  ['Employee_ID', 'Name', 'Department', 'Hire_Date', 'Performance_Score'],
  [1001, 'Alice Johnson', 'Engineering', '2020-03-15', 4.2],
  [1002, 'Bob Smith', 'Marketing', '2021-07-22', 3.8],
  [1003, 'Carol Davis', 'Sales', '2019-11-08', 4.5],
  [1004, 'David Wilson', 'Engineering', '2022-01-12', 4.0],
  [1005, 'Eva Brown', 'HR', '2020-09-03', 3.9]
];

// Create workbook and worksheets
const workbook = XLSX.utils.book_new();

// Add Sales sheet
const salesWorksheet = XLSX.utils.aoa_to_sheet(salesData);
XLSX.utils.book_append_sheet(workbook, salesWorksheet, 'Sales');

// Add Employees sheet
const employeeWorksheet = XLSX.utils.aoa_to_sheet(employeeData);
XLSX.utils.book_append_sheet(workbook, employeeWorksheet, 'Employees');

// Write the file
const outputPath = path.join(process.cwd(), 'example', 'sample-data', 'company-data.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Created Excel file: ${outputPath}`);
console.log('Sheets created:');
console.log('- Sales: Financial data by month');
console.log('- Employees: Employee information and performance');