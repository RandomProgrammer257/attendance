package ru.sup.attendance_system.dto;

import lombok.Data;

@Data
public class CreateTeacherRequestDTO {
    private String name;
    private String password;
}