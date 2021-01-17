/**
 * @typedef {Object} InsertResult
 * @property {number} insertPosition - The index of next insert
 * @property {string[]} errors - The Y Coordinate
 */

import XMaskValidator from "./XMaskValidator";
import defaultConfig from "../resources/defaultConfig";

// Класс который реализует функционал хранения текущего состояния поля ввода и маски,
// но с целью универсальности не имеет привязки к элементам ввода HTML, событиям, все хранится в объектах
// Изменения производимые над оригинальным инпутом точно так же применяются здесь, а полученный результат отправляется обратно
class XMaskModel {
    /**
     * Model representing current state of the masked value and processing text input
     * @param mask {string} Mask string
     * @param config {Object} Configuration object
     * @param initialValue {string|null|undefined} Initial value to insert
     */
    constructor(mask, config, initialValue) {
        this.config = config || defaultConfig
        this.setMask(mask,true)
        initialValue = initialValue || ''
        this.applyMask(initialValue)
    }

    getFilledSymbols(strParams) {
        let {start, end, nullReplace, onlyDynamic} = strParams||{}
        start = start || 0
        end = Number.isInteger(end) ? end : this.mask.validators.length
        nullReplace = nullReplace || ''
        onlyDynamic = onlyDynamic || false
        let str = ''
        end = Math.min(this.mask.validators.length, end || this.mask.validators.length)
        for (let i = start; i < end; i++) {
            if (!onlyDynamic || this.mask.validators[i].type !== 'static')
                str += (this.mask.validators[i].value || nullReplace)
        }
        return str
    }

    get currentValue() {
        return this.getFilledSymbols({nullReplace: this.config.fillMask ? '_' : ''})
    }

    applyMask(inputText) {
        inputText = inputText || this.getFilledSymbols()
        this.insertText({position: 0, cut: -1, text: inputText})
    }

    /**
     * Setting mask string
     * @param mask {string} Mask string
     */
    setMask(mask, doNotApply) {
        this.mask = {
            applied: false,
            stringValue: mask,
            validators: XMaskValidator.getValidatorsFor(mask, this.config),
        }
        if (!doNotApply) {
            this.applyMask()
        }
    }


    /**
     *
     * @param position {number} Position of the insert
     * @param cut {number} Length of cutted substring
     * @param text {string} Text to insert
     * @returns {InsertResult}
     */
    insertText(insertData) {
        let {position, cut, text} = insertData||{}
        this.maskApplied = false
        position = position || 0
        cut = Number.isInteger(cut) ? (cut === -1 ? this.mask.validators.length : cut) : 0

        const textToInsert = text || ''
        const textToAppend = this.getFilledSymbols({start: position + cut, onlyDynamic: true})

        let insertResult = this.insertAndMask(position, text)
        let appendResult = this.insertAndMask(insertResult.caret, textToAppend)
        this.padInput(appendResult.caret)
        this.maskApplied = true
        return {
            value: this.currentValue,
            selectionStart: insertResult.caret,
            selectionEnd: insertResult.caret,
            errors: insertResult.errors
        }
    }


    /**
     * Cutting masked string to 'position', then appending 'text' and applying mask
     * @param position {number} Index of text inserting
     * @param text {string} Text to insert
     * @returns {InsertResult}
     */
    insertAndMask(position, text) {
        let caret = position
        let textPosition = 0
        let errors = []
        while (text && text.length > textPosition && caret < this.mask.validators.length) {
            const currentValidator = this.mask.validators[caret]
            const {accept, error} = currentValidator.write({symbol: text[textPosition], index: caret, xmask: this})
            switch (accept) {
                case -1://Не подошел символ нужно попробовать следующий
                    textPosition++
                    break
                case 1://Подошел, символ забрали
                    textPosition++//Переходим к следующей позиции вставки
                    caret++
                    break
                case 0://Подошел, но нужно передать на следующее место
                    //Тут просто ничего не трогаем, тогда в следующем цикле будет пимеряться следующий символ
                    caret++
                    break
            }
            if (error)
                errors.push(error)
        }


        return {
            caret,
            errors
        }
    }

    padInput(start) {
        for (let i = start; i < this.mask.validators.length; i++) {
            const currentValidator = this.mask.validators[i]
            //If Validator is static and fillMask option is true - show static symbols
            if (this.config.fillMask && currentValidator.type === 'static') {
                currentValidator.write({symbol: '', index: i, xmask: this})
            } else {
                currentValidator.value = null
            }
        }
    }


    setValueAt(value, index) {
        this.mask.validators[index].value = value
    }

}

export default XMaskModel
