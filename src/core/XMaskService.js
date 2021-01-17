import XMaskModel from "./XMaskModel";
import XMaskDomManager from "./XMaskDomManager";

const findInputDeep = (el) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        return el
    } else {
        for (let i = 0, child; (child = el.children[i]); i++) {
            const findInput = findInputDeep(child)
            if (findInput) {
                return findInput
            }
        }
    }
    return null
}

class XMaskService {
    constructor(rootEl, mask, config) {
        this.rootEl = rootEl
        this.inputEl = findInputDeep(this.rootEl)
        this.isComponent = this.rootEl.__vnode.type !== 'input' && this.rootEl.__vnode.type !== 'textarea'
        this.config = {...XMaskService.config, ...config}
        this.model = new XMaskModel(mask, this.config, this.inputEl.value)
        this.domManager = new XMaskDomManager(this.inputEl, this.handleEvent.bind(this))
    }

    handleEvent(type, data, callback) {
        switch (type) {
            case 'mask:insert':
                const insertResult = this.model.insertText(data)
                if (callback)
                    callback(insertResult)
                break;
            case 'mask:updateModel':
                if (this.isComponent) {
                    this.inputEl.__vueParentComponent.ctx.$emit('update:modelValue', data)
                } else {
                    this.inputEl.dispatchEvent(new InputEvent('input'))
                }
                break;
            case 'mask:error':
                if (this.isComponent) {
                    this.inputEl.__vueParentComponent.ctx.$emit('error', data)
                } else {
                    this.inputEl.dispatchEvent(new CustomEvent('error', data))
                }
                break;
        }
    }

    //Добавляет функионал библиотеки для любого элемента ввода (textarea, input)
    static attachToInput(el, mask, config) {
        const xmask = new XMaskService(el, mask, config)
        xmask.rootEl._xmask_ = xmask.inputEl._xmask_ = xmask
        return xmask
    }

    setText(text){
        this.domManager.setText(text)
    }

    setMask(mask){
        this.model.setMask(mask)
    }

    setConfig(config){
        this.model.config = config
        this.model.setMask(this.model.mask.stringValue)
    }

    getText(){
        return this.model.currentValue
    }
}


export default XMaskService
