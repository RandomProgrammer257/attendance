package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.sup.attendance_system.entity.Schedule;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByGroupId(Long groupId);

    List<Schedule> findBySubjectId(Long subjectId);

    Optional<Schedule> findBySubjectIdAndGroupId(Long subjectId, Long groupId);

    // ИСПРАВЛЕНО: возвращает List вместо Optional
    @Query("SELECT s FROM Schedule s WHERE s.group.id = :groupId AND s.subject.id = :subjectId")
    List<Schedule> findByGroupIdAndSubjectId(
            @Param("groupId") Long groupId,
            @Param("subjectId") Long subjectId);

    List<Schedule> findByGroupIdAndDayOfWeek(Long groupId, DayOfWeek dayOfWeek);

    // Проверка на пересечение времени занятий
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Schedule s " +
            "WHERE s.group.id = :groupId " +
            "AND s.dayOfWeek = :dayOfWeek " +
            "AND s.startTime < :endTime " +
            "AND s.endTime > :startTime")
    boolean existsByGroupIdAndDayOfWeekAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            @Param("groupId") Long groupId,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("endTime") LocalTime endTime,
            @Param("startTime") LocalTime startTime);

	@Query("SELECT s FROM Schedule s WHERE s.room = :room AND s.dayOfWeek = :dayOfWeek AND :currentTime BETWEEN s.startTime AND s.endTime")
		Optional<Schedule> findByRoomAndDayAndTime(
        	@Param("room") String room,
        	@Param("dayOfWeek") DayOfWeek dayOfWeek,
        	@Param("currentTime") LocalTime currentTime
	);
Optional<Schedule> findByRoom(String room);

}
