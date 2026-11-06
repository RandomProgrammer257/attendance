package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sup.attendance_system.entity.Teacher;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByNameAndPassword(String name, String password);

    /**
     * Найти учителя по имени
     */
    Optional<Teacher> findByName(String name);

    /**
     * Получить все предметы конкретного учителя через его id
     * (если нужно для кастомного запроса, например, join fetch)
     */
    List<Teacher> findAllById(Long id);
}
