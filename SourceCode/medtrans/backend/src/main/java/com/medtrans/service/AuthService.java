package com.medtrans.service;

import com.medtrans.dto.Dtos.*;
import com.medtrans.entity.User;
import com.medtrans.exception.ApiException;
import com.medtrans.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository repo;

  // Simple register/login for development: store plaintext password and return empty token
  public AuthResponse register(RegisterRequest r) {
    if (repo.existsByEmail(r.getEmail()))     throw ApiException.badRequest("Email already used");
    if (repo.existsByUsername(r.getUsername())) throw ApiException.badRequest("Username already used");
    User u = User.builder()
      .username(r.getUsername()).email(r.getEmail())
      .passwordHash(r.getPassword())
      .role(User.Role.USER).build();
    repo.save(u);
    return new AuthResponse(String.valueOf(u.getId()), u.getUsername(), u.getEmail(), u.getRole().name());
  }

  public AuthResponse login(LoginRequest r) {
    User u = repo.findByEmail(r.getEmail())
      .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
    if (!r.getPassword().equals(u.getPasswordHash()))
      throw ApiException.unauthorized("Invalid credentials");
    return new AuthResponse(String.valueOf(u.getId()), u.getUsername(), u.getEmail(), u.getRole().name());
  }
}
