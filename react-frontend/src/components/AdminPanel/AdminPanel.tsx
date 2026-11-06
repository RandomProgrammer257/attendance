import React, { useState } from "react";
import axios from "axios";
import { TeacherDTO, GroupDTO, StudentDTO, ScheduleDTO } from "../../models";

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [view, setView] = useState<
    "buttons" | "teachers" | "groups" | "students" | "schedules"
  >("buttons");

  const [teachers, setTeachers] = useState<TeacherDTO[]>([]);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDTO | null>(null);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: schedules
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);

  const [newSchedule, setNewSchedule] = useState<ScheduleDTO>({
    subjectId: 0,
    groupId: 0,
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "10:30",
    room: "",
  });

  const API_BASE_URL = "/api/api/admin";

  // ---------- EXISTING ----------
  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await axios.get<TeacherDTO>(`${API_BASE_URL}/teachers`);
      setTeachers(res.data as any);
      setView("teachers");
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке учителей");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get<GroupDTO[]>(`${API_BASE_URL}/groups`);
      setGroups(res.data);
      setView("groups");
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке групп");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (group: GroupDTO) => {
    setLoading(true);
    setSelectedGroup(group);
    try {
      const res = await axios.get<StudentDTO[]>(
        `${API_BASE_URL}/groups/${group.id}/students`
      );
      setStudents(res.data);
      setView("students");
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке студентов");
    } finally {
      setLoading(false);
    }
  };

  // ---------- NEW: SCHEDULE ----------
  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/schedules`);
      setSchedules(res.data);
    } catch (err) {
      console.error("Ошибка загрузки расписания:", err);
      alert("Ошибка загрузки расписания");
    }
  };

  const handleAddSchedule = async () => {
    try {
      await axios.post(`${API_BASE_URL}/schedules`, newSchedule);
      fetchSchedules();
      setShowAddScheduleForm(false);
    } catch (err) {
      console.error(err);
      alert("Ошибка добавления расписания");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/schedules/${id}`);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления");
    }
  };

  // ---------- RENDER ----------

  if (view === "buttons") {
    return (
      <div className="admin-panel">
        <h2>Админ-панель</h2>

        <button onClick={loadTeachers}>Учителя</button>
        <button onClick={loadGroups}>Студенты</button>

        {/* ✅ NEW */}
        <button
          onClick={() => {
            fetchSchedules();
            setView("schedules");
          }}
        >
          Расписание
        </button>

        <button onClick={onLogout}>Выйти</button>
      </div>
    );
  }

  if (view === "teachers") {
    return (
      <div>
        <h3>Список учителей</h3>
        <ul>
          {teachers.map(t => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
        <button onClick={() => setView("buttons")}>← Назад</button>
      </div>
    );
  }

  if (view === "groups") {
    return (
      <div>
        <h3>Группы студентов</h3>
        <ul>
          {groups.map(g => (
            <li key={g.id}>
              <button onClick={() => loadStudents(g)}>
                {g.groupNumber}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => setView("buttons")}>← Назад</button>
      </div>
    );
  }

  if (view === "students" && selectedGroup) {
    return (
      <div>
        <h3>Студенты группы {selectedGroup.groupNumber}</h3>
        <ul>
          {students.map(s => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
        <button onClick={() => setView("groups")}>← Назад</button>
      </div>
    );
  }

  // ✅ NEW VIEW
  if (view === "schedules") {
    return (
      <div className="admin-panel">
        <h2>Расписание</h2>

        <button onClick={() => setShowAddScheduleForm(true)}>
          + Добавить занятие
        </button>

        {showAddScheduleForm && (
          <div>
            <input
              type="number"
              placeholder="ID предмета"
              onChange={e =>
                setNewSchedule({
                  ...newSchedule,
                  subjectId: +e.target.value
                })
              }
            />

            <input
              type="number"
              placeholder="ID группы"
              onChange={e =>
                setNewSchedule({
                  ...newSchedule,
                  groupId: +e.target.value
                })
              }
            />

            <select
              onChange={e =>
                setNewSchedule({
                  ...newSchedule,
                  dayOfWeek: e.target.value
                })
              }
            >
              <option value="MONDAY">Понедельник</option>
              <option value="TUESDAY">Вторник</option>
              <option value="WEDNESDAY">Среда</option>
              <option value="THURSDAY">Четверг</option>
              <option value="FRIDAY">Пятница</option>
            </select>

            <input
              type="time"
              onChange={e =>
                setNewSchedule({
                  ...newSchedule,
                  startTime: e.target.value
                })
              }
            />

            <input
              type="time"
              onChange={e =>
                setNewSchedule({
                  ...newSchedule,
                  endTime: e.target.value
                })
              }
            />

            <input
              placeholder="Аудитория"
              onChange={e =>
                setNewSchedule({
                  ...newSchedule,
                  room: e.target.value
                })
              }
            />

            <button onClick={handleAddSchedule}>Сохранить</button>
          </div>
        )}

        <ul>
          {schedules.map(s => (
            <li key={s.id}>
              {s.dayOfWeek} | {s.startTime}-{s.endTime} | ауд. {s.room}
              <button onClick={() => handleDeleteSchedule(s.id!)}>❌</button>
            </li>
          ))}
        </ul>

        <button onClick={() => setView("buttons")}>← Назад</button>
      </div>
    );
  }

  return null;
};