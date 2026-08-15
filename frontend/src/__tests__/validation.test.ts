import { describe, it, expect } from 'vitest';

/**
 * SplitFlow Basis Points (BPS) & Asset ID Validation Unit Test Suite
 */

// Helper BPS calculation function
function calculateBpsSum(shares: { share: number }[]): number {
  return shares.reduce((acc, curr) => acc + curr.share, 0);
}

function isValidBpsSum(shares: { share: number }[]): boolean {
  return calculateBpsSum(shares) === 10000;
}

function isValidAssetId(assetId: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(assetId);
}

function xlToStroops(xlmAmount: number): bigint {
  return BigInt(Math.floor(xlmAmount * 10_000_000));
}

describe('SplitFlow Protocol Validation Rules', () => {
  describe('Basis Point (BPS) Math', () => {
    it('should correctly sum basis points to 10,000 BPS (100.00%)', () => {
      const shares = [
        { share: 5000 }, // 50.00%
        { share: 3000 }, // 30.00%
        { share: 2000 }, // 20.00%
      ];
      expect(calculateBpsSum(shares)).toBe(10000);
      expect(isValidBpsSum(shares)).toBe(true);
    });

    it('should reject allocations that do not equal 10,000 BPS', () => {
      const invalidShares = [
        { share: 5000 },
        { share: 4000 }, // Total = 9,000 BPS (90%)
      ];
      expect(isValidBpsSum(invalidShares)).toBe(false);
    });

    it('should validate single contributor 100% allocation (10,000 BPS)', () => {
      const singleShare = [{ share: 10000 }];
      expect(isValidBpsSum(singleShare)).toBe(true);
    });
  });

  describe('Asset ID Format Regex Rules', () => {
    it('should accept valid alphanumeric Asset IDs with underscores and hyphens', () => {
      expect(isValidAssetId('album_split_001')).toBe(true);
      expect(isValidAssetId('retro-beats-2026')).toBe(true);
      expect(isValidAssetId('TRACK001')).toBe(true);
    });

    it('should reject Asset IDs containing spaces or special characters', () => {
      expect(isValidAssetId('album split 001')).toBe(false);
      expect(isValidAssetId('asset@2026')).toBe(false);
      expect(isValidAssetId('hi')).toBe(false); // Too short (< 3 chars)
    });
  });

  describe('Stroop Currency Conversions', () => {
    it('should convert 1 XLM to 10,000,000 Stroops', () => {
      expect(xlToStroops(1)).toBe(BigInt('10000000'));
    });

    it('should convert 100.5 XLM to 1,005,000,000 Stroops', () => {
      expect(xlToStroops(100.5)).toBe(BigInt('1005000000'));
    });
  });

});
