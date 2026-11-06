package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DynamicAttendanceDTO {
    private String period; // неделя, месяц, дата
    private int totalLessons;
    private int attendedLessons;
    private double attendancePercentage;
}
