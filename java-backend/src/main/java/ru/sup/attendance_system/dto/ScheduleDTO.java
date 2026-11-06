package ru.sup.attendance_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDTO {
    private Long id;
    private Long subjectId;
    private String subjectName;
    private Long groupId;
    private String groupNumber;
    private Long teacherId;
    private String teacherName;
    private DayOfWeek dayOfWeek;  // ← изменено с String на DayOfWeek
    private LocalTime startTime;   // ← изменено с String на LocalTime
    private LocalTime endTime;
    private String room;
}