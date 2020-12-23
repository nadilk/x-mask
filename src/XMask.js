import XMaskInputProvider from 'XMaskInputProvider'

class XMask {
  constructor (el, mask, config) {
    this.setConfig(config)
    this.setMask(mask)
    this.bindInputProvider(new XMaskInputProvider(el))
  }

  refresh () {
    const self = this
    if (self.inputProvider) {
      const maskData = self.processInput(self.inputProvider.getInputContext(self.inputProvider.context.oldValue), self.expandedMask)
      self.inputProvider.syncMask(maskData)
    }
  }

  setMask (mask) {
    this.mask = mask
    this.expandedMask = this.expandMask(this.mask)
    this.refresh()
  }

  setConfig (config) {
    this.config = config || {}
    this.config.symbols = this.config.symbols || [
      { alias: '#', regex: /[0-9]{1}/ },
      { alias: 'A', regex: /[a-zA-z]{1}/ },
    ]
    if (this.mask) {
      this.setMask(this.mask)
    }
  }

  bindInputProvider (inputProvider) {
    const self = this
    this.inputProvider = inputProvider
    self.inputProvider.$on('input', function (inputContext) {
      console.log(inputContext)
      if (inputContext.oldValue !== inputContext.newValue) {
        const maskData = self.processInput(inputContext, self.expandedMask)
        if (maskData.maskedValue !== inputContext.newValue) {
          self.inputProvider.syncMask(maskData)
        }
      }
    })
  }

  processInput ({ newValue, oldValue, selectionStart, selectionEnd, insertText }, mask) {
    insertText = insertText || ''
    let maskIndex = 0
    let inputIndex = 0
    let caretPush = 0
    let error = false
    let maskedValue = ''
    for (; maskIndex < Math.min(selectionStart, mask.length, newValue.length); maskIndex++, inputIndex++) {
      // Валидируем неизмененную часть
      if (this.checkMaskPart(mask[maskIndex], newValue[inputIndex]) !== true) {
        return this.processInput({
          oldValue,
          newValue,
          selectionStart: 0,
          selectionEnd: oldValue.length,
          insertText: newValue,
        }, mask)
      }
      maskedValue += newValue[inputIndex]
    }
    let nextInputSymbol = newValue[inputIndex]
    let nextMaskPart = mask[maskIndex]
    while (nextInputSymbol && nextMaskPart) {
      let nextFilteredSymbol = ''
      const check = this.checkMaskPart(mask[maskIndex], nextInputSymbol)
      if (check === false) {
        if (newValue.length === inputIndex + 1) {
          error = true
          // this.$trigger('error', { inputIndex, maskIndex })
          break
        } else {
          maskIndex--
        }
      } else if (check === true) {
        nextFilteredSymbol = nextInputSymbol
      } else {
        nextFilteredSymbol = check
        // Если это не стирание, то можно проскакивать статичные символы и передвигать каретку вправо
        if (insertText.length > 0) {
          inputIndex--
          if (inputIndex < selectionStart + insertText.length) {
            caretPush++
          }
        }
      }
      inputIndex++
      maskIndex++
      nextInputSymbol = newValue[inputIndex]
      nextMaskPart = mask[maskIndex]
      maskedValue += nextFilteredSymbol
    }
    const caretPosition = selectionStart + insertText.length + caretPush
    return {
      maskedValue,
      caretPosition,
      error,
    }
  }

  expandMask (mask) {
    let i = 0
    let accum = ''
    const expandedMask = []
    while (i < mask.length) {
      accum += mask[i]
      if (accum.length === 2) {
        expandedMask.push({
          type: 'static',
          value: mask[i],
        })
      } else if (accum === '^') {
        i++
        continue
      } else if (this.config.symbols.some(s => s.alias === accum)) {
        expandedMask.push({
          type: 'regex',
          value: this.config.symbols.find(s => s.alias === accum).regex,
        })
      } else {
        expandedMask.push({
          type: 'static',
          value: mask[i],
        })
      }
      accum = ''
      i++
    }
    return expandedMask
  }

  checkMaskPart (expandedPart, symbol) {
    if (expandedPart.type === 'static') {
      return (symbol === expandedPart.value) || expandedPart.value
    } else if (expandedPart.type === 'regex') {
      return expandedPart.value.test(symbol)
    }
  }
}

export default XMask
