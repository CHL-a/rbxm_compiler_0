# rbxm_complier_0

As it says, it compiles your files of extension `.rbxm`. Mind that this package is very tiny and subjected to bugs.
# Example
```js
const rbxm_compiler = require('rbxm_compiler_0')

/** @type {Buffer} */
const buffer_input = get_buffer()

const rbxm_object = new rbxm_compiler.RBXM(buffer_input)

console.log(rbxm_object) // Stuff, see Classes

```
# Install
Install using Npm:
```powershell
npm i https://github.com/CHL-a/rbxm_compiler_0
```

# Classes
Mainly lists the classes which should be noted due to file syntax.

## RBXM
Represents all instances of a model file.
### Constructor
```js
const obj = new rbxm_compiler.RBXM(buffer)
```
|Param|Type|Description|
|-|-|-|
|buffer|[`Buffer`](https://nodejs.org/api/buffer.html#class-buffer)|Input buffer for internal stream.
### Properties
|Property|Type|Description
|-|-|-|
|class_structs|`Object.<number, RBXM_class_struct>`|Holds all class structs.|
|instances|`Object.<number, RBXM_Instance>`|Holds all instances. Uses referent ids as indexes.|
|metadata|`Object.<string,string>`|Object with strings for keys and strings for values. Due to the nature of JS objects, all indexes might be subjected to include a prefix in the future.|
|root|`RBXM_Instance`|Holds the hierarchy of the model file.|
|shared_string_hashes|`Object.<string,number>`| Holds all hashes (encoded in Base64) as indexes and an integer for an array. Mind that this property needs testing.|
|shared_strings|`string[]`|Holds shared strings within an array.|
### Methods
None, at the time being.

## RBXM_Instance
Represents a Roblox instance.
### Constructor
```js
const instance = new rbxm_compiler.instance('Cool_Instance')
```
|Param|Type|Description|
|-|-|-|
|cN|`string`|Represents the class of an instance
### Properties
|Property|Type|Description
|-|-|-|
|children|`RBXM_Instance[]`|Holds all children of the instance.|
|class_name|`string`|Represents class of the instance.|
|properties|`Object.<string,any>`|Holds all properties of the instance

## RBXM_class_struct
### Constructor
```js
const class_struct = new rbxm_compiler.class_struct('class',[1,2,3,4],11)
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