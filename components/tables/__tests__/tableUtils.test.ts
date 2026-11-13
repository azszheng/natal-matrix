import { describe, it, expect } from 'vitest';
import { toDMS } from '../tableUtils';

describe('toDMS', () => {
  it('formats a plain degree value with no rounding', () => {
    expect(toDMS(15.5)).toBe('15°30\'00"');
  });

  it('carries a seconds value that rounds to 60 into the next minute', () => {
    // 15.999997° -> 15°59'59.9892" which must round up to 16°00'00", not 15°59'60"
    expect(toDMS(15.999997)).toBe('16°00\'00"');
  });

  it('carries a minutes value of 60 into the next degree', () => {
    // 29.999998° is within 0.0072" of 30° -- must round to 30°00'00"
    expect(toDMS(29.999998)).toBe('30°00\'00"');
  });

  it('handles exact zero', () => {
    expect(toDMS(0)).toBe('0°00\'00"');
  });
});
