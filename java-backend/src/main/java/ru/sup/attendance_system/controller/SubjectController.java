package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.dto.CreateSubjectDTO;
import ru.sup.attendance_system.dto.GroupDTO;
import ru.sup.attendance_system.dto.LessonDateDTO;
import ru.sup.attendance_system.dto.SubjectDTO;

import ru.sup.attendance_system.service.LessonService;
import ru.sup.attendance_system.service.interfaces.SubjectService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;
    private final LessonService lessonService;

    @GetMapping
    public ResponseEntity<List<SubjectDTO>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @GetMapping("/{subjectId}/groups")
    public ResponseEntity<List<GroupDTO>> getGroupsBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(subjectService.getGroupsBySubject(subjectId));
    }

    @PostMapping
    public ResponseEntity<SubjectDTO> createSubject(@RequestBody CreateSubjectDTO dto) {
        SubjectDTO subject = subjectService.createSubject(dto.getName(), dto.getTeacherId());
        return ResponseEntity.ok(subject);
    }

    @GetMapping("/{subjectId}/groups/{groupId}/lessons")
    public ResponseEntity<List<LessonDateDTO>> getLessonDates(
            @PathVariable Long subjectId,
            @PathVariable Long groupId) {

        List<LessonDateDTO> lessons = lessonService.getLessonDates(subjectId, groupId);
        return ResponseEntity.ok(lessons);
    }

}
