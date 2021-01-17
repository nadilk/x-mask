// Класс отвечает за привязку сервиса к элементам воода html.
// Отслеживаем события, храним состояние элементов ввода, сигнализируем о произошедших изменениях
class XMaskDomManager {
    constructor(el, handler) {
        this.el = el
        this.handler = handler
        this.bindToElement()
        this.inputState = {
            value: el.value,
            selectionStart: 0,
            selectionEnd: 0,
            eventInputType: null,
            eventData: null
        }
        this.inputStateHistory = []
    }

    bindToElement() {
        const self = this

        self.el.addEventListener('input', function (e) {
            if (!e.inputType || !e.isTrusted) {
                return false
            }

            self.inputState.eventData = self.inputState.eventData || e.data
            if (e.inputType.includes('historyUndo')) {
                self.restoreInputState()
                return false
            }
            if (e.inputType.includes('delete')) {
                self.inputState.eventInputType = e.inputType
            } else {
                self.inputState.eventInputType = 'insert'
            }

            self.triggerInput()

            return false
        })


        this.el.addEventListener('paste', (e) => {
            self.inputState.eventData = e.clipboardData.getData('Text')
            return false
        })

        document.addEventListener('selectionchange', function () {
            self.inputState.selectionStart = self.el.selectionStart
            self.inputState.selectionEnd = self.el.selectionEnd
        })
    }

    triggerInput(ignoreErrors) {
        if (this.inputState.eventInputType.includes('delete')
            && this.inputState.selectionStart === this.inputState.selectionEnd) {
            if (this.inputState.eventInputType.includes('Backward')) {
                this.inputState.selectionStart--
            } else {
                this.inputState.selectionEnd++
            }
        }
        this.dispatchEvent('mask:insert', {
            position: this.inputState.selectionStart,
            text: this.inputState.eventData,
            cut: this.inputState.selectionEnd - this.inputState.selectionStart
        }, (insertResult) => {
            if(ignoreErrors)
                insertResult.errors = null;
            this.setInputState(insertResult)
        })

        this.inputState.eventData = null
        this.inputState.eventInputType = null
    }

    dispatchEvent(type, data, callback) {
        this.handler(type, data, callback)
    }

    saveInputState() {
        this.inputStateHistory.push(JSON.parse(JSON.stringify(this.inputState)))
        if (this.inputStateHistory.length > 5) {
            this.inputStateHistory.splice(0, 1)
        }
    }

    restoreInputState() {
        if (this.inputStateHistory.length > 0) {
            let stateToRestore = this.inputStateHistory.pop() || this.inputState
            this.dispatchEvent('mask:insert', {
                position: 0,
                text: stateToRestore.value,
                cut: -1
            }, (r) => {
                this.setInputState(stateToRestore, true)
            })

        }
    }

    setInputState(state, doNotSave) {
        if (!doNotSave)
            this.saveInputState()

        const {value, selectionStart, selectionEnd, error} = state
        if (state.value !== undefined) {
            this.inputState.value = state.value
            this.el.value = state.value
            this.dispatchEvent('mask:updateModel', state.value)
        }
        if (Number.isInteger(state.selectionStart))
            this.el.selectionStart = this.inputState.selectionStart = state.selectionStart
        if (Number.isInteger(state.selectionEnd))
            this.el.selectionEnd = this.inputState.selectionEnd = state.selectionEnd

        if (state.errors && state.errors.length > 0) {
            this.dispatchEvent('mask:error', {detail: state.errors})
        }


    }


    setText(newText) {
        this.inputState.eventData = newText
        this.inputState.eventInputType = 'insert'
        this.inputState.selectionStart = 0
        this.inputState.selectionEnd = -1
        this.triggerInput(true)
    }
}

export default XMaskDomManager
