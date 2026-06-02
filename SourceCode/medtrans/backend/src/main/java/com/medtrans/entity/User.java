package com.medtrans.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable = false, unique = true, length = 64)  private String username;
  @Column(nullable = false, unique = true, length = 128) private String email;
  @Column(name = "password_hash", nullable = false)      private String passwordHash;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
  @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
  @PrePersist void pre() { if (createdAt == null) createdAt = LocalDateTime.now(); if (role == null) role = Role.USER; }
  public enum Role { USER, ADMIN }
}
