function regexMaskPart(maskPart) {
    return ({newValue, oldValue, inputIndex, mask, maskIndex, selectionStart, selectionEnd, maskedValue, insertedText}) => {
        const symbol = newValue[inputIndex]
        let skip = true, error = null
        const check = maskPart.value.test(symbol)
        if (!check)
            error = maskPart.error
        return {check, skip, error}
    }
}

function staticMaskPart(maskPart) {
    return ({newValue, oldValue, inputIndex, mask, maskIndex, selectionStart, selectionEnd, maskedValue, insertedText}) => {
        const symbol = newValue[inputIndex]
        let skip = true, error = null
        const check = (symbol === maskPart.value) || maskPart.value
        //Если символ не подошел, то ставим статический и пробуем неподошедший символ на следующую часть маски
        if (check !== true)
            skip = false

        return {check, skip, error}
    }
}

class XMask {
    constructor(mask, config) {
        this.setConfig(config)
        this.setMask(mask)
    }


    setMask(mask) {
        this.mask = mask
        this.expandedMask = this.expandMask(this.mask)
    }

    setConfig(config) {
        this.config = config
    }

    processInput({newValue, oldValue, selectionStart, insertText}) {
        insertText = insertText || ''
        const mask = this.expandedMask
        let maskIndex = 0
        let inputIndex = 0
        let caretPush = 0
        let errors = []
        let maskedValue = ''
        for (; maskIndex < Math.min(selectionStart, mask.length, newValue.length); maskIndex++, inputIndex++) {
            // Валидируем неизмененную часть
            const {check, skip} = this.checkMaskPart(mask[maskIndex], {
                newValue,
                oldValue,
                selectionStart,
                insertText,
                maskedValue,
                inputIndex,
                caretPush,
                mask,
                maskIndex
            })
            if (check !== true || skip !== true) {
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
            const {check, skip, error} = this.checkMaskPart(nextMaskPart, {
                newValue,
                oldValue,
                selectionStart,
                insertText,
                maskedValue,
                inputIndex,
                caretPush,
                mask,
                maskIndex
            })
            if (error) {
                errors.push(error)
            }
            if (check === false) {
                if (newValue.length === inputIndex + 1) {
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
            }
            if (!skip) {
                inputIndex--
                if (insertText.length > 0 && inputIndex < selectionStart + insertText.length) {
                    caretPush++
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
            errors,
        }
    }

    expandMask(mask) {
        let i = 0
        let accum = ''
        const expandedMask = []
        while (i < mask.length) {
            accum += mask[i]
            if (accum.length === 2) {
                expandedMask.push(staticMaskPart({value: mask[i]}))
            } else if (accum === this.config.escapeCharacter) {
                i++
                continue
            } else if (this.config.symbols.some(s => s.alias === accum)) {
                const appliedSymbol = this.config.symbols.find(s => s.alias === accum)
                switch (appliedSymbol.type) {
                    case 'regex':
                        expandedMask.push(regexMaskPart(appliedSymbol))
                        break;
                    case 'static':
                        expandedMask.push(staticMaskPart(appliedSymbol))
                        break;
                    case 'function':
                        expandedMask.push(appliedSymbol.value)
                }
            } else {
                expandedMask.push(staticMaskPart({value: mask[i]}))
            }
            accum = ''
            i++
        }
        return expandedMask
    }

    checkMaskPart(expandedPart, {newValue, oldValue, selectionStart, insertText, maskedValue, inputIndex, caretPush, mask, maskIndex}) {
        let check = true
        let skip = true
        let error = false
        const symbol = newValue[inputIndex]
        const res = expandedPart({
            newValue,
            oldValue,
            selectionStart,
            insertText,
            maskedValue,
            inputIndex,
            caretPush,
            mask,
            maskIndex
        })
        check = res.check
        skip = res.skip === undefined ? true : res.skip
        error = res.error === undefined ? false : res.error
        return {check, skip, error}
    }
}

export default XMask
