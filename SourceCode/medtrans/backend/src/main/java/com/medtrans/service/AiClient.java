package com.medtrans.service;

import com.medtrans.dto.Dtos.*;
import com.medtrans.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClient {
  private final WebClient aiWebClient;
  private final WebClient chatbotWebClient;

  public PredictResult predict(String prompt) {
    long t0 = System.currentTimeMillis();
    log.info("Sending request to AI Server with prompt length: {}", prompt.length());
    AiResponse body;
    try {
      body = aiWebClient.post()
        .uri("/predict")
        .bodyValue(new AiRequest(prompt))
        .retrieve()
        .bodyToMono(AiResponse.class)
        .retryWhen(Retry.fixedDelay(2, Duration.ofMillis(500))
          .filter(ex -> !(ex instanceof IllegalArgumentException)))
        .timeout(Duration.ofSeconds(30))
        .block();
    } catch (Exception ex) {
      log.error("Error calling AI server", ex);
      // During development, fall back to a mock response instead of failing
      String mock = "[MOCK AI] " + (prompt == null ? "" : prompt);
      return new PredictResult(mock, 0);
    }
    
    long elapsed = System.currentTimeMillis() - t0;
    if (body == null) throw ApiException.internalServerError("Empty AI response");
    
    String output = body.getOutput() != null ? body.getOutput() : "";
    return new PredictResult(output, (int) elapsed);
  }

  public PredictResult askChatbot(String message) {
    long t0 = System.currentTimeMillis();
    log.info("Sending request to Chatbot Server with message length: {}", message.length());
    ChatbotAiResponse body;
    try {
      body = chatbotWebClient.post()
        .uri("/api/v1/chat")
        .bodyValue(new ChatbotAiRequest(message))
        .retrieve()
        .bodyToMono(ChatbotAiResponse.class)
        .retryWhen(Retry.fixedDelay(2, Duration.ofMillis(500))
          .filter(ex -> !(ex instanceof IllegalArgumentException)))
        .timeout(Duration.ofSeconds(30))
        .block();
    } catch (Exception ex) {
      log.error("Error calling Chatbot server", ex);
      // During development, fall back to a mock chatbot response
      String mock = "[MOCK CHATBOT] " + (message == null ? "" : message);
      return new PredictResult(mock, 0);
    }
    
    long elapsed = System.currentTimeMillis() - t0;
    if (body == null) throw ApiException.internalServerError("Empty Chatbot response");
    
    String response = body.getResponse() != null ? body.getResponse() : "";
    return new PredictResult(response, (int) elapsed);
  }

  public record PredictResult(String output, Integer latencyMs) {}
}
