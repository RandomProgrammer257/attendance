package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WeeklyAttendanceDTO {
    private int week;
    private int percent;
}

