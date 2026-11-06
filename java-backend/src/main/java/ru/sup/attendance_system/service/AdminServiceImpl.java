package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sup.attendance_system.dto.*;
import ru.sup.attendance_system.entity.*;
import ru.sup.attendance_system.repository.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl{

    private final TeacherRepository teacherRepository;
    private final GroupRepository groupRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;
    private final SubjectRepository subjectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<TeacherDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(t -> new TeacherDTO(t.getId(), t.getName()))
                .collect(Collectors.toList());
    }


    public List<GroupDTO> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(g -> new GroupDTO(g.getId(), g.getGroupNumber()))
                .collect(Collectors.toList());
    }


    public List<StudentDTO> getStudentsByGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Группа с id " + groupId + " не найдена"));

        return studentRepository.findByGroupId(groupId).stream()
                .map(s -> new StudentDTO(s.getId(), s.getName(), group.getId()))
                .collect(Collectors.toList());
    }


    public Optional<Users> login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(user -> user.getRole() == Users.Role.ADMIN)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()));
    }


    public Teacher createTeacher(CreateTeacherRequestDTO dto) {
        Teacher teacher = new Teacher();
        teacher.setName(dto.getName());
        teacher.setPassword(passwordEncoder.encode(dto.getPassword()));
        return teacherRepository.save(teacher);
    }


    public void deleteTeacher(Long id) {
        teacherRepository.deleteById(id);
    }


    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(s -> new SubjectDTO(
                        s.getId(),
                        s.getName(),
                        s.getTeacher() != null ? s.getTeacher().getName() : null
                ))
                .collect(Collectors.toList());
    }


    public SubjectDTO createSubject(CreateSubjectRequestDTO dto) {
        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Subject subject = new Subject();
        subject.setName(dto.getName());
        subject.setTeacher(teacher);

        Subject saved = subjectRepository.save(subject);
        return new SubjectDTO(saved.getId(), saved.getName(), teacher.getName());
    }


    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(s -> new StudentDTO(
                        s.getId(),
                        s.getName(),
                        s.getGroup() != null ? s.getGroup().getId() : null
                ))
                .collect(Collectors.toList());
    }


    public StudentDTO addStudent(CreateStudentRequest request) {
        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        Student student = new Student();
        student.setName(request.getName());
        student.setGroup(group);

        Student saved = studentRepository.save(student);
        return new StudentDTO(saved.getId(), saved.getName(), group.getId());
    }


    public StudentDTO addStudent(Long groupId, StudentDTO dto) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        Student student = new Student();
        student.setName(dto.getName());
        student.setGroup(group);

        Student saved = studentRepository.save(student);
        return new StudentDTO(saved.getId(), saved.getName(), groupId);
    }

    // ===================== SCHEDULE =====================


    public List<ScheduleDTO> getAllSchedules() {
        return scheduleRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }


    public List<ScheduleDTO> getSchedulesByGroup(Long groupId) {
        return scheduleRepository.findByGroupId(groupId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleDTO createSchedule(CreateScheduleRequestDTO request) {
        try {
            System.out.println("Creating schedule: " + request);

            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject not found with id: " + request.getSubjectId()));

            Group group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + request.getGroupId()));

            // Если teacherId не передан, берем учителя из предмета
            Teacher teacher;
            if (request.getTeacherId() != null) {
                teacher = teacherRepository.findById(request.getTeacherId())
                        .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + request.getTeacherId()));
            } else {
                // Берем учителя из предмета
                teacher = subject.getTeacher();
                if (teacher == null) {
                    throw new RuntimeException("У предмета '" + subject.getName() + "' не назначен учитель!");
                }
                System.out.println("Using teacher from subject: " + teacher.getName());
            }

            Schedule schedule = new Schedule();
            schedule.setSubject(subject);
            schedule.setGroup(group);
            schedule.setTeacher(teacher);
            schedule.setDayOfWeek(request.getDayOfWeek());  // ← уже DayOfWeek, не нужно парсить!

            // НЕ НУЖНО парсить, если это уже LocalTime
            schedule.setStartTime(request.getStartTime());  // ← уже LocalTime
            schedule.setEndTime(request.getEndTime());      // ← уже LocalTime

            schedule.setRoom(request.getRoom());

            if (!subject.getGroups().contains(group)) {
                subject.getGroups().add(group);
                subjectRepository.save(subject);
                System.out.println("Added group " + group.getGroupNumber() + " to subject " + subject.getName());
            }

            Schedule saved = scheduleRepository.save(schedule);
            System.out.println("Schedule saved with id: " + saved.getId());

            return toDTO(saved);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error creating schedule: " + e.getMessage());
        }
    }


    @Transactional
    public ScheduleDTO updateSchedule(Long id, CreateScheduleRequestDTO request) {  // ← Исправлено: CreateScheduleRequestDTO
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        schedule.setSubject(subject);
        schedule.setGroup(group);
        schedule.setTeacher(teacher);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setRoom(request.getRoom());

        Schedule updated = scheduleRepository.save(schedule);
        return toDTO(updated);
    }


    @Transactional
    public void deleteSchedule(Long id) {
        scheduleRepository.deleteById(id);
    }


    public GroupDTO addGroup(GroupDTO dto) {
        Group group = new Group();
        group.setGroupNumber(dto.getGroupNumber());
        groupRepository.save(group);
        return new GroupDTO(group.getId(), group.getGroupNumber());
    }

    private ScheduleDTO toDTO(Schedule s) {
        ScheduleDTO dto = new ScheduleDTO();
        dto.setId(s.getId());
        dto.setSubjectId(s.getSubject().getId());
        dto.setSubjectName(s.getSubject().getName());
        dto.setGroupId(s.getGroup().getId());
        dto.setGroupNumber(s.getGroup().getGroupNumber());
        dto.setDayOfWeek(s.getDayOfWeek());
        dto.setStartTime(s.getStartTime());
        dto.setEndTime(s.getEndTime());
        dto.setRoom(s.getRoom());
        dto.setTeacherId(s.getTeacher().getId());
        dto.setTeacherName(s.getTeacher().getName());
        return dto;
    }
}