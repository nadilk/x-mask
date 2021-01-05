export default {
    escapeCharacter: '^',
    symbols: [
        {alias: '*', type: 'regex', value: /./},
        {alias: '#', type: 'regex', value: /[0-9]/},
        {alias: 'A', type: 'regex', value: /[a-zA-Z]/},
        {alias: 'U', type: 'function', value: ({symbol,index,xmask},mode) => {
            if(mode === 'write')
                xmask.writeSymbolAt(symbol.toUpperCase(),index)
            return {accept:1}
        }}
    ]
}
