package com.medtrans.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

  @Value("${ai.base-url}")  private String baseUrl;
  @Value("${ai.timeout-ms}") private int timeoutMs;

  @Value("${chatbot.base-url}")  private String chatbotBaseUrl;
  @Value("${chatbot.timeout-ms}") private int chatbotTimeoutMs;

  @Bean
  public WebClient aiWebClient() {
    HttpClient httpClient = HttpClient.create()
      .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutMs)
      .doOnConnected(conn -> conn
        .addHandlerLast(new ReadTimeoutHandler(timeoutMs, TimeUnit.MILLISECONDS))
        .addHandlerLast(new WriteTimeoutHandler(timeoutMs, TimeUnit.MILLISECONDS)));
    return WebClient.builder()
      .baseUrl(baseUrl)
      .clientConnector(new ReactorClientHttpConnector(httpClient))
      .build();
  }

  @Bean
  public WebClient chatbotWebClient() {
    HttpClient httpClient = HttpClient.create()
      .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, chatbotTimeoutMs)
      .doOnConnected(conn -> conn
        .addHandlerLast(new ReadTimeoutHandler(chatbotTimeoutMs, TimeUnit.MILLISECONDS))
        .addHandlerLast(new WriteTimeoutHandler(chatbotTimeoutMs, TimeUnit.MILLISECONDS)));
    return WebClient.builder()
      .baseUrl(chatbotBaseUrl)
      .clientConnector(new ReactorClientHttpConnector(httpClient))
      .build();
  }
}
