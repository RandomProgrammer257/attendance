package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.dto.AttendanceDTO;
import ru.sup.attendance_system.dto.CreateStudentRequest;
import ru.sup.attendance_system.dto.SubjectDTO;
import ru.sup.attendance_system.dto.StudentDTO;
import ru.sup.attendance_system.entity.Group;
import ru.sup.attendance_system.entity.Lesson;
import ru.sup.attendance_system.entity.Schedule;
import ru.sup.attendance_system.entity.Student;
import ru.sup.attendance_system.repository.AttendanceRepository;
import ru.sup.attendance_system.repository.GroupRepository;
import ru.sup.attendance_system.repository.StudentRepository;
import ru.sup.attendance_system.service.interfaces.StudentService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository repository;
    private final AttendanceRepository attendanceRepository;
    private final GroupRepository groupRepository;
    private final StudentRepository studentRepository;

    // =========================
    // GET students by group
    // =========================
    @Override
    public List<Student> getStudentsByGroup(Long groupId) {
        return repository.findByGroupId(groupId);
    }

    @Override
    public StudentDTO addStudent(CreateStudentRequest request) {

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        Student student = new Student();
        student.setName(request.getName());
        student.setGroup(group);

        Student saved = studentRepository.save(student);

        return new StudentDTO(
                saved.getId(),
                saved.getName(),
                saved.getGroup().getId()
        );
    }

    @Override
    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll()
                .stream()
                .map(s -> new StudentDTO(
                        s.getId(),
                        s.getName(),
                        s.getGroup().getId()
                ))
                .toList();
    }


    // =========================
    // CREATE STUDENT (FIXED)
    // =========================
    public StudentDTO saveStudent(StudentDTO dto) {

        if (dto.getGroupId() == null) {
            throw new RuntimeException("groupId is null");
        }

        Group group = groupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        Student student = new Student();
        student.setName(dto.getName());
        student.setGroup(group);

        Student saved = repository.save(student);

        return new StudentDTO(
                saved.getId(),
                saved.getName(),
                saved.getGroup().getId()
        );
    }

    // =========================
    // DELETE
    // =========================
    @Override
    public void deleteStudent(Long id) {
        repository.deleteById(id);
    }

    // =========================
    // GET BY ID
    // =========================
    @Override
    public Student getStudentById(Long studentId) {
        return repository.findById(studentId).orElse(null);
    }

    // =========================
    // SUBJECTS FOR STUDENT (SAFE)
    // =========================
    @Override
    public List<SubjectDTO> getSubjectsForStudent(Long studentId) {

        Student student = repository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        if (student.getGroup() == null || student.getGroup().getSubjects() == null) {
            return List.of();
        }

        return student.getGroup().getSubjects().stream()
                .map(s -> new SubjectDTO(
                        s.getId(),
                        s.getName(),
                        s.getTeacher() != null ? s.getTeacher().getName() : null
                ))
                .collect(Collectors.toList());
    }

    // =========================
// ATTENDANCE
// =========================
    @Override
    public List<AttendanceDTO> getAttendanceForSubject(Long studentId, Long subjectId) {
        return attendanceRepository
                .findByStudentIdAndSubjectId(studentId, subjectId)
                .stream()
                .map(a -> {
                    Lesson lesson = a.getLesson();
                    Schedule schedule = lesson.getSchedule();
                    return AttendanceDTO.builder()
                            .id(a.getId())
                            .studentId(a.getStudent().getId())
                            .studentName(a.getStudent().getName())
                            .lessonId(lesson.getId())
                            .subjectName(schedule.getSubject().getName())
                            .present(a.isPresent())
                            .date(lesson.getDate())
                            .build();
                })
                .collect(Collectors.toList());
    }

}