package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.sup.attendance_system.entity.Subject;


import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findAllByTeacherId(Long teacherId);
    @Query("SELECT s FROM Subject s JOIN s.groups g WHERE g.id = :groupId")
    List<Subject> findAllByGroupId(@Param("groupId") Long groupId);

    /**
     * Можно добавить поиск по имени предмета (опционально)
     */
    List<Subject> findByNameContainingIgnoreCase(String name);
}
