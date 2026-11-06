package ru.sup.attendance_system.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FaceRecognitionRequest {
    private float[] vector;
    private LocalDateTime timestamp;
    private String room;
}