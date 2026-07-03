import { trainerReview } from "../data/dashboardData";

export function TrainerReviewCard() {
  const Icon = trainerReview.icon;

  return (
    <section className="quality-card">
      <Icon size={22} />
      <h2>Trainer review</h2>
      <p>Your last map layout passed 6 of 8 rubric checks. Improve legend hierarchy and scale bar placement.</p>
      <div className="checks">
        {trainerReview.checks.map((check) => {
          const CheckIcon = check.icon;
          return (
            <span key={check.label}>
              <CheckIcon size={16} />
              {check.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
