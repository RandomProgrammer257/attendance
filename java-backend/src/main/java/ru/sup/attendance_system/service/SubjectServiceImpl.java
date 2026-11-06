package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.sup.attendance_system.dto.GroupDTO;
import ru.sup.attendance_system.dto.SubjectDTO;
import ru.sup.attendance_system.entity.Group;
import ru.sup.attendance_system.entity.Subject;
import ru.sup.attendance_system.entity.Teacher;
import ru.sup.attendance_system.repository.GroupRepository;
import ru.sup.attendance_system.repository.SubjectRepository;
import ru.sup.attendance_system.repository.TeacherRepository;
import ru.sup.attendance_system.service.interfaces.SubjectService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository repository;
    private final TeacherRepository teacherRepository;
    private final GroupRepository groupRepository;

    @Override
    public List<SubjectDTO> getAllSubjects() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupDTO> getGroupsBySubject(Long subjectId) {
        Subject subject = repository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Предмет с id " + subjectId + " не найден"));
        return subject.getGroups().stream()
                .map(g -> new GroupDTO(g.getId(), g.getGroupNumber()))
                .collect(Collectors.toList());
    }

    /**
     * Преобразование сущности Subject в DTO
     */
    private SubjectDTO toDTO(Subject subject) {
        String teacherName = subject.getTeacher() != null ? subject.getTeacher().getName() : "Не назначен";
        List<GroupDTO> groups = subject.getGroups().stream()
                .map(g -> new GroupDTO(g.getId(), g.getGroupNumber()))
                .collect(Collectors.toList());
        return new SubjectDTO(subject.getId(), subject.getName(), teacherName);
    }

    /**
     * Получение предметов для конкретного учителя
     */
    public List<SubjectDTO> getSubjectsByTeacherId(Long teacherId) {
        return repository.findAllByTeacherId(teacherId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SubjectDTO createSubject(String name, Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Учитель не найден"));


        Subject subject = new Subject();
        subject.setName(name);
        subject.setTeacher(teacher);


        repository.save(subject);

        // Возвращаем DTO, теперь с учётом группы
        List<GroupDTO> groupsDto = subject.getGroups().stream()
                .map(g -> new GroupDTO(g.getId(), g.getGroupNumber()))
                .collect(Collectors.toList());

        return new SubjectDTO(subject.getId(), subject.getName(), teacher.getName());
    }



}
