export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getGradeColor(percentage: number): string {
  if (percentage >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (percentage >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (percentage >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function getAttendanceColor(percentage: number): string {
  if (percentage >= 75) return 'text-emerald-600';
  if (percentage >= 60) return 'text-amber-600';
  return 'text-red-600';
}
