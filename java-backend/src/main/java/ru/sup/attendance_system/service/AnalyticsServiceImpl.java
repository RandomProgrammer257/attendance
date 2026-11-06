package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.dto.Analytics.*;
import ru.sup.attendance_system.entity.Attendance;
import ru.sup.attendance_system.entity.Lesson;
import ru.sup.attendance_system.entity.Student;

import ru.sup.attendance_system.repository.AttendanceRepository;
import ru.sup.attendance_system.repository.LessonRepository;
import ru.sup.attendance_system.repository.StudentRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl {

    private final AttendanceRepository attendanceRepository;
    private final LessonRepository lessonRepository;
    private final StudentRepository studentRepository;

    // границы периода (можешь вынести в конфиг)
    private LocalDate getStart() {
        return LocalDate.of(2025, 9, 1);
    }

    private LocalDate getEnd() {
        return LocalDate.now();
    }

    // ================== ИНДИВИДУАЛЬНАЯ ==================

    public List<IndividualAttendanceDTO> getIndividualAttendance(Long subjectId, Long groupId) {
        // Исправленный запрос - ищем Lesson через Schedule
        List<Lesson> lessons = lessonRepository
                .findByScheduleSubjectIdAndScheduleGroupIdAndDateBetween(
                        subjectId, groupId, getStart(), getEnd()
                );

        List<Long> lessonIds = lessons.stream()
                .map(Lesson::getId)
                .collect(Collectors.toList());

        List<Student> students = studentRepository.findByGroupId(groupId);

        List<IndividualAttendanceDTO> result = new ArrayList<>();

        for (Student student : students) {
            //Расчет индивидуальной посещаемости
            long attended = attendanceRepository.findByStudentId(student.getId()).stream()
                    .filter(Attendance::isPresent) //только присутствие
                    .filter(a -> lessonIds.contains(a.getLesson().getId())) //Выбор нужного занятия
                    .count();

            double percent = lessons.isEmpty() ? 0 :
                    Math.round(attended * 100.0 / lessons.size() * 100.0) / 100.0;

            result.add(new IndividualAttendanceDTO(
                    student.getId(),
                    student.getName(),
                    lessons.size(),
                    (int) attended,
                    percent
            ));
        }

        return result;
    }

    // ================== ГРУППОВАЯ ==================

    public double getGroupAttendancePercentage(Long subjectId, Long groupId) {
        System.out.println("=== GROUP ANALYTICS DEBUG ===");
        System.out.println("subjectId: " + subjectId);
        System.out.println("groupId: " + groupId);

        // 1. Получаем занятия
        List<Lesson> lessons = lessonRepository
                .findByScheduleSubjectIdAndScheduleGroupIdAndDateBetween(
                        subjectId, groupId, getStart(), getEnd()
                );

        System.out.println("Lessons found: " + lessons.size());
        if (lessons.isEmpty()) {
            System.out.println("No lessons found, returning 0");
            return 0;
        }

        // 2. Получаем ID занятий
        List<Long> lessonIds = lessons.stream()
                .map(Lesson::getId)
                .collect(Collectors.toList());
        System.out.println("Lesson IDs: " + lessonIds);

        // 3. Получаем студентов группы
        List<Student> students = studentRepository.findByGroupId(groupId);
        System.out.println("Students found: " + students.size());

        if (students.isEmpty()) {
            System.out.println("No students found, returning 0");
            return 0;
        }

        // 4. Получаем посещаемость по всем занятиям
        List<Attendance> allAttendances = attendanceRepository.findByLessonIdIn(lessonIds);
        System.out.println("Total attendance records: " + allAttendances.size());

        // 5. Считаем только присутствия
        long totalAttendances = allAttendances.stream()
                .filter(Attendance::isPresent)
                .count();
        System.out.println("Present attendances: " + totalAttendances);

        // 6. Максимально возможное количество посещений
        long expected = (long) lessons.size() * students.size();
        System.out.println("Expected (lessons × students): " + expected);

        if (expected == 0) return 0;

        double result = Math.round((double) totalAttendances / expected * 10000.0) / 100.0;
        System.out.println("Result: " + result + "%");

        return result;
    }

    // ================== СТУДЕНТ ==================

    public StudentAnalyticsDTO getStudentAnalytics(Long studentId, Long subjectId, Long groupId) {
        List<Lesson> lessons = lessonRepository
                .findByScheduleSubjectIdAndScheduleGroupIdAndDateBetween(
                        subjectId, groupId, getStart(), getEnd()
                );

        lessons.sort(Comparator.comparing(Lesson::getDate));

        List<Long> lessonIds = lessons.stream()
                .map(Lesson::getId)
                .collect(Collectors.toList());

        List<Attendance> attendances = attendanceRepository.findByStudentId(studentId);

        long attended = attendances.stream()
                .filter(Attendance::isPresent)
                .filter(a -> lessonIds.contains(a.getLesson().getId()))
                .count();

        //Формируем динамику посещаемости (накопленный процент по датам)
        Map<String, Double> dynamics = new LinkedHashMap<>();
        int cumulative = 0;
        int i = 0;

        for (Lesson lesson : lessons) {
            i++;

            boolean present = attendances.stream()
                    .anyMatch(a -> a.getLesson().getId().equals(lesson.getId()) && a.isPresent());

            if (present) cumulative++;

            double percent = Math.round(cumulative * 100.0 / i * 100.0) / 100.0;

            String label = lesson.getDate().toString();
            dynamics.put(label, percent);
        }

        //Расчет общего процента посещаемости
        double individualPercent = lessons.isEmpty() ? 0 :
                Math.round(attended * 100.0 / lessons.size() * 100.0) / 100.0;

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        StudentAnalyticsDTO dto = new StudentAnalyticsDTO();
        dto.setStudentId(studentId);
        dto.setStudentName(student.getName());
        dto.setIndividualPercent(individualPercent);
        dto.setGroupPercent(getGroupAttendancePercentage(subjectId, groupId));
        dto.setDynamics(dynamics);
        dto.setTotalLessons(lessons.size());
        dto.setAttendedLessons((int) attended);

        // Добавляем дополнительные поля
        dto.setSubjectName(lessons.isEmpty() ? "Unknown" : lessons.get(0).getSchedule().getSubject().getName());
        dto.setGroupNumber(lessons.isEmpty() ? "Unknown" : lessons.get(0).getSchedule().getGroup().getGroupNumber());

        return dto;
    }

    // ================== РЕЙТИНГ ==================

    public List<StudentAnalyticsDTO> getGroupRating(Long subjectId, Long groupId) {
        // Получаем всех студентов группы
        List<Student> students = studentRepository.findByGroupId(groupId);

        // Получаем все занятия по предмету и группе
        List<Lesson> lessons = lessonRepository.findBySchedule_Subject_IdAndSchedule_Group_Id(
                subjectId, groupId
        );

        List<Long> lessonIds = lessons.stream()
                .map(Lesson::getId)
                .collect(Collectors.toList());

        List<StudentAnalyticsDTO> result = new ArrayList<>();

        for (Student student : students) {
            // Считаем посещаемость студента
            long attended = attendanceRepository.findByStudentId(student.getId())
                    .stream()
                    .filter(Attendance::isPresent)
                    .filter(a -> lessonIds.contains(a.getLesson().getId()))
                    .count();

            double percent = lessons.isEmpty() ? 0 :
                    Math.round(attended * 100.0 / lessons.size() * 100.0) / 100.0;

            StudentAnalyticsDTO dto = new StudentAnalyticsDTO();
            dto.setStudentId(student.getId());
            dto.setStudentName(student.getName());
            dto.setIndividualPercent(percent);
            dto.setAttendedLessons((int) attended);
            dto.setTotalLessons(lessons.size());

            result.add(dto);
        }

        // Сортируем по убыванию процента
        return result.stream()
                .sorted(Comparator.comparing(StudentAnalyticsDTO::getIndividualPercent).reversed())
                .collect(Collectors.toList());
    }
    // ================== FULL DASHBOARD ==================

    public FullAnalyticsResponseDTO getFullAttendanceAnalytics(Long subjectId, Long groupId) {
        FullAnalyticsResponseDTO dto = new FullAnalyticsResponseDTO();
        dto.setIndividual(getIndividualAttendance(subjectId, groupId));
        dto.setGroupAttendance(getGroupAttendancePercentage(subjectId, groupId));
        dto.setStudentRating(getGroupRating(subjectId, groupId));
        return dto;
    }


}