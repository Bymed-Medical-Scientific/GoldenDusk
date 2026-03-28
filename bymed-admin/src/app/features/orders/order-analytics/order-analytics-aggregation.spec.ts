import { aggregateSalesForChart } from './order-analytics-page.component';

describe('aggregateSalesForChart', () => {
  it('passes through daily points with labels', () => {
    const bars = aggregateSalesForChart(
      [
        { date: '2024-01-15', revenue: 100, orderCount: 2 },
        { date: '2024-01-16', revenue: 50, orderCount: 1 }
      ],
      'day'
    );
    expect(bars.length).toBe(2);
    expect(bars[0].revenue).toBe(100);
    expect(bars[0].orderCount).toBe(2);
    expect(bars[1].revenue).toBe(50);
  });

  it('sums revenue into week buckets (Monday start)', () => {
    const bars = aggregateSalesForChart(
      [
        { date: '2024-01-08', revenue: 10, orderCount: 1 },
        { date: '2024-01-09', revenue: 5, orderCount: 1 }
      ],
      'week'
    );
    expect(bars.length).toBe(1);
    expect(bars[0].revenue).toBe(15);
    expect(bars[0].orderCount).toBe(2);
  });

  it('sums revenue into calendar months', () => {
    const bars = aggregateSalesForChart(
      [
        { date: '2024-01-05', revenue: 20, orderCount: 1 },
        { date: '2024-01-28', revenue: 30, orderCount: 2 }
      ],
      'month'
    );
    expect(bars.length).toBe(1);
    expect(bars[0].revenue).toBe(50);
    expect(bars[0].orderCount).toBe(3);
  });

  it('returns empty array for empty input', () => {
    expect(aggregateSalesForChart([], 'day')).toEqual([]);
  });
});
