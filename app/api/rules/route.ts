import { NextResponse } from 'next/server';
import { getAllFederalRules } from '@/lib/rules/federal-rules';
import { getAllStateRules, getAvailableStates } from '@/lib/rules/state-modules';

export async function GET() {
  const federal = getAllFederalRules();
  const state = getAllStateRules();
  return NextResponse.json({ federal_rules: federal, state_rules: state, available_states: getAvailableStates(), total_rules: federal.length + state.length });
}
