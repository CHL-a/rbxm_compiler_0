# rbxm_complier_0

As it says, it compiles your files of extension `.rbxm` or `.rbxmx`. Mind that this package is very tiny and subjected to bugs.
# Example
```js
const rbxm_compiler = require('rbxm_compiler_0')

/** @type {Buffer} */
const buffer_input = get_buffer()

const rbxm_object = new rbxm_compiler
    .rbxm
    .model_file(buffer_input)

console.log(rbxm_object) // Stuff, see Classes

```
# Install
Install using Npm:
```powershell
npm i https://github.com/CHL-a/rbxm_compiler_0
```

# Classes
Mainly lists the classes which should be noted due to file syntax.

## complex_data_types.abstract
Represents the model file's abstract class.
### Properties
|Param|Type|Description|
|-|-|-|
|class|`string`|Represents the class of `this`

## rbxm.model_file
Represents all instances of a model file.
### Superclass: [complex_data_types.abstract](#complex_data_types.abstract)
### Constructor
```js
const obj = new rbxm_compiler
    .rbxm
    .model_file(buffer)
```
|Param|Type|Description|
|-|-|-|
|buffer|[`Buffer`](https://nodejs.org/api/buffer.html#class-buffer)|Input buffer for internal stream.
### Properties
|Property|Type|Description
|-|-|-|
|class|`string`|References a class of `this`|
|class_structs|`Object.<number,rbxm.class_struct>`|Holds all class structs.|
|instances|`Object.<number,complex_data_types.instance>`|Holds all instances. Uses referent ids as indexes.|
|metadata|`Object.<string,string>`|Object with strings for keys and strings for values. Due to the nature of JS objects, all indexes might be subjected to include a prefix in the future.|
|root|`complex_data_types.instance`|Holds the hierarchy of the model file.|
|shared_string_hashes|`Object.<string,number>`| Holds all hashes (encoded in Base64) as indexes and an integer for an array. Mind that this property needs testing.|
|shared_strings|`string[]`|Holds shared strings within an array.|
### Methods
None, at the time being.

## complex_data_types.instance
Represents a Roblox instance.
### Constructor
```js
const instance = new rbxm_compiler
	.complex_data_types
	.instance('Cool_Instance')
```
|Param|Type|Description|
|-|-|-|
|cN|`string`|Represents the class of an instance
### Properties
|Property|Type|Description
|-|-|-|
|children|`complex_data_types.instance[]`|Holds all children of the instance.|
|class_name|`string`|Represents class of the instance.|
|properties|`Object.<string,any>`|Holds all properties of the instance

## rbxm.class_struct
Represents a class struct, containing references to instances by id.
### Constructor
```js
const class_struct = new rbxm_compiler
    .rbxm
    .class_struct('class',[1,2,3,4],11)
```
|Param|Type|Description|
|-|-|-|
|class_name|`string`|References a Roblox Class|
|referents|`number[]`|References a collection of referent ids of instances.|
|amount|`number?`|References the amount of referent ids. Due to the fact that `.referents` is an array with an accessible `.length` attribute, it is not used.
### Properties
|Property|Type|Description
|-|-|-|
|class_name|`string`|See Construction
|referents|`number[]`|See Construction

## rbxmx.model_file
Constructed from file content of `.rbmxm`
### Constructor
```js
const obj = new rbxm_compiler
    .rbxmx
    .model_file(buffer)
```

|Param|Type|Description|
|-|-|-|
|buffer|`Buffer`|File content, obviously similar to `rbxm.model_file`
### Properties
|Property|Type|Description
|-|-|-|
|attributes|`Object.<string,any>`|Refers to attribute tag of roblox tag|
|class|`string`|Refers to the class of `this`
|main_tag|`xml-js.Element`|Refers to a lower tag from root, holds all heirachy information.|