package ru.sup.attendance_system.dto.Auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.sup.attendance_system.dto.SubjectDTO;
import ru.sup.attendance_system.entity.Users;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeacherLoginResponseDTO {
    private Long id;
    private String name;
    private Users.Role role;
    private List<SubjectDTO> subjects;
}
