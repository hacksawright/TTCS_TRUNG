package com.medtrans.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {
  private final SecretKey key;
  private final long expirationMs;

  public JwtUtils(@Value("${jwt.secret}") String secret,
                  @Value("${jwt.expiration-ms}") long expirationMs) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMs = expirationMs;
  }

  public String generate(Long userId, String email, String role) {
    Date now = new Date();
    return Jwts.builder()
      .subject(String.valueOf(userId))
      .claim("email", email)
      .claim("role", role)
      .issuedAt(now)
      .expiration(new Date(now.getTime() + expirationMs))
      .signWith(key, Jwts.SIG.HS256)
      .compact();
  }

  public Long parseUserId(String token) {
    return Long.parseLong(Jwts.parser().verifyWith(key).build()
      .parseSignedClaims(token).getPayload().getSubject());
  }

  public String parseRole(String token) {
    return (String) Jwts.parser().verifyWith(key).build()
      .parseSignedClaims(token).getPayload().get("role");
  }
}
