const main = require('../src/main');

const file_system = require('node:fs/promises');
//`https://assetdelivery.roblox.com/v2/assetId/`
const url = 'https://c3.rbxcdn.com/0669f7dd502afbf21b696708af334a85'
const _ = (async ()=>{
	/*
	const response = await fetch(url)
	const ab = await response.arrayBuffer()
	const u = (new Uint8Array(ab)).buffer
	const file_buffer = Buffer.from(u)
	//*/

	const file_buffer = await file_system.readFile('./test/test.rbxmx')
	
	const object = new main
		.rbxmx
		.model_file(file_buffer)
	
	console.log(object.instances)
	
})()
 