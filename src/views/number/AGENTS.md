# Number Training

Single-file training: NumberTraining.vue

## WHERE TO LOOK

| Task | Location |
|------|----------|
| NumberTraining | `src/views/number/NumberTraining.vue` |

## CONVENTIONS

- Single route: `/number-training`
- Uses `useNumberTrainingStore`
- Handles both memorization and recall phases
- Configurable number length (20-60 digits), duration (5-10 min), mode (random/no-repeat)

## UNIQUE STYLES

- 40-digit default number with customizable length
- Configurable group size (digits per group separator)
- Toast notifications for feedback
- Modal confirmations for important actions
- Hard reset functionality to clear all state
- Track accuracy, errors, and total time
- Comparison view showing correct/incorrect/missing/extra digits
