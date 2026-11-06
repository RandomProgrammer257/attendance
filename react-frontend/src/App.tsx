import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import {
  SubjectDTO,
  TeacherDTO,
  GroupDTO,
  StudentDTO,
  UserDTO,
  TeacherLoginResponseDTO,
} from "./models";
import { SubjectList } from "./components/SubjectList/SubjectList";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AnalyticsPage } from "./components/Analytics/AnalyticsPage";
import TeacherQRScanner from "./components/TeacherQRScanner";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from 'html2canvas';

const API_BASE_URL = "/api/api";
const WS_URL = "/api/ws";

interface CreateTeacherDTO {
  name: string;
  password: string;
}

interface CreateGroupDTO {
  groupNumber: string;
}

interface CreateStudentDTO {
  name: string;
  groupId: number;
}

interface CreateSubjectDTO {
  name: string;
  teacherId: number;
}

interface StudentAnalyticsDTO {
  studentId: number;
  studentName: string;
  individualPercent: number;
  groupPercent: number;
  dynamics: Record<string, number>;
  subjectName: string;
  groupNumber: string;
  totalLessons: number;
  attendedLessons: number;
}

interface LessonDTO {
  id: number;
  date: string;
  subjectId: number;
  groupId: number;
  name: string;
}

interface ScheduleDTO {
  id: number;
  subjectId: number;
  subjectName: string;
  groupId: number;
  groupNumber: string;
  teacherId: number;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface JournalRecord {
  studentId: number;
  studentName: string;
  attendanceByDate: Record<string, boolean>;
  attendancePercent: number;
  attendedCount: number;
  totalCount: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [view, setView] = useState<string>("login");
  const [scannerMode, setScannerMode] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [teacherSubjects, setTeacherSubjects] = useState<SubjectDTO[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDTO | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupDTO | null>(null);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [studentAnalytics, setStudentAnalytics] = useState<Record<number, StudentAnalyticsDTO | null>>({});
  const [loadingStudentAnalytics, setLoadingStudentAnalytics] = useState<Record<number, boolean>>({});
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [rating, setRating] = useState<StudentAnalyticsDTO[]>([]);
  const [showRating, setShowRating] = useState(false);

  const [skudAttendance, setSkudAttendance] = useState<Record<number, boolean>>({});
  const [excusedAttendance, setExcusedAttendance] = useState<Record<number, boolean>>({});

  const [viewJournal, setViewJournal] = useState(false);
  const [journalData, setJournalData] = useState<JournalRecord[]>([]);
  const [journalDates, setJournalDates] = useState<string[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);

  useEffect(() => {
    const savedSkud = localStorage.getItem("skudAttendance");
    if (savedSkud) {
      try {
        setSkudAttendance(JSON.parse(savedSkud));
      } catch (e) {
        console.error("Ошибка загрузки СКУД", e);
      }
    }
    const savedExcused = localStorage.getItem("excusedAttendance");
    if (savedExcused) {
      try {
        setExcusedAttendance(JSON.parse(savedExcused));
      } catch (e) {
        console.error("Ошибка загрузки уважительных причин", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("skudAttendance", JSON.stringify(skudAttendance));
  }, [skudAttendance]);

  useEffect(() => {
    localStorage.setItem("excusedAttendance", JSON.stringify(excusedAttendance));
  }, [excusedAttendance]);

  const [teachers, setTeachers] = useState<TeacherDTO[]>([]);
  const [adminGroups, setAdminGroups] = useState<GroupDTO[]>([]);
  const [adminStudents, setAdminStudents] = useState<StudentDTO[]>([]);
  const [selectedFaceStudent, setSelectedFaceStudent] = useState<StudentDTO | null>(null);
  const [facePhoto, setFacePhoto] = useState<File | null>(null);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState<CreateTeacherDTO>({
    name: "",
    password: "",
  });
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState<CreateGroupDTO>({
    groupNumber: "",
  });
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState<CreateStudentDTO>({
    name: "",
    groupId: 0,
  });
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [newSubject, setNewSubject] = useState<CreateSubjectDTO>({
    name: "",
    teacherId: 0,
  });
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [selectedScheduleGroup, setSelectedScheduleGroup] = useState<number | null>(null);

  const [newSchedule, setNewSchedule] = useState({
    subjectId: null as number | null,
    groupId: null as number | null,
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "10:30",
    room: "",
  });

  // ========== WEBSOCKET ==========
  useEffect(() => {
    if (selectedGroup && selectedSubject) {
      const socket = new SockJS(WS_URL);
      const stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log(str),
        onConnect: () => {
          console.log("✅ WebSocket connected");
          stompClient.subscribe("/topic/attendance", (message) => {
            const data = JSON.parse(message.body);
            console.log("📩 WebSocket update:", data);
            if (
              data.groupId === selectedGroup.id &&
              data.subjectId === selectedSubject.id &&
              data.date === selectedDate
            ) {
              setAttendance((prev) => ({
                ...prev,
                [data.studentId]: data.present,
              }));
            }
          });
        },
        onStompError: (frame) => {
          console.error("WebSocket error:", frame);
        },
      });
      stompClient.activate();
      return () => {
        if (stompClient) {
          stompClient.deactivate();
        }
      };
    }
  }, [selectedGroup, selectedSubject, selectedDate]);

  // ========== LOGIN ==========
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        name: username,
        password,
      });
      const data = res.data;

      setUser({
        id: data.id,
        name: data.username || data.name,
        role: data.role,
      });
      setRole(data.role);

      if (data.role === "ADMIN") {
        setView("admin");
        fetchTeachers();
        fetchAdminGroups();
        fetchSubjects();
        fetchAdminStudents();
      } else if (data.role === "TEACHER") {
        const teacher: TeacherLoginResponseDTO = data.teacher || data;
        setTeacherSubjects(teacher.subjects || []);
        setView("subjects");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка входа. Проверьте логин и пароль.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setView("login");
    setUsername("");
    setPassword("");
    setTeacherSubjects([]);
    setSelectedSubject(null);
    setSelectedGroup(null);
    setGroups([]);
    setStudents([]);
    setAttendance({});
    setTeachers([]);
    setAdminGroups([]);
    setAdminStudents([]);
    setStudentAnalytics({});
    setLoadingStudentAnalytics({});
    setLessons([]);
    setSchedules([]);
    setSelectedScheduleGroup(null);
    setRating([]);
    setShowRating(false);
    setViewJournal(false);
  };

  const toggleSkudAttendance = (studentId: number) => {
    setSkudAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const toggleExcusedAttendance = (studentId: number) => {
    setExcusedAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  // ========== ADMIN ACTIONS ==========
  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/teachers`);
      setTeachers(res.data);
    } catch (err) {
      console.error("Ошибка загрузки учителей:", err);
    }
  };

  const fetchAdminGroups = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/groups`);
      setAdminGroups(res.data);
    } catch (err) {
      console.error("Ошибка загрузки групп:", err);
    }
  };

  const fetchAdminStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/students`);
      setAdminStudents(res.data);
    } catch (err) {
      console.error("Ошибка загрузки студентов:", err);
    }
  };

  const fetchAdminStudentsByGroup = async (groupId: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/groups/${groupId}/students`);
      setAdminStudents(res.data);
    } catch (err) {
      console.error("Ошибка загрузки студентов:", err);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.password)
      return alert("Имя и пароль обязательны");
    try {
      await axios.post(`${API_BASE_URL}/admin/teachers`, newTeacher);
      fetchTeachers();
      setShowAddTeacherForm(false);
      setNewTeacher({ name: "", password: "" });
      alert("Учитель добавлен");
    } catch (err) {
      console.error(err);
      alert("Ошибка добавления учителя");
    }
  };

  const handleAddGroup = async () => {
    if (!newGroup.groupNumber) return alert("Введите номер группы");
    try {
      await axios.post(`${API_BASE_URL}/admin/groups`, newGroup);
      fetchAdminGroups();
      setShowAddGroupForm(false);
      setNewGroup({ groupNumber: "" });
      alert("Группа добавлена");
    } catch (err) {
      console.error(err);
      alert("Ошибка добавления группы");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.groupId)
      return alert("Имя и группа обязательны");
    try {
      await axios.post(`${API_BASE_URL}/admin/students`, {
        name: newStudent.name,
        groupId: newStudent.groupId,
      });
      fetchAdminStudents();
      setShowAddStudentForm(false);
      setNewStudent({ name: "", groupId: 0 });
      alert("Студент успешно добавлен!");
    } catch (err: any) {
      console.error(err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleFacePhotoUpload = async () => {
    if (!selectedFaceStudent) {
      alert("Сначала выберите студента");
      return;
    }

    if (!facePhoto) {
      alert("Выберите фотографию");
      return;
    }

    if (!facePhoto.type.startsWith("image/")) {
      alert("Выберите файл изображения");
      return;
    }

    if (facePhoto.size > 10 * 1024 * 1024) {
      alert("Размер фотографии не должен превышать 10 МБ");
      return;
    }

    const formData = new FormData();
    formData.append("file", facePhoto);

    setUploadingFace(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/students/${selectedFaceStudent.id}/face`,
        formData
      );
      alert(response.data?.message || "Лицо успешно зарегистрировано");
      setSelectedFaceStudent(null);
      setFacePhoto(null);
    } catch (err: any) {
      console.error("Ошибка регистрации лица:", err);
      const message = err.response?.data?.message || err.response?.data?.detail || err.message;
      alert(`Не удалось зарегистрировать лицо: ${message}`);
    } finally {
      setUploadingFace(false);
    }
  };

  const closeFacePhotoModal = () => {
    if (uploadingFace) return;
    setSelectedFaceStudent(null);
    setFacePhoto(null);
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/subjects`);
      const teachersRes = await axios.get(`${API_BASE_URL}/admin/teachers`);
      const teachersMap = new Map();
      teachersRes.data.forEach((t: any) => {
        teachersMap.set(t.name, t.id);
      });

      const normalizedSubjects = res.data.map((s: any) => {
        let teacherId = 0;
        if (s.teacherName && teachersMap.has(s.teacherName)) {
          teacherId = teachersMap.get(s.teacherName);
        }
        return {
          id: Number(s.id),
          name: s.name,
          teacherId: teacherId,
          teacherName: s.teacherName || "Не назначен",
        };
      });
      setSubjects(normalizedSubjects);
    } catch (err) {
      console.error("Ошибка загрузки предметов:", err);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.teacherId) {
      alert("Название и учитель обязательны");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/admin/subjects`, {
        name: newSubject.name,
        teacherId: Number(newSubject.teacherId),
      });
      fetchSubjects();
      setShowAddSubjectForm(false);
      setNewSubject({ name: "", teacherId: 0 });
      alert("Предмет успешно добавлен!");
    } catch (err: any) {
      console.error(err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    }
  };

  // ========== SCHEDULE ACTIONS ==========
  const fetchSchedulesByGroup = async (groupId: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/schedule/group/${groupId}`);
      setSchedules(res.data);
      setSelectedScheduleGroup(groupId);
    } catch (err) {
      console.error("Ошибка загрузки расписания:", err);
      setSchedules([]);
    }
  };

  useEffect(() => {
    if (selectedGroup && selectedSubject && students.length > 0) {
      fetchAttendance(selectedGroup.id, selectedDate);
    }
  }, [selectedGroup, selectedSubject]);

  const handleAddSchedule = async () => {
    try {
      if (
        !newSchedule.subjectId ||
        !newSchedule.groupId ||
        !newSchedule.dayOfWeek ||
        !newSchedule.startTime ||
        !newSchedule.endTime
      ) {
        alert("Заполните все поля");
        return;
      }

      const selectedSubjectObj = subjects.find((s) => s.id === newSchedule.subjectId);
      if (!selectedSubjectObj) {
        alert("Предмет не найден");
        return;
      }

      if (!selectedSubjectObj.teacherId) {
        alert("У выбранного предмета не назначен учитель! Сначала назначьте учителя предмету.");
        return;
      }

      const scheduleData = {
        subjectId: Number(newSchedule.subjectId),
        groupId: Number(newSchedule.groupId),
        teacherId: Number(selectedSubjectObj.teacherId),
        dayOfWeek: newSchedule.dayOfWeek,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        room: newSchedule.room,
      };

      await axios.post(`${API_BASE_URL}/admin/schedule`, scheduleData);
      alert("Расписание добавлено");

      if (selectedScheduleGroup) {
        fetchSchedulesByGroup(selectedScheduleGroup);
      }

      setShowAddScheduleForm(false);
      setNewSchedule({
        subjectId: null,
        groupId: null,
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:30",
        room: "",
      });
    } catch (e: any) {
      console.error(e);
      alert(`Ошибка: ${e.response?.data?.message || e.message}`);
    }
  };

  // ========== TEACHER ACTIONS ==========
  const handleSelectSubject = async (subject: SubjectDTO) => {
    setSelectedSubject(subject);
    setView("teacher-subject");
    setGroups([]);
    setSelectedGroup(null);
    setStudents([]);
    setAttendance({});
    setStudentAnalytics({});
    setLoadingStudentAnalytics({});
    setLessons([]);
    setRating([]);
    setShowRating(false);
    setViewJournal(false);

    try {
      const resGroups = await axios.get<GroupDTO[]>(`${API_BASE_URL}/subjects/${subject.id}/groups`);
      setGroups(resGroups.data);
    } catch (err) {
      console.error("Ошибка загрузки групп:", err);
      alert("Ошибка загрузки групп");
    }
  };

  const fetchStudentsByGroup = async (groupId: number) => {
    if (!selectedSubject) return;
    setShowRating(false);
    setViewJournal(false);
    try {
      const resStudents = await axios.get<StudentDTO[]>(`${API_BASE_URL}/groups/${groupId}/students`);
      const sortedStudents = [...resStudents.data].sort((a, b) => a.name.localeCompare(b.name));
      setStudents(sortedStudents);

      const initial: Record<number, boolean> = {};
      sortedStudents.forEach((s) => {
        initial[s.id] = false;
      });
      setAttendance(initial);

      const group = groups.find((g) => g.id === groupId);
      if (group) setSelectedGroup(group);

      await fetchAttendance(groupId, selectedDate);
      await loadRating();
    } catch (err) {
      console.error("Ошибка загрузки студентов:", err);
      alert("Ошибка загрузки данных студентов");
    }
  };

  const fetchAttendance = async (groupId: number, date: string) => {
    if (!selectedSubject || !students.length) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/attendance/group/${groupId}?subjectId=${selectedSubject.id}&date=${date}`);

      if (res.data && res.data.length > 0) {
        const att: Record<number, boolean> = {};
        res.data.forEach((a: any) => {
          att[a.studentId] = a.present;
        });
        setAttendance(att);
      } else {
        const initial: Record<number, boolean> = {};
        students.forEach((s) => {
          initial[s.id] = false;
        });
        setAttendance(initial);
      }
    } catch (err: any) {
      console.error("Error:", err);
    }
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedGroup || students.length === 0) {
      alert("Выберите предмет, группу и загрузите студентов");
      return;
    }

    try {
      const payload = students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        groupId: selectedGroup.id,
        subjectId: selectedSubject.id,
        present: attendance[s.id] || false,
        date: selectedDate,
      }));

      await axios.post(`${API_BASE_URL}/attendance/saveAll`, payload);
      alert("Посещаемость успешно сохранена");

      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchAttendance(selectedGroup.id, selectedDate);
      await loadRating();
    } catch (err: any) {
      console.error("Ошибка сохранения:", err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
    }
  };

  const loadRating = async () => {
    if (!selectedSubject || !selectedGroup) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/analytics/rating`, {
        params: {
          subjectId: selectedSubject.id,
          groupId: selectedGroup.id,
        },
      });
      setRating(res.data);
    } catch (err) {
      console.error("Ошибка загрузки рейтинга:", err);
    }
  };

  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (selectedGroup) {
      await fetchAttendance(selectedGroup.id, newDate);
    }
  };

  const fetchStudentAnalytics = async (studentId: number) => {
    if (!selectedSubject || !selectedGroup) {
      alert("Выберите предмет и группу");
      return;
    }

    setLoadingStudentAnalytics((prev) => ({ ...prev, [studentId]: true }));
    try {
      const res = await axios.get<StudentAnalyticsDTO>(`${API_BASE_URL}/analytics/student/${studentId}`, {
        params: {
          subjectId: selectedSubject.id,
          groupId: selectedGroup.id,
        },
      });
      setStudentAnalytics((prev) => ({ ...prev, [studentId]: res.data }));
    } catch (err: any) {
      console.error("Ошибка загрузки аналитики:", err);
      alert(`Ошибка: ${err.response?.data?.message || err.message}`);
      setStudentAnalytics((prev) => ({ ...prev, [studentId]: null }));
    } finally {
      setLoadingStudentAnalytics((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const hideStudentAnalytics = (studentId: number) => {
    setStudentAnalytics((prev) => ({ ...prev, [studentId]: null }));
  };

  // ========== JOURNAL ACTIONS ==========
  const loadJournal = async () => {
    if (!selectedSubject || !selectedGroup) {
      alert("Выберите предмет и группу");
      return;
    }

    setLoadingJournal(true);
    try {
      // 1. Получаем все даты занятий
      const lessonsRes = await axios.get(`${API_BASE_URL}/subjects/${selectedSubject.id}/groups/${selectedGroup.id}/lessons`);
      const dates = lessonsRes.data.map((l: any) => l.date).sort();
      setJournalDates(dates);
      console.log("Dates:", dates);

      // 2. Получаем всех студентов группы и сортируем по алфавиту
      const studentsRes = await axios.get<StudentDTO[]>(`${API_BASE_URL}/groups/${selectedGroup.id}/students`);
      const studentsList = [...studentsRes.data].sort((a, b) => a.name.localeCompare(b.name));

      // 3. Получаем аналитику (рейтинг) для процентов посещаемости
      const ratingRes = await axios.get(`${API_BASE_URL}/analytics/rating`, {
        params: {
          subjectId: selectedSubject.id,
          groupId: selectedGroup.id,
        },
      });
      const ratingData = ratingRes.data as StudentAnalyticsDTO[];
      const analyticsMap = new Map<number, StudentAnalyticsDTO>();
      ratingData.forEach(r => analyticsMap.set(r.studentId, r));

      // 4. Для каждой даты получаем посещаемость через API /attendance/group
      const records: JournalRecord[] = [];

      for (const student of studentsList) {
        const attendanceByDate: Record<string, boolean> = {};
        let attendedCount = 0;

        for (const date of dates) {
          try {
            // Используем существующий API
            const attendanceRes = await axios.get(`${API_BASE_URL}/attendance/group/${selectedGroup.id}`, {
              params: {
                subjectId: selectedSubject.id,
                date: date,
              },
            });
            
            const attendanceList = attendanceRes.data;
            const studentAttendance = attendanceList.find((a: any) => a.studentId === student.id);
            const isPresent = studentAttendance?.present || false;
            
            attendanceByDate[date] = isPresent;
            if (isPresent) attendedCount++;
            console.log(`Student ${student.name} on ${date}: ${isPresent}`);
          } catch (e) {
            console.error(`Error getting attendance for ${student.name} on ${date}:`, e);
            attendanceByDate[date] = false;
          }
        }

        const analytics = analyticsMap.get(student.id);
        const attendancePercent = analytics?.individualPercent || (dates.length > 0 ? (attendedCount / dates.length) * 100 : 0);
        const totalCount = analytics?.totalLessons || dates.length;

        records.push({
          studentId: student.id,
          studentName: student.name,
          attendanceByDate,
          attendancePercent,
          attendedCount: analytics?.attendedLessons || attendedCount,
          totalCount: totalCount,
        });
      }

      setJournalData(records);
      setViewJournal(true);
    } catch (err) {
      console.error("Ошибка загрузки журнала:", err);
      alert("Не удалось загрузить данные журнала");
    } finally {
      setLoadingJournal(false);
    }
  };

  const downloadPDFReport = async () => {
  if (journalData.length === 0 || journalDates.length === 0) {
    alert("Нет данных для отчета");
    return;
  }

  // Создаем временный элемент для рендера
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '-9999px';
  element.style.backgroundColor = 'white';
  element.style.padding = '20px';
  element.style.width = '1200px';
  element.style.fontFamily = 'Arial, sans-serif';
  
  // Заполняем содержимым
  element.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0 0 5px 0;">Журнал посещаемости</h2>
      <p style="margin: 3px 0;"><strong>${selectedSubject?.name}</strong> — группа ${selectedGroup?.groupNumber}</p>
      <p style="margin: 3px 0; font-size: 12px; color: #666;">Дата: ${new Date().toLocaleString('ru-RU')}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #4f46e5; color: white;">
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Студент</th>
          ${journalDates.map(date => {
            const d = new Date(date);
            return `<th style="border: 1px solid #ccc; padding: 8px; text-align: center;">${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}</th>`;
          }).join('')}
          <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">%</th>
        </tr>
      </thead>
      <tbody>
        ${journalData.map(record => {
          let percentColor = record.attendancePercent >= 75 ? '#4caf50' : (record.attendancePercent >= 50 ? '#ff9800' : '#f44336');
          return `
            <tr>
              <td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">${record.studentName}</td>
              ${journalDates.map(date => `
                <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-size: 16px; color: ${record.attendanceByDate[date] ? '#4caf50' : '#f44336'};">
                  ${record.attendanceByDate[date] ? '✓' : '✗'}
                </td>
              `).join('')}
              <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">
                <strong style="color: ${percentColor};">${record.attendancePercent.toFixed(1)}%</strong>
                <br/><span style="font-size: 10px;">(${record.attendedCount}/${record.totalCount})</span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div style="margin-top: 15px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
      <p style="margin: 3px 0;"><strong>Статистика:</strong> Студентов: ${journalData.length} | Занятий: ${journalDates.length}</p>
      ${(() => {
        let totalPresent = 0, totalPossible = 0;
        journalData.forEach(record => {
          totalPresent += record.attendedCount;
          totalPossible += record.totalCount;
        });
        const totalPercent = totalPossible > 0 ? (totalPresent / totalPossible * 100).toFixed(1) : "0";
        return `<p style="margin: 3px 0;">Общая посещаемость: ${totalPresent}/${totalPossible} (${totalPercent}%)</p>`;
      })()}
    </div>
    <div style="margin-top: 15px; text-align: center; font-size: 10px; color: #999;">
      Система учёта посещаемости • Сгенерировано автоматически
    </div>
  `;
  
  document.body.appendChild(element);
  
  try {
    // Рендерим в canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    // Создаем PDF
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = doc.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    doc.save(`Журнал_${selectedSubject?.name}_${selectedGroup?.groupNumber}.pdf`);
    
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Не удалось создать PDF");
  } finally {
    document.body.removeChild(element);
  }
};

  const getDayOfWeekRu = (day: string) => {
    const days: Record<string, string> = {
      MONDAY: "Понедельник",
      TUESDAY: "Вторник",
      WEDNESDAY: "Среда",
      THURSDAY: "Четверг",
      FRIDAY: "Пятница",
      SATURDAY: "Суббота",
      SUNDAY: "Воскресенье",
    };
    return days[day] || day;
  };

  const MetricCard = ({
    title,
    value,
    attended = 0,
    total = 0,
    color = "#e3f2fd",
    textColor = "#1976d2",
  }: {
    title: string;
    value: number;
    attended?: number;
    total?: number;
    color?: string;
    textColor?: string;
  }) => (
    <div style={{ padding: 12, background: color, borderRadius: 8, flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: textColor }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", color: value >= 80 ? "#4caf50" : value >= 60 ? "#ff9800" : "#f44336" }}>
        {value !== undefined && value !== null ? value.toFixed(1) : 0}%
      </div>
      {total > 0 && (
        <div style={{ fontSize: 10, color: "#666" }}>
          {attended}/{total} занятий
        </div>
      )}
    </div>
  );

  // ========== RENDER ==========
  if (view === "login") {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h2>Добро пожаловать</h2>
            <p>Войдите в систему учёта посещаемости</p>
          </div>
          <div className="login-form">
            <div className="input-group">
              <label>Имя пользователя</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Введите имя" />
            </div>
            <div className="input-group">
              <label>Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="··········" onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <button className="login-btn" onClick={handleLogin}>Войти в систему →</button>
          </div>
        </div>
      </div>
    );
  }

  if (role === "TEACHER" && view === "subjects") {
    return (
      <div className="container">
        <h3>Ваши предметы</h3>
        <SubjectList subjects={teacherSubjects} onSelect={handleSelectSubject} />
        <button onClick={handleLogout}>Выйти</button>
      </div>
    );
  }

  if (role === "TEACHER" && view === "analytics" && selectedSubject && selectedGroup) {
    return (
      <div className="container">
        <button onClick={() => setView("teacher-subject")}>← Назад к предмету</button>
        <AnalyticsPage subjectId={selectedSubject.id} groupId={selectedGroup.id} subjectName={selectedSubject.name} groupNumber={selectedGroup.groupNumber} />
        <button onClick={handleLogout} style={{ marginTop: 20 }}>Выйти</button>
      </div>
    );
  }

  if (role === "TEACHER" && view === "rating" && selectedSubject && selectedGroup) {
    return (
      <div className="container">
        <button onClick={() => setView("teacher-subject")}>← Назад к предмету</button>
        <h2>Рейтинг студентов</h2>
        <h3>{selectedSubject.name} — группа {selectedGroup.groupNumber}</h3>
        {rating.length > 0 ? (
          <table className="attendance-table">
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Место</th>
                <th style={{ textAlign: "center" }}>Студент</th>
                <th style={{ textAlign: "center" }}>Посещаемость</th>
                <th style={{ textAlign: "center" }}>Посетил / Всего</th>
              </tr>
            </thead>
            <tbody>
              {rating.map((r, idx) => (
                <tr key={r.studentId}>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                  <td style={{ textAlign: "center" }}>{r.studentName}</td>
                  <td style={{ textAlign: "center" }}><strong style={{ color: "#4caf50" }}>{r.individualPercent.toFixed(1)}%</strong></td>
                  <td style={{ textAlign: "center" }}>{r.attendedLessons} / {r.totalLessons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет данных для формирования рейтинга</p>
        )}
        <button onClick={handleLogout} style={{ marginTop: 20 }}>Выйти</button>
      </div>
    );
  }

  if (role === "TEACHER" && view === "teacher-subject" && selectedSubject && !viewJournal) {
    return (
      <div className="container">
        <h2>{selectedSubject.name}</h2>
        <div style={{ marginBottom: 20, display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setView("subjects")} className="btn-back">← Назад к предметам</button>
          {selectedGroup && <button onClick={() => setView("analytics")} className="btn-analytics">Групповая аналитика</button>}
          {selectedGroup && <button onClick={() => { setView("rating"); loadRating(); }} className="btn-rating">Рейтинг студентов</button>}
          {selectedGroup && <button onClick={loadJournal} className="btn-journal">Журнал</button>}
        </div>

        {scannerMode && selectedGroup && selectedSubject && (
          <div style={{ marginBottom: 30, border: "2px solid #4caf50", borderRadius: 8, padding: 20, backgroundColor: "#f9f9f9" }}>
            <h3>Сканирование QR-кодов</h3>
            <TeacherQRScanner groupId={selectedGroup.id} subjectId={selectedSubject.id} />
          </div>
        )}

        <h3>Группы</h3>
        {groups.length > 0 ? (
          groups.map((g) => (
            <div key={g.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: "10px" }}>
              <strong>{g.groupNumber}</strong>
              <button onClick={() => fetchStudentsByGroup(g.id)} className="btn-primary">Загрузить студентов</button>
            </div>
          ))
        ) : (
          <p>Нет доступных групп для этого предмета. Сначала добавьте расписание.</p>
        )}

        {selectedGroup && (
          <>
            <h3>Выберите дату:</h3>
            <input type="date" value={selectedDate} onChange={handleDateChange} style={{ marginBottom: 20, padding: 8 }} />
          </>
        )}

        {students.length > 0 && (
          <>
            <h3>Студенты группы {selectedGroup?.groupNumber}</h3>
            <div style={{ marginBottom: 10, color: "#666" }}>
              Дата: {selectedDate} | Студентов: {students.length} | Отмечено: {Object.values(attendance).filter((v) => v).length}
            </div>

            <table className="attendance-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>Имя</th>
                  <th style={{ textAlign: "center" }}>Присутствие</th>
                  <th style={{ textAlign: "center" }}>СКУД</th>
                  <th style={{ textAlign: "center" }}>Уваж. причина</th>
                  <th style={{ textAlign: "center" }}>Аналитика</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const analytics = studentAnalytics[s.id];
                  const hasAnalytics = analytics && typeof analytics === "object";
                  const isLoading = loadingStudentAnalytics[s.id];
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>{s.name}</td>
                      <td style={{ textAlign: "center" }}>
                        <input type="checkbox" checked={attendance[s.id] || false} onChange={() => toggleAttendance(s.id)} style={{ transform: "scale(1.5)" }} />
                        <div style={{ fontSize: 12, color: attendance[s.id] ? "#4caf50" : "#f44336", marginTop: "4px" }}>
                          {attendance[s.id] ? "Присутствует" : "Отсутствует"}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input type="checkbox" checked={skudAttendance[s.id] || false} onChange={() => toggleSkudAttendance(s.id)} style={{ transform: "scale(1.5)" }} />
                        <div style={{ fontSize: 12, color: skudAttendance[s.id] ? "#2196f3" : "#999", marginTop: "4px" }}>
                          {skudAttendance[s.id] ? "По СКУД" : "Нет отметки"}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input type="checkbox" checked={excusedAttendance[s.id] || false} onChange={() => toggleExcusedAttendance(s.id)} style={{ transform: "scale(1.5)" }} />
                        <div style={{ fontSize: 12, color: excusedAttendance[s.id] ? "#ff9800" : "#999", marginTop: "4px" }}>
                          {excusedAttendance[s.id] ? "Да" : "Нет"}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          {!hasAnalytics && !isLoading ? (
                            <button onClick={() => fetchStudentAnalytics(s.id)} className="btn-primary" style={{ whiteSpace: "nowrap" }}>Показать аналитику</button>
                          ) : isLoading ? (
                            <button disabled className="btn-warning">Загрузка...</button>
                          ) : (
                            <button onClick={() => hideStudentAnalytics(s.id)} className="btn-secondary">Скрыть аналитику</button>
                          )}
                          {hasAnalytics && analytics && (
                            <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc", width: "100%", minWidth: "280px", textAlign: "left" }}>
                              <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                                <MetricCard title="Индивидуальная посещаемость" value={analytics.individualPercent || 0} attended={analytics.attendedLessons || 0} total={analytics.totalLessons || 0} />
                                <MetricCard title="Средняя по группе" value={analytics.groupPercent || 0} color="#f3e5f5" textColor="#7b1fa2" />
                                <div style={{ padding: "12px", background: "#e8f5e9", borderRadius: "8px", flex: 1, minWidth: "120px" }}>
                                  <div style={{ fontSize: "12px", color: "#388e3c" }}>Статус</div>
                                  <div style={{ fontSize: "18px", fontWeight: "bold", color: analytics.individualPercent >= 90 ? "#4caf50" : analytics.individualPercent >= 70 ? "#ff9800" : "#f44336" }}>
                                    {analytics.individualPercent >= 90 ? "Отлично" : analytics.individualPercent >= 70 ? "Средне" : "Низко"}
                                  </div>
                                </div>
                              </div>
                              {analytics.dynamics && Object.keys(analytics.dynamics).length > 0 && (
                                <div>
                                  <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>Динамика посещаемости:</div>
                                  <div style={{ height: "200px" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={Object.entries(analytics.dynamics).map(([date, rate]) => ({ date, rate: rate || 0 }))}>
                                        <CartesianGrid stroke="#eee" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={40} />
                                        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                        <Tooltip formatter={(v) => [`${v}%`, "Посещаемость"]} />
                                        <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: 20, display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={saveAttendance} className="btn-success">Сохранить посещаемость</button>
              <button onClick={() => { const reset: Record<number, boolean> = {}; students.forEach((s) => { reset[s.id] = false; }); setAttendance(reset); }} className="btn-danger">Сбросить все</button>
              <button onClick={() => { const all: Record<number, boolean> = {}; students.forEach((s) => { all[s.id] = true; }); setAttendance(all); }} className="btn-primary">Все присутствуют</button>
            </div>
          </>
        )}
        <button onClick={handleLogout} className="btn-back" style={{ marginTop: 20 }}>Выйти</button>
      </div>
    );
  }

  // ЭКРАН ЖУРНАЛА
  if (role === "TEACHER" && viewJournal && selectedSubject && selectedGroup) {
    return (
      <div className="container">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Журнал посещаемости</h2>
              <p style={{ color: "#64748b", marginTop: 5, fontSize: "0.85rem" }}>{selectedSubject?.name} — группа {selectedGroup?.groupNumber}</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={downloadPDFReport} className="btn-success" style={{ backgroundColor: "#dc2626", padding: "6px 12px", fontSize: "13px", height: "36px" }}>Скачать PDF</button>
              <button onClick={() => setViewJournal(false)} className="btn-back" style={{ padding: "6px 12px", fontSize: "13px", height: "36px" }}>← Назад</button>
            </div>
          </div>

          {loadingJournal ? (
            <div style={{ textAlign: "center", padding: 50 }}><p>Загрузка данных журнала...</p></div>
          ) : (
            <>
              <div style={{ overflowX: "auto", fontSize: "13px" }}>
                <table className="attendance-table" style={{ minWidth: 500, fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ position: "sticky", left: 0, backgroundColor: "#f8fafc", zIndex: 1, minWidth: 130, fontSize: "12px", padding: "8px 6px" }}>Студент</th>
                      {journalDates.map(date => (
                        <th key={date} style={{ textAlign: "center", minWidth: 55, fontSize: "11px", padding: "8px 4px", fontWeight: 500 }}>
                          {new Date(date).toLocaleDateString().slice(0, 5)}
                        </th>
                      ))}
                      <th style={{ textAlign: "center", minWidth: 70, backgroundColor: "#e8f5e9", fontSize: "12px", padding: "8px 6px" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalData.map(record => {
                      let percentColor = "#4caf50";
                      if (record.attendancePercent < 50) percentColor = "#f44336";
                      else if (record.attendancePercent < 75) percentColor = "#ff9800";
                      return (
                        <tr key={record.studentId} style={{ fontSize: "12px" }}>
                          <td style={{ position: "sticky", left: 0, backgroundColor: "white", fontWeight: 500, borderRight: "1px solid #e2e8f0", padding: "6px 8px" }}>
                            {record.studentName}
                          </td>
                          {journalDates.map(date => (
                            <td key={date} style={{ textAlign: "center", fontSize: "16px", padding: "4px 2px" }}>
                              {record.attendanceByDate[date] ? 
                                <span style={{ color: "#4caf50", fontSize: "18px" }}>✓</span> : 
                                <span style={{ color: "#f44336", fontSize: "18px" }}>✗</span>
                              }
                            </td>
                          ))}
                          <td style={{ textAlign: "center", fontWeight: "bold", backgroundColor: "#faf9fe", color: percentColor, padding: "6px 4px" }}>
                            {record.attendancePercent.toFixed(0)}%
                            <div style={{ fontSize: "9px", fontWeight: "normal", color: "#999" }}>
                              {record.attendedCount}/{record.totalCount}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: "13px" }}>
                  <div>Студентов: <strong>{journalData.length}</strong></div>
                  <div>Занятий: <strong>{journalDates.length}</strong></div>
                  {(() => {
                    let totalPresent = 0;
                    let totalPossible = 0;
                    journalData.forEach(record => {
                      totalPresent += record.attendedCount;
                      totalPossible += record.totalCount;
                    });
                    const totalPercent = totalPossible > 0 ? (totalPresent / totalPossible * 100).toFixed(1) : "0";
                    let totalColor = "#4caf50";
                    if (parseFloat(totalPercent) < 50) totalColor = "#f44336";
                    else if (parseFloat(totalPercent) < 75) totalColor = "#ff9800";
                    return (
                      <div>Общая: <strong style={{ color: totalColor }}>{totalPercent}%</strong> ({totalPresent}/{totalPossible})</div>
                    );
                  })()}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: "11px", color: "#888" }}>
                <span style={{ color: "#4caf50" }}>✓</span> — был
                <span style={{ color: "#f44336", marginLeft: 8 }}>✗</span> — не был
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (role === "ADMIN") {
    return (
      <div className="container">
        <h2>Админ-панель</h2>
        <button onClick={handleLogout} className="btn-danger">Выйти</button>

        <h3>Преподаватели</h3>
        <button onClick={() => setShowAddTeacherForm(!showAddTeacherForm)} className="btn-primary">Добавить преподавателя</button>
        {showAddTeacherForm && (
          <div className="add-form">
            <input placeholder="Имя" value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} />
            <input placeholder="Пароль" value={newTeacher.password} onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} />
            <button onClick={handleAddTeacher} className="btn-success">Сохранить</button>
          </div>
        )}
        <ul>{teachers.map((t) => (<li key={t.id}>{t.name}</li>))}</ul>

        <h3>Группы</h3>
        <button onClick={() => setShowAddGroupForm(!showAddGroupForm)} className="btn-primary">Добавить группу</button>
        {showAddGroupForm && (
          <div className="add-form">
            <input placeholder="Номер группы" value={newGroup.groupNumber} onChange={(e) => setNewGroup({ ...newGroup, groupNumber: e.target.value })} />
            <button onClick={handleAddGroup} className="btn-success">Сохранить</button>
          </div>
        )}
        <ul>{adminGroups.map((g) => (<li key={g.id}>{g.groupNumber} <button onClick={() => fetchAdminStudentsByGroup(g.id)} className="btn-secondary">Студенты</button></li>))}</ul>

        <h3>Студенты</h3>
        <button onClick={() => setShowAddStudentForm(!showAddStudentForm)} className="btn-primary">Добавить студента</button>
        {showAddStudentForm && (
          <div className="add-form">
            <input placeholder="Имя" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
            <select value={newStudent.groupId} onChange={(e) => setNewStudent({ ...newStudent, groupId: Number(e.target.value) })}>
              <option value={0}>Выберите группу</option>
              {adminGroups.map((g) => (<option key={g.id} value={g.id}>{g.groupNumber}</option>))}
            </select>
            <button onClick={handleAddStudent} className="btn-success">Сохранить</button>
          </div>
        )}
        <ul>
          {adminStudents.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <span>{s.name}</span>{" "}
              <button
                onClick={() => {
                  setSelectedFaceStudent(s);
                  setFacePhoto(null);
                }}
                className="btn-secondary"
                style={{ marginLeft: 8 }}
              >
                Загрузить фото лица
              </button>
            </li>
          ))}
        </ul>

        {selectedFaceStudent && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) closeFacePhotoModal();
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="face-upload-title"
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 24,
                width: "100%",
                maxWidth: 440,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              }}
            >
              <h3 id="face-upload-title" style={{ marginTop: 0 }}>
                Регистрация лица студента
              </h3>
              <p style={{ marginBottom: 16 }}>
                Студент: <strong>{selectedFaceStudent.name}</strong>
              </p>
              <label htmlFor="student-face-photo" style={{ display: "block", marginBottom: 8 }}>
                Выберите фотографию (до 10 МБ)
              </label>
              <input
                id="student-face-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setFacePhoto(e.target.files?.[0] || null)}
                disabled={uploadingFace}
                style={{ display: "block", width: "100%", marginBottom: 16 }}
              />
              {facePhoto && (
                <p style={{ fontSize: 13, color: "#555", overflowWrap: "anywhere" }}>
                  Выбран файл: {facePhoto.name}
                </p>
              )}
              <p style={{ fontSize: 13, color: "#666" }}>
                На фотографии должно быть хорошо видно лицо только одного человека.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={closeFacePhotoModal}
                  className="btn-secondary"
                  disabled={uploadingFace}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleFacePhotoUpload}
                  className="btn-success"
                  disabled={!facePhoto || uploadingFace}
                >
                  {uploadingFace ? "Загрузка..." : "Загрузить и зарегистрировать"}
                </button>
              </div>
            </div>
          </div>
        )}

        <h3>Предметы</h3>
        <button onClick={() => setShowAddSubjectForm(!showAddSubjectForm)} className="btn-primary">Добавить предмет</button>
        {showAddSubjectForm && (
          <div className="add-form">
            <input placeholder="Название предмета" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} />
            <select value={newSubject.teacherId} onChange={(e) => setNewSubject({ ...newSubject, teacherId: Number(e.target.value) })}>
              <option value={0}>Выберите учителя</option>
              {teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            <button onClick={handleAddSubject} className="btn-success">Сохранить</button>
          </div>
        )}
        <ul>{subjects.map((s) => (<li key={s.id}><strong>{s.name}</strong> — {s.teacherName || "Нет учителя"}</li>))}</ul>

        <h3>Расписание</h3>
        <div>
          <label>Выберите группу: </label>
          <select value={selectedScheduleGroup || 0} onChange={(e) => fetchSchedulesByGroup(Number(e.target.value))}>
            <option value={0}>-- Выберите группу --</option>
            {adminGroups.map((g) => (<option key={g.id} value={g.id}>{g.groupNumber}</option>))}
          </select>
        </div>

        {selectedScheduleGroup && schedules.length > 0 && (
          <table className="schedule-table">
            <thead><tr><th>День</th><th>Время</th><th>Предмет</th><th>Преподаватель</th><th>Аудитория</th></tr></thead>
            <tbody>
              {schedules.map((s) => (<tr key={s.id}><td>{getDayOfWeekRu(s.dayOfWeek)}</td>
                  <td>{s.startTime.substring(0,5)} - {s.endTime.substring(0,5)}</td>
                  <td>{s.subjectName}</td>
                  <td>{s.teacherName}</td>
                  <td>{s.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selectedScheduleGroup && schedules.length === 0 && <p>Нет расписания для этой группы</p>}

        <button onClick={() => setShowAddScheduleForm(!showAddScheduleForm)} className="btn-primary" style={{ marginTop: 10 }}>Добавить пару</button>

        {showAddScheduleForm && (
          <div className="add-form">
            <select value={newSchedule.subjectId || 0} onChange={(e) => setNewSchedule({ ...newSchedule, subjectId: Number(e.target.value) })}>
              <option value={0}>Выберите предмет</option>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name} ({s.teacherName || "Нет учителя"})</option>))}
            </select>
            <select value={newSchedule.groupId || 0} onChange={(e) => setNewSchedule({ ...newSchedule, groupId: Number(e.target.value) })}>
              <option value={0}>Выберите группу</option>
              {adminGroups.map((g) => (<option key={g.id} value={g.id}>{g.groupNumber}</option>))}
            </select>
            <select value={newSchedule.dayOfWeek} onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value })}>
              <option value="MONDAY">Понедельник</option>
              <option value="TUESDAY">Вторник</option>
              <option value="WEDNESDAY">Среда</option>
              <option value="THURSDAY">Четверг</option>
              <option value="FRIDAY">Пятница</option>
              <option value="SATURDAY">Суббота</option>
            </select>
            <input type="time" value={newSchedule.startTime} onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })} />
            <input type="time" value={newSchedule.endTime} onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })} />
            <input placeholder="Аудитория" value={newSchedule.room} onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })} />
            <button onClick={handleAddSchedule} className="btn-success">Сохранить</button>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default App;