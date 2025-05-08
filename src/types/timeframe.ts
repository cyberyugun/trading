export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1wk' | '1mo';
export type TimeRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';

export interface TimeframeProps {
  interval: TimeInterval;
  range: TimeRange;
}

export const timeIntervalOptions: { label: string; value: TimeInterval }[] = [
  { label: '1 Minute', value: '1m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '30 Minutes', value: '30m' },
  { label: '1 Hour', value: '1h' },
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1wk' },
  { label: '1 Month', value: '1mo' },
];

export const timeRangeOptions: { label: string; value: TimeRange }[] = [
  { label: '1 Day', value: '1d' },
  { label: '5 Days', value: '5d' },
  { label: '1 Month', value: '1mo' },
  { label: '3 Months', value: '3mo' },
  { label: '6 Months', value: '6mo' },
  { label: '1 Year', value: '1y' },
  { label: '2 Years', value: '2y' },
  { label: '5 Years', value: '5y' },
  { label: 'Max', value: 'max' },
]; 