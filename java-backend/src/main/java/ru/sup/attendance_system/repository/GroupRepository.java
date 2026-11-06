package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sup.attendance_system.entity.Group;


public interface GroupRepository extends JpaRepository<Group, Long> {

}
