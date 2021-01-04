// Класс валидатора символов,
// есть несколько предопределнных типов валидаторов, кторые можно легко создать
class XMaskValidator {
    constructor({type, value, check, write, error}) {
        this.type = type
        this.value = value
        //Аргументы функции {symbol - сам символ,index -желаемая позиция символа,xmask - модель маски}
        //Результат
        // {
        //      accept - подходит ли этот символ на это место,
        //              [-1]Отбросить и предложить следующий
        //                  Например вставляем в наше идеально поле ввода телефона
        //                  неправильно отформатированный номер +7*432*20%02256
        //                  тогда это поможет нам избавиться от мусора, сохранить важные данные из него и поместить в нашу маску
        //              [0]Принять но передать дальше -
        //                  например если в начале телефон статичное '+7(7' а вы начинаете вводить цифру 0,
        //                  тогда валидаторы префикса просто пробросять ноль вперед и получится '+7(70'
        //              [1]Принять и заниматься слеующим символом
        //                  самый частый вариант, все идет по сценарию и человек вводит то, что было нужно, без ошибок
        //      error - текст ошибки, если имеется и есть accept -1
        // }
        this.check = check
        // Аргументы функции:
        // {
        //      symbol - сам символ,
        //      index - желаемая позиция символа,
        //      xmask - модель маски, чтобы валидаторы имели полный контроль над всей работой маски
        // }
        // Результат:
        // {
        //      accept - подходит ли этот символ на это место,
        //      error - текст ошибки, если имеется и есть accept -1
        // }
        this.write = write
        this.error = error
    }

    static regex({value, error}) {
        const regexChain = new XMaskValidator({
            type: 'dynamic',
            value: '',
            error: error,
            check: ({symbol}) => {
                const accept = value.test(symbol) ? 1 : -1
                const errorMessage = accept === -1 ? error : null
                return {accept, error: errorMessage}
            },
            write: ({symbol, index, xmask}) => {
                const accept = value.test(symbol) ? 1 : -1
                const errorMessage = accept === -1 ? error : null
                if (accept === 1)
                    xmask.writeSymbolAt(symbol, index)
                return {accept, error: errorMessage}
            },
            error
        })
        return regexChain
    }

    static static({value, error}) {
        const staticChain = new XMaskValidator({
            type: 'static',
            value: value,
            check: ({symbol}) => {
                return {accept: symbol !== value ? 0 : 1}
                // Если символ совпадает с символом статичного валидатора,
                // то он там и остается, например в начале маски телефона +7, если начать набырать +7 с клавиатуры,
                // то ни один из них не будет пробасываться вперед, потому что сливается со статичной маской
            },
            write: ({symbol, index, xmask}) => {
                xmask.writeSymbolAt(value, index)
                return {accept: symbol !== value ? 0 : 1}
            },
            error
        })
        return staticChain
    }

    static function({value, error}) {
        const handler = value
        const functionChain = new XMaskValidator({
            type: 'dynamic',
            value: '',
            check: ({symbol, index, xmask}) => {
                //Второй аргумент для разделения на check и write
                return handler({symbol, index, xmask}, 'check')
            },
            write: ({symbol, index, xmask}) => {
                //Второй аргумент для разделения на check и write
                return  handler({symbol, index, xmask}, 'write')
            },
            error
        })
        return functionChain
    }
}


export default XMaskValidator
