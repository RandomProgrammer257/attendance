package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnalyticsDTO {
    private Long studentId;
    private String studentName;
    private Double individualPercent;  // Посещаемость этого студента по предмету
    private Double groupPercent;       // Средняя посещаемость группы
    private Map<String, Double> dynamics;  // Динамика по датам/неделям
    private String subjectName;
    private String groupNumber;
    private Integer totalLessons;      // Всего занятий по предмету
    private Integer attendedLessons;   // Посещенных этим студентом
}
