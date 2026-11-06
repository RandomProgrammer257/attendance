package ru.sup.attendance_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateSubjectDTO {
    private String name;
    private Long teacherId;
    private Long groupId;
}