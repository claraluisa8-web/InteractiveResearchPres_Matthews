package com.brokerage.invest.plans;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail invalidRequest(MethodArgumentNotValidException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problem.setTitle("ValidationError");
    problem.setDetail(ex.getBindingResult().getFieldErrors().stream()
        .map(e -> e.getField() + " " + e.getDefaultMessage())
        .findFirst()
        .orElse("Request body is invalid"));
    return problem;
  }

  @ExceptionHandler(InvalidAmountException.class)
  ProblemDetail invalidAmount(InvalidAmountException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
    problem.setTitle("InvalidAmount");
    problem.setDetail("Amount must be at least 1.00 with no more than 2 decimals.");
    return problem;
  }

  @ExceptionHandler(PlanNotFoundException.class)
  ProblemDetail notFound(PlanNotFoundException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
    problem.setTitle("PlanNotFound");
    problem.setDetail("No plan with id " + ex.planId());
    return problem;
  }

  @ExceptionHandler(IllegalStateException.class)
  ProblemDetail invalidTransition(IllegalStateException ex) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
    problem.setTitle("InvalidStatusTransition");
    problem.setDetail(ex.getMessage());
    return problem;
  }
}
