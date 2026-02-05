export type Identifier = string;

export type PrimitiveType    = number | string
export type PrimitiveTypeKey = "Int"  | "String"
const primitiveValueKey: PrimitiveTypeKey[] = ["Int", "String"]

export const isIntString= (value: any): value is number => {
  const num = Number(value);

  return typeof value === 'string' &&
         value.trim() !== "" &&
         Number.isInteger(num)
}

export type Constraint
  = { tag: "All" }
  | { tag: "OneOf"; contents: PrimitiveType[] };
export const isConstraint = (value: any): value is Constraint => {
  if (typeof value !== 'object' || value === null) return false;

  const { tag, contents } = value;

  if (tag === "All") return true;

  if (tag === "OneOf") {
    return Array.isArray(contents) &&
           contents.every(item => typeof item === 'string' || typeof item === 'number');
  }

  return false;
};

/**
 * BuiltInType Constraint
 * { "Int": C } | { "String": C }
 */
export type BaseTypeWrapper = {
  [K in PrimitiveTypeKey]: Record<K, Constraint>;
}[PrimitiveTypeKey];

export const isBaseTypeWrapper = (input: Record<string, any>): input is BaseTypeWrapper => {
  if (typeof input !== 'object' || input === null) return false;

  const keys = Object.keys(input);

  if (keys.length !== 1) return false;

  const key = keys[0] as PrimitiveTypeKey;

  if (!primitiveValueKey.includes(key)) return false;

  return isConstraint(input[key]);
};

export type AnaNode
  = { tag: "Tag"; name: string; value: AnaNode }
  | { tag: "Record"; fields: Record<string, AnaNode> | BaseTypeWrapper }
  | { tag: "Sum"; variants: Record<string, AnaNode> }

export type Graph = Record<Identifier, AnaNode>;

export type InputEntry
  = { tag: "primitive"; value: PrimitiveType }
  | { tag: "tag"; identifier: string; value: InputEntry }
  | { tag: "record"; value: Record<string, InputEntry> }

export type Hint
 = { type: "Sum"; hint: string[] }
 | { type: "Tag"; hint: string }
 | { type: "Attribute"; hint: string }
 | { type: "Primitive"; hint: BaseTypeWrapper }

export type InputErr = { expected: string, actual: string }

export type Step
 = { type: "InputEntry"; value: { inputEntry: InputEntry; nextHint: Hint } }
 | { type: "InputErr"; value: InputErr }
 | { type: "inputAccepted"; value: { input: string; nextHint: Hint } }

export type StepRaw
 = { type: "InputErr"; value: InputErr }
 | { type: "inputAccepted"; value: string; }
