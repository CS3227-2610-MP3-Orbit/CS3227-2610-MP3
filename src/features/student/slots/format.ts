const singaporeDateTime = new Intl.DateTimeFormat("en-SG", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Singapore",
  timeZoneName: "short",
});

export function formatSingaporeDateTime(value: string): string {
  return singaporeDateTime.format(new Date(value));
}
