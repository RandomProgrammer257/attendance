package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.entity.Teacher;
import ru.sup.attendance_system.repository.TeacherRepository;
import ru.sup.attendance_system.service.interfaces.TeacherService;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<Teacher> login(String name, String rawPassword) {
        Optional<Teacher> teacherOpt = teacherRepository.findByName(name);
        if (teacherOpt.isPresent() && passwordEncoder.matches(rawPassword, teacherOpt.get().getPassword())) {
            return teacherOpt;
        }
        return Optional.empty();
    }

    @Override
    public boolean existsByName(String name) {
        return teacherRepository.findByName(name).isPresent();
    }
}