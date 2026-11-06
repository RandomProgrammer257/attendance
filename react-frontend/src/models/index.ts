export interface SubjectDTO {
  id: number;
  name: string;
  teacherId: number;
  teacherName: string;
}

export interface GroupDTO {
  id: number;
  groupNumber: string;
}

export interface StudentDTO {
  id: number;
  name: string;
  groupId: number;
}

export interface AttendanceDTO {
  id?: number;
  studentId: number;
  subjectId: number; // <- обязательно для бэкенда
  lessonId?: number; // <- опционально, бэкенд сам создаст lesson
  type: string;
  present: boolean;
  date: string;
}

export interface TeacherDTO {
  id: number;
  name: string;
}

export interface TeacherLoginResponseDTO {
  id: number;
  name: string;
  subjects: SubjectDTO[]; // теперь массив объектов, а не строк
}

export interface LoginResponseDTO {
  id: number | null;           // null для админа
  name: string;
  role: "ADMIN" | "TEACHER";
  subjects?: SubjectDTO[];     // null или undefined для админа
}

export interface LoginRequestDTO {
  name: string;
  password: string;
}

export interface UserDTO {
  id: number;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}

// DTO, точно соответствующее твоему бэку
export interface AnalyticsDTO {
  individualPercent: number;        // индивидуальный процент посещаемости
  groupPercent: number;             // процент посещаемости группы
  dynamics: Record<string, number>; // динамика посещаемости по датам
}

// Для удобства фронта можно сделать конвертер в свой формат
export interface StudentAnalyticsDTO {
  individualRate: number;
  groupRate: number;
  dynamics: { date: string; presentRate: number }[];
}

export const mapAnalyticsDTO = (backendDto: AnalyticsDTO): StudentAnalyticsDTO => ({
  individualRate: backendDto.individualPercent,
  groupRate: backendDto.groupPercent,
  dynamics: Object.entries(backendDto.dynamics).map(([date, presentRate]) => ({
    date,
    presentRate,
  })),
});



// Базовые DTO для аналитики
export interface IndividualAttendanceDTO {
  studentId: number;
  studentName: string;
  totalLessons: number;
  attendedLessons: number;
  attendancePercentage: number;
}

export interface GroupAttendanceDTO {
  groupId: number;
  groupNumber: string;
  subjectId: number;
  subjectName: string;
  averageAttendancePercentage: number;
  totalStudents: number;
  totalLessons: number;
}

export interface DynamicAttendanceDTO {
  period: string; // "Неделя 1", "2024-01", и т.д.
  totalLessons: number;
  attendedLessons: number;
  attendancePercentage: number;
}

export interface WeeklyAttendanceDTO {
  week: number;
  present: number;
  total: number;
  percentage: number;
}

export interface MonthlyAttendanceDTO {
  month: string; // "2024-01"
  present: number;
  total: number;
  percentage: number;
}

// Полная аналитика
export interface FullAnalyticsResponseDTO {
  subjectName: string;
  groupNumber: string;
  groupAttendancePercentage: number;
  individualStats: IndividualAttendanceDTO[];
  dynamicStats: DynamicAttendanceDTO[];
  groupComparisons: GroupAttendanceDTO[];
}

// Данные для графиков
export interface ChartDataDTO {
  chartType: 'bar' | 'line' | 'pie' | 'heatmap';
  title: string;
  labels: string[];
  datasets: DatasetDTO[];
  options?: any;
}

export interface DatasetDTO {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

// KPI карточки
export interface KPICardDTO {
  title: string;
  value: string | number;
  trend?: string;
  icon?: string;
  color?: string;
}

// Фильтры
export interface AnalyticsFilterDTO {
  subjectId?: number | null;
  groupId?: number | null;
  studentId?: number | null;
  startDate?: string;
  endDate?: string;
  periodType?: 'week' | 'month' | 'day';
}

// Для тепловой карты
export interface HeatmapDataDTO {
  dates: string[];
  students: string[];
  data: number[][]; // [studentIndex][dateIndex]
}

export interface ChartDataInput {
  [key: string]: string | number;
  name: string;
  value: number;
}

export interface ScheduleDTO {
  id?: number;
  subjectId: number;
  groupId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;

}

export interface SubjectCreateDTO {
  name: string;
  teacherId: number;
}
