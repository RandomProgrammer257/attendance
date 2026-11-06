package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.sup.attendance_system.entity.Lesson;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    Optional<Lesson> findByDateAndScheduleId(LocalDate date, Long scheduleId);


    @Query("SELECT DISTINCT l.date FROM Lesson l WHERE l.schedule.subject.id = :subjectId AND l.schedule.group.id = :groupId ORDER BY l.date ASC")
    List<LocalDate> findDistinctDatesBySubjectIdAndGroupId(@Param("subjectId") Long subjectId, @Param("groupId") Long groupId);


    List<Lesson> findByScheduleSubjectIdAndScheduleGroupIdAndDateBetween(
            Long subjectId,
            Long groupId,
            LocalDate start,
            LocalDate end
    );

    @Query("SELECT l FROM Lesson l WHERE l.schedule.subject.id = :subjectId AND l.schedule.group.id = :groupId")
    List<Lesson> findBySchedule_Subject_IdAndSchedule_Group_Id(
            @Param("subjectId") Long subjectId,
            @Param("groupId") Long groupId
    );

    List<Lesson> findByScheduleId(Long scheduleId);

    @Query("SELECT l FROM Lesson l WHERE l.schedule.id = :scheduleId AND l.date = :date")
    Optional<Lesson> findByScheduleIdAndDate(
            @Param("scheduleId") Long scheduleId,
            @Param("date") LocalDate date);

    @Query("""
        SELECT l FROM Lesson l
        JOIN l.schedule s
        WHERE s.room = :room
        AND s.dayOfWeek = :dayOfWeek
        AND :time BETWEEN s.startTime AND s.endTime
        AND l.date = :date
    """)
    Optional<Lesson> findCurrentLessonByRoom(
            @Param("room") String room,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("time") LocalTime time,
            @Param("date") LocalDate date
    );

}
