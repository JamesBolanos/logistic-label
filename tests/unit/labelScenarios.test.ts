import { describe, expect, it } from 'vitest';
import {
  getAvailableScenarioForLabelType,
  LABEL_SCENARIOS,
  LABEL_SCENARIO_STATUSES
} from '../../src/lib/labels/scenarios.js';
import { getLabelTypeName, LABEL_TYPES } from '../../src/lib/labels/workflows.js';

describe('business-situation label choices', () => {
  it('maps the supported situations to persisted label types', () => {
    const availableScenarios = LABEL_SCENARIOS.filter(
      (scenario) => scenario.status === LABEL_SCENARIO_STATUSES.AVAILABLE
    );

    expect(availableScenarios.map((scenario) => scenario.labelType)).toEqual([
      LABEL_TYPES.SSCC_ONLY,
      LABEL_TYPES.HOMOGENEOUS_UNIT,
      LABEL_TYPES.TRADE_ITEM_UNIT,
      LABEL_TYPES.MIXED_LOGISTIC_UNIT
    ]);
    expect(
      LABEL_SCENARIOS.filter((scenario) => scenario.status !== LABEL_SCENARIO_STATUSES.AVAILABLE)
        .map((scenario) => scenario.labelType)
        .every((labelType) => labelType === null)
    ).toBe(true);
  });

  it('keeps the contained-items and trade-item situations separate', () => {
    const containedItems = getAvailableScenarioForLabelType(LABEL_TYPES.HOMOGENEOUS_UNIT);
    const tradeItemUnit = getAvailableScenarioForLabelType(LABEL_TYPES.TRADE_ITEM_UNIT);

    expect(containedItems).toMatchObject({
      title: 'Ship multiple identical cases or items',
      outputs: expect.arrayContaining(['Contents: (02) GTIN plus (37) count'])
    });
    expect(tradeItemUnit).toMatchObject({
      title: 'Ship a case or pallet sold as one item',
      labelType: LABEL_TYPES.TRADE_ITEM_UNIT,
      status: LABEL_SCENARIO_STATUSES.AVAILABLE,
      outputs: expect.arrayContaining(['Trade item: (01) GTIN'])
    });
  });

  it('uses compact business names in saved-label views', () => {
    expect(getLabelTypeName(LABEL_TYPES.SSCC_ONLY)).toBe('Transport unit tracking');
    expect(getLabelTypeName(LABEL_TYPES.HOMOGENEOUS_UNIT)).toBe('Identical contents');
  });
});
