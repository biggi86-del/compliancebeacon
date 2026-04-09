import { CSVValidationError } from '../types';

const REQUIRED = ['employee_id','employee_name','pay_period_start','pay_period_end','state','hours_regular','hours_overtime','hourly_rate','gross_wages','tips_reported','service_charges','overtime_premium_paid','federal_withholding','state_withholding','social_security','medicare'];

export function parseCSV(text: string): { rows: Record<string, string>[]; headerErrors: string[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { rows: [], headerErrors: ['CSV must have a header row and at least one data row.'] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const headerErrors: string[] = [];
  for (const r of REQUIRED) { if (!headers.includes(r)) headerErrors.push(`Missing required column: "${r}"`); }
  if (headerErrors.length > 0) return { rows: [], headerErrors };
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = line.split(',');
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = (vals[j] || '').trim().replace(/^"|"$/g, '');
    rows.push(row);
  }
  return { rows, headerErrors: [] };
}

const NUM_FIELDS = ['hours_regular','hours_overtime','hourly_rate','gross_wages','tips_reported','service_charges','overtime_premium_paid','federal_withholding','state_withholding','social_security','medicare'];

export function validateRow(row: Record<string, string>, rowNum: number): { errors: CSVValidationError[] } {
  const errors: CSVValidationError[] = [];
  for (const col of REQUIRED) {
    if (!row[col] && row[col] !== '0') errors.push({ row_number: rowNum, column: col, value: '', error: `Missing required column: ${col}` });
  }
  if (errors.length > 0) return { errors };
  for (const f of NUM_FIELDS) {
    const v = parseFloat(row[f]);
    if (isNaN(v)) errors.push({ row_number: rowNum, column: f, value: row[f], error: `Invalid numeric value: "${row[f]}"` });
    else if (v < 0) errors.push({ row_number: rowNum, column: f, value: row[f], error: `Negative value not allowed: ${v}` });
  }
  if (row.state && !/^[A-Z]{2}$/i.test(row.state.trim())) {
    errors.push({ row_number: rowNum, column: 'state', value: row.state, error: `Invalid state code: "${row.state}"` });
  }
  return { errors };
}
