const xml = require('xml-js')
const complex_data_types = require('./complex_data_types')
const shared = require('./shared')

const assert = shared.assert

class RBXMX extends complex_data_types.abstract {
	/**
	 * @param {Buffer} input 
	 */
	constructor(input){
		// pre
		super('rbxmx')
		const file_type = shared.is_rbxm(input)

		assert(
			file_type == 'rbxmx',
			`expected rbxmx header, got ${file_type}`
		)

		/** @type {import('xml-js').Element} */
		const js_object = xml.xml2js(input.toString('utf-8'))

		assert(js_object.elements,'missing elements')
		assert(js_object.elements.length == 1, 'Elements in js_object is not of length 1.')

		const roblox_tag = this.main_tag = js_object.elements[0]

		assert(roblox_tag.type == 'element', 'roblox tag is a non element')
		assert(roblox_tag.name == 'roblox', 'roblox tag with a name that is not "roblox"')

		/** @type {Object.<string,any>} */
		var attributes = this.attributes = 
			roblox_tag.attributes

		assert(attributes, 'attributes object not present')

		for (const i in RBXMX.attribute_check)
			if (Object.hasOwnProperty.call(object, i)) {
				const attribute_value = attributes[i]
				const static_check_value = 
					RBXMX.attribute_check[i]

				assert(attribute_value == static_check_value,
					`Failed static check of index ${i},
	expected: ${static_check_value}
	got: ${attribute_value}`)
			}

		// main
		console.log(roblox_tag)



	}

	static attribute_check = {
		['xmlns:xmime']: 'http://www.w3.org/2005/05/xmlmime',
		['xmlns:xsi']: 'http://www.w3.org/2001/XMLSchema-instance',
		['xsi:noNamespaceSchemaLocation']:'http://www.roblox.com/roblox.xsd',
	}
}

module.exports = {
	model_file: RBXMX
}