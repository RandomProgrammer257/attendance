package ru.sup.attendance_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "lesson",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"date", "schedule_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ссылка на расписание
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    // Дата конкретного занятия
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private LessonStatus status;

    public enum LessonStatus {
        PLANNED,
        HELD,
        CANCELED
    }

}


