package com.medtrans.service;

import com.medtrans.dto.Dtos.*;
import com.medtrans.entity.User;
import com.medtrans.exception.ApiException;
import com.medtrans.repository.UserRepository;
import com.medtrans.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository repo;
  private final PasswordEncoder encoder;
  private final JwtUtils jwt;

  public AuthResponse register(RegisterRequest r) {
    if (repo.existsByEmail(r.getEmail()))     throw ApiException.badRequest("Email already used");
    if (repo.existsByUsername(r.getUsername())) throw ApiException.badRequest("Username already used");
    User u = User.builder()
      .username(r.getUsername()).email(r.getEmail())
      .passwordHash(encoder.encode(r.getPassword()))
      .role(User.Role.USER).build();
    repo.save(u);
    return new AuthResponse(jwt.generate(u.getId(), u.getEmail(), u.getRole().name()),
      u.getUsername(), u.getEmail(), u.getRole().name());
  }

  public AuthResponse login(LoginRequest r) {
    User u = repo.findByEmail(r.getEmail())
      .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
    if (!encoder.matches(r.getPassword(), u.getPasswordHash()))
      throw ApiException.unauthorized("Invalid credentials");
    return new AuthResponse(jwt.generate(u.getId(), u.getEmail(), u.getRole().name()),
      u.getUsername(), u.getEmail(), u.getRole().name());
  }
}
