// Returns the flash sale end time: end of current day (midnight local time)
export const getFlashSaleEndTime = () => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Calculates time remaining from now until endTime
// Returns {hours, minutes, seconds, expired}
export const getTimeRemaining = (endTime) => {
  const now = Date.now();
  const diff = endTime.getTime() - now;
  if (diff <= 0) return {hours: 0, minutes: 0, seconds: 0, expired: true};
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return {hours, minutes, seconds, expired: false};
};
