package ru.sup.attendance_system.service.interfaces;

import ru.sup.attendance_system.dto.StudentDTO;

import java.util.List;

public interface GroupService {
    List<StudentDTO> getStudentsByGroup(Long groupId);
}
