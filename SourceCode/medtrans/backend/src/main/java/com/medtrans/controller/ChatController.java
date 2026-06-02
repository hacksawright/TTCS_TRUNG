package com.medtrans.controller;

import com.medtrans.dto.Dtos.*;
import com.medtrans.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {
  private final ChatService svc;

  private Long uid() { return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); }

  @GetMapping("/conversations")
  public List<ConversationDto> list() { return svc.listConversations(uid()); }

  @PostMapping("/conversations")
  public ConversationDto create(@Valid @RequestBody CreateConversationRequest r) {
    return svc.createConversation(uid(), r.getTitle());
  }

  @DeleteMapping("/conversations/{id}")
  public void delete(@PathVariable Long id) { svc.deleteConversation(uid(), id); }

  @GetMapping("/conversations/{id}/messages")
  public List<MessageDto> messages(@PathVariable Long id) { return svc.listMessages(uid(), id); }

  @PostMapping("/messages/translate")
  public MessageDto translate(@Valid @RequestBody TranslateRequest r) { return svc.translate(uid(), r); }
}
