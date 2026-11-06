package ru.sup.attendance_system.dto;

import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class CreateScheduleRequestDTO {
    private Long subjectId;
    private Long groupId;
    private Long teacherId;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
}
