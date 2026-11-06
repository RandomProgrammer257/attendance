import axios from 'axios';

const API_URL = '/api'; // ваш бэк

export const getSubjectsByTeacher = async (teacherId: number) => {
  const res = await axios.get(`${API_URL}/teacher/${teacherId}/subjects`);
  return res.data;
};

export const getGroupsBySubject = async (subjectId: number) => {
  const res = await axios.get(`${API_URL}/subject/${subjectId}/groups`);
  return res.data;
};

export const getAttendance = async (groupId: number, subjectId: number) => {
  const res = await axios.get(`${API_URL}/attendance?groupId=${groupId}&subjectId=${subjectId}`);
  return res.data;
};

export const updateAttendance = async (attendanceId: number, present: boolean) => {
  const res = await axios.put(`${API_URL}/attendance/${attendanceId}`, { present });
  return res.data;
};
