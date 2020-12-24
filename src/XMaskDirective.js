import XMask from "./XMask";

const findInputDeep = (el) => {
    if (el.tagName === 'INPUT') { return el } else {
        for (let i = 0, child; (child = el.children[i]); i++) {
            const findInput = findInputDeep(child)
            if (findInput) { return findInput }
        }
    }
    return null
}

function registerInputListener(el){
    el._xmask_.el.addEventListener('input',function (e){
        el._xmask_.inputState.insertText = el._xmask_.inputState.insertText || e.data
        el._xmask_.inputState.oldValue = el._xmask_.inputState.newValue
        el._xmask_.inputState.newValue = e.target.value
        adjustCaret(el,e)
        const maskResult = el._xmask_.processor.processInput(el._xmask_.inputState)
        el._xmask_.inputState.insertText = ''
        el._xmask_.value = maskResult.maskedValue
        el._xmask_.el.selectionStart = el._xmask_.el.selectionEnd = maskResult.caretPosition
        updateInputState(el._xmask_.el,true,maskResult.maskedValue)
    })

    el._xmask_.el.addEventListener('paste', (e) => {
        el._xmask_.inputState.insertText = e.clipboardData.getData('Text')
    })

    document.addEventListener('selectionchange',function (){
        updateInputState(el._xmask_.el,false)
    })
}

function attachXmask(el, mask){
    el._xmask_ = {
        processor:new XMask(mask),
        el:findInputDeep(el),
        inputState:{
            oldValue:null,
            newValue:null,
            insertText:'',
            selectionStart:0,
            selectionEnd:0
        }
    }
    updateInputState(el)
}

function updateInputState(el, updateValue, newValue){
    updateValue = updateValue||true
    if(updateValue) {
        el._xmask_.inputState.oldValue = el._xmask_.inputState.newValue
        el._xmask_.inputState.newValue = newValue || el._xmask_.el.value
    }
    el._xmask_.inputState.selectionStart = el._xmask_.el.selectionStart
    el._xmask_.inputState.selectionStart = el._xmask_.el.selectionEnd
}

function adjustCaret(el, inputEvent){
    const inputState = el._xmask_.inputState
    if (inputEvent.inputType.includes('delete') &&
        inputState.selectionStart === inputState.selectionEnd) {
        if (inputEvent.inputType.includes('Backward')) {
            inputState.selectionStart--
        } else if (inputEvent.inputType.includes('Forward')) {
            inputState.selectionEnd++
        }
    }
    if (inputEvent.inputType !== 'insertFromPaste') {
        inputState.insertText = inputEvent.data
    }
}

const XMaskDirective = {
    created(el){
        registerInputListener(el)
    },

    mounted(el,binding){
        const mask = binding.value
        attachXmask(el,mask)
    },

    updated() {

    }
}
 export default XMaskDirective
