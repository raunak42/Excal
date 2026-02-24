const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatRelativeTime = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diff = Date.now() - timestamp;

  if (diff < MINUTE) {
    return "just now";
  }

  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)}m ago`;
  }

  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}h ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
};
