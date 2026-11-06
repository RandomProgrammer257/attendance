package ru.sup.attendance_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sup.attendance_system.entity.Users;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByUsername(String username);
}
