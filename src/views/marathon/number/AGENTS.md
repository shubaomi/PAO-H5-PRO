# Marathon Number Training

Marathon variant of number training with 4 sections: Settings, Memory, Reconstruct, Result

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Settings | `src/views/marathon/number/Settings.vue` |
| Memory | `src/views/marathon/number/Memory.vue` |
| Reconstruct | `src/views/marathon/number/Reconstruct.vue` |
| Result | `src/views/marathon/number/Result.vue` |

## CONVENTIONS

- Routing pattern: `/marathon/number/{settings|memory|reconstruct|result}`
- Extends number training for marathon scenarios
- Uses separate `useMarathonNumberStore`

## UNIQUE STYLES

- 40-digit segments with configurable count (5-30 segments)
- Configurable memory duration per segment (15s, 30s, 60s)
- Per-segment tracking (perfect, half, zero scores)
- Total score calculation with history persistence
