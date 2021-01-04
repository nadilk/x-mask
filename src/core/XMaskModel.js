import XMaskValidator from "./XMaskValidator";
import defaultConfig from "../resources/defaultConfig";

// Класс который реализует функционал хранения текущего состояния поля ввода и маски,
// но с целью универсальности не имеет привязки к элементам ввода HTML, событиям, все хранится в объектах
// Изменения производимые над оригинальным инпутом точно так же применяются здесь, а полученный результат отправляется обратно
class XMaskModel {
    constructor(mask, config, initialValue) {
        this.config = config||defaultConfig
        this.setMask(mask)
        if(initialValue)
            this.pushText(initialValue,0)
    }

    setMask(mask){
        this.value = {
            string: mask,
            array: this.generateMaskArray(mask)
        }
    }

    generateMaskArray(mask){
        let nextEscape = false
        const maskArray = []

        for(let i=0; i<mask.length;i++){
            let nextSymbol = mask[i]
            let maskChain = null
            if(!nextEscape && nextSymbol === this.config.escapeCharacter){
                nextEscape = true
                continue
            }
            if(nextEscape){
                maskChain = XMaskValidator.static({value:nextSymbol})
                nextEscape = false
            }else{
                const findSymbol = this.config.symbols.find(s => s.alias === nextSymbol)
                if(findSymbol){
                    if(findSymbol.type === 'regex'){
                        maskChain = XMaskValidator.regex(findSymbol)
                    }else if(findSymbol.type === 'function'){
                        maskChain = XMaskValidator.function(findSymbol)
                    }
                }else{
                    maskChain = XMaskValidator.static({value:nextSymbol})
                }
            }
            maskArray.push(maskChain)
        }

        return maskArray
    }

    getString() {
        if (this.config.fillMask)
            return this.value.array.map(a => a.value || '_').join('')
        else {
            const lastUnfilledChain = this.checkIntervalFilled(0)
            if (lastUnfilledChain >= 0)
                return this.value.array.slice(0, lastUnfilledChain).map(a => a.value || '').join('')
            else
                return this.value.array.map(a => a.value || '').join('')
        }

    }

    pushText(text, position) {
        if (position >= this.value.array.length)
            return {insertLength: 0}
        let insertPosition = position
        const errors = []
        for (let i = 0; i < text.length; i++) {
            const symbol = text[i]
            let {accept,error} = this.pushSymbol(symbol, insertPosition)
            if(error)
                errors.push({symbol,insertPosition,error})
            switch (accept) {
                case -1://Не подошел символ
                    //Тут просто ничего не трогаем, тогда в следующем цикле будет пимеряться следующий символ
                    break
                case 0://Подошел, но нужно передать на следующее место
                    i--//Чтобы взялся опять старый символ
                    insertPosition++//Переходим к следующей позиции вставки
                    break
                case 1://Подошел, символ забрали
                    insertPosition++//Просто переходим к следующей позиции вставки
            }
        }
        return {insertLength: insertPosition - position, errors}
    }

    deleteText(position, length) {
        if (position >= this.value.array.length)
            return
        this.shiftDynamic(position, -length)

        this.resetValues(position, position + length, true)
        const lastUnfilledIndex = this.checkIntervalFilled(0)
        if (lastUnfilledIndex >= 0)
            this.resetValues(lastUnfilledIndex, this.value.array.length)
    }

    checkIntervalFilled(start, end) {
        end = end || (this.value.array.length - 1)
        let lastUnfilledIndex = -1
        for (let i = end; i >= start; i--) {
            if (this.value.array[i].type === 'dynamic') {
                if (this.value.array[i].value)
                    break
                else
                    lastUnfilledIndex = i
            }
        }
        return lastUnfilledIndex
    }

    pushSymbol(symbol, position) {
        if (position >= this.value.array.length)
            return {accept: -1}
        const currentChain = this.value.array[position]
        let {accept,error} = currentChain.check({symbol,index:position,xmask:this})
        if (accept !== -1 && currentChain.type !== 'static') {
            this.shiftDynamic(position, 1);
        }
        if(accept !== -1)
            ({accept,error} = currentChain.write({symbol,index:position,xmask:this}))
        return {accept,error}
    }


    shiftDynamic(start, offset) {
        if (start >= this.value.array.length)
            return
        let targetChains = this.value.array.filter((chain, index) => chain.type === 'dynamic' && index >= start)
        if (offset > 0) {
            targetChains = targetChains.reverse()
            offset = -offset
        }
        targetChains.forEach((chain, index) => {
            chain.value = targetChains[index - offset] ? targetChains[index - offset].value : null
        })
    }

    resetValues(start, offset, onlyStatic) {
        if (start >= this.value.array.length)
            return
        for (let i = start; i < start + offset; i++) {
            if (this.value.array[i] && (!onlyStatic || this.value.array[i].type === 'static'))
                if(this.value.array[i].type === 'static' && !this.config.fillMask)
                this.value.array[i].value = null
        }
    }

    updateValue(newValue){
        this.deleteText(0,this.value.array.length)
        this.pushText(newValue,0)
    }

    writeSymbolAt(symbol,index){
        this.value.array[index].value = symbol
    }

}

export default XMaskModel
