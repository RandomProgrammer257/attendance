package ru.sup.attendance_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AttendanceDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long lessonId;
    private String subjectName;
    private boolean present;
    private LocalDate date;
    private Long groupId;
    private Long subjectId;
}
