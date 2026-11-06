package ru.sup.attendance_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attendance",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"student_id", "lesson_id"})
        }
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private boolean present;

    @ManyToOne
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

}
