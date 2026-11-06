package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.sup.attendance_system.dto.*;
import ru.sup.attendance_system.entity.Teacher;
import ru.sup.attendance_system.service.AdminServiceImpl;
import ru.sup.attendance_system.service.FaceRegistrationClient;
import ru.sup.attendance_system.service.FaceService;
import ru.sup.attendance_system.service.interfaces.StudentService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class AdminController {

    private final AdminServiceImpl adminService;
    private final StudentService studentService;
    private final FaceService faceService;
    private final FaceRegistrationClient faceRegistrationClient;

    // ---------------- Учителя ----------------
    @GetMapping("/teachers")
    public ResponseEntity<List<TeacherDTO>> getAllTeachers() {
        return ResponseEntity.ok(adminService.getAllTeachers());
    }

    @PostMapping("/teachers")
    public ResponseEntity<Teacher> createTeacher(@RequestBody CreateTeacherRequestDTO dto) {
        return ResponseEntity.ok(adminService.createTeacher(dto));
    }

    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        adminService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------- Группы ----------------
    @GetMapping("/groups")
    public ResponseEntity<List<GroupDTO>> getAllGroups() {
        return ResponseEntity.ok(adminService.getAllGroups());
    }

    @PostMapping("/groups")
    public ResponseEntity<GroupDTO> addGroup(@RequestBody GroupDTO dto) {
        GroupDTO created = adminService.addGroup(dto);
        return ResponseEntity.ok(created);
    }

    // ---------------- Студенты ----------------
    @GetMapping("/groups/{groupId}/students")
    public ResponseEntity<List<StudentDTO>> getStudentsByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(adminService.getStudentsByGroup(groupId));
    }

    @PostMapping("/groups/{groupId}/students")
    public ResponseEntity<StudentDTO> addStudent(@PathVariable Long groupId, @RequestBody StudentDTO dto) {
        StudentDTO created = adminService.addStudent(groupId, dto);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentDTO>> getAllStudents() {
        List<StudentDTO> students = studentService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    @PostMapping("/students")
    public ResponseEntity<StudentDTO> addStudent(@RequestBody CreateStudentRequest request) {
        StudentDTO student = adminService.addStudent(request);
        return ResponseEntity.ok(student);
    }

    // ---------------- Предметы ----------------
    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectDTO>> getAllSubjects() {
        return ResponseEntity.ok(adminService.getAllSubjects());
    }

    @PostMapping("/subjects")
    public ResponseEntity<SubjectDTO> createSubject(@RequestBody CreateSubjectRequestDTO request) {
        SubjectDTO subject = adminService.createSubject(request);
        return ResponseEntity.ok(subject);
    }

    // ================== РАСПИСАНИЕ ==================

    // получить всё расписание
    @GetMapping("/schedule")
    public ResponseEntity<List<ScheduleDTO>> getAllSchedules() {
        return ResponseEntity.ok(adminService.getAllSchedules());
    }

    // получить расписание по группе
    @GetMapping("/schedule/group/{groupId}")
    public ResponseEntity<List<ScheduleDTO>> getSchedulesByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(adminService.getSchedulesByGroup(groupId));
    }

    // создать пару
    @PostMapping("/schedule")
    public ResponseEntity<ScheduleDTO> createSchedule(@RequestBody CreateScheduleRequestDTO request) {
        return ResponseEntity.ok(adminService.createSchedule(request));
    }

    // редактировать пару
    @PutMapping("/schedule/{id}")
    public ResponseEntity<ScheduleDTO> updateSchedule(
            @PathVariable Long id,
            @RequestBody CreateScheduleRequestDTO request
    ) {
        return ResponseEntity.ok(adminService.updateSchedule(id, request));
    }

    // удалить пару
    @DeleteMapping("/schedule/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        adminService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }

    //Регистрация лица по фото
    @PostMapping(
            value = "/students/{studentId}/face",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> registerStudentFace(
            @PathVariable Long studentId,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Выберите фотографию"
            );
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Размер фотографии не должен превышать 10 МБ"
            );
        }

        if (file.getContentType() == null
                || !file.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Загрузите файл изображения"
            );
        }

        try {
            float[] vector = faceRegistrationClient.extractEmbedding(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    file.getContentType()
            );

            faceService.registerFace(studentId, vector);

            return ResponseEntity.ok(
                    java.util.Map.of(
                            "message", "Лицо успешно зарегистрировано",
                            "studentId", studentId
                    )
            );

        } catch (java.io.IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Не удалось прочитать фотографию",
                    e
            );
        } catch (org.springframework.web.client.RestClientException e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Сервис регистрации лиц недоступен",
                    e
            );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    e.getMessage(),
                    e
            );
        }
    }

}