import ms from 'ms';

export function formatTimeToNow(time: Date) {
  const toNowInterval = new Date().getTime() - time.getTime();
  return ms(toNowInterval, { long: true });
}
