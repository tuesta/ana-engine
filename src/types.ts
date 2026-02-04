export type Identifier = string;

export type Constraint
  = { tag: "All" }
  | { tag: "OneOf"; contents: PrimitiveType[] };

/**
 * BuiltInType Constraint
 * {"Int": {...}, "String": {...}}
 */
export type BaseTypeWrapper = Record<PrimitiveTypeKey, Constraint>

export type AnaNode
  = { tag: "Tag"; name: string; value: AnaNode }
  | { tag: "Record"; fields: Record<string, AnaNode> | BaseTypeWrapper }
  | { tag: "Sum"; variants: Record<string, AnaNode> }

export type Graph = Record<Identifier, AnaNode>;

export type PrimitiveType    = number | string
export type PrimitiveTypeKey = "Int"  | "String"

export type InputEntry
  = { tag: "primitive"; value: PrimitiveType }
  | { tag: "tag"; identifier: string; value: InputEntry }
  | { tag: "record"; value: Record<string, InputEntry> }
