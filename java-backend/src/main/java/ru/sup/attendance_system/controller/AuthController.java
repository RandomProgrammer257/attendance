package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.dto.Auth.LoginRequestDTO;
import ru.sup.attendance_system.dto.Auth.LoginResponseDTO;
import ru.sup.attendance_system.dto.SubjectDTO;
import ru.sup.attendance_system.entity.Teacher;
import ru.sup.attendance_system.entity.Users;
import ru.sup.attendance_system.service.AdminServiceImpl;
import ru.sup.attendance_system.service.interfaces.TeacherService;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TeacherService teacherService;
    private final AdminServiceImpl adminService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {

        // ---------------- ADMIN ----------------
        Optional<Users> optionalAdmin = adminService.login(request.getName(), request.getPassword());
        if (optionalAdmin.isPresent()) {
            Users admin = optionalAdmin.get();
            return ResponseEntity.ok(new LoginResponseDTO(
                    admin.getId(),
                    admin.getUsername(),
                    Users.Role.ADMIN.name(),
                    List.of() // предметов у админа нет
            ));
        }

        // ---------------- TEACHER ----------------
        Optional<Teacher> optionalTeacher = teacherService.login(request.getName(), request.getPassword());
        if (optionalTeacher.isPresent()) {
            Teacher teacher = optionalTeacher.get();

            // Преобразуем предметы учителя в SubjectDTO
            List<SubjectDTO> subjects = teacher.getSubjects().stream()
                    .map(s -> new SubjectDTO(s.getId(), s.getName(), teacher.getName()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new LoginResponseDTO(
                    teacher.getId(),
                    teacher.getName(),
                    Users.Role.TEACHER.name(),
                    subjects
            ));
        }

        // ---------------- НЕВЕРНЫЙ ЛОГИН ----------------
        return ResponseEntity.status(401).body("Неверные имя или пароль");
    }
}
