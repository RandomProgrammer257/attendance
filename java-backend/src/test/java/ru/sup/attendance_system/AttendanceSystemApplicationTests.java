package ru.sup.attendance_system;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class AttendanceSystemApplicationTests {

	@Test
	void contextLoads() {
	}

}
