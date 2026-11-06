package ru.sup.attendance_system.service.interfaces;

import ru.sup.attendance_system.dto.AttendanceDTO;
import ru.sup.attendance_system.entity.Lesson;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {

    /**
     * Получить список посещаемости по ID занятия (Lesson)
     * @param lessonId ID занятия
     * @return список DTO посещаемости
     */
    List<AttendanceDTO> getAttendanceByLesson(Long lessonId);

    /**
     * Получить список посещаемости по группе, предмету и дате
     * @param groupId ID группы
     * @param subjectId ID предмета
     * @param date дата занятия
     * @return список DTO посещаемости
     */
    List<AttendanceDTO> getAttendanceByGroupAndSubjectAndDate(Long groupId, Long subjectId, LocalDate date);

    /**
     * Сохранить одну запись посещаемости
     * @param dto DTO с данными посещаемости
     * @return сохраненный DTO с ID
     */
    AttendanceDTO saveAttendance(AttendanceDTO dto);

    /**
     * Сохранить несколько записей посещаемости (список)
     * @param list список DTO с данными посещаемости
     */
    void saveAll(List<AttendanceDTO> list);

    /**
     * Найти или создать занятие (Lesson) по ID расписания и дате
     * @param scheduleId ID расписания (Schedule)
     * @param date дата занятия
     * @return найденное или созданное занятие
     */
    Lesson findOrCreateLesson(Long scheduleId, LocalDate date);
}