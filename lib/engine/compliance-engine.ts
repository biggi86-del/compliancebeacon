import { v4 as uuidv4 } from 'uuid';
import { TaxCalculation, Discrepancy, CSVValidationError, EngineResult, RuleProvenance } from '../types';
import { getFederalRule } from '../rules/federal-rules';
import { getStateRules, isStateModuleAvailable } from '../rules/state-modules';
import { validateRow } from './csv-parser';

export function runComplianceEngine(rawRows: Record<string, string>[], asOfDate = '2026-06-15'): EngineResult {
  const calculations: TaxCalculation[] = [];
  const discrepancies: Discrepancy[] = [];
  const csvErrors: CSVValidationError[] = [];
  const rulesApplied = new Map<string, RuleProvenance>();
  const unavailableModules = new Set<string>();
  let validRows = 0, errorRows = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i]; const rowNum = i + 2;
    const { errors } = validateRow(raw, rowNum);
    if (errors.length > 0) { csvErrors.push(...errors); errorRows++; continue; }
    validRows++;

    const eid = raw.employee_id.trim(); const state = raw.state.trim().toUpperCase();
    const ot = +raw.hours_overtime; const rate = +raw.hourly_rate; const tips = +raw.tips_reported;
    const sc = +raw.service_charges; const otp = +raw.overtime_premium_paid;
    const gw = +raw.gross_wages; const ss = +raw.social_security;
    const period = `${raw.pay_period_start.trim()}/${raw.pay_period_end.trim()}`;

    const tpRule = getFederalRule('TP', asOfDate);
    if (tpRule) rulesApplied.set(`${tpRule.rule_id}-v${tpRule.version}`, tpRule);
    const tp = tips;

    const ttRule = getFederalRule('TT', asOfDate);
    if (ttRule) rulesApplied.set(`${ttRule.rule_id}-v${ttRule.version}`, ttRule);
    const tt = Math.round(ot * rate * 0.5 * 100) / 100;

    if (sc > 0) discrepancies.push({ id: uuidv4(), severity: 'INFO', rule_id: 'FED-TP-2026-001', jurisdiction: 'FEDERAL', employee_id: eid, pay_period: period, expected_value: 0, actual_value: sc, delta: sc, explanation: `$${sc.toFixed(2)} in mandatory service charges correctly excluded from Box 12 Code TP.`, created_at: new Date().toISOString() });

    const ttDelta = Math.abs(tt - otp);
    if (ttDelta > 1 && ot > 0) discrepancies.push({ id: uuidv4(), severity: ttDelta > 100 ? 'ERROR' : 'WARNING', rule_id: 'FED-TT-2026-001', jurisdiction: 'FEDERAL', employee_id: eid, pay_period: period, expected_value: tt, actual_value: otp, delta: Math.round(ttDelta * 100) / 100, explanation: `Box 12 TT mismatch. Expected $${tt.toFixed(2)} (${ot}hrs x $${rate} x 0.5), reported $${otp.toFixed(2)}.`, created_at: new Date().toISOString() });

    const penRule = getFederalRule('PENALTY', asOfDate);
    if (penRule) rulesApplied.set(`${penRule.rule_id}-v${penRule.version}`, penRule);
    const hasPenalty = ttDelta > 1 && ot > 0;
    if (hasPenalty) discrepancies.push({ id: uuidv4(), severity: 'CRITICAL', rule_id: 'FED-PENALTY-2026-001', jurisdiction: 'FEDERAL', employee_id: eid, pay_period: period, expected_value: 0, actual_value: 680, delta: 680, explanation: '$680 penalty risk under IRC 6721/6722 for incorrect TT W-2 reporting.', created_at: new Date().toISOString() });

    if (!isStateModuleAvailable(state)) { unavailableModules.add(state); }
    else {
      const stateRules = getStateRules(state, asOfDate);
      if (stateRules) for (const sr of stateRules) {
        rulesApplied.set(`${sr.rule_id}-v${sr.version}`, sr);
        if (sr.rule_type === 'MINIMUM_WAGE') { const mw = (sr.parameters.minimum_wage ?? sr.parameters.state_minimum_wage ?? sr.parameters.rest_of_state_minimum_wage) as number; if (mw && rate < mw) discrepancies.push({ id: uuidv4(), severity: 'CRITICAL', rule_id: sr.rule_id, jurisdiction: sr.jurisdiction, employee_id: eid, pay_period: period, expected_value: mw, actual_value: rate, delta: +(mw-rate).toFixed(2), explanation: `$${rate}/hr below ${sr.jurisdiction} minimum wage $${mw}/hr.`, created_at: new Date().toISOString() }); }
        if (sr.rule_type === 'TIP_CREDIT' && !(sr.parameters.tip_credit_allowed as boolean)) { const smw = sr.parameters.state_minimum_wage as number; if (smw && rate < smw) discrepancies.push({ id: uuidv4(), severity: 'CRITICAL', rule_id: sr.rule_id, jurisdiction: sr.jurisdiction, employee_id: eid, pay_period: period, expected_value: smw, actual_value: rate, delta: +(smw-rate).toFixed(2), explanation: `${sr.jurisdiction} prohibits tip credits. Must pay $${smw}/hr. Actual: $${rate}/hr.`, created_at: new Date().toISOString() }); }
        if (sr.rule_type === 'OVERTIME' && ot > 0) { const exp = ot * rate * ((sr.parameters.overtime_multiplier as number) - 1); const d = Math.abs(exp - otp); if (d > 1) discrepancies.push({ id: uuidv4(), severity: d > 50 ? 'ERROR' : 'WARNING', rule_id: sr.rule_id, jurisdiction: sr.jurisdiction, employee_id: eid, pay_period: period, expected_value: +exp.toFixed(2), actual_value: otp, delta: +d.toFixed(2), explanation: `${sr.jurisdiction} OT premium mismatch. Expected $${exp.toFixed(2)}, got $${otp.toFixed(2)}.`, created_at: new Date().toISOString() }); }
      }
    }

    const totalComp = gw + tips; const expectedSS = Math.round(totalComp * 0.062 * 100) / 100; const expectedMC = Math.round(totalComp * 0.0145 * 100) / 100;
    const ssDelta = Math.abs(expectedSS - ss);
    if (ssDelta > 1) discrepancies.push({ id: uuidv4(), severity: ssDelta > 50 ? 'ERROR' : 'WARNING', rule_id: 'FED-TP-2026-001', jurisdiction: 'FEDERAL', employee_id: eid, pay_period: period, expected_value: expectedSS, actual_value: ss, delta: +ssDelta.toFixed(2), explanation: `SS mismatch. Expected $${expectedSS.toFixed(2)} (6.2% of $${totalComp.toFixed(2)}), got $${ss.toFixed(2)}.`, created_at: new Date().toISOString() });

    calculations.push({ id: uuidv4(), employee_id: eid, pay_period: period, jurisdiction: state, box12_code_tp: tp, box12_code_tt: tt, expected_ss: expectedSS, expected_medicare: expectedMC, penalty_risk_amount: hasPenalty ? 680 : 0, penalty_risk_flag: hasPenalty, rule_ids_applied: Array.from(rulesApplied.keys()) });
  }

  for (const s of unavailableModules) discrepancies.push({ id: uuidv4(), severity: 'WARNING', rule_id: 'RULE_MODULE_UNAVAILABLE', jurisdiction: s, employee_id: 'ALL', pay_period: 'ALL', expected_value: 0, actual_value: 0, delta: 0, explanation: `State module for ${s} is not available. Only federal rules applied.`, created_at: new Date().toISOString() });

  return { calculations, discrepancies, csv_errors: csvErrors, rules_applied: Array.from(rulesApplied.values()), unavailable_modules: Array.from(unavailableModules), summary: { total_rows: rawRows.length, valid_rows: validRows, error_rows: errorRows, total_discrepancies: discrepancies.length, critical_count: discrepancies.filter(d => d.severity === 'CRITICAL').length, warning_count: discrepancies.filter(d => d.severity === 'WARNING').length, penalty_risk_total: discrepancies.filter(d => d.rule_id === 'FED-PENALTY-2026-001').reduce((s, d) => s + d.actual_value, 0) } };
}
