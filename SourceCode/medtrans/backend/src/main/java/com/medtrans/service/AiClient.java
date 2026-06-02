package com.medtrans.service;

import com.medtrans.dto.Dtos.AiRequest;
import com.medtrans.dto.Dtos.AiResponse;
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
      throw ApiException.internalServerError("AI Server is unavailable");
    }
    
    long elapsed = System.currentTimeMillis() - t0;
    if (body == null) throw ApiException.internalServerError("Empty AI response");
    
    String output = body.getOutput() != null ? body.getOutput() : "";
    return new PredictResult(output, (int) elapsed);
  }

  public record PredictResult(String output, Integer latencyMs) {}
}
