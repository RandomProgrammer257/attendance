package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.entity.*;
import ru.sup.attendance_system.repository.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QRCodeService {

    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final ScheduleRepository scheduleRepository;
    private final LessonRepository lessonRepository;
    private final AttendanceRepository attendanceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public String markByStudentId(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Находим расписание на текущее время
        Schedule schedule = scheduleRepository
                .findByGroupIdAndDayOfWeek(student.getGroup().getId(), today.getDayOfWeek())
                .stream()
                .filter(s -> !now.isBefore(s.getStartTime()) && !now.isAfter(s.getEndTime()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Сейчас нет пары. Доступные пары: " +
                                scheduleRepository.findByGroupIdAndDayOfWeek(student.getGroup().getId(), today.getDayOfWeek())
                                        .stream()
                                        .map(s -> s.getStartTime() + "-" + s.getEndTime())
                                        .collect(Collectors.joining(", "))
                ));

        // Находим или создаём Lesson
        Lesson lesson = lessonRepository
                .findByScheduleIdAndDate(schedule.getId(), today)
                .orElseGet(() -> {
                    Lesson l = new Lesson();
                    l.setDate(today);
                    l.setSchedule(schedule);
                    l.setStatus(Lesson.LessonStatus.PLANNED);
                    return lessonRepository.save(l);
                });

        // Проверка дубля
        if (attendanceRepository.existsByStudentIdAndLessonId(studentId, lesson.getId())) {
            return "Already marked";
        }

        // Сохраняем отметку
        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setLesson(lesson);
        attendance.setPresent(true);
        attendanceRepository.save(attendance);

        // Отправляем WebSocket уведомление
        sendWebSocketNotification(lesson, studentId, true);

        return "OK";
    }

    private void sendWebSocketNotification(Lesson lesson, Long studentId, boolean present) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("studentId", studentId);
            notification.put("present", present);
            notification.put("groupId", lesson.getSchedule().getGroup().getId());
            notification.put("subjectId", lesson.getSchedule().getSubject().getId());
            notification.put("date", lesson.getDate().toString());

            messagingTemplate.convertAndSend("/topic/attendance", notification);
            System.out.println("📤 WebSocket (QR) sent: " + notification);
        } catch (Exception e) {
            System.err.println("❌ WebSocket error: " + e.getMessage());
        }
    }
}