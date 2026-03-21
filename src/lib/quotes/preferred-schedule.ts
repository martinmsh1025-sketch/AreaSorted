type PreferredScheduleOption = {
  date: string;
  time: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parsePreferredScheduleOptions(inputJson: unknown): PreferredScheduleOption[] {
  const record = asRecord(inputJson);
  const raw = record?.preferredScheduleOptions;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const option = asRecord(item);
      const date = typeof option?.date === "string" ? option.date : "";
      const time = typeof option?.time === "string" ? option.time : "";
      if (!date || !time) return null;
      return { date, time };
    })
    .filter((item): item is PreferredScheduleOption => Boolean(item));
}

export function formatPreferredScheduleOption(option: PreferredScheduleOption) {
  const date = new Date(`${option.date}T12:00:00`);
  const formattedDate = Number.isNaN(date.getTime())
    ? option.date
    : date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return `${formattedDate} at ${option.time}`;
}
