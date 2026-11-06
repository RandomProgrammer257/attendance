package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.dto.StudentDTO;
import ru.sup.attendance_system.entity.Group;
import ru.sup.attendance_system.entity.Student;
import ru.sup.attendance_system.repository.GroupRepository;
import ru.sup.attendance_system.service.interfaces.GroupService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupRepository repository;

    @Override
    public List<StudentDTO> getStudentsByGroup(Long groupId) {
        Group group = repository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Группа не найдена: " + groupId));

        List<Student> students = group.getStudents();

        return students.stream()
                .map(student -> new StudentDTO(
                        student.getId(),
                        student.getName(),
                        student.getGroup().getId()
                ))
                .collect(Collectors.toList());
    }
}
