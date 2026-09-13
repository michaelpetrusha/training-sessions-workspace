const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export function formatStartsAt(startsAt: string): string {
  return dateFormatter.format(new Date(startsAt))
}
