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
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    assert(ret % 2 === 0);
    table.push(func);
    for (var i = 0; i < 2-1; i++) table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
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
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((low>>>0)+((high>>>0)*4294967296)) : ((low>>>0)+((high|0)*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

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
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 268435456;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;


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

STATICTOP = STATIC_BASE + 40960;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });









var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;

























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([0,131,3,0,0,0,0,0,0,130,2,0,0,44,0,0,0,132,4,0,0,4,0,0,0,134,6,0,0,48,0,0,1,132,4,0,0,80,0,0,1,130,2,0,0,46,0,0,1,131,3,0,0,88,0,0,1,134,6,0,0,12,0,0,0,1,2,0,0,24,0,0,0,138,2,0,0,18,0,0,0,129,2,0,0,0,0,0,0,139,2,0,0,20,0,0,0,130,2,0,0,2,0,0,0,2,2,0,0,26,0,0,0,131,2,0,0,4,0,0,0,3,2,0,0,28,0,0,0,132,2,0,0,6,0,0,0,4,2,0,0,30,0,0,0,133,2,0,0,8,0,0,0,5,2,0,0,32,0,0,0,134,2,0,0,10,0,0,0,6,2,0,0,34,0,0,0,135,2,0,0,12,0,0,0,7,2,0,0,36,0,0,0,136,2,0,0,14,0,0,0,8,2,0,0,38,0,0,0,137,2,0,0,16,0,0,1,144,2,0,0,84,0,0,1,135,2,0,0,56,0,0,1,145,2,0,0,86,0,0,1,136,2,0,0,58,0,0,1,146,2,0,0,88,0,0,1,137,2,0,0,60,0,0,1,147,2,0,0,90,0,0,1,138,2,0,0,62,0,0,1,129,2,0,0,22,0,0,1,139,2,0,0,64,0,0,1,130,2,0,0,46,0,0,1,140,2,0,0,66,0,0,1,131,2,0,0,48,0,0,1,141,2,0,0,68,0,0,1,132,2,0,0,50,0,0,1,142,2,0,0,70,0,0,1,133,2,0,0,52,0,0,1,143,2,0,0,72,0,0,1,134,2,0,0,54,0,0,80,0,0,0,0,92,0,0,38,0,0,0,72,0,0,0,8,0,0,0,8,0,0,0,0,4,10,16,50,64,100,200,78,78,79,69,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,104,106,0,0,182,0,0,0,72,99,0,0,42,4,0,0,96,93,0,0,72,0,0,0,112,89,0,0,176,0,0,0,104,84,0,0,240,1,0,0,192,80,0,0,162,1,0,0,16,76,0,0,88,1,0,0,80,138,0,0,192,2,0,0,152,134,0,0,246,0,0,0,8,132,0,0,28,2,0,0,248,129,0,0,46,3,0,0,48,128,0,0,72,3,0,0,192,126,0,0,244,0,0,0,128,125,0,0,88,2,0,0,16,124,0,0,164,0,0,0,208,122,0,0,188,1,0,0,224,120,0,0,34,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,81,0,0,16,77,0,0,72,139,0,0,24,136,0,0,248,132,0,0,0,0,0,0,83,79,70,84,87,65,82,69,32,80,73,82,65,84,69,83,8,95,0,0,136,93,0,0,24,93,0,0,224,92,0,0,240,157,0,0,160,92,0,0,96,92,0,0,16,92,0,0,160,91,0,0,96,91,0,0,16,91,0,0,104,90,0,0,248,89,0,0,144,89,0,0,56,89,0,0,0,85,0,0,224,88,0,0,104,88,0,0,88,81,0,0,248,87,0,0,120,87,0,0,112,76,0,0,240,157,0,0,8,87,0,0,40,100,0,0,96,86,0,0,0,86,0,0,224,138,0,0,136,85,0,0,136,84,0,0,56,135,0,0,240,157,0,0,88,84,0,0,40,94,0,0,232,83,0,0,168,83,0,0,144,132,0,0,112,83,0,0,232,82,0,0,144,130,0,0,184,82,0,0,120,82,0,0,192,92,0,0,120,126,0,0,32,113,0,0,144,104,0,0,200,97,0,0,104,92,0,0,16,88,0,0,88,83,0,0,248,77,0,0,152,75,0,0,40,158,0,0,168,133,0,0,128,131,0,0,136,129,0,0,168,127,0,0,96,126,0,0,40,158,0,0,0,125,0,0,216,123,0,0,120,126,0,0,24,122,0,0,160,120,0,0,40,158,0,0,160,120,0,0,160,119,0,0,40,158,0,0,248,116,0,0,168,115,0,0,200,114,0,0,8,114,0,0,8,113,0,0,72,112,0,0,216,111,0,0,0,111,0,0,120,126,0,0,32,110,0,0,112,109,0,0,40,107,0,0,88,106,0,0,0,0,0,0,63,0,0,0,88,116,0,0,0,0,0,0,40,115,0,0,99,0,1,0,104,114,0,0,128,113,0,0,160,112,0,0,100,0,1,0,16,112,0,0,128,113,0,0,120,111,0,0,105,0,1,0,192,110,0,0,128,113,0,0,176,109,0,0,73,0,1,0,120,108,0,0,128,113,0,0,184,106,0,0,108,0,1,0,16,106,0,0,128,113,0,0,152,105,0,0,112,0,1,0,192,104,0,0,128,113,0,0,232,103,0,0,113,0,0,0,80,103,0,0,0,0,0,0,168,102,0,0,114,0,0,0,40,102,0,0,0,0,0,0,136,101,0,0,82,0,0,0,224,100,0,0,0,0,0,0,112,99,0,0,115,0,1,0,208,98,0,0,120,98,0,0,224,97,0,0,116,0,1,0,112,97,0,0,128,113,0,0,208,96,0,0,118,0,0,0,56,96,0,0,0,0,0,0,208,95,0,0,86,0,0,0,112,95,0,0,0,0,0,0,176,94,0,0,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,124,0,0,184,124,0,0,176,124,0,0,32,124,0,0,8,124,0,0,0,124,0,0,240,123,0,0,232,123,0,0,224,123,0,0,200,123,0,0,184,123,0,0,160,123,0,0,144,123,0,0,224,122,0,0,200,122,0,0,184,122,0,0,128,129,0,0,104,129,0,0,88,129,0,0,40,129,0,0,24,129,0,0,72,128,0,0,40,128,0,0,0,128,0,0,232,127,0,0,192,127,0,0,160,127,0,0,152,127,0,0,144,127,0,0,120,127,0,0,104,127,0,0,224,126,0,0,184,126,0,0,168,126,0,0,128,126,0,0,112,126,0,0,104,126,0,0,80,126,0,0,72,126,0,0,48,126,0,0,40,126,0,0,144,125,0,0,120,125,0,0,104,125,0,0,80,125,0,0,32,125,0,0,24,125,0,0,248,124,0,0,104,133,0,0,72,133,0,0,24,133,0,0,8,133,0,0,64,132,0,0,0,132,0,0,232,131,0,0,208,131,0,0,136,131,0,0,120,131,0,0,96,131,0,0,80,131,0,0,40,131,0,0,224,130,0,0,32,130,0,0,240,129,0,0,1,0,0,0,200,124,0,0,2,0,0,0,144,133,0,0,3,0,0,0,40,117,0,0,4,0,0,0,112,107,0,0,5,0,0,0,240,99,0,0,6,0,0,0,16,94,0,0,7,0,0,0,224,89,0,0,8,0,0,0,240,84,0,0,9,0,0,0,56,81,0,0,10,0,0,0,88,76,0,0,11,0,0,0,200,138,0,0,12,0,0,0,32,135,0,0,13,0,0,0,120,132,0,0,14,0,0,0,112,130,0,0,14,0,0,0,136,128,0,0,15,0,0,0,16,127,0,0,15,0,0,0,192,125,0,0,16,0,0,0,88,124,0,0,17,0,0,0,80,123,0,0,17,0,0,0,120,121,0,0,18,0,0,0,8,120,0,0,19,0,0,0,128,118,0,0,20,0,0,0,120,116,0,0,21,0,0,0,80,115,0,0,22,0,0,0,136,114,0,0,23,0,0,0,144,113,0,0,24,0,0,0,200,112,0,0,25,0,0,0,24,112,0,0,26,0,0,0,160,111,0,0,27,0,0,0,208,110,0,0,28,0,0,0,224,109,0,0,28,0,0,0,152,108,0,0,29,0,0,0,224,106,0,0,29,0,0,0,24,106,0,0,30,0,0,0,184,105,0,0,31,0,0,0,200,104,0,0,32,0,0,0,0,104,0,0,33,0,0,0,88,103,0,0,34,0,0,0,208,102,0,0,35,0,0,0,48,102,0,0,36,0,0,0,168,101,0,0,37,0,0,0,16,101,0,0,38,0,0,0,136,99,0,0,39,0,0,0,216,98,0,0,40,0,0,0,128,98,0,0,41,0,0,0,248,97,0,0,42,0,0,0,128,97,0,0,42,0,0,0,232,96,0,0,43,0,0,0,72,96,0,0,43,0,0,0,240,95,0,0,44,0,0,0,120,95,0,0,45,0,0,0,248,94,0,0,46,0,0,0,128,93,0,0,47,0,0,0,16,93,0,0,48,0,0,0,216,92,0,0,49,0,0,0,152,92,0,0,50,0,0,0,88,92,0,0,51,0,0,0,8,92,0,0,52,0,0,0,152,91,0,0,53,0,0,0,88,91,0,0,54,0,0,0,8,91,0,0,55,0,0,0,88,90,0,0,55,0,0,0,136,89,0,0,56,0,0,0,48,89,0,0,56,0,0,0,208,88,0,0,56,0,0,0,96,88,0,0,57,0,0,0,232,87,0,0,57,0,0,0,112,87,0,0,58,0,0,0,248,86,0,0,58,0,0,0,88,86,0,0,59,0,0,0,248,85,0,0,59,0,0,0,128,85,0,0,60,0,0,0,128,84,0,0,61,0,0,0,80,84,0,0,62,0,0,0,224,83,0,0,63,0,0,0,160,83,0,0,64,0,0,0,104,83,0,0,66,0,0,0,224,82,0,0,65,0,0,0,176,82,0,0,67,0,0,0,112,82,0,0,67,0,0,0,32,82,0,0,68,0,0,0,168,81,0,0,68,0,0,0,216,80,0,0,69,0,0,0,176,80,0,0,69,0,0,0,136,80,0,0,71,0,0,0,40,78,0,0,71,0,0,0,16,78,0,0,73,0,0,0,168,77,0,0,73,0,0,0,136,77,0,0,72,0,0,0,96,77,0,0,72,0,0,0,40,77,0,0,72,0,0,0,216,76,0,0,74,0,0,0,32,76,0,0,75,0,0,0,0,76,0,0,75,0,0,0,224,75,0,0,76,0,0,0,200,75,0,0,77,0,0,0,160,75,0,0,78,0,0,0,72,75,0,0,79,0,0,0,40,75,0,0,79,0,0,0,16,75,0,0,79,0,0,0,96,139,0,0,80,0,0,0,40,139,0,0,81,0,0,0,96,138,0,0,82,0,0,0,64,138,0,0,83,0,0,0,24,138,0,0,84,0,0,0,0,138,0,0,85,0,0,0,232,137,0,0,86,0,0,0,128,137,0,0,87,0,0,0,0,137,0,0,88,0,0,0,216,136,0,0,89,0,0,0,168,136,0,0,90,0,0,0,224,135,0,0,91,0,0,0,224,134,0,0,92,0,0,0,72,134,0,0,93,0,0,0,16,134,0,0,94,0,0,0,216,133,0,0,95,0,0,0,184,133,0,0,96,0,0,0,120,133,0,0,97,0,0,0,96,133,0,0,98,0,0,0,48,133,0,0,99,0,0,0,16,133,0,0,100,0,0,0,240,132,0,0,101,0,0,0,56,132,0,0,102,0,0,0,248,131,0,0,103,0,0,0,224,131,0,0,104,0,0,0,192,131,0,0,105,0,0,0,144,131,0,0,106,0,0,0,104,131,0,0,107,0,0,0,88,131,0,0,108,0,0,0,72,131,0,0,109,0,0,0,232,130,0,0,110,0,0,0,184,130,0,0,111,0,0,0,16,130,0,0,112,0,0,0,232,129,0,0,113,0,0,0,184,129,0,0,114,0,0,0,160,129,0,0,115,0,0,0,144,129,0,0,116,0,0,0,112,129,0,0,117,0,0,0,96,129,0,0,118,0,0,0,72,129,0,0,119,0,0,0,32,129,0,0,120,0,0,0,8,129,0,0,121,0,0,0,64,128,0,0,122,0,0,0,32,128,0,0,123,0,0,0,248,127,0,0,124,0,0,0,224,127,0,0,0,0,0,0,0,0,0,0,27,0,0,0,1,0,0,0,58,4,0,0,2,0,0,0,59,4,0,0,3,0,0,0,60,4,0,0,4,0,0,0,61,4,0,0,5,0,0,0,62,4,0,0,6,0,0,0,63,4,0,0,7,0,0,0,64,4,0,0,8,0,0,0,65,4,0,0,9,0,0,0,66,4,0,0,10,0,0,0,67,4,0,0,11,0,0,0,68,4,0,0,12,0,0,0,69,4,0,0,13,0,0,0,70,4,0,0,14,0,0,0,71,4,0,0,15,0,0,0,72,4,0,0,16,0,0,0,96,0,0,0,17,0,0,0,49,0,0,0,18,0,0,0,50,0,0,0,19,0,0,0,51,0,0,0,20,0,0,0,52,0,0,0,21,0,0,0,53,0,0,0,22,0,0,0,54,0,0,0,23,0,0,0,55,0,0,0,24,0,0,0,56,0,0,0,25,0,0,0,57,0,0,0,26,0,0,0,48,0,0,0,27,0,0,0,45,0,0,0,28,0,0,0,61,0,0,0,29,0,0,0,187,0,0,0,29,0,0,0,8,0,0,0,30,0,0,0,9,0,0,0,31,0,0,0,113,0,0,0,32,0,0,0,119,0,0,0,33,0,0,0,101,0,0,0,34,0,0,0,114,0,0,0,35,0,0,0,116,0,0,0,36,0,0,0,121,0,0,0,37,0,0,0,117,0,0,0,38,0,0,0,105,0,0,0,39,0,0,0,111,0,0,0,40,0,0,0,112,0,0,0,41,0,0,0,91,0,0,0,42,0,0,0,93,0,0,0,43,0,0,0,13,0,0,0,44,0,0,0,57,4,0,0,45,0,0,0,97,0,0,0,46,0,0,0,115,0,0,0,47,0,0,0,100,0,0,0,48,0,0,0,102,0,0,0,49,0,0,0,103,0,0,0,50,0,0,0,104,0,0,0,51,0,0,0,106,0,0,0,52,0,0,0,107,0,0,0,53,0,0,0,108,0,0,0,54,0,0,0,59,0,0,0,55,0,0,0,186,0,0,0,55,0,0,0,39,0,0,0,56,0,0,0,92,0,0,0,57,0,0,0,220,0,0,0,57,0,0,0,225,4,0,0,58,0,0,0,60,0,0,0,59,0,0,0,122,0,0,0,60,0,0,0,120,0,0,0,61,0,0,0,99,0,0,0,62,0,0,0,118,0,0,0,63,0,0,0,98,0,0,0,64,0,0,0,110,0,0,0,66,0,0,0,109,0,0,0,65,0,0,0,44,0,0,0,67,0,0,0,46,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,229,4,0,0,70,0,0,0,224,4,0,0,71,0,0,0,227,4,0,0,73,0,0,0,227,4,0,0,72,0,0,0,226,4,0,0,75,0,0,0,1,5,0,0,74,0,0,0,32,0,0,0,76,0,0,0,230,4,0,0,77,0,0,0,231,4,0,0,78,0,0,0,231,4,0,0,79,0,0,0,118,4,0,0,80,0,0,0,228,4,0,0,81,0,0,0,83,4,0,0,82,0,0,0,84,4,0,0,83,0,0,0,85,4,0,0,84,0,0,0,86,4,0,0,85,0,0,0,95,4,0,0,86,0,0,0,96,4,0,0,87,0,0,0,97,4,0,0,88,0,0,0,87,4,0,0,89,0,0,0,92,4,0,0,90,0,0,0,93,4,0,0,91,0,0,0,94,4,0,0,92,0,0,0,89,4,0,0,93,0,0,0,90,4,0,0,94,0,0,0,91,4,0,0,95,0,0,0,88,4,0,0,96,0,0,0,98,4,0,0,97,0,0,0,99,4,0,0,98,0,0,0,73,4,0,0,99,0,0,0,74,4,0,0,100,0,0,0,75,4,0,0,101,0,0,0,127,0,0,0,102,0,0,0,77,4,0,0,103,0,0,0,78,4,0,0,104,0,0,0,82,4,0,0,105,0,0,0,80,4,0,0,106,0,0,0,81,4,0,0,107,0,0,0,79,4,0,0,108,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,129,0,0,0,0,0,0,0,18,0,0,0,1,0,2,0,0,0,1,0,130,0,0,0,0,0,0,0,19,0,0,0,1,0,3,0,0,0,1,0,131,0,0,0,0,0,0,0,20,0,0,0,1,0,4,0,0,0,1,0,132,0,0,0,0,0,0,0,21,0,0,0,1,0,5,0,0,0,1,0,133,0,0,0,0,0,0,0,22,0,0,0,1,0,6,0,0,0,1,0,134,0,0,0,0,0,0,0,23,0,0,0,1,0,7,0,0,0,1,0,135,0,0,0,0,0,0,0,24,0,0,0,1,0,8,0,0,0,1,0,136,0,0,0,0,0,0,0,25,0,0,0,1,0,9,0,0,0,1,0,137,0,0,0,0,0,0,0,26,0,0,0,1,0,10,0,0,0,1,0,138,0,0,0,0,0,0,0,27,0,0,0,1,0,11,0,0,0,1,0,139,0,0,0,0,0,0,0,28,0,0,0,1,0,12,0,0,0,1,0,140,0,0,0,0,0,0,0,29,0,0,0,1,0,13,0,0,0,1,0,141,0,0,0,0,0,0,0,30,0,0,0,1,0,14,0,0,0,1,0,142,0,0,0,0,0,0,0,31,0,0,0,1,0,15,0,0,0,1,0,143,0,0,0,0,0,0,0,32,0,0,0,1,0,16,0,0,0,1,0,144,0,0,0,0,0,0,0,33,0,0,0,1,0,17,0,0,0,1,0,145,0,0,0,0,0,0,0,34,0,0,0,1,0,18,0,0,0,1,0,146,0,0,0,0,0,0,0,35,0,0,0,1,0,19,0,0,0,1,0,147,0,0,0,0,0,0,0,36,0,0,0,1,0,20,0,0,0,1,0,148,0,0,0,0,0,0,0,37,0,0,0,1,0,21,0,0,0,1,0,149,0,0,0,0,0,0,0,38,0,0,0,1,0,22,0,0,0,1,0,150,0,0,0,0,0,0,0,39,0,0,0,1,0,23,0,0,0,1,0,151,0,0,0,0,0,0,0,40,0,0,0,1,0,24,0,0,0,1,0,152,0,0,0,0,0,0,0,41,0,0,0,1,0,25,0,0,0,1,0,153,0,0,0,0,0,0,0,42,0,0,0,1,0,26,0,0,0,1,0,154,0,0,0,0,0,0,0,43,0,0,0,1,0,27,0,0,0,1,0,155,0,0,0,0,0,0,0,44,0,0,0,1,0,28,0,0,0,1,0,156,0,0,0,0,0,0,0,71,0,0,0,1,0,29,0,0,0,1,0,157,0,0,0,0,0,0,0,81,0,0,0,1,0,29,0,0,0,1,0,157,0,0,0,0,0,0,0,46,0,0,0,1,0,30,0,0,0,1,0,158,0,0,0,0,0,0,0,47,0,0,0,1,0,31,0,0,0,1,0,159,0,0,0,0,0,0,0,48,0,0,0,1,0,32,0,0,0,1,0,160,0,0,0,0,0,0,0,49,0,0,0,1,0,33,0,0,0,1,0,161,0,0,0,0,0,0,0,50,0,0,0,1,0,34,0,0,0,1,0,162,0,0,0,0,0,0,0,51,0,0,0,1,0,35,0,0,0,1,0,163,0,0,0,0,0,0,0,52,0,0,0,1,0,36,0,0,0,1,0,164,0,0,0,0,0,0,0,53,0,0,0,1,0,37,0,0,0,1,0,165,0,0,0,0,0,0,0,54,0,0,0,1,0,38,0,0,0,1,0,166,0,0,0,0,0,0,0,55,0,0,0,1,0,39,0,0,0,1,0,167,0,0,0,0,0,0,0,56,0,0,0,1,0,40,0,0,0,1,0,168,0,0,0,0,0,0,0,17,0,0,0,1,0,41,0,0,0,1,0,169,0,0,0,0,0,0,0,58,0,0,0,1,0,42,0,0,0,1,0,170,0,0,0,0,0,0,0,57,0,0,0,1,0,43,0,0,0,1,0,171,0,0,0,0,0,0,0,60,0,0,0,1,0,44,0,0,0,1,0,172,0,0,0,0,0,0,0,61,0,0,0,1,0,45,0,0,0,1,0,173,0,0,0,0,0,0,0,62,0,0,0,1,0,46,0,0,0,1,0,174,0,0,0,0,0,0,0,63,0,0,0,1,0,47,0,0,0,1,0,175,0,0,0,0,0,0,0,64,0,0,0,1,0,48,0,0,0,1,0,176,0,0,0,0,0,0,0,66,0,0,0,1,0,49,0,0,0,1,0,177,0,0,0,0,0,0,0,65,0,0,0,1,0,50,0,0,0,1,0,178,0,0,0,0,0,0,0,67,0,0,0,1,0,51,0,0,0,1,0,179,0,0,0,0,0,0,0,68,0,0,0,1,0,52,0,0,0,1,0,180,0,0,0,0,0,0,0,69,0,0,0,1,0,53,0,0,0,1,0,181,0,0,0,0,0,0,0,70,0,0,0,1,0,54,0,0,0,1,0,182,0,0,0,0,0,0,0,75,0,0,0,1,0,56,0,0,0,1,0,184,0,0,0,0,0,0,0,76,0,0,0,1,0,57,0,0,0,1,0,185,0,0,0,0,0,0,0,45,0,0,0,1,0,58,0,0,0,1,0,186,0,0,0,0,0,0,0,2,0,0,0,1,0,59,0,0,0,1,0,187,0,0,0,0,0,0,0,3,0,0,0,1,0,60,0,0,0,1,0,188,0,0,0,0,0,0,0,4,0,0,0,1,0,61,0,0,0,1,0,189,0,0,0,0,0,0,0,5,0,0,0,1,0,62,0,0,0,1,0,190,0,0,0,0,0,0,0,6,0,0,0,1,0,63,0,0,0,1,0,191,0,0,0,0,0,0,0,7,0,0,0,1,0,64,0,0,0,1,0,192,0,0,0,0,0,0,0,8,0,0,0,1,0,65,0,0,0,1,0,193,0,0,0,0,0,0,0,9,0,0,0,1,0,66,0,0,0,1,0,194,0,0,0,0,0,0,0,10,0,0,0,1,0,67,0,0,0,1,0,195,0,0,0,0,0,0,0,11,0,0,0,1,0,68,0,0,0,1,0,196,0,0,0,0,0,0,0,100,0,0,0,1,0,71,0,0,0,1,0,199,0,0,0,0,0,0,0,105,0,0,0,1,0,72,0,0,0,1,0,200,0,0,0,0,0,0,0,85,0,0,0,1,0,74,0,0,0,1,0,202,0,0,0,0,0,0,0,106,0,0,0,1,0,75,0,0,0,1,0,203,0,0,0,0,0,0,0,108,0,0,0,1,0,77,0,0,0,1,0,205,0,0,0,0,0,0,0,89,0,0,0,1,0,78,0,0,0,1,0,206,0,0,0,0,0,0,0,107,0,0,0,1,0,80,0,0,0,1,0,208,0,0,0,0,0,0,0,99,0,0,0,1,0,82,0,0,0,1,0,210,0,0,0,0,0,0,0,102,0,0,0,1,0,83,0,0,0,1,0,211,0,0,0,0,0,0,0,59,0,0,0,1,0,96,0,0,0,1,0,224,0,0,0,0,0,0,0,104,0,0,0,1,0,97,0,0,0,1,0,225,0,0,0,0,0,0,0,103,0,0,0,1,0,98,0,0,0,1,0,226,0,0,0,0,0,0,0,83,0,0,0,1,0,101,0,0,0,1,0,229,0,0,0,0,0,0,0,84,0,0,0,1,0,102,0,0,0,1,0,230,0,0,0,0,0,0,0,86,0,0,0,1,0,103,0,0,0,1,0,231,0,0,0,0,0,0,0,87,0,0,0,1,0,104,0,0,0,1,0,232,0,0,0,0,0,0,0,88,0,0,0,1,0,105,0,0,0,1,0,233,0,0,0,0,0,0,0,90,0,0,0,1,0,106,0,0,0,1,0,234,0,0,0,0,0,0,0,91,0,0,0,1,0,107,0,0,0,1,0,235,0,0,0,0,0,0,0,92,0,0,0,1,0,108,0,0,0,1,0,236,0,0,0,0,0,0,0,93,0,0,0,1,0,109,0,0,0,1,0,237,0,0,0,0,0,0,0,94,0,0,0,1,0,110,0,0,0,1,0,238,0,0,0,0,0,0,0,95,0,0,0,1,0,111,0,0,0,1,0,239,0,0,0,0,0,0,0,97,0,0,0,1,0,112,0,0,0,1,0,240,0,0,0,0,0,0,0,98,0,0,0,1,0,113,0,0,0,1,0,241,0,0,0,0,0,0,0,96,0,0,0,1,0,114,0,0,0,1,0,242,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,5,0,0,0,87,0,0,0,1,0,0,0,88,0,0,0,9,0,0,0,90,0,0,0,4,0,0,0,92,0,0,0,8,0,0,0,93,0,0,0,6,0,0,0,94,0,0,0,2,0,0,0,95,0,0,0,10,0,0,0,97,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,112,0,0,0,162,3,0,0,48,4,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,140,1,0,0,220,0,0,0,96,0,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,12,4,0,0,138,3,0,0,18,1,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,144,2,0,0,12,3,0,0,136,3,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,198,0,0,0,64,1,0,0,8,4,0,0,94,2,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,128,2,0,0,218,1,0,0,116,3,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,230,0,0,0,98,0,0,0,44,4,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,170,3,0,0,206,3,0,0,122,1,0,0,0,0,0,0,118,1,0,0,226,1,0,0,210,2,0,0,68,0,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,0,0,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,70,1,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,14,0,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,66,2,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,44,1,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,114,0,0,0,28,0,0,0,130,3,0,0,12,1,0,0,104,0,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,136,2,0,0,2,3,0,0,202,3,0,0,172,3,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,28,3,0,0,150,3,0,0,34,4,0,0,132,3,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,130,1,0,0,20,1,0,0,86,0,0,0,148,2,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,192,3,0,0,100,1,0,0,228,0,0,0,184,2,0,0,0,0,0,0,0,0,0,0,150,1,0,0,18,4,0,0,58,0,0,0,234,0,0,0,238,3,0,0,22,4,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,0,0,0,0,0,0,0,0,46,4,0,0,230,3,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,0,0,0,0,196,2,0,0,64,0,0,0,214,2,0,0,0,0,0,0,0,0,0,0,150,1,0,0,78,2,0,0,154,2,0,0,246,1,0,0,106,1,0,0,118,0,0,0,224,3,0,0,168,3,0,0,174,2,0,0,58,1,0,0,154,2,0,0,246,1,0,0,106,1,0,0,222,2,0,0,224,3,0,0,168,3,0,0,174,2,0,0,98,2,0,0,154,2,0,0,246,1,0,0,106,1,0,0,146,1,0,0,224,3,0,0,168,3,0,0,174,2,0,0,130,2,0,0,154,2,0,0,246,1,0,0,106,1,0,0,190,3,0,0,224,3,0,0,168,3,0,0,174,2,0,0,128,3,0,0,154,2,0,0,246,1,0,0,106,1,0,0,246,3,0,0,224,3,0,0,168,3,0,0,174,2,0,0,38,3,0,0,154,2,0,0,246,1,0,0,106,1,0,0,190,0,0,0,224,3,0,0,168,3,0,0,174,2,0,0,16,3,0,0,154,2,0,0,246,1,0,0,106,1,0,0,142,1,0,0,224,3,0,0,168,3,0,0,174,2,0,0,8,1,0,0,154,2,0,0,246,1,0,0,106,1,0,0,214,1,0,0,224,3,0,0,168,3,0,0,174,2,0,0,52,3,0,0,198,3,0,0,198,3,0,0,198,3,0,0,198,3,0,0,114,2,0,0,114,2,0,0,114,2,0,0,114,2,0,0,10,1,0,0,10,1,0,0,10,1,0,0,10,1,0,0,242,3,0,0,242,3,0,0,242,3,0,0,242,3,0,0,106,0,0,0,106,0,0,0,106,0,0,0,106,0,0,0,152,3,0,0,152,3,0,0,152,3,0,0,152,3,0,0,82,2,0,0,82,2,0,0,82,2,0,0,82,2,0,0,204,0,0,0,204,0,0,0,204,0,0,0,204,0,0,0,216,1,0,0,216,1,0,0,216,1,0,0,216,1,0,0,142,0,0,0,142,0,0,0,142,0,0,0,142,0,0,0,216,3,0,0,216,3,0,0,216,3,0,0,216,3,0,0,146,2,0,0,146,2,0,0,146,2,0,0,146,2,0,0,22,1,0,0,22,1,0,0,22,1,0,0,22,1,0,0,72,1,0,0,72,1,0,0,72,1,0,0,72,1,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,236,2,0,0,236,2,0,0,236,2,0,0,236,2,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,1,0,0,228,1,0,0,228,1,0,0,228,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,24,2,0,0,176,2,0,0,4,1,0,0,78,3,0,0,184,0,0,0,60,0,0,0,4,4,0,0,200,3,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,236,0,0,0,28,4,0,0,90,0,0,0,120,2,0,0,174,0,0,0,50,1,0,0,182,1,0,0,158,1,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,42,2,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,20,3,0,0,158,3,0,0,24,4,0,0,248,3,0,0,180,1,0,0,62,2,0,0,2,4,0,0,124,0,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,62,1,0,0,192,1,0,0,66,0,0,0,14,4,0,0,182,2,0,0,30,2,0,0,178,3,0,0,220,3,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,254,2,0,0,142,2,0,0,32,0,0,0,70,0,0,0,156,1,0,0,122,2,0,0,98,1,0,0,126,0,0,0,112,1,0,0,238,0,0,0,50,0,0,0,82,0,0,0,220,2,0,0,18,2,0,0,124,1,0,0,210,3,0,0,112,1,0,0,238,0,0,0,50,0,0,0,74,2,0,0,220,2,0,0,18,2,0,0,124,1,0,0,102,0,0,0,112,1,0,0,238,0,0,0,50,0,0,0,96,1,0,0,220,2,0,0,18,2,0,0,124,1,0,0,170,0,0,0,112,1,0,0,238,0,0,0,50,0,0,0,142,3,0,0,220,2,0,0,18,2,0,0,124,1,0,0,174,1,0,0,112,1,0,0,238,0,0,0,50,0,0,0,0,0,0,0,220,2,0,0,18,2,0,0,124,1,0,0,0,0,0,0,112,1,0,0,238,0,0,0,50,0,0,0,0,0,0,0,220,2,0,0,18,2,0,0,124,1,0,0,0,0,0,0,112,1,0,0,238,0,0,0,50,0,0,0,0,0,0,0,220,2,0,0,18,2,0,0,124,1,0,0,0,0,0,0,112,1,0,0,238,0,0,0,50,0,0,0,0,0,0,0,220,2,0,0,18,2,0,0,124,1,0,0,0,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,36,1,0,0,36,1,0,0,36,1,0,0,36,1,0,0,36,1,0,0,36,1,0,0,36,1,0,0,36,1,0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,0,0,240,0,0,0,146,3,0,0,146,3,0,0,146,3,0,0,146,3,0,0,146,3,0,0,146,3,0,0,146,3,0,0,146,3,0,0,178,2,0,0,178,2,0,0,178,2,0,0,178,2,0,0,178,2,0,0,178,2,0,0,178,2,0,0,166,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,254,1,0,0,74,3,0,0,156,0,0,0,156,0,0,0,156,0,0,0,156,0,0,0,156,0,0,0,156,0,0,0,156,0,0,0,156,0,0,0,86,2,0,0,86,2,0,0,86,2,0,0,86,2,0,0,86,2,0,0,86,2,0,0,86,2,0,0,86,2,0,0,6,2,0,0,118,2,0,0,154,3,0,0,156,3,0,0,6,1,0,0,194,2,0,0,194,2,0,0,194,2,0,0,126,3,0,0,204,2,0,0,70,2,0,0,250,0,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,110,0,0,0,48,1,0,0,186,1,0,0,60,3,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,42,0,0,0,158,0,0,0,28,1,0,0,36,2,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,152,1,0,0,122,0,0,0,248,2,0,0,66,1,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,16,1,0,0,138,0,0,0,22,2,0,0,212,1,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,216,2,0,0,76,2,0,0,184,1,0,0,66,1,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,30,0,0,0,194,3,0,0,0,1,0,0,66,1,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,180,3,0,0,48,0,0,0,166,0,0,0,38,4,0,0,44,2,0,0,144,1,0,0,214,0,0,0,52,0,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,82,1,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,164,3,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,40,4,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,190,1,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,72,2,0,0,240,3,0,0,100,0,0,0,232,2,0,0,216,0,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,114,1,0,0,188,0,0,0,54,0,0,0,220,1,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,202,2,0,0,50,2,0,0,0,4,0,0,222,3,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,76,0,0,0,200,0,0,0,66,3,0,0,168,0,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,248,1,0,0,156,2,0,0,148,1,0,0,238,2,0,0,66,1,0,0,66,1,0,0,128,1,0,0,184,3,0,0,222,1,0,0,138,2,0,0,232,0,0,0,192,0,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,118,3,0,0,244,3,0,0,154,1,0,0,18,3,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,66,1,0,0,62,0,0,0,2,2,0,0,38,4,0,0,66,1,0,0,66,1,0,0,128,1,0,0,46,2,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,8,2,0,0,170,2,0,0,100,3,0,0,202,0,0,0,32,2,0,0,0,3,0,0,134,2,0,0,202,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,140,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,196,0,0,0,196,0,0,0,196,0,0,0,196,0,0,0,66,1,0,0,66,1,0,0,66,1,0,0,66,1,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,206,2,0,0,252,0,0,0,10,4,0,0,116,0,0,0,78,1,0,0,224,0,0,0,190,2,0,0,6,4,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,120,3,0,0,76,3,0,0,10,0,0,0,154,0,0,0,102,2,0,0,32,3,0,0,52,1,0,0,14,3,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,68,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,180,0,0,0,2,0,0,0,174,3,0,0,226,2,0,0,70,3,0,0,208,3,0,0,78,0,0,0,218,2,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,30,3,0,0,106,2,0,0,36,4,0,0,212,2,0,0,4,0,0,0,176,3,0,0,40,1,0,0,204,1,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,240,2,0,0,108,3,0,0,210,1,0,0,136,0,0,0,116,1,0,0,12,2,0,0,134,0,0,0,214,3,0,0,2,1,0,0,120,1,0,0,14,2,0,0,162,0,0,0,140,2,0,0,234,1,0,0,86,1,0,0,26,3,0,0,2,1,0,0,120,1,0,0,14,2,0,0,180,2,0,0,140,2,0,0,234,1,0,0,86,1,0,0,0,2,0,0,2,1,0,0,120,1,0,0,14,2,0,0,212,3,0,0,140,2,0,0,234,1,0,0,86,1,0,0,238,1,0,0,2,1,0,0,120,1,0,0,14,2,0,0,178,1,0,0,140,2,0,0,234,1,0,0,86,1,0,0,222,0,0,0,2,1,0,0,120,1,0,0,14,2,0,0,110,1,0,0,140,2,0,0,234,1,0,0,86,1,0,0,248,0,0,0,2,1,0,0,120,1,0,0,14,2,0,0,204,3,0,0,140,2,0,0,234,1,0,0,86,1,0,0,144,0,0,0,2,1,0,0,120,1,0,0,14,2,0,0,200,2,0,0,140,2,0,0,234,1,0,0,86,1,0,0,66,1,0,0,2,1,0,0,120,1,0,0,14,2,0,0,158,2,0,0,140,2,0,0,234,1,0,0,86,1,0,0,92,2,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,134,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,3,0,0,212,0,0,0,68,3,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,206,0,0,0,106,3,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,246,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,146,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,166,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,234,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,58,3,0,0,58,3,0,0,58,3,0,0,58,3,0,0,88,0,0,0,88,0,0,0,88,0,0,0,88,0,0,0,54,1,0,0,54,1,0,0,54,1,0,0,54,1,0,0,92,0,0,0,92,0,0,0,92,0,0,0,92,0,0,0,64,2,0,0,64,2,0,0,64,2,0,0,64,2,0,0,122,3,0,0,122,3,0,0,122,3,0,0,122,3,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,30,1,0,0,30,1,0,0,30,1,0,0,30,1,0,0,254,3,0,0,254,3,0,0,254,3,0,0,254,3,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,104,3,0,0,104,3,0,0,104,3,0,0,104,3,0,0,132,2,0,0,132,2,0,0,132,2,0,0,132,2,0,0,44,3,0,0,44,3,0,0,44,3,0,0,44,3,0,0,96,2,0,0,96,2,0,0,96,2,0,0,96,2,0,0,168,1,0,0,168,1,0,0,168,1,0,0,168,1,0,0,208,0,0,0,208,0,0,0,208,0,0,0,208], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([52,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,236,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,242,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,34,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,81,0,0,110,3,0,0,104,123,0,0,114,3,0,0,168,111,0,0,22,3,0,0,200,102,0,0,22,3,0,0,64,96,0,0,112,3,0,0,144,91,0,0,178,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,80,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,80,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,178,5,0,81,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,196,5,0,82,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,214,5,0,83,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,64,6,0,80,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,84,6,0,81,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,104,6,0,82,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,124,6,0,83,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,224,6,0,80,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,246,6,0,81,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,12,7,0,82,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,34,7,0,83,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,100,11,0,81,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,136,11,0,82,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,172,11,0,83,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,168,12,0,81,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,208,12,0,82,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,248,12,0,83,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,13,0,80,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,236,13,0,81,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,24,14,0,82,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,68,14,0,83,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,2,0,40,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,208,2,0,40,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,5,0,40,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,40,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,18,0,80,0,0,0,2,0,0,0,15,0,0,0,0,2,0,0,2,128,0,0,0,128,22,0,80,0,0,0,2,0,0,0,18,0,0,0,0,2,0,0,2,128,0,0,0,0,45,0,80,0,0,0,2,0,0,0,36,0,0,0,0,2,0,0,2,128,0,0,0,64,19,0,77,0,0,0,2,0,0,0,8,0,0,0,0,4,0,0,2,128,0,0,0,233,3,0,77,0,0,0,1,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,210,7,0,77,0,0,0,2,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,114,97,119,0,0,0,0,67,77,80,46,76,0,0,0,83,116,97,114,116,82,105,103,104,116,0,0,0,0,0,0,59,32,0,0,0,0,0,0,83,117,112,101,114,82,105,103,104,116,0,0,0,0,0,0,67,77,80,65,46,87,0,0,69,79,82,46,66,0,0,0,77,101,116,97,82,105,103,104,116,0,0,0,0,0,0,0,37,45,56,115,32,37,115,44,32,37,115,44,32,37,115,0,87,68,49,55,57,88,58,32,82,69,65,68,32,67,82,67,32,69,82,82,79,82,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,67,77,80,77,46,66,0,0,103,0,0,0,0,0,0,0,65,108,116,82,105,103,104,116,0,0,0,0,0,0,0,0,37,45,56,115,32,37,115,44,32,37,115,0,0,0,0,0,69,79,82,46,87,0,0,0,83,112,97,99,101,0,0,0,37,45,56,115,32,37,115,0,66,85,83,69,0,0,0,0,65,108,116,0,0,0,0,0,46,97,110,97,0,0,0,0,67,77,80,77,46,87,0,0,45,40,65,37,117,41,0,0,65,108,116,76,101,102,116,0,69,79,82,46,76,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,77,111,100,101,0,0,0,0,67,77,80,77,46,76,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,114,111,109,115,47,112,99,101,45,99,111,110,102,105,103,46,99,102,103,0,0,0,0,0,70,57,0,0,0,0,0,0,33,61,0,0,0,0,0,0,123,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,98,105,110,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,120,0,0,0,0,0,97,100,100,114,61,48,120,37,48,56,108,120,32,115,105,122,101,61,37,108,117,32,102,105,108,101,61,37,115,10,0,0,104,0,0,0,0,0,0,0,45,45,37,115,0,0,0,0,101,120,112,101,99,116,105,110,103,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,87,105,110,100,111,119,115,76,101,102,116,0,0,0,0,0,116,100,48,58,32,100,114,111,112,112,105,110,103,32,112,104,97,110,116,111,109,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,10,0,0,82,101,108,101,97,115,101,32,51,46,48,55,36,48,0,0,67,77,80,65,46,76,0,0,83,116,97,114,116,76,101,102,116,0,0,0,0,0,0,0,77,85,76,85,46,87,0,0,102,114,97,109,101,95,115,107,105,112,0,0,0,0,0,0,46,112,115,105,0,0,0,0,65,78,68,46,66,0,0,0,83,117,112,101,114,76,101,102,116,0,0,0,0,0,0,0,32,32,32,32,32,0,0,0,114,98,0,0,0,0,0,0,65,66,67,68,46,66,0,0,77,101,116,97,0,0,0,0,37,48,52,88,32,0,0,0,65,78,68,46,87,0,0,0,102,105,108,101,0,0,0,0,77,101,116,97,76,101,102,116,0,0,0,0,0,0,0,0,101,120,99,101,112,116,105,111,110,32,37,48,50,88,32,40,37,115,41,10,0,0,0,0,115,121,109,108,105,110,107,0,87,68,49,55,57,88,58,32,82,69,65,68,32,76,79,83,84,32,68,65,84,65,10,0,65,78,68,46,76,0,0,0,114,117,110,32,117,110,116,105,108,32,101,120,99,101,112,116,105,111,110,0,0,0,0,0,67,116,114,108,0,0,0,0,102,105,108,101,0,0,0,0,101,0,0,0,0,0,0,0,67,116,114,108,76,101,102,116,0,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,10,101,109,117,46,115,116,111,112,10,101,109,117,46,112,97,117,115,101,32,32,32,32,32,32,32,32,32,32,32,32,34,48,34,32,124,32,34,49,34,10,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,10,101,109,117,46,114,101,115,101,116,10,10,101,109,117,46,99,112,117,46,109,111,100,101,108,32,32,32,32,32,32,32,32,34,54,56,48,48,48,34,32,124,32,34,54,56,48,49,48,34,32,124,32,34,54,56,48,50,48,34,10,101,109,117,46,99,112,117,46,115,112,101,101,100,32,32,32,32,32,32,32,32,60,102,97,99,116,111,114,62,10,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,32,32,32,60,97,100,106,117,115,116,109,101,110,116,62,10,10,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,32,32,32,32,32,32,91,60,100,114,105,118,101,62,93,10,101,109,117,46,100,105,115,107,46,101,106,101,99,116,32,32,32,32,32,32,32,60,100,114,105,118,101,62,10,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,32,32,32,32,32,32,60,100,114,105,118,101,62,58,60,102,110,97,109,101,62,10,10,101,109,117,46,112,97,114,46,100,114,105,118,101,114,32,32,32,32,32,32,32,60,100,114,105,118,101,114,62,10,101,109,117,46,112,97,114,46,102,105,108,101,32,32,32,32,32,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,10,101,109,117,46,115,101,114,46,100,114,105,118,101,114,32,32,32,32,32,32,32,60,100,114,105,118,101,114,62,10,101,109,117,46,115,101,114,46,102,105,108,101,32,32,32,32,32,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,10,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,32,32,32,32,32,32,34,48,34,32,124,32,34,49,34,10,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,10,116,101,114,109,46,103,114,97,98,10,116,101,114,109,46,114,101,108,101,97,115,101,10,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,32,32,32,32,32,32,91,60,102,105,108,101,110,97,109,101,62,93,10,116,101,114,109,46,116,105,116,108,101,32,32,32,32,32,32,32,32,32,32,32,60,116,105,116,108,101,62,10,0,0,0,0,0,112,114,111,116,111,99,111,108,0,0,0,0,0,0,0,0,77,85,76,83,46,87,0,0,82,83,69,84,0,0,0,0,47,0,0,0,0,0,0,0,109,105,115,115,105,110,103,32,118,97,108,117,101,10,0,0,65,68,68,65,46,87,0,0,40,65,37,117,41,43,0,0,83,108,97,115,104,0,0,0,37,48,56,108,88,10,0,0,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,0,65,68,68,46,66,0,0,0,46,0,0,0,0,0,0,0,98,97,100,32,114,101,103,105,115,116,101,114,32,40,37,115,41,10,0,0,0,0,0,0,115,100,108,58,32,98,108,105,116,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,70,56,0,0,0,0,0,0,61,61,0,0,0,0,0,0,115,101,99,116,105,111,110,0,109,111,117,115,101,0,0,0,102,0,0,0,0,0,0,0,65,68,68,88,46,66,0,0,115,114,101,99,0,0,0,0,115,99,97,108,101,0,0,0,82,65,77,58,0,0,0,0,99,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,80,101,114,105,111,100,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,37,48,50,88,32,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,0,82,101,108,101,97,115,101,32,51,46,48,50,36,48,0,0,114,98,0,0,0,0,0,0,109,105,115,115,105,110,103,32,114,101,103,105,115,116,101,114,10,0,0,0,0,0,0,0,65,68,68,46,87,0,0,0,44,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,77,79,68,69,61,37,48,52,88,32,32,83,84,65,84,85,83,61,37,48,52,88,32,32,65,68,68,82,61,37,48,54,108,88,10,0,0,0,0,0,115,121,115,116,101,109,0,0,46,112,102,100,99,0,0,0,65,68,68,88,46,87,0,0,67,111,109,109,97,0,0,0,99,111,112,121,32,109,101,109,111,114,121,0,0,0,0,0,114,98,0,0,0,0,0,0,68,77,65,0,0,0,0,0,65,68,68,46,76,0,0,0,114,98,0,0,0,0,0,0,108,111,103,0,0,0,0,0,109,0,0,0,0,0,0,0,115,114,99,32,100,115,116,32,99,110,116,0,0,0,0,0,77,69,77,0,0,0,0,0,68,79,83,69,77,85,0,0,65,68,68,88,46,76,0,0,110,0,0,0,0,0,0,0,101,118,97,108,117,97,116,101,32,101,120,112,114,101,115,115,105,111,110,115,0,0,0,0,67,82,61,37,48,50,88,32,32,83,82,61,37,48,50,88,32,32,84,68,82,61,37,48,50,88,32,32,82,68,82,61,37,48,50,88,32,32,73,82,81,61,37,100,10,0,0,0,87,68,49,55,57,88,58,32,87,82,73,84,69,32,76,79,83,84,32,68,65,84,65,10,0,0,0,0,0,0,0,0,65,68,68,65,46,76,0,0,91,101,120,99,101,112,116,105,111,110,93,0,0,0,0,0,98,0,0,0,0,0,0,0,91,101,120,112,114,46,46,46,93,0,0,0,0,0,0,0,54,56,53,48,45,65,67,73,65,45,49,0,0,0,0,0,82,79,82,46,66,0,0,0,99,111,109,109,105,116,0,0,118,0,0,0,0,0,0,0,119,114,105,116,101,32,109,101,109,111,114,121,32,116,111,32,97,32,102,105,108,101,0,0,54,56,53,48,45,65,67,73,65,45,48,0,0,0,0,0,82,79,88,82,46,66,0,0,115,115,112,0,0,0,0,0,99,0,0,0,0,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,110,46,46,46,93,0,0,0,0,0,84,77,45,37,115,58,32,67,82,61,37,48,50,88,32,68,82,61,37,48,50,88,47,37,48,50,88,32,68,73,86,61,37,48,52,88,32,67,76,75,61,37,48,52,88,32,79,85,84,61,37,100,32,40,37,117,47,37,117,41,10,0,0,0,76,83,82,46,66,0,0,0,68,0,0,0,0,0,0,0,120,0,0,0,0,0,0,0,113,117,105,116,0,0,0,0,68,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,101,106,101,99,116,0,0,65,83,82,46,66,0,0,0,122,0,0,0,0,0,0,0,115,101,110,100,32,97,32,109,101,115,115,97,103,101,32,116,111,32,116,104,101,32,101,109,117,108,97,116,111,114,32,99,111,114,101,0,0,0,0,0,67,0,0,0,0,0,0,0,115,100,108,58,32,107,101,121,32,61,32,48,120,37,48,52,120,10,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,99,112,117,46,115,112,101,101,100,32,61,32,0,0,0,0,70,55,0,0,0,0,0,0,38,0,0,0,0,0,0,0,101,0,0,0,0,0,0,0,82,79,82,46,76,0,0,0,105,104,120,0,0,0,0,0,109,105,110,95,104,0,0,0,100,101,102,97,117,108,116,0,111,102,102,115,101,116,0,0,44,32,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,66,76,75,32,37,48,52,88,58,32,65,49,61,37,48,56,108,88,32,65,50,61,37,48,56,108,88,32,83,61,37,48,56,108,88,32,82,79,61,37,100,10,0,0,0,0,0,0,58,0,0,0,0,0,0,0,60,0,0,0,0,0,0,0,109,115,103,32,91,118,97,108,93,0,0,0,0,0,0,0,116,100,48,58,32,115,101,99,116,111,114,32,99,114,99,32,111,118,101,114,32,104,101,97,100,101,114,43,100,97,116,97,10,0,0,0,0,0,0,0,99,112,50,58,32,119,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,67,80,50,32,118,101,114,115,105,111,110,10,0,0,0,0,0,0,66,0,0,0,0,0,0,0,82,79,88,82,46,76,0,0,76,101,115,115,0,0,0,0,114,101,97,100,32,97,32,102,105,108,101,32,105,110,116,111,32,109,101,109,111,114,121,0,65,0,0,0,0,0,0,0,115,121,115,116,101,109,32,116,111,111,32,115,108,111,119,44,32,115,107,105,112,112,105,110,103,32,49,32,115,101,99,111,110,100,10,0,0,0,0,0,46,109,115,97,0,0,0,0,76,83,82,46,76,0,0,0,83,104,105,102,116,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,91,110,93,93,0,0,0,0,0,0,85,65,82,84,58,32,80,65,82,61,37,117,37,99,37,117,32,85,67,82,61,37,48,50,88,32,82,83,82,61,37,48,50,88,32,82,68,82,61,37,48,50,88,32,84,83,82,61,37,48,50,88,32,84,68,82,61,37,48,50,88,32,82,67,76,75,61,37,117,47,37,117,32,83,67,76,75,61,37,117,47,37,117,10,0,0,0,0,115,116,58,32,114,101,115,101,116,10,0,0,0,0,0,0,121,100,105,118,0,0,0,0,65,83,82,46,76,0,0,0,119,0,0,0,0,0,0,0,83,104,105,102,116,76,101,102,116,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,0,0,0,0,0,0,73,78,84,82,58,32,73,82,82,61,37,48,52,88,32,73,69,82,61,37,48,52,88,32,73,80,82,61,37,48,52,88,32,73,77,82,61,37,48,52,88,32,73,83,82,61,37,48,52,88,32,73,86,82,61,37,48,50,88,32,86,69,67,61,37,48,50,88,32,73,82,81,61,37,100,10,0,0,0,0,65,83,82,46,87,0,0,0,92,0,0,0,0,0,0,0,102,105,110,100,32,98,121,116,101,115,32,105,110,32,109,101,109,111,114,121,0,0,0,0,71,80,73,80,58,32,73,78,80,61,37,48,50,88,47,37,48,50,88,32,79,85,84,61,37,48,50,88,32,65,69,82,61,37,48,50,88,32,68,68,82,61,37,48,50,88,10,0,87,68,49,55,57,88,58,32,82,69,65,68,32,65,68,68,82,69,83,83,32,76,79,83,84,32,68,65,84,65,10,0,82,79,76,46,66,0,0,0,66,97,99,107,115,108,97,115,104,0,0,0,0,0,0,0,97,100,100,114,32,99,110,116,32,91,118,97,108,46,46,46,93,0,0,0,0,0,0,0,103,101,0,0,0,0,0,0,54,56,57,48,49,45,77,70,80,0,0,0,0,0,0,0,82,79,88,76,46,66,0,0,87,68,49,55,57,88,58,32,67,77,68,91,37,48,50,88,93,32,83,75,73,80,32,67,79,77,77,65,78,68,32,40,37,48,50,88,47,37,48,50,88,41,10,0,0,0,0,0,39,0,0,0,0,0,0,0,101,110,116,101,114,32,98,121,116,101,115,32,105,110,116,111,32,109,101,109,111,114,121,0,80,65,76,37,88,61,37,48,52,88,32,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,32,32,80,65,76,37,88,61,37,48,52,88,32,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,10,0,0,0,0,0,0,0,76,83,76,46,66,0,0,0,117,115,112,0,0,0,0,0,65,112,111,115,116,114,111,112,104,101,0,0,0,0,0,0,97,100,100,114,32,91,118,97,108,124,115,116,114,105,110,103,46,46,46,93,0,0,0,0,89,61,37,45,51,117,32,32,86,66,49,61,37,45,51,117,32,32,86,66,50,61,37,45,51,117,32,32,37,108,117,32,72,122,10,0,0,0,0,0,65,83,76,46,66,0,0,0,65,0,0,0,0,0,0,0,81,117,111,116,101,0,0,0,100,117,109,112,32,109,101,109,111,114,121,0,0,0,0,0,88,61,37,45,51,117,32,32,72,66,49,61,37,45,51,117,32,32,72,66,50,61,37,45,51,117,32,32,37,108,117,32,72,122,10,0,0,0,0,0,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,0,68,87,0,0,0,0,0,0,59,0,0,0,0,0,0,0,91,97,100,100,114,32,91,99,110,116,93,93,0,0,0,0,66,61,37,48,54,108,88,32,32,65,61,37,48,54,108,88,32,32,72,66,61,37,45,51,100,32,32,86,66,61,37,45,51,100,10,0,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,34,10,0,0,0,0,0,0,70,54,0,0,0,0,0,0,94,0,0,0,0,0,0,0,60,110,108,62,0,0,0,0,100,0,0,0,0,0,0,0,82,79,76,46,76,0,0,0,105,104,101,120,0,0,0,0,109,105,110,95,119,0,0,0,115,105,122,101,0,0,0,0,97,117,116,111,0,0,0,0,32,32,45,37,99,0,0,0,115,116,114,105,110,103,32,116,111,111,32,108,111,110,103,0,101,120,112,101,99,116,105,110,103,32,97,100,100,114,101,115,115,0,0,0,0,0,0,0,83,101,109,105,99,111,108,111,110,0,0,0,0,0,0,0,115,101,116,32,97,110,32,101,120,112,114,101,115,115,105,111,110,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,116,100,48,58,32,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,40,37,117,47,37,117,47,37,117,32,37,117,41,10,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,100,97,116,97,41,10,0,0,99,112,50,58,32,110,111,116,32,97,32,67,80,50,32,102,105,108,101,10,0,0,0,0,86,73,68,69,79,0,0,0,82,79,88,76,46,76,0,0,108,0,0,0,0,0,0,0,101,120,112,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,117,110,107,110,111,119,110,32,99,111,109,112,111,110,101,110,116,32,40,37,115,41,10,0,37,48,50,88,0,0,0,0,46,105,109,103,0,0,0,0,76,83,76,46,76,0,0,0,107,0,0,0,0,0,0,0,98,115,120,0,0,0,0,0,118,105,100,101,111,0,0,0,46,116,99,0,0,0,0,0,115,101,114,99,111,110,0,0,121,109,117,108,0,0,0,0,65,83,76,46,76,0,0,0,115,116,100,105,111,0,0,0,106,0,0,0,0,0,0,0,115,101,116,32,97,110,32,97,100,100,114,101,115,115,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,0,0,0,109,102,112,0,0,0,0,0,54,56,48,50,48,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,97,105,108,101,100,10,0,0,0,65,83,76,46,87,0,0,0,104,0,0,0,0,0,0,0,97,100,100,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,97,99,105,97,49,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,84,82,65,67,75,32,76,79,83,84,32,68,65,84,65,10,0,0,0,76,83,82,46,87,0,0,0,103,0,0,0,0,0,0,0,98,115,0,0,0,0,0,0,114,117,110,32,119,105,116,104,32,98,114,101,97,107,112,111,105,110,116,115,32,97,116,32,97,100,100,114,0,0,0,0,97,99,105,97,48,0,0,0,76,83,76,46,87,0,0,0,102,0,0,0,0,0,0,0,108,105,115,116,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,0,0,0,0,109,101,109,0,0,0,0,0,99,0,0,0,0,0,0,0,82,79,88,82,46,87,0,0,99,99,114,0,0,0,0,0,100,0,0,0,0,0,0,0,98,108,0,0,0,0,0,0,100,109,97,0,0,0,0,0,83,69,82,80,79,82,84,58,0,0,0,0,0,0,0,0,82,79,88,76,46,87,0,0,37,115,37,117,0,0,0,0,115,0,0,0,0,0,0,0,99,108,101,97,114,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,114,32,97,108,108,0,0,0,0,0,0,0,99,112,117,0,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,100,114,105,118,101,114,32,40,37,115,41,10,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,82,79,82,46,87,0,0,0,97,0,0,0,0,0,0,0,91,105,110,100,101,120,93,0,68,48,61,37,48,56,108,88,32,65,48,61,37,48,56,108,88,32,65,54,61,37,48,56,108,88,32,65,55,61,37,48,56,108,88,32,83,82,61,37,48,52,88,91,37,99,37,99,37,99,37,99,37,99,37,99,37,99,93,32,37,48,54,108,88,32,37,115,10,0,0,0,80,65,82,80,79,82,84,58,0,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,99,112,117,46,109,111,100,101,108,32,61,32,34,0,0,0,70,53,0,0,0,0,0,0,94,94,0,0,0,0,0,0,60,101,111,102,62,0,0,0,115,97,118,101,0,0,0,0,82,79,76,46,87,0,0,0,97,117,116,111,0,0,0,0,97,115,112,101,99,116,95,121,0,0,0,0,0,0,0,0,115,105,122,101,107,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,100,105,115,107,41,10,0,0,0,0,0,116,121,112,101,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,45,37,99,41,10,0,0,0,0,0,0,80,114,105,110,116,32,118,101,114,115,105,111,110,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,0,0,0,105,100,101,110,116,105,102,105,101,114,32,116,111,111,32,108,111,110,103,0,0,0,0,0,120,0,0,0,0,0,0,0,110,111,0,0,0,0,0,0,67,97,112,115,76,111,99,107,0,0,0,0,0,0,0,0,98,99,0,0,0,0,0,0,116,100,48,58,32,122,101,114,111,32,100,97,116,97,32,108,101,110,103,116,104,32,40,37,117,47,37,117,47,37,117,41,10,0,0,0,0,0,0,0,37,117,47,37,117,47,37,117,10,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,109,111,100,101,108,32,40,37,115,41,10,0,66,70,84,83,84,0,0,0,118,101,114,115,105,111,110,0,82,101,116,117,114,110,0,0,98,105,111,115,32,40,37,117,44,32,37,117,44,32,37,117,44,32,37,117,41,10,0,0,109,111,100,101,108,61,37,115,32,102,97,115,116,98,111,111,116,61,37,100,10,0,0,0,109,111,100,101,32,115,101,108,101,99,116,58,10,0,0,0,46,105,109,100,0,0,0,0,66,70,69,88,84,85,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,100,101,98,117,103,32,91,110,111,93,0,93,0,0,0,0,0,0,0,98,105,111,115,95,109,101,100,105,97,95,99,104,97,110,103,101,32,40,37,117,41,10,0,83,89,83,84,69,77,58,0,46,112,114,105,0,0,0,0,45,45,0,0,0,0,0,0,120,100,105,118,0,0,0,0,66,70,67,72,71,0,0,0,118,101,114,98,111,115,101,0,112,116,121,0,0,0,0,0,82,105,103,104,116,66,114,97,99,107,101,116,0,0,0,0,98,105,111,115,95,115,101,116,101,120,99,32,40,37,117,44,32,37,108,117,41,10,0,0,113,101,100,58,32,117,110,107,110,111,119,110,32,102,101,97,116,117,114,101,115,32,40,48,120,37,48,56,108,108,120,41,10,0,0,0,0,0,0,0,115,101,114,112,111,114,116,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,100,99,32,105,109,97,103,101,10,0,0,0,0,0,0,0,0,66,70,69,88,84,83,0,0,83,101,116,32,116,104,101,32,116,101,114,109,105,110,97,108,32,100,101,118,105,99,101,0,91,0,0,0,0,0,0,0,98,108,111,99,107,95,99,111,117,110,116,0,0,0,0,0,112,97,114,112,111,114,116,0,98,105,111,115,95,114,119,97,98,115,32,40,37,117,44,32,48,120,37,48,56,108,120,44,32,37,117,44,32,37,117,44,32,37,117,41,10,0,0,0,54,56,48,49,48,0,0,0,87,68,49,55,57,88,58,32,68,61,37,117,32,83,69,76,69,67,84,32,84,82,65,67,75,32,69,82,82,79,82,32,40,99,61,37,117,32,104,61,37,117,41,10,0,0,0,0,66,70,67,76,82,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,76,101,102,116,66,114,97,99,107,101,116,0,0,0,0,0,98,108,111,99,107,95,115,116,97,114,116,0,0,0,0,0,98,105,111,115,95,99,111,110,111,117,116,32,40,37,117,44,32,37,117,41,10,0,0,0,102,97,115,116,98,111,111,116,0,0,0,0,0,0,0,0,91,97,100,100,114,46,46,93,0,0,0,0,0,0,0,0,66,70,83,69,84,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,115,112,101,101,100,0,0,0,0,0,0,0,112,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,118,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,10,0,0,0,0,0,0,98,105,111,115,95,99,111,110,105,110,32,40,37,117,41,10,0,0,0,0,0,0,0,0,109,111,110,111,0,0,0,0,37,48,56,108,88,58,32,101,120,99,101,112,116,105,111,110,32,37,48,50,88,32,40,37,115,41,32,73,87,61,37,48,52,88,10,0,0,0,0,0,36,0,0,0,0,0,0,0,115,112,0,0,0,0,0,0,105,110,116,0,0,0,0,0,111,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,115,0,0,0,0,0,0,0,115,116,0,0,0,0,0,0,49,0,0,0,0,0,0,0,40,91,37,115,44,32,37,115,44,32,37,115,37,115,93,44,32,37,115,41,0,0,0,0,65,37,117,0,0,0,0,0,110,111,110,101,0,0,0,0,115,112,101,101,100,0,0,0,73,0,0,0,0,0,0,0,118,105,100,101,111,58,32,103,101,116,32,56,58,32,37,48,54,108,88,32,45,62,32,37,48,52,88,10,0,0,0,0,118,105,115,105,98,108,101,95,104,0,0,0,0,0,0,0,42,42,42,32,99,97,110,39,116,32,100,101,116,101,114,109,105,110,101,32,82,79,77,32,97,100,100,114,101,115,115,10,0,0,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,40,91,37,115,44,32,37,115,93,44,32,37,115,37,115,44,32,37,115,41,0,0,0,0,78,101,118,101,114,32,115,116,111,112,32,114,117,110,110,105,110,103,32,91,110,111,93,0,117,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,99,0,0,0,0,0,0,0,42,42,42,32,82,65,77,32,110,111,116,32,102,111,117,110,100,32,97,116,32,97,100,100,114,101,115,115,32,48,10,0,110,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,0,10,0,0,0,0,0,0,0,70,52,0,0,0,0,0,0,124,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,73,75,66,68,58,32,85,78,75,78,79,87,78,32,67,79,77,77,65,78,68,58,32,37,48,50,88,10,0,0,0,0,108,111,97,100,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,98,105,110,97,114,121,32,97,100,100,114,61,48,120,37,48,56,108,120,10,0,0,0,0,0,37,115,37,115,37,48,56,88,0,0,0,0,0,0,0,0,97,115,112,101,99,116,95,120,0,0,0,0,0,0,0,0,115,105,122,101,109,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,112,114,105,41,10,0,0,0,0,0,0,100,114,105,118,101,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,45,37,99,41,10,0,0,0,0,0,0,0,42,42,42,32,37,115,32,91,37,115,93,10,0,0,0,0,110,111,45,109,111,110,105,116,111,114,0,0,0,0,0,0,98,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,0,0,0,0,0,0,102,97,108,115,101,0,0,0,121,0,0,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,110,111,32,100,97,116,97,41,10,0,0,0,0,100,105,115,107,0,0,0,0,32,37,48,50,88,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,99,112,117,32,109,111,100,101,108,32,40,37,115,41,10,0,0,0,0,0,98,0,0,0,0,0,0,0,42,37,117,0,0,0,0,0,83,116,97,114,116,32,114,117,110,110,105,110,103,32,105,109,109,101,100,105,97,116,101,108,121,32,91,110,111,93,0,0,116,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,32,40,99,111,119,41,10,0,0,109,111,100,101,108,61,37,115,32,115,112,101,101,100,61,37,100,10,0,0,0,0,0,0,80,67,69,68,73,83,75,32,32,32,32,32,32,32,32,32,0,0,0,0,0,0,0,0,37,48,56,108,88,32,32,37,115,10,0,0,0,0,0,0,46,105,109,97,0,0,0,0,37,115,37,117,37,115,0,0,114,117,110,0,0,0,0,0,114,0,0,0,0,0,0,0,67,80,85,58,0,0,0,0,68,51,61,37,48,56,108,88,32,32,68,55,61,37,48,56,108,88,32,32,65,51,61,37,48,56,108,88,32,32,65,55,61,37,48,56,108,88,32,32,83,83,80,61,37,48,56,108,88,32,32,80,67,52,61,37,48,56,108,88,10,0,0,0,46,112,98,105,116,0,0,0,119,98,0,0,0,0,0,0,45,0,0,0,0,0,0,0,120,109,117,108,0,0,0,0,80,67,0,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,101,114,114,111,114,32,91,110,111,93,0,115,101,114,99,111,110,0,0,101,0,0,0,0,0,0,0,114,119,0,0,0,0,0,0,99,111,109,109,105,116,0,0,115,112,101,101,100,0,0,0,99,111,109,109,105,116,0,0,68,50,61,37,48,56,108,88,32,32,68,54,61,37,48,56,108,88,32,32,65,50,61,37,48,56,108,88,32,32,65,54,61,37,48,56,108,88,32,32,85,83,80,61,37,48,56,108,88,32,32,80,67,51,61,37,48,56,108,88,10,0,0,0,99,111,109,109,105,116,0,0,60,69,65,62,40,37,48,50,88,41,0,0,0,0,0,0,113,117,105,101,116,0,0,0,119,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,109,111,100,101,108,0,0,0,68,49,61,37,48,56,108,88,32,32,68,53,61,37,48,56,108,88,32,32,65,49,61,37,48,56,108,88,32,32,65,53,61,37,48,56,108,88,32,32,80,80,67,61,37,48,56,108,88,32,32,80,67,50,61,37,48,56,108,88,10,0,0,0,87,68,49,55,57,88,58,32,70,79,82,77,65,84,32,76,79,83,84,32,68,65,84,65,10,0,0,0,0,0,0,0,37,115,37,115,37,48,50,88,40,80,67,44,32,37,115,37,117,37,115,42,37,117,41,0,83,101,116,32,116,104,101,32,67,80,85,32,109,111,100,101,108,0,0,0,0,0,0,0,113,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,37,115,32,98,108,111,99,107,115,61,37,108,117,32,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,32,37,115,32,102,105,108,101,61,37,115,10,0,99,112,117,0,0,0,0,0,54,56,48,48,48,0,0,0,68,48,61,37,48,56,108,88,32,32,68,52,61,37,48,56,108,88,32,32,65,48,61,37,48,56,108,88,32,32,65,52,61,37,48,56,108,88,32,32,32,80,67,61,37,48,56,108,88,32,32,80,67,49,61,37,48,56,108,88,10,0,0,0,103,98,0,0,0,0,0,0,37,115,37,48,56,108,88,40,80,67,41,0,0,0,0,0,117,110,107,110,111,119,110,32,67,80,85,32,109,111,100,101,108,32,40,37,115,41,10,0,99,112,117,0,0,0,0,0,84,97,98,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,115,109,102,32,102,105,108,101,32,40,37,115,41,10,0,0,0,83,82,61,37,48,52,88,32,32,32,32,32,32,91,37,99,37,99,32,37,99,37,99,37,99,37,99,37,99,93,32,32,32,69,88,61,37,48,50,88,40,37,45,52,115,41,32,32,84,65,61,37,48,52,88,32,32,32,32,32,32,32,73,76,61,37,88,47,37,88,10,0,37,115,37,115,37,48,52,88,0,0,0,0,0,0,0,0,115,114,0,0,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,32,102,111,114,32,100,114,105,118,101,32,37,117,10,0,0,83,101,116,32,116,104,101,32,108,111,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,0,0,0,66,97,99,107,115,112,97,99,101,0,0,0,0,0,0,0,116,101,108,101,100,105,115,107,0,0,0,0,0,0,0,0,102,105,108,101,61,37,115,10,0,0,0,0,0,0,0,0,54,56,48,48,48,0,0,0,46,87,0,0,0,0,0,0,68,37,117,0,0,0,0,0,37,48,52,88,0,0,0,0,99,111,109,109,105,116,0,0,108,111,103,0,0,0,0,0,61,0,0,0,0,0,0,0,112,115,105,0,0,0,0,0,118,105,100,101,111,58,32,103,101,116,32,49,54,58,32,37,48,54,108,88,32,45,62,32,37,48,52,88,10,0,0,0,77,73,68,73,45,83,77,70,58,0,0,0,0,0,0,0,100,105,115,97,115,115,101,109,98,108,101,0,0,0,0,0,101,109,117,46,99,112,117,46,109,111,100,101,108,0,0,0,46,76,0,0,0,0,0,0,99,111,109,109,105,116,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,109,101,109,58,32,115,101,116,32,49,54,58,32,37,48,54,108,88,32,60,45,32,37,48,52,88,10,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,97,102,116,101,114,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,69,113,117,97,108,0,0,0,112,102,100,99,45,97,117,116,111,0,0,0,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,109,105,100,105,32,100,114,105,118,101,114,32,40,37,115,41,10,0,0,0,0,0,0,0,0,107,101,121,109,97,112,0,0,91,91,45,93,97,100,100,114,32,91,99,110,116,93,93,0,116,101,114,109,46,101,115,99,97,112,101,0,0,0,0,0,37,115,58,32,101,114,114,111,114,32,112,97,114,115,105,110,103,32,105,110,105,32,115,116,114,105,110,103,32,40,37,115,41,10,0,0,0,0,0,0,70,51,0,0,0,0,0,0,38,38,0,0,0,0,0,0,37,115,58,37,108,117,58,32,37,115,0,0,0,0,0,0,117,110,107,110,111,119,110,32,107,101,121,32,99,111,100,101,32,40,37,117,41,10,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,115,114,101,99,10,0,0,0,0,37,115,37,115,37,48,50,88,40,65,37,117,44,32,37,115,37,117,37,115,42,37,117,41,0,0,0,0,0,0,0,0,101,115,99,97,112,101,0,0,98,97,115,101,0,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,99,111,119,32,102,105,108,101,61,37,115,10,0,0,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,37,115,41,10,0,0,0,0,0,0,0,105,110,105,45,97,112,112,101,110,100,0,0,0,0,0,0,99,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,48,98,0,0,0,0,0,0,116,100,48,58,32,116,114,97,99,107,32,99,114,99,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,112,102,100,99,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,104,101,97,100,101,114,41,10,0,0,0,0,0,0,0,0,112,115,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,0,100,99,52,50,58,32,119,97,114,110,105,110,103,58,32,116,97,103,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,118,105,100,101,111,58,32,115,101,116,32,51,50,58,32,37,48,54,108,88,32,60,45,32,37,48,52,108,88,10,0,0,100,114,105,118,101,114,61,37,115,10,0,0,0,0,0,0,117,0,0,0,0,0,0,0,40,65,37,117], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+17780);
/* memory initializer */ allocate([41,0,0,0,42,42,42,32,99,111,109,109,105,116,32,102,97,105,108,101,100,32,102,111,114,32,97,116,32,108,101,97,115,116,32,111,110,101,32,100,105,115,107,10,0,0,0,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,98,101,102,111,114,101,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,0,0,0,0,0,0,0,77,105,110,117,115,0,0,0,48,120,0,0,0,0,0,0,105,109,100,0,0,0,0,0,119,98,0,0,0,0,0,0,77,73,68,73,45,82,65,87,58,0,0,0,0,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,32,91,49,93,0,0,0,0,46,105,109,97,103,101,0,0,37,115,37,117,47,37,115,37,117,0,0,0,0,0,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,99,111,109,109,105,116,105,110,103,32,97,108,108,32,100,114,105,118,101,115,10,0,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,108,117,41,10,0,0,0,0,0,0,105,110,105,45,112,114,101,102,105,120,0,0,0,0,0,0,48,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,105,109,97,103,101,100,105,115,107,0,0,0,0,0,0,0,109,105,100,105,95,115,109,102,0,0,0,0,0,0,0,0,116,0,0,0,0,0,0,0,109,102,109,58,32,117,110,107,110,111,119,110,32,97,100,100,114,101,115,115,32,109,97,114,107,32,40,109,97,114,107,61,48,120,37,48,50,120,41,10,0,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,99,104,97,114,45,112,116,121,58,32,37,115,10,0,0,0,119,114,105,116,101,0,0,0,109,115,121,115,0,0,0,0,37,115,37,117,45,37,115,37,117,0,0,0,0,0,0,0,97,108,108,0,0,0,0,0,65,100,100,32,97,32,100,105,114,101,99,116,111,114,121,32,116,111,32,116,104,101,32,115,101,97,114,99,104,32,112,97,116,104,0,0,0,0,0,0,57,0,0,0,0,0,0,0,112,111,115,105,120,0,0,0,116,114,117,101,0,0,0,0,100,99,52,50,0,0,0,0,119,98,0,0,0,0,0,0,109,105,100,105,95,114,97,119,0,0,0,0,0,0,0,0,112,114,105,110,116,32,115,116,97,116,117,115,32,40,99,112,117,124,109,101,109,41,0,0,114,43,98,0,0,0,0,0,101,106,101,99,116,105,110,103,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,112,97,116,104,0,0,0,0,56,0,0,0,0,0,0,0,100,101,102,105,110,101,100,0,99,112,50,0,0,0,0,0,79,82,73,46,66,0,0,0,77,70,80,58,0,0,0,0,79,82,73,46,87,0,0,0,91,119,104,97,116,93,0,0,79,82,73,46,76,0,0,0,67,77,80,50,46,66,0,0,67,72,75,50,46,66,0,0,87,68,49,55,57,88,58,32,109,111,116,111,114,32,105,115,32,111,102,102,33,10,0,0,67,82,40,37,117,41,0,0,65,78,68,73,46,66,0,0,46,112,114,105,0,0,0,0,65,78,68,73,46,87,0,0,83,101,116,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,43,49,0,0,0,0,0,0,55,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,97,110,97,100,105,115,107,0,65,78,68,73,46,76,0,0,67,77,80,50,46,87,0,0,65,67,73,65,49,58,0,0,67,72,75,50,46,87,0,0,32,32,0,0,0,0,0,0,115,0,0,0,0,0,0,0,83,85,66,73,46,66,0,0,83,85,66,73,46,87,0,0,99,108,111,99,107,0,0,0,83,85,66,73,46,76,0,0,67,77,80,50,46,76,0,0,67,72,75,50,46,76,0,0,86,66,82,0,0,0,0,0,65,68,68,73,46,66,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,65,68,68,73,46,87,0,0,115,116,114,105,110,103,0,0,45,49,0,0,0,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,112,97,114,116,105,116,105,111,110,0,0,0,0,0,0,0,97,100,100,114,61,48,120,37,48,54,108,120,32,115,105,122,101,61,48,120,37,108,120,10,0,0,0,0,0,0,0,0,65,68,68,73,46,76,0,0,66,84,83,84,0,0,0,0,115,112,101,101,100,32,61,32,37,117,10,0,0,0,0,0,66,67,72,71,0,0,0,0,32,32,32,0,0,0,0,0,66,67,76,82,0,0,0,0,103,101,116,32,111,114,32,115,101,116,32,97,32,114,101,103,105,115,116,101,114,0,0,0,66,83,69,84,0,0,0,0,69,79,82,73,46,66,0,0,69,79,82,73,46,87,0,0,69,79,82,73,46,76,0,0,68,70,67,0,0,0,0,0,108,112,99,0,0,0,0,0,67,77,80,73,46,66,0,0,32,9,0,0,0,0,0,0,67,77,80,73,46,87,0,0,99,111,110,102,105,103,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,53,0,0,0,0,0,0,0,113,101,100,0,0,0,0,0,67,77,80,73,46,76,0,0,77,79,86,83,46,66,0,0,65,67,73,65,48,58,0,0,77,79,86,83,46,87,0,0,77,79,86,83,46,76,0,0,32,37,48,50,88,0,0,0,114,101,103,32,91,118,97,108,93,0,0,0,0,0,0,0,77,79,86,69,46,66,0,0,77,79,86,69,46,76,0,0,119,97,114,110,105,110,103,58,32,100,101,108,97,121,32,61,61,32,48,32,97,116,32,37,48,56,108,120,10,0,0,0,83,70,67,0,0,0,0,0,35,37,115,37,48,52,88,0,58,0,0,0,0,0,0,0,78,69,71,88,46,66,0,0,80,114,105,110,116,32,117,115,97,103,101,32,105,110,102,111,114,109,97,116,105,111,110,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,33,0,0,0,0,0,0,0,112,99,101,0,0,0,0,0,118,105,100,101,111,58,32,103,101,116,32,51,50,58,32,37,48,54,108,88,32,45,62,32,37,48,52,88,10,0,0,0,78,69,71,88,46,87,0,0,78,69,71,88,46,76,0,0,73,75,66,68,58,0,0,0,60,45,0,0,0,0,0,0,114,0,0,0,0,0,0,0,67,76,82,46,66,0,0,0,67,76,82,46,87,0,0,0,67,76,82,46,76,0,0,0,73,78,84,82,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,101,115,115,97,103,101,32,40,34,37,115,34,44,32,34,37,115,34,41,10,0,78,69,71,46,66,0,0,0,78,69,71,46,87,0,0,0,115,116,100,105,111,58,102,105,108,101,61,0,0,0,0,0,78,69,71,46,76,0,0,0,109,101,109,58,32,115,101,116,32,32,56,58,32,37,48,54,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,0,109,101,109,58,32,103,101,116,32,32,56,58,32,37,48,54,108,88,32,45,62,32,48,48,10,0,0,0,0,0,0,0,104,101,108,112,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,126,0,0,0,0,0,0,0,42,42,42,32,110,111,32,116,101,114,109,105,110,97,108,32,102,111,117,110,100,10,0,0,100,111,115,101,109,117,0,0,78,79,84,46,66,0,0,0,78,79,84,46,87,0,0,0,82,84,67,58,0,0,0,0,114,101,112,111,114,116,95,107,101,121,115,0,0,0,0,0,78,79,84,46,76,0,0,0,80,54,10,37,117,32,37,117,10,37,117,10,0,0,0,0,45,62,0,0,0,0,0,0,77,79,86,69,46,87,0,0,101,120,101,99,117,116,101,32,116,111,32,110,101,120,116,32,114,116,101,0,0,0,0,0,91,37,48,54,108,88,93,32,0,0,0,0,0,0,0,0,78,66,67,68,46,66,0,0,70,50,0,0,0,0,0,0,99,111,109,109,105,116,0,0,124,124,0,0,0,0,0,0,60,110,111,110,101,62,0,0,32,9,0,0,0,0,0,0,83,87,65,80,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,97,103,105,99,32,107,101,121,32,40,37,117,41,10,0,0,0,0,0,0,0,84,82,65,80,0,0,0,0,69,88,84,46,87,0,0,0,37,45,57,115,32,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,105,104,101,120,10,0,0,0,0,37,117,0,0,0,0,0,0,110,117,108,108,0,0,0,0,97,100,100,114,101,115,115,0,69,88,84,46,76,0,0,0,102,100,99,58,32,117,110,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,0,0,0,42,42,42,32,99,111,119,32,102,97,105,108,101,100,32,40,100,114,105,118,101,61,37,117,32,102,105,108,101,61,37,115,41,10,0,0,0,0,0,0,49,0,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,69,88,84,66,46,76,0,0,117,115,97,103,101,58,32,112,99,101,45,97,116,97,114,105,115,116,32,91,111,112,116,105,111,110,115,93,0,0,0,0,115,0,0,0,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,121,101,115,0,0,0,0,0,50,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,0,116,100,48,58,32,104,101,97,100,101,114,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,105,109,97,103,101,0,0,0,109,102,109,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,116,114,97,99,107,32,104,101,97,100,101,114,41,10,0,84,83,84,46,66,0,0,0,112,115,105,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,112,102,100,99,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,100,99,52,50,58,32,119,97,114,110,105,110,103,58,32,100,97,116,97,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,32,45,0,0,0,0,0,0,84,83,84,46,87,0,0,0,80,83,71,58,0,0,0,0,84,83,84,46,76,0,0,0,37,115,32,37,48,50,88,0,114,116,101,0,0,0,0,0,77,85,76,85,46,76,0,0,68,73,86,85,46,76,0,0,65,86,69,67,0,0,0,0,68,37,117,58,68,37,117,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,112,99,101,45,97,116,97,114,105,115,116,58,32,65,116,97,114,105,32,83,84,32,101,109,117,108,97,116,111,114,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,110,117,108,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,114,97,109,0,0,0,0,0,77,79,86,69,0,0,0,0,85,78,76,75,0,0,0,0,60,110,111,110,101,62,0,0,97,99,115,105,58,32,109,111,100,101,32,115,101,110,115,101,58,32,117,110,107,110,111,119,110,32,109,111,100,101,32,112,97,103,101,32,40,37,48,50,88,41,10,0,0,0,0,0,76,73,78,75,0,0,0,0,84,82,65,80,0,0,0,0,114,101,115,101,116,0,0,0,77,79,86,69,67,0,0,0,84,82,65,80,86,0,0,0,70,82,77,84,0,0,0,0,46,99,112,50,0,0,0,0,85,83,80,0,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,112,99,101,45,97,116,97,114,105,115,116,32,118,101,114,115,105,111,110,32,50,48,49,52,48,50,49,48,45,97,49,51,98,100,51,54,45,109,111,100,10,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,49,45,50,48,49,51,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,96,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,115,100,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,0,114,98,0,0,0,0,0,0,83,84,79,80,0,0,0,0,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,0,102,105,108,101,48,61,37,115,32,102,105,108,101,49,61,37,115,10,0,0,0,0,0,0,82,69,83,69,84,0,0,0,119,98,0,0,0,0,0,0,109,102,109,58,32,100,97,109,32,119,105,116,104,111,117,116,32,105,100,97,109,10,0,0,102,108,117,115,104,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,44,32,115,107,105,112,32,99,97,108,108,115,32,91,49,93,0,0,0,0,0,0,0,0,65,68,68,81,46,66,0,0,42,42,42,32,101,114,114,111,114,32,99,114,101,97,116,105,110,103,32,115,121,109,108,105,110,107,32,37,115,32,45,62,32,37,115,10,0,0,0,0,114,101,97,100,0,0,0,0,65,68,68,81,46,87,0,0,109,105,99,114,111,115,111,102,116,0,0,0,0,0,0,0,65,68,68,81,46,76,0,0,70,88,88,88,0,0,0,0,112,99,101,37,48,52,117,46,112,112,109,0,0,0,0,0,84,82,65,80,76,69,0,0,83,82,0,0,0,0,0,0,84,82,65,80,71,84,0,0,101,109,117,46,115,101,114,46,102,105,108,101,0,0,0,0,84,82,65,80,76,84,0,0,56,0,0,0,0,0,0,0,112,99,101,45,97,116,97,114,105,115,116,32,118,101,114,115,105,111,110,32,50,48,49,52,48,50,49,48,45,97,49,51,98,100,51,54,45,109,111,100,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,49,45,50,48,49,51,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,0,66,97,99,107,113,117,111,116,101,0,0,0,0,0,0,0,37,108,117,0,0,0,0,0,110,117,108,108,0,0,0,0,101,108,115,101,0,0,0,0,115,100,108,0,0,0,0,0,102,105,108,101,0,0,0,0,114,43,98,0,0,0,0,0,84,82,65,80,71,69,0,0,114,43,98,0,0,0,0,0,84,82,65,80,77,73,0,0,70,68,67,58,0,0,0,0,114,43,98,0,0,0,0,0,84,82,65,80,80,76,0,0,114,43,98,0,0,0,0,0,84,82,65,80,86,83,0,0,114,98,0,0,0,0,0,0,112,0,0,0,0,0,0,0,84,82,65,80,86,67,0,0,84,82,65,80,69,81,0,0,84,82,65,80,78,69,0,0,65,88,88,88,0,0,0,0,84,82,65,80,67,83,0,0,84,82,65,80,67,67,0,0,101,109,117,46,115,101,114,46,100,114,105,118,101,114,0,0,84,82,65,80,76,83,0,0,112,99,101,0,0,0,0,0,55,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,99,111,110,102,105,103,32,102,105,108,101,32,102,97,105,108,101,100,10,0,80,97,117,115,101,0,0,0,45,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,42,42,42,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,32,39,120,49,49,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,111,112,116,105,111,110,97,108,0,0,0,0,0,0,0,0,84,82,65,80,72,73,0,0,84,82,65,80,70,0,0,0,102,105,108,101,49,0,0,0,69,83,67,0,0,0,0,0,119,98,0,0,0,0,0,0,84,82,65,80,84,0,0,0,114,98,0,0,0,0,0,0,114,98,0,0,0,0,0,0,114,43,98,0,0,0,0,0,68,66,76,69,0,0,0,0,112,114,105,110,116,32,104,101,108,112,32,111,110,32,109,101,115,115,97,103,101,115,0,0,68,66,71,84,0,0,0,0,68,66,76,84,0,0,0,0,87,68,49,55,57,88,58,32,67,77,68,91,37,48,50,88,93,32,85,78,75,78,79,87,78,32,67,79,77,77,65,78,68,10,0,0,0,0,0,0,68,66,71,69,0,0,0,0,63,0,0,0,0,0,0,0,84,82,65,67,69,0,0,0,68,66,77,73,0,0,0,0,37,115,37,48,56,108,88,0,68,66,80,76,0,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,68,66,86,83,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,54,0,0,0,0,0,0,0,102,105,108,101,61,34,37,115,34,10,0,0,0,0,0,0,83,99,114,76,107,0,0,0,43,0,0,0,0,0,0,0,99,97,110,39,116,32,111,112,101,110,32,105,110,99,108,117,100,101,32,102,105,108,101,58,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,0,0,0,0,120,49,49,0,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,68,66,86,67,0,0,0,0,68,66,69,81,0,0,0,0,102,105,108,101,48,0,0,0,114,98,0,0,0,0,0,0,68,66,78,69,0,0,0,0,68,66,67,83,0,0,0,0,114,0,0,0,0,0,0,0,104,109,0,0,0,0,0,0,68,66,67,67,0,0,0,0,68,66,76,83,0,0,0,0,91,99,110,116,93,0,0,0,68,66,72,73,0,0,0,0,112,97,114,115,101,32,101,114,114,111,114,32,98,101,102,111,114,101,0,0,0,0,0,0,80,82,73,86,0,0,0,0,68,66,70,0,0,0,0,0,35,37,115,37,88,0,0,0,68,66,84,0,0,0,0,0,101,109,117,46,114,101,97,108,116,105,109,101,46,116,111,103,103,108,101,0,0,0,0,0,114,0,0,0,0,0,0,0,83,76,69,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,53,0,0,0,0,0,0,0,67,79,78,70,73,71,58,0,83,99,114,111,108,108,76,111,99,107,0,0,0,0,0,0,62,62,0,0,0,0,0,0,63,0,0,0,0,0,0,0,98,97,115,101,0,0,0,0,69,83,67,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,111,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,103,0,0,0,83,71,84,0,0,0,0,0,116,114,117,101,0,0,0,0,83,76,84,0,0,0,0,0,102,100,99,0,0,0,0,0,46,120,100,102,0,0,0,0,83,71,69,0,0,0,0,0,83,77,73,0,0,0,0,0,83,80,76,0,0,0,0,0,115,101,116,32,104,97,108,116,32,115,116,97,116,101,32,91,50,93,0,0,0,0,0,0,83,86,83,0,0,0,0,0,105,107,98,100,58,32,98,117,102,102,101,114,32,111,118,101,114,102,108,111,119,10,0,0,69,120,116,114,97,49,54,0,83,86,67,0,0,0,0,0,79,70,76,87,0,0,0,0,69,120,116,114,97,49,53,0,83,69,81,0,0,0,0,0,35,37,115,37,48,56,108,88,0,0,0,0,0,0,0,0,112,99,0,0,0,0,0,0,69,120,116,114,97,49,52,0,83,78,69,0,0,0,0,0,101,109,117,46,114,101,97,108,116,105,109,101,0,0,0,0,69,120,116,114,97,49,51,0,83,67,83,0,0,0,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,121,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,112,99,101,45,97,116,97,114,105,115,116,58,32,115,105,103,105,110,116,10,0,0,0,0,80,114,116,83,99,110,0,0,60,60,0,0,0,0,0,0,105,110,99,108,117,100,101,0,97,100,100,114,101,115,115,0,100,114,105,118,101,114,61,37,115,32,69,83,67,61,37,115,32,97,115,112,101,99,116,61,37,117,47,37,117,32,109,105,110,95,115,105,122,101,61,37,117,42,37,117,32,115,99,97,108,101,61,37,117,32,109,111,117,115,101,61,91,37,117,47,37,117,32,37,117,47,37,117,93,10,0,0,0,0,0,0,82,79,77,58,0,0,0,0,115,105,122,101,109,0,0,0,69,120,116,114,97,49,50,0,65,67,83,73,58,0,0,0,83,67,67,0,0,0,0,0,69,120,116,114,97,49,49,0,83,76,83,0,0,0,0,0,112,99,101,45,97,116,97,114,105,115,116,0,0,0,0,0,46,116,100,48,0,0,0,0,69,120,116,114,97,49,48,0,97,0,0,0,0,0,0,0,83,72,73,0,0,0,0,0,69,120,116,114,97,57,0,0,83,70,0,0,0,0,0,0,69,120,116,114,97,56,0,0,114,98,0,0,0,0,0,0,83,84,0,0,0,0,0,0,91,118,97,108,93,0,0,0,69,120,116,114,97,55,0,0,83,85,66,81,46,66,0,0,69,120,116,114,97,54,0,0,83,85,66,81,46,87,0,0,67,72,75,0,0,0,0,0,69,120,116,114,97,53,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,83,85,66,81,46,76,0,0,35,37,115,37,48,50,88,0,66,70,73,78,83,0,0,0,69,120,116,114,97,52,0,0,66,76,69,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,69,120,116,114,97,51,0,0,114,97,109,0,0,0,0,0,66,71,84,0,0,0,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,120,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,112,99,101,45,97,116,97,114,105,115,116,58,32,115,101,103,109,101,110,116,97,116,105,111,110,32,102,97,117,108,116,10,0,0,0,0,0,0,0,0,80,114,105,110,116,83,99,114,101,101,110,0,0,0,0,0,62,0,0,0,0,0,0,0,105,102,0,0,0,0,0,0,121,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,84,69,82,77,58,0,0,0,114,111,109,0,0,0,0,0,115,105,122,101,107,0,0,0,69,120,116,114,97,50,0,0,118,105,100,101,111,58,32,115,101,116,32,49,54,58,32,37,48,54,108,88,32,60,45,32,37,48,52,88,10,0,0,0,66,76,84,0,0,0,0,0,69,120,116,114,97,49,0,0,67,114,101,97,116,101,100,32,98,121,32,112,99,101,45,97,116,97,114,105,115,116,32,118,101,114,115,105,111,110,32,50,48,49,52,48,50,49,48,45,97,49,51,98,100,51,54,45,109,111,100,0,0,0,0,0,66,71,69,0,0,0,0,0,105,110,105,116,105,97,108,105,122,101,100,10,0,0,0,0,46,116,99,0,0,0,0,0,82,105,103,104,116,0,0,0,66,77,73,0,0,0,0,0,68,111,119,110,0,0,0,0,66,80,76,0,0,0,0,0,76,101,102,116,0,0,0,0,99,111,119,0,0,0,0,0,66,86,83,0,0,0,0,0,104,97,108,116,0,0,0,0,66,86,67,0,0,0,0,0,85,112,0,0,0,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,112,114,105,41,10,0,0,0,0,37,115,10,10,0,0,0,0,80,97,103,101,68,111,119,110,0,0,0,0,0,0,0,0,66,69,81,0,0,0,0,0,68,73,86,90,0,0,0,0,69,110,100,0,0,0,0,0,66,78,69,0,0,0,0,0,116,101,114,109,0,0,0,0,68,101,108,101,116,101,0,0,66,67,83,0,0,0,0,0,101,109,117,46,112,97,117,115,101,0,0,0,0,0,0,0,109,101,109,58,32,103,101,116,32,49,54,58,32,37,48,54,108,88,32,45,62,32,48,48,48,48,10,0,0,0,0,0,80,97,103,101,85,112,0,0,66,67,67,0,0,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,50,0,0,0,0,0,0,0,112,99,101,45,97,116,97,114,105,115,116,58,32,115,105,103,116,101,114,109,10,0,0,0,70,49,50,0,0,0,0,0,60,0,0,0,0,0,0,0,61,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,102,111,114,109,97,116,0,0,109,111,117,115,101,95,100,105,118,95,121,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,97,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,0,0,0,0,65,32,32,37,48,56,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,72,111,109,101,0,0,0,0,82,101,108,101,97,115,101,32,54,46,48,10,36,48,0,0,66,76,83,0,0,0,0,0,73,110,115,101,114,116,0,0,66,72,73,0,0,0,0,0,68,77,65,58,0,0,0,0,46,115,116,120,0,0,0,0,75,80,95,80,101,114,105,111,100,0,0,0,0,0,0,0,98,111,114,100,101,114,0,0,66,83,82,0,0,0,0,0,37,52,117,32,32,0,0,0,119,98,0,0,0,0,0,0,75,80,95,48,0,0,0,0,66,82,65,0,0,0,0,0,49,0,0,0,0,0,0,0,75,80,95,69,110,116,101,114,0,0,0,0,0,0,0,0,46,83,0,0,0,0,0,0,70,49,0,0,0,0,0,0,114,43,98,0,0,0,0,0,119,43,98,0,0,0,0,0,114,117,110,0,0,0,0,0,58,0,0,0,0,0,0,0,75,80,95,51,0,0,0,0,77,79,86,69,81,0,0,0,114,98,0,0,0,0,0,0,112,97,116,104,0,0,0,0,75,80,95,50,0,0,0,0,102,97,108,115,101,0,0,0,68,73,86,85,46,87,0,0,107,101,121,112,97,100,32,106,111,121,115,116,105,99,107,32,37,117,10,0,0,0,0,0,73,76,76,71,0,0,0,0,75,80,95,49,0,0,0,0,79,82,46,66,0,0,0,0,76,111,97,100,58,0,0,0,45,0,0,0,0,0,0,0,83,66,67,68,46,66,0,0,100,114,105,118,101,114,0,0,102,105,108,101,0,0,0,0,75,80,95,54,0,0,0,0,68,77,65,58,32,103,101,116,32,115,101,99,116,111,114,32,99,111,117,110,116,58,32,37,48,52,88,10,0,0,0,0,68,73,83,75,58,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,100,105,115,107,41,10,0,0,0,101,109,117,46,112,97,114,46,102,105,108,101,0,0,0,0,116,99,58,32,117,110,107,110,111,119,110,32,109,97,114,107,32,48,120,37,48,50,120,32,40,37,115,44,32,99,61,37,117,44,32,104,61,37,117,44,32,98,105,116,61,37,108,117,47,37,108,117,41,10,0,0,75,80,95,53,0,0,0,0,79,82,46,87,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,108,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,116,114,117,101,0,0,0,0,70,49,49,0,0,0,0,0,62,61,0,0,0,0,0,0,63,61,0,0,0,0,0,0,113,0,0,0,0,0,0,0,108,111,97,100,0,0,0,0,109,111,117,115,101,95,109,117,108,95,121,0,0,0,0,0,42,42,42,32,109,101,109,111,114,121,32,98,108,111,99,107,32,99,114,101,97,116,105,111,110,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,116,100,48,58,32,97,100,118,97,110,99,101,100,32,99,111,109,112,114,101,115,115,105,111,110,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,98,108,111,99,107,115,0,0,102,109,0,0,0,0,0,0,83,32,32,37,48,52,88,58,37,48,52,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,0,0,0,75,80,95,52,0,0,0,0,116,100,48,58,32,99,111,109,109,101,110,116,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,115,116,120,58,32,98,97,100,32,109,97,103,105,99,10,0,82,101,108,101,97,115,101,32,53,46,48,49,36,48,0,0,79,82,46,76,0,0,0,0,112,115,105,58,32,99,114,99,32,101,114,114,111,114,10,0,112,102,100,99,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,0,0,0,0,0,0,0,73,77,68,32,49,46,49,55,58,32,37,50,100,47,37,50,100,47,37,52,100,32,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,6,78,111,110,97,109,101,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,0,0,75,80,95,80,108,117,115,0,68,73,86,83,46,87,0,0,109,111,110,111,61,37,100,32,102,114,97,109,101,95,115,107,105,112,61,37,117,10,0,0,46,115,116,0,0,0,0,0,75,80,95,57,0,0,0,0,83,85,66,65,46,87,0,0,112,102,100,99,58,32,99,114,99,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,75,80,95,56,0,0,0,0,83,85,66,46,66,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,50,32,102,105,108,101,10,0,0,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,49,32,102,105,108,101,10,0,0,0,0,0,0,0,75,80,95,55,0,0,0,0,83,85,66,88,46,66,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,48,32,102,105,108,101,10,0,0,0,0,0,0,0,119,100,49,55,57,120,58,32,115,97,118,101,32,116,114,97,99,107,32,102,97,105,108,101,100,10,0,0,0,0,0,0,75,80,95,77,105,110,117,115,0,0,0,0,0,0,0,0,83,85,66,46,87,0,0,0,75,80,95,83,116,97,114,0,83,85,66,88,46,87,0,0,65,68,68,82,0,0,0,0,75,80,95,83,108,97,115,104,0,0,0,0,0,0,0,0,83,85,66,46,76,0,0,0,37,115,37,115,37,48,52,88,40,65,37,117,41,0,0,0,78,117,109,76,111,99,107,0,83,85,66,88,46,76,0,0,101,109,117,46,112,97,114,46,100,114,105,118,101,114,0,0,67,116,114,108,82,105,103,104,116,0,0,0,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,32,115,101,99,116,111,114,32,100,97,116,97,32,116,111,111,32,98,105,103,32,40,37,117,41,10,0,0,0,0,0,0,0,0,83,85,66,65,46,76,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,97,116,97,114,105,115,116,0,70,49,48,0,0,0,0,0,60,61,0,0,0,0,0,0,125,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,98,105,110,97,114,121,0,0,109,111,117,115,101,95,100,105,118,95,120,0,0,0,0,0,60,110,111,110,101,62,0,0,115,0,0,0,0,0,0,0,32,37,115,0,0,0,0,0,69,32,32,34,37,115,34,10,0,0,0,0,0,0,0,0,77,101,110,117,0,0,0,0,116,100,48,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,82,101,108,101,97,115,101,32,52,46,48,48,36,48,0,0,67,77,80,46,66,0,0,0,87,105,110,100,111,119,115,82,105,103,104,116,0,0,0,0,67,77,80,46,87,0,0,0,86,73,68,69,79,58,0,0,65,67,83,73,58,32,67,77,68,91,37,48,50,88,93,32,85,78,75,78,79,87,78,32,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,32,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,10,0,0,0,0,0,0,0,0,65,67,83,73,58,32,100,97,116,97,32,111,117,116,32,102,111,114,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,48,50,88,41,10,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+28020);
function runPostSets() {


}

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


  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
      return (ptr-num)|0;
    }var _llvm_memset_p0i8_i32=_memset;

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  
  
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
    }
  
  
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  
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
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
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

  var _llvm_memset_p0i8_i64=_memset;

  
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

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

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

  function _emscripten_cancel_main_loop() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.shouldPause = true;
    }

  
  function _snprintf(s, n, format, varargs) {
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

  function _strcat(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      var pdestEnd = 0;
      pdestEnd = (pdest + (_strlen(pdest)|0))|0;
      do {
        HEAP8[((pdestEnd+i)|0)]=HEAP8[((psrc+i)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }


  
  
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
        return tempRet0 = (tempDouble=ret,Math_abs(tempDouble) >= 1 ? (tempDouble > 0 ? Math_min(Math_floor((tempDouble)/4294967296), 4294967295)>>>0 : (~~(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296)))>>>0) : 0),ret>>>0;
      }
  
      return ret;
    }function _strtoul(str, endptr, base) {
      return __parseInt(str, endptr, base, 0, 4294967295, 32, true);  // ULONG_MAX.
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  
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

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }

  
  
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
        if(!info) return; // MLT
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
            //Module.print('Received key event: ' + event.keyCode);
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
      }};function _SDL_Init(initFlags) {
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

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }


  
  
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }function _strncasecmp(px, py, n) {
      px = px|0; py = py|0; n = n|0;
      var i = 0, x = 0, y = 0;
      while ((i>>>0) < (n>>>0)) {
        x = _tolower(HEAP8[(((px)+(i))|0)])|0;
        y = _tolower(HEAP8[(((py)+(i))|0)])|0;
        if (((x|0) == (y|0)) & ((x|0) == 0)) return 0;
        if ((x|0) == 0) return -1;
        if ((y|0) == 0) return 1;
        if ((x|0) == (y|0)) {
          i = (i + 1)|0;
          continue;
        } else {
          return ((x>>>0) > (y>>>0) ? 1 : -1)|0;
        }
      }
      return 0;
    }function _strcasecmp(px, py) {
      px = px|0; py = py|0;
      return _strncasecmp(px, py, -1)|0;
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

  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }

  
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
    }

  function _llvm_trap() {
      abort('trap!');
    }

  var _fseeko=_fseek;

  
  
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

  function _memcmp(p1, p2, num) {
      p1 = p1|0; p2 = p2|0; num = num|0;
      var i = 0, v1 = 0, v2 = 0;
      while ((i|0) < (num|0)) {
        v1 = HEAPU8[(((p1)+(i))|0)];
        v2 = HEAPU8[(((p2)+(i))|0)];
        if ((v1|0) != (v2|0)) return ((v1|0) > (v2|0) ? 1 : -1)|0;
        i = (i+1)|0;
      }
      return 0;
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
;

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
;

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
;
;
;

  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
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

  function _SDL_GetMouseState(x, y) {
      if (x) HEAP32[((x)>>2)]=Browser.mouseX;
      if (y) HEAP32[((y)>>2)]=Browser.mouseY;
      return SDL.buttonState;
    }

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

  function _SDL_WasInit() {
      if (SDL.startTime === null) {
        _SDL_Init();
      }
      return 1;
    }

  function _SDL_InitSubSystem(flags) { return 0 }

  function _SDL_GetVideoInfo() {
      // %struct.SDL_VideoInfo = type { i32, i32, %struct.SDL_PixelFormat*, i32, i32 } - 5 fields of quantum size
      var ret = _malloc(5*Runtime.QUANTUM_SIZE);
      HEAP32[((ret+Runtime.QUANTUM_SIZE*0)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*1)>>2)]=0; // TODO
      HEAP32[((ret+Runtime.QUANTUM_SIZE*2)>>2)]=0;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*3)>>2)]=Module["canvas"].width;
      HEAP32[((ret+Runtime.QUANTUM_SIZE*4)>>2)]=Module["canvas"].height;
      return ret;
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
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var FUNCTION_TABLE = [0,0,_d_b040,0,_d_c100,0,_st_atexit,0,_op6e00,0,_d_9080,0,_st_mem_set_uint32,0,_op2040,0,_op6900531,0,_st_mem_get_uint32,0,_dsk_pce_get_msg,0,_null_open,0,_sig_segv,0,_op00c0,0,_op4000,0,_d_0c00,0,_opd080,0,_dsk_psi_write,0,_e68901_set_uint16,0,_opf000,0,_chr_stdio_read,0,_d_0400,0,_mem_blk_get_uint32_null,0,_dsk_ram_write,0,_d_0e40,0,_ope080,0,_d_01c0,0,_d_4280,0,_dsk_qed_set_msg,0,_op4a00,0,_op8140,0,_d_4e40,0,_op4e80,0,_opc080,0,_op01c0,0,_opd0c0,0,_st_set_msg_emu_cpu_speed_step,0,_op5cc0518,0,_d_4600,0,_d_b180,0,_chr_posix_close,0,_ope0c0,0,_op5fc0521,0,_op4680,0,_op6100523,0,_op9080,0,_op6300525,0,_st_log_exception,0,_op0280,0,_op0c40,0,_d_4040,0,_ope3c0,0,_op40c0,0,_op6400,0,_sdl_del,0,_d_0200,0,_op0000,0,_op3000,0,_d_80c0,0,_op50c0,0,_st_usart_recv,0,_d_0640,0,_opb1c0,0,_opd1c0,0,_null_del,0,_op5ac0516,0,_st_set_hb,0,_d_d180,0,_d_d0c0,0,_d_0840,0,_d_6000,0,_op6900,0,_d_ebc0,0,_op51c0507,0,_chr_mouse_read,0,_dsk_pce_set_msg,0,_dsk_pce_write,0,_d_90c0,0,_e68_ea_101_xxx,0,_d_0440,0,_mem_blk_set_uint16_null,0,_d_e0c0,0,_st_set_msg_emu_ser_driver,0,_d_0e80,0,_d_46c0,0,_ope5c0,0,_cmd_write_track_clock,0,_op9100,0,_st_set_msg_emu_disk_commit,0,_chr_stdio_open,0,_d_b000,0,_st_set_msg_emu_cpu_model,0,_op8100,0,_mem_blk_set_uint8_null,0,_d_4240,0,_op5ac0,0,_d_4ac0,0,_dsk_qed_get_msg,0,_d_7000,0,_op0800,0,_d_4640,0,_d_50c0,0,_op6700,0,_op4c00,0,_op6f00537,0,_cmd_restore_cont,0,_op4a40504,0,_d_0180,0,_d_40c0,0,_st_mem_set_uint8,0,_op0240,0,_d_e7c0,0,_d_8140,0,_sdl_set_msg_trm,0,_op4880,0,_op0c00,0,_d_4a80,0,_op4a40,0,_op9000,0,_ope040,0,_e68_ea_001_xxx,0,_dsk_qed_write,0,_st_set_msg_emu_realtime_toggle,0,_st_set_msg_emu_par_file,0,_d_e9c0,0,_d_00c0,0,_d_8040,0,_dsk_cow_get_msg,0,_d_0c80,0,_d_e000,0,_op8080,0,_e68_ea_111_100,0,_op5dc0,0,_op6200,0,_op4080,0,_chr_null_close,0,_d_0800,0,_op0480,0,_op4640,0,_op6c00,0,_cmd_read_address_clock,0,_op57c0513,0,_d_0480,0,_op6700529,0,_st_video_set_uint16,0,_st_usart_send,0,_e68_ea_000_xxx,0,_dsk_psi_set_msg,0,_d_c180,0,_mem_get_uint16_be,0,_op3040,0,_null_update,0,_d_0240,0,_op9140,0,_d_9180,0,_op6200524,0,_st_video_get_uint32,0,_op51c0,0,_chr_null_set_params,0,_opc000,0,_op0840,0,_di_und,0,_dsk_img_del,0,_op1000,0,_op6d00,0,_bp_segofs_del,0,_cmd_read_address_idam,0,_d_8100,0,_st_write_track,0,_d_1000,0,_chr_null_read,0,_d_e180,0,_st_set_msg_emu_exit,0,_op56c0512,0,_dsk_cow_read,0,_cmd_write_sector_idam,0,_ope4c0,0,_opd180,0,_op4840,0,_st_set_port_a,0,_st_set_port_b,0,_op5080,0,_bp_addr_match,0,_d_e8c0,0,_ope000,0,_d_4200,0,_d_d100,0,_op0100,0,_d_e040,0,_op0e80,0,_ope180,0,_bp_segofs_match,0,_d_4180,0,_op4600,0,_st_kbd_get_uint8,0,_chr_mouse_write,0,_e68901_get_uint32,0,_ope9c0,0,_op0200,0,_op5cc0,0,_d_0140,0,_op54c0,0,_d_4880,0,_op4180,0,_d_0600,0,_d_4c80,0,_opd100,0,_op91c0,0,_chr_null_get_ctl,0,_st_set_msg_emu_disk_insert,0,_st_mem_get_uint16,0,_e68_ea_011_111,0,_op6e00536,0,_st_dma_set_dreq,0,_sdl_close,0,_ope7c0,0,_opefc0,0,_d_e6c0,0,_opb100,0,_op9180,0,_d_0a80,0,_d_0280,0,_st_set_msg_emu_ser_file,0,_d_3040,0,_opc040,0,_st_kbd_set_mouse,0,_st_mem_set_uint16,0,_st_kbd_set_uint8,0,_wd179x_scan_mark,0,_st_set_vb,0,_d_c1c0,0,_null_set_msg_trm,0,_op5bc0517,0,_d_d080,0,_d_08c0,0,_op5ec0,0,_op6800,0,_op0a40,0,_d_42c0,0,_d_4a00,0,_op58c0514,0,_op0140,0,_op7000,0,_mem_set_uint32_be,0,_bp_addr_print,0,_d_e140,0,_opeac0,0,_d_e5c0,0,_st_set_msg_emu_disk_eject,0,_opebc0,0,_st_midi_send,0,_op5040,0,_d_4800,0,_chr_stdio_write,0,_op5ec0520,0,_e68_ea_100_xxx,0,_d_e3c0,0,_d_4e80,0,_e68901_set_uint32,0,_e68_ea_111_000,0,_d_5000,0,_chr_mouse_close,0,_d_d140,0,_d_e080,0,_st_mem_get_uint8,0,_ope140,0,_sig_int,0,_d_0880,0,_op8000,0,_chr_null_write,0,_st_set_msg_emu_pause,0,_opc140,0,_d_5100,0,_st_set_msg_emu_stop,0,_d_04c0,0,_dsk_psi_del,0,_st_kbd_set_key,0,_opa000,0,_d_0100,0,_d_41c0,0,_dsk_dosemu_read,0,_d_4440,0,_ope8c0,0,_dsk_dosemu_write,0,_mem_set_uint16_be,0,_sdl_open,0,_dsk_img_write,0,_opb140,0,_op6400526,0,_op2000,0,_d_a000,0,_d_0080,0,_d_3000,0,_ope2c0,0,_d_0a40,0,_op41c0,0,_cmd_read_sector_idam,0,_op6600,0,_mem_set_uint8,0,_e68_ea_110_xxx,0,_st_set_msg_emu_reset,0,_op52c0508,0,_d_efc0,0,_op08c0,0,_op6d00535,0,_op53c0,0,_bp_addr_del,0,_d_9100,0,_op6600528,0,_d_c040,0,_dsk_cow_set_msg,0,_dsk_pce_del,0,_chr_posix_read,0,_op6100,0,_mem_blk_set_uint32_null,0,_e68_ea_111_001,0,_op90c0,0,_opd140,0,_bp_expr_print,0,_bp_expr_match,0,_op0a00,0,_op55c0,0,_op6b00533,0,_d_5180,0,_op4200,0,_d_4a40,0,_d_e100,0,_opd040,0,_op0600,0,_op6b00,0,_op46c0,0,_cmd_read_sector_clock,0,_st_run_emscripten_step,0,_op5000,0,_d_4840,0,_d_eec0,0,_st_set_msg,0,_st_inta,0,_sdl_update,0,_op55c0511,0,_null_check,0,_d_5040,0,_mem_blk_get_uint8_null,0,_op5180,0,_op8040,0,_e68_ea_011_xxx,0,_d_e2c0,0,_opc100,0,_op48c0,0,_cmd_write_sector_clock,0,_cmd_set_sym1226,0,_d_8180,0,_st_set_msg_emu_par_driver,0,_e68_ea_111_xxx,0,_op4e40,0,_chr_mouse_set_ctl,0,_d_ecc0,0,_d_4400,0,_d_0040,0,_d_8000,0,_e68901_get_uint8,0,_op0180,0,_d_c0c0,0,_op4ec0,0,_d_0a00,0,_d_b1c0,0,_ope100,0,_op52c0,0,_bp_expr_del,0,_d_b0c0,0,_mem_get_uint32_be,0,_st_video_get_uint8,0,_d_4080,0,_op5dc0519,0,_op6f00,0,_d_48c0,0,_d_d000,0,_sdl_check,0,_st_cmd,0,_op4100,0,_d_0680,0,_chr_pty_close,0,_opecc0,0,_opd000,0,_d_5140,0,_op4240,0,_dsk_ram_del,0,_st_video_set_uint32,0,_cmd_read_sector_dam,0,_dsk_dosemu_del,0,_op0640,0,_d_91c0,0,_op5bc0,0,_d_4cc0,0,_opb000,0,_chr_posix_open,0,_dsk_part_del,0,_d_e1c0,0,_op4400,0,_d_c000,0,_d_9140,0,_opeec0,0,_op53c0509,0,_op59c0,0,_chr_mouse_set_params,0,_dsk_psi_read,0,_op6c00534,0,_st_set_msg_emu_pause_toggle,0,_e68_op_undefined,0,_mem_get_uint8,0,_op5fc0,0,_chr_posix_write,0,_e68901_get_uint16,0,_op6000522,0,_d_02c0,0,_op50c0506,0,_chr_pty_read,0,_d_4680,0,_op4a80505,0,_d_b100,0,_st_set_msg_emu_realtime,0,_e68_ea_100_111,0,_d_9040,0,_op80c0,0,_dsk_pce_read,0,_dsk_part_write,0,_op4a00503,0,_chr_pty_write,0,_op59c0515,0,_dsk_ram_read,0,_cmd_seek_cont,0,_st_interrupt_mfp,0,_chr_stdio_close,0,_dsk_part_read,0,_d_5080,0,_sig_term,0,_op6a00532,0,_op4c40,0,_d_d040,0,_chr_mouse_open,0,_chr_pty_open,0,_chr_null_open,0,_op0a80,0,_d_4c00,0,_d_9000,0,_op6500527,0,_cmd_get_sym1224,0,_d_0000,0,_op57c0,0,_op4040,0,_op44c0,0,_d_f000,0,_op0680,0,_op0440,0,_st_read_track,0,_ope6c0,0,_cmd_step_cont,0,_e68_ea_010_xxx,0,_bp_segofs_print,0,_op4440,0,_op6500,0,_e68_ea_111_010,0,_e68_ea_111_011,0,_opb040,0,_chr_null_set_ctl,0,_op0040,0,_d_2040,0,_cmd_auto_motor_off,0,_op5140,0,_op0e00,0,_op42c0,0,_d_b080,0,_d_c140,0,_opc180,0,_d_0e00,0,_dsk_qed_read,0,_d_49c0,0,_dsk_qed_del,0,_st_video_set_uint8,0,_op56c0,0,_op4800,0,_d_0c40,0,_dsk_cow_write,0,_op6000,0,_op81c0,0,_op4280,0,_d_eac0,0,_op0e40,0,_d_b140,0,_ope1c0,0,_d_e4c0,0,_d_d1c0,0,_op6a00,0,_dsk_img_read,0,_opc1c0,0,_d_44c0,0,_op5100,0,_null_close,0,_chr_mouse_get_ctl,0,_op4cc0,0,_e68901_set_uint8,0,_dsk_cow_del,0,_e68901_set_inp_4,0,_op4a80,0,_d_4000,0,_op6300,0,_d_4c40,0,_op58c0,0,_opb0c0,0,_wd179x_read_track_clock,0,_mem_blk_get_uint16_null,0,_op6800530,0,_d_4480,0,_opb180,0,_op8180,0,_d_81c0,0,_op0880,0,_d_8080,0,_op0400,0,_opc0c0,0,_op49c0_00,0,_op49c0,0,_mem_set_uint8_rw,0,_op4ac0,0,_opb080,0,_op54c0510,0,_op9040,0,_st_video_get_uint16,0,_e68901_set_inp_5,0,_op4480,0,_d_c080,0,_d_4ec0,0,_d_2000,0,_st_set_msg_emu_cpu_speed,0,_op0c80,0,_op4c80,0,_op0080,0];

// EMSCRIPTEN_START_FUNCS
function _st_acsi_init(r1){HEAP32[r1>>2]=0;HEAP8[r1+12|0]=0;_memset(r1+131104|0,-1,16)|0;HEAP32[r1+131120>>2]=0;HEAP8[r1+131124|0]=0;HEAP32[r1+131128>>2]=0;HEAP32[r1+131132>>2]=0;HEAP8[r1+131136|0]=0;HEAP32[r1+131140>>2]=0;HEAP32[r1+131144>>2]=0;return}function _st_acsi_set_drq_fct(r1,r2,r3){HEAP32[r1+131128>>2]=r2;HEAP32[r1+131132>>2]=r3;return}function _st_acsi_set_irq_fct(r1,r2,r3){HEAP32[r1+131140>>2]=r2;HEAP32[r1+131144>>2]=r3;return}function _st_acsi_set_disks(r1,r2){HEAP32[r1+131120>>2]=r2;return}function _st_acsi_set_disk_id(r1,r2,r3){HEAP16[r1+131104+((r2&7)<<1)>>1]=r3;return}function _st_acsi_get_result(r1){var r2,r3;r2=r1+131136|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+131144>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+131140>>2],0)}}while(0);return HEAP8[r1+12|0]}function _st_acsi_get_data(r1){var r2,r3,r4,r5,r6;r2=r1+131124|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+131132>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+131128>>2],0)}}while(0);r2=r1+24|0;r3=HEAP32[r2>>2];r4=HEAP32[r1+28>>2];if(r3>>>0>=r4>>>0){r5=0;return r5}r6=r3+1|0;HEAP32[r2>>2]=r6;r2=HEAP8[r3+(r1+32)|0];if(r6>>>0<r4>>>0){r5=r2;return r5}r4=r1+131136|0;if((HEAP8[r4]|0)==1){r5=r2;return r5}HEAP8[r4]=1;r4=HEAP32[r1+131144>>2];if((r4|0)==0){r5=r2;return r5}FUNCTION_TABLE[r4](HEAP32[r1+131140>>2],1);r5=r2;return r5}function _st_acsi_set_data(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+131124|0;do{if((HEAP8[r5]|0)!=0){HEAP8[r5]=0;r6=HEAP32[r1+131132>>2];if((r6|0)==0){break}FUNCTION_TABLE[r6](HEAP32[r1+131128>>2],0)}}while(0);r6=r1+24|0;r7=HEAP32[r6>>2];r8=r1+28|0;if(r7>>>0>=HEAP32[r8>>2]>>>0){STACKTOP=r4;return}HEAP32[r6>>2]=r7+1;HEAP8[r7+(r1+32)|0]=r2;if(HEAP32[r6>>2]>>>0<HEAP32[r8>>2]>>>0){STACKTOP=r4;return}r8=HEAPU8[r1+4|0];r6=r8&31;if((r6|0)==10){r2=_dsks_get_disk(HEAP32[r1+131120>>2],HEAPU16[r1+131104+(r8>>>5<<1)>>1]);if((r2|0)==0){HEAP8[r1+12|0]=4;HEAP8[r1+13|0]=0;do{if((HEAP8[r5]|0)!=0){HEAP8[r5]=0;r7=HEAP32[r1+131132>>2];if((r7|0)==0){break}FUNCTION_TABLE[r7](HEAP32[r1+131128>>2],0)}}while(0);r7=r1+131136|0;if((HEAP8[r7]|0)==1){STACKTOP=r4;return}HEAP8[r7]=1;r7=HEAP32[r1+131144>>2];if((r7|0)==0){STACKTOP=r4;return}FUNCTION_TABLE[r7](HEAP32[r1+131140>>2],1);STACKTOP=r4;return}r7=r1+12|0;if((_dsk_write_lba(r2,r1+32|0,HEAP32[r1+16>>2],HEAPU16[r1+20>>1])|0)!=0){HEAP8[r7]=20;r2=r1+13|0;HEAP8[r2]=0;do{if((HEAP8[r5]|0)!=0){HEAP8[r5]=0;r9=HEAP32[r1+131132>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+131128>>2],0)}}while(0);r9=r1+131136|0;do{if((HEAP8[r9]|0)!=1){HEAP8[r9]=1;r10=HEAP32[r1+131144>>2];if((r10|0)==0){break}FUNCTION_TABLE[r10](HEAP32[r1+131140>>2],1)}}while(0);HEAP8[r2]=5;STACKTOP=r4;return}HEAP8[r7]=0;HEAP8[r1+13|0]=0;do{if((HEAP8[r5]|0)!=0){HEAP8[r5]=0;r7=HEAP32[r1+131132>>2];if((r7|0)==0){break}FUNCTION_TABLE[r7](HEAP32[r1+131128>>2],0)}}while(0);r7=r1+131136|0;if((HEAP8[r7]|0)==1){STACKTOP=r4;return}HEAP8[r7]=1;r7=HEAP32[r1+131144>>2];if((r7|0)==0){STACKTOP=r4;return}FUNCTION_TABLE[r7](HEAP32[r1+131140>>2],1);STACKTOP=r4;return}else if((r6|0)==21){if((_dsks_get_disk(HEAP32[r1+131120>>2],HEAPU16[r1+131104+(r8>>>5<<1)>>1])|0)==0){HEAP8[r1+12|0]=4;HEAP8[r1+13|0]=0;do{if((HEAP8[r5]|0)!=0){HEAP8[r5]=0;r6=HEAP32[r1+131132>>2];if((r6|0)==0){break}FUNCTION_TABLE[r6](HEAP32[r1+131128>>2],0)}}while(0);r6=r1+131136|0;if((HEAP8[r6]|0)==1){STACKTOP=r4;return}HEAP8[r6]=1;r6=HEAP32[r1+131144>>2];if((r6|0)==0){STACKTOP=r4;return}FUNCTION_TABLE[r6](HEAP32[r1+131140>>2],1);STACKTOP=r4;return}r6=HEAP32[_stderr>>2];_fwrite(24496,13,1,r6);r7=r1+20|0;if((HEAP16[r7>>1]|0)!=0){r2=0;while(1){_fprintf(r6,23360,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r1+32)|0],r3));STACKTOP=r3;r9=r2+1|0;if((r9&15|0)==0){_fputc(10,r6)}else{_fputc(32,r6)}if(r9>>>0<HEAPU16[r7>>1]>>>0){r2=r9}else{break}}}_fputc(10,r6);HEAP8[r1+12|0]=0;HEAP8[r1+13|0]=0;do{if((HEAP8[r5]|0)!=0){HEAP8[r5]=0;r6=HEAP32[r1+131132>>2];if((r6|0)==0){break}FUNCTION_TABLE[r6](HEAP32[r1+131128>>2],0)}}while(0);r5=r1+131136|0;if((HEAP8[r5]|0)==1){STACKTOP=r4;return}HEAP8[r5]=1;r5=HEAP32[r1+131144>>2];if((r5|0)==0){STACKTOP=r4;return}FUNCTION_TABLE[r5](HEAP32[r1+131140>>2],1);STACKTOP=r4;return}else{_st_log_deb(35776,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r8,r3));STACKTOP=r3;STACKTOP=r4;return}}function _st_acsi_set_cmd(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382;r4=0;r5=0;r6=STACKTOP;r7=r1+131124|0;r8=HEAP8[r7];r9=r8<<24>>24==0;do{if(!r9){HEAP8[r7]=0;r10=r1+131132|0;r11=HEAP32[r10>>2];r12=(r11|0)==0;if(r12){break}r13=r1+131128|0;r14=HEAP32[r13>>2];FUNCTION_TABLE[r11](r14,0)}}while(0);r15=r1+131136|0;r16=HEAP8[r15];r17=r16<<24>>24==0;do{if(!r17){HEAP8[r15]=0;r18=r1+131144|0;r19=HEAP32[r18>>2];r20=(r19|0)==0;if(r20){break}r21=r1+131140|0;r22=HEAP32[r21>>2];FUNCTION_TABLE[r19](r22,0)}}while(0);r23=r1|0;r24=HEAP32[r23>>2];r25=r24>>>0>5;if(r25){HEAP32[r23>>2]=0;STACKTOP=r6;return}r26=r24+1|0;HEAP32[r23>>2]=r26;r27=r24+(r1+4)|0;HEAP8[r27]=r2;r28=HEAP32[r23>>2];r29=(r28|0)==1;do{if(r29){r30=r1+4|0;r31=HEAP8[r30];r32=r31&255;r33=r32>>>5;r34=r1+131120|0;r35=HEAP32[r34>>2];r36=r1+131104+(r33<<1)|0;r37=HEAP16[r36>>1];r38=r37&65535;r39=_dsks_get_disk(r35,r38);r40=(r39|0)==0;if(!r40){r41=HEAP32[r23>>2];r42=r41;break}HEAP32[r23>>2]=0;STACKTOP=r6;return}else{r42=r28}}while(0);r43=r42>>>0>5;if(!r43){r44=HEAP8[r15];r45=r44<<24>>24==1;if(r45){STACKTOP=r6;return}HEAP8[r15]=1;r46=r1+131144|0;r47=HEAP32[r46>>2];r48=(r47|0)==0;if(r48){STACKTOP=r6;return}r49=r1+131140|0;r50=HEAP32[r49>>2];FUNCTION_TABLE[r47](r50,1);STACKTOP=r6;return}r51=r1+5|0;r52=HEAP8[r51];r53=r52&255;r54=r1+16|0;r55=r53<<8;r56=r1+6|0;r57=HEAP8[r56];r58=r57&255;r59=r55|r58;r60=r59<<8;r61=r1+7|0;r62=HEAP8[r61];r63=r62&255;r64=r60|r63;HEAP32[r54>>2]=r64;r65=r1+8|0;r66=HEAP8[r65];r67=r66&255;r68=r1+20|0;HEAP16[r68>>1]=r67;r69=r1+24|0;HEAP32[r69>>2]=0;r70=r1+28|0;HEAP32[r70>>2]=0;r71=r1+4|0;r72=HEAP8[r71];r73=r72&255;r74=r73&31;L30:do{switch(r74|0){case 3:{r75=r1+32|0;_memset(r75,0,256)|0;r76=r1+13|0;r77=HEAP8[r76];HEAP8[r75]=r77;HEAP32[r69>>2]=0;r78=r66&255;HEAP32[r70>>2]=r78;r79=r1+12|0;HEAP8[r79]=0;break};case 4:{r80=r1+12|0;HEAP8[r80]=0;r81=r1+13|0;HEAP8[r81]=0;r82=HEAP8[r7];r83=r82<<24>>24==0;do{if(!r83){HEAP8[r7]=0;r84=r1+131132|0;r85=HEAP32[r84>>2];r86=(r85|0)==0;if(r86){break}r87=r1+131128|0;r88=HEAP32[r87>>2];FUNCTION_TABLE[r85](r88,0)}}while(0);r89=HEAP8[r15];r90=r89<<24>>24==1;if(r90){break L30}HEAP8[r15]=1;r91=r1+131144|0;r92=HEAP32[r91>>2];r93=(r92|0)==0;if(r93){break L30}r94=r1+131140|0;r95=HEAP32[r94>>2];FUNCTION_TABLE[r92](r95,1);break};case 0:{r96=r73>>>5;r97=r1+131120|0;r98=HEAP32[r97>>2];r99=r1+131104+(r96<<1)|0;r100=HEAP16[r99>>1];r101=r100&65535;r102=_dsks_get_disk(r98,r101);r103=(r102|0)==0;r104=r1+12|0;if(r103){HEAP8[r104]=4;r105=r1+13|0;HEAP8[r105]=0;r106=HEAP8[r7];r107=r106<<24>>24==0;do{if(!r107){HEAP8[r7]=0;r108=r1+131132|0;r109=HEAP32[r108>>2];r110=(r109|0)==0;if(r110){break}r111=r1+131128|0;r112=HEAP32[r111>>2];FUNCTION_TABLE[r109](r112,0)}}while(0);r113=HEAP8[r15];r114=r113<<24>>24==1;if(r114){break L30}HEAP8[r15]=1;r115=r1+131144|0;r116=HEAP32[r115>>2];r117=(r116|0)==0;if(r117){break L30}r118=r1+131140|0;r119=HEAP32[r118>>2];FUNCTION_TABLE[r116](r119,1);break L30}else{HEAP8[r104]=0;r120=r1+13|0;HEAP8[r120]=0;r121=HEAP8[r7];r122=r121<<24>>24==0;do{if(!r122){HEAP8[r7]=0;r123=r1+131132|0;r124=HEAP32[r123>>2];r125=(r124|0)==0;if(r125){break}r126=r1+131128|0;r127=HEAP32[r126>>2];FUNCTION_TABLE[r124](r127,0)}}while(0);r128=HEAP8[r15];r129=r128<<24>>24==1;if(r129){break L30}HEAP8[r15]=1;r130=r1+131144|0;r131=HEAP32[r130>>2];r132=(r131|0)==0;if(r132){break L30}r133=r1+131140|0;r134=HEAP32[r133>>2];FUNCTION_TABLE[r131](r134,1);break L30}break};case 8:{r135=r73>>>5;r136=r1+131120|0;r137=HEAP32[r136>>2];r138=r1+131104+(r135<<1)|0;r139=HEAP16[r138>>1];r140=r139&65535;r141=_dsks_get_disk(r137,r140);r142=(r141|0)==0;if(r142){r143=r1+12|0;HEAP8[r143]=4;r144=r1+13|0;HEAP8[r144]=0;r145=HEAP8[r7];r146=r145<<24>>24==0;do{if(!r146){HEAP8[r7]=0;r147=r1+131132|0;r148=HEAP32[r147>>2];r149=(r148|0)==0;if(r149){break}r150=r1+131128|0;r151=HEAP32[r150>>2];FUNCTION_TABLE[r148](r151,0)}}while(0);r152=HEAP8[r15];r153=r152<<24>>24==1;if(r153){break L30}HEAP8[r15]=1;r154=r1+131144|0;r155=HEAP32[r154>>2];r156=(r155|0)==0;if(r156){break L30}r157=r1+131140|0;r158=HEAP32[r157>>2];FUNCTION_TABLE[r155](r158,1);break L30}r159=r1+32|0;r160=HEAP32[r54>>2];r161=HEAP16[r68>>1];r162=r161&65535;r163=_dsk_read_lba(r141,r159,r160,r162);r164=(r163|0)==0;if(r164){HEAP32[r69>>2]=0;r165=HEAP16[r68>>1];r166=r165&65535;r167=r166<<9;HEAP32[r70>>2]=r167;r168=r1+12|0;HEAP8[r168]=0;break L30}r169=r1+12|0;HEAP8[r169]=20;r170=r1+13|0;HEAP8[r170]=0;r171=HEAP8[r7];r172=r171<<24>>24==0;do{if(!r172){HEAP8[r7]=0;r173=r1+131132|0;r174=HEAP32[r173>>2];r175=(r174|0)==0;if(r175){break}r176=r1+131128|0;r177=HEAP32[r176>>2];FUNCTION_TABLE[r174](r177,0)}}while(0);r178=HEAP8[r15];r179=r178<<24>>24==1;do{if(!r179){HEAP8[r15]=1;r180=r1+131144|0;r181=HEAP32[r180>>2];r182=(r181|0)==0;if(r182){break}r183=r1+131140|0;r184=HEAP32[r183>>2];FUNCTION_TABLE[r181](r184,1)}}while(0);HEAP8[r170]=5;break};case 10:{r185=r73>>>5;r186=r1+131120|0;r187=HEAP32[r186>>2];r188=r1+131104+(r185<<1)|0;r189=HEAP16[r188>>1];r190=r189&65535;r191=_dsks_get_disk(r187,r190);r192=(r191|0)==0;if(r192){r193=r1+12|0;HEAP8[r193]=4;r194=r1+13|0;HEAP8[r194]=0;r195=HEAP8[r7];r196=r195<<24>>24==0;do{if(!r196){HEAP8[r7]=0;r197=r1+131132|0;r198=HEAP32[r197>>2];r199=(r198|0)==0;if(r199){break}r200=r1+131128|0;r201=HEAP32[r200>>2];FUNCTION_TABLE[r198](r201,0)}}while(0);r202=HEAP8[r15];r203=r202<<24>>24==1;if(r203){break L30}HEAP8[r15]=1;r204=r1+131144|0;r205=HEAP32[r204>>2];r206=(r205|0)==0;if(r206){break L30}r207=r1+131140|0;r208=HEAP32[r207>>2];FUNCTION_TABLE[r205](r208,1);break L30}r209=r1+32|0;r210=HEAP32[r54>>2];r211=HEAP16[r68>>1];r212=r211&65535;r213=_dsk_read_lba(r191,r209,r210,r212);r214=(r213|0)==0;if(r214){HEAP32[r69>>2]=0;r215=HEAP16[r68>>1];r216=r215&65535;r217=r216<<9;HEAP32[r70>>2]=r217;r218=r1+12|0;HEAP8[r218]=0;break L30}r219=r1+12|0;HEAP8[r219]=20;r220=r1+13|0;HEAP8[r220]=0;r221=HEAP8[r7];r222=r221<<24>>24==0;do{if(!r222){HEAP8[r7]=0;r223=r1+131132|0;r224=HEAP32[r223>>2];r225=(r224|0)==0;if(r225){break}r226=r1+131128|0;r227=HEAP32[r226>>2];FUNCTION_TABLE[r224](r227,0)}}while(0);r228=HEAP8[r15];r229=r228<<24>>24==1;if(r229){break L30}HEAP8[r15]=1;r230=r1+131144|0;r231=HEAP32[r230>>2];r232=(r231|0)==0;if(r232){break L30}r233=r1+131140|0;r234=HEAP32[r233>>2];FUNCTION_TABLE[r231](r234,1);break};case 18:{r235=r73>>>5;r236=r1+131120|0;r237=HEAP32[r236>>2];r238=r1+131104+(r235<<1)|0;r239=HEAP16[r238>>1];r240=r239&65535;r241=_dsks_get_disk(r237,r240);r242=(r241|0)==0;if(!r242){r243=HEAP8[r65];r244=r243&255;r245=r1+32|0;_memset(r245,0,256)|0;r246=r1+40|0;r247=r246;r248=541410128;r249=538976288;r250=r247|0;tempBigInt=r248;HEAP8[r250]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r250+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r250+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r250+3|0]=tempBigInt;r251=r247+4|0;tempBigInt=r249;HEAP8[r251]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r251+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r251+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r251+3|0]=tempBigInt;r252=r1+48|0;_memcpy(r252,26096,16)|0;r253=r1+34|0;HEAP8[r253]=1;r254=r1+36|0;HEAP8[r254]=32;HEAP32[r69>>2]=0;r255=r244>>>0<36;r256=r255?r244:36;HEAP32[r70>>2]=r256;r257=r1+12|0;HEAP8[r257]=0;break L30}r258=r1+12|0;HEAP8[r258]=4;r259=r1+13|0;HEAP8[r259]=0;r260=HEAP8[r7];r261=r260<<24>>24==0;do{if(!r261){HEAP8[r7]=0;r262=r1+131132|0;r263=HEAP32[r262>>2];r264=(r263|0)==0;if(r264){break}r265=r1+131128|0;r266=HEAP32[r265>>2];FUNCTION_TABLE[r263](r266,0)}}while(0);r267=HEAP8[r15];r268=r267<<24>>24==1;if(r268){break L30}HEAP8[r15]=1;r269=r1+131144|0;r270=HEAP32[r269>>2];r271=(r270|0)==0;if(r271){break L30}r272=r1+131140|0;r273=HEAP32[r272>>2];FUNCTION_TABLE[r270](r273,1);break};case 21:{r274=r73>>>5;r275=r1+131120|0;r276=HEAP32[r275>>2];r277=r1+131104+(r274<<1)|0;r278=HEAP16[r277>>1];r279=r278&65535;r280=_dsks_get_disk(r276,r279);r281=(r280|0)==0;if(!r281){HEAP32[r69>>2]=0;r282=HEAP8[r65];r283=r282&255;HEAP32[r70>>2]=r283;r284=r1+12|0;HEAP8[r284]=0;break L30}r285=r1+12|0;HEAP8[r285]=4;r286=r1+13|0;HEAP8[r286]=0;r287=HEAP8[r7];r288=r287<<24>>24==0;do{if(!r288){HEAP8[r7]=0;r289=r1+131132|0;r290=HEAP32[r289>>2];r291=(r290|0)==0;if(r291){break}r292=r1+131128|0;r293=HEAP32[r292>>2];FUNCTION_TABLE[r290](r293,0)}}while(0);r294=HEAP8[r15];r295=r294<<24>>24==1;if(r295){break L30}HEAP8[r15]=1;r296=r1+131144|0;r297=HEAP32[r296>>2];r298=(r297|0)==0;if(r298){break L30}r299=r1+131140|0;r300=HEAP32[r299>>2];FUNCTION_TABLE[r297](r300,1);break};case 26:{r301=r73>>>5;r302=r1+131120|0;r303=HEAP32[r302>>2];r304=r1+131104+(r301<<1)|0;r305=HEAP16[r304>>1];r306=r305&65535;r307=_dsks_get_disk(r303,r306);r308=(r307|0)==0;if(r308){r309=r1+12|0;HEAP8[r309]=4;r310=r1+13|0;HEAP8[r310]=0;r311=HEAP8[r7];r312=r311<<24>>24==0;do{if(!r312){HEAP8[r7]=0;r313=r1+131132|0;r314=HEAP32[r313>>2];r315=(r314|0)==0;if(r315){break}r316=r1+131128|0;r317=HEAP32[r316>>2];FUNCTION_TABLE[r314](r317,0)}}while(0);r318=HEAP8[r15];r319=r318<<24>>24==1;if(r319){break L30}HEAP8[r15]=1;r320=r1+131144|0;r321=HEAP32[r320>>2];r322=(r321|0)==0;if(r322){break L30}r323=r1+131140|0;r324=HEAP32[r323>>2];FUNCTION_TABLE[r321](r324,1);break L30}r325=r1+32|0;r326=r69;_memset(r326,0,264)|0;r327=HEAP8[r56];r328=r327&255;r329=r328&63;do{if((r329|0)==0){r330=r1+35|0;HEAP8[r330]=8;r331=r307+28|0;r332=HEAP32[r331>>2];_buf_set_uint32_be(r325,4,r332);_buf_set_uint32_be(r325,8,512);HEAP32[r70>>2]=16}else if((r329|0)==1){HEAP8[r325]=1;r333=r1+33|0;HEAP8[r333]=10;HEAP32[r70>>2]=12}else if((r329|0)==3){HEAP8[r325]=3;r334=r1+33|0;HEAP8[r334]=22;HEAP32[r70>>2]=24}else if((r329|0)==4){HEAP8[r325]=4;r335=r1+33|0;HEAP8[r335]=22;r336=r1+34|0;HEAP8[r336]=0;r337=r307+32|0;r338=HEAP32[r337>>2];r339=r338&65535;_buf_set_uint16_be(r325,3,r339);r340=r307+36|0;r341=HEAP32[r340>>2];r342=r341&255;r343=r1+37|0;HEAP8[r343]=r342;_buf_set_uint16_be(r325,20,3600);HEAP32[r70>>2]=32}else{_st_log_deb(30816,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r328,r5));STACKTOP=r5;r344=HEAP32[r70>>2];r345=(r344|0)==0;if(!r345){break}r346=r1+12|0;HEAP8[r346]=2;r347=r1+13|0;HEAP8[r347]=0;r348=HEAP8[r7];r349=r348<<24>>24==0;do{if(!r349){HEAP8[r7]=0;r350=r1+131132|0;r351=HEAP32[r350>>2];r352=(r351|0)==0;if(r352){break}r353=r1+131128|0;r354=HEAP32[r353>>2];FUNCTION_TABLE[r351](r354,0)}}while(0);r355=HEAP8[r15];r356=r355<<24>>24==1;if(r356){break L30}HEAP8[r15]=1;r357=r1+131144|0;r358=HEAP32[r357>>2];r359=(r358|0)==0;if(r359){break L30}r360=r1+131140|0;r361=HEAP32[r360>>2];FUNCTION_TABLE[r358](r361,1);break L30}}while(0);r362=r1+12|0;HEAP8[r362]=0;break};default:{r363=r66&255;r364=r1+9|0;r365=HEAP8[r364];r366=r365&255;_st_log_deb(35712,(r5=STACKTOP,STACKTOP=STACKTOP+56|0,HEAP32[r5>>2]=r73,HEAP32[r5+8>>2]=r73,HEAP32[r5+16>>2]=r53,HEAP32[r5+24>>2]=r58,HEAP32[r5+32>>2]=r63,HEAP32[r5+40>>2]=r363,HEAP32[r5+48>>2]=r366,r5));STACKTOP=r5;r367=r1+12|0;HEAP8[r367]=32;r368=r1+13|0;HEAP8[r368]=0;r369=HEAP8[r7];r370=r369<<24>>24==0;do{if(!r370){HEAP8[r7]=0;r371=r1+131132|0;r372=HEAP32[r371>>2];r373=(r372|0)==0;if(r373){break}r374=r1+131128|0;r375=HEAP32[r374>>2];FUNCTION_TABLE[r372](r375,0)}}while(0);r376=HEAP8[r15];r377=r376<<24>>24==1;if(r377){break L30}HEAP8[r15]=1;r378=r1+131144|0;r379=HEAP32[r378>>2];r380=(r379|0)==0;if(r380){break L30}r381=r1+131140|0;r382=HEAP32[r381>>2];FUNCTION_TABLE[r379](r382,1)}}}while(0);HEAP32[r23>>2]=0;STACKTOP=r6;return}function _st_acsi_reset(r1){var r2,r3;HEAP32[r1>>2]=0;HEAP32[r1+24>>2]=0;HEAP32[r1+28>>2]=0;HEAP8[r1+12|0]=0;r2=r1+131124|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+131132>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+131128>>2],0)}}while(0);r2=r1+131136|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+131144>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+131140>>2],0);return}function _st_acsi_clock(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP32[r1+24>>2];r3=r1+28|0;r4=HEAP32[r3>>2];if(r2>>>0>=r4>>>0){return}r5=r1+131124|0;r6=r1+131132|0;r7=r1+131128|0;r1=r2;r2=r4;while(1){do{if((HEAP8[r5]|0)==1){r8=r2}else{HEAP8[r5]=1;r4=HEAP32[r6>>2];if((r4|0)==0){r8=r2;break}FUNCTION_TABLE[r4](HEAP32[r7>>2],1);r8=HEAP32[r3>>2]}}while(0);r4=r1+1|0;if(r4>>>0<r8>>>0){r1=r4;r2=r8}else{break}}return}function _st_init(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+96|0;r5=r4;r6=r4+8;r7=r4+16;r8=r4+24;r9=r4+32;r10=r4+40;r11=r4+48;r12=r4+56;r13=r4+64;r14=r4+72;r15=r4+80;r16=r4+88;r17=r1+201688|0;HEAP32[r17>>2]=0;r18=r1+201684|0;HEAP32[r18>>2]=0;HEAP8[r1+201717|0]=0;HEAP8[r1+201712|0]=0;HEAP8[r1+201713|0]=0;HEAP8[r1+201718|0]=0;HEAP32[r1+201720>>2]=0;r19=r1+201728|0;HEAP32[r19>>2]=1;r20=r1+201732|0;HEAP32[r20>>2]=0;r21=r1+201748|0;HEAP32[r21>>2]=0;HEAP32[r21+4>>2]=0;HEAP32[r21+8>>2]=0;HEAP32[r21+12>>2]=0;HEAP32[r21+16>>2]=0;HEAP32[r21+20>>2]=0;HEAP32[r21+24>>2]=0;_bps_init(r1+16|0);r21=_ini_next_sct(r2,0,21080);r22=(r21|0)==0?r2:r21;r21=r1+201696|0;HEAP32[r21>>2]=0;r23=r1+201700|0;HEAP32[r23>>2]=0;_ini_get_string(r22,26472,r14,25240);_ini_get_bool(r22,25144,r12,1);_ini_get_bool(r22,25016,r13,0);_ini_get_string(r22,24832,r15,0);_ini_get_string(r22,24728,r16,0);r22=HEAP32[r13>>2];_pce_log_tag(2,24592,24472,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[r14>>2],HEAP32[r3+8>>2]=r22,r3));STACKTOP=r3;r22=HEAP32[r14>>2];if((_strcmp(r22,25240)|0)==0){HEAP32[r1>>2]=1}else{_pce_log(0,24400,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r22,r3));STACKTOP=r3;HEAP32[r1>>2]=1}HEAP8[r1+201714|0]=0;r22=r1+201715|0;HEAP8[r22]=(HEAP32[r12>>2]|0)!=0|0;HEAP8[r1+201716|0]=(HEAP32[r13>>2]|0)!=0|0;r13=HEAP32[r15>>2];do{if((r13|0)!=0){_pce_log_tag(2,24024,28e3,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r13,r3));STACKTOP=r3;r12=_chr_open(HEAP32[r15>>2]);HEAP32[r21>>2]=r12;if((r12|0)!=0){break}_pce_log(0,23872,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[r15>>2],r3));STACKTOP=r3}}while(0);r15=HEAP32[r16>>2];do{if((r15|0)!=0){_pce_log_tag(2,23792,28e3,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r15,r3));STACKTOP=r3;r21=_chr_open(HEAP32[r16>>2]);HEAP32[r23>>2]=r21;if((r21|0)!=0){break}_pce_log(0,23872,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[r16>>2],r3));STACKTOP=r3}}while(0);r16=_mem_new();r23=r1+8|0;HEAP32[r23>>2]=r16;r15=r1;_mem_set_fct(r16,r15,528,420,18,218,452,12);r16=r1+12|0;_ini_get_ram(HEAP32[r23>>2],r2,r16);_ini_get_rom(HEAP32[r23>>2],r2);r21=_mem_get_blk(HEAP32[r23>>2],0);HEAP32[r16>>2]=r21;if((r21|0)==0){_pce_log(0,25504,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3}do{if((_mem_get_blk(HEAP32[r23>>2],16515072)|0)==0){if((_mem_get_blk(HEAP32[r23>>2],14680064)|0)==0){_pce_log(0,25360,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;break}else{HEAP32[r1+201708>>2]=14680064;break}}else{HEAP32[r1+201708>>2]=16515072}}while(0);r21=_ini_next_sct(r2,0,26688);_ini_get_string(r21,26472,r10,26696);_ini_get_uint16(r21,26344,r11,0);r21=HEAP32[r11>>2];_pce_log_tag(2,26168,26072,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[r10>>2],HEAP32[r3+8>>2]=r21,r3));STACKTOP=r3;r21=_e68_new();r16=r1+4|0;HEAP32[r16>>2]=r21;if((r21|0)!=0){if((_st_set_cpu_model(r1,HEAP32[r10>>2])|0)!=0){_pce_log(0,25944,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[r10>>2],r3));STACKTOP=r3}_e68_set_mem_fct(HEAP32[r16>>2],HEAP32[r23>>2],818,298,740,596,568,486);_e68_set_inta_fct(HEAP32[r16>>2],r15,674);_e68_set_flags(HEAP32[r16>>2],8,1);HEAP32[r19>>2]=HEAP32[r11>>2]}r11=_ini_next_sct(r2,0,21080);_ini_get_string(r11,28616,r8,0);_ini_get_string(r11,28400,r9,0);r11=r1+460|0;_st_smf_init(r11);r19=r1+201704|0;HEAP32[r19>>2]=0;r16=HEAP32[r8>>2];do{if((r16|0)!=0){_pce_log_tag(2,28160,28e3,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r16,r3));STACKTOP=r3;r10=_chr_open(HEAP32[r8>>2]);HEAP32[r19>>2]=r10;if((r10|0)!=0){break}_pce_log(0,27384,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[r8>>2],r3));STACKTOP=r3}}while(0);r8=HEAP32[r9>>2];do{if((r8|0)!=0){_pce_log_tag(2,27208,27096,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r8,r3));STACKTOP=r3;if((_st_smf_set_auto(r11,HEAP32[r9>>2])|0)==0){break}_pce_log(0,26872,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP32[r9>>2],r3));STACKTOP=r3}}while(0);_pce_log_tag(2,28728,29104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=16775680,HEAP32[r3+8>>2]=64,r3));STACKTOP=r3;r9=r1+24|0;_e68901_init(r9,1);r11=_mem_blk_new(16775680,64,0);r8=r9;do{if((r11|0)!=0){_mem_blk_set_fct(r11,r8,720,824,392,1e3,36,516);_mem_add_blk(HEAP32[r23>>2],r11,1);_e68901_set_irq_fct(r9,r15,862);_e68901_set_usart_timer(r9,3);_e68901_set_send_fct(r9,r15,290);_e68901_set_recv_fct(r9,r15,120);_e68901_set_clk_div(r9,13);if((HEAP8[r22]|0)==0){_e68901_set_inp(r9,1);break}else{_e68901_set_inp(r9,-127);break}}}while(0);_pce_log_tag(2,29352,29104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=16776192,HEAP32[r3+8>>2]=4,r3));STACKTOP=r3;r9=r1+204|0;_e6850_init(r9);_e6850_set_irq_fct(r9,r8,1004);r11=r1+300|0;_e6850_set_send_fct(r9,r11,454);_e6850_set_recv_fct(r9,r11,388);_pce_log_tag(2,28912,29104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=16776196,HEAP32[r3+8>>2]=4,r3));STACKTOP=r3;r9=r1+252|0;_e6850_init(r9);_e6850_set_irq_fct(r9,r8,1004);_e6850_set_send_fct(r9,r15,500);_pce_log_tag(2,29592,33584,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;_st_kbd_init(r1+300|0);_pce_log_tag(2,29880,33584,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;_rp5c15_init(r1+4604|0);_pce_log_tag(2,30600,33584,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;r9=r1+4640|0;_st_psg_init(r9);_st_psg_set_port_a_fct(r9,r15,358);_st_psg_set_port_b_fct(r9,r15,360);r9=r1+201692|0;HEAP32[r9>>2]=_ini_get_disks(r2);r19=_ini_next_sct(r2,0,32640);_ini_get_string(r19,32312,r6,0);_ini_get_string(r19,31936,r7,0);r19=HEAP32[r6>>2];r16=HEAP32[r7>>2];_pce_log_tag(2,31656,31184,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r19|0)!=0?r19:30808,HEAP32[r3+8>>2]=(r16|0)!=0?r16:30808,r3));STACKTOP=r3;r16=r1+4676|0;_st_fdc_init(r16);r19=r16|0;_wd179x_set_irq_fct(r19,r8,1056);r10=r1+201604|0;r21=r10;_wd179x_set_drq_fct(r19,r21,426);_wd179x_set_input_clock(r19,8e6);_wd179x_set_bit_clock(r19,1e6);_wd179x_set_auto_motor(r19,1);_st_fdc_set_disks(r16,HEAP32[r9>>2]);_st_fdc_set_fname(r16,0,HEAP32[r6>>2]);_st_fdc_set_fname(r16,1,HEAP32[r7>>2]);_st_fdc_set_disk_id(r16,0,0);_st_fdc_set_disk_id(r16,1,1);_pce_log_tag(2,33040,33584,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;r16=r1+70456|0;_st_acsi_init(r16);_st_acsi_set_drq_fct(r16,r21,426);_st_acsi_set_irq_fct(r16,r8,1056);_st_acsi_set_disks(r16,HEAP32[r9>>2]);_st_acsi_set_disk_id(r16,0,128);_st_acsi_set_disk_id(r16,1,129);_st_acsi_set_disk_id(r16,2,130);_st_acsi_set_disk_id(r16,3,131);_st_acsi_set_disk_id(r16,4,132);_st_acsi_set_disk_id(r16,5,133);_st_acsi_set_disk_id(r16,6,134);_st_acsi_set_disk_id(r16,7,135);_pce_log_tag(2,34080,33584,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;_st_dma_init(r10);_st_dma_set_memory(r10,HEAP32[r23>>2]);_st_dma_set_fdc(r10,r1+4676|0);_st_dma_set_acsi(r10,r16);r16=_ini_get_terminal(r2,HEAP32[39960>>2]);HEAP32[r17>>2]=r16;if((r16|0)!=0){_trm_set_msg_fct(r16,r15,672);_trm_set_key_fct(HEAP32[r17>>2],r11,552);_trm_set_mouse_fct(HEAP32[r17>>2],r11,450)}_ini_get_uint16(_ini_next_sct(r2,0,21080),19776,r5,0);r11=HEAP32[r5>>2];_pce_log_tag(2,35704,35e3,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP8[r22]|0,HEAP32[r3+8>>2]=r11,r3));STACKTOP=r3;r3=_st_video_new(16744960,HEAP8[r22]|0);HEAP32[r18>>2]=r3;if((r3|0)!=0){_st_video_set_memory(r3,HEAP32[r23>>2]);_st_video_set_hb_fct(HEAP32[r18>>2],r15,132);_st_video_set_vb_fct(HEAP32[r18>>2],r15,458);_st_video_set_frame_skip(HEAP32[r18>>2],HEAP32[r5>>2]);r5=HEAP32[r17>>2];if((r5|0)!=0){_st_video_set_terminal(HEAP32[r18>>2],r5)}_mem_add_blk(HEAP32[r23>>2],HEAP32[r18>>2]+12|0,0)}_pce_load_mem_ini(HEAP32[r23>>2],r2);r2=HEAP32[r17>>2];if((r2|0)==0){r24=r1+201736|0;HEAP32[r24>>2]=0;r25=r1+201740|0;HEAP32[r25>>2]=0;r26=_pce_get_interval_us(r25);HEAP32[r20>>2]=0;STACKTOP=r4;return}_trm_set_msg_trm(r2,28176,33072);r24=r1+201736|0;HEAP32[r24>>2]=0;r25=r1+201740|0;HEAP32[r25>>2]=0;r26=_pce_get_interval_us(r25);HEAP32[r20>>2]=0;STACKTOP=r4;return}function _st_clock_discontinuity(r1){var r2;HEAP32[r1+201736>>2]=0;r2=r1+201740|0;HEAP32[r2>>2]=0;_pce_get_interval_us(r2);HEAP32[r1+201732>>2]=0;return}function _st_new(r1){var r2,r3,r4;r2=_malloc(201904);r3=r2;if((r2|0)==0){r4=0}else{_st_init(r3,r1);r4=r3}return r4}function _st_set_pause(r1,r2){var r3;r3=(r2|0)!=0;HEAP8[r1+201718|0]=r3&1;if(r3){return}HEAP32[r1+201736>>2]=0;r3=r1+201740|0;HEAP32[r3>>2]=0;_pce_get_interval_us(r3);HEAP32[r1+201732>>2]=0;return}function _st_set_speed(r1,r2){var r3,r4;r3=0;r4=STACKTOP;_st_log_deb(29152,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;HEAP32[r1+201728>>2]=r2;r2=r1+201732|0;HEAP32[r2>>2]=0;HEAP32[r1+201736>>2]=0;r3=r1+201740|0;HEAP32[r3>>2]=0;_pce_get_interval_us(r3);HEAP32[r2>>2]=0;STACKTOP=r4;return}function _st_set_msg_trm(r1,r2,r3){var r4,r5;r4=HEAP32[r1+201688>>2];if((r4|0)==0){r5=1;return r5}r5=_trm_set_msg_trm(r4,r2,r3);return r5}function _st_set_cpu_model(r1,r2){var r3;if((_strcmp(r2,26696)|0)==0){_e68_set_68000(HEAP32[r1+4>>2]);r3=0;return r3}if((_strcmp(r2,24880)|0)==0){_e68_set_68010(HEAP32[r1+4>>2]);r3=0;return r3}if((_strcmp(r2,23512)|0)!=0){r3=1;return r3}_e68_set_68020(HEAP32[r1+4>>2]);r3=0;return r3}function _st_reset(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;r4=r1+201717|0;if((HEAP8[r4]|0)!=0){STACKTOP=r3;return}HEAP8[r4]=1;_st_log_deb(22224,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;HEAP8[r1+201712|0]=0;HEAP8[r1+201713|0]=0;_e68901_reset(r1+24|0);_e6850_reset(r1+204|0);_e6850_reset(r1+252|0);_st_acsi_reset(r1+70456|0);_st_fdc_reset(r1+4676|0);_st_dma_reset(r1+201604|0);_st_kbd_reset(r1+300|0);_st_video_reset(HEAP32[r1+201684>>2]);r2=r1+8|0;r5=HEAP32[r2>>2];r6=r1+201708|0;_mem_set_uint32_be(r5,0,_mem_get_uint32_be(r5,HEAP32[r6>>2]));r5=HEAP32[r2>>2];_mem_set_uint32_be(r5,4,_mem_get_uint32_be(r5,HEAP32[r6>>2]+4|0));_e68_reset(HEAP32[r1+4>>2]);if((HEAP8[r1+201716|0]|0)!=0){_mem_set_uint32_be(HEAP32[r2>>2],1056,1965038067);_mem_set_uint32_be(HEAP32[r2>>2],1082,594974890);_mem_set_uint32_be(HEAP32[r2>>2],1306,1431677610);_mem_set_uint8(HEAP32[r2>>2],1060,5);r6=HEAP32[r2>>2];_mem_set_uint32_be(r6,1070,_mem_blk_get_size(HEAP32[r1+12>>2]));_mem_set_uint32_be(HEAP32[r2>>2],1210,16e3)}HEAP32[r1+201736>>2]=0;r2=r1+201740|0;HEAP32[r2>>2]=0;_pce_get_interval_us(r2);HEAP32[r1+201732>>2]=0;HEAP8[r4]=0;STACKTOP=r3;return}function _st_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=(r2|0)==0?16:r2;r2=HEAP32[r1+201728>>2];if((r2|0)==0){r8=HEAP32[r1+201732>>2]+r7|0}else{r8=Math_imul(r2,r7)|0}r2=r1+201748|0;HEAP32[r2>>2]=HEAP32[r2>>2]+r7;_e68_clock(HEAP32[r1+4>>2],r8);_st_video_clock(HEAP32[r1+201684>>2],r7);r8=r1+201752|0;r2=HEAP32[r8>>2]+r7|0;HEAP32[r8>>2]=r2;if(r2>>>0<16){STACKTOP=r5;return}r7=r2&-16;r9=r1+201756|0;HEAP32[r9>>2]=HEAP32[r9>>2]+r7;HEAP32[r8>>2]=r2&15;r8=r1+4676|0;if((HEAP8[r8|0]|0)!=0){_wd179x_clock2(r8|0,r7)}r10=r1+204|0;r11=r2>>>4;_e6850_clock(r10,r11);_e6850_clock(r1+252|0,r11);r11=r1+24|0;_e68901_clock(r11,r7<<2);if(HEAP32[r9>>2]>>>0<256){STACKTOP=r5;return}r7=r1+201768|0;r2=HEAP32[r7>>2];r12=r1+201772|0;do{if(r2>>>0<HEAP32[r12>>2]>>>0){if((_e68901_receive(r11,HEAP8[r2+(r1+201776)|0])|0)!=0){break}HEAP32[r7>>2]=HEAP32[r7>>2]+1}}while(0);r2=r1+201760|0;r11=HEAP32[r2>>2]+HEAP32[r9>>2]|0;HEAP32[r2>>2]=r11;HEAP32[r9>>2]=0;if(r11>>>0<8192){STACKTOP=r5;return}do{if(HEAP32[r7>>2]>>>0>=HEAP32[r12>>2]>>>0){r11=HEAP32[r1+201700>>2];if((r11|0)==0){break}HEAP32[r7>>2]=0;HEAP32[r12>>2]=_chr_read(r11,r1+201776|0,128)}}while(0);_st_acsi_clock(r1+70456|0);r12=HEAP32[r1+201688>>2];if((r12|0)!=0){_trm_check(r12)}r12=r1+300|0;do{if((HEAP8[r12|0]|0)!=0){if((_st_kbd_buf_get(r12,r6)|0)!=0){break}_e6850_receive(r10,HEAP8[r6])}}while(0);_st_fdc_clock_media_change(r8,HEAP32[r2>>2]);r8=r1+201736|0;r6=HEAP32[r8>>2]+HEAP32[r2>>2]|0;HEAP32[r8>>2]=r6;do{if(r6>>>0>31999){HEAP32[r8>>2]=r6-32e3;r10=_pce_get_interval_us(r1+201740|0);do{if(r10>>>0<4e3){r12=r1+201744|0;r7=HEAP32[r12>>2]+(4e3-r10)|0;HEAP32[r12>>2]=r7;if((r7|0)<=0){r13=r7;r14=r12;break}r12=r1+201732|0;HEAP32[r12>>2]=HEAP32[r12>>2]+1;r15=r7;r3=27}else{r7=r1+201744|0;r12=HEAP32[r7>>2]+(4e3-r10)|0;HEAP32[r7>>2]=r12;if((r12|0)>=0){r15=r12;r3=27;break}r7=r1+201732|0;r11=HEAP32[r7>>2];if((r11|0)==0){r15=r12;r3=27;break}HEAP32[r7>>2]=r11-1;r15=r12;r3=27}}while(0);do{if(r3==27){r10=r1+201744|0;if((r15|0)<=9999){r13=r15;r14=r10;break}_pce_usleep(r15);r13=HEAP32[r10>>2];r14=r10}}while(0);if((r13|0)>=-1e6){break}_st_log_deb(22048,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;HEAP32[r14>>2]=HEAP32[r14>>2]+1e6}}while(0);HEAP32[r2>>2]=HEAP32[r2>>2]-8192;STACKTOP=r5;return}function _st_set_hb(r1,r2){var r3,r4,r5,r6;r3=r2<<24>>24==0;r2=r1+201714|0;r4=HEAP8[r2];r5=r3?r4&-2:r4|1;HEAP8[r2]=r5;_e68901_set_tbi(r1+24|0,(r5&3)!=0|0);r5=r1+201712|0;r2=HEAP8[r5];r4=(r2&4)==0;do{if(r3){if(r4){return}else{r6=r2&-5;break}}else{if(r4){r6=r2|4;break}else{return}}}while(0);HEAP8[r5]=r6;r5=0;r2=r6&255;while(1){r6=r2>>>1;if((r6|0)==0){break}else{r5=r5+1|0;r2=r6}}HEAP8[r1+201713|0]=r5;_e68_interrupt(HEAP32[r1+4>>2],r5&255);return}function _st_set_vb(r1,r2){var r3,r4,r5,r6;r3=r2<<24>>24==0;r2=r1+201714|0;r4=HEAP8[r2];HEAP8[r2]=r3?r4&-3:r4|2;r4=r1+201712|0;r2=HEAP8[r4];r5=(r2&16)==0;do{if(r3){if(r5){return}else{r6=r2&-17;break}}else{if(r5){r6=r2|16;break}else{return}}}while(0);HEAP8[r4]=r6;r4=0;r2=r6&255;while(1){r6=r2>>>1;if((r6|0)==0){break}else{r4=r4+1|0;r2=r6}}HEAP8[r1+201713|0]=r4;_e68_interrupt(HEAP32[r1+4>>2],r4&255);return}function _st_set_port_a(r1,r2){var r3,r4;r3=~(r2&255);if((r3&2|0)!=0){_wd179x_select_drive(r1+4676|0,0)}r4=r1+4676|0;if((r3&4|0)!=0){_wd179x_select_drive(r4,1)}_wd179x_select_head(r4,r3&1,0);r4=r1+201724|0;if((r3&32&((HEAP8[r4]^r2)&255)|0)==0){HEAP8[r4]=r2;return}r3=HEAP32[r1+201696>>2];if((r3|0)==0){HEAP8[r4]=r2;return}_chr_write(r3,r1+201725|0,1);HEAP8[r4]=r2;return}function _st_set_port_b(r1,r2){HEAP8[r1+201725|0]=r2;return}function _st_midi_send(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;HEAP8[r4]=r2;r5=HEAP32[r1+201704>>2];if((r5|0)==0){r6=r2}else{_chr_write(r5,r4,1);r6=HEAP8[r4]}_st_smf_set_uint8(r1+460|0,r6,HEAP32[r1+201748>>2]);STACKTOP=r3;return}function _st_interrupt_mfp(r1,r2){var r3,r4,r5,r6;r3=r1+201712|0;r4=HEAP8[r3];r5=(r4&64)==0;do{if(r2<<24>>24==0){if(r5){return}else{r6=r4&-65;break}}else{if(r5){r6=r4|64;break}else{return}}}while(0);HEAP8[r3]=r6;r3=0;r4=r6&255;while(1){r6=r4>>>1;if((r6|0)==0){break}else{r3=r3+1|0;r4=r6}}HEAP8[r1+201713|0]=r3;_e68_interrupt(HEAP32[r1+4>>2],r3&255);return}function _st_usart_send(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;HEAP8[r4]=r2;r2=HEAP32[r1+201700>>2];if((r2|0)==0){STACKTOP=r3;return 0}_chr_write(r2,r4,1);STACKTOP=r3;return 0}function _st_usart_recv(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=HEAP32[r1+201700>>2];if((r3|0)==0){r4=1;return r4}r5=r1+201768|0;r6=HEAP32[r5>>2];r7=r1+201772|0;r8=HEAP32[r7>>2];if(r6>>>0<r8>>>0){r9=r6;r10=r8}else{HEAP32[r5>>2]=0;r8=_chr_read(r3,r1+201776|0,128);HEAP32[r7>>2]=r8;r9=HEAP32[r5>>2];r10=r8}if(r9>>>0>=r10>>>0){r4=1;return r4}HEAP32[r5>>2]=r9+1;HEAP8[r2]=HEAP8[r9+(r1+201776)|0];r4=0;return r4}function _st_inta(r1,r2){var r3,r4,r5,r6;if((r2|0)==6){r3=_e68901_inta(r1+24|0);return r3}else if((r2|0)==2){r4=r1+201712|0;r5=HEAP8[r4];if((r5&4)==0){r3=-1;return r3}r6=r5&-5;HEAP8[r4]=r6;r4=0;r5=r6&255;while(1){r6=r5>>>1;if((r6|0)==0){break}else{r4=r4+1|0;r5=r6}}HEAP8[r1+201713|0]=r4;_e68_interrupt(HEAP32[r1+4>>2],r4&255);r3=-1;return r3}else if((r2|0)==4){r2=r1+201712|0;r4=HEAP8[r2];if((r4&16)==0){r3=-1;return r3}r5=r4&-17;HEAP8[r2]=r5;r2=0;r4=r5&255;while(1){r5=r4>>>1;if((r5|0)==0){break}else{r2=r2+1|0;r4=r5}}HEAP8[r1+201713|0]=r2;_e68_interrupt(HEAP32[r1+4>>2],r2&255);r3=-1;return r3}else{r3=-1;return r3}}function _st_print_state_cpu(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+608|0;r4=r3;r5=r3+352;_pce_prt_sep(27112);r6=HEAP32[r1+4>>2];r1=r6+166|0;r7=HEAPU16[r1>>1];r8=_e68_get_exception(r6);r9=_e68_get_exception_name(r6);r10=_e68_get_last_trap_a(r6)&65535;r11=HEAP32[r6+364>>2];r12=HEAPU16[r1>>1]>>>8&7;_pce_printf(26904,(r2=STACKTOP,STACKTOP=STACKTOP+104|0,HEAP32[r2>>2]=r7,HEAP32[r2+8>>2]=(r7&32768|0)!=0?84:45,HEAP32[r2+16>>2]=(r7&8192|0)!=0?83:45,HEAP32[r2+24>>2]=(r7&16|0)!=0?88:45,HEAP32[r2+32>>2]=(r7&8|0)!=0?78:45,HEAP32[r2+40>>2]=(r7&4|0)!=0?90:45,HEAP32[r2+48>>2]=(r7&2|0)!=0?86:45,HEAP32[r2+56>>2]=(r7&1|0)!=0?67:45,HEAP32[r2+64>>2]=r8,HEAP32[r2+72>>2]=r9,HEAP32[r2+80>>2]=r10,HEAP32[r2+88>>2]=r11,HEAP32[r2+96>>2]=r12,r2));STACKTOP=r2;r12=HEAP32[r6+88>>2];r11=HEAP32[r6+104>>2];r10=HEAP32[r6+120>>2];r9=HEAP32[r6+136>>2];r8=r6+152|0;r7=HEAP32[r8>>2];r1=_e68_get_last_pc(r6,0);_pce_printf(26704,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=r12,HEAP32[r2+8>>2]=r11,HEAP32[r2+16>>2]=r10,HEAP32[r2+24>>2]=r9,HEAP32[r2+32>>2]=r7,HEAP32[r2+40>>2]=r1,r2));STACKTOP=r2;r1=HEAP32[r6+92>>2];r7=HEAP32[r6+108>>2];r9=HEAP32[r6+124>>2];r10=HEAP32[r6+140>>2];r11=HEAP32[r6+156>>2];r12=_e68_get_last_pc(r6,1);_pce_printf(26480,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=r1,HEAP32[r2+8>>2]=r7,HEAP32[r2+16>>2]=r9,HEAP32[r2+24>>2]=r10,HEAP32[r2+32>>2]=r11,HEAP32[r2+40>>2]=r12,r2));STACKTOP=r2;r12=HEAP32[r6+96>>2];r11=HEAP32[r6+112>>2];r10=HEAP32[r6+128>>2];r9=HEAP32[r6+144>>2];r7=r6+334|0;r1=r6+148|0;r13=HEAP32[((HEAP8[r7]|0)==0?r1:r6+168|0)>>2];r14=_e68_get_last_pc(r6,2);_pce_printf(26360,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=r12,HEAP32[r2+8>>2]=r11,HEAP32[r2+16>>2]=r10,HEAP32[r2+24>>2]=r9,HEAP32[r2+32>>2]=r13,HEAP32[r2+40>>2]=r14,r2));STACKTOP=r2;r14=HEAP32[r6+100>>2];r13=HEAP32[r6+116>>2];r9=HEAP32[r6+132>>2];r10=HEAP32[r1>>2];if((HEAP8[r7]|0)!=0){r15=r10;r16=_e68_get_last_pc(r6,3);_pce_printf(26176,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=r14,HEAP32[r2+8>>2]=r13,HEAP32[r2+16>>2]=r9,HEAP32[r2+24>>2]=r10,HEAP32[r2+32>>2]=r15,HEAP32[r2+40>>2]=r16,r2));STACKTOP=r2;r17=HEAP32[r8>>2];_e68_dasm_mem(r6,r4,r17);r18=r5|0;_st_dasm_str(r18,r4,1);r19=HEAP32[r8>>2];_pce_printf(26120,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r19,HEAP32[r2+8>>2]=r18,r2));STACKTOP=r2;STACKTOP=r3;return}r15=HEAP32[r6+172>>2];r16=_e68_get_last_pc(r6,3);_pce_printf(26176,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=r14,HEAP32[r2+8>>2]=r13,HEAP32[r2+16>>2]=r9,HEAP32[r2+24>>2]=r10,HEAP32[r2+32>>2]=r15,HEAP32[r2+40>>2]=r16,r2));STACKTOP=r2;r17=HEAP32[r8>>2];_e68_dasm_mem(r6,r4,r17);r18=r5|0;_st_dasm_str(r18,r4,1);r19=HEAP32[r8>>2];_pce_printf(26120,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r19,HEAP32[r2+8>>2]=r18,r2));STACKTOP=r2;STACKTOP=r3;return}function _st_dasm_str(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+256|0;r6=r5;r7=r6|0;HEAP8[r1]=0;do{if((r3|0)!=0){r8=r2+8|0;if((HEAP32[r8>>2]|0)==0){r9=0}else{r10=r6;r11=0;while(1){_sprintf(r10,19856,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r2+12+(r11<<1)>>1],r4));STACKTOP=r4;_strcat(r1,r10);r12=r11+1|0;r13=HEAP32[r8>>2];if(r12>>>0<r13>>>0){r11=r12}else{break}}if(r13>>>0<4){r9=r13}else{break}}while(1){r11=r1+_strlen(r1)|0;HEAP8[r11]=HEAP8[19824];HEAP8[r11+1|0]=HEAP8[19825];HEAP8[r11+2|0]=HEAP8[19826];HEAP8[r11+3|0]=HEAP8[19827];HEAP8[r11+4|0]=HEAP8[19828];HEAP8[r11+5|0]=HEAP8[19829];r11=r9+1|0;if(r11>>>0<4){r9=r11}else{break}}}}while(0);r9=HEAP32[r2>>2];do{if((r9&1|0)==0){if((r9&4|0)!=0){r13=r1+_strlen(r1)|0;tempBigInt=62;HEAP8[r13]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt;break}r13=r1+_strlen(r1)|0;if((r9&16|0)==0){tempBigInt=32;HEAP8[r13]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt;break}else{tempBigInt=60;HEAP8[r13]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt;break}}else{r13=r1+_strlen(r1)|0;tempBigInt=42;HEAP8[r13]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt}}while(0);r9=r2+32|0;r13=HEAP32[r2+28>>2];if((r13|0)==2){r3=r6;_sprintf(r3,19376,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r9,HEAP32[r4+8>>2]=r2+96,HEAP32[r4+16>>2]=r2+160,r4));STACKTOP=r4;r14=r3}else if((r13|0)==3){r3=r6;_sprintf(r3,19288,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=r9,HEAP32[r4+8>>2]=r2+96,HEAP32[r4+16>>2]=r2+160,HEAP32[r4+24>>2]=r2+224,r4));STACKTOP=r4;r14=r3}else if((r13|0)==0){r3=r6;_memcpy(r3,r9,_strlen(r9)+1|0)|0;r14=r3}else if((r13|0)==1){r13=r6;_sprintf(r13,19408,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r9,HEAP32[r4+8>>2]=r2+96,r4));STACKTOP=r4;r14=r13}else{HEAP32[r7>>2]=2960685;r14=r6}_strcat(r1,r14);r14=r2+288|0;if((HEAP8[r14]|0)==0){STACKTOP=r5;return}r2=_strlen(r1);r6=r1+r2|0;if(r2>>>0<50){_memset(r6,32,50-r2|0)|0;r15=r1+50|0}else{r15=r6}HEAP8[r15]=HEAP8[19232];HEAP8[r15+1|0]=HEAP8[19233];HEAP8[r15+2|0]=HEAP8[19234];_strcat(r15,r14);STACKTOP=r5;return}function _st_run(r1){var r2,r3,r4;r2=r1+201720|0;_pce_start(r2);_st_clock_discontinuity(r1);_st_clock(HEAP32[39968>>2],0);_st_clock(HEAP32[39968>>2],0);if((HEAP32[r2>>2]|0)!=0){_pce_stop();return}r3=r1+201718|0;r4=r1+201688|0;while(1){if((HEAP8[r3]|0)!=0){while(1){_pce_usleep(5e4);_trm_check(HEAP32[r4>>2]);if((HEAP8[r3]|0)==0){break}}}_st_clock(HEAP32[39968>>2],0);_st_clock(HEAP32[39968>>2],0);if((HEAP32[r2>>2]|0)!=0){break}}_pce_stop();return}function _st_get_sim(){return HEAP32[40400>>2]}function _st_run_emscripten(r1){HEAP32[40400>>2]=r1;_pce_start(r1+201720|0);_st_clock_discontinuity(r1);_emscripten_set_main_loop(664,100,1);return}function _st_run_emscripten_step(){var r1,r2;r1=0;r2=0;while(1){if((r2|0)>=1e3){r1=5;break}_st_clock(HEAP32[40400>>2],0);_st_clock(HEAP32[40400>>2],0);if((HEAP32[HEAP32[40400>>2]+201720>>2]|0)==0){r2=r2+1|0}else{break}}if(r1==5){return}_pce_stop();_emscripten_cancel_main_loop();return}function _st_cmd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+4016|0;r6=r5;r7=r5+8;r8=r5+16;r9=r5+1040;r10=r5+1392;r11=r5+1400;r12=r5+1408;r13=r5+1760;r14=r5+2016;r15=r5+2368;r16=r5+2376;r17=r5+2384;r18=r5+2648;r19=r5+2656;r20=r5+2912;r21=r5+3264;r22=r5+3272;r23=r5+3624;r24=r5+3632;r25=r5+3984;r26=r5+3992;r27=r5+4e3;r28=r5+4008;r29=r1+201688|0;r30=HEAP32[r29>>2];if((r30|0)!=0){_trm_check(r30)}L4:do{if((_cmd_match(r2,25976)|0)==0){if((_cmd_match(r2,23744)|0)!=0){HEAP32[r28>>2]=1;_cmd_match_uint32(r2,r28);if((_cmd_match_end(r2)|0)==0){break}if((HEAP32[r28>>2]|0)!=0){while(1){_st_clock(r1,1);r30=HEAP32[r28>>2]-1|0;HEAP32[r28>>2]=r30;if((r30|0)==0){break}}}_st_print_state_cpu(r1);break}if((_cmd_match(r2,19352)|0)!=0){if((_cmd_match(r2,25976)|0)!=0){if((_cmd_match_uint32(r2,r27)|0)!=0){r30=r1+16|0;while(1){_bps_bp_add(r30,_bp_addr_new(HEAP32[r27>>2]));if((_cmd_match_uint32(r2,r27)|0)==0){break}}}if((_cmd_match_end(r2)|0)==0){break}r30=r1+201720|0;_pce_start(r30);_st_clock_discontinuity(r1);r31=r1+4|0;r32=r1+16|0;r33=HEAP32[_stdout>>2];L24:while(1){r34=_e68_get_opcnt(HEAP32[r31>>2]);while(1){if((_e68_get_opcnt(HEAP32[r31>>2])|0)!=(r34|0)){continue L24}_st_clock(r1,1);if((_bps_check(r32,0,HEAP32[HEAP32[r31>>2]+152>>2]&16777215,r33)|0)!=0){break L24}if((HEAP32[r30>>2]|0)!=0){break L24}}}_pce_stop();break}if((_cmd_match(r2,2e4)|0)==0){if((_cmd_match_end(r2)|0)==0){break}_st_run(r1);break}if((_cmd_match_uint16(r2,r26)|0)==0){HEAP16[r26>>1]=-1}if((_cmd_match_end(r2)|0)==0){break}r30=r1+4|0;r33=_e68_get_exception_cnt(HEAP32[r30>>2]);r31=r1+201720|0;_pce_start(r31);_st_clock_discontinuity(r1);r32=r1+16|0;r34=HEAP32[_stdout>>2];while(1){r35=_e68_get_opcnt(HEAP32[r30>>2]);while(1){if((_e68_get_opcnt(HEAP32[r30>>2])|0)!=(r35|0)){break}_st_clock(r1,1);if((_bps_check(r32,0,HEAP32[HEAP32[r30>>2]+152>>2]&16777215,r34)|0)!=0){break}if((HEAP32[r31>>2]|0)!=0){break}}if((_bps_check(r32,0,HEAP32[HEAP32[r30>>2]+152>>2]&16777215,r34)|0)!=0){break}if((HEAP32[r31>>2]|0)!=0){break}if((_e68_get_exception_cnt(HEAP32[r30>>2])|0)==(r33|0)){continue}r35=(HEAP16[r26>>1]|0)==-1;r36=_e68_get_exception(HEAP32[r30>>2]);if(r35){r3=35;break}if((r36|0)==(HEAPU16[r26>>1]|0)){r3=37;break}}if(r3==35){r33=_e68_get_exception_name(HEAP32[r30>>2]);_pce_printf(19896,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r36,HEAP32[r4+8>>2]=r33,r4));STACKTOP=r4}else if(r3==37){r33=_e68_get_exception(HEAP32[r30>>2]);r31=_e68_get_exception_name(HEAP32[r30>>2]);_pce_printf(19896,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r33,HEAP32[r4+8>>2]=r31,r4));STACKTOP=r4}_pce_stop();break}if((_cmd_match(r2,33664)|0)!=0){if((_cmd_match_uint16(r2,r25)|0)==0){HEAP16[r25>>1]=2}if((_cmd_match_end(r2)|0)==0){break}_e68_set_halt(HEAP32[r1+4>>2],HEAPU16[r25>>1]);_st_print_state_cpu(r1);break}if((_cmd_match(r2,32352)|0)!=0){_pce_puts(20024);break}if((_cmd_match(r2,31704)|0)!=0){HEAP32[r23>>2]=1;do{if((_cmd_match(r2,31704)|0)!=0){HEAP32[r23>>2]=2;if((_cmd_match(r2,31704)|0)==0){break}while(1){HEAP32[r23>>2]=HEAP32[r23>>2]+1;if((_cmd_match(r2,31704)|0)==0){break}}}}while(0);_cmd_match_uint32(r2,r23);if((_cmd_match_end(r2)|0)==0){break}r30=r1+201720|0;_pce_start(r30);_st_clock_discontinuity(r1);L74:do{if((HEAP32[r23>>2]|0)!=0){r31=r1+4|0;r33=r24|0;r34=r1+16|0;r32=HEAP32[_stdout>>2];r35=r24+8|0;while(1){r37=HEAP32[r31>>2];_e68_dasm_mem(r37,r24,HEAP32[r37+152>>2]);r37=HEAP32[r31>>2];do{if((HEAP32[r33>>2]&4|0)==0){r38=_e68_get_exception_cnt(r37);r39=_e68_get_opcnt(HEAP32[r31>>2]);while(1){if((_e68_get_opcnt(HEAP32[r31>>2])|0)!=(r39|0)){break}_st_clock(r1,1);if((_bps_check(r34,0,HEAP32[HEAP32[r31>>2]+152>>2]&16777215,r32)|0)!=0){break L74}if((HEAP32[r30>>2]|0)!=0){break L74}}if((_e68_get_exception_cnt(HEAP32[r31>>2])|0)==(r38|0)){break}r39=HEAP32[r31>>2];r40=HEAP32[r39+380>>2];if((HEAP32[r39+152>>2]|0)==(r40|0)){break}while(1){_st_clock(r1,1);if((_bps_check(r34,0,HEAP32[HEAP32[r31>>2]+152>>2]&16777215,r32)|0)!=0){break L74}if((HEAP32[r30>>2]|0)!=0){break L74}if((HEAP32[HEAP32[r31>>2]+152>>2]|0)==(r40|0)){break}}}else{r40=HEAP32[r35>>2]<<1;r38=r40+HEAP32[r37+152>>2]|0;if((r40|0)==0){break}while(1){_st_clock(r1,1);if((_bps_check(r34,0,HEAP32[HEAP32[r31>>2]+152>>2]&16777215,r32)|0)!=0){break L74}if((HEAP32[r30>>2]|0)!=0){break L74}if((HEAP32[HEAP32[r31>>2]+152>>2]|0)==(r38|0)){break}}}}while(0);r37=HEAP32[r23>>2]-1|0;HEAP32[r23>>2]=r37;if((r37|0)==0){break}}}}while(0);_pce_stop();_st_print_state_cpu(r1);break}if((_cmd_match(r2,25536)|0)!=0){HEAP32[r21>>2]=1;do{if((_cmd_match(r2,25536)|0)!=0){HEAP32[r21>>2]=2;if((_cmd_match(r2,25536)|0)==0){break}while(1){HEAP32[r21>>2]=HEAP32[r21>>2]+1;if((_cmd_match(r2,25536)|0)==0){break}}}}while(0);_cmd_match_uint32(r2,r21);if((_cmd_match_end(r2)|0)==0){break}r30=r1+201720|0;_pce_start(r30);_st_clock_discontinuity(r1);L106:do{if((HEAP32[r21>>2]|0)!=0){r31=r1+4|0;r32=r22+8|0;r34=r1+16|0;r35=HEAP32[_stdout>>2];r33=HEAP32[r31>>2];while(1){_e68_dasm_mem(r33,r22,HEAP32[r33+152>>2]);r37=HEAP32[r31>>2];r38=HEAP32[r32>>2]<<1;r40=r38+HEAP32[r37+152>>2]|0;if((r38|0)==0){r41=r37}else{while(1){_st_clock(r1,1);if((_bps_check(r34,0,HEAP32[HEAP32[r31>>2]+152>>2]&16777215,r35)|0)!=0){break L106}if((HEAP32[r30>>2]|0)!=0){break L106}r37=HEAP32[r31>>2];if((HEAP32[r37+152>>2]|0)==(r40|0)){r41=r37;break}}}r40=HEAP32[r21>>2]-1|0;HEAP32[r21>>2]=r40;if((r40|0)==0){break}else{r33=r41}}}}while(0);_pce_stop();_st_print_state_cpu(r1);break}if((_cmd_match(r2,30880)|0)!=0){if((_cmd_match_end(r2)|0)==0){break}_st_reset(r1);_st_print_state_cpu(r1);break}if((_cmd_match(r2,30624)|0)!=0){if((_cmd_match_end(r2)|0)==0){break}r30=r1+201720|0;_pce_start(r30);r33=r1+4|0;r31=r1+16|0;r35=HEAP32[_stdout>>2];r34=r20|0;while(1){r32=_e68_get_opcnt(HEAP32[r33>>2]);while(1){if((_e68_get_opcnt(HEAP32[r33>>2])|0)!=(r32|0)){break}_st_clock(r1,1);if((_bps_check(r31,0,HEAP32[HEAP32[r33>>2]+152>>2]&16777215,r35)|0)!=0){break}if((HEAP32[r30>>2]|0)!=0){break}}if((_bps_check(r31,0,HEAP32[HEAP32[r33>>2]+152>>2]&16777215,r35)|0)!=0){break}if((HEAP32[r30>>2]|0)!=0){break}r32=HEAP32[r33>>2];_e68_dasm_mem(r32,r20,HEAP32[r32+152>>2]);if((HEAP32[r34>>2]&8|0)!=0){r3=97;break}}if(r3==97){_st_print_state_cpu(r1)}_pce_stop();break}if((_cmd_match(r2,29608)|0)!=0){r34=r19|0;if((_cmd_match_eol(r2)|0)!=0){_st_print_state_cpu(r1);break}if((_cmd_match_ident(r2,r34,256)|0)==0){_cmd_error(r2,20992);break}r33=r1+4|0;if((_e68_get_reg(HEAP32[r33>>2],r34,r18)|0)!=0){_pce_printf(20704,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r34,r4));STACKTOP=r4;break}if((_cmd_match_eol(r2)|0)!=0){_pce_printf(20664,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r18>>2],r4));STACKTOP=r4;break}if((_cmd_match_uint32(r2,r18)|0)==0){_cmd_error(r2,20624);break}if((_cmd_match_end(r2)|0)==0){break}_e68_set_reg(HEAP32[r33>>2],r34,HEAP32[r18>>2]);_st_print_state_cpu(r1);break}if((_cmd_match(r2,28936)|0)!=0){if((_cmd_match_eol(r2)|0)!=0){_st_print_state_cpu(r1);break}r34=_cmd_get_str(r2);_cmd_set_str(r17,r34);if((_cmd_match_eol(r17)|0)!=0){break}if((_cmd_match_eol(r17)|0)!=0){break}r34=r1+201684|0;r33=r1+29|0;r30=r1+28|0;r35=r1+30|0;r31=r1+31|0;r32=r1+32|0;r40=r1+34|0;r37=r1+36|0;r38=r1+38|0;r39=r1+44|0;r42=r1+42|0;r43=r1+46|0;r44=r1+47|0;r45=r1+192|0;r46=r1+48|0;r47=r1+49|0;r48=r1+53|0;r49=r1+51|0;r50=r1+55|0;r51=r1+60|0;r52=r1+64|0;r53=r1+68|0;r54=r1+72|0;r55=r1+82|0;r56=r1+83|0;r57=r1+84|0;r58=r1+92|0;r59=r1+100|0;r60=r1+88|0;r61=r1+86|0;r62=r1+96|0;r63=r1+106|0;r64=r1+107|0;r65=r1+108|0;r66=r1+116|0;r67=r1+124|0;r68=r1+112|0;r69=r1+110|0;r70=r1+120|0;r71=r1+130|0;r72=r1+131|0;r73=r1+132|0;r74=r1+140|0;r75=r1+148|0;r76=r1+136|0;r77=r1+134|0;r78=r1+144|0;r79=r1+154|0;r80=r1+155|0;r81=r1+156|0;r82=r1+164|0;r83=r1+172|0;r84=r1+160|0;r85=r1+158|0;r86=r1+168|0;r87=r1+252|0;r88=r1+253|0;r89=r1+255|0;r90=r1+254|0;r91=r1+288|0;r92=r1+204|0;r93=r1+205|0;r94=r1+207|0;r95=r1+206|0;r96=r1+240|0;r97=r1+8|0;r98=HEAP32[_stdout>>2];r99=r1+201604|0;r100=r1+201606|0;r101=r1+201612|0;L164:while(1){do{if((_cmd_match(r17,23864)|0)==0){if((_cmd_match(r17,23784)|0)!=0){_pce_prt_sep(21136);r102=HEAPU16[r100>>1];r103=HEAP32[r101>>2];_pce_printf(21040,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r99>>1],HEAP32[r4+8>>2]=r102,HEAP32[r4+16>>2]=r103,r4));STACKTOP=r4;break}if((_cmd_match(r17,23736)|0)!=0){_pce_prt_sep(21192);_mem_prt_state(HEAP32[r97>>2],r98);break}if((_cmd_match(r17,23688)|0)!=0){_pce_prt_sep(21440);r103=HEAPU8[r93];r102=HEAPU8[r94];r104=HEAPU8[r95];r105=HEAPU8[r96];_pce_printf(21248,(r4=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r4>>2]=HEAPU8[r92],HEAP32[r4+8>>2]=r103,HEAP32[r4+16>>2]=r102,HEAP32[r4+24>>2]=r104,HEAP32[r4+32>>2]=r105,r4));STACKTOP=r4;break}if((_cmd_match(r17,23592)|0)!=0){_pce_prt_sep(21376);r105=HEAPU8[r88];r104=HEAPU8[r89];r102=HEAPU8[r90];r103=HEAPU8[r91];_pce_printf(21248,(r4=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r4>>2]=HEAPU8[r87],HEAP32[r4+8>>2]=r105,HEAP32[r4+16>>2]=r104,HEAP32[r4+24>>2]=r102,HEAP32[r4+32>>2]=r103,r4));STACKTOP=r4;break}if((_cmd_match(r17,23504)|0)!=0){_pce_prt_sep(22552);r103=HEAPU8[r30];r102=HEAPU8[r35];r104=HEAPU8[r31];r105=HEAPU8[r32];_pce_printf(22416,(r4=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r4>>2]=HEAPU8[r33],HEAP32[r4+8>>2]=r103,HEAP32[r4+16>>2]=r102,HEAP32[r4+24>>2]=r104,HEAP32[r4+32>>2]=r105,r4));STACKTOP=r4;r105=HEAPU16[r37>>1];r104=HEAPU16[r38>>1];r102=HEAPU16[r39>>1];r103=HEAPU16[r42>>1];r106=HEAPU8[r43];r107=HEAPU8[r44];r108=HEAPU8[r45];_pce_printf(22296,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=HEAPU16[r40>>1],HEAP32[r4+8>>2]=r105,HEAP32[r4+16>>2]=r104,HEAP32[r4+24>>2]=r102,HEAP32[r4+32>>2]=r103,HEAP32[r4+40>>2]=r106,HEAP32[r4+48>>2]=r107,HEAP32[r4+56>>2]=r108,r4));STACKTOP=r4;r108=HEAPU8[r46];r107=HEAP8[408+(r108>>>1&3)|0]|0;r106=HEAPU8[r47];r103=HEAPU8[r48];r102=HEAPU8[r49];r104=HEAPU8[r50];r105=HEAP32[r51>>2];r109=HEAP32[r52>>2];r110=HEAP32[r53>>2];r111=HEAP32[r54>>2];_pce_printf(22136,(r4=STACKTOP,STACKTOP=STACKTOP+96|0,HEAP32[r4>>2]=8-(r108>>>5&3),HEAP32[r4+8>>2]=r107,HEAP32[r4+16>>2]=((r108>>>3&3)+1|0)>>>1,HEAP32[r4+24>>2]=r108,HEAP32[r4+32>>2]=r106,HEAP32[r4+40>>2]=r103,HEAP32[r4+48>>2]=r102,HEAP32[r4+56>>2]=r104,HEAP32[r4+64>>2]=r105,HEAP32[r4+72>>2]=r109,HEAP32[r4+80>>2]=r110,HEAP32[r4+88>>2]=r111,r4));STACKTOP=r4;r111=HEAPU8[r55];r110=HEAPU8[r56];r109=HEAPU8[r57];r105=HEAP32[r58>>2];r104=HEAP32[r59>>2];r102=(r104>>>0)/(HEAP32[r60>>2]>>>0)&-1;r103=(HEAP8[r61]|0)!=0|0;r106=HEAP32[r62>>2];_pce_printf(21504,(r4=STACKTOP,STACKTOP=STACKTOP+72|0,HEAP32[r4>>2]=22040,HEAP32[r4+8>>2]=r111,HEAP32[r4+16>>2]=r110,HEAP32[r4+24>>2]=r109,HEAP32[r4+32>>2]=r105,HEAP32[r4+40>>2]=r102,HEAP32[r4+48>>2]=r103,HEAP32[r4+56>>2]=r104,HEAP32[r4+64>>2]=r106,r4));STACKTOP=r4;r106=HEAPU8[r63];r104=HEAPU8[r64];r103=HEAPU8[r65];r102=HEAP32[r66>>2];r105=HEAP32[r67>>2];r109=(r105>>>0)/(HEAP32[r68>>2]>>>0)&-1;r110=(HEAP8[r69]|0)!=0|0;r111=HEAP32[r70>>2];_pce_printf(21504,(r4=STACKTOP,STACKTOP=STACKTOP+72|0,HEAP32[r4>>2]=21992,HEAP32[r4+8>>2]=r106,HEAP32[r4+16>>2]=r104,HEAP32[r4+24>>2]=r103,HEAP32[r4+32>>2]=r102,HEAP32[r4+40>>2]=r109,HEAP32[r4+48>>2]=r110,HEAP32[r4+56>>2]=r105,HEAP32[r4+64>>2]=r111,r4));STACKTOP=r4;r111=HEAPU8[r71];r105=HEAPU8[r72];r110=HEAPU8[r73];r109=HEAP32[r74>>2];r102=HEAP32[r75>>2];r103=(r102>>>0)/(HEAP32[r76>>2]>>>0)&-1;r104=(HEAP8[r77]|0)!=0|0;r106=HEAP32[r78>>2];_pce_printf(21504,(r4=STACKTOP,STACKTOP=STACKTOP+72|0,HEAP32[r4>>2]=21680,HEAP32[r4+8>>2]=r111,HEAP32[r4+16>>2]=r105,HEAP32[r4+24>>2]=r110,HEAP32[r4+32>>2]=r109,HEAP32[r4+40>>2]=r103,HEAP32[r4+48>>2]=r104,HEAP32[r4+56>>2]=r102,HEAP32[r4+64>>2]=r106,r4));STACKTOP=r4;r106=HEAPU8[r79];r102=HEAPU8[r80];r104=HEAPU8[r81];r103=HEAP32[r82>>2];r109=HEAP32[r83>>2];r110=(r109>>>0)/(HEAP32[r84>>2]>>>0)&-1;r105=(HEAP8[r85]|0)!=0|0;r111=HEAP32[r86>>2];_pce_printf(21504,(r4=STACKTOP,STACKTOP=STACKTOP+72|0,HEAP32[r4>>2]=21600,HEAP32[r4+8>>2]=r106,HEAP32[r4+16>>2]=r102,HEAP32[r4+24>>2]=r104,HEAP32[r4+32>>2]=r103,HEAP32[r4+40>>2]=r110,HEAP32[r4+48>>2]=r105,HEAP32[r4+56>>2]=r109,HEAP32[r4+64>>2]=r111,r4));STACKTOP=r4;break}if((_cmd_match(r17,23400)|0)==0){break L164}r111=HEAP32[r34>>2];_pce_prt_sep(23288);r109=HEAP32[r111+8>>2];r105=(HEAP8[r111+220|0]|0)!=0|0;r110=(HEAP8[r111+232|0]|0)!=0|0;_pce_printf(22944,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=HEAP32[r111+4>>2],HEAP32[r4+8>>2]=r109,HEAP32[r4+16>>2]=r105,HEAP32[r4+24>>2]=r110,r4));STACKTOP=r4;r110=HEAP32[r111+172>>2];r105=r111+176|0;r109=HEAP32[r105>>2];_pce_printf(22856,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=HEAP32[r111+188>>2],HEAP32[r4+8>>2]=r110,HEAP32[r4+16>>2]=r109,HEAP32[r4+24>>2]=(((r109>>>1)+8e6|0)>>>0)/(r109>>>0)&-1,r4));STACKTOP=r4;r109=HEAP32[r111+180>>2];r110=HEAP32[r111+184>>2];r103=Math_imul(HEAP32[r105>>2],r110)|0;_pce_printf(22776,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=HEAP32[r111+192>>2],HEAP32[r4+8>>2]=r109,HEAP32[r4+16>>2]=r110,HEAP32[r4+24>>2]=(((r103>>>1)+8e6|0)>>>0)/(r103>>>0)&-1,r4));STACKTOP=r4;r103=0;while(1){r110=HEAPU16[r111+64+(r103<<1)>>1];r109=HEAPU8[r111+96+(r103*3&-1)|0];r105=HEAPU8[r111+96+(r103*3&-1)+1|0];r104=HEAPU8[r111+96+(r103*3&-1)+2|0];r102=r103+8|0;r106=HEAPU16[r111+64+(r102<<1)>>1];r108=HEAPU8[r111+96+(r102*3&-1)|0];r107=HEAPU8[r111+96+(r102*3&-1)+1|0];r112=HEAPU8[r111+96+(r102*3&-1)+2|0];_pce_printf(22656,(r4=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r4>>2]=r103,HEAP32[r4+8>>2]=r110,HEAP32[r4+16>>2]=r109,HEAP32[r4+24>>2]=r105,HEAP32[r4+32>>2]=r104,HEAP32[r4+40>>2]=r102,HEAP32[r4+48>>2]=r106,HEAP32[r4+56>>2]=r108,HEAP32[r4+64>>2]=r107,HEAP32[r4+72>>2]=r112,r4));STACKTOP=r4;r112=r103+1|0;if(r112>>>0<8){r103=r112}else{break}}}else{_st_print_state_cpu(r1)}}while(0);if((_cmd_match_eol(r17)|0)!=0){break L4}}r34=_cmd_get_str(r17);_pce_printf(23336,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r34,r4));STACKTOP=r4;break}if((_cmd_match(r2,28416)|0)!=0){HEAP32[r15>>2]=1;HEAP32[r16>>2]=0;do{if((_cmd_match(r2,28416)|0)!=0){HEAP32[r15>>2]=2;if((_cmd_match(r2,28416)|0)==0){break}while(1){HEAP32[r15>>2]=HEAP32[r15>>2]+1;if((_cmd_match(r2,28416)|0)==0){break}}}}while(0);_cmd_match_uint32(r2,r15);_cmd_match_uint32(r2,r16);if((_cmd_match_end(r2)|0)==0){break}r34=r1+201720|0;_pce_start(r34);_st_clock_discontinuity(r1);r86=HEAP32[r15>>2];if((r86|0)!=0){r85=r1+4|0;r84=r19|0;r83=r1+16|0;r82=HEAP32[_stdout>>2];r81=0;r80=r86;while(1){do{if(r80>>>0>1){if(r81>>>0<HEAP32[r16>>2]>>>0){break}r86=HEAP32[r85>>2];r79=r86+152|0;_e68_dasm_mem(r86,r14,HEAP32[r79>>2]);_st_dasm_str(r84,r14,0);r78=HEAP32[r86+120>>2];r77=HEAP32[r86+144>>2];r76=HEAP32[r86+148>>2];r75=HEAPU16[r86+166>>1];r74=HEAP32[r79>>2];_pce_printf(23952,(r4=STACKTOP,STACKTOP=STACKTOP+112|0,HEAP32[r4>>2]=HEAP32[r86+88>>2],HEAP32[r4+8>>2]=r78,HEAP32[r4+16>>2]=r77,HEAP32[r4+24>>2]=r76,HEAP32[r4+32>>2]=r75,HEAP32[r4+40>>2]=(r75&32768|0)!=0?84:45,HEAP32[r4+48>>2]=(r75&8192|0)!=0?83:45,HEAP32[r4+56>>2]=(r75&1|0)!=0?67:45,HEAP32[r4+64>>2]=(r75&2|0)!=0?86:45,HEAP32[r4+72>>2]=(r75&4|0)!=0?90:45,HEAP32[r4+80>>2]=(r75&8|0)!=0?78:45,HEAP32[r4+88>>2]=(r75&16|0)!=0?88:45,HEAP32[r4+96>>2]=r74,HEAP32[r4+104>>2]=r84,r4));STACKTOP=r4}}while(0);r74=_e68_get_opcnt(HEAP32[r85>>2]);while(1){if((_e68_get_opcnt(HEAP32[r85>>2])|0)!=(r74|0)){break}_st_clock(r1,1);if((_bps_check(r83,0,HEAP32[HEAP32[r85>>2]+152>>2]&16777215,r82)|0)!=0){break}if((HEAP32[r34>>2]|0)!=0){break}}r74=r81+1|0;r75=HEAP32[r15>>2];if(r74>>>0<r75>>>0){r81=r74;r80=r75}else{break}}}_pce_stop();_st_print_state_cpu(r1);break}if((_cmd_match(r2,28016)|0)==0){r113=1;STACKTOP=r5;return r113}r80=r13|0;if(HEAP8[416]){r114=HEAP32[35824>>2]}else{HEAP8[416]=1;r81=HEAP32[HEAP32[r1+4>>2]+152>>2];HEAP32[35824>>2]=r81;r114=r81}HEAP32[r10>>2]=r114;HEAP32[r11>>2]=16;if((_cmd_match(r2,24392)|0)==0){if((_cmd_match_uint32(r2,r10)|0)!=0){_cmd_match_uint32(r2,r11)}if((_cmd_match_end(r2)|0)==0){break}if((HEAP32[r11>>2]|0)==0){r115=HEAP32[r10>>2]}else{r81=r1+4|0;r34=r12+8|0;r82=0;r85=HEAP32[r10>>2];while(1){_e68_dasm_mem(HEAP32[r81>>2],r12,r85);_st_dasm_str(r80,r12,1);_pce_printf(26120,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAP32[r10>>2],HEAP32[r4+8>>2]=r80,r4));STACKTOP=r4;r83=HEAP32[r10>>2]+(HEAP32[r34>>2]<<1)|0;HEAP32[r10>>2]=r83;r84=r82+1|0;if(r84>>>0<HEAP32[r11>>2]>>>0){r82=r84;r85=r83}else{r115=r83;break}}}HEAP32[35824>>2]=r115;break}r85=r19|0;HEAP32[r6>>2]=r114;HEAP32[r7>>2]=16;if((_cmd_match_uint32(r2,r6)|0)!=0){_cmd_match_uint32(r2,r7)}if((_cmd_match_end(r2)|0)==0){break}r82=HEAP32[r7>>2];if(r82>>>0>256){HEAP32[r7>>2]=256;r116=256}else{r116=r82}r82=HEAP32[r6>>2];r34=(r116*-12&-1)+r82&-2;if(r34>>>0>r82>>>0){break}r82=r1+4|0;r80=r9+8|0;r81=0;r83=0;r84=0;r75=5;r74=r34;while(1){do{if((r75|0)==0){HEAP32[r8+(r83<<2)>>2]=r74;r34=r83+1&255;if((r34|0)==(r81|0)){r117=0;r118=r84;r119=r81;r120=r81+1&255;break}else{r117=0;r118=r84+1|0;r119=r34;r120=r81;break}}else{r117=r75-1|0;r118=r84;r119=r83;r120=r81}}while(0);_e68_dasm_mem(HEAP32[r82>>2],r9,r74);r34=(HEAP32[r80>>2]<<1)+r74|0;if(r34>>>0>HEAP32[r6>>2]>>>0){break}else{r81=r120;r83=r119;r84=r118;r75=r117;r74=r34}}r74=HEAP32[r7>>2];if(r118>>>0>r74>>>0){r121=r118+r120-r74&255}else{r121=r120}if((r121|0)==(r119|0)){break}else{r122=r121}while(1){r74=HEAP32[r8+(r122<<2)>>2];_e68_dasm_mem(HEAP32[r82>>2],r9,r74);_st_dasm_str(r85,r9,1);_pce_printf(26120,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r74,HEAP32[r4+8>>2]=r85,r4));STACKTOP=r4;r74=r122+1&255;if((r74|0)==(r119|0)){break}else{r122=r74}}}else{_cmd_do_b(r2,r1+16|0)}}while(0);r1=HEAP32[r29>>2];if((r1|0)==0){r113=0;STACKTOP=r5;return r113}_trm_set_msg_trm(r1,25400,25248);r113=0;STACKTOP=r5;return r113}function _st_cmd_init(r1,r2){_mon_cmd_add(r2,904,13);_mon_cmd_add_bp(r2);r2=r1+4|0;HEAP32[HEAP32[r2>>2]+68>>2]=r1;HEAP32[HEAP32[r2>>2]+72>>2]=0;HEAP32[HEAP32[r2>>2]+76>>2]=0;HEAP32[HEAP32[r2>>2]+80>>2]=94;HEAP32[HEAP32[r2>>2]+84>>2]=0;return}function _st_log_exception(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106;r3=0;r4=0;r5=STACKTOP;r6=r1;r7=r1+4|0;r8=r7;r9=HEAP32[r8>>2];r10=_e68_get_last_pc(r9,0);r11=r10&16777215;r12=r11+1|0;r13=r9+36|0;r14=HEAP32[r13>>2];r15=r12>>>0<r14>>>0;if(r15){r16=r9+32|0;r17=HEAP32[r16>>2];r18=r17+r11|0;r19=HEAP8[r18];r20=r19&255;r21=r20<<8;r22=r17+r12|0;r23=HEAP8[r22];r24=r23&255;r25=r21|r24;r26=r25}else{r27=r9+12|0;r28=HEAP32[r27>>2];r29=r9+4|0;r30=HEAP32[r29>>2];r31=FUNCTION_TABLE[r28](r30,r11);r26=r31}switch(r2|0){case 0:{_st_reset(r6);STACKTOP=r5;return;break};case 2:case 4:case 9:case 10:case 11:case 26:case 28:case 30:case 32:case 33:case 34:case 39:case 40:case 41:case 42:case 43:case 44:case 46:case 47:case 6:case 8:case 66:case 68:case 69:case 70:case 72:case 73:case 74:case 75:case 76:case 77:{STACKTOP=r5;return;break};case 45:{r32=r1+8|0;r33=r32;r34=HEAP32[r33>>2];r35=HEAP32[r8>>2];r36=r35+148|0;r37=HEAP32[r36>>2];r38=_mem_get_uint16_be(r34,r37);r39=HEAP32[r33>>2];r40=HEAP32[r8>>2];r41=r40+148|0;r42=HEAP32[r41>>2];r43=r42+2|0;r44=_mem_get_uint16_be(r39,r43);r45=HEAP32[r33>>2];r46=HEAP32[r8>>2];r47=r46+148|0;r48=HEAP32[r47>>2];r49=r48+4|0;r50=_mem_get_uint16_be(r45,r49);r51=HEAP32[r33>>2];r52=HEAP32[r8>>2];r53=r52+148|0;r54=HEAP32[r53>>2];r55=r54+6|0;r56=_mem_get_uint16_be(r51,r55);r57=HEAP32[r33>>2];r58=HEAP32[r8>>2];r59=r58+148|0;r60=HEAP32[r59>>2];r61=r60+8|0;r62=_mem_get_uint16_be(r57,r61);r63=HEAP32[r33>>2];r64=HEAP32[r8>>2];r65=r64+148|0;r66=HEAP32[r65>>2];r67=r66+10|0;r68=_mem_get_uint16_be(r63,r67);r69=HEAP32[r33>>2];r70=HEAP32[r8>>2];r71=r70+148|0;r72=HEAP32[r71>>2];r73=r72+12|0;r74=_mem_get_uint16_be(r69,r73);r75=HEAP32[r33>>2];r76=HEAP32[r8>>2];r77=r76+148|0;r78=HEAP32[r77>>2];r79=r78+14|0;r80=_mem_get_uint16_be(r75,r79);r81=r38&65535;switch(r81|0){case 3:{r82=r44&65535;r83=r50&65535;_st_log_deb(24992,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r82,HEAP32[r4+8>>2]=r83,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 1:{STACKTOP=r5;return;break};case 9:{r84=r44&65535;_st_log_deb(24568,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r84,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r85=r44&65535;r86=r50&65535;r87=r86<<16;r88=r56&65535;r89=r88|r87;_st_log_deb(24664,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r85,HEAP32[r4+8>>2]=r89,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 4:{r90=r44&65535;r91=r50&65535;r92=r91<<16;r93=r56&65535;r94=r93|r92;r95=r62&65535;r96=r68&65535;r97=r74&65535;_st_log_deb(24840,(r4=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r4>>2]=r90,HEAP32[r4+8>>2]=r94,HEAP32[r4+16>>2]=r95,HEAP32[r4+24>>2]=r96,HEAP32[r4+32>>2]=r97,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 2:{r98=r44&65535;_st_log_deb(25120,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r98,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r99=r44&65535;r100=r50&65535;r101=r56&65535;_st_log_deb(24448,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=r81,HEAP32[r4+8>>2]=r99,HEAP32[r4+16>>2]=r100,HEAP32[r4+24>>2]=r101,r4));STACKTOP=r4;STACKTOP=r5;return}}break};default:{r102=r26&65535;r103=HEAP32[r8>>2];r104=_e68_get_last_pc(r103,0);r105=HEAP32[r8>>2];r106=_e68_get_exception_name(r105);_pce_log(3,25152,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=r104,HEAP32[r4+8>>2]=r2,HEAP32[r4+16>>2]=r106,HEAP32[r4+24>>2]=r102,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _st_dma_init(r1){HEAP16[r1>>1]=0;HEAP16[r1+2>>1]=1;HEAP32[r1+8>>2]=0;HEAP32[r1+16>>2]=0;HEAP32[r1+68>>2]=0;HEAP32[r1+72>>2]=0;HEAP32[r1+76>>2]=0;return 0}function _st_dma_set_memory(r1,r2){HEAP32[r1+68>>2]=r2;return}function _st_dma_set_fdc(r1,r2){HEAP32[r1+72>>2]=r2;return}function _st_dma_set_acsi(r1,r2){HEAP32[r1+76>>2]=r2;return}function _st_dma_set_dreq(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r1+2|0;r4=HEAP16[r3>>1];if(r2<<24>>24==0){HEAP16[r3>>1]=r4&-5;return}HEAP16[r3>>1]=r4|4;r4=HEAP16[r1>>1];r2=r1+4|0;r5=(HEAP8[r2]|0)==0;if((r4&256)==0){if(r5){return}if((r4&128)==0){r6=_st_acsi_get_data(HEAP32[r1+76>>2])}else{r6=_wd179x_get_data(HEAP32[r1+72>>2])}r7=r1+16|0;r8=HEAP32[r7>>2];r9=r1+20+(r8*24&-1)+4|0;r10=HEAP32[r9>>2];HEAP32[r9>>2]=r10+1;HEAP8[r1+20+(r8*24&-1)+8+r10|0]=r6;if(HEAP32[r9>>2]>>>0>15){r9=r1+68|0;r6=r1+8|0;r10=0;r11=HEAP32[r6>>2];while(1){_mem_set_uint8(HEAP32[r9>>2],r11,HEAP8[r1+20+(r8*24&-1)+8+r10|0]);r12=HEAP32[r6>>2]+1|0;HEAP32[r6>>2]=r12;r13=r10+1|0;if(r13>>>0<16){r10=r13;r11=r12}else{break}}r11=HEAP32[r7>>2]&1^1;HEAP32[r7>>2]=r11;HEAP32[r1+20+(r11*24&-1)>>2]=0;HEAP32[r1+20+(r11*24&-1)+4>>2]=0}r11=r1+12|0;r7=HEAP32[r11>>2]+1|0;HEAP32[r11>>2]=r7;if(r7>>>0<=511){return}HEAP32[r11>>2]=0;r11=HEAP8[r2]-1&255;HEAP8[r2]=r11;if(r11<<24>>24!=0){return}HEAP16[r3>>1]=HEAP16[r3>>1]&-3;return}else{if(r5){return}r5=r1+16|0;r11=HEAP32[r5>>2];r7=r1+20+(r11*24&-1)|0;r10=HEAP32[r7>>2];HEAP32[r7>>2]=r10+1;r6=HEAP8[r1+20+(r11*24&-1)+8+r10|0];if((r4&128)==0){_st_acsi_set_data(HEAP32[r1+76>>2],r6)}else{_wd179x_set_data(HEAP32[r1+72>>2],r6)}r6=r1+12|0;r4=HEAP32[r6>>2]+1|0;HEAP32[r6>>2]=r4;do{if(r4>>>0>511){HEAP32[r6>>2]=0;r10=HEAP8[r2]-1&255;HEAP8[r2]=r10;if(r10<<24>>24!=0){break}HEAP16[r3>>1]=HEAP16[r3>>1]&-3;return}}while(0);if(HEAP32[r7>>2]>>>0<=15){return}r7=HEAP32[r5>>2];r3=r1+68|0;r2=r1+8|0;r6=0;r4=HEAP32[r2>>2];while(1){HEAP8[r1+20+(r7*24&-1)+8+r6|0]=_mem_get_uint8(HEAP32[r3>>2],r4);r10=HEAP32[r2>>2]+1|0;HEAP32[r2>>2]=r10;r11=r6+1|0;if(r11>>>0<16){r6=r11;r4=r10}else{break}}HEAP32[r1+20+(r7*24&-1)>>2]=0;HEAP32[r1+20+(r7*24&-1)+4>>2]=16;HEAP32[r5>>2]=HEAP32[r5>>2]&1^1;return}}function _st_dma_get_status(r1){return HEAP16[r1+2>>1]}function _st_dma_set_mode(r1,r2){var r3,r4;r3=r1|0;if(((HEAP16[r3>>1]^r2)&256)==0){HEAP16[r3>>1]=r2;return}HEAP16[r1+2>>1]=1;HEAP8[r1+4|0]=0;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;r4=r1+12|0;HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP32[r4+8>>2]=0;HEAP32[r4+12>>2]=0;HEAP16[r3>>1]=r2;return}function _st_dma_get_disk(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;r4=HEAPU16[r1>>1];do{if((r4&16|0)==0){if((r4&8|0)!=0){r5=_st_acsi_get_result(HEAP32[r1+76>>2])&255;break}r6=r4>>>1&3;if((r6|0)==3){r5=_wd179x_get_data(HEAP32[r1+72>>2])&255;break}else if((r6|0)==0){r5=_wd179x_get_status(HEAP32[r1+72>>2])&255;break}else if((r6|0)==1){r5=_wd179x_get_track(HEAP32[r1+72>>2])&255;break}else if((r6|0)==2){r5=_wd179x_get_sector(HEAP32[r1+72>>2])&255;break}else{r5=0;break}}else{_st_log_deb(34384,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r5=0}}while(0);STACKTOP=r3;return r5}function _st_dma_set_disk(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=HEAP16[r1>>1];r4=r3&65535;if((r4&16|0)!=0){HEAP8[r1+4|0]=r2;if((r2&255)!=0){r5=r1+2|0;HEAP16[r5>>1]=HEAP16[r5>>1]|2}HEAP8[r1+5|0]=1;if((r3&256)==0){return}r3=r1+68|0;r5=r1+8|0;r6=0;r7=HEAP32[r5>>2];while(1){HEAP8[r6+(r1+28)|0]=_mem_get_uint8(HEAP32[r3>>2],r7);r8=HEAP32[r5>>2]+1|0;HEAP32[r5>>2]=r8;r9=r6+1|0;if(r9>>>0<16){r6=r9;r7=r8}else{break}}HEAP32[r1+20>>2]=0;HEAP32[r1+24>>2]=16;r7=0;r6=r8;while(1){HEAP8[r7+(r1+52)|0]=_mem_get_uint8(HEAP32[r3>>2],r6);r8=HEAP32[r5>>2]+1|0;HEAP32[r5>>2]=r8;r9=r7+1|0;if(r9>>>0<16){r7=r9;r6=r8}else{break}}HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=16;return}if((r4&8|0)!=0){_st_acsi_set_cmd(HEAP32[r1+76>>2],r2&255,r4>>>1&1);return}r6=r4>>>1&3;if((r6|0)==3){_wd179x_set_data(HEAP32[r1+72>>2],r2&255);return}else if((r6|0)==1){_wd179x_set_track(HEAP32[r1+72>>2],r2&255);return}else if((r6|0)==0){_wd179x_set_cmd(HEAP32[r1+72>>2],r2&255);return}else if((r6|0)==2){_wd179x_set_sector(HEAP32[r1+72>>2],r2&255);return}else{return}}function _st_dma_get_addr(r1,r2){var r3;if((r2|0)==0){r3=HEAP32[r1+8>>2]>>>16&255}else if((r2|0)==2){r3=HEAP32[r1+8>>2]&255}else if((r2|0)==1){r3=HEAP32[r1+8>>2]>>>8&255}else{r3=0}return r3}function _st_dma_set_addr(r1,r2,r3){var r4;if((r2|0)==2){r4=r1+8|0;HEAP32[r4>>2]=HEAP32[r4>>2]&16776960|r3&255;return}else if((r2|0)==0){r4=r1+8|0;HEAP32[r4>>2]=HEAP32[r4>>2]&65535|(r3&255)<<16;return}else if((r2|0)==1){r2=r1+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]&16711935|(r3&255)<<8;return}else{return}}function _st_dma_reset(r1){HEAP16[r1>>1]=0;HEAP16[r1+2>>1]=1;HEAP8[r1+4|0]=0;HEAP32[r1+8>>2]=0;HEAP32[r1+16>>2]=0;HEAP32[r1+20>>2]=0;HEAP32[r1+24>>2]=0;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;return}function _st_fdc_init(r1){var r2,r3;r2=r1|0;_wd179x_init(r2);r3=r1|0;_wd179x_set_read_track_fct(r2,r3,908);_wd179x_set_write_track_fct(r2,r3,336);_wd179x_set_ready(r2,0,0);_wd179x_set_ready(r2,1,0);HEAP8[r1+65744|0]=0;HEAP32[r1+65748>>2]=0;HEAP16[r1+65756>>1]=-1;HEAP8[r1+65760|0]=0;HEAP32[r1+65768>>2]=0;HEAP8[r1+65776|0]=0;HEAP8[r1+65745|0]=0;HEAP32[r1+65752>>2]=0;HEAP16[r1+65758>>1]=-1;HEAP8[r1+65761|0]=0;HEAP32[r1+65772>>2]=0;HEAP8[r1+65777|0]=0;return}function _st_read_track(r1,r2){var r3,r4,r5;r3=HEAP32[r1+65768+((HEAP32[r2+4>>2]&1)<<2)>>2];if((r3|0)==0){r4=1;return r4}r1=_pri_img_get_track(r3,HEAP32[r2+8>>2],HEAP32[r2+12>>2],1);if((r1|0)==0){r4=1;return r4}do{if((_pri_trk_get_size(r1)|0)==0){if((_pri_trk_set_size(r1,1e5)|0)==0){break}else{r4=1}return r4}}while(0);if((_pri_trk_get_clock(r1)|0)==0){_pri_trk_set_clock(r1,5e5)}r3=r1+4|0;r5=HEAP32[r3>>2]+7|0;if(r5>>>0>262151){r4=1;return r4}_memcpy(r2+36|0,HEAP32[r1+8>>2],r5>>>3)|0;HEAP32[r2+32>>2]=HEAP32[r3>>2];r4=0;return r4}function _st_write_track(r1,r2){var r3,r4,r5;r3=HEAP32[r2+4>>2]&1;r4=HEAP32[r1+65768+(r3<<2)>>2];if((r4|0)==0){r5=1;return r5}HEAP8[r1+(r3|65776)|0]=1;r3=_pri_img_get_track(r4,HEAP32[r2+8>>2],HEAP32[r2+12>>2],1);if((r3|0)==0){r5=1;return r5}if((_pri_trk_set_size(r3,HEAP32[r2+32>>2])|0)!=0){r5=1;return r5}_memcpy(HEAP32[r3+8>>2],r2+36|0,(HEAP32[r3+4>>2]+7|0)>>>3)|0;r5=0;return r5}function _st_fdc_save(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1024|0;r6=r5;if(r2>>>0>1){r7=1;STACKTOP=r5;return r7}r8=r1+65768+(r2<<2)|0;if((HEAP32[r8>>2]|0)==0){r7=1;STACKTOP=r5;return r7}_wd179x_flush(r1|0,r2);r9=r2+(r1+65776)|0;if((HEAP8[r9]|0)==0){r7=0;STACKTOP=r5;return r7}_st_log_deb(27632,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;L10:do{if((HEAP8[r2+(r1+65744)|0]|0)==0){r10=_dsks_get_disk(HEAP32[r1+65740>>2],HEAPU16[r1+65756+(r2<<1)>>1]);do{if((r10|0)!=0){r11=_pri_decode_mfm(HEAP32[r8>>2]);if((r11|0)==0){break}if((_dsk_get_type(r10)|0)==6){r12=HEAP32[r10+64>>2];r13=r12+68|0;_psi_img_del(HEAP32[r13>>2]);HEAP32[r13>>2]=r11;HEAP8[r12+72|0]=1;break L10}r12=r6|0;r13=0;r14=0;L23:while(1){r15=r14;r16=0;while(1){if(r16>>>0>=8){r17=r15;r18=0;break}r19=r16+1|0;r20=_psi_img_get_sector(r11,r13,0,r19,0);if((r20|0)==0){_memset(r12,0,1024)|0}else{r21=HEAP16[r20+10>>1];r22=r21&65535;if((r21&65535)<1024){_memset(r6+r22|0,0,1024-r22|0)|0;r23=r22}else{r23=1024}_memcpy(r12,HEAP32[r20+24>>2],r23)|0}if((_dsk_write_lba(r10,r12,r15,2)|0)==0){r15=r15+2|0;r16=r19}else{r3=31;break L23}}while(1){if(r18>>>0>=8){break}r16=r18+1|0;r15=_psi_img_get_sector(r11,r13,1,r16,0);if((r15|0)==0){_memset(r12,0,1024)|0}else{r19=HEAP16[r15+10>>1];r20=r19&65535;if((r19&65535)<1024){_memset(r6+r20|0,0,1024-r20|0)|0;r24=r20}else{r24=1024}_memcpy(r12,HEAP32[r15+24>>2],r24)|0}if((_dsk_write_lba(r10,r12,r17,2)|0)==0){r17=r17+2|0;r18=r16}else{r3=30;break L23}}r16=r13+1|0;if(r16>>>0<77){r13=r16;r14=r17}else{r3=29;break}}if(r3==29){_psi_img_del(r11);break L10}else if(r3==30){_psi_img_del(r11);break}else if(r3==31){_psi_img_del(r11);break}}}while(0);_st_log_deb(24152,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r7=1;STACKTOP=r5;return r7}else{r10=HEAP32[r1+65748+(r2<<2)>>2];if((r10|0)!=0){if((_pri_img_save(r10,HEAP32[r8>>2],0)|0)==0){break}}_st_log_deb(25728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r7=1;STACKTOP=r5;return r7}}while(0);HEAP8[r9]=0;r7=0;STACKTOP=r5;return r7}function _st_fdc_reset(r1){_wd179x_reset(r1|0);if((HEAP32[r1+65768>>2]|0)==0){_st_fdc_load(r1,0)}else{_st_fdc_save(r1,0)}if((HEAP32[r1+65772>>2]|0)==0){_st_fdc_load(r1,1);return}else{_st_fdc_save(r1,1);return}}function _st_fdc_load(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+24|0;r6=r5;if(r2>>>0>1){r7=1;STACKTOP=r5;return r7}r8=r1|0;_wd179x_flush(r8,r2);_wd179x_set_ready(r8,r2,0);_wd179x_set_wprot(r8,r2,1);HEAP8[r2+(r1+65760)|0]=1;HEAP32[r1+65764>>2]=8e5;r9=r1+65768+(r2<<2)|0;_pri_img_del(HEAP32[r9>>2]);HEAP32[r9>>2]=0;r10=r2+(r1+65744)|0;HEAP8[r10]=0;HEAP8[r2+(r1+65776)|0]=0;r11=HEAP32[r1+65748+(r2<<2)>>2];do{if((r11|0)==0){r3=5}else{r12=_pri_img_load(r11,0);if((r12|0)==0){r3=5;break}HEAP8[r10]=1;_st_log_deb(33688,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r13=r12}}while(0);L7:do{if(r3==5){r10=_dsks_get_disk(HEAP32[r1+65740>>2],HEAPU16[r1+65756+(r2<<1)>>1]);L9:do{if((r10|0)!=0){L11:do{if((_dsk_get_type(r10)|0)==6){r14=0;r15=HEAP32[HEAP32[r10+64>>2]+68>>2];r3=20}else{r11=_psi_img_new();if((r11|0)==0){break L9}r12=_dsk_get_block_cnt(r10)>>>5;if((r12|0)==0){r16=r11;r17=r11;break}else{r18=0;r19=0}L14:while(1){r20=r18;r21=0;while(1){if(r21>>>0>=8){r22=r20;r23=0;break}r24=r21+1|0;r25=_psi_sct_new(r19,0,r24,1024);if((r25|0)==0){r3=13;break L14}_psi_sct_set_encoding(r25,32770);_psi_img_add_sector(r11,r25,r19,0);if((_dsk_read_lba(r10,HEAP32[r25+24>>2],r20,2)|0)==0){r20=r20+2|0;r21=r24}else{r3=15;break L14}}while(1){if(r23>>>0>=8){break}r21=r23+1|0;r20=_psi_sct_new(r19,1,r21,1024);if((r20|0)==0){r3=13;break L14}_psi_sct_set_encoding(r20,32770);_psi_img_add_sector(r11,r20,r19,1);if((_dsk_read_lba(r10,HEAP32[r20+24>>2],r22,2)|0)==0){r22=r22+2|0;r23=r21}else{r3=15;break L14}}r21=r19+1|0;if(r21>>>0<r12>>>0){r18=r22;r19=r21}else{r14=r11;r15=r11;r3=20;break L11}}if(r3==13){_psi_img_del(r11);break L9}else if(r3==15){_psi_img_del(r11);break L9}}}while(0);if(r3==20){if((r15|0)==0){break}else{r16=r15;r17=r14}}_pri_mfm_init(r6,5e5,300);HEAP8[r6+8|0]=0;HEAP8[r6+9|0]=1;HEAP32[r6+12>>2]=96;HEAP32[r6+16>>2]=0;HEAP32[r6+20>>2]=80;r12=_pri_encode_mfm(r16,r6);_psi_img_del(r17);if((r12|0)==0){break}_st_log_deb(34424,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r13=r12;break L7}}while(0);_st_log_deb(30152,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r7=1;STACKTOP=r5;return r7}}while(0);HEAP32[r9>>2]=r13;_wd179x_set_ready(r8,r2,1);r7=0;STACKTOP=r5;return r7}function _st_fdc_set_disks(r1,r2){HEAP32[r1+65740>>2]=r2;return}function _st_fdc_set_disk_id(r1,r2,r3){HEAP16[r1+65756+(r2<<1)>>1]=r3;return}function _st_fdc_set_fname(r1,r2,r3){var r4;if(r2>>>0>1){return}r4=r1+65748+(r2<<2)|0;_free(HEAP32[r4>>2]);HEAP32[r4>>2]=0;HEAP8[r2+(r1+65744)|0]=0;if((r3|0)==0){return}r1=_strlen(r3)+1|0;r2=_malloc(r1);if((r2|0)==0){return}_memcpy(r2,r3,r1)|0;HEAP32[r4>>2]=r2;return}function _st_fdc_clock_media_change(r1,r2){var r3,r4;r3=r1+65764|0;r4=HEAP32[r3>>2];if((r4|0)==0){return}if(r4>>>0>r2>>>0){HEAP32[r3>>2]=r4-r2;return}HEAP32[r3>>2]=0;r3=r1+65760|0;if((HEAP8[r3]|0)!=0){_wd179x_set_wprot(r1|0,0,0);HEAP8[r3]=0}r3=r1+65761|0;if((HEAP8[r3]|0)==0){return}_wd179x_set_wprot(r1|0,1,0);HEAP8[r3]=0;return}function _st_kbd_init(r1){var r2;HEAP8[r1|0]=1;HEAP32[r1+4>>2]=0;HEAP8[r1+24|0]=0;HEAP8[r1+25|0]=0;HEAP8[r1+28|0]=1;HEAP32[r1+88>>2]=0;HEAP32[r1+92>>2]=0;r2=r1+32|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP8[r2+24|0]=0;return}function _st_kbd_buf_get(r1,r2){var r3,r4,r5;r3=r1+92|0;r4=HEAP32[r3>>2];if((HEAP32[r1+88>>2]|0)==(r4|0)){r5=1;return r5}HEAP8[r2]=HEAP8[r4+(r1+96)|0];r1=HEAP32[r3>>2]+1|0;HEAP32[r3>>2]=r1>>>0>63?0:r1;r5=0;return r5}function _st_kbd_set_mouse(r1,r2,r3,r4){var r5,r6,r7;if((HEAP8[r1+26|0]|0)==0){r5=r1+32|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r2;r5=r1+36|0;HEAP32[r5>>2]=((HEAP8[r1+27|0]|0)!=0?r3:-r3|0)+HEAP32[r5>>2];HEAP32[r1+44>>2]=r4;_st_kbd_check_mouse(r1);return}if((r2|0)<0){r5=-r2|0;r6=r1+60|0;r7=HEAP32[r6>>2];HEAP32[r6>>2]=r7-(r7>>>0<r5>>>0?r7:r5)}else{r5=r1+60|0;r7=HEAP32[r5>>2];r6=HEAP32[r1+72>>2]-r7|0;HEAP32[r5>>2]=(r6>>>0<r2>>>0?r6:r2)+r7}if((r3|0)<0){r7=-r3|0;r2=r1+64|0;r6=HEAP32[r2>>2];HEAP32[r2>>2]=r6-(r6>>>0<r7>>>0?r6:r7)}else{r7=r1+64|0;r6=HEAP32[r7>>2];r2=HEAP32[r1+76>>2]-r6|0;HEAP32[r7>>2]=(r2>>>0<r3>>>0?r2:r3)+r6}r6=r1+44|0;r3=HEAP32[r6>>2]^r4;do{if((r3&1|0)!=0){r2=r1+68|0;r7=HEAP32[r2>>2];if((r4&1|0)==0){HEAP32[r2>>2]=r7|8;break}else{HEAP32[r2>>2]=r7|4;break}}}while(0);do{if((r3&2|0)!=0){r7=r1+68|0;r2=HEAP32[r7>>2];if((r4&2|0)==0){HEAP32[r7>>2]=r2|2;break}else{HEAP32[r7>>2]=r2|1;break}}}while(0);HEAP32[r6>>2]=r4;return}function _st_kbd_check_mouse(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=STACKTOP;if((HEAP8[r1+25|0]|0)!=0){STACKTOP=r3;return}if((HEAP8[r1+26|0]|0)!=0){STACKTOP=r3;return}r4=r1+32|0;do{if((HEAP32[r4>>2]|0)==0){if((HEAP32[r1+36>>2]|0)!=0){break}if((HEAP32[r1+40>>2]|0)!=(HEAP32[r1+44>>2]|0)){break}STACKTOP=r3;return}}while(0);r5=HEAP32[r1+44>>2];HEAP32[r1+40>>2]=r5;r6=r1+88|0;r7=HEAP32[r6>>2];r8=r7+1|0;r9=r8>>>0>63?0:r8;r8=r1+92|0;if((r9|0)==(HEAP32[r8>>2]|0)){_st_log_deb(32712,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2}else{HEAP8[r7+(r1+96)|0]=((r5&1|0)==0?-8:-6)|r5>>>1&1;HEAP32[r6>>2]=r9}r9=HEAP32[r4>>2];if((r9|0)<0){r5=(r9|0)<-128?-128:r9;r10=r5&255;r11=r5}else{r5=(r9|0)>127?127:r9;r10=r5&255;r11=r5}HEAP32[r4>>2]=r9-r11;r11=HEAP32[r6>>2];r9=r11+1|0;r4=r9>>>0>63?0:r9;if((r4|0)==(HEAP32[r8>>2]|0)){_st_log_deb(32712,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2}else{HEAP8[r11+(r1+96)|0]=r10;HEAP32[r6>>2]=r4}r4=r1+36|0;r10=HEAP32[r4>>2];if((r10|0)<0){r11=(r10|0)<-128?-128:r10;r12=r11&255;r13=r11}else{r11=(r10|0)>127?127:r10;r12=r11&255;r13=r11}HEAP32[r4>>2]=r10-r13;r13=HEAP32[r6>>2];r10=r13+1|0;r4=r10>>>0>63?0:r10;if((r4|0)==(HEAP32[r8>>2]|0)){_st_log_deb(32712,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;STACKTOP=r3;return}else{HEAP8[r13+(r1+96)|0]=r12;HEAP32[r6>>2]=r4;STACKTOP=r3;return}}function _st_kbd_set_key(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=0;r5=0;r6=STACKTOP;if((r2|0)==3){if((r3|0)==91){r7=r1+56|0;r8=HEAP8[r7]+1&255;r9=(r8&255)>2?0:r8;HEAP8[r7]=r9;_st_log_deb(34288,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r9&255,r5));STACKTOP=r5;STACKTOP=r6;return}else{_pce_log(2,30040,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r3,r5));STACKTOP=r5;STACKTOP=r6;return}}r9=HEAP8[r1+56|0];do{if((r9&255)<2){r7=r9&255;if((r2-1|0)>>>0>1){r10=3632;break}else{r11=5536}while(1){r8=HEAP32[r11>>2];r12=(r8|0)==0;if(r12|(r8|0)==(r3|0)){break}else{r11=r11+8|0}}if(r12){r10=3632;break}if((HEAP8[r1+28|0]|0)==0){STACKTOP=r6;return}r8=r1+48+((r7&1)<<2)|0;r13=HEAP32[r8>>2];r14=HEAPU8[r11+4|0];if((r2|0)==1){r15=(r14|r13)&255}else{r15=(r14^255)&r13&255}r14=r15&255;if((r13|0)==(r14|0)){STACKTOP=r6;return}HEAP32[r8>>2]=r14;r14=r1+88|0;r8=HEAP32[r14>>2];r13=r8+1|0;r16=r13>>>0>63?0:r13;r13=r1+92|0;if((r16|0)==(HEAP32[r13>>2]|0)){_st_log_deb(32712,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;r17=HEAP32[r14>>2]}else{HEAP8[r8+(r1+96)|0]=r9|-2;HEAP32[r14>>2]=r16;r17=r16}r16=r17+1|0;r8=r16>>>0>63?0:r16;if((r8|0)==(HEAP32[r13>>2]|0)){_st_log_deb(32712,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else{HEAP8[r17+(r1+96)|0]=r15;HEAP32[r14>>2]=r8;STACKTOP=r6;return}}else{r10=3632}}while(0);while(1){r15=HEAP32[r10>>2];r18=(r15|0)==0;if(r18|(r15|0)==(r3|0)){break}else{r10=r10+20|0}}if(r18){if((r2|0)!=1){STACKTOP=r6;return}_pce_log(2,27536,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r3,r5));STACKTOP=r5;STACKTOP=r6;return}if((r2|0)==2){r3=r10+16|0;if((HEAP8[r3]|0)==0){STACKTOP=r6;return}HEAP8[r3]=0;r3=HEAP16[r10+10>>1];r18=r3&65535;if(r3<<16>>16==0){STACKTOP=r6;return}r3=r1+88|0;r15=r1+92|0;r17=0;r9=HEAP32[r3>>2];while(1){r11=r9+1|0;r12=r11>>>0>63?0:r11;if((r12|0)==(HEAP32[r15>>2]|0)){break}HEAP8[r9+(r1+96)|0]=HEAP8[r17+(r10+12)|0];HEAP32[r3>>2]=r12;r11=r17+1|0;if(r11>>>0<r18>>>0){r17=r11;r9=r12}else{r4=36;break}}if(r4==36){STACKTOP=r6;return}_st_log_deb(32712,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else if((r2|0)==1){HEAP8[r10+16|0]=1;r2=HEAP16[r10+4>>1];r9=r2&65535;if(r2<<16>>16==0){STACKTOP=r6;return}r2=r1+88|0;r17=r1+92|0;r18=0;r3=HEAP32[r2>>2];while(1){r15=r3+1|0;r12=r15>>>0>63?0:r15;if((r12|0)==(HEAP32[r17>>2]|0)){break}HEAP8[r3+(r1+96)|0]=HEAP8[r18+(r10+6)|0];HEAP32[r2>>2]=r12;r15=r18+1|0;if(r15>>>0<r9>>>0){r18=r15;r3=r12}else{r4=36;break}}if(r4==36){STACKTOP=r6;return}_st_log_deb(32712,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else{STACKTOP=r6;return}}function _st_kbd_set_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r1+4|0;r8=HEAP32[r7>>2];r9=r8>>>0>15;if(r9){HEAP32[r7>>2]=0;STACKTOP=r5;return}r10=r8+1|0;HEAP32[r7>>2]=r10;r11=r8+(r1+8)|0;HEAP8[r11]=r2;r12=r1+8|0;r13=HEAP8[r12];r14=r13&255;L5:do{switch(r14|0){case 22:{r15=r1+88|0;r16=HEAP32[r15>>2];r17=r16+1|0;r18=r17>>>0>63;r19=r18?0:r17;r20=r1+92|0;r21=HEAP32[r20>>2];r22=(r19|0)==(r21|0);if(r22){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r23=HEAP32[r15>>2];r24=r23}else{r25=r16+(r1+96)|0;HEAP8[r25]=-3;HEAP32[r15>>2]=r19;r24=r19}r26=r24+1|0;r27=r26>>>0>63;r28=r27?0:r26;r29=HEAP32[r20>>2];r30=(r28|0)==(r29|0);if(r30){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r31=HEAP32[r15>>2];r32=r31}else{r33=r1+48|0;r34=HEAP32[r33>>2];r35=r34&255;r36=r24+(r1+96)|0;HEAP8[r36]=r35;HEAP32[r15>>2]=r28;r32=r28}r37=r32+1|0;r38=r37>>>0>63;r39=r38?0:r37;r40=HEAP32[r20>>2];r41=(r39|0)==(r40|0);if(r41){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r3=81;break L5}else{r42=r1+52|0;r43=HEAP32[r42>>2];r44=r43&255;r45=r32+(r1+96)|0;HEAP8[r45]=r44;HEAP32[r15>>2]=r39;r3=81;break L5}break};case 7:{r46=HEAP32[r7>>2];r47=r46>>>0<2;if(r47){r48=r46;r3=82;break L5}HEAP32[r7>>2]=0;break};case 26:{HEAP32[r7>>2]=0;break};case 27:{r49=HEAP32[r7>>2];r50=r49>>>0<7;if(r50){r48=r49;r3=82;break L5}HEAP32[r7>>2]=0;break};case 28:{r51=r6;r52=_time(0);HEAP32[r6>>2]=r52;r53=_localtime(r6);r54=r1+88|0;r55=HEAP32[r54>>2];r56=r55+1|0;r57=r56>>>0>63;r58=r57?0:r56;r59=r1+92|0;r60=HEAP32[r59>>2];r61=(r58|0)==(r60|0);if(r61){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r62=HEAP32[r54>>2];r63=r62}else{r64=r55+(r1+96)|0;HEAP8[r64]=-4;HEAP32[r54>>2]=r58;r63=r58}r65=r53+20|0;r66=HEAP32[r65>>2];r67=r63+1|0;r68=r67>>>0>63;r69=r68?0:r67;r70=HEAP32[r59>>2];r71=(r69|0)==(r70|0);if(r71){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r72=HEAP32[r54>>2];r73=r72}else{r74=(r66>>>0)/10&-1;r75=r74<<4;r76=(r66>>>0)%10&-1;r77=r75|r76;r78=r77&255;r79=r63+(r1+96)|0;HEAP8[r79]=r78;HEAP32[r54>>2]=r69;r73=r69}r80=r53+16|0;r81=HEAP32[r80>>2];r82=r81+1|0;r83=r73+1|0;r84=r83>>>0>63;r85=r84?0:r83;r86=HEAP32[r59>>2];r87=(r85|0)==(r86|0);if(r87){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r88=HEAP32[r54>>2];r89=r88}else{r90=(r82>>>0)/10&-1;r91=r90<<4;r92=(r82>>>0)%10&-1;r93=r91|r92;r94=r93&255;r95=r73+(r1+96)|0;HEAP8[r95]=r94;HEAP32[r54>>2]=r85;r89=r85}r96=r53+12|0;r97=HEAP32[r96>>2];r98=r89+1|0;r99=r98>>>0>63;r100=r99?0:r98;r101=HEAP32[r59>>2];r102=(r100|0)==(r101|0);if(r102){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r103=HEAP32[r54>>2];r104=r103}else{r105=(r97>>>0)/10&-1;r106=r105<<4;r107=(r97>>>0)%10&-1;r108=r106|r107;r109=r108&255;r110=r89+(r1+96)|0;HEAP8[r110]=r109;HEAP32[r54>>2]=r100;r104=r100}r111=r53+8|0;r112=HEAP32[r111>>2];r113=r104+1|0;r114=r113>>>0>63;r115=r114?0:r113;r116=HEAP32[r59>>2];r117=(r115|0)==(r116|0);if(r117){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r118=HEAP32[r54>>2];r119=r118}else{r120=(r112>>>0)/10&-1;r121=r120<<4;r122=(r112>>>0)%10&-1;r123=r121|r122;r124=r123&255;r125=r104+(r1+96)|0;HEAP8[r125]=r124;HEAP32[r54>>2]=r115;r119=r115}r126=r53+4|0;r127=HEAP32[r126>>2];r128=r119+1|0;r129=r128>>>0>63;r130=r129?0:r128;r131=HEAP32[r59>>2];r132=(r130|0)==(r131|0);if(r132){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r133=HEAP32[r54>>2];r134=r133}else{r135=(r127>>>0)/10&-1;r136=r135<<4;r137=(r127>>>0)%10&-1;r138=r136|r137;r139=r138&255;r140=r119+(r1+96)|0;HEAP8[r140]=r139;HEAP32[r54>>2]=r130;r134=r130}r141=r53|0;r142=HEAP32[r141>>2];r143=r134+1|0;r144=r143>>>0>63;r145=r144?0:r143;r146=HEAP32[r59>>2];r147=(r145|0)==(r146|0);if(r147){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}else{r148=(r142>>>0)/10&-1;r149=r148<<4;r150=(r142>>>0)%10&-1;r151=r149|r150;r152=r151&255;r153=r134+(r1+96)|0;HEAP8[r153]=r152;HEAP32[r54>>2]=r145}HEAP32[r7>>2]=0;r3=81;break};case 8:{r154=r1+26|0;HEAP8[r154]=0;r155=r1+25|0;HEAP8[r155]=0;HEAP32[r7>>2]=0;break};case 9:{r156=HEAP32[r7>>2];r157=r156>>>0<5;if(r157){r48=r156;r3=82;break L5}r158=r1+9|0;r159=HEAP8[r158];r160=r159&255;r161=r160<<8;r162=r1+10|0;r163=HEAP8[r162];r164=r163&255;r165=r161|r164;r166=r1+72|0;HEAP32[r166>>2]=r165;r167=r1+11|0;r168=HEAP8[r167];r169=r168&255;r170=r169<<8;r171=r1+12|0;r172=HEAP8[r171];r173=r172&255;r174=r170|r173;r175=r1+76|0;HEAP32[r175>>2]=r174;r176=r1+26|0;HEAP8[r176]=1;r177=r1+25|0;HEAP8[r177]=0;r178=r1+60|0;HEAP32[r178>>2]=0;r179=r1+64|0;HEAP32[r179>>2]=0;r180=r1+68|0;HEAP32[r180>>2]=0;HEAP32[r7>>2]=0;break};case 19:{r181=r1+24|0;HEAP8[r181]=1;HEAP32[r7>>2]=0;break};case 17:{r182=r1+24|0;HEAP8[r182]=0;HEAP32[r7>>2]=0;break};case 18:{r183=r1+25|0;HEAP8[r183]=1;r184=r1+32|0;HEAP32[r184>>2]=0;r185=r1+36|0;HEAP32[r185>>2]=0;HEAP32[r7>>2]=0;break};case 11:{r186=HEAP32[r7>>2];r187=r186>>>0<3;if(r187){r48=r186;r3=82;break L5}HEAP32[r7>>2]=0;break};case 15:{r188=r1+27|0;HEAP8[r188]=0;HEAP32[r7>>2]=0;break};case 16:{r189=r1+27|0;HEAP8[r189]=1;HEAP32[r7>>2]=0;break};case 13:{r190=r1+26|0;r191=HEAP8[r190];r192=r191<<24>>24==0;if(r192){HEAP32[r7>>2]=0;break L5}r193=r1+88|0;r194=HEAP32[r193>>2];r195=r194+1|0;r196=r195>>>0>63;r197=r196?0:r195;r198=r1+92|0;r199=HEAP32[r198>>2];r200=(r197|0)==(r199|0);if(r200){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r201=HEAP32[r193>>2];r202=r201}else{r203=r194+(r1+96)|0;HEAP8[r203]=-9;HEAP32[r193>>2]=r197;r202=r197}r204=r1+68|0;r205=r202+1|0;r206=r205>>>0>63;r207=r206?0:r205;r208=HEAP32[r198>>2];r209=(r207|0)==(r208|0);if(r209){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r210=HEAP32[r193>>2];r211=r210}else{r212=HEAP32[r204>>2];r213=r212&255;r214=r202+(r1+96)|0;HEAP8[r214]=r213;HEAP32[r193>>2]=r207;r211=r207}r215=r1+60|0;r216=r211+1|0;r217=r216>>>0>63;r218=r217?0:r216;r219=HEAP32[r198>>2];r220=(r218|0)==(r219|0);if(r220){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r221=HEAP32[r193>>2];r222=r221}else{r223=HEAP32[r215>>2];r224=r223>>>8;r225=r224&255;r226=r211+(r1+96)|0;HEAP8[r226]=r225;HEAP32[r193>>2]=r218;r222=r218}r227=r222+1|0;r228=r227>>>0>63;r229=r228?0:r227;r230=HEAP32[r198>>2];r231=(r229|0)==(r230|0);if(r231){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r232=HEAP32[r193>>2];r233=r232}else{r234=HEAP32[r215>>2];r235=r234&255;r236=r222+(r1+96)|0;HEAP8[r236]=r235;HEAP32[r193>>2]=r229;r233=r229}r237=r1+64|0;r238=r233+1|0;r239=r238>>>0>63;r240=r239?0:r238;r241=HEAP32[r198>>2];r242=(r240|0)==(r241|0);if(r242){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r243=HEAP32[r193>>2];r244=r243}else{r245=HEAP32[r237>>2];r246=r245>>>8;r247=r246&255;r248=r233+(r1+96)|0;HEAP8[r248]=r247;HEAP32[r193>>2]=r240;r244=r240}r249=r244+1|0;r250=r249>>>0>63;r251=r250?0:r249;r252=HEAP32[r198>>2];r253=(r251|0)==(r252|0);if(r253){_st_log_deb(32712,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4}else{r254=HEAP32[r237>>2];r255=r254&255;r256=r244+(r1+96)|0;HEAP8[r256]=r255;HEAP32[r193>>2]=r251}HEAP32[r204>>2]=0;HEAP32[r7>>2]=0;break};case 14:{r257=HEAP32[r7>>2];r258=r257>>>0<6;if(r258){r48=r257;r3=82;break L5}r259=r1+10|0;r260=HEAP8[r259];r261=r260&255;r262=r261<<8;r263=r1+11|0;r264=HEAP8[r263];r265=r264&255;r266=r262|r265;r267=r1+12|0;r268=HEAP8[r267];r269=r268&255;r270=r269<<8;r271=r1+13|0;r272=HEAP8[r271];r273=r272&255;r274=r270|r273;r275=r1+72|0;r276=HEAP32[r275>>2];r277=r266>>>0>r276>>>0;r278=r277?r276:r266;r279=r1+60|0;HEAP32[r279>>2]=r278;r280=r1+76|0;r281=HEAP32[r280>>2];r282=r274>>>0>r281>>>0;r283=r282?r281:r274;r284=r1+64|0;HEAP32[r284>>2]=r283;HEAP32[r7>>2]=0;break};case 12:{r285=HEAP32[r7>>2];r286=r285>>>0<3;if(r286){r48=r285;r3=82;break L5}r287=r1+9|0;r288=HEAP8[r287];r289=r288&255;r290=r1+80|0;HEAP32[r290>>2]=r289;r291=r1+10|0;r292=HEAP8[r291];r293=r292&255;r294=r1+84|0;HEAP32[r294>>2]=r293;HEAP32[r7>>2]=0;break};case 128:{r295=HEAP32[r7>>2];r296=r295>>>0<2;if(r296){r48=r295;r3=82;break L5}r297=r1+9|0;r298=HEAP8[r297];r299=r298<<24>>24==1;if(r299){r300=r1+24|0;HEAP8[r300]=0;r301=r1+25|0;HEAP8[r301]=0;r302=r1+26|0;HEAP8[r302]=0;r303=r1+27|0;HEAP8[r303]=1;r304=r1+28|0;HEAP8[r304]=1;r305=r1+32|0;HEAP32[r305>>2]=0;r306=r1+36|0;HEAP32[r306>>2]=0;r307=r1+88|0;r308=r1+92|0;HEAP32[r308>>2]=0;r309=r1+96|0;HEAP8[r309]=-16;HEAP32[r307>>2]=1}HEAP32[r7>>2]=0;break};default:{r310=HEAP32[r7>>2];r311=(r310|0)==1;if(!r311){r48=r310;r3=82;break L5}r312=r2&255;_st_log_deb(25608,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r312,r4));STACKTOP=r4;HEAP32[r7>>2]=0}}}while(0);if(r3==81){r313=HEAP32[r7>>2];r48=r313;r3=82}do{if(r3==82){r314=(r48|0)==0;if(r314){break}STACKTOP=r5;return}}while(0);r315=HEAP8[r12];r316=r315<<24>>24==19;if(r316){STACKTOP=r5;return}r317=r1+24|0;HEAP8[r317]=0;STACKTOP=r5;return}function _st_kbd_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8;if((HEAP8[r1+24|0]|0)!=0){HEAP8[r1|0]=1;r3=1;return r3}r4=r1+88|0;r5=r1+92|0;r6=HEAP32[r5>>2];do{if((HEAP32[r4>>2]|0)==(r6|0)){_st_kbd_check_mouse(r1);r7=HEAP32[r5>>2];if((HEAP32[r4>>2]|0)!=(r7|0)){HEAP8[r2]=HEAP8[r7+(r1+96)|0];r7=HEAP32[r5>>2]+1|0;r8=r7>>>0>63?0:r7;break}HEAP8[r1|0]=1;r3=1;return r3}else{HEAP8[r2]=HEAP8[r6+(r1+96)|0];r7=HEAP32[r5>>2]+1|0;r8=r7>>>0>63?0:r7}}while(0);HEAP32[r5>>2]=r8;HEAP8[r1|0]=0;r3=0;return r3}function _st_kbd_reset(r1){var r2;HEAP8[r1|0]=1;HEAP32[r1+4>>2]=0;HEAP8[r1+24|0]=0;HEAP8[r1+25|0]=0;HEAP8[r1+26|0]=0;HEAP8[r1+27|0]=1;HEAP8[r1+28|0]=1;HEAP32[r1+60>>2]=0;HEAP32[r1+64>>2]=0;r2=r1+32|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r1+72>>2]=255;HEAP32[r1+76>>2]=255;HEAP32[r1+80>>2]=1;HEAP32[r1+84>>2]=1;HEAP32[r1+68>>2]=0;HEAP32[r1+88>>2]=0;HEAP32[r1+92>>2]=0;return}function _st_log_deb(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=HEAP32[39968>>2];if((r6|0)==0){r7=0}else{r7=_e68_get_last_pc(HEAP32[r6+4>>2],0)&16777215}_pce_log(3,29968,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r7,r3));STACKTOP=r3;r3=r5;HEAP32[r3>>2]=r2;HEAP32[r3+4>>2]=0;_pce_log_va(3,r1,r5|0);STACKTOP=r4;return}function _main(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;_pce_log_init();r7=HEAP32[_stderr>>2];r8=_pce_log_add_fp(r7,0,2);r9=_ini_sct_new(0);HEAP32[40280>>2]=r9;r10=(r9|0)==0;if(r10){r11=1;STACKTOP=r5;return r11}_ini_str_init(40256);r12=_pce_getopt(r1,r2,r6,1064);r13=(r12|0)==-1;L4:do{if(!r13){r14=r12;L5:while(1){r15=(r14|0)<0;if(r15){r11=1;r3=23;break}switch(r14|0){case 86:{r3=6;break L5;break};case 100:{r16=HEAP32[r6>>2];r17=HEAP32[r16>>2];r18=_pce_path_set(r17);break};case 63:{r3=5;break L5;break};case 73:{r19=HEAP32[r6>>2];r20=HEAP32[r19>>2];r21=_ini_str_add(40256,r20,25576,0);break};case 105:{r22=HEAP32[40280>>2];r23=HEAP32[r6>>2];r24=HEAP32[r23>>2];r25=_ini_read_str(r22,r24);r26=(r25|0)==0;if(!r26){r3=9;break L5}break};case 108:{r27=HEAP32[r6>>2];r28=HEAP32[r27>>2];r29=_pce_log_add_fname(r28,3);break};case 112:{r30=HEAP32[r6>>2];r31=HEAP32[r30>>2];r32=_ini_str_add(40256,24064,r31,23e3);break};case 113:{_pce_log_set_level(r7,0);break};case 115:{r33=HEAP32[r6>>2];r34=HEAP32[r33>>2];r35=_ini_str_add(40256,21728,r34,25576);break};case 116:{r36=HEAP32[r6>>2];r37=HEAP32[r36>>2];HEAP32[39960>>2]=r37;break};case 118:{_pce_log_set_level(r7,3);break};case 99:case 114:case 82:{break};case 0:{r3=18;break L5;break};default:{r11=1;r3=23;break L5}}r38=_pce_getopt(r1,r2,r6,1064);r39=(r38|0)==-1;if(r39){break L4}else{r14=r38}}if(r3==5){_pce_getopt_help(30680,30272,1064);r40=HEAP32[_stdout>>2];r41=_fflush(r40);r11=0;STACKTOP=r5;return r11}else if(r3==6){r42=HEAP32[_stdout>>2];r43=_fwrite(30976,93,1,r42);r44=_fflush(r42);r11=0;STACKTOP=r5;return r11}else if(r3==9){r45=HEAP32[r2>>2];r46=HEAP32[r6>>2];r47=HEAP32[r46>>2];r48=_fprintf(r7,27464,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r45,HEAP32[r4+8>>2]=r47,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}else if(r3==18){r49=HEAP32[r2>>2];r50=HEAP32[r6>>2];r51=HEAP32[r50>>2];r52=_fprintf(r7,20760,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r49,HEAP32[r4+8>>2]=r51,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}else if(r3==23){STACKTOP=r5;return r11}}}while(0);_pce_log_set_level(r7,3);_pce_log(2,31472,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;_pce_log_tag(2,32520,32176,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=19520,r4));STACKTOP=r4;r53=HEAP32[40280>>2];r54=_ini_read(r53,19520);r55=(r54|0)==0;if(!r55){_pce_log(0,31800,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}r56=HEAP32[40280>>2];r57=_ini_next_sct(r56,0,35520);r58=(r57|0)==0;r59=HEAP32[40280>>2];r60=r58?r59:r57;r61=_ini_str_eval(40256,r60,1);r62=(r61|0)==0;if(r62){r63=_atexit(6);r64=_SDL_Init(0);r65=_pce_path_ini(r60);r66=_signal(2,532);r67=_signal(11,24);r68=_signal(15,870);r69=HEAP32[_stdin>>2];r70=HEAP32[_stdout>>2];_pce_console_init(r69,r70);r71=_st_new(r60);HEAP32[39968>>2]=r71;_mon_init(39992);r72=HEAP32[39968>>2];r73=r72;_mon_set_cmd_fct(39992,756,r73);r74=HEAP32[39968>>2];r75=r74;_mon_set_msg_fct(39992,672,r75);r76=HEAP32[39968>>2];r77=r76+8|0;r78=HEAP32[r77>>2];r79=r78;_mon_set_get_mem_fct(39992,r79,818);r80=HEAP32[39968>>2];r81=r80+8|0;r82=HEAP32[r81>>2];r83=r82;_mon_set_set_mem_fct(39992,r83,596);_mon_set_memory_mode(39992,0);r84=HEAP32[39968>>2];r85=r84;_cmd_init(r85,892,700);r86=HEAP32[39968>>2];_st_cmd_init(r86,39992);r87=HEAP32[39968>>2];_st_reset(r87);r88=HEAP32[39968>>2];_st_run_emscripten(r88);_exit(1)}else{r11=1;STACKTOP=r5;return r11}}function _st_atexit(){_pce_set_fd_interactive(0,1);return}function _sig_int(r1){r1=HEAP32[_stderr>>2];_fwrite(32880,20,1,r1);_fflush(r1);r1=HEAP32[39968>>2]+201720|0;HEAP32[r1>>2]=(HEAP32[r1>>2]|0)==0?1:2;return}function _sig_segv(r1){r1=HEAP32[_stderr>>2];_fwrite(33352,32,1,r1);_fflush(r1);r1=HEAP32[39968>>2];do{if((r1|0)!=0){if((HEAP32[r1+4>>2]|0)==0){break}_st_print_state_cpu(r1)}}while(0);_pce_set_fd_interactive(0,1);_exit(1)}function _sig_term(r1){r1=HEAP32[_stderr>>2];_fwrite(33888,21,1,r1);_fflush(r1);HEAP32[HEAP32[39968>>2]+201720>>2]=2;return}function _cmd_get_sym1224(r1,r2,r3){return(_e68_get_reg(HEAP32[r1+4>>2],r2,r3)|0)!=0|0}function _cmd_set_sym1226(r1,r2,r3){return(_e68_set_reg(HEAP32[r1+4>>2],r2,r3)|0)!=0|0}function _st_mem_get_uint8(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;do{if(r2>>>0<15728640){r5=0}else{r6=r2-16776224|0;if(r6>>>0<32){r5=_rp5c15_get_uint8(r1+4604|0,r6>>>1);break}if((r2|0)==16745995){r5=_st_dma_get_addr(r1+201604|0,1);break}else if((r2|0)==16745993){r5=_st_dma_get_addr(r1+201604|0,0);break}else if((r2|0)==15728641|(r2|0)==15728657|(r2|0)==15728669|(r2|0)==15728697|(r2|0)==16745090|(r2|0)==16745472|(r2|0)==16746753|(r2|0)==16746849|(r2|0)==16746851|(r2|0)==16747068|(r2|0)==16747648|(r2|0)==16748041|(r2|0)==16775809){_e68_set_bus_error(HEAP32[r1+4>>2],1);r5=0;break}else if((r2|0)==16745997){r5=_st_dma_get_addr(r1+201604|0,2);break}else if((r2|0)==16746369){_e68_set_bus_error(HEAP32[r1+4>>2],1);r5=0;break}else if((r2|0)==16746496){r5=_st_psg_get_data(r1+4640|0);break}else if((r2|0)==16746498){r5=_st_psg_get_select(r1+4640|0);break}else if((r2|0)==16776192){r5=_e6850_get_uint8(r1+204|0,0);break}else if((r2|0)==16776194){r5=_e6850_get_uint8(r1+204|0,1);break}else if((r2|0)==16776196){r5=_e6850_get_uint8(r1+252|0,0);break}else if((r2|0)==16776198){r5=_e6850_get_uint8(r1+252|0,1);break}else if((r2|0)==16745999){r5=0;break}else{_st_log_deb(29752,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;r5=0;break}}}while(0);STACKTOP=r4;return r5}function _st_mem_get_uint16(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;do{if(r2>>>0<15728640){r5=0}else{if((r2|0)==16745988){r5=_st_dma_get_disk(r1+201604|0);break}else if((r2|0)==16384e3|(r2|0)==16384002){r5=0;break}else if((r2|0)==16745990){r5=_st_dma_get_status(r1+201604|0);break}else if((r2|0)==16744454){_e68_set_bus_error(HEAP32[r1+4>>2],1);r5=0;break}else if((r2|0)==16746752|(r2|0)==16747008|(r2|0)==16747648|(r2|0)==16775744){_e68_set_bus_error(HEAP32[r1+4>>2],1);r5=0;break}else{_st_log_deb(33816,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;r5=0;break}}}while(0);STACKTOP=r4;return r5}function _st_mem_get_uint32(r1,r2){var r3;r3=r1+8|0;r1=(_mem_get_uint16_be(HEAP32[r3>>2],r2)&65535)<<16;return _mem_get_uint16_be(HEAP32[r3>>2],r2+2|0)&65535|r1}function _st_mem_set_uint8(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;do{if(r2>>>0>=15728640){r6=r2-16776224|0;if(r6>>>0<32){_rp5c15_set_uint8(r1+4604|0,r6>>>1,r3);break}if((r2|0)==16745995){_st_dma_set_addr(r1+201604|0,1,r3);break}else if((r2|0)==16745993){_st_dma_set_addr(r1+201604|0,0,r3);break}else if((r2|0)==16746849|(r2|0)==16747068|(r2|0)==16748045){_e68_set_bus_error(HEAP32[r1+4>>2],1);break}else if((r2|0)==16745997){_st_dma_set_addr(r1+201604|0,2,r3);break}else if((r2|0)==16746496){_st_psg_set_select(r1+4640|0,r3);break}else if((r2|0)==16746498){_st_psg_set_data(r1+4640|0,r3);break}else if((r2|0)==16776192){_e6850_set_uint8(r1+204|0,0,r3);break}else if((r2|0)==16776194){_e6850_set_uint8(r1+204|0,1,r3);break}else if((r2|0)==16776196){_e6850_set_uint8(r1+252|0,0,r3);break}else if((r2|0)==16776198){_e6850_set_uint8(r1+252|0,1,r3);break}else if((r2|0)==16744449|(r2|0)==16745999|(r2|0)==16746500|(r2|0)==16746502){break}else{_st_log_deb(29720,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&255,r4));STACKTOP=r4;break}}}while(0);STACKTOP=r5;return}function _st_mem_set_uint16(r1,r2,r3){var r4,r5;r4=0;r5=STACKTOP;if(r2>>>0<15728640){STACKTOP=r5;return}if((r2|0)==16746752|(r2|0)==16745472|(r2|0)==16775612){_e68_set_bus_error(HEAP32[r1+4>>2],1);STACKTOP=r5;return}else if((r2|0)==16745988){_st_dma_set_disk(r1+201604|0,r3);STACKTOP=r5;return}else if((r2|0)==16745990){_st_dma_set_mode(r1+201604|0,r3);STACKTOP=r5;return}else if((r2|0)==16746498){_st_psg_set_data(r1+4640|0,(r3&65535)>>>8&255);STACKTOP=r5;return}else if((r2|0)==16746496){_st_psg_set_select(r1+4640|0,(r3&65535)>>>8&255);STACKTOP=r5;return}else{_st_log_deb(27288,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&65535,r4));STACKTOP=r4;STACKTOP=r5;return}}function _st_mem_set_uint32(r1,r2,r3){var r4;r4=r1+8|0;_mem_set_uint16_be(HEAP32[r4>>2],r2,r3>>>16&65535);_mem_set_uint16_be(HEAP32[r4>>2],r2+2|0,r3&65535);return}function _st_set_msg(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=0;r6=STACKTOP;r7=(r1|0)==0?HEAP32[39968>>2]:r1;if((r2|0)==0){r8=1;STACKTOP=r6;return r8}r1=(r3|0)==0?40440:r3;r3=488;while(1){r9=HEAP32[r3>>2];if((r9|0)==0){break}if((_msg_is_message(r9,r2)|0)==0){r3=r3+8|0}else{r4=5;break}}if(r4==5){r8=FUNCTION_TABLE[HEAP32[r3+4>>2]](r7,r2,r1);STACKTOP=r6;return r8}r3=HEAP32[r7+201688>>2];do{if((r3|0)!=0){r7=_trm_set_msg_trm(r3,r2,r1);if((r7|0)>-1){r8=r7}else{break}STACKTOP=r6;return r8}}while(0);if((_msg_is_prefix(33776,r2)|0)!=0){r8=1;STACKTOP=r6;return r8}_pce_log(2,29648,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r1,r5));STACKTOP=r5;r8=1;STACKTOP=r6;return r8}function _st_set_msg_emu_cpu_model(r1,r2,r3){var r4,r5;r2=0;r4=STACKTOP;if((_st_set_cpu_model(r1,r3)|0)==0){r5=0;STACKTOP=r4;return r5}_pce_log(0,26792,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r3,r2));STACKTOP=r2;r5=1;STACKTOP=r4;return r5}function _st_set_msg_emu_cpu_speed(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_uint(r3,r4)|0)==0){_st_set_speed(r1,HEAP32[r4>>2]);r5=0}else{r5=1}STACKTOP=r2;return r5}function _st_set_msg_emu_cpu_speed_step(r1,r2,r3){var r4,r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_sint(r3,r4)|0)!=0){r5=1;STACKTOP=r2;return r5}r3=HEAP32[r4>>2]+HEAP32[r1+201728>>2]|0;r6=(r3|0)<1?1:r3;HEAP32[r4>>2]=r6;_st_set_speed(r1,r6);r5=0;STACKTOP=r2;return r5}function _st_set_msg_emu_disk_commit(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8;HEAP32[r6>>2]=r3;if((_strcmp(r3,28528)|0)==0){_pce_log(2,28288,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r3=r1+4676|0;_st_fdc_save(r3,0);_st_fdc_save(r3,1);if((_dsks_commit(HEAP32[r1+201692>>2])|0)==0){r8=0;STACKTOP=r5;return r8}_pce_log(0,28032,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}r3=r1+4676|0;r9=r1+201692|0;r1=0;L8:while(1){while(1){if((HEAP8[HEAP32[r6>>2]]|0)==0){r8=r1;r2=13;break L8}if((_msg_get_prefix_uint(r6,r7,29464,29272)|0)!=0){break L8}_pce_log(2,27264,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;r10=HEAP32[r7>>2];if(r10>>>0<2){_st_fdc_save(r3,r10);r11=HEAP32[r7>>2]}else{r11=r10}if((_dsks_set_msg(HEAP32[r9>>2],r11,27144,0)|0)!=0){break}}_pce_log(0,27e3,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;r1=1}if(r2==13){STACKTOP=r5;return r8}_pce_log(0,27688,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6>>2],r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}function _st_set_msg_emu_disk_eject(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r2=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8;HEAP32[r6>>2]=r3;if((HEAP8[r3]|0)==0){r8=0;STACKTOP=r5;return r8}r3=r1+4676|0;r9=r1+201692|0;while(1){if((_msg_get_prefix_uint(r6,r7,29464,29272)|0)!=0){break}_pce_log(2,28664,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;r1=HEAP32[r7>>2];if(r1>>>0<2){_st_fdc_save(r3,r1);r10=HEAP32[r7>>2]}else{r10=r1}r1=_dsks_get_disk(HEAP32[r9>>2],r10);_dsks_rmv_disk(HEAP32[r9>>2],r1);_dsk_del(r1);r1=HEAP32[r7>>2];if(r1>>>0<2){_st_fdc_set_fname(r3,r1,0);_st_fdc_load(r3,HEAP32[r7>>2])}if((HEAP8[HEAP32[r6>>2]]|0)==0){r8=0;r2=10;break}}if(r2==10){STACKTOP=r5;return r8}_pce_log(0,29008,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6>>2],r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}function _st_set_msg_emu_disk_insert(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r4+8;HEAP32[r6>>2]=r3;if((_msg_get_prefix_uint(r6,r5,29464,29272)|0)!=0){_pce_log(0,29008,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r3,r2));STACKTOP=r2;r7=1;STACKTOP=r4;return r7}r2=HEAP32[r6>>2];r8=r2;r9=0;while(1){r10=r2+r9|0;r11=HEAP8[r10];if(r11<<24>>24==0){break}else if(r11<<24>>24==46){r12=r10}else{r12=r8}r8=r12;r9=r9+1|0}r9=r1+4676|0;_st_fdc_save(r9,HEAP32[r5>>2]);r12=(_strcasecmp(r8,28816)|0)==0;r8=HEAP32[r5>>2];do{if(r12){_st_fdc_set_fname(r9,r8,HEAP32[r6>>2])}else{_st_fdc_set_fname(r9,r8,0);if((_dsk_insert(HEAP32[r1+201692>>2],r3,1)|0)==0){break}else{r7=1}STACKTOP=r4;return r7}}while(0);_st_fdc_load(r9,HEAP32[r5>>2]);r7=0;STACKTOP=r4;return r7}function _st_set_msg_emu_exit(r1,r2,r3){HEAP32[r1+201720>>2]=2;_mon_set_terminate(39992,1);return 0}function _st_set_msg_emu_par_driver(r1,r2,r3){r2=r1+201696|0;r1=HEAP32[r2>>2];if((r1|0)!=0){_chr_close(r1)}r1=_chr_open(r3);HEAP32[r2>>2]=r1;return(r1|0)==0|0}function _st_set_msg_emu_par_file(r1,r2,r3){r2=_str_cat_alloc(29696,r3);r3=r1+201696|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_chr_close(r1)}r1=_chr_open(r2);HEAP32[r3>>2]=r1;_free(r2);return(r1|0)==0|0}function _st_set_msg_emu_pause(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_bool(r3,r4)|0)==0){_st_set_pause(r1,HEAP32[r4>>2]);r5=0}else{r5=1}STACKTOP=r2;return r5}function _st_set_msg_emu_pause_toggle(r1,r2,r3){_st_set_pause(r1,(HEAP8[r1+201718|0]|0)==0|0);return 0}function _st_set_msg_emu_realtime(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_bool(r3,r4)|0)!=0){r5=1;STACKTOP=r2;return r5}_st_set_speed(r1,(HEAP32[r4>>2]|0)!=0|0);r5=0;STACKTOP=r2;return r5}function _st_set_msg_emu_realtime_toggle(r1,r2,r3){if((HEAP32[r1+201728>>2]|0)==0){_st_set_speed(r1,1);return 0}else{_st_set_speed(r1,0);return 0}}function _st_set_msg_emu_reset(r1,r2,r3){_st_reset(r1);return 0}function _st_set_msg_emu_ser_driver(r1,r2,r3){r2=r1+201700|0;r1=HEAP32[r2>>2];if((r1|0)!=0){_chr_close(r1)}r1=_chr_open(r3);HEAP32[r2>>2]=r1;return(r1|0)==0|0}function _st_set_msg_emu_ser_file(r1,r2,r3){r2=_str_cat_alloc(29696,r3);r3=r1+201700|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_chr_close(r1)}r1=_chr_open(r2);HEAP32[r3>>2]=r1;_free(r2);return(r1|0)==0|0}function _st_set_msg_emu_stop(r1,r2,r3){_st_set_msg_trm(r1,30664,30224);HEAP32[r1+201720>>2]=1;return 0}function _st_psg_init(r1){var r2;_memset(r1+1|0,0,16)|0;r2=r1+20|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;return}function _st_psg_set_port_a_fct(r1,r2,r3){HEAP32[r1+20>>2]=r2;HEAP32[r1+24>>2]=r3;return}function _st_psg_set_port_b_fct(r1,r2,r3){HEAP32[r1+28>>2]=r2;HEAP32[r1+32>>2]=r3;return}function _st_psg_get_select(r1){return HEAP8[r1|0]}function _st_psg_set_select(r1,r2){HEAP8[r1|0]=r2;return}function _st_psg_get_data(r1){var r2,r3;r2=HEAPU8[r1|0];if((r2|0)==15){r3=HEAP8[r1+16|0]}else if((r2|0)==14){r3=HEAP8[r1+15|0]}else{r3=0}return r3}function _st_psg_set_data(r1,r2){var r3,r4;r3=HEAPU8[r1|0];if((r3|0)==14){r4=r1+15|0;if((HEAP8[r4]|0)==r2<<24>>24){return}HEAP8[r4]=r2;r4=HEAP32[r1+24>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+20>>2],r2);return}else if((r3|0)==15){r3=r1+16|0;if((HEAP8[r3]|0)==r2<<24>>24){return}HEAP8[r3]=r2;r3=HEAP32[r1+32>>2];if((r3|0)==0){return}FUNCTION_TABLE[r3](HEAP32[r1+28>>2],r2);return}else{return}}function _rp5c15_init(r1){_memset(r1+1|0,0,32)|0;HEAP8[r1+27|0]=1;return}function _rp5c15_get_uint8(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;if(r2>>>0>15){r5=0;STACKTOP=r3;return r5}if((r2|0)==13){r5=HEAP8[r1|0];STACKTOP=r3;return r5}HEAP32[r4>>2]=_time(0);r6=_localtime(r4);r4=r6|0;HEAP8[r1+1|0]=(HEAP32[r4>>2]|0)%10&-1;HEAP8[r1+2|0]=(HEAP32[r4>>2]|0)/10&-1;r4=r6+4|0;HEAP8[r1+3|0]=(HEAP32[r4>>2]|0)%10&-1;HEAP8[r1+4|0]=(HEAP32[r4>>2]|0)/10&-1;r4=r6+8|0;HEAP8[r1+5|0]=(HEAP32[r4>>2]|0)%10&-1;HEAP8[r1+6|0]=(HEAP32[r4>>2]|0)/10&-1;HEAP8[r1+7|0]=HEAP32[r6+24>>2];r4=r6+12|0;HEAP8[r1+8|0]=(HEAP32[r4>>2]|0)%10&-1;HEAP8[r1+9|0]=(HEAP32[r4>>2]|0)/10&-1;r4=r6+16|0;HEAP8[r1+10|0]=(HEAP32[r4>>2]+1|0)%10&-1;HEAP8[r1+11|0]=(HEAP32[r4>>2]+1|0)/10&-1;r4=r6+20|0;HEAP8[r1+12|0]=(HEAP32[r4>>2]-80|0)%10&-1;HEAP8[r1+13|0]=(HEAP32[r4>>2]-80|0)/10&-1;HEAP8[r1+28|0]=(HEAP32[r4>>2]-80|0)%4&-1;if((HEAP8[r1|0]&1)==0){r7=r2+(r1+1)|0}else{r7=r2+(r1+17)|0}r5=HEAP8[r7];STACKTOP=r3;return r5}function _rp5c15_set_uint8(r1,r2,r3){var r4;if(r2>>>0>15){return}r4=r1|0;if((HEAP8[r4]&1)==0){HEAP8[r2+(r1+1)|0]=r3}else{HEAP8[r2+(r1+17)|0]=r3}if((r2|0)!=13){return}HEAP8[r4]=r3;return}function _st_smf_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r5=r1+32|0;r6=HEAP8[r5];r7=r6<<24>>24==-16;if(r7){r8=r1+40|0;r9=HEAP32[r8>>2];r10=r9>>>0>4095;if(r10){return}r11=r9+1|0;HEAP32[r8>>2]=r11;r12=r9+(r1+48)|0;HEAP8[r12]=r2;r13=HEAP32[r8>>2];r14=r1+44|0;HEAP32[r14>>2]=r13;r15=r2<<24>>24==-9;if(!r15){return}_smf_put_event(r1);HEAP8[r5]=0;HEAP32[r8>>2]=0;HEAP32[r14>>2]=0;return}r16=r2&255;r17=r16&128;r18=(r17|0)==0;if(r18){r19=r1+40|0;r20=HEAP32[r19>>2];r21=r1+44|0;r22=HEAP32[r21>>2];r23=r20>>>0<r22>>>0;if(!r23){return}r24=(r20|0)==0;if(r24){r25=r1+36|0;HEAP32[r25>>2]=r3}r26=r20+1|0;HEAP32[r19>>2]=r26;r27=r20+(r1+48)|0;HEAP8[r27]=r2;r28=HEAP32[r19>>2];r29=HEAP32[r21>>2];r30=r28>>>0<r29>>>0;if(r30){return}_smf_put_event(r1);HEAP32[r19>>2]=0;return}HEAP8[r5]=r2;r31=r1+36|0;HEAP32[r31>>2]=r3;r32=r1+40|0;HEAP32[r32>>2]=0;r33=r1+44|0;HEAP32[r33>>2]=0;r34=r2<<24>>24==-16;if(r34){return}r35=r16&240;switch(r35|0){case 192:case 208:{HEAP32[r33>>2]=1;return;break};case 128:case 144:case 160:case 176:case 224:{HEAP32[r33>>2]=2;return;break};default:{if(r2<<24>>24==-15|r2<<24>>24==-13){HEAP32[r33>>2]=1;return}else if(r2<<24>>24==-14){HEAP32[r33>>2]=2;return}else{HEAP32[r33>>2]=0;_smf_put_event(r1);return}}}}function _smf_put_event(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=STACKTOP;STACKTOP=STACKTOP+272|0;r3=r2;r4=r2+16;r5=r1+24|0;if((HEAP8[r5]|0)==0){r6=0}else{r6=((HEAP32[r1+36>>2]-HEAP32[r1+28>>2]|0)>>>0)/15625&-1}r7=r1|0;r8=(HEAP32[r7>>2]|0)==0;do{if(r8|r6>>>0>7680){r9=r4|0;r10=HEAP32[r1+4>>2];if((r10|0)==0){r11=r8&1}else{r12=HEAP8[r10];if(r12<<24>>24==0){r13=0;r14=r9}else{r15=0;r16=r12;r12=r9;while(1){HEAP8[r12]=r16;r17=r15+1|0;r18=HEAP8[r10+r17|0];r19=r4+r17|0;if(r18<<24>>24==0){r13=r17;r14=r19;break}else{r15=r17;r16=r18;r12=r19}}}HEAP8[r14]=0;r12=r1+8|0;r16=HEAP32[r12>>2]+1|0;HEAP32[r12>>2]=r16;r12=r16;r16=r13;L13:while(1){r15=r16;while(1){if((r15|0)==0){break L13}r20=r15-1|0;r21=r4+r20|0;if((HEAP8[r21]|0)==35){break}else{r15=r20}}HEAP8[r21]=(r12>>>0)%10&-1|48;r12=(r12>>>0)/10&-1;r16=r20}r11=_st_smf_set_file(r1,r9)}if((r11|0)==0){r22=0;break}STACKTOP=r2;return}else{r22=r6}}while(0);HEAP32[r1+28>>2]=HEAP32[r1+36>>2];HEAP8[r5]=1;r5=r3|0;r6=0;r11=r22;while(1){r23=r6+1|0;HEAP8[r3+r6|0]=r11|128;r22=r11>>>7;if((r22|0)==0){break}else{r6=r23;r11=r22}}HEAP8[r5]=HEAP8[r5]&127;if((r23|0)!=0){r11=r1+20|0;r6=r23;while(1){r23=r6-1|0;_fputc(HEAPU8[r3+r23|0],HEAP32[r7>>2]);HEAP32[r11>>2]=HEAP32[r11>>2]+1;if((r23|0)==0){break}else{r6=r23}}}r6=r1+32|0;_fputc(HEAPU8[r6],HEAP32[r7>>2]);r11=r1+40|0;do{if((HEAP8[r6]|0)==-16){r23=0;r22=HEAP32[r11>>2];while(1){r24=r23+1|0;HEAP8[r3+r23|0]=r22|128;r20=r22>>>7;if((r20|0)==0){break}else{r23=r24;r22=r20}}HEAP8[r5]=HEAP8[r5]&127;if((r24|0)==0){break}r22=r1+20|0;r23=r24;while(1){r9=r23-1|0;_fputc(HEAPU8[r3+r9|0],HEAP32[r7>>2]);HEAP32[r22>>2]=HEAP32[r22>>2]+1;if((r9|0)==0){break}else{r23=r9}}}}while(0);if((HEAP32[r11>>2]|0)==0){r25=1}else{r3=0;while(1){_fputc(HEAPU8[r3+(r1+48)|0],HEAP32[r7>>2]);r24=r3+1|0;r26=HEAP32[r11>>2];if(r24>>>0<r26>>>0){r3=r24}else{break}}r25=r26+1|0}r26=r1+20|0;HEAP32[r26>>2]=r25+HEAP32[r26>>2];_fflush(HEAP32[r7>>2]);STACKTOP=r2;return}function _st_smf_init(r1){HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP8[r1+32|0]=0;HEAP32[r1+40>>2]=0;HEAP32[r1+44>>2]=0;return}function _st_smf_set_file(r1,r2){var r3,r4,r5,r6;r3=0;r4=r1|0;do{if((HEAP32[r4>>2]|0)!=0){_smf_put_meta(r1,47,0,0);if((_smf_write_header(r1)|0)!=0){break}_fclose(HEAP32[r4>>2]);HEAP32[r4>>2]=0}}while(0);r5=_fopen(r2,28152);if((r5|0)==0){r6=1;return r6}do{if((HEAP32[r4>>2]|0)==0){r3=8}else{_smf_put_meta(r1,47,0,0);if((_smf_write_header(r1)|0)!=0){break}_fclose(HEAP32[r4>>2]);HEAP32[r4>>2]=0;r3=8}}while(0);do{if(r3==8){HEAP32[r4>>2]=r5;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=14;HEAP32[r1+20>>2]=0;if((_smf_write_header(r1)|0)!=0){HEAP32[r4>>2]=0;break}_smf_put_meta(r1,1,33520,51);r6=0;return r6}}while(0);_fclose(r5);r6=1;return r6}function _st_smf_set_auto(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r1+4|0;r4=HEAP32[r3>>2];if((r4|0)==0){r5=0;r6=0}else{_free(r4);HEAP32[r3>>2]=0;r5=0;r6=0}while(1){r4=HEAP8[r2+r5|0];if(r4<<24>>24==0){break}else if(r4<<24>>24==35){r7=1}else{r7=r6}r5=r5+1|0;r6=r7}if((r6|0)==0){r8=_st_smf_set_file(r1,r2);return r8}r1=_malloc(r5+1|0);HEAP32[r3>>2]=r1;if((r1|0)==0){r8=1;return r8}_strcpy(r1,r2);r8=0;return r8}function _smf_write_header(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r1|0;if((_fseek(HEAP32[r3>>2],HEAP32[r1+12>>2],0)|0)!=0){r4=1;STACKTOP=r2;return r4}r5=r2|0;_buf_set_uint32_be(r5,0,1297377380);_buf_set_uint32_be(r5,4,6);_buf_set_uint16_be(r5,8,1);_buf_set_uint16_be(r5,10,1);_buf_set_uint16_be(r5,12,256);if((_fwrite(r5,1,14,HEAP32[r3>>2])|0)!=14){r4=1;STACKTOP=r2;return r4}r6=r1+16|0;if((_fseek(HEAP32[r3>>2],HEAP32[r6>>2],0)|0)!=0){r4=1;STACKTOP=r2;return r4}_buf_set_uint32_be(r5,0,1297379947);r7=r1+20|0;_buf_set_uint32_be(r5,4,HEAP32[r7>>2]);if((_fwrite(r5,1,8,HEAP32[r3>>2])|0)!=8){r4=1;STACKTOP=r2;return r4}r4=(_fseek(HEAP32[r3>>2],HEAP32[r6>>2]+8+HEAP32[r7>>2]|0,0)|0)!=0|0;STACKTOP=r2;return r4}function _smf_put_meta(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r1|0;_fputc(0,HEAP32[r7>>2]);_fputc(255,HEAP32[r7>>2]);_fputc(r2,HEAP32[r7>>2]);r2=r6|0;r8=0;r9=r4;while(1){r10=r8+1|0;HEAP8[r6+r8|0]=r9|128;r11=r9>>>7;if((r11|0)==0){break}else{r8=r10;r9=r11}}HEAP8[r2]=HEAP8[r2]&127;if((r10|0)!=0){r2=r1+20|0;r9=r10;while(1){r10=r9-1|0;_fputc(HEAPU8[r6+r10|0],HEAP32[r7>>2]);HEAP32[r2>>2]=HEAP32[r2>>2]+1;if((r10|0)==0){break}else{r9=r10}}}if((r4|0)==0){r12=r4+3|0;r13=r1+20|0;r14=HEAP32[r13>>2];r15=r12+r14|0;HEAP32[r13>>2]=r15;r16=HEAP32[r7>>2];r17=_fflush(r16);STACKTOP=r5;return}else{r18=0}while(1){_fputc(HEAPU8[r3+r18|0],HEAP32[r7>>2]);r9=r18+1|0;if(r9>>>0<r4>>>0){r18=r9}else{break}}r12=r4+3|0;r13=r1+20|0;r14=HEAP32[r13>>2];r15=r12+r14|0;HEAP32[r13>>2]=r15;r16=HEAP32[r7>>2];r17=_fflush(r16);STACKTOP=r5;return}function _st_video_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=0;r4=0;r5=STACKTOP;switch(r2|0){case 3:{r6=r1+4|0;r7=HEAP32[r6>>2];r8=r7>>>8;r9=r8&255;r10=r9;break};case 5:{r11=r1+8|0;r12=HEAP32[r11>>2];r13=r12>>>16;r14=r13&255;r10=r14;break};case 13:case 64:case 95:{r10=0;break};case 9:{r15=r1+8|0;r16=HEAP32[r15>>2];r17=r16&255;r10=r17;break};case 96:{r18=r1+61|0;r19=HEAP8[r18];r10=r19;break};case 7:{r20=r1+8|0;r21=HEAP32[r20>>2];r22=r21>>>8;r23=r22&255;r10=r23;break};case 10:{r24=r1+60|0;r25=HEAP8[r24];r10=r25;break};case 1:{r26=r1+4|0;r27=HEAP32[r26>>2];r28=r27>>>16;r29=r28&255;r10=r29;break};default:{_st_log_deb(25312,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=0,r4));STACKTOP=r4;r10=0}}STACKTOP=r5;return r10}function _st_video_get_uint16(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r2-64|0;if(r5>>>0<32){r6=HEAP16[r1+64+(r5>>>1<<1)>>1];STACKTOP=r4;return r6}else{_st_log_deb(27176,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r2,HEAP32[r3+8>>2]=0,r3));STACKTOP=r3;r6=0;STACKTOP=r4;return r6}}function _st_video_get_uint32(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r2-64|0;if(r5>>>0>=32){_st_log_deb(29544,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r2,HEAP32[r3+8>>2]=0,r3));STACKTOP=r3;r6=0;STACKTOP=r4;return r6}r7=HEAPU16[r1+64+(r5>>>1<<1)>>1]<<16;r5=r2-62|0;if(r5>>>0<32){r8=HEAPU16[r1+64+(r5>>>1<<1)>>1]}else{_st_log_deb(27176,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r2+2,HEAP32[r3+8>>2]=0,r3));STACKTOP=r3;r8=0}r6=r8|r7;STACKTOP=r4;return r6}function _st_video_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9;if((r2|0)==3){r4=r1+4|0;HEAP32[r4>>2]=HEAP32[r4>>2]&16711935|(r3&255)<<8;return}else if((r2|0)==96){r4=r1+61|0;if((HEAP8[r4]|0)==r3<<24>>24){return}HEAP8[r4]=r3;HEAP8[r1+62|0]=r3&3;do{if((r3&2)>>>0<2){r4=(HEAP8[r1+60|0]&2)==0;HEAP32[r1+172>>2]=320;r5=r1+176|0;if(r4){HEAP32[r5>>2]=508;HEAP32[r1+180>>2]=200;HEAP32[r1+184>>2]=263;r6=508;r7=263;break}else{HEAP32[r5>>2]=512;HEAP32[r1+180>>2]=200;HEAP32[r1+184>>2]=313;r6=512;r7=313;break}}else{HEAP32[r1+172>>2]=160;HEAP32[r1+176>>2]=224;HEAP32[r1+180>>2]=400;HEAP32[r1+184>>2]=501;r6=224;r7=501}}while(0);HEAP32[r1+208>>2]=8e6;HEAP32[r1+212>>2]=Math_imul(r6,r7)|0;return}else if((r2|0)==10){r7=r1+60|0;if((HEAP8[r7]|0)==r3<<24>>24){return}HEAP8[r7]=r3;do{if((HEAP8[r1+61|0]&2)>>>0<2){HEAP32[r1+172>>2]=320;r7=r1+176|0;if((r3&2)==0){HEAP32[r7>>2]=508;HEAP32[r1+180>>2]=200;HEAP32[r1+184>>2]=263;r8=508;r9=263;break}else{HEAP32[r7>>2]=512;HEAP32[r1+180>>2]=200;HEAP32[r1+184>>2]=313;r8=512;r9=313;break}}else{HEAP32[r1+172>>2]=160;HEAP32[r1+176>>2]=224;HEAP32[r1+180>>2]=400;HEAP32[r1+184>>2]=501;r8=224;r9=501}}while(0);HEAP32[r1+208>>2]=8e6;HEAP32[r1+212>>2]=Math_imul(r8,r9)|0;return}else if((r2|0)==1){r2=r1+4|0;HEAP32[r2>>2]=HEAP32[r2>>2]&65535|(r3&255)<<16;return}else{return}}function _st_video_set_uint16(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=r2-64|0;if(r6>>>0>=32){_st_log_deb(33472,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&65535,r4));STACKTOP=r4;STACKTOP=r5;return}r4=r6>>>1;HEAP16[r1+64+(r4<<1)>>1]=r3;r6=r3&65535;r2=(r3&65535)>>>3&255&-32;r7=r6<<1&255&-32;HEAP8[r1+96+(r4*3&-1)|0]=(r3&65535)>>>9&3|r2|(r2&255)>>>3;HEAP8[r1+96+(r4*3&-1)+1|0]=r7|(r3&65535)>>>5&3|(r7&255)>>>3;HEAP8[r1+96+(r4*3&-1)+2|0]=(r3&65535)>>>1&3|r6<<5&255|r6<<2&28;if((r4|0)!=0){STACKTOP=r5;return}r4=r6<<31>>31;r6=r4&255;r3=(r4^255)&255;HEAP8[r1+144|0]=r3;HEAP8[r1+145|0]=r3;HEAP8[r1+146|0]=r3;HEAP8[r1+147|0]=r6;HEAP8[r1+148|0]=r6;HEAP8[r1+149|0]=r6;STACKTOP=r5;return}function _st_video_set_uint32(r1,r2,r3){var r4,r5;r4=0;r5=STACKTOP;if((r2|0)==0){HEAP32[r1+4>>2]=r3<<8&65280|r3&16711680;STACKTOP=r5;return}if((r2-64|0)>>>0<32){_st_video_set_uint16(r1,r2,r3>>>16&65535);_st_video_set_uint16(r1,r2+2|0,r3&65535);STACKTOP=r5;return}else{_st_log_deb(27968,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3,r4));STACKTOP=r4;STACKTOP=r5;return}}function _st_video_new(r1,r2){var r3,r4,r5,r6,r7;r3=_malloc(244);r4=r3;if((r3|0)==0){r5=0;return r5}HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;r6=r3+12|0;do{if((_mem_blk_init(r6,r1,128,0)|0)==0){_mem_blk_set_fct(r6,r3,742,1054,312,956,288,774);HEAP8[r3+63|0]=(r2|0)!=0|0;r7=_malloc(768e3);HEAP32[r3+164>>2]=r7;if((r7|0)==0){break}HEAP32[r3+160>>2]=0;HEAP32[r3+168>>2]=r7;HEAP32[r3+200>>2]=0;HEAP32[r3+204>>2]=1;HEAP8[r3+220|0]=0;HEAP32[r3+224>>2]=0;HEAP32[r3+228>>2]=0;HEAP8[r3+232|0]=0;HEAP32[r3+236>>2]=0;HEAP32[r3+240>>2]=0;r5=r4;return r5}}while(0);_free(r3);r5=0;return r5}function _st_video_set_memory(r1,r2){HEAP32[r1>>2]=r2;return}function _st_video_set_hb_fct(r1,r2,r3){HEAP32[r1+224>>2]=r2;HEAP32[r1+228>>2]=r3;return}function _st_video_set_vb_fct(r1,r2,r3){HEAP32[r1+236>>2]=r2;HEAP32[r1+240>>2]=r3;return}function _st_video_set_terminal(r1,r2){HEAP32[r1+216>>2]=r2;if((r2|0)==0){return}if((HEAP8[r1+63|0]|0)==0){_trm_open(r2,320,200);return}else{_trm_open(r2,640,400);return}}function _st_video_set_frame_skip(r1,r2){HEAP32[r1+204>>2]=r2;return}function _st_video_reset(r1){var r2,r3,r4,r5,r6,r7,r8;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;r2=r1+60|0;HEAP8[r2]=0;r3=r1+61|0;HEAP8[r3]=-1;HEAP32[r1+188>>2]=0;HEAP32[r1+192>>2]=0;HEAP32[r1+196>>2]=0;HEAP32[r1+160>>2]=_mem_get_ptr(HEAP32[r1>>2],0,32768);HEAP32[r1+168>>2]=HEAP32[r1+164>>2];r4=HEAP8[r1+63|0];r5=r1+152|0;if(r4<<24>>24==0){HEAP32[r5>>2]=320;HEAP32[r1+156>>2]=200}else{HEAP32[r5>>2]=640;HEAP32[r1+156>>2]=400}r5=r4<<24>>24!=0;r4=r5?2:0;if((HEAP8[r3]|0)==r4<<24>>24){r6=0}else{HEAP8[r3]=r4;HEAP8[r1+62|0]=r4;do{if(r5){HEAP32[r1+172>>2]=160;HEAP32[r1+176>>2]=224;HEAP32[r1+180>>2]=400;HEAP32[r1+184>>2]=501;r7=224;r8=501}else{r4=(HEAP8[r2]&2)==0;HEAP32[r1+172>>2]=320;r3=r1+176|0;if(r4){HEAP32[r3>>2]=508;HEAP32[r1+180>>2]=200;HEAP32[r1+184>>2]=263;r7=508;r8=263;break}else{HEAP32[r3>>2]=512;HEAP32[r1+180>>2]=200;HEAP32[r1+184>>2]=313;r7=512;r8=313;break}}}while(0);HEAP32[r1+208>>2]=8e6;HEAP32[r1+212>>2]=Math_imul(r7,r8)|0;r6=0}while(1){HEAP16[r1+64+(r6<<1)>>1]=0;HEAP8[r1+96+(r6*3&-1)|0]=0;HEAP8[r1+96+(r6*3&-1)+1|0]=0;HEAP8[r1+96+(r6*3&-1)+2|0]=0;r8=r6+1|0;if(r8>>>0<16){r6=r8}else{break}}r6=r1+144|0;HEAP8[r6]=0;HEAP8[r6+1|0]=0;HEAP8[r6+2|0]=0;HEAP8[r6+3|0]=0;HEAP8[r6+4|0]=0;HEAP8[r6+5|0]=0;return}function _st_video_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=r1+188|0;r4=HEAP32[r3>>2]+r2|0;HEAP32[r3>>2]=r4;if(r4>>>0<HEAP32[r1+172>>2]>>>0){r2=r1+220|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+228>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+224>>2],0);return}r2=HEAP32[r1+176>>2];if(r4>>>0>=r2>>>0){HEAP32[r3>>2]=r4-r2;r2=r1+192|0;r4=HEAP32[r2>>2]+1|0;HEAP32[r2>>2]=r4;if(r4>>>0<=HEAP32[r1+180>>2]>>>0){r3=r1+232|0;if((HEAP8[r3]|0)==0){return}HEAP8[r3]=0;r3=HEAP32[r1+240>>2];if((r3|0)==0){return}FUNCTION_TABLE[r3](HEAP32[r1+236>>2],0);return}if(r4>>>0<=HEAP32[r1+184>>2]>>>0){r4=r1+232|0;if((HEAP8[r4]|0)!=0){return}HEAP8[r4]=1;r4=HEAP32[r1+240>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+236>>2],1)}do{if((HEAP32[r1+200>>2]|0)==0){r4=r1+216|0;r3=HEAP32[r4>>2];if((r3|0)==0){break}r5=r1+156|0;_trm_set_size(r3,HEAP32[r1+152>>2],HEAP32[r5>>2]);_trm_set_lines(HEAP32[r4>>2],HEAP32[r1+164>>2],0,HEAP32[r5>>2]);_trm_update(HEAP32[r4>>2])}}while(0);HEAP32[r1+8>>2]=HEAP32[r1+4>>2];return}r4=r1+196|0;HEAP32[r4>>2]=HEAP32[r4>>2]+1;r4=r1+200|0;r5=HEAP32[r4>>2];if((r5|0)==0){r6=HEAP32[r1+204>>2]}else{r6=r5-1|0}HEAP32[r4>>2]=r6;r6=r1+232|0;do{if((HEAP8[r6]|0)!=0){HEAP8[r6]=0;r4=HEAP32[r1+240>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+236>>2],0)}}while(0);r6=HEAP8[r1+62|0];if(r6<<24>>24==1){HEAP32[r1+152>>2]=640;HEAP32[r1+156>>2]=200}else if(r6<<24>>24==0){HEAP32[r1+152>>2]=320;HEAP32[r1+156>>2]=200}else{HEAP32[r1+152>>2]=640;HEAP32[r1+156>>2]=400}HEAP32[r2>>2]=0;HEAP32[r1+160>>2]=_mem_get_ptr(HEAP32[r1>>2],HEAP32[r1+8>>2],32768);HEAP32[r1+168>>2]=HEAP32[r1+164>>2];return}r2=r1+220|0;if((HEAP8[r2]|0)!=0){return}HEAP8[r2]=1;r2=HEAP32[r1+228>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+224>>2],1)}if(HEAP32[r1+192>>2]>>>0>=HEAP32[r1+180>>2]>>>0){return}r2=HEAP8[r1+62|0];if((HEAP32[r1+200>>2]|0)!=0){if(r2<<24>>24==1|r2<<24>>24==0){r6=r1+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+160;return}else if(r2<<24>>24==2){r6=r1+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+80;return}else{return}}if(r2<<24>>24==1){r6=r1+160|0;r4=HEAP32[r6>>2];if((r4|0)==0){return}r5=r1+168|0;r3=HEAP32[r5>>2];r7=r4;r8=0;r9=r3;while(1){r10=0;r11=HEAPU8[r7+2|0]<<8|HEAPU8[r7+3|0];r12=HEAPU8[r7]<<8|HEAPU8[r7+1|0];r13=r9;while(1){r14=(r11&65535)>>>14&2|(r12&65535)>>>15;HEAP8[r13]=HEAP8[r1+96+(r14*3&-1)|0];HEAP8[r13+1|0]=HEAP8[r1+96+(r14*3&-1)+1|0];HEAP8[r13+2|0]=HEAP8[r1+96+(r14*3&-1)+2|0];r14=r10+1|0;if(r14>>>0<16){r10=r14;r11=r11<<1;r12=r12<<1;r13=r13+3|0}else{break}}r13=r8+1|0;if(r13>>>0<40){r7=r7+4|0;r8=r13;r9=r9+48|0}else{break}}HEAP32[r6>>2]=r4+160;HEAP32[r5>>2]=r3+1920;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+160;return}else if(r2<<24>>24==2){r3=r1+160|0;r5=HEAP32[r3>>2];if((r5|0)==0){return}r4=r1+168|0;r6=HEAP32[r4>>2];r9=r1+144|0;r8=r1+147|0;r7=0;r13=r5;r12=r6;while(1){r11=(HEAP8[r13]|0)>-1?r8:r9;HEAP8[r12]=HEAP8[r11];HEAP8[r12+1|0]=HEAP8[r11+1|0];HEAP8[r12+2|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&64)==0?r8:r9;HEAP8[r12+3|0]=HEAP8[r11];HEAP8[r12+4|0]=HEAP8[r11+1|0];HEAP8[r12+5|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&32)==0?r8:r9;HEAP8[r12+6|0]=HEAP8[r11];HEAP8[r12+7|0]=HEAP8[r11+1|0];HEAP8[r12+8|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&16)==0?r8:r9;HEAP8[r12+9|0]=HEAP8[r11];HEAP8[r12+10|0]=HEAP8[r11+1|0];HEAP8[r12+11|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&8)==0?r8:r9;HEAP8[r12+12|0]=HEAP8[r11];HEAP8[r12+13|0]=HEAP8[r11+1|0];HEAP8[r12+14|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&4)==0?r8:r9;HEAP8[r12+15|0]=HEAP8[r11];HEAP8[r12+16|0]=HEAP8[r11+1|0];HEAP8[r12+17|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&2)==0?r8:r9;HEAP8[r12+18|0]=HEAP8[r11];HEAP8[r12+19|0]=HEAP8[r11+1|0];HEAP8[r12+20|0]=HEAP8[r11+2|0];r11=(HEAP8[r13]&1)==0?r8:r9;HEAP8[r12+21|0]=HEAP8[r11];HEAP8[r12+22|0]=HEAP8[r11+1|0];HEAP8[r12+23|0]=HEAP8[r11+2|0];r11=r7+1|0;if(r11>>>0<80){r7=r11;r13=r13+1|0;r12=r12+24|0}else{break}}HEAP32[r3>>2]=r5+80;HEAP32[r4>>2]=r6+1920;r6=r1+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]+80;return}else if(r2<<24>>24==0){r2=r1+160|0;r6=HEAP32[r2>>2];if((r6|0)==0){return}r4=r1+168|0;r5=HEAP32[r4>>2];r3=r6;r12=0;r13=r5;while(1){r7=0;r9=HEAPU8[r3+6|0]<<8|HEAPU8[r3+7|0];r8=HEAPU8[r3+4|0]<<8|HEAPU8[r3+5|0];r11=HEAPU8[r3+2|0]<<8|HEAPU8[r3+3|0];r10=HEAPU8[r3]<<8|HEAPU8[r3+1|0];r14=r13;while(1){r15=(r11&65535)>>>14&2|(r10&65535)>>>15|(r8&65535)>>>13&4|(r9&65535)>>>12&8;HEAP8[r14]=HEAP8[r1+96+(r15*3&-1)|0];HEAP8[r14+1|0]=HEAP8[r1+96+(r15*3&-1)+1|0];HEAP8[r14+2|0]=HEAP8[r1+96+(r15*3&-1)+2|0];r15=r7+1|0;if(r15>>>0<16){r7=r15;r9=r9<<1;r8=r8<<1;r11=r11<<1;r10=r10<<1;r14=r14+3|0}else{break}}r14=r12+1|0;if(r14>>>0<20){r3=r3+8|0;r12=r14;r13=r13+48|0}else{break}}HEAP32[r2>>2]=r6+160;HEAP32[r4>>2]=r5+960;r5=r1+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]+160;return}else{return}}function _e68_dasm_mem(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r1+36|0;r7=r1+32|0;r8=r1+8|0;r9=r1+4|0;r1=0;while(1){r10=r1+r3&16777215;if(r10>>>0<HEAP32[r6>>2]>>>0){r11=HEAP8[HEAP32[r7>>2]+r10|0]}else{r11=FUNCTION_TABLE[HEAP32[r8>>2]](HEAP32[r9>>2],r10)}HEAP8[r5+r1|0]=r11;r10=r1+1|0;if(r10>>>0<16){r1=r10}else{break}}r1=r5|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=r3;HEAP8[r2+288|0]=0;r3=HEAP8[r1];r11=HEAP8[r5+1|0];HEAP16[r2+12>>1]=(r3&255)<<8|r11&255;r9=r2+8|0;HEAP32[r9>>2]=1;FUNCTION_TABLE[HEAP32[9968+(((r11&255)>>>6|(r3&255)<<2)<<2)>>2]](r2,r1);if((HEAP32[r9>>2]|0)==0){STACKTOP=r4;return}else{r12=0}while(1){r1=r12<<1;HEAP16[r2+12+(r12<<1)>>1]=HEAPU8[r5+r1|0]<<8|HEAPU8[r5+(r1|1)|0];r1=r12+1|0;if(r1>>>0<HEAP32[r9>>2]>>>0){r12=r1}else{break}}STACKTOP=r4;return}function _d_0000(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=(HEAP16[r1+12>>1]&63)==60;r6=r1+32|0;HEAP8[r6]=HEAP8[28720];HEAP8[r6+1|0]=HEAP8[28721];HEAP8[r6+2|0]=HEAP8[28722];HEAP8[r6+3|0]=HEAP8[28723];HEAP8[r6+4|0]=HEAP8[28724];HEAP8[r6+5|0]=HEAP8[28725];HEAP32[r1+28>>2]=2;r6=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r1+160|0;if(r5){r5=r3;tempBigInt=5391171;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;STACKTOP=r4;return}else{_dasm_ea(r1,r3,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_0040(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=(HEAP16[r1+12>>1]&63)==60;r6=r1+32|0;HEAP8[r6]=HEAP8[28736];HEAP8[r6+1|0]=HEAP8[28737];HEAP8[r6+2|0]=HEAP8[28738];HEAP8[r6+3|0]=HEAP8[28739];HEAP8[r6+4|0]=HEAP8[28740];HEAP8[r6+5|0]=HEAP8[28741];HEAP32[r1+28>>2]=2;r6=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r1+160|0;if(r5){HEAP8[r3]=HEAP8[31424];HEAP8[r3+1|0]=HEAP8[31425];HEAP8[r3+2|0]=HEAP8[31426];r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;STACKTOP=r4;return}else{_dasm_ea(r1,r3,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_0080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[28752];HEAP8[r5+1|0]=HEAP8[28753];HEAP8[r5+2|0]=HEAP8[28754];HEAP8[r5+3|0]=HEAP8[28755];HEAP8[r5+4|0]=HEAP8[28756];HEAP8[r5+5|0]=HEAP8[28757];HEAP32[r1+28>>2]=2;r5=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_00c0(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=HEAP8[r2+(r6<<1)|0];HEAP32[r5>>2]=r6+1;r6=r1+32|0;if((r7&8)==0){HEAP8[r6]=HEAP8[28760];HEAP8[r6+1|0]=HEAP8[28761];HEAP8[r6+2|0]=HEAP8[28762];HEAP8[r6+3|0]=HEAP8[28763];HEAP8[r6+4|0]=HEAP8[28764];HEAP8[r6+5|0]=HEAP8[28765];HEAP8[r6+6|0]=HEAP8[28766];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);r7=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|128;HEAP32[r8>>2]=r10;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[28768];HEAP8[r6+1|0]=HEAP8[28769];HEAP8[r6+2|0]=HEAP8[28770];HEAP8[r6+3|0]=HEAP8[28771];HEAP8[r6+4|0]=HEAP8[28772];HEAP8[r6+5|0]=HEAP8[28773];HEAP8[r6+6|0]=HEAP8[28774];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);r6=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r6&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r6>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|128;HEAP32[r8>>2]=r10;STACKTOP=r4;return}}function _d_0100(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=HEAP16[r1+12>>1];r6=r1+32|0;if((r5&56)==8){r7=r6;r8=r7|0;tempBigInt=1163284301;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=5713488;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;r8=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;r7=(r8&32768|0)!=0;_sprintf(r1+96|0,35376,(r3=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r3>>2]=r7?34344:40472,HEAP32[r3+8>>2]=25192,HEAP32[r3+16>>2]=(r7?-r8|0:r8)&65535,HEAP32[r3+24>>2]=r5&7,r3));STACKTOP=r3;r5=r1+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]+1;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[29144];HEAP8[r6+1|0]=HEAP8[29145];HEAP8[r6+2|0]=HEAP8[29146];HEAP8[r6+3|0]=HEAP8[29147];HEAP8[r6+4|0]=HEAP8[29148];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_0140(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=HEAP16[r1+12>>1];r6=r1+32|0;if((r5&56)==8){r7=r6;r8=r7|0;tempBigInt=1163284301;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=4992592;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;r8=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;r7=(r8&32768|0)!=0;_sprintf(r1+96|0,35376,(r3=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r3>>2]=r7?34344:40472,HEAP32[r3+8>>2]=25192,HEAP32[r3+16>>2]=(r7?-r8|0:r8)&65535,HEAP32[r3+24>>2]=r5&7,r3));STACKTOP=r3;r5=r1+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]+1;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[29168];HEAP8[r6+1|0]=HEAP8[29169];HEAP8[r6+2|0]=HEAP8[29170];HEAP8[r6+3|0]=HEAP8[29171];HEAP8[r6+4|0]=HEAP8[29172];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_0180(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;r5=r1+12|0;r6=r1+32|0;if((HEAP16[r5>>1]&56)==8){r7=r6;r8=r7|0;tempBigInt=1163284301;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=5713488;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r8=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;r7=(r8&32768|0)!=0;r9=HEAP16[r5>>1]&7;_sprintf(r1+160|0,35376,(r3=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r3>>2]=r7?34344:40472,HEAP32[r3+8>>2]=25192,HEAP32[r3+16>>2]=(r7?-r8|0:r8)&65535,HEAP32[r3+24>>2]=r9,r3));STACKTOP=r3;r9=r1+8|0;HEAP32[r9>>2]=HEAP32[r9>>2]+1;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[29184];HEAP8[r6+1|0]=HEAP8[29185];HEAP8[r6+2|0]=HEAP8[29186];HEAP8[r6+3|0]=HEAP8[29187];HEAP8[r6+4|0]=HEAP8[29188];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_01c0(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;r5=r1+12|0;r6=r1+32|0;if((HEAP16[r5>>1]&56)==8){r7=r6;r8=r7|0;tempBigInt=1163284301;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=4992592;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r8=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;r7=(r8&32768|0)!=0;r9=HEAP16[r5>>1]&7;_sprintf(r1+160|0,35376,(r3=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r3>>2]=r7?34344:40472,HEAP32[r3+8>>2]=25192,HEAP32[r3+16>>2]=(r7?-r8|0:r8)&65535,HEAP32[r3+24>>2]=r9,r3));STACKTOP=r3;r9=r1+8|0;HEAP32[r9>>2]=HEAP32[r9>>2]+1;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[29216];HEAP8[r6+1|0]=HEAP8[29217];HEAP8[r6+2|0]=HEAP8[29218];HEAP8[r6+3|0]=HEAP8[29219];HEAP8[r6+4|0]=HEAP8[29220];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_0200(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=(HEAP16[r1+12>>1]&63)==60;r6=r1+32|0;HEAP8[r6]=HEAP8[28808];HEAP8[r6+1|0]=HEAP8[28809];HEAP8[r6+2|0]=HEAP8[28810];HEAP8[r6+3|0]=HEAP8[28811];HEAP8[r6+4|0]=HEAP8[28812];HEAP8[r6+5|0]=HEAP8[28813];HEAP8[r6+6|0]=HEAP8[28814];HEAP32[r1+28>>2]=2;r6=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r1+160|0;if(r5){r5=r3;tempBigInt=5391171;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;STACKTOP=r4;return}else{_dasm_ea(r1,r3,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_0240(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=(HEAP16[r1+12>>1]&63)==60;r6=r1+32|0;HEAP8[r6]=HEAP8[28824];HEAP8[r6+1|0]=HEAP8[28825];HEAP8[r6+2|0]=HEAP8[28826];HEAP8[r6+3|0]=HEAP8[28827];HEAP8[r6+4|0]=HEAP8[28828];HEAP8[r6+5|0]=HEAP8[28829];HEAP8[r6+6|0]=HEAP8[28830];HEAP32[r1+28>>2]=2;r6=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r1+160|0;if(r5){HEAP8[r3]=HEAP8[31424];HEAP8[r3+1|0]=HEAP8[31425];HEAP8[r3+2|0]=HEAP8[31426];r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;STACKTOP=r4;return}else{_dasm_ea(r1,r3,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_0280(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[28896];HEAP8[r5+1|0]=HEAP8[28897];HEAP8[r5+2|0]=HEAP8[28898];HEAP8[r5+3|0]=HEAP8[28899];HEAP8[r5+4|0]=HEAP8[28900];HEAP8[r5+5|0]=HEAP8[28901];HEAP8[r5+6|0]=HEAP8[28902];HEAP32[r1+28>>2]=2;r5=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_02c0(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=HEAP8[r2+(r6<<1)|0];HEAP32[r5>>2]=r6+1;r6=r1+32|0;if((r7&8)==0){HEAP8[r6]=HEAP8[28904];HEAP8[r6+1|0]=HEAP8[28905];HEAP8[r6+2|0]=HEAP8[28906];HEAP8[r6+3|0]=HEAP8[28907];HEAP8[r6+4|0]=HEAP8[28908];HEAP8[r6+5|0]=HEAP8[28909];HEAP8[r6+6|0]=HEAP8[28910];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r7=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|128;HEAP32[r8>>2]=r10;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[28920];HEAP8[r6+1|0]=HEAP8[28921];HEAP8[r6+2|0]=HEAP8[28922];HEAP8[r6+3|0]=HEAP8[28923];HEAP8[r6+4|0]=HEAP8[28924];HEAP8[r6+5|0]=HEAP8[28925];HEAP8[r6+6|0]=HEAP8[28926];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r6=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r6&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r6>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|128;HEAP32[r8>>2]=r10;STACKTOP=r4;return}}function _d_0400(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[28944];HEAP8[r5+1|0]=HEAP8[28945];HEAP8[r5+2|0]=HEAP8[28946];HEAP8[r5+3|0]=HEAP8[28947];HEAP8[r5+4|0]=HEAP8[28948];HEAP8[r5+5|0]=HEAP8[28949];HEAP8[r5+6|0]=HEAP8[28950];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_0440(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[28952];HEAP8[r5+1|0]=HEAP8[28953];HEAP8[r5+2|0]=HEAP8[28954];HEAP8[r5+3|0]=HEAP8[28955];HEAP8[r5+4|0]=HEAP8[28956];HEAP8[r5+5|0]=HEAP8[28957];HEAP8[r5+6|0]=HEAP8[28958];HEAP32[r1+28>>2]=2;r5=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}function _d_0480(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[28968];HEAP8[r5+1|0]=HEAP8[28969];HEAP8[r5+2|0]=HEAP8[28970];HEAP8[r5+3|0]=HEAP8[28971];HEAP8[r5+4|0]=HEAP8[28972];HEAP8[r5+5|0]=HEAP8[28973];HEAP8[r5+6|0]=HEAP8[28974];HEAP32[r1+28>>2]=2;r5=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_04c0(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=HEAP8[r2+(r6<<1)|0];HEAP32[r5>>2]=r6+1;r6=r1+32|0;if((r7&8)==0){HEAP8[r6]=HEAP8[28976];HEAP8[r6+1|0]=HEAP8[28977];HEAP8[r6+2|0]=HEAP8[28978];HEAP8[r6+3|0]=HEAP8[28979];HEAP8[r6+4|0]=HEAP8[28980];HEAP8[r6+5|0]=HEAP8[28981];HEAP8[r6+6|0]=HEAP8[28982];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);r7=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|128;HEAP32[r8>>2]=r10;STACKTOP=r4;return}else{HEAP8[r6]=HEAP8[28984];HEAP8[r6+1|0]=HEAP8[28985];HEAP8[r6+2|0]=HEAP8[28986];HEAP8[r6+3|0]=HEAP8[28987];HEAP8[r6+4|0]=HEAP8[28988];HEAP8[r6+5|0]=HEAP8[28989];HEAP8[r6+6|0]=HEAP8[28990];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);r6=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r6&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r6>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|128;HEAP32[r8>>2]=r10;STACKTOP=r4;return}}function _d_0600(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29e3];HEAP8[r5+1|0]=HEAP8[29001];HEAP8[r5+2|0]=HEAP8[29002];HEAP8[r5+3|0]=HEAP8[29003];HEAP8[r5+4|0]=HEAP8[29004];HEAP8[r5+5|0]=HEAP8[29005];HEAP8[r5+6|0]=HEAP8[29006];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_0640(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29048];HEAP8[r5+1|0]=HEAP8[29049];HEAP8[r5+2|0]=HEAP8[29050];HEAP8[r5+3|0]=HEAP8[29051];HEAP8[r5+4|0]=HEAP8[29052];HEAP8[r5+5|0]=HEAP8[29053];HEAP8[r5+6|0]=HEAP8[29054];HEAP32[r1+28>>2]=2;r5=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}function _d_0680(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29136];HEAP8[r5+1|0]=HEAP8[29137];HEAP8[r5+2|0]=HEAP8[29138];HEAP8[r5+3|0]=HEAP8[29139];HEAP8[r5+4|0]=HEAP8[29140];HEAP8[r5+5|0]=HEAP8[29141];HEAP8[r5+6|0]=HEAP8[29142];HEAP32[r1+28>>2]=2;r5=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _di_und(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[22912];HEAP8[r5+1|0]=HEAP8[22913];HEAP8[r5+2|0]=HEAP8[22914];HEAP32[r1+28>>2]=1;r5=(HEAPU8[r2]<<8|HEAPU8[r2+1|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_0800(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29144];HEAP8[r5+1|0]=HEAP8[29145];HEAP8[r5+2|0]=HEAP8[29146];HEAP8[r5+3|0]=HEAP8[29147];HEAP8[r5+4|0]=HEAP8[29148];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_0840(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29168];HEAP8[r5+1|0]=HEAP8[29169];HEAP8[r5+2|0]=HEAP8[29170];HEAP8[r5+3|0]=HEAP8[29171];HEAP8[r5+4|0]=HEAP8[29172];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_0880(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29184];HEAP8[r5+1|0]=HEAP8[29185];HEAP8[r5+2|0]=HEAP8[29186];HEAP8[r5+3|0]=HEAP8[29187];HEAP8[r5+4|0]=HEAP8[29188];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_08c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29216];HEAP8[r5+1|0]=HEAP8[29217];HEAP8[r5+2|0]=HEAP8[29218];HEAP8[r5+3|0]=HEAP8[29219];HEAP8[r5+4|0]=HEAP8[29220];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_0a00(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=(HEAP16[r1+12>>1]&63)==60;r6=r1+32|0;HEAP8[r6]=HEAP8[29224];HEAP8[r6+1|0]=HEAP8[29225];HEAP8[r6+2|0]=HEAP8[29226];HEAP8[r6+3|0]=HEAP8[29227];HEAP8[r6+4|0]=HEAP8[29228];HEAP8[r6+5|0]=HEAP8[29229];HEAP8[r6+6|0]=HEAP8[29230];HEAP32[r1+28>>2]=2;r6=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r1+160|0;if(r5){r5=r3;tempBigInt=5391171;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;STACKTOP=r4;return}else{_dasm_ea(r1,r3,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_0a40(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=(HEAP16[r1+12>>1]&63)==60;r6=r1+32|0;HEAP8[r6]=HEAP8[29232];HEAP8[r6+1|0]=HEAP8[29233];HEAP8[r6+2|0]=HEAP8[29234];HEAP8[r6+3|0]=HEAP8[29235];HEAP8[r6+4|0]=HEAP8[29236];HEAP8[r6+5|0]=HEAP8[29237];HEAP8[r6+6|0]=HEAP8[29238];HEAP32[r1+28>>2]=2;r6=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;r3=r1+160|0;if(r5){HEAP8[r3]=HEAP8[31424];HEAP8[r3+1|0]=HEAP8[31425];HEAP8[r3+2|0]=HEAP8[31426];r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;STACKTOP=r4;return}else{_dasm_ea(r1,r3,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_0a80(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29240];HEAP8[r5+1|0]=HEAP8[29241];HEAP8[r5+2|0]=HEAP8[29242];HEAP8[r5+3|0]=HEAP8[29243];HEAP8[r5+4|0]=HEAP8[29244];HEAP8[r5+5|0]=HEAP8[29245];HEAP8[r5+6|0]=HEAP8[29246];HEAP32[r1+28>>2]=2;r5=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_0c00(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29264];HEAP8[r5+1|0]=HEAP8[29265];HEAP8[r5+2|0]=HEAP8[29266];HEAP8[r5+3|0]=HEAP8[29267];HEAP8[r5+4|0]=HEAP8[29268];HEAP8[r5+5|0]=HEAP8[29269];HEAP8[r5+6|0]=HEAP8[29270];HEAP32[r1+28>>2]=2;r5=HEAPU8[r2+3|0];_sprintf(r1+96|0,33240,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_0c40(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29280];HEAP8[r5+1|0]=HEAP8[29281];HEAP8[r5+2|0]=HEAP8[29282];HEAP8[r5+3|0]=HEAP8[29283];HEAP8[r5+4|0]=HEAP8[29284];HEAP8[r5+5|0]=HEAP8[29285];HEAP8[r5+6|0]=HEAP8[29286];HEAP32[r1+28>>2]=2;r5=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}function _d_0c80(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[29336];HEAP8[r5+1|0]=HEAP8[29337];HEAP8[r5+2|0]=HEAP8[29338];HEAP8[r5+3|0]=HEAP8[29339];HEAP8[r5+4|0]=HEAP8[29340];HEAP8[r5+5|0]=HEAP8[29341];HEAP8[r5+6|0]=HEAP8[29342];HEAP32[r1+28>>2]=2;r5=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;r3=r1+8|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_0e00(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=HEAP8[r2+(r6<<1)|0];HEAP32[r5>>2]=r6+1;r6=r1+32|0;HEAP8[r6]=HEAP8[29344];HEAP8[r6+1|0]=HEAP8[29345];HEAP8[r6+2|0]=HEAP8[29346];HEAP8[r6+3|0]=HEAP8[29347];HEAP8[r6+4|0]=HEAP8[29348];HEAP8[r6+5|0]=HEAP8[29349];HEAP8[r6+6|0]=HEAP8[29350];HEAP32[r1+28>>2]=2;r6=r1+96|0;if((r7&8)==0){_dasm_ea(r1,r6,r2,HEAP8[r2+1|0]&63,8);r7=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|64;HEAP32[r8>>2]=r10;STACKTOP=r4;return}else{r7=HEAPU8[r2+2|0];_sprintf(r6,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);r8=r1|0;r9=HEAP32[r8>>2];r10=r9|64;HEAP32[r8>>2]=r10;STACKTOP=r4;return}}function _d_0e40(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=HEAP8[r2+(r6<<1)|0];HEAP32[r5>>2]=r6+1;r6=r1+32|0;HEAP8[r6]=HEAP8[29360];HEAP8[r6+1|0]=HEAP8[29361];HEAP8[r6+2|0]=HEAP8[29362];HEAP8[r6+3|0]=HEAP8[29363];HEAP8[r6+4|0]=HEAP8[29364];HEAP8[r6+5|0]=HEAP8[29365];HEAP8[r6+6|0]=HEAP8[29366];HEAP32[r1+28>>2]=2;r6=r1+96|0;if((r7&8)==0){_dasm_ea(r1,r6,r2,HEAP8[r2+1|0]&63,16);r7=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|64;HEAP32[r8>>2]=r10;STACKTOP=r4;return}else{r7=HEAPU8[r2+2|0];_sprintf(r6,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);r8=r1|0;r9=HEAP32[r8>>2];r10=r9|64;HEAP32[r8>>2]=r10;STACKTOP=r4;return}}function _d_0e80(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=HEAP8[r2+(r6<<1)|0];HEAP32[r5>>2]=r6+1;r6=r1+32|0;HEAP8[r6]=HEAP8[29368];HEAP8[r6+1|0]=HEAP8[29369];HEAP8[r6+2|0]=HEAP8[29370];HEAP8[r6+3|0]=HEAP8[29371];HEAP8[r6+4|0]=HEAP8[29372];HEAP8[r6+5|0]=HEAP8[29373];HEAP8[r6+6|0]=HEAP8[29374];HEAP32[r1+28>>2]=2;r6=r1+96|0;if((r7&8)==0){_dasm_ea(r1,r6,r2,HEAP8[r2+1|0]&63,32);r7=HEAPU8[r2+2|0];_sprintf(r1+160|0,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;r8=r1|0;r9=HEAP32[r8>>2];r10=r9|64;HEAP32[r8>>2]=r10;STACKTOP=r4;return}else{r7=HEAPU8[r2+2|0];_sprintf(r6,23816,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=(r7&128|0)!=0?22824:21576,HEAP32[r3+8>>2]=r7>>>4&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);r8=r1|0;r9=HEAP32[r8>>2];r10=r9|64;HEAP32[r8>>2]=r10;STACKTOP=r4;return}}function _d_4ec0(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262666;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,0);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|2;return}function _d_1000(r1,r2){var r3,r4;r3=r1+32|0;HEAP8[r3]=HEAP8[29400];HEAP8[r3+1|0]=HEAP8[29401];HEAP8[r3+2|0]=HEAP8[29402];HEAP8[r3+3|0]=HEAP8[29403];HEAP8[r3+4|0]=HEAP8[29404];HEAP8[r3+5|0]=HEAP8[29405];HEAP8[r3+6|0]=HEAP8[29406];HEAP32[r1+28>>2]=2;r3=r2+1|0;_dasm_ea(r1,r1+96|0,r2,HEAP8[r3]&63,8);r4=(HEAPU8[r2]<<8|HEAPU8[r3])&65535;_dasm_ea(r1,r1+160|0,r2,r4>>>3&56|r4>>>9&7,8);return}function _d_2000(r1,r2){var r3,r4;r3=r1+32|0;HEAP8[r3]=HEAP8[29408];HEAP8[r3+1|0]=HEAP8[29409];HEAP8[r3+2|0]=HEAP8[29410];HEAP8[r3+3|0]=HEAP8[29411];HEAP8[r3+4|0]=HEAP8[29412];HEAP8[r3+5|0]=HEAP8[29413];HEAP8[r3+6|0]=HEAP8[29414];HEAP32[r1+28>>2]=2;r3=r2+1|0;_dasm_ea(r1,r1+96|0,r2,HEAP8[r3]&63,32);r4=(HEAPU8[r2]<<8|HEAPU8[r3])&65535;_dasm_ea(r1,r1+160|0,r2,r4>>>3&56|r4>>>9&7,32);return}function _d_2040(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;r6=r5|0;tempBigInt=1163284301;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;r6=r5+4|0;tempBigInt=4992577;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_3000(r1,r2){var r3,r4;r3=r1+32|0;HEAP8[r3]=HEAP8[29936];HEAP8[r3+1|0]=HEAP8[29937];HEAP8[r3+2|0]=HEAP8[29938];HEAP8[r3+3|0]=HEAP8[29939];HEAP8[r3+4|0]=HEAP8[29940];HEAP8[r3+5|0]=HEAP8[29941];HEAP8[r3+6|0]=HEAP8[29942];HEAP32[r1+28>>2]=2;r3=r2+1|0;_dasm_ea(r1,r1+96|0,r2,HEAP8[r3]&63,16);r4=(HEAPU8[r2]<<8|HEAPU8[r3])&65535;_dasm_ea(r1,r1+160|0,r2,r4>>>3&56|r4>>>9&7,16);return}function _d_3040(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;r6=r5|0;tempBigInt=1163284301;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;r6=r5+4|0;tempBigInt=5713473;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_4000(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29472];HEAP8[r3+1|0]=HEAP8[29473];HEAP8[r3+2|0]=HEAP8[29474];HEAP8[r3+3|0]=HEAP8[29475];HEAP8[r3+4|0]=HEAP8[29476];HEAP8[r3+5|0]=HEAP8[29477];HEAP8[r3+6|0]=HEAP8[29478];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|32;return}function _d_4040(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29576];HEAP8[r3+1|0]=HEAP8[29577];HEAP8[r3+2|0]=HEAP8[29578];HEAP8[r3+3|0]=HEAP8[29579];HEAP8[r3+4|0]=HEAP8[29580];HEAP8[r3+5|0]=HEAP8[29581];HEAP8[r3+6|0]=HEAP8[29582];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|32;return}function _d_4080(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29584];HEAP8[r3+1|0]=HEAP8[29585];HEAP8[r3+2|0]=HEAP8[29586];HEAP8[r3+3|0]=HEAP8[29587];HEAP8[r3+4|0]=HEAP8[29588];HEAP8[r3+5|0]=HEAP8[29589];HEAP8[r3+6|0]=HEAP8[29590];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|32;return}function _d_40c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29936];HEAP8[r3+1|0]=HEAP8[29937];HEAP8[r3+2|0]=HEAP8[29938];HEAP8[r3+3|0]=HEAP8[29939];HEAP8[r3+4|0]=HEAP8[29940];HEAP8[r3+5|0]=HEAP8[29941];HEAP8[r3+6|0]=HEAP8[29942];HEAP32[r1+28>>2]=2;r3=r1+96|0;HEAP8[r3]=HEAP8[31424];HEAP8[r3+1|0]=HEAP8[31425];HEAP8[r3+2|0]=HEAP8[31426];_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_4180(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=4933699;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_41c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=4277580;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_4200(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29616];HEAP8[r3+1|0]=HEAP8[29617];HEAP8[r3+2|0]=HEAP8[29618];HEAP8[r3+3|0]=HEAP8[29619];HEAP8[r3+4|0]=HEAP8[29620];HEAP8[r3+5|0]=HEAP8[29621];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);return}function _d_4240(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29624];HEAP8[r3+1|0]=HEAP8[29625];HEAP8[r3+2|0]=HEAP8[29626];HEAP8[r3+3|0]=HEAP8[29627];HEAP8[r3+4|0]=HEAP8[29628];HEAP8[r3+5|0]=HEAP8[29629];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_4280(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29632];HEAP8[r3+1|0]=HEAP8[29633];HEAP8[r3+2|0]=HEAP8[29634];HEAP8[r3+3|0]=HEAP8[29635];HEAP8[r3+4|0]=HEAP8[29636];HEAP8[r3+5|0]=HEAP8[29637];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);return}function _d_42c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29936];HEAP8[r3+1|0]=HEAP8[29937];HEAP8[r3+2|0]=HEAP8[29938];HEAP8[r3+3|0]=HEAP8[29939];HEAP8[r3+4|0]=HEAP8[29940];HEAP8[r3+5|0]=HEAP8[29941];HEAP8[r3+6|0]=HEAP8[29942];HEAP32[r1+28>>2]=2;r3=r1+96|0;tempBigInt=5391171;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|64;return}function _d_4400(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29680];HEAP8[r3+1|0]=HEAP8[29681];HEAP8[r3+2|0]=HEAP8[29682];HEAP8[r3+3|0]=HEAP8[29683];HEAP8[r3+4|0]=HEAP8[29684];HEAP8[r3+5|0]=HEAP8[29685];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);return}function _d_4440(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29688];HEAP8[r3+1|0]=HEAP8[29689];HEAP8[r3+2|0]=HEAP8[29690];HEAP8[r3+3|0]=HEAP8[29691];HEAP8[r3+4|0]=HEAP8[29692];HEAP8[r3+5|0]=HEAP8[29693];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_4480(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29712];HEAP8[r3+1|0]=HEAP8[29713];HEAP8[r3+2|0]=HEAP8[29714];HEAP8[r3+3|0]=HEAP8[29715];HEAP8[r3+4|0]=HEAP8[29716];HEAP8[r3+5|0]=HEAP8[29717];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);return}function _d_44c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29936];HEAP8[r3+1|0]=HEAP8[29937];HEAP8[r3+2|0]=HEAP8[29938];HEAP8[r3+3|0]=HEAP8[29939];HEAP8[r3+4|0]=HEAP8[29940];HEAP8[r3+5|0]=HEAP8[29941];HEAP8[r3+6|0]=HEAP8[29942];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r2=r1+160|0;tempBigInt=5391171;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _d_4600(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29864];HEAP8[r3+1|0]=HEAP8[29865];HEAP8[r3+2|0]=HEAP8[29866];HEAP8[r3+3|0]=HEAP8[29867];HEAP8[r3+4|0]=HEAP8[29868];HEAP8[r3+5|0]=HEAP8[29869];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);return}function _d_4640(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29872];HEAP8[r3+1|0]=HEAP8[29873];HEAP8[r3+2|0]=HEAP8[29874];HEAP8[r3+3|0]=HEAP8[29875];HEAP8[r3+4|0]=HEAP8[29876];HEAP8[r3+5|0]=HEAP8[29877];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_4680(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29904];HEAP8[r3+1|0]=HEAP8[29905];HEAP8[r3+2|0]=HEAP8[29906];HEAP8[r3+3|0]=HEAP8[29907];HEAP8[r3+4|0]=HEAP8[29908];HEAP8[r3+5|0]=HEAP8[29909];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);return}function _d_46c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29936];HEAP8[r3+1|0]=HEAP8[29937];HEAP8[r3+2|0]=HEAP8[29938];HEAP8[r3+3|0]=HEAP8[29939];HEAP8[r3+4|0]=HEAP8[29940];HEAP8[r3+5|0]=HEAP8[29941];HEAP8[r3+6|0]=HEAP8[29942];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r2=r1+160|0;HEAP8[r2]=HEAP8[31424];HEAP8[r2+1|0]=HEAP8[31425];HEAP8[r2+2|0]=HEAP8[31426];r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;return}function _d_4800(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[29984];HEAP8[r3+1|0]=HEAP8[29985];HEAP8[r3+2|0]=HEAP8[29986];HEAP8[r3+3|0]=HEAP8[29987];HEAP8[r3+4|0]=HEAP8[29988];HEAP8[r3+5|0]=HEAP8[29989];HEAP8[r3+6|0]=HEAP8[29990];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|32;return}function _d_4840(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=HEAP16[r1+12>>1];r6=r1+32|0;if((r5&56)==0){HEAP8[r6]=HEAP8[30032];HEAP8[r6+1|0]=HEAP8[30033];HEAP8[r6+2|0]=HEAP8[30034];HEAP8[r6+3|0]=HEAP8[30035];HEAP8[r6+4|0]=HEAP8[30036];HEAP32[r1+28>>2]=1;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{r3=r6;tempBigInt=4277584;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_4880(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=HEAPU16[r1+12>>1];r6=r5>>>3&7;if((r6|0)==0){r7=r1+32|0;HEAP8[r7]=HEAP8[30080];HEAP8[r7+1|0]=HEAP8[30081];HEAP8[r7+2|0]=HEAP8[30082];HEAP8[r7+3|0]=HEAP8[30083];HEAP8[r7+4|0]=HEAP8[30084];HEAP8[r7+5|0]=HEAP8[30085];HEAP32[r1+28>>2]=1;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&7,r3));STACKTOP=r3;STACKTOP=r4;return}else if((r6|0)==4){r6=r1+32|0;r3=r6|0;tempBigInt=1163284301;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r6+4|0;tempBigInt=5713485;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+96|0,r2,25,16);_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}else{r3=r1+32|0;r6=r3|0;tempBigInt=1163284301;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;r6=r3+4|0;tempBigInt=5713485;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+96|0,r2,24,16);_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_48c0(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=HEAPU16[r1+12>>1];r6=r5>>>3&7;if((r6|0)==0){r7=r1+32|0;HEAP8[r7]=HEAP8[30144];HEAP8[r7+1|0]=HEAP8[30145];HEAP8[r7+2|0]=HEAP8[30146];HEAP8[r7+3|0]=HEAP8[30147];HEAP8[r7+4|0]=HEAP8[30148];HEAP8[r7+5|0]=HEAP8[30149];HEAP32[r1+28>>2]=1;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&7,r3));STACKTOP=r3;STACKTOP=r4;return}else if((r6|0)==4){r6=r1+32|0;r3=r6|0;tempBigInt=1163284301;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r6+4|0;tempBigInt=4992589;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+96|0,r2,25,32);_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}else{r3=r1+32|0;r6=r3|0;tempBigInt=1163284301;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;r6=r3+4|0;tempBigInt=4992589;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+96|0,r2,24,32);_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_49c0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=HEAP16[r1+12>>1];r6=r1+32|0;if((r5&56)==0){HEAP8[r6]=HEAP8[30264];HEAP8[r6+1|0]=HEAP8[30265];HEAP8[r6+2|0]=HEAP8[30266];HEAP8[r6+3|0]=HEAP8[30267];HEAP8[r6+4|0]=HEAP8[30268];HEAP8[r6+5|0]=HEAP8[30269];HEAP8[r6+6|0]=HEAP8[30270];HEAP32[r1+28>>2]=1;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|128;STACKTOP=r4;return}else{r5=r6;tempBigInt=4277580;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}}function _d_4a00(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[30472];HEAP8[r3+1|0]=HEAP8[30473];HEAP8[r3+2|0]=HEAP8[30474];HEAP8[r3+3|0]=HEAP8[30475];HEAP8[r3+4|0]=HEAP8[30476];HEAP8[r3+5|0]=HEAP8[30477];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);return}function _d_4a40(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[30592];HEAP8[r3+1|0]=HEAP8[30593];HEAP8[r3+2|0]=HEAP8[30594];HEAP8[r3+3|0]=HEAP8[30595];HEAP8[r3+4|0]=HEAP8[30596];HEAP8[r3+5|0]=HEAP8[30597];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_4a80(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[30608];HEAP8[r3+1|0]=HEAP8[30609];HEAP8[r3+2|0]=HEAP8[30610];HEAP8[r3+3|0]=HEAP8[30611];HEAP8[r3+4|0]=HEAP8[30612];HEAP8[r3+5|0]=HEAP8[30613];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);return}function _d_4ac0(r1,r2){var r3,r4,r5;r3=r1+32|0;if((HEAP16[r1+12>>1]|0)==19196){r4=r3;r5=r4|0;tempBigInt=1162628169;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r4+4|0;tempBigInt=4997447;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=0;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|4;return}else{r5=r3;tempBigInt=5456212;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);return}}function _d_4c00(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=r6<<1;r8=HEAPU8[r2+r7|0]<<8;r9=r8|HEAPU8[r2+(r7|1)|0];HEAP32[r5>>2]=r6+1;r6=r1+14|0;HEAP16[r6>>1]=r9;r9=r1+32|0;HEAP8[r9]=HEAP8[30632];HEAP8[r9+1|0]=HEAP8[30633];HEAP8[r9+2|0]=HEAP8[30634];HEAP8[r9+3|0]=HEAP8[30635];HEAP8[r9+4|0]=HEAP8[30636];HEAP8[r9+5|0]=HEAP8[30637];HEAP8[r9+6|0]=HEAP8[30638];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);r2=r1+160|0;r9=HEAPU16[r6>>1];if((r8&1024)==0){_sprintf(r2,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r9>>>12&7,r3));STACKTOP=r3;r10=r1|0;r11=HEAP32[r10>>2];r12=r11|128;HEAP32[r10>>2]=r12;STACKTOP=r4;return}else{_sprintf(r2,30656,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r9&7,HEAP32[r3+8>>2]=r9>>>12&7,r3));STACKTOP=r3;r10=r1|0;r11=HEAP32[r10>>2];r12=r11|128;HEAP32[r10>>2]=r12;STACKTOP=r4;return}}function _d_4c40(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=0;r4=STACKTOP;r5=r1+8|0;r6=HEAP32[r5>>2];r7=r6<<1;r8=HEAPU8[r2+r7|0]<<8;r9=r8|HEAPU8[r2+(r7|1)|0];HEAP32[r5>>2]=r6+1;r6=r1+14|0;HEAP16[r6>>1]=r9;r9=r1+32|0;if((r8&1024)==0){HEAP8[r9]=HEAP8[30640];HEAP8[r9+1|0]=HEAP8[30641];HEAP8[r9+2|0]=HEAP8[30642];HEAP8[r9+3|0]=HEAP8[30643];HEAP8[r9+4|0]=HEAP8[30644];HEAP8[r9+5|0]=HEAP8[30645];HEAP8[r9+6|0]=HEAP8[30646];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);r8=HEAPU16[r6>>1];_sprintf(r1+160|0,30656,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r8&7,HEAP32[r3+8>>2]=r8>>>12&7,r3));STACKTOP=r3;r10=r1|0;r11=HEAP32[r10>>2];r12=r11|128;HEAP32[r10>>2]=r12;STACKTOP=r4;return}else{r8=r9;r9=r8|0;tempBigInt=1431718212;HEAP8[r9]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r9+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r9+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r9+3|0]=tempBigInt;r9=r8+4|0;tempBigInt=4992588;HEAP8[r9]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r9+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r9+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r9+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);r2=HEAPU16[r6>>1];_sprintf(r1+160|0,30656,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r2&7,HEAP32[r3+8>>2]=r2>>>12&7,r3));STACKTOP=r3;r10=r1|0;r11=HEAP32[r10>>2];r12=r11|128;HEAP32[r10>>2]=r12;STACKTOP=r4;return}}function _d_4c80(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;if((HEAP16[r1+12>>1]&56)==0){HEAP8[r5]=HEAP8[22912];HEAP8[r5+1|0]=HEAP8[22913];HEAP8[r5+2|0]=HEAP8[22914];HEAP32[r1+28>>2]=1;r6=(HEAPU8[r2]<<8|HEAPU8[r2+1|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;STACKTOP=r4;return}else{r3=r5;r5=r3|0;tempBigInt=1163284301;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r3+4|0;tempBigInt=5713485;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+160|0,r2,24,16);_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_4cc0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;if((HEAP16[r1+12>>1]&56)==0){HEAP8[r5]=HEAP8[22912];HEAP8[r5+1|0]=HEAP8[22913];HEAP8[r5+2|0]=HEAP8[22914];HEAP32[r1+28>>2]=1;r6=(HEAPU8[r2]<<8|HEAPU8[r2+1|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;STACKTOP=r4;return}else{r3=r5;r5=r3|0;tempBigInt=1163284301;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r3+4|0;tempBigInt=4992589;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+160|0,r2,24,32);_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_4e40(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;switch(r7<<16>>16){case 20082:{r9=r1+32|0;HEAP8[r9]=HEAP8[31160];HEAP8[r9+1|0]=HEAP8[31161];HEAP8[r9+2|0]=HEAP8[31162];HEAP8[r9+3|0]=HEAP8[31163];HEAP8[r9+4|0]=HEAP8[31164];r10=r1+28|0;HEAP32[r10>>2]=1;r11=r1+96|0;r12=r2+2|0;r13=HEAP8[r12];r14=r13&255;r15=r14<<8;r16=r2+3|0;r17=HEAP8[r16];r18=r17&255;r19=r15|r18;r20=r19&65535;r21=_sprintf(r11,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r20,r4));STACKTOP=r4;r22=r1+8|0;r23=HEAP32[r22>>2];r24=r23+1|0;HEAP32[r22>>2]=r24;r25=r1|0;r26=HEAP32[r25>>2];r27=r26|1;HEAP32[r25>>2]=r27;STACKTOP=r5;return;break};case 20086:{r28=r1+32|0;HEAP8[r28]=HEAP8[30896];HEAP8[r28+1|0]=HEAP8[30897];HEAP8[r28+2|0]=HEAP8[30898];HEAP8[r28+3|0]=HEAP8[30899];HEAP8[r28+4|0]=HEAP8[30900];HEAP8[r28+5|0]=HEAP8[30901];r29=r1+28|0;HEAP32[r29>>2]=0;r30=r1|0;r31=HEAP32[r30>>2];r32=r31|32;HEAP32[r30>>2]=r32;STACKTOP=r5;return;break};case 20083:{r33=r1+32|0;r34=r33;tempBigInt=4543570;HEAP8[r34]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r34+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r34+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r34+3|0]=tempBigInt;r35=r1+28|0;HEAP32[r35>>2]=0;r36=r1|0;r37=HEAP32[r36>>2];r38=r37|9;HEAP32[r36>>2]=r38;STACKTOP=r5;return;break};case 20085:{r39=r1+32|0;r40=r39;tempBigInt=5461074;HEAP8[r40]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r40+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r40+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r40+3|0]=tempBigInt;r41=r1+28|0;HEAP32[r41>>2]=0;r42=r1|0;r43=HEAP32[r42>>2];r44=r43|16;HEAP32[r42>>2]=r44;STACKTOP=r5;return;break};case 20087:{r45=r1+32|0;r46=r45;tempBigInt=5395538;HEAP8[r46]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r46+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r46+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r46+3|0]=tempBigInt;r47=r1+28|0;HEAP32[r47>>2]=0;STACKTOP=r5;return;break};case 20080:{r48=r1+32|0;HEAP8[r48]=HEAP8[31208];HEAP8[r48+1|0]=HEAP8[31209];HEAP8[r48+2|0]=HEAP8[31210];HEAP8[r48+3|0]=HEAP8[31211];HEAP8[r48+4|0]=HEAP8[31212];HEAP8[r48+5|0]=HEAP8[31213];r49=r1+28|0;HEAP32[r49>>2]=0;r50=r1|0;r51=HEAP32[r50>>2];r52=r51|1;HEAP32[r50>>2]=r52;STACKTOP=r5;return;break};case 20084:{r53=r1+32|0;r54=r53;tempBigInt=4478034;HEAP8[r54]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r54+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r54+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r54+3|0]=tempBigInt;r55=r1+28|0;HEAP32[r55>>2]=1;r56=r1+96|0;r57=r2+2|0;r58=HEAP8[r57];r59=r58&255;r60=r59<<8;r61=r2+3|0;r62=HEAP8[r61];r63=r62&255;r64=r60|r63;r65=r64&65535;r66=_sprintf(r56,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r65,r4));STACKTOP=r4;r67=r1+8|0;r68=HEAP32[r67>>2];r69=r68+1|0;HEAP32[r67>>2]=r69;r70=r1|0;r71=HEAP32[r70>>2];r72=r71|80;HEAP32[r70>>2]=r72;STACKTOP=r5;return;break};case 20081:{r73=r1+32|0;r74=r73;tempBigInt=5263182;HEAP8[r74]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r74+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r74+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r74+3|0]=tempBigInt;r75=r1+28|0;HEAP32[r75>>2]=0;STACKTOP=r5;return;break};case 20091:{r76=r1+8|0;r77=HEAP32[r76>>2];r78=r77+1|0;HEAP32[r76>>2]=r78;r79=r1+32|0;HEAP8[r79]=HEAP8[30888];HEAP8[r79+1|0]=HEAP8[30889];HEAP8[r79+2|0]=HEAP8[30890];HEAP8[r79+3|0]=HEAP8[30891];HEAP8[r79+4|0]=HEAP8[30892];HEAP8[r79+5|0]=HEAP8[30893];r80=r1+28|0;HEAP32[r80>>2]=2;r81=r1+96|0;r82=r2+2|0;r83=HEAP8[r82];r84=r83&255;r85=r84&128;r86=(r85|0)!=0;r87=r86?22824:21576;r88=r84>>>4;r89=r88&7;r90=_sprintf(r81,23816,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r87,HEAP32[r4+8>>2]=r89,r4));STACKTOP=r4;r91=r1+160|0;r92=HEAP8[r82];r93=r92&255;r94=r93<<8;r95=r2+3|0;r96=HEAP8[r95];r97=r96&255;r98=r94|r97;r99=r98&65535;r100=r99&4095;if((r100|0)==0){r101=r1|0;r102=HEAP32[r101>>2];r103=r102|64;HEAP32[r101>>2]=r103;r104=29448;r105=r103;r3=24}else if((r100|0)==1){r106=r1|0;r107=HEAP32[r106>>2];r108=r107|64;HEAP32[r106>>2]=r108;r104=29248;r105=r108;r3=24}else if((r100|0)==2048){r109=r1|0;r110=HEAP32[r109>>2];r111=r110|64;HEAP32[r109>>2]=r111;r104=30920;r105=r111;r3=24}else if((r100|0)==2049){r112=r1|0;r113=HEAP32[r112>>2];r114=r113|64;HEAP32[r112>>2]=r114;r104=28992;r105=r114;r3=24}else{r115=_sprintf(r91,28800,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r100,r4));STACKTOP=r4;r116=r1|0;r117=HEAP32[r116>>2];r118=r117|64;HEAP32[r116>>2]=r118;r119=r118;r120=r116}if(r3==24){r121=r104;r122=r91;r123=HEAPU8[r121]|HEAPU8[r121+1|0]<<8|HEAPU8[r121+2|0]<<16|HEAPU8[r121+3|0]<<24|0;tempBigInt=r123;HEAP8[r122]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r122+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r122+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r122+3|0]=tempBigInt;r124=r1|0;r119=r105;r120=r124}r125=r119|64;HEAP32[r120>>2]=r125;STACKTOP=r5;return;break};case 20090:{r126=r1+8|0;r127=HEAP32[r126>>2];r128=r127+1|0;HEAP32[r126>>2]=r128;r129=r1+32|0;HEAP8[r129]=HEAP8[30888];HEAP8[r129+1|0]=HEAP8[30889];HEAP8[r129+2|0]=HEAP8[30890];HEAP8[r129+3|0]=HEAP8[30891];HEAP8[r129+4|0]=HEAP8[30892];HEAP8[r129+5|0]=HEAP8[30893];r130=r1+28|0;HEAP32[r130>>2]=2;r131=r1+96|0;r132=r2+2|0;r133=HEAP8[r132];r134=r133&255;r135=r134<<8;r136=r2+3|0;r137=HEAP8[r136];r138=r137&255;r139=r135|r138;r140=r139&65535;r141=r140&4095;if((r141|0)==1){r142=r1|0;r143=HEAP32[r142>>2];r144=r143|64;HEAP32[r142>>2]=r144;r145=29248;r3=16}else if((r141|0)==2049){r146=r1|0;r147=HEAP32[r146>>2];r148=r147|64;HEAP32[r146>>2]=r148;r145=28992;r3=16}else if((r141|0)==0){r149=r1|0;r150=HEAP32[r149>>2];r151=r150|64;HEAP32[r149>>2]=r151;r145=29448;r3=16}else if((r141|0)==2048){r152=r1|0;r153=HEAP32[r152>>2];r154=r153|64;HEAP32[r152>>2]=r154;r145=30920;r3=16}else{r155=_sprintf(r131,28800,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r141,r4));STACKTOP=r4;r156=r1|0;r157=HEAP32[r156>>2];r158=r157|64;HEAP32[r156>>2]=r158;r159=r156}if(r3==16){r160=r145;r161=r131;r162=HEAPU8[r160]|HEAPU8[r160+1|0]<<8|HEAPU8[r160+2|0]<<16|HEAPU8[r160+3|0]<<24|0;tempBigInt=r162;HEAP8[r161]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r161+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r161+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r161+3|0]=tempBigInt;r163=r1|0;r159=r163}r164=r1+160|0;r165=HEAP8[r132];r166=r165&255;r167=r166&128;r168=(r167|0)!=0;r169=r168?22824:21576;r170=r166>>>4;r171=r170&7;r172=_sprintf(r164,23816,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r169,HEAP32[r4+8>>2]=r171,r4));STACKTOP=r4;r173=HEAP32[r159>>2];r174=r173|64;HEAP32[r159>>2]=r174;STACKTOP=r5;return;break};default:{r175=r8&48;r176=(r175|0)==0;if(r176){r177=r1+32|0;HEAP8[r177]=HEAP8[30872];HEAP8[r177+1|0]=HEAP8[30873];HEAP8[r177+2|0]=HEAP8[30874];HEAP8[r177+3|0]=HEAP8[30875];HEAP8[r177+4|0]=HEAP8[30876];r178=r1+28|0;HEAP32[r178>>2]=1;r179=r1+96|0;r180=r8&15;r181=_sprintf(r179,33240,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r180,r4));STACKTOP=r4;STACKTOP=r5;return}r182=r8&56;if((r182|0)==32){r183=r1+32|0;HEAP8[r183]=HEAP8[30792];HEAP8[r183+1|0]=HEAP8[30793];HEAP8[r183+2|0]=HEAP8[30794];HEAP8[r183+3|0]=HEAP8[30795];HEAP8[r183+4|0]=HEAP8[30796];r184=r1+28|0;HEAP32[r184>>2]=2;r185=r1+96|0;r186=r8&7;r187=_sprintf(r185,25280,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r186,r4));STACKTOP=r4;r188=r1+160|0;r189=r188;tempBigInt=5264213;HEAP8[r189]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r189+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r189+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r189+3|0]=tempBigInt;r190=r1|0;r191=HEAP32[r190>>2];r192=r191|1;HEAP32[r190>>2]=r192;STACKTOP=r5;return}else if((r182|0)==40){r193=r1+32|0;HEAP8[r193]=HEAP8[30792];HEAP8[r193+1|0]=HEAP8[30793];HEAP8[r193+2|0]=HEAP8[30794];HEAP8[r193+3|0]=HEAP8[30795];HEAP8[r193+4|0]=HEAP8[30796];r194=r1+28|0;HEAP32[r194>>2]=2;r195=r1+96|0;r196=r195;tempBigInt=5264213;HEAP8[r196]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r196+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r196+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r196+3|0]=tempBigInt;r197=r1+160|0;r198=r8&7;r199=_sprintf(r197,25280,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r198,r4));STACKTOP=r4;r200=r1|0;r201=HEAP32[r200>>2];r202=r201|1;HEAP32[r200>>2]=r202;STACKTOP=r5;return}else if((r182|0)==16){r203=r1+32|0;HEAP8[r203]=HEAP8[30864];HEAP8[r203+1|0]=HEAP8[30865];HEAP8[r203+2|0]=HEAP8[30866];HEAP8[r203+3|0]=HEAP8[30867];HEAP8[r203+4|0]=HEAP8[30868];r204=r1+28|0;HEAP32[r204>>2]=2;r205=r1+96|0;r206=r8&7;r207=_sprintf(r205,25280,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r206,r4));STACKTOP=r4;r208=r1+160|0;r209=r2+2|0;r210=HEAP8[r209];r211=r210&255;r212=r211<<8;r213=r2+3|0;r214=HEAP8[r213];r215=r214&255;r216=r212|r215;r217=r216&65535;r218=_sprintf(r208,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r217,r4));STACKTOP=r4;r219=r1+8|0;r220=HEAP32[r219>>2];r221=r220+1|0;HEAP32[r219>>2]=r221;STACKTOP=r5;return}else if((r182|0)==24){r222=r1+32|0;HEAP8[r222]=HEAP8[30800];HEAP8[r222+1|0]=HEAP8[30801];HEAP8[r222+2|0]=HEAP8[30802];HEAP8[r222+3|0]=HEAP8[30803];HEAP8[r222+4|0]=HEAP8[30804];r223=r1+28|0;HEAP32[r223>>2]=1;r224=r1+96|0;r225=r8&7;r226=_sprintf(r224,25280,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r225,r4));STACKTOP=r4;STACKTOP=r5;return}else{r227=r1+32|0;HEAP8[r227]=HEAP8[22912];HEAP8[r227+1|0]=HEAP8[22913];HEAP8[r227+2|0]=HEAP8[22914];r228=r1+28|0;HEAP32[r228>>2]=1;r229=r1+96|0;r230=HEAP8[r2];r231=r230&255;r232=r231<<8;r233=r2+1|0;r234=HEAP8[r233];r235=r234&255;r236=r232|r235;r237=r236&65535;r238=_sprintf(r229,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r237,r4));STACKTOP=r4;STACKTOP=r5;return}}}}function _d_4e80(r1,r2){var r3;r3=r1+32|0;tempBigInt=5395274;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,0);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|4;return}function _d_5000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[31304];HEAP8[r5+1|0]=HEAP8[31305];HEAP8[r5+2|0]=HEAP8[31306];HEAP8[r5+3|0]=HEAP8[31307];HEAP8[r5+4|0]=HEAP8[31308];HEAP8[r5+5|0]=HEAP8[31309];HEAP8[r5+6|0]=HEAP8[31310];HEAP32[r1+28>>2]=2;r5=(HEAP8[r2]&255)>>>1&7;_sprintf(r1+96|0,32432,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5<<16>>16==0?8:r5&65535,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_5040(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[31360];HEAP8[r5+1|0]=HEAP8[31361];HEAP8[r5+2|0]=HEAP8[31362];HEAP8[r5+3|0]=HEAP8[31363];HEAP8[r5+4|0]=HEAP8[31364];HEAP8[r5+5|0]=HEAP8[31365];HEAP8[r5+6|0]=HEAP8[31366];HEAP32[r1+28>>2]=2;r5=(HEAP8[r2]&255)>>>1&7;_sprintf(r1+96|0,32432,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5<<16>>16==0?8:r5&65535,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}function _d_5080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[31384];HEAP8[r5+1|0]=HEAP8[31385];HEAP8[r5+2|0]=HEAP8[31386];HEAP8[r5+3|0]=HEAP8[31387];HEAP8[r5+4|0]=HEAP8[31388];HEAP8[r5+5|0]=HEAP8[31389];HEAP8[r5+6|0]=HEAP8[31390];HEAP32[r1+28>>2]=2;r5=(HEAP8[r2]&255)>>>1&7;_sprintf(r1+96|0,32432,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5<<16>>16==0?8:r5&65535,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_50c0(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>8&15;r8=r6&63;if(r7>>>0>1){r9=r1|0;HEAP32[r9>>2]=HEAP32[r9>>2]|32}if((r8|0)==60){_strcpy(r1+32|0,HEAP32[1304+(r7<<2)>>2]);HEAP32[r1+28>>2]=0;r9=r1|0;HEAP32[r9>>2]=HEAP32[r9>>2]|128;STACKTOP=r4;return}else if((r8|0)==59){_strcpy(r1+32|0,HEAP32[1304+(r7<<2)>>2]);HEAP32[r1+28>>2]=1;r9=((HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])<<8|HEAPU8[r2+4|0])<<8|HEAPU8[r2+5|0];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r9,r3));STACKTOP=r3;r9=r1+8|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1|0;HEAP32[r9>>2]=HEAP32[r9>>2]|128;STACKTOP=r4;return}else if((r8|0)==58){_strcpy(r1+32|0,HEAP32[1304+(r7<<2)>>2]);HEAP32[r1+28>>2]=1;r8=(HEAPU8[r2+2|0]<<8|HEAPU8[r2+3|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r8,r3));STACKTOP=r3;r8=r1+8|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1;r8=r1|0;HEAP32[r8>>2]=HEAP32[r8>>2]|128;STACKTOP=r4;return}else{if((r6&56|0)==8){_strcpy(r1+32|0,HEAP32[1432+(r7<<2)>>2]);HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP16[r5>>1]&7,r3));STACKTOP=r3;r5=r1+8|0;r6=HEAP32[r5>>2];r8=r6<<1;r9=HEAPU8[r2+r8|0]<<8|HEAPU8[r2+(r8|1)|0];HEAP32[r5>>2]=r6+1;r6=r9&65535;r9=HEAP32[r1+4>>2]+2+((r6&32768|0)!=0?r6|-65536:r6)|0;_sprintf(r1+160|0,32112,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r9,r3));STACKTOP=r3;r3=r1|0;HEAP32[r3>>2]=HEAP32[r3>>2]|2;STACKTOP=r4;return}else{_strcpy(r1+32|0,HEAP32[1368+(r7<<2)>>2]);HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}}function _d_5100(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[33176];HEAP8[r5+1|0]=HEAP8[33177];HEAP8[r5+2|0]=HEAP8[33178];HEAP8[r5+3|0]=HEAP8[33179];HEAP8[r5+4|0]=HEAP8[33180];HEAP8[r5+5|0]=HEAP8[33181];HEAP8[r5+6|0]=HEAP8[33182];HEAP32[r1+28>>2]=2;r5=(HEAP8[r2]&255)>>>1&7;_sprintf(r1+96|0,32432,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5<<16>>16==0?8:r5&65535,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}function _d_5140(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[33192];HEAP8[r5+1|0]=HEAP8[33193];HEAP8[r5+2|0]=HEAP8[33194];HEAP8[r5+3|0]=HEAP8[33195];HEAP8[r5+4|0]=HEAP8[33196];HEAP8[r5+5|0]=HEAP8[33197];HEAP8[r5+6|0]=HEAP8[33198];HEAP32[r1+28>>2]=2;r5=(HEAP8[r2]&255)>>>1&7;_sprintf(r1+96|0,32432,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5<<16>>16==0?8:r5&65535,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}function _d_5180(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[33232];HEAP8[r5+1|0]=HEAP8[33233];HEAP8[r5+2|0]=HEAP8[33234];HEAP8[r5+3|0]=HEAP8[33235];HEAP8[r5+4|0]=HEAP8[33236];HEAP8[r5+5|0]=HEAP8[33237];HEAP8[r5+6|0]=HEAP8[33238];HEAP32[r1+28>>2]=2;r5=(HEAP8[r2]&255)>>>1&7;_sprintf(r1+96|0,32432,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r5<<16>>16==0?8:r5&65535,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}function _d_6000(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r3=0;r4=STACKTOP;r5=HEAPU16[r1+12>>1]>>>8&15;r6=r2+1|0;r7=HEAP8[r6];if(r7<<24>>24==0){r8=r1+32|0;_strcpy(r8,HEAP32[1496+(r5<<2)>>2]);HEAP32[r1+28>>2]=1;r9=r1+8|0;r10=HEAP32[r9>>2];r11=r10<<1;r12=HEAPU8[r2+r11|0]<<8|HEAPU8[r2+(r11|1)|0];HEAP32[r9>>2]=r10+1;r10=r12&65535;r12=HEAP32[r1+4>>2]+2+((r10&32768|0)!=0?r10|-65536:r10)|0;_sprintf(r1+96|0,32112,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r12,r3));STACKTOP=r3;r12=_strlen(r8)+(r1+32)|0;HEAP8[r12]=HEAP8[27120];HEAP8[r12+1|0]=HEAP8[27121];HEAP8[r12+2|0]=HEAP8[27122];r13=(r5|0)==1;r14=r1|0;r15=HEAP32[r14>>2];r16=r13?4:2;r17=r15|r16;r18=r5>>>0>1;r19=r17|32;r20=r18?r19:r17;HEAP32[r14>>2]=r20;STACKTOP=r4;return}r12=r1+32|0;_strcpy(r12,HEAP32[1496+(r5<<2)>>2]);HEAP32[r1+28>>2]=1;r8=r1+96|0;if(r7<<24>>24==-1){r7=r1+8|0;r10=HEAP32[r7>>2];r9=r10<<1;r11=((HEAPU8[r2+r9|0]<<8|HEAPU8[r2+(r9|1)|0])<<8|HEAPU8[r2+(r9+2)|0])<<8|HEAPU8[r2+(r9+3)|0];HEAP32[r7>>2]=r10+2;r10=HEAP32[r1+4>>2]+2+r11|0;_sprintf(r8,32112,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r10,r3));STACKTOP=r3;r10=_strlen(r12)+(r1+32)|0;HEAP8[r10]=HEAP8[27256];HEAP8[r10+1|0]=HEAP8[27257];HEAP8[r10+2|0]=HEAP8[27258];r10=r1|0;HEAP32[r10>>2]=HEAP32[r10>>2]|128;r13=(r5|0)==1;r14=r1|0;r15=HEAP32[r14>>2];r16=r13?4:2;r17=r15|r16;r18=r5>>>0>1;r19=r17|32;r20=r18?r19:r17;HEAP32[r14>>2]=r20;STACKTOP=r4;return}else{r10=HEAPU8[r6];r6=HEAP32[r1+4>>2]+2+((r10&128|0)!=0?r10|-256:r10)|0;_sprintf(r8,32112,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;r3=_strlen(r12)+(r1+32)|0;HEAP8[r3]=HEAP8[34184];HEAP8[r3+1|0]=HEAP8[34185];HEAP8[r3+2|0]=HEAP8[34186];r13=(r5|0)==1;r14=r1|0;r15=HEAP32[r14>>2];r16=r13?4:2;r17=r15|r16;r18=r5>>>0>1;r19=r17|32;r20=r18?r19:r17;HEAP32[r14>>2]=r20;STACKTOP=r4;return}}function _d_7000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[34240];HEAP8[r5+1|0]=HEAP8[34241];HEAP8[r5+2|0]=HEAP8[34242];HEAP8[r5+3|0]=HEAP8[34243];HEAP8[r5+4|0]=HEAP8[34244];HEAP8[r5+5|0]=HEAP8[34245];HEAP32[r1+28>>2]=2;r5=HEAPU16[r1+12>>1];_sprintf(r1+96|0,32776,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=(r5&128|0)!=0?r5|-256:r5&255,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_8000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[34328];HEAP8[r5+1|0]=HEAP8[34329];HEAP8[r5+2|0]=HEAP8[34330];HEAP8[r5+3|0]=HEAP8[34331];HEAP8[r5+4|0]=HEAP8[34332];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_8040(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[34536];HEAP8[r5+1|0]=HEAP8[34537];HEAP8[r5+2|0]=HEAP8[34538];HEAP8[r5+3|0]=HEAP8[34539];HEAP8[r5+4|0]=HEAP8[34540];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_8080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[34856];HEAP8[r5+1|0]=HEAP8[34857];HEAP8[r5+2|0]=HEAP8[34858];HEAP8[r5+3|0]=HEAP8[34859];HEAP8[r5+4|0]=HEAP8[34860];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_80c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[34280];HEAP8[r5+1|0]=HEAP8[34281];HEAP8[r5+2|0]=HEAP8[34282];HEAP8[r5+3|0]=HEAP8[34283];HEAP8[r5+4|0]=HEAP8[34284];HEAP8[r5+5|0]=HEAP8[34285];HEAP8[r5+6|0]=HEAP8[34286];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_8100(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==0){r8=r1+32|0;HEAP8[r8]=HEAP8[34352];HEAP8[r8+1|0]=HEAP8[34353];HEAP8[r8+2|0]=HEAP8[34354];HEAP8[r8+3|0]=HEAP8[34355];HEAP8[r8+4|0]=HEAP8[34356];HEAP8[r8+5|0]=HEAP8[34357];HEAP8[r8+6|0]=HEAP8[34358];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r8=r1|0;HEAP32[r8>>2]=HEAP32[r8>>2]|32;STACKTOP=r4;return}else if((r7|0)==1){r7=r1+32|0;HEAP8[r7]=HEAP8[34352];HEAP8[r7+1|0]=HEAP8[34353];HEAP8[r7+2|0]=HEAP8[34354];HEAP8[r7+3|0]=HEAP8[34355];HEAP8[r7+4|0]=HEAP8[34356];HEAP8[r7+5|0]=HEAP8[34357];HEAP8[r7+6|0]=HEAP8[34358];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else{r5=r1+32|0;HEAP8[r5]=HEAP8[34328];HEAP8[r5+1|0]=HEAP8[34329];HEAP8[r5+2|0]=HEAP8[34330];HEAP8[r5+3|0]=HEAP8[34331];HEAP8[r5+4|0]=HEAP8[34332];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_8140(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;if((HEAP16[r1+12>>1]&48)>>>0<16){HEAP8[r5]=HEAP8[22912];HEAP8[r5+1|0]=HEAP8[22913];HEAP8[r5+2|0]=HEAP8[22914];HEAP32[r1+28>>2]=1;r6=(HEAPU8[r2]<<8|HEAPU8[r2+1|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r5]=HEAP8[34536];HEAP8[r5+1|0]=HEAP8[34537];HEAP8[r5+2|0]=HEAP8[34538];HEAP8[r5+3|0]=HEAP8[34539];HEAP8[r5+4|0]=HEAP8[34540];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_8180(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;if((HEAP16[r1+12>>1]&48)>>>0<16){HEAP8[r5]=HEAP8[22912];HEAP8[r5+1|0]=HEAP8[22913];HEAP8[r5+2|0]=HEAP8[22914];HEAP32[r1+28>>2]=1;r6=(HEAPU8[r2]<<8|HEAPU8[r2+1|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r5]=HEAP8[34856];HEAP8[r5+1|0]=HEAP8[34857];HEAP8[r5+2|0]=HEAP8[34858];HEAP8[r5+3|0]=HEAP8[34859];HEAP8[r5+4|0]=HEAP8[34860];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_81c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[34992];HEAP8[r5+1|0]=HEAP8[34993];HEAP8[r5+2|0]=HEAP8[34994];HEAP8[r5+3|0]=HEAP8[34995];HEAP8[r5+4|0]=HEAP8[34996];HEAP8[r5+5|0]=HEAP8[34997];HEAP8[r5+6|0]=HEAP8[34998];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_9000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35080];HEAP8[r5+1|0]=HEAP8[35081];HEAP8[r5+2|0]=HEAP8[35082];HEAP8[r5+3|0]=HEAP8[35083];HEAP8[r5+4|0]=HEAP8[35084];HEAP8[r5+5|0]=HEAP8[35085];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_9040(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35320];HEAP8[r5+1|0]=HEAP8[35321];HEAP8[r5+2|0]=HEAP8[35322];HEAP8[r5+3|0]=HEAP8[35323];HEAP8[r5+4|0]=HEAP8[35324];HEAP8[r5+5|0]=HEAP8[35325];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_9080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35368];HEAP8[r5+1|0]=HEAP8[35369];HEAP8[r5+2|0]=HEAP8[35370];HEAP8[r5+3|0]=HEAP8[35371];HEAP8[r5+4|0]=HEAP8[35372];HEAP8[r5+5|0]=HEAP8[35373];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_90c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35040];HEAP8[r5+1|0]=HEAP8[35041];HEAP8[r5+2|0]=HEAP8[35042];HEAP8[r5+3|0]=HEAP8[35043];HEAP8[r5+4|0]=HEAP8[35044];HEAP8[r5+5|0]=HEAP8[35045];HEAP8[r5+6|0]=HEAP8[35046];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_9100(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==1){r8=r1+32|0;HEAP8[r8]=HEAP8[35208];HEAP8[r8+1|0]=HEAP8[35209];HEAP8[r8+2|0]=HEAP8[35210];HEAP8[r8+3|0]=HEAP8[35211];HEAP8[r8+4|0]=HEAP8[35212];HEAP8[r8+5|0]=HEAP8[35213];HEAP8[r8+6|0]=HEAP8[35214];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else if((r7|0)==0){r7=r1+32|0;HEAP8[r7]=HEAP8[35208];HEAP8[r7+1|0]=HEAP8[35209];HEAP8[r7+2|0]=HEAP8[35210];HEAP8[r7+3|0]=HEAP8[35211];HEAP8[r7+4|0]=HEAP8[35212];HEAP8[r7+5|0]=HEAP8[35213];HEAP8[r7+6|0]=HEAP8[35214];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r6=r1|0;HEAP32[r6>>2]=HEAP32[r6>>2]|32;STACKTOP=r4;return}else{r6=r1+32|0;HEAP8[r6]=HEAP8[35080];HEAP8[r6+1|0]=HEAP8[35081];HEAP8[r6+2|0]=HEAP8[35082];HEAP8[r6+3|0]=HEAP8[35083];HEAP8[r6+4|0]=HEAP8[35084];HEAP8[r6+5|0]=HEAP8[35085];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_9140(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==1){r8=r1+32|0;HEAP8[r8]=HEAP8[35336];HEAP8[r8+1|0]=HEAP8[35337];HEAP8[r8+2|0]=HEAP8[35338];HEAP8[r8+3|0]=HEAP8[35339];HEAP8[r8+4|0]=HEAP8[35340];HEAP8[r8+5|0]=HEAP8[35341];HEAP8[r8+6|0]=HEAP8[35342];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else if((r7|0)==0){r7=r1+32|0;HEAP8[r7]=HEAP8[35336];HEAP8[r7+1|0]=HEAP8[35337];HEAP8[r7+2|0]=HEAP8[35338];HEAP8[r7+3|0]=HEAP8[35339];HEAP8[r7+4|0]=HEAP8[35340];HEAP8[r7+5|0]=HEAP8[35341];HEAP8[r7+6|0]=HEAP8[35342];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r6=r1|0;HEAP32[r6>>2]=HEAP32[r6>>2]|32;STACKTOP=r4;return}else{r6=r1+32|0;HEAP8[r6]=HEAP8[35320];HEAP8[r6+1|0]=HEAP8[35321];HEAP8[r6+2|0]=HEAP8[35322];HEAP8[r6+3|0]=HEAP8[35323];HEAP8[r6+4|0]=HEAP8[35324];HEAP8[r6+5|0]=HEAP8[35325];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_9180(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==0){r8=r1+32|0;HEAP8[r8]=HEAP8[35400];HEAP8[r8+1|0]=HEAP8[35401];HEAP8[r8+2|0]=HEAP8[35402];HEAP8[r8+3|0]=HEAP8[35403];HEAP8[r8+4|0]=HEAP8[35404];HEAP8[r8+5|0]=HEAP8[35405];HEAP8[r8+6|0]=HEAP8[35406];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r8=r1|0;HEAP32[r8>>2]=HEAP32[r8>>2]|32;STACKTOP=r4;return}else if((r7|0)==1){r7=r1+32|0;HEAP8[r7]=HEAP8[35400];HEAP8[r7+1|0]=HEAP8[35401];HEAP8[r7+2|0]=HEAP8[35402];HEAP8[r7+3|0]=HEAP8[35403];HEAP8[r7+4|0]=HEAP8[35404];HEAP8[r7+5|0]=HEAP8[35405];HEAP8[r7+6|0]=HEAP8[35406];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else{r5=r1+32|0;HEAP8[r5]=HEAP8[35368];HEAP8[r5+1|0]=HEAP8[35369];HEAP8[r5+2|0]=HEAP8[35370];HEAP8[r5+3|0]=HEAP8[35371];HEAP8[r5+4|0]=HEAP8[35372];HEAP8[r5+5|0]=HEAP8[35373];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_91c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35488];HEAP8[r5+1|0]=HEAP8[35489];HEAP8[r5+2|0]=HEAP8[35490];HEAP8[r5+3|0]=HEAP8[35491];HEAP8[r5+4|0]=HEAP8[35492];HEAP8[r5+5|0]=HEAP8[35493];HEAP8[r5+6|0]=HEAP8[35494];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_a000(r1,r2){var r3,r4;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3|0;_sprintf(r4,27136,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAPU16[r1+12>>1],r2));STACKTOP=r2;_strcpy(r1+32|0,r4);HEAP32[r1+28>>2]=0;r4=r1|0;HEAP32[r4>>2]=HEAP32[r4>>2]|4;STACKTOP=r3;return}function _d_b000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35672];HEAP8[r5+1|0]=HEAP8[35673];HEAP8[r5+2|0]=HEAP8[35674];HEAP8[r5+3|0]=HEAP8[35675];HEAP8[r5+4|0]=HEAP8[35676];HEAP8[r5+5|0]=HEAP8[35677];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_b040(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[35696];HEAP8[r5+1|0]=HEAP8[35697];HEAP8[r5+2|0]=HEAP8[35698];HEAP8[r5+3|0]=HEAP8[35699];HEAP8[r5+4|0]=HEAP8[35700];HEAP8[r5+5|0]=HEAP8[35701];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_b080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19208];HEAP8[r5+1|0]=HEAP8[19209];HEAP8[r5+2|0]=HEAP8[19210];HEAP8[r5+3|0]=HEAP8[19211];HEAP8[r5+4|0]=HEAP8[19212];HEAP8[r5+5|0]=HEAP8[19213];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_b0c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19256];HEAP8[r5+1|0]=HEAP8[19257];HEAP8[r5+2|0]=HEAP8[19258];HEAP8[r5+3|0]=HEAP8[19259];HEAP8[r5+4|0]=HEAP8[19260];HEAP8[r5+5|0]=HEAP8[19261];HEAP8[r5+6|0]=HEAP8[19262];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_b100(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAP16[r5>>1];r7=r1+32|0;if((r6&56)==8){HEAP8[r7]=HEAP8[19344];HEAP8[r7+1|0]=HEAP8[19345];HEAP8[r7+2|0]=HEAP8[19346];HEAP8[r7+3|0]=HEAP8[19347];HEAP8[r7+4|0]=HEAP8[19348];HEAP8[r7+5|0]=HEAP8[19349];HEAP8[r7+6|0]=HEAP8[19350];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,20648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,20648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r7]=HEAP8[19264];HEAP8[r7+1|0]=HEAP8[19265];HEAP8[r7+2|0]=HEAP8[19266];HEAP8[r7+3|0]=HEAP8[19267];HEAP8[r7+4|0]=HEAP8[19268];HEAP8[r7+5|0]=HEAP8[19269];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_b140(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAP16[r5>>1];r7=r1+32|0;if((r6&56)==8){HEAP8[r7]=HEAP8[19440];HEAP8[r7+1|0]=HEAP8[19441];HEAP8[r7+2|0]=HEAP8[19442];HEAP8[r7+3|0]=HEAP8[19443];HEAP8[r7+4|0]=HEAP8[19444];HEAP8[r7+5|0]=HEAP8[19445];HEAP8[r7+6|0]=HEAP8[19446];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,20648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,20648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r7]=HEAP8[19392];HEAP8[r7+1|0]=HEAP8[19393];HEAP8[r7+2|0]=HEAP8[19394];HEAP8[r7+3|0]=HEAP8[19395];HEAP8[r7+4|0]=HEAP8[19396];HEAP8[r7+5|0]=HEAP8[19397];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_b180(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAP16[r5>>1];r7=r1+32|0;if((r6&56)==8){HEAP8[r7]=HEAP8[19496];HEAP8[r7+1|0]=HEAP8[19497];HEAP8[r7+2|0]=HEAP8[19498];HEAP8[r7+3|0]=HEAP8[19499];HEAP8[r7+4|0]=HEAP8[19500];HEAP8[r7+5|0]=HEAP8[19501];HEAP8[r7+6|0]=HEAP8[19502];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,20648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,20648,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP8[r7]=HEAP8[19464];HEAP8[r7+1|0]=HEAP8[19465];HEAP8[r7+2|0]=HEAP8[19466];HEAP8[r7+3|0]=HEAP8[19467];HEAP8[r7+4|0]=HEAP8[19468];HEAP8[r7+5|0]=HEAP8[19469];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_b1c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19744];HEAP8[r5+1|0]=HEAP8[19745];HEAP8[r5+2|0]=HEAP8[19746];HEAP8[r5+3|0]=HEAP8[19747];HEAP8[r5+4|0]=HEAP8[19748];HEAP8[r5+5|0]=HEAP8[19749];HEAP8[r5+6|0]=HEAP8[19750];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_c000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19800];HEAP8[r5+1|0]=HEAP8[19801];HEAP8[r5+2|0]=HEAP8[19802];HEAP8[r5+3|0]=HEAP8[19803];HEAP8[r5+4|0]=HEAP8[19804];HEAP8[r5+5|0]=HEAP8[19805];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_c040(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19864];HEAP8[r5+1|0]=HEAP8[19865];HEAP8[r5+2|0]=HEAP8[19866];HEAP8[r5+3|0]=HEAP8[19867];HEAP8[r5+4|0]=HEAP8[19868];HEAP8[r5+5|0]=HEAP8[19869];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_c080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19952];HEAP8[r5+1|0]=HEAP8[19953];HEAP8[r5+2|0]=HEAP8[19954];HEAP8[r5+3|0]=HEAP8[19955];HEAP8[r5+4|0]=HEAP8[19956];HEAP8[r5+5|0]=HEAP8[19957];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_c0c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[19768];HEAP8[r5+1|0]=HEAP8[19769];HEAP8[r5+2|0]=HEAP8[19770];HEAP8[r5+3|0]=HEAP8[19771];HEAP8[r5+4|0]=HEAP8[19772];HEAP8[r5+5|0]=HEAP8[19773];HEAP8[r5+6|0]=HEAP8[19774];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_c100(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==0){r8=r1+32|0;HEAP8[r8]=HEAP8[19840];HEAP8[r8+1|0]=HEAP8[19841];HEAP8[r8+2|0]=HEAP8[19842];HEAP8[r8+3|0]=HEAP8[19843];HEAP8[r8+4|0]=HEAP8[19844];HEAP8[r8+5|0]=HEAP8[19845];HEAP8[r8+6|0]=HEAP8[19846];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r8=r1|0;HEAP32[r8>>2]=HEAP32[r8>>2]|32;STACKTOP=r4;return}else if((r7|0)==1){r7=r1+32|0;HEAP8[r7]=HEAP8[19840];HEAP8[r7+1|0]=HEAP8[19841];HEAP8[r7+2|0]=HEAP8[19842];HEAP8[r7+3|0]=HEAP8[19843];HEAP8[r7+4|0]=HEAP8[19844];HEAP8[r7+5|0]=HEAP8[19845];HEAP8[r7+6|0]=HEAP8[19846];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else{r5=r1+32|0;HEAP8[r5]=HEAP8[19800];HEAP8[r5+1|0]=HEAP8[19801];HEAP8[r5+2|0]=HEAP8[19802];HEAP8[r5+3|0]=HEAP8[19803];HEAP8[r5+4|0]=HEAP8[19804];HEAP8[r5+5|0]=HEAP8[19805];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_c140(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1]>>>3&7;if((r6|0)==1){r7=r1+32|0;tempBigInt=4675653;HEAP8[r7]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP16[r5>>1]&7,r3));STACKTOP=r3;STACKTOP=r4;return}else if((r6|0)==0){r6=r1+32|0;tempBigInt=4675653;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP16[r5>>1]&7,r3));STACKTOP=r3;STACKTOP=r4;return}else{r5=r1+32|0;HEAP8[r5]=HEAP8[19864];HEAP8[r5+1|0]=HEAP8[19865];HEAP8[r5+2|0]=HEAP8[19866];HEAP8[r5+3|0]=HEAP8[19867];HEAP8[r5+4|0]=HEAP8[19868];HEAP8[r5+5|0]=HEAP8[19869];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_c180(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1]>>>3&7;if((r6|0)==1){r7=r1+32|0;tempBigInt=4675653;HEAP8[r7]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+3|0]=tempBigInt;HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAP16[r5>>1]&7,r3));STACKTOP=r3;STACKTOP=r4;return}else if((r6|0)==0){r6=r1+32|0;HEAP8[r6]=HEAP8[22912];HEAP8[r6+1|0]=HEAP8[22913];HEAP8[r6+2|0]=HEAP8[22914];HEAP32[r1+28>>2]=1;r6=(HEAPU8[r2]<<8|HEAPU8[r2+1|0])&65535;_sprintf(r1+96|0,29456,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=25192,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;STACKTOP=r4;return}else{r6=r1+32|0;HEAP8[r6]=HEAP8[19952];HEAP8[r6+1|0]=HEAP8[19953];HEAP8[r6+2|0]=HEAP8[19954];HEAP8[r6+3|0]=HEAP8[19955];HEAP8[r6+4|0]=HEAP8[19956];HEAP8[r6+5|0]=HEAP8[19957];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_c1c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[20600];HEAP8[r5+1|0]=HEAP8[20601];HEAP8[r5+2|0]=HEAP8[20602];HEAP8[r5+3|0]=HEAP8[20603];HEAP8[r5+4|0]=HEAP8[20604];HEAP8[r5+5|0]=HEAP8[20605];HEAP8[r5+6|0]=HEAP8[20606];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_d000(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[20688];HEAP8[r5+1|0]=HEAP8[20689];HEAP8[r5+2|0]=HEAP8[20690];HEAP8[r5+3|0]=HEAP8[20691];HEAP8[r5+4|0]=HEAP8[20692];HEAP8[r5+5|0]=HEAP8[20693];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_d040(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[21016];HEAP8[r5+1|0]=HEAP8[21017];HEAP8[r5+2|0]=HEAP8[21018];HEAP8[r5+3|0]=HEAP8[21019];HEAP8[r5+4|0]=HEAP8[21020];HEAP8[r5+5|0]=HEAP8[21021];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_d080(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[21144];HEAP8[r5+1|0]=HEAP8[21145];HEAP8[r5+2|0]=HEAP8[21146];HEAP8[r5+3|0]=HEAP8[21147];HEAP8[r5+4|0]=HEAP8[21148];HEAP8[r5+5|0]=HEAP8[21149];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_d0c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[20640];HEAP8[r5+1|0]=HEAP8[20641];HEAP8[r5+2|0]=HEAP8[20642];HEAP8[r5+3|0]=HEAP8[20643];HEAP8[r5+4|0]=HEAP8[20644];HEAP8[r5+5|0]=HEAP8[20645];HEAP8[r5+6|0]=HEAP8[20646];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_d100(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==0){r8=r1+32|0;HEAP8[r8]=HEAP8[20832];HEAP8[r8+1|0]=HEAP8[20833];HEAP8[r8+2|0]=HEAP8[20834];HEAP8[r8+3|0]=HEAP8[20835];HEAP8[r8+4|0]=HEAP8[20836];HEAP8[r8+5|0]=HEAP8[20837];HEAP8[r8+6|0]=HEAP8[20838];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r8=r1|0;HEAP32[r8>>2]=HEAP32[r8>>2]|32;STACKTOP=r4;return}else if((r7|0)==1){r7=r1+32|0;HEAP8[r7]=HEAP8[20832];HEAP8[r7+1|0]=HEAP8[20833];HEAP8[r7+2|0]=HEAP8[20834];HEAP8[r7+3|0]=HEAP8[20835];HEAP8[r7+4|0]=HEAP8[20836];HEAP8[r7+5|0]=HEAP8[20837];HEAP8[r7+6|0]=HEAP8[20838];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else{r5=r1+32|0;HEAP8[r5]=HEAP8[20688];HEAP8[r5+1|0]=HEAP8[20689];HEAP8[r5+2|0]=HEAP8[20690];HEAP8[r5+3|0]=HEAP8[20691];HEAP8[r5+4|0]=HEAP8[20692];HEAP8[r5+5|0]=HEAP8[20693];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,8);STACKTOP=r4;return}}function _d_d140(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==1){r8=r1+32|0;HEAP8[r8]=HEAP8[21096];HEAP8[r8+1|0]=HEAP8[21097];HEAP8[r8+2|0]=HEAP8[21098];HEAP8[r8+3|0]=HEAP8[21099];HEAP8[r8+4|0]=HEAP8[21100];HEAP8[r8+5|0]=HEAP8[21101];HEAP8[r8+6|0]=HEAP8[21102];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else if((r7|0)==0){r7=r1+32|0;HEAP8[r7]=HEAP8[21096];HEAP8[r7+1|0]=HEAP8[21097];HEAP8[r7+2|0]=HEAP8[21098];HEAP8[r7+3|0]=HEAP8[21099];HEAP8[r7+4|0]=HEAP8[21100];HEAP8[r7+5|0]=HEAP8[21101];HEAP8[r7+6|0]=HEAP8[21102];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r6=r1|0;HEAP32[r6>>2]=HEAP32[r6>>2]|32;STACKTOP=r4;return}else{r6=r1+32|0;HEAP8[r6]=HEAP8[21016];HEAP8[r6+1|0]=HEAP8[21017];HEAP8[r6+2|0]=HEAP8[21018];HEAP8[r6+3|0]=HEAP8[21019];HEAP8[r6+4|0]=HEAP8[21020];HEAP8[r6+5|0]=HEAP8[21021];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,16);STACKTOP=r4;return}}function _d_d180(r1,r2){var r3,r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAPU16[r5>>1];r7=r6>>>3&7;if((r7|0)==1){r8=r1+32|0;HEAP8[r8]=HEAP8[21208];HEAP8[r8+1|0]=HEAP8[21209];HEAP8[r8+2|0]=HEAP8[21210];HEAP8[r8+3|0]=HEAP8[21211];HEAP8[r8+4|0]=HEAP8[21212];HEAP8[r8+5|0]=HEAP8[21213];HEAP8[r8+6|0]=HEAP8[21214];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,19448,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r5>>1]>>>9&7,r3));STACKTOP=r3;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|32;STACKTOP=r4;return}else if((r7|0)==0){r7=r1+32|0;HEAP8[r7]=HEAP8[21208];HEAP8[r7+1|0]=HEAP8[21209];HEAP8[r7+2|0]=HEAP8[21210];HEAP8[r7+3|0]=HEAP8[21211];HEAP8[r7+4|0]=HEAP8[21212];HEAP8[r7+5|0]=HEAP8[21213];HEAP8[r7+6|0]=HEAP8[21214];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&7,r3));STACKTOP=r3;_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;r6=r1|0;HEAP32[r6>>2]=HEAP32[r6>>2]|32;STACKTOP=r4;return}else{r6=r1+32|0;HEAP8[r6]=HEAP8[21144];HEAP8[r6+1|0]=HEAP8[21145];HEAP8[r6+2|0]=HEAP8[21146];HEAP8[r6+3|0]=HEAP8[21147];HEAP8[r6+4|0]=HEAP8[21148];HEAP8[r6+5|0]=HEAP8[21149];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;_dasm_ea(r1,r1+160|0,r2,HEAP8[r2+1|0]&63,32);STACKTOP=r4;return}}function _d_d1c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[21328];HEAP8[r5+1|0]=HEAP8[21329];HEAP8[r5+2|0]=HEAP8[21330];HEAP8[r5+3|0]=HEAP8[21331];HEAP8[r5+4|0]=HEAP8[21332];HEAP8[r5+5|0]=HEAP8[21333];HEAP8[r5+6|0]=HEAP8[21334];HEAP32[r1+28>>2]=2;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,32);_sprintf(r1+160|0,25280,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2]>>>1&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_e000(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8>>>3;r10=r9&7;switch(r10|0){case 1:{r11=r1+32|0;HEAP8[r11]=HEAP8[21568];HEAP8[r11+1|0]=HEAP8[21569];HEAP8[r11+2|0]=HEAP8[21570];HEAP8[r11+3|0]=HEAP8[21571];HEAP8[r11+4|0]=HEAP8[21572];HEAP8[r11+5|0]=HEAP8[21573];r12=r1+28|0;HEAP32[r12>>2]=2;r13=r1+96|0;r14=HEAP8[r2];r15=r14&255;r16=(r15&65535)>>>1;r17=r16&7;r18=r17<<16>>16==0;r19=r17&65535;r20=r18?8:r19;r21=_sprintf(r13,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r20,r4));STACKTOP=r4;r22=r1+160|0;r23=HEAP16[r6>>1];r24=r23&65535;r25=r24&7;r26=_sprintf(r22,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r25,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 3:{r27=r1+32|0;HEAP8[r27]=HEAP8[21392];HEAP8[r27+1|0]=HEAP8[21393];HEAP8[r27+2|0]=HEAP8[21394];HEAP8[r27+3|0]=HEAP8[21395];HEAP8[r27+4|0]=HEAP8[21396];HEAP8[r27+5|0]=HEAP8[21397];r28=r1+28|0;HEAP32[r28>>2]=2;r29=r1+96|0;r30=HEAP8[r2];r31=r30&255;r32=(r31&65535)>>>1;r33=r32&7;r34=r33<<16>>16==0;r35=r33&65535;r36=r34?8:r35;r37=_sprintf(r29,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r36,r4));STACKTOP=r4;r38=r1+160|0;r39=HEAP16[r6>>1];r40=r39&65535;r41=r40&7;r42=_sprintf(r38,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r41,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 2:{r43=r1+32|0;HEAP8[r43]=HEAP8[21456];HEAP8[r43+1|0]=HEAP8[21457];HEAP8[r43+2|0]=HEAP8[21458];HEAP8[r43+3|0]=HEAP8[21459];HEAP8[r43+4|0]=HEAP8[21460];HEAP8[r43+5|0]=HEAP8[21461];HEAP8[r43+6|0]=HEAP8[21462];r44=r1+28|0;HEAP32[r44>>2]=2;r45=r1+96|0;r46=HEAP8[r2];r47=r46&255;r48=(r47&65535)>>>1;r49=r48&7;r50=r49<<16>>16==0;r51=r49&65535;r52=r50?8:r51;r53=_sprintf(r45,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r52,r4));STACKTOP=r4;r54=r1+160|0;r55=HEAP16[r6>>1];r56=r55&65535;r57=r56&7;r58=_sprintf(r54,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r57,r4));STACKTOP=r4;r59=r1|0;r60=HEAP32[r59>>2];r61=r60|32;HEAP32[r59>>2]=r61;STACKTOP=r5;return;break};case 7:{r62=r1+32|0;HEAP8[r62]=HEAP8[21392];HEAP8[r62+1|0]=HEAP8[21393];HEAP8[r62+2|0]=HEAP8[21394];HEAP8[r62+3|0]=HEAP8[21395];HEAP8[r62+4|0]=HEAP8[21396];HEAP8[r62+5|0]=HEAP8[21397];r63=r1+28|0;HEAP32[r63>>2]=2;r64=r1+96|0;r65=HEAP8[r2];r66=r65&255;r67=r66>>>1;r68=r67&7;r69=_sprintf(r64,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r68,r4));STACKTOP=r4;r70=r1+160|0;r71=HEAP16[r6>>1];r72=r71&65535;r73=r72&7;r74=_sprintf(r70,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r73,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r75=r1+32|0;HEAP8[r75]=HEAP8[21568];HEAP8[r75+1|0]=HEAP8[21569];HEAP8[r75+2|0]=HEAP8[21570];HEAP8[r75+3|0]=HEAP8[21571];HEAP8[r75+4|0]=HEAP8[21572];HEAP8[r75+5|0]=HEAP8[21573];r76=r1+28|0;HEAP32[r76>>2]=2;r77=r1+96|0;r78=HEAP8[r2];r79=r78&255;r80=r79>>>1;r81=r80&7;r82=_sprintf(r77,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r81,r4));STACKTOP=r4;r83=r1+160|0;r84=HEAP16[r6>>1];r85=r84&65535;r86=r85&7;r87=_sprintf(r83,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r86,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 6:{r88=r1+32|0;HEAP8[r88]=HEAP8[21456];HEAP8[r88+1|0]=HEAP8[21457];HEAP8[r88+2|0]=HEAP8[21458];HEAP8[r88+3|0]=HEAP8[21459];HEAP8[r88+4|0]=HEAP8[21460];HEAP8[r88+5|0]=HEAP8[21461];HEAP8[r88+6|0]=HEAP8[21462];r89=r1+28|0;HEAP32[r89>>2]=2;r90=r1+96|0;r91=HEAP8[r2];r92=r91&255;r93=r92>>>1;r94=r93&7;r95=_sprintf(r90,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r94,r4));STACKTOP=r4;r96=r1+160|0;r97=HEAP16[r6>>1];r98=r97&65535;r99=r98&7;r100=_sprintf(r96,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r99,r4));STACKTOP=r4;r101=r1|0;r102=HEAP32[r101>>2];r103=r102|32;HEAP32[r101>>2]=r103;STACKTOP=r5;return;break};case 4:{r104=r1+32|0;HEAP8[r104]=HEAP8[21624];HEAP8[r104+1|0]=HEAP8[21625];HEAP8[r104+2|0]=HEAP8[21626];HEAP8[r104+3|0]=HEAP8[21627];HEAP8[r104+4|0]=HEAP8[21628];HEAP8[r104+5|0]=HEAP8[21629];r105=r1+28|0;HEAP32[r105>>2]=2;r106=r1+96|0;r107=HEAP8[r2];r108=r107&255;r109=r108>>>1;r110=r109&7;r111=_sprintf(r106,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r110,r4));STACKTOP=r4;r112=r1+160|0;r113=HEAP16[r6>>1];r114=r113&65535;r115=r114&7;r116=_sprintf(r112,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r115,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r117=r1+32|0;HEAP8[r117]=HEAP8[21624];HEAP8[r117+1|0]=HEAP8[21625];HEAP8[r117+2|0]=HEAP8[21626];HEAP8[r117+3|0]=HEAP8[21627];HEAP8[r117+4|0]=HEAP8[21628];HEAP8[r117+5|0]=HEAP8[21629];r118=r1+28|0;HEAP32[r118>>2]=2;r119=r1+96|0;r120=HEAP8[r2];r121=r120&255;r122=(r121&65535)>>>1;r123=r122&7;r124=r123<<16>>16==0;r125=r123&65535;r126=r124?8:r125;r127=_sprintf(r119,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r126,r4));STACKTOP=r4;r128=r1+160|0;r129=HEAP16[r6>>1];r130=r129&65535;r131=r130&7;r132=_sprintf(r128,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r131,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r133=r1+32|0;HEAP8[r133]=HEAP8[22912];HEAP8[r133+1|0]=HEAP8[22913];HEAP8[r133+2|0]=HEAP8[22914];r134=r1+28|0;HEAP32[r134>>2]=1;r135=r1+96|0;r136=HEAP8[r2];r137=r136&255;r138=r137<<8;r139=r2+1|0;r140=HEAP8[r139];r141=r140&255;r142=r138|r141;r143=r142&65535;r144=_sprintf(r135,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r143,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _d_e040(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8>>>3;r10=r9&7;switch(r10|0){case 7:{r11=r1+32|0;HEAP8[r11]=HEAP8[23928];HEAP8[r11+1|0]=HEAP8[23929];HEAP8[r11+2|0]=HEAP8[23930];HEAP8[r11+3|0]=HEAP8[23931];HEAP8[r11+4|0]=HEAP8[23932];HEAP8[r11+5|0]=HEAP8[23933];r12=r1+28|0;HEAP32[r12>>2]=2;r13=r1+96|0;r14=HEAP8[r2];r15=r14&255;r16=r15>>>1;r17=r16&7;r18=_sprintf(r13,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r17,r4));STACKTOP=r4;r19=r1+160|0;r20=HEAP16[r6>>1];r21=r20&65535;r22=r21&7;r23=_sprintf(r19,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r22,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r24=r1+32|0;HEAP8[r24]=HEAP8[23632];HEAP8[r24+1|0]=HEAP8[23633];HEAP8[r24+2|0]=HEAP8[23634];HEAP8[r24+3|0]=HEAP8[23635];HEAP8[r24+4|0]=HEAP8[23636];HEAP8[r24+5|0]=HEAP8[23637];r25=r1+28|0;HEAP32[r25>>2]=2;r26=r1+96|0;r27=HEAP8[r2];r28=r27&255;r29=r28>>>1;r30=r29&7;r31=_sprintf(r26,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r30,r4));STACKTOP=r4;r32=r1+160|0;r33=HEAP16[r6>>1];r34=r33&65535;r35=r34&7;r36=_sprintf(r32,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r35,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 6:{r37=r1+32|0;HEAP8[r37]=HEAP8[23752];HEAP8[r37+1|0]=HEAP8[23753];HEAP8[r37+2|0]=HEAP8[23754];HEAP8[r37+3|0]=HEAP8[23755];HEAP8[r37+4|0]=HEAP8[23756];HEAP8[r37+5|0]=HEAP8[23757];HEAP8[r37+6|0]=HEAP8[23758];r38=r1+28|0;HEAP32[r38>>2]=2;r39=r1+96|0;r40=HEAP8[r2];r41=r40&255;r42=r41>>>1;r43=r42&7;r44=_sprintf(r39,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r43,r4));STACKTOP=r4;r45=r1+160|0;r46=HEAP16[r6>>1];r47=r46&65535;r48=r47&7;r49=_sprintf(r45,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r48,r4));STACKTOP=r4;r50=r1|0;r51=HEAP32[r50>>2];r52=r51|32;HEAP32[r50>>2]=r52;STACKTOP=r5;return;break};case 1:{r53=r1+32|0;HEAP8[r53]=HEAP8[23632];HEAP8[r53+1|0]=HEAP8[23633];HEAP8[r53+2|0]=HEAP8[23634];HEAP8[r53+3|0]=HEAP8[23635];HEAP8[r53+4|0]=HEAP8[23636];HEAP8[r53+5|0]=HEAP8[23637];r54=r1+28|0;HEAP32[r54>>2]=2;r55=r1+96|0;r56=HEAP8[r2];r57=r56&255;r58=(r57&65535)>>>1;r59=r58&7;r60=r59<<16>>16==0;r61=r59&65535;r62=r60?8:r61;r63=_sprintf(r55,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r62,r4));STACKTOP=r4;r64=r1+160|0;r65=HEAP16[r6>>1];r66=r65&65535;r67=r66&7;r68=_sprintf(r64,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r67,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 3:{r69=r1+32|0;HEAP8[r69]=HEAP8[23928];HEAP8[r69+1|0]=HEAP8[23929];HEAP8[r69+2|0]=HEAP8[23930];HEAP8[r69+3|0]=HEAP8[23931];HEAP8[r69+4|0]=HEAP8[23932];HEAP8[r69+5|0]=HEAP8[23933];r70=r1+28|0;HEAP32[r70>>2]=2;r71=r1+96|0;r72=HEAP8[r2];r73=r72&255;r74=(r73&65535)>>>1;r75=r74&7;r76=r75<<16>>16==0;r77=r75&65535;r78=r76?8:r77;r79=_sprintf(r71,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r78,r4));STACKTOP=r4;r80=r1+160|0;r81=HEAP16[r6>>1];r82=r81&65535;r83=r82&7;r84=_sprintf(r80,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r83,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 2:{r85=r1+32|0;HEAP8[r85]=HEAP8[23752];HEAP8[r85+1|0]=HEAP8[23753];HEAP8[r85+2|0]=HEAP8[23754];HEAP8[r85+3|0]=HEAP8[23755];HEAP8[r85+4|0]=HEAP8[23756];HEAP8[r85+5|0]=HEAP8[23757];HEAP8[r85+6|0]=HEAP8[23758];r86=r1+28|0;HEAP32[r86>>2]=2;r87=r1+96|0;r88=HEAP8[r2];r89=r88&255;r90=(r89&65535)>>>1;r91=r90&7;r92=r91<<16>>16==0;r93=r91&65535;r94=r92?8:r93;r95=_sprintf(r87,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r94,r4));STACKTOP=r4;r96=r1+160|0;r97=HEAP16[r6>>1];r98=r97&65535;r99=r98&7;r100=_sprintf(r96,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r99,r4));STACKTOP=r4;r101=r1|0;r102=HEAP32[r101>>2];r103=r102|32;HEAP32[r101>>2]=r103;STACKTOP=r5;return;break};case 0:{r104=r1+32|0;HEAP8[r104]=HEAP8[22376];HEAP8[r104+1|0]=HEAP8[22377];HEAP8[r104+2|0]=HEAP8[22378];HEAP8[r104+3|0]=HEAP8[22379];HEAP8[r104+4|0]=HEAP8[22380];HEAP8[r104+5|0]=HEAP8[22381];r105=r1+28|0;HEAP32[r105>>2]=2;r106=r1+96|0;r107=HEAP8[r2];r108=r107&255;r109=(r108&65535)>>>1;r110=r109&7;r111=r110<<16>>16==0;r112=r110&65535;r113=r111?8:r112;r114=_sprintf(r106,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r113,r4));STACKTOP=r4;r115=r1+160|0;r116=HEAP16[r6>>1];r117=r116&65535;r118=r117&7;r119=_sprintf(r115,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r118,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 4:{r120=r1+32|0;HEAP8[r120]=HEAP8[22376];HEAP8[r120+1|0]=HEAP8[22377];HEAP8[r120+2|0]=HEAP8[22378];HEAP8[r120+3|0]=HEAP8[22379];HEAP8[r120+4|0]=HEAP8[22380];HEAP8[r120+5|0]=HEAP8[22381];r121=r1+28|0;HEAP32[r121>>2]=2;r122=r1+96|0;r123=HEAP8[r2];r124=r123&255;r125=r124>>>1;r126=r125&7;r127=_sprintf(r122,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r126,r4));STACKTOP=r4;r128=r1+160|0;r129=HEAP16[r6>>1];r130=r129&65535;r131=r130&7;r132=_sprintf(r128,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r131,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r133=r1+32|0;HEAP8[r133]=HEAP8[22912];HEAP8[r133+1|0]=HEAP8[22913];HEAP8[r133+2|0]=HEAP8[22914];r134=r1+28|0;HEAP32[r134>>2]=1;r135=r1+96|0;r136=HEAP8[r2];r137=r136&255;r138=r137<<8;r139=r2+1|0;r140=HEAP8[r139];r141=r140&255;r142=r138|r141;r143=r142&65535;r144=_sprintf(r135,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r143,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _d_e080(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8>>>3;r10=r9&7;switch(r10|0){case 2:{r11=r1+32|0;HEAP8[r11]=HEAP8[22e3];HEAP8[r11+1|0]=HEAP8[22001];HEAP8[r11+2|0]=HEAP8[22002];HEAP8[r11+3|0]=HEAP8[22003];HEAP8[r11+4|0]=HEAP8[22004];HEAP8[r11+5|0]=HEAP8[22005];HEAP8[r11+6|0]=HEAP8[22006];r12=r1+28|0;HEAP32[r12>>2]=2;r13=r1+96|0;r14=HEAP8[r2];r15=r14&255;r16=(r15&65535)>>>1;r17=r16&7;r18=r17<<16>>16==0;r19=r17&65535;r20=r18?8:r19;r21=_sprintf(r13,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r20,r4));STACKTOP=r4;r22=r1+160|0;r23=HEAP16[r6>>1];r24=r23&65535;r25=r24&7;r26=_sprintf(r22,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r25,r4));STACKTOP=r4;r27=r1|0;r28=HEAP32[r27>>2];r29=r28|32;HEAP32[r27>>2]=r29;STACKTOP=r5;return;break};case 4:{r30=r1+32|0;HEAP8[r30]=HEAP8[22248];HEAP8[r30+1|0]=HEAP8[22249];HEAP8[r30+2|0]=HEAP8[22250];HEAP8[r30+3|0]=HEAP8[22251];HEAP8[r30+4|0]=HEAP8[22252];HEAP8[r30+5|0]=HEAP8[22253];r31=r1+28|0;HEAP32[r31>>2]=2;r32=r1+96|0;r33=HEAP8[r2];r34=r33&255;r35=r34>>>1;r36=r35&7;r37=_sprintf(r32,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r36,r4));STACKTOP=r4;r38=r1+160|0;r39=HEAP16[r6>>1];r40=r39&65535;r41=r40&7;r42=_sprintf(r38,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r41,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r43=r1+32|0;HEAP8[r43]=HEAP8[22248];HEAP8[r43+1|0]=HEAP8[22249];HEAP8[r43+2|0]=HEAP8[22250];HEAP8[r43+3|0]=HEAP8[22251];HEAP8[r43+4|0]=HEAP8[22252];HEAP8[r43+5|0]=HEAP8[22253];r44=r1+28|0;HEAP32[r44>>2]=2;r45=r1+96|0;r46=HEAP8[r2];r47=r46&255;r48=(r47&65535)>>>1;r49=r48&7;r50=r49<<16>>16==0;r51=r49&65535;r52=r50?8:r51;r53=_sprintf(r45,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r52,r4));STACKTOP=r4;r54=r1+160|0;r55=HEAP16[r6>>1];r56=r55&65535;r57=r56&7;r58=_sprintf(r54,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r57,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 3:{r59=r1+32|0;HEAP8[r59]=HEAP8[21768];HEAP8[r59+1|0]=HEAP8[21769];HEAP8[r59+2|0]=HEAP8[21770];HEAP8[r59+3|0]=HEAP8[21771];HEAP8[r59+4|0]=HEAP8[21772];HEAP8[r59+5|0]=HEAP8[21773];r60=r1+28|0;HEAP32[r60>>2]=2;r61=r1+96|0;r62=HEAP8[r2];r63=r62&255;r64=(r63&65535)>>>1;r65=r64&7;r66=r65<<16>>16==0;r67=r65&65535;r68=r66?8:r67;r69=_sprintf(r61,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r68,r4));STACKTOP=r4;r70=r1+160|0;r71=HEAP16[r6>>1];r72=r71&65535;r73=r72&7;r74=_sprintf(r70,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r73,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 6:{r75=r1+32|0;HEAP8[r75]=HEAP8[22e3];HEAP8[r75+1|0]=HEAP8[22001];HEAP8[r75+2|0]=HEAP8[22002];HEAP8[r75+3|0]=HEAP8[22003];HEAP8[r75+4|0]=HEAP8[22004];HEAP8[r75+5|0]=HEAP8[22005];HEAP8[r75+6|0]=HEAP8[22006];r76=r1+28|0;HEAP32[r76>>2]=2;r77=r1+96|0;r78=HEAP8[r2];r79=r78&255;r80=r79>>>1;r81=r80&7;r82=_sprintf(r77,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r81,r4));STACKTOP=r4;r83=r1+160|0;r84=HEAP16[r6>>1];r85=r84&65535;r86=r85&7;r87=_sprintf(r83,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r86,r4));STACKTOP=r4;r88=r1|0;r89=HEAP32[r88>>2];r90=r89|32;HEAP32[r88>>2]=r90;STACKTOP=r5;return;break};case 7:{r91=r1+32|0;HEAP8[r91]=HEAP8[21768];HEAP8[r91+1|0]=HEAP8[21769];HEAP8[r91+2|0]=HEAP8[21770];HEAP8[r91+3|0]=HEAP8[21771];HEAP8[r91+4|0]=HEAP8[21772];HEAP8[r91+5|0]=HEAP8[21773];r92=r1+28|0;HEAP32[r92>>2]=2;r93=r1+96|0;r94=HEAP8[r2];r95=r94&255;r96=r95>>>1;r97=r96&7;r98=_sprintf(r93,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r97,r4));STACKTOP=r4;r99=r1+160|0;r100=HEAP16[r6>>1];r101=r100&65535;r102=r101&7;r103=_sprintf(r99,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r102,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r104=r1+32|0;HEAP8[r104]=HEAP8[22096];HEAP8[r104+1|0]=HEAP8[22097];HEAP8[r104+2|0]=HEAP8[22098];HEAP8[r104+3|0]=HEAP8[22099];HEAP8[r104+4|0]=HEAP8[22100];HEAP8[r104+5|0]=HEAP8[22101];r105=r1+28|0;HEAP32[r105>>2]=2;r106=r1+96|0;r107=HEAP8[r2];r108=r107&255;r109=r108>>>1;r110=r109&7;r111=_sprintf(r106,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r110,r4));STACKTOP=r4;r112=r1+160|0;r113=HEAP16[r6>>1];r114=r113&65535;r115=r114&7;r116=_sprintf(r112,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r115,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 1:{r117=r1+32|0;HEAP8[r117]=HEAP8[22096];HEAP8[r117+1|0]=HEAP8[22097];HEAP8[r117+2|0]=HEAP8[22098];HEAP8[r117+3|0]=HEAP8[22099];HEAP8[r117+4|0]=HEAP8[22100];HEAP8[r117+5|0]=HEAP8[22101];r118=r1+28|0;HEAP32[r118>>2]=2;r119=r1+96|0;r120=HEAP8[r2];r121=r120&255;r122=(r121&65535)>>>1;r123=r122&7;r124=r123<<16>>16==0;r125=r123&65535;r126=r124?8:r125;r127=_sprintf(r119,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r126,r4));STACKTOP=r4;r128=r1+160|0;r129=HEAP16[r6>>1];r130=r129&65535;r131=r130&7;r132=_sprintf(r128,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r131,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r133=r1+32|0;HEAP8[r133]=HEAP8[22912];HEAP8[r133+1|0]=HEAP8[22913];HEAP8[r133+2|0]=HEAP8[22914];r134=r1+28|0;HEAP32[r134>>2]=1;r135=r1+96|0;r136=HEAP8[r2];r137=r136&255;r138=r137<<8;r139=r2+1|0;r140=HEAP8[r139];r141=r140&255;r142=r138|r141;r143=r142&65535;r144=_sprintf(r135,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r143,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _d_e0c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[22376];HEAP8[r3+1|0]=HEAP8[22377];HEAP8[r3+2|0]=HEAP8[22378];HEAP8[r3+3|0]=HEAP8[22379];HEAP8[r3+4|0]=HEAP8[22380];HEAP8[r3+5|0]=HEAP8[22381];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_e100(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8>>>3;r10=r9&7;switch(r10|0){case 6:{r11=r1+32|0;HEAP8[r11]=HEAP8[22568];HEAP8[r11+1|0]=HEAP8[22569];HEAP8[r11+2|0]=HEAP8[22570];HEAP8[r11+3|0]=HEAP8[22571];HEAP8[r11+4|0]=HEAP8[22572];HEAP8[r11+5|0]=HEAP8[22573];HEAP8[r11+6|0]=HEAP8[22574];r12=r1+28|0;HEAP32[r12>>2]=2;r13=r1+96|0;r14=HEAP8[r2];r15=r14&255;r16=r15>>>1;r17=r16&7;r18=_sprintf(r13,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r17,r4));STACKTOP=r4;r19=r1+160|0;r20=HEAP16[r6>>1];r21=r20&65535;r22=r21&7;r23=_sprintf(r19,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r22,r4));STACKTOP=r4;r24=r1|0;r25=HEAP32[r24>>2];r26=r25|32;HEAP32[r24>>2]=r26;STACKTOP=r5;return;break};case 4:{r27=r1+32|0;HEAP8[r27]=HEAP8[22816];HEAP8[r27+1|0]=HEAP8[22817];HEAP8[r27+2|0]=HEAP8[22818];HEAP8[r27+3|0]=HEAP8[22819];HEAP8[r27+4|0]=HEAP8[22820];HEAP8[r27+5|0]=HEAP8[22821];r28=r1+28|0;HEAP32[r28>>2]=2;r29=r1+96|0;r30=HEAP8[r2];r31=r30&255;r32=r31>>>1;r33=r32&7;r34=_sprintf(r29,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r33,r4));STACKTOP=r4;r35=r1+160|0;r36=HEAP16[r6>>1];r37=r36&65535;r38=r37&7;r39=_sprintf(r35,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r38,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r40=r1+32|0;HEAP8[r40]=HEAP8[22720];HEAP8[r40+1|0]=HEAP8[22721];HEAP8[r40+2|0]=HEAP8[22722];HEAP8[r40+3|0]=HEAP8[22723];HEAP8[r40+4|0]=HEAP8[22724];HEAP8[r40+5|0]=HEAP8[22725];r41=r1+28|0;HEAP32[r41>>2]=2;r42=r1+96|0;r43=HEAP8[r2];r44=r43&255;r45=r44>>>1;r46=r45&7;r47=_sprintf(r42,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r46,r4));STACKTOP=r4;r48=r1+160|0;r49=HEAP16[r6>>1];r50=r49&65535;r51=r50&7;r52=_sprintf(r48,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r51,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r53=r1+32|0;HEAP8[r53]=HEAP8[22816];HEAP8[r53+1|0]=HEAP8[22817];HEAP8[r53+2|0]=HEAP8[22818];HEAP8[r53+3|0]=HEAP8[22819];HEAP8[r53+4|0]=HEAP8[22820];HEAP8[r53+5|0]=HEAP8[22821];r54=r1+28|0;HEAP32[r54>>2]=2;r55=r1+96|0;r56=HEAP8[r2];r57=r56&255;r58=(r57&65535)>>>1;r59=r58&7;r60=r59<<16>>16==0;r61=r59&65535;r62=r60?8:r61;r63=_sprintf(r55,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r62,r4));STACKTOP=r4;r64=r1+160|0;r65=HEAP16[r6>>1];r66=r65&65535;r67=r66&7;r68=_sprintf(r64,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r67,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 2:{r69=r1+32|0;HEAP8[r69]=HEAP8[22568];HEAP8[r69+1|0]=HEAP8[22569];HEAP8[r69+2|0]=HEAP8[22570];HEAP8[r69+3|0]=HEAP8[22571];HEAP8[r69+4|0]=HEAP8[22572];HEAP8[r69+5|0]=HEAP8[22573];HEAP8[r69+6|0]=HEAP8[22574];r70=r1+28|0;HEAP32[r70>>2]=2;r71=r1+96|0;r72=HEAP8[r2];r73=r72&255;r74=(r73&65535)>>>1;r75=r74&7;r76=r75<<16>>16==0;r77=r75&65535;r78=r76?8:r77;r79=_sprintf(r71,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r78,r4));STACKTOP=r4;r80=r1+160|0;r81=HEAP16[r6>>1];r82=r81&65535;r83=r82&7;r84=_sprintf(r80,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r83,r4));STACKTOP=r4;r85=r1|0;r86=HEAP32[r85>>2];r87=r86|32;HEAP32[r85>>2]=r87;STACKTOP=r5;return;break};case 1:{r88=r1+32|0;HEAP8[r88]=HEAP8[22720];HEAP8[r88+1|0]=HEAP8[22721];HEAP8[r88+2|0]=HEAP8[22722];HEAP8[r88+3|0]=HEAP8[22723];HEAP8[r88+4|0]=HEAP8[22724];HEAP8[r88+5|0]=HEAP8[22725];r89=r1+28|0;HEAP32[r89>>2]=2;r90=r1+96|0;r91=HEAP8[r2];r92=r91&255;r93=(r92&65535)>>>1;r94=r93&7;r95=r94<<16>>16==0;r96=r94&65535;r97=r95?8:r96;r98=_sprintf(r90,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r97,r4));STACKTOP=r4;r99=r1+160|0;r100=HEAP16[r6>>1];r101=r100&65535;r102=r101&7;r103=_sprintf(r99,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r102,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 3:{r104=r1+32|0;HEAP8[r104]=HEAP8[22496];HEAP8[r104+1|0]=HEAP8[22497];HEAP8[r104+2|0]=HEAP8[22498];HEAP8[r104+3|0]=HEAP8[22499];HEAP8[r104+4|0]=HEAP8[22500];HEAP8[r104+5|0]=HEAP8[22501];r105=r1+28|0;HEAP32[r105>>2]=2;r106=r1+96|0;r107=HEAP8[r2];r108=r107&255;r109=(r108&65535)>>>1;r110=r109&7;r111=r110<<16>>16==0;r112=r110&65535;r113=r111?8:r112;r114=_sprintf(r106,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r113,r4));STACKTOP=r4;r115=r1+160|0;r116=HEAP16[r6>>1];r117=r116&65535;r118=r117&7;r119=_sprintf(r115,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r118,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 7:{r120=r1+32|0;HEAP8[r120]=HEAP8[22496];HEAP8[r120+1|0]=HEAP8[22497];HEAP8[r120+2|0]=HEAP8[22498];HEAP8[r120+3|0]=HEAP8[22499];HEAP8[r120+4|0]=HEAP8[22500];HEAP8[r120+5|0]=HEAP8[22501];r121=r1+28|0;HEAP32[r121>>2]=2;r122=r1+96|0;r123=HEAP8[r2];r124=r123&255;r125=r124>>>1;r126=r125&7;r127=_sprintf(r122,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r126,r4));STACKTOP=r4;r128=r1+160|0;r129=HEAP16[r6>>1];r130=r129&65535;r131=r130&7;r132=_sprintf(r128,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r131,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r133=r1+32|0;HEAP8[r133]=HEAP8[22912];HEAP8[r133+1|0]=HEAP8[22913];HEAP8[r133+2|0]=HEAP8[22914];r134=r1+28|0;HEAP32[r134>>2]=1;r135=r1+96|0;r136=HEAP8[r2];r137=r136&255;r138=r137<<8;r139=r2+1|0;r140=HEAP8[r139];r141=r140&255;r142=r138|r141;r143=r142&65535;r144=_sprintf(r135,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r143,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _d_e140(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8>>>3;r10=r9&7;switch(r10|0){case 2:{r11=r1+32|0;HEAP8[r11]=HEAP8[23808];HEAP8[r11+1|0]=HEAP8[23809];HEAP8[r11+2|0]=HEAP8[23810];HEAP8[r11+3|0]=HEAP8[23811];HEAP8[r11+4|0]=HEAP8[23812];HEAP8[r11+5|0]=HEAP8[23813];HEAP8[r11+6|0]=HEAP8[23814];r12=r1+28|0;HEAP32[r12>>2]=2;r13=r1+96|0;r14=HEAP8[r2];r15=r14&255;r16=(r15&65535)>>>1;r17=r16&7;r18=r17<<16>>16==0;r19=r17&65535;r20=r18?8:r19;r21=_sprintf(r13,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r20,r4));STACKTOP=r4;r22=r1+160|0;r23=HEAP16[r6>>1];r24=r23&65535;r25=r24&7;r26=_sprintf(r22,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r25,r4));STACKTOP=r4;r27=r1|0;r28=HEAP32[r27>>2];r29=r28|32;HEAP32[r27>>2]=r29;STACKTOP=r5;return;break};case 4:{r30=r1+32|0;HEAP8[r30]=HEAP8[23552];HEAP8[r30+1|0]=HEAP8[23553];HEAP8[r30+2|0]=HEAP8[23554];HEAP8[r30+3|0]=HEAP8[23555];HEAP8[r30+4|0]=HEAP8[23556];HEAP8[r30+5|0]=HEAP8[23557];r31=r1+28|0;HEAP32[r31>>2]=2;r32=r1+96|0;r33=HEAP8[r2];r34=r33&255;r35=r34>>>1;r36=r35&7;r37=_sprintf(r32,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r36,r4));STACKTOP=r4;r38=r1+160|0;r39=HEAP16[r6>>1];r40=r39&65535;r41=r40&7;r42=_sprintf(r38,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r41,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r43=r1+32|0;HEAP8[r43]=HEAP8[23552];HEAP8[r43+1|0]=HEAP8[23553];HEAP8[r43+2|0]=HEAP8[23554];HEAP8[r43+3|0]=HEAP8[23555];HEAP8[r43+4|0]=HEAP8[23556];HEAP8[r43+5|0]=HEAP8[23557];r44=r1+28|0;HEAP32[r44>>2]=2;r45=r1+96|0;r46=HEAP8[r2];r47=r46&255;r48=(r47&65535)>>>1;r49=r48&7;r50=r49<<16>>16==0;r51=r49&65535;r52=r50?8:r51;r53=_sprintf(r45,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r52,r4));STACKTOP=r4;r54=r1+160|0;r55=HEAP16[r6>>1];r56=r55&65535;r57=r56&7;r58=_sprintf(r54,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r57,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 3:{r59=r1+32|0;HEAP8[r59]=HEAP8[24112];HEAP8[r59+1|0]=HEAP8[24113];HEAP8[r59+2|0]=HEAP8[24114];HEAP8[r59+3|0]=HEAP8[24115];HEAP8[r59+4|0]=HEAP8[24116];HEAP8[r59+5|0]=HEAP8[24117];r60=r1+28|0;HEAP32[r60>>2]=2;r61=r1+96|0;r62=HEAP8[r2];r63=r62&255;r64=(r63&65535)>>>1;r65=r64&7;r66=r65<<16>>16==0;r67=r65&65535;r68=r66?8:r67;r69=_sprintf(r61,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r68,r4));STACKTOP=r4;r70=r1+160|0;r71=HEAP16[r6>>1];r72=r71&65535;r73=r72&7;r74=_sprintf(r70,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r73,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 6:{r75=r1+32|0;HEAP8[r75]=HEAP8[23808];HEAP8[r75+1|0]=HEAP8[23809];HEAP8[r75+2|0]=HEAP8[23810];HEAP8[r75+3|0]=HEAP8[23811];HEAP8[r75+4|0]=HEAP8[23812];HEAP8[r75+5|0]=HEAP8[23813];HEAP8[r75+6|0]=HEAP8[23814];r76=r1+28|0;HEAP32[r76>>2]=2;r77=r1+96|0;r78=HEAP8[r2];r79=r78&255;r80=r79>>>1;r81=r80&7;r82=_sprintf(r77,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r81,r4));STACKTOP=r4;r83=r1+160|0;r84=HEAP16[r6>>1];r85=r84&65535;r86=r85&7;r87=_sprintf(r83,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r86,r4));STACKTOP=r4;r88=r1|0;r89=HEAP32[r88>>2];r90=r89|32;HEAP32[r88>>2]=r90;STACKTOP=r5;return;break};case 7:{r91=r1+32|0;HEAP8[r91]=HEAP8[24112];HEAP8[r91+1|0]=HEAP8[24113];HEAP8[r91+2|0]=HEAP8[24114];HEAP8[r91+3|0]=HEAP8[24115];HEAP8[r91+4|0]=HEAP8[24116];HEAP8[r91+5|0]=HEAP8[24117];r92=r1+28|0;HEAP32[r92>>2]=2;r93=r1+96|0;r94=HEAP8[r2];r95=r94&255;r96=r95>>>1;r97=r96&7;r98=_sprintf(r93,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r97,r4));STACKTOP=r4;r99=r1+160|0;r100=HEAP16[r6>>1];r101=r100&65535;r102=r101&7;r103=_sprintf(r99,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r102,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r104=r1+32|0;HEAP8[r104]=HEAP8[23696];HEAP8[r104+1|0]=HEAP8[23697];HEAP8[r104+2|0]=HEAP8[23698];HEAP8[r104+3|0]=HEAP8[23699];HEAP8[r104+4|0]=HEAP8[23700];HEAP8[r104+5|0]=HEAP8[23701];r105=r1+28|0;HEAP32[r105>>2]=2;r106=r1+96|0;r107=HEAP8[r2];r108=r107&255;r109=r108>>>1;r110=r109&7;r111=_sprintf(r106,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r110,r4));STACKTOP=r4;r112=r1+160|0;r113=HEAP16[r6>>1];r114=r113&65535;r115=r114&7;r116=_sprintf(r112,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r115,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 1:{r117=r1+32|0;HEAP8[r117]=HEAP8[23696];HEAP8[r117+1|0]=HEAP8[23697];HEAP8[r117+2|0]=HEAP8[23698];HEAP8[r117+3|0]=HEAP8[23699];HEAP8[r117+4|0]=HEAP8[23700];HEAP8[r117+5|0]=HEAP8[23701];r118=r1+28|0;HEAP32[r118>>2]=2;r119=r1+96|0;r120=HEAP8[r2];r121=r120&255;r122=(r121&65535)>>>1;r123=r122&7;r124=r123<<16>>16==0;r125=r123&65535;r126=r124?8:r125;r127=_sprintf(r119,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r126,r4));STACKTOP=r4;r128=r1+160|0;r129=HEAP16[r6>>1];r130=r129&65535;r131=r130&7;r132=_sprintf(r128,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r131,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r133=r1+32|0;HEAP8[r133]=HEAP8[22912];HEAP8[r133+1|0]=HEAP8[22913];HEAP8[r133+2|0]=HEAP8[22914];r134=r1+28|0;HEAP32[r134>>2]=1;r135=r1+96|0;r136=HEAP8[r2];r137=r136&255;r138=r137<<8;r139=r2+1|0;r140=HEAP8[r139];r141=r140&255;r142=r138|r141;r143=r142&65535;r144=_sprintf(r135,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r143,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _d_e180(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144;r3=0;r4=0;r5=STACKTOP;r6=r1+12|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8>>>3;r10=r9&7;switch(r10|0){case 6:{r11=r1+32|0;HEAP8[r11]=HEAP8[23296];HEAP8[r11+1|0]=HEAP8[23297];HEAP8[r11+2|0]=HEAP8[23298];HEAP8[r11+3|0]=HEAP8[23299];HEAP8[r11+4|0]=HEAP8[23300];HEAP8[r11+5|0]=HEAP8[23301];HEAP8[r11+6|0]=HEAP8[23302];r12=r1+28|0;HEAP32[r12>>2]=2;r13=r1+96|0;r14=HEAP8[r2];r15=r14&255;r16=r15>>>1;r17=r16&7;r18=_sprintf(r13,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r17,r4));STACKTOP=r4;r19=r1+160|0;r20=HEAP16[r6>>1];r21=r20&65535;r22=r21&7;r23=_sprintf(r19,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r22,r4));STACKTOP=r4;r24=r1|0;r25=HEAP32[r24>>2];r26=r25|32;HEAP32[r24>>2]=r26;STACKTOP=r5;return;break};case 4:{r27=r1+32|0;HEAP8[r27]=HEAP8[23432];HEAP8[r27+1|0]=HEAP8[23433];HEAP8[r27+2|0]=HEAP8[23434];HEAP8[r27+3|0]=HEAP8[23435];HEAP8[r27+4|0]=HEAP8[23436];HEAP8[r27+5|0]=HEAP8[23437];r28=r1+28|0;HEAP32[r28>>2]=2;r29=r1+96|0;r30=HEAP8[r2];r31=r30&255;r32=r31>>>1;r33=r32&7;r34=_sprintf(r29,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r33,r4));STACKTOP=r4;r35=r1+160|0;r36=HEAP16[r6>>1];r37=r36&65535;r38=r37&7;r39=_sprintf(r35,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r38,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 5:{r40=r1+32|0;HEAP8[r40]=HEAP8[23376];HEAP8[r40+1|0]=HEAP8[23377];HEAP8[r40+2|0]=HEAP8[23378];HEAP8[r40+3|0]=HEAP8[23379];HEAP8[r40+4|0]=HEAP8[23380];HEAP8[r40+5|0]=HEAP8[23381];r41=r1+28|0;HEAP32[r41>>2]=2;r42=r1+96|0;r43=HEAP8[r2];r44=r43&255;r45=r44>>>1;r46=r45&7;r47=_sprintf(r42,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r46,r4));STACKTOP=r4;r48=r1+160|0;r49=HEAP16[r6>>1];r50=r49&65535;r51=r50&7;r52=_sprintf(r48,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r51,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r53=r1+32|0;HEAP8[r53]=HEAP8[23432];HEAP8[r53+1|0]=HEAP8[23433];HEAP8[r53+2|0]=HEAP8[23434];HEAP8[r53+3|0]=HEAP8[23435];HEAP8[r53+4|0]=HEAP8[23436];HEAP8[r53+5|0]=HEAP8[23437];r54=r1+28|0;HEAP32[r54>>2]=2;r55=r1+96|0;r56=HEAP8[r2];r57=r56&255;r58=(r57&65535)>>>1;r59=r58&7;r60=r59<<16>>16==0;r61=r59&65535;r62=r60?8:r61;r63=_sprintf(r55,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r62,r4));STACKTOP=r4;r64=r1+160|0;r65=HEAP16[r6>>1];r66=r65&65535;r67=r66&7;r68=_sprintf(r64,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r67,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 2:{r69=r1+32|0;HEAP8[r69]=HEAP8[23296];HEAP8[r69+1|0]=HEAP8[23297];HEAP8[r69+2|0]=HEAP8[23298];HEAP8[r69+3|0]=HEAP8[23299];HEAP8[r69+4|0]=HEAP8[23300];HEAP8[r69+5|0]=HEAP8[23301];HEAP8[r69+6|0]=HEAP8[23302];r70=r1+28|0;HEAP32[r70>>2]=2;r71=r1+96|0;r72=HEAP8[r2];r73=r72&255;r74=(r73&65535)>>>1;r75=r74&7;r76=r75<<16>>16==0;r77=r75&65535;r78=r76?8:r77;r79=_sprintf(r71,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r78,r4));STACKTOP=r4;r80=r1+160|0;r81=HEAP16[r6>>1];r82=r81&65535;r83=r82&7;r84=_sprintf(r80,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r83,r4));STACKTOP=r4;r85=r1|0;r86=HEAP32[r85>>2];r87=r86|32;HEAP32[r85>>2]=r87;STACKTOP=r5;return;break};case 1:{r88=r1+32|0;HEAP8[r88]=HEAP8[23376];HEAP8[r88+1|0]=HEAP8[23377];HEAP8[r88+2|0]=HEAP8[23378];HEAP8[r88+3|0]=HEAP8[23379];HEAP8[r88+4|0]=HEAP8[23380];HEAP8[r88+5|0]=HEAP8[23381];r89=r1+28|0;HEAP32[r89>>2]=2;r90=r1+96|0;r91=HEAP8[r2];r92=r91&255;r93=(r92&65535)>>>1;r94=r93&7;r95=r94<<16>>16==0;r96=r94&65535;r97=r95?8:r96;r98=_sprintf(r90,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r97,r4));STACKTOP=r4;r99=r1+160|0;r100=HEAP16[r6>>1];r101=r100&65535;r102=r101&7;r103=_sprintf(r99,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r102,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 3:{r104=r1+32|0;HEAP8[r104]=HEAP8[23040];HEAP8[r104+1|0]=HEAP8[23041];HEAP8[r104+2|0]=HEAP8[23042];HEAP8[r104+3|0]=HEAP8[23043];HEAP8[r104+4|0]=HEAP8[23044];HEAP8[r104+5|0]=HEAP8[23045];r105=r1+28|0;HEAP32[r105>>2]=2;r106=r1+96|0;r107=HEAP8[r2];r108=r107&255;r109=(r108&65535)>>>1;r110=r109&7;r111=r110<<16>>16==0;r112=r110&65535;r113=r111?8:r112;r114=_sprintf(r106,32432,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r113,r4));STACKTOP=r4;r115=r1+160|0;r116=HEAP16[r6>>1];r117=r116&65535;r118=r117&7;r119=_sprintf(r115,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r118,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 7:{r120=r1+32|0;HEAP8[r120]=HEAP8[23040];HEAP8[r120+1|0]=HEAP8[23041];HEAP8[r120+2|0]=HEAP8[23042];HEAP8[r120+3|0]=HEAP8[23043];HEAP8[r120+4|0]=HEAP8[23044];HEAP8[r120+5|0]=HEAP8[23045];r121=r1+28|0;HEAP32[r121>>2]=2;r122=r1+96|0;r123=HEAP8[r2];r124=r123&255;r125=r124>>>1;r126=r125&7;r127=_sprintf(r122,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r126,r4));STACKTOP=r4;r128=r1+160|0;r129=HEAP16[r6>>1];r130=r129&65535;r131=r130&7;r132=_sprintf(r128,27128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r131,r4));STACKTOP=r4;STACKTOP=r5;return;break};default:{r133=r1+32|0;HEAP8[r133]=HEAP8[22912];HEAP8[r133+1|0]=HEAP8[22913];HEAP8[r133+2|0]=HEAP8[22914];r134=r1+28|0;HEAP32[r134>>2]=1;r135=r1+96|0;r136=HEAP8[r2];r137=r136&255;r138=r137<<8;r139=r2+1|0;r140=HEAP8[r139];r141=r140&255;r142=r138|r141;r143=r142&65535;r144=_sprintf(r135,29456,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=25192,HEAP32[r4+8>>2]=r143,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _d_e1c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[23552];HEAP8[r3+1|0]=HEAP8[23553];HEAP8[r3+2|0]=HEAP8[23554];HEAP8[r3+3|0]=HEAP8[23555];HEAP8[r3+4|0]=HEAP8[23556];HEAP8[r3+5|0]=HEAP8[23557];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_e2c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[23632];HEAP8[r3+1|0]=HEAP8[23633];HEAP8[r3+2|0]=HEAP8[23634];HEAP8[r3+3|0]=HEAP8[23635];HEAP8[r3+4|0]=HEAP8[23636];HEAP8[r3+5|0]=HEAP8[23637];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_e3c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[23696];HEAP8[r3+1|0]=HEAP8[23697];HEAP8[r3+2|0]=HEAP8[23698];HEAP8[r3+3|0]=HEAP8[23699];HEAP8[r3+4|0]=HEAP8[23700];HEAP8[r3+5|0]=HEAP8[23701];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_e4c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[23752];HEAP8[r3+1|0]=HEAP8[23753];HEAP8[r3+2|0]=HEAP8[23754];HEAP8[r3+3|0]=HEAP8[23755];HEAP8[r3+4|0]=HEAP8[23756];HEAP8[r3+5|0]=HEAP8[23757];HEAP8[r3+6|0]=HEAP8[23758];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|32;return}function _d_e5c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[23808];HEAP8[r3+1|0]=HEAP8[23809];HEAP8[r3+2|0]=HEAP8[23810];HEAP8[r3+3|0]=HEAP8[23811];HEAP8[r3+4|0]=HEAP8[23812];HEAP8[r3+5|0]=HEAP8[23813];HEAP8[r3+6|0]=HEAP8[23814];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|32;return}function _d_e6c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[23928];HEAP8[r3+1|0]=HEAP8[23929];HEAP8[r3+2|0]=HEAP8[23930];HEAP8[r3+3|0]=HEAP8[23931];HEAP8[r3+4|0]=HEAP8[23932];HEAP8[r3+5|0]=HEAP8[23933];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_e7c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24112];HEAP8[r3+1|0]=HEAP8[24113];HEAP8[r3+2|0]=HEAP8[24114];HEAP8[r3+3|0]=HEAP8[24115];HEAP8[r3+4|0]=HEAP8[24116];HEAP8[r3+5|0]=HEAP8[24117];HEAP32[r1+28>>2]=1;_dasm_ea(r1,r1+96|0,r2,HEAP8[r2+1|0]&63,16);return}function _d_e8c0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24424];HEAP8[r3+1|0]=HEAP8[24425];HEAP8[r3+2|0]=HEAP8[24426];HEAP8[r3+3|0]=HEAP8[24427];HEAP8[r3+4|0]=HEAP8[24428];HEAP8[r3+5|0]=HEAP8[24429];HEAP32[r1+28>>2]=1;_dasm_arg(r1,r1+96|0,r2,33,8);return}function _d_e9c0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[24520];HEAP8[r5+1|0]=HEAP8[24521];HEAP8[r5+2|0]=HEAP8[24522];HEAP8[r5+3|0]=HEAP8[24523];HEAP8[r5+4|0]=HEAP8[24524];HEAP8[r5+5|0]=HEAP8[24525];HEAP8[r5+6|0]=HEAP8[24526];HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+96|0,r2,33,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r1+14>>1]>>>12&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_eac0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24624];HEAP8[r3+1|0]=HEAP8[24625];HEAP8[r3+2|0]=HEAP8[24626];HEAP8[r3+3|0]=HEAP8[24627];HEAP8[r3+4|0]=HEAP8[24628];HEAP8[r3+5|0]=HEAP8[24629];HEAP32[r1+28>>2]=1;_dasm_arg(r1,r1+96|0,r2,33,8);return}function _d_ebc0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[24776];HEAP8[r5+1|0]=HEAP8[24777];HEAP8[r5+2|0]=HEAP8[24778];HEAP8[r5+3|0]=HEAP8[24779];HEAP8[r5+4|0]=HEAP8[24780];HEAP8[r5+5|0]=HEAP8[24781];HEAP8[r5+6|0]=HEAP8[24782];HEAP32[r1+28>>2]=2;_dasm_arg(r1,r1+96|0,r2,33,8);_sprintf(r1+160|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r1+14>>1]>>>12&7,r3));STACKTOP=r3;STACKTOP=r4;return}function _d_ecc0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24936];HEAP8[r3+1|0]=HEAP8[24937];HEAP8[r3+2|0]=HEAP8[24938];HEAP8[r3+3|0]=HEAP8[24939];HEAP8[r3+4|0]=HEAP8[24940];HEAP8[r3+5|0]=HEAP8[24941];HEAP32[r1+28>>2]=1;_dasm_arg(r1,r1+96|0,r2,33,8);return}function _d_eec0(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25048];HEAP8[r3+1|0]=HEAP8[25049];HEAP8[r3+2|0]=HEAP8[25050];HEAP8[r3+3|0]=HEAP8[25051];HEAP8[r3+4|0]=HEAP8[25052];HEAP8[r3+5|0]=HEAP8[25053];HEAP32[r1+28>>2]=1;_dasm_arg(r1,r1+96|0,r2,33,8);return}function _d_efc0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;HEAP8[r5]=HEAP8[33248];HEAP8[r5+1|0]=HEAP8[33249];HEAP8[r5+2|0]=HEAP8[33250];HEAP8[r5+3|0]=HEAP8[33251];HEAP8[r5+4|0]=HEAP8[33252];HEAP8[r5+5|0]=HEAP8[33253];HEAP32[r1+28>>2]=2;_sprintf(r1+96|0,27128,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU16[r1+14>>1]>>>12&7,r3));STACKTOP=r3;_dasm_arg(r1,r1+160|0,r2,33,8);STACKTOP=r4;return}function _d_f000(r1,r2){var r3,r4;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3|0;_sprintf(r4,27136,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAPU16[r1+12>>1],r2));STACKTOP=r2;_strcpy(r1+32|0,r4);HEAP32[r1+28>>2]=0;r4=r1|0;HEAP32[r4>>2]=HEAP32[r4>>2]|4;STACKTOP=r3;return}function _dasm_arg(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472;r6=0;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+16|0;r9=r8;r10=r8+8;switch(r4|0){case 30:{r11=r1+14|0;r12=HEAP16[r11>>1];r13=r12&65535;r14=r13&7;r15=r13>>>12;r16=r15&7;r17=_sprintf(r2,30656,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=r14,HEAP32[r7+8>>2]=r16,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 31:{r18=r1+14|0;r19=HEAP16[r18>>1];r20=r19&65535;r21=r20&7;r22=r20>>>12;r23=r22&7;r24=_sprintf(r2,30656,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=r21,HEAP32[r7+8>>2]=r23,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 32:case 34:{r25=r1+14|0;r26=HEAP16[r25>>1];r27=r26&65535;r28=r27>>>12;r29=r28&7;r30=_sprintf(r2,27128,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r29,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 15:{r31=r3+3|0;r32=HEAP8[r31];r33=r32&255;r34=_sprintf(r2,33240,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r33,r7));STACKTOP=r7;r35=r1+8|0;r36=HEAP32[r35>>2];r37=r36+1|0;HEAP32[r35>>2]=r37;STACKTOP=r8;return;break};case 16:{r38=r3+2|0;r39=HEAP8[r38];r40=r39&255;r41=r40<<8;r42=r3+3|0;r43=HEAP8[r42];r44=r43&255;r45=r41|r44;r46=r45&65535;r47=_sprintf(r2,29456,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r46,r7));STACKTOP=r7;r48=r1+8|0;r49=HEAP32[r48>>2];r50=r49+1|0;HEAP32[r48>>2]=r50;STACKTOP=r8;return;break};case 14:{r51=r3+2|0;r52=HEAP8[r51];r53=r52&255;r54=r53<<8;r55=r3+3|0;r56=HEAP8[r55];r57=r56&255;r58=r54|r57;r59=r58&65535;r60=r59&32768;r61=(r60|0)!=0;r62=r61?34344:40472;r63=-r59|0;r64=r61?r63:r59;r65=r64&65535;r66=r1+12|0;r67=HEAP16[r66>>1];r68=r67&65535;r69=r68&7;r70=_sprintf(r2,35376,(r7=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r7>>2]=r62,HEAP32[r7+8>>2]=25192,HEAP32[r7+16>>2]=r65,HEAP32[r7+24>>2]=r69,r7));STACKTOP=r7;r71=r1+8|0;r72=HEAP32[r71>>2];r73=r72+1|0;HEAP32[r71>>2]=r73;STACKTOP=r8;return;break};case 2:{r74=r3+2|0;r75=HEAP8[r74];r76=r75&255;r77=r76<<8;r78=r3+3|0;r79=HEAP8[r78];r80=r79&255;r81=r77|r80;r82=r81&65535;r83=_sprintf(r2,29456,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r82,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 10:{r84=r1+12|0;r85=HEAP16[r84>>1];r86=r85&65535;r87=r86&7;r88=_sprintf(r2,20648,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r87,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 11:{r89=r1+12|0;r90=HEAP16[r89>>1];r91=r90&65535;r92=r91>>>9;r93=r92&7;r94=_sprintf(r2,20648,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r93,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 12:{r95=r1+12|0;r96=HEAP16[r95>>1];r97=r96&65535;r98=r97&7;r99=_sprintf(r2,19448,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r98,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 4:{r100=HEAP8[r3];r101=r100&255;r102=r101<<8;r103=r3+1|0;r104=HEAP8[r103];r105=r104&255;r106=r102|r105;r107=r106&65535;r108=r107>>>3;r109=r108&56;r110=r107>>>9;r111=r110&7;r112=r109|r111;_dasm_ea(r1,r2,r3,r112,r5);STACKTOP=r8;return;break};case 0:{HEAP8[r2]=0;STACKTOP=r8;return;break};case 25:{r113=r3+2|0;r114=HEAP8[r113];r115=r114&255;r116=r115<<8;r117=r3+3|0;r118=HEAP8[r117];r119=r118&255;r120=r116|r119;r121=r9;HEAP32[r9>>2]=1;HEAP8[r2]=0;r122=r120<<1;r123=r119&1;r124=r122|r123;r125=r124<<2;r126=r119&2;r127=(r119&65535)>>>2;r128=r127&1;r129=r128|r126;r130=r129|r125;r131=(r119&65535)>>>3;r132=r130<<1;r133=r131&1;r134=r132|r133;r135=(r119&65535)>>>4;r136=r134<<1;r137=r135&1;r138=r136|r137;r139=(r119&65535)>>>5;r140=r138<<1;r141=r139&1;r142=r140|r141;r143=(r119&65535)>>>6;r144=r142<<1;r145=r143&1;r146=r144|r145;r147=(r119&65535)>>>7;r148=r146<<1;r149=r148|r147;r150=r149<<1;r151=r115&1;r152=r150|r151;r153=r152<<2;r154=r115&2;r155=(r115&65535)>>>2;r156=r155&1;r157=r156|r154;r158=r157|r153;r159=(r115&65535)>>>3;r160=r158<<1;r161=r159&1;r162=r160|r161;r163=(r115&65535)>>>4;r164=r162<<1;r165=r163&1;r166=r164|r165;r167=(r115&65535)>>>5;r168=r166<<1;r169=r167&1;r170=r168|r169;r171=(r115&65535)>>>6;r172=r170<<1;r173=r171&1;r174=r172|r173;r175=(r115&65535)>>>7;r176=r174<<1;r177=r176|r175;r178=r177&65535;r179=0;r180=0;r181=0;while(1){r182=(r179|0)!=8;r183=(r181|0)==0;r184=r182|r183;if(r184){r185=r181}else{_dasm_reginterval(r2,r180,r181,r9);r185=0}r186=1<<r179;r187=r186&r178;r188=(r187|0)==0;r189=(r185|0)==0;do{if(r188){if(r189){r190=0;r191=r180;break}_dasm_reginterval(r2,r180,r185,r9);r190=0;r191=r180}else{r192=r185+1|0;r193=r189?r179:r180;r190=r192;r191=r193}}while(0);r194=r179+1|0;r195=r194>>>0<16;if(r195){r179=r194;r180=r191;r181=r190}else{break}}r196=(r190|0)==0;if(!r196){_dasm_reginterval(r2,r191,r190,r9)}r197=r1+8|0;r198=HEAP32[r197>>2];r199=r198+1|0;HEAP32[r197>>2]=r199;STACKTOP=r8;return;break};case 21:{r200=r1+4|0;r201=HEAP32[r200>>2];r202=r201+2|0;r203=r3+1|0;r204=HEAP8[r203];r205=r204&255;r206=r205&128;r207=(r206|0)!=0;r208=r205|-256;r209=r207?r208:r205;r210=r202+r209|0;r211=_sprintf(r2,32112,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r210,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 22:{r212=r1+8|0;r213=HEAP32[r212>>2];r214=r213<<1;r215=r3+r214|0;r216=HEAP8[r215];r217=r216&255;r218=r217<<8;r219=r214|1;r220=r3+r219|0;r221=HEAP8[r220];r222=r221&255;r223=r218|r222;r224=r213+1|0;HEAP32[r212>>2]=r224;r225=r1+4|0;r226=HEAP32[r225>>2];r227=r226+2|0;r228=r223&65535;r229=r228&32768;r230=(r229|0)!=0;r231=r228|-65536;r232=r230?r231:r228;r233=r227+r232|0;r234=_sprintf(r2,32112,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r233,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 3:{r235=r3+1|0;r236=HEAP8[r235];r237=r236&255;r238=r237&63;_dasm_ea(r1,r2,r3,r238,r5);STACKTOP=r8;return;break};case 8:{r239=HEAP8[r3];r240=r239&255;r241=r240>>>1;r242=r241&7;r243=_sprintf(r2,25280,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r242,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 23:{r244=r1+8|0;r245=HEAP32[r244>>2];r246=r245<<1;r247=r3+r246|0;r248=HEAP8[r247];r249=r248&255;r250=r249<<8;r251=r246|1;r252=r3+r251|0;r253=HEAP8[r252];r254=r253&255;r255=r250|r254;r256=r255<<8;r257=r246+2|0;r258=r3+r257|0;r259=HEAP8[r258];r260=r259&255;r261=r256|r260;r262=r261<<8;r263=r246+3|0;r264=r3+r263|0;r265=HEAP8[r264];r266=r265&255;r267=r262|r266;r268=r245+2|0;HEAP32[r244>>2]=r268;r269=r1+4|0;r270=HEAP32[r269>>2];r271=r270+2|0;r272=r271+r267|0;r273=_sprintf(r2,32112,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r272,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 24:{r274=r3+2|0;r275=HEAP8[r274];r276=r275&255;r277=r276<<8;r278=r3+3|0;r279=HEAP8[r278];r280=r279&255;r281=r277|r280;r282=r10;HEAP32[r10>>2]=1;HEAP8[r2]=0;r283=r281&65535;r284=0;r285=0;r286=0;while(1){r287=(r284|0)!=8;r288=(r286|0)==0;r289=r287|r288;if(r289){r290=r286}else{_dasm_reginterval(r2,r285,r286,r10);r290=0}r291=1<<r284;r292=r291&r283;r293=(r292|0)==0;r294=(r290|0)==0;do{if(r293){if(r294){r295=0;r296=r285;break}_dasm_reginterval(r2,r285,r290,r10);r295=0;r296=r285}else{r297=r290+1|0;r298=r294?r284:r285;r295=r297;r296=r298}}while(0);r299=r284+1|0;r300=r299>>>0<16;if(r300){r284=r299;r285=r296;r286=r295}else{break}}r301=(r295|0)==0;if(!r301){_dasm_reginterval(r2,r296,r295,r10)}r302=r1+8|0;r303=HEAP32[r302>>2];r304=r303+1|0;HEAP32[r302>>2]=r304;STACKTOP=r8;return;break};case 6:{r305=HEAP8[r3];r306=r305&255;r307=r306>>>1;r308=r307&7;r309=_sprintf(r2,27128,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r308,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 19:{r310=r1+12|0;r311=HEAP16[r310>>1];r312=r311&65535;r313=r312&15;r314=_sprintf(r2,33240,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r313,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 20:{r315=r1+12|0;r316=HEAP16[r315>>1];r317=r316&65535;r318=r317&128;r319=(r318|0)!=0;r320=r317|-256;r321=r317&255;r322=r319?r320:r321;r323=_sprintf(r2,32776,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r322,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 7:{r324=r1+12|0;r325=HEAP16[r324>>1];r326=r325&65535;r327=r326&7;r328=_sprintf(r2,25280,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r327,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 9:{r329=r3+2|0;r330=HEAP8[r329];r331=r330&255;r332=r331&128;r333=(r332|0)!=0;r334=r333?22824:21576;r335=r331>>>4;r336=r335&7;r337=_sprintf(r2,23816,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=r334,HEAP32[r7+8>>2]=r336,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 18:{r338=HEAP8[r3];r339=r338&255;r340=(r339&65535)>>>1;r341=r340&7;r342=r341<<16>>16==0;r343=r341&65535;r344=r342?8:r343;r345=_sprintf(r2,32432,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r344,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 13:{r346=r1+12|0;r347=HEAP16[r346>>1];r348=r347&65535;r349=r348>>>9;r350=r349&7;r351=_sprintf(r2,19448,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r350,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 5:{r352=r1+12|0;r353=HEAP16[r352>>1];r354=r353&65535;r355=r354&7;r356=_sprintf(r2,27128,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r355,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 33:{r357=r1+8|0;r358=HEAP32[r357>>2];r359=r358<<1;r360=r3+r359|0;r361=HEAP8[r360];r362=r361&255;r363=r362<<8;r364=r359|1;r365=r3+r364|0;r366=HEAP8[r365];r367=r366&255;r368=r363|r367;r369=r358+1|0;HEAP32[r357>>2]=r369;r370=r1+12+(r369<<1)|0;HEAP16[r370>>1]=r368;r371=r3+1|0;r372=HEAP8[r371];r373=r372&255;r374=r373&63;_dasm_ea(r1,r2,r3,r374,8);r375=_strlen(r2);r376=r2+r375|0;r377=r375+1|0;r378=r2+r377|0;HEAP8[r376]=32;r379=r375+2|0;r380=r2+r379|0;HEAP8[r378]=123;r381=r1+14|0;r382=HEAP16[r381>>1];r383=r382&65535;r384=r383&2048;r385=(r384|0)==0;r386=r383>>>6;if(r385){r387=r386&31;r388=_sprintf(r380,30120,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r387,r7));STACKTOP=r7}else{r389=r386&7;r390=_sprintf(r380,27128,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r389,r7));STACKTOP=r7}r391=_strlen(r380);r392=r391+r379|0;r393=r2+r392|0;r394=r392+1|0;r395=r2+r394|0;HEAP8[r393]=58;r396=HEAP16[r381>>1];r397=r396&65535;r398=r397&31;r399=(r398|0)==0;r400=r399?32:r398;r401=r396&32;r402=r401<<16>>16==0;if(r402){r403=_sprintf(r395,30120,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r400,r7));STACKTOP=r7}else{r404=r400&7;r405=_sprintf(r395,27128,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r404,r7));STACKTOP=r7}r406=_strlen(r395);r407=r406+r394|0;r408=r2+r407|0;r409=r408;tempBigInt=125;HEAP8[r409]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r409+1|0]=tempBigInt;STACKTOP=r8;return;break};case 17:{r410=r3+2|0;r411=HEAP8[r410];r412=r411&255;r413=r412<<8;r414=r3+3|0;r415=HEAP8[r414];r416=r415&255;r417=r413|r416;r418=r417<<8;r419=r3+4|0;r420=HEAP8[r419];r421=r420&255;r422=r418|r421;r423=r422<<8;r424=r3+5|0;r425=HEAP8[r424];r426=r425&255;r427=r423|r426;r428=_sprintf(r2,32776,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r427,r7));STACKTOP=r7;r429=r1+8|0;r430=HEAP32[r429>>2];r431=r430+2|0;HEAP32[r429>>2]=r431;STACKTOP=r8;return;break};case 1:{r432=HEAP8[r3];r433=r432&255;r434=r433<<8;r435=r3+1|0;r436=HEAP8[r435];r437=r436&255;r438=r434|r437;r439=r438&65535;r440=_sprintf(r2,29456,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r439,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 26:{r441=r2;tempBigInt=5391171;HEAP8[r441]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r441+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r441+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r441+3|0]=tempBigInt;STACKTOP=r8;return;break};case 27:{HEAP8[r2]=HEAP8[31424];HEAP8[r2+1|0]=HEAP8[31425];HEAP8[r2+2|0]=HEAP8[31426];STACKTOP=r8;return;break};case 29:{r442=r3+2|0;r443=HEAP8[r442];r444=r443&255;r445=r444<<8;r446=r3+3|0;r447=HEAP8[r446];r448=r447&255;r449=r445|r448;r450=r449&65535;r451=r450&4095;if((r451|0)==2048){r452=r1|0;r453=HEAP32[r452>>2];r454=r453|64;HEAP32[r452>>2]=r454;r455=30920}else if((r451|0)==0){r456=r1|0;r457=HEAP32[r456>>2];r458=r457|64;HEAP32[r456>>2]=r458;r455=29448}else if((r451|0)==1){r459=r1|0;r460=HEAP32[r459>>2];r461=r460|64;HEAP32[r459>>2]=r461;r455=29248}else if((r451|0)==2049){r462=r1|0;r463=HEAP32[r462>>2];r464=r463|64;HEAP32[r462>>2]=r464;r455=28992}else{r465=_sprintf(r2,28800,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r451,r7));STACKTOP=r7;r466=r1|0;r467=HEAP32[r466>>2];r468=r467|64;HEAP32[r466>>2]=r468;STACKTOP=r8;return}r469=r455;r470=r2;r471=HEAPU8[r469]|HEAPU8[r469+1|0]<<8|HEAPU8[r469+2|0]<<16|HEAPU8[r469+3|0]<<24|0;tempBigInt=r471;HEAP8[r470]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r470+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r470+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r470+3|0]=tempBigInt;STACKTOP=r8;return;break};case 28:{r472=r2;tempBigInt=5264213;HEAP8[r472]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r472+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r472+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r472+3|0]=tempBigInt;STACKTOP=r8;return;break};default:{HEAP8[r2]=0;STACKTOP=r8;return}}}function _dasm_ea(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252;r6=0;r7=0;r8=STACKTOP;r9=r4>>>3;r10=r9&7;switch(r10|0){case 6:{r11=r1+8|0;r12=HEAP32[r11>>2];r13=r12<<1;r14=r3+r13|0;r15=HEAP8[r14];r16=r15&255;r17=r16<<8;r18=r13|1;r19=r3+r18|0;r20=HEAP8[r19];r21=r20&255;r22=r17|r21;r23=r22&65535;r24=r12+1|0;HEAP32[r11>>2]=r24;r25=r23&256;r26=(r25|0)==0;if(!r26){_dasm_ea_full(r1,r2,r3);STACKTOP=r8;return}r27=r23&128;r28=(r27|0)!=0;r29=r28?34344:40472;r30=-r23|0;r31=r28?r30:r23;r32=r31&255;r33=r4&7;r34=r23&32768;r35=(r34|0)!=0;r36=r35?22824:21576;r37=r23>>>12;r38=r37&7;r39=r23&2048;r40=(r39|0)!=0;r41=r40?27256:27120;r42=r23>>>9;r43=r42&3;r44=1<<r43;r45=_sprintf(r2,27584,(r7=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r7>>2]=r29,HEAP32[r7+8>>2]=25192,HEAP32[r7+16>>2]=r32,HEAP32[r7+24>>2]=r33,HEAP32[r7+32>>2]=r36,HEAP32[r7+40>>2]=r38,HEAP32[r7+48>>2]=r41,HEAP32[r7+56>>2]=r44,r7));STACKTOP=r7;r46=r23&1536;r47=(r46|0)==0;if(r47){STACKTOP=r8;return}r48=r1|0;r49=HEAP32[r48>>2];r50=r49|128;HEAP32[r48>>2]=r50;STACKTOP=r8;return;break};case 4:{r51=r4&7;r52=_sprintf(r2,19448,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r51,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 5:{r53=r1+8|0;r54=HEAP32[r53>>2];r55=r54<<1;r56=r3+r55|0;r57=HEAP8[r56];r58=r57&255;r59=r58<<8;r60=r55|1;r61=r3+r60|0;r62=HEAP8[r61];r63=r62&255;r64=r59|r63;r65=r64&65535;r66=r54+1|0;HEAP32[r53>>2]=r66;r67=r65&32768;r68=(r67|0)!=0;r69=r68?34344:40472;r70=-r65|0;r71=r68?r70:r65;r72=r71&65535;r73=r4&7;r74=_sprintf(r2,35376,(r7=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r7>>2]=r69,HEAP32[r7+8>>2]=25192,HEAP32[r7+16>>2]=r72,HEAP32[r7+24>>2]=r73,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 0:{r75=r4&7;r76=_sprintf(r2,27128,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r75,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 2:{r77=r4&7;r78=_sprintf(r2,28024,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r77,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 1:{r79=r4&7;r80=_sprintf(r2,25280,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r79,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 3:{r81=r4&7;r82=_sprintf(r2,20648,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r81,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 7:{r83=r4&7;switch(r83|0){case 1:{r84=r1+8|0;r85=HEAP32[r84>>2];r86=r85<<1;r87=r3+r86|0;r88=HEAP8[r87];r89=r88&255;r90=r89<<8;r91=r86|1;r92=r3+r91|0;r93=HEAP8[r92];r94=r93&255;r95=r90|r94;r96=r95&65535;r97=r85+1|0;HEAP32[r84>>2]=r97;r98=r97<<1;r99=r3+r98|0;r100=HEAP8[r99];r101=r100&255;r102=r101<<8;r103=r98|1;r104=r3+r103|0;r105=HEAP8[r104];r106=r105&255;r107=r102|r106;r108=r107&65535;r109=r85+2|0;HEAP32[r84>>2]=r109;r110=r96<<16;r111=r108|r110;r112=_sprintf(r2,32112,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r111,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 2:{r113=r1+8|0;r114=HEAP32[r113>>2];r115=r114<<1;r116=r3+r115|0;r117=HEAP8[r116];r118=r117&255;r119=r118<<8;r120=r115|1;r121=r3+r120|0;r122=HEAP8[r121];r123=r122&255;r124=r119|r123;r125=r124&65535;r126=r114+1|0;HEAP32[r113>>2]=r126;r127=r1+4|0;r128=HEAP32[r127>>2];r129=r125&32768;r130=(r129|0)!=0;r131=r125|-65536;r132=r130?r131:r125;r133=r128+2|0;r134=r133+r132|0;r135=_sprintf(r2,26776,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r134,r7));STACKTOP=r7;STACKTOP=r8;return;break};case 3:{r136=r1+8|0;r137=HEAP32[r136>>2];r138=r137<<1;r139=r3+r138|0;r140=HEAP8[r139];r141=r140&255;r142=r141<<8;r143=r138|1;r144=r3+r143|0;r145=HEAP8[r144];r146=r145&255;r147=r142|r146;r148=r147&65535;r149=r137+1|0;HEAP32[r136>>2]=r149;r150=r148&256;r151=(r150|0)==0;if(!r151){_dasm_ea_full(r1,r2,r3);STACKTOP=r8;return}r152=r148&128;r153=(r152|0)!=0;r154=r153?34344:40472;r155=-r148|0;r156=r153?r155:r148;r157=r156&255;r158=r148&32768;r159=(r158|0)!=0;r160=r159?22824:21576;r161=r148>>>12;r162=r161&7;r163=r148&2048;r164=(r163|0)!=0;r165=r164?27256:27120;r166=r148>>>9;r167=r166&3;r168=1<<r167;r169=_sprintf(r2,26576,(r7=STACKTOP,STACKTOP=STACKTOP+56|0,HEAP32[r7>>2]=r154,HEAP32[r7+8>>2]=25192,HEAP32[r7+16>>2]=r157,HEAP32[r7+24>>2]=r160,HEAP32[r7+32>>2]=r162,HEAP32[r7+40>>2]=r165,HEAP32[r7+48>>2]=r168,r7));STACKTOP=r7;r170=r148&1536;r171=(r170|0)==0;if(r171){STACKTOP=r8;return}r172=r1|0;r173=HEAP32[r172>>2];r174=r173|128;HEAP32[r172>>2]=r174;STACKTOP=r8;return;break};case 4:{if((r5|0)==8){r175=r1+8|0;r176=HEAP32[r175>>2];r177=r176<<1;r178=r177|1;r179=r3+r178|0;r180=HEAP8[r179];r181=r180&255;r182=r176+1|0;HEAP32[r175>>2]=r182;r183=_sprintf(r2,33240,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r181,r7));STACKTOP=r7;STACKTOP=r8;return}else if((r5|0)==16){r184=r1+8|0;r185=HEAP32[r184>>2];r186=r185<<1;r187=r3+r186|0;r188=HEAP8[r187];r189=r188&255;r190=r189<<8;r191=r186|1;r192=r3+r191|0;r193=HEAP8[r192];r194=r193&255;r195=r190|r194;r196=r195&65535;r197=r185+1|0;HEAP32[r184>>2]=r197;r198=_sprintf(r2,29456,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r196,r7));STACKTOP=r7;STACKTOP=r8;return}else if((r5|0)==32){r199=r1+8|0;r200=HEAP32[r199>>2];r201=r200<<1;r202=r3+r201|0;r203=HEAP8[r202];r204=r203&255;r205=r204<<8;r206=r201|1;r207=r3+r206|0;r208=HEAP8[r207];r209=r208&255;r210=r205|r209;r211=r210&65535;r212=r200+1|0;HEAP32[r199>>2]=r212;r213=r212<<1;r214=r3+r213|0;r215=HEAP8[r214];r216=r215&255;r217=r216<<8;r218=r213|1;r219=r3+r218|0;r220=HEAP8[r219];r221=r220&255;r222=r217|r221;r223=r222&65535;r224=r200+2|0;HEAP32[r199>>2]=r224;r225=r211<<16;r226=r223|r225;r227=_sprintf(r2,32776,(r7=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r7>>2]=25192,HEAP32[r7+8>>2]=r226,r7));STACKTOP=r7;STACKTOP=r8;return}else{STACKTOP=r8;return}break};case 0:{r228=r1+8|0;r229=HEAP32[r228>>2];r230=r229<<1;r231=r3+r230|0;r232=HEAP8[r231];r233=r232&255;r234=r233<<8;r235=r230|1;r236=r3+r235|0;r237=HEAP8[r236];r238=r237&255;r239=r234|r238;r240=r239&65535;r241=r229+1|0;HEAP32[r228>>2]=r241;r242=r240&32768;r243=(r242|0)!=0;r244=r243?34344:40472;r245=-r240|0;r246=r243?r245:r240;r247=r246&65535;r248=_sprintf(r2,26976,(r7=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r7>>2]=r244,HEAP32[r7+8>>2]=25192,HEAP32[r7+16>>2]=r247,r7));STACKTOP=r7;STACKTOP=r8;return;break};default:{r249=r4&63;r250=_sprintf(r2,26432,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r249,r7));STACKTOP=r7;STACKTOP=r8;return}}break};default:{r251=r4&63;r252=_sprintf(r2,26432,(r7=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r7>>2]=r251,r7));STACKTOP=r7;STACKTOP=r8;return}}}function _dasm_reginterval(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+32|0;r7=r6;r8=r2>>>0<8;r9=r8?r2:r2-8|0;r2=r8?21576:22824;if((HEAP32[r4>>2]|0)==0){r8=r1+_strlen(r1)|0;tempBigInt=47;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt}if(r3>>>0>2){_sprintf(r7|0,28512,(r5=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r9,HEAP32[r5+16>>2]=r2,HEAP32[r5+24>>2]=r3-1+r9,r5));STACKTOP=r5;r10=r7|0;r11=_strcat(r1,r10);HEAP32[r4>>2]=0;STACKTOP=r6;return}r8=r7|0;if((r3|0)==2){_sprintf(r8,28232,(r5=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r9,HEAP32[r5+16>>2]=r2,HEAP32[r5+24>>2]=r9+1,r5));STACKTOP=r5;r10=r7|0;r11=_strcat(r1,r10);HEAP32[r4>>2]=0;STACKTOP=r6;return}else{_sprintf(r8,23816,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r9,r5));STACKTOP=r5;r10=r7|0;r11=_strcat(r1,r10);HEAP32[r4>>2]=0;STACKTOP=r6;return}}function _dasm_ea_full(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;r7=r5+16;r8=r7|0;r9=STACKTOP;STACKTOP=STACKTOP+16|0;r10=r9|0;r11=STACKTOP;STACKTOP=STACKTOP+16|0;r12=r11|0;r13=STACKTOP;STACKTOP=STACKTOP+16|0;r14=HEAPU16[r1+14>>1];r15=(r14&64|0)==0;do{if((r14&128|0)==0){r16=HEAPU16[r1+12>>1];r17=r6;if((r16&56|0)==56){HEAP8[r17]=HEAP8[26272];HEAP8[r17+1|0]=HEAP8[26273];HEAP8[r17+2|0]=HEAP8[26274];break}else{_sprintf(r17,25280,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r16&7,r4));STACKTOP=r4;break}}else{HEAP16[r6>>1]=45}}while(0);if(r15){_sprintf(r7,26144,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=(r14&32768|0)!=0?22824:21576,HEAP32[r4+8>>2]=r14>>>12&7,HEAP32[r4+16>>2]=(r14&2048|0)!=0?27256:27120,r4));STACKTOP=r4}else{HEAP16[r8>>1]=45}r8=r14>>>9&3;r15=r13|0;if((r8|0)==0){HEAP8[r15]=0}else{_sprintf(r15,25984,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=1<<r8,r4));STACKTOP=r4}r8=r14>>>4&3;if((r8|0)==3){r13=r1+8|0;r16=HEAP32[r13>>2];r17=r16<<1;r18=(HEAPU8[r3+r17|0]<<8|HEAPU8[r3+(r17|1)|0])&65535;r17=r16+1|0;HEAP32[r13>>2]=r17;r19=r17<<1;r17=(HEAPU8[r3+r19|0]<<8|HEAPU8[r3+(r19|1)|0])&65535;HEAP32[r13>>2]=r16+2;r16=r17|r18<<16;r18=(r16|0)<0;_sprintf(r9,25688,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r18?34344:40472,HEAP32[r4+8>>2]=25192,HEAP32[r4+16>>2]=r18?-r16|0:r16,r4));STACKTOP=r4}else if((r8|0)==2){r16=r1+8|0;r18=HEAP32[r16>>2];r17=r18<<1;r13=(HEAPU8[r3+r17|0]<<8|HEAPU8[r3+(r17|1)|0])&65535;HEAP32[r16>>2]=r18+1;r18=(r13&32768|0)!=0;if(r18){r20=-r13&65535}else{r20=r13}_sprintf(r9,26976,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r18?34344:40472,HEAP32[r4+8>>2]=25192,HEAP32[r4+16>>2]=r20,r4));STACKTOP=r4}else if((r8|0)==0|(r8|0)==1){HEAP16[r10>>1]=45}r8=r14&3;if((r8|0)==2){r20=r1+8|0;r18=HEAP32[r20>>2];r9=r18<<1;r13=(HEAPU8[r3+r9|0]<<8|HEAPU8[r3+(r9|1)|0])&65535;HEAP32[r20>>2]=r18+1;r18=(r13&32768|0)!=0;if(r18){r21=-r13&65535}else{r21=r13}_sprintf(r11,26976,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r18?34344:40472,HEAP32[r4+8>>2]=25192,HEAP32[r4+16>>2]=r21,r4));STACKTOP=r4}else if((r8|0)==3){r21=r1+8|0;r18=HEAP32[r21>>2];r13=r18<<1;r20=(HEAPU8[r3+r13|0]<<8|HEAPU8[r3+(r13|1)|0])&65535;r13=r18+1|0;HEAP32[r21>>2]=r13;r9=r13<<1;r13=(HEAPU8[r3+r9|0]<<8|HEAPU8[r3+(r9|1)|0])&65535;HEAP32[r21>>2]=r18+2;r18=r13|r20<<16;r20=(r18|0)<0;_sprintf(r11,25688,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r20?34344:40472,HEAP32[r4+8>>2]=25192,HEAP32[r4+16>>2]=r20?-r18|0:r18,r4));STACKTOP=r4}else if((r8|0)==0|(r8|0)==1){HEAP16[r12>>1]=45}if((r14&4|0)==0){_sprintf(r2,25256,(r4=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r4>>2]=r6,HEAP32[r4+8>>2]=r10,HEAP32[r4+16>>2]=r7,HEAP32[r4+24>>2]=r15,HEAP32[r4+32>>2]=r12,r4));STACKTOP=r4;r22=r1|0;r23=HEAP32[r22>>2];r24=r23|128;HEAP32[r22>>2]=r24;STACKTOP=r5;return}else{_sprintf(r2,25432,(r4=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r4>>2]=r6,HEAP32[r4+8>>2]=r10,HEAP32[r4+16>>2]=r7,HEAP32[r4+24>>2]=r15,HEAP32[r4+32>>2]=r12,r4));STACKTOP=r4;r22=r1|0;r23=HEAP32[r22>>2];r24=r23|128;HEAP32[r22>>2]=r24;STACKTOP=r5;return}}function _e68_new(){var r1,r2,r3,r4,r5;r1=_malloc(4528);r2=r1;if((r1|0)==0){r3=0;return r3}r4=r1+334|0;_memset(r1,0,50)|0;_memset(r1+52|0,0,36)|0;HEAP8[r4]=1;HEAP8[r1+335|0]=2;HEAP32[r1+364>>2]=0;HEAP8[r1+368|0]=0;HEAP32[r1+372>>2]=1;HEAP32[r1+376>>2]=0;HEAP32[r1+380>>2]=0;HEAP32[r1+384>>2]=0;HEAP32[r1+388>>2]=25288;HEAP32[r1+392>>2]=0;HEAP32[r1+396>>2]=0;_e68_set_opcodes(r2);HEAP16[r1+166>>1]=8192;r5=r1+148|0;_memset(r1+88|0,0,64)|0;if((HEAP8[r4]|0)==0){HEAP32[r5>>2]=0;HEAP32[r1+172>>2]=0}else{HEAP32[r1+168>>2]=0;HEAP32[r5>>2]=0}HEAP32[r1+152>>2]=0;_memset(r1+176|0,0,156)|0;r3=r2;return r3}function _e68_set_mem_fct(r1,r2,r3,r4,r5,r6,r7,r8){HEAP32[r1+4>>2]=r2;HEAP32[r1+8>>2]=r3;HEAP32[r1+12>>2]=r4;HEAP32[r1+16>>2]=r5;HEAP32[r1+20>>2]=r6;HEAP32[r1+24>>2]=r7;HEAP32[r1+28>>2]=r8;return}function _e68_set_inta_fct(r1,r2,r3){HEAP32[r1+52>>2]=r2;HEAP32[r1+56>>2]=r3;return}function _e68_set_flags(r1,r2,r3){if((r3|0)==0){r3=r1|0;HEAP32[r3>>2]=HEAP32[r3>>2]&~r2;return}else{r3=r1|0;HEAP32[r3>>2]=HEAP32[r3>>2]|r2;return}}function _e68_set_68000(r1){HEAP32[r1>>2]=0;_e68_set_opcodes(r1);return}function _e68_set_68010(r1){HEAP32[r1>>2]=2;_e68_set_opcodes(r1);return}function _e68_set_68020(r1){HEAP32[r1>>2]=7;_e68_set_opcodes_020(r1);return}function _e68_get_opcnt(r1){return HEAP32[r1+392>>2]}function _e68_set_halt(r1,r2){HEAP8[r1+335|0]=r2&3;return}function _e68_set_bus_error(r1,r2){HEAP8[r1+336|0]=(r2|0)!=0|0;return}function _e68_get_exception_cnt(r1){return HEAP32[r1+376>>2]}function _e68_get_exception(r1){return HEAP32[r1+384>>2]}function _e68_get_exception_name(r1){return HEAP32[r1+388>>2]}function _e68_get_last_pc(r1,r2){var r3;if(r2>>>0>31){r3=0;return r3}r3=HEAP32[r1+200+((HEAP32[r1+196>>2]-r2&31)<<2)>>2];return r3}function _e68_get_last_trap_a(r1){return HEAP16[r1+328>>1]}function _e68_get_reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140;r4=0;r5=HEAP8[r2];r6=r5<<24>>24==37;r7=r2+1|0;r8=r6?r7:r2;r9=_strcmp(r8,32792);r10=(r9|0)==0;if(r10){r11=r1+152|0;r12=HEAP32[r11>>2];HEAP32[r3>>2]=r12;r13=0;return r13}r14=_strcmp(r8,29256);r15=(r14|0)==0;if(r15){r16=r1+196|0;r17=HEAP32[r16>>2];r18=r17&31;r19=r1+200+(r18<<2)|0;r20=HEAP32[r19>>2];HEAP32[r3>>2]=r20;r13=0;return r13}r21=HEAP8[r8];r22=r21<<24>>24==111;do{if(r22){r23=r8+1|0;r24=HEAP8[r23];r25=r24<<24>>24==112;if(!r25){break}r26=r8+2|0;r27=HEAP8[r26];r28=r27-48&255;r29=(r28&255)<10;if(r29){r30=r8;r31=0;r32=r27;while(1){r33=r32<<24>>24;r34=r31*10&-1;r35=r34-48|0;r36=r35+r33|0;r37=r30+1|0;r38=r30+3|0;r39=HEAP8[r38];r40=r39-48&255;r41=(r40&255)<10;if(r41){r30=r37;r31=r36;r32=r39}else{break}}r42=r36<<1;r43=r42;r44=r39}else{r43=0;r44=r27}r45=r44<<24>>24==0;if(!r45){r13=1;return r13}r46=r1+152|0;r47=HEAP32[r46>>2];r48=r47+r43|0;r49=r48&16777215;r50=r49+1|0;r51=r1+36|0;r52=HEAP32[r51>>2];r53=r50>>>0<r52>>>0;if(r53){r54=r1+32|0;r55=HEAP32[r54>>2];r56=r55+r49|0;r57=HEAP8[r56];r58=r57&255;r59=r58<<8;r60=r55+r50|0;r61=HEAP8[r60];r62=r61&255;r63=r59|r62;r64=r63}else{r65=r1+12|0;r66=HEAP32[r65>>2];r67=r1+4|0;r68=HEAP32[r67>>2];r69=FUNCTION_TABLE[r66](r68,r49);r64=r69}r70=r64&65535;HEAP32[r3>>2]=r70;r13=0;return r13}}while(0);r71=_strcmp(r8,26992);r72=(r71|0)==0;if(r72){r73=r1+166|0;r74=HEAP16[r73>>1];r75=r74&65535;HEAP32[r3>>2]=r75;r13=0;return r13}r76=_strcmp(r8,25200);r77=(r76|0)==0;if(r77){r78=r1+148|0;r79=HEAP32[r78>>2];HEAP32[r3>>2]=r79;r13=0;return r13}r80=_strcmp(r8,23760);r81=(r80|0)==0;if(r81){r82=r1+166|0;r83=HEAP16[r82>>1];r84=r83&65535;r85=r84&255;HEAP32[r3>>2]=r85;r13=0;return r13}r86=_strcmp(r8,22728);r87=(r86|0)==0;if(r87){r88=r1+334|0;r89=HEAP8[r88];r90=r89<<24>>24==0;r91=r1+168|0;r92=r1+148|0;r93=r90?r92:r91;r94=HEAP32[r93>>2];HEAP32[r3>>2]=r94;r13=0;return r13}r95=_strcmp(r8,21464);r96=(r95|0)==0;if(r96){r97=r1+334|0;r98=HEAP8[r97];r99=r98<<24>>24==0;r100=r1+148|0;r101=r1+172|0;r102=r99?r101:r100;r103=HEAP32[r102>>2];HEAP32[r3>>2]=r103;r13=0;return r13}if(r21<<24>>24==100|r21<<24>>24==68){r104=100}else if(r21<<24>>24==97|r21<<24>>24==65){r104=97}else{r13=1;return r13}r105=r8+1|0;r106=HEAP8[r105];r107=r106-48&255;r108=(r107&255)<10;if(r108){r109=0;r110=r105;r111=r106;while(1){r112=r111<<24>>24;r113=r109*10&-1;r114=r113-48|0;r115=r114+r112|0;r116=r110+1|0;r117=HEAP8[r116];r118=r117-48&255;r119=(r118&255)<10;if(r119){r109=r115;r110=r116;r111=r117}else{break}}r120=r115&7;r121=r110;r122=r120;r123=r116}else{r121=r8;r122=0;r123=r105}r124=(r104|0)==97;if(r124){r125=r1+120+(r122<<2)|0;r126=r125}else{r127=r1+88+(r122<<2)|0;r126=r127}r128=HEAP32[r126>>2];HEAP32[r3>>2]=r128;r129=HEAP8[r123];r130=r129<<24>>24==46;if(r130){r131=r121+2|0;r132=HEAP8[r131];r133=r132<<24>>24;switch(r133|0){case 98:case 66:{r134=r128&255;HEAP32[r3>>2]=r134;break};case 119:case 87:{r135=r128&65535;HEAP32[r3>>2]=r135;break};case 108:case 76:{break};default:{r13=1;return r13}}r136=r121+3|0;r137=HEAP8[r136];r138=r137}else{r138=r129}r139=r138<<24>>24!=0;r140=r139&1;r13=r140;return r13}function _e68_set_reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106;r4=0;r5=HEAP8[r2];r6=r5<<24>>24==37;r7=r2+1|0;r8=r6?r7:r2;r9=_strcmp(r8,32792);r10=(r9|0)==0;if(r10){_e68_set_pc_prefetch(r1,r3);r11=0;return r11}r12=_strcmp(r8,26992);r13=(r12|0)==0;if(r13){r14=r3&65535;r15=r1+166|0;r16=HEAP16[r15>>1];r17=r16^r14;r18=r17&8192;r19=r18<<16>>16==0;if(!r19){r20=r14&8192;r21=r1+334|0;r22=HEAP8[r21];r23=r22<<24>>24==0;r24=r1+148|0;r25=HEAP32[r24>>2];if(r23){r26=r1+168|0;HEAP32[r26>>2]=r25;r27=r1+172|0;r28=r26;r29=r27}else{r30=r1+172|0;HEAP32[r30>>2]=r25;r31=r1+168|0;r28=r31;r29=r30}r32=r20<<16>>16!=0;r33=r32?r29:r28;r34=HEAP32[r33>>2];HEAP32[r24>>2]=r34;r35=(r20&65535)>>>13;r36=r35&255;HEAP8[r21]=r36}r37=r14&-22753;HEAP16[r15>>1]=r37;r11=0;return r11}r38=_strcmp(r8,25200);r39=(r38|0)==0;if(r39){r40=r1+148|0;HEAP32[r40>>2]=r3;r11=0;return r11}r41=_strcmp(r8,23760);r42=(r41|0)==0;if(r42){r43=r1+166|0;r44=HEAP16[r43>>1];r45=r44&-256;r46=r3&65535;r47=r46&255;r48=r45|r47;HEAP16[r43>>1]=r48;r11=0;return r11}r49=_strcmp(r8,22728);r50=(r49|0)==0;if(r50){r51=r1+334|0;r52=HEAP8[r51];r53=r52<<24>>24==0;if(r53){r54=r1+148|0;HEAP32[r54>>2]=r3;r11=0;return r11}else{r55=r1+168|0;HEAP32[r55>>2]=r3;r11=0;return r11}}r56=_strcmp(r8,21464);r57=(r56|0)==0;if(r57){r58=r1+334|0;r59=HEAP8[r58];r60=r59<<24>>24==0;if(r60){r61=r1+172|0;HEAP32[r61>>2]=r3;r11=0;return r11}else{r62=r1+148|0;HEAP32[r62>>2]=r3;r11=0;return r11}}r63=HEAP8[r8];if(r63<<24>>24==100|r63<<24>>24==68){r64=100}else if(r63<<24>>24==97|r63<<24>>24==65){r64=97}else{r11=1;return r11}r65=r8+1|0;r66=HEAP8[r65];r67=r66-48&255;r68=(r67&255)<10;if(r68){r69=0;r70=r65;r71=r66;while(1){r72=r69*10&-1;r73=r71<<24>>24;r74=r72-48|0;r75=r74+r73|0;r76=r70+1|0;r77=HEAP8[r76];r78=r77-48&255;r79=(r78&255)<10;if(r79){r69=r75;r70=r76;r71=r77}else{break}}r80=r75&7;r81=r70;r82=r80;r83=r77}else{r81=r8;r82=0;r83=r66}r84=r83<<24>>24==46;if(r84){r85=r81+2|0;r86=HEAP8[r85];r87=r86<<24>>24;switch(r87|0){case 119:case 87:{r88=65535;break};case 108:case 76:{r88=-1;break};case 98:case 66:{r88=255;break};default:{r11=1;return r11}}r89=r81+3|0;r90=HEAP8[r89];r91=r88;r92=r90}else{r91=-1;r92=r83}r93=r92<<24>>24==0;if(!r93){r11=1;return r11}r94=(r64|0)==97;if(r94){r95=r1+120+(r82<<2)|0;r96=HEAP32[r95>>2];r97=~r91;r98=r96&r97;r99=r91&r3;r100=r98|r99;HEAP32[r95>>2]=r100;r11=0;return r11}else{r101=r1+88+(r82<<2)|0;r102=HEAP32[r101>>2];r103=~r91;r104=r102&r103;r105=r91&r3;r106=r104|r105;HEAP32[r101>>2]=r106;r11=0;return r11}}function _e68_set_pc_prefetch(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=r1+156|0;HEAP32[r3>>2]=r2;do{if((r2&1|0)==0){r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r2&16777215;r6=r5+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r5|0]<<8|HEAPU8[r7+r6|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;break}else{_e68_exception_bus(r1);break}}else{_e68_exception_address(r1,r2,0,0)}}while(0);r8=HEAP32[r3>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);r9=r1+152|0;HEAP32[r9>>2]=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r8&16777215;r8=r5+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r10=HEAPU8[r6+r5|0]<<8|HEAPU8[r6+r8|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=r2;return}else{_e68_exception_bus(r1);r9=r1+152|0;HEAP32[r9>>2]=r2;return}}function _e68_set_sr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=r1+166|0;if(((HEAP16[r3>>1]^r2)&8192)==0){r4=r2&-22753;HEAP16[r3>>1]=r4;return}r5=r2&8192;r6=r1+334|0;r7=r1+148|0;r8=HEAP32[r7>>2];if((HEAP8[r6]|0)==0){r9=r1+168|0;HEAP32[r9>>2]=r8;r10=r9;r11=r1+172|0}else{r9=r1+172|0;HEAP32[r9>>2]=r8;r10=r1+168|0;r11=r9}HEAP32[r7>>2]=HEAP32[(r5<<16>>16!=0?r11:r10)>>2];HEAP8[r6]=(r5&65535)>>>13;r4=r2&-22753;HEAP16[r3>>1]=r4;return}function _e68_exception_reset(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=r1+376|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;r2=r1+152|0;HEAP32[r1+380>>2]=HEAP32[r2>>2];HEAP32[r1+384>>2]=0;HEAP32[r1+388>>2]=20608;r3=r1+166|0;if((HEAP16[r3>>1]&8192)==0){r4=r1+334|0;r5=r1+148|0;r6=HEAP32[r5>>2];if((HEAP8[r4]|0)==0){HEAP32[r1+168>>2]=r6;r7=HEAP32[r1+172>>2]}else{HEAP32[r1+172>>2]=r6;r7=r6}HEAP32[r5>>2]=r7;HEAP8[r4]=1}HEAP16[r3>>1]=9984;r3=r1+36|0;r4=HEAP32[r3>>2];if(r4>>>0>3){r7=HEAP32[r1+32>>2];r8=((HEAPU8[r7]<<8|HEAPU8[r7+1|0])<<8|HEAPU8[r7+2|0])<<8|HEAPU8[r7+3|0];r9=r4}else{r4=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],0);r8=r4;r9=HEAP32[r3>>2]}HEAP32[r1+148>>2]=r8;if(r9>>>0>7){r9=HEAP32[r1+32>>2];r10=((HEAPU8[r9+4|0]<<8|HEAPU8[r9+5|0])<<8|HEAPU8[r9+6|0])<<8|HEAPU8[r9+7|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],4)}r9=r1+156|0;HEAP32[r9>>2]=r10;do{if((r10&1|0)==0){r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r4=r10&16777215;r7=r4+1|0;if(r7>>>0<HEAP32[r3>>2]>>>0){r5=HEAP32[r1+32>>2];r11=HEAPU8[r5+r4|0]<<8|HEAPU8[r5+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;HEAP32[r2>>2]=HEAP32[r2>>2]+2;break}else{_e68_exception_bus(r1);break}}else{_e68_exception_address(r1,r10,0,0)}}while(0);r10=HEAP32[r9>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);r12=HEAP32[r9>>2];r13=r12-4|0;HEAP32[r2>>2]=r13;r14=r1+372|0;r15=HEAP32[r14>>2];r16=r15+64|0;HEAP32[r14>>2]=r16;return}r11=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r11>>1];r8=r10&16777215;r10=r8+1|0;if(r10>>>0<HEAP32[r3>>2]>>>0){r3=HEAP32[r1+32>>2];r17=HEAPU8[r3+r8|0]<<8|HEAPU8[r3+r10|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r11>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;HEAP32[r2>>2]=HEAP32[r2>>2]+2;r12=HEAP32[r9>>2];r13=r12-4|0;HEAP32[r2>>2]=r13;r14=r1+372|0;r15=HEAP32[r14>>2];r16=r15+64|0;HEAP32[r14>>2]=r16;return}else{_e68_exception_bus(r1);r12=HEAP32[r9>>2];r13=r12-4|0;HEAP32[r2>>2]=r13;r14=r1+372|0;r15=HEAP32[r14>>2];r16=r15+64|0;HEAP32[r14>>2]=r16;return}}function _e68_exception_bus(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;HEAP8[r1+336|0]=0;_e68_exception(r1,2,0,19416);r2=r1+148|0;r3=HEAP32[r2>>2];r4=r3-4|0;r5=r4&16777215;r6=r5+3|0;r7=r1+36|0;if(r6>>>0<HEAP32[r7>>2]>>>0){r8=r1+32|0;HEAP8[HEAP32[r8>>2]+r5|0]=0;HEAP8[HEAP32[r8>>2]+(r5+1)|0]=0;HEAP8[HEAP32[r8>>2]+(r5+2)|0]=0;HEAP8[HEAP32[r8>>2]+r6|0]=0}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r5,0)}HEAP32[r2>>2]=r4;r4=r3-8|0;r3=r4&16777215;r5=r3+3|0;if(r5>>>0<HEAP32[r7>>2]>>>0){r7=r1+32|0;HEAP8[HEAP32[r7>>2]+r3|0]=0;HEAP8[HEAP32[r7>>2]+(r3+1)|0]=0;HEAP8[HEAP32[r7>>2]+(r3+2)|0]=0;HEAP8[HEAP32[r7>>2]+r5|0]=0;HEAP32[r2>>2]=r4;r9=r1+372|0;r10=HEAP32[r9>>2];r11=r10+62|0;HEAP32[r9>>2]=r11;return}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r3,0);HEAP32[r2>>2]=r4;r9=r1+372|0;r10=HEAP32[r9>>2];r11=r10+62|0;HEAP32[r9>>2]=r11;return}}function _e68_exception(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r5=r2&255;r2=r1+376|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;r2=r1+152|0;HEAP32[r1+380>>2]=HEAP32[r2>>2];HEAP32[r1+384>>2]=r5;HEAP32[r1+388>>2]=r4;r4=HEAP32[r1+80>>2];if((r4|0)!=0){FUNCTION_TABLE[r4](HEAP32[r1+68>>2],r5)}if((r5|0)!=7&(r5-32|0)>>>0>15){HEAP16[r1+332>>1]=0}r4=r1+166|0;r6=HEAP16[r4>>1];r7=r6&1823|8192;if((r6&8192)==0){r8=r1+334|0;r9=r1+148|0;r10=HEAP32[r9>>2];if((HEAP8[r8]|0)==0){HEAP32[r1+168>>2]=r10;r11=HEAP32[r1+172>>2]}else{HEAP32[r1+172>>2]=r10;r11=r10}HEAP32[r9>>2]=r11;HEAP8[r8]=1}HEAP16[r4>>1]=r7;if((HEAP32[r1>>2]&2|0)==0){r12=HEAP32[r1+148>>2];r13=r1+36|0}else{r7=r5<<2;r4=(r3<<12|r7)&65535;r3=r1+148|0;r8=HEAP32[r3>>2]-2|0;r11=r8&16777215;r9=r11+1|0;r10=r1+36|0;if(r9>>>0<HEAP32[r10>>2]>>>0){r14=r1+32|0;HEAP8[HEAP32[r14>>2]+r11|0]=(r4&65535)>>>8;HEAP8[HEAP32[r14>>2]+r9|0]=r7}else{FUNCTION_TABLE[HEAP32[r1+24>>2]](HEAP32[r1+4>>2],r11,r4)}HEAP32[r3>>2]=r8;r12=r8;r13=r10}r10=HEAP32[r2>>2];r8=r1+148|0;r3=r12-4|0;r4=r3&16777215;r11=r4+3|0;if(r11>>>0<HEAP32[r13>>2]>>>0){r7=r1+32|0;HEAP8[HEAP32[r7>>2]+r4|0]=r10>>>24;HEAP8[HEAP32[r7>>2]+(r4+1)|0]=r10>>>16;HEAP8[HEAP32[r7>>2]+(r4+2)|0]=r10>>>8;HEAP8[HEAP32[r7>>2]+r11|0]=r10}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r4,r10)}HEAP32[r8>>2]=r3;r3=r12-6|0;r12=r3&16777215;r10=r12+1|0;if(r10>>>0<HEAP32[r13>>2]>>>0){r4=r1+32|0;HEAP8[HEAP32[r4>>2]+r12|0]=(r6&65535)>>>8;HEAP8[HEAP32[r4>>2]+r10|0]=r6}else{FUNCTION_TABLE[HEAP32[r1+24>>2]](HEAP32[r1+4>>2],r12,r6)}HEAP32[r8>>2]=r3;r3=HEAP32[r1+176>>2]+(r5<<2)&16777215;r5=r3+3|0;if(r5>>>0<HEAP32[r13>>2]>>>0){r8=HEAP32[r1+32>>2];r15=((HEAPU8[r8+r3|0]<<8|HEAPU8[r8+(r3+1)|0])<<8|HEAPU8[r8+(r3+2)|0])<<8|HEAPU8[r8+r5|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+16>>2]](HEAP32[r1+4>>2],r3)}r3=r1+156|0;HEAP32[r3>>2]=r15;do{if((r15&1|0)==0){r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r8=r15&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r13>>2]>>>0){r12=HEAP32[r1+32>>2];r16=HEAPU8[r12+r8|0]<<8|HEAPU8[r12+r6|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r5>>1]=r16;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r2>>2]=HEAP32[r2>>2]+2;break}else{_e68_exception_bus(r1);break}}else{_e68_exception_address(r1,r15,0,0)}}while(0);r16=HEAP32[r3>>2];if((r16&1|0)!=0){_e68_exception_address(r1,r16,0,0);HEAP32[r2>>2]=r15;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r8=r16&16777215;r16=r8+1|0;if(r16>>>0<HEAP32[r13>>2]>>>0){r13=HEAP32[r1+32>>2];r17=HEAPU8[r13+r8|0]<<8|HEAPU8[r13+r16|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r5>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r2>>2]=HEAP32[r2>>2]+2;HEAP32[r2>>2]=r15;return}else{_e68_exception_bus(r1);HEAP32[r2>>2]=r15;return}}function _e68_exception_address(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;_e68_exception(r1,3,8,35344);r5=HEAP16[r1+160>>1];r6=r1+148|0;r7=HEAP32[r6>>2];r8=r7-2|0;r9=r8&16777215;r10=r9+1|0;r11=r1+36|0;if(r10>>>0<HEAP32[r11>>2]>>>0){r12=r1+32|0;HEAP8[HEAP32[r12>>2]+r9|0]=(r5&65535)>>>8;HEAP8[HEAP32[r12>>2]+r10|0]=r5}else{FUNCTION_TABLE[HEAP32[r1+24>>2]](HEAP32[r1+4>>2],r9,r5)}HEAP32[r6>>2]=r8;r8=r7-6|0;r5=r8&16777215;r9=r5+3|0;if(r9>>>0<HEAP32[r11>>2]>>>0){r10=r1+32|0;HEAP8[HEAP32[r10>>2]+r5|0]=r2>>>24;HEAP8[HEAP32[r10>>2]+(r5+1)|0]=r2>>>16;HEAP8[HEAP32[r10>>2]+(r5+2)|0]=r2>>>8;HEAP8[HEAP32[r10>>2]+r9|0]=r2}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r5,r2)}HEAP32[r6>>2]=r8;r8=(r4|0)==0?16:0;r4=(r3|0)==0?r8:r8|8;r8=r7-8|0;r7=r8&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r11>>2]>>>0){r11=r1+32|0;HEAP8[HEAP32[r11>>2]+r7|0]=0;HEAP8[HEAP32[r11>>2]+r3|0]=r4;HEAP32[r6>>2]=r8;r13=r1+372|0;r14=HEAP32[r13>>2];r15=r14+64|0;HEAP32[r13>>2]=r15;return}else{FUNCTION_TABLE[HEAP32[r1+24>>2]](HEAP32[r1+4>>2],r7,r4);HEAP32[r6>>2]=r8;r13=r1+372|0;r14=HEAP32[r13>>2];r15=r14+64|0;HEAP32[r13>>2]=r15;return}}function _e68_exception_illegal(r1){var r2;r2=HEAP32[r1+76>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+68>>2],HEAPU16[r1+160>>1])}_e68_exception(r1,4,0,34312);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+62;return}function _e68_exception_divzero(r1){var r2;_e68_exception(r1,5,0,33752);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+66;return}function _e68_exception_check(r1){var r2;_e68_exception(r1,6,0,33200);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+68;return}function _e68_exception_overflow(r1){var r2;_e68_exception(r1,7,0,32752);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+68;return}function _e68_exception_privilege(r1){var r2;_e68_exception(r1,8,0,32416);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+62;return}function _e68_exception_axxx(r1){var r2;_e68_exception(r1,10,0,31736);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+62;return}function _e68_exception_fxxx(r1){var r2;_e68_exception(r1,11,0,31392);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+62;return}function _e68_exception_format(r1){var r2;_e68_exception(r1,14,0,30904);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+62;return}function _e68_exception_trap(r1,r2){_e68_exception(r1,r2+32|0,0,30072);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+62;return}function _e68_interrupt(r1,r2){var r3;do{if((r2|0)!=0){r3=r1+335|0;HEAP8[r3]=HEAP8[r3]&-2;if((r2|0)!=7){break}if((HEAP32[r1+364>>2]|0)==7){break}HEAP8[r1+368|0]=1}}while(0);HEAP32[r1+364>>2]=r2;return}function _e68_reset(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=r1+48|0;if((HEAP8[r3]|0)!=0){return}HEAP8[r3]=1;r4=r1+44|0;r5=HEAP32[r4>>2];if((r5|0)!=0){FUNCTION_TABLE[r5](HEAP32[r1+40>>2],1)}r5=r1+166|0;r6=r1+334|0;r7=HEAP8[r6];do{if((HEAP16[r5>>1]&8192)==0){r8=r1+148|0;r9=HEAP32[r8>>2];if(r7<<24>>24==0){HEAP32[r1+168>>2]=r9}else{HEAP32[r1+172>>2]=r9}HEAP8[r6]=1;HEAP16[r5>>1]=8192;_memset(r1+88|0,0,60)|0;HEAP32[r8>>2]=0;r10=r8;r2=10}else{r8=r1+148|0;HEAP16[r5>>1]=8192;_memset(r1+88|0,0,60)|0;HEAP32[r8>>2]=0;if(r7<<24>>24!=0){r10=r8;r2=10;break}HEAP32[r8>>2]=0;HEAP32[r1+172>>2]=0}}while(0);if(r2==10){HEAP32[r1+168>>2]=0;HEAP32[r10>>2]=0}HEAP8[r1+335|0]=0;HEAP8[r1+336|0]=0;r10=r1+176|0;HEAP32[r10>>2]=0;HEAP32[r10+4>>2]=0;HEAP32[r10+8>>2]=0;HEAP32[r10+12>>2]=0;_e68_exception_reset(r1);if((HEAP8[r3]|0)==0){return}HEAP8[r3]=0;r3=HEAP32[r4>>2];if((r3|0)==0){return}FUNCTION_TABLE[r3](HEAP32[r1+40>>2],0);return}function _e68_execute(r1){var r2,r3,r4,r5;r2=HEAP32[r1+152>>2];r3=r1+196|0;r4=HEAP32[r3>>2]+1|0;HEAP32[r3>>2]=r4;HEAP32[r1+200+((r4&31)<<2)>>2]=r2;HEAP8[r1+336|0]=0;r2=r1+166|0;r4=r1+332|0;HEAP16[r4>>1]=HEAP16[r2>>1];r3=HEAP16[r1+162>>1];HEAP16[r1+160>>1]=r3;FUNCTION_TABLE[HEAP32[r1+400+((r3&65535)>>>6<<2)>>2]](r1);r3=r1+392|0;HEAP32[r3>>2]=HEAP32[r3>>2]+1;if((HEAP16[r4>>1]|0)<0){_e68_exception(r1,9,0,32096);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+62}r4=r1+368|0;if((HEAP8[r4]|0)!=0){_e68_exception(r1,31,0,30648);HEAP16[r2>>1]=HEAP16[r2>>1]|1792;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+62;HEAP8[r4]=0;return}r4=HEAP32[r1+364>>2];if((r4|0)==0){return}if((HEAPU16[r2>>1]>>>8&7)>>>0>=r4>>>0){return}r3=HEAP32[r1+56>>2];do{if((r3|0)!=0){r5=FUNCTION_TABLE[r3](HEAP32[r1+52>>2],r4);if(r5>>>0>=256){break}_e68_exception(r1,r5,0,29640);HEAP16[r2>>1]=HEAP16[r2>>1]&-1793&65535|r4<<8&1792;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+62;return}}while(0);_e68_exception(r1,r4+24|0,0,30648);HEAP16[r2>>1]=HEAP16[r2>>1]&-1793&65535|r4<<8&1792;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+62;return}function _e68_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=0;r5=STACKTOP;r6=r1+372|0;r7=r1+396|0;r8=r1+335|0;r9=r2;r2=HEAP32[r6>>2];while(1){if(r9>>>0<r2>>>0){r10=r9;r11=r2;break}r12=r9-r2|0;HEAP32[r7>>2]=HEAP32[r7>>2]+r2;HEAP32[r6>>2]=0;if((HEAP8[r8]|0)!=0){r3=7;break}_e68_execute(r1);r13=HEAP32[r6>>2];if((r13|0)==0){r3=5;break}else{r9=r12;r2=r13}}if(r3==5){r2=HEAP32[_stderr>>2];_fprintf(r2,29416,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r1+152>>2],r4));STACKTOP=r4;_fflush(r2);r10=r12;r11=HEAP32[r6>>2]}else if(r3==7){STACKTOP=r5;return}HEAP32[r7>>2]=HEAP32[r7>>2]+r10;HEAP32[r6>>2]=r11-r10;STACKTOP=r5;return}function _e68_op_dbcc(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);return}r5=r1+164|0;r6=r1+162|0;HEAP16[r6>>1]=HEAP16[r5>>1];r7=r4&16777215;r4=r7+1|0;r8=r1+36|0;if(r4>>>0<HEAP32[r8>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r10;r7=r1+336|0;if((HEAP8[r7]|0)!=0){_e68_exception_bus(r1);return}r4=HEAP32[r3>>2]+2|0;HEAP32[r3>>2]=r4;r9=r1+152|0;r11=HEAP32[r9>>2]+2|0;HEAP32[r9>>2]=r11;r12=HEAPU16[r6>>1];r13=(r12&32768|0)!=0?r12|-65536:r12;if((r2|0)!=0){r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);return}HEAP16[r6>>1]=r10;r10=r4&16777215;r4=r10+1|0;do{if(r4>>>0<HEAP32[r8>>2]>>>0){r2=HEAP32[r1+32>>2];HEAP16[r5>>1]=HEAPU8[r2+r10|0]<<8|HEAPU8[r2+r4|0]}else{r2=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10);r12=(HEAP8[r7]|0)==0;HEAP16[r5>>1]=r2;if(r12){break}_e68_exception_bus(r1);return}}while(0);HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;return}r10=r1+88+((HEAP16[r1+160>>1]&7)<<2)|0;r4=HEAP32[r10>>2];r12=r4+65535&65535;HEAP32[r10>>2]=r12|r4&-65536;r4=r1+372|0;r10=HEAP32[r4>>2];if((r12|0)==65535){HEAP32[r4>>2]=r10+14;r12=HEAP32[r3>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}HEAP16[r6>>1]=HEAP16[r5>>1];r2=r12&16777215;r12=r2+1|0;if(r12>>>0<HEAP32[r8>>2]>>>0){r14=HEAP32[r1+32>>2];r15=HEAPU8[r14+r2|0]<<8|HEAPU8[r14+r12|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r2)}HEAP16[r5>>1]=r15;if((HEAP8[r7]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;return}else{_e68_exception_bus(r1);return}}HEAP32[r4>>2]=r10+10;r10=r13+r11|0;HEAP32[r3>>2]=r10;if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);return}HEAP16[r6>>1]=HEAP16[r5>>1];r11=r10&16777215;r10=r11+1|0;if(r10>>>0<HEAP32[r8>>2]>>>0){r13=HEAP32[r1+32>>2];r16=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r10|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r5>>1]=r16;if((HEAP8[r7]|0)!=0){_e68_exception_bus(r1);return}r11=HEAP32[r3>>2]+2|0;HEAP32[r3>>2]=r11;HEAP32[r9>>2]=HEAP32[r9>>2]+2;if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}HEAP16[r6>>1]=r16;r16=r11&16777215;r11=r16+1|0;do{if(r11>>>0<HEAP32[r8>>2]>>>0){r6=HEAP32[r1+32>>2];HEAP16[r5>>1]=HEAPU8[r6+r16|0]<<8|HEAPU8[r6+r11|0]}else{r6=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16);r10=(HEAP8[r7]|0)==0;HEAP16[r5>>1]=r6;if(r10){break}_e68_exception_bus(r1);return}}while(0);r1=HEAP32[r3>>2];HEAP32[r3>>2]=r1+2;HEAP32[r9>>2]=r1-2;return}function _e68_op_scc(r1,r2){var r3,r4,r5,r6,r7;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r3<<2)>>2]](r1,r3,509,8)|0)!=0){return}if((_e68_ea_set_val8(r1,((r2|0)!=0)<<31>>31)|0)!=0){return}r2=r1+156|0;r3=HEAP32[r2>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r3&16777215;r3=r5+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r7=HEAPU8[r6+r5|0]<<8|HEAPU8[r6+r3|0]}else{r7=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r7;if((HEAP8[r1+336|0]|0)==0){HEAP32[r2>>2]=HEAP32[r2>>2]+2;r2=r1+152|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return}else{_e68_exception_bus(r1);return}}function _e68_set_opcodes(r1){var r2,r3;r2=0;while(1){r3=HEAP32[5616+(r2<<2)>>2];HEAP32[r1+400+(r2<<2)>>2]=(r3|0)==0?816:r3;r3=r2+1|0;if(r3>>>0<1024){r2=r3}else{break}}HEAP32[r1+4496>>2]=816;HEAP32[r1+4500>>2]=590;HEAP32[r1+4504>>2]=590;HEAP32[r1+4508>>2]=590;HEAP32[r1+4512>>2]=590;HEAP32[r1+4516>>2]=590;HEAP32[r1+4520>>2]=590;HEAP32[r1+4524>>2]=590;return}function _e68_op_undefined(r1){var r2;_e68_exception_illegal(r1);r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return}function _op41c0(r1){var r2,r3,r4,r5,r6,r7;r2=r1+160|0;r3=HEAP16[r2>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r3<<2)>>2]](r1,r3,2020,32)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;HEAP32[r1+120+((HEAPU16[r2>>1]>>>9&7)<<2)>>2]=HEAP32[r1+344>>2];r2=r1+156|0;r3=HEAP32[r2>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r3&16777215;r3=r5+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r7=HEAPU8[r6+r5|0]<<8|HEAPU8[r6+r3|0]}else{r7=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r7;if((HEAP8[r1+336|0]|0)==0){HEAP32[r2>>2]=HEAP32[r2>>2]+2;r2=r1+152|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return}else{_e68_exception_bus(r1);return}}function _op0000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];r13=HEAP16[r1+160>>1]&63;if((r13|0)==60){r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+20;if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r14=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r14+r11|0]<<8|HEAPU8[r14+r5|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r15=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r14;if(r15){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=r1+166|0;r5=HEAP16[r11>>1];HEAP16[r11>>1]=(r5|r12)&31|r5&-256;STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r3]|r12&255;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_nz_8(r1,15,r13);r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r12|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r16;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val8(r1,r13);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;if((HEAP16[r4>>1]&63)==60){if((HEAP8[r1+334|0]|0)==0){_e68_exception_privilege(r1);STACKTOP=r2;return}r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r7>>1];r9=r6&16777215;r6=r9+1|0;r10=r1+36|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r6|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r7>>1]=r12;r9=r1+336|0;if((HEAP8[r9]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r6=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r6;r11=r1+152|0;r13=HEAP32[r11>>2]+2|0;HEAP32[r11>>2]=r13;r14=HEAP16[r8>>1];r15=r1+372|0;HEAP32[r15>>2]=HEAP32[r15>>2]+20;if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}HEAP16[r8>>1]=r12;r12=r6&16777215;r8=r12+1|0;do{if(r8>>>0<HEAP32[r10>>2]>>>0){r15=HEAP32[r1+32>>2];HEAP16[r7>>1]=HEAPU8[r15+r12|0]<<8|HEAPU8[r15+r8|0];r16=r6;r17=r13}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12);r18=(HEAP8[r9]|0)==0;HEAP16[r7>>1]=r15;if(r18){r16=HEAP32[r5>>2];r17=HEAP32[r11>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r16+2;HEAP32[r11>>2]=r17+2;_e68_set_sr(r1,(HEAP16[r1+166>>1]|r14)&-22753);STACKTOP=r2;return}r14=r1+156|0;r17=HEAP32[r14>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);STACKTOP=r2;return}r11=r1+164|0;r16=r1+162|0;HEAP16[r16>>1]=HEAP16[r11>>1];r5=r17&16777215;r17=r5+1|0;r7=r1+36|0;if(r17>>>0<HEAP32[r7>>2]>>>0){r9=HEAP32[r1+32>>2];r19=HEAPU8[r9+r5|0]<<8|HEAPU8[r9+r17|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r11>>1]=r19;r19=r1+336|0;if((HEAP8[r19]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r14>>2]=HEAP32[r14>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;r17=HEAP16[r16>>1];r9=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r9=HEAP16[r3>>1]|r17;r17=r1+372|0;HEAP32[r17>>2]=HEAP32[r17>>2]+8;_e68_cc_set_nz_16(r1,15,r9);r17=HEAP32[r14>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);STACKTOP=r2;return}HEAP16[r16>>1]=HEAP16[r11>>1];r16=r17&16777215;r17=r16+1|0;if(r17>>>0<HEAP32[r7>>2]>>>0){r7=HEAP32[r1+32>>2];r20=HEAPU8[r7+r16|0]<<8|HEAPU8[r7+r17|0]}else{r20=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r11>>1]=r20;if((HEAP8[r19]|0)==0){HEAP32[r14>>2]=HEAP32[r14>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val16(r1,r9);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r13=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r13;if(r14){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=HEAPU16[r7>>1]|(r12&65535)<<16;r12=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r12=r11|HEAP32[r3>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+16;_e68_cc_set_nz_32(r1,15,r12);r3=HEAP32[r4>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r3|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val32(r1,r12);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAPU16[r4>>1];r6=r5&56;if((r6|0)==0){r7=HEAP32[r1+88+((r5&7)<<2)>>2];r8=1<<(HEAP32[r1+88+((r5>>>9&7)<<2)>>2]&31);r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+6;r9=r1+166|0;r10=HEAP16[r9>>1];HEAP16[r9>>1]=(r8&r7|0)==0?r10|4:r10&-5;r10=r1+156|0;r7=HEAP32[r10>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r10>>2]=HEAP32[r10>>2]+2;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else if((r6|0)==8){r6=r1+156|0;r10=HEAP32[r6>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}r12=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r12>>1];r9=r10&16777215;r10=r9+1|0;r7=r1+36|0;if(r10>>>0<HEAP32[r7>>2]>>>0){r11=HEAP32[r1+32>>2];r13=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r10|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r12>>1]=r13;r13=r1+336|0;if((HEAP8[r13]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r6>>2]=HEAP32[r6>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;r10=HEAPU16[r8>>1];r11=((r10&32768|0)!=0?r10|-65536:r10)+HEAP32[r1+120+((HEAP16[r4>>1]&7)<<2)>>2]|0;r10=r11&16777215;r14=HEAP32[r7>>2];if(r10>>>0<r14>>>0){r15=HEAP8[HEAP32[r1+32>>2]+r10|0];r16=r14}else{r14=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r10);r15=r14;r16=HEAP32[r7>>2]}r14=r11+2&16777215;if(r14>>>0<r16>>>0){r17=HEAP8[HEAP32[r1+32>>2]+r14|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r14)}r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+16;r14=r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)|0;HEAP32[r14>>2]=HEAP32[r14>>2]&-65536|(r17&255|(r15&255)<<8)&65535;r15=HEAP32[r6>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);STACKTOP=r2;return}HEAP16[r8>>1]=HEAP16[r12>>1];r8=r15&16777215;r15=r8+1|0;if(r15>>>0<HEAP32[r7>>2]>>>0){r7=HEAP32[r1+32>>2];r18=HEAPU8[r7+r8|0]<<8|HEAPU8[r7+r15|0]}else{r18=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r12>>1]=r18;if((HEAP8[r13]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r9=r5&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,4092,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r9=1<<(HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]&7);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;r4=r1+166|0;r5=HEAP16[r4>>1];HEAP16[r4>>1]=(r9&HEAPU8[r3]|0)==0?r5|4:r5&-5;r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r4=r3&16777215;r3=r4+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r19=HEAPU8[r6+r4|0]<<8|HEAPU8[r6+r3|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r9>>1]=r19;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}}function _op0140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAPU16[r4>>1];r6=r5>>>3&7;if((r6|0)==0){r7=r1+88+((r5&7)<<2)|0;r8=HEAP32[r7>>2];r9=1<<(HEAP32[r1+88+((r5>>>9&7)<<2)>>2]&31);r10=r1+372|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;HEAP32[r7>>2]=r9^r8;r7=r1+166|0;r10=HEAP16[r7>>1];HEAP16[r7>>1]=(r9&r8|0)==0?r10|4:r10&-5;r10=r1+156|0;r8=HEAP32[r10>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r7=r8&16777215;r8=r7+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r7|0]<<8|HEAPU8[r11+r8|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r10>>2]=HEAP32[r10>>2]+2;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else if((r6|0)==1){r6=r1+156|0;r10=HEAP32[r6>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}r12=r1+164|0;r9=r1+162|0;HEAP16[r9>>1]=HEAP16[r12>>1];r7=r10&16777215;r10=r7+1|0;r8=r1+36|0;if(r10>>>0<HEAP32[r8>>2]>>>0){r11=HEAP32[r1+32>>2];r13=HEAPU8[r11+r7|0]<<8|HEAPU8[r11+r10|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r12>>1]=r13;r13=r1+336|0;if((HEAP8[r13]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r6>>2]=HEAP32[r6>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;r10=HEAPU16[r9>>1];r11=((r10&32768|0)!=0?r10|-65536:r10)+HEAP32[r1+120+((HEAP16[r4>>1]&7)<<2)>>2]|0;r10=r11&16777215;r14=HEAP32[r8>>2];if(r10>>>0<r14>>>0){r15=HEAP8[HEAP32[r1+32>>2]+r10|0];r16=r14}else{r14=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r10);r15=r14;r16=HEAP32[r8>>2]}r14=r11+2&16777215;if(r14>>>0<r16>>>0){r17=HEAP8[HEAP32[r1+32>>2]+r14|0];r18=r16}else{r16=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r14);r17=r16;r18=HEAP32[r8>>2]}r16=r11+4&16777215;if(r16>>>0<r18>>>0){r19=HEAP8[HEAP32[r1+32>>2]+r16|0];r20=r18}else{r18=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r16);r19=r18;r20=HEAP32[r8>>2]}r18=r11+6&16777215;if(r18>>>0<r20>>>0){r21=HEAP8[HEAP32[r1+32>>2]+r18|0]}else{r21=FUNCTION_TABLE[HEAP32[r1+8>>2]](HEAP32[r1+4>>2],r18)}r18=r1+372|0;HEAP32[r18>>2]=HEAP32[r18>>2]+24;HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]=r21&255|(r19&255|(r17&255|(r15&255)<<8)<<8)<<8;r15=HEAP32[r6>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);STACKTOP=r2;return}HEAP16[r9>>1]=HEAP16[r12>>1];r9=r15&16777215;r15=r9+1|0;if(r15>>>0<HEAP32[r8>>2]>>>0){r8=HEAP32[r1+32>>2];r22=HEAPU8[r8+r9|0]<<8|HEAPU8[r8+r15|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r12>>1]=r22;if((HEAP8[r13]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r7>>2]=HEAP32[r7>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r7=r5&63;if((FUNCTION_TABLE[HEAP32[9712+(r7<<2)>>2]](r1,r7,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r7=1<<(HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]&7);r4=HEAPU8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+8;r3=r1+166|0;r5=HEAP16[r3>>1];HEAP16[r3>>1]=(r7&r4|0)==0?r5|4:r5&-5;r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r13=r3&16777215;r3=r13+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r22=HEAP32[r1+32>>2];r23=HEAPU8[r22+r13|0]<<8|HEAPU8[r22+r3|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r13)}HEAP16[r6>>1]=r23;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val8(r1,(r4^r7)&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}}function _op0180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAPU16[r4>>1];r6=r5>>>3&7;if((r6|0)==0){r7=r1+88+((r5&7)<<2)|0;r8=HEAP32[r7>>2];r9=1<<(HEAP32[r1+88+((r5>>>9&7)<<2)>>2]&31);r10=r1+372|0;HEAP32[r10>>2]=HEAP32[r10>>2]+10;r10=r1+166|0;r11=HEAP16[r10>>1];HEAP16[r10>>1]=(r9&r8|0)==0?r11|4:r11&-5;HEAP32[r7>>2]=r8&~r9;r9=r1+156|0;r8=HEAP32[r9>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r11=r8&16777215;r8=r11+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r12=HEAPU8[r10+r11|0]<<8|HEAPU8[r10+r8|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r7>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else if((r6|0)==1){r6=r1+156|0;r9=HEAP32[r6>>2];if((r9&1|0)!=0){_e68_exception_address(r1,r9,0,0);STACKTOP=r2;return}r12=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r12>>1];r11=r9&16777215;r9=r11+1|0;r8=r1+36|0;if(r9>>>0<HEAP32[r8>>2]>>>0){r10=HEAP32[r1+32>>2];r13=HEAPU8[r10+r11|0]<<8|HEAPU8[r10+r9|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r12>>1]=r13;r13=r1+336|0;if((HEAP8[r13]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r6>>2]=HEAP32[r6>>2]+2;r11=r1+152|0;HEAP32[r11>>2]=HEAP32[r11>>2]+2;r9=HEAPU16[r4>>1];r10=HEAPU16[r7>>1];r14=((r10&32768|0)!=0?r10|-65536:r10)+HEAP32[r1+120+((r9&7)<<2)>>2]|0;r10=HEAP32[r1+88+((r9>>>9&7)<<2)>>2];r9=r10>>>8&255;r15=r14&16777215;if(r15>>>0<HEAP32[r8>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r15|0]=r9}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r15,r9)}r9=r10&255;r10=r14+2&16777215;if(r10>>>0<HEAP32[r8>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r10|0]=r9}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r10,r9)}r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+16;r9=HEAP32[r6>>2];if((r9&1|0)!=0){_e68_exception_address(r1,r9,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r12>>1];r7=r9&16777215;r9=r7+1|0;if(r9>>>0<HEAP32[r8>>2]>>>0){r8=HEAP32[r1+32>>2];r16=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r9|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r12>>1]=r16;if((HEAP8[r13]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r11>>2]=HEAP32[r11>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r11=r5&63;if((FUNCTION_TABLE[HEAP32[9712+(r11<<2)>>2]](r1,r11,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r11=1<<(HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]&7);r4=HEAPU8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+8;r3=r1+166|0;r5=HEAP16[r3>>1];HEAP16[r3>>1]=(r11&r4|0)==0?r5|4:r5&-5;r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r13=r3&16777215;r3=r13+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r16=HEAP32[r1+32>>2];r17=HEAPU8[r16+r13|0]<<8|HEAPU8[r16+r3|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r13)}HEAP16[r6>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val8(r1,(r11^255)&r4&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}}function _op01c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAPU16[r4>>1];r6=r5>>>3&7;if((r6|0)==0){r7=r1+88+((r5&7)<<2)|0;r8=HEAP32[r7>>2];r9=1<<(HEAP32[r1+88+((r5>>>9&7)<<2)>>2]&31);r10=r1+372|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;r10=r1+166|0;r11=HEAP16[r10>>1];HEAP16[r10>>1]=(r9&r8|0)==0?r11|4:r11&-5;HEAP32[r7>>2]=r9|r8;r8=r1+156|0;r9=HEAP32[r8>>2];if((r9&1|0)!=0){_e68_exception_address(r1,r9,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r11=r9&16777215;r9=r11+1|0;if(r9>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r12=HEAPU8[r10+r11|0]<<8|HEAPU8[r10+r9|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r7>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else if((r6|0)==1){r6=r1+156|0;r8=HEAP32[r6>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}r12=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r12>>1];r11=r8&16777215;r8=r11+1|0;r9=r1+36|0;if(r8>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r13=HEAPU8[r10+r11|0]<<8|HEAPU8[r10+r8|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r12>>1]=r13;r13=r1+336|0;if((HEAP8[r13]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r6>>2]=HEAP32[r6>>2]+2;r11=r1+152|0;HEAP32[r11>>2]=HEAP32[r11>>2]+2;r8=HEAPU16[r4>>1];r10=HEAPU16[r7>>1];r14=((r10&32768|0)!=0?r10|-65536:r10)+HEAP32[r1+120+((r8&7)<<2)>>2]|0;r10=HEAP32[r1+88+((r8>>>9&7)<<2)>>2];r8=r10>>>24&255;r15=r14&16777215;if(r15>>>0<HEAP32[r9>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r15|0]=r8}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r15,r8)}r8=r10>>>16&255;r15=r14+2&16777215;if(r15>>>0<HEAP32[r9>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r15|0]=r8}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r15,r8)}r8=r10>>>8&255;r15=r14+4&16777215;if(r15>>>0<HEAP32[r9>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r15|0]=r8}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r15,r8)}r8=r10&255;r10=r14+6&16777215;if(r10>>>0<HEAP32[r9>>2]>>>0){HEAP8[HEAP32[r1+32>>2]+r10|0]=r8}else{FUNCTION_TABLE[HEAP32[r1+20>>2]](HEAP32[r1+4>>2],r10,r8)}r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+24;r8=HEAP32[r6>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r12>>1];r7=r8&16777215;r8=r7+1|0;if(r8>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r8|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r12>>1]=r16;if((HEAP8[r13]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r11>>2]=HEAP32[r11>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r11=r5&63;if((FUNCTION_TABLE[HEAP32[9712+(r11<<2)>>2]](r1,r11,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r11=1<<(HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]&7);r4=HEAPU8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+8;r3=r1+166|0;r5=HEAP16[r3>>1];HEAP16[r3>>1]=(r11&r4|0)==0?r5|4:r5&-5;r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r13=r3&16777215;r3=r13+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r16=HEAP32[r1+32>>2];r17=HEAPU8[r16+r13|0]<<8|HEAPU8[r16+r3|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r13)}HEAP16[r6>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val8(r1,(r4|r11)&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}}function _op0200(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];r13=HEAP16[r1+160>>1]&63;if((r13|0)==60){r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+20;if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r14=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r14+r11|0]<<8|HEAPU8[r14+r5|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r15=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r14;if(r15){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=r1+166|0;HEAP16[r11>>1]=HEAP16[r11>>1]&(r12&31|-256);STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r3]&(r12&255);r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_nz_8(r1,15,r13);r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r12|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r16;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val8(r1,r13);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0240(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;if((HEAP16[r4>>1]&63)==60){if((HEAP8[r1+334|0]|0)==0){_e68_exception_privilege(r1);STACKTOP=r2;return}r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r7>>1];r9=r6&16777215;r6=r9+1|0;r10=r1+36|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r6|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r7>>1]=r12;r9=r1+336|0;if((HEAP8[r9]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r6=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r6;r11=r1+152|0;r13=HEAP32[r11>>2]+2|0;HEAP32[r11>>2]=r13;r14=HEAP16[r8>>1];r15=r1+372|0;HEAP32[r15>>2]=HEAP32[r15>>2]+20;if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}HEAP16[r8>>1]=r12;r12=r6&16777215;r8=r12+1|0;do{if(r8>>>0<HEAP32[r10>>2]>>>0){r15=HEAP32[r1+32>>2];HEAP16[r7>>1]=HEAPU8[r15+r12|0]<<8|HEAPU8[r15+r8|0];r16=r6;r17=r13}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12);r18=(HEAP8[r9]|0)==0;HEAP16[r7>>1]=r15;if(r18){r16=HEAP32[r5>>2];r17=HEAP32[r11>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r16+2;HEAP32[r11>>2]=r17+2;_e68_set_sr(r1,HEAP16[r1+166>>1]&r14);STACKTOP=r2;return}r14=r1+156|0;r17=HEAP32[r14>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);STACKTOP=r2;return}r11=r1+164|0;r16=r1+162|0;HEAP16[r16>>1]=HEAP16[r11>>1];r5=r17&16777215;r17=r5+1|0;r7=r1+36|0;if(r17>>>0<HEAP32[r7>>2]>>>0){r9=HEAP32[r1+32>>2];r19=HEAPU8[r9+r5|0]<<8|HEAPU8[r9+r17|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r11>>1]=r19;r19=r1+336|0;if((HEAP8[r19]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r14>>2]=HEAP32[r14>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;r17=HEAP16[r16>>1];r9=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r9=HEAP16[r3>>1]&r17;r17=r1+372|0;HEAP32[r17>>2]=HEAP32[r17>>2]+8;_e68_cc_set_nz_16(r1,15,r9);r17=HEAP32[r14>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);STACKTOP=r2;return}HEAP16[r16>>1]=HEAP16[r11>>1];r16=r17&16777215;r17=r16+1|0;if(r17>>>0<HEAP32[r7>>2]>>>0){r7=HEAP32[r1+32>>2];r20=HEAPU8[r7+r16|0]<<8|HEAPU8[r7+r17|0]}else{r20=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r11>>1]=r20;if((HEAP8[r19]|0)==0){HEAP32[r14>>2]=HEAP32[r14>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val16(r1,r9);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0280(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r13=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r13;if(r14){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=HEAPU16[r7>>1]|(r12&65535)<<16;r12=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r12=HEAP32[r3>>2]&r11;r11=r1+372|0;HEAP32[r11>>2]=HEAP32[r11>>2]+16;_e68_cc_set_nz_32(r1,15,r12);r11=HEAP32[r4>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r11&16777215;r11=r7+1|0;if(r11>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r11|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val32(r1,r12);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0400(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1]&255;r10=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r10<<2)>>2]](r1,r10,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r10=HEAP8[r3];r3=r10-r5&255;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_sub_8(r1,r3,r5,r10);r10=HEAP32[r4>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r13=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r13;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val8(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0440(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1];r10=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r10<<2)>>2]](r1,r10,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r10=HEAP16[r3>>1];r3=r10-r5&65535;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_sub_16(r1,r3,r5,r10);r10=HEAP32[r4>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r13=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r13;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0480(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r13=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r13;if(r14){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=HEAPU16[r7>>1]|(r12&65535)<<16;r12=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r12=HEAP32[r3>>2];r3=r12-r11|0;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+16;_e68_cc_set_sub_32(r1,r3,r11,r12);r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r12|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val32(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0600(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1]&255;r10=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r10<<2)>>2]](r1,r10,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r10=HEAP8[r3];r3=r10+r5&255;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_add_8(r1,r3,r5,r10);r10=HEAP32[r4>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r13=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r13;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val8(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0640(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1];r10=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r10<<2)>>2]](r1,r10,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r10=HEAP16[r3>>1];r3=r10+r5&65535;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_add_16(r1,r3,r5,r10);r10=HEAP32[r4>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r13=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r13;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0680(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r13=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r13;if(r14){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=HEAPU16[r7>>1]|(r12&65535)<<16;r12=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r12=HEAP32[r3>>2];r3=r12+r11|0;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+16;_e68_cc_set_add_32(r1,r3,r11,r12);r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r12|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val32(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0800(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=r1+156|0;r6=HEAP32[r5>>2];r7=(r6&1|0)==0;if((HEAP16[r4>>1]&56)==0){if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r8=r1+164|0;r9=r1+162|0;HEAP16[r9>>1]=HEAP16[r8>>1];r10=r6&16777215;r11=r10+1|0;r12=r1+36|0;if(r11>>>0<HEAP32[r12>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r8>>1]=r14;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r11=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r11;r13=r1+152|0;r15=HEAP32[r13>>2]+2|0;HEAP32[r13>>2]=r15;r16=1<<(HEAP16[r9>>1]&31)&HEAP32[r1+88+((HEAP16[r4>>1]&7)<<2)>>2];r17=r1+372|0;HEAP32[r17>>2]=HEAP32[r17>>2]+10;r17=r1+166|0;r18=HEAP16[r17>>1];HEAP16[r17>>1]=(r16|0)==0?r18|4:r18&-5;if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}HEAP16[r9>>1]=r14;r14=r11&16777215;r9=r14+1|0;do{if(r9>>>0<HEAP32[r12>>2]>>>0){r18=HEAP32[r1+32>>2];HEAP16[r8>>1]=HEAPU8[r18+r14|0]<<8|HEAPU8[r18+r9|0];r19=r11;r20=r15}else{r18=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14);r16=(HEAP8[r10]|0)==0;HEAP16[r8>>1]=r18;if(r16){r19=HEAP32[r5>>2];r20=HEAP32[r13>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r19+2;HEAP32[r13>>2]=r20+2;STACKTOP=r2;return}if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r20=r1+162|0;HEAP16[r20>>1]=HEAP16[r7>>1];r13=r6&16777215;r6=r13+1|0;r19=r1+36|0;if(r6>>>0<HEAP32[r19>>2]>>>0){r8=HEAP32[r1+32>>2];r21=HEAPU8[r8+r13|0]<<8|HEAPU8[r8+r6|0]}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r13)}HEAP16[r7>>1]=r21;r21=r1+336|0;if((HEAP8[r21]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r5>>2]=HEAP32[r5>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;r6=HEAP16[r20>>1];r8=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,2044,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r8=HEAPU8[r3]&1<<(r6&7);r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;r6=r1+166|0;r3=HEAP16[r6>>1];HEAP16[r6>>1]=(r8|0)==0?r3|4:r3&-5;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}HEAP16[r20>>1]=HEAP16[r7>>1];r20=r3&16777215;r3=r20+1|0;if(r3>>>0<HEAP32[r19>>2]>>>0){r19=HEAP32[r1+32>>2];r22=HEAPU8[r19+r20|0]<<8|HEAPU8[r19+r3|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r20)}HEAP16[r7>>1]=r22;if((HEAP8[r21]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r13>>2]=HEAP32[r13>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0840(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=r1+156|0;r6=HEAP32[r5>>2];r7=(r6&1|0)==0;if((HEAP16[r4>>1]&56)==0){if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r8=r1+164|0;r9=r1+162|0;HEAP16[r9>>1]=HEAP16[r8>>1];r10=r6&16777215;r11=r10+1|0;r12=r1+36|0;if(r11>>>0<HEAP32[r12>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r8>>1]=r14;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r11=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r11;r13=r1+152|0;r15=HEAP32[r13>>2]+2|0;HEAP32[r13>>2]=r15;r16=r1+88+((HEAP16[r4>>1]&7)<<2)|0;r17=HEAP32[r16>>2];r18=1<<(HEAP16[r9>>1]&31);r19=r18^r17;r20=r1+372|0;HEAP32[r20>>2]=HEAP32[r20>>2]+12;r20=r1+166|0;r21=HEAP16[r20>>1];HEAP16[r20>>1]=(r18&r17|0)==0?r21|4:r21&-5;if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}HEAP16[r9>>1]=r14;r14=r11&16777215;r9=r14+1|0;do{if(r9>>>0<HEAP32[r12>>2]>>>0){r21=HEAP32[r1+32>>2];HEAP16[r8>>1]=HEAPU8[r21+r14|0]<<8|HEAPU8[r21+r9|0];r22=r11;r23=r15}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14);r17=(HEAP8[r10]|0)==0;HEAP16[r8>>1]=r21;if(r17){r22=HEAP32[r5>>2];r23=HEAP32[r13>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r22+2;HEAP32[r13>>2]=r23+2;HEAP32[r16>>2]=r19;STACKTOP=r2;return}if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r19=r1+162|0;HEAP16[r19>>1]=HEAP16[r7>>1];r16=r6&16777215;r6=r16+1|0;r23=r1+36|0;if(r6>>>0<HEAP32[r23>>2]>>>0){r13=HEAP32[r1+32>>2];r24=HEAPU8[r13+r16|0]<<8|HEAPU8[r13+r6|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r7>>1]=r24;r24=r1+336|0;if((HEAP8[r24]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r5>>2]=HEAP32[r5>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;r6=HEAP16[r19>>1]&7;r13=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=1<<r6;r6=HEAPU8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+12;r3=r1+166|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=(r13&r6|0)==0?r4|4:r4&-5;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}HEAP16[r19>>1]=HEAP16[r7>>1];r19=r4&16777215;r4=r19+1|0;if(r4>>>0<HEAP32[r23>>2]>>>0){r23=HEAP32[r1+32>>2];r25=HEAPU8[r23+r19|0]<<8|HEAPU8[r23+r4|0]}else{r25=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r19)}HEAP16[r7>>1]=r25;if((HEAP8[r24]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]+2;_e68_ea_set_val8(r1,(r6^r13)&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0880(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=r1+156|0;r6=HEAP32[r5>>2];r7=(r6&1|0)==0;if((HEAP16[r4>>1]&56)==0){if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r8=r1+164|0;r9=r1+162|0;HEAP16[r9>>1]=HEAP16[r8>>1];r10=r6&16777215;r11=r10+1|0;r12=r1+36|0;if(r11>>>0<HEAP32[r12>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r8>>1]=r14;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r11=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r11;r13=r1+152|0;r15=HEAP32[r13>>2]+2|0;HEAP32[r13>>2]=r15;r16=r1+88+((HEAP16[r4>>1]&7)<<2)|0;r17=HEAP32[r16>>2];r18=1<<(HEAP16[r9>>1]&31);r19=r17&~r18;r20=r1+372|0;HEAP32[r20>>2]=HEAP32[r20>>2]+14;r20=r1+166|0;r21=HEAP16[r20>>1];HEAP16[r20>>1]=(r18&r17|0)==0?r21|4:r21&-5;if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}HEAP16[r9>>1]=r14;r14=r11&16777215;r9=r14+1|0;do{if(r9>>>0<HEAP32[r12>>2]>>>0){r21=HEAP32[r1+32>>2];HEAP16[r8>>1]=HEAPU8[r21+r14|0]<<8|HEAPU8[r21+r9|0];r22=r11;r23=r15}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14);r17=(HEAP8[r10]|0)==0;HEAP16[r8>>1]=r21;if(r17){r22=HEAP32[r5>>2];r23=HEAP32[r13>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r22+2;HEAP32[r13>>2]=r23+2;HEAP32[r16>>2]=r19;STACKTOP=r2;return}if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r19=r1+162|0;HEAP16[r19>>1]=HEAP16[r7>>1];r16=r6&16777215;r6=r16+1|0;r23=r1+36|0;if(r6>>>0<HEAP32[r23>>2]>>>0){r13=HEAP32[r1+32>>2];r24=HEAPU8[r13+r16|0]<<8|HEAPU8[r13+r6|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r7>>1]=r24;r24=r1+336|0;if((HEAP8[r24]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r5>>2]=HEAP32[r5>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;r6=HEAP16[r19>>1]&7;r13=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=1<<r6;r6=HEAPU8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+12;r3=r1+166|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=(r13&r6|0)==0?r4|4:r4&-5;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}HEAP16[r19>>1]=HEAP16[r7>>1];r19=r4&16777215;r4=r19+1|0;if(r4>>>0<HEAP32[r23>>2]>>>0){r23=HEAP32[r1+32>>2];r25=HEAPU8[r23+r19|0]<<8|HEAPU8[r23+r4|0]}else{r25=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r19)}HEAP16[r7>>1]=r25;if((HEAP8[r24]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]+2;_e68_ea_set_val8(r1,r6&(r13^255)&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op08c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=r1+156|0;r6=HEAP32[r5>>2];r7=(r6&1|0)==0;if((HEAP16[r4>>1]&56)==0){if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r8=r1+164|0;r9=r1+162|0;HEAP16[r9>>1]=HEAP16[r8>>1];r10=r6&16777215;r11=r10+1|0;r12=r1+36|0;if(r11>>>0<HEAP32[r12>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r8>>1]=r14;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r11=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r11;r13=r1+152|0;r15=HEAP32[r13>>2]+2|0;HEAP32[r13>>2]=r15;r16=r1+88+((HEAP16[r4>>1]&7)<<2)|0;r17=HEAP32[r16>>2];r18=1<<(HEAP16[r9>>1]&31);r19=r18|r17;r20=r1+372|0;HEAP32[r20>>2]=HEAP32[r20>>2]+12;r20=r1+166|0;r21=HEAP16[r20>>1];HEAP16[r20>>1]=(r18&r17|0)==0?r21|4:r21&-5;if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}HEAP16[r9>>1]=r14;r14=r11&16777215;r9=r14+1|0;do{if(r9>>>0<HEAP32[r12>>2]>>>0){r21=HEAP32[r1+32>>2];HEAP16[r8>>1]=HEAPU8[r21+r14|0]<<8|HEAPU8[r21+r9|0];r22=r11;r23=r15}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14);r17=(HEAP8[r10]|0)==0;HEAP16[r8>>1]=r21;if(r17){r22=HEAP32[r5>>2];r23=HEAP32[r13>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r22+2;HEAP32[r13>>2]=r23+2;HEAP32[r16>>2]=r19;STACKTOP=r2;return}if(!r7){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r19=r1+162|0;HEAP16[r19>>1]=HEAP16[r7>>1];r16=r6&16777215;r6=r16+1|0;r23=r1+36|0;if(r6>>>0<HEAP32[r23>>2]>>>0){r13=HEAP32[r1+32>>2];r24=HEAPU8[r13+r16|0]<<8|HEAPU8[r13+r6|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r7>>1]=r24;r24=r1+336|0;if((HEAP8[r24]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r5>>2]=HEAP32[r5>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;r6=HEAP16[r19>>1]&7;r13=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=1<<r6;r6=HEAPU8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+12;r3=r1+166|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=(r13&r6|0)==0?r4|4:r4&-5;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}HEAP16[r19>>1]=HEAP16[r7>>1];r19=r4&16777215;r4=r19+1|0;if(r4>>>0<HEAP32[r23>>2]>>>0){r23=HEAP32[r1+32>>2];r25=HEAPU8[r23+r19|0]<<8|HEAPU8[r23+r4|0]}else{r25=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r19)}HEAP16[r7>>1]=r25;if((HEAP8[r24]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;HEAP32[r16>>2]=HEAP32[r16>>2]+2;_e68_ea_set_val8(r1,(r6|r13)&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0a00(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];r13=HEAP16[r1+160>>1]&63;if((r13|0)==60){r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+20;if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r14=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r14+r11|0]<<8|HEAPU8[r14+r5|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r15=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r14;if(r15){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=r1+166|0;r5=HEAP16[r11>>1];HEAP16[r11>>1]=(r5^r12)&31|r5&-256;STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r3]^r12&255;r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+8;_e68_cc_set_nz_8(r1,15,r13);r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r12|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r16;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val8(r1,r13);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0a40(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;if((HEAP16[r4>>1]&63)==60){if((HEAP8[r1+334|0]|0)==0){_e68_exception_privilege(r1);STACKTOP=r2;return}r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;r8=r1+162|0;HEAP16[r8>>1]=HEAP16[r7>>1];r9=r6&16777215;r6=r9+1|0;r10=r1+36|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r9|0]<<8|HEAPU8[r11+r6|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r7>>1]=r12;r9=r1+336|0;if((HEAP8[r9]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r6=HEAP32[r5>>2]+2|0;HEAP32[r5>>2]=r6;r11=r1+152|0;r13=HEAP32[r11>>2]+2|0;HEAP32[r11>>2]=r13;r14=HEAP16[r8>>1];r15=r1+372|0;HEAP32[r15>>2]=HEAP32[r15>>2]+20;if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}HEAP16[r8>>1]=r12;r12=r6&16777215;r8=r12+1|0;do{if(r8>>>0<HEAP32[r10>>2]>>>0){r15=HEAP32[r1+32>>2];HEAP16[r7>>1]=HEAPU8[r15+r12|0]<<8|HEAPU8[r15+r8|0];r16=r6;r17=r13}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12);r18=(HEAP8[r9]|0)==0;HEAP16[r7>>1]=r15;if(r18){r16=HEAP32[r5>>2];r17=HEAP32[r11>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r5>>2]=r16+2;HEAP32[r11>>2]=r17+2;_e68_set_sr(r1,(HEAP16[r1+166>>1]^r14)&-22753);STACKTOP=r2;return}r14=r1+156|0;r17=HEAP32[r14>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);STACKTOP=r2;return}r11=r1+164|0;r16=r1+162|0;HEAP16[r16>>1]=HEAP16[r11>>1];r5=r17&16777215;r17=r5+1|0;r7=r1+36|0;if(r17>>>0<HEAP32[r7>>2]>>>0){r9=HEAP32[r1+32>>2];r19=HEAPU8[r9+r5|0]<<8|HEAPU8[r9+r17|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r11>>1]=r19;r19=r1+336|0;if((HEAP8[r19]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r14>>2]=HEAP32[r14>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;r17=HEAP16[r16>>1];r9=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r9=HEAP16[r3>>1]^r17;_e68_cc_set_nz_16(r1,15,r9);r17=r1+372|0;HEAP32[r17>>2]=HEAP32[r17>>2]+8;r17=HEAP32[r14>>2];if((r17&1|0)!=0){_e68_exception_address(r1,r17,0,0);STACKTOP=r2;return}HEAP16[r16>>1]=HEAP16[r11>>1];r16=r17&16777215;r17=r16+1|0;if(r17>>>0<HEAP32[r7>>2]>>>0){r7=HEAP32[r1+32>>2];r20=HEAPU8[r7+r16|0]<<8|HEAPU8[r7+r17|0]}else{r20=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r11>>1]=r20;if((HEAP8[r19]|0)==0){HEAP32[r14>>2]=HEAP32[r14>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val16(r1,r9);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0a80(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r13=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r13;if(r14){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=HEAPU16[r7>>1]|(r12&65535)<<16;r12=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r12=HEAP32[r3>>2]^r11;r11=r1+372|0;HEAP32[r11>>2]=HEAP32[r11>>2]+12;_e68_cc_set_nz_32(r1,15,r12);r11=HEAP32[r4>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r11&16777215;r11=r7+1|0;if(r11>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r11|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;_e68_ea_set_val32(r1,r12);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0c00(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1]&255;r10=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r10<<2)>>2]](r1,r10,2045,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r10=r1+372|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;r10=HEAP8[r3];_e68_cc_set_cmp_8(r1,r10-r5&255,r5,r10);r10=HEAP32[r4>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r12=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r12;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0c40(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1];r10=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r10<<2)>>2]](r1,r10,2045,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r10=r1+372|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;r10=HEAP16[r3>>1];_e68_cc_set_cmp_16(r1,r10-r5&65535,r5,r10);r10=HEAP32[r4>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r12=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r12;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0c80(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r5=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r5;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r12=HEAP16[r7>>1];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=r11;r11=r5&16777215;r5=r11+1|0;do{if(r5>>>0<HEAP32[r9>>2]>>>0){r13=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11);r14=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r13;if(r14){break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;r11=HEAPU16[r7>>1]|(r12&65535)<<16;r12=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,2045,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r12=r1+372|0;HEAP32[r12>>2]=HEAP32[r12>>2]+12;r12=HEAP32[r3>>2];_e68_cc_set_cmp_32(r1,r12-r11|0,r11,r12);r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r12|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r8]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0e00(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((HEAP32[r1>>2]&2|0)==0){_e68_exception_illegal(r1);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=r1+160|0;r10=HEAPU16[r7>>1];r12=r10>>>12;do{if((r10&2048|0)==0){r13=HEAP16[r5>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r13=r12&7;r14=HEAP8[r3];if((r12&8|0)==0){r15=r1+88+(r13<<2)|0;HEAP32[r15>>2]=HEAP32[r15>>2]&-256|r14&255;break}else{r15=r14&255;HEAP32[r1+120+(r13<<2)>>2]=(r15&128|0)!=0?r15|-256:r15;break}}else{r15=r12&7;if((r12&8|0)==0){r16=r1+88+(r15<<2)|0}else{r16=r1+120+(r15<<2)|0}HEAP8[r3]=HEAP32[r16>>2];r15=HEAP16[r5>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r15<<2)>>2]](r1,r15,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_set_val8(r1,HEAP8[r3])|0)==0){break}STACKTOP=r2;return}}while(0);r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=HEAP32[r4>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r17=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r3|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r17;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0e40(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((HEAP32[r1>>2]&2|0)==0){_e68_exception_illegal(r1);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=r1+160|0;r10=HEAPU16[r7>>1];r12=r10>>>12;do{if((r10&2048|0)==0){r13=HEAP16[r5>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r13=r12&7;r14=HEAP16[r3>>1];if((r12&8|0)==0){r15=r1+88+(r13<<2)|0;HEAP32[r15>>2]=HEAP32[r15>>2]&-65536|r14&65535;break}else{r15=r14&65535;HEAP32[r1+120+(r13<<2)>>2]=(r15&32768|0)==0?r15:r15|-65536;break}}else{r15=r12&7;if((r12&8|0)==0){r16=r1+88+(r15<<2)|0}else{r16=r1+120+(r15<<2)|0}HEAP16[r3>>1]=HEAP32[r16>>2];r15=HEAP16[r5>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r15<<2)>>2]](r1,r15,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_set_val16(r1,HEAP16[r3>>1])|0)==0){break}STACKTOP=r2;return}}while(0);r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=HEAP32[r4>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r17=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r3|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r17;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op0e80(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((HEAP32[r1>>2]&2|0)==0){_e68_exception_illegal(r1);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=r1+160|0;r10=HEAPU16[r7>>1];r12=r10>>>12;do{if((r10&2048|0)==0){r13=HEAP16[r5>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r13=r12&7;r14=HEAP32[r3>>2];if((r12&8|0)==0){HEAP32[r1+88+(r13<<2)>>2]=r14;break}else{HEAP32[r1+120+(r13<<2)>>2]=r14;break}}else{r14=r12&7;if((r12&8|0)==0){r15=r1+88+(r14<<2)|0}else{r15=r1+120+(r14<<2)|0}HEAP32[r3>>2]=HEAP32[r15>>2];r14=HEAP16[r5>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_set_val32(r1,HEAP32[r3>>2])|0)==0){break}STACKTOP=r2;return}}while(0);r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=HEAP32[r4>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r16=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r3|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r16;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op1000(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r4>>1];r4=r5>>>3&56|r5>>>9&7;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_set_val8(r1,HEAP8[r3])|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;_e68_cc_set_nz_8(r1,15,HEAP8[r3]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op2000(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r4>>1];r4=r5>>>3&56|r5>>>9&7;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_set_val32(r1,HEAP32[r3>>2])|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;_e68_cc_set_nz_32(r1,15,HEAP32[r3>>2]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op2040(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}HEAP32[r1+120+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]=HEAP32[r3>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op3000(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r4>>1];r4=r5>>>3&56|r5>>>9&7;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_set_val16(r1,HEAP16[r3>>1])|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;_e68_cc_set_nz_16(r1,15,HEAP16[r3>>1]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op3040(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r3>>1];HEAP32[r1+120+((HEAPU16[r4>>1]>>>9&7)<<2)>>2]=(r5&32768|0)!=0?r5|-65536:r5;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;r5=r1+156|0;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4000(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU8[r3];r3=r1+166|0;r5=HEAP16[r3>>1];r6=-(((r5&65535)>>>4&1)+r4|0)|0;if((r6&255|0)==0){r7=r5}else{r8=r5&-5;HEAP16[r3>>1]=r8;r7=r8}r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+8;r8=r6&128;r5=(r8|0)==0?r7&-9:r7|8;r7=(r8&r4|0)==0?r5&-3:r5|2;HEAP16[r3>>1]=((r4|r6)&128|0)==0?r7&-18:r7|17;r7=r1+156|0;r4=HEAP32[r7>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r5=r4&16777215;r4=r5+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r3>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val8(r1,r6&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4040(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1];r3=r1+166|0;r5=HEAP16[r3>>1];r6=-(((r5&65535)>>>4&1)+r4|0)|0;if((r6&65535|0)==0){r7=r5}else{r8=r5&-5;HEAP16[r3>>1]=r8;r7=r8}r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+8;r8=r6&32768;r5=(r8|0)==0?r7&-9:r7|8;r7=(r8&r4|0)==0?r5&-3:r5|2;HEAP16[r3>>1]=((r4|r6)&32768|0)==0?r7&-18:r7|17;r7=r1+156|0;r4=HEAP32[r7>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r5=r4&16777215;r4=r5+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r3>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val16(r1,r6&65535);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP32[r3>>2];r3=-r4|0;r5=r1+166|0;r6=HEAP16[r5>>1];r7=(r6&65535)>>>4&1;r8=r3-r7|0;if((r7|0)==(r3|0)){r9=r6}else{r3=r6&-5;HEAP16[r5>>1]=r3;r9=r3}r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+10;r3=(r8|0)<0?r9|8:r9&-9;r9=(r4&r8|0)<0?r3|2:r3&-3;HEAP16[r5>>1]=(r4|r8|0)<0?r9|17:r9&-18;r9=r1+156|0;r4=HEAP32[r9>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r3=r4&16777215;r4=r3+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r10=HEAPU8[r6+r3|0]<<8|HEAPU8[r6+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r3)}HEAP16[r5>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;_e68_ea_set_val32(r1,r8);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op40c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;do{if((HEAP32[r1>>2]&2|0)!=0){if((HEAP8[r1+334|0]|0)!=0){break}_e68_exception_privilege(r1);STACKTOP=r2;return}}while(0);r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}HEAP16[r3>>1]=HEAP16[r1+166>>1]&-22753;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_ea_set_val16(r1,HEAP16[r3>>1]);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];do{if((r5&32768|0)==0){r4=HEAPU16[r3>>1];if((r4&32768|0)!=0|(r5&65535)>>>0>r4>>>0){r4=r1+166|0;HEAP16[r4>>1]=HEAP16[r4>>1]&-9;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+14;break}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+14;r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r4=r1+166|0;HEAP16[r4>>1]=HEAP16[r4>>1]|8;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+14}}while(0);_e68_exception_check(r1);STACKTOP=r2;return}function _op4200(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r3<<2)>>2]](r1,r3,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r2)|0)!=0){STACKTOP=r2;return}r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-16|4;r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val8(r1,0);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4240(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r3<<2)>>2]](r1,r3,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r2)|0)!=0){STACKTOP=r2;return}r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-16|4;r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val16(r1,0);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4280(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r3<<2)>>2]](r1,r3,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r2)|0)!=0){STACKTOP=r2;return}r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+6;r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-16|4;r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val32(r1,0);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op42c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((HEAP32[r1>>2]&2|0)==0){_e68_exception_illegal(r1);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;STACKTOP=r2;return}r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}HEAP16[r3>>1]=HEAP16[r1+166>>1]&31;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_ea_set_val16(r1,HEAP16[r3>>1]);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4400(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU8[r3];r3=-r4|0;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;r5=r3&128;r6=r1+166|0;r7=HEAP16[r6>>1];r8=(r5|0)==0?r7&-9:r7|8;r7=(r5&r4|0)==0?r8&-3:r8|2;r8=(r3&255|0)==0?r7|4:r7&-5;HEAP16[r6>>1]=((r4|r3)&128|0)==0?r8&-18:r8|17;r8=r1+156|0;r4=HEAP32[r8>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r4&16777215;r4=r7+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP32[r1+32>>2];r9=HEAPU8[r5+r7|0]<<8|HEAPU8[r5+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val8(r1,r3&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4440(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1];r3=-r4|0;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;r5=r3&32768;r6=r1+166|0;r7=HEAP16[r6>>1];r8=(r5|0)==0?r7&-9:r7|8;r7=(r5&r4|0)==0?r8&-3:r8|2;r8=(r3&65535|0)==0?r7|4:r7&-5;HEAP16[r6>>1]=((r4|r3)&32768|0)==0?r8&-18:r8|17;r8=r1+156|0;r4=HEAP32[r8>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r4&16777215;r4=r7+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r5=HEAP32[r1+32>>2];r9=HEAPU8[r5+r7|0]<<8|HEAPU8[r5+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r3&65535);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4480(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP32[r3>>2];r3=-r4|0;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+6;r5=r1+166|0;r6=HEAP16[r5>>1];r7=(r3|0)<0?r6|8:r6&-9;r6=(r4&r3|0)<0?r7|2:r7&-3;r7=(r4|0)==0?r6|4:r6&-5;HEAP16[r5>>1]=(r4|r3|0)<0?r7|17:r7&-18;r7=r1+156|0;r4=HEAP32[r7>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r6|0]<<8|HEAPU8[r8+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val32(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op44c0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+12;r4=r1+166|0;HEAP16[r4>>1]=HEAP16[r4>>1]&-256|HEAP16[r3>>1]&31;r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4600(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r4=~HEAP8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_8(r1,15,r4);r3=r1+156|0;r5=HEAP32[r3>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val8(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4640(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=~HEAP16[r3>>1];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_16(r1,15,r4);r3=r1+156|0;r5=HEAP32[r3>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val16(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4680(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r4=~HEAP32[r3>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+6;_e68_cc_set_nz_32(r1,15,r4);r3=r1+156|0;r5=HEAP32[r3>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val32(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op46c0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((HEAP8[r1+334|0]|0)==0){_e68_exception_privilege(r1);STACKTOP=r2;return}r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+12;_e68_set_sr(r1,HEAP16[r3>>1]&-22753);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4800(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+166|0;r5=HEAP16[r4>>1];r6=((r5&65535)>>>4&1)+HEAPU8[r3]&65535;r3=-r6&65535;r7=(r3&15)==0?r3:-6-r6&65535;r6=(r7&240)==0?r7:r7-96&65535;r7=r6&65535;r3=(r7&65280|0)==0?r5&-18:r5|17;HEAP16[r4>>1]=(r7&255|0)==0?r3:r3&-5;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+6;r3=r1+156|0;r7=HEAP32[r3>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r7&16777215;r7=r5+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r7|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val8(r1,r6&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4840(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=HEAPU16[r1+160>>1];if((r2&56|0)==0){r3=r1+88+((r2&7)<<2)|0;r4=HEAP32[r3>>2];r5=r4<<16|r4>>>16;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;_e68_cc_set_nz_32(r1,15,r5);HEAP32[r3>>2]=r5;r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r6=r3&16777215;r3=r6+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r3|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r4>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;return}else{_e68_exception_bus(r1);return}}r5=r2&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,2020,32)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+12;r5=HEAP32[r1+344>>2];r2=r1+148|0;r8=HEAP32[r2>>2]-4|0;r4=r8&16777215;r6=r4+3|0;r3=r1+36|0;if(r6>>>0<HEAP32[r3>>2]>>>0){r7=r1+32|0;HEAP8[HEAP32[r7>>2]+r4|0]=r5>>>24;HEAP8[HEAP32[r7>>2]+(r4+1)|0]=r5>>>16;HEAP8[HEAP32[r7>>2]+(r4+2)|0]=r5>>>8;HEAP8[HEAP32[r7>>2]+r6|0]=r5}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r4,r5)}HEAP32[r2>>2]=r8;r8=r1+156|0;r2=HEAP32[r8>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r4=r2&16777215;r2=r4+1|0;if(r2>>>0<HEAP32[r3>>2]>>>0){r3=HEAP32[r1+32>>2];r9=HEAPU8[r3+r4|0]<<8|HEAPU8[r3+r2|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4)}HEAP16[r5>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;return}else{_e68_exception_bus(r1);return}}function _op4880(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r2=r1+160|0;r3=HEAPU16[r2>>1];r4=r3>>>3&7;if((r4|0)==0){r5=r1+88+((r3&7)<<2)|0;r3=HEAP32[r5>>2];r6=(r3&128|0)!=0?r3|65280:r3&255;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_16(r1,15,r6&65535);HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r6&65535;r6=r1+156|0;r5=HEAP32[r6>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r3>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==4){r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);return}r9=r1+164|0;r3=r1+162|0;HEAP16[r3>>1]=HEAP16[r9>>1];r7=r6&16777215;r6=r7+1|0;r5=r1+36|0;if(r6>>>0<HEAP32[r5>>2]>>>0){r8=HEAP32[r1+32>>2];r10=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r9>>1]=r10;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;r6=HEAP16[r3>>1];r8=HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2];do{if(r6<<16>>16==0){r11=0}else{if((HEAP32[r1>>2]&1|0)!=0){r11=r6;break}if((r8&1|0)==0){r11=r6;break}_e68_exception_address(r1,r8,1,1);return}}while(0);r6=r1+32|0;r12=r1+372|0;r13=r1+24|0;r14=r1+4|0;r15=0;r16=r11;r11=r8;while(1){if((r16&1)==0){r17=r11}else{r8=r11-2|0;if(r15>>>0<8){r18=r1+120+((7-r15&7)<<2)|0}else{r18=r1+88+((15-r15&7)<<2)|0}r19=HEAP32[r18>>2];r20=r19&65535;r21=r8&16777215;r22=r21+1|0;if(r22>>>0<HEAP32[r5>>2]>>>0){HEAP8[HEAP32[r6>>2]+r21|0]=(r20&65535)>>>8;HEAP8[HEAP32[r6>>2]+r22|0]=r19}else{FUNCTION_TABLE[HEAP32[r13>>2]](HEAP32[r14>>2],r21,r20)}HEAP32[r12>>2]=HEAP32[r12>>2]+4;r17=r8}r8=r15+1|0;if(r8>>>0<16){r15=r8;r16=(r16&65535)>>>1;r11=r17}else{break}}HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2]=r17;HEAP32[r12>>2]=HEAP32[r12>>2]+8;r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}HEAP16[r3>>1]=HEAP16[r9>>1];r3=r12&16777215;r12=r3+1|0;if(r12>>>0<HEAP32[r5>>2]>>>0){r5=HEAP32[r6>>2];r23=HEAPU8[r5+r3|0]<<8|HEAPU8[r5+r12|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r14>>2],r3)}HEAP16[r9>>1]=r23;if((HEAP8[r10]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r7>>2]=HEAP32[r7>>2]+2;return}else{_e68_exception_bus(r1);return}}else{r7=r1+156|0;r4=HEAP32[r7>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);return}r10=r1+164|0;r23=r1+162|0;HEAP16[r23>>1]=HEAP16[r10>>1];r9=r4&16777215;r4=r9+1|0;r3=r1+36|0;if(r4>>>0<HEAP32[r3>>2]>>>0){r14=HEAP32[r1+32>>2];r24=HEAPU8[r14+r9|0]<<8|HEAPU8[r14+r4|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r10>>1]=r24;r24=r1+336|0;if((HEAP8[r24]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r7>>2]=HEAP32[r7>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;r4=HEAP16[r23>>1];r14=HEAP16[r2>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,484,16)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r14=HEAP32[r1+344>>2];do{if(r4<<16>>16==0){r25=0}else{if((HEAP32[r1>>2]&1|0)!=0){r25=r4;break}if((r14&1|0)==0){r25=r4;break}_e68_exception_address(r1,r14,1,1);return}}while(0);r4=r1+32|0;r2=r1+372|0;r12=r1+24|0;r5=r1+4|0;r6=0;r17=r25;r25=r14;while(1){if((r17&1)==0){r26=r25}else{r14=r6&7;if(r6>>>0<8){r27=r1+88+(r14<<2)|0}else{r27=r1+120+(r14<<2)|0}r14=HEAP32[r27>>2];r11=r14&65535;r16=r25&16777215;r15=r16+1|0;if(r15>>>0<HEAP32[r3>>2]>>>0){HEAP8[HEAP32[r4>>2]+r16|0]=(r11&65535)>>>8;HEAP8[HEAP32[r4>>2]+r15|0]=r14}else{FUNCTION_TABLE[HEAP32[r12>>2]](HEAP32[r5>>2],r16,r11)}HEAP32[r2>>2]=HEAP32[r2>>2]+4;r26=r25+2|0}r11=r6+1|0;if(r11>>>0<16){r6=r11;r17=(r17&65535)>>>1;r25=r26}else{break}}HEAP32[r2>>2]=HEAP32[r2>>2]+8;r2=HEAP32[r7>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);return}HEAP16[r23>>1]=HEAP16[r10>>1];r23=r2&16777215;r2=r23+1|0;if(r2>>>0<HEAP32[r3>>2]>>>0){r3=HEAP32[r4>>2];r28=HEAPU8[r3+r23|0]<<8|HEAPU8[r3+r2|0]}else{r28=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r5>>2],r23)}HEAP16[r10>>1]=r28;if((HEAP8[r24]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;return}else{_e68_exception_bus(r1);return}}}function _op48c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r2=r1+160|0;r3=HEAPU16[r2>>1];r4=r3>>>3&7;if((r4|0)==0){r5=r1+88+((r3&7)<<2)|0;r3=HEAP32[r5>>2];r6=(r3&32768|0)!=0?r3|-65536:r3&65535;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_32(r1,15,r6);HEAP32[r5>>2]=r6;r6=r1+156|0;r5=HEAP32[r6>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r7=r5&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r5|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r3>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==4){r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);return}r9=r1+164|0;r3=r1+162|0;HEAP16[r3>>1]=HEAP16[r9>>1];r7=r6&16777215;r6=r7+1|0;r5=r1+36|0;if(r6>>>0<HEAP32[r5>>2]>>>0){r8=HEAP32[r1+32>>2];r10=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r9>>1]=r10;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;r6=HEAP16[r3>>1];r8=HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2];do{if(r6<<16>>16==0){r11=0}else{if((HEAP32[r1>>2]&1|0)!=0){r11=r6;break}if((r8&1|0)==0){r11=r6;break}_e68_exception_address(r1,r8,1,1);return}}while(0);r6=r1+32|0;r12=r1+372|0;r13=r1+28|0;r14=r1+4|0;r15=0;r16=r11;r11=r8;while(1){if((r16&1)==0){r17=r11}else{r8=r11-4|0;if(r15>>>0<8){r18=r1+120+((7-r15&7)<<2)|0}else{r18=r1+88+((15-r15&7)<<2)|0}r19=HEAP32[r18>>2];r20=r8&16777215;r21=r20+3|0;if(r21>>>0<HEAP32[r5>>2]>>>0){HEAP8[HEAP32[r6>>2]+r20|0]=r19>>>24;HEAP8[HEAP32[r6>>2]+(r20+1)|0]=r19>>>16;HEAP8[HEAP32[r6>>2]+(r20+2)|0]=r19>>>8;HEAP8[HEAP32[r6>>2]+r21|0]=r19}else{FUNCTION_TABLE[HEAP32[r13>>2]](HEAP32[r14>>2],r20,r19)}HEAP32[r12>>2]=HEAP32[r12>>2]+8;r17=r8}r8=r15+1|0;if(r8>>>0<16){r15=r8;r16=(r16&65535)>>>1;r11=r17}else{break}}HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2]=r17;HEAP32[r12>>2]=HEAP32[r12>>2]+8;r12=HEAP32[r4>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}HEAP16[r3>>1]=HEAP16[r9>>1];r3=r12&16777215;r12=r3+1|0;if(r12>>>0<HEAP32[r5>>2]>>>0){r5=HEAP32[r6>>2];r22=HEAPU8[r5+r3|0]<<8|HEAPU8[r5+r12|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r14>>2],r3)}HEAP16[r9>>1]=r22;if((HEAP8[r10]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r7>>2]=HEAP32[r7>>2]+2;return}else{_e68_exception_bus(r1);return}}else{r7=r1+156|0;r4=HEAP32[r7>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);return}r10=r1+164|0;r22=r1+162|0;HEAP16[r22>>1]=HEAP16[r10>>1];r9=r4&16777215;r4=r9+1|0;r3=r1+36|0;if(r4>>>0<HEAP32[r3>>2]>>>0){r14=HEAP32[r1+32>>2];r23=HEAPU8[r14+r9|0]<<8|HEAPU8[r14+r4|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r10>>1]=r23;r23=r1+336|0;if((HEAP8[r23]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r7>>2]=HEAP32[r7>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;r4=HEAP16[r22>>1];r14=HEAP16[r2>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,484,32)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r14=HEAP32[r1+344>>2];do{if(r4<<16>>16==0){r24=0}else{if((HEAP32[r1>>2]&1|0)!=0){r24=r4;break}if((r14&1|0)==0){r24=r4;break}_e68_exception_address(r1,r14,1,1);return}}while(0);r4=r1+32|0;r2=r1+372|0;r12=r1+28|0;r5=r1+4|0;r6=0;r17=r24;r24=r14;while(1){if((r17&1)==0){r25=r24}else{r14=r6&7;if(r6>>>0<8){r26=r1+88+(r14<<2)|0}else{r26=r1+120+(r14<<2)|0}r14=HEAP32[r26>>2];r11=r24&16777215;r16=r11+3|0;if(r16>>>0<HEAP32[r3>>2]>>>0){HEAP8[HEAP32[r4>>2]+r11|0]=r14>>>24;HEAP8[HEAP32[r4>>2]+(r11+1)|0]=r14>>>16;HEAP8[HEAP32[r4>>2]+(r11+2)|0]=r14>>>8;HEAP8[HEAP32[r4>>2]+r16|0]=r14}else{FUNCTION_TABLE[HEAP32[r12>>2]](HEAP32[r5>>2],r11,r14)}HEAP32[r2>>2]=HEAP32[r2>>2]+8;r25=r24+4|0}r14=r6+1|0;if(r14>>>0<16){r6=r14;r17=(r17&65535)>>>1;r24=r25}else{break}}HEAP32[r2>>2]=HEAP32[r2>>2]+8;r2=HEAP32[r7>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);return}HEAP16[r22>>1]=HEAP16[r10>>1];r22=r2&16777215;r2=r22+1|0;if(r2>>>0<HEAP32[r3>>2]>>>0){r3=HEAP32[r4>>2];r27=HEAPU8[r3+r22|0]<<8|HEAPU8[r3+r2|0]}else{r27=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r5>>2],r22)}HEAP16[r10>>1]=r27;if((HEAP8[r23]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;HEAP32[r9>>2]=HEAP32[r9>>2]+2;return}else{_e68_exception_bus(r1);return}}}function _op49c0(r1){FUNCTION_TABLE[HEAP32[r1+4496+(((HEAP16[r1+160>>1]&65535)>>>3&7)<<2)>>2]](r1);return}function _op4a00(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_8(r1,15,HEAP8[r3]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4a40(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_16(r1,15,HEAP16[r3>>1]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4a80(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_32(r1,15,HEAP32[r3>>2]);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op4ac0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1];if(r4<<16>>16!=19196){r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP8[r3];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+8;_e68_cc_set_nz_8(r1,15,r5);r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r4&16777215;r4=r7+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val8(r1,r5|-128);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=HEAP32[r1+64>>2];do{if((r5|0)!=0){r3=r1+152|0;r9=HEAP32[r3>>2];r6=r1+164|0;if((FUNCTION_TABLE[r5](HEAP32[r1+60>>2],HEAPU16[r6>>1])|0)!=0){break}if((HEAP32[r3>>2]|0)==(r9|0)){r9=r1+156|0;r7=HEAP32[r9>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r4=r1+162|0;HEAP16[r4>>1]=HEAP16[r6>>1];r8=r7&16777215;r7=r8+1|0;r10=r1+36|0;if(r7>>>0<HEAP32[r10>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r8|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r12;r8=r1+336|0;if((HEAP8[r8]|0)!=0){_e68_exception_bus(r1);STACKTOP=r2;return}r7=HEAP32[r9>>2]+2|0;HEAP32[r9>>2]=r7;r11=HEAP32[r3>>2]+2|0;HEAP32[r3>>2]=r11;if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}HEAP16[r4>>1]=r12;r4=r7&16777215;r13=r4+1|0;do{if(r13>>>0<HEAP32[r10>>2]>>>0){r14=HEAP32[r1+32>>2];HEAP16[r6>>1]=HEAPU8[r14+r4|0]<<8|HEAPU8[r14+r13|0];r15=r7;r16=r11}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r4);r17=(HEAP8[r8]|0)==0;HEAP16[r6>>1]=r14;if(r17){r15=HEAP32[r9>>2];r16=HEAP32[r3>>2];break}_e68_exception_bus(r1);STACKTOP=r2;return}}while(0);HEAP32[r9>>2]=r15+2;HEAP32[r3>>2]=r16+2}r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;STACKTOP=r2;return}}while(0);_e68_exception_illegal(r1);STACKTOP=r2;return}function _op4c80(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r2=r1+160|0;r3=HEAPU16[r2>>1]>>>3&7;if((r3|0)==3){r4=r1+156|0;r5=HEAP32[r4>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r4>>2]=HEAP32[r4>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=HEAP16[r7>>1];r10=HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2];do{if(r5<<16>>16==0){r12=0}else{if((HEAP32[r1>>2]&1|0)!=0){r12=r5;break}if((r10&1|0)==0){r12=r5;break}_e68_exception_address(r1,r10,1,0);return}}while(0);r5=r1+32|0;r13=r1+372|0;r14=r1+12|0;r15=r1+4|0;r16=0;r17=r12;r12=r10;while(1){if((r17&1)==0){r18=r12}else{r10=r12&16777215;r19=r10+1|0;if(r19>>>0<HEAP32[r9>>2]>>>0){r20=HEAP32[r5>>2];r21=HEAPU8[r20+r10|0]<<8|HEAPU8[r20+r19|0]}else{r21=FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r10)}r10=r21&65535;r19=(r10&32768|0)!=0?r10|-65536:r10;r10=r16&7;if(r16>>>0<8){HEAP32[r1+88+(r10<<2)>>2]=r19}else{HEAP32[r1+120+(r10<<2)>>2]=r19}HEAP32[r13>>2]=HEAP32[r13>>2]+4;r18=r12+2|0}r19=r16+1|0;if(r19>>>0<16){r16=r19;r17=(r17&65535)>>>1;r12=r18}else{break}}HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2]=r18;HEAP32[r13>>2]=HEAP32[r13>>2]+12;r13=HEAP32[r4>>2];if((r13&1|0)!=0){_e68_exception_address(r1,r13,0,0);return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r13&16777215;r13=r7+1|0;if(r13>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r5>>2];r22=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r13|0]}else{r22=FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r7)}HEAP16[r6>>1]=r22;if((HEAP8[r11]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r8>>2]=HEAP32[r8>>2]+2;return}else{_e68_exception_bus(r1);return}}else if((r3|0)==0){_e68_exception_illegal(r1);r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;return}else{r3=r1+156|0;r8=HEAP32[r3>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);return}r4=r1+164|0;r11=r1+162|0;HEAP16[r11>>1]=HEAP16[r4>>1];r22=r8&16777215;r8=r22+1|0;r6=r1+36|0;if(r8>>>0<HEAP32[r6>>2]>>>0){r7=HEAP32[r1+32>>2];r23=HEAPU8[r7+r22|0]<<8|HEAPU8[r7+r8|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r22)}HEAP16[r4>>1]=r23;r23=r1+336|0;if((HEAP8[r23]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r3>>2]=HEAP32[r3>>2]+2;r22=r1+152|0;HEAP32[r22>>2]=HEAP32[r22>>2]+2;r8=HEAP16[r11>>1];r7=HEAP16[r2>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r7<<2)>>2]](r1,r7,2028,16)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r7=HEAP32[r1+344>>2];do{if(r8<<16>>16==0){r24=0}else{if((HEAP32[r1>>2]&1|0)!=0){r24=r8;break}if((r7&1|0)==0){r24=r8;break}_e68_exception_address(r1,r7,1,0);return}}while(0);r8=r1+32|0;r2=r1+372|0;r15=r1+12|0;r14=r1+4|0;r13=0;r9=r24;r24=r7;while(1){if((r9&1)==0){r25=r24}else{r7=r24&16777215;r5=r7+1|0;if(r5>>>0<HEAP32[r6>>2]>>>0){r18=HEAP32[r8>>2];r26=HEAPU8[r18+r7|0]<<8|HEAPU8[r18+r5|0]}else{r26=FUNCTION_TABLE[HEAP32[r15>>2]](HEAP32[r14>>2],r7)}r7=r26&65535;r5=(r7&32768|0)!=0?r7|-65536:r7;r7=r13&7;if(r13>>>0<8){HEAP32[r1+88+(r7<<2)>>2]=r5}else{HEAP32[r1+120+(r7<<2)>>2]=r5}HEAP32[r2>>2]=HEAP32[r2>>2]+4;r25=r24+2|0}r5=r13+1|0;if(r5>>>0<16){r13=r5;r9=(r9&65535)>>>1;r24=r25}else{break}}HEAP32[r2>>2]=HEAP32[r2>>2]+12;r2=HEAP32[r3>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);return}HEAP16[r11>>1]=HEAP16[r4>>1];r11=r2&16777215;r2=r11+1|0;if(r2>>>0<HEAP32[r6>>2]>>>0){r6=HEAP32[r8>>2];r27=HEAPU8[r6+r11|0]<<8|HEAPU8[r6+r2|0]}else{r27=FUNCTION_TABLE[HEAP32[r15>>2]](HEAP32[r14>>2],r11)}HEAP16[r4>>1]=r27;if((HEAP8[r23]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r22>>2]=HEAP32[r22>>2]+2;return}else{_e68_exception_bus(r1);return}}}function _op4cc0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=r1+160|0;r3=HEAPU16[r2>>1]>>>3&7;if((r3|0)==0){_e68_exception_illegal(r1);r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;return}else if((r3|0)==3){r3=r1+156|0;r4=HEAP32[r3>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);return}r5=r1+164|0;r6=r1+162|0;HEAP16[r6>>1]=HEAP16[r5>>1];r7=r4&16777215;r4=r7+1|0;r8=r1+36|0;if(r4>>>0<HEAP32[r8>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r4|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r10;r10=r1+336|0;if((HEAP8[r10]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r3>>2]=HEAP32[r3>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;r4=HEAP16[r6>>1];r9=HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2];do{if(r4<<16>>16==0){r11=0}else{if((HEAP32[r1>>2]&1|0)!=0){r11=r4;break}if((r9&1|0)==0){r11=r4;break}_e68_exception_address(r1,r9,1,0);return}}while(0);r4=r1+32|0;r12=r1+372|0;r13=r1+16|0;r14=r1+4|0;r15=r11;r11=r9;r9=0;while(1){if((r15&1)==0){r16=r11}else{r17=r11&16777215;r18=r17+3|0;if(r18>>>0<HEAP32[r8>>2]>>>0){r19=HEAP32[r4>>2];r20=((HEAPU8[r19+r17|0]<<8|HEAPU8[r19+(r17+1)|0])<<8|HEAPU8[r19+(r17+2)|0])<<8|HEAPU8[r19+r18|0]}else{r20=FUNCTION_TABLE[HEAP32[r13>>2]](HEAP32[r14>>2],r17)}r17=r9&7;if(r9>>>0<8){HEAP32[r1+88+(r17<<2)>>2]=r20}else{HEAP32[r1+120+(r17<<2)>>2]=r20}HEAP32[r12>>2]=HEAP32[r12>>2]+8;r16=r11+4|0}r17=r9+1|0;if(r17>>>0<16){r15=(r15&65535)>>>1;r11=r16;r9=r17}else{break}}HEAP32[r1+120+((HEAP16[r2>>1]&7)<<2)>>2]=r16;HEAP32[r12>>2]=HEAP32[r12>>2]+12;r12=HEAP32[r3>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}HEAP16[r6>>1]=HEAP16[r5>>1];r6=r12&16777215;r12=r6+1|0;if(r12>>>0<HEAP32[r8>>2]>>>0){r8=HEAP32[r4>>2];r21=HEAPU8[r8+r6|0]<<8|HEAPU8[r8+r12|0]}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r14>>2],r6)}HEAP16[r5>>1]=r21;if((HEAP8[r10]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r7>>2]=HEAP32[r7>>2]+2;return}else{_e68_exception_bus(r1);return}}else{r7=r1+156|0;r3=HEAP32[r7>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);return}r10=r1+164|0;r21=r1+162|0;HEAP16[r21>>1]=HEAP16[r10>>1];r5=r3&16777215;r3=r5+1|0;r6=r1+36|0;if(r3>>>0<HEAP32[r6>>2]>>>0){r14=HEAP32[r1+32>>2];r22=HEAPU8[r14+r5|0]<<8|HEAPU8[r14+r3|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r10>>1]=r22;r22=r1+336|0;if((HEAP8[r22]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r7>>2]=HEAP32[r7>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;r3=HEAP16[r21>>1];r14=HEAP16[r2>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,2028,32)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r14=HEAP32[r1+344>>2];do{if(r3<<16>>16==0){r23=0}else{if((HEAP32[r1>>2]&1|0)!=0){r23=r3;break}if((r14&1|0)==0){r23=r3;break}_e68_exception_address(r1,r14,1,0);return}}while(0);r3=r1+32|0;r2=r1+372|0;r12=r1+16|0;r8=r1+4|0;r4=r23;r23=r14;r14=0;while(1){if((r4&1)==0){r24=r23}else{r16=r23&16777215;r9=r16+3|0;if(r9>>>0<HEAP32[r6>>2]>>>0){r11=HEAP32[r3>>2];r25=((HEAPU8[r11+r16|0]<<8|HEAPU8[r11+(r16+1)|0])<<8|HEAPU8[r11+(r16+2)|0])<<8|HEAPU8[r11+r9|0]}else{r25=FUNCTION_TABLE[HEAP32[r12>>2]](HEAP32[r8>>2],r16)}r16=r14&7;if(r14>>>0<8){HEAP32[r1+88+(r16<<2)>>2]=r25}else{HEAP32[r1+120+(r16<<2)>>2]=r25}HEAP32[r2>>2]=HEAP32[r2>>2]+8;r24=r23+4|0}r16=r14+1|0;if(r16>>>0<16){r4=(r4&65535)>>>1;r23=r24;r14=r16}else{break}}HEAP32[r2>>2]=HEAP32[r2>>2]+12;r2=HEAP32[r7>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);return}HEAP16[r21>>1]=HEAP16[r10>>1];r21=r2&16777215;r2=r21+1|0;if(r2>>>0<HEAP32[r6>>2]>>>0){r6=HEAP32[r3>>2];r26=HEAPU8[r6+r21|0]<<8|HEAPU8[r6+r2|0]}else{r26=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r8>>2],r21)}HEAP16[r10>>1]=r26;if((HEAP8[r22]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]+2;return}else{_e68_exception_bus(r1);return}}}function _op4e40(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562,r563,r564,r565,r566,r567,r568,r569,r570,r571,r572,r573,r574,r575,r576,r577,r578,r579,r580,r581,r582,r583,r584,r585,r586,r587,r588,r589,r590,r591,r592,r593,r594,r595,r596,r597,r598,r599,r600,r601,r602,r603,r604,r605,r606,r607,r608,r609,r610,r611,r612,r613,r614,r615,r616,r617,r618,r619,r620,r621,r622,r623,r624,r625,r626,r627,r628,r629,r630,r631,r632,r633,r634,r635,r636,r637,r638,r639,r640,r641,r642,r643,r644,r645,r646,r647,r648,r649,r650,r651,r652,r653,r654,r655,r656,r657,r658,r659,r660,r661,r662,r663,r664,r665,r666,r667,r668,r669,r670,r671,r672,r673,r674,r675,r676,r677,r678,r679,r680,r681,r682,r683,r684,r685,r686,r687,r688,r689,r690,r691,r692,r693,r694,r695,r696,r697,r698,r699,r700,r701,r702,r703,r704,r705,r706,r707,r708,r709,r710,r711,r712,r713,r714,r715,r716,r717,r718,r719,r720,r721,r722,r723,r724,r725,r726,r727,r728,r729,r730,r731,r732,r733,r734,r735,r736,r737,r738,r739,r740,r741,r742,r743,r744,r745,r746,r747,r748,r749,r750,r751,r752,r753,r754,r755,r756,r757,r758,r759,r760,r761,r762,r763,r764,r765,r766,r767,r768,r769,r770,r771,r772,r773,r774,r775,r776,r777,r778,r779,r780,r781,r782,r783,r784,r785,r786,r787,r788,r789,r790,r791,r792,r793,r794,r795,r796,r797,r798,r799,r800,r801,r802,r803,r804,r805,r806,r807,r808,r809,r810,r811,r812,r813,r814,r815,r816,r817,r818,r819,r820,r821,r822,r823,r824,r825,r826,r827,r828,r829,r830,r831,r832,r833,r834,r835,r836,r837,r838,r839,r840,r841,r842,r843,r844,r845,r846,r847,r848,r849,r850,r851,r852,r853,r854,r855,r856,r857,r858,r859,r860,r861,r862,r863,r864,r865,r866,r867,r868,r869,r870,r871,r872,r873,r874,r875,r876,r877,r878,r879,r880,r881,r882,r883,r884,r885,r886,r887,r888,r889,r890,r891,r892,r893,r894,r895,r896,r897,r898,r899,r900,r901,r902,r903,r904,r905,r906,r907,r908,r909,r910,r911,r912,r913,r914,r915,r916,r917,r918,r919,r920,r921,r922,r923,r924,r925,r926,r927,r928,r929,r930,r931,r932,r933,r934,r935,r936,r937,r938,r939,r940,r941,r942,r943,r944,r945,r946,r947,r948,r949,r950,r951,r952,r953,r954,r955,r956,r957,r958,r959,r960,r961,r962,r963,r964,r965,r966,r967,r968,r969,r970,r971,r972,r973,r974,r975,r976,r977,r978,r979,r980,r981,r982,r983,r984,r985,r986,r987,r988,r989,r990,r991,r992,r993,r994,r995,r996,r997,r998,r999,r1000,r1001,r1002,r1003,r1004,r1005,r1006,r1007,r1008,r1009,r1010,r1011,r1012,r1013,r1014,r1015,r1016,r1017,r1018,r1019,r1020,r1021,r1022,r1023,r1024,r1025,r1026,r1027,r1028,r1029,r1030,r1031,r1032,r1033,r1034,r1035,r1036,r1037,r1038,r1039,r1040,r1041,r1042,r1043,r1044,r1045,r1046,r1047,r1048,r1049,r1050,r1051,r1052,r1053,r1054,r1055,r1056,r1057,r1058,r1059,r1060,r1061,r1062,r1063,r1064,r1065,r1066,r1067,r1068,r1069,r1070,r1071,r1072,r1073,r1074,r1075,r1076,r1077,r1078,r1079,r1080,r1081,r1082,r1083,r1084,r1085,r1086,r1087,r1088,r1089,r1090,r1091,r1092,r1093,r1094,r1095,r1096,r1097,r1098,r1099,r1100,r1101,r1102,r1103,r1104,r1105,r1106,r1107,r1108,r1109,r1110,r1111,r1112,r1113,r1114,r1115,r1116,r1117,r1118,r1119,r1120,r1121,r1122,r1123,r1124,r1125,r1126,r1127,r1128,r1129,r1130,r1131,r1132,r1133,r1134,r1135,r1136,r1137,r1138,r1139,r1140,r1141,r1142,r1143,r1144,r1145,r1146,r1147,r1148,r1149,r1150,r1151,r1152,r1153,r1154,r1155,r1156,r1157,r1158,r1159,r1160,r1161,r1162,r1163,r1164,r1165,r1166,r1167,r1168,r1169,r1170,r1171,r1172,r1173,r1174,r1175,r1176,r1177,r1178,r1179,r1180,r1181,r1182,r1183,r1184,r1185,r1186,r1187,r1188,r1189,r1190,r1191,r1192,r1193,r1194,r1195,r1196,r1197,r1198,r1199,r1200,r1201,r1202,r1203,r1204,r1205,r1206,r1207,r1208,r1209,r1210,r1211,r1212,r1213,r1214,r1215,r1216,r1217,r1218,r1219,r1220,r1221,r1222,r1223,r1224,r1225,r1226,r1227,r1228,r1229,r1230,r1231,r1232,r1233,r1234,r1235,r1236,r1237,r1238,r1239,r1240,r1241,r1242,r1243,r1244,r1245,r1246,r1247,r1248,r1249,r1250,r1251,r1252,r1253,r1254,r1255,r1256,r1257,r1258,r1259,r1260,r1261,r1262,r1263,r1264,r1265,r1266,r1267,r1268,r1269,r1270,r1271,r1272,r1273,r1274,r1275,r1276,r1277,r1278,r1279,r1280,r1281,r1282,r1283,r1284,r1285,r1286,r1287,r1288,r1289,r1290,r1291,r1292,r1293,r1294,r1295,r1296,r1297,r1298,r1299,r1300;r2=0;r3=r1+160|0;r4=HEAP16[r3>>1];r5=r4&65535;switch(r5|0){case 20085:{r6=r1+148|0;r7=HEAP32[r6>>2];r8=r7&16777215;r9=r8+3|0;r10=r1+36|0;r11=HEAP32[r10>>2];r12=r9>>>0<r11>>>0;if(r12){r13=r1+32|0;r14=HEAP32[r13>>2];r15=r14+r8|0;r16=HEAP8[r15];r17=r16&255;r18=r17<<8;r19=r8+1|0;r20=r14+r19|0;r21=HEAP8[r20];r22=r21&255;r23=r18|r22;r24=r23<<8;r25=r8+2|0;r26=r14+r25|0;r27=HEAP8[r26];r28=r27&255;r29=r24|r28;r30=r29<<8;r31=r14+r9|0;r32=HEAP8[r31];r33=r32&255;r34=r30|r33;r35=r34}else{r36=r1+16|0;r37=HEAP32[r36>>2];r38=r1+4|0;r39=HEAP32[r38>>2];r40=FUNCTION_TABLE[r37](r39,r8);r35=r40}r41=r1+156|0;HEAP32[r41>>2]=r35;r42=r7+4|0;HEAP32[r6>>2]=r42;r43=r1+372|0;r44=HEAP32[r43>>2];r45=r44+16|0;HEAP32[r43>>2]=r45;r46=r35&1;r47=(r46|0)==0;if(!r47){_e68_exception_address(r1,r35,0,0);return}r48=r1+164|0;r49=HEAP16[r48>>1];r50=r1+162|0;HEAP16[r50>>1]=r49;r51=r35&16777215;r52=r51+1|0;r53=HEAP32[r10>>2];r54=r52>>>0<r53>>>0;if(r54){r55=r1+32|0;r56=HEAP32[r55>>2];r57=r56+r51|0;r58=HEAP8[r57];r59=r58&255;r60=r59<<8;r61=r56+r52|0;r62=HEAP8[r61];r63=r62&255;r64=r60|r63;r65=r64}else{r66=r1+12|0;r67=HEAP32[r66>>2];r68=r1+4|0;r69=HEAP32[r68>>2];r70=FUNCTION_TABLE[r67](r69,r51);r65=r70}HEAP16[r48>>1]=r65;r71=r1+336|0;r72=HEAP8[r71];r73=r72<<24>>24==0;if(!r73){_e68_exception_bus(r1);return}r74=HEAP32[r41>>2];r75=r74+2|0;HEAP32[r41>>2]=r75;r76=r1+152|0;r77=HEAP32[r76>>2];r78=r77+2|0;HEAP32[r76>>2]=r78;r79=r75&1;r80=(r79|0)==0;if(!r80){_e68_exception_address(r1,r75,0,0);return}HEAP16[r50>>1]=r65;r81=r75&16777215;r82=r81+1|0;r83=HEAP32[r10>>2];r84=r82>>>0<r83>>>0;do{if(r84){r85=r1+32|0;r86=HEAP32[r85>>2];r87=r86+r81|0;r88=HEAP8[r87];r89=r88&255;r90=r89<<8;r91=r86+r82|0;r92=HEAP8[r91];r93=r92&255;r94=r90|r93;HEAP16[r48>>1]=r94;r95=r75}else{r96=r1+12|0;r97=HEAP32[r96>>2];r98=r1+4|0;r99=HEAP32[r98>>2];r100=FUNCTION_TABLE[r97](r99,r81);r101=HEAP8[r71];r102=r101<<24>>24==0;HEAP16[r48>>1]=r100;if(r102){r103=HEAP32[r41>>2];r95=r103;break}_e68_exception_bus(r1);return}}while(0);r104=r95+2|0;HEAP32[r41>>2]=r104;r105=r95-2|0;HEAP32[r76>>2]=r105;return;break};case 20087:{r106=r1+148|0;r107=HEAP32[r106>>2];r108=r107&16777215;r109=r108+1|0;r110=r1+36|0;r111=HEAP32[r110>>2];r112=r109>>>0<r111>>>0;if(r112){r113=r1+32|0;r114=HEAP32[r113>>2];r115=r114+r109|0;r116=HEAP8[r115];r117=r116;r118=r111}else{r119=r1+12|0;r120=HEAP32[r119>>2];r121=r1+4|0;r122=HEAP32[r121>>2];r123=FUNCTION_TABLE[r120](r122,r108);r124=r123&255;r125=HEAP32[r110>>2];r117=r124;r118=r125}r126=r117&31;r127=r1+166|0;r128=HEAP16[r127>>1];r129=r128&-256;r130=r126&255;r131=r129|r130;HEAP16[r127>>1]=r131;r132=r107+2|0;r133=r132&16777215;r134=r133+3|0;r135=r134>>>0<r118>>>0;if(r135){r136=r1+32|0;r137=HEAP32[r136>>2];r138=r137+r133|0;r139=HEAP8[r138];r140=r139&255;r141=r140<<8;r142=r133+1|0;r143=r137+r142|0;r144=HEAP8[r143];r145=r144&255;r146=r141|r145;r147=r146<<8;r148=r133+2|0;r149=r137+r148|0;r150=HEAP8[r149];r151=r150&255;r152=r147|r151;r153=r152<<8;r154=r137+r134|0;r155=HEAP8[r154];r156=r155&255;r157=r153|r156;r158=r157}else{r159=r1+16|0;r160=HEAP32[r159>>2];r161=r1+4|0;r162=HEAP32[r161>>2];r163=FUNCTION_TABLE[r160](r162,r133);r158=r163}r164=r1+156|0;HEAP32[r164>>2]=r158;r165=r107+6|0;HEAP32[r106>>2]=r165;r166=r1+372|0;r167=HEAP32[r166>>2];r168=r167+20|0;HEAP32[r166>>2]=r168;r169=r158&1;r170=(r169|0)==0;if(!r170){_e68_exception_address(r1,r158,0,0);return}r171=r1+164|0;r172=HEAP16[r171>>1];r173=r1+162|0;HEAP16[r173>>1]=r172;r174=r158&16777215;r175=r174+1|0;r176=HEAP32[r110>>2];r177=r175>>>0<r176>>>0;if(r177){r178=r1+32|0;r179=HEAP32[r178>>2];r180=r179+r174|0;r181=HEAP8[r180];r182=r181&255;r183=r182<<8;r184=r179+r175|0;r185=HEAP8[r184];r186=r185&255;r187=r183|r186;r188=r187}else{r189=r1+12|0;r190=HEAP32[r189>>2];r191=r1+4|0;r192=HEAP32[r191>>2];r193=FUNCTION_TABLE[r190](r192,r174);r188=r193}HEAP16[r171>>1]=r188;r194=r1+336|0;r195=HEAP8[r194];r196=r195<<24>>24==0;if(!r196){_e68_exception_bus(r1);return}r197=HEAP32[r164>>2];r198=r197+2|0;HEAP32[r164>>2]=r198;r199=r1+152|0;r200=HEAP32[r199>>2];r201=r200+2|0;HEAP32[r199>>2]=r201;r202=r198&1;r203=(r202|0)==0;if(!r203){_e68_exception_address(r1,r198,0,0);return}HEAP16[r173>>1]=r188;r204=r198&16777215;r205=r204+1|0;r206=HEAP32[r110>>2];r207=r205>>>0<r206>>>0;do{if(r207){r208=r1+32|0;r209=HEAP32[r208>>2];r210=r209+r204|0;r211=HEAP8[r210];r212=r211&255;r213=r212<<8;r214=r209+r205|0;r215=HEAP8[r214];r216=r215&255;r217=r213|r216;HEAP16[r171>>1]=r217;r218=r198}else{r219=r1+12|0;r220=HEAP32[r219>>2];r221=r1+4|0;r222=HEAP32[r221>>2];r223=FUNCTION_TABLE[r220](r222,r204);r224=HEAP8[r194];r225=r224<<24>>24==0;HEAP16[r171>>1]=r223;if(r225){r226=HEAP32[r164>>2];r218=r226;break}_e68_exception_bus(r1);return}}while(0);r227=r218+2|0;HEAP32[r164>>2]=r227;r228=r218-2|0;HEAP32[r199>>2]=r228;return;break};case 20080:{r229=r1+334|0;r230=HEAP8[r229];r231=r230<<24>>24==0;if(r231){_e68_exception_privilege(r1);return}r232=r1|0;r233=HEAP32[r232>>2];r234=r233&8;r235=(r234|0)==0;r236=r1+372|0;r237=HEAP32[r236>>2];if(r235){r238=r237+132|0;HEAP32[r236>>2]=r238;_e68_reset(r1);return}r239=r237+4|0;HEAP32[r236>>2]=r239;r240=r1+156|0;r241=HEAP32[r240>>2];r242=r241&1;r243=(r242|0)==0;if(!r243){_e68_exception_address(r1,r241,0,0);return}r244=r1+164|0;r245=HEAP16[r244>>1];r246=r1+162|0;HEAP16[r246>>1]=r245;r247=r241&16777215;r248=r247+1|0;r249=r1+36|0;r250=HEAP32[r249>>2];r251=r248>>>0<r250>>>0;if(r251){r252=r1+32|0;r253=HEAP32[r252>>2];r254=r253+r247|0;r255=HEAP8[r254];r256=r255&255;r257=r256<<8;r258=r253+r248|0;r259=HEAP8[r258];r260=r259&255;r261=r257|r260;r262=r261}else{r263=r1+12|0;r264=HEAP32[r263>>2];r265=r1+4|0;r266=HEAP32[r265>>2];r267=FUNCTION_TABLE[r264](r266,r247);r262=r267}HEAP16[r244>>1]=r262;r268=r1+336|0;r269=HEAP8[r268];r270=r269<<24>>24==0;if(r270){r271=HEAP32[r240>>2];r272=r271+2|0;HEAP32[r240>>2]=r272;r273=r1+152|0;r274=HEAP32[r273>>2];r275=r274+2|0;HEAP32[r273>>2]=r275;return}else{_e68_exception_bus(r1);return}break};case 20086:{r276=r1+156|0;r277=HEAP32[r276>>2];r278=r277&1;r279=(r278|0)==0;if(!r279){_e68_exception_address(r1,r277,0,0);return}r280=r1+164|0;r281=HEAP16[r280>>1];r282=r1+162|0;HEAP16[r282>>1]=r281;r283=r277&16777215;r284=r283+1|0;r285=r1+36|0;r286=HEAP32[r285>>2];r287=r284>>>0<r286>>>0;if(r287){r288=r1+32|0;r289=HEAP32[r288>>2];r290=r289+r283|0;r291=HEAP8[r290];r292=r291&255;r293=r292<<8;r294=r289+r284|0;r295=HEAP8[r294];r296=r295&255;r297=r293|r296;r298=r297}else{r299=r1+12|0;r300=HEAP32[r299>>2];r301=r1+4|0;r302=HEAP32[r301>>2];r303=FUNCTION_TABLE[r300](r302,r283);r298=r303}HEAP16[r280>>1]=r298;r304=r1+336|0;r305=HEAP8[r304];r306=r305<<24>>24==0;if(!r306){_e68_exception_bus(r1);return}r307=HEAP32[r276>>2];r308=r307+2|0;HEAP32[r276>>2]=r308;r309=r1+152|0;r310=HEAP32[r309>>2];r311=r310+2|0;HEAP32[r309>>2]=r311;r312=r1+166|0;r313=HEAP16[r312>>1];r314=r313&2;r315=r314<<16>>16==0;if(r315){r316=r1+372|0;r317=HEAP32[r316>>2];r318=r317+4|0;HEAP32[r316>>2]=r318;return}else{_e68_exception_overflow(r1);return}break};case 20090:{r319=r1|0;r320=HEAP32[r319>>2];r321=r320&2;r322=(r321|0)==0;if(r322){_e68_exception_illegal(r1);r323=r1+372|0;r324=HEAP32[r323>>2];r325=r324+2|0;HEAP32[r323>>2]=r325;return}r326=r1+334|0;r327=HEAP8[r326];r328=r327<<24>>24==0;if(r328){_e68_exception_privilege(r1);return}r329=r1+156|0;r330=HEAP32[r329>>2];r331=r330&1;r332=(r331|0)==0;if(!r332){_e68_exception_address(r1,r330,0,0);return}r333=r1+164|0;r334=HEAP16[r333>>1];r335=r1+162|0;HEAP16[r335>>1]=r334;r336=r330&16777215;r337=r336+1|0;r338=r1+36|0;r339=HEAP32[r338>>2];r340=r337>>>0<r339>>>0;if(r340){r341=r1+32|0;r342=HEAP32[r341>>2];r343=r342+r336|0;r344=HEAP8[r343];r345=r344&255;r346=r345<<8;r347=r342+r337|0;r348=HEAP8[r347];r349=r348&255;r350=r346|r349;r351=r350}else{r352=r1+12|0;r353=HEAP32[r352>>2];r354=r1+4|0;r355=HEAP32[r354>>2];r356=FUNCTION_TABLE[r353](r355,r336);r351=r356}HEAP16[r333>>1]=r351;r357=r1+336|0;r358=HEAP8[r357];r359=r358<<24>>24==0;if(!r359){_e68_exception_bus(r1);return}r360=HEAP32[r329>>2];r361=r360+2|0;HEAP32[r329>>2]=r361;r362=r1+152|0;r363=HEAP32[r362>>2];r364=r363+2|0;HEAP32[r362>>2]=r364;r365=HEAP16[r335>>1];r366=r365&65535;r367=r366&4095;r368=r366>>>12;L127:do{switch(r367|0){case 0:{r369=r1+180|0;r370=HEAP32[r369>>2];r371=r370&3;r372=r371;break};case 1:{r373=r1+184|0;r374=HEAP32[r373>>2];r375=r374&3;r372=r375;break};case 2:{r376=HEAP32[r319>>2];r377=r376&4;r378=(r377|0)==0;if(!r378){r379=r1+176|0;r380=HEAP32[r379>>2];r372=r380;break L127}_e68_exception_illegal(r1);r381=r1+372|0;r382=HEAP32[r381>>2];r383=r382+2|0;HEAP32[r381>>2]=r383;return;break};case 2048:{r384=HEAP8[r326];r385=r384<<24>>24==0;r386=r1+168|0;r387=r1+148|0;r388=r385?r387:r386;r389=HEAP32[r388>>2];r372=r389;break};case 2049:{r390=r1+176|0;r391=HEAP32[r390>>2];r372=r391;break};case 2050:{r392=HEAP32[r319>>2];r393=r392&4;r394=(r393|0)==0;if(!r394){r395=r1+176|0;r396=HEAP32[r395>>2];r372=r396;break L127}_e68_exception_illegal(r1);r397=r1+372|0;r398=HEAP32[r397>>2];r399=r398+2|0;HEAP32[r397>>2]=r399;return;break};default:{_e68_exception_illegal(r1);return}}}while(0);r400=r368&8;r401=(r400|0)==0;r402=r368&7;if(r401){r403=r1+88+(r402<<2)|0;HEAP32[r403>>2]=r372}else{r404=r1+120+(r402<<2)|0;HEAP32[r404>>2]=r372}r405=r1+372|0;r406=HEAP32[r405>>2];r407=r406+12|0;HEAP32[r405>>2]=r407;r408=HEAP32[r329>>2];r409=r408&1;r410=(r409|0)==0;if(!r410){_e68_exception_address(r1,r408,0,0);return}r411=HEAP16[r333>>1];HEAP16[r335>>1]=r411;r412=r408&16777215;r413=r412+1|0;r414=HEAP32[r338>>2];r415=r413>>>0<r414>>>0;if(r415){r416=r1+32|0;r417=HEAP32[r416>>2];r418=r417+r412|0;r419=HEAP8[r418];r420=r419&255;r421=r420<<8;r422=r417+r413|0;r423=HEAP8[r422];r424=r423&255;r425=r421|r424;r426=r425}else{r427=r1+12|0;r428=HEAP32[r427>>2];r429=r1+4|0;r430=HEAP32[r429>>2];r431=FUNCTION_TABLE[r428](r430,r412);r426=r431}HEAP16[r333>>1]=r426;r432=HEAP8[r357];r433=r432<<24>>24==0;if(r433){r434=HEAP32[r329>>2];r435=r434+2|0;HEAP32[r329>>2]=r435;r436=HEAP32[r362>>2];r437=r436+2|0;HEAP32[r362>>2]=r437;return}else{_e68_exception_bus(r1);return}break};case 20084:{r438=r1|0;r439=HEAP32[r438>>2];r440=r439&2;r441=(r440|0)==0;if(r441){_e68_exception_illegal(r1);r442=r1+372|0;r443=HEAP32[r442>>2];r444=r443+2|0;HEAP32[r442>>2]=r444;return}r445=r1+156|0;r446=HEAP32[r445>>2];r447=r446&1;r448=(r447|0)==0;if(!r448){_e68_exception_address(r1,r446,0,0);return}r449=r1+164|0;r450=HEAP16[r449>>1];r451=r1+162|0;HEAP16[r451>>1]=r450;r452=r446&16777215;r453=r452+1|0;r454=r1+36|0;r455=HEAP32[r454>>2];r456=r453>>>0<r455>>>0;if(r456){r457=r1+32|0;r458=HEAP32[r457>>2];r459=r458+r452|0;r460=HEAP8[r459];r461=r460&255;r462=r461<<8;r463=r458+r453|0;r464=HEAP8[r463];r465=r464&255;r466=r462|r465;r467=r466}else{r468=r1+12|0;r469=HEAP32[r468>>2];r470=r1+4|0;r471=HEAP32[r470>>2];r472=FUNCTION_TABLE[r469](r471,r452);r467=r472}HEAP16[r449>>1]=r467;r473=r1+336|0;r474=HEAP8[r473];r475=r474<<24>>24==0;if(!r475){_e68_exception_bus(r1);return}r476=HEAP32[r445>>2];r477=r476+2|0;HEAP32[r445>>2]=r477;r478=r1+152|0;r479=HEAP32[r478>>2];r480=r479+2|0;HEAP32[r478>>2]=r480;r481=HEAP16[r451>>1];r482=r481&65535;r483=r482&32768;r484=(r483|0)!=0;r485=r482|-65536;r486=r484?r485:r482;r487=r1+148|0;r488=HEAP32[r487>>2];r489=r488&16777215;r490=r489+3|0;r491=HEAP32[r454>>2];r492=r490>>>0<r491>>>0;if(r492){r493=r1+32|0;r494=HEAP32[r493>>2];r495=r494+r489|0;r496=HEAP8[r495];r497=r496&255;r498=r497<<8;r499=r489+1|0;r500=r494+r499|0;r501=HEAP8[r500];r502=r501&255;r503=r498|r502;r504=r503<<8;r505=r489+2|0;r506=r494+r505|0;r507=HEAP8[r506];r508=r507&255;r509=r504|r508;r510=r509<<8;r511=r494+r490|0;r512=HEAP8[r511];r513=r512&255;r514=r510|r513;r515=r514}else{r516=r1+16|0;r517=HEAP32[r516>>2];r518=r1+4|0;r519=HEAP32[r518>>2];r520=FUNCTION_TABLE[r517](r519,r489);r515=r520}HEAP32[r445>>2]=r515;r521=r488+4|0;r522=r521+r486|0;HEAP32[r487>>2]=r522;r523=r1+372|0;r524=HEAP32[r523>>2];r525=r524+16|0;HEAP32[r523>>2]=r525;r526=r515&1;r527=(r526|0)==0;if(!r527){_e68_exception_address(r1,r515,0,0);return}r528=HEAP16[r449>>1];HEAP16[r451>>1]=r528;r529=r515&16777215;r530=r529+1|0;r531=HEAP32[r454>>2];r532=r530>>>0<r531>>>0;if(r532){r533=r1+32|0;r534=HEAP32[r533>>2];r535=r534+r529|0;r536=HEAP8[r535];r537=r536&255;r538=r537<<8;r539=r534+r530|0;r540=HEAP8[r539];r541=r540&255;r542=r538|r541;r543=r542}else{r544=r1+12|0;r545=HEAP32[r544>>2];r546=r1+4|0;r547=HEAP32[r546>>2];r548=FUNCTION_TABLE[r545](r547,r529);r543=r548}HEAP16[r449>>1]=r543;r549=HEAP8[r473];r550=r549<<24>>24==0;if(!r550){_e68_exception_bus(r1);return}r551=HEAP32[r445>>2];r552=r551+2|0;HEAP32[r445>>2]=r552;r553=HEAP32[r478>>2];r554=r553+2|0;HEAP32[r478>>2]=r554;r555=r552&1;r556=(r555|0)==0;if(!r556){_e68_exception_address(r1,r552,0,0);return}HEAP16[r451>>1]=r543;r557=r552&16777215;r558=r557+1|0;r559=HEAP32[r454>>2];r560=r558>>>0<r559>>>0;do{if(r560){r561=r1+32|0;r562=HEAP32[r561>>2];r563=r562+r557|0;r564=HEAP8[r563];r565=r564&255;r566=r565<<8;r567=r562+r558|0;r568=HEAP8[r567];r569=r568&255;r570=r566|r569;HEAP16[r449>>1]=r570;r571=r552}else{r572=r1+12|0;r573=HEAP32[r572>>2];r574=r1+4|0;r575=HEAP32[r574>>2];r576=FUNCTION_TABLE[r573](r575,r557);r577=HEAP8[r473];r578=r577<<24>>24==0;HEAP16[r449>>1]=r576;if(r578){r579=HEAP32[r445>>2];r571=r579;break}_e68_exception_bus(r1);return}}while(0);r580=r571+2|0;HEAP32[r445>>2]=r580;r581=r571-2|0;HEAP32[r478>>2]=r581;return;break};case 20081:{r582=r1+372|0;r583=HEAP32[r582>>2];r584=r583+4|0;HEAP32[r582>>2]=r584;r585=r1+156|0;r586=HEAP32[r585>>2];r587=r586&1;r588=(r587|0)==0;if(!r588){_e68_exception_address(r1,r586,0,0);return}r589=r1+164|0;r590=HEAP16[r589>>1];r591=r1+162|0;HEAP16[r591>>1]=r590;r592=r586&16777215;r593=r592+1|0;r594=r1+36|0;r595=HEAP32[r594>>2];r596=r593>>>0<r595>>>0;if(r596){r597=r1+32|0;r598=HEAP32[r597>>2];r599=r598+r592|0;r600=HEAP8[r599];r601=r600&255;r602=r601<<8;r603=r598+r593|0;r604=HEAP8[r603];r605=r604&255;r606=r602|r605;r607=r606}else{r608=r1+12|0;r609=HEAP32[r608>>2];r610=r1+4|0;r611=HEAP32[r610>>2];r612=FUNCTION_TABLE[r609](r611,r592);r607=r612}HEAP16[r589>>1]=r607;r613=r1+336|0;r614=HEAP8[r613];r615=r614<<24>>24==0;if(r615){r616=HEAP32[r585>>2];r617=r616+2|0;HEAP32[r585>>2]=r617;r618=r1+152|0;r619=HEAP32[r618>>2];r620=r619+2|0;HEAP32[r618>>2]=r620;return}else{_e68_exception_bus(r1);return}break};case 20082:{r621=r1+334|0;r622=HEAP8[r621];r623=r622<<24>>24==0;if(r623){_e68_exception_privilege(r1);return}r624=r1+156|0;r625=HEAP32[r624>>2];r626=r625&1;r627=(r626|0)==0;if(!r627){_e68_exception_address(r1,r625,0,0);return}r628=r1+164|0;r629=HEAP16[r628>>1];r630=r1+162|0;HEAP16[r630>>1]=r629;r631=r625&16777215;r632=r631+1|0;r633=r1+36|0;r634=HEAP32[r633>>2];r635=r632>>>0<r634>>>0;if(r635){r636=r1+32|0;r637=HEAP32[r636>>2];r638=r637+r631|0;r639=HEAP8[r638];r640=r639&255;r641=r640<<8;r642=r637+r632|0;r643=HEAP8[r642];r644=r643&255;r645=r641|r644;r646=r645}else{r647=r1+12|0;r648=HEAP32[r647>>2];r649=r1+4|0;r650=HEAP32[r649>>2];r651=FUNCTION_TABLE[r648](r650,r631);r646=r651}HEAP16[r628>>1]=r646;r652=r1+336|0;r653=HEAP8[r652];r654=r653<<24>>24==0;if(!r654){_e68_exception_bus(r1);return}r655=HEAP32[r624>>2];r656=r655+2|0;HEAP32[r624>>2]=r656;r657=r1+152|0;r658=HEAP32[r657>>2];r659=r658+2|0;HEAP32[r657>>2]=r659;r660=HEAP16[r630>>1];_e68_set_sr(r1,r660);r661=r1+372|0;r662=HEAP32[r661>>2];r663=r662+4|0;HEAP32[r661>>2]=r663;r664=r1+335|0;r665=HEAP8[r664];r666=r665|1;HEAP8[r664]=r666;r667=HEAP32[r624>>2];r668=r667&1;r669=(r668|0)==0;if(!r669){_e68_exception_address(r1,r667,0,0);return}r670=HEAP16[r628>>1];HEAP16[r630>>1]=r670;r671=r667&16777215;r672=r671+1|0;r673=HEAP32[r633>>2];r674=r672>>>0<r673>>>0;if(r674){r675=r1+32|0;r676=HEAP32[r675>>2];r677=r676+r671|0;r678=HEAP8[r677];r679=r678&255;r680=r679<<8;r681=r676+r672|0;r682=HEAP8[r681];r683=r682&255;r684=r680|r683;r685=r684}else{r686=r1+12|0;r687=HEAP32[r686>>2];r688=r1+4|0;r689=HEAP32[r688>>2];r690=FUNCTION_TABLE[r687](r689,r671);r685=r690}HEAP16[r628>>1]=r685;r691=HEAP8[r652];r692=r691<<24>>24==0;if(r692){r693=HEAP32[r624>>2];r694=r693+2|0;HEAP32[r624>>2]=r694;r695=HEAP32[r657>>2];r696=r695+2|0;HEAP32[r657>>2]=r696;return}else{_e68_exception_bus(r1);return}break};case 20083:{r697=r1+334|0;r698=HEAP8[r697];r699=r698<<24>>24==0;if(r699){_e68_exception_privilege(r1);return}r700=r1+148|0;r701=HEAP32[r700>>2];r702=r701&16777215;r703=r702+1|0;r704=r1+36|0;r705=HEAP32[r704>>2];r706=r703>>>0<r705>>>0;if(r706){r707=r1+32|0;r708=HEAP32[r707>>2];r709=r708+r702|0;r710=HEAP8[r709];r711=r710&255;r712=r711<<8;r713=r708+r703|0;r714=HEAP8[r713];r715=r714&255;r716=r712|r715;r717=r716;r718=r705}else{r719=r1+12|0;r720=HEAP32[r719>>2];r721=r1+4|0;r722=HEAP32[r721>>2];r723=FUNCTION_TABLE[r720](r722,r702);r724=HEAP32[r704>>2];r717=r723;r718=r724}r725=r701+2|0;r726=r725&16777215;r727=r726+3|0;r728=r727>>>0<r718>>>0;if(r728){r729=r1+32|0;r730=HEAP32[r729>>2];r731=r730+r726|0;r732=HEAP8[r731];r733=r732&255;r734=r733<<8;r735=r726+1|0;r736=r730+r735|0;r737=HEAP8[r736];r738=r737&255;r739=r734|r738;r740=r739<<8;r741=r726+2|0;r742=r730+r741|0;r743=HEAP8[r742];r744=r743&255;r745=r740|r744;r746=r745<<8;r747=r730+r727|0;r748=HEAP8[r747];r749=r748&255;r750=r746|r749;r751=r750}else{r752=r1+16|0;r753=HEAP32[r752>>2];r754=r1+4|0;r755=HEAP32[r754>>2];r756=FUNCTION_TABLE[r753](r755,r726);r751=r756}r757=r1|0;r758=HEAP32[r757>>2];r759=r758&2;r760=(r759|0)==0;do{if(!r760){r761=r701+6|0;r762=r761&16777215;r763=r762+1|0;r764=HEAP32[r704>>2];r765=r763>>>0<r764>>>0;if(r765){r766=r1+32|0;r767=HEAP32[r766>>2];r768=r767+r762|0;r769=HEAP8[r768];r770=r769&255;r771=r770<<8;r772=r767+r763|0;r773=HEAP8[r772];r774=r773&255;r775=r771|r774;r776=r775}else{r777=r1+12|0;r778=HEAP32[r777>>2];r779=r1+4|0;r780=HEAP32[r779>>2];r781=FUNCTION_TABLE[r778](r780,r762);r776=r781}r782=r776&65535;r783=r782>>>12;if((r783|0)==0|(r783|0)==8){break}_e68_exception_format(r1);return}}while(0);_e68_set_sr(r1,r717);r784=r1+152|0;HEAP32[r784>>2]=r751;r785=r1+156|0;HEAP32[r785>>2]=r751;r786=HEAP32[r757>>2];r787=r786&2;r788=(r787|0)==0;do{if(r788){r789=r701+6|0;r790=HEAP8[r697];r791=r790<<24>>24==0;if(r791){r792=r1+172|0;HEAP32[r792>>2]=r789;break}else{HEAP32[r700>>2]=r789;break}}else{r793=r701+8|0;r794=HEAP8[r697];r795=r794<<24>>24==0;if(r795){r796=r1+172|0;HEAP32[r796>>2]=r793;break}else{HEAP32[r700>>2]=r793;break}}}while(0);r797=r1+372|0;r798=HEAP32[r797>>2];r799=r798+20|0;HEAP32[r797>>2]=r799;r800=r751&1;r801=(r800|0)==0;if(!r801){_e68_exception_address(r1,r751,0,0);return}r802=r1+164|0;r803=HEAP16[r802>>1];r804=r1+162|0;HEAP16[r804>>1]=r803;r805=r751&16777215;r806=r805+1|0;r807=HEAP32[r704>>2];r808=r806>>>0<r807>>>0;if(r808){r809=r1+32|0;r810=HEAP32[r809>>2];r811=r810+r805|0;r812=HEAP8[r811];r813=r812&255;r814=r813<<8;r815=r810+r806|0;r816=HEAP8[r815];r817=r816&255;r818=r814|r817;r819=r818}else{r820=r1+12|0;r821=HEAP32[r820>>2];r822=r1+4|0;r823=HEAP32[r822>>2];r824=FUNCTION_TABLE[r821](r823,r805);r819=r824}HEAP16[r802>>1]=r819;r825=r1+336|0;r826=HEAP8[r825];r827=r826<<24>>24==0;if(!r827){_e68_exception_bus(r1);return}r828=HEAP32[r785>>2];r829=r828+2|0;HEAP32[r785>>2]=r829;r830=HEAP32[r784>>2];r831=r830+2|0;HEAP32[r784>>2]=r831;r832=r829&1;r833=(r832|0)==0;if(!r833){_e68_exception_address(r1,r829,0,0);return}HEAP16[r804>>1]=r819;r834=r829&16777215;r835=r834+1|0;r836=HEAP32[r704>>2];r837=r835>>>0<r836>>>0;do{if(r837){r838=r1+32|0;r839=HEAP32[r838>>2];r840=r839+r834|0;r841=HEAP8[r840];r842=r841&255;r843=r842<<8;r844=r839+r835|0;r845=HEAP8[r844];r846=r845&255;r847=r843|r846;HEAP16[r802>>1]=r847;r848=r829}else{r849=r1+12|0;r850=HEAP32[r849>>2];r851=r1+4|0;r852=HEAP32[r851>>2];r853=FUNCTION_TABLE[r850](r852,r834);r854=HEAP8[r825];r855=r854<<24>>24==0;HEAP16[r802>>1]=r853;if(r855){r856=HEAP32[r785>>2];r848=r856;break}_e68_exception_bus(r1);return}}while(0);r857=r848+2|0;HEAP32[r785>>2]=r857;HEAP32[r784>>2]=r751;return;break};case 20091:{r858=r1|0;r859=HEAP32[r858>>2];r860=r859&2;r861=(r860|0)==0;if(r861){_e68_exception_illegal(r1);r862=r1+372|0;r863=HEAP32[r862>>2];r864=r863+2|0;HEAP32[r862>>2]=r864;return}r865=r1+334|0;r866=HEAP8[r865];r867=r866<<24>>24==0;if(r867){_e68_exception_privilege(r1);return}r868=r1+156|0;r869=HEAP32[r868>>2];r870=r869&1;r871=(r870|0)==0;if(!r871){_e68_exception_address(r1,r869,0,0);return}r872=r1+164|0;r873=HEAP16[r872>>1];r874=r1+162|0;HEAP16[r874>>1]=r873;r875=r869&16777215;r876=r875+1|0;r877=r1+36|0;r878=HEAP32[r877>>2];r879=r876>>>0<r878>>>0;if(r879){r880=r1+32|0;r881=HEAP32[r880>>2];r882=r881+r875|0;r883=HEAP8[r882];r884=r883&255;r885=r884<<8;r886=r881+r876|0;r887=HEAP8[r886];r888=r887&255;r889=r885|r888;r890=r889}else{r891=r1+12|0;r892=HEAP32[r891>>2];r893=r1+4|0;r894=HEAP32[r893>>2];r895=FUNCTION_TABLE[r892](r894,r875);r890=r895}HEAP16[r872>>1]=r890;r896=r1+336|0;r897=HEAP8[r896];r898=r897<<24>>24==0;if(!r898){_e68_exception_bus(r1);return}r899=HEAP32[r868>>2];r900=r899+2|0;HEAP32[r868>>2]=r900;r901=r1+152|0;r902=HEAP32[r901>>2];r903=r902+2|0;HEAP32[r901>>2]=r903;r904=HEAP16[r874>>1];r905=r904&65535;r906=r905&4095;r907=r905>>>12;r908=r907&8;r909=(r908|0)==0;r910=r907&7;if(r909){r911=r1+88+(r910<<2)|0;r912=r911}else{r913=r1+120+(r910<<2)|0;r912=r913}r914=HEAP32[r912>>2];L334:do{switch(r906|0){case 0:{r915=r914&3;r916=r1+180|0;HEAP32[r916>>2]=r915;break};case 1:{r917=r914&3;r918=r1+184|0;HEAP32[r918>>2]=r917;break};case 2:{r919=HEAP32[r858>>2];r920=r919&4;r921=(r920|0)==0;if(!r921){r922=r1+188|0;HEAP32[r922>>2]=r914;break L334}_e68_exception_illegal(r1);r923=r1+372|0;r924=HEAP32[r923>>2];r925=r924+2|0;HEAP32[r923>>2]=r925;return;break};case 2048:{r926=HEAP8[r865];r927=r926<<24>>24==0;if(r927){r928=r1+148|0;HEAP32[r928>>2]=r914;break L334}else{r929=r1+168|0;HEAP32[r929>>2]=r914;break L334}break};case 2049:{r930=r1+176|0;HEAP32[r930>>2]=r914;break};case 2050:{r931=HEAP32[r858>>2];r932=r931&4;r933=(r932|0)==0;if(!r933){r934=r1+188|0;HEAP32[r934>>2]=r914;break L334}_e68_exception_illegal(r1);r935=r1+372|0;r936=HEAP32[r935>>2];r937=r936+2|0;HEAP32[r935>>2]=r937;return;break};default:{_e68_exception_illegal(r1);return}}}while(0);r938=r1+372|0;r939=HEAP32[r938>>2];r940=r939+10|0;HEAP32[r938>>2]=r940;r941=r900&1;r942=(r941|0)==0;if(!r942){_e68_exception_address(r1,r900,0,0);return}HEAP16[r874>>1]=r890;r943=r900&16777215;r944=r943+1|0;r945=HEAP32[r877>>2];r946=r944>>>0<r945>>>0;do{if(r946){r947=r1+32|0;r948=HEAP32[r947>>2];r949=r948+r943|0;r950=HEAP8[r949];r951=r950&255;r952=r951<<8;r953=r948+r944|0;r954=HEAP8[r953];r955=r954&255;r956=r952|r955;HEAP16[r872>>1]=r956;r957=r900;r958=r903}else{r959=r1+12|0;r960=HEAP32[r959>>2];r961=r1+4|0;r962=HEAP32[r961>>2];r963=FUNCTION_TABLE[r960](r962,r943);r964=HEAP8[r896];r965=r964<<24>>24==0;HEAP16[r872>>1]=r963;if(r965){r966=HEAP32[r868>>2];r967=HEAP32[r901>>2];r957=r966;r958=r967;break}_e68_exception_bus(r1);return}}while(0);r968=r957+2|0;HEAP32[r868>>2]=r968;r969=r958+2|0;HEAP32[r901>>2]=r969;return;break};default:{r970=r5>>>3;r971=r970&7;switch(r971|0){case 0:case 1:{r972=r1+156|0;r973=HEAP32[r972>>2];r974=r973&1;r975=(r974|0)==0;if(!r975){_e68_exception_address(r1,r973,0,0);return}r976=r1+164|0;r977=HEAP16[r976>>1];r978=r1+162|0;HEAP16[r978>>1]=r977;r979=r973&16777215;r980=r979+1|0;r981=r1+36|0;r982=HEAP32[r981>>2];r983=r980>>>0<r982>>>0;if(r983){r984=r1+32|0;r985=HEAP32[r984>>2];r986=r985+r979|0;r987=HEAP8[r986];r988=r987&255;r989=r988<<8;r990=r985+r980|0;r991=HEAP8[r990];r992=r991&255;r993=r989|r992;r994=r993}else{r995=r1+12|0;r996=HEAP32[r995>>2];r997=r1+4|0;r998=HEAP32[r997>>2];r999=FUNCTION_TABLE[r996](r998,r979);r994=r999}HEAP16[r976>>1]=r994;r1000=r1+336|0;r1001=HEAP8[r1000];r1002=r1001<<24>>24==0;if(r1002){r1003=HEAP32[r972>>2];r1004=r1003+2|0;HEAP32[r972>>2]=r1004;r1005=r1+152|0;r1006=HEAP32[r1005>>2];r1007=r1006+2|0;HEAP32[r1005>>2]=r1007;r1008=HEAP16[r3>>1];r1009=r1008&65535;r1010=r1009&15;_e68_exception_trap(r1,r1010);return}else{_e68_exception_bus(r1);return}break};case 2:{r1011=r1+156|0;r1012=HEAP32[r1011>>2];r1013=r1012&1;r1014=(r1013|0)==0;if(!r1014){_e68_exception_address(r1,r1012,0,0);return}r1015=r1+164|0;r1016=HEAP16[r1015>>1];r1017=r1+162|0;HEAP16[r1017>>1]=r1016;r1018=r1012&16777215;r1019=r1018+1|0;r1020=r1+36|0;r1021=HEAP32[r1020>>2];r1022=r1019>>>0<r1021>>>0;if(r1022){r1023=r1+32|0;r1024=HEAP32[r1023>>2];r1025=r1024+r1018|0;r1026=HEAP8[r1025];r1027=r1026&255;r1028=r1027<<8;r1029=r1024+r1019|0;r1030=HEAP8[r1029];r1031=r1030&255;r1032=r1028|r1031;r1033=r1032}else{r1034=r1+12|0;r1035=HEAP32[r1034>>2];r1036=r1+4|0;r1037=HEAP32[r1036>>2];r1038=FUNCTION_TABLE[r1035](r1037,r1018);r1033=r1038}HEAP16[r1015>>1]=r1033;r1039=r1+336|0;r1040=HEAP8[r1039];r1041=r1040<<24>>24==0;if(!r1041){_e68_exception_bus(r1);return}r1042=HEAP32[r1011>>2];r1043=r1042+2|0;HEAP32[r1011>>2]=r1043;r1044=r1+152|0;r1045=HEAP32[r1044>>2];r1046=r1045+2|0;HEAP32[r1044>>2]=r1046;r1047=HEAP16[r3>>1];r1048=r1047&65535;r1049=r1048&7;r1050=HEAP16[r1017>>1];r1051=r1050&65535;r1052=r1051&32768;r1053=(r1052|0)!=0;r1054=r1051|-65536;r1055=r1053?r1054:r1051;r1056=r1+372|0;r1057=HEAP32[r1056>>2];r1058=r1057+16|0;HEAP32[r1056>>2]=r1058;r1059=r1+148|0;r1060=HEAP32[r1059>>2];r1061=r1060-4|0;HEAP32[r1059>>2]=r1061;r1062=r1+120+(r1049<<2)|0;r1063=HEAP32[r1062>>2];r1064=r1061&16777215;r1065=r1064+3|0;r1066=HEAP32[r1020>>2];r1067=r1065>>>0<r1066>>>0;if(r1067){r1068=r1063>>>24;r1069=r1068&255;r1070=r1+32|0;r1071=HEAP32[r1070>>2];r1072=r1071+r1064|0;HEAP8[r1072]=r1069;r1073=r1063>>>16;r1074=r1073&255;r1075=r1064+1|0;r1076=HEAP32[r1070>>2];r1077=r1076+r1075|0;HEAP8[r1077]=r1074;r1078=r1063>>>8;r1079=r1078&255;r1080=r1064+2|0;r1081=HEAP32[r1070>>2];r1082=r1081+r1080|0;HEAP8[r1082]=r1079;r1083=r1063&255;r1084=HEAP32[r1070>>2];r1085=r1084+r1065|0;HEAP8[r1085]=r1083}else{r1086=r1+28|0;r1087=HEAP32[r1086>>2];r1088=r1+4|0;r1089=HEAP32[r1088>>2];FUNCTION_TABLE[r1087](r1089,r1064,r1063)}r1090=HEAP32[r1059>>2];HEAP32[r1062>>2]=r1090;r1091=HEAP32[r1059>>2];r1092=r1091+r1055|0;HEAP32[r1059>>2]=r1092;r1093=HEAP32[r1011>>2];r1094=r1093&1;r1095=(r1094|0)==0;if(!r1095){_e68_exception_address(r1,r1093,0,0);return}r1096=HEAP16[r1015>>1];HEAP16[r1017>>1]=r1096;r1097=r1093&16777215;r1098=r1097+1|0;r1099=HEAP32[r1020>>2];r1100=r1098>>>0<r1099>>>0;if(r1100){r1101=r1+32|0;r1102=HEAP32[r1101>>2];r1103=r1102+r1097|0;r1104=HEAP8[r1103];r1105=r1104&255;r1106=r1105<<8;r1107=r1102+r1098|0;r1108=HEAP8[r1107];r1109=r1108&255;r1110=r1106|r1109;r1111=r1110}else{r1112=r1+12|0;r1113=HEAP32[r1112>>2];r1114=r1+4|0;r1115=HEAP32[r1114>>2];r1116=FUNCTION_TABLE[r1113](r1115,r1097);r1111=r1116}HEAP16[r1015>>1]=r1111;r1117=HEAP8[r1039];r1118=r1117<<24>>24==0;if(r1118){r1119=HEAP32[r1011>>2];r1120=r1119+2|0;HEAP32[r1011>>2]=r1120;r1121=HEAP32[r1044>>2];r1122=r1121+2|0;HEAP32[r1044>>2]=r1122;return}else{_e68_exception_bus(r1);return}break};case 3:{r1123=r5&7;r1124=r1+120+(r1123<<2)|0;r1125=HEAP32[r1124>>2];r1126=r1|0;r1127=HEAP32[r1126>>2];r1128=r1127&1;r1129=(r1128|0)==0;do{if(r1129){r1130=r1125&1;r1131=(r1130|0)==0;if(r1131){break}_e68_exception_address(r1,r1125,1,0);return}}while(0);r1132=r1+372|0;r1133=HEAP32[r1132>>2];r1134=r1133+12|0;HEAP32[r1132>>2]=r1134;r1135=r1+148|0;HEAP32[r1135>>2]=r1125;r1136=r1125&16777215;r1137=r1136+3|0;r1138=r1+36|0;r1139=HEAP32[r1138>>2];r1140=r1137>>>0<r1139>>>0;if(r1140){r1141=r1+32|0;r1142=HEAP32[r1141>>2];r1143=r1142+r1136|0;r1144=HEAP8[r1143];r1145=r1144&255;r1146=r1145<<8;r1147=r1136+1|0;r1148=r1142+r1147|0;r1149=HEAP8[r1148];r1150=r1149&255;r1151=r1146|r1150;r1152=r1151<<8;r1153=r1136+2|0;r1154=r1142+r1153|0;r1155=HEAP8[r1154];r1156=r1155&255;r1157=r1152|r1156;r1158=r1157<<8;r1159=r1142+r1137|0;r1160=HEAP8[r1159];r1161=r1160&255;r1162=r1158|r1161;r1163=r1162}else{r1164=r1+16|0;r1165=HEAP32[r1164>>2];r1166=r1+4|0;r1167=HEAP32[r1166>>2];r1168=FUNCTION_TABLE[r1165](r1167,r1136);r1163=r1168}HEAP32[r1124>>2]=r1163;r1169=HEAP32[r1135>>2];r1170=r1169+4|0;HEAP32[r1135>>2]=r1170;r1171=r1+156|0;r1172=HEAP32[r1171>>2];r1173=r1172&1;r1174=(r1173|0)==0;if(!r1174){_e68_exception_address(r1,r1172,0,0);return}r1175=r1+164|0;r1176=HEAP16[r1175>>1];r1177=r1+162|0;HEAP16[r1177>>1]=r1176;r1178=r1172&16777215;r1179=r1178+1|0;r1180=HEAP32[r1138>>2];r1181=r1179>>>0<r1180>>>0;if(r1181){r1182=r1+32|0;r1183=HEAP32[r1182>>2];r1184=r1183+r1178|0;r1185=HEAP8[r1184];r1186=r1185&255;r1187=r1186<<8;r1188=r1183+r1179|0;r1189=HEAP8[r1188];r1190=r1189&255;r1191=r1187|r1190;r1192=r1191}else{r1193=r1+12|0;r1194=HEAP32[r1193>>2];r1195=r1+4|0;r1196=HEAP32[r1195>>2];r1197=FUNCTION_TABLE[r1194](r1196,r1178);r1192=r1197}HEAP16[r1175>>1]=r1192;r1198=r1+336|0;r1199=HEAP8[r1198];r1200=r1199<<24>>24==0;if(r1200){r1201=HEAP32[r1171>>2];r1202=r1201+2|0;HEAP32[r1171>>2]=r1202;r1203=r1+152|0;r1204=HEAP32[r1203>>2];r1205=r1204+2|0;HEAP32[r1203>>2]=r1205;return}else{_e68_exception_bus(r1);return}break};case 4:{r1206=r1+334|0;r1207=HEAP8[r1206];r1208=r1207<<24>>24==0;if(r1208){_e68_exception_privilege(r1);return}r1209=r5&7;r1210=r1+120+(r1209<<2)|0;r1211=HEAP32[r1210>>2];r1212=r1+168|0;HEAP32[r1212>>2]=r1211;r1213=r1+372|0;r1214=HEAP32[r1213>>2];r1215=r1214+4|0;HEAP32[r1213>>2]=r1215;r1216=r1+156|0;r1217=HEAP32[r1216>>2];r1218=r1217&1;r1219=(r1218|0)==0;if(!r1219){_e68_exception_address(r1,r1217,0,0);return}r1220=r1+164|0;r1221=HEAP16[r1220>>1];r1222=r1+162|0;HEAP16[r1222>>1]=r1221;r1223=r1217&16777215;r1224=r1223+1|0;r1225=r1+36|0;r1226=HEAP32[r1225>>2];r1227=r1224>>>0<r1226>>>0;if(r1227){r1228=r1+32|0;r1229=HEAP32[r1228>>2];r1230=r1229+r1223|0;r1231=HEAP8[r1230];r1232=r1231&255;r1233=r1232<<8;r1234=r1229+r1224|0;r1235=HEAP8[r1234];r1236=r1235&255;r1237=r1233|r1236;r1238=r1237}else{r1239=r1+12|0;r1240=HEAP32[r1239>>2];r1241=r1+4|0;r1242=HEAP32[r1241>>2];r1243=FUNCTION_TABLE[r1240](r1242,r1223);r1238=r1243}HEAP16[r1220>>1]=r1238;r1244=r1+336|0;r1245=HEAP8[r1244];r1246=r1245<<24>>24==0;if(r1246){r1247=HEAP32[r1216>>2];r1248=r1247+2|0;HEAP32[r1216>>2]=r1248;r1249=r1+152|0;r1250=HEAP32[r1249>>2];r1251=r1250+2|0;HEAP32[r1249>>2]=r1251;return}else{_e68_exception_bus(r1);return}break};case 5:{r1252=r1+334|0;r1253=HEAP8[r1252];r1254=r1253<<24>>24==0;if(r1254){_e68_exception_privilege(r1);return}r1255=r1+168|0;r1256=HEAP32[r1255>>2];r1257=r5&7;r1258=r1+120+(r1257<<2)|0;HEAP32[r1258>>2]=r1256;r1259=r1+372|0;r1260=HEAP32[r1259>>2];r1261=r1260+4|0;HEAP32[r1259>>2]=r1261;r1262=r1+156|0;r1263=HEAP32[r1262>>2];r1264=r1263&1;r1265=(r1264|0)==0;if(!r1265){_e68_exception_address(r1,r1263,0,0);return}r1266=r1+164|0;r1267=HEAP16[r1266>>1];r1268=r1+162|0;HEAP16[r1268>>1]=r1267;r1269=r1263&16777215;r1270=r1269+1|0;r1271=r1+36|0;r1272=HEAP32[r1271>>2];r1273=r1270>>>0<r1272>>>0;if(r1273){r1274=r1+32|0;r1275=HEAP32[r1274>>2];r1276=r1275+r1269|0;r1277=HEAP8[r1276];r1278=r1277&255;r1279=r1278<<8;r1280=r1275+r1270|0;r1281=HEAP8[r1280];r1282=r1281&255;r1283=r1279|r1282;r1284=r1283}else{r1285=r1+12|0;r1286=HEAP32[r1285>>2];r1287=r1+4|0;r1288=HEAP32[r1287>>2];r1289=FUNCTION_TABLE[r1286](r1288,r1269);r1284=r1289}HEAP16[r1266>>1]=r1284;r1290=r1+336|0;r1291=HEAP8[r1290];r1292=r1291<<24>>24==0;if(r1292){r1293=HEAP32[r1262>>2];r1294=r1293+2|0;HEAP32[r1262>>2]=r1294;r1295=r1+152|0;r1296=HEAP32[r1295>>2];r1297=r1296+2|0;HEAP32[r1295>>2]=r1297;return}else{_e68_exception_bus(r1);return}break};default:{_e68_exception_illegal(r1);r1298=r1+372|0;r1299=HEAP32[r1298>>2];r1300=r1299+2|0;HEAP32[r1298>>2]=r1300;return}}}}}function _op4e80(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r2<<2)>>2]](r1,r2,2020,32)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r2=r1+156|0;r3=HEAP32[r2>>2];r4=r1+344|0;r5=HEAP32[r4>>2];HEAP32[r2>>2]=r5;if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);return}r6=r1+164|0;r7=r1+162|0;HEAP16[r7>>1]=HEAP16[r6>>1];r8=r5&16777215;r5=r8+1|0;r9=r1+36|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r8|0]<<8|HEAPU8[r10+r5|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r6>>1]=r11;r11=r1+336|0;if((HEAP8[r11]|0)!=0){_e68_exception_bus(r1);return}HEAP32[r2>>2]=HEAP32[r2>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;r5=r3-2|0;r3=r1+148|0;r10=HEAP32[r3>>2]-4|0;r12=r10&16777215;r13=r12+3|0;if(r13>>>0<HEAP32[r9>>2]>>>0){r14=r1+32|0;HEAP8[HEAP32[r14>>2]+r12|0]=r5>>>24;HEAP8[HEAP32[r14>>2]+(r12+1)|0]=r5>>>16;HEAP8[HEAP32[r14>>2]+(r12+2)|0]=r5>>>8;HEAP8[HEAP32[r14>>2]+r13|0]=r5}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r12,r5)}HEAP32[r3>>2]=r10;r10=HEAP32[r2>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);return}HEAP16[r7>>1]=HEAP16[r6>>1];r7=r10&16777215;r10=r7+1|0;if(r10>>>0<HEAP32[r9>>2]>>>0){r9=HEAP32[r1+32>>2];r15=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r10|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r15;if((HEAP8[r11]|0)==0){HEAP32[r2>>2]=HEAP32[r2>>2]+2;HEAP32[r8>>2]=HEAP32[r4>>2];return}else{_e68_exception_bus(r1);return}}function _op4ec0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r2<<2)>>2]](r1,r2,2020,32)|0)!=0){return}if((HEAP32[r1+340>>2]|0)!=2){_e68_exception_illegal(r1);return}r2=r1+372|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;r2=r1+344|0;r3=HEAP32[r2>>2];r4=r1+156|0;HEAP32[r4>>2]=r3;if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);return}r5=r1+164|0;r6=r1+162|0;HEAP16[r6>>1]=HEAP16[r5>>1];r7=r3&16777215;r3=r7+1|0;r8=r1+36|0;if(r3>>>0<HEAP32[r8>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r7|0]<<8|HEAPU8[r9+r3|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r10;r7=r1+336|0;if((HEAP8[r7]|0)!=0){_e68_exception_bus(r1);return}r3=HEAP32[r4>>2]+2|0;HEAP32[r4>>2]=r3;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);return}HEAP16[r6>>1]=r10;r10=r3&16777215;r3=r10+1|0;do{if(r3>>>0<HEAP32[r8>>2]>>>0){r6=HEAP32[r1+32>>2];HEAP16[r5>>1]=HEAPU8[r6+r10|0]<<8|HEAPU8[r6+r3|0]}else{r6=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10);r11=(HEAP8[r7]|0)==0;HEAP16[r5>>1]=r6;if(r11){break}_e68_exception_bus(r1);return}}while(0);HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r9>>2]=HEAP32[r2>>2];return}function _op5000(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1];r5=(r4&65535)>>>9&7;r6=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r6<<2)>>2]](r1,r6,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r6=r5<<24>>24==0?8:r5;r5=HEAP8[r3];r3=r5+r6&255;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_add_8(r1,r3,r6,r5);r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r6&16777215;r6=r7+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r6|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val8(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op5040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1];r5=r4&65535;if((r5&56|0)==8){r6=r5>>>9&7;r7=r1+120+((r5&7)<<2)|0;r8=HEAP32[r7>>2];r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+8;r9=r1+156|0;r10=HEAP32[r9>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}r11=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r11>>1];r12=r10&16777215;r10=r12+1|0;if(r10>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r12|0]<<8|HEAPU8[r13+r10|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12)}HEAP16[r11>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;HEAP32[r7>>2]=r8+((r6|0)==0?8:r6);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r6=(r4&65535)>>>9&7;r4=r5&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r6<<16>>16==0?8:r6;r6=HEAP16[r3>>1];r3=r6+r4&65535;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_add_16(r1,r3,r4,r6);r6=r1+156|0;r4=HEAP32[r6>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r8=r4&16777215;r4=r8+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r15=HEAPU8[r7+r8|0]<<8|HEAPU8[r7+r4|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r5>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op5080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];if((r4&56|0)==8){r5=r4>>>9&7;r6=r1+120+((r4&7)<<2)|0;r7=HEAP32[r6>>2];r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+12;r8=r1+156|0;r9=HEAP32[r8>>2];if((r9&1|0)!=0){_e68_exception_address(r1,r9,0,0);STACKTOP=r2;return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r11=r9&16777215;r9=r11+1|0;if(r9>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r13=HEAPU8[r12+r11|0]<<8|HEAPU8[r12+r9|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r10>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r6>>2]=r7+((r5|0)==0?8:r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r4>>>9&7;r7=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r7<<2)>>2]](r1,r7,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r7=(r5|0)==0?8:r5;r5=HEAP32[r3>>2];r3=r5+r7|0;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+12;_e68_cc_set_add_32(r1,r3,r7,r5);r5=r1+156|0;r7=HEAP32[r5>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r6=r7&16777215;r7=r6+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r14=HEAPU8[r8+r6|0]<<8|HEAPU8[r8+r7|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r4>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val32(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op50c0(r1){if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,1);return}else{_e68_op_scc(r1,1);return}}function _op5100(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1];r5=(r4&65535)>>>9&7;r6=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r6<<2)>>2]](r1,r6,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r6=r5<<24>>24==0?8:r5;r5=HEAP8[r3];r3=r5-r6&255;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_sub_8(r1,r3,r6,r5);r5=r1+156|0;r6=HEAP32[r5>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r6&16777215;r6=r7+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r6|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val8(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op5140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1];r5=r4&65535;if((r5&56|0)==8){r6=r5>>>9&7;r7=r1+120+((r5&7)<<2)|0;r8=HEAP32[r7>>2];r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+8;r9=r1+156|0;r10=HEAP32[r9>>2];if((r10&1|0)!=0){_e68_exception_address(r1,r10,0,0);STACKTOP=r2;return}r11=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r11>>1];r12=r10&16777215;r10=r12+1|0;if(r10>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r12|0]<<8|HEAPU8[r13+r10|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r12)}HEAP16[r11>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;HEAP32[r7>>2]=r8-((r6|0)==0?8:r6);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r6=(r4&65535)>>>9&7;r4=r5&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=r6<<16>>16==0?8:r6;r6=HEAP16[r3>>1];r3=r6-r4&65535;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_sub_16(r1,r3,r4,r6);r6=r1+156|0;r4=HEAP32[r6>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r8=r4&16777215;r4=r8+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r15=HEAPU8[r7+r8|0]<<8|HEAPU8[r7+r4|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r5>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op5180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];if((r4&56|0)==8){r5=r4>>>9&7;r6=r1+120+((r4&7)<<2)|0;r7=HEAP32[r6>>2];r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+12;r8=r1+156|0;r9=HEAP32[r8>>2];if((r9&1|0)!=0){_e68_exception_address(r1,r9,0,0);STACKTOP=r2;return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r11=r9&16777215;r9=r11+1|0;if(r9>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r13=HEAPU8[r12+r11|0]<<8|HEAPU8[r12+r9|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r10>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r6>>2]=r7-((r5|0)==0?8:r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r4>>>9&7;r7=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r7<<2)>>2]](r1,r7,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r7=(r5|0)==0?8:r5;r5=HEAP32[r3>>2];r3=r5-r7|0;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+12;_e68_cc_set_sub_32(r1,r3,r7,r5);r5=r1+156|0;r7=HEAP32[r5>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r6=r7&16777215;r7=r6+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r14=HEAPU8[r8+r6|0]<<8|HEAPU8[r8+r7|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r4>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val32(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op51c0(r1){if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,0);return}else{_e68_op_scc(r1,0);return}}function _op52c0(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1^1}else{r3=0}if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op53c0(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1}else{r3=1}if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op54c0(r1){var r2;r2=(HEAP16[r1+166>>1]&1^1)&65535;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op55c0(r1){var r2;r2=HEAP16[r1+166>>1]&1;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op56c0(r1){var r2;r2=(HEAPU16[r1+166>>1]>>>2&1^1)&65535;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op57c0(r1){var r2;r2=HEAPU16[r1+166>>1]>>>2&1;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op58c0(r1){var r2;r2=(HEAPU16[r1+166>>1]>>>1&1^1)&65535;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op59c0(r1){var r2;r2=HEAPU16[r1+166>>1]>>>1&1;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op5ac0(r1){var r2;r2=(HEAPU16[r1+166>>1]>>>3&1^1)&65535;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op5bc0(r1){var r2;r2=HEAPU16[r1+166>>1]>>>3&1;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r2);return}else{_e68_op_scc(r1,r2);return}}function _op5cc0(r1){var r2,r3;r2=HEAPU16[r1+166>>1];r3=(r2>>>3^r2>>>1)&1^1;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op5dc0(r1){var r2,r3;r2=HEAPU16[r1+166>>1];r3=(r2>>>3^r2>>>1)&1;if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op5ec0(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)==0){r3=r2>>>2&1^1}else{r3=0}if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op5fc0(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)==0){r3=r2>>>2&1}else{r3=1}if((HEAP16[r1+160>>1]&56)==8){_e68_op_dbcc(r1,r3);return}else{_e68_op_scc(r1,r3);return}}function _op6000(r1){_e68_op_bcc(r1,1);return}function _op6100(r1){var r2,r3,r4,r5,r6,r7;r2=((HEAP16[r1+160>>1]&255)!=0?2:4)+HEAP32[r1+152>>2]|0;r3=r1+148|0;r4=HEAP32[r3>>2]-4|0;r5=r4&16777215;r6=r5+3|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r7=r1+32|0;HEAP8[HEAP32[r7>>2]+r5|0]=r2>>>24;HEAP8[HEAP32[r7>>2]+(r5+1)|0]=r2>>>16;HEAP8[HEAP32[r7>>2]+(r5+2)|0]=r2>>>8;HEAP8[HEAP32[r7>>2]+r6|0]=r2;HEAP32[r3>>2]=r4;_e68_op_bcc(r1,1);return}else{FUNCTION_TABLE[HEAP32[r1+28>>2]](HEAP32[r1+4>>2],r5,r2);HEAP32[r3>>2]=r4;_e68_op_bcc(r1,1);return}}function _op6200(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)!=0){r3=0;_e68_op_bcc(r1,r3);return}r3=r2>>>2&1^1;_e68_op_bcc(r1,r3);return}function _op6300(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if((r2&1|0)==0){r3=r2>>>2&1}else{r3=1}_e68_op_bcc(r1,r3);return}function _op6400(r1){_e68_op_bcc(r1,(HEAP16[r1+166>>1]&1^1)&65535);return}function _op6500(r1){_e68_op_bcc(r1,HEAP16[r1+166>>1]&1);return}function _op6600(r1){_e68_op_bcc(r1,(HEAPU16[r1+166>>1]>>>2&1^1)&65535);return}function _op6700(r1){_e68_op_bcc(r1,HEAPU16[r1+166>>1]>>>2&1);return}function _op6800(r1){_e68_op_bcc(r1,(HEAPU16[r1+166>>1]>>>1&1^1)&65535);return}function _op6900(r1){_e68_op_bcc(r1,HEAPU16[r1+166>>1]>>>1&1);return}function _op6a00(r1){_e68_op_bcc(r1,(HEAPU16[r1+166>>1]>>>3&1^1)&65535);return}function _op6b00(r1){_e68_op_bcc(r1,HEAPU16[r1+166>>1]>>>3&1);return}function _op6c00(r1){var r2;r2=HEAPU16[r1+166>>1];_e68_op_bcc(r1,(r2>>>3^r2>>>1)&1^1);return}function _op6d00(r1){var r2;r2=HEAPU16[r1+166>>1];_e68_op_bcc(r1,(r2>>>3^r2>>>1)&1);return}function _op6e00(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)!=0){r3=0;_e68_op_bcc(r1,r3);return}r3=r2>>>2&1^1;_e68_op_bcc(r1,r3);return}function _op6f00(r1){var r2,r3;r2=HEAPU16[r1+166>>1];if(((r2>>>3^r2>>>1)&1|0)!=0){r3=1;_e68_op_bcc(r1,r3);return}r3=r2>>>2&1;_e68_op_bcc(r1,r3);return}function _op7000(r1){var r2,r3,r4,r5,r6,r7;r2=r1+160|0;r3=HEAPU16[r2>>1];r4=(r3&128|0)!=0?r3|-256:r3&255;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_32(r1,15,r4);HEAP32[r1+88+((HEAPU16[r2>>1]>>>9&7)<<2)>>2]=r4;r4=r1+156|0;r2=HEAP32[r4>>2];if((r2&1|0)!=0){_e68_exception_address(r1,r2,0,0);return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r5=r2&16777215;r2=r5+1|0;if(r2>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r7=HEAPU8[r6+r5|0]<<8|HEAPU8[r6+r2|0]}else{r7=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r3>>1]=r7;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;return}else{_e68_exception_bus(r1);return}}function _op8000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAPU8[r3]|HEAP32[r5>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+8;_e68_cc_set_nz_8(r1,15,r4&255);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r4&255;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op8040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAPU16[r3>>1]|HEAP32[r5>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+8;_e68_cc_set_nz_16(r1,15,r4&65535);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r4&65535;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op8080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r3>>2]|HEAP32[r5>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+10;_e68_cc_set_nz_32(r1,15,r4);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op80c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP16[r3>>1];r3=r6&65535;if(r6<<16>>16==0){r6=r1+156|0;r7=HEAP32[r6>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_exception_divzero(r1);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r6=(r4>>>0)/(r3>>>0)&-1;if(r6>>>0>65535){r11=r1+166|0;HEAP16[r11>>1]=HEAP16[r11>>1]&-4|2}else{HEAP32[r5>>2]=((r4>>>0)%(r3>>>0)&-1)<<16|r6&65535;_e68_cc_set_nz_16(r1,15,r6&65535)}r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+144;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r3&16777215;r3=r5+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r5|0]<<8|HEAPU8[r11+r3|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op8100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r5)|0)!=0){STACKTOP=r2;return}r8=(HEAPU8[r5]|r7)&255;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;_e68_cc_set_nz_8(r1,15,r8);r7=r1+156|0;r5=HEAP32[r7>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r5&16777215;r5=r10+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r5|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val8(r1,r8);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r8=r6&7;r7=r6>>>9&7;if((r6&8|0)==0){r13=r7;r14=r8}else{r13=r7|32;r14=r8|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r4];r4=HEAP8[r3];r3=r1+166|0;r14=HEAP16[r3>>1];r8=((r13&255)-(r4&255)&65535)-((r14&65535)>>>4&1)&65535;r7=(r13&15)>>>0<(r4&15)>>>0?r8-6&65535:r8;r8=(r7&65535)>159?r7-96&65535:r7;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+10;r7=r8&65535;r4=(r7&65280|0)==0?r14&-18:r14|17;HEAP16[r3>>1]=(r7&255|0)==0?r4:r4&-5;r4=r1+156|0;r7=HEAP32[r4>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r14=r7&16777215;r7=r14+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r15=HEAPU8[r13+r14|0]<<8|HEAPU8[r13+r7|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14)}HEAP16[r3>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;_e68_ea_set_val8(r1,r8&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op8140(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=HEAP32[r1+88+((r4>>>9&7)<<2)>>2];r6=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r6<<2)>>2]](r1,r6,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r6=(HEAPU16[r3>>1]|r5)&65535;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_nz_16(r1,15,r6);r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val16(r1,r6);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op8180(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=HEAP32[r1+88+((r4>>>9&7)<<2)>>2];r6=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r6<<2)>>2]](r1,r6,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r6=HEAP32[r3>>2]|r5;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+10;_e68_cc_set_nz_32(r1,15,r6);r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;_e68_ea_set_val32(r1,r6);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op81c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP16[r3>>1];if(r6<<16>>16==0){r7=r1+156|0;r8=HEAP32[r7>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r8&16777215;r8=r10+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r8|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_exception_divzero(r1);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r7=r4>>>31;r12=(r4|0)<0?-r4|0:r4;if(r6<<16>>16>-1){r13=0;r14=r6}else{r4=-r6&65535;HEAP16[r3>>1]=r4;r13=1;r14=r4}r4=r14&65535;r14=(r12>>>0)/(r4>>>0)&-1;r3=(r12>>>0)%(r4>>>0)&-1;if((r7|0)==0){r15=r3}else{r15=-r3&65535}r3=(r13|0)==(r7|0)?r14:-r14|0;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+162;r14=r3&-32768;if((r14|0)==0|(r14|0)==-32768){HEAP32[r5>>2]=r15<<16|r3&65535;_e68_cc_set_nz_16(r1,15,r3&65535)}else{r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-4|2}r3=r1+156|0;r15=HEAP32[r3>>2];if((r15&1|0)!=0){_e68_exception_address(r1,r15,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r14=r15&16777215;r15=r14+1|0;if(r15>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r16=HEAPU8[r7+r14|0]<<8|HEAPU8[r7+r15|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r14)}HEAP16[r5>>1]=r16;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op9000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP8[r3];r3=r4-(r6&255)|0;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;_e68_cc_set_sub_8(r1,r3&255,r6,r4&255);r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r3&255;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op9040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP16[r3>>1];r3=r4-(r6&65535)|0;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;_e68_cc_set_sub_16(r1,r3&65535,r6,r4&65535);r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r3&65535;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op9080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP32[r3>>2];r3=r4-r6|0;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+10;_e68_cc_set_sub_32(r1,r3,r6,r4);r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=r3;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op90c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r3>>1];r3=r1+120+((r4>>>9&7)<<2)|0;r4=HEAP32[r3>>2];r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;r6=r1+156|0;r7=HEAP32[r6>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r3>>2]=r4-((r5&32768|0)!=0?r5|-65536:r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op9100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP8[r5];r5=(r8&255)-r7&255;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+8;_e68_cc_set_sub_8(r1,r5,r7&255,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val8(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r4];r4=HEAP8[r3];r3=(r13-r4&255)-(HEAPU16[r1+166>>1]>>>4&1)&255;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+8;_e68_cc_set_subx_8(r1,r3,r4,r13);r13=r1+156|0;r4=HEAP32[r13>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r4&16777215;r4=r5+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r4|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;_e68_ea_set_val8(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op9140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP16[r5>>1];r5=(r8&65535)-r7&65535;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+8;_e68_cc_set_sub_16(r1,r5,r7&65535,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP16[r4>>1];r4=HEAP16[r3>>1];r3=(r13-r4&65535)-(HEAPU16[r1+166>>1]>>>4&1)&65535;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+8;_e68_cc_set_subx_16(r1,r3,r4,r13);r13=r1+156|0;r4=HEAP32[r13>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r4&16777215;r4=r5+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r4|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;_e68_ea_set_val16(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op9180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP32[r5>>2];r5=r8-r7|0;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+12;_e68_cc_set_sub_32(r1,r5,r7,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val32(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP32[r4>>2];r4=HEAP32[r3>>2];r3=r13-r4-(HEAPU16[r1+166>>1]>>>4&1)|0;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+12;_e68_cc_set_subx_32(r1,r3,r4,r13);r13=r1+156|0;r4=HEAP32[r13>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r4&16777215;r4=r5+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r4|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r13>>2]=HEAP32[r13>>2]+2;r13=r1+152|0;HEAP32[r13>>2]=HEAP32[r13>>2]+2;_e68_ea_set_val32(r1,r3);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _op91c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+120+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP32[r3>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+10;r3=r1+156|0;r7=HEAP32[r3>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=r4-r6;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opa000(r1){HEAP16[r1+328>>1]=HEAP16[r1+160>>1];_e68_exception_axxx(r1);return}function _opb000(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;r4=HEAP8[r3];_e68_cc_set_cmp_8(r1,r5-(r4&255)&255,r4,r5&255);r5=r1+156|0;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb040(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;r4=HEAP16[r3>>1];_e68_cc_set_cmp_16(r1,r5-(r4&65535)&65535,r4,r5&65535);r5=r1+156|0;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb080(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r1+88+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+6;r4=HEAP32[r3>>2];_e68_cc_set_cmp_32(r1,r5-r4|0,r4,r5);r5=r1+156|0;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb0c0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r3>>1];r3=(r5&32768|0)!=0?r5|-65536:r5;r5=HEAP32[r1+120+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_cmp_32(r1,r5-r3|0,r3,r5);r5=r1+156|0;r3=HEAP32[r5>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r6=r3&16777215;r3=r6+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r3|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r4>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=r1+160|0;r7=HEAPU16[r6>>1];if((r7&56|0)!=8){r8=HEAP32[r1+88+((r7>>>9&7)<<2)>>2];r9=r7&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,509,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r5)|0)!=0){STACKTOP=r2;return}r9=(HEAPU8[r5]^r8)&255;r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+8;_e68_cc_set_nz_8(r1,15,r9);r8=r1+156|0;r5=HEAP32[r8>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r11=r5&16777215;r5=r11+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r13=HEAPU8[r12+r11|0]<<8|HEAPU8[r12+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r10>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val8(r1,r9);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r9=r7&7|24;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,8,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r9=HEAPU16[r6>>1]>>>9&7|24;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,8,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r4)|0)!=0){STACKTOP=r2;return}r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+16;r9=HEAP8[r4];r4=HEAP8[r3];_e68_cc_set_cmp_8(r1,r9-r4&255,r4,r9);r9=r1+156|0;r4=HEAP32[r9>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r14=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=r1+160|0;r7=HEAPU16[r6>>1];if((r7&56|0)!=8){r8=HEAP32[r1+88+((r7>>>9&7)<<2)>>2];r9=r7&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,509,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r5)|0)!=0){STACKTOP=r2;return}r9=(HEAPU16[r5>>1]^r8)&65535;r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+8;_e68_cc_set_nz_16(r1,15,r9);r8=r1+156|0;r5=HEAP32[r8>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r11=r5&16777215;r5=r11+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r13=HEAPU8[r12+r11|0]<<8|HEAPU8[r12+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r10>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r9);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r9=r7&7|24;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,8,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r9=HEAPU16[r6>>1]>>>9&7|24;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,8,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r4)|0)!=0){STACKTOP=r2;return}r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+12;r9=HEAP16[r4>>1];r4=HEAP16[r3>>1];_e68_cc_set_cmp_16(r1,r9-r4&65535,r4,r9);r9=r1+156|0;r4=HEAP32[r9>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r14=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=r1+160|0;r7=HEAPU16[r6>>1];if((r7&56|0)!=8){r8=HEAP32[r1+88+((r7>>>9&7)<<2)>>2];r9=r7&63;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,509,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r5)|0)!=0){STACKTOP=r2;return}r9=HEAP32[r5>>2]^r8;r8=r1+372|0;HEAP32[r8>>2]=HEAP32[r8>>2]+12;_e68_cc_set_nz_32(r1,15,r9);r8=r1+156|0;r5=HEAP32[r8>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r11=r5&16777215;r5=r11+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r12=HEAP32[r1+32>>2];r13=HEAPU8[r12+r11|0]<<8|HEAPU8[r12+r5|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r10>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val32(r1,r9);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r9=r7&7|24;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,8,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r9=HEAPU16[r6>>1]>>>9&7|24;if((FUNCTION_TABLE[HEAP32[9712+(r9<<2)>>2]](r1,r9,8,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r4)|0)!=0){STACKTOP=r2;return}r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+20;r9=HEAP32[r4>>2];r4=HEAP32[r3>>2];_e68_cc_set_cmp_32(r1,r9-r4|0,r4,r9);r9=r1+156|0;r4=HEAP32[r9>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r14=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r9>>2]=HEAP32[r9>>2]+2;r9=r1+152|0;HEAP32[r9>>2]=HEAP32[r9>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opb1c0(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r1+160|0;r5=HEAP16[r4>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r1+120+((HEAPU16[r4>>1]>>>9&7)<<2)>>2];r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;r4=HEAP32[r3>>2];_e68_cc_set_cmp_32(r1,r5-r4|0,r4,r5);r5=r1+156|0;r4=HEAP32[r5>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r3=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r3>>1];r6=r4&16777215;r4=r6+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r8=HEAPU8[r7+r6|0]<<8|HEAPU8[r7+r4|0]}else{r8=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r3>>1]=r8;if((HEAP8[r1+336|0]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+2;r5=r1+152|0;HEAP32[r5>>2]=HEAP32[r5>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAPU8[r3]&HEAP32[r5>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_8(r1,15,r4&255);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAPU16[r3>>1]&HEAP32[r5>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;_e68_cc_set_nz_16(r1,15,r4&65535);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r3>>2]&HEAP32[r5>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+6;_e68_cc_set_nz_32(r1,15,r4);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc0c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=Math_imul(HEAPU16[r3>>1],HEAP32[r5>>2]&65535)|0;r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+74;_e68_cc_set_nz_32(r1,15,r4);r3=r1+156|0;r6=HEAP32[r3>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAPU8[r5]&r7&255;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+4;_e68_cc_set_nz_8(r1,15,r8);r7=r1+156|0;r5=HEAP32[r7>>2];if((r5&1|0)!=0){_e68_exception_address(r1,r5,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r5&16777215;r5=r10+1|0;if(r5>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r5|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val8(r1,r8);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r8=r6&7;r7=r6>>>9&7;if((r6&8|0)==0){r13=r7;r14=r8}else{r13=r7|32;r14=r8|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r3];r3=HEAP8[r4];r4=r1+166|0;r14=HEAP16[r4>>1];r8=((r3&255)+(r13&255)&65535)+((r14&65535)>>>4&1)&65535;r7=((r3&15)+(r13&15)|0)>9?r8+6&65535:r8;if((r7&65535)>159){r15=r7+96&65535;r16=r14|17}else{r15=r7;r16=r14&-18}HEAP16[r4>>1]=(r15&255)==0?r16:r16&-5;r16=r1+372|0;HEAP32[r16>>2]=HEAP32[r16>>2]+6;r16=r1+156|0;r4=HEAP32[r16>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r7=r4&16777215;r4=r7+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r17=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r4|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r14>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r16>>2]=HEAP32[r16>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;_e68_ea_set_val8(r1,r15&255);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4>>>3&7;if((r5|0)==0){r6=r1+88+((r4>>>9&7)<<2)|0;r7=HEAP32[r6>>2];r8=r1+88+((r4&7)<<2)|0;HEAP32[r6>>2]=HEAP32[r8>>2];HEAP32[r8>>2]=r7;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+10;r7=r1+156|0;r8=HEAP32[r7>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r9=r8&16777215;r8=r9+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r8|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r6>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else if((r5|0)==1){r5=r1+120+((r4>>>9&7)<<2)|0;r7=HEAP32[r5>>2];r11=r1+120+((r4&7)<<2)|0;HEAP32[r5>>2]=HEAP32[r11>>2];HEAP32[r11>>2]=r7;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+10;r7=r1+156|0;r11=HEAP32[r7>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r6=r11&16777215;r11=r6+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r12=HEAPU8[r9+r6|0]<<8|HEAPU8[r9+r11|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r6)}HEAP16[r5>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}else{r7=HEAP32[r1+88+((r4>>>9&7)<<2)>>2];r12=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r12<<2)>>2]](r1,r12,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r12=HEAPU16[r3>>1]&r7&65535;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+4;_e68_cc_set_nz_16(r1,15,r12);r7=r1+156|0;r3=HEAP32[r7>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r5=r3&16777215;r3=r5+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r13=HEAPU8[r6+r5|0]<<8|HEAPU8[r6+r3|0]}else{r13=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r4>>1]=r13;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val16(r1,r12);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}}function _opc180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4>>>9&7;if((r4&56|0)==8){r6=r1+88+(r5<<2)|0;r7=HEAP32[r6>>2];r8=r1+120+((r4&7)<<2)|0;HEAP32[r6>>2]=HEAP32[r8>>2];HEAP32[r8>>2]=r7;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+10;r7=r1+156|0;r8=HEAP32[r7>>2];if((r8&1|0)!=0){_e68_exception_address(r1,r8,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r9=r8&16777215;r8=r9+1|0;if(r8>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r8|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r6>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r7=HEAP32[r1+88+(r5<<2)>>2];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAP32[r3>>2]&r7;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+6;_e68_cc_set_nz_32(r1,15,r5);r7=r1+156|0;r3=HEAP32[r7>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r11=r3&16777215;r3=r11+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r12=HEAPU8[r6+r11|0]<<8|HEAPU8[r6+r3|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r4>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;_e68_ea_set_val32(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opc1c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP16[r3>>1];if(r6<<16>>16>-1){r7=0;r8=r6}else{r9=-r6&65535;HEAP16[r3>>1]=r9;r7=1;r8=r9}if((r4&32768|0)==0){r10=r4&65535;r11=0}else{r10=(r4^65535)+1&65535;r11=1}r4=Math_imul(r8&65535,r10&65535)|0;r10=(r7|0)==(r11|0)?r4:-r4|0;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+74;_e68_cc_set_nz_32(r1,15,r10);r4=r1+156|0;r11=HEAP32[r4>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r11&16777215;r11=r8+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r12=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r11|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=r10;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4093,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP8[r3];r3=(r6&255)+r4|0;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+4;_e68_cc_set_add_8(r1,r3&255,r6,r4&255);r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r3&255;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP16[r3>>1];r3=(r6&65535)+r4|0;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+4;_e68_cc_set_add_16(r1,r3&65535,r6,r4&65535);r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r3&65535;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+88+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP32[r3>>2];r3=r6+r4|0;r7=r1+372|0;HEAP32[r7>>2]=HEAP32[r7>>2]+6;_e68_cc_set_add_32(r1,r3,r6,r4);r4=r1+156|0;r6=HEAP32[r4>>2];if((r6&1|0)!=0){_e68_exception_address(r1,r6,0,0);STACKTOP=r2;return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r8=r6&16777215;r6=r8+1|0;if(r6>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r10=HEAPU8[r9+r8|0]<<8|HEAPU8[r9+r6|0]}else{r10=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r8)}HEAP16[r7>>1]=r10;if((HEAP8[r1+336|0]|0)==0){HEAP32[r4>>2]=HEAP32[r4>>2]+2;r4=r1+152|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2;HEAP32[r5>>2]=r3;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd0c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r5=HEAPU16[r3>>1];r3=r1+120+((r4>>>9&7)<<2)|0;r4=HEAP32[r3>>2];r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;r6=r1+156|0;r7=HEAP32[r6>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r3>>2]=((r5&32768|0)!=0?r5|-65536:r5)+r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP8[r5];r5=(r8&255)+r7&255;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+8;_e68_cc_set_add_8(r1,r5,r7&255,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val8(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,8)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val8(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP8[r3];r3=HEAP8[r4];r4=(r3+r13&255)+(HEAPU16[r1+166>>1]>>>4&1)&255;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+8;_e68_cc_set_addx_8(r1,r4,r13,r3);r3=r1+156|0;r13=HEAP32[r3>>2];if((r13&1|0)!=0){_e68_exception_address(r1,r13,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r13&16777215;r13=r5+1|0;if(r13>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r13|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val8(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP16[r5>>1];r5=(r8&65535)+r7&65535;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+8;_e68_cc_set_add_16(r1,r5,r7&65535,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP16[r3>>1];r3=HEAP16[r4>>1];r4=(r3+r13&65535)+(HEAPU16[r1+166>>1]>>>4&1)&65535;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+8;_e68_cc_set_addx_16(r1,r4,r13,r3);r3=r1+156|0;r13=HEAP32[r3>>2];if((r13&1|0)!=0){_e68_exception_address(r1,r13,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r13&16777215;r13=r5+1|0;if(r13>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r13|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val16(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;r6=HEAPU16[r1+160>>1];if((r6&48|0)!=0){r7=HEAP32[r1+88+((r6>>>9&7)<<2)>>2];r8=r6&63;if((FUNCTION_TABLE[HEAP32[9712+(r8<<2)>>2]](r1,r8,508,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r5)|0)!=0){STACKTOP=r2;return}r8=HEAP32[r5>>2];r5=r8+r7|0;r9=r1+372|0;HEAP32[r9>>2]=HEAP32[r9>>2]+12;_e68_cc_set_add_32(r1,r5,r7,r8);r8=r1+156|0;r7=HEAP32[r8>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r9=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r9>>1];r10=r7&16777215;r7=r10+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r11=HEAP32[r1+32>>2];r12=HEAPU8[r11+r10|0]<<8|HEAPU8[r11+r7|0]}else{r12=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r9>>1]=r12;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val32(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}r5=r6&7;r8=r6>>>9&7;if((r6&8|0)==0){r13=r8;r14=r5}else{r13=r8|32;r14=r5|32}if((FUNCTION_TABLE[HEAP32[9712+(r14<<2)>>2]](r1,r14,17,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}if((FUNCTION_TABLE[HEAP32[9712+(r13<<2)>>2]](r1,r13,17,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r4)|0)!=0){STACKTOP=r2;return}r13=HEAP32[r3>>2];r3=HEAP32[r4>>2];r4=r3+r13+(HEAPU16[r1+166>>1]>>>4&1)|0;r14=r1+372|0;HEAP32[r14>>2]=HEAP32[r14>>2]+12;_e68_cc_set_addx_32(r1,r4,r13,r3);r3=r1+156|0;r13=HEAP32[r3>>2];if((r13&1|0)!=0){_e68_exception_address(r1,r13,0,0);STACKTOP=r2;return}r14=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r14>>1];r5=r13&16777215;r13=r5+1|0;if(r13>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r15=HEAPU8[r8+r5|0]<<8|HEAPU8[r8+r13|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r5)}HEAP16[r14>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;_e68_ea_set_val32(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _opd1c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAPU16[r1+160>>1];r5=r4&63;if((FUNCTION_TABLE[HEAP32[9712+(r5<<2)>>2]](r1,r5,4095,32)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val32(r1,r3)|0)!=0){STACKTOP=r2;return}r5=r1+120+((r4>>>9&7)<<2)|0;r4=HEAP32[r5>>2];r6=HEAP32[r3>>2];r3=r1+372|0;HEAP32[r3>>2]=HEAP32[r3>>2]+6;r3=r1+156|0;r7=HEAP32[r3>>2];if((r7&1|0)!=0){_e68_exception_address(r1,r7,0,0);STACKTOP=r2;return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r9=r7&16777215;r7=r9+1|0;if(r7>>>0<HEAP32[r1+36>>2]>>>0){r10=HEAP32[r1+32>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r7|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r8>>1]=r11;if((HEAP8[r1+336|0]|0)==0){HEAP32[r3>>2]=HEAP32[r3>>2]+2;r3=r1+152|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;HEAP32[r5>>2]=r6+r4;STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope000(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==2){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2]&255;r7=r1+166|0;r8=HEAPU16[r7>>1]>>>4;r9=r3>>>9&7;if((r3&32|0)==0){r10=(r9|0)==0?8:r9;r11=r8&1;r2=44}else{r12=HEAP32[r1+88+(r9<<2)>>2]&63;r9=r8&1;if((r12|0)==0){r13=r6;r14=r9;r15=0}else{r10=r12;r11=r9;r2=44}}if(r2==44){r9=0;r12=r6;r6=r11;while(1){r11=(r12&65535)>>>1|r6<<7;r8=r9+1|0;r16=r12&1;if(r8>>>0<r10>>>0){r9=r8;r12=r11;r6=r16}else{r13=r11;r14=r16;r15=r10;break}}}r10=r1+372|0;HEAP32[r10>>2]=(r15<<1)+6+HEAP32[r10>>2];_e68_cc_set_nz_8(r1,14,r13&255);r10=HEAP16[r7>>1];HEAP16[r7>>1]=r14<<16>>16==0?r10&-18:r10|17;r10=r1+156|0;r14=HEAP32[r10>>2];if((r14&1|0)!=0){_e68_exception_address(r1,r14,0,0);return}r7=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r7>>1];r15=r14&16777215;r14=r15+1|0;if(r14>>>0<HEAP32[r1+36>>2]>>>0){r6=HEAP32[r1+32>>2];r17=HEAPU8[r6+r15|0]<<8|HEAPU8[r6+r14|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r15)}HEAP16[r7>>1]=r17;if((HEAP8[r1+336|0]|0)==0){HEAP32[r10>>2]=HEAP32[r10>>2]+2;r10=r1+152|0;HEAP32[r10>>2]=HEAP32[r10>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r13&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==1){r13=r1+88+((r3&7)<<2)|0;r5=HEAP32[r13>>2];r10=r3>>>9&7;do{if((r3&32|0)==0){r18=(r10|0)==0?8:r10;r2=25}else{r17=HEAP32[r1+88+(r10<<2)>>2]&63;if((r17|0)!=0){r18=r17;r2=25;break}r17=r1+166|0;HEAP16[r17>>1]=HEAP16[r17>>1]&-2;r19=r5&255;r20=0}}while(0);L29:do{if(r2==25){if(r18>>>0<8){r10=r5&255;r17=r10>>>(r18>>>0)&255;r7=r1+166|0;r15=HEAP16[r7>>1];if((1<<r18-1&r10|0)==0){HEAP16[r7>>1]=r15&-18;r19=r17;r20=r18;break}else{HEAP16[r7>>1]=r15|17;r19=r17;r20=r18;break}}do{if((r18|0)==8){if((r5&128|0)==0){break}r17=r1+166|0;HEAP16[r17>>1]=HEAP16[r17>>1]|17;r19=0;r20=8;break L29}}while(0);r17=r1+166|0;HEAP16[r17>>1]=HEAP16[r17>>1]&-18;r19=0;r20=r18}}while(0);r18=r1+372|0;HEAP32[r18>>2]=(r20<<1)+6+HEAP32[r18>>2];_e68_cc_set_nz_8(r1,14,r19);r18=r1+156|0;r20=HEAP32[r18>>2];if((r20&1|0)!=0){_e68_exception_address(r1,r20,0,0);return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r17=r20&16777215;r20=r17+1|0;if(r20>>>0<HEAP32[r1+36>>2]>>>0){r15=HEAP32[r1+32>>2];r21=HEAPU8[r15+r17|0]<<8|HEAPU8[r15+r20|0]}else{r21=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r17)}HEAP16[r5>>1]=r21;if((HEAP8[r1+336|0]|0)==0){HEAP32[r18>>2]=HEAP32[r18>>2]+2;r18=r1+152|0;HEAP32[r18>>2]=HEAP32[r18>>2]+2;HEAP32[r13>>2]=HEAP32[r13>>2]&-256|r19&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r19=r3&7;r13=r3>>>9&7;do{if((r3&32|0)==0){r18=r1+88+(r19<<2)|0;r22=(r13|0)==0?8:r13;r23=r18;r24=HEAP32[r18>>2];r2=6}else{r18=HEAP32[r1+88+(r13<<2)>>2]&63;r21=r1+88+(r19<<2)|0;r5=HEAP32[r21>>2];if((r18|0)!=0){r22=r18;r23=r21;r24=r5;r2=6;break}r18=r1+166|0;HEAP16[r18>>1]=HEAP16[r18>>1]&-2;r25=r5&255;r26=0;r27=r21}}while(0);do{if(r2==6){r19=r24&255;r13=(r24&128|0)!=0;if(r22>>>0<8){r21=(r13?r19|65280:r19)>>>(r22>>>0)&255;r5=r1+166|0;r18=HEAP16[r5>>1];if((1<<r22-1&r19|0)==0){HEAP16[r5>>1]=r18&-18;r25=r21;r26=r22;r27=r23;break}else{HEAP16[r5>>1]=r18|17;r25=r21;r26=r22;r27=r23;break}}else{r21=r1+166|0;r18=HEAP16[r21>>1];if(r13){HEAP16[r21>>1]=r18|17;r25=-1;r26=r22;r27=r23;break}else{HEAP16[r21>>1]=r18&-18;r25=0;r26=r22;r27=r23;break}}}}while(0);r23=r1+372|0;HEAP32[r23>>2]=(r26<<1)+6+HEAP32[r23>>2];_e68_cc_set_nz_8(r1,14,r25);r23=r1+156|0;r26=HEAP32[r23>>2];if((r26&1|0)!=0){_e68_exception_address(r1,r26,0,0);return}r22=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r22>>1];r24=r26&16777215;r26=r24+1|0;if(r26>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r28=HEAPU8[r2+r24|0]<<8|HEAPU8[r2+r26|0]}else{r28=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r24)}HEAP16[r22>>1]=r28;if((HEAP8[r1+336|0]|0)==0){HEAP32[r23>>2]=HEAP32[r23>>2]+2;r23=r1+152|0;HEAP32[r23>>2]=HEAP32[r23>>2]+2;HEAP32[r27>>2]=HEAP32[r27>>2]&-256|r25&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r4=r1+88+((r3&7)<<2)|0;r25=HEAP32[r4>>2];r27=r25&255;r23=r3>>>9&7;if((r3&32|0)==0){r29=(r23|0)==0?8:r23}else{r29=HEAP32[r1+88+(r23<<2)>>2]&63}r23=r29&7;L90:do{if((r23|0)==0){do{if((r29|0)!=0){if((r25&128|0)==0){break}r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]|1;r30=r27;break L90}}while(0);r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-2;r30=r27}else{r3=r25&255;r28=r3<<8-r23|r3>>>(r23>>>0);r3=r28&255;r22=r1+166|0;r24=HEAP16[r22>>1];if((r28&128|0)==0){HEAP16[r22>>1]=r24&-2;r30=r3;break}else{HEAP16[r22>>1]=r24|1;r30=r3;break}}}while(0);r23=r1+372|0;HEAP32[r23>>2]=(r29<<1)+6+HEAP32[r23>>2];_e68_cc_set_nz_8(r1,14,r30);r23=r1+156|0;r29=HEAP32[r23>>2];if((r29&1|0)!=0){_e68_exception_address(r1,r29,0,0);return}r25=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r25>>1];r27=r29&16777215;r29=r27+1|0;if(r29>>>0<HEAP32[r1+36>>2]>>>0){r3=HEAP32[r1+32>>2];r31=HEAPU8[r3+r27|0]<<8|HEAPU8[r3+r29|0]}else{r31=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r27)}HEAP16[r25>>1]=r31;if((HEAP8[r1+336|0]|0)==0){HEAP32[r23>>2]=HEAP32[r23>>2]+2;r23=r1+152|0;HEAP32[r23>>2]=HEAP32[r23>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-256|r30&255;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r30=r1+372|0;HEAP32[r30>>2]=HEAP32[r30>>2]+2;return}}function _ope040(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;L3:do{if((r3&32|0)==0){r8=(r7|0)==0?8:r7;r2=26}else{r9=HEAP32[r1+88+(r7<<2)>>2]&63;if((r9|0)==0){r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-2;r11=r6&65535;r12=0;break}if(r9>>>0<16){r8=r9;r2=26;break}do{if((r9|0)==16){if((r6&32768|0)==0){break}r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]|17;r11=0;r12=16;break L3}}while(0);r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-18;r11=0;r12=r9}}while(0);do{if(r2==26){r7=r6&65535;r10=r7>>>(r8>>>0)&65535;r13=r1+166|0;r14=HEAP16[r13>>1];if((1<<r8-1&r7|0)==0){HEAP16[r13>>1]=r14&-18;r11=r10;r12=r8;break}else{HEAP16[r13>>1]=r14|17;r11=r10;r12=r8;break}}}while(0);r8=r1+372|0;HEAP32[r8>>2]=(r12<<1)+6+HEAP32[r8>>2];_e68_cc_set_nz_16(r1,14,r11);r8=r1+156|0;r12=HEAP32[r8>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r10=r12&16777215;r12=r10+1|0;if(r12>>>0<HEAP32[r1+36>>2]>>>0){r14=HEAP32[r1+32>>2];r15=HEAPU8[r14+r10|0]<<8|HEAPU8[r14+r12|0]}else{r15=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r10)}HEAP16[r6>>1]=r15;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r11&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r11=r1+88+((r3&7)<<2)|0;r5=HEAP32[r11>>2]&65535;r8=r3>>>9&7;if((r3&32|0)==0){r15=r1+166|0;r16=(r8|0)==0?8:r8;r17=r15;r18=HEAPU16[r15>>1]>>>4;r2=44}else{r15=HEAP32[r1+88+(r8<<2)>>2]&63;r8=r1+166|0;r6=HEAPU16[r8>>1]>>>4;if((r15|0)==0){r19=r6;r20=r5;r21=0;r22=r8}else{r16=r15;r17=r8;r18=r6;r2=44}}if(r2==44){r6=r18;r18=0;r8=r5;while(1){r5=r6<<15|(r8&65535)>>>1;r15=r18+1|0;if(r15>>>0<r16>>>0){r6=r8;r18=r15;r8=r5}else{r19=r8;r20=r5;r21=r16;r22=r17;break}}}r17=r1+372|0;HEAP32[r17>>2]=(r21<<1)+6+HEAP32[r17>>2];_e68_cc_set_nz_16(r1,14,r20);r17=HEAP16[r22>>1];HEAP16[r22>>1]=(r19&1)==0?r17&-18:r17|17;r17=r1+156|0;r19=HEAP32[r17>>2];if((r19&1|0)!=0){_e68_exception_address(r1,r19,0,0);return}r22=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r22>>1];r21=r19&16777215;r19=r21+1|0;if(r19>>>0<HEAP32[r1+36>>2]>>>0){r16=HEAP32[r1+32>>2];r23=HEAPU8[r16+r21|0]<<8|HEAPU8[r16+r19|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r21)}HEAP16[r22>>1]=r23;if((HEAP8[r1+336|0]|0)==0){HEAP32[r17>>2]=HEAP32[r17>>2]+2;r17=r1+152|0;HEAP32[r17>>2]=HEAP32[r17>>2]+2;HEAP32[r11>>2]=HEAP32[r11>>2]&-65536|r20&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r20=r1+88+((r3&7)<<2)|0;r11=HEAP32[r20>>2];r17=r11&65535;r23=r3>>>9&7;if((r3&32|0)==0){r24=(r23|0)==0?8:r23}else{r24=HEAP32[r1+88+(r23<<2)>>2]&63}L60:do{if((r24&15|0)==0){do{if((r24|0)!=0){if((r11&32768|0)==0){break}r23=r1+166|0;HEAP16[r23>>1]=HEAP16[r23>>1]|1;r25=r17;break L60}}while(0);r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r25=r17}else{r9=r11&65535;r23=r9<<16-r24|r9>>>(r24>>>0);r9=r23&65535;r22=r1+166|0;r21=HEAP16[r22>>1];if((r23&32768|0)==0){HEAP16[r22>>1]=r21&-2;r25=r9;break}else{HEAP16[r22>>1]=r21|1;r25=r9;break}}}while(0);r11=r1+372|0;HEAP32[r11>>2]=(r24<<1)+6+HEAP32[r11>>2];_e68_cc_set_nz_16(r1,14,r25);r11=r1+156|0;r24=HEAP32[r11>>2];if((r24&1|0)!=0){_e68_exception_address(r1,r24,0,0);return}r17=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r17>>1];r9=r24&16777215;r24=r9+1|0;if(r24>>>0<HEAP32[r1+36>>2]>>>0){r21=HEAP32[r1+32>>2];r26=HEAPU8[r21+r9|0]<<8|HEAPU8[r21+r24|0]}else{r26=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r17>>1]=r26;if((HEAP8[r1+336|0]|0)==0){HEAP32[r11>>2]=HEAP32[r11>>2]+2;r11=r1+152|0;HEAP32[r11>>2]=HEAP32[r11>>2]+2;HEAP32[r20>>2]=HEAP32[r20>>2]&-65536|r25&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r4=r1+88+((r3&7)<<2)|0;r25=HEAP32[r4>>2];r20=r3>>>9&7;do{if((r3&32|0)==0){r27=(r20|0)==0?8:r20;r28=(r25&32768|0)!=0;r2=7}else{r11=HEAP32[r1+88+(r20<<2)>>2]&63;if((r11|0)==0){r26=r1+166|0;HEAP16[r26>>1]=HEAP16[r26>>1]&-2;r29=r25&65535;r30=0;break}r26=(r25&32768|0)!=0;if(r11>>>0<16){r27=r11;r28=r26;r2=7;break}r17=r1+166|0;r9=HEAP16[r17>>1];if(r26){HEAP16[r17>>1]=r9|17;r29=-1;r30=r11;break}else{HEAP16[r17>>1]=r9&-18;r29=0;r30=r11;break}}}while(0);do{if(r2==7){r20=r25&65535;r3=(r28?r25|-65536:r20)>>>(r27>>>0)&65535;r11=r1+166|0;r9=HEAP16[r11>>1];if((1<<r27-1&r20|0)==0){HEAP16[r11>>1]=r9&-18;r29=r3;r30=r27;break}else{HEAP16[r11>>1]=r9|17;r29=r3;r30=r27;break}}}while(0);r27=r1+372|0;HEAP32[r27>>2]=(r30<<1)+6+HEAP32[r27>>2];_e68_cc_set_nz_16(r1,14,r29);r27=r1+156|0;r30=HEAP32[r27>>2];if((r30&1|0)!=0){_e68_exception_address(r1,r30,0,0);return}r25=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r25>>1];r28=r30&16777215;r30=r28+1|0;if(r30>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r31=HEAPU8[r2+r28|0]<<8|HEAPU8[r2+r30|0]}else{r31=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r28)}HEAP16[r25>>1]=r31;if((HEAP8[r1+336|0]|0)==0){HEAP32[r27>>2]=HEAP32[r27>>2]+2;r27=r1+152|0;HEAP32[r27>>2]=HEAP32[r27>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r29&65535;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r29=r1+372|0;HEAP32[r29>>2]=HEAP32[r29>>2]+2;return}}function _ope080(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;do{if((r3&32|0)==0){r8=(r7|0)==0?8:r7;r2=28}else{r9=HEAP32[r1+88+(r7<<2)>>2]&63;if((r9|0)==0){r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-2;r11=r6;r12=0;break}if(r9>>>0<32){r8=r9;r2=28;break}r10=r1+166|0;r13=HEAP16[r10>>1];if((r9|0)==32&(r6|0)<0){HEAP16[r10>>1]=r13|17;r11=0;r12=32;break}else{HEAP16[r10>>1]=r13&-18;r11=0;r12=r9;break}}}while(0);do{if(r2==28){r7=r6>>>(r8>>>0);r9=r1+166|0;r13=HEAP16[r9>>1];if((1<<r8-1&r6|0)==0){HEAP16[r9>>1]=r13&-18;r11=r7;r12=r8;break}else{HEAP16[r9>>1]=r13|17;r11=r7;r12=r8;break}}}while(0);r8=r1+372|0;HEAP32[r8>>2]=(r12<<1)+8+HEAP32[r8>>2];_e68_cc_set_nz_32(r1,14,r11);r8=r1+156|0;r12=HEAP32[r8>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r7|0]<<8|HEAPU8[r13+r12|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r5>>2]=r11;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r11=r1+88+((r3&7)<<2)|0;r5=HEAP32[r11>>2];r8=r3>>>9&7;if((r3&32|0)==0){r14=r1+166|0;r15=(r8|0)==0?8:r8;r16=r14;r17=HEAPU16[r14>>1]>>>4&1;r2=45}else{r14=HEAP32[r1+88+(r8<<2)>>2]&63;r8=r1+166|0;r6=HEAPU16[r8>>1]>>>4&1;if((r14|0)==0){r18=r6;r19=r5;r20=0;r21=r8}else{r15=r14;r16=r8;r17=r6;r2=45}}if(r2==45){r6=r17;r17=0;r8=r5;while(1){r5=r8&1;r14=r6<<31|r8>>>1;r7=r17+1|0;if(r7>>>0<r15>>>0){r6=r5;r17=r7;r8=r14}else{r18=r5;r19=r14;r20=r15;r21=r16;break}}}r16=r1+372|0;HEAP32[r16>>2]=(r20<<1)+8+HEAP32[r16>>2];_e68_cc_set_nz_32(r1,14,r19);r16=HEAP16[r21>>1];HEAP16[r21>>1]=(r18|0)==0?r16&-18:r16|17;r16=r1+156|0;r18=HEAP32[r16>>2];if((r18&1|0)!=0){_e68_exception_address(r1,r18,0,0);return}r21=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r21>>1];r20=r18&16777215;r18=r20+1|0;if(r18>>>0<HEAP32[r1+36>>2]>>>0){r15=HEAP32[r1+32>>2];r22=HEAPU8[r15+r20|0]<<8|HEAPU8[r15+r18|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r20)}HEAP16[r21>>1]=r22;if((HEAP8[r1+336|0]|0)==0){HEAP32[r16>>2]=HEAP32[r16>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;HEAP32[r11>>2]=r19;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r19=r1+88+((r3&7)<<2)|0;r11=HEAP32[r19>>2];r16=r3>>>9&7;do{if((r3&32|0)==0){r22=(r16|0)==0?8:r16;r21=r11>>>(r22>>>0);if((r11|0)<0){r23=r22;r24=r21;r2=8}else{r25=r21;r26=r22;r2=9}}else{r22=HEAP32[r1+88+(r16<<2)>>2]&63;if((r22|0)==0){r21=r1+166|0;HEAP16[r21>>1]=HEAP16[r21>>1]&-2;r27=r11;r28=0;break}r21=(r11|0)<0;if(r22>>>0<32){r20=r11>>>(r22>>>0);if(r21){r23=r22;r24=r20;r2=8;break}else{r25=r20;r26=r22;r2=9;break}}r20=r1+166|0;r18=HEAP16[r20>>1];if(r21){HEAP16[r20>>1]=r18|17;r27=-1;r28=r22;break}else{HEAP16[r20>>1]=r18&-18;r27=0;r28=r22;break}}}while(0);if(r2==8){r25=-1<<32-r23|r24;r26=r23;r2=9}do{if(r2==9){r23=r1+166|0;r24=HEAP16[r23>>1];if((1<<r26-1&r11|0)==0){HEAP16[r23>>1]=r24&-18;r27=r25;r28=r26;break}else{HEAP16[r23>>1]=r24|17;r27=r25;r28=r26;break}}}while(0);r26=r1+372|0;HEAP32[r26>>2]=(r28<<1)+8+HEAP32[r26>>2];_e68_cc_set_nz_32(r1,14,r27);r26=r1+156|0;r28=HEAP32[r26>>2];if((r28&1|0)!=0){_e68_exception_address(r1,r28,0,0);return}r25=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r25>>1];r11=r28&16777215;r28=r11+1|0;if(r28>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r29=HEAPU8[r2+r11|0]<<8|HEAPU8[r2+r28|0]}else{r29=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r11)}HEAP16[r25>>1]=r29;if((HEAP8[r1+336|0]|0)==0){HEAP32[r26>>2]=HEAP32[r26>>2]+2;r26=r1+152|0;HEAP32[r26>>2]=HEAP32[r26>>2]+2;HEAP32[r19>>2]=r27;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r4=r1+88+((r3&7)<<2)|0;r27=HEAP32[r4>>2];r19=r3>>>9&7;if((r3&32|0)==0){r30=(r19|0)==0?8:r19}else{r30=HEAP32[r1+88+(r19<<2)>>2]&63}r19=r30&31;do{if((r19|0)==0){r3=r1+166|0;r26=HEAP16[r3>>1];if((r30|0)!=0&(r27|0)<0){HEAP16[r3>>1]=r26|1;r31=r27;break}else{HEAP16[r3>>1]=r26&-2;r31=r27;break}}else{r26=r27<<32-r19|r27>>>(r19>>>0);r3=r1+166|0;r29=HEAP16[r3>>1];if((r26|0)<0){HEAP16[r3>>1]=r29|1;r31=r26;break}else{HEAP16[r3>>1]=r29&-2;r31=r26;break}}}while(0);r19=r1+372|0;HEAP32[r19>>2]=(r30<<1)+8+HEAP32[r19>>2];_e68_cc_set_nz_32(r1,14,r31);r19=r1+156|0;r30=HEAP32[r19>>2];if((r30&1|0)!=0){_e68_exception_address(r1,r30,0,0);return}r27=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r27>>1];r26=r30&16777215;r30=r26+1|0;if(r30>>>0<HEAP32[r1+36>>2]>>>0){r29=HEAP32[r1+32>>2];r32=HEAPU8[r29+r26|0]<<8|HEAPU8[r29+r30|0]}else{r32=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r26)}HEAP16[r27>>1]=r32;if((HEAP8[r1+336|0]|0)==0){HEAP32[r19>>2]=HEAP32[r19>>2]+2;r19=r1+152|0;HEAP32[r19>>2]=HEAP32[r19>>2]+2;HEAP32[r4>>2]=r31;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r31=r1+372|0;HEAP32[r31>>2]=HEAP32[r31>>2]+2;return}}function _ope0c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP16[r3>>1];r5=(r4&65535)>>>1|r4&-32768;r4=r1+372|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;_e68_cc_set_nz_16(r1,14,r5);r4=r1+166|0;r6=HEAP16[r4>>1];HEAP16[r4>>1]=(HEAP16[r3>>1]&1)==0?r6&-18:r6|17;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r4=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r4>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r4>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope100(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;do{if((r3&32|0)==0){r8=(r7|0)==0?8:r7;r2=29}else{r9=HEAP32[r1+88+(r7<<2)>>2]&63;if((r9|0)!=0){r8=r9;r2=29;break}r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r10=r6&255;r11=0}}while(0);L7:do{if(r2==29){if(r8>>>0<8){r7=r6&255;r9=r7<<r8&255;r12=r1+166|0;r13=HEAP16[r12>>1];if((1<<8-r8&r7|0)==0){HEAP16[r12>>1]=r13&-18;r10=r9;r11=r8;break}else{HEAP16[r12>>1]=r13|17;r10=r9;r11=r8;break}}do{if((r8|0)==8){if((r6&1|0)==0){break}r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]|17;r10=0;r11=8;break L7}}while(0);r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-18;r10=0;r11=r8}}while(0);r8=r1+372|0;HEAP32[r8>>2]=(r11<<1)+6+HEAP32[r8>>2];_e68_cc_set_nz_8(r1,14,r10);r8=r1+156|0;r11=HEAP32[r8>>2];if((r11&1|0)!=0){_e68_exception_address(r1,r11,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r9=r11&16777215;r11=r9+1|0;if(r11>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r9|0]<<8|HEAPU8[r13+r11|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r9)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-256|r10&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r10=r1+88+((r3&7)<<2)|0;r5=HEAP32[r10>>2]&255;r8=r3>>>9&7;if((r3&32|0)==0){r14=r1+166|0;r15=(r8|0)==0?8:r8;r16=r14;r17=HEAPU16[r14>>1]>>>4&1;r2=48}else{r14=HEAP32[r1+88+(r8<<2)>>2]&63;r8=r1+166|0;r6=HEAPU16[r8>>1]>>>4&1;if((r14|0)==0){r18=r5;r19=r6;r20=0;r21=r8}else{r15=r14;r16=r8;r17=r6;r2=48}}if(r2==48){r6=0;r8=r5;r5=r17;while(1){r17=r8<<1|r5;r14=r6+1|0;r9=(r8&65535)>>>7&1;if(r14>>>0<r15>>>0){r6=r14;r8=r17;r5=r9}else{r18=r17;r19=r9;r20=r15;r21=r16;break}}}r16=r1+372|0;HEAP32[r16>>2]=(r20<<1)+6+HEAP32[r16>>2];_e68_cc_set_nz_8(r1,14,r18&255);r16=HEAP16[r21>>1];HEAP16[r21>>1]=r19<<16>>16==0?r16&-18:r16|17;r16=r1+156|0;r19=HEAP32[r16>>2];if((r19&1|0)!=0){_e68_exception_address(r1,r19,0,0);return}r21=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r21>>1];r20=r19&16777215;r19=r20+1|0;if(r19>>>0<HEAP32[r1+36>>2]>>>0){r15=HEAP32[r1+32>>2];r22=HEAPU8[r15+r20|0]<<8|HEAPU8[r15+r19|0]}else{r22=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r20)}HEAP16[r21>>1]=r22;if((HEAP8[r1+336|0]|0)==0){HEAP32[r16>>2]=HEAP32[r16>>2]+2;r16=r1+152|0;HEAP32[r16>>2]=HEAP32[r16>>2]+2;HEAP32[r10>>2]=HEAP32[r10>>2]&-256|r18&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r18=r1+88+((r3&7)<<2)|0;r10=HEAP32[r18>>2];r16=r10&255;r22=r3>>>9&7;if((r3&32|0)==0){r23=(r22|0)==0?8:r22}else{r23=HEAP32[r1+88+(r22<<2)>>2]&63}r22=r23&7;L60:do{if((r22|0)==0){do{if((r23|0)!=0){if((r10&1|0)==0){break}r21=r1+166|0;HEAP16[r21>>1]=HEAP16[r21>>1]|1;r24=r16;break L60}}while(0);r21=r1+166|0;HEAP16[r21>>1]=HEAP16[r21>>1]&-2;r24=r16}else{r21=r10&255;r20=r21>>>((8-r22|0)>>>0)|r21<<r22;r21=r20&255;r19=r1+166|0;r15=HEAP16[r19>>1];if((r20&1|0)==0){HEAP16[r19>>1]=r15&-2;r24=r21;break}else{HEAP16[r19>>1]=r15|1;r24=r21;break}}}while(0);r22=r1+372|0;HEAP32[r22>>2]=(r23<<1)+6+HEAP32[r22>>2];_e68_cc_set_nz_8(r1,14,r24);r22=r1+156|0;r23=HEAP32[r22>>2];if((r23&1|0)!=0){_e68_exception_address(r1,r23,0,0);return}r10=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r10>>1];r16=r23&16777215;r23=r16+1|0;if(r23>>>0<HEAP32[r1+36>>2]>>>0){r21=HEAP32[r1+32>>2];r25=HEAPU8[r21+r16|0]<<8|HEAPU8[r21+r23|0]}else{r25=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r16)}HEAP16[r10>>1]=r25;if((HEAP8[r1+336|0]|0)==0){HEAP32[r22>>2]=HEAP32[r22>>2]+2;r22=r1+152|0;HEAP32[r22>>2]=HEAP32[r22>>2]+2;HEAP32[r18>>2]=HEAP32[r18>>2]&-256|r24&255;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r4=r1+88+((r3&7)<<2)|0;r24=HEAP32[r4>>2];r18=r3>>>9&7;do{if((r3&32|0)==0){r26=(r18|0)==0?8:r18;r2=6}else{r22=HEAP32[r1+88+(r18<<2)>>2]&63;if((r22|0)!=0){r26=r22;r2=6;break}r22=r1+166|0;HEAP16[r22>>1]=HEAP16[r22>>1]&-4;r27=r24&255;r28=0}}while(0);do{if(r2==6){if(r26>>>0<8){r18=r24&255;r3=r18<<r26&255;r22=r1+166|0;r25=HEAP16[r22>>1];r10=(1<<8-r26&r18|0)==0?r25&-18:r25|17;HEAP16[r22>>1]=r10;r25=255<<7-r26&255;r18=r25&r24;if((r18|0)==0|(r18|0)==(r25|0)){HEAP16[r22>>1]=r10&-3;r27=r3;r28=r26;break}else{HEAP16[r22>>1]=r10|2;r27=r3;r28=r26;break}}do{if((r26|0)==8){if((r24&1|0)==0){r2=13;break}r3=r1+166|0;r10=HEAP16[r3>>1]|17;HEAP16[r3>>1]=r10;r29=r10}else{r2=13}}while(0);if(r2==13){r10=r1+166|0;r3=HEAP16[r10>>1]&-18;HEAP16[r10>>1]=r3;r29=r3}r3=r1+166|0;if((r24&255|0)==0){HEAP16[r3>>1]=r29&-3;r27=0;r28=r26;break}else{HEAP16[r3>>1]=r29|2;r27=0;r28=r26;break}}}while(0);r26=r1+372|0;HEAP32[r26>>2]=(r28<<1)+6+HEAP32[r26>>2];_e68_cc_set_nz_8(r1,12,r27);r26=r1+156|0;r28=HEAP32[r26>>2];if((r28&1|0)!=0){_e68_exception_address(r1,r28,0,0);return}r29=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r29>>1];r24=r28&16777215;r28=r24+1|0;if(r28>>>0<HEAP32[r1+36>>2]>>>0){r2=HEAP32[r1+32>>2];r30=HEAPU8[r2+r24|0]<<8|HEAPU8[r2+r28|0]}else{r30=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r24)}HEAP16[r29>>1]=r30;if((HEAP8[r1+336|0]|0)==0){HEAP32[r26>>2]=HEAP32[r26>>2]+2;r26=r1+152|0;HEAP32[r26>>2]=HEAP32[r26>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-256|r27&255;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r27=r1+372|0;HEAP32[r27>>2]=HEAP32[r27>>2]+2;return}}function _ope140(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==0){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;do{if((r3&32|0)==0){r8=(r7|0)==0?8:r7;r2=7}else{r9=HEAP32[r1+88+(r7<<2)>>2]&63;if((r9|0)==0){r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-4;r11=r6&65535;r12=0;break}if(r9>>>0<16){r8=r9;r2=7;break}do{if((r9|0)==16){if((r6&1|0)==0){r2=13;break}r10=r1+166|0;r13=HEAP16[r10>>1]|17;HEAP16[r10>>1]=r13;r14=r13}else{r2=13}}while(0);if(r2==13){r13=r1+166|0;r10=HEAP16[r13>>1]&-18;HEAP16[r13>>1]=r10;r14=r10}r10=r1+166|0;if((r6&65535|0)==0){HEAP16[r10>>1]=r14&-3;r11=0;r12=r9;break}else{HEAP16[r10>>1]=r14|2;r11=0;r12=r9;break}}}while(0);do{if(r2==7){r14=r6&65535;r7=r14<<r8&65535;r10=r1+166|0;r13=HEAP16[r10>>1];r15=(1<<16-r8&r14|0)==0?r13&-18:r13|17;HEAP16[r10>>1]=r15;r13=65535<<15-r8&65535;r14=r13&r6;if((r14|0)==0|(r14|0)==(r13|0)){HEAP16[r10>>1]=r15&-3;r11=r7;r12=r8;break}else{HEAP16[r10>>1]=r15|2;r11=r7;r12=r8;break}}}while(0);r8=r1+372|0;HEAP32[r8>>2]=(r12<<1)+6+HEAP32[r8>>2];_e68_cc_set_nz_16(r1,12,r11);r8=r1+156|0;r12=HEAP32[r8>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r1+36>>2]>>>0){r15=HEAP32[r1+32>>2];r16=HEAPU8[r15+r7|0]<<8|HEAPU8[r15+r12|0]}else{r16=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r16;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r5>>2]=HEAP32[r5>>2]&-65536|r11&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r11=r1+88+((r3&7)<<2)|0;r5=HEAP32[r11>>2]&65535;r8=r3>>>9&7;if((r3&32|0)==0){r16=r1+166|0;r17=(r8|0)==0?8:r8;r18=r16;r19=HEAPU16[r16>>1]>>>4&1;r2=48}else{r16=HEAP32[r1+88+(r8<<2)>>2]&63;r8=r1+166|0;r6=HEAPU16[r8>>1]>>>4&1;if((r16|0)==0){r20=r6;r21=r5;r22=0;r23=r8}else{r17=r16;r18=r8;r19=r6;r2=48}}if(r2==48){r6=r19;r19=0;r8=r5;while(1){r5=(r8&65535)>>>15;r16=r6|r8<<1;r7=r19+1|0;if(r7>>>0<r17>>>0){r6=r5;r19=r7;r8=r16}else{r20=r5;r21=r16;r22=r17;r23=r18;break}}}r18=r1+372|0;HEAP32[r18>>2]=(r22<<1)+6+HEAP32[r18>>2];_e68_cc_set_nz_16(r1,14,r21);r18=HEAP16[r23>>1];HEAP16[r23>>1]=r20<<16>>16==0?r18&-18:r18|17;r18=r1+156|0;r20=HEAP32[r18>>2];if((r20&1|0)!=0){_e68_exception_address(r1,r20,0,0);return}r23=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r23>>1];r22=r20&16777215;r20=r22+1|0;if(r20>>>0<HEAP32[r1+36>>2]>>>0){r17=HEAP32[r1+32>>2];r24=HEAPU8[r17+r22|0]<<8|HEAPU8[r17+r20|0]}else{r24=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r22)}HEAP16[r23>>1]=r24;if((HEAP8[r1+336|0]|0)==0){HEAP32[r18>>2]=HEAP32[r18>>2]+2;r18=r1+152|0;HEAP32[r18>>2]=HEAP32[r18>>2]+2;HEAP32[r11>>2]=HEAP32[r11>>2]&-65536|r21&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r21=r1+88+((r3&7)<<2)|0;r11=HEAP32[r21>>2];r18=r11&65535;r24=r3>>>9&7;if((r3&32|0)==0){r25=(r24|0)==0?8:r24}else{r25=HEAP32[r1+88+(r24<<2)>>2]&63}r24=r25&15;L67:do{if((r24|0)==0){do{if((r25|0)!=0){if((r11&1|0)==0){break}r23=r1+166|0;HEAP16[r23>>1]=HEAP16[r23>>1]|1;r26=r18;break L67}}while(0);r9=r1+166|0;HEAP16[r9>>1]=HEAP16[r9>>1]&-2;r26=r18}else{r9=r11&65535;r23=r9>>>((16-r24|0)>>>0)|r9<<r24;r9=r23&65535;r22=r1+166|0;r20=HEAP16[r22>>1];if((r23&1|0)==0){HEAP16[r22>>1]=r20&-2;r26=r9;break}else{HEAP16[r22>>1]=r20|1;r26=r9;break}}}while(0);r24=r1+372|0;HEAP32[r24>>2]=(r25<<1)+6+HEAP32[r24>>2];_e68_cc_set_nz_16(r1,14,r26);r24=r1+156|0;r25=HEAP32[r24>>2];if((r25&1|0)!=0){_e68_exception_address(r1,r25,0,0);return}r11=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r11>>1];r18=r25&16777215;r25=r18+1|0;if(r25>>>0<HEAP32[r1+36>>2]>>>0){r9=HEAP32[r1+32>>2];r27=HEAPU8[r9+r18|0]<<8|HEAPU8[r9+r25|0]}else{r27=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r18)}HEAP16[r11>>1]=r27;if((HEAP8[r1+336|0]|0)==0){HEAP32[r24>>2]=HEAP32[r24>>2]+2;r24=r1+152|0;HEAP32[r24>>2]=HEAP32[r24>>2]+2;HEAP32[r21>>2]=HEAP32[r21>>2]&-65536|r26&65535;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==1){r4=r1+88+((r3&7)<<2)|0;r26=HEAP32[r4>>2];r21=r3>>>9&7;L92:do{if((r3&32|0)==0){r28=(r21|0)==0?8:r21;r2=30}else{r24=HEAP32[r1+88+(r21<<2)>>2]&63;if((r24|0)==0){r27=r1+166|0;HEAP16[r27>>1]=HEAP16[r27>>1]&-2;r29=r26&65535;r30=0;break}if(r24>>>0<16){r28=r24;r2=30;break}do{if((r24|0)==16){if((r26&1|0)==0){break}r27=r1+166|0;HEAP16[r27>>1]=HEAP16[r27>>1]|17;r29=0;r30=16;break L92}}while(0);r27=r1+166|0;HEAP16[r27>>1]=HEAP16[r27>>1]&-18;r29=0;r30=r24}}while(0);do{if(r2==30){r21=r26&65535;r3=r21<<r28&65535;r27=r1+166|0;r11=HEAP16[r27>>1];if((1<<16-r28&r21|0)==0){HEAP16[r27>>1]=r11&-18;r29=r3;r30=r28;break}else{HEAP16[r27>>1]=r11|17;r29=r3;r30=r28;break}}}while(0);r28=r1+372|0;HEAP32[r28>>2]=(r30<<1)+6+HEAP32[r28>>2];_e68_cc_set_nz_16(r1,14,r29);r28=r1+156|0;r30=HEAP32[r28>>2];if((r30&1|0)!=0){_e68_exception_address(r1,r30,0,0);return}r26=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r26>>1];r2=r30&16777215;r30=r2+1|0;if(r30>>>0<HEAP32[r1+36>>2]>>>0){r3=HEAP32[r1+32>>2];r31=HEAPU8[r3+r2|0]<<8|HEAPU8[r3+r30|0]}else{r31=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r2)}HEAP16[r26>>1]=r31;if((HEAP8[r1+336|0]|0)==0){HEAP32[r28>>2]=HEAP32[r28>>2]+2;r28=r1+152|0;HEAP32[r28>>2]=HEAP32[r28>>2]+2;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r29&65535;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r29=r1+372|0;HEAP32[r29>>2]=HEAP32[r29>>2]+2;return}}function _ope180(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=0;r3=HEAPU16[r1+160>>1];r4=r3>>>3&3;if((r4|0)==1){r5=r1+88+((r3&7)<<2)|0;r6=HEAP32[r5>>2];r7=r3>>>9&7;L3:do{if((r3&32|0)==0){r8=(r7|0)==0?8:r7;r2=30}else{r9=HEAP32[r1+88+(r7<<2)>>2]&63;if((r9|0)==0){r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-2;r11=r6;r12=0;break}if(r9>>>0<32){r8=r9;r2=30;break}do{if((r9|0)==32){if((r6&1|0)==0){break}r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]|17;r11=0;r12=32;break L3}}while(0);r10=r1+166|0;HEAP16[r10>>1]=HEAP16[r10>>1]&-18;r11=0;r12=r9}}while(0);do{if(r2==30){r7=r6<<r8;r10=r1+166|0;r13=HEAP16[r10>>1];if((1<<32-r8&r6|0)==0){HEAP16[r10>>1]=r13&-18;r11=r7;r12=r8;break}else{HEAP16[r10>>1]=r13|17;r11=r7;r12=r8;break}}}while(0);r8=r1+372|0;HEAP32[r8>>2]=(r12<<1)+8+HEAP32[r8>>2];_e68_cc_set_nz_32(r1,14,r11);r8=r1+156|0;r12=HEAP32[r8>>2];if((r12&1|0)!=0){_e68_exception_address(r1,r12,0,0);return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r7=r12&16777215;r12=r7+1|0;if(r12>>>0<HEAP32[r1+36>>2]>>>0){r13=HEAP32[r1+32>>2];r14=HEAPU8[r13+r7|0]<<8|HEAPU8[r13+r12|0]}else{r14=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r6>>1]=r14;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;HEAP32[r5>>2]=r11;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==2){r11=r3>>>9&7;if((r3&32|0)==0){r15=(r11|0)==0?8:r11}else{r15=HEAP32[r1+88+(r11<<2)>>2]&63}r11=r1+88+((r3&7)<<2)|0;r5=HEAP32[r11>>2];r8=r1+166|0;r14=HEAPU16[r8>>1]>>>4&1;if((r15|0)==0){r16=r14;r17=r5}else{r6=r14;r14=0;r7=r5;while(1){r5=r7>>>31;r12=r6|r7<<1;r13=r14+1|0;if(r13>>>0<r15>>>0){r6=r5;r14=r13;r7=r12}else{r16=r5;r17=r12;break}}}r7=r1+372|0;HEAP32[r7>>2]=(r15<<1)+8+HEAP32[r7>>2];_e68_cc_set_nz_32(r1,14,r17);r7=HEAP16[r8>>1];HEAP16[r8>>1]=(r16|0)==0?r7&-18:r7|17;r7=r1+156|0;r16=HEAP32[r7>>2];if((r16&1|0)!=0){_e68_exception_address(r1,r16,0,0);return}r8=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r8>>1];r15=r16&16777215;r16=r15+1|0;if(r16>>>0<HEAP32[r1+36>>2]>>>0){r14=HEAP32[r1+32>>2];r18=HEAPU8[r14+r15|0]<<8|HEAPU8[r14+r16|0]}else{r18=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r15)}HEAP16[r8>>1]=r18;if((HEAP8[r1+336|0]|0)==0){HEAP32[r7>>2]=HEAP32[r7>>2]+2;r7=r1+152|0;HEAP32[r7>>2]=HEAP32[r7>>2]+2;HEAP32[r11>>2]=r17;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==0){r17=r1+88+((r3&7)<<2)|0;r11=HEAP32[r17>>2];r7=r3>>>9&7;do{if((r3&32|0)==0){r19=(r7|0)==0?8:r7;r2=7}else{r18=HEAP32[r1+88+(r7<<2)>>2]&63;if((r18|0)==0){r8=r1+166|0;HEAP16[r8>>1]=HEAP16[r8>>1]&-4;r20=r11;r21=0;break}if(r18>>>0<32){r19=r18;r2=7;break}do{if((r18|0)==32){if((r11&1|0)==0){r2=13;break}r8=r1+166|0;r15=HEAP16[r8>>1]|17;HEAP16[r8>>1]=r15;r22=r15}else{r2=13}}while(0);if(r2==13){r9=r1+166|0;r15=HEAP16[r9>>1]&-18;HEAP16[r9>>1]=r15;r22=r15}r15=r1+166|0;if((r11|0)==0){HEAP16[r15>>1]=r22&-3;r20=0;r21=r18;break}else{HEAP16[r15>>1]=r22|2;r20=0;r21=r18;break}}}while(0);do{if(r2==7){r22=r11<<r19;r7=-1<<31-r19;r15=r1+166|0;r9=HEAP16[r15>>1];r8=(1<<32-r19&r11|0)==0?r9&-18:r9|17;HEAP16[r15>>1]=r8;r9=r7&r11;if((r9|0)==0|(r9|0)==(r7|0)){HEAP16[r15>>1]=r8&-3;r20=r22;r21=r19;break}else{HEAP16[r15>>1]=r8|2;r20=r22;r21=r19;break}}}while(0);r19=r1+372|0;HEAP32[r19>>2]=(r21<<1)+8+HEAP32[r19>>2];_e68_cc_set_nz_32(r1,12,r20);r19=r1+156|0;r21=HEAP32[r19>>2];if((r21&1|0)!=0){_e68_exception_address(r1,r21,0,0);return}r11=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r11>>1];r2=r21&16777215;r21=r2+1|0;if(r21>>>0<HEAP32[r1+36>>2]>>>0){r22=HEAP32[r1+32>>2];r23=HEAPU8[r22+r2|0]<<8|HEAPU8[r22+r21|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r2)}HEAP16[r11>>1]=r23;if((HEAP8[r1+336|0]|0)==0){HEAP32[r19>>2]=HEAP32[r19>>2]+2;r19=r1+152|0;HEAP32[r19>>2]=HEAP32[r19>>2]+2;HEAP32[r17>>2]=r20;return}else{_e68_exception_bus(r1);return}}else if((r4|0)==3){r4=r1+88+((r3&7)<<2)|0;r20=HEAP32[r4>>2];r17=r3>>>9&7;if((r3&32|0)==0){r24=(r17|0)==0?8:r17}else{r24=HEAP32[r1+88+(r17<<2)>>2]&63}r17=r24&31;L96:do{if((r17|0)==0){do{if((r24|0)!=0){if((r20&1|0)==0){break}r3=r1+166|0;HEAP16[r3>>1]=HEAP16[r3>>1]|1;r25=r20;break L96}}while(0);r18=r1+166|0;HEAP16[r18>>1]=HEAP16[r18>>1]&-2;r25=r20}else{r18=r20>>>((32-r17|0)>>>0)|r20<<r17;r3=r1+166|0;r19=HEAP16[r3>>1];if((r18&1|0)==0){HEAP16[r3>>1]=r19&-2;r25=r18;break}else{HEAP16[r3>>1]=r19|1;r25=r18;break}}}while(0);r17=r1+372|0;HEAP32[r17>>2]=(r24<<1)+8+HEAP32[r17>>2];_e68_cc_set_nz_32(r1,14,r25);r17=r1+156|0;r24=HEAP32[r17>>2];if((r24&1|0)!=0){_e68_exception_address(r1,r24,0,0);return}r20=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r20>>1];r18=r24&16777215;r24=r18+1|0;if(r24>>>0<HEAP32[r1+36>>2]>>>0){r19=HEAP32[r1+32>>2];r26=HEAPU8[r19+r18|0]<<8|HEAPU8[r19+r24|0]}else{r26=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r18)}HEAP16[r20>>1]=r26;if((HEAP8[r1+336|0]|0)==0){HEAP32[r17>>2]=HEAP32[r17>>2]+2;r17=r1+152|0;HEAP32[r17>>2]=HEAP32[r17>>2]+2;HEAP32[r4>>2]=r25;return}else{_e68_exception_bus(r1);return}}else{_e68_exception_illegal(r1);r25=r1+372|0;HEAP32[r25>>2]=HEAP32[r25>>2]+2;return}}function _ope1c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1]<<1;r5=r4&65535;r6=r1+372|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;_e68_cc_set_nz_16(r1,12,r5);r6=HEAP16[r3>>1];r3=r1+166|0;r7=HEAP16[r3>>1];r8=r6<<16>>16<0?r7|17:r7&-18;HEAP16[r3>>1]=((r6&65535^r4)&32768|0)==0?r8&-3:r8|2;r8=r1+156|0;r4=HEAP32[r8>>2];if((r4&1|0)!=0){_e68_exception_address(r1,r4,0,0);STACKTOP=r2;return}r6=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r6>>1];r3=r4&16777215;r4=r3+1|0;if(r4>>>0<HEAP32[r1+36>>2]>>>0){r7=HEAP32[r1+32>>2];r9=HEAPU8[r7+r3|0]<<8|HEAPU8[r7+r4|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r3)}HEAP16[r6>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r8>>2]=HEAP32[r8>>2]+2;r8=r1+152|0;HEAP32[r8>>2]=HEAP32[r8>>2]+2;_e68_ea_set_val16(r1,r5);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope2c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAPU16[r3>>1]>>>1;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_nz_16(r1,14,r4);r5=r1+166|0;r6=HEAP16[r5>>1];HEAP16[r5>>1]=(HEAP16[r3>>1]&1)==0?r6&-18:r6|17;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}function _ope3c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=HEAP16[r1+160>>1]&63;if((FUNCTION_TABLE[HEAP32[9712+(r4<<2)>>2]](r1,r4,508,16)|0)!=0){STACKTOP=r2;return}if((_e68_ea_get_val16(r1,r3)|0)!=0){STACKTOP=r2;return}r4=HEAP16[r3>>1]<<1;r5=r1+372|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;_e68_cc_set_nz_16(r1,14,r4);r5=r1+166|0;r6=HEAP16[r5>>1];HEAP16[r5>>1]=(HEAP16[r3>>1]|0)<0?r6|17:r6&-18;r6=r1+156|0;r3=HEAP32[r6>>2];if((r3&1|0)!=0){_e68_exception_address(r1,r3,0,0);STACKTOP=r2;return}r5=r1+164|0;HEAP16[r1+162>>1]=HEAP16[r5>>1];r7=r3&16777215;r3=r7+1|0;if(r3>>>0<HEAP32[r1+36>>2]>>>0){r8=HEAP32[r1+32>>2];r9=HEAPU8[r8+r7|0]<<8|HEAPU8[r8+r3|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+12>>2]](HEAP32[r1+4>>2],r7)}HEAP16[r5>>1]=r9;if((HEAP8[r1+336|0]|0)==0){HEAP32[r6>>2]=HEAP32[r6>>2]+2;r6=r1+152|0;HEAP32[r6>>2]=HEAP32[r6>>2]+2;_e68_ea_set_val16(r1,r4);STACKTOP=r2;return}else{_e68_exception_bus(r1);STACKTOP=r2;return}}









function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4+(r5>>>0<r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;r6=r2-r4-(r3>>>0>r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math_imul(r4,r3)|0;r6=r1>>>16;r7=(r5>>>16)+Math_imul(r4,r6)|0;r8=r2>>>16;r9=Math_imul(r8,r3)|0;return(tempRet0=(r7>>>16)+Math_imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,r7+r9<<16|r5&65535|0)|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6)|0;r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8)|0;r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13)|0;return(tempRet0=tempRet0,r15)|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7)|0;r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9)|0;___udivmoddi4(r10,r11,r12,tempRet0,r5)|0;r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7)|0;r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math_imul(r2,r6)|0;return(tempRet0=Math_imul(r4,r5)+r9+r8|r8&0,r7&-1|0)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return(tempRet0=tempRet0,r5)|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5)|0;STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)==0){if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}else{if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=r1&-1|0;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=r8>>>(r20>>>0)|0;r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=r3&-1|0;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1)|0;r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=r44<<1|r47>>>31|0;r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51)|0;r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39)|0;r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=r61;HEAP32[r5+4>>2]=r62}r69=(r65|0)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}




// EMSCRIPTEN_END_FUNCS
Module["_st_get_sim"] = _st_get_sim;
Module["_main"] = _main;
Module["_st_set_msg"] = _st_set_msg;
Module["_realloc"] = _realloc;

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





