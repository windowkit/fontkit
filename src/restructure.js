// restructure, with the structs fontkit decodes made without
// Object.defineProperties.
//
// restructure gives every struct it decodes four hidden fields (parent,
// _startOffset, _currentOffset, _length) with one Object.defineProperties
// call, which is a runtime call, and fontkit decodes thousands of structs in
// a face's first shaping and a glyph's first outline. The structs made here
// keep the four in private fields of a class and read them through accessors
// on its prototype, which takes a fifth to two fifths off a face's first
// shaping, more for a face with more lookups (sidorares/ntk#437).
//
// They are only fast where the private fields are native: package.json's
// targets are Chrome 91 rather than 70 for that, since below it the build
// compiles them to WeakMaps.
//
// Everything that reads them reads the same: they stay out of Object.keys,
// for...in, JSON.stringify and Object.assign, `struct.parent` reads, and a
// write to it throws in strict code. What differs is that they are no longer
// own properties (hasOwnProperty, getOwnPropertyNames), and that a decoded
// struct's prototype is DecodedStruct's rather than Object.prototype.
//
// This is a module of its own rather than a change to restructure's
// prototype because restructure is shared by everything in the process that
// uses it: only the structs fontkit declares are made this way. Files that
// declare structs import restructure from here, which test/restructure.js
// checks.
import * as r from 'restructure';

// By name, not `export * from 'restructure'`: the parcel this builds with
// drops a star re-export of an external package from a module it wraps, and
// it wraps this one. test/restructure.js checks the list is all of them.
export {
  Array, Bitfield, Boolean, Buffer, DecodeStream, EncodeStream, Enum, Fixed,
  LazyArray, Number, Optional, Pointer, PropertyDescriptor, Reserved, String,
  VoidPointer, double, doublebe, doublele, fixed16, fixed16be, fixed16le,
  fixed32, fixed32be, fixed32le, float, floatbe, floatle, int16, int16be,
  int16le, int24, int24be, int24le, int32, int32be, int32le, int8,
  resolveLength, uint16, uint16be, uint16le, uint24, uint24be, uint24le,
  uint32, uint32be, uint32le, uint8
} from 'restructure';

export class DecodedStruct {
  #parent;
  #startOffset;
  #currentOffset;
  #length;

  constructor(parent, startOffset, length) {
    this.#parent = parent;
    this.#startOffset = startOffset;
    this.#currentOffset = 0;
    this.#length = length;
  }

  // An object made with Object.create(DecodedStruct.prototype) has none of
  // the fields, which is what a deep copy by the clone package is (subsets
  // copy maxp, head and hhea that way). It reads them as undefined, as a
  // copy of one of restructure's own structs does.

  get parent() {
    return #parent in this ? this.#parent : undefined;
  }

  get _startOffset() {
    return #startOffset in this ? this.#startOffset : undefined;
  }

  get _currentOffset() {
    return #currentOffset in this ? this.#currentOffset : undefined;
  }

  set _currentOffset(value) {
    this.#currentOffset = value;
  }

  get _length() {
    return #length in this ? this.#length : undefined;
  }
}

export class Struct extends r.Struct {
  _setup(stream, parent, length) {
    return new DecodedStruct(parent, stream.pos, length);
  }
}

export class VersionedStruct extends r.VersionedStruct {
  _setup(stream, parent, length) {
    return new DecodedStruct(parent, stream.pos, length);
  }
}
