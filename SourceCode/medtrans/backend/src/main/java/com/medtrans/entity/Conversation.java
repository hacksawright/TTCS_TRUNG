package com.medtrans.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "conversations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Conversation {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(name = "user_id", nullable = false) private Long userId;
  @Column(nullable = false) private String title;
  @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
  @Enumerated(EnumType.STRING) @Column(nullable = false) private ConversationType type;
  @PrePersist void pre() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (title == null) title = "New chat";
    if (type == null) type = ConversationType.TRANSLATION;
  }
}
