package ru.sup.attendance_system;

import org.springframework.boot.SpringApplication;

public class TestAttendanceSystemApplication {

	public static void main(String[] args) {
		SpringApplication.from(AttendanceSystemApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
