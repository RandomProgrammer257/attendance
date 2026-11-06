// src/components/AttendancePage/AttendancePage.tsx
import React, { useState } from "react";
import { SubjectDTO, GroupDTO, StudentDTO, AttendanceDTO } from "../../models";

export interface AttendancePageProps {
  subject: SubjectDTO;
  group: GroupDTO;
  onBack: () => void;
  students: StudentDTO[]; // <--- добавляем сюда
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  subject,
  group,
  onBack,
  students,
}) => {
  const [attendance, setAttendance] = useState<Record<number, boolean>>(
    () => {
      const initial: Record<number, boolean> = {};
      students.forEach((s) => (initial[s.id] = false));
      return initial;
    }
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const saveAttendance = async () => {
    try {
      const payload: AttendanceDTO[] = students.map((s) => ({
        studentId: s.id,
        subjectId: subject.id,
        present: attendance[s.id] || false,
        date: selectedDate,
        type: "лекция",
      }));

      const res = await fetch(`/api/api/attendance/saveAll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Ошибка при сохранении");
      alert("Посещаемость сохранена ✅");
    } catch (err) {
      console.error(err);
      alert("Ошибка при сохранении ❌");
    }
  };

  return (
    <div className="container">
      <h2>
        Посещаемость — {group.groupNumber} ({selectedDate})
      </h2>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Выберите дату:{" "}
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      <table>
        <thead>
          <tr>
            <th>Студент</th>
            <th>{selectedDate}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={attendance[s.id] || false}
                  onChange={() => toggleAttendance(s.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "10px" }}>
        <button onClick={saveAttendance}>💾 Сохранить</button>
        <button onClick={onBack} style={{ marginLeft: "10px" }}>
          ← Назад
        </button>
      </div>
    </div>
  );
};
