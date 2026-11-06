package ru.sup.attendance_system.dto.Auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import ru.sup.attendance_system.dto.SubjectDTO;

import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private Long id;
    private String name;
    private String role; // "ADMIN" или "TEACHER"
    private List<SubjectDTO> subjects; // null для админа
}

