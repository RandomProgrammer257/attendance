package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.sup.attendance_system.entity.Attendance;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {



    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByLessonId(Long lessonId);

    Optional<Attendance> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId AND a.lesson.schedule.subject.id = :subjectId")
    List<Attendance> findByStudentIdAndSubjectId(
            @Param("studentId") Long studentId,
            @Param("subjectId") Long subjectId);

    List<Attendance> findByLessonIdIn(List<Long> lessonIds);

    boolean existsByStudentIdAndLessonId(Long studentId, Long lessonId);
}
