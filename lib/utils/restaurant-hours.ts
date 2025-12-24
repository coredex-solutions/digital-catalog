// Utility function to check if restaurant is open
export function isRestaurantOpen(operatingHours?: any[]): boolean {
  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = days[now.getDay()] as string;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  if (operatingHours && operatingHours.length > 0) {
    const todayHours = operatingHours.find((h) => h.day_name === currentDay);
    if (todayHours) {
      if (todayHours.is_closed) return false;
      return currentHour >= todayHours.open_hour && currentHour < todayHours.close_hour;
    }
  }

  // Fallback to default hours (11-23.5)
  return currentHour >= 11 && currentHour < 23.5;
}

