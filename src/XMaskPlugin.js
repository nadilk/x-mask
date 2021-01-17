import defaultConfig from "./resources/defaultConfig";
import XMaskDirective from "./XMaskDirective";
import XMaskService from "./core/XMaskService";

function tryGetConfig(config, param) {
    if (config && config[param])
        return config[param]
    else
        return defaultConfig[param]
}

function generateConfig(options) {
    return {
        symbols: tryGetConfig(options, 'symbols'),
        escapeCharacter: tryGetConfig(options, 'escapeCharacter')
    }
}

const XMaskPlugin = {
    install(app, options) {
        options = options || {}
        XMaskService.config = options.config || defaultConfig
        app.config.globalProperties.__xmask = XMaskService
        app.directive('xmask', XMaskDirective)
    }
}

export default XMaskPlugin
