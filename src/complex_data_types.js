class Color3{
	/**
	 * 
	 * @param {number} r 
	 * @param {number} g 
	 * @param {number} b 
	 */
	constructor(r,g,b){
		this.r = r;
		this.g = g;
		this.b = b
	}
}

class Vector2 {
	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 */
	constructor(x,y){
		this.x = x;
		this.y = y;
	}
}

class Vector3 {
	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} z
	 */
	constructor(x,y,z){
		this.x = x;
		this.y = y;
		this.z = z
	}
}

class CFrame {
	constructor(){
		/**
		 * @type {Vector3}
		 */
		this.position = new Vector3()
		/**
		 * @type {'matrix'|'common'}
		 */
		this.rotation_type = 'matrix'

		/**
		 * @type {number[][]?}
		 */
		this.rotation_matrix = [[],[],[]]

		/**
		 * @type {number}
		 */
		this.cframe_short_cut = 0
	}
}

class Instance {
	/**
	 * @param {string} cN 
	 */
	constructor(cN){
		/** @type {{Object.<string,any>}} */
		this.properties = {}
		
		/** @type {Instance[]} */
		this.children = []

		/** @type {string} */
		this.class_name = cN
	}
}

class AbstractModelFile {
	/**
	 * 
	 * @param {string} class_name 
	 */
	constructor(class_name){
		this.class = class_name
	}
}

module.exports = {
	color3: Color3,
	vector2: Vector2,
	vector3: Vector3,
	cframe: CFrame,
	instance: Instance,
	abstract: AbstractModelFile,
}