/**
 * @typedef {{caret: number, errors: string[]}} XMaskModel~InsertResult
 */

/**
 * @typedef {{cut: ?number, position: ?number, text: ?string}} XMaskModel~InsertData
 */

import XMaskCell from "./XMaskCell";
import defaultConfig from "../resources/defaultConfig";


class XMaskModel {
    /**
     * Model representing current state of the masked value and processing text input
     * @param mask {string} Mask string
     * @param config {Object} Configuration object
     * @param initialValue {string|null|undefined} Initial value to insert
     */
    constructor(mask, config, xmask) {
        this.config = config || defaultConfig
        this.setMask(mask, true)
        this.xmask = xmask
    }

    /**
     * Collect and filter symbols from the XMaskCells range
     * @param {number} [strParams.start=0]
     * @param {number} [strParams.end=this.mask.validators.length]
     * @param {string} [strParams.nullReplace='']
     * @param {boolean} [strParams.onlyDynamic=false]
     * @return {string}
     */
    getFilledSymbols(strParams) {
        let {start, end, nullReplace, onlyDynamic} = strParams || {}
        start = start || 0
        end = Number.isInteger(end) ? end : this.mask.cells.length
        nullReplace = nullReplace || ''
        onlyDynamic = onlyDynamic || false
        let str = ''
        end = Math.min(this.mask.cells.length, end || this.mask.cells.length)
        for (let i = start; i < end; i++) {
            if (!onlyDynamic || this.mask.cells[i].type !== 'static')
                str += (this.mask.cells[i].value || nullReplace)
        }
        return str
    }

    /**
     * Text value of the cells to sync with input
     * @return {string}
     */
    get currentValue() {
        return this.getFilledSymbols({nullReplace: this.config.enablePlaceholders ? '_' : ''})
    }

    /**
     * Apply mask to existing textValue or to new one
     * @param {string} [replaceText=this.getFilledSymbols()]
     */
    applyMask(replaceText) {
        replaceText = replaceText || this.getFilledSymbols()
        this.insertText({position: 0, cut: -1, text: replaceText})
    }

    /**
     * Setting mask string
     * @param {string} mask Mask string
     * @param {boolean=} doNotApply Optionally do not apply mask after changing mask
     */
    setMask(mask, doNotApply) {
        this.mask = {
            applied: false,
            stringValue: mask,
            cells: XMaskCell.getCellsFor(mask, this.config),
        }
        if (!doNotApply) {
            this.applyMask()
        }
    }


    /**
     * Input / delete / cut / replace text
     * @param {XMaskModel.InsertData} insertData
     * @returns {{selectionStart: number, selectionEnd: number, value: string, errors: *}}
     */
    insertText(insertData) {
        let {position, cut, text} = insertData || {}
        position = position || 0
        cut = Number.isInteger(cut) ? (cut === -1 ? this.mask.cells.length : cut) : 0
        text = text || ''

        const textToAppend = this.getFilledSymbols({start: position + cut, onlyDynamic: true})

        let insertResult = this.insertAndMask(position, text)
        let appendResult = this.insertAndMask(insertResult.caret, textToAppend)
        this.padInput(appendResult.caret)

        return {
            value: this.currentValue,
            selectionStart: insertResult.caret,
            selectionEnd: insertResult.caret,
            errors: insertResult.errors
        }
    }


    /**
     * Inserting text in the mask cells starting from position
     * @param position {number} Index of text inserting
     * @param text {string} Text to insert
     * @returns {typeof XMaskModel.InsertResult}
     */
    insertAndMask(position, text) {
        let caret = position
        let textPosition = 0
        let errors = []
        while (text && text.length > textPosition && caret < this.mask.cells.length) {
            const currentCell = this.mask.cells[caret]
            const {accept, error} = currentCell.write({
                symbol: text[textPosition],
                index: caret,
                xmask: this.xmask,
                cell: currentCell
            })
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

    /**
     * Clear or fill with placeholders unfilled mask cells (depending on this.config.enablePlaceholders value)
     * @param {number} start Index to start padding
     */
    padInput(start) {
        for (let i = start; i < this.mask.cells.length; i++) {
            const currentCell = this.mask.cells[i]
            //If Validator is static and enablePlaceholders option is true - show static symbols
            if (this.config.enablePlaceholders && currentCell.type === 'static') {
                currentCell.write({symbol: '', index: i, cell: currentCell, xmask: this.xmask})
            } else {
                currentCell.value = null
            }
        }
    }


    /**
     * Manually set the value of the mask cell without validation
     * @param {string} value
     * @param {number} index
     */
    setValueAt(value, index) {
        this.mask.cells[index].value = value
    }

}

export default XMaskModel
