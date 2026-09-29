import { describe, expect, it } from 'vitest';
import {
  getAvailableScenarioForLabelType,
  LABEL_SCENARIOS,
  LABEL_SCENARIO_STATUSES
} from '../../src/lib/labels/scenarios.js';
import { getLabelTypeName, LABEL_TYPES } from '../../src/lib/labels/workflows.js';

describe('business-situation label choices', () => {
  it('maps only the two supported situations to persisted label types', () => {
    const availableScenarios = LABEL_SCENARIOS.filter(
      (scenario) => scenario.status === LABEL_SCENARIO_STATUSES.AVAILABLE
    );

    expect(availableScenarios.map((scenario) => scenario.labelType)).toEqual([
      LABEL_TYPES.SSCC_ONLY,
      LABEL_TYPES.HOMOGENEOUS_UNIT
    ]);
    expect(
      LABEL_SCENARIOS.filter((scenario) => scenario.status !== LABEL_SCENARIO_STATUSES.AVAILABLE)
        .map((scenario) => scenario.labelType)
        .every((labelType) => labelType === null)
    ).toBe(true);
  });

  it('keeps the contained-items and orderable-trade-item situations separate', () => {
    const containedItems = getAvailableScenarioForLabelType(LABEL_TYPES.HOMOGENEOUS_UNIT);
    const tradeItemUnit = LABEL_SCENARIOS.find(
      (scenario) => scenario.id === 'trade-item-logistic-unit'
    );

    expect(containedItems).toMatchObject({
      title: 'Ship multiple identical cases or items',
      outputs: expect.arrayContaining(['Contents: (02) GTIN plus (37) count'])
    });
    expect(tradeItemUnit).toMatchObject({
      labelType: null,
      status: LABEL_SCENARIO_STATUSES.PLANNED,
      outputs: expect.arrayContaining(['Trade item: (01) GTIN'])
    });
  });

  it('uses compact business names in saved-label views', () => {
    expect(getLabelTypeName(LABEL_TYPES.SSCC_ONLY)).toBe('Transport unit tracking');
    expect(getLabelTypeName(LABEL_TYPES.HOMOGENEOUS_UNIT)).toBe('Identical contents');
  });
});
