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

STATICTOP = STATIC_BASE + 32448;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });







var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;






























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([0,131,3,0,0,0,0,0,0,130,2,0,0,44,0,0,0,132,4,0,0,4,0,0,0,134,6,0,0,48,0,0,1,132,4,0,0,80,0,0,1,130,2,0,0,46,0,0,1,131,3,0,0,88,0,0,1,134,6,0,0,12,0,0,0,1,2,0,0,24,0,0,0,138,2,0,0,18,0,0,0,129,2,0,0,0,0,0,0,139,2,0,0,20,0,0,0,130,2,0,0,2,0,0,0,2,2,0,0,26,0,0,0,131,2,0,0,4,0,0,0,3,2,0,0,28,0,0,0,132,2,0,0,6,0,0,0,4,2,0,0,30,0,0,0,133,2,0,0,8,0,0,0,5,2,0,0,32,0,0,0,134,2,0,0,10,0,0,0,6,2,0,0,34,0,0,0,135,2,0,0,12,0,0,0,7,2,0,0,36,0,0,0,136,2,0,0,14,0,0,0,8,2,0,0,38,0,0,0,137,2,0,0,16,0,0,1,144,2,0,0,84,0,0,1,135,2,0,0,56,0,0,1,145,2,0,0,86,0,0,1,136,2,0,0,58,0,0,1,146,2,0,0,88,0,0,1,137,2,0,0,60,0,0,1,147,2,0,0,90,0,0,1,138,2,0,0,62,0,0,1,129,2,0,0,22,0,0,1,139,2,0,0,64,0,0,1,130,2,0,0,46,0,0,1,140,2,0,0,66,0,0,1,131,2,0,0,48,0,0,1,141,2,0,0,68,0,0,1,132,2,0,0,50,0,0,1,142,2,0,0,70,0,0,1,133,2,0,0,52,0,0,1,143,2,0,0,72,0,0,1,134,2,0,0,54,0,0,80,0,0,0,0,92,0,0,38,0,0,0,72,0,0,0,8,0,0,0,8,0,0,0,160,70,0,0,32,64,0,0,16,58,0,0,8,53,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,120,72,0,0,130,1,0,0,144,65,0,0,120,2,0,0,160,59,0,0,208,2,0,0,248,53,0,0,96,0,0,0,16,50,0,0,138,1,0,0,200,46,0,0,128,2,0,0,64,43,0,0,142,4,0,0,0,40,0,0,168,2,0,0,216,100,0,0,88,4,0,0,72,97,0,0,98,0,0,0,8,93,0,0,70,3,0,0,96,90,0,0,20,2,0,0,112,87,0,0,20,3,0,0,32,85,0,0,28,4,0,0,80,83,0,0,96,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,95,0,0,0,0,0,0,104,95,0,0,0,95,0,0,160,94,0,0,8,94,0,0,64,93,0,0,216,92,0,0,45,43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,104,44,0,0,48,41,0,0,216,101,0,0,8,99,0,0,240,93,0,0,0,0,0,0,83,79,70,84,87,65,82,69,32,80,73,82,65,84,69,83,136,55,0,0,48,54,0,0,192,53,0,0,136,53,0,0,176,124,0,0,32,53,0,0,248,52,0,0,160,52,0,0,56,52,0,0,248,51,0,0,152,51,0,0,48,51,0,0,120,50,0,0,40,50,0,0,224,49,0,0,88,47,0,0,168,49,0,0,112,49,0,0,176,43,0,0,56,49,0,0,0,49,0,0,128,40,0,0,176,124,0,0,216,48,0,0,128,60,0,0,128,48,0,0,64,48,0,0,104,101,0,0,216,47,0,0,224,46,0,0,88,98,0,0,176,124,0,0,152,46,0,0,152,54,0,0,64,46,0,0,248,45,0,0,104,93,0,0,176,45,0,0,120,45,0,0,240,90,0,0,48,45,0,0,224,44,0,0,184,51,0,0,8,73,0,0,64,72,0,0,192,71,0,0,48,71,0,0,128,70,0,0,96,48,0,0,16,70,0,0,80,69,0,0,96,48,0,0,168,124,0,0,16,68,0,0,192,44,0,0,168,124,0,0,184,67,0,0,128,41,0,0,224,65,0,0,72,65,0,0,56,102,0,0,248,64,0,0,144,64,0,0,184,99,0,0,24,64,0,0,160,63,0,0,184,99,0,0,48,63,0,0,144,62,0,0,168,94,0,0,0,62,0,0,152,61,0,0,88,91,0,0,24,60,0,0,64,59,0,0,168,88,0,0,8,73,0,0,208,58,0,0,80,86,0,0,112,58,0,0,0,58,0,0,152,80,0,0,168,57,0,0,24,57,0,0,88,79,0,0,8,73,0,0,144,56,0,0,80,78,0,0,224,55,0,0,168,55,0,0,63,0,0,0,0,78,0,0,0,0,0,0,152,76,0,0,99,0,1,0,224,74,0,0,176,72,0,0,8,72,0,0,100,0,1,0,160,71,0,0,176,72,0,0,224,70,0,0,103,0,1,0,88,70,0,0,176,72,0,0,224,69,0,0,105,0,1,0,16,69,0,0,176,72,0,0,136,68,0,0,73,0,1,0,232,67,0,0,176,72,0,0,56,67,0,0,108,0,1,0,168,65,0,0,176,72,0,0,24,65,0,0,113,0,0,0,200,64,0,0,0,0,0,0,64,64,0,0,114,0,0,0,208,63,0,0,0,0,0,0,112,63,0,0,82,0,0,0,240,62,0,0,0,0,0,0,112,62,0,0,115,0,1,0,200,61,0,0,104,61,0,0,200,59,0,0,116,0,1,0,24,59,0,0,176,72,0,0,160,58,0,0,118,0,0,0,64,58,0,0,0,0,0,0,192,57,0,0,86,0,0,0,136,57,0,0,0,0,0,0,184,56,0,0,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,88,78,0,0,2,0,0,0,8,95,0,0,3,0,0,0,24,73,0,0,4,0,0,0,240,65,0,0,5,0,0,0,32,60,0,0,6,0,0,0,96,54,0,0,7,0,0,0,80,50,0,0,8,0,0,0,64,47,0,0,9,0,0,0,152,43,0,0,10,0,0,0,104,40,0,0,11,0,0,0,80,101,0,0,12,0,0,0,16,98,0,0,13,0,0,0,80,93,0,0,14,0,0,0,192,90,0,0,14,0,0,0,224,87,0,0,15,0,0,0,200,85,0,0,15,0,0,0,232,83,0,0,16,0,0,0,32,80,0,0,17,0,0,0,0,79,0,0,17,0,0,0,8,78,0,0,18,0,0,0,176,76,0,0,19,0,0,0,232,74,0,0,20,0,0,0,184,72,0,0,21,0,0,0,40,72,0,0,22,0,0,0,168,71,0,0,23,0,0,0,16,71,0,0,24,0,0,0,104,70,0,0,25,0,0,0,248,69,0,0,26,0,0,0,32,69,0,0,27,0,0,0,184,68,0,0,28,0,0,0,248,67,0,0,28,0,0,0,96,67,0,0,29,0,0,0,176,65,0,0,29,0,0,0,56,65,0,0,30,0,0,0,208,64,0,0,31,0,0,0,96,64,0,0,32,0,0,0,216,63,0,0,33,0,0,0,144,63,0,0,34,0,0,0,0,63,0,0,35,0,0,0,136,62,0,0,36,0,0,0,208,61,0,0,37,0,0,0,112,61,0,0,38,0,0,0,224,59,0,0,39,0,0,0,40,59,0,0,40,0,0,0,184,58,0,0,41,0,0,0,72,58,0,0,42,0,0,0,224,57,0,0,42,0,0,0,144,57,0,0,43,0,0,0,216,56,0,0,43,0,0,0,136,56,0,0,44,0,0,0,216,55,0,0,45,0,0,0,120,55,0,0,46,0,0,0,40,54,0,0,47,0,0,0,184,53,0,0,48,0,0,0,128,53,0,0,49,0,0,0,24,53,0,0,50,0,0,0,240,52,0,0,51,0,0,0,152,52,0,0,52,0,0,0,48,52,0,0,53,0,0,0,240,51,0,0,54,0,0,0,144,51,0,0,55,0,0,0,32,51,0,0,55,0,0,0,32,50,0,0,56,0,0,0,216,49,0,0,56,0,0,0,152,49,0,0,56,0,0,0,104,49,0,0,57,0,0,0,40,49,0,0,57,0,0,0,248,48,0,0,58,0,0,0,200,48,0,0,58,0,0,0,120,48,0,0,59,0,0,0,56,48,0,0,59,0,0,0,208,47,0,0,60,0,0,0,216,46,0,0,61,0,0,0,144,46,0,0,62,0,0,0,56,46,0,0,63,0,0,0,240,45,0,0,64,0,0,0,168,45,0,0,66,0,0,0,112,45,0,0,65,0,0,0,40,45,0,0,67,0,0,0,216,44,0,0,67,0,0,0,160,44,0,0,68,0,0,0,96,44,0,0,68,0,0,0,80,43,0,0,69,0,0,0,8,43,0,0,69,0,0,0,216,42,0,0,71,0,0,0,168,42,0,0,71,0,0,0,120,42,0,0,73,0,0,0,224,41,0,0,73,0,0,0,208,41,0,0,72,0,0,0,144,41,0,0,72,0,0,0,96,41,0,0,72,0,0,0,32,41,0,0,74,0,0,0,24,40,0,0,75,0,0,0,168,39,0,0,75,0,0,0,112,39,0,0,76,0,0,0,56,39,0,0,77,0,0,0,248,38,0,0,78,0,0,0,200,38,0,0,79,0,0,0,168,38,0,0,79,0,0,0,88,38,0,0,79,0,0,0,24,102,0,0,80,0,0,0,208,101,0,0,81,0,0,0,248,100,0,0,82,0,0,0,152,100,0,0,83,0,0,0,112,100,0,0,84,0,0,0,80,100,0,0,85,0,0,0,40,100,0,0,86,0,0,0,24,100,0,0,87,0,0,0,248,99,0,0,88,0,0,0,192,99,0,0,89,0,0,0,88,99,0,0,90,0,0,0,0,99,0,0,91,0,0,0,112,97,0,0,92,0,0,0,208,96,0,0,93,0,0,0,112,96,0,0,94,0,0,0,40,96,0,0,95,0,0,0,208,95,0,0,96,0,0,0,160,95,0,0,97,0,0,0,96,95,0,0,98,0,0,0,240,94,0,0,99,0,0,0,152,94,0,0,100,0,0,0,232,93,0,0,101,0,0,0,32,93,0,0,102,0,0,0,208,92,0,0,103,0,0,0,144,92,0,0,104,0,0,0,96,92,0,0,105,0,0,0,8,92,0,0,106,0,0,0,224,91,0,0,107,0,0,0,176,91,0,0,108,0,0,0,104,91,0,0,109,0,0,0,72,91,0,0,110,0,0,0,32,91,0,0,111,0,0,0,112,90,0,0,112,0,0,0,240,89,0,0,113,0,0,0,152,89,0,0,114,0,0,0,104,89,0,0,115,0,0,0,24,89,0,0,116,0,0,0,248,88,0,0,117,0,0,0,216,88,0,0,118,0,0,0,184,88,0,0,119,0,0,0,144,88,0,0,120,0,0,0,104,88,0,0,121,0,0,0,136,87,0,0,122,0,0,0,48,87,0,0,123,0,0,0,16,87,0,0,124,0,0,0,232,86,0,0,0,0,0,0,0,0,0,0,27,0,0,0,1,0,0,0,58,4,0,0,2,0,0,0,59,4,0,0,3,0,0,0,60,4,0,0,4,0,0,0,61,4,0,0,5,0,0,0,62,4,0,0,6,0,0,0,63,4,0,0,7,0,0,0,64,4,0,0,8,0,0,0,65,4,0,0,9,0,0,0,66,4,0,0,10,0,0,0,67,4,0,0,11,0,0,0,68,4,0,0,12,0,0,0,69,4,0,0,13,0,0,0,70,4,0,0,14,0,0,0,71,4,0,0,15,0,0,0,72,4,0,0,16,0,0,0,96,0,0,0,17,0,0,0,49,0,0,0,18,0,0,0,50,0,0,0,19,0,0,0,51,0,0,0,20,0,0,0,52,0,0,0,21,0,0,0,53,0,0,0,22,0,0,0,54,0,0,0,23,0,0,0,55,0,0,0,24,0,0,0,56,0,0,0,25,0,0,0,57,0,0,0,26,0,0,0,48,0,0,0,27,0,0,0,45,0,0,0,28,0,0,0,61,0,0,0,29,0,0,0,187,0,0,0,29,0,0,0,8,0,0,0,30,0,0,0,9,0,0,0,31,0,0,0,113,0,0,0,32,0,0,0,119,0,0,0,33,0,0,0,101,0,0,0,34,0,0,0,114,0,0,0,35,0,0,0,116,0,0,0,36,0,0,0,121,0,0,0,37,0,0,0,117,0,0,0,38,0,0,0,105,0,0,0,39,0,0,0,111,0,0,0,40,0,0,0,112,0,0,0,41,0,0,0,91,0,0,0,42,0,0,0,93,0,0,0,43,0,0,0,13,0,0,0,44,0,0,0,57,4,0,0,45,0,0,0,97,0,0,0,46,0,0,0,115,0,0,0,47,0,0,0,100,0,0,0,48,0,0,0,102,0,0,0,49,0,0,0,103,0,0,0,50,0,0,0,104,0,0,0,51,0,0,0,106,0,0,0,52,0,0,0,107,0,0,0,53,0,0,0,108,0,0,0,54,0,0,0,59,0,0,0,55,0,0,0,186,0,0,0,55,0,0,0,39,0,0,0,56,0,0,0,92,0,0,0,57,0,0,0,220,0,0,0,57,0,0,0,225,4,0,0,58,0,0,0,60,0,0,0,59,0,0,0,122,0,0,0,60,0,0,0,120,0,0,0,61,0,0,0,99,0,0,0,62,0,0,0,118,0,0,0,63,0,0,0,98,0,0,0,64,0,0,0,110,0,0,0,66,0,0,0,109,0,0,0,65,0,0,0,44,0,0,0,67,0,0,0,46,0,0,0,68,0,0,0,47,0,0,0,69,0,0,0,229,4,0,0,70,0,0,0,224,4,0,0,71,0,0,0,227,4,0,0,73,0,0,0,227,4,0,0,72,0,0,0,226,4,0,0,75,0,0,0,1,5,0,0,74,0,0,0,32,0,0,0,76,0,0,0,230,4,0,0,77,0,0,0,231,4,0,0,78,0,0,0,231,4,0,0,79,0,0,0,118,4,0,0,80,0,0,0,228,4,0,0,81,0,0,0,83,4,0,0,82,0,0,0,84,4,0,0,83,0,0,0,85,4,0,0,84,0,0,0,86,4,0,0,85,0,0,0,95,4,0,0,86,0,0,0,96,4,0,0,87,0,0,0,97,4,0,0,88,0,0,0,87,4,0,0,89,0,0,0,92,4,0,0,90,0,0,0,93,4,0,0,91,0,0,0,94,4,0,0,92,0,0,0,89,4,0,0,93,0,0,0,90,4,0,0,94,0,0,0,91,4,0,0,95,0,0,0,88,4,0,0,96,0,0,0,98,4,0,0,97,0,0,0,99,4,0,0,98,0,0,0,73,4,0,0,99,0,0,0,74,4,0,0,100,0,0,0,75,4,0,0,101,0,0,0,127,0,0,0,102,0,0,0,77,4,0,0,103,0,0,0,78,4,0,0,104,0,0,0,82,4,0,0,105,0,0,0,80,4,0,0,106,0,0,0,81,4,0,0,107,0,0,0,79,4,0,0,108,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,15,0,0,0,1,0,143,0,0,0,0,0,0,0,2,0,0,0,1,0,59,0,0,0,1,0,187,0,0,0,0,0,0,0,3,0,0,0,1,0,60,0,0,0,1,0,188,0,0,0,0,0,0,0,4,0,0,0,1,0,61,0,0,0,1,0,189,0,0,0,0,0,0,0,5,0,0,0,1,0,62,0,0,0,1,0,190,0,0,0,0,0,0,0,6,0,0,0,1,0,63,0,0,0,1,0,191,0,0,0,0,0,0,0,7,0,0,0,1,0,64,0,0,0,1,0,192,0,0,0,0,0,0,0,8,0,0,0,1,0,65,0,0,0,1,0,193,0,0,0,0,0,0,0,9,0,0,0,1,0,66,0,0,0,1,0,194,0,0,0,0,0,0,0,10,0,0,0,1,0,67,0,0,0,1,0,195,0,0,0,0,0,0,0,11,0,0,0,1,0,68,0,0,0,1,0,196,0,0,0,0,0,0,0,12,0,0,0,1,0,69,0,0,0,1,0,197,0,0,0,0,0,0,0,13,0,0,0,1,0,70,0,0,0,1,0,198,0,0,0,0,0,0,0,17,0,0,0,1,0,58,0,0,0,1,0,186,0,0,0,0,0,0,0,18,0,0,0,1,0,2,0,0,0,1,0,130,0,0,0,0,0,0,0,19,0,0,0,1,0,3,0,0,0,1,0,131,0,0,0,0,0,0,0,20,0,0,0,1,0,4,0,0,0,1,0,132,0,0,0,0,0,0,0,21,0,0,0,1,0,5,0,0,0,1,0,133,0,0,0,0,0,0,0,22,0,0,0,1,0,6,0,0,0,1,0,134,0,0,0,0,0,0,0,23,0,0,0,1,0,7,0,0,0,1,0,135,0,0,0,0,0,0,0,24,0,0,0,1,0,8,0,0,0,1,0,136,0,0,0,0,0,0,0,25,0,0,0,1,0,9,0,0,0,1,0,137,0,0,0,0,0,0,0,26,0,0,0,1,0,10,0,0,0,1,0,138,0,0,0,0,0,0,0,27,0,0,0,1,0,11,0,0,0,1,0,139,0,0,0,0,0,0,0,28,0,0,0,1,0,12,0,0,0,1,0,140,0,0,0,0,0,0,0,29,0,0,0,1,0,13,0,0,0,1,0,141,0,0,0,0,0,0,0,30,0,0,0,1,0,14,0,0,0,1,0,142,0,0,0,0,0,0,0,31,0,0,0,1,0,1,0,0,0,1,0,129,0,0,0,0,0,0,0,32,0,0,0,1,0,16,0,0,0,1,0,144,0,0,0,0,0,0,0,33,0,0,0,1,0,17,0,0,0,1,0,145,0,0,0,0,0,0,0,34,0,0,0,1,0,18,0,0,0,1,0,146,0,0,0,0,0,0,0,35,0,0,0,1,0,19,0,0,0,1,0,147,0,0,0,0,0,0,0,36,0,0,0,1,0,20,0,0,0,1,0,148,0,0,0,0,0,0,0,37,0,0,0,1,0,21,0,0,0,1,0,149,0,0,0,0,0,0,0,38,0,0,0,1,0,22,0,0,0,1,0,150,0,0,0,0,0,0,0,39,0,0,0,1,0,23,0,0,0,1,0,151,0,0,0,0,0,0,0,40,0,0,0,1,0,24,0,0,0,1,0,152,0,0,0,0,0,0,0,41,0,0,0,1,0,25,0,0,0,1,0,153,0,0,0,0,0,0,0,42,0,0,0,1,0,27,0,0,0,1,0,155,0,0,0,0,0,0,0,43,0,0,0,1,0,39,0,0,0,1,0,167,0,0,0,0,0,0,0,44,0,0,0,1,0,28,0,0,0,1,0,156,0,0,0,0,0,0,0,45,0,0,0,1,0,40,0,0,0,1,0,168,0,0,0,0,0,0,0,46,0,0,0,1,0,30,0,0,0,1,0,158,0,0,0,0,0,0,0,47,0,0,0,1,0,31,0,0,0,1,0,159,0,0,0,0,0,0,0,48,0,0,0,1,0,32,0,0,0,1,0,160,0,0,0,0,0,0,0,49,0,0,0,1,0,33,0,0,0,1,0,161,0,0,0,0,0,0,0,50,0,0,0,1,0,34,0,0,0,1,0,162,0,0,0,0,0,0,0,51,0,0,0,1,0,35,0,0,0,1,0,163,0,0,0,0,0,0,0,52,0,0,0,1,0,36,0,0,0,1,0,164,0,0,0,0,0,0,0,53,0,0,0,1,0,37,0,0,0,1,0,165,0,0,0,0,0,0,0,54,0,0,0,1,0,38,0,0,0,1,0,166,0,0,0,0,0,0,0,55,0,0,0,1,0,26,0,0,0,1,0,154,0,0,0,0,0,0,0,56,0,0,0,1,0,43,0,0,0,1,0,171,0,0,0,0,0,0,0,57,0,0,0,1,0,41,0,0,0,1,0,169,0,0,0,0,0,0,0,58,0,0,0,1,0,42,0,0,0,1,0,170,0,0,0,0,0,0,0,59,0,0,0,1,0,56,0,0,0,1,0,184,0,0,0,0,0,0,0,60,0,0,0,1,0,44,0,0,0,1,0,172,0,0,0,0,0,0,0,61,0,0,0,1,0,45,0,0,0,1,0,173,0,0,0,0,0,0,0,62,0,0,0,1,0,46,0,0,0,1,0,174,0,0,0,0,0,0,0,63,0,0,0,1,0,47,0,0,0,1,0,175,0,0,0,0,0,0,0,64,0,0,0,1,0,48,0,0,0,1,0,176,0,0,0,0,0,0,0,66,0,0,0,1,0,49,0,0,0,1,0,177,0,0,0,0,0,0,0,65,0,0,0,1,0,50,0,0,0,1,0,178,0,0,0,0,0,0,0,67,0,0,0,1,0,51,0,0,0,1,0,179,0,0,0,0,0,0,0,68,0,0,0,1,0,52,0,0,0,1,0,180,0,0,0,0,0,0,0,69,0,0,0,1,0,53,0,0,0,1,0,181,0,0,0,0,0,0,0,70,0,0,0,1,0,54,0,0,0,1,0,182,0,0,0,0,0,0,0,71,0,0,0,1,0,29,0,0,0,1,0,157,0,0,0,0,0,0,0,75,0,0,0,1,0,55,0,0,0,1,0,183,0,0,0,0,0,0,0,76,0,0,0,1,0,57,0,0,0,1,0,185,0,0,0,0,0,0,0,81,0,0,0,1,0,29,0,0,0,1,0,157,0,0,0,0,0,0,0,85,0,0,0,1,0,86,0,0,0,1,0,214,0,0,0,0,0,0,0,86,0,0,0,1,0,83,0,0,0,1,0,211,0,0,0,0,0,0,0,87,0,0,0,1,0,84,0,0,0,1,0,212,0,0,0,0,0,0,0,88,0,0,0,1,0,85,0,0,0,1,0,213,0,0,0,0,0,0,0,89,0,0,0,1,0,87,0,0,0,1,0,215,0,0,0,0,0,0,0,90,0,0,0,1,0,88,0,0,0,1,0,216,0,0,0,0,0,0,0,91,0,0,0,1,0,89,0,0,0,1,0,217,0,0,0,0,0,0,0,92,0,0,0,1,0,90,0,0,0,1,0,218,0,0,0,0,0,0,0,93,0,0,0,1,0,93,0,0,0,1,0,221,0,0,0,0,0,0,0,94,0,0,0,1,0,94,0,0,0,1,0,222,0,0,0,0,0,0,0,95,0,0,0,1,0,95,0,0,0,1,0,223,0,0,0,0,0,0,0,96,0,0,0,1,0,96,0,0,0,1,0,224,0,0,0,0,0,0,0,97,0,0,0,1,0,97,0,0,0,1,0,225,0,0,0,0,0,0,0,98,0,0,0,1,0,98,0,0,0,1,0,226,0,0,0,0,0,0,0,99,0,0,0,1,0,71,0,0,0,1,0,199,0,0,0,0,0,0,0,100,0,0,0,1,0,81,0,0,0,1,0,209,0,0,0,0,0,0,0,102,0,0,0,1,0,82,0,0,0,1,0,210,0,0,0,0,0,0,0,105,0,0,0,1,0,79,0,0,0,1,0,207,0,0,0,0,0,0,0,106,0,0,0,1,0,77,0,0,0,1,0,205,0,0,0,0,0,0,0,107,0,0,0,1,0,80,0,0,0,1,0,208,0,0,0,0,0,0,0,108,0,0,0,1,0,78,0,0,0,1,0,206,0,0,0,0,0,0,0,83,0,0,0,1,0,92,0,0,0,2,0,220,0,0,0,0,0,0,0,84,0,0,0,1,0,91,0,0,0,1,0,91,0,0,0,0,0,0,0,101,0,0,0,1,0,72,0,0,0,1,0,200,0,0,0,0,0,0,0,104,0,0,0,1,0,73,0,0,0,1,0,201,0,0,0,0,0,0,0,103,0,0,0,1,0,74,0,0,0,1,0,202,0,0,0,0,0,0,0,82,0,0,0,1,0,75,0,0,0,1,0,203,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,0,0,0,178,0,0,0,184,0,0,0,182,0,0,0,188,0,0,0,186,0,0,0,190,0,0,0,30,0,0,0,168,0,0,0,30,0,0,0,164,0,0,0,166,0,0,0,174,0,0,0,176,0,0,0,170,0,0,0,172,0,0,0,136,0,0,0,30,0,0,0,140,0,0,0,138,0,0,0,144,0,0,0,142,0,0,0,148,0,0,0,146,0,0,0,184,2,0,0,186,2,0,0,188,2,0,0,190,2,0,0,176,2,0,0,178,2,0,0,180,2,0,0,182,2,0,0,196,2,0,0,198,2,0,0,192,2,0,0,194,2,0,0,204,2,0,0,206,2,0,0,200,2,0,0,202,2,0,0,28,3,0,0,26,3,0,0,32,3,0,0,30,3,0,0,36,3,0,0,34,3,0,0,40,3,0,0,38,3,0,0,108,4,0,0,106,4,0,0,48,2,0,0,42,2,0,0,116,4,0,0,114,4,0,0,62,2,0,0,110,4,0,0,124,4,0,0,86,2,0,0,66,4,0,0,64,4,0,0,62,4,0,0,74,4,0,0,72,4,0,0,70,4,0,0,250,2,0,0,252,2,0,0,254,2,0,0,0,3,0,0,242,2,0,0,244,2,0,0,246,2,0,0,248,2,0,0,10,3,0,0,12,3,0,0,48,3,0,0,50,3,0,0,52,3,0,0,42,3,0,0,44,3,0,0,46,3,0,0,186,1,0,0,184,1,0,0,190,1,0,0,188,1,0,0,194,1,0,0,192,1,0,0,198,1,0,0,196,1,0,0,178,1,0,0,176,1,0,0,146,1,0,0,150,1,0,0,148,1,0,0,154,1,0,0,152,1,0,0,156,1,0,0,60,2,0,0,66,2,0,0,66,0,0,0,68,0,0,0,78,0,0,0,84,2,0,0,74,0,0,0,76,0,0,0,58,0,0,0,60,0,0,0,112,0,0,0,106,0,0,0,108,0,0,0,118,0,0,0,134,3,0,0,114,0,0,0,6,4,0,0,6,4,0,0,6,4,0,0,6,4,0,0,6,4,0,0,6,4,0,0,6,4,0,0,6,4,0,0,250,3,0,0,250,3,0,0,250,3,0,0,250,3,0,0,250,3,0,0,250,3,0,0,250,3,0,0,250,3,0,0,144,1,0,0,144,1,0,0,144,1,0,0,144,1,0,0,144,1,0,0,144,1,0,0,144,1,0,0,144,1,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,104,2,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,78,1,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,30,0,0,0,162,4,0,0,164,4,0,0,158,4,0,0,160,4,0,0,154,4,0,0,156,4,0,0,150,4,0,0,152,4,0,0,168,4,0,0,170,4,0,0,194,4,0,0,190,4,0,0,192,4,0,0,186,4,0,0,188,4,0,0,184,4,0,0,204,0,0,0,202,0,0,0,204,0,0,0,200,0,0,0,212,0,0,0,210,0,0,0,208,0,0,0,206,0,0,0,196,0,0,0,194,0,0,0,154,0,0,0,152,0,0,0,150,0,0,0,160,0,0,0,158,0,0,0,156,0,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,128,1,0,0,68,4,0,0,104,1,0,0,128,4,0,0,130,4,0,0,132,4,0,0,118,4,0,0,120,4,0,0,126,2,0,0,6,1,0,0,8,1,0,0,10,1,0,0,12,1,0,0,254,0,0,0,0,1,0,0,2,1,0,0,4,1,0,0,14,1,0,0,16,1,0,0,66,1,0,0,68,1,0,0,70,1,0,0,60,1,0,0,62,1,0,0,64,1,0,0,78,2,0,0,72,2,0,0,24,3,0,0,122,4,0,0,112,2,0,0,126,4,0,0,122,2,0,0,116,2,0,0,104,4,0,0,102,4,0,0,76,4,0,0,80,4,0,0,78,4,0,0,84,4,0,0,82,4,0,0,86,4,0,0,30,0,0,0,30,0,0,0,2,3,0,0,4,3,0,0,14,3,0,0,16,3,0,0,26,4,0,0,30,4,0,0,30,0,0,0,30,0,0,0,58,3,0,0,54,3,0,0,56,3,0,0,62,3,0,0,64,3,0,0,60,3,0,0,174,1,0,0,172,1,0,0,170,1,0,0,168,1,0,0,166,1,0,0,164,1,0,0,30,0,0,0,162,1,0,0,160,1,0,0,160,1,0,0,160,1,0,0,160,1,0,0,160,1,0,0,160,1,0,0,160,1,0,0,160,1,0,0,34,0,0,0,36,0,0,0,38,0,0,0,40,0,0,0,42,0,0,0,44,0,0,0,46,0,0,0,48,0,0,0,50,0,0,0,52,0,0,0,84,0,0,0,86,0,0,0,88,0,0,0,90,0,0,0,92,0,0,0,94,0,0,0,136,3,0,0,30,0,0,0,154,3,0,0,202,3,0,0,118,3,0,0,114,3,0,0,132,3,0,0,126,3,0,0,232,3,0,0,230,3,0,0,80,2,0,0,106,2,0,0,150,3,0,0,140,3,0,0,64,2,0,0,74,2,0,0,212,3,0,0,210,3,0,0,216,3,0,0,214,3,0,0,220,3,0,0,218,3,0,0,224,3,0,0,222,3,0,0,228,3,0,0,226,3,0,0,138,3,0,0,144,3,0,0,142,3,0,0,148,3,0,0,146,3,0,0,152,3,0,0,242,1,0,0,244,1,0,0,232,1,0,0,236,1,0,0,250,1,0,0,58,2,0,0,246,1,0,0,248,1,0,0,54,0,0,0,54,0,0,0,54,0,0,0,54,0,0,0,54,0,0,0,54,0,0,0,54,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,170,170,170,0,170,170,170,0,170,170,170,0,170,170,170,0,85,85,85,0,85,85,85,0,85,85,85,0,85,85,85,0,255,255,255,0,255,255,255,0,255,255,255,0,255,255,255,0,0,0,0,0,0,0,170,0,0,170,0,0,0,170,170,0,170,0,0,0,170,0,170,0,170,170,0,0,170,170,170,0,85,85,85,0,85,85,255,0,85,255,85,0,85,255,255,0,255,85,85,0,255,85,255,0,255,255,85,0,255,255,255,0,8,74,0,0,104,0,0,0,184,66,0,0,104,0,0,0,40,61,0,0,2,2,0,0,0,0,0,0,0,0,0,0,240,38,0,0,16,4,0,0,96,77,0,0,20,4,0,0,64,68,0,0,120,3,0,0,24,62,0,0,120,3,0,0,0,56,0,0,18,4,0,0,192,51,0,0,242,0,0,0,0,0,0,0,0,0,0,0,88,49,0,0,224,45,0,0,152,42,0,0,24,39,0,0,64,100,0,0,232,95,0,0,24,92,0,0,88,89,0,0,216,86,0,0,208,84,0,0,0,83,0,0,120,79,0,0,120,78,0,0,104,77,0,0,88,76,0,0,120,73,0,0,96,2,0,0,98,2,0,0,100,2,0,0,102,2,0,0,88,2,0,0,90,2,0,0,92,2,0,0,94,2,0,0,108,2,0,0,110,2,0,0,142,2,0,0,144,2,0,0,146,2,0,0,136,2,0,0,138,2,0,0,140,2,0,0,86,1,0,0,84,1,0,0,82,1,0,0,80,1,0,0,224,1,0,0,76,1,0,0,74,1,0,0,72,1,0,0,94,1,0,0,92,1,0,0,42,1,0,0,40,1,0,0,38,1,0,0,36,1,0,0,34,1,0,0,32,1,0,0,76,2,0,0,80,0,0,0,68,2,0,0,70,2,0,0,70,0,0,0,72,0,0,0,52,2,0,0,56,2,0,0,62,0,0,0,64,0,0,0,120,0,0,0,122,3,0,0,116,0,0,0,110,0,0,0,116,3,0,0,94,3,0,0,238,3,0,0,236,3,0,0,242,3,0,0,240,3,0,0,246,3,0,0,244,3,0,0,0,4,0,0,248,3,0,0,254,3,0,0,252,3,0,0,178,3,0,0,182,3,0,0,180,3,0,0,186,3,0,0,184,3,0,0,188,3,0,0,22,3,0,0,22,3,0,0,22,3,0,0,22,3,0,0,22,3,0,0,22,3,0,0,22,3,0,0,22,3,0,0,18,3,0,0,18,3,0,0,18,3,0,0,18,3,0,0,18,3,0,0,18,3,0,0,18,3,0,0,18,3,0,0,22,2,0,0,22,2,0,0,22,2,0,0,22,2,0,0,22,2,0,0,22,2,0,0,22,2,0,0,22,2,0,0,180,1,0,0,180,1,0,0,180,1,0,0,180,1,0,0,180,1,0,0,180,1,0,0,180,1,0,0,180,1,0,0,20,1,0,0,22,1,0,0,18,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,24,1,0,0,136,1,0,0,26,1,0,0,136,1,0,0,50,1,0,0,136,1,0,0,48,1,0,0,54,1,0,0,56,1,0,0,52,1,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,112,4,0,0,170,3,0,0,172,3,0,0,170,3,0,0,174,3,0,0,162,3,0,0,164,3,0,0,166,3,0,0,168,3,0,0,158,3,0,0,160,3,0,0,204,3,0,0,206,3,0,0,208,3,0,0,196,3,0,0,198,3,0,0,200,3,0,0,38,2,0,0,36,2,0,0,36,2,0,0,36,2,0,0,36,2,0,0,36,2,0,0,36,2,0,0,36,2,0,0,30,2,0,0,28,2,0,0,6,2,0,0,4,2,0,0,42,4,0,0,0,2,0,0,254,1,0,0,252,1,0,0,224,2,0,0,222,2,0,0,220,2,0,0,234,2,0,0,216,2,0,0,214,2,0,0,212,2,0,0,210,2,0,0,228,2,0,0,226,2,0,0,214,1,0,0,208,1,0,0,204,1,0,0,156,2,0,0,202,1,0,0,152,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,14,2,0,0,12,2,0,0,12,2,0,0,12,2,0,0,12,2,0,0,12,2,0,0,12,2,0,0,12,2,0,0,12,2,0,0,216,0,0,0,214,0,0,0,220,0,0,0,218,0,0,0,224,0,0,0,222,0,0,0,228,0,0,0,226,0,0,0,232,0,0,0,230,0,0,0,122,0,0,0,128,0,0,0,126,0,0,0,132,0,0,0,130,0,0,0,134,0,0,0,2,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,10,0,0,0,136,1,0,0,136,1,0,0,12,0,0,0,136,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,136,1,0,0,104,3,0,0,104,3,0,0,104,3,0,0,104,3,0,0,112,3,0,0,110,3,0,0,108,3,0,0,106,3,0,0,98,3,0,0,96,3,0,0,74,3,0,0,72,3,0,0,134,2,0,0,80,3,0,0,78,3,0,0,76,3,0,0,154,2,0,0,136,1,0,0,150,2,0,0,200,1,0,0,162,2,0,0,164,2,0,0,158,2,0,0,160,2,0,0,166,2,0,0,166,2,0,0,166,2,0,0,166,2,0,0,166,2,0,0,166,2,0,0,238,2,0,0,218,2,0,0,0,0,5,0,80,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,80,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,178,5,0,81,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,196,5,0,82,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,214,5,0,83,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,64,6,0,80,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,84,6,0,81,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,104,6,0,82,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,124,6,0,83,0,0,0,1,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,224,6,0,80,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,246,6,0,81,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,12,7,0,82,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,34,7,0,83,0,0,0,1,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,100,11,0,81,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,136,11,0,82,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,172,11,0,83,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,168,12,0,81,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,208,12,0,82,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,248,12,0,83,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,13,0,80,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,236,13,0,81,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,24,14,0,82,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,68,14,0,83,0,0,0,2,0,0,0,11,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,2,0,40,0,0,0,1,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,208,2,0,40,0,0,0,1,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,5,0,40,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,160,5,0,40,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,0,10,0,80,0,0,0,2,0,0,0,8,0,0,0,0,2,0,0,2,0,0,0,0,64,11,0,80,0,0,0,2,0,0,0,9,0,0,0,0,2,0,0,2,0,0,0,0,128,12,0,80,0,0,0,2,0,0,0,10,0,0,0,0,2,0,0,2,0,0,0,0,192,18,0,80,0,0,0,2,0,0,0,15,0,0,0,0,2,0,0,2,128,0,0,0,128,22,0,80,0,0,0,2,0,0,0,18,0,0,0,0,2,0,0,2,128,0,0,0,0,45,0,80,0,0,0,2,0,0,0,36,0,0,0,0,2,0,0,2,128,0,0,0,64,19,0,77,0,0,0,2,0,0,0,8,0,0,0,0,4,0,0,2,128,0,0,0,233,3,0,77,0,0,0,1,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,210,7,0,77,0,0,0,2,0,0,0,26,0,0,0,128,0,0,0,1,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,98,0,0,48,97,0,0,144,96,0,0,80,96,0,0,224,124,0,0,0,85,0,0,24,83,0,0,136,79,0,0,128,78,0,0,0,0,0,0,144,69,0,0,224,68,0,0,80,68,0,0,208,67,0,0,120,66,0,0,136,65,0,0,8,65,0,0,184,64,0,0,40,64,0,0,192,63,0,0,64,63,0,0,168,70,0,0,184,62,0,0,40,70,0,0,208,71,0,0,72,71,0,0,40,62,0,0,184,61,0,0,200,60,0,0,152,59,0,0,8,59,0,0,128,58,0,0,0,0,0,0,136,77,0,0,0,0,0,0,96,76,0,0,0,0,0,0,240,73,0,0,0,0,0,0,112,72,0,0,0,0,0,0,208,71,0,0,0,0,0,0,72,71,0,0,2,0,0,0,0,0,0,0,0,0,0,0,168,70,0,0,1,0,0,0,136,77,0,0,1,0,0,0,96,76,0,0,1,0,0,0,240,73,0,0,1,0,0,0,112,72,0,0,1,0,0,0,208,71,0,0,1,0,0,0,72,71,0,0,1,0,0,0,40,70,0,0,1,0,0,0,168,70,0,0,2,0,0,0,136,77,0,0,2,0,0,0,96,76,0,0,2,0,0,0,240,73,0,0,2,0,0,0,112,72,0,0,2,0,0,0,208,71,0,0,2,0,0,0,72,71,0,0,2,0,0,0,40,70,0,0,2,0,0,0,168,70,0,0,144,49,0,0,96,49,0,0,32,49,0,0,240,48,0,0,48,48,0,0,120,47,0,0,192,46,0,0,136,46,0,0,48,46,0,0,232,45,0,0,160,45,0,0,72,45,0,0,32,95,0,0,232,94,0,0,80,94,0,0,136,93,0,0,0,93,0,0,168,92,0,0,120,92,0,0,32,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,0,0,216,91,0,0,168,91,0,0,96,91,0,0,64,91,0,0,8,91,0,0,88,90,0,0,224,89,0,0,128,89,0,0,96,89,0,0,16,89,0,0,240,88,0,0,208,88,0,0,176,88,0,0,136,88,0,0,80,88,0,0,102,105,108,101,0,0,0,0,77,79,86,83,87,0,0,0,83,116,97,114,116,82,105,103,104,116,0,0,0,0,0,0,32,32,66,61,79,91,37,48,50,88,93,0,0,0,0,0,67,77,80,83,66,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,67,82,67,32,69,82,82,79,82,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,83,117,112,101,114,82,105,103,104,116,0,0,0,0,0,0,32,32,66,61,73,91,37,48,50,88,93,0,0,0,0,0,77,101,116,97,82,105,103,104,116,0,0,0,0,0,0,0,32,32,65,61,79,91,37,48,50,88,93,0,0,0,0,0,67,77,80,83,87,0,0,0,109,111,117,115,101,0,0,0,65,108,116,82,105,103,104,116,0,0,0,0,0,0,0,0,32,32,65,61,73,91,37,48,50,88,93,0,0,0,0,0,98,108,0,0,0,0,0,0,83,84,79,83,66,0,0,0,112,114,111,116,111,99,111,108,0,0,0,0,0,0,0,0,83,112,97,99,101,0,0,0,77,79,68,61,37,48,50,88,32,32,77,79,68,65,61,37,117,32,32,77,79,68,66,61,37,117,0,0,0,0,0,0,114,98,0,0,0,0,0,0,83,84,79,83,87,0,0,0,65,108,116,0,0,0,0,0,91,37,115,37,48,52,88,93,0,0,0,0,0,0,0,0,56,50,53,53,45,80,80,73,0,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,76,79,68,83,66,0,0,0,65,108,116,76,101,102,116,0,37,99,67,37,100,58,32,67,84,76,61,37,48,52,88,32,67,78,84,61,37,48,52,88,32,77,65,88,65,61,37,48,52,88,32,77,65,88,66,61,37,48,52,88,10,0,0,0,114,98,0,0,0,0,0,0,80,65,82,80,79,82,84,49,58,0,0,0,0,0,0,0,76,79,68,83,87,0,0,0,101,109,117,46,112,97,114,112], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([111,114,116,49,46,100,114,105,118,101,114,0,0,0,0,0,77,111,100,101,0,0,0,0,114,98,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,56,48,49,56,54,45,84,67,85,0,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,58,32,115,101,103,109,101,110,116,97,116,105,111,110,32,102,97,117,108,116,10,0,0,70,57,0,0,0,0,0,0,33,61,0,0,0,0,0,0,123,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,98,105,110,0,0,0,0,0,109,111,117,115,101,95,109,117,108,95,120,0,0,0,0,0,97,100,100,114,61,48,120,37,48,56,108,120,32,115,105,122,101,61,37,108,117,32,102,105,108,101,61,37,115,10,0,0,83,67,65,83,66,0,0,0,104,0,0,0,0,0,0,0,45,45,37,115,0,0,0,0,101,120,112,101,99,116,105,110,103,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,68,79,83,69,77,85,0,0,116,100,48,58,32,100,114,111,112,112,105,110,103,32,112,104,97,110,116,111,109,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,10,0,0,87,105,110,100,111,119,115,76,101,102,116,0,0,0,0,0,82,101,108,101,97,115,101,32,51,46,48,55,36,48,0,0,46,114,97,119,0,0,0,0,67,80,73,61,37,46,52,102,10,0,0,0,0,0,0,0,83,67,65,83,87,0,0,0,83,116,97,114,116,76,101,102,116,0,0,0,0,0,0,0,79,80,83,61,37,108,108,117,10,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,82,69,84,78,0,0,0,0,83,117,112,101,114,76,101,102,116,0,0,0,0,0,0,0,67,76,75,61,37,108,108,117,32,43,32,37,108,117,10,0,99,111,109,109,105,116,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,76,79,83,84,32,68,65,84,65,10,0,77,101,116,97,0,0,0,0,84,73,77,69,0,0,0,0,77,101,116,97,76,101,102,116,0,0,0,0,0,0,0,0,67,85,82,83,79,82,32,37,117,58,32,88,61,37,48,50,88,32,89,61,37,48,50,88,32,79,69,61,37,100,32,82,86,86,61,37,100,32,66,69,61,37,100,32,70,82,69,81,61,37,117,32,68,85,84,89,61,37,117,32,83,84,65,82,84,61,37,48,50,88,32,83,84,79,80,61,37,48,50,88,10,0,0,0,0,0,0,0,66,76,75,32,37,48,52,88,58,32,65,49,61,37,48,56,108,88,32,65,50,61,37,48,56,108,88,32,83,61,37,48,56,108,88,32,82,79,61,37,100,10,0,0,0,0,0,0,67,116,114,108,0,0,0,0,9,102,114,97,109,101,32,105,110,116,32,99,111,117,110,116,58,32,37,117,10,0,0,0,100,108,0,0,0,0,0,0,69,78,84,69,82,0,0,0,67,116,114,108,76,101,102,116,0,0,0,0,0,0,0,0,9,108,105,110,101,115,32,112,101,114,32,114,111,119,58,32,32,32,37,117,10,0,0,0,76,69,65,86,69,0,0,0,47,0,0,0,0,0,0,0,66,89,84,69,32,0,0,0,9,118,32,102,105,101,108,100,32,115,116,111,112,58,32,32,32,32,37,117,10,0,0,0,82,69,84,70,0,0,0,0,83,108,97,115,104,0,0,0,9,118,32,102,105,101,108,100,32,115,116,97,114,116,58,32,32,32,37,117,10,0,0,0,112,97,114,112,111,114,116,50,0,0,0,0,0,0,0,0,73,78,84,51,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,115,100,108,58,32,98,108,105,116,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,9,102,114,97,109,101,32,108,101,110,103,116,104,58,32,32,32,32,37,117,10,0,0,0,105,110,116,118,0,0,0,0,70,56,0,0,0,0,0,0,61,61,0,0,0,0,0,0,115,101,99,116,105,111,110,0,102,0,0,0,0,0,0,0,115,114,101,99,0,0,0,0,115,99,97,108,101,0,0,0,82,65,77,58,0,0,0,0,87,68,49,55,57,88,58,32,67,77,68,91,37,48,50,88,93,32,83,75,73,80,32,67,79,77,77,65,78,68,32,40,37,48,50,88,47,37,48,50,88,41,10,0,0,0,0,0,99,0,0,0,0,0,0,0,32,32,0,0,0,0,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,37,48,50,88,32,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,0,80,101,114,105,111,100,0,0,82,101,108,101,97,115,101,32,51,46,48,50,36,48,0,0,46,112,115,105,0,0,0,0,9,104,32,102,105,101,108,100,32,115,116,111,112,58,32,32,32,32,37,117,10,0,0,0,73,78,84,79,0,0,0,0,44,0,0,0,0,0,0,0,9,104,32,102,105,101,108,100,32,115,116,97,114,116,58,32,32,32,37,117,10,0,0,0,104,109,0,0,0,0,0,0,108,111,103,0,0,0,0,0,73,82,69,84,0,0,0,0,67,111,109,109,97,0,0,0,99,111,112,121,32,109,101,109,111,114,121,0,0,0,0,0,9,108,105,110,101,32,108,101,110,103,116,104,58,32,32,32,32,32,37,117,10,0,0,0,87,68,49,55,57,88,58,32,87,82,73,84,69,32,76,79,83,84,32,68,65,84,65,10,0,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,115,114,99,32,100,115,116,32,99,110,116,0,0,0,0,0,77,111,100,101,58,10,0,0,83,65,82,0,0,0,0,0,101,56,50,53,57,58,32,73,78,84,65,32,119,105,116,104,111,117,116,32,73,82,81,10,0,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,101,118,97,108,117,97,116,101,32,101,120,112,114,101,115,115,105,111,110,115,0,0,0,0,70,65,84,84,82,58,32,37,48,52,88,10,0,0,0,0,63,63,63,0,0,0,0,0,98,0,0,0,0,0,0,0,91,101,120,112,114,46,46,46,93,0,0,0,0,0,0,0,65,76,70,58,32,32,32,37,45,52,100,32,32,76,83,83,87,58,32,37,45,52,100,10,0,0,0,0,0,0,0,0,99,108,0,0,0,0,0,0,83,72,82,0,0,0,0,0,118,0,0,0,0,0,0,0,119,114,105,116,101,32,109,101,109,111,114,121,32,116,111,32,97,32,102,105,108,101,0,0,83,84,65,84,58,32,32,37,48,52,88,32,32,73,77,83,75,58,32,37,48,52,88,10,0,0,0,0,0,0,0,0,83,72,76,0,0,0,0,0,99,0,0,0,0,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,110,46,46,46,93,0,0,0,0,0,87,79,82,68,32,0,0,0,71,82,65,80,72,58,32,37,45,52,100,32,32,77,79,78,79,58,32,37,100,32,32,83,73,78,84,58,32,37,45,52,100,10,0,0,0,0,0,0,82,67,82,0,0,0,0,0,120,0,0,0,0,0,0,0,113,117,105,116,0,0,0,0,67,66,80,58,32,32,32,37,48,56,108,88,10,0,0,0,112,97,114,112,111,114,116,49,0,0,0,0,0,0,0,0,82,67,76,0,0,0,0,0,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,0,122,0,0,0,0,0,0,0,115,101,110,100,32,97,32,109,101,115,115,97,103,101,32,116,111,32,116,104,101,32,101,109,117,108,97,116,111,114,32,99,111,114,101,0,0,0,0,0,115,100,108,58,32,107,101,121,32,61,32,48,120,37,48,52,120,10,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,56,50,55,51,48,45,67,82,84,67,0,0,0,0,0,0,70,55,0,0,0,0,0,0,38,0,0,0,0,0,0,0,34,37,115,34,0,0,0,0,101,0,0,0,0,0,0,0,105,104,120,0,0,0,0,0,109,105,110,95,104,0,0,0,100,101,102,97,117,108,116,0,82,79,82,0,0,0,0,0,111,102,102,115,101,116,0,0,44,32,0,0,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,58,0,0,0,0,0,0,0,116,100,48,58,32,115,101,99,116,111,114,32,99,114,99,32,111,118,101,114,32,104,101,97,100,101,114,43,100,97,116,97,10,0,0,0,0,0,0,0,60,0,0,0,0,0,0,0,109,115,103,32,91,118,97,108,93,0,0,0,0,0,0,0,99,112,50,58,32,119,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,67,80,50,32,118,101,114,115,105,111,110,10,0,0,0,0,0,0,46,112,102,100,99,0,0,0,117,110,107,110,111,119,110,32,99,111,109,112,111,110,101,110,116,32,40,37,115,41,10,0,82,79,76,0,0,0,0,0,76,101,115,115,0,0,0,0,114,101,97,100,32,97,32,102,105,108,101,32,105,110,116,111,32,109,101,109,111,114,121,0,118,105,100,101,111,0,0,0,103,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,121,100,105,118,0,0,0,0,83,104,105,102,116,0,0,0,110,97,109,101,32,91,102,109,116,93,32,91,97,32,91,110,93,93,0,0,0,0,0,0,116,105,109,101,0,0,0,0,88,76,65,84,0,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,65,68,68,82,69,83,83,32,76,79,83,84,32,68,65,84,65,10,0,83,104,105,102,116,76,101,102,116,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,0,0,0,0,0,0,116,99,117,0,0,0,0,0,74,67,88,90,0,0,0,0,92,0,0,0,0,0,0,0,102,105,110,100,32,98,121,116,101,115,32,105,110,32,109,101,109,111,114,121,0,0,0,0,112,112,105,0,0,0,0,0,76,79,79,80,0,0,0,0,66,97,99,107,115,108,97,115,104,0,0,0,0,0,0,0,97,100,100,114,32,99,110,116,32,91,118,97,108,46,46,46,93,0,0,0,0,0,0,0,112,105,99,0,0,0,0,0,97,108,0,0,0,0,0,0,76,79,79,80,90,0,0,0,39,0,0,0,0,0,0,0,101,110,116,101,114,32,98,121,116,101,115,32,105,110,116,111,32,109,101,109,111,114,121,0,112,111,114,116,115,0,0,0,76,79,79,80,78,90,0,0,65,112,111,115,116,114,111,112,104,101,0,0,0,0,0,0,97,100,100,114,32,91,118,97,108,124,115,116,114,105,110,103,46,46,46,93,0,0,0,0,80,85,83,72,0,0,0,0,109,101,109,0,0,0,0,0,74,77,80,78,0,0,0,0,81,117,111,116,101,0,0,0,100,117,109,112,32,109,101,109,111,114,121,0,0,0,0,0,105,99,117,0,0,0,0,0,112,97,114,112,111,114,116,0,37,48,52,88,58,37,48,52,88,0,0,0,0,0,0,0,101,109,117,46,100,105,115,107,46,101,106,101,99,116,0,0,59,0,0,0,0,0,0,0,91,97,100,100,114,32,91,99,110,116,93,93,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,102,100,99,0,0,0,0,0,70,54,0,0,0,0,0,0,114,99,55,53,57,0,0,0,94,0,0,0,0,0,0,0,48,120,37,108,120,0,0,0,60,110,108,62,0,0,0,0,100,0,0,0,0,0,0,0,105,104,101,120,0,0,0,0,109,105,110,95,119,0,0,0,115,105,122,101,0,0,0,0,74,77,80,83,0,0,0,0,97,117,116,111,0,0,0,0,32,32,45,37,99,0,0,0,115,116,114,105,110,103,32,116,111,111,32,108,111,110,103,0,101,120,112,101,99,116,105,110,103,32,97,100,100,114,101,115,115,0,0,0,0,0,0,0,116,100,48,58,32,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,40,37,117,47,37,117,47,37,117,32,37,117,41,10,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,100,97,116,97,41,10,0,0,83,101,109,105,99,111,108,111,110,0,0,0,0,0,0,0,115,101,116,32,97,110,32,101,120,112,114,101,115,115,105,111,110,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,99,112,50,58,32,110,111,116,32,97,32,67,80,50,32,102,105,108,101,10,0,0,0,0,46,109,115,97,0,0,0,0,100,109,97,0,0,0,0,0,73,78,0,0,0,0,0,0,108,0,0,0,0,0,0,0,101,120,112,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,99,112,117,0,0,0,0,0,99,0,0,0,0,0,0,0,115,116,100,105,111,0,0,0,121,109,117,108,0,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,97,105,108,101,100,10,0,0,0,107,0,0,0,0,0,0,0,98,115,120,0,0,0,0,0,114,99,55,53,57,0,0,0,76,79,67,75,32,0,0,0,87,68,49,55,57,88,58,32,82,69,65,68,32,84,82,65,67,75,32,76,79,83,84,32,68,65,84,65,10,0,0,0,106,0,0,0,0,0,0,0,115,101,116,32,97,110,32,97,100,100,114,101,115,115,32,98,114,101,97,107,112,111,105,110,116,32,91,112,97,115,115,61,49,32,114,101,115,101,116,61,48,93,0,0,0,0,0,0,37,115,44,32,37,115,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,100,105,115,107,41,10,0,0,0,0,0,104,0,0,0,0,0,0,0,97,100,100,114,32,91,112,97,115,115,32,91,114,101,115,101,116,93,93,0,0,0,0,0,82,69,80,78,69,32,0,0,82,69,80,32,0,0,0,0,109,111,100,101,108,61,114,99,55,53,57,32,99,108,111,99,107,61,37,108,117,32,97,108,116,95,109,101,109,95,115,105,122,101,61,37,100,10,0,0,103,0,0,0,0,0,0,0,98,115,0,0,0,0,0,0,32,37,48,52,88,0,0,0,100,115,0,0,0,0,0,0,83,89,83,84,69,77,58,0,102,0,0,0,0,0,0,0,108,105,115,116,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,0,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,112,114,105,41,10,0,0,0,0,105,112,0,0,0,0,0,0,66,79,85,78,68,32,69,65,32,105,115,32,114,101,103,105,115,116,101,114,10,0,0,0,99,108,111,99,107,0,0,0,100,0,0,0,0,0,0,0,98,108,0,0,0,0,0,0,74,77,80,70,0,0,0,0,32,37,48,50,88,0,0,0,37,48,50,88,0,0,0,0,97,108,116,95,109,101,109,95,115,105,122,101,0,0,0,0,115,0,0,0,0,0,0,0,99,108,101,97,114,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,114,32,97,108,108,0,0,0,0,0,0,0,37,48,50,88,0,0,0,0,115,121,115,116,101,109,0,0,37,48,52,88,0,0,0,0,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,0,103,101,116,32,112,111,114,116,32,56,32,37,48,52,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,91,105,110,100,101,120,93,0,49,0,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,37,48,52,88,58,37,48,52,88,32,32,37,115,10,0,0,70,53,0,0,0,0,0,0,114,111,109,115,47,112,99,101,45,99,111,110,102,105,103,46,99,102,103,0,0,0,0,0,94,94,0,0,0,0,0,0,37,115,32,61,32,0,0,0,60,101,111,102,62,0,0,0,115,97,118,101,0,0,0,0,97,117,116,111,0,0,0,0,97,115,112,101,99,116,95,121,0,0,0,0,0,0,0,0,115,105,122,101,107,0,0,0,73,68,73,86,0,0,0,0,116,121,112,101,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,45,37,99,41,10,0,0,0,0,0,0,105,100,101,110,116,105,102,105,101,114,32,116,111,111,32,108,111,110,103,0,0,0,0,0,120,0,0,0,0,0,0,0,110,111,0,0,0,0,0,0,103,101,116,32,112,111,114,116,32,49,54,32,37,48,52,108,88,32,45,62,32,37,48,50,88,10,0,0,0,0,0,0,116,100,48,58,32,122,101,114,111,32,100,97,116,97,32,108,101,110,103,116,104,32,40,37,117,47,37,117,47,37,117,41,10,0,0,0,0,0,0,0,37,117,47,37,117,47,37,117,10,0,0,0,0,0,0,0,67,97,112,115,76,111,99,107,0,0,0,0,0,0,0,0,98,99,0,0,0,0,0,0,46,105,109,103,0,0,0,0,46,116,99,0,0,0,0,0,115,101,114,99,111,110,0,0,100,105,115,97,115,115,101,109,98,108,101,0,0,0,0,0,115,101,116,32,112,111,114,116,32,56,32,37,48,52,108,88,32,60,45,32,37,48,50,88,10,0,0,0,0,0,0,0,82,101,116,117,114,110,0,0,91,97,100,100,114,32,91,99,110,116,32,91,109,111,100,101,93,93,93,0,0,0,0,0,98,0,0,0,0,0,0,0,112,116,121,0,0,0,0,0,120,100,105,118,0,0,0,0,73,77,85,76,0,0,0,0,113,101,100,58,32,117,110,107,110,111,119,110,32,102,101,97,116,117,114,101,115,32,40,48,120,37,48,56,108,108,120,41,10,0,0,0,0,0,0,0,100,105,115,107,32,37,117,58,32,119,114,105,116,105,110,103,32,98,97,99,107,32,102,100,99,32,105,109,97,103,101,10,0,0,0,0,0,0,0,0,115,101,116,32,112,111,114,116,32,49,54,32,37,48,52,108,88,32,60,45,32,37,48,52,88,10,0,0,0,0,0,0,93,0,0,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,32,91,49,93,0,0,0,0,49,0,0,0,0,0,0,0,80,114,105,110,116,32,118,101,114,115,105,111,110,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,0,0,0,82,105,103,104,116,66,114,97,99,107,101,116,0,0,0,0,87,68,49,55,57,88,58,32,68,61,37,117,32,83,69,76,69,67,84,32,84,82,65,67,75,32,69,82,82,79,82,32,40,99,61,37,117,32,104,61,37,117,41,10,0,0,0,0,112,114,105,110,116,32,115,116,97,116,117,115,32,40,99,112,117,124,105,99,117,124,109,101,109,124,124,112,112,105,124,112,105,99,124,114,99,55,53,57,124,116,99,117,124,116,105,109,101,41,0,0,0,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,32,40,112,114,105,41,10,0,0,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,118,101,114,115,105,111,110,0,91,0,0,0,0,0,0,0,98,108,111,99,107,95,99,111,117,110,116,0,0,0,0,0,91,119,104,97,116,93,0,0,109,111,100,101,108,61,56,48,49,56,54,10,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,100,101,98,117,103,32,91,110,111,93,0,76,101,102,116,66,114,97,99,107,101,116,0,0,0,0,0,98,108,111,99,107,95,115,116,97,114,116,0,0,0,0,0,115,101,116,32,97,32,114,101,103,105,115,116,101,114,0,0,115,115,0,0,0,0,0,0,84,69,83,84,0,0,0,0,42,42,42,32,101,114,114,111,114,32,108,111,97,100,105,110,103,32,116,104,101,32,78,86,77,32,40,37,115,41,10,0,118,101,114,98,111,115,101,0,112,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,118,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,10,0,0,0,0,0,0,91,114,101,103,32,118,97,108,93,0,0,0,0,0,0,0,83,84,68,0,0,0,0,0,102,105,108,101,61,37,115,32,115,97,110,105,116,105,122,101,61,37,100,10,0,0,0,0,83,101,116,32,116,104,101,32,116,101,114,109,105,110,97,108,32,100,101,118,105,99,101,0,111,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,115,0,0,0,0,0,0,0,101,120,101,99,117,116,101,32,99,110,116,32,105,110,115,116,114,117,99,116,105,111,110,115,44,32,119,105,116,104,111,117,116,32,116,114,97,99,101,32,105,110,32,99,97,108,108,115,32,91,49,93,0,0,0,0,67,76,68,0,0,0,0,0,78,86,77,58,0,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,73,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,104,0,0,0,0,0,0,0,112,114,101,102,101,116,99,104,32,113,117,101,117,101,32,99,108,101,97,114,47,102,105,108,108,47,115,116,97,116,117,115,0,0,0,0,0,0,0,0,104,111,115,116,32,115,121,115,116,101,109,32,116,111,111,32,115,108,111,119,44,32,115,107,105,112,112,105,110,103,32,49,32,115,101,99,111,110,100,46,10,0,0,0,0,0,0,0,83,84,73,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,115,97,110,105,116,105,122,101,95,110,118,109,0,0,0,0,83,101,116,32,116,104,101,32,67,80,85,32,115,112,101,101,100,0,0,0,0,0,0,0,117,0,0,0,0,0,0,0,118,105,115,105,98,108,101,95,99,0,0,0,0,0,0,0,101,109,117,46,101,120,105,116,0,0,0,0,0,0,0,0,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,0,91,99,124,102,124,115,93,0,70,52,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,124,0,0,0,0,0,0,0,125,10,0,0,0,0,0,0,107,101,121,98,111,97,114,100,32,98,117,102,102,101,114,32,111,118,101,114,102,108,111,119,10,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,108,111,97,100,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,98,105,110,97,114,121,32,97,100,100,114,61,48,120,37,48,56,108,120,10,0,0,0,0,0,97,115,112,101,99,116,95,120,0,0,0,0,0,0,0,0,115,105,122,101,109,0,0,0,67,76,73,0,0,0,0,0,100,114,105,118,101,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,45,37,99,41,10,0,0,0,0,0,0,0,42,42,42,32,37,115,32,91,37,115,93,10,0,0,0,0,98,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,0,0,0,0,0,0,102,97,108,115,101,0,0,0,115,100,108,0,0,0,0,0,110,118,109,46,100,97,116,0,116,100,48,58,32,99,114,99,32,101,114,114,111,114,32,97,116,32,115,101,99,116,111,114,32,37,117,47,37,117,47,37,117,32,40,110,111,32,100,97,116,97,41,10,0,0,0,0,105,110,116,0,0,0,0,0,121,0,0,0,0,0,0,0,32,37,48,50,88,0,0,0,46,105,109,100,0,0,0,0,46,112,114,105,0,0,0,0,45,45,0,0,0,0,0,0,111,117,116,112,117,116,32,97,32,98,121,116,101,32,111,114,32,119,111,114,100,32,116,111,32,97,32,112,111,114,116,0,83,84,67,0,0,0,0,0,110,118,109,0,0,0,0,0,115,112,101,101,100,0,0,0,116,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,32,40,99,111,119,41,10,0,0,91,98,124,119,93,32,112,111,114,116,32,118,97,108,0,0,72,65,76,84,61,49,10,0,115,101,114,99,111,110,0,0,120,109,117,108,0,0,0,0,67,76,67,0,0,0,0,0,99,111,109,109,105,116,0,0,99,111,109,109,105,116,0,0,42,42,42,32,115,101,116,116,105,110,103,32,115,111,117,110,100,32,100,114,105,118,101,114,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,99,111,109,109,105,116,0,0,78,101,118,101,114,32,115,116,111,112,32,114,117,110,110,105,110,103,32,91,110,111,93,0,114,0,0,0,0,0,0,0,115,101,116,32,105,110,116,101,114,114,117,112,116,32,110,32,108,111,103,32,101,120,112,114,101,115,115,105,111,110,32,116,111,32,101,120,112,114,0,0,83,80,0,0,0,0,0,0,118,111,108,117,109,101,61,37,117,32,115,114,97,116,101,61,37,108,117,32,108,111,119,112,97,115,115,61,37,108,117,32,100,114,105,118,101,114,61,37,115,10,0,0,0,0,0,0,110,111,45,109,111,110,105,116,111,114,0,0,0,0,0,0,101,0,0,0,0,0,0,0,87,68,49,55,57,88,58,32,70,79,82,77,65,84,32,76,79,83,84,32,68,65,84,65,10,0,0,0,0,0,0,0,114,119,0,0,0,0,0,0,105,110,116,32,110,32,91,101,120,112,114,93,0,0,0,0,68,88,0,0,0,0,0,0,102,100,99,58,32,115,97,118,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,83,80,69,65,75,69,82,58,0,0,0,0,0,0,0,0,83,116,97,114,116,32,114,117,110,110,105,110,103,32,105,109,109,101,100,105,97,116,101,108,121,32,91,110,111,93,0,0,119,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,108,105,115,116,32,105,110,116,101,114,114,117,112,116,32,108,111,103,32,101,120,112,114,101,115,115,105,111,110,115,0,0,67,88,0,0,0,0,0,0,108,111,119,112,97,115,115,0,114,117,110,0,0,0,0,0,113,0,0,0,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,37,115,32,98,108,111,99,107,115,61,37,108,117,32,99,104,115,61,37,108,117,47,37,108,117,47,37,108,117,32,37,115,32,102,105,108,101,61,37,115,10,0,105,110,116,32,108,0,0,0,99,115,0,0,0,0,0,0,65,88,0,0,0,0,0,0,115,97,109,112,108,101,95,114,97,116,101,0,0,0,0,0,83,101,116,32,116,104,101,32,108,111,103,32,108,101,118,101,108,32,116,111,32,101,114,114,111,114,32,91,110,111,93,0,84,97,98,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,48,120,37,48,50,120,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,115,105,109,117,108,97,116,101,32,112,114,101,115,115,105,110,103,32,111,114,32,114,101,108,101,97,115,105,110,103,32,107,101,121,115,0,0,0,0,0,66,72,0,0,0,0,0,0,118,111,108,117,109,101,0,0,113,117,105,101,116,0,0,0,66,97,99,107,115,112,97,99,101,0,0,0,0,0,0,0,116,101,108,101,100,105,115,107,0,0,0,0,0,0,0,0,67,65,76,76,70,0,0,0,91,91,43,124,45,93,107,101,121,46,46,46,93,0,0,0,68,72,0,0,0,0,0,0,100,114,105,118,101,114,0,0,83,101,116,32,116,104,101,32,108,111,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,0,0,0,61,0,0,0,0,0,0,0,112,115,105,0,0,0,0,0,105,110,112,117,116,32,97,32,98,121,116,101,32,111,114,32,119,111,114,100,32,102,114,111,109,32,97,32,112,111,114,116,0,0,0,0,0,0,0,0,115,101,116,116,105,110,103,32,99,108,111,99,107,32,116,111,32,37,108,117,10,0,0,0,67,72,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,115,112,101,97,107,101,114,0,108,111,103,0,0,0,0,0,69,113,117,97,108,0,0,0,112,102,100,99,45,97,117,116,111,0,0,0,0,0,0,0,107,101,121,109,97,112,0,0,116,101,114,109,46,101,115,99,97,112,101,0,0,0,0,0,91,98,124,119,93,32,112,111,114,116,0,0,0,0,0,0,70,51,0,0,0,0,0,0,99,112,117,46,115,112,101,101,100,32,61,32,0,0,0,0,38,38,0,0,0,0,0,0,37,115,32,123,10,0,0,0,60,110,111,110,101,62,0,0,37,115,58,37,108,117,58,32,37,115,0,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,115,114,101,99,10,0,0,0,0,101,115,99,97,112,101,0,0,98,97,115,101,0,0,0,0,100,114,105,118,101,61,37,117,32,116,121,112,101,61,99,111,119,32,102,105,108,101,61,37,115,10,0,0,0,0,0,0,65,72,0,0,0,0,0,0,37,115,58,32,109,105,115,115,105,110,103,32,111,112,116,105,111,110,32,97,114,103,117,109,101,110,116,32,40,37,115,41,10,0,0,0,0,0,0,0,99,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,119,97,118,0,0,0,0,0,112,99,101,45,114,99,55,53,57,0,0,0,0,0,0,0,116,100,48,58,32,116,114,97,99,107,32,99,114,99,32,40,37,48,50,88,32,37,48,52,88,41,10,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,115,101,99,116,111,114,32,104,101,97,100,101,114,41,10,0,0,0,0,0,0,0,0,112,115,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,97,102,116,101,114,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,45,0,0,0,0,0,0,0,48,98,0,0,0,0,0,0,100,99,52,50,58,32,116,97,103,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,0,112,102,100,99,0,0,0,0,46,105,109,97,0,0,0,0,46,112,98,105,116,0,0,0,119,98,0,0,0,0,0,0,45,0,0,0,0,0,0,0,112,114,105,110,116,32,104,101,108,112,32,111,110,32,109,101,115,115,97,103,101,115,0,0,66,76,0,0,0,0,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,105,110,105,45,97,112,112,101,110,100,0,0,0,0,0,0,77,105,110,117,115,0,0,0,48,120,0,0,0,0,0,0,105,109,100,0,0,0,0,0,114,117,110,0,0,0,0,0,32,32,73,37,99,32,68,37,99,32,79,37,99,32,83,37,99,32,90,37,99,32,65,37,99,32,80,37,99,32,67,37,99,10,0,0,0,0,0,0,112,111,115,105,120,0,0,0,109,115,121,115,0,0,0,0,68,76,0,0,0,0,0,0,119,98,0,0,0,0,0,0,109,111,110,111,99,104,114,111,109,101,61,37,100,32,50,50,75,72,122,61,37,100,32,109,105,110,95,104,61,37,117,10,0,0,0,0,0,0,0,0,65,100,100,32,97,110,32,105,110,105,32,115,116,114,105,110,103,32,98,101,102,111,114,101,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,114,43,98,0,0,0,0,0,105,109,97,103,101,100,105,115,107,0,0,0,0,0,0,0,67,76,0,0,0,0,0,0,86,73,68,69,79,58,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,32,102,111,114,32,100,114,105,118,101,32,37,117,10,0,0,105,110,105,45,112,114,101,102,105,120,0,0,0,0,0,0,57,0,0,0,0,0,0,0,116,114,117,101,0,0,0,0,87,68,49,55,57,88,58,32,109,111,116,111,114,32,105,115,32,111,102,102,33,10,0,0,100,99,52,50,0,0,0,0,114,117,110,32,117,110,116,105,108,32,67,83,32,99,104,97,110,103,101,115,0,0,0,0,101,56,50,53,57,58,32,115,112,101,99,105,97,108,32,109,97,115,107,32,109,111,100,101,32,101,110,97,98,108,101,100,10,0,0,0,0,0,0,0,65,76,0,0,0,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,102,97,105,108,101,100,10,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,118,105,100,101,111,32,116,121,112,101,32,40,37,115,41,10,0,0,0,0,99,111,109,109,105,116,0,0,83,101,116,32,116,104,101,32,118,105,100,101,111,32,100,101,118,105,99,101,0,0,0,0,56,0,0,0,0,0,0,0,100,101,102,105,110,101,100,0,99,112,50,0,0,0,0,0,102,97,114,0,0,0,0,0,115,116,100,105,111,58,102,105,108,101,61,0,0,0,0,0,66,80,0,0,0,0,0,0,114,98,0,0,0,0,0,0,99,111,108,111,114,0,0,0,99,111,109,109,105,116,105,110,103,32,100,114,105,118,101,32,37,117,10,0,0,0,0,0,118,105,100,101,111,0,0,0,43,49,0,0,0,0,0,0,55,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,97,110,97,100,105,115,107,0,114,117,110,32,119,105,116,104,32,98,114,101,97,107,112,111,105,110,116,115,0,0,0,0,32,32,0,0,0,0,0,0,101,115,0,0,0,0,0,0,66,88,0,0,0,0,0,0,104,105,114,101,115,0,0,0,42,42,42,32,99,111,109,109,105,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,0,0,0,0,65,100,100,32,97,32,100,105,114,101,99,116,111,114,121,32,116,111,32,116,104,101,32,115,101,97,114,99,104,32,112,97,116,104,0,0,0,0,0,0,45,49,0,0,0,0,0,0,54,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,112,97,114,116,105,116,105,111,110,0,0,0,0,0,0,0,91,97,100,100,114,46,46,46,93,0,0,0,0,0,0,0,32,32,32,0,0,0,0,0,68,73,0,0,0,0,0,0,109,111,110,111,0,0,0,0,42,42,42,32,99,111,109,109,105,116,32,102,97,105,108,101,100,32,102,111,114,32,97,116,32,108,101,97,115,116,32,111,110,101,32,100,105,115,107,10,0,0,0,0,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,0,0,0,0,0,0,112,97,116,104,0,0,0,0,53,0,0,0,0,0,0,0,113,101,100,0,0,0,0,0,67,65,76,76,0,0,0,0,103,98,0,0,0,0,0,0,32,37,48,50,88,0,0,0,83,73,0,0,0,0,0,0,109,105,110,95,104,0,0,0,99,111,109,109,105,116,105,110,103,32,97,108,108,32,100,114,105,118,101,115,10,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,83,101,116,32,116,104,101,32,99,111,110,102,105,103,32,102,105,108,101,32,110,97,109,101,32,91,110,111,110,101,93,0,52,0,0,0,0,0,0,0,33,0,0,0,0,0,0,0,112,99,101,0,0,0,0,0,99,108,111,99,107,32,116,104,101,32,115,105,109,117,108,97,116,105,111,110,32,91,49,93,0,0,0,0,0,0,0,0,60,45,0,0,0,0,0,0,67,80,85,58,0,0,0,0,66,80,43,68,73,0,0,0,101,109,117,46,99,111,110,102,105,103,46,115,97,118,101,0,118,105,100,101,111,0,0,0,97,108,108,0,0,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,115,116,114,105,110,103,0,0,51,0,0,0,0,0,0,0,126,0,0,0,0,0,0,0,42,42,42,32,110,111,32,116,101,114,109,105,110,97,108,32,102,111,117,110,100,10,0,0,100,111,115,101,109,117,0,0,114,101,112,111,114,116,95,107,101,121,115,0,0,0,0,0,80,54,10,37,117,32,37,117,10,37,117,10,0,0,0,0,91,99,110,116,93,0,0,0,45,62,0,0,0,0,0,0,70,50,0,0,0,0,0,0,99,111,109,109,105,116,0,0,10,0,0,0,0,0,0,0,124,124,0,0,0,0,0,0,105,103,110,111,114,105,110,103,32,112,99,101,32,107,101,121,58,32,37,117,32,48,120,37,48,52,120,32,40,37,115,41,10,0,0,0,0,0,0,0,60,110,111,110,101,62,0,0,32,9,0,0,0,0,0,0,37,45,57,115,32,0,0,0,100,105,0,0,0,0,0,0,102,105,108,101,61,37,115,32,102,111,114,109,97,116,61,105,104,101,120,10,0,0,0,0,110,117,108,108,0,0,0,0,97,100,100,114,101,115,115,0,42,42,42,32,99,111,119,32,102,97,105,108,101,100,32,40,100,114,105,118,101,61,37,117,32,102,105,108,101,61,37,115,41,10,0,0,0,0,0,0,37,115,58,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,40,37,115,41,10,0,0,0,0,0,0,0,0,66,80,43,83,73,0,0,0,115,0,0,0,0,0,0,0,121,101,115,0,0,0,0,0,110,117,108,108,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,116,100,48,58,32,104,101,97,100,101,114,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,0,109,102,109,0,0,0,0,0,101,106,101,99,116,105,110,103,32,100,114,105,118,101,32,37,108,117,10,0,0,0,0,0,115,116,120,58,32,114,101,97,100,32,101,114,114,111,114,32,40,116,114,97,99,107,32,104,101,97,100,101,114,41,10,0,112,115,105,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,112,102,100,99,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,40,37,108,117,41,10,0,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,99,111,110,102,105,103,0,0,50,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,100,99,52,50,58,32,100,97,116,97,32,99,104,101,99,107,115,117,109,32,101,114,114,111,114,10,0,0,0,0,0,0,32,45,0,0,0,0,0,0,42,42,42,32,117,110,107,110,111,119,110,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,58,32,37,115,10,0,0,0,0,0,0,0,0,105,109,97,103,101,0,0,0,46,105,109,97,103,101,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,117,41,10,0,0,0,0,0,0,0,112,114,105,58,32,117,110,107,110,111,119,110,32,118,101,114,115,105,111,110,32,110,117,109,98,101,114,32,40,37,108,117,41,10,0,0,0,0,0,0,109,102,109,58,32,117,110,107,110,111,119,110,32,97,100,100,114,101,115,115,32,109,97,114,107,32,40,109,97,114,107,61,48,120,37,48,50,120,41,10,0,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,99,104,97,114,45,112,116,121,58,32,37,115,10,0,0,0,119,114,105,116,101,0,0,0,37,48,52,88,58,37,48,52,88,58,32,105,110,116,32,37,48,50,88,32,91,65,88,61,37,48,52,88,32,66,88,61,37,48,52,88,32,67,88,61,37,48,52,88,32,68,88,61,37,48,52,88,32,68,83,61,37,48,52,88,32,69,83,61,37,48,52,88,93,10,0,0,37,115,32,37,48,50,88,0,102,117,108,108,115,99,114,101,101,110,0,0,0,0,0,0,115,105,0,0,0,0,0,0,66,88,43,68,73,0,0,0,112,99,101,37,48,52,117,46,112,112,109,0,0,0,0,0,100,105,115,107,0,0,0,0,46,112,98,105,116,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,80,114,105,110,116,32,117,115,97,103,101,32,105,110,102,111,114,109,97,116,105,111,110,0,49,0,0,0,0,0,0,0,47,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,110,117,108,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,114,97,109,0,0,0,0,0,37,48,52,88,58,37,48,52,88,58,32,117,110,100,101,102,105,110,101,100,32,111,112,101,114,97,116,105,111,110,32,91,37,48,50,88,32,37,48,50,120,93,10,0,0,0,0,0,67,83,61,37,48,52,88,32,32,68,83,61,37,48,52,88,32,32,69,83,61,37,48,52,88,32,32,83,83,61,37,48,52,88,32,32,73,80,61,37,48,52,88,32,32,70,32,61,37,48,52,88,0,0,0,0,114,101,97,100,0,0,0,0,110,117,108,108,0,0,0,0,98,112,0,0,0,0,0,0,109,105,99,114,111,115,111,102,116,0,0,0,0,0,0,0,114,43,98,0,0,0,0,0,66,88,43,83,73,0,0,0,114,43,98,0,0,0,0,0,114,43,98,0,0,0,0,0,102,105,108,101,48,61,37,115,32,102,105,108,101,49,61,37,115,10,0,0,0,0,0,0,42,42,42,32,100,105,115,107,32,101,106,101,99,116,32,101,114,114,111,114,58,32,98,97,100,32,100,114,105,118,101,32,40,37,115,41,10,0,0,0,114,43,98,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,104,101,108,112,0,0,0,0,96,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,42,42,42,32,115,101,116,116,105,110,103,32,117,112,32,115,100,108,32,116,101,114,109,105,110,97,108,32,102,97,105,108,101,100,10,0,0,0,0,0,114,98,0,0,0,0,0,0,114,98,0,0,0,0,0,0,117,0,0,0,0,0,0,0,69,83,67,0,0,0,0,0,114,98,0,0,0,0,0,0,114,98,0,0,0,0,0,0,114,43,98,0,0,0,0,0,115,112,0,0,0,0,0,0,68,83,58,0,0,0,0,0,63,0,0,0,0,0,0,0,70,68,67,58,0,0,0,0,32,9,0,0,0,0,0,0,35,32,71,101,110,101,114,97,116,101,100,32,97,117,116,111,109,97,116,105,99,97,108,108,121,32,98,121,32,108,105,98,105,110,105,10,10,0,0,0,56,0,0,0,0,0,0,0,91,37,48,52,88,58,37,48,52,88,93,32,0,0,0,0,117,115,97,103,101,58,32,112,99,101,45,114,99,55,53,57,32,91,111,112,116,105,111,110,115,93,0,0,0,0,0,0,66,97,99,107,113,117,111,116,101,0,0,0,0,0,0,0,37,108,117,0,0,0,0,0,101,108,115,101,0,0,0,0,87,68,49,55,57,88,58,32,67,77,68,91,37,48,50,88,93,32,85,78,75,78,79,87,78,32,67,79,77,77,65,78,68,10,0,0,0,0,0,0,115,100,108,0,0,0,0,0,102,105,108,101,0,0,0,0,116,0,0,0,0,0,0,0,101,56,50,53,57,58,32,112,111,108,108,32,99,111,109,109,97,110,100,10,0,0,0,0,98,120,0,0,0,0,0,0,114,0,0,0,0,0,0,0,83,83,58,0,0,0,0,0,114,101,115,101,116,32,107,101,121,98,111,97,114,100,10,0,102,105,108,101,49,0,0,0,58,0,0,0,0,0,0,0,112,97,114,115,101,32,101,114,114,111,114,32,98,101,102,111,114,101,0,0,0,0,0,0,112,99,101,0,0,0,0,0,55,0,0,0,0,0,0,0,102,100,99,58,32,108,111,97,100,105,110,103,32,100,114,105,118,101,32,37,117,32,40,100,105,115,107,41,10,0,0,0,112,99,101,45,114,99,55,53,57,58,32,82,67,55,53,57], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([32,80,105,99,99,111,108,105,110,101,32,101,109,117,108,97,116,111,114,0,0,0,0,0,80,97,117,115,101,0,0,0,45,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,42,42,42,32,116,101,114,109,105,110,97,108,32,100,114,105,118,101,114,32,39,120,49,49,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,111,112,116,105,111,110,97,108,0,0,0,0,0,0,0,0,101,120,112,101,99,116,105,110,103,32,111,102,102,115,101,116,0,0,0,0,0,0,0,0,58,0,0,0,0,0,0,0,115,0,0,0,0,0,0,0,114,0,0,0,0,0,0,0,101,109,117,46,99,111,110,102,105,103,46,115,97,118,101,32,32,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,101,109,117,46,101,120,105,116,10,101,109,117,46,115,116,111,112,10,101,109,117,46,112,97,117,115,101,32,32,32,32,32,32,32,32,32,32,32,32,34,48,34,32,124,32,34,49,34,10,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,10,101,109,117,46,114,101,115,101,116,10,10,101,109,117,46,99,112,117,46,115,112,101,101,100,32,32,32,32,32,32,32,32,60,102,97,99,116,111,114,62,10,101,109,117,46,99,112,117,46,115,112,101,101,100,46,115,116,101,112,32,32,32,60,97,100,106,117,115,116,109,101,110,116,62,10,10,101,109,117,46,100,105,115,107,46,99,111,109,109,105,116,32,32,32,32,32,32,91,60,100,114,105,118,101,62,93,10,101,109,117,46,100,105,115,107,46,101,106,101,99,116,32,32,32,32,32,32,32,60,100,114,105,118,101,62,10,101,109,117,46,100,105,115,107,46,105,110,115,101,114,116,32,32,32,32,32,32,60,100,114,105,118,101,62,58,60,102,110,97,109,101,62,10,10,101,109,117,46,112,97,114,112,111,114,116,49,46,100,114,105,118,101,114,32,32,60,100,114,105,118,101,114,62,10,101,109,117,46,112,97,114,112,111,114,116,49,46,102,105,108,101,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,101,109,117,46,112,97,114,112,111,114,116,50,46,100,114,105,118,101,114,32,32,60,100,114,105,118,101,114,62,10,101,109,117,46,112,97,114,112,111,114,116,50,46,102,105,108,101,32,32,32,32,60,102,105,108,101,110,97,109,101,62,10,10,101,109,117,46,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,32,32,34,48,34,32,124,32,34,49,34,10,101,109,117,46,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,10,101,109,117,46,116,101,114,109,46,103,114,97,98,10,101,109,117,46,116,101,114,109,46,114,101,108,101,97,115,101,10,101,109,117,46,116,101,114,109,46,115,99,114,101,101,110,115,104,111,116,32,32,91,60,102,105,108,101,110,97,109,101,62,93,10,101,109,117,46,116,101,114,109,46,116,105,116,108,101,32,32,32,32,32,32,32,60,116,105,116,108,101,62,10,0,0,0,116,114,117,101,0,0,0,0,37,48,52,88,58,32,37,48,50,88,10,0,0,0,0,0,37,48,52,88,58,32,37,48,52,88,10,0,0,0,0,0,43,0,0,0,0,0,0,0,100,120,0,0,0,0,0,0,107,101,121,58,32,37,115,37,115,10,0,0,0,0,0,0,67,83,58,0,0,0,0,0,117,110,107,110,111,119,110,32,107,101,121,58,32,37,115,10,0,0,0,0,0,0,0,0,37,48,50,88,58,32,37,115,10,0,0,0,0,0,0,0,102,105,108,101,48,0,0,0,101,109,117,46,115,116,111,112,0,0,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,0,54,0,0,0,0,0,0,0,110,101,101,100,32,97,110,32,101,120,112,114,101,115,115,105,111,110,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,32,118,101,114,115,105,111,110,32,50,48,49,52,48,51,49,49,45,55,98,51,53,99,100,100,10,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,0,0,0,83,99,114,76,107,0,0,0,43,0,0,0,0,0,0,0,99,97,110,39,116,32,111,112,101,110,32,105,110,99,108,117,100,101,32,102,105,108,101,58,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,0,0,0,0,120,49,49,0,0,0,0,0,114,101,97,100,111,110,108,121,0,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,37,48,50,88,58,32,60,100,101,108,101,116,101,100,62,10,0,0,0,0,0,0,0,0,110,101,101,100,32,97,110,32,105,110,116,101,114,114,117,112,116,32,110,117,109,98,101,114,0,0,0,0,0,0,0,0,115,101,116,0,0,0,0,0,108,0,0,0,0,0,0,0,108,111,103,32,119,104,97,116,63,0,0,0,0,0,0,0,105,110,116,0,0,0,0,0,97,0,0,0,0,0,0,0,110,101,101,100,32,97,32,118,97,108,117,101,0,0,0,0,99,120,0,0,0,0,0,0,110,101,101,100,32,97,32,112,111,114,116,32,97,100,100,114,101,115,115,0,0,0,0,0,102,108,97,103,115,0,0,0,114,98,0,0,0,0,0,0,69,83,58,0,0,0,0,0,119,0,0,0,0,0,0,0,80,81,58,0,0,0,0,0,102,100,99,0,0,0,0,0,101,109,117,46,114,101,115,101,116,0,0,0,0,0,0,0,116,101,114,109,46,102,117,108,108,115,99,114,101,101,110,46,116,111,103,103,108,101,0,0,53,0,0,0,0,0,0,0,112,113,58,32,117,110,107,110,111,119,110,32,99,111,109,109,97,110,100,32,40,37,115,41,10,0,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,32,118,101,114,115,105,111,110,32,50,48,49,52,48,51,49,49,45,55,98,51,53,99,100,100,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,50,32,72,97,109,112,97,32,72,117,103,32,60,104,97,109,112,97,64,104,97,109,112,97,46,99,104,62,10,0,0,0,0,0,0,0,83,99,114,111,108,108,76,111,99,107,0,0,0,0,0,0,62,62,0,0,0,0,0,0,63,0,0,0,0,0,0,0,116,101,114,109,105,110,97,108,0,0,0,0,0,0,0,0,98,97,115,101,0,0,0,0,69,83,67,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,111,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,103,0,0,0,114,98,0,0,0,0,0,0,102,0,0,0,0,0,0,0,80,85,83,72,65,0,0,0,37,48,52,108,88,10,0,0,114,0,0,0,0,0,0,0,114,97,109,0,0,0,0,0,80,79,80,65,0,0,0,0,98,97,100,32,114,101,103,105,115,116,101,114,32,40,37,115,41,10,0,0,0,0,0,0,66,79,85,78,68,0,0,0,109,105,115,115,105,110,103,32,114,101,103,105,115,116,101,114,10,0,0,0,0,0,0,0,68,66,0,0,0,0,0,0,117,110,107,110,111,119,110,32,115,105,103,110,97,108,32,40,37,115,41,10,0,0,0,0,80,67,69,72,0,0,0,0,112,105,99,46,105,114,113,55,0,0,0,0,0,0,0,0,97,120,0,0,0,0,0,0,73,78,83,66,0,0,0,0,69,120,116,114,97,49,54,0,112,105,99,46,105,114,113,54,0,0,0,0,0,0,0,0,73,78,83,87,0,0,0,0,99,111,119,0,0,0,0,0,69,120,116,114,97,49,53,0,112,105,99,46,105,114,113,53,0,0,0,0,0,0,0,0,79,85,84,83,66,0,0,0,69,120,116,114,97,49,52,0,37,115,10,10,0,0,0,0,112,105,99,46,105,114,113,52,0,0,0,0,0,0,0,0,116,121,112,101,61,114,101,109,111,116,101,32,100,114,105,118,101,114,61,37,115,10,0,0,79,85,84,83,87,0,0,0,101,109,117,46,112,97,117,115,101,46,116,111,103,103,108,101,0,0,0,0,0,0,0,0,69,120,116,114,97,49,51,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,121,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,112,105,99,46,105,114,113,51,0,0,0,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,99,111,110,102,105,103,32,102,105,108,101,32,102,97,105,108,101,100,10,0,80,114,116,83,99,110,0,0,60,60,0,0,0,0,0,0,105,110,99,108,117,100,101,0,97,100,100,114,101,115,115,0,100,114,105,118,101,114,61,37,115,32,69,83,67,61,37,115,32,97,115,112,101,99,116,61,37,117,47,37,117,32,109,105,110,95,115,105,122,101,61,37,117,42,37,117,32,115,99,97,108,101,61,37,117,32,109,111,117,115,101,61,91,37,117,47,37,117,32,37,117,47,37,117,93,10,0,0,0,0,0,0,74,71,0,0,0,0,0,0,82,79,77,58,0,0,0,0,115,105,122,101,109,0,0,0,69,120,116,114,97,49,50,0,46,120,100,102,0,0,0,0,112,105,99,46,105,114,113,50,0,0,0,0,0,0,0,0,74,76,69,0,0,0,0,0,69,120,116,114,97,49,49,0,112,105,99,46,105,114,113,49,0,0,0,0,0,0,0,0,112,0,0,0,0,0,0,0,74,71,69,0,0,0,0,0,69,120,116,114,97,49,48,0,112,105,99,46,105,114,113,48,0,0,0,0,0,0,0,0,74,76,0,0,0,0,0,0,69,120,116,114,97,57,0,0,109,105,115,115,105,110,103,32,118,97,108,117,101,10,0,0,74,80,79,0,0,0,0,0,69,120,116,114,97,56,0,0,109,105,115,115,105,110,103,32,115,105,103,110,97,108,10,0,74,80,69,0,0,0,0,0,69,120,116,114,97,55,0,0,37,117,58,32,67,84,76,61,37,48,52,88,32,67,78,84,61,37,48,52,88,32,83,82,67,61,37,48,53,108,88,32,68,83,84,61,37,48,53,108,88,10,0,0,0,0,0,0,37,52,117,32,32,0,0,0,98,104,0,0,0,0,0,0,74,78,83,0,0,0,0,0,69,120,116,114,97,54,0,0,56,48,49,56,54,45,68,77,65,0,0,0,0,0,0,0,74,83,0,0,0,0,0,0,49,0,0,0,0,0,0,0,60,98,97,100,62,0,0,0,69,120,116,114,97,53,0,0,68,82,73,86,69,32,37,117,58,32,83,69,76,61,37,100,32,82,68,89,61,37,100,32,77,61,37,100,32,32,67,61,37,48,50,88,32,72,61,37,88,32,32,80,79,83,61,37,108,117,32,67,78,84,61,37,108,117,10,0,0,0,0,0,74,65,0,0,0,0,0,0,119,97,118,0,0,0,0,0,69,120,116,114,97,52,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,105,110,105,116,105,97,108,105,122,105,110,103,32,97,117,100,105,111,32,115,117,98,115,121,115,116,101,109,32,40,37,115,41,10,0,0,0,0,0,0,0,83,84,65,84,85,83,61,37,48,50,88,32,32,67,77,68,61,37,48,50,88,10,0,0,80,65,82,80,79,82,84,50,58,0,0,0,0,0,0,0,74,66,69,0,0,0,0,0,101,109,117,46,112,97,117,115,101,0,0,0,0,0,0,0,69,120,116,114,97,51,0,0,116,101,114,109,46,115,101,116,95,98,111,114,100,101,114,95,120,0,0,0,0,0,0,0,51,0,0,0,0,0,0,0,70,67,82,61,37,48,50,88,32,32,82,83,86,61,37,48,50,88,10,0,0,0,0,0,102,105,108,101,61,34,37,115,34,10,0,0,0,0,0,0,80,114,105,110,116,83,99,114,101,101,110,0,0,0,0,0,62,0,0,0,0,0,0,0,105,102,0,0,0,0,0,0,119,97,118,102,105,108,116,101,114,0,0,0,0,0,0,0,121,0,0,0,0,0,0,0,102,105,108,101,0,0,0,0,84,69,82,77,58,0,0,0,74,78,90,0,0,0,0,0,114,111,109,0,0,0,0,0,115,105,122,101,107,0,0,0,69,120,116,114,97,50,0,0,46,116,100,48,0,0,0,0,49,55,57,88,45,70,68,67,0,0,0,0,0,0,0,0,74,90,0,0,0,0,0,0,69,120,116,114,97,49,0,0,45,0,0,0,0,0,0,0,112,113,0,0,0,0,0,0,74,78,67,0,0,0,0,0,82,105,103,104,116,0,0,0,37,52,115,91,37,117,93,58,32,67,84,76,61,37,48,52,88,32,32,67,78,84,61,37,48,52,108,88,32,32,73,61,37,117,32,82,61,37,117,32,77,61,37,117,32,83,61,37,117,10,0,0,0,0,0,0,74,67,0,0,0,0,0,0,68,111,119,110,0,0,0,0,80,77,82,61,37,48,52,88,32,32,80,83,84,61,37,48,52,88,32,32,73,78,84,61,37,100,10,0,0,0,0,0,74,78,79,0,0,0,0,0,76,101,102,116,0,0,0,0,32,73,83,82,61,0,0,0,114,101,115,101,116,32,115,121,115,116,101,109,10,0,0,0,74,79,0,0,0,0,0,0,85,112,0,0,0,0,0,0,32,73,77,82,61,0,0,0,100,104,0,0,0,0,0,0,67,77,80,0,0,0,0,0,116,99,58,32,117,110,107,110,111,119,110,32,109,97,114,107,32,48,120,37,48,50,120,32,40,37,115,44,32,99,61,37,117,44,32,104,61,37,117,44,32,98,105,116,61,37,108,117,47,37,108,117,41,10,0,0,80,97,103,101,68,111,119,110,0,0,0,0,0,0,0,0,32,73,82,82,61,0,0,0,88,79,82,0,0,0,0,0,91,37,115,37,115,37,99,37,48,52,88,93,0,0,0,0,69,110,100,0,0,0,0,0,56,48,49,56,54,45,73,67,85,0,0,0,0,0,0,0,83,85,66,0,0,0,0,0,117,110,104,97,110,100,108,101,100,32,109,101,115,115,97,103,101,32,40,34,37,115,34,44,32,34,37,115,34,41,10,0,68,101,108,101,116,101,0,0,73,78,84,51,0,0,0,0,42,42,42,32,99,97,110,39,116,32,111,112,101,110,32,100,114,105,118,101,114,32,40,37,115,41,10,0,0,0,0,0,65,78,68,0,0,0,0,0,101,109,117,46,112,97,114,112,111,114,116,50,46,102,105,108,101,0,0,0,0,0,0,0,80,97,103,101,85,112,0,0,116,101,114,109,46,116,105,116,108,101,0,0,0,0,0,0,50,0,0,0,0,0,0,0,73,78,84,50,0,0,0,0,67,79,78,70,73,71,58,0,70,49,50,0,0,0,0,0,60,0,0,0,0,0,0,0,61,0,0,0,0,0,0,0,118,0,0,0,0,0,0,0,102,111,114,109,97,116,0,0,109,111,117,115,101,95,100,105,118,95,121,0,0,0,0,0,83,66,66,0,0,0,0,0,42,42,42,32,108,111,97,100,105,110,103,32,114,97,109,32,102,97,105,108,101,100,32,40,37,115,41,10,0,0,0,0,115,105,122,101,0,0,0,0,112,102,100,99,58,32,99,114,99,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,65,32,32,37,48,56,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,72,111,109,101,0,0,0,0,82,101,108,101,97,115,101,32,54,46,48,10,36,48,0,0,46,116,99,0,0,0,0,0,73,78,84,49,0,0,0,0,98,111,114,100,101,114,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,50,32,102,105,108,101,10,0,0,0,0,0,0,0,65,68,67,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,49,32,102,105,108,101,10,0,0,0,0,0,0,0,119,98,0,0,0,0,0,0,73,110,115,101,114,116,0,0,73,78,84,48,0,0,0,0,111,0,0,0,0,0,0,0,112,102,100,99,58,32,119,97,114,110,105,110,103,58,32,108,111,97,100,105,110,103,32,100,101,112,114,101,99,97,116,101,100,32,118,101,114,115,105,111,110,32,48,32,102,105,108,101,10,0,0,0,0,0,0,0,79,82,0,0,0,0,0,0,75,80,95,80,101,114,105,111,100,0,0,0,0,0,0,0,68,77,65,49,0,0,0,0,70,49,0,0,0,0,0,0,114,43,98,0,0,0,0,0,119,43,98,0,0,0,0,0,65,68,68,0,0,0,0,0,58,0,0,0,0,0,0,0,37,115,58,32,101,114,114,111,114,32,112,97,114,115,105,110,103,32,105,110,105,32,115,116,114,105,110,103,32,40,37,115,41,10,0,0,0,0,0,0,119,98,0,0,0,0,0,0,75,80,95,48,0,0,0,0,68,77,65,48,0,0,0,0,45,37,48,50,88,0,0,0,117,110,104,97,110,100,108,101,100,32,109,97,103,105,99,32,107,101,121,32,40,37,117,41,10,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,75,80,95,69,110,116,101,114,0,0,0,0,0,0,0,0,84,77,82,0,0,0,0,0,112,97,116,104,0,0,0,0,102,97,108,115,101,0,0,0,43,37,48,50,88,0,0,0,75,80,95,51,0,0,0,0,82,67,55,53,57,32,77,69,77,0,0,0,0,0,0,0,99,104,0,0,0,0,0,0,76,111,97,100,58,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,32,115,101,99,116,111,114,32,100,97,116,97,32,116,111,111,32,98,105,103,32,40,37,117,41,10,0,0,0,0,0,0,0,0,75,80,95,50,0,0,0,0,100,114,105,118,101,114,0,0,82,67,55,53,57,32,80,79,82,84,83,0,0,0,0,0,102,105,108,101,0,0,0,0,68,83,0,0,0,0,0,0,68,73,83,75,58,0,0,0,91,37,115,37,115,37,99,37,48,50,88,93,0,0,0,0,75,80,95,49,0,0,0,0,32,32,78,37,117,61,37,48,52,108,88,0,0,0,0,0,108,0,0,0,0,0,0,0,83,83,0,0,0,0,0,0,116,114,117,101,0,0,0,0,119,98,0,0,0,0,0,0,115,110,100,45,115,100,108,58,32,101,114,114,111,114,32,111,112,101,110,105,110,103,32,111,117,116,112,117,116,32,40,37,115,41,10,0,0,0,0,0,75,80,95,54,0,0,0,0,108,111,119,112,97,115,115,0,78,48,61,37,48,52,108,88,0,0,0,0,0,0,0,0,60,110,111,110,101,62,0,0,116,100,48,58,32,97,100,118,97,110,99,101,100,32,99,111,109,112,114,101,115,115,105,111,110,32,110,111,116,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,0,0,0,0,102,109,0,0,0,0,0,0,67,83,0,0,0,0,0,0,115,116,120,58,32,98,97,100,32,109,97,103,105,99,10,0,101,109,117,46,112,97,114,112,111,114,116,50,46,100,114,105,118,101,114,0,0,0,0,0,112,115,105,58,32,99,114,99,32,101,114,114,111,114,10,0,75,80,95,53,0,0,0,0,112,102,100,99,58,32,111,114,112,104,97,110,101,100,32,97,108,116,101,114,110,97,116,101,32,115,101,99,116,111,114,10,0,0,0,0,0,0,0,0,116,101,114,109,46,114,101,108,101,97,115,101,0,0,0,0,101,109,117,46,99,112,117,46,115,112,101,101,100,0,0,0,73,67,87,61,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,32,32,79,67,87,61,91,37,48,50,88,32,37,48,50,88,32,37,48,50,88,93,10,0,0,0,0,0,0,0,0,112,99,101,45,114,99,55,53,57,58,32,115,105,103,105,110,116,10,0,0,0,0,0,0,70,49,49,0,0,0,0,0,62,61,0,0,0,0,0,0,73,77,68,32,49,46,49,55,58,32,37,50,100,47,37,50,100,47,37,52,100,32,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,63,61,0,0,0,0,0,0,6,78,111,110,97,109,101,0,113,0,0,0,0,0,0,0,108,111,97,100,0,0,0,0,99,112,50,58,32,37,117,47,37,117,47,37,117,58,0,0,109,111,117,115,101,95,109,117,108,95,121,0,0,0,0,0,42,42,42,32,109,101,109,111,114,121,32,98,108,111,99,107,32,99,114,101,97,116,105,111,110,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,69,83,0,0,0,0,0,0,98,108,111,99,107,115,0,0,83,32,32,37,48,52,88,58,37,48,52,108,88,32,32,37,48,52,88,32,32,37,48,52,88,10,0,0,0,0,0,0,116,100,48,58,32,99,111,109,109,101,110,116,32,99,114,99,32,40,37,48,52,88,32,37,48,52,88,41,10,0,0,0,75,80,95,52,0,0,0,0,82,101,108,101,97,115,101,32,53,46,48,49,36,48,0,0,46,115,116,120,0,0,0,0,73,83,82,61,0,0,0,0,46,99,112,50,0,0,0,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,112,114,105,58,32,99,114,99,32,101,114,114,111,114,10,0,119,98,0,0,0,0,0,0,75,80,95,80,108,117,115,0,109,102,109,58,32,100,97,109,32,119,105,116,104,111,117,116,32,105,100,97,109,10,0,0,102,108,117,115,104,0,0,0,42,42,42,32,101,114,114,111,114,32,99,114,101,97,116,105,110,103,32,115,121,109,108,105,110,107,32,37,115,32,45,62,32,37,115,10,0,0,0,0,32,32,73,78,84,82,61,37,100,10,0,0,0,0,0,0,108,111,103,0,0,0,0,0,75,80,95,57,0,0,0,0,73,77,82,61,0,0,0,0,88,67,72,71,0,0,0,0,119,100,49,55,57,120,58,32,115,97,118,101,32,116,114,97,99,107,32,102,97,105,108,101,100,10,0,0,0,0,0,0,75,80,95,56,0,0,0,0,32,32,80,82,73,79,61,37,117,10,0,0,0,0,0,0,46,97,110,97,0,0,0,0,75,80,95,55,0,0,0,0,73,82,82,61,0,0,0,0,75,80,95,77,105,110,117,115,0,0,0,0,0,0,0,0,73,78,80,61,0,0,0,0,97,104,0,0,0,0,0,0,87,65,73,84,0,0,0,0,75,80,95,83,116,97,114,0,56,50,53,57,65,45,80,73,67,0,0,0,0,0,0,0,80,85,83,72,70,0,0,0,75,80,95,83,108,97,115,104,0,0,0,0,0,0,0,0,91,37,115,37,115,93,0,0,10,0,0,0,0,0,0,0,80,79,80,70,0,0,0,0,78,117,109,76,111,99,107,0,32,32,67,72,61,73,91,37,88,93,32,32,67,76,61,79,91,37,88,93,0,0,0,0,116,121,112,101,61,108,111,99,97,108,32,100,114,105,118,101,114,61,37,115,10,0,0,0,83,65,72,70,0,0,0,0,101,109,117,46,112,97,114,112,111,114,116,49,46,102,105,108,101,0,0,0,0,0,0,0,114,98,0,0,0,0,0,0,67,116,114,108,82,105,103,104,116,0,0,0,0,0,0,0,116,101,114,109,46,103,114,97,98,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,32,32,67,72,61,79,91,37,88,93,32,32,67,76,61,73,91,37,88,93,0,0,0,0,112,99,101,45,114,99,55,53,57,58,32,115,105,103,116,101,114,109,10,0,0,0,0,0,70,49,48,0,0,0,0,0,60,61,0,0,0,0,0,0,125,0,0,0,0,0,0,0,109,0,0,0,0,0,0,0,98,105,110,97,114,121,0,0,109,111,117,115,101,95,100,105,118,95,120,0,0,0,0,0,60,110,111,110,101,62,0,0,76,65,72,70,0,0,0,0,115,0,0,0,0,0,0,0,32,37,115,0,0,0,0,0,69,32,32,34,37,115,34,10,0,0,0,0,0,0,0,0,116,100,48,58,32,114,101,97,100,32,101,114,114,111,114,10,0,0,0,0,0,0,0,0,77,101,110,117,0,0,0,0,82,101,108,101,97,115,101,32,52,46,48,48,36,48,0,0,102,105,108,101,0,0,0,0,46,115,116,0,0,0,0,0,32,32,67,61,79,91,37,48,50,88,93,0,0,0,0,0,115,121,109,108,105,110,107,0,77,79,86,83,66,0,0,0,87,105,110,100,111,119,115,82,105,103,104,116,0,0,0,0,32,32,67,61,73,91,37,48,50,88,93,0,0,0,0,0,107,101,121,0,0,0,0,0,65,88,61,37,48,52,88,32,32,66,88,61,37,48,52,88,32,32,67,88,61,37,48,52,88,32,32,68,88,61,37,48,52,88,32,32,83,80,61,37,48,52,88,32,32,66,80,61,37,48,52,88,32,32,83,73,61,37,48,52,88,32,32,68,73,61,37,48,52,88,32,73,78,84,61,37,48,50,88,37,99,10,0,0,0,0,0,0,56,48,49,56,54,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20480);
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

  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }

  
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

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function __parseInt(str, endptr, base, min, max, bits, unsign) {
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

  var _llvm_memset_p0i8_i64=_memset;

  var _llvm_va_start=undefined;

  function _llvm_va_end() {}

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
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
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

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






___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var FUNCTION_TABLE = [0,0,_dop_d0,0,_dop_d1,0,_dop_d2,0,_dop_d3,0,_dop_d4,0,_dop_d7,0,_e8259_inta,0,_null_open,0,_sig_segv,0,_chr_mouse_close,0,_chr_stdio_read,0,_rc759_kbd_set_key,0,_rc759_set_timer1_out,0,_dsk_ram_write,0,_op_ud,0,_dsk_qed_set_msg,0,_op_e0,0,_op_e1,0,_op_e2,0,_op_e3,0,_op_e4,0,_op_e5,0,_op_e6,0,_op_e7,0,_op_e8,0,_op_e9,0,_ea_get18,0,_snd_sdl_close,0,_op_38,0,_op_39,0,_dop_28,0,_dop_29,0,_op_32,0,_op_33,0,_dop_24,0,_dop_25,0,_op_36,0,_op_37,0,_op_34,0,_dop_21,0,_chr_posix_close,0,_op_ea,0,_op_eb,0,_op_ec,0,_op_ed,0,_op_ee,0,_op_ef,0,_rc759_set_msg_emu_disk_commit,0,_rc759_set_msg_emu_parport2_driver,0,_sdl_del,0,_snd_sdl_set_params,0,_snd_null_open,0,_op_3b,0,_op_3c,0,_dop_2d,0,_op_3a,0,_op_3f,0,_dop_2c,0,_op_3d,0,_dop_2a,0,_dop_ca,0,_dsk_pce_get_msg,0,_dop_cc,0,_dop_cb,0,_dop_ce,0,_dop_cd,0,_dop_cf,0,_op_f6_00,0,_op_f6_03,0,_op_f6_02,0,_op_f6_05,0,_op_f6_04,0,_op_f6_07,0,_op_f6_06,0,_op_8c,0,_op_8b,0,_op_8a,0,_op_8f,0,_op_8e,0,_op_8d,0,_null_del,0,_op_f7_02,0,_op_f7_03,0,_op_f7_00,0,_op_f7_06,0,_op_f7_07,0,_op_f7_04,0,_op_f7_05,0,_op_ff_01,0,_op_ff_00,0,_op_ff_03,0,_op_ff_02,0,_op_ff_05,0,_op_ff_04,0,_op_ff_06,0,_chr_mouse_read,0,_op_89,0,_op_88,0,_dsk_pce_set_msg,0,_op_83,0,_op_81,0,_op_80,0,_op_87,0,_op_86,0,_op_85,0,_op_84,0,_dop_c1,0,_dop_c0,0,_dop_c3,0,_dop_c2,0,_dop_c5,0,_dop_c4,0,_dop_c7,0,_dop_c6,0,_dop_c9,0,_dop_c8,0,_snd_null_write,0,_cmd_get_sym1397,0,_dsk_cow_write,0,_e8259_set_irq4,0,_chr_stdio_open,0,_e8259_set_irq6,0,_e8259_set_irq1,0,_e8259_set_irq0,0,_e8259_set_irq3,0,_e8259_set_irq2,0,_op_a4,0,_op_a5,0,_op_a6,0,_op_a7,0,_op_a0,0,_op_a1,0,_op_a2,0,_op_a3,0,_op_a8,0,_op_a9,0,_dop_62,0,_dop_60,0,_dop_61,0,_dop_66,0,_dop_68,0,_dsk_qed_get_msg,0,_op_6e,0,_dop_1f,0,_dop_1e,0,_dop_1d,0,_dop_1c,0,_dop_1b,0,_dop_1a,0,_op_6b,0,_cmd_restore_cont,0,_dop_6c,0,_dop_6a,0,_dop_6f,0,_dop_6d,0,_dop_6e,0,_rc759_cmd,0,_op_ad,0,_op_ae,0,_op_af,0,_op_aa,0,_op_ab,0,_op_ac,0,_dop_17,0,_dop_16,0,_dop_15,0,_op_66,0,_dop_13,0,_dop_12,0,_dop_11,0,_dop_10,0,_op_69,0,_op_68,0,_dop_19,0,_dop_18,0,_rc759_set_msg_emu_stop,0,_dsk_qed_write,0,_bp_segofs_del,0,_dsk_cow_get_msg,0,_op_99,0,_e80186_icu_set_irq_tmr2,0,_e80186_icu_set_irq_tmr1,0,_e80186_icu_set_irq_tmr0,0,_op_6d,0,_chr_null_close,0,_e86_irq,0,_op_6f,0,_op_6a,0,_cmd_read_address_clock,0,_rc759_get_cpu_clock,0,_op_6c,0,_op_90,0,_rc759_set_msg_emu_config_save,0,_dsk_psi_set_msg,0,_null_update,0,_dop_ud,0,_rc759_set_msg_emu_disk_eject,0,_snd_sdl_callback,0,_dsk_img_del,0,_op_50,0,_op_2a,0,_op_2c,0,_op_2b,0,_op_2e,0,_op_2d,0,_op_2f,0,_chr_null_read,0,_op_d8,0,_op_d7,0,_op_d5,0,_op_d4,0,_op_d3,0,_op_d2,0,_op_d1,0,_op_d0,0,_op_29,0,_op_28,0,_dop_58,0,_cmd_write_sector_idam,0,_op_21,0,_op_20,0,_op_23,0,_op_22,0,_op_25,0,_op_24,0,_op_27,0,_op_26,0,_dop_f3,0,_dop_ae,0,_dop_ac,0,_bp_segofs_match,0,_dop_ab,0,_rc759_write_track,0,_cmd_step_cont,0,_dop_aa,0,_bp_addr_del,0,_chr_mouse_write,0,_e80186_dma_set_dreq0,0,_chr_null_get_ctl,0,_dop_14,0,_sig_int,0,_op_61,0,_op_60,0,_ea_get12,0,_e86_set_mem_uint8,0,_ea_get13,0,_mem_set_uint8,0,_op_62,0,_ea_get10,0,_ea_get11,0,_ea_get16,0,_ea_get17,0,_ea_get14,0,_dop_9f,0,_dop_9e,0,_dop_9d,0,_snd_sdl_open,0,_dop_9b,0,_dop_9a,0,_rc759_get_port8,0,_e86_set_mem_uint16,0,_dop_b8,0,_dop_b0,0,_wd179x_scan_mark,0,_null_set_msg_trm,0,_rc759_set_msg_emu_pause,0,_dop_50,0,_rc759_set_msg,0,_rc759_set_port8,0,_dop_99,0,_dop_98,0,_snd_null_close,0,_cmd_read_sector_idam,0,_dop_91,0,_dop_90,0,_rc759_set_timer0_out,0,_op_03,0,_rc759_get_port16,0,_null_close,0,_op_02,0,_chr_stdio_write,0,_dop_26,0,_dsk_img_read,0,_dop_27,0,_ea_get15,0,_op_30,0,_op_06,0,_op_fe,0,_op_31,0,_dop_22,0,_dop_23,0,_op_b1,0,_op_ff,0,_dop_20,0,_op_b0,0,_op_fa,0,_cmd_set_sym1399,0,_op_35,0,_op_09,0,_dop_04,0,_dop_05,0,_dop_06,0,_dop_07,0,_dop_00,0,_dop_01,0,_dop_02,0,_dop_03,0,_op_58,0,_op_fb,0,_dop_08,0,_dop_09,0,_op_b4,0,_bp_expr_print,0,_op_b7,0,_dsk_cow_read,0,_rc759_set_msg_emu_cpu_speed,0,_op_b6,0,_bp_expr_match,0,_op_9f,0,_rc759_set_msg_emu_disk_insert,0,_dsk_img_write,0,_bp_addr_print,0,_dop_ec,0,_dop_0d,0,_dop_0e,0,_dop_0f,0,_dop_0a,0,_dop_0b,0,_dop_0c,0,_mem_get_uint8,0,_dop_f2,0,_dop_af,0,_dop_f0,0,_dop_ad,0,_dop_f6,0,_dop_f7,0,_dop_f4,0,_dop_f5,0,_dop_f8,0,_rc759_set_msg_emu_parport1_driver,0,_dsk_cow_set_msg,0,_dsk_pce_del,0,_chr_posix_read,0,_op_83_04,0,_op_83_05,0,_op_83_06,0,_op_83_07,0,_op_83_00,0,_op_83_01,0,_op_83_02,0,_op_83_03,0,_op_81_02,0,_op_81_03,0,_op_81_00,0,_op_81_01,0,_op_81_06,0,_op_81_07,0,_op_81_04,0,_op_81_05,0,_rc759_set_msg_emu_cpu_speed_step,0,_dop_a7,0,_dop_a6,0,_dop_a5,0,_dop_a4,0,_dop_ff,0,_dop_a2,0,_dop_a1,0,_dop_a0,0,_dop_a9,0,_dop_a8,0,_cmd_read_sector_clock,0,_sim_atexit,0,_dop_a3,0,_null_check,0,_dop_fe,0,_dsk_part_write,0,_op_14,0,_op_15,0,_op_16,0,_op_17,0,_op_10,0,_op_11,0,_op_12,0,_op_13,0,_op_c2,0,_op_c3,0,_op_c0,0,_op_c1,0,_op_18,0,_op_19,0,_op_c4,0,_op_c5,0,_dop_48,0,_rc759_set_msg_emu_pause_toggle,0,_dop_40,0,_op_b2,0,_op_80_01,0,_op_80_00,0,_op_80_03,0,_op_80_02,0,_op_80_05,0,_op_80_04,0,_op_80_07,0,_op_80_06,0,_op_1d,0,_op_1e,0,_op_1f,0,_op_1a,0,_op_1b,0,_op_1c,0,_op_cb,0,_op_cc,0,_op_ca,0,_op_cf,0,_op_cd,0,_op_ce,0,_dsk_psi_write,0,_bp_expr_del,0,_rc759_set_msg_emu_parport2_file,0,_dop_eb,0,_dop_ea,0,_dop_ef,0,_dop_ee,0,_dop_ed,0,_sdl_check,0,_wd179x_read_track_clock,0,_snd_null_set_params,0,_chr_pty_close,0,_dsk_ram_del,0,_cmd_read_sector_dam,0,_dop_2f,0,_dop_e9,0,_dop_e8,0,_sdl_update,0,_sdl_open,0,_dop_e0,0,_dop_e7,0,_dop_e6,0,_dop_e5,0,_dop_e4,0,_op_f5,0,_dop_2e,0,_op_f4,0,_chr_posix_open,0,_dop_2b,0,_rc759_read_track,0,_op_f7,0,_dsk_part_del,0,_dsk_qed_read,0,_op_f6,0,_op_3e,0,_op_f0,0,_ea_get0a,0,_op_fd,0,_ea_get0c,0,_ea_get0b,0,_ea_get0e,0,_ea_get0d,0,_op_fc,0,_ea_get0f,0,_op_f2,0,_chr_null_write,0,_dop_88,0,_dop_89,0,_dop_84,0,_dop_85,0,_dop_86,0,_dop_87,0,_dop_80,0,_dop_81,0,_dop_83,0,_chr_posix_write,0,_dop_3a,0,_dop_3c,0,_dop_3b,0,_dop_3e,0,_dop_3d,0,_dop_3f,0,_chr_pty_read,0,_dsk_dosemu_del,0,_dsk_psi_del,0,_dop_8d,0,_dop_8e,0,_dop_8f,0,_op_f3,0,_dop_8a,0,_dop_8b,0,_dop_8c,0,_ea_get01,0,_ea_get00,0,_ea_get03,0,_ea_get02,0,_ea_get05,0,_ea_get04,0,_ea_get07,0,_ea_get06,0,_ea_get09,0,_ea_get08,0,_op_f9,0,_op_f8,0,_chr_pty_write,0,_dop_31,0,_dop_30,0,_dop_33,0,_dop_32,0,_dop_35,0,_dop_34,0,_dop_37,0,_op_48,0,_dop_39,0,_dop_38,0,_dop_36,0,_dsk_ram_read,0,_op_c8,0,_op_40,0,_chr_stdio_close,0,_dsk_part_read,0,_sig_term,0,_sdl_close,0,_chr_mouse_open,0,_chr_pty_open,0,_chr_null_open,0,_cmd_seek_cont,0,_op_c9,0,_op_c6,0,_rc759_set_msg_emu_reset,0,_op_c7,0,_cmd_read_address_idam,0,_e80186_icu_inta,0,_rc759_set_port16,0,_e80186_icu_set_irq_dma0,0,_e80186_icu_set_irq_dma1,0,_dop_9c,0,_rc759_run_emscripten_step,0,_dsk_pce_read,0,_bp_segofs_print,0,_cmd_write_track_clock,0,_chr_null_set_ctl,0,_e80186_icu_set_irq_int0,0,_snd_sdl_write,0,_cmd_auto_motor_off,0,_sdl_set_msg_trm,0,_op_0c,0,_op_0b,0,_op_0a,0,_op_98,0,_op_0f,0,_op_0e,0,_op_0d,0,_op_ba,0,_op_bc,0,_op_bb,0,_op_be,0,_op_bd,0,_op_bf,0,_rc759_set_msg_emu_parport1_file,0,_dsk_qed_del,0,_bp_addr_match,0,_e86_get_mem_uint16,0,_rc759_set_mouse,0,_cmd_write_sector_clock,0,_dsk_dosemu_read,0,_op_b9,0,_op_b8,0,_op_01,0,_op_00,0,_op_07,0,_dop_70,0,_op_05,0,_op_04,0,_op_9d,0,_op_9e,0,_op_b3,0,_op_08,0,_op_b5,0,_op_9a,0,_op_9b,0,_op_9c,0,_dsk_dosemu_write,0,_pce_op_int,0,_rc759_set_ppi_port_c,0,_chr_mouse_get_ctl,0,_rc759_set_msg_emu_exit,0,_dsk_cow_del,0,_e86_get_mem_uint8,0,_chr_mouse_set_ctl,0,_op_76,0,_op_77,0,_op_74,0,_op_75,0,_op_72,0,_op_73,0,_op_70,0,_op_71,0,_chr_mouse_set_params,0,_op_78,0,_op_79,0,_mem_set_uint16_le,0,_dsk_pce_write,0,_pce_op_undef,0,_mem_get_uint16_le,0,_chr_null_set_params,0,_dsk_psi_read,0,_op_7f,0,_op_7d,0,_op_7e,0,_op_7b,0,_op_7c,0,_op_7a,0,_mem_set_uint8_rw,0];

// EMSCRIPTEN_START_FUNCS
function _print_state_cpu(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;_pce_prt_sep(26264);r4=HEAPU16[r1+10>>1];r5=HEAPU16[r1+6>>1];r6=HEAPU16[r1+8>>1];r7=HEAPU16[r1+12>>1];r8=HEAPU16[r1+14>>1];r9=HEAPU16[r1+16>>1];r10=HEAPU16[r1+18>>1];r11=HEAP32[HEAP32[30440>>2]+70228>>2];_pce_printf(26176,(r2=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r2>>2]=HEAPU16[r1+4>>1],HEAP32[r2+8>>2]=r4,HEAP32[r2+16>>2]=r5,HEAP32[r2+24>>2]=r6,HEAP32[r2+32>>2]=r7,HEAP32[r2+40>>2]=r8,HEAP32[r2+48>>2]=r9,HEAP32[r2+56>>2]=r10,HEAP32[r2+64>>2]=r11&255,HEAP32[r2+72>>2]=(r11&256|0)!=0?42:32,r2));STACKTOP=r2;r11=HEAPU16[r1+26>>1];r10=HEAPU16[r1+20>>1];r9=HEAPU16[r1+24>>1];r8=HEAPU16[r1+28>>1];r7=r1+30|0;r6=HEAPU16[r7>>1];_pce_printf(19744,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=HEAPU16[r1+22>>1],HEAP32[r2+8>>2]=r11,HEAP32[r2+16>>2]=r10,HEAP32[r2+24>>2]=r9,HEAP32[r2+32>>2]=r8,HEAP32[r2+40>>2]=r6,r2));STACKTOP=r2;r6=HEAPU16[r7>>1];r7=HEAP8[656+(r6>>>10&1)|0]|0;r8=HEAP8[656+(r6>>>11&1)|0]|0;r9=HEAP8[656+(r6>>>7&1)|0]|0;r10=HEAP8[656+(r6>>>6&1)|0]|0;r11=HEAP8[656+(r6>>>4&1)|0]|0;r5=HEAP8[656+(r6>>>2&1)|0]|0;r4=HEAP8[656+(r6&1)|0]|0;_pce_printf(17432,(r2=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r2>>2]=HEAP8[656+(r6>>>9&1)|0]|0,HEAP32[r2+8>>2]=r7,HEAP32[r2+16>>2]=r8,HEAP32[r2+24>>2]=r9,HEAP32[r2+32>>2]=r10,HEAP32[r2+40>>2]=r11,HEAP32[r2+48>>2]=r5,HEAP32[r2+56>>2]=r4,r2));STACKTOP=r2;if((HEAP32[r1+152>>2]|0)==0){STACKTOP=r3;return}_pce_printf(15888,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;STACKTOP=r3;return}function _rc759_run(r1){var r2,r3,r4;r2=r1+70264|0;_pce_start(r2);_rc759_clock_discontinuity(r1);if((HEAP32[r2>>2]|0)==0){r3=r1+70268|0;r4=r1+70164|0;while(1){if((HEAP8[r3]|0)==0){_rc759_clock(r1,8)}else{_pce_usleep(1e5);_trm_check(HEAP32[r4>>2])}if((HEAP32[r2>>2]|0)!=0){break}}}r2=r1+70228|0;HEAP32[r2>>2]=HEAP32[r2>>2]&255;_pce_stop();return}function _rc759_get_sim(){return HEAP32[26272>>2]}function _rc759_run_emscripten(r1){var r2;HEAP32[26272>>2]=r1;_pce_start(r1+70264|0);_rc759_clock_discontinuity(r1);_emscripten_set_main_loop(1068,100,1);r2=r1+70228|0;HEAP32[r2>>2]=HEAP32[r2>>2]&255;return}function _rc759_run_emscripten_step(){var r1,r2;r1=0;r2=0;while(1){if((r2|0)>=1e4){r1=5;break}_rc759_clock(HEAP32[26272>>2],8);if((HEAP32[HEAP32[26272>>2]+70264>>2]|0)==0){r2=r2+1|0}else{break}}if(r1==5){return}_pce_stop();_emscripten_cancel_main_loop();return}function _rc759_cmd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+2504|0;r6=r5;r7=r5+8;r8=r5+16;r9=r5+24;r10=r5+32;r11=r5+264;r12=r5+496;r13=r5+504;r14=r5+520;r15=r5+752;r16=r5+760;r17=r5+992;r18=r5+1e3;r19=r5+1256;r20=r5+1488;r21=r5+1496;r22=r5+1728;r23=r5+1736;r24=r5+1744;r25=r5+1752;r26=r5+1760;r27=r5+1992;r28=r5+2e3;r29=r5+2008;r30=r5+2240;r31=r5+2496;r32=HEAP32[r1+70164>>2];if((r32|0)!=0){_trm_check(r32)}if((_cmd_match(r2,14328)|0)!=0){_cmd_do_b(r2,r1+70216|0);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,13240)|0)!=0){HEAP32[r31>>2]=1;_cmd_match_uint32(r2,r31);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_rc759_clock_discontinuity(r1);if((HEAP32[r31>>2]|0)!=0){while(1){_rc759_clock(r1,1);r32=HEAP32[r31>>2]-1|0;HEAP32[r31>>2]=r32;if((r32|0)==0){break}}}r31=r30|0;r32=r1+16|0;_e86_disasm_cur(HEAP32[r32>>2],r29);_disasm_str(r31,r29);_print_state_cpu(HEAP32[r32>>2]);r29=HEAP32[r32>>2];r32=HEAPU16[r29+28>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r29+22>>1],HEAP32[r4+8>>2]=r32,HEAP32[r4+16>>2]=r31,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,12384)|0)!=0){if((_cmd_match(r2,14328)|0)==0){r31=(_cmd_match(r2,17936)|0)==0;r32=(_cmd_match_end(r2)|0)==0;if(r31){if(r32){r33=0;STACKTOP=r5;return r33}_rc759_run(r1);r33=0;STACKTOP=r5;return r33}if(r32){r33=0;STACKTOP=r5;return r33}r32=r1+16|0;r31=HEAP16[HEAP32[r32>>2]+22>>1];r29=r1+70264|0;_pce_start(r29);_rc759_clock_discontinuity(r1);r34=r1+70228|0;r35=r1+70216|0;r36=HEAP32[_stdout>>2];r37=r31&65535;while(1){HEAP32[r34>>2]=HEAP32[r34>>2]&255;r38=_e86_get_opcnt(HEAP32[r32>>2]);r39=tempRet0;while(1){r40=_e86_get_opcnt(HEAP32[r32>>2]);if(!((r40|0)==(r38|0)&(tempRet0|0)==(r39|0))){break}_rc759_clock(r1,1);if((HEAP32[r29>>2]|0)!=0){break}}r41=HEAP32[r32>>2];if((HEAP16[r41+22>>1]|0)!=r31<<16>>16){r3=35;break}if((_bps_check(r35,r37,HEAPU16[r41+28>>1],r36)|0)!=0){break}if((HEAP32[r29>>2]|0)!=0){break}}if(r3==35){r29=r30|0;_e86_disasm_cur(r41,r26);_disasm_str(r29,r26);_print_state_cpu(HEAP32[r32>>2]);r26=HEAP32[r32>>2];r32=HEAPU16[r26+28>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r26+22>>1],HEAP32[r4+8>>2]=r32,HEAP32[r4+16>>2]=r29,r4));STACKTOP=r4}_pce_stop();r33=0;STACKTOP=r5;return r33}L46:do{if((_cmd_match_uint32(r2,r27)|0)!=0){r29=r1+70216|0;while(1){if((_cmd_match(r2,20624)|0)==0){r42=_bp_addr_new(HEAP32[r27>>2])}else{if((_cmd_match_uint32(r2,r28)|0)==0){break}r42=_bp_segofs_new(HEAP32[r27>>2]&65535,HEAP32[r28>>2]&65535)}_bps_bp_add(r29,r42);if((_cmd_match_uint32(r2,r27)|0)==0){break L46}}_cmd_error(r2,20600);r33=0;STACKTOP=r5;return r33}}while(0);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r27=r1+70264|0;_pce_start(r27);_rc759_clock_discontinuity(r1);r42=r1+70228|0;r28=r1+16|0;r29=r1+70216|0;r32=HEAP32[_stdout>>2];while(1){HEAP32[r42>>2]=HEAP32[r42>>2]&255;r26=_e86_get_opcnt(HEAP32[r28>>2]);r41=tempRet0;while(1){r36=_e86_get_opcnt(HEAP32[r28>>2]);if(!((r36|0)==(r26|0)&(tempRet0|0)==(r41|0))){break}_rc759_clock(r1,1);if((HEAP32[r27>>2]|0)!=0){break}}r41=HEAP32[r28>>2];if((_bps_check(r29,HEAPU16[r41+22>>1],HEAPU16[r41+28>>1],r32)|0)!=0){break}if((HEAP32[r27>>2]|0)!=0){break}}_pce_stop();r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,11456)|0)!=0){_pce_puts(20648);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,10624)|0)!=0){if((_cmd_match(r2,21768)|0)==0){_cmd_match(r2,14328);r43=0}else{r43=1}if((_cmd_match_uint16(r2,r25)|0)==0){_cmd_error(r2,21720);r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r27=HEAPU16[r25>>1];r25=HEAP32[r1+16>>2];if((r43|0)==0){r43=FUNCTION_TABLE[HEAP32[r25+56>>2]](HEAP32[r25+52>>2],r27)&255;_pce_printf(21208,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r27,HEAP32[r4+8>>2]=r43,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}else{r43=FUNCTION_TABLE[HEAP32[r25+64>>2]](HEAP32[r25+52>>2],r27)&65535;_pce_printf(21224,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r27,HEAP32[r4+8>>2]=r43,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}}if((_cmd_match(r2,26168)|0)!=0){r43=r30|0;if((_cmd_match_str(r2,r43,256)|0)!=0){r27=r1+472|0;while(1){r25=HEAP8[r43];if(r25<<24>>24==43){r44=1;r45=1}else{r32=r25<<24>>24==45;r44=r32&1;r45=r32?2:1}r32=r30+r44|0;r25=_pce_key_from_string(r32);if((r25|0)==0){_pce_printf(21280,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r43,r4));STACKTOP=r4}else{_pce_printf(21256,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=(r45|0)==1?21240:23376,HEAP32[r4+8>>2]=r32,r4));STACKTOP=r4;_rc759_kbd_set_key(r27,r45,r25)}if((_cmd_match_str(r2,r43,256)|0)==0){break}}}_cmd_match_end(r2);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,25528)|0)!=0){if((_cmd_match(r2,21680)|0)==0){_cmd_error(r2,21664);r33=0;STACKTOP=r5;return r33}r43=r30|0;if((_cmd_match_eol(r2)|0)!=0){r45=0;while(1){r27=_rc759_intlog_get(r1,r45);if((r27|0)!=0){_pce_printf(21304,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r45,HEAP32[r4+8>>2]=r27,r4));STACKTOP=r4}r27=r45+1|0;if(r27>>>0<256){r45=r27}else{r33=0;break}}STACKTOP=r5;return r33}if((_cmd_match(r2,21656)|0)!=0){r45=0;while(1){r27=_rc759_intlog_get(r1,r45);if((r27|0)!=0){_pce_printf(21304,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r45,HEAP32[r4+8>>2]=r27,r4));STACKTOP=r4}r27=r45+1|0;if(r27>>>0<256){r45=r27}else{r33=0;break}}STACKTOP=r5;return r33}if((_cmd_match_uint16(r2,r24)|0)==0){_cmd_error(r2,21616);r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){_rc759_intlog_set(r1,HEAPU16[r24>>1],0);_pce_printf(21592,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r24>>1],r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_str(r2,r43,256)|0)==0){_cmd_error(r2,21368);r33=0;STACKTOP=r5;return r33}else{_pce_printf(21304,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAPU16[r24>>1],HEAP32[r4+8>>2]=r43,r4));STACKTOP=r4;_rc759_intlog_set(r1,HEAPU16[r24>>1],r43);r33=0;STACKTOP=r5;return r33}}if((_cmd_match(r2,24232)|0)!=0){if((_cmd_match(r2,21768)|0)==0){_cmd_match(r2,14328);r46=0}else{r46=1}if((_cmd_match_uint16(r2,r22)|0)==0){_cmd_error(r2,21720);r33=0;STACKTOP=r5;return r33}if((_cmd_match_uint16(r2,r23)|0)==0){_cmd_error(r2,21696);r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r43=HEAP32[r1+16>>2];if((r46|0)==0){FUNCTION_TABLE[HEAP32[r43+60>>2]](HEAP32[r43+52>>2],HEAPU16[r22>>1],HEAP16[r23>>1]&255);r33=0;STACKTOP=r5;return r33}else{FUNCTION_TABLE[HEAP32[r43+68>>2]](HEAP32[r43+52>>2],HEAPU16[r22>>1],HEAP16[r23>>1]);r33=0;STACKTOP=r5;return r33}}if((_cmd_match(r2,23384)|0)!=0){if((_cmd_match(r2,13240)|0)!=0){if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_e86_pq_init(HEAP32[r1+16>>2]);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,22072)|0)!=0){if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_e86_pq_fill(HEAP32[r1+16>>2]);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,20632)|0)!=0){if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_pce_puts(21776);r23=r1+16|0;r22=HEAP32[r23>>2];if((HEAP32[r22+124>>2]|0)!=0){r43=0;r46=r22;while(1){_pce_printf(13720,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r43+(r46+128)|0],r4));STACKTOP=r4;r22=r43+1|0;r24=HEAP32[r23>>2];if(r22>>>0<HEAP32[r24+124>>2]>>>0){r43=r22;r46=r24}else{break}}}_pce_puts(25736);r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)==0){_cmd_error(r2,21840);r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_pce_puts(21776);r46=r1+16|0;r43=HEAP32[r46>>2];if((HEAP32[r43+124>>2]|0)!=0){r23=0;r24=r43;while(1){_pce_printf(13720,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r23+(r24+128)|0],r4));STACKTOP=r4;r43=r23+1|0;r22=HEAP32[r46>>2];if(r43>>>0<HEAP32[r22+124>>2]>>>0){r23=r43;r24=r22}else{break}}}_pce_puts(25736);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,22696)|0)!=0){HEAP32[r20>>2]=1;_cmd_match_uint32(r2,r20);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r24=r1+70264|0;_pce_start(r24);r23=r1+70228|0;HEAP32[r23>>2]=HEAP32[r23>>2]&255;_rc759_clock_discontinuity(r1);r23=r1+16|0;r46=r1+70216|0;r22=HEAP32[_stdout>>2];r43=r21|0;r45=r21+12|0;r27=0;L212:while(1){if(r27>>>0>=HEAP32[r20>>2]>>>0){break}_e86_disasm_cur(HEAP32[r23>>2],r21);r44=HEAP32[r23>>2];r25=HEAP16[r44+22>>1];r32=HEAP16[r44+28>>1];r29=r44;r44=r32;while(1){if(r44<<16>>16!=r32<<16>>16){r47=r25;r48=r29;break}_rc759_clock(r1,1);r28=HEAP32[r23>>2];if((_bps_check(r46,HEAPU16[r28+22>>1],HEAPU16[r28+28>>1],r22)|0)!=0){break L212}if((HEAP32[r24>>2]|0)!=0){break L212}r28=HEAP32[r23>>2];r42=HEAP16[r28+22>>1];if(r42<<16>>16!=r25<<16>>16){r47=r42;r48=r28;break}r29=r28;r44=HEAP16[r28+28>>1]}L222:do{if((HEAP32[r43>>2]&768|0)==0){r49=r47;r50=HEAP16[r48+28>>1]}else{r44=HEAP32[r45>>2]+(r32&65535)&65535;r29=r48;r28=r47;while(1){if(r28<<16>>16==r25<<16>>16){if((HEAP16[r29+28>>1]|0)==r44<<16>>16){r49=r25;r50=r44;break L222}}_rc759_clock(r1,1);r42=HEAP32[r23>>2];if((_bps_check(r46,HEAPU16[r42+22>>1],HEAPU16[r42+28>>1],r22)|0)!=0){break L212}if((HEAP32[r24>>2]|0)!=0){break L212}r42=HEAP32[r23>>2];r29=r42;r28=HEAP16[r42+22>>1]}}}while(0);if((_bps_check(r46,r49&65535,r50&65535,r22)|0)!=0){break}if((HEAP32[r24>>2]|0)==0){r27=r27+1|0}else{break}}_pce_stop();r27=r30|0;_e86_disasm_cur(HEAP32[r23>>2],r19);_disasm_str(r27,r19);_print_state_cpu(HEAP32[r23>>2]);r19=HEAP32[r23>>2];r23=HEAPU16[r19+28>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r19+22>>1],HEAP32[r4+8>>2]=r23,HEAP32[r4+16>>2]=r27,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,22096)|0)!=0){r27=r18|0;if((_cmd_match_eol(r2)|0)!=0){_print_state_cpu(HEAP32[r1+16>>2]);r33=0;STACKTOP=r5;return r33}if((_cmd_match_ident(r2,r27,256)|0)==0){_pce_printf(22152,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}r18=r1+16|0;if((_e86_get_reg(HEAP32[r18>>2],r27,r17)|0)!=0){_pce_printf(22120,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r27,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){_pce_printf(22088,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r17>>2],r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_uint32(r2,r17)|0)==0){_pce_printf(22752,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}_e86_set_reg(HEAP32[r18>>2],r27,HEAP32[r17>>2]);r17=r30|0;_e86_disasm_cur(HEAP32[r18>>2],r16);_disasm_str(r17,r16);_print_state_cpu(HEAP32[r18>>2]);r16=HEAP32[r18>>2];r18=HEAPU16[r16+28>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r16+22>>1],HEAP32[r4+8>>2]=r18,HEAP32[r4+16>>2]=r17,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,21648)|0)!=0){r17=r30|0;if((_cmd_match_str(r2,r17,256)|0)==0){_cmd_error(r2,22784);r33=0;STACKTOP=r5;return r33}if((_cmd_match_uint16(r2,r15)|0)==0){_cmd_error(r2,22752);r33=0;STACKTOP=r5;return r33}do{if((_strcmp(r17,22720)|0)==0){_e8259_set_irq0(r1+20|0,HEAP16[r15>>1]&255)}else{if((_strcmp(r17,22680)|0)==0){_e8259_set_irq1(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22648)|0)==0){_e8259_set_irq2(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22448)|0)==0){_e8259_set_irq3(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22336)|0)==0){_e8259_set_irq4(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22296)|0)==0){_e8259_set_irq5(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22256)|0)==0){_e8259_set_irq6(r1+20|0,HEAP16[r15>>1]&255);break}if((_strcmp(r17,22216)|0)==0){_e8259_set_irq7(r1+20|0,HEAP16[r15>>1]&255);break}else{_pce_printf(22184,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r17,r4));STACKTOP=r4;break}}}while(0);_cmd_match_end(r2);r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,20632)|0)==0){if((_cmd_match(r2,20312)|0)!=0){HEAP32[r12>>2]=1;_cmd_match_uint32(r2,r12);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}r17=r1+70264|0;_pce_start(r17);_rc759_clock_discontinuity(r1);r15=r1+70228|0;r18=r1+16|0;r16=r1+70216|0;r27=HEAP32[_stdout>>2];r23=0;while(1){if(r23>>>0>=HEAP32[r12>>2]>>>0){break}HEAP32[r15>>2]=HEAP32[r15>>2]&255;r19=_e86_get_opcnt(HEAP32[r18>>2]);r24=tempRet0;while(1){r22=_e86_get_opcnt(HEAP32[r18>>2]);if(!((r22|0)==(r19|0)&(tempRet0|0)==(r24|0))){break}_rc759_clock(r1,1);if((HEAP32[r17>>2]|0)!=0){break}}r24=HEAP32[r18>>2];if((_bps_check(r16,HEAPU16[r24+22>>1],HEAPU16[r24+28>>1],r27)|0)!=0){break}if((HEAP32[r17>>2]|0)==0){r23=r23+1|0}else{break}}_pce_stop();r23=r30|0;_e86_disasm_cur(HEAP32[r18>>2],r11);_disasm_str(r23,r11);_print_state_cpu(HEAP32[r18>>2]);r11=HEAP32[r18>>2];r18=HEAPU16[r11+28>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r11+22>>1],HEAP32[r4+8>>2]=r18,HEAP32[r4+16>>2]=r23,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match(r2,20048)|0)==0){r33=1;STACKTOP=r5;return r33}r23=r30|0;if(HEAP8[608]){r51=HEAP16[26280>>1];r52=HEAP16[26288>>1]}else{HEAP8[608]=1;r18=HEAP32[r1+16>>2];r11=HEAP16[r18+22>>1];HEAP16[26280>>1]=r11;r17=HEAP16[r18+28>>1];HEAP16[26288>>1]=r17;r51=r11;r52=r17}HEAP16[r6>>1]=r51;HEAP16[r7>>1]=r52;HEAP16[r8>>1]=16;HEAP16[r9>>1]=0;if((_cmd_match_uint16_16(r2,r6,r7)|0)!=0){_cmd_match_uint16(r2,r8)}_cmd_match_uint16(r2,r9);if((_cmd_match_end(r2)|0)==0){r33=0;STACKTOP=r5;return r33}L332:do{if((HEAP16[r8>>1]|0)==0){r53=HEAP16[r7>>1]}else{r52=r1+16|0;r51=r10+12|0;r17=HEAP16[r7>>1];while(1){_e86_disasm_mem(HEAP32[r52>>2],r10,HEAP16[r6>>1],r17);_disasm_str(r23,r10);r11=HEAPU16[r7>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r6>>1],HEAP32[r4+8>>2]=r11,HEAP32[r4+16>>2]=r23,r4));STACKTOP=r4;r11=HEAP32[r51>>2];r54=HEAPU16[r7>>1]+r11&65535;HEAP16[r7>>1]=r54;r18=HEAP16[r8>>1];r27=r18&65535;if((HEAP16[r9>>1]|0)==0){r55=r18-1&65535}else{if(r27>>>0<r11>>>0){break}r55=r27-r11&65535}HEAP16[r8>>1]=r55;if(r55<<16>>16==0){r53=r54;break L332}else{r17=r54}}HEAP16[r8>>1]=0;r53=r54}}while(0);HEAP16[26280>>1]=HEAP16[r6>>1];HEAP16[26288>>1]=r53;r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){r53=r30|0;r30=r1+16|0;_e86_disasm_cur(HEAP32[r30>>2],r14);_disasm_str(r53,r14);_print_state_cpu(HEAP32[r30>>2]);r14=HEAP32[r30>>2];r30=HEAPU16[r14+28>>1];_pce_printf(13904,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAPU16[r14+22>>1],HEAP32[r4+8>>2]=r30,HEAP32[r4+16>>2]=r53,r4));STACKTOP=r4;r33=0;STACKTOP=r5;return r33}if((_cmd_match_eol(r2)|0)!=0){r33=0;STACKTOP=r5;return r33}r53=r1+68896|0;r30=r1+68908|0;r14=r1+68909|0;r6=r1+70152|0;r54=r1+68906|0;r8=r1+68904|0;r55=r1+68912|0;r9=r1+68913|0;r7=r1+68934|0;r23=r1+68920|0;r10=r1+68922|0;r17=r1+68924|0;r51=r1+68926|0;r52=r1+68928|0;r11=r1+68930|0;r27=r1+68932|0;r18=r1+68916|0;r16=r1+68954|0;r15=r1+68952|0;r12=r1+68942|0;r24=r1+68944|0;r19=r1+68936|0;r22=r1+68938|0;r50=r1+68940|0;r49=r1+68946|0;r46=r1+68948|0;r47=r1+68943|0;r48=r1+68945|0;r45=r1+68937|0;r43=r1+68939|0;r21=r1+68941|0;r20=r1+68947|0;r25=r1+68949|0;r32=r1+16|0;r28=r1+96|0;r29=r1+408|0;r44=r1+20|0;r42=r1+12|0;r41=HEAP32[_stdout>>2];r26=r1+4|0;r36=r1+196|0;r37=r1+198|0;r35=r13|0;r31=r13+1|0;r34=r13+2|0;r39=r13+3|0;r38=r13+4|0;r40=r13+5|0;r56=r13+6|0;r57=r13+7|0;r58=r13+8|0;r13=r1+280|0;r59=r1+960|0;r60=r1+963|0;r61=r1+962|0;r62=r1+66640|0;r63=r1+1032|0;r64=r1+1034|0;r65=r1+1040|0;r66=r1+1044|0;r67=r1+1060|0;r68=r1+1064|0;r69=r1+33836|0;r70=r1+33838|0;r71=r1+33844|0;r72=r1+33848|0;r73=r1+33864|0;r74=r1+33868|0;r75=r1+304|0;L353:while(1){L355:do{if((_cmd_match(r2,13312)|0)==0){if((_cmd_match(r2,13232)|0)!=0){_print_state_cpu(HEAP32[r32>>2]);break}if((_cmd_match(r2,13184)|0)!=0){_print_state_dma(r75);break}if((_cmd_match(r2,12872)|0)!=0){_pce_prt_sep(23344);r76=_rc759_fdc_get_fcr(r59)&255;r77=_rc759_fdc_get_reserve(r59)&255;_pce_printf(23192,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r76,HEAP32[r4+8>>2]=r77,r4));STACKTOP=r4;r77=HEAPU8[r61];_pce_printf(23088,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAPU8[r60],HEAP32[r4+8>>2]=r77,r4));STACKTOP=r4;r77=(HEAP32[HEAP32[r62>>2]+4>>2]|0)==0|0;r76=(HEAP8[r63]|0)!=0|0;r78=(HEAP8[r64]|0)!=0|0;r79=HEAP32[r65>>2];r80=HEAP32[r66>>2];r81=HEAP32[r67>>2];r82=HEAP32[r68>>2];_pce_printf(22944,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=0,HEAP32[r4+8>>2]=r77,HEAP32[r4+16>>2]=r76,HEAP32[r4+24>>2]=r78,HEAP32[r4+32>>2]=r79,HEAP32[r4+40>>2]=r80,HEAP32[r4+48>>2]=r81,HEAP32[r4+56>>2]=r82,r4));STACKTOP=r4;r82=(HEAP32[HEAP32[r62>>2]+4>>2]|0)==1|0;r81=(HEAP8[r69]|0)!=0|0;r80=(HEAP8[r70]|0)!=0|0;r79=HEAP32[r71>>2];r78=HEAP32[r72>>2];r76=HEAP32[r73>>2];r77=HEAP32[r74>>2];_pce_printf(22944,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=1,HEAP32[r4+8>>2]=r82,HEAP32[r4+16>>2]=r81,HEAP32[r4+24>>2]=r80,HEAP32[r4+32>>2]=r79,HEAP32[r4+40>>2]=r78,HEAP32[r4+48>>2]=r76,HEAP32[r4+56>>2]=r77,r4));STACKTOP=r4;break}if((_cmd_match(r2,12784)|0)!=0){r77=HEAP16[r37>>1]&255;r76=_e80186_icu_get_irr(r36)&255;r78=_e80186_icu_get_imr(r36)&255;r79=_e80186_icu_get_isr(r36)&255;_pce_prt_sep(23704);_pce_puts(25656);HEAP8[r35]=(r77&255)>>>7|48;HEAP8[r31]=(r77&255)>>>6&1|48;HEAP8[r34]=(r77&255)>>>5&1|48;HEAP8[r39]=(r77&255)>>>4&1|48;HEAP8[r38]=(r77&255)>>>3&1|48;HEAP8[r40]=(r77&255)>>>2&1|48;HEAP8[r56]=(r77&255)>>>1&1|48;HEAP8[r57]=r77&1|48;HEAP8[r58]=0;_pce_puts(r35);_pce_puts(23664);HEAP8[r35]=(r76&255)>>>7|48;HEAP8[r31]=(r76&255)>>>6&1|48;HEAP8[r34]=(r76&255)>>>5&1|48;HEAP8[r39]=(r76&255)>>>4&1|48;HEAP8[r38]=(r76&255)>>>3&1|48;HEAP8[r40]=(r76&255)>>>2&1|48;HEAP8[r56]=(r76&255)>>>1&1|48;HEAP8[r57]=r76&1|48;HEAP8[r58]=0;_pce_puts(r35);_pce_puts(23568);HEAP8[r35]=(r78&255)>>>7|48;HEAP8[r31]=(r78&255)>>>6&1|48;HEAP8[r34]=(r78&255)>>>5&1|48;HEAP8[r39]=(r78&255)>>>4&1|48;HEAP8[r38]=(r78&255)>>>3&1|48;HEAP8[r40]=(r78&255)>>>2&1|48;HEAP8[r56]=(r78&255)>>>1&1|48;HEAP8[r57]=r78&1|48;HEAP8[r58]=0;_pce_puts(r35);_pce_puts(23528);HEAP8[r35]=(r79&255)>>>7|48;HEAP8[r31]=(r79&255)>>>6&1|48;HEAP8[r34]=(r79&255)>>>5&1|48;HEAP8[r39]=(r79&255)>>>4&1|48;HEAP8[r38]=(r79&255)>>>3&1|48;HEAP8[r40]=(r79&255)>>>2&1|48;HEAP8[r56]=(r79&255)>>>1&1|48;HEAP8[r57]=r79&1|48;HEAP8[r58]=0;_pce_puts(r35);_pce_puts(25736);r80=_e80186_icu_get_pmr(r36)&65535;r81=_e80186_icu_get_pollst(r36)&65535;r82=HEAPU8[r13];_pce_printf(23480,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r80,HEAP32[r4+8>>2]=r81,HEAP32[r4+16>>2]=r82,r4));STACKTOP=r4;r82=0;r81=r77;r77=r76;r76=r78;r78=r79;while(1){if((r82|0)==1){r83=23376}else{r83=HEAP32[624+(r82<<2)>>2]}r79=_e80186_icu_get_icon(r36,r82)&65535;r80=HEAP32[r1+244+(r82<<2)>>2];_pce_printf(23408,(r4=STACKTOP,STACKTOP=STACKTOP+64|0,HEAP32[r4>>2]=r83,HEAP32[r4+8>>2]=r82,HEAP32[r4+16>>2]=r79,HEAP32[r4+24>>2]=r80,HEAP32[r4+32>>2]=r81&1,HEAP32[r4+40>>2]=r77&1,HEAP32[r4+48>>2]=r76&1,HEAP32[r4+56>>2]=r78&1,r4));STACKTOP=r4;r80=r82+1|0;if(r80>>>0<8){r82=r80;r81=(r81&255)>>>1;r77=(r77&255)>>>1;r76=(r76&255)>>>1;r78=(r78&255)>>>1}else{break L355}}}if((_cmd_match(r2,12744)|0)!=0){_pce_prt_sep(24536);_mem_prt_state(HEAP32[r26>>2],r41);break}if((_cmd_match(r2,12680)|0)!=0){_pce_prt_sep(24632);_mem_prt_state(HEAP32[r42>>2],r41);break}if((_cmd_match(r2,12624)|0)!=0){_print_state_pic(r44);break}if((_cmd_match(r2,12568)|0)!=0){_print_state_ppi(r29);break}if((_cmd_match(r2,12520)|0)!=0){_print_state_tcu(r28);break}if((_cmd_match(r2,12440)|0)==0){if((_cmd_match(r2,12376)|0)==0){break L353}_pce_prt_sep(12080);_pce_printf(11936,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r53>>2],r4));STACKTOP=r4;r78=(HEAP8[r14]|0)!=0|0;r76=(HEAP8[r6]|0)!=0|0;_pce_printf(11872,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=(HEAP8[r30]|0)!=0,HEAP32[r4+8>>2]=r78,HEAP32[r4+16>>2]=r76,r4));STACKTOP=r4;r76=HEAPU16[r8>>1];_pce_printf(11792,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAPU16[r54>>1],HEAP32[r4+8>>2]=r76,r4));STACKTOP=r4;r76=(HEAP8[r9]|0)!=0|0;_pce_printf(11712,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=(HEAP8[r55]|0)!=0,HEAP32[r4+8>>2]=r76,r4));STACKTOP=r4;_pce_printf(11664,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r7>>1],r4));STACKTOP=r4;_pce_printf(11584,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;_pce_printf(11504,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r23>>1],r4));STACKTOP=r4;_pce_printf(11432,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r10>>1],r4));STACKTOP=r4;_pce_printf(11392,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r17>>1],r4));STACKTOP=r4;_pce_printf(11128,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r51>>1],r4));STACKTOP=r4;_pce_printf(11024,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r52>>1],r4));STACKTOP=r4;_pce_printf(10984,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU16[r11>>1],r4));STACKTOP=r4;_pce_printf(10936,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r27],r4));STACKTOP=r4;_pce_printf(10880,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r18],r4));STACKTOP=r4;r76=HEAPU8[r12];r78=HEAPU8[r24];r77=HEAP8[r19]|0;r81=HEAP8[r22]|0;r82=HEAP8[r50]|0;r80=HEAPU16[r16>>1];r79=HEAPU16[r15>>1];r84=HEAPU8[r49];r85=HEAPU8[r46];_pce_printf(10736,(r4=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r4>>2]=1,HEAP32[r4+8>>2]=r76,HEAP32[r4+16>>2]=r78,HEAP32[r4+24>>2]=r77,HEAP32[r4+32>>2]=r81,HEAP32[r4+40>>2]=r82,HEAP32[r4+48>>2]=r80,HEAP32[r4+56>>2]=r79,HEAP32[r4+64>>2]=r84,HEAP32[r4+72>>2]=r85,r4));STACKTOP=r4;r85=HEAPU8[r47];r84=HEAPU8[r48];r79=HEAP8[r45]|0;r80=HEAP8[r43]|0;r82=HEAP8[r21]|0;r81=HEAPU16[r16>>1];r77=HEAPU16[r15>>1];r78=HEAPU8[r20];r76=HEAPU8[r25];_pce_printf(10736,(r4=STACKTOP,STACKTOP=STACKTOP+80|0,HEAP32[r4>>2]=2,HEAP32[r4+8>>2]=r85,HEAP32[r4+16>>2]=r84,HEAP32[r4+24>>2]=r79,HEAP32[r4+32>>2]=r80,HEAP32[r4+40>>2]=r82,HEAP32[r4+48>>2]=r81,HEAP32[r4+56>>2]=r77,HEAP32[r4+64>>2]=r78,HEAP32[r4+72>>2]=r76,r4));STACKTOP=r4;break}r76=HEAP32[r32>>2];_pce_prt_sep(10712);r78=r76+1216|0;r77=HEAP32[r78>>2];r81=HEAP32[r78+4>>2];r82=r76+1208|0;r80=HEAP32[r82>>2];r79=HEAP32[r82+4>>2];if((r77|0)==0&(r81|0)==0){r86=0}else{r86=((r80>>>0)+(r79>>>0)*4294967296)/((r77>>>0)+(r81>>>0)*4294967296)}r81=HEAP32[r76+1200>>2];_pce_printf(10656,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r80,HEAP32[r4+8>>2]=r79,HEAP32[r4+16>>2]=r81,r4));STACKTOP=r4;r81=HEAP32[r78+4>>2];_pce_printf(10608,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAP32[r78>>2],HEAP32[r4+8>>2]=r81,r4));STACKTOP=r4;_pce_printf(10568,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r4>>3]=r86,r4));STACKTOP=r4}else{_print_state_ppi(r29);_print_state_tcu(r28);_print_state_pic(r44);_print_state_dma(r75);r81=HEAP32[r32>>2];_pce_prt_sep(10712);r78=r81+1216|0;r79=HEAP32[r78>>2];r80=HEAP32[r78+4>>2];r76=r81+1208|0;r77=HEAP32[r76>>2];r82=HEAP32[r76+4>>2];if((r79|0)==0&(r80|0)==0){r87=0}else{r87=((r77>>>0)+(r82>>>0)*4294967296)/((r79>>>0)+(r80>>>0)*4294967296)}r80=HEAP32[r81+1200>>2];_pce_printf(10656,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r77,HEAP32[r4+8>>2]=r82,HEAP32[r4+16>>2]=r80,r4));STACKTOP=r4;r80=HEAP32[r78+4>>2];_pce_printf(10608,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=HEAP32[r78>>2],HEAP32[r4+8>>2]=r80,r4));STACKTOP=r4;_pce_printf(10568,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAPF64[r4>>3]=r87,r4));STACKTOP=r4;_print_state_cpu(HEAP32[r32>>2])}}while(0);if((_cmd_match_eol(r2)|0)!=0){r33=0;r3=231;break}}if(r3==231){STACKTOP=r5;return r33}_cmd_error(r2,12312);r33=0;STACKTOP=r5;return r33}function _rc759_cmd_init(r1,r2){_mon_cmd_add(r2,1184,16);_mon_cmd_add_bp(r2);r2=r1+16|0;HEAP32[HEAP32[r2>>2]+92>>2]=r1;HEAP32[HEAP32[r2>>2]+108>>2]=1160;HEAP32[HEAP32[r2>>2]+104>>2]=1200;return}function _pce_op_int(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r2&255;HEAP32[r1+70228>>2]=r5|256;if((_rc759_intlog_check(r1,r5)|0)==0){STACKTOP=r4;return}r2=HEAP32[r1+16>>2];r1=HEAPU16[r2+112>>1];r6=HEAPU16[r2+4>>1];r7=HEAPU16[r2+10>>1];r8=HEAPU16[r2+6>>1];r9=HEAPU16[r2+8>>1];r10=HEAPU16[r2+26>>1];r11=HEAPU16[r2+20>>1];_pce_printf(19448,(r3=STACKTOP,STACKTOP=STACKTOP+72|0,HEAP32[r3>>2]=HEAPU16[r2+22>>1],HEAP32[r3+8>>2]=r1,HEAP32[r3+16>>2]=r5,HEAP32[r3+24>>2]=r6,HEAP32[r3+32>>2]=r7,HEAP32[r3+40>>2]=r8,HEAP32[r3+48>>2]=r9,HEAP32[r3+56>>2]=r10,HEAP32[r3+64>>2]=r11,r3));STACKTOP=r3;STACKTOP=r4;return}function _pce_op_undef(r1,r2,r3){var r4,r5,r6,r7;r4=0;r5=STACKTOP;r6=HEAP32[r1+16>>2];r7=HEAPU16[r6+28>>1];_pce_log(3,19696,(r4=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r4>>2]=HEAPU16[r6+22>>1],HEAP32[r4+8>>2]=r7,HEAP32[r4+16>>2]=r2&255,HEAP32[r4+24>>2]=r3&255,r4));STACKTOP=r4;_pce_usleep(1e5);_trm_check(HEAP32[r1+70164>>2]);STACKTOP=r5;return}function _disasm_str(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r3=0;r4=0;r5=STACKTOP;_sprintf(r1,13792,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r2+16|0],r4));STACKTOP=r4;r6=r2+12|0;r7=r1+2|0;if(HEAP32[r6>>2]>>>0>1){r8=1;r9=2;r10=r7;while(1){_sprintf(r10,13720,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAPU8[r8+(r2+16)|0],r4));STACKTOP=r4;r11=r9+3|0;r12=r8+1|0;r13=r1+r11|0;if(r12>>>0<HEAP32[r6>>2]>>>0){r8=r12;r9=r11;r10=r13}else{break}}HEAP8[r13]=32;r13=r9+4|0;if(r13>>>0<20){r14=r11;r15=r13;r3=5}else{r16=r11;r17=r13}}else{HEAP8[r7]=32;r14=2;r15=3;r3=5}if(r3==5){_memset(r1+r15|0,32,19-r14|0)|0;r16=19;r17=20}r14=r2|0;r15=HEAP32[r14>>2];if((r15&-769|0)==0){r18=r17}else{r3=r16+2|0;HEAP8[r1+r17|0]=91;if((r15&1|0)==0){r19=r15;r20=r3}else{r17=r1+r3|0;tempBigInt=3553329;HEAP8[r17]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r17+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r17+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r17+3|0]=tempBigInt;r19=r15&-2;r20=r16+5|0}if((r19|0)==0){r21=r20}else{if((r19|0)==(HEAP32[r14>>2]|0)){r22=r20}else{HEAP8[r1+r20|0]=32;r22=r20+1|0}r20=_sprintf(r1+r22|0,13568,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r19,r4));STACKTOP=r4;r21=r20+r22|0}HEAP8[r1+r21|0]=93;HEAP8[r1+(r21+1)|0]=32;r18=r21+2|0}_strcpy(r1+r18|0,r2+32|0);r21=r18;r22=0;while(1){r23=r1+r21|0;r24=r21+1|0;if((HEAP8[r23]|0)==0){break}else{r21=r24;r22=r22+1|0}}r20=r2+96|0;if((HEAP32[r20>>2]|0)==0){r25=r21;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}HEAP8[r23]=32;if(r24>>>0<26){_memset(r1+(r18+1+r22)|0,32,25-r18-r22|0)|0;r27=26}else{r27=r24}r24=HEAP32[r20>>2];if((r24|0)==1){r20=r2+100|0;r22=_strlen(r20);_memcpy(r1+r27|0,r20,r22+1|0)|0;r25=r22+r27|0;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}else if((r24|0)==2){r24=_sprintf(r1+r27|0,13416,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2+100,HEAP32[r4+8>>2]=r2+164,r4));STACKTOP=r4;r25=r24+r27|0;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}else{r25=r27;r26=r1+r25|0;HEAP8[r26]=0;STACKTOP=r5;return}}function _print_state_dma(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;_pce_prt_sep(22896);r4=_e80186_dma_get_control(r1,0)&65535;r5=_e80186_dma_get_count(r1,0)&65535;r6=_e80186_dma_get_src(r1,0);r7=_e80186_dma_get_dst(r1,0);_pce_printf(22816,(r2=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r2>>2]=0,HEAP32[r2+8>>2]=r4,HEAP32[r2+16>>2]=r5,HEAP32[r2+24>>2]=r6,HEAP32[r2+32>>2]=r7,r2));STACKTOP=r2;r7=_e80186_dma_get_control(r1,1)&65535;r6=_e80186_dma_get_count(r1,1)&65535;r5=_e80186_dma_get_src(r1,1);r4=_e80186_dma_get_dst(r1,1);_pce_printf(22816,(r2=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r2>>2]=1,HEAP32[r2+8>>2]=r7,HEAP32[r2+16>>2]=r6,HEAP32[r2+24>>2]=r5,HEAP32[r2+32>>2]=r4,r2));STACKTOP=r2;STACKTOP=r3;return}function _print_state_pic(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;_pce_prt_sep(25688);_pce_puts(25656);r5=HEAP8[r1+10|0];r6=r4|0;HEAP8[r6]=(r5&255)>>>7|48;r7=r4+1|0;HEAP8[r7]=(r5&255)>>>6&1|48;r8=r4+2|0;HEAP8[r8]=(r5&255)>>>5&1|48;r9=r4+3|0;HEAP8[r9]=(r5&255)>>>4&1|48;r10=r4+4|0;HEAP8[r10]=(r5&255)>>>3&1|48;r11=r4+5|0;HEAP8[r11]=(r5&255)>>>2&1|48;r12=r4+6|0;HEAP8[r12]=(r5&255)>>>1&1|48;r13=r4+7|0;HEAP8[r13]=r5&1|48;r5=r4+8|0;HEAP8[r5]=0;_pce_puts(r6);_pce_puts(25736);_pce_puts(25632);r4=_e8259_get_irr(r1);HEAP8[r6]=(r4&255)>>>7|48;HEAP8[r7]=(r4&255)>>>6&1|48;HEAP8[r8]=(r4&255)>>>5&1|48;HEAP8[r9]=(r4&255)>>>4&1|48;HEAP8[r10]=(r4&255)>>>3&1|48;HEAP8[r11]=(r4&255)>>>2&1|48;HEAP8[r12]=(r4&255)>>>1&1|48;HEAP8[r13]=r4&1|48;HEAP8[r5]=0;_pce_puts(r6);_pce_printf(25600,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r1+24>>2],r2));STACKTOP=r2;_pce_puts(25544);r4=_e8259_get_imr(r1);HEAP8[r6]=(r4&255)>>>7|48;HEAP8[r7]=(r4&255)>>>6&1|48;HEAP8[r8]=(r4&255)>>>5&1|48;HEAP8[r9]=(r4&255)>>>4&1|48;HEAP8[r10]=(r4&255)>>>3&1|48;HEAP8[r11]=(r4&255)>>>2&1|48;HEAP8[r12]=(r4&255)>>>1&1|48;HEAP8[r13]=r4&1|48;HEAP8[r5]=0;_pce_puts(r6);_pce_printf(25512,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(HEAP8[r1+72|0]|0)!=0,r2));STACKTOP=r2;_pce_puts(25376);r4=_e8259_get_isr(r1);HEAP8[r6]=(r4&255)>>>7|48;HEAP8[r7]=(r4&255)>>>6&1|48;HEAP8[r8]=(r4&255)>>>5&1|48;HEAP8[r9]=(r4&255)>>>4&1|48;HEAP8[r10]=(r4&255)>>>3&1|48;HEAP8[r11]=(r4&255)>>>2&1|48;HEAP8[r12]=(r4&255)>>>1&1|48;HEAP8[r13]=r4&1|48;HEAP8[r5]=0;_pce_puts(r6);_pce_puts(25736);r6=_e8259_get_icw(r1,0)&255;r5=_e8259_get_icw(r1,1)&255;r4=_e8259_get_icw(r1,2)&255;r13=_e8259_get_icw(r1,3)&255;r12=_e8259_get_ocw(r1,0)&255;r11=_e8259_get_ocw(r1,1)&255;r10=_e8259_get_ocw(r1,2)&255;_pce_printf(25024,(r2=STACKTOP,STACKTOP=STACKTOP+56|0,HEAP32[r2>>2]=r6,HEAP32[r2+8>>2]=r5,HEAP32[r2+16>>2]=r4,HEAP32[r2+24>>2]=r13,HEAP32[r2+32>>2]=r12,HEAP32[r2+40>>2]=r11,HEAP32[r2+48>>2]=r10,r2));STACKTOP=r2;_pce_printf(24800,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r1+32>>2],r2));STACKTOP=r2;r10=HEAP32[r1+36>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=1,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+40>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=2,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+44>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=3,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+48>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=4,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+52>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=5,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+56>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=6,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;r10=HEAP32[r1+60>>2];_pce_printf(24696,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=7,HEAP32[r2+8>>2]=r10,r2));STACKTOP=r2;_pce_puts(25736);STACKTOP=r3;return}function _print_state_ppi(r1){var r2,r3,r4,r5,r6;r2=0;r3=STACKTOP;_pce_prt_sep(10120);r4=HEAPU8[r1|0];r5=HEAPU8[r1+1|0];_pce_printf(10048,(r2=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r2>>2]=HEAPU8[r1+2|0],HEAP32[r2+8>>2]=r4,HEAP32[r2+16>>2]=r5,r2));STACKTOP=r2;if((HEAP8[r1+6|0]|0)==0){r5=_e8255_get_out(r1,0)&255;_pce_printf(9944,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}else{r5=_e8255_get_inp(r1,0)&255;_pce_printf(9992,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}if((HEAP8[r1+26|0]|0)==0){r5=_e8255_get_out(r1,1)&255;_pce_printf(9832,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}else{r5=_e8255_get_inp(r1,1)&255;_pce_printf(9912,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r5,r2));STACKTOP=r2}r5=HEAPU8[r1+46|0];if((r5|0)==255){r4=_e8255_get_inp(r1,2)&255;_pce_printf(26152,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r4,r2));STACKTOP=r2;_pce_puts(25736);STACKTOP=r3;return}else if((r5|0)==0){r4=_e8255_get_out(r1,2)&255;_pce_printf(26104,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r4,r2));STACKTOP=r2;_pce_puts(25736);STACKTOP=r3;return}else if((r5|0)==15){r4=(_e8255_get_out(r1,2)&255)>>>4;r6=_e8255_get_inp(r1,2)&15;_pce_printf(25888,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r4,HEAP32[r2+8>>2]=r6,r2));STACKTOP=r2;_pce_puts(25736);STACKTOP=r3;return}else if((r5|0)==240){r5=(_e8255_get_inp(r1,2)&255)>>>4;r6=_e8255_get_out(r1,2)&15;_pce_printf(25760,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=r5,HEAP32[r2+8>>2]=r6,r2));STACKTOP=r2;_pce_puts(25736);STACKTOP=r3;return}else{_pce_puts(25736);STACKTOP=r3;return}}function _print_state_tcu(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=STACKTOP;_pce_prt_sep(10296);r4=_e80186_tcu_get_control(r1,0)&65535;r5=_e80186_tcu_get_count(r1,0)&65535;r6=_e80186_tcu_get_max_count_a(r1,0)&65535;r7=_e80186_tcu_get_max_count_b(r1,0)&65535;_pce_printf(10160,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=(r4&32768|0)!=0?42:32,HEAP32[r2+8>>2]=0,HEAP32[r2+16>>2]=r4,HEAP32[r2+24>>2]=r5,HEAP32[r2+32>>2]=r6,HEAP32[r2+40>>2]=r7,r2));STACKTOP=r2;r7=_e80186_tcu_get_control(r1,1)&65535;r6=_e80186_tcu_get_count(r1,1)&65535;r5=_e80186_tcu_get_max_count_a(r1,1)&65535;r4=_e80186_tcu_get_max_count_b(r1,1)&65535;_pce_printf(10160,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=(r7&32768|0)!=0?42:32,HEAP32[r2+8>>2]=1,HEAP32[r2+16>>2]=r7,HEAP32[r2+24>>2]=r6,HEAP32[r2+32>>2]=r5,HEAP32[r2+40>>2]=r4,r2));STACKTOP=r2;r4=_e80186_tcu_get_control(r1,2)&65535;r5=_e80186_tcu_get_count(r1,2)&65535;r6=_e80186_tcu_get_max_count_a(r1,2)&65535;r7=_e80186_tcu_get_max_count_b(r1,2)&65535;_pce_printf(10160,(r2=STACKTOP,STACKTOP=STACKTOP+48|0,HEAP32[r2>>2]=(r4&32768|0)!=0?42:32,HEAP32[r2+8>>2]=2,HEAP32[r2+16>>2]=r4,HEAP32[r2+24>>2]=r5,HEAP32[r2+32>>2]=r6,HEAP32[r2+40>>2]=r7,r2));STACKTOP=r2;STACKTOP=r3;return}function _rc759_fdc_init(r1){var r2,r3;r2=r1|0;_wd179x_init(r2);r3=r1|0;_wd179x_set_read_track_fct(r2,r3,892);_wd179x_set_write_track_fct(r2,r3,466);_wd179x_set_ready(r2,0,0);_wd179x_set_ready(r2,1,0);HEAP8[r1+65741|0]=0;HEAP8[r1+65748|0]=0;HEAP32[r1+65752>>2]=0;HEAP16[r1+65760>>1]=-1;HEAP32[r1+65764>>2]=0;HEAP8[r1+65772|0]=0;HEAP8[r1+65749|0]=0;HEAP32[r1+65756>>2]=0;HEAP16[r1+65762>>1]=-1;HEAP32[r1+65768>>2]=0;HEAP8[r1+65773|0]=0;return}function _rc759_read_track(r1,r2){var r3,r4,r5;r3=HEAP32[r1+65764+((HEAP32[r2+4>>2]&1)<<2)>>2];if((r3|0)==0){r4=1;return r4}r1=_pri_img_get_track(r3,HEAP32[r2+8>>2],HEAP32[r2+12>>2],0);if((r1|0)==0){r4=1;return r4}r3=r1+4|0;r5=HEAP32[r3>>2]+7|0;if(r5>>>0>262151){r4=1;return r4}_memcpy(r2+36|0,HEAP32[r1+8>>2],r5>>>3)|0;HEAP32[r2+32>>2]=HEAP32[r3>>2];r4=0;return r4}function _rc759_write_track(r1,r2){var r3,r4,r5;r3=HEAP32[r2+4>>2]&1;r4=HEAP32[r1+65764+(r3<<2)>>2];if((r4|0)==0){r5=1;return r5}HEAP8[r1+(r3|65772)|0]=1;r3=_pri_img_get_track(r4,HEAP32[r2+8>>2],HEAP32[r2+12>>2],1);if((r3|0)==0){r5=1;return r5}if((_pri_trk_set_size(r3,HEAP32[r2+32>>2])|0)!=0){r5=1;return r5}_pri_trk_set_clock(r3,1e6);_memcpy(HEAP32[r3+8>>2],r2+36|0,(HEAP32[r3+4>>2]+7|0)>>>3)|0;r5=0;return r5}function _rc759_fdc_save(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1024|0;r6=r5;r7=r1+65764+(r2<<2)|0;if((HEAP32[r7>>2]|0)==0){r8=1;STACKTOP=r5;return r8}r9=r2+(r1+65772)|0;if((HEAP8[r9]|0)==0){r8=0;STACKTOP=r5;return r8}_sim_log_deb(16200,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;L7:do{if((HEAP8[r2+(r1+65748)|0]|0)==0){r10=_dsks_get_disk(HEAP32[r1+65744>>2],HEAPU16[r1+65760+(r2<<1)>>1]);do{if((r10|0)!=0){r11=_pri_decode_mfm(HEAP32[r7>>2]);if((r11|0)==0){break}if((_dsk_get_type(r10)|0)==6){r12=HEAP32[r10+64>>2];r13=r12+68|0;_psi_img_del(HEAP32[r13>>2]);HEAP32[r13>>2]=r11;HEAP8[r12+72|0]=1;break L7}r12=r6|0;r13=0;r14=0;L15:while(1){r15=r14;r16=0;while(1){if(r16>>>0>=8){r17=r15;r18=0;break}r19=r16+1|0;r20=_psi_img_get_sector(r11,r13,0,r19,0);if((r20|0)==0){_memset(r12,0,1024)|0}else{r21=HEAP16[r20+10>>1];r22=r21&65535;if((r21&65535)<1024){_memset(r6+r22|0,0,1024-r22|0)|0;r23=r22}else{r23=1024}_memcpy(r12,HEAP32[r20+24>>2],r23)|0}if((_dsk_write_lba(r10,r12,r15,2)|0)==0){r15=r15+2|0;r16=r19}else{r3=30;break L15}}while(1){if(r18>>>0>=8){break}r16=r18+1|0;r15=_psi_img_get_sector(r11,r13,1,r16,0);if((r15|0)==0){_memset(r12,0,1024)|0}else{r19=HEAP16[r15+10>>1];r20=r19&65535;if((r19&65535)<1024){_memset(r6+r20|0,0,1024-r20|0)|0;r24=r20}else{r24=1024}_memcpy(r12,HEAP32[r15+24>>2],r24)|0}if((_dsk_write_lba(r10,r12,r17,2)|0)==0){r17=r17+2|0;r18=r16}else{r3=29;break L15}}r16=r13+1|0;if(r16>>>0<77){r13=r16;r14=r17}else{r3=28;break}}if(r3==28){_psi_img_del(r11);break L7}else if(r3==29){_psi_img_del(r11);break}else if(r3==30){_psi_img_del(r11);break}}}while(0);_sim_log_deb(13424,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}else{r10=HEAP32[r1+65752+(r2<<2)>>2];if((r10|0)!=0){if((_pri_img_save(r10,HEAP32[r7>>2],0)|0)==0){break}}_sim_log_deb(14672,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}}while(0);HEAP8[r9]=0;r8=0;STACKTOP=r5;return r8}function _rc759_fdc_reset(r1){_wd179x_reset(r1|0);HEAP8[r1+65740|0]=0;HEAP8[r1+65741|0]=0;return}function _rc759_fdc_set_disks(r1,r2){HEAP32[r1+65744>>2]=r2;return}function _rc759_fdc_set_disk_id(r1,r2,r3){HEAP16[r1+65760+(r2<<1)>>1]=r3;return}function _rc759_fdc_set_fname(r1,r2,r3){var r4;if(r2>>>0>1){return}r4=r1+65752+(r2<<2)|0;_free(HEAP32[r4>>2]);HEAP32[r4>>2]=0;HEAP8[r2+(r1+65748)|0]=0;if((r3|0)==0){return}r1=_strlen(r3)+1|0;r2=_malloc(r1);if((r2|0)==0){return}_memcpy(r2,r3,r1)|0;HEAP32[r4>>2]=r2;return}function _rc759_fdc_load(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=0;r4=0;r5=STACKTOP;r6=r1|0;_wd179x_set_ready(r6,r2,0);r7=r2+(r1+65748)|0;HEAP8[r7]=0;r8=HEAP32[r1+65752+(r2<<2)>>2];do{if((r8|0)==0){r3=4}else{r9=_pri_img_load(r8,1);if((r9|0)==0){r3=4;break}HEAP8[r7]=1;_sim_log_deb(13624,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r10=r9}}while(0);L4:do{if(r3==4){r7=_dsks_get_disk(HEAP32[r1+65744>>2],HEAPU16[r1+65760+(r2<<1)>>1]);L6:do{if((r7|0)!=0){L8:do{if((_dsk_get_type(r7)|0)==6){r11=0;r12=HEAP32[HEAP32[r7+64>>2]+68>>2];r3=19}else{r8=_psi_img_new();if((r8|0)==0){break L6}r9=_dsk_get_block_cnt(r7)>>>5;if((r9|0)==0){r13=r8;r14=r8;break}else{r15=0;r16=0}L11:while(1){r17=r15;r18=0;while(1){if(r18>>>0>=8){r19=r17;r20=0;break}r21=r18+1|0;r22=_psi_sct_new(r16,0,r21,1024);if((r22|0)==0){r3=12;break L11}_psi_sct_set_encoding(r22,32770);_psi_img_add_sector(r8,r22,r16,0);if((_dsk_read_lba(r7,HEAP32[r22+24>>2],r17,2)|0)==0){r17=r17+2|0;r18=r21}else{r3=14;break L11}}while(1){if(r20>>>0>=8){break}r18=r20+1|0;r17=_psi_sct_new(r16,1,r18,1024);if((r17|0)==0){r3=12;break L11}_psi_sct_set_encoding(r17,32770);_psi_img_add_sector(r8,r17,r16,1);if((_dsk_read_lba(r7,HEAP32[r17+24>>2],r19,2)|0)==0){r19=r19+2|0;r20=r18}else{r3=14;break L11}}r18=r16+1|0;if(r18>>>0<r9>>>0){r15=r19;r16=r18}else{r11=r8;r12=r8;r3=19;break L8}}if(r3==12){_psi_img_del(r8);break L6}else if(r3==14){_psi_img_del(r8);break L6}}}while(0);if(r3==19){if((r12|0)==0){break}else{r13=r12;r14=r11}}r9=_pri_encode_mfm_hd_360(r13);_psi_img_del(r14);if((r9|0)==0){break}_sim_log_deb(20440,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r10=r9;break L4}}while(0);_sim_log_deb(17816,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r2,r4));STACKTOP=r4;r23=1;STACKTOP=r5;return r23}}while(0);r4=r1+65764+(r2<<2)|0;_pri_img_del(HEAP32[r4>>2]);HEAP32[r4>>2]=r10;HEAP8[r2+(r1+65772)|0]=0;_wd179x_set_ready(r6,r2,1);r23=0;STACKTOP=r5;return r23}function _rc759_fdc_get_reserve(r1){return HEAP8[r1+65740|0]}function _rc759_fdc_set_reserve(r1,r2){HEAP8[r1+65740|0]=r2<<24>>24==0?-128:0;return}function _rc759_fdc_get_fcr(r1){return HEAP8[r1+65741|0]}function _rc759_fdc_set_fcr(r1,r2){var r3,r4;r3=r1+65741|0;r4=r2&255;if((HEAP8[r3]|0)==r2<<24>>24){return}HEAP8[r3]=r2;r2=r1|0;_wd179x_select_drive(r2,r4&1);_wd179x_set_motor(r2,0,r4>>>1&1);_wd179x_set_motor(r2,1,r4>>>2&1);return}function _rc759_kbd_init(r1){var r2;HEAP8[r1|0]=0;HEAP32[r1+4>>2]=0;HEAP8[r1+8|0]=0;HEAP8[r1+9|0]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;r2=r1+276|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;return}function _rc759_kbd_set_irq_fct(r1,r2,r3){HEAP32[r1+292>>2]=r2;HEAP32[r1+296>>2]=r3;return}function _rc759_kbd_reset(r1){var r2,r3,r4;r2=0;r3=STACKTOP;_sim_log_deb(20368,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;if((HEAP32[3688>>2]|0)!=0){r2=3688;while(1){HEAP8[r2+16|0]=0;r4=r2+20|0;if((HEAP32[r4>>2]|0)==0){break}else{r2=r4}}}HEAP8[r1+8|0]=0;HEAP8[r1+9|0]=1;HEAP32[r1+4>>2]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=2;HEAP8[r1+20|0]=-1;HEAP8[r1+21|0]=-28;HEAP32[r1+276>>2]=0;HEAP32[r1+280>>2]=0;HEAP32[r1+284>>2]=HEAP32[r1+288>>2];r2=HEAP32[r1+296>>2];if((r2|0)==0){STACKTOP=r3;return}FUNCTION_TABLE[r2](HEAP32[r1+292>>2],0);STACKTOP=r3;return}function _rc759_kbd_set_enable(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r2<<24>>24!=0;r2=r1|0;if((HEAPU8[r2]|0)==(r5&1|0)){STACKTOP=r4;return}HEAP8[r2]=r5&1;if(!r5){STACKTOP=r4;return}_sim_log_deb(20368,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;if((HEAP32[3688>>2]|0)!=0){r3=3688;while(1){HEAP8[r3+16|0]=0;r5=r3+20|0;if((HEAP32[r5>>2]|0)==0){break}else{r3=r5}}}HEAP8[r1+8|0]=0;HEAP8[r1+9|0]=1;HEAP32[r1+4>>2]=0;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=2;HEAP8[r1+20|0]=-1;HEAP8[r1+21|0]=-28;HEAP32[r1+276>>2]=0;HEAP32[r1+280>>2]=0;HEAP32[r1+284>>2]=HEAP32[r1+288>>2];r3=HEAP32[r1+296>>2];if((r3|0)==0){STACKTOP=r4;return}FUNCTION_TABLE[r3](HEAP32[r1+292>>2],0);STACKTOP=r4;return}function _rc759_kbd_set_mouse(r1,r2,r3,r4){var r5;r5=r1+276|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r2;r2=r1+280|0;HEAP32[r2>>2]=HEAP32[r2>>2]-r3;HEAP32[r1+288>>2]=r4;_rc759_kbd_check_mouse(r1);return}function _rc759_kbd_check_mouse(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r2=0;r3=0;r4=STACKTOP;r5=r1+12|0;r6=HEAP32[r5>>2];r7=r1+16|0;if((r6|0)!=(HEAP32[r7>>2]|0)){STACKTOP=r4;return}r8=r1+276|0;r9=HEAP32[r8>>2];do{if((r9|0)==0){do{if((HEAP32[r1+280>>2]|0)==0){if((HEAP32[r1+284>>2]|0)!=(HEAP32[r1+288>>2]|0)){break}STACKTOP=r4;return}}while(0);r10=HEAP32[r1+288>>2];HEAP32[r1+284>>2]=r10;r11=r10;r2=8}else{r10=HEAP32[r1+288>>2];HEAP32[r1+284>>2]=r10;if((r9|0)>=0){r11=r10;r2=8;break}r12=(r9|0)<-128?-128:r9;r13=r12&255;r14=r12;r15=r10}}while(0);if(r2==8){r2=(r9|0)>127?127:r9;r13=r2&255;r14=r2;r15=r11}r11=r9-r14|0;HEAP32[r8>>2]=r11;r14=r1+280|0;r9=HEAP32[r14>>2];if((r9|0)<0){r2=(r9|0)<-128?-128:r9;r16=r2&255;r17=r2}else{r2=(r9|0)>127?127:r9;r16=r2&255;r17=r2}r2=r9-r17|0;HEAP32[r14>>2]=r2;if((r11|0)<0){r17=(r11|0)<-128?-128:r11;r18=r17&255;r19=r17}else{r17=(r11|0)>127?127:r11;r18=r17&255;r19=r17}HEAP32[r8>>2]=r11-r19;if((r2|0)<0){r19=(r2|0)<-128?-128:r2;r20=r19&255;r21=r19}else{r19=(r2|0)>127?127:r2;r20=r19&255;r21=r19}HEAP32[r14>>2]=r2-r21;r21=(r15&1|0)==0?-121:-125;r2=(r15&2|0)==0?r21:r21&-123;r21=(r15&4|0)==0?r2:r2&-122;r2=r6+1&255;do{if((r2|0)!=(r6|0)){HEAP8[r6+(r1+20)|0]=-29;HEAP32[r7>>2]=r2;r15=r6+2&255;if((r15|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r2+(r1+20)|0]=r21;HEAP32[r7>>2]=r15;r14=r6+3&255;if((r14|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r15+(r1+20)|0]=-29;HEAP32[r7>>2]=r14;r15=r6+4&255;if((r15|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r14+(r1+20)|0]=r13;HEAP32[r7>>2]=r15;r14=r6+5&255;if((r14|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r15+(r1+20)|0]=-29;HEAP32[r7>>2]=r14;r15=r6+6&255;if((r15|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r14+(r1+20)|0]=r16;HEAP32[r7>>2]=r15;r14=r6+7&255;if((r14|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r15+(r1+20)|0]=-29;HEAP32[r7>>2]=r14;r15=r6+8&255;if((r15|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r14+(r1+20)|0]=r18;HEAP32[r7>>2]=r15;r14=r6+9&255;if((r14|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r15+(r1+20)|0]=-29;HEAP32[r7>>2]=r14;r15=r6+10&255;if((r15|0)==(HEAP32[r5>>2]|0)){break}HEAP8[r14+(r1+20)|0]=r20;HEAP32[r7>>2]=r15;STACKTOP=r4;return}}while(0);_pce_log(0,15448,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;STACKTOP=r4;return}function _rc759_kbd_set_key(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=0;r6=STACKTOP;if((r2|0)==3){_pce_log(2,24440,(r5=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r5>>2]=r3,r5));STACKTOP=r5;STACKTOP=r6;return}else{r7=3688}while(1){r8=HEAP32[r7>>2];r9=(r8|0)==0;if(r9|(r8|0)==(r3|0)){break}else{r7=r7+20|0}}if(r9){r9=_pce_key_to_string(r3);_pce_log(2,18744,(r5=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r3,HEAP32[r5+16>>2]=(r9|0)!=0?r9:16920,r5));STACKTOP=r5;STACKTOP=r6;return}if((r2|0)==1){HEAP8[r7+16|0]=1;r9=HEAP16[r7+4>>1];r3=r9&65535;if(r9<<16>>16==0){STACKTOP=r6;return}r9=r1+16|0;r8=r1+12|0;r10=0;r11=HEAP32[r9>>2];while(1){r12=r11+1&255;if((r12|0)==(HEAP32[r8>>2]|0)){break}HEAP8[r11+(r1+20)|0]=HEAP8[r10+(r7+6)|0];HEAP32[r9>>2]=r12;r13=r10+1|0;if(r13>>>0<r3>>>0){r10=r13;r11=r12}else{r4=18;break}}if(r4==18){STACKTOP=r6;return}_pce_log(0,15448,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else if((r2|0)==2){r2=r7+16|0;if((HEAP8[r2]|0)==0){STACKTOP=r6;return}HEAP8[r2]=0;r2=HEAP16[r7+10>>1];r11=r2&65535;if(r2<<16>>16==0){STACKTOP=r6;return}r2=r1+16|0;r10=r1+12|0;r3=0;r9=HEAP32[r2>>2];while(1){r8=r9+1&255;if((r8|0)==(HEAP32[r10>>2]|0)){break}HEAP8[r9+(r1+20)|0]=HEAP8[r3+(r7+12)|0];HEAP32[r2>>2]=r8;r12=r3+1|0;if(r12>>>0<r11>>>0){r3=r12;r9=r8}else{r4=18;break}}if(r4==18){STACKTOP=r6;return}_pce_log(0,15448,(r5=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r5>>2]=0,r5));STACKTOP=r5;STACKTOP=r6;return}else{STACKTOP=r6;return}}function _rc759_kbd_get_key(r1){var r2,r3;r2=r1+9|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;HEAP32[r1+4>>2]=6e4;r3=HEAP32[r1+296>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+292>>2],0)}}while(0);return HEAP8[r1+8|0]}function _rc759_kbd_clock(r1,r2){var r3,r4,r5,r6;r3=r1+12|0;r4=HEAP32[r3>>2];if((r4|0)==(HEAP32[r1+16>>2]|0)){return}if((HEAP8[r1|0]|0)==0){return}r5=r1+4|0;r6=HEAP32[r5>>2];if(r6>>>0>r2>>>0){HEAP32[r5>>2]=r6-r2;return}r2=r1+9|0;if((HEAP8[r2]|0)!=0){return}HEAP32[r5>>2]=6e4;HEAP8[r1+8|0]=HEAP8[r4+(r1+20)|0];HEAP8[r2]=1;HEAP32[r3>>2]=r4+1&255;_rc759_kbd_check_mouse(r1);r4=HEAP32[r1+296>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+292>>2],1);return}function _sim_log_deb(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=HEAP32[30440>>2];if((r6|0)==0){r7=0;r8=0}else{r9=HEAP32[r6+16>>2];r7=HEAPU16[r9+28>>1];r8=HEAPU16[r9+22>>1]}_pce_log(3,20176,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r8,HEAP32[r3+8>>2]=r7,r3));STACKTOP=r3;r3=r5;HEAP32[r3>>2]=r2;HEAP32[r3+4>>2]=0;_pce_log_va(3,r1,r5|0);STACKTOP=r4;return}function _main(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87;r3=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;_pce_log_init();r7=HEAP32[_stderr>>2];r8=_pce_log_add_fp(r7,0,2);r9=_ini_sct_new(0);HEAP32[31776>>2]=r9;r10=(r9|0)==0;if(r10){r11=1;STACKTOP=r5;return r11}_ini_str_init(31752);r12=_pce_getopt(r1,r2,r6,1376);r13=(r12|0)==-1;L4:do{if(!r13){r14=r12;L5:while(1){r15=(r14|0)<0;if(r15){r11=1;r3=23;break}switch(r14|0){case 0:{r3=18;break L5;break};case 105:{r16=HEAP32[31776>>2];r17=HEAP32[r6>>2];r18=HEAP32[r17>>2];r19=_ini_read_str(r16,r18);r20=(r19|0)==0;if(!r20){r3=10;break L5}break};case 103:{r21=HEAP32[r6>>2];r22=HEAP32[r21>>2];HEAP32[30424>>2]=r22;break};case 118:{_pce_log_set_level(r7,3);break};case 99:case 114:case 82:{break};case 108:{r23=HEAP32[r6>>2];r24=HEAP32[r23>>2];r25=_pce_log_add_fname(r24,3);break};case 113:{_pce_log_set_level(r7,0);break};case 100:{r26=HEAP32[r6>>2];r27=HEAP32[r26>>2];r28=_pce_path_set(r27);break};case 86:{r3=6;break L5;break};case 73:{r29=HEAP32[r6>>2];r30=HEAP32[r29>>2];r31=_ini_str_add(31752,r30,18728,0);break};case 63:{r3=5;break L5;break};case 116:{r32=HEAP32[r6>>2];r33=HEAP32[r32>>2];HEAP32[30432>>2]=r33;break};case 115:{r34=HEAP32[r6>>2];r35=HEAP32[r34>>2];r36=_ini_str_add(31752,16888,r35,18728);break};default:{r11=1;r3=23;break L5}}r37=_pce_getopt(r1,r2,r6,1376);r38=(r37|0)==-1;if(r38){break L4}else{r14=r37}}if(r3==5){_pce_getopt_help(20472,20192,1376);r39=HEAP32[_stdout>>2];r40=_fflush(r39);r11=0;STACKTOP=r5;return r11}else if(r3==6){r41=HEAP32[_stdout>>2];r42=_fwrite(21392,82,1,r41);r43=_fflush(r41);r11=0;STACKTOP=r5;return r11}else if(r3==10){r44=HEAP32[r2>>2];r45=HEAP32[r6>>2];r46=HEAP32[r45>>2];r47=_fprintf(r7,24368,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r44,HEAP32[r4+8>>2]=r46,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}else if(r3==18){r48=HEAP32[r2>>2];r49=HEAP32[r6>>2];r50=HEAP32[r49>>2];r51=_fprintf(r7,15400,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r48,HEAP32[r4+8>>2]=r50,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}else if(r3==23){STACKTOP=r5;return r11}}}while(0);_pce_log_set_level(r7,3);_pce_log(1,21872,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;_pce_log_tag(2,23880,23216,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=13928,r4));STACKTOP=r4;r52=HEAP32[31776>>2];r53=_ini_read(r52,13928);r54=(r53|0)==0;if(!r54){_pce_log(0,22464,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r11=1;STACKTOP=r5;return r11}r55=HEAP32[31776>>2];r56=_ini_next_sct(r55,0,12888);r57=(r56|0)==0;r58=HEAP32[31776>>2];r59=r57?r58:r56;r60=_ini_str_eval(31752,r59,1);r61=(r60|0)==0;if(r61){r62=_atexit(744);r63=_SDL_Init(0);r64=_pce_path_ini(r59);r65=_rc759_new(r59);HEAP32[30440>>2]=r65;r66=_signal(2,482);r67=_signal(15,1036);r68=_signal(11,18);r69=HEAP32[_stdin>>2];r70=HEAP32[_stdout>>2];_pce_console_init(r69,r70);_mon_init(30464);r71=HEAP32[30440>>2];r72=r71;_mon_set_cmd_fct(30464,314,r72);r73=HEAP32[30440>>2];r74=r73;_mon_set_msg_fct(30464,536,r74);r75=HEAP32[30440>>2];r76=r75+4|0;r77=HEAP32[r76>>2];r78=r77;_mon_set_get_mem_fct(30464,r78,660);r79=HEAP32[30440>>2];r80=r79+4|0;r81=HEAP32[r80>>2];r82=r81;_mon_set_set_mem_fct(30464,r82,494);_mon_set_memory_mode(30464,1);r83=HEAP32[30440>>2];r84=r83;_cmd_init(r84,236,594);r85=HEAP32[30440>>2];_rc759_cmd_init(r85,30464);r86=HEAP32[30440>>2];_rc759_reset(r86);r87=HEAP32[30440>>2];_rc759_run_emscripten(r87);_exit(1)}else{r11=1;STACKTOP=r5;return r11}}function _sim_atexit(){_pce_set_fd_interactive(0,1);return}function _sig_int(r1){r1=HEAP32[_stderr>>2];_fwrite(25080,18,1,r1);_fflush(r1);r1=HEAP32[30440>>2]+70264|0;HEAP32[r1>>2]=(HEAP32[r1>>2]|0)==0?1:2;return}function _sig_term(r1){r1=HEAP32[_stderr>>2];_fwrite(25912,19,1,r1);_fflush(r1);HEAP32[HEAP32[30440>>2]+70264>>2]=2;return}function _sig_segv(r1){var r2;r1=HEAP32[_stderr>>2];_fwrite(10312,30,1,r1);_fflush(r1);r1=HEAP32[30440>>2];do{if((r1|0)!=0){r2=HEAP32[r1+16>>2];if((r2|0)==0){break}_print_state_cpu(r2)}}while(0);_pce_set_fd_interactive(0,1);_exit(1)}function _cmd_get_sym1397(r1,r2,r3){var r4;if((_e86_get_reg(HEAP32[r1+16>>2],r2,r3)|0)==0){r4=0;return r4}if((_strcmp(r2,11152)|0)!=0){r4=1;return r4}HEAP32[r3>>2]=HEAP32[r1+70228>>2];r4=0;return r4}function _cmd_set_sym1399(r1,r2,r3){return(_e86_set_reg(HEAP32[r1+16>>2],r2,r3)|0)!=0|0}function _rc759_set_msg(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=0;r6=STACKTOP;r7=(r1|0)==0?HEAP32[30440>>2]:r1;if((r2|0)==0){r8=1;STACKTOP=r6;return r8}r1=(r3|0)==0?31928:r3;r3=480;while(1){r9=HEAP32[r3>>2];if((r9|0)==0){break}if((_msg_is_message(r9,r2)|0)==0){r3=r3+8|0}else{r4=5;break}}if(r4==5){r8=FUNCTION_TABLE[HEAP32[r3+4>>2]](r7,r2,r1);STACKTOP=r6;return r8}r3=HEAP32[r7+70164>>2];do{if((r3|0)!=0){r7=_trm_set_msg_trm(r3,r2,r1);if((r7|0)>-1){r8=r7}else{break}STACKTOP=r6;return r8}}while(0);_pce_log(2,23728,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r2,HEAP32[r5+8>>2]=r1,r5));STACKTOP=r5;r8=1;STACKTOP=r6;return r8}function _rc759_set_msg_emu_config_save(r1,r2,r3){return(_ini_write(r3,HEAP32[r1+70212>>2])|0)!=0|0}function _rc759_set_msg_emu_cpu_speed(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_uint(r3,r4)|0)==0){_rc759_set_speed(r1,HEAP32[r4>>2]);r5=0}else{r5=1}STACKTOP=r2;return r5}function _rc759_set_msg_emu_cpu_speed_step(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_sint(r3,r4)|0)!=0){r5=1;STACKTOP=r2;return r5}r3=HEAP32[r1+70232>>2];r6=HEAP32[r4>>2];do{if((r6|0)>0){r7=r6;r8=r3;while(1){r9=((r8*9&-1)+4|0)>>>3;r10=r7-1|0;if((r10|0)>0){r7=r10;r8=r9}else{break}}HEAP32[r4>>2]=0;r11=r9}else{if((r6|0)<0){r12=r6;r13=r3}else{r11=r3;break}while(1){r14=((r13<<3|4)>>>0)/9&-1;r8=r12+1|0;if((r8|0)<0){r12=r8;r13=r14}else{break}}HEAP32[r4>>2]=0;r11=r14}}while(0);_rc759_set_cpu_clock(r1,r11);r5=0;STACKTOP=r2;return r5}function _rc759_set_msg_emu_disk_commit(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r2=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8;HEAP32[r6>>2]=r3;if((_strcmp(r3,18576)|0)==0){_pce_log(2,18400,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r3=r1+960|0;_rc759_fdc_save(r3,0);_rc759_fdc_save(r3,1);if((_dsks_commit(HEAP32[r1+70168>>2])|0)==0){r8=0;STACKTOP=r5;return r8}_pce_log(0,18264,(r4=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r4>>2]=0,r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}r3=r1+960|0;r9=r1+70168|0;r1=0;L8:while(1){while(1){if((HEAP8[HEAP32[r6>>2]]|0)==0){r8=r1;r2=11;break L8}if((_msg_get_prefix_uint(r6,r7,20392,20120)|0)!=0){break L8}_pce_log(2,17984,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;_rc759_fdc_save(r3,HEAP32[r7>>2]);if((_dsks_set_msg(HEAP32[r9>>2],HEAP32[r7>>2],17880,0)|0)!=0){break}}_pce_log(0,17648,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;r1=1}if(r2==11){STACKTOP=r5;return r8}_pce_log(0,18104,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6>>2],r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}function _rc759_set_msg_emu_disk_eject(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r2=0;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r5+8;HEAP32[r6>>2]=r3;if((HEAP8[r3]|0)==0){r8=0;STACKTOP=r5;return r8}r3=r1+960|0;r9=r1+70168|0;while(1){if((_msg_get_prefix_uint(r6,r7,20392,20120)|0)!=0){break}_pce_log(2,19032,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r7>>2],r4));STACKTOP=r4;_rc759_fdc_save(r3,HEAP32[r7>>2]);_rc759_fdc_set_fname(r3,HEAP32[r7>>2],0);r1=_dsks_get_disk(HEAP32[r9>>2],HEAP32[r7>>2]);_dsks_rmv_disk(HEAP32[r9>>2],r1);_dsk_del(r1);_rc759_fdc_load(r3,HEAP32[r7>>2]);if((HEAP8[HEAP32[r6>>2]]|0)==0){r8=0;r2=6;break}}if(r2==6){STACKTOP=r5;return r8}_pce_log(0,19896,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=HEAP32[r6>>2],r4));STACKTOP=r4;r8=1;STACKTOP=r5;return r8}function _rc759_set_msg_emu_disk_insert(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r4+8;HEAP32[r6>>2]=r3;if((_msg_get_prefix_uint(r6,r5,20392,20120)|0)!=0){_pce_log(0,19896,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r3,r2));STACKTOP=r2;r7=1;STACKTOP=r4;return r7}r2=HEAP32[r6>>2];r8=r2;r9=0;while(1){r10=r2+r9|0;r11=HEAP8[r10];if(r11<<24>>24==0){break}else if(r11<<24>>24==46){r12=r10}else{r12=r8}r8=r12;r9=r9+1|0}r9=r1+960|0;_rc759_fdc_save(r9,HEAP32[r5>>2]);do{if((_strcasecmp(r8,19584)|0)==0){_rc759_fdc_set_fname(r9,HEAP32[r5>>2],HEAP32[r6>>2])}else{if((_dsk_insert(HEAP32[r1+70168>>2],r3,1)|0)==0){break}else{r7=1}STACKTOP=r4;return r7}}while(0);_rc759_fdc_load(r9,HEAP32[r5>>2]);r7=0;STACKTOP=r4;return r7}function _rc759_set_msg_emu_exit(r1,r2,r3){HEAP32[r1+70264>>2]=2;_mon_set_terminate(30464,1);return 0}function _rc759_set_msg_emu_parport1_driver(r1,r2,r3){return(_rc759_set_parport_driver(r1,0,r3)|0)!=0|0}function _rc759_set_msg_emu_parport1_file(r1,r2,r3){return(_rc759_set_parport_file(r1,0,r3)|0)!=0|0}function _rc759_set_msg_emu_parport2_driver(r1,r2,r3){return(_rc759_set_parport_driver(r1,1,r3)|0)!=0|0}function _rc759_set_msg_emu_parport2_file(r1,r2,r3){return(_rc759_set_parport_file(r1,1,r3)|0)!=0|0}function _rc759_set_msg_emu_pause(r1,r2,r3){var r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r2;if((_msg_get_bool(r3,r4)|0)!=0){r5=1;STACKTOP=r2;return r5}HEAP8[r1+70268|0]=HEAP32[r4>>2];_rc759_clock_discontinuity(r1);r5=0;STACKTOP=r2;return r5}function _rc759_set_msg_emu_pause_toggle(r1,r2,r3){r3=r1+70268|0;HEAP8[r3]=(HEAP8[r3]|0)==0|0;_rc759_clock_discontinuity(r1);return 0}function _rc759_set_msg_emu_reset(r1,r2,r3){_rc759_reset(r1);return 0}function _rc759_set_msg_emu_stop(r1,r2,r3){HEAP32[r1+70264>>2]=1;return 0}function _rc759_nvm_init(r1){HEAP32[r1>>2]=0;HEAP8[r1+4|0]=1;HEAP8[r1+5|0]=-86;_memset(r1+6|0,0,127)|0;return}function _rc759_nvm_set_fname(r1,r2){var r3,r4;r3=r1|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_free(r1);HEAP32[r3>>2]=0}if((r2|0)==0){r4=0;return r4}r1=_str_copy_alloc(r2);HEAP32[r3>>2]=r1;r4=(r1|0)==0|0;return r4}function _rc759_nvm_load(r1){var r2,r3,r4;r2=HEAP32[r1>>2];if((r2|0)==0){r3=1;return r3}r4=_fopen(r2,17968);if((r4|0)==0){r3=1;return r3}r2=_fread(r1+5|0,1,128,r4);_fclose(r4);r4=r1+4|0;if(r2>>>0<128){HEAP8[r4]=1;_memset(r1+(r2+5)|0,0,128-r2|0)|0;r3=0;return r3}else{HEAP8[r4]=0;r3=0;return r3}}function _rc759_nvm_fix_checksum(r1){var r2,r3,r4,r5;r2=0;r3=0;while(1){r4=HEAPU8[r2+(r1+5)|0]+r3|0;r5=r2+1|0;if(r5>>>0<96){r2=r5;r3=r4}else{break}}r3=r1+5|0;HEAP8[r3]=170-r4+HEAPU8[r3];return}function _rc759_nvm_sanitize(r1){var r2;r2=r1+31|0;if(HEAPU8[r2]>=2){return}HEAP8[r2]=2;return}function _rc759_nvm_get_uint4(r1,r2){var r3;if(r2>>>0<256){r3=HEAP8[(r2>>>1)+(r1+5)|0]}else{r3=0}return((r2&1|0)==0?(r3&255)>>>4:r3)&15}function _rc759_nvm_set_uint4(r1,r2,r3){var r4,r5,r6;if(r2>>>0>=256){return}r4=(r2>>>1)+(r1+5)|0;r5=HEAP8[r4];if((r2&1|0)==0){r6=r5&15|r3<<4}else{r6=r5&-16|r3&15}HEAP8[r4]=r6;HEAP8[r1+4|0]=1;return}function _rc759_par_init(r1){HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;_memset(r1|0,0,9)|0;return}function _rc759_par_reset(r1){var r2;HEAP8[r1|0]=0;HEAP8[r1+1|0]=0;r2=r1+2|0;HEAP8[r2]=HEAP8[r2]&31;return}function _rc759_par_set_irq_fct(r1,r2,r3){HEAP32[r1+12>>2]=r2;HEAP32[r1+16>>2]=r3;return}function _rc759_par_set_driver(r1,r2){var r3,r4;r3=r1+4|0;r4=HEAP32[r3>>2];if((r4|0)!=0){_chr_close(r4)}r4=_chr_open(r2);HEAP32[r3>>2]=r4;r3=(r4|0)==0;HEAP8[r1+2|0]=r3?22:9;return r3&1}function _rc759_par_get_data(r1){return HEAP8[r1|0]}function _rc759_par_set_data(r1,r2){HEAP8[r1|0]=r2;return}function _rc759_par_set_control(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=r2&255;r4=r3&1;if((r4|0)==0){r5=r1+1|0;if((HEAP8[r5]&1)!=0){_chr_write(HEAP32[r1+4>>2],r1|0,1)}r6=r1+2|0;r7=HEAP8[r6]&-4;HEAP8[r6]=r7;r8=r7;r9=r5}else{r5=r1+2|0;r7=HEAP8[r5]|3;HEAP8[r5]=r7;r8=r7;r9=r1+1|0}HEAP8[r9]=r2;r9=r4<<1|r3&12;if((HEAP32[r1+4>>2]|0)==0){r10=r9&255}else{r10=(r9|r3>>>4&1)&255}HEAP8[r1+2|0]=r8&15|r10<<4;if(r2<<24>>24>-1){r11=(r8&1)==0}else{r11=0}r8=r1+8|0;if((HEAPU8[r8]|0)==(r11&1|0)){return}r2=r11&1;HEAP8[r8]=r2;r8=HEAP32[r1+16>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+12>>2],r2);return}function _rc759_par_get_status(r1){return HEAP8[r1+2|0]}function _rc759_par_get_reserve(r1){return HEAP8[r1+3|0]}function _rc759_par_set_reserve(r1,r2){HEAP8[r1+3|0]=r2<<24>>24!=0?0:-128;return}function _rc759_new(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+128|0;r4=r3;r5=r3+8;r6=r3+16;r7=r3+24;r8=r3+32;r9=r3+40;r10=r3+48;r11=r3+56;r12=r3+64;r13=r3+72;r14=r3+80;r15=r3+88;r16=r3+96;r17=r3+104;r18=r3+112;r19=r3+120;r20=_malloc(70272);r21=r20;if((r20|0)==0){r22=0;STACKTOP=r3;return r22}_memset(r20,0,70272)|0;HEAP32[r20+70212>>2]=r1;_bps_init(r20+70216|0);r23=r20;HEAP32[r23>>2]=0;HEAP32[r20+70228>>2]=0;HEAP32[r20+70264>>2]=0;HEAP8[r20+70268|0]=0;r24=_ini_next_sct(r1,0,13800);_ini_get_bool(r24,13736,r18,0);_ini_get_uint32(r24,13688,r19,6e6);r24=HEAP32[r18>>2];_pce_log_tag(2,13584,13512,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[r19>>2],HEAP32[r2+8>>2]=r24,r2));STACKTOP=r2;r24=r20+70232|0;HEAP32[r24>>2]=HEAP32[r19>>2];r19=r20+70236|0;HEAP32[r19>>2]=0;if((HEAP32[r18>>2]|0)!=0){HEAP32[r23>>2]=HEAP32[r23>>2]|1}r18=_mem_new();r25=r20+4|0;HEAP32[r25>>2]=r18;r26=r20+8|0;_ini_get_ram(r18,r1,r26);_ini_get_rom(HEAP32[r25>>2],r1);r18=_mem_new();r27=r20+12|0;HEAP32[r27>>2]=r18;_mem_set_fct(r18,r20,520,556,0,538,1060,0);_pce_log_tag(2,18536,14768,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;r18=_e86_new();r28=r20+16|0;HEAP32[r28>>2]=r18;_e86_set_80186(r18);_e86_set_mem(HEAP32[r28>>2],HEAP32[r25>>2],660,494,1202,1196);_e86_set_prt(HEAP32[r28>>2],HEAP32[r27>>2],660,494,1202,1196);r18=HEAP32[r26>>2];r29=HEAP32[r28>>2];if((r18|0)==0){_e86_set_ram(r29,0,0)}else{_e86_set_ram(r29,HEAP32[r18+44>>2],HEAP32[r18+40>>2])}r18=r20+196|0;r29=r18;_e80186_icu_init(r29);_e80186_icu_set_intr_fct(r29,HEAP32[r28>>2],372);_e86_set_inta_fct(HEAP32[r28>>2],r18,1058);r28=r20+20|0;r30=r28;_e8259_init(r30);_e8259_set_int_fct(r30,r18,1078);_e80186_icu_set_inta0_fct(r29,r28,14);r29=r20+96|0;_e80186_tcu_init(r29);_e80186_tcu_set_input(r29,0,1);_e80186_tcu_set_input(r29,1,1);_e80186_tcu_set_input(r29,2,1);_e80186_tcu_set_int_fct(r29,0,r18,366);_e80186_tcu_set_int_fct(r29,1,r18,364);_e80186_tcu_set_int_fct(r29,2,r18,362);_e80186_tcu_set_out_fct(r29,0,r20,552);_e80186_tcu_set_out_fct(r29,1,r20,26);r29=r20+304|0;r30=r29;_e80186_dma_init(r30);_e80186_dma_set_getmem_fct(r30,HEAP32[r25>>2],660,1202);_e80186_dma_set_setmem_fct(r30,HEAP32[r25>>2],494,1196);_e80186_dma_set_getio_fct(r30,HEAP32[r27>>2],660,1202);_e80186_dma_set_setio_fct(r30,HEAP32[r27>>2],494,1196);_e80186_dma_set_int_fct(r30,0,r18,1062);_e80186_dma_set_int_fct(r30,1,r18,1064);r18=r20+408|0;_e8255_init(r18);r30=r20+70224|0;HEAP8[r30]=2;r27=r20+70225|0;HEAP8[r27]=-121;r31=HEAP32[r26>>2];do{if((r31|0)==0){r32=2}else{r26=HEAP32[r31+40>>2];if((HEAP32[r23>>2]&1|0)!=0){if(r26>>>0>851967){r32=2;break}if(r26>>>0>655359){HEAP8[r30]=18;r32=18;break}if(r26>>>0<=524287){r32=2;break}HEAP8[r30]=50;r32=50;break}if(r26>>>0>786431){HEAP8[r30]=34;r32=34;break}if(r26>>>0>655359){r32=2;break}if(r26>>>0>393215){HEAP8[r30]=18;r32=18;break}if(r26>>>0<=262143){r32=2;break}HEAP8[r30]=50;r32=50}}while(0);_e8255_set_inp_a(r18,r32);_e8255_set_inp_b(r18,HEAP8[r27]);HEAP32[r20+464>>2]=r20;HEAP32[r20+468>>2]=1162;r32=r20+472|0;r30=r32;_rc759_kbd_init(r30);_rc759_kbd_set_irq_fct(r30,r28,246);r30=_ini_next_sct(r1,0,13800);_ini_get_string(r30,15808,r16,15664);_ini_get_bool(r30,15288,r17,0);r30=HEAP32[r17>>2];_pce_log_tag(2,15120,14984,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[r16>>2],HEAP32[r2+8>>2]=r30,r2));STACKTOP=r2;r30=r20+772|0;_rc759_nvm_init(r30);_rc759_nvm_set_fname(r30,HEAP32[r16>>2]);if((_rc759_nvm_load(r30)|0)!=0){r23=HEAP32[r16>>2];_pce_log(0,14880,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(r23|0)!=0?r23:24816,r2));STACKTOP=r2}if((HEAP32[r17>>2]|0)!=0){_rc759_nvm_sanitize(r30);_rc759_nvm_fix_checksum(r30)}r30=r20+908|0;_rc759_rtc_init(r30);_rc759_rtc_set_time_now(r30);_rc759_rtc_set_irq_fct(r30,r28,250);_rc759_rtc_set_input_clock(r30,HEAP32[r24>>2]);r30=r20+66736|0;_rc759_spk_init(r30);_rc759_spk_set_clk_fct(r30,r20,380);_rc759_spk_set_input_clock(r30,HEAP32[r24>>2]);r17=_ini_next_sct(r1,0,16800);if((r17|0)!=0){_ini_get_string(r17,16656,r12,0);_ini_get_uint16(r17,16576,r13,500);_ini_get_uint32(r17,16432,r14,44100);_ini_get_uint32(r17,16328,r15,0);r17=HEAP32[r14>>2];r23=HEAP32[r15>>2];r16=HEAP32[r12>>2];_pce_log_tag(2,16224,16064,(r2=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r2>>2]=HEAP32[r13>>2],HEAP32[r2+8>>2]=r17,HEAP32[r2+16>>2]=r23,HEAP32[r2+24>>2]=(r16|0)!=0?r16:24816,r2));STACKTOP=r2;r16=HEAP32[r12>>2];do{if((r16|0)!=0){if((_rc759_spk_set_driver(r30,r16,HEAP32[r14>>2])|0)==0){break}_pce_log(0,15936,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r12>>2],r2));STACKTOP=r2}}while(0);_rc759_spk_set_lowpass(r30,HEAP32[r15>>2]);_rc759_spk_set_volume(r30,HEAP32[r13>>2])}r13=_ini_get_terminal(r1,HEAP32[30432>>2]);r30=r20+70164|0;HEAP32[r30>>2]=r13;if((r13|0)!=0){_trm_set_key_fct(r13,r32,24);_trm_set_mouse_fct(HEAP32[r30>>2],r20,1120);_trm_set_msg_fct(HEAP32[r30>>2],r20,536)}r32=_ini_next_sct(r1,0,18568);r13=(r32|0)==0?r1:r32;_ini_get_uint16(r13,18392,r9,0);_ini_get_bool(r13,18256,r10,0);_ini_get_bool(r13,18096,r11,0);r13=HEAP32[30424>>2];do{if((r13|0)!=0){if((_strcmp(r13,18256)|0)==0){HEAP32[r10>>2]=1;break}if((_strcmp(r13,17976)|0)==0){HEAP32[r10>>2]=0;break}else{_pce_log(0,17848,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=r13,r2));STACKTOP=r2;break}}}while(0);r13=r20+68888|0;_e82730_init(r13);_e82730_set_getmem_fct(r13,HEAP32[r25>>2],660,1202);_e82730_set_setmem_fct(r13,HEAP32[r25>>2],494,1196);_e82730_set_sint_fct(r13,r28,240);_e82730_set_terminal(r13,HEAP32[r30>>2]);_e82730_set_monochrome(r13,HEAP32[r10>>2]);_e82730_set_min_h(r13,HEAP32[r9>>2]);r32=HEAP32[r11>>2];r15=HEAP32[r9>>2];_pce_log_tag(2,17640,17504,(r2=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r2>>2]=HEAP32[r10>>2],HEAP32[r2+8>>2]=r32,HEAP32[r2+16>>2]=r15,r2));STACKTOP=r2;r15=HEAP8[r27];if((HEAP32[r11>>2]|0)==0){HEAP8[r27]=r15&-65;_e82730_set_clock(r13,75e4,HEAP32[r24>>2])}else{HEAP8[r27]=r15|64;_e82730_set_clock(r13,125e4,HEAP32[r24>>2])}r13=HEAP8[r27];r15=(HEAP32[r10>>2]|0)==0?r13&-33:r13|32;HEAP8[r27]=r15;_e8255_set_inp_b(r18,r15);r15=HEAP32[r30>>2];if((r15|0)!=0){if((HEAP32[r11>>2]|0)==0){_trm_open(r15,560,260)}else{_trm_open(r15,720,341)}_trm_set_msg_trm(HEAP32[r30>>2],17368,17088)}r30=r20+70168|0;HEAP32[r30>>2]=_dsks_new();r15=_ini_next_sct(r1,0,19576);if((r15|0)!=0){r11=r15;while(1){do{if((_ini_get_disk(r11,r8)|0)==0){r15=HEAP32[r8>>2];if((r15|0)==0){break}_dsks_add_disk(HEAP32[r30>>2],r15)}else{_pce_log(0,18960,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2}}while(0);r15=_ini_next_sct(r1,r11,19576);if((r15|0)==0){break}else{r11=r15}}}r11=_ini_next_sct(r1,0,21784);_ini_get_string(r11,21320,r6,0);_ini_get_string(r11,20384,r7,0);r11=HEAP32[r6>>2];r8=HEAP32[r7>>2];_pce_log_tag(2,20112,19872,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=(r11|0)!=0?r11:24816,HEAP32[r2+8>>2]=(r8|0)!=0?r8:24816,r2));STACKTOP=r2;r8=r20+960|0;r11=r8;_rc759_fdc_init(r11);r15=r8;_wd179x_set_irq_fct(r15,r28,248);_wd179x_set_drq_fct(r15,r29,476);_wd179x_set_input_clock(r15,HEAP32[r24>>2]);_wd179x_set_bit_clock(r15,2e6);_rc759_fdc_set_disks(r11,HEAP32[r30>>2]);_rc759_fdc_set_fname(r11,0,HEAP32[r6>>2]);_rc759_fdc_set_fname(r11,1,HEAP32[r7>>2]);_rc759_fdc_set_disk_id(r11,0,0);_rc759_fdc_set_disk_id(r11,1,1);_rc759_fdc_load(r11,0);_rc759_fdc_load(r11,1);r11=_ini_next_sct(r1,0,13800);_ini_get_string(r11,12792,r4,0);_ini_get_string(r11,11952,r4,HEAP32[r4>>2]);_ini_get_string(r11,11048,r5,0);r11=HEAP32[r4>>2];_pce_log_tag(2,10216,25784,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(r11|0)==0?24816:r11,r2));STACKTOP=r2;r11=r20+70172|0;_rc759_par_init(r11);_rc759_par_set_irq_fct(r11,r28,244);r7=HEAP32[r4>>2];do{if((r7|0)!=0){if((_rc759_par_set_driver(r11,r7)|0)==0){break}_pce_log(0,23776,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r4>>2],r2));STACKTOP=r2}}while(0);r4=HEAP32[r5>>2];_pce_log_tag(2,23112,22352,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=(r4|0)==0?24816:r4,r2));STACKTOP=r2;r4=r20+70192|0;_rc759_par_init(r4);_rc759_par_set_irq_fct(r4,r28,252);r28=HEAP32[r5>>2];do{if((r28|0)!=0){if((_rc759_par_set_driver(r4,r28)|0)==0){break}_pce_log(0,23776,(r2=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r2>>2]=HEAP32[r5>>2],r2));STACKTOP=r2}}while(0);_pce_load_mem_ini(HEAP32[r25>>2],r1);_mem_move_to_front(HEAP32[r25>>2],1015808);HEAP32[r20+70252>>2]=0;HEAP32[r20+70256>>2]=0;_pce_get_interval_us(r20+70260|0);HEAP32[r19>>2]=0;HEAP32[r19+4>>2]=0;HEAP32[r19+8>>2]=0;HEAP32[r19+12>>2]=0;r22=r21;STACKTOP=r3;return r22}function _rc759_set_parport_driver(r1,r2,r3){var r4;if(r2>>>0>1){r4=1;return r4}r4=(_rc759_par_set_driver(r1+70172+(r2*20&-1)|0,r3)|0)!=0|0;return r4}function _rc759_set_parport_file(r1,r2,r3){var r4,r5;if(r2>>>0>1){r4=1;return r4}r5=_str_cat_alloc(17944,r3);r3=(_rc759_par_set_driver(r1+70172+(r2*20&-1)|0,r5)|0)!=0|0;_free(r5);r4=r3;return r4}function _rc759_intlog_get(r1,r2){return HEAP32[30728+((r2&255)<<2)>>2]}function _rc759_intlog_set(r1,r2,r3){var r4;r1=30728+((r2&255)<<2)|0;_free(HEAP32[r1>>2]);do{if((r3|0)==0){r4=0}else{if((HEAP8[r3]|0)==0){r4=0;break}r4=_str_copy_alloc(r3)}}while(0);HEAP32[r1>>2]=r4;return}function _rc759_intlog_check(r1,r2){var r3,r4,r5,r6;r1=STACKTOP;STACKTOP=STACKTOP+272|0;r3=r1;r4=r1+8;r5=HEAP32[30728+((r2&255)<<2)>>2];if((r5|0)==0){r6=0;STACKTOP=r1;return r6}_cmd_set_str(r4,r5);r5=(_cmd_match_uint32(r4,r3)|0)!=0;r6=r5&(HEAP32[r3>>2]|0)!=0&1;STACKTOP=r1;return r6}function _rc759_reset(r1){var r2,r3;r2=0;r3=STACKTOP;_sim_log_deb(23536,(r2=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r2>>2]=0,r2));STACKTOP=r2;_e86_reset(HEAP32[r1+16>>2]);_e82730_reset(r1+68888|0);_e8259_reset(r1+20|0);_e80186_tcu_reset(r1+96|0);_e80186_dma_reset(r1+304|0);_e80186_icu_reset(r1+196|0);_rc759_kbd_reset(r1+472|0);_rc759_rtc_reset(r1+908|0);_rc759_fdc_reset(r1+960|0);_rc759_par_reset(r1+70172|0);_rc759_par_reset(r1+70192|0);STACKTOP=r3;return}function _rc759_set_cpu_clock(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+70232|0;if((HEAP32[r5>>2]|0)==(r2|0)){STACKTOP=r4;return}_pce_log_tag(2,18536,16752,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;HEAP32[r5>>2]=r2;_wd179x_set_input_clock(r1+960|0,r2);_rc759_rtc_set_input_clock(r1+908|0,r2);_rc759_spk_set_input_clock(r1+66736|0,HEAP32[r5>>2]);r2=r1+68888|0;r3=HEAP32[r5>>2];if((HEAP8[r1+70225|0]&64)==0){_e82730_set_clock(r2,75e4,r3);STACKTOP=r4;return}else{_e82730_set_clock(r2,125e4,r3);STACKTOP=r4;return}}function _rc759_set_speed(r1,r2){_rc759_set_cpu_clock(r1,(r2*1e6&-1)+4e6|0);return}function _rc759_get_cpu_clock(r1){return HEAP32[r1+70236>>2]}function _rc759_clock_discontinuity(r1){HEAP32[r1+70256>>2]=HEAP32[r1+70252>>2];_pce_get_interval_us(r1+70260|0);return}function _rc759_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=(r2|0)==0?4:r2;_e86_clock(HEAP32[r1+16>>2],r5);_e80186_tcu_clock(r1+96|0,r5);if((HEAP8[r1+330|0]|0)!=0){_e80186_dma_clock2(r1+304|0,r5)}r2=r1+70252|0;HEAP32[r2>>2]=HEAP32[r2>>2]+r5;r6=r1+70236|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r5;r6=r1+70240|0;r7=HEAP32[r6>>2]+r5|0;HEAP32[r6>>2]=r7;if(r7>>>0<8){STACKTOP=r4;return}r5=r7&7;HEAP32[r6>>2]=r5;r6=r7-r5|0;_e82730_clock(r1+68888|0,r6);r5=r1+960|0;if((HEAP8[r5|0]|0)!=0){_wd179x_clock2(r5,r6)}_rc759_rtc_clock(r1+908|0,r6);r5=r1+70244|0;r7=HEAP32[r5>>2]+r6|0;HEAP32[r5>>2]=r7;if(r7>>>0<1024){STACKTOP=r4;return}r6=r7&1023;HEAP32[r5>>2]=r6;r5=r7-r6|0;r6=HEAP32[r1+70164>>2];if((r6|0)!=0){_trm_check(r6)}_rc759_kbd_clock(r1+472|0,r5);_rc759_spk_clock(r1+66736|0,r5);r6=r1+70248|0;r7=HEAP32[r6>>2]+r5|0;HEAP32[r6>>2]=r7;if(r7>>>0<32768){STACKTOP=r4;return}HEAP32[r6>>2]=r7&32767;r7=HEAP32[r2>>2];r6=_pce_get_interval_us(r1+70260|0);r5=HEAP32[r1+70232>>2];r8=r5;r9=0;r10=___muldi3(r8,r9,r6,0);r6=___udivdi3(r10,tempRet0,1e6,0);r10=r1+70256|0;r1=r6+HEAP32[r10>>2]|0;if(r7>>>0<r1>>>0){HEAP32[r2>>2]=0;r6=r1-r7|0;HEAP32[r10>>2]=r6;if(r6>>>0<=r5>>>0){STACKTOP=r4;return}HEAP32[r10>>2]=0;_pce_log(2,15208,(r3=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7&-8,HEAP32[r3>>2]=0,r3));STACKTOP=r3;STACKTOP=r4;return}else{r3=r7-r1|0;HEAP32[r2>>2]=r3;HEAP32[r10>>2]=0;r10=___muldi3(r3,0,1e6,0);r3=___udivdi3(r10,tempRet0,r8,r9);r9=r3;if(r9>>>0<=25e3){STACKTOP=r4;return}_pce_usleep(r9);STACKTOP=r4;return}}function _rc759_set_mouse(r1,r2,r3,r4){_chr_mouse_set(r2,r3,r4);_rc759_kbd_set_mouse(r1+472|0,r2,r3,r4);return}function _rc759_set_ppi_port_c(r1,r2){HEAP8[r1+70226|0]=r2;_rc759_kbd_set_enable(r1+472|0,r2&-128);_e82730_set_graphic(r1+68888|0,((r2&255)>>>6&1^1)&255);return}function _rc759_set_timer0_out(r1,r2){var r3,r4,r5,r6;r3=r1+70224|0;r4=HEAP8[r3];r5=r4|1;HEAP8[r3]=r5;if((HEAP8[r1+70226|0]&1)==0|r2<<24>>24==0){r6=r5}else{r5=r4&-2;HEAP8[r3]=r5;r6=r5}_e8255_set_inp_a(r1+408|0,r6);return}function _rc759_set_timer1_out(r1,r2){_rc759_spk_set_out(r1+66736|0,r2);return}function _rc759_get_port8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62;r3=0;r4=0;r5=STACKTOP;r6=r2-128|0;r7=r6>>>0<128;L1:do{if(r7){r8=r1+70226|0;r9=HEAP8[r8];r10=r9&255;r11=r10<<2;r12=r11&192;r13=r2>>>1;r14=r13&63;r15=r12|r14;r16=r1+772|0;r17=_rc759_nvm_get_uint4(r16,r15);r18=r17&15;r19=r18}else{r20=r2-384|0;r21=r20>>>0<63;if(r21){r22=r2&1;r23=(r22|0)==0;if(!r23){r19=0;break}r24=r1+68888|0;r25=r20>>>1;r26=_e82730_get_palette(r24,r25);r19=r26;break}switch(r2|0){case 32:{r27=r1+472|0;r28=_rc759_kbd_get_key(r27);r19=r28;break L1;break};case 92:{r29=r1+908|0;r30=_rc759_rtc_get_addr(r29);r19=r30;break L1;break};case 112:{r31=r1+408|0;r32=_e8255_get_uint8(r31,0);r19=r32;break L1;break};case 114:{r33=r1+408|0;r34=_e8255_get_uint8(r33,1);r19=r34;break L1;break};case 116:{r35=r1+408|0;r36=_e8255_get_uint8(r35,2);r19=r36;break L1;break};case 118:{r37=r1+408|0;r38=_e8255_get_uint8(r37,3);r19=r38;break L1;break};case 592:{r39=r1+70172|0;r40=_rc759_par_get_data(r39);r19=r40;break L1;break};case 608:{r41=r1+70172|0;r42=_rc759_par_get_status(r41);r19=r42;break L1;break};case 640:{r43=r1+960|0;r44=_wd179x_get_status(r43);r19=r44;break L1;break};case 642:{r45=r1+960|0;r46=_wd179x_get_track(r45);r19=r46;break L1;break};case 644:{r47=r1+960|0;r48=_wd179x_get_sector(r47);r19=r48;break L1;break};case 646:{r49=r1+960|0;r50=_wd179x_get_data(r49);r19=r50;break L1;break};case 650:{r51=r1+70192|0;r52=_rc759_par_get_data(r51);r19=r52;break L1;break};case 652:{r53=r1+70192|0;r54=_rc759_par_get_status(r53);r19=r54;break L1;break};case 654:{r55=r1+960|0;r56=_rc759_fdc_get_reserve(r55);r19=r56;break L1;break};case 658:{r57=r1+70192|0;r58=_rc759_par_get_reserve(r57);r19=r58;break L1;break};case 768:{r19=0;break L1;break};case 770:{r19=0;break L1;break};case 86:{r19=-1;break L1;break};case 2:{r59=r1+20|0;r60=_e8259_get_uint8(r59,1);r19=r60;break L1;break};case 0:{r61=r1+20|0;r62=_e8259_get_uint8(r61,0);r19=r62;break L1;break};default:{_sim_log_deb(13832,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=255,r4));STACKTOP=r4;r19=-1;break L1}}}}while(0);STACKTOP=r5;return r19}function _rc759_get_port16(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78;r3=0;r4=0;r5=STACKTOP;switch(r2|0){case 65316:{r6=r1+196|0;r7=_e80186_icu_get_poll(r6);r8=r7;break};case 65330:{r9=r1+196|0;r10=_e80186_icu_get_icon(r9,0);r8=r10;break};case 65332:{r11=r1+196|0;r12=_e80186_icu_get_icon(r11,2);r8=r12;break};case 65334:{r13=r1+196|0;r14=_e80186_icu_get_icon(r13,3);r8=r14;break};case 65336:{r15=r1+196|0;r16=_e80186_icu_get_icon(r15,4);r8=r16;break};case 65338:{r17=r1+196|0;r18=_e80186_icu_get_icon(r17,5);r8=r18;break};case 65340:{r19=r1+196|0;r20=_e80186_icu_get_icon(r19,6);r8=r20;break};case 65342:{r21=r1+196|0;r22=_e80186_icu_get_icon(r21,7);r8=r22;break};case 65360:{r23=r1+96|0;r24=_e80186_tcu_get_count(r23,0);r8=r24;break};case 65362:{r25=r1+96|0;r26=_e80186_tcu_get_max_count_a(r25,0);r8=r26;break};case 65364:{r27=r1+96|0;r28=_e80186_tcu_get_max_count_b(r27,0);r8=r28;break};case 65366:{r29=r1+96|0;r30=_e80186_tcu_get_control(r29,0);r8=r30;break};case 65368:{r31=r1+96|0;r32=_e80186_tcu_get_count(r31,1);r8=r32;break};case 65370:{r33=r1+96|0;r34=_e80186_tcu_get_max_count_a(r33,1);r8=r34;break};case 65372:{r35=r1+96|0;r36=_e80186_tcu_get_max_count_b(r35,1);r8=r36;break};case 65374:{r37=r1+96|0;r38=_e80186_tcu_get_control(r37,1);r8=r38;break};case 65376:{r39=r1+96|0;r40=_e80186_tcu_get_count(r39,2);r8=r40;break};case 65378:{r41=r1+96|0;r42=_e80186_tcu_get_max_count_a(r41,2);r8=r42;break};case 65382:{r43=r1+96|0;r44=_e80186_tcu_get_control(r43,2);r8=r44;break};case 65472:{r45=r1+304|0;r46=_e80186_dma_get_src_lo(r45,0);r8=r46;break};case 65474:{r47=r1+304|0;r48=_e80186_dma_get_src_hi(r47,0);r8=r48;break};case 65476:{r49=r1+304|0;r50=_e80186_dma_get_dst_lo(r49,0);r8=r50;break};case 65478:{r51=r1+304|0;r52=_e80186_dma_get_dst_hi(r51,0);r8=r52;break};case 65480:{r53=r1+304|0;r54=_e80186_dma_get_count(r53,0);r8=r54;break};case 65482:{r55=r1+304|0;r56=_e80186_dma_get_control(r55,0);r8=r56;break};case 65488:{r57=r1+304|0;r58=_e80186_dma_get_src_lo(r57,1);r8=r58;break};case 65490:{r59=r1+304|0;r60=_e80186_dma_get_src_hi(r59,1);r8=r60;break};case 65492:{r61=r1+304|0;r62=_e80186_dma_get_dst_lo(r61,1);r8=r62;break};case 65494:{r63=r1+304|0;r64=_e80186_dma_get_dst_hi(r63,1);r8=r64;break};case 65496:{r65=r1+304|0;r66=_e80186_dma_get_count(r65,1);r8=r66;break};case 65498:{r67=r1+304|0;r68=_e80186_dma_get_control(r67,1);r8=r68;break};case 65324:{r69=r1+196|0;r70=_e80186_icu_get_isr(r69);r8=r70;break};case 65318:{r71=r1+196|0;r72=_e80186_icu_get_pollst(r71);r8=r72;break};case 65320:{r73=r1+196|0;r74=_e80186_icu_get_imr(r73);r8=r74;break};case 65322:{r75=r1+196|0;r76=_e80186_icu_get_pmr(r75);r8=r76;break};case 65326:{r77=r1+196|0;r78=_e80186_icu_get_irr(r77);r8=r78;break};default:{_sim_log_deb(14112,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=65535,r4));STACKTOP=r4;r8=-1}}STACKTOP=r5;return r8}function _rc759_set_port8(r1,r2,r3){var r4,r5,r6;r4=0;r5=STACKTOP;do{if((r2-128|0)>>>0<128){_rc759_nvm_set_uint4(r1+772|0,HEAPU8[r1+70226|0]<<2&192|r2>>>1&63,r3)}else{r6=r2-384|0;if(r6>>>0<63){if((r2&1|0)!=0){break}_e82730_set_palette(r1+68888|0,r6>>>1,r3);break}if((r2|0)==90){_rc759_rtc_set_data(r1+908|0,r3);break}else if((r2|0)==92){_rc759_rtc_set_addr(r1+908|0,r3);break}else if((r2|0)==112){_e8255_set_uint8(r1+408|0,0,r3);break}else if((r2|0)==114){_e8255_set_uint8(r1+408|0,1,r3);break}else if((r2|0)==116){_e8255_set_uint8(r1+408|0,2,r3);break}else if((r2|0)==118){_e8255_set_uint8(r1+408|0,3,r3);break}else if((r2|0)==52942){_rc759_set_msg(r1,14712,14512);break}else if((r2|0)==560){_e82730_set_srst(r1+68888|0);break}else if((r2|0)==576){_e82730_set_ca(r1+68888|0);break}else if((r2|0)==592){_rc759_par_set_data(r1+70172|0,r3);break}else if((r2|0)==608){_rc759_par_set_control(r1+70172|0,r3);break}else if((r2|0)==640){_wd179x_set_cmd(r1+960|0,r3);break}else if((r2|0)==642){_wd179x_set_track(r1+960|0,r3);break}else if((r2|0)==644){_wd179x_set_sector(r1+960|0,r3);break}else if((r2|0)==646){_wd179x_set_data(r1+960|0,r3);break}else if((r2|0)==648){_rc759_fdc_set_fcr(r1+960|0,r3);break}else if((r2|0)==650){_rc759_par_set_data(r1+70192|0,r3);break}else if((r2|0)==652){_rc759_par_set_control(r1+70192|0,r3);break}else if((r2|0)==654){_rc759_fdc_set_reserve(r1+960|0,1);break}else if((r2|0)==656){_rc759_fdc_set_reserve(r1+960|0,0);break}else if((r2|0)==658){_rc759_par_set_reserve(r1+70192|0,1);break}else if((r2|0)==660){_rc759_par_set_reserve(r1+70192|0,0);break}else if((r2|0)==65320){_e80186_icu_set_imr(r1+196|0,r3&255);break}else if((r2|0)==86){break}else if((r2|0)==2){_e8259_set_uint8(r1+20|0,1,r3);break}else if((r2|0)==0){_e8259_set_uint8(r1+20|0,0,r3);break}else{_sim_log_deb(14264,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&255,r4));STACKTOP=r4;break}}}while(0);STACKTOP=r5;return}function _rc759_set_port16(r1,r2,r3){var r4,r5;r4=0;r5=STACKTOP;if((r2|0)==560){_e82730_set_srst(r1+68888|0)}else if((r2|0)==2){_e8259_set_uint8(r1+20|0,1,r3&255)}else if((r2|0)==65324){_e80186_icu_set_isr(r1+196|0,r3)}else if((r2|0)==65326){_e80186_icu_set_irr(r1+196|0,r3)}else if((r2|0)==65330){_e80186_icu_set_icon(r1+196|0,0,r3)}else if((r2|0)==65332){_e80186_icu_set_icon(r1+196|0,2,r3)}else if((r2|0)==65334){_e80186_icu_set_icon(r1+196|0,3,r3)}else if((r2|0)==65336){_e80186_icu_set_icon(r1+196|0,4,r3)}else if((r2|0)==65338){_e80186_icu_set_icon(r1+196|0,5,r3)}else if((r2|0)==65340){_e80186_icu_set_icon(r1+196|0,6,r3)}else if((r2|0)==65342){_e80186_icu_set_icon(r1+196|0,7,r3)}else if((r2|0)==65360){_e80186_tcu_set_count(r1+96|0,0,r3)}else if((r2|0)==65362){_e80186_tcu_set_max_count_a(r1+96|0,0,r3)}else if((r2|0)==65364){_e80186_tcu_set_max_count_b(r1+96|0,0,r3)}else if((r2|0)==65366){_e80186_tcu_set_control(r1+96|0,0,r3)}else if((r2|0)==65368){_e80186_tcu_set_count(r1+96|0,1,r3)}else if((r2|0)==65370){_e80186_tcu_set_max_count_a(r1+96|0,1,r3)}else if((r2|0)==65372){_e80186_tcu_set_max_count_b(r1+96|0,1,r3)}else if((r2|0)==65374){_e80186_tcu_set_control(r1+96|0,1,r3)}else if((r2|0)==65376){_e80186_tcu_set_count(r1+96|0,2,r3)}else if((r2|0)==65378){_e80186_tcu_set_max_count_a(r1+96|0,2,r3)}else if((r2|0)==65382){_e80186_tcu_set_control(r1+96|0,2,r3)}else if((r2|0)==65472){_e80186_dma_set_src_lo(r1+304|0,0,r3)}else if((r2|0)==65474){_e80186_dma_set_src_hi(r1+304|0,0,r3)}else if((r2|0)==65476){_e80186_dma_set_dst_lo(r1+304|0,0,r3)}else if((r2|0)==65478){_e80186_dma_set_dst_hi(r1+304|0,0,r3)}else if((r2|0)==65480){_e80186_dma_set_count(r1+304|0,0,r3)}else if((r2|0)==65482){_e80186_dma_set_control(r1+304|0,0,r3)}else if((r2|0)==65488){_e80186_dma_set_src_lo(r1+304|0,1,r3)}else if((r2|0)==65490){_e80186_dma_set_src_hi(r1+304|0,1,r3)}else if((r2|0)==65492){_e80186_dma_set_dst_lo(r1+304|0,1,r3)}else if((r2|0)==65494){_e80186_dma_set_dst_hi(r1+304|0,1,r3)}else if((r2|0)==65496){_e80186_dma_set_count(r1+304|0,1,r3)}else if((r2|0)==65498){_e80186_dma_set_control(r1+304|0,1,r3)}else if((r2|0)==65314){_e80186_icu_set_eoi(r1+196|0,r3)}else if((r2|0)==576){_e82730_set_ca(r1+68888|0)}else if((r2|0)==65320){_e80186_icu_set_imr(r1+196|0,r3)}else if((r2|0)==65322){_e80186_icu_set_pmr(r1+196|0,r3)}else if((r2|0)==52942){_rc759_set_msg(r1,14712,14512)}else if(!((r2|0)==65440|(r2|0)==65442|(r2|0)==65444|(r2|0)==65446|(r2|0)==65448)){_sim_log_deb(14440,(r4=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r4>>2]=r2,HEAP32[r4+8>>2]=r3&65535,r4));STACKTOP=r4}STACKTOP=r5;return}function _rc759_rtc_init(r1){HEAP32[r1+32>>2]=6e6;HEAP32[r1+36>>2]=600;HEAP8[r1+40|0]=0;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;return}function _rc759_rtc_reset(r1){var r2;r2=r1;r1=r2|0;tempBigInt=0;HEAP8[r1]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+3|0]=tempBigInt;r1=r2+4|0;tempBigInt=0;HEAP8[r1]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r1+3|0]=tempBigInt;return}function _rc759_rtc_set_irq_fct(r1,r2,r3){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;return}function _rc759_rtc_set_input_clock(r1,r2){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=(r2>>>0)/1e4&-1;return}function _rc759_rtc_set_time_now(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;HEAP32[r3>>2]=_time(0);r4=_localtime(r3);HEAP8[r1+12|0]=0;HEAP8[r1+14|0]=0;HEAP8[r1+16|0]=HEAP32[r4>>2];HEAP8[r1+18|0]=HEAP32[r4+4>>2];HEAP8[r1+20|0]=HEAP32[r4+8>>2];HEAP8[r1+22|0]=HEAP32[r4+24>>2];HEAP8[r1+24|0]=HEAP32[r4+12>>2]+255;HEAP8[r1+26|0]=HEAP32[r4+16>>2];STACKTOP=r2;return}function _rc759_rtc_get_addr(r1){return HEAP8[r1+1|0]}function _rc759_rtc_set_addr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135;r3=0;r4=r2&255;r5=r4&224;if((r5|0)==0){r6=r1+4|0;HEAP8[r6]=0;r7=r2&255;r8=r7&31;r9=r1+6|0;HEAP16[r9>>1]=r8;return}else if((r5|0)==64){r10=r1+4|0;HEAP8[r10]=1;r11=r1+6|0;r12=HEAP16[r11>>1];r13=r12&65535;r14=r1+5|0;r15=HEAP8[r14];r16=r12<<16>>16==17;if(r16){r17=r1+29|0;HEAP8[r17]=r15;return}r18=r13>>>3;r19=r18&1;r20=r13&247;switch(r20|0){case 0:{r21=(r15&255)>>>4;r22=r21*10&255;r23=r15&15;r24=r22+r23&255;r25=r19+(r1+12)|0;HEAP8[r25]=r24;return;break};case 1:{r26=(r15&255)>>>4;r27=r26*10&255;r28=r15&15;r29=r27+r28&255;r30=r19+(r1+14)|0;HEAP8[r30]=r29;return;break};case 2:{r31=(r15&255)>>>4;r32=r31*10&255;r33=r15&15;r34=r32+r33&255;r35=r19+(r1+16)|0;HEAP8[r35]=r34;return;break};case 3:{r36=(r15&255)>>>4;r37=r36*10&255;r38=r15&15;r39=r37+r38&255;r40=r19+(r1+18)|0;HEAP8[r40]=r39;return;break};case 4:{r41=(r15&255)>>>4;r42=r41*10&255;r43=r15&15;r44=r42+r43&255;r45=r19+(r1+20)|0;HEAP8[r45]=r44;return;break};case 5:{r46=(r15&255)>>>4;r47=r46*10&255;r48=r15&15;r49=r47+r48&255;r50=r19+(r1+22)|0;HEAP8[r50]=r49;return;break};case 6:{r51=(r15&255)>>>4;r52=r51*10&255;r53=r15&15;r54=r53-1&255;r55=r54+r52&255;r56=r19+(r1+24)|0;HEAP8[r56]=r55;return;break};case 7:{r57=(r15&255)>>>4;r58=r57*10&255;r59=r15&15;r60=r59-1&255;r61=r60+r58&255;r62=r19+(r1+26)|0;HEAP8[r62]=r61;return;break};default:{return}}}else if((r5|0)==128){r63=r1|0;HEAP8[r63]=0;r64=r2&255;r65=r64&31;r66=r1+2|0;HEAP16[r66>>1]=r65;return}else if((r5|0)==160){r67=r1|0;HEAP8[r67]=1;r68=r1+2|0;r69=HEAP16[r68>>1];r70=r69&65535;L31:do{if((r70|0)==20){r71=0}else if((r70|0)==16){r72=r1+28|0;r73=HEAP8[r72];HEAP8[r72]=0;r74=r1+40|0;r75=HEAP8[r74];r76=r75<<24>>24==0;if(r76){r71=r73;break}HEAP8[r74]=0;r77=r1+48|0;r78=HEAP32[r77>>2];r79=(r78|0)==0;if(r79){r71=r73;break}r80=r1+44|0;r81=HEAP32[r80>>2];FUNCTION_TABLE[r78](r81,0);r71=r73}else{r82=r70>>>3;r83=r82&1;r84=r70&247;switch(r84|0){case 3:{r85=r83+(r1+18)|0;r86=HEAP8[r85];r87=(r86&255)/10&-1;r88=r87<<4;r89=(r86&255)%10&-1;r90=r88|r89;r71=r90;break L31;break};case 4:{r91=r83+(r1+20)|0;r92=HEAP8[r91];r93=(r92&255)/10&-1;r94=r93<<4;r95=(r92&255)%10&-1;r96=r94|r95;r71=r96;break L31;break};case 5:{r97=r83+(r1+22)|0;r98=HEAP8[r97];r99=(r98&255)/10&-1;r100=r99<<4;r101=(r98&255)%10&-1;r102=r100|r101;r71=r102;break L31;break};case 6:{r103=r83+(r1+24)|0;r104=HEAP8[r103];r105=r104+1&255;r106=(r105&255)/10&-1;r107=r106<<4;r108=(r105&255)%10&-1;r109=r107|r108;r71=r109;break L31;break};case 7:{r110=r83+(r1+26)|0;r111=HEAP8[r110];r112=r111+1&255;r113=(r112&255)/10&-1;r114=r113<<4;r115=(r112&255)%10&-1;r116=r114|r115;r71=r116;break L31;break};case 0:{r117=r83+(r1+12)|0;r118=HEAP8[r117];r119=(r118&255)/10&-1;r120=r119<<4;r121=(r118&255)%10&-1;r122=r120|r121;r71=r122;break L31;break};case 2:{r123=r83+(r1+16)|0;r124=HEAP8[r123];r125=(r124&255)/10&-1;r126=r125<<4;r127=(r124&255)%10&-1;r128=r126|r127;r71=r128;break L31;break};case 1:{r129=r83+(r1+14)|0;r130=HEAP8[r129];r131=(r130&255)/10&-1;r132=r131<<4;r133=(r130&255)%10&-1;r134=r132|r133;r71=r134;break L31;break};default:{r71=0;break L31}}}}while(0);r135=r1+1|0;HEAP8[r135]=r71;return}else{return}}function _rc759_rtc_set_data(r1,r2){HEAP8[r1+5|0]=r2;return}function _rc759_rtc_clock(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r1+8|0;r4=HEAP32[r3>>2]+r2|0;HEAP32[r3>>2]=r4;r2=HEAP32[r1+36>>2];if(r4>>>0<r2>>>0){return}HEAP32[r3>>2]=r4-r2;r2=r1+12|0;r4=HEAP8[r2];r3=r4+1&255;HEAP8[r2]=r3;if((r3&255)<100){return}HEAP8[r2]=r4-99;r4=r1+14|0;r2=HEAP8[r4];r3=r2+1&255;HEAP8[r4]=r3;if((r3&255)<100){return}HEAP8[r4]=r2-99;r2=r1+16|0;r4=HEAP8[r2]+1&255;HEAP8[r2]=r4;r3=r1+29|0;do{if((HEAP8[r3]&4)==0){r5=r4}else{r6=r1+28|0;HEAP8[r6]=HEAP8[r6]|4;r6=r1+40|0;if((HEAP8[r6]|0)==1){r5=r4;break}HEAP8[r6]=1;r6=HEAP32[r1+48>>2];if((r6|0)==0){r5=r4;break}FUNCTION_TABLE[r6](HEAP32[r1+44>>2],1);r5=HEAP8[r2]}}while(0);if((r5&255)<60){return}HEAP8[r2]=r5-60;r5=r1+18|0;r2=HEAP8[r5]+1&255;HEAP8[r5]=r2;do{if((HEAP8[r3]&8)==0){r7=r2}else{r4=r1+28|0;HEAP8[r4]=HEAP8[r4]|8;r4=r1+40|0;if((HEAP8[r4]|0)==1){r7=r2;break}HEAP8[r4]=1;r4=HEAP32[r1+48>>2];if((r4|0)==0){r7=r2;break}FUNCTION_TABLE[r4](HEAP32[r1+44>>2],1);r7=HEAP8[r5]}}while(0);if((r7&255)<60){return}HEAP8[r5]=r7-60;r7=r1+20|0;r5=HEAP8[r7]+1&255;HEAP8[r7]=r5;do{if((HEAP8[r3]&16)==0){r8=r5}else{r2=r1+28|0;HEAP8[r2]=HEAP8[r2]|16;r2=r1+40|0;if((HEAP8[r2]|0)==1){r8=r5;break}HEAP8[r2]=1;r2=HEAP32[r1+48>>2];if((r2|0)==0){r8=r5;break}FUNCTION_TABLE[r2](HEAP32[r1+44>>2],1);r8=HEAP8[r7]}}while(0);if((r8&255)<24){return}HEAP8[r7]=r8-24;r8=r1+22|0;HEAP8[r8]=HEAP8[r8]+1;r8=r1+24|0;HEAP8[r8]=HEAP8[r8]+1;return}function _rc759_spk_init(r1){var r2;HEAP32[r1>>2]=0;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=0;HEAP32[r1+8>>2]=0;r2=r1+6|0;HEAP16[r2>>1]=-32768;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;HEAP32[r1+20>>2]=32768;HEAP32[r1+24>>2]=44100;HEAP32[r1+28>>2]=1e6;HEAP32[r1+32>>2]=0;_snd_iir2_init(r1+36|0);HEAP32[r1+84>>2]=0;HEAP16[r1+2136>>1]=0;HEAP16[r1+2138>>1]=-16385;HEAP16[r1+2140>>1]=16385;HEAP16[r2>>1]=16385;return}function _rc759_spk_set_volume(r1,r2){var r3;r3=r2>>>0>1e3?32767:((r2*32767&-1)>>>0)/1e3&-1;HEAP16[r1+2136>>1]=0;HEAP16[r1+2138>>1]=r3+32768;HEAP16[r1+2140>>1]=32768-r3;return}function _rc759_spk_set_clk_fct(r1,r2,r3){HEAP32[r1+2144>>2]=r2;HEAP32[r1+2148>>2]=r3;return}function _rc759_spk_set_input_clock(r1,r2){HEAP32[r1+28>>2]=r2;return}function _rc759_spk_set_driver(r1,r2,r3){var r4,r5,r6;r4=r1|0;r5=HEAP32[r4>>2];if((r5|0)!=0){_snd_close(r5)}r5=_snd_open(r2);HEAP32[r4>>2]=r5;if((r5|0)==0){r6=1;return r6}HEAP32[r1+24>>2]=r3;if((_snd_set_params(r5,1,r3,1)|0)==0){r6=0;return r6}_snd_close(HEAP32[r4>>2]);HEAP32[r4>>2]=0;r6=1;return r6}function _rc759_spk_set_lowpass(r1,r2){HEAP32[r1+32>>2]=r2;_snd_iir2_set_lowpass(r1+36|0,r2,HEAP32[r1+24>>2]);return}function _rc759_spk_set_out(r1,r2){_rc759_spk_check(r1);HEAP8[r1+5|0]=r2<<24>>24!=0|0;return}function _rc759_spk_check(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=HEAP16[((HEAP8[r1+5|0]|0)==0?r1+2140|0:r1+2138|0)>>1];r3=FUNCTION_TABLE[HEAP32[r1+2148>>2]](HEAP32[r1+2144>>2]);r4=r1+12|0;r5=HEAP32[r4>>2];r6=r3-r5|0;HEAP32[r4>>2]=r3;r4=r1+4|0;r7=r1+6|0;r8=r2&65535;r9=(HEAP16[r7>>1]|0)==r2<<16>>16;if((HEAP8[r4]|0)==0){if(r9){return}HEAP8[r4]=1;HEAP16[r7>>1]=-32768;HEAP32[r1+8>>2]=0;HEAP32[r1+20>>2]=32768;HEAP32[r1+16>>2]=0;r10=HEAP32[r1+24>>2]>>>3;r11=r1|0;if((HEAP32[r11>>2]|0)==0){return}r12=r1+84|0;r13=HEAP32[r12>>2];if((r10|0)==0){r14=r13}else{r15=r1+88|0;r16=r1+32|0;r17=r1+36|0;r18=r10;r10=r13;while(1){r13=r10+1|0;HEAP16[r1+88+(r10<<1)>>1]=0;if(r13>>>0>1023){if((HEAP32[r16>>2]|0)!=0){_snd_iir2_filter(r17,r15,r15,r13,1,1)}_snd_write(HEAP32[r11>>2],r15,r13);r19=0}else{r19=r13}r13=r18-1|0;if((r13|0)==0){r14=r19;break}else{r18=r13;r10=r19}}}HEAP32[r12>>2]=r14;return}do{if(r9){r14=r1+8|0;r12=HEAP32[r14>>2]+r6|0;HEAP32[r14>>2]=r12;if(r12>>>0<=HEAP32[r1+28>>2]>>>0){break}HEAP8[r4]=0;r12=r1+84|0;r14=HEAP32[r12>>2];if((r14|0)==0){return}r19=r1+88|0;r10=r1+36|0;if((HEAP32[r1+32>>2]|0)!=0){_snd_iir2_filter(r10,r19,r19,r14,1,1)}_snd_write(HEAP32[r1>>2],r19,r14);_snd_iir2_reset(r10);HEAP32[r12>>2]=0;return}else{HEAP16[r7>>1]=r2;HEAP32[r1+8>>2]=r6}}while(0);r2=r1+20|0;r7=HEAP32[r2>>2];if((r3|0)==(r5|0)){r20=r7}else{r5=r1+24|0;r3=r1+16|0;r4=r1+28|0;r9=r1|0;r12=r1+84|0;r10=r1+88|0;r14=r1+32|0;r19=r1+36|0;r18=r7;r7=r6;r6=HEAP32[r3>>2];r15=HEAP32[r4>>2];while(1){r11=((r18*63&-1)+r8|0)>>>6;r17=r6+HEAP32[r5>>2]|0;HEAP32[r3>>2]=r17;if(r17>>>0<r15>>>0){r21=r17;r22=r15}else{if((HEAP32[r9>>2]|0)==0){r23=r15;r24=r17}else{r17=HEAP32[r12>>2];r16=r17+1|0;HEAP16[r1+88+(r17<<1)>>1]=r11^32768;if(r16>>>0>1023){if((HEAP32[r14>>2]|0)!=0){_snd_iir2_filter(r19,r10,r10,r16,1,1)}_snd_write(HEAP32[r9>>2],r10,r16);r25=0}else{r25=r16}HEAP32[r12>>2]=r25;r23=HEAP32[r4>>2];r24=HEAP32[r3>>2]}r16=r24-r23|0;HEAP32[r3>>2]=r16;r21=r16;r22=r23}r16=r7-1|0;if((r16|0)==0){r20=r11;break}else{r18=r11;r7=r16;r6=r21;r15=r22}}}HEAP32[r2>>2]=r20;return}function _rc759_spk_clock(r1,r2){_rc759_spk_check(r1);return}function _e82730_init(r1){var r2;HEAP8[r1|0]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP32[r1+12>>2]=851968;HEAP8[r1+20|0]=0;HEAP8[r1+21|0]=0;HEAP8[r1+22|0]=1;HEAP32[r1+88>>2]=1048575;HEAP32[r1+136>>2]=r1+144;HEAP32[r1+140>>2]=r1+676;HEAP32[r1+104>>2]=7080;r2=r1+108|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r1+96>>2]=1;HEAP32[r1+100>>2]=1;HEAP32[r1+132>>2]=0;HEAP32[r1+1268>>2]=0;HEAP32[r1+1272>>2]=0;r2=r1+1240|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP8[r2+24|0]=0;return}function _e82730_set_getmem_fct(r1,r2,r3,r4){HEAP32[r1+1252>>2]=r2;HEAP32[r1+1256>>2]=r3;HEAP32[r1+1260>>2]=r4;return}function _e82730_set_setmem_fct(r1,r2,r3,r4){HEAP32[r1+1240>>2]=r2;HEAP32[r1+1244>>2]=r3;HEAP32[r1+1248>>2]=r4;return}function _e82730_set_sint_fct(r1,r2,r3){HEAP32[r1+1268>>2]=r2;HEAP32[r1+1272>>2]=r3;return}function _e82730_set_clock(r1,r2,r3){HEAP32[r1+96>>2]=r2;HEAP32[r1+100>>2]=r3;return}function _e82730_set_terminal(r1,r2){HEAP32[r1+132>>2]=r2;return}function _e82730_set_monochrome(r1,r2){var r3;r3=(r2|0)!=0;HEAP8[r1+21|0]=r3&1;HEAP32[r1+104>>2]=r3?7016:7080;return}function _e82730_set_graphic(r1,r2){HEAP8[r1+20|0]=(r2|0)!=0|0;return}function _e82730_set_min_h(r1,r2){var r3,r4,r5,r6,r7;HEAP32[r1+124>>2]=r2;r3=HEAPU16[r1+36>>1]-HEAPU16[r1+34>>1]|0;r4=r3<<4;r5=HEAPU16[r1+42>>1]-HEAPU16[r1+40>>1]+64|0;r6=r5>>>0<r2>>>0?r2:r5;r5=Math_imul(r3*48&-1,r6)|0;r3=r1+112|0;do{if((HEAP32[r3>>2]|0)!=(r5|0)){r2=r1+108|0;r7=_realloc(HEAP32[r2>>2],r5);if((r7|0)==0){return}else{HEAP32[r2>>2]=r7;HEAP32[r3>>2]=r5;break}}}while(0);HEAP32[r1+116>>2]=r4;HEAP32[r1+120>>2]=r6;HEAP32[r1+128>>2]=0;return}function _e82730_reset(r1){var r2;HEAP8[r1|0]=0;HEAP32[r1+4>>2]=0;HEAP32[r1+8>>2]=0;HEAP16[r1+16>>1]=-1;HEAP8[r1+22|0]=1;HEAP8[r1+23|0]=0;HEAP8[r1+28|0]=0;HEAP8[r1+29|0]=0;HEAP8[r1+30|0]=0;HEAP8[r1+50|0]=0;HEAP8[r1+52|0]=0;r2=r1+45|0;tempBigInt=0;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;HEAP8[r1+54|0]=-1;HEAP8[r1+56|0]=-1;HEAP8[r1+58|0]=-1;HEAP8[r1+60|0]=-1;HEAP8[r1+49|0]=0;HEAP8[r1+51|0]=0;HEAP8[r1+53|0]=0;HEAP8[r1+55|0]=-1;HEAP8[r1+57|0]=-1;HEAP8[r1+59|0]=-1;HEAP8[r1+61|0]=-1;HEAP16[r1+62>>1]=0;HEAP16[r1+64>>1]=2;HEAP16[r1+66>>1]=28;HEAP16[r1+18>>1]=0;HEAP32[r1+80>>2]=0;r2=r1+136|0;HEAP8[HEAP32[r2>>2]|0]=0;HEAP16[HEAP32[r2>>2]+2>>1]=0;r2=r1+140|0;HEAP8[HEAP32[r2>>2]|0]=0;HEAP16[HEAP32[r2>>2]+2>>1]=0;_memset(r1+1208|0,112,31)|0;HEAP32[r1+116>>2]=0;HEAP32[r1+120>>2]=0;HEAP32[r1+128>>2]=0;r2=r1+1264|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+1272>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+1268>>2],0);return}function _e82730_set_palette(r1,r2,r3){if(r2>>>0>=64){return}HEAP8[r2+(r1+1208)|0]=r3;return}function _e82730_get_palette(r1,r2){var r3;if(r2>>>0<64){r3=HEAP8[r2+(r1+1208)|0]}else{r3=0}return r3}function _e82730_set_ca(r1){HEAP8[r1+30|0]=1;if((HEAP16[r1+18>>1]&128)!=0){return}_e82730_check_ca(r1);return}function _e82730_check_ca(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490;r2=0;r3=r1+30|0;r4=HEAP8[r3];r5=r4<<24>>24==0;if(r5){return}HEAP8[r3]=0;r6=r1+22|0;r7=HEAP8[r6];r8=r7<<24>>24==0;if(r8){r9=r1+8|0;r10=r1+1256|0;r11=r9;r12=r10}else{HEAP8[r6]=0;r13=r1+1256|0;r14=HEAP32[r13>>2];r15=(r14|0)==0;if(r15){r16=0}else{r17=r1+1252|0;r18=HEAP32[r17>>2];r19=r1+88|0;r20=HEAP32[r19>>2];r21=r20&-10;r22=FUNCTION_TABLE[r14](r18,r21);r16=r22}r23=r1|0;HEAP8[r23]=r16;r24=r1+1260|0;r25=HEAP32[r24>>2];r26=(r25|0)==0;if(r26){r27=0}else{r28=r1+1252|0;r29=HEAP32[r28>>2];r30=r1+88|0;r31=HEAP32[r30>>2];r32=r31&-4;r33=FUNCTION_TABLE[r25](r29,r32);r34=r33&65535;r35=HEAP32[r24>>2];r36=HEAP32[r28>>2];r37=HEAP32[r30>>2];r38=r37&-2;r39=FUNCTION_TABLE[r35](r36,r38);r40=r39&65535;r41=r40<<16;r42=r41|r34;r27=r42}r43=r1+4|0;HEAP32[r43>>2]=r27;r44=HEAP32[r13>>2];r45=(r44|0)==0;if(r45){r46=0;r47=r27}else{r48=r1+1252|0;r49=HEAP32[r48>>2];r50=r1+88|0;r51=HEAP32[r50>>2];r52=r51&r27;r53=FUNCTION_TABLE[r44](r49,r52);r54=HEAP32[r43>>2];r46=r53;r47=r54}HEAP8[r23]=r46;r55=HEAP32[r24>>2];r56=(r55|0)==0;if(r56){r57=0}else{r58=r47+2|0;r59=r1+1252|0;r60=HEAP32[r59>>2];r61=r1+88|0;r62=HEAP32[r61>>2];r63=r62&r58;r64=FUNCTION_TABLE[r55](r60,r63);r65=r64&65535;r66=HEAP32[r24>>2];r67=HEAP32[r59>>2];r68=r47+4|0;r69=HEAP32[r61>>2];r70=r69&r68;r71=FUNCTION_TABLE[r66](r67,r70);r72=r71&65535;r73=r72<<16;r74=r73|r65;r57=r74}r75=r1+8|0;HEAP32[r75>>2]=r57;r11=r75;r12=r13}r76=HEAP32[r12>>2];r77=(r76|0)==0;do{if(r77){r78=0}else{r79=HEAP32[r11>>2];r80=r79+1|0;r81=r1+1252|0;r82=HEAP32[r81>>2];r83=r1+88|0;r84=HEAP32[r83>>2];r85=r84&r80;r86=FUNCTION_TABLE[r76](r82,r85);r87=r86<<24>>24==5;if(!r87){r78=r86;break}r88=HEAP32[r11>>2];r89=r1+1260|0;r90=HEAP32[r89>>2];r91=(r90|0)==0;if(r91){r92=0}else{r93=r88+14|0;r94=HEAP32[r81>>2];r95=HEAP32[r83>>2];r96=r95&r93;r97=FUNCTION_TABLE[r90](r94,r96);r98=r97&65535;r99=HEAP32[r89>>2];r100=HEAP32[r81>>2];r101=r88+16|0;r102=HEAP32[r83>>2];r103=r102&r101;r104=FUNCTION_TABLE[r99](r100,r103);r105=r104&65535;r106=r105<<16;r107=r106|r98;r92=r107}HEAP32[r11>>2]=r92;r108=HEAP32[r12>>2];r109=(r108|0)==0;if(r109){r78=0;break}r110=r92+1|0;r111=HEAP32[r81>>2];r112=HEAP32[r83>>2];r113=r112&r110;r114=FUNCTION_TABLE[r108](r111,r113);r78=r114}}while(0);r115=r1+1260|0;r116=HEAP32[r115>>2];r117=(r116|0)==0;do{if(r117){r118=r1+24|0;HEAP8[r118]=0;r119=r1+25|0;HEAP8[r119]=0;r120=0}else{r121=HEAP32[r11>>2];r122=r121+2|0;r123=r1+1252|0;r124=HEAP32[r123>>2];r125=r1+88|0;r126=HEAP32[r125>>2];r127=r126&r122;r128=FUNCTION_TABLE[r116](r124,r127);r129=(r128&65535)>>>6;r130=r129&255;r131=(r128&65535)>>>7;r132=r131&255;r133=r130&1;r134=r132&1;r135=HEAP32[r115>>2];r136=r1+24|0;HEAP8[r136]=r133;r137=r1+25|0;HEAP8[r137]=r134;r138=(r135|0)==0;if(r138){r120=0;break}r139=HEAP32[r11>>2];r140=r139+4|0;r141=r1+1252|0;r142=HEAP32[r141>>2];r143=r1+88|0;r144=HEAP32[r143>>2];r145=r144&r140;r146=FUNCTION_TABLE[r135](r142,r145);r147=r146&255;r120=r147}}while(0);r148=r1+26|0;HEAP16[r148>>1]=r120;r149=r78&255;L33:do{switch(r149|0){case 1:{r150=r1+23|0;r151=HEAP8[r150];r152=r151<<24>>24==0;if(r152){break L33}r153=r1+18|0;r154=HEAP16[r153>>1];r155=r154|128;HEAP16[r153>>1]=r155;break};case 3:{r156=r1+18|0;r157=HEAP16[r156>>1];r158=r157&-385;HEAP16[r156>>1]=r158;break};case 4:{r159=HEAP32[r11>>2];r160=HEAP32[r115>>2];r161=(r160|0)==0;do{if(r161){r162=0;r2=29}else{r163=r159+30|0;r164=r1+1252|0;r165=HEAP32[r164>>2];r166=r1+88|0;r167=HEAP32[r166>>2];r168=r167&r163;r169=FUNCTION_TABLE[r160](r165,r168);r170=r169&65535;r171=HEAP32[r115>>2];r172=HEAP32[r164>>2];r173=r159+32|0;r174=HEAP32[r166>>2];r175=r174&r173;r176=FUNCTION_TABLE[r171](r172,r175);r177=r176&65535;r178=r177<<16;r179=r178|r170;r180=HEAP32[r115>>2];r181=(r180|0)==0;if(r181){r162=r179;r2=29;break}r182=r179+2|0;r183=HEAP32[r164>>2];r184=HEAP32[r166>>2];r185=r184&r182;r186=FUNCTION_TABLE[r180](r183,r185);r187=(r186&65535)>>>8;r188=HEAP32[r115>>2];r189=r1+32|0;HEAP16[r189>>1]=r187;r190=(r188|0)==0;if(r190){r191=0;r192=0;r193=r179;break}r194=r179+4|0;r195=HEAP32[r164>>2];r196=HEAP32[r166>>2];r197=r196&r194;r198=FUNCTION_TABLE[r188](r195,r197);r199=HEAP32[r115>>2];r191=r198;r192=r199;r193=r179}}while(0);if(r2==29){r200=r1+32|0;HEAP16[r200>>1]=0;r191=0;r192=0;r193=r162}r201=(r191&65535)>>>8;r202=r1+34|0;HEAP16[r202>>1]=r201;r203=r191&255;r204=r1+36|0;HEAP16[r204>>1]=r203;r205=(r192|0)==0;do{if(r205){r206=r1+44|0;HEAP8[r206]=0;r207=r1+45|0;HEAP8[r207]=0;r2=35}else{r208=r193+10|0;r209=r1+1252|0;r210=HEAP32[r209>>2];r211=r1+88|0;r212=HEAP32[r211>>2];r213=r212&r208;r214=FUNCTION_TABLE[r192](r210,r213);r215=r214&255;r216=(r214&65535)>>>10;r217=r216&255;r218=r215&31;r219=r217&1;r220=HEAP32[r115>>2];r221=r1+44|0;HEAP8[r221]=r218;r222=r1+45|0;HEAP8[r222]=r219;r223=(r220|0)==0;if(r223){r2=35;break}r224=r193+18|0;r225=HEAP32[r209>>2];r226=HEAP32[r211>>2];r227=r226&r224;r228=FUNCTION_TABLE[r220](r225,r227);r229=r228&255;r230=(r228&65535)>>>8;r231=r230&255;r232=r231&31;r233=r229&31;r234=HEAP32[r115>>2];r235=r1+58|0;HEAP8[r235]=r232;r236=r1+60|0;HEAP8[r236]=r233;r237=(r234|0)==0;if(r237){r2=37;break}r238=r193+20|0;r239=HEAP32[r209>>2];r240=HEAP32[r211>>2];r241=r240&r238;r242=FUNCTION_TABLE[r234](r239,r241);r243=r242&255;r244=(r242&65535)>>>8;r245=r244&255;r246=r245&31;r247=r243&31;r248=HEAP32[r115>>2];r249=r1+59|0;HEAP8[r249]=r246;r250=r1+61|0;HEAP8[r250]=r247;r251=(r248|0)==0;if(r251){r2=39;break}r252=r193+26|0;r253=HEAP32[r209>>2];r254=HEAP32[r211>>2];r255=r254&r252;r256=FUNCTION_TABLE[r248](r253,r255);r257=r256&2047;r258=HEAP32[r115>>2];r259=r1+38|0;HEAP16[r259>>1]=r257;r260=(r258|0)==0;if(r260){r2=41;break}r261=r193+30|0;r262=HEAP32[r209>>2];r263=HEAP32[r211>>2];r264=r263&r261;r265=FUNCTION_TABLE[r258](r262,r264);r266=r265&2047;r267=HEAP32[r115>>2];r268=r1+40|0;HEAP16[r268>>1]=r266;r269=(r267|0)==0;if(r269){r270=r268;r2=43;break}r271=r193+32|0;r272=HEAP32[r209>>2];r273=HEAP32[r211>>2];r274=r273&r271;r275=FUNCTION_TABLE[r267](r272,r274);r276=r275&2047;r277=HEAP32[r115>>2];r278=r1+42|0;HEAP16[r278>>1]=r276;r279=(r277|0)==0;if(r279){r280=0;r281=0;r282=r268;r283=r278;break}r284=r193+38|0;r285=HEAP32[r209>>2];r286=HEAP32[r211>>2];r287=r286&r284;r288=FUNCTION_TABLE[r277](r285,r287);r289=HEAP32[r115>>2];r280=r288;r281=r289;r282=r268;r283=r278}}while(0);if(r2==35){r290=r1+58|0;HEAP8[r290]=0;r291=r1+60|0;HEAP8[r291]=0;r2=37}if(r2==37){r292=r1+59|0;HEAP8[r292]=0;r293=r1+61|0;HEAP8[r293]=0;r2=39}if(r2==39){r294=r1+38|0;HEAP16[r294>>1]=0;r2=41}if(r2==41){r295=r1+40|0;HEAP16[r295>>1]=0;r270=r295;r2=43}if(r2==43){r296=r1+42|0;HEAP16[r296>>1]=0;r280=0;r281=0;r282=r270;r283=r296}r297=r280&255;r298=r297&15;r299=r1+28|0;HEAP8[r299]=r298;r300=(r280&65535)>>>8;r301=r300<<2;r302=r301&124;r303=r1+66|0;HEAP16[r303>>1]=r302;r304=(r280&65535)>>>13;r305=r1+64|0;HEAP16[r305>>1]=r304;r306=(r281|0)==0;do{if(r306){r307=r1+52|0;HEAP8[r307]=0;r308=r1+53|0;HEAP8[r308]=0;r309=0;r310=0;r311=0;r312=0}else{r313=r193+40|0;r314=r1+1252|0;r315=HEAP32[r314>>2];r316=r1+88|0;r317=HEAP32[r316>>2];r318=r317&r313;r319=FUNCTION_TABLE[r281](r315,r318);r320=r319&255;r321=(r319&65535)>>>1;r322=r321&255;r323=r320&1;r324=r322&1;r325=HEAP32[r115>>2];r326=r1+52|0;HEAP8[r326]=r323;r327=r1+53|0;HEAP8[r327]=r324;r328=(r325|0)==0;if(r328){r309=0;r310=0;r311=0;r312=0;break}r329=r193+42|0;r330=HEAP32[r314>>2];r331=HEAP32[r316>>2];r332=r331&r329;r333=FUNCTION_TABLE[r325](r330,r332);r334=r333&255;r335=(r333&65535)>>>1;r336=r335&255;r337=(r333&65535)>>>2;r338=r337&255;r339=(r333&65535)>>>3;r340=r339&255;r341=r334&1;r342=r336&1;r343=r338&1;r344=r340&1;r309=r344;r310=r343;r311=r342;r312=r341}}while(0);r345=r1+48|0;HEAP8[r345]=r312;r346=r1+49|0;HEAP8[r346]=r311;r347=r1+50|0;HEAP8[r347]=r310;r348=r1+51|0;HEAP8[r348]=r309;r349=HEAP16[r204>>1];r350=r349&65535;r351=HEAP16[r202>>1];r352=r351&65535;r353=r350-r352|0;r354=r353<<4;r355=HEAP16[r283>>1];r356=r355&65535;r357=HEAP16[r282>>1];r358=r357&65535;r359=r356-r358|0;r360=r359+64|0;r361=r1+124|0;r362=HEAP32[r361>>2];r363=r360>>>0<r362>>>0;r364=r363?r362:r360;r365=r353*48&-1;r366=Math_imul(r365,r364)|0;r367=r1+112|0;r368=HEAP32[r367>>2];r369=(r368|0)==(r366|0);do{if(r369){r2=53}else{r370=r1+108|0;r371=HEAP32[r370>>2];r372=_realloc(r371,r366);r373=(r372|0)==0;if(r373){break}HEAP32[r370>>2]=r372;HEAP32[r367>>2]=r366;r2=53}}while(0);if(r2==53){r374=r1+116|0;HEAP32[r374>>2]=r354;r375=r1+120|0;HEAP32[r375>>2]=r364;r376=r1+128|0;HEAP32[r376>>2]=0}r377=r1+23|0;HEAP8[r377]=1;break};case 5:{r378=HEAP32[r11>>2];r379=HEAP32[r115>>2];r380=(r379|0)==0;if(r380){r381=0}else{r382=r378+14|0;r383=r1+1252|0;r384=HEAP32[r383>>2];r385=r1+88|0;r386=HEAP32[r385>>2];r387=r386&r382;r388=FUNCTION_TABLE[r379](r384,r387);r389=r388&65535;r390=HEAP32[r115>>2];r391=HEAP32[r383>>2];r392=r378+16|0;r393=HEAP32[r385>>2];r394=r393&r392;r395=FUNCTION_TABLE[r390](r391,r394);r396=r395&65535;r397=r396<<16;r398=r397|r389;r381=r398}HEAP32[r11>>2]=r381;break};case 6:{r399=HEAP32[r115>>2];r400=(r399|0)==0;if(r400){r401=0}else{r402=HEAP32[r11>>2];r403=r402+22|0;r404=r1+1252|0;r405=HEAP32[r404>>2];r406=r1+88|0;r407=HEAP32[r406>>2];r408=r407&r403;r409=FUNCTION_TABLE[r399](r405,r408);r401=r409}r410=r1+16|0;HEAP16[r410>>1]=r401;break};case 8:{r411=r1+1248|0;r412=HEAP32[r411>>2];r413=(r412|0)==0;if(r413){break L33}r414=r1+18|0;r415=HEAP32[r11>>2];r416=HEAP16[r414>>1];r417=r415+18|0;r418=r1+1240|0;r419=HEAP32[r418>>2];r420=r1+88|0;r421=HEAP32[r420>>2];r422=r421&r417;FUNCTION_TABLE[r412](r419,r422,r416);break};case 9:{r423=HEAP32[r115>>2];r424=(r423|0)==0;do{if(r424){r425=0;r426=0;r427=0;r428=0}else{r429=HEAP32[r11>>2];r430=r429+26|0;r431=r1+1252|0;r432=HEAP32[r431>>2];r433=r1+88|0;r434=HEAP32[r433>>2];r435=r434&r430;r436=FUNCTION_TABLE[r423](r432,r435);r437=HEAP32[r115>>2];r438=(r437|0)==0;r439=r436&255;r440=(r436&65535)>>>8;r441=r440&255;if(r438){r425=0;r426=0;r427=r441;r428=r439;break}r442=HEAP32[r11>>2];r443=r442+28|0;r444=HEAP32[r431>>2];r445=HEAP32[r433>>2];r446=r445&r443;r447=FUNCTION_TABLE[r437](r444,r446);r448=r447&255;r449=(r447&65535)>>>8;r450=r449&255;r425=r450;r426=r448;r427=r441;r428=r439}}while(0);r451=r1+54|0;HEAP8[r451]=r428;r452=r1+56|0;HEAP8[r452]=r427;r453=r1+55|0;HEAP8[r453]=r426;r454=r1+57|0;HEAP8[r454]=r425;break};case 0:{break};default:{r455=r1+18|0;r456=HEAP16[r455>>1];r457=r456|32;HEAP16[r455>>1]=r457;r458=r1+16|0;r459=HEAP16[r458>>1];r460=r459^-385;r461=r457&-385;r462=r461&r460;r463=r1+1248|0;r464=HEAP32[r463>>2];r465=(r464|0)==0;if(!r465){r466=HEAP32[r11>>2];r467=r466+20|0;r468=r1+1240|0;r469=HEAP32[r468>>2];r470=r1+88|0;r471=HEAP32[r470>>2];r472=r471&r467;FUNCTION_TABLE[r464](r469,r472,r462)}r473=r462<<16>>16==0;if(r473){break L33}r474=r1+1264|0;r475=HEAP8[r474];r476=r475<<24>>24==1;if(r476){break L33}HEAP8[r474]=1;r477=r1+1272|0;r478=HEAP32[r477>>2];r479=(r478|0)==0;if(r479){break L33}r480=r1+1268|0;r481=HEAP32[r480>>2];FUNCTION_TABLE[r478](r481,1)}}}while(0);r482=r1+1244|0;r483=HEAP32[r482>>2];r484=(r483|0)==0;if(r484){return}r485=HEAP32[r11>>2];r486=r1+1240|0;r487=HEAP32[r486>>2];r488=r1+88|0;r489=HEAP32[r488>>2];r490=r489&r485;FUNCTION_TABLE[r483](r487,r490,0);return}function _e82730_set_srst(r1){var r2;r2=r1+1264|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+1272>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+1268>>2],0);return}function _e82730_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185,r186,r187,r188,r189,r190,r191,r192,r193,r194,r195,r196,r197,r198,r199,r200,r201,r202,r203,r204,r205,r206,r207,r208,r209,r210,r211,r212,r213,r214,r215,r216,r217,r218,r219,r220,r221,r222,r223,r224,r225,r226,r227,r228,r229,r230,r231,r232,r233,r234,r235,r236,r237,r238,r239,r240,r241,r242,r243,r244,r245,r246,r247,r248,r249,r250,r251,r252,r253,r254,r255,r256,r257,r258,r259,r260,r261,r262,r263,r264,r265,r266,r267,r268,r269,r270,r271,r272,r273,r274,r275,r276,r277,r278,r279,r280,r281,r282,r283,r284,r285,r286,r287,r288,r289,r290,r291,r292,r293,r294,r295,r296,r297,r298,r299,r300,r301,r302,r303,r304,r305,r306,r307,r308,r309,r310,r311,r312,r313,r314,r315,r316,r317,r318,r319,r320,r321,r322,r323,r324,r325,r326,r327,r328,r329,r330,r331,r332,r333,r334,r335,r336,r337,r338,r339,r340,r341,r342,r343,r344,r345,r346,r347,r348,r349,r350,r351,r352,r353,r354,r355,r356,r357,r358,r359,r360,r361,r362,r363,r364,r365,r366,r367,r368,r369,r370,r371,r372,r373,r374,r375,r376,r377,r378,r379,r380,r381,r382,r383,r384,r385,r386,r387,r388,r389,r390,r391,r392,r393,r394,r395,r396,r397,r398,r399,r400,r401,r402,r403,r404,r405,r406,r407,r408,r409,r410,r411,r412,r413,r414,r415,r416,r417,r418,r419,r420,r421,r422,r423,r424,r425,r426,r427,r428,r429,r430,r431,r432,r433,r434,r435,r436,r437,r438,r439,r440,r441,r442,r443,r444,r445,r446,r447,r448,r449,r450,r451,r452,r453,r454,r455,r456,r457,r458,r459,r460,r461,r462,r463,r464,r465,r466,r467,r468,r469,r470,r471,r472,r473,r474,r475,r476,r477,r478,r479,r480,r481,r482,r483,r484,r485,r486,r487,r488,r489,r490,r491,r492,r493,r494,r495,r496,r497,r498,r499,r500,r501,r502,r503,r504,r505,r506,r507,r508,r509,r510,r511,r512,r513,r514,r515,r516,r517,r518,r519,r520,r521,r522,r523,r524,r525,r526,r527,r528,r529,r530,r531,r532,r533,r534,r535,r536,r537,r538,r539,r540,r541,r542,r543,r544,r545,r546,r547,r548,r549,r550,r551,r552,r553,r554,r555,r556,r557,r558,r559,r560,r561,r562;r3=0;r4=r1+23|0;r5=HEAP8[r4];r6=r5<<24>>24==0;if(r6){return}r7=r1+96|0;r8=HEAP32[r7>>2];r9=Math_imul(r8,r2)|0;r10=r1+92|0;r11=HEAP32[r10>>2];r12=r11+r9|0;HEAP32[r10>>2]=r12;r13=r1+100|0;r14=HEAP32[r13>>2];r15=r1+32|0;r16=HEAP16[r15>>1];r17=r16&65535;r18=Math_imul(r17,r14)|0;r19=r12>>>0<r18>>>0;if(r19){return}r20=r1+18|0;r21=r1+68|0;r22=r1+40|0;r23=r1+8|0;r24=r1+25|0;r25=r1+1260|0;r26=r1+76|0;r27=r1+84|0;r28=r1+136|0;r29=r1+140|0;r30=r1+46|0;r31=r1+1252|0;r32=r1+88|0;r33=r1+38|0;r34=r1+120|0;r35=r1+128|0;r36=r1+124|0;r37=r1+108|0;r38=r1+116|0;r39=r1+132|0;r40=r1+31|0;r41=r1+62|0;r42=r1+66|0;r43=r1+29|0;r44=r1+28|0;r45=r1+16|0;r46=r1+1248|0;r47=r1+1264|0;r48=r1+1272|0;r49=r1+1268|0;r50=r1+1240|0;r51=r1+42|0;r52=r1+70|0;r53=r1+72|0;r54=r1+44|0;r55=r1+45|0;r56=r1+58|0;r57=r1+60|0;r58=r1+59|0;r59=r1+61|0;r60=r1+26|0;r61=r1+24|0;while(1){r62=HEAP16[r20>>1];r63=r62&128;r64=r63<<16>>16==0;L9:do{if(!r64){r65=HEAP32[r29>>2];r66=r65|0;r67=HEAP8[r66];r68=r67<<24>>24==0;if(!r68){break}r69=HEAP8[r40];r70=r69<<24>>24==0;if(!r70){HEAP8[r66]=1;break}r71=r65+2|0;r72=r65+516|0;L15:while(1){r73=HEAP32[r25>>2];r74=(r73|0)==0;r75=HEAP32[r27>>2];L17:do{if(r74){r76=r75+2|0;HEAP32[r27>>2]=r76;r77=0;r3=38}else{r78=HEAP32[r31>>2];r79=HEAP32[r32>>2];r80=r79&r75;r81=FUNCTION_TABLE[r73](r78,r80);r82=HEAP32[r27>>2];r83=r82+2|0;HEAP32[r27>>2]=r83;r84=r81<<16>>16>-1;if(r84){r77=r81;r3=38;break}r85=r81&65535;r86=r85&49152;r87=(r86|0)==49152;if(r87){break}r88=r85>>>8;switch(r88|0){case 128:{r3=14;break L15;break};case 129:{HEAP8[r40]=1;break L17;break};case 130:{r3=16;break L15;break};case 131:{r89=r85&255;r90=r89>>>0>7;if(r90){break L17}r91=(r89|0)==0;if(!r91){r92=0;r93=r83;while(1){r94=HEAP32[r25>>2];r95=(r94|0)==0;if(r95){r96=0}else{r97=HEAP32[r31>>2];r98=HEAP32[r32>>2];r99=r98&r93;r100=FUNCTION_TABLE[r94](r97,r99);r96=r100}r101=r65+518+(r92<<1)|0;HEAP16[r101>>1]=r96;r102=HEAP32[r27>>2];r103=r102+2|0;HEAP32[r27>>2]=r103;r104=r92+1|0;r105=r104>>>0<r89>>>0;if(r105){r92=r104;r93=r103}else{break}}}r106=r89&65535;HEAP16[r72>>1]=r106;break L17;break};case 135:{r107=r81&255;HEAP16[r60>>1]=r107;break L17;break};case 136:{r108=HEAP32[r26>>2];r109=HEAP32[r25>>2];r110=(r109|0)==0;if(r110){r111=0;r112=r108}else{r113=HEAP32[r31>>2];r114=HEAP32[r32>>2];r115=r114&r108;r116=FUNCTION_TABLE[r109](r113,r115);r117=r116&65535;r118=HEAP32[r25>>2];r119=HEAP32[r31>>2];r120=r108+2|0;r121=HEAP32[r32>>2];r122=r121&r120;r123=FUNCTION_TABLE[r118](r119,r122);r124=r123&65535;r125=r124<<16;r126=r125|r117;r127=HEAP32[r26>>2];r111=r126;r112=r127}HEAP32[r27>>2]=r111;r128=r112+4|0;HEAP32[r26>>2]=r128;break L17;break};case 138:{r129=r85&255;r130=HEAP32[r25>>2];r131=(r130|0)==0;if(r131){r132=0;r133=r83}else{r134=HEAP32[r31>>2];r135=HEAP32[r32>>2];r136=r135&r83;r137=FUNCTION_TABLE[r130](r134,r136);r138=HEAP32[r27>>2];r132=r137;r133=r138}r139=r133+2|0;HEAP32[r27>>2]=r139;r140=r129;while(1){r141=(r140|0)==0;if(r141){break L17}r142=HEAP16[r71>>1];r143=r142+1&65535;HEAP16[r71>>1]=r143;r144=r142&65535;r145=r65+4+(r144<<1)|0;HEAP16[r145>>1]=r132;r146=HEAP16[r71>>1];r147=HEAP16[r60>>1];r148=(r146&65535)<(r147&65535);r149=r140-1|0;if(r148){r140=r149}else{r3=34;break L15}}break};case 142:{r150=HEAP32[r25>>2];r151=(r150|0)==0;if(r151){r152=0;r153=r83}else{r154=HEAP32[r31>>2];r155=HEAP32[r32>>2];r156=r155&r83;r157=FUNCTION_TABLE[r150](r154,r156);r158=HEAP32[r27>>2];r152=r157;r153=r158}HEAP16[r30>>1]=r152;r159=r153+2|0;HEAP32[r27>>2]=r159;break L17;break};default:{break L17}}}}while(0);do{if(r3==38){r3=0;r160=HEAP16[r30>>1];r161=r160|r77;r162=HEAP16[r71>>1];r163=r162+1&65535;HEAP16[r71>>1]=r163;r164=r162&65535;r165=r65+4+(r164<<1)|0;HEAP16[r165>>1]=r161;r166=HEAP16[r71>>1];r167=HEAP16[r60>>1];r168=(r166&65535)>=(r167&65535);r169=(r166&65535)>200;r170=r168|r169;if(!r170){break}HEAP8[r66]=1;r171=HEAP8[r61];r172=r171<<24>>24==0;if(!r172){break L9}r173=HEAP32[r26>>2];r174=HEAP32[r25>>2];r175=(r174|0)==0;if(r175){r176=0;r177=r173}else{r178=HEAP32[r31>>2];r179=HEAP32[r32>>2];r180=r179&r173;r181=FUNCTION_TABLE[r174](r178,r180);r182=r181&65535;r183=HEAP32[r25>>2];r184=HEAP32[r31>>2];r185=r173+2|0;r186=HEAP32[r32>>2];r187=r186&r185;r188=FUNCTION_TABLE[r183](r184,r187);r189=r188&65535;r190=r189<<16;r191=r190|r182;r192=HEAP32[r26>>2];r176=r191;r177=r192}HEAP32[r27>>2]=r176;r193=r177+4|0;HEAP32[r26>>2]=r193}}while(0);r194=HEAP8[r66];r195=r194<<24>>24==0;if(!r195){break L9}}if(r3==14){r3=0;HEAP8[r66]=1;break}else if(r3==16){r3=0;r196=HEAP32[r26>>2];r197=HEAP32[r25>>2];r198=(r197|0)==0;if(r198){r199=0;r200=r196}else{r201=HEAP32[r31>>2];r202=HEAP32[r32>>2];r203=r202&r196;r204=FUNCTION_TABLE[r197](r201,r203);r205=r204&65535;r206=HEAP32[r25>>2];r207=HEAP32[r31>>2];r208=r196+2|0;r209=HEAP32[r32>>2];r210=r209&r208;r211=FUNCTION_TABLE[r206](r207,r210);r212=r211&65535;r213=r212<<16;r214=r213|r205;r215=HEAP32[r26>>2];r199=r214;r200=r215}HEAP32[r27>>2]=r199;r216=r200+4|0;HEAP32[r26>>2]=r216;HEAP8[r66]=1;break}else if(r3==34){r3=0;HEAP8[r66]=1;break}}}while(0);r217=HEAP16[r21>>1];r218=r217&65535;r219=HEAP16[r22>>1];r220=(r217&65535)<(r219&65535);do{if(r220){r221=r217<<16>>16==0;if(!r221){break}r222=HEAP32[r23>>2];r223=r222+6|0;r224=HEAP8[r24];r225=r224<<24>>24!=0;r226=r225?4:0;r227=r223+r226|0;r228=HEAP32[r25>>2];r229=(r228|0)==0;do{if(r229){HEAP32[r26>>2]=0;r230=0;r231=0}else{r232=HEAP32[r31>>2];r233=HEAP32[r32>>2];r234=r233&r227;r235=FUNCTION_TABLE[r228](r232,r234);r236=r235&65535;r237=HEAP32[r25>>2];r238=HEAP32[r31>>2];r239=r227+2|0;r240=HEAP32[r32>>2];r241=r240&r239;r242=FUNCTION_TABLE[r237](r238,r241);r243=r242&65535;r244=r243<<16;r245=r244|r236;r246=HEAP32[r25>>2];HEAP32[r26>>2]=r245;r247=(r246|0)==0;if(r247){r230=0;r231=r245;break}r248=HEAP32[r31>>2];r249=HEAP32[r32>>2];r250=r249&r245;r251=FUNCTION_TABLE[r246](r248,r250);r252=r251&65535;r253=HEAP32[r25>>2];r254=HEAP32[r31>>2];r255=r245+2|0;r256=HEAP32[r32>>2];r257=r256&r255;r258=FUNCTION_TABLE[r253](r254,r257);r259=r258&65535;r260=r259<<16;r261=r260|r252;r262=HEAP32[r26>>2];r230=r261;r231=r262}}while(0);HEAP32[r27>>2]=r230;r263=r231+4|0;HEAP32[r26>>2]=r263;r264=HEAP32[r28>>2];r265=r264|0;HEAP8[r265]=0;r266=HEAP32[r28>>2];r267=r266+2|0;HEAP16[r267>>1]=0;r268=HEAP32[r28>>2];r269=r268+516|0;HEAP16[r269>>1]=0;r270=HEAP32[r29>>2];r271=r270|0;HEAP8[r271]=0;r272=HEAP32[r29>>2];r273=r272+2|0;HEAP16[r273>>1]=0;r274=HEAP32[r29>>2];r275=r274+516|0;HEAP16[r275>>1]=0;HEAP16[r30>>1]=0;r276=HEAP16[r20>>1];r277=r276&384;HEAP16[r20>>1]=r277}else{r278=HEAP16[r51>>1];r279=r278&65535;r280=(r217&65535)<(r278&65535);if(r280){r281=r217<<16>>16==r219<<16>>16;if(r281){HEAP16[r52>>1]=0;HEAP16[r53>>1]=0;HEAP32[r35>>2]=0;r282=HEAP32[r28>>2];r283=HEAP32[r29>>2];HEAP32[r28>>2]=r283;HEAP32[r29>>2]=r282;r284=r283+516|0;r285=HEAP16[r284>>1];r286=r285<<16>>16==0;do{if(!r286){r287=r283+518|0;r288=HEAP16[r287>>1];r289=r288&255;r290=r289&31;HEAP8[r54]=r290;r291=HEAP16[r287>>1];r292=(r291&65535)>>>10;r293=r292&255;r294=r293&1;HEAP8[r55]=r294;r295=HEAP16[r284>>1];r296=(r295&65535)>4;if(!r296){break}r297=r283+526|0;r298=HEAP16[r297>>1];r299=(r298&65535)>>>8;r300=r299&255;r301=r300&31;HEAP8[r56]=r301;r302=HEAP16[r297>>1];r303=r302&255;r304=r303&31;HEAP8[r57]=r304;r305=HEAP16[r284>>1];r306=(r305&65535)>5;if(!r306){break}r307=r283+528|0;r308=HEAP16[r307>>1];r309=(r308&65535)>>>8;r310=r309&255;r311=r310&31;HEAP8[r58]=r311;r312=HEAP16[r307>>1];r313=r312&255;r314=r313&31;HEAP8[r59]=r314}}while(0);HEAP16[r284>>1]=0;r315=HEAP32[r29>>2];r316=r315|0;HEAP8[r316]=0;r317=HEAP32[r29>>2];r318=r317+2|0;HEAP16[r318>>1]=0;r319=HEAP32[r29>>2];r320=r319+516|0;HEAP16[r320>>1]=0}_e82730_line(r1);r321=HEAP16[r53>>1];r322=r321+1&65535;HEAP16[r53>>1]=r322;r323=r322&65535;r324=HEAP8[r54];r325=r324&255;r326=r323>>>0>r325>>>0;if(!r326){break}r327=HEAP16[r52>>1];r328=r327+1&65535;HEAP16[r52>>1]=r328;HEAP16[r53>>1]=0;r329=HEAP32[r28>>2];r330=HEAP32[r29>>2];HEAP32[r28>>2]=r330;HEAP32[r29>>2]=r329;r331=r330+516|0;r332=HEAP16[r331>>1];r333=r332<<16>>16==0;do{if(!r333){r334=r330+518|0;r335=HEAP16[r334>>1];r336=r335&255;r337=r336&31;HEAP8[r54]=r337;r338=HEAP16[r334>>1];r339=(r338&65535)>>>10;r340=r339&255;r341=r340&1;HEAP8[r55]=r341;r342=HEAP16[r331>>1];r343=(r342&65535)>4;if(!r343){break}r344=r330+526|0;r345=HEAP16[r344>>1];r346=(r345&65535)>>>8;r347=r346&255;r348=r347&31;HEAP8[r56]=r348;r349=HEAP16[r344>>1];r350=r349&255;r351=r350&31;HEAP8[r57]=r351;r352=HEAP16[r331>>1];r353=(r352&65535)>5;if(!r353){break}r354=r330+528|0;r355=HEAP16[r354>>1];r356=(r355&65535)>>>8;r357=r356&255;r358=r357&31;HEAP8[r58]=r358;r359=HEAP16[r354>>1];r360=r359&255;r361=r360&31;HEAP8[r59]=r361}}while(0);HEAP16[r331>>1]=0;r362=HEAP32[r29>>2];r363=r362|0;HEAP8[r363]=0;r364=HEAP32[r29>>2];r365=r364+2|0;HEAP16[r365>>1]=0;r366=HEAP32[r29>>2];r367=r366+516|0;HEAP16[r367>>1]=0;r368=HEAP16[r21>>1];r369=r368&65535;r370=HEAP16[r51>>1];r371=r370&65535;r372=r371-1|0;r373=(r369|0)==(r372|0);if(!r373){break}r374=HEAP32[r29>>2];r375=r374|0;HEAP8[r375]=1;break}r376=r217<<16>>16==r278<<16>>16;if(r376){HEAP16[r53>>1]=0;HEAP8[r40]=0;r377=HEAP32[r23>>2];r378=HEAP32[r25>>2];r379=(r378|0)==0;if(r379){r380=0}else{r381=r377+34|0;r382=HEAP32[r31>>2];r383=HEAP32[r32>>2];r384=r383&r381;r385=FUNCTION_TABLE[r378](r382,r384);r386=r385&65535;r387=HEAP32[r25>>2];r388=HEAP32[r31>>2];r389=r377+36|0;r390=HEAP32[r32>>2];r391=r390&r389;r392=FUNCTION_TABLE[r387](r388,r391);r393=r392&65535;r394=r393<<16;r395=r394|r386;r380=r395}HEAP32[r27>>2]=r380;r396=HEAP32[r28>>2];r397=HEAP32[r29>>2];HEAP32[r28>>2]=r397;HEAP32[r29>>2]=r396;r398=r397+516|0;r399=HEAP16[r398>>1];r400=r399<<16>>16==0;do{if(!r400){r401=r397+518|0;r402=HEAP16[r401>>1];r403=r402&255;r404=r403&31;HEAP8[r54]=r404;r405=HEAP16[r401>>1];r406=(r405&65535)>>>10;r407=r406&255;r408=r407&1;HEAP8[r55]=r408;r409=HEAP16[r398>>1];r410=(r409&65535)>4;if(!r410){break}r411=r397+526|0;r412=HEAP16[r411>>1];r413=(r412&65535)>>>8;r414=r413&255;r415=r414&31;HEAP8[r56]=r415;r416=HEAP16[r411>>1];r417=r416&255;r418=r417&31;HEAP8[r57]=r418;r419=HEAP16[r398>>1];r420=(r419&65535)>5;if(!r420){break}r421=r397+528|0;r422=HEAP16[r421>>1];r423=(r422&65535)>>>8;r424=r423&255;r425=r424&31;HEAP8[r58]=r425;r426=HEAP16[r421>>1];r427=r426&255;r428=r427&31;HEAP8[r59]=r428}}while(0);HEAP16[r398>>1]=0;r429=HEAP32[r29>>2];r430=r429|0;HEAP8[r430]=0;r431=HEAP32[r29>>2];r432=r431+2|0;HEAP16[r432>>1]=0;r433=HEAP32[r29>>2];r434=r433+516|0;HEAP16[r434>>1]=0;break}r435=HEAP8[r54];r436=r435&255;r437=r279+1|0;r438=r437+r436|0;r439=(r218|0)>(r438|0);if(r439){break}r440=HEAP16[r53>>1];r441=r440<<16>>16==0;if(r441){r442=HEAP32[r28>>2];r443=HEAP32[r29>>2];HEAP32[r28>>2]=r443;HEAP32[r29>>2]=r442;r444=r443+516|0;r445=HEAP16[r444>>1];r446=r445<<16>>16==0;do{if(!r446){r447=r443+518|0;r448=HEAP16[r447>>1];r449=r448&255;r450=r449&31;HEAP8[r54]=r450;r451=HEAP16[r447>>1];r452=(r451&65535)>>>10;r453=r452&255;r454=r453&1;HEAP8[r55]=r454;r455=HEAP16[r444>>1];r456=(r455&65535)>4;if(!r456){break}r457=r443+526|0;r458=HEAP16[r457>>1];r459=(r458&65535)>>>8;r460=r459&255;r461=r460&31;HEAP8[r56]=r461;r462=HEAP16[r457>>1];r463=r462&255;r464=r463&31;HEAP8[r57]=r464;r465=HEAP16[r444>>1];r466=(r465&65535)>5;if(!r466){break}r467=r443+528|0;r468=HEAP16[r467>>1];r469=(r468&65535)>>>8;r470=r469&255;r471=r470&31;HEAP8[r58]=r471;r472=HEAP16[r467>>1];r473=r472&255;r474=r473&31;HEAP8[r59]=r474}}while(0);HEAP16[r444>>1]=0;r475=HEAP32[r29>>2];r476=r475|0;HEAP8[r476]=0;r477=HEAP32[r29>>2];r478=r477+2|0;HEAP16[r478>>1]=0;r479=HEAP32[r29>>2];r480=r479+516|0;HEAP16[r480>>1]=0;r481=HEAP32[r29>>2];r482=r481|0;HEAP8[r482]=1}_e82730_line(r1);r483=HEAP16[r53>>1];r484=r483+1&65535;HEAP16[r53>>1]=r484;r485=r484&65535;r486=HEAP8[r54];r487=r486&255;r488=r485>>>0>r487>>>0;if(!r488){break}r489=HEAP16[r52>>1];r490=r489+1&65535;HEAP16[r52>>1]=r490;HEAP16[r53>>1]=0}}while(0);_e82730_check_ca(r1);r491=HEAP16[r21>>1];r492=r491+1&65535;HEAP16[r21>>1]=r492;r493=HEAP16[r33>>1];r494=(r492&65535)<(r493&65535);do{if(!r494){r495=HEAP32[r35>>2];r496=HEAP32[r36>>2];r497=r495>>>0<r496>>>0;L116:do{if(r497){r498=r495;r499=r496;while(1){r500=HEAP32[r34>>2];r501=r498>>>0<r500>>>0;if(!r501){r502=r498;break L116}r503=HEAP32[r38>>2];r504=(r503|0)==0;if(r504){r505=r498;r506=r499}else{r507=r498*3&-1;r508=Math_imul(r507,r503)|0;r509=HEAP32[r37>>2];r510=r509+r508|0;r511=r510;r512=0;while(1){r513=r511+1|0;HEAP8[r511]=0;r514=r511+2|0;HEAP8[r513]=0;r515=r511+3|0;HEAP8[r514]=0;r516=r512+1|0;r517=HEAP32[r38>>2];r518=r516>>>0<r517>>>0;if(r518){r511=r515;r512=r516}else{break}}r519=HEAP32[r35>>2];r520=HEAP32[r36>>2];r505=r519;r506=r520}r521=r505+1|0;HEAP32[r35>>2]=r521;r522=r521>>>0<r506>>>0;if(r522){r498=r521;r499=r506}else{r502=r521;break}}}else{r502=r495}}while(0);r523=HEAP32[r39>>2];r524=(r523|0)==0;if(!r524){r525=HEAP32[r38>>2];_trm_set_size(r523,r525,r502);r526=HEAP32[r39>>2];r527=HEAP32[r37>>2];r528=HEAP32[r35>>2];_trm_set_lines(r526,r527,0,r528);r529=HEAP32[r39>>2];_trm_update(r529)}HEAP16[r21>>1]=0;HEAP8[r40]=0;r530=HEAP16[r41>>1];r531=r530+1&65535;HEAP16[r41>>1]=r531;r532=HEAP16[r42>>1];r533=(r531&65535)<(r532&65535);if(!r533){HEAP16[r41>>1]=0}_e82730_check_ca(r1);r534=HEAP8[r43];r535=r534<<24>>24==0;do{if(r535){r3=97}else{r536=r534-1&255;HEAP8[r43]=r536;r537=r536<<24>>24==0;if(r537){r3=97;break}r538=HEAP16[r20>>1];r539=r538}}while(0);if(r3==97){r3=0;r540=HEAP16[r20>>1];r541=r540|8;HEAP16[r20>>1]=r541;r542=HEAP8[r44];HEAP8[r43]=r542;r539=r541}r543=HEAP16[r45>>1];r544=r543^-385;r545=r539&-385;r546=r545&r544;r547=HEAP32[r46>>2];r548=(r547|0)==0;if(!r548){r549=HEAP32[r23>>2];r550=r549+20|0;r551=HEAP32[r50>>2];r552=HEAP32[r32>>2];r553=r552&r550;FUNCTION_TABLE[r547](r551,r553,r546)}r554=r546<<16>>16==0;if(r554){break}r555=HEAP8[r47];r556=r555<<24>>24==1;if(r556){break}HEAP8[r47]=1;r557=HEAP32[r48>>2];r558=(r557|0)==0;if(r558){break}r559=HEAP32[r49>>2];FUNCTION_TABLE[r557](r559,1)}}while(0);r560=HEAP32[r10>>2];r561=r560-r18|0;HEAP32[r10>>2]=r561;r562=r561>>>0<r18>>>0;if(r562){break}}return}function _e82730_line(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58;r2=0;r3=r1+128|0;r4=HEAP32[r3>>2];if(r4>>>0>=HEAP32[r1+120>>2]>>>0){return}r5=HEAP32[r1+136>>2];r6=r1+116|0;r7=HEAP32[r6>>2];r8=HEAP32[r1+108>>2]+Math_imul(r4*3&-1,r7)|0;L4:do{if((HEAP8[r5|0]|0)==0){if((r7|0)==0){break}else{r9=r8;r10=0;r11=r4}while(1){r12=r9+1|0;if((r11&8)>>>0<8^(r10&8)>>>0<8){HEAP8[r9]=0;HEAP8[r12]=0;HEAP8[r9+2|0]=0}else{HEAP8[r9]=-128;HEAP8[r12]=-128;HEAP8[r9+2|0]=-128}r12=r10+1|0;if(r12>>>0>=HEAP32[r6>>2]>>>0){break L4}r9=r9+3|0;r10=r12;r11=HEAP32[r3>>2]}}else{if((HEAP8[r1+45|0]|0)!=0){if((r7|0)==0){break}else{r13=r8;r14=0}while(1){HEAP8[r13]=0;HEAP8[r13+1|0]=0;HEAP8[r13+2|0]=0;r12=r14+1|0;if(r12>>>0<HEAP32[r6>>2]>>>0){r13=r13+3|0;r14=r12}else{break L4}}}r12=r1+104|0;r15=HEAP32[r12>>2];if((r7|0)==0){break}r16=r5+2|0;r17=r1+1260|0;r18=r1+72|0;r19=r1+12|0;r20=r1+1252|0;r21=r1+88|0;r22=r1+20|0;r23=r1+56|0;r24=r1+70|0;r25=r1+54|0;r26=r1+58|0;r27=r1+60|0;r28=r1+52|0;r29=r1+64|0;r30=r1+66|0;r31=r1+62|0;r32=r1+57|0;r33=r1+55|0;r34=r1+59|0;r35=r1+61|0;r36=r1+53|0;r37=0;r38=0;r39=0;r40=0;r41=r15+60|0;r42=r15;r15=r8;while(1){if((r40|0)==0){if(r37>>>0<HEAPU16[r16>>1]>>>0){r43=HEAPU16[r5+4+(r37<<1)>>1];r44=HEAPU8[(r43>>>10&31)+(r1+1208)|0];r45=HEAP32[r12>>2];r46=HEAP32[r17>>2];if((r46|0)==0){r47=0}else{r47=FUNCTION_TABLE[r46](HEAP32[r20>>2],((HEAPU16[r18>>1]|r43<<4&16368)<<1)+HEAP32[r19>>2]&HEAP32[r21>>2])&65535}r48=r45+(r44<<2&60)|0;r49=r45+(r44>>>2&60)|0;r50=(r47<<1|65024)^-65026;r51=r47}else{r48=r42;r49=r41;r50=1;r51=0}r44=r37+1|0;r45=(HEAP8[r22]|0)==0?r50:1;r43=HEAPU16[r24>>1];do{if((HEAPU8[r23]|0)==(r43|0)){if((HEAPU8[r25]|0)!=(r37|0)){r2=25;break}r46=HEAPU16[r18>>1];if(r46>>>0<HEAPU8[r26]>>>0){r2=25;break}if(r46>>>0>HEAPU8[r27]>>>0){r2=25;break}if((HEAP8[r28]|0)==0){r52=1;break}r46=HEAP16[r29>>1];r53=(Math_imul(r46<<16>>16==0?4:r46&65535,HEAPU16[r30>>1])|0)>>>2;if(HEAPU16[r31>>1]>>>0>r53>>>0){r2=25}else{r52=1}}else{r2=25}}while(0);do{if(r2==25){r2=0;if((HEAPU8[r32]|0)!=(r43|0)){r52=0;break}if((HEAPU8[r33]|0)!=(r37|0)){r52=0;break}r53=HEAPU16[r18>>1];if(r53>>>0<HEAPU8[r34]>>>0){r52=0;break}if(r53>>>0>HEAPU8[r35]>>>0){r52=0;break}if((HEAP8[r36]|0)==0){r52=1;break}r53=HEAP16[r29>>1];r46=(Math_imul(r53<<16>>16==0?4:r53&65535,HEAPU16[r30>>1])|0)>>>2;r52=HEAPU16[r31>>1]>>>0<=r46>>>0}}while(0);r54=r52?r49:r48;r55=r52?r48:r49;r56=r45;r57=r51;r58=r44}else{r54=r42;r55=r41;r56=r40;r57=r38;r58=r37}if((r57&32768|0)==0){HEAP8[r15]=HEAP8[r54];HEAP8[r15+1|0]=HEAP8[r54+1|0];HEAP8[r15+2|0]=HEAP8[r54+2|0]}else{HEAP8[r15]=HEAP8[r55];HEAP8[r15+1|0]=HEAP8[r55+1|0];HEAP8[r15+2|0]=HEAP8[r55+2|0]}r43=r39+1|0;if(r43>>>0<HEAP32[r6>>2]>>>0){r37=r58;r38=r57<<1&65534;r39=r43;r40=r56<<1&65534;r41=r55;r42=r54;r15=r15+3|0}else{break}}}}while(0);HEAP32[r3>>2]=HEAP32[r3>>2]+1;return}function _e86_disasm_mem(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r5=STACKTOP;STACKTOP=STACKTOP+16|0;r6=r5;r7=r4&65535;r8=(r3&65535)<<4;r3=r1+80|0;r9=r1+76|0;r10=r1+72|0;r11=r1+36|0;r12=r1+32|0;r1=0;while(1){r13=HEAP32[r3>>2]&(r1+r7&65535)+r8;if(r13>>>0<HEAP32[r9>>2]>>>0){r14=HEAP8[HEAP32[r10>>2]+r13|0]}else{r14=FUNCTION_TABLE[HEAP32[r11>>2]](HEAP32[r12>>2],r13)}HEAP8[r6+r1|0]=r14;r13=r1+1|0;if(r13>>>0<16){r1=r13}else{break}}r1=r6|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP16[r2+8>>1]=r4;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r1]&255)<<2)>>2]](r2,r1);r1=r2+12|0;if((HEAP32[r1>>2]|0)==0){STACKTOP=r5;return}else{r15=0}while(1){HEAP8[r15+(r2+16)|0]=HEAP8[r6+r15|0];r4=r15+1|0;if(r4>>>0<HEAP32[r1>>2]>>>0){r15=r4}else{break}}STACKTOP=r5;return}function _e86_disasm_cur(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=HEAP16[r1+28>>1];r6=r4|0;r7=r5&65535;r8=HEAPU16[r1+22>>1]<<4;r9=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+36|0;r13=r1+32|0;r1=0;while(1){r14=(r1+r7&65535)+r8&HEAP32[r9>>2];if(r14>>>0<HEAP32[r10>>2]>>>0){r15=HEAP8[HEAP32[r11>>2]+r14|0]}else{r15=FUNCTION_TABLE[HEAP32[r12>>2]](HEAP32[r13>>2],r14)}HEAP8[r4+r1|0]=r15;r14=r1+1|0;if(r14>>>0<16){r1=r14}else{break}}HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP16[r2+8>>1]=r5;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r6]&255)<<2)>>2]](r2,r6);r6=r2+12|0;if((HEAP32[r6>>2]|0)==0){STACKTOP=r3;return}else{r16=0}while(1){HEAP8[r16+(r2+16)|0]=HEAP8[r4+r16|0];r5=r16+1|0;if(r5>>>0<HEAP32[r6>>2]>>>0){r16=r5}else{break}}STACKTOP=r3;return}function _dop_00(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_01(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_02(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_03(r1,r2){var r3;r3=r1+32|0;tempBigInt=4473921;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_04(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4473921;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_05(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4473921;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_06(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12736];HEAP8[r2+1|0]=HEAP8[12737];HEAP8[r2+2|0]=HEAP8[12738];HEAP8[r2+3|0]=HEAP8[12739];HEAP8[r2+4|0]=HEAP8[12740];r2=r1+100|0;HEAP8[r2]=HEAP8[25264];HEAP8[r2+1|0]=HEAP8[25265];HEAP8[r2+2|0]=HEAP8[25266];return}function _dop_07(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[25264];HEAP8[r2+1|0]=HEAP8[25265];HEAP8[r2+2|0]=HEAP8[25266];return}function _dop_08(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24296];HEAP8[r3+1|0]=HEAP8[24297];HEAP8[r3+2|0]=HEAP8[24298];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_09(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24296];HEAP8[r3+1|0]=HEAP8[24297];HEAP8[r3+2|0]=HEAP8[24298];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_0a(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24296];HEAP8[r3+1|0]=HEAP8[24297];HEAP8[r3+2|0]=HEAP8[24298];r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_0b(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[24296];HEAP8[r3+1|0]=HEAP8[24297];HEAP8[r3+2|0]=HEAP8[24298];r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_0c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[24296];HEAP8[r5+1|0]=HEAP8[24297];HEAP8[r5+2|0]=HEAP8[24298];r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_0d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[24296];HEAP8[r5+1|0]=HEAP8[24297];HEAP8[r5+2|0]=HEAP8[24298];r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_0e(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12736];HEAP8[r2+1|0]=HEAP8[12737];HEAP8[r2+2|0]=HEAP8[12738];HEAP8[r2+3|0]=HEAP8[12739];HEAP8[r2+4|0]=HEAP8[12740];r2=r1+100|0;HEAP8[r2]=HEAP8[24880];HEAP8[r2+1|0]=HEAP8[24881];HEAP8[r2+2|0]=HEAP8[24882];return}function _dop_0f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[24880];HEAP8[r2+1|0]=HEAP8[24881];HEAP8[r2+2|0]=HEAP8[24882];return}function _dop_10(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_11(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_12(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_13(r1,r2){var r3;r3=r1+32|0;tempBigInt=4408385;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_14(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4408385;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_15(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4408385;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_16(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12736];HEAP8[r2+1|0]=HEAP8[12737];HEAP8[r2+2|0]=HEAP8[12738];HEAP8[r2+3|0]=HEAP8[12739];HEAP8[r2+4|0]=HEAP8[12740];r2=r1+100|0;HEAP8[r2]=HEAP8[24720];HEAP8[r2+1|0]=HEAP8[24721];HEAP8[r2+2|0]=HEAP8[24722];return}function _dop_17(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[24720];HEAP8[r2+1|0]=HEAP8[24721];HEAP8[r2+2|0]=HEAP8[24722];return}function _dop_18(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_19(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_1a(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_1b(r1,r2){var r3;r3=r1+32|0;tempBigInt=4342355;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_1c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4342355;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_1d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4342355;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_1e(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;HEAP8[r2]=HEAP8[12736];HEAP8[r2+1|0]=HEAP8[12737];HEAP8[r2+2|0]=HEAP8[12738];HEAP8[r2+3|0]=HEAP8[12739];HEAP8[r2+4|0]=HEAP8[12740];r2=r1+100|0;HEAP8[r2]=HEAP8[24656];HEAP8[r2+1|0]=HEAP8[24657];HEAP8[r2+2|0]=HEAP8[24658];return}function _dop_1f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r2=r1+32|0;tempBigInt=5263184;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[24656];HEAP8[r2+1|0]=HEAP8[24657];HEAP8[r2+2|0]=HEAP8[24658];return}function _dop_20(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_21(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_22(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_23(r1,r2){var r3;r3=r1+32|0;tempBigInt=4476481;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_24(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4476481;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_25(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4476481;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_26(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=1;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822405;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_27(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4276548;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_28(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_29(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_2a(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_2b(r1,r2){var r3;r3=r1+32|0;tempBigInt=4347219;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_2c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4347219;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_2d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=4347219;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_2e(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=2;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822403;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_2f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5456196;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_30(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_31(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_32(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_33(r1,r2){var r3;r3=r1+32|0;tempBigInt=5394264;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_34(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5394264;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_35(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5394264;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_36(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=3;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822419;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_37(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4276545;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_38(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_39(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_3a(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_3b(r1,r2){var r3;r3=r1+32|0;tempBigInt=5262659;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_3c(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5262659;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_3d(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5262659;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_3e(r1,r2){var r3,r4,r5;r3=r1+4|0;r4=HEAP32[r3>>2];HEAP32[r3>>2]=4;r5=r2+1|0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r5>>2]=HEAP32[r5>>2]+1;HEAP32[r3>>2]=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=0;r5=r1+32|0;tempBigInt=3822404;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;HEAP32[r3>>2]=r4;return}}function _dop_3f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5456193;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_40(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;tempBigInt=4410953;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9376+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_48(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;tempBigInt=4408644;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9376+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_50(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;HEAP8[r3]=HEAP8[12736];HEAP8[r3+1|0]=HEAP8[12737];HEAP8[r3+2|0]=HEAP8[12738];HEAP8[r3+3|0]=HEAP8[12739];HEAP8[r3+4|0]=HEAP8[12740];_strcpy(r1+100|0,HEAP32[9376+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_58(r1,r2){var r3;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r3=r1+32|0;tempBigInt=5263184;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9376+((HEAP8[r2]&7)<<2)>>2]);return}function _dop_60(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22080];HEAP8[r2+1|0]=HEAP8[22081];HEAP8[r2+2|0]=HEAP8[22082];HEAP8[r2+3|0]=HEAP8[22083];HEAP8[r2+4|0]=HEAP8[22084];HEAP8[r2+5|0]=HEAP8[22085];return}function _dop_61(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22112];HEAP8[r2+1|0]=HEAP8[22113];HEAP8[r2+2|0]=HEAP8[22114];HEAP8[r2+3|0]=HEAP8[22115];HEAP8[r2+4|0]=HEAP8[22116];return}function _dop_62(r1,r2){var r3;r3=r1|0;HEAP32[r3>>2]=HEAP32[r3>>2]|1;r3=r1+32|0;HEAP8[r3]=HEAP8[22144];HEAP8[r3+1|0]=HEAP8[22145];HEAP8[r3+2|0]=HEAP8[22146];HEAP8[r3+3|0]=HEAP8[22147];HEAP8[r3+4|0]=HEAP8[22148];HEAP8[r3+5|0]=HEAP8[22149];r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_ud(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[22176];HEAP8[r5+1|0]=HEAP8[22177];HEAP8[r5+2|0]=HEAP8[22178];_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_66(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+12|0;if((HEAP8[r2+1|0]|0)==102){HEAP32[r5>>2]=4;HEAP32[r1+96>>2]=2;r6=r1+32|0;HEAP8[r6]=HEAP8[22208];HEAP8[r6+1|0]=HEAP8[22209];HEAP8[r6+2|0]=HEAP8[22210];HEAP8[r6+3|0]=HEAP8[22211];HEAP8[r6+4|0]=HEAP8[22212];_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0],r3));STACKTOP=r3;_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+3|0],r3));STACKTOP=r3;STACKTOP=r4;return}else{HEAP32[r5>>2]=1;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[22176];HEAP8[r5+1|0]=HEAP8[22177];HEAP8[r5+2|0]=HEAP8[22178];_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2],r3));STACKTOP=r3;STACKTOP=r4;return}}function _dop_68(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[12736];HEAP8[r5+1|0]=HEAP8[12737];HEAP8[r5+2|0]=HEAP8[12738];HEAP8[r5+3|0]=HEAP8[12739];HEAP8[r5+4|0]=HEAP8[12740];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_6a(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[12736];HEAP8[r5+1|0]=HEAP8[12737];HEAP8[r5+2|0]=HEAP8[12738];HEAP8[r5+3|0]=HEAP8[12739];HEAP8[r5+4|0]=HEAP8[12740];r5=r1+100|0;r1=HEAP8[r2+1|0];r2=r1&255;if(r1<<24>>24>-1){_sprintf(r5,24520,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;STACKTOP=r4;return}else{_sprintf(r5,24432,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=-r2&255,r3));STACKTOP=r3;STACKTOP=r4;return}}function _dop_6c(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22240];HEAP8[r2+1|0]=HEAP8[22241];HEAP8[r2+2|0]=HEAP8[22242];HEAP8[r2+3|0]=HEAP8[22243];HEAP8[r2+4|0]=HEAP8[22244];return}function _dop_6d(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22272];HEAP8[r2+1|0]=HEAP8[22273];HEAP8[r2+2|0]=HEAP8[22274];HEAP8[r2+3|0]=HEAP8[22275];HEAP8[r2+4|0]=HEAP8[22276];return}function _dop_6e(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22312];HEAP8[r2+1|0]=HEAP8[22313];HEAP8[r2+2|0]=HEAP8[22314];HEAP8[r2+3|0]=HEAP8[22315];HEAP8[r2+4|0]=HEAP8[22316];HEAP8[r2+5|0]=HEAP8[22317];return}function _dop_6f(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[22376];HEAP8[r2+1|0]=HEAP8[22377];HEAP8[r2+2|0]=HEAP8[22378];HEAP8[r2+3|0]=HEAP8[22379];HEAP8[r2+4|0]=HEAP8[22380];HEAP8[r2+5|0]=HEAP8[22381];return}function _dop_70(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=HEAPU8[r2+1|0];r6=HEAPU16[r1+8>>1]+2+((r5&128|0)!=0?r5|65280:r5)|0;_strcpy(r1+32|0,HEAP32[9736+((HEAP8[r2]&15)<<2)>>2]);_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_80(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9672+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,0);_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_81(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9672+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,1);_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+2)|0]<<8|HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+3;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_83(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9672+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,1);r5=r1+164|0;r7=HEAP8[r2+(r6+1)|0];r2=r7&255;if(r7<<24>>24>-1){_sprintf(r5,24520,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2,r3));STACKTOP=r3;r8=r6+2|0;r9=r1+12|0;HEAP32[r9>>2]=r8;r10=r1+96|0;HEAP32[r10>>2]=2;STACKTOP=r4;return}else{_sprintf(r5,24432,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=-r2&255,r3));STACKTOP=r3;r8=r6+2|0;r9=r1+12|0;HEAP32[r9>>2]=r8;r10=r1+96|0;HEAP32[r10>>2]=2;STACKTOP=r4;return}}function _dop_84(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[14872];HEAP8[r3+1|0]=HEAP8[14873];HEAP8[r3+2|0]=HEAP8[14874];HEAP8[r3+3|0]=HEAP8[14875];HEAP8[r3+4|0]=HEAP8[14876];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_85(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[14872];HEAP8[r3+1|0]=HEAP8[14873];HEAP8[r3+2|0]=HEAP8[14874];HEAP8[r3+3|0]=HEAP8[14875];HEAP8[r3+4|0]=HEAP8[14876];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_86(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25552];HEAP8[r3+1|0]=HEAP8[25553];HEAP8[r3+2|0]=HEAP8[25554];HEAP8[r3+3|0]=HEAP8[25555];HEAP8[r3+4|0]=HEAP8[25556];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_87(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25552];HEAP8[r3+1|0]=HEAP8[25553];HEAP8[r3+2|0]=HEAP8[25554];HEAP8[r3+3|0]=HEAP8[25555];HEAP8[r3+4|0]=HEAP8[25556];r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_88(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,0);_strcpy(r1+164|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_89(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_8a(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9344+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,0)+1;HEAP32[r1+96>>2]=2;return}function _dop_8b(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_8c(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;r2=_disasm_ea(r1,r1+100|0,r3,1);_strcpy(r1+164|0,HEAP32[9304+((HEAPU8[r3]>>>3&3)<<2)>>2]);HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_8d(r1,r2){var r3;r3=r1+32|0;tempBigInt=4277580;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_8e(r1,r2){var r3;r3=r1+32|0;tempBigInt=5656397;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9304+((HEAPU8[r3]>>>3&3)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_8f(r1,r2){var r3;r3=r1+32|0;tempBigInt=5263184;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;HEAP32[r1+12>>2]=_disasm_ea(r1,r1+100|0,r2+1|0,1)+1;HEAP32[r1+96>>2]=1;return}function _dop_90(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5263182;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_91(r1,r2){var r3;r3=r1+32|0;HEAP8[r3]=HEAP8[25552];HEAP8[r3+1|0]=HEAP8[25553];HEAP8[r3+2|0]=HEAP8[25554];HEAP8[r3+3|0]=HEAP8[25555];HEAP8[r3+4|0]=HEAP8[25556];r3=r1+100|0;HEAP8[r3]=HEAP8[16424];HEAP8[r3+1|0]=HEAP8[16425];HEAP8[r3+2|0]=HEAP8[16426];_strcpy(r1+164|0,HEAP32[9376+((HEAP8[r2]&7)<<2)>>2]);HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;return}function _dop_98(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5718595;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_99(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4478787;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_9a(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|256;HEAP32[r1+12>>2]=5;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[18360];HEAP8[r5+1|0]=HEAP8[18361];HEAP8[r5+2|0]=HEAP8[18362];HEAP8[r5+3|0]=HEAP8[18363];HEAP8[r5+4|0]=HEAP8[18364];r5=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,12800,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAPU8[r2+4|0]<<8|HEAPU8[r2+3|0],HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_9b(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25672];HEAP8[r2+1|0]=HEAP8[25673];HEAP8[r2+2|0]=HEAP8[25674];HEAP8[r2+3|0]=HEAP8[25675];HEAP8[r2+4|0]=HEAP8[25676];return}function _dop_9c(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25704];HEAP8[r2+1|0]=HEAP8[25705];HEAP8[r2+2|0]=HEAP8[25706];HEAP8[r2+3|0]=HEAP8[25707];HEAP8[r2+4|0]=HEAP8[25708];HEAP8[r2+5|0]=HEAP8[25709];return}function _dop_9d(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25744];HEAP8[r2+1|0]=HEAP8[25745];HEAP8[r2+2|0]=HEAP8[25746];HEAP8[r2+3|0]=HEAP8[25747];HEAP8[r2+4|0]=HEAP8[25748];return}function _dop_9e(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[25808];HEAP8[r2+1|0]=HEAP8[25809];HEAP8[r2+2|0]=HEAP8[25810];HEAP8[r2+3|0]=HEAP8[25811];HEAP8[r2+4|0]=HEAP8[25812];return}function _dop_9f(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[26e3];HEAP8[r2+1|0]=HEAP8[26001];HEAP8[r2+2|0]=HEAP8[26002];HEAP8[r2+3|0]=HEAP8[26003];HEAP8[r2+4|0]=HEAP8[26004];return}function _dop_a0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+164|0,10104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9320+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;STACKTOP=r4;return}function _dop_a1(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+164|0,10104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9320+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;STACKTOP=r4;return}function _dop_a2(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,10104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9320+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;r5=r1+164|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];STACKTOP=r4;return}function _dop_a3(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=r1+4|0;r6=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,10104,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAP32[9320+(HEAP32[r5>>2]<<2)>>2],HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP32[r5>>2]=0;r5=r1+164|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];STACKTOP=r4;return}function _dop_a4(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[26128];HEAP8[r5+1|0]=HEAP8[26129];HEAP8[r5+2|0]=HEAP8[26130];HEAP8[r5+3|0]=HEAP8[26131];HEAP8[r5+4|0]=HEAP8[26132];HEAP8[r5+5|0]=HEAP8[26133];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25728,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9320+(r6<<2)>>2],HEAP32[r2+8>>2]=18384,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a5(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[9808];HEAP8[r5+1|0]=HEAP8[9809];HEAP8[r5+2|0]=HEAP8[9810];HEAP8[r5+3|0]=HEAP8[9811];HEAP8[r5+4|0]=HEAP8[9812];HEAP8[r5+5|0]=HEAP8[9813];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25728,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9320+(r6<<2)>>2],HEAP32[r2+8>>2]=18384,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a6(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[9848];HEAP8[r5+1|0]=HEAP8[9849];HEAP8[r5+2|0]=HEAP8[9850];HEAP8[r5+3|0]=HEAP8[9851];HEAP8[r5+4|0]=HEAP8[9852];HEAP8[r5+5|0]=HEAP8[9853];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25728,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9320+(r6<<2)>>2],HEAP32[r2+8>>2]=18384,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a7(r1,r2){var r3,r4,r5,r6,r7,r8;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[9960];HEAP8[r5+1|0]=HEAP8[9961];HEAP8[r5+2|0]=HEAP8[9962];HEAP8[r5+3|0]=HEAP8[9963];HEAP8[r5+4|0]=HEAP8[9964];HEAP8[r5+5|0]=HEAP8[9965];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}r7=r1+100|0;r8=r7|0;tempBigInt=978535771;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;r8=r7+4|0;tempBigInt=6113604;HEAP8[r8]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt;_sprintf(r1+164|0,25728,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9320+(r6<<2)>>2],HEAP32[r2+8>>2]=18384,r2));STACKTOP=r2;HEAP32[r4>>2]=2;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_a8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[14872];HEAP8[r5+1|0]=HEAP8[14873];HEAP8[r5+2|0]=HEAP8[14874];HEAP8[r5+3|0]=HEAP8[14875];HEAP8[r5+4|0]=HEAP8[14876];r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_a9(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[14872];HEAP8[r5+1|0]=HEAP8[14873];HEAP8[r5+2|0]=HEAP8[14874];HEAP8[r5+3|0]=HEAP8[14875];HEAP8[r5+4|0]=HEAP8[14876];r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_aa(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10016];HEAP8[r2+1|0]=HEAP8[10017];HEAP8[r2+2|0]=HEAP8[10018];HEAP8[r2+3|0]=HEAP8[10019];HEAP8[r2+4|0]=HEAP8[10020];HEAP8[r2+5|0]=HEAP8[10021];return}function _dop_ab(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10088];HEAP8[r2+1|0]=HEAP8[10089];HEAP8[r2+2|0]=HEAP8[10090];HEAP8[r2+3|0]=HEAP8[10091];HEAP8[r2+4|0]=HEAP8[10092];HEAP8[r2+5|0]=HEAP8[10093];return}function _dop_ac(r1,r2){var r3,r4,r5,r6;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[10144];HEAP8[r5+1|0]=HEAP8[10145];HEAP8[r5+2|0]=HEAP8[10146];HEAP8[r5+3|0]=HEAP8[10147];HEAP8[r5+4|0]=HEAP8[10148];HEAP8[r5+5|0]=HEAP8[10149];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}_sprintf(r1+100|0,25728,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9320+(r6<<2)>>2],HEAP32[r2+8>>2]=18384,r2));STACKTOP=r2;HEAP32[r4>>2]=1;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_ad(r1,r2){var r3,r4,r5,r6;r2=0;r3=STACKTOP;HEAP32[r1+12>>2]=1;r4=r1+96|0;HEAP32[r4>>2]=0;r5=r1+32|0;HEAP8[r5]=HEAP8[10232];HEAP8[r5+1|0]=HEAP8[10233];HEAP8[r5+2|0]=HEAP8[10234];HEAP8[r5+3|0]=HEAP8[10235];HEAP8[r5+4|0]=HEAP8[10236];HEAP8[r5+5|0]=HEAP8[10237];r5=r1+4|0;r6=HEAP32[r5>>2];if((r6|0)==0){STACKTOP=r3;return}_sprintf(r1+100|0,25728,(r2=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r2>>2]=HEAP32[9320+(r6<<2)>>2],HEAP32[r2+8>>2]=18384,r2));STACKTOP=r2;HEAP32[r4>>2]=1;HEAP32[r5>>2]=0;STACKTOP=r3;return}function _dop_ae(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10432];HEAP8[r2+1|0]=HEAP8[10433];HEAP8[r2+2|0]=HEAP8[10434];HEAP8[r2+3|0]=HEAP8[10435];HEAP8[r2+4|0]=HEAP8[10436];HEAP8[r2+5|0]=HEAP8[10437];return}function _dop_af(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10584];HEAP8[r2+1|0]=HEAP8[10585];HEAP8[r2+2|0]=HEAP8[10586];HEAP8[r2+3|0]=HEAP8[10587];HEAP8[r2+4|0]=HEAP8[10588];HEAP8[r2+5|0]=HEAP8[10589];return}function _dop_b0(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9344+((HEAP8[r2]&7)<<2)>>2]);_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_b8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_strcpy(r1+100|0,HEAP32[9376+((HEAP8[r2]&7)<<2)>>2]);_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_c0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9640+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,0);_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c1(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;r5=r2+1|0;_strcpy(r1+32|0,HEAP32[9640+((HEAPU8[r5]>>>3&7)<<2)>>2]);r6=_disasm_ea(r1,r1+100|0,r5,1);_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r6+1)|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=r6+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c2(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[10632];HEAP8[r5+1|0]=HEAP8[10633];HEAP8[r5+2|0]=HEAP8[10634];HEAP8[r5+3|0]=HEAP8[10635];HEAP8[r5+4|0]=HEAP8[10636];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_c3(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10632];HEAP8[r2+1|0]=HEAP8[10633];HEAP8[r2+2|0]=HEAP8[10634];HEAP8[r2+3|0]=HEAP8[10635];HEAP8[r2+4|0]=HEAP8[10636];return}function _dop_c4(r1,r2){var r3;r3=r1+32|0;tempBigInt=5457228;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_c5(r1,r2){var r3;r3=r1+32|0;tempBigInt=5456972;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+3|0]=tempBigInt;r3=r2+1|0;_strcpy(r1+100|0,HEAP32[9376+((HEAPU8[r3]>>>3&7)<<2)>>2]);HEAP32[r1+12>>2]=_disasm_ea(r1,r1+164|0,r3,1)+1;HEAP32[r1+96>>2]=2;return}function _dop_c6(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=_disasm_ea(r1,r1+100|0,r2+1|0,0);r6=r1+12|0;HEAP32[r6>>2]=r5;_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r5+1)|0],r3));STACKTOP=r3;HEAP32[r6>>2]=HEAP32[r6>>2]+2;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c7(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=5656397;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;r5=_disasm_ea(r1,r1+100|0,r2+1|0,1);r6=r1+12|0;HEAP32[r6>>2]=r5;_sprintf(r1+164|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+(r5+2)|0]<<8|HEAPU8[r2+(r5+1)|0],r3));STACKTOP=r3;HEAP32[r6>>2]=HEAP32[r6>>2]+3;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|1;r5=r1+32|0;HEAP8[r5]=HEAP8[10912];HEAP8[r5+1|0]=HEAP8[10913];HEAP8[r5+2|0]=HEAP8[10914];HEAP8[r5+3|0]=HEAP8[10915];HEAP8[r5+4|0]=HEAP8[10916];HEAP8[r5+5|0]=HEAP8[10917];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+3|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=4;HEAP32[r1+96>>2]=2;STACKTOP=r4;return}function _dop_c9(r1,r2){r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|1;HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[10960];HEAP8[r2+1|0]=HEAP8[10961];HEAP8[r2+2|0]=HEAP8[10962];HEAP8[r2+3|0]=HEAP8[10963];HEAP8[r2+4|0]=HEAP8[10964];HEAP8[r2+5|0]=HEAP8[10965];return}function _dop_ca(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[11008];HEAP8[r5+1|0]=HEAP8[11009];HEAP8[r5+2|0]=HEAP8[11010];HEAP8[r5+3|0]=HEAP8[11011];HEAP8[r5+4|0]=HEAP8[11012];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_cb(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11008];HEAP8[r2+1|0]=HEAP8[11009];HEAP8[r2+2|0]=HEAP8[11010];HEAP8[r2+3|0]=HEAP8[11011];HEAP8[r2+4|0]=HEAP8[11012];return}function _dop_cc(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11064];HEAP8[r2+1|0]=HEAP8[11065];HEAP8[r2+2|0]=HEAP8[11066];HEAP8[r2+3|0]=HEAP8[11067];HEAP8[r2+4|0]=HEAP8[11068];r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|256;return}function _dop_cd(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|256;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=r1+32|0;tempBigInt=5525065;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_ce(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11416];HEAP8[r2+1|0]=HEAP8[11417];HEAP8[r2+2|0]=HEAP8[11418];HEAP8[r2+3|0]=HEAP8[11419];HEAP8[r2+4|0]=HEAP8[11420];r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]|256;return}function _dop_cf(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[11472];HEAP8[r2+1|0]=HEAP8[11473];HEAP8[r2+2|0]=HEAP8[11474];HEAP8[r2+3|0]=HEAP8[11475];HEAP8[r2+4|0]=HEAP8[11476];return}function _dop_d0(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9640+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,0);r3=r1+164|0;tempBigInt=49;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d1(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9640+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,1);r3=r1+164|0;tempBigInt=49;HEAP8[r3]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt;HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d2(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9640+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,0);r3=r1+164|0;HEAP8[r3]=HEAP8[17632];HEAP8[r3+1|0]=HEAP8[17633];HEAP8[r3+2|0]=HEAP8[17634];HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d3(r1,r2){var r3;r3=r2+1|0;_strcpy(r1+32|0,HEAP32[9640+((HEAPU8[r3]>>>3&7)<<2)>>2]);r2=_disasm_ea(r1,r1+100|0,r3,1);r3=r1+164|0;HEAP8[r3]=HEAP8[17632];HEAP8[r3+1|0]=HEAP8[17633];HEAP8[r3+2|0]=HEAP8[17634];HEAP32[r1+12>>2]=r2+1;HEAP32[r1+96>>2]=2;return}function _dop_d4(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1+32|0;tempBigInt=5062977;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;STACKTOP=r4;return}function _dop_d7(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;HEAP8[r2]=HEAP8[12448];HEAP8[r2+1|0]=HEAP8[12449];HEAP8[r2+2|0]=HEAP8[12450];HEAP8[r2+3|0]=HEAP8[12451];HEAP8[r2+4|0]=HEAP8[12452];return}function _dop_e0(r1,r2){var r3,r4,r5,r6;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|512;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=HEAPU8[r2+1|0];r6=HEAPU16[r1+8>>1]+2+((r5&128|0)!=0?r5|65280:r5)|0;_strcpy(r1+32|0,HEAP32[9624+(HEAPU8[r2]-224<<2)>>2]);_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r6&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e4(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[13192];HEAP8[r5+1|0]=HEAP8[13193];HEAP8[r5+2|0]=HEAP8[13194];r5=r1+100|0;HEAP8[r5]=HEAP8[17808];HEAP8[r5+1|0]=HEAP8[17809];HEAP8[r5+2|0]=HEAP8[17810];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e5(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;HEAP8[r5]=HEAP8[13192];HEAP8[r5+1|0]=HEAP8[13193];HEAP8[r5+2|0]=HEAP8[13194];r5=r1+100|0;HEAP8[r5]=HEAP8[16424];HEAP8[r5+1|0]=HEAP8[16425];HEAP8[r5+2|0]=HEAP8[16426];_sprintf(r1+164|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e6(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5526863;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;r3=r1+164|0;HEAP8[r3]=HEAP8[17808];HEAP8[r3+1|0]=HEAP8[17809];HEAP8[r3+2|0]=HEAP8[17810];STACKTOP=r4;return}function _dop_e7(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=2;r5=r1+32|0;tempBigInt=5526863;HEAP8[r5]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt;_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2+1|0],r3));STACKTOP=r3;r3=r1+164|0;HEAP8[r3]=HEAP8[16424];HEAP8[r3+1|0]=HEAP8[16425];HEAP8[r3+2|0]=HEAP8[16426];STACKTOP=r4;return}function _dop_e8(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;r5=r1|0;HEAP32[r5>>2]=HEAP32[r5>>2]|256;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=(HEAP16[r1+8>>1]+3&65535)+(HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0])&65535;r2=r1+32|0;HEAP8[r2]=HEAP8[18360];HEAP8[r2+1|0]=HEAP8[18361];HEAP8[r2+2|0]=HEAP8[18362];HEAP8[r2+3|0]=HEAP8[18363];HEAP8[r2+4|0]=HEAP8[18364];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_e9(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=3;HEAP32[r1+96>>2]=1;r5=(HEAP16[r1+8>>1]+3&65535)+(HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0])&65535;r2=r1+32|0;HEAP8[r2]=HEAP8[12752];HEAP8[r2+1|0]=HEAP8[12753];HEAP8[r2+2|0]=HEAP8[12754];HEAP8[r2+3|0]=HEAP8[12755];HEAP8[r2+4|0]=HEAP8[12756];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r5&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_ea(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=5;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[13712];HEAP8[r5+1|0]=HEAP8[13713];HEAP8[r5+2|0]=HEAP8[13714];HEAP8[r5+3|0]=HEAP8[13715];HEAP8[r5+4|0]=HEAP8[13716];r5=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];_sprintf(r1+100|0,12800,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=HEAPU8[r2+4|0]<<8|HEAPU8[r2+3|0],HEAP32[r3+8>>2]=r5,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_eb(r1,r2){var r3,r4,r5;r3=0;r4=STACKTOP;HEAP32[r1+12>>2]=2;HEAP32[r1+96>>2]=1;r5=HEAPU8[r2+1|0];r2=HEAPU16[r1+8>>1]+2+((r5&128|0)!=0?r5|65280:r5)|0;r5=r1+32|0;HEAP8[r5]=HEAP8[12952];HEAP8[r5+1|0]=HEAP8[12953];HEAP8[r5+2|0]=HEAP8[12954];HEAP8[r5+3|0]=HEAP8[12955];HEAP8[r5+4|0]=HEAP8[12956];_sprintf(r1+100|0,13808,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=r2&65535,r3));STACKTOP=r3;STACKTOP=r4;return}function _dop_ec(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;HEAP8[r2]=HEAP8[13192];HEAP8[r2+1|0]=HEAP8[13193];HEAP8[r2+2|0]=HEAP8[13194];r2=r1+100|0;HEAP8[r2]=HEAP8[17808];HEAP8[r2+1|0]=HEAP8[17809];HEAP8[r2+2|0]=HEAP8[17810];r2=r1+164|0;HEAP8[r2]=HEAP8[16192];HEAP8[r2+1|0]=HEAP8[16193];HEAP8[r2+2|0]=HEAP8[16194];return}function _dop_ed(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;HEAP8[r2]=HEAP8[13192];HEAP8[r2+1|0]=HEAP8[13193];HEAP8[r2+2|0]=HEAP8[13194];r2=r1+100|0;HEAP8[r2]=HEAP8[16424];HEAP8[r2+1|0]=HEAP8[16425];HEAP8[r2+2|0]=HEAP8[16426];r2=r1+164|0;HEAP8[r2]=HEAP8[16192];HEAP8[r2+1|0]=HEAP8[16193];HEAP8[r2+2|0]=HEAP8[16194];return}function _dop_ee(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;tempBigInt=5526863;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[16192];HEAP8[r2+1|0]=HEAP8[16193];HEAP8[r2+2|0]=HEAP8[16194];r2=r1+164|0;HEAP8[r2]=HEAP8[17808];HEAP8[r2+1|0]=HEAP8[17809];HEAP8[r2+2|0]=HEAP8[17810];return}function _dop_ef(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=2;r2=r1+32|0;tempBigInt=5526863;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;r2=r1+100|0;HEAP8[r2]=HEAP8[16192];HEAP8[r2+1|0]=HEAP8[16193];HEAP8[r2+2|0]=HEAP8[16194];r2=r1+164|0;HEAP8[r2]=HEAP8[16424];HEAP8[r2+1|0]=HEAP8[16425];HEAP8[r2+2|0]=HEAP8[16426];return}function _dop_f0(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+256|0;r4=r3;r5=r2+1|0;HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r5>>2]|0)!=0){r6=0;while(1){r7=r6+1|0;HEAP8[r6+(r1+16)|0]=HEAP8[r2+r7|0];if(r7>>>0<HEAP32[r5>>2]>>>0){r6=r7}else{break}}}r6=r4|0;r4=r1+32|0;_strcpy(r6,r4);HEAP8[r4]=HEAP8[13320];HEAP8[r4+1|0]=HEAP8[13321];HEAP8[r4+2|0]=HEAP8[13322];HEAP8[r4+3|0]=HEAP8[13323];HEAP8[r4+4|0]=HEAP8[13324];HEAP8[r4+5|0]=HEAP8[13325];_strcat(r4,r6);HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r3;return}function _dop_f2(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+256|0;r4=r3;r5=r2+1|0;HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r5>>2]|0)!=0){r6=0;while(1){r7=r6+1|0;HEAP8[r6+(r1+16)|0]=HEAP8[r2+r7|0];if(r7>>>0<HEAP32[r5>>2]>>>0){r6=r7}else{break}}}r6=r4|0;r4=r1+32|0;_strcpy(r6,r4);HEAP8[r4]=HEAP8[13496];HEAP8[r4+1|0]=HEAP8[13497];HEAP8[r4+2|0]=HEAP8[13498];HEAP8[r4+3|0]=HEAP8[13499];HEAP8[r4+4|0]=HEAP8[13500];HEAP8[r4+5|0]=HEAP8[13501];HEAP8[r4+6|0]=HEAP8[13502];_strcat(r4,r6);HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r3;return}function _dop_f3(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+256|0;r4=r3;r5=r2+1|0;HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;FUNCTION_TABLE[HEAP32[7296+((HEAP8[r5]&255)<<2)>>2]](r1,r5);r5=r1+12|0;if((HEAP32[r5>>2]|0)!=0){r6=0;while(1){r7=r6+1|0;HEAP8[r6+(r1+16)|0]=HEAP8[r2+r7|0];if(r7>>>0<HEAP32[r5>>2]>>>0){r6=r7}else{break}}}r6=r4|0;r4=r1+32|0;_strcpy(r6,r4);HEAP8[r4]=HEAP8[13504];HEAP8[r4+1|0]=HEAP8[13505];HEAP8[r4+2|0]=HEAP8[13506];HEAP8[r4+3|0]=HEAP8[13507];HEAP8[r4+4|0]=HEAP8[13508];_strcat(r4,r6);HEAP32[r5>>2]=HEAP32[r5>>2]+1;STACKTOP=r3;return}function _dop_f4(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=5524552;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_f5(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;r2=r1+32|0;tempBigInt=4410691;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;return}function _dop_f6(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76;r3=0;r4=0;r5=STACKTOP;r6=r2+1|0;r7=HEAP8[r6];r8=r7&255;r9=r8>>>3;r10=r9&7;switch(r10|0){case 2:{r11=r1+32|0;r12=r11;tempBigInt=5525326;HEAP8[r12]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+3|0]=tempBigInt;r13=r1+100|0;r14=_disasm_ea(r1,r13,r6,0);r15=r14+1|0;r16=r1+12|0;HEAP32[r16>>2]=r15;r17=r1+96|0;HEAP32[r17>>2]=1;STACKTOP=r5;return;break};case 1:{r18=r1+12|0;HEAP32[r18>>2]=1;r19=r1+96|0;HEAP32[r19>>2]=1;r20=r1+32|0;HEAP8[r20]=HEAP8[22176];HEAP8[r20+1|0]=HEAP8[22177];HEAP8[r20+2|0]=HEAP8[22178];r21=r1+100|0;r22=HEAP8[r2];r23=r22&255;r24=_sprintf(r21,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r23,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 0:{r25=r1+32|0;HEAP8[r25]=HEAP8[14872];HEAP8[r25+1|0]=HEAP8[14873];HEAP8[r25+2|0]=HEAP8[14874];HEAP8[r25+3|0]=HEAP8[14875];HEAP8[r25+4|0]=HEAP8[14876];r26=r1+100|0;r27=_disasm_ea(r1,r26,r6,0);r28=r1+164|0;r29=r27+1|0;r30=r2+r29|0;r31=HEAP8[r30];r32=r31&255;r33=_sprintf(r28,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r32,r4));STACKTOP=r4;r34=r27+2|0;r35=r1+12|0;HEAP32[r35>>2]=r34;r36=r1+96|0;HEAP32[r36>>2]=2;STACKTOP=r5;return;break};case 6:{r37=r1+32|0;r38=r37;tempBigInt=5654852;HEAP8[r38]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r38+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r38+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r38+3|0]=tempBigInt;r39=r1+100|0;r40=_disasm_ea(r1,r39,r6,0);r41=r40+1|0;r42=r1+12|0;HEAP32[r42>>2]=r41;r43=r1+96|0;HEAP32[r43>>2]=1;STACKTOP=r5;return;break};case 4:{r44=r1+32|0;r45=r44;tempBigInt=5002573;HEAP8[r45]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r45+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r45+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r45+3|0]=tempBigInt;r46=r1+100|0;r47=_disasm_ea(r1,r46,r6,0);r48=r47+1|0;r49=r1+12|0;HEAP32[r49>>2]=r48;r50=r1+96|0;HEAP32[r50>>2]=1;STACKTOP=r5;return;break};case 7:{r51=r1+32|0;HEAP8[r51]=HEAP8[14016];HEAP8[r51+1|0]=HEAP8[14017];HEAP8[r51+2|0]=HEAP8[14018];HEAP8[r51+3|0]=HEAP8[14019];HEAP8[r51+4|0]=HEAP8[14020];r52=r1+100|0;r53=_disasm_ea(r1,r52,r6,0);r54=r53+1|0;r55=r1+12|0;HEAP32[r55>>2]=r54;r56=r1+96|0;HEAP32[r56>>2]=1;STACKTOP=r5;return;break};case 3:{r57=r1+32|0;r58=r57;tempBigInt=4670798;HEAP8[r58]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r58+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r58+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r58+3|0]=tempBigInt;r59=r1+100|0;r60=_disasm_ea(r1,r59,r6,0);r61=r60+1|0;r62=r1+12|0;HEAP32[r62>>2]=r61;r63=r1+96|0;HEAP32[r63>>2]=1;STACKTOP=r5;return;break};case 5:{r64=r1+32|0;HEAP8[r64]=HEAP8[14352];HEAP8[r64+1|0]=HEAP8[14353];HEAP8[r64+2|0]=HEAP8[14354];HEAP8[r64+3|0]=HEAP8[14355];HEAP8[r64+4|0]=HEAP8[14356];r65=r1+100|0;r66=_disasm_ea(r1,r65,r6,0);r67=r66+1|0;r68=r1+12|0;HEAP32[r68>>2]=r67;r69=r1+96|0;HEAP32[r69>>2]=1;STACKTOP=r5;return;break};default:{r70=r1+12|0;HEAP32[r70>>2]=1;r71=r1+96|0;HEAP32[r71>>2]=1;r72=r1+32|0;HEAP8[r72]=HEAP8[22176];HEAP8[r72+1|0]=HEAP8[22177];HEAP8[r72+2|0]=HEAP8[22178];r73=r1+100|0;r74=HEAP8[r2];r75=r74&255;r76=_sprintf(r73,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r75,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _dop_f7(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82;r3=0;r4=0;r5=STACKTOP;r6=r2+1|0;r7=HEAP8[r6];r8=r7&255;r9=r8>>>3;r10=r9&7;switch(r10|0){case 4:{r11=r1+32|0;r12=r11;tempBigInt=5002573;HEAP8[r12]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r12+3|0]=tempBigInt;r13=r1+100|0;r14=_disasm_ea(r1,r13,r6,1);r15=r14+1|0;r16=r1+12|0;HEAP32[r16>>2]=r15;r17=r1+96|0;HEAP32[r17>>2]=1;STACKTOP=r5;return;break};case 5:{r18=r1+32|0;HEAP8[r18]=HEAP8[14352];HEAP8[r18+1|0]=HEAP8[14353];HEAP8[r18+2|0]=HEAP8[14354];HEAP8[r18+3|0]=HEAP8[14355];HEAP8[r18+4|0]=HEAP8[14356];r19=r1+100|0;r20=_disasm_ea(r1,r19,r6,1);r21=r20+1|0;r22=r1+12|0;HEAP32[r22>>2]=r21;r23=r1+96|0;HEAP32[r23>>2]=1;STACKTOP=r5;return;break};case 6:{r24=r1+32|0;r25=r24;tempBigInt=5654852;HEAP8[r25]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r25+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r25+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r25+3|0]=tempBigInt;r26=r1+100|0;r27=_disasm_ea(r1,r26,r6,1);r28=r27+1|0;r29=r1+12|0;HEAP32[r29>>2]=r28;r30=r1+96|0;HEAP32[r30>>2]=1;STACKTOP=r5;return;break};case 0:{r31=r1+32|0;HEAP8[r31]=HEAP8[14872];HEAP8[r31+1|0]=HEAP8[14873];HEAP8[r31+2|0]=HEAP8[14874];HEAP8[r31+3|0]=HEAP8[14875];HEAP8[r31+4|0]=HEAP8[14876];r32=r1+100|0;r33=_disasm_ea(r1,r32,r6,1);r34=r1+164|0;r35=r33+1|0;r36=r2+r35|0;r37=HEAP8[r36];r38=r33+2|0;r39=r2+r38|0;r40=HEAP8[r39];r41=r40&255;r42=r41<<8;r43=r37&255;r44=r42|r43;r45=_sprintf(r34,13808,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r44,r4));STACKTOP=r4;r46=r33+3|0;r47=r1+12|0;HEAP32[r47>>2]=r46;r48=r1+96|0;HEAP32[r48>>2]=2;STACKTOP=r5;return;break};case 2:{r49=r1+32|0;r50=r49;tempBigInt=5525326;HEAP8[r50]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r50+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r50+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r50+3|0]=tempBigInt;r51=r1+100|0;r52=_disasm_ea(r1,r51,r6,1);r53=r52+1|0;r54=r1+12|0;HEAP32[r54>>2]=r53;r55=r1+96|0;HEAP32[r55>>2]=1;STACKTOP=r5;return;break};case 3:{r56=r1+32|0;r57=r56;tempBigInt=4670798;HEAP8[r57]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r57+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r57+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r57+3|0]=tempBigInt;r58=r1+100|0;r59=_disasm_ea(r1,r58,r6,1);r60=r59+1|0;r61=r1+12|0;HEAP32[r61>>2]=r60;r62=r1+96|0;HEAP32[r62>>2]=1;STACKTOP=r5;return;break};case 1:{r63=r1+12|0;HEAP32[r63>>2]=1;r64=r1+96|0;HEAP32[r64>>2]=1;r65=r1+32|0;HEAP8[r65]=HEAP8[22176];HEAP8[r65+1|0]=HEAP8[22177];HEAP8[r65+2|0]=HEAP8[22178];r66=r1+100|0;r67=HEAP8[r2];r68=r67&255;r69=_sprintf(r66,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r68,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 7:{r70=r1+32|0;HEAP8[r70]=HEAP8[14016];HEAP8[r70+1|0]=HEAP8[14017];HEAP8[r70+2|0]=HEAP8[14018];HEAP8[r70+3|0]=HEAP8[14019];HEAP8[r70+4|0]=HEAP8[14020];r71=r1+100|0;r72=_disasm_ea(r1,r71,r6,1);r73=r72+1|0;r74=r1+12|0;HEAP32[r74>>2]=r73;r75=r1+96|0;HEAP32[r75>>2]=1;STACKTOP=r5;return;break};default:{r76=r1+12|0;HEAP32[r76>>2]=1;r77=r1+96|0;HEAP32[r77>>2]=1;r78=r1+32|0;HEAP8[r78]=HEAP8[22176];HEAP8[r78+1|0]=HEAP8[22177];HEAP8[r78+2|0]=HEAP8[22178];r79=r1+100|0;r80=HEAP8[r2];r81=r80&255;r82=_sprintf(r79,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r81,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _dop_f8(r1,r2){HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=0;_strcpy(r1+32|0,HEAP32[9408+(HEAPU8[r2]-248<<2)>>2]);return}function _dop_fe(r1,r2){var r3,r4,r5,r6,r7;r3=0;r4=STACKTOP;r5=r2+1|0;r6=HEAPU8[r5]>>>3&7;if((r6|0)==1){r7=r1+32|0;tempBigInt=4408644;HEAP8[r7]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r7+3|0]=tempBigInt;HEAP32[r1+12>>2]=_disasm_ea(r1,r1+100|0,r5,0)+1;HEAP32[r1+96>>2]=1;STACKTOP=r4;return}else if((r6|0)==0){r6=r1+32|0;tempBigInt=4410953;HEAP8[r6]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r6+3|0]=tempBigInt;HEAP32[r1+12>>2]=_disasm_ea(r1,r1+100|0,r5,0)+1;HEAP32[r1+96>>2]=1;STACKTOP=r4;return}else{HEAP32[r1+12>>2]=1;HEAP32[r1+96>>2]=1;r5=r1+32|0;HEAP8[r5]=HEAP8[22176];HEAP8[r5+1|0]=HEAP8[22177];HEAP8[r5+2|0]=HEAP8[22178];_sprintf(r1+100|0,13728,(r3=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r3>>2]=HEAPU8[r2],r3));STACKTOP=r3;STACKTOP=r4;return}}function _dop_ff(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75;r3=0;r4=0;r5=STACKTOP;r6=r2+1|0;r7=HEAP8[r6];r8=r7&255;r9=r8>>>3;r10=r9&7;switch(r10|0){case 3:{r11=r1+32|0;HEAP8[r11]=HEAP8[16624];HEAP8[r11+1|0]=HEAP8[16625];HEAP8[r11+2|0]=HEAP8[16626];HEAP8[r11+3|0]=HEAP8[16627];HEAP8[r11+4|0]=HEAP8[16628];HEAP8[r11+5|0]=HEAP8[16629];r12=r1+100|0;r13=_disasm_ea(r1,r12,r6,1);r14=r13+1|0;r15=r1+12|0;HEAP32[r15>>2]=r14;r16=r1+96|0;HEAP32[r16>>2]=1;r17=r1|0;r18=HEAP32[r17>>2];r19=r18|256;HEAP32[r17>>2]=r19;STACKTOP=r5;return;break};case 4:{r20=r1+32|0;r21=r20;tempBigInt=5262666;HEAP8[r21]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r21+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r21+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r21+3|0]=tempBigInt;r22=r1+100|0;r23=_disasm_ea(r1,r22,r6,1);r24=r23+1|0;r25=r1+12|0;HEAP32[r25>>2]=r24;r26=r1+96|0;HEAP32[r26>>2]=1;STACKTOP=r5;return;break};case 5:{r27=r1+32|0;HEAP8[r27]=HEAP8[13712];HEAP8[r27+1|0]=HEAP8[13713];HEAP8[r27+2|0]=HEAP8[13714];HEAP8[r27+3|0]=HEAP8[13715];HEAP8[r27+4|0]=HEAP8[13716];r28=r1+100|0;r29=_disasm_ea(r1,r28,r6,1);r30=r29+1|0;r31=r1+12|0;HEAP32[r31>>2]=r30;r32=r1+96|0;HEAP32[r32>>2]=1;STACKTOP=r5;return;break};case 1:{r33=r1+32|0;r34=r33;tempBigInt=4408644;HEAP8[r34]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r34+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r34+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r34+3|0]=tempBigInt;r35=r1+100|0;r36=_disasm_ea(r1,r35,r6,1);r37=r36+1|0;r38=r1+12|0;HEAP32[r38>>2]=r37;r39=r1+96|0;HEAP32[r39>>2]=1;STACKTOP=r5;return;break};case 7:{r40=r1+12|0;HEAP32[r40>>2]=1;r41=r1+96|0;HEAP32[r41>>2]=1;r42=r1+32|0;HEAP8[r42]=HEAP8[22176];HEAP8[r42+1|0]=HEAP8[22177];HEAP8[r42+2|0]=HEAP8[22178];r43=r1+100|0;r44=HEAP8[r2];r45=r44&255;r46=_sprintf(r43,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r45,r4));STACKTOP=r4;STACKTOP=r5;return;break};case 2:{r47=r1+32|0;HEAP8[r47]=HEAP8[18360];HEAP8[r47+1|0]=HEAP8[18361];HEAP8[r47+2|0]=HEAP8[18362];HEAP8[r47+3|0]=HEAP8[18363];HEAP8[r47+4|0]=HEAP8[18364];r48=r1+100|0;r49=_disasm_ea(r1,r48,r6,1);r50=r49+1|0;r51=r1+12|0;HEAP32[r51>>2]=r50;r52=r1+96|0;HEAP32[r52>>2]=1;r53=r1|0;r54=HEAP32[r53>>2];r55=r54|256;HEAP32[r53>>2]=r55;STACKTOP=r5;return;break};case 0:{r56=r1+32|0;r57=r56;tempBigInt=4410953;HEAP8[r57]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r57+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r57+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r57+3|0]=tempBigInt;r58=r1+100|0;r59=_disasm_ea(r1,r58,r6,1);r60=r59+1|0;r61=r1+12|0;HEAP32[r61>>2]=r60;r62=r1+96|0;HEAP32[r62>>2]=1;STACKTOP=r5;return;break};case 6:{r63=r1+32|0;HEAP8[r63]=HEAP8[12736];HEAP8[r63+1|0]=HEAP8[12737];HEAP8[r63+2|0]=HEAP8[12738];HEAP8[r63+3|0]=HEAP8[12739];HEAP8[r63+4|0]=HEAP8[12740];r64=r1+100|0;r65=_disasm_ea(r1,r64,r6,1);r66=r65+1|0;r67=r1+12|0;HEAP32[r67>>2]=r66;r68=r1+96|0;HEAP32[r68>>2]=1;STACKTOP=r5;return;break};default:{r69=r1+12|0;HEAP32[r69>>2]=1;r70=r1+96|0;HEAP32[r70>>2]=1;r71=r1+32|0;HEAP8[r71]=HEAP8[22176];HEAP8[r71+1|0]=HEAP8[22177];HEAP8[r71+2|0]=HEAP8[22178];r72=r1+100|0;r73=HEAP8[r2];r74=r73&255;r75=_sprintf(r72,13728,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r74,r4));STACKTOP=r4;STACKTOP=r5;return}}}function _disasm_ea(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=0;r6=STACKTOP;r7=HEAPU8[r3];r8=r7&192;if((r8|0)==192){r9=r7&7;if((r4|0)==0){_strcpy(r2,HEAP32[9344+(r9<<2)>>2]);r10=1;STACKTOP=r6;return r10}else{_strcpy(r2,HEAP32[9376+(r9<<2)>>2]);r10=1;STACKTOP=r6;return r10}}r9=r8>>>3|r7&7;r7=r1+4|0;r1=HEAP32[9320+(HEAP32[r7>>2]<<2)>>2];HEAP32[r7>>2]=0;r7=(r4|0)!=0?11864:10976;HEAP8[r2]=HEAP8[r7];HEAP8[r2+1|0]=HEAP8[r7+1|0];HEAP8[r2+2|0]=HEAP8[r7+2|0];HEAP8[r2+3|0]=HEAP8[r7+3|0];HEAP8[r2+4|0]=HEAP8[r7+4|0];HEAP8[r2+5|0]=HEAP8[r7+5|0];r7=r2+_strlen(r2)|0;r2=HEAP32[9436+(r9<<3)>>2];if((r9|0)==6){r4=HEAPU8[r3+2|0]<<8|HEAPU8[r3+1|0];_sprintf(r7,10104,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r4,r5));STACKTOP=r5;r10=3;STACKTOP=r6;return r10}r4=HEAP32[9432+(r9<<3)>>2];if((r4|0)==1){r9=HEAPU8[r3+1|0];r8=r9&128;_sprintf(r7,24672,(r5=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r2,HEAP32[r5+16>>2]=(r8>>>6)+43,HEAP32[r5+24>>2]=((r8|0)==0?r9:-r9|0)&255,r5));STACKTOP=r5}else if((r4|0)==2){r9=HEAPU8[r3+2|0]<<8;r8=r9|HEAPU8[r3+1|0];r3=r9&32768;_sprintf(r7,23680,(r5=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r2,HEAP32[r5+16>>2]=(r3>>>14)+43,HEAP32[r5+24>>2]=((r3|0)==0?r8:-r8|0)&65535,r5));STACKTOP=r5}else if((r4|0)==0){_sprintf(r7,25728,(r5=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r5>>2]=r1,HEAP32[r5+8>>2]=r2,r5));STACKTOP=r5}else{HEAP8[r7]=HEAP8[22928];HEAP8[r7+1|0]=HEAP8[22929];HEAP8[r7+2|0]=HEAP8[22930];HEAP8[r7+3|0]=HEAP8[22931];HEAP8[r7+4|0]=HEAP8[22932];HEAP8[r7+5|0]=HEAP8[22933]}r10=r4+1|0;STACKTOP=r6;return r10}function _e86_set_80186(r1){var r2;_e86_set_8086(r1);r2=r1|0;HEAP32[r2>>2]=HEAP32[r2>>2]&-12|10;HEAP32[r1+544>>2]=486;HEAP32[r1+548>>2]=484;HEAP32[r1+552>>2]=496;HEAP32[r1+576>>2]=346;HEAP32[r1+580>>2]=344;HEAP32[r1+584>>2]=376;HEAP32[r1+588>>2]=300;HEAP32[r1+592>>2]=382;HEAP32[r1+596>>2]=368;HEAP32[r1+600>>2]=286;HEAP32[r1+604>>2]=374;HEAP32[r1+928>>2]=774;HEAP32[r1+932>>2]=776;HEAP32[r1+960>>2]=1028;HEAP32[r1+964>>2]=1048;return}function _op_60(r1){var r2;r2=HEAP16[r1+12>>1];_e86_push(r1,HEAP16[r1+4>>1]);_e86_push(r1,HEAP16[r1+6>>1]);_e86_push(r1,HEAP16[r1+8>>1]);_e86_push(r1,HEAP16[r1+10>>1]);_e86_push(r1,r2);_e86_push(r1,HEAP16[r1+14>>1]);_e86_push(r1,HEAP16[r1+16>>1]);_e86_push(r1,HEAP16[r1+18>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;return 1}function _op_61(r1){var r2;HEAP16[r1+18>>1]=_e86_pop(r1);HEAP16[r1+16>>1]=_e86_pop(r1);HEAP16[r1+14>>1]=_e86_pop(r1);_e86_pop(r1);HEAP16[r1+10>>1]=_e86_pop(r1);HEAP16[r1+8>>1]=_e86_pop(r1);HEAP16[r1+6>>1]=_e86_pop(r1);HEAP16[r1+4>>1]=_e86_pop(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;return 1}function _op_62(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];r2=r3&65535;if((HEAP32[r1+1184>>2]|0)==0){_fwrite(13664,21,1,HEAP32[_stderr>>2]);r4=HEAPU16[r1+1196>>1]+1|0;return r4}r5=HEAP16[r1+1194>>1];r6=HEAPU16[r1+1192>>1]<<4;r7=r1+80|0;r8=HEAP32[r7>>2];r9=r6+(r5&65535)&r8;r10=r9+1|0;r11=r1+76|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r9|0];r15=r8;r16=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r14=r12;r15=HEAP32[r7>>2];r16=HEAP32[r11>>2]}r11=r14&65535;r7=r15&(r5+2&65535)+r6;r6=r7+1|0;if(r6>>>0<r16>>>0){r16=HEAP32[r1+72>>2];r17=HEAPU8[r16+r6|0]<<8|HEAPU8[r16+r7|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r7)}r7=r17&65535;r16=r3<<16>>16<0?r2|-65536:r2;do{if((r16|0)>=((r14<<16>>16<0?r11|-65536:r11)|0)){if((r16|0)>((r17<<16>>16<0?r7|-65536:r7)+2|0)){break}r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+34;r4=HEAPU16[r1+1196>>1]+1|0;return r4}}while(0);_e86_trap(r1,5);r4=0;return r4}function _op_68(r1){var r2;_e86_push(r1,HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+3;return 3}function _op_69(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1)&65535;r4=r1+1196|0;r5=HEAPU16[r4>>1];r6=HEAPU8[r5+2+(r1+128)|0]<<8;r7=r6|HEAPU8[r5+1+(r1+128)|0];r5=Math_imul((r6&32768|0)!=0?r7|-65536:r7,(r3&32768|0)!=0?r3|-65536:r3)|0;HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r5;r2=r5&-32768;r5=r1+30|0;r3=HEAP16[r5>>1];if((r2|0)==-32768|(r2|0)==0){r8=r3&-2050}else{r8=r3|2049}HEAP16[r5>>1]=(r2|0)==0?r8|64:r8&-65;r8=r1+1200|0;HEAP32[r8>>2]=((HEAP32[r1+1184>>2]|0)!=0?30:23)+HEAP32[r8>>2];return HEAPU16[r4>>1]+3|0}function _op_6a(r1){var r2;r2=HEAPU8[r1+129|0];_e86_push(r1,((r2&128|0)!=0?r2|65280:r2)&65535);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+3;return 2}function _op_6b(r1){var r2,r3,r4,r5,r6,r7;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1)&65535;r4=r1+1196|0;r5=HEAPU8[HEAPU16[r4>>1]+1+(r1+128)|0];r6=(r5&128|0)!=0?r5|65280:r5;r5=Math_imul((r6&32768|0)!=0?r6|-65536:r6,(r3&32768|0)!=0?r3|-65536:r3)|0;HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r5;r2=r5&-32768;r5=r1+30|0;r3=HEAP16[r5>>1];if((r2|0)==-32768|(r2|0)==0){r7=r3&-2050}else{r7=r3|2049}HEAP16[r5>>1]=(r2|0)==0?r7|64:r7&-65;r7=r1+1200|0;HEAP32[r7>>2]=((HEAP32[r1+1184>>2]|0)!=0?30:23)+HEAP32[r7>>2];return HEAPU16[r4>>1]+2|0}function _op_6c(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((HEAP32[r1+144>>2]&12|0)==0){r3=HEAP16[r1+20>>1];r4=r1+18|0;r5=HEAP16[r4>>1];r6=FUNCTION_TABLE[HEAP32[r1+56>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r7=HEAP32[r1+80>>2]&((r3&65535)<<4)+(r5&65535);if(r7>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r7|0]=r6}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r7,r6)}HEAP16[r4>>1]=HEAP16[r4>>1]+r2;r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;return 1}r4=r1+6|0;if((HEAP16[r4>>1]|0)==0){return 1}r6=r1+20|0;r7=r1+18|0;r5=r1+56|0;r3=r1+52|0;r8=r1+8|0;r9=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+40|0;r15=r1+32|0;r1=HEAP16[r7>>1];while(1){r16=HEAP16[r6>>1];r17=FUNCTION_TABLE[HEAP32[r5>>2]](HEAP32[r3>>2],HEAPU16[r8>>1]);r18=HEAP32[r9>>2]&((r16&65535)<<4)+(r1&65535);if(r18>>>0<HEAP32[r10>>2]>>>0){HEAP8[HEAP32[r11>>2]+r18|0]=r17}else{FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r18,r17)}r17=HEAP16[r7>>1]+r2&65535;HEAP16[r7>>1]=r17;r18=HEAP16[r4>>1]-1&65535;HEAP16[r4>>1]=r18;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r18<<16>>16==0){break}else{r1=r17}}return 1}function _op_6d(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((HEAP32[r1+144>>2]&12|0)==0){r3=HEAP16[r1+20>>1];r4=r1+18|0;r5=HEAP16[r4>>1];r6=FUNCTION_TABLE[HEAP32[r1+64>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r7=HEAP32[r1+80>>2]&((r3&65535)<<4)+(r5&65535);r5=r7+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r3=r1+72|0;HEAP8[HEAP32[r3>>2]+r7|0]=r6;HEAP8[HEAP32[r3>>2]+r5|0]=(r6&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r7,r6)}HEAP16[r4>>1]=HEAP16[r4>>1]+r2;r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+8;return 1}r4=r1+6|0;if((HEAP16[r4>>1]|0)==0){return 1}r6=r1+20|0;r7=r1+18|0;r5=r1+64|0;r3=r1+52|0;r8=r1+8|0;r9=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+48|0;r15=r1+32|0;r1=HEAP16[r7>>1];while(1){r16=HEAP16[r6>>1];r17=FUNCTION_TABLE[HEAP32[r5>>2]](HEAP32[r3>>2],HEAPU16[r8>>1]);r18=HEAP32[r9>>2]&((r16&65535)<<4)+(r1&65535);r16=r18+1|0;if(r16>>>0<HEAP32[r10>>2]>>>0){HEAP8[HEAP32[r11>>2]+r18|0]=r17;HEAP8[HEAP32[r11>>2]+r16|0]=(r17&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r18,r17)}r17=HEAP16[r7>>1]+r2&65535;HEAP16[r7>>1]=r17;r18=HEAP16[r4>>1]-1&65535;HEAP16[r4>>1]=r18;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r18<<16>>16==0){break}else{r1=r17}}return 1}function _op_6e(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=HEAP32[r1+144>>2];r3=HEAP16[((r2&2|0)==0?r1+26|0:r1+148|0)>>1];r4=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((r2&12|0)==0){r2=HEAP32[r1+60>>2];r5=HEAP32[r1+52>>2];r6=HEAPU16[r1+8>>1];r7=r1+16|0;r8=HEAPU16[r7>>1]+((r3&65535)<<4)&HEAP32[r1+80>>2];if(r8>>>0<HEAP32[r1+76>>2]>>>0){r9=HEAP8[HEAP32[r1+72>>2]+r8|0]}else{r9=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8)}FUNCTION_TABLE[r2](r5,r6,r9);HEAP16[r7>>1]=HEAP16[r7>>1]+r4;r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;return 1}r7=r1+6|0;if((HEAP16[r7>>1]|0)==0){return 1}r9=r1+60|0;r6=r1+52|0;r5=r1+8|0;r2=r1+16|0;r8=(r3&65535)<<4;r3=r1+80|0;r10=r1+76|0;r11=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+36|0;r15=r1+32|0;r1=HEAP16[r2>>1];while(1){r16=HEAP32[r9>>2];r17=HEAP32[r6>>2];r18=HEAPU16[r5>>1];r19=(r1&65535)+r8&HEAP32[r3>>2];if(r19>>>0<HEAP32[r10>>2]>>>0){r20=HEAP8[HEAP32[r11>>2]+r19|0]}else{r20=FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r19)}FUNCTION_TABLE[r16](r17,r18,r20);r18=HEAP16[r2>>1]+r4&65535;HEAP16[r2>>1]=r18;r17=HEAP16[r7>>1]-1&65535;HEAP16[r7>>1]=r17;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r17<<16>>16==0){break}else{r1=r18}}return 1}function _op_6f(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=HEAP32[r1+144>>2];r3=HEAP16[((r2&2|0)==0?r1+26|0:r1+148|0)>>1];r4=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((r2&12|0)==0){r2=HEAP32[r1+68>>2];r5=HEAP32[r1+52>>2];r6=HEAPU16[r1+8>>1];r7=r1+16|0;r8=HEAPU16[r7>>1]+((r3&65535)<<4)&HEAP32[r1+80>>2];r9=r8+1|0;if(r9>>>0<HEAP32[r1+76>>2]>>>0){r10=HEAP32[r1+72>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r8|0]}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8)}FUNCTION_TABLE[r2](r5,r6,r11);HEAP16[r7>>1]=HEAP16[r7>>1]+r4;r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+8;return 1}r7=r1+6|0;if((HEAP16[r7>>1]|0)==0){return 1}r11=r1+68|0;r6=r1+52|0;r5=r1+8|0;r2=r1+16|0;r8=(r3&65535)<<4;r3=r1+80|0;r10=r1+76|0;r9=r1+72|0;r12=r1+1216|0;r13=r1+1200|0;r14=r1+44|0;r15=r1+32|0;r1=HEAP16[r2>>1];while(1){r16=HEAP32[r11>>2];r17=HEAP32[r6>>2];r18=HEAPU16[r5>>1];r19=(r1&65535)+r8&HEAP32[r3>>2];r20=r19+1|0;if(r20>>>0<HEAP32[r10>>2]>>>0){r21=HEAP32[r9>>2];r22=HEAPU8[r21+r20|0]<<8|HEAPU8[r21+r19|0]}else{r22=FUNCTION_TABLE[HEAP32[r14>>2]](HEAP32[r15>>2],r19)}FUNCTION_TABLE[r16](r17,r18,r22);r18=HEAP16[r2>>1]+r4&65535;HEAP16[r2>>1]=r18;r17=HEAP16[r7>>1]-1&65535;HEAP16[r7>>1]=r17;r16=_i64Add(HEAP32[r12>>2],HEAP32[r12+4>>2],1,0);HEAP32[r12>>2]=r16;HEAP32[r12+4>>2]=tempRet0;HEAP32[r13>>2]=HEAP32[r13>>2]+8;if(r17<<16>>16==0){break}else{r1=r18}}return 1}function _op_c0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178,r179,r180,r181,r182,r183,r184,r185;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea8(r1);r6=r1+1196|0;r7=HEAP16[r6>>1];r8=r7&65535;r9=r8+1|0;r10=r9+(r1+128)|0;r11=HEAP8[r10];r12=r11&255;r13=r1|0;r14=HEAP32[r13>>2];r15=r14&2;r16=(r15|0)==0;r17=r12&31;r18=r16?r12:r17;r19=(r18|0)==0;if(r19){r20=r9;return r20}r21=r4&255;r22=r21>>>3;r23=r22&7;L4:do{switch(r23|0){case 7:{r24=r5&255;r25=r24&128;r26=(r25|0)!=0;r27=r26?65280:0;r28=r27|r24;r29=r18>>>0>7;r30=r18-1|0;r31=r29?7:r30;r32=r28>>>(r31>>>0);r33=r32&1;r34=(r33|0)==0;r35=r1+30|0;r36=HEAP16[r35>>1];r37=r36&-2;r38=r36|1;r39=r34?r37:r38;HEAP16[r35>>1]=r39;r40=r32>>>1;r41=r40&255;_e86_set_flg_szp_8(r1,r41);r42=HEAP16[r35>>1];r43=r42&-2049;HEAP16[r35>>1]=r43;r44=r41;break};case 1:{r45=r5&255;r46=r18&7;r47=r45>>>(r46>>>0);r48=8-r46|0;r49=r45<<r48;r50=r49|r47;r51=r50&128;r52=(r51|0)==0;r53=r1+30|0;r54=HEAP16[r53>>1];r55=r54&-2;r56=r54|1;r57=r52?r55:r56;HEAP16[r53>>1]=r57;r58=r50<<1;r59=r58^r45;r60=r59&128;r61=(r60|0)==0;if(r61){r62=r57&-2049;HEAP16[r53>>1]=r62;r63=r50&255;r44=r63;break L4}else{r64=r57|2048;HEAP16[r53>>1]=r64;r65=r50&255;r44=r65;break L4}break};case 4:{r66=r18>>>0>8;r67=r5&255;if(r66){r68=0}else{r69=r67<<r18;r70=r69&65535;r68=r70}r71=r68&255;_e86_set_flg_szp_8(r1,r71);r72=r68&256;r73=r72<<16>>16==0;r74=r1+30|0;r75=HEAP16[r74>>1];r76=r75&-2;r77=r75|1;r78=r73?r76:r77;HEAP16[r74>>1]=r78;r79=r67<<1;r80=r79^r67;r81=r80&128;r82=(r81|0)==0;if(r82){r83=r78&-2049;HEAP16[r74>>1]=r83;r44=r71;break L4}else{r84=r78|2048;HEAP16[r74>>1]=r84;r44=r71;break L4}break};case 3:{r85=r1+30|0;r86=HEAP16[r85>>1];r87=r86<<8;r88=r87&256;r89=r5&255;r90=r88|r89;r91=r90&65535;r92=(r18>>>0)%9&-1;r93=r91>>>(r92>>>0);r94=9-r92|0;r95=r91<<r94;r96=r93|r95;r97=r96&256;r98=(r97|0)==0;r99=r86&-2;r100=r86|1;r101=r98?r99:r100;HEAP16[r85>>1]=r101;r102=r96<<1;r103=r102^r91;r104=r103&128;r105=(r104|0)==0;if(r105){r106=r101&-2049;HEAP16[r85>>1]=r106;r107=r96&255;r44=r107;break L4}else{r108=r101|2048;HEAP16[r85>>1]=r108;r109=r96&255;r44=r109;break L4}break};case 2:{r110=r1+30|0;r111=HEAP16[r110>>1];r112=r111<<8;r113=r112&256;r114=r5&255;r115=r113|r114;r116=r115&65535;r117=(r18>>>0)%9&-1;r118=r116<<r117;r119=9-r117|0;r120=r116>>>(r119>>>0);r121=r118|r120;r122=r121&256;r123=(r122|0)==0;r124=r111&-2;r125=r111|1;r126=r123?r124:r125;HEAP16[r110>>1]=r126;r127=r116<<1;r128=r127^r116;r129=r128&128;r130=(r129|0)==0;if(r130){r131=r126&-2049;HEAP16[r110>>1]=r131;r132=r121&255;r44=r132;break L4}else{r133=r126|2048;HEAP16[r110>>1]=r133;r134=r121&255;r44=r134;break L4}break};case 5:{r135=r18>>>0>8;if(r135){r136=0}else{r137=r5&255;r138=r18-1|0;r139=r137>>>(r138>>>0);r140=r139&65535;r136=r140}r141=r136&1;r142=(r141|0)==0;r143=r1+30|0;r144=HEAP16[r143>>1];r145=r144&-2;r146=r144|1;r147=r142?r145:r146;HEAP16[r143>>1]=r147;r148=r136>>>1;r149=r148&255;_e86_set_flg_szp_8(r1,r149);r150=r5<<24>>24<0;r151=HEAP16[r143>>1];if(r150){r152=r151|2048;HEAP16[r143>>1]=r152;r44=r149;break L4}else{r153=r151&-2049;HEAP16[r143>>1]=r153;r44=r149;break L4}break};case 0:{r154=r5&255;r155=r18&7;r156=r154<<r155;r157=8-r155|0;r158=r154>>>(r157>>>0);r159=r158|r156;r160=r159&1;r161=(r160|0)==0;r162=r1+30|0;r163=HEAP16[r162>>1];r164=r163&-2;r165=r163|1;r166=r161?r164:r165;HEAP16[r162>>1]=r166;r167=r154<<1;r168=r167^r154;r169=r168&128;r170=(r169|0)==0;if(r170){r171=r166&-2049;HEAP16[r162>>1]=r171;r172=r159&255;r44=r172;break L4}else{r173=r166|2048;HEAP16[r162>>1]=r173;r174=r159&255;r44=r174;break L4}break};default:{r44=0}}}while(0);_e86_set_ea8(r1,r44);r175=r1+1184|0;r176=HEAP32[r175>>2];r177=(r176|0)!=0;r178=r177?17:5;r179=r1+1200|0;r180=HEAP32[r179>>2];r181=r180+r18|0;r182=r181+r178|0;HEAP32[r179>>2]=r182;r183=HEAP16[r6>>1];r184=r183&65535;r185=r184+2|0;r20=r185;return r20}function _op_c1(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166,r167,r168,r169,r170,r171,r172,r173,r174,r175,r176,r177,r178;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea16(r1);r6=r5&65535;r7=r1+1196|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r9+1|0;r11=r10+(r1+128)|0;r12=HEAP8[r11];r13=r12&255;r14=r1|0;r15=HEAP32[r14>>2];r16=r15&2;r17=(r16|0)==0;r18=r13&31;r19=r17?r13:r18;r20=(r19|0)==0;if(r20){r21=r10;return r21}r22=r4&255;r23=r22>>>3;r24=r23&7;L4:do{switch(r24|0){case 3:{r25=r1+30|0;r26=HEAP16[r25>>1];r27=r26&65535;r28=r27<<16;r29=r28&65536;r30=r29|r6;r31=(r19>>>0)%17&-1;r32=r30>>>(r31>>>0);r33=17-r31|0;r34=r30<<r33;r35=r32|r34;r36=r35&65536;r37=(r36|0)==0;r38=r26&-2;r39=r26|1;r40=r37?r38:r39;HEAP16[r25>>1]=r40;r41=r35<<1;r42=r41^r6;r43=r42&32768;r44=(r43|0)==0;if(r44){r45=r40&-2049;HEAP16[r25>>1]=r45;r46=r35&65535;r47=r46;break L4}else{r48=r40|2048;HEAP16[r25>>1]=r48;r49=r35&65535;r47=r49;break L4}break};case 4:{r50=r19>>>0>16;r51=r6<<r19;r52=r50?0:r51;r53=r52&65535;_e86_set_flg_szp_16(r1,r53);r54=r52&65536;r55=(r54|0)==0;r56=r1+30|0;r57=HEAP16[r56>>1];r58=r57&-2;r59=r57|1;r60=r55?r58:r59;HEAP16[r56>>1]=r60;r61=r6<<1;r62=r61^r6;r63=r62&32768;r64=(r63|0)==0;if(r64){r65=r60&-2049;HEAP16[r56>>1]=r65;r47=r53;break L4}else{r66=r60|2048;HEAP16[r56>>1]=r66;r47=r53;break L4}break};case 5:{r67=r19>>>0>16;if(r67){r68=0}else{r69=r19-1|0;r70=r6>>>(r69>>>0);r68=r70}r71=r68&1;r72=(r71|0)==0;r73=r1+30|0;r74=HEAP16[r73>>1];r75=r74&-2;r76=r74|1;r77=r72?r75:r76;HEAP16[r73>>1]=r77;r78=r68>>>1;r79=r78&65535;_e86_set_flg_szp_16(r1,r79);r80=r6&32768;r81=(r80|0)==0;r82=HEAP16[r73>>1];if(r81){r83=r82&-2049;HEAP16[r73>>1]=r83;r47=r79;break L4}else{r84=r82|2048;HEAP16[r73>>1]=r84;r47=r79;break L4}break};case 7:{r85=r6&32768;r86=(r85|0)!=0;r87=r86?-65536:0;r88=r87|r6;r89=r19>>>0>15;r90=r19-1|0;r91=r89?15:r90;r92=r88>>>(r91>>>0);r93=r92&1;r94=(r93|0)==0;r95=r1+30|0;r96=HEAP16[r95>>1];r97=r96&-2;r98=r96|1;r99=r94?r97:r98;HEAP16[r95>>1]=r99;r100=r92>>>1;r101=r100&65535;_e86_set_flg_szp_16(r1,r101);r102=HEAP16[r95>>1];r103=r102&-2049;HEAP16[r95>>1]=r103;r47=r101;break};case 2:{r104=r1+30|0;r105=HEAP16[r104>>1];r106=r105&65535;r107=r106<<16;r108=r107&65536;r109=r108|r6;r110=(r19>>>0)%17&-1;r111=r109<<r110;r112=17-r110|0;r113=r109>>>(r112>>>0);r114=r111|r113;r115=r114&65536;r116=(r115|0)==0;r117=r105&-2;r118=r105|1;r119=r116?r117:r118;HEAP16[r104>>1]=r119;r120=r6<<1;r121=r120^r6;r122=r121&32768;r123=(r122|0)==0;if(r123){r124=r119&-2049;HEAP16[r104>>1]=r124;r125=r114&65535;r47=r125;break L4}else{r126=r119|2048;HEAP16[r104>>1]=r126;r127=r114&65535;r47=r127;break L4}break};case 0:{r128=r19&15;r129=r6<<r128;r130=16-r128|0;r131=r6>>>(r130>>>0);r132=r131|r129;r133=r132&1;r134=(r133|0)==0;r135=r1+30|0;r136=HEAP16[r135>>1];r137=r136&-2;r138=r136|1;r139=r134?r137:r138;HEAP16[r135>>1]=r139;r140=r6<<1;r141=r140^r6;r142=r141&32768;r143=(r142|0)==0;if(r143){r144=r139&-2049;HEAP16[r135>>1]=r144;r145=r132&65535;r47=r145;break L4}else{r146=r139|2048;HEAP16[r135>>1]=r146;r147=r132&65535;r47=r147;break L4}break};case 1:{r148=r19&15;r149=r6>>>(r148>>>0);r150=16-r148|0;r151=r6<<r150;r152=r151|r149;r153=r152&32768;r154=(r153|0)==0;r155=r1+30|0;r156=HEAP16[r155>>1];r157=r156&-2;r158=r156|1;r159=r154?r157:r158;HEAP16[r155>>1]=r159;r160=r152<<1;r161=r160^r6;r162=r161&32768;r163=(r162|0)==0;if(r163){r164=r159&-2049;HEAP16[r155>>1]=r164;r165=r152&65535;r47=r165;break L4}else{r166=r159|2048;HEAP16[r155>>1]=r166;r167=r152&65535;r47=r167;break L4}break};default:{r47=0}}}while(0);_e86_set_ea16(r1,r47);r168=r1+1184|0;r169=HEAP32[r168>>2];r170=(r169|0)!=0;r171=r170?17:5;r172=r1+1200|0;r173=HEAP32[r172>>2];r174=r173+r19|0;r175=r174+r171|0;HEAP32[r172>>2]=r175;r176=HEAP16[r7>>1];r177=r176&65535;r178=r177+2|0;r21=r178;return r21}function _op_c8(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1+14|0;_e86_push(r1,HEAP16[r2>>1]);r3=r1+12|0;r4=HEAP16[r3>>1];r5=HEAP8[r1+131|0]&31;r6=r5&255;if(r5<<24>>24!=0){if((r5&255)>1){r5=(r4&65535)<<4;r7=r1+80|0;r8=r1+76|0;r9=r1+72|0;r10=r1+44|0;r11=r1+32|0;r12=1;r13=HEAP16[r2>>1];while(1){r14=r13-2&65535;r15=HEAP32[r7>>2]&(r14&65535)+r5;r16=r15+1|0;if(r16>>>0<HEAP32[r8>>2]>>>0){r17=HEAP32[r9>>2];r18=HEAPU8[r17+r16|0]<<8|HEAPU8[r17+r15|0]}else{r18=FUNCTION_TABLE[HEAP32[r10>>2]](HEAP32[r11>>2],r15)}_e86_push(r1,r18);r15=r12+1|0;if(r15>>>0<r6>>>0){r12=r15;r13=r14}else{break}}}_e86_push(r1,r4)}HEAP16[r2>>1]=r4;HEAP16[r3>>1]=r4-(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);if((r6|0)==1){r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+25;return 4}else if((r6|0)==0){r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+15;return 4}else{r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+(r6<<4|6);return 4}}function _op_c9(r1){var r2;r2=r1+14|0;HEAP16[r1+12>>1]=HEAP16[r2>>1];HEAP16[r2>>1]=_e86_pop(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;return 1}function _e86_get_mem_uint8(r1,r2){return-86}function _e86_get_mem_uint16(r1,r2){return-21846}function _e86_set_mem_uint8(r1,r2,r3){return}function _e86_set_mem_uint16(r1,r2,r3){return}function _e86_new(){var r1,r2,r3;r1=_malloc(1224);if((r1|0)==0){r2=0;return r2}HEAP32[r1>>2]=1;HEAP32[r1+32>>2]=0;HEAP32[r1+36>>2]=1170;HEAP32[r1+44>>2]=1118;HEAP32[r1+40>>2]=490;HEAP32[r1+48>>2]=522;HEAP32[r1+52>>2]=0;HEAP32[r1+56>>2]=1170;HEAP32[r1+64>>2]=1118;HEAP32[r1+60>>2]=490;HEAP32[r1+68>>2]=522;HEAP32[r1+72>>2]=0;HEAP32[r1+76>>2]=0;HEAP32[r1+80>>2]=1048575;r3=r1+84|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+24>>2]=0;HEAP32[r1+116>>2]=4;HEAP32[r1+120>>2]=6;HEAP8[r1+156|0]=0;HEAP32[r1+152>>2]=0;_memcpy(r1+160|0,5864,1024)|0;r3=r1+1208|0;HEAP32[r1+1200>>2]=0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;r2=r1;return r2}function _e86_set_8086(r1){var r2,r3;HEAP32[r1>>2]=1;r2=0;while(1){HEAP32[r1+160+(r2<<2)>>2]=HEAP32[5864+(r2<<2)>>2];r3=r2+1|0;if(r3>>>0<256){r2=r3}else{break}}HEAP32[r1+116>>2]=6;HEAP32[r1+120>>2]=6;HEAP32[r1+124>>2]=0;return}function _e86_set_inta_fct(r1,r2,r3){HEAP32[r1+84>>2]=r2;HEAP32[r1+88>>2]=r3;return}function _e86_set_ram(r1,r2,r3){HEAP32[r1+72>>2]=r2;HEAP32[r1+76>>2]=r3;return}function _e86_set_mem(r1,r2,r3,r4,r5,r6){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=r3;HEAP32[r1+40>>2]=r4;HEAP32[r1+44>>2]=r5;HEAP32[r1+48>>2]=r6;return}function _e86_set_prt(r1,r2,r3,r4,r5,r6){HEAP32[r1+52>>2]=r2;HEAP32[r1+56>>2]=r3;HEAP32[r1+60>>2]=r4;HEAP32[r1+64>>2]=r5;HEAP32[r1+68>>2]=r6;return}function _e86_get_reg(r1,r2,r3){var r4,r5,r6,r7,r8;r4=0;r5=(HEAP8[r2]|0)==37?r2+1|0:r2;r2=0;while(1){if(r2>>>0>=8){r6=0;r4=7;break}if((_strcmp(r5,HEAP32[7264+(r2<<2)>>2])|0)==0){r4=4;break}if((_strcmp(r5,HEAP32[7232+(r2<<2)>>2])|0)==0){r4=6;break}else{r2=r2+1|0}}if(r4==4){HEAP32[r3>>2]=HEAPU16[r1+4+((r2&7)<<1)>>1];r7=0;return r7}else if(r4==6){r8=HEAPU16[r1+4+((r2&3)<<1)>>1];HEAP32[r3>>2]=((r2&4|0)!=0?r8>>>8:r8)&255;r7=0;return r7}else if(r4==7){while(1){r4=0;if(r6>>>0>=4){break}if((_strcmp(r5,HEAP32[400+(r6<<2)>>2])|0)==0){r4=9;break}else{r6=r6+1|0;r4=7}}if(r4==9){HEAP32[r3>>2]=HEAPU16[r1+20+((r6&3)<<1)>>1];r7=0;return r7}if((_strcmp(r5,13656)|0)==0){HEAP32[r3>>2]=HEAPU16[r1+28>>1];r7=0;return r7}if((_strcmp(r5,21744)|0)!=0){r7=1;return r7}HEAP32[r3>>2]=HEAPU16[r1+30>>1];r7=0;return r7}}function _e86_set_reg(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;r5=(HEAP8[r2]|0)==37?r2+1|0:r2;r2=0;while(1){if(r2>>>0>=8){r6=0;r4=10;break}if((_strcmp(r5,HEAP32[7264+(r2<<2)>>2])|0)==0){r4=4;break}if((_strcmp(r5,HEAP32[7232+(r2<<2)>>2])|0)==0){r4=6;break}else{r2=r2+1|0}}if(r4==4){HEAP16[r1+4+((r2&7)<<1)>>1]=r3;r7=0;return r7}else if(r4==6){r8=r1+4+((r2&3)<<1)|0;r9=HEAP16[r8>>1];if((r2&4|0)==0){r10=(r9&-256&65535|r3&255)&65535}else{r10=(r9&255|r3<<8)&65535}HEAP16[r8>>1]=r10;r7=0;return r7}else if(r4==10){while(1){r4=0;if(r6>>>0>=4){break}if((_strcmp(r5,HEAP32[400+(r6<<2)>>2])|0)==0){r4=12;break}else{r6=r6+1|0;r4=10}}if(r4==12){HEAP16[r1+20+((r6&3)<<1)>>1]=r3;r7=0;return r7}if((_strcmp(r5,13656)|0)==0){HEAP16[r1+28>>1]=r3;r7=0;return r7}if((_strcmp(r5,21744)|0)!=0){r7=1;return r7}HEAP16[r1+30>>1]=r3;r7=0;return r7}}function _e86_trap(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r3=HEAP32[r1+108>>2];if((r3|0)!=0){FUNCTION_TABLE[r3](HEAP32[r1+92>>2],r2&255)}r3=r1+144|0;r4=HEAP32[r3>>2];if((r4&32|0)==0){r5=HEAP16[r1+28>>1]}else{r6=HEAP16[r1+112>>1];if((HEAP32[r1>>2]&1|0)==0){r7=r6}else{r7=r6+(((r4>>>1&1^1)&65535|(r4&12|0)==0)^1)&65535}HEAP32[r3>>2]=0;r5=r7}r7=r1+30|0;_e86_push(r1,HEAP16[r7>>1]);r3=r1+22|0;_e86_push(r1,HEAP16[r3>>1]);_e86_push(r1,r5);r5=r2<<2&1020;r2=r1+80|0;r4=HEAP32[r2>>2];r6=r4&(r5&65535);r8=r6|1;r9=r1+76|0;r10=HEAP32[r9>>2];if(r8>>>0<r10>>>0){r11=HEAP32[r1+72>>2];r12=HEAPU8[r11+r8|0]<<8|HEAPU8[r11+r6|0];r13=r4;r14=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r6);r12=r10;r13=HEAP32[r2>>2];r14=HEAP32[r9>>2]}HEAP16[r1+28>>1]=r12;r12=r13&((r5|2)&65535);r5=r12|1;if(r5>>>0<r14>>>0){r14=HEAP32[r1+72>>2];r15=HEAPU8[r14+r5|0]<<8|HEAPU8[r14+r12|0];HEAP16[r3>>1]=r15;r16=HEAP16[r7>>1];r17=r16&-769;HEAP16[r7>>1]=r17;_e86_pq_init(r1);return}else{r15=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r12);HEAP16[r3>>1]=r15;r16=HEAP16[r7>>1];r17=r16&-769;HEAP16[r7>>1]=r17;_e86_pq_init(r1);return}}function _e86_irq(r1,r2){HEAP8[r1+156|0]=r2<<24>>24!=0|0;return}function _e86_undefined(r1){var r2,r3;r2=HEAP32[r1+104>>2];if((r2|0)!=0){FUNCTION_TABLE[r2](HEAP32[r1+92>>2],HEAP8[r1+128|0],HEAP8[r1+129|0])}if((HEAP32[r1>>2]&8|0)==0){r3=1;return r3}_e86_trap(r1,6);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+50;r3=0;return r3}function _e86_get_opcnt(r1){var r2;r2=r1+1216|0;return tempRet0=HEAP32[r2+4>>2],HEAP32[r2>>2]}function _e86_reset(r1){var r2;r2=r1+1216|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r1+80>>2]=1048575;_memset(r1+4|0,0,24)|0;HEAP16[r1+22>>1]=-4096;HEAP16[r1+28>>1]=-16;HEAP16[r1+30>>1]=0;HEAP32[r1+124>>2]=0;HEAP8[r1+156|0]=0;HEAP32[r1+152>>2]=0;HEAP32[r1+144>>2]=0;return}function _e86_execute(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=r1+152|0;if((HEAP32[r2>>2]|0)!=0){r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;r4=r1+156|0;if((HEAP8[r4]|0)==0){return}if((HEAP16[r1+30>>1]&512)==0){return}HEAP8[r4]=0;HEAP32[r2>>2]=0;r4=HEAP32[r1+88>>2];if((r4|0)==0){return}r5=FUNCTION_TABLE[r4](HEAP32[r1+84>>2]);HEAP32[r3>>2]=HEAP32[r3>>2]+61;_e86_trap(r1,r5&255);return}r5=r1+144|0;if((HEAP32[r5>>2]&32|0)==0){HEAP32[r5>>2]=0;r3=r1+28|0;HEAP16[r1+112>>1]=HEAP16[r3>>1];r6=r3}else{r6=r1+28|0}r3=r1+30|0;r4=HEAP16[r3>>1];r7=r1+156|0;r8=HEAP8[r7];r9=r1+157|0;HEAP8[r9]=1;r10=r1+100|0;r11=r1+128|0;r12=r1+1200|0;r13=r1+92|0;r14=r1+129|0;while(1){_e86_pq_fill(r1);HEAP32[r5>>2]=HEAP32[r5>>2]&-2;r15=HEAP32[r10>>2];if((r15|0)!=0){FUNCTION_TABLE[r15](HEAP32[r13>>2],HEAP8[r11],HEAP8[r14])}r15=FUNCTION_TABLE[HEAP32[r1+160+((HEAP8[r11]&255)<<2)>>2]](r1);if((r15|0)==0){HEAP32[r12>>2]=HEAP32[r12>>2]+10}else{HEAP16[r6>>1]=HEAPU16[r6>>1]+r15;_e86_pq_adjust(r1,r15)}if((HEAP32[r5>>2]&1|0)==0){break}}r5=r1+1216|0;r6=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],1,0);HEAP32[r5>>2]=r6;HEAP32[r5+4>>2]=tempRet0;if((HEAP8[r9]|0)==0){return}r9=HEAP16[r3>>1];if((r4&256&r9)<<16>>16!=0){_e86_trap(r1,1);return}if(r8<<24>>24==0){return}if((HEAP8[r7]|0)==0){return}if((r9&512)==0){return}HEAP8[r7]=0;HEAP32[r2>>2]=0;r2=HEAP32[r1+88>>2];if((r2|0)==0){return}r7=FUNCTION_TABLE[r2](HEAP32[r1+84>>2]);HEAP32[r12>>2]=HEAP32[r12>>2]+61;_e86_trap(r1,r7&255);return}function _e86_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r1+1200|0;r4=HEAP32[r3>>2];r5=r1+1208|0;if(r4>>>0>r2>>>0){r6=r2;r7=r4}else{r8=r2;r2=r4;while(1){r4=r8-r2|0;r9=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],r2,0);HEAP32[r5>>2]=r9;HEAP32[r5+4>>2]=tempRet0;HEAP32[r3>>2]=0;_e86_execute(r1);r9=HEAP32[r3>>2];if(r4>>>0<r9>>>0){r6=r4;r7=r9;break}else{r8=r4;r2=r9}}}HEAP32[r3>>2]=r7-r6;r7=_i64Add(HEAP32[r5>>2],HEAP32[r5+4>>2],r6,0);HEAP32[r5>>2]=r7;HEAP32[r5+4>>2]=tempRet0;return}function _ea_get00(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+16>>1]+HEAP16[r1+10>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+7;return}function _ea_get01(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+18>>1]+HEAP16[r1+10>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;return}function _ea_get02(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];HEAP16[r1+1194>>1]=HEAP16[r1+16>>1]+HEAP16[r1+14>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+8;return}function _ea_get03(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];HEAP16[r1+1194>>1]=HEAP16[r1+18>>1]+HEAP16[r1+14>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+7;return}function _ea_get04(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+16>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return}function _ea_get05(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+18>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return}function _ea_get06(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP32[r1+1188>>2];HEAP16[r1+1194>>1]=HEAPU8[r2+2|0]<<8|HEAPU8[r2+1|0];HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+6;return}function _ea_get07(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];HEAP16[r1+1194>>1]=HEAP16[r1+10>>1];HEAP16[r1+1196>>1]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return}function _ea_get08(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+16>>1]+HEAPU16[r1+10>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get09(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+18>>1]+HEAPU16[r1+10>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get0a(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+16>>1]+HEAPU16[r1+14>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get0b(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=HEAPU16[r1+18>>1]+HEAPU16[r1+14>>1]+((r2&128|0)!=0?r2|65280:r2);HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get0c(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+16>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get0d(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+18>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get0e(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+14>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get0f(r1){var r2;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAPU8[HEAP32[r1+1188>>2]+1|0];HEAP16[r1+1194>>1]=((r2&128|0)!=0?r2|65280:r2)+HEAPU16[r1+10>>1];HEAP16[r1+1196>>1]=2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get10(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+16>>1]+HEAP16[r1+10>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get11(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+18>>1]+HEAP16[r1+10>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get12(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAP16[r1+16>>1]+HEAP16[r1+14>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+12;return}function _ea_get13(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAP16[r1+18>>1]+HEAP16[r1+14>>1]&65535;r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return}function _ea_get14(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+16>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get15(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+18>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get16(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+24>>1];r2=HEAP16[r1+14>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get17(r1){var r2,r3,r4;HEAP32[r1+1184>>2]=1;HEAP16[r1+1192>>1]=HEAP16[r1+26>>1];r2=HEAP16[r1+10>>1];r3=r1+1194|0;HEAP16[r3>>1]=r2;r4=HEAP32[r1+1188>>2];HEAP16[r3>>1]=(HEAPU8[r4+2|0]<<8|HEAPU8[r4+1|0])+r2;HEAP16[r1+1196>>1]=3;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return}function _ea_get18(r1){HEAP32[r1+1184>>2]=0;HEAP16[r1+1192>>1]=0;HEAP16[r1+1194>>1]=HEAP8[HEAP32[r1+1188>>2]]&7;HEAP16[r1+1196>>1]=1;HEAP32[r1+1200>>2]=0;return}function _e86_get_ea_ptr(r1,r2){var r3;HEAP32[r1+1188>>2]=r2;r3=HEAPU8[r2];FUNCTION_TABLE[HEAP32[6888+((r3>>>3&24|r3&7)<<2)>>2]](r1);if((HEAP32[r1+144>>2]&2|0)==0){return}HEAP16[r1+1192>>1]=HEAP16[r1+148>>1];r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;return}function _e86_get_ea8(r1){var r2,r3,r4;if((HEAP32[r1+1184>>2]|0)==0){r2=HEAPU16[r1+1194>>1];r3=HEAPU16[r1+4+((r2&3)<<1)>>1];r4=((r2&4|0)!=0?r3>>>8:r3)&255;return r4}r3=(HEAPU16[r1+1192>>1]<<4)+HEAPU16[r1+1194>>1]&HEAP32[r1+80>>2];if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP8[HEAP32[r1+72>>2]+r3|0];return r4}else{r4=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r3);return r4}}function _e86_get_ea16(r1){var r2,r3,r4,r5;r2=0;if((HEAP32[r1+1184>>2]|0)==0){r3=HEAP16[r1+4+((HEAP16[r1+1194>>1]&7)<<1)>>1];return r3}r4=HEAP16[r1+1194>>1];if((HEAP32[r1>>2]&64|0)==0){if((r4&1)!=0){r2=4}}else{r2=4}if(r2==4){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4}r2=(HEAPU16[r1+1192>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r2+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=HEAP32[r1+72>>2];r3=HEAPU8[r5+r4|0]<<8|HEAPU8[r5+r2|0];return r3}else{r3=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);return r3}}function _e86_set_ea8(r1,r2){var r3,r4,r5;if((HEAP32[r1+1184>>2]|0)==0){r3=HEAPU16[r1+1194>>1];r4=r1+4+((r3&3)<<1)|0;r5=HEAP16[r4>>1];if((r3&4|0)==0){HEAP16[r4>>1]=r5&-256|r2&255;return}else{HEAP16[r4>>1]=r5&255|(r2&255)<<8;return}}else{r5=(HEAPU16[r1+1192>>1]<<4)+HEAPU16[r1+1194>>1]&HEAP32[r1+80>>2];if(r5>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r5|0]=r2;return}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r5,r2);return}}}function _e86_set_ea16(r1,r2){var r3,r4,r5;r3=0;if((HEAP32[r1+1184>>2]|0)==0){HEAP16[r1+4+((HEAP16[r1+1194>>1]&7)<<1)>>1]=r2;return}r4=HEAP16[r1+1194>>1];if((HEAP32[r1>>2]&64|0)==0){if((r4&1)!=0){r3=4}}else{r3=4}if(r3==4){r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4}r3=(HEAPU16[r1+1192>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;return}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);return}}function _e86_set_flg_szp_8(r1,r2){var r3,r4;r3=r2&255;if(r2<<24>>24==0){r4=64}else{r4=(r3&128|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-197|((HEAP8[r3+720|0]|0)==0?r4|4:r4);return}function _e86_set_flg_szp_16(r1,r2){var r3,r4;r3=r2&65535;if(r2<<16>>16==0){r4=64}else{r4=(r3&32768|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-197|((HEAP8[720+(r3&255)|0]|0)==0?r4|4:r4);return}function _e86_set_flg_log_8(r1,r2){var r3,r4;r3=r2&255;if(r2<<24>>24==0){r4=64}else{r4=(r3&128|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=((HEAP8[r3+720|0]|0)==0?r4|4:r4)&196|HEAP16[r2>>1]&-2246;return}function _e86_set_flg_log_16(r1,r2){var r3,r4;r3=r2&65535;if(r2<<16>>16==0){r4=64}else{r4=(r3&32768|0)==0?0:128}r2=r1+30|0;HEAP16[r2>>1]=((HEAP8[720+(r3&255)|0]|0)==0?r4|4:r4)&196|HEAP16[r2>>1]&-2246;return}function _e86_set_flg_add_8(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r3+r2&255;r5=r4&255;if(r4<<24>>24==0){r6=64}else{r6=(r5&128|0)==0?0:128}r4=r1+30|0;r1=(r3&255)+(r2&255)&65535;r7=(r1&65280|0)!=0|0;r8=((r1^r3&255)&128&(r1^r2&255)|0)==0?r7:r7|2048;HEAP16[r4>>1]=HEAP16[r4>>1]&-2262|(((r1^(r3^r2)&255)&16|0)==0?r8:r8|16)|((HEAP8[r5+720|0]|0)==0?r6|4:r6)&196;return}function _e86_set_flg_add_16(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=r2&65535;r5=r3&65535;r6=r3+r2&65535;r7=r6&65535;if(r6<<16>>16==0){r8=64}else{r8=(r7&32768|0)==0?0:128}r6=r1+30|0;r1=r5+r4|0;r9=r1>>>0>65535|0;r10=((r1^r5)&32768&(r1^r4)|0)==0?r9:r9|2048;HEAP16[r6>>1]=HEAP16[r6>>1]&-2262|((((r3^r2)&65535^r1)&16|0)==0?r10:r10|16)|((HEAP8[720+(r7&255)|0]|0)==0?r8|4:r8)&196;return}function _e86_set_flg_adc_8(r1,r2,r3,r4){var r5,r6,r7,r8;r5=(r3+r2&255)+r4&255;r6=r5&255;if(r5<<24>>24==0){r7=64}else{r7=(r6&128|0)==0?0:128}r5=r1+30|0;r1=((r3&255)+(r2&255)&65535)+(r4&255)&65535;r4=(r1&65280|0)!=0|0;r8=((r1^r3&255)&128&(r1^r2&255)|0)==0?r4:r4|2048;HEAP16[r5>>1]=HEAP16[r5>>1]&-2262|(((r1^(r3^r2)&255)&16|0)==0?r8:r8|16)|((HEAP8[r6+720|0]|0)==0?r7|4:r7)&196;return}function _e86_set_flg_adc_16(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=r2&65535;r6=r3&65535;r7=(r3+r2&65535)+r4&65535;r8=r7&65535;if(r7<<16>>16==0){r9=64}else{r9=(r8&32768|0)==0?0:128}r7=r1+30|0;r1=r6+r5+(r4&65535)|0;r4=r1>>>0>65535|0;r10=((r1^r6)&32768&(r1^r5)|0)==0?r4:r4|2048;HEAP16[r7>>1]=HEAP16[r7>>1]&-2262|(((r1^(r3^r2)&65535)&16|0)==0?r10:r10|16)|((HEAP8[720+(r8&255)|0]|0)==0?r9|4:r9)&196;return}function _e86_set_flg_sbb_8(r1,r2,r3,r4){var r5,r6,r7,r8;r5=r2&255;r6=r5-(r3&255)-(r4&255)|0;if((r6&255)<<24>>24==0){r7=64}else{r7=(r6&128|0)==0?0:128}r4=r1+30|0;r1=(r6&65280|0)!=0|0;r8=(r3^r2)&255;r2=(r8&128&(r6^r5)|0)==0?r1:r1|2048;HEAP16[r4>>1]=HEAP16[r4>>1]&-2262|(((r6^r8)&16|0)==0?r2:r2|16)|((HEAP8[720+(r6&255)|0]|0)==0?r7|4:r7)&196;return}function _e86_set_flg_sbb_16(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r2&65535;r6=r2-r3&65535;r7=r6-r4&65535;if(r6<<16>>16==r4<<16>>16){r8=64}else{r8=(r7&32768|0)==0?0:128}r6=r1+30|0;r1=r5-(r3&65535)-(r4&65535)|0;r4=r1>>>0>65535|0;r9=(r3^r2)&65535;r2=(r9&32768&(r1^r5)|0)==0?r4:r4|2048;HEAP16[r6>>1]=HEAP16[r6>>1]&-2262|(((r1^r9)&16|0)==0?r2:r2|16)|((HEAP8[720+(r7&255)|0]|0)==0?r8|4:r8)&196;return}function _e86_set_flg_sub_8(r1,r2,r3){var r4,r5,r6,r7,r8;r4=r2&255;r5=r4-(r3&255)|0;if((r5&255)<<24>>24==0){r6=64}else{r6=(r5&128|0)==0?0:128}r7=r1+30|0;r1=(r5&65280|0)!=0|0;r8=(r3^r2)&255;r2=(r8&128&(r5^r4)|0)==0?r1:r1|2048;HEAP16[r7>>1]=HEAP16[r7>>1]&-2262|(((r8^r5)&16|0)==0?r2:r2|16)|((HEAP8[720+(r5&255)|0]|0)==0?r6|4:r6)&196;return}function _e86_set_flg_sub_16(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=r2&65535;r5=r2-r3&65535;if(r2<<16>>16==r3<<16>>16){r6=64}else{r6=(r5&32768|0)==0?0:128}r7=r1+30|0;r1=r4-(r3&65535)|0;r8=r1>>>0>65535|0;r9=(r3^r2)&65535;r2=(r9&32768&(r1^r4)|0)==0?r8:r8|2048;HEAP16[r7>>1]=HEAP16[r7>>1]&-2262|(((r9^r1)&16|0)==0?r2:r2|16)|((HEAP8[720+(r5&255)|0]|0)==0?r6|4:r6)&196;return}function _e86_push(r1,r2){var r3,r4,r5;r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;return}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);return}}function _e86_pop(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];return r5}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);return r5}}function _op_00(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;_e86_set_ea8(r1,r5+(r3&255)&255);_e86_set_flg_add_8(r1,r3,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_01(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];_e86_set_ea16(r1,r4+r3&65535);_e86_set_flg_add_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_02(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=r5+(r3&255)&65535;r7=HEAP16[r4>>1];if(r2){r8=r6<<8|r7&255}else{r8=r6&255|r7&-256}HEAP16[r4>>1]=r8;_e86_set_flg_add_8(r1,r5&255,r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_03(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);HEAP16[r2>>1]=r4+r3;_e86_set_flg_add_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_04(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];HEAP16[r2>>1]=(r4&255)+r3&255|r3&-256;_e86_set_flg_add_8(r1,r3&255,r4);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_05(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r2>>1]=r4+(r3&65535);_e86_set_flg_add_16(r1,r3,r4&65535);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 3}function _op_06(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+20>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_07(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+20|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+20|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}}function _op_08(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(((r4&4|0)!=0?(r2&65535)>>>8:r2)|r3&255)&255;_e86_set_ea8(r1,r5);_e86_set_flg_log_8(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_09(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]|r3;_e86_set_ea16(r1,r4);_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_0a(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=(r2?(r3&65535)>>>8:r3)&255|_e86_get_ea8(r1)&255;r3=HEAP16[r4>>1];if(r2){r6=r5<<8|r3&255}else{r6=r5|r3&-256}HEAP16[r4>>1]=r6;_e86_set_flg_log_8(r1,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_0b(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1)|r3;HEAP16[r2>>1]=r4;_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_0c(r1){var r2,r3;r2=r1+4|0;r3=HEAPU8[r1+129|0]|HEAP16[r2>>1];HEAP16[r2>>1]=r3;_e86_set_flg_log_8(r1,r3&255);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 2}function _op_0d(r1){var r2,r3;r2=r1+4|0;r3=HEAPU8[r1+129|0]|HEAP16[r2>>1]|HEAPU8[r1+130|0]<<8;HEAP16[r2>>1]=r3;_e86_set_flg_log_16(r1,r3);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 3}function _op_0e(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+22>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_0f(r1){var r2,r3,r4,r5,r6;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+22|0;HEAP16[r6>>1]=r5;_e86_pq_init(r1);return 1}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+22|0;HEAP16[r6>>1]=r5;_e86_pq_init(r1);return 1}}function _op_10(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;r2=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,(r2+(r3&255)&65535)+r5&255);_e86_set_flg_adc_8(r1,r3,r5&255,r2&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_11(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];r2=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r4+r3&65535)+r2&65535);_e86_set_flg_adc_16(r1,r3,r4,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_12(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=HEAP16[r1+30>>1]&1;r7=(r5+(r3&255)&65535)+r6&65535;r8=HEAP16[r4>>1];if(r2){r9=r7<<8|r8&255}else{r9=r7&255|r8&-256}HEAP16[r4>>1]=r9;_e86_set_flg_adc_8(r1,r5&255,r3,r6&255);r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_13(r1){var r2,r3,r4,r5;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r4+r3&65535)+r5;_e86_set_flg_adc_16(r1,r3,r4,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_14(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=((r4&255)+r3&65535)+r5&255|r3&-256;_e86_set_flg_adc_8(r1,r3&255,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 2}function _op_15(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=r4+(r3&65535)+(r5&65535);_e86_set_flg_adc_16(r1,r3,r4&65535,r5);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 3}function _op_16(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+24>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=((r2&65535)<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_17(r1){var r2,r3,r4,r5,r6;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=r1+24|0;r4=(HEAPU16[r2>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r4+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r5=HEAP32[r1+72>>2];r6=HEAPU8[r5+r3|0]<<8|HEAPU8[r5+r4|0]}else{r6=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r4)}HEAP16[r2>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+8;HEAP8[r1+157|0]=0;return 1}function _op_18(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;r2=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,((r3&255)-r2&65535)-r5&255);_e86_set_flg_sbb_8(r1,r3,r5&255,r2&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_19(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];r2=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r3-r4&65535)-r2&65535);_e86_set_flg_sbb_16(r1,r3,r4,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_1a(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=HEAP16[r1+30>>1]&1;r7=(r5-(r3&255)&65535)-r6&65535;r8=HEAP16[r4>>1];if(r2){r9=r7<<8|r8&255}else{r9=r7&255|r8&-256}HEAP16[r4>>1]=r9;_e86_set_flg_sbb_8(r1,r5&255,r3,r6&255);r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_1b(r1){var r2,r3,r4,r5;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r3-r4&65535)-r5;_e86_set_flg_sbb_16(r1,r3,r4,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_1c(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r3-(r4&255)&65535)-r5&255|r3&-256;_e86_set_flg_sbb_8(r1,r3&255,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 2}function _op_1d(r1){var r2,r3,r4,r5;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r5=HEAP16[r1+30>>1]&1;HEAP16[r2>>1]=(r3&65535)-r4-(r5&65535);_e86_set_flg_sbb_16(r1,r3,r4&65535,r5);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+4;return 3}function _op_1e(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+26>>1];r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 1}}function _op_1f(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+26|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+26|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+8|0;HEAP32[r7>>2]=r9;return 1}}function _op_20(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=((r4&4|0)!=0?(r2&65535)>>>8:r2)&(r3&255)&255;_e86_set_ea8(r1,r5);_e86_set_flg_log_8(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_21(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]&r3;_e86_set_ea16(r1,r4);_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_22(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=(r2?(r3&65535)>>>8:r3)&(_e86_get_ea8(r1)&255);r3=HEAP16[r4>>1];if(r2){r6=r5<<8|r3&255}else{r6=r5|r3&-256}HEAP16[r4>>1]=r6;_e86_set_flg_log_8(r1,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_23(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1)&r3;HEAP16[r2>>1]=r4;_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_24(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+129|0]&r3;HEAP16[r2>>1]=r4|r3&-256;_e86_set_flg_log_8(r1,r4&255);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_25(r1){var r2,r3;r2=r1+4|0;r3=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&HEAP16[r2>>1];HEAP16[r2>>1]=r3;_e86_set_flg_log_16(r1,r3);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 3}function _op_26(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+20>>1];return 1}function _op_27(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=0;r3=r1+4|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5&255;r7=r1+30|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r9&1;do{if((r5&14)>>>0>9){r2=3}else{if((r9&16|0)!=0){r2=3;break}r11=r6;r12=r10;r13=r8&-17}}while(0);if(r2==3){r2=r6+6|0;r11=r2;r12=(r2&65280|0)!=0|r10;r13=r8|16}HEAP16[r7>>1]=r13;if((r11&240)>>>0<145&(r12|0)==0){r14=r11;r15=r13&-2}else{r14=r11+96|0;r15=r13|1}HEAP16[r7>>1]=r15;HEAP16[r3>>1]=r4&-256&65535|r14&255;_e86_set_flg_szp_8(r1,r14&255);r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+4;return 1}function _op_28(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(r4&4|0)!=0?(r2&65535)>>>8:r2;_e86_set_ea8(r1,(r3&255)-r5&255);_e86_set_flg_sub_8(r1,r3,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_29(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];_e86_set_ea16(r1,r3-r4&65535);_e86_set_flg_sub_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_2a(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=r2?(r3&65535)>>>8:r3;r3=_e86_get_ea8(r1);r6=r5-(r3&255)&65535;r7=HEAP16[r4>>1];if(r2){r8=r6<<8|r7&255}else{r8=r6&255|r7&-256}HEAP16[r4>>1]=r8;_e86_set_flg_sub_8(r1,r5&255,r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_2b(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1);HEAP16[r2>>1]=r3-r4;_e86_set_flg_sub_16(r1,r3,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_2c(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAP8[r1+129|0];HEAP16[r2>>1]=r3-(r4&255)&255|r3&-256;_e86_set_flg_sub_8(r1,r3&255,r4);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_2d(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r2>>1]=(r3&65535)-r4;_e86_set_flg_sub_16(r1,r3,r4&65535);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 3}function _op_2e(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+22>>1];return 1}function _op_2f(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=0;r3=r1+4|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5&255;r7=r1+30|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r9&1;do{if((r5&14)>>>0>9){r2=3}else{if((r9&16|0)!=0){r2=3;break}r11=r6;r12=r10;r13=r8&-17}}while(0);if(r2==3){r2=r6-6|0;r11=r2;r12=(r2&65280|0)!=0|r10;r13=r8|16}HEAP16[r7>>1]=r13;if((r11&240)>>>0<145&(r12|0)==0){r14=r11;r15=r13&-2}else{r14=r11-96|0;r15=r13|1}HEAP16[r7>>1]=r15;HEAP16[r3>>1]=r4&-256&65535|r14&255;_e86_set_flg_szp_8(r1,r14&255);r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+4;return 1}function _op_30(r1){var r2,r3,r4,r5;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];r5=(((r4&4|0)!=0?(r2&65535)>>>8:r2)^r3&255)&255;_e86_set_ea8(r1,r5);_e86_set_flg_log_8(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_31(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);r4=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]^r3;_e86_set_ea16(r1,r4);_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_32(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=(r3&4|0)!=0;r4=r1+4+((r3&3)<<1)|0;r3=HEAP16[r4>>1];r5=(r2?(r3&65535)>>>8:r3)&255^_e86_get_ea8(r1)&255;r3=HEAP16[r4>>1];if(r2){r6=r5<<8|r3&255}else{r6=r5|r3&-256}HEAP16[r4>>1]=r6;_e86_set_flg_log_8(r1,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_33(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=r1+4+(r3<<1)|0;r3=HEAP16[r2>>1];r4=_e86_get_ea16(r1)^r3;HEAP16[r2>>1]=r4;_e86_set_flg_log_16(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r4>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_34(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=HEAPU8[r1+129|0]^r3&255;HEAP16[r2>>1]=r4|r3&-256;_e86_set_flg_log_8(r1,r4&255);r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+4;return 2}function _op_35(r1){var r2,r3;r2=r1+4|0;r3=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])^HEAP16[r2>>1];HEAP16[r2>>1]=r3;_e86_set_flg_log_16(r1,r3);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;return 3}function _op_36(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+24>>1];return 1}function _op_37(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=r1+4|0;r4=HEAPU16[r3>>1];r5=r4&255;r6=r4>>>8;r7=r1+30|0;r8=HEAP16[r7>>1];do{if((r4&14)>>>0>9){r2=3}else{if((r8&16)!=0){r2=3;break}HEAP16[r7>>1]=r8&-18;r9=r5;r10=r6}}while(0);if(r2==3){HEAP16[r1+30>>1]=r8|17;r9=r5+6|0;r10=r6+1|0}HEAP16[r3>>1]=r9&15|r10<<8;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;return 1}function _op_38(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];_e86_set_flg_sub_8(r1,r3,((r4&4|0)!=0?(r2&65535)>>>8:r2)&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_39(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);_e86_set_flg_sub_16(r1,r3,HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_3a(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r3&3)<<1)>>1];_e86_set_flg_sub_8(r1,((r3&4|0)!=0?(r2&65535)>>>8:r2)&255,_e86_get_ea8(r1));r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_3b(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1];_e86_set_flg_sub_16(r1,r3,_e86_get_ea16(r1));r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_3c(r1){var r2;_e86_set_flg_sub_8(r1,HEAP16[r1+4>>1]&255,HEAP8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_3d(r1){var r2;_e86_set_flg_sub_16(r1,HEAP16[r1+4>>1],HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_3e(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|3;HEAP16[r1+148>>1]=HEAP16[r1+26>>1];return 1}function _op_3f(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=r1+4|0;r4=HEAPU16[r3>>1];r5=r4&255;r6=r4>>>8;r7=r1+30|0;r8=HEAP16[r7>>1];do{if((r4&14)>>>0>9){r2=3}else{if((r8&16)!=0){r2=3;break}HEAP16[r7>>1]=r8&-18;r9=r5;r10=r6}}while(0);if(r2==3){HEAP16[r1+30>>1]=r8|17;r9=r5-6|0;r10=r6-1|0}HEAP16[r3>>1]=r9&15|r10<<8;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+8;return 1}function _op_40(r1){var r2,r3,r4;r2=r1+4+((HEAP8[r1+128|0]&7)<<1)|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+1;r2=r1+30|0;r4=HEAP16[r2>>1];_e86_set_flg_add_16(r1,r3,1);r3=HEAP16[r2>>1];HEAP16[r2>>1]=(r3^r4)&1^r3;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+3;return 1}function _op_48(r1){var r2,r3,r4;r2=r1+4+((HEAP8[r1+128|0]&7)<<1)|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3-1;r2=r1+30|0;r4=HEAP16[r2>>1];_e86_set_flg_sub_16(r1,r3,1);r3=HEAP16[r2>>1];HEAP16[r2>>1]=(r3^r4)&1^r3;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+3;return 1}function _op_50(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=HEAP8[r1+128|0]&7;do{if((r2|0)==4){if((HEAP32[r1>>2]&4|0)!=0){break}r3=r1+12|0;r4=HEAP16[r3>>1]-2&65535;HEAP16[r3>>1]=r4;r3=(HEAPU16[r1+24>>1]<<4)+(r4&65535)&HEAP32[r1+80>>2];r5=r3+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r6=r1+72|0;HEAP8[HEAP32[r6>>2]+r3|0]=r4;HEAP8[HEAP32[r6>>2]+r5|0]=(r4&65535)>>>8;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r4);r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}}}while(0);r4=HEAP16[r1+4+(r2<<1)>>1];r2=r1+12|0;r3=HEAP16[r2>>1]-2&65535;HEAP16[r2>>1]=r3;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r2|0]=r4;HEAP8[HEAP32[r5>>2]+r3|0]=(r4&65535)>>>8;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r2,r4);r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 1}}function _op_58(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}HEAP16[r1+4+((HEAP8[r1+128|0]&7)<<1)>>1]=r5;r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;return 1}function _op_ud(r1){var r2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;return _e86_undefined(r1)}function _op_66(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;if((HEAP8[r1+129|0]|0)!=102){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;r3=_e86_undefined(r1);return r3}r2=r1+22|0;r4=r1+28|0;r5=HEAP16[r4>>1];r6=HEAP32[r1+96>>2];if((r6|0)==0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+16;r8=HEAP16[r4>>1];r9=r8<<16>>16==r5<<16>>16;r10=r9?4:0;return r10}r7=HEAP16[r2>>1];FUNCTION_TABLE[r6](HEAP32[r1+92>>2],HEAP8[r1+130|0],HEAP8[r1+131|0]);r6=HEAP16[r2>>1];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;if(r6<<16>>16==r7<<16>>16){r8=HEAP16[r4>>1];r9=r8<<16>>16==r5<<16>>16;r10=r9?4:0;return r10}else{r3=0;return r3}}function _op_70(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&2048)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_71(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&2048)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_72(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&1)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_73(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&1)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_74(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&64)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_75(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&64)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_76(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&65)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_77(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&65)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_78(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&128)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_79(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&128)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_7a(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&4)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_7b(r1){var r2,r3,r4;if((HEAP16[r1+30>>1]&4)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_7c(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];if(((r2>>>7^r2>>>11)&1|0)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=2;return r3}else{r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r3=0;return r3}}function _op_7d(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];if(((r2>>>7^r2>>>11)&1|0)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r4=2;return r4}}function _op_7e(r1){var r2,r3,r4;r2=HEAPU16[r1+30>>1];do{if(((r2>>>7^r2>>>11)&1|0)==0){if((r2&64|0)!=0){break}r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+4;r4=2;return r4}}while(0);r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+16;r4=0;return r4}function _op_7f(r1){var r2,r3,r4,r5;r2=HEAPU16[r1+30>>1];do{if(((r2>>>7^r2>>>11)&1|0)==0){if((r2&64|0)!=0){break}r3=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r3&128|0)!=0?r3|65280:r3);_e86_pq_init(r1);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+16;r5=0;return r5}}while(0);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r5=2;return r5}function _op_80(r1){return FUNCTION_TABLE[HEAP32[5832+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_81(r1){return FUNCTION_TABLE[HEAP32[5800+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_83(r1){return FUNCTION_TABLE[HEAP32[5768+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_84(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea8(r1);r4=HEAPU8[r2]>>>3;r2=HEAP16[r1+4+((r4&3)<<1)>>1];_e86_set_flg_log_8(r1,((r4&4|0)!=0?(r2&65535)>>>8:r2)&255&r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_85(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=_e86_get_ea16(r1);_e86_set_flg_log_16(r1,HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]&r3);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:3)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_86(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;r3=HEAPU8[r2]>>>3;_e86_get_ea_ptr(r1,r2);r2=_e86_get_ea8(r1);r4=(r3&4|0)!=0;r5=r1+4+((r3&3)<<1)|0;r3=HEAP16[r5>>1];_e86_set_ea8(r1,(r4?(r3&65535)>>>8:r3)&255);r3=HEAP16[r5>>1];if(r4){r6=r3&255|(r2&255)<<8}else{r6=r3&-256|r2&255}HEAP16[r5>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_87(r1){var r2,r3,r4;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;_e86_get_ea_ptr(r1,r2);r2=_e86_get_ea16(r1);r4=r1+4+(r3<<1)|0;_e86_set_ea16(r1,HEAP16[r4>>1]);HEAP16[r4>>1]=r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_88(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3;r2=HEAPU16[r1+4+((r3&3)<<1)>>1];_e86_set_ea8(r1,((r3&4|0)!=0?r2>>>8:r2)&255);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:2)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_89(r1){var r2;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);_e86_set_ea16(r1,HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:2)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8a(r1){var r2,r3,r4,r5,r6;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3;r2=_e86_get_ea8(r1);r4=r1+4+((r3&3)<<1)|0;r5=HEAP16[r4>>1];if((r3&4|0)==0){r6=r5&-256|r2&255}else{r6=r5&255|(r2&255)<<8}HEAP16[r4>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?8:2)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8b(r1){var r2,r3;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);r3=HEAPU8[r2]>>>3&7;HEAP16[r1+4+(r3<<1)>>1]=_e86_get_ea16(r1);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?8:2)+HEAP32[r3>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8c(r1){var r2;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);_e86_set_ea16(r1,HEAP16[r1+20+((HEAPU8[r2]>>>3&3)<<1)>>1]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?9:2)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_8d(r1){var r2,r3,r4;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);do{if((HEAP32[r1+1184>>2]|0)==0){if((_e86_undefined(r1)|0)==0){r3=0}else{break}return r3}else{HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=HEAP16[r1+1194>>1];r4=r1+1200|0;HEAP32[r4>>2]=HEAP32[r4>>2]+2}}while(0);r3=HEAPU16[r1+1196>>1]+1|0;return r3}function _op_8e(r1){var r2,r3;r2=r1+129|0;r3=HEAPU8[r2]>>>3&3;_e86_get_ea_ptr(r1,r2);HEAP16[r1+20+(r3<<1)>>1]=_e86_get_ea16(r1);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?8:2)+HEAP32[r2>>2];if((r3|0)==2){HEAP8[r1+157|0]=0}else if((r3|0)==1){_e86_pq_init(r1)}return HEAPU16[r1+1196>>1]+1|0}function _op_8f(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}_e86_set_ea16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:8)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_90(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=r1+4+((HEAP8[r1+128|0]&7)<<1)|0;HEAP16[r2>>1]=HEAP16[r4>>1];HEAP16[r4>>1]=r3;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+3;return 1}function _op_98(r1){var r2,r3;r2=r1+4|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&128)!=0?r3|-256:r3&255;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+2;return 1}function _op_99(r1){var r2;HEAP16[r1+8>>1]=HEAP16[r1+4>>1]>>15;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+5;return 1}function _op_9a(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=r1+22|0;r3=HEAP16[r2>>1];r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r6=r1+24|0;r7=r1+80|0;r8=(HEAPU16[r6>>1]<<4)+(r5&65535)&HEAP32[r7>>2];r5=r8+1|0;r9=r1+76|0;if(r5>>>0<HEAP32[r9>>2]>>>0){r10=r1+72|0;HEAP8[HEAP32[r10>>2]+r8|0]=r3;HEAP8[HEAP32[r10>>2]+r5|0]=(r3&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r8,r3)}r3=r1+28|0;r8=HEAP16[r3>>1]+5&65535;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r6>>1]<<4)+(r5&65535)&HEAP32[r7>>2];r7=r4+1|0;if(r7>>>0<HEAP32[r9>>2]>>>0){r9=r1+72|0;HEAP8[HEAP32[r9>>2]+r4|0]=r8;HEAP8[HEAP32[r9>>2]+r7|0]=(r8&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r8)}HEAP16[r3>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r2>>1]=HEAPU8[r1+132|0]<<8|HEAPU8[r1+131|0];_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+28;return 0}function _op_9b(r1){var r2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 1}function _op_9c(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=HEAP16[r1+30>>1]&4053;if((HEAP32[r1>>2]&32|0)==0){r3=r2|61442;r4=r3&65535;r5=r1+12|0;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r5=(HEAPU16[r1+24>>1]<<4)+(r6&65535)&HEAP32[r1+80>>2];r6=r5+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r5|0]=r3;HEAP8[HEAP32[r7>>2]+r6|0]=(r4&65535)>>>8;r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r5,r4);r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}}else{r4=r2&65535;r5=r1+12|0;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r5=(HEAPU16[r1+24>>1]<<4)+(r6&65535)&HEAP32[r1+80>>2];r6=r5+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r5|0]=r2;HEAP8[HEAP32[r7>>2]+r6|0]=(r4&65535)>>>8;r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r5,r4);r8=r1+1200|0;r9=HEAP32[r8>>2];r10=r9+10|0;HEAP32[r8>>2]=r10;return 1}}}function _op_9d(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}HEAP16[r1+30>>1]=r5&4053|-4094;r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+8;return 1}function _op_9e(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-256|HEAPU16[r1+4>>1]>>>8&213|2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 1}function _op_9f(r1){var r2;r2=r1+4|0;HEAP16[r2>>1]=((HEAP16[r1+30>>1]&255&-43|2)&255)<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 1}function _op_a0(r1){var r2,r3;r2=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];if(r2>>>0<HEAP32[r1+76>>2]>>>0){r3=HEAP8[HEAP32[r1+72>>2]+r2|0]}else{r3=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r2)}r2=r1+4|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-256|r3&255;r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+10;return 3}function _op_a1(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0];r6=r1+4|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 3}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r6=r1+4|0;HEAP16[r6>>1]=r5;r7=r1+1200|0;r8=HEAP32[r7>>2];r9=r8+10|0;HEAP32[r7>>2]=r9;return 3}}function _op_a2(r1){var r2,r3,r4,r5,r6;r2=HEAP16[r1+4>>1]&255;r3=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];if(r3>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r3|0]=r2;r4=r1+1200|0;r5=HEAP32[r4>>2];r6=r5+10|0;HEAP32[r4>>2]=r6;return 3}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r3,r2);r4=r1+1200|0;r5=HEAP32[r4>>2];r6=r5+10|0;HEAP32[r4>>2]=r6;return 3}}function _op_a3(r1){var r2,r3,r4,r5,r6,r7,r8;r2=HEAP16[r1+4>>1];r3=((HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];r4=r3+1|0;if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=r1+72|0;HEAP8[HEAP32[r5>>2]+r3|0]=r2;HEAP8[HEAP32[r5>>2]+r4|0]=(r2&65535)>>>8;r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 3}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r3,r2);r6=r1+1200|0;r7=HEAP32[r6>>2];r8=r7+10|0;HEAP32[r6>>2]=r8;return 3}}function _op_a4(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((r3&12|0)==0){r7=r1+16|0;r8=r1+80|0;r9=HEAP32[r8>>2];r10=HEAPU16[r7>>1]+((r4&65535)<<4)&r9;r11=r1+76|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){r13=HEAP8[HEAP32[r1+72>>2]+r10|0];r14=r9;r15=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r10);r13=r12;r14=HEAP32[r8>>2];r15=HEAP32[r11>>2]}r11=r1+18|0;r8=HEAPU16[r11>>1]+((r5&65535)<<4)&r14;if(r8>>>0<r15>>>0){HEAP8[HEAP32[r1+72>>2]+r8|0]=r13}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r8,r13)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r11>>1]=HEAP16[r11>>1]+r6;r11=r1+1200|0;HEAP32[r11>>2]=HEAP32[r11>>2]+18;r16=1;return r16}r11=r1+6|0;do{if((HEAP16[r11>>1]|0)==0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+18;r17=r3}else{r7=r1+16|0;r13=r1+80|0;r8=HEAP32[r13>>2];r15=HEAPU16[r7>>1]+((r4&65535)<<4)&r8;r14=r1+76|0;r12=HEAP32[r14>>2];if(r15>>>0<r12>>>0){r18=HEAP8[HEAP32[r1+72>>2]+r15|0];r19=r8;r20=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r15);r18=r12;r19=HEAP32[r13>>2];r20=HEAP32[r14>>2]}r14=r1+18|0;r13=HEAPU16[r14>>1]+((r5&65535)<<4)&r19;if(r13>>>0<r20>>>0){HEAP8[HEAP32[r1+72>>2]+r13|0]=r18}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r13,r18)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r14>>1]=HEAP16[r14>>1]+r6;r14=HEAP16[r11>>1]-1&65535;HEAP16[r11>>1]=r14;r7=HEAP32[r2>>2];r13=r1+1200|0;HEAP32[r13>>2]=HEAP32[r13>>2]+18;if(r14<<16>>16==0){r17=r7;break}HEAP32[r2>>2]=r7|32;r16=0;return r16}}while(0);HEAP32[r2>>2]=r17&-33;r16=1;return r16}function _op_a5(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((r3&12|0)==0){r7=r1+16|0;r8=r1+80|0;r9=HEAP32[r8>>2];r10=HEAPU16[r7>>1]+((r4&65535)<<4)&r9;r11=r10+1|0;r12=r1+76|0;r13=HEAP32[r12>>2];if(r11>>>0<r13>>>0){r14=HEAP32[r1+72>>2];r15=HEAPU8[r14+r11|0]<<8|HEAPU8[r14+r10|0];r16=r9;r17=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r10);r15=r13;r16=HEAP32[r8>>2];r17=HEAP32[r12>>2]}r12=r1+18|0;r8=HEAPU16[r12>>1]+((r5&65535)<<4)&r16;r16=r8+1|0;if(r16>>>0<r17>>>0){r17=r1+72|0;HEAP8[HEAP32[r17>>2]+r8|0]=r15;HEAP8[HEAP32[r17>>2]+r16|0]=(r15&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r8,r15)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r12>>1]=HEAP16[r12>>1]+r6;r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+18;r18=1;return r18}r12=r1+6|0;do{if((HEAP16[r12>>1]|0)==0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+18;r19=r3}else{r7=r1+16|0;r15=r1+80|0;r8=HEAP32[r15>>2];r16=HEAPU16[r7>>1]+((r4&65535)<<4)&r8;r17=r16+1|0;r13=r1+76|0;r10=HEAP32[r13>>2];if(r17>>>0<r10>>>0){r9=HEAP32[r1+72>>2];r20=HEAPU8[r9+r17|0]<<8|HEAPU8[r9+r16|0];r21=r8;r22=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r16);r20=r10;r21=HEAP32[r15>>2];r22=HEAP32[r13>>2]}r13=r1+18|0;r15=HEAPU16[r13>>1]+((r5&65535)<<4)&r21;r10=r15+1|0;if(r10>>>0<r22>>>0){r16=r1+72|0;HEAP8[HEAP32[r16>>2]+r15|0]=r20;HEAP8[HEAP32[r16>>2]+r10|0]=(r20&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r15,r20)}HEAP16[r7>>1]=HEAP16[r7>>1]+r6;HEAP16[r13>>1]=HEAP16[r13>>1]+r6;r13=HEAP16[r12>>1]-1&65535;HEAP16[r12>>1]=r13;r7=HEAP32[r2>>2];r15=r1+1200|0;HEAP32[r15>>2]=HEAP32[r15>>2]+18;if(r13<<16>>16==0){r19=r7;break}HEAP32[r2>>2]=r7|32;r18=0;return r18}}while(0);HEAP32[r2>>2]=r19&-33;r18=1;return r18}function _op_a6(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=r1+30|0;r7=(HEAPU16[r6>>1]>>>9&2^2)-1&65535;if((r3&12|0)==0){r8=r1+16|0;r9=r1+80|0;r10=HEAP32[r9>>2];r11=HEAPU16[r8>>1]+((r4&65535)<<4)&r10;r12=r1+76|0;r13=HEAP32[r12>>2];if(r11>>>0<r13>>>0){r14=HEAP8[HEAP32[r1+72>>2]+r11|0];r15=r10;r16=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r11);r14=r13;r15=HEAP32[r9>>2];r16=HEAP32[r12>>2]}r12=r1+18|0;r9=HEAP16[r12>>1];r13=(r9&65535)+((r5&65535)<<4)&r15;if(r13>>>0<r16>>>0){r17=HEAP8[HEAP32[r1+72>>2]+r13|0];r18=r9}else{r9=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r13);r17=r9;r18=HEAP16[r12>>1]}HEAP16[r8>>1]=HEAP16[r8>>1]+r7;HEAP16[r12>>1]=r18+r7;_e86_set_flg_sub_8(r1,r14,r17);r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+22;r19=1;return r19}r17=r1+6|0;do{if((HEAP16[r17>>1]|0)==0){r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+22;r20=r3}else{r14=r1+16|0;r18=r1+80|0;r12=HEAP32[r18>>2];r8=HEAPU16[r14>>1]+((r4&65535)<<4)&r12;r9=r1+76|0;r13=HEAP32[r9>>2];if(r8>>>0<r13>>>0){r21=HEAP8[HEAP32[r1+72>>2]+r8|0];r22=r12;r23=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8);r21=r13;r22=HEAP32[r18>>2];r23=HEAP32[r9>>2]}r9=r1+18|0;r18=HEAP16[r9>>1];r13=(r18&65535)+((r5&65535)<<4)&r22;if(r13>>>0<r23>>>0){r24=HEAP8[HEAP32[r1+72>>2]+r13|0];r25=r18}else{r18=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r13);r24=r18;r25=HEAP16[r9>>1]}HEAP16[r14>>1]=HEAP16[r14>>1]+r7;HEAP16[r9>>1]=r25+r7;HEAP16[r17>>1]=HEAP16[r17>>1]-1;_e86_set_flg_sub_8(r1,r21,r24);r9=HEAP32[r2>>2];r14=(HEAP16[r17>>1]|0)==0;r18=r1+1200|0;HEAP32[r18>>2]=HEAP32[r18>>2]+22;if(r14){r20=r9;break}if((HEAPU16[r6>>1]>>>6&1|0)!=(r9>>>2&1|0)){r20=r9;break}HEAP32[r2>>2]=r9|32;r19=0;return r19}}while(0);HEAP32[r2>>2]=r20&-33;r19=1;return r19}function _op_a7(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=HEAP16[r1+20>>1];r6=r1+30|0;r7=(HEAPU16[r6>>1]>>>8&4^4)-2&65535;if((r3&12|0)==0){r8=r1+16|0;r9=r1+80|0;r10=HEAP32[r9>>2];r11=HEAPU16[r8>>1]+((r4&65535)<<4)&r10;r12=r11+1|0;r13=r1+76|0;r14=HEAP32[r13>>2];if(r12>>>0<r14>>>0){r15=HEAP32[r1+72>>2];r16=HEAPU8[r15+r12|0]<<8|HEAPU8[r15+r11|0];r17=r10;r18=r14}else{r14=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r16=r14;r17=HEAP32[r9>>2];r18=HEAP32[r13>>2]}r13=r1+18|0;r9=HEAP16[r13>>1];r14=(r9&65535)+((r5&65535)<<4)&r17;r17=r14+1|0;if(r17>>>0<r18>>>0){r18=HEAP32[r1+72>>2];r19=HEAPU8[r18+r17|0]<<8|HEAPU8[r18+r14|0];r20=r9}else{r9=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14);r19=r9;r20=HEAP16[r13>>1]}HEAP16[r8>>1]=HEAP16[r8>>1]+r7;HEAP16[r13>>1]=r20+r7;_e86_set_flg_sub_16(r1,r16,r19);r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+22;r21=1;return r21}r19=r1+6|0;do{if((HEAP16[r19>>1]|0)==0){r16=r1+1200|0;HEAP32[r16>>2]=HEAP32[r16>>2]+22;r22=r3}else{r16=r1+16|0;r20=r1+80|0;r13=HEAP32[r20>>2];r8=HEAPU16[r16>>1]+((r4&65535)<<4)&r13;r9=r8+1|0;r14=r1+76|0;r18=HEAP32[r14>>2];if(r9>>>0<r18>>>0){r17=HEAP32[r1+72>>2];r23=HEAPU8[r17+r9|0]<<8|HEAPU8[r17+r8|0];r24=r13;r25=r18}else{r18=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8);r23=r18;r24=HEAP32[r20>>2];r25=HEAP32[r14>>2]}r14=r1+18|0;r20=HEAP16[r14>>1];r18=(r20&65535)+((r5&65535)<<4)&r24;r8=r18+1|0;if(r8>>>0<r25>>>0){r13=HEAP32[r1+72>>2];r26=HEAPU8[r13+r8|0]<<8|HEAPU8[r13+r18|0];r27=r20}else{r20=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r18);r26=r20;r27=HEAP16[r14>>1]}HEAP16[r16>>1]=HEAP16[r16>>1]+r7;HEAP16[r14>>1]=r27+r7;HEAP16[r19>>1]=HEAP16[r19>>1]-1;_e86_set_flg_sub_16(r1,r23,r26);r14=HEAP32[r2>>2];r16=(HEAP16[r19>>1]|0)==0;r20=r1+1200|0;HEAP32[r20>>2]=HEAP32[r20>>2]+22;if(r16){r22=r14;break}if((HEAPU16[r6>>1]>>>6&1|0)!=(r14>>>2&1|0)){r22=r14;break}HEAP32[r2>>2]=r14|32;r21=0;return r21}}while(0);HEAP32[r2>>2]=r22&-33;r21=1;return r21}function _op_a8(r1){var r2;_e86_set_flg_log_8(r1,HEAP16[r1+4>>1]&255&HEAP8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_a9(r1){var r2;_e86_set_flg_log_16(r1,(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])&HEAP16[r1+4>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_aa(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=HEAP16[r1+20>>1];r3=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;r4=r1+144|0;r5=HEAP32[r4>>2];if((r5&12|0)==0){r6=r1+18|0;r7=HEAP16[r1+4>>1]&255;r8=HEAP32[r1+80>>2]&HEAPU16[r6>>1]+((r2&65535)<<4);if(r8>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r8|0]=r7}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r8,r7)}HEAP16[r6>>1]=HEAP16[r6>>1]+r3;r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+11;r9=1;return r9}r6=r1+6|0;do{if((HEAP16[r6>>1]|0)==0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+11;r10=r5}else{r7=r1+18|0;r8=HEAP16[r1+4>>1]&255;r11=HEAP32[r1+80>>2]&HEAPU16[r7>>1]+((r2&65535)<<4);if(r11>>>0<HEAP32[r1+76>>2]>>>0){HEAP8[HEAP32[r1+72>>2]+r11|0]=r8}else{FUNCTION_TABLE[HEAP32[r1+40>>2]](HEAP32[r1+32>>2],r11,r8)}HEAP16[r7>>1]=HEAP16[r7>>1]+r3;r7=HEAP16[r6>>1]-1&65535;HEAP16[r6>>1]=r7;r8=HEAP32[r4>>2];r11=r1+1200|0;HEAP32[r11>>2]=HEAP32[r11>>2]+11;if(r7<<16>>16==0){r10=r8;break}HEAP32[r4>>2]=r8|32;r9=0;return r9}}while(0);HEAP32[r4>>2]=r10&-33;r9=1;return r9}function _op_ab(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=HEAP16[r1+20>>1];r3=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;r4=r1+144|0;r5=HEAP32[r4>>2];if((r5&12|0)==0){r6=r1+18|0;r7=HEAP16[r1+4>>1];r8=HEAP32[r1+80>>2]&HEAPU16[r6>>1]+((r2&65535)<<4);r9=r8+1|0;if(r9>>>0<HEAP32[r1+76>>2]>>>0){r10=r1+72|0;HEAP8[HEAP32[r10>>2]+r8|0]=r7;HEAP8[HEAP32[r10>>2]+r9|0]=(r7&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r8,r7)}HEAP16[r6>>1]=HEAP16[r6>>1]+r3;r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+11;r11=1;return r11}r6=r1+6|0;do{if((HEAP16[r6>>1]|0)==0){r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+11;r12=r5}else{r7=r1+18|0;r8=HEAP16[r1+4>>1];r9=HEAP32[r1+80>>2]&HEAPU16[r7>>1]+((r2&65535)<<4);r10=r9+1|0;if(r10>>>0<HEAP32[r1+76>>2]>>>0){r13=r1+72|0;HEAP8[HEAP32[r13>>2]+r9|0]=r8;HEAP8[HEAP32[r13>>2]+r10|0]=(r8&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r9,r8)}HEAP16[r7>>1]=HEAP16[r7>>1]+r3;r7=HEAP16[r6>>1]-1&65535;HEAP16[r6>>1]=r7;r8=HEAP32[r4>>2];r9=r1+1200|0;HEAP32[r9>>2]=HEAP32[r9>>2]+11;if(r7<<16>>16==0){r12=r8;break}HEAP32[r4>>2]=r8|32;r11=0;return r11}}while(0);HEAP32[r4>>2]=r12&-33;r11=1;return r11}function _op_ac(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=(HEAPU16[r1+30>>1]>>>9&2^2)-1&65535;if((r3&12|0)==0){r6=r1+16|0;r7=HEAP16[r6>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];if(r8>>>0<HEAP32[r1+76>>2]>>>0){r9=HEAP8[HEAP32[r1+72>>2]+r8|0];r10=r7}else{r7=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8);r9=r7;r10=HEAP16[r6>>1]}r7=r1+4|0;HEAP16[r7>>1]=HEAP16[r7>>1]&-256|r9&255;HEAP16[r6>>1]=r10+r5;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+12;r11=1;return r11}r10=r1+6|0;r6=HEAP16[r10>>1];do{if(r6<<16>>16==0){r9=r1+1200|0;HEAP32[r9>>2]=HEAP32[r9>>2]+12;r12=r3}else{r9=r1+16|0;r7=HEAP16[r9>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];if(r8>>>0<HEAP32[r1+76>>2]>>>0){r13=HEAP8[HEAP32[r1+72>>2]+r8|0];r14=r7;r15=r6;r16=r3}else{r7=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r8);r13=r7;r14=HEAP16[r9>>1];r15=HEAP16[r10>>1];r16=HEAP32[r2>>2]}r7=r1+4|0;HEAP16[r7>>1]=HEAP16[r7>>1]&-256|r13&255;HEAP16[r9>>1]=r14+r5;r9=r15-1&65535;HEAP16[r10>>1]=r9;r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+12;if(r9<<16>>16==0){r12=r16;break}HEAP32[r2>>2]=r16|32;r11=0;return r11}}while(0);HEAP32[r2>>2]=r12&-33;r11=1;return r11}function _op_ad(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1+144|0;r3=HEAP32[r2>>2];r4=HEAP16[((r3&2|0)==0?r1+26|0:r1+148|0)>>1];r5=(HEAPU16[r1+30>>1]>>>8&4^4)-2&65535;if((r3&12|0)==0){r6=r1+16|0;r7=HEAP16[r6>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];r9=r8+1|0;if(r9>>>0<HEAP32[r1+76>>2]>>>0){r10=HEAP32[r1+72>>2];r11=HEAPU8[r10+r9|0]<<8|HEAPU8[r10+r8|0];r12=r7}else{r7=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8);r11=r7;r12=HEAP16[r6>>1]}HEAP16[r1+4>>1]=r11;HEAP16[r6>>1]=r12+r5;r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+12;r13=1;return r13}r12=r1+6|0;r6=HEAP16[r12>>1];do{if(r6<<16>>16==0){r11=r1+1200|0;HEAP32[r11>>2]=HEAP32[r11>>2]+12;r14=r3}else{r11=r1+16|0;r7=HEAP16[r11>>1];r8=(r7&65535)+((r4&65535)<<4)&HEAP32[r1+80>>2];r10=r8+1|0;if(r10>>>0<HEAP32[r1+76>>2]>>>0){r9=HEAP32[r1+72>>2];r15=HEAPU8[r9+r10|0]<<8|HEAPU8[r9+r8|0];r16=r7;r17=r6;r18=r3}else{r7=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r8);r15=r7;r16=HEAP16[r11>>1];r17=HEAP16[r12>>1];r18=HEAP32[r2>>2]}HEAP16[r1+4>>1]=r15;HEAP16[r11>>1]=r16+r5;r11=r17-1&65535;HEAP16[r12>>1]=r11;r7=r1+1200|0;HEAP32[r7>>2]=HEAP32[r7>>2]+12;if(r11<<16>>16==0){r14=r18;break}HEAP32[r2>>2]=r18|32;r13=0;return r13}}while(0);HEAP32[r2>>2]=r14&-33;r13=1;return r13}function _op_ae(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=HEAP16[r1+20>>1];r3=r1+30|0;r4=(HEAPU16[r3>>1]>>>9&2^2)-1&65535;r5=r1+144|0;r6=HEAP32[r5>>2];r7=r1+4|0;if((r6&12|0)==0){r8=HEAP16[r7>>1];r9=r1+18|0;r10=HEAP16[r9>>1];r11=(r10&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];if(r11>>>0<HEAP32[r1+76>>2]>>>0){r12=HEAP8[HEAP32[r1+72>>2]+r11|0];r13=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r11);r12=r10;r13=HEAP16[r9>>1]}HEAP16[r9>>1]=r13+r4;_e86_set_flg_sub_8(r1,r8&255,r12);r12=r1+1200|0;HEAP32[r12>>2]=HEAP32[r12>>2]+15;r14=1;return r14}r12=r1+6|0;r8=HEAP16[r12>>1];do{if(r8<<16>>16==0){r13=r1+1200|0;HEAP32[r13>>2]=HEAP32[r13>>2]+15;r15=r6}else{r13=HEAP16[r7>>1];r9=r1+18|0;r10=HEAP16[r9>>1];r11=(r10&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];if(r11>>>0<HEAP32[r1+76>>2]>>>0){r16=HEAP8[HEAP32[r1+72>>2]+r11|0];r17=r10;r18=r8}else{r10=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r11);r16=r10;r17=HEAP16[r9>>1];r18=HEAP16[r12>>1]}HEAP16[r9>>1]=r17+r4;HEAP16[r12>>1]=r18-1;_e86_set_flg_sub_8(r1,r13&255,r16);r13=HEAP32[r5>>2];r9=(HEAP16[r12>>1]|0)==0;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+15;if(r9){r15=r13;break}if((HEAPU16[r3>>1]>>>6&1|0)!=(r13>>>2&1|0)){r15=r13;break}HEAP32[r5>>2]=r13|32;r14=0;return r14}}while(0);HEAP32[r5>>2]=r15&-33;r14=1;return r14}function _op_af(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=HEAP16[r1+20>>1];r3=r1+30|0;r4=(HEAPU16[r3>>1]>>>8&4^4)-2&65535;r5=r1+144|0;r6=HEAP32[r5>>2];r7=r1+4|0;if((r6&12|0)==0){r8=HEAP16[r7>>1];r9=r1+18|0;r10=HEAP16[r9>>1];r11=(r10&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];r12=r11+1|0;if(r12>>>0<HEAP32[r1+76>>2]>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r12|0]<<8|HEAPU8[r13+r11|0];r15=r10}else{r10=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r14=r10;r15=HEAP16[r9>>1]}HEAP16[r9>>1]=r15+r4;_e86_set_flg_sub_16(r1,r8,r14);r14=r1+1200|0;HEAP32[r14>>2]=HEAP32[r14>>2]+15;r16=1;return r16}r14=r1+6|0;r8=HEAP16[r14>>1];do{if(r8<<16>>16==0){r15=r1+1200|0;HEAP32[r15>>2]=HEAP32[r15>>2]+15;r17=r6}else{r15=HEAP16[r7>>1];r9=r1+18|0;r10=HEAP16[r9>>1];r11=(r10&65535)+((r2&65535)<<4)&HEAP32[r1+80>>2];r13=r11+1|0;if(r13>>>0<HEAP32[r1+76>>2]>>>0){r12=HEAP32[r1+72>>2];r18=HEAPU8[r12+r13|0]<<8|HEAPU8[r12+r11|0];r19=r10;r20=r8}else{r10=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r18=r10;r19=HEAP16[r9>>1];r20=HEAP16[r14>>1]}HEAP16[r9>>1]=r19+r4;HEAP16[r14>>1]=r20-1;_e86_set_flg_sub_16(r1,r15,r18);r15=HEAP32[r5>>2];r9=(HEAP16[r14>>1]|0)==0;r10=r1+1200|0;HEAP32[r10>>2]=HEAP32[r10>>2]+15;if(r9){r17=r15;break}if((HEAPU16[r3>>1]>>>6&1|0)!=(r15>>>2&1|0)){r17=r15;break}HEAP32[r5>>2]=r15|32;r16=0;return r16}}while(0);HEAP32[r5>>2]=r17&-33;r16=1;return r16}function _op_b0(r1){var r2;r2=r1+4|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b1(r1){var r2;r2=r1+6|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b2(r1){var r2;r2=r1+8|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b3(r1){var r2;r2=r1+10|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]|HEAP16[r2>>1]&-256;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b4(r1){var r2;r2=r1+4|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b5(r1){var r2;r2=r1+6|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b6(r1){var r2;r2=r1+8|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b7(r1){var r2;r2=r1+10|0;HEAP16[r2>>1]=HEAPU8[r1+129|0]<<8|HEAP16[r2>>1]&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 2}function _op_b8(r1){var r2;HEAP16[r1+4>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_b9(r1){var r2;HEAP16[r1+6>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_ba(r1){var r2;HEAP16[r1+8>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bb(r1){var r2;HEAP16[r1+10>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bc(r1){var r2;HEAP16[r1+12>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bd(r1){var r2;HEAP16[r1+14>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_be(r1){var r2;HEAP16[r1+16>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_bf(r1){var r2;HEAP16[r1+18>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;return 3}function _op_c2(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r5+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r6=HEAP32[r1+72>>2];r7=HEAPU8[r6+r3|0]<<8|HEAPU8[r6+r5|0];r8=r4}else{r4=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r5);r7=r4;r8=HEAP16[r2>>1]}HEAP16[r1+28>>1]=r7;HEAP16[r2>>1]=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])+r8;_e86_pq_init(r1);r8=r1+1200|0;HEAP32[r8>>2]=HEAP32[r8>>2]+20;return 0}function _op_c3(r1){var r2,r3,r4,r5;r2=r1+12|0;r3=HEAP16[r2>>1];HEAP16[r2>>1]=r3+2;r2=(HEAPU16[r1+24>>1]<<4)+(r3&65535)&HEAP32[r1+80>>2];r3=r2+1|0;if(r3>>>0<HEAP32[r1+76>>2]>>>0){r4=HEAP32[r1+72>>2];r5=HEAPU8[r4+r3|0]<<8|HEAPU8[r4+r2|0]}else{r5=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2)}HEAP16[r1+28>>1]=r5;_e86_pq_init(r1);r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+16;return 0}function _op_c4(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);if((HEAP32[r1+1184>>2]|0)==0){r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}r7=r1+1192|0;r8=HEAP16[r7>>1];r9=r1+1194|0;r10=HEAP16[r9>>1];r11=r1+80|0;r12=HEAP32[r11>>2];r13=((r8&65535)<<4)+(r10&65535)&r12;r14=r13+1|0;r15=r1+76|0;r16=HEAP32[r15>>2];if(r14>>>0<r16>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r14|0]<<8|HEAPU8[r17+r13|0];r19=r8;r20=r10;r21=r12;r22=r16}else{r16=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r13);r18=r16;r19=HEAP16[r7>>1];r20=HEAP16[r9>>1];r21=HEAP32[r11>>2];r22=HEAP32[r15>>2]}r15=(r20+2&65535)+((r19&65535)<<4)&r21;r21=r15+1|0;if(r21>>>0<r22>>>0){r22=HEAP32[r1+72>>2];r23=HEAPU8[r22+r21|0]<<8|HEAPU8[r22+r15|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r15)}HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r18;HEAP16[r1+20>>1]=r23;r23=r1+1200|0;HEAP32[r23>>2]=HEAP32[r23>>2]+16;r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}function _op_c5(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r2=r1+129|0;_e86_get_ea_ptr(r1,r2);if((HEAP32[r1+1184>>2]|0)==0){r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}r7=r1+1192|0;r8=HEAP16[r7>>1];r9=r1+1194|0;r10=HEAP16[r9>>1];r11=r1+80|0;r12=HEAP32[r11>>2];r13=((r8&65535)<<4)+(r10&65535)&r12;r14=r13+1|0;r15=r1+76|0;r16=HEAP32[r15>>2];if(r14>>>0<r16>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r14|0]<<8|HEAPU8[r17+r13|0];r19=r8;r20=r10;r21=r12;r22=r16}else{r16=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r13);r18=r16;r19=HEAP16[r7>>1];r20=HEAP16[r9>>1];r21=HEAP32[r11>>2];r22=HEAP32[r15>>2]}r15=(r20+2&65535)+((r19&65535)<<4)&r21;r21=r15+1|0;if(r21>>>0<r22>>>0){r22=HEAP32[r1+72>>2];r23=HEAPU8[r22+r21|0]<<8|HEAPU8[r22+r15|0]}else{r23=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r15)}HEAP16[r1+4+((HEAPU8[r2]>>>3&7)<<1)>>1]=r18;HEAP16[r1+26>>1]=r23;r23=r1+1200|0;HEAP32[r23>>2]=HEAP32[r23>>2]+16;r3=r1+1196|0;r4=HEAP16[r3>>1];r5=r4&65535;r6=r5+1|0;return r6}function _op_c6(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+1196|0;_e86_set_ea8(r1,HEAP8[HEAPU16[r2>>1]+1+(r1+128)|0]);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r3>>2];return HEAPU16[r2>>1]+2|0}function _op_c7(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+1196|0;r3=HEAPU16[r2>>1];_e86_set_ea16(r1,HEAPU8[r3+2+(r1+128)|0]<<8|HEAPU8[r3+1+(r1+128)|0]);r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r3>>2];return HEAPU16[r2>>1]+3|0}function _op_ca(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=r1+24|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r6&65535)<<4)+(r3&65535)&r8;r3=r9+1|0;r10=r1+76|0;r11=HEAP32[r10>>2];if(r3>>>0<r11>>>0){r12=HEAP32[r1+72>>2];r13=HEAPU8[r12+r3|0]<<8|HEAPU8[r12+r9|0];r14=r4;r15=r6;r16=r8;r17=r11}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r13=r11;r14=HEAP16[r2>>1];r15=HEAP16[r5>>1];r16=HEAP32[r7>>2];r17=HEAP32[r10>>2]}HEAP16[r1+28>>1]=r13;r13=r14+2&65535;HEAP16[r2>>1]=r13;r10=((r15&65535)<<4)+(r14&65535)&r16;r16=r10+1|0;if(r16>>>0<r17>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r16|0]<<8|HEAPU8[r17+r10|0];r19=r13}else{r13=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r10);r18=r13;r19=HEAP16[r2>>1]}HEAP16[r1+22>>1]=r18;HEAP16[r2>>1]=(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0])+r19;_e86_pq_init(r1);r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+25;return 0}function _op_cb(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=r1+24|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r6&65535)<<4)+(r3&65535)&r8;r3=r9+1|0;r10=r1+76|0;r11=HEAP32[r10>>2];if(r3>>>0<r11>>>0){r12=HEAP32[r1+72>>2];r13=HEAPU8[r12+r3|0]<<8|HEAPU8[r12+r9|0];r14=r4;r15=r6;r16=r8;r17=r11}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r13=r11;r14=HEAP16[r2>>1];r15=HEAP16[r5>>1];r16=HEAP32[r7>>2];r17=HEAP32[r10>>2]}HEAP16[r1+28>>1]=r13;HEAP16[r2>>1]=r14+2;r2=((r15&65535)<<4)+(r14&65535)&r16;r16=r2+1|0;if(r16>>>0<r17>>>0){r17=HEAP32[r1+72>>2];r18=HEAPU8[r17+r16|0]<<8|HEAPU8[r17+r2|0];r19=r1+22|0;HEAP16[r19>>1]=r18;_e86_pq_init(r1);r20=r1+1200|0;r21=HEAP32[r20>>2];r22=r21+26|0;HEAP32[r20>>2]=r22;return 0}else{r18=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r19=r1+22|0;HEAP16[r19>>1]=r18;_e86_pq_init(r1);r20=r1+1200|0;r21=HEAP32[r20>>2];r22=r21+26|0;HEAP32[r20>>2]=r22;return 0}}function _op_cc(r1){var r2;r2=r1+28|0;HEAP16[r2>>1]=HEAP16[r2>>1]+1;_e86_trap(r1,3);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+52;return 0}function _op_cd(r1){var r2;r2=r1+28|0;HEAP16[r2>>1]=HEAP16[r2>>1]+2;_e86_trap(r1,HEAPU8[r1+129|0]);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+51;return 0}function _op_ce(r1){var r2,r3;if((HEAP16[r1+30>>1]&2048)==0){r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+4;r3=1;return r3}else{r2=r1+28|0;HEAP16[r2>>1]=HEAP16[r2>>1]+1;_e86_trap(r1,4);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+53;r3=0;return r3}}function _op_cf(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r2=r1+12|0;r3=HEAP16[r2>>1];r4=r3+2&65535;HEAP16[r2>>1]=r4;r5=r1+24|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r6&65535)<<4)+(r3&65535)&r8;r3=r9+1|0;r10=r1+76|0;r11=HEAP32[r10>>2];if(r3>>>0<r11>>>0){r12=HEAP32[r1+72>>2];r13=HEAPU8[r12+r3|0]<<8|HEAPU8[r12+r9|0];r14=r4;r15=r6;r16=r8;r17=r11}else{r11=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r13=r11;r14=HEAP16[r2>>1];r15=HEAP16[r5>>1];r16=HEAP32[r7>>2];r17=HEAP32[r10>>2]}HEAP16[r1+28>>1]=r13;r13=r14+2&65535;HEAP16[r2>>1]=r13;r11=((r15&65535)<<4)+(r14&65535)&r16;r14=r11+1|0;if(r14>>>0<r17>>>0){r9=HEAP32[r1+72>>2];r18=HEAPU8[r9+r14|0]<<8|HEAPU8[r9+r11|0];r19=r13;r20=r15;r21=r16;r22=r17}else{r17=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r11);r18=r17;r19=HEAP16[r2>>1];r20=HEAP16[r5>>1];r21=HEAP32[r7>>2];r22=HEAP32[r10>>2]}HEAP16[r1+22>>1]=r18;HEAP16[r2>>1]=r19+2;r2=((r20&65535)<<4)+(r19&65535)&r21;r21=r2+1|0;if(r21>>>0<r22>>>0){r22=HEAP32[r1+72>>2];r23=HEAPU8[r22+r21|0]<<8|HEAPU8[r22+r2|0];r24=r1+30|0;HEAP16[r24>>1]=r23;_e86_pq_init(r1);r25=r1+1200|0;r26=HEAP32[r25>>2];r27=r26+32|0;HEAP32[r25>>2]=r27;return 0}else{r23=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r2);r24=r1+30|0;HEAP16[r24>>1]=r23;_e86_pq_init(r1);r25=r1+1200|0;r26=HEAP32[r25>>2];r27=r26+32|0;HEAP32[r25>>2]=r27;return 0}}function _op_d0(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113;r2=0;r3=r1+129|0;r4=HEAP8[r3];r5=r4&255;r6=r5>>>3;r7=r6&7;_e86_get_ea_ptr(r1,r3);r8=_e86_get_ea8(r1);L1:do{switch(r7|0){case 5:{r9=(r8&255)>>>1;r10=r9&255;_e86_set_flg_szp_8(r1,r9);r11=r8&1;r12=r11<<24>>24==0;r13=r1+30|0;r14=HEAP16[r13>>1];if(r12){r15=r14&-2;HEAP16[r13>>1]=r15;r16=r10;r17=r15;break L1}else{r18=r14|1;HEAP16[r13>>1]=r18;r16=r10;r17=r18;break L1}break};case 4:{r19=r8&255;r20=r19<<1;r21=r20&65535;r22=r20&255;_e86_set_flg_szp_8(r1,r22);r23=r19&128;r24=(r23|0)==0;r25=r1+30|0;r26=HEAP16[r25>>1];if(r24){r27=r26&-2;HEAP16[r25>>1]=r27;r16=r21;r17=r27;break L1}else{r28=r26|1;HEAP16[r25>>1]=r28;r16=r21;r17=r28;break L1}break};case 2:{r29=r8&255;r30=r29<<1;r31=r1+30|0;r32=HEAP16[r31>>1];r33=r32&65535;r34=r33&1;r35=r34|r30;r36=r35&65535;r37=r29&128;r38=(r37|0)==0;if(r38){r39=r32&-2;HEAP16[r31>>1]=r39;r16=r36;r17=r39;break L1}else{r40=r32|1;HEAP16[r31>>1]=r40;r16=r36;r17=r40;break L1}break};case 7:{r41=r8&255;r42=r41>>>1;r43=r41&128;r44=r42|r43;r45=r44&65535;r46=r44&255;_e86_set_flg_szp_8(r1,r46);r47=r41&1;r48=(r47|0)==0;r49=r1+30|0;r50=HEAP16[r49>>1];if(r48){r51=r50&-2;HEAP16[r49>>1]=r51;r16=r45;r17=r51;break L1}else{r52=r50|1;HEAP16[r49>>1]=r52;r16=r45;r17=r52;break L1}break};case 0:{r53=r8&255;r54=r53<<1;r55=r53>>>7;r56=r54|r55;r57=r56&65535;r58=r53&128;r59=(r58|0)==0;r60=r1+30|0;r61=HEAP16[r60>>1];if(r59){r62=r61&-2;HEAP16[r60>>1]=r62;r16=r57;r17=r62;break L1}else{r63=r61|1;HEAP16[r60>>1]=r63;r16=r57;r17=r63;break L1}break};case 1:{r64=r8&255;r65=r64>>>1;r66=r64<<7;r67=r65|r66;r68=r67&65535;r69=r64&1;r70=(r69|0)==0;r71=r1+30|0;r72=HEAP16[r71>>1];if(r70){r73=r72&-2;HEAP16[r71>>1]=r73;r16=r68;r17=r73;break L1}else{r74=r72|1;HEAP16[r71>>1]=r74;r16=r68;r17=r74;break L1}break};case 3:{r75=r8&255;r76=r75>>>1;r77=r1+30|0;r78=HEAP16[r77>>1];r79=r78&65535;r80=r79<<7;r81=r80&128;r82=r81|r76;r83=r82&65535;r84=r75&1;r85=(r84|0)==0;if(r85){r86=r78&-2;HEAP16[r77>>1]=r86;r16=r83;r17=r86;break L1}else{r87=r78|1;HEAP16[r77>>1]=r87;r16=r83;r17=r87;break L1}break};default:{r88=r1+1200|0;r89=HEAP32[r88>>2];r90=r89+1|0;HEAP32[r88>>2]=r90;r91=_e86_undefined(r1);r92=r91;return r92}}}while(0);r93=r16&65535;r94=r8&255;r95=r93^r94;r96=r95&128;r97=(r96|0)==0;r98=r1+30|0;r99=r17&-2049;r100=r17|2048;r101=r97?r99:r100;HEAP16[r98>>1]=r101;r102=r16&255;_e86_set_ea8(r1,r102);r103=r1+1184|0;r104=HEAP32[r103>>2];r105=(r104|0)!=0;r106=r105?15:2;r107=r1+1200|0;r108=HEAP32[r107>>2];r109=r106+r108|0;HEAP32[r107>>2]=r109;r110=r1+1196|0;r111=HEAP16[r110>>1];r112=r111&65535;r113=r112+1|0;r92=r113;return r92}function _op_d1(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100;r2=0;r3=r1+129|0;r4=HEAP8[r3];r5=r4&255;r6=r5>>>3;r7=r6&7;_e86_get_ea_ptr(r1,r3);r8=_e86_get_ea16(r1);r9=r8&65535;L1:do{switch(r7|0){case 4:{r10=r9<<1;r11=r10&65535;_e86_set_flg_szp_16(r1,r11);r12=r9&32768;r13=(r12|0)==0;r14=r1+30|0;r15=HEAP16[r14>>1];if(r13){r16=r15&-2;HEAP16[r14>>1]=r16;r17=r10;r18=r16;break L1}else{r19=r15|1;HEAP16[r14>>1]=r19;r17=r10;r18=r19;break L1}break};case 0:{r20=r9<<1;r21=r9>>>15;r22=r20|r21;r23=r9&32768;r24=(r23|0)==0;r25=r1+30|0;r26=HEAP16[r25>>1];if(r24){r27=r26&-2;HEAP16[r25>>1]=r27;r17=r22;r18=r27;break L1}else{r28=r26|1;HEAP16[r25>>1]=r28;r17=r22;r18=r28;break L1}break};case 3:{r29=r9>>>1;r30=r1+30|0;r31=HEAP16[r30>>1];r32=r31&65535;r33=r32<<15;r34=r33&32768;r35=r34|r29;r36=r9&1;r37=(r36|0)==0;if(r37){r38=r31&-2;HEAP16[r30>>1]=r38;r17=r35;r18=r38;break L1}else{r39=r31|1;HEAP16[r30>>1]=r39;r17=r35;r18=r39;break L1}break};case 1:{r40=r9>>>1;r41=r9<<15;r42=r40|r41;r43=r9&1;r44=(r43|0)==0;r45=r1+30|0;r46=HEAP16[r45>>1];if(r44){r47=r46&-2;HEAP16[r45>>1]=r47;r17=r42;r18=r47;break L1}else{r48=r46|1;HEAP16[r45>>1]=r48;r17=r42;r18=r48;break L1}break};case 5:{r49=r9>>>1;r50=r49&65535;_e86_set_flg_szp_16(r1,r50);r51=r9&1;r52=(r51|0)==0;r53=r1+30|0;r54=HEAP16[r53>>1];if(r52){r55=r54&-2;HEAP16[r53>>1]=r55;r17=r49;r18=r55;break L1}else{r56=r54|1;HEAP16[r53>>1]=r56;r17=r49;r18=r56;break L1}break};case 7:{r57=r9>>>1;r58=r9&32768;r59=r57|r58;r60=r59&65535;_e86_set_flg_szp_16(r1,r60);r61=r9&1;r62=(r61|0)==0;r63=r1+30|0;r64=HEAP16[r63>>1];if(r62){r65=r64&-2;HEAP16[r63>>1]=r65;r17=r59;r18=r65;break L1}else{r66=r64|1;HEAP16[r63>>1]=r66;r17=r59;r18=r66;break L1}break};case 2:{r67=r9<<1;r68=r1+30|0;r69=HEAP16[r68>>1];r70=r69&65535;r71=r70&1;r72=r71|r67;r73=r9&32768;r74=(r73|0)==0;if(r74){r75=r69&-2;HEAP16[r68>>1]=r75;r17=r72;r18=r75;break L1}else{r76=r69|1;HEAP16[r68>>1]=r76;r17=r72;r18=r76;break L1}break};default:{r77=r1+1200|0;r78=HEAP32[r77>>2];r79=r78+1|0;HEAP32[r77>>2]=r79;r80=_e86_undefined(r1);r81=r80;return r81}}}while(0);r82=r17^r9;r83=r82&32768;r84=(r83|0)==0;r85=r1+30|0;r86=r18&-2049;r87=r18|2048;r88=r84?r86:r87;HEAP16[r85>>1]=r88;r89=r17&65535;_e86_set_ea16(r1,r89);r90=r1+1184|0;r91=HEAP32[r90>>2];r92=(r91|0)!=0;r93=r92?15:2;r94=r1+1200|0;r95=HEAP32[r94>>2];r96=r93+r95|0;HEAP32[r94>>2]=r96;r97=r1+1196|0;r98=HEAP16[r97>>1];r99=r98&65535;r100=r99+1|0;r81=r100;return r81}function _op_d2(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164,r165,r166;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea8(r1);r6=r5&255;r7=r1+6|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r1|0;r11=HEAP32[r10>>2];r12=r11&2;r13=(r12|0)==0;r14=r13?255:31;r15=r14&r9;r16=(r15|0)==0;if(r16){r17=r1+1184|0;r18=HEAP32[r17>>2];r19=(r18|0)!=0;r20=r19?20:8;r21=r1+1200|0;r22=HEAP32[r21>>2];r23=r20+r22|0;HEAP32[r21>>2]=r23;r24=r1+1196|0;r25=HEAP16[r24>>1];r26=r25&65535;r27=r26+1|0;r28=r27;return r28}r29=r4&255;r30=r29>>>3;r31=r30&7;L5:do{switch(r31|0){case 5:{r32=r15>>>0>8;if(r32){r33=0}else{r34=r5&255;r35=r15-1|0;r36=r34>>>(r35>>>0);r37=r36&65535;r33=r37}r38=r33&1;r39=(r38|0)==0;r40=r1+30|0;r41=HEAP16[r40>>1];r42=r41&-2;r43=r41|1;r44=r39?r42:r43;HEAP16[r40>>1]=r44;r45=r33>>>1;r46=r45&65535;r47=r45&255;_e86_set_flg_szp_8(r1,r47);r48=r6;r49=r46;break};case 2:{r50=r1+30|0;r51=HEAP16[r50>>1];r52=r51<<8;r53=r52&256;r54=r53|r6;r55=r54&65535;r56=(r15>>>0)%9&-1;r57=r55<<r56;r58=9-r56|0;r59=r55>>>(r58>>>0);r60=r57|r59;r61=r60&65535;r62=r60&256;r63=(r62|0)==0;if(r63){r64=r51&-2;HEAP16[r50>>1]=r64;r48=r54;r49=r61;break L5}else{r65=r51|1;HEAP16[r50>>1]=r65;r48=r54;r49=r61;break L5}break};case 3:{r66=r1+30|0;r67=HEAP16[r66>>1];r68=r67<<8;r69=r68&256;r70=r69|r6;r71=r70&65535;r72=(r15>>>0)%9&-1;r73=r71>>>(r72>>>0);r74=9-r72|0;r75=r71<<r74;r76=r73|r75;r77=r76&65535;r78=r76&256;r79=(r78|0)==0;if(r79){r80=r67&-2;HEAP16[r66>>1]=r80;r48=r70;r49=r77;break L5}else{r81=r67|1;HEAP16[r66>>1]=r81;r48=r70;r49=r77;break L5}break};case 1:{r82=r5&255;r83=r9&7;r84=r82>>>(r83>>>0);r85=8-r83|0;r86=r82<<r85;r87=r86|r84;r88=r87&65535;r89=r87&128;r90=(r89|0)==0;r91=r1+30|0;r92=HEAP16[r91>>1];if(r90){r93=r92&-2;HEAP16[r91>>1]=r93;r48=r6;r49=r88;break L5}else{r94=r92|1;HEAP16[r91>>1]=r94;r48=r6;r49=r88;break L5}break};case 0:{r95=r5&255;r96=r9&7;r97=r95<<r96;r98=8-r96|0;r99=r95>>>(r98>>>0);r100=r99|r97;r101=r100&65535;r102=r100&1;r103=(r102|0)==0;r104=r1+30|0;r105=HEAP16[r104>>1];if(r103){r106=r105&-2;HEAP16[r104>>1]=r106;r48=r6;r49=r101;break L5}else{r107=r105|1;HEAP16[r104>>1]=r107;r48=r6;r49=r101;break L5}break};case 7:{r108=r5&255;r109=r108&128;r110=(r109|0)!=0;r111=r110?65280:0;r112=r111|r108;r113=r112&65535;r114=r15>>>0>7;r115=r15-1|0;r116=r114?7:r115;r117=r112>>>(r116>>>0);r118=r117&1;r119=(r118|0)==0;r120=r1+30|0;r121=HEAP16[r120>>1];r122=r121&-2;r123=r121|1;r124=r119?r122:r123;HEAP16[r120>>1]=r124;r125=r117>>>1;r126=r125&65535;r127=r126&255;r128=r125&255;_e86_set_flg_szp_8(r1,r128);r48=r113;r49=r127;break};case 4:{r129=r15>>>0>8;if(r129){r130=0}else{r131=r5&255;r132=r131<<r15;r133=r132&65535;r130=r133}r134=r130&255;_e86_set_flg_szp_8(r1,r134);r135=r130&256;r136=r135<<16>>16==0;r137=r1+30|0;r138=HEAP16[r137>>1];if(r136){r139=r138&-2;HEAP16[r137>>1]=r139;r48=r6;r49=r130;break L5}else{r140=r138|1;HEAP16[r137>>1]=r140;r48=r6;r49=r130;break L5}break};default:{r141=r1+1200|0;r142=HEAP32[r141>>2];r143=r142+1|0;HEAP32[r141>>2]=r143;r144=_e86_undefined(r1);r28=r144;return r28}}}while(0);r145=r48^r49;r146=r145&128;r147=r146<<16>>16==0;r148=r1+30|0;r149=HEAP16[r148>>1];r150=r149&-2049;r151=r149|2048;r152=r147?r150:r151;HEAP16[r148>>1]=r152;r153=r49&255;_e86_set_ea8(r1,r153);r154=r1+1184|0;r155=HEAP32[r154>>2];r156=(r155|0)!=0;r157=r15<<2;r158=r156?20:8;r159=r1+1200|0;r160=HEAP32[r159>>2];r161=r160+r157|0;r162=r161+r158|0;HEAP32[r159>>2]=r162;r163=r1+1196|0;r164=HEAP16[r163>>1];r165=r164&65535;r166=r165+1|0;r28=r166;return r28}function _op_d3(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152;r2=0;r3=r1+129|0;r4=HEAP8[r3];_e86_get_ea_ptr(r1,r3);r5=_e86_get_ea16(r1);r6=r5&65535;r7=r1+6|0;r8=HEAP16[r7>>1];r9=r8&65535;r10=r1|0;r11=HEAP32[r10>>2];r12=r11&2;r13=(r12|0)==0;r14=r13?255:31;r15=r14&r9;r16=(r15|0)==0;if(r16){r17=r1+1184|0;r18=HEAP32[r17>>2];r19=(r18|0)!=0;r20=r19?20:8;r21=r1+1200|0;r22=HEAP32[r21>>2];r23=r20+r22|0;HEAP32[r21>>2]=r23;r24=r1+1196|0;r25=HEAP16[r24>>1];r26=r25&65535;r27=r26+1|0;r28=r27;return r28}r29=r4&255;r30=r29>>>3;r31=r30&7;L5:do{switch(r31|0){case 1:{r32=r9&15;r33=r6>>>(r32>>>0);r34=16-r32|0;r35=r6<<r34;r36=r35|r33;r37=r36&32768;r38=(r37|0)==0;r39=r1+30|0;r40=HEAP16[r39>>1];if(r38){r41=r40&-2;HEAP16[r39>>1]=r41;r42=r6;r43=r36;break L5}else{r44=r40|1;HEAP16[r39>>1]=r44;r42=r6;r43=r36;break L5}break};case 2:{r45=r1+30|0;r46=HEAP16[r45>>1];r47=r46&65535;r48=r47<<16;r49=r48&65536;r50=r49|r6;r51=(r15>>>0)%17&-1;r52=r50<<r51;r53=17-r51|0;r54=r50>>>(r53>>>0);r55=r52|r54;r56=r55&65536;r57=(r56|0)==0;if(r57){r58=r46&-2;HEAP16[r45>>1]=r58;r42=r50;r43=r55;break L5}else{r59=r46|1;HEAP16[r45>>1]=r59;r42=r50;r43=r55;break L5}break};case 7:{r60=r6&32768;r61=(r60|0)!=0;r62=r61?-65536:0;r63=r62|r6;r64=r15>>>0>15;r65=r15-1|0;r66=r64?15:r65;r67=r63>>>(r66>>>0);r68=r67&1;r69=(r68|0)==0;r70=r1+30|0;r71=HEAP16[r70>>1];r72=r71&-2;r73=r71|1;r74=r69?r72:r73;HEAP16[r70>>1]=r74;r75=r67>>>1;r76=r75&65535;r77=r75&65535;_e86_set_flg_szp_16(r1,r77);r42=r63;r43=r76;break};case 0:{r78=r9&15;r79=r6<<r78;r80=16-r78|0;r81=r6>>>(r80>>>0);r82=r81|r79;r83=r82&1;r84=(r83|0)==0;r85=r1+30|0;r86=HEAP16[r85>>1];if(r84){r87=r86&-2;HEAP16[r85>>1]=r87;r42=r6;r43=r82;break L5}else{r88=r86|1;HEAP16[r85>>1]=r88;r42=r6;r43=r82;break L5}break};case 3:{r89=r1+30|0;r90=HEAP16[r89>>1];r91=r90&65535;r92=r91<<16;r93=r92&65536;r94=r93|r6;r95=(r15>>>0)%17&-1;r96=r94>>>(r95>>>0);r97=17-r95|0;r98=r94<<r97;r99=r96|r98;r100=r99&65536;r101=(r100|0)==0;if(r101){r102=r90&-2;HEAP16[r89>>1]=r102;r42=r94;r43=r99;break L5}else{r103=r90|1;HEAP16[r89>>1]=r103;r42=r94;r43=r99;break L5}break};case 4:{r104=r15>>>0>16;r105=r6<<r15;r106=r104?0:r105;r107=r106&65535;_e86_set_flg_szp_16(r1,r107);r108=r106&65536;r109=(r108|0)==0;r110=r1+30|0;r111=HEAP16[r110>>1];if(r109){r112=r111&-2;HEAP16[r110>>1]=r112;r42=r6;r43=r106;break L5}else{r113=r111|1;HEAP16[r110>>1]=r113;r42=r6;r43=r106;break L5}break};case 5:{r114=r15>>>0>16;if(r114){r115=0}else{r116=r15-1|0;r117=r6>>>(r116>>>0);r115=r117}r118=r115&1;r119=(r118|0)==0;r120=r1+30|0;r121=HEAP16[r120>>1];r122=r121&-2;r123=r121|1;r124=r119?r122:r123;HEAP16[r120>>1]=r124;r125=r115>>>1;r126=r125&65535;_e86_set_flg_szp_16(r1,r126);r42=r6;r43=r125;break};default:{r127=r1+1200|0;r128=HEAP32[r127>>2];r129=r128+1|0;HEAP32[r127>>2]=r129;r130=_e86_undefined(r1);r28=r130;return r28}}}while(0);r131=r42^r43;r132=r131&32768;r133=(r132|0)==0;r134=r1+30|0;r135=HEAP16[r134>>1];r136=r135&-2049;r137=r135|2048;r138=r133?r136:r137;HEAP16[r134>>1]=r138;r139=r43&65535;_e86_set_ea16(r1,r139);r140=r1+1184|0;r141=HEAP32[r140>>2];r142=(r141|0)!=0;r143=r15<<2;r144=r142?20:8;r145=r1+1200|0;r146=HEAP32[r145>>2];r147=r146+r143|0;r148=r147+r144|0;HEAP32[r145>>2]=r148;r149=r1+1196|0;r150=HEAP16[r149>>1];r151=r150&65535;r152=r151+1|0;r28=r152;return r28}function _op_d4(r1){var r2,r3,r4,r5,r6;r2=HEAP8[r1+129|0];r3=r2&255;if(r2<<24>>24==0){_e86_trap(r1,0);r4=0;return r4}else{r2=r1+4|0;r5=HEAP16[r2>>1]&255;r6=((r5>>>0)%(r3>>>0)&-1&255|((r5>>>0)/(r3>>>0)&-1)<<8)&65535;HEAP16[r2>>1]=r6;_e86_set_flg_szp_16(r1,r6);r6=r1+1200|0;HEAP32[r6>>2]=HEAP32[r6>>2]+83;r4=2;return r4}}function _op_d5(r1){var r2,r3,r4;r2=r1+4|0;r3=HEAP16[r2>>1];r4=((r3&65535)>>>8)*HEAPU8[r1+129|0]&65535;HEAP16[r2>>1]=r4+r3&255;_e86_set_flg_szp_16(r1,r4+(r3&255)&65535);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+60;return 2}function _op_d7(r1){var r2,r3,r4,r5,r6;r2=r1+4|0;r3=HEAP16[r2>>1];r4=((r3&255)+HEAP16[r1+10>>1]&65535)+(HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+26|0:r1+148|0)>>1]<<4)&HEAP32[r1+80>>2];if(r4>>>0<HEAP32[r1+76>>2]>>>0){r5=HEAP8[HEAP32[r1+72>>2]+r4|0];r6=r3}else{r3=FUNCTION_TABLE[HEAP32[r1+36>>2]](HEAP32[r1+32>>2],r4);r5=r3;r6=HEAP16[r2>>1]}HEAP16[r2>>1]=r6&-256|r5&255;r5=r1+1200|0;HEAP32[r5>>2]=HEAP32[r5>>2]+11;return 1}function _op_d8(r1){var r2,r3;if((HEAP32[r1>>2]&16|0)==0){_e86_get_ea_ptr(r1,r1+129|0);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;r3=HEAPU16[r1+1196>>1]+1|0;return r3}else{_e86_trap(r1,7);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+50;r3=0;return r3}}function _op_e0(r1){var r2,r3,r4,r5;r2=r1+6|0;r3=HEAPU16[r2>>1]+65535|0;HEAP16[r2>>1]=r3;do{if((r3&65535|0)!=0){if((HEAP16[r1+30>>1]&64)!=0){break}r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;r5=0;return r5}}while(0);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+5;r5=2;return r5}function _op_e1(r1){var r2,r3,r4,r5;r2=r1+6|0;r3=HEAPU16[r2>>1]+65535|0;HEAP16[r2>>1]=r3;do{if((r3&65535|0)!=0){if((HEAP16[r1+30>>1]&64)==0){break}r2=HEAPU8[r1+129|0];r4=r1+28|0;HEAP16[r4>>1]=HEAPU16[r4>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+18;r5=0;return r5}}while(0);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+5;r5=2;return r5}function _op_e2(r1){var r2,r3,r4;r2=r1+6|0;r3=HEAPU16[r2>>1]+65535|0;HEAP16[r2>>1]=r3;if((r3&65535|0)==0){r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+5;r4=2;return r4}else{r3=HEAPU8[r1+129|0];r2=r1+28|0;HEAP16[r2>>1]=HEAPU16[r2>>1]+2+((r3&128|0)!=0?r3|65280:r3);_e86_pq_init(r1);r3=r1+1200|0;HEAP32[r3>>2]=HEAP32[r3>>2]+18;r4=0;return r4}}function _op_e3(r1){var r2,r3,r4;if((HEAP16[r1+6>>1]|0)==0){r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+18;r4=0;return r4}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+6;r4=2;return r4}}function _op_e4(r1){var r2,r3;r2=FUNCTION_TABLE[HEAP32[r1+56>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0]);r3=r1+4|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-256|r2&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return 2}function _op_e5(r1){var r2;HEAP16[r1+4>>1]=FUNCTION_TABLE[HEAP32[r1+64>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 2}function _op_e6(r1){var r2;FUNCTION_TABLE[HEAP32[r1+60>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0],HEAP16[r1+4>>1]&255);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return 2}function _op_e7(r1){var r2;FUNCTION_TABLE[HEAP32[r1+68>>2]](HEAP32[r1+52>>2],HEAPU8[r1+129|0],HEAP16[r1+4>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+11;return 2}function _op_e8(r1){var r2,r3,r4,r5,r6;r2=r1+28|0;r3=HEAP16[r2>>1]+3&65535;r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r1+24>>1]<<4)+(r5&65535)&HEAP32[r1+80>>2];r5=r4+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r6=r1+72|0;HEAP8[HEAP32[r6>>2]+r4|0]=r3;HEAP8[HEAP32[r6>>2]+r5|0]=(r3&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r3)}HEAP16[r2>>1]=(HEAP16[r2>>1]+3&65535)+(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+19;return 0}function _op_e9(r1){var r2;r2=r1+28|0;HEAP16[r2>>1]=(HEAP16[r2>>1]+3&65535)+(HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0]);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 0}function _op_ea(r1){var r2;HEAP16[r1+28>>1]=HEAPU8[r1+130|0]<<8|HEAPU8[r1+129|0];HEAP16[r1+22>>1]=HEAPU8[r1+132|0]<<8|HEAPU8[r1+131|0];_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 0}function _op_eb(r1){var r2,r3;r2=HEAPU8[r1+129|0];r3=r1+28|0;HEAP16[r3>>1]=HEAPU16[r3>>1]+2+((r2&128|0)!=0?r2|65280:r2);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+15;return 0}function _op_ec(r1){var r2,r3;r2=FUNCTION_TABLE[HEAP32[r1+56>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r3=r1+4|0;HEAP16[r3>>1]=HEAP16[r3>>1]&-256|r2&255;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return 1}function _op_ed(r1){var r2;HEAP16[r1+4>>1]=FUNCTION_TABLE[HEAP32[r1+64>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+13;return 1}function _op_ee(r1){var r2;FUNCTION_TABLE[HEAP32[r1+60>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1],HEAP16[r1+4>>1]&255);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return 1}function _op_ef(r1){var r2;FUNCTION_TABLE[HEAP32[r1+68>>2]](HEAP32[r1+52>>2],HEAPU16[r1+8>>1],HEAP16[r1+4>>1]);r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+9;return 1}function _op_f0(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|17;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f2(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|9;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f3(r1){var r2;r2=r1+144|0;HEAP32[r2>>2]=HEAP32[r2>>2]|5;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f4(r1){var r2;HEAP32[r1+152>>2]=1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f5(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]^1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f6(r1){return FUNCTION_TABLE[HEAP32[5736+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_f7(r1){return FUNCTION_TABLE[HEAP32[5704+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_f8(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-2;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_f9(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]|1;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fa(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-513;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fb(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]|512;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fc(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]&-1025;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fd(r1){var r2;r2=r1+30|0;HEAP16[r2>>1]=HEAP16[r2>>1]|1024;r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+2;return 1}function _op_fe(r1){var r2,r3,r4,r5,r6,r7;r2=r1+129|0;r3=HEAPU8[r2]>>>3&7;if((r3|0)==0){_e86_get_ea_ptr(r1,r2);r4=_e86_get_ea8(r1);_e86_set_ea8(r1,r4+1&255);r5=r1+30|0;r6=HEAP16[r5>>1];_e86_set_flg_add_8(r1,r4,1);r4=HEAP16[r5>>1];HEAP16[r5>>1]=(r4^r6)&1^r4;r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r4>>2];r7=HEAPU16[r1+1196>>1]+1|0;return r7}else if((r3|0)==1){_e86_get_ea_ptr(r1,r2);r2=_e86_get_ea8(r1);_e86_set_ea8(r1,r2-1&255);r3=r1+30|0;r4=HEAP16[r3>>1];_e86_set_flg_sub_8(r1,r2,1);r2=HEAP16[r3>>1];HEAP16[r3>>1]=(r2^r4)&1^r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r2>>2];r7=HEAPU16[r1+1196>>1]+1|0;return r7}else{r2=r1+1200|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1;r7=_e86_undefined(r1);return r7}}function _op_ff(r1){return FUNCTION_TABLE[HEAP32[5672+(((HEAP8[r1+129|0]&255)>>>3&7)<<2)>>2]](r1)}function _op_ff_00(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);_e86_set_ea16(r1,r2+1&65535);r3=r1+30|0;r4=HEAP16[r3>>1];_e86_set_flg_add_16(r1,r2,1);r2=HEAP16[r3>>1];HEAP16[r3>>1]=(r2^r4)&1^r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_ff_01(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);_e86_set_ea16(r1,r2-1&65535);r3=r1+30|0;r4=HEAP16[r3>>1];_e86_set_flg_sub_16(r1,r2,1);r2=HEAP16[r3>>1];HEAP16[r3>>1]=(r2^r4)&1^r2;r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?15:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_ff_02(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+28|0;r3=(HEAP16[r2>>1]+1&65535)+HEAP16[r1+1196>>1]&65535;r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r1+24>>1]<<4)+(r5&65535)&HEAP32[r1+80>>2];r5=r4+1|0;if(r5>>>0<HEAP32[r1+76>>2]>>>0){r6=r1+72|0;HEAP8[HEAP32[r6>>2]+r4|0]=r3;HEAP8[HEAP32[r6>>2]+r5|0]=(r3&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r3)}HEAP16[r2>>1]=_e86_get_ea16(r1);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?21:16)+HEAP32[r2>>2];return 0}function _op_ff_03(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;_e86_get_ea_ptr(r1,r1+129|0);if((HEAP32[r1+1184>>2]|0)==0){r2=HEAPU16[r1+1196>>1]+1|0;return r2}r3=r1+22|0;r4=HEAP16[r3>>1];r5=r1+12|0;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r7=r1+24|0;r8=r1+80|0;r9=(HEAPU16[r7>>1]<<4)+(r6&65535)&HEAP32[r8>>2];r6=r9+1|0;r10=r1+76|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r11=r1+72|0;HEAP8[HEAP32[r11>>2]+r9|0]=r4;HEAP8[HEAP32[r11>>2]+r6|0]=(r4&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r9,r4)}r4=r1+28|0;r9=(HEAP16[r4>>1]+1&65535)+HEAP16[r1+1196>>1]&65535;r6=HEAP16[r5>>1]-2&65535;HEAP16[r5>>1]=r6;r5=(HEAPU16[r7>>1]<<4)+(r6&65535)&HEAP32[r8>>2];r6=r5+1|0;if(r6>>>0<HEAP32[r10>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r5|0]=r9;HEAP8[HEAP32[r7>>2]+r6|0]=(r9&65535)>>>8}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r5,r9)}r9=HEAP16[r1+1194>>1];r5=HEAPU16[((HEAP32[r1+144>>2]&2|0)==0?r1+1192|0:r1+148|0)>>1]<<4;r6=HEAP32[r8>>2];r7=r5+(r9&65535)&r6;r11=r7+1|0;r12=HEAP32[r10>>2];if(r11>>>0<r12>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r11|0]<<8|HEAPU8[r13+r7|0];r15=r6;r16=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r7);r14=r12;r15=HEAP32[r8>>2];r16=HEAP32[r10>>2]}HEAP16[r4>>1]=r14;r14=r15&(r9+2&65535)+r5;r5=r14+1|0;if(r5>>>0<r16>>>0){r16=HEAP32[r1+72>>2];r17=HEAPU8[r16+r5|0]<<8|HEAPU8[r16+r14|0]}else{r17=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14)}HEAP16[r3>>1]=r17;_e86_pq_init(r1);r17=r1+1200|0;HEAP32[r17>>2]=HEAP32[r17>>2]+37;r2=0;return r2}function _op_ff_04(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);HEAP16[r1+28>>1]=_e86_get_ea16(r1);_e86_pq_init(r1);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?18:11)+HEAP32[r2>>2];return 0}function _op_ff_05(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;_e86_get_ea_ptr(r1,r1+129|0);if((HEAP32[r1+1184>>2]|0)==0){r2=HEAPU16[r1+1196>>1]+1|0;return r2}r3=r1+1192|0;r4=HEAP16[r3>>1];r5=r1+1194|0;r6=HEAP16[r5>>1];r7=r1+80|0;r8=HEAP32[r7>>2];r9=((r4&65535)<<4)+(r6&65535)&r8;r10=r9+1|0;r11=r1+76|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){r13=HEAP32[r1+72>>2];r14=HEAPU8[r13+r10|0]<<8|HEAPU8[r13+r9|0];r15=r4;r16=r6;r17=r8;r18=r12}else{r12=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r9);r14=r12;r15=HEAP16[r3>>1];r16=HEAP16[r5>>1];r17=HEAP32[r7>>2];r18=HEAP32[r11>>2]}HEAP16[r1+28>>1]=r14;r14=(r16+2&65535)+((r15&65535)<<4)&r17;r17=r14+1|0;if(r17>>>0<r18>>>0){r18=HEAP32[r1+72>>2];r19=HEAPU8[r18+r17|0]<<8|HEAPU8[r18+r14|0]}else{r19=FUNCTION_TABLE[HEAP32[r1+44>>2]](HEAP32[r1+32>>2],r14)}HEAP16[r1+22>>1]=r19;_e86_pq_init(r1);r19=r1+1200|0;HEAP32[r19>>2]=HEAP32[r19>>2]+24;r2=0;return r2}function _op_ff_06(r1){var r2,r3,r4,r5,r6,r7;r2=0;_e86_get_ea_ptr(r1,r1+129|0);r3=r1+1184|0;do{if((HEAP32[r3>>2]|0)==0){if((HEAP16[r1+1194>>1]|0)!=4){r2=7;break}if((HEAP32[r1>>2]&4|0)!=0){r2=7;break}r4=r1+12|0;r5=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r5;r4=(HEAPU16[r1+24>>1]<<4)+(r5&65535)&HEAP32[r1+80>>2];r6=r4+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r4|0]=r5;HEAP8[HEAP32[r7>>2]+r6|0]=(r5&65535)>>>8;break}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r5);break}}else{r2=7}}while(0);do{if(r2==7){r5=_e86_get_ea16(r1);r4=r1+12|0;r6=HEAP16[r4>>1]-2&65535;HEAP16[r4>>1]=r6;r4=(HEAPU16[r1+24>>1]<<4)+(r6&65535)&HEAP32[r1+80>>2];r6=r4+1|0;if(r6>>>0<HEAP32[r1+76>>2]>>>0){r7=r1+72|0;HEAP8[HEAP32[r7>>2]+r4|0]=r5;HEAP8[HEAP32[r7>>2]+r6|0]=(r5&65535)>>>8;break}else{FUNCTION_TABLE[HEAP32[r1+48>>2]](HEAP32[r1+32>>2],r4,r5);break}}}while(0);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r3>>2]|0)!=0?16:10)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_00(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];_e86_set_flg_log_16(r1,(HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0])&r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?11:5)+HEAP32[r2>>2];return HEAPU16[r3>>1]+3|0}function _op_f7_02(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);_e86_set_ea16(r1,~_e86_get_ea16(r1));r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_03(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);_e86_set_ea16(r1,-r2&65535);_e86_set_flg_sub_16(r1,0,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+4|0;r4=Math_imul(HEAPU16[r3>>1],r2)|0;HEAP16[r3>>1]=r4;HEAP16[r1+8>>1]=r4>>>16;r3=r1+30|0;r2=HEAP16[r3>>1];r5=(r4&2147418112|0)==0?r2&-2050:r2|2049;HEAP16[r3>>1]=(r4|0)==0?r5|64:r5&-65;r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?131:115)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_05(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+4|0;r3=HEAPU16[r2>>1];r4=_e86_get_ea16(r1)&65535;r5=Math_imul((r4&32768|0)!=0?r4|-65536:r4,(r3&32768|0)!=0?r3|-65536:r3)|0;HEAP16[r2>>1]=r5;HEAP16[r1+8>>1]=r5>>>16;r2=r5&-65536;r5=r1+30|0;r3=HEAP16[r5>>1];if((r2|0)==-65536|(r2|0)==0){r6=r3&-2050}else{r6=r3|2049}HEAP16[r5>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?147:141)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f7_06(r1){var r2,r3,r4,r5,r6,r7,r8;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r2&65535;if(r2<<16>>16==0){r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r2>>2];r2=r1+28|0;HEAP16[r2>>1]=(HEAP16[r2>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}r2=r1+8|0;r5=r1+4|0;r6=HEAPU16[r2>>1]<<16|HEAPU16[r5>>1];r7=(r6>>>0)/(r3>>>0)&-1;if(r7>>>0>65535){r8=r1+1200|0;HEAP32[r8>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r8>>2];r8=r1+28|0;HEAP16[r8>>1]=(HEAP16[r8>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}else{HEAP16[r5>>1]=r7;HEAP16[r2>>1]=(r6>>>0)%(r3>>>0)&-1;r3=r1+1200|0;HEAP32[r3>>2]=((HEAP32[r1+1184>>2]|0)!=0?159:153)+HEAP32[r3>>2];r4=HEAPU16[r1+1196>>1]+1|0;return r4}}function _op_f7_07(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+8|0;r3=HEAPU16[r2>>1];r4=r3<<16;r5=r1+4|0;r6=r4|HEAPU16[r5>>1];r7=_e86_get_ea16(r1)&65535;r8=(r7&32768|0)!=0;r9=r8?r7|-65536:r7;if((r9|0)==0){r10=r1+1200|0;HEAP32[r10>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r10>>2];r10=r1+28|0;HEAP16[r10>>1]=(HEAP16[r10>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r11=0;return r11}r10=(r4|0)<0;r4=r10?-r6|0:r6;r6=r8?-r9|0:r7;r9=(r4>>>0)/(r6>>>0)&-1;r8=(r4>>>0)%(r6>>>0)&-1;do{if((r3>>>15|0)==(r7>>>15|0)){if(r9>>>0<=32767){r12=r9&65535;break}r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r6>>2];r6=r1+28|0;HEAP16[r6>>1]=(HEAP16[r6>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r11=0;return r11}else{if(r9>>>0<=32768){r12=-r9&65535;break}r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r6>>2];r6=r1+28|0;HEAP16[r6>>1]=(HEAP16[r6>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r11=0;return r11}}while(0);if(r10){r13=-r8&65535}else{r13=r8&65535}HEAP16[r5>>1]=r12;HEAP16[r2>>1]=r13;r13=r1+1200|0;HEAP32[r13>>2]=((HEAP32[r1+1184>>2]|0)!=0?180:174)+HEAP32[r13>>2];r11=HEAPU16[r1+1196>>1]+1|0;return r11}function _op_f6_00(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;_e86_set_flg_log_8(r1,HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]&r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?11:5)+HEAP32[r2>>2];return HEAPU16[r3>>1]+2|0}function _op_f6_02(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);_e86_set_ea8(r1,~_e86_get_ea8(r1));r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_03(r1){var r2;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);_e86_set_ea8(r1,-r2&255);_e86_set_flg_sub_8(r1,0,r2);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?16:3)+HEAP32[r2>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1)&255;r3=r1+4|0;r4=(HEAP16[r3>>1]&255)*r2&65535;HEAP16[r3>>1]=r4;r3=r1+30|0;r2=HEAP16[r3>>1];r5=(r4&65535)<256?r2&-2050:r2|2049;HEAP16[r3>>1]=r4<<16>>16==0?r5|64:r5&-65;r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?79:73)+HEAP32[r5>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_05(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1)&255;r3=r1+4|0;r4=HEAPU16[r3>>1];r5=Math_imul((r4&128|0)!=0?r4|65280:r4&255,(r2&128|0)!=0?r2|65280:r2)|0;HEAP16[r3>>1]=r5;r3=r5&65280;r5=r1+30|0;r2=HEAP16[r5>>1];if((r3|0)==65280|(r3|0)==0){r6=r2&-2050}else{r6=r2|2049}HEAP16[r5>>1]=r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?95:89)+HEAP32[r6>>2];return HEAPU16[r1+1196>>1]+1|0}function _op_f6_06(r1){var r2,r3,r4,r5,r6;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r2&255;if(r2<<24>>24==0){r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r2>>2];r2=r1+28|0;HEAP16[r2>>1]=(HEAP16[r2>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}r2=r1+4|0;r5=HEAPU16[r2>>1];r6=(r5>>>0)/(r3>>>0)&-1;if((r6&65280|0)==0){HEAP16[r2>>1]=((r5>>>0)%(r3>>>0)&-1)<<8|r6;r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?91:85)+HEAP32[r6>>2];r4=HEAPU16[r1+1196>>1]+1|0;return r4}else{r6=r1+1200|0;HEAP32[r6>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r6>>2];r6=r1+28|0;HEAP16[r6>>1]=(HEAP16[r6>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r4=0;return r4}}function _op_f6_07(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;_e86_get_ea_ptr(r1,r1+129|0);r2=r1+4|0;r3=HEAP16[r2>>1];r4=_e86_get_ea8(r1)<<24>>24<0;r5=_e86_get_ea8(r1)&255;r6=r4?r5|65280:r5;if((r6|0)==0){r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r5>>2];r5=r1+28|0;HEAP16[r5>>1]=(HEAP16[r5>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r7=0;return r7}r5=r3&65535;r4=(r5&32768|0)!=0;r8=r4?-r3&65535:r3;if((r6&32768|0)==0){r9=r6&65535}else{r9=65536-r6&65535}r3=(r8&65535)/(r9&65535)&-1;r10=(r8&65535)%(r9&65535)&-1;do{if((r5>>>15|0)==(r6>>>15|0)){if((r3&65535)<=127){r11=r3;break}r9=r1+1200|0;HEAP32[r9>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r9>>2];r9=r1+28|0;HEAP16[r9>>1]=(HEAP16[r9>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r7=0;return r7}else{if((r3&65535)<=128){r11=-r3&255;break}r9=r1+1200|0;HEAP32[r9>>2]=((HEAP32[r1+1184>>2]|0)!=0?20:16)+HEAP32[r9>>2];r9=r1+28|0;HEAP16[r9>>1]=(HEAP16[r9>>1]+1&65535)+HEAP16[r1+1196>>1];_e86_trap(r1,0);r7=0;return r7}}while(0);if(r4){r12=-r10&255}else{r12=r10}HEAP16[r2>>1]=r12<<8|r11;r11=r1+1200|0;HEAP32[r11>>2]=((HEAP32[r1+1184>>2]|0)!=0?112:106)+HEAP32[r11>>2];r7=HEAPU16[r1+1196>>1]+1|0;return r7}function _op_83_00(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;_e86_set_ea16(r1,r5+(r2&65535)&65535);_e86_set_flg_add_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_01(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(((r4&128|0)!=0?r4|65280:r4)|r2)&65535;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_02(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r4&65535)+(r2&65535)+r5&65535);_e86_set_flg_adc_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_83_03(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r2&65535)-(r4&65535)-r5&65535);_e86_set_flg_sbb_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_83_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=((r4&128|0)!=0?r4|65280:r4)&r2&65535;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_05(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(r4&128|0)!=0?r4|65280:r4;_e86_set_ea16(r1,(r2&65535)-r5&65535);_e86_set_flg_sub_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_06(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1)&65535;r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=(((r4&128|0)!=0?r4|65280:r4)^r2)&65535;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_83_07(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU8[HEAPU16[r3>>1]+1+(r1+128)|0];_e86_set_flg_sub_16(r1,r2,((r4&128|0)!=0?r4|65280:r4)&65535);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_81_00(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];_e86_set_ea16(r1,r5+(r2&65535)&65535);_e86_set_flg_add_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_01(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+1+(r1+128)|0]|r2|HEAPU8[r4+2+(r1+128)|0]<<8;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_02(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,r5+(r2&65535)+(r4&65535)&65535);_e86_set_flg_adc_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+3|0}function _op_81_03(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];r4=HEAP16[r1+30>>1]&1;_e86_set_ea16(r1,(r2&65535)-r5-(r4&65535)&65535);_e86_set_flg_sbb_16(r1,r2,r5&65535,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+3|0}function _op_81_04(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=(HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0])&r2;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_05(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0];_e86_set_ea16(r1,(r2&65535)-r5&65535);_e86_set_flg_sub_16(r1,r2,r5&65535);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_06(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];r5=(HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0])^r2;_e86_set_ea16(r1,r5);_e86_set_flg_log_16(r1,r5);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+3|0}function _op_81_07(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea16(r1);r3=r1+1196|0;r4=HEAPU16[r3>>1];_e86_set_flg_sub_16(r1,r2,HEAPU8[r4+2+(r1+128)|0]<<8|HEAPU8[r4+1+(r1+128)|0]);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+3|0}function _op_80_00(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];_e86_set_ea8(r1,r4+r2&255);_e86_set_flg_add_8(r1,r2,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_01(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]|r2;_e86_set_ea8(r1,r4);_e86_set_flg_log_8(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_02(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,((r4&255)+(r2&255)&65535)+r5&255);_e86_set_flg_adc_8(r1,r2,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_80_03(r1){var r2,r3,r4,r5;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];r5=HEAP16[r1+30>>1]&1;_e86_set_ea8(r1,((r2&255)-(r4&255)&65535)-r5&255);_e86_set_flg_sbb_8(r1,r2,r4,r5&255);r5=r1+1200|0;HEAP32[r5>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r5>>2];return HEAPU16[r3>>1]+2|0}function _op_80_04(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]&r2;_e86_set_ea8(r1,r4);_e86_set_flg_log_8(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_05(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0];_e86_set_ea8(r1,r2-r4&255);_e86_set_flg_sub_8(r1,r2,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_06(r1){var r2,r3,r4;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;r4=HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]^r2;_e86_set_ea8(r1,r4);_e86_set_flg_log_8(r1,r4);r4=r1+1200|0;HEAP32[r4>>2]=((HEAP32[r1+1184>>2]|0)!=0?17:4)+HEAP32[r4>>2];return HEAPU16[r3>>1]+2|0}function _op_80_07(r1){var r2,r3;_e86_get_ea_ptr(r1,r1+129|0);r2=_e86_get_ea8(r1);r3=r1+1196|0;_e86_set_flg_sub_8(r1,r2,HEAP8[HEAPU16[r3>>1]+1+(r1+128)|0]);r2=r1+1200|0;HEAP32[r2>>2]=((HEAP32[r1+1184>>2]|0)!=0?10:4)+HEAP32[r2>>2];return HEAPU16[r3>>1]+2|0}function _e86_pq_init(r1){HEAP32[r1+124>>2]=0;return}function _e86_pq_fill(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=HEAP16[r1+22>>1];r3=HEAP32[r1+120>>2];r4=HEAPU16[r1+28>>1];L1:do{if(r4>>>0>(65535-r3|0)>>>0){r5=HEAP32[r1+124>>2];if(r5>>>0>=r3>>>0){break}r6=(r2&65535)<<4;r7=r1+80|0;r8=r1+76|0;r9=r1+72|0;r10=r1+44|0;r11=r1+32|0;r12=r5;while(1){r5=HEAP32[r7>>2]&(r12+r4&65535)+r6;r13=r5+1|0;if(r13>>>0<HEAP32[r8>>2]>>>0){r14=HEAP32[r9>>2];r15=HEAP8[r14+r13|0];r16=HEAP8[r14+r5|0]}else{r14=FUNCTION_TABLE[HEAP32[r10>>2]](HEAP32[r11>>2],r5);r15=(r14&65535)>>>8&255;r16=r14&255}HEAP8[r12+(r1+128)|0]=r16;HEAP8[r12+1+(r1+128)|0]=r15;r14=r12+2|0;if(r14>>>0<r3>>>0){r12=r14}else{break}}}else{r12=r1+80|0;r11=HEAP32[r12>>2];r10=r11&((r2&65535)<<4)+r4;r9=HEAP32[r1+124>>2];r8=r9>>>0<r3>>>0;if((r10+r3|0)>>>0<=HEAP32[r1+76>>2]>>>0){if(!r8){break}r6=r1+72|0;r7=r9;while(1){HEAP8[r7+(r1+128)|0]=HEAP8[HEAP32[r6>>2]+(r7+r10)|0];r14=r7+1|0;if(r14>>>0<r3>>>0){r7=r14}else{break L1}}}if(!r8){break}r7=r1+44|0;r6=r1+32|0;r14=r9;r5=r11;while(1){r13=FUNCTION_TABLE[HEAP32[r7>>2]](HEAP32[r6>>2],r5&r14+r10);HEAP8[r14+(r1+128)|0]=r13;HEAP8[r14+1+(r1+128)|0]=(r13&65535)>>>8;r13=r14+2|0;if(r13>>>0>=r3>>>0){break L1}r14=r13;r5=HEAP32[r12>>2]}}}while(0);HEAP32[r1+124>>2]=HEAP32[r1+116>>2];return}function _e86_pq_adjust(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r1+124|0;r4=HEAP32[r3>>2];if(r4>>>0<=r2>>>0){r5=0;HEAP32[r3>>2]=r5;return}if((r4|0)==(r2|0)){r6=r2}else{r7=r4-r2|0;r4=r1+128|0;r8=r2+(r1+128)|0;while(1){HEAP8[r4]=HEAP8[r8];r1=r7-1|0;if((r1|0)==0){break}else{r7=r1;r4=r4+1|0;r8=r8+1|0}}r6=HEAP32[r3>>2]}r5=r6-r2|0;HEAP32[r3>>2]=r5;return}function _e80186_dma_init(r1){HEAP8[r1+24|0]=0;HEAP8[r1+25|0]=0;HEAP8[r1+26|0]=0;HEAP32[r1+84>>2]=0;HEAP32[r1+88>>2]=0;HEAP8[r1+92|0]=0;HEAP32[r1+96>>2]=0;HEAP32[r1+100>>2]=0;_memset(r1+32|0,0,49)|0;return}function _e80186_dma_set_getmem_fct(r1,r2,r3,r4){HEAP32[r1+32>>2]=r2;HEAP32[r1+36>>2]=r3;HEAP32[r1+40>>2]=r4;return}function _e80186_dma_set_setmem_fct(r1,r2,r3,r4){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;HEAP32[r1+52>>2]=r4;return}function _e80186_dma_set_getio_fct(r1,r2,r3,r4){HEAP32[r1+56>>2]=r2;HEAP32[r1+60>>2]=r3;HEAP32[r1+64>>2]=r4;return}function _e80186_dma_set_setio_fct(r1,r2,r3,r4){HEAP32[r1+68>>2]=r2;HEAP32[r1+72>>2]=r3;HEAP32[r1+76>>2]=r4;return}function _e80186_dma_set_int_fct(r1,r2,r3,r4){if((r2|0)==1){HEAP32[r1+96>>2]=r3;HEAP32[r1+100>>2]=r4;return}else if((r2|0)==0){HEAP32[r1+84>>2]=r3;HEAP32[r1+88>>2]=r4;return}else{return}}function _e80186_dma_reset(r1){HEAP8[r1+26|0]=0;HEAP32[r1+28>>2]=0;_memset(r1,0,24)|0;return}function _e80186_dma_set_dreq0(r1,r2){HEAP8[r1+24|0]=r2<<24>>24!=0|0;r2=r1+26|0;HEAP8[r2]=HEAP8[r2]|1;return}function _e80186_dma_get_src(r1,r2){return HEAP32[r1+8+((r2&1)<<2)>>2]}function _e80186_dma_get_src_hi(r1,r2){return HEAP32[r1+8+((r2&1)<<2)>>2]>>>16&15}function _e80186_dma_set_src_hi(r1,r2,r3){var r4;r4=r1+8+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&65535|(r3&65535)<<16&983040;return}function _e80186_dma_get_src_lo(r1,r2){return HEAP32[r1+8+((r2&1)<<2)>>2]&65535}function _e80186_dma_set_src_lo(r1,r2,r3){var r4;r4=r1+8+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r3&65535;return}function _e80186_dma_get_dst(r1,r2){return HEAP32[r1+16+((r2&1)<<2)>>2]}function _e80186_dma_get_dst_hi(r1,r2){return HEAP32[r1+16+((r2&1)<<2)>>2]>>>16&15}function _e80186_dma_set_dst_hi(r1,r2,r3){var r4;r4=r1+16+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&65535|(r3&65535)<<16&983040;return}function _e80186_dma_get_dst_lo(r1,r2){return HEAP32[r1+16+((r2&1)<<2)>>2]&65535}function _e80186_dma_set_dst_lo(r1,r2,r3){var r4;r4=r1+16+((r2&1)<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&-65536|r3&65535;return}function _e80186_dma_get_control(r1,r2){return HEAP16[r1+((r2&1)<<1)>>1]}function _e80186_dma_set_control(r1,r2,r3){var r4,r5;r4=r2&1;do{if((r4|0)==0){r2=r1+80|0;if((HEAP8[r2]|0)==0){break}HEAP8[r2]=0;r2=HEAP32[r1+88>>2];if((r2|0)==0){break}FUNCTION_TABLE[r2](HEAP32[r1+84>>2],0)}else{r2=r1+92|0;if((HEAP8[r2]|0)==0){break}HEAP8[r2]=0;r2=HEAP32[r1+100>>2];if((r2|0)==0){break}FUNCTION_TABLE[r2](HEAP32[r1+96>>2],0)}}while(0);r2=r1+(r4<<1)|0;if((r3&4)==0){r5=HEAP16[r2>>1]&2|r3&-3}else{r5=r3}HEAP16[r2>>1]=r5;r5=r1+26|0;HEAP8[r5]=HEAPU8[r5]|1<<r4;return}function _e80186_dma_get_count(r1,r2){return HEAP16[r1+4+((r2&1)<<1)>>1]}function _e80186_dma_set_count(r1,r2,r3){var r4;do{if((r2|0)==0){r4=r1+80|0;if((HEAP8[r4]|0)==0){break}HEAP8[r4]=0;r4=HEAP32[r1+88>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+84>>2],0)}else{r4=r1+92|0;if((HEAP8[r4]|0)==0){break}HEAP8[r4]=0;r4=HEAP32[r1+100>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+96>>2],0)}}while(0);HEAP16[r1+4+((r2&1)<<1)>>1]=r3;return}function _e80186_dma_clock2(r1,r2){var r3,r4,r5,r6;r3=0;r4=r1+28|0;r5=r2;r2=HEAP32[r4>>2];while(1){if(r5>>>0<r2>>>0){break}HEAP32[r4>>2]=0;_e80186_dma_clock_chn(r1,0);_e80186_dma_clock_chn(r1,1);r6=HEAP32[r4>>2];if((r6|0)==0){r3=5;break}else{r5=r5-r2|0;r2=r6}}if(r3==5){return}HEAP32[r4>>2]=r2-r5;return}function _e80186_dma_clock_chn(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=1<<r2;r4=r1+26|0;r5=HEAPU8[r4]&(r3^255);HEAP8[r4]=r5;r6=r1+(r2<<1)|0;r7=HEAPU16[r6>>1];if((r7&2|0)==0){return}r8=r7>>>6&3;do{if((r8|0)!=0){if((r7&16|0)!=0){return}if((HEAP8[r2+(r1+24)|0]|0)!=0){break}return}}while(0);HEAP8[r4]=r5|r3;r3=r7&1;r5=(r3|0)!=0;do{if((r7&4096|0)==0){if(r5){r4=HEAP32[r1+64>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+56>>2],HEAP32[r1+8+(r2<<2)>>2]);break}else{r4=HEAP32[r1+60>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+56>>2],HEAP32[r1+8+(r2<<2)>>2])&255;break}}else{if(r5){r4=HEAP32[r1+40>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+32>>2],HEAP32[r1+8+(r2<<2)>>2]);break}else{r4=HEAP32[r1+36>>2];if((r4|0)==0){r9=0;break}r9=FUNCTION_TABLE[r4](HEAP32[r1+32>>2],HEAP32[r1+8+(r2<<2)>>2])&255;break}}}while(0);do{if((r7&32768|0)==0){if(r5){r4=HEAP32[r1+76>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+68>>2],HEAP32[r1+16+(r2<<2)>>2],r9);break}else{r4=HEAP32[r1+72>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+68>>2],HEAP32[r1+16+(r2<<2)>>2],r9&255);break}}else{if(r5){r4=HEAP32[r1+52>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+44>>2],HEAP32[r1+16+(r2<<2)>>2],r9);break}else{r4=HEAP32[r1+48>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+44>>2],HEAP32[r1+16+(r2<<2)>>2],r9&255);break}}}while(0);r9=r3+1|0;r3=r7&3072;if((r3|0)==1024){r5=r1+8+(r2<<2)|0;HEAP32[r5>>2]=HEAP32[r5>>2]+r9}else if((r3|0)==2048){r3=r1+8+(r2<<2)|0;HEAP32[r3>>2]=HEAP32[r3>>2]-r9}r3=r7&24576;if((r3|0)==16384){r5=r1+16+(r2<<2)|0;HEAP32[r5>>2]=HEAP32[r5>>2]-r9}else if((r3|0)==8192){r3=r1+16+(r2<<2)|0;HEAP32[r3>>2]=HEAP32[r3>>2]+r9}r9=r1+4+(r2<<1)|0;r3=HEAPU16[r9>>1]+65535|0;HEAP16[r9>>1]=r3;do{if((r3&65535|0)==0){if((r7&512|0)==0){break}HEAP16[r6>>1]=HEAP16[r6>>1]&-3;if((r7&256|0)==0){break}if((r2|0)==0){r9=r1+80|0;if((HEAP8[r9]|0)==1){break}HEAP8[r9]=1;r9=HEAP32[r1+88>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+84>>2],1);break}else{r9=r1+92|0;if((HEAP8[r9]|0)==1){break}HEAP8[r9]=1;r9=HEAP32[r1+100>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+96>>2],1);break}}}while(0);r2=r1+28|0;r1=HEAP32[r2>>2];HEAP32[r2>>2]=r1+8;if((r8|0)!=2){return}HEAP32[r2>>2]=r1+10;return}function _e80186_icu_init(r1){var r2;HEAP16[r1>>1]=253;HEAP16[r1+2>>1]=0;HEAP16[r1+30>>1]=15;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=15;HEAP16[r1+36>>1]=15;HEAP16[r1+38>>1]=127;HEAP16[r1+40>>1]=127;HEAP16[r1+42>>1]=31;HEAP16[r1+44>>1]=31;HEAP8[r1+84|0]=0;HEAP32[r1+80>>2]=0;r2=r1+88|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;return}function _e80186_icu_set_intr_fct(r1,r2,r3){HEAP32[r1+80>>2]=r2;HEAP32[r1+88>>2]=r3;return}function _e80186_icu_set_inta0_fct(r1,r2,r3){HEAP32[r1+92>>2]=r2;HEAP32[r1+96>>2]=r3;return}function _e80186_icu_reset(r1){var r2;HEAP16[r1+4>>1]=0;HEAP16[r1+6>>1]=0;HEAP16[r1+8>>1]=0;HEAP16[r1+10>>1]=7;r2=r1+84|0;_memset(r1+12|0,0,18)|0;_memset(r1+48|0,0,32)|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+88>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+80>>2],0);return}function _e80186_icu_set_irq(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=1<<r2;r2=HEAPU16[r1>>1];r5=r4&65535;if((r5&~r2|0)!=0){return}r6=r1+2|0;r7=HEAPU16[r6>>1];do{if((r3|0)==0){if((r5&~r7|0)==0){r8=(r4|-65536)^65535;HEAP16[r6>>1]=r7&r8;r9=r1+4|0;r10=HEAPU16[r9>>1]&r8&65535;HEAP16[r9>>1]=r10;r11=r10;break}else{return}}else{if((r7&r5|0)==0){HEAP16[r6>>1]=r7|r4;r10=r1+4|0;r9=(HEAPU16[r10>>1]|r4)&65535;HEAP16[r10>>1]=r9;r11=r9;break}else{return}}}while(0);r4=r1+6|0;r7=r1+10|0;r6=r1+8|0;r5=r1+26|0;r3=7;r9=0;r10=0;while(1){r8=128>>>(r10>>>0);do{if((r8&r2|0)==0){r12=r9;r13=r3}else{if((HEAPU16[r4>>1]&r8|0)!=0){r12=r9;r13=r3;break}r14=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r14>>>0>r3>>>0){r12=r9;r13=r3;break}if(r14>>>0>(HEAP16[r7>>1]&7)>>>0){r12=r9;r13=r3;break}if((HEAPU16[r6>>1]&r8|0)!=0){if((HEAP16[r5>>1]&64)==0){r12=0;r13=7;break}}r15=(r11&65535&r8|0)==0;r12=r15?r9:r8;r13=r15?r3:r14}}while(0);r8=r10+1|0;if(r8>>>0<8){r3=r13;r9=r12;r10=r8}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r12|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r12=HEAP32[r1+88>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_set_irq_tmr0(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=r2<<24>>24==0?r4&-2:r4|1;_e80186_icu_set_irq(r1,0,r2&255);return}function _e80186_icu_set_irq_tmr1(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=r2<<24>>24==0?r4&-3:r4|2;_e80186_icu_set_irq(r1,0,r2&255);return}function _e80186_icu_set_irq_tmr2(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP16[r3>>1];HEAP16[r3>>1]=r2<<24>>24==0?r4&-5:r4|4;_e80186_icu_set_irq(r1,0,r2&255);return}function _e80186_icu_set_irq_dma0(r1,r2){_e80186_icu_set_irq(r1,2,r2&255);return}function _e80186_icu_set_irq_dma1(r1,r2){_e80186_icu_set_irq(r1,3,r2&255);return}function _e80186_icu_set_irq_int0(r1,r2){_e80186_icu_set_irq(r1,4,r2&255);return}function _e80186_icu_get_icon(r1,r2){var r3;if(r2>>>0>7){r3=0;return r3}if((HEAPU16[r1>>1]&1<<r2|0)==0){r3=0;return r3}r3=HEAP16[r1+14+(r2<<1)>>1];return r3}function _e80186_icu_set_icon(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;if(r2>>>0>7){return}r4=r1|0;r5=1<<r2;if((HEAPU16[r4>>1]&r5|0)==0){return}HEAP16[r1+14+(r2<<1)>>1]=HEAP16[r1+30+(r2<<1)>>1]&r3;if((r3&8)==0){r3=r1+6|0;r2=HEAPU16[r3>>1]&(r5^65535)&65535;HEAP16[r3>>1]=r2;r6=r2}else{r2=r1+6|0;r3=(HEAPU16[r2>>1]|r5)&65535;HEAP16[r2>>1]=r3;r6=r3}r3=HEAPU16[r4>>1];r4=r1+10|0;r2=r1+8|0;r5=r1+4|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)==0){r12=r9;r13=r8}else{if((r6&65535&r11|0)!=0){r12=r9;r13=r8;break}r14=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r14>>>0>r8>>>0){r12=r9;r13=r8;break}if(r14>>>0>(HEAP16[r4>>1]&7)>>>0){r12=r9;r13=r8;break}if((HEAPU16[r2>>1]&r11|0)!=0){if((HEAP16[r7>>1]&64)==0){r12=0;r13=7;break}}r15=(HEAPU16[r5>>1]&r11|0)==0;r12=r15?r9:r11;r13=r15?r8:r14}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r13;r9=r12;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r12|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r12=HEAP32[r1+88>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_imr(r1){return HEAP16[r1+6>>1]}function _e80186_icu_set_imr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+6>>1]=r2;r3=r2&65535;r2=r1+14|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&1|0)==0?r4&-9:r4|8;r4=r1+16|0;r2=HEAP16[r4>>1];HEAP16[r4>>1]=(r3&2|0)==0?r2&-9:r2|8;r2=r1+18|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&4|0)==0?r4&-9:r4|8;r4=r1+20|0;r2=HEAP16[r4>>1];HEAP16[r4>>1]=(r3&8|0)==0?r2&-9:r2|8;r2=r1+22|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&16|0)==0?r4&-9:r4|8;r4=r1+24|0;r2=HEAP16[r4>>1];HEAP16[r4>>1]=(r3&32|0)==0?r2&-9:r2|8;r2=r1+26|0;r4=HEAP16[r2>>1];r5=(r3&64|0)==0?r4&-9:r4|8;HEAP16[r2>>1]=r5;r2=r1+28|0;r4=HEAP16[r2>>1];HEAP16[r2>>1]=(r3&128|0)==0?r4&-9:r4|8;r4=HEAPU16[r1>>1];r2=r1+10|0;r6=r1+8|0;r7=r1+4|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r4|0)==0){r12=r9;r13=r8}else{if((r3&r11|0)!=0){r12=r9;r13=r8;break}r14=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r14>>>0>r8>>>0){r12=r9;r13=r8;break}if(r14>>>0>(HEAP16[r2>>1]&7)>>>0){r12=r9;r13=r8;break}if((HEAPU16[r6>>1]&r11|0)!=0){if((r5&64)==0){r12=0;r13=7;break}}r15=(HEAPU16[r7>>1]&r11|0)==0;r12=r15?r9:r11;r13=r15?r8:r14}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r13;r9=r12;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r12|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r12=HEAP32[r1+88>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_pmr(r1){return HEAP16[r1+10>>1]}function _e80186_icu_set_pmr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+10>>1]=r2;r3=HEAPU16[r1>>1];r4=r1+6|0;r5=r1+8|0;r6=r1+4|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)==0){r12=r9;r13=r8}else{if((HEAPU16[r4>>1]&r11|0)!=0){r12=r9;r13=r8;break}r14=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r14>>>0>r8>>>0){r12=r9;r13=r8;break}if(r14>>>0>(r2&7)>>>0){r12=r9;r13=r8;break}if((HEAPU16[r5>>1]&r11|0)!=0){if((HEAP16[r7>>1]&64)==0){r12=0;r13=7;break}}r15=(HEAPU16[r6>>1]&r11|0)==0;r12=r15?r9:r11;r13=r15?r8:r14}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r13;r9=r12;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r12|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r12=HEAP32[r1+88>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_isr(r1){return HEAP16[r1+8>>1]}function _e80186_icu_set_isr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+8>>1]=r2;r3=HEAPU16[r1>>1];r4=r1+6|0;r5=r1+10|0;r6=r1+4|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)==0){r12=r9;r13=r8}else{if((HEAPU16[r4>>1]&r11|0)!=0){r12=r9;r13=r8;break}r14=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r14>>>0>r8>>>0){r12=r9;r13=r8;break}if(r14>>>0>(HEAP16[r5>>1]&7)>>>0){r12=r9;r13=r8;break}if((r2&65535&r11|0)!=0){if((HEAP16[r7>>1]&64)==0){r12=0;r13=7;break}}r15=(HEAPU16[r6>>1]&r11|0)==0;r12=r15?r9:r11;r13=r15?r8:r14}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r13;r9=r12;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r12|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r12=HEAP32[r1+88>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_irr(r1){return HEAP16[r1+4>>1]}function _e80186_icu_set_irr(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;HEAP16[r1+4>>1]=r2;r3=HEAPU16[r1>>1];r4=r1+6|0;r5=r1+10|0;r6=r1+8|0;r7=r1+26|0;r8=7;r9=0;r10=0;while(1){r11=128>>>(r10>>>0);do{if((r11&r3|0)==0){r12=r9;r13=r8}else{if((HEAPU16[r4>>1]&r11|0)!=0){r12=r9;r13=r8;break}r14=HEAP16[r1+14+(7-r10<<1)>>1]&7;if(r14>>>0>r8>>>0){r12=r9;r13=r8;break}if(r14>>>0>(HEAP16[r5>>1]&7)>>>0){r12=r9;r13=r8;break}if((HEAPU16[r6>>1]&r11|0)!=0){if((HEAP16[r7>>1]&64)==0){r12=0;r13=7;break}}r15=(r2&65535&r11|0)==0;r12=r15?r9:r11;r13=r15?r8:r14}}while(0);r11=r10+1|0;if(r11>>>0<8){r8=r13;r9=r12;r10=r11}else{break}}r10=r1+84|0;r9=HEAP8[r10];if((r12|0)==0){if(r9<<24>>24==0){return}HEAP8[r10]=0;r12=HEAP32[r1+88>>2];if((r12|0)==0){return}FUNCTION_TABLE[r12](HEAP32[r1+80>>2],0);return}else{if(r9<<24>>24==1){return}HEAP8[r10]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){return}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1);return}}function _e80186_icu_set_eoi(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=HEAP16[r1>>1];do{if(r2<<16>>16<0){r4=r3&65535;r5=r1+8|0;r6=7;r7=0;r8=0;while(1){r9=128>>>(r8>>>0);do{if((r9&r4|0)==0){r10=r7;r11=r6}else{if((HEAPU16[r5>>1]&r9|0)==0){r10=r7;r11=r6;break}r12=HEAP16[r1+14+(7-r8<<1)>>1]&7;r13=r12>>>0>r6>>>0;r10=r13?r7:r9;r11=r13?r6:r12}}while(0);r9=r8+1|0;if(r9>>>0<8){r6=r11;r7=r10;r8=r9}else{break}}if((r10|0)==0){return}else{HEAP16[r5>>1]=HEAPU16[r5>>1]&(r10^65535);r14=r5;break}}else{r14=r1+8|0}}while(0);r10=r3&65535;r3=r1+6|0;r11=r1+10|0;r2=r1+4|0;r8=r1+26|0;r7=7;r6=0;r4=0;while(1){r9=128>>>(r4>>>0);do{if((r9&r10|0)==0){r15=r6;r16=r7}else{if((HEAPU16[r3>>1]&r9|0)!=0){r15=r6;r16=r7;break}r12=HEAP16[r1+14+(7-r4<<1)>>1]&7;if(r12>>>0>r7>>>0){r15=r6;r16=r7;break}if(r12>>>0>(HEAP16[r11>>1]&7)>>>0){r15=r6;r16=r7;break}if((HEAPU16[r14>>1]&r9|0)!=0){if((HEAP16[r8>>1]&64)==0){r15=0;r16=7;break}}r13=(HEAPU16[r2>>1]&r9|0)==0;r15=r13?r6:r9;r16=r13?r7:r12}}while(0);r9=r4+1|0;if(r9>>>0<8){r7=r16;r6=r15;r4=r9}else{break}}r4=r1+84|0;r6=HEAP8[r4];if((r15|0)==0){if(r6<<24>>24==0){return}HEAP8[r4]=0;r15=HEAP32[r1+88>>2];if((r15|0)==0){return}FUNCTION_TABLE[r15](HEAP32[r1+80>>2],0);return}else{if(r6<<24>>24==1){return}HEAP8[r4]=1;r4=HEAP32[r1+88>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+80>>2],1);return}}function _e80186_icu_get_pollst(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;if((_e80186_icu_get_max_req(r1,0,0,r3)|0)!=0){r4=0;STACKTOP=r2;return r4}r4=(HEAP32[r3>>2]|32768)&65535;STACKTOP=r2;return r4}function _e80186_icu_get_max_req(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r5=HEAPU16[r1>>1];r6=r1+6|0;r7=r1+10|0;r8=r1+8|0;r9=r1+4|0;r10=r1+26|0;r11=7;r12=0;r13=-1;r14=0;while(1){r15=128>>>(r14>>>0);do{if((r5&r15|0)==0){r16=r13;r17=r12;r18=r11}else{if((HEAPU16[r6>>1]&r15|0)!=0){r16=r13;r17=r12;r18=r11;break}r19=7-r14|0;r20=HEAP16[r1+14+(r19<<1)>>1]&7;if(r20>>>0>r11>>>0){r16=r13;r17=r12;r18=r11;break}if(r20>>>0>(HEAP16[r7>>1]&7)>>>0){r16=r13;r17=r12;r18=r11;break}if((HEAPU16[r8>>1]&r15|0)!=0){if((HEAP16[r10>>1]&64)==0){r16=-1;r17=0;r18=7;break}}r21=(HEAPU16[r9>>1]&r15|0)==0;r16=r21?r13:r19;r17=r21?r12:r15;r18=r21?r11:r20}}while(0);r15=r14+1|0;if(r15>>>0<8){r11=r18;r12=r17;r13=r16;r14=r15}else{break}}if((r17|0)==0){r22=1;return r22}if((r2|0)!=0){HEAP32[r2>>2]=r16}if((r3|0)!=0){HEAP32[r3>>2]=r17}if((r4|0)==0){r22=0;return r22}HEAP32[r4>>2]=r16+8;if((r16|0)!=0){r22=0;return r22}r16=HEAPU16[r1+12>>1];if((r16&1|0)!=0){HEAP32[r4>>2]=8;r22=0;return r22}if((r16&2|0)!=0){HEAP32[r4>>2]=18;r22=0;return r22}if((r16&4|0)==0){r22=0;return r22}HEAP32[r4>>2]=19;r22=0;return r22}function _e80186_icu_get_poll(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r3=r2;r4=r2+8;r5=r2+16;if((_e80186_icu_get_max_req(r1,r3,r4,r5)|0)!=0){r6=0;STACKTOP=r2;return r6}r7=HEAP32[r3>>2];r3=r1+14+(r7<<1)|0;r8=HEAP32[r4>>2];if((HEAP16[r3>>1]&16)==0){r4=r1+4|0;HEAP16[r4>>1]=HEAPU16[r4>>1]&(r8^65535)}r4=r1+48+(r7<<2)|0;HEAP32[r4>>2]=HEAP32[r4>>2]+1;r4=r1+8|0;r9=HEAPU16[r4>>1]|r8;HEAP16[r4>>1]=r9;if((r7|0)==0){r4=r1+12|0;r8=HEAP16[r4>>1];HEAP16[r4>>1]=(r8+7&65535|-8)&r8}do{if((HEAP16[r3>>1]&32)!=0){if((r7|0)==5){r8=r1+104|0;if((HEAP32[r8>>2]|0)==0){break}r4=HEAPU16[r1>>1];r10=r1+6|0;r11=r1+10|0;r12=r1+4|0;r13=r1+26|0;r14=7;r15=0;r16=0;while(1){r17=128>>>(r16>>>0);do{if((r17&r4|0)==0){r18=r15;r19=r14}else{if((HEAPU16[r10>>1]&r17|0)!=0){r18=r15;r19=r14;break}r20=HEAP16[r1+14+(7-r16<<1)>>1]&7;if(r20>>>0>r14>>>0){r18=r15;r19=r14;break}if(r20>>>0>(HEAP16[r11>>1]&7)>>>0){r18=r15;r19=r14;break}if((r9&65535&r17|0)!=0){if((HEAP16[r13>>1]&64)==0){r18=0;r19=7;break}}r21=(HEAPU16[r12>>1]&r17|0)==0;r18=r21?r15:r17;r19=r21?r14:r20}}while(0);r17=r16+1|0;if(r17>>>0<8){r14=r19;r15=r18;r16=r17}else{break}}r16=r1+84|0;r15=HEAP8[r16];do{if((r18|0)==0){if(r15<<24>>24==0){break}HEAP8[r16]=0;r14=HEAP32[r1+88>>2];if((r14|0)==0){break}FUNCTION_TABLE[r14](HEAP32[r1+80>>2],0)}else{if(r15<<24>>24==1){break}HEAP8[r16]=1;r14=HEAP32[r1+88>>2];if((r14|0)==0){break}FUNCTION_TABLE[r14](HEAP32[r1+80>>2],1)}}while(0);r6=FUNCTION_TABLE[HEAP32[r8>>2]](HEAP32[r1+100>>2])&255;STACKTOP=r2;return r6}else if((r7|0)==4){r16=r1+96|0;if((HEAP32[r16>>2]|0)==0){break}r15=HEAPU16[r1>>1];r14=r1+6|0;r12=r1+10|0;r13=r1+4|0;r11=r1+26|0;r10=7;r4=0;r17=0;while(1){r20=128>>>(r17>>>0);do{if((r20&r15|0)==0){r22=r4;r23=r10}else{if((HEAPU16[r14>>1]&r20|0)!=0){r22=r4;r23=r10;break}r21=HEAP16[r1+14+(7-r17<<1)>>1]&7;if(r21>>>0>r10>>>0){r22=r4;r23=r10;break}if(r21>>>0>(HEAP16[r12>>1]&7)>>>0){r22=r4;r23=r10;break}if((r9&65535&r20|0)!=0){if((HEAP16[r11>>1]&64)==0){r22=0;r23=7;break}}r24=(HEAPU16[r13>>1]&r20|0)==0;r22=r24?r4:r20;r23=r24?r10:r21}}while(0);r20=r17+1|0;if(r20>>>0<8){r10=r23;r4=r22;r17=r20}else{break}}r17=r1+84|0;r4=HEAP8[r17];do{if((r22|0)==0){if(r4<<24>>24==0){break}HEAP8[r17]=0;r10=HEAP32[r1+88>>2];if((r10|0)==0){break}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],0)}else{if(r4<<24>>24==1){break}HEAP8[r17]=1;r10=HEAP32[r1+88>>2];if((r10|0)==0){break}FUNCTION_TABLE[r10](HEAP32[r1+80>>2],1)}}while(0);r6=FUNCTION_TABLE[HEAP32[r16>>2]](HEAP32[r1+92>>2])&255;STACKTOP=r2;return r6}else{break}}}while(0);r22=HEAPU16[r1>>1];r23=r1+6|0;r7=r1+10|0;r18=r1+4|0;r19=r1+26|0;r3=7;r17=0;r4=0;while(1){r10=128>>>(r4>>>0);do{if((r10&r22|0)==0){r25=r17;r26=r3}else{if((HEAPU16[r23>>1]&r10|0)!=0){r25=r17;r26=r3;break}r13=HEAP16[r1+14+(7-r4<<1)>>1]&7;if(r13>>>0>r3>>>0){r25=r17;r26=r3;break}if(r13>>>0>(HEAP16[r7>>1]&7)>>>0){r25=r17;r26=r3;break}if((r9&65535&r10|0)!=0){if((HEAP16[r19>>1]&64)==0){r25=0;r26=7;break}}r11=(HEAPU16[r18>>1]&r10|0)==0;r25=r11?r17:r10;r26=r11?r3:r13}}while(0);r10=r4+1|0;if(r10>>>0<8){r3=r26;r17=r25;r4=r10}else{break}}r4=r1+84|0;r17=HEAP8[r4];do{if((r25|0)==0){if(r17<<24>>24==0){break}HEAP8[r4]=0;r26=HEAP32[r1+88>>2];if((r26|0)==0){break}FUNCTION_TABLE[r26](HEAP32[r1+80>>2],0)}else{if(r17<<24>>24==1){break}HEAP8[r4]=1;r26=HEAP32[r1+88>>2];if((r26|0)==0){break}FUNCTION_TABLE[r26](HEAP32[r1+80>>2],1)}}while(0);r6=(HEAP32[r5>>2]|32768)&65535;STACKTOP=r2;return r6}function _e80186_icu_inta(r1){return _e80186_icu_get_poll(r1)&255}function _e80186_tcu_init(r1){var r2,r3;_memset(r1,0,21)|0;r2=r1+56|0;HEAP32[r1+88>>2]=0;HEAP32[r1+92>>2]=0;HEAP32[r1+96>>2]=0;r3=r1+24|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+24>>2]=0;HEAP8[r3+28|0]=0;r3=r2;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP32[r3+16>>2]=0;HEAP32[r3+20>>2]=0;HEAP32[r3+24>>2]=0;HEAP8[r3+28|0]=0;return}function _e80186_tcu_set_int_fct(r1,r2,r3,r4){HEAP32[r1+(r2<<5)+12>>2]=r3;HEAP32[r1+(r2<<5)+16>>2]=r4;return}function _e80186_tcu_set_out_fct(r1,r2,r3,r4){HEAP32[r1+(r2<<5)+24>>2]=r3;HEAP32[r1+(r2<<5)+28>>2]=r4;return}function _e80186_tcu_get_control(r1,r2){return HEAP16[r1+(r2<<5)>>1]}function _e80186_tcu_set_control(r1,r2,r3){var r4,r5,r6;r4=r1+(r2<<5)|0;if((r3&16384)==0){r2=HEAP16[r4>>1];r5=r2&-32768|r3&32767;r6=r2}else{r5=r3;r6=HEAP16[r4>>1]}HEAP16[r4>>1]=r6&4096|r5&-4097;return}function _e80186_tcu_get_count(r1,r2){return HEAP16[r1+(r2<<5)+2>>1]}function _e80186_tcu_set_count(r1,r2,r3){HEAP16[r1+(r2<<5)+2>>1]=r3;return}function _e80186_tcu_get_max_count_a(r1,r2){return HEAP16[r1+(r2<<5)+4>>1]}function _e80186_tcu_set_max_count_a(r1,r2,r3){HEAP16[r1+(r2<<5)+4>>1]=r3;return}function _e80186_tcu_get_max_count_b(r1,r2){return HEAP16[r1+(r2<<5)+6>>1]}function _e80186_tcu_set_max_count_b(r1,r2,r3){HEAP16[r1+(r2<<5)+6>>1]=r3;return}function _e80186_tcu_set_input(r1,r2,r3){HEAP8[r1+(r2<<5)+8|0]=r3<<24>>24!=0|0;return}function _e80186_tcu_reset(r1){var r2,r3;HEAP8[r1+10|0]=0;r2=r1;r3=r2|0;tempBigInt=0;HEAP16[r3>>1]=tempBigInt;HEAP16[r3+2>>1]=tempBigInt>>16;r3=r2+4|0;tempBigInt=0;HEAP16[r3>>1]=tempBigInt;HEAP16[r3+2>>1]=tempBigInt>>16;HEAP8[r1+42|0]=0;r3=r1+32|0;r2=r3|0;tempBigInt=0;HEAP16[r2>>1]=tempBigInt;HEAP16[r2+2>>1]=tempBigInt>>16;r2=r3+4|0;tempBigInt=0;HEAP16[r2>>1]=tempBigInt;HEAP16[r2+2>>1]=tempBigInt>>16;HEAP8[r1+74|0]=0;r2=r1+64|0;r1=r2|0;tempBigInt=0;HEAP16[r1>>1]=tempBigInt;HEAP16[r1+2>>1]=tempBigInt>>16;r1=r2+4|0;tempBigInt=0;HEAP16[r1>>1]=tempBigInt;HEAP16[r1+2>>1]=tempBigInt>>16;return}function _e80186_tcu_clock(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;if((r2|0)==0){return}r4=r1+96|0;r5=r1+74|0;r6=r2;r2=HEAP32[r4>>2];while(1){r7=r2&3;L6:do{if((r7|0)!=3){r8=r1+(r7<<5)|0;r9=HEAP16[r8>>1];r10=r1+(r7<<5)+9|0;r11=HEAP8[r10];r12=HEAP8[r1+(r7<<5)+8|0];HEAP8[r10]=r12;r10=r1+(r7<<5)+10|0;HEAP8[r10]=0;r13=r9&65535;if((r13&32768|0)==0){break}do{if((r13&4|0)==0){do{if((r13&16|0)==0){if(r12<<24>>24==0){break L6}}else{if(r11<<24>>24!=0|r12<<24>>24==0){break}HEAP16[r1+(r7<<5)+2>>1]=0;break L6}}while(0);if((r13&8|0)==0){break}if((HEAP8[r5]|0)==0){break L6}}else{if(r11<<24>>24!=0|r12<<24>>24==0){break L6}}}while(0);r12=r1+(r7<<5)+2|0;r11=HEAP16[r12>>1]+1&65535;HEAP16[r12>>1]=r11;do{if((r13&2|0)==0){if((HEAP16[r1+(r7<<5)+4>>1]|0)!=r11<<16>>16){break L6}r14=r1+(r7<<5)+20|0;do{if((HEAP8[r14]|0)==0){r15=r1+(r7<<5)+28|0;r3=30}else{HEAP8[r14]=0;r16=r1+(r7<<5)+28|0;r17=HEAP32[r16>>2];if((r17|0)==0){r15=r16;r3=30;break}FUNCTION_TABLE[r17](HEAP32[r1+(r7<<5)+24>>2],0);if((HEAP8[r14]|0)!=1){r15=r16;r3=30}}}while(0);do{if(r3==30){r3=0;HEAP8[r14]=1;r16=HEAP32[r15>>2];if((r16|0)==0){break}FUNCTION_TABLE[r16](HEAP32[r1+(r7<<5)+24>>2],1)}}while(0);if((r13&1|0)!=0){break}HEAP16[r8>>1]=HEAP16[r8>>1]&32767}else{if((r13&4096|0)==0){if((HEAP16[r1+(r7<<5)+4>>1]|0)!=r11<<16>>16){break L6}HEAP16[r8>>1]=r9|4096;r14=r1+(r7<<5)+20|0;if((HEAP8[r14]|0)==0){break}HEAP8[r14]=0;r14=HEAP32[r1+(r7<<5)+28>>2];if((r14|0)==0){break}FUNCTION_TABLE[r14](HEAP32[r1+(r7<<5)+24>>2],0);break}if((HEAP16[r1+(r7<<5)+6>>1]|0)!=r11<<16>>16){break L6}HEAP16[r8>>1]=r9&-4097;r14=r1+(r7<<5)+20|0;do{if((HEAP8[r14]|0)!=1){HEAP8[r14]=1;r16=HEAP32[r1+(r7<<5)+28>>2];if((r16|0)==0){break}FUNCTION_TABLE[r16](HEAP32[r1+(r7<<5)+24>>2],1)}}while(0);if((r13&1|0)!=0){break}HEAP16[r8>>1]=HEAP16[r8>>1]&32767}}while(0);HEAP16[r12>>1]=0;HEAP16[r8>>1]=HEAP16[r8>>1]|32;HEAP8[r10]=1;if((r13&8192|0)==0){break}r9=r1+(r7<<5)+11|0;do{if((HEAP8[r9]|0)==0){r18=r1+(r7<<5)+16|0}else{HEAP8[r9]=0;r11=r1+(r7<<5)+16|0;r14=HEAP32[r11>>2];if((r14|0)==0){r18=r11;break}FUNCTION_TABLE[r14](HEAP32[r1+(r7<<5)+12>>2],0);if((HEAP8[r9]|0)==1){break L6}else{r18=r11}}}while(0);HEAP8[r9]=1;r13=HEAP32[r18>>2];if((r13|0)==0){break}FUNCTION_TABLE[r13](HEAP32[r1+(r7<<5)+12>>2],1)}}while(0);r7=HEAP32[r4>>2]+1|0;HEAP32[r4>>2]=r7;r13=r6-1|0;if((r13|0)==0){break}else{r6=r13;r2=r7}}return}function _e8255_init(r1){var r2;HEAP8[r1|0]=0;HEAP8[r1+1|0]=0;HEAP8[r1+2|0]=-128;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=0;HEAP8[r1+6|0]=0;r2=r1+8|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP16[r2+16>>1]=0;HEAP8[r2+18|0]=0;r2=r1+28|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP16[r2+16>>1]=0;HEAP8[r2+18|0]=0;r2=r1+48|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;return}function _e8255_get_inp(r1,r2){var r3,r4,r5,r6,r7;r3=r1+4+(r2*20&-1)|0;r4=r1+4+(r2*20&-1)+2|0;r5=HEAP8[r4];do{if(r5<<24>>24==0){r6=0}else{r7=HEAP32[r1+4+(r2*20&-1)+8>>2];if((r7|0)==0){r6=r5;break}HEAP8[r3|0]=FUNCTION_TABLE[r7](HEAP32[r1+4+(r2*20&-1)+4>>2]);r6=HEAP8[r4]}}while(0);return HEAP8[r1+4+(r2*20&-1)+1|0]&~r6|r6&HEAP8[r3|0]}function _e8255_get_out(r1,r2){return HEAP8[r1+4+(r2*20&-1)+2|0]|HEAP8[r1+4+(r2*20&-1)+1|0]}function _e8255_set_inp_a(r1,r2){HEAP8[r1+4|0]=r2;return}function _e8255_set_inp_b(r1,r2){HEAP8[r1+24|0]=r2;return}function _e8255_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8;if((r2|0)==0){HEAP8[r1+5|0]=r3;r4=HEAP8[r1+6|0];if(r4<<24>>24==-1){return}r5=HEAP32[r1+20>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+16>>2],~r4&r3);return}else if((r2|0)==1){HEAP8[r1+25|0]=r3;r4=HEAP8[r1+26|0];if(r4<<24>>24==-1){return}r5=HEAP32[r1+40>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+36>>2],~r4&r3);return}else if((r2|0)==3){r4=r3&255;if((r4&128|0)!=0){HEAP8[r1+2|0]=r3;HEAP8[r1|0]=(r3&255)>>>5&3;HEAP8[r1+1|0]=(r3&255)>>>2&1;HEAP8[r1+6|0]=r4<<27>>31;HEAP8[r1+26|0]=r4<<30>>31;HEAP8[r1+46|0]=((r4&1|0)!=0?15:0)|((r4&8|0)!=0?-16:0);return}r5=r1+45|0;r6=HEAPU8[r5];r7=1<<(r4>>>1&7);if((r4&1|0)==0){r8=r6&(r7^255)&255}else{r8=(r6|r7)&255}HEAP8[r5]=r8;r5=HEAP8[r1+46|0];if(r5<<24>>24==-1){return}r7=HEAP32[r1+60>>2];if((r7|0)==0){return}FUNCTION_TABLE[r7](HEAP32[r1+56>>2],r8&~r5);return}else if((r2|0)==2){HEAP8[r1+45|0]=r3;r2=HEAP8[r1+46|0];if(r2<<24>>24==-1){return}r5=HEAP32[r1+60>>2];if((r5|0)==0){return}FUNCTION_TABLE[r5](HEAP32[r1+56>>2],~r2&r3);return}else{return}}function _e8255_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;if((r2|0)==0){r3=r1+4|0;r4=r1+6|0;r5=HEAP8[r4];do{if(r5<<24>>24==0){r6=0}else{r7=HEAP32[r1+12>>2];if((r7|0)==0){r6=r5;break}HEAP8[r3|0]=FUNCTION_TABLE[r7](HEAP32[r1+8>>2]);r6=HEAP8[r4]}}while(0);r8=HEAP8[r1+5|0]&~r6|HEAP8[r3|0]&r6;return r8}else if((r2|0)==1){r6=r1+24|0;r3=r1+26|0;r4=HEAP8[r3];do{if(r4<<24>>24==0){r9=0}else{r5=HEAP32[r1+32>>2];if((r5|0)==0){r9=r4;break}HEAP8[r6|0]=FUNCTION_TABLE[r5](HEAP32[r1+28>>2]);r9=HEAP8[r3]}}while(0);r8=HEAP8[r1+25|0]&~r9|HEAP8[r6|0]&r9;return r8}else if((r2|0)==3){r8=HEAP8[r1+2|0];return r8}else if((r2|0)==2){r2=r1+44|0;r9=r1+46|0;r6=HEAP8[r9];do{if(r6<<24>>24==0){r10=0}else{r3=HEAP32[r1+52>>2];if((r3|0)==0){r10=r6;break}HEAP8[r2|0]=FUNCTION_TABLE[r3](HEAP32[r1+48>>2]);r10=HEAP8[r9]}}while(0);r8=HEAP8[r1+45|0]&~r10|HEAP8[r2|0]&r10;return r8}else{r8=0;return r8}}function _e8259_init(r1){var r2;HEAP32[r1+12>>2]=0;HEAP32[r1+16>>2]=0;r2=r1|0;HEAP8[r2]=0;HEAP8[r2+1|0]=0;HEAP8[r2+2|0]=0;HEAP8[r2+3|0]=0;HEAP8[r2+4|0]=0;HEAP8[r2+5|0]=0;HEAP8[r2+6|0]=0;HEAP32[r1+20>>2]=1;HEAP8[r1+7|0]=0;HEAP8[r1+8|0]=-1;HEAP8[r1+9|0]=0;HEAP8[r1+10|0]=0;_memset(r1+24|0,0,49)|0;return}function _e8259_set_irq0(r1,r2){_e8259_set_irq(r1,0,r2<<24>>24!=0|0);return}function _e8259_set_irq1(r1,r2){_e8259_set_irq(r1,1,r2<<24>>24!=0|0);return}function _e8259_set_irq2(r1,r2){_e8259_set_irq(r1,2,r2<<24>>24!=0|0);return}function _e8259_set_irq3(r1,r2){_e8259_set_irq(r1,3,r2<<24>>24!=0|0);return}function _e8259_set_irq4(r1,r2){_e8259_set_irq(r1,4,r2<<24>>24!=0|0);return}function _e8259_set_irq5(r1,r2){_e8259_set_irq(r1,5,r2<<24>>24!=0|0);return}function _e8259_set_irq6(r1,r2){_e8259_set_irq(r1,6,r2<<24>>24!=0|0);return}function _e8259_set_irq7(r1,r2){_e8259_set_irq(r1,7,r2<<24>>24!=0|0);return}function _e8259_set_int_fct(r1,r2,r3){HEAP32[r1+64>>2]=r2;HEAP32[r1+68>>2]=r3;return}function _e8259_set_irq(r1,r2,r3){var r4,r5,r6,r7,r8;r4=1<<(r2&7);r2=r1+10|0;r5=HEAPU8[r2];if(!((r4&r5|0)!=0^r3<<24>>24!=0)){return}if(r3<<24>>24==0){r3=(r4|-256)^255;HEAP8[r2]=r5&r3;r6=r1+7|0;r7=HEAPU8[r6]&r3&255;HEAP8[r6]=r7;r8=r7}else{HEAP8[r2]=r5|r4;r5=r1+7|0;r2=(HEAPU8[r5]|r4)&255;HEAP8[r5]=r2;r8=r2}r2=~HEAPU8[r1+8|0];r5=r8&255&r2;if((r5|0)==0){r8=r1+72|0;if((HEAP8[r8]|0)==0){return}HEAP8[r8]=0;r8=HEAP32[r1+68>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+64>>2],0);return}r8=HEAPU8[r1+9|0]&r2;r2=1<<HEAP32[r1+24>>2];L18:do{if((r8&r2|0)==0){r4=r2;while(1){if((r4&r5|0)!=0){break}r7=r4<<1|r4>>>7;if((r7&r8|0)==0){r4=r7&255}else{break L18}}r4=r1+72|0;if((HEAP8[r4]|0)==1){return}HEAP8[r4]=1;r4=HEAP32[r1+68>>2];if((r4|0)==0){return}FUNCTION_TABLE[r4](HEAP32[r1+64>>2],1);return}}while(0);r8=r1+72|0;if((HEAP8[r8]|0)==0){return}HEAP8[r8]=0;r8=HEAP32[r1+68>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+64>>2],0);return}function _e8259_inta(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=r1+72|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+68>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+64>>2],0)}}while(0);r3=r1+7|0;r4=HEAP8[r3];r5=r1+8|0;r6=r4&~HEAP8[r5];if(r6<<24>>24==0){_fwrite(11600,24,1,HEAP32[_stderr>>2]);r7=HEAP32[r1+12>>2]+7&255;return r7}r8=r6&255;r6=r1+24|0;r9=HEAP32[r6>>2];r10=(r8<<8|r8)>>>((r9&7)>>>0);if((r10&1|0)==0){r8=r9;r11=r10;while(1){r10=r11>>>1;r12=r8+1|0;if((r10&1|0)==0){r8=r12;r11=r10}else{r13=r12;break}}}else{r13=r9}r9=r13&7;r11=1<<r9;HEAP8[r3]=(r11^255)&(r4&255);do{if((HEAP8[r1+3|0]&2)==0){r4=r1+9|0;HEAP8[r4]=HEAPU8[r4]|r11}else{if((HEAP32[r1+28>>2]|0)==0){break}HEAP32[r6>>2]=r13+1&7}}while(0);r13=r1+32+(r9<<2)|0;HEAP32[r13>>2]=HEAP32[r13>>2]+1;r13=~HEAPU8[r5];r5=HEAPU8[r3]&r13;L18:do{if((r5|0)==0){if((HEAP8[r2]|0)==0){break}HEAP8[r2]=0;r3=HEAP32[r1+68>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+64>>2],0)}else{r3=HEAPU8[r1+9|0]&r13;r11=1<<HEAP32[r6>>2];L23:do{if((r3&r11|0)==0){r4=r11;while(1){if((r4&r5|0)!=0){break}r8=r4<<1|r4>>>7;if((r8&r3|0)==0){r4=r8&255}else{break L23}}if((HEAP8[r2]|0)==1){break L18}HEAP8[r2]=1;r4=HEAP32[r1+68>>2];if((r4|0)==0){break L18}FUNCTION_TABLE[r4](HEAP32[r1+64>>2],1);break L18}}while(0);if((HEAP8[r2]|0)==0){break}HEAP8[r2]=0;r3=HEAP32[r1+68>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+64>>2],0)}}while(0);r7=HEAP32[r1+12>>2]+r9&255;return r7}function _e8259_get_irr(r1){return HEAP8[r1+7|0]}function _e8259_get_imr(r1){return HEAP8[r1+8|0]}function _e8259_get_isr(r1){return HEAP8[r1+9|0]}function _e8259_get_icw(r1,r2){var r3;if(r2>>>0<4){r3=HEAP8[r1+r2|0]}else{r3=0}return r3}function _e8259_get_ocw(r1,r2){var r3;if(r2>>>0<3){r3=HEAP8[r2+(r1+4)|0]}else{r3=0}return r3}function _e8259_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158,r159,r160,r161,r162,r163,r164;r4=0;L1:do{if((r2|0)==0){r5=r3&255;r6=r5&16;r7=(r6|0)==0;if(!r7){r8=r1|0;HEAP8[r8]=r3;r9=r1+1|0;r10=r1+12|0;HEAP32[r10>>2]=0;r11=r1+16|0;HEAP8[r9]=0;HEAP8[r9+1|0]=0;HEAP8[r9+2|0]=0;HEAP8[r9+3|0]=0;HEAP8[r9+4|0]=0;HEAP8[r9+5|0]=0;HEAP32[r11>>2]=1;r12=r1+20|0;HEAP32[r12>>2]=1;r13=r1+24|0;HEAP32[r13>>2]=0;r14=r1+28|0;HEAP32[r14>>2]=0;r15=r1+8|0;HEAP8[r15]=0;r16=r1+9|0;HEAP8[r16]=0;break}r17=r5&24;r18=(r17|0)==0;if(!r18){r19=r5&152;r20=(r19|0)==8;if(!r20){break}r21=r1+6|0;HEAP8[r21]=r3;r22=r5&2;r23=(r22|0)==0;do{if(!r23){r24=r5&1;r25=(r24|0)==0;r26=r1+20|0;if(r25){HEAP32[r26>>2]=1;break}else{HEAP32[r26>>2]=0;break}}}while(0);r27=r5&4;r28=(r27|0)==0;if(!r28){r29=HEAP32[_stderr>>2];r30=_fwrite(20320,20,1,r29)}r31=r5&96;r32=(r31|0)==96;if(!r32){break}r33=HEAP32[_stderr>>2];r34=_fwrite(17768,33,1,r33);break}r35=r1+5|0;HEAP8[r35]=r3;r36=r1+9|0;r37=HEAP8[r36];r38=r37<<24>>24==0;if(r38){r39=255}else{r40=r37&255;r41=r40<<8;r42=r41|r40;r43=r1+24|0;r44=HEAP32[r43>>2];r45=r44&7;r46=r42>>>(r45>>>0);r47=r46&1;r48=(r47|0)==0;if(r48){r49=r44;r50=r46;while(1){r51=r50>>>1;r52=r49+1|0;r53=r51&1;r54=(r53|0)==0;if(r54){r49=r52;r50=r51}else{r55=r52;break}}}else{r55=r44}r56=r55&7;r39=r56}r57=r39&7;r58=1<<r57;r59=r5>>>5;switch(r59|0){case 5:{r60=r39>>>0<16;if(!r60){break L1}r61=r58^255;r62=r37&255;r63=r61&r62;r64=r63&255;HEAP8[r36]=r64;r65=r39+1|0;r66=r65&7;r67=r1+24|0;HEAP32[r67>>2]=r66;break L1;break};case 3:{r68=r5&7;r69=1<<r68;r70=r69^255;r71=r37&255;r72=r71&r70;r73=r72&255;HEAP8[r36]=r73;break L1;break};case 7:{r74=r5&7;r75=1<<r74;r76=r75^255;r77=r37&255;r78=r77&r76;r79=r78&255;HEAP8[r36]=r79;r80=r5+1|0;r81=r80&7;r82=r1+24|0;HEAP32[r82>>2]=r81;break L1;break};case 6:{r83=r5+1|0;r84=r83&7;r85=r1+24|0;HEAP32[r85>>2]=r84;break L1;break};case 0:{r86=r1+28|0;HEAP32[r86>>2]=0;break L1;break};case 1:{r87=r39>>>0<16;if(!r87){break L1}r88=r58^255;r89=r37&255;r90=r88&r89;r91=r90&255;HEAP8[r36]=r91;break L1;break};case 4:{r92=r1+28|0;HEAP32[r92>>2]=1;break L1;break};default:{break L1}}}else if((r2|0)==1){r93=r1+16|0;r94=HEAP32[r93>>2];if((r94|0)==3){r95=r1+3|0;HEAP8[r95]=r3;HEAP32[r93>>2]=0;break}else if((r94|0)==2){r96=r1+2|0;HEAP8[r96]=r3;r97=r1|0;r98=HEAP8[r97];r99=r98&1;r100=r99<<24>>24==0;if(r100){HEAP32[r93>>2]=0;break}else{HEAP32[r93>>2]=3;break}}else if((r94|0)==1){r101=r1+1|0;HEAP8[r101]=r3;r102=r3&255;r103=r102&248;r104=r1+12|0;HEAP32[r104>>2]=r103;r105=r1|0;r106=HEAP8[r105];r107=r106&255;r108=r107&2;r109=(r108|0)==0;if(r109){HEAP32[r93>>2]=2;break}r110=r107&1;r111=(r110|0)==0;if(r111){HEAP32[r93>>2]=0;break}else{HEAP32[r93>>2]=3;break}}else if((r94|0)==0){r112=r1+4|0;HEAP8[r112]=r3;r113=r1+8|0;HEAP8[r113]=r3;break}else{break}}}while(0);r114=r1+7|0;r115=HEAP8[r114];r116=r115&255;r117=r1+8|0;r118=HEAP8[r117];r119=r118&255;r120=~r119;r121=r116&r120;r122=(r121|0)==0;if(r122){r123=r1+72|0;r124=HEAP8[r123];r125=r124<<24>>24==0;if(r125){return}HEAP8[r123]=0;r126=r1+68|0;r127=HEAP32[r126>>2];r128=(r127|0)==0;if(r128){return}r129=r1+64|0;r130=HEAP32[r129>>2];FUNCTION_TABLE[r127](r130,0);return}r131=r1+9|0;r132=HEAP8[r131];r133=r132&255;r134=r133&r120;r135=r1+24|0;r136=HEAP32[r135>>2];r137=1<<r136;r138=r134&r137;r139=(r138|0)==0;L63:do{if(r139){r140=r137;while(1){r141=r140&r121;r142=(r141|0)==0;if(!r142){break}r143=r140<<1;r144=r140>>>7;r145=r143|r144;r146=r145&255;r147=r145&r134;r148=(r147|0)==0;if(r148){r140=r146}else{break L63}}r149=r1+72|0;r150=HEAP8[r149];r151=r150<<24>>24==1;if(r151){return}HEAP8[r149]=1;r152=r1+68|0;r153=HEAP32[r152>>2];r154=(r153|0)==0;if(r154){return}r155=r1+64|0;r156=HEAP32[r155>>2];FUNCTION_TABLE[r153](r156,1);return}}while(0);r157=r1+72|0;r158=HEAP8[r157];r159=r158<<24>>24==0;if(r159){return}HEAP8[r157]=0;r160=r1+68|0;r161=HEAP32[r160>>2];r162=(r161|0)==0;if(r162){return}r163=r1+64|0;r164=HEAP32[r163>>2];FUNCTION_TABLE[r161](r164,0);return}function _e8259_get_uint8(r1,r2){var r3;if((r2|0)==0){r3=HEAP8[(HEAP32[r1+20>>2]|0)==0?r1+9|0:r1+7|0];return r3}else if((r2|0)==1){r3=HEAP8[r1+8|0];return r3}else{r3=-1;return r3}}function _e8259_reset(r1){var r2;r2=r1|0;HEAP8[r2]=0;HEAP8[r2+1|0]=0;HEAP8[r2+2|0]=0;HEAP8[r2+3|0]=0;HEAP8[r2+4|0]=0;HEAP8[r2+5|0]=0;HEAP8[r2+6|0]=0;HEAP32[r1+12>>2]=8;HEAP32[r1+16>>2]=0;HEAP32[r1+20>>2]=1;HEAP8[r1+7|0]=0;HEAP8[r1+8|0]=-1;HEAP8[r1+9|0]=0;HEAP32[r1+24>>2]=0;HEAP32[r1+28>>2]=0;r2=r1+72|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;r2=HEAP32[r1+68>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](HEAP32[r1+64>>2],0);return}function _wd179x_init(r1){var r2,r3;r2=r1+72|0;HEAP8[r2|0]=1;HEAP8[r1+73|0]=0;HEAP8[r1+96|0]=0;HEAP32[r1+100>>2]=0;HEAP32[r1+104>>2]=0;r3=r1+76|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;HEAP8[r1+32876|0]=1;HEAP8[r1+32877|0]=0;HEAP32[r1+32880>>2]=1;HEAP32[r1+32884>>2]=0;HEAP32[r1+32888>>2]=0;HEAP32[r1+32892>>2]=0;HEAP8[r1+32900|0]=0;HEAP32[r1+32904>>2]=0;HEAP32[r1+32908>>2]=0;HEAP8[r1|0]=0;HEAP8[r1+1|0]=0;HEAP32[r1+60>>2]=1e6;HEAP32[r1+64>>2]=1e6;HEAP32[r1+65680>>2]=r2;HEAP32[r1+65720>>2]=0;HEAP32[r1+65724>>2]=0;HEAP8[r1+65728|0]=0;HEAP32[r1+65732>>2]=0;HEAP32[r1+65736>>2]=0;r2=r1+65688|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP32[r2+12>>2]=0;HEAP32[r2+16>>2]=0;HEAP32[r2+20>>2]=0;HEAP32[r2+24>>2]=0;HEAP8[r2+28|0]=0;return}function _wd179x_set_irq_fct(r1,r2,r3){HEAP32[r1+65720>>2]=r2;HEAP32[r1+65724>>2]=r3;return}function _wd179x_set_drq_fct(r1,r2,r3){HEAP32[r1+65732>>2]=r2;HEAP32[r1+65736>>2]=r3;return}function _wd179x_set_read_track_fct(r1,r2,r3){HEAP32[r1+65700>>2]=r2;HEAP32[r1+65704>>2]=r3;return}function _wd179x_set_write_track_fct(r1,r2,r3){HEAP32[r1+65708>>2]=r2;HEAP32[r1+65712>>2]=r3;return}function _wd179x_set_input_clock(r1,r2){HEAP32[r1+60>>2]=r2;return}function _wd179x_set_bit_clock(r1,r2){HEAP32[r1+64>>2]=r2;return}function _wd179x_reset(r1){var r2;HEAP8[r1+2|0]=0;HEAP8[r1+3|0]=0;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=1;HEAP8[r1+7|0]=1;r2=r1+8|0;tempBigInt=0;HEAP8[r2]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+2|0]=tempBigInt;tempBigInt=tempBigInt>>8;HEAP8[r2+3|0]=tempBigInt;HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP16[r1+32>>1]=0;r2=r1+16|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP16[r2+8>>1]=0;HEAP8[r2+10|0]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+36>>2]=0;HEAP16[r1+40>>1]=0;HEAP16[r1+42>>1]=1;HEAP32[r1+88>>2]=0;HEAP32[r1+92>>2]=0;HEAP32[r1+32892>>2]=0;HEAP32[r1+32896>>2]=0;HEAP32[r1+65684>>2]=0;HEAP32[r1+65692>>2]=0;HEAP32[r1+65696>>2]=0;r2=r1+44|0;HEAP32[r2>>2]=0;HEAP32[r2+4>>2]=0;HEAP32[r2+8>>2]=0;HEAP16[r2+12>>1]=0;return}function _wd179x_set_ready(r1,r2,r3){HEAP8[r1+72+((r2&1)*32804&-1)|0]=(r3|0)!=0|0;HEAP8[r1|0]=1;return}function _wd179x_set_motor(r1,r2,r3){var r4;if(r2>>>0>1){return}r4=(r3|0)!=0;r3=r1+72+(r2*32804&-1)+2|0;if((HEAPU8[r3]|0)==(r4&1|0)){return}HEAP8[r3]=r4&1;if(!r4){HEAP32[r1+72+(r2*32804&-1)+16>>2]=0}HEAP8[r1|0]=1;return}function _wd179x_get_status(r1){var r2,r3,r4,r5;r2=r1+65716|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+65724>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+65720>>2],0)}}while(0);if((HEAP8[r1+1|0]|0)==0){r2=r1+3|0;r3=HEAP8[r2];if((HEAP8[HEAP32[r1+65680>>2]|0]|0)==0){r4=r3|-128;HEAP8[r2]=r4;r5=r4;return r5}else{r4=r3&127;HEAP8[r2]=r4;r5=r4;return r5}}do{if((HEAP8[r1+74|0]|0)==0){if((HEAP8[r1+32878|0]|0)!=0){break}r4=r1+3|0;r2=HEAP8[r4]&127;HEAP8[r4]=r2;r5=r2;return r5}}while(0);r2=r1+3|0;r1=HEAP8[r2]|-128;HEAP8[r2]=r1;r5=r1;return r5}function _wd179x_get_track(r1){return HEAP8[r1+4|0]}function _wd179x_set_track(r1,r2){HEAP8[r1+4|0]=r2;return}function _wd179x_get_sector(r1){return HEAP8[r1+5|0]}function _wd179x_set_sector(r1,r2){HEAP8[r1+5|0]=r2;return}function _wd179x_get_data(r1){var r2,r3;r2=r1+3|0;HEAP8[r2]=HEAP8[r2]&-3;r2=r1+65728|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r3=HEAP32[r1+65736>>2];if((r3|0)==0){break}FUNCTION_TABLE[r3](HEAP32[r1+65732>>2],0)}}while(0);return HEAP8[r1+6|0]}function _wd179x_set_data(r1,r2){var r3,r4;r3=r1+3|0;HEAP8[r3]=HEAP8[r3]&-3;r3=r1+65728|0;do{if((HEAP8[r3]|0)!=0){HEAP8[r3]=0;r4=HEAP32[r1+65736>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+65732>>2],0)}}while(0);HEAP8[r1+6|0]=r2;return}function _wd179x_select_drive(r1,r2){var r3;r3=r2&1;HEAP32[r1+68>>2]=r3;HEAP32[r1+65680>>2]=r1+72+(r3*32804&-1);return}function _wd179x_set_cmd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=0;r4=0;r5=STACKTOP;r6=r1|0;HEAP8[r6]=1;r7=r2&255;r8=r7&240;if((r8|0)==208){r9=r1+12|0;if((HEAP8[r9]|0)==0){HEAP8[r1+13|0]=r2;STACKTOP=r5;return}r10=r1+2|0;HEAP8[r10]=r2;r11=r1+3|0;r12=HEAP8[r11];r13=r1+65716|0;do{if((HEAP8[r13]|0)!=0){HEAP8[r13]=0;r14=HEAP32[r1+65724>>2];if((r14|0)==0){break}FUNCTION_TABLE[r14](HEAP32[r1+65720>>2],0)}}while(0);HEAP8[r11]=1;do{if((r12&1)==0){HEAP8[r11]=1;r14=HEAP32[r1+65680>>2];if((HEAP32[r14+8>>2]|0)==0){HEAP8[r11]=5;r15=69;r16=5}else{r15=65;r16=1}if((HEAP8[r14+1|0]|0)==0){r17=r16;break}HEAP8[r11]=r15;r17=r15}else{r17=1}}while(0);r15=HEAP8[r10];r10=r1+65692|0;HEAP32[r10>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r10>>2]=1082}HEAP8[r9]=1;HEAP8[r1+13|0]=0;HEAP8[r11]=r17&-2;do{if((r15&8)!=0){if((HEAP8[r13]|0)==1){break}HEAP8[r13]=1;r17=HEAP32[r1+65724>>2];if((r17|0)==0){break}FUNCTION_TABLE[r17](HEAP32[r1+65720>>2],1)}}while(0);r13=HEAP32[r1+65680>>2];r15=r13+24|0;if((HEAP8[r15]|0)==0){STACKTOP=r5;return}r17=HEAP32[r1+65712>>2];if((r17|0)==0){STACKTOP=r5;return}if((FUNCTION_TABLE[r17](HEAP32[r1+65708>>2],r13)|0)==0){HEAP8[r15]=0;STACKTOP=r5;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);STACKTOP=r5;return}}r15=r1+65696|0;HEAP32[r15>>2]=0;r13=r1+65692|0;HEAP32[r13>>2]=0;r17=r1+3|0;r11=HEAPU8[r17];if((r11&1|0)!=0){r9=HEAPU8[r1+2|0];_fprintf(HEAP32[_stderr>>2],11216,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=r7,HEAP32[r4+8>>2]=r9,HEAP32[r4+16>>2]=r11,r4));STACKTOP=r4;STACKTOP=r5;return}r11=r1+2|0;HEAP8[r11]=r2;r2=r1+65716|0;do{if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;r9=HEAP32[r1+65724>>2];if((r9|0)==0){break}FUNCTION_TABLE[r9](HEAP32[r1+65720>>2],0)}}while(0);r9=r1+12|0;HEAP8[r9]=1;r10=r1+13|0;HEAP8[r10]=0;if((r8|0)==0){HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r16=HEAP32[r1+68>>2];if(r16>>>0>1){break}r12=r1+72+(r16*32804&-1)+2|0;if((HEAP8[r12]|0)==1){break}HEAP8[r12]=1;HEAP8[r6]=1}}while(0);HEAP32[r1+65688>>2]=1e3;HEAP32[r13>>2]=302;STACKTOP=r5;return}else if((r8|0)==16){HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r8=HEAP32[r1+68>>2];if(r8>>>0>1){break}r12=r1+72+(r8*32804&-1)+2|0;if((HEAP8[r12]|0)==1){break}HEAP8[r12]=1;HEAP8[r6]=1}}while(0);HEAP32[r1+65688>>2]=1e3;HEAP32[r13>>2]=1046;STACKTOP=r5;return}else{r12=r7&224;if((r12|0)==64){HEAP8[r1+7|0]=1;HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r8=HEAP32[r1+68>>2];if(r8>>>0>1){break}r16=r1+72+(r8*32804&-1)+2|0;if((HEAP8[r16]|0)==1){break}HEAP8[r16]=1;HEAP8[r6]=1}}while(0);HEAP32[r1+65688>>2]=1e3;HEAP32[r13>>2]=468;STACKTOP=r5;return}if((r7&225|0)==128){r16=HEAP32[r1+65684>>2];if((r16&128|0)==0){r18=HEAPU8[r11]>>>1&1}else{r18=r16&127}HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r16=HEAP32[r1+68>>2];if(r16>>>0>1){break}r8=r1+72+(r16*32804&-1)+2|0;if((HEAP8[r8]|0)==1){break}HEAP8[r8]=1;HEAP8[r6]=1}}while(0);r8=r1+65680|0;r16=HEAP32[r8>>2];r14=r16+24|0;do{if((HEAP8[r14]|0)==0){r3=58}else{r19=HEAP32[r1+65712>>2];if((r19|0)==0){break}if((FUNCTION_TABLE[r19](HEAP32[r1+65708>>2],r16)|0)==0){HEAP8[r14]=0;r3=58;break}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);break}}}while(0);do{if(r3==58){r19=r16+32|0;if((HEAP32[r19>>2]|0)!=0){if((HEAP32[r16+12>>2]|0)==(r18|0)){break}}r20=r1+65704|0;if((HEAP32[r20>>2]|0)==0){break}r21=r16+12|0;HEAP32[r21>>2]=r18;if((FUNCTION_TABLE[HEAP32[r20>>2]](HEAP32[r1+65700>>2],r16)|0)!=0){r20=HEAP32[r16+8>>2];r22=HEAP32[r21>>2];_fprintf(HEAP32[_stderr>>2],14568,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r8>>2]+4>>2],HEAP32[r4+8>>2]=r20,HEAP32[r4+16>>2]=r22,r4));STACKTOP=r4;HEAP32[r16+28>>2]=0;HEAP32[r19>>2]=166666;_memset(r16+36|0,0,20834)|0;break}HEAP8[r14]=0;r22=r16+28|0;if(HEAP32[r22>>2]>>>0<HEAP32[r19>>2]>>>0){break}HEAP32[r22>>2]=0}}while(0);HEAP32[r1+20>>2]=0;HEAP32[HEAP32[r8>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r15>>2]=528;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=546;STACKTOP=r5;return}if((r12|0)==192){r8=HEAP32[r1+65684>>2];if((r8&128|0)==0){r23=HEAPU8[r11]>>>1&1}else{r23=r8&127}HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r8=HEAP32[r1+68>>2];if(r8>>>0>1){break}r16=r1+72+(r8*32804&-1)+2|0;if((HEAP8[r16]|0)==1){break}HEAP8[r16]=1;HEAP8[r6]=1}}while(0);r16=r1+65680|0;r8=HEAP32[r16>>2];r14=r8+24|0;do{if((HEAP8[r14]|0)==0){r3=109}else{r18=HEAP32[r1+65712>>2];if((r18|0)==0){break}if((FUNCTION_TABLE[r18](HEAP32[r1+65708>>2],r8)|0)==0){HEAP8[r14]=0;r3=109;break}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);break}}}while(0);do{if(r3==109){r18=r8+32|0;if((HEAP32[r18>>2]|0)!=0){if((HEAP32[r8+12>>2]|0)==(r23|0)){break}}r22=r1+65704|0;if((HEAP32[r22>>2]|0)==0){break}r19=r8+12|0;HEAP32[r19>>2]=r23;if((FUNCTION_TABLE[HEAP32[r22>>2]](HEAP32[r1+65700>>2],r8)|0)!=0){r22=HEAP32[r8+8>>2];r20=HEAP32[r19>>2];_fprintf(HEAP32[_stderr>>2],14568,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r16>>2]+4>>2],HEAP32[r4+8>>2]=r22,HEAP32[r4+16>>2]=r20,r4));STACKTOP=r4;HEAP32[r8+28>>2]=0;HEAP32[r18>>2]=166666;_memset(r8+36|0,0,20834)|0;break}HEAP8[r14]=0;r20=r8+28|0;if(HEAP32[r20>>2]>>>0<HEAP32[r18>>2]>>>0){break}HEAP32[r20>>2]=0}}while(0);HEAP32[r1+20>>2]=0;HEAP32[HEAP32[r16>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r15>>2]=528;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=1056;STACKTOP=r5;return}else if((r12|0)==160){r12=HEAP32[r1+65684>>2];if((r12&128|0)==0){r24=HEAPU8[r11]>>>1&1}else{r24=r12&127}HEAP8[r17]=1;r12=r1+1|0;do{if((HEAP8[r12]|0)!=0){r16=HEAP32[r1+68>>2];if(r16>>>0>1){break}r8=r1+72+(r16*32804&-1)+2|0;if((HEAP8[r8]|0)==1){break}HEAP8[r8]=1;HEAP8[r6]=1}}while(0);r8=r1+65680|0;r16=HEAP32[r8>>2];r14=r16+24|0;do{if((HEAP8[r14]|0)==0){r3=79}else{r23=HEAP32[r1+65712>>2];if((r23|0)==0){break}if((FUNCTION_TABLE[r23](HEAP32[r1+65708>>2],r16)|0)==0){HEAP8[r14]=0;r3=79;break}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);break}}}while(0);L205:do{if(r3==79){r23=r16+32|0;if((HEAP32[r23>>2]|0)==0){r3=81}else{if((HEAP32[r16+12>>2]|0)!=(r24|0)){r3=81}}do{if(r3==81){r20=r1+65704|0;if((HEAP32[r20>>2]|0)==0){break L205}r18=r16+12|0;HEAP32[r18>>2]=r24;if((FUNCTION_TABLE[HEAP32[r20>>2]](HEAP32[r1+65700>>2],r16)|0)!=0){r20=HEAP32[r16+8>>2];r22=HEAP32[r18>>2];_fprintf(HEAP32[_stderr>>2],14568,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r8>>2]+4>>2],HEAP32[r4+8>>2]=r20,HEAP32[r4+16>>2]=r22,r4));STACKTOP=r4;HEAP32[r16+28>>2]=0;HEAP32[r23>>2]=166666;_memset(r16+36|0,0,20834)|0;break L205}HEAP8[r14]=0;r22=r16+28|0;if(HEAP32[r22>>2]>>>0<HEAP32[r23>>2]>>>0){break}HEAP32[r22>>2]=0}}while(0);HEAP32[HEAP32[r8>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r15>>2]=528;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=438;STACKTOP=r5;return}}while(0);r16=HEAP8[r17]|16;HEAP8[r17]=r16;HEAP32[r13>>2]=0;HEAP32[r15>>2]=0;if((HEAP8[r12]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r13>>2]=1082}HEAP8[r9]=1;HEAP8[r10]=0;HEAP8[r17]=r16&-2;do{if((HEAP8[r2]|0)!=1){HEAP8[r2]=1;r16=HEAP32[r1+65724>>2];if((r16|0)==0){break}FUNCTION_TABLE[r16](HEAP32[r1+65720>>2],1)}}while(0);r2=HEAP32[r8>>2];r8=r2+24|0;if((HEAP8[r8]|0)==0){STACKTOP=r5;return}r16=HEAP32[r1+65712>>2];if((r16|0)==0){STACKTOP=r5;return}if((FUNCTION_TABLE[r16](HEAP32[r1+65708>>2],r2)|0)==0){HEAP8[r8]=0;STACKTOP=r5;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);STACKTOP=r5;return}}else{if((r7&248|0)==224){r8=HEAP32[r1+65684>>2];if((r8&128|0)==0){r25=HEAPU8[r11]>>>1&1}else{r25=r8&127}HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r8=HEAP32[r1+68>>2];if(r8>>>0>1){break}r2=r1+72+(r8*32804&-1)+2|0;if((HEAP8[r2]|0)==1){break}HEAP8[r2]=1;HEAP8[r6]=1}}while(0);r2=r1+65680|0;r8=HEAP32[r2>>2];r16=r8+24|0;do{if((HEAP8[r16]|0)==0){r3=130}else{r10=HEAP32[r1+65712>>2];if((r10|0)==0){break}if((FUNCTION_TABLE[r10](HEAP32[r1+65708>>2],r8)|0)==0){HEAP8[r16]=0;r3=130;break}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);break}}}while(0);do{if(r3==130){r10=r8+32|0;if((HEAP32[r10>>2]|0)!=0){if((HEAP32[r8+12>>2]|0)==(r25|0)){break}}r9=r1+65704|0;if((HEAP32[r9>>2]|0)==0){break}r12=r8+12|0;HEAP32[r12>>2]=r25;if((FUNCTION_TABLE[HEAP32[r9>>2]](HEAP32[r1+65700>>2],r8)|0)!=0){r9=HEAP32[r8+8>>2];r14=HEAP32[r12>>2];_fprintf(HEAP32[_stderr>>2],14568,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r2>>2]+4>>2],HEAP32[r4+8>>2]=r9,HEAP32[r4+16>>2]=r14,r4));STACKTOP=r4;HEAP32[r8+28>>2]=0;HEAP32[r10>>2]=166666;_memset(r8+36|0,0,20834)|0;break}HEAP8[r16]=0;r14=r8+28|0;if(HEAP32[r14>>2]>>>0<HEAP32[r10>>2]>>>0){break}HEAP32[r14>>2]=0}}while(0);HEAP32[HEAP32[r2>>2]+20>>2]=2;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+58|0]=0;HEAP8[r1+59|0]=0;HEAP8[r1+8|0]=1;HEAP8[r1+9|0]=0;HEAP32[r15>>2]=852;STACKTOP=r5;return}if((r7&249|0)!=240){_fprintf(HEAP32[_stderr>>2],20256,(r4=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[r4>>2]=r7,r4));STACKTOP=r4;STACKTOP=r5;return}r7=HEAP32[r1+65684>>2];if((r7&128|0)==0){r26=HEAPU8[r11]>>>1&1}else{r26=r7&127}HEAP8[r17]=1;do{if((HEAP8[r1+1|0]|0)!=0){r7=HEAP32[r1+68>>2];if(r7>>>0>1){break}r11=r1+72+(r7*32804&-1)+2|0;if((HEAP8[r11]|0)==1){break}HEAP8[r11]=1;HEAP8[r6]=1}}while(0);r6=r1+65680|0;r11=HEAP32[r6>>2];r7=r11+24|0;do{if((HEAP8[r7]|0)==0){r3=151}else{r2=HEAP32[r1+65712>>2];if((r2|0)==0){break}if((FUNCTION_TABLE[r2](HEAP32[r1+65708>>2],r11)|0)==0){HEAP8[r7]=0;r3=151;break}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);break}}}while(0);do{if(r3==151){r2=r11+32|0;if((HEAP32[r2>>2]|0)!=0){if((HEAP32[r11+12>>2]|0)==(r26|0)){break}}r8=r1+65704|0;if((HEAP32[r8>>2]|0)==0){break}r16=r11+12|0;HEAP32[r16>>2]=r26;if((FUNCTION_TABLE[HEAP32[r8>>2]](HEAP32[r1+65700>>2],r11)|0)!=0){r8=HEAP32[r11+8>>2];r25=HEAP32[r16>>2];_fprintf(HEAP32[_stderr>>2],14568,(r4=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[r4>>2]=HEAP32[HEAP32[r6>>2]+4>>2],HEAP32[r4+8>>2]=r8,HEAP32[r4+16>>2]=r25,r4));STACKTOP=r4;HEAP32[r11+28>>2]=0;HEAP32[r2>>2]=166666;_memset(r11+36|0,0,20834)|0;break}HEAP8[r7]=0;r25=r11+28|0;if(HEAP32[r25>>2]>>>0<HEAP32[r2>>2]>>>0){break}HEAP32[r25>>2]=0}}while(0);HEAP32[HEAP32[r6>>2]+20>>2]=2;HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=0;HEAP16[r1+52>>1]=0;HEAP32[r15>>2]=1074;HEAP32[r1+65688>>2]=0;HEAP32[r13>>2]=0;HEAP8[r17]=HEAP8[r17]|2;r17=r1+65728|0;do{if((HEAP8[r17]|0)!=1){HEAP8[r17]=1;r13=HEAP32[r1+65736>>2];if((r13|0)==0){break}FUNCTION_TABLE[r13](HEAP32[r1+65732>>2],1)}}while(0);_cmd_write_track_clock(r1);STACKTOP=r5;return}}}function _wd179x_clock2(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=r1|0;HEAP8[r3]=0;r4=r1+74|0;if((HEAP8[r4]|0)!=0){r5=Math_imul(HEAP32[r1+64>>2]>>>1,r2)|0;r6=r1+88|0;HEAP32[r6>>2]=r5+HEAP32[r6>>2];HEAP8[r3]=1}r6=r1+32878|0;if((HEAP8[r6]|0)!=0){r5=Math_imul(HEAP32[r1+64>>2]>>>1,r2)|0;r7=r1+32892|0;HEAP32[r7>>2]=r5+HEAP32[r7>>2];HEAP8[r3]=1}r7=HEAP32[r1+65696>>2];do{if((r7|0)==0){r5=HEAP32[r1+65692>>2];if((r5|0)==0){break}r8=r1+65688|0;r9=HEAP32[r8>>2];if(r9>>>0>r2>>>0){HEAP32[r8>>2]=r9-r2}else{HEAP32[r8>>2]=0;FUNCTION_TABLE[r5](r1)}HEAP8[r3]=1}else{FUNCTION_TABLE[r7](r1);HEAP8[r3]=1}}while(0);r3=r1+88|0;r7=HEAP32[r3>>2];r2=r1+60|0;r5=HEAP32[r2>>2];if(r7>>>0<r5>>>0){r10=r5}else{r8=HEAP32[_stderr>>2];r9=r1+100|0;r11=r1+104|0;r12=r1+92|0;r13=r7;r7=r5;while(1){r5=r13-r7|0;HEAP32[r3>>2]=r5;do{if((HEAP8[r4]|0)==0){_fwrite(17712,22,1,r8);r14=HEAP32[r3>>2];r15=HEAP32[r2>>2]}else{r16=HEAP32[r9>>2]+1|0;HEAP32[r9>>2]=r16;if(r16>>>0<HEAP32[r11>>2]>>>0){r14=r5;r15=r7;break}r16=HEAP32[r12>>2];if((r16|0)!=0){HEAP32[r12>>2]=r16-1}HEAP32[r9>>2]=0;r14=r5;r15=r7}}while(0);if(r14>>>0<r15>>>0){r10=r15;break}else{r13=r14;r7=r15}}}r15=r1+32892|0;r7=HEAP32[r15>>2];if(r7>>>0<r10>>>0){return}r14=HEAP32[_stderr>>2];r13=r1+32904|0;r9=r1+32908|0;r12=r1+32896|0;r1=r7;r7=r10;while(1){r10=r1-r7|0;HEAP32[r15>>2]=r10;do{if((HEAP8[r6]|0)==0){_fwrite(17712,22,1,r14);r17=HEAP32[r15>>2];r18=HEAP32[r2>>2]}else{r11=HEAP32[r13>>2]+1|0;HEAP32[r13>>2]=r11;if(r11>>>0<HEAP32[r9>>2]>>>0){r17=r10;r18=r7;break}r11=HEAP32[r12>>2];if((r11|0)!=0){HEAP32[r12>>2]=r11-1}HEAP32[r13>>2]=0;r17=r10;r18=r7}}while(0);if(r17>>>0<r18>>>0){break}else{r1=r17;r7=r18}}return}function _cmd_write_track_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2]+16|0;r5=HEAP32[r4>>2];r6=r1+60|0;r7=HEAP32[r6>>2];if(r5>>>0<r7>>>0){return}r8=HEAP32[_stderr>>2];r9=r1+44|0;r10=r1+3|0;r11=r1+48|0;r12=r1+6|0;r13=r1+54|0;r14=r1+55|0;r15=r1+10|0;r16=r1+56|0;r17=r1+65728|0;r18=r1+65736|0;r19=r1+65732|0;r20=r1+52|0;r21=r4;r4=r5;r5=r7;L4:while(1){HEAP32[r21>>2]=r4-r5;r7=HEAP32[r3>>2];r22=r7+20|0;r23=HEAP32[r22>>2];do{if(r23>>>0>1){if((HEAP8[r7+2|0]|0)==0){_fwrite(17712,22,1,r8);break}r24=r7+28|0;r25=HEAP32[r24>>2]+1|0;HEAP32[r24>>2]=r25;if(r25>>>0<HEAP32[r7+32>>2]>>>0){break}if((r23|0)!=0){HEAP32[r22>>2]=r23-1}HEAP32[r24>>2]=0}else{if((r23|0)==0){break L4}L9:do{if((HEAP32[r9>>2]&15|0)==0){if((HEAP8[r10]&2)!=0){_fwrite(16136,25,1,r8);HEAP8[r12]=0}do{if((HEAP32[r11>>2]|0)==0){r24=HEAP8[r12];if(r24<<24>>24==-10){HEAP8[r13]=-62;HEAP8[r14]=-9;break}else if(r24<<24>>24==-9){r25=HEAP16[r15>>1];HEAP16[r16>>1]=r25;HEAP8[r13]=(r25&65535)>>>8;HEAP8[r14]=-1;HEAP32[r11>>2]=1;break L9}else if(r24<<24>>24==-11){HEAP8[r13]=-95;HEAP8[r14]=-5;HEAP16[r15>>1]=-26997;break}else{HEAP8[r13]=r24;HEAP8[r14]=-1;break}}else{HEAP8[r13]=HEAP16[r16>>1];HEAP8[r14]=-1;HEAP32[r11>>2]=0}}while(0);HEAP8[r10]=HEAP8[r10]|2;if((HEAP8[r17]|0)==1){break}HEAP8[r17]=1;r24=HEAP32[r18>>2];if((r24|0)==0){break}FUNCTION_TABLE[r24](HEAP32[r19>>2],1)}}while(0);r24=HEAP32[r9>>2];if((r24&1|0)==0){r25=HEAP8[r14];HEAP16[r20>>1]=HEAP16[r20>>1]<<1|(r25&255)>>>7&255;HEAP8[r14]=r25<<1;r26=r24}else{r24=HEAP16[r20>>1]<<1|HEAPU8[r13]>>>7&255;r25=(r24&5)==0?r24:r24&-3;HEAP16[r20>>1]=r25;r24=HEAP32[r3>>2];r27=r24+28|0;r28=HEAP32[r27>>2];r29=128>>>((r28&7)>>>0);if((r25&2)==0){r25=(r28>>>3)+(r24+36)|0;HEAP8[r25]=HEAPU8[r25]&(r29^255)}else{r25=(r28>>>3)+(r24+36)|0;HEAP8[r25]=HEAPU8[r25]|r29}HEAP8[r24+24|0]=1;do{if((HEAP8[r24+2|0]|0)==0){_fwrite(17712,22,1,r8)}else{r29=HEAP32[r27>>2]+1|0;HEAP32[r27>>2]=r29;if(r29>>>0<HEAP32[r24+32>>2]>>>0){break}r29=r24+20|0;r25=HEAP32[r29>>2];if((r25|0)!=0){HEAP32[r29>>2]=r25-1}HEAP32[r27>>2]=0}}while(0);r27=HEAP32[r3>>2];r24=r27+28|0;r25=HEAP32[r24>>2];r29=128>>>((r25&7)>>>0);if((HEAP16[r20>>1]&1)==0){r28=(r25>>>3)+(r27+36)|0;HEAP8[r28]=HEAPU8[r28]&(r29^255);HEAP8[r27+24|0]=1;r30=HEAP16[r15>>1]}else{r28=(r25>>>3)+(r27+36)|0;HEAP8[r28]=HEAPU8[r28]|r29;HEAP8[r27+24|0]=1;r29=HEAP16[r15>>1]^-32768;HEAP16[r15>>1]=r29;r30=r29}r29=r30&65535;r28=r29<<1;HEAP16[r15>>1]=(r29&32768|0)==0?r28:r28^4129;do{if((HEAP8[r27+2|0]|0)==0){_fwrite(17712,22,1,r8)}else{r28=HEAP32[r24>>2]+1|0;HEAP32[r24>>2]=r28;if(r28>>>0<HEAP32[r27+32>>2]>>>0){break}r28=r27+20|0;r29=HEAP32[r28>>2];if((r29|0)!=0){HEAP32[r28>>2]=r29-1}HEAP32[r24>>2]=0}}while(0);HEAP8[r13]=HEAP8[r13]<<1;r26=HEAP32[r9>>2]}HEAP32[r9>>2]=r26+1}}while(0);r23=HEAP32[r3>>2]+16|0;r22=HEAP32[r23>>2];r7=HEAP32[r6>>2];if(r22>>>0<r7>>>0){r2=60;break}else{r21=r23;r4=r22;r5=r7}}if(r2==60){return}HEAP8[r10]=HEAP8[r10]&-3;do{if((HEAP8[r17]|0)!=0){HEAP8[r17]=0;r2=HEAP32[r18>>2];if((r2|0)==0){break}FUNCTION_TABLE[r2](HEAP32[r19>>2],0)}}while(0);r19=r1+65692|0;HEAP32[r19>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r6>>2]<<1;HEAP32[r19>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r10]=HEAP8[r10]&-2;r10=r1+65716|0;do{if((HEAP8[r10]|0)!=1){HEAP8[r10]=1;r19=HEAP32[r1+65724>>2];if((r19|0)==0){break}FUNCTION_TABLE[r19](HEAP32[r1+65720>>2],1)}}while(0);r10=HEAP32[r3>>2];r3=r10+24|0;if((HEAP8[r3]|0)==0){return}r19=HEAP32[r1+65712>>2];if((r19|0)==0){return}if((FUNCTION_TABLE[r19](HEAP32[r1+65708>>2],r10)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25560,26,1,r8);return}}function _cmd_auto_motor_off(r1){var r2;r2=r1+74|0;if((HEAP8[r2]|0)!=0){HEAP8[r2]=0;HEAP32[r1+88>>2]=0;HEAP8[r1|0]=1}r2=r1+32878|0;if((HEAP8[r2]|0)==0){return}HEAP8[r2]=0;HEAP32[r1+32892>>2]=0;HEAP8[r1|0]=1;return}function _wd179x_read_track_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2]+16|0;r5=HEAP32[r4>>2];r6=r1+60|0;r7=HEAP32[r6>>2];if(r5>>>0<r7>>>0){return}r8=HEAP32[_stderr>>2];r9=r1+24|0;r10=r1+8|0;r11=r1+9|0;r12=r1+10|0;r13=r1+16|0;r14=r1+58|0;r15=r1+59|0;r16=r1+3|0;r17=r1+6|0;r18=r1+65728|0;r19=r1+65736|0;r20=r1+65732|0;r21=r4;r4=r5;r5=r7;L4:while(1){HEAP32[r21>>2]=r4-r5;r22=HEAP32[r3>>2];r7=r22+20|0;r23=HEAP32[r7>>2];L6:do{if(r23>>>0>1){if((HEAP8[r22+2|0]|0)==0){_fwrite(17712,22,1,r8);break}r24=r22+28|0;r25=HEAP32[r24>>2]+1|0;HEAP32[r24>>2]=r25;if(r25>>>0<HEAP32[r22+32>>2]>>>0){break}if((r23|0)!=0){HEAP32[r7>>2]=r23-1}HEAP32[r24>>2]=0}else{if((r23|0)==0){break L4}r24=HEAPU16[r9>>1]<<1;r25=(HEAP8[r10]|0)==0;HEAP8[r10]=r25&1;r26=r22+28|0;r27=HEAP32[r26>>2];r28=(HEAPU8[(r27>>>3)+(r22+36)|0]&128>>>((r27&7)>>>0)|0)!=0;r27=r28&1;if(r25){HEAP8[r11]=HEAPU8[r11]<<1|r27;r25=HEAP16[r12>>1];if(r28){r28=r25^-32768;HEAP16[r12>>1]=r28;r29=r28}else{r29=r25}r25=r29&65535;r28=r25<<1;HEAP16[r12>>1]=(r25&32768|0)==0?r28:r28^4129}do{if((HEAP8[r22+2|0]|0)==0){_fwrite(17712,22,1,r8)}else{r28=HEAP32[r26>>2]+1|0;HEAP32[r26>>2]=r28;if(r28>>>0<HEAP32[r22+32>>2]>>>0){break}r28=HEAP32[r7>>2];if((r28|0)!=0){HEAP32[r7>>2]=r28-1}HEAP32[r26>>2]=0}}while(0);r26=(r27|r24)&65535;HEAP16[r9>>1]=r26;r28=HEAP32[r13>>2]+1|0;HEAP32[r13>>2]=r28;r25=HEAP8[r14];if(r25<<24>>24==0){r30=0}else{r31=r25-1&255;HEAP8[r14]=r31;r30=r31}r31=HEAP8[r15];if(r31<<24>>24==0){r32=0}else{r25=r31-1&255;HEAP8[r15]=r25;r32=r25}do{if(r26<<16>>16==21028){HEAP8[r10]=1;HEAP8[r15]=16;HEAP32[r13>>2]=16}else if(r26<<16>>16==17545){if(r30<<24>>24!=0){r2=41;break}HEAP8[r10]=1;HEAP8[r14]=16;if(r32<<24>>24==0){HEAP32[r13>>2]=16;break}else{HEAP32[r13>>2]=0;break L6}}else{r2=41}}while(0);if(r2==41){r2=0;if(r28>>>0<16){break}}HEAP32[r13>>2]=0;r26=HEAP8[r16];if((r26&2)==0){r33=r26}else{_fwrite(13328,29,1,r8);r26=HEAP8[r16]|4;HEAP8[r16]=r26;r33=r26}HEAP8[r17]=HEAP8[r11];HEAP8[r16]=r33|2;if((HEAP8[r18]|0)==1){break}HEAP8[r18]=1;r26=HEAP32[r19>>2];if((r26|0)==0){break}FUNCTION_TABLE[r26](HEAP32[r20>>2],1)}}while(0);r7=HEAP32[r3>>2]+16|0;r23=HEAP32[r7>>2];r26=HEAP32[r6>>2];if(r23>>>0<r26>>>0){r2=48;break}else{r21=r7;r4=r23;r5=r26}}if(r2==48){return}r2=r1+65692|0;HEAP32[r2>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r6>>2]<<1;HEAP32[r2>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r16]=HEAP8[r16]&-2;r16=r1+65716|0;do{if((HEAP8[r16]|0)==1){r34=r22}else{HEAP8[r16]=1;r2=HEAP32[r1+65724>>2];if((r2|0)==0){r34=r22;break}FUNCTION_TABLE[r2](HEAP32[r1+65720>>2],1);r34=HEAP32[r3>>2]}}while(0);r3=r34+24|0;if((HEAP8[r3]|0)==0){return}r22=HEAP32[r1+65712>>2];if((r22|0)==0){return}if((FUNCTION_TABLE[r22](HEAP32[r1+65708>>2],r34)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25560,26,1,r8);return}}function _cmd_read_address_idam(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+65680|0;r3=HEAP32[r2>>2];if((HEAP32[r3+20>>2]|0)!=0){r4=r1+26|0;if((HEAP8[r4]|0)!=-2){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r4]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=528;return}r4=r1+3|0;r5=HEAP8[r4];if((HEAP16[r1+32>>1]|0)==(HEAP16[r1+34>>1]|0)){r6=r5}else{r7=r5|8;HEAP8[r4]=r7;r6=r7}r7=HEAP8[r1+27|0];HEAP8[r1+5|0]=r7;HEAP32[r1+36>>2]=48;HEAP32[r1+65696>>2]=378;HEAP32[r1+65692>>2]=0;HEAP8[r1+6|0]=r7;HEAP8[r1+3|0]=r6|2;r6=r1+65728|0;if((HEAP8[r6]|0)==1){return}HEAP8[r6]=1;r6=HEAP32[r1+65736>>2];if((r6|0)==0){return}FUNCTION_TABLE[r6](HEAP32[r1+65732>>2],1);return}r6=r1+3|0;r7=HEAP8[r6]|16;HEAP8[r6]=r7;r4=r1+65692|0;HEAP32[r4>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r4>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r6]=r7&-2;r7=r1+65716|0;do{if((HEAP8[r7]|0)==1){r8=r3}else{HEAP8[r7]=1;r6=HEAP32[r1+65724>>2];if((r6|0)==0){r8=r3;break}FUNCTION_TABLE[r6](HEAP32[r1+65720>>2],1);r8=HEAP32[r2>>2]}}while(0);r2=r8+24|0;if((HEAP8[r2]|0)==0){return}r3=HEAP32[r1+65712>>2];if((r3|0)==0){return}if((FUNCTION_TABLE[r3](HEAP32[r1+65708>>2],r8)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);return}}function _cmd_read_address_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2]+16|0;r5=HEAP32[r4>>2];r6=r1+60|0;r7=HEAP32[r6>>2];if(r5>>>0<r7>>>0){return}r8=HEAP32[_stderr>>2];r9=r1+8|0;r10=r1+36|0;r11=r1+3|0;r12=r1+28|0;r13=r1+6|0;r14=r1+65728|0;r15=r1+65736|0;r16=r1+65732|0;r17=r1+29|0;r18=r1+30|0;r19=r1+34|0;r20=r4;r4=r5;r5=r7;L4:while(1){HEAP32[r20>>2]=r4-r5;r7=HEAP32[r3>>2];do{if((HEAP8[r7+2|0]|0)==0){_fwrite(17712,22,1,r8)}else{r21=r7+28|0;r22=HEAP32[r21>>2]+1|0;HEAP32[r21>>2]=r22;if(r22>>>0<HEAP32[r7+32>>2]>>>0){break}r22=r7+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){HEAP32[r22>>2]=r23-1}HEAP32[r21>>2]=0}}while(0);do{if((HEAP8[r9]|0)!=0){r7=HEAP32[r10>>2]-1|0;HEAP32[r10>>2]=r7;if((r7&7|0)!=0){break}r21=HEAP8[r11];if((r21&2)==0){r24=r7;r25=r21}else{_fwrite(12456,31,1,r8);r21=HEAP8[r11]|4;HEAP8[r11]=r21;r24=HEAP32[r10>>2];r25=r21}do{if(r24>>>0>39){HEAP8[r13]=HEAP8[r12]}else{if(r24>>>0>31){HEAP8[r13]=HEAP8[r17];break}if(r24>>>0>23){HEAP8[r13]=HEAP8[r18];break}if(r24>>>0>15){HEAP8[r13]=HEAPU16[r19>>1]>>>8;break}if(r24>>>0<=7){break L4}HEAP8[r13]=HEAP16[r19>>1]}}while(0);HEAP8[r11]=r25|2;if((HEAP8[r14]|0)==1){break}HEAP8[r14]=1;r21=HEAP32[r15>>2];if((r21|0)==0){break}FUNCTION_TABLE[r21](HEAP32[r16>>2],1)}}while(0);r21=HEAP32[r3>>2]+16|0;r7=HEAP32[r21>>2];r23=HEAP32[r6>>2];if(r7>>>0<r23>>>0){r2=37;break}else{r20=r21;r4=r7;r5=r23}}if(r2==37){return}r2=r1+65692|0;HEAP32[r2>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r6>>2]<<1;HEAP32[r2>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r11]=r25&-2;r25=r1+65716|0;do{if((HEAP8[r25]|0)!=1){HEAP8[r25]=1;r11=HEAP32[r1+65724>>2];if((r11|0)==0){break}FUNCTION_TABLE[r11](HEAP32[r1+65720>>2],1)}}while(0);r25=HEAP32[r3>>2];r3=r25+24|0;if((HEAP8[r3]|0)==0){return}r11=HEAP32[r1+65712>>2];if((r11|0)==0){return}if((FUNCTION_TABLE[r11](HEAP32[r1+65708>>2],r25)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25560,26,1,r8);return}}function _wd179x_scan_mark(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2];r5=r4+16|0;r6=HEAP32[r5>>2];r7=r1+60|0;r8=HEAP32[r7>>2];r9=r6>>>0<r8>>>0;if(r9){return}r10=r1+24|0;r11=r1+8|0;r12=r1+9|0;r13=r1+10|0;r14=HEAP32[_stderr>>2];r15=r1+20|0;r16=r1+16|0;r17=r1+26|0;r18=r1+27|0;r19=r1+28|0;r20=r1+29|0;r21=r1+30|0;r22=r1+32|0;r23=r1+34|0;r24=r5;r25=r6;r26=r8;L4:while(1){r27=r25-r26|0;HEAP32[r24>>2]=r27;r28=HEAP16[r10>>1];r29=r28&65535;r30=r29<<1;r31=HEAP8[r11];r32=r31<<24>>24==0;r33=r32&1;HEAP8[r11]=r33;r34=HEAP32[r3>>2];r35=r34+28|0;r36=HEAP32[r35>>2];r37=r36>>>3;r38=r37+(r34+36)|0;r39=HEAP8[r38];r40=r39&255;r41=r36&7;r42=128>>>(r41>>>0);r43=r40&r42;r44=(r43|0)!=0;r45=r44&1;if(r32){r46=HEAP8[r12];r47=r46&255;r48=r47<<1;r49=r48|r45;r50=r49&255;HEAP8[r12]=r50;r51=HEAP16[r13>>1];if(r44){r52=r51^-32768;HEAP16[r13>>1]=r52;r53=r52}else{r53=r51}r54=r53&65535;r55=r54&32768;r56=(r55|0)==0;r57=r54<<1;r58=r57^4129;r59=r56?r57:r58;r60=r59&65535;HEAP16[r13>>1]=r60}r61=r34+2|0;r62=HEAP8[r61];r63=r62<<24>>24==0;do{if(r63){r64=_fwrite(17712,22,1,r14)}else{r65=HEAP32[r35>>2];r66=r65+1|0;HEAP32[r35>>2]=r66;r67=r34+32|0;r68=HEAP32[r67>>2];r69=r66>>>0<r68>>>0;if(r69){break}r70=r34+20|0;r71=HEAP32[r70>>2];r72=(r71|0)==0;if(!r72){r73=r71-1|0;HEAP32[r70>>2]=r73}HEAP32[r35>>2]=0}}while(0);r74=r45|r30;r75=r74&65535;HEAP16[r10>>1]=r75;r76=HEAP32[r15>>2];r77=(r76|0)==0;if(!r77){r78=r76-1|0;HEAP32[r15>>2]=r78;r79=(r78|0)==0;if(r79){r2=15;break}}r80=HEAP32[r3>>2];r81=r80+20|0;r82=HEAP32[r81>>2];r83=(r82|0)==0;if(r83){r2=17;break}r84=HEAP32[r16>>2];r85=(r84|0)==0;L24:do{if(r85){r86=r75<<16>>16==17545;if(!r86){break}HEAP32[r16>>2]=16;HEAP16[r13>>1]=17467;HEAP8[r11]=1}else{r87=r84+1|0;HEAP32[r16>>2]=r87;r88=r87&15;r89=(r88|0)==0;if(!r89){break}switch(r84|0){case 31:case 47:{r90=r75<<16>>16==17545;if(r90){break L24}HEAP32[r16>>2]=0;break L24;break};case 63:{r91=HEAP8[r12];HEAP8[r17]=r91;if(r75<<16>>16==21844){break L24}else if(r75<<16>>16==21829|r75<<16>>16==21834){r2=27;break L4}HEAP32[r16>>2]=0;break L24;break};case 79:{r92=HEAP8[r12];HEAP8[r18]=r92;break L24;break};case 95:{r93=HEAP8[r12];HEAP8[r19]=r93;break L24;break};case 111:{r94=HEAP8[r12];HEAP8[r20]=r94;break L24;break};case 127:{r95=HEAP8[r12];HEAP8[r21]=r95;r96=HEAP16[r13>>1];HEAP16[r22>>1]=r96;break L24;break};case 159:{r97=HEAP8[r12];r98=r97&255;r99=HEAP16[r23>>1];r100=r99|r98;HEAP16[r23>>1]=r100;r101=HEAP16[r22>>1];r102=r101<<16>>16==r100<<16>>16;if(r102){r2=35;break L4}HEAP32[r16>>2]=0;break L24;break};case 143:{r103=HEAP8[r12];r104=r103&255;r105=r104<<8;HEAP16[r23>>1]=r105;break L24;break};default:{break L24}}}}while(0);r106=r80+16|0;r107=HEAP32[r106>>2];r108=HEAP32[r7>>2];r109=r107>>>0<r108>>>0;if(r109){r2=37;break}else{r24=r106;r25=r107;r26=r108}}if(r2==15){r110=r1+65696|0;HEAP32[r110>>2]=0;return}else if(r2==17){r111=r1+65696|0;HEAP32[r111>>2]=0;return}else if(r2==27){r112=r1+65696|0;HEAP32[r112>>2]=0;r113=r80+16|0;HEAP32[r113>>2]=0;return}else if(r2==35){r114=r1+65696|0;HEAP32[r114>>2]=0;r115=r80+16|0;HEAP32[r115>>2]=0;return}else if(r2==37){return}}function _cmd_write_sector_idam(r1){var r2,r3,r4,r5,r6,r7,r8;r2=r1+65680|0;r3=HEAP32[r2>>2];if((HEAP32[r3+20>>2]|0)==0){r4=r1+3|0;r5=HEAP8[r4]|16;HEAP8[r4]=r5;r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r6>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r4]=r5&-2;r5=r1+65716|0;do{if((HEAP8[r5]|0)==1){r7=r3}else{HEAP8[r5]=1;r4=HEAP32[r1+65724>>2];if((r4|0)==0){r7=r3;break}FUNCTION_TABLE[r4](HEAP32[r1+65720>>2],1);r7=HEAP32[r2>>2]}}while(0);r2=r7+24|0;if((HEAP8[r2]|0)==0){return}r5=HEAP32[r1+65712>>2];if((r5|0)==0){return}if((FUNCTION_TABLE[r5](HEAP32[r1+65708>>2],r7)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);return}}r2=r1+26|0;if((HEAP8[r2]|0)!=-2){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=528;return}r7=r1+32|0;r5=r1+34|0;if((HEAP16[r7>>1]|0)!=(HEAP16[r5>>1]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}if((HEAP8[r1+4|0]|0)!=(HEAP8[r1+27|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}do{if((HEAP8[r1+2|0]&2)!=0){if((HEAP32[r3+12>>2]|0)==(HEAPU8[r1+28|0]|0)){break}HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}}while(0);if((HEAP8[r1+5|0]|0)!=(HEAP8[r1+29|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}r3=r1+30|0;r4=HEAP8[r3];if((r4&255)>3){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}r5=r1+3|0;HEAP8[r5]=HEAP8[r5]|2;r5=r1+65728|0;do{if((HEAP8[r5]|0)==1){r8=r4}else{HEAP8[r5]=1;r7=HEAP32[r1+65736>>2];if((r7|0)==0){r8=r4;break}FUNCTION_TABLE[r7](HEAP32[r1+65732>>2],1);r8=HEAP8[r3]}}while(0);HEAP32[r1+44>>2]=0;HEAP32[r1+48>>2]=(2048<<(r8&255))+640;HEAP32[r1+65696>>2]=1122;_cmd_write_sector_clock(r1);return}function _cmd_write_sector_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r2=0;r3=r1+65680|0;r4=HEAP32[r3>>2]+16|0;r5=HEAP32[r4>>2];r6=r1+60|0;r7=HEAP32[r6>>2];if(r5>>>0<r7>>>0){return}r8=r1+44|0;r9=r1+55|0;r10=r1+3|0;r11=r1+54|0;r12=HEAP32[_stderr>>2];r13=r1+10|0;r14=r1+2|0;r15=r1+48|0;r16=r1+12|0;r17=r1+6|0;r18=r1+65728|0;r19=r1+65736|0;r20=r1+65732|0;r21=r1+56|0;r22=r1+52|0;r23=r1+54|0;r24=r4;r4=r5;r5=r7;L4:while(1){HEAP32[r24>>2]=r4-r5;r7=HEAP32[r8>>2];L6:do{if((r7&15|0)==0){HEAP8[r9]=-1;if(r7>>>0<352){r2=82;break}do{if(r7>>>0<544){if((HEAP8[r10]&2)!=0){_fwrite(11528,24,1,r12);HEAP8[r10]=HEAP8[r10]|4}HEAP8[r11]=0}else{if(r7>>>0<592){if((r7|0)==544){HEAP16[r13>>1]=-1}HEAP8[r11]=-95;HEAP8[r9]=-5;break}if(r7>>>0<608){HEAP8[r11]=(HEAP8[r14]&1)!=0?-8:-5;break}r25=HEAP32[r15>>2];if(r7>>>0>=(r25-32|0)>>>0){if(r7>>>0<(r25-16|0)>>>0){r26=HEAP16[r13>>1];HEAP16[r21>>1]=r26;HEAP8[r11]=(r26&65535)>>>8;break}if(r7>>>0>=r25>>>0){break L4}HEAP8[r11]=HEAP16[r21>>1];break}HEAP8[r16]=0;r26=HEAP8[r10];if((r26&2)==0){r27=r7;r28=r25;r29=r26;r30=HEAP8[r17]}else{_fwrite(11528,24,1,r12);r26=HEAP8[r10]|4;HEAP8[r10]=r26;HEAP8[r17]=0;r27=HEAP32[r8>>2];r28=HEAP32[r15>>2];r29=r26;r30=0}HEAP8[r11]=r30;if((r27+16|0)>>>0>=(r28-32|0)>>>0){r31=r27;r2=60;break L6}HEAP8[r10]=r29|2;if((HEAP8[r18]|0)==1){break}HEAP8[r18]=1;r26=HEAP32[r19>>2];if((r26|0)==0){break}FUNCTION_TABLE[r26](HEAP32[r20>>2],1)}}while(0);r31=HEAP32[r8>>2];r2=60}else{r31=r7;r2=60}}while(0);do{if(r2==60){r2=0;if(r31>>>0<=351){r2=82;break}if((r31&1|0)==0){r7=HEAP8[r9];HEAP16[r22>>1]=HEAP16[r22>>1]<<1|(r7&255)>>>7&255;HEAP8[r9]=r7<<1;break}r7=HEAP16[r22>>1]<<1|HEAPU8[r23]>>>7&255;r26=(r7&5)==0?r7:r7&-3;HEAP16[r22>>1]=r26;r7=HEAP32[r3>>2];r25=r7+28|0;r32=HEAP32[r25>>2];r33=128>>>((r32&7)>>>0);if((r26&2)==0){r26=(r32>>>3)+(r7+36)|0;HEAP8[r26]=HEAPU8[r26]&(r33^255)}else{r26=(r32>>>3)+(r7+36)|0;HEAP8[r26]=HEAPU8[r26]|r33}HEAP8[r7+24|0]=1;do{if((HEAP8[r7+2|0]|0)==0){_fwrite(17712,22,1,r12)}else{r33=HEAP32[r25>>2]+1|0;HEAP32[r25>>2]=r33;if(r33>>>0<HEAP32[r7+32>>2]>>>0){break}r33=r7+20|0;r26=HEAP32[r33>>2];if((r26|0)!=0){HEAP32[r33>>2]=r26-1}HEAP32[r25>>2]=0}}while(0);r25=HEAP32[r3>>2];r7=r25+28|0;r26=HEAP32[r7>>2];r33=128>>>((r26&7)>>>0);if((HEAP16[r22>>1]&1)==0){r32=(r26>>>3)+(r25+36)|0;HEAP8[r32]=HEAPU8[r32]&(r33^255);HEAP8[r25+24|0]=1;r34=HEAP16[r13>>1]}else{r32=(r26>>>3)+(r25+36)|0;HEAP8[r32]=HEAPU8[r32]|r33;HEAP8[r25+24|0]=1;r33=HEAP16[r13>>1]^-32768;HEAP16[r13>>1]=r33;r34=r33}r33=r34&65535;r32=r33<<1;HEAP16[r13>>1]=(r33&32768|0)==0?r32:r32^4129;do{if((HEAP8[r25+2|0]|0)==0){_fwrite(17712,22,1,r12)}else{r32=HEAP32[r7>>2]+1|0;HEAP32[r7>>2]=r32;if(r32>>>0<HEAP32[r25+32>>2]>>>0){break}r32=r25+20|0;r33=HEAP32[r32>>2];if((r33|0)!=0){HEAP32[r32>>2]=r33-1}HEAP32[r7>>2]=0}}while(0);HEAP8[r23]=HEAP8[r23]<<1}}while(0);do{if(r2==82){r2=0;r7=HEAP32[r3>>2];if((HEAP8[r7+2|0]|0)==0){_fwrite(17712,22,1,r12);break}r25=r7+28|0;r33=HEAP32[r25>>2]+1|0;HEAP32[r25>>2]=r33;if(r33>>>0<HEAP32[r7+32>>2]>>>0){break}r33=r7+20|0;r7=HEAP32[r33>>2];if((r7|0)!=0){HEAP32[r33>>2]=r7-1}HEAP32[r25>>2]=0}}while(0);HEAP32[r8>>2]=HEAP32[r8>>2]+1;r25=HEAP32[r3>>2]+16|0;r7=HEAP32[r25>>2];r33=HEAP32[r6>>2];if(r7>>>0<r33>>>0){r2=89;break}else{r24=r25;r4=r7;r5=r33}}if(r2==89){return}HEAP8[r16]=1;r2=r1+13|0;r5=HEAP8[r2];if(r5<<24>>24==0){if((HEAP8[r14]&16)!=0){r4=r1+5|0;HEAP8[r4]=HEAP8[r4]+1;HEAP32[HEAP32[r3>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=528;HEAP32[r1+65688>>2]=0;HEAP32[r1+65692>>2]=438;return}r4=r1+65692|0;HEAP32[r4>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r6>>2]<<1;HEAP32[r4>>2]=1082}HEAP8[r16]=1;HEAP8[r2]=0;HEAP8[r10]=HEAP8[r10]&-2;r4=r1+65716|0;do{if((HEAP8[r4]|0)!=1){HEAP8[r4]=1;r24=HEAP32[r1+65724>>2];if((r24|0)==0){break}FUNCTION_TABLE[r24](HEAP32[r1+65720>>2],1)}}while(0);r4=HEAP32[r3>>2];r24=r4+24|0;if((HEAP8[r24]|0)==0){return}r8=HEAP32[r1+65712>>2];if((r8|0)==0){return}if((FUNCTION_TABLE[r8](HEAP32[r1+65708>>2],r4)|0)==0){HEAP8[r24]=0;return}else{_fwrite(25560,26,1,r12);return}}HEAP8[r14]=r5;r5=HEAP8[r10];r24=r1+65716|0;do{if((HEAP8[r24]|0)!=0){HEAP8[r24]=0;r4=HEAP32[r1+65724>>2];if((r4|0)==0){break}FUNCTION_TABLE[r4](HEAP32[r1+65720>>2],0)}}while(0);HEAP8[r10]=1;do{if((r5&1)==0){HEAP8[r10]=1;r4=HEAP32[r3>>2];if((HEAP32[r4+8>>2]|0)==0){HEAP8[r10]=5;r35=69;r36=5}else{r35=65;r36=1}if((HEAP8[r4+1|0]|0)==0){r37=r36;break}HEAP8[r10]=r35;r37=r35}else{r37=1}}while(0);r35=HEAP8[r14];r14=r1+65692|0;HEAP32[r14>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r6>>2]<<1;HEAP32[r14>>2]=1082}HEAP8[r16]=1;HEAP8[r2]=0;HEAP8[r10]=r37&-2;do{if((r35&8)!=0){if((HEAP8[r24]|0)==1){break}HEAP8[r24]=1;r37=HEAP32[r1+65724>>2];if((r37|0)==0){break}FUNCTION_TABLE[r37](HEAP32[r1+65720>>2],1)}}while(0);r24=HEAP32[r3>>2];r3=r24+24|0;if((HEAP8[r3]|0)==0){return}r35=HEAP32[r1+65712>>2];if((r35|0)==0){return}if((FUNCTION_TABLE[r35](HEAP32[r1+65708>>2],r24)|0)==0){HEAP8[r3]=0;return}else{_fwrite(25560,26,1,r12);return}}function _cmd_read_sector_idam(r1){var r2,r3,r4,r5,r6,r7;r2=r1+65680|0;r3=HEAP32[r2>>2];if((HEAP32[r3+20>>2]|0)==0){r4=r1+3|0;r5=HEAP8[r4]|16;HEAP8[r4]=r5;r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r6>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r4]=r5&-2;r5=r1+65716|0;do{if((HEAP8[r5]|0)==1){r7=r3}else{HEAP8[r5]=1;r4=HEAP32[r1+65724>>2];if((r4|0)==0){r7=r3;break}FUNCTION_TABLE[r4](HEAP32[r1+65720>>2],1);r7=HEAP32[r2>>2]}}while(0);r2=r7+24|0;if((HEAP8[r2]|0)==0){return}r5=HEAP32[r1+65712>>2];if((r5|0)==0){return}if((FUNCTION_TABLE[r5](HEAP32[r1+65708>>2],r7)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);return}}r2=r1+26|0;if((HEAP8[r2]|0)!=-2){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=528;return}r7=r1+32|0;r5=r1+34|0;if((HEAP16[r7>>1]|0)!=(HEAP16[r5>>1]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}if((HEAP8[r1+4|0]|0)!=(HEAP8[r1+27|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}do{if((HEAP8[r1+2|0]&2)!=0){if((HEAP32[r3+12>>2]|0)==(HEAPU8[r1+28|0]|0)){break}HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}}while(0);if((HEAP8[r1+5|0]|0)!=(HEAP8[r1+29|0]|0)){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}if(HEAPU8[r1+30|0]>3){HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;return}else{HEAP32[r1+20>>2]=960;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r2]=0;HEAP16[r7>>1]=0;HEAP16[r5>>1]=1;HEAP32[r1+65696>>2]=528;HEAP32[r1+65688>>2]=0;HEAP32[r1+65692>>2]=860;return}}function _cmd_read_sector_dam(r1){var r2,r3,r4;r2=HEAP8[r1+26|0];if(r2<<24>>24==-5|r2<<24>>24==-8){r3=r1+3|0;r4=HEAP8[r3];HEAP8[r3]=r2<<24>>24==-8?r4|32:r4&-33;HEAP32[r1+36>>2]=(1024<<HEAPU8[r1+30|0])+16;HEAP32[r1+65696>>2]=742;HEAP32[r1+65692>>2]=0;_cmd_read_sector_clock(r1);return}else{HEAP16[r1+32>>1]=0;r4=r1+16|0;HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP16[r4+8>>1]=0;HEAP8[r4+10|0]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=528;HEAP32[r1+65692>>2]=546;return}}function _cmd_read_sector_clock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r2=0;r3=0;r4=STACKTOP;r5=r1+65680|0;r6=HEAP32[r5>>2]+16|0;r7=HEAP32[r6>>2];r8=r1+60|0;r9=HEAP32[r8>>2];if(r7>>>0<r9>>>0){STACKTOP=r4;return}r10=r1+8|0;r11=r1+9|0;r12=r1+10|0;r13=HEAP32[_stderr>>2];r14=r1+36|0;r15=r1+12|0;r16=r1+3|0;r17=r1+6|0;r18=r1+65728|0;r19=r1+40|0;r20=r1+65736|0;r21=r1+65732|0;r22=r1+42|0;r23=r6;r6=r7;r7=r9;L4:while(1){HEAP32[r23>>2]=r6-r7;r9=(HEAP8[r10]|0)==0;HEAP8[r10]=r9&1;r24=HEAP32[r5>>2];r25=r24+28|0;r26=HEAP32[r25>>2];r27=(HEAPU8[(r26>>>3)+(r24+36)|0]&128>>>((r26&7)>>>0)|0)!=0;if(r9){HEAP8[r11]=HEAP8[r11]<<1|r27&1;r9=HEAP16[r12>>1];if(r27){r27=r9^-32768;HEAP16[r12>>1]=r27;r28=r27}else{r28=r9}r9=r28&65535;r27=r9<<1;HEAP16[r12>>1]=(r9&32768|0)==0?r27:r27^4129}do{if((HEAP8[r24+2|0]|0)==0){_fwrite(17712,22,1,r13)}else{r27=HEAP32[r25>>2]+1|0;HEAP32[r25>>2]=r27;if(r27>>>0<HEAP32[r24+32>>2]>>>0){break}r27=r24+20|0;r9=HEAP32[r27>>2];if((r9|0)!=0){HEAP32[r27>>2]=r9-1}HEAP32[r25>>2]=0}}while(0);do{if((HEAP8[r10]|0)!=0){r25=HEAP32[r14>>2]-1|0;HEAP32[r14>>2]=r25;if((r25&7|0)!=0){break}if(r25>>>0<=15){r29=HEAPU8[r11];if((r25|0)!=8){r2=35;break L4}HEAP16[r22>>1]=r29<<8;break}HEAP8[r15]=0;r24=HEAP8[r16];if((r24&2)!=0){r2=18;break L4}HEAP8[r17]=HEAP8[r11];HEAP8[r16]=r24|2;do{if((HEAP8[r18]|0)==1){r30=r25}else{HEAP8[r18]=1;r24=HEAP32[r20>>2];if((r24|0)==0){r30=r25;break}FUNCTION_TABLE[r24](HEAP32[r21>>2],1);r30=HEAP32[r14>>2]}}while(0);if((r30|0)!=16){break}HEAP16[r19>>1]=HEAP16[r12>>1]}}while(0);r25=HEAP32[r5>>2]+16|0;r24=HEAP32[r25>>2];r9=HEAP32[r8>>2];if(r24>>>0<r9>>>0){r2=72;break}else{r23=r25;r6=r24;r7=r9}}if(r2==18){_fwrite(10680,23,1,r13);r7=HEAP8[r16]|4;HEAP8[r16]=r7;r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r8>>2]<<1;HEAP32[r6>>2]=1082}HEAP8[r15]=1;HEAP8[r1+13|0]=0;HEAP8[r16]=r7&-2;r7=r1+65716|0;do{if((HEAP8[r7]|0)!=1){HEAP8[r7]=1;r6=HEAP32[r1+65724>>2];if((r6|0)==0){break}FUNCTION_TABLE[r6](HEAP32[r1+65720>>2],1)}}while(0);r7=HEAP32[r5>>2];r6=r7+24|0;if((HEAP8[r6]|0)==0){STACKTOP=r4;return}r23=HEAP32[r1+65712>>2];if((r23|0)==0){STACKTOP=r4;return}if((FUNCTION_TABLE[r23](HEAP32[r1+65708>>2],r7)|0)==0){HEAP8[r6]=0;STACKTOP=r4;return}else{_fwrite(25560,26,1,r13);STACKTOP=r4;return}}else if(r2==35){r6=HEAPU16[r22>>1]|r29;r29=r6&65535;HEAP16[r22>>1]=r29;HEAP8[r15]=1;r22=HEAP16[r19>>1];if(r22<<16>>16!=r29<<16>>16){_fprintf(r13,9856,(r3=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[r3>>2]=r22&65535,HEAP32[r3+8>>2]=r6,r3));STACKTOP=r3;HEAP8[r16]=HEAP8[r16]|8}r3=r1+13|0;r6=HEAP8[r3];if(r6<<24>>24==0){r22=HEAP8[r16];do{if((r22&8)==0){if((HEAP8[r1+2|0]&16)==0){break}r29=r1+5|0;HEAP8[r29]=HEAP8[r29]+1;HEAP32[HEAP32[r5>>2]+20>>2]=5;HEAP32[r1+16>>2]=0;HEAP16[r1+24>>1]=0;HEAP8[r1+26|0]=0;HEAP16[r1+32>>1]=0;HEAP16[r1+34>>1]=1;HEAP32[r1+65696>>2]=528;HEAP32[r1+65688>>2]=0;HEAP32[r1+65692>>2]=546;STACKTOP=r4;return}}while(0);r29=r1+65692|0;HEAP32[r29>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r8>>2]<<1;HEAP32[r29>>2]=1082}HEAP8[r15]=1;HEAP8[r3]=0;HEAP8[r16]=r22&-2;r22=r1+65716|0;do{if((HEAP8[r22]|0)!=1){HEAP8[r22]=1;r29=HEAP32[r1+65724>>2];if((r29|0)==0){break}FUNCTION_TABLE[r29](HEAP32[r1+65720>>2],1)}}while(0);r22=HEAP32[r5>>2];r29=r22+24|0;if((HEAP8[r29]|0)==0){STACKTOP=r4;return}r19=HEAP32[r1+65712>>2];if((r19|0)==0){STACKTOP=r4;return}if((FUNCTION_TABLE[r19](HEAP32[r1+65708>>2],r22)|0)==0){HEAP8[r29]=0;STACKTOP=r4;return}else{_fwrite(25560,26,1,r13);STACKTOP=r4;return}}if((HEAP8[r15]|0)==0){HEAP8[r3]=r6;STACKTOP=r4;return}r29=r1+2|0;HEAP8[r29]=r6;r6=HEAP8[r16];r22=r1+65716|0;do{if((HEAP8[r22]|0)!=0){HEAP8[r22]=0;r19=HEAP32[r1+65724>>2];if((r19|0)==0){break}FUNCTION_TABLE[r19](HEAP32[r1+65720>>2],0)}}while(0);HEAP8[r16]=1;do{if((r6&1)==0){HEAP8[r16]=1;r19=HEAP32[r5>>2];if((HEAP32[r19+8>>2]|0)==0){HEAP8[r16]=5;r31=69;r32=5}else{r31=65;r32=1}if((HEAP8[r19+1|0]|0)==0){r33=r32;break}HEAP8[r16]=r31;r33=r31}else{r33=1}}while(0);r31=HEAP8[r29];r29=r1+65692|0;HEAP32[r29>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r8>>2]<<1;HEAP32[r29>>2]=1082}HEAP8[r15]=1;HEAP8[r3]=0;HEAP8[r16]=r33&-2;do{if((r31&8)!=0){if((HEAP8[r22]|0)==1){break}HEAP8[r22]=1;r33=HEAP32[r1+65724>>2];if((r33|0)==0){break}FUNCTION_TABLE[r33](HEAP32[r1+65720>>2],1)}}while(0);r22=HEAP32[r5>>2];r5=r22+24|0;if((HEAP8[r5]|0)==0){STACKTOP=r4;return}r31=HEAP32[r1+65712>>2];if((r31|0)==0){STACKTOP=r4;return}if((FUNCTION_TABLE[r31](HEAP32[r1+65708>>2],r22)|0)==0){HEAP8[r5]=0;STACKTOP=r4;return}else{_fwrite(25560,26,1,r13);STACKTOP=r4;return}}else if(r2==72){STACKTOP=r4;return}}function _cmd_step_cont(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=(HEAP8[r1+2|0]&16)!=0;do{if((HEAP8[r1+7|0]|0)==0){if(r2){r3=r1+4|0;HEAP8[r3]=HEAP8[r3]-1}r3=HEAP32[r1+65680>>2]+8|0;r4=HEAP32[r3>>2];if((r4|0)==0){break}HEAP32[r3>>2]=r4-1}else{if(r2){r4=r1+4|0;HEAP8[r4]=HEAP8[r4]+1}r4=HEAP32[r1+65680>>2]+8|0;r3=HEAP32[r4>>2];if(r3>>>0>=83){break}HEAP32[r4>>2]=r3+1}}while(0);r2=r1+65680|0;HEAP32[HEAP32[r2>>2]+32>>2]=0;r3=r1+3|0;r4=HEAP8[r3]&-85;HEAP8[r3]=r4;r5=HEAP32[r2>>2];if((HEAP32[r5+8>>2]|0)==0){r6=r4|4;HEAP8[r3]=r6;r7=r6}else{r7=r4}if((HEAP8[r5+1|0]|0)==0){r8=r7}else{r4=r7|64;HEAP8[r3]=r4;r8=r4}r4=r1+65692|0;HEAP32[r4>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r4>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r3]=r8&-2;r8=r1+65716|0;do{if((HEAP8[r8]|0)==1){r9=r5}else{HEAP8[r8]=1;r3=HEAP32[r1+65724>>2];if((r3|0)==0){r9=r5;break}FUNCTION_TABLE[r3](HEAP32[r1+65720>>2],1);r9=HEAP32[r2>>2]}}while(0);r2=r9+24|0;if((HEAP8[r2]|0)==0){return}r5=HEAP32[r1+65712>>2];if((r5|0)==0){return}if((FUNCTION_TABLE[r5](HEAP32[r1+65708>>2],r9)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);return}}function _cmd_seek_cont(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=HEAP8[r1+6|0];r3=r1+4|0;r4=HEAP8[r3];do{if((r2&255)<(r4&255)){HEAP8[r3]=r4-1;r5=HEAP32[r1+65680>>2]+8|0;r6=HEAP32[r5>>2];if((r6|0)==0){break}HEAP32[r5>>2]=r6-1}else{if((r2&255)>(r4&255)){HEAP8[r3]=r4+1;r6=HEAP32[r1+65680>>2]+8|0;r5=HEAP32[r6>>2];if(r5>>>0>=83){break}HEAP32[r6>>2]=r5+1;break}r5=r1+3|0;r6=HEAP8[r5]&-85;HEAP8[r5]=r6;r7=r1+65680|0;r8=HEAP32[r7>>2];r9=r8+8|0;if((HEAP32[r9>>2]|0)==0){r10=r6|4;HEAP8[r5]=r10;r11=r10}else{r11=r6}if((HEAP8[r8+1|0]|0)==0){r12=r11}else{r6=r11|64;HEAP8[r5]=r6;r12=r6}do{if((HEAP8[r1+2|0]&4)==0){r13=r12}else{if((HEAP32[r9>>2]|0)==(r4&255|0)){r13=r12;break}r6=r12|16;HEAP8[r5]=r6;r13=r6}}while(0);r9=r1+65692|0;HEAP32[r9>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r9>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r5]=r13&-2;r9=r1+65716|0;do{if((HEAP8[r9]|0)==1){r14=r8}else{HEAP8[r9]=1;r6=HEAP32[r1+65724>>2];if((r6|0)==0){r14=r8;break}FUNCTION_TABLE[r6](HEAP32[r1+65720>>2],1);r14=HEAP32[r7>>2]}}while(0);r7=r14+24|0;if((HEAP8[r7]|0)==0){return}r8=HEAP32[r1+65712>>2];if((r8|0)==0){return}if((FUNCTION_TABLE[r8](HEAP32[r1+65708>>2],r14)|0)==0){HEAP8[r7]=0;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);return}}}while(0);r14=r1+65680|0;HEAP32[HEAP32[r14>>2]+32>>2]=0;r13=r1+3|0;r12=HEAP8[r13];HEAP8[r13]=(HEAP32[HEAP32[r14>>2]+8>>2]|0)==0?r12|4:r12&-5;HEAP32[r1+65688>>2]=1e3;return}function _cmd_restore_cont(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+65680|0;r3=HEAP32[r2>>2];r4=r3+8|0;if((HEAP32[r4>>2]|0)!=0){HEAP32[r3+32>>2]=0;r5=HEAP32[r2>>2]+8|0;HEAP32[r5>>2]=HEAP32[r5>>2]-1;HEAP32[r1+65688>>2]=1e3;return}HEAP8[r1+4|0]=0;r5=r1+3|0;r6=HEAP8[r5]&-85;HEAP8[r5]=r6;if((HEAP32[r4>>2]|0)==0){r4=r6|4;HEAP8[r5]=r4;r7=r4}else{r7=r6}if((HEAP8[r3+1|0]|0)==0){r8=r7}else{r6=r7|64;HEAP8[r5]=r6;r8=r6}r6=r1+65692|0;HEAP32[r6>>2]=0;HEAP32[r1+65696>>2]=0;if((HEAP8[r1+1|0]|0)!=0){HEAP32[r1+65688>>2]=HEAP32[r1+60>>2]<<1;HEAP32[r6>>2]=1082}HEAP8[r1+12|0]=1;HEAP8[r1+13|0]=0;HEAP8[r5]=r8&-2;r8=r1+65716|0;do{if((HEAP8[r8]|0)==1){r9=r3}else{HEAP8[r8]=1;r5=HEAP32[r1+65724>>2];if((r5|0)==0){r9=r3;break}FUNCTION_TABLE[r5](HEAP32[r1+65720>>2],1);r9=HEAP32[r2>>2]}}while(0);r2=r9+24|0;if((HEAP8[r2]|0)==0){return}r3=HEAP32[r1+65712>>2];if((r3|0)==0){return}if((FUNCTION_TABLE[r3](HEAP32[r1+65708>>2],r9)|0)==0){HEAP8[r2]=0;return}else{_fwrite(25560,26,1,HEAP32[_stderr>>2]);return}}function _mem_blk_new(r1,r2,r3){var r4,r5,r6,r7,r8;r4=_malloc(48);r5=r4;if((r4|0)==0){r6=0;return r6}do{if((r3|0)==0){HEAP32[r4+44>>2]=0;r7=0}else{r8=_malloc(r2+16|0);HEAP32[r4+44>>2]=r8;if((r8|0)!=0){r7=r8;break}_free(r4);r6=0;return r6}}while(0);HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP32[r4+8>>2]=0;HEAP32[r4+12>>2]=0;HEAP32[r4+16>>2]=0;HEAP32[r4+20>>2]=0;HEAP32[r4+24>>2]=r4;HEAP8[r4+28|0]=1;HEAP8[r4+29|0]=0;HEAP8[r4+30|0]=(r7|0)!=0|0;HEAP32[r4+32>>2]=r1;HEAP32[r4+36>>2]=r1-1+r2;HEAP32[r4+40>>2]=r2;r6=r5;return r6}function _mem_blk_clear(r1,r2){var r3;r3=HEAP32[r1+44>>2];if((r3|0)==0){return}_memset(r3,r2,HEAP32[r1+40>>2])|0;return}function _mem_blk_set_readonly(r1,r2){HEAP8[r1+29|0]=(r2|0)!=0|0;return}function _mem_new(){var r1,r2;r1=_malloc(56);if((r1|0)==0){r2=0;return r2}_memset(r1,0,52)|0;HEAP32[r1+52>>2]=-1;r2=r1;return r2}function _mem_set_fct(r1,r2,r3,r4,r5,r6,r7,r8){HEAP32[r1+24>>2]=r2;HEAP32[r1+28>>2]=r3;HEAP32[r1+32>>2]=r4;HEAP32[r1+36>>2]=r5;HEAP32[r1+40>>2]=r6;HEAP32[r1+44>>2]=r7;HEAP32[r1+48>>2]=r8;return}function _mem_prt_state(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=r1|0;if((HEAP32[r5>>2]|0)==0){STACKTOP=r4;return}r6=r1+4|0;r1=0;while(1){r7=HEAP32[HEAP32[r6>>2]+(r1<<3)>>2];r8=HEAP32[r7+32>>2];r9=HEAP32[r7+36>>2];r10=HEAP32[r7+40>>2];r11=(HEAP8[r7+29|0]|0)!=0|0;_fprintf(r2,10824,(r3=STACKTOP,STACKTOP=STACKTOP+40|0,HEAP32[r3>>2]=r1,HEAP32[r3+8>>2]=r8,HEAP32[r3+16>>2]=r9,HEAP32[r3+24>>2]=r10,HEAP32[r3+32>>2]=r11,r3));STACKTOP=r3;r11=r1+1|0;if(r11>>>0<HEAP32[r5>>2]>>>0){r1=r11}else{break}}STACKTOP=r4;return}function _mem_add_blk(r1,r2,r3){var r4,r5,r6,r7;if((r2|0)==0){return}r4=r1+4|0;r5=r1|0;r6=_realloc(HEAP32[r4>>2],(HEAP32[r5>>2]<<3)+8|0);r7=r6;if((r6|0)==0){return}HEAP32[r4>>2]=r7;r4=HEAP32[r5>>2];HEAP32[r5>>2]=r4+1;HEAP32[r7+(r4<<3)>>2]=r2;HEAP32[r7+(r4<<3)+4>>2]=(r3|0)!=0;r3=r1+8|0;HEAP32[r3>>2]=0;HEAP32[r3+4>>2]=0;HEAP32[r3+8>>2]=0;HEAP32[r3+12>>2]=0;return}function _mem_move_to_front(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=0;r4=r1+8|0;r5=HEAP32[r4>>2];do{if((r5|0)==0){r3=5}else{r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)==0){r3=5;break}if(HEAP32[r6+32>>2]>>>0>r2>>>0){r3=5;break}if(HEAP32[r6+36>>2]>>>0<r2>>>0){r3=5}else{r7=r6}}}while(0);do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)==0){return}r6=0;r8=HEAP32[r1+4>>2];L10:while(1){r9=HEAP32[r8>>2];do{if((HEAP8[r9+28|0]|0)!=0){if(HEAP32[r9+32>>2]>>>0>r2>>>0){break}if(HEAP32[r9+36>>2]>>>0>=r2>>>0){r3=10;break L10}}}while(0);r10=r6+1|0;if(r10>>>0<r5>>>0){r6=r10;r8=r8+8|0}else{r3=19;break}}if(r3==10){HEAP32[r4>>2]=r8;r7=r9;break}else if(r3==19){return}}}while(0);if((r7|0)==0){return}r9=HEAP32[r1>>2];r4=r1+4|0;r1=0;while(1){if(r1>>>0>=r9>>>0){r3=19;break}r11=HEAP32[r4>>2];if((HEAP32[r11+(r1<<3)>>2]|0)==(r7|0)){break}else{r1=r1+1|0}}if(r3==19){return}if((r1|0)==0){r12=r11}else{r3=r1;r1=r11;while(1){r11=r3-1|0;HEAP32[r1+(r3<<3)>>2]=HEAP32[r1+(r11<<3)>>2];r9=HEAP32[r4>>2];if((r11|0)==0){r12=r9;break}else{r3=r11;r1=r9}}}HEAP32[r12>>2]=r7;return}function _mem_get_uint8(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];do{if((r5|0)==0){r3=5}else{r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)==0){r3=5;break}if(HEAP32[r6+32>>2]>>>0>r2>>>0){r3=5;break}if(HEAP32[r6+36>>2]>>>0<r2>>>0){r3=5}else{r7=r6;r3=12}}}while(0);L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)==0){break}r6=0;r8=HEAP32[r1+4>>2];L8:while(1){r9=HEAP32[r8>>2];do{if((HEAP8[r9+28|0]|0)!=0){if(HEAP32[r9+32>>2]>>>0>r2>>>0){break}if(HEAP32[r9+36>>2]>>>0>=r2>>>0){break L8}}}while(0);r10=r6+1|0;if(r10>>>0<r5>>>0){r6=r10;r8=r8+8|0}else{break L5}}HEAP32[r4>>2]=r8;r7=r9;r3=12}}while(0);do{if(r3==12){if((r7|0)==0){break}r9=r2-HEAP32[r7+32>>2]|0;r4=HEAP32[r7>>2];if((r4|0)==0){r11=HEAP8[HEAP32[r7+44>>2]+r9|0];return r11}else{r11=FUNCTION_TABLE[r4](HEAP32[r7+24>>2],r9);return r11}}}while(0);r7=HEAP32[r1+28>>2];if((r7|0)==0){r11=HEAP32[r1+52>>2]&255;return r11}else{r11=FUNCTION_TABLE[r7](HEAP32[r1+24>>2],r2);return r11}}function _mem_get_uint16_le(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=r1+12|0;r5=HEAP32[r4>>2];do{if((r5|0)==0){r3=5}else{r6=HEAP32[r5>>2];if((HEAP8[r6+28|0]|0)==0){r3=5;break}if(HEAP32[r6+32>>2]>>>0>r2>>>0){r3=5;break}if(HEAP32[r6+36>>2]>>>0<r2>>>0){r3=5}else{r7=r6;r3=12}}}while(0);L5:do{if(r3==5){r5=HEAP32[r1>>2];if((r5|0)==0){break}r6=0;r8=HEAP32[r1+4>>2];L8:while(1){r9=HEAP32[r8>>2];do{if((HEAP8[r9+28|0]|0)!=0){if(HEAP32[r9+32>>2]>>>0>r2>>>0){break}if(HEAP32[r9+36>>2]>>>0>=r2>>>0){break L8}}}while(0);r10=r6+1|0;if(r10>>>0<r5>>>0){r6=r10;r8=r8+8|0}else{break L5}}HEAP32[r4>>2]=r8;r7=r9;r3=12}}while(0);do{if(r3==12){if((r7|0)==0){break}r9=r2+1|0;if(r9>>>0>HEAP32[r7+36>>2]>>>0){r4=_mem_get_uint8(r1,r2);r11=(_mem_get_uint8(r1,r9)&255)<<8|r4&255;return r11}r4=r2-HEAP32[r7+32>>2]|0;r9=HEAP32[r7+4>>2];if((r9|0)==0){r6=HEAP32[r7+44>>2];r11=HEAPU8[r6+(r4+1)|0]<<8|HEAPU8[r6+r4|0];return r11}else{r11=FUNCTION_TABLE[r9](HEAP32[r7+24>>2],r4);return r11}}}while(0);r7=HEAP32[r1+32>>2];if((r7|0)==0){r11=HEAP32[r1+52>>2]&65535;return r11}else{r11=FUNCTION_TABLE[r7](HEAP32[r1+24>>2],r2);return r11}}function _mem_set_uint8_rw(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1+8|0;r6=HEAP32[r5>>2];do{if((r6|0)==0){r4=5}else{r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)==0){r4=5;break}if(HEAP32[r7+32>>2]>>>0>r2>>>0){r4=5;break}if(HEAP32[r7+36>>2]>>>0<r2>>>0){r4=5}else{r8=r7;r4=12}}}while(0);L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)==0){break}r7=0;r9=HEAP32[r1+4>>2];L8:while(1){r10=HEAP32[r9>>2];do{if((HEAP8[r10+28|0]|0)!=0){if(HEAP32[r10+32>>2]>>>0>r2>>>0){break}if(HEAP32[r10+36>>2]>>>0>=r2>>>0){break L8}}}while(0);r11=r7+1|0;if(r11>>>0<r6>>>0){r7=r11;r9=r9+8|0}else{break L5}}HEAP32[r5>>2]=r9;r8=r10;r4=12}}while(0);do{if(r4==12){if((r8|0)==0){break}r10=r2-HEAP32[r8+32>>2]|0;r5=HEAP32[r8+12>>2];if((r5|0)==0){HEAP8[HEAP32[r8+44>>2]+r10|0]=r3;return}else{FUNCTION_TABLE[r5](HEAP32[r8+24>>2],r10,r3);return}}}while(0);r8=HEAP32[r1+40>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint8(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];do{if((r6|0)==0){r4=5}else{r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)==0){r4=5;break}if(HEAP32[r7+32>>2]>>>0>r2>>>0){r4=5;break}if(HEAP32[r7+36>>2]>>>0<r2>>>0){r4=5}else{r8=r7;r4=12}}}while(0);L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)==0){break}r7=0;r9=HEAP32[r1+4>>2];L8:while(1){r10=HEAP32[r9>>2];do{if((HEAP8[r10+28|0]|0)!=0){if(HEAP32[r10+32>>2]>>>0>r2>>>0){break}if(HEAP32[r10+36>>2]>>>0>=r2>>>0){break L8}}}while(0);r11=r7+1|0;if(r11>>>0<r6>>>0){r7=r11;r9=r9+8|0}else{break L5}}HEAP32[r5>>2]=r9;r8=r10;r4=12}}while(0);do{if(r4==12){if((r8|0)==0){break}if((HEAP8[r8+29|0]|0)!=0){return}r10=r2-HEAP32[r8+32>>2]|0;r5=HEAP32[r8+12>>2];if((r5|0)==0){HEAP8[HEAP32[r8+44>>2]+r10|0]=r3;return}else{FUNCTION_TABLE[r5](HEAP32[r8+24>>2],r10,r3);return}}}while(0);r8=HEAP32[r1+40>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+24>>2],r2,r3);return}function _mem_set_uint16_le(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=r1+16|0;r6=HEAP32[r5>>2];do{if((r6|0)==0){r4=5}else{r7=HEAP32[r6>>2];if((HEAP8[r7+28|0]|0)==0){r4=5;break}if(HEAP32[r7+32>>2]>>>0>r2>>>0){r4=5;break}if(HEAP32[r7+36>>2]>>>0<r2>>>0){r4=5}else{r8=r7;r4=12}}}while(0);L5:do{if(r4==5){r6=HEAP32[r1>>2];if((r6|0)==0){break}r7=0;r9=HEAP32[r1+4>>2];L8:while(1){r10=HEAP32[r9>>2];do{if((HEAP8[r10+28|0]|0)!=0){if(HEAP32[r10+32>>2]>>>0>r2>>>0){break}if(HEAP32[r10+36>>2]>>>0>=r2>>>0){break L8}}}while(0);r11=r7+1|0;if(r11>>>0<r6>>>0){r7=r11;r9=r9+8|0}else{break L5}}HEAP32[r5>>2]=r9;r8=r10;r4=12}}while(0);do{if(r4==12){if((r8|0)==0){break}r10=r2+1|0;if(r10>>>0>HEAP32[r8+36>>2]>>>0){_mem_set_uint8(r1,r2,r3&255);_mem_set_uint8(r1,r10,(r3&65535)>>>8&255);return}if((HEAP8[r8+29|0]|0)!=0){return}r10=r2-HEAP32[r8+32>>2]|0;r5=HEAP32[r8+16>>2];if((r5|0)==0){r7=r8+44|0;HEAP8[HEAP32[r7>>2]+r10|0]=r3;HEAP8[HEAP32[r7>>2]+(r10+1)|0]=(r3&65535)>>>8;return}else{FUNCTION_TABLE[r5](HEAP32[r8+24>>2],r10,r3);return}}}while(0);r8=HEAP32[r1+44>>2];if((r8|0)==0){return}FUNCTION_TABLE[r8](HEAP32[r1+24>>2],r2,r3);return}function _dsk_get_uint32_be(r1,r2){return((HEAPU8[r1+r2|0]<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+3)|0]}function _dsk_set_uint32_be(r1,r2,r3){HEAP8[r1+r2|0]=r3>>>24;HEAP8[r1+(r2+1)|0]=r3>>>16;HEAP8[r1+(r2+2)|0]=r3>>>8;HEAP8[r1+(r2+3)|0]=r3;return}function _dsk_get_uint32_le(r1,r2){return((HEAPU8[r1+(r2+3)|0]<<8|HEAPU8[r1+(r2+2)|0])<<8|HEAPU8[r1+(r2+1)|0])<<8|HEAPU8[r1+r2|0]}function _dsk_get_uint64_le(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=HEAPU8[r1+(r2+7)|0];r4=r3<<8|0>>>24|HEAPU8[r1+(r2+6)|0];r5=r4<<8|0>>>24|HEAPU8[r1+(r2+5)|0];r6=r5<<8|0>>>24|HEAPU8[r1+(r2+4)|0];r7=r6<<8|0>>>24|HEAPU8[r1+(r2+3)|0];r8=r7<<8|0>>>24|HEAPU8[r1+(r2+2)|0];r9=r8<<8|0>>>24|HEAPU8[r1+(r2+1)|0];return tempRet0=((((((0<<8|r3>>>24)<<8|r4>>>24)<<8|r5>>>24)<<8|r6>>>24)<<8|r7>>>24)<<8|r8>>>24)<<8|r9>>>24|0,r9<<8|0>>>24|HEAPU8[r1+r2|0]}function _dsk_set_uint32_le(r1,r2,r3){HEAP8[r1+r2|0]=r3;HEAP8[r1+(r2+1)|0]=r3>>>8;HEAP8[r1+(r2+2)|0]=r3>>>16;HEAP8[r1+(r2+3)|0]=r3>>>24;return}function _dsk_set_uint64_le(r1,r2,r3,r4){HEAP8[r1+r2|0]=r3;HEAP8[r1+(r2+1)|0]=r3>>>8|r4<<24;HEAP8[r1+(r2+2)|0]=r3>>>16|r4<<16;HEAP8[r1+(r2+3)|0]=r3>>>24|r4<<8;HEAP8[r1+(r2+4)|0]=r4;HEAP8[r1+(r2+5)|0]=r4>>>8|0<<24;HEAP8[r1+(r2+6)|0]=r4>>>16|0<<16;HEAP8[r1+(r2+7)|0]=r4>>>24|0<<8;return}function _dsk_read(r1,r2,r3,r4,r5,r6){var r7,r8;if((_fseek(r1,r3,0)|0)!=0){r7=1;return r7}r3=_fread(r2,1,r5,r1);r1=r3;r4=0;if(!(r4>>>0<r6>>>0|r4>>>0==r6>>>0&r1>>>0<r5>>>0)){r7=0;return r7}r8=_i64Subtract(r5,r6,r1,r4);_memset(r2+r3|0,0,r8)|0;r7=0;return r7}function _dsk_write(r1,r2,r3,r4,r5,r6){var r7;if((_fseek(r1,r3,0)|0)!=0){r7=1;return r7}r7=((_fwrite(r2,1,r5,r1)|0)!=(r5|0)|0!=(r6|0))&1;return r7}function _dsk_get_filesize(r1,r2){var r3,r4;if((_fseek(r1,0,2)|0)!=0){r3=1;return r3}r4=_ftell(r1);if((r4|0)==-1){r3=1;return r3}HEAP32[r2>>2]=r4;HEAP32[r2+4>>2]=(r4|0)<0|0?-1:0;r3=0;return r3}function _dsk_set_filesize(r1,r2,r3){_fflush(r1);return(_ftruncate(_fileno(r1),r2)|0)!=0|0}function _dsk_init(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13;r7=0;r8=r1;HEAP32[r8>>2]=0;HEAP32[r8+4>>2]=0;HEAP32[r8+8>>2]=0;HEAP32[r8+12>>2]=0;HEAP32[r8+16>>2]=0;HEAP32[r8+20>>2]=0;HEAP32[r8+24>>2]=0;if((r3|0)==0){r8=Math_imul(Math_imul(r5,r4)|0,r6)|0;if((r8|0)==0){r9=r6;r10=r5;r11=r4;r12=0}else{r13=r8;r7=3}}else{r13=r3;r7=3}do{if(r7==3){if((r4|0)==0){r3=(r6|0)==0?63:r6;r8=(r5|0)==0?16:r5;r9=r3;r10=r8;r11=(r13>>>0)/((Math_imul(r3,r8)|0)>>>0)&-1;r12=r13;break}r8=(r6|0)==0;if((r5|0)==0){r3=r8?63:r6;r9=r3;r10=(r13>>>0)/((Math_imul(r3,r4)|0)>>>0)&-1;r11=r4;r12=r13;break}if(!r8){r9=r6;r10=r5;r11=r4;r12=r13;break}r9=(r13>>>0)/((Math_imul(r5,r4)|0)>>>0)&-1;r10=r5;r11=r4;r12=r13}}while(0);HEAP32[r1+28>>2]=r12;HEAP32[r1+32>>2]=r11;HEAP32[r1+36>>2]=r10;HEAP32[r1+40>>2]=r9;HEAP32[r1+44>>2]=r11;HEAP32[r1+48>>2]=r10;HEAP32[r1+52>>2]=r9;HEAP8[r1+56|0]=0;HEAP32[r1+60>>2]=0;HEAP32[r1+64>>2]=r2;return}function _dsk_del(r1){var r2;if((r1|0)==0){return}_free(HEAP32[r1+60>>2]);r2=HEAP32[r1+4>>2];if((r2|0)==0){return}FUNCTION_TABLE[r2](r1);return}function _dsk_set_drive(r1,r2){HEAP32[r1+24>>2]=r2;return}function _dsk_get_type(r1){return HEAP32[r1>>2]}function _dsk_set_type(r1,r2){HEAP32[r1>>2]=r2;return}function _dsk_get_readonly(r1){return(HEAP8[r1+56|0]|0)!=0|0}function _dsk_set_readonly(r1,r2){HEAP8[r1+56|0]=(r2|0)!=0|0;return}function _dsk_set_fname(r1,r2){var r3;r3=r1+60|0;r1=HEAP32[r3>>2];if((r1|0)!=0){_free(r1)}if((r2|0)==0){HEAP32[r3>>2]=0;return}r1=_malloc(_strlen(r2)+1|0);HEAP32[r3>>2]=r1;if((r1|0)==0){return}_strcpy(r1,r2);return}function _dsk_set_geometry(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;do{if((r2|0)==0){r6=Math_imul(Math_imul(r4,r3)|0,r5)|0;if((r6|0)==0){r7=1}else{r8=r6;break}return r7}else{r8=r2}}while(0);do{if((r3|0)==0){r2=(r5|0)==0?63:r5;r6=(r4|0)==0?16:r4;r9=r2;r10=(r8>>>0)/((Math_imul(r2,r6)|0)>>>0)&-1;r11=r6}else{r6=(r5|0)==0;if((r4|0)==0){r2=r6?63:r5;r9=r2;r10=r3;r11=(r8>>>0)/((Math_imul(r2,r3)|0)>>>0)&-1;break}if(!r6){r9=r5;r10=r3;r11=r4;break}r9=(r8>>>0)/((Math_imul(r4,r3)|0)>>>0)&-1;r10=r3;r11=r4}}while(0);HEAP32[r1+28>>2]=r8;HEAP32[r1+32>>2]=r10;HEAP32[r1+36>>2]=r11;HEAP32[r1+40>>2]=r9;r7=0;return r7}function _dsk_set_visible_chs(r1,r2,r3,r4){HEAP32[r1+44>>2]=r2;HEAP32[r1+48>>2]=r3;HEAP32[r1+52>>2]=r4;return}function _dsk_get_drive(r1){return HEAP32[r1+24>>2]}function _dsk_get_block_cnt(r1){return HEAP32[r1+28>>2]}









function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r2=0;if((r1|0)==0){return}r3=r1-8|0;r4=r3;r5=HEAP32[32e3>>2];if(r3>>>0<r5>>>0){_abort()}r6=HEAP32[r1-4>>2];r7=r6&3;if((r7|0)==1){_abort()}r8=r6&-8;r9=r1+(r8-8)|0;r10=r9;L10:do{if((r6&1|0)==0){r11=HEAP32[r3>>2];if((r7|0)==0){return}r12=-8-r11|0;r13=r1+r12|0;r14=r13;r15=r11+r8|0;if(r13>>>0<r5>>>0){_abort()}if((r14|0)==(HEAP32[32004>>2]|0)){r16=r1+(r8-4)|0;if((HEAP32[r16>>2]&3|0)!=3){r17=r14;r18=r15;break}HEAP32[31992>>2]=r15;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;HEAP32[r1+(r12+4)>>2]=r15|1;HEAP32[r9>>2]=r15;return}r16=r11>>>3;if(r11>>>0<256){r11=HEAP32[r1+(r12+8)>>2];r19=HEAP32[r1+(r12+12)>>2];r20=32024+(r16<<1<<2)|0;do{if((r11|0)!=(r20|0)){if(r11>>>0<r5>>>0){_abort()}if((HEAP32[r11+12>>2]|0)==(r14|0)){break}_abort()}}while(0);if((r19|0)==(r11|0)){HEAP32[31984>>2]=HEAP32[31984>>2]&~(1<<r16);r17=r14;r18=r15;break}do{if((r19|0)==(r20|0)){r21=r19+8|0}else{if(r19>>>0<r5>>>0){_abort()}r22=r19+8|0;if((HEAP32[r22>>2]|0)==(r14|0)){r21=r22;break}_abort()}}while(0);HEAP32[r11+12>>2]=r19;HEAP32[r21>>2]=r11;r17=r14;r18=r15;break}r20=r13;r16=HEAP32[r1+(r12+24)>>2];r22=HEAP32[r1+(r12+12)>>2];do{if((r22|0)==(r20|0)){r23=r1+(r12+20)|0;r24=HEAP32[r23>>2];if((r24|0)==0){r25=r1+(r12+16)|0;r26=HEAP32[r25>>2];if((r26|0)==0){r27=0;break}else{r28=r26;r29=r25}}else{r28=r24;r29=r23}while(1){r23=r28+20|0;r24=HEAP32[r23>>2];if((r24|0)!=0){r28=r24;r29=r23;continue}r23=r28+16|0;r24=HEAP32[r23>>2];if((r24|0)==0){break}else{r28=r24;r29=r23}}if(r29>>>0<r5>>>0){_abort()}else{HEAP32[r29>>2]=0;r27=r28;break}}else{r23=HEAP32[r1+(r12+8)>>2];if(r23>>>0<r5>>>0){_abort()}r24=r23+12|0;if((HEAP32[r24>>2]|0)!=(r20|0)){_abort()}r25=r22+8|0;if((HEAP32[r25>>2]|0)==(r20|0)){HEAP32[r24>>2]=r22;HEAP32[r25>>2]=r23;r27=r22;break}else{_abort()}}}while(0);if((r16|0)==0){r17=r14;r18=r15;break}r22=r1+(r12+28)|0;r13=32288+(HEAP32[r22>>2]<<2)|0;do{if((r20|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r27;if((r27|0)!=0){break}HEAP32[31988>>2]=HEAP32[31988>>2]&~(1<<HEAP32[r22>>2]);r17=r14;r18=r15;break L10}else{if(r16>>>0<HEAP32[32e3>>2]>>>0){_abort()}r11=r16+16|0;if((HEAP32[r11>>2]|0)==(r20|0)){HEAP32[r11>>2]=r27}else{HEAP32[r16+20>>2]=r27}if((r27|0)==0){r17=r14;r18=r15;break L10}}}while(0);if(r27>>>0<HEAP32[32e3>>2]>>>0){_abort()}HEAP32[r27+24>>2]=r16;r20=HEAP32[r1+(r12+16)>>2];do{if((r20|0)!=0){if(r20>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r27+16>>2]=r20;HEAP32[r20+24>>2]=r27;break}}}while(0);r20=HEAP32[r1+(r12+20)>>2];if((r20|0)==0){r17=r14;r18=r15;break}if(r20>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r27+20>>2]=r20;HEAP32[r20+24>>2]=r27;r17=r14;r18=r15;break}}else{r17=r4;r18=r8}}while(0);r4=r17;if(r4>>>0>=r9>>>0){_abort()}r27=r1+(r8-4)|0;r5=HEAP32[r27>>2];if((r5&1|0)==0){_abort()}do{if((r5&2|0)==0){if((r10|0)==(HEAP32[32008>>2]|0)){r28=HEAP32[31996>>2]+r18|0;HEAP32[31996>>2]=r28;HEAP32[32008>>2]=r17;HEAP32[r17+4>>2]=r28|1;if((r17|0)!=(HEAP32[32004>>2]|0)){return}HEAP32[32004>>2]=0;HEAP32[31992>>2]=0;return}if((r10|0)==(HEAP32[32004>>2]|0)){r28=HEAP32[31992>>2]+r18|0;HEAP32[31992>>2]=r28;HEAP32[32004>>2]=r17;HEAP32[r17+4>>2]=r28|1;HEAP32[r4+r28>>2]=r28;return}r28=(r5&-8)+r18|0;r29=r5>>>3;L112:do{if(r5>>>0<256){r21=HEAP32[r1+r8>>2];r7=HEAP32[r1+(r8|4)>>2];r3=32024+(r29<<1<<2)|0;do{if((r21|0)!=(r3|0)){if(r21>>>0<HEAP32[32e3>>2]>>>0){_abort()}if((HEAP32[r21+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r7|0)==(r21|0)){HEAP32[31984>>2]=HEAP32[31984>>2]&~(1<<r29);break}do{if((r7|0)==(r3|0)){r30=r7+8|0}else{if(r7>>>0<HEAP32[32e3>>2]>>>0){_abort()}r6=r7+8|0;if((HEAP32[r6>>2]|0)==(r10|0)){r30=r6;break}_abort()}}while(0);HEAP32[r21+12>>2]=r7;HEAP32[r30>>2]=r21}else{r3=r9;r6=HEAP32[r1+(r8+16)>>2];r20=HEAP32[r1+(r8|4)>>2];do{if((r20|0)==(r3|0)){r16=r1+(r8+12)|0;r22=HEAP32[r16>>2];if((r22|0)==0){r13=r1+(r8+8)|0;r11=HEAP32[r13>>2];if((r11|0)==0){r31=0;break}else{r32=r11;r33=r13}}else{r32=r22;r33=r16}while(1){r16=r32+20|0;r22=HEAP32[r16>>2];if((r22|0)!=0){r32=r22;r33=r16;continue}r16=r32+16|0;r22=HEAP32[r16>>2];if((r22|0)==0){break}else{r32=r22;r33=r16}}if(r33>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r33>>2]=0;r31=r32;break}}else{r16=HEAP32[r1+r8>>2];if(r16>>>0<HEAP32[32e3>>2]>>>0){_abort()}r22=r16+12|0;if((HEAP32[r22>>2]|0)!=(r3|0)){_abort()}r13=r20+8|0;if((HEAP32[r13>>2]|0)==(r3|0)){HEAP32[r22>>2]=r20;HEAP32[r13>>2]=r16;r31=r20;break}else{_abort()}}}while(0);if((r6|0)==0){break}r20=r1+(r8+20)|0;r21=32288+(HEAP32[r20>>2]<<2)|0;do{if((r3|0)==(HEAP32[r21>>2]|0)){HEAP32[r21>>2]=r31;if((r31|0)!=0){break}HEAP32[31988>>2]=HEAP32[31988>>2]&~(1<<HEAP32[r20>>2]);break L112}else{if(r6>>>0<HEAP32[32e3>>2]>>>0){_abort()}r7=r6+16|0;if((HEAP32[r7>>2]|0)==(r3|0)){HEAP32[r7>>2]=r31}else{HEAP32[r6+20>>2]=r31}if((r31|0)==0){break L112}}}while(0);if(r31>>>0<HEAP32[32e3>>2]>>>0){_abort()}HEAP32[r31+24>>2]=r6;r3=HEAP32[r1+(r8+8)>>2];do{if((r3|0)!=0){if(r3>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r31+16>>2]=r3;HEAP32[r3+24>>2]=r31;break}}}while(0);r3=HEAP32[r1+(r8+12)>>2];if((r3|0)==0){break}if(r3>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r31+20>>2]=r3;HEAP32[r3+24>>2]=r31;break}}}while(0);HEAP32[r17+4>>2]=r28|1;HEAP32[r4+r28>>2]=r28;if((r17|0)!=(HEAP32[32004>>2]|0)){r34=r28;break}HEAP32[31992>>2]=r28;return}else{HEAP32[r27>>2]=r5&-2;HEAP32[r17+4>>2]=r18|1;HEAP32[r4+r18>>2]=r18;r34=r18}}while(0);r18=r34>>>3;if(r34>>>0<256){r4=r18<<1;r5=32024+(r4<<2)|0;r27=HEAP32[31984>>2];r31=1<<r18;do{if((r27&r31|0)==0){HEAP32[31984>>2]=r27|r31;r35=r5;r36=32024+(r4+2<<2)|0}else{r18=32024+(r4+2<<2)|0;r8=HEAP32[r18>>2];if(r8>>>0>=HEAP32[32e3>>2]>>>0){r35=r8;r36=r18;break}_abort()}}while(0);HEAP32[r36>>2]=r17;HEAP32[r35+12>>2]=r17;HEAP32[r17+8>>2]=r35;HEAP32[r17+12>>2]=r5;return}r5=r17;r35=r34>>>8;do{if((r35|0)==0){r37=0}else{if(r34>>>0>16777215){r37=31;break}r36=(r35+1048320|0)>>>16&8;r4=r35<<r36;r31=(r4+520192|0)>>>16&4;r27=r4<<r31;r4=(r27+245760|0)>>>16&2;r18=14-(r31|r36|r4)+(r27<<r4>>>15)|0;r37=r34>>>((r18+7|0)>>>0)&1|r18<<1}}while(0);r35=32288+(r37<<2)|0;HEAP32[r17+28>>2]=r37;HEAP32[r17+20>>2]=0;HEAP32[r17+16>>2]=0;r18=HEAP32[31988>>2];r4=1<<r37;do{if((r18&r4|0)==0){HEAP32[31988>>2]=r18|r4;HEAP32[r35>>2]=r5;HEAP32[r17+24>>2]=r35;HEAP32[r17+12>>2]=r17;HEAP32[r17+8>>2]=r17}else{if((r37|0)==31){r38=0}else{r38=25-(r37>>>1)|0}r27=r34<<r38;r36=HEAP32[r35>>2];while(1){if((HEAP32[r36+4>>2]&-8|0)==(r34|0)){break}r39=r36+16+(r27>>>31<<2)|0;r31=HEAP32[r39>>2];if((r31|0)==0){r2=129;break}else{r27=r27<<1;r36=r31}}if(r2==129){if(r39>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r39>>2]=r5;HEAP32[r17+24>>2]=r36;HEAP32[r17+12>>2]=r17;HEAP32[r17+8>>2]=r17;break}}r27=r36+8|0;r28=HEAP32[r27>>2];r31=HEAP32[32e3>>2];if(r36>>>0<r31>>>0){_abort()}if(r28>>>0<r31>>>0){_abort()}else{HEAP32[r28+12>>2]=r5;HEAP32[r27>>2]=r5;HEAP32[r17+8>>2]=r28;HEAP32[r17+12>>2]=r36;HEAP32[r17+24>>2]=0;break}}}while(0);r17=HEAP32[32016>>2]-1|0;HEAP32[32016>>2]=r17;if((r17|0)==0){r40=32440}else{return}while(1){r17=HEAP32[r40>>2];if((r17|0)==0){break}else{r40=r17+8|0}}HEAP32[32016>>2]=-1;return}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){HEAP32[___errno_location()>>2]=12;r3=0;return r3}if(r2>>>0<11){r4=16}else{r4=r2+11&-8}r5=_try_realloc_chunk(r1-8|0,r4);if((r5|0)!=0){r3=r5+8|0;return r3}r5=_malloc(r2);if((r5|0)==0){r3=0;return r3}r4=HEAP32[r1-4>>2];r6=(r4&-8)-((r4&3|0)==0?8:4)|0;_memcpy(r5,r1,r6>>>0<r2>>>0?r6:r2)|0;_free(r1);r3=r5;return r3}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=r1+4|0;r4=HEAP32[r3>>2];r5=r4&-8;r6=r1;r7=r6+r5|0;r8=r7;r9=HEAP32[32e3>>2];if(r6>>>0<r9>>>0){_abort()}r10=r4&3;if(!((r10|0)!=1&r6>>>0<r7>>>0)){_abort()}r11=r6+(r5|4)|0;r12=HEAP32[r11>>2];if((r12&1|0)==0){_abort()}if((r10|0)==0){if(r2>>>0<256){r13=0;return r13}do{if(r5>>>0>=(r2+4|0)>>>0){if((r5-r2|0)>>>0>HEAP32[31792>>2]<<1>>>0){break}else{r13=r1}return r13}}while(0);r13=0;return r13}if(r5>>>0>=r2>>>0){r10=r5-r2|0;if(r10>>>0<=15){r13=r1;return r13}HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r10|3;HEAP32[r11>>2]=HEAP32[r11>>2]|1;_dispose_chunk(r6+r2|0,r10);r13=r1;return r13}if((r8|0)==(HEAP32[32008>>2]|0)){r10=HEAP32[31996>>2]+r5|0;if(r10>>>0<=r2>>>0){r13=0;return r13}r11=r10-r2|0;HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r11|1;HEAP32[32008>>2]=r6+r2;HEAP32[31996>>2]=r11;r13=r1;return r13}if((r8|0)==(HEAP32[32004>>2]|0)){r11=HEAP32[31992>>2]+r5|0;if(r11>>>0<r2>>>0){r13=0;return r13}r10=r11-r2|0;if(r10>>>0>15){HEAP32[r3>>2]=r4&1|r2|2;HEAP32[r6+(r2+4)>>2]=r10|1;HEAP32[r6+r11>>2]=r10;r14=r6+(r11+4)|0;HEAP32[r14>>2]=HEAP32[r14>>2]&-2;r15=r6+r2|0;r16=r10}else{HEAP32[r3>>2]=r4&1|r11|2;r4=r6+(r11+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r15=0;r16=0}HEAP32[31992>>2]=r16;HEAP32[32004>>2]=r15;r13=r1;return r13}if((r12&2|0)!=0){r13=0;return r13}r15=(r12&-8)+r5|0;if(r15>>>0<r2>>>0){r13=0;return r13}r16=r15-r2|0;r4=r12>>>3;L52:do{if(r12>>>0<256){r11=HEAP32[r6+(r5+8)>>2];r10=HEAP32[r6+(r5+12)>>2];r14=32024+(r4<<1<<2)|0;do{if((r11|0)!=(r14|0)){if(r11>>>0<r9>>>0){_abort()}if((HEAP32[r11+12>>2]|0)==(r8|0)){break}_abort()}}while(0);if((r10|0)==(r11|0)){HEAP32[31984>>2]=HEAP32[31984>>2]&~(1<<r4);break}do{if((r10|0)==(r14|0)){r17=r10+8|0}else{if(r10>>>0<r9>>>0){_abort()}r18=r10+8|0;if((HEAP32[r18>>2]|0)==(r8|0)){r17=r18;break}_abort()}}while(0);HEAP32[r11+12>>2]=r10;HEAP32[r17>>2]=r11}else{r14=r7;r18=HEAP32[r6+(r5+24)>>2];r19=HEAP32[r6+(r5+12)>>2];do{if((r19|0)==(r14|0)){r20=r6+(r5+20)|0;r21=HEAP32[r20>>2];if((r21|0)==0){r22=r6+(r5+16)|0;r23=HEAP32[r22>>2];if((r23|0)==0){r24=0;break}else{r25=r23;r26=r22}}else{r25=r21;r26=r20}while(1){r20=r25+20|0;r21=HEAP32[r20>>2];if((r21|0)!=0){r25=r21;r26=r20;continue}r20=r25+16|0;r21=HEAP32[r20>>2];if((r21|0)==0){break}else{r25=r21;r26=r20}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r24=r25;break}}else{r20=HEAP32[r6+(r5+8)>>2];if(r20>>>0<r9>>>0){_abort()}r21=r20+12|0;if((HEAP32[r21>>2]|0)!=(r14|0)){_abort()}r22=r19+8|0;if((HEAP32[r22>>2]|0)==(r14|0)){HEAP32[r21>>2]=r19;HEAP32[r22>>2]=r20;r24=r19;break}else{_abort()}}}while(0);if((r18|0)==0){break}r19=r6+(r5+28)|0;r11=32288+(HEAP32[r19>>2]<<2)|0;do{if((r14|0)==(HEAP32[r11>>2]|0)){HEAP32[r11>>2]=r24;if((r24|0)!=0){break}HEAP32[31988>>2]=HEAP32[31988>>2]&~(1<<HEAP32[r19>>2]);break L52}else{if(r18>>>0<HEAP32[32e3>>2]>>>0){_abort()}r10=r18+16|0;if((HEAP32[r10>>2]|0)==(r14|0)){HEAP32[r10>>2]=r24}else{HEAP32[r18+20>>2]=r24}if((r24|0)==0){break L52}}}while(0);if(r24>>>0<HEAP32[32e3>>2]>>>0){_abort()}HEAP32[r24+24>>2]=r18;r14=HEAP32[r6+(r5+16)>>2];do{if((r14|0)!=0){if(r14>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r24+16>>2]=r14;HEAP32[r14+24>>2]=r24;break}}}while(0);r14=HEAP32[r6+(r5+20)>>2];if((r14|0)==0){break}if(r14>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r24+20>>2]=r14;HEAP32[r14+24>>2]=r24;break}}}while(0);if(r16>>>0<16){HEAP32[r3>>2]=r15|HEAP32[r3>>2]&1|2;r24=r6+(r15|4)|0;HEAP32[r24>>2]=HEAP32[r24>>2]|1;r13=r1;return r13}else{HEAP32[r3>>2]=HEAP32[r3>>2]&1|r2|2;HEAP32[r6+(r2+4)>>2]=r16|3;r3=r6+(r15|4)|0;HEAP32[r3>>2]=HEAP32[r3>>2]|1;_dispose_chunk(r6+r2|0,r16);r13=r1;return r13}}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r3=0;r4=r1;r5=r4+r2|0;r6=r5;r7=HEAP32[r1+4>>2];L1:do{if((r7&1|0)==0){r8=HEAP32[r1>>2];if((r7&3|0)==0){return}r9=r4+ -r8|0;r10=r9;r11=r8+r2|0;r12=HEAP32[32e3>>2];if(r9>>>0<r12>>>0){_abort()}if((r10|0)==(HEAP32[32004>>2]|0)){r13=r4+(r2+4)|0;if((HEAP32[r13>>2]&3|0)!=3){r14=r10;r15=r11;break}HEAP32[31992>>2]=r11;HEAP32[r13>>2]=HEAP32[r13>>2]&-2;HEAP32[r4+(4-r8)>>2]=r11|1;HEAP32[r5>>2]=r11;return}r13=r8>>>3;if(r8>>>0<256){r16=HEAP32[r4+(8-r8)>>2];r17=HEAP32[r4+(12-r8)>>2];r18=32024+(r13<<1<<2)|0;do{if((r16|0)!=(r18|0)){if(r16>>>0<r12>>>0){_abort()}if((HEAP32[r16+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r17|0)==(r16|0)){HEAP32[31984>>2]=HEAP32[31984>>2]&~(1<<r13);r14=r10;r15=r11;break}do{if((r17|0)==(r18|0)){r19=r17+8|0}else{if(r17>>>0<r12>>>0){_abort()}r20=r17+8|0;if((HEAP32[r20>>2]|0)==(r10|0)){r19=r20;break}_abort()}}while(0);HEAP32[r16+12>>2]=r17;HEAP32[r19>>2]=r16;r14=r10;r15=r11;break}r18=r9;r13=HEAP32[r4+(24-r8)>>2];r20=HEAP32[r4+(12-r8)>>2];do{if((r20|0)==(r18|0)){r21=16-r8|0;r22=r4+(r21+4)|0;r23=HEAP32[r22>>2];if((r23|0)==0){r24=r4+r21|0;r21=HEAP32[r24>>2];if((r21|0)==0){r25=0;break}else{r26=r21;r27=r24}}else{r26=r23;r27=r22}while(1){r22=r26+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r26=r23;r27=r22;continue}r22=r26+16|0;r23=HEAP32[r22>>2];if((r23|0)==0){break}else{r26=r23;r27=r22}}if(r27>>>0<r12>>>0){_abort()}else{HEAP32[r27>>2]=0;r25=r26;break}}else{r22=HEAP32[r4+(8-r8)>>2];if(r22>>>0<r12>>>0){_abort()}r23=r22+12|0;if((HEAP32[r23>>2]|0)!=(r18|0)){_abort()}r24=r20+8|0;if((HEAP32[r24>>2]|0)==(r18|0)){HEAP32[r23>>2]=r20;HEAP32[r24>>2]=r22;r25=r20;break}else{_abort()}}}while(0);if((r13|0)==0){r14=r10;r15=r11;break}r20=r4+(28-r8)|0;r12=32288+(HEAP32[r20>>2]<<2)|0;do{if((r18|0)==(HEAP32[r12>>2]|0)){HEAP32[r12>>2]=r25;if((r25|0)!=0){break}HEAP32[31988>>2]=HEAP32[31988>>2]&~(1<<HEAP32[r20>>2]);r14=r10;r15=r11;break L1}else{if(r13>>>0<HEAP32[32e3>>2]>>>0){_abort()}r9=r13+16|0;if((HEAP32[r9>>2]|0)==(r18|0)){HEAP32[r9>>2]=r25}else{HEAP32[r13+20>>2]=r25}if((r25|0)==0){r14=r10;r15=r11;break L1}}}while(0);if(r25>>>0<HEAP32[32e3>>2]>>>0){_abort()}HEAP32[r25+24>>2]=r13;r18=16-r8|0;r20=HEAP32[r4+r18>>2];do{if((r20|0)!=0){if(r20>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r25+16>>2]=r20;HEAP32[r20+24>>2]=r25;break}}}while(0);r20=HEAP32[r4+(r18+4)>>2];if((r20|0)==0){r14=r10;r15=r11;break}if(r20>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r25+20>>2]=r20;HEAP32[r20+24>>2]=r25;r14=r10;r15=r11;break}}else{r14=r1;r15=r2}}while(0);r1=HEAP32[32e3>>2];if(r5>>>0<r1>>>0){_abort()}r25=r4+(r2+4)|0;r26=HEAP32[r25>>2];do{if((r26&2|0)==0){if((r6|0)==(HEAP32[32008>>2]|0)){r27=HEAP32[31996>>2]+r15|0;HEAP32[31996>>2]=r27;HEAP32[32008>>2]=r14;HEAP32[r14+4>>2]=r27|1;if((r14|0)!=(HEAP32[32004>>2]|0)){return}HEAP32[32004>>2]=0;HEAP32[31992>>2]=0;return}if((r6|0)==(HEAP32[32004>>2]|0)){r27=HEAP32[31992>>2]+r15|0;HEAP32[31992>>2]=r27;HEAP32[32004>>2]=r14;HEAP32[r14+4>>2]=r27|1;HEAP32[r14+r27>>2]=r27;return}r27=(r26&-8)+r15|0;r19=r26>>>3;L100:do{if(r26>>>0<256){r7=HEAP32[r4+(r2+8)>>2];r20=HEAP32[r4+(r2+12)>>2];r8=32024+(r19<<1<<2)|0;do{if((r7|0)!=(r8|0)){if(r7>>>0<r1>>>0){_abort()}if((HEAP32[r7+12>>2]|0)==(r6|0)){break}_abort()}}while(0);if((r20|0)==(r7|0)){HEAP32[31984>>2]=HEAP32[31984>>2]&~(1<<r19);break}do{if((r20|0)==(r8|0)){r28=r20+8|0}else{if(r20>>>0<r1>>>0){_abort()}r13=r20+8|0;if((HEAP32[r13>>2]|0)==(r6|0)){r28=r13;break}_abort()}}while(0);HEAP32[r7+12>>2]=r20;HEAP32[r28>>2]=r7}else{r8=r5;r13=HEAP32[r4+(r2+24)>>2];r12=HEAP32[r4+(r2+12)>>2];do{if((r12|0)==(r8|0)){r9=r4+(r2+20)|0;r16=HEAP32[r9>>2];if((r16|0)==0){r17=r4+(r2+16)|0;r22=HEAP32[r17>>2];if((r22|0)==0){r29=0;break}else{r30=r22;r31=r17}}else{r30=r16;r31=r9}while(1){r9=r30+20|0;r16=HEAP32[r9>>2];if((r16|0)!=0){r30=r16;r31=r9;continue}r9=r30+16|0;r16=HEAP32[r9>>2];if((r16|0)==0){break}else{r30=r16;r31=r9}}if(r31>>>0<r1>>>0){_abort()}else{HEAP32[r31>>2]=0;r29=r30;break}}else{r9=HEAP32[r4+(r2+8)>>2];if(r9>>>0<r1>>>0){_abort()}r16=r9+12|0;if((HEAP32[r16>>2]|0)!=(r8|0)){_abort()}r17=r12+8|0;if((HEAP32[r17>>2]|0)==(r8|0)){HEAP32[r16>>2]=r12;HEAP32[r17>>2]=r9;r29=r12;break}else{_abort()}}}while(0);if((r13|0)==0){break}r12=r4+(r2+28)|0;r7=32288+(HEAP32[r12>>2]<<2)|0;do{if((r8|0)==(HEAP32[r7>>2]|0)){HEAP32[r7>>2]=r29;if((r29|0)!=0){break}HEAP32[31988>>2]=HEAP32[31988>>2]&~(1<<HEAP32[r12>>2]);break L100}else{if(r13>>>0<HEAP32[32e3>>2]>>>0){_abort()}r20=r13+16|0;if((HEAP32[r20>>2]|0)==(r8|0)){HEAP32[r20>>2]=r29}else{HEAP32[r13+20>>2]=r29}if((r29|0)==0){break L100}}}while(0);if(r29>>>0<HEAP32[32e3>>2]>>>0){_abort()}HEAP32[r29+24>>2]=r13;r8=HEAP32[r4+(r2+16)>>2];do{if((r8|0)!=0){if(r8>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r29+16>>2]=r8;HEAP32[r8+24>>2]=r29;break}}}while(0);r8=HEAP32[r4+(r2+20)>>2];if((r8|0)==0){break}if(r8>>>0<HEAP32[32e3>>2]>>>0){_abort()}else{HEAP32[r29+20>>2]=r8;HEAP32[r8+24>>2]=r29;break}}}while(0);HEAP32[r14+4>>2]=r27|1;HEAP32[r14+r27>>2]=r27;if((r14|0)!=(HEAP32[32004>>2]|0)){r32=r27;break}HEAP32[31992>>2]=r27;return}else{HEAP32[r25>>2]=r26&-2;HEAP32[r14+4>>2]=r15|1;HEAP32[r14+r15>>2]=r15;r32=r15}}while(0);r15=r32>>>3;if(r32>>>0<256){r26=r15<<1;r25=32024+(r26<<2)|0;r29=HEAP32[31984>>2];r2=1<<r15;do{if((r29&r2|0)==0){HEAP32[31984>>2]=r29|r2;r33=r25;r34=32024+(r26+2<<2)|0}else{r15=32024+(r26+2<<2)|0;r4=HEAP32[r15>>2];if(r4>>>0>=HEAP32[32e3>>2]>>>0){r33=r4;r34=r15;break}_abort()}}while(0);HEAP32[r34>>2]=r14;HEAP32[r33+12>>2]=r14;HEAP32[r14+8>>2]=r33;HEAP32[r14+12>>2]=r25;return}r25=r14;r33=r32>>>8;do{if((r33|0)==0){r35=0}else{if(r32>>>0>16777215){r35=31;break}r34=(r33+1048320|0)>>>16&8;r26=r33<<r34;r2=(r26+520192|0)>>>16&4;r29=r26<<r2;r26=(r29+245760|0)>>>16&2;r15=14-(r2|r34|r26)+(r29<<r26>>>15)|0;r35=r32>>>((r15+7|0)>>>0)&1|r15<<1}}while(0);r33=32288+(r35<<2)|0;HEAP32[r14+28>>2]=r35;HEAP32[r14+20>>2]=0;HEAP32[r14+16>>2]=0;r15=HEAP32[31988>>2];r26=1<<r35;if((r15&r26|0)==0){HEAP32[31988>>2]=r15|r26;HEAP32[r33>>2]=r25;HEAP32[r14+24>>2]=r33;HEAP32[r14+12>>2]=r14;HEAP32[r14+8>>2]=r14;return}if((r35|0)==31){r36=0}else{r36=25-(r35>>>1)|0}r35=r32<<r36;r36=HEAP32[r33>>2];while(1){if((HEAP32[r36+4>>2]&-8|0)==(r32|0)){break}r37=r36+16+(r35>>>31<<2)|0;r33=HEAP32[r37>>2];if((r33|0)==0){r3=126;break}else{r35=r35<<1;r36=r33}}if(r3==126){if(r37>>>0<HEAP32[32e3>>2]>>>0){_abort()}HEAP32[r37>>2]=r25;HEAP32[r14+24>>2]=r36;HEAP32[r14+12>>2]=r14;HEAP32[r14+8>>2]=r14;return}r37=r36+8|0;r3=HEAP32[r37>>2];r35=HEAP32[32e3>>2];if(r36>>>0<r35>>>0){_abort()}if(r3>>>0<r35>>>0){_abort()}HEAP32[r3+12>>2]=r25;HEAP32[r37>>2]=r25;HEAP32[r14+8>>2]=r3;HEAP32[r14+12>>2]=r36;HEAP32[r14+24>>2]=0;return}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4+(r5>>>0<r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;r6=r2-r4-(r3>>>0>r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math_imul(r4,r3)|0;r6=r1>>>16;r7=(r5>>>16)+Math_imul(r4,r6)|0;r8=r2>>>16;r9=Math_imul(r8,r3)|0;return(tempRet0=(r7>>>16)+Math_imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,r7+r9<<16|r5&65535|0)|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6)|0;r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8)|0;r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13)|0;return(tempRet0=tempRet0,r15)|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7)|0;r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9)|0;___udivmoddi4(r10,r11,r12,tempRet0,r5)|0;r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7)|0;r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math_imul(r2,r6)|0;return(tempRet0=Math_imul(r4,r5)+r9+r8|r8&0,r7&-1|0)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return(tempRet0=tempRet0,r5)|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5)|0;STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)==0){if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}else{if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=r1&-1|0;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=r8>>>(r20>>>0)|0;r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=r3&-1|0;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1)|0;r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=r44<<1|r47>>>31|0;r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51)|0;r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39)|0;r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=r61;HEAP32[r5+4>>2]=r62}r69=(r65|0)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}




// EMSCRIPTEN_END_FUNCS
Module["_rc759_get_sim"] = _rc759_get_sim;
Module["_main"] = _main;
Module["_rc759_set_msg"] = _rc759_set_msg;
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





