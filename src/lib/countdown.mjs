export function countdownParts(deadline, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
}
export function launchPassed(deadline, now = Date.now()) { return now >= new Date(deadline).getTime(); }
