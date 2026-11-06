import { useState, useCallback } from 'react';
import type{ AttendanceDTO } from '../models';
import { attendanceApi } from '../services/api';

export const useAttendance = (groupId: number | null, date: string) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendanceData = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await attendanceApi.getGroupAttendance(groupId, date);
      setAttendanceData(data);
    } catch (err) {
      setError('Ошибка загрузки данных посещаемости');
      console.error('Error loading attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, date]);

  const handleAttendanceChange = async (studentId: number, present: boolean) => {
  try {
    const dto: AttendanceDTO = {
      studentId,
      type: "лекция", // ПЕРЕДЕЛАЙТЕ под вашу логику
      present,
      date
    };

    await attendanceApi.addAttendance(dto);

    setAttendanceData(prev => {
      const existingIndex = prev.findIndex(a =>
        a.studentId === studentId && a.date === date
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], present };
        return updated;
      } else {
        return [...prev, dto];
      }
    });
  } catch (err) {
    setError('Ошибка сохранения посещаемости');
    console.error('Error saving attendance:', err);
  }
};

  const isStudentPresent = (studentId: number): boolean => {
    return attendanceData.some(a => 
      a.studentId === studentId && a.date === date && a.present
    );
  };

  return {
    attendanceData,
    loading,
    error,
    loadAttendanceData,
    handleAttendanceChange,
    isStudentPresent
  };
};