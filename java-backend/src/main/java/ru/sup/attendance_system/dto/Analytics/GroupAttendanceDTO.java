package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupAttendanceDTO {
    private Long groupId;
    private String groupNumber;
    private Long subjectId;
    private String subjectName;
    private double averageAttendancePercentage;
    private int totalStudents;
    private int totalLessons;
}
