package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sup.attendance_system.dto.CreateScheduleRequestDTO;
import ru.sup.attendance_system.dto.ScheduleDTO;
import ru.sup.attendance_system.entity.*;
import ru.sup.attendance_system.repository.*;

import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final SubjectRepository subjectRepository;
    private final GroupRepository groupRepository;
    private final TeacherRepository teacherRepository;

    public List<ScheduleDTO> getSchedulesByGroup(Long groupId) {
        return scheduleRepository.findByGroupId(groupId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ScheduleDTO> getSchedulesBySubject(Long subjectId) {
        return scheduleRepository.findBySubjectId(subjectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ScheduleDTO> getSchedulesByGroupAndDay(Long groupId, DayOfWeek dayOfWeek) {
        return scheduleRepository.findByGroupIdAndDayOfWeek(groupId, dayOfWeek).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ScheduleDTO> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ScheduleDTO getScheduleById(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Расписание с id " + id + " не найдено"));
        return convertToDTO(schedule);
    }

    @Transactional
    public ScheduleDTO createSchedule(CreateScheduleRequestDTO request) {
        // Проверяем существование предмета
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Предмет с id " + request.getSubjectId() + " не найден"));

        // Проверяем существование группы
        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Группа с id " + request.getGroupId() + " не найдена"));

        // Проверяем существование учителя (если передан)
        Teacher teacher = null;
        if (request.getTeacherId() != null) {
            teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Учитель с id " + request.getTeacherId() + " не найден"));
        }

        // Проверяем конфликт времени
        boolean conflict = scheduleRepository.existsByGroupIdAndDayOfWeekAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                request.getGroupId(),
                request.getDayOfWeek(),
                request.getEndTime(),
                request.getStartTime()
        );

        if (conflict) {
            throw new RuntimeException("Время занятия пересекается с существующим расписанием для этой группы");
        }

        Schedule schedule = new Schedule();
        schedule.setSubject(subject);
        schedule.setGroup(group);
        schedule.setTeacher(teacher);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setRoom(request.getRoom());

        Schedule saved = scheduleRepository.save(schedule);
        return convertToDTO(saved);
    }


    @Transactional
    public void deleteSchedule(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new RuntimeException("Расписание с id " + id + " не найдено");
        }
        scheduleRepository.deleteById(id);
    }

    private ScheduleDTO convertToDTO(Schedule schedule) {
        return new ScheduleDTO(
                schedule.getId(),
                schedule.getSubject().getId(),
                schedule.getSubject().getName(),
                schedule.getGroup().getId(),
                schedule.getGroup().getGroupNumber(),
                schedule.getTeacher() != null ? schedule.getTeacher().getId() : null,
                schedule.getTeacher() != null ? schedule.getTeacher().getName() : null,
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getRoom()
        );
    }
}