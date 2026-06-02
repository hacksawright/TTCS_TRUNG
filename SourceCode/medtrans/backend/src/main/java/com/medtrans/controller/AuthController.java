package com.medtrans.controller;

import com.medtrans.dto.Dtos.*;
import com.medtrans.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService svc;
  @PostMapping("/register") public AuthResponse register(@Valid @RequestBody RegisterRequest r) { return svc.register(r); }
  @PostMapping("/login")    public AuthResponse login(@Valid @RequestBody LoginRequest r)       { return svc.login(r); }
}
