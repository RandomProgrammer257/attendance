package ru.sup.attendance_system.dto;


import lombok.Data;

@Data
public class CreateSubjectRequestDTO {
    private String name;
    private Long teacherId;
}