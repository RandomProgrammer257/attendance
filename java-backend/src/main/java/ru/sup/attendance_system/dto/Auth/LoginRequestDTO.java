package ru.sup.attendance_system.dto.Auth;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String name;
    private String password;
}
