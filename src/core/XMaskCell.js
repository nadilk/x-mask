/**
 * @enum {number}
 */
const ACCEPT_STATUS = {
    REJECT: -1,
    SHIFT_NEXT: 0,
    ACCEPT: 1
}


/**
 * XMaskCell
 * @class
 * @constructor
 * @public
 */
class XMaskCell {
    /**
     * This structure is passed to cell when checking or writing input
     * @typedef XMaskCell~CellInputData
     * @type {object}
     * @property {string} symbol Char to test
     * @property {XMaskCell} cell Target mask cell
     * @property {number} index Cell index
     * @property {XMaskService} xmask Instance of the inputs XMaskService
     */

    /**
     * This structure is returned from check and write methods
     * @typedef XMaskCell~CellInputResult
     * @type {object}
     * @property {ACCEPT_STATUS|number} accept Accept status
     * @property {(string|null)} error Error text
     */

    /**
     *
     * @param {string} cellData.type
     * @param {string} cellData.value
     * @param {function(XMaskCell.CellInputData) : XMaskCell.CellInputResult} cellData.check
     * @param {function(XMaskCell.CellInputData) : XMaskCell.CellInputResult} cellData.write
     * @param {function(XMaskCell.CellInputData) : string|string} cellData.error
     * @param {XMaskService} cellData.xmask
     * @param {object=} config  Config for storing extra data
     */
    constructor(cellData, config) {
        const {type, value, check, write, error} = cellData
        this.type = type
        this.value = value
        this.check = check
        this.write = write
        this.error = error
        this.config = config || {}
    }

    /**
     * Getting error text
     * @param {XMaskCell.CellInputData} inputData
     * @returns {(string|null)}
     */
    getErrorText(inputData) {
        if (typeof this.error === 'string') {
            return this.error
        } else if (typeof this.error === 'function') {
            return this.error(inputData)
        } else {
            return null
        }
    }

    /**
     * @param {RegExp} value
     * @param {function(XMaskCell.CellInputData) : string|string} error
     * @return {XMaskCell}
     */
    static regex({value, error}) {
        return new XMaskCell({
            type: 'dynamic',
            value: '',
            check: (inputData) => {
                const accept = value.test(inputData.symbol) ? ACCEPT_STATUS.ACCEPT : ACCEPT_STATUS.REJECT
                const errorText = accept === ACCEPT_STATUS.REJECT ? inputData.cell.getErrorText(inputData) : null
                return {accept, error: errorText}
            },
            write: (inputData) => {
                const accept = value.test(inputData.symbol) ? ACCEPT_STATUS.ACCEPT : ACCEPT_STATUS.REJECT
                const errorText = accept === ACCEPT_STATUS.REJECT ? inputData.cell.getErrorText(inputData) : null
                if (accept === ACCEPT_STATUS.ACCEPT)
                    inputData.xmask.model.setValueAt(inputData.symbol, inputData.index)
                return {accept, error: errorText}
            },
            error
        })
    }

    /**
     * @param {string} value
     * @return {XMaskCell}
     */
    static static({value}) {
        return new XMaskCell({
            type: 'static',
            value: value,
            check: ({symbol}) => {
                return {accept: symbol !== value ? 0 : 1}
                // Если символ совпадает с символом статичного валидатора,
                // то он там и остается, например в начале маски телефона +7, если начать набырать +7 с клавиатуры,
                // то ни один из них не будет пробасываться вперед, потому что сливается со статичной маской
            },
            write: ({symbol, index, xmask}) => {
                xmask.model.setValueAt(value, index)
                return {accept: symbol !== value ? 0 : 1}
            },
            error: null
        }, {defaultValue: value})
    }

    /**
     *
     * @param {function(XMaskCell.CellInputData , string):XMaskCell.CellInputResult} value
     * @param {function(XMaskCell.CellInputData): (string|null)|(string|null)} error
     * @param {object=} config
     * @return {XMaskCell}
     */
    static function({value, error, config}) {
        const handler = value
        return new XMaskCell({
            type: 'dynamic',
            value: '',
            check: (inputData) => {
                //Второй аргумент для разделения на check и write
                return handler(inputData, 'check')
            },
            write: (inputData) => {
                //Второй аргумент для разделения на check и write
                return handler(inputData, 'write')
            },
            error
        }, config)
    }

    static getCellsFor(mask, config) {
        let nextEscape = false
        const cells = []

        for (let i = 0; i < mask.length; i++) {
            let nextSymbol = mask[i]
            let cell = null
            if (!nextEscape && nextSymbol === config.escapeCharacter) {
                nextEscape = true
                continue
            }
            if (nextEscape) {
                cell = XMaskCell.static({value: nextSymbol})
                nextEscape = false
            } else {
                const findSymbol = config.symbols.find(s => s.alias === nextSymbol)
                if (findSymbol) {
                    if (findSymbol.type === 'regex') {
                        cell = XMaskCell.regex(findSymbol)
                    } else if (findSymbol.type === 'function') {
                        cell = XMaskCell.function(findSymbol)
                    }
                } else {
                    cell = XMaskCell.static({value: nextSymbol})
                }
            }
            cells.push(cell)
        }

        return cells
    }
}

XMaskCell.ACCEPT_STATUS = ACCEPT_STATUS

export default XMaskCell
