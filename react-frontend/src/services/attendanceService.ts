import type{ AttendanceDTO } from '../types';
import { attendanceApi } from './api';

export const attendanceService = {
  markAttendance: async (studentId: number, present: boolean): Promise<void> => {
    const dto: AttendanceDTO = {
      studentId,
      timeStamp: new Date().toISOString(),
      present
    };
    
    await attendanceApi.addAttendance(dto);
  },

  bulkMarkAttendance: async (attendances: AttendanceDTO[]): Promise<void> => {
    // Реализация массового сохранения посещаемости
    const promises = attendances.map(attendance => 
      attendanceApi.addAttendance(attendance)
    );
    await Promise.all(promises);
  }
};