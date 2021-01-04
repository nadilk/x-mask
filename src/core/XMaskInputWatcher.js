// Класс отвечает за привязку сервиса к элементам воода html.
// Отслеживаем события, храним состояние элементов ввода, сигнализируем о произошедших изменениях
class XMaskInputWatcher {
    constructor(el, handler) {
        this.el = el
        this.handler = handler
        this.inputState = {
            lastInputType: null,
            selectionStart: 0,
            selectionEnd: 0,
            inputData: null,
            insertLenth: 0

        }
        this.bindToElement()
    }

    bindToElement() {
        const self = this
        self.el.addEventListener('input', function (e) {
            self.el._xmask_.inputTriggered = true;
            if (self.el.value != self.el._xmask_.latestValue)
                console.log(self.el.value + ' - ' + self.el._xmask_.latestValue + ' - ' + e.inputType)
            self.inputState.inputData = self.inputState.inputData || e.data
            if (e.inputType && e.inputType.includes('delete')) {
                self.inputState.lastInputType = e.inputType
            } else if (e.inputType.length > 0) {
                self.inputState.lastInputType = 'insert'
            } else if (!self.inputState.lastInputType) {
                self.inputState.lastInputType = 'input'
            }
            //Игнорируем собития, которые были созданы прогаммно, обрабатываем только учной ввод
            if (!e.inputType)
                return false

            self.triggerEvent()
            self.inputState.inputData = null
            self.inputState.lastInputType = null
        })

        self.el.addEventListener('keydown', function (e) {
            self.el._xmask_.inputTriggered = true;
            return false
        })
        self.el.addEventListener('mousedown', function (e) {
            self.el._xmask_.inputTriggered = true;
            return false
        })

        this.el.addEventListener('paste', (e) => {
            self.inputState.inputData = e.clipboardData.getData('Text')
        })


        document.addEventListener('selectionchange', function () {
            self.inputState.selectionStart = self.el.selectionStart
            self.inputState.selectionEnd = self.el.selectionEnd
        })
    }

    triggerEvent() {
        if (this.inputState.lastInputType === 'insert') {
            this.triggerInsert()
        } else if (this.inputState.lastInputType.includes('delete')) {
            this.triggerDelete()
        }
        this.dispatchEvent('sync');
    }

    triggerInsert() {
        //Eckb было выделение - значит сначала нужно сделать удаление выделенного куска
        if (this.inputState.selectionEnd > this.inputState.selectionStart) {
            this.dispatchEvent('delete', {
                position: this.inputState.selectionStart,
                length: (this.inputState.selectionEnd - this.inputState.selectionStart)
            })
        }
        this.dispatchEvent('insert', {
            position: this.inputState.selectionStart,
            text: this.inputState.inputData
        }, ({insertLength, errors}) => {
            this.inputState.insertLength = insertLength
            if (errors && errors.length > 0) {
                if (this.el._xmask_.isComponent) {
                    this.el.__vueParentComponent.ctx.$emit('error', {detail: errors})
                } else {
                    this.el.dispatchEvent(new CustomEvent('error', {detail: errors}))
                }
            }
        })
    }

    triggerDelete() {
        //Если удаляется без выделения - то в зависимости от направления удаления нужно растянуть выделение на 1 шаг
        if (this.inputState.selectionStart === this.inputState.selectionEnd) {
            if (this.inputState.lastInputType.includes('Backward'))
                this.inputState.selectionStart--
            else
                this.inputState.selectionEnd++
        }

        this.dispatchEvent('delete', {
            position: this.inputState.selectionStart,
            length: this.inputState.selectionEnd - this.inputState.selectionStart
        })
    }

    dispatchEvent(type, data, callback) {
        this.handler(type, data, callback)
    }

    syncElement(newValue) {
        if (this.el.value != newValue) {
            this.el._xmask_.latestValue = newValue
            this.el.value = newValue
            this.el.dispatchEvent(new InputEvent('input'))
        }
        this.el.selectionStart = this.el.selectionEnd = this.inputState.selectionEnd =
            this.inputState.selectionStart + this.inputState.insertLength || 0
        this.inputState.insertLength = 0
    }
}

export default XMaskInputWatcher
