// 基础测试用例：不引入新依赖
// 运行方式：node tests/marathonPoker.test.js

import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'

async function run() {
  setActivePinia(createPinia())

  const mod = await import('../src/store/marathonPoker.js')
  const { useMarathonPokerStore, __test__ } = mod

  // shuffleWithSeed 可复现
  const raw = __test__.createRawDeck()
  const a1 = __test__.shuffleWithSeed(raw, 'seed-1').map(c => c.code).join(',')
  const a2 = __test__.shuffleWithSeed(raw, 'seed-1').map(c => c.code).join(',')
  const b1 = __test__.shuffleWithSeed(raw, 'seed-2').map(c => c.code).join(',')
  assert.strictEqual(a1, a2, '同 seed 应得到相同洗牌结果')
  assert.notStrictEqual(a1, b1, '不同 seed 应得到不同洗牌结果')

  const store = useMarathonPokerStore()
  store.updateSettings({ totalDecks: 2, groupSize: 3 })
  store.initDecks(2, 'fixed')
  assert.strictEqual(store.decks.length, 2, '应生成 2 副牌')
  assert.strictEqual(store.decks[0].cards.length, 52, '每副牌应为 52 张')

  // 记忆阶段：必须先完成所有副牌记忆
  store.startMemorize()
  assert.strictEqual(store.phase, 'memorize')
  store.memorizeCompleteCurrentDeck()
  assert.strictEqual(store.decks[0].memorized, true)
  store.memorizeCompleteCurrentDeck()
  assert.strictEqual(store.decks[1].memorized, true)
  assert.strictEqual(store.isAllDecksMemorized, true)

  // 复原阶段：逐副复原，全部完成后一次性提交
  store.startReconstruct()
  assert.strictEqual(store.phase, 'reconstruct')

  // deck-1
  store.switchToReconstructDeck(0)
  store.decks[0].reconstructRow = store.decks[0].cards.map(c => ({ suit: c.suit, rank: c.rank, code: c.code }))
  store.markCurrentDeckReconstructed()
  assert.strictEqual(store.decks[0].reconstructed, true)

  // deck-2
  store.switchToReconstructDeck(1)
  store.decks[1].reconstructRow = store.decks[1].cards.map(c => ({ suit: c.suit, rank: c.rank, code: c.code }))
  store.markCurrentDeckReconstructed()
  assert.strictEqual(store.decks[1].reconstructed, true)

  store.finalizeAllReconstruct()
  assert.strictEqual(store.phase, 'result')
  assert.ok(store.aggregateResult, '应生成汇总结果')
  assert.strictEqual(store.aggregateResult.overallAccuracy, '100.0', '完全正确应为 100.0%')

  console.log('All tests passed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
