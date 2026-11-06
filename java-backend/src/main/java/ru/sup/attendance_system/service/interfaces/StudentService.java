package ru.sup.attendance_system.service.interfaces;

import ru.sup.attendance_system.dto.AttendanceDTO;
import ru.sup.attendance_system.dto.CreateStudentRequest;
import ru.sup.attendance_system.dto.StudentDTO;
import ru.sup.attendance_system.dto.SubjectDTO;
import ru.sup.attendance_system.entity.Student;

import java.util.List;

public interface StudentService {
    // получение студентов по группе
    List<Student> getStudentsByGroup(Long groupId);

    // создание студента через DTO
    StudentDTO saveStudent(StudentDTO studentDTO);

    // удаление студента
    void deleteStudent(Long id);

    // получение студента по id
    Student getStudentById(Long studentId);

    // предметы студента
    List<SubjectDTO> getSubjectsForStudent(Long studentId);

    // посещаемость по предмету
    List<AttendanceDTO> getAttendanceForSubject(Long studentId, Long subjectId);

    List<StudentDTO> getAllStudents();
    StudentDTO addStudent(CreateStudentRequest request);
}
