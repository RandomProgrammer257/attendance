package ru.sup.attendance_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubjectDTO {
    private Long id;
    private String name;
    private String teacherName;
}
