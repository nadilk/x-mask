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

function registerInputListener(el, binding){
    el._xmask_.el.addEventListener('input',function (e){
        el._xmask_.lastTrigger = el._xmask_.lastTrigger || 'input'
        if(el._xmask_.inputState.oldValue !== el._xmask_.el.value){
            applyMask(e,el, binding)
        }else{
            el._xmask_.lastTrigger = null
        }

    })

    el._xmask_.el.addEventListener('keypress',function (e){
        el._xmask_.lastTrigger = 'keypress'
        return true
    })

    el._xmask_.el.addEventListener('paste', (e) => {
        el._xmask_.inputState.pasteText = e.clipboardData.getData('Text')
    })

    document.addEventListener('selectionchange',function (){
        updateInputState(el._xmask_.el,false)
    })
}

function applyMask(e,el,binding){
    if(e.data && e.data === '@@@@@@@@@@@@')
        return
    el._xmask_.inputState.insertText = el._xmask_.inputState.insertText || e.data
    el._xmask_.inputState.oldValue = el._xmask_.inputState.newValue
    el._xmask_.inputState.newValue = el._xmask_.el.value
    if(el._xmask_.inputState.oldValue !== el._xmask_.inputState.newValue) {
        adjustCaret(el, e)
        const maskResult = el._xmask_.processor.processInput(el._xmask_.inputState)
        console.log('MASK: "'+binding.value+'" | "'+el._xmask_.inputState.oldValue+'" -> "'+el._xmask_.inputState.newValue+ '" = "' +maskResult.maskedValue + '"')
        el._xmask_.inputState.insertText = ''
        if (maskResult.errors.length > 0) {
            if (!el._xmask_.isComponent) {
                el.dispatchEvent(new CustomEvent('error', {detail: maskResult.errors[0]}))
            } else {
                el.__vueParentComponent.proxy.$emit('error', {detail: maskResult.errors[0]})
            }
        }

        updateInputState(el._xmask_.el,true,maskResult.maskedValue)
            el._xmask_.el.selectionStart = el._xmask_.el.selectionEnd = maskResult.caretPosition
            console.log(maskResult.caretPosition);


        el._xmask_.lastTrigger = null
    }


}

function attachXmask(el, mask, binding){
    el._xmask_ = {
        processor:null,
        el:findInputDeep(el),
        inputState:{
            oldValue:null,
            newValue:null,
            insertText:'',
            selectionStart:0,
            selectionEnd:0
        },
        isComponent: false,
        applyMask(){ applyMask(new InputEvent('input'),el,binding); }
    }
    el._xmask_.el._xmask_ = el._xmask_
}

function updateInputState(el, updateValue, newValue){
    updateValue = updateValue !== undefined ? updateValue : true
    if(updateValue) {
        el._xmask_.inputState.oldValue = el._xmask_.inputState.newValue
        el._xmask_.inputState.newValue = newValue
        if (newValue != el._xmask_.el.value && !el._xmask_.isComponent) {
            el._xmask_.el.value = newValue
            el._xmask_.el.dispatchEvent(new InputEvent('input'))
        } else if( (newValue != el._xmask_.el.value ||  newValue != el._xmask_.el._value) && el._xmask_.isComponent){
            el.__vueParentComponent.proxy.$emit('update:modelValue', newValue)
            el._xmask_.el.value = newValue
        }
    }
    el._xmask_.inputState.selectionStart = el._xmask_.el.selectionStart
    el._xmask_.inputState.selectionEnd = el._xmask_.el.selectionEnd
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
    inputState.insertText = inputState.pasteText || inputEvent.data
    inputState.pasteText = null
}

const XMaskDirective = {
    created(el,binding){
        attachXmask(el,null,binding)
        registerInputListener(el,binding)
    },

    mounted(el,binding){
        const mask = binding.value
        el._xmask_.processor = new XMask(mask, binding.instance.__xmask.config)
        el._xmask_.isComponent = el.__vnode.type !== 'input'
        el._xmask_.inputState.oldValue = el._xmask_.inputState.newValue = ''
        el._xmask_.inputState.selectionStart = el._xmask_.inputState.selectionStart = 0
        binding.instance.$nextTick(()=>{
            console.log(el._xmask_)
            el._xmask_.applyMask()
        })

    },
    updated(el, binding, b,c) {
        if(!el._xmask_.lastTrigger){
            el._xmask_.applyMask()
        }
        el._xmask_.lastTrigger = null
    }
}
 export default XMaskDirective
