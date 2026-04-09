import { createHash } from 'crypto';
import { StateRule } from '../../types';
const h = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

export const WA_RULES: StateRule[] = [
  { jurisdiction:'WA',state_code:'WA',rule_id:'WA-TIP-2026-001',version:1,effective_from:'2026-01-01',effective_to:null,source_type:'STATE_STATUTE',source_reference:'RCW 49.46.160 — Tips and Gratuities',source_url:'https://app.leg.wa.gov/RCW/default.aspx?cite=49.46.160',source_hash:h('WA-TIP-v1'),rule_type:'TIP_CREDIT',description:'Washington prohibits tip credits entirely. Full $16.66 state min wage required before tips.',parameters:{tip_credit_allowed:false,tip_credit_amount:0,state_minimum_wage:16.66}},
  { jurisdiction:'WA',state_code:'WA',rule_id:'WA-MW-2026-001',version:1,effective_from:'2026-01-01',effective_to:null,source_type:'STATE_STATUTE',source_reference:'RCW 49.46.020 — Minimum Wage 2026',source_url:'https://lni.wa.gov/workers-rights/wages/minimum-wage/',source_hash:h('WA-MW-v1'),rule_type:'MINIMUM_WAGE',description:'WA 2026 min wage: $16.66/hr (CPI-indexed). Seattle: $20.76/hr large employers.',parameters:{state_minimum_wage:16.66,seattle_large_employer_min:20.76,seattle_small_employer_min:18.76}},
  { jurisdiction:'WA',state_code:'WA',rule_id:'WA-OT-2026-001',version:1,effective_from:'2026-01-01',effective_to:null,source_type:'STATE_STATUTE',source_reference:'RCW 49.46.130 — Overtime',source_url:'https://lni.wa.gov/workers-rights/wages/overtime/',source_hash:h('WA-OT-v1'),rule_type:'OVERTIME',description:'WA follows FLSA: 1.5x regular rate after 40 hours/week. No daily OT.',parameters:{weekly_overtime_threshold:40,overtime_multiplier:1.5,daily_overtime:false}},
  { jurisdiction:'WA',state_code:'WA',rule_id:'WA-TIPPOOL-2026-001',version:1,effective_from:'2026-01-01',effective_to:null,source_type:'REGULATION',source_reference:'WAC 296-126-040 — Tips and Service Charges',source_url:'https://app.leg.wa.gov/WAC/default.aspx?cite=296-126-040',source_hash:h('WA-TIPPOOL-v1'),rule_type:'TIP_POOLING',description:'WA tip pooling allowed. Mandatory service charges must be disclosed — they are NOT tips.',parameters:{employer_participation_allowed:false,service_charge_is_not_tip:true,disclosure_required:true}},
];

export function getWashingtonRules(asOfDate: string): StateRule[] {
  const d = new Date(asOfDate);
  return WA_RULES.filter(r => { const f=new Date(r.effective_from); const t=r.effective_to?new Date(r.effective_to):new Date('9999-12-31'); return d>=f&&d<=t; });
}
