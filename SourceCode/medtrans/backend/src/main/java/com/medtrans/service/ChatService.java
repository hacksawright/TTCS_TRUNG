package com.medtrans.service;

import com.medtrans.dto.Dtos.*;
import com.medtrans.entity.Conversation;
import com.medtrans.entity.ConversationType;
import com.medtrans.entity.Message;
import com.medtrans.exception.ApiException;
import com.medtrans.repository.ConversationRepository;
import com.medtrans.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
  private final ConversationRepository convRepo;
  private final MessageRepository msgRepo;
  private final AiClient ai;

  public ConversationDto createConversation(Long userId, String title) {
    Conversation c = convRepo.save(Conversation.builder()
      .userId(userId)
      .title(title == null || title.isBlank() ? "New chat" : title)
      .type(ConversationType.TRANSLATION)
      .build());
    return new ConversationDto(c.getId(), c.getTitle(), c.getCreatedAt(), c.getType());
  }

  public List<ConversationDto> listConversations(Long userId) {
    return convRepo.findByUserIdAndTypeOrderByCreatedAtDesc(userId, ConversationType.TRANSLATION).stream()
      .map(c -> new ConversationDto(c.getId(), c.getTitle(), c.getCreatedAt(), c.getType())).toList();
  }

  @Transactional
  public void deleteConversation(Long userId, Long convId) {
    Conversation c = convRepo.findById(convId).orElseThrow(() -> ApiException.notFound("Not found"));
    if (!c.getUserId().equals(userId)) throw ApiException.forbidden("Forbidden");
    convRepo.delete(c);
  }

  public List<MessageDto> listMessages(Long userId, Long convId) {
    Conversation c = convRepo.findById(convId).orElseThrow(() -> ApiException.notFound("Not found"));
    if (!c.getUserId().equals(userId)) throw ApiException.forbidden("Forbidden");
    return msgRepo.findByConversationIdOrderByCreatedAtAsc(convId).stream()
      .map(this::toDto).toList();
  }

  @Transactional
  public MessageDto translate(Long userId, TranslateRequest req) {
    Conversation c = convRepo.findById(req.getConversationId())
      .orElseThrow(() -> ApiException.notFound("Conversation not found"));
    if (!c.getUserId().equals(userId)) throw ApiException.forbidden("Forbidden");

    msgRepo.save(Message.builder()
      .conversationId(c.getId()).senderType(Message.SenderType.USER)
      .originalText(req.getText())
      .type(ConversationType.TRANSLATION).build());

    String direction = req.getDirection();
    String prompt;
    if ("EN_VI".equalsIgnoreCase(direction)) {
      prompt = "en: " + req.getText();
    } else if ("VI_EN".equalsIgnoreCase(direction)) {
      prompt = "vi: " + req.getText();
    } else {
      throw ApiException.badRequest("Invalid direction");
    }

    AiClient.PredictResult result = ai.predict(prompt);
    String cleanedOutput = cleanOutput(result.output());

    Message aiMsg = msgRepo.save(Message.builder()
      .conversationId(c.getId()).senderType(Message.SenderType.AI)
      .originalText(req.getText())
      .translatedText(cleanedOutput)
      .latencyMs(result.latencyMs())
      .type(ConversationType.TRANSLATION).build());

    if ("New chat".equals(c.getTitle())) {
      c.setTitle(req.getText().length() > 60 ? req.getText().substring(0, 60) + "…" : req.getText());
      convRepo.save(c);
    }
    return toDto(aiMsg);
  }

  private String cleanOutput(String output) {
    if (output == null) return "";
    String cleaned = output.trim();
    if (cleaned.toLowerCase().startsWith("vi:")) {
      cleaned = cleaned.substring(3).trim();
    } else if (cleaned.toLowerCase().startsWith("en:")) {
      cleaned = cleaned.substring(3).trim();
    }
    return cleaned;
  }

  private MessageDto toDto(Message m) {
    return new MessageDto(m.getId(), m.getConversationId(), m.getSenderType().name(),
      m.getOriginalText(), m.getTranslatedText(), m.getLatencyMs(), m.getCreatedAt(), m.getType());
  }

  public List<ConversationDto> getChatbotConversations(Long userId) {
    return convRepo.findByUserIdAndTypeOrderByCreatedAtDesc(userId, ConversationType.CHATBOT).stream()
      .map(c -> new ConversationDto(c.getId(), c.getTitle(), c.getCreatedAt(), c.getType())).toList();
  }

  public ConversationDto createChatbotConversation(Long userId, String title) {
    Conversation c = convRepo.save(Conversation.builder()
      .userId(userId)
      .title(title == null || title.isBlank() ? "New chat" : title)
      .type(ConversationType.CHATBOT)
      .build());
    return new ConversationDto(c.getId(), c.getTitle(), c.getCreatedAt(), c.getType());
  }

  public List<ChatbotMessageResponse> getChatbotMessages(Long userId, Long convId) {
    Conversation c = convRepo.findById(convId).orElseThrow(() -> ApiException.notFound("Not found"));
    if (!c.getUserId().equals(userId)) throw ApiException.forbidden("Forbidden");
    if (c.getType() != ConversationType.CHATBOT) throw ApiException.badRequest("Not a chatbot conversation");
    return msgRepo.findByConversationIdOrderByCreatedAtAsc(convId).stream()
      .map(m -> new ChatbotMessageResponse(
        m.getId(),
        m.getConversationId(),
        m.getSenderType().name(),
        m.getSenderType() == Message.SenderType.USER ? m.getOriginalText() : m.getTranslatedText(),
        m.getLatencyMs(),
        m.getCreatedAt()
      )).toList();
  }

  @Transactional
  public ChatbotMessageResponse sendChatbotMessage(Long userId, ChatbotRequest req) {
    Conversation c = convRepo.findById(req.getConversationId())
      .orElseThrow(() -> ApiException.notFound("Conversation not found"));
    if (!c.getUserId().equals(userId)) throw ApiException.forbidden("Forbidden");
    if (c.getType() != ConversationType.CHATBOT) throw ApiException.badRequest("Not a chatbot conversation");

    msgRepo.save(Message.builder()
      .conversationId(c.getId())
      .senderType(Message.SenderType.USER)
      .originalText(req.getMessage())
      .type(ConversationType.CHATBOT)
      .build());

    AiClient.PredictResult result = ai.askChatbot(req.getMessage());

    Message aiMsg = msgRepo.save(Message.builder()
      .conversationId(c.getId())
      .senderType(Message.SenderType.AI)
      .translatedText(result.output())
      .latencyMs(result.latencyMs())
      .type(ConversationType.CHATBOT)
      .build());

    if ("New chat".equals(c.getTitle())) {
      c.setTitle(req.getMessage().length() > 60 ? req.getMessage().substring(0, 60) + "…" : req.getMessage());
      convRepo.save(c);
    }

    return new ChatbotMessageResponse(
      aiMsg.getId(),
      aiMsg.getConversationId(),
      aiMsg.getSenderType().name(),
      aiMsg.getTranslatedText(),
      aiMsg.getLatencyMs(),
      aiMsg.getCreatedAt()
    );
  }

  @Transactional
  public void deleteChatbotConversation(Long userId, Long convId) {
    Conversation c = convRepo.findById(convId).orElseThrow(() -> ApiException.notFound("Not found"));
    if (!c.getUserId().equals(userId)) throw ApiException.forbidden("Forbidden");
    if (c.getType() != ConversationType.CHATBOT) throw ApiException.badRequest("Not a chatbot conversation");
    convRepo.delete(c);
  }
}
