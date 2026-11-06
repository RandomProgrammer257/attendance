package ru.sup.attendance_system.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import ru.sup.attendance_system.entity.Users;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http .csrf(csrf -> csrf.disable()).authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
//                .csrf(csrf -> csrf.disable())
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/api/auth/**").permitAll()
//
//                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
//
//                        .requestMatchers("/api/attendance/**").hasAnyRole("ADMIN", "TEACHER")
//                        .requestMatchers("/api/groups/**").hasAnyRole("ADMIN", "TEACHER")
//                        .requestMatchers("/api/student/**").hasAnyRole("ADMIN", "STUDENT")
//                        .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "TEACHER")
//
//                        .anyRequest().authenticated()
//                )
//                .formLogin(form -> form
//                    .loginPage("/login")
//                    .permitAll())
//
//                .httpBasic(withDefaults());
        return http.build();
    }
}

