import axios from 'axios';
import {
  FullAnalyticsResponseDTO,
  IndividualAttendanceDTO,
  GroupAttendanceDTO,
  DynamicAttendanceDTO,
  WeeklyAttendanceDTO,
  MonthlyAttendanceDTO,
  ChartDataDTO,
  KPICardDTO,
  AnalyticsFilterDTO
} from '../models';

const API_URL = "/api/api/analytics";

export const analyticsApi = {
  // Полная аналитика
  getFullAnalytics(subjectId: number, groupId: number): Promise<FullAnalyticsResponseDTO> {
    return axios.get(`${API_URL}/full/${subjectId}/${groupId}`).then(res => res.data);
  },

  // Индивидуальная метрика
  getIndividualAttendance(subjectId: number, groupId: number): Promise<IndividualAttendanceDTO[]> {
    return axios.get(`${API_URL}/individual/${subjectId}/${groupId}`).then(res => res.data);
  },

  // Групповая метрика
  getGroupAttendance(subjectId: number, groupId: number): Promise<number> {
    return axios.get(`${API_URL}/group/${subjectId}/${groupId}`).then(res => res.data);
  },

  getGroupComparisons(groupId: number): Promise<GroupAttendanceDTO[]> {
    return axios.get(`${API_URL}/comparison/${groupId}`).then(res => res.data);
  },

  // Динамическая метрика
  getWeeklyAttendance(subjectId: number, groupId: number): Promise<WeeklyAttendanceDTO[]> {
    return axios.get(`${API_URL}/weekly/${subjectId}/${groupId}`).then(res => res.data);
  },

  getMonthlyAttendance(subjectId: number, groupId: number): Promise<MonthlyAttendanceDTO[]> {
    return axios.get(`${API_URL}/monthly/${subjectId}/${groupId}`).then(res => res.data);
  },

  // Данные для графиков
  getIndividualChartData(subjectId: number, groupId: number): Promise<ChartDataDTO> {
    return axios.get(`${API_URL}/chart/individual/${subjectId}/${groupId}`).then(res => res.data);
  },

  getGroupChartData(groupId: number): Promise<ChartDataDTO> {
    return axios.get(`${API_URL}/chart/group/${groupId}`).then(res => res.data);
  },

  getDynamicChartData(subjectId: number, groupId: number, periodType: string): Promise<ChartDataDTO> {
    return axios.get(`${API_URL}/chart/dynamic/${subjectId}/${groupId}/${periodType}`).then(res => res.data);
  },

  // Проблемные студенты
  getProblematicStudents(subjectId: number, groupId: number, threshold: number = 70): Promise<IndividualAttendanceDTO[]> {
    return axios.get(`${API_URL}/problematic/${subjectId}/${groupId}`, {
      params: { threshold }
    }).then(res => res.data);
  },

  // KPI данные
  getKPICards(subjectId: number, groupId: number): Promise<KPICardDTO[]> {
    return axios.get(`${API_URL}/kpi/${subjectId}/${groupId}`).then(res => res.data);
  },

  // С фильтрами
  getFilteredAnalytics(filter: AnalyticsFilterDTO): Promise<FullAnalyticsResponseDTO> {
    return axios.get(`${API_URL}/filtered`, { params: filter }).then(res => res.data);
  },

  // Экспорт
  exportToExcel(subjectId: number, groupId: number): Promise<Blob> {
    return axios.get(`${API_URL}/export/excel/${subjectId}/${groupId}`, {
      responseType: 'blob'
    }).then(res => res.data);
  },

  exportToPDF(subjectId: number, groupId: number): Promise<Blob> {
    return axios.get(`${API_URL}/export/pdf/${subjectId}/${groupId}`, {
      responseType: 'blob'
    }).then(res => res.data);
  }
};