package ru.sup.attendance_system.service.interfaces;

import ru.sup.attendance_system.entity.Teacher;

import java.util.Optional;

public interface TeacherService {
    Optional<Teacher> login(String name, String password);
    boolean existsByName(String name);
}
