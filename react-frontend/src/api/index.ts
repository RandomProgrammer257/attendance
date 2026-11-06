import axios from "axios";
import type { SubjectDTO, GroupDTO, StudentDTO, AttendanceDTO, TeacherDTO } from "../models";

const API_BASE_URL = "/api/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ======================= AUTH =======================
export const authApi = {
  login: async (name: string, password: string) => {
    const res = await api.post("/auth/login", { name, password });
    return res.data;
  }
};

// ======================= SUBJECTS =======================
export const subjectApi = {
  getSubjects: async (): Promise<SubjectDTO[]> => {
    const response = await api.get("/subjects");
    return response.data;
  },
  getGroups: async (subjectId: number): Promise<GroupDTO[]> => {
    const response = await api.get(`/subjects/${subjectId}/groups`);
    return response.data;
  },
};

// ======================= GROUPS =======================
export const groupApi = {
  getStudents: async (groupId: number): Promise<StudentDTO[]> => {
    const response = await api.get(`/groups/${groupId}/students`);
    return response.data;
  },
};

// ======================= ATTENDANCE =======================
export const attendanceApi = {
  getGroupAttendance: async (groupId: number, date: string): Promise<AttendanceDTO[]> => {
    const response = await api.get(`/attendance/group/${groupId}?date=${date}`);
    return response.data;
  },
  addAttendance: async (dto: AttendanceDTO): Promise<AttendanceDTO> => {
    const response = await api.post("/attendance", dto);
    return response.data;
  },
};


// Статистика для графика
export const fetchStats = async (groupId: number) => {
  const res = await api.get(`/statistics/group/${groupId}`);
  return res.data;
};