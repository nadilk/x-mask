import XMaskInputWatcher from "./XMaskInputWatcher";
import XMaskModel from "./XMaskModel";
import defaultConfig from "../resources/defaultConfig";

class XMaskService {
    constructor(config) {
        this.config = config || defaultConfig
    }

    //Добавляет функионал библиотеки для любого элемента ввода (textarea, input)
    attachToInput(el, mask, config) {
        const mergeConfig = {...this.config, ...config}
        const model = new XMaskModel(mask, mergeConfig, el.value)
        const watcher = new XMaskInputWatcher(el, (type, data, callback) => {
            if (type === 'insert') {
                // Когда пишем или вставляем символы вручную(клавиатура, мышь)
                // Insert length - сколько символов из вставленных(если их много) прошли валидацию и были записаны,
                // от этого зависит на сколько двигать каретку вправо
                const {insertLength, errors} = model.pushText(data.text, data.position)
                if (callback)
                    callback({insertLength, errors})
            } else if (type === 'delete') {
                //Когда удаляем или стираем символы с клавиатуры и мыши
                model.deleteText(data.position, data.length)
            } else if (type === 'sync') {
                //Когда маска была применена и нужно записать результат в поле ввода
                watcher.syncElement(model.getString())
            }
        })
        el._xmask_.model = model
        el._xmask_.watcher = watcher
    }
}

export default XMaskService
