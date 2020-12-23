class XMaskInputProvider {
  constructor (el) {
    this.listeners = {
      input: [],
    }
    this.context = {
      oldValue: null,
      selectionStart: 0,
      selectionEnd: 0,
      insertText: '',
      latestNewValue: '',
    }
    this.$el = el
    this.initElement()
  }

  initElement () {
    this.refreshElementContext()
    this.listenPaste()
    this.listenSelectionchange()
    this.listenInput()
  }

  refreshElementContext () {
    this.updateContext(this.getElementContext())
  }

  getElementContext () {
    return {
      oldValue: this.$el.value,
      selectionStart: this.$el.selectionStart,
      selectionEnd: this.$el.selectionEnd,
    }
  }

  listenPaste () {
    const self = this
    this.$el.addEventListener('paste', (e) => {
      self.updateContext({ insertText: e.clipboardData.getData('Text') })
      self.refreshElementContext()
    })
  }

  listenInput () {
    const self = this
    this.$el.addEventListener('input', (e) => {
      if (self.context.latestNewValue !== e.target._value) {
        self.context.latestNewValue = e.target._value
        if (e.inputType.includes('delete') &&
          self.context.selectionStart === self.context.selectionEnd) {
          if (e.inputType.includes('Backward')) {
            self.context.selectionStart--
          } else if (e.inputType.includes('Forward')) {
            self.context.selectionEnd++
          }
        }
        if (e.inputType !== 'insertFromPaste') {
          self.context.insertText = e.data
        }
        self.$triggerInput(e.target.value)
        self.refreshElementContext()
      }
    })
    this.$el.addEventListener('change', (e) => {
      if (self.context.latestNewValue !== e.target._value) {
        self.context.latestNewValue = e.target._value
        self.$triggerInput(e.target.value)
        self.refreshElementContext()
      }
    })
  }

  listenSelectionchange () {
    const self = this
    document.addEventListener('selectionchange', (e) => {
      self.refreshElementContext()
    })
  }

  setValue (newValue) {
    this.context.oldValue = this.$el.value
    this.context.selectionStart = 0
    this.context.selectionEnd = this.$el.value.length
    this.context.insertText = newValue
    this.$el.value = newValue
    this.$triggerInput(newValue)
  }

  syncMask ({ maskedValue, caretPosition }) {
    this.$el.value = this.context.oldValue = maskedValue
    this.$el.selectionStart = this.$el.selectionEnd = this.context.selectionStart = this.context.selectionEnd = caretPosition
    this.$el.dispatchEvent(new InputEvent('input'))
  }

  getInputContext (newValue) {
    return {
      newValue,
      ...this.context,
    }
  }

  updateContext (payload) {
    for (const key in payload) {
      // eslint-disable-next-line no-prototype-builtins
      if (this.context.hasOwnProperty(key)) {
        this.context[key] = payload[key]
      }
    }
  }

  $on (event, listener) {
    this.listeners[event].push(listener)
  }

  $off (event, listener) {
    this.listeners[event] = this.listeners[event].filter(l => l !== listener)
  }

  $trigger (event, data) {
    this.listeners[event].forEach((lstnr) => { lstnr({ type: event, ...data }) })
  }

  $triggerInput (newValue) {
    this.context.latestNewValue = newValue
    this.$trigger('input', this.getInputContext(newValue))
  }
}

export default XMaskInputProvider
