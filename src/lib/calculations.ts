export function calculateCostPerNut(totalSpent: number, totalNuts: number): number {
  if (totalNuts === 0) return 0;
  return Math.round((totalSpent / totalNuts) * 100) / 100;
}

export function calculateTimePerNut(totalMinutes: number, totalNuts: number): number {
  if (totalNuts === 0) return 0;
  return Math.round((totalMinutes / totalNuts) * 100) / 100;
}

export function calculateCostPerHour(totalSpent: number, totalMinutes: number): number {
  if (totalMinutes === 0) return 0;
  const costPerHour = (totalSpent / totalMinutes) * 60;
  return Math.round(costPerHour * 100) / 100;
}

export function calculateNutsPerHour(totalNuts: number, totalMinutes: number): number {
  if (totalMinutes === 0) return 0;
  const nutsPerHour = (totalNuts / totalMinutes) * 60;
  return Math.round(nutsPerHour * 100) / 100;
}

export function calculateEfficiencyScore(
  totalNuts: number,
  totalSpent: number,
  totalMinutes: number,
  rating: number
): number {
  const nutsPerDollar = totalSpent > 0 ? totalNuts / totalSpent : 0;
  const nutsPerHour = totalMinutes > 0 ? (totalNuts / totalMinutes) * 60 : 0;

  const score = nutsPerDollar * 100 + nutsPerHour * 10 + rating;
  return Math.round(score * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatRating(rating: number): string {
  return `★${rating.toFixed(1)}/10`;
}
