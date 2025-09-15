export function formatDate(value: string): string {
  if (!value) return '';
  const dateSplit = value.split('-');
  return `${dateSplit[2] ? `${parseInt(dateSplit[2], 10)}.` : ''}${dateSplit[1]}.${dateSplit[0]}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('de', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  timeZone: 'Europe/Zurich',
  timeZoneName: 'short',
});

export function formatDateTime(
  value: Date | string | number | null | undefined
): string {
  return dateTimeFormatter.format(value ? new Date(value) : new Date());
}
