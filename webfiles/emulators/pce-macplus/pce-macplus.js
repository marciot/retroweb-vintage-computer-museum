// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 268435456;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 63400;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });











var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;






















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([0,131,3,0,0,0,0,0,0,130,2,0,0,44,0,0,0,132,4,0,0,4,0,0,0,134,6,0,0,48,0,0,1,132,4,0,0,80,0,0,1,130,2,0,0,46,0,0,1,131,3,0,0,88,0,0,1,134,6,0,0,12,0,0,0,1,2,0,0,24,0,0,0,138,2,0,0,18,0,0,0,129,2,0,0,0,0,0,0,139,2,0,0,20,0,0,0,130,2,0,0,2,0,0,0,2,2,0,0,26,0,0,0,131,2,0,0,4,0,0,0,3,2,0,0,28,0,0,0,132,2,0,0,6,0,0,0,4,2,0,0,30,0,0,0,133,2,0,0,8,0,0,0,5,2,0,0,32,0,0,0,134,2,0,0,10,0,0,0,6,2,0,0,34,0,0,0,135,2,0,0,12,0,0,0,7,2,0,0,36,0,0,0,136,2,0,0,14,0,0,0,8,2,0,0,38,0,0,0,137,2,0,0,16,0,0,1,144,2,0,0,84,0,0,1,135,2,0,0,56,0,0,1,145,2,0,0,86,0,0,1,136,2,0,0,58,0,0,1,146,2,0,0,88,0,0,1,137,2,0,0,60,0,0,1,147,2,0,0,90,0,0,1,138,2,0,0,62,0,0,1,129,2,0,0,22,0,0,1,139,2,0,0,64,0,0,1,130,2,0,0,46,0,0,1,140,2,0,0,66,0,0,1,131,2,0,0,48,0,0,1,141,2,0,0,68,0,0,1,132,2,0,0,50,0,0,1,142,2,0,0,70,0,0,1,133,2,0,0,52,0,0,1,143,2,0,0,72,0,0,1,134,2,0,0,54,0,0,80,0,0,0,0,92,0,0,38,0,0,0,72,0,0,0,8,0,0,0,8,0,0,0,0,168,0,0,184,213,0,0,1,168,0,0,144,213,0,0,2,168,0,0,224,212,0,0,3,168,0,0,112,212,0,0,4,168,0,0,0,212,0,0,5,168,0,0,200,211,0,0,6,168,0,0,112,211,0,0,7,168,0,0,88,211,0,0,8,168,0,0,48,211,0,0,9,168,0,0,24,211,0,0,10,168,0,0,248,210,0,0,11,168,0,0,224,210,0,0,12,168,0,0,96,210,0,0,13,168,0,0,232,209,0,0,14,168,0,0,136,209,0,0,15,168,0,0,112,209,0,0,16,168,0,0,88,209,0,0,17,168,0,0,64,209,0,0,18,168,0,0,32,209,0,0,19,168,0,0,8,209,0,0,20,168,0,0,184,208,0,0,21,168,0,0,160,208,0,0,22,168,0,0,8,208,0,0,23,168,0,0,112,207,0,0,24,168,0,0,208,206,0,0,25,168,0,0,64,206,0,0,26,168,0,0,16,206,0,0,27,168,0,0,248,205,0,0,28,168,0,0,216,205,0,0,29,168,0,0,192,205,0,0,31,168,0,0,104,205,0,0,32,168,0,0,72,205,0,0,33,168,0,0,184,204,0,0,34,168,0,0,0,204,0,0,35,168,0,0,232,203,0,0,38,168,0,0,192,203,0,0,39,168,0,0,152,203,0,0,40,168,0,0,72,203,0,0,41,168,0,0,40,203,0,0,42,168,0,0,216,202,0,0,43,168,0,0,192,202,0,0,44,168,0,0,176,202,0,0,45,168,0,0,112,202,0,0,46,168,0,0,192,201,0,0,47,168,0,0,128,201,0,0,48,168,0,0,88,201,0,0,49,168,0,0,72,201,0,0,51,168,0,0,32,201,0,0,52,168,0,0,240,200,0,0,53,168,0,0,224,200,0,0,54,168,0,0,176,200,0,0,55,168,0,0,160,200,0,0,56,168,0,0,216,199,0,0,57,168,0,0,176,199,0,0,58,168,0,0,152,199,0,0,59,168,0,0,120,199,0,0,60,168,0,0,80,199,0,0,61,168,0,0,64,199,0,0,62,168,0,0,24,199,0,0,63,168,0,0,0,199,0,0,64,168,0,0,184,198,0,0,65,168,0,0,160,198,0,0,66,168,0,0,64,198,0,0,67,168,0,0,232,197,0,0,68,168,0,0,224,197,0,0,69,168,0,0,208,197,0,0,70,168,0,0,192,197,0,0,71,168,0,0,176,197,0,0,72,168,0,0,160,197,0,0,73,168,0,0,144,197,0,0,74,168,0,0,112,197,0,0,75,168,0,0,96,197,0,0,76,168,0,0,248,196,0,0,77,168,0,0,160,196,0,0,78,168,0,0,112,196,0,0,79,168,0,0,0,196,0,0,80,168,0,0,152,195,0,0,81,168,0,0,248,194,0,0,82,168,0,0,152,194,0,0,83,168,0,0,32,194,0,0,84,168,0,0,200,193,0,0,85,168,0,0,168,193,0,0,86,168,0,0,72,193,0,0,88,168,0,0,216,192,0,0,89,168,0,0,192,192,0,0,90,168,0,0,144,192,0,0,91,168,0,0,88,192,0,0,92,168,0,0,64,192,0,0,93,168,0,0,48,192,0,0,94,168,0,0,32,192,0,0,95,168,0,0,0,192,0,0,96,168,0,0,224,191,0,0,97,168,0,0,152,191,0,0,98,168,0,0,32,191,0,0,99,168,0,0,16,191,0,0,100,168,0,0,248,190,0,0,101,168,0,0,224,190,0,0,102,168,0,0,200,190,0,0,103,168,0,0,184,190,0,0,104,168,0,0,136,190,0,0,105,168,0,0,104,190,0,0,106,168,0,0,88,190,0,0,107,168,0,0,16,190,0,0,108,168,0,0,200,189,0,0,109,168,0,0,168,189,0,0,110,168,0,0,136,189,0,0,111,168,0,0,96,189,0,0,112,168,0,0,56,189,0,0,113,168,0,0,24,189,0,0,114,168,0,0,0,189,0,0,115,168,0,0,208,188,0,0,116,168,0,0,192,188,0,0,117,168,0,0,120,188,0,0,118,168,0,0,24,188,0,0,119,168,0,0,0,188,0,0,120,168,0,0,208,187,0,0,121,168,0,0,192,187,0,0,122,168,0,0,176,187,0,0,123,168,0,0,144,187,0,0,124,168,0,0,128,187,0,0,125,168,0,0,96,187,0,0,125,168,0,0,72,187,0,0,126,168,0,0,8,187,0,0,127,168,0,0,200,186,0,0,128,168,0,0,184,186,0,0,129,168,0,0,168,186,0,0,130,168,0,0,160,186,0,0,131,168,0,0,136,186,0,0,132,168,0,0,104,186,0,0,133,168,0,0,80,186,0,0,134,168,0,0,48,186,0,0,135,168,0,0,24,186,0,0,136,168,0,0,216,185,0,0,137,168,0,0,136,185,0,0,138,168,0,0,120,185,0,0,139,168,0,0,88,185,0,0,140,168,0,0,72,185,0,0,141,168,0,0,56,185,0,0,142,168,0,0,40,185,0,0,143,168,0,0,24,185,0,0,144,168,0,0,232,184,0,0,145,168,0,0,224,184,0,0,146,168,0,0,192,184,0,0,147,168,0,0,104,184,0,0,148,168,0,0,96,184,0,0,149,168,0,0,72,184,0,0,150,168,0,0,64,184,0,0,151,168,0,0,56,184,0,0,152,168,0,0,248,183,0,0,153,168,0,0,232,183,0,0,154,168,0,0,208,183,0,0,155,168,0,0,200,183,0,0,156,168,0,0,160,183,0,0,157,168,0,0,88,183,0,0,158,168,0,0,72,183,0,0,159,168,0,0,48,183,0,0,160,168,0,0,40,183,0,0,161,168,0,0,24,183,0,0,162,168,0,0,248,182,0,0,163,168,0,0,232,182,0,0,164,168,0,0,168,182,0,0,165,168,0,0,152,182,0,0,166,168,0,0,112,182,0,0,167,168,0,0,40,182,0,0,168,168,0,0,16,182,0,0,169,168,0,0,248,181,0,0,170,168,0,0,232,181,0,0,171,168,0,0,216,181,0,0,172,168,0,0,200,181,0,0,173,168,0,0,184,181,0,0,174,168,0,0,160,181,0,0,175,168,0,0,144,181,0,0,176,168,0,0,112,181,0,0,177,168,0,0,8,181,0,0,178,168,0,0,216,180,0,0,179,168,0,0,152,180,0,0,180,168,0,0,128,180,0,0,181,168,0,0,0,180,0,0,182,168,0,0,160,179,0,0,183,168,0,0,56,179,0,0,184,168,0,0,248,178,0,0,185,168,0,0,232,178,0,0,186,168,0,0,160,178,0,0,187,168,0,0,88,178,0,0,188,168,0,0,64,178,0,0,189,168,0,0,24,178,0,0,190,168,0,0,0,178,0,0,191,168,0,0,216,177,0,0,192,168,0,0,192,177,0,0,193,168,0,0,176,177,0,0,194,168,0,0,160,177,0,0,195,168,0,0,144,177,0,0,196,168,0,0,112,177,0,0,197,168,0,0,24,177,0,0,198,168,0,0,232,176,0,0,199,168,0,0,200,176,0,0,200,168,0,0,184,176,0,0,201,168,0,0,168,176,0,0,202,168,0,0,144,176,0,0,203,168,0,0,104,176,0,0,204,168,0,0,80,176,0,0,205,168,0,0,64,176,0,0,206,168,0,0,24,176,0,0,207,168,0,0,192,175,0,0,208,168,0,0,168,175,0,0,209,168,0,0,144,175,0,0,210,168,0,0,128,175,0,0,211,168,0,0,112,175,0,0,212,168,0,0,64,175,0,0,213,168,0,0,48,175,0,0,214,168,0,0,16,175,0,0,215,168,0,0,0,175,0,0,216,168,0,0,200,174,0,0,217,168,0,0,80,174,0,0,218,168,0,0,72,174,0,0,219,168,0,0,40,174,0,0,220,168,0,0,24,174,0,0,221,168,0,0,8,174,0,0,222,168,0,0,232,173,0,0,223,168,0,0,224,173,0,0,224,168,0,0,200,173,0,0,225,168,0,0,184,173,0,0,226,168,0,0,80,173,0,0,227,168,0,0,16,173,0,0,228,168,0,0,8,173,0,0,229,168,0,0,232,172,0,0,230,168,0,0,208,172,0,0,231,168,0,0,200,172,0,0,232,168,0,0,168,172,0,0,233,168,0,0,152,172,0,0,234,168,0,0,120,172,0,0,235,168,0,0,112,172,0,0,236,168,0,0,80,172,0,0,237,168,0,0,8,172,0,0,238,168,0,0,248,171,0,0,239,168,0,0,208,171,0,0,240,168,0,0,192,171,0,0,241,168,0,0,176,171,0,0,242,168,0,0,144,171,0,0,243,168,0,0,120,171,0,0,244,168,0,0,96,171,0,0,245,168,0,0,40,171,0,0,246,168,0,0,16,171,0,0,247,168,0,0,224,170,0,0,248,168,0,0,216,170,0,0,249,168,0,0,192,170,0,0,250,168,0,0,184,170,0,0,251,168,0,0,176,170,0,0,252,168,0,0,160,170,0,0,253,168,0,0,152,170,0,0,254,168,0,0,96,170,0,0,255,168,0,0,80,170,0,0,0,169,0,0,64,170,0,0,1,169,0,0,216,169,0,0,2,169,0,0,192,169,0,0,3,169,0,0,160,169,0,0,4,169,0,0,144,169,0,0,5,169,0,0,128,169,0,0,6,169,0,0,104,169,0,0,7,169,0,0,88,169,0,0,8,169,0,0,232,168,0,0,9,169,0,0,224,168,0,0,10,169,0,0,160,168,0,0,11,169,0,0,72,168,0,0,12,169,0,0,56,168,0,0,13,169,0,0,24,168,0,0,14,169,0,0,16,168,0,0,15,169,0,0,8,168,0,0,16,169,0,0,240,167,0,0,17,169,0,0,224,167,0,0,18,169,0,0,200,167,0,0,19,169,0,0,184,167,0,0,20,169,0,0,152,167,0,0,21,169,0,0,96,167,0,0,22,169,0,0,248,166,0,0,23,169,0,0,200,166,0,0,24,169,0,0,168,166,0,0,25,169,0,0,152,166,0,0,26,169,0,0,32,166,0,0,27,169,0,0,192,165,0,0,28,169,0,0,96,165,0,0,29,169,0,0,72,165,0,0,30,169,0,0,24,165,0,0,31,169,0,0,208,164,0,0,32,169,0,0,184,164,0,0,33,169,0,0,144,164,0,0,34,169,0,0,112,164,0,0,35,169,0,0,80,164,0,0,36,169,0,0,40,164,0,0,37,169,0,0,24,164,0,0,38,169,0,0,0,164,0,0,39,169,0,0,240,163,0,0,40,169,0,0,200,163,0,0,41,169,0,0,168,163,0,0,42,169,0,0,80,163,0,0,43,169,0,0,48,163,0,0,44,169,0,0,32,163,0,0,45,169,0,0,16,163,0,0,46,169,0,0,232,162,0,0,47,169,0,0,192,162,0,0,48,169,0,0,168,162,0,0,49,169,0,0,160,162,0,0,50,169,0,0,80,162,0,0,51,169,0,0,24,162,0,0,52,169,0,0,232,161,0,0,53,169,0,0,200,161,0,0,54,169,0,0,184,161,0,0,55,169,0,0,168,161,0,0,56,169,0,0,144,161,0,0,57,169,0,0,104,161,0,0,58,169,0,0,72,161,0,0,59,169,0,0,56,161,0,0,60,169,0,0,0,161,0,0,61,169,0,0,216,160,0,0,62,169,0,0,208,160,0,0,63,169,0,0,176,160,0,0,64,169,0,0,160,160,0,0,65,169,0,0,136,160,0,0,66,169,0,0,112,160,0,0,67,169,0,0,96,160,0,0,68,169,0,0,72,160,0,0,69,169,0,0,56,160,0,0,70,169,0,0,32,160,0,0,71,169,0,0,240,159,0,0,72,169,0,0,224,159,0,0,73,169,0,0,192,159,0,0,74,169,0,0,176,159,0,0,75,169,0,0,160,159,0,0,76,169,0,0,136,159,0,0,77,169,0,0,120,159,0,0,78,169,0,0,96,159,0,0,79,169,0,0,80,159,0,0,80,169,0,0,48,159,0,0,81,169,0,0,16,159,0,0,82,169,0,0,0,159,0,0,83,169,0,0,216,158,0,0,84,169,0,0,200,158,0,0,85,169,0,0,184,158,0,0,86,169,0,0,160,158,0,0,87,169,0,0,144,158,0,0,88,169,0,0,120,158,0,0,89,169,0,0,104,158,0,0,90,169,0,0,24,158,0,0,91,169,0,0,8,158,0,0,92,169,0,0,248,157,0,0,93,169,0,0,216,157,0,0,94,169,0,0,200,157,0,0,95,169,0,0,184,157,0,0,96,169,0,0,160,157,0,0,97,169,0,0,144,157,0,0,98,169,0,0,112,157,0,0,99,169,0,0,96,157,0,0,100,169,0,0,72,157,0,0,101,169,0,0,24,157,0,0,102,169,0,0,8,157,0,0,103,169,0,0,224,156,0,0,104,169,0,0,208,156,0,0,105,169,0,0,192,156,0,0,106,169,0,0,168,156,0,0,107,169,0,0,152,156,0,0,108,169,0,0,112,156,0,0,109,169,0,0,96,156,0,0,110,169,0,0,72,156,0,0,111,169,0,0,40,156,0,0,112,169,0,0,24,156,0,0,113,169,0,0,248,155,0,0,114,169,0,0,232,155,0,0,115,169,0,0,216,155,0,0,116,169,0,0,200,155,0,0,117,169,0,0,184,155,0,0,118,169,0,0,128,155,0,0,119,169,0,0,112,155,0,0,120,169,0,0,88,155,0,0,121,169,0,0,24,155,0,0,122,169,0,0,224,154,0,0,123,169,0,0,168,154,0,0,124,169,0,0,144,154,0,0,125,169,0,0,112,154,0,0,126,169,0,0,40,154,0,0,127,169,0,0,200,153,0,0,128,169,0,0,104,153,0,0,129,169,0,0,80,153,0,0,130,169,0,0,40,153,0,0,131,169,0,0,248,152,0,0,132,169,0,0,224,152,0,0,133,169,0,0,192,152,0,0,134,169,0,0,168,152,0,0,135,169,0,0,136,152,0,0,136,169,0,0,112,152,0,0,137,169,0,0,96,152,0,0,138,169,0,0,64,152,0,0,139,169,0,0,48,152,0,0,140,169,0,0,16,152,0,0,141,169,0,0,184,151,0,0,142,169,0,0,136,151,0,0,143,169,0,0,112,151,0,0,144,169,0,0,96,151,0,0,145,169,0,0,80,151,0,0,146,169,0,0,56,151,0,0,147,169,0,0,16,151,0,0,148,169,0,0,248,150,0,0,149,169,0,0,232,150,0,0,150,169,0,0,160,150,0,0,151,169,0,0,120,150,0,0,152,169,0,0,96,150,0,0,153,169,0,0,64,150,0,0,154,169,0,0,48,150,0,0,155,169,0,0,32,150,0,0,156,169,0,0,8,150,0,0,157,169,0,0,248,149,0,0,158,169,0,0,208,149,0,0,159,169,0,0,192,149,0,0,160,169,0,0,168,149,0,0,161,169,0,0,80,149,0,0,162,169,0,0,64,149,0,0,163,169,0,0,32,149,0,0,164,169,0,0,16,149,0,0,165,169,0,0,0,149,0,0,166,169,0,0,208,148,0,0,167,169,0,0,192,148,0,0,168,169,0,0,152,148,0,0,169,169,0,0,136,148,0,0,170,169,0,0,112,148,0,0,171,169,0,0,80,148,0,0,172,169,0,0,64,148,0,0,173,169,0,0,32,148,0,0,174,169,0,0,16,148,0,0,175,169,0,0,0,148,0,0,176,169,0,0,232,147,0,0,177,169,0,0,216,147,0,0,178,169,0,0,192,147,0,0,179,169,0,0,176,147,0,0,180,169,0,0,144,147,0,0,181,169,0,0,96,147,0,0,182,169,0,0,80,147,0,0,183,169,0,0,40,147,0,0,184,169,0,0,24,147,0,0,185,169,0,0,8,147,0,0,186,169,0,0,240,146,0,0,187,169,0,0,232,146,0,0,188,169,0,0,200,146,0,0,189,169,0,0,184,146,0,0,190,169,0,0,152,146,0,0,191,169,0,0,40,146,0,0,192,169,0,0,24,146,0,0,193,169,0,0,0,146,0,0,194,169,0,0,248,145,0,0,195,169,0,0,232,145,0,0,196,169,0,0,208,145,0,0,197,169,0,0,192,145,0,0,198,169,0,0,168,145,0,0,199,169,0,0,152,145,0,0,200,169,0,0,136,145,0,0,201,169,0,0,104,145,0,0,202,169,0,0,96,145,0,0,203,169,0,0,64,145,0,0,204,169,0,0,48,145,0,0,205,169,0,0,32,145,0,0,206,169,0,0,16,145,0,0,207,169,0,0,0,145,0,0,208,169,0,0,200,144,0,0,209,169,0,0,184,144,0,0,210,169,0,0,160,144,0,0,211,169,0,0,112,144,0,0,212,169,0,0,104,144,0,0,213,169,0,0,80,144,0,0,214,169,0,0,72,144,0,0,215,169,0,0,56,144,0,0,216,169,0,0,32,144,0,0,217,169,0,0,16,144,0,0,218,169,0,0,248,143,0,0,219,169,0,0,240,143,0,0,220,169,0,0,208,143,0,0,221,169,0,0,128,143,0,0,222,169,0,0,104,143,0,0,223,169,0,0,64,143,0,0,224,169,0,0,24,143,0,0,225,169,0,0,232,142,0,0,226,169,0,0,168,142,0,0,227,169,0,0,96,142,0,0,228,169,0,0,216,141,0,0,229,169,0,0,192,141,0,0,230,169,0,0,160,141,0,0,231,169,0,0,120,141,0,0,232,169,0,0,104,141,0,0,233,169,0,0,80,141,0,0,234,169,0,0,56,141,0,0,235,169,0,0,32,141,0,0,235,169,0,0,16,141,0,0,236,169,0,0,0,141,0,0,236,169,0,0,192,140,0,0,237,169,0,0,184,140,0,0,238,169,0,0,144,140,0,0,239,169,0,0,104,140,0,0,240,169,0,0,56,140,0,0,241,169,0,0,24,140,0,0,242,169,0,0,16,140,0,0,243,169,0,0,8,140,0,0,244,169,0,0,248,139,0,0,245,169,0,0,184,139,0,0,246,169,0,0,120,139,0,0,247,169,0,0,104,139,0,0,248,169,0,0,80,139,0,0,249,169,0,0,24,139,0,0,250,169,0,0,8,139,0,0,251,169,0,0,224,138,0,0,252,169,0,0,208,138,0,0,253,169,0,0,192,138,0,0,254,169,0,0,176,138,0,0,255,169,0,0,152,138,0,0,0,170,0,0,96,138,0,0,1,170,0,0,80,138,0,0,3,170,0,0,56,138,0,0,4,170,0,0,8,138,0,0,5,170,0,0,248,137,0,0,6,170,0,0,216,137,0,0,7,170,0,0,200,137,0,0,8,170,0,0,184,137,0,0,9,170,0,0,168,137,0,0,10,170,0,0,120,137,0,0,11,170,0,0,56,137,0,0,12,170,0,0,40,137,0,0,13,170,0,0,16,137,0,0,14,170,0,0,216,136,0,0,15,170,0,0,200,136,0,0,16,170,0,0,184,136,0,0,17,170,0,0,152,136,0,0,18,170,0,0,136,136,0,0,19,170,0,0,120,136,0,0,20,170,0,0,96,136,0,0,21,170,0,0,64,136,0,0,22,170,0,0,48,136,0,0,23,170,0,0,24,136,0,0,24,170,0,0,232,135,0,0,25,170,0,0,216,135,0,0,26,170,0,0,192,135,0,0,27,170,0,0,168,135,0,0,28,170,0,0,152,135,0,0,29,170,0,0,136,135,0,0,30,170,0,0,112,135,0,0,31,170,0,0,80,135,0,0,33,170,0,0,72,135,0,0,34,170,0,0,40,135,0,0,35,170,0,0,248,134,0,0,36,170,0,0,232,134,0,0,37,170,0,0,216,134,0,0,38,170,0,0,184,134,0,0,39,170,0,0,168,134,0,0,40,170,0,0,152,134,0,0,41,170,0,0,128,134,0,0,42,170,0,0,56,134,0,0,43,170,0,0,40,134,0,0,44,170,0,0,232,133,0,0,45,170,0,0,176,133,0,0,46,170,0,0,160,133,0,0,47,170,0,0,144,133,0,0,48,170,0,0,112,133,0,0,49,170,0,0,80,133,0,0,50,170,0,0,64,133,0,0,51,170,0,0,40,133,0,0,52,170,0,0,248,132,0,0,53,170,0,0,232,132,0,0,54,170,0,0,208,132,0,0,55,170,0,0,160,132,0,0,56,170,0,0,144,132,0,0,57,170,0,0,128,132,0,0,58,170,0,0,96,132,0,0,59,170,0,0,88,132,0,0,60,170,0,0,72,132,0,0,61,170,0,0,48,132,0,0,62,170,0,0,24,132,0,0,63,170,0,0,8,132,0,0,64,170,0,0,240,131,0,0,65,170,0,0,200,131,0,0,66,170,0,0,176,131,0,0,67,170,0,0,160,131,0,0,68,170,0,0,88,131,0,0,69,170,0,0,72,131,0,0,70,170,0,0,16,131,0,0,71,170,0,0,208,130,0,0,72,170,0,0,120,130,0,0,73,170,0,0,96,130,0,0,74,170,0,0,64,130,0,0,75,170,0,0,248,129,0,0,76,170,0,0,224,129,0,0,77,170,0,0,200,129,0,0,78,170,0,0,152,129,0,0,79,170,0,0,120,129,0,0,80,170,0,0,104,129,0,0,81,170,0,0,80,129,0,0,82,170,0,0,232,128,0,0,96,170,0,0,216,128,0,0,97,170,0,0,192,128,0,0,98,170,0,0,160,128,0,0,99,170,0,0,120,128,0,0,100,170,0,0,104,128,0,0,101,170,0,0,72,128,0,0,102,170,0,0,56,128,0,0,103,170,0,0,32,128,0,0,104,170,0,0,224,127,0,0,0,0,0,0,0,0,0,0,0,160,0,0,96,163,0,0,1,160,0,0,48,212,0,0,2,160,0,0,192,189,0,0,3,160,0,0,184,175,0,0,4,160,0,0,248,161,0,0,5,160,0,0,112,150,0,0,6,160,0,0,0,139,0,0,7,160,0,0,104,127,0,0,8,160,0,0,112,122,0,0,9,160,0,0,216,118,0,0,10,160,0,0,40,225,0,0,11,160,0,0,184,221,0,0,12,160,0,0,96,217,0,0,13,160,0,0,208,214,0,0,14,160,0,0,224,211,0,0,15,160,0,0,152,209,0,0,16,160,0,0,136,206,0,0,17,160,0,0,216,203,0,0,18,160,0,0,136,201,0,0,19,160,0,0,136,199,0,0,20,160,0,0,216,197,0,0,21,160,0,0,72,196,0,0,22,160,0,0,160,192,0,0,23,160,0,0,8,191,0,0,24,160,0,0,160,189,0,0,25,160,0,0,240,187,0,0,26,160,0,0,176,186,0,0,27,160,0,0,104,185,0,0,28,160,0,0,88,184,0,0,29,160,0,0,64,183,0,0,30,160,0,0,8,182,0,0,31,160,0,0,176,180,0,0,32,160,0,0,32,178,0,0,33,160,0,0,216,176,0,0,34,160,0,0,152,175,0,0,35,160,0,0,56,174,0,0,36,160,0,0,248,172,0,0,37,160,0,0,224,171,0,0,38,160,0,0,200,170,0,0,39,160,0,0,176,169,0,0,40,160,0,0,40,168,0,0,41,160,0,0,216,166,0,0,42,160,0,0,160,164,0,0,43,160,0,0,64,163,0,0,44,160,0,0,216,161,0,0,45,160,0,0,192,160,0,0,46,160,0,0,208,159,0,0,47,160,0,0,232,158,0,0,48,160,0,0,232,157,0,0,49,160,0,0,248,156,0,0,50,160,0,0,8,156,0,0,51,160,0,0,184,154,0,0,52,160,0,0,200,152,0,0,53,160,0,0,128,151,0,0,54,160,0,0,80,150,0,0,56,160,0,0,48,149,0,0,57,160,0,0,48,148,0,0,58,160,0,0,56,147,0,0,59,160,0,0,16,146,0,0,60,160,0,0,80,145,0,0,61,160,0,0,88,144,0,0,62,160,0,0,80,143,0,0,63,160,0,0,88,141,0,0,64,160,0,0,40,140,0,0,65,160,0,0,240,138,0,0,66,160,0,0,232,137,0,0,67,160,0,0,168,136,0,0,68,160,0,0,184,135,0,0,69,160,0,0,200,134,0,0,70,160,0,0,128,133,0,0,71,160,0,0,112,132,0,0,72,160,0,0,152,131,0,0,73,160,0,0,192,129,0,0,74,160,0,0,88,128,0,0,75,160,0,0,88,127,0,0,76,160,0,0,224,126,0,0,77,160,0,0,40,126,0,0,78,160,0,0,168,125,0,0,79,160,0,0,56,125,0,0,80,160,0,0,0,125,0,0,81,160,0,0,144,124,0,0,82,160,0,0,88,124,0,0,84,160,0,0,104,123,0,0,85,160,0,0,224,122,0,0,86,160,0,0,96,122,0,0,87,160,0,0,24,122,0,0,88,160,0,0,224,121,0,0,89,160,0,0,176,121,0,0,90,160,0,0,136,121,0,0,91,160,0,0,88,121,0,0,92,160,0,0,248,120,0,0,93,160,0,0,144,120,0,0,94,160,0,0,136,119,0,0,95,160,0,0,32,119,0,0,96,160,0,0,200,118,0,0,97,160,0,0,160,118,0,0,98,160,0,0,112,118,0,0,99,160,0,0,40,118,0,0,100,160,0,0,232,117,0,0,101,160,0,0,152,117,0,0,102,160,0,0,248,226,0,0,103,160,0,0,176,226,0,0,104,160,0,0,208,225,0,0,105,160,0,0,120,225,0,0,106,160,0,0,24,225,0,0,108,160,0,0,240,224,0,0,109,160,0,0,192,224,0,0,110,160,0,0,128,224,0,0,111,160,0,0,88,224,0,0,112,160,0,0,40,224,0,0,113,160,0,0,232,223,0,0,114,160,0,0,208,223,0,0,117,160,0,0,216,222,0,0,118,160,0,0,104,222,0,0,119,160,0,0,224,221,0,0,120,160,0,0,88,221,0,0,121,160,0,0,16,221,0,0,122,160,0,0,112,220,0,0,123,160,0,0,200,219,0,0,124,160,0,0,160,219,0,0,125,160,0,0,80,219,0,0,126,160,0,0,40,219,0,0,127,160,0,0,80,218,0,0,128,160,0,0,208,217,0,0,129,160,0,0,120,217,0,0,130,160,0,0,64,217,0,0,131,160,0,0,208,216,0,0,132,160,0,0,176,216,0,0,133,160,0,0,152,216,0,0,134,160,0,0,120,216,0,0,135,160,0,0,80,216,0,0,136,160,0,0,40,216,0,0,138,160,0,0,208,215,0,0,139,160,0,0,48,215,0,0,141,160,0,0,232,214,0,0,143,160,0,0,184,214,0,0,144,160,0,0,152,214,0,0,145,160,0,0,112,214,0,0,146,160,0,0,56,214,0,0,152,160,0,0,248,213,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,232,216,0,0,44,0,0,0,104,192,0,0,18,0,0,0,232,177,0,0,82,0,0,0,96,164,0,0,96,0,0,0,152,152,0,0,12,0,0,0,40,141,0,0,90,0,0,0,136,129,0,0,100,0,0,0,64,123,0,0,98,0,0,0,120,119,0,0,6,0,0,0,192,225,0,0,30,0,0,0,128,222,0,0,66,0,0,0,248,217,0,0,34,0,0,0,104,215,0,0,2,0,0,0,136,212,0,0,54,0,0,0,0,210,0,0,102,0,0,0,136,207,0,0,70,0,0,0,32,204,0,0,16,0,0,0,208,201,0,0,84,0,0,0,192,199,0,0,28,0,0,0,240,197,0,0,68,0,0,0,184,196,0,0,10,0,0,0,240,192,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,43,48,42,47,4,53,41,46,12,58,3,52,25,9,40,45,55,14,11,57,32,30,2,51,28,17,24,8,21,63,39,44,49,5,54,13,59,26,10,56,15,33,31,29,18,22,1,50,6,60,27,16,34,19,23,7,61,35,20,62,36,37,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,124,0,0,128,120,0,0,160,226,0,0,152,223,0,0,200,218,0,0,0,0,0,0,83,79,70,84,87,65,82,69,32,80,73,82,65,84,69,83,80,155,0,0,32,153,0,0,240,151,0,0,152,150,0,0,144,245,0,0,144,149,0,0,104,148,0,0,120,147,0,0,104,146,0,0,128,145,0,0,136,144,0,0,160,143,0,0,208,141,0,0,144,141,0,0,128,140,0,0,112,130,0,0,56,139,0,0,32,138,0,0,160,123,0,0,248,136,0,0,0,136,0,0,200,119,0,0,144,245,0,0,24,135,0,0,88,165,0,0,208,133,0,0,184,132,0,0,32,226,0,0,224,131,0,0,24,130,0,0,208,222,0,0,144,245,0,0,184,128,0,0,96,153,0,0,128,127,0,0,248,126,0,0,72,218,0,0,64,126,0,0,200,125,0,0,200,215,0,0,80,125,0,0,24,125,0,0,136,156,0,0,200,208,0,0,64,186,0,0,112,171,0,0,128,157,0,0,136,155,0,0,240,144,0,0,16,133,0,0,176,124,0,0,48,121,0,0,208,245,0,0,24,224,0,0,16,219,0,0,96,216,0,0,200,213,0,0,8,211,0,0,200,208,0,0,96,208,0,0,120,205,0,0,208,245,0,0,120,205,0,0,200,202,0,0,208,245,0,0,192,200,0,0,200,198,0,0,120,197,0,0,216,193,0,0,8,192,0,0,120,190,0,0,216,188,0,0,112,187,0,0,200,208,0,0,240,185,0,0,16,185,0,0,216,183,0,0,184,182,0,0,0,1,59,2,60,40,54,3,61,32,49,41,55,19,35,4,62,52,30,33,50,12,14,42,56,16,27,20,36,23,44,5,63,58,39,53,31,48,18,34,51,29,11,13,15,26,22,43,57,38,47,17,28,10,25,21,37,46,9,24,45,8,7,6,63,0,0,0,240,196,0,0,0,0,0,0,48,193,0,0,98,0,1,0,136,191,0,0,8,190,0,0,80,188,0,0,66,0,2,0,248,186,0,0,200,185,0,0,168,184,0,0,99,0,1,0,152,183,0,0,104,182,0,0,80,181,0,0,100,0,1,0,152,178,0,0,104,182,0,0,72,177,0,0,105,0,1,0,8,176,0,0,104,182,0,0,152,174,0,0,73,0,1,0,64,173,0,0,104,182,0,0,40,172,0,0,108,0,1,0,8,171,0,0,104,182,0,0,32,170,0,0,112,0,1,0,184,219,0,0,104,182,0,0,136,168,0,0,113,0,0,0,144,167,0,0,0,0,0,0,248,164,0,0,114,0,0,0,192,163,0,0,0,0,0,0,48,162,0,0,82,0,0,0,240,160,0,0,0,0,0,0,8,160,0,0,115,0,1,0,40,159,0,0,56,158,0,0,48,157,0,0,116,0,1,0,56,156,0,0,104,182,0,0,40,155,0,0,118,0,0,0,16,153,0,0,0,0,0,0,200,151,0,0,86,0,0,0,136,150,0,0,0,0,0,0,104,149,0,0,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,205,0,0,96,205,0,0,248,204,0,0,24,204,0,0,248,203,0,0,208,203,0,0,168,203,0,0,88,203,0,0,56,203,0,0,24,203,0,0,208,202,0,0,184,202,0,0,128,202,0,0,200,201,0,0,184,201,0,0,120,201,0,0,72,214,0,0,0,214,0,0,224,213,0,0,168,213,0,0,96,213,0,0,128,212,0,0,40,212,0,0,216,211,0,0,176,211,0,0,104,211,0,0,64,211,0,0,40,211,0,0,16,211,0,0,240,210,0,0,168,210,0,0,248,209,0,0,200,209,0,0,128,209,0,0,104,209,0,0,80,209,0,0,48,209,0,0,24,209,0,0,208,208,0,0,176,208,0,0,56,208,0,0,128,207,0,0,56,207,0,0,72,206,0,0,32,206,0,0,8,206,0,0,232,205,0,0,208,205,0,0,168,219,0,0,112,219,0,0,64,219,0,0,168,218,0,0,240,217,0,0,168,217,0,0,80,217,0,0,224,216,0,0,192,216,0,0,160,216,0,0,136,216,0,0,104,216,0,0,56,216,0,0,248,215,0,0,72,215,0,0,16,215,0,0,31,0,0,0,28,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,29,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,248,191,0,0,2,0,0,0,200,217,0,0,3,0,0,0,208,192,0,0,4,0,0,0,80,178,0,0,5,0,0,0,200,164,0,0,6,0,0,0,240,152,0,0,7,0,0,0,112,141,0,0,8,0,0,0,240,129,0,0,9,0,0,0,128,123,0,0,10,0,0,0,168,119,0,0,11,0,0,0,248,225,0,0,12,0,0,0,176,222,0,0,13,0,0,0,40,218,0,0,14,0,0,0,160,215,0,0,14,0,0,0,192,212,0,0,15,0,0,0,48,210,0,0,15,0,0,0,184,207,0,0,16,0,0,0,64,204,0,0,17,0,0,0,240,201,0,0,17,0,0,0,0,200,0,0,18,0,0,0,16,198,0,0,19,0,0,0,224,196,0,0,20,0,0,0,32,193,0,0,21,0,0,0,120,191,0,0,22,0,0,0,0,190,0,0,23,0,0,0,64,188,0,0,24,0,0,0,232,186,0,0,25,0,0,0,184,185,0,0,26,0,0,0,152,184,0,0,27,0,0,0,136,183,0,0,28,0,0,0,88,182,0,0,28,0,0,0,64,181,0,0,29,0,0,0,144,178,0,0,29,0,0,0,64,177,0,0,30,0,0,0,248,175,0,0,31,0,0,0,144,174,0,0,32,0,0,0,56,173,0,0,33,0,0,0,32,172,0,0,34,0,0,0,0,171,0,0,35,0,0,0,24,170,0,0,36,0,0,0,128,168,0,0,37,0,0,0,136,167,0,0,38,0,0,0,240,164,0,0,39,0,0,0,184,163,0,0,40,0,0,0,40,162,0,0,41,0,0,0,232,160,0,0,42,0,0,0,248,159,0,0,42,0,0,0,32,159,0,0,43,0,0,0,40,158,0,0,43,0,0,0,40,157,0,0,44,0,0,0,48,156,0,0,45,0,0,0,64,155,0,0,46,0,0,0,24,153,0,0,47,0,0,0,232,151,0,0,48,0,0,0,144,150,0,0,49,0,0,0,136,149,0,0,50,0,0,0,96,148,0,0,51,0,0,0,112,147,0,0,52,0,0,0,96,146,0,0,53,0,0,0,120,145,0,0,54,0,0,0,128,144,0,0,55,0,0,0,144,143,0,0,55,0,0,0,136,141,0,0,56,0,0,0,120,140,0,0,56,0,0,0,40,139,0,0,56,0,0,0,24,138,0,0,57,0,0,0,232,136,0,0,57,0,0,0,248,135,0,0,58,0,0,0,8,135,0,0,58,0,0,0,200,133,0,0,59,0,0,0,176,132,0,0,59,0,0,0,216,131,0,0,60,0,0,0,16,130,0,0,61,0,0,0,176,128,0,0,62,0,0,0,120,127,0,0,63,0,0,0,240,126,0,0,64,0,0,0,56,126,0,0,66,0,0,0,192,125,0,0,65,0,0,0,72,125,0,0,67,0,0,0,16,125,0,0,67,0,0,0,160,124,0,0,68,0,0,0,112,124,0,0,68,0,0,0,144,123,0,0,69,0,0,0,16,123,0,0,69,0,0,0,120,122,0,0,71,0,0,0,40,122,0,0,71,0,0,0,232,121,0,0,73,0,0,0,192,121,0,0,73,0,0,0,152,121,0,0,72,0,0,0,104,121,0,0,72,0,0,0,8,121,0,0,72,0,0,0,176,120,0,0,74,0,0,0,184,119,0,0,75,0,0,0,80,119,0,0,75,0,0,0,224,118,0,0,76,0,0,0,176,118,0,0,77,0,0,0,128,118,0,0,78,0,0,0,64,118,0,0,79,0,0,0,240,117,0,0,79,0,0,0,168,117,0,0,79,0,0,0,8,227,0,0,80,0,0,0,208,226,0,0,81,0,0,0,8,226,0,0,82,0,0,0,152,225,0,0,83,0,0,0,48,225,0,0,84,0,0,0,248,224,0,0,85,0,0,0,208,224,0,0,86,0,0,0,160,224,0,0,87,0,0,0,104,224,0,0,88,0,0,0,56,224,0,0,89,0,0,0,248,223,0,0,90,0,0,0,184,223,0,0,91,0,0,0,192,222,0,0,92,0,0,0,88,222,0,0,93,0,0,0,216,221,0,0,94,0,0,0,56,221,0,0,95,0,0,0,216,220,0,0,96,0,0,0,48,220,0,0,97,0,0,0,192,219,0,0,98,0,0,0,144,219,0,0,99,0,0,0,72,219,0,0,100,0,0,0,0,219,0,0,101,0,0,0,56,218,0,0,102,0,0,0,192,217,0,0,103,0,0,0,112,217,0,0,104,0,0,0,248,216,0,0,105,0,0,0,200,216,0,0,106,0,0,0,168,216,0,0,107,0,0,0,144,216,0,0,108,0,0,0,112,216,0,0,109,0,0,0,72,216,0,0,110,0,0,0,16,216,0,0,111,0,0,0,184,215,0,0,112,0,0,0,40,215,0,0,113,0,0,0,224,214,0,0,114,0,0,0,176,214,0,0,115,0,0,0,136,214,0,0,116,0,0,0,96,214,0,0,117,0,0,0,16,214,0,0,118,0,0,0,232,213,0,0,119,0,0,0,176,213,0,0,120,0,0,0,120,213,0,0,121,0,0,0,208,212,0,0,122,0,0,0,88,212,0,0,123,0,0,0,240,211,0,0,124,0,0,0,192,211,0,0,0,0,0,0,0,0,0,0,86,0,0,0,115,0,0,0,87,0,0,0,62,0,0,0,88,0,0,0,116,0,0,0,90,0,0,0,59,0,0,0,91,0,0,0,87,0,0,0,92,0,0,0,60,0,0,0,93,0,0,0,119,0,0,0,94,0,0,0,61,0,0,0,95,0,0,0,121,0,0,0,97,0,0,0,114,0,0,0,98,0,0,0,117,0,0,0,96,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,89,0,0,0,87,0,0,0,91,0,0,0,88,0,0,0,92,0,0,0,90,0,0,0,86,0,0,0,91,0,0,0,87,0,0,0,92,0,0,0,88,0,0,0,93,0,0,0,83,0,0,0,94,0,0,0,84,0,0,0,95,0,0,0,85,0,0,0,97,0,0,0,82,0,0,0,98,0,0,0,65,0,0,0,96,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,53,0,0,0,2,0,0,0,122,0,0,0,3,0,0,0,120,0,0,0,4,0,0,0,99,0,0,0,5,0,0,0,118,0,0,0,6,0,0,0,96,0,0,0,7,0,0,0,97,0,0,0,8,0,0,0,98,0,0,0,9,0,0,0,100,0,0,0,10,0,0,0,101,0,0,0,11,0,0,0,109,0,0,0,12,0,0,0,103,0,0,0,13,0,0,0,111,0,0,0,17,0,0,0,50,0,0,0,18,0,0,0,18,0,0,0,19,0,0,0,19,0,0,0,20,0,0,0,20,0,0,0,21,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,22,0,0,0,24,0,0,0,26,0,0,0,25,0,0,0,28,0,0,0,26,0,0,0,25,0,0,0,27,0,0,0,29,0,0,0,28,0,0,0,27,0,0,0,29,0,0,0,24,0,0,0,30,0,0,0,51,0,0,0,31,0,0,0,48,0,0,0,32,0,0,0,12,0,0,0,33,0,0,0,13,0,0,0,34,0,0,0,14,0,0,0,35,0,0,0,15,0,0,0,36,0,0,0,17,0,0,0,37,0,0,0,16,0,0,0,38,0,0,0,32,0,0,0,39,0,0,0,34,0,0,0,40,0,0,0,31,0,0,0,41,0,0,0,35,0,0,0,42,0,0,0,33,0,0,0,43,0,0,0,30,0,0,0,57,0,0,0,42,0,0,0,45,0,0,0,57,0,0,0,46,0,0,0,0,0,0,0,47,0,0,0,1,0,0,0,48,0,0,0,2,0,0,0,49,0,0,0,3,0,0,0,50,0,0,0,5,0,0,0,51,0,0,0,4,0,0,0,52,0,0,0,38,0,0,0,53,0,0,0,40,0,0,0,54,0,0,0,37,0,0,0,55,0,0,0,41,0,0,0,56,0,0,0,39,0,0,0,44,0,0,0,36,0,0,0,58,0,0,0,56,0,0,0,60,0,0,0,6,0,0,0,61,0,0,0,7,0,0,0,62,0,0,0,8,0,0,0,63,0,0,0,9,0,0,0,64,0,0,0,11,0,0,0,66,0,0,0,45,0,0,0,65,0,0,0,46,0,0,0,67,0,0,0,43,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,44,0,0,0,70,0,0,0,56,0,0,0,71,0,0,0,54,0,0,0,72,0,0,0,58,0,0,0,74,0,0,0,58,0,0,0,75,0,0,0,55,0,0,0,76,0,0,0,49,0,0,0,77,0,0,0,55,0,0,0,81,0,0,0,54,0,0,0,99,0,0,0,114,0,0,0,100,0,0,0,115,0,0,0,101,0,0,0,116,0,0,0,102,0,0,0,117,0,0,0,103,0,0,0,119,0,0,0,104,0,0,0,121,0,0,0,105,0,0,0,62,0,0,0,106,0,0,0,59,0,0,0,108,0,0,0,60,0,0,0,107,0,0,0,61,0,0,0,82,0,0,0,71,0,0,0,83,0,0,0,75,0,0,0,84,0,0,0,67,0,0,0,86,0,0,0,89,0,0,0,87,0,0,0,91,0,0,0,88,0,0,0,92,0,0,0,85,0,0,0,78,0,0,0,90,0,0,0,86,0,0,0,91,0,0,0,87,0,0,0,92,0,0,0,88,0,0,0,89,0,0,0,69,0,0,0,93,0,0,0,83,0,0,0,94,0,0,0,84,0,0,0,95,0,0,0,85,0,0,0,96,0,0,0,76,0,0,0,97,0,0,0,82,0,0,0,98,0,0,0,65,0,0,0,0,0,0,0,0,0,0,0,27,0,0,0,1,0,0,0,58,4,0,0,2,0,0,0,59,4,0,0,3,0,0,0,60,4,0,0,4,0,0,0,61,4,0,0,5,0,0,0,62,4,0,0,6,0,0,0,63,4,0,0,7,0,0,0,64,4,0,0,8,0,0,0,65,4,0,0,9,0,0,0,66,4,0,0,10,0,0,0,67,4,0,0,11,0,0,0,68,4,0,0,12,0,0,0,69,4,0,0,13,0,0,0,70,4,0,0,14,0,0,0,71,4,0,0,15,0,0,0,72,4,0,0,16,0,0,0,96,0,0,0,17,0,0,0,49,0,0,0,18,0,0,0,50,0,0,0,19,0,0,0,51,0,0,0,20,0,0,0,52,0,0,0,21,0,0,0,53,0,0,0,22,0,0,0,54,0,0,0,23,0,0,0,55,0,0,0,24,0,0,0,56,0,0,0,25,0,0,0,57,0,0,0,26,0,0,0,48,0,0,0,27,0,0,0,45,0,0,0,28,0,0,0,61,0,0,0,29,0,0,0,187,0,0,0,29,0,0,0,8,0,0,0,30,0,0,0,9,0,0,0,31,0,0,0,113,0,0,0,32,0,0,0,119,0,0,0,33,0,0,0,101,0,0,0,34,0,0,0,114,0,0,0,35,0,0,0,116,0,0,0,36], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([121,0,0,0,37,0,0,0,117,0,0,0,38,0,0,0,105,0,0,0,39,0,0,0,111,0,0,0,40,0,0,0,112,0,0,0,41,0,0,0,91,0,0,0,42,0,0,0,93,0,0,0,43,0,0,0,13,0,0,0,44,0,0,0,57,4,0,0,45,0,0,0,97,0,0,0,46,0,0,0,115,0,0,0,47,0,0,0,100,0,0,0,48,0,0,0,102,0,0,0,49,0,0,0,103,0,0,0,50,0,0,0,104,0,0,0,51,0,0,0,106,0,0,0,52,0,0,0,107,0,0,0,53,0,0,0,108,0,0,0,54,0,0,0,59,0,0,0,55,0,0,0,186,0,0,0,55,0,0,0,39,0,0,0,56,0,0,0,92,0,0,0,57,0,0,0,220,0,0,0,57,0,0,0,225,4,0,0,58,0,0,0,60,0,0,0,59,0,0,0,122,0,0,0,60,0,0,0,120,0,0,0,61,0,0,0,99,0,0,0,62,0,0,0,118,0,0,0,63,0,0,0,98,0,0,0,64,0,0,0,110,0,0,0,66,0,0,0,109,0,0,0,65,0,0,0,44,0,0,0,67,0,0,0,46,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,229,4,0,0,70,0,0,0,224,4,0,0,71,0,0,0,227,4,0,0,73,0,0,0,227,4,0,0,72,0,0,0,226,4,0,0,75,0,0,0,1,5,0,0,74,0,0,0,32,0,0,0,76,0,0,0,230,4,0,0,77,0,0,0,231,4,0,0,78,0,0,0,231,4,0,0,79,0,0,0,118,4,0,0,80,0,0,0,228,4,0,0,81,0,0,0,83,4,0,0,82,0,0,0,84,4,0,0,83,0,0,0,85,4,0,0,84,0,0,0,86,4,0,0,85,0,0,0,95,4,0,0,86,0,0,0,96,4,0,0,87,0,0,0,97,4,0,0,88,0,0,0,87,4,0,0,89,0,0,0,92,4,0,0,90,0,0,0,93,4,0,0,91,0,0,0,94,4,0,0,92,0,0,0,89,4,0,0,93,0,0,0,90,4,0,0,94,0,0,0,91,4,0,0,95,0,0,0,88,4,0,0,96,0,0,0,98,4,0,0,97,0,0,0,99,4,0,0,98,0,0,0,73,4,0,0,99,0,0,0,74,4,0,0,100,0,0,0,75,4,0,0,101,0,0,0,127,0,0,0,102,0,0,0,77,4,0,0,103,0,0,0,78,4,0,0,104,0,0,0,82,4,0,0,105,0,0,0,80,4,0,0,106,0,0,0,81,4,0,0,107,0,0,0,79,4,0,0,108,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,1,0,101,0,0,0,0,0,0,0,1,0,229,0,0,0,0,0,0,0,18,0,0,0,1,0,37,0,0,0,0,0,0,0,1,0,165,0,0,0,0,0,0,0,19,0,0,0,1,0,39,0,0,0,0,0,0,0,1,0,167,0,0,0,0,0,0,0,20,0,0,0,1,0,41,0,0,0,0,0,0,0,1,0,169,0,0,0,0,0,0,0,21,0,0,0,1,0,43,0,0,0,0,0,0,0,1,0,171,0,0,0,0,0,0,0,22,0,0,0,1,0,47,0,0,0,0,0,0,0,1,0,175,0,0,0,0,0,0,0,23,0,0,0,1,0,45,0,0,0,0,0,0,0,1,0,173,0,0,0,0,0,0,0,24,0,0,0,1,0,53,0,0,0,0,0,0,0,1,0,181,0,0,0,0,0,0,0,25,0,0,0,1,0,57,0,0,0,0,0,0,0,1,0,185,0,0,0,0,0,0,0,26,0,0,0,1,0,51,0,0,0,0,0,0,0,1,0,179,0,0,0,0,0,0,0,27,0,0,0,1,0,59,0,0,0,0,0,0,0,1,0,187,0,0,0,0,0,0,0,28,0,0,0,1,0,55,0,0,0,0,0,0,0,1,0,183,0,0,0,0,0,0,0,29,0,0,0,1,0,49,0,0,0,0,0,0,0,1,0,177,0,0,0,0,0,0,0,30,0,0,0,1,0,103,0,0,0,0,0,0,0,1,0,231,0,0,0,0,0,0,0,31,0,0,0,1,0,97,0,0,0,0,0,0,0,1,0,225,0,0,0,0,0,0,0,32,0,0,0,1,0,25,0,0,0,0,0,0,0,1,0,153,0,0,0,0,0,0,0,33,0,0,0,1,0,27,0,0,0,0,0,0,0,1,0,155,0,0,0,0,0,0,0,34,0,0,0,1,0,29,0,0,0,0,0,0,0,1,0,157,0,0,0,0,0,0,0,35,0,0,0,1,0,31,0,0,0,0,0,0,0,1,0,159,0,0,0,0,0,0,0,36,0,0,0,1,0,35,0,0,0,0,0,0,0,1,0,163,0,0,0,0,0,0,0,37,0,0,0,1,0,33,0,0,0,0,0,0,0,1,0,161,0,0,0,0,0,0,0,38,0,0,0,1,0,65,0,0,0,0,0,0,0,1,0,193,0,0,0,0,0,0,0,39,0,0,0,1,0,69,0,0,0,0,0,0,0,1,0,197,0,0,0,0,0,0,0,40,0,0,0,1,0,63,0,0,0,0,0,0,0,1,0,191,0,0,0,0,0,0,0,41,0,0,0,1,0,71,0,0,0,0,0,0,0,1,0,199,0,0,0,0,0,0,0,42,0,0,0,1,0,67,0,0,0,0,0,0,0,1,0,195,0,0,0,0,0,0,0,43,0,0,0,1,0,61,0,0,0,0,0,0,0,1,0,189,0,0,0,0,0,0,0,57,0,0,0,1,0,85,0,0,0,0,0,0,0,1,0,213,0,0,0,0,0,0,0,44,0,0,0,1,0,73,0,0,0,0,0,0,0,1,0,201,0,0,0,0,0,0,0,45,0,0,0,1,0,115,0,0,0,0,0,0,0,1,0,243,0,0,0,0,0,0,0,46,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,129,0,0,0,0,0,0,0,47,0,0,0,1,0,3,0,0,0,0,0,0,0,1,0,131,0,0,0,0,0,0,0,48,0,0,0,1,0,5,0,0,0,0,0,0,0,1,0,133,0,0,0,0,0,0,0,49,0,0,0,1,0,7,0,0,0,0,0,0,0,1,0,135,0,0,0,0,0,0,0,50,0,0,0,1,0,11,0,0,0,0,0,0,0,1,0,139,0,0,0,0,0,0,0,51,0,0,0,1,0,9,0,0,0,0,0,0,0,1,0,137,0,0,0,0,0,0,0,52,0,0,0,1,0,77,0,0,0,0,0,0,0,1,0,205,0,0,0,0,0,0,0,53,0,0,0,1,0,81,0,0,0,0,0,0,0,1,0,209,0,0,0,0,0,0,0,54,0,0,0,1,0,75,0,0,0,0,0,0,0,1,0,203,0,0,0,0,0,0,0,55,0,0,0,1,0,83,0,0,0,0,0,0,0,1,0,211,0,0,0,0,0,0,0,56,0,0,0,1,0,79,0,0,0,0,0,0,0,1,0,207,0,0,0,0,0,0,0,58,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,70,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,60,0,0,0,1,0,13,0,0,0,0,0,0,0,1,0,141,0,0,0,0,0,0,0,61,0,0,0,1,0,15,0,0,0,0,0,0,0,1,0,143,0,0,0,0,0,0,0,62,0,0,0,1,0,17,0,0,0,0,0,0,0,1,0,145,0,0,0,0,0,0,0,63,0,0,0,1,0,19,0,0,0,0,0,0,0,1,0,147,0,0,0,0,0,0,0,64,0,0,0,1,0,23,0,0,0,0,0,0,0,1,0,151,0,0,0,0,0,0,0,66,0,0,0,1,0,91,0,0,0,0,0,0,0,1,0,219,0,0,0,0,0,0,0,65,0,0,0,1,0,93,0,0,0,0,0,0,0,1,0,221,0,0,0,0,0,0,0,67,0,0,0,1,0,87,0,0,0,0,0,0,0,1,0,215,0,0,0,0,0,0,0,68,0,0,0,1,0,95,0,0,0,0,0,0,0,1,0,223,0,0,0,0,0,0,0,69,0,0,0,1,0,89,0,0,0,0,0,0,0,1,0,217,0,0,0,0,0,0,0,71,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,81,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,75,0,0,0,1,0,111,0,0,0,0,0,0,0,1,0,239,0,0,0,0,0,0,0,77,0,0,0,1,0,105,0,0,0,0,0,0,0,1,0,233,0,0,0,0,0,0,0,76,0,0,0,1,0,99,0,0,0,0,0,0,0,1,0,227,0,0,0,0,0,0,0,82,0,0,0,2,0,121,15,0,0,0,0,0,0,2,0,121,143,0,0,0,0,0,0,83,0,0,0,3,0,113,121,27,0,0,0,0,0,3,0,121,155,241,0,0,0,0,0,84,0,0,0,3,0,113,121,5,0,0,0,0,0,3,0,121,133,241,0,0,0,0,0,85,0,0,0,2,0,121,29,0,0,0,0,0,0,2,0,121,157,0,0,0,0,0,0,86,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,87,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,88,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,89,0,0,0,3,0,113,121,13,0,0,0,0,0,3,0,121,141,241,0,0,0,0,0,90,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,91,0,0,0,2,0,121,47,0,0,0,0,0,0,2,0,121,175,0,0,0,0,0,0,92,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,93,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,94,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,95,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,96,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,97,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,98,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,105,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,106,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,108,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,107,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,100,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,103,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,101,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,104,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,99,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,101,0,0,0,0,0,0,102,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,1,0,101,0,0,0,0,0,0,0,1,0,229,0,0,0,0,0,0,0,18,0,0,0,1,0,39,0,0,0,0,0,0,0,1,0,167,0,0,0,0,0,0,0,19,0,0,0,1,0,39,0,0,0,0,0,0,0,1,0,167,0,0,0,0,0,0,0,20,0,0,0,1,0,41,0,0,0,0,0,0,0,1,0,169,0,0,0,0,0,0,0,21,0,0,0,1,0,43,0,0,0,0,0,0,0,1,0,171,0,0,0,0,0,0,0,22,0,0,0,1,0,47,0,0,0,0,0,0,0,1,0,175,0,0,0,0,0,0,0,23,0,0,0,1,0,45,0,0,0,0,0,0,0,1,0,173,0,0,0,0,0,0,0,24,0,0,0,1,0,53,0,0,0,0,0,0,0,1,0,181,0,0,0,0,0,0,0,25,0,0,0,1,0,57,0,0,0,0,0,0,0,1,0,185,0,0,0,0,0,0,0,26,0,0,0,1,0,51,0,0,0,0,0,0,0,1,0,179,0,0,0,0,0,0,0,27,0,0,0,1,0,59,0,0,0,0,0,0,0,1,0,187,0,0,0,0,0,0,0,28,0,0,0,1,0,55,0,0,0,0,0,0,0,1,0,183,0,0,0,0,0,0,0,29,0,0,0,1,0,49,0,0,0,0,0,0,0,1,0,177,0,0,0,0,0,0,0,30,0,0,0,1,0,103,0,0,0,0,0,0,0,1,0,231,0,0,0,0,0,0,0,31,0,0,0,1,0,97,0,0,0,0,0,0,0,1,0,225,0,0,0,0,0,0,0,32,0,0,0,1,0,25,0,0,0,0,0,0,0,1,0,153,0,0,0,0,0,0,0,33,0,0,0,1,0,27,0,0,0,0,0,0,0,1,0,155,0,0,0,0,0,0,0,34,0,0,0,1,0,29,0,0,0,0,0,0,0,1,0,157,0,0,0,0,0,0,0,35,0,0,0,1,0,31,0,0,0,0,0,0,0,1,0,159,0,0,0,0,0,0,0,36,0,0,0,1,0,35,0,0,0,0,0,0,0,1,0,163,0,0,0,0,0,0,0,37,0,0,0,1,0,33,0,0,0,0,0,0,0,1,0,161,0,0,0,0,0,0,0,38,0,0,0,1,0,65,0,0,0,0,0,0,0,1,0,193,0,0,0,0,0,0,0,39,0,0,0,1,0,69,0,0,0,0,0,0,0,1,0,197,0,0,0,0,0,0,0,40,0,0,0,1,0,63,0,0,0,0,0,0,0,1,0,191,0,0,0,0,0,0,0,41,0,0,0,1,0,71,0,0,0,0,0,0,0,1,0,199,0,0,0,0,0,0,0,42,0,0,0,1,0,67,0,0,0,0,0,0,0,1,0,195,0,0,0,0,0,0,0,43,0,0,0,1,0,61,0,0,0,0,0,0,0,1,0,189,0,0,0,0,0,0,0,44,0,0,0,1,0,85,0,0,0,0,0,0,0,1,0,213,0,0,0,0,0,0,0,45,0,0,0,1,0,115,0,0,0,0,0,0,0,1,0,243,0,0,0,0,0,0,0,46,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,129,0,0,0,0,0,0,0,47,0,0,0,1,0,3,0,0,0,0,0,0,0,1,0,131,0,0,0,0,0,0,0,48,0,0,0,1,0,5,0,0,0,0,0,0,0,1,0,133,0,0,0,0,0,0,0,49,0,0,0,1,0,7,0,0,0,0,0,0,0,1,0,135,0,0,0,0,0,0,0,50,0,0,0,1,0,11,0,0,0,0,0,0,0,1,0,139,0,0,0,0,0,0,0,51,0,0,0,1,0,9,0,0,0,0,0,0,0,1,0,137,0,0,0,0,0,0,0,52,0,0,0,1,0,77,0,0,0,0,0,0,0,1,0,205,0,0,0,0,0,0,0,53,0,0,0,1,0,81,0,0,0,0,0,0,0,1,0,209,0,0,0,0,0,0,0,54,0,0,0,1,0,75,0,0,0,0,0,0,0,1,0,203,0,0,0,0,0,0,0,55,0,0,0,1,0,83,0,0,0,0,0,0,0,1,0,211,0,0,0,0,0,0,0,56,0,0,0,1,0,79,0,0,0,0,0,0,0,1,0,207,0,0,0,0,0,0,0,57,0,0,0,1,0,73,0,0,0,0,0,0,0,1,0,201,0,0,0,0,0,0,0,58,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,70,0,0,0,1,0,113,0,0,0,0,0,0,0,1,0,241,0,0,0,0,0,0,0,59,0,0,0,1,0,13,0,0,0,0,0,0,0,1,0,141,0,0,0,0,0,0,0,60,0,0,0,1,0,15,0,0,0,0,0,0,0,1,0,143,0,0,0,0,0,0,0,61,0,0,0,1,0,17,0,0,0,0,0,0,0,1,0,145,0,0,0,0,0,0,0,62,0,0,0,1,0,19,0,0,0,0,0,0,0,1,0,147,0,0,0,0,0,0,0,63,0,0,0,1,0,23,0,0,0,0,0,0,0,1,0,151,0,0,0,0,0,0,0,64,0,0,0,1,0,91,0,0,0,0,0,0,0,1,0,219,0,0,0,0,0,0,0,66,0,0,0,1,0,93,0,0,0,0,0,0,0,1,0,221,0,0,0,0,0,0,0,65,0,0,0,1,0,87,0,0,0,0,0,0,0,1,0,215,0,0,0,0,0,0,0,67,0,0,0,1,0,95,0,0,0,0,0,0,0,1,0,223,0,0,0,0,0,0,0,68,0,0,0,1,0,89,0,0,0,0,0,0,0,1,0,217,0,0,0,0,0,0,0,69,0,0,0,1,0,21,0,0,0,0,0,0,0,1,0,149,0,0,0,0,0,0,0,71,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,81,0,0,0,1,0,117,0,0,0,0,0,0,0,1,0,245,0,0,0,0,0,0,0,75,0,0,0,1,0,111,0,0,0,0,0,0,0,1,0,239,0,0,0,0,0,0,0,77,0,0,0,1,0,99,0,0,0,0,0,0,0,1,0,227,0,0,0,0,0,0,0,76,0,0,0,1,0,105,0,0,0,0,0,0,0,1,0,233,0,0,0,0,0,0,0,82,0,0,0,2,0,121,15,0,0,0,0,0,0,2,0,121,143,0,0,0,0,0,0,83,0,0,0,3,0,113,121,27,0,0,0,0,0,3,0,121,155,241,0,0,0,0,0,84,0,0,0,3,0,113,121,5,0,0,0,0,0,3,0,121,133,241,0,0,0,0,0,85,0,0,0,2,0,121,29,0,0,0,0,0,0,2,0,121,157,0,0,0,0,0,0,86,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,87,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,88,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,89,0,0,0,3,0,113,121,13,0,0,0,0,0,3,0,121,141,241,0,0,0,0,0,90,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,91,0,0,0,2,0,121,47,0,0,0,0,0,0,2,0,121,175,0,0,0,0,0,0,92,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,93,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,94,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,95,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,96,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,97,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,98,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,105,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,106,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,108,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,107,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,100,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,103,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,101,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,104,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,99,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,229,0,0,0,0,0,0,102,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,87,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,88,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,90,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,91,0,0,0,2,0,121,47,0,0,0,0,0,0,2,0,121,175,0,0,0,0,0,0,92,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,93,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,94,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,95,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,97,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,98,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,96,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,100,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,105,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,101,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,106,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,108,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,103,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,107,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,104,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,99,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,101,0,0,0,0,0,0,102,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,2,0,121,103,0,0,0,0,0,0,2,0,121,231,0,0,0,0,0,0,87,0,0,0,2,0,121,27,0,0,0,0,0,0,2,0,121,155,0,0,0,0,0,0,88,0,0,0,2,0,121,105,0,0,0,0,0,0,2,0,121,233,0,0,0,0,0,0,90,0,0,0,2,0,121,13,0,0,0,0,0,0,2,0,121,141,0,0,0,0,0,0,91,0,0,0,2,0,121,25,0,0,0,0,0,0,2,0,121,153,0,0,0,0,0,0,92,0,0,0,2,0,121,5,0,0,0,0,0,0,2,0,121,133,0,0,0,0,0,0,93,0,0,0,2,0,121,111,0,0,0,0,0,0,2,0,121,239,0,0,0,0,0,0,94,0,0,0,2,0,121,17,0,0,0,0,0,0,2,0,121,145,0,0,0,0,0,0,95,0,0,0,2,0,121,115,0,0,0,0,0,0,2,0,121,243,0,0,0,0,0,0,97,0,0,0,2,0,121,101,0,0,0,0,0,0,2,0,121,101,0,0,0,0,0,0,98,0,0,0,2,0,121,107,0,0,0,0,0,0,2,0,121,235,0,0,0,0,0,0,96,0,0,0,1,0,73,0,0,0,0,0,0,0,1,0,201,0,0,0,0,0,0,0,100,0,0,0,2,0,121,51,0,0,0,0,0,0,2,0,121,179,0,0,0,0,0,0,105,0,0,0,2,0,121,55,0,0,0,0,0,0,2,0,121,183,0,0,0,0,0,0,101,0,0,0,2,0,121,57,0,0,0,0,0,0,2,0,121,185,0,0,0,0,0,0,106,0,0,0,2,0,121,45,0,0,0,0,0,0,2,0,121,173,0,0,0,0,0,0,108,0,0,0,2,0,121,49,0,0,0,0,0,0,2,0,121,177,0,0,0,0,0,0,103,0,0,0,2,0,121,39,0,0,0,0,0,0,2,0,121,167,0,0,0,0,0,0,107,0,0,0,2,0,121,41,0,0,0,0,0,0,2,0,121,169,0,0,0,0,0,0,104,0,0,0,2,0,121,43,0,0,0,0,0,0,2,0,121,171,0,0,0,0,0,0,99,0,0,0,2,0,121,37,0,0,0,0,0,0,2,0,121,165,0,0,0,0,0,0,102,0,0,0,2,0,121,3,0,0,0,0,0,0,2,0,121,131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,230,41,1,0,14,17,1,0,52,248,0,0,102,223,0,0,150,198,0,0,0,0,0,0,230,41,1,0,14,17,1,0,52,248,0,0,102,223,0,0,150,198,0,0,0,0,0,0,150,151,154,155,157,158,159,166,167,171,172,173,174,175,178,179,180,181,182,183,185,186,187,188,189,190,191,203,205,206,207,211,214,215,217,218,219,220,221,222,223,229,230,231,233,234,235,236,237,238,239,242,243,244,245,246,247,249,250,251,252,253,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,255,255,2,3,255,4,5,6,255,255,255,255,255,255,7,8,255,255,255,9,10,11,12,13,255,255,14,15,16,17,18,19,255,20,21,22,23,24,25,26,255,255,255,255,255,255,255,255,255,255,255,27,255,28,29,30,255,255,255,31,255,255,32,33,255,34,35,36,37,38,39,40,255,255,255,255,255,41,42,43,255,44,45,46,47,48,49,50,255,255,51,52,53,54,55,56,255,57,58,59,60,61,62,63,240,1,0,0,176,1,0,0,6,2,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,192,0,0,0,162,0,0,0,46,0,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,230,1,0,0,166,1,0,0,120,0,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,48,1,0,0,116,1,0,0,164,1,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,84,0,0,0,142,0,0,0,228,1,0,0,22,1,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,8,1,0,0,230,0,0,0,156,1,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,94,0,0,0,48,0,0,0,2,2,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,178,1,0,0,248,1,0,0,180,0,0,0,0,0,0,0,176,0,0,0,104,0,0,0,82,1,0,0,34,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,0,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,150,0,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,10,0,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,12,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,128,0,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,142,1,0,0,16,0,0,0,160,1,0,0,114,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,42,1,0,0,110,1,0,0,200,1,0,0,98,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,122,1,0,0,170,1,0,0,252,1,0,0,162,1,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,186,0,0,0,122,0,0,0,42,0,0,0,52,1,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,238,0,0,0,168,0,0,0,92,0,0,0,70,1,0,0,0,0,0,0,0,0,0,0,200,0,0,0,242,1,0,0,26,0,0,0,96,0,0,0,30,1,0,0,244,1,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,0,0,0,0,0,0,0,0,4,2,0,0,212,1,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,0,0,0,0,74,1,0,0,30,0,0,0,84,1,0,0,0,0,0,0,0,0,0,0,200,0,0,0,16,1,0,0,54,1,0,0,242,0,0,0,86,0,0,0,58,0,0,0,208,1,0,0,152,1,0,0,64,1,0,0,138,0,0,0,54,1,0,0,242,0,0,0,86,0,0,0,88,1,0,0,208,1,0,0,152,1,0,0,64,1,0,0,24,1,0,0,54,1,0,0,242,0,0,0,86,0,0,0,196,0,0,0,208,1,0,0,152,1,0,0,64,1,0,0,40,1,0,0,54,1,0,0,242,0,0,0,86,0,0,0,196,1,0,0,208,1,0,0,152,1,0,0,64,1,0,0,158,1,0,0,54,1,0,0,242,0,0,0,86,0,0,0,220,1,0,0,208,1,0,0,152,1,0,0,64,1,0,0,126,1,0,0,54,1,0,0,242,0,0,0,86,0,0,0,82,0,0,0,208,1,0,0,152,1,0,0,64,1,0,0,222,0,0,0,54,1,0,0,242,0,0,0,86,0,0,0,194,0,0,0,208,1,0,0,152,1,0,0,64,1,0,0,110,0,0,0,54,1,0,0,242,0,0,0,86,0,0,0,226,0,0,0,208,1,0,0,152,1,0,0,64,1,0,0,132,1,0,0,198,1,0,0,198,1,0,0,198,1,0,0,198,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,112,0,0,0,112,0,0,0,112,0,0,0,112,0,0,0,216,1,0,0,216,1,0,0,216,1,0,0,216,1,0,0,78,0,0,0,78,0,0,0,78,0,0,0,78,0,0,0,172,1,0,0,172,1,0,0,172,1,0,0,172,1,0,0,20,1,0,0,20,1,0,0,20,1,0,0,20,1,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,228,0,0,0,228,0,0,0,228,0,0,0,228,0,0,0,66,0,0,0,66,0,0,0,66,0,0,0,66,0,0,0,204,1,0,0,204,1,0,0,204,1,0,0,204,1,0,0,50,1,0,0,50,1,0,0,50,1,0,0,50,1,0,0,124,0,0,0,124,0,0,0,124,0,0,0,124,0,0,0,152,0,0,0,152,0,0,0,152,0,0,0,152,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,98,1,0,0,98,1,0,0,98,1,0,0,98,1,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,250,0,0,0,66,1,0,0,108,0,0,0,144,1,0,0,80,0,0,0,28,0,0,0,226,1,0,0,210,1,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,180,1,0,0,250,1,0,0,44,0,0,0,232,0,0,0,76,0,0,0,132,0,0,0,216,0,0,0,204,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,118,1,0,0,174,1,0,0,246,1,0,0,222,1,0,0,214,0,0,0,10,1,0,0,224,1,0,0,60,0,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,140,0,0,0,218,0,0,0,32,0,0,0,234,1,0,0,68,1,0,0,252,0,0,0,186,1,0,0,206,1,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,108,1,0,0,44,1,0,0,18,0,0,0,36,0,0,0,202,0,0,0,36,1,0,0,166,0,0,0,62,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,40,0,0,0,86,1,0,0,248,0,0,0,182,0,0,0,202,1,0,0,174,0,0,0,100,0,0,0,22,0,0,0,14,1,0,0,86,1,0,0,248,0,0,0,182,0,0,0,50,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,164,0,0,0,86,1,0,0,248,0,0,0,182,0,0,0,74,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,168,1,0,0,86,1,0,0,248,0,0,0,182,0,0,0,210,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,0,0,0,0,86,1,0,0,248,0,0,0,182,0,0,0,0,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,0,0,0,0,86,1,0,0,248,0,0,0,182,0,0,0,0,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,0,0,0,0,86,1,0,0,248,0,0,0,182,0,0,0,0,0,0,0,174,0,0,0,100,0,0,0,22,0,0,0,0,0,0,0,86,1,0,0,248,0,0,0,182,0,0,0,0,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,20,0,0,0,24,0,0,0,24,0,0,0,24,0,0,0,24,0,0,0,24,0,0,0,24,0,0,0,24,0,0,0,24,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,28,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,46,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,36,0,0,0,40,0,0,0,38,0,0,0,64,0,0,0,66,0,0,0,22,0,0,0,44,0,0,0,44,0,0,0,44,0,0,0,32,1,0,0,226,0,0,0,188,0,0,0,80,0,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,28,0,0,0,100,0,0,0,140,0,0,0,14,1,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,10,0,0,0,46,0,0,0,94,0,0,0,178,0,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,128,0,0,0,96,0,0,0,248,0,0,0,104,0,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,90,0,0,0,38,0,0,0,176,0,0,0,150,0,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,232,0,0,0,192,0,0,0,138,0,0,0,104,0,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,8,0,0,0,52,1,0,0,86,0,0,0,104,0,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,46,1,0,0,12,0,0,0,50,0,0,0,80,1,0,0,182,0,0,0,126,0,0,0,66,0,0,0,14,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,108,0,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,144,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,190,0,0,0,50,1,0,0,26,0,0,0,238,0,0,0,68,0,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,116,0,0,0,56,0,0,0,16,0,0,0,152,0,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,224,0,0,0,184,0,0,0,72,1,0,0,66,1,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,22,0,0,0,84,0,0,0,16,1,0,0,52,0,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,162,0,0,0,210,0,0,0,2,1,0,0,242,0,0,0,104,0,0,0,104,0,0,0,122,0,0,0,48,1,0,0,154,0,0,0,206,0,0,0,76,0,0,0,58,0,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,24,1,0,0,70,1,0,0,132,0,0,0,4,1,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,104,0,0,0,18,0,0,0,168,0,0,0,80,1,0,0,104,0,0,0,104,0,0,0,122,0,0,0,134,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,170,0,0,0,214,0,0,0,20,1,0,0,62,0,0,0,56,1,0,0,252,0,0,0,204,0,0,0,62,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,40,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,60,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,104,0,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,228,0,0,0,82,0,0,0,78,1,0,0,32,0,0,0,106,0,0,0,72,0,0,0,220,0,0,0,76,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,26,1,0,0,30,0,0,0,6,0,0,0,44,0,0,0,196,0,0,0,10,1,0,0,102,0,0,0,0,1,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,186,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,54,0,0,0,2,0,0,0,42,1,0,0,236,0,0,0,18,1,0,0,60,1,0,0,24,0,0,0,234,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,8,1,0,0,198,0,0,0,68,1,0,0,230,0,0,0,4,0,0,0,44,1,0,0,98,0,0,0,146,0,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,244,0,0,0,22,1,0,0,148,0,0,0,36,0,0,0,118,0,0,0,172,0,0,0,34,0,0,0,64,1,0,0,88,0,0,0,120,0,0,0,174,0,0,0,48,0,0,0,208,0,0,0,158,0,0,0,110,0,0,0,6,1,0,0,88,0,0,0,120,0,0,0,174,0,0,0,216,0,0,0,208,0,0,0,158,0,0,0,110,0,0,0,166,0,0,0,88,0,0,0,120,0,0,0,174,0,0,0,62,1,0,0,208,0,0,0,158,0,0,0,110,0,0,0,160,0,0,0,88,0,0,0,120,0,0,0,174,0,0,0,136,0,0,0,208,0,0,0,158,0,0,0,110,0,0,0,70,0,0,0,88,0,0,0,120,0,0,0,174,0,0,0,114,0,0,0,208,0,0,0,158,0,0,0,110,0,0,0,78,0,0,0,88,0,0,0,120,0,0,0,174,0,0,0,58,1,0,0,208,0,0,0,158,0,0,0,110,0,0,0,36,1,0,0,88,0,0,0,120,0,0,0,174,0,0,0,222,0,0,0,208,0,0,0,158,0,0,0,110,0,0,0,104,0,0,0,88,0,0,0,120,0,0,0,174,0,0,0,212,0,0,0,208,0,0,0,158,0,0,0,110,0,0,0,194,0,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,34,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,0,0,0,182,1,0,0,206,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,0,0,0,154,1,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,140,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,158,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,178,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,244,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,0,0,58,1,0,0,58,1,0,0,58,1,0,0,58,1,0,0,232,1,0,0,232,1,0,0,232,1,0,0,232,1,0,0,218,1,0,0,218,1,0,0,218,1,0,0,218,1,0,0,70,0,0,0,70,0,0,0,70,0,0,0,70,0,0,0,184,0,0,0,184,0,0,0,184,0,0,0,184,0,0,0,38,1,0,0,38,1,0,0,38,1,0,0,38,1,0,0,172,0,0,0,172,0,0,0,172,0,0,0,172,0,0,0,134,1,0,0,134,1,0,0,134,1,0,0,134,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,190,1,0,0,190,1,0,0,190,1,0,0,190,1,0,0,6,1,0,0,6,1,0,0,6,1,0,0,6,1,0,0,148,1,0,0,148,1,0,0,148,1,0,0,148,1,0,0,72,0,0,0,72,0,0,0,72,0,0,0,72,0,0,0,76,1,0,0,76,1,0,0,76,1,0,0,76,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20480);
/* memory initializer */ allocate([4,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,190,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,236,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,106,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,124,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,212,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,194,0,0,2,0,0,0,216,179,0,0,2,0,0,0,96,166,0,0,10,0,0,0,0,0,0,0,0,0,0,0,240,213,0,0,14,0,0,0,240,221,0,0,18,0,0,0,128,196,0,0,12,0,0,0,232,180,0,0,12,0,0,0,8,167,0,0,16,0,0,0,240,154,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,80,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,80,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,178,5,0,81,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,196,5,0,82,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,214,5,0,83,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,64,6,0,80,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,84,6,0,81,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,104,6,0,82,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,124,6,0,83,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,224,6,0,80,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,246,6,0,81,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,12,7,0,82,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,34,7,0,83,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,100,11,0,81,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,136,11,0,82,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,172,11,0,83,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,168,12,0,81,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,208,12,0,82,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,248,12,0,83,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,13,0,80,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,236,13,0,81,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,24,14,0,82,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,68,14,0,83,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,2,0,40,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,208,2,0,40,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,5,0,40,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,40,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,18,0,80,0,0,0,2,0,0,0,15,0,0,0,0,2,0,0,2,128,0,0,0,128,22,0,80,0,0,0,2,0,0,0,18,0,0,0,0,2,0,0,2,128,0,0,0,0,45,0,80,0,0,0,2,0,0,0,36,0,0,0,0,2,0,0,2,128,0,0,0,64,19,0,77,0,0,0,2,0,0,0,8,0,0,0,0,4,0,0,2,128,0,0,0,233,3,0,77,0,0,0,1,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,210,7,0,77,0,0,0,2,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,66,85,83,69,0,0,0,0,67,77,80,46,76,0,0,0,83,116,97,99,107,83,112,97,99,101,0,0,0,0,0,0,83,116,97,114,116,82,105,103,104,116,0,0,0,0,0,0,110,111,110,101,0,0,0,0,42,42,42,32,82,65,77,32,110,111,116,32,102,111,117,110,100,32,97,116,32,48,48,48,48,48,48,10,0,0,0,0,67,77,80,65,46,87,0,0,77,111,118,101,72,72,105,0,83,117,112,101,114,82,105,103,104,116,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,99,112,117,32,109,111,100,101,108,32,40,37,115,41,10,0,0,0,0,0,69,79,82,46,66,0,0,0,77,97,120,65,112,112,108,90,111,110,101,0,0,0,0,0,45,40,65,37,117,41,0,0,77,101,116,97,82,105,103,104,116,0,0,0,0,0,0,0,109,111,100,101,108,61,37,115,32,115,112,101,101,100,61,37,100,10,0,0,0,0,0,0,67,77,80,77,46,66,0,0,80,117,114,103,101,83,112,97,99,101,0,0,0,0,0,0,65,108,116,82,105,103,104,116,0,0,0,0,0,0,0,0,67,80,85,58,0,0,0,0,69,79,82,46,87,0,0,0,77,97,120,66,108,111,99,107,0,0,0,0,0,0,0,0,83,112,97,99,101,0,0,0,115,112,101,101,100,0,0,0,67,77,80,77,46,87,0,0,72,70,83,68,105,115,112,97,116,99,104,0,0,0,0,0,68,101,108,101,116,101,0,0,65,108,116,0,0,0,0,0,99,112,117,0,0,0,0,0,115,111,110,121,58,32,99,104,115,32,101,114,114,111,114,32,40,98,108,107,61,37,108,117,44,32,108,98,97,61,37,108,117,41,10,0,0,0,0,0,69,79,82,46,76,0,0,0,78,77,82,101,109,111,118,101,0,0,0,0,0,0,0,0,115,99,115,105,58,32,114,101,97,100,32,101,114,114,111,114,32,97,116,32,37,108,117,32,43,32,37,108,117,10,0,0,65,108,116,76,101,102,116,0,97,108,116,101,114,110,97,116,101,32,115,111,117,110,100,32,98,117,102,102,101,114,10,0,67,77,80,77,46,76,0,0,101,109,117,46,105,119,109,46,114,111,0,0,0,0,0,0,78,77,73,110,115,116,97,108,108,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,70,57,0,0,0,0,0,0,33,61,0,0,0,0,0,0,77,111,100,101,0,0,0,0,123,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,109,97,105,110,32,115,111,117,110,100,32,98,117,102,102,101,114,10,0,0,0,0,0,0,98,105,110,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,120,0,0,0,0,0,34,10,0,0,0,0,0,0,97,100,100,114,61,48,120,37,48,56,108,120,32,115,105,122,101,61,37,108,117,32,102,105,108,101,61,37,115,10,0,0,104,0,0,0,0,0,0,0,45,45,37,115,0,0,0,0,67,77,80,65,46,76,0,0,101,120,112,101,99,116,105,110,103,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,116,100,48,58,32,100,114,111,112,112,105,110,103,32,112,104,97,110,116,111,109,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,10,0,0,82,101,108,101,97,115,101,32,51,46,48,55,36,48,0,0,83,119,97,112,77,77,85,77,111,100,101,0,0,0,0,0,46,114,97,119,0,0,0,0,79,0,0,0,0,0,0,0,87,105,110,100,111,119,115,76,101,102,116,0,0,0,0,0,97,108,116,101,114,110,97,116,101,32,118,105,100,101,111,32,98,117,102,102,101,114,10,0,118,105,100,101,111,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,77,85,76,85,46,87,0,0,77,101,109,111,114,121,68,105,115,112,97,116,99,104,0,0,83,116,97,114,116,76,101,102,116,0,0,0,0,0,0,0,109,97,105,110,32,118,105,100,101,111,32,98,117,102,102,101,114,10,0,0,0,0,0,0,103,0,0,0,0,0,0,0,82,83,69,84,0,0,0,0,115,112,101,101,100,58,32,37,117,10,0,0,0,0,0,0,65,78,68,46,66,0,0,0,80,111,119,101,114,79,102,102,0,0,0,0,0,0,0,0,83,117,112,101,114,76,101,102,116,0,0,0,0,0,0,0,86,73,65,58,0,0,0,0,65,66,67,68,46,66,0,0,80,114,105,109,101,84,105,109,101,0,0,0,0,0,0,0,77,101,116,97,0,0,0,0,118,105,97,0,0,0,0,0,65,78,68,46,87,0,0,0,82,109,118,84,105,109,101,0,40,65,37,117,41,43,0,0,77,101,116,97,76,101,102,116,0,0,0,0,0,0,0,0,83,67,67,58,0,0,0,0,65,78,68,46,76,0,0,0,73,110,115,84,105,109,101,0,67,116,114,108,0,0,0,0,115,99,99,0,0,0,0,0,105,103,110,111,114,105,110,103,32,112,99,101,32,107,101,121,58,32,37,48,52,120,32,40,37,115,41,10,0,0,0,0,83,101,116,65,112,112,66,97,115,101,0,0,0,0,0,0,67,116,114,108,76,101,102,116,0,0,0,0,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,100,114,105,118,101,114,32,40,37,115,41,10,0,0,0,0,0,77,85,76,83,46,87,0,0,76,111,119,101,114,84,101,120,116,0,0,0,0,0,0,0,67,114,101,97,116,101,0,0,47,0,0,0,0,0,0,0,42,42,42,32,98,97,100,32,112,111,114,116,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,105,119,109,58,32,100,114,105,118,101,32,37,117,32,101,106,101,99,116,10,0,0,0,0,115,111,110,121,58,32,119,114,105,116,101,32,101,114,114,111,114,32,97,116,32,37,117,47,37,117,47,37,117,10,0,0,65,68,68,65,46,87,0,0,83,116,114,105,112,65,100,100,114,101,115,115,0,0,0,0,115,99,115,105,58,32,116,111,111,32,109,97,110,121,32,98,108,111,99,107,115,32,40,37,117,41,10,0,0,0,0,0,83,108,97,115,104,0,0,0,112,111,114,116,61,37,117,32,109,117,108,116,105,99,104,97,114,61,37,117,32,100,114,105,118,101,114,61,37,115,10,0,65,68,68,46,66,0,0,0,101,109,117,46,100,105,115,107,46,114,119,0,0,0,0,0,115,100,108,58,32,98,108,105,116,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,85,112,114,83,116,114,105,110,103,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,70,56,0,0,0,0,0,0,61,61,0,0,0,0,0,0,46,0,0,0,0,0,0,0,115,101,99,116,105,111,110,0,102,0,0,0,0,0,0,0,83,69,82,73,65,76,58,0,115,114,101,99,0,0,0,0,115,99,97,108,101,0,0,0,99,112,117,46,109,111,100,101,108,32,61,32,34,0,0,0,82,65,77,58,0,0,0,0,99,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,65,68,68,88,46,66,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,37,48,50,88,32,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,0,82,101,108,101,97,115,101,32,51,46,48,50,36,48,0,0,46,112,115,105,0,0,0,0,87,114,105,116,101,88,80,114,97,109,0,0,0,0,0,0,78,0,0,0,0,0,0,0,80,101,114,105,111,100,0,0,109,117,108,116,105,99,104,97,114,0,0,0,0,0,0,0,65,68,68,46,87,0,0,0,82,101,97,100,88,80,114,97,109,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,112,111,114,116,0,0,0,0,114,117,110,32,117,110,116,105,108,32,101,120,99,101,112,116,105,111,110,0,0,0,0,0,115,115,112,0,0,0,0,0,65,68,68,88,46,87,0,0,115,121,115,116,101,109,32,116,111,111,32,115,108,111,119,44,32,115,107,105,112,112,105,110,103,32,49,32,115,101,99,111,110,100,10,0,0,0,0,0,82,101,108,83,116,114,105,110,103,0,0,0,0,0,0,0,67,111,109,109,97,0,0,0,99,111,112,121,32,109,101,109,111,114,121,0,0,0,0,0,115,101,114,105,97,108,0,0,65,68,68,46,76,0,0,0,82,68,114,118,114,73,110,115,116,97,108,108,0,0,0,0,109,0,0,0,0,0,0,0,115,114,99,32,100,115,116,32,99,110,116,0,0,0,0,0,42,42,42,32,114,101,97,100,105,110,103,32,114,116,99,32,102,105,108,101,32,102,97,105,108,101,100,10,0,0,0,0,105,119,109,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,112,114,105,41,10,0,0,0,0,65,68,68,88,46,76,0,0,65,100,100,68,114,105,118,101,0,0,0,0,0,0,0,0,68,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,101,118,97,108,117,97,116,101,32,101,120,112,114,101,115,115,105,111,110,115,0,0,0,0,60,110,111,119,62,0,0,0,32,68,51,61,37,48,56,108,88,32,32,68,55,61,37,48,56,108,88,32,32,65,51,61,37,48,56,108,88,32,32,65,55,61,37,48,56,108,88,32,32,83,83,80,61,37,48,56,108,88,10,0,0,0,0,0,65,68,68,65,46,76,0,0,80,117,114,103,101,77,101,109,0,0,0,0,0,0,0,0,98,0,0,0,0,0,0,0,91,101,120,112,114,46,46,46,93,0,0,0,0,0,0,0,102,105,108,101,61,37,115,32,114,101,97,108,116,105,109,101,61,37,100,32,115,116,97,114,116,61,37,115,32,114,111,109,100,105,115,107,61,37,100,10,0,0,0,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,97,103,105,99,32,107,101,121,32,40,37,117,41,10,0,0,0,0,0,0,0,32,68,50,61,37,48,56,108,88,32,32,68,54,61,37,48,56,108,88,32,32,65,50,61,37,48,56,108,88,32,32,65,54,61,37,48,56,108,88,32,32,85,83,80,61,37,48,56,108,88,10,0,0,0,0,0,82,79,82,46,66,0,0,0,67,111,109,112,97,99,116,77,101,109,0,0,0,0,0,0,118,0,0,0,0,0,0,0,119,114,105,116,101,32,109,101,109,111,114,121,32,116,111,32,97,32,102,105,108,101,0,0,82,84,67,58,0,0,0,0,32,68,49,61,37,48,56,108,88,32,32,68,53,61,37,48,56,108,88,32,32,65,49,61,37,48,56,108,88,32,32,65,53,61,37,48,56,108,88,32,32,76,80,67,61,37,48,56,108,88,10,0,0,0,0,0,82,79,88,82,46,66,0,0,83,101,116,71,114,111,119,90,111,110,101,0,0,0,0,0,71,101,116,86,111,108,73,110,102,111,0,0,0,0,0,0,99,0,0,0,0,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,110,46,46,46,93,0,0,0,0,0,115,116,97,114,116,0,0,0,37,48,52,88,0,0,0,0,32,68,48,61,37,48,56,108,88,32,32,68,52,61,37,48,56,108,88,32,32,65,48,61,37,48,56,108,88,32,32,65,52,61,37,48,56,108,88,32,32,32,80,67,61,37,48,56,108,88,10,0,0,0,0,0,68,105,97,108,111,103,68,105,115,112,97,116,99,104,0,0,115,111,110,121,58,32,99,111,110,116,114,111,108,58,32,117,110,107,110,111,119,110,32,40,111,112,99,111,100,101,61,48,120,37,48,52,120,41,10,0,76,83,82,46,66,0,0,0,77,111,100,97,108,68,105,97,108,111,103,77,101,110,117,83,101,116,117,112,0,0,0,0,77,101,110,117,67,104,111,105,99,101,0,0,0,0,0,0,83,101,116,77,67,69,110,116,114,105,101,115,0,0,0,0,72,78,111,80,117,114,103,101,0,0,0,0,0,0,0,0,71,101,116,77,67,69,110,116,114,121,0,0,0,0,0,0,68,105,115,112,77,67,69,110,116,114,105,101,115,0,0,0,115,99,115,105,58,32,119,114,105,116,101,32,101,114,114,111,114,10,0,0,0,0,0,0,83,101,116,77,67,73,110,102,111,0,0,0,0,0,0,0,120,0,0,0,0,0,0,0,113,117,105,116,0,0,0,0,71,101,116,77,67,73,110,102,111,0,0,0,0,0,0,0,114,111,109,100,105,115,107,0,68,101,108,77,67,69,110,116,114,105,101,115,0,0,0,0,72,105,103,104,76,101,118,101,108,70,83,68,105,115,112,97,116,99,104,0,0,0,0,0,32,83,82,61,37,48,52,88,91,37,99,37,99,93,32,32,67,67,61,37,48,50,88,91,37,99,37,99,37,99,37,99,37,99,93,32,69,88,61,37,48,50,88,40,37,45,52,115,41,32,84,82,80,61,37,48,52,88,32,73,77,76,61,37,88,32,73,80,76,61,37,88,10,0,0,0,0,0,0,0,67,111,112,121,68,101,101,112,77,97,115,107,0,0,0,0,65,83,82,46,66,0,0,0,83,101,101,100,67,70,105,108,108,0,0,0,0,0,0,0,67,97,108,99,67,77,97,115,107,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,114,111,0,0,0,0,0,83,101,116,83,116,100,67,80,114,111,99,115,0,0,0,0,115,100,108,58,32,107,101,121,32,61,32,48,120,37,48,52,120,10,0,0,0,0,0,0,72,80,117,114,103,101,0,0,68,101,108,67,111,109,112,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,68,101,108,83,101,97,114,99,104,0,0,0,0,0,0,0,70,55,0,0,0,0,0,0,78,101,119,67,68,105,97,108,111,103,0,0,0,0,0,0,38,0,0,0,0,0,0,0,122,0,0,0,0,0,0,0,115,101,110,100,32,97,32,109,101,115,115,97,103,101,32,116,111,32,116,104,101,32,101,109,117,108,97,116,111,114,32,99,111,114,101,0,0,0,0,0,82,101,115,116,111,114,101,69,110,116,114,105,101,115,0,0,114,101,97,108,116,105,109,101,0,0,0,0,0,0,0,0,83,97,118,101,69,110,116,114,105,101,115,0,0,0,0,0,101,0,0,0,0,0,0,0,71,101,116,67,87,77,103,114,80,111,114,116,0,0,0,0,67,76,75,61,37,108,120,32,32,79,80,61,37,108,120,32,32,68,76,89,61,37,108,117,32,32,67,80,73,61,37,46,52,102,10,0,0,0,0,0,105,104,120,0,0,0,0,0,109,105,110,95,104,0,0,0,100,101,102,97,117,108,116,0,10,0,0,0,0,0,0,0,83,101,116,68,101,115,107,67,80,97,116,0,0,0,0,0,111,102,102,115,101,116,0,0,44,32,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,82,79,82,46,76,0,0,0,58,0,0,0,0,0,0,0,71,101,116,78,101,119,67,87,105,110,100,111,119,0,0,0,116,100,48,58,32,115,101,99,116,111,114,32,99,114,99,32,111,118,101,114,32,104,101,97,100,101,114,43,100,97,116,97,10,0,0,0,0,0,0,0,78,101,119,67,87,105,110,100,111,119,0,0,0,0,0,0,71,101,116,65,117,120,67,116,108,0,0,0,0,0,0,0,99,112,50,58,32,119,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,67,80,50,32,118,101,114,115,105,111,110,10,0,0,0,0,0,0,46,112,102,100,99,0,0,0,80,116,114,90,111,110,101,0,83,101,116,67,116,108,67,111,108,111,114,0,0,0,0,0,71,101,116,65,117,120,87,105,110,0,0,0,0,0,0,0,108,111,103,0,0,0,0,0,83,101,116,87,105,110,67,111,108,111,114,0,0,0,0,0,60,0,0,0,0,0,0,0,109,115,103,32,91,118,97,108,93,0,0,0,0,0,0,0,81,68,69,114,114,111,114,0,112,114,97,109,46,100,97,116,0,0,0,0,0,0,0,0,83,101,116,69,110,116,114,105,101,115,0,0,0,0,0,0,82,101,115,101,114,118,101,69,110,116,114,121,0,0,0,0,54,56,48,48,48,0,0,0,80,114,111,116,101,99,116,69,110,116,114,121,0,0,0,0,82,79,88,82,46,76,0,0,83,101,116,67,108,105,101,110,116,73,68,0,0,0,0,0,65,100,100,67,111,109,112,0,65,100,100,83,101,97,114,99,104,0,0,0,0,0,0,0,83,101,116,84,114,97,112,65,100,100,114,101,115,115,0,0,77,97,107,101,73,84,97,98,108,101,0,0,0,0,0,0,85,112,100,97,116,101,80,105,120,77,97,112,0,0,0,0,71,101,116,83,117,98,84,97,98,108,101,0,0,0,0,0,76,101,115,115,0,0,0,0,114,101,97,100,32,97,32,102,105,108,101,32,105,110,116,111,32,109,101,109,111,114,121,0,82,101,97,108,67,111,108,111,114,0,0,0,0,0,0,0,114,116,99,0,0,0,0,0,73,110,118,101,114,116,67,111,108,111,114,0,0,0,0,0,73,110,100,101,120,50,67,111,108,111,114,0,0,0,0,0,77,69,77,0,0,0,0,0,91,101,120,99,101,112,116,105,111,110,93,0,0,0,0,0,117,115,112,0,0,0,0,0,67,111,108,111,114,50,73,110,100,101,120,0,0,0,0,0,76,83,82,46,76,0,0,0,71,101,116,71,68,101,118,105,99,101,0,0,0,0,0,0,83,101,116,71,68,101,118,105,99,101,0,0,0,0,0,0,109,97,99,58,32,114,101,115,101,116,10,0,0,0,0,0,68,105,115,112,111,115,71,68,101,118,105,99,101,0,0,0,71,101,116,84,114,97,112,65,100,100,114,101,115,115,0,0,78,101,119,71,68,101,118,105,99,101,0,0,0,0,0,0,73,110,105,116,71,68,101,118,105,99,101,0,0,0,0,0,83,101,116,68,101,118,105,99,101,65,116,116,114,105,98,117,116,101,0,0,0,0,0,0,83,104,105,102,116,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,91,110,93,93,0,0,0,0,0,0,84,101,115,116,68,101,118,105,99,101,65,116,116,114,105,98,117,116,101,0,0,0,0,0,109,111,100,101,108,61,37,117,32,105,110,116,101,114,110,97,116,105,111,110,97,108,61,37,100,32,107,101,121,112,97,100,61,37,115,10,0,0,0,0,71,101,116,78,101,120,116,68,101,118,105,99,101,0,0,0,71,101,116,77,97,105,110,68,101,118,105,99,101,0,0,0,87,82,37,48,50,117,65,61,37,48,50,88,32,32,82,82,37,48,50,117,65,61,37,48,50,88,32,32,87,82,37,48,50,117,66,61,37,48,50,88,32,32,82,82,37,48,50,117,66,61,37,48,50,88,10,0,71,101,116,68,101,118,105,99,101,76,105,115,116,0,0,0,65,83,82,46,76,0,0,0,71,101,116,67,84,83,101,101,100,0,0,0,0,0,0,0,71,101,116,77,97,120,68,101,118,105,99,101,0,0,0,0,68,105,115,112,111,115,67,67,117,114,115,111,114,0,0,0,70,108,117,115,104,70,105,108,101,0,0,0,0,0,0,0,68,105,115,112,111,115,67,73,99,111,110,0,0,0,0,0,68,105,115,112,111,115,67,84,97,98,108,101,0,0,0,0,67,104,97,114,69,120,116,114,97,0,0,0,0,0,0,0,83,104,105,102,116,76,101,102,116,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,0,0,0,0,0,0,72,105,108,105,116,101,67,111,108,111,114,0,0,0,0,0,75,69,89,66,79,65,82,68,58,0,0,0,0,0,0,0,79,112,67,111,108,111,114,0,80,108,111,116,67,73,99,111,110,0,0,0,0,0,0,0,32,32,73,82,81,61,37,117,10,0,0,0,0,0,0,0,71,101,116,67,73,99,111,110,0,0,0,0,0,0,0,0,65,83,82,46,87,0,0,0,65,108,108,111,99,67,117,114,115,111,114,0,0,0,0,0,83,101,116,67,67,117,114,115,111,114,0,0,0,0,0,0,71,101,116,67,67,117,114,115,111,114,0,0,0,0,0,0,83,101,116,70,80,111,115,0,71,101,116,66,97,99,107,67,111,108,111,114,0,0,0,0,65,0,0,0,0,0,0,0,71,101,116,70,111,114,101,67,111,108,111,114,0,0,0,0,71,101,116,67,84,97,98,108,101,0,0,0,0,0,0,0,92,0,0,0,0,0,0,0,102,105,110,100,32,98,121,116,101,115,32,105,110,32,109,101,109,111,114,121,0,0,0,0,71,101,116,67,80,105,120,101,108,0,0,0,0,0,0,0,105,110,116,108,0,0,0,0,83,101,116,67,80,105,120,101,108,0,0,0,0,0,0,0,82,71,66,66,97,99,107,67,111,108,111,114,0,0,0,0,56,53,51,48,45,83,67,67,0,0,0,0,0,0,0,0,82,71,66,70,111,114,101,67,111,108,111,114,0,0,0,0,82,79,76,46,66,0,0,0,70,105,108,108,67,80,111,108,121,0,0,0,0,0,0,0,70,105,108,108,67,82,103,110,0,0,0,0,0,0,0,0,70,105,108,108,67,65,114,99,0,0,0,0,0,0,0,0,83,101,116,70,105,108,84,121,112,101,0,0,0,0,0,0,70,105,108,108,67,82,111,117,110,100,82,101,99,116,0,0,70,105,108,108,67,79,118,97,108,0,0,0,0,0,0,0,70,105,108,108,67,82,101,99,116,0,0,0,0,0,0,0,66,97,99,107,115,108,97,115,104,0,0,0,0,0,0,0,97,100,100,114,32,99,110,116,32,91,118,97,108,46,46,46,93,0,0,0,0,0,0,0,77,97,107,101,82,71,66,80,97,116,0,0,0,0,0,0,109,111,100,101,108,0,0,0,71,101,116,80,105,120,80,97,116,0,0,0,0,0,0,0,66,97,99,107,80,105,120,80,97,116,0,0,0,0,0,0,32,32,80,65,61,37,48,50,88,32,32,32,80,66,61,37,48,50,88,32,32,67,66,50,61,37,88,32,32,37,99,84,50,86,61,37,48,52,88,10,0,0,0,0,0,0,0,0,80,101,110,80,105,120,80,97,116,0,0,0,0,0,0,0,107,101,121,112,97,100,32,109,111,100,101,58,32,107,101,121,112,97,100,10,0,0,0,0,82,79,88,76,46,66,0,0,67,111,112,121,80,105,120,80,97,116,0,0,0,0,0,0,68,105,115,112,111,115,80,105,120,80,97,116,0,0,0,0,78,101,119,80,105,120,80,97,116,0,0,0,0,0,0,0,83,101,116,67,80,111,114,116,80,105,120,0,0,0,0,0,82,115,116,70,105,108,76,111,99,107,0,0,0,0,0,0,67,111,112,121,80,105,120,77,97,112,0,0,0,0,0,0,68,105,115,112,111,115,80,105,120,77,97,112,0,0,0,0,39,0,0,0,0,0,0,0,101,110,116,101,114,32,98,121,116,101,115,32,105,110,116,111,32,109,101,109,111,114,121,0,78,101,119,80,105,120,77,97,112,0,0,0,0,0,0,0,107,101,121,112,97,100,0,0,73,110,105,116,67,112,111,114,116,0,0,0,0,0,0,0,79,112,101,110,67,112,111,114,116,0,0,0,0,0,0,0,32,79,82,65,61,37,48,50,88,32,32,79,82,66,61,37,48,50,88,32,32,67,66,49,61,37,88,32,32,32,84,50,76,61,37,48,52,88,10,0,68,101,98,117,103,103,101,114,0,0,0,0,0,0,0,0,76,83,76,46,66,0,0,0,80,117,116,83,99,114,97,112,0,0,0,0,0,0,0,0,71,101,116,83,99,114,97,112,0,0,0,0,0,0,0,0,90,101,114,111,83,99,114,97,112,0,0,0,0,0,0,0,76,111,100,101,83,99,114,97,112,0,0,0,0,0,0,0,83,101,116,70,105,108,76,111,99,107,0,0,0,0,0,0,75,105,108,108,73,79,0,0,85,110,108,111,100,101,83,99,114,97,112,0,0,0,0,0,73,110,102,111,83,99,114,97,112,0,0,0,0,0,0,0,65,112,111,115,116,114,111,112,104,101,0,0,0,0,0,0,97,100,100,114,32,91,118,97,108,124,115,116,114,105,110,103,46,46,46,93,0,0,0,0,77,101,116,104,111,100,68,105,115,112,97,116,99,104,0,0,109,111,116,105,111,110,0,0,83,101,116,82,101,115,70,105,108,101,65,116,116,114,115,0,71,101,116,82,101,115,70,105,108,101,65,116,116,114,115,0,32,73,82,65,61,37,48,50,88,32,32,73,82,66,61,37,48,50,88,32,32,67,65,50,61,37,88,32,32,37,99,84,49,86,61,37,48,52,88,10,0,0,0,0,0,0,0,0,71,101,116,65,112,112,80,97,114,109,115,0,0,0,0,0,115,111,110,121,58,32,115,116,97,116,117,115,58,32,117,110,107,110,111,119,110,32,40,99,115,61,48,120,37,48,52,120,41,10,0,0,0,0,0,0,65,83,76,46,66,0,0,0,69,120,105,116,84,111,83,104,101,108,108,0,0,0,0,0,67,104,97,105,110,0,0,0,76,97,117,110,99,104,0,0,85,110,108,111,97,100,83,101,103,0,0,0,0,0,0,0,82,101,115,114,118,77,101,109,0,0,0,0,0,0,0,0,76,111,97,100,83,101,103,0,115,99,115,105,58,32,119,114,105,116,101,32,115,105,122,101,32,109,105,115,109,97,116,99,104,32,40,37,117,32,47,32,37,117,41,10,0,0,0,0,80,116,114,65,110,100,72,97,110,100,0,0,0,0,0,0,81,117,111,116,101,0,0,0,100,117,109,112,32,109,101,109,111,114,121,0,0,0,0,0,80,97,99,107,55,0,0,0,107,101,121,98,111,97,114,100,32,107,101,121,112,97,100,95,109,111,100,101,61,37,115,10,0,0,0,0,0,0,0,0,80,97,99,107,54,0,0,0,80,97,99,107,53,0,0,0,68,68,82,65,61,37,48,50,88,32,68,68,82,66,61,37,48,50,88,32,32,67,65,49,61,37,88,32,32,32,84,49,76,61,37,48,52,88,32,83,72,70,84,61,37,48,50,88,47,37,117,10,0,0,0,0,69,108,101,109,115,54,56,75,0,0,0,0,0,0,0,0,80,97,99,107,52,0,0,0,68,87,0,0,0,0,0,0,70,80,54,56,75,0,0,0,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,0,80,97,99,107,51,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,80,97,99,107,50,0,0,0,73,110,105,116,85,116,105,108,0,0,0,0,0,0,0,0,80,97,99,107,49,0,0,0,70,54,0,0,0,0,0,0,80,97,99,107,48,0,0,0,94,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,91,97,100,100,114,32,91,99,110,116,93,93,0,0,0,0,73,110,105,116,65,108,108,80,97,99,107,115,0,0,0,0,60,110,108,62,0,0,0,0,109,111,117,115,101,10,0,0,73,110,105,116,80,97,99,107,0,0,0,0,0,0,0,0,100,0,0,0,0,0,0,0,72,97,110,100,65,110,100,72,97,110,100,0,0,0,0,0,32,80,67,82,61,37,48,50,88,32,32,65,67,82,61,37,48,50,88,32,32,73,70,82,61,37,48,50,88,32,32,73,69,82,61,37,48,50,88,32,32,73,82,81,61,37,117,10,0,0,0,0,0,0,0,0,105,104,101,120,0,0,0,0,109,105,110,95,119,0,0,0,115,105,122,101,0,0,0,0,37,115,58,32,101,114,114,111,114,32,112,97,114,115,105,110,103,32,105,110,105,32,115,116,114,105,110,103,32,40,37,115,41,10,0,0,0,0,0,0,80,116,114,84,111,72,97,110,100,0,0,0,0,0,0,0,97,117,116,111,0,0,0,0,32,32,45,37,99,0,0,0,115,116,114,105,110,103,32,116,111,111,32,108,111,110,103,0,101,120,112,101,99,116,105,110,103,32,97,100,100,114,101,115,115,0,0,0,0,0,0,0,80,116,114,84,111,88,72,97,110,100,0,0,0,0,0,0,82,79,76,46,76,0,0,0,116,100,48,58,32,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,40,37,117,47,37,117,47,37,117,32,37,117,41,10,0,72,97,110,100,84,111,72,97,110,100,0,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,100,97,116,97,41,10,0,0,77,117,110,103,101,114,0,0,99,112,50,58,32,110,111,116,32,97,32,67,80,50,32,102,105,108,101,10,0,0,0,0,46,109,115,97,0,0,0,0,84,69,83,101,116,74,117,115,116,0,0,0,0,0,0,0,68,114,118,114,82,101,109,111,118,101,0,0,0,0,0,0,121,100,105,118,0,0,0,0,84,69,73,110,115,101,114,116,0,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,84,69,83,99,114,111,108,108,0,0,0,0,0,0,0,0,83,101,109,105,99,111,108,111,110,0,0,0,0,0,0,0,115,101,116,32,97,110,32,101,120,112,114,101,115,115,105,111,110,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,84,69,75,101,121,0,0,0,42,42,42,32,99,97,110,39,116,32,99,114,101,97,116,101,32,97,100,98,10,0,0,0,84,69,80,97,115,116,101,0,84,69,73,100,108,101,0,0,54,53,50,50,45,86,73,65,0,0,0,0,0,0,0,0,84,69,68,101,97,99,116,105,118,97,116,101,0,0,0,0,84,69,65,99,116,105,118,97,116,101,0,0,0,0,0,0,82,79,88,76,46,76,0,0,84,69,68,101,108,101,116,101,0,0,0,0,0,0,0,0,84,69,67,117,116,0,0,0,84,69,67,111,112,121,0,0,68,114,118,114,73,110,115,116,97,108,108,0,0,0,0,0,84,69,67,108,105,99,107,0,84,69,85,112,100,97,116,101,0,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,101,120,112,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,84,69,78,101,119,0,0,0,101,110,97,98,108,101,100,10,0,0,0,0,0,0,0,0,84,69,83,101,116,83,101,108,101,99,116,0,0,0,0,0,84,69,67,97,108,84,101,120,116,0,0,0,0,0,0,0,101,120,99,101,112,116,105,111,110,32,37,48,50,88,32,40,37,115,41,10,0,0,0,0,103,101,0,0,0,0,0,0,99,99,114,0,0,0,0,0,84,69,83,101,116,84,101,120,116,0,0,0,0,0,0,0,84,101,120,116,66,111,120,0,76,83,76,46,76,0,0,0,84,69,68,105,115,112,111,115,101,0,0,0,0,0,0,0,84,69,73,110,105,116,0,0,54,56,48,50,48,0,0,0,84,69,71,101,116,84,101,120,116,0,0,0,0,0,0,0,67,109,112,83,116,114,105,110,103,0,0,0,0,0,0,0,80,117,116,73,99,111,110,0,83,121,115,69,114,114,111,114,0,0,0,0,0,0,0,0,107,0,0,0,0,0,0,0,98,115,120,0,0,0,0,0,83,121,115,66,101,101,112,0,65,68,66,58,0,0,0,0,68,97,116,101,50,83,101,99,0,0,0,0,0,0,0,0,83,101,99,115,50,68,97,116,101,0,0,0,0,0,0,0,101,0,0,0,0,0,0,0,82,115,114,99,77,97,112,69,110,116,114,121,0,0,0,0,79,112,101,110,82,70,80,101,114,109,0,0,0,0,0,0,65,83,76,46,76,0,0,0,75,101,121,84,114,97,110,115,0,0,0,0,0,0,0,0,83,121,115,69,100,105,116,0,85,110,105,113,117,101,73,68,0,0,0,0,0,0,0,0,68,101,108,97,121,0,0,0,71,101,116,78,101,119,77,66,97,114,0,0,0,0,0,0,71,101,116,82,77,101,110,117,0,0,0,0,0,0,0,0,105,119,109,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,100,105,115,107,41,10,0,0,0,0,0,106,0,0,0,0,0,0,0,115,101,116,32,97,110,32,97,100,100,114,101,115,115,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,0,0,0,71,101,116,78,101,119,67,111,110,116,114,111,108,0,0,0,107,101,121,112,97,100,95,109,111,116,105,111,110,0,0,0,71,101,116,78,101,119,87,105,110,100,111,119,0,0,0,0,71,101,116,80,105,99,116,117,114,101,0,0,0,0,0,0,109,105,115,115,105,110,103,32,118,97,108,117,101,10,0,0,71,101,116,73,99,111,110,0,71,101,116,83,116,114,105,110,103,0,0,0,0,0,0,0,65,83,76,46,87,0,0,0,71,101,116,67,117,114,115,111,114,0,0,0,0,0,0,0,71,101,116,80,97,116,116,101,114,110,0,0,0,0,0,0,67,108,111,115,101,68,101,115,107,65,99,99,0,0,0,0,83,101,116,68,97,116,101,84,105,109,101,0,0,0,0,0,37,115,37,117,0,0,0,0,79,112,101,110,68,101,115,107,65,99,99,0,0,0,0,0,83,121,115,116,101,109,77,101,110,117,0,0,0,0,0,0,104,0,0,0,0,0,0,0,97,100,100,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,83,121,115,116,101,109,84,97,115,107,0,0,0,0,0,0,107,101,121,98,111,97,114,100,0,0,0,0,0,0,0,0,83,121,115,116,101,109,67,108,105,99,107,0,0,0,0,0,83,121,115,116,101,109,69,118,101,110,116,0,0,0,0,0,37,48,56,108,88,10,0,0,67,114,101,97,116,101,82,101,115,70,105,108,101,0,0,0,87,114,105,116,101,82,101,115,111,117,114,99,101,0,0,0,76,83,82,46,87,0,0,0,82,101,115,69,114,114,111,114,0,0,0,0,0,0,0,0,82,109,118,101,82,101,102,101,114,101,110,99,101,0,0,0,82,109,118,101,82,101,115,111,117,114,99,101,0,0,0,0,82,101,97,100,68,97,116,101,84,105,109,101,0,0,0,0,65,100,100,82,101,102,101,114,101,110,99,101,0,0,0,0,65,100,100,82,101,115,111,117,114,99,101,0,0,0,0,0,103,0,0,0,0,0,0,0,98,115,0,0,0,0,0,0,67,104,97,110,103,101,100,82,101,115,111,117,114,99,101,0,109,111,117,115,101,0,0,0,83,101,116,82,101,115,73,110,102,111,0,0,0,0,0,0,71,101,116,82,101,115,73,110,102,111,0,0,0,0,0,0,98,97,100,32,114,101,103,105,115,116,101,114,32,40,37,115,41,10,0,0,0,0,0,0,83,101,116,82,101,115,65,116,116,114,115,0,0,0,0,0,71,101,116,82,101,115,65,116,116,114,115,0,0,0,0,0,107,101,121,112,97,100,32,109,111,100,101,58,32,109,111,116,105,111,110,10,0,0,0,0,76,83,76,46,87,0,0,0,83,105,122,101,82,115,114,99,0,0,0,0,0,0,0,0,72,111,109,101,82,101,115,70,105,108,101,0,0,0,0,0,82,101,108,101,97,115,101,82,101,115,111,117,114,99,101,0,87,114,105,116,101,80,97,114,97,109,0,0,0,0,0,0,76,111,97,100,82,101,115,111,117,114,99,101,0,0,0,0,71,101,116,78,97,109,101,100,82,101,115,111,117,114,99,101,0,0,0,0,0,0,0,0,80,114,105,110,116,32,118,101,114,115,105,111,110,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,108,105,115,116,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,0,0,0,0,71,101,116,82,101,115,111,117,114,99,101,0,0,0,0,0,97,100,98,0,0,0,0,0,71,101,116,73,110,100,84,121,112,101,0,0,0,0,0,0,67,111,117,110,116,84,121,112,101,115,0,0,0,0,0,0,109,105,115,115,105,110,103,32,114,101,103,105,115,116,101,114,10,0,0,0,0,0,0,0,71,101,116,73,110,100,82,101,115,111,117,114,99,101,0,0,67,111,117,110,116,82,101,115,111,117,114,99,101,115,0,0,82,79,88,82,46,87,0,0,83,101,116,82,101,115,76,111,97,100,0,0,0,0,0,0,67,108,111,115,101,82,101,115,70,105,108,101,0,0,0,0,85,112,100,97,116,101,82,101,115,70,105,108,101,0,0,0,77,111,114,101,77,97,115,116,101,114,115,0,0,0,0,0,85,115,101,82,101,115,70,105,108,101,0,0,0,0,0,0,83,116,97,116,117,115,0,0,79,112,101,110,82,101,115,70,105,108,101,0,0,0,0,0,118,101,114,115,105,111,110,0,100,0,0,0,0,0,0,0,98,108,0,0,0,0,0,0,82,115,114,99,90,111,110,101,73,110,105,116,0,0,0,0,100,114,105,118,101,61,37,117,32,115,105,122,101,61,37,117,75,32,108,111,99,107,101,100,61,37,100,32,114,111,116,97,116,101,61,37,100,32,100,105,115,107,61,37,117,32,102,105,108,101,61,37,115,10,0,0,73,110,105,116,82,101,115,111,117,114,99,101,115,0,0,0,67,117,114,82,101,115,70,105,108,101,0,0,0,0,0,0,59,32,0,0,0,0,0,0,83,101,116,82,101,115,80,117,114,103,101,0,0,0,0,0,105,110,115,101,114,116,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,0,0,0,68,101,116,97,99,104,82,101,115,111,117,114,99,101,0,0,82,79,88,76,46,87,0,0,77,111,100,97,108,68,105,97,108,111,103,0,0,0,0,0,71,101,116,73,84,101,120,116,0,0,0,0,0,0,0,0,83,101,116,73,84,101,120,116,0,0,0,0,0,0,0,0,79,102,102,108,105,110,101,0,83,101,116,68,73,116,101,109,0,0,0,0,0,0,0,0,115,99,115,105,58,32,119,114,105,116,101,32,98,108,111,99,107,32,99,111,117,110,116,32,37,117,10,0,0,0,0,0,71,101,116,68,73,116,101,109,0,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,100,101,98,117,103,32,91], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+28636);
/* memory initializer */ allocate([110,111,93,0,115,0,0,0,0,0,0,0,99,108,101,97,114,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,114,32,97,108,108,0,0,0,0,0,0,0,69,114,114,111,114,83,111,117,110,100,0,0,0,0,0,0,97,117,116,111,95,114,111,116,97,116,101,0,0,0,0,0,80,97,114,97,109,84,101,120,116,0,0,0,0,0,0,0,70,114,101,101,65,108,101,114,116,0,0,0,0,0,0,0,109,97,99,46,105,110,115,101,114,116,0,0,0,0,0,0,67,111,117,108,100,65,108,101,114,116,0,0,0,0,0,0,67,97,117,116,105,111,110,65,108,101,114,116,0,0,0,0,82,79,82,46,87,0,0,0,78,111,116,101,65,108,101,114,116,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,101,106,101,99,116,0,0,83,116,111,112,65,108,101,114,116,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,65,108,101,114,116,0,0,0,86,82,101,109,111,118,101,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,70,105,110,100,68,73,116,101,109,0,0,0,0,0,0,0,70,53,0,0,0,0,0,0,68,105,115,112,111,115,68,105,97,108,111,103,0,0,0,0,94,94,0,0,0,0,0,0,118,101,114,98,111,115,101,0,97,0,0,0,0,0,0,0,91,105,110,100,101,120,93,0,67,108,111,115,101,68,105,97,108,111,103,0,0,0,0,0,60,101,111,102,62,0,0,0,105,110,115,101,114,116,101,100,0,0,0,0,0,0,0,0,68,114,97,119,68,105,97,108,111,103,0,0,0,0,0,0,115,97,118,101,0,0,0,0,68,105,97,108,111,103,83,101,108,101,99,116,0,0,0,0,37,45,56,115,32,37,115,44,32,37,115,44,32,37,115,0,97,117,116,111,0,0,0,0,97,115,112,101,99,116,95,121,0,0,0,0,0,0,0,0,115,105,122,101,107,0,0,0,37,115,58,32,98,97,100,32,100,114,105,118,101,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,73,115,68,105,97,108,111,103,69,118,101,110,116,0,0,0,116,121,112,101,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,45,37,99,41,10,0,0,0,0,0,0,105,100,101,110,116,105,102,105,101,114,32,116,111,111,32,108,111,110,103,0,0,0,0,0,120,0,0,0,0,0,0,0,83,101,108,73,84,101,120,116,0,0,0,0,0,0,0,0,82,79,76,46,87,0,0,0,110,111,0,0,0,0,0,0,116,100,48,58,32,122,101,114,111,32,100,97,116,97,32,108,101,110,103,116,104,32,40,37,117,47,37,117,47,37,117,41,10,0,0,0,0,0,0,0,78,101,119,68,105,97,108,111,103,0,0,0,0,0,0,0,37,117,47,37,117,47,37,117,10,0,0,0,0,0,0,0,71,101,116,78,101,119,68,105,97,108,111,103,0,0,0,0,46,105,109,103,0,0,0,0,73,110,105,116,68,105,97,108,111,103,115,0,0,0,0,0,86,73,110,115,116,97,108,108,0,0,0,0,0,0,0,0,46,116,99,0,0,0,0,0,115,101,114,99,111,110,0,0,121,109,117,108,0,0,0,0,70,114,101,101,68,105,97,108,111,103,0,0,0,0,0,0,115,116,100,105,111,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,97,105,108,101,100,10,0,0,0,67,111,117,108,100,68,105,97,108,111,103,0,0,0,0,0,83,101,116,32,116,104,101,32,116,101,114,109,105,110,97,108,32,100,101,118,105,99,101,0,67,97,112,115,76,111,99,107,0,0,0,0,0,0,0,0,98,99,0,0,0,0,0,0,85,112,100,116,68,105,97,108,111,103,0,0,0,0,0,0,108,111,99,107,101,100,0,0,87,97,105,116,77,111,117,115,101,85,112,0,0,0,0,0,71,101,116,75,101,121,115,0,114,117,110,32,119,105,116,104,32,98,114,101,97,107,112,111,105,110,116,115,32,97,116,32,97,100,100,114,0,0,0,0,37,45,56,115,32,37,115,44,32,37,115,0,0,0,0,0,84,105,99,107,67,111,117,110,116,0,0,0,0,0,0,0,66,117,116,116,111,110,0,0,66,70,84,83,84,0,0,0,83,116,105,108,108,68,111,119,110,0,0,0,0,0,0,0,71,101,116,77,111,117,115,101,0,0,0,0,0,0,0,0,69,118,101,110,116,65,118,97,105,108,0,0,0,0,0,0,70,108,117,115,104,69,118,101,110,116,115,0,0,0,0,0,71,101,116,78,101,120,116,69,118,101,110,116,0,0,0,0,69,110,113,117,101,117,101,0,82,101,116,117,114,110,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,68,101,113,117,101,117,101,0,115,105,110,103,108,101,95,115,105,100,101,100,0,0,0,0,68,114,97,119,49,67,111,110,116,114,111,108,0,0,0,0,70,105,110,100,67,111,110,116,114,111,108,0,0,0,0,0,37,45,56,115,32,37,115,0,99,0,0,0,0,0,0,0,115,112,0,0,0,0,0,0,83,101,116,67,116,108,65,99,116,105,111,110,0,0,0,0,71,101,116,67,116,108,65,99,116,105,111,110,0,0,0,0,66,70,69,88,84,85,0,0,68,114,97,119,67,111,110,116,114,111,108,115,0,0,0,0,84,114,97,99,107,67,111,110,116,114,111,108,0,0,0,0,68,114,97,103,67,111,110,116,114,111,108,0,0,0,0,0,54,56,48,49,48,0,0,0,71,101,116,79,83,69,118,101,110,116,0,0,0,0,0,0,84,101,115,116,67,111,110,116,114,111,108,0,0,0,0,0,83,101,116,77,97,120,67,116,108,0,0,0,0,0,0,0,93,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,115,112,101,101,100,0,0,0,0,0,0,0,83,101,116,77,105,110,67,116,108,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,83,101,116,67,116,108,86,97,108,117,101,0,0,0,0,0,71,101,116,77,97,120,67,116,108,0,0,0,0,0,0,0,91,97,100,100,114,46,46,93,0,0,0,0,0,0,0,0,71,101,116,77,105,110,67,116,108,0,0,0,0,0,0,0,71,101,116,67,116,108,86,97,108,117,101,0,0,0,0,0,66,70,67,72,71,0,0,0,83,101,116,67,84,105,116,108,101,0,0,0,0,0,0,0,71,101,116,67,84,105,116,108,101,0,0,0,0,0,0,0,72,105,108,105,116,101,67,111,110,116,114,111,108,0,0,0,79,83,69,118,101,110,116,65,118,97,105,108,0,0,0,0,83,105,122,101,67,111,110,116,114,111,108,0,0,0,0,0,83,101,116,67,82,101,102,67,111,110,0,0,0,0,0,0,71,101,116,67,82,101,102,67,111,110,0,0,0,0,0,0,82,105,103,104,116,66,114,97,99,107,101,116,0,0,0,0,105,110,116,0,0,0,0,0,105,119,109,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,112,114,105,41,10,0,0,0,0,0,0,77,111,118,101,67,111,110,116,114,111,108,0,0,0,0,0,72,105,100,101,67,111,110,116,114,111,108,0,0,0,0,0,100,105,115,107,0,0,0,0,83,104,111,119,67,111,110,116,114,111,108,0,0,0,0,0,75,105,108,108,67,111,110,116,114,111,108,115,0,0,0,0,66,70,69,88,84,83,0,0,68,105,115,112,111,115,67,111,110,116,114,111,108,0,0,0,78,101,119,67,111,110,116,114,111,108,0,0,0,0,0,0,85,112,100,116,67,111,110,116,114,111,108,0,0,0,0,0,80,111,115,116,69,118,101,110,116,0,0,0,0,0,0,0,65,37,117,0,0,0,0,0,68,101,108,77,101,110,117,73,116,101,109,0,0,0,0,0,73,110,115,101,114,116,82,101,115,77,101,110,117,0,0,0,91,0,0,0,0,0,0,0,115,112,101,101,100,0,0,0,67,111,117,110,116,77,73,116,101,109,115,0,0,0,0,0,98,108,111,99,107,95,99,111,117,110,116,0,0,0,0,0,68,101,108,116,97,80,111,105,110,116,0,0,0,0,0,0,80,105,110,82,101,99,116,0,97,100,100,114,61,48,120,37,48,54,108,120,10,0,0,0,65,100,100,82,101,115,77,101,110,117,0,0,0,0,0,0,70,108,97,115,104,77,101,110,117,66,97,114,0,0,0,0,66,70,67,76,82,0,0,0,80,108,111,116,73,99,111,110,0,0,0,0,0,0,0,0,83,101,116,77,70,108,97,115,104,0,0,0,0,0,0,0,71,101,116,77,72,97,110,100,108,101,0,0,0,0,0,0,66,108,111,99,107,77,111,118,101,0,0,0,0,0,0,0,67,97,108,99,77,101,110,117,83,105,122,101,0,0,0,0,83,101,116,73,116,101,109,0,76,101,102,116,66,114,97,99,107,101,116,0,0,0,0,0,78,101,118,101,114,32,115,116,111,112,32,114,117,110,110,105,110,103,32,91,110,111,93,0,71,101,116,73,116,101,109,0,98,108,111,99,107,95,115,116,97,114,116,0,0,0,0,0,67,104,101,99,107,73,116,101,109,0,0,0,0,0,0,0,83,101,116,73,116,109,77,97,114,107,0,0,0,0,0,0,73,87,77,58,0,0,0,0,71,101,116,73,116,109,77,97,114,107,0,0,0,0,0,0,83,101,116,73,116,109,83,116,121,108,101,0,0,0,0,0,66,70,83,69,84,0,0,0,71,101,116,73,116,109,83,116,121,108,101,0,0,0,0,0,52,0,0,0,0,0,0,0,83,101,116,73,116,109,73,99,111,110,0,0,0,0,0,0,71,101,116,73,116,109,73,99,111,110,0,0,0,0,0,0,83,101,116,65,112,112,108,76,105,109,105,116,0,0,0,0,77,101,110,117,75,101,121,0,77,101,110,117,83,101,108,101,99,116,0,0,0,0,0,0,112,0,0,0,0,0,0,0,110,111,45,109,111,110,105,116,111,114,0,0,0,0,0,0,83,101,116,77,101,110,117,66,97,114,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,118,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,10,0,0,0,0,0,0,105,119,109,0,0,0,0,0,71,101,116,77,101,110,117,66,97,114,0,0,0,0,0,0,68,105,115,97,98,108,101,73,116,101,109,0,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,69,110,97,98,108,101,73,116,101,109,0,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,104,111,111,107,32,40,37,48,52,88,41,10,0,0,72,105,108,105,116,101,77,101,110,117,0,0,0,0,0,0,36,0,0,0,0,0,0,0,68,114,97,119,77,101,110,117,66,97,114,0,0,0,0,0,68,101,108,101,116,101,77,101,110,117,0,0,0,0,0,0,73,110,115,101,114,116,77,101,110,117,0,0,0,0,0,0,73,110,105,116,65,112,112,108,90,111,110,101,0,0,0,0,67,108,101,97,114,77,101,110,117,66,97,114,0,0,0,0,67,111,110,116,114,111,108,0,117,110,107,110,111,119,110,32,67,80,85,32,109,111,100,101,108,32,40,37,115,41,10,0,65,112,112,101,110,100,77,101,110,117,0,0,0,0,0,0,111,0,0,0,0,0,0,0,83,116,97,114,116,32,114,117,110,110,105,110,103,32,105,109,109,101,100,105,97,116,101,108,121,32,91,110,111,93,0,0,68,105,115,112,111,115,77,101,110,117,0,0,0,0,0,0,118,105,115,105,98,108,101,95,115,0,0,0,0,0,0,0,105,100,61,37,117,32,100,114,105,118,101,61,37,117,32,118,101,110,100,111,114,61,34,37,115,34,32,112,114,111,100,117,99,116,61,34,37,115,34,10,0,0,0,0,0,0,0,0,78,101,119,77,101,110,117,0,73,110,105,116,77,101,110,117,115,0,0,0,0,0,0,0,32,32,32,32,32,0,0,0,71,101,116,87,105,110,100,111,119,80,105,99,0,0,0,0,115,111,110,121,32,100,114,105,118,101,114,32,97,116,32,48,120,37,48,54,108,120,10,0,83,101,116,87,105,110,100,111,119,80,105,99,0,0,0,0,40,91,37,115,44,32,37,115,44,32,37,115,37,115,93,44,32,37,115,41,0,0,0,0,67,108,111,115,101,87,105,110,100,111,119,0,0,0,0,0,70,105,110,100,87,105,110,100,111,119,0,0,0,0,0,0,71,114,111,119,87,105,110,100,111,119,0,0,0,0,0,0,69,109,112,116,121,72,97,110,100,108,101,0,0,0,0,0,86,97,108,105,100,82,101,99,116,0,0,0,0,0,0,0,79,112,101,110,0,0,0,0,115,99,115,105,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,48,50,88,41,10,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,32,102,111,114,32,100,114,105,118,101,32,37,117,10,0,0,86,97,108,105,100,82,103,110,0,0,0,0,0,0,0,0,73,0,0,0,0,0,0,0,114,117,110,0,0,0,0,0,73,110,118,97,108,82,101,99,116,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,104,0,0,0,0,0,0,0,80,67,69,68,73,83,75,0,73,110,118,97,108,82,103,110,0,0,0,0,0,0,0,0,68,114,97,103,84,104,101,82,103,110,0,0,0,0,0,0,37,48,52,88,32,0,0,0,68,114,97,103,87,105,110,100,111,119,0,0,0,0,0,0,70,114,111,110,116,87,105,110,100,111,119,0,0,0,0,0,40,91,37,115,44,32,37,115,93,44,32,37,115,37,115,44,32,37,115,41,0,0,0,0,69,110,100,85,112,100,97,116,101,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,0,66,101,103,105,110,85,112,100,97,116,101,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,83,101,110,100,66,101,104,105,110,100,0,0,0,0,0,0,72,85,110,108,111,99,107,0,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,0,66,114,105,110,103,84,111,70,114,111,110,116,0,0,0,0,70,52,0,0,0,0,0,0,83,101,108,101,99,116,87,105,110,100,111,119,0,0,0,0,99,111,109,109,105,116,0,0,124,0,0,0,0,0,0,0,117,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,101,114,114,111,114,32,91,110,111,93,0,84,114,97,99,107,71,111,65,119,97,121,0,0,0,0,0,118,105,115,105,98,108,101,95,99,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,112,114,111,100,117,99,116,0,83,105,122,101,87,105,110,100,111,119,0,0,0,0,0,0,108,111,97,100,0,0,0,0,72,105,108,105,116,101,87,105,110,100,111,119,0,0,0,0,37,48,56,108,88,32,32,37,115,10,0,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,98,105,110,97,114,121,32,97,100,100,114,61,48,120,37,48,56,108,120,10,0,0,0,0,0,97,115,112,101,99,116,95,120,0,0,0,0,0,0,0,0,115,105,122,101,109,0,0,0,77,111,118,101,87,105,110,100,111,119,0,0,0,0,0,0,100,114,105,118,101,0,0,0,114,111,109,115,47,112,99,101,45,99,111,110,102,105,103,46,99,102,103,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,45,37,99,41,10,0,0,0,0,0,0,0,42,42,42,32,37,115,32,91,37,115,93,10,0,0,0,0,83,101,116,87,84,105,116,108,101,0,0,0,0,0,0,0,98,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,0,0,0,0,0,0,102,97,108,115,101,0,0,0,37,115,37,115,37,48,56,88,0,0,0,0,0,0,0,0,115,100,108,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,110,111,32,100,97,116,97,41,10,0,0,0,0,71,101,116,87,84,105,116,108,101,0,0,0,0,0,0,0,83,101,116,87,82,101,102,67,111,110,0,0,0,0,0,0,32,37,48,50,88,0,0,0,46,105,109,100,0,0,0,0,71,101,116,87,82,101,102,67,111,110,0,0,0,0,0,0,72,76,111,99,107,0,0,0,46,112,114,105,0,0,0,0,45,45,0,0,0,0,0,0,120,100,105,118,0,0,0,0,72,105,100,101,87,105,110,100,111,119,0,0,0,0,0,0,112,116,121,0,0,0,0,0,113,101,100,58,32,117,110,107,110,111,119,110,32,102,101,97,116,117,114,101,115,32,40,48,120,37,48,56,108,108,120,41,10,0,0,0,0,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,100,99,32,105,109,97,103,101,10,0,0,0,0,0,0,0,0,83,104,111,119,87,105,110,100,111,119,0,0,0,0,0,0,99,111,109,109,105,116,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,121,0,0,0,0,0,0,0,113,117,105,101,116,0,0,0,68,105,115,112,111,115,87,105,110,100,111,119,0,0,0,0,100,105,115,107,0,0,0,0,80,67,69,0,0,0,0,0,78,101,119,87,105,110,100,111,119,0,0,0,0,0,0,0,73,110,105,116,87,105,110,100,111,119,115,0,0,0,0,0,45,0,0,0,0,0,0,0,67,104,101,99,107,85,112,100,97,116,101,0,0,0,0,0,71,101,116,87,77,103,114,80,111,114,116,0,0,0,0,0,42,37,117,0,0,0,0,0,68,114,97,119,78,101,119,0,83,97,118,101,79,108,100,0,80,97,105,110,116,66,101,104,105,110,100,0,0,0,0,0,82,101,99,111,118,101,114,72,97,110,100,108,101,0,0,0,80,97,105,110,116,79,110,101,0,0,0,0,0,0,0,0,67,108,105,112,65,98,111,118,101,0,0,0,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,109,111,100,101,108,0,0,0,0,0,0,0,67,97,108,99,86,66,101,104,105,110,100,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,32,40,99,111,119,41,10,0,0,118,101,110,100,111,114,0,0,67,97,108,99,86,105,115,0,83,104,111,119,72,105,100,101,0,0,0,0,0,0,0,0,37,48,56,108,88,58,32,117,110,100,101,102,105,110,101,100,32,111,112,101,114,97,116,105,111,110,58,32,37,48,52,108,88,32,91,37,48,52,88,32,37,48,52,88,32,37,48,52,88,32,37,48,52,88,32,37,48,52,88,93,10,0,0,0,97,100,98,45,107,98,100,58,32,116,97,108,107,32,50,10,0,0,0,0,0,0,0,0,115,114,0,0,0,0,0,0,83,101,116,83,116,114,105,110,103,0,0,0,0,0,0,0,78,101,119,83,116,114,105,110,103,0,0,0,0,0,0,0,37,115,37,117,37,115,0,0,68,114,97,103,71,114,97,121,82,103,110,0,0,0,0,0,68,114,97,119,71,114,111,119,73,99,111,110,0,0,0,0,83,101,116,70,111,110,116,76,111,99,107,0,0,0,0,0,82,101,97,108,108,111,99,72,97,110,100,108,101,0,0,0,82,101,97,108,70,111,110,116,0,0,0,0,0,0,0,0,54,56,48,48,48,0,0,0,70,77,83,119,97,112,70,111,110,116,0,0,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,102,97,105,108,101,100,32,102,111,114,32,97,116,32,108,101,97,115,116,32,111,110,101,32,100,105,115,107,10,0,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,0,0,0,71,101,116,70,78,117,109,0,100,114,105,118,101,0,0,0,71,101,116,70,78,97,109,101,0,0,0,0,0,0,0,0,73,110,105,116,70,111,110,116,115,0,0,0,0,0,0,0,37,48,56,108,88,58,32,101,120,99,101,112,116,105,111,110,32,37,48,50,88,32,40,37,115,41,32,73,87,61,37,48,52,88,10,0,0,0,0,0,80,114,71,108,117,101,0,0,77,97,112,80,111,108,121,0,80,67,0,0,0,0,0,0,77,97,112,82,103,110,0,0,77,97,112,82,101,99,116,0,77,97,112,80,116,0,0,0,72,97,110,100,108,101,90,111,110,101,0,0,0,0,0,0,83,99,97,108,101,80,116,0,76,97,121,111,117,116,0,0,99,111,109,109,105,116,105,110,103,32,97,108,108,32,100,114,105,118,101,115,10,0,0,0,101,0,0,0,0,0,0,0,108,111,103,0,0,0,0,0,68,114,97,119,80,105,99,116,117,114,101,0,0,0,0,0,114,119,0,0,0,0,0,0,75,105,108,108,80,105,99,116,117,114,101,0,0,0,0,0,49,0,0,0,0,0,0,0,105,100,0,0,0,0,0,0,105,119,109,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,67,108,111,115,101,80,105,99,116,117,114,101,0,0,0,0,103,98,0,0,0,0,0,0,79,112,101,110,80,105,99,116,117,114,101,0,0,0,0,0,83,79,78,89,58,0,0,0,80,105,99,67,111,109,109,101,110,116,0,0,0,0,0,0,60,69,65,62,40,37,48,50,88,41,0,0,0,0,0,0,83,116,100,67,111,109,109,101,110,116,0,0,0,0,0,0,83,116,100,80,117,116,80,105,99,0,0,0,0,0,0,0,83,99,114,111,108,108,82,101,99,116,0,0,0,0,0,0,71,101,116,72,97,110,100,108,101,83,105,122,101,0,0,0,68,37,117,0,0,0,0,0,83,116,100,71,101,116,80,105,99,0,0,0,0,0,0,0,83,116,100,84,120,77,101,97,115,0,0,0,0,0,0,0,97,108,108,0,0,0,0,0,119,0,0,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,97,102,116,101,114,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,67,111,112,121,66,105,116,115,0,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,100,101,118,105,99,101,0,0,83,116,100,66,105,116,115,0,83,101,116,83,116,100,80,114,111,99,115,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,82,101,99,116,73,110,82,103,110,0,0,0,0,0,0,0,80,116,73,110,82,103,110,0,37,115,37,115,37,48,50,88,40,80,67,44,32,37,115,37,117,37,115,42,37,117,41,0,88,111,114,82,103,110,0,0,68,105,102,102,82,103,110,0,115,116,100,105,111,58,102,105,108,101,61,0,0,0,0,0,85,110,105,111,110,82,103,110,0,0,0,0,0,0,0,0,83,101,116,72,97,110,100,108,101,83,105,122,101,0,0,0,83,101,99,116,82,103,110,0,69,113,117,97,108,82,103,110,0,0,0,0,0,0,0,0,101,106,101,99,116,105,110,103,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,113,0,0,0,0,0,0,0,105,110,105,45,97,112,112,101,110,100,0,0,0,0,0,0,69,109,112,116,121,82,103,110,0,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,37,115,32,98,108,111,99,107,115,61,37,108,117,32,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,32,37,115,32,102,105,108,101,61,37,115,10,0,97,100,100,114,61,48,120,37,48,54,108,120,32,115,105,122,101,61,48,120,37,108,120,10,0,0,0,0,0,0,0,0,73,110,115,101,116,82,103,110,0,0,0,0,0,0,0,0,79,102,115,101,116,82,103,110,0,0,0,0,0,0,0,0,98,0,0,0,0,0,0,0,82,101,99,116,82,103,110,0,83,101,116,82,101,99,82,103,110,0,0,0,0,0,0,0,37,115,37,48,56,108,88,40,80,67,41,0,0,0,0,0,83,101,116,69,109,112,116,121,82,103,110,0,0,0,0,0,67,111,112,121,82,103,110,0,51,0,0,0,0,0,0,0,67,108,111,115,101,82,103,110,0,0,0,0,0,0,0,0,68,105,115,112,111,115,72,97,110,100,108,101,0,0,0,0,79,112,101,110,82,103,110,0,68,105,115,112,111,115,82,103,110,0,0,0,0,0,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,110,111,32,115,117,99,104,32,100,105,115,107,32,40,37,108,117,41,10,0,0,0,0,0,0,0,84,97,98,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,98,101,102,111,114,101,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,0,0,0,0,0,0,0,78,101,119,82,103,110,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,83,67,83,73,58,0,0,0,66,105,116,77,97,112,84,111,82,101,103,105,111,110,0,0,70,105,108,108,82,103,110,0,117,110,107,110,111,119,110,32,99,111,109,112,111,110,101,110,116,32,40,37,115,41,10,0,73,110,118,101,114,82,103,110,0,0,0,0,0,0,0,0,69,114,97,115,101,82,103,110,0,0,0,0,0,0,0,0,109,97,114,107,58,32,80,67,61,37,48,54,108,88,10,0,37,115,37,115,37,48,52,88,0,0,0,0,0,0,0,0,80,97,105,110,116,82,103,110,0,0,0,0,0,0,0,0,70,114,97,109,101,82,103,110,0,0,0,0,0,0,0,0,83,116,100,82,103,110,0,0,78,101,119,72,97,110,100,108,101,0,0,0,0,0,0,0,85,110,112,97,99,107,66,105,116,115,0,0,0,0,0,0,87,114,105,116,101,0,0,0,80,97,99,107,66,105,116,115,0,0,0,0,0,0,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,66,97,99,107,115,112,97,99,101,0,0,0,0,0,0,0,105,110,105,45,112,114,101,102,105,120,0,0,0,0,0,0,79,102,102,115,101,116,80,111,108,121,0,0,0,0,0,0,116,101,108,101,100,105,115,107,0,0,0,0,0,0,0,0,115,105,122,101,0,0,0,0,75,105,108,108,80,111,108,121,0,0,0,0,0,0,0,0,67,108,111,115,101,80,103,111,110,0,0,0,0,0,0,0,118,105,97,0,0,0,0,0,79,112,101,110,80,111,108,121,0,0,0,0,0,0,0,0,115,111,110,121,32,100,114,105,118,101,114,32,110,111,116,32,102,111,117,110,100,10,0,0,70,105,108,108,80,111,108,121,0,0,0,0,0,0,0,0,46,87,0,0,0,0,0,0,73,110,118,101,114,116,80,111,108,121,0,0,0,0,0,0,69,114,97,115,101,80,111,108,121,0,0,0,0,0,0,0,80,97,105,110,116,80,111,108,121,0,0,0,0,0,0,0,71,101,116,80,116,114,83,105,122,101,0,0,0,0,0,0,70,114,97,109,101,80,111,108,121,0,0,0,0,0,0,0,115,99,115,105,58,32,115,101,116,32,32,56,58,32,37,48,52,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,83,116,100,80,111,108,121,0,115,101,116,116,105,110,103,32,114,101,97,100,111,110,108,121,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,61,0,0,0,0,0,0,0,65,100,100,32,97,32,100,105,114,101,99,116,111,114,121,32,116,111,32,116,104,101,32,115,101,97,114,99,104,32,112,97,116,104,0,0,0,0,0,0,65,110,103,108,101,70,114,111,109,83,108,111,112,101,0,0,112,115,105,0,0,0,0,0,115,99,115,105,0,0,0,0,80,116,84,111,65,110,103,108,101,0,0,0,0,0,0,0,70,105,108,108,65,114,99,0,115,99,99,0,0,0,0,0,73,110,118,101,114,116,65,114,99,0,0,0,0,0,0,0,69,114,97,115,101,65,114,99,0,0,0,0,0,0,0,0,46,76,0,0,0,0,0,0,80,97,105,110,116,65,114,99,0,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,70,114,97,109,101,65,114,99,0,0,0,0,0,0,0,0,107,101,121,109,97,112,0,0,83,116,100,65,114,99,0,0,83,101,116,80,116,114,83,105,122,101,0,0,0,0,0,0,116,101,114,109,46,101,115,99,97,112,101,0,0,0,0,0,83,108,111,112,101,70,114,111,109,65,110,103,108,101,0,0,70,51,0,0,0,0,0,0,70,105,108,108,79,118,97,108,0,0,0,0,0,0,0,0,115,101,116,116,105,110,103,32,114,101,97,100,47,119,114,105,116,101,32,100,114,105,118,101,32,37,108,117,10,0,0,0,38,38,0,0,0,0,0,0,69,113,117,97,108,0,0,0,112,97,116,104,0,0,0,0,73,110,118,101,114,116,79,118,97,108,0,0,0,0,0,0,112,102,100,99,45,97,117,116,111,0,0,0,0,0,0,0,37,115,58,37,108,117,58,32,37,115,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,100,101,108,97,121,61,37,108,117,10,0,0,0,0,0,69,114,97,115,101,79,118,97,108,0,0,0,0,0,0,0,80,97,105,110,116,79,118,97,108,0,0,0,0,0,0,0,109,101,109,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,115,114,101,99,10,0,0,0,0,101,115,99,97,112,101,0,0,98,97,115,101,0,0,0,0,70,114,97,109,101,79,118,97,108,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,99,111,119,32,102,105,108,101,61,37,115,10,0,0,0,0,0,0,91,37,48,54,108,88,93,32,0,0,0,0,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,37,115,41,10,0,0,0,0,0,0,0,83,116,100,79,118,97,108,0,99,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,37,115,37,115,37,48,50,88,40,65,37,117,44,32,37,115,37,117,37,115,42,37,117,41,0,0,0,0,0,0,0,0,119,97,118,0,0,0,0,0,116,100,48,58,32,116,114,97,99,107,32,99,114,99,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,83,99,114,105,112,116,85,116,105,108,0,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,104,101,97,100,101,114,41,10,0,0,0,0,0,0,0,0,112,115,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,0,100,99,52,50,58,32,119,97,114,110,105,110,103,58,32,116,97,103,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,70,105,108,108,82,111,117,110,100,82,101,99,116,0,0,0,46,105,109,97,0,0,0,0,73,110,118,101,114,82,111,117,110,100,82,101,99,116,0,0,46,112,98,105,116,0,0,0,68,105,115,112,111,115,80,116,114,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,45,0,0,0,0,0,0,0,120,109,117,108,0,0,0,0,69,114,97,115,101,82,111,117,110,100,82,101,99,116,0,0,115,101,114,99,111,110,0,0,99,111,109,109,105,116,0,0,99,111,109,109,105,116,0,0,99,111,109,109,105,116,0,0,80,97,105,110,116,82,111,117,110,100,82,101,99,116,0,0,115,101,116,116,105,110,103,32,105,119,109,32,100,114,105,118,101,32,37,108,117,32,116,111,32,114,101,97,100,45,111,110,108,121,10,0,0,0,0,0,45,0,0,0,0,0,0,0,48,98,0,0,0,0,0,0,83,101,116,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,70,114,97,109,101,82,111,117,110,100,82,101,99,116,0,0,112,102,100,99,0,0,0,0,83,79,78,89,58,0,0,0,83,116,100,82,82,101,99,116,0,0,0,0,0,0,0,0,69,109,112,116,121,82,101,99,116,0,0,0,0,0,0,0,99,112,117,0,0,0,0,0,80,116,73,110,82,101,99,116,0,0,0,0,0,0,0,0,80,116,50,82,101,99,116,0,40,65,37,117,41,0,0,0,85,110,105,111,110,82,101,99,116,0,0,0,0,0,0,0,83,101,99,116,82,101,99,116,0,0,0,0,0,0,0,0,73,110,115,101,116,82,101,99,116,0,0,0,0,0,0,0,78,101,119,80,116,114,0,0,79,102,102,115,101,116,82,101,99,116,0,0,0,0,0,0,114,98,0,0,0,0,0,0,83,101,116,82,101,99,116,0,115,101,116,116,105,110,103,32,97,108,108,32,105,119,109,32,100,114,105,118,101,115,32,116,111,32,114,101,97,100,45,111,110,108,121,10,0,0,0,0,77,105,110,117,115,0,0,0,48,120,0,0,0,0,0,0,115,116,114,105,110,103,0,0,69,113,117,97,108,82,101,99,116,0,0,0,0,0,0,0,105,109,100,0,0,0,0,0,105,110,115,101,114,116,95,100,101,108,97,121,95,37,117,0,70,105,108,108,82,101,99,116,0,0,0,0,0,0,0,0,73,110,118,101,114,82,101,99,116,0,0,0,0,0,0,0,100,105,115,97,115,115,101,109,98,108,101,0,0,0,0,0,97,100,98,45,107,98,100,58,32,116,97,108,107,32,37,117,10,0,0,0,0,0,0,0,108,112,99,0,0,0,0,0,69,114,97,115,101,82,101,99,116,0,0,0,0,0,0,0,80,97,105,110,116,82,101,99,116,0,0,0,0,0,0,0,37,115,37,117,47,37,115,37,117,0,0,0,0,0,0,0,70,114,97,109,101,82,101,99,116,0,0,0,0,0,0,0,83,116,100,82,101,99,116,0,85,110,105,109,112,108,101,109,101,110,116,101,100,0,0,0,77,97,120,77,101,109,0,0,80,101,110,78,111,114,109,97,108,0,0,0,0,0,0,0,80,101,110,80,97,116,0,0,115,101,116,116,105,110,103,32,105,119,109,32,100,114,105,118,101,32,37,108,117,32,116,111,32,114,101,97,100,47,119,114,105,116,101,10,0,0,0,0,48,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,99,111,110,102,105,103,0,0,80,101,110,77,111,100,101,0,105,109,97,103,101,100,105,115,107,0,0,0,0,0,0,0,102,111,114,109,97,116,95,104,100,95,97,115,95,100,100,0,80,101,110,83,105,122,101,0,71,101,116,80,101,110,0,0,91,91,45,93,97,100,100,114,32,91,99,110,116,93,93,0,83,101,116,80,101,110,83,116,97,116,101,0,0,0,0,0,71,101,116,80,101,110,83,116,97,116,101,0,0,0,0,0,107,98,100,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,48,50,88,41,10,0,0,0,0,37,115,37,117,45,37,115,37,117,0,0,0,0,0,0,0,83,104,111,119,80,101,110,0,72,105,100,101,80,101,110,0,83,104,117,116,100,111,119,110,0,0,0,0,0,0,0,0,70,114,101,101,77,101,109,0,77,111,118,101,0,0,0,0,77,111,118,101,84,111,0,0,115,101,116,116,105,110,103,32,97,108,108,32,105,119,109,32,100,114,105,118,101,115,32,116,111,32,114,101,97,100,47,119,114,105,116,101,10,0,0,0,57,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,83,101,116,32,116,104,101,32,100,105,115,107,32,100,101,108,97,121,32,91,51,48,93,0,76,105,110,101,0,0,0,0,100,99,52,50,0,0,0,0,105,110,115,101,114,116,95,100,101,108,97,121,0,0,0,0,76,105,110,101,84,111,0,0,83,116,100,76,105,110,101,0,105,119,109,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,10,0,0,0,117,0,0,0,0,0,0,0,79,83,68,105,115,112,97,116,99,104,0,0,0,0,0,0,83,112,97,99,101,69,120,116,114,97,0,0,0,0,0,0,67,104,97,114,87,105,100,116,104,0,0,0,0,0,0,0,83,116,114,105,110,103,87,105,100,116,104,0,0,0,0,0,71,101,116,70,111,110,116,73,110,102,111,0,0,0,0,0,83,101,116,90,111,110,101,0,35,37,115,37,48,52,88,0,84,101,120,116,83,105,122,101,0,0,0,0,0,0,0,0,84,101,120,116,77,111,100,101,0,0,0,0,0,0,0,0,73,87,77,32,100,114,105,118,101,32,37,117,58,32,108,111,99,107,101,100,61,37,100,10,0,0,0,0,0,0,0,0,56,0,0,0,0,0,0,0,100,101,102,105,110,101,100,0,100,114,105,118,101,32,100,101,108,97,121,0,0,0,0,0,84,101,120,116,70,97,99,101,0,0,0,0,0,0,0,0,99,112,50,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,32,91,49,93,0,0,0,0,115,111,110,121,0,0,0,0,84,101,120,116,70,111,110,116,0,0,0,0,0,0,0,0,79,82,73,46,66,0,0,0,84,101,120,116,87,105,100,116,104,0,0,0,0,0,0,0,99,108,111,99,107,0,0,0,79,82,73,46,87,0,0,0,68,114,97,119,84,101,120,116,0,0,0,0,0,0,0,0,79,82,73,46,76,0,0,0,68,114,97,119,83,116,114,105,110,103,0,0,0,0,0,0,67,77,80,50,46,66,0,0,67,82,40,37,117,41,0,0,68,114,97,119,67,104,97,114,0,0,0,0,0,0,0,0,67,72,75,50,46,66,0,0,83,116,100,84,101,120,116,0,69,113,117,97,108,80,116,0,71,101,116,90,111,110,101,0,83,101,116,80,116,0,0,0,65,78,68,73,46,66,0,0,83,117,98,80,116,0,0,0,65,78,68,73,46,87,0,0,32,9,0,0,0,0,0,0,43,49,0,0,0,0,0,0,55,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,100,105,115,107,45,100,101,108,97,121,0,0,0,0,0,0,65,100,100,80,116,0,0,0,65,78,68,73,46,76,0,0,97,110,97,100,105,115,107,0,42,42,42,32,115,101,116,116,105,110,103,32,115,111,117,110,100,32,100,114,105,118,101,114,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,67,108,111,115,101,67,80,111,114,116,0,0,0,0,0,0,67,77,80,50,46,87,0,0,67,108,111,115,101,80,111,114,116,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,67,72,75,50,46,87,0,0,66,97,99,107,80,97,116,0,83,85,66,73,46,66,0,0,67,108,105,112,82,101,99,116,0,0,0,0,0,0,0,0,83,85,66,73,46,87,0,0,86,66,82,0,0,0,0,0,71,101,116,67,108,105,112,0,83,85,66,73,46,76,0,0,83,101,116,67,108,105,112,0,67,77,80,50,46,76,0,0,83,101,116,79,114,105,103,105,110,0,0,0,0,0,0,0,50,0,0,0,0,0,0,0,67,72,75,50,46,76,0,0,73,110,105,116,90,111,110,101,0,0,0,0,0,0,0,0,77,111,118,101,80,111,114,116,84,111,0,0,0,0,0,0,65,68,68,73,46,66,0,0,80,111,114,116,83,105,122,101,0,0,0,0,0,0,0,0,65,68,68,73,46,87,0,0,58,0,0,0,0,0,0,0,45,49,0,0,0,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,100,105,115,107,32,100,101,108,97,121,32,102,111,114,32,100,114,105,118,101,32,49,32,91,51,48,93,0,0,0,0,0,83,101,116,80,66,105,116,115,0,0,0,0,0,0,0,0,65,68,68,73,46,76,0,0,112,97,114,116,105,116,105,111,110,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,60,110,111,110,101,62,0,0,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,0,71,101,116,80,111,114,116,0,66,84,83,84,0,0,0,0,83,101,116,80,111,114,116,0,112,114,105,110,116,32,115,116,97,116,117,115,32,40,99,112,117,124,109,101,109,124,115,99,99,124,118,105,97,41,0,0,66,67,72,71,0,0,0,0,71,114,97,102,68,101,118,105,99,101,0,0,0,0,0,0,66,67,76,82,0,0,0,0,71,108,111,98,97,108,84,111,76,111,99,97,108,0,0,0,66,83,69,84,0,0,0,0,68,70,67,0,0,0,0,0,76,111,99,97,108,84,111,71,108,111,98,97,108,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,69,79,82,73,46,66,0,0,79,112,101,110,80,111,114,116,0,0,0,0,0,0,0,0,69,79,82,73,46,87,0,0,112,99,101,37,48,52,117,46,112,112,109,0,0,0,0,0,73,110,105,116,71,114,97,102,0,0,0,0,0,0,0,0,69,79,82,73,46,76,0,0,71,101,116,70,80,111,115,0,73,110,105,116,80,111,114,116,0,0,0,0,0,0,0,0,67,77,80,73,46,66,0,0,82,101,97,100,0,0,0,0,70,105,120,82,111,117,110,100,0,0,0,0,0,0,0,0,67,77,80,73,46,87,0,0,49,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,53,0,0,0,0,0,0,0,100,101,108,97,121,0,0,0,76,111,87,111,114,100,0,0,67,77,80,73,46,76,0,0,113,101,100,0,0,0,0,0,32,32,32,0,0,0,0,0,97,100,100,114,61,48,120,37,48,54,108,88,32,108,111,119,112,97,115,115,61,37,108,117,32,100,114,105,118,101,114,61,37,115,10,0,0,0,0,0,72,105,87,111,114,100,0,0,77,79,86,83,46,66,0,0,70,105,120,82,97,116,105,111,0,0,0,0,0,0,0,0,91,119,104,97,116,93,0,0,77,79,86,83,46,87,0,0,70,105,120,77,117,108,0,0,77,79,86,83,46,76,0,0,80,67,69,32,82,79,77,32,101,120,116,101,110,115,105,111,110,32,97,116,32,48,120,37,48,54,108,120,10,0,0,0,76,111,110,103,77,117,108,0,83,70,67,0,0,0,0,0,83,116,117,102,102,72,101,120,0,0,0,0,0,0,0,0,77,79,86,69,46,66,0,0,71,101,116,80,105,120,101,108,0,0,0,0,0,0,0,0,77,79,86,69,46,76,0,0,67,111,108,111,114,66,105,116,0,0,0,0,0,0,0,0,69,106,101,99,116,0,0,0,66,97,99,107,67,111,108,111,114,0,0,0,0,0,0,0,70,111,114,101,67,111,108,111,114,0,0,0,0,0,0,0,78,69,71,88,46,66,0,0,115,99,115,105,58,32,103,101,116,32,32,56,58,32,37,48,52,108,88,32,45,62,32,37,48,50,88,10,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,33,0,0,0,0,0,0,0,100,105,115,107,45,100,101,108,97,121,45,49,0,0,0,0,82,97,110,100,111,109,0,0,78,69,71,88,46,87,0,0,112,99,101,0,0,0,0,0,32,37,48,50,88,0,0,0,83,79,85,78,68,58,0,0,119,97,114,110,105,110,103,58,32,100,101,108,97,121,32,61,61,32,48,32,97,116,32,37,48,56,108,120,10,0,0,0,87,97,105,116], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+38876);
/* memory initializer */ allocate([78,101,120,116,69,118,101,110,116,0,0,0,78,69,71,88,46,76,0,0,69,83,67,0,0,0,0,0,66,105,116,67,108,114,0,0,115,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,114,98,0,0,0,0,0,0,66,105,116,83,101,116,0,0,114,43,98,0,0,0,0,0,66,105,116,84,115,116,0,0,67,76,82,46,66,0,0,0,66,105,116,83,104,105,102,116,0,0,0,0,0,0,0,0,67,76,82,46,87,0,0,0,66,105,116,79,114,0,0,0,67,76,82,46,76,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,63,0,0,0,0,0,0,0,114,101,112,111,114,116,95,107,101,121,115,0,0,0,0,0,66,105,116,78,111,116,0,0,78,69,71,46,66,0,0,0,73,110,105,116,81,117,101,117,101,0,0,0,0,0,0,0,80,54,10,37,117,32,37,117,10,37,117,10,0,0,0,0,66,105,116,88,111,114,0,0,78,69,71,46,87,0,0,0,70,50,0,0,0,0,0,0,66,105,116,65,110,100,0,0,78,69,71,46,76,0,0,0,99,111,109,109,105,116,0,0,109,97,99,46,105,110,115,101,114,116,0,0,0,0,0,0,124,124,0,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,126,0,0,0,0,0,0,0,80,114,105,110,116,32,117,115,97,103,101,32,105,110,102,111,114,109,97,116,105,111,110,0,79,98,115,99,117,114,101,67,117,114,115,111,114,0,0,0,42,42,42,32,110,111,32,116,101,114,109,105,110,97,108,32,102,111,117,110,100,10,0,0,78,79,84,46,66,0,0,0,100,111,115,101,109,117,0,0,60,110,111,110,101,62,0,0,60,45,0,0,0,0,0,0,32,9,0,0,0,0,0,0,100,114,105,118,101,114,0,0,73,78,84,82,0,0,0,0,83,104,105,101,108,100,67,117,114,115,111,114,0,0,0,0,78,79,84,46,87,0,0,0,37,45,57,115,32,0,0,0,70,111,110,116,68,105,115,112,97,116,99,104,0,0,0,0,103,101,116,32,111,114,32,115,101,116,32,97,32,114,101,103,105,115,116,101,114,0,0,0,78,79,84,46,76,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,105,104,101,120,10,0,0,0,0,110,117,108,108,0,0,0,0,97,100,100,114,101,115,115,0,83,104,111,119,67,117,114,115,111,114,0,0,0,0,0,0,77,79,86,69,46,87,0,0,42,42,42,32,99,111,119,32,102,97,105,108,101,100,32,40,100,114,105,118,101,61,37,117,32,102,105,108,101,61,37,115,41,10,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,58,32,115,105,103,110,97,108,32,37,100,10,0,72,105,100,101,67,117,114,115,111,114,0,0,0,0,0,0,115,0,0,0,0,0,0,0,78,66,67,68,46,66,0,0,121,101,115,0,0,0,0,0,37,117,0,0,0,0,0,0,114,0,0,0,0,0,0,0,110,117,108,108,0,0,0,0,116,100,48,58,32,104,101,97,100,101,114,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,83,101,116,67,117,114,115,111,114,0,0,0,0,0,0,0,109,102,109,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,116,114,97,99,107,32,104,101,97,100,101,114,41,10,0,112,115,105,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,112,102,100,99,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,100,99,52,50,58,32,119,97,114,110,105,110,103,58,32,100,97,116,97,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,73,110,105,116,67,117,114,115,111,114,0,0,0,0,0,0,83,87,65,80,0,0,0,0,32,45,0,0,0,0,0,0,112,97,114,115,101,32,101,114,114,111,114,32,98,101,102,111,114,101,0,0,0,0,0,0,46,105,109,97,103,101,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,83,101,116,73,116,101,109,67,109,100,0,0,0,0,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,108,117,41,10,0,0,0,0,0,0,69,88,84,46,87,0,0,0,45,0,0,0,0,0,0,0,83,101,116,86,111,108,0,0,99,104,97,114,45,112,116,121,58,32,37,115,10,0,0,0,119,114,105,116,101,0,0,0,109,115,121,115,0,0,0,0,71,101,116,73,116,101,109,67,109,100,0,0,0,0,0,0,112,111,115,105,120,0,0,0,69,88,84,46,76,0,0,0,119,98,0,0,0,0,0,0,114,43,98,0,0,0,0,0,70,105,120,68,105,118,0,0,69,88,84,66,46,76,0,0,114,0,0,0,0,0,0,0,101,109,117,46,118,105,100,101,111,46,98,114,105,103,104,116,110,101,115,115,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,50,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,104,101,108,112,0,0,0,0,85,115,101,114,68,101,108,97,121,0,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,0,84,83,84,46,66,0,0,0,105,109,97,103,101,0,0,0,116,114,117,101,0,0,0,0,45,62,0,0,0,0,0,0,108,111,119,112,97,115,115,0,84,82,65,80,0,0,0,0,70,114,97,99,68,105,118,0,84,83,84,46,87,0,0,0,70,114,97,99,77,117,108,0,114,101,103,32,91,118,97,108,93,0,0,0,0,0,0,0,84,83,84,46,76,0,0,0,70,114,97,99,83,113,114,116,0,0,0,0,0,0,0,0,70,114,97,99,83,105,110,0,68,37,117,58,68,37,117,0,70,114,97,99,67,111,115,0,77,85,76,85,46,76,0,0,88,50,70,114,97,99,0,0,68,73,86,85,46,76,0,0,70,114,97,99,50,88,0,0,71,101,116,86,111,108,0,0,88,50,70,105,120,0,0,0,70,105,120,50,88,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,117,115,97,103,101,58,32,112,99,101,45,109,97,99,112,108,117,115,32,91,111,112,116,105,111,110,115,93,0,0,0,0,70,114,97,99,50,70,105,120,0,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,110,117,108,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,77,79,86,69,0,0,0,0,114,97,109,0,0,0,0,0,37,115,32,37,48,50,88,0,115,111,117,110,100,0,0,0,65,86,69,67,0,0,0,0,70,105,120,50,70,114,97,99,0,0,0,0,0,0,0,0,85,78,76,75,0,0,0,0,70,105,120,50,76,111,110,103,0,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,97,100,98,45,107,98,100,58,32,108,105,115,116,101,110,32,37,117,10,0,0,0,0,0,76,73,78,75,0,0,0,0,97,0,0,0,0,0,0,0,112,99,0,0,0,0,0,0,76,111,110,103,50,70,105,120,0,0,0,0,0,0,0,0,84,82,65,80,0,0,0,0,84,69,83,116,121,108,101,78,101,119,0,0,0,0,0,0,77,79,86,69,67,0,0,0,114,98,0,0,0,0,0,0,85,83,80,0,0,0,0,0,84,69,68,105,115,112,97,116,99,104,0,0,0,0,0,0,84,69,71,101,116,79,102,102,115,101,116,0,0,0,0,0,84,82,65,80,86,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,84,114,97,99,107,66,111,120,0,0,0,0,0,0,0,0,70,108,117,115,104,86,111,108,0,0,0,0,0,0,0,0,90,111,111,109,87,105,110,100,111,119,0,0,0,0,0,0,114,97,109,0,0,0,0,0,83,101,101,100,70,105,108,108,0,0,0,0,0,0,0,0,101,109,117,46,115,101,114,112,111,114,116,46,102,105,108,101,0,0,0,0,0,0,0,0,67,97,108,99,77,97,115,107,0,0,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,96,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,58,32,77,97,99,105,110,116,111,115,104,32,80,108,117,115,32,101,109,117,108,97,116,111,114,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,115,100,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,0,83,84,79,80,0,0,0,0,114,98,0,0,0,0,0,0,45,45,32,37,115,61,37,100,10,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,70,82,77,84,0,0,0,0,77,101,97,115,117,114,101,84,101,120,116,0,0,0,0,0,71,101,116,77,97,115,107,84,97,98,108,101,0,0,0,0,101,120,101,99,117,116,101,32,116,111,32,110,101,120,116,32,114,116,101,0,0,0,0,0,82,69,83,69,84,0,0,0,70,111,110,116,77,101,116,114,105,99,115,0,0,0,0,0,83,101,116,70,83,99,97,108,101,68,105,115,97,98,108,101,0,0,0,0,0,0,0,0,65,68,68,81,46,66,0,0,99,111,119,0,0,0,0,0,83,82,0,0,0,0,0,0,83,99,114,110,66,105,116,77,97,112,0,0,0,0,0,0,60,110,111,110,101,62,0,0,65,68,68,81,46,87,0,0,37,115,10,10,0,0,0,0,80,97,99,107,49,53,0,0,65,68,68,81,46,76,0,0,80,97,99,107,49,52,0,0,73,87,77,58,32,68,37,117,32,84,114,97,99,107,32,37,117,32,32,32,32,13,0,0,84,82,65,80,76,69,0,0,80,97,99,107,49,51,0,0,83,101,116,69,79,70,0,0,112,99,101,45,109,97,99,112,108,117,115,58,32,115,101,103,109,101,110,116,97,116,105,111,110,32,102,97,117,108,116,10,0,0,0,0,0,0,0,0,84,82,65,80,71,84,0,0,80,97,99,107,49,50,0,0,84,82,65,80,76,84,0,0,101,109,117,46,115,101,114,112,111,114,116,46,100,114,105,118,101,114,0,0,0,0,0,0,56,0,0,0,0,0,0,0,66,97,99,107,113,117,111,116,101,0,0,0,0,0,0,0,37,108,117,0,0,0,0,0,101,108,115,101,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,32,118,101,114,115,105,111,110,32,50,48,49,52,48,50,49,48,45,97,49,51,98,100,51,54,45,109,111,100,10,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,48,55,45,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,80,97,99,107,49,49,0,0,115,100,108,0,0,0,0,0,84,82,65,80,71,69,0,0,102,105,108,101,0,0,0,0,82,73,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,70,88,88,88,0,0,0,0,80,97,99,107,49,48,0,0,84,82,65,80,77,73,0,0,80,97,99,107,57,0,0,0,114,116,101,0,0,0,0,0,84,82,65,80,80,76,0,0,67,111,109,112,111,110,101,110,116,68,105,115,112,97,116,99,104,0,0,0,0,0,0,0,37,52,117,32,32,0,0,0,105,119,109,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,100,105,115,107,41,10,0,0,0,84,82,65,80,86,83,0,0,49,0,0,0,0,0,0,0,76,97,121,101,114,68,105,115,112,97,116,99,104,0,0,0,84,82,65,80,86,67,0,0,119,97,118,0,0,0,0,0,83,104,111,119,68,73,116,101,109,0,0,0,0,0,0,0,84,82,65,80,69,81,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,105,110,105,116,105,97,108,105,122,105,110,103,32,97,117,100,105,111,32,115,117,98,115,121,115,116,101,109,32,40,37,115,41,10,0,0,0,0,0,0,0,72,105,100,101,68,73,116,101,109,0,0,0,0,0,0,0,84,82,65,80,78,69,0,0,119,97,118,102,105,108,116,101,114,0,0,0,0,0,0,0,73,110,115,77,101,110,117,73,116,101,109,0,0,0,0,0,84,82,65,80,67,83,0,0,71,101,116,69,79,70,0,0,66,70,73,78,83,0,0,0,65,108,105,97,115,68,105,115,112,97,116,99,104,0,0,0,84,82,65,80,67,67,0,0,82,101,115,111,117,114,99,101,68,105,115,112,97,116,99,104,0,0,0,0,0,0,0,0,84,82,65,80,76,83,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,112,99,101,0,0,0,0,0,55,0,0,0,0,0,0,0,80,97,117,115,101,0,0,0,45,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,112,99,101,45,109,97,99,112,108,117,115,32,118,101,114,115,105,111,110,32,50,48,49,52,48,50,49,48,45,97,49,51,98,100,51,54,45,109,111,100,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,48,55,45,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,0,77,97,120,83,105,122,101,82,115,114,99,0,0,0,0,0,42,42,42,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,32,39,120,49,49,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,84,82,65,80,72,73,0,0,111,112,116,105,111,110,97,108,0,0,0,0,0,0,0,0,67,68,0,0,0,0,0,0,97,100,100,114,61,48,120,37,48,54,108,88,32,119,61,37,117,32,104,61,37,117,32,98,114,105,103,104,116,61,37,117,37,37,10,0,0,0,0,0,65,88,88,88,0,0,0,0,71,101,116,49,78,97,109,101,100,82,101,115,111,117,114,99,101,0,0,0,0,0,0,0,84,82,65,80,70,0,0,0,71,101,116,49,82,101,115,111,117,114,99,101,0,0,0,0,114,101,115,101,116,0,0,0,84,82,65,80,84,0,0,0,116,99,58,32,117,110,107,110,111,119,110,32,109,97,114,107,32,48,120,37,48,50,120,32,40,37,115,44,32,99,61,37,117,44,32,104,61,37,117,44,32,98,105,116,61,37,108,117,47,37,108,117,41,10,0,0,73,110,118,97,108,77,101,110,117,66,97,114,0,0,0,0,68,66,76,69,0,0,0,0,67,111,117,110,116,49,84,121,112,101,115,0,0,0,0,0,68,66,71,84,0,0,0,0,37,115,37,48,56,108,88,0,72,67,114,101,97,116,101,82,101,115,70,105,108,101,0,0,68,66,76,84,0,0,0,0,72,79,112,101,110,82,101,115,70,105,108,101,0,0,0,0,68,66,71,69,0,0,0,0,112,102,100,99,58,32,99,114,99,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,88,77,117,110,103,101,114,0,68,66,77,73,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,50,32,102,105,108,101,10,0,0,0,0,0,0,0,65,108,108,111,99,97,116,101,0,0,0,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,49,32,102,105,108,101,10,0,0,0,0,0,0,0,70,105,120,65,116,97,110,50,0,0,0,0,0,0,0,0,115,111,110,121,58,32,114,101,97,100,32,101,114,114,111,114,32,97,116,32,37,117,47,37,117,47,37,117,10,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,48,32,102,105,108,101,10,0,0,0,0,0,0,0,68,66,80,76,0,0,0,0,115,99,115,105,58,32,109,111,100,101,32,115,101,110,115,101,58,32,117,110,107,110,111,119,110,32,109,111,100,101,32,112,97,103,101,32,40,37,48,50,88,41,10,0,0,0,0,0,67,111,112,121,77,97,115,107,0,0,0,0,0,0,0,0,68,66,86,83,0,0,0,0,101,109,117,46,114,101,97,108,116,105,109,101,46,116,111,103,103,108,101,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,54,0,0,0,0,0,0,0,83,99,114,76,107,0,0,0,43,0,0,0,0,0,0,0,99,97,110,39,116,32,111,112,101,110,32,105,110,99,108,117,100,101,32,102,105,108,101,58,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,99,111,110,102,105,103,32,102,105,108,101,32,102,97,105,108,101,100,10,0,80,97,99,107,56,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,0,0,0,0,120,49,49,0,0,0,0,0,68,66,86,67,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,68,83,82,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,44,32,115,107,105,112,32,99,97,108,108,115,32,91,49,93,0,0,0,0,0,0,0,0,86,73,68,69,79,58,0,0,84,82,65,67,69,0,0,0,83,67,83,73,68,105,115,112,97,116,99,104,0,0,0,0,68,66,69,81,0,0,0,0,83,101,116,70,114,97,99,116,69,110,97,98,108,101,0,0,91,99,110,116,93,0,0,0,68,66,78,69,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,32,115,101,99,116,111,114,32,100,97,116,97,32,116,111,111,32,98,105,103,32,40,37,117,41,10,0,0,0,0,0,0,0,0,84,69,65,117,116,111,86,105,101,119,0,0,0,0,0,0,68,66,67,83,0,0,0,0,84,69,80,105,110,83,99,114,111,108,108,0,0,0,0,0,68,66,67,67,0,0,0,0,35,37,115,37,88,0,0,0,84,69,83,101,108,86,105,101,119,0,0,0,0,0,0,0,68,66,76,83,0,0,0,0,85,110,105,113,117,101,49,73,68,0,0,0,0,0,0,0,68,66,72,73,0,0,0,0,71,101,116,49,73,120,84,121,112,101,0,0,0,0,0,0,68,66,70,0,0,0,0,0,71,101,116,49,73,120,82,101,115,111,117,114,99,101,0,0,77,111,117,110,116,86,111,108,0,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,115,111,110,121,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,68,66,84,0,0,0,0,0,65,80,80,76,69,32,67,79,77,80,85,84,69,82,44,32,73,78,67,0,0,0,0,0,67,111,117,110,116,49,82,101,115,111,117,114,99,101,115,0,83,76,69,0,0,0,0,0,101,109,117,46,114,101,97,108,116,105,109,101,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,53,0,0,0,0,0,0,0,83,99,114,111,108,108,76,111,99,107,0,0,0,0,0,0,62,62,0,0,0,0,0,0,63,0,0,0,0,0,0,0,102,105,108,101,61,34,37,115,34,10,0,0,0,0,0,0,82,71,101,116,82,101,115,111,117,114,99,101,0,0,0,0,98,97,115,101,0,0,0,0,69,83,67,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,111,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,103,0,0,0,83,71,84,0,0,0,0,0,114,98,0,0,0,0,0,0,82,84,83,0,0,0,0,0,46,97,110,97,0,0,0,0,98,114,105,103,104,116,110,101,115,115,0,0,0,0,0,0,80,82,73,86,0,0,0,0,80,111,112,85,112,77,101,110,117,83,101,108,101,99,116,0,83,76,84,0,0,0,0,0,71,101,116,87,86,97,114,105,97,110,116,0,0,0,0,0,112,0,0,0,0,0,0,0,83,71,69,0,0,0,0,0,71,101,116,67,86,97,114,105,97,110,116,0,0,0,0,0,83,77,73,0,0,0,0,0,73,110,105,116,80,114,111,99,77,101,110,117,0,0,0,0,83,80,76,0,0,0,0,0,35,37,115,37,48,56,108,88,0,0,0,0,0,0,0,0,83,110,100,78,101,119,67,104,97,110,110,101,108,0,0,0,83,86,83,0,0,0,0,0,83,110,100,67,111,110,116,114,111,108,0,0,0,0,0,0,114,98,0,0,0,0,0,0,103,99,114,58,32,100,97,116,97,32,99,114,99,32,101,114,114,111,114,32,40,37,117,47,37,117,47,37,117,41,10,0,49,0,0,0,0,0,0,0,83,86,67,0,0,0,0,0,102,105,108,101,0,0,0,0,69,120,116,114,97,49,54,0,83,110,100,80,108,97,121,0,115,121,109,108,105,110,107,0,83,69,81,0,0,0,0,0,85,110,109,111,117,110,116,86,111,108,0,0,0,0,0,0,69,120,116,114,97,49,53,0,102,105,108,101,0,0,0,0,83,110,100,68,111,73,109,109,101,100,105,97,116,101,0,0,115,111,110,121,58,32,110,111,110,45,97,108,105,103,110,101,100,32,114,101,97,100,10,0,83,78,69,0,0,0,0,0,67,108,111,115,101,0,0,0,115,99,115,105,58,32,115,116,97,114,116,47,115,116,111,112,32,117,110,105,116,32,37,117,32,40,37,115,41,10,0,0,69,120,116,114,97,49,52,0,112,114,111,116,111,99,111,108,0,0,0,0,0,0,0,0,83,110,100,68,111,67,111,109,109,97,110,100,0,0,0,0,83,67,83,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,121,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,80,114,116,83,99,110,0,0,60,60,0,0,0,0,0,0,69,120,116,114,97,49,51,0,105,110,99,108,117,100,101,0,83,110,100,65,100,100,77,111,100,105,102,105,101,114,0,0,97,100,100,114,101,115,115,0,67,79,78,70,73,71,58,0,100,114,105,118,101,114,61,37,115,32,69,83,67,61,37,115,32,97,115,112,101,99,116,61,37,117,47,37,117,32,109,105,110,95,115,105,122,101,61,37,117,42,37,117,32,115,99,97,108,101,61,37,117,32,109,111,117,115,101,61,91,37,117,47,37,117,32,37,117,47,37,117,93,10,0,0,0,0,0,0,82,79,77,58,0,0,0,0,115,105,122,101,109,0,0,0,83,67,67,0,0,0,0,0,46,120,100,102,0,0,0,0,68,84,82,0,0,0,0,0,69,120,116,114,97,49,50,0,99,111,108,111,114,49,0,0,79,70,76,87,0,0,0,0,83,110,100,68,105,115,112,111,115,101,67,104,97,110,110,101,108,0,0,0,0,0,0,0,83,76,83,0,0,0,0,0,69,120,116,114,97,49,49,0,83,111,117,110,100,68,105,115,112,97,116,99,104,0,0,0,115,101,116,32,104,97,108,116,32,115,116,97,116,101,32,91,50,93,0,0,0,0,0,0,83,72,73,0,0,0,0,0,69,120,116,114,97,49,48,0,109,111,117,115,101,0,0,0,72,87,80,114,105,118,0,0,83,70,0,0,0,0,0,0,114,98,0,0,0,0,0,0,69,120,116,114,97,57,0,0,80,67,69,32,82,79,77,32,101,120,116,101,110,115,105,111,110,32,110,111,116,32,102,111,117,110,100,10,0,0,0,0,69,103,114,101,116,68,105,115,112,97,116,99,104,0,0,0,83,84,0,0,0,0,0,0,114,98,0,0,0,0,0,0,35,37,115,37,48,50,88,0,69,120,116,114,97,56,0,0,114,98,0,0,0,0,0,0,84,114,97,110,115,108,97,116,101,50,52,116,111,51,50,0,83,85,66,81,46,66,0,0,69,120,116,114,97,55,0,0,68,79,83,69,77,85,0,0,83,121,115,69,110,118,105,114,111,110,115,0,0,0,0,0,83,85,66,81,46,87,0,0,69,120,116,114,97,54,0,0,68,101,102,101,114,85,115,101,114,70,110,0,0,0,0,0,83,85,66,81,46,76,0,0,83,101,116,70,105,108,101,73,110,102,111,0,0,0,0,0,69,120,116,114,97,53,0,0,68,101,98,117,103,85,116,105,108,0,0,0,0,0,0,0,115,111,110,121,58,32,119,114,105,116,101,32,101,114,114,111,114,10,0,0,0,0,0,0,66,76,69,0,0,0,0,0,108,111,97,100,32,109,101,100,105,97,0,0,0,0,0,0,69,120,116,114,97,52,0,0,67,111,109,109,84,111,111,108,98,111,120,68,105,115,112,97,116,99,104,0,0,0,0,0,66,71,84,0,0,0,0,0,80,67,69,68,73,83,75,32,32,32,32,32,32,32,32,32,0,0,0,0,0,0,0,0,101,109,117,46,112,97,117,115,101,0,0,0,0,0,0,0,99,111,109,109,105,116,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,120,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,80,114,105,110,116,83,99,114,101,101,110,0,0,0,0,0,62,0,0,0,0,0,0,0,69,120,116,114,97,51,0,0,105,102,0,0,0,0,0,0,121,0,0,0,0,0,0,0,83,108,101,101,112,0,0,0,102,105,108,101,0,0,0,0,84,69,82,77,58,0,0,0,114,111,109,0,0,0,0,0,115,105,122,101,107,0,0,0,66,76,84,0,0,0,0,0,46,116,100,48,0,0,0,0,67,84,83,0,0,0,0,0,69,120,116,114,97,50,0,0,99,111,108,111,114,48,0,0,67,72,75,0,0,0,0,0,73,79,80,77,111,118,101,68,97,116,97,0,0,0,0,0,66,71,69,0,0,0,0,0,114,98,0,0,0,0,0,0,69,120,116,114,97,49,0,0,73,79,80,77,115,103,82,101,113,117,101,115,116,0,0,0,91,118,97,108,93,0,0,0,66,77,73,0,0,0,0,0,82,105,103,104,116,0,0,0,73,79,80,73,110,102,111,65,99,99,101,115,115,0,0,0,66,80,76,0,0,0,0,0,68,111,119,110,0,0,0,0,80,77,103,114,79,112,0,0,66,86,83,0,0,0,0,0,76,101,102,116,0,0,0,0,71,101,116,79,83,68,101,102,97,117,108,116,0,0,0,0,66,86,67,0,0,0,0,0,85,112,0,0,0,0,0,0,83,101,116,79,83,68,101,102,97,117,108,116,0,0,0,0,66,69,81,0,0,0,0,0,101,109,117,46,99,112,117,46,109,111,100,101,108,0,0,0,80,97,103,101,68,111,119,110,0,0,0,0,0,0,0,0,66,76,75,32,37,48,52,88,58,32,65,49,61,37,48,56,108,88,32,65,50,61,37,48,56,108,88,32,83,61,37,48,56,108,88,32,82,79,61,37,100,10,0,0,0,0,0,0,98,111,114,100,101,114,0,0,68,84,73,110,115,116,97,108,108,0,0,0,0,0,0,0,66,78,69,0,0,0,0,0,119,98,0,0,0,0,0,0,71,101,116,70,105,108,101,73,110,102,111,0,0,0,0,0,69,110,100,0,0,0,0,0,83,101,116,86,105,100,101,111,68,101,102,97,117,108,116,0,115,111,110,121,58,32,110,111,110,45,97,108,105,103,110,101,100,32,119,114,105,116,101,10,0,0,0,0,0,0,0,0,66,67,83,0,0,0,0,0,101,106,101,99,116,32,109,101,100,105,97,0,0,0,0,0,68,101,108,101,116,101,0,0,70,49,0,0,0,0,0,0,71,101,116,86,105,100,101,111,68,101,102,97,117,108,116,0,114,43,98,0,0,0,0,0,119,43,98,0,0,0,0,0,66,67,67,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,58,0,0,0,0,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,50,0,0,0,0,0,0,0,70,49,50,0,0,0,0,0,60,0,0,0,0,0,0,0,80,97,103,101,85,112,0,0,61,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,73,110,116,101,114,110,97,108,87,97,105,116,0,0,0,0,102,111,114,109,97,116,0,0,109,97,99,112,108,117,115,0,109,111,117,115,101,95,100,105,118,95,121,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,97,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,0,0,0,0,66,76,83,0,0,0,0,0,65,32,32,37,48,56,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,82,101,108,101,97,115,101,32,54,46,48,10,36,48,0,0,114,98,0,0,0,0,0,0,46,116,99,0,0,0,0,0,45,45,32,37,108,117,32,37,117,37,115,37,117,10,0,0,112,97,116,104,0,0,0,0,72,111,109,101,0,0,0,0,102,97,108,115,101,0,0,0,104,97,108,116,0,0,0,0,104,101,105,103,104,116,0,0,68,73,86,90,0,0,0,0,83,101,116,68,101,102,97,117,108,116,83,116,97,114,116,117,112,0,0,0,0,0,0,0,66,72,73,0,0,0,0,0,73,110,115,101,114,116,0,0,71,101,116,68,101,102,97,117,108,116,83,116,97,114,116,117,112,0,0,0,0,0,0,0,60,110,111,110,101,62,0,0,66,83,82,0,0,0,0,0,76,111,97,100,58,0,0,0,100,114,105,118,101,114,0,0,102,105,108,101,0,0,0,0,75,80,95,80,101,114,105,111,100,0,0,0,0,0,0,0,65,68,66,79,112,0,0,0,66,82,65,0,0,0,0,0,68,73,83,75,58,0,0,0,99,112,117,0,0,0,0,0,75,80,95,48,0,0,0,0,65,68,66,82,101,73,110,105,116,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,46,83,0,0,0,0,0,0,116,114,117,101,0,0,0,0,119,98,0,0,0,0,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,111,112,101,110,105,110,103,32,111,117,116,112,117,116,32,40,37,115,41,10,0,0,0,0,0,108,111,119,112,97,115,115,0,45,0,0,0,0,0,0,0,75,80,95,69,110,116,101,114,0,0,0,0,0,0,0,0,116,100,48,58,32,97,100,118,97,110,99,101,100,32,99,111,109,112,114,101,115,115,105,111,110,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,83,101,116,65,68,66,73,110,102,111,0,0,0,0,0,0,102,109,0,0,0,0,0,0,77,79,86,69,81,0,0,0,115,116,120,58,32,98,97,100,32,109,97,103,105,99,10,0,112,115,105,58,32,99,114,99,32,101,114,114,111,114,10,0,112,102,100,99,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,0,0,0,0,0,0,0,75,80,95,51,0,0,0,0,73,77,68,32,49,46,49,55,58,32,37,50,100,47,37,50,100,47,37,52,100,32,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,6,78,111,110,97,109,101,0,71,101,116,65,68,66,73,110,102,111,0,0,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,0,0,68,73,86,85,46,87,0,0,75,80,95,50,0,0,0,0,46,99,112,50,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,71,101,116,73,110,100,65,68,66,0,0,0,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,79,82,46,66,0,0,0,0,119,98,0,0,0,0,0,0,102,108,117,115,104,0,0,0,42,42,42,32,101,114,114,111,114,32,99,114,101,97,116,105,110,103,32,115,121,109,108,105,110,107,32,37,115,32,45,62,32,37,115,10,0,0,0,0,82,101,110,97,109,101,0,0,114,101,97,100,0,0,0,0,109,105,99,114,111,115,111,102,116,0,0,0,0,0,0,0,75,80,95,49,0,0,0,0,67,111,117,110,116,65,68,66,115,0,0,0,0,0,0,0,110,117,108,108,0,0,0,0,115,111,110,121,58,32,112,114,105,109,101,58,32,117,110,107,110,111,119,110,32,40,116,114,97,112,61,48,120,37,48,52,120,41,10,0,0,0,0,0,114,43,98,0,0,0,0,0,83,66,67,68,46,66,0,0,114,43,98,0,0,0,0,0,114,43,98,0,0,0,0,0,114,98,0,0,0,0,0,0,115,116,97,114,116,32,109,111,116,111,114,0,0,0,0,0,75,80,95,54,0,0,0,0,114,43,98,0,0,0,0,0,83,73,110,116,82,101,109,111,118,101,0,0,0,0,0,0,79,82,46,87,0,0,0,0,101,109,117,46,105,119,109,46,115,116,97,116,117,115,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,70,49,49,0,0,0,0,0,62,61,0,0,0,0,0,0,75,80,95,53,0,0,0,0,63,61,0,0,0,0,0,0,113,0,0,0,0,0,0,0,83,73,110,116,73,110,115,116,97,108,108,0,0,0,0,0,108,111,97,100,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,121,0,0,0,0,0,42,42,42,32,109,101,109,111,114,121,32,98,108,111,99,107,32,99,114,101,97,116,105,111,110,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,98,108,111,99,107,115,0,0,79,82,46,76,0,0,0,0,83,32,32,37,48,52,88,58,37,48,52,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,0,0,0,116,100,48,58,32,99,111,109,109,101,110,116,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,82,101,108,101,97,115,101,32,53,46,48,49,36,48,0,0,46,115,116,120,0,0,0,0,63,0,0,0,0,0,0,0,75,80,95,52,0,0,0,0,119,105,100,116,104,0,0,0,73,76,76,71,0,0,0,0,68,111,86,66,76,84,97,115,107,0,0,0,0,0,0,0,68,73,86,83,46,87,0,0,65,116,116,97,99,104,86,66,76,0,0,0,0,0,0,0,75,80,95,80,108,117,115,0,42,42,42,32,117,110,107,110,111,119,110,32,109,111,100,101,108,32,40,37,115,41,10,0,114,117,110,0,0,0,0,0,83,85,66,65,46,87,0,0,83,108,111,116,86,82,101,109,111,118,101,0,0,0,0,0,75,80,95,57,0,0,0,0,109,97,99,45,99,108,97,115,115,105,99,0,0,0,0,0,83,85,66,46,66,0,0,0,83,108,111,116,86,73,110,115,116,97,108,108,0,0,0,0,75,80,95,56,0,0,0,0,109,97,99,45,115,101,0,0,83,85,66,88,46,66,0,0,83,108,111,116,77,97,110,97,103,101,114,0,0,0,0,0,37,115,37,115,37,48,52,88,40,65,37,117,41,0,0,0,75,80,95,55,0,0,0,0,109,111,100,101,108,61,37,115,10,0,0,0,0,0,0,0,83,85,66,46,87,0,0,0,73,110,105,116,69,118,101,110,116,115,0,0,0,0,0,0,75,80,95,77,105,110,117,115,0,0,0,0,0,0,0,0,83,89,83,84,69,77,58,0,83,85,66,88,46,87,0,0,73,110,105,116,70,83,0,0,75,80,95,83,116,97,114,0,109,97,99,45,112,108,117,115,0,0,0,0,0,0,0,0,83,85,66,46,76,0,0,0,72,83,101,116,83,116,97,116,101,0,0,0,0,0,0,0,79,112,101,110,82,70,0,0,75,80,95,83,108,97,115,104,0,0,0,0,0,0,0,0,115,121,115,116,101,109,0,0,115,111,110,121,58,32,102,111,114,109,97,116,116,101,100,32,100,105,115,107,32,40,37,108,117,32,98,108,111,99,107,115,41,10,0,0,0,0,0,0,83,85,66,88,46,76,0,0,72,71,101,116,83,116,97,116,101,0,0,0,0,0,0,0,115,116,111,112,32,109,111,116,111,114,0,0,0,0,0,0,78,117,109,76,111,99,107,0,100,105,115,97,98,108,105,110,103,32,109,101,109,111,114,121,32,116,101,115,116,10,0,0,83,85,66,65,46,76,0,0,101,109,117,46,105,119,109,46,114,119,0,0,0,0,0,0,72,67,108,114,82,66,105,116,0,0,0,0,0,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,70,49,48,0,0,0,0,0,60,61,0,0,0,0,0,0,67,116,114,108,82,105,103,104,116,0,0,0,0,0,0,0,125,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,82,65,77,58,0,0,0,0,98,105,110,97,114,121,0,0,109,111,117,115,101,95,100,105,118,95,120,0,0,0,0,0,99,112,117,46,115,112,101,101,100,32,61,32,0,0,0,0,60,110,111,110,101,62,0,0,115,0,0,0,0,0,0,0,32,37,115,0,0,0,0,0,67,77,80,46,66,0,0,0,69,32,32,34,37,115,34,10,0,0,0,0,0,0,0,0,116,100,48,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,82,101,108,101,97,115,101,32,52,46,48,48,36,48,0,0,72,83,101,116,82,66,105,116,0,0,0,0,0,0,0,0,46,115,116,0,0,0,0,0,69,0,0,0,0,0,0,0,77,101,110,117,0,0,0,0,97,100,100,114,101,115,115,0,65,68,68,82,0,0,0,0,109,101,109,116,101,115,116,0,67,77,80,46,87,0,0,0,78,101,119,69,109,112,116,121,72,97,110,100,108,101,0,0,87,105,110,100,111,119,115,82,105,103,104,116,0,0,0,0,42,42,42,32,82,79,77,32,110,111,116,32,102,111,117,110,100,32,97,116,32,52,48,48,48,48,48,10,0,0,0,0,105,103,110,111,114,105,110,103,32,112,99,101,32,107,101,121,58,32,48,120,37,48,52,120,32,40,37,115,41,10,0,0,97,100,98,58,32,117,110,107,110,111,119,110,32,99,109,100,32,40,37,48,50,88,41,10,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+49116);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i64=_memset;

  
   
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
      Module['noExitRuntime'] = true;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from non-main loop sources
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Module['preMainLoop']) {
          Module['preMainLoop']();
        }
  
        try {
          Runtime.dynCall('v', func);
        } catch (e) {
          if (e instanceof ExitStatus) {
            return;
          } else {
            if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
            throw e;
          }
        }
  
        if (Module['postMainLoop']) {
          Module['postMainLoop']();
        }
  
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from the main loop itself
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        Browser.mainLoop.scheduler();
      }
      if (fps && fps > 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, 1000/fps); // doing this each time means that on exception, we stop
        }
      } else {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        }
      }
      Browser.mainLoop.scheduler();
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }

  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
  
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
  
        if (!total) {
          // early out
          return callback(null);
        }
  
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
  
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
  
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
  
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat, node;
  
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
  
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
  
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
  
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
  
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          FS.FSNode.prototype = {};
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
  
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{8:42,9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var surf = _malloc(60);  // SDL_Surface has 15 fields of quantum size
        var buffer = _malloc(width*height*4); // TODO: only allocate when locked the first time
        var pixelFormat = _malloc(44);
        flags |= 1; // SDL_HWSURFACE - this tells SDL_MUSTLOCK that this needs to be locked
  
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var is_SDL_HWPALETTE = flags & 0x00200000;  
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
   
        HEAP32[((surf)>>2)]=flags;        // SDL_Surface.flags
        HEAP32[(((surf)+(4))>>2)]=pixelFormat;// SDL_Surface.format TODO
        HEAP32[(((surf)+(8))>>2)]=width;        // SDL_Surface.w
        HEAP32[(((surf)+(12))>>2)]=height;       // SDL_Surface.h
        HEAP32[(((surf)+(16))>>2)]=width * bpp;      // SDL_Surface.pitch, assuming RGBA or indexed for now,
                                                                                 // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer;     // SDL_Surface.pixels
        HEAP32[(((surf)+(36))>>2)]=0;     // SDL_Surface.offset
  
        HEAP32[(((surf)+(56))>>2)]=1;
  
        HEAP32[((pixelFormat)>>2)]=0 /* XXX missing C define SDL_PIXELFORMAT_RGBA8888 */;// SDL_PIXELFORMAT_RGBA8888
        HEAP32[(((pixelFormat)+(4))>>2)]=0;// TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8;
        HEAP8[(((pixelFormat)+(9))|0)]=bpp;
  
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff;
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00;
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000;
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000;
  
        // Decide if we want to use WebGL or not
        var useWebGL = (flags & 0x04000000) != 0; // SDL_OPENGL
        SDL.GL = SDL.GL || useWebGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
  
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0)
        };
        
        var ctx = Browser.createContext(canvas, useWebGL, usePageCanvas, webGLContextAttributes);
              
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
  
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
  
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
  
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
  
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
  
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
  
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
      },touchX:0,touchY:0,savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            var event = {
              type: 'mousedown',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 1;
            SDL.events.push(event);
            break;
          case 'touchmove':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            event = {
              type: 'mousemove',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.events.push(event);
            break;
          case 'touchend':
            event.preventDefault();
            event = {
              type: 'mouseup',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(event);
            break;
          case 'mousemove':
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
  
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = (event.type == 'DOMMouseScroll' ? event.detail : -event.wheelDelta) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
  
              SDL.DOMButtons[event.button] = 0;
            }
  
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
  
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
  
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
  
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
  
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
  
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28); // XXX
          return;
        }
  
        SDL.handleEvent(event);
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
  
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0;
            HEAP8[(((ptr)+(9))|0)]=0; // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan;
            HEAP32[(((ptr)+(16))>>2)]=key;
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState;
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key;
  
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(9))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.button;
            HEAP8[(((ptr)+(6))|0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:1,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
  
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button.pressed;
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
  
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_GetVideoInfo() {
      // %struct.SDL_VideoInfo = type { i32, i32, %struct.SDL_PixelFormat*, i32, i32 } - 5 fields of quantum size
      var ret = _malloc(5*Runtime.QUANTUM_SIZE);
      HEAP32[((ret+Runtime.QUANTUM_SIZE*0)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*1)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*2)>>2)]=0;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*3)>>2)]=Module["canvas"].width;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*4)>>2)]=Module["canvas"].height;
      return ret;
    }

  function _SDL_GetMouseState(x, y) {
      if (x) HEAP32[((x)>>2)]=Browser.mouseX;
      if (y) HEAP32[((y)>>2)]=Browser.mouseY;
      return SDL.buttonState;
    }

  function _emscripten_cancel_main_loop() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.shouldPause = true;
    }

  
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision === -1) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

   
  Module["_strcat"] = _strcat;


  var _llvm_memset_p0i8_i32=_memset;

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }

  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }

  
  
  
  
  
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }


  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
  
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
  
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
  
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
  
      // Apply sign.
      ret *= multiplier;
  
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str;
      }
  
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
  
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
  
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)),ret>>>0)|0);
      }
  
      return ret;
    }function _strtoul(str, endptr, base) {
      return __parseInt(str, endptr, base, 0, 4294967295, 32, true);  // ULONG_MAX.
    }

  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }

  function _SDL_Init(initFlags) {
      SDL.startTime = Date.now();
      SDL.initFlags = initFlags;
  
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
  
      if (initFlags & 0x200) {
        // SDL_INIT_JOYSTICK
        // Firefox will not give us Joystick data unless we register this NOP
        // callback.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
        addEventListener("gamepadconnected", function() {});
      }
  
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown'] = 0x300 /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup'] = 0x301 /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress'] = 0x303 /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown'] = 0x401 /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup'] = 0x402 /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove'] = 0x400 /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['unload'] = 0x100 /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize'] = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      // These are not technically DOM events; the HTML gamepad API is poll-based.
      // However, we define them here, as the rest of the SDL code assumes that
      // all SDL events originate as DOM events.
      SDL.DOMEventToSDLEvent['joystick_axis_motion'] = 0x600 /* SDL_JOYAXISMOTION */;
      SDL.DOMEventToSDLEvent['joystick_button_down'] = 0x603 /* SDL_JOYBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['joystick_button_up'] = 0x604 /* SDL_JOYBUTTONUP */;
      return 0; // success
    }

  function _signal(sig, func) {
      // TODO
      return 0;
    }


  
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }

  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }

  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

   
  Module["_memcmp"] = _memcmp;

   
  Module["_strcpy"] = _strcpy;

  
  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }var _fseeko=_fseek;

  
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }var _ftello=_ftell;

  
  function _truncate(path, length) {
      // int truncate(const char *path, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/truncate.html
      // NOTE: The path argument may be a string, to simplify ftruncate().
      if (typeof path !== 'string') path = Pointer_stringify(path);
      try {
        FS.truncate(path, length);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _ftruncate(fildes, length) {
      // int ftruncate(int fildes, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftruncate.html
      try {
        FS.ftruncate(fildes, length);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }

  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }





  
  var ___DEFAULT_POLLMASK=5;function _poll(fds, nfds, timeout) {
      // int poll(struct pollfd fds[], nfds_t nfds, int timeout);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/poll.html
      var nonzero = 0;
      for (var i = 0; i < nfds; i++) {
        var pollfd = fds + 8 * i;
        var fd = HEAP32[((pollfd)>>2)];
        var events = HEAP16[(((pollfd)+(4))>>1)];
        var mask = 32;
        var stream = FS.getStream(fd);
        if (stream) {
          mask = ___DEFAULT_POLLMASK;
          if (stream.stream_ops.poll) {
            mask = stream.stream_ops.poll(stream);
          }
        }
        mask &= events | 8 | 16;
        if (mask) nonzero++;
        HEAP16[(((pollfd)+(6))>>1)]=mask;
      }
      return nonzero;
    }


  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = Pointer_stringify(path);
      try {
        FS.unlink(path);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _posix_openpt() {
  Module['printErr']('missing function: posix_openpt'); abort(-1);
  }

  function _symlink(path1, path2) {
      // int symlink(const char *path1, const char *path2);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/symlink.html
      path1 = Pointer_stringify(path1);
      path2 = Pointer_stringify(path2);
      try {
        FS.symlink(path1, path2);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _tcgetattr(fildes, termios_p) {
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/tcgetattr.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (!stream.tty) {
        ___setErrNo(ERRNO_CODES.ENOTTY);
        return -1;
      }
      return 0;
    }

  function _tcsetattr(fildes, optional_actions, termios_p) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/tcsetattr.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (!stream.tty) {
        ___setErrNo(ERRNO_CODES.ENOTTY);
        return -1;
      }
      return 0;
    }

  function _tcflush() {
  Module['printErr']('missing function: tcflush'); abort(-1);
  }

  function _fcntl(fildes, cmd, varargs, dup2) {
      // int fcntl(int fildes, int cmd, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/fcntl.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      switch (cmd) {
        case 0:
          var arg = HEAP32[((varargs)>>2)];
          if (arg < 0) {
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
          }
          var newStream;
          try {
            newStream = FS.open(stream.path, stream.flags, 0, arg);
          } catch (e) {
            FS.handleFSError(e);
            return -1;
          }
          return newStream.fd;
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4:
          var arg = HEAP32[((varargs)>>2)];
          stream.flags |= arg;
          return 0;
        case 12:
        case 12:
          var arg = HEAP32[((varargs)>>2)];
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        case 13:
        case 14:
        case 13:
        case 14:
          // Pretend that the locking is successful.
          return 0;
        case 8:
        case 9:
          // These are for sockets. We don't have them fully implemented yet.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default:
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
      }
      // Should never be reached. Only to silence strict warnings.
      return -1;
    }

  function _grantpt() {
  Module['printErr']('missing function: grantpt'); abort(-1);
  }

  function _unlockpt() {
  Module['printErr']('missing function: unlockpt'); abort(-1);
  }

  function _ptsname() {
  Module['printErr']('missing function: ptsname'); abort(-1);
  }


  
  
   
  Module["_tolower"] = _tolower; 
  Module["_strncasecmp"] = _strncasecmp; 
  Module["_strcasecmp"] = _strcasecmp;

  
  var ___tm_current=allocate(44, "i8", ALLOC_STATIC);
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);
  
  
  var _tzname=allocate(8, "i32*", ALLOC_STATIC);
  
  var _daylight=allocate(1, "i32*", ALLOC_STATIC);
  
  var _timezone=allocate(1, "i32*", ALLOC_STATIC);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      HEAP32[((_timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60;
  
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((_daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((_tzname)>>2)]=winterNamePtr;
      HEAP32[(((_tzname)+(4))>>2)]=summerNamePtr;
    }function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=start.getTimezoneOffset() * 60;
  
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }


  
  function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = new Date(date); // define date using UTC, start from Jan 01 00:00:00 UTC
      start.setUTCDate(1);
      start.setUTCMonth(0);
      start.setUTCHours(0);
      start.setUTCMinutes(0);
      start.setUTCSeconds(0);
      start.setUTCMilliseconds(0);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  var _tan=Math_tan;

  
  function _SDL_PauseAudio(pauseOn) {
      if (!SDL.audio) {
        return;
      }
      if (pauseOn) {
        if (SDL.audio.timer !== undefined) {
          clearTimeout(SDL.audio.timer);
          SDL.audio.numAudioTimersPending = 0;
          SDL.audio.timer = undefined;
        }
      } else if (!SDL.audio.timer) {
        // Start the audio playback timer callback loop.
        SDL.audio.numAudioTimersPending = 1;
        SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, 1);
        SDL.audio.startTime = Date.now() / 1000.0; // Only used for Mozilla Audio Data API. Not needed for Web Audio API.
      }
      SDL.audio.paused = pauseOn;
    }function _SDL_CloseAudio() {
      if (SDL.audio) {
        try{
          for(var i = 0; i < SDL.audio.soundSource.length; ++i) {
            if (!(typeof(SDL.audio.soundSource[i]==='undefined'))) {
              SDL.audio.soundSource[i].stop(0);
            }
          }
        } catch(e) {}
        SDL.audio.soundSource = null;
        _SDL_PauseAudio(1);
        _free(SDL.audio.buffer);
        SDL.audio = null;
        SDL.allocateChannels(0);
      }
    }

  function _SDL_WasInit() {
      if (SDL.startTime === null) {
        _SDL_Init();
      }
      return 1;
    }

  function _SDL_InitSubSystem(flags) { return 0 }

  function _SDL_GetError() {
      if (!SDL.errorMessage) {
        SDL.errorMessage = allocate(intArrayFromString("unknown SDL-emscripten error"), 'i8', ALLOC_NORMAL);
      }
      return SDL.errorMessage;
    }

  function _SDL_OpenAudio(desired, obtained) {
      try {
        SDL.audio = {
          freq: HEAPU32[((desired)>>2)],
          format: HEAPU16[(((desired)+(4))>>1)],
          channels: HEAPU8[(((desired)+(6))|0)],
          samples: HEAPU16[(((desired)+(8))>>1)], // Samples in the CB buffer per single sound channel.
          callback: HEAPU32[(((desired)+(16))>>2)],
          userdata: HEAPU32[(((desired)+(20))>>2)],
          paused: true,
          timer: null
        };
        // The .silence field tells the constant sample value that corresponds to the safe un-skewed silence value for the wave data.
        if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
          SDL.audio.silence = 128; // Audio ranges in [0, 255], so silence is half-way in between.
        } else if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
          SDL.audio.silence = 0; // Signed data in range [-32768, 32767], silence is 0.
        } else {
          throw 'Invalid SDL audio format ' + SDL.audio.format + '!';
        }
        // Round the desired audio frequency up to the next 'common' frequency value.
        // Web Audio API spec states 'An implementation must support sample-rates in at least the range 22050 to 96000.'
        if (SDL.audio.freq <= 0) {
          throw 'Unsupported sound frequency ' + SDL.audio.freq + '!';
        } else if (SDL.audio.freq <= 22050) {
          SDL.audio.freq = 22050; // Take it safe and clamp everything lower than 22kHz to that.
        } else if (SDL.audio.freq <= 32000) {
          SDL.audio.freq = 32000;
        } else if (SDL.audio.freq <= 44100) {
          SDL.audio.freq = 44100;
        } else if (SDL.audio.freq <= 48000) {
          SDL.audio.freq = 48000;
        } else if (SDL.audio.freq <= 96000) {
          SDL.audio.freq = 96000;
        } else {
          throw 'Unsupported sound frequency ' + SDL.audio.freq + '!';
        }
        if (SDL.audio.channels == 0) {
          SDL.audio.channels = 1; // In SDL both 0 and 1 mean mono.
        } else if (SDL.audio.channels < 0 || SDL.audio.channels > 32) {
          throw 'Unsupported number of audio channels for SDL audio: ' + SDL.audio.channels + '!';
        } else if (SDL.audio.channels != 1 && SDL.audio.channels != 2) { // Unsure what SDL audio spec supports. Web Audio spec supports up to 32 channels.
          console.log('Warning: Using untested number of audio channels ' + SDL.audio.channels);
        }
        if (SDL.audio.samples < 128 || SDL.audio.samples > 524288 /* arbitrary cap */) {
          throw 'Unsupported audio callback buffer size ' + SDL.audio.samples + '!';
        } else if ((SDL.audio.samples & (SDL.audio.samples-1)) != 0) {
          throw 'Audio callback buffer size ' + SDL.audio.samples + ' must be a power-of-two!';
        }
        
        var totalSamples = SDL.audio.samples*SDL.audio.channels;
        SDL.audio.bytesPerSample = (SDL.audio.format == 0x0008 /*AUDIO_U8*/ || SDL.audio.format == 0x8008 /*AUDIO_S8*/) ? 1 : 2;
        SDL.audio.bufferSize = totalSamples*SDL.audio.bytesPerSample;
        SDL.audio.buffer = _malloc(SDL.audio.bufferSize);
        
        // To account for jittering in frametimes, always have multiple audio buffers queued up for the audio output device.
        // This helps that we won't starve that easily if a frame takes long to complete.
        SDL.audio.numSimultaneouslyQueuedBuffers = Module['SDL_numSimultaneouslyQueuedBuffers'] || 3;
        
        // Create a callback function that will be routinely called to ask more audio data from the user application.
        SDL.audio.caller = function SDL_audio_caller() {
          if (!SDL.audio) {
            return;
          }
          Runtime.dynCall('viii', SDL.audio.callback, [SDL.audio.userdata, SDL.audio.buffer, SDL.audio.bufferSize]);
          SDL.audio.pushAudio(SDL.audio.buffer, SDL.audio.bufferSize);
        };
        
        SDL.audio.audioOutput = new Audio();
        // As a workaround use Mozilla Audio Data API on Firefox until it ships with Web Audio and sound quality issues are fixed.
        if (typeof(SDL.audio.audioOutput['mozSetup'])==='function') {
          SDL.audio.audioOutput['mozSetup'](SDL.audio.channels, SDL.audio.freq); // use string attributes on mozOutput for closure compiler
          SDL.audio.mozBuffer = new Float32Array(totalSamples);
          SDL.audio.nextPlayTime = 0;
          SDL.audio.pushAudio = function SDL_audio_pushAudio(ptr, size) {
            --SDL.audio.numAudioTimersPending;
            var mozBuffer = SDL.audio.mozBuffer;
            // The input audio data for SDL audio is either 8-bit or 16-bit interleaved across channels, output for Mozilla Audio Data API
            // needs to be Float32 interleaved, so perform a sample conversion.
            if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
              for (var i = 0; i < totalSamples; i++) {
                mozBuffer[i] = (HEAP16[(((ptr)+(i*2))>>1)]) / 0x8000;
              }
            } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
              for (var i = 0; i < totalSamples; i++) {
                var v = (HEAP8[(((ptr)+(i))|0)]);
                mozBuffer[i] = ((v >= 0) ? v-128 : v+128) /128;
              }
            }
            // Submit the audio data to audio device.
            SDL.audio.audioOutput['mozWriteAudio'](mozBuffer);
            
            // Compute when the next audio callback should be called.
            var curtime = Date.now() / 1000.0 - SDL.audio.startTime;
            var playtime = Math.max(curtime, SDL.audio.nextPlayTime);
            var buffer_duration = SDL.audio.samples / SDL.audio.freq;
            SDL.audio.nextPlayTime = playtime + buffer_duration;
            // Schedule the next audio callback call to occur when the current one finishes.
            SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, 1000.0 * (playtime-curtime));
            ++SDL.audio.numAudioTimersPending;
            // And also schedule extra buffers _now_ if we have too few in queue.
            if (SDL.audio.numAudioTimersPending < SDL.audio.numSimultaneouslyQueuedBuffers) {
              ++SDL.audio.numAudioTimersPending;
              Browser.safeSetTimeout(SDL.audio.caller, 1.0);
            }
          }
        } else {
          // Initialize Web Audio API if we haven't done so yet. Note: Only initialize Web Audio context ever once on the web page,
          // since initializing multiple times fails on Chrome saying 'audio resources have been exhausted'.
          if (!SDL.audioContext) {
            if (typeof(AudioContext) === 'function') {
              SDL.audioContext = new AudioContext();
            } else if (typeof(webkitAudioContext) === 'function') {
              SDL.audioContext = new webkitAudioContext();
            } else {
              throw 'Web Audio API is not available!';
            }
          }
          SDL.audio.soundSource = new Array(); // Use an array of sound sources as a ring buffer to queue blocks of synthesized audio to Web Audio API.
          SDL.audio.nextSoundSource = 0; // Index of the next sound buffer in the ring buffer queue to play.
          SDL.audio.nextPlayTime = 0; // Time in seconds when the next audio block is due to start.
          
          // The pushAudio function with a new audio buffer whenever there is new audio data to schedule to be played back on the device.
          SDL.audio.pushAudio=function(ptr,sizeBytes) {
            try {
              --SDL.audio.numAudioTimersPending;
  
              var sizeSamples = sizeBytes / SDL.audio.bytesPerSample; // How many samples fit in the callback buffer?
              var sizeSamplesPerChannel = sizeSamples / SDL.audio.channels; // How many samples per a single channel fit in the cb buffer?
              if (sizeSamplesPerChannel != SDL.audio.samples) {
                throw 'Received mismatching audio buffer size!';
              }
              // Allocate new sound buffer to be played.
              var source = SDL.audioContext['createBufferSource']();
              if (SDL.audio.soundSource[SDL.audio.nextSoundSource]) {
                SDL.audio.soundSource[SDL.audio.nextSoundSource]['disconnect'](); // Explicitly disconnect old source, since we know it shouldn't be running anymore.
              }
              SDL.audio.soundSource[SDL.audio.nextSoundSource] = source;
              var soundBuffer = SDL.audioContext['createBuffer'](SDL.audio.channels,sizeSamplesPerChannel,SDL.audio.freq);
              SDL.audio.soundSource[SDL.audio.nextSoundSource]['connect'](SDL.audioContext['destination']);
  
              // The input audio data is interleaved across the channels, i.e. [L, R, L, R, L, R, ...] and is either 8-bit or 16-bit as
              // supported by the SDL API. The output audio wave data for Web Audio API must be in planar buffers of [-1,1]-normalized Float32 data,
              // so perform a buffer conversion for the data.
              var numChannels = SDL.audio.channels;
              for(var i = 0; i < numChannels; ++i) {
                var channelData = soundBuffer['getChannelData'](i);
                if (channelData.length != sizeSamplesPerChannel) {
                  throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + sizeSamplesPerChannel + ' samples!';
                }
                if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
                  for(var j = 0; j < sizeSamplesPerChannel; ++j) {
                    channelData[j] = (HEAP16[(((ptr)+((j*numChannels + i)*2))>>1)]) / 0x8000;
                  }
                } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
                  for(var j = 0; j < sizeSamplesPerChannel; ++j) {
                    var v = (HEAP8[(((ptr)+(j*numChannels + i))|0)]);
                    channelData[j] = ((v >= 0) ? v-128 : v+128) /128;
                  }
                }
              }
              // Workaround https://bugzilla.mozilla.org/show_bug.cgi?id=883675 by setting the buffer only after filling. The order is important here!
              source['buffer'] = soundBuffer;
              
              // Schedule the generated sample buffer to be played out at the correct time right after the previously scheduled
              // sample buffer has finished.
              var curtime = SDL.audioContext['currentTime'];
              var playtime = Math.max(curtime, SDL.audio.nextPlayTime);
              SDL.audio.soundSource[SDL.audio.nextSoundSource]['start'](playtime);
              var buffer_duration = sizeSamplesPerChannel / SDL.audio.freq;
              SDL.audio.nextPlayTime = playtime + buffer_duration;
              SDL.audio.nextSoundSource = (SDL.audio.nextSoundSource + 1) % 4;
              var secsUntilNextCall = playtime-curtime;
              
              // Queue the next audio frame push to be performed when the previously queued buffer has finished playing.
              if (SDL.audio.numAudioTimersPending == 0) {
                var preemptBufferFeedMSecs = buffer_duration/2.0;
                SDL.audio.timer = Browser.safeSetTimeout(SDL.audio.caller, Math.max(0.0, 1000.0*secsUntilNextCall-preemptBufferFeedMSecs));
                ++SDL.audio.numAudioTimersPending;
              }
  
              // If we are risking starving, immediately queue extra buffers.
              if (secsUntilNextCall <= buffer_duration && SDL.audio.numAudioTimersPending < SDL.audio.numSimultaneouslyQueuedBuffers) {
                ++SDL.audio.numAudioTimersPending;
                Browser.safeSetTimeout(SDL.audio.caller, 1.0);
              }
            } catch(e) {
              console.log('Web Audio API error playing back audio: ' + e.toString());
            }
          }
        }
  
        if (obtained) {
          // Report back the initialized audio parameters.
          HEAP32[((obtained)>>2)]=SDL.audio.freq;
          HEAP16[(((obtained)+(4))>>1)]=SDL.audio.format;
          HEAP8[(((obtained)+(6))|0)]=SDL.audio.channels;
          HEAP8[(((obtained)+(7))|0)]=SDL.audio.silence;
          HEAP16[(((obtained)+(8))>>1)]=SDL.audio.samples;
          HEAP32[(((obtained)+(16))>>2)]=SDL.audio.callback;
          HEAP32[(((obtained)+(20))>>2)]=SDL.audio.userdata;
        }
        SDL.allocateChannels(32);
  
      } catch(e) {
        console.log('Initializing SDL audio threw an exception: "' + e.toString() + '"! Continuing without audio.');
        SDL.audio = null;
        SDL.allocateChannels(0);
        if (obtained) {
          HEAP32[((obtained)>>2)]=0;
          HEAP16[(((obtained)+(4))>>1)]=0;
          HEAP8[(((obtained)+(6))|0)]=0;
          HEAP8[(((obtained)+(7))|0)]=0;
          HEAP16[(((obtained)+(8))>>1)]=0;
          HEAP32[(((obtained)+(16))>>2)]=0;
          HEAP32[(((obtained)+(20))>>2)]=0;
        }
      }
      if (!SDL.audio) {
        return -1;
      }
      return 0;
    }


  function _SDL_LockAudio() {}

  function _SDL_UnlockAudio() {}

  function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }

  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }

  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }


  function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }

  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }

  
  function _usleep(useconds) {
      // int usleep(useconds_t useconds);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/usleep.html
      // We're single-threaded, so use a busy loop. Super-ugly.
      var msec = useconds / 1000;
      if (ENVIRONMENT_IS_WEB && window['performance'] && window['performance']['now']) {
        var start = window['performance']['now']();
        while (window['performance']['now']() - start < msec) {
          // Do nothing.
        }
      } else {
        var start = Date.now();
        while (Date.now() - start < msec) {
          // Do nothing.
        }
      }
      return 0;
    }function _nanosleep(rqtp, rmtp) {
      // int nanosleep(const struct timespec  *rqtp, struct timespec *rmtp);
      var seconds = HEAP32[((rqtp)>>2)];
      var nanoseconds = HEAP32[(((rqtp)+(4))>>2)];
      if (rmtp !== 0) {
        HEAP32[((rmtp)>>2)]=0;
        HEAP32[(((rmtp)+(4))>>2)]=0;
      }
      return _usleep((seconds * 1e6) + (nanoseconds / 1000));
    }

  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }

  function _SDL_PollEvent(ptr) {
      if (SDL.initFlags & 0x200 && SDL.joystickEventState) {
        // If SDL_INIT_JOYSTICK was supplied AND the joystick system is configured
        // to automatically query for events, query for joystick events.
        SDL.queryJoysticks();
      }
      if (SDL.events.length === 0) return 0;
      if (ptr) {
        SDL.makeCEvent(SDL.events.shift(), ptr);
      }
      return 1;
    }

  function _SDL_ShowCursor(toggle) {
      switch (toggle) {
        case 0: // SDL_DISABLE
          if (Browser.isFullScreen) { // only try to lock the pointer when in full screen mode
            Module['canvas'].requestPointerLock();
            return 0;
          } else { // else return SDL_ENABLE to indicate the failure
            return 1;
          }
          break;
        case 1: // SDL_ENABLE
          Module['canvas'].exitPointerLock();
          return 1;
          break;
        case -1: // SDL_QUERY
          return !Browser.pointerLock;
          break;
        default:
          console.log( "SDL_ShowCursor called with unknown toggle parameter value: " + toggle + "." );
          break;
      }
    }

  function _SDL_WM_GrabInput() {}

  function _SDL_WM_ToggleFullScreen(surf) {
      if (Browser.isFullScreen) {
        Module['canvas'].cancelFullScreen();
        return 1;
      } else {
        if (!SDL.canRequestFullscreen) {
          return 0;
        }
        SDL.isRequestingFullscreen = true;
        return 1;
      }
    }

  function _SDL_CreateRGBSurfaceFrom(pixels, width, height, depth, pitch, rmask, gmask, bmask, amask) {
      // TODO: Take into account depth and pitch parameters.
  
      var surface = SDL.makeSurface(width, height, 0, false, 'CreateRGBSurfaceFrom', rmask, gmask, bmask, amask);
  
      var surfaceData = SDL.surfaces[surface];
      var surfaceImageData = surfaceData.ctx.getImageData(0, 0, width, height);
      var surfacePixelData = surfaceImageData.data;
  
      // Fill pixel data to created surface.
      // Supports SDL_PIXELFORMAT_RGBA8888 and SDL_PIXELFORMAT_RGB888
      var channels = amask ? 4 : 3; // RGBA8888 or RGB888
      for (var pixelOffset = 0; pixelOffset < width*height; pixelOffset++) {
        surfacePixelData[pixelOffset*4+0] = HEAPU8[pixels + (pixelOffset*channels+0)]; // R
        surfacePixelData[pixelOffset*4+1] = HEAPU8[pixels + (pixelOffset*channels+1)]; // G
        surfacePixelData[pixelOffset*4+2] = HEAPU8[pixels + (pixelOffset*channels+2)]; // B
        surfacePixelData[pixelOffset*4+3] = amask ? HEAPU8[pixels + (pixelOffset*channels+3)] : 0xff; // A
      };
      
      surfaceData.ctx.putImageData(surfaceImageData, 0, 0);
  
      return surface;
    }

  
  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
  
      surfData.locked++;
      if (surfData.locked > 1) return 0;
  
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
  
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
  
      surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      if (surf == SDL.screen) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
  
      if (SDL.defaults.copyOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))|0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
        HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
  
      return 0;
    }function _SDL_UpperBlit(src, srcrect, dst, dstrect) {
      var srcData = SDL.surfaces[src];
      var dstData = SDL.surfaces[dst];
      var sr, dr;
      if (srcrect) {
        sr = SDL.loadRect(srcrect);
      } else {
        sr = { x: 0, y: 0, w: srcData.width, h: srcData.height };
      }
      if (dstrect) {
        dr = SDL.loadRect(dstrect);
      } else {
        dr = { x: 0, y: 0, w: -1, h: -1 };
      }
      var oldAlpha = dstData.ctx.globalAlpha;
      dstData.ctx.globalAlpha = srcData.alpha/255;
      dstData.ctx.drawImage(srcData.canvas, sr.x, sr.y, sr.w, sr.h, dr.x, dr.y, sr.w, sr.h);
      dstData.ctx.globalAlpha = oldAlpha;
      if (dst != SDL.screen) {
        // XXX As in IMG_Load, for compatibility we write out |pixels|
        console.log('WARNING: copying canvas data to memory for compatibility');
        _SDL_LockSurface(dst);
        dstData.locked--; // The surface is not actually locked in this hack
      }
      return 0;
    }

  function _SDL_FreeSurface(surf) {
      if (surf) SDL.freeSurface(surf);
    }

  function _SDL_Flip(surf) {
      // We actually do this in Unlock, since the screen surface has as its canvas
      // backing the page canvas element
    }

  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
  
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        var canvas = Module['canvas'];
        width = canvas.width;
        height = canvas.height;
      }
  
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        SDL.screen = null;
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }

  function _SDL_WM_SetCaption(title, icon) {
      title = title && Pointer_stringify(title);
      icon = icon && Pointer_stringify(icon);
    }

  function _SDL_EnableKeyRepeat(delay, interval) {
      // TODO
    }

  function _SDL_EventState() {}

  function _abort() {
      Module['abort']();
    }

  function ___errno_location() {
      return ___errno_state;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }






FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdout|0;var p=env._stdin|0;var q=env._stderr|0;var r=+env.NaN;var s=+env.Infinity;var t=0;var u=0;var v=0;var w=0;var x=0,y=0,z=0,A=0,B=0.0,C=0,D=0,E=0,F=0.0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=global.Math.floor;var R=global.Math.abs;var S=global.Math.sqrt;var T=global.Math.pow;var U=global.Math.cos;var V=global.Math.sin;var W=global.Math.tan;var X=global.Math.acos;var Y=global.Math.asin;var Z=global.Math.atan;var _=global.Math.atan2;var $=global.Math.exp;var aa=global.Math.log;var ba=global.Math.ceil;var ca=global.Math.imul;var da=env.abort;var ea=env.assert;var fa=env.asmPrintInt;var ga=env.asmPrintFloat;var ha=env.min;var ia=env.invoke_ii;var ja=env.invoke_viiiii;var ka=env.invoke_vi;var la=env.invoke_vii;var ma=env.invoke_iiii;var na=env.invoke_viii;var oa=env.invoke_v;var pa=env.invoke_iiiii;var qa=env.invoke_iii;var ra=env.invoke_iiiiii;var sa=env.invoke_viiii;var ta=env._llvm_lifetime_end;var ua=env._lseek;var va=env._fclose;var wa=env._SDL_EventState;var xa=env._strtoul;var ya=env._fflush;var za=env._SDL_GetMouseState;var Aa=env._strtol;var Ba=env._fputc;var Ca=env._fwrite;var Da=env._ptsname;var Ea=env._send;var Fa=env._tcflush;var Ga=env._fputs;var Ha=env._emscripten_cancel_main_loop;var Ia=env._SDL_UnlockAudio;var Ja=env._SDL_WasInit;var Ka=env._read;var La=env._fileno;var Ma=env._fsync;var Na=env._signal;var Oa=env._SDL_PauseAudio;var Pa=env._SDL_LockAudio;var Qa=env._strcmp;var Ra=env._strncmp;var Sa=env._snprintf;var Ta=env._fgetc;var Ua=env._atexit;var Va=env._close;var Wa=env._tcsetattr;var Xa=env._strchr;var Ya=env._tcgetattr;var Za=env._fopen;var _a=env.___setErrNo;var $a=env._grantpt;var ab=env._ftell;var bb=env._exit;var cb=env._sprintf;var db=env._fcntl;var eb=env._SDL_ShowCursor;var fb=env._gmtime;var gb=env._symlink;var hb=env._localtime_r;var ib=env._ftruncate;var jb=env._recv;var kb=env._SDL_PollEvent;var lb=env._SDL_Init;var mb=env.__exit;var nb=env._SDL_WM_GrabInput;var ob=env._llvm_va_end;var pb=env._tzset;var qb=env._SDL_CreateRGBSurfaceFrom;var rb=env._printf;var sb=env._unlockpt;var tb=env._pread;var ub=env._SDL_SetVideoMode;var vb=env._poll;var wb=env._open;var xb=env._usleep;var yb=env._SDL_EnableKeyRepeat;var zb=env._puts;var Ab=env._SDL_GetVideoInfo;var Bb=env._nanosleep;var Cb=env._SDL_Flip;var Db=env._SDL_InitSubSystem;var Eb=env._strdup;var Fb=env._SDL_GetError;var Gb=env.__formatString;var Hb=env._gettimeofday;var Ib=env._vfprintf;var Jb=env._SDL_WM_SetCaption;var Kb=env._sbrk;var Lb=env.___errno_location;var Mb=env._SDL_CloseAudio;var Nb=env._isspace;var Ob=env._llvm_lifetime_start;var Pb=env.__parseInt;var Qb=env._SDL_OpenAudio;var Rb=env._localtime;var Sb=env._gmtime_r;var Tb=env._sysconf;var Ub=env._fread;var Vb=env._SDL_WM_ToggleFullScreen;var Wb=env._abort;var Xb=env._fprintf;var Yb=env._tan;var Zb=env.__reallyNegative;var _b=env._posix_openpt;var $b=env._fseek;var ac=env._write;var bc=env._SDL_UpperBlit;var cc=env._truncate;var dc=env._emscripten_set_main_loop;var ec=env._unlink;var fc=env._pwrite;var gc=env._SDL_FreeSurface;var hc=env._time;var ic=env._SDL_LockSurface;var jc=0.0;
// EMSCRIPTEN_START_FUNCS
function vc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function wc(){return i|0}function xc(a){a=a|0;i=a}function yc(a,b){a=a|0;b=b|0;if((t|0)==0){t=a;u=b}}function zc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Ac(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Bc(a){a=a|0;G=a}function Cc(a){a=a|0;H=a}function Dc(a){a=a|0;I=a}function Ec(a){a=a|0;J=a}function Fc(a){a=a|0;K=a}function Gc(a){a=a|0;L=a}function Hc(a){a=a|0;M=a}function Ic(a){a=a|0;N=a}function Jc(a){a=a|0;O=a}function Kc(a){a=a|0;P=a}function Lc(){}function Mc(b){b=b|0;var e=0;e=a[b+5|0]|0;a[b+4|0]=e;Rz(b+7|0,0,13)|0;c[b+20>>2]=(e&255)<<8&3840|(d[b+6|0]|0)|24576;return}function Nc(b){b=b|0;a[b+7|0]=0;return}function Oc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((d|0)!=3){f=0;return f|0}d=b+20|0;a[e+1|0]=c[d>>2];a[e]=(c[d>>2]|0)>>>8;f=2;return f|0}function Pc(a,b){a=a|0;b=b|0;return}function Qc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;if((d|0)!=3|f>>>0<2>>>0){return}if((a[e+1|0]|0)!=-2){return}f=a[e]&15;a[b+4|0]=f;e=b+20|0;c[e>>2]=f<<8|c[e>>2]&61695;return}function Rc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;c[b>>2]=0;f=d&255;a[b+4|0]=f;a[b+5|0]=f;a[b+6|0]=e;Rz(b+7|0,0,13)|0;c[b+20>>2]=d<<8&3840|e&255|24576;c[b+24>>2]=0;c[b+28>>2]=154;c[b+32>>2]=56;c[b+36>>2]=94;c[b+40>>2]=130;c[b+44>>2]=2;return}function Sc(){var b=0,d=0;b=Mz(120)|0;if((b|0)==0){d=0;return d|0}a[b]=3;c[b+112>>2]=0;c[b+116>>2]=0;Rz(b+1|0,0,5)|0;Rz(b+14|0,0,14)|0;Rz(b+92|0,0,17)|0;d=b;return d|0}function Tc(a,b,d){a=a|0;b=b|0;d=d|0;c[a+92>>2]=b;c[a+96>>2]=d;return}function Uc(a,b,d){a=a|0;b=b|0;d=d|0;c[a+100>>2]=b;c[a+104>>2]=d;return}function Vc(a,b,d){a=a|0;b=b|0;d=d|0;c[a+112>>2]=b;c[a+116>>2]=d;return}function Wc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a+24|0;e=c[d>>2]|0;f=0;while(1){if(f>>>0>=e>>>0){break}if((c[a+28+(f<<2)>>2]|0)==(b|0)){g=1;h=6;break}else{f=f+1|0}}if((h|0)==6){return g|0}if(e>>>0>15>>>0){g=1;return g|0}c[d>>2]=e+1;c[a+28+(e<<2)>>2]=b;g=0;return g|0}function Xc(b){b=b|0;var d=0,e=0,f=0;d=b+24|0;if((c[d>>2]|0)!=0){e=0;do{f=c[b+28+(e<<2)>>2]|0;mc[c[f+28>>2]&1023](f);e=e+1|0;}while(e>>>0<(c[d>>2]|0)>>>0)}a[b|0]=3;a[b+1|0]=1;d=b+108|0;e=b+2|0;y=0;a[e]=y;y=y>>8;a[e+1|0]=y;y=y>>8;a[e+2|0]=y;y=y>>8;a[e+3|0]=y;Rz(b+14|0,0,10)|0;if((a[d]|0)==0){return}a[d]=0;d=c[b+116>>2]|0;if((d|0)==0){return}nc[d&511](c[b+112>>2]|0,0);return}function Yc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=e&3;e=b|0;if((a[e]|0)==f<<24>>24){return}g=b+16|0;c[g>>2]=(c[g>>2]|0)+783;a:do{if((f<<24>>24|0)==3|(f<<24>>24|0)==0){g=a[b+5|0]|0;if((d[b+4|0]|0)>>>0>=(g&255)>>>0){break}h=a[b+2|0]|0;if((h&12)!=8){break}a[b+1|0]=0;i=h&255;h=i>>>4;j=c[b+24>>2]|0;k=0;while(1){if(k>>>0>=j>>>0){break a}l=c[b+28+(k<<2)>>2]|0;if((d[l+4|0]|0)==(h|0)){break}else{k=k+1|0}}if((l|0)==0){break}uc[c[l+44>>2]&7](l,i&3,b+6|0,g&255)}}while(0);a[e]=f;e=b+108|0;do{if((a[e]|0)!=0){a[e]=0;l=c[b+116>>2]|0;if((l|0)==0){break}nc[l&511](c[b+112>>2]|0,0)}}while(0);if((f<<24>>24|0)==0){a[b+1|0]=0;a[b+4|0]=0;a[b+5|0]=0;a[b+14|0]=8;a[b+15|0]=0;return}else if((f<<24>>24|0)==1|(f<<24>>24|0)==2){if((a[b+1|0]|0)==0){a[b+14|0]=8;a[b+15|0]=0;return}l=b+4|0;k=a[l]|0;h=a[b+5|0]|0;a[b+14|0]=8;if((k&255)>>>0>=(h&255)>>>0){a[b+15|0]=-86;if((a[e]|0)==1){return}a[e]=1;e=c[b+116>>2]|0;if((e|0)==0){return}nc[e&511](c[b+112>>2]|0,1);return}e=k+1&255;a[l]=e;a[b+15|0]=a[(k&255)+(b+6)|0]|0;if((e&255)>>>0<(h&255)>>>0){return}h=d[b+2|0]|0;e=h>>>4;k=c[b+24>>2]|0;l=0;while(1){if(l>>>0>=k>>>0){m=28;break}n=c[b+28+(l<<2)>>2]|0;if((d[n+4|0]|0)==(e|0)){break}else{l=l+1|0}}if((m|0)==28){return}if((n|0)==0){return}nc[c[n+40>>2]&511](n,h&3);return}else if((f<<24>>24|0)==3){a[b+1|0]=1;a[b+4|0]=0;a[b+5|0]=0;a[b+14|0]=0;a[b+15|0]=0;c[b+20>>2]=0;return}else{return}}function Zc(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b+14|0;g=a[f]|0;if(g<<24>>24==0){if((a[b|0]|0)!=3){return}h=b+20|0;i=(c[h>>2]|0)+e|0;c[h>>2]=i;if(i>>>0<86170>>>0){return}c[h>>2]=0;h=a[b+3|0]|0;if(h<<24>>24==0){return}_c(b,h,1);if((d[b+4|0]|0)>>>0<(d[b+5|0]|0)>>>0){a[f]=8;a[b+15|0]=-86;return}if((a[b+108|0]|0)==0){return}a[f]=8;a[b+15|0]=-86;return}c[b+20>>2]=0;h=b+16|0;i=c[h>>2]|0;if(i>>>0>e>>>0){c[h>>2]=i-e;return}c[h>>2]=0;do{if((a[b+1|0]|0)==0){e=b+15|0;a[e]=a[e]<<1;i=g-1&255;a[f]=i;j=c[b+104>>2]|0;if((j|0)==0){k=i}else{if((kc[j&31](c[b+100>>2]|0)|0)<<24>>24!=0){a[e]=a[e]|1}k=a[f]|0}if(k<<24>>24!=0){break}if((a[b|0]|0)==0){_c(b,a[e]|0,0);break}j=b+5|0;i=a[j]|0;if((i&255)>>>0>=8>>>0){break}l=a[e]|0;a[j]=i+1;a[(i&255)+(b+6)|0]=l}else{l=c[b+96>>2]|0;if((l|0)==0){m=g;n=b+15|0}else{i=b+15|0;nc[l&511](c[b+92>>2]|0,(d[i]|0)>>>7);m=a[f]|0;n=i}a[n]=a[n]<<1;a[f]=m-1}}while(0);c[h>>2]=(c[h>>2]|0)+783;return}function _c(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;h=b+108|0;do{if((a[h]|0)!=0){a[h]=0;j=c[b+116>>2]|0;if((j|0)==0){break}nc[j&511](c[b+112>>2]|0,0)}}while(0);j=b+2|0;a[j]=e;a[b+4|0]=0;k=b+5|0;a[k]=0;l=e&255;m=l&15;a:do{if((m|0)==0){n=b+24|0;if((c[n>>2]|0)!=0){o=0;do{p=c[b+28+(o<<2)>>2]|0;mc[c[p+28>>2]&1023](p);o=o+1|0;}while(o>>>0<(c[n>>2]|0)>>>0)}a[b|0]=3;n=b+1|0;a[n]=1;o=j;y=0;a[o]=y;y=y>>8;a[o+1|0]=y;y=y>>8;a[o+2|0]=y;y=y>>8;a[o+3|0]=y;Rz(b+14|0,0,10)|0;do{if((a[h]|0)!=0){a[h]=0;o=c[b+116>>2]|0;if((o|0)==0){break}nc[o&511](c[b+112>>2]|0,0)}}while(0);a[n]=1}else{o=l&12;if((o|0)==12){a[b+1|0]=1;p=l>>>4;q=c[b+24>>2]|0;r=0;while(1){if(r>>>0>=q>>>0){break a}s=c[b+28+(r<<2)>>2]|0;if((d[s+4|0]|0)==(p|0)){break}else{r=r+1|0}}if((s|0)==0){break}a[k]=oc[c[s+36>>2]&127](s,l&3,b+6|0)|0;a[b+3|0]=e;break}else if((o|0)==8){break}if((m|0)!=1){He(58200,(r=i,i=i+8|0,c[r>>2]=l,r)|0);i=r;break}a[b+1|0]=1;r=l>>>4;p=c[b+24>>2]|0;q=0;while(1){if(q>>>0>=p>>>0){break a}t=c[b+28+(q<<2)>>2]|0;if((d[t+4|0]|0)==(r|0)){break}else{q=q+1|0}}if((t|0)==0){break}mc[c[t+32>>2]&1023](t)}}while(0);if((f|0)==0){i=g;return}f=l>>>4;l=b+24|0;t=c[l>>2]|0;if((t|0)==0){i=g;return}m=b+116|0;e=b+112|0;s=0;k=t;while(1){t=c[b+28+(s<<2)>>2]|0;do{if((a[t+7|0]|0)==0){u=k}else{if((d[t+4|0]|0)==(f|0)){u=k;break}if((c[t+20>>2]&8192|0)==0){u=k;break}if((a[h]|0)==1){u=k;break}a[h]=1;j=c[m>>2]|0;if((j|0)==0){u=k;break}nc[j&511](c[e>>2]|0,1);u=c[l>>2]|0}}while(0);t=s+1|0;if(t>>>0<u>>>0){s=t;k=u}else{break}}i=g;return}function $c(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=c[b+320>>2]|0;if((d|0)==0){d=c[2260]|0;if((d|0)!=0){f=e|0;g=9040;h=d;do{d=c[f>>2]|0;a:do{if((d|0)!=0){i=g;j=e;k=d;l=h;while(1){if((k|0)==(l|0)){m=j;n=c[i+4>>2]|0;c[m>>2]=c[i>>2];c[m+4>>2]=n}n=j+8|0;m=c[n>>2]|0;if((m|0)==0){break a}j=n;k=m;l=c[g>>2]|0}}}while(0);g=g+8|0;h=c[g>>2]|0;}while((h|0)!=0)}a[b+316|0]=0;return}else{h=c[2234]|0;if((h|0)!=0){g=e|0;f=8936;d=h;do{h=c[g>>2]|0;b:do{if((h|0)!=0){l=f;k=e;j=h;i=d;while(1){if((j|0)==(i|0)){m=k;n=c[l+4>>2]|0;c[m>>2]=c[l>>2];c[m+4>>2]=n}n=k+8|0;m=c[n>>2]|0;if((m|0)==0){break b}k=n;j=m;i=c[f>>2]|0}}}while(0);f=f+8|0;d=c[f>>2]|0;}while((d|0)!=0)}a[b+316|0]=1;return}}function ad(b){b=b|0;return a[b+316|0]|0}function bd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=c[b+320>>2]|0;while(1){h=c[g>>2]|0;j=(h|0)==0;if(j|(h|0)==(e|0)){break}else{g=g+8|0}}if(j){j=$y(e)|0;ax(2,58168,(h=i,i=i+16|0,c[h>>2]=e,c[h+8>>2]=(j|0)!=0?j:56168,h)|0);i=h;i=f;return}do{if((d|0)==1){h=b+56|0;j=c[h>>2]|0;e=j+1&255;k=b+52|0;if((e|0)==(c[k>>2]|0)){l=k;m=h;break}a[b+60+j|0]=a[g+4|0]|0;c[h>>2]=e;l=k;m=h}else if((d|0)==2){h=b+56|0;k=c[h>>2]|0;e=k+1&255;j=b+52|0;if((e|0)==(c[j>>2]|0)){l=j;m=h;break}a[b+60+k|0]=a[g+4|0]|-128;c[h>>2]=e;l=j;m=h}else{l=b+52|0;m=b+56|0}}while(0);a[b+7|0]=(c[l>>2]|0)!=(c[m>>2]|0)|0;i=f;return}function cd(a){a=a|0;var b=0;b=c[a>>2]|0;Nz(c[b+320>>2]|0);Nz(b);return}function dd(b){b=b|0;var d=0;d=c[b>>2]|0;Mc(b);a[d+48|0]=0;c[d+52>>2]=0;c[d+56>>2]=0;return}function ed(b){b=b|0;var d=0;d=c[b>>2]|0;Nc(b);a[d+48|0]=0;c[d+52>>2]=0;c[d+56>>2]=0;return}function fd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;if((d|0)==2){a[e]=-1;a[e+1|0]=-1;He(43320,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0);i=g;h=2;i=f;return h|0}else if((d|0)==0){j=c[b>>2]|0;k=j;l=j+48|0;if((a[l]|0)==0){m=j+52|0;n=c[m>>2]|0;o=c[j+56>>2]|0;if((n|0)==(o|0)){h=0;i=f;return h|0}j=a[k+60+n|0]|0;p=n+1&255;c[m>>2]=p;if((p|0)==(o|0)){q=255}else{o=a[k+60+p|0]|0;c[m>>2]=n+2&255;q=o&255}o=b+8|0;c[o>>2]=q|(j&255)<<8;r=o}else{r=b+8|0}a[l]=1;a[e]=(c[r>>2]|0)>>>8;a[e+1|0]=c[r>>2];h=2;i=f;return h|0}else if((d|0)!=3){He(46792,(g=i,i=i+8|0,c[g>>2]=d,g)|0);i=g}h=Oc(b,d,e)|0;i=f;return h|0}function gd(b,d){b=b|0;d=d|0;var e=0;e=c[b>>2]|0;if((d|0)!=0){return}a[e+48|0]=0;a[e+7|0]=(c[e+52>>2]|0)!=(c[e+56>>2]|0)|0;return}function hd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0;g=i;do{if((b|0)!=3){He(50896,(h=i,i=i+8|0,c[h>>2]=b,h)|0);i=h;if(!((b|0)==2&(f|0)==2)){break}c[a+16>>2]=(d[e]|0)<<8|(d[e+1|0]|0);i=g;return}}while(0);Qc(a,b,e,f);i=g;return}function id(){var b=0,d=0,e=0,f=0,g=0,h=0;b=Mz(324)|0;d=b;if((b|0)==0){e=0;return e|0}Rc(b,2,2);c[b>>2]=b;c[b+24>>2]=2;c[b+28>>2]=134;c[b+32>>2]=8;c[b+36>>2]=72;c[b+40>>2]=124;c[b+44>>2]=6;c[b+52>>2]=0;c[b+56>>2]=0;a[b+316|0]=0;f=0;while(1){g=f+1|0;if((c[9144+(f<<3)>>2]|0)==0){break}else{f=g}}f=g<<3;g=Mz(f)|0;if((g|0)==0){h=0}else{Sz(g|0,9144,f)|0;h=g}c[b+320>>2]=h;e=d;return e|0}function jd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=b+56|0;if(((c[g>>2]^d)&1|0)!=0){c[b+52>>2]=1}c[g>>2]=d;d=b+60|0;g=(c[d>>2]|0)+e|0;c[d>>2]=g;d=b+64|0;e=(c[d>>2]|0)+f|0;c[d>>2]=e;d=b+52|0;if((g|e|0)==0){h=c[d>>2]&255;i=b+7|0;a[i]=h;return}else{c[d>>2]=1;h=1;i=b+7|0;a[i]=h;return}}function kd(a){a=a|0;Nz(c[a>>2]|0);return}function ld(a){a=a|0;var b=0;b=c[a>>2]|0;Mc(a);Rz(b+52|0,0,28)|0;c[a+8>>2]=32896;return}function md(a){a=a|0;var b=0;b=c[a>>2]|0;Nc(a);Rz(b+52|0,0,28)|0;return}function nd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)!=0){f=Oc(b,d,e)|0;return f|0}d=c[b>>2]|0;if((c[d+52>>2]|0)==0){f=0;return f|0}a[d+48|0]=1;g=d+68|0;c[g>>2]=c[d+56>>2];h=d+72|0;c[h>>2]=c[d+60>>2];i=d+76|0;c[i>>2]=c[d+64>>2];d=b+8|0;c[d>>2]=32896;if((c[g>>2]&1|0)==0){j=32896}else{c[d>>2]=128;j=128}g=c[h>>2]|0;if((g|0)<0){k=(g|0)<-63?65:g&127}else{k=(g|0)>63?63:g}g=k|j;c[d>>2]=g;j=c[i>>2]|0;if((j|0)<0){l=(j|0)<-63?65:j&127}else{l=(j|0)>63?63:j}j=l<<8|g&33023;c[d>>2]=j;a[e]=j>>>8;a[e+1|0]=c[d>>2];f=2;return f|0}function od(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=c[b>>2]|0;if((d|0)!=0){return}d=e+48|0;if((a[d]|0)==0){return}a[d]=0;d=e+52|0;c[d>>2]=0;if((c[e+68>>2]|0)==(c[e+56>>2]|0)){f=0}else{c[d>>2]=1;f=1}g=c[e+72>>2]|0;h=e+60|0;i=c[h>>2]|0;c[h>>2]=i-g;h=c[e+76>>2]|0;j=e+64|0;e=c[j>>2]|0;c[j>>2]=e-h;if((i|0)==(g|0)&(e|0)==(h|0)){k=f}else{c[d>>2]=1;k=1}a[b+7|0]=k;return}function pd(){var a=0,b=0;a=Mz(80)|0;if((a|0)==0){b=0;return b|0}Rc(a,3,1);c[a>>2]=a;c[a+24>>2]=302;c[a+28>>2]=224;c[a+32>>2]=312;c[a+36>>2]=58;c[a+40>>2]=74;Rz(a+52|0,0,28)|0;b=a;return b|0}function qd(a,b){a=a|0;b=b|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;f=i;i=i+264|0;g=f|0;nw(g,b);if((tw(g)|0)!=0){i=f;return}if((tw(g)|0)!=0){i=f;return}b=a+49|0;h=a+48|0;j=a+50|0;k=a+51|0;l=a+124|0;m=a+44|0;n=a+45|0;p=a+68|0;q=a+52|0;r=a+46|0;s=a+47|0;t=a+42|0;u=a+43|0;v=a+69|0;w=a+56|0;x=a+54|0;y=a+40|0;z=a+41|0;A=a+60|0;B=a+4624|0;C=a+4625|0;D=a+64|0;E=a+62|0;F=a+1424|0;G=a+8|0;H=c[o>>2]|0;I=a+4|0;a:while(1){do{if((vw(g,46512)|0)==0){if((vw(g,45832)|0)!=0){Gw(34056);uq(c[G>>2]|0,H);break}if((vw(g,45480)|0)==0){if((vw(g,45152)|0)==0){break a}Gw(36864);J=d[h]|0;K=d[j]|0;L=d[k]|0;M=d[l]|0;Fw(36328,(N=i,i=i+40|0,c[N>>2]=d[b]|0,c[N+8>>2]=J,c[N+16>>2]=K,c[N+24>>2]=L,c[N+32>>2]=M,N)|0);i=N;M=d[n]|0;L=d[p]|0;K=e[q>>1]|0;J=d[r]|0;O=d[s]|0;Fw(36040,(N=i,i=i+48|0,c[N>>2]=d[m]|0,c[N+8>>2]=M,c[N+16>>2]=L,c[N+24>>2]=K,c[N+32>>2]=J,c[N+40>>2]=O,N)|0);i=N;O=d[u]|0;J=d[v]|0;K=(c[w>>2]|0)!=0?42:32;L=e[x>>1]|0;Fw(35720,(N=i,i=i+40|0,c[N>>2]=d[t]|0,c[N+8>>2]=O,c[N+16>>2]=J,c[N+24>>2]=K,c[N+32>>2]=L,N)|0);i=N;L=d[z]|0;K=e[A>>1]|0;Fw(35440,(N=i,i=i+32|0,c[N>>2]=d[y]|0,c[N+8>>2]=L,c[N+16>>2]=0,c[N+24>>2]=K,N)|0);i=N;K=d[C]|0;L=(c[D>>2]|0)!=0?42:32;J=e[E>>1]|0;Fw(35144,(N=i,i=i+40|0,c[N>>2]=d[B]|0,c[N+8>>2]=K,c[N+16>>2]=0,c[N+24>>2]=L,c[N+32>>2]=J,N)|0);i=N;break}else{Gw(34896);Fw(34656,(N=i,i=i+8|0,c[N>>2]=d[F]|0,N)|0);i=N;J=0;do{L=d[a+132+J|0]|0;K=d[a+148+J|0]|0;O=d[a+772+J|0]|0;M=d[a+788+J|0]|0;Fw(34376,(N=i,i=i+64|0,c[N>>2]=J,c[N+8>>2]=L,c[N+16>>2]=J,c[N+24>>2]=K,c[N+32>>2]=J,c[N+40>>2]=O,c[N+48>>2]=J,c[N+56>>2]=M,N)|0);i=N;J=J+1|0;}while(J>>>0<16>>>0)}}else{rd(c[I>>2]|0)}}while(0);if((tw(g)|0)!=0){P=15;break}}if((P|0)==15){i=f;return}P=ow(g)|0;Fw(44824,(N=i,i=i+8|0,c[N>>2]=P,N)|0);i=N;i=f;return}function rd(b){b=b|0;var d=0,f=0,g=0,j=0,k=0,l=0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+608|0;f=d|0;g=d+352|0;Gw(33832);j=Kj(b)|0;k=Lj(b)|0;l=Mj(b)|0;if((j|0)==0){m=1.0}else{m=+((l+k|0)>>>0>>>0)/+(j>>>0>>>0)}Fw(33416,(n=i,i=i+32|0,c[n>>2]=k,c[n+8>>2]=j,c[n+16>>2]=l,h[n+24>>3]=m,n)|0);i=n;l=b+166|0;j=e[l>>1]|0;k=Pj(b)|0;o=Qj(b)|0;p=(Sj(b)|0)&65535;q=(e[l>>1]|0)>>>8&7;l=c[b+364>>2]|0;Fw(33024,(n=i,i=i+112|0,c[n>>2]=j,c[n+8>>2]=(j&32768|0)!=0?84:45,c[n+16>>2]=(j&8192|0)!=0?83:45,c[n+24>>2]=j&255,c[n+32>>2]=(j&1|0)!=0?67:45,c[n+40>>2]=(j&2|0)!=0?86:45,c[n+48>>2]=(j&4|0)!=0?90:45,c[n+56>>2]=(j&8|0)!=0?78:45,c[n+64>>2]=(j&16|0)!=0?88:45,c[n+72>>2]=k,c[n+80>>2]=o,c[n+88>>2]=p,c[n+96>>2]=q,c[n+104>>2]=l,n)|0);i=n;l=c[b+104>>2]|0;q=c[b+120>>2]|0;p=c[b+136>>2]|0;o=b+152|0;k=c[o>>2]|0;Fw(32680,(n=i,i=i+40|0,c[n>>2]=c[b+88>>2],c[n+8>>2]=l,c[n+16>>2]=q,c[n+24>>2]=p,c[n+32>>2]=k,n)|0);i=n;k=c[b+92>>2]|0;p=c[b+108>>2]|0;q=c[b+124>>2]|0;l=c[b+140>>2]|0;j=Rj(b,0)|0;Fw(32536,(n=i,i=i+40|0,c[n>>2]=k,c[n+8>>2]=p,c[n+16>>2]=q,c[n+24>>2]=l,c[n+32>>2]=j,n)|0);i=n;j=c[b+112>>2]|0;l=c[b+128>>2]|0;q=c[b+144>>2]|0;p=b+334|0;k=b+148|0;r=c[((a[p]|0)==0?k:b+168|0)>>2]|0;Fw(32416,(n=i,i=i+40|0,c[n>>2]=c[b+96>>2],c[n+8>>2]=j,c[n+16>>2]=l,c[n+24>>2]=q,c[n+32>>2]=r,n)|0);i=n;r=c[b+100>>2]|0;q=c[b+116>>2]|0;l=c[b+132>>2]|0;j=c[k>>2]|0;if((a[p]|0)!=0){s=j;Fw(32232,(n=i,i=i+40|0,c[n>>2]=r,c[n+8>>2]=q,c[n+16>>2]=l,c[n+24>>2]=j,c[n+32>>2]=s,n)|0);i=n;t=c[o>>2]|0;Og(b,f,t);u=g|0;Bd(u,f);v=c[o>>2]|0;Fw(42352,(n=i,i=i+16|0,c[n>>2]=v,c[n+8>>2]=u,n)|0);i=n;i=d;return}s=c[b+172>>2]|0;Fw(32232,(n=i,i=i+40|0,c[n>>2]=r,c[n+8>>2]=q,c[n+16>>2]=l,c[n+24>>2]=j,c[n+32>>2]=s,n)|0);i=n;t=c[o>>2]|0;Og(b,f,t);u=g|0;Bd(u,f);v=c[o>>2]|0;Fw(42352,(n=i,i=i+16|0,c[n>>2]=v,c[n+8>>2]=u,n)|0);i=n;i=d;return}function sd(b){b=b|0;var d=0,e=0,f=0;d=b+4680|0;Dx(d);ie(b);pe(c[15592]|0,0);pe(c[15592]|0,0);if((c[d>>2]|0)!=0){Ex();return}e=b+4676|0;f=b+3480|0;do{if((a[e]|0)!=0){do{Ax(5e4)|0;xz(c[f>>2]|0);}while((a[e]|0)!=0)}pe(c[15592]|0,0);pe(c[15592]|0,0);}while((c[d>>2]|0)==0);Ex();return}function td(){return c[15696]|0}function ud(a){a=a|0;c[15696]=a;Dx(a+4680|0);ie(a);dc(4,100,1)|0;return}function vd(){var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=Ab()|0;g=c[f+12>>2]|0;h=c[f+16>>2]|0;f=0;while(1){do{if(((f|0)%100|0|0)==0){za(d|0,e|0)|0;j=c[d>>2]|0;if((j|0)>(g|0)){k=g}else{k=(j|0)<0?0:j}c[d>>2]=k;j=c[e>>2]|0;if((j|0)>(h|0)){l=h}else{l=(j|0)<0?0:j}c[e>>2]=l;j=c[(c[15696]|0)+4>>2]|0;m=l&65535;if((c[j+36>>2]|0)>>>0>2089>>>0){n=j+32|0;a[(c[n>>2]|0)+2088|0]=(m&65535)>>>8;a[(c[n>>2]|0)+2089|0]=l}else{pc[c[j+24>>2]&63](c[j+4>>2]|0,2088,m)}m=c[(c[15696]|0)+4>>2]|0;j=c[d>>2]|0;n=j&65535;if((c[m+36>>2]|0)>>>0>2091>>>0){o=m+32|0;a[(c[o>>2]|0)+2090|0]=(n&65535)>>>8;a[(c[o>>2]|0)+2091|0]=j}else{pc[c[m+24>>2]&63](c[m+4>>2]|0,2090,n)}n=c[(c[15696]|0)+4>>2]|0;m=c[e>>2]|0;j=m&65535;if((c[n+36>>2]|0)>>>0>2093>>>0){o=n+32|0;a[(c[o>>2]|0)+2092|0]=(j&65535)>>>8;a[(c[o>>2]|0)+2093|0]=m}else{pc[c[n+24>>2]&63](c[n+4>>2]|0,2092,j)}j=c[(c[15696]|0)+4>>2]|0;n=c[d>>2]|0;m=n&65535;if((c[j+36>>2]|0)>>>0>2095>>>0){o=j+32|0;a[(c[o>>2]|0)+2094|0]=(m&65535)>>>8;a[(c[o>>2]|0)+2095|0]=n}else{pc[c[j+24>>2]&63](c[j+4>>2]|0,2094,m)}m=c[(c[15696]|0)+4>>2]|0;j=c[e>>2]|0;n=j&65535;if((c[m+36>>2]|0)>>>0>2097>>>0){o=m+32|0;a[(c[o>>2]|0)+2096|0]=(n&65535)>>>8;a[(c[o>>2]|0)+2097|0]=j}else{pc[c[m+24>>2]&63](c[m+4>>2]|0,2096,n)}n=c[(c[15696]|0)+4>>2]|0;m=c[d>>2]|0;j=m&65535;if((c[n+36>>2]|0)>>>0>2099>>>0){o=n+32|0;a[(c[o>>2]|0)+2098|0]=(j&65535)>>>8;a[(c[o>>2]|0)+2099|0]=m;break}else{pc[c[n+24>>2]&63](c[n+4>>2]|0,2098,j);break}}}while(0);pe(c[15592]|0,0);pe(c[15592]|0,0);j=c[15696]|0;if((c[j+4680>>2]|0)!=0){break}if((a[j+4676|0]|0)!=0){do{Ax(5e4)|0;xz(c[(c[15696]|0)+3480>>2]|0);}while((a[(c[15696]|0)+4676|0]|0)!=0)}j=f+1|0;if((j|0)<1e4){f=j}else{p=30;break}}if((p|0)==30){i=b;return}Ex();Ha()|0;i=b;return}function wd(a,b,c){a=a|0;b=b|0;c=c|0;return}function xd(d,f){d=d|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;g=i;i=i+3032|0;h=g|0;j=g+8|0;k=g+16|0;l=g+1040|0;m=g+1392|0;n=g+1400|0;p=g+1408|0;q=g+1760|0;r=g+2016|0;s=g+2024|0;t=g+2032|0;u=g+2288|0;v=g+2640|0;w=g+2648|0;x=g+3e3|0;y=g+3008|0;z=g+3016|0;A=g+3024|0;B=d+3480|0;C=c[B>>2]|0;if((C|0)!=0){xz(C)}do{if((vw(f,44504)|0)==0){if((vw(f,40072)|0)!=0){c[A>>2]=1;yw(f,A)|0;if((uw(f)|0)==0){break}if((c[A>>2]|0)!=0){do{pe(d,1);C=(c[A>>2]|0)-1|0;c[A>>2]=C;}while((C|0)!=0)}rd(c[d+4>>2]|0);break}if((vw(f,31024)|0)!=0){if((vw(f,44504)|0)!=0){if((yw(f,z)|0)!=0){C=d+28|0;do{kw(C,$v(c[z>>2]|0)|0)|0;}while((yw(f,z)|0)!=0)}if((uw(f)|0)==0){break}C=d+4680|0;Dx(C);ie(d);D=d+4|0;E=d+28|0;F=c[o>>2]|0;a:while(1){G=Kj(c[D>>2]|0)|0;while(1){if((Kj(c[D>>2]|0)|0)!=(G|0)){continue a}pe(d,0);if((lw(E,0,c[(c[D>>2]|0)+152>>2]&16777215,F)|0)!=0){break a}if((c[C>>2]|0)!=0){break a}}}Ex();break}if((vw(f,37304)|0)==0){if((uw(f)|0)==0){break}sd(d);break}if((xw(f,y)|0)==0){b[y>>1]=-1}if((uw(f)|0)==0){break}C=d+4|0;F=Oj(c[C>>2]|0)|0;D=d+4680|0;Dx(D);ie(d);E=d+28|0;G=c[o>>2]|0;while(1){H=Kj(c[C>>2]|0)|0;do{if((Kj(c[C>>2]|0)|0)!=(H|0)){break}pe(d,0);if((lw(E,0,c[(c[C>>2]|0)+152>>2]&16777215,G)|0)!=0){break}}while((c[D>>2]|0)==0);if((lw(E,0,c[(c[C>>2]|0)+152>>2]&16777215,G)|0)!=0){break}if((c[D>>2]|0)!=0){break}if((Oj(c[C>>2]|0)|0)==(F|0)){continue}H=(b[y>>1]|0)==-1;I=Pj(c[C>>2]|0)|0;if(H){J=35;break}if((I|0)==(e[y>>1]|0)){J=37;break}}if((J|0)==35){F=Qj(c[C>>2]|0)|0;Fw(37080,(K=i,i=i+16|0,c[K>>2]=I,c[K+8>>2]=F,K)|0);i=K}else if((J|0)==37){F=Pj(c[C>>2]|0)|0;D=Qj(c[C>>2]|0)|0;Fw(37080,(K=i,i=i+16|0,c[K>>2]=F,c[K+8>>2]=D,K)|0);i=K}Ex();break}if((vw(f,56080)|0)!=0){if((xw(f,x)|0)==0){b[x>>1]=2}if((uw(f)|0)==0){break}D=d+4|0;Nj(c[D>>2]|0,e[x>>1]|0);rd(c[D>>2]|0);break}if((vw(f,54024)|0)!=0){c[v>>2]=1;do{if((vw(f,54024)|0)!=0){c[v>>2]=2;if((vw(f,54024)|0)==0){break}do{c[v>>2]=(c[v>>2]|0)+1;}while((vw(f,54024)|0)!=0)}}while(0);yw(f,v)|0;if((uw(f)|0)==0){break}C=d+4|0;D=Oj(c[C>>2]|0)|0;F=d+4680|0;Dx(F);b:do{if((c[v>>2]|0)!=0){G=w|0;E=d+28|0;H=c[o>>2]|0;L=w+8|0;do{M=c[C>>2]|0;Og(M,w,c[M+152>>2]|0);M=c[C>>2]|0;do{if((c[G>>2]&4|0)==0){N=Kj(M)|0;while(1){if((Kj(c[C>>2]|0)|0)!=(N|0)){break}pe(d,0);if((lw(E,0,c[(c[C>>2]|0)+152>>2]&16777215,H)|0)!=0){break b}if((c[F>>2]|0)!=0){break b}}if((Oj(c[C>>2]|0)|0)==(D|0)){break}N=c[C>>2]|0;O=c[N+380>>2]|0;if((c[N+152>>2]|0)==(O|0)){break}do{pe(d,0);if((lw(E,0,c[(c[C>>2]|0)+152>>2]&16777215,H)|0)!=0){break b}if((c[F>>2]|0)!=0){break b}}while((c[(c[C>>2]|0)+152>>2]|0)!=(O|0))}else{O=c[L>>2]<<1;N=O+(c[M+152>>2]|0)|0;if((O|0)==0){break}do{pe(d,0);if((lw(E,0,c[(c[C>>2]|0)+152>>2]&16777215,H)|0)!=0){break b}if((c[F>>2]|0)!=0){break b}}while((c[(c[C>>2]|0)+152>>2]|0)!=(N|0))}}while(0);M=(c[v>>2]|0)-1|0;c[v>>2]=M;}while((M|0)!=0)}}while(0);Ex();rd(c[C>>2]|0);break}if((vw(f,52600)|0)!=0){if((uw(f)|0)==0){break}oe(d);rd(c[d+4>>2]|0);break}if((vw(f,51912)|0)!=0){if((uw(f)|0)==0){break}F=d+4680|0;Dx(F);D=d+4|0;H=d+28|0;E=c[o>>2]|0;L=u|0;while(1){G=Kj(c[D>>2]|0)|0;do{if((Kj(c[D>>2]|0)|0)!=(G|0)){break}pe(d,0);if((lw(H,0,c[(c[D>>2]|0)+152>>2]&16777215,E)|0)!=0){break}}while((c[F>>2]|0)==0);if((lw(H,0,c[(c[D>>2]|0)+152>>2]&16777215,E)|0)!=0){break}if((c[F>>2]|0)!=0){break}G=c[D>>2]|0;Og(G,u,c[G+152>>2]|0);if((c[L>>2]&8|0)!=0){J=82;break}}if((J|0)==82){rd(c[D>>2]|0)}Ex();break}if((vw(f,50888)|0)!=0){L=t|0;if((tw(f)|0)!=0){rd(c[d+4>>2]|0);break}if((rw(f,L,256)|0)==0){qw(f,38368);break}F=d+4|0;if((Tj(c[F>>2]|0,L,s)|0)!=0){Fw(38056,(K=i,i=i+8|0,c[K>>2]=L,K)|0);i=K;break}if((tw(f)|0)!=0){Fw(37840,(K=i,i=i+8|0,c[K>>2]=c[s>>2],K)|0);i=K;break}if((yw(f,s)|0)==0){qw(f,37592);break}if((uw(f)|0)==0){break}Uj(c[F>>2]|0,L,c[s>>2]|0)|0;rd(c[F>>2]|0);break}if((vw(f,49160)|0)!=0){if((tw(f)|0)==0){qd(d,ow(f)|0);break}else{rd(c[d+4>>2]|0);break}}if((vw(f,47984)|0)!=0){c[r>>2]=1;do{if((vw(f,47984)|0)!=0){c[r>>2]=2;if((vw(f,47984)|0)==0){break}do{c[r>>2]=(c[r>>2]|0)+1;}while((vw(f,47984)|0)!=0)}}while(0);yw(f,r)|0;if((uw(f)|0)==0){break}D=d+4680|0;Dx(D);F=d+4|0;if((c[r>>2]|0)!=0){L=d+28|0;E=c[o>>2]|0;H=0;do{C=Kj(c[F>>2]|0)|0;do{if((Kj(c[F>>2]|0)|0)!=(C|0)){break}pe(d,0);if((lw(L,0,c[(c[F>>2]|0)+152>>2]&16777215,E)|0)!=0){break}}while((c[D>>2]|0)==0);H=H+1|0;}while(H>>>0<(c[r>>2]|0)>>>0)}Ex();rd(c[F>>2]|0);break}if((vw(f,47376)|0)==0){P=1;i=g;return P|0}H=q|0;if(a[7752]|0){Q=c[15698]|0}else{a[7752]=1;D=c[(c[d+4>>2]|0)+152>>2]|0;c[15698]=D;Q=D}c[m>>2]=Q;c[n>>2]=16;if((vw(f,42968)|0)==0){if((yw(f,m)|0)!=0){yw(f,n)|0}if((uw(f)|0)==0){break}if((c[n>>2]|0)==0){R=c[m>>2]|0}else{D=d+4|0;E=p+8|0;L=0;C=c[m>>2]|0;while(1){Og(c[D>>2]|0,p,C);Bd(H,p);Fw(42352,(K=i,i=i+16|0,c[K>>2]=c[m>>2],c[K+8>>2]=H,K)|0);i=K;G=(c[m>>2]|0)+(c[E>>2]<<1)|0;c[m>>2]=G;M=L+1|0;if(M>>>0<(c[n>>2]|0)>>>0){L=M;C=G}else{R=G;break}}}c[15698]=R;break}C=t|0;c[h>>2]=Q;c[j>>2]=16;if((yw(f,h)|0)!=0){yw(f,j)|0}if((uw(f)|0)==0){break}L=c[j>>2]|0;if(L>>>0>256>>>0){c[j>>2]=256;S=256}else{S=L}L=c[h>>2]|0;E=(S*-12|0)+L&-2;if(E>>>0>L>>>0){break}L=d+4|0;H=l+8|0;D=0;F=0;G=0;M=5;N=E;while(1){do{if((M|0)==0){c[k+(F<<2)>>2]=N;E=F+1&255;if((E|0)==(D|0)){T=0;U=G;V=D;W=D+1&255;break}else{T=0;U=G+1|0;V=E;W=D;break}}else{T=M-1|0;U=G;V=F;W=D}}while(0);Og(c[L>>2]|0,l,N);E=(c[H>>2]<<1)+N|0;if(E>>>0>(c[h>>2]|0)>>>0){break}else{D=W;F=V;G=U;M=T;N=E}}N=c[j>>2]|0;if(U>>>0>N>>>0){X=U+W-N&255}else{X=W}if((X|0)==(V|0)){break}else{Y=X}do{N=c[k+(Y<<2)>>2]|0;Og(c[L>>2]|0,l,N);Bd(C,l);Fw(42352,(K=i,i=i+16|0,c[K>>2]=N,c[K+8>>2]=C,K)|0);i=K;Y=Y+1&255;}while((Y|0)!=(V|0))}else{mw(f,d+28|0)}}while(0);d=c[B>>2]|0;if((d|0)==0){P=0;i=g;return P|0}oz(d,44168,43832)|0;P=0;i=g;return P|0}function yd(a,b){a=a|0;b=b|0;ex(b,6920,12)|0;lx(b)|0;b=a+4|0;c[(c[b>>2]|0)+68>>2]=a;c[(c[b>>2]|0)+72>>2]=0;c[(c[b>>2]|0)+76>>2]=64;c[(c[b>>2]|0)+80>>2]=246;c[(c[b>>2]|0)+84>>2]=14;return}function zd(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;e=i;f=a+4|0;a=Rj(c[f>>2]|0,0)|0;g=c[f>>2]|0;h=a&16777215;j=h+1|0;k=c[g+36>>2]|0;if(j>>>0<k>>>0){l=c[g+32>>2]|0;m=(d[l+h|0]|0)<<8|(d[l+j|0]|0);n=g;o=k}else{k=sc[c[g+12>>2]&63](c[g+4>>2]|0,h)|0;h=c[f>>2]|0;m=k;n=h;o=c[h+36>>2]|0}h=m&65535;m=a+2&16777215;k=m+1|0;if(k>>>0<o>>>0){g=c[n+32>>2]|0;p=(d[g+m|0]|0)<<8|(d[g+k|0]|0);q=n;r=o}else{o=sc[c[n+12>>2]&63](c[n+4>>2]|0,m)|0;m=c[f>>2]|0;p=o;q=m;r=c[m+36>>2]|0}m=p&65535;p=a+4&16777215;o=p+1|0;if(o>>>0<r>>>0){n=c[q+32>>2]|0;s=(d[n+p|0]|0)<<8|(d[n+o|0]|0);t=q;u=r}else{r=sc[c[q+12>>2]&63](c[q+4>>2]|0,p)|0;p=c[f>>2]|0;s=r;t=p;u=c[p+36>>2]|0}p=s&65535;s=a+6&16777215;r=s+1|0;if(r>>>0<u>>>0){q=c[t+32>>2]|0;v=(d[q+s|0]|0)<<8|(d[q+r|0]|0);w=t;x=u}else{u=sc[c[t+12>>2]&63](c[t+4>>2]|0,s)|0;s=c[f>>2]|0;v=u;w=s;x=c[s+36>>2]|0}s=v&65535;v=a+8&16777215;u=v+1|0;if(u>>>0<x>>>0){x=c[w+32>>2]|0;y=(d[x+v|0]|0)<<8|(d[x+u|0]|0);z=y&65535;ax(3,43256,(A=i,i=i+56|0,c[A>>2]=a,c[A+8>>2]=b,c[A+16>>2]=h,c[A+24>>2]=m,c[A+32>>2]=p,c[A+40>>2]=s,c[A+48>>2]=z,A)|0);i=A;i=e;return}else{y=sc[c[w+12>>2]&63](c[w+4>>2]|0,v)|0;z=y&65535;ax(3,43256,(A=i,i=i+56|0,c[A>>2]=a,c[A+8>>2]=b,c[A+16>>2]=h,c[A+24>>2]=m,c[A+32>>2]=p,c[A+40>>2]=s,c[A+48>>2]=z,A)|0);i=A;i=e;return}}function Ad(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=a+4|0;g=c[f>>2]|0;h=(Rj(g,0)|0)&16777215;j=h+1|0;if(j>>>0<(c[g+36>>2]|0)>>>0){k=c[g+32>>2]|0;l=(d[k+h|0]|0)<<8|(d[k+j|0]|0)}else{l=sc[c[g+12>>2]&63](c[g+4>>2]|0,h)|0}switch(b|0){case 10:{ng(a+2424|0);i=e;return};case 0:{oe(a);i=e;return};case 25:case 26:case 32:case 39:case 40:case 41:case 42:case 43:case 44:case 46:{i=e;return};default:{a=Rj(c[f>>2]|0,0)|0;h=Qj(c[f>>2]|0)|0;ax(3,43632,(f=i,i=i+32|0,c[f>>2]=a,c[f+8>>2]=b,c[f+16>>2]=h,c[f+24>>2]=l&65535,f)|0);i=f;i=e;return}}}function Bd(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+256|0;g=f|0;h=g|0;a[b]=0;j=d+8|0;if((c[j>>2]|0)==0){k=0;l=5}else{m=g;n=0;do{cb(m|0,42e3,(o=i,i=i+8|0,c[o>>2]=e[d+12+(n<<1)>>1]|0,o)|0)|0;i=o;Uz(b|0,m|0)|0;n=n+1|0;p=c[j>>2]|0;}while(n>>>0<p>>>0);if(p>>>0<4>>>0){k=p;l=5}}if((l|0)==5){while(1){l=0;p=b+(Tz(b|0)|0)|0;a[p]=a[41656]|0;a[p+1|0]=a[41657]|0;a[p+2|0]=a[41658]|0;a[p+3|0]=a[41659]|0;a[p+4|0]=a[41660]|0;a[p+5|0]=a[41661]|0;p=k+1|0;if(p>>>0<4>>>0){k=p;l=5}else{break}}}l=c[d>>2]|0;do{if((l&1|0)==0){if((l&4|0)!=0){k=b+(Tz(b|0)|0)|0;y=62;a[k]=y;y=y>>8;a[k+1|0]=y;break}k=b+(Tz(b|0)|0)|0;if((l&16|0)==0){y=32;a[k]=y;y=y>>8;a[k+1|0]=y;break}else{y=60;a[k]=y;y=y>>8;a[k+1|0]=y;break}}else{k=b+(Tz(b|0)|0)|0;y=42;a[k]=y;y=y>>8;a[k+1|0]=y}}while(0);l=Fg(e[d+12>>1]|0)|0;k=(l|0)==0?d+32|0:l;l=c[d+28>>2]|0;if((l|0)==2){p=g;cb(p|0,39848,(o=i,i=i+24|0,c[o>>2]=k,c[o+8>>2]=d+96,c[o+16>>2]=d+160,o)|0)|0;i=o;q=p}else if((l|0)==3){p=g;cb(p|0,39288,(o=i,i=i+32|0,c[o>>2]=k,c[o+8>>2]=d+96,c[o+16>>2]=d+160,c[o+24>>2]=d+224,o)|0)|0;i=o;q=p}else if((l|0)==0){p=g;Sz(p|0,k|0,(Tz(k|0)|0)+1|0)|0;q=p}else if((l|0)==1){l=g;cb(l|0,40064,(o=i,i=i+16|0,c[o>>2]=k,c[o+8>>2]=d+96,o)|0)|0;i=o;q=l}else{c[h>>2]=2960685;q=g}Uz(b|0,q|0)|0;q=d+288|0;if((a[q]|0)==0){i=f;return}d=Tz(b|0)|0;g=b+d|0;if(d>>>0<50>>>0){Rz(g|0,32,50-d|0)|0;r=b+50|0}else{r=g}a[r]=a[38664]|0;a[r+1|0]=a[38665]|0;a[r+2|0]=a[38666]|0;Uz(r|0,q|0)|0;i=f;return}function Cd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;e=a;switch(b|0){case 3:{f=a+2424|0;pg(f,1);pg(f,2);pg(f,3);pg(f,4);g=0;i=d;return g|0};case 2:{Te(e,48456,54184)|0;g=0;i=d;return g|0};case 4:{ax(2,44880,(h=i,i=i+8|0,c[h>>2]=c[(c[a+4>>2]|0)+152>>2],h)|0);i=h;g=0;i=d;return g|0};case 1:{Te(e,41304,54184)|0;g=0;i=d;return g|0};case 0:{g=0;i=d;return g|0};default:{e=a+4|0;f=c[e>>2]|0;j=a+2628|0;c[j>>2]=c[f+88>>2];k=a+2632|0;c[k>>2]=c[f+120>>2];l=a+2636|0;c[l>>2]=c[f+124>>2];m=a+2640|0;c[m>>2]=c[f+152>>2];if((rg(a+2424|0,b)|0)==0){c[(c[e>>2]|0)+88>>2]=c[j>>2];c[(c[e>>2]|0)+120>>2]=c[k>>2];c[(c[e>>2]|0)+124>>2]=c[l>>2];Vj(c[e>>2]|0,c[m>>2]|0);g=0;i=d;return g|0}else{He(41336,(h=i,i=i+8|0,c[h>>2]=b,h)|0);i=h;g=1;i=d;return g|0}}}return 0}function Dd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;switch(d|0){case 3:{Te(b,38992,48096)|0;i=e;return 0};case 4:{Te(b,38992,44576)|0;i=e;return 0};case 53:case 91:{f=b+1744|0;g=c[f>>2]|0;do{if((g|0)!=0){if((a[g+280|0]|0)==0){He(35208,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0);i=h;ae(c[f>>2]|0,0);break}else{He(38112,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0);i=h;ae(c[f>>2]|0,1);break}}}while(0);f=b+1752|0;g=c[f>>2]|0;if((g|0)==0){i=e;return 0}if((ad(g)|0)==0){He(38112,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0);i=h;$c(c[f>>2]|0,1);i=e;return 0}else{He(35208,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0);i=h;$c(c[f>>2]|0,0);i=e;return 0}break};case 2:{Te(b,38992,53672)|0;i=e;return 0};case 5:{Te(b,38992,41112)|0;i=e;return 0};case 39:{fe(b,7,1);fe(b,7,0);i=e;return 0};default:{ax(2,32384,(h=i,i=i+8|0,c[h>>2]=d,h)|0);i=h;i=e;return 0}}return 0}function Ed(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;d=i;e=b+20|0;a[e]=0;f=c[b+4>>2]|0;do{if((f|0)==0){g=4}else{h=Vs(f,0)|0;if((h|0)==0){g=4;break}a[e]=1;He(32128,(j=i,i=i+8|0,c[j>>2]=(c[b>>2]|0)+1,j)|0);i=j;k=h}}while(0);a:do{if((g|0)==4){e=ur(c[b+8>>2]|0,c[b+12>>2]|0)|0;b:do{if((e|0)!=0){c:do{if((er(e)|0)==6){l=0;m=c[(c[e+64>>2]|0)+68>>2]|0}else{f=mr(e)|0;if((f|0)==1600){n=2}else if((f|0)==800){n=1}else{break b}f=Yt()|0;if((f|0)==0){break b}else{o=0;p=0}d:while(1){h=p>>>4;q=12-h|0;if((h|0)==12){r=o}else{h=0;s=o;while(1){t=0;u=s;do{v=yt(p,h,t,512)|0;if((v|0)==0){g=16;break d}bu(f,v,p,h)|0;if((pr(e,c[v+24>>2]|0,u,1)|0)!=0){g=17;break d}u=u+1|0;t=t+1|0;}while(t>>>0<q>>>0);t=h+1|0;if(t>>>0<n>>>0){h=t;s=u}else{r=u;break}}}s=p+1|0;if(s>>>0<80>>>0){o=r;p=s}else{l=f;m=f;break c}}if((g|0)==16){Zt(f);break b}else if((g|0)==17){Zt(f);break b}}}while(0);if((m|0)==0){break}s=Ns(m)|0;Zt(l);if((s|0)==0){break}He(51960,(j=i,i=i+8|0,c[j>>2]=(c[b>>2]|0)+1,j)|0);i=j;k=s;break a}}while(0);He(47344,(j=i,i=i+8|0,c[j>>2]=(c[b>>2]|0)+1,j)|0);i=j;w=1;i=d;return w|0}}while(0);j=b+16|0;dt(c[j>>2]|0);c[j>>2]=k;a[b+92|0]=0;c[b+48>>2]=0;w=0;i=d;return w|0}function Fd(d){d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+512|0;f=e|0;g=d+16|0;if((c[g>>2]|0)==0){h=1;i=e;return h|0}j=d|0;He(43848,(k=i,i=i+8|0,c[k>>2]=(c[j>>2]|0)+1,k)|0);i=k;a:do{if((a[d+20|0]|0)==0){l=ur(c[d+8>>2]|0,c[d+12>>2]|0)|0;do{if((l|0)!=0){m=Ks(c[g>>2]|0)|0;if((m|0)==0){break}if((er(l)|0)==6){n=c[l+64>>2]|0;o=n+68|0;Zt(c[o>>2]|0);c[o>>2]=m;a[n+72|0]=1;break a}n=f|0;o=mr(l)|0;if((o|0)==1600){p=2}else if((o|0)==800){p=1}else{Zt(m);break}o=0;q=0;b:while(1){r=12-(o>>>4)|0;s=0;t=q;do{u=0;while(1){if(u>>>0>=r>>>0){break}v=eu(m,o,s,u,0)|0;if((v|0)==0){Rz(n|0,0,512)|0}else{w=b[v+10>>1]|0;x=w&65535;if((w&65535)>>>0<512>>>0){Rz(f+x|0,0,512-x|0)|0;y=x}else{y=512}Sz(n|0,c[v+24>>2]|0,y)|0}if((qr(l,n,u+t|0,1)|0)==0){u=u+1|0}else{z=26;break b}}t=t+r|0;s=s+1|0;}while(s>>>0<p>>>0);s=o+1|0;if(s>>>0<80>>>0){o=s;q=t}else{z=24;break}}if((z|0)==24){Zt(m);break a}else if((z|0)==26){Zt(m);break}}}while(0);He(37432,(k=i,i=i+8|0,c[k>>2]=(c[j>>2]|0)+1,k)|0);i=k;h=1;i=e;return h|0}else{l=c[d+4>>2]|0;if((l|0)!=0){if((Ws(l,c[g>>2]|0,0)|0)==0){break}}He(40512,(k=i,i=i+8|0,c[k>>2]=(c[j>>2]|0)+1,k)|0);i=k;h=1;i=e;return h|0}}while(0);a[d+92|0]=0;h=0;i=e;return h|0}function Gd(b){b=b|0;a[b|0]=0;a[b+1|0]=0;a[b+3|0]=0;a[b+4|0]=0;a[b+5|0]=127;a[b+6|0]=0;Rz(b+8|0,0,39)|0;c[b+48>>2]=80;c[b+52>>2]=1;Rz(b+56|0,0,5)|0;Rz(b+64|0,0,24)|0;c[b+88>>2]=65e3;c[b+92>>2]=0;c[b+96>>2]=0;c[b+100>>2]=0;c[b+104>>2]=783360;c[b+108>>2]=0;a[b+116|0]=0;c[b+120>>2]=1;c[b+124>>2]=0;c[b+128>>2]=0;c[b+132>>2]=1;Rz(b+136|0,0,7)|0;c[b+144>>2]=80;c[b+148>>2]=1;Rz(b+152|0,0,5)|0;Rz(b+160|0,0,24)|0;c[b+184>>2]=65e3;c[b+188>>2]=0;c[b+192>>2]=0;c[b+196>>2]=0;c[b+200>>2]=783360;c[b+204>>2]=0;a[b+212|0]=0;c[b+216>>2]=2;c[b+220>>2]=0;c[b+224>>2]=0;c[b+228>>2]=2;Rz(b+232|0,0,7)|0;c[b+240>>2]=80;c[b+244>>2]=1;Rz(b+248|0,0,5)|0;Rz(b+256|0,0,24)|0;c[b+280>>2]=65e3;c[b+284>>2]=0;c[b+288>>2]=0;c[b+292>>2]=0;c[b+296>>2]=783360;c[b+300>>2]=0;a[b+308|0]=0;c[b+312>>2]=b+24;a[b+316|0]=0;c[b+320>>2]=0;c[b+324>>2]=0;return}function Hd(a,b,d){a=a|0;b=b|0;d=d|0;c[a+320>>2]=b;c[a+324>>2]=d;return}function Id(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if(b>>>0>2>>>0|d>>>0>2>>>0){e=1;return e|0}c[a+24+(b*96|0)+28>>2]=d;if((c[a+24+(b*96|0)+44>>2]|0)>>>0<d>>>0){e=0;return e|0}Jd(a+24+(b*96|0)|0,c[a+24+(b*96|0)+40>>2]|0,0);e=0;return e|0}function Jd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((c[a+24>>2]|0)>>>0<=b>>>0){return}if((c[a+28>>2]|0)>>>0<=d>>>0){return}e=a+16|0;f=c[e>>2]|0;if((f|0)==0){g=ct()|0;c[e>>2]=g;h=g}else{h=f}f=gt(h,b,d,1)|0;if((f|0)==0){return}h=f+4|0;do{if((c[h>>2]|0)==0){if((Ys(f,c[16104+((b>>>0>79>>>0?4:b>>>4)<<2)>>2]|0)|0)==0){break}return}}while(0);if((c[f>>2]|0)==0){Xs(f,5e5)}c[a+40>>2]=b;c[a+44>>2]=d;c[a+48>>2]=f;f=c[h>>2]|0;c[a+56>>2]=f;h=a+52|0;if((c[h>>2]|0)>>>0<f>>>0){return}c[h>>2]=0;return}function Kd(a,b){a=a|0;b=b|0;c[a+32>>2]=b;c[a+128>>2]=b;c[a+224>>2]=b;return}function Ld(a,b,d){a=a|0;b=b|0;d=d|0;if(b>>>0>=3>>>0){return}c[a+24+(b*96|0)+12>>2]=d;return}function Md(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if(d>>>0>2>>>0){return}f=b+24+(d*96|0)+4|0;Nz(c[f>>2]|0);c[f>>2]=0;a[b+24+(d*96|0)+20|0]=0;if((e|0)==0){return}d=(Tz(e|0)|0)+1|0;b=Mz(d)|0;if((b|0)==0){return}Sz(b|0,e|0,d)|0;c[f>>2]=b;return}function Nd(b,c){b=b|0;c=c|0;var d=0;if(c>>>0>2>>>0){d=1;return d|0}d=(a[b+24+(c*96|0)+21|0]|0)!=0|0;return d|0}function Od(b,c,d){b=b|0;c=c|0;d=d|0;if(c>>>0>2>>>0){return}a[b+24+(c*96|0)+21|0]=(d|0)!=0|0;return}function Pd(b,c,d){b=b|0;c=c|0;d=d|0;if(c>>>0>2>>>0){return}a[b+24+(c*96|0)+22|0]=(d|0)!=0|0;return}function Qd(b,e){b=b|0;e=e|0;var f=0;f=e<<24>>24!=0;e=b+2|0;if((d[e]|0|0)==(f&1|0)){return}a[e]=f&1;if((a[b|0]&32)!=0){return}e=f?2:0;f=b+24+(e*96|0)|0;c[b+312>>2]=f;Jd(f,c[b+24+(e*96|0)+40>>2]|0,d[b+1|0]|0);return}function Rd(b,e){b=b|0;e=e|0;var f=0,g=0;f=e<<24>>24!=0;e=b+1|0;g=f&1;if((d[e]|0|0)==(g|0)){return}a[e]=f&1;f=c[b+312>>2]|0;if((c[f+44>>2]|0)==(g|0)){return}Jd(f,c[f+40>>2]|0,g);return}function Sd(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=b+20|0;h=c[g>>2]|0;if((f|0)==0){i=h}else{j=f;f=h;h=e;while(1){e=(((d[6584+(a[h]&63)|0]|0)<<10)+(f*31|0)|0)>>>5;k=j-1|0;if((k|0)==0){i=e;break}else{j=k;f=e;h=h+1|0}}}c[g>>2]=i;c[(c[b+312>>2]|0)+88>>2]=i;return}function Td(b,d){b=b|0;d=d|0;var e=0,f=0;if(d>>>0>2>>>0){return}e=b+24+(d*96|0)|0;f=b+24+(d*96|0)+34|0;if((a[f]|0)!=0){return}if((Ed(e)|0)!=0){return}a[f]=1;Jd(e,c[b+24+(d*96|0)+40>>2]|0,c[b+24+(d*96|0)+44>>2]|0);return}function Ud(b,f){b=b|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((f&1|0)==0){g=0;return g|0}Vd(b,f>>>9&15);f=d[b|0]|0;h=f&192;if((h|0)==0){if((f&16|0)==0){g=-1;return g|0}i=b+13|0;j=a[i]|0;a[i]=0;g=j;return g|0}else if((h|0)==64){j=a[b+4|0]&31|a[b+3|0]&96;i=c[b+312>>2]|0;switch(((a[b+1|0]|0)!=0?8:0)|f&7|0){case 3:{k=(a[i+35|0]|0)!=0|0;l=21;break};case 0:{k=(a[i+32|0]|0)==0|0;l=21;break};case 1:{f=i+33|0;m=a[f]|0;a[f]=0;k=m<<24>>24==0|0;l=21;break};case 2:{k=(a[i+36|0]|0)==0|0;l=21;break};case 6:{k=(c[i+28>>2]|0)>>>0>1>>>0|0;l=21;break};case 8:{k=(a[i+34|0]|0)==0|0;l=21;break};case 9:{m=a[i+21|0]|0;do{if((a[i+20|0]|0)==0){f=ur(c[i+8>>2]|0,c[i+12>>2]|0)|0;if((f|0)==0){n=m;break}o=(gr(f)|0)==0;n=o?m:1}else{n=m}}while(0);k=(n|0)==0|0;l=21;break};case 10:{k=(c[i+40>>2]|0)!=0|0;l=21;break};case 11:{if((c[i+28>>2]|0)==1){n=ca(((65536-(c[i+88>>2]|0)|0)*120|0)>>>15,c[i+60>>2]|0)|0;p=(n>>>0)/((c[i+64>>2]|0)>>>0)|0}else{p=(((c[i+52>>2]|0)*120|0)>>>0)/((c[i+56>>2]|0)>>>0)|0}k=p&1^1;l=21;break};case 4:case 5:case 7:case 12:case 14:{g=j;return g|0};default:{}}do{if((l|0)==21){if((k|0)==0){g=j}else{break}return g|0}}while(0);g=j|-128;return g|0}else if((h|0)==128){h=a[b+5|0]|0;return((e[b+14>>1]|0)>>>0<256>>>0?h|-128:h&127)|0}else{g=0;return g|0}return 0}function Vd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;switch(e&15|0){case 2:{e=b|0;a[e]=a[e]&-3;g=e;break};case 1:{e=b|0;a[e]=a[e]|1;g=e;break};case 3:{e=b|0;a[e]=a[e]|2;g=e;break};case 0:{e=b|0;a[e]=a[e]&-2;g=e;break};case 4:{e=b|0;a[e]=a[e]&-5;g=e;break};case 5:{e=b|0;a[e]=a[e]|4;g=e;break};case 6:{e=b|0;a[e]=a[e]&-9;g=e;break};case 7:{e=b|0;a[e]=a[e]|8;g=e;break};case 8:{e=b|0;a[e]=a[e]&-17;h=b+3|0;a[h]=a[h]&-33;g=e;break};case 9:{e=b|0;a[e]=a[e]|16;h=b+3|0;a[h]=a[h]|32;g=e;break};case 10:{e=b|0;a[e]=a[e]&-33;h=(a[b+2|0]|0)!=0?2:0;j=b+24+(h*96|0)|0;c[b+312>>2]=j;Jd(j,c[b+24+(h*96|0)+40>>2]|0,d[b+1|0]|0);g=e;break};case 11:{e=b|0;a[e]=a[e]|32;h=b+120|0;c[b+312>>2]=h;Jd(h,c[b+160>>2]|0,d[b+1|0]|0);g=e;break};case 12:{e=b|0;a[e]=a[e]&-65;g=e;break};case 13:{e=b|0;a[e]=a[e]|64;g=e;break};case 14:{e=b|0;a[e]=a[e]&127;g=e;break};case 15:{e=b|0;a[e]=a[e]|-128;g=e;break};default:{g=b|0}}e=a[g]|0;if((e&8)==0){k=e}else{h=e&255;e=h&4;j=(e|0)!=0;l=e>>>2;e=c[b+312>>2]|0;a:do{switch(((a[b+1|0]|0)!=0?4:0)|h&3|0){case 0:{a[e+32|0]=l^1;break};case 1:{if((l|0)!=0){break a}m=e+40|0;n=c[m>>2]|0;do{if((a[e+32|0]|0)==0){if((n|0)==0){o=0;break}p=n-1|0;c[m>>2]=p;o=p}else{p=n+1|0;if(p>>>0>=(c[e+24>>2]|0)>>>0){o=n;break}c[m>>2]=p;o=p}}while(0);a[e+33|0]=1;Jd(e,o,c[e+44>>2]|0);n=c[m>>2]|0;Fw(51552,(q=i,i=i+16|0,c[q>>2]=(c[e>>2]|0)+1,c[q+8>>2]=n,q)|0);i=q;break};case 2:{n=e+36|0;p=l^1;if((a[n]|0)==(p|0)){r=0}else{a[n]=p;r=0}while(1){if(r>>>0>=3>>>0){s=0;break}if((a[b+24+(r*96|0)+36|0]|0)==0){r=r+1|0}else{s=1;break}}m=b+316|0;if((a[m]|0)==s<<24>>24){break a}a[m]=s;m=c[b+324>>2]|0;if((m|0)==0){break a}nc[m&511](c[b+320>>2]|0,s);break};case 3:{if(!j){break a}a[e+34|0]=0;He(31392,(q=i,i=i+8|0,c[q>>2]=(c[e>>2]|0)+1,q)|0);i=q;if((a[e+92|0]|0)==0){break a}Fd(e)|0;break};case 4:{if(!j){break a}a[e+35|0]=0;break};default:{}}}while(0);k=a[g]|0}if(k<<24>>24<=-1){i=f;return}k=b+5|0;a[k]=a[k]|64;k=b+6|0;if((a[k]|0)==0){i=f;return}a[k]=0;k=c[b+312>>2]|0;b=k+76|0;do{if((c[b>>2]|0)>>>0>(c[k+56>>2]|0)>>>0){if((a[k+22|0]|0)==0){break}g=k+52|0;at(c[k+48>>2]|0,c[g>>2]|0)|0;c[g>>2]=0}}while(0);c[b>>2]=0;i=f;return}function Wd(e,f,g){e=e|0;f=f|0;g=g|0;if((f&1|0)==0){return}Vd(e,f>>>9&15);f=d[e|0]|0;if((f&192|0)!=192){return}if((f&16|0)==0){a[e+4|0]=g;return}f=e+6|0;if((a[f]|0)==0){a[f]=1;c[e+8>>2]=0;c[(c[e+312>>2]|0)+76>>2]=0}b[e+14>>1]=g&255|-256;return}function Xd(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;g=c[e+312>>2]|0;if((a[g+36|0]|0)==0){return}h=g+84|0;i=(c[h>>2]|0)+(f*5e5|0)|0;f=c[g+80>>2]|0;j=(i>>>0)/(f>>>0)|0;c[h>>2]=(i>>>0)%(f>>>0)|0;f=g+56|0;i=c[f>>2]|0;if((i|0)==0){k=0}else{h=g+52|0;l=(c[h>>2]|0)+j|0;while(1){if(l>>>0<i>>>0){break}else{l=l-i|0}}c[h>>2]=l;k=i}i=c[g+64>>2]|0;do{if((i|0)!=0){l=g+60|0;h=(c[l>>2]|0)+j|0;c[l>>2]=h;if(h>>>0<i>>>0){break}c[l>>2]=h-i}}while(0);i=e+6|0;a:do{if((a[i]|0)==0){if((d[e|0]|0)>>>0>=64>>>0){break}j=c[g+48>>2]|0;if((j|0)==0|(k|0)==0){break}h=g+68|0;l=c[h>>2]|0;m=c[j+8>>2]|0;j=g+52|0;if((l|0)==(c[j>>2]|0)){break}n=e+12|0;o=e+16|0;p=e+13|0;q=128>>>((l&7)>>>0)&255;r=l>>>3;l=a[n]|0;while(1){s=l<<1;t=(a[m+r|0]&q)<<24>>24!=0;a[n]=t&1|s;do{if(t){c[o>>2]=0}else{u=(c[o>>2]|0)+1|0;c[o>>2]=u;if(u>>>0<=7>>>0){break}c[o>>2]=0;a[n]=s|1}}while(0);s=(c[h>>2]|0)+1|0;c[h>>2]=s;do{if(s>>>0<(c[f>>2]|0)>>>0){if(q<<24>>24==1){v=r+1|0;w=-128;x=s;break}else{v=r;w=(q&255)>>>1;x=s;break}}else{c[h>>2]=0;v=0;w=-128;x=0}}while(0);s=a[n]|0;if(s<<24>>24<0){a[p]=s;a[n]=0;y=0;z=c[h>>2]|0}else{y=s;z=x}if((z|0)==(c[j>>2]|0)){break}else{q=w;r=v;l=y}}}else{l=g+48|0;r=c[l>>2]|0;if((r|0)==0|(k|0)==0){break}q=g+72|0;j=c[q>>2]|0;h=c[r+8>>2]|0;r=g+52|0;n=e+8|0;p=e+14|0;o=e+12|0;m=g+92|0;s=g+76|0;t=j>>>3;u=128>>>((j&7)>>>0)&255;A=j;b:while(1){j=h+t|0;B=u;C=A;while(1){if((C|0)==(c[r>>2]|0)){break a}if((c[n>>2]|0)==0){D=b[p>>1]|0;if((D&65535)>>>0<256>>>0){break b}E=D&255;a[o]=E;c[n>>2]=8;b[p>>1]=0;F=E}else{F=a[o]|0}if(F<<24>>24<0){G=a[j]|B}else{G=a[j]&~B}a[j]=G;a[m]=1;a[o]=a[o]<<1;c[n>>2]=(c[n>>2]|0)-1;H=(c[q>>2]|0)+1|0;c[q>>2]=H;c[s>>2]=(c[s>>2]|0)+1;if(H>>>0>=(c[f>>2]|0)>>>0){I=26;break}if(B<<24>>24==1){I=29;break}B=(B&255)>>>1;C=H}if((I|0)==26){I=0;c[q>>2]=0;t=0;u=-128;A=0;continue}else if((I|0)==29){I=0;t=t+1|0;u=-128;A=H;continue}}A=e+5|0;a[A]=a[A]&-65;c[n>>2]=0;a[i]=0;do{if((c[s>>2]|0)>>>0>(c[f>>2]|0)>>>0){if((a[g+22|0]|0)==0){break}at(c[l>>2]|0,c[r>>2]|0)|0;c[r>>2]=0}}while(0);c[s>>2]=0}}while(0);f=c[g+52>>2]|0;c[g+68>>2]=f;c[g+72>>2]=f;return}function Yd(){var b=0,d=0;b=Mz(304)|0;if((b|0)==0){d=0;return d|0}a[b+264|0]=0;c[b>>2]=0;c[b+4>>2]=0;Rz(b+268|0,0,13)|0;Rz(b+288|0,0,16)|0;c[b+284>>2]=10848;d=b;return d|0}function Zd(a,b,d){a=a|0;b=b|0;d=d|0;c[a+288>>2]=b;c[a+292>>2]=d;return}function _d(a,b,d){a=a|0;b=b|0;d=d|0;c[a+296>>2]=b;c[a+300>>2]=d;return}function $d(a,b,d){a=a|0;b=b|0;d=d|0;c[a+276>>2]=b;c[a+284>>2]=(d|0)==0?10848:12912;return 0}function ae(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[b+284>>2]|0;if((d|0)==0){d=c[3750]|0;if((d|0)!=0){f=15e3;g=d;do{d=e;while(1){h=c[d>>2]|0;if((h|0)==0){break}if((h|0)==(g|0)){i=13;break}else{d=d+24|0}}if((i|0)==13){i=0;h=d;j=f;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];c[h+12>>2]=c[j+12>>2];c[h+16>>2]=c[j+16>>2];c[h+20>>2]=c[j+20>>2]}f=f+24|0;g=c[f>>2]|0;}while((g|0)!=0)}a[b+280|0]=1;return}else{g=c[3888]|0;if((g|0)!=0){f=15552;j=g;do{g=e;while(1){h=c[g>>2]|0;if((h|0)==0){break}if((h|0)==(j|0)){i=6;break}else{g=g+24|0}}if((i|0)==6){i=0;d=g;h=f;c[d>>2]=c[h>>2];c[d+4>>2]=c[h+4>>2];c[d+8>>2]=c[h+8>>2];c[d+12>>2]=c[h+12>>2];c[d+16>>2]=c[h+16>>2];c[d+20>>2]=c[h+20>>2]}f=f+24|0;j=c[f>>2]|0;}while((j|0)!=0)}a[b+280|0]=0;return}}function be(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;if((f|0)==2){h=71}else{h=(f|0)==3?75:f}f=c[d+284>>2]|0;while(1){j=c[f>>2]|0;k=(j|0)==0;if(k|(j|0)==(h|0)){break}else{f=f+24|0}}if(k){k=$y(h)|0;ax(2,31224,(j=i,i=i+16|0,c[j>>2]=h,c[j+8>>2]=(k|0)!=0?k:51504,j)|0);i=j;i=g;return}if((e|0)==1){j=b[f+4>>1]|0;k=j&65535;if(j<<16>>16==0){i=g;return}j=d+4|0;h=d|0;l=0;m=c[j>>2]|0;while(1){if(m>>>0>255>>>0){n=m}else{a[((c[h>>2]|0)+m&255)+(d+8)|0]=a[f+6+l|0]|0;o=(c[j>>2]|0)+1|0;c[j>>2]=o;n=o}o=l+1|0;if(o>>>0<k>>>0){l=o;m=n}else{break}}i=g;return}else if((e|0)==2){e=b[f+14>>1]|0;n=e&65535;if(e<<16>>16==0){i=g;return}e=d+4|0;m=d|0;l=0;k=c[e>>2]|0;while(1){if(k>>>0>255>>>0){p=k}else{a[((c[m>>2]|0)+k&255)+(d+8)|0]=a[f+16+l|0]|0;j=(c[e>>2]|0)+1|0;c[e>>2]=j;p=j}j=l+1|0;if(j>>>0<n>>>0){l=j;k=p}else{break}}i=g;return}else{i=g;return}}function ce(b,d){b=b|0;d=d|0;var e=0,f=0;e=i;f=d&255;if((f|0)==22){c[b>>2]=0;c[b+4>>2]=1;a[b+8|0]=c[b+276>>2]<<1&14|1;c[b+268>>2]=0;c[b+272>>2]=1;i=e;return}else if((f|0)==20){c[b+268>>2]=0;c[b+272>>2]=1;i=e;return}else if((f|0)==16){c[b+268>>2]=1958400;c[b+272>>2]=1;i=e;return}else{He(47112,(b=i,i=i+8|0,c[b>>2]=f,b)|0);i=b;i=e;return}}function de(b,c){b=b|0;c=c|0;a[b+264|0]=c;return}function ee(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if((a[b+264|0]|0)==0){return}e=b+272|0;if((c[e>>2]|0)==0){return}f=b+4|0;g=c[f>>2]|0;if((g|0)!=0){h=b|0;i=c[b+292>>2]|0;if((i|0)==0){j=g}else{nc[i&511](c[b+288>>2]|0,a[(c[h>>2]|0)+(b+8)|0]|0);j=c[f>>2]|0}c[h>>2]=(c[h>>2]|0)+1&255;c[f>>2]=j-1;c[e>>2]=0;c[b+268>>2]=0;return}j=b+268|0;f=c[j>>2]|0;if(f>>>0>d>>>0){c[j>>2]=f-d;return}d=c[b+292>>2]|0;if((d|0)!=0){nc[d&511](c[b+288>>2]|0,123)}c[e>>2]=0;return}function fe(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;g=1<<e;if((f|0)==0){f=b+4652|0;e=(d[f]|0)&(g^255)&255;a[f]=e;h=e}else{e=b+4652|0;f=(d[e]|0|g)&255;a[e]=f;h=f}f=h&255;h=0;while(1){e=f>>>1;if((e|0)==0){break}else{f=e;h=h+1|0}}ik(c[b+4>>2]|0,h);return}function ge(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;if(e<<24>>24==0){return}do{if((qg(d+2424|0)|0)!=0){e=d+4|0;f=c[e>>2]|0;if((b[f+166>>1]&1792)==1792){break}g=(c[f+148>>2]|0)-4|0;h=c[f+152>>2]|0;i=g&16777215;j=i+3|0;if(j>>>0<(c[f+36>>2]|0)>>>0){k=f+32|0;a[(c[k>>2]|0)+i|0]=h>>>24;a[(c[k>>2]|0)+(i+1)|0]=h>>>16;a[(c[k>>2]|0)+(i+2)|0]=h>>>8;a[(c[k>>2]|0)+j|0]=h}else{pc[c[f+28>>2]&63](c[f+4>>2]|0,i,h)}c[(c[e>>2]|0)+148>>2]=g;Vj(c[e>>2]|0,c[d+2468>>2]|0)}}while(0);e=d+36|0;lp(e,0);lp(e,1);return}function he(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0;e=i;i=i+400|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=e+80|0;r=e+112|0;s=e+120|0;t=e+128|0;u=e+136|0;v=e+144|0;w=e+152|0;x=e+160|0;y=e+168|0;z=e+176|0;A=e+184|0;B=e+192|0;C=e+200|0;D=e+208|0;E=e+216|0;F=e+224|0;G=e+232|0;H=e+240|0;I=e+248|0;J=e+256|0;K=e+264|0;L=e+272|0;M=e+280|0;N=e+288|0;O=e+296|0;P=e+304|0;Q=e+312|0;R=e+320|0;S=e+328|0;T=e+336|0;U=e+344|0;V=e+352|0;W=e+360|0;X=e+368|0;Y=e+376|0;Z=e+384|0;_=e+392|0;$=b+3480|0;c[$>>2]=0;aa=b+3476|0;c[aa>>2]=0;c[b+4632>>2]=0;a[b+4652|0]=0;a[b+4676|0]=0;c[b+4680>>2]=0;ba=b+4684|0;Rz(b+4656|0,0,14)|0;c[ba>>2]=1;da=b+4688|0;c[da>>2]=1;ea=b+4696|0;c[ea>>2]=0;c[b+4692>>2]=0;Rz(b+4712|0,0,24)|0;jw(b+28|0);fa=_x(d,0,57664)|0;hy((fa|0)==0?d:fa,35104,_,57600)|0;cx(2,57568,57512,(fa=i,i=i+8|0,c[fa>>2]=c[_>>2],fa)|0);i=fa;ga=c[_>>2]|0;do{if((Qa(ga|0,57600)|0)==0){c[b>>2]=1}else{if((Qa(ga|0,57456)|0)==0){c[b>>2]=2;break}if((Qa(ga|0,57408)|0)==0){c[b>>2]=4;break}else{ax(0,57344,(fa=i,i=i+8|0,c[fa>>2]=ga,fa)|0);i=fa;c[b>>2]=1;break}}}while(0);ga=sq()|0;_=b+8|0;c[_>>2]=ga;ha=b;tq(ga,ha,24,2,18,4,38,6);ga=b+12|0;Ow(c[_>>2]|0,d,ga)|0;Pw(c[_>>2]|0,d)|0;c[ga>>2]=xq(c[_>>2]|0,0)|0;ia=xq(c[_>>2]|0,4194304)|0;ja=b+16|0;c[ja>>2]=ia;ka=b+20|0;c[ka>>2]=0;la=b+24|0;c[la>>2]=0;ma=c[ga>>2]|0;do{if((ma|0)==0){ax(0,30144,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa}else{if((ia|0)==0){ax(0,58136,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa;break}na=aq(ma)|0;c[ka>>2]=na;mq(na,6291456);if((nq(c[ka>>2]|0)|0)>>>0>2097152>>>0){oq(c[ka>>2]|0,2097152)}na=aq(c[ja>>2]|0)|0;c[la>>2]=na;mq(na,0);c[b+4628>>2]=0;gy(d,58088,Z,1)|0;if((c[Z>>2]|0)!=0){break}cx(2,57896,57760,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa;na=c[b>>2]|0;if((na&1|0)!=0){Eq(c[_>>2]|0,686,4194304);break}if((na&6|0)==0){break}Eq(c[_>>2]|0,3324,1464619843)}}while(0);Z=_x(d,0,30440)|0;hy(Z,35104,X,43472)|0;ey(Z,30392,Y,0)|0;Z=c[Y>>2]|0;cx(2,30352,30288,(fa=i,i=i+16|0,c[fa>>2]=c[X>>2],c[fa+8>>2]=Z,fa)|0);i=fa;Z=Bj()|0;la=b+4|0;c[la>>2]=Z;if((Z|0)!=0){if((ne(b,c[X>>2]|0)|0)!=0){ax(0,30208,(fa=i,i=i+8|0,c[fa>>2]=c[X>>2],fa)|0);i=fa}Cj(c[la>>2]|0,c[_>>2]|0,26,14,22,24,22,16);Ej(c[la>>2]|0,ha,180);Fj(c[la>>2]|0,ha,36);Gj(c[la>>2]|0,0);la=c[Y>>2]|0;c[ba>>2]=la;c[da>>2]=la}la=_x(d,0,31136)|0;dy(la,58072,V,15720448)|0;dy(la,45112,W,8192)|0;la=c[W>>2]|0;cx(2,31096,44440,(fa=i,i=i+16|0,c[fa>>2]=c[V>>2],c[fa+8>>2]=la,fa)|0);i=fa;la=b+36|0;cp(la,9);hp(la,ha,20);dp(la,ha,284);ep(la,ha,286);da=$p(c[V>>2]|0,c[W>>2]|0,0)|0;if((da|0)!=0){hq(da,la,4,32,12,26,2,18);vq(c[_>>2]|0,da,1)}da=_x(d,0,31216)|0;dy(da,58072,T,8388608)|0;dy(da,45112,U,4194304)|0;da=c[U>>2]|0;cx(2,31184,44440,(fa=i,i=i+16|0,c[fa>>2]=c[T>>2],c[fa+8>>2]=da,fa)|0);i=fa;da=b+128|0;xp(da);yp(da,ha,42);Ep(da,3672e3,3672e3,3672e3);W=$p(c[T>>2]|0,c[U>>2]|0,0)|0;if((W|0)!=0){hq(W,ha,30,0,0,30,0,0);vq(c[_>>2]|0,W,1)}W=b+3488|0;$f(W);cg(W,da,0);W=b+4056|0;$f(W);cg(W,da,1);W=_x(d,0,32040)|0;if((W|0)!=0){U=W;do{ey(U,31912,Q,0)|0;ey(U,31864,R,1)|0;hy(U,49560,S,0)|0;W=c[R>>2]|0;T=c[S>>2]|0;cx(2,31656,31512,(fa=i,i=i+24|0,c[fa>>2]=c[Q>>2],c[fa+8>>2]=W,c[fa+16>>2]=(T|0)!=0?T:48296,fa)|0);i=fa;U=_x(d,U,32040)|0;T=c[Q>>2]|0;do{if(T>>>0>1>>>0){ax(0,31360,(fa=i,i=i+8|0,c[fa>>2]=T,fa)|0);i=fa}else{W=c[R>>2]|0;Dp(da,T,W,W);W=c[S>>2]|0;if((W|0)==0){break}if((ag(b+3488+((c[Q>>2]|0)*568|0)|0,W)|0)==0){break}ax(0,31288,(fa=i,i=i+8|0,c[fa>>2]=c[S>>2],fa)|0);i=fa}}while(0);}while((U|0)!=0)}U=_x(d,0,34016)|0;hy(U,40280,M,33784)|0;gy(U,33360,O,1)|0;gy(U,32976,P,0)|0;hy(U,32664,N,0)|0;U=c[O>>2]|0;S=c[N>>2]|0;Q=c[P>>2]|0;cx(2,32528,32336,(fa=i,i=i+32|0,c[fa>>2]=c[M>>2],c[fa+8>>2]=U,c[fa+16>>2]=(S|0)!=0?S:32224,c[fa+24>>2]=Q,fa)|0);i=fa;c[b+4672>>2]=Eb(c[M>>2]|0)|0;Q=b+1428|0;qf(Q);rf(Q,ha,92);sf(Q,ha,112);tf(Q,c[O>>2]|0);if((uf(Q,c[M>>2]|0)|0)!=0){ax(0,32096,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa}if((c[P>>2]|0)!=0){a[b+1548|0]=0;a[b+1549|0]=6;a[b+1550|0]=-1;a[b+1551|0]=-53}P=c[N>>2]|0;if((P|0)==0){vf(Q,0,1)}else{wf(Q,P)}P=b+1744|0;c[P>>2]=0;Q=b|0;do{if((c[Q>>2]&1|0)!=0){N=_x(d,0,37792)|0;ey(N,35104,J,1)|0;gy(N,34856,K,0)|0;gy(N,37544,L,0)|0;N=c[K>>2]|0;M=(c[L>>2]|0)!=0?35680:35400;cx(2,34616,34304,(fa=i,i=i+24|0,c[fa>>2]=c[J>>2],c[fa+8>>2]=N,c[fa+16>>2]=M,fa)|0);i=fa;M=Yd()|0;c[P>>2]=M;if((M|0)==0){break}$d(M,c[J>>2]|0,c[K>>2]|0)|0;ae(c[P>>2]|0,c[L>>2]|0);Zd(c[P>>2]|0,la,330);_d(c[P>>2]|0,ha,20);gp(la,c[P>>2]|0,142);fp(la,c[P>>2]|0,164)}}while(0);P=b+1748|0;c[P>>2]=0;L=b+1756|0;c[L>>2]=0;K=b+1752|0;c[K>>2]=0;do{if((c[Q>>2]&6|0)!=0){J=_x(d,0,38328)|0;gy(J,38016,G,1)|0;gy(J,37792,H,1)|0;gy(J,37544,I,0)|0;cx(2,37264,37032,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa;J=Sc()|0;c[P>>2]=J;if((J|0)==0){ax(0,36824,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa;break}M=la;Tc(J,M,250);Uc(c[P>>2]|0,M,20);Vc(c[P>>2]|0,ha,200);do{if((c[G>>2]|0)!=0){cx(2,37264,36280,(fa=i,i=i+1|0,i=i+7&-8,c[fa>>2]=0,fa)|0);i=fa;M=pd()|0;c[L>>2]=M;if((M|0)==0){break}Wc(c[P>>2]|0,M|0)|0}}while(0);if((c[H>>2]|0)==0){break}cx(2,37264,35992,(fa=i,i=i+8|0,c[fa>>2]=(c[I>>2]|0)!=0?35680:35400,fa)|0);i=fa;M=id()|0;c[K>>2]=M;if((M|0)==0){break}$c(M,c[I>>2]|0);Wc(c[P>>2]|0,c[K>>2]|0)|0}}while(0);K=b+3484|0;c[K>>2]=Nw(d)|0;P=_x(d,0,41264)|0;I=b+1760|0;Gd(I);Hd(I,ha,218);Kd(I,c[K>>2]|0);cx(2,41048,40808,(fa=i,i=i+8|0,c[fa>>2]=13631488,fa)|0);i=fa;H=_x(P,0,43592)|0;if((H|0)!=0){L=0;G=H;do{ey(G,43592,D,L)|0;ey(G,40584,E,c[D>>2]|0)|0;hy(G,40280,F,0)|0;gy(G,40016,z,0)|0;gy(G,39784,A,0)|0;gy(G,39232,C,0)|0;gy(G,38944,B,0)|0;H=(c[z>>2]|0)!=0?400:800;la=c[A>>2]|0;Q=c[B>>2]|0;M=c[E>>2]|0;J=c[F>>2]|0;cx(2,41048,38576,(fa=i,i=i+48|0,c[fa>>2]=c[D>>2],c[fa+8>>2]=H,c[fa+16>>2]=la,c[fa+24>>2]=Q,c[fa+32>>2]=M,c[fa+40>>2]=(J|0)!=0?J:48296,fa)|0);i=fa;Id(I,(c[D>>2]|0)-1|0,(c[z>>2]|0)!=0?1:2)|0;Ld(I,(c[D>>2]|0)-1|0,c[E>>2]|0);Md(I,(c[D>>2]|0)-1|0,c[F>>2]|0);Od(I,(c[D>>2]|0)-1|0,c[A>>2]|0);Pd(I,(c[D>>2]|0)-1|0,c[B>>2]|0);if((c[C>>2]|0)!=0){Td(I,(c[D>>2]|0)-1|0)}L=(c[D>>2]|0)+1|0;G=_x(P,G,43592)|0;}while((G|0)!=0)}G=_x(d,0,45448)|0;do{if((G|0)!=0){dy(G,58072,t,5767168)|0;dy(G,45112,u,524288)|0;P=c[u>>2]|0;cx(2,44792,44440,(fa=i,i=i+16|0,c[fa>>2]=c[t>>2],c[fa+8>>2]=P,fa)|0);i=fa;P=b+2088|0;zf(P);Af(P,c[K>>2]|0);D=$p(c[t>>2]|0,c[u>>2]|0,0)|0;if((D|0)==0){break}hq(D,P,28,8,0,36,32,0);vq(c[_>>2]|0,D,1);D=_x(G,0,44136)|0;if((D|0)==0){break}else{oa=D}do{ey(oa,43840,v,0)|0;ey(oa,43592,w,0)|0;hy(oa,43224,x,42928)|0;hy(oa,42304,y,41960)|0;D=c[w>>2]|0;L=c[x>>2]|0;I=c[y>>2]|0;cx(2,44792,41584,(fa=i,i=i+32|0,c[fa>>2]=c[v>>2],c[fa+8>>2]=D,c[fa+16>>2]=L,c[fa+24>>2]=I,fa)|0);i=fa;Bf(P,c[v>>2]|0,c[w>>2]|0);Cf(P,c[v>>2]|0,c[x>>2]|0);Df(P,c[v>>2]|0,c[y>>2]|0);oa=_x(G,oa,44136)|0;}while((oa|0)!=0)}}while(0);oa=q|0;q=_x(d,0,47632)|0;ey(q,47312,r,30)|0;gy(q,47032,p,0)|0;G=b+2424|0;kg(G,(q|0)!=0|0);lg(G,c[_>>2]|0);mg(G,c[K>>2]|0);a[b+2484|0]=c[p>>2];if((q|0)!=0){if((c[15672]&1|0)==0){cb(oa|0,46728,(fa=i,i=i+8|0,c[fa>>2]=1,fa)|0)|0;i=fa;ey(q,oa,s,c[r>>2]|0)|0;pa=c[s>>2]|0}else{p=c[15674]|0;c[s>>2]=p;pa=p}og(G,0,pa);pa=c[s>>2]|0;cx(2,46472,45776,(fa=i,i=i+16|0,c[fa>>2]=1,c[fa+8>>2]=pa,fa)|0);i=fa;if((c[15672]&2|0)==0){cb(oa|0,46728,(fa=i,i=i+8|0,c[fa>>2]=2,fa)|0)|0;i=fa;ey(q,oa,s,c[r>>2]|0)|0;qa=c[s>>2]|0}else{pa=c[15675]|0;c[s>>2]=pa;qa=pa}og(G,1,qa);qa=c[s>>2]|0;cx(2,46472,45776,(fa=i,i=i+16|0,c[fa>>2]=2,c[fa+8>>2]=qa,fa)|0);i=fa;if((c[15672]&4|0)==0){cb(oa|0,46728,(fa=i,i=i+8|0,c[fa>>2]=3,fa)|0)|0;i=fa;ey(q,oa,s,c[r>>2]|0)|0;ra=c[s>>2]|0}else{qa=c[15676]|0;c[s>>2]=qa;ra=qa}og(G,2,ra);ra=c[s>>2]|0;cx(2,46472,45776,(fa=i,i=i+16|0,c[fa>>2]=3,c[fa+8>>2]=ra,fa)|0);i=fa;if((c[15672]&8|0)==0){cb(oa|0,46728,(fa=i,i=i+8|0,c[fa>>2]=4,fa)|0)|0;i=fa;ey(q,oa,s,c[r>>2]|0)|0;sa=c[s>>2]|0}else{r=c[15677]|0;c[s>>2]=r;sa=r}og(G,3,sa);sa=c[s>>2]|0;cx(2,46472,45776,(fa=i,i=i+16|0,c[fa>>2]=4,c[fa+8>>2]=sa,fa)|0);i=fa}sa=b+2644|0;xg(sa);do{if((c[ga>>2]|0)!=0){s=_x(d,0,50832)|0;G=nq(c[ga>>2]|0)|0;r=G>>>0<768>>>0?0:G-768|0;c[m>>2]=r;dy(s,58072,m,r)|0;dy(s,50512,n,6e3)|0;hy(s,49560,o,0)|0;s=c[n>>2]|0;r=c[o>>2]|0;cx(2,49080,48688,(fa=i,i=i+24|0,c[fa>>2]=c[m>>2],c[fa+8>>2]=s,c[fa+16>>2]=(r|0)!=0?r:48296,fa)|0);i=fa;r=c[m>>2]|0;s=b+4644|0;c[s>>2]=r;c[b+4648>>2]=r-23552;r=jq(c[ga>>2]|0)|0;yg(sa,r+(c[s>>2]|0)|0);zg(sa,c[n>>2]|0);s=c[o>>2]|0;if((s|0)==0){break}if((Cg(sa,s)|0)==0){break}ax(0,47904,(fa=i,i=i+8|0,c[fa>>2]=c[o>>2],fa)|0);i=fa}}while(0);o=Qw(d,c[15590]|0)|0;c[$>>2]=o;if((o|0)!=0){kz(o,ha,76);lz(c[$>>2]|0,ha,34);mz(c[$>>2]|0,ha,4)}if((c[ga>>2]|0)==0){ta=c[_>>2]|0;ua=Xw(ta,d)|0;va=c[$>>2]|0;wa=oz(va,30944,51256)|0;xa=b+4700|0;c[xa>>2]=0;ya=b+4704|0;c[ya>>2]=0;za=Bx(ya)|0;c[ea>>2]=0;i=e;return}o=_x(d,0,30936)|0;sa=nq(c[ga>>2]|0)|0;ga=sa>>>0<22784>>>0?0:sa-22784|0;dy(o,58072,f,ga)|0;ey(o,57280,g,512)|0;ey(o,56088,h,342)|0;dy(o,55320,k,0)|0;dy(o,54656,l,16777215)|0;ey(o,53960,j,1e3)|0;o=c[g>>2]|0;sa=c[h>>2]|0;n=((c[j>>2]|0)>>>0)/10|0;cx(2,53392,52504,(fa=i,i=i+32|0,c[fa>>2]=c[f>>2],c[fa+8>>2]=o,c[fa+16>>2]=sa,c[fa+24>>2]=n,fa)|0);i=fa;fa=c[f>>2]|0;f=b+4636|0;c[f>>2]=fa;if((ga|0)==(fa|0)&fa>>>0>32767>>>0){c[b+4640>>2]=ga-32768}else{c[b+4640>>2]=fa}fa=Gg(c[g>>2]|0,c[h>>2]|0)|0;c[aa>>2]=fa;if((fa|0)==0){ta=c[_>>2]|0;ua=Xw(ta,d)|0;va=c[$>>2]|0;wa=oz(va,30944,51256)|0;xa=b+4700|0;c[xa>>2]=0;ya=b+4704|0;c[ya>>2]=0;za=Bx(ya)|0;c[ea>>2]=0;i=e;return}Hg(fa,ha,240);re(b,c[f>>2]|0);ha=c[$>>2]|0;if((ha|0)!=0){Jg(c[aa>>2]|0,ha);jz(c[$>>2]|0,512,342)|0}Kg(c[aa>>2]|0,c[k>>2]|0,c[l>>2]|0);Lg(c[aa>>2]|0,((((c[j>>2]|0)*255|0)+500|0)>>>0)/1e3|0);if((ca((c[g>>2]|0)>>>3,c[h>>2]|0)|0)==0){ta=c[_>>2]|0;ua=Xw(ta,d)|0;va=c[$>>2]|0;wa=oz(va,30944,51256)|0;xa=b+4700|0;c[xa>>2]=0;ya=b+4704|0;c[ya>>2]=0;za=Bx(ya)|0;c[ea>>2]=0;i=e;return}else{Aa=0}do{Cq(c[_>>2]|0,(c[f>>2]|0)+Aa|0,-1);Aa=Aa+1|0;}while(Aa>>>0<(ca((c[g>>2]|0)>>>3,c[h>>2]|0)|0)>>>0);ta=c[_>>2]|0;ua=Xw(ta,d)|0;va=c[$>>2]|0;wa=oz(va,30944,51256)|0;xa=b+4700|0;c[xa>>2]=0;ya=b+4704|0;c[ya>>2]=0;za=Bx(ya)|0;c[ea>>2]=0;i=e;return}function ie(a){a=a|0;var b=0;c[a+4700>>2]=0;b=a+4704|0;c[b>>2]=0;Bx(b)|0;c[a+4696>>2]=0;return}function je(a){a=a|0;var b=0,c=0,d=0;b=Mz(4736)|0;c=b;if((b|0)==0){d=0}else{he(c,a);d=c}return d|0}function ke(b,d){b=b|0;d=d|0;var e=0;e=(d|0)!=0;a[b+4676|0]=e&1;if(e){return}c[b+4700>>2]=0;e=b+4704|0;c[e>>2]=0;Bx(e)|0;c[b+4696>>2]=0;return}function le(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if(b>>>0>1>>>0){i=e;return}c[a+4688+(b<<2)>>2]=d;d=c[a+4688>>2]|0;b=c[a+4692>>2]|0;if((b|0)==0){f=d}else{f=(d|0)==0|b>>>0<d>>>0?b:d}d=a+4684|0;if((f|0)==(c[d>>2]|0)){i=e;return}He(31040,(b=i,i=i+8|0,c[b>>2]=f,b)|0);i=b;tf(a+1428|0,(f|0)!=1|0);c[d>>2]=f;f=a+4696|0;c[f>>2]=0;c[a+4700>>2]=0;d=a+4704|0;c[d>>2]=0;Bx(d)|0;c[f>>2]=0;i=e;return}function me(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+3480>>2]|0;if((e|0)==0){f=1;return f|0}f=oz(e,b,d)|0;return f|0}function ne(a,b){a=a|0;b=b|0;var d=0;if((Qa(b|0,43472)|0)==0){Hj(c[a+4>>2]|0);d=0;return d|0}if((Qa(b|0,40176)|0)==0){Ij(c[a+4>>2]|0);d=0;return d|0}if((Qa(b|0,37176)|0)!=0){d=1;return d|0}Jj(c[a+4>>2]|0);d=0;return d|0}function oe(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=b+4632|0;if((c[e>>2]|0)!=0){i=d;return}c[e>>2]=1;He(34144,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0);i=f;a[b+4652|0]=0;Rz(b+4656|0,0,14)|0;do{if((c[b>>2]&1|0)==0){Me(b,0);f=b+16|0;g=c[f>>2]|0;if((g|0)==0){break}if((c[g+40>>2]|0)>>>0<=7>>>0){break}h=b+4|0;j=c[h>>2]|0;k=rq(g,0)|0;if((c[j+36>>2]|0)>>>0>3>>>0){g=j+32|0;a[c[g>>2]|0]=k>>>24;a[(c[g>>2]|0)+1|0]=k>>>16;a[(c[g>>2]|0)+2|0]=k>>>8;a[(c[g>>2]|0)+3|0]=k}else{pc[c[j+28>>2]&63](c[j+4>>2]|0,0,k)}k=c[h>>2]|0;h=rq(c[f>>2]|0,4)|0;if((c[k+36>>2]|0)>>>0>7>>>0){f=k+32|0;a[(c[f>>2]|0)+4|0]=h>>>24;a[(c[f>>2]|0)+5|0]=h>>>16;a[(c[f>>2]|0)+6|0]=h>>>8;a[(c[f>>2]|0)+7|0]=h;break}else{pc[c[k+28>>2]&63](c[k+4>>2]|0,4,h);break}}else{Me(b,1)}}while(0);h=b+36|0;vp(h);a[b+4624|0]=-9;k=b+4625|0;a[k]=-1;mp(h,-9);np(h,a[k]|0);sg(b+2424|0);If(b+2088|0);Wp(b+128|0);k=c[b+1748>>2]|0;if((k|0)!=0){Xc(k)}jk(c[b+4>>2]|0);c[b+4700>>2]=0;k=b+4704|0;c[k>>2]=0;Bx(k)|0;c[b+4696>>2]=0;c[e>>2]=0;i=d;return}function pe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;if((d|0)==0){f=c[(c[b+4>>2]|0)+372>>2]|0;g=(f|0)==0?1:f}else{g=d}d=c[b+4684>>2]|0;if((d|0)==0){h=(c[b+4696>>2]|0)+g|0;j=1}else{h=g;j=d}lk(c[b+4>>2]|0,h);Eg(b+2644|0,h);h=b+4712|0;d=_z(c[h>>2]|0,c[h+4>>2]|0,g,0)|0;c[h>>2]=d;c[h+4>>2]=G;h=b+4720|0;d=(c[h>>2]|0)+g|0;c[h>>2]=d;g=b+4724|0;f=c[g>>2]|0;if(d>>>0<j>>>0){k=f}else{l=f;f=d;do{l=l+1|0;f=f-j|0;}while(f>>>0>=j>>>0);c[g>>2]=l;c[h>>2]=f;k=l}if(k>>>0<10>>>0){i=e;return}l=(k>>>0)/10|0;k=b+36|0;wp(k,l);f=b+1748|0;h=c[f>>2]|0;j=l*10|0;if((h|0)!=0){Zc(h,j)}Xd(b+1760|0,l);c[g>>2]=(c[g>>2]|0)-j;g=b+4728|0;l=(c[g>>2]|0)+j|0;c[g>>2]=l;if(l>>>0<256>>>0){i=e;return}Ng(c[b+3476>>2]|0,l);hg(b+3488|0,c[g>>2]|0);hg(b+4056|0,c[g>>2]|0);l=c[b+1744>>2]|0;if((l|0)!=0){ee(l,c[g>>2]|0)}l=b+4732|0;j=(c[l>>2]|0)+(c[g>>2]|0)|0;c[l>>2]=j;c[g>>2]=0;if(j>>>0<8192>>>0){i=e;return}j=c[b+3480>>2]|0;if((j|0)!=0){xz(j)}do{if((c[f>>2]|0)==0){j=b+4656|0;g=c[j>>2]|0;if((g+1|0)>>>0>2>>>0){h=b+4668|0;d=b+4625|0;m=a[d]|0;n=(a[h]|0)==0?m|16:m&-17;a[d]=n;if((g|0)>0){m=n^16;a[d]=m;o=g-2|0;p=m}else{o=g+2|0;p=n}c[j>>2]=o;np(k,p);Pp(b+128|0,a[h]|0);a[h]=(a[h]|0)==0|0}h=b+4660|0;j=c[h>>2]|0;if((j+1|0)>>>0<=2>>>0){break}n=b+4669|0;g=b+4625|0;m=a[g]|0;d=(a[n]|0)==0?m|32:m&-33;a[g]=d;if((j|0)>0){q=j-2|0;r=d}else{m=d^32;a[g]=m;q=j+2|0;r=m}c[h>>2]=q;np(k,r);Qp(b+128|0,a[n]|0);a[n]=(a[n]|0)==0|0}}while(0);yf(b+1428|0,c[l>>2]|0);r=b+4700|0;k=(c[r>>2]|0)+(c[l>>2]|0)|0;c[r>>2]=k;do{if(k>>>0>31333>>>0){c[r>>2]=k-31334;q=Bx(b+4704|0)|0;do{if(q>>>0<4e3>>>0){p=b+4708|0;o=(c[p>>2]|0)+(4e3-q)|0;c[p>>2]=o;if((o|0)<=0){s=o;t=p;break}p=b+4696|0;c[p>>2]=(c[p>>2]|0)+1;u=o;v=35}else{o=b+4708|0;p=(c[o>>2]|0)+(4e3-q)|0;c[o>>2]=p;if((p|0)>=0){u=p;v=35;break}o=b+4696|0;f=c[o>>2]|0;if((f|0)==0){u=p;v=35;break}c[o>>2]=f-1;u=p;v=35}}while(0);do{if((v|0)==35){q=b+4708|0;if((u|0)<=9999){s=u;t=q;break}Ax(u)|0;s=c[q>>2]|0;t=q}}while(0);if((s|0)>=-1e6){break}He(31960,(q=i,i=i+1|0,i=i+7&-8,c[q>>2]=0,q)|0);i=q;c[t>>2]=(c[t>>2]|0)+1e6}}while(0);c[l>>2]=0;i=e;return}function qe(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+376|0;g=f|0;if(e<<24>>24==0){i=f;return}e=b+36|0;kp(e,0);kp(e,1);Dg(b+2644|0);e=b+8|0;h=b+4644|0;j=0;while(1){k=j+1|0;a[g+j|0]=yq(c[e>>2]|0,k+(c[h>>2]|0)|0)|0;if(k>>>0<370>>>0){j=k}else{break}}if((c[b>>2]&4|0)==0){Sd(b+1760|0,g|0,370);i=f;return}j=(d[7064+(a[g|0]&63)|0]|0)*370|0;if(j>>>0<370>>>0){l=1}else{l=j>>>0>11839>>>0?31:(j>>>0)/370|0}j=(((((31-l|0)*223|0)+15|0)>>>0)/30|0)+32|0;l=c[b+3476>>2]|0;if((l|0)==0){i=f;return}if((c[l+28>>2]|0)==(j|0)){i=f;return}Lg(l,j);i=f;return}function re(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a+12|0;do{if((nq(c[d>>2]|0)|0)>>>0>b>>>0){e=(jq(c[d>>2]|0)|0)+b|0}else{f=xq(c[a+8>>2]|0,b)|0;if((f|0)!=0){g=jq(f)|0;h=lq(f)|0;e=g+(h-(c[a+4636>>2]|0))|0;break}Ig(c[a+3476>>2]|0,0);return}}while(0);Ig(c[a+3476>>2]|0,e);return}function se(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((b|0)==3){Dd(a,d)|0;return}e=c[a+1744>>2]|0;if((e|0)!=0){be(e,b,d)}e=c[a+1752>>2]|0;if((e|0)==0){return}bd(e,b,d);return}function te(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=b+4676|0;if((a[g]|0)!=0){if((f|0)==0){return}a[g]=0;c[b+4700>>2]=0;g=b+4704|0;c[g>>2]=0;Bx(g)|0;c[b+4696>>2]=0;return}g=c[b+1756>>2]|0;if((g|0)!=0){jd(g,f,d,e);return}g=b+4664|0;if(((f&2^2)&(c[g>>2]^f)|0)!=0){oz(c[b+3480>>2]|0,51864,51344)|0}h=b+4625|0;i=a[h]|0;j=(f&1|0)==0?i|8:i&-9;a[h]=j;if(j<<24>>24!=i<<24>>24){np(b+36|0,j)}j=b+4656|0;c[j>>2]=(c[j>>2]|0)+d;d=b+4660|0;c[d>>2]=(c[d>>2]|0)+e;c[g>>2]=f;return}function ue(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;e=b<<24>>24!=0;b=e?4:0;c[a+4692>>2]=b;f=c[a+4688>>2]|0;if(e){g=(f|0)==0|b>>>0<f>>>0?b:f}else{g=f}f=a+4684|0;if((g|0)==(c[f>>2]|0)){i=d;return}He(31040,(b=i,i=i+8|0,c[b>>2]=g,b)|0);i=b;tf(a+1428|0,(g|0)!=1|0);c[f>>2]=g;g=a+4696|0;c[g>>2]=0;c[a+4700>>2]=0;f=a+4704|0;c[f>>2]=0;Bx(f)|0;c[g>>2]=0;i=d;return}function ve(b,c){b=b|0;c=c|0;var d=0,e=0,f=0;d=b+4625|0;e=a[d]|0;f=c<<24>>24==0?e|8:e&-9;a[d]=f;np(b+36|0,f);return}function we(b,c){b=b|0;c=c|0;var d=0,e=0,f=0;d=b+4625|0;e=a[d]|0;f=c<<24>>24==0?e&-2:e|1;a[d]=f;np(b+36|0,f);return}function xe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=b+4652|0;f=a[e]|0;g=d<<24>>24==0?f&-5:f|4;a[e]=g;e=g&255;g=0;while(1){f=e>>>1;if((f|0)==0){break}else{e=f;g=g+1|0}}ik(c[b+4>>2]|0,g);return}function ye(a,b){a=a|0;b=b|0;var c=0;if((b|0)==2097144){c=Ip(a+128|0)|0}else if((b|0)==2097150){c=Lp(a+128|0)|0}else if((b|0)==2097146){c=Hp(a+128|0)|0}else if((b|0)==2097148){c=Mp(a+128|0)|0}else{c=-1}return c|0}function ze(a,b,c){a=a|0;b=b|0;c=c|0;if((b|0)==4194299){Jp(a+128|0,c);return}else if((b|0)==4194297){Kp(a+128|0,c);return}else if((b|0)==4194301){Op(a+128|0,c);return}else if((b|0)==4194303){Np(a+128|0,c);return}else{return}}function Ae(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=b+4652|0;f=a[e]|0;g=d<<24>>24==0?f&-3:f|2;a[e]=g;e=g&255;g=0;while(1){f=e>>>1;if((f|0)==0){break}else{e=f;g=g+1|0}}ik(c[b+4>>2]|0,g);return}function Be(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=b;g=b+4624|0;h=a[g]|0;j=d&255;if(h<<24>>24==d<<24>>24){i=e;return}a[g]=d;g=(h^d)&255;do{if((g&16|0)!=0){h=c[b>>2]|0;if((h&1|0)!=0){Me(f,j>>>4&1);break}if((h&6|0)==0){break}Qd(b+1760|0,(d&255)>>>4&1)}}while(0);if((g&32|0)!=0){Rd(b+1760|0,(d&255)>>>5&1)}if((g&64|0)!=0){if((j&64|0)==0){He(30912,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;l=b+4640|0}else{He(31e3,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;l=b+4636|0}re(f,c[l>>2]|0)}do{if((g&8|0)!=0){if((c[b>>2]&1|0)==0){break}l=jq(c[b+12>>2]|0)|0;if((j&8|0)==0){He(30552,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;m=b+4648|0}else{He(30672,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;m=b+4644|0}yg(b+2644|0,l+(c[m>>2]|0)|0)}}while(0);if((g&7|0)==0){i=e;return}Ag(b+2644|0,j&7);i=e;return}function Ce(b,d){b=b|0;d=d|0;var e=0,f=0;e=b+4625|0;f=a[e]|0;if(f<<24>>24==d<<24>>24){return}a[e]=d;xf(b+1428|0,d);if((f^d)<<24>>24<0){Bg(b+2644|0,(d&255)>>>7&255^1)}f=c[b+1748>>2]|0;if((f|0)==0){return}Yc(f,(d&255)>>>4&3);return}function De(a,b){a=a|0;b=b|0;if(b<<24>>24==0){return}oe(a);return}function Ee(a){a=a|0;c[15594]=1;return}function Fe(a){a=a|0;Cx(0,1);a=c[q>>2]|0;Ca(51600,32,1,a|0)|0;ya(a|0)|0;a=c[15592]|0;if((a|0)==0){bb(1)}if((c[a+4>>2]|0)==0){bb(1)}qd(a,56248);bb(1)}function Ge(a){a=a|0;var b=0,d=0;Cx(0,1);b=c[q>>2]|0;Xb(b|0,49792,(d=i,i=i+8|0,c[d>>2]=a,d)|0)|0;i=d;ya(b|0)|0;bb(1)}function He(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d|0;f=c[15592]|0;if((f|0)==0){g=0}else{g=(Rj(c[f+4>>2]|0,0)|0)&16777215}ax(3,45928,(f=i,i=i+8|0,c[f>>2]=g,f)|0);i=f;f=e;c[f>>2]=b;c[f+4>>2]=0;bx(3,a,e|0);i=d;return}function Ie(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,r=0,s=0,t=0;d=i;i=i+8|0;e=d|0;Yw();f=c[q>>2]|0;Zw(f,0,2)|0;g=Yx(0)|0;c[15678]=g;if((g|0)==0){h=1;i=d;return h|0}iy(62664);$w(f,3);g=Jw(a,b,e,7128)|0;do{if((g|0)==-1){ax(2,52312,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0);i=j;k=42456;l=26}else{m=42456;n=g;a:while(1){if((n|0)<0){h=1;l=30;break}switch(n|0){case 116:{c[15590]=c[c[e>>2]>>2];r=m;break};case 73:{jy(62664,c[c[e>>2]>>2]|0,33480,0)|0;r=m;break};case 115:{jy(62664,57928,c[c[e>>2]>>2]|0,33480)|0;r=m;break};case 113:{$w(f,0);r=m;break};case 86:{l=7;break a;break};case 112:{jy(62664,31680,c[c[e>>2]>>2]|0,30720)|0;r=m;break};case 99:{r=c[c[e>>2]>>2]|0;break};case 108:{_w(c[c[e>>2]>>2]|0,3)|0;r=m;break};case 63:{l=6;break a;break};case 98:{c[15672]=c[15672]|1;c[15674]=xa(c[c[e>>2]>>2]|0,0,0)|0;r=m;break};case 66:{s=xa(c[c[e>>2]>>2]|0,0,0)|0;if((s|0)==0|s>>>0>3>>>0){l=10;break a}t=s-1|0;c[15672]=c[15672]|1<<t;c[62696+(t<<2)>>2]=xa(c[(c[e>>2]|0)+4>>2]|0,0,0)|0;r=m;break};case 100:{tx(c[c[e>>2]>>2]|0)|0;r=m;break};case 105:{if((Fx(c[15678]|0,c[c[e>>2]>>2]|0)|0)==0){r=m}else{l=15;break a}break};case 118:{$w(f,3);r=m;break};case 114:case 82:{r=m;break};case 0:{l=24;break a;break};default:{h=1;l=30;break a}}t=Jw(a,b,e,7128)|0;if((t|0)==-1){l=25;break}else{m=r;n=t}}if((l|0)==6){Iw(51216,50720,7128);ya(c[o>>2]|0)|0;h=0;i=d;return h|0}else if((l|0)==7){n=c[o>>2]|0;Ca(51728,93,1,n|0)|0;ya(n|0)|0;h=0;i=d;return h|0}else if((l|0)==10){Xb(f|0,39336,(j=i,i=i+16|0,c[j>>2]=c[b>>2],c[j+8>>2]=s,j)|0)|0;i=j;h=1;i=d;return h|0}else if((l|0)==15){n=c[c[e>>2]>>2]|0;Xb(f|0,36408,(j=i,i=i+16|0,c[j>>2]=c[b>>2],c[j+8>>2]=n,j)|0)|0;i=j;h=1;i=d;return h|0}else if((l|0)==24){n=c[c[e>>2]>>2]|0;Xb(f|0,57072,(j=i,i=i+16|0,c[j>>2]=c[b>>2],c[j+8>>2]=n,j)|0)|0;i=j;h=1;i=d;return h|0}else if((l|0)==25){ax(2,52312,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0);i=j;if((r|0)==0){break}else{k=r;l=26;break}}else if((l|0)==30){i=d;return h|0}}}while(0);do{if((l|0)==26){cx(2,54520,53840,(j=i,i=i+8|0,c[j>>2]=k,j)|0);i=j;if((Jx(c[15678]|0,k)|0)==0){break}ax(0,53224,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0);i=j;h=1;i=d;return h|0}}while(0);j=_x(c[15678]|0,0,55912)|0;k=(j|0)==0?c[15678]|0:j;if((ky(62664,k,1)|0)==0){Ua(2)|0;lb(0)|0;vx(k)|0;Na(2,208)|0;Na(11,12)|0;Na(15,406)|0;Hw(c[p>>2]|0,c[o>>2]|0);c[15592]=je(k)|0;dx(62400);fx(62400,10,c[15592]|0);gx(62400,76,c[15592]|0);hx(62400,c[(c[15592]|0)+8>>2]|0,26);ix(62400,c[(c[15592]|0)+8>>2]|0,24);jx(62400,0);zw(c[15592]|0,20,80);yd(c[15592]|0,62400);oe(c[15592]|0);ud(c[15592]|0);bb(1);return 0}else{h=1;i=d;return h|0}return 0}function Je(){Cx(0,1);return}function Ke(a,b,d){a=a|0;b=b|0;d=d|0;return(Tj(c[a+4>>2]|0,b,d)|0)!=0|0}function Le(a,b,d){a=a|0;b=b|0;d=d|0;return(Uj(c[a+4>>2]|0,b,d)|0)!=0|0}function Me(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a+4628|0;e=(b|0)!=0;if((c[d>>2]|0)==(e&1|0)){return}b=a+8|0;f=c[b>>2]|0;if(e){wq(f,c[a+12>>2]|0);vq(c[b>>2]|0,c[a+24>>2]|0,0);vq(c[b>>2]|0,c[a+20>>2]|0,0);Dj(c[a+4>>2]|0,0,0);c[d>>2]=1;return}else{wq(f,c[a+24>>2]|0);wq(c[b>>2]|0,c[a+20>>2]|0);f=a+12|0;vq(c[b>>2]|0,c[f>>2]|0,0);b=c[a+4>>2]|0;a=jq(c[f>>2]|0)|0;Dj(b,a,nq(c[f>>2]|0)|0);c[d>>2]=0;return}}function Ne(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;do{if(b>>>0<4194304>>>0){d=c[a+12>>2]|0;if((d|0)==0){break}e=nq(d)|0;if((e|0)==0){break}d=(b>>>0)%(e>>>0)|0;if((d|0)!=(b|0)){f=d;g=9}}else{if(b>>>0>=5767168>>>0){break}d=c[a+16>>2]|0;if((d|0)==0){break}e=nq(d)|0;if((e|0)==0){break}d=((b>>>0)%(e>>>0)|0)+4194304|0;if((d|0)!=(b|0)){f=d;g=9}}}while(0);if((g|0)==9){h=yq(c[a+8>>2]|0,f)|0;return h|0}if((b-5767168|0)>>>0<524288>>>0){h=0;return h|0}f=b-12582912|0;if(f>>>0<2097152>>>0){h=Ud(a+1760|0,f)|0;return h|0}else{h=(b&15728640|0)==13631488?-86:0;return h|0}return 0}function Oe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;do{if(b>>>0<4194304>>>0){d=c[a+12>>2]|0;if((d|0)==0){e=0;break}f=nq(d)|0;if((f|0)==0){e=0;break}d=(b>>>0)%(f>>>0)|0;if((d|0)==(b|0)){e=0}else{g=d;h=9}}else{if(b>>>0>=5767168>>>0){e=0;break}d=c[a+16>>2]|0;if((d|0)==0){e=0;break}f=nq(d)|0;if((f|0)==0){e=0;break}d=((b>>>0)%(f>>>0)|0)+4194304|0;if((d|0)==(b|0)){e=0}else{g=d;h=9}}}while(0);if((h|0)==9){e=zq(c[a+8>>2]|0,g)|0}return e|0}function Pe(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;do{if(b>>>0<4194304>>>0){d=c[a+12>>2]|0;if((d|0)==0){e=0;break}f=nq(d)|0;if((f|0)==0){e=0;break}d=(b>>>0)%(f>>>0)|0;if((d|0)==(b|0)){e=0}else{g=d;h=9}}else{if(b>>>0>=5767168>>>0){e=0;break}d=c[a+16>>2]|0;if((d|0)==0){e=0;break}f=nq(d)|0;if((f|0)==0){e=0;break}d=((b>>>0)%(f>>>0)|0)+4194304|0;if((d|0)==(b|0)){e=0}else{g=d;h=9}}}while(0);if((h|0)==9){e=Aq(c[a+8>>2]|0,g)|0}return e|0}function Qe(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;do{if(b>>>0<4194304>>>0){e=c[a+12>>2]|0;if((e|0)==0){return}f=nq(e)|0;if((f|0)==0){return}e=(b>>>0)%(f>>>0)|0;if((e|0)!=(b|0)){g=e;h=9;break}return}else{if(b>>>0>=5767168>>>0){i=b;break}e=c[a+16>>2]|0;if((e|0)==0){i=b;break}f=nq(e)|0;if((f|0)==0){i=b;break}e=((b>>>0)%(f>>>0)|0)+4194304|0;if((e|0)==(b|0)){i=b}else{g=e;h=9}}}while(0);if((h|0)==9){Cq(c[a+8>>2]|0,g,d);i=g}if(!((i-5767168|0)>>>0>524287>>>0&i>>>0>12582911>>>0&i>>>0<14680064>>>0)){return}Wd(a+1760|0,i-12582912|0,d);return}function Re(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;do{if(b>>>0<4194304>>>0){e=c[a+12>>2]|0;if((e|0)==0){return}f=nq(e)|0;if((f|0)==0){return}e=(b>>>0)%(f>>>0)|0;if((e|0)!=(b|0)){g=e;break}return}else{if(b>>>0>=5767168>>>0){return}e=c[a+16>>2]|0;if((e|0)==0){return}f=nq(e)|0;if((f|0)==0){return}e=((b>>>0)%(f>>>0)|0)+4194304|0;if((e|0)!=(b|0)){g=e;break}return}}while(0);Dq(c[a+8>>2]|0,g,d);return}function Se(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;do{if(b>>>0<4194304>>>0){e=c[a+12>>2]|0;if((e|0)==0){return}f=nq(e)|0;if((f|0)==0){return}e=(b>>>0)%(f>>>0)|0;if((e|0)!=(b|0)){g=e;break}return}else{if(b>>>0>=5767168>>>0){return}e=c[a+16>>2]|0;if((e|0)==0){return}f=nq(e)|0;if((f|0)==0){return}e=((b>>>0)%(f>>>0)|0)+4194304|0;if((e|0)!=(b|0)){g=e;break}return}}while(0);Eq(c[a+8>>2]|0,g,d);return}function Te(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=(a|0)==0?c[15592]|0:a;if((b|0)==0){f=1;return f|0}a=(d|0)==0?62872:d;d=6400;while(1){g=c[d>>2]|0;if((g|0)==0){break}if((mx(g,b)|0)==0){d=d+8|0}else{h=5;break}}if((h|0)==5){f=oc[c[d+4>>2]&127](e,b,a)|0;return f|0}d=c[e+3480>>2]|0;do{if((d|0)!=0){e=oz(d,b,a)|0;if((e|0)>-1){f=e}else{break}return f|0}}while(0);f=1;return f|0}function Ue(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;b=i;if((ne(a,d)|0)==0){e=0;i=b;return e|0}ax(0,41472,(a=i,i=i+8|0,c[a>>2]=d,a)|0);i=a;e=1;i=b;return e|0}function Ve(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;i=i+8|0;e=b|0;if((nx(d,e)|0)==0){le(a,0,c[e>>2]|0);f=0}else{f=1}i=b;return f|0}function We(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;b=i;i=i+8|0;e=b|0;if((ox(d,e)|0)!=0){f=1;i=b;return f|0}d=(c[e>>2]|0)+(c[a+4684>>2]|0)|0;g=(d|0)<1?1:d;c[e>>2]=g;le(a,0,g);f=0;i=b;return f|0}function Xe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;d=i;i=i+16|0;f=d|0;g=d+8|0;c[f>>2]=e;if((Qa(e|0,44056)|0)==0){ax(2,43752,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0);i=h;if((vr(c[b+3484>>2]|0)|0)==0){j=0;i=d;return j|0}ax(0,43496,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0);i=h;j=1;i=d;return j|0}e=b+3484|0;b=0;a:while(1){do{if((a[c[f>>2]|0]|0)==0){j=b;k=11;break a}if((rx(f,g,48176,47832)|0)!=0){break a}ax(2,42864,(h=i,i=i+8|0,c[h>>2]=c[g>>2],h)|0);i=h;}while((wr(c[e>>2]|0,c[g>>2]|0,42208,0)|0)==0);ax(0,41864,(h=i,i=i+8|0,c[h>>2]=c[g>>2],h)|0);i=h;b=1}if((k|0)==11){i=d;return j|0}ax(0,43096,(h=i,i=i+8|0,c[h>>2]=c[f>>2],h)|0);i=h;j=1;i=d;return j|0}function Ye(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+16|0;f=d|0;g=d+8|0;c[f>>2]=e;if((a[e]|0)==0){h=0;i=d;return h|0}e=b+3484|0;while(1){if((rx(f,g,48176,47832)|0)!=0){break}b=ur(c[e>>2]|0,c[g>>2]|0)|0;j=c[g>>2]|0;if((b|0)==0){ax(0,44640,(k=i,i=i+8|0,c[k>>2]=j,k)|0);i=k}else{ax(2,44320,(k=i,i=i+8|0,c[k>>2]=j,k)|0);i=k;tr(c[e>>2]|0,b)|0;cr(b)}if((a[c[f>>2]|0]|0)==0){h=0;l=9;break}}if((l|0)==9){i=d;return h|0}ax(0,45008,(k=i,i=i+8|0,c[k>>2]=c[f>>2],k)|0);i=k;h=1;i=d;return h|0}function Ze(a,b,d){a=a|0;b=b|0;d=d|0;return(Kw(c[a+3484>>2]|0,d,1)|0)!=0|0}function _e(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;i=i+8|0;e=b|0;if((nx(d,e)|0)!=0){f=1;i=b;return f|0}d=ur(c[a+3484>>2]|0,c[e>>2]|0)|0;if((d|0)==0){f=0;i=b;return f|0}ax(2,45344,(a=i,i=i+8|0,c[a>>2]=c[e>>2],a)|0);i=a;hr(d,1);f=0;i=b;return f|0}function $e(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;i=i+8|0;e=b|0;if((nx(d,e)|0)!=0){f=1;i=b;return f|0}d=ur(c[a+3484>>2]|0,c[e>>2]|0)|0;if((d|0)==0){f=0;i=b;return f|0}ax(2,45672,(a=i,i=i+8|0,c[a>>2]=c[e>>2],a)|0);i=a;hr(d,0);f=0;i=b;return f|0}function af(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;b=i;i=i+8|0;e=b|0;if((nx(d,e)|0)!=0){f=1;i=b;return f|0}d=c[e>>2]|0;if((d|0)==0){ax(2,46640,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0);i=g;h=a+1760|0;Od(h,0,1);Od(h,1,1);Od(h,2,1);f=0;i=b;return f|0}else{ax(2,46360,(g=i,i=i+8|0,c[g>>2]=d,g)|0);i=g;Od(a+1760|0,(c[e>>2]|0)-1|0,1);f=0;i=b;return f|0}return 0}function bf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;b=i;i=i+8|0;e=b|0;if((nx(d,e)|0)!=0){f=1;i=b;return f|0}d=c[e>>2]|0;if((d|0)==0){ax(2,47216,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0);i=g;h=a+1760|0;Od(h,0,0);Od(h,1,0);Od(h,2,0);f=0;i=b;return f|0}else{ax(2,46944,(g=i,i=i+8|0,c[g>>2]=d,g)|0);i=g;Od(a+1760|0,(c[e>>2]|0)-1|0,0);f=0;i=b;return f|0}return 0}function cf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;d=i;b=a+1760|0;a=Nd(b,0)|0;Fw(47512,(e=i,i=i+16|0,c[e>>2]=1,c[e+8>>2]=a,e)|0);i=e;a=Nd(b,1)|0;Fw(47512,(e=i,i=i+16|0,c[e>>2]=2,c[e+8>>2]=a,e)|0);i=e;a=Nd(b,2)|0;Fw(47512,(e=i,i=i+16|0,c[e>>2]=3,c[e+8>>2]=a,e)|0);i=e;i=d;return 0}function df(a,b,d){a=a|0;b=b|0;d=d|0;c[a+4680>>2]=2;kx(62400,1);return 0}function ef(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;i=i+8|0;e=b|0;if((px(d,e)|0)==0){ke(a,c[e>>2]|0);f=0}else{f=1}i=b;return f|0}function ff(b,c,d){b=b|0;c=c|0;d=d|0;ke(b,(a[b+4676|0]|0)==0|0);return 0}function gf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;b=i;i=i+8|0;e=b|0;if((px(d,e)|0)!=0){f=1;i=b;return f|0}le(a,0,(c[e>>2]|0)!=0|0);f=0;i=b;return f|0}function hf(a,b,d){a=a|0;b=b|0;d=d|0;if((c[a+4688>>2]|0)==0){le(a,0,1);return 0}else{le(a,0,0);return 0}return 0}function jf(a,b,c){a=a|0;b=b|0;c=c|0;oe(a);return 0}function kf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;b=i;i=i+16|0;e=b|0;f=b+8|0;c[e>>2]=d;if((rx(e,f,48176,47832)|0)!=0){g=1;i=b;return g|0}d=c[f>>2]|0;if(d>>>0>1>>>0){g=1;i=b;return g|0}g=(ag(a+3488+(d*568|0)|0,c[e>>2]|0)|0)!=0|0;i=b;return g|0}function lf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;b=i;i=i+16|0;e=b|0;f=b+8|0;c[e>>2]=d;if((rx(e,f,48176,47832)|0)!=0){g=1;i=b;return g|0}d=c[f>>2]|0;if(d>>>0>1>>>0){g=1;i=b;return g|0}g=(bg(a+3488+(d*568|0)|0,c[e>>2]|0)|0)!=0|0;i=b;return g|0}function mf(a,b,d){a=a|0;b=b|0;d=d|0;me(a,48984,48608)|0;c[a+4680>>2]=1;return 0}function nf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;b=i;i=i+8|0;e=b|0;if((nx(d,e)|0)!=0){f=1;i=b;return f|0}d=c[e>>2]|0;if(d>>>0>999>>>0){g=255}else{g=(d<<8>>>0)/1e3|0}c[e>>2]=g;Lg(c[a+3476>>2]|0,g);f=0;i=b;return f|0}function of(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;d=i;i=i+8|0;f=d|0;do{if((a[e]|0)==0){g=b+2424|0;if((a[b+2426|0]|0)==0){h=0;break}pg(g,1);pg(g,2);pg(g,3);h=0}else{if((nx(e,f)|0)!=0){h=1;break}if((a[b+2426|0]|0)==0){g=c[f>>2]|0;Td(b+1760|0,(g|0)==0?0:g-1|0);h=0;break}else{pg(b+2424|0,c[f>>2]|0);h=0;break}}}while(0);i=d;return h|0}function pf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=b;while(1){b=a[d]|0;if((b-48&255)>>>0<=9>>>0){e=d;f=0;g=b;h=4;break}if(b<<24>>24==0){i=0;j=d;break}else{d=d+1|0}}if((h|0)==4){while(1){h=0;d=(g<<24>>24)-48+(f*10|0)|0;b=e+1|0;k=a[b]|0;if((k-48&255)>>>0<10>>>0){e=b;f=d;g=k;h=4}else{i=d;j=b;break}}}g=j;while(1){j=a[g]|0;if((j-48&255)>>>0<=9>>>0){l=g;m=0;n=j;h=14;break}if(j<<24>>24==0){o=0;p=g;break}else{g=g+1|0}}if((h|0)==14){while(1){h=0;g=(n<<24>>24)-48+(m*10|0)|0;j=l+1|0;f=a[j]|0;if((f-48&255)>>>0<10>>>0){l=j;m=g;n=f;h=14}else{o=g;p=j;break}}}n=p;while(1){p=a[n]|0;if((p-48&255)>>>0<=9>>>0){q=n;r=0;s=p;h=18;break}if(p<<24>>24==0){t=0;u=n;break}else{n=n+1|0}}if((h|0)==18){while(1){h=0;n=(s<<24>>24)-48+(r*10|0)|0;p=q+1|0;m=a[p]|0;if((m-48&255)>>>0<10>>>0){q=p;r=n;s=m;h=18}else{t=n;u=p;break}}}s=u;while(1){u=a[s]|0;if((u-48&255)>>>0<=9>>>0){v=s;w=0;x=u;h=22;break}if(u<<24>>24==0){y=0;z=s;break}else{s=s+1|0}}if((h|0)==22){while(1){h=0;s=(x<<24>>24)-48+(w*10|0)|0;u=v+1|0;r=a[u]|0;if((r-48&255)>>>0<10>>>0){v=u;w=s;x=r;h=22}else{y=s;z=u;break}}}x=z;while(1){z=a[x]|0;if((z-48&255)>>>0<=9>>>0){A=x;B=0;C=z;h=26;break}if(z<<24>>24==0){D=0;E=x;break}else{x=x+1|0}}if((h|0)==26){while(1){h=0;x=(C<<24>>24)-48+(B*10|0)|0;z=A+1|0;w=a[z]|0;if((w-48&255)>>>0<10>>>0){A=z;B=x;C=w;h=26}else{D=x;E=z;break}}}C=E;while(1){E=a[C]|0;if((E-48&255)>>>0<=9>>>0){F=C;G=0;H=E;h=30;break}if(E<<24>>24==0){I=0;break}else{C=C+1|0}}if((h|0)==30){while(1){h=0;C=(H<<24>>24)-48+(G*10|0)|0;E=F+1|0;B=a[E]|0;if((B-48&255)>>>0<10>>>0){F=E;G=C;H=B;h=30}else{I=C;break}}}h=(o|0)==0?0:o-1|0;o=(t|0)==0?0:t-1|0;do{if(i>>>0<1904>>>0|h>>>0>11>>>0){J=0}else{t=i-1904|0;H=t&3;G=((t>>>2)*1461|0)+(H*365|0)+((H|0)!=0)|0;t=(H|0)==0?7704:7656;if((h|0)==0){K=G}else{H=G;G=0;while(1){F=(c[t+(G<<2)>>2]|0)+H|0;C=G+1|0;if(C>>>0<h>>>0){H=F;G=C}else{K=F;break}}}if((c[t+(h<<2)>>2]|0)>>>0<=o>>>0){J=0;break}J=(K+o|0)*86400|0}}while(0);if(y>>>0>23>>>0|D>>>0>59>>>0|I>>>0>59>>>0){L=0;M=L+J|0;return M|0}L=(((y*60|0)+D|0)*60|0)+I|0;M=L+J|0;return M|0}function qf(b){b=b|0;c[b+304>>2]=0;c[b+308>>2]=0;a[b+312|0]=0;Rz(b|0,0,258)|0;Rz(b+260|0,0,20)|0;Rz(b+283|0,0,18)|0;a[b+16|0]=-88;a[b+19|0]=34;a[b+30|0]=100;a[b+8|0]=24;a[b+9|0]=-120;a[b+11|0]=32;return}function rf(a,b,d){a=a|0;b=b|0;d=d|0;c[a+292>>2]=b;c[a+296>>2]=d;return}function sf(a,b,d){a=a|0;b=b|0;d=d|0;c[a+304>>2]=b;c[a+308>>2]=d;return}function tf(a,b){a=a|0;b=b|0;c[a+284>>2]=(b|0)!=0;return}function uf(b,c){b=b|0;c=c|0;var d=0,e=0;d=Za(c|0,46624)|0;if((d|0)==0){e=1;return e|0}c=(Ub(b|0,1,256,d|0)|0)==256;va(d|0)|0;if(!c){e=1;return e|0}a[b+256|0]=-128;a[b+257|0]=0;e=0;return e|0}function vf(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=hc(0)|0;c[a+260>>2]=f+2082844800;if((e|0)==0){e=((d[a+237|0]|0)<<8|(d[a+238|0]|0))<<8;g=e|(d[a+239|0]|0);c[a+264>>2]=-2082844800-f+b-((e&8388608|0)==0?g:g|-16777216);return}else{c[a+264>>2]=b;return}}function wf(a,b){a=a|0;b=b|0;var e=0,f=0,g=0;if((b|0)==0){c[a+260>>2]=(hc(0)|0)+2082844800;c[a+264>>2]=0;return}else{e=pf(b)|0;b=hc(0)|0;c[a+260>>2]=b+2082844800;f=((d[a+237|0]|0)<<8|(d[a+238|0]|0))<<8;g=f|(d[a+239|0]|0);c[a+264>>2]=e-2082844800-b-((f&8388608|0)==0?g:g|-16777216);return}}function xf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b+283|0;g=a[f]|0;h=e&255;a[f]=e;if((h&4|0)!=0){c[b+272>>2]=0;c[b+268>>2]=0;c[b+276>>2]=0;return}if(((h&2^2)&((g^e)&255)|0)==0){return}g=b+268|0;h=b+282|0;f=a[h]|0;if((c[g>>2]|0)!=0){i=(f&255)>>>7;a[b+300|0]=i;j=c[b+296>>2]|0;if((j|0)==0){k=f}else{nc[j&511](c[b+292>>2]|0,i);k=a[h]|0}a[h]=k<<1|(k&255)>>>7;k=b+276|0;i=(c[k>>2]|0)+1|0;c[k>>2]=i;if(i>>>0<=7>>>0){return}c[k>>2]=0;c[g>>2]=0;c[b+272>>2]=0;return}k=f<<1;f=k|e&1;a[h]=f;e=b+276|0;i=(c[e>>2]|0)+1|0;c[e>>2]=i;if(i>>>0<=7>>>0){return}i=b+272|0;j=c[i>>2]|0;do{if((j|0)==1){l=a[b+280|0]|0;m=l&255;do{if(l<<24>>24==53){a[b+256|0]=k&-128}else{if((a[b+256|0]|0)<0){break}if((m&227|0)==1){n=m>>>2<<3&24;o=b+260|0;c[o>>2]=c[o>>2]&~(255<<n)|(f&255)<<n;break}if((m&243|0)==33){a[b+(m>>>2&3|8)|0]=f;break}if(l<<24>>24==49){a[b+257|0]=f;break}if((m&195|0)!=65){break}a[b+(m>>>2&15|16)|0]=f}}while(0);c[i>>2]=0}else if((j|0)==2){a[b+281|0]=f;m=a[b+280|0]|0;if(m<<24>>24<0){a[h]=a[b+((m&255)<<5&224|(k&255)>>>2&31)|0]|0;c[i>>2]=0;c[g>>2]=1;break}else{c[i>>2]=3;break}}else if((j|0)==0){a[b+280|0]=f;m=f&255;if((m&120|0)==56){c[i>>2]=2;break}if((m&128|0)==0){c[i>>2]=1;break}l=m>>>2;do{if((m&227|0)==129){a[h]=(c[b+260>>2]|0)>>>((l<<3&24)>>>0)}else{if((m&243|0)==161){a[h]=a[b+(l&3|8)|0]|0;break}if((m&195|0)==193){a[h]=a[b+(l&15|16)|0]|0;break}else{a[h]=0;break}}}while(0);c[i>>2]=0;c[g>>2]=1}else if((j|0)==3){if((a[b+256|0]|0)>=0){a[b+(d[b+280|0]<<5&224|(d[b+281|0]|0)>>>2&31)|0]=f}c[i>>2]=0}}while(0);c[e>>2]=0;return}function yf(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b+260|0;g=c[f>>2]|0;if((c[b+284>>2]|0)==0){h=b+288|0;i=(c[h>>2]|0)+e|0;c[h>>2]=i;if(i>>>0>7833600>>>0){c[h>>2]=i-7833600;i=g+1|0;c[f>>2]=i;j=i}else{j=g}i=b+264|0;h=j+(c[i>>2]|0)|0;c[f>>2]=h;c[i>>2]=0;k=h}else{h=(hc(0)|0)+2082844800|0;i=(d[b+237|0]<<8|d[b+238|0])<<8;j=i|d[b+239|0];e=((i&8388608|0)==0?j:j|-16777216)+h+(c[b+264>>2]|0)|0;c[f>>2]=e;k=e}if((k|0)==(g|0)){return}g=b+312|0;do{if((a[g]|0)!=1){a[g]=1;k=c[b+308>>2]|0;if((k|0)==0){break}nc[k&511](c[b+304>>2]|0,1);if((a[g]|0)!=0){break}return}}while(0);a[g]=0;g=c[b+308>>2]|0;if((g|0)==0){return}nc[g&511](c[b+304>>2]|0,0);return}function zf(b){b=b|0;var d=0;a[b+9|0]=0;a[b+10|0]=0;a[b+11|0]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+40>>2]=0;c[b+44>>2]=0;d=b;c[d>>2]=0;c[d+4>>2]=0;c[b+48>>2]=4096;c[b+52>>2]=Mz(4096)|0;c[b+60>>2]=4080;c[b+64>>2]=4;c[b+68>>2]=0;c[b+72>>2]=0;c[b+76>>2]=0;c[b+108>>2]=0;c[b+140>>2]=0;c[b+172>>2]=0;c[b+204>>2]=0;c[b+236>>2]=0;c[b+268>>2]=0;c[b+300>>2]=0;c[b+332>>2]=0;return}function Af(a,b){a=a|0;b=b|0;c[a+332>>2]=b;return}function Bf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=d&7;c[b+76+(f<<5)>>2]=1;c[b+76+(f<<5)+4>>2]=e;e=b+76+(f<<5)+8|0;d=e|0;y=541410128;a[d]=y;y=y>>8;a[d+1|0]=y;y=y>>8;a[d+2|0]=y;y=y>>8;a[d+3|0]=y;d=e+4|0;y=538976288;a[d]=y;y=y>>8;a[d+1|0]=y;y=y>>8;a[d+2|0]=y;y=y>>8;a[d+3|0]=y;Sz(b+76+(f<<5)+16|0,55120,16)|0;return}function Cf(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=c&7;c=a[d]|0;if(c<<24>>24==0){a[b+76+(e<<5)+8|0]=32;f=d}else{a[b+76+(e<<5)+8|0]=c;f=d+1|0}d=a[f]|0;if(d<<24>>24==0){a[b+76+(e<<5)+9|0]=32;g=f}else{a[b+76+(e<<5)+9|0]=d;g=f+1|0}f=a[g]|0;if(f<<24>>24==0){a[b+76+(e<<5)+10|0]=32;h=g}else{a[b+76+(e<<5)+10|0]=f;h=g+1|0}g=a[h]|0;if(g<<24>>24==0){a[b+76+(e<<5)+11|0]=32;i=h}else{a[b+76+(e<<5)+11|0]=g;i=h+1|0}h=a[i]|0;if(h<<24>>24==0){a[b+76+(e<<5)+12|0]=32;j=i}else{a[b+76+(e<<5)+12|0]=h;j=i+1|0}i=a[j]|0;if(i<<24>>24==0){a[b+76+(e<<5)+13|0]=32;k=j}else{a[b+76+(e<<5)+13|0]=i;k=j+1|0}j=a[k]|0;if(j<<24>>24==0){a[b+76+(e<<5)+14|0]=32;l=k}else{a[b+76+(e<<5)+14|0]=j;l=k+1|0}k=a[l]|0;l=b+76+(e<<5)+15|0;if(k<<24>>24==0){m=32;a[l]=m;return}else{m=k;a[l]=m;return}}function Df(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=c&7;c=0;f=d;while(1){d=a[f]|0;if(d<<24>>24==0){a[b+76+(e<<5)+16+c|0]=32;g=f}else{a[b+76+(e<<5)+16+c|0]=d;g=f+1|0}d=c+1|0;if(d>>>0<16>>>0){c=d;f=g}else{break}}return}function Ef(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=(c[b+60>>2]&e)>>>((c[b+64>>2]|0)>>>0);a:do{switch(g|0){case 6:case 38:{e=b;if((c[e>>2]|0)!=5){h=0;break a}j=b+40|0;k=c[j>>2]|0;l=c[b+44>>2]|0;if(k>>>0>=l>>>0){h=0;break a}m=a[(c[b+52>>2]|0)+k|0]|0;n=k+1|0;c[j>>2]=n;if(n>>>0<l>>>0){h=m;break a}c[e>>2]=7;e=b+9|0;a[e]=a[e]&-125|108;a[b+5|0]=0;h=m;break};case 5:{m=b+11|0;e=a[m]|0;l=(((d[b+9|0]|0)>>>2^a[b+8|0])&7)==0?e|8:e&-9;a[m]=l;h=l;break};case 0:{h=a[b+5|0]|0;break};case 3:{h=a[b+8|0]&15;break};case 2:{h=a[b+7|0]|0;break};case 7:{h=-1;break};case 32:{l=b;if((c[l>>2]|0)!=5){h=0;break a}m=b+40|0;e=c[m>>2]|0;n=c[b+44>>2]|0;if(e>>>0>=n>>>0){h=0;break a}j=a[(c[b+52>>2]|0)+e|0]|0;k=e+1|0;c[m>>2]=k;if(k>>>0<n>>>0){h=j;break a}c[l>>2]=7;l=b+9|0;a[l]=a[l]&-125|108;a[b+5|0]=0;h=j;break};case 1:{h=a[b+6|0]|0;break};case 4:{h=a[b+9|0]|0;break};default:{He(48952,(j=i,i=i+16|0,c[j>>2]=g,c[j+8>>2]=255,j)|0);i=j;h=-1}}}while(0);i=f;return h|0}function Ff(a,b){a=a|0;b=b|0;return 0}function Gf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;g=b;h=(c[b+60>>2]&d)>>>((c[b+64>>2]|0)>>>0);switch(h|0){case 1:{d=e&-97;j=b+6|0;k=d&255;l=a[j]^d;a[j]=d;d=b;switch(c[d>>2]|0){case 4:{j=l&255;if((e&16&l)<<24>>24!=0){m=b+16|0;n=c[m>>2]|0;o=b+20|0;if(n>>>0<(c[o>>2]|0)>>>0){a[g+24+n|0]=a[b+4|0]|0;p=(c[m>>2]|0)+1|0;c[m>>2]=p;q=p}else{q=n}a:do{if((q|0)==1){n=a[b+24|0]|0;p=b+68|0;c[p>>2]=0;c[b+72>>2]=0;m=n&255;switch(m|0){case 60:{c[o>>2]=6;c[p>>2]=328;break a;break};case 0:{c[o>>2]=6;c[p>>2]=394;break a;break};case 21:{c[o>>2]=6;c[p>>2]=24;break a;break};case 42:{c[o>>2]=10;c[p>>2]=512;break a;break};case 47:{c[o>>2]=10;c[p>>2]=288;break a;break};case 8:{c[o>>2]=6;c[p>>2]=220;break a;break};case 40:{c[o>>2]=10;c[p>>2]=146;break a;break};case 37:{c[o>>2]=10;c[p>>2]=198;break a;break};case 10:{c[o>>2]=6;c[p>>2]=492;break a;break};case 18:{c[o>>2]=6;c[p>>2]=444;break a;break};case 4:{c[o>>2]=6;c[p>>2]=170;break a;break};case 3:{c[o>>2]=6;c[p>>2]=350;break a;break};case 27:{c[o>>2]=6;c[p>>2]=126;break a;break};case 26:{c[o>>2]=6;c[p>>2]=348;break a;break};default:{He(41832,(r=i,i=i+8|0,c[r>>2]=m,r)|0);i=r;c[d>>2]=7;m=b+9|0;a[m]=a[m]&-125|108;a[b+5|0]=2;break a}}}}while(0);o=b+9|0;a[o]=a[o]&-33}if((j&(k&16^16)|0)==0){i=f;return}if((c[b+16>>2]|0)>>>0<(c[b+20>>2]|0)>>>0){j=b+9|0;a[j]=a[j]|32;i=f;return}j=c[b+68>>2]|0;if((j|0)==0){c[d>>2]=7;o=b+9|0;a[o]=a[o]&-125|108;a[b+5|0]=2;i=f;return}else{mc[j&1023](g);i=f;return}break};case 7:{if((e&16&l)<<24>>24!=0){j=b+9|0;a[j]=a[j]&-33}if((l&255&(k&16^16)|0)==0){i=f;return}c[d>>2]=8;j=b+9|0;a[j]=a[j]|124;a[b+5|0]=0;i=f;return};case 5:{if((e&16&l)<<24>>24!=0){j=b+9|0;a[j]=a[j]&-33}if((l&255&(k&16^16)|0)==0){i=f;return}j=b+40|0;o=(c[j>>2]|0)+1|0;c[j>>2]=o;if(o>>>0<(c[b+44>>2]|0)>>>0){a[b+5|0]=a[(c[b+52>>2]|0)+o|0]|0;o=b+9|0;a[o]=a[o]|32;i=f;return}else{c[d>>2]=7;o=b+9|0;a[o]=a[o]&-125|108;a[b+5|0]=0;i=f;return}break};case 1:{if((e&4&l)<<24>>24==0){i=f;return}c[d>>2]=2;i=f;return};case 8:{if((e&16&l)<<24>>24!=0){o=b+9|0;a[o]=a[o]&-33}if((l&255&(k&16^16)|0)==0){i=f;return}c[d>>2]=0;o=b+9|0;a[o]=a[o]&-125;i=f;return};case 6:{o=l&255;if((e&16&l)<<24>>24!=0){l=b+40|0;j=c[l>>2]|0;if(j>>>0<(c[b+44>>2]|0)>>>0){a[(c[b+52>>2]|0)+j|0]=a[b+4|0]|0;c[l>>2]=(c[l>>2]|0)+1}l=b+9|0;a[l]=a[l]&-33}if((o&(k&16^16)|0)==0){i=f;return}if((c[b+40>>2]|0)>>>0<(c[b+44>>2]|0)>>>0){k=b+9|0;a[k]=a[k]|32;i=f;return}else{c[d>>2]=7;d=b+9|0;a[d]=a[d]&-125|108;a[b+5|0]=2;i=f;return}break};default:{i=f;return}}break};case 0:{a[b+4|0]=e;i=f;return};case 2:{d=b+7|0;k=e&255;o=a[d]^e;a[d]=e;d=b;l=c[d>>2]|0;b:do{if((l|0)==0){if((e&1&o)<<24>>24==0){break}c[d>>2]=1;a[b+5|0]=a[b+4|0]|0;j=b+6|0;a[j]=a[j]|64}else if((l|0)==5){if((e&2&o)<<24>>24==0){break}if((c[b+40>>2]|0)>>>0>=(c[b+44>>2]|0)>>>0){break}j=b+11|0;a[j]=a[j]|64}else if((l|0)==6){if((e&2&o)<<24>>24==0){break}if((c[b+40>>2]|0)>>>0>=(c[b+44>>2]|0)>>>0){break}j=b+11|0;a[j]=a[j]|64}else if((l|0)==2){if((o&255&(k&1^1)|0)==0){break}j=a[b+4|0]|0;q=j&127;if(q<<24>>24!=0&(j&1)==0){j=q;q=0;while(1){m=q+1|0;p=(j&255)>>>1;if(p<<24>>24!=0&(p&1)==0){j=p;q=m}else{s=m;break}}}else{s=0}c[b+56>>2]=s;q=b+6|0;a[q]=a[q]&-9;q=s&7;do{if((c[g+76+(q<<5)>>2]|0)!=0){j=c[g+76+(q<<5)+4>>2]|0;if((j|0)==65535){break}if((ur(c[b+332>>2]|0,j)|0)==0){break}c[d>>2]=4;j=b+9|0;a[j]=a[j]&-125|104;c[b+16>>2]=0;c[b+20>>2]=16;break b}}while(0);c[d>>2]=0;q=b+9|0;a[q]=a[q]&-125}}while(0);if((o&255&(k&2^2)|0)==0){i=f;return}k=b+11|0;a[k]=a[k]&-65;i=f;return};case 6:case 7:{i=f;return};case 3:{k=b+8|0;o=a[k]|0;a[k]=e;if((e&2&(o^2))<<24>>24==0){i=f;return}o=b;k=c[o>>2]|0;if((k|0)==5){c[o>>2]=7;d=b+9|0;a[d]=a[d]&-125|108;a[b+5|0]=0;i=f;return}else if((k|0)==6){c[o>>2]=7;o=b+9|0;a[o]=a[o]&-125|108;a[b+5|0]=0;i=f;return}else{i=f;return}break};case 4:{a[b+10|0]=e;i=f;return};case 5:{o=b+11|0;a[o]=a[o]|64;i=f;return};case 32:{o=b;if((c[o>>2]|0)!=6){i=f;return}k=b+40|0;d=c[k>>2]|0;s=b+44|0;if(d>>>0>=(c[s>>2]|0)>>>0){i=f;return}a[(c[b+52>>2]|0)+d|0]=e;d=(c[k>>2]|0)+1|0;c[k>>2]=d;if(d>>>0<(c[s>>2]|0)>>>0){i=f;return}s=c[b+72>>2]|0;if((s|0)==0){c[o>>2]=7;o=b+9|0;a[o]=a[o]&-125|108;a[b+5|0]=2;i=f;return}else{mc[s&1023](g);i=f;return}break};default:{He(45304,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=e&255,r)|0);i=r;i=f;return}}}function Hf(a,b,c){a=a|0;b=b|0;c=c|0;return}function If(b){b=b|0;var d=0;a[b+9|0]=0;a[b+10|0]=0;d=b;c[d>>2]=0;c[d+4>>2]=0;a[b+11|0]=8;a[b+12|0]=0;c[b+16>>2]=0;c[b+20>>2]=0;c[b+40>>2]=0;c[b+44>>2]=0;c[b+68>>2]=0;c[b+72>>2]=0;return}function Jf(b){b=b|0;var d=0;c[b>>2]=7;d=b+9|0;a[d]=a[d]&-125|108;a[b+5|0]=0;return}function Kf(b){b=b|0;var d=0,e=0;d=b+52|0;Rz(c[d>>2]|0,0,13)|0;a[c[d>>2]|0]=-16;c[b+40>>2]=0;c[b+44>>2]=13;c[b>>2]=5;e=b+9|0;a[e]=a[e]&-125|100;a[b+5|0]=a[c[d>>2]|0]|0;return}function Lf(b){b=b|0;var d=0;c[b>>2]=7;d=b+9|0;a[d]=a[d]&-125|108;a[b+5|0]=0;return}function Mf(b){b=b|0;var c=0;c=a[b+28|0]|0;Zf(b,((d[b+25|0]|0)<<8&7936|(d[b+26|0]|0))<<8|(d[b+27|0]|0),c<<24>>24==0?256:c&255);return}function Nf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=a[b+28|0]|0;f=e<<24>>24==0?256:e&255;e=f<<9;g=b+48|0;do{if((c[g>>2]|0)>>>0<e>>>0){h=b+52|0;j=Oz(c[h>>2]|0,e)|0;if((j|0)!=0){c[h>>2]=j;c[g>>2]=e;break}He(38808,(j=i,i=i+8|0,c[j>>2]=f,j)|0);i=j;c[b>>2]=7;j=b+9|0;a[j]=a[j]&-125|108;a[b+5|0]=2;i=d;return}}while(0);c[b+40>>2]=0;c[b+44>>2]=e;c[b+72>>2]=136;c[b>>2]=6;e=b+9|0;a[e]=a[e]&-125|96;i=d;return}function Of(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b+76+((c[b+56>>2]&7)<<5)|0;f=(c[e>>2]|0)==0?0:e;e=b+52|0;Rz(c[e>>2]|0,0,256)|0;if((f|0)!=0){g=f+8|0;h=(c[e>>2]|0)+8|0;i=g|0;j=g+4|0;g=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24|0;j=h|0;y=d[i]|d[i+1|0]<<8|d[i+2|0]<<16|d[i+3|0]<<24|0;a[j]=y;y=y>>8;a[j+1|0]=y;y=y>>8;a[j+2|0]=y;y=y>>8;a[j+3|0]=y;j=h+4|0;y=g;a[j]=y;y=y>>8;a[j+1|0]=y;y=y>>8;a[j+2|0]=y;y=y>>8;a[j+3|0]=y;Sz((c[e>>2]|0)+16|0,f+16|0,16)|0}a[(c[e>>2]|0)+4|0]=32;c[b+40>>2]=0;f=a[b+28|0]|0;c[b+44>>2]=(f&255)>>>0<36>>>0?f&255:36;c[b>>2]=5;f=b+9|0;a[f]=a[f]&-125|100;a[b+5|0]=a[c[e>>2]|0]|0;return}function Pf(b){b=b|0;var d=0;c[b+40>>2]=0;c[b+44>>2]=0;c[b>>2]=6;d=b+9|0;a[d]=a[d]&-125|96;return}function Qf(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=c[b+56>>2]&7;do{if((c[b+76+(f<<5)>>2]|0)!=0){g=c[b+76+(f<<5)+4>>2]|0;if((g|0)==65535){break}h=ur(c[b+332>>2]|0,g)|0;if((h|0)==0){break}g=b+52|0;Rz(c[g>>2]|0,0,512)|0;j=b+40|0;c[j>>2]=0;k=b+44|0;c[k>>2]=0;l=d[b+26|0]|0;m=l&63;do{if((m|0)==48){a[c[g>>2]|0]=48;a[(c[g>>2]|0)+1|0]=33;Sz((c[g>>2]|0)+14|0,53712,20)|0;c[k>>2]=34}else if((m|0)==4){a[c[g>>2]|0]=4;a[(c[g>>2]|0)+1|0]=22;a[(c[g>>2]|0)+2|0]=0;pq(c[g>>2]|0,3,c[h+32>>2]&65535);a[(c[g>>2]|0)+5|0]=c[h+36>>2];pq(c[g>>2]|0,20,3600);c[k>>2]=32}else if((m|0)==3){a[c[g>>2]|0]=3;a[(c[g>>2]|0)+1|0]=22;c[k>>2]=24}else if((m|0)==1){a[c[g>>2]|0]=1;a[(c[g>>2]|0)+1|0]=10;c[k>>2]=12}else{He(53056,(n=i,i=i+8|0,c[n>>2]=l,n)|0);i=n;if((c[k>>2]|0)!=0){break}c[b>>2]=7;n=b+9|0;a[n]=a[n]&-125|108;a[b+5|0]=2;i=e;return}}while(0);c[b>>2]=5;k=b+9|0;a[k]=a[k]&-125|100;a[b+5|0]=a[(c[g>>2]|0)+(c[j>>2]|0)|0]|0;i=e;return}}while(0);c[b>>2]=7;f=b+9|0;a[f]=a[f]&-125|108;a[b+5|0]=2;i=e;return}function Rf(b){b=b|0;var d=0,e=0,f=0;d=i;e=a[b+28|0]&3;if((e|0)==2){f=55728}else if((e|0)==3){f=55064}else if((e|0)==0){f=57736}else if((e|0)==1){f=56904}else{f=0}He(54328,(e=i,i=i+16|0,c[e>>2]=c[b+56>>2],c[e+8>>2]=f,e)|0);i=e;c[b>>2]=7;e=b+9|0;a[e]=a[e]&-125|108;a[b+5|0]=0;i=d;return}function Sf(b){b=b|0;var d=0,e=0,f=0;d=c[b+56>>2]&7;do{if((c[b+76+(d<<5)>>2]|0)!=0){e=c[b+76+(d<<5)+4>>2]|0;if((e|0)==65535){break}f=ur(c[b+332>>2]|0,e)|0;if((f|0)==0){break}e=mr(f)|0;f=b+52|0;qq(c[f>>2]|0,0,e-1|0);qq(c[f>>2]|0,4,512);c[b+40>>2]=0;c[b+44>>2]=8;c[b>>2]=5;e=b+9|0;a[e]=a[e]&-125|100;a[b+5|0]=a[c[f>>2]|0]|0;return}}while(0);c[b>>2]=7;d=b+9|0;a[d]=a[d]&-125|108;a[b+5|0]=2;return}function Tf(a){a=a|0;Zf(a,(((d[a+26|0]|0)<<8|(d[a+27|0]|0))<<8|(d[a+28|0]|0))<<8|(d[a+29|0]|0),(d[a+31|0]|0)<<8|(d[a+32|0]|0));return}function Uf(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=(d[b+31|0]|0)<<8|(d[b+32|0]|0);g=f<<9;h=b+48|0;do{if((c[h>>2]|0)>>>0<g>>>0){j=b+52|0;k=Oz(c[j>>2]|0,g)|0;if((k|0)!=0){c[j>>2]=k;c[h>>2]=g;break}He(38808,(k=i,i=i+8|0,c[k>>2]=f,k)|0);i=k;c[b>>2]=7;k=b+9|0;a[k]=a[k]&-125|108;a[b+5|0]=2;i=e;return}}while(0);c[b+40>>2]=0;c[b+44>>2]=g;c[b+72>>2]=520;c[b>>2]=6;g=b+9|0;a[g]=a[g]&-125|96;i=e;return}function Vf(b){b=b|0;var d=0,e=0;d=c[b+56>>2]&7;do{if((c[b+76+(d<<5)>>2]|0)!=0){e=c[b+76+(d<<5)+4>>2]|0;if((e|0)==65535){break}if((ur(c[b+332>>2]|0,e)|0)==0){break}c[b+40>>2]=0;c[b+44>>2]=0;c[b>>2]=7;e=b+9|0;a[e]=a[e]&-125|108;a[b+5|0]=0;return}}while(0);c[b>>2]=7;d=b+9|0;a[d]=a[d]&-125|108;a[b+5|0]=2;return}function Wf(b){b=b|0;var d=0,e=0;d=b+52|0;Rz(c[d>>2]|0,0,512)|0;c[b+40>>2]=0;c[b+44>>2]=4;c[b>>2]=5;e=b+9|0;a[e]=a[e]&-125|100;a[b+5|0]=a[c[d>>2]|0]|0;return}function Xf(a){a=a|0;Yf(a,(((d[a+26|0]|0)<<8|(d[a+27|0]|0))<<8|(d[a+28|0]|0))<<8|(d[a+29|0]|0),(d[a+31|0]|0)<<8|(d[a+32|0]|0));return}function Yf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=c[b+56>>2]&7;do{if((c[b+76+(g<<5)>>2]|0)!=0){h=c[b+76+(g<<5)+4>>2]|0;if((h|0)==65535){break}j=ur(c[b+332>>2]|0,h)|0;if((j|0)==0){break}h=e<<9;k=b+40|0;l=c[k>>2]|0;if((h|0)!=(l|0)){He(35904,(m=i,i=i+16|0,c[m>>2]=h,c[m+8>>2]=l,m)|0);i=m;c[b>>2]=7;l=b+9|0;a[l]=a[l]&-125|108;a[b+5|0]=2;i=f;return}if((qr(j,c[b+52>>2]|0,d,e)|0)==0){c[k>>2]=0;c[b+44>>2]=0;c[b+72>>2]=0;c[b>>2]=7;k=b+9|0;a[k]=a[k]&-125|108;a[b+5|0]=0;i=f;return}else{He(32904,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0);i=m;c[b>>2]=7;k=b+9|0;a[k]=a[k]&-125|108;a[b+5|0]=2;i=f;return}}}while(0);c[b>>2]=7;m=b+9|0;a[m]=a[m]&-125|108;a[b+5|0]=2;i=f;return}function Zf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=c[b+56>>2]&7;do{if((c[b+76+(g<<5)>>2]|0)!=0){h=c[b+76+(g<<5)+4>>2]|0;if((h|0)==65535){break}j=ur(c[b+332>>2]|0,h)|0;if((j|0)==0){break}h=e<<9;k=b+48|0;l=b+52|0;m=c[l>>2]|0;do{if((c[k>>2]|0)>>>0<h>>>0){n=Oz(m,h)|0;if((n|0)!=0){c[l>>2]=n;c[k>>2]=h;o=n;break}He(31472,(p=i,i=i+8|0,c[p>>2]=e,p)|0);i=p;c[b>>2]=7;n=b+9|0;a[n]=a[n]&-125|108;a[b+5|0]=2;i=f;return}else{o=m}}while(0);if((pr(j,o,d,e)|0)==0){c[b+40>>2]=0;c[b+44>>2]=h;c[b>>2]=5;m=b+9|0;a[m]=a[m]&-125|100;a[b+5|0]=a[c[b+52>>2]|0]|0;i=f;return}else{He(30512,(p=i,i=i+16|0,c[p>>2]=d,c[p+8>>2]=e,p)|0);i=p;c[b>>2]=7;m=b+9|0;a[m]=a[m]&-125|108;a[b+5|0]=2;i=f;return}}}while(0);c[b>>2]=7;p=b+9|0;a[p]=a[p]&-125|108;a[b+5|0]=2;i=f;return}function _f(b){b=b|0;var c=0;c=a[b+28|0]|0;Yf(b,((d[b+25|0]|0)<<8&7936|(d[b+26|0]|0))<<8|(d[b+27|0]|0),c<<24>>24==0?256:c&255);return}function $f(a){a=a|0;c[a+300>>2]=0;c[a+304>>2]=0;c[a+564>>2]=0;Rz(a|0,0,44)|0;return}function ag(a,b){a=a|0;b=b|0;var d=0;d=a+564|0;a=c[d>>2]|0;if((a|0)!=0){bs(a)}a=hs(b)|0;c[d>>2]=a;return(a|0)==0|0}function bg(a,b){a=a|0;b=b|0;var d=0;d=wx(44248,b)|0;b=a+564|0;a=c[b>>2]|0;if((a|0)!=0){bs(a)}a=hs(d)|0;c[b>>2]=a;Nz(d);return(a|0)==0|0}function cg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a|0;c[e>>2]=b;f=a+4|0;c[f>>2]=d;g=a;zp(b,d,g,268);Ap(b,d,g,254);Bp(b,d,g,310);Cp(b,d,g,2);Rp(c[e>>2]|0,c[f>>2]|0,1);return}function dg(a,b){a=a|0;b=b|0;jg(a);return}function eg(a,b){a=a|0;b=b|0;ig(a);return}function fg(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+32|0;e=b&255;if((c[d>>2]|0)==(e|0)){return}c[d>>2]=b<<24>>24!=0;fs(c[a+564>>2]|0,e)|0;return}function gg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=f>>>1;c[a+12>>2]=b;c[a+16>>2]=d;c[a+20>>2]=e;c[a+24>>2]=g;gs(c[a+564>>2]|0,b,e,d,g)|0;return}function hg(a,b){a=a|0;b=b|0;var d=0,e=0;ig(a);jg(a);d=a|0;Rp(c[d>>2]|0,c[a+4>>2]|0,1);e=a+8|0;a=(c[e>>2]|0)+(b*15|0)|0;c[e>>2]=a;Xp(c[d>>2]|0,a>>>5);c[e>>2]=c[e>>2]&31;return}function ig(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b+304|0;e=c[d>>2]|0;do{if((e|0)!=0){f=b+300|0;g=ds(c[b+564>>2]|0,(c[f>>2]|0)+(b+308)|0,e)|0;c[f>>2]=(c[f>>2]|0)+g;h=c[d>>2]|0;c[d>>2]=h-g;if((h|0)==(g|0)){c[f>>2]=0}if((h|0)==(g|0)){break}return}}while(0);e=b|0;g=b+4|0;a:do{if((Vp(c[e>>2]|0,c[g>>2]|0)|0)==0){h=b+300|0;f=b+564|0;while(1){i=Tp(c[e>>2]|0,c[g>>2]|0)|0;a[(c[d>>2]|0)+(c[h>>2]|0)+(b+308)|0]=i;i=(c[d>>2]|0)+1|0;c[d>>2]=i;j=c[h>>2]|0;if(!((j+i|0)>>>0<256>>>0|(i|0)==0)){k=ds(c[f>>2]|0,b+308+j|0,i)|0;c[h>>2]=(c[h>>2]|0)+k;i=c[d>>2]|0;c[d>>2]=i-k;if((i|0)==(k|0)){c[h>>2]=0}if((i|0)!=(k|0)){break}}if((Vp(c[e>>2]|0,c[g>>2]|0)|0)!=0){break a}}return}}while(0);g=c[d>>2]|0;if((g|0)==0){return}e=b+300|0;h=ds(c[b+564>>2]|0,(c[e>>2]|0)+(b+308)|0,g)|0;c[e>>2]=(c[e>>2]|0)+h;g=c[d>>2]|0;c[d>>2]=g-h;if((g|0)!=(h|0)){return}c[e>>2]=0;return}function jg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b+36|0;e=b|0;f=b+4|0;if((Up(c[e>>2]|0,c[f>>2]|0)|0)!=0){return}g=b+40|0;h=b+564|0;while(1){if((c[g>>2]|0)==0){c[d>>2]=0;i=cs(c[h>>2]|0,b+44|0,256)|0;j=(c[g>>2]|0)+i|0;c[g>>2]=j;if((j|0)==0){k=6;break}}Sp(c[e>>2]|0,c[f>>2]|0,a[(c[d>>2]|0)+(b+44)|0]|0);c[d>>2]=(c[d>>2]|0)+1;c[g>>2]=(c[g>>2]|0)-1;if((Up(c[e>>2]|0,c[f>>2]|0)|0)!=0){k=6;break}}if((k|0)==6){return}}function kg(b,d){b=b|0;d=d|0;a[b|0]=0;a[b+1|0]=0;a[b+2|0]=(d|0)!=0|0;c[b+64>>2]=0;Rz(b+4|0,0,57)|0;return}function lg(a,b){a=a|0;b=b|0;c[a+4>>2]=b;return}function mg(a,b){a=a|0;b=b|0;c[a+8>>2]=b;return}function ng(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;if((a[b+2|0]|0)==0){i=d;return}e=b+1|0;if((a[e]|0)!=0){i=d;return}a[e]=1;e=b+132|0;c[e>>2]=0;f=b+136|0;c[f>>2]=0;g=b+4|0;do{if((Aq(c[g>>2]|0,16252928)|0)==1346585944){if((Aq(c[g>>2]|0,16252936)|0)>>>0<4>>>0){h=5;break}c[b+44>>2]=(Aq(c[g>>2]|0,16252944)|0)+16252928;c[b+48>>2]=(Aq(c[g>>2]|0,16252948)|0)+16252928;c[b+52>>2]=(Aq(c[g>>2]|0,16252952)|0)+16252928;j=(Aq(c[g>>2]|0,16252940)|0)+16252928|0;c[e>>2]=j;if((j|0)==0){break}cx(2,43912,48792,(k=i,i=i+8|0,c[k>>2]=j,k)|0);i=k;j=4194304;l=1048576;a:while(1){m=j+1|0;n=l-1|0;do{if((zq(c[g>>2]|0,j)|0)<<16>>16==1326){if((Aq(c[g>>2]|0,j+2|0)|0)!=1399811705){break}o=j-18|0;if((zq(c[g>>2]|0,o)|0)<<16>>16==20224){h=14;break a}}}while(0);if((n|0)==0){h=11;break}else{j=m;l=n}}do{if((h|0)==11){c[f>>2]=0}else if((h|0)==14){c[f>>2]=o;if((o|0)==0){break}cx(2,43912,41680,(k=i,i=i+8|0,c[k>>2]=o,k)|0);i=k;l=c[f>>2]|0;if((l|0)==0){i=d;return}if((c[e>>2]|0)==0){i=d;return}j=0;p=b+140|0;q=l;while(1){l=(j<<1)+8|0;r=(zq(c[g>>2]|0,l+q|0)|0)&65535;s=(c[f>>2]|0)+r|0;r=zq(c[g>>2]|0,(c[e>>2]|0)+l|0)|0;l=c[e>>2]|0;a[p]=yq(c[g>>2]|0,s)|0;t=s+1|0;a[p+1|0]=yq(c[g>>2]|0,t)|0;u=s+2|0;a[p+2|0]=yq(c[g>>2]|0,u)|0;v=s+3|0;a[p+3|0]=yq(c[g>>2]|0,v)|0;w=s+4|0;a[p+4|0]=yq(c[g>>2]|0,w)|0;x=s+5|0;a[p+5|0]=yq(c[g>>2]|0,x)|0;y=l+(r&65535)|0;Bq(c[g>>2]|0,s,78);Bq(c[g>>2]|0,t,-7);Bq(c[g>>2]|0,u,y>>>24&255);Bq(c[g>>2]|0,v,y>>>16&255);Bq(c[g>>2]|0,w,y>>>8&255);Bq(c[g>>2]|0,x,y&255);y=j+1|0;if(y>>>0>=5>>>0){break}j=y;p=p+6|0;q=c[f>>2]|0}i=d;return}}while(0);cx(0,43912,45176,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;i=d;return}else{h=5}}while(0);if((h|0)==5){c[e>>2]=0}cx(0,43912,54808,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0);i=k;i=d;return}function og(a,b,d){a=a|0;b=b|0;d=d|0;if(b>>>0>=4>>>0){return}c[a+12+(b<<2)>>2]=d;c[a+28+(b<<2)>>2]=d;return}function pg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((a[b|0]|0)==0){i=e;return}if((d|0)==0|d>>>0>4>>>0){i=e;return}f=ur(c[b+8>>2]|0,d)|0;if((f|0)==0){i=e;return}g=b+4|0;b=Aq(c[g>>2]|0,308)|0;if(d>>>0<5>>>0){h=(d*66|0)+8+b|0}else{h=b}b=h+3|0;if((yq(c[g>>2]|0,b)|0)<<24>>24!=0){i=e;return}cx(2,43912,38688,(j=i,i=i+8|0,c[j>>2]=d,j)|0);i=j;Cq(c[g>>2]|0,b,1);b=(mr(f)|0)>>>0<1600>>>0;j=c[g>>2]|0;d=h+18|0;if(b){Cq(j,d,0)}else{Cq(j,d,-1)}Cq(c[g>>2]|0,h+19|0,-1);d=(gr(f)|0)==0;f=c[g>>2]|0;g=h+2|0;if(d){Cq(f,g,0);i=e;return}else{Cq(f,g,-1);i=e;return}}function qg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((a[b|0]|0)==0){d=0;return d|0}e=b+8|0;f=b+4|0;g=0;h=0;a:while(1){i=h;do{if(i>>>0>=4>>>0){d=g;break a}j=b+28+(i<<2)|0;k=c[j>>2]|0;do{if((k|0)!=0){l=k-1|0;c[j>>2]=l;if((l|0)!=0){break}pg(b,i+1|0)}}while(0);i=i+1|0;}while((ur(c[e>>2]|0,i)|0)==0);j=Aq(c[f>>2]|0,308)|0;if((i|0)!=0&i>>>0<5>>>0){m=(i*66|0)+8+j|0}else{m=j}j=(yq(c[f>>2]|0,m+3|0)|0)<<24>>24==1;g=j?1:g;h=i}return d|0}function rg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0;e=i;i=i+560|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+544|0;switch(d|0){case 16:{a[b|0]=1;if((qg(b)|0)==0){m=0;i=e;return m|0}c[b+216>>2]=c[b+44>>2];m=0;i=e;return m|0};case 17:{d=b+4|0;n=b+208|0;o=(zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0)&65535;p=zq(c[d>>2]|0,(c[n>>2]|0)+22|0)|0;q=p&65535;if(p<<16>>16==0|(p&65535)>>>0>4>>>0){c[b+204>>2]=-56;r=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-56);if((r&512)!=0){m=0;i=e;return m|0}r=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,r)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}r=Aq(c[d>>2]|0,308)|0;s=(p&65535)>>>0<5>>>0;if(s){t=(q*66|0)+8+r|0}else{t=r}r=t+3|0;if((yq(c[d>>2]|0,r)|0)<<24>>24==0){c[b+204>>2]=-65;t=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-65);if((t&512)!=0){m=0;i=e;return m|0}t=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,t)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}Cq(c[d>>2]|0,r,2);r=o&255;if((r|0)==3){t=k|0;p=l|0;u=(zq(c[d>>2]|0,(c[n>>2]|0)+44|0)|0)&15;if((u|0)==0){v=Aq(c[d>>2]|0,(c[b+212>>2]|0)+16|0)|0}else if((u|0)==1){v=Aq(c[d>>2]|0,(c[n>>2]|0)+46|0)|0}else if((u|0)==3){u=Aq(c[d>>2]|0,(c[n>>2]|0)+46|0)|0;v=(Aq(c[d>>2]|0,(c[b+212>>2]|0)+16|0)|0)+u|0}else{v=0}u=Aq(c[d>>2]|0,(c[n>>2]|0)+36|0)|0;w=(Aq(c[d>>2]|0,(c[n>>2]|0)+32|0)|0)&16777215;x=ur(c[b+8>>2]|0,q)|0;if((x|0)==0){c[b+204>>2]=-65;y=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-65);if((y&512)!=0){m=0;i=e;return m|0}y=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,y)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}if((gr(x)|0)!=0){c[b+204>>2]=-44;y=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-44);if((y&512)!=0){m=0;i=e;return m|0}y=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,y)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}do{if((u&511|0)==0){if((v&511|0)!=0){break}Rz(p|0,0,12)|0;y=(zq(c[d>>2]|0,770)|0)&65535;z=u>>>9;A=b+56|0;B=v>>>9;C=l+1|0;D=l+2|0;E=l+3|0;F=l+4|0;G=l+5|0;H=l+6|0;I=l+7|0;J=l+8|0;K=l+9|0;L=l+10|0;M=l+11|0;N=0;while(1){if(N>>>0>=z>>>0){O=71;break}P=(N<<9)+w|0;Q=0;do{a[k+Q|0]=yq(c[d>>2]|0,P+Q|0)|0;Q=Q+1|0;}while(Q>>>0<512>>>0);Q=c[A>>2]|0;a:do{if((Q|0)==0){Dq(c[d>>2]|0,770,N+y&65535);a[p]=yq(c[d>>2]|0,764)|0;a[C]=yq(c[d>>2]|0,765)|0;a[D]=yq(c[d>>2]|0,766)|0;a[E]=yq(c[d>>2]|0,767)|0;a[F]=yq(c[d>>2]|0,768)|0;a[G]=yq(c[d>>2]|0,769)|0;a[H]=yq(c[d>>2]|0,770)|0;a[I]=yq(c[d>>2]|0,771)|0;a[J]=yq(c[d>>2]|0,772)|0;a[K]=yq(c[d>>2]|0,773)|0;a[L]=yq(c[d>>2]|0,774)|0;a[M]=yq(c[d>>2]|0,775)|0}else{P=N*12|0;R=0;S=Q;while(1){T=yq(c[d>>2]|0,S+P+R|0)|0;a[l+R|0]=T;Cq(c[d>>2]|0,R+764|0,T);T=R+1|0;if(T>>>0>=12>>>0){break a}R=T;S=c[A>>2]|0}}}while(0);if((vg(x,t,p,N+B|0)|0)==0){N=N+1|0}else{O=69;break}}if((O|0)==69){He(55032,(U=i,i=i+1|0,i=i+7&-8,c[U>>2]=0,U)|0);i=U;c[b+204>>2]=-1;N=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-1);if((N&512)!=0){m=0;i=e;return m|0}N=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,N)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((O|0)==71){Eq(c[d>>2]|0,(c[n>>2]|0)+40|0,u);N=b+212|0;B=(Aq(c[d>>2]|0,(c[N>>2]|0)+16|0)|0)+u|0;Eq(c[d>>2]|0,(c[N>>2]|0)+16|0,B);c[b+204>>2]=0;B=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,0);if((B&512)!=0){m=0;i=e;return m|0}B=Aq(c[d>>2]|0,308)|0;c[N>>2]=Aq(c[d>>2]|0,B)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}}while(0);He(55688,(U=i,i=i+1|0,i=i+7&-8,c[U>>2]=0,U)|0);i=U;c[b+204>>2]=-50;u=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-50);if((u&512)!=0){m=0;i=e;return m|0}u=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,u)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((r|0)==2){r=k|0;u=l|0;p=(zq(c[d>>2]|0,(c[n>>2]|0)+44|0)|0)&15;if((p|0)==3){t=Aq(c[d>>2]|0,(c[n>>2]|0)+46|0)|0;V=(Aq(c[d>>2]|0,(c[b+212>>2]|0)+16|0)|0)+t|0}else if((p|0)==1){V=Aq(c[d>>2]|0,(c[n>>2]|0)+46|0)|0}else if((p|0)==0){V=Aq(c[d>>2]|0,(c[b+212>>2]|0)+16|0)|0}else{V=0}p=Aq(c[d>>2]|0,(c[n>>2]|0)+36|0)|0;t=(Aq(c[d>>2]|0,(c[n>>2]|0)+32|0)|0)&16777215;x=zq(c[d>>2]|0,(c[n>>2]|0)+44|0)|0;w=ur(c[b+8>>2]|0,q)|0;if((w|0)==0){c[b+204>>2]=-65;v=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-65);if((v&512)!=0){m=0;i=e;return m|0}v=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,v)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}if((x&64)!=0){c[b+204>>2]=0;x=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,0);if((x&512)!=0){m=0;i=e;return m|0}x=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,x)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}do{if((V&511|0)==0){if((p&511|0)!=0){break}x=p>>>9;b:do{if((x|0)!=0){v=V>>>9;B=w+64|0;N=b+56|0;A=l+1|0;M=l+2|0;L=l+3|0;K=l+4|0;J=l+5|0;I=l+6|0;H=l+7|0;G=l+8|0;F=l+9|0;E=l+10|0;D=l+11|0;C=0;while(1){y=C+v|0;if((er(w)|0)==6){if((wg(mr(w)|0,y,f,g,h)|0)!=0){break}W=c[f>>2]|0;X=c[g>>2]|0;Y=c[h>>2]|0;Gq(c[B>>2]|0,u,12,W,X,Y,0)|0;c[j>>2]=512;if((Fq(c[B>>2]|0,r,j,W,X,Y,0)|0)!=0){O=34;break}}else{Rz(u|0,0,12)|0;if((pr(w,r,y,1)|0)!=0){break}}y=(C<<9)+t|0;z=0;do{Cq(c[d>>2]|0,y+z|0,a[k+z|0]|0);z=z+1|0;}while(z>>>0<512>>>0);Cq(c[d>>2]|0,764,a[u]|0);Cq(c[d>>2]|0,765,a[A]|0);Cq(c[d>>2]|0,766,a[M]|0);Cq(c[d>>2]|0,767,a[L]|0);Cq(c[d>>2]|0,768,a[K]|0);Cq(c[d>>2]|0,769,a[J]|0);Cq(c[d>>2]|0,770,a[I]|0);Cq(c[d>>2]|0,771,a[H]|0);Cq(c[d>>2]|0,772,a[G]|0);Cq(c[d>>2]|0,773,a[F]|0);Cq(c[d>>2]|0,774,a[E]|0);Cq(c[d>>2]|0,775,a[D]|0);z=c[N>>2]|0;if((z|0)!=0){y=C*12|0;Cq(c[d>>2]|0,z+y|0,a[u]|0);Cq(c[d>>2]|0,(y|1)+(c[N>>2]|0)|0,a[A]|0);Cq(c[d>>2]|0,(y|2)+(c[N>>2]|0)|0,a[M]|0);Cq(c[d>>2]|0,(y|3)+(c[N>>2]|0)|0,a[L]|0);Cq(c[d>>2]|0,y+4+(c[N>>2]|0)|0,a[K]|0);Cq(c[d>>2]|0,y+5+(c[N>>2]|0)|0,a[J]|0);Cq(c[d>>2]|0,y+6+(c[N>>2]|0)|0,a[I]|0);Cq(c[d>>2]|0,y+7+(c[N>>2]|0)|0,a[H]|0);Cq(c[d>>2]|0,y+8+(c[N>>2]|0)|0,a[G]|0);Cq(c[d>>2]|0,y+9+(c[N>>2]|0)|0,a[F]|0);Cq(c[d>>2]|0,y+10+(c[N>>2]|0)|0,a[E]|0);Cq(c[d>>2]|0,y+11+(c[N>>2]|0)|0,a[D]|0)}C=C+1|0;if(C>>>0>=x>>>0){break b}}if((O|0)==34){He(52960,(U=i,i=i+24|0,c[U>>2]=W,c[U+8>>2]=X,c[U+16>>2]=Y,U)|0);i=U}He(53680,(U=i,i=i+1|0,i=i+7&-8,c[U>>2]=0,U)|0);i=U;c[b+204>>2]=-1;C=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-1);if((C&512)!=0){m=0;i=e;return m|0}C=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,C)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}while(0);x=Aq(c[d>>2]|0,308)|0;if(s){Z=(q*66|0)+8+x|0}else{Z=x}Cq(c[d>>2]|0,Z+3|0,2);Eq(c[d>>2]|0,(c[n>>2]|0)+40|0,p);x=b+212|0;C=(Aq(c[d>>2]|0,(c[x>>2]|0)+16|0)|0)+p|0;Eq(c[d>>2]|0,(c[x>>2]|0)+16|0,C);c[b+204>>2]=0;C=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,0);if((C&512)!=0){m=0;i=e;return m|0}C=Aq(c[d>>2]|0,308)|0;c[x>>2]=Aq(c[d>>2]|0,C)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}while(0);He(54288,(U=i,i=i+1|0,i=i+7&-8,c[U>>2]=0,U)|0);i=U;c[b+204>>2]=-50;p=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-50);if((p&512)!=0){m=0;i=e;return m|0}p=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,p)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else{He(56824,(U=i,i=i+8|0,c[U>>2]=o,U)|0);i=U;c[b+204>>2]=-17;o=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-17);if((o&512)!=0){m=0;i=e;return m|0}o=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,o)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}break};case 18:{d=b+4|0;o=b+208|0;n=(zq(c[d>>2]|0,(c[o>>2]|0)+26|0)|0)&65535;if((n|0)==1){c[b+204>>2]=-27;zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-27);m=0;i=e;return m|0}else if((n|0)==5){p=zq(c[d>>2]|0,(c[o>>2]|0)+22|0)|0;if(p<<16>>16==0|(p&65535)>>>0>4>>>0){c[b+204>>2]=-56;Z=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-56);if((Z&512)!=0){m=0;i=e;return m|0}Z=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,Z)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}Z=b+204|0;if((ur(c[b+8>>2]|0,p&65535)|0)==0){c[Z>>2]=-64;p=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-64);if((p&512)!=0){m=0;i=e;return m|0}p=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,p)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else{c[Z>>2]=0;Z=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,0);if((Z&512)!=0){m=0;i=e;return m|0}Z=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,Z)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}else if((n|0)==7){Z=zq(c[d>>2]|0,(c[o>>2]|0)+22|0)|0;p=Z&65535;if(Z<<16>>16==0|(Z&65535)>>>0>4>>>0){c[b+204>>2]=-56;q=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-56);if((q&512)!=0){m=0;i=e;return m|0}q=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,q)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}q=Aq(c[d>>2]|0,308)|0;if((Z&65535)>>>0<5>>>0){_=(p*66|0)+8+q|0}else{_=q}Cq(c[d>>2]|0,_+3|0,0);Cq(c[d>>2]|0,_+2|0,0);Cq(c[d>>2]|0,_+18|0,0);c[b+204>>2]=0;_=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,0);if((_&512)!=0){m=0;i=e;return m|0}_=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,_)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((n|0)==8){c[b+56>>2]=(Aq(c[d>>2]|0,(c[o>>2]|0)+28|0)|0)&16777215;c[b+204>>2]=0;_=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,0);if((_&512)!=0){m=0;i=e;return m|0}_=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,_)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((n|0)==9){c[b+204>>2]=-56;_=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-56);if((_&512)!=0){m=0;i=e;return m|0}_=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,_)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((n|0)==6){_=zq(c[d>>2]|0,(c[o>>2]|0)+22|0)|0;q=_&65535;p=zq(c[d>>2]|0,(c[o>>2]|0)+28|0)|0;Z=p&65535;if(_<<16>>16==0|(_&65535)>>>0>4>>>0){c[b+204>>2]=-56;s=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-56);if((s&512)!=0){m=0;i=e;return m|0}s=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,s)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}s=ur(c[b+8>>2]|0,q)|0;if((s|0)==0){c[b+204>>2]=-64;Y=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-64);if((Y&512)!=0){m=0;i=e;return m|0}Y=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,Y)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}if((a[s+56|0]|0)!=0){c[b+204>>2]=-44;Y=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-44);if((Y&512)!=0){m=0;i=e;return m|0}Y=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,Y)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}do{if(p<<16>>16==0){O=108}else{if(Z>>>0>(c[b+64>>2]|0)>>>0){O=108;break}$=c[b+68+((Z<<1)-2<<2)>>2]|0}}while(0);do{if((O|0)==108){Z=mr(s)|0;if((er(s)|0)!=6){$=Z;break}$=p<<16>>16==1?800:1600}}while(0);if((ug(s,$)|0)!=0){c[b+204>>2]=-50;s=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-50);if((s&512)!=0){m=0;i=e;return m|0}s=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,s)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}s=Aq(c[d>>2]|0,308)|0;if((_&65535)>>>0<5>>>0){aa=(q*66|0)+8+s|0}else{aa=s}Dq(c[d>>2]|0,aa+18|0,$&65535);Dq(c[d>>2]|0,aa+20|0,$>>>16&65535);c[b+204>>2]=0;$=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,0);if(($&512)!=0){m=0;i=e;return m|0}$=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,$)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((n|0)==21){tg(b);m=0;i=e;return m|0}else if((n|0)==22){tg(b);m=0;i=e;return m|0}else if((n|0)==23){$=zq(c[d>>2]|0,(c[o>>2]|0)+22|0)|0;if($<<16>>16==0|($&65535)>>>0>4>>>0){c[b+204>>2]=-56;aa=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-56);if((aa&512)!=0){m=0;i=e;return m|0}aa=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,aa)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else{aa=($&65535)-1|0;Eq(c[d>>2]|0,(c[o>>2]|0)+28|0,(aa<<3&8|aa>>>1&1)<<8|4);c[b+204>>2]=0;aa=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,0);if((aa&512)!=0){m=0;i=e;return m|0}aa=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,aa)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}else if((n|0)==21315){aa=k|0;$=l|0;s=zq(c[d>>2]|0,(c[o>>2]|0)+22|0)|0;q=zq(c[d>>2]|0,(c[o>>2]|0)+28|0)|0;_=q&65535;p=Aq(c[d>>2]|0,(c[o>>2]|0)+30|0)|0;O=Aq(c[d>>2]|0,(c[o>>2]|0)+34|0)|0;if(s<<16>>16==0|(s&65535)>>>0>4>>>0){c[b+204>>2]=-56;Z=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-56);if((Z&512)!=0){m=0;i=e;return m|0}Z=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,Z)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}Z=ur(c[b+8>>2]|0,s&65535)|0;if((Z|0)==0){c[b+204>>2]=-64;s=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-64);if((s&512)!=0){m=0;i=e;return m|0}s=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,s)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}if((a[Z+56|0]|0)!=0){c[b+204>>2]=-44;s=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-44);if((s&512)!=0){m=0;i=e;return m|0}s=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,s)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}do{if(q<<16>>16!=0){if(_>>>0>(c[b+64>>2]|0)>>>0){break}s=c[b+68+((_<<1)-2<<2)>>2]|0;do{if(s>>>0<1120>>>0){ba=-2}else{if(s>>>0<1520>>>0){ba=0;break}if(s>>>0<2240>>>0){ba=-1;break}ba=s>>>0<5760>>>0?1:253}}while(0);if((ug(Z,s)|0)!=0){c[b+204>>2]=-50;Y=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-50);if((Y&512)!=0){m=0;i=e;return m|0}Y=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,Y)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}Y=p&16777215;Rz($|0,0,12)|0;c:do{if((s|0)!=0){d:do{if(ba>>>0>1>>>0){X=l+1|0;W=l+2|0;u=l+3|0;t=l+4|0;r=l+5|0;w=l+6|0;j=l+7|0;h=l+8|0;g=l+9|0;f=l+10|0;V=l+11|0;C=O&16777215;x=0;D=Y;while(1){N=0;do{a[k+N|0]=yq(c[d>>2]|0,N+D|0)|0;N=N+1|0;}while(N>>>0<512>>>0);a[$]=yq(c[d>>2]|0,C)|0;a[X]=yq(c[d>>2]|0,C+1|0)|0;a[W]=yq(c[d>>2]|0,C+2|0)|0;a[u]=yq(c[d>>2]|0,C+3|0)|0;a[t]=yq(c[d>>2]|0,C+4|0)|0;a[r]=yq(c[d>>2]|0,C+5|0)|0;a[w]=yq(c[d>>2]|0,C+6|0)|0;a[j]=yq(c[d>>2]|0,C+7|0)|0;a[h]=yq(c[d>>2]|0,C+8|0)|0;a[g]=yq(c[d>>2]|0,C+9|0)|0;a[f]=yq(c[d>>2]|0,C+10|0)|0;a[V]=yq(c[d>>2]|0,C+11|0)|0;if((vg(Z,aa,$,x)|0)!=0){break d}N=x+1|0;if(N>>>0<s>>>0){C=C+12|0;x=N;D=D+512|0}else{break c}}}else{D=0;x=Y;while(1){C=0;do{a[k+C|0]=yq(c[d>>2]|0,C+x|0)|0;C=C+1|0;}while(C>>>0<512>>>0);if((vg(Z,aa,$,D)|0)!=0){break d}C=D+1|0;if(C>>>0<s>>>0){D=C;x=x+512|0}else{break c}}}}while(0);c[b+204>>2]=-1;x=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-1);if((x&512)!=0){m=0;i=e;return m|0}x=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,x)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}while(0);c[b+204>>2]=0;s=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,0);if((s&512)!=0){m=0;i=e;return m|0}s=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,s)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}}while(0);c[b+204>>2]=-50;$=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-50);if(($&512)!=0){m=0;i=e;return m|0}$=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,$)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else{He(32752,(U=i,i=i+8|0,c[U>>2]=n,U)|0);i=U;c[b+204>>2]=-17;n=zq(c[d>>2]|0,(c[o>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[o>>2]|0)+16|0,-17);if((n&512)!=0){m=0;i=e;return m|0}n=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,n)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}break};case 19:{d=b+4|0;n=b+208|0;o=(zq(c[d>>2]|0,(c[n>>2]|0)+26|0)|0)&65535;if((o|0)==6){$=zq(c[d>>2]|0,(c[n>>2]|0)+22|0)|0;aa=(zq(c[d>>2]|0,(c[n>>2]|0)+28|0)|0)&65535;Z=Aq(c[d>>2]|0,(c[n>>2]|0)+30|0)|0;if($<<16>>16==0|($&65535)>>>0>4>>>0){c[b+204>>2]=-56;k=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-56);if((k&512)!=0){m=0;i=e;return m|0}k=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,k)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}k=ur(c[b+8>>2]|0,$&65535)|0;if((k|0)==0){c[b+204>>2]=-64;$=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-64);if(($&512)!=0){m=0;i=e;return m|0}$=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,$)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}$=mr(k)|0;O=b+68|0;l=b+64|0;do{if((er(k)|0)==6){c[l>>2]=4;c[O>>2]=800;ba=b+72|0;c[ba>>2]=-2130050992;c[b+76>>2]=1600;p=b+80|0;c[p>>2]=-2113273776;c[b+84>>2]=1440;_=b+88|0;c[_>>2]=-2113339312;c[b+92>>2]=2880;q=b+96|0;c[q>>2]=-1844314032;if($>>>0<1120>>>0){c[ba>>2]=-1056309168;ca=4;break}if($>>>0<1520>>>0){c[_>>2]=-1039597488;ca=4;break}if($>>>0<2240>>>0){c[p>>2]=-1039531952;ca=4;break}if((a[b+60|0]|0)==0){c[l>>2]=1;c[O>>2]=2880;c[ba>>2]=-770572208;ca=1;break}else{c[q>>2]=-770572208;ca=4;break}}else{c[l>>2]=1;c[O>>2]=$;c[b+72>>2]=0;ca=1}}while(0);$=aa>>>0>ca>>>0?ca:aa;aa=c[d>>2]|0;if(($|0)==0){da=aa}else{ca=0;O=aa;while(1){aa=(ca<<3)+Z|0;l=ca<<1;Eq(O,aa,c[b+68+(l<<2)>>2]|0);Eq(c[d>>2]|0,aa+4|0,c[b+68+((l|1)<<2)>>2]|0);l=ca+1|0;aa=c[d>>2]|0;if(l>>>0<$>>>0){ca=l;O=aa}else{da=aa;break}}}Dq(da,(c[n>>2]|0)+28|0,$&65535);c[b+204>>2]=0;$=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,0);if(($&512)!=0){m=0;i=e;return m|0}$=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,$)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else if((o|0)==8){$=zq(c[d>>2]|0,(c[n>>2]|0)+22|0)|0;da=$&65535;if($<<16>>16==0|($&65535)>>>0>4>>>0){c[b+204>>2]=-56;O=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-56);if((O&512)!=0){m=0;i=e;return m|0}O=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,O)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}if((ur(c[b+8>>2]|0,da)|0)==0){c[b+204>>2]=-64;O=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-64);if((O&512)!=0){m=0;i=e;return m|0}O=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,O)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}O=Aq(c[d>>2]|0,308)|0;if(($&65535)>>>0<5>>>0){ea=(da*66|0)+8+O|0}else{ea=O}O=0;do{da=O<<1;$=zq(c[d>>2]|0,da+ea|0)|0;Dq(c[d>>2]|0,da+28+(c[n>>2]|0)|0,$);O=O+1|0;}while(O>>>0<11>>>0);c[b+204>>2]=0;O=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,0);if((O&512)!=0){m=0;i=e;return m|0}O=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,O)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0;m=0;i=e;return m|0}else{c[b+204>>2]=-18;O=zq(c[d>>2]|0,(c[n>>2]|0)+6|0)|0;Dq(c[d>>2]|0,(c[n>>2]|0)+16|0,-18);if((O&512)==0){O=Aq(c[d>>2]|0,308)|0;c[b+212>>2]=Aq(c[d>>2]|0,O)|0;c[b+216>>2]=Aq(c[d>>2]|0,2300)|0}He(35784,(U=i,i=i+8|0,c[U>>2]=o,U)|0);i=U;m=0;i=e;return m|0}break};case 20:{m=0;i=e;return m|0};default:{m=1;i=e;return m|0}}return 0}function sg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=b+1|0;do{if((a[d]|0)!=0){e=b+136|0;f=c[e>>2]|0;if((f|0)==0){break}if((c[b+132>>2]|0)==0){break}g=b+4|0;h=0;i=b+140|0;j=f;while(1){f=(zq(c[g>>2]|0,j+8+(h<<1)|0)|0)&65535;k=(c[e>>2]|0)+f|0;Bq(c[g>>2]|0,k,a[i]|0);Bq(c[g>>2]|0,k+1|0,a[i+1|0]|0);Bq(c[g>>2]|0,k+2|0,a[i+2|0]|0);Bq(c[g>>2]|0,k+3|0,a[i+3|0]|0);Bq(c[g>>2]|0,k+4|0,a[i+4|0]|0);Bq(c[g>>2]|0,k+5|0,a[i+5|0]|0);k=h+1|0;if(k>>>0>=5>>>0){break}h=k;i=i+6|0;j=c[e>>2]|0}a[d]=0}}while(0);a[b|0]=0;c[b+28>>2]=c[b+12>>2];c[b+32>>2]=c[b+16>>2];c[b+36>>2]=c[b+20>>2];c[b+40>>2]=c[b+24>>2];return}function tg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=a+4|0;d=a+208|0;e=zq(c[b>>2]|0,(c[d>>2]|0)+22|0)|0;if(e<<16>>16==0|(e&65535)>>>0>4>>>0){c[a+204>>2]=-56;f=zq(c[b>>2]|0,(c[d>>2]|0)+6|0)|0;Dq(c[b>>2]|0,(c[d>>2]|0)+16|0,-56);if((f&512)!=0){return}f=Aq(c[b>>2]|0,308)|0;c[a+212>>2]=Aq(c[b>>2]|0,f)|0;c[a+216>>2]=Aq(c[b>>2]|0,2300)|0;return}f=c[a+48>>2]|0;g=c[a+52>>2]|0;h=ur(c[a+8>>2]|0,e&65535)|0;do{if((h|0)==0){i=f}else{e=mr(h)|0;if((e|0)==800|(e|0)==1600|(e|0)==1440|(e|0)==2880){i=f;break}i=g}}while(0);Eq(c[b>>2]|0,(c[d>>2]|0)+28|0,i);c[a+204>>2]=0;i=zq(c[b>>2]|0,(c[d>>2]|0)+6|0)|0;Dq(c[b>>2]|0,(c[d>>2]|0)+16|0,0);if((i&512)!=0){return}i=Aq(c[b>>2]|0,308)|0;c[a+212>>2]=Aq(c[b>>2]|0,i)|0;c[a+216>>2]=Aq(c[b>>2]|0,2300)|0;return}function ug(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;i=i+512|0;e=d|0;if((er(a)|0)!=6){if((mr(a)|0)!=(b|0)){f=1;i=d;return f|0}g=e|0;Rz(g|0,0,512)|0;if((b|0)==0){f=0;i=d;return f|0}else{h=0}while(1){qr(a,g,h,1)|0;j=h+1|0;if(j>>>0<b>>>0){h=j}else{f=0;break}}i=d;return f|0}h=c[a+64>>2]|0;g=h;j=e|0;Rz(j|0,0,12)|0;do{if(b>>>0<1120>>>0){k=1;l=9}else{if(b>>>0<1520>>>0){m=2}else{if(b>>>0<2240>>>0){k=2;l=9;break}m=b>>>0<5760>>>0?3:255}Jq(g)|0;e=(m|0)==2;if((m-2|0)>>>0>=2>>>0){f=1;i=d;return f|0}Kq(g,e?2:32770);n=e?9:18;e=0;do{o=0;while(1){p=o+1|0;Lq(g,e,0,e,0,p,512,0)|0;if(p>>>0<n>>>0){o=p}else{q=0;break}}do{q=q+1|0;Lq(g,e,1,e,1,q,512,0)|0;}while(q>>>0<n>>>0);e=e+1|0;}while(e>>>0<80>>>0)}}while(0);if((l|0)==9){Jq(g)|0;Kq(g,3);l=h+68|0;h=13;q=0;do{h=(((q&15|0)==0)<<31>>31)+h|0;if((h|0)!=0){m=0;do{b=0;do{Lq(g,q,m,q,m,b,512,0)|0;e=eu(c[l>>2]|0,q,m,b,1)|0;if((e|0)!=0){Qt(e,j,12)|0}b=b+1|0;}while(b>>>0<h>>>0);m=m+1|0;}while(m>>>0<k>>>0)}q=q+1|0;}while(q>>>0<80>>>0)}q=mr(a)|0;He(57672,(a=i,i=i+8|0,c[a>>2]=q,a)|0);i=a;f=0;i=d;return f|0}function vg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;if((er(a)|0)!=6){l=(qr(a,b,e,1)|0)!=0|0;i=f;return l|0}if((wg(mr(a)|0,e,g,h,j)|0)!=0){l=1;i=f;return l|0}e=mr(a)|0;if(e>>>0<1120>>>0|(e-1520|0)>>>0<720>>>0){e=a+64|0;m=c[g>>2]|0;n=c[h>>2]|0;o=c[j>>2]|0;Iq(c[e>>2]|0,d,12,m,n,o,0)|0;p=m;q=n;r=o;s=e}else{p=c[g>>2]|0;q=c[h>>2]|0;r=c[j>>2]|0;s=a+64|0}c[k>>2]=512;if((Hq(c[s>>2]|0,b,k,p,q,r,0)|0)==0){l=0;i=f;return l|0}He(31416,(k=i,i=i+24|0,c[k>>2]=p,c[k+8>>2]=q,c[k+16>>2]=r,k)|0);i=k;l=1;i=f;return l|0}function wg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;a:do{if(a>>>0<1120>>>0){h=1}else{do{if(a>>>0<1520>>>0){c[f>>2]=((b>>>0)%9|0)+1;c[e>>2]=((b>>>0)/9|0)&1;j=(b>>>0)/18|0}else{if(a>>>0<2240>>>0){h=0;break a}if(a>>>0<5760>>>0){c[f>>2]=((b>>>0)%18|0)+1;c[e>>2]=((b>>>0)/18|0)&1;j=(b>>>0)/36|0;break}He(30448,(k=i,i=i+16|0,c[k>>2]=a,c[k+8>>2]=b,k)|0);i=k;l=1;i=g;return l|0}}while(0);c[d>>2]=j;l=0;i=g;return l|0}}while(0);j=h?1:2;c[d>>2]=0;a=j*192|0;do{if(a>>>0>b>>>0){m=12;n=b}else{k=b-a|0;c[d>>2]=16;o=j*176|0;if(k>>>0<o>>>0){m=11;n=k;break}p=k-o|0;c[d>>2]=32;o=j*160|0;if(p>>>0<o>>>0){m=10;n=p;break}k=p-o|0;c[d>>2]=48;o=j*144|0;if(k>>>0<o>>>0){m=9;n=k;break}p=k-o|0;c[d>>2]=64;if(p>>>0<j<<7>>>0){m=8;n=p;break}c[d>>2]=80;l=1;i=g;return l|0}}while(0);c[f>>2]=(n>>>0)%(m>>>0)|0;c[e>>2]=((n>>>0)/(m>>>0)|0)&(h&1^1);h=(n>>>0)/((ca(m,j)|0)>>>0)|0;c[d>>2]=(c[d>>2]|0)+h;l=0;i=g;return l|0}function xg(a){a=a|0;c[a+756>>2]=0;c[a+760>>2]=0;c[a+764>>2]=0;Rz(a|0,0,16)|0;c[a+768>>2]=8e3;yv(a+772|0);b[a+820>>1]=-32768;c[a+824>>2]=0;c[a+828>>2]=60;return}function yg(a,b){a=a|0;b=b|0;c[a+4>>2]=b;return}function zg(a,b){a=a|0;b=b|0;c[a+768>>2]=b;Av(a+772|0,b,22255);return}function Ag(a,b){a=a|0;b=b|0;c[a+764>>2]=b;return}function Bg(a,b){a=a|0;b=b|0;var d=0;d=(b|0)!=0|0;b=a+760|0;if((c[b>>2]|0)==(d|0)){return}c[b>>2]=d;return}function Cg(a,b){a=a|0;b=b|0;var d=0,e=0;d=a|0;a=c[d>>2]|0;if((a|0)!=0){Fv(a)}a=Iv(b)|0;c[d>>2]=a;if((a|0)==0){e=1;return e|0}if((Hv(a,1,22255,0)|0)==0){e=0;return e|0}Fv(c[d>>2]|0);c[d>>2]=0;e=1;return e|0}function Dg(a){a=a|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+8192|0;g=f|0;h=a+4|0;if((c[h>>2]|0)==0){i=f;return}j=a|0;if((c[j>>2]|0)==0){i=f;return}k=a+12|0;l=c[k>>2]|0;a:do{if(l>>>0<370>>>0){m=a+760|0;if((c[m>>2]|0)==0){if((c[a+828>>2]|0)>>>0>59>>>0&(l|0)==0){break}n=a+820|0;if((b[n>>1]|0)!=-32768){c[a+824>>2]=1}o=a+8|0;p=370-l|0;q=l;do{if(q>>>0>=370>>>0){break}b[a+16+(q<<1)>>1]=-32768;r=(c[o>>2]|0)+1|0;c[o>>2]=r>>>0>369>>>0?0:r;q=(c[k>>2]|0)+1|0;c[k>>2]=q;p=p-1|0;}while((p|0)!=0);b[n>>1]=-32768;break}p=8-(c[a+764>>2]|0)|0;q=a+8|0;o=a+820|0;r=a+824|0;s=370-l|0;t=l;do{if(t>>>0>=370>>>0){break a}u=c[q>>2]|0;do{if((c[m>>2]|0)==0){v=32768}else{w=d[(c[h>>2]|0)+(u<<1)|0]<<8;if(w>>>0<32768>>>0){v=32768-(((32768-w|0)>>>0)/(p>>>0)|0)|0;break}else{v=(((w-32768|0)>>>0)/(p>>>0)|0)+32768|0;break}}}while(0);w=u+1|0;c[q>>2]=w>>>0>369>>>0?0:w;w=v&65535;if((v|0)!=(e[o>>1]|0)){b[o>>1]=w;c[r>>2]=1}b[a+16+(t<<1)>>1]=w;t=(c[k>>2]|0)+1|0;c[k>>2]=t;s=s-1|0;}while((s|0)!=0)}}while(0);v=a+824|0;h=a+828|0;l=c[h>>2]|0;do{if((c[v>>2]|0)==0){if(l>>>0>=60>>>0){break}s=l+1|0;c[h>>2]=s;if(s>>>0<60>>>0){x=27}}else{if(l>>>0>59>>>0){s=c[j>>2]|0;Rz(g|0,0,8192)|0;Gv(s,g|0,4096)|0}c[h>>2]=0;x=27}}while(0);if((x|0)==27){if((c[a+768>>2]|0)==0){y=a+16|0}else{x=a+16|0;Bv(a+772|0,x,x,c[k>>2]|0,1,0);y=x}Gv(c[j>>2]|0,y,c[k>>2]|0)|0}c[v>>2]=0;c[a+8>>2]=16;c[k>>2]=0;c[a+756>>2]=0;i=f;return}function Eg(a,f){a=a|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=a+760|0;if((c[g>>2]|0)==0){return}h=a+4|0;if((c[h>>2]|0)==0){return}i=a+12|0;j=c[i>>2]|0;if(j>>>0>369>>>0){return}k=a+756|0;l=(c[k>>2]|0)+f|0;c[k>>2]=l;if(l>>>0<=351>>>0){return}c[k>>2]=(l>>>0)%352|0;k=8-(c[a+764>>2]|0)|0;f=a+8|0;m=a+820|0;n=a+824|0;o=(l>>>0)/352|0;l=j;while(1){if(l>>>0>=370>>>0){p=14;break}j=c[f>>2]|0;do{if((c[g>>2]|0)==0){q=32768}else{r=(d[(c[h>>2]|0)+(j<<1)|0]|0)<<8;if(r>>>0<32768>>>0){q=32768-(((32768-r|0)>>>0)/(k>>>0)|0)|0;break}else{q=(((r-32768|0)>>>0)/(k>>>0)|0)+32768|0;break}}}while(0);r=j+1|0;c[f>>2]=r>>>0>369>>>0?0:r;r=q&65535;if((q|0)!=(e[m>>1]|0|0)){b[m>>1]=r;c[n>>2]=1}b[a+16+(l<<1)>>1]=r;r=(c[i>>2]|0)+1|0;c[i>>2]=r;s=o-1|0;if((s|0)==0){p=14;break}else{o=s;l=r}}if((p|0)==14){return}}function Fg(a){a=a|0;var b=0,d=0,f=0,g=0,h=0,i=0;if((a&61440|0)!=40960){b=0;return b|0}d=(a&2048|0)==0;f=d?63743:64511;g=d?5208:400;d=0;while(1){h=c[g+(d<<3)+4>>2]|0;if((h|0)==0){b=0;i=5;break}if((((e[g+(d<<3)>>1]|0)^a)&f|0)==0){b=h;i=5;break}else{d=d+1|0}}if((i|0)==5){return b|0}return 0}function Gg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=Mz(60)|0;f=e;if((e|0)==0){g=0;return g|0}c[e>>2]=0;c[e+44>>2]=0;c[e+4>>2]=b;c[e+8>>2]=d;a[e+12|0]=0;c[e+16>>2]=8;h=Mz(ca((b+7|0)>>>3,d)|0)|0;c[e+20>>2]=h;do{if((h|0)!=0){d=Mz(b*24|0)|0;c[e+24>>2]=d;if((d|0)==0){break}c[e+28>>2]=255;a[e+32|0]=0;a[e+33|0]=0;a[e+34|0]=0;a[e+35|0]=-1;a[e+36|0]=-1;a[e+37|0]=-1;c[e+40>>2]=0;a[e+48|0]=0;c[e+52>>2]=0;c[e+56>>2]=0;g=f;return g|0}}while(0);Nz(e);g=0;return g|0}function Hg(a,b,d){a=a|0;b=b|0;d=d|0;c[a+52>>2]=b;c[a+56>>2]=d;return}function Ig(a,b){a=a|0;b=b|0;c[a>>2]=b;return}function Jg(a,b){a=a|0;b=b|0;c[a+44>>2]=b;if((b|0)==0){return}jz(b,c[a+4>>2]|0,c[a+8>>2]|0)|0;return}function Kg(b,c,d){b=b|0;c=c|0;d=d|0;a[b+32|0]=c>>>16;a[b+35|0]=d>>>16;a[b+33|0]=c>>>8;a[b+36|0]=d>>>8;a[b+34|0]=c;a[b+37|0]=d;a[b+12|0]=1;return}function Lg(b,d){b=b|0;d=d|0;var e=0;e=d>>>0>255>>>0?255:d;d=b+28|0;if((c[d>>2]|0)==(e|0)){return}a[b+12|0]=1;c[d>>2]=e;return}function Mg(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=b+44|0;j=c[h>>2]|0;if((j|0)==0){i=e;return}k=b|0;if((c[k>>2]|0)==0){i=e;return}l=c[b+28>>2]|0;m=f|0;a[m]=((ca(d[b+32|0]|0,l)|0)>>>0)/255|0;n=g|0;a[n]=((ca(d[b+35|0]|0,l)|0)>>>0)/255|0;o=f+1|0;a[o]=((ca(d[b+33|0]|0,l)|0)>>>0)/255|0;p=g+1|0;a[p]=((ca(d[b+36|0]|0,l)|0)>>>0)/255|0;q=f+2|0;a[q]=((ca(d[b+34|0]|0,l)|0)>>>0)/255|0;f=g+2|0;a[f]=((ca(d[b+37|0]|0,l)|0)>>>0)/255|0;l=b+4|0;g=b+8|0;rz(j,c[l>>2]|0,c[g>>2]|0);j=c[b+24>>2]|0;r=c[g>>2]|0;a:do{if((r|0)==0){s=b+12|0}else{t=b+16|0;u=b+12|0;v=c[k>>2]|0;w=c[b+20>>2]|0;x=0;y=r;while(1){z=y-x|0;A=c[t>>2]|0;B=z>>>0>A>>>0?A:z;z=ca(((c[l>>2]|0)+7|0)>>>3,B)|0;if((a[u]|0)==0){if((Vz(w|0,v|0,z|0)|0)==0){C=y}else{D=8}}else{D=8}if((D|0)==8){D=0;Sz(w|0,v|0,z)|0;A=z<<3;if((A|0)!=0){E=0;F=0;while(1){if((d[w+(F>>>3)|0]&128>>>((F&7)>>>0)|0)==0){a[j+E|0]=a[n]|0;a[j+(E+1)|0]=a[p]|0;a[j+(E+2)|0]=a[f]|0}else{a[j+E|0]=a[m]|0;a[j+(E+1)|0]=a[o]|0;a[j+(E+2)|0]=a[q]|0}G=F+1|0;if(G>>>0<A>>>0){E=E+3|0;F=G}else{break}}}vz(c[h>>2]|0,j,x,B);C=c[g>>2]|0}F=B+x|0;if(F>>>0>=C>>>0){s=u;break a}v=v+z|0;w=w+z|0;x=F;y=C}}}while(0);a[s]=0;wz(c[h>>2]|0);i=e;return}function Ng(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b+40|0;f=c[e>>2]|0;g=f+d|0;c[e>>2]=g;if(g>>>0<120384>>>0){return}do{if(f>>>0<120384>>>0){Mg(b);g=b+48|0;if((a[g]|0)==1){break}a[g]=1;g=c[b+56>>2]|0;if((g|0)==0){break}nc[g&511](c[b+52>>2]|0,1)}}while(0);f=c[e>>2]|0;if(f>>>0<=130239>>>0){return}g=b+48|0;do{if((a[g]|0)==0){h=f}else{a[g]=0;d=c[b+56>>2]|0;if((d|0)==0){h=f;break}nc[d&511](c[b+52>>2]|0,0);h=c[e>>2]|0}}while(0);c[e>>2]=h-130240;return}function Og(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=i;i=i+16|0;j=h|0;k=e+36|0;l=e+32|0;m=e+8|0;n=e+4|0;e=0;do{o=e+g&16777215;if(o>>>0<(c[k>>2]|0)>>>0){p=a[(c[l>>2]|0)+o|0]|0}else{p=sc[c[m>>2]&63](c[n>>2]|0,o)|0}a[j+e|0]=p;e=e+1|0;}while(e>>>0<16>>>0);e=j|0;c[f>>2]=0;c[f+4>>2]=g;a[f+288|0]=0;g=a[e]|0;p=a[j+1|0]|0;b[f+12>>1]=(g&255)<<8|p&255;n=f+8|0;c[n>>2]=1;nc[c[20824+(((p&255)>>>6|(g&255)<<2)<<2)>>2]&511](f,e);if((c[n>>2]|0)==0){i=h;return}else{q=0}do{e=q<<1;b[f+12+(q<<1)>>1]=(d[j+e|0]|0)<<8|(d[j+(e|1)|0]|0);q=q+1|0;}while(q>>>0<(c[n>>2]|0)>>>0);i=h;return}function Pg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=(b[e+12>>1]&63)==60;j=e+32|0;a[j]=a[47656]|0;a[j+1|0]=a[47657]|0;a[j+2|0]=a[47658]|0;a[j+3|0]=a[47659]|0;a[j+4|0]=a[47660]|0;a[j+5|0]=a[47661]|0;c[e+28>>2]=2;j=d[f+3|0]|0;cb(e+96|0,54872,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;k=e+8|0;c[k>>2]=(c[k>>2]|0)+1;k=e+160|0;if(h){h=k;y=5391171;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;i=g;return}else{yj(e,k,f,a[f+1|0]&63,8);i=g;return}}function Qg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=(b[e+12>>1]&63)==60;j=e+32|0;a[j]=a[47688]|0;a[j+1|0]=a[47689]|0;a[j+2|0]=a[47690]|0;a[j+3|0]=a[47691]|0;a[j+4|0]=a[47692]|0;a[j+5|0]=a[47693]|0;c[e+28>>2]=2;j=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;k=e+8|0;c[k>>2]=(c[k>>2]|0)+1;k=e+160|0;if(h){a[k]=a[51480]|0;a[k+1|0]=a[51481]|0;a[k+2|0]=a[51482]|0;h=e|0;c[h>>2]=c[h>>2]|1;i=g;return}else{yj(e,k,f,a[f+1|0]&63,16);i=g;return}}function Rg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[47712]|0;a[g+1|0]=a[47713]|0;a[g+2|0]=a[47714]|0;a[g+3|0]=a[47715]|0;a[g+4|0]=a[47716]|0;a[g+5|0]=a[47717]|0;c[b+28>>2]=2;g=(((d[e+2|0]|0)<<8|(d[e+3|0]|0))<<8|(d[e+4|0]|0))<<8|(d[e+5|0]|0);cb(b+96|0,54088,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+2;yj(b,b+160|0,e,a[e+1|0]&63,32);i=f;return}function Sg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=b+8|0;h=c[g>>2]|0;j=a[e+(h<<1)|0]|0;c[g>>2]=h+1;h=b+32|0;if((j&8)==0){a[h]=a[47736]|0;a[h+1|0]=a[47737]|0;a[h+2|0]=a[47738]|0;a[h+3|0]=a[47739]|0;a[h+4|0]=a[47740]|0;a[h+5|0]=a[47741]|0;a[h+6|0]=a[47742]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);j=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|128;c[l>>2]=n;i=f;return}else{a[h]=a[47768]|0;a[h+1|0]=a[47769]|0;a[h+2|0]=a[47770]|0;a[h+3|0]=a[47771]|0;a[h+4|0]=a[47772]|0;a[h+5|0]=a[47773]|0;a[h+6|0]=a[47774]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);h=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(h&128|0)!=0?34768:32184,c[k+8>>2]=h>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|128;c[l>>2]=n;i=f;return}}function Tg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b[e+12>>1]|0;j=e+32|0;if((h&56)==8){k=j;l=k|0;y=1163284301;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;l=k+4|0;y=5713488;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;c[e+28>>2]=2;l=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;k=(l&32768|0)!=0;cb(e+96|0,57488,(m=i,i=i+32|0,c[m>>2]=k?56360:62904,c[m+8>>2]=41376,c[m+16>>2]=(k?-l|0:l)&65535,c[m+24>>2]=h&7,m)|0)|0;i=m;h=e+8|0;c[h>>2]=(c[h>>2]|0)+1;cb(e+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;i=g;return}else{a[j]=a[48328]|0;a[j+1|0]=a[48329]|0;a[j+2|0]=a[48330]|0;a[j+3|0]=a[48331]|0;a[j+4|0]=a[48332]|0;c[e+28>>2]=2;cb(e+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(e,e+160|0,f,a[f+1|0]&63,8);i=g;return}}function Ug(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b[e+12>>1]|0;j=e+32|0;if((h&56)==8){k=j;l=k|0;y=1163284301;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;l=k+4|0;y=4992592;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;c[e+28>>2]=2;l=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;k=(l&32768|0)!=0;cb(e+96|0,57488,(m=i,i=i+32|0,c[m>>2]=k?56360:62904,c[m+8>>2]=41376,c[m+16>>2]=(k?-l|0:l)&65535,c[m+24>>2]=h&7,m)|0)|0;i=m;h=e+8|0;c[h>>2]=(c[h>>2]|0)+1;cb(e+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;i=g;return}else{a[j]=a[48376]|0;a[j+1|0]=a[48377]|0;a[j+2|0]=a[48378]|0;a[j+3|0]=a[48379]|0;a[j+4|0]=a[48380]|0;c[e+28>>2]=2;cb(e+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(e,e+160|0,f,a[f+1|0]&63,8);i=g;return}}function Vg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;h=e+12|0;j=e+32|0;if((b[h>>1]&56)==8){k=j;l=k|0;y=1163284301;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;l=k+4|0;y=5713488;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;c[e+28>>2]=2;cb(e+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;l=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;k=(l&32768|0)!=0;n=b[h>>1]&7;cb(e+160|0,57488,(m=i,i=i+32|0,c[m>>2]=k?56360:62904,c[m+8>>2]=41376,c[m+16>>2]=(k?-l|0:l)&65535,c[m+24>>2]=n,m)|0)|0;i=m;n=e+8|0;c[n>>2]=(c[n>>2]|0)+1;i=g;return}else{a[j]=a[48400]|0;a[j+1|0]=a[48401]|0;a[j+2|0]=a[48402]|0;a[j+3|0]=a[48403]|0;a[j+4|0]=a[48404]|0;c[e+28>>2]=2;cb(e+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(e,e+160|0,f,a[f+1|0]&63,8);i=g;return}}function Wg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;h=e+12|0;j=e+32|0;if((b[h>>1]&56)==8){k=j;l=k|0;y=1163284301;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;l=k+4|0;y=4992592;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;c[e+28>>2]=2;cb(e+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;l=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;k=(l&32768|0)!=0;n=b[h>>1]&7;cb(e+160|0,57488,(m=i,i=i+32|0,c[m>>2]=k?56360:62904,c[m+8>>2]=41376,c[m+16>>2]=(k?-l|0:l)&65535,c[m+24>>2]=n,m)|0)|0;i=m;n=e+8|0;c[n>>2]=(c[n>>2]|0)+1;i=g;return}else{a[j]=a[48424]|0;a[j+1|0]=a[48425]|0;a[j+2|0]=a[48426]|0;a[j+3|0]=a[48427]|0;a[j+4|0]=a[48428]|0;c[e+28>>2]=2;cb(e+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(e,e+160|0,f,a[f+1|0]&63,8);i=g;return}}function Xg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=(b[e+12>>1]&63)==60;j=e+32|0;a[j]=a[47808]|0;a[j+1|0]=a[47809]|0;a[j+2|0]=a[47810]|0;a[j+3|0]=a[47811]|0;a[j+4|0]=a[47812]|0;a[j+5|0]=a[47813]|0;a[j+6|0]=a[47814]|0;c[e+28>>2]=2;j=d[f+3|0]|0;cb(e+96|0,54872,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;k=e+8|0;c[k>>2]=(c[k>>2]|0)+1;k=e+160|0;if(h){h=k;y=5391171;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;i=g;return}else{yj(e,k,f,a[f+1|0]&63,8);i=g;return}}function Yg(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=(b[e+12>>1]&63)==60;j=e+32|0;a[j]=a[47824]|0;a[j+1|0]=a[47825]|0;a[j+2|0]=a[47826]|0;a[j+3|0]=a[47827]|0;a[j+4|0]=a[47828]|0;a[j+5|0]=a[47829]|0;a[j+6|0]=a[47830]|0;c[e+28>>2]=2;j=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;k=e+8|0;c[k>>2]=(c[k>>2]|0)+1;k=e+160|0;if(h){a[k]=a[51480]|0;a[k+1|0]=a[51481]|0;a[k+2|0]=a[51482]|0;h=e|0;c[h>>2]=c[h>>2]|1;i=g;return}else{yj(e,k,f,a[f+1|0]&63,16);i=g;return}}function Zg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[47888]|0;a[g+1|0]=a[47889]|0;a[g+2|0]=a[47890]|0;a[g+3|0]=a[47891]|0;a[g+4|0]=a[47892]|0;a[g+5|0]=a[47893]|0;a[g+6|0]=a[47894]|0;c[b+28>>2]=2;g=(((d[e+2|0]|0)<<8|(d[e+3|0]|0))<<8|(d[e+4|0]|0))<<8|(d[e+5|0]|0);cb(b+96|0,54088,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+2;yj(b,b+160|0,e,a[e+1|0]&63,32);i=f;return}function _g(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=b+8|0;h=c[g>>2]|0;j=a[e+(h<<1)|0]|0;c[g>>2]=h+1;h=b+32|0;if((j&8)==0){a[h]=a[47960]|0;a[h+1|0]=a[47961]|0;a[h+2|0]=a[47962]|0;a[h+3|0]=a[47963]|0;a[h+4|0]=a[47964]|0;a[h+5|0]=a[47965]|0;a[h+6|0]=a[47966]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);j=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|128;c[l>>2]=n;i=f;return}else{a[h]=a[47992]|0;a[h+1|0]=a[47993]|0;a[h+2|0]=a[47994]|0;a[h+3|0]=a[47995]|0;a[h+4|0]=a[47996]|0;a[h+5|0]=a[47997]|0;a[h+6|0]=a[47998]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);h=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(h&128|0)!=0?34768:32184,c[k+8>>2]=h>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|128;c[l>>2]=n;i=f;return}}function $g(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48008]|0;a[g+1|0]=a[48009]|0;a[g+2|0]=a[48010]|0;a[g+3|0]=a[48011]|0;a[g+4|0]=a[48012]|0;a[g+5|0]=a[48013]|0;a[g+6|0]=a[48014]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function ah(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48032]|0;a[g+1|0]=a[48033]|0;a[g+2|0]=a[48034]|0;a[g+3|0]=a[48035]|0;a[g+4|0]=a[48036]|0;a[g+5|0]=a[48037]|0;a[g+6|0]=a[48038]|0;c[b+28>>2]=2;g=((d[e+2|0]|0)<<8|(d[e+3|0]|0))&65535;cb(b+96|0,47472,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,16);i=f;return}function bh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48056]|0;a[g+1|0]=a[48057]|0;a[g+2|0]=a[48058]|0;a[g+3|0]=a[48059]|0;a[g+4|0]=a[48060]|0;a[g+5|0]=a[48061]|0;a[g+6|0]=a[48062]|0;c[b+28>>2]=2;g=(((d[e+2|0]|0)<<8|(d[e+3|0]|0))<<8|(d[e+4|0]|0))<<8|(d[e+5|0]|0);cb(b+96|0,54088,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+2;yj(b,b+160|0,e,a[e+1|0]&63,32);i=f;return}function ch(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=b+8|0;h=c[g>>2]|0;j=a[e+(h<<1)|0]|0;c[g>>2]=h+1;h=b+32|0;if((j&8)==0){a[h]=a[48072]|0;a[h+1|0]=a[48073]|0;a[h+2|0]=a[48074]|0;a[h+3|0]=a[48075]|0;a[h+4|0]=a[48076]|0;a[h+5|0]=a[48077]|0;a[h+6|0]=a[48078]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);j=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|128;c[l>>2]=n;i=f;return}else{a[h]=a[48104]|0;a[h+1|0]=a[48105]|0;a[h+2|0]=a[48106]|0;a[h+3|0]=a[48107]|0;a[h+4|0]=a[48108]|0;a[h+5|0]=a[48109]|0;a[h+6|0]=a[48110]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);h=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(h&128|0)!=0?34768:32184,c[k+8>>2]=h>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|128;c[l>>2]=n;i=f;return}}function dh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48144]|0;a[g+1|0]=a[48145]|0;a[g+2|0]=a[48146]|0;a[g+3|0]=a[48147]|0;a[g+4|0]=a[48148]|0;a[g+5|0]=a[48149]|0;a[g+6|0]=a[48150]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function eh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48168]|0;a[g+1|0]=a[48169]|0;a[g+2|0]=a[48170]|0;a[g+3|0]=a[48171]|0;a[g+4|0]=a[48172]|0;a[g+5|0]=a[48173]|0;a[g+6|0]=a[48174]|0;c[b+28>>2]=2;g=((d[e+2|0]|0)<<8|(d[e+3|0]|0))&65535;cb(b+96|0,47472,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,16);i=f;return}function fh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48264]|0;a[g+1|0]=a[48265]|0;a[g+2|0]=a[48266]|0;a[g+3|0]=a[48267]|0;a[g+4|0]=a[48268]|0;a[g+5|0]=a[48269]|0;a[g+6|0]=a[48270]|0;c[b+28>>2]=2;g=(((d[e+2|0]|0)<<8|(d[e+3|0]|0))<<8|(d[e+4|0]|0))<<8|(d[e+5|0]|0);cb(b+96|0,54088,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+2;yj(b,b+160|0,e,a[e+1|0]&63,32);i=f;return}function gh(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[36120]|0;a[g+1|0]=a[36121]|0;a[g+2|0]=a[36122]|0;c[b+28>>2]=1;g=((d[e]|0)<<8|(d[e+1|0]|0))&65535;cb(b+96|0,47472,(b=i,i=i+16|0,c[b>>2]=41376,c[b+8>>2]=g,b)|0)|0;i=b;i=f;return}function hh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48328]|0;a[g+1|0]=a[48329]|0;a[g+2|0]=a[48330]|0;a[g+3|0]=a[48331]|0;a[g+4|0]=a[48332]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function ih(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48376]|0;a[g+1|0]=a[48377]|0;a[g+2|0]=a[48378]|0;a[g+3|0]=a[48379]|0;a[g+4|0]=a[48380]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function jh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48400]|0;a[g+1|0]=a[48401]|0;a[g+2|0]=a[48402]|0;a[g+3|0]=a[48403]|0;a[g+4|0]=a[48404]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function kh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48424]|0;a[g+1|0]=a[48425]|0;a[g+2|0]=a[48426]|0;a[g+3|0]=a[48427]|0;a[g+4|0]=a[48428]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function lh(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=(b[e+12>>1]&63)==60;j=e+32|0;a[j]=a[48472]|0;a[j+1|0]=a[48473]|0;a[j+2|0]=a[48474]|0;a[j+3|0]=a[48475]|0;a[j+4|0]=a[48476]|0;a[j+5|0]=a[48477]|0;a[j+6|0]=a[48478]|0;c[e+28>>2]=2;j=d[f+3|0]|0;cb(e+96|0,54872,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;k=e+8|0;c[k>>2]=(c[k>>2]|0)+1;k=e+160|0;if(h){h=k;y=5391171;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;i=g;return}else{yj(e,k,f,a[f+1|0]&63,8);i=g;return}}function mh(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=(b[e+12>>1]&63)==60;j=e+32|0;a[j]=a[48496]|0;a[j+1|0]=a[48497]|0;a[j+2|0]=a[48498]|0;a[j+3|0]=a[48499]|0;a[j+4|0]=a[48500]|0;a[j+5|0]=a[48501]|0;a[j+6|0]=a[48502]|0;c[e+28>>2]=2;j=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;k=e+8|0;c[k>>2]=(c[k>>2]|0)+1;k=e+160|0;if(h){a[k]=a[51480]|0;a[k+1|0]=a[51481]|0;a[k+2|0]=a[51482]|0;h=e|0;c[h>>2]=c[h>>2]|1;i=g;return}else{yj(e,k,f,a[f+1|0]&63,16);i=g;return}}function nh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48536]|0;a[g+1|0]=a[48537]|0;a[g+2|0]=a[48538]|0;a[g+3|0]=a[48539]|0;a[g+4|0]=a[48540]|0;a[g+5|0]=a[48541]|0;a[g+6|0]=a[48542]|0;c[b+28>>2]=2;g=(((d[e+2|0]|0)<<8|(d[e+3|0]|0))<<8|(d[e+4|0]|0))<<8|(d[e+5|0]|0);cb(b+96|0,54088,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+2;yj(b,b+160|0,e,a[e+1|0]&63,32);i=f;return}function oh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48568]|0;a[g+1|0]=a[48569]|0;a[g+2|0]=a[48570]|0;a[g+3|0]=a[48571]|0;a[g+4|0]=a[48572]|0;a[g+5|0]=a[48573]|0;a[g+6|0]=a[48574]|0;c[b+28>>2]=2;g=d[e+3|0]|0;cb(b+96|0,54872,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,8);i=f;return}function ph(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48600]|0;a[g+1|0]=a[48601]|0;a[g+2|0]=a[48602]|0;a[g+3|0]=a[48603]|0;a[g+4|0]=a[48604]|0;a[g+5|0]=a[48605]|0;a[g+6|0]=a[48606]|0;c[b+28>>2]=2;g=((d[e+2|0]|0)<<8|(d[e+3|0]|0))&65535;cb(b+96|0,47472,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+1;yj(b,b+160|0,e,a[e+1|0]&63,16);i=f;return}function qh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;a[g]=a[48664]|0;a[g+1|0]=a[48665]|0;a[g+2|0]=a[48666]|0;a[g+3|0]=a[48667]|0;a[g+4|0]=a[48668]|0;a[g+5|0]=a[48669]|0;a[g+6|0]=a[48670]|0;c[b+28>>2]=2;g=(((d[e+2|0]|0)<<8|(d[e+3|0]|0))<<8|(d[e+4|0]|0))<<8|(d[e+5|0]|0);cb(b+96|0,54088,(h=i,i=i+16|0,c[h>>2]=41376,c[h+8>>2]=g,h)|0)|0;i=h;h=b+8|0;c[h>>2]=(c[h>>2]|0)+2;yj(b,b+160|0,e,a[e+1|0]&63,32);i=f;return}function rh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=b+8|0;h=c[g>>2]|0;j=a[e+(h<<1)|0]|0;c[g>>2]=h+1;h=b+32|0;a[h]=a[48736]|0;a[h+1|0]=a[48737]|0;a[h+2|0]=a[48738]|0;a[h+3|0]=a[48739]|0;a[h+4|0]=a[48740]|0;a[h+5|0]=a[48741]|0;a[h+6|0]=a[48742]|0;c[b+28>>2]=2;h=b+96|0;if((j&8)==0){yj(b,h,e,a[e+1|0]&63,8);j=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|64;c[l>>2]=n;i=f;return}else{j=d[e+2|0]|0;cb(h|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;yj(b,b+160|0,e,a[e+1|0]&63,8);l=b|0;m=c[l>>2]|0;n=m|64;c[l>>2]=n;i=f;return}}function sh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=b+8|0;h=c[g>>2]|0;j=a[e+(h<<1)|0]|0;c[g>>2]=h+1;h=b+32|0;a[h]=a[48768]|0;a[h+1|0]=a[48769]|0;a[h+2|0]=a[48770]|0;a[h+3|0]=a[48771]|0;a[h+4|0]=a[48772]|0;a[h+5|0]=a[48773]|0;a[h+6|0]=a[48774]|0;c[b+28>>2]=2;h=b+96|0;if((j&8)==0){yj(b,h,e,a[e+1|0]&63,16);j=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|64;c[l>>2]=n;i=f;return}else{j=d[e+2|0]|0;cb(h|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;yj(b,b+160|0,e,a[e+1|0]&63,16);l=b|0;m=c[l>>2]|0;n=m|64;c[l>>2]=n;i=f;return}}function th(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=b+8|0;h=c[g>>2]|0;j=a[e+(h<<1)|0]|0;c[g>>2]=h+1;h=b+32|0;a[h]=a[48784]|0;a[h+1|0]=a[48785]|0;a[h+2|0]=a[48786]|0;a[h+3|0]=a[48787]|0;a[h+4|0]=a[48788]|0;a[h+5|0]=a[48789]|0;a[h+6|0]=a[48790]|0;c[b+28>>2]=2;h=b+96|0;if((j&8)==0){yj(b,h,e,a[e+1|0]&63,32);j=d[e+2|0]|0;cb(b+160|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;l=b|0;m=c[l>>2]|0;n=m|64;c[l>>2]=n;i=f;return}else{j=d[e+2|0]|0;cb(h|0,37704,(k=i,i=i+16|0,c[k>>2]=(j&128|0)!=0?34768:32184,c[k+8>>2]=j>>>4&7,k)|0)|0;i=k;yj(b,b+160|0,e,a[e+1|0]&63,32);l=b|0;m=c[l>>2]|0;n=m|64;c[l>>2]=n;i=f;return}}function uh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;y=5262666;a[e]=y;y=y>>8;a[e+1|0]=y;y=y>>8;a[e+2|0]=y;y=y>>8;a[e+3|0]=y;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,0);d=b|0;c[d>>2]=c[d>>2]|2;return}function vh(b,e){b=b|0;e=e|0;var f=0,g=0;f=b+32|0;a[f]=a[48856]|0;a[f+1|0]=a[48857]|0;a[f+2|0]=a[48858]|0;a[f+3|0]=a[48859]|0;a[f+4|0]=a[48860]|0;a[f+5|0]=a[48861]|0;a[f+6|0]=a[48862]|0;c[b+28>>2]=2;f=e+1|0;yj(b,b+96|0,e,a[f]&63,8);g=((d[e]|0)<<8|(d[f]|0))&65535;yj(b,b+160|0,e,g>>>3&56|g>>>9&7,8);return}function wh(b,e){b=b|0;e=e|0;var f=0,g=0;f=b+32|0;a[f]=a[48880]|0;a[f+1|0]=a[48881]|0;a[f+2|0]=a[48882]|0;a[f+3|0]=a[48883]|0;a[f+4|0]=a[48884]|0;a[f+5|0]=a[48885]|0;a[f+6|0]=a[48886]|0;c[b+28>>2]=2;f=e+1|0;yj(b,b+96|0,e,a[f]&63,32);g=((d[e]|0)<<8|(d[f]|0))&65535;yj(b,b+160|0,e,g>>>3&56|g>>>9&7,32);return}function xh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;h=g|0;y=1163284301;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;h=g+4|0;y=4992577;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function yh(b,e){b=b|0;e=e|0;var f=0,g=0;f=b+32|0;a[f]=a[49712]|0;a[f+1|0]=a[49713]|0;a[f+2|0]=a[49714]|0;a[f+3|0]=a[49715]|0;a[f+4|0]=a[49716]|0;a[f+5|0]=a[49717]|0;a[f+6|0]=a[49718]|0;c[b+28>>2]=2;f=e+1|0;yj(b,b+96|0,e,a[f]&63,16);g=((d[e]|0)<<8|(d[f]|0))&65535;yj(b,b+160|0,e,g>>>3&56|g>>>9&7,16);return}function zh(b,e){b=b|0;e=e|0;var f=0,g=0,h=0;f=i;g=b+32|0;h=g|0;y=1163284301;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;h=g+4|0;y=5713473;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ah(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[48944]|0;a[e+1|0]=a[48945]|0;a[e+2|0]=a[48946]|0;a[e+3|0]=a[48947]|0;a[e+4|0]=a[48948]|0;a[e+5|0]=a[48949]|0;a[e+6|0]=a[48950]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,8);d=b|0;c[d>>2]=c[d>>2]|32;return}function Bh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49056]|0;a[e+1|0]=a[49057]|0;a[e+2|0]=a[49058]|0;a[e+3|0]=a[49059]|0;a[e+4|0]=a[49060]|0;a[e+5|0]=a[49061]|0;a[e+6|0]=a[49062]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);d=b|0;c[d>>2]=c[d>>2]|32;return}function Ch(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49136]|0;a[e+1|0]=a[49137]|0;a[e+2|0]=a[49138]|0;a[e+3|0]=a[49139]|0;a[e+4|0]=a[49140]|0;a[e+5|0]=a[49141]|0;a[e+6|0]=a[49142]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,32);d=b|0;c[d>>2]=c[d>>2]|32;return}function Dh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49712]|0;a[e+1|0]=a[49713]|0;a[e+2|0]=a[49714]|0;a[e+3|0]=a[49715]|0;a[e+4|0]=a[49716]|0;a[e+5|0]=a[49717]|0;a[e+6|0]=a[49718]|0;c[b+28>>2]=2;e=b+96|0;a[e]=a[51480]|0;a[e+1|0]=a[51481]|0;a[e+2|0]=a[51482]|0;yj(b,b+160|0,d,a[d+1|0]&63,16);return}function Eh(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;y=4933699;a[g]=y;y=y>>8;a[g+1|0]=y;y=y>>8;a[g+2|0]=y;y=y>>8;a[g+3|0]=y;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Fh(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;y=4277580;a[g]=y;y=y>>8;a[g+1|0]=y;y=y>>8;a[g+2|0]=y;y=y>>8;a[g+3|0]=y;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Gh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49208]|0;a[e+1|0]=a[49209]|0;a[e+2|0]=a[49210]|0;a[e+3|0]=a[49211]|0;a[e+4|0]=a[49212]|0;a[e+5|0]=a[49213]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,8);return}function Hh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49232]|0;a[e+1|0]=a[49233]|0;a[e+2|0]=a[49234]|0;a[e+3|0]=a[49235]|0;a[e+4|0]=a[49236]|0;a[e+5|0]=a[49237]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function Ih(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49248]|0;a[e+1|0]=a[49249]|0;a[e+2|0]=a[49250]|0;a[e+3|0]=a[49251]|0;a[e+4|0]=a[49252]|0;a[e+5|0]=a[49253]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,32);return}function Jh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49712]|0;a[e+1|0]=a[49713]|0;a[e+2|0]=a[49714]|0;a[e+3|0]=a[49715]|0;a[e+4|0]=a[49716]|0;a[e+5|0]=a[49717]|0;a[e+6|0]=a[49718]|0;c[b+28>>2]=2;e=b+96|0;y=5391171;a[e]=y;y=y>>8;a[e+1|0]=y;y=y>>8;a[e+2|0]=y;y=y>>8;a[e+3|0]=y;yj(b,b+160|0,d,a[d+1|0]&63,16);d=b|0;c[d>>2]=c[d>>2]|64;return}function Kh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49304]|0;a[e+1|0]=a[49305]|0;a[e+2|0]=a[49306]|0;a[e+3|0]=a[49307]|0;a[e+4|0]=a[49308]|0;a[e+5|0]=a[49309]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,8);return}function Lh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49352]|0;a[e+1|0]=a[49353]|0;a[e+2|0]=a[49354]|0;a[e+3|0]=a[49355]|0;a[e+4|0]=a[49356]|0;a[e+5|0]=a[49357]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function Mh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49376]|0;a[e+1|0]=a[49377]|0;a[e+2|0]=a[49378]|0;a[e+3|0]=a[49379]|0;a[e+4|0]=a[49380]|0;a[e+5|0]=a[49381]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,32);return}function Nh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49712]|0;a[e+1|0]=a[49713]|0;a[e+2|0]=a[49714]|0;a[e+3|0]=a[49715]|0;a[e+4|0]=a[49716]|0;a[e+5|0]=a[49717]|0;a[e+6|0]=a[49718]|0;c[b+28>>2]=2;yj(b,b+96|0,d,a[d+1|0]&63,16);d=b+160|0;y=5391171;a[d]=y;y=y>>8;a[d+1|0]=y;y=y>>8;a[d+2|0]=y;y=y>>8;a[d+3|0]=y;return}function Oh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49520]|0;a[e+1|0]=a[49521]|0;a[e+2|0]=a[49522]|0;a[e+3|0]=a[49523]|0;a[e+4|0]=a[49524]|0;a[e+5|0]=a[49525]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,8);return}function Ph(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49592]|0;a[e+1|0]=a[49593]|0;a[e+2|0]=a[49594]|0;a[e+3|0]=a[49595]|0;a[e+4|0]=a[49596]|0;a[e+5|0]=a[49597]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function Qh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49648]|0;a[e+1|0]=a[49649]|0;a[e+2|0]=a[49650]|0;a[e+3|0]=a[49651]|0;a[e+4|0]=a[49652]|0;a[e+5|0]=a[49653]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,32);return}function Rh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49712]|0;a[e+1|0]=a[49713]|0;a[e+2|0]=a[49714]|0;a[e+3|0]=a[49715]|0;a[e+4|0]=a[49716]|0;a[e+5|0]=a[49717]|0;a[e+6|0]=a[49718]|0;c[b+28>>2]=2;yj(b,b+96|0,d,a[d+1|0]&63,16);d=b+160|0;a[d]=a[51480]|0;a[d+1|0]=a[51481]|0;a[d+2|0]=a[51482]|0;d=b|0;c[d>>2]=c[d>>2]|1;return}function Sh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[49840]|0;a[e+1|0]=a[49841]|0;a[e+2|0]=a[49842]|0;a[e+3|0]=a[49843]|0;a[e+4|0]=a[49844]|0;a[e+5|0]=a[49845]|0;a[e+6|0]=a[49846]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,8);d=b|0;c[d>>2]=c[d>>2]|32;return}function Th(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=b[d+12>>1]|0;h=d+32|0;if((g&56)==0){a[h]=a[50088]|0;a[h+1|0]=a[50089]|0;a[h+2|0]=a[50090]|0;a[h+3|0]=a[50091]|0;a[h+4|0]=a[50092]|0;c[d+28>>2]=1;cb(d+96|0,44016,(j=i,i=i+8|0,c[j>>2]=g&7,j)|0)|0;i=j;i=f;return}else{j=h;y=4277584;a[j]=y;y=y>>8;a[j+1|0]=y;y=y>>8;a[j+2|0]=y;y=y>>8;a[j+3|0]=y;c[d+28>>2]=1;yj(d,d+96|0,e,a[e+1|0]&63,32);i=f;return}}function Uh(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,j=0,k=0;f=i;g=e[b+12>>1]|0;h=g>>>3&7;if((h|0)==4){j=b+32|0;k=j|0;y=1163284301;a[k]=y;y=y>>8;a[k+1|0]=y;y=y>>8;a[k+2|0]=y;y=y>>8;a[k+3|0]=y;k=j+4|0;y=5713485;a[k]=y;y=y>>8;a[k+1|0]=y;y=y>>8;a[k+2|0]=y;y=y>>8;a[k+3|0]=y;c[b+28>>2]=2;xj(b,b+96|0,d,25,16);yj(b,b+160|0,d,a[d+1|0]&63,16);i=f;return}else if((h|0)==0){h=b+32|0;a[h]=a[50232]|0;a[h+1|0]=a[50233]|0;a[h+2|0]=a[50234]|0;a[h+3|0]=a[50235]|0;a[h+4|0]=a[50236]|0;a[h+5|0]=a[50237]|0;c[b+28>>2]=1;cb(b+96|0,44016,(h=i,i=i+8|0,c[h>>2]=g&7,h)|0)|0;i=h;i=f;return}else{h=b+32|0;g=h|0;y=1163284301;a[g]=y;y=y>>8;a[g+1|0]=y;y=y>>8;a[g+2|0]=y;y=y>>8;a[g+3|0]=y;g=h+4|0;y=5713485;a[g]=y;y=y>>8;a[g+1|0]=y;y=y>>8;a[g+2|0]=y;y=y>>8;a[g+3|0]=y;c[b+28>>2]=2;xj(b,b+96|0,d,24,16);yj(b,b+160|0,d,a[d+1|0]&63,16);i=f;return}}function Vh(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,j=0;f=i;g=e[b+12>>1]|0;h=g>>>3&7;if((h|0)==0){j=b+32|0;a[j]=a[50312]|0;a[j+1|0]=a[50313]|0;a[j+2|0]=a[50314]|0;a[j+3|0]=a[50315]|0;a[j+4|0]=a[50316]|0;a[j+5|0]=a[50317]|0;c[b+28>>2]=1;cb(b+96|0,44016,(j=i,i=i+8|0,c[j>>2]=g&7,j)|0)|0;i=j;i=f;return}else if((h|0)==4){h=b+32|0;j=h|0;y=1163284301;a[j]=y;y=y>>8;a[j+1|0]=y;y=y>>8;a[j+2|0]=y;y=y>>8;a[j+3|0]=y;j=h+4|0;y=4992589;a[j]=y;y=y>>8;a[j+1|0]=y;y=y>>8;a[j+2|0]=y;y=y>>8;a[j+3|0]=y;c[b+28>>2]=2;xj(b,b+96|0,d,25,32);yj(b,b+160|0,d,a[d+1|0]&63,32);i=f;return}else{j=b+32|0;h=j|0;y=1163284301;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;h=j+4|0;y=4992589;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[b+28>>2]=2;xj(b,b+96|0,d,24,32);yj(b,b+160|0,d,a[d+1|0]&63,32);i=f;return}}function Wh(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=b[e+12>>1]|0;j=e+32|0;if((h&56)==0){a[j]=a[50344]|0;a[j+1|0]=a[50345]|0;a[j+2|0]=a[50346]|0;a[j+3|0]=a[50347]|0;a[j+4|0]=a[50348]|0;a[j+5|0]=a[50349]|0;a[j+6|0]=a[50350]|0;c[e+28>>2]=1;cb(e+96|0,44016,(k=i,i=i+8|0,c[k>>2]=h&7,k)|0)|0;i=k;h=e|0;c[h>>2]=c[h>>2]|128;i=g;return}else{h=j;y=4277580;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[e+28>>2]=2;yj(e,e+96|0,f,a[f+1|0]&63,32);cb(e+160|0,40696,(k=i,i=i+8|0,c[k>>2]=(d[f]|0)>>>1&7,k)|0)|0;i=k;i=g;return}}function Xh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[50480]|0;a[e+1|0]=a[50481]|0;a[e+2|0]=a[50482]|0;a[e+3|0]=a[50483]|0;a[e+4|0]=a[50484]|0;a[e+5|0]=a[50485]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,8);return}function Yh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[50536]|0;a[e+1|0]=a[50537]|0;a[e+2|0]=a[50538]|0;a[e+3|0]=a[50539]|0;a[e+4|0]=a[50540]|0;a[e+5|0]=a[50541]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function Zh(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[50568]|0;a[e+1|0]=a[50569]|0;a[e+2|0]=a[50570]|0;a[e+3|0]=a[50571]|0;a[e+4|0]=a[50572]|0;a[e+5|0]=a[50573]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,32);return}function _h(d,e){d=d|0;e=e|0;var f=0,g=0,h=0;f=d+32|0;if((b[d+12>>1]|0)==19196){g=f;h=g|0;y=1162628169;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;h=g+4|0;y=4997447;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[d+28>>2]=0;h=d|0;c[h>>2]=c[h>>2]|4;return}else{h=f;y=5456212;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[d+28>>2]=1;yj(d,d+96|0,e,a[e+1|0]&63,8);return}}function $h(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;j=f+8|0;k=c[j>>2]|0;l=k<<1;m=(d[g+l|0]|0)<<8;n=m|(d[g+(l|1)|0]|0);c[j>>2]=k+1;k=f+14|0;b[k>>1]=n;n=f+32|0;a[n]=a[50616]|0;a[n+1|0]=a[50617]|0;a[n+2|0]=a[50618]|0;a[n+3|0]=a[50619]|0;a[n+4|0]=a[50620]|0;a[n+5|0]=a[50621]|0;a[n+6|0]=a[50622]|0;c[f+28>>2]=2;yj(f,f+96|0,g,a[g+1|0]&63,32);g=f+160|0;n=e[k>>1]|0;if((m&1024)==0){cb(g|0,44016,(o=i,i=i+8|0,c[o>>2]=n>>>12&7,o)|0)|0;i=o;p=f|0;q=c[p>>2]|0;r=q|128;c[p>>2]=r;i=h;return}else{cb(g|0,50600,(o=i,i=i+16|0,c[o>>2]=n&7,c[o+8>>2]=n>>>12&7,o)|0)|0;i=o;p=f|0;q=c[p>>2]|0;r=q|128;c[p>>2]=r;i=h;return}}function ai(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;j=f+8|0;k=c[j>>2]|0;l=k<<1;m=(d[g+l|0]|0)<<8;n=m|(d[g+(l|1)|0]|0);c[j>>2]=k+1;k=f+14|0;b[k>>1]=n;n=f+32|0;if((m&1024)==0){a[n]=a[50632]|0;a[n+1|0]=a[50633]|0;a[n+2|0]=a[50634]|0;a[n+3|0]=a[50635]|0;a[n+4|0]=a[50636]|0;a[n+5|0]=a[50637]|0;a[n+6|0]=a[50638]|0;c[f+28>>2]=2;yj(f,f+96|0,g,a[g+1|0]&63,32);m=e[k>>1]|0;cb(f+160|0,50600,(o=i,i=i+16|0,c[o>>2]=m&7,c[o+8>>2]=m>>>12&7,o)|0)|0;i=o;p=f|0;q=c[p>>2]|0;r=q|128;c[p>>2]=r;i=h;return}else{m=n;n=m|0;y=1431718212;a[n]=y;y=y>>8;a[n+1|0]=y;y=y>>8;a[n+2|0]=y;y=y>>8;a[n+3|0]=y;n=m+4|0;y=4992588;a[n]=y;y=y>>8;a[n+1|0]=y;y=y>>8;a[n+2|0]=y;y=y>>8;a[n+3|0]=y;c[f+28>>2]=2;yj(f,f+96|0,g,a[g+1|0]&63,32);g=e[k>>1]|0;cb(f+160|0,50600,(o=i,i=i+16|0,c[o>>2]=g&7,c[o+8>>2]=g>>>12&7,o)|0)|0;i=o;p=f|0;q=c[p>>2]|0;r=q|128;c[p>>2]=r;i=h;return}}function bi(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=e+32|0;if((b[e+12>>1]&56)==0){a[h]=a[36120]|0;a[h+1|0]=a[36121]|0;a[h+2|0]=a[36122]|0;c[e+28>>2]=1;j=((d[f]|0)<<8|(d[f+1|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;i=g;return}else{k=h;h=k|0;y=1163284301;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;h=k+4|0;y=5713485;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[e+28>>2]=2;xj(e,e+160|0,f,24,16);yj(e,e+96|0,f,a[f+1|0]&63,16);i=g;return}}function ci(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=e+32|0;if((b[e+12>>1]&56)==0){a[h]=a[36120]|0;a[h+1|0]=a[36121]|0;a[h+2|0]=a[36122]|0;c[e+28>>2]=1;j=((d[f]|0)<<8|(d[f+1|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;i=g;return}else{k=h;h=k|0;y=1163284301;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;h=k+4|0;y=4992589;a[h]=y;y=y>>8;a[h+1|0]=y;y=y>>8;a[h+2|0]=y;y=y>>8;a[h+3|0]=y;c[e+28>>2]=2;xj(e,e+160|0,f,24,32);yj(e,e+96|0,f,a[f+1|0]&63,32);i=g;return}}function di(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;h=b[e+12>>1]|0;j=h&65535;switch(h<<16>>16){case 20080:{h=e+32|0;a[h]=a[51416]|0;a[h+1|0]=a[51417]|0;a[h+2|0]=a[51418]|0;a[h+3|0]=a[51419]|0;a[h+4|0]=a[51420]|0;a[h+5|0]=a[51421]|0;c[e+28>>2]=0;h=e|0;c[h>>2]=c[h>>2]|1;i=g;return};case 20090:{h=e+8|0;c[h>>2]=(c[h>>2]|0)+1;h=e+32|0;a[h]=a[50984]|0;a[h+1|0]=a[50985]|0;a[h+2|0]=a[50986]|0;a[h+3|0]=a[50987]|0;a[h+4|0]=a[50988]|0;a[h+5|0]=a[50989]|0;c[e+28>>2]=2;h=e+96|0;k=f+2|0;l=((d[k]|0)<<8|(d[f+3|0]|0))&4095;if((l|0)==1){m=e|0;c[m>>2]=c[m>>2]|64;n=48432;o=16}else if((l|0)==2049){m=e|0;c[m>>2]=c[m>>2]|64;n=48040;o=16}else if((l|0)==0){m=e|0;c[m>>2]=c[m>>2]|64;n=48832;o=16}else if((l|0)==2048){m=e|0;c[m>>2]=c[m>>2]|64;n=51e3;o=16}else{cb(h|0,47744,(p=i,i=i+8|0,c[p>>2]=l,p)|0)|0;i=p;l=e|0;c[l>>2]=c[l>>2]|64;q=l}if((o|0)==16){l=n;n=h;y=d[l]|d[l+1|0]<<8|d[l+2|0]<<16|d[l+3|0]<<24|0;a[n]=y;y=y>>8;a[n+1|0]=y;y=y>>8;a[n+2|0]=y;y=y>>8;a[n+3|0]=y;q=e|0}n=d[k]|0;cb(e+160|0,37704,(p=i,i=i+16|0,c[p>>2]=(n&128|0)!=0?34768:32184,c[p+8>>2]=n>>>4&7,p)|0)|0;i=p;c[q>>2]=c[q>>2]|64;i=g;return};case 20083:{q=e+32|0;y=4543570;a[q]=y;y=y>>8;a[q+1|0]=y;y=y>>8;a[q+2|0]=y;y=y>>8;a[q+3|0]=y;c[e+28>>2]=0;q=e|0;c[q>>2]=c[q>>2]|9;i=g;return};case 20087:{q=e+32|0;y=5395538;a[q]=y;y=y>>8;a[q+1|0]=y;y=y>>8;a[q+2|0]=y;y=y>>8;a[q+3|0]=y;c[e+28>>2]=0;i=g;return};case 20081:{q=e+32|0;y=5263182;a[q]=y;y=y>>8;a[q+1|0]=y;y=y>>8;a[q+2|0]=y;y=y>>8;a[q+3|0]=y;c[e+28>>2]=0;i=g;return};case 20084:{q=e+32|0;y=4478034;a[q]=y;y=y>>8;a[q+1|0]=y;y=y>>8;a[q+2|0]=y;y=y>>8;a[q+3|0]=y;c[e+28>>2]=1;q=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;cb(e+96|0,47472,(p=i,i=i+16|0,c[p>>2]=41376,c[p+8>>2]=q,p)|0)|0;i=p;q=e+8|0;c[q>>2]=(c[q>>2]|0)+1;q=e|0;c[q>>2]=c[q>>2]|80;i=g;return};case 20085:{q=e+32|0;y=5461074;a[q]=y;y=y>>8;a[q+1|0]=y;y=y>>8;a[q+2|0]=y;y=y>>8;a[q+3|0]=y;c[e+28>>2]=0;q=e|0;c[q>>2]=c[q>>2]|16;i=g;return};case 20082:{q=e+32|0;a[q]=a[51312]|0;a[q+1|0]=a[51313]|0;a[q+2|0]=a[51314]|0;a[q+3|0]=a[51315]|0;a[q+4|0]=a[51316]|0;c[e+28>>2]=1;q=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;cb(e+96|0,47472,(p=i,i=i+16|0,c[p>>2]=41376,c[p+8>>2]=q,p)|0)|0;i=p;q=e+8|0;c[q>>2]=(c[q>>2]|0)+1;q=e|0;c[q>>2]=c[q>>2]|1;i=g;return};case 20086:{q=e+32|0;a[q]=a[51040]|0;a[q+1|0]=a[51041]|0;a[q+2|0]=a[51042]|0;a[q+3|0]=a[51043]|0;a[q+4|0]=a[51044]|0;a[q+5|0]=a[51045]|0;c[e+28>>2]=0;q=e|0;c[q>>2]=c[q>>2]|32;i=g;return};case 20091:{q=e+8|0;c[q>>2]=(c[q>>2]|0)+1;q=e+32|0;a[q]=a[50984]|0;a[q+1|0]=a[50985]|0;a[q+2|0]=a[50986]|0;a[q+3|0]=a[50987]|0;a[q+4|0]=a[50988]|0;a[q+5|0]=a[50989]|0;c[e+28>>2]=2;q=f+2|0;n=d[q]|0;cb(e+96|0,37704,(p=i,i=i+16|0,c[p>>2]=(n&128|0)!=0?34768:32184,c[p+8>>2]=n>>>4&7,p)|0)|0;i=p;n=e+160|0;k=((d[q]|0)<<8|(d[f+3|0]|0))&4095;if((k|0)==1){q=e|0;l=c[q>>2]|64;c[q>>2]=l;r=48432;s=l;o=24}else if((k|0)==2048){l=e|0;q=c[l>>2]|64;c[l>>2]=q;r=51e3;s=q;o=24}else if((k|0)==0){q=e|0;l=c[q>>2]|64;c[q>>2]=l;r=48832;s=l;o=24}else if((k|0)==2049){l=e|0;q=c[l>>2]|64;c[l>>2]=q;r=48040;s=q;o=24}else{cb(n|0,47744,(p=i,i=i+8|0,c[p>>2]=k,p)|0)|0;i=p;k=e|0;q=c[k>>2]|64;c[k>>2]=q;t=q;u=k}if((o|0)==24){o=r;r=n;y=d[o]|d[o+1|0]<<8|d[o+2|0]<<16|d[o+3|0]<<24|0;a[r]=y;y=y>>8;a[r+1|0]=y;y=y>>8;a[r+2|0]=y;y=y>>8;a[r+3|0]=y;t=s;u=e|0}c[u>>2]=t|64;i=g;return};default:{if((j&48|0)==0){t=e+32|0;a[t]=a[50960]|0;a[t+1|0]=a[50961]|0;a[t+2|0]=a[50962]|0;a[t+3|0]=a[50963]|0;a[t+4|0]=a[50964]|0;c[e+28>>2]=1;cb(e+96|0,54872,(p=i,i=i+16|0,c[p>>2]=41376,c[p+8>>2]=j&15,p)|0)|0;i=p;i=g;return}t=j&56;if((t|0)==24){u=e+32|0;a[u]=a[50864]|0;a[u+1|0]=a[50865]|0;a[u+2|0]=a[50866]|0;a[u+3|0]=a[50867]|0;a[u+4|0]=a[50868]|0;c[e+28>>2]=1;cb(e+96|0,40696,(p=i,i=i+8|0,c[p>>2]=j&7,p)|0)|0;i=p;i=g;return}else if((t|0)==32){u=e+32|0;a[u]=a[50808]|0;a[u+1|0]=a[50809]|0;a[u+2|0]=a[50810]|0;a[u+3|0]=a[50811]|0;a[u+4|0]=a[50812]|0;c[e+28>>2]=2;cb(e+96|0,40696,(p=i,i=i+8|0,c[p>>2]=j&7,p)|0)|0;i=p;u=e+160|0;y=5264213;a[u]=y;y=y>>8;a[u+1|0]=y;y=y>>8;a[u+2|0]=y;y=y>>8;a[u+3|0]=y;u=e|0;c[u>>2]=c[u>>2]|1;i=g;return}else if((t|0)==40){u=e+32|0;a[u]=a[50808]|0;a[u+1|0]=a[50809]|0;a[u+2|0]=a[50810]|0;a[u+3|0]=a[50811]|0;a[u+4|0]=a[50812]|0;c[e+28>>2]=2;u=e+96|0;y=5264213;a[u]=y;y=y>>8;a[u+1|0]=y;y=y>>8;a[u+2|0]=y;y=y>>8;a[u+3|0]=y;cb(e+160|0,40696,(p=i,i=i+8|0,c[p>>2]=j&7,p)|0)|0;i=p;u=e|0;c[u>>2]=c[u>>2]|1;i=g;return}else if((t|0)==16){t=e+32|0;a[t]=a[50920]|0;a[t+1|0]=a[50921]|0;a[t+2|0]=a[50922]|0;a[t+3|0]=a[50923]|0;a[t+4|0]=a[50924]|0;c[e+28>>2]=2;cb(e+96|0,40696,(p=i,i=i+8|0,c[p>>2]=j&7,p)|0)|0;i=p;j=((d[f+2|0]|0)<<8|(d[f+3|0]|0))&65535;cb(e+160|0,47472,(p=i,i=i+16|0,c[p>>2]=41376,c[p+8>>2]=j,p)|0)|0;i=p;j=e+8|0;c[j>>2]=(c[j>>2]|0)+1;i=g;return}else{j=e+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[e+28>>2]=1;j=((d[f]|0)<<8|(d[f+1|0]|0))&65535;cb(e+96|0,47472,(p=i,i=i+16|0,c[p>>2]=41376,c[p+8>>2]=j,p)|0)|0;i=p;i=g;return}}}}function ei(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;y=5395274;a[e]=y;y=y>>8;a[e+1|0]=y;y=y>>8;a[e+2|0]=y;y=y>>8;a[e+3|0]=y;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,0);d=b|0;c[d>>2]=c[d>>2]|4;return}function fi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b+32|0;a[f]=a[51464]|0;a[f+1|0]=a[51465]|0;a[f+2|0]=a[51466]|0;a[f+3|0]=a[51467]|0;a[f+4|0]=a[51468]|0;a[f+5|0]=a[51469]|0;a[f+6|0]=a[51470]|0;c[b+28>>2]=2;f=(a[d]&255)>>>1&7;cb(b+96|0,53560,(g=i,i=i+16|0,c[g>>2]=41376,c[g+8>>2]=f<<16>>16==0?8:f&65535,g)|0)|0;i=g;yj(b,b+160|0,d,a[d+1|0]&63,8);i=e;return}function gi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b+32|0;a[f]=a[51512]|0;a[f+1|0]=a[51513]|0;a[f+2|0]=a[51514]|0;a[f+3|0]=a[51515]|0;a[f+4|0]=a[51516]|0;a[f+5|0]=a[51517]|0;a[f+6|0]=a[51518]|0;c[b+28>>2]=2;f=(a[d]&255)>>>1&7;cb(b+96|0,53560,(g=i,i=i+16|0,c[g>>2]=41376,c[g+8>>2]=f<<16>>16==0?8:f&65535,g)|0)|0;i=g;yj(b,b+160|0,d,a[d+1|0]&63,16);i=e;return}function hi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b+32|0;a[f]=a[51536]|0;a[f+1|0]=a[51537]|0;a[f+2|0]=a[51538]|0;a[f+3|0]=a[51539]|0;a[f+4|0]=a[51540]|0;a[f+5|0]=a[51541]|0;a[f+6|0]=a[51542]|0;c[b+28>>2]=2;f=(a[d]&255)>>>1&7;cb(b+96|0,53560,(g=i,i=i+16|0,c[g>>2]=41376,c[g+8>>2]=f<<16>>16==0?8:f&65535,g)|0)|0;i=g;yj(b,b+160|0,d,a[d+1|0]&63,32);i=e;return}function ii(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;j=f+12|0;k=e[j>>1]|0;l=k>>>8&15;m=k&63;if(l>>>0>1>>>0){n=f|0;c[n>>2]=c[n>>2]|32}if((m|0)==58){Wz(f+32|0,c[7400+(l<<2)>>2]|0)|0;c[f+28>>2]=1;n=((d[g+2|0]|0)<<8|(d[g+3|0]|0))&65535;cb(f+96|0,47472,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=n,o)|0)|0;i=o;n=f+8|0;c[n>>2]=(c[n>>2]|0)+1;n=f|0;c[n>>2]=c[n>>2]|128;i=h;return}else if((m|0)==60){Wz(f+32|0,c[7400+(l<<2)>>2]|0)|0;c[f+28>>2]=0;n=f|0;c[n>>2]=c[n>>2]|128;i=h;return}else if((m|0)==59){Wz(f+32|0,c[7400+(l<<2)>>2]|0)|0;c[f+28>>2]=1;m=(((d[g+2|0]|0)<<8|(d[g+3|0]|0))<<8|(d[g+4|0]|0))<<8|(d[g+5|0]|0);cb(f+96|0,54088,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=m,o)|0)|0;i=o;m=f+8|0;c[m>>2]=(c[m>>2]|0)+2;m=f|0;c[m>>2]=c[m>>2]|128;i=h;return}else{if((k&56|0)==8){Wz(f+32|0,c[7528+(l<<2)>>2]|0)|0;c[f+28>>2]=2;cb(f+96|0,44016,(o=i,i=i+8|0,c[o>>2]=b[j>>1]&7,o)|0)|0;i=o;j=f+8|0;k=c[j>>2]|0;m=k<<1;n=(d[g+m|0]|0)<<8|(d[g+(m|1)|0]|0);c[j>>2]=k+1;k=n&65535;n=(c[f+4>>2]|0)+2+((k&32768|0)!=0?k|-65536:k)|0;cb(f+160|0,52720,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=n,o)|0)|0;i=o;o=f|0;c[o>>2]=c[o>>2]|2;i=h;return}else{Wz(f+32|0,c[7464+(l<<2)>>2]|0)|0;c[f+28>>2]=1;yj(f,f+96|0,g,a[g+1|0]&63,8);i=h;return}}}function ji(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b+32|0;a[f]=a[54912]|0;a[f+1|0]=a[54913]|0;a[f+2|0]=a[54914]|0;a[f+3|0]=a[54915]|0;a[f+4|0]=a[54916]|0;a[f+5|0]=a[54917]|0;a[f+6|0]=a[54918]|0;c[b+28>>2]=2;f=(a[d]&255)>>>1&7;cb(b+96|0,53560,(g=i,i=i+16|0,c[g>>2]=41376,c[g+8>>2]=f<<16>>16==0?8:f&65535,g)|0)|0;i=g;yj(b,b+160|0,d,a[d+1|0]&63,8);i=e;return}function ki(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b+32|0;a[f]=a[54952]|0;a[f+1|0]=a[54953]|0;a[f+2|0]=a[54954]|0;a[f+3|0]=a[54955]|0;a[f+4|0]=a[54956]|0;a[f+5|0]=a[54957]|0;a[f+6|0]=a[54958]|0;c[b+28>>2]=2;f=(a[d]&255)>>>1&7;cb(b+96|0,53560,(g=i,i=i+16|0,c[g>>2]=41376,c[g+8>>2]=f<<16>>16==0?8:f&65535,g)|0)|0;i=g;yj(b,b+160|0,d,a[d+1|0]&63,16);i=e;return}function li(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b+32|0;a[f]=a[54984]|0;a[f+1|0]=a[54985]|0;a[f+2|0]=a[54986]|0;a[f+3|0]=a[54987]|0;a[f+4|0]=a[54988]|0;a[f+5|0]=a[54989]|0;a[f+6|0]=a[54990]|0;c[b+28>>2]=2;f=(a[d]&255)>>>1&7;cb(b+96|0,53560,(g=i,i=i+16|0,c[g>>2]=41376,c[g+8>>2]=f<<16>>16==0?8:f&65535,g)|0)|0;i=g;yj(b,b+160|0,d,a[d+1|0]&63,32);i=e;return}function mi(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;h=(e[b+12>>1]|0)>>>8&15;j=f+1|0;k=a[j]|0;if(k<<24>>24==0){l=b+32|0;Wz(l|0,c[7592+(h<<2)>>2]|0)|0;c[b+28>>2]=1;m=b+8|0;n=c[m>>2]|0;o=n<<1;p=(d[f+o|0]|0)<<8|(d[f+(o|1)|0]|0);c[m>>2]=n+1;n=p&65535;p=(c[b+4>>2]|0)+2+((n&32768|0)!=0?n|-65536:n)|0;cb(b+96|0,52720,(q=i,i=i+16|0,c[q>>2]=41376,c[q+8>>2]=p,q)|0)|0;i=q;p=(Tz(l|0)|0)+(b+32)|0;a[p]=a[45216]|0;a[p+1|0]=a[45217]|0;a[p+2|0]=a[45218]|0;r=(h|0)==1;s=b|0;t=c[s>>2]|0;u=r?4:2;v=t|u;w=h>>>0>1>>>0;x=v|32;y=w?x:v;c[s>>2]=y;i=g;return}p=b+32|0;Wz(p|0,c[7592+(h<<2)>>2]|0)|0;c[b+28>>2]=1;l=b+96|0;if(k<<24>>24==-1){k=b+8|0;n=c[k>>2]|0;m=n<<1;o=(((d[f+m|0]|0)<<8|(d[f+(m|1)|0]|0))<<8|(d[f+(m+2)|0]|0))<<8|(d[f+(m+3)|0]|0);c[k>>2]=n+2;n=(c[b+4>>2]|0)+2+o|0;cb(l|0,52720,(q=i,i=i+16|0,c[q>>2]=41376,c[q+8>>2]=n,q)|0)|0;i=q;n=(Tz(p|0)|0)+(b+32)|0;a[n]=a[45520]|0;a[n+1|0]=a[45521]|0;a[n+2|0]=a[45522]|0;n=b|0;c[n>>2]=c[n>>2]|128;r=(h|0)==1;s=b|0;t=c[s>>2]|0;u=r?4:2;v=t|u;w=h>>>0>1>>>0;x=v|32;y=w?x:v;c[s>>2]=y;i=g;return}else{n=d[j]|0;j=(c[b+4>>2]|0)+2+((n&128|0)!=0?n|-256:n)|0;cb(l|0,52720,(q=i,i=i+16|0,c[q>>2]=41376,c[q+8>>2]=j,q)|0)|0;i=q;q=(Tz(p|0)|0)+(b+32)|0;a[q]=a[56288]|0;a[q+1|0]=a[56289]|0;a[q+2|0]=a[56290]|0;r=(h|0)==1;s=b|0;t=c[s>>2]|0;u=r?4:2;v=t|u;w=h>>>0>1>>>0;x=v|32;y=w?x:v;c[s>>2]=y;i=g;return}}function ni(b,f){b=b|0;f=f|0;var g=0,h=0,j=0;g=i;h=b+32|0;a[h]=a[56456]|0;a[h+1|0]=a[56457]|0;a[h+2|0]=a[56458]|0;a[h+3|0]=a[56459]|0;a[h+4|0]=a[56460]|0;a[h+5|0]=a[56461]|0;c[b+28>>2]=2;h=e[b+12>>1]|0;cb(b+96|0,54088,(j=i,i=i+16|0,c[j>>2]=41376,c[j+8>>2]=(h&128|0)!=0?h|-256:h&255,j)|0)|0;i=j;cb(b+160|0,44016,(j=i,i=i+8|0,c[j>>2]=(d[f]|0)>>>1&7,j)|0)|0;i=j;i=g;return}function oi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[56696]|0;a[g+1|0]=a[56697]|0;a[g+2|0]=a[56698]|0;a[g+3|0]=a[56699]|0;a[g+4|0]=a[56700]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function pi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[56952]|0;a[g+1|0]=a[56953]|0;a[g+2|0]=a[56954]|0;a[g+3|0]=a[56955]|0;a[g+4|0]=a[56956]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function qi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57168]|0;a[g+1|0]=a[57169]|0;a[g+2|0]=a[57170]|0;a[g+3|0]=a[57171]|0;a[g+4|0]=a[57172]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function ri(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[56624]|0;a[g+1|0]=a[56625]|0;a[g+2|0]=a[56626]|0;a[g+3|0]=a[56627]|0;a[g+4|0]=a[56628]|0;a[g+5|0]=a[56629]|0;a[g+6|0]=a[56630]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function si(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==1){l=b+32|0;a[l]=a[56872]|0;a[l+1|0]=a[56873]|0;a[l+2|0]=a[56874]|0;a[l+3|0]=a[56875]|0;a[l+4|0]=a[56876]|0;a[l+5|0]=a[56877]|0;a[l+6|0]=a[56878]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else if((k|0)==0){k=b+32|0;a[k]=a[56872]|0;a[k+1|0]=a[56873]|0;a[k+2|0]=a[56874]|0;a[k+3|0]=a[56875]|0;a[k+4|0]=a[56876]|0;a[k+5|0]=a[56877]|0;a[k+6|0]=a[56878]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;j=b|0;c[j>>2]=c[j>>2]|32;i=g;return}else{j=b+32|0;a[j]=a[56696]|0;a[j+1|0]=a[56697]|0;a[j+2|0]=a[56698]|0;a[j+3|0]=a[56699]|0;a[j+4|0]=a[56700]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,8);i=g;return}}function ti(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=e+32|0;if((b[e+12>>1]&48)>>>0<16>>>0){a[h]=a[36120]|0;a[h+1|0]=a[36121]|0;a[h+2|0]=a[36122]|0;c[e+28>>2]=1;j=((d[f]|0)<<8|(d[f+1|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;i=g;return}else{a[h]=a[56952]|0;a[h+1|0]=a[56953]|0;a[h+2|0]=a[56954]|0;a[h+3|0]=a[56955]|0;a[h+4|0]=a[56956]|0;c[e+28>>2]=2;cb(e+96|0,44016,(k=i,i=i+8|0,c[k>>2]=(d[f]|0)>>>1&7,k)|0)|0;i=k;yj(e,e+160|0,f,a[f+1|0]&63,16);i=g;return}}function ui(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=e+32|0;if((b[e+12>>1]&48)>>>0<16>>>0){a[h]=a[36120]|0;a[h+1|0]=a[36121]|0;a[h+2|0]=a[36122]|0;c[e+28>>2]=1;j=((d[f]|0)<<8|(d[f+1|0]|0))&65535;cb(e+96|0,47472,(k=i,i=i+16|0,c[k>>2]=41376,c[k+8>>2]=j,k)|0)|0;i=k;i=g;return}else{a[h]=a[57168]|0;a[h+1|0]=a[57169]|0;a[h+2|0]=a[57170]|0;a[h+3|0]=a[57171]|0;a[h+4|0]=a[57172]|0;c[e+28>>2]=2;cb(e+96|0,44016,(k=i,i=i+8|0,c[k>>2]=(d[f]|0)>>>1&7,k)|0)|0;i=k;yj(e,e+160|0,f,a[f+1|0]&63,32);i=g;return}}function vi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57312]|0;a[g+1|0]=a[57313]|0;a[g+2|0]=a[57314]|0;a[g+3|0]=a[57315]|0;a[g+4|0]=a[57316]|0;a[g+5|0]=a[57317]|0;a[g+6|0]=a[57318]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function wi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57424]|0;a[g+1|0]=a[57425]|0;a[g+2|0]=a[57426]|0;a[g+3|0]=a[57427]|0;a[g+4|0]=a[57428]|0;a[g+5|0]=a[57429]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function xi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57528]|0;a[g+1|0]=a[57529]|0;a[g+2|0]=a[57530]|0;a[g+3|0]=a[57531]|0;a[g+4|0]=a[57532]|0;a[g+5|0]=a[57533]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function yi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57616]|0;a[g+1|0]=a[57617]|0;a[g+2|0]=a[57618]|0;a[g+3|0]=a[57619]|0;a[g+4|0]=a[57620]|0;a[g+5|0]=a[57621]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function zi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57376]|0;a[g+1|0]=a[57377]|0;a[g+2|0]=a[57378]|0;a[g+3|0]=a[57379]|0;a[g+4|0]=a[57380]|0;a[g+5|0]=a[57381]|0;a[g+6|0]=a[57382]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ai(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==0){l=b+32|0;a[l]=a[57464]|0;a[l+1|0]=a[57465]|0;a[l+2|0]=a[57466]|0;a[l+3|0]=a[57467]|0;a[l+4|0]=a[57468]|0;a[l+5|0]=a[57469]|0;a[l+6|0]=a[57470]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;l=b|0;c[l>>2]=c[l>>2]|32;i=g;return}else if((k|0)==1){k=b+32|0;a[k]=a[57464]|0;a[k+1|0]=a[57465]|0;a[k+2|0]=a[57466]|0;a[k+3|0]=a[57467]|0;a[k+4|0]=a[57468]|0;a[k+5|0]=a[57469]|0;a[k+6|0]=a[57470]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else{h=b+32|0;a[h]=a[57424]|0;a[h+1|0]=a[57425]|0;a[h+2|0]=a[57426]|0;a[h+3|0]=a[57427]|0;a[h+4|0]=a[57428]|0;a[h+5|0]=a[57429]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,8);i=g;return}}function Bi(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==0){l=b+32|0;a[l]=a[57576]|0;a[l+1|0]=a[57577]|0;a[l+2|0]=a[57578]|0;a[l+3|0]=a[57579]|0;a[l+4|0]=a[57580]|0;a[l+5|0]=a[57581]|0;a[l+6|0]=a[57582]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;l=b|0;c[l>>2]=c[l>>2]|32;i=g;return}else if((k|0)==1){k=b+32|0;a[k]=a[57576]|0;a[k+1|0]=a[57577]|0;a[k+2|0]=a[57578]|0;a[k+3|0]=a[57579]|0;a[k+4|0]=a[57580]|0;a[k+5|0]=a[57581]|0;a[k+6|0]=a[57582]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else{h=b+32|0;a[h]=a[57528]|0;a[h+1|0]=a[57529]|0;a[h+2|0]=a[57530]|0;a[h+3|0]=a[57531]|0;a[h+4|0]=a[57532]|0;a[h+5|0]=a[57533]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,16);i=g;return}}function Ci(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==1){l=b+32|0;a[l]=a[57712]|0;a[l+1|0]=a[57713]|0;a[l+2|0]=a[57714]|0;a[l+3|0]=a[57715]|0;a[l+4|0]=a[57716]|0;a[l+5|0]=a[57717]|0;a[l+6|0]=a[57718]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else if((k|0)==0){k=b+32|0;a[k]=a[57712]|0;a[k+1|0]=a[57713]|0;a[k+2|0]=a[57714]|0;a[k+3|0]=a[57715]|0;a[k+4|0]=a[57716]|0;a[k+5|0]=a[57717]|0;a[k+6|0]=a[57718]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;j=b|0;c[j>>2]=c[j>>2]|32;i=g;return}else{j=b+32|0;a[j]=a[57616]|0;a[j+1|0]=a[57617]|0;a[j+2|0]=a[57618]|0;a[j+3|0]=a[57619]|0;a[j+4|0]=a[57620]|0;a[j+5|0]=a[57621]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,32);i=g;return}}function Di(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57784]|0;a[g+1|0]=a[57785]|0;a[g+2|0]=a[57786]|0;a[g+3|0]=a[57787]|0;a[g+4|0]=a[57788]|0;a[g+5|0]=a[57789]|0;a[g+6|0]=a[57790]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ei(a,b){a=a|0;b=b|0;var d=0,f=0;b=i;i=i+16|0;d=b|0;cb(d|0,32672,(f=i,i=i+8|0,c[f>>2]=e[a+12>>1]|0,f)|0)|0;i=f;Wz(a+32|0,d|0)|0;c[a+28>>2]=0;d=a|0;c[d>>2]=c[d>>2]|4;i=b;return}function Fi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[57968]|0;a[g+1|0]=a[57969]|0;a[g+2|0]=a[57970]|0;a[g+3|0]=a[57971]|0;a[g+4|0]=a[57972]|0;a[g+5|0]=a[57973]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Gi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[58096]|0;a[g+1|0]=a[58097]|0;a[g+2|0]=a[58098]|0;a[g+3|0]=a[58099]|0;a[g+4|0]=a[58100]|0;a[g+5|0]=a[58101]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Hi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[30096]|0;a[g+1|0]=a[30097]|0;a[g+2|0]=a[30098]|0;a[g+3|0]=a[30099]|0;a[g+4|0]=a[30100]|0;a[g+5|0]=a[30101]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ii(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[30176]|0;a[g+1|0]=a[30177]|0;a[g+2|0]=a[30178]|0;a[g+3|0]=a[30179]|0;a[g+4|0]=a[30180]|0;a[g+5|0]=a[30181]|0;a[g+6|0]=a[30182]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ji(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;j=f+12|0;k=b[j>>1]|0;l=f+32|0;if((k&56)==8){a[l]=a[30312]|0;a[l+1|0]=a[30313]|0;a[l+2|0]=a[30314]|0;a[l+3|0]=a[30315]|0;a[l+4|0]=a[30316]|0;a[l+5|0]=a[30317]|0;a[l+6|0]=a[30318]|0;c[f+28>>2]=2;cb(f+96|0,31160,(m=i,i=i+8|0,c[m>>2]=k&7,m)|0)|0;i=m;cb(f+160|0,31160,(m=i,i=i+8|0,c[m>>2]=(e[j>>1]|0)>>>9&7,m)|0)|0;i=m;i=h;return}else{a[l]=a[30240]|0;a[l+1|0]=a[30241]|0;a[l+2|0]=a[30242]|0;a[l+3|0]=a[30243]|0;a[l+4|0]=a[30244]|0;a[l+5|0]=a[30245]|0;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;yj(f,f+160|0,g,a[g+1|0]&63,8);i=h;return}}function Ki(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;j=f+12|0;k=b[j>>1]|0;l=f+32|0;if((k&56)==8){a[l]=a[30400]|0;a[l+1|0]=a[30401]|0;a[l+2|0]=a[30402]|0;a[l+3|0]=a[30403]|0;a[l+4|0]=a[30404]|0;a[l+5|0]=a[30405]|0;a[l+6|0]=a[30406]|0;c[f+28>>2]=2;cb(f+96|0,31160,(m=i,i=i+8|0,c[m>>2]=k&7,m)|0)|0;i=m;cb(f+160|0,31160,(m=i,i=i+8|0,c[m>>2]=(e[j>>1]|0)>>>9&7,m)|0)|0;i=m;i=h;return}else{a[l]=a[30360]|0;a[l+1|0]=a[30361]|0;a[l+2|0]=a[30362]|0;a[l+3|0]=a[30363]|0;a[l+4|0]=a[30364]|0;a[l+5|0]=a[30365]|0;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;yj(f,f+160|0,g,a[g+1|0]&63,16);i=h;return}}function Li(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;j=f+12|0;k=b[j>>1]|0;l=f+32|0;if((k&56)==8){a[l]=a[30576]|0;a[l+1|0]=a[30577]|0;a[l+2|0]=a[30578]|0;a[l+3|0]=a[30579]|0;a[l+4|0]=a[30580]|0;a[l+5|0]=a[30581]|0;a[l+6|0]=a[30582]|0;c[f+28>>2]=2;cb(f+96|0,31160,(m=i,i=i+8|0,c[m>>2]=k&7,m)|0)|0;i=m;cb(f+160|0,31160,(m=i,i=i+8|0,c[m>>2]=(e[j>>1]|0)>>>9&7,m)|0)|0;i=m;i=h;return}else{a[l]=a[30488]|0;a[l+1|0]=a[30489]|0;a[l+2|0]=a[30490]|0;a[l+3|0]=a[30491]|0;a[l+4|0]=a[30492]|0;a[l+5|0]=a[30493]|0;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;yj(f,f+160|0,g,a[g+1|0]&63,32);i=h;return}}function Mi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[30776]|0;a[g+1|0]=a[30777]|0;a[g+2|0]=a[30778]|0;a[g+3|0]=a[30779]|0;a[g+4|0]=a[30780]|0;a[g+5|0]=a[30781]|0;a[g+6|0]=a[30782]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ni(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31056]|0;a[g+1|0]=a[31057]|0;a[g+2|0]=a[31058]|0;a[g+3|0]=a[31059]|0;a[g+4|0]=a[31060]|0;a[g+5|0]=a[31061]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Oi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31144]|0;a[g+1|0]=a[31145]|0;a[g+2|0]=a[31146]|0;a[g+3|0]=a[31147]|0;a[g+4|0]=a[31148]|0;a[g+5|0]=a[31149]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Pi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31192]|0;a[g+1|0]=a[31193]|0;a[g+2|0]=a[31194]|0;a[g+3|0]=a[31195]|0;a[g+4|0]=a[31196]|0;a[g+5|0]=a[31197]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Qi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[30960]|0;a[g+1|0]=a[30961]|0;a[g+2|0]=a[30962]|0;a[g+3|0]=a[30963]|0;a[g+4|0]=a[30964]|0;a[g+5|0]=a[30965]|0;a[g+6|0]=a[30966]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Ri(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==0){l=b+32|0;a[l]=a[31104]|0;a[l+1|0]=a[31105]|0;a[l+2|0]=a[31106]|0;a[l+3|0]=a[31107]|0;a[l+4|0]=a[31108]|0;a[l+5|0]=a[31109]|0;a[l+6|0]=a[31110]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;l=b|0;c[l>>2]=c[l>>2]|32;i=g;return}else if((k|0)==1){k=b+32|0;a[k]=a[31104]|0;a[k+1|0]=a[31105]|0;a[k+2|0]=a[31106]|0;a[k+3|0]=a[31107]|0;a[k+4|0]=a[31108]|0;a[k+5|0]=a[31109]|0;a[k+6|0]=a[31110]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else{h=b+32|0;a[h]=a[31056]|0;a[h+1|0]=a[31057]|0;a[h+2|0]=a[31058]|0;a[h+3|0]=a[31059]|0;a[h+4|0]=a[31060]|0;a[h+5|0]=a[31061]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,8);i=g;return}}function Si(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;j=f+12|0;k=(e[j>>1]|0)>>>3&7;if((k|0)==1){l=f+32|0;y=4675653;a[l]=y;y=y>>8;a[l+1|0]=y;y=y>>8;a[l+2|0]=y;y=y>>8;a[l+3|0]=y;c[f+28>>2]=2;cb(f+96|0,40696,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;cb(f+160|0,40696,(m=i,i=i+8|0,c[m>>2]=b[j>>1]&7,m)|0)|0;i=m;i=h;return}else if((k|0)==0){k=f+32|0;y=4675653;a[k]=y;y=y>>8;a[k+1|0]=y;y=y>>8;a[k+2|0]=y;y=y>>8;a[k+3|0]=y;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;cb(f+160|0,44016,(m=i,i=i+8|0,c[m>>2]=b[j>>1]&7,m)|0)|0;i=m;i=h;return}else{j=f+32|0;a[j]=a[31144]|0;a[j+1|0]=a[31145]|0;a[j+2|0]=a[31146]|0;a[j+3|0]=a[31147]|0;a[j+4|0]=a[31148]|0;a[j+5|0]=a[31149]|0;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;yj(f,f+160|0,g,a[g+1|0]&63,16);i=h;return}}function Ti(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;j=f+12|0;k=(e[j>>1]|0)>>>3&7;if((k|0)==0){l=f+32|0;a[l]=a[36120]|0;a[l+1|0]=a[36121]|0;a[l+2|0]=a[36122]|0;c[f+28>>2]=1;l=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(m=i,i=i+16|0,c[m>>2]=41376,c[m+8>>2]=l,m)|0)|0;i=m;i=h;return}else if((k|0)==1){k=f+32|0;y=4675653;a[k]=y;y=y>>8;a[k+1|0]=y;y=y>>8;a[k+2|0]=y;y=y>>8;a[k+3|0]=y;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;cb(f+160|0,40696,(m=i,i=i+8|0,c[m>>2]=b[j>>1]&7,m)|0)|0;i=m;i=h;return}else{j=f+32|0;a[j]=a[31192]|0;a[j+1|0]=a[31193]|0;a[j+2|0]=a[31194]|0;a[j+3|0]=a[31195]|0;a[j+4|0]=a[31196]|0;a[j+5|0]=a[31197]|0;c[f+28>>2]=2;cb(f+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[g]|0)>>>1&7,m)|0)|0;i=m;yj(f,f+160|0,g,a[g+1|0]&63,32);i=h;return}}function Ui(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31320]|0;a[g+1|0]=a[31321]|0;a[g+2|0]=a[31322]|0;a[g+3|0]=a[31323]|0;a[g+4|0]=a[31324]|0;a[g+5|0]=a[31325]|0;a[g+6|0]=a[31326]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Vi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31544]|0;a[g+1|0]=a[31545]|0;a[g+2|0]=a[31546]|0;a[g+3|0]=a[31547]|0;a[g+4|0]=a[31548]|0;a[g+5|0]=a[31549]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,8);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Wi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31880]|0;a[g+1|0]=a[31881]|0;a[g+2|0]=a[31882]|0;a[g+3|0]=a[31883]|0;a[g+4|0]=a[31884]|0;a[g+5|0]=a[31885]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Xi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[32048]|0;a[g+1|0]=a[32049]|0;a[g+2|0]=a[32050]|0;a[g+3|0]=a[32051]|0;a[g+4|0]=a[32052]|0;a[g+5|0]=a[32053]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,44016,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Yi(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[31448]|0;a[g+1|0]=a[31449]|0;a[g+2|0]=a[31450]|0;a[g+3|0]=a[31451]|0;a[g+4|0]=a[31452]|0;a[g+5|0]=a[31453]|0;a[g+6|0]=a[31454]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,16);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function Zi(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==1){l=b+32|0;a[l]=a[31720]|0;a[l+1|0]=a[31721]|0;a[l+2|0]=a[31722]|0;a[l+3|0]=a[31723]|0;a[l+4|0]=a[31724]|0;a[l+5|0]=a[31725]|0;a[l+6|0]=a[31726]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else if((k|0)==0){k=b+32|0;a[k]=a[31720]|0;a[k+1|0]=a[31721]|0;a[k+2|0]=a[31722]|0;a[k+3|0]=a[31723]|0;a[k+4|0]=a[31724]|0;a[k+5|0]=a[31725]|0;a[k+6|0]=a[31726]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;j=b|0;c[j>>2]=c[j>>2]|32;i=g;return}else{j=b+32|0;a[j]=a[31544]|0;a[j+1|0]=a[31545]|0;a[j+2|0]=a[31546]|0;a[j+3|0]=a[31547]|0;a[j+4|0]=a[31548]|0;a[j+5|0]=a[31549]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,8);i=g;return}}function _i(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==0){l=b+32|0;a[l]=a[31952]|0;a[l+1|0]=a[31953]|0;a[l+2|0]=a[31954]|0;a[l+3|0]=a[31955]|0;a[l+4|0]=a[31956]|0;a[l+5|0]=a[31957]|0;a[l+6|0]=a[31958]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;l=b|0;c[l>>2]=c[l>>2]|32;i=g;return}else if((k|0)==1){k=b+32|0;a[k]=a[31952]|0;a[k+1|0]=a[31953]|0;a[k+2|0]=a[31954]|0;a[k+3|0]=a[31955]|0;a[k+4|0]=a[31956]|0;a[k+5|0]=a[31957]|0;a[k+6|0]=a[31958]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else{h=b+32|0;a[h]=a[31880]|0;a[h+1|0]=a[31881]|0;a[h+2|0]=a[31882]|0;a[h+3|0]=a[31883]|0;a[h+4|0]=a[31884]|0;a[h+5|0]=a[31885]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,16);i=g;return}}function $i(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=b+12|0;j=e[h>>1]|0;k=j>>>3&7;if((k|0)==1){l=b+32|0;a[l]=a[32160]|0;a[l+1|0]=a[32161]|0;a[l+2|0]=a[32162]|0;a[l+3|0]=a[32163]|0;a[l+4|0]=a[32164]|0;a[l+5|0]=a[32165]|0;a[l+6|0]=a[32166]|0;c[b+28>>2]=2;cb(b+96|0,30264,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,30264,(m=i,i=i+8|0,c[m>>2]=(e[h>>1]|0)>>>9&7,m)|0)|0;i=m;h=b|0;c[h>>2]=c[h>>2]|32;i=g;return}else if((k|0)==0){k=b+32|0;a[k]=a[32160]|0;a[k+1|0]=a[32161]|0;a[k+2|0]=a[32162]|0;a[k+3|0]=a[32163]|0;a[k+4|0]=a[32164]|0;a[k+5|0]=a[32165]|0;a[k+6|0]=a[32166]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=j&7,m)|0)|0;i=m;cb(b+160|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;j=b|0;c[j>>2]=c[j>>2]|32;i=g;return}else{j=b+32|0;a[j]=a[32048]|0;a[j+1|0]=a[32049]|0;a[j+2|0]=a[32050]|0;a[j+3|0]=a[32051]|0;a[j+4|0]=a[32052]|0;a[j+5|0]=a[32053]|0;c[b+28>>2]=2;cb(b+96|0,44016,(m=i,i=i+8|0,c[m>>2]=(d[f]|0)>>>1&7,m)|0)|0;i=m;yj(b,b+160|0,f,a[f+1|0]&63,32);i=g;return}}function aj(b,e){b=b|0;e=e|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[32288]|0;a[g+1|0]=a[32289]|0;a[g+2|0]=a[32290]|0;a[g+3|0]=a[32291]|0;a[g+4|0]=a[32292]|0;a[g+5|0]=a[32293]|0;a[g+6|0]=a[32294]|0;c[b+28>>2]=2;yj(b,b+96|0,e,a[e+1|0]&63,32);cb(b+160|0,40696,(b=i,i=i+8|0,c[b>>2]=(d[e]|0)>>>1&7,b)|0)|0;i=b;i=f;return}function bj(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=f+12|0;switch((e[j>>1]|0)>>>3&7|0){case 0:{k=f+32|0;a[k]=a[33120]|0;a[k+1|0]=a[33121]|0;a[k+2|0]=a[33122]|0;a[k+3|0]=a[33123]|0;a[k+4|0]=a[33124]|0;a[k+5|0]=a[33125]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 4:{k=f+32|0;a[k]=a[33120]|0;a[k+1|0]=a[33121]|0;a[k+2|0]=a[33122]|0;a[k+3|0]=a[33123]|0;a[k+4|0]=a[33124]|0;a[k+5|0]=a[33125]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 1:{k=f+32|0;a[k]=a[32792]|0;a[k+1|0]=a[32793]|0;a[k+2|0]=a[32794]|0;a[k+3|0]=a[32795]|0;a[k+4|0]=a[32796]|0;a[k+5|0]=a[32797]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 2:{k=f+32|0;a[k]=a[32592]|0;a[k+1|0]=a[32593]|0;a[k+2|0]=a[32594]|0;a[k+3|0]=a[32595]|0;a[k+4|0]=a[32596]|0;a[k+5|0]=a[32597]|0;a[k+6|0]=a[32598]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 5:{k=f+32|0;a[k]=a[32792]|0;a[k+1|0]=a[32793]|0;a[k+2|0]=a[32794]|0;a[k+3|0]=a[32795]|0;a[k+4|0]=a[32796]|0;a[k+5|0]=a[32797]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 6:{k=f+32|0;a[k]=a[32592]|0;a[k+1|0]=a[32593]|0;a[k+2|0]=a[32594]|0;a[k+3|0]=a[32595]|0;a[k+4|0]=a[32596]|0;a[k+5|0]=a[32597]|0;a[k+6|0]=a[32598]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 3:{k=f+32|0;a[k]=a[32472]|0;a[k+1|0]=a[32473]|0;a[k+2|0]=a[32474]|0;a[k+3|0]=a[32475]|0;a[k+4|0]=a[32476]|0;a[k+5|0]=a[32477]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 7:{k=f+32|0;a[k]=a[32472]|0;a[k+1|0]=a[32473]|0;a[k+2|0]=a[32474]|0;a[k+3|0]=a[32475]|0;a[k+4|0]=a[32476]|0;a[k+5|0]=a[32477]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};default:{j=f+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[f+28>>2]=1;j=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=j,l)|0)|0;i=l;i=h;return}}}function cj(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=f+12|0;switch((e[j>>1]|0)>>>3&7|0){case 2:{k=f+32|0;a[k]=a[38424]|0;a[k+1|0]=a[38425]|0;a[k+2|0]=a[38426]|0;a[k+3|0]=a[38427]|0;a[k+4|0]=a[38428]|0;a[k+5|0]=a[38429]|0;a[k+6|0]=a[38430]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 4:{k=f+32|0;a[k]=a[34688]|0;a[k+1|0]=a[34689]|0;a[k+2|0]=a[34690]|0;a[k+3|0]=a[34691]|0;a[k+4|0]=a[34692]|0;a[k+5|0]=a[34693]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 5:{k=f+32|0;a[k]=a[37880]|0;a[k+1|0]=a[37881]|0;a[k+2|0]=a[37882]|0;a[k+3|0]=a[37883]|0;a[k+4|0]=a[37884]|0;a[k+5|0]=a[37885]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 6:{k=f+32|0;a[k]=a[38424]|0;a[k+1|0]=a[38425]|0;a[k+2|0]=a[38426]|0;a[k+3|0]=a[38427]|0;a[k+4|0]=a[38428]|0;a[k+5|0]=a[38429]|0;a[k+6|0]=a[38430]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 7:{k=f+32|0;a[k]=a[39040]|0;a[k+1|0]=a[39041]|0;a[k+2|0]=a[39042]|0;a[k+3|0]=a[39043]|0;a[k+4|0]=a[39044]|0;a[k+5|0]=a[39045]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 1:{k=f+32|0;a[k]=a[37880]|0;a[k+1|0]=a[37881]|0;a[k+2|0]=a[37882]|0;a[k+3|0]=a[37883]|0;a[k+4|0]=a[37884]|0;a[k+5|0]=a[37885]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 0:{k=f+32|0;a[k]=a[34688]|0;a[k+1|0]=a[34689]|0;a[k+2|0]=a[34690]|0;a[k+3|0]=a[34691]|0;a[k+4|0]=a[34692]|0;a[k+5|0]=a[34693]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 3:{k=f+32|0;a[k]=a[39040]|0;a[k+1|0]=a[39041]|0;a[k+2|0]=a[39042]|0;a[k+3|0]=a[39043]|0;a[k+4|0]=a[39044]|0;a[k+5|0]=a[39045]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};default:{j=f+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[f+28>>2]=1;j=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=j,l)|0)|0;i=l;i=h;return}}}function dj(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=f+12|0;switch((e[j>>1]|0)>>>3&7|0){case 0:{k=f+32|0;a[k]=a[34448]|0;a[k+1|0]=a[34449]|0;a[k+2|0]=a[34450]|0;a[k+3|0]=a[34451]|0;a[k+4|0]=a[34452]|0;a[k+5|0]=a[34453]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 4:{k=f+32|0;a[k]=a[34448]|0;a[k+1|0]=a[34449]|0;a[k+2|0]=a[34450]|0;a[k+3|0]=a[34451]|0;a[k+4|0]=a[34452]|0;a[k+5|0]=a[34453]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 5:{k=f+32|0;a[k]=a[34104]|0;a[k+1|0]=a[34105]|0;a[k+2|0]=a[34106]|0;a[k+3|0]=a[34107]|0;a[k+4|0]=a[34108]|0;a[k+5|0]=a[34109]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 6:{k=f+32|0;a[k]=a[33856]|0;a[k+1|0]=a[33857]|0;a[k+2|0]=a[33858]|0;a[k+3|0]=a[33859]|0;a[k+4|0]=a[33860]|0;a[k+5|0]=a[33861]|0;a[k+6|0]=a[33862]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 7:{k=f+32|0;a[k]=a[33536]|0;a[k+1|0]=a[33537]|0;a[k+2|0]=a[33538]|0;a[k+3|0]=a[33539]|0;a[k+4|0]=a[33540]|0;a[k+5|0]=a[33541]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 1:{k=f+32|0;a[k]=a[34104]|0;a[k+1|0]=a[34105]|0;a[k+2|0]=a[34106]|0;a[k+3|0]=a[34107]|0;a[k+4|0]=a[34108]|0;a[k+5|0]=a[34109]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 2:{k=f+32|0;a[k]=a[33856]|0;a[k+1|0]=a[33857]|0;a[k+2|0]=a[33858]|0;a[k+3|0]=a[33859]|0;a[k+4|0]=a[33860]|0;a[k+5|0]=a[33861]|0;a[k+6|0]=a[33862]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 3:{k=f+32|0;a[k]=a[33536]|0;a[k+1|0]=a[33537]|0;a[k+2|0]=a[33538]|0;a[k+3|0]=a[33539]|0;a[k+4|0]=a[33540]|0;a[k+5|0]=a[33541]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};default:{j=f+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[f+28>>2]=1;j=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=j,l)|0)|0;i=l;i=h;return}}}function ej(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[34688]|0;a[e+1|0]=a[34689]|0;a[e+2|0]=a[34690]|0;a[e+3|0]=a[34691]|0;a[e+4|0]=a[34692]|0;a[e+5|0]=a[34693]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function fj(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=f+12|0;switch((e[j>>1]|0)>>>3&7|0){case 2:{k=f+32|0;a[k]=a[35232]|0;a[k+1|0]=a[35233]|0;a[k+2|0]=a[35234]|0;a[k+3|0]=a[35235]|0;a[k+4|0]=a[35236]|0;a[k+5|0]=a[35237]|0;a[k+6|0]=a[35238]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 4:{k=f+32|0;a[k]=a[35824]|0;a[k+1|0]=a[35825]|0;a[k+2|0]=a[35826]|0;a[k+3|0]=a[35827]|0;a[k+4|0]=a[35828]|0;a[k+5|0]=a[35829]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 1:{k=f+32|0;a[k]=a[35496]|0;a[k+1|0]=a[35497]|0;a[k+2|0]=a[35498]|0;a[k+3|0]=a[35499]|0;a[k+4|0]=a[35500]|0;a[k+5|0]=a[35501]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 0:{k=f+32|0;a[k]=a[35824]|0;a[k+1|0]=a[35825]|0;a[k+2|0]=a[35826]|0;a[k+3|0]=a[35827]|0;a[k+4|0]=a[35828]|0;a[k+5|0]=a[35829]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 3:{k=f+32|0;a[k]=a[34928]|0;a[k+1|0]=a[34929]|0;a[k+2|0]=a[34930]|0;a[k+3|0]=a[34931]|0;a[k+4|0]=a[34932]|0;a[k+5|0]=a[34933]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 5:{k=f+32|0;a[k]=a[35496]|0;a[k+1|0]=a[35497]|0;a[k+2|0]=a[35498]|0;a[k+3|0]=a[35499]|0;a[k+4|0]=a[35500]|0;a[k+5|0]=a[35501]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 6:{k=f+32|0;a[k]=a[35232]|0;a[k+1|0]=a[35233]|0;a[k+2|0]=a[35234]|0;a[k+3|0]=a[35235]|0;a[k+4|0]=a[35236]|0;a[k+5|0]=a[35237]|0;a[k+6|0]=a[35238]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 7:{k=f+32|0;a[k]=a[34928]|0;a[k+1|0]=a[34929]|0;a[k+2|0]=a[34930]|0;a[k+3|0]=a[34931]|0;a[k+4|0]=a[34932]|0;a[k+5|0]=a[34933]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};default:{j=f+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[f+28>>2]=1;j=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=j,l)|0)|0;i=l;i=h;return}}}function gj(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=f+12|0;switch((e[j>>1]|0)>>>3&7|0){case 0:{k=f+32|0;a[k]=a[37632]|0;a[k+1|0]=a[37633]|0;a[k+2|0]=a[37634]|0;a[k+3|0]=a[37635]|0;a[k+4|0]=a[37636]|0;a[k+5|0]=a[37637]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 4:{k=f+32|0;a[k]=a[37632]|0;a[k+1|0]=a[37633]|0;a[k+2|0]=a[37634]|0;a[k+3|0]=a[37635]|0;a[k+4|0]=a[37636]|0;a[k+5|0]=a[37637]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 1:{k=f+32|0;a[k]=a[38136]|0;a[k+1|0]=a[38137]|0;a[k+2|0]=a[38138]|0;a[k+3|0]=a[38139]|0;a[k+4|0]=a[38140]|0;a[k+5|0]=a[38141]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 2:{k=f+32|0;a[k]=a[38728]|0;a[k+1|0]=a[38729]|0;a[k+2|0]=a[38730]|0;a[k+3|0]=a[38731]|0;a[k+4|0]=a[38732]|0;a[k+5|0]=a[38733]|0;a[k+6|0]=a[38734]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 3:{k=f+32|0;a[k]=a[39480]|0;a[k+1|0]=a[39481]|0;a[k+2|0]=a[39482]|0;a[k+3|0]=a[39483]|0;a[k+4|0]=a[39484]|0;a[k+5|0]=a[39485]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 6:{k=f+32|0;a[k]=a[38728]|0;a[k+1|0]=a[38729]|0;a[k+2|0]=a[38730]|0;a[k+3|0]=a[38731]|0;a[k+4|0]=a[38732]|0;a[k+5|0]=a[38733]|0;a[k+6|0]=a[38734]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 5:{k=f+32|0;a[k]=a[38136]|0;a[k+1|0]=a[38137]|0;a[k+2|0]=a[38138]|0;a[k+3|0]=a[38139]|0;a[k+4|0]=a[38140]|0;a[k+5|0]=a[38141]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 7:{k=f+32|0;a[k]=a[39480]|0;a[k+1|0]=a[39481]|0;a[k+2|0]=a[39482]|0;a[k+3|0]=a[39483]|0;a[k+4|0]=a[39484]|0;a[k+5|0]=a[39485]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};default:{j=f+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[f+28>>2]=1;j=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=j,l)|0)|0;i=l;i=h;return}}}function hj(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=f+12|0;switch((e[j>>1]|0)>>>3&7|0){case 2:{k=f+32|0;a[k]=a[36912]|0;a[k+1|0]=a[36913]|0;a[k+2|0]=a[36914]|0;a[k+3|0]=a[36915]|0;a[k+4|0]=a[36916]|0;a[k+5|0]=a[36917]|0;a[k+6|0]=a[36918]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 4:{k=f+32|0;a[k]=a[37344]|0;a[k+1|0]=a[37345]|0;a[k+2|0]=a[37346]|0;a[k+3|0]=a[37347]|0;a[k+4|0]=a[37348]|0;a[k+5|0]=a[37349]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 1:{k=f+32|0;a[k]=a[37144]|0;a[k+1|0]=a[37145]|0;a[k+2|0]=a[37146]|0;a[k+3|0]=a[37147]|0;a[k+4|0]=a[37148]|0;a[k+5|0]=a[37149]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 0:{k=f+32|0;a[k]=a[37344]|0;a[k+1|0]=a[37345]|0;a[k+2|0]=a[37346]|0;a[k+3|0]=a[37347]|0;a[k+4|0]=a[37348]|0;a[k+5|0]=a[37349]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 3:{k=f+32|0;a[k]=a[36536]|0;a[k+1|0]=a[36537]|0;a[k+2|0]=a[36538]|0;a[k+3|0]=a[36539]|0;a[k+4|0]=a[36540]|0;a[k+5|0]=a[36541]|0;c[f+28>>2]=2;k=(a[g]&255)>>>1&7;cb(f+96|0,53560,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=k<<16>>16==0?8:k&65535,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 5:{k=f+32|0;a[k]=a[37144]|0;a[k+1|0]=a[37145]|0;a[k+2|0]=a[37146]|0;a[k+3|0]=a[37147]|0;a[k+4|0]=a[37148]|0;a[k+5|0]=a[37149]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};case 6:{k=f+32|0;a[k]=a[36912]|0;a[k+1|0]=a[36913]|0;a[k+2|0]=a[36914]|0;a[k+3|0]=a[36915]|0;a[k+4|0]=a[36916]|0;a[k+5|0]=a[36917]|0;a[k+6|0]=a[36918]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;k=f|0;c[k>>2]=c[k>>2]|32;i=h;return};case 7:{k=f+32|0;a[k]=a[36536]|0;a[k+1|0]=a[36537]|0;a[k+2|0]=a[36538]|0;a[k+3|0]=a[36539]|0;a[k+4|0]=a[36540]|0;a[k+5|0]=a[36541]|0;c[f+28>>2]=2;cb(f+96|0,44016,(l=i,i=i+8|0,c[l>>2]=(d[g]|0)>>>1&7,l)|0)|0;i=l;cb(f+160|0,44016,(l=i,i=i+8|0,c[l>>2]=b[j>>1]&7,l)|0)|0;i=l;i=h;return};default:{j=f+32|0;a[j]=a[36120]|0;a[j+1|0]=a[36121]|0;a[j+2|0]=a[36122]|0;c[f+28>>2]=1;j=((d[g]|0)<<8|(d[g+1|0]|0))&65535;cb(f+96|0,47472,(l=i,i=i+16|0,c[l>>2]=41376,c[l+8>>2]=j,l)|0)|0;i=l;i=h;return}}}function ij(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[37632]|0;a[e+1|0]=a[37633]|0;a[e+2|0]=a[37634]|0;a[e+3|0]=a[37635]|0;a[e+4|0]=a[37636]|0;a[e+5|0]=a[37637]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function jj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[37880]|0;a[e+1|0]=a[37881]|0;a[e+2|0]=a[37882]|0;a[e+3|0]=a[37883]|0;a[e+4|0]=a[37884]|0;a[e+5|0]=a[37885]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function kj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[38136]|0;a[e+1|0]=a[38137]|0;a[e+2|0]=a[38138]|0;a[e+3|0]=a[38139]|0;a[e+4|0]=a[38140]|0;a[e+5|0]=a[38141]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function lj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[38424]|0;a[e+1|0]=a[38425]|0;a[e+2|0]=a[38426]|0;a[e+3|0]=a[38427]|0;a[e+4|0]=a[38428]|0;a[e+5|0]=a[38429]|0;a[e+6|0]=a[38430]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);d=b|0;c[d>>2]=c[d>>2]|32;return}function mj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[38728]|0;a[e+1|0]=a[38729]|0;a[e+2|0]=a[38730]|0;a[e+3|0]=a[38731]|0;a[e+4|0]=a[38732]|0;a[e+5|0]=a[38733]|0;a[e+6|0]=a[38734]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);d=b|0;c[d>>2]=c[d>>2]|32;return}function nj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[39040]|0;a[e+1|0]=a[39041]|0;a[e+2|0]=a[39042]|0;a[e+3|0]=a[39043]|0;a[e+4|0]=a[39044]|0;a[e+5|0]=a[39045]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function oj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[39480]|0;a[e+1|0]=a[39481]|0;a[e+2|0]=a[39482]|0;a[e+3|0]=a[39483]|0;a[e+4|0]=a[39484]|0;a[e+5|0]=a[39485]|0;c[b+28>>2]=1;yj(b,b+96|0,d,a[d+1|0]&63,16);return}function pj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[39888]|0;a[e+1|0]=a[39889]|0;a[e+2|0]=a[39890]|0;a[e+3|0]=a[39891]|0;a[e+4|0]=a[39892]|0;a[e+5|0]=a[39893]|0;c[b+28>>2]=1;xj(b,b+96|0,d,33,8);return}function qj(b,d){b=b|0;d=d|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[40120]|0;a[g+1|0]=a[40121]|0;a[g+2|0]=a[40122]|0;a[g+3|0]=a[40123]|0;a[g+4|0]=a[40124]|0;a[g+5|0]=a[40125]|0;a[g+6|0]=a[40126]|0;c[b+28>>2]=2;xj(b,b+96|0,d,33,8);cb(b+160|0,44016,(d=i,i=i+8|0,c[d>>2]=(e[b+14>>1]|0)>>>12&7,d)|0)|0;i=d;i=f;return}function rj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[40368]|0;a[e+1|0]=a[40369]|0;a[e+2|0]=a[40370]|0;a[e+3|0]=a[40371]|0;a[e+4|0]=a[40372]|0;a[e+5|0]=a[40373]|0;c[b+28>>2]=1;xj(b,b+96|0,d,33,8);return}function sj(b,d){b=b|0;d=d|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[40624]|0;a[g+1|0]=a[40625]|0;a[g+2|0]=a[40626]|0;a[g+3|0]=a[40627]|0;a[g+4|0]=a[40628]|0;a[g+5|0]=a[40629]|0;a[g+6|0]=a[40630]|0;c[b+28>>2]=2;xj(b,b+96|0,d,33,8);cb(b+160|0,44016,(d=i,i=i+8|0,c[d>>2]=(e[b+14>>1]|0)>>>12&7,d)|0)|0;i=d;i=f;return}function tj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[40856]|0;a[e+1|0]=a[40857]|0;a[e+2|0]=a[40858]|0;a[e+3|0]=a[40859]|0;a[e+4|0]=a[40860]|0;a[e+5|0]=a[40861]|0;c[b+28>>2]=1;xj(b,b+96|0,d,33,8);return}function uj(b,d){b=b|0;d=d|0;var e=0;e=b+32|0;a[e]=a[41088]|0;a[e+1|0]=a[41089]|0;a[e+2|0]=a[41090]|0;a[e+3|0]=a[41091]|0;a[e+4|0]=a[41092]|0;a[e+5|0]=a[41093]|0;c[b+28>>2]=1;xj(b,b+96|0,d,33,8);return}function vj(b,d){b=b|0;d=d|0;var f=0,g=0;f=i;g=b+32|0;a[g]=a[52192]|0;a[g+1|0]=a[52193]|0;a[g+2|0]=a[52194]|0;a[g+3|0]=a[52195]|0;a[g+4|0]=a[52196]|0;a[g+5|0]=a[52197]|0;c[b+28>>2]=2;cb(b+96|0,44016,(g=i,i=i+8|0,c[g>>2]=(e[b+14>>1]|0)>>>12&7,g)|0)|0;i=g;xj(b,b+160|0,d,33,8);i=f;return}function wj(a,b){a=a|0;b=b|0;var d=0,f=0;b=i;i=i+16|0;d=b|0;cb(d|0,32672,(f=i,i=i+8|0,c[f>>2]=e[a+12>>1]|0,f)|0)|0;i=f;Wz(a+32|0,d|0)|0;c[a+28>>2]=0;d=a|0;c[d>>2]=c[d>>2]|4;i=b;return}function xj(f,g,h,j,k){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,z=0,A=0;l=i;i=i+16|0;m=l|0;n=l+8|0;switch(j|0){case 1:{j=((d[h]|0)<<8|(d[h+1|0]|0))&65535;cb(g|0,47472,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=j,o)|0)|0;i=o;i=l;return};case 5:{cb(g|0,44016,(o=i,i=i+8|0,c[o>>2]=b[f+12>>1]&7,o)|0)|0;i=o;i=l;return};case 8:{cb(g|0,40696,(o=i,i=i+8|0,c[o>>2]=(d[h]|0)>>>1&7,o)|0)|0;i=o;i=l;return};case 14:{j=((d[h+2|0]|0)<<8|(d[h+3|0]|0))&65535;p=(j&32768|0)!=0;q=b[f+12>>1]&7;cb(g|0,57488,(o=i,i=i+32|0,c[o>>2]=p?56360:62904,c[o+8>>2]=41376,c[o+16>>2]=(p?-j|0:j)&65535,c[o+24>>2]=q,o)|0)|0;i=o;q=f+8|0;c[q>>2]=(c[q>>2]|0)+1;i=l;return};case 23:{q=f+8|0;j=c[q>>2]|0;p=j<<1;r=(((d[h+p|0]|0)<<8|(d[h+(p|1)|0]|0))<<8|(d[h+(p+2)|0]|0))<<8|(d[h+(p+3)|0]|0);c[q>>2]=j+2;j=(c[f+4>>2]|0)+2+r|0;cb(g|0,52720,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=j,o)|0)|0;i=o;i=l;return};case 9:{j=d[h+2|0]|0;cb(g|0,37704,(o=i,i=i+16|0,c[o>>2]=(j&128|0)!=0?34768:32184,c[o+8>>2]=j>>>4&7,o)|0)|0;i=o;i=l;return};case 10:{cb(g|0,31160,(o=i,i=i+8|0,c[o>>2]=b[f+12>>1]&7,o)|0)|0;i=o;i=l;return};case 24:{j=(d[h+2|0]|0)<<8|(d[h+3|0]|0);c[n>>2]=1;a[g]=0;r=j&65535;j=0;q=0;p=0;while(1){if((j|0)!=8|(p|0)==0){s=p}else{zj(g,q,p,n);s=0}t=(s|0)==0;do{if((1<<j&r|0)==0){if(t){u=0;v=q;break}zj(g,q,s,n);u=0;v=q}else{u=s+1|0;v=t?j:q}}while(0);t=j+1|0;if(t>>>0<16>>>0){j=t;q=v;p=u}else{break}}if((u|0)!=0){zj(g,v,u,n)}n=f+8|0;c[n>>2]=(c[n>>2]|0)+1;i=l;return};case 2:{n=((d[h+2|0]|0)<<8|(d[h+3|0]|0))&65535;cb(g|0,47472,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=n,o)|0)|0;i=o;i=l;return};case 3:{yj(f,g,h,a[h+1|0]&63,k);i=l;return};case 20:{n=e[f+12>>1]|0;cb(g|0,54088,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=(n&128|0)!=0?n|-256:n&255,o)|0)|0;i=o;i=l;return};case 21:{n=d[h+1|0]|0;u=(c[f+4>>2]|0)+2+((n&128|0)!=0?n|-256:n)|0;cb(g|0,52720,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=u,o)|0)|0;i=o;i=l;return};case 22:{u=f+8|0;n=c[u>>2]|0;v=n<<1;p=(d[h+v|0]|0)<<8|(d[h+(v|1)|0]|0);c[u>>2]=n+1;n=p&65535;p=(c[f+4>>2]|0)+2+((n&32768|0)!=0?n|-65536:n)|0;cb(g|0,52720,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=p,o)|0)|0;i=o;i=l;return};case 0:{a[g]=0;i=l;return};case 4:{p=((d[h]|0)<<8|(d[h+1|0]|0))&65535;yj(f,g,h,p>>>3&56|p>>>9&7,k);i=l;return};case 30:{k=e[f+14>>1]|0;cb(g|0,50600,(o=i,i=i+16|0,c[o>>2]=k&7,c[o+8>>2]=k>>>12&7,o)|0)|0;i=o;i=l;return};case 31:{k=e[f+14>>1]|0;cb(g|0,50600,(o=i,i=i+16|0,c[o>>2]=k&7,c[o+8>>2]=k>>>12&7,o)|0)|0;i=o;i=l;return};case 26:{k=g;y=5391171;a[k]=y;y=y>>8;a[k+1|0]=y;y=y>>8;a[k+2|0]=y;y=y>>8;a[k+3|0]=y;i=l;return};case 11:{cb(g|0,31160,(o=i,i=i+8|0,c[o>>2]=(e[f+12>>1]|0)>>>9&7,o)|0)|0;i=o;i=l;return};case 12:{cb(g|0,30264,(o=i,i=i+8|0,c[o>>2]=b[f+12>>1]&7,o)|0)|0;i=o;i=l;return};case 13:{cb(g|0,30264,(o=i,i=i+8|0,c[o>>2]=(e[f+12>>1]|0)>>>9&7,o)|0)|0;i=o;i=l;return};case 18:{k=(a[h]&255)>>>1&7;cb(g|0,53560,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=k<<16>>16==0?8:k&65535,o)|0)|0;i=o;i=l;return};case 32:case 34:{cb(g|0,44016,(o=i,i=i+8|0,c[o>>2]=(e[f+14>>1]|0)>>>12&7,o)|0)|0;i=o;i=l;return};case 33:{k=f+8|0;p=c[k>>2]|0;n=p<<1;u=(d[h+n|0]|0)<<8|(d[h+(n|1)|0]|0);n=p+1|0;c[k>>2]=n;b[f+12+(n<<1)>>1]=u;yj(f,g,h,a[h+1|0]&63,8);u=Tz(g|0)|0;a[g+u|0]=32;n=u+2|0;k=g+n|0;a[g+(u+1)|0]=123;u=f+14|0;p=e[u>>1]|0;v=p>>>6;if((p&2048|0)==0){cb(k|0,49856,(o=i,i=i+8|0,c[o>>2]=v&31,o)|0)|0;i=o}else{cb(k|0,44016,(o=i,i=i+8|0,c[o>>2]=v&7,o)|0)|0;i=o}v=(Tz(k|0)|0)+n|0;n=v+1|0;k=g+n|0;a[g+v|0]=58;v=b[u>>1]|0;u=v&31;p=(u|0)==0?32:u;if((v&32)==0){cb(k|0,49856,(o=i,i=i+8|0,c[o>>2]=p,o)|0)|0;i=o}else{cb(k|0,44016,(o=i,i=i+8|0,c[o>>2]=p&7,o)|0)|0;i=o}p=g+((Tz(k|0)|0)+n)|0;y=125;a[p]=y;y=y>>8;a[p+1|0]=y;i=l;return};case 25:{p=d[h+2|0]|0;n=d[h+3|0]|0;c[m>>2]=1;a[g]=0;k=(((((((p&65535)>>>2&1|p&2|((((((((n&65535)>>>2&1|n&2|((p<<8|n)<<1|n&1)<<2)<<1|(n&65535)>>>3&1)<<1|(n&65535)>>>4&1)<<1|(n&65535)>>>5&1)<<1|(n&65535)>>>6&1)<<1|(n&65535)>>>7)<<1|p&1)<<2)<<1|(p&65535)>>>3&1)<<1|(p&65535)>>>4&1)<<1|(p&65535)>>>5&1)<<1|(p&65535)>>>6&1)<<1|(p&65535)>>>7)&65535;p=0;n=0;v=0;while(1){if((p|0)!=8|(v|0)==0){w=v}else{zj(g,n,v,m);w=0}u=(w|0)==0;do{if((1<<p&k|0)==0){if(u){x=0;z=n;break}zj(g,n,w,m);x=0;z=n}else{x=w+1|0;z=u?p:n}}while(0);u=p+1|0;if(u>>>0<16>>>0){p=u;n=z;v=x}else{break}}if((x|0)!=0){zj(g,z,x,m)}m=f+8|0;c[m>>2]=(c[m>>2]|0)+1;i=l;return};case 28:{m=g;y=5264213;a[m]=y;y=y>>8;a[m+1|0]=y;y=y>>8;a[m+2|0]=y;y=y>>8;a[m+3|0]=y;i=l;return};case 29:{m=((d[h+2|0]|0)<<8|(d[h+3|0]|0))&4095;if((m|0)==1){x=f|0;c[x>>2]=c[x>>2]|64;A=48432}else if((m|0)==2048){x=f|0;c[x>>2]=c[x>>2]|64;A=51e3}else if((m|0)==2049){x=f|0;c[x>>2]=c[x>>2]|64;A=48040}else if((m|0)==0){x=f|0;c[x>>2]=c[x>>2]|64;A=48832}else{cb(g|0,47744,(o=i,i=i+8|0,c[o>>2]=m,o)|0)|0;i=o;m=f|0;c[m>>2]=c[m>>2]|64;i=l;return}m=A;A=g;y=d[m]|d[m+1|0]<<8|d[m+2|0]<<16|d[m+3|0]<<24|0;a[A]=y;y=y>>8;a[A+1|0]=y;y=y>>8;a[A+2|0]=y;y=y>>8;a[A+3|0]=y;i=l;return};case 7:{cb(g|0,40696,(o=i,i=i+8|0,c[o>>2]=b[f+12>>1]&7,o)|0)|0;i=o;i=l;return};case 27:{a[g]=a[51480]|0;a[g+1|0]=a[51481]|0;a[g+2|0]=a[51482]|0;i=l;return};case 19:{A=b[f+12>>1]&15;cb(g|0,54872,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=A,o)|0)|0;i=o;i=l;return};case 6:{cb(g|0,44016,(o=i,i=i+8|0,c[o>>2]=(d[h]|0)>>>1&7,o)|0)|0;i=o;i=l;return};case 15:{A=d[h+3|0]|0;cb(g|0,54872,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=A,o)|0)|0;i=o;A=f+8|0;c[A>>2]=(c[A>>2]|0)+1;i=l;return};case 16:{A=((d[h+2|0]|0)<<8|(d[h+3|0]|0))&65535;cb(g|0,47472,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=A,o)|0)|0;i=o;A=f+8|0;c[A>>2]=(c[A>>2]|0)+1;i=l;return};case 17:{A=(((d[h+2|0]|0)<<8|(d[h+3|0]|0))<<8|(d[h+4|0]|0))<<8|(d[h+5|0]|0);cb(g|0,54088,(o=i,i=i+16|0,c[o>>2]=41376,c[o+8>>2]=A,o)|0)|0;i=o;o=f+8|0;c[o>>2]=(c[o>>2]|0)+2;i=l;return};default:{a[g]=0;i=l;return}}}function yj(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;switch(f>>>3&7|0){case 2:{cb(b|0,46544,(j=i,i=i+8|0,c[j>>2]=f&7,j)|0)|0;i=j;i=h;return};case 5:{k=a+8|0;l=c[k>>2]|0;m=l<<1;n=((d[e+m|0]|0)<<8|(d[e+(m|1)|0]|0))&65535;c[k>>2]=l+1;l=(n&32768|0)!=0;cb(b|0,57488,(j=i,i=i+32|0,c[j>>2]=l?56360:62904,c[j+8>>2]=41376,c[j+16>>2]=(l?-n|0:n)&65535,c[j+24>>2]=f&7,j)|0)|0;i=j;i=h;return};case 4:{cb(b|0,30264,(j=i,i=i+8|0,c[j>>2]=f&7,j)|0)|0;i=j;i=h;return};case 1:{cb(b|0,40696,(j=i,i=i+8|0,c[j>>2]=f&7,j)|0)|0;i=j;i=h;return};case 0:{cb(b|0,44016,(j=i,i=i+8|0,c[j>>2]=f&7,j)|0)|0;i=j;i=h;return};case 3:{cb(b|0,31160,(j=i,i=i+8|0,c[j>>2]=f&7,j)|0)|0;i=j;i=h;return};case 6:{n=a+8|0;l=c[n>>2]|0;k=l<<1;m=((d[e+k|0]|0)<<8|(d[e+(k|1)|0]|0))&65535;c[n>>2]=l+1;if((m&256|0)!=0){Aj(a,b,e);i=h;return}l=(m&128|0)!=0;cb(b|0,46008,(j=i,i=i+64|0,c[j>>2]=l?56360:62904,c[j+8>>2]=41376,c[j+16>>2]=(l?-m|0:m)&255,c[j+24>>2]=f&7,c[j+32>>2]=(m&32768|0)!=0?34768:32184,c[j+40>>2]=m>>>12&7,c[j+48>>2]=(m&2048|0)!=0?45520:45216,c[j+56>>2]=1<<(m>>>9&3),j)|0)|0;i=j;if((m&1536|0)==0){i=h;return}m=a|0;c[m>>2]=c[m>>2]|128;i=h;return};case 7:{switch(f&7|0){case 0:{m=a+8|0;l=c[m>>2]|0;n=l<<1;k=((d[e+n|0]|0)<<8|(d[e+(n|1)|0]|0))&65535;c[m>>2]=l+1;l=(k&32768|0)!=0;cb(b|0,44896,(j=i,i=i+24|0,c[j>>2]=l?56360:62904,c[j+8>>2]=41376,c[j+16>>2]=(l?-k|0:k)&65535,j)|0)|0;i=j;i=h;return};case 1:{k=a+8|0;l=c[k>>2]|0;m=l<<1;n=((d[e+m|0]|0)<<8|(d[e+(m|1)|0]|0))&65535;m=l+1|0;c[k>>2]=m;o=m<<1;m=((d[e+o|0]|0)<<8|(d[e+(o|1)|0]|0))&65535;c[k>>2]=l+2;cb(b|0,52720,(j=i,i=i+16|0,c[j>>2]=41376,c[j+8>>2]=m|n<<16,j)|0)|0;i=j;i=h;return};case 2:{n=a+8|0;m=c[n>>2]|0;l=m<<1;k=((d[e+l|0]|0)<<8|(d[e+(l|1)|0]|0))&65535;c[n>>2]=m+1;m=(c[a+4>>2]|0)+2+((k&32768|0)!=0?k|-65536:k)|0;cb(b|0,44536,(j=i,i=i+16|0,c[j>>2]=41376,c[j+8>>2]=m,j)|0)|0;i=j;i=h;return};case 3:{m=a+8|0;k=c[m>>2]|0;n=k<<1;l=((d[e+n|0]|0)<<8|(d[e+(n|1)|0]|0))&65535;c[m>>2]=k+1;if((l&256|0)!=0){Aj(a,b,e);i=h;return}k=(l&128|0)!=0;cb(b|0,44208,(j=i,i=i+56|0,c[j>>2]=k?56360:62904,c[j+8>>2]=41376,c[j+16>>2]=(k?-l|0:l)&255,c[j+24>>2]=(l&32768|0)!=0?34768:32184,c[j+32>>2]=l>>>12&7,c[j+40>>2]=(l&2048|0)!=0?45520:45216,c[j+48>>2]=1<<(l>>>9&3),j)|0)|0;i=j;if((l&1536|0)==0){i=h;return}l=a|0;c[l>>2]=c[l>>2]|128;i=h;return};case 4:{if((g|0)==8){l=a+8|0;k=c[l>>2]|0;m=d[e+(k<<1|1)|0]|0;c[l>>2]=k+1;cb(b|0,54872,(j=i,i=i+16|0,c[j>>2]=41376,c[j+8>>2]=m,j)|0)|0;i=j;i=h;return}else if((g|0)==16){m=a+8|0;k=c[m>>2]|0;l=k<<1;n=((d[e+l|0]|0)<<8|(d[e+(l|1)|0]|0))&65535;c[m>>2]=k+1;cb(b|0,47472,(j=i,i=i+16|0,c[j>>2]=41376,c[j+8>>2]=n,j)|0)|0;i=j;i=h;return}else if((g|0)==32){g=a+8|0;a=c[g>>2]|0;n=a<<1;k=((d[e+n|0]|0)<<8|(d[e+(n|1)|0]|0))&65535;n=a+1|0;c[g>>2]=n;m=n<<1;n=((d[e+m|0]|0)<<8|(d[e+(m|1)|0]|0))&65535;c[g>>2]=a+2;cb(b|0,54088,(j=i,i=i+16|0,c[j>>2]=41376,c[j+8>>2]=n|k<<16,j)|0)|0;i=j;i=h;return}else{i=h;return}break};default:{cb(b|0,43936,(j=i,i=i+8|0,c[j>>2]=f&63,j)|0)|0;i=j;i=h;return}}break};default:{cb(b|0,43936,(j=i,i=i+8|0,c[j>>2]=f&63,j)|0)|0;i=j;i=h;return}}}function zj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;h=g|0;j=d>>>0<8>>>0;k=j?d:d-8|0;d=j?32184:34768;if((c[f>>2]|0)==0){j=b+(Tz(b|0)|0)|0;y=47;a[j]=y;y=y>>8;a[j+1|0]=y}if(e>>>0>2>>>0){cb(h|0,47144,(l=i,i=i+32|0,c[l>>2]=d,c[l+8>>2]=k,c[l+16>>2]=d,c[l+24>>2]=e-1+k,l)|0)|0;i=l;m=h|0;n=Uz(b|0,m|0)|0;c[f>>2]=0;i=g;return}j=h|0;if((e|0)==2){cb(j|0,46856,(l=i,i=i+32|0,c[l>>2]=d,c[l+8>>2]=k,c[l+16>>2]=d,c[l+24>>2]=k+1,l)|0)|0;i=l;m=h|0;n=Uz(b|0,m|0)|0;c[f>>2]=0;i=g;return}else{cb(j|0,37704,(l=i,i=i+16|0,c[l>>2]=d,c[l+8>>2]=k,l)|0)|0;i=l;m=h|0;n=Uz(b|0,m|0)|0;c[f>>2]=0;i=g;return}}function Aj(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;j=i;i=i+32|0;k=j|0;l=j+16|0;m=l|0;n=i;i=i+16|0;o=n|0;p=i;i=i+16|0;q=p|0;r=i;i=i+16|0;s=e[f+14>>1]|0;t=(s&64|0)==0;do{if((s&128|0)==0){u=e[f+12>>1]|0;v=k;if((u&56|0)==56){a[v]=a[43688]|0;a[v+1|0]=a[43689]|0;a[v+2|0]=a[43690]|0;break}else{cb(v|0,40696,(w=i,i=i+8|0,c[w>>2]=u&7,w)|0)|0;i=w;break}}else{b[k>>1]=45}}while(0);if(t){cb(l|0,43384,(w=i,i=i+24|0,c[w>>2]=(s&32768|0)!=0?34768:32184,c[w+8>>2]=s>>>12&7,c[w+16>>2]=(s&2048|0)!=0?45520:45216,w)|0)|0;i=w}else{b[m>>1]=45}m=s>>>9&3;t=r|0;if((m|0)==0){a[t]=0}else{cb(t|0,43008,(w=i,i=i+8|0,c[w>>2]=1<<m,w)|0)|0;i=w}m=s>>>4&3;if((m|0)==0|(m|0)==1){b[o>>1]=45}else if((m|0)==2){r=f+8|0;u=c[r>>2]|0;v=u<<1;x=((d[h+v|0]|0)<<8|(d[h+(v|1)|0]|0))&65535;c[r>>2]=u+1;u=(x&32768|0)!=0;if(u){y=-x&65535}else{y=x}cb(n|0,44896,(w=i,i=i+24|0,c[w>>2]=u?56360:62904,c[w+8>>2]=41376,c[w+16>>2]=y,w)|0)|0;i=w}else if((m|0)==3){m=f+8|0;y=c[m>>2]|0;u=y<<1;x=((d[h+u|0]|0)<<8|(d[h+(u|1)|0]|0))&65535;u=y+1|0;c[m>>2]=u;r=u<<1;u=((d[h+r|0]|0)<<8|(d[h+(r|1)|0]|0))&65535;c[m>>2]=y+2;y=u|x<<16;x=(y|0)<0;cb(n|0,42576,(w=i,i=i+24|0,c[w>>2]=x?56360:62904,c[w+8>>2]=41376,c[w+16>>2]=x?-y|0:y,w)|0)|0;i=w}y=s&3;if((y|0)==0|(y|0)==1){b[q>>1]=45}else if((y|0)==2){x=f+8|0;n=c[x>>2]|0;u=n<<1;m=((d[h+u|0]|0)<<8|(d[h+(u|1)|0]|0))&65535;c[x>>2]=n+1;n=(m&32768|0)!=0;if(n){z=-m&65535}else{z=m}cb(p|0,44896,(w=i,i=i+24|0,c[w>>2]=n?56360:62904,c[w+8>>2]=41376,c[w+16>>2]=z,w)|0)|0;i=w}else if((y|0)==3){y=f+8|0;z=c[y>>2]|0;n=z<<1;m=((d[h+n|0]|0)<<8|(d[h+(n|1)|0]|0))&65535;n=z+1|0;c[y>>2]=n;x=n<<1;n=((d[h+x|0]|0)<<8|(d[h+(x|1)|0]|0))&65535;c[y>>2]=z+2;z=n|m<<16;m=(z|0)<0;cb(p|0,42576,(w=i,i=i+24|0,c[w>>2]=m?56360:62904,c[w+8>>2]=41376,c[w+16>>2]=m?-z|0:z,w)|0)|0;i=w}if((s&4|0)==0){cb(g|0,41720,(w=i,i=i+40|0,c[w>>2]=k,c[w+8>>2]=o,c[w+16>>2]=l,c[w+24>>2]=t,c[w+32>>2]=q,w)|0)|0;i=w;A=f|0;B=c[A>>2]|0;C=B|128;c[A>>2]=C;i=j;return}else{cb(g|0,42040,(w=i,i=i+40|0,c[w>>2]=k,c[w+8>>2]=o,c[w+16>>2]=l,c[w+24>>2]=t,c[w+32>>2]=q,w)|0)|0;i=w;A=f|0;B=c[A>>2]|0;C=B|128;c[A>>2]=C;i=j;return}}function Bj(){var d=0,e=0,f=0,g=0,h=0;d=Mz(4528)|0;e=d;if((d|0)==0){f=0;return f|0}g=d+334|0;Rz(d|0,0,50)|0;Rz(d+52|0,0,36)|0;a[g]=1;a[d+335|0]=2;c[d+364>>2]=0;a[d+368|0]=0;c[d+372>>2]=1;c[d+376>>2]=0;c[d+380>>2]=0;c[d+384>>2]=0;c[d+388>>2]=30136;c[d+392>>2]=0;c[d+396>>2]=0;ok(e);b[d+166>>1]=8192;h=d+148|0;Rz(d+88|0,0,64)|0;if((a[g]|0)==0){c[h>>2]=0;c[d+172>>2]=0}else{c[d+168>>2]=0;c[h>>2]=0}c[d+152>>2]=0;Rz(d+176|0,0,156)|0;f=e;return f|0}function Cj(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[a+4>>2]=b;c[a+8>>2]=d;c[a+12>>2]=e;c[a+16>>2]=f;c[a+20>>2]=g;c[a+24>>2]=h;c[a+28>>2]=i;return}function Dj(a,b,d){a=a|0;b=b|0;d=d|0;c[a+32>>2]=b;c[a+36>>2]=(b|0)==0?0:d;return}function Ej(a,b,d){a=a|0;b=b|0;d=d|0;c[a+40>>2]=b;c[a+44>>2]=d;return}function Fj(a,b,d){a=a|0;b=b|0;d=d|0;c[a+60>>2]=b;c[a+64>>2]=d;return}function Gj(a,b){a=a|0;b=b|0;var d=0;d=a|0;a=c[d>>2]|0;c[d>>2]=(b|0)==0?a|1:a&-2;return}function Hj(a){a=a|0;c[a>>2]=0;ok(a);return}function Ij(a){a=a|0;c[a>>2]=2;ok(a);return}function Jj(a){a=a|0;c[a>>2]=7;sn(a);return}function Kj(a){a=a|0;return c[a+392>>2]|0}function Lj(a){a=a|0;return c[a+396>>2]|0}function Mj(a){a=a|0;return c[a+372>>2]|0}function Nj(b,c){b=b|0;c=c|0;a[b+335|0]=c&3;return}function Oj(a){a=a|0;return c[a+376>>2]|0}function Pj(a){a=a|0;return c[a+384>>2]|0}function Qj(a){a=a|0;return c[a+388>>2]|0}function Rj(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>31>>>0){d=0;return d|0}d=c[a+200+(((c[a+196>>2]|0)-b&31)<<2)>>2]|0;return d|0}function Sj(a){a=a|0;return b[a+328>>1]|0}function Tj(f,g,h){f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;i=(a[g]|0)==37?g+1|0:g;if((Qa(i|0,50936)|0)==0){c[h>>2]=c[f+152>>2];j=0;return j|0}if((Qa(i|0,46816)|0)==0){c[h>>2]=c[f+200+((c[f+196>>2]&31)<<2)>>2];j=0;return j|0}g=a[i]|0;do{if(g<<24>>24==111){if((a[i+1|0]|0)!=112){break}k=a[i+2|0]|0;if((k-48&255)>>>0<10>>>0){l=i;m=0;n=k;while(1){o=(m*10|0)-48+(n<<24>>24)|0;p=a[l+3|0]|0;if((p-48&255)>>>0<10>>>0){l=l+1|0;m=o;n=p}else{break}}q=o<<1;r=p}else{q=0;r=k}if(r<<24>>24!=0){j=1;return j|0}n=(c[f+152>>2]|0)+q&16777215;m=n+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){l=c[f+32>>2]|0;s=d[l+n|0]<<8|d[l+m|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}c[h>>2]=s&65535;j=0;return j|0}}while(0);if((Qa(i|0,43344)|0)==0){c[h>>2]=e[f+166>>1]|0;j=0;return j|0}if((Qa(i|0,40080)|0)==0){c[h>>2]=c[f+148>>2];j=0;return j|0}if((Qa(i|0,37112)|0)==0){c[h>>2]=b[f+166>>1]&255;j=0;return j|0}if((Qa(i|0,34080)|0)==0){c[h>>2]=c[((a[f+334|0]|0)==0?f+148|0:f+168|0)>>2];j=0;return j|0}if((Qa(i|0,31944)|0)==0){c[h>>2]=c[((a[f+334|0]|0)==0?f+172|0:f+148|0)>>2];j=0;return j|0}if((g<<24>>24|0)==100|(g<<24>>24|0)==68){t=100}else if((g<<24>>24|0)==97|(g<<24>>24|0)==65){t=97}else{j=1;return j|0}g=i+1|0;s=a[g]|0;if((s-48&255)>>>0<10>>>0){q=0;r=g;p=s;while(1){u=(q*10|0)-48+(p<<24>>24)|0;v=r+1|0;s=a[v]|0;if((s-48&255)>>>0<10>>>0){q=u;r=v;p=s}else{break}}w=r;x=u&7;y=v}else{w=i;x=0;y=g}if((t|0)==97){z=f+120+(x<<2)|0}else{z=f+88+(x<<2)|0}x=c[z>>2]|0;c[h>>2]=x;z=a[y]|0;if(z<<24>>24==46){switch(a[w+2|0]|0){case 98:case 66:{c[h>>2]=x&255;break};case 119:case 87:{c[h>>2]=x&65535;break};case 108:case 76:{break};default:{j=1;return j|0}}A=a[w+3|0]|0}else{A=z}j=A<<24>>24!=0|0;return j|0}function Uj(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=(a[e]|0)==37?e+1|0:e;if((Qa(g|0,50936)|0)==0){Vj(d,f);h=0;return h|0}if((Qa(g|0,43344)|0)==0){e=f&65535;i=d+166|0;if(((b[i>>1]^e)&8192)!=0){j=e&8192;k=d+334|0;l=d+148|0;m=c[l>>2]|0;if((a[k]|0)==0){n=d+168|0;c[n>>2]=m;o=n;p=d+172|0}else{n=d+172|0;c[n>>2]=m;o=d+168|0;p=n}c[l>>2]=c[(j<<16>>16!=0?p:o)>>2];a[k]=(j&65535)>>>13}b[i>>1]=e&-22753;h=0;return h|0}if((Qa(g|0,40080)|0)==0){c[d+148>>2]=f;h=0;return h|0}if((Qa(g|0,37112)|0)==0){e=d+166|0;b[e>>1]=b[e>>1]&-256|f&255;h=0;return h|0}if((Qa(g|0,34080)|0)==0){if((a[d+334|0]|0)==0){c[d+148>>2]=f;h=0;return h|0}else{c[d+168>>2]=f;h=0;return h|0}}if((Qa(g|0,31944)|0)==0){if((a[d+334|0]|0)==0){c[d+172>>2]=f;h=0;return h|0}else{c[d+148>>2]=f;h=0;return h|0}}e=a[g]|0;if((e<<24>>24|0)==100|(e<<24>>24|0)==68){q=100}else if((e<<24>>24|0)==97|(e<<24>>24|0)==65){q=97}else{h=1;return h|0}e=g+1|0;i=a[e]|0;if((i-48&255)>>>0<10>>>0){j=0;k=e;e=i;while(1){r=(j*10|0)-48+(e<<24>>24)|0;o=k+1|0;s=a[o]|0;if((s-48&255)>>>0<10>>>0){j=r;k=o;e=s}else{break}}t=k;u=r&7;v=s}else{t=g;u=0;v=i}if(v<<24>>24==46){switch(a[t+2|0]|0){case 119:case 87:{w=65535;break};case 108:case 76:{w=-1;break};case 98:case 66:{w=255;break};default:{h=1;return h|0}}x=w;y=a[t+3|0]|0}else{x=-1;y=v}if(y<<24>>24!=0){h=1;return h|0}if((q|0)==97){q=d+120+(u<<2)|0;c[q>>2]=c[q>>2]&~x|x&f;h=0;return h|0}else{q=d+88+(u<<2)|0;c[q>>2]=c[q>>2]&~x|x&f;h=0;return h|0}return 0}function Vj(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=e+156|0;c[g>>2]=f;do{if((f&1|0)==0){h=e+164|0;b[e+162>>1]=b[h>>1]|0;i=f&16777215;j=i+1|0;if(j>>>0<(c[e+36>>2]|0)>>>0){k=c[e+32>>2]|0;l=d[k+i|0]<<8|d[k+j|0]}else{l=sc[c[e+12>>2]&63](c[e+4>>2]|0,i)|0}b[h>>1]=l;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;h=e+152|0;c[h>>2]=(c[h>>2]|0)+2;break}else{Yj(e);break}}else{_j(e,f,0,0)}}while(0);l=c[g>>2]|0;if((l&1|0)!=0){_j(e,l,0,0);m=e+152|0;c[m>>2]=f;return}h=e+164|0;b[e+162>>1]=b[h>>1]|0;i=l&16777215;l=i+1|0;if(l>>>0<(c[e+36>>2]|0)>>>0){j=c[e+32>>2]|0;n=d[j+i|0]<<8|d[j+l|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,i)|0}b[h>>1]=n;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;m=e+152|0;c[m>>2]=f;return}else{Yj(e);m=e+152|0;c[m>>2]=f;return}}function Wj(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=d+166|0;if(((b[f>>1]^e)&8192)==0){g=e&-22753;b[f>>1]=g;return}h=e&8192;i=d+334|0;j=d+148|0;k=c[j>>2]|0;if((a[i]|0)==0){l=d+168|0;c[l>>2]=k;m=l;n=d+172|0}else{l=d+172|0;c[l>>2]=k;m=d+168|0;n=l}c[j>>2]=c[(h<<16>>16!=0?n:m)>>2];a[i]=(h&65535)>>>13;g=e&-22753;b[f>>1]=g;return}function Xj(e){e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=e+376|0;c[f>>2]=(c[f>>2]|0)+1;f=e+152|0;c[e+380>>2]=c[f>>2];c[e+384>>2]=0;c[e+388>>2]=31032;g=e+166|0;if((b[g>>1]&8192)==0){h=e+334|0;i=e+148|0;j=c[i>>2]|0;if((a[h]|0)==0){c[e+168>>2]=j;k=c[e+172>>2]|0}else{c[e+172>>2]=j;k=j}c[i>>2]=k;a[h]=1}b[g>>1]=9984;g=e+36|0;h=c[g>>2]|0;if(h>>>0>3>>>0){k=c[e+32>>2]|0;l=((d[k]<<8|d[k+1|0])<<8|d[k+2|0])<<8|d[k+3|0];m=h}else{h=sc[c[e+16>>2]&63](c[e+4>>2]|0,0)|0;l=h;m=c[g>>2]|0}c[e+148>>2]=l;if(m>>>0>7>>>0){m=c[e+32>>2]|0;n=((d[m+4|0]<<8|d[m+5|0])<<8|d[m+6|0])<<8|d[m+7|0]}else{n=sc[c[e+16>>2]&63](c[e+4>>2]|0,4)|0}m=e+156|0;c[m>>2]=n;do{if((n&1|0)==0){l=e+164|0;b[e+162>>1]=b[l>>1]|0;h=n&16777215;k=h+1|0;if(k>>>0<(c[g>>2]|0)>>>0){i=c[e+32>>2]|0;o=d[i+h|0]<<8|d[i+k|0]}else{o=sc[c[e+12>>2]&63](c[e+4>>2]|0,h)|0}b[l>>1]=o;if((a[e+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;c[f>>2]=(c[f>>2]|0)+2;break}else{Yj(e);break}}else{_j(e,n,0,0)}}while(0);n=c[m>>2]|0;if((n&1|0)!=0){_j(e,n,0,0);p=c[m>>2]|0;q=p-4|0;c[f>>2]=q;r=e+372|0;s=c[r>>2]|0;t=s+64|0;c[r>>2]=t;return}o=e+164|0;b[e+162>>1]=b[o>>1]|0;l=n&16777215;n=l+1|0;if(n>>>0<(c[g>>2]|0)>>>0){g=c[e+32>>2]|0;u=d[g+l|0]<<8|d[g+n|0]}else{u=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[o>>1]=u;if((a[e+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;c[f>>2]=(c[f>>2]|0)+2;p=c[m>>2]|0;q=p-4|0;c[f>>2]=q;r=e+372|0;s=c[r>>2]|0;t=s+64|0;c[r>>2]=t;return}else{Yj(e);p=c[m>>2]|0;q=p-4|0;c[f>>2]=q;r=e+372|0;s=c[r>>2]|0;t=s+64|0;c[r>>2]=t;return}}function Yj(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;a[b+336|0]=0;Zj(b,2,0,30088);d=b+148|0;e=c[d>>2]|0;f=e-4|0;g=f&16777215;h=g+3|0;i=b+36|0;if(h>>>0<(c[i>>2]|0)>>>0){j=b+32|0;a[(c[j>>2]|0)+g|0]=0;a[(c[j>>2]|0)+(g+1)|0]=0;a[(c[j>>2]|0)+(g+2)|0]=0;a[(c[j>>2]|0)+h|0]=0}else{pc[c[b+28>>2]&63](c[b+4>>2]|0,g,0)}c[d>>2]=f;f=e-8|0;e=f&16777215;g=e+3|0;if(g>>>0<(c[i>>2]|0)>>>0){i=b+32|0;a[(c[i>>2]|0)+e|0]=0;a[(c[i>>2]|0)+(e+1)|0]=0;a[(c[i>>2]|0)+(e+2)|0]=0;a[(c[i>>2]|0)+g|0]=0;c[d>>2]=f;k=b+372|0;l=c[k>>2]|0;m=l+62|0;c[k>>2]=m;return}else{pc[c[b+28>>2]&63](c[b+4>>2]|0,e,0);c[d>>2]=f;k=b+372|0;l=c[k>>2]|0;m=l+62|0;c[k>>2]=m;return}}function Zj(e,f,g,h){e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;i=f&255;f=e+376|0;c[f>>2]=(c[f>>2]|0)+1;f=e+152|0;c[e+380>>2]=c[f>>2];c[e+384>>2]=i;c[e+388>>2]=h;h=c[e+80>>2]|0;if((h|0)!=0){nc[h&511](c[e+68>>2]|0,i)}if((i|0)!=7&(i-32|0)>>>0>15>>>0){b[e+332>>1]=0}h=e+166|0;j=b[h>>1]|0;k=j&1823|8192;if((j&8192)==0){l=e+334|0;m=e+148|0;n=c[m>>2]|0;if((a[l]|0)==0){c[e+168>>2]=n;o=c[e+172>>2]|0}else{c[e+172>>2]=n;o=n}c[m>>2]=o;a[l]=1}b[h>>1]=k;if((c[e>>2]&2|0)==0){p=c[e+148>>2]|0;q=e+36|0}else{k=i<<2;h=(g<<12|k)&65535;g=e+148|0;l=(c[g>>2]|0)-2|0;o=l&16777215;m=o+1|0;n=e+36|0;if(m>>>0<(c[n>>2]|0)>>>0){r=e+32|0;a[(c[r>>2]|0)+o|0]=(h&65535)>>>8;a[(c[r>>2]|0)+m|0]=k}else{pc[c[e+24>>2]&63](c[e+4>>2]|0,o,h)}c[g>>2]=l;p=l;q=n}n=c[f>>2]|0;l=e+148|0;g=p-4|0;h=g&16777215;o=h+3|0;if(o>>>0<(c[q>>2]|0)>>>0){k=e+32|0;a[(c[k>>2]|0)+h|0]=n>>>24;a[(c[k>>2]|0)+(h+1)|0]=n>>>16;a[(c[k>>2]|0)+(h+2)|0]=n>>>8;a[(c[k>>2]|0)+o|0]=n}else{pc[c[e+28>>2]&63](c[e+4>>2]|0,h,n)}c[l>>2]=g;g=p-6|0;p=g&16777215;n=p+1|0;if(n>>>0<(c[q>>2]|0)>>>0){h=e+32|0;a[(c[h>>2]|0)+p|0]=(j&65535)>>>8;a[(c[h>>2]|0)+n|0]=j}else{pc[c[e+24>>2]&63](c[e+4>>2]|0,p,j)}c[l>>2]=g;g=(c[e+176>>2]|0)+(i<<2)&16777215;i=g+3|0;if(i>>>0<(c[q>>2]|0)>>>0){l=c[e+32>>2]|0;s=((d[l+g|0]<<8|d[l+(g+1)|0])<<8|d[l+(g+2)|0])<<8|d[l+i|0]}else{s=sc[c[e+16>>2]&63](c[e+4>>2]|0,g)|0}g=e+156|0;c[g>>2]=s;do{if((s&1|0)==0){i=e+164|0;b[e+162>>1]=b[i>>1]|0;l=s&16777215;j=l+1|0;if(j>>>0<(c[q>>2]|0)>>>0){p=c[e+32>>2]|0;t=d[p+l|0]<<8|d[p+j|0]}else{t=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[i>>1]=t;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;c[f>>2]=(c[f>>2]|0)+2;break}else{Yj(e);break}}else{_j(e,s,0,0)}}while(0);t=c[g>>2]|0;if((t&1|0)!=0){_j(e,t,0,0);c[f>>2]=s;return}i=e+164|0;b[e+162>>1]=b[i>>1]|0;l=t&16777215;t=l+1|0;if(t>>>0<(c[q>>2]|0)>>>0){q=c[e+32>>2]|0;u=d[q+l|0]<<8|d[q+t|0]}else{u=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[i>>1]=u;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;c[f>>2]=(c[f>>2]|0)+2;c[f>>2]=s;return}else{Yj(e);c[f>>2]=s;return}}function _j(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;Zj(d,3,8,58080);h=b[d+160>>1]|0;i=d+148|0;j=c[i>>2]|0;k=j-2|0;l=k&16777215;m=l+1|0;n=d+36|0;if(m>>>0<(c[n>>2]|0)>>>0){o=d+32|0;a[(c[o>>2]|0)+l|0]=(h&65535)>>>8;a[(c[o>>2]|0)+m|0]=h}else{pc[c[d+24>>2]&63](c[d+4>>2]|0,l,h)}c[i>>2]=k;k=j-6|0;h=k&16777215;l=h+3|0;if(l>>>0<(c[n>>2]|0)>>>0){m=d+32|0;a[(c[m>>2]|0)+h|0]=e>>>24;a[(c[m>>2]|0)+(h+1)|0]=e>>>16;a[(c[m>>2]|0)+(h+2)|0]=e>>>8;a[(c[m>>2]|0)+l|0]=e}else{pc[c[d+28>>2]&63](c[d+4>>2]|0,h,e)}c[i>>2]=k;k=(g|0)==0?16:0;g=(f|0)==0?k:k|8;k=j-8|0;j=k&16777215;f=j+1|0;if(f>>>0<(c[n>>2]|0)>>>0){n=d+32|0;a[(c[n>>2]|0)+j|0]=0;a[(c[n>>2]|0)+f|0]=g;c[i>>2]=k;p=d+372|0;q=c[p>>2]|0;r=q+64|0;c[p>>2]=r;return}else{pc[c[d+24>>2]&63](c[d+4>>2]|0,j,g);c[i>>2]=k;p=d+372|0;q=c[p>>2]|0;r=q+64|0;c[p>>2]=r;return}}function $j(a){a=a|0;var b=0;b=c[a+76>>2]|0;if((b|0)!=0){nc[b&511](c[a+68>>2]|0,e[a+160>>1]|0)}Zj(a,4,0,57288);b=a+372|0;c[b>>2]=(c[b>>2]|0)+62;return}function ak(a){a=a|0;var b=0;Zj(a,5,0,56096);b=a+372|0;c[b>>2]=(c[b>>2]|0)+66;return}function bk(a){a=a|0;var b=0;Zj(a,6,0,55328);b=a+372|0;c[b>>2]=(c[b>>2]|0)+68;return}function ck(a){a=a|0;var b=0;Zj(a,7,0,54664);b=a+372|0;c[b>>2]=(c[b>>2]|0)+68;return}function dk(a){a=a|0;var b=0;Zj(a,8,0,53976);b=a+372|0;c[b>>2]=(c[b>>2]|0)+62;return}function ek(a){a=a|0;var b=0;Zj(a,10,0,52544);b=a+372|0;c[b>>2]=(c[b>>2]|0)+62;return}function fk(a){a=a|0;var b=0;Zj(a,11,0,51880);b=a+372|0;c[b>>2]=(c[b>>2]|0)+62;return}function gk(a){a=a|0;var b=0;Zj(a,14,0,51352);b=a+372|0;c[b>>2]=(c[b>>2]|0)+62;return}function hk(a,b){a=a|0;b=b|0;Zj(a,b+32|0,0,50520);b=a+372|0;c[b>>2]=(c[b>>2]|0)+62;return}function ik(b,d){b=b|0;d=d|0;var e=0;do{if((d|0)!=0){e=b+335|0;a[e]=a[e]&-2;if((d|0)!=7){break}if((c[b+364>>2]|0)==7){break}a[b+368|0]=1}}while(0);c[b+364>>2]=d;return}function jk(d){d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=d+48|0;if((a[e]|0)!=0){return}a[e]=1;f=d+44|0;g=c[f>>2]|0;if((g|0)!=0){nc[g&511](c[d+40>>2]|0,1)}g=d+166|0;h=d+334|0;i=a[h]|0;do{if((b[g>>1]&8192)==0){j=d+148|0;k=c[j>>2]|0;if(i<<24>>24==0){c[d+168>>2]=k}else{c[d+172>>2]=k}a[h]=1;b[g>>1]=8192;Rz(d+88|0,0,60)|0;c[j>>2]=0;l=j;m=10}else{j=d+148|0;b[g>>1]=8192;Rz(d+88|0,0,60)|0;c[j>>2]=0;if(i<<24>>24!=0){l=j;m=10;break}c[j>>2]=0;c[d+172>>2]=0}}while(0);if((m|0)==10){c[d+168>>2]=0;c[l>>2]=0}a[d+335|0]=0;a[d+336|0]=0;Rz(d+176|0,0,16)|0;Xj(d);if((a[e]|0)==0){return}a[e]=0;e=c[f>>2]|0;if((e|0)==0){return}nc[e&511](c[d+40>>2]|0,0);return}function kk(d){d=d|0;var f=0,g=0,h=0,i=0;f=c[d+152>>2]|0;g=d+196|0;h=(c[g>>2]|0)+1|0;c[g>>2]=h;c[d+200+((h&31)<<2)>>2]=f;a[d+336|0]=0;f=d+166|0;h=d+332|0;b[h>>1]=b[f>>1]|0;g=b[d+162>>1]|0;b[d+160>>1]=g;mc[c[d+400+((g&65535)>>>6<<2)>>2]&1023](d);g=d+392|0;c[g>>2]=(c[g>>2]|0)+1;if((b[h>>1]|0)<0){Zj(d,9,0,53400);h=d+372|0;c[h>>2]=(c[h>>2]|0)+62}h=d+368|0;if((a[h]|0)!=0){Zj(d,31,0,50840);b[f>>1]=b[f>>1]|1792;g=d+372|0;c[g>>2]=(c[g>>2]|0)+62;a[h]=0;return}h=c[d+364>>2]|0;if((h|0)==0){return}if(((e[f>>1]|0)>>>8&7)>>>0>=h>>>0){return}g=c[d+56>>2]|0;do{if((g|0)!=0){i=sc[g&63](c[d+52>>2]|0,h)|0;if(i>>>0>=256>>>0){break}Zj(d,i,0,49568);b[f>>1]=b[f>>1]&-1793&65535|h<<8&1792;i=d+372|0;c[i>>2]=(c[i>>2]|0)+62;return}}while(0);Zj(d,h+24|0,0,50840);b[f>>1]=b[f>>1]&-1793&65535|h<<8&1792;h=d+372|0;c[h>>2]=(c[h>>2]|0)+62;return}function lk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=b+372|0;g=b+396|0;h=b+335|0;j=d;d=c[f>>2]|0;while(1){if(j>>>0<d>>>0){k=j;l=d;break}m=j-d|0;c[g>>2]=(c[g>>2]|0)+d;c[f>>2]=0;if((a[h]|0)!=0){n=7;break}kk(b);o=c[f>>2]|0;if((o|0)==0){n=5;break}else{j=m;d=o}}if((n|0)==5){d=c[q>>2]|0;Xb(d|0,49088,(j=i,i=i+8|0,c[j>>2]=c[b+152>>2],j)|0)|0;i=j;ya(d|0)|0;k=m;l=c[f>>2]|0}else if((n|0)==7){i=e;return}c[g>>2]=(c[g>>2]|0)+k;c[f>>2]=l-k;i=e;return}function mk(f,g){f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=f+156|0;i=c[h>>2]|0;if((i&1|0)!=0){_j(f,i,0,0);return}j=f+164|0;k=f+162|0;b[k>>1]=b[j>>1]|0;l=i&16777215;i=l+1|0;m=f+36|0;if(i>>>0<(c[m>>2]|0)>>>0){n=c[f+32>>2]|0;o=d[n+l|0]<<8|d[n+i|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[j>>1]=o;l=f+336|0;if((a[l]|0)!=0){Yj(f);return}i=(c[h>>2]|0)+2|0;c[h>>2]=i;n=f+152|0;p=(c[n>>2]|0)+2|0;c[n>>2]=p;q=e[k>>1]|0;r=(q&32768|0)!=0?q|-65536:q;if((g|0)!=0){g=f+372|0;c[g>>2]=(c[g>>2]|0)+12;if((i&1|0)!=0){_j(f,i,0,0);return}b[k>>1]=o;o=i&16777215;i=o+1|0;do{if(i>>>0<(c[m>>2]|0)>>>0){g=c[f+32>>2]|0;b[j>>1]=d[g+o|0]<<8|d[g+i|0]}else{g=sc[c[f+12>>2]&63](c[f+4>>2]|0,o)|0;q=(a[l]|0)==0;b[j>>1]=g;if(q){break}Yj(f);return}}while(0);c[h>>2]=(c[h>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;return}o=f+88+((b[f+160>>1]&7)<<2)|0;i=c[o>>2]|0;q=i+65535&65535;c[o>>2]=q|i&-65536;i=f+372|0;o=c[i>>2]|0;if((q|0)==65535){c[i>>2]=o+14;q=c[h>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);return}b[k>>1]=b[j>>1]|0;g=q&16777215;q=g+1|0;if(q>>>0<(c[m>>2]|0)>>>0){s=c[f+32>>2]|0;t=d[s+g|0]<<8|d[s+q|0]}else{t=sc[c[f+12>>2]&63](c[f+4>>2]|0,g)|0}b[j>>1]=t;if((a[l]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;return}else{Yj(f);return}}c[i>>2]=o+10;o=r+p|0;c[h>>2]=o;if((o&1|0)!=0){_j(f,o,0,0);return}b[k>>1]=b[j>>1]|0;p=o&16777215;o=p+1|0;if(o>>>0<(c[m>>2]|0)>>>0){r=c[f+32>>2]|0;u=d[r+p|0]<<8|d[r+o|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[j>>1]=u;if((a[l]|0)!=0){Yj(f);return}p=(c[h>>2]|0)+2|0;c[h>>2]=p;c[n>>2]=(c[n>>2]|0)+2;if((p&1|0)!=0){_j(f,p,0,0);return}b[k>>1]=u;u=p&16777215;p=u+1|0;do{if(p>>>0<(c[m>>2]|0)>>>0){k=c[f+32>>2]|0;b[j>>1]=d[k+u|0]<<8|d[k+p|0]}else{k=sc[c[f+12>>2]&63](c[f+4>>2]|0,u)|0;o=(a[l]|0)==0;b[j>>1]=k;if(o){break}Yj(f);return}}while(0);f=c[h>>2]|0;c[h>>2]=f+2;c[n>>2]=f-2;return}function nk(e,f){e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=e+372|0;c[g>>2]=(c[g>>2]|0)+4;g=b[e+160>>1]&63;if((rc[c[20568+(g<<2)>>2]&127](e,g,509,8)|0)!=0){return}if((_o(e,((f|0)!=0)<<31>>31)|0)!=0){return}f=e+156|0;g=c[f>>2]|0;if((g&1|0)!=0){_j(e,g,0,0);return}h=e+164|0;b[e+162>>1]=b[h>>1]|0;i=g&16777215;g=i+1|0;if(g>>>0<(c[e+36>>2]|0)>>>0){j=c[e+32>>2]|0;k=d[j+i|0]<<8|d[j+g|0]}else{k=sc[c[e+12>>2]&63](c[e+4>>2]|0,i)|0}b[h>>1]=k;if((a[e+336|0]|0)==0){c[f>>2]=(c[f>>2]|0)+2;f=e+152|0;c[f>>2]=(c[f>>2]|0)+2;return}else{Yj(e);return}}function ok(a){a=a|0;var b=0,d=0;b=0;do{d=c[16472+(b<<2)>>2]|0;c[a+400+(b<<2)>>2]=(d|0)==0?386:d;b=b+1|0;}while(b>>>0<1024>>>0);c[a+4496>>2]=386;c[a+4500>>2]=272;c[a+4504>>2]=272;c[a+4508>>2]=272;c[a+4512>>2]=272;c[a+4516>>2]=272;c[a+4520>>2]=272;c[a+4524>>2]=272;return}function pk(a){a=a|0;var b=0;$j(a);b=a+372|0;c[b>>2]=(c[b>>2]|0)+2;return}function qk(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;g=f+160|0;h=b[g>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](f,h,2020,32)|0)!=0){return}if((c[f+340>>2]|0)!=2){$j(f);return}h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;c[f+120+(((e[g>>1]|0)>>>9&7)<<2)>>2]=c[f+344>>2];g=f+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);return}i=f+164|0;b[f+162>>1]=b[i>>1]|0;j=h&16777215;h=j+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){k=c[f+32>>2]|0;l=d[k+j|0]<<8|d[k+h|0]}else{l=sc[c[f+12>>2]&63](c[f+4>>2]|0,j)|0}b[i>>1]=l;if((a[f+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=f+152|0;c[g>>2]=(c[g>>2]|0)+2;return}else{Yj(f);return}}function rk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;m=e+336|0;if((a[m]|0)!=0){Yj(e);i=f;return}j=(c[h>>2]|0)+2|0;c[h>>2]=j;o=e+152|0;c[o>>2]=(c[o>>2]|0)+2;q=b[l>>1]|0;r=b[e+160>>1]&63;if((r|0)==60){s=e+372|0;c[s>>2]=(c[s>>2]|0)+20;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}b[l>>1]=p;p=j&16777215;j=p+1|0;do{if(j>>>0<(c[n>>2]|0)>>>0){s=c[e+32>>2]|0;b[k>>1]=d[s+p|0]<<8|d[s+j|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,p)|0;t=(a[m]|0)==0;b[k>>1]=s;if(t){break}Yj(e);i=f;return}}while(0);c[h>>2]=(c[h>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;p=e+166|0;j=b[p>>1]|0;b[p>>1]=(j|q)&31|j&-256;i=f;return}if((rc[c[20568+(r<<2)>>2]&127](e,r,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}r=a[g]|q&255;q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;qo(e,15,r);q=c[h>>2]|0;if((q&1|0)!=0){_j(e,q,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=q&16777215;q=l+1|0;if(q>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;u=d[n+l|0]<<8|d[n+q|0]}else{u=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=u;if((a[m]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;_o(e,r)|0;i=f;return}else{Yj(e);i=f;return}}function sk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+8|0;g=f|0;h=e+160|0;if((b[h>>1]&63)==60){if((a[e+334|0]|0)==0){dk(e);i=f;return}j=e+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}l=e+164|0;m=e+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=e+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[e+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[e+12>>2]&63](c[e+4>>2]|0,n)|0}b[l>>1]=q;n=e+336|0;if((a[n]|0)!=0){Yj(e);i=f;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=e+152|0;r=(c[p>>2]|0)+2|0;c[p>>2]=r;s=b[m>>1]|0;t=e+372|0;c[t>>2]=(c[t>>2]|0)+20;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}b[m>>1]=q;q=k&16777215;m=q+1|0;do{if(m>>>0<(c[o>>2]|0)>>>0){t=c[e+32>>2]|0;b[l>>1]=d[t+q|0]<<8|d[t+m|0];u=k;v=r}else{t=sc[c[e+12>>2]&63](c[e+4>>2]|0,q)|0;w=(a[n]|0)==0;b[l>>1]=t;if(w){u=c[j>>2]|0;v=c[p>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=u+2;c[p>>2]=v+2;Wj(e,(b[e+166>>1]|s)&-22753);i=f;return}s=e+156|0;v=c[s>>2]|0;if((v&1|0)!=0){_j(e,v,0,0);i=f;return}p=e+164|0;u=e+162|0;b[u>>1]=b[p>>1]|0;j=v&16777215;v=j+1|0;l=e+36|0;if(v>>>0<(c[l>>2]|0)>>>0){n=c[e+32>>2]|0;x=d[n+j|0]<<8|d[n+v|0]}else{x=sc[c[e+12>>2]&63](c[e+4>>2]|0,j)|0}b[p>>1]=x;x=e+336|0;if((a[x]|0)!=0){Yj(e);i=f;return}c[s>>2]=(c[s>>2]|0)+2;j=e+152|0;c[j>>2]=(c[j>>2]|0)+2;v=b[u>>1]|0;n=b[h>>1]&63;if((rc[c[20568+(n<<2)>>2]&127](e,n,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}n=b[g>>1]|v;v=e+372|0;c[v>>2]=(c[v>>2]|0)+8;ro(e,15,n);v=c[s>>2]|0;if((v&1|0)!=0){_j(e,v,0,0);i=f;return}b[u>>1]=b[p>>1]|0;u=v&16777215;v=u+1|0;if(v>>>0<(c[l>>2]|0)>>>0){l=c[e+32>>2]|0;y=d[l+u|0]<<8|d[l+v|0]}else{y=sc[c[e+12>>2]&63](c[e+4>>2]|0,u)|0}b[p>>1]=y;if((a[x]|0)==0){c[s>>2]=(c[s>>2]|0)+2;c[j>>2]=(c[j>>2]|0)+2;$o(e,n)|0;i=f;return}else{Yj(e);i=f;return}}function tk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;r=b[m>>1]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}b[m>>1]=q;q=k&16777215;k=q+1|0;do{if(k>>>0<(c[o>>2]|0)>>>0){s=c[f+32>>2]|0;b[l>>1]=d[s+q|0]<<8|d[s+k|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0;t=(a[n]|0)==0;b[l>>1]=s;if(t){break}Yj(f);i=g;return}}while(0);c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;q=e[m>>1]|(r&65535)<<16;r=b[f+160>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](f,r,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}r=q|c[h>>2];h=f+372|0;c[h>>2]=(c[h>>2]|0)+16;so(f,15,r);h=c[j>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;u=d[o+m|0]<<8|d[o+h|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=u;if((a[n]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;ap(f,r)|0;i=g;return}else{Yj(f);i=g;return}}function uk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=e[j>>1]|0;l=k&56;if((l|0)==0){m=c[f+88+((k&7)<<2)>>2]|0;n=1<<(c[f+88+((k>>>9&7)<<2)>>2]&31);o=f+372|0;c[o>>2]=(c[o>>2]|0)+6;o=f+166|0;p=b[o>>1]|0;b[o>>1]=(n&m|0)==0?p|4:p&-5;p=f+156|0;m=c[p>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}n=f+164|0;b[f+162>>1]=b[n>>1]|0;o=m&16777215;m=o+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+o|0]<<8|d[q+m|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,o)|0}b[n>>1]=r;if((a[f+336|0]|0)==0){c[p>>2]=(c[p>>2]|0)+2;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else if((l|0)==8){l=f+156|0;p=c[l>>2]|0;if((p&1|0)!=0){_j(f,p,0,0);i=g;return}r=f+164|0;n=f+162|0;b[n>>1]=b[r>>1]|0;o=p&16777215;p=o+1|0;m=f+36|0;if(p>>>0<(c[m>>2]|0)>>>0){q=c[f+32>>2]|0;s=d[q+o|0]<<8|d[q+p|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,o)|0}b[r>>1]=s;s=f+336|0;if((a[s]|0)!=0){Yj(f);i=g;return}c[l>>2]=(c[l>>2]|0)+2;o=f+152|0;c[o>>2]=(c[o>>2]|0)+2;p=e[n>>1]|0;q=((p&32768|0)!=0?p|-65536:p)+(c[f+120+((b[j>>1]&7)<<2)>>2]|0)|0;p=q&16777215;t=c[m>>2]|0;if(p>>>0<t>>>0){u=a[(c[f+32>>2]|0)+p|0]|0;v=t}else{t=sc[c[f+8>>2]&63](c[f+4>>2]|0,p)|0;u=t;v=c[m>>2]|0}t=q+2&16777215;if(t>>>0<v>>>0){w=a[(c[f+32>>2]|0)+t|0]|0}else{w=sc[c[f+8>>2]&63](c[f+4>>2]|0,t)|0}t=f+372|0;c[t>>2]=(c[t>>2]|0)+16;t=f+88+(((e[j>>1]|0)>>>9&7)<<2)|0;c[t>>2]=c[t>>2]&-65536|(w&255|(u&255)<<8)&65535;u=c[l>>2]|0;if((u&1|0)!=0){_j(f,u,0,0);i=g;return}b[n>>1]=b[r>>1]|0;n=u&16777215;u=n+1|0;if(u>>>0<(c[m>>2]|0)>>>0){m=c[f+32>>2]|0;x=d[m+n|0]<<8|d[m+u|0]}else{x=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[r>>1]=x;if((a[s]|0)==0){c[l>>2]=(c[l>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else{o=k&63;if((rc[c[20568+(o<<2)>>2]&127](f,o,4092,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}o=1<<(c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]&7);j=f+372|0;c[j>>2]=(c[j>>2]|0)+4;j=f+166|0;k=b[j>>1]|0;b[j>>1]=(o&d[h]|0)==0?k|4:k&-5;k=f+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}o=f+164|0;b[f+162>>1]=b[o>>1]|0;j=h&16777215;h=j+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){l=c[f+32>>2]|0;y=d[l+j|0]<<8|d[l+h|0]}else{y=sc[c[f+12>>2]&63](c[f+4>>2]|0,j)|0}b[o>>1]=y;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}}function vk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=e[j>>1]|0;l=k>>>3&7;if((l|0)==1){m=f+156|0;n=c[m>>2]|0;if((n&1|0)!=0){_j(f,n,0,0);i=g;return}o=f+164|0;p=f+162|0;b[p>>1]=b[o>>1]|0;q=n&16777215;n=q+1|0;r=f+36|0;if(n>>>0<(c[r>>2]|0)>>>0){s=c[f+32>>2]|0;t=d[s+q|0]<<8|d[s+n|0]}else{t=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0}b[o>>1]=t;t=f+336|0;if((a[t]|0)!=0){Yj(f);i=g;return}c[m>>2]=(c[m>>2]|0)+2;q=f+152|0;c[q>>2]=(c[q>>2]|0)+2;n=e[p>>1]|0;s=((n&32768|0)!=0?n|-65536:n)+(c[f+120+((b[j>>1]&7)<<2)>>2]|0)|0;n=s&16777215;u=c[r>>2]|0;if(n>>>0<u>>>0){v=a[(c[f+32>>2]|0)+n|0]|0;w=u}else{u=sc[c[f+8>>2]&63](c[f+4>>2]|0,n)|0;v=u;w=c[r>>2]|0}u=s+2&16777215;if(u>>>0<w>>>0){x=a[(c[f+32>>2]|0)+u|0]|0;y=w}else{w=sc[c[f+8>>2]&63](c[f+4>>2]|0,u)|0;x=w;y=c[r>>2]|0}w=s+4&16777215;if(w>>>0<y>>>0){z=a[(c[f+32>>2]|0)+w|0]|0;A=y}else{y=sc[c[f+8>>2]&63](c[f+4>>2]|0,w)|0;z=y;A=c[r>>2]|0}y=s+6&16777215;if(y>>>0<A>>>0){B=a[(c[f+32>>2]|0)+y|0]|0}else{B=sc[c[f+8>>2]&63](c[f+4>>2]|0,y)|0}y=f+372|0;c[y>>2]=(c[y>>2]|0)+24;c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]=B&255|(z&255|(x&255|(v&255)<<8)<<8)<<8;v=c[m>>2]|0;if((v&1|0)!=0){_j(f,v,0,0);i=g;return}b[p>>1]=b[o>>1]|0;p=v&16777215;v=p+1|0;if(v>>>0<(c[r>>2]|0)>>>0){r=c[f+32>>2]|0;C=d[r+p|0]<<8|d[r+v|0]}else{C=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=C;if((a[t]|0)==0){c[m>>2]=(c[m>>2]|0)+2;c[q>>2]=(c[q>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else if((l|0)==0){l=f+88+((k&7)<<2)|0;q=c[l>>2]|0;m=1<<(c[f+88+((k>>>9&7)<<2)>>2]&31);t=f+372|0;c[t>>2]=(c[t>>2]|0)+8;c[l>>2]=m^q;l=f+166|0;t=b[l>>1]|0;b[l>>1]=(m&q|0)==0?t|4:t&-5;t=f+156|0;q=c[t>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;l=q&16777215;q=l+1|0;if(q>>>0<(c[f+36>>2]|0)>>>0){C=c[f+32>>2]|0;D=d[C+l|0]<<8|d[C+q|0]}else{D=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[m>>1]=D;if((a[f+336|0]|0)==0){c[t>>2]=(c[t>>2]|0)+2;t=f+152|0;c[t>>2]=(c[t>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else{t=k&63;if((rc[c[20568+(t<<2)>>2]&127](f,t,508,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}t=1<<(c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]&7);j=d[h]|0;h=f+372|0;c[h>>2]=(c[h>>2]|0)+8;h=f+166|0;k=b[h>>1]|0;b[h>>1]=(t&j|0)==0?k|4:k&-5;k=f+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}D=f+164|0;b[f+162>>1]=b[D>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){l=c[f+32>>2]|0;E=d[l+m|0]<<8|d[l+h|0]}else{E=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[D>>1]=E;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;_o(f,(j^t)&255)|0;i=g;return}else{Yj(f);i=g;return}}}function wk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=e[j>>1]|0;l=k>>>3&7;if((l|0)==0){m=f+88+((k&7)<<2)|0;n=c[m>>2]|0;o=1<<(c[f+88+((k>>>9&7)<<2)>>2]&31);p=f+372|0;c[p>>2]=(c[p>>2]|0)+10;p=f+166|0;q=b[p>>1]|0;b[p>>1]=(o&n|0)==0?q|4:q&-5;c[m>>2]=n&~o;o=f+156|0;n=c[o>>2]|0;if((n&1|0)!=0){_j(f,n,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;q=n&16777215;n=q+1|0;if(n>>>0<(c[f+36>>2]|0)>>>0){p=c[f+32>>2]|0;r=d[p+q|0]<<8|d[p+n|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0}b[m>>1]=r;if((a[f+336|0]|0)==0){c[o>>2]=(c[o>>2]|0)+2;o=f+152|0;c[o>>2]=(c[o>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else if((l|0)==1){l=f+156|0;o=c[l>>2]|0;if((o&1|0)!=0){_j(f,o,0,0);i=g;return}r=f+164|0;m=f+162|0;b[m>>1]=b[r>>1]|0;q=o&16777215;o=q+1|0;n=f+36|0;if(o>>>0<(c[n>>2]|0)>>>0){p=c[f+32>>2]|0;s=d[p+q|0]<<8|d[p+o|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0}b[r>>1]=s;s=f+336|0;if((a[s]|0)!=0){Yj(f);i=g;return}c[l>>2]=(c[l>>2]|0)+2;q=f+152|0;c[q>>2]=(c[q>>2]|0)+2;o=e[j>>1]|0;p=e[m>>1]|0;t=((p&32768|0)!=0?p|-65536:p)+(c[f+120+((o&7)<<2)>>2]|0)|0;p=c[f+88+((o>>>9&7)<<2)>>2]|0;o=p>>>8&255;u=t&16777215;if(u>>>0<(c[n>>2]|0)>>>0){a[(c[f+32>>2]|0)+u|0]=o}else{pc[c[f+20>>2]&63](c[f+4>>2]|0,u,o)}o=p&255;p=t+2&16777215;if(p>>>0<(c[n>>2]|0)>>>0){a[(c[f+32>>2]|0)+p|0]=o}else{pc[c[f+20>>2]&63](c[f+4>>2]|0,p,o)}o=f+372|0;c[o>>2]=(c[o>>2]|0)+16;o=c[l>>2]|0;if((o&1|0)!=0){_j(f,o,0,0);i=g;return}b[m>>1]=b[r>>1]|0;m=o&16777215;o=m+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[f+32>>2]|0;v=d[n+m|0]<<8|d[n+o|0]}else{v=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[r>>1]=v;if((a[s]|0)==0){c[l>>2]=(c[l>>2]|0)+2;c[q>>2]=(c[q>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else{q=k&63;if((rc[c[20568+(q<<2)>>2]&127](f,q,508,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}q=1<<(c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]&7);j=d[h]|0;h=f+372|0;c[h>>2]=(c[h>>2]|0)+8;h=f+166|0;k=b[h>>1]|0;b[h>>1]=(q&j|0)==0?k|4:k&-5;k=f+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}l=f+164|0;b[f+162>>1]=b[l>>1]|0;s=h&16777215;h=s+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){v=c[f+32>>2]|0;w=d[v+s|0]<<8|d[v+h|0]}else{w=sc[c[f+12>>2]&63](c[f+4>>2]|0,s)|0}b[l>>1]=w;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;_o(f,(q^255)&j&255)|0;i=g;return}else{Yj(f);i=g;return}}}function xk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=e[j>>1]|0;l=k>>>3&7;if((l|0)==1){m=f+156|0;n=c[m>>2]|0;if((n&1|0)!=0){_j(f,n,0,0);i=g;return}o=f+164|0;p=f+162|0;b[p>>1]=b[o>>1]|0;q=n&16777215;n=q+1|0;r=f+36|0;if(n>>>0<(c[r>>2]|0)>>>0){s=c[f+32>>2]|0;t=d[s+q|0]<<8|d[s+n|0]}else{t=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0}b[o>>1]=t;t=f+336|0;if((a[t]|0)!=0){Yj(f);i=g;return}c[m>>2]=(c[m>>2]|0)+2;q=f+152|0;c[q>>2]=(c[q>>2]|0)+2;n=e[j>>1]|0;s=e[p>>1]|0;u=((s&32768|0)!=0?s|-65536:s)+(c[f+120+((n&7)<<2)>>2]|0)|0;s=c[f+88+((n>>>9&7)<<2)>>2]|0;n=s>>>24&255;v=u&16777215;if(v>>>0<(c[r>>2]|0)>>>0){a[(c[f+32>>2]|0)+v|0]=n}else{pc[c[f+20>>2]&63](c[f+4>>2]|0,v,n)}n=s>>>16&255;v=u+2&16777215;if(v>>>0<(c[r>>2]|0)>>>0){a[(c[f+32>>2]|0)+v|0]=n}else{pc[c[f+20>>2]&63](c[f+4>>2]|0,v,n)}n=s>>>8&255;v=u+4&16777215;if(v>>>0<(c[r>>2]|0)>>>0){a[(c[f+32>>2]|0)+v|0]=n}else{pc[c[f+20>>2]&63](c[f+4>>2]|0,v,n)}n=s&255;s=u+6&16777215;if(s>>>0<(c[r>>2]|0)>>>0){a[(c[f+32>>2]|0)+s|0]=n}else{pc[c[f+20>>2]&63](c[f+4>>2]|0,s,n)}n=f+372|0;c[n>>2]=(c[n>>2]|0)+24;n=c[m>>2]|0;if((n&1|0)!=0){_j(f,n,0,0);i=g;return}b[p>>1]=b[o>>1]|0;p=n&16777215;n=p+1|0;if(n>>>0<(c[r>>2]|0)>>>0){r=c[f+32>>2]|0;w=d[r+p|0]<<8|d[r+n|0]}else{w=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=w;if((a[t]|0)==0){c[m>>2]=(c[m>>2]|0)+2;c[q>>2]=(c[q>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else if((l|0)==0){l=f+88+((k&7)<<2)|0;q=c[l>>2]|0;m=1<<(c[f+88+((k>>>9&7)<<2)>>2]&31);t=f+372|0;c[t>>2]=(c[t>>2]|0)+8;t=f+166|0;w=b[t>>1]|0;b[t>>1]=(m&q|0)==0?w|4:w&-5;c[l>>2]=m|q;q=f+156|0;m=c[q>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}l=f+164|0;b[f+162>>1]=b[l>>1]|0;w=m&16777215;m=w+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){t=c[f+32>>2]|0;x=d[t+w|0]<<8|d[t+m|0]}else{x=sc[c[f+12>>2]&63](c[f+4>>2]|0,w)|0}b[l>>1]=x;if((a[f+336|0]|0)==0){c[q>>2]=(c[q>>2]|0)+2;q=f+152|0;c[q>>2]=(c[q>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else{q=k&63;if((rc[c[20568+(q<<2)>>2]&127](f,q,508,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}q=1<<(c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]&7);j=d[h]|0;h=f+372|0;c[h>>2]=(c[h>>2]|0)+8;h=f+166|0;k=b[h>>1]|0;b[h>>1]=(q&j|0)==0?k|4:k&-5;k=f+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}x=f+164|0;b[f+162>>1]=b[x>>1]|0;l=h&16777215;h=l+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){w=c[f+32>>2]|0;y=d[w+l|0]<<8|d[w+h|0]}else{y=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[x>>1]=y;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;_o(f,(j|q)&255)|0;i=g;return}else{Yj(f);i=g;return}}}function yk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;m=e+336|0;if((a[m]|0)!=0){Yj(e);i=f;return}j=(c[h>>2]|0)+2|0;c[h>>2]=j;o=e+152|0;c[o>>2]=(c[o>>2]|0)+2;q=b[l>>1]|0;r=b[e+160>>1]&63;if((r|0)==60){s=e+372|0;c[s>>2]=(c[s>>2]|0)+20;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}b[l>>1]=p;p=j&16777215;j=p+1|0;do{if(j>>>0<(c[n>>2]|0)>>>0){s=c[e+32>>2]|0;b[k>>1]=d[s+p|0]<<8|d[s+j|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,p)|0;t=(a[m]|0)==0;b[k>>1]=s;if(t){break}Yj(e);i=f;return}}while(0);c[h>>2]=(c[h>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;p=e+166|0;b[p>>1]=b[p>>1]&(q&31|-256);i=f;return}if((rc[c[20568+(r<<2)>>2]&127](e,r,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}r=a[g]&(q&255);q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;qo(e,15,r);q=c[h>>2]|0;if((q&1|0)!=0){_j(e,q,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=q&16777215;q=l+1|0;if(q>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;u=d[n+l|0]<<8|d[n+q|0]}else{u=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=u;if((a[m]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;_o(e,r)|0;i=f;return}else{Yj(e);i=f;return}}function zk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+8|0;g=f|0;h=e+160|0;if((b[h>>1]&63)==60){if((a[e+334|0]|0)==0){dk(e);i=f;return}j=e+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}l=e+164|0;m=e+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=e+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[e+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[e+12>>2]&63](c[e+4>>2]|0,n)|0}b[l>>1]=q;n=e+336|0;if((a[n]|0)!=0){Yj(e);i=f;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=e+152|0;r=(c[p>>2]|0)+2|0;c[p>>2]=r;s=b[m>>1]|0;t=e+372|0;c[t>>2]=(c[t>>2]|0)+20;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}b[m>>1]=q;q=k&16777215;m=q+1|0;do{if(m>>>0<(c[o>>2]|0)>>>0){t=c[e+32>>2]|0;b[l>>1]=d[t+q|0]<<8|d[t+m|0];u=k;v=r}else{t=sc[c[e+12>>2]&63](c[e+4>>2]|0,q)|0;w=(a[n]|0)==0;b[l>>1]=t;if(w){u=c[j>>2]|0;v=c[p>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=u+2;c[p>>2]=v+2;Wj(e,b[e+166>>1]&s);i=f;return}s=e+156|0;v=c[s>>2]|0;if((v&1|0)!=0){_j(e,v,0,0);i=f;return}p=e+164|0;u=e+162|0;b[u>>1]=b[p>>1]|0;j=v&16777215;v=j+1|0;l=e+36|0;if(v>>>0<(c[l>>2]|0)>>>0){n=c[e+32>>2]|0;x=d[n+j|0]<<8|d[n+v|0]}else{x=sc[c[e+12>>2]&63](c[e+4>>2]|0,j)|0}b[p>>1]=x;x=e+336|0;if((a[x]|0)!=0){Yj(e);i=f;return}c[s>>2]=(c[s>>2]|0)+2;j=e+152|0;c[j>>2]=(c[j>>2]|0)+2;v=b[u>>1]|0;n=b[h>>1]&63;if((rc[c[20568+(n<<2)>>2]&127](e,n,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}n=b[g>>1]&v;v=e+372|0;c[v>>2]=(c[v>>2]|0)+8;ro(e,15,n);v=c[s>>2]|0;if((v&1|0)!=0){_j(e,v,0,0);i=f;return}b[u>>1]=b[p>>1]|0;u=v&16777215;v=u+1|0;if(v>>>0<(c[l>>2]|0)>>>0){l=c[e+32>>2]|0;y=d[l+u|0]<<8|d[l+v|0]}else{y=sc[c[e+12>>2]&63](c[e+4>>2]|0,u)|0}b[p>>1]=y;if((a[x]|0)==0){c[s>>2]=(c[s>>2]|0)+2;c[j>>2]=(c[j>>2]|0)+2;$o(e,n)|0;i=f;return}else{Yj(e);i=f;return}}function Ak(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;r=b[m>>1]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}b[m>>1]=q;q=k&16777215;k=q+1|0;do{if(k>>>0<(c[o>>2]|0)>>>0){s=c[f+32>>2]|0;b[l>>1]=d[s+q|0]<<8|d[s+k|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0;t=(a[n]|0)==0;b[l>>1]=s;if(t){break}Yj(f);i=g;return}}while(0);c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;q=e[m>>1]|(r&65535)<<16;r=b[f+160>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](f,r,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}r=c[h>>2]&q;q=f+372|0;c[q>>2]=(c[q>>2]|0)+16;so(f,15,r);q=c[j>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=q&16777215;q=m+1|0;if(q>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;u=d[o+m|0]<<8|d[o+q|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=u;if((a[n]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;ap(f,r)|0;i=g;return}else{Yj(f);i=g;return}}function Bk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;p=e+336|0;if((a[p]|0)!=0){Yj(e);i=f;return}c[h>>2]=(c[h>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]&255;o=b[e+160>>1]&63;if((rc[c[20568+(o<<2)>>2]&127](e,o,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}o=a[g]|0;g=o-j&255;q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;Co(e,g,j,o);o=c[h>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=o&16777215;o=l+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;r=d[n+l|0]<<8|d[n+o|0]}else{r=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=r;if((a[p]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;_o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Ck(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;p=e+336|0;if((a[p]|0)!=0){Yj(e);i=f;return}c[h>>2]=(c[h>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]|0;o=b[e+160>>1]&63;if((rc[c[20568+(o<<2)>>2]&127](e,o,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}o=b[g>>1]|0;g=o-j&65535;q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;Do(e,g,j,o);o=c[h>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=o&16777215;o=l+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;r=d[n+l|0]<<8|d[n+o|0]}else{r=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=r;if((a[p]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;$o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Dk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;r=b[m>>1]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}b[m>>1]=q;q=k&16777215;k=q+1|0;do{if(k>>>0<(c[o>>2]|0)>>>0){s=c[f+32>>2]|0;b[l>>1]=d[s+q|0]<<8|d[s+k|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0;t=(a[n]|0)==0;b[l>>1]=s;if(t){break}Yj(f);i=g;return}}while(0);c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;q=e[m>>1]|(r&65535)<<16;r=b[f+160>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](f,r,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}r=c[h>>2]|0;h=r-q|0;k=f+372|0;c[k>>2]=(c[k>>2]|0)+16;Eo(f,h,q,r);r=c[j>>2]|0;if((r&1|0)!=0){_j(f,r,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=r&16777215;r=m+1|0;if(r>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;u=d[o+m|0]<<8|d[o+r|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=u;if((a[n]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;ap(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Ek(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;p=e+336|0;if((a[p]|0)!=0){Yj(e);i=f;return}c[h>>2]=(c[h>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]&255;o=b[e+160>>1]&63;if((rc[c[20568+(o<<2)>>2]&127](e,o,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}o=a[g]|0;g=o+j&255;q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;to(e,g,j,o);o=c[h>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=o&16777215;o=l+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;r=d[n+l|0]<<8|d[n+o|0]}else{r=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=r;if((a[p]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;_o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Fk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;p=e+336|0;if((a[p]|0)!=0){Yj(e);i=f;return}c[h>>2]=(c[h>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]|0;o=b[e+160>>1]&63;if((rc[c[20568+(o<<2)>>2]&127](e,o,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}o=b[g>>1]|0;g=o+j&65535;q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;uo(e,g,j,o);o=c[h>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=o&16777215;o=l+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;r=d[n+l|0]<<8|d[n+o|0]}else{r=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=r;if((a[p]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;$o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Gk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;r=b[m>>1]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}b[m>>1]=q;q=k&16777215;k=q+1|0;do{if(k>>>0<(c[o>>2]|0)>>>0){s=c[f+32>>2]|0;b[l>>1]=d[s+q|0]<<8|d[s+k|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0;t=(a[n]|0)==0;b[l>>1]=s;if(t){break}Yj(f);i=g;return}}while(0);c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;q=e[m>>1]|(r&65535)<<16;r=b[f+160>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](f,r,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}r=c[h>>2]|0;h=r+q|0;k=f+372|0;c[k>>2]=(c[k>>2]|0)+16;vo(f,h,q,r);r=c[j>>2]|0;if((r&1|0)!=0){_j(f,r,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=r&16777215;r=m+1|0;if(r>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;u=d[o+m|0]<<8|d[o+r|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=u;if((a[n]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;ap(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Hk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+8|0;g=f|0;h=e+160|0;j=e+156|0;k=c[j>>2]|0;l=(k&1|0)==0;if((b[h>>1]&56)==0){if(!l){_j(e,k,0,0);i=f;return}m=e+164|0;n=e+162|0;b[n>>1]=b[m>>1]|0;o=k&16777215;p=o+1|0;q=e+36|0;if(p>>>0<(c[q>>2]|0)>>>0){r=c[e+32>>2]|0;s=d[r+o|0]<<8|d[r+p|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,o)|0}b[m>>1]=s;o=e+336|0;if((a[o]|0)!=0){Yj(e);i=f;return}p=(c[j>>2]|0)+2|0;c[j>>2]=p;r=e+152|0;t=(c[r>>2]|0)+2|0;c[r>>2]=t;u=1<<(b[n>>1]&31)&c[e+88+((b[h>>1]&7)<<2)>>2];v=e+372|0;c[v>>2]=(c[v>>2]|0)+10;v=e+166|0;w=b[v>>1]|0;b[v>>1]=(u|0)==0?w|4:w&-5;if((p&1|0)!=0){_j(e,p,0,0);i=f;return}b[n>>1]=s;s=p&16777215;n=s+1|0;do{if(n>>>0<(c[q>>2]|0)>>>0){w=c[e+32>>2]|0;b[m>>1]=d[w+s|0]<<8|d[w+n|0];x=p;y=t}else{w=sc[c[e+12>>2]&63](c[e+4>>2]|0,s)|0;u=(a[o]|0)==0;b[m>>1]=w;if(u){x=c[j>>2]|0;y=c[r>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=x+2;c[r>>2]=y+2;i=f;return}if(!l){_j(e,k,0,0);i=f;return}l=e+164|0;y=e+162|0;b[y>>1]=b[l>>1]|0;r=k&16777215;k=r+1|0;x=e+36|0;if(k>>>0<(c[x>>2]|0)>>>0){m=c[e+32>>2]|0;z=d[m+r|0]<<8|d[m+k|0]}else{z=sc[c[e+12>>2]&63](c[e+4>>2]|0,r)|0}b[l>>1]=z;z=e+336|0;if((a[z]|0)!=0){Yj(e);i=f;return}c[j>>2]=(c[j>>2]|0)+2;r=e+152|0;c[r>>2]=(c[r>>2]|0)+2;k=b[y>>1]|0;m=b[h>>1]&63;if((rc[c[20568+(m<<2)>>2]&127](e,m,2044,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}m=d[g]&1<<(k&7);k=e+372|0;c[k>>2]=(c[k>>2]|0)+8;k=e+166|0;g=b[k>>1]|0;b[k>>1]=(m|0)==0?g|4:g&-5;g=c[j>>2]|0;if((g&1|0)!=0){_j(e,g,0,0);i=f;return}b[y>>1]=b[l>>1]|0;y=g&16777215;g=y+1|0;if(g>>>0<(c[x>>2]|0)>>>0){x=c[e+32>>2]|0;A=d[x+y|0]<<8|d[x+g|0]}else{A=sc[c[e+12>>2]&63](c[e+4>>2]|0,y)|0}b[l>>1]=A;if((a[z]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[r>>2]=(c[r>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function Ik(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;f=i;i=i+8|0;g=f|0;h=e+160|0;j=e+156|0;k=c[j>>2]|0;l=(k&1|0)==0;if((b[h>>1]&56)==0){if(!l){_j(e,k,0,0);i=f;return}m=e+164|0;n=e+162|0;b[n>>1]=b[m>>1]|0;o=k&16777215;p=o+1|0;q=e+36|0;if(p>>>0<(c[q>>2]|0)>>>0){r=c[e+32>>2]|0;s=d[r+o|0]<<8|d[r+p|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,o)|0}b[m>>1]=s;o=e+336|0;if((a[o]|0)!=0){Yj(e);i=f;return}p=(c[j>>2]|0)+2|0;c[j>>2]=p;r=e+152|0;t=(c[r>>2]|0)+2|0;c[r>>2]=t;u=e+88+((b[h>>1]&7)<<2)|0;v=c[u>>2]|0;w=1<<(b[n>>1]&31);x=w^v;y=e+372|0;c[y>>2]=(c[y>>2]|0)+12;y=e+166|0;z=b[y>>1]|0;b[y>>1]=(w&v|0)==0?z|4:z&-5;if((p&1|0)!=0){_j(e,p,0,0);i=f;return}b[n>>1]=s;s=p&16777215;n=s+1|0;do{if(n>>>0<(c[q>>2]|0)>>>0){z=c[e+32>>2]|0;b[m>>1]=d[z+s|0]<<8|d[z+n|0];A=p;B=t}else{z=sc[c[e+12>>2]&63](c[e+4>>2]|0,s)|0;v=(a[o]|0)==0;b[m>>1]=z;if(v){A=c[j>>2]|0;B=c[r>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=A+2;c[r>>2]=B+2;c[u>>2]=x;i=f;return}if(!l){_j(e,k,0,0);i=f;return}l=e+164|0;x=e+162|0;b[x>>1]=b[l>>1]|0;u=k&16777215;k=u+1|0;B=e+36|0;if(k>>>0<(c[B>>2]|0)>>>0){r=c[e+32>>2]|0;C=d[r+u|0]<<8|d[r+k|0]}else{C=sc[c[e+12>>2]&63](c[e+4>>2]|0,u)|0}b[l>>1]=C;C=e+336|0;if((a[C]|0)!=0){Yj(e);i=f;return}c[j>>2]=(c[j>>2]|0)+2;u=e+152|0;c[u>>2]=(c[u>>2]|0)+2;k=b[x>>1]&7;r=b[h>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](e,r,508,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}r=1<<k;k=d[g]|0;g=e+372|0;c[g>>2]=(c[g>>2]|0)+12;g=e+166|0;h=b[g>>1]|0;b[g>>1]=(r&k|0)==0?h|4:h&-5;h=c[j>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}b[x>>1]=b[l>>1]|0;x=h&16777215;h=x+1|0;if(h>>>0<(c[B>>2]|0)>>>0){B=c[e+32>>2]|0;D=d[B+x|0]<<8|d[B+h|0]}else{D=sc[c[e+12>>2]&63](c[e+4>>2]|0,x)|0}b[l>>1]=D;if((a[C]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[u>>2]=(c[u>>2]|0)+2;_o(e,(k^r)&255)|0;i=f;return}else{Yj(e);i=f;return}}function Jk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;f=i;i=i+8|0;g=f|0;h=e+160|0;j=e+156|0;k=c[j>>2]|0;l=(k&1|0)==0;if((b[h>>1]&56)==0){if(!l){_j(e,k,0,0);i=f;return}m=e+164|0;n=e+162|0;b[n>>1]=b[m>>1]|0;o=k&16777215;p=o+1|0;q=e+36|0;if(p>>>0<(c[q>>2]|0)>>>0){r=c[e+32>>2]|0;s=d[r+o|0]<<8|d[r+p|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,o)|0}b[m>>1]=s;o=e+336|0;if((a[o]|0)!=0){Yj(e);i=f;return}p=(c[j>>2]|0)+2|0;c[j>>2]=p;r=e+152|0;t=(c[r>>2]|0)+2|0;c[r>>2]=t;u=e+88+((b[h>>1]&7)<<2)|0;v=c[u>>2]|0;w=1<<(b[n>>1]&31);x=v&~w;y=e+372|0;c[y>>2]=(c[y>>2]|0)+14;y=e+166|0;z=b[y>>1]|0;b[y>>1]=(w&v|0)==0?z|4:z&-5;if((p&1|0)!=0){_j(e,p,0,0);i=f;return}b[n>>1]=s;s=p&16777215;n=s+1|0;do{if(n>>>0<(c[q>>2]|0)>>>0){z=c[e+32>>2]|0;b[m>>1]=d[z+s|0]<<8|d[z+n|0];A=p;B=t}else{z=sc[c[e+12>>2]&63](c[e+4>>2]|0,s)|0;v=(a[o]|0)==0;b[m>>1]=z;if(v){A=c[j>>2]|0;B=c[r>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=A+2;c[r>>2]=B+2;c[u>>2]=x;i=f;return}if(!l){_j(e,k,0,0);i=f;return}l=e+164|0;x=e+162|0;b[x>>1]=b[l>>1]|0;u=k&16777215;k=u+1|0;B=e+36|0;if(k>>>0<(c[B>>2]|0)>>>0){r=c[e+32>>2]|0;C=d[r+u|0]<<8|d[r+k|0]}else{C=sc[c[e+12>>2]&63](c[e+4>>2]|0,u)|0}b[l>>1]=C;C=e+336|0;if((a[C]|0)!=0){Yj(e);i=f;return}c[j>>2]=(c[j>>2]|0)+2;u=e+152|0;c[u>>2]=(c[u>>2]|0)+2;k=b[x>>1]&7;r=b[h>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](e,r,508,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}r=1<<k;k=d[g]|0;g=e+372|0;c[g>>2]=(c[g>>2]|0)+12;g=e+166|0;h=b[g>>1]|0;b[g>>1]=(r&k|0)==0?h|4:h&-5;h=c[j>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}b[x>>1]=b[l>>1]|0;x=h&16777215;h=x+1|0;if(h>>>0<(c[B>>2]|0)>>>0){B=c[e+32>>2]|0;D=d[B+x|0]<<8|d[B+h|0]}else{D=sc[c[e+12>>2]&63](c[e+4>>2]|0,x)|0}b[l>>1]=D;if((a[C]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[u>>2]=(c[u>>2]|0)+2;_o(e,k&(r^255)&255)|0;i=f;return}else{Yj(e);i=f;return}}function Kk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;f=i;i=i+8|0;g=f|0;h=e+160|0;j=e+156|0;k=c[j>>2]|0;l=(k&1|0)==0;if((b[h>>1]&56)==0){if(!l){_j(e,k,0,0);i=f;return}m=e+164|0;n=e+162|0;b[n>>1]=b[m>>1]|0;o=k&16777215;p=o+1|0;q=e+36|0;if(p>>>0<(c[q>>2]|0)>>>0){r=c[e+32>>2]|0;s=d[r+o|0]<<8|d[r+p|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,o)|0}b[m>>1]=s;o=e+336|0;if((a[o]|0)!=0){Yj(e);i=f;return}p=(c[j>>2]|0)+2|0;c[j>>2]=p;r=e+152|0;t=(c[r>>2]|0)+2|0;c[r>>2]=t;u=e+88+((b[h>>1]&7)<<2)|0;v=c[u>>2]|0;w=1<<(b[n>>1]&31);x=w|v;y=e+372|0;c[y>>2]=(c[y>>2]|0)+12;y=e+166|0;z=b[y>>1]|0;b[y>>1]=(w&v|0)==0?z|4:z&-5;if((p&1|0)!=0){_j(e,p,0,0);i=f;return}b[n>>1]=s;s=p&16777215;n=s+1|0;do{if(n>>>0<(c[q>>2]|0)>>>0){z=c[e+32>>2]|0;b[m>>1]=d[z+s|0]<<8|d[z+n|0];A=p;B=t}else{z=sc[c[e+12>>2]&63](c[e+4>>2]|0,s)|0;v=(a[o]|0)==0;b[m>>1]=z;if(v){A=c[j>>2]|0;B=c[r>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=A+2;c[r>>2]=B+2;c[u>>2]=x;i=f;return}if(!l){_j(e,k,0,0);i=f;return}l=e+164|0;x=e+162|0;b[x>>1]=b[l>>1]|0;u=k&16777215;k=u+1|0;B=e+36|0;if(k>>>0<(c[B>>2]|0)>>>0){r=c[e+32>>2]|0;C=d[r+u|0]<<8|d[r+k|0]}else{C=sc[c[e+12>>2]&63](c[e+4>>2]|0,u)|0}b[l>>1]=C;C=e+336|0;if((a[C]|0)!=0){Yj(e);i=f;return}c[j>>2]=(c[j>>2]|0)+2;u=e+152|0;c[u>>2]=(c[u>>2]|0)+2;k=b[x>>1]&7;r=b[h>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](e,r,508,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}r=1<<k;k=d[g]|0;g=e+372|0;c[g>>2]=(c[g>>2]|0)+12;g=e+166|0;h=b[g>>1]|0;b[g>>1]=(r&k|0)==0?h|4:h&-5;h=c[j>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}b[x>>1]=b[l>>1]|0;x=h&16777215;h=x+1|0;if(h>>>0<(c[B>>2]|0)>>>0){B=c[e+32>>2]|0;D=d[B+x|0]<<8|d[B+h|0]}else{D=sc[c[e+12>>2]&63](c[e+4>>2]|0,x)|0}b[l>>1]=D;if((a[C]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[u>>2]=(c[u>>2]|0)+2;_o(e,(k|r)&255)|0;i=f;return}else{Yj(e);i=f;return}}function Lk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;m=e+336|0;if((a[m]|0)!=0){Yj(e);i=f;return}j=(c[h>>2]|0)+2|0;c[h>>2]=j;o=e+152|0;c[o>>2]=(c[o>>2]|0)+2;q=b[l>>1]|0;r=b[e+160>>1]&63;if((r|0)==60){s=e+372|0;c[s>>2]=(c[s>>2]|0)+20;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}b[l>>1]=p;p=j&16777215;j=p+1|0;do{if(j>>>0<(c[n>>2]|0)>>>0){s=c[e+32>>2]|0;b[k>>1]=d[s+p|0]<<8|d[s+j|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,p)|0;t=(a[m]|0)==0;b[k>>1]=s;if(t){break}Yj(e);i=f;return}}while(0);c[h>>2]=(c[h>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;p=e+166|0;j=b[p>>1]|0;b[p>>1]=(j^q)&31|j&-256;i=f;return}if((rc[c[20568+(r<<2)>>2]&127](e,r,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}r=a[g]^q&255;q=e+372|0;c[q>>2]=(c[q>>2]|0)+8;qo(e,15,r);q=c[h>>2]|0;if((q&1|0)!=0){_j(e,q,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=q&16777215;q=l+1|0;if(q>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;u=d[n+l|0]<<8|d[n+q|0]}else{u=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=u;if((a[m]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[o>>2]=(c[o>>2]|0)+2;_o(e,r)|0;i=f;return}else{Yj(e);i=f;return}}function Mk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+8|0;g=f|0;h=e+160|0;if((b[h>>1]&63)==60){if((a[e+334|0]|0)==0){dk(e);i=f;return}j=e+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}l=e+164|0;m=e+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=e+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[e+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[e+12>>2]&63](c[e+4>>2]|0,n)|0}b[l>>1]=q;n=e+336|0;if((a[n]|0)!=0){Yj(e);i=f;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=e+152|0;r=(c[p>>2]|0)+2|0;c[p>>2]=r;s=b[m>>1]|0;t=e+372|0;c[t>>2]=(c[t>>2]|0)+20;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}b[m>>1]=q;q=k&16777215;m=q+1|0;do{if(m>>>0<(c[o>>2]|0)>>>0){t=c[e+32>>2]|0;b[l>>1]=d[t+q|0]<<8|d[t+m|0];u=k;v=r}else{t=sc[c[e+12>>2]&63](c[e+4>>2]|0,q)|0;w=(a[n]|0)==0;b[l>>1]=t;if(w){u=c[j>>2]|0;v=c[p>>2]|0;break}Yj(e);i=f;return}}while(0);c[j>>2]=u+2;c[p>>2]=v+2;Wj(e,(b[e+166>>1]^s)&-22753);i=f;return}s=e+156|0;v=c[s>>2]|0;if((v&1|0)!=0){_j(e,v,0,0);i=f;return}p=e+164|0;u=e+162|0;b[u>>1]=b[p>>1]|0;j=v&16777215;v=j+1|0;l=e+36|0;if(v>>>0<(c[l>>2]|0)>>>0){n=c[e+32>>2]|0;x=d[n+j|0]<<8|d[n+v|0]}else{x=sc[c[e+12>>2]&63](c[e+4>>2]|0,j)|0}b[p>>1]=x;x=e+336|0;if((a[x]|0)!=0){Yj(e);i=f;return}c[s>>2]=(c[s>>2]|0)+2;j=e+152|0;c[j>>2]=(c[j>>2]|0)+2;v=b[u>>1]|0;n=b[h>>1]&63;if((rc[c[20568+(n<<2)>>2]&127](e,n,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}n=b[g>>1]^v;ro(e,15,n);v=e+372|0;c[v>>2]=(c[v>>2]|0)+8;v=c[s>>2]|0;if((v&1|0)!=0){_j(e,v,0,0);i=f;return}b[u>>1]=b[p>>1]|0;u=v&16777215;v=u+1|0;if(v>>>0<(c[l>>2]|0)>>>0){l=c[e+32>>2]|0;y=d[l+u|0]<<8|d[l+v|0]}else{y=sc[c[e+12>>2]&63](c[e+4>>2]|0,u)|0}b[p>>1]=y;if((a[x]|0)==0){c[s>>2]=(c[s>>2]|0)+2;c[j>>2]=(c[j>>2]|0)+2;$o(e,n)|0;i=f;return}else{Yj(e);i=f;return}}function Nk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;r=b[m>>1]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}b[m>>1]=q;q=k&16777215;k=q+1|0;do{if(k>>>0<(c[o>>2]|0)>>>0){s=c[f+32>>2]|0;b[l>>1]=d[s+q|0]<<8|d[s+k|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0;t=(a[n]|0)==0;b[l>>1]=s;if(t){break}Yj(f);i=g;return}}while(0);c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;q=e[m>>1]|(r&65535)<<16;r=b[f+160>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](f,r,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}r=c[h>>2]^q;q=f+372|0;c[q>>2]=(c[q>>2]|0)+12;so(f,15,r);q=c[j>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=q&16777215;q=m+1|0;if(q>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;u=d[o+m|0]<<8|d[o+q|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=u;if((a[n]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;ap(f,r)|0;i=g;return}else{Yj(f);i=g;return}}function Ok(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;p=e+336|0;if((a[p]|0)!=0){Yj(e);i=f;return}c[h>>2]=(c[h>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]&255;o=b[e+160>>1]&63;if((rc[c[20568+(o<<2)>>2]&127](e,o,2045,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}o=e+372|0;c[o>>2]=(c[o>>2]|0)+8;o=a[g]|0;zo(e,o-j&255,j,o);o=c[h>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=o&16777215;o=l+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;q=d[n+l|0]<<8|d[n+o|0]}else{q=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=q;if((a[p]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function Pk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+8|0;g=f|0;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;l=e+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=e+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[e+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[k>>1]=p;p=e+336|0;if((a[p]|0)!=0){Yj(e);i=f;return}c[h>>2]=(c[h>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]|0;o=b[e+160>>1]&63;if((rc[c[20568+(o<<2)>>2]&127](e,o,2045,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}o=e+372|0;c[o>>2]=(c[o>>2]|0)+8;o=b[g>>1]|0;Ao(e,o-j&65535,j,o);o=c[h>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}b[l>>1]=b[k>>1]|0;l=o&16777215;o=l+1|0;if(o>>>0<(c[n>>2]|0)>>>0){n=c[e+32>>2]|0;q=d[n+l|0]<<8|d[n+o|0]}else{q=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=q;if((a[p]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function Qk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}k=(c[j>>2]|0)+2|0;c[j>>2]=k;p=f+152|0;c[p>>2]=(c[p>>2]|0)+2;r=b[m>>1]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}b[m>>1]=q;q=k&16777215;k=q+1|0;do{if(k>>>0<(c[o>>2]|0)>>>0){s=c[f+32>>2]|0;b[l>>1]=d[s+q|0]<<8|d[s+k|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0;t=(a[n]|0)==0;b[l>>1]=s;if(t){break}Yj(f);i=g;return}}while(0);c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;q=e[m>>1]|(r&65535)<<16;r=b[f+160>>1]&63;if((rc[c[20568+(r<<2)>>2]&127](f,r,2045,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}r=f+372|0;c[r>>2]=(c[r>>2]|0)+12;r=c[h>>2]|0;Bo(f,r-q|0,q,r);r=c[j>>2]|0;if((r&1|0)!=0){_j(f,r,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=r&16777215;r=m+1|0;if(r>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;u=d[o+m|0]<<8|d[o+r|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=u;if((a[n]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[p>>2]=(c[p>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Rk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;if((c[f>>2]&2|0)==0){$j(f);j=f+372|0;c[j>>2]=(c[j>>2]|0)+2;i=g;return}j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;q=f+336|0;if((a[q]|0)!=0){Yj(f);i=g;return}c[j>>2]=(c[j>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;k=f+160|0;p=e[m>>1]|0;r=p>>>12;do{if((p&2048|0)==0){s=b[k>>1]&63;if((rc[c[20568+(s<<2)>>2]&127](f,s,508,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}s=r&7;t=a[h]|0;if((r&8|0)==0){u=f+88+(s<<2)|0;c[u>>2]=c[u>>2]&-256|t&255;break}else{u=t&255;c[f+120+(s<<2)>>2]=(u&128|0)!=0?u|-256:u;break}}else{u=r&7;if((r&8|0)==0){v=f+88+(u<<2)|0}else{v=f+120+(u<<2)|0}a[h]=c[v>>2];u=b[k>>1]&63;if((rc[c[20568+(u<<2)>>2]&127](f,u,508,8)|0)!=0){i=g;return}if((_o(f,a[h]|0)|0)==0){break}i=g;return}}while(0);h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;h=c[j>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;w=d[o+m|0]<<8|d[o+h|0]}else{w=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=w;if((a[q]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Sk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;if((c[f>>2]&2|0)==0){$j(f);j=f+372|0;c[j>>2]=(c[j>>2]|0)+2;i=g;return}j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;q=f+336|0;if((a[q]|0)!=0){Yj(f);i=g;return}c[j>>2]=(c[j>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;k=f+160|0;p=e[m>>1]|0;r=p>>>12;do{if((p&2048|0)==0){s=b[k>>1]&63;if((rc[c[20568+(s<<2)>>2]&127](f,s,508,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}s=r&7;t=b[h>>1]|0;if((r&8|0)==0){u=f+88+(s<<2)|0;c[u>>2]=c[u>>2]&-65536|t&65535;break}else{u=t&65535;c[f+120+(s<<2)>>2]=(u&32768|0)==0?u:u|-65536;break}}else{u=r&7;if((r&8|0)==0){v=f+88+(u<<2)|0}else{v=f+120+(u<<2)|0}b[h>>1]=c[v>>2];u=b[k>>1]&63;if((rc[c[20568+(u<<2)>>2]&127](f,u,508,16)|0)!=0){i=g;return}if(($o(f,b[h>>1]|0)|0)==0){break}i=g;return}}while(0);h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;h=c[j>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;w=d[o+m|0]<<8|d[o+h|0]}else{w=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=w;if((a[q]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Tk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+8|0;h=g|0;if((c[f>>2]&2|0)==0){$j(f);j=f+372|0;c[j>>2]=(c[j>>2]|0)+2;i=g;return}j=f+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}l=f+164|0;m=f+162|0;b[m>>1]=b[l>>1]|0;n=k&16777215;k=n+1|0;o=f+36|0;if(k>>>0<(c[o>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+n|0]<<8|d[p+k|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=q;q=f+336|0;if((a[q]|0)!=0){Yj(f);i=g;return}c[j>>2]=(c[j>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;k=f+160|0;p=e[m>>1]|0;r=p>>>12;do{if((p&2048|0)==0){s=b[k>>1]&63;if((rc[c[20568+(s<<2)>>2]&127](f,s,508,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}s=r&7;t=c[h>>2]|0;if((r&8|0)==0){c[f+88+(s<<2)>>2]=t;break}else{c[f+120+(s<<2)>>2]=t;break}}else{t=r&7;if((r&8|0)==0){u=f+88+(t<<2)|0}else{u=f+120+(t<<2)|0}c[h>>2]=c[u>>2];t=b[k>>1]&63;if((rc[c[20568+(t<<2)>>2]&127](f,t,508,32)|0)!=0){i=g;return}if((ap(f,c[h>>2]|0)|0)==0){break}i=g;return}}while(0);h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;h=c[j>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}b[m>>1]=b[l>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[o>>2]|0)>>>0){o=c[f+32>>2]|0;v=d[o+m|0]<<8|d[o+h|0]}else{v=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=v;if((a[q]|0)==0){c[j>>2]=(c[j>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Uk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}k=e[j>>1]|0;j=k>>>3&56|k>>>9&7;if((rc[c[20568+(j<<2)>>2]&127](f,j,509,8)|0)!=0){i=g;return}if((_o(f,a[h]|0)|0)!=0){i=g;return}j=f+372|0;c[j>>2]=(c[j>>2]|0)+4;qo(f,15,a[h]|0);h=f+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[k>>1]=n;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Vk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}k=e[j>>1]|0;j=k>>>3&56|k>>>9&7;if((rc[c[20568+(j<<2)>>2]&127](f,j,509,32)|0)!=0){i=g;return}if((ap(f,c[h>>2]|0)|0)!=0){i=g;return}j=f+372|0;c[j>>2]=(c[j>>2]|0)+4;so(f,15,c[h>>2]|0);h=f+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[k>>1]=n;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Wk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}c[f+120+(((e[j>>1]|0)>>>9&7)<<2)>>2]=c[h>>2];h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;h=f+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[k>>1]=n;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Xk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=e[j>>1]|0;j=k>>>3&56|k>>>9&7;if((rc[c[20568+(j<<2)>>2]&127](f,j,509,16)|0)!=0){i=g;return}if(($o(f,b[h>>1]|0)|0)!=0){i=g;return}j=f+372|0;c[j>>2]=(c[j>>2]|0)+4;ro(f,15,b[h>>1]|0);h=f+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[k>>1]=n;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Yk(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=e[h>>1]|0;c[f+120+(((e[j>>1]|0)>>>9&7)<<2)>>2]=(k&32768|0)!=0?k|-65536:k;k=f+372|0;c[k>>2]=(c[k>>2]|0)+4;k=f+156|0;j=c[k>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[h>>1]=n;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function Zk(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}h=d[g]|0;g=e+166|0;j=b[g>>1]|0;k=-(((j&65535)>>>4&1)+h|0)|0;if((k&255|0)==0){l=j}else{m=j&-5;b[g>>1]=m;l=m}m=e+372|0;c[m>>2]=(c[m>>2]|0)+8;m=k&128;j=(m|0)==0?l&-9:l|8;l=(m&h|0)==0?j&-3:j|2;b[g>>1]=((h|k)&128|0)==0?l&-18:l|17;l=e+156|0;h=c[l>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}g=e+164|0;b[e+162>>1]=b[g>>1]|0;j=h&16777215;h=j+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+j|0]<<8|d[m+h|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,j)|0}b[g>>1]=n;if((a[e+336|0]|0)==0){c[l>>2]=(c[l>>2]|0)+2;l=e+152|0;c[l>>2]=(c[l>>2]|0)+2;_o(e,k&255)|0;i=f;return}else{Yj(e);i=f;return}}function _k(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;j=b[f+160>>1]&63;if((rc[c[20568+(j<<2)>>2]&127](f,j,509,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}j=e[h>>1]|0;h=f+166|0;k=b[h>>1]|0;l=-(((k&65535)>>>4&1)+j|0)|0;if((l&65535|0)==0){m=k}else{n=k&-5;b[h>>1]=n;m=n}n=f+372|0;c[n>>2]=(c[n>>2]|0)+8;n=l&32768;k=(n|0)==0?m&-9:m|8;m=(n&j|0)==0?k&-3:k|2;b[h>>1]=((j|l)&32768|0)==0?m&-18:m|17;m=f+156|0;j=c[m>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;k=j&16777215;j=k+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;o=d[n+k|0]<<8|d[n+j|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0}b[h>>1]=o;if((a[f+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;m=f+152|0;c[m>>2]=(c[m>>2]|0)+2;$o(f,l&65535)|0;i=g;return}else{Yj(f);i=g;return}}function $k(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,32)|0)!=0){i=f;return}if((Zo(e,g)|0)!=0){i=f;return}h=c[g>>2]|0;g=-h|0;j=e+166|0;k=b[j>>1]|0;l=(k&65535)>>>4&1;m=g-l|0;if((l|0)==(g|0)){n=k}else{g=k&-5;b[j>>1]=g;n=g}g=e+372|0;c[g>>2]=(c[g>>2]|0)+10;g=(m|0)<0?n|8:n&-9;n=(h&m|0)<0?g|2:g&-3;b[j>>1]=(h|m|0)<0?n|17:n&-18;n=e+156|0;h=c[n>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;g=h&16777215;h=g+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){k=c[e+32>>2]|0;o=d[k+g|0]<<8|d[k+h|0]}else{o=sc[c[e+12>>2]&63](c[e+4>>2]|0,g)|0}b[j>>1]=o;if((a[e+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=e+152|0;c[n>>2]=(c[n>>2]|0)+2;ap(e,m)|0;i=f;return}else{Yj(e);i=f;return}}function al(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;do{if((c[e>>2]&2|0)!=0){if((a[e+334|0]|0)!=0){break}dk(e);i=f;return}}while(0);h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}b[g>>1]=b[e+166>>1]&-22753;h=e+372|0;c[h>>2]=(c[h>>2]|0)+4;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;b[e+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=n;if((a[e+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=e+152|0;c[h>>2]=(c[h>>2]|0)+2;$o(e,b[g>>1]|0)|0;i=f;return}else{Yj(e);i=f;return}}function bl(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]|0;do{if((k&32768|0)==0){j=e[h>>1]|0;if((j&32768|0)!=0|(k&65535)>>>0>j>>>0){j=f+166|0;b[j>>1]=b[j>>1]&-9;j=f+372|0;c[j>>2]=(c[j>>2]|0)+14;break}j=f+372|0;c[j>>2]=(c[j>>2]|0)+14;j=f+156|0;l=c[j>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}else{j=f+166|0;b[j>>1]=b[j>>1]|8;j=f+372|0;c[j>>2]=(c[j>>2]|0)+14}}while(0);bk(f);i=g;return}function cl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=b[e+160>>1]&63;if((rc[c[20568+(g<<2)>>2]&127](e,g,509,8)|0)!=0){i=f;return}if((Xo(e,f|0)|0)!=0){i=f;return}g=e+372|0;c[g>>2]=(c[g>>2]|0)+4;g=e+166|0;b[g>>1]=b[g>>1]&-16|4;g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;_o(e,0)|0;i=f;return}else{Yj(e);i=f;return}}function dl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=b[e+160>>1]&63;if((rc[c[20568+(g<<2)>>2]&127](e,g,509,16)|0)!=0){i=f;return}if((Yo(e,f|0)|0)!=0){i=f;return}g=e+372|0;c[g>>2]=(c[g>>2]|0)+4;g=e+166|0;b[g>>1]=b[g>>1]&-16|4;g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;$o(e,0)|0;i=f;return}else{Yj(e);i=f;return}}function el(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=b[e+160>>1]&63;if((rc[c[20568+(g<<2)>>2]&127](e,g,509,32)|0)!=0){i=f;return}if((Zo(e,f|0)|0)!=0){i=f;return}g=e+372|0;c[g>>2]=(c[g>>2]|0)+6;g=e+166|0;b[g>>1]=b[g>>1]&-16|4;g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;ap(e,0)|0;i=f;return}else{Yj(e);i=f;return}}function fl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;if((c[e>>2]&2|0)==0){$j(e);h=e+372|0;c[h>>2]=(c[h>>2]|0)+2;i=f;return}h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}b[g>>1]=b[e+166>>1]&31;h=e+372|0;c[h>>2]=(c[h>>2]|0)+4;h=e+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;b[e+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=n;if((a[e+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=e+152|0;c[h>>2]=(c[h>>2]|0)+2;$o(e,b[g>>1]|0)|0;i=f;return}else{Yj(e);i=f;return}}function gl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}h=d[g]|0;g=-h|0;j=e+372|0;c[j>>2]=(c[j>>2]|0)+4;j=g&128;k=e+166|0;l=b[k>>1]|0;m=(j|0)==0?l&-9:l|8;l=(j&h|0)==0?m&-3:m|2;m=(g&255|0)==0?l|4:l&-5;b[k>>1]=((h|g)&128|0)==0?m&-18:m|17;m=e+156|0;h=c[m>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}k=e+164|0;b[e+162>>1]=b[k>>1]|0;l=h&16777215;h=l+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){j=c[e+32>>2]|0;n=d[j+l|0]<<8|d[j+h|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=n;if((a[e+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;_o(e,g&255)|0;i=f;return}else{Yj(e);i=f;return}}function hl(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;j=b[f+160>>1]&63;if((rc[c[20568+(j<<2)>>2]&127](f,j,509,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}j=e[h>>1]|0;h=-j|0;k=f+372|0;c[k>>2]=(c[k>>2]|0)+4;k=h&32768;l=f+166|0;m=b[l>>1]|0;n=(k|0)==0?m&-9:m|8;m=(k&j|0)==0?n&-3:n|2;n=(h&65535|0)==0?m|4:m&-5;b[l>>1]=((j|h)&32768|0)==0?n&-18:n|17;n=f+156|0;j=c[n>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}l=f+164|0;b[f+162>>1]=b[l>>1]|0;m=j&16777215;j=m+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){k=c[f+32>>2]|0;o=d[k+m|0]<<8|d[k+j|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=o;if((a[f+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;$o(f,h&65535)|0;i=g;return}else{Yj(f);i=g;return}}function il(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,32)|0)!=0){i=f;return}if((Zo(e,g)|0)!=0){i=f;return}h=c[g>>2]|0;g=-h|0;j=e+372|0;c[j>>2]=(c[j>>2]|0)+6;j=e+166|0;k=b[j>>1]|0;l=(g|0)<0?k|8:k&-9;k=(h&g|0)<0?l|2:l&-3;l=(h|0)==0?k|4:k&-5;b[j>>1]=(h|g|0)<0?l|17:l&-18;l=e+156|0;h=c[l>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+k|0]<<8|d[m+h|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=n;if((a[e+336|0]|0)==0){c[l>>2]=(c[l>>2]|0)+2;l=e+152|0;c[l>>2]=(c[l>>2]|0)+2;ap(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function jl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,4093,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}h=e+372|0;c[h>>2]=(c[h>>2]|0)+12;h=e+166|0;b[h>>1]=b[h>>1]&-256|b[g>>1]&31;g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function kl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}h=~a[g];g=e+372|0;c[g>>2]=(c[g>>2]|0)+4;qo(e,15,h);g=e+156|0;j=c[g>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;b[e+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=n;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;_o(e,h)|0;i=f;return}else{Yj(e);i=f;return}}function ll(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}h=~b[g>>1];g=e+372|0;c[g>>2]=(c[g>>2]|0)+4;ro(e,15,h);g=e+156|0;j=c[g>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;b[e+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=n;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;$o(e,h)|0;i=f;return}else{Yj(e);i=f;return}}function ml(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,32)|0)!=0){i=f;return}if((Zo(e,g)|0)!=0){i=f;return}h=~c[g>>2];g=e+372|0;c[g>>2]=(c[g>>2]|0)+6;so(e,15,h);g=e+156|0;j=c[g>>2]|0;if((j&1|0)!=0){_j(e,j,0,0);i=f;return}k=e+164|0;b[e+162>>1]=b[k>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[k>>1]=n;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;ap(e,h)|0;i=f;return}else{Yj(e);i=f;return}}function nl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;if((a[e+334|0]|0)==0){dk(e);i=f;return}h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,4093,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}h=e+372|0;c[h>>2]=(c[h>>2]|0)+12;Wj(e,b[g>>1]&-22753);g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function ol(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}h=e+166|0;j=b[h>>1]|0;k=((j&65535)>>>4&1)+(d[g]|0)&65535;g=-k&65535;l=(g&15)==0?g:-6-k&65535;k=(l&240)==0?l:l-96&65535;l=k&65535;g=(l&65280|0)==0?j&-18:j|17;b[h>>1]=(l&255|0)==0?g:g&-5;g=e+372|0;c[g>>2]=(c[g>>2]|0)+6;g=e+156|0;l=c[g>>2]|0;if((l&1|0)!=0){_j(e,l,0,0);i=f;return}h=e+164|0;b[e+162>>1]=b[h>>1]|0;j=l&16777215;l=j+1|0;if(l>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+j|0]<<8|d[m+l|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,j)|0}b[h>>1]=n;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;_o(e,k&255)|0;i=f;return}else{Yj(e);i=f;return}}function pl(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=e[f+160>>1]|0;if((g&56|0)==0){h=f+88+((g&7)<<2)|0;i=c[h>>2]|0;j=i<<16|i>>>16;i=f+372|0;c[i>>2]=(c[i>>2]|0)+4;so(f,15,j);c[h>>2]=j;j=f+156|0;h=c[j>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);return}i=f+164|0;b[f+162>>1]=b[i>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){l=c[f+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0}b[i>>1]=m;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;return}else{Yj(f);return}}j=g&63;if((rc[c[20568+(j<<2)>>2]&127](f,j,2020,32)|0)!=0){return}if((c[f+340>>2]|0)!=2){$j(f);return}j=f+372|0;c[j>>2]=(c[j>>2]|0)+12;j=c[f+344>>2]|0;g=f+148|0;m=(c[g>>2]|0)-4|0;i=m&16777215;k=i+3|0;h=f+36|0;if(k>>>0<(c[h>>2]|0)>>>0){l=f+32|0;a[(c[l>>2]|0)+i|0]=j>>>24;a[(c[l>>2]|0)+(i+1)|0]=j>>>16;a[(c[l>>2]|0)+(i+2)|0]=j>>>8;a[(c[l>>2]|0)+k|0]=j}else{pc[c[f+28>>2]&63](c[f+4>>2]|0,i,j)}c[g>>2]=m;m=f+156|0;g=c[m>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}j=f+164|0;b[f+162>>1]=b[j>>1]|0;i=g&16777215;g=i+1|0;if(g>>>0<(c[h>>2]|0)>>>0){h=c[f+32>>2]|0;n=d[h+i|0]<<8|d[h+g|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,i)|0}b[j>>1]=n;if((a[f+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;m=f+152|0;c[m>>2]=(c[m>>2]|0)+2;return}else{Yj(f);return}}function ql(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=f+160|0;h=e[g>>1]|0;i=h>>>3&7;if((i|0)==0){j=f+88+((h&7)<<2)|0;h=c[j>>2]|0;k=(h&128|0)!=0?h|65280:h&255;h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;ro(f,15,k&65535);c[j>>2]=c[j>>2]&-65536|k&65535;k=f+156|0;j=c[k>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[h>>1]=n;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;return}else{Yj(f);return}}else if((i|0)==4){i=f+156|0;k=c[i>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);return}n=f+164|0;h=f+162|0;b[h>>1]=b[n>>1]|0;l=k&16777215;k=l+1|0;j=f+36|0;if(k>>>0<(c[j>>2]|0)>>>0){m=c[f+32>>2]|0;o=d[m+l|0]<<8|d[m+k|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[n>>1]=o;o=f+336|0;if((a[o]|0)!=0){Yj(f);return}c[i>>2]=(c[i>>2]|0)+2;l=f+152|0;c[l>>2]=(c[l>>2]|0)+2;k=b[h>>1]|0;m=c[f+120+((b[g>>1]&7)<<2)>>2]|0;do{if(k<<16>>16==0){p=0}else{if((c[f>>2]&1|0)!=0){p=k;break}if((m&1|0)==0){p=k;break}_j(f,m,1,1);return}}while(0);k=f+32|0;q=f+372|0;r=f+24|0;s=f+4|0;t=0;u=p;p=m;while(1){if((u&1)==0){v=p}else{m=p-2|0;if(t>>>0<8>>>0){w=f+120+((7-t&7)<<2)|0}else{w=f+88+((15-t&7)<<2)|0}x=c[w>>2]|0;y=x&65535;z=m&16777215;A=z+1|0;if(A>>>0<(c[j>>2]|0)>>>0){a[(c[k>>2]|0)+z|0]=(y&65535)>>>8;a[(c[k>>2]|0)+A|0]=x}else{pc[c[r>>2]&63](c[s>>2]|0,z,y)}c[q>>2]=(c[q>>2]|0)+4;v=m}m=t+1|0;if(m>>>0<16>>>0){t=m;u=(u&65535)>>>1;p=v}else{break}}c[f+120+((b[g>>1]&7)<<2)>>2]=v;c[q>>2]=(c[q>>2]|0)+8;q=c[i>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);return}b[h>>1]=b[n>>1]|0;h=q&16777215;q=h+1|0;if(q>>>0<(c[j>>2]|0)>>>0){j=c[k>>2]|0;B=d[j+h|0]<<8|d[j+q|0]}else{B=sc[c[f+12>>2]&63](c[s>>2]|0,h)|0}b[n>>1]=B;if((a[o]|0)==0){c[i>>2]=(c[i>>2]|0)+2;c[l>>2]=(c[l>>2]|0)+2;return}else{Yj(f);return}}else{l=f+156|0;i=c[l>>2]|0;if((i&1|0)!=0){_j(f,i,0,0);return}o=f+164|0;B=f+162|0;b[B>>1]=b[o>>1]|0;n=i&16777215;i=n+1|0;h=f+36|0;if(i>>>0<(c[h>>2]|0)>>>0){s=c[f+32>>2]|0;C=d[s+n|0]<<8|d[s+i|0]}else{C=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[o>>1]=C;C=f+336|0;if((a[C]|0)!=0){Yj(f);return}c[l>>2]=(c[l>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;i=b[B>>1]|0;s=b[g>>1]&63;if((rc[c[20568+(s<<2)>>2]&127](f,s,484,16)|0)!=0){return}if((c[f+340>>2]|0)!=2){$j(f);return}s=c[f+344>>2]|0;do{if(i<<16>>16==0){D=0}else{if((c[f>>2]&1|0)!=0){D=i;break}if((s&1|0)==0){D=i;break}_j(f,s,1,1);return}}while(0);i=f+32|0;g=f+372|0;q=f+24|0;j=f+4|0;k=0;v=D;D=s;while(1){if((v&1)==0){E=D}else{s=k&7;if(k>>>0<8>>>0){F=f+88+(s<<2)|0}else{F=f+120+(s<<2)|0}s=c[F>>2]|0;p=s&65535;u=D&16777215;t=u+1|0;if(t>>>0<(c[h>>2]|0)>>>0){a[(c[i>>2]|0)+u|0]=(p&65535)>>>8;a[(c[i>>2]|0)+t|0]=s}else{pc[c[q>>2]&63](c[j>>2]|0,u,p)}c[g>>2]=(c[g>>2]|0)+4;E=D+2|0}p=k+1|0;if(p>>>0<16>>>0){k=p;v=(v&65535)>>>1;D=E}else{break}}c[g>>2]=(c[g>>2]|0)+8;g=c[l>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}b[B>>1]=b[o>>1]|0;B=g&16777215;g=B+1|0;if(g>>>0<(c[h>>2]|0)>>>0){h=c[i>>2]|0;G=d[h+B|0]<<8|d[h+g|0]}else{G=sc[c[f+12>>2]&63](c[j>>2]|0,B)|0}b[o>>1]=G;if((a[C]|0)==0){c[l>>2]=(c[l>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;return}else{Yj(f);return}}}function rl(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=f+160|0;h=e[g>>1]|0;i=h>>>3&7;if((i|0)==0){j=f+88+((h&7)<<2)|0;h=c[j>>2]|0;k=(h&32768|0)!=0?h|-65536:h&65535;h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;so(f,15,k);c[j>>2]=k;k=f+156|0;j=c[k>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[h>>1]=n;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;return}else{Yj(f);return}}else if((i|0)==4){i=f+156|0;k=c[i>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);return}n=f+164|0;h=f+162|0;b[h>>1]=b[n>>1]|0;l=k&16777215;k=l+1|0;j=f+36|0;if(k>>>0<(c[j>>2]|0)>>>0){m=c[f+32>>2]|0;o=d[m+l|0]<<8|d[m+k|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[n>>1]=o;o=f+336|0;if((a[o]|0)!=0){Yj(f);return}c[i>>2]=(c[i>>2]|0)+2;l=f+152|0;c[l>>2]=(c[l>>2]|0)+2;k=b[h>>1]|0;m=c[f+120+((b[g>>1]&7)<<2)>>2]|0;do{if(k<<16>>16==0){p=0}else{if((c[f>>2]&1|0)!=0){p=k;break}if((m&1|0)==0){p=k;break}_j(f,m,1,1);return}}while(0);k=f+32|0;q=f+372|0;r=f+28|0;s=f+4|0;t=0;u=p;p=m;while(1){if((u&1)==0){v=p}else{m=p-4|0;if(t>>>0<8>>>0){w=f+120+((7-t&7)<<2)|0}else{w=f+88+((15-t&7)<<2)|0}x=c[w>>2]|0;y=m&16777215;z=y+3|0;if(z>>>0<(c[j>>2]|0)>>>0){a[(c[k>>2]|0)+y|0]=x>>>24;a[(c[k>>2]|0)+(y+1)|0]=x>>>16;a[(c[k>>2]|0)+(y+2)|0]=x>>>8;a[(c[k>>2]|0)+z|0]=x}else{pc[c[r>>2]&63](c[s>>2]|0,y,x)}c[q>>2]=(c[q>>2]|0)+8;v=m}m=t+1|0;if(m>>>0<16>>>0){t=m;u=(u&65535)>>>1;p=v}else{break}}c[f+120+((b[g>>1]&7)<<2)>>2]=v;c[q>>2]=(c[q>>2]|0)+8;q=c[i>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);return}b[h>>1]=b[n>>1]|0;h=q&16777215;q=h+1|0;if(q>>>0<(c[j>>2]|0)>>>0){j=c[k>>2]|0;A=d[j+h|0]<<8|d[j+q|0]}else{A=sc[c[f+12>>2]&63](c[s>>2]|0,h)|0}b[n>>1]=A;if((a[o]|0)==0){c[i>>2]=(c[i>>2]|0)+2;c[l>>2]=(c[l>>2]|0)+2;return}else{Yj(f);return}}else{l=f+156|0;i=c[l>>2]|0;if((i&1|0)!=0){_j(f,i,0,0);return}o=f+164|0;A=f+162|0;b[A>>1]=b[o>>1]|0;n=i&16777215;i=n+1|0;h=f+36|0;if(i>>>0<(c[h>>2]|0)>>>0){s=c[f+32>>2]|0;B=d[s+n|0]<<8|d[s+i|0]}else{B=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[o>>1]=B;B=f+336|0;if((a[B]|0)!=0){Yj(f);return}c[l>>2]=(c[l>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;i=b[A>>1]|0;s=b[g>>1]&63;if((rc[c[20568+(s<<2)>>2]&127](f,s,484,32)|0)!=0){return}if((c[f+340>>2]|0)!=2){$j(f);return}s=c[f+344>>2]|0;do{if(i<<16>>16==0){C=0}else{if((c[f>>2]&1|0)!=0){C=i;break}if((s&1|0)==0){C=i;break}_j(f,s,1,1);return}}while(0);i=f+32|0;g=f+372|0;q=f+28|0;j=f+4|0;k=0;v=C;C=s;while(1){if((v&1)==0){D=C}else{s=k&7;if(k>>>0<8>>>0){E=f+88+(s<<2)|0}else{E=f+120+(s<<2)|0}s=c[E>>2]|0;p=C&16777215;u=p+3|0;if(u>>>0<(c[h>>2]|0)>>>0){a[(c[i>>2]|0)+p|0]=s>>>24;a[(c[i>>2]|0)+(p+1)|0]=s>>>16;a[(c[i>>2]|0)+(p+2)|0]=s>>>8;a[(c[i>>2]|0)+u|0]=s}else{pc[c[q>>2]&63](c[j>>2]|0,p,s)}c[g>>2]=(c[g>>2]|0)+8;D=C+4|0}s=k+1|0;if(s>>>0<16>>>0){k=s;v=(v&65535)>>>1;C=D}else{break}}c[g>>2]=(c[g>>2]|0)+8;g=c[l>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}b[A>>1]=b[o>>1]|0;A=g&16777215;g=A+1|0;if(g>>>0<(c[h>>2]|0)>>>0){h=c[i>>2]|0;F=d[h+A|0]<<8|d[h+g|0]}else{F=sc[c[f+12>>2]&63](c[j>>2]|0,A)|0}b[o>>1]=F;if((a[B]|0)==0){c[l>>2]=(c[l>>2]|0)+2;c[n>>2]=(c[n>>2]|0)+2;return}else{Yj(f);return}}}function sl(a){a=a|0;mc[c[a+4496+(((b[a+160>>1]&65535)>>>3&7)<<2)>>2]&1023](a);return}function tl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}h=e+372|0;c[h>>2]=(c[h>>2]|0)+8;qo(e,15,a[g]|0);g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function ul(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}h=e+372|0;c[h>>2]=(c[h>>2]|0)+8;ro(e,15,b[g>>1]|0);g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function vl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,32)|0)!=0){i=f;return}if((Zo(e,g)|0)!=0){i=f;return}h=e+372|0;c[h>>2]=(c[h>>2]|0)+8;so(e,15,c[g>>2]|0);g=e+156|0;h=c[g>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;m=d[l+k|0]<<8|d[l+h|0]}else{m=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=m;if((a[e+336|0]|0)==0){c[g>>2]=(c[g>>2]|0)+2;g=e+152|0;c[g>>2]=(c[g>>2]|0)+2;i=f;return}else{Yj(e);i=f;return}}function wl(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;j=b[f+160>>1]|0;if(j<<16>>16!=19196){k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,509,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}k=a[h]|0;h=f+372|0;c[h>>2]=(c[h>>2]|0)+8;qo(f,15,k);h=f+156|0;j=c[h>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}l=f+164|0;b[f+162>>1]=b[l>>1]|0;m=j&16777215;j=m+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;o=d[n+m|0]<<8|d[n+j|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[l>>1]=o;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;_o(f,k|-128)|0;i=g;return}else{Yj(f);i=g;return}}k=c[f+64>>2]|0;do{if((k|0)!=0){h=f+152|0;o=c[h>>2]|0;l=f+164|0;if((sc[k&63](c[f+60>>2]|0,e[l>>1]|0)|0)!=0){break}if((c[h>>2]|0)==(o|0)){o=f+156|0;m=c[o>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}j=f+162|0;b[j>>1]=b[l>>1]|0;n=m&16777215;m=n+1|0;p=f+36|0;if(m>>>0<(c[p>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+n|0]<<8|d[q+m|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[l>>1]=r;n=f+336|0;if((a[n]|0)!=0){Yj(f);i=g;return}m=(c[o>>2]|0)+2|0;c[o>>2]=m;q=(c[h>>2]|0)+2|0;c[h>>2]=q;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}b[j>>1]=r;j=m&16777215;s=j+1|0;do{if(s>>>0<(c[p>>2]|0)>>>0){t=c[f+32>>2]|0;b[l>>1]=d[t+j|0]<<8|d[t+s|0];u=m;v=q}else{t=sc[c[f+12>>2]&63](c[f+4>>2]|0,j)|0;w=(a[n]|0)==0;b[l>>1]=t;if(w){u=c[o>>2]|0;v=c[h>>2]|0;break}Yj(f);i=g;return}}while(0);c[o>>2]=u+2;c[h>>2]=v+2}l=f+372|0;c[l>>2]=(c[l>>2]|0)+8;i=g;return}}while(0);$j(f);i=g;return}function xl(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=f+160|0;h=(e[g>>1]|0)>>>3&7;if((h|0)==3){i=f+156|0;j=c[i>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);return}k=f+164|0;l=f+162|0;b[l>>1]=b[k>>1]|0;m=j&16777215;j=m+1|0;n=f+36|0;if(j>>>0<(c[n>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+m|0]<<8|d[o+j|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[k>>1]=p;p=f+336|0;if((a[p]|0)!=0){Yj(f);return}c[i>>2]=(c[i>>2]|0)+2;m=f+152|0;c[m>>2]=(c[m>>2]|0)+2;j=b[l>>1]|0;o=c[f+120+((b[g>>1]&7)<<2)>>2]|0;do{if(j<<16>>16==0){q=0}else{if((c[f>>2]&1|0)!=0){q=j;break}if((o&1|0)==0){q=j;break}_j(f,o,1,0);return}}while(0);j=f+32|0;r=f+372|0;s=f+12|0;t=f+4|0;u=0;v=q;q=o;while(1){if((v&1)==0){w=q}else{o=q&16777215;x=o+1|0;if(x>>>0<(c[n>>2]|0)>>>0){y=c[j>>2]|0;z=d[y+o|0]<<8|d[y+x|0]}else{z=sc[c[s>>2]&63](c[t>>2]|0,o)|0}o=z&65535;x=(o&32768|0)!=0?o|-65536:o;o=u&7;if(u>>>0<8>>>0){c[f+88+(o<<2)>>2]=x}else{c[f+120+(o<<2)>>2]=x}c[r>>2]=(c[r>>2]|0)+4;w=q+2|0}x=u+1|0;if(x>>>0<16>>>0){u=x;v=(v&65535)>>>1;q=w}else{break}}c[f+120+((b[g>>1]&7)<<2)>>2]=w;c[r>>2]=(c[r>>2]|0)+12;r=c[i>>2]|0;if((r&1|0)!=0){_j(f,r,0,0);return}b[l>>1]=b[k>>1]|0;l=r&16777215;r=l+1|0;if(r>>>0<(c[n>>2]|0)>>>0){n=c[j>>2]|0;A=d[n+l|0]<<8|d[n+r|0]}else{A=sc[c[s>>2]&63](c[t>>2]|0,l)|0}b[k>>1]=A;if((a[p]|0)==0){c[i>>2]=(c[i>>2]|0)+2;c[m>>2]=(c[m>>2]|0)+2;return}else{Yj(f);return}}else if((h|0)==0){$j(f);h=f+372|0;c[h>>2]=(c[h>>2]|0)+2;return}else{h=f+156|0;m=c[h>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);return}i=f+164|0;p=f+162|0;b[p>>1]=b[i>>1]|0;A=m&16777215;m=A+1|0;k=f+36|0;if(m>>>0<(c[k>>2]|0)>>>0){l=c[f+32>>2]|0;B=d[l+A|0]<<8|d[l+m|0]}else{B=sc[c[f+12>>2]&63](c[f+4>>2]|0,A)|0}b[i>>1]=B;B=f+336|0;if((a[B]|0)!=0){Yj(f);return}c[h>>2]=(c[h>>2]|0)+2;A=f+152|0;c[A>>2]=(c[A>>2]|0)+2;m=b[p>>1]|0;l=b[g>>1]&63;if((rc[c[20568+(l<<2)>>2]&127](f,l,2028,16)|0)!=0){return}if((c[f+340>>2]|0)!=2){$j(f);return}l=c[f+344>>2]|0;do{if(m<<16>>16==0){C=0}else{if((c[f>>2]&1|0)!=0){C=m;break}if((l&1|0)==0){C=m;break}_j(f,l,1,0);return}}while(0);m=f+32|0;g=f+372|0;t=f+12|0;s=f+4|0;r=0;n=C;C=l;while(1){if((n&1)==0){D=C}else{l=C&16777215;j=l+1|0;if(j>>>0<(c[k>>2]|0)>>>0){w=c[m>>2]|0;E=d[w+l|0]<<8|d[w+j|0]}else{E=sc[c[t>>2]&63](c[s>>2]|0,l)|0}l=E&65535;j=(l&32768|0)!=0?l|-65536:l;l=r&7;if(r>>>0<8>>>0){c[f+88+(l<<2)>>2]=j}else{c[f+120+(l<<2)>>2]=j}c[g>>2]=(c[g>>2]|0)+4;D=C+2|0}j=r+1|0;if(j>>>0<16>>>0){r=j;n=(n&65535)>>>1;C=D}else{break}}c[g>>2]=(c[g>>2]|0)+12;g=c[h>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}b[p>>1]=b[i>>1]|0;p=g&16777215;g=p+1|0;if(g>>>0<(c[k>>2]|0)>>>0){k=c[m>>2]|0;F=d[k+p|0]<<8|d[k+g|0]}else{F=sc[c[t>>2]&63](c[s>>2]|0,p)|0}b[i>>1]=F;if((a[B]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[A>>2]=(c[A>>2]|0)+2;return}else{Yj(f);return}}}function yl(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;g=f+160|0;h=(e[g>>1]|0)>>>3&7;if((h|0)==0){$j(f);i=f+372|0;c[i>>2]=(c[i>>2]|0)+2;return}else if((h|0)==3){h=f+156|0;i=c[h>>2]|0;if((i&1|0)!=0){_j(f,i,0,0);return}j=f+164|0;k=f+162|0;b[k>>1]=b[j>>1]|0;l=i&16777215;i=l+1|0;m=f+36|0;if(i>>>0<(c[m>>2]|0)>>>0){n=c[f+32>>2]|0;o=d[n+l|0]<<8|d[n+i|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[j>>1]=o;o=f+336|0;if((a[o]|0)!=0){Yj(f);return}c[h>>2]=(c[h>>2]|0)+2;l=f+152|0;c[l>>2]=(c[l>>2]|0)+2;i=b[k>>1]|0;n=c[f+120+((b[g>>1]&7)<<2)>>2]|0;do{if(i<<16>>16==0){p=0}else{if((c[f>>2]&1|0)!=0){p=i;break}if((n&1|0)==0){p=i;break}_j(f,n,1,0);return}}while(0);i=f+32|0;q=f+372|0;r=f+16|0;s=f+4|0;t=p;p=n;n=0;while(1){if((t&1)==0){u=p}else{v=p&16777215;w=v+3|0;if(w>>>0<(c[m>>2]|0)>>>0){x=c[i>>2]|0;y=((d[x+v|0]<<8|d[x+(v+1)|0])<<8|d[x+(v+2)|0])<<8|d[x+w|0]}else{y=sc[c[r>>2]&63](c[s>>2]|0,v)|0}v=n&7;if(n>>>0<8>>>0){c[f+88+(v<<2)>>2]=y}else{c[f+120+(v<<2)>>2]=y}c[q>>2]=(c[q>>2]|0)+8;u=p+4|0}v=n+1|0;if(v>>>0<16>>>0){t=(t&65535)>>>1;p=u;n=v}else{break}}c[f+120+((b[g>>1]&7)<<2)>>2]=u;c[q>>2]=(c[q>>2]|0)+12;q=c[h>>2]|0;if((q&1|0)!=0){_j(f,q,0,0);return}b[k>>1]=b[j>>1]|0;k=q&16777215;q=k+1|0;if(q>>>0<(c[m>>2]|0)>>>0){m=c[i>>2]|0;z=d[m+k|0]<<8|d[m+q|0]}else{z=sc[c[f+12>>2]&63](c[s>>2]|0,k)|0}b[j>>1]=z;if((a[o]|0)==0){c[h>>2]=(c[h>>2]|0)+2;c[l>>2]=(c[l>>2]|0)+2;return}else{Yj(f);return}}else{l=f+156|0;h=c[l>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);return}o=f+164|0;z=f+162|0;b[z>>1]=b[o>>1]|0;j=h&16777215;h=j+1|0;k=f+36|0;if(h>>>0<(c[k>>2]|0)>>>0){s=c[f+32>>2]|0;A=d[s+j|0]<<8|d[s+h|0]}else{A=sc[c[f+12>>2]&63](c[f+4>>2]|0,j)|0}b[o>>1]=A;A=f+336|0;if((a[A]|0)!=0){Yj(f);return}c[l>>2]=(c[l>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;h=b[z>>1]|0;s=b[g>>1]&63;if((rc[c[20568+(s<<2)>>2]&127](f,s,2028,32)|0)!=0){return}if((c[f+340>>2]|0)!=2){$j(f);return}s=c[f+344>>2]|0;do{if(h<<16>>16==0){B=0}else{if((c[f>>2]&1|0)!=0){B=h;break}if((s&1|0)==0){B=h;break}_j(f,s,1,0);return}}while(0);h=f+32|0;g=f+372|0;q=f+16|0;m=f+4|0;i=B;B=s;s=0;while(1){if((i&1)==0){C=B}else{u=B&16777215;n=u+3|0;if(n>>>0<(c[k>>2]|0)>>>0){p=c[h>>2]|0;D=((d[p+u|0]<<8|d[p+(u+1)|0])<<8|d[p+(u+2)|0])<<8|d[p+n|0]}else{D=sc[c[q>>2]&63](c[m>>2]|0,u)|0}u=s&7;if(s>>>0<8>>>0){c[f+88+(u<<2)>>2]=D}else{c[f+120+(u<<2)>>2]=D}c[g>>2]=(c[g>>2]|0)+8;C=B+4|0}u=s+1|0;if(u>>>0<16>>>0){i=(i&65535)>>>1;B=C;s=u}else{break}}c[g>>2]=(c[g>>2]|0)+12;g=c[l>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}b[z>>1]=b[o>>1]|0;z=g&16777215;g=z+1|0;if(g>>>0<(c[k>>2]|0)>>>0){k=c[h>>2]|0;E=d[k+z|0]<<8|d[k+g|0]}else{E=sc[c[f+12>>2]&63](c[m>>2]|0,z)|0}b[o>>1]=E;if((a[A]|0)==0){c[l>>2]=(c[l>>2]|0)+2;c[j>>2]=(c[j>>2]|0)+2;return}else{Yj(f);return}}}function zl(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;g=f+160|0;h=e[g>>1]|0;switch(h|0){case 20080:{if((a[f+334|0]|0)==0){dk(f);return}i=f+372|0;j=c[i>>2]|0;if((c[f>>2]&8|0)==0){c[i>>2]=j+132;jk(f);return}c[i>>2]=j+4;j=f+156|0;i=c[j>>2]|0;if((i&1|0)!=0){_j(f,i,0,0);return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;l=i&16777215;i=l+1|0;if(i>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+i|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[k>>1]=n;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;return}else{Yj(f);return}break};case 20086:{j=f+156|0;n=c[j>>2]|0;if((n&1|0)!=0){_j(f,n,0,0);return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;l=n&16777215;n=l+1|0;if(n>>>0<(c[f+36>>2]|0)>>>0){i=c[f+32>>2]|0;o=d[i+l|0]<<8|d[i+n|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[k>>1]=o;if((a[f+336|0]|0)!=0){Yj(f);return}c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;if((b[f+166>>1]&2)==0){j=f+372|0;c[j>>2]=(c[j>>2]|0)+4;return}else{ck(f);return}break};case 20087:{j=f+148|0;o=c[j>>2]|0;k=o&16777215;l=k+1|0;n=f+36|0;i=c[n>>2]|0;if(l>>>0<i>>>0){p=a[(c[f+32>>2]|0)+l|0]|0;q=i}else{i=(sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0)&255;p=i;q=c[n>>2]|0}i=f+166|0;b[i>>1]=b[i>>1]&-256|p&31;p=o+2&16777215;i=p+3|0;if(i>>>0<q>>>0){q=c[f+32>>2]|0;r=((d[q+p|0]<<8|d[q+(p+1)|0])<<8|d[q+(p+2)|0])<<8|d[q+i|0]}else{r=sc[c[f+16>>2]&63](c[f+4>>2]|0,p)|0}p=f+156|0;c[p>>2]=r;c[j>>2]=o+6;o=f+372|0;c[o>>2]=(c[o>>2]|0)+20;if((r&1|0)!=0){_j(f,r,0,0);return}o=f+164|0;j=f+162|0;b[j>>1]=b[o>>1]|0;i=r&16777215;r=i+1|0;if(r>>>0<(c[n>>2]|0)>>>0){q=c[f+32>>2]|0;s=d[q+i|0]<<8|d[q+r|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,i)|0}b[o>>1]=s;i=f+336|0;if((a[i]|0)!=0){Yj(f);return}r=(c[p>>2]|0)+2|0;c[p>>2]=r;q=f+152|0;c[q>>2]=(c[q>>2]|0)+2;if((r&1|0)!=0){_j(f,r,0,0);return}b[j>>1]=s;s=r&16777215;j=s+1|0;do{if(j>>>0<(c[n>>2]|0)>>>0){k=c[f+32>>2]|0;b[o>>1]=d[k+s|0]<<8|d[k+j|0];t=r}else{k=sc[c[f+12>>2]&63](c[f+4>>2]|0,s)|0;l=(a[i]|0)==0;b[o>>1]=k;if(l){t=c[p>>2]|0;break}Yj(f);return}}while(0);c[p>>2]=t+2;c[q>>2]=t-2;return};case 20090:{t=f|0;if((c[t>>2]&2|0)==0){$j(f);q=f+372|0;c[q>>2]=(c[q>>2]|0)+2;return}q=f+334|0;if((a[q]|0)==0){dk(f);return}p=f+156|0;o=c[p>>2]|0;if((o&1|0)!=0){_j(f,o,0,0);return}i=f+164|0;s=f+162|0;b[s>>1]=b[i>>1]|0;r=o&16777215;o=r+1|0;j=f+36|0;if(o>>>0<(c[j>>2]|0)>>>0){n=c[f+32>>2]|0;u=d[n+r|0]<<8|d[n+o|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,r)|0}b[i>>1]=u;u=f+336|0;if((a[u]|0)!=0){Yj(f);return}c[p>>2]=(c[p>>2]|0)+2;r=f+152|0;c[r>>2]=(c[r>>2]|0)+2;o=e[s>>1]|0;n=o>>>12;a:do{switch(o&4095|0){case 0:{v=c[f+180>>2]&3;break};case 1:{v=c[f+184>>2]&3;break};case 2:{if((c[t>>2]&4|0)!=0){v=c[f+176>>2]|0;break a}$j(f);l=f+372|0;c[l>>2]=(c[l>>2]|0)+2;return};case 2048:{v=c[((a[q]|0)==0?f+148|0:f+168|0)>>2]|0;break};case 2049:{v=c[f+176>>2]|0;break};case 2050:{if((c[t>>2]&4|0)!=0){v=c[f+176>>2]|0;break a}$j(f);l=f+372|0;c[l>>2]=(c[l>>2]|0)+2;return};default:{$j(f);return}}}while(0);t=n&7;if((n&8|0)==0){c[f+88+(t<<2)>>2]=v}else{c[f+120+(t<<2)>>2]=v}v=f+372|0;c[v>>2]=(c[v>>2]|0)+12;v=c[p>>2]|0;if((v&1|0)!=0){_j(f,v,0,0);return}b[s>>1]=b[i>>1]|0;s=v&16777215;v=s+1|0;if(v>>>0<(c[j>>2]|0)>>>0){j=c[f+32>>2]|0;w=d[j+s|0]<<8|d[j+v|0]}else{w=sc[c[f+12>>2]&63](c[f+4>>2]|0,s)|0}b[i>>1]=w;if((a[u]|0)==0){c[p>>2]=(c[p>>2]|0)+2;c[r>>2]=(c[r>>2]|0)+2;return}else{Yj(f);return}break};case 20091:{r=f|0;if((c[r>>2]&2|0)==0){$j(f);p=f+372|0;c[p>>2]=(c[p>>2]|0)+2;return}p=f+334|0;if((a[p]|0)==0){dk(f);return}u=f+156|0;w=c[u>>2]|0;if((w&1|0)!=0){_j(f,w,0,0);return}i=f+164|0;s=f+162|0;b[s>>1]=b[i>>1]|0;v=w&16777215;w=v+1|0;j=f+36|0;if(w>>>0<(c[j>>2]|0)>>>0){t=c[f+32>>2]|0;x=d[t+v|0]<<8|d[t+w|0]}else{x=sc[c[f+12>>2]&63](c[f+4>>2]|0,v)|0}b[i>>1]=x;v=f+336|0;if((a[v]|0)!=0){Yj(f);return}w=(c[u>>2]|0)+2|0;c[u>>2]=w;t=f+152|0;n=(c[t>>2]|0)+2|0;c[t>>2]=n;q=e[s>>1]|0;o=q>>>12;l=o&7;if((o&8|0)==0){y=f+88+(l<<2)|0}else{y=f+120+(l<<2)|0}l=c[y>>2]|0;b:do{switch(q&4095|0){case 0:{c[f+180>>2]=l&3;break};case 1:{c[f+184>>2]=l&3;break};case 2:{if((c[r>>2]&4|0)!=0){c[f+188>>2]=l;break b}$j(f);y=f+372|0;c[y>>2]=(c[y>>2]|0)+2;return};case 2048:{if((a[p]|0)==0){c[f+148>>2]=l;break b}else{c[f+168>>2]=l;break b}break};case 2049:{c[f+176>>2]=l;break};case 2050:{if((c[r>>2]&4|0)!=0){c[f+188>>2]=l;break b}$j(f);y=f+372|0;c[y>>2]=(c[y>>2]|0)+2;return};default:{$j(f);return}}}while(0);l=f+372|0;c[l>>2]=(c[l>>2]|0)+10;if((w&1|0)!=0){_j(f,w,0,0);return}b[s>>1]=x;x=w&16777215;s=x+1|0;do{if(s>>>0<(c[j>>2]|0)>>>0){l=c[f+32>>2]|0;b[i>>1]=d[l+x|0]<<8|d[l+s|0];z=w;A=n}else{l=sc[c[f+12>>2]&63](c[f+4>>2]|0,x)|0;r=(a[v]|0)==0;b[i>>1]=l;if(r){z=c[u>>2]|0;A=c[t>>2]|0;break}Yj(f);return}}while(0);c[u>>2]=z+2;c[t>>2]=A+2;return};case 20085:{A=f+148|0;t=c[A>>2]|0;z=t&16777215;u=z+3|0;i=f+36|0;if(u>>>0<(c[i>>2]|0)>>>0){v=c[f+32>>2]|0;B=((d[v+z|0]<<8|d[v+(z+1)|0])<<8|d[v+(z+2)|0])<<8|d[v+u|0]}else{B=sc[c[f+16>>2]&63](c[f+4>>2]|0,z)|0}z=f+156|0;c[z>>2]=B;c[A>>2]=t+4;t=f+372|0;c[t>>2]=(c[t>>2]|0)+16;if((B&1|0)!=0){_j(f,B,0,0);return}t=f+164|0;A=f+162|0;b[A>>1]=b[t>>1]|0;u=B&16777215;B=u+1|0;if(B>>>0<(c[i>>2]|0)>>>0){v=c[f+32>>2]|0;C=d[v+u|0]<<8|d[v+B|0]}else{C=sc[c[f+12>>2]&63](c[f+4>>2]|0,u)|0}b[t>>1]=C;u=f+336|0;if((a[u]|0)!=0){Yj(f);return}B=(c[z>>2]|0)+2|0;c[z>>2]=B;v=f+152|0;c[v>>2]=(c[v>>2]|0)+2;if((B&1|0)!=0){_j(f,B,0,0);return}b[A>>1]=C;C=B&16777215;A=C+1|0;do{if(A>>>0<(c[i>>2]|0)>>>0){x=c[f+32>>2]|0;b[t>>1]=d[x+C|0]<<8|d[x+A|0];D=B}else{x=sc[c[f+12>>2]&63](c[f+4>>2]|0,C)|0;n=(a[u]|0)==0;b[t>>1]=x;if(n){D=c[z>>2]|0;break}Yj(f);return}}while(0);c[z>>2]=D+2;c[v>>2]=D-2;return};case 20081:{D=f+372|0;c[D>>2]=(c[D>>2]|0)+4;D=f+156|0;v=c[D>>2]|0;if((v&1|0)!=0){_j(f,v,0,0);return}z=f+164|0;b[f+162>>1]=b[z>>1]|0;t=v&16777215;v=t+1|0;if(v>>>0<(c[f+36>>2]|0)>>>0){u=c[f+32>>2]|0;E=d[u+t|0]<<8|d[u+v|0]}else{E=sc[c[f+12>>2]&63](c[f+4>>2]|0,t)|0}b[z>>1]=E;if((a[f+336|0]|0)==0){c[D>>2]=(c[D>>2]|0)+2;D=f+152|0;c[D>>2]=(c[D>>2]|0)+2;return}else{Yj(f);return}break};case 20082:{if((a[f+334|0]|0)==0){dk(f);return}D=f+156|0;E=c[D>>2]|0;if((E&1|0)!=0){_j(f,E,0,0);return}z=f+164|0;t=f+162|0;b[t>>1]=b[z>>1]|0;v=E&16777215;E=v+1|0;u=f+36|0;if(E>>>0<(c[u>>2]|0)>>>0){C=c[f+32>>2]|0;F=d[C+v|0]<<8|d[C+E|0]}else{F=sc[c[f+12>>2]&63](c[f+4>>2]|0,v)|0}b[z>>1]=F;F=f+336|0;if((a[F]|0)!=0){Yj(f);return}c[D>>2]=(c[D>>2]|0)+2;v=f+152|0;c[v>>2]=(c[v>>2]|0)+2;Wj(f,b[t>>1]|0);E=f+372|0;c[E>>2]=(c[E>>2]|0)+4;E=f+335|0;a[E]=a[E]|1;E=c[D>>2]|0;if((E&1|0)!=0){_j(f,E,0,0);return}b[t>>1]=b[z>>1]|0;t=E&16777215;E=t+1|0;if(E>>>0<(c[u>>2]|0)>>>0){u=c[f+32>>2]|0;G=d[u+t|0]<<8|d[u+E|0]}else{G=sc[c[f+12>>2]&63](c[f+4>>2]|0,t)|0}b[z>>1]=G;if((a[F]|0)==0){c[D>>2]=(c[D>>2]|0)+2;c[v>>2]=(c[v>>2]|0)+2;return}else{Yj(f);return}break};case 20084:{if((c[f>>2]&2|0)==0){$j(f);v=f+372|0;c[v>>2]=(c[v>>2]|0)+2;return}v=f+156|0;D=c[v>>2]|0;if((D&1|0)!=0){_j(f,D,0,0);return}F=f+164|0;G=f+162|0;b[G>>1]=b[F>>1]|0;z=D&16777215;D=z+1|0;t=f+36|0;if(D>>>0<(c[t>>2]|0)>>>0){E=c[f+32>>2]|0;H=d[E+z|0]<<8|d[E+D|0]}else{H=sc[c[f+12>>2]&63](c[f+4>>2]|0,z)|0}b[F>>1]=H;H=f+336|0;if((a[H]|0)!=0){Yj(f);return}c[v>>2]=(c[v>>2]|0)+2;z=f+152|0;c[z>>2]=(c[z>>2]|0)+2;D=e[G>>1]|0;E=f+148|0;u=c[E>>2]|0;C=u&16777215;B=C+3|0;if(B>>>0<(c[t>>2]|0)>>>0){A=c[f+32>>2]|0;I=((d[A+C|0]<<8|d[A+(C+1)|0])<<8|d[A+(C+2)|0])<<8|d[A+B|0]}else{I=sc[c[f+16>>2]&63](c[f+4>>2]|0,C)|0}c[v>>2]=I;c[E>>2]=u+4+((D&32768|0)!=0?D|-65536:D);D=f+372|0;c[D>>2]=(c[D>>2]|0)+16;if((I&1|0)!=0){_j(f,I,0,0);return}b[G>>1]=b[F>>1]|0;D=I&16777215;I=D+1|0;if(I>>>0<(c[t>>2]|0)>>>0){u=c[f+32>>2]|0;J=d[u+D|0]<<8|d[u+I|0]}else{J=sc[c[f+12>>2]&63](c[f+4>>2]|0,D)|0}b[F>>1]=J;if((a[H]|0)!=0){Yj(f);return}D=(c[v>>2]|0)+2|0;c[v>>2]=D;c[z>>2]=(c[z>>2]|0)+2;if((D&1|0)!=0){_j(f,D,0,0);return}b[G>>1]=J;J=D&16777215;G=J+1|0;do{if(G>>>0<(c[t>>2]|0)>>>0){I=c[f+32>>2]|0;b[F>>1]=d[I+J|0]<<8|d[I+G|0];K=D}else{I=sc[c[f+12>>2]&63](c[f+4>>2]|0,J)|0;u=(a[H]|0)==0;b[F>>1]=I;if(u){K=c[v>>2]|0;break}Yj(f);return}}while(0);c[v>>2]=K+2;c[z>>2]=K-2;return};case 20083:{K=f+334|0;if((a[K]|0)==0){dk(f);return}z=f+148|0;v=c[z>>2]|0;F=v&16777215;H=F+1|0;J=f+36|0;D=c[J>>2]|0;if(H>>>0<D>>>0){G=c[f+32>>2]|0;L=d[G+F|0]<<8|d[G+H|0];M=D}else{D=sc[c[f+12>>2]&63](c[f+4>>2]|0,F)|0;L=D;M=c[J>>2]|0}D=v+2&16777215;F=D+3|0;if(F>>>0<M>>>0){M=c[f+32>>2]|0;N=((d[M+D|0]<<8|d[M+(D+1)|0])<<8|d[M+(D+2)|0])<<8|d[M+F|0]}else{N=sc[c[f+16>>2]&63](c[f+4>>2]|0,D)|0}D=f|0;do{if((c[D>>2]&2|0)!=0){F=v+6&16777215;M=F+1|0;if(M>>>0<(c[J>>2]|0)>>>0){H=c[f+32>>2]|0;O=d[H+F|0]<<8|d[H+M|0]}else{O=sc[c[f+12>>2]&63](c[f+4>>2]|0,F)|0}F=(O&65535)>>>12;if((F|0)==0|(F|0)==8){break}gk(f);return}}while(0);Wj(f,L);L=f+152|0;c[L>>2]=N;O=f+156|0;c[O>>2]=N;do{if((c[D>>2]&2|0)==0){F=v+6|0;if((a[K]|0)==0){c[f+172>>2]=F;break}else{c[z>>2]=F;break}}else{F=v+8|0;if((a[K]|0)==0){c[f+172>>2]=F;break}else{c[z>>2]=F;break}}}while(0);z=f+372|0;c[z>>2]=(c[z>>2]|0)+20;if((N&1|0)!=0){_j(f,N,0,0);return}z=f+164|0;K=f+162|0;b[K>>1]=b[z>>1]|0;v=N&16777215;D=v+1|0;if(D>>>0<(c[J>>2]|0)>>>0){F=c[f+32>>2]|0;P=d[F+v|0]<<8|d[F+D|0]}else{P=sc[c[f+12>>2]&63](c[f+4>>2]|0,v)|0}b[z>>1]=P;v=f+336|0;if((a[v]|0)!=0){Yj(f);return}D=(c[O>>2]|0)+2|0;c[O>>2]=D;c[L>>2]=(c[L>>2]|0)+2;if((D&1|0)!=0){_j(f,D,0,0);return}b[K>>1]=P;P=D&16777215;K=P+1|0;do{if(K>>>0<(c[J>>2]|0)>>>0){F=c[f+32>>2]|0;b[z>>1]=d[F+P|0]<<8|d[F+K|0];Q=D}else{F=sc[c[f+12>>2]&63](c[f+4>>2]|0,P)|0;M=(a[v]|0)==0;b[z>>1]=F;if(M){Q=c[O>>2]|0;break}Yj(f);return}}while(0);c[O>>2]=Q+2;c[L>>2]=N;return};default:{switch(h>>>3&7|0){case 4:{if((a[f+334|0]|0)==0){dk(f);return}c[f+168>>2]=c[f+120+((h&7)<<2)>>2];N=f+372|0;c[N>>2]=(c[N>>2]|0)+4;N=f+156|0;L=c[N>>2]|0;if((L&1|0)!=0){_j(f,L,0,0);return}Q=f+164|0;b[f+162>>1]=b[Q>>1]|0;O=L&16777215;L=O+1|0;if(L>>>0<(c[f+36>>2]|0)>>>0){z=c[f+32>>2]|0;R=d[z+O|0]<<8|d[z+L|0]}else{R=sc[c[f+12>>2]&63](c[f+4>>2]|0,O)|0}b[Q>>1]=R;if((a[f+336|0]|0)==0){c[N>>2]=(c[N>>2]|0)+2;N=f+152|0;c[N>>2]=(c[N>>2]|0)+2;return}else{Yj(f);return}break};case 5:{if((a[f+334|0]|0)==0){dk(f);return}c[f+120+((h&7)<<2)>>2]=c[f+168>>2];N=f+372|0;c[N>>2]=(c[N>>2]|0)+4;N=f+156|0;R=c[N>>2]|0;if((R&1|0)!=0){_j(f,R,0,0);return}Q=f+164|0;b[f+162>>1]=b[Q>>1]|0;O=R&16777215;R=O+1|0;if(R>>>0<(c[f+36>>2]|0)>>>0){L=c[f+32>>2]|0;S=d[L+O|0]<<8|d[L+R|0]}else{S=sc[c[f+12>>2]&63](c[f+4>>2]|0,O)|0}b[Q>>1]=S;if((a[f+336|0]|0)==0){c[N>>2]=(c[N>>2]|0)+2;N=f+152|0;c[N>>2]=(c[N>>2]|0)+2;return}else{Yj(f);return}break};case 0:case 1:{N=f+156|0;S=c[N>>2]|0;if((S&1|0)!=0){_j(f,S,0,0);return}Q=f+164|0;b[f+162>>1]=b[Q>>1]|0;O=S&16777215;S=O+1|0;if(S>>>0<(c[f+36>>2]|0)>>>0){R=c[f+32>>2]|0;T=d[R+O|0]<<8|d[R+S|0]}else{T=sc[c[f+12>>2]&63](c[f+4>>2]|0,O)|0}b[Q>>1]=T;if((a[f+336|0]|0)==0){c[N>>2]=(c[N>>2]|0)+2;N=f+152|0;c[N>>2]=(c[N>>2]|0)+2;hk(f,b[g>>1]&15);return}else{Yj(f);return}break};case 2:{N=f+156|0;T=c[N>>2]|0;if((T&1|0)!=0){_j(f,T,0,0);return}Q=f+164|0;O=f+162|0;b[O>>1]=b[Q>>1]|0;S=T&16777215;T=S+1|0;R=f+36|0;if(T>>>0<(c[R>>2]|0)>>>0){L=c[f+32>>2]|0;U=d[L+S|0]<<8|d[L+T|0]}else{U=sc[c[f+12>>2]&63](c[f+4>>2]|0,S)|0}b[Q>>1]=U;U=f+336|0;if((a[U]|0)!=0){Yj(f);return}c[N>>2]=(c[N>>2]|0)+2;S=f+152|0;c[S>>2]=(c[S>>2]|0)+2;T=b[g>>1]&7;g=e[O>>1]|0;L=f+372|0;c[L>>2]=(c[L>>2]|0)+16;L=f+148|0;z=(c[L>>2]|0)-4|0;c[L>>2]=z;v=f+120+(T<<2)|0;T=c[v>>2]|0;P=z&16777215;z=P+3|0;if(z>>>0<(c[R>>2]|0)>>>0){D=f+32|0;a[(c[D>>2]|0)+P|0]=T>>>24;a[(c[D>>2]|0)+(P+1)|0]=T>>>16;a[(c[D>>2]|0)+(P+2)|0]=T>>>8;a[(c[D>>2]|0)+z|0]=T}else{pc[c[f+28>>2]&63](c[f+4>>2]|0,P,T)}c[v>>2]=c[L>>2];c[L>>2]=(c[L>>2]|0)+((g&32768|0)!=0?g|-65536:g);g=c[N>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}b[O>>1]=b[Q>>1]|0;O=g&16777215;g=O+1|0;if(g>>>0<(c[R>>2]|0)>>>0){R=c[f+32>>2]|0;V=d[R+O|0]<<8|d[R+g|0]}else{V=sc[c[f+12>>2]&63](c[f+4>>2]|0,O)|0}b[Q>>1]=V;if((a[U]|0)==0){c[N>>2]=(c[N>>2]|0)+2;c[S>>2]=(c[S>>2]|0)+2;return}else{Yj(f);return}break};case 3:{S=f+120+((h&7)<<2)|0;h=c[S>>2]|0;do{if((c[f>>2]&1|0)==0){if((h&1|0)==0){break}_j(f,h,1,0);return}}while(0);N=f+372|0;c[N>>2]=(c[N>>2]|0)+12;N=f+148|0;c[N>>2]=h;U=h&16777215;h=U+3|0;V=f+36|0;if(h>>>0<(c[V>>2]|0)>>>0){Q=c[f+32>>2]|0;W=((d[Q+U|0]<<8|d[Q+(U+1)|0])<<8|d[Q+(U+2)|0])<<8|d[Q+h|0]}else{W=sc[c[f+16>>2]&63](c[f+4>>2]|0,U)|0}c[S>>2]=W;c[N>>2]=(c[N>>2]|0)+4;N=f+156|0;W=c[N>>2]|0;if((W&1|0)!=0){_j(f,W,0,0);return}S=f+164|0;b[f+162>>1]=b[S>>1]|0;U=W&16777215;W=U+1|0;if(W>>>0<(c[V>>2]|0)>>>0){V=c[f+32>>2]|0;X=d[V+U|0]<<8|d[V+W|0]}else{X=sc[c[f+12>>2]&63](c[f+4>>2]|0,U)|0}b[S>>1]=X;if((a[f+336|0]|0)==0){c[N>>2]=(c[N>>2]|0)+2;N=f+152|0;c[N>>2]=(c[N>>2]|0)+2;return}else{Yj(f);return}break};default:{$j(f);N=f+372|0;c[N>>2]=(c[N>>2]|0)+2;return}}}}}function Al(e){e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=b[e+160>>1]&63;if((rc[c[20568+(f<<2)>>2]&127](e,f,2020,32)|0)!=0){return}if((c[e+340>>2]|0)!=2){$j(e);return}f=e+372|0;c[f>>2]=(c[f>>2]|0)+16;f=e+156|0;g=c[f>>2]|0;h=e+344|0;i=c[h>>2]|0;c[f>>2]=i;if((i&1|0)!=0){_j(e,i,0,0);return}j=e+164|0;k=e+162|0;b[k>>1]=b[j>>1]|0;l=i&16777215;i=l+1|0;m=e+36|0;if(i>>>0<(c[m>>2]|0)>>>0){n=c[e+32>>2]|0;o=d[n+l|0]<<8|d[n+i|0]}else{o=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[j>>1]=o;o=e+336|0;if((a[o]|0)!=0){Yj(e);return}c[f>>2]=(c[f>>2]|0)+2;l=e+152|0;c[l>>2]=(c[l>>2]|0)+2;i=g-2|0;g=e+148|0;n=(c[g>>2]|0)-4|0;p=n&16777215;q=p+3|0;if(q>>>0<(c[m>>2]|0)>>>0){r=e+32|0;a[(c[r>>2]|0)+p|0]=i>>>24;a[(c[r>>2]|0)+(p+1)|0]=i>>>16;a[(c[r>>2]|0)+(p+2)|0]=i>>>8;a[(c[r>>2]|0)+q|0]=i}else{pc[c[e+28>>2]&63](c[e+4>>2]|0,p,i)}c[g>>2]=n;n=c[f>>2]|0;if((n&1|0)!=0){_j(e,n,0,0);return}b[k>>1]=b[j>>1]|0;k=n&16777215;n=k+1|0;if(n>>>0<(c[m>>2]|0)>>>0){m=c[e+32>>2]|0;s=d[m+k|0]<<8|d[m+n|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[j>>1]=s;if((a[o]|0)==0){c[f>>2]=(c[f>>2]|0)+2;c[l>>2]=c[h>>2];return}else{Yj(e);return}}function Bl(e){e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b[e+160>>1]&63;if((rc[c[20568+(f<<2)>>2]&127](e,f,2020,32)|0)!=0){return}if((c[e+340>>2]|0)!=2){$j(e);return}f=e+372|0;c[f>>2]=(c[f>>2]|0)+8;f=e+344|0;g=c[f>>2]|0;h=e+156|0;c[h>>2]=g;if((g&1|0)!=0){_j(e,g,0,0);return}i=e+164|0;j=e+162|0;b[j>>1]=b[i>>1]|0;k=g&16777215;g=k+1|0;l=e+36|0;if(g>>>0<(c[l>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+k|0]<<8|d[m+g|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,k)|0}b[i>>1]=n;k=e+336|0;if((a[k]|0)!=0){Yj(e);return}g=(c[h>>2]|0)+2|0;c[h>>2]=g;m=e+152|0;c[m>>2]=(c[m>>2]|0)+2;if((g&1|0)!=0){_j(e,g,0,0);return}b[j>>1]=n;n=g&16777215;g=n+1|0;do{if(g>>>0<(c[l>>2]|0)>>>0){j=c[e+32>>2]|0;b[i>>1]=d[j+n|0]<<8|d[j+g|0]}else{j=sc[c[e+12>>2]&63](c[e+4>>2]|0,n)|0;o=(a[k]|0)==0;b[i>>1]=j;if(o){break}Yj(e);return}}while(0);c[h>>2]=(c[h>>2]|0)+2;c[m>>2]=c[f>>2];return}function Cl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]|0;j=(h&65535)>>>9&7;k=h&63;if((rc[c[20568+(k<<2)>>2]&127](e,k,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}k=j<<24>>24==0?8:j;j=a[g]|0;g=j+k&255;h=e+372|0;c[h>>2]=(c[h>>2]|0)+8;to(e,g,k,j);j=e+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}h=e+164|0;b[e+162>>1]=b[h>>1]|0;l=k&16777215;k=l+1|0;if(k>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+k|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[h>>1]=n;if((a[e+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=e+152|0;c[j>>2]=(c[j>>2]|0)+2;_o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Dl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]|0;j=h&65535;if((j&56|0)==8){k=j>>>9&7;l=e+120+((j&7)<<2)|0;m=c[l>>2]|0;n=e+372|0;c[n>>2]=(c[n>>2]|0)+8;n=e+156|0;o=c[n>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}p=e+164|0;b[e+162>>1]=b[p>>1]|0;q=o&16777215;o=q+1|0;if(o>>>0<(c[e+36>>2]|0)>>>0){r=c[e+32>>2]|0;s=d[r+q|0]<<8|d[r+o|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,q)|0}b[p>>1]=s;if((a[e+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=e+152|0;c[n>>2]=(c[n>>2]|0)+2;c[l>>2]=m+((k|0)==0?8:k);i=f;return}else{Yj(e);i=f;return}}k=(h&65535)>>>9&7;h=j&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}h=k<<16>>16==0?8:k;k=b[g>>1]|0;g=k+h&65535;j=e+372|0;c[j>>2]=(c[j>>2]|0)+8;uo(e,g,h,k);k=e+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;t=d[l+m|0]<<8|d[l+h|0]}else{t=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[j>>1]=t;if((a[e+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=e+152|0;c[k>>2]=(c[k>>2]|0)+2;$o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function El(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;if((j&56|0)==8){k=j>>>9&7;l=f+120+((j&7)<<2)|0;m=c[l>>2]|0;n=f+372|0;c[n>>2]=(c[n>>2]|0)+12;n=f+156|0;o=c[n>>2]|0;if((o&1|0)!=0){_j(f,o,0,0);i=g;return}p=f+164|0;b[f+162>>1]=b[p>>1]|0;q=o&16777215;o=q+1|0;if(o>>>0<(c[f+36>>2]|0)>>>0){r=c[f+32>>2]|0;s=d[r+q|0]<<8|d[r+o|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0}b[p>>1]=s;if((a[f+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;c[l>>2]=m+((k|0)==0?8:k);i=g;return}else{Yj(f);i=g;return}}k=j>>>9&7;m=j&63;if((rc[c[20568+(m<<2)>>2]&127](f,m,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}m=(k|0)==0?8:k;k=c[h>>2]|0;h=k+m|0;j=f+372|0;c[j>>2]=(c[j>>2]|0)+12;vo(f,h,m,k);k=f+156|0;m=c[k>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}j=f+164|0;b[f+162>>1]=b[j>>1]|0;l=m&16777215;m=l+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;t=d[n+l|0]<<8|d[n+m|0]}else{t=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[j>>1]=t;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;ap(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Fl(a){a=a|0;if((b[a+160>>1]&56)==8){mk(a,1);return}else{nk(a,1);return}}function Gl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]|0;j=(h&65535)>>>9&7;k=h&63;if((rc[c[20568+(k<<2)>>2]&127](e,k,509,8)|0)!=0){i=f;return}if((Xo(e,g)|0)!=0){i=f;return}k=j<<24>>24==0?8:j;j=a[g]|0;g=j-k&255;h=e+372|0;c[h>>2]=(c[h>>2]|0)+8;Co(e,g,k,j);j=e+156|0;k=c[j>>2]|0;if((k&1|0)!=0){_j(e,k,0,0);i=f;return}h=e+164|0;b[e+162>>1]=b[h>>1]|0;l=k&16777215;k=l+1|0;if(k>>>0<(c[e+36>>2]|0)>>>0){m=c[e+32>>2]|0;n=d[m+l|0]<<8|d[m+k|0]}else{n=sc[c[e+12>>2]&63](c[e+4>>2]|0,l)|0}b[h>>1]=n;if((a[e+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=e+152|0;c[j>>2]=(c[j>>2]|0)+2;_o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Hl(e){e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+8|0;g=f|0;h=b[e+160>>1]|0;j=h&65535;if((j&56|0)==8){k=j>>>9&7;l=e+120+((j&7)<<2)|0;m=c[l>>2]|0;n=e+372|0;c[n>>2]=(c[n>>2]|0)+8;n=e+156|0;o=c[n>>2]|0;if((o&1|0)!=0){_j(e,o,0,0);i=f;return}p=e+164|0;b[e+162>>1]=b[p>>1]|0;q=o&16777215;o=q+1|0;if(o>>>0<(c[e+36>>2]|0)>>>0){r=c[e+32>>2]|0;s=d[r+q|0]<<8|d[r+o|0]}else{s=sc[c[e+12>>2]&63](c[e+4>>2]|0,q)|0}b[p>>1]=s;if((a[e+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=e+152|0;c[n>>2]=(c[n>>2]|0)+2;c[l>>2]=m-((k|0)==0?8:k);i=f;return}else{Yj(e);i=f;return}}k=(h&65535)>>>9&7;h=j&63;if((rc[c[20568+(h<<2)>>2]&127](e,h,509,16)|0)!=0){i=f;return}if((Yo(e,g)|0)!=0){i=f;return}h=k<<16>>16==0?8:k;k=b[g>>1]|0;g=k-h&65535;j=e+372|0;c[j>>2]=(c[j>>2]|0)+8;Do(e,g,h,k);k=e+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(e,h,0,0);i=f;return}j=e+164|0;b[e+162>>1]=b[j>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[e+36>>2]|0)>>>0){l=c[e+32>>2]|0;t=d[l+m|0]<<8|d[l+h|0]}else{t=sc[c[e+12>>2]&63](c[e+4>>2]|0,m)|0}b[j>>1]=t;if((a[e+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=e+152|0;c[k>>2]=(c[k>>2]|0)+2;$o(e,g)|0;i=f;return}else{Yj(e);i=f;return}}function Il(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;if((j&56|0)==8){k=j>>>9&7;l=f+120+((j&7)<<2)|0;m=c[l>>2]|0;n=f+372|0;c[n>>2]=(c[n>>2]|0)+12;n=f+156|0;o=c[n>>2]|0;if((o&1|0)!=0){_j(f,o,0,0);i=g;return}p=f+164|0;b[f+162>>1]=b[p>>1]|0;q=o&16777215;o=q+1|0;if(o>>>0<(c[f+36>>2]|0)>>>0){r=c[f+32>>2]|0;s=d[r+q|0]<<8|d[r+o|0]}else{s=sc[c[f+12>>2]&63](c[f+4>>2]|0,q)|0}b[p>>1]=s;if((a[f+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;c[l>>2]=m-((k|0)==0?8:k);i=g;return}else{Yj(f);i=g;return}}k=j>>>9&7;m=j&63;if((rc[c[20568+(m<<2)>>2]&127](f,m,509,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}m=(k|0)==0?8:k;k=c[h>>2]|0;h=k-m|0;j=f+372|0;c[j>>2]=(c[j>>2]|0)+12;Eo(f,h,m,k);k=f+156|0;m=c[k>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}j=f+164|0;b[f+162>>1]=b[j>>1]|0;l=m&16777215;m=l+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;t=d[n+l|0]<<8|d[n+m|0]}else{t=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[j>>1]=t;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;ap(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Jl(a){a=a|0;if((b[a+160>>1]&56)==8){mk(a,0);return}else{nk(a,0);return}}function Kl(a){a=a|0;var c=0,d=0;c=e[a+166>>1]|0;if((c&1|0)==0){d=c>>>2&1^1}else{d=0}if((b[a+160>>1]&56)==8){mk(a,d);return}else{nk(a,d);return}}function Ll(a){a=a|0;var c=0,d=0;c=e[a+166>>1]|0;if((c&1|0)==0){d=c>>>2&1}else{d=1}if((b[a+160>>1]&56)==8){mk(a,d);return}else{nk(a,d);return}}function Ml(a){a=a|0;var c=0;c=(b[a+166>>1]&1^1)&65535;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Nl(a){a=a|0;var c=0;c=b[a+166>>1]&1;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Ol(a){a=a|0;var c=0;c=((e[a+166>>1]|0)>>>2&1^1)&65535;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Pl(a){a=a|0;var c=0;c=(e[a+166>>1]|0)>>>2&1;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Ql(a){a=a|0;var c=0;c=((e[a+166>>1]|0)>>>1&1^1)&65535;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Rl(a){a=a|0;var c=0;c=(e[a+166>>1]|0)>>>1&1;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Sl(a){a=a|0;var c=0;c=((e[a+166>>1]|0)>>>3&1^1)&65535;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Tl(a){a=a|0;var c=0;c=(e[a+166>>1]|0)>>>3&1;if((b[a+160>>1]&56)==8){mk(a,c);return}else{nk(a,c);return}}function Ul(a){a=a|0;var c=0,d=0;c=e[a+166>>1]|0;d=(c>>>3^c>>>1)&1^1;if((b[a+160>>1]&56)==8){mk(a,d);return}else{nk(a,d);return}}function Vl(a){a=a|0;var c=0,d=0;c=e[a+166>>1]|0;d=(c>>>3^c>>>1)&1;if((b[a+160>>1]&56)==8){mk(a,d);return}else{nk(a,d);return}}function Wl(a){a=a|0;var c=0,d=0;c=e[a+166>>1]|0;if(((c>>>3^c>>>1)&1|0)==0){d=c>>>2&1^1}else{d=0}if((b[a+160>>1]&56)==8){mk(a,d);return}else{nk(a,d);return}}function Xl(a){a=a|0;var c=0,d=0;c=e[a+166>>1]|0;if(((c>>>3^c>>>1)&1|0)==0){d=c>>>2&1}else{d=1}if((b[a+160>>1]&56)==8){mk(a,d);return}else{nk(a,d);return}}function Yl(a){a=a|0;qn(a,1);return}function Zl(d){d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=((b[d+160>>1]&255)!=0?2:4)+(c[d+152>>2]|0)|0;f=d+148|0;g=(c[f>>2]|0)-4|0;h=g&16777215;i=h+3|0;if(i>>>0<(c[d+36>>2]|0)>>>0){j=d+32|0;a[(c[j>>2]|0)+h|0]=e>>>24;a[(c[j>>2]|0)+(h+1)|0]=e>>>16;a[(c[j>>2]|0)+(h+2)|0]=e>>>8;a[(c[j>>2]|0)+i|0]=e;c[f>>2]=g;qn(d,1);return}else{pc[c[d+28>>2]&63](c[d+4>>2]|0,h,e);c[f>>2]=g;qn(d,1);return}}function _l(a){a=a|0;var b=0,c=0;b=e[a+166>>1]|0;if((b&1|0)!=0){c=0;qn(a,c);return}c=b>>>2&1^1;qn(a,c);return}function $l(a){a=a|0;var b=0,c=0;b=e[a+166>>1]|0;if((b&1|0)==0){c=b>>>2&1}else{c=1}qn(a,c);return}function am(a){a=a|0;qn(a,(b[a+166>>1]&1^1)&65535);return}function bm(a){a=a|0;qn(a,b[a+166>>1]&1);return}function cm(a){a=a|0;qn(a,((e[a+166>>1]|0)>>>2&1^1)&65535);return}function dm(a){a=a|0;qn(a,(e[a+166>>1]|0)>>>2&1);return}function em(a){a=a|0;qn(a,((e[a+166>>1]|0)>>>1&1^1)&65535);return}function fm(a){a=a|0;qn(a,(e[a+166>>1]|0)>>>1&1);return}function gm(a){a=a|0;qn(a,((e[a+166>>1]|0)>>>3&1^1)&65535);return}function hm(a){a=a|0;qn(a,(e[a+166>>1]|0)>>>3&1);return}function im(a){a=a|0;var b=0;b=e[a+166>>1]|0;qn(a,(b>>>3^b>>>1)&1^1);return}function jm(a){a=a|0;var b=0;b=e[a+166>>1]|0;qn(a,(b>>>3^b>>>1)&1);return}function km(a){a=a|0;var b=0,c=0;b=e[a+166>>1]|0;if(((b>>>3^b>>>1)&1|0)!=0){c=0;qn(a,c);return}c=b>>>2&1^1;qn(a,c);return}function lm(a){a=a|0;var b=0,c=0;b=e[a+166>>1]|0;if(((b>>>3^b>>>1)&1|0)!=0){c=1;qn(a,c);return}c=b>>>2&1;qn(a,c);return}function mm(f){f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;g=f+160|0;h=e[g>>1]|0;i=(h&128|0)!=0?h|-256:h&255;h=f+372|0;c[h>>2]=(c[h>>2]|0)+4;so(f,15,i);c[f+88+(((e[g>>1]|0)>>>9&7)<<2)>>2]=i;i=f+156|0;g=c[i>>2]|0;if((g&1|0)!=0){_j(f,g,0,0);return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;j=g&16777215;g=j+1|0;if(g>>>0<(c[f+36>>2]|0)>>>0){k=c[f+32>>2]|0;l=d[k+j|0]<<8|d[k+g|0]}else{l=sc[c[f+12>>2]&63](c[f+4>>2]|0,j)|0}b[h>>1]=l;if((a[f+336|0]|0)==0){c[i>>2]=(c[i>>2]|0)+2;i=f+152|0;c[i>>2]=(c[i>>2]|0)+2;return}else{Yj(f);return}}function nm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=d[h]|c[k>>2];h=f+372|0;c[h>>2]=(c[h>>2]|0)+8;qo(f,15,j&255);h=f+156|0;l=c[h>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;c[k>>2]=c[k>>2]&-256|j&255;i=g;return}else{Yj(f);i=g;return}}function om(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=e[h>>1]|c[k>>2];h=f+372|0;c[h>>2]=(c[h>>2]|0)+8;ro(f,15,j&65535);h=f+156|0;l=c[h>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;c[k>>2]=c[k>>2]&-65536|j&65535;i=g;return}else{Yj(f);i=g;return}}function pm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=c[h>>2]|c[k>>2];h=f+372|0;c[h>>2]=(c[h>>2]|0)+10;so(f,15,j);h=f+156|0;l=c[h>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;c[k>>2]=j;i=g;return}else{Yj(f);i=g;return}}function qm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=c[k>>2]|0;l=b[h>>1]|0;h=l&65535;if(l<<16>>16==0){l=f+156|0;m=c[l>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}n=f+164|0;b[f+162>>1]=b[n>>1]|0;o=m&16777215;m=o+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+o|0]<<8|d[p+m|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,o)|0}b[n>>1]=q;if((a[f+336|0]|0)==0){c[l>>2]=(c[l>>2]|0)+2;l=f+152|0;c[l>>2]=(c[l>>2]|0)+2;ak(f);i=g;return}else{Yj(f);i=g;return}}l=(j>>>0)/(h>>>0)|0;if(l>>>0>65535>>>0){q=f+166|0;b[q>>1]=b[q>>1]&-4|2}else{c[k>>2]=((j>>>0)%(h>>>0)|0)<<16|l&65535;ro(f,15,l&65535)}l=f+372|0;c[l>>2]=(c[l>>2]|0)+144;l=f+156|0;h=c[l>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}j=f+164|0;b[f+162>>1]=b[j>>1]|0;k=h&16777215;h=k+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+k|0]<<8|d[q+h|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0}b[j>>1]=r;if((a[f+336|0]|0)==0){c[l>>2]=(c[l>>2]|0)+2;l=f+152|0;c[l>>2]=(c[l>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function rm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+24|0;h=g|0;j=g+8|0;k=g+16|0;l=e[f+160>>1]|0;if((l&48|0)!=0){m=c[f+88+((l>>>9&7)<<2)>>2]|0;n=l&63;if((rc[c[20568+(n<<2)>>2]&127](f,n,508,8)|0)!=0){i=g;return}if((Xo(f,k)|0)!=0){i=g;return}n=(d[k]|m)&255;m=f+372|0;c[m>>2]=(c[m>>2]|0)+8;qo(f,15,n);m=f+156|0;k=c[m>>2]|0;if((k&1|0)!=0){_j(f,k,0,0);i=g;return}o=f+164|0;b[f+162>>1]=b[o>>1]|0;p=k&16777215;k=p+1|0;if(k>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+p|0]<<8|d[q+k|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=r;if((a[f+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;m=f+152|0;c[m>>2]=(c[m>>2]|0)+2;_o(f,n)|0;i=g;return}else{Yj(f);i=g;return}}n=l&7;m=l>>>9&7;if((l&8|0)==0){s=m;t=n}else{s=m|32;t=n|32}if((rc[c[20568+(t<<2)>>2]&127](f,t,17,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}if((rc[c[20568+(s<<2)>>2]&127](f,s,17,8)|0)!=0){i=g;return}if((Xo(f,j)|0)!=0){i=g;return}s=a[j]|0;j=a[h]|0;h=f+166|0;t=b[h>>1]|0;n=((s&255)-(j&255)&65535)-((t&65535)>>>4&1)&65535;m=(s&15)>>>0<(j&15)>>>0?n-6&65535:n;n=(m&65535)>>>0>159>>>0?m-96&65535:m;m=f+372|0;c[m>>2]=(c[m>>2]|0)+10;m=n&65535;j=(m&65280|0)==0?t&-18:t|17;b[h>>1]=(m&255|0)==0?j:j&-5;j=f+156|0;m=c[j>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;t=m&16777215;m=t+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){s=c[f+32>>2]|0;u=d[s+t|0]<<8|d[s+m|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,t)|0}b[h>>1]=u;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;_o(f,n&255)|0;i=g;return}else{Yj(f);i=g;return}}function sm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=c[f+88+((j>>>9&7)<<2)>>2]|0;l=j&63;if((rc[c[20568+(l<<2)>>2]&127](f,l,508,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}l=(e[h>>1]|k)&65535;k=f+372|0;c[k>>2]=(c[k>>2]|0)+8;ro(f,15,l);k=f+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}j=f+164|0;b[f+162>>1]=b[j>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;o=d[n+m|0]<<8|d[n+h|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[j>>1]=o;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;$o(f,l)|0;i=g;return}else{Yj(f);i=g;return}}function tm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=c[f+88+((j>>>9&7)<<2)>>2]|0;l=j&63;if((rc[c[20568+(l<<2)>>2]&127](f,l,508,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}l=c[h>>2]|k;k=f+372|0;c[k>>2]=(c[k>>2]|0)+10;so(f,15,l);k=f+156|0;h=c[k>>2]|0;if((h&1|0)!=0){_j(f,h,0,0);i=g;return}j=f+164|0;b[f+162>>1]=b[j>>1]|0;m=h&16777215;h=m+1|0;if(h>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;o=d[n+m|0]<<8|d[n+h|0]}else{o=sc[c[f+12>>2]&63](c[f+4>>2]|0,m)|0}b[j>>1]=o;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;ap(f,l)|0;i=g;return}else{Yj(f);i=g;return}}function um(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=c[k>>2]|0;l=b[h>>1]|0;if(l<<16>>16==0){m=f+156|0;n=c[m>>2]|0;if((n&1|0)!=0){_j(f,n,0,0);i=g;return}o=f+164|0;b[f+162>>1]=b[o>>1]|0;p=n&16777215;n=p+1|0;if(n>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+p|0]<<8|d[q+n|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=r;if((a[f+336|0]|0)==0){c[m>>2]=(c[m>>2]|0)+2;m=f+152|0;c[m>>2]=(c[m>>2]|0)+2;ak(f);i=g;return}else{Yj(f);i=g;return}}m=j>>>31;r=(j|0)<0?-j|0:j;if(l<<16>>16>-1){s=0;t=l}else{j=-l&65535;b[h>>1]=j;s=1;t=j}j=t&65535;t=(r>>>0)/(j>>>0)|0;h=(r>>>0)%(j>>>0)|0;if((m|0)==0){u=h}else{u=-h&65535}h=(s|0)==(m|0)?t:-t|0;t=f+372|0;c[t>>2]=(c[t>>2]|0)+162;t=h&-32768;if((t|0)==0|(t|0)==(-32768|0)){c[k>>2]=u<<16|h&65535;ro(f,15,h&65535)}else{h=f+166|0;b[h>>1]=b[h>>1]&-4|2}h=f+156|0;u=c[h>>2]|0;if((u&1|0)!=0){_j(f,u,0,0);i=g;return}k=f+164|0;b[f+162>>1]=b[k>>1]|0;t=u&16777215;u=t+1|0;if(u>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;v=d[m+t|0]<<8|d[m+u|0]}else{v=sc[c[f+12>>2]&63](c[f+4>>2]|0,t)|0}b[k>>1]=v;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}function vm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=c[k>>2]|0;l=a[h]|0;h=j-(l&255)|0;m=f+372|0;c[m>>2]=(c[m>>2]|0)+8;Co(f,h&255,l,j&255);j=f+156|0;l=c[j>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;c[k>>2]=c[k>>2]&-256|h&255;i=g;return}else{Yj(f);i=g;return}}function wm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=c[k>>2]|0;l=b[h>>1]|0;h=j-(l&65535)|0;m=f+372|0;c[m>>2]=(c[m>>2]|0)+8;Do(f,h&65535,l,j&65535);j=f+156|0;l=c[j>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;c[k>>2]=c[k>>2]&-65536|h&65535;i=g;return}else{Yj(f);i=g;return}}function xm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}k=f+88+((j>>>9&7)<<2)|0;j=c[k>>2]|0;l=c[h>>2]|0;h=j-l|0;m=f+372|0;c[m>>2]=(c[m>>2]|0)+10;Eo(f,h,l,j);j=f+156|0;l=c[j>>2]|0;if((l&1|0)!=0){_j(f,l,0,0);i=g;return}m=f+164|0;b[f+162>>1]=b[m>>1]|0;n=l&16777215;l=n+1|0;if(l>>>0<(c[f+36>>2]|0)>>>0){o=c[f+32>>2]|0;p=d[o+n|0]<<8|d[o+l|0]}else{p=sc[c[f+12>>2]&63](c[f+4>>2]|0,n)|0}b[m>>1]=p;if((a[f+336|0]|0)==0){c[j>>2]=(c[j>>2]|0)+2;j=f+152|0;c[j>>2]=(c[j>>2]|0)+2;c[k>>2]=h;i=g;return}else{Yj(f);i=g;return}}function ym(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}k=e[h>>1]|0;h=f+120+((j>>>9&7)<<2)|0;j=c[h>>2]|0;l=f+372|0;c[l>>2]=(c[l>>2]|0)+8;l=f+156|0;m=c[l>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}n=f+164|0;b[f+162>>1]=b[n>>1]|0;o=m&16777215;m=o+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+o|0]<<8|d[p+m|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,o)|0}b[n>>1]=q;if((a[f+336|0]|0)==0){c[l>>2]=(c[l>>2]|0)+2;l=f+152|0;c[l>>2]=(c[l>>2]|0)+2;c[h>>2]=j-((k&32768|0)!=0?k|-65536:k);i=g;return}else{Yj(f);i=g;return}}function zm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+24|0;h=g|0;j=g+8|0;k=g+16|0;l=e[f+160>>1]|0;if((l&48|0)!=0){m=c[f+88+((l>>>9&7)<<2)>>2]|0;n=l&63;if((rc[c[20568+(n<<2)>>2]&127](f,n,508,8)|0)!=0){i=g;return}if((Xo(f,k)|0)!=0){i=g;return}n=a[k]|0;k=(n&255)-m&255;o=f+372|0;c[o>>2]=(c[o>>2]|0)+8;Co(f,k,m&255,n);n=f+156|0;m=c[n>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}o=f+164|0;b[f+162>>1]=b[o>>1]|0;p=m&16777215;m=p+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+p|0]<<8|d[q+m|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=r;if((a[f+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;_o(f,k)|0;i=g;return}else{Yj(f);i=g;return}}k=l&7;n=l>>>9&7;if((l&8|0)==0){s=n;t=k}else{s=n|32;t=k|32}if((rc[c[20568+(t<<2)>>2]&127](f,t,17,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}if((rc[c[20568+(s<<2)>>2]&127](f,s,17,8)|0)!=0){i=g;return}if((Xo(f,j)|0)!=0){i=g;return}s=a[j]|0;j=a[h]|0;h=(s-j&255)-((e[f+166>>1]|0)>>>4&1)&255;t=f+372|0;c[t>>2]=(c[t>>2]|0)+8;Fo(f,h,j,s);s=f+156|0;j=c[s>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}t=f+164|0;b[f+162>>1]=b[t>>1]|0;k=j&16777215;j=k+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;u=d[n+k|0]<<8|d[n+j|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0}b[t>>1]=u;if((a[f+336|0]|0)==0){c[s>>2]=(c[s>>2]|0)+2;s=f+152|0;c[s>>2]=(c[s>>2]|0)+2;_o(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Am(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+24|0;h=g|0;j=g+8|0;k=g+16|0;l=e[f+160>>1]|0;if((l&48|0)!=0){m=c[f+88+((l>>>9&7)<<2)>>2]|0;n=l&63;if((rc[c[20568+(n<<2)>>2]&127](f,n,508,16)|0)!=0){i=g;return}if((Yo(f,k)|0)!=0){i=g;return}n=b[k>>1]|0;k=(n&65535)-m&65535;o=f+372|0;c[o>>2]=(c[o>>2]|0)+8;Do(f,k,m&65535,n);n=f+156|0;m=c[n>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}o=f+164|0;b[f+162>>1]=b[o>>1]|0;p=m&16777215;m=p+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+p|0]<<8|d[q+m|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=r;if((a[f+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;$o(f,k)|0;i=g;return}else{Yj(f);i=g;return}}k=l&7;n=l>>>9&7;if((l&8|0)==0){s=n;t=k}else{s=n|32;t=k|32}if((rc[c[20568+(t<<2)>>2]&127](f,t,17,16)|0)!=0){i=g;return}if((Yo(f,h)|0)!=0){i=g;return}if((rc[c[20568+(s<<2)>>2]&127](f,s,17,16)|0)!=0){i=g;return}if((Yo(f,j)|0)!=0){i=g;return}s=b[j>>1]|0;j=b[h>>1]|0;h=(s-j&65535)-((e[f+166>>1]|0)>>>4&1)&65535;t=f+372|0;c[t>>2]=(c[t>>2]|0)+8;Go(f,h,j,s);s=f+156|0;j=c[s>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}t=f+164|0;b[f+162>>1]=b[t>>1]|0;k=j&16777215;j=k+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;u=d[n+k|0]<<8|d[n+j|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0}b[t>>1]=u;if((a[f+336|0]|0)==0){c[s>>2]=(c[s>>2]|0)+2;s=f+152|0;c[s>>2]=(c[s>>2]|0)+2;$o(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Bm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+24|0;h=g|0;j=g+8|0;k=g+16|0;l=e[f+160>>1]|0;if((l&48|0)!=0){m=c[f+88+((l>>>9&7)<<2)>>2]|0;n=l&63;if((rc[c[20568+(n<<2)>>2]&127](f,n,508,32)|0)!=0){i=g;return}if((Zo(f,k)|0)!=0){i=g;return}n=c[k>>2]|0;k=n-m|0;o=f+372|0;c[o>>2]=(c[o>>2]|0)+12;Eo(f,k,m,n);n=f+156|0;m=c[n>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}o=f+164|0;b[f+162>>1]=b[o>>1]|0;p=m&16777215;m=p+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){q=c[f+32>>2]|0;r=d[q+p|0]<<8|d[q+m|0]}else{r=sc[c[f+12>>2]&63](c[f+4>>2]|0,p)|0}b[o>>1]=r;if((a[f+336|0]|0)==0){c[n>>2]=(c[n>>2]|0)+2;n=f+152|0;c[n>>2]=(c[n>>2]|0)+2;ap(f,k)|0;i=g;return}else{Yj(f);i=g;return}}k=l&7;n=l>>>9&7;if((l&8|0)==0){s=n;t=k}else{s=n|32;t=k|32}if((rc[c[20568+(t<<2)>>2]&127](f,t,17,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}if((rc[c[20568+(s<<2)>>2]&127](f,s,17,32)|0)!=0){i=g;return}if((Zo(f,j)|0)!=0){i=g;return}s=c[j>>2]|0;j=c[h>>2]|0;h=s-j-((e[f+166>>1]|0)>>>4&1)|0;t=f+372|0;c[t>>2]=(c[t>>2]|0)+12;Ho(f,h,j,s);s=f+156|0;j=c[s>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}t=f+164|0;b[f+162>>1]=b[t>>1]|0;k=j&16777215;j=k+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){n=c[f+32>>2]|0;u=d[n+k|0]<<8|d[n+j|0]}else{u=sc[c[f+12>>2]&63](c[f+4>>2]|0,k)|0}b[t>>1]=u;if((a[f+336|0]|0)==0){c[s>>2]=(c[s>>2]|0)+2;s=f+152|0;c[s>>2]=(c[s>>2]|0)+2;ap(f,h)|0;i=g;return}else{Yj(f);i=g;return}}function Cm(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+8|0;h=g|0;j=e[f+160>>1]|0;k=j&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4095,32)|0)!=0){i=g;return}if((Zo(f,h)|0)!=0){i=g;return}k=f+120+((j>>>9&7)<<2)|0;j=c[k>>2]|0;l=c[h>>2]|0;h=f+372|0;c[h>>2]=(c[h>>2]|0)+10;h=f+156|0;m=c[h>>2]|0;if((m&1|0)!=0){_j(f,m,0,0);i=g;return}n=f+164|0;b[f+162>>1]=b[n>>1]|0;o=m&16777215;m=o+1|0;if(m>>>0<(c[f+36>>2]|0)>>>0){p=c[f+32>>2]|0;q=d[p+o|0]<<8|d[p+m|0]}else{q=sc[c[f+12>>2]&63](c[f+4>>2]|0,o)|0}b[n>>1]=q;if((a[f+336|0]|0)==0){c[h>>2]=(c[h>>2]|0)+2;h=f+152|0;c[h>>2]=(c[h>>2]|0)+2;c[k>>2]=j-l;i=g;return}else{Yj(f);i=g;return}}function Dm(a){a=a|0;b[a+328>>1]=b[a+160>>1]|0;ek(a);return}function Em(f){f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;j=f+160|0;k=b[j>>1]&63;if((rc[c[20568+(k<<2)>>2]&127](f,k,4093,8)|0)!=0){i=g;return}if((Xo(f,h)|0)!=0){i=g;return}k=c[f+88+(((e[j>>1]|0)>>>9&7)<<2)>>2]|0;j=f+372|0;c[j>>2]=(c[j>>2]|0)+4;j=a[h]|0;zo(f,k-(j&255)&255,j,k&255);k=f+156|0;j=c[k>>2]|0;if((j&1|0)!=0){_j(f,j,0,0);i=g;return}h=f+164|0;b[f+162>>1]=b[h>>1]|0;l=j&16777215;j=l+1|0;if(j>>>0<(c[f+36>>2]|0)>>>0){m=c[f+32>>2]|0;n=d[m+l|0]<<8|d[m+j|0]}else{n=sc[c[f+12>>2]&63](c[f+4>>2]|0,l)|0}b[h>>1]=n;if((a[f+336|0]|0)==0){c[k>>2]=(c[k>>2]|0)+2;k=f+152|0;c[k>>2]=(c[k>>2]|0)+2;i=g;return}else{Yj(f);i=g;return}}









function lA(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(G=n,o)|0}else{if(!m){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(G=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(G=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(G=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((eA(l|0)|0)>>>0);return(G=n,o)|0}p=(dA(l|0)|0)-(dA(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(G=n,o)|0}else{if(!m){r=(dA(l|0)|0)-(dA(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(G=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(G=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(dA(j|0)|0)+33-(dA(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(G=n,o)|0}else{p=eA(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(G=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;H=0}else{g=d|0|0;d=k|e&0;e=_z(g,d,-1,-1)|0;k=G;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;$z(e,k,j,a)|0;b=G;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=$z(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=G;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;D=M;E=L;F=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|F;o=(K<<1|0>>>31)&-2|H;return(G=n,o)|0}function mA(a,b){a=a|0;b=b|0;return kc[a&31](b|0)|0}function nA(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;lc[a&3](b|0,c|0,d|0,e|0,f|0)}function oA(a,b){a=a|0;b=b|0;mc[a&1023](b|0)}function pA(a,b,c){a=a|0;b=b|0;c=c|0;nc[a&511](b|0,c|0)}function qA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return oc[a&127](b|0,c|0,d|0)|0}function rA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;pc[a&63](b|0,c|0,d|0)}function sA(a){a=a|0;qc[a&7]()}function tA(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return rc[a&127](b|0,c|0,d|0,e|0)|0}function uA(a,b,c){a=a|0;b=b|0;c=c|0;return sc[a&63](b|0,c|0)|0}function vA(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return tc[a&7](b|0,c|0,d|0,e|0,f|0)|0}function wA(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;uc[a&7](b|0,c|0,d|0,e|0)}function xA(a){a=a|0;da(0);return 0}function yA(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;da(1)}function zA(a){a=a|0;da(2)}function AA(a,b){a=a|0;b=b|0;da(3)}function BA(a,b,c){a=a|0;b=b|0;c=c|0;da(4);return 0}function CA(a,b,c){a=a|0;b=b|0;c=c|0;da(5)}function DA(){da(6)}function EA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;da(7);return 0}function FA(a,b){a=a|0;b=b|0;da(8);return 0}function GA(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;da(9);return 0}function HA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;da(10)}




// EMSCRIPTEN_END_FUNCS
var kc=[xA,xA,Jv,xA,Fs,xA,ez,xA,Hz,xA,Nv,xA,xs,xA,is,xA,Bs,xA,qs,xA,ip,xA,xA,xA,xA,xA,xA,xA,xA,xA,xA,xA];var lc=[yA,yA,gg,yA];var mc=[zA,zA,cd,zA,km,zA,Ov,zA,ed,zA,Wk,zA,Fe,zA,un,zA,Zk,zA,Wm,zA,pn,zA,cn,zA,Pf,zA,tl,zA,sm,zA,Al,zA,Om,zA,xk,zA,Xm,zA,ys,zA,dn,zA,ml,zA,xm,zA,Ak,zA,Pk,zA,kn,zA,al,zA,Fz,zA,Nc,zA,Fl,zA,Lm,zA,$m,zA,cz,zA,fm,zA,Er,zA,Un,zA,co,zA,mn,zA,zm,zA,am,zA,rm,zA,Sl,zA,Hk,zA,El,zA,dm,zA,zn,zA,ql,zA,Ok,zA,ul,zA,fl,zA,bn,zA,dw,zA,vk,zA,In,zA,pm,zA,Vl,zA,_l,zA,$k,zA,rs,zA,Ln,zA,Dk,zA,ll,zA,im,zA,Rf,zA,Yk,zA,gz,zA,Am,zA,dd,zA,_f,zA,Jl,zA,Mm,zA,Ik,zA,Hn,zA,Tf,zA,Yr,zA,Uk,zA,jm,zA,Mc,zA,wn,zA,Fn,zA,Gn,zA,zk,zA,ln,zA,_m,zA,pl,zA,Lf,zA,Xn,zA,an,zA,uk,zA,Kn,zA,Tk,zA,gn,zA,Vn,zA,kl,zA,Cn,zA,ho,zA,yk,zA,Ul,zA,Ml,zA,Sf,zA,bl,zA,Ym,zA,Cm,zA,yn,zA,Ee,zA,on,zA,mo,zA,Im,zA,Bm,zA,Nm,zA,Mf,zA,Tl,zA,ld,zA,Wl,zA,em,zA,Mk,zA,ym,zA,mm,zA,io,zA,ol,zA,jo,zA,Dl,zA,Pn,zA,js,zA,fn,zA,nm,zA,Rm,zA,On,zA,Dm,zA,Qn,zA,go,zA,ao,zA,Lk,zA,Jm,zA,Vk,zA,jn,zA,qk,zA,Bn,zA,cm,zA,Kk,zA,Ll,zA,aw,zA,Dn,zA,vl,zA,Vf,zA,Zl,zA,Zm,zA,Wn,zA,Nl,zA,cl,zA,Vm,zA,kd,zA,Ek,zA,hm,zA,nl,zA,Cl,zA,md,zA,Rn,zA,Jz,zA,hz,zA,Il,zA,om,zA,Qm,zA,rl,zA,Wf,zA,zl,zA,eo,zA,Jn,zA,Nn,zA,wk,zA,Bl,zA,en,zA,Kl,zA,gw,zA,Qf,zA,Kf,zA,Nq,zA,lm,zA,Kz,zA,vn,zA,Cs,zA,ko,zA,Um,zA,dl,zA,Xy,zA,yr,zA,Fk,zA,Em,zA,Ty,zA,gl,zA,lo,zA,Rl,zA,fo,zA,pk,zA,Xl,zA,Yn,zA,_n,zA,Jf,zA,En,zA,Xk,zA,qm,zA,Gs,zA,bo,zA,Ge,zA,Hl,zA,An,zA,Nk,zA,Pl,zA,_k,zA,jl,zA,Gk,zA,Ck,zA,nn,zA,hl,zA,bm,zA,Fm,zA,sk,zA,Rk,zA,vm,zA,xn,zA,Mn,zA,Sm,zA,Of,zA,$n,zA,Mr,zA,Kv,zA,Ol,zA,Yl,zA,el,zA,hn,zA,gm,zA,Tm,zA,Gl,zA,um,zA,yl,zA,My,zA,$l,zA,Tn,zA,Ql,zA,Hm,zA,Km,zA,tm,zA,Jk,zA,Bk,zA,Sn,zA,Pm,zA,Nf,zA,tn,zA,rk,zA,sl,zA,wl,zA,Gm,zA,Sk,zA,wm,zA,il,zA,Zn,zA,Uf,zA,Qk,zA,xl,zA,tk,zA,Xf,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA,zA];var nc=[AA,AA,Gi,AA,Ri,AA,yi,AA,oh,AA,$g,AA,sh,AA,Wg,AA,Ih,AA,di,AA,Ae,AA,Oh,AA,Li,AA,Bh,AA,Xg,AA,xi,AA,ri,AA,$i,AA,Yi,AA,ih,AA,mi,AA,xe,AA,zi,AA,ah,AA,ej,AA,th,AA,Rh,AA,Fi,AA,Hh,AA,_h,AA,ni,AA,ii,AA,zd,AA,Vg,AA,Dh,AA,oj,AA,ti,AA,od,AA,Zh,AA,qj,AA,Sg,AA,pi,AA,Ph,AA,qh,AA,bj,AA,hh,AA,we,AA,bh,AA,eh,AA,Ti,AA,Yg,AA,Ci,AA,gh,AA,si,AA,vh,AA,hj,AA,ge,AA,pj,AA,Gh,AA,Zi,AA,cj,AA,Eh,AA,gd,AA,Ug,AA,dh,AA,Pc,AA,bi,AA,Fh,AA,nj,AA,nh,AA,Zg,AA,ce,AA,zh,AA,Ui,AA,Xi,AA,kh,AA,Jh,AA,Xh,AA,cw,AA,gj,AA,mj,AA,Sh,AA,de,AA,kj,AA,ei,AA,fi,AA,_i,AA,dj,AA,jh,AA,ch,AA,De,AA,Tg,AA,Lh,AA,Ei,AA,Rg,AA,yh,AA,mh,AA,vj,AA,Ai,AA,Oi,AA,ve,AA,iw,AA,li,AA,Yh,AA,fj,AA,Th,AA,uj,AA,gi,AA,jj,AA,ue,AA,ui,AA,tj,AA,Kh,AA,Qg,AA,oi,AA,Qi,AA,lh,AA,Mi,AA,Ii,AA,Ch,AA,qe,AA,Vh,AA,Vi,AA,Ad,AA,fh,AA,jp,AA,ki,AA,eg,AA,Di,AA,Uh,AA,ci,AA,ij,AA,Ni,AA,Bi,AA,dg,AA,_g,AA,Qh,AA,Ji,AA,hi,AA,Wi,AA,$h,AA,wi,AA,Be,AA,Ce,AA,Pg,AA,wj,AA,sj,AA,fw,AA,xh,AA,Hi,AA,Si,AA,rh,AA,Wh,AA,Ah,AA,ph,AA,fg,AA,ji,AA,rj,AA,Ki,AA,lj,AA,aj,AA,Nh,AA,Pi,AA,ai,AA,Mh,AA,op,AA,vi,AA,qi,AA,uh,AA,wh,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA,AA];var oc=[BA,BA,ef,BA,dz,BA,af,BA,Hs,BA,nf,BA,Ye,BA,Sr,BA,jf,BA,Ve,BA,Ke,BA,ks,BA,Ir,BA,Lv,BA,lf,BA,bf,BA,Qq,BA,df,BA,ss,BA,bw,BA,ew,BA,Qy,BA,Ue,BA,fz,BA,ls,BA,Is,BA,ts,BA,ff,BA,Gz,BA,nd,BA,zs,BA,hw,BA,As,BA,cf,BA,mf,BA,hf,BA,fd,BA,of,BA,Te,BA,Es,BA,Le,BA,We,BA,kf,BA,Pv,BA,Iz,BA,Ze,BA,Ds,BA,Oc,BA,Xe,BA,$e,BA,_e,BA,gf,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA,BA];var pc=[CA,CA,tp,CA,Qe,CA,Se,CA,fq,CA,eq,CA,Rv,CA,wd,CA,Eq,CA,up,CA,fe,CA,Dq,CA,Cq,CA,sp,CA,gq,CA,ze,CA,Hf,CA,se,CA,Gf,CA,Re,CA,Bq,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA,CA];var qc=[DA,DA,Je,DA,vd,DA,DA,DA];var rc=[EA,EA,Pq,EA,Zy,EA,Qv,EA,Ko,EA,Po,EA,Rr,EA,_r,EA,Jo,EA,Or,EA,Py,EA,Vo,EA,Io,EA,Ny,EA,Mo,EA,Ar,EA,No,EA,zr,EA,Qo,EA,So,EA,Ro,EA,Lo,EA,Wo,EA,Oo,EA,Gr,EA,Mv,EA,Oq,EA,Hr,EA,Fr,EA,Vy,EA,Yy,EA,Uy,EA,To,EA,Uo,EA,Nr,EA,Oy,EA,Zr,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA,EA];var sc=[FA,FA,Oe,FA,pp,FA,dq,FA,Ff,FA,xd,FA,rp,FA,zq,FA,us,FA,Pe,FA,bq,FA,Aq,FA,Ne,FA,yq,FA,Ef,FA,ye,FA,qp,FA,vs,FA,Cd,FA,ms,FA,ns,FA,cq,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA,FA];var tc=[GA,GA,os,GA,ws,GA,GA,GA];var uc=[HA,HA,Qc,HA,te,HA,hd,HA];return{_memset:Rz,_mac_get_sim:td,_strncasecmp:Yz,_strcat:Uz,_free:Nz,_main:Ie,_realloc:Oz,_tolower:Xz,_strlen:Tz,_memcmp:Vz,_malloc:Mz,_memcpy:Sz,_strcasecmp:Zz,_mac_set_msg:Te,_strcpy:Wz,runPostSets:Lc,stackAlloc:vc,stackSave:wc,stackRestore:xc,setThrew:yc,setTempRet0:Bc,setTempRet1:Cc,setTempRet2:Dc,setTempRet3:Ec,setTempRet4:Fc,setTempRet5:Gc,setTempRet6:Hc,setTempRet7:Ic,setTempRet8:Jc,setTempRet9:Kc,dynCall_ii:mA,dynCall_viiiii:nA,dynCall_vi:oA,dynCall_vii:pA,dynCall_iiii:qA,dynCall_viii:rA,dynCall_v:sA,dynCall_iiiii:tA,dynCall_iii:uA,dynCall_iiiiii:vA,dynCall_viiii:wA}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiii": invoke_iiii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiii": invoke_iiiii, "invoke_iii": invoke_iii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_llvm_lifetime_end": _llvm_lifetime_end, "_lseek": _lseek, "_fclose": _fclose, "_SDL_EventState": _SDL_EventState, "_strtoul": _strtoul, "_fflush": _fflush, "_SDL_GetMouseState": _SDL_GetMouseState, "_strtol": _strtol, "_fputc": _fputc, "_fwrite": _fwrite, "_ptsname": _ptsname, "_send": _send, "_tcflush": _tcflush, "_fputs": _fputs, "_emscripten_cancel_main_loop": _emscripten_cancel_main_loop, "_SDL_UnlockAudio": _SDL_UnlockAudio, "_SDL_WasInit": _SDL_WasInit, "_read": _read, "_fileno": _fileno, "_fsync": _fsync, "_signal": _signal, "_SDL_PauseAudio": _SDL_PauseAudio, "_SDL_LockAudio": _SDL_LockAudio, "_strcmp": _strcmp, "_strncmp": _strncmp, "_snprintf": _snprintf, "_fgetc": _fgetc, "_atexit": _atexit, "_close": _close, "_tcsetattr": _tcsetattr, "_strchr": _strchr, "_tcgetattr": _tcgetattr, "_fopen": _fopen, "___setErrNo": ___setErrNo, "_grantpt": _grantpt, "_ftell": _ftell, "_exit": _exit, "_sprintf": _sprintf, "_fcntl": _fcntl, "_SDL_ShowCursor": _SDL_ShowCursor, "_gmtime": _gmtime, "_symlink": _symlink, "_localtime_r": _localtime_r, "_ftruncate": _ftruncate, "_recv": _recv, "_SDL_PollEvent": _SDL_PollEvent, "_SDL_Init": _SDL_Init, "__exit": __exit, "_SDL_WM_GrabInput": _SDL_WM_GrabInput, "_llvm_va_end": _llvm_va_end, "_tzset": _tzset, "_SDL_CreateRGBSurfaceFrom": _SDL_CreateRGBSurfaceFrom, "_printf": _printf, "_unlockpt": _unlockpt, "_pread": _pread, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_poll": _poll, "_open": _open, "_usleep": _usleep, "_SDL_EnableKeyRepeat": _SDL_EnableKeyRepeat, "_puts": _puts, "_SDL_GetVideoInfo": _SDL_GetVideoInfo, "_nanosleep": _nanosleep, "_SDL_Flip": _SDL_Flip, "_SDL_InitSubSystem": _SDL_InitSubSystem, "_strdup": _strdup, "_SDL_GetError": _SDL_GetError, "__formatString": __formatString, "_gettimeofday": _gettimeofday, "_vfprintf": _vfprintf, "_SDL_WM_SetCaption": _SDL_WM_SetCaption, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_SDL_CloseAudio": _SDL_CloseAudio, "_isspace": _isspace, "_llvm_lifetime_start": _llvm_lifetime_start, "__parseInt": __parseInt, "_SDL_OpenAudio": _SDL_OpenAudio, "_localtime": _localtime, "_gmtime_r": _gmtime_r, "_sysconf": _sysconf, "_fread": _fread, "_SDL_WM_ToggleFullScreen": _SDL_WM_ToggleFullScreen, "_abort": _abort, "_fprintf": _fprintf, "_tan": _tan, "__reallyNegative": __reallyNegative, "_posix_openpt": _posix_openpt, "_fseek": _fseek, "_write": _write, "_SDL_UpperBlit": _SDL_UpperBlit, "_truncate": _truncate, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_unlink": _unlink, "_pwrite": _pwrite, "_SDL_FreeSurface": _SDL_FreeSurface, "_time": _time, "_SDL_LockSurface": _SDL_LockSurface, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdout": _stdout, "_stdin": _stdin, "_stderr": _stderr }, buffer);
var _memset = Module["_memset"] = asm["_memset"];
var _mac_get_sim = Module["_mac_get_sim"] = asm["_mac_get_sim"];
var _strncasecmp = Module["_strncasecmp"] = asm["_strncasecmp"];
var _strcat = Module["_strcat"] = asm["_strcat"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strcasecmp = Module["_strcasecmp"] = asm["_strcasecmp"];
var _mac_set_msg = Module["_mac_set_msg"] = asm["_mac_set_msg"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}





