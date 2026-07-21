export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) return "—";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

export function formatCategory(category: string | null | undefined): string {
  if (!category) return "Uncategorized";
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatStatus(status: string): string {
  return status[0] + status.slice(1).toLowerCase();
}
