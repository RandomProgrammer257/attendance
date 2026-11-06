package ru.sup.attendance_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "student_group")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_number", nullable = false)
    private String groupNumber;

    @OneToMany(mappedBy = "group")
    private List<Student> students = new ArrayList<>();

    @ManyToMany(mappedBy = "groups")
    private Set<Subject> subjects = new HashSet<>();

}
