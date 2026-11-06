package ru.sup.attendance_system.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FaceEmbeddingResponse {
    private List<Double> vector;
}

