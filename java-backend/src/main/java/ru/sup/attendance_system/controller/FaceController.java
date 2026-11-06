package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.sup.attendance_system.dto.FaceRecognitionRequest;
import ru.sup.attendance_system.dto.FaceRegistrationRequest;
import ru.sup.attendance_system.service.FaceService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/face")
@RequiredArgsConstructor
public class FaceController {

    private final FaceService faceService;

    @PostMapping("/recognize")
    public ResponseEntity<Map<String, String>> recognize(@RequestBody FaceRecognitionRequest request) {
        try {
            faceService.processFace(request);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Face processed");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());

            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerFace(@RequestBody FaceRegistrationRequest request) {
        try {
            faceService.registerFace(request.getStudentId(), request.getVector());
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Face registered successfully for student ID: " + request.getStudentId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
