package com.medtrans.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

public class Dtos {

  @Data public static class RegisterRequest {
    @NotBlank @Size(min=3,max=64)  private String username;
    @NotBlank @Email               private String email;
    @NotBlank @Size(min=6,max=128) private String password;
  }

  @Data public static class LoginRequest {
    @NotBlank @Email private String email;
    @NotBlank        private String password;
  }

  @Data @AllArgsConstructor public static class AuthResponse {
    private String token;
    private String username;
    private String email;
    private String role;
  }

  @Data public static class CreateConversationRequest {
    @Size(max=255) private String title;
  }

  @Data @AllArgsConstructor @NoArgsConstructor public static class ConversationDto {
    private Long id; private String title; private LocalDateTime createdAt;
  }

  @Data public static class TranslateRequest {
    @NotNull  private Long conversationId;
    @NotBlank private String text;
    private String direction; // EN_VI | VI_EN
  }

  @Data @AllArgsConstructor @NoArgsConstructor public static class MessageDto {
    private Long id;
    private Long conversationId;
    private String senderType;
    private String originalText;
    private String translatedText;
    private Integer latencyMs;
    private LocalDateTime createdAt;
  }

  @Data @AllArgsConstructor @NoArgsConstructor public static class AiRequest {
    private String text;
  }

  @Data @AllArgsConstructor @NoArgsConstructor public static class AiResponse {
    private String output;
  }
}
