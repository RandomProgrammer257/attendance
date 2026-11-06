package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.dto.AttendanceDTO;
import ru.sup.attendance_system.service.interfaces.AttendanceService;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:3000")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<List<AttendanceDTO>> getByLesson(@PathVariable Long lessonId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByLesson(lessonId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getByGroupAndSubjectAndDate(
            @PathVariable Long groupId,
            @RequestParam Long subjectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            System.out.println("=== GET ATTENDANCE ===");
            System.out.println("groupId: " + groupId);
            System.out.println("subjectId: " + subjectId);
            System.out.println("date: " + date);

            List<AttendanceDTO> result = attendanceService.getAttendanceByGroupAndSubjectAndDate(groupId, subjectId, date);
            System.out.println("Found " + result.size() + " records");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<AttendanceDTO> save(@RequestBody AttendanceDTO dto) {
        return ResponseEntity.ok(attendanceService.saveAttendance(dto));
    }

    @PostMapping("/saveAll")
    public ResponseEntity<?> saveAll(@RequestBody List<AttendanceDTO> list) {
          System.out.println("=== saveAll ===");
    System.out.println("saveAll: " + list);  
      try {
            System.out.println("=== RECEIVED SAVEALL REQUEST ===");
            System.out.println("Number of records: " + list.size());

            if (!list.isEmpty()) {
                AttendanceDTO first = list.get(0);
                System.out.println("First record: groupId=" + first.getGroupId() +
                        ", subjectId=" + first.getSubjectId() +
                        ", date=" + first.getDate());
            }

            attendanceService.saveAll(list);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Attendance saved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
