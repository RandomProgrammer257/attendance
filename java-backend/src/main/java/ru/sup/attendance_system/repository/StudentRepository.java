package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sup.attendance_system.entity.Group;
import ru.sup.attendance_system.entity.Student;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByGroupId(Long groupId);
    List<Student> findAllByGroupId(Long groupId);
    int countByGroupId(Long groupId);

}
