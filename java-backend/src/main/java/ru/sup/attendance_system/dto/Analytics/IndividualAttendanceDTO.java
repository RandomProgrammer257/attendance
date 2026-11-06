package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndividualAttendanceDTO {
    private Long studentId;
    private String studentName;
    private int totalLessons;
    private int attendedLessons;
    private double attendancePercentage;
}