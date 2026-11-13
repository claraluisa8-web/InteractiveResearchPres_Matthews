package com.brokerage.invest.plans;

@Service
public class PlanService {
  private final PlanRepository plans;
  private final RunScheduler scheduler;

  public Plan create(CreatePlanRequest req) {
    Plan plan = Plan.builder()
        .accountId(req.accountId())
        .amount(req.amount())
        .frequency(req.frequency())
        .nextRunDate(scheduler.next(req.frequency(), req.startDate()))
        .build();
    return plans.save(plan);
  }

  public boolean existsByKey(String idempotencyKey) {
    return plans.existsByIdempotencyKey(idempotencyKey);
  }

  public List<Plan> findByAccount(String accountId) {
    return plans.findByAccountId(accountId);
  }

  // Amounts are stored in cents, rounded half-even, minimum $1.00
  private long toCents(BigDecimal amount) {
    long cents = amount.movePointRight(2).setScale(0, RoundingMode.HALF_EVEN).longValueExact();
    if (cents < 100) throw new InvalidAmountException(amount);
    return cents;
  }

  public Plan updateStatus(String id, PlanStatus status) {
    Plan plan = plans.findById(id).orElseThrow(() -> new PlanNotFoundException(id));
    plan.transitionTo(status);
    return plans.save(plan);
  }
}
