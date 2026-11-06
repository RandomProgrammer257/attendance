package ru.sup.attendance_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.sup.attendance_system.service.QRCodeService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
@RequiredArgsConstructor
public class QRCodeController {

    private final QRCodeService qrService;

    @GetMapping("/mark/simple")
    public Map<String, Object> markSimple(@RequestParam Long studentId) {
        Map<String, Object> res = new HashMap<>();
        try {
            // Определяем текущую дату и находим актуальную пару
            String result = qrService.markByStudentId(studentId);
            res.put("success", result.equals("OK"));
            res.put("message", result);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", e.getMessage());
        }
        return res;
    }
}