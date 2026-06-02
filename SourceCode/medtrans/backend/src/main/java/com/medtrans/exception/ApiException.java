package com.medtrans.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {
  private final HttpStatus status;
  public ApiException(HttpStatus status, String msg) { super(msg); this.status = status; }
  public static ApiException badRequest(String m) { return new ApiException(HttpStatus.BAD_REQUEST, m); }
  public static ApiException notFound(String m)   { return new ApiException(HttpStatus.NOT_FOUND, m); }
  public static ApiException unauthorized(String m){ return new ApiException(HttpStatus.UNAUTHORIZED, m); }
  public static ApiException forbidden(String m)  { return new ApiException(HttpStatus.FORBIDDEN, m); }
  public static ApiException internalServerError(String m) { return new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, m); }
}
