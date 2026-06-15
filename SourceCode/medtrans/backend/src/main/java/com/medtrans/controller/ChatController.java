package com.medtrans.controller;

import com.medtrans.dto.Dtos.*;
import com.medtrans.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {
  private final ChatService svc;
  private static final Long DEFAULT_USER_ID = 1L; // For development without auth

  private Long uid() {
    // No security in dev: always use default user id
    return DEFAULT_USER_ID;
  }

  @GetMapping("/conversations")
  public List<ConversationDto> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return svc.listConversations(uid(authorization));
  }

  @PostMapping("/conversations")
  public ConversationDto create(@RequestHeader(value = "Authorization", required = false) String authorization,
                                 @Valid @RequestBody CreateConversationRequest r) {
    return svc.createConversation(uid(authorization), r.getTitle());
  }

  @DeleteMapping("/conversations/{id}")
  public void delete(@RequestHeader(value = "Authorization", required = false) String authorization,
                     @PathVariable Long id) {
    svc.deleteConversation(uid(authorization), id);
  }

  @GetMapping("/conversations/{id}/messages")
  public List<MessageDto> messages(@RequestHeader(value = "Authorization", required = false) String authorization,
                                   @PathVariable Long id) {
    return svc.listMessages(uid(authorization), id);
  }

  @PostMapping("/messages/translate")
  public MessageDto translate(@RequestHeader(value = "Authorization", required = false) String authorization,
                              @Valid @RequestBody TranslateRequest r) {
    return svc.translate(uid(authorization), r);
  }

  @GetMapping("/chatbot/conversations")
  public List<ConversationDto> listChatbot(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return svc.getChatbotConversations(uid(authorization));
  }

  @PostMapping("/chatbot/conversations")
  public ConversationDto createChatbot(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @Valid @RequestBody CreateConversationRequest r) {
    return svc.createChatbotConversation(uid(authorization), r.getTitle());
  }

  @DeleteMapping("/chatbot/conversations/{id}")
  public void deleteChatbot(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @PathVariable Long id) {
    svc.deleteChatbotConversation(uid(authorization), id);
  }

  @GetMapping("/chatbot/conversations/{id}/messages")
  public List<ChatbotMessageResponse> messagesChatbot(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                      @PathVariable Long id) {
    return svc.getChatbotMessages(uid(authorization), id);
  }

  @PostMapping("/chatbot/messages")
  public ChatbotMessageResponse sendChatbot(@RequestHeader(value = "Authorization", required = false) String authorization,
                                            @Valid @RequestBody ChatbotRequest r) {
    return svc.sendChatbotMessage(uid(authorization), r);
  }

  private Long uid(String authorization) {
    if (authorization != null && authorization.startsWith("Bearer ")) {
      try {
        return Long.parseLong(authorization.substring(7).trim());
      } catch (NumberFormatException ignored) {
      }
    }
    return DEFAULT_USER_ID;
  }
}
