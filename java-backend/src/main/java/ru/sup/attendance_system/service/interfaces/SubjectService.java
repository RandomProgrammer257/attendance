package ru.sup.attendance_system.service.interfaces;

import ru.sup.attendance_system.dto.GroupDTO;
import ru.sup.attendance_system.dto.SubjectDTO;

import java.util.List;

public interface SubjectService {
    List<SubjectDTO> getAllSubjects();
    List<GroupDTO> getGroupsBySubject(Long subjectId);
    SubjectDTO createSubject(String name, Long teacherId);

}
