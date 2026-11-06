import React, { useEffect, useState } from 'react';
import { getSubjectsByTeacher, getGroupsBySubject } from '../api/attendanceApi';
import AttendanceTable from '../components/AttendanceTable';

const teacherId = 1; // можно получать из авторизации

const Dashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  useEffect(() => {
    getSubjectsByTeacher(teacherId).then(setSubjects);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      getGroupsBySubject(selectedSubject).then(setGroups);
    }
  }, [selectedSubject]);

  return (
    <div>
      <h1>Список предметов</h1>
      {subjects.map(s => (
        <button key={s.id} onClick={() => setSelectedSubject(s.id)}>
          {s.name}
        </button>
      ))}

      {groups.length > 0 && (
        <>
          <h2>Выберите группу</h2>
          {groups.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g.id)}>
              {g.name}
            </button>
          ))}
        </>
      )}

      {selectedGroup && selectedSubject && (
        <AttendanceTable groupId={selectedGroup} subjectId={selectedSubject} />
      )}
    </div>
  );
};

export default Dashboard;
