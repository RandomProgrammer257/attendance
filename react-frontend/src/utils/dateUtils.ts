export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

export const getCurrentTime = (): string => {
  return formatTime(new Date());
};