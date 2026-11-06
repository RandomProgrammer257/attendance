import { useState, useEffect } from 'react';
import { FullAnalyticsResponseDTO, WeeklyAttendanceDTO } from '../models';

// Базовый URL - измените на ваш
const API_BASE_URL = '/api/api/analytics';

export function useAnalytics(subjectId: number | null, groupId: number | null) {
  const [data, setData] = useState<FullAnalyticsResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId || !groupId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Пример API вызова - адаптируйте под ваш бекенд
    fetch(`${API_BASE_URL}/full/${subjectId}/${groupId}`)
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки данных');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [subjectId, groupId]);

  return { data, loading, error, setData };
}

export function useWeeklyAttendance(subjectId: number | null, groupId: number | null) {
  const [data, setData] = useState<WeeklyAttendanceDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId || !groupId) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/weekly/${subjectId}/${groupId}`)
      .then(res => res.json())
      .then((response: WeeklyAttendanceDTO[]) => {
        // Добавляем процент, если его нет
        const dataWithPercentage = response.map(item => ({
          ...item,
          percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
        }));
        setData(dataWithPercentage);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [subjectId, groupId]);

  return { data, loading, error };
}