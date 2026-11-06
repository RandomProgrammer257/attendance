package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.dto.AttendanceDTO;
import ru.sup.attendance_system.dto.StudentDTO;
import ru.sup.attendance_system.dto.SubjectDTO;
import ru.sup.attendance_system.service.interfaces.StudentService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;

    // =========================
    // GET students by group (DTO)
    // =========================
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<StudentDTO>> getStudentsByGroup(@PathVariable Long groupId) {

        List<StudentDTO> students = studentService.getStudentsByGroup(groupId)
                .stream()
                .map(s -> new StudentDTO(
                        s.getId(),
                        s.getName(),
                        s.getGroup().getId()
                ))
                .toList();

        return ResponseEntity.ok(students);
    }

    // =========================
    // CREATE student (FIXED)
    // =========================
    @PostMapping
    public ResponseEntity<StudentDTO> createStudent(@RequestBody StudentDTO dto) {
        StudentDTO saved = studentService.saveStudent(dto);
        return ResponseEntity.ok(saved);
    }

    // =========================
    // GET subjects of student
    // =========================
    @GetMapping("/{studentId}/subjects")
    public ResponseEntity<List<SubjectDTO>> getStudentSubjects(@PathVariable Long studentId) {
        return ResponseEntity.ok(studentService.getSubjectsForStudent(studentId));
    }

    // =========================
    // GET attendance
    // =========================
    @GetMapping("/{studentId}/subjects/{subjectId}/attendance")
    public ResponseEntity<List<AttendanceDTO>> getAttendance(
            @PathVariable Long studentId,
            @PathVariable Long subjectId
    ) {
        return ResponseEntity.ok(
                studentService.getAttendanceForSubject(studentId, subjectId)
        );
    }
}