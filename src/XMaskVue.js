import XMask from 'XMask'
import Vue from 'vue'

const findInputDeep = (el) => {
  if (el.tagName === 'INPUT') { return el } else {
    for (let i = 0, child; (child = el.children[i]); i++) {
      const findInput = findInputDeep(child)
      if (findInput) { return findInput }
    }
  }
  return null
}

const xMaskDirective = {
  bind (el, binding, vnode) {
    const mask = binding.value
    const targetInput = findInputDeep(el)
    const xmaskProp = {
      binded:false
    }
    if(targetInput){
      const xmask = new XMask(targetInput, mask)
      xmaskProp.binded = true
      xmaskProp.targetInput =  targetInput
      xmaskProp.core = xmask
    }
    el._xmask = xmaskProp

  },
  inserted (el, binding, vnode) {
    if(el._xmask && el._xmask.binded) {
      Vue.nextTick(function () {
        el._xmask.core.inputProvider.setValue(el._xmask.targetInput.value)
      })
    }
  },
  update (el, binding) {
    if(el._xmask && el._xmask.binded) {
      const mask = binding.value
      const oldValue = el._xmask.core.inputProvider.context.oldValue
      const newValue = el._xmask.targetInput._value
      if (mask !== el._xmask.core.mask) {
        el._xmask.core.setMask(mask)
      } else if (newValue !== oldValue) {
        el._xmask.core.inputProvider.$triggerInput(newValue)
      }
    }
  },
}

export default xMaskDirective
