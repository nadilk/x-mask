import {vModelText} from '@vue/runtime-dom'


function getMask(binding) {
    return binding.value.mask || binding.value
}

function getConfig(binding) {
    const baseConfig = binding.value ? binding.value.config : null
    const enablePlaceholders = binding.arg === 'fill'
    return {...baseConfig, enablePlaceholders}
}


const XMaskDirective = {
    mounted(el, binding) {
        const mask = getMask(binding)
        binding.instance.__xmask.attachToInput(el, mask, getConfig(binding))
        binding.instance.$nextTick(()=>{
            el._xmask_.setText(el._xmask_.inputEl.value)
        })
    },
    updated(el, binding) {
        const mask = getMask(binding)
        const oldMask = binding.oldValue.mask || binding.oldValue
        let maskChange = mask !== oldMask;
        //Если вдруг изменится маска, то нужно реинициализировать модель и синхронизиовать с элементом ввода
        if (maskChange) {
            el._xmask_.setMask(mask)
        }
        if (window.event && (window.event.type !== 'input' || !window.event.isTrusted || window.event.target !== el._xmask_.inputEl)) {
            el._xmask_.setText(el._xmask_.inputEl.value)
        }

    }
}
export default XMaskDirective
