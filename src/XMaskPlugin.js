import defaultConfig from "./resources/defaultConfig";
import XMaskDirective from "./XMaskDirective";
import XMaskService from "@nadilk/x-input-mask/src/core/XMaskService";

function tryGetConfig(config,param){
    if(config && config[param])
        return config[param]
    else
        return defaultConfig[param]
}

function generateConfig(options) {
    return {
        symbols: tryGetConfig(options,'symbols'),
        escapeCharacter: tryGetConfig(options,'escapeCharacter')
    }
}

const XMaskPlugin = {
    install(app, options) {
        app.config.globalProperties.__xmask = new XMaskService(options)
        app.directive('xmask',XMaskDirective)
    }
}

export default XMaskPlugin
