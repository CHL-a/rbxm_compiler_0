/**
 * Cool Sources:
 * https://www.classy-studios.com/Downloads/RobloxFileSpec.pdf
 * https://github.com/MaximumADHD/Roblox-File-Format
 */

const bitStream = require('@astronautlabs/bitstream')
const Long  = require('long');
const crypto = require('crypto-js')
const complex_data_types = require('./complex_data_types')
const shared = require('./shared')

/**
 * @typedef {import('./complex_data_types').color3} Color3
 * @typedef {import('./complex_data_types').vector2} Vector2
 * @typedef {import('./complex_data_types').vector3} Vector3
 * @typedef {import('./complex_data_types').cframe} CFrame
 * @typedef {import('./complex_data_types').instance} Instance
 */

const assert = shared.assert

class Class_struct {
	/**
	 * 
	 * @param {string} cN 
	 * @param {number[]} refs 
	 * @param {number} a
	 */
	constructor(class_name,referents,amount){
		/** @type {string} */
		this.class_name = class_name
		/** @type {number[]} */
		this.referents = referents
		/** @type {number} */
		this.amount = amount
	}
}

/**
 * From my own work ig?
 */
class lz4_struct{
	/**
	 * @param {Stream} from 
	 * @param {Stream} to 
	 */
	constructor(from,to){
		this.compressed_length = from.get_bytes(-4)
		this.uncompressed_length = from.get_bytes(-4)
		var result = this.result = []

		from.assert_bytes('Bad Buffer Bytes',0,0,0,0)

		while(this.uncompressed_length > result.length){
			// per block
			// parse token byte (4 bits literal length, 4 bits of match length)
			let literalLength = from.readSync(4)
			let matchLength = from.readSync(4)
			
			// end of block exception: literalLength == 0 and matchLength == 0

			if (literalLength == 0xF) {
				/* if true then increment
				// it with the succeeding byte(s), 
				// note how we should keep incrementing
				// literalLength until the byte ~= 0xFF, 
				// therefore exceptions like 
				// the initial literalLength being 15 will have a succeeding byte of 0x00
				*/

				let byte 
				do 
					literalLength += (byte = from.get_bytes())
				while(byte == 0xFF)
			}

			// literal bytes comes first, amount based on literal length
			//var begin = result.length
			
			for (let i = 0; i < literalLength; i++)
				result.push(from.get_bytes())

			// match allowed to be zero because literal length can still be present but it will be the last
			// thus, this conditional can change to (!match_length)


			if (this.uncompressed_length <= result.length) 
				continue;

			// get offset
			let offset = assert(from.get_bytes(-2), 'Bad offset')


			// modify matchLength, process with literalLength
			if (matchLength == 0xF) {
				let last_byte
				do
					matchLength += (last_byte = from.get_bytes())
				while (last_byte == 0xFF)
			}

			// match length increment by 4 bytes (needs developement because idk where this came from)
			matchLength += 4

			// do matchlength
			const end = result.length

			for (let i = 0; i < matchLength; i++)
				result.push(
					result[end-offset+(i % offset)]
				)
		}

		assert(result.length == this.uncompressed_length, `bad length: compressed=${this.compressed_length},uncomp=${this.uncompressed_length},current=${result.length}`)
		to.addBuffer(Buffer.from(result))
	}
}

/**
 * @template A
 */
class RBXM_helper {
	/**
	 * 
	 * @param {Stream} parent 
	 */
	constructor(parent){
		this.parent = parent
	}

	/**
	 * 
	 * @param {number} len 
	 * @param  {...any} other 
	 * @returns {A[]}
	 */
	extract = (len, ...other) => {throw new Error('Needs implementation.')}

	/**
	 * @param {(len:number,...other)=>A[]} cb
	 */
	set_extract = (cb) => {this.extract = cb; return this}
}

class RBXM_helper_collection {
	/**
	 * 
	 * @param {Stream} parent 
	 */
	constructor(parent){
		this.parent = parent

		var collection = this.collection = {}

		// strings
		collection[0x01] = /** @type {RBXM_helper<string>} */
			(new RBXM_helper(parent)).set_extract(len => {
				var result = []

				for (let i = 0; i < len; i++)
					result.push(parent.get_roblox_string())

				return result
			})
		
		// booleans
		collection[0x02] = /** @type {RBXM_helper<boolean>} */
			(new RBXM_helper(parent)).set_extract(len => {
				var result = []

				for (let i = 0; i < len; i++)
					result.push(parent.get_bytes(1) == 0x01)

				return result
			})

		// 32 bit ints
		collection[0x03] = /** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract(len => {
				var result = parent.get_roblox_byte_array(len)

				result.forEach(
					(v,i) => result[i]=Stream.detransform_int(v)
				)

				return result
			})

		// floats
		collection[0x04] = /** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract(len => {
				var result = parent.get_roblox_interleaved_array(4,len)

				assert(parent.is_empty(),'not empty')

				parent.addBuffer(Buffer.from(result))

				while(result.length)result.pop()

				while(!parent.is_empty())
					result.push(parent.get_roblox_float())

				return result
		})

		// double
		collection[0x05] = /** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract(len => {
				var result = [];
				
				for (let i = 0; i < len; i++) {
					parent.readBytesSync(result,0,8)
					result.reverse()
					parent.addBuffer(Buffer.from(result))

					for (let j = 0; j < 8; j++)
						result.shift()
				}

				for (let i = 0; i < len; i++)
					result.push(parent.get_double())


				return result
		})

		// BrickColor
		collection[0x0B] = /** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract(len => {
			var result = parent.get_roblox_interleaved_array(4,len)

			assert(parent.is_empty(),'not empty')

			parent.addBuffer(Buffer.from(result))
	
			while(result.length)result.pop()

			while(!parent.is_empty()){
				parent.get_bytes(2) // atm, always 0x0000

				result.push(parent.get_bytes(2)) // some 16 bit number
			}

			
			return result
		})

		// color3 with floats
		collection[0x0C] = /** @type {RBXM_helper<Color3>} */
			(new RBXM_helper(parent)).set_extract(len => {
			var result = parent.get_roblox_interleaved_array(4,len,3)

			assert(parent.is_empty(),'not empty')

			parent.addBuffer(Buffer.from(result))
	
			while(result.length)result.pop()

			// R
			for (let i = 0; i < len; i++)
				result.push(
					new complex_data_types.color3(
						((parent.get_roblox_float() * 255) >> 0)
					))
			
			// G
			for (let i = 0; i < len; i++)
				result[i].g =
					((parent.get_roblox_float() * 255) >> 0)

			// B
			for (let i = 0; i < len; i++)
				result[i].b =
					((parent.get_roblox_float() * 255) >> 0)
		
			assert(parent.is_empty(),'not empty')

			return result
		})

		// Vector2
		collection[0x0D] = /** @type {RBXM_helper<Vector2>} */
			(new RBXM_helper(parent)).set_extract(len => {
			var result = parent.get_roblox_interleaved_array(4,len*2)

			assert(parent.is_empty(),'not empty')

			console.error('not implemented')

			return result
		})

		// Vector3
		collection[0x0E] = /** @type {RBXM_helper<Vector3>} */
			(new RBXM_helper(parent)).set_extract(len => {
			var result = parent.get_roblox_interleaved_array(4,len,3)

			assert(parent.is_empty(),'not empty')

			parent.addBuffer(Buffer.from(result))
			while(result.length)result.pop()

			// x
			for (let i = 0; i < len; i++)
				result.push(
					new complex_data_types.vector3(
						parent.get_roblox_float()
					)
				)

			// y
			for (let i = 0; i < len; i++)
				result[i].y = parent.get_roblox_float()

			// z
			for (let i = 0; i < len; i++)
				result[i].z = parent.get_roblox_float()

			return result
		})

		// CFrame
		collection[0x10] = /** @type {RBXM_helper<CFrame>} */
			(new RBXM_helper(parent)).set_extract(len => {
			var result = []
			
			// rotation
			for (let i = 0; i < len; i++) {
				const cframe_short_cut = parent.get_bytes(1)
				const object = 
					new complex_data_types.cframe()

				result.push(object)

				object.rotation_type = !cframe_short_cut ? 
					'matrix' : 'common'
				
				if (cframe_short_cut){
					// considered shortcut, see source b
					console.warn('Unimplemented')
					object.cframe_short_cut = cframe_short_cut
				}else
					for (let j = 0; j < 3; j++)
						for (let k = 0; k < 3; k++) 
							object.rotation_matrix[j]
								.push(parent.get_float(true))
			}

			// position
			parent.addBuffer(Buffer.from(parent.get_roblox_interleaved_array()))

			for (let i = 0; i < len; i++)
				result[i].position.x = parent.get_roblox_float()
			
			for (let i = 0; i < len; i++)
				result[i].position.y = parent.get_roblox_float()
			
			for (let i = 0; i < len; i++)
				result[i].position.z = parent.get_roblox_float()

			return result
		})

		// Enums
		collection[0x12] =/** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract(len => 
				parent.get_roblox_byte_array(len)
		)

		// Referents
		collection[0x13] =/** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract((len,instances) => {
				const result = parent.get_roblox_byte_array(len)

				result.forEach((v,i)=>{
					result[i] = Stream.detransform_int(v)

					if (i) result[i] += result[i - 1]
				})

				if (instances)
					result.forEach((v,i)=>
						result[i] = instances[v] || null
					)

				return result
			}
		)

		// Physicalproperties
		collection[0x19] =/** @type {RBXM_helper<number>} */
			(new RBXM_helper(parent)).set_extract(len => {
				const result = []

				for (let i = 0; i < len; i++)
					assert(parent.get_bytes(1) != 0x01,'physical prop present')

				return result
			}
		)

		// Color3 (3 ints)
		collection[0x1A] =/** @type {RBXM_helper<Color3>} */
			(new RBXM_helper(parent)).set_extract(len => {
				const result = []

				// r
				for (let i = 0; i < len; i++)
					result.push(
						new complex_data_types.color3(
							parent.get_bytes()
						)
					)

				// g
				for (let i = 0; i < len; i++)
					result[i].g = parent.get_bytes()

				// b
				for (let i = 0; i < len; i++)
					result[i].b = parent.get_bytes()
	
				assert(parent.is_empty(),'oops')

				return result
			}
		)
		
		// 64 bit int
		collection[0x1B] =/** @type {RBXM_helper<Long>} */
		(new RBXM_helper(parent)).set_extract(len => {
			const result = parent.get_roblox_interleaved_array(8,len)
			parent.addBuffer(Buffer.from(result));

			while(result.length)result.pop()

			console.warn('check multiple long cases')

			for (let i = 0; i < len; i++) {
				let higher_bits = parent.get_bytes(4)
				let long = new Long(parent.get_bytes(4),higher_bits)

				// do int transformation
				const is_negative = long.isOdd()

				if (is_negative)
					long = long.sub(1)

				long = long.shiftRightUnsigned(1)

				if (is_negative)
					long = long.negate()

				result.push(long)
			}

			return result
		})

		// optional cframe
		collection[0x1C] =/** @type {RBXM_helper<CFrame>} */
		(new RBXM_helper(parent)).set_extract(len => {
			const result = parent.get_roblox_byte_array(4,len << 1)

			console.error('to be implemented')

			return result
		})

		// font face
		collection[0x1E] =/** @type {RBXM_helper<CFrame>} */
		(new RBXM_helper(parent)).set_extract(len => {
			const result = parent.get_roblox_byte_array(4,len << 1)

			console.error('to be implemented')

			return result
		})
	}

	/**
	 * 
	 * @param {data_types} n 
	 * @returns {RBXM_helper}
	 */
	get_helper = n => this.collection[n]

	/**
	 * @enum {number}
	 */
	static data_types = {
		string:             0x01,
		boolean:            0x02,
		int32:              0x03,
		float:              0x04,
		brickColor:         0x0B,
		color3_f:           0x0C,
		vector2:            0x0D,
		vector3:            0x0E,
		cframe:             0x10,
		enum:               0x12,
		referents:          0x13,
		physicalProperties: 0x19,
		color3_i:           0x1A,
		int64:              0x1B,
		optionalCframe:     0x1C,
		fontFace:           0x1E,
	}
}

/**
 * Mind that this is using 0-based indexing
 */
class Stream extends bitStream.BitstreamReader{
	/**
	 * @param {Buffer} b 
	 */
	constructor(){
		super()

		this.helper_collection = new RBXM_helper_collection(this)
	}

	// Features possibly from my own bytestream
	/**
	 * @param {number=1} n Negative numbers for little endian, defaults to 1
	 * @returns {number}
	 */
	get_bytes = (n = 1) => {
		assert(n % 1 == 0,`Bytes is a non integer:${n}`)

		var result = 0

		if (n > 0)// big endian
			result = this.readSync(n<<3)
		else  // little endian
			for (let i = 0; i < -n; i++)
				result += (this.get_bytes() << (8 * i))

		return result
	}
	
	/**
	 * 
	 * @param  {...number} bytes 
	 * @returns {[true | number,number?]}
	 */
	check_bytes = (...bytes)=>{
		const result = [true]

		for (let i = 0; i < bytes.length; i++) {
			const byte = this.get_bytes()
	
			if (bytes[i] != byte) {
				result[0] = i
				result[1] = byte
				break
			}
		}
		
		return result;
	}

	/**
	 * @param {string?} message 
	 * @param  {...number} bytes 
	 */
	assert_bytes = (message = 'Byte Check Failed:',...bytes) => {
		const [isSuccess, got_byte] = this.check_bytes(...bytes)

		if (isSuccess !== true) {
			message += `\n${bytes.reduce(
				(last,current)=>`${last}${current.toString(16)} `,''
			)}\n`

			for (let j = 0; j < isSuccess; j++)
				message += bytes[j].toString(16) + ' '
			
			message += '' + got_byte.toString(16)

			throw new Error(message)
		}
	}

	/**
	 * @param {boolean?} isLilEnd 
	 * @returns {number}
	 */
	get_float = isLilEnd => {
		if (!isLilEnd)return this.readFloatSync(32)
		
		const temp_array = []
		this.readBytesSync(temp_array,0,4)
		temp_array.reverse()

		temp_bit_stream.addBuffer(Buffer.from(temp_array))

		return temp_bit_stream.readFloatSync(32)
	}

	/**
	 * Regular double floating point number
	 */
	get_double = ()=>{
		const array = []
		this.readBytesSync(array,0,8)

		temp_bit_stream.addBuffer(Buffer.from(array))

		const sign_bit = temp_bit_stream.readSync(1)
		const exponent_bits = temp_bit_stream.readSync(11)
		const mantissa_bits = temp_bit_stream.readSync(52)

		const divisor = 0x10000000000000

		return (((sign_bit^1)<<1)-1) * // sign
			(2**(exponent_bits - 0x3FF)) * // exponent
			((mantissa_bits/divisor)+1) // mantissa
	}

	// Roblox necessary methods
	get_roblox_string = () => this.readStringSync(this.get_bytes(-4))

	/**
	 * 
	 * @param {number} cols 
	 * @param {number} rows 
	 * @param {number?} reps Offers a 3rd Dimension. By default, this variable is 1.
	 * @returns {number[]}
	 */
	get_roblox_interleaved_array = (cols,rows,reps=1) => {
		const result = []
		const matrix = []

		for (let rep = 0; rep < reps; rep++) {
			for (let col = 0; col < cols; col++)
				for (let row = 0; row < rows; row++) {
					if (!matrix[row])
						matrix.push([])

					matrix[row].push(this.get_bytes())
				}
			
			while (matrix.length)
				result.push(...matrix.shift())
		}

		return result
	}

	/**
	 * @template A
	 * @param { (input:number[]) => A } pred 
	 * @param {number} cols 
	 * @param {number} rows 
	 * @param {number?} reps
	 * @returns {A[]}
	 */
	get_roblox_array_by_predicate = (pred,cols,rows,reps=1) => {
		var result = this.get_roblox_interleaved_array(cols,rows,reps)

		for (let i = 0; i < reps; i++) {
			for (let r = 0; r < rows; r++) {
				var args = []

				for (let c = 0; c < cols; c++)
					args.push(result.shift())

				result.push(pred(args))
			}
		}

		return result
	}

	/**
	 * Returns an array of integers from 4 bytes, of big endian.
	 * The array is of length rows
	 * @param {number} rows 
	 * @param {number?} reps 
	 * @returns {number[]}
	 */
	get_roblox_byte_array = (rows,reps) => {
		return this.get_roblox_array_by_predicate(v=>
			v.reduce(
				(last,current,i)=>last + current << (8 * (3 - i)),
				0
			)
		,4,rows,reps)
	}

	/**
	 * @param {number} n 
	 * @returns {number}
	 */
	static detransform_int = n => ((((n % 2) ^ 1) << 1) - 1) * (++n >> 1)

	/**
	 * @param { Stream } to_stream 
	 * @returns {lz4_struct}
	 */
	decompress_lz4_to = to_stream => new lz4_struct(this,to_stream)

	/**
	 * Returns a number based on the exponent and mantissa, sign bit is always one bit.
	 * @param {number} e Integer, in bits
	 * @param {number} m Integer, in bits
	 */
	get_roblox_rational = (e,m) => {
		return (2 ** (this.readSync(e--) - ((1 << e) - 1))) // ex
			* ((this.readSync(m) / (1 << m)) + 1)           // mant
			* (((this.readSync(1) ^ 1) << 1) - 1)           // sign
	}

	/**
	 * @returns {number}
	 */
	get_roblox_float = () => this.get_roblox_rational(8,23)

	/**
	 * @returns {boolean}
	 */
	is_empty = () => !this.isAvailable(1)

	/**
	 * @private
	 */
	print_content = () => {
		const temp = []

		while (!this.is_empty())
			temp.push(this.get_bytes())

		var message = temp.reduce((last,v,i)=>{
			if (!(i % 8))
				last += '\n\t'
			
			return last + `\t${v.toString(16)},`
		},'[') + '\n]'

		console['log']('content got:', message)

		this.addBuffer(Buffer.from(temp))
	}
}

var temp_bit_stream = new Stream()

class RBXM extends complex_data_types.abstract{
	/**
	 * @param {Buffer} buffer
	 */
	constructor(buffer){
		// pre
		super('rbxm')
		assert(
			shared.is_rbxm(buffer) == 'rbxm',
			'Bad header caught'
		)

		// main
		this.buffer = buffer
		var main_stream = this.main_stream = new Stream()

		var minor_stream = this.minor_stream = new Stream()
		
		/** @type {Instance} */
		this.root = new complex_data_types.instance('ROOT')

		/** @type {Object.<number,Instance>} */
		this.instances = {}

		/** @type {Object.<number, Class_struct>} */
		this.class_structs = {}

		/** @type {Object.<string,number>} */
		this.shared_string_hashes = {}

		/** @type {string[]} */
		this.shared_strings = []

		// Begin compiling file
		main_stream.addBuffer(buffer)

		// check file signature
		assert(
			main_stream.readStringSync(8) == '<roblox!',
			'bad file signature: missed first 8 bytes'
		)

		main_stream.assert_bytes(
			'bad file signature: missed last 8 bytes',
			0x89, 0xFF, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00
		)

		// get length of classes and objects, respectively
		main_stream.get_bytes(-4)
		main_stream.get_bytes(-4)

		// check 16 bytes for zero
		main_stream.assert_bytes(
			'failed 8 0 byte check, check file documentation or '+ 
			'input',
			0,0,0,0,
			0,0,0,0,
		)
		
		// compile records
		while(true){
			const record_type = main_stream.readStringSync(4,{
				nullTerminated: false
			})

			// end record
			if (record_type == 'END\0') {
				main_stream.assert_bytes(
					'file footer corrupted (first 8 bytes): ',
					0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00
				)
				main_stream.assert_bytes(
					'file footer corrupted (second 8 bytes): ',
					0x00, 0x00, 0x00, 0x00, 0x3C, 0x2F, 0x72, 0x6F
				)
				main_stream.assert_bytes(
					'file footer corrupted (last 5 bytes): ',
					0x62, 0x6C, 0x6F, 0x78, 0x3E
				)
				break
			}

			const LZ4_rec = 
			main_stream.decompress_lz4_to(minor_stream)

			switch (record_type) {
				case 'META':
					// Metadata entry
					const entries = minor_stream.get_bytes(-4)

					for (let i = 0; i < entries; i++) {
						let index = minor_stream.get_roblox_string()
						let value = minor_stream.get_roblox_string()
						
						// Mind wacky reserved indexes, ie constructor
						// in compensation, preconcat index with '__'
						this.metadata[index] = value
					}
					break;
				case 'INST':{
					// create a list of instances of same class name
					const class_set_index = minor_stream.get_bytes(-4)
					const class_name = minor_stream.get_roblox_string()
					const data_present = minor_stream.get_bytes()

					assert(!data_present, `Unexpected byte for data presence, expected 0x01, got: ${data_present}, of class_name: ${class_name}`)

					const instance_count = minor_stream.get_bytes(-4)

					/** @type {number[]} */
					const referents = minor_stream
						.helper_collection.get_helper(
							RBXM_helper_collection.data_types
							.referents
						)
						.extract(instance_count)
					
					referents.forEach(e =>
						this.instances[e] = new complex_data_types.instance(class_name)
					);

					this.class_structs[class_set_index] = 
						new Class_struct(class_name,referents,referents.length)
					break;
				}case 'PROP':{
					// get list of properties and apply it over a list of instances
					const class_struct_index = minor_stream.get_bytes(-4)

					/** @type {Class_struct} */
					const class_struct = 
						assert(this.class_structs[class_struct_index],
							`missing class struct: ${class_struct_index}`)

					const referents = class_struct.referents
					const property = minor_stream.get_roblox_string()
					const data_type = minor_stream.get_bytes()
					
					/** @type {RBXM_helper?} */
					const helper = minor_stream.helper_collection
						.get_helper(data_type)

					assert(helper, `missing helper: property=${property}, dt=${data_type.toString()}`)

					const values = helper.extract(
						referents.length,
						(data_type == RBXM_helper_collection.data_types.referents ? this.instances : undefined)
					)

					referents.forEach((v,i)=>{
						const instance = this.instances[v]
						
						instance.properties[property] = values[i]
					})
					break;
				}case 'PRNT':{
					// parent
					minor_stream.assert_bytes('missing PRNT byte 0x00',0)

					const objects_len = minor_stream.get_bytes(-4)

					const referents = minor_stream
						.helper_collection.get_helper(
							RBXM_helper_collection.data_types.referents
						).extract(objects_len)
					const parents = minor_stream
						.helper_collection.get_helper(
							RBXM_helper_collection.data_types.referents
						).extract(objects_len)

					referents.forEach((referent_id,i)=>{
						const parent_id = parents[i]
						const instance = this.instances[referent_id]

						const parent = parent_id == -1 ?
							this.root :
							this.instances[parent_id]

						parent.children.push(instance)
					})
					break;
				}case 'SSTR':
					// shared strings
					minor_stream.assert_bytes('Missing prefix bytes',0,0,0,0)

					const len = minor_stream.get_bytes(-4)

					for (let i = 0; i < len; i++) {
						
						const string_to_hash = minor_stream.readStringSync(16)
						const hash = crypto.enc.Base64.stringify(
							crypto.SHA256(string_to_hash)
						)

						const target_string = minor_stream.get_roblox_string()

						this.shared_string_hashes[hash] = 
							this.shared_strings.length
						
						this.shared_strings.push(target_string)
					}
				default:
					throw new Error(`Unexpected record type: ${record_type}`)
			}
		}
	}
}

module.exports = {
	model_file: RBXM,
	stream: Stream,
	class_struct: Class_struct,
}