import { StateRule } from '../../types';
import { getCaliforniaRules, CA_RULES } from './california';
import { getNewYorkRules, NY_RULES } from './new-york';
import { getWashingtonRules, WA_RULES } from './washington';

type StateModuleGetter = (asOfDate: string) => StateRule[];

const REGISTRY: Record<string, StateModuleGetter> = {
  CA: getCaliforniaRules, NY: getNewYorkRules, WA: getWashingtonRules,
};

export function getStateRules(stateCode: string, asOfDate: string): StateRule[] | null {
  const getter = REGISTRY[stateCode.toUpperCase()];
  return getter ? getter(asOfDate) : null;
}

export function isStateModuleAvailable(stateCode: string): boolean {
  return stateCode.toUpperCase() in REGISTRY;
}

export function getAvailableStates(): string[] {
  return Object.keys(REGISTRY);
}

export function getAllStateRules(): StateRule[] {
  return [...CA_RULES, ...NY_RULES, ...WA_RULES];
}
