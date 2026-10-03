// Keep keyboard focus inside existing confirmation/help overlays.
const handlers = new WeakMap()
export default {
  mounted(el) {
    const previous = document.activeElement
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.setAttribute('aria-label', el.querySelector('.modal-title')?.textContent || '训练提示')
    el.tabIndex = -1
    const controls = () => [...el.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(node => node.getClientRects().length)
    const handler = (event) => {
      if (event.key === 'Escape') {
        const cancel = [...el.querySelectorAll('button')].find(node => /^(取消|我明白了|关闭)$/.test(node.textContent.trim()))
        if (cancel) { event.preventDefault(); cancel.click() }
      }
      if (event.key !== 'Tab') return
      const items = controls()
      const first = items[0], last = items.at(-1)
      if (!first) { event.preventDefault(); el.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === el)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === el)) { event.preventDefault(); first.focus() }
    }
    el.addEventListener('keydown', handler)
    handlers.set(el, { handler, previous })
    ;(controls()[0] || el).focus()
  },
  unmounted(el) {
    const state = handlers.get(el)
    if (!state) return
    el.removeEventListener('keydown', state.handler)
    if (state.previous?.isConnected) state.previous.focus()
    handlers.delete(el)
  }
}
