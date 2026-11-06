package ru.sup.attendance_system.dto;

import lombok.Data;

@Data
public class FaceRegistrationRequest {
    private Long studentId;
    private float[] vector;
}
