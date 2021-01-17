Designed for VUE3
# Usage

## Installation:
```
const app = createApp(App)

const config = {
  escapeCharacter: '^',
  placeholderCharacter: '_',
  enablePlaceholder: false,
  symbols: [
      {alias: '*', type: 'regex', value: /./},
      {alias: 'A', type: 'regex', value: /[a-zA-Z]/, error: 'Only latin letters'},
      {alias: 'U', type: 'function', value: ({symbol,index,xmask},mode) => {
          if(mode === 'write')
              xmask.setValueAt(symbol.toUpperCase(),index)
          return {accept:1}
      }}
  ],
}
app.use(XMaskPlugin,config)
```

### Directive

Directive accepts 2 type value:

####String:
```
<wrapped-input v-xmask="'+7-###-###-##-##'" v-model="myVal"  @error="onError"></wrapped-input>
```

####Object

```
<wrapped-input v-xmask="maskData" v-model="myVal"  @error="onError"></wrapped-input>

data(){
    return{
        maskData:{
            mask:'+7-###-###-##-##',
            config:{
                symbols:[ 
                    {alias: '#', type: 'regex', value: /[0-9]/, error: 'Only numbers'},
                ]
            }
        }
    }
}
```

#### Fill arg
```
<input v-xmask:fill="'+7-###-###-##-##'" v-model="myVal"  @error="onError"></input>
Result: +7-___-___-__-__

```

### Mask symbols
There are 3 types of mask symbols:
1)Static - always have 1 value, static symbol is one char long
They are not declared in config
If input char does not 
2)Regex - testing char with regex string, 


```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
