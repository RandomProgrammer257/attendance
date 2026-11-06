package ru.sup.attendance_system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sup.attendance_system.dto.AttendanceDTO;
import ru.sup.attendance_system.entity.*;
import ru.sup.attendance_system.repository.*;
import ru.sup.attendance_system.service.interfaces.AttendanceService;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final LessonRepository lessonRepository;
    private final ScheduleRepository scheduleRepository;
    private final GroupRepository groupRepository;
    private final SubjectRepository subjectRepository;

    @Override
    public List<AttendanceDTO> getAttendanceByLesson(Long lessonId) {
        return attendanceRepository.findByLessonId(lessonId)
                .stream()
                .map(a -> {
                    Lesson lesson = a.getLesson();
                    Schedule schedule = lesson.getSchedule();
                    return AttendanceDTO.builder()
                            .id(a.getId())
                            .studentId(a.getStudent().getId())
                            .studentName(a.getStudent().getName())
                            .lessonId(lesson.getId())
                            .subjectName(schedule.getSubject().getName())
                            .present(a.isPresent())
                            .date(lesson.getDate())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<AttendanceDTO> getAttendanceByGroupAndSubjectAndDate(Long groupId, Long subjectId, LocalDate date) {
        try {
            List<Schedule> schedules = scheduleRepository.findByGroupIdAndSubjectId(groupId, subjectId);
            List<AttendanceDTO> result = new ArrayList<>();

            if (schedules.isEmpty()) {
                List<Student> students = studentRepository.findByGroupId(groupId);
                for (Student student : students) {
                    result.add(AttendanceDTO.builder()
                            .studentId(student.getId())
                            .studentName(student.getName())
                            .present(false)
                            .date(date)
                            .build());
                }
                return result;
            }

            for (Schedule schedule : schedules) {
                Optional<Lesson> lessonOpt = lessonRepository.findByScheduleIdAndDate(schedule.getId(), date);
                if (lessonOpt.isPresent()) {
                    Lesson lesson = lessonOpt.get();
                    List<Attendance> attendances = attendanceRepository.findByLessonId(lesson.getId());
                    for (Attendance a : attendances) {
                        result.add(AttendanceDTO.builder()
                                .studentId(a.getStudent().getId())
                                .studentName(a.getStudent().getName())
                                .present(a.isPresent())
                                .date(date)
                                .build());
                    }
                }
            }

            if (result.isEmpty()) {
                List<Student> students = studentRepository.findByGroupId(groupId);
                for (Student student : students) {
                    result.add(AttendanceDTO.builder()
                            .studentId(student.getId())
                            .studentName(student.getName())
                            .present(false)
                            .date(date)
                            .build());
                }
            }

            return result;
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get attendance: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public AttendanceDTO saveAttendance(AttendanceDTO dto) {
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found: " + dto.getStudentId()));

        List<Schedule> schedules = scheduleRepository.findByGroupIdAndSubjectId(dto.getGroupId(), dto.getSubjectId());
        if (schedules.isEmpty()) {
            throw new RuntimeException("Schedule not found for group " + dto.getGroupId() + " and subject " + dto.getSubjectId());
        }
        Schedule schedule = schedules.get(0);
        Lesson lesson = findOrCreateLesson(schedule.getId(), dto.getDate());

        Attendance attendance = attendanceRepository
                .findByStudentIdAndLessonId(student.getId(), lesson.getId())
                .orElse(new Attendance());

        attendance.setStudent(student);
        attendance.setLesson(lesson);
        attendance.setPresent(dto.isPresent());

        Attendance saved = attendanceRepository.save(attendance);

        return AttendanceDTO.builder()
                .id(saved.getId())
                .studentId(saved.getStudent().getId())
                .studentName(saved.getStudent().getName())
                .lessonId(lesson.getId())
                .subjectName(schedule.getSubject().getName())
                .present(saved.isPresent())
                .date(lesson.getDate())
                .build();
    }

    @Override
    @Transactional
    public void saveAll(List<AttendanceDTO> list) {
        try {
            if (list == null || list.isEmpty()) return;

            AttendanceDTO first = list.get(0);
            Long groupId = first.getGroupId();
            Long subjectId = first.getSubjectId();
            LocalDate date = first.getDate();

            List<Schedule> schedules = scheduleRepository.findByGroupIdAndSubjectId(groupId, subjectId);
            if (schedules.isEmpty()) {
                throw new RuntimeException("Schedule not found. Please create schedule first.");
            }
            Schedule schedule = schedules.get(0);

            Optional<Lesson> lessonOpt = lessonRepository.findByScheduleIdAndDate(schedule.getId(), date);
            Lesson lesson;
            if (lessonOpt.isEmpty()) {
                lesson = new Lesson();
                lesson.setSchedule(schedule);
                lesson.setDate(date);
                lesson.setStatus(Lesson.LessonStatus.PLANNED);
                lesson = lessonRepository.save(lesson);
            } else {
                lesson = lessonOpt.get();
            }

            for (AttendanceDTO dto : list) {

		System.out.println("DTO: studentId=" + dto.getStudentId() + ", present=" + dto.isPresent() + ", lessonId=" + dto.getLessonId());


                Student student = studentRepository.findById(dto.getStudentId())
                        .orElseThrow(() -> new RuntimeException("Student not found: " + dto.getStudentId()));

                Optional<Attendance> existingAttendance = attendanceRepository
                        .findByStudentIdAndLessonId(student.getId(), lesson.getId());

                Attendance attendance = existingAttendance.orElseGet(Attendance::new);
                attendance.setStudent(student);
                attendance.setLesson(lesson);
                attendance.setPresent(dto.isPresent());

                attendanceRepository.save(attendance);
            }
        } catch (Exception e) {
            System.err.println("ERROR in saveAll: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save attendance: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Lesson findOrCreateLesson(Long scheduleId, LocalDate date) {
        return lessonRepository.findByScheduleIdAndDate(scheduleId, date)
                .orElseGet(() -> {
                    Schedule schedule = scheduleRepository.findById(scheduleId)
                            .orElseThrow(() -> new RuntimeException("Schedule not found: " + scheduleId));

                    Lesson newLesson = new Lesson();
                    newLesson.setSchedule(schedule);
                    newLesson.setDate(date);
                    newLesson.setStatus(Lesson.LessonStatus.PLANNED);
                    return lessonRepository.save(newLesson);
                });
    }
}
