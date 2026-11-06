package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.dto.Analytics.*;
import ru.sup.attendance_system.service.AnalyticsServiceImpl;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsServiceImpl analyticsService;

    // ================== FULL DASHBOARD ==================

    @GetMapping("/full/{subjectId}/{groupId}")
    public ResponseEntity<FullAnalyticsResponseDTO> getFullAnalytics(
            @PathVariable Long subjectId,
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(
                analyticsService.getFullAttendanceAnalytics(subjectId, groupId)
        );
    }

    // ================== INDIVIDUAL ==================

    @GetMapping("/individual/{subjectId}/{groupId}")
    public ResponseEntity<List<IndividualAttendanceDTO>> getIndividualAnalytics(
            @PathVariable Long subjectId,
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(
                analyticsService.getIndividualAttendance(subjectId, groupId)
        );
    }

    @GetMapping("/dynamic/weekly/{subjectId}/{groupId}")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyDynamic(
            @PathVariable Long subjectId,
            @PathVariable Long groupId
    ) {
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            // Получаем данные аналитики
            List<IndividualAttendanceDTO> individualData = analyticsService.getIndividualAttendance(subjectId, groupId);
            double groupPercent = analyticsService.getGroupAttendancePercentage(subjectId, groupId);

            // Формируем массив для каждой недели/даты
            Map<String, Object> weekData = new LinkedHashMap<>();
            weekData.put("week", "Текущая неделя");
            weekData.put("attendance", groupPercent);
            weekData.put("students", individualData.size());
            weekData.put("totalLessons", individualData.isEmpty() ? 0 : individualData.get(0).getTotalLessons());

            result.add(weekData);

        } catch (Exception e) {
            System.err.println("Error in weekly dynamic: " + e.getMessage());
            // Возвращаем пустой массив, а не null
        }

        return ResponseEntity.ok(result);
    }

    // ================== СРАВНЕНИЕ ПРЕДМЕТОВ ==================

    @GetMapping("/comparison/{groupId}")
    public ResponseEntity<List<Map<String, Object>>> getSubjectsComparison(
            @PathVariable Long groupId
    ) {
        List<Map<String, Object>> result = new ArrayList<>();

        try {
            // Здесь можно добавить логику сравнения предметов
            // Пока возвращаем пустой массив
            Map<String, Object> placeholder = new HashMap<>();
            placeholder.put("message", "Сравнение предметов в разработке");
            result.add(placeholder);

        } catch (Exception e) {
            System.err.println("Error in subjects comparison: " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }



    // ================== GROUP PERCENT ==================

    @GetMapping("/group/{subjectId}/{groupId}")
    public ResponseEntity<Double> getGroupAttendance(
            @PathVariable Long subjectId,
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(
                analyticsService.getGroupAttendancePercentage(subjectId, groupId)
        );
    }

    // ================== STUDENT ==================

    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentAnalyticsDTO> getStudentAnalytics(
            @PathVariable Long studentId,
            @RequestParam Long subjectId,
            @RequestParam Long groupId
    ) {
        return ResponseEntity.ok(
                analyticsService.getStudentAnalytics(studentId, subjectId, groupId)
        );
    }

    // ================== RATING ==================

    @GetMapping("/rating")
    public ResponseEntity<List<StudentAnalyticsDTO>> getGroupRating(
            @RequestParam Long subjectId,
            @RequestParam Long groupId
    ) {
        return ResponseEntity.ok(
                analyticsService.getGroupRating(subjectId, groupId)
        );
    }
}