package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.dto.StudentDTO;
import ru.sup.attendance_system.service.interfaces.GroupService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    @GetMapping("/{groupId}/students")
    public ResponseEntity<List<StudentDTO>> getStudents(@PathVariable Long groupId) {
        List<StudentDTO> students = groupService.getStudentsByGroup(groupId);
        return ResponseEntity.ok(students);
    }

}
