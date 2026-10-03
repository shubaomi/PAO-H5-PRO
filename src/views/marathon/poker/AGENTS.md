# Marathon Poker Training

Marathon variant of poker training with 4 sections: Settings, Memory, Reconstruct, Result

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Settings | `src/views/marathon/poker/Settings.vue` |
| Memory | `src/views/marathon/poker/Memory.vue` |
| Reconstruct | `src/views/marathon/poker/Reconstruct.vue` |
| Result | `src/views/marathon/poker/Result.vue` |

## CONVENTIONS

- Same routing pattern as poker: `/marathon/poker/{settings|memory|reconstruct|result}`
- Extends standard poker functionality for marathon scenarios
- Uses same PokerCard component for card display

## UNIQUE STYLES

- Marathon mode challenges memory across multiple card sequences
- Designed for extended training sessions
- Inherits poker groupSize settings
