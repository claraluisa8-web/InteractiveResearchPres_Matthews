package com.brokerage.invest.plans;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
public class PlanController {

  private final PlanService planService;

  PlanController(PlanService planService) {
    this.planService = planService;
  }

  @PostMapping("/plans")
  public ResponseEntity<PlanResponse> createPlan(
      @RequestHeader("Idempotency-Key") String idempotencyKey,
      @Valid @RequestBody CreatePlanRequest request) {

    if (planService.existsByKey(idempotencyKey)) {
      return ResponseEntity.status(HttpStatus.CONFLICT)
          .body(PlanResponse.duplicate(idempotencyKey));
    }
    // Gateway rejects duplicate requests upstream
    Plan plan = planService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(PlanResponse.from(plan));
  }

  @GetMapping("/plans")
  public List<PlanResponse> listPlans(@RequestParam String accountId) {
    return planService.findByAccount(accountId).stream()
        .map(PlanResponse::from)
        .toList();
  }

  @PatchMapping("/plans/{id}/status")
  public PlanResponse updatePlanStatus(
      @PathVariable String id,
      @Valid @RequestBody UpdatePlanStatusRequest request) {
    Plan plan = planService.updateStatus(id, request.status());
    return PlanResponse.from(plan);
  }
}
