package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.dto.LessonDateDTO;
import ru.sup.attendance_system.entity.Lesson;
import ru.sup.attendance_system.entity.Schedule;
import ru.sup.attendance_system.repository.LessonRepository;
import ru.sup.attendance_system.repository.ScheduleRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final ScheduleRepository scheduleRepository;
    private final LessonRepository lessonRepository;

    public void generateLessons(LocalDate start, LocalDate end) {

        List<Schedule> schedules = scheduleRepository.findAll();

        for (Schedule schedule : schedules) {

            LocalDate current = start;

            while (!current.isAfter(end)) {

                if (current.getDayOfWeek() == schedule.getDayOfWeek()) {

                    Optional<Lesson> existing = lessonRepository
                            .findByDateAndScheduleId(current, schedule.getId());

                    if (existing.isEmpty()) {

                        Lesson lesson = new Lesson();
                        lesson.setSchedule(schedule);
                        lesson.setDate(current);
                        lesson.setStatus(Lesson.LessonStatus.PLANNED);

                        lessonRepository.save(lesson);
                    }
                }

                current = current.plusDays(1);
            }
        }
    }

    // LessonService.java
    public List<LessonDateDTO> getLessonDates(Long subjectId, Long groupId) {
        // Вариант 1: Если у тебя есть таблица Lesson (занятия)
        List<LocalDate> dates = lessonRepository.findDistinctDatesBySubjectIdAndGroupId(subjectId, groupId);

        return dates.stream()
                .map(date -> new LessonDateDTO(null, date, "Занятие"))
                .collect(Collectors.toList());


    }
}
