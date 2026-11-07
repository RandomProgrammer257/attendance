package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sup.attendance_system.dto.FaceRecognitionRequest;
import ru.sup.attendance_system.entity.*;
import ru.sup.attendance_system.repository.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FaceService {

    private final StudentBiometricRepository biometricRepository;
    private final LessonRepository lessonRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final ScheduleRepository scheduleRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /** Минимальное косинусное сходство для buffalo_l (подбирайте на своих данных: 0.35-0.55). */
    @Value("${face.min-similarity:0.45}")
    private double minSimilarity;

    /** Минимальный отрыв лучшего кандидата от второго. */
    @Value("${face.min-margin:0.05}")
    private double minMargin;

    @Transactional
    public void processFace(FaceRecognitionRequest request) {
        float[] query = normalize(request.getVector());
        if (query == null) {
            log.warn("Пустой или некорректный вектор");
            return;
        }

        LocalDateTime now = request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now();

        // 1. Сначала определяем пару по аудитории и времени
        Lesson lesson = findOrCreateLesson(request.getRoom(), now);
        if (lesson == null) {
            log.info("Нет пары в аудитории {}", request.getRoom());
            return;
        }

        // 2. Ищем студента ТОЛЬКО среди группы этой пары (меньше кандидатов = меньше ошибок и быстрее)
        Long groupId = lesson.getSchedule().getGroup().getId();
        List<StudentBiometric> candidates = biometricRepository.findByStudentGroupId(groupId);

        StudentBiometric best = null;
        double bestSim = -1, secondSim = -1;

        for (StudentBiometric bio : candidates) {
            float[] ref = normalize(bio.getFaceVector());
            if (ref == null || ref.length != query.length) continue;
            double sim = dot(query, ref);
            if (sim > bestSim) {
                secondSim = bestSim;
                bestSim = sim;
                best = bio;
            } else if (sim > secondSim) {
                secondSim = sim;
            }
        }

        if (best == null || bestSim < minSimilarity) {
            log.info("Не распознан: лучшее сходство {}", bestSim);
            return;
        }
        if (secondSim > 0 && (bestSim - secondSim) < minMargin) {
            log.info("Неоднозначно: {} vs {}", bestSim, secondSim);
            return;
        }

        Student student = best.getStudent();
        log.info("Распознан {} (сходство {})", student.getName(), bestSim);

        // 3. Проверка дубля
        if (attendanceRepository.existsByStudentIdAndLessonId(student.getId(), lesson.getId())) {
            return;
        }

        // 4. Сохраняем отметку
        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setLesson(lesson);
        attendance.setPresent(true);
        attendanceRepository.save(attendance);

        sendWebSocketNotification(lesson, student.getId(), true);
    }

    private Lesson findOrCreateLesson(String room, LocalDateTime now) {
        Optional<Lesson> existing = lessonRepository.findCurrentLessonByRoom(
                room, now.getDayOfWeek(), now.toLocalTime(), now.toLocalDate());
        if (existing.isPresent()) return existing.get();

        Optional<Schedule> scheduleOpt = scheduleRepository.findByRoomAndDayAndTime(
                room, now.getDayOfWeek(), now.toLocalTime());
        if (scheduleOpt.isEmpty()) return null;

        Lesson lesson = new Lesson();
        lesson.setSchedule(scheduleOpt.get());
        lesson.setDate(now.toLocalDate());
        lesson.setStatus(Lesson.LessonStatus.PLANNED);
        return lessonRepository.save(lesson);
    }

    private void sendWebSocketNotification(Lesson lesson, Long studentId, boolean present) {
        try {
            Map<String, Object> n = new HashMap<>();
            n.put("studentId", studentId);
            n.put("present", present);
            n.put("groupId", lesson.getSchedule().getGroup().getId());
            n.put("subjectId", lesson.getSchedule().getSubject().getId());
            n.put("date", lesson.getDate().toString());
            messagingTemplate.convertAndSend("/topic/attendance", n);
        } catch (Exception e) {
            log.error("WebSocket error", e);
        }
    }

    @Transactional
    public void registerFace(Long studentId, float[] vector) {
        float[] normalized = normalize(vector);
        if (normalized == null) throw new IllegalArgumentException("Некорректный вектор");

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        StudentBiometric biometric = biometricRepository.findByStudentId(studentId)
                .orElseGet(() -> StudentBiometric.builder().student(student).build());
        biometric.setFaceVector(normalized);
        biometricRepository.save(biometric);
        log.info("Лицо зарегистрировано: {}", student.getName());
    }

    // ---------- математика ----------

    /** L2-нормализация. Работает и для старых «сырых» векторов в БД, и для новых нормализованных. */
    private static float[] normalize(float[] v) {
        if (v == null || v.length == 0) return null;
        double sum = 0;
        for (float x : v) sum += (double) x * x;
        double norm = Math.sqrt(sum);
        if (norm < 1e-9) return null;
        float[] r = new float[v.length];
        for (int i = 0; i < v.length; i++) r[i] = (float) (v[i] / norm);
        return r;
    }

    private static double dot(float[] a, float[] b) {
        double s = 0;
        for (int i = 0; i < a.length; i++) s += (double) a[i] * b[i];
        return s;
    }
}
