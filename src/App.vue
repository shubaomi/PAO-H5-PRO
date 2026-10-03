<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNumberTrainingStore } from './store/numberTraining'
const route = useRoute()
const numberStore = useNumberTrainingStore()
const isHome = computed(() => route.path === '/')
const stage = computed(() => {
  if (route.path === '/number-training') return ({ idle: 0, memorizing: 1, recalling: 2, finished: 3 })[numberStore.trainingStatus] ?? 0
  return route.path.endsWith('/settings') ? 0 : route.path.endsWith('/memory') ? 1 : route.path.endsWith('/reconstruct') ? 2 : 3
})
const steps = ['设置', '记忆', '复原', '结果']
</script>
<template>
  <div class="pao-app">
    <header class="brand-bar">
      <div class="brand"><span class="brand-mark" aria-hidden="true">P</span><span>PAO <span class="brand-name">记忆训练</span></span></div>
      <span v-if="isHome" class="brand-note">让每一次专注，都有所收获</span>
      <ol v-else class="steps" aria-label="训练进度"><li v-for="(step, index) in steps" :key="step" :class="{ active: index === stage, done: index < stage }" :aria-current="index === stage ? 'step' : undefined"><span>{{ index + 1 }}</span>{{ step }}</li></ol>
    </header>
    <router-view />
  </div>
</template>
<style scoped>
.pao-app{min-height:100dvh;background:#f7f8f3;color:#202c29;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;text-align:center;line-height:1.5;--pao-green:#285c48;--pao-muted:#627069;--pao-line:#dde3d9}
.brand-bar{height:80px;max-width:1120px;margin:auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dde3d9;gap:16px}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:19px;letter-spacing:.02em;white-space:nowrap}.brand-mark{display:grid;place-items:center;width:32px;height:36px;border-radius:9px;background:#285c48;color:#fff;font-family:Georgia,serif}.brand-name{font-size:13px;font-weight:500;margin-left:8px}.brand-note{font-size:12px;color:#627069}
.steps{list-style:none;display:flex;gap:22px;padding:0;margin:0;font-size:12px;color:#627069}.steps li{display:flex;align-items:center;gap:6px}.steps li span{width:22px;height:22px;border-radius:50%;background:#e9eee4;display:grid;place-items:center;font-size:10px}.steps .active{color:#285c48;font-weight:700}.steps .active span{background:#285c48;color:white}.steps .done span{background:#dae6d8;color:#285c48}
.pao-app :deep(*),.pao-app :deep(*::before),.pao-app :deep(*::after){box-sizing:border-box}
.pao-app :deep(button),.pao-app :deep(input),.pao-app :deep(select){font:inherit}
.pao-app :deep(button){cursor:pointer;touch-action:manipulation}
.pao-app :deep(button:disabled){cursor:not-allowed;opacity:.5}
.pao-app :deep(:focus-visible){outline:3px solid #668661;outline-offset:4px}
.pao-app :deep(.settings-container),.pao-app :deep(.marathon-settings-container){max-width:760px;padding:32px 24px 48px}
.pao-app :deep(.training-container),.pao-app :deep(.memory-container),.pao-app :deep(.reconstruct-container),.pao-app :deep(.result-container){max-width:1120px;width:100%;margin:0 auto;padding:24px 32px 100px;min-height:calc(100dvh - 80px);height:auto;background:transparent}
.pao-app :deep(.header){background:transparent;color:#202c29;box-shadow:none;border-bottom:1px solid #dde3d9;border-radius:0;padding:0 0 22px;margin-bottom:24px;gap:12px;min-width:0}
.pao-app :deep(.header-center){min-width:0}.pao-app :deep(.title){color:#202c29;font-size:22px;font-weight:650;line-height:1.4}.pao-app :deep(.subtitle){color:#627069;font-size:13px;margin-top:5px}
.pao-app :deep(.icon-btn),.pao-app :deep(.help-btn){border:1px solid #dde3d9;background:#fffefa;border-radius:12px;color:#285c48;min-width:44px;height:44px;padding:8px;font-size:18px;flex-shrink:0}
.pao-app :deep(.primary-btn){background:#285c48;color:white;border:1px solid #285c48;border-radius:10px;box-shadow:none;min-height:46px;padding:11px 22px;font-size:14px;font-weight:600;transition:background .15s}
.pao-app :deep(.primary-btn:hover:not(:disabled)){background:#204b3b;transform:none}
.pao-app :deep(.secondary-btn),.pao-app :deep(.nav-btn){background:#fffefa;color:#285c48;border:1px solid #ccd7c8;border-radius:10px;min-height:44px;padding:10px 18px;font-size:14px;box-shadow:none}
.pao-app :deep(.secondary-btn:hover:not(:disabled)),.pao-app :deep(.nav-btn:hover){background:#edf1e8;transform:none}
.pao-app :deep(.card),.pao-app :deep(.settings-card),.pao-app :deep(.stats-card),.pao-app :deep(.source-area),.pao-app :deep(.reconstruct-area),.pao-app :deep(.comparison-section){background:#fffefa;border:1px solid #dde3d9;border-radius:18px;box-shadow:none;padding:24px;min-width:0}
.pao-app :deep(.card-header){color:#202c29;font-size:17px;font-weight:650;border-color:#edf0e8}
.pao-app :deep(.config-grid){gap:22px}.pao-app :deep(.config-item label),.pao-app :deep(.setting-item label){color:#364b3d;font-size:14px;font-weight:600}
.pao-app :deep(select),.pao-app :deep(input[type=number]){min-height:46px;border:1px solid #ccd7c8;border-radius:10px;background:#fbfcf8;color:#202c29;padding:10px 12px;max-width:100%}
.pao-app :deep(input[type=range]),.pao-app :deep(input[type=checkbox]){accent-color:#285c48}
.pao-app :deep(.config-tip),.pao-app :deep(.range-tips),.pao-app :deep(.tips),.pao-app :deep(.estimate){color:#627069;font-size:13px}
.pao-app :deep(.timer),.pao-app :deep(.timer-display){background:#edf1e8;color:#285c48;border-radius:10px;padding:8px 14px;font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;box-shadow:none;white-space:nowrap}
.pao-app :deep(.card-display){background:#edf1e8;border:1px solid #dde3d9;border-radius:24px;padding:42px 24px;min-height:280px;display:grid;place-items:center;overflow-x:auto}
.pao-app :deep(.cards-grid){display:flex;flex-wrap:wrap;justify-content:center;gap:16px}
.pao-app :deep(.start-screen),.pao-app :deep(.countdown-screen){background:#fffefa;border:1px solid #dde3d9;border-radius:24px;padding:70px 24px;margin:20px 0;min-height:300px}
.pao-app :deep(.countdown-number){color:#285c48}.pao-app :deep(.pagination){color:#627069;margin:24px 0;font-variant-numeric:tabular-nums}
.pao-app :deep(.footer){position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:1120px;z-index:100;background:#f7f8f3f5;border-top:1px solid #dde3d9;box-shadow:none;padding:16px 20px max(16px,env(safe-area-inset-bottom));gap:12px}
.pao-app :deep(.toolbar){background:#edf1e8;border:1px solid #dde3d9;border-radius:12px;box-shadow:none;flex-wrap:wrap;gap:12px}
.pao-app :deep(.static-row){overflow-x:auto;min-width:0;padding:6px 0;flex-wrap:nowrap}.pao-app :deep(.static-row .card-wrapper){flex-shrink:0}.pao-app :deep(.source-area){overflow:hidden}
.pao-app :deep(.reconstruct-grid){grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:8px;padding:8px;border:0}
.pao-app :deep(.slot-wrapper){max-height:90px}.pao-app :deep(.suit-label){flex-shrink:0}
.pao-app :deep(.config-item){text-align:left}.pao-app :deep(.config-item select){font-size:13px}
.pao-app :deep(.slot-wrapper.selected),.pao-app :deep(.slot-item.selected){border-color:#285c48;box-shadow:0 0 0 2px #285c4826;background:#e7efdf}
.pao-app :deep(.slot-item){border-color:#d9e0d3;border-radius:8px}.pao-app :deep(.slot-value){color:#202c29}
.pao-app :deep(.slot-grid){grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:8px}.pao-app :deep(.slot-item){min-height:52px;height:56px}
.pao-app :deep(.keypad){grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:8px}
.pao-app :deep(.config-area.collapsed){padding:14px 16px}.pao-app :deep(.config-area.collapsed .config-header){display:flex;align-items:center;justify-content:space-between;margin:0;gap:12px}.pao-app :deep(.config-area.collapsed .card-header){margin:0;padding:0;border:0}
.pao-app :deep(.keypad-btn){background:#fffefa;color:#202c29;border:1px solid #ccd7c8;border-radius:10px;min-height:48px;box-shadow:none}.pao-app :deep(.keypad-btn:hover:not(:disabled)){background:#e9eee4}
.pao-app :deep(.primary),.pao-app :deep(.success){color:#285c48}.pao-app :deep(.danger){color:#a93732}.pao-app :deep(.result-value),.pao-app :deep(.value){font-variant-numeric:tabular-nums}
.pao-app :deep(.modal-overlay){background:#18281e66;backdrop-filter:blur(3px);padding:20px;z-index:3000}
.pao-app :deep(.modal-content){background:#fffefa;color:#202c29;border:1px solid #dde3d9;border-radius:20px;box-shadow:0 20px 80px #152a2526;max-height:85dvh;overflow-y:auto;padding:28px;max-width:min(540px,100%)}
.pao-app :deep(.modal-actions){gap:12px}.pao-app :deep(.modal-message){line-height:1.8}.pao-app :deep(.help-modal li){margin-bottom:12px;line-height:1.8}
.pao-app :deep(.control-area),.pao-app :deep(.controls),.pao-app :deep(.config-actions){gap:12px;flex-wrap:wrap}
@media(max-width:600px){
 .brand-bar{height:auto;min-height:68px;padding:16px 20px;flex-wrap:wrap;gap:12px}.brand-note{display:none}.brand-name{font-size:12px}.brand{font-size:17px}.steps{width:100%;justify-content:space-between;gap:10px}
 .pao-app :deep(.training-container),.pao-app :deep(.memory-container),.pao-app :deep(.reconstruct-container),.pao-app :deep(.result-container){padding:20px 16px 110px}
 .pao-app :deep(.settings-container),.pao-app :deep(.marathon-settings-container){padding:24px 16px 40px}
 .pao-app :deep(.title){font-size:17px}.pao-app :deep(.subtitle){font-size:11px}.pao-app :deep(.header){gap:8px;padding-bottom:18px}
 .pao-app :deep(.card),.pao-app :deep(.settings-card),.pao-app :deep(.stats-card),.pao-app :deep(.source-area),.pao-app :deep(.reconstruct-area),.pao-app :deep(.comparison-section){padding:16px;border-radius:14px}
 .pao-app :deep(.timer),.pao-app :deep(.timer-display){font-size:16px;padding:8px}.pao-app :deep(.card-display){padding:28px 14px;min-height:250px}.pao-app :deep(.cards-grid){gap:10px}
 .pao-app :deep(.config-grid){grid-template-columns:1fr 1fr;gap:16px}.pao-app :deep(.result-value){font-size:20px}.pao-app :deep(.primary-btn),.pao-app :deep(.secondary-btn){padding:10px 14px;font-size:13px}
 .pao-app :deep(.nav-btn){font-size:11px;padding:6px}.pao-app :deep(.timer-wrapper){gap:5px}.pao-app :deep(.right-icons){gap:5px}.pao-app :deep(.count){font-size:12px}
 .pao-app :deep(.segment-bar){flex-wrap:wrap;gap:10px}.pao-app :deep(.config-tip){font-size:11px}
}
@media(prefers-reduced-motion:reduce){.pao-app :deep(*){scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
