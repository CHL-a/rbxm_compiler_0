const main = require('../src/main');


const file_system = require('node:fs/promises');
const url = 'https://c6.rbxcdn.com/74fc4af513424a072fce9924314a1cf8'

const _ = (async ()=>{
	/*
	const response = await fetch(url)
	const ab = await response.arrayBuffer()
	const u = (new Uint8Array(ab)).buffer
	*/

	const file_buffer = await file_system.readFile('./test/test.rbxm')

	const object = new main.RBXM(file_buffer)
	//console.log(object.instances)
	const children = object.instances
	for (const key in children) {
		if (Object.hasOwnProperty.call(children, key)) {
			const e = children[key];
			
			console.log(key,e)
			console.log(e.properties.Value)
		}
	}
	
	// await object.complete_construction()
})()
 