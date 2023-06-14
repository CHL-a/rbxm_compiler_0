const xml = require('xml-js')
const complex_data_types = require('./complex_data_types')
const shared = require('./shared')

/**
 * @typedef {import('./complex_data_types').instance} Instance
 */

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

		const root_element = this.root_tag = js_object.elements[0]

		assert(root_element.type == 'element', 'roblox tag is a non element')
		assert(root_element.name == 'roblox', 'roblox tag with a name that is not "roblox"')

		/** @type {Object.<string,any>} */
		const attributes = this.attributes = 
			root_element.attributes

		assert(attributes, 'attributes object not present')

		for (const i in RBXMX.attribute_check)
			if (Object.hasOwnProperty.call(RBXMX.attribute_check, i)) {
				const attribute_value = attributes[i]
				const static_check_value = 
					RBXMX.attribute_check[i]

				assert(attribute_value == static_check_value,
					`Failed static check of index ${i},
	expected: ${static_check_value}
	got: ${attribute_value}`)
			}

		const metadata = this.metadata
		/** @type {import('xml-js').Element[]} */
		const children = this.children = []

		root_element.elements.forEach(element=>{
			// check element
			if (element.name == 'Item')
				children.push(element)
		})

		/** @type {Object.<string,Instance>} */
		const instances = this.instances = {}
		
		const root = this.root = new complex_data_types
			.instance('ROOT')
		
		const stack = [...children]
		const referent_stack = []

		// property and heirachy compile
		while (stack.length) {
			const child_tag = stack.pop()

			/** @type {Instance} */
			const parent = child_tag.parent || root
			delete child_tag.parent
			
			const child = new complex_data_types
				.instance(child_tag.attributes.class)

			instances[child_tag.attributes.referent] = child
			parent.children.push(child)

			const property_tag = child_tag.elements[0]

			property_tag.elements.forEach(v=>{
				const property_name = v
					.attributes.name
				
				var value = v.elements && 
					v.elements[0].text || null
				
				switch (v.name) {
					case 'BinaryString':
					case 'string':break;

					case 'int64':
						//value = Number.parseInt(value)
						//break;
					case 'int':
						value = Number.parseInt(value)
						break;

					case 'double':
						value = Number.parseFloat(value)
						break;


					case 'bool':
						value = value == 'true'
						break;
					
					case 'Ref':
						value = value == 'null' ? 
							null :
							value

						if (value)
							referent_stack.push(
								{
									instance: child,
									property: property_name
								}
							)
						break;

					case 'CoordinateFrame':
						/** @type {import('./complex_data_types').cframe} */
						let cframe = value = new complex_data_types.cframe()
						
						for (let i = 0; i < 3; i++) {
							const component_tag = v.elements[i]
							cframe.position
								[component_tag.name.toLowerCase()]
								= Number.parseFloat(
									component_tag.elements[0].text
							)
						}

						cframe.rotation_type = 'matrix'

						for (let i = 0; i < 9; i++)
							cframe.rotation_matrix[(i/3)>>0]
								[i%3] = Number.parseFloat(
									v.elements[3+i]
									.elements[0].text
								);
					
						break;

					case 'Vector3':
						let vector3 = value = 
							new complex_data_types.vector3()
						
						v.elements.forEach(w=>
							vector3[w.name.toLowerCase()]
								= Number.parseFloat(w.elements[0].text)
						)

						break

					case 'Color3':
						let color3 = value = 
							new complex_data_types.color3()

						v.elements.forEach(w=>
							color3[w.name.toLowerCase()]
								= Number.parseFloat(w.elements[0].text)
						)
						break

					default:
						console.log('no type: ', v.name)
						break;
				}

				child.properties
					[property_name] = value
			})

			for (let i = 1; i < child_tag.elements.length; i++) {
				const e = child_tag.elements[i]
				e.parent = child
				stack.push(e)
			}
		}

		// referent value type compile
		while (referent_stack.length) {
			/** @type {{instance: Instance, property: string}} */
			const set = referent_stack.pop()
			const properties = set.instance.properties
			const property = set.property

			properties[property] = instances[properties[property]]
		}
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