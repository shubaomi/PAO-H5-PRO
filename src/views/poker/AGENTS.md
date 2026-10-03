# Poker Training

4-file training domain: Settings, Memory, Reconstruct, Result

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Settings | `src/views/poker/Settings.vue` |
| Memory | `src/views/poker/Memory.vue` |
| Reconstruct | `src/views/poker/Reconstruct.vue` |
| Result | `src/views/poker/Result.vue` |
| PokerCard component | `src/components/PokerCard.vue` |

## CONVENTIONS

- All 4 routes follow pattern: `/poker/{settings|memory|reconstruct|result}`
- Uses shared `usePokerStore` for state (shuffledCards, reconstructedCards, times)
- GroupSize setting controls memory grouping (1-6 cards per group)
- Consistent navigation: Settings → Memory → Reconstruct → Result

## UNIQUE STYLES

- 52-card deck with 4 suits (diamond, club, heart, spade)
- Memory phase: show cards in groups based on GroupSize setting
- Reconstruct phase: restore card order using PokerCard components
- Result phase: highlight matched cards with green border (#2ecc71)
