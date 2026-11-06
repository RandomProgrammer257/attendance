package ru.sup.attendance_system.dto;

import lombok.Data;

@Data
public class QRScanRequestDTO {
    private String qrData;        // Данные из QR-кода (может быть JSON или просто studentId)
    private String scannerIp;      // IP сканера (опционально)
    private String deviceId;
}
