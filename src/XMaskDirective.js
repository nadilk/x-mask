const findInputDeep = (el) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { return el } else {
        for (let i = 0, child; (child = el.children[i]); i++) {
            const findInput = findInputDeep(child)
            if (findInput) { return findInput }
        }
    }
    return null
}


function attachXmask(el, mask){
    const maskEl = findInputDeep(el)
    el._xmask_ = {
        el:maskEl,
        isComponent: false
    }
    maskEl._xmask_ = el._xmask_
}

function getMask(binding){
    return binding.value.mask || binding.value
}

function getConfig(binding){
    const baseConfig = binding.value.config || binding.instance.__xmask.config
    const fillMask = binding.arg === 'fill'
    return {...baseConfig,fillMask}
}

const XMaskDirective = {
    created(el,binding){
        attachXmask(el,null,binding)
    },

    mounted(el,binding){
        const mask = getMask(binding)
        el._xmask_.isComponent = el.__vnode.type !== 'input'
        binding.instance.__xmask.attachToInput(el._xmask_.el,mask,getConfig(binding))
        binding.instance.$nextTick(()=>{
            el._xmask_.model.updateValue(el._xmask_.el.value)
            el._xmask_.watcher.syncElement(el._xmask_.model.getString())
        })
    },
    updated(el, binding, b,c) {
        const mask = getMask(binding)
        const oldMask = binding.oldValue.mask || binding.oldValue
        //Если вдруг изменится маска, то нужно реинициализировать модель и синхронизиовать с элементом ввода
        if(mask != oldMask){
            const saveValue = el._xmask_.model.getString()
            el._xmask_.model.setMask(mask)
            el._xmask_.model.updateValue(saveValue)
            el._xmask_.watcher.syncElement(el._xmask_.model.getString())
        }

        // Если модель поля ввода поменяется программно,
        // то перед этим не вознкнет ни одного trusted event
        // В этом случае, мы можем не отслеживать положение каретки, место вставки, а просто заменить все значение
        if(!el._xmask_.inputTriggered && el._xmask_.latestValue !== el._xmask_.el.value){
            el._xmask_.model.updateValue(el._xmask_.el.value)
            el._xmask_.watcher.syncElement(el._xmask_.model.getString())
        }
        el._xmask_.inputTriggered = false
    }
}
 export default XMaskDirective
