import ms, { StringValue } from 'ms';

/**
 * Check whether the time to now is greater than or equal to a time interval
 * @param time
 * @param timeInterval formate with [ms](https://github.com/vercel/ms)
 */
export function isTimeToNowGte(time: Date, timeInterval: StringValue) {
  const toNowInterval = new Date().getTime() - time.getTime();
  const gteTimeMs = ms(timeInterval);
  return toNowInterval >= gteTimeMs;
}
