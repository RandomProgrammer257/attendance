package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sup.attendance_system.entity.StudentBiometric;

import java.util.Optional;

public interface StudentBiometricRepository extends JpaRepository<StudentBiometric, Long> {
    Optional<StudentBiometric> findByStudentId(Long studentId);
}
