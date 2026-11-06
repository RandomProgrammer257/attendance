import axios from 'axios';
import type { Attendance, AttendanceDTO, Group, Subject } from '../types';

const API_BASE_URL = '/api/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export const attendanceApi = {
  getGroupAttendance: async (groupId: number, date: string): Promise<Attendance[]> => {
    const response = await api.get(`/attendance/group/${groupId}?date=${date}`);
    return response.data;
  },

  addAttendance: async (dto: AttendanceDTO): Promise<AttendanceDTO> => {
    const response = await api.post('/attendance', dto);
    return response.data;
  },
};

export const subjectApi = {
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    return response.data;
  },

  getGroups: async (subjectId: number): Promise<Group[]> => {
    const response = await api.get(`/subjects/${subjectId}/groups`);
    return response.data;
  },
};