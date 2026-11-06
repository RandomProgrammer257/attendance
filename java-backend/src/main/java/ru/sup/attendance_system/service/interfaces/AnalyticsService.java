package ru.sup.attendance_system.service.interfaces;

import ru.sup.attendance_system.dto.Analytics.*;

import java.util.List;

public interface AnalyticsService {

    FullAnalyticsResponseDTO getFullAttendanceAnalytics(Long subjectId, Long groupId);

    List<IndividualAttendanceDTO> getIndividualAttendance(Long subjectId, Long groupId);

    double getGroupAttendancePercentage(Long subjectId, Long groupId);

    List<DynamicAttendanceDTO> getWeeklyDynamicStats(Long subjectId, Long groupId);

    List<DynamicAttendanceDTO> getMonthlyDynamicStats(Long subjectId, Long groupId);

    List<GroupAttendanceDTO> getGroupAttendanceComparisons(Long groupId);

    List<IndividualAttendanceDTO> getProblematicStudents(Long subjectId, Long groupId, double thresholdPercentage);

    StudentAnalyticsDTO getStudentAnalytics(Long studentId, Long subjectId, Long groupId);
}
