export default {
    escapeCharacter: '^',
    placeholderCharacter: '_',
    enablePlaceholders: false,
    symbols: [
        {alias: '*', type: 'regex', value: /./},
        {alias: '#', type: 'regex', value: /[0-9]/, error: 'Only numbers allowed!'},
        {alias: 'A', type: 'regex', value: /[a-zA-Z]/, error: 'Only latin letters allowed!'},
        {alias: 'U', type: 'function', value: ({symbol,index,xmask},mode) => {
            if(mode === 'write')
                xmask.setValueAt(symbol.toUpperCase(),index)
            return {accept:1}
        }}
    ]
}
