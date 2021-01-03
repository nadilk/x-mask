import defaultConfig from "./resources/defaultConfig";
import XMaskDirective from "./XMaskDirective";

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
        app.config.globalProperties.__xmask = {
            config: generateConfig(options)
        }

        app.directive('xmask',XMaskDirective)
    }
}

export default XMaskPlugin
