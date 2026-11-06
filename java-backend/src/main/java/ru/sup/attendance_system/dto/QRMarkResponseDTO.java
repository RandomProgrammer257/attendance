package ru.sup.attendance_system.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class QRMarkResponseDTO {
    private boolean success;
    private String message;
    private String studentName;
    private String groupNumber;
    private LocalDate date;
    private String subjectName;
}
