export * from "./calendarUtils";

import * as Calendar from "expo-calendar";
import { CalendarEventInput } from "./calendarUtils";

export async function addToDeviceCalendar(
  event: CalendarEventInput,
  preferGoogle: boolean
): Promise<"success" | "permission_denied" | "error"> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return "permission_denied";

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    const writable = calendars.filter((c) => c.allowsModifications);

    let target = preferGoogle
      ? writable.find(
          (c) =>
            c.source?.type === "com.google" ||
            c.source?.name?.toLowerCase().includes("google")
        )
      : writable.find(
          (c) =>
            c.source?.type === "exchange" ||
            c.source?.name?.toLowerCase().includes("outlook") ||
            c.source?.name?.toLowerCase().includes("microsoft")
        );

    if (!target) target = writable.find((c) => c.isDefault) ?? writable[0];
    if (!target) return "error";

    await Calendar.createEventAsync(target.id, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      notes: event.notes,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return "success";
  } catch {
    return "error";
  }
}
