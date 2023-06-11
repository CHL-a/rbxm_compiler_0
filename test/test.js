
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


	// console.log(Object.getPrototypeOf(file_buffer))

	const object = new main.RBXM(file_buffer)
	console.log(object.root.children[0]
			.properties)
	// await object.complete_construction()
})()
 