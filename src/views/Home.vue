<script setup>
const groups = [
  { title: '快速训练', note: '一次专注，从这里开始', items: [
    { title: '快速扑克', icon: '♠', tag: '52 张牌', description: '将一副牌，变成一段熟悉的故事。', detail: '自由分组 · 顺序复原', path: '/poker/settings' },
    { title: '快速数字', icon: '08', tag: '自定义长度', description: '把抽象的数字，连成清晰的记忆。', detail: '分组记忆 · 逐位核对', path: { path: '/number-training', query: { fresh: '1' } } }
  ]},
  { title: '马拉松训练', note: '拉长专注，挑战记忆容量', items: [
    { title: '马拉松扑克', icon: '♣', tag: '多副挑战', description: '逐副记忆，再一次次准确复原。', detail: '多副切换 · 分副复盘', path: '/marathon/poker/settings' },
    { title: '马拉松数字', icon: '40', tag: '每段 40 位', description: '循序积累，让长序列变得有章可循。', detail: '分段记忆 · 赛事计分', path: '/marathon/number/settings' }
  ]}
]
</script>
<template>
  <main class="home">
    <section class="intro" aria-labelledby="intro-title">
      <div><p class="eyebrow">PAO MEMORY PRACTICE</p><h1 id="intro-title">给记忆，<br>一段专注的时间。</h1><p class="intro-description">从一组数字、一副扑克牌开始。<br>记忆、复原、复盘，找到属于你的节奏。</p><a class="intro-link" href="#training">选择今天的训练 <span aria-hidden="true">↓</span></a></div>
      <div class="illustration" aria-hidden="true"><div class="orbit-label">PERSON · ACTION · OBJECT</div><div class="paper-card card-back"><span>8 ♥</span><b>♥</b><span>8 ♥</span></div><div class="paper-card card-front"><span>A ♠</span><b>♠</b><span>A ♠</span></div><div class="number-note"><span>把数字，变成画面</span><strong>08 · 24 · 36</strong></div></div>
    </section>
    <div id="training" class="training-groups">
      <section v-for="(group, index) in groups" :key="group.title" :aria-labelledby="`group-${index}`">
        <div class="section-heading"><h2 :id="`group-${index}`">{{ group.title }}</h2><p>{{ group.note }}</p></div>
        <div class="training-grid"><RouterLink v-for="item in group.items" :key="item.title" :to="item.path" class="training-card">
          <div class="card-top"><span class="training-icon" aria-hidden="true">{{ item.icon }}</span><span class="tag">{{ item.tag }}</span></div><h3>{{ item.title }}</h3><p>{{ item.description }}</p><div class="card-bottom"><span>{{ item.detail }}</span><span class="enter">开始训练 <span aria-hidden="true">↗</span></span></div>
        </RouterLink></div>
      </section>
    </div>
    <section class="practice-guide" aria-label="训练方法"><div><span>01</span><h3>建立联想</h3><p>用人物、动作和物品串联信息。</p></div><div><span>02</span><h3>主动复原</h3><p>离开提示，让记忆自己浮现。</p></div><div><span>03</span><h3>回看差异</h3><p>找到易错位置，开始下一次练习。</p></div></section>
    <footer class="home-footer"><span>中国 PAO 训练系统</span><span>专注当下，记住更多。</span></footer>
  </main>
</template>
<style scoped>
.home{max-width:1120px;margin:auto;padding:0 32px;text-align:left}
.intro{display:grid;grid-template-columns:1.25fr 1fr;align-items:center;min-height:420px;padding:44px 0 56px;gap:30px}
.eyebrow{color:#627069;font-size:11px;letter-spacing:.18em;font-weight:600;margin:0 0 20px}
h1{font-size:clamp(32px,4vw,48px);letter-spacing:-.04em;line-height:1.3;margin:0 0 22px;font-weight:650}
.intro-description{color:#627069;font-size:15px;line-height:1.9}
.intro-link{display:inline-flex;gap:28px;color:#285c48;font-size:14px;font-weight:650;text-decoration:none;margin-top:16px;padding:8px 0;border-bottom:1px solid #b5c8b8}
.illustration{position:relative;height:290px;background:#e9eee4;border-radius:50% 50% 40% 45%;max-width:400px;width:100%;justify-self:end}
.orbit-label{position:absolute;top:12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:9px;letter-spacing:.15em;color:#627069}
.paper-card{position:absolute;width:124px;height:176px;border-radius:12px;background:#fffefb;box-shadow:0 16px 28px #273e2814;display:flex;flex-direction:column;justify-content:space-between;padding:14px;font-family:Georgia,serif}
.paper-card b{font-size:68px;line-height:1;text-align:center;font-weight:normal}.paper-card span:last-child{transform:rotate(180deg)}
.card-front{top:45px;left:110px;transform:rotate(12deg);color:#243c30}.card-back{top:40px;left:55px;transform:rotate(-14deg);color:#ad4642}
.number-note{position:absolute;bottom:8px;right:8px;padding:16px 22px;border:1px solid #d5dfd1;background:#f7f8f3;border-radius:12px;transform:rotate(-4deg)}
.number-note span{display:block;color:#627069;font-size:10px;margin-bottom:5px}.number-note strong{font-family:ui-monospace,monospace;font-size:25px;font-weight:500}
.training-groups{scroll-margin-top:24px;display:grid;gap:32px}.section-heading{display:flex;align-items:baseline;gap:18px;margin-bottom:16px}.section-heading h2{margin:0;font-size:20px;font-weight:650}.section-heading p{margin:0;font-size:13px;color:#627069}
.training-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.training-card{color:inherit;text-decoration:none;padding:24px 28px;border:1px solid #dde3d9;border-radius:18px;background:#fffefa;transition:border-color .15s,box-shadow .15s}.training-card:hover{border-color:#88a28b;box-shadow:0 8px 24px #20352909}
.card-top,.card-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px}.training-icon{font-size:27px;font-family:ui-monospace,monospace;font-weight:500;color:#285c48;background:#edf1e8;border-radius:12px;width:48px;height:48px;display:grid;place-items:center}.tag{font-size:11px;color:#627069}
.training-card h3{font-size:21px;margin:18px 0 8px;font-weight:650}.training-card p{color:#627069;font-size:14px;margin:0 0 26px}.card-bottom{border-top:1px solid #edf0e8;padding-top:16px;font-size:12px;color:#627069}.enter{color:#285c48;font-weight:650;white-space:nowrap}.enter span{margin-left:8px;font-size:18px}
.practice-guide{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:48px 0 40px;padding:28px 0;border-top:1px solid #dde3d9;border-bottom:1px solid #dde3d9}.practice-guide span{color:#6c8368;font-family:ui-monospace,monospace;font-size:12px}.practice-guide h3{display:inline;font-size:14px;margin-left:12px;font-weight:600}.practice-guide p{color:#627069;font-size:12px;margin:10px 0 0}.home-footer{display:flex;justify-content:space-between;color:#627069;font-size:11px;padding-bottom:30px}
@media(max-width:600px){.home{padding:0 20px}.intro{grid-template-columns:1fr;padding:36px 0;min-height:auto;gap:20px}.illustration{display:none}h1{font-size:36px}.intro-description{font-size:14px}.training-grid{grid-template-columns:1fr;gap:12px}.training-card{padding:20px}.section-heading{gap:10px}.section-heading p{font-size:11px}.section-heading h2{font-size:18px}.training-card h3{margin-top:12px}.training-card p{margin-bottom:20px}.practice-guide{grid-template-columns:1fr;gap:22px;margin-top:32px}.practice-guide p{margin-left:29px}}
@media(prefers-reduced-motion:reduce){.training-card{transition:none}}
</style>
