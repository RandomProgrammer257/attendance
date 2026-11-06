package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AnalyticsResponseDTO {
    private String subject;
    private String group;
    private List<WeeklyAttendanceDTO> weeklyAttendance;
}


