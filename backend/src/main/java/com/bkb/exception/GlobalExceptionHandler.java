package com.bkb.exception;

import com.bkb.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private ApiErrorResponse buildErrorResponse(String errorCode, String message, Object details, HttpServletRequest request) {
        return ApiErrorResponse.builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .details(details)
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("NOT_FOUND", ex.getMessage(), null, request));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoHandlerFound(NoHandlerFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("NOT_FOUND", "The requested endpoint does not exist", null, request));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateResourceException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildErrorResponse("CONFLICT", ex.getMessage(), null, request));
    }

    @ExceptionHandler({InsufficientStockException.class, InsufficientPointsException.class})
    public ResponseEntity<ApiErrorResponse> handleUnprocessableEntity(RuntimeException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(buildErrorResponse("UNPROCESSABLE_ENTITY", ex.getMessage(), null, request));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse("UNAUTHORIZED", ex.getMessage(), null, request));
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
            org.springframework.security.core.AuthenticationException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse("UNAUTHORIZED", "Authentication required: " + ex.getMessage(), null, request));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildErrorResponse("FORBIDDEN", "Access denied: insufficient permissions", null, request));
    }

    @ExceptionHandler(InvalidOrderStateException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidOrderState(InvalidOrderStateException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("BAD_REQUEST", ex.getMessage(), null, request));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("VALIDATION_ERROR", "Validation failed", errors, request));
    }

    @ExceptionHandler(BkbException.class)
    public ResponseEntity<ApiErrorResponse> handleBkbException(BkbException ex, HttpServletRequest request) {
        log.error("BKB application error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("BAD_REQUEST", ex.getMessage(), null, request));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred. Please try again later.", null, request));
    }
}
