package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sup.attendance_system.dto.FaceRecognitionRequest;
import ru.sup.attendance_system.entity.*;
import ru.sup.attendance_system.repository.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FaceService {

    private final StudentBiometricRepository biometricRepository;
    private final LessonRepository lessonRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final ScheduleRepository scheduleRepository;  // ← ДОБАВИТЬ
    private final SimpMessagingTemplate messagingTemplate;


    @Transactional
    public void processFace(FaceRecognitionRequest request) {
        System.out.println("=== FACE RECOGNITION ===");
        System.out.println("Room: " + request.getRoom());

        // 1. Найти студента по лицу
        StudentBiometric bestMatch = null;
        double bestScore = Double.MAX_VALUE;

        for (StudentBiometric bio : biometricRepository.findAll()) {
            if (bio.getFaceVector() == null) continue;
            double distance = calculateDistance(request.getVector(), bio.getFaceVector());
            if (distance < bestScore) {
                bestScore = distance;
                bestMatch = bio;
            }
        }

        if (bestMatch == null || bestScore > 27.0) {
            System.out.println("❌ Face not recognized (distance too high: " + bestScore + " > 26.0)");
            return;
        }

        Student student = bestMatch.getStudent();
        System.out.println("✅ Student: " + student.getName());

        LocalDateTime now = request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now();

        // 2. Найти или СОЗДАТЬ текущую пару
        Lesson lesson = findOrCreateLesson(request.getRoom(), now);

        if (lesson == null) {
            System.out.println("❌ Cannot find or create lesson in room " + request.getRoom());
            return;
        }

        // 3. Проверка группы
        if (!lesson.getSchedule().getGroup().getId().equals(student.getGroup().getId())) {
            System.out.println("❌ Student not from this group");
            return;
        }

        // 4. Проверка дубля
        if (attendanceRepository.existsByStudentIdAndLessonId(student.getId(), lesson.getId())) {
            System.out.println("❌ Already marked" + student.getId());
            return;
        }

        // 5. Сохраняем отметку
        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setLesson(lesson);
        attendance.setPresent(true);
        attendanceRepository.save(attendance);

        System.out.println("✅ Marked: " + student.getName());

        // 6. Отправляем WebSocket уведомление
        sendWebSocketNotification(lesson, student.getId(), true);
    }

    // НОВЫЙ МЕТОД: найти или создать Lesson
    private Lesson findOrCreateLesson(String room, LocalDateTime now) {
        // Сначала ищем существующий Lesson
        Optional<Lesson> existingLesson = lessonRepository.findCurrentLessonByRoom(
                room,
                now.getDayOfWeek(),
                now.toLocalTime(),
                now.toLocalDate()
        );

        if (existingLesson.isPresent()) {
            System.out.println("✅ Existing lesson found");
            return existingLesson.get();
        }

        // Если не нашли, ищем Schedule для этой аудитории и времени
        System.out.println("⚠️ Lesson not found, looking for schedule...");

        Optional<Schedule> scheduleOpt = scheduleRepository.findByRoomAndDayAndTime(
                room,
                now.getDayOfWeek(),
                now.toLocalTime()
        );

        if (scheduleOpt.isEmpty()) {
            System.out.println("❌ No schedule found for room " + room);
            return null;
        }

        Schedule schedule = scheduleOpt.get();
        System.out.println("✅ Schedule found: " + schedule.getSubject().getName());

        // Создаём новый Lesson
        Lesson newLesson = new Lesson();
        newLesson.setSchedule(schedule);
        newLesson.setDate(now.toLocalDate());
        newLesson.setStatus(Lesson.LessonStatus.PLANNED);

        Lesson saved = lessonRepository.save(newLesson);
        System.out.println("✅ Created new lesson with id: " + saved.getId());

        return saved;
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
            System.out.println("📤 WebSocket sent: " + notification);
        } catch (Exception e) {
            System.err.println("❌ WebSocket error: " + e.getMessage());
        }
    }

    private double calculateDistance(float[] v1, float[] v2) {
        if (v1 == null || v2 == null || v1.length != v2.length) return Double.MAX_VALUE;
        double sum = 0;
        for (int i = 0; i < v1.length; i++) {
            double diff = v1[i] - v2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    @Transactional
    public void registerFace(Long studentId, float[] vector) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Optional<StudentBiometric> existing = biometricRepository.findByStudentId(studentId);

        StudentBiometric biometric;
        if (existing.isPresent()) {
            biometric = existing.get();
            biometric.setFaceVector(vector);
        } else {
            biometric = StudentBiometric.builder().student(student).faceVector(vector).build();
        }

        biometricRepository.save(biometric);
        System.out.println("✅ Face registered for: " + student.getName());
    }
}
