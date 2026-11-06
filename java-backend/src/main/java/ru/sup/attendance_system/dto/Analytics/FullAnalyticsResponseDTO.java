package ru.sup.attendance_system.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Общий DTO для полной аналитики
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FullAnalyticsResponseDTO {
    private List<IndividualAttendanceDTO> individual;

    private double groupAttendance;

    private List<StudentAnalyticsDTO> studentRating;
}
