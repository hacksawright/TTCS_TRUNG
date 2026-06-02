package com.medtrans.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(name = "conversation_id", nullable = false) private Long conversationId;
  @Enumerated(EnumType.STRING) @Column(name = "sender_type", nullable = false) private SenderType senderType;
  @Column(name = "original_text",   columnDefinition = "TEXT") private String originalText;
  @Column(name = "translated_text", columnDefinition = "TEXT") private String translatedText;
  @Column(name = "latency_ms") private Integer latencyMs;
  @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
  @PrePersist void pre() { if (createdAt == null) createdAt = LocalDateTime.now(); }
  public enum SenderType { USER, AI }
}
