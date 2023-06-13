const header = '<roblox'

/**
 * Returns the appropriate type based on the file header
 * @param {Buffer} buffer
 * @returns {false|'rbxm'|'rbxmx'}
 */
const is_rbxm = (buffer)=>{
	for (let i = 0; i < header.length; i++)
		if (buffer.at(i) != header.charCodeAt(i)) 
			return false;
	
	const c = String.fromCharCode(buffer.at(7))

	return c == ' ' ? 'rbxmx' :
		c == '!' ? 'rbxm' :
		false
}

/**
 * @template A
 * @param {A} v 
 * @param {string?} m 
 * @returns {A}
 */
const assert = (v,m='assertion failed')=>{
	if (!v)
		throw new Error(m)
	return v
}

module.exports = {
	is_rbxm: is_rbxm,
	assert: assert
}