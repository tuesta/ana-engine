import { InputEntry, AnaNode } from './types.js';

function isIntString(value: any): boolean {
  const num = Number(value);

  return typeof value === 'string' &&
         value.trim() !== "" &&
         Number.isInteger(num)
}

function isConstraint(p: any): boolean {
  return p && typeof p === 'object' && (p.tag === "All" || p.tag === "OneOf");
}

export class Walker {
  private pointer: AnaNode;
  private inputEntryCPs: (_ : InputEntry) => InputEntry | null;
  private inputEntry: InputEntry | null;

  constructor(pointer: AnaNode) {
    this.pointer = pointer;
    this.inputEntry = null;
    this.inputEntryCPs = x => x;
  }

  public step(input: any): string | null {
    if (this.inputEntry === null) {
      const result = this.go(input)
      return result;
    } else {
      return "done"
    }
  }

  private go(input: any): string | null {
    // Match BaseType -> "Int" | "String" Constraint
    this.pointer
    if (this.pointer.tag === 'Record' && Object.keys(this.pointer.fields).length === 1 && isConstraint(Object.entries(this.pointer.fields)[0][1])) {
      const field = Object.entries(this.pointer.fields)[0];
      // TODO
      // const constraint: Constraint = (field[1] as any) as Constraint

      switch (field[0]) {
        case 'Int':
          console.log("case Int")
          if (isIntString(input)) {
            this.inputEntry = this.inputEntryCPs({ tag: "primitive", value: Number(input) })
            return null;
          } else {
            return "tiene que ser un int"
          }
        case 'String':
          console.log("case String")
          if (typeof input === "string") {
            this.inputEntry = this.inputEntryCPs({ tag: "primitive", value: input })
            return null;
          } else {
            return "tiene que ser un string"
          }
        default:
          console.log("case BuiltIn generic")
          return "TODO: " + field[0]
      }
    }

    switch (this.pointer.tag) {
      case "Tag": {
        console.log("case Tag")
        if (input !== this.pointer.name) return `Error: El único tag valido "${this.pointer.name}"`;
        const fatherCPs = this.inputEntryCPs
        this.inputEntryCPs = x => fatherCPs({ tag: "tag", identifier: input, value: x })
        this.pointer = this.pointer.value;
        return null;
      }
      case "Sum": {
        const variants = Object.keys(this.pointer.variants)
        if (!variants.includes(input)) return `Error tag invalido: tags validos "${variants.join(", ")}"`;
        const fatherCPs = this.inputEntryCPs
        this.inputEntryCPs = x => fatherCPs({ tag: "tag", identifier: input, value: x })
        this.pointer = this.pointer.variants[input];
        return null;
      }
      case "Record": {
        console.log("case Record")
        const fields = Object.entries(this.pointer.fields)
        const record : Record<string, InputEntry> = {}

        if (fields.length === 0) {
          this.inputEntryCPs = _x => ({ tag: "record", value: record })
          return null;
        }

        let fieldIndex = 0;
        const fatherCPs = this.inputEntryCPs;

        this.pointer = fields[0][1]

        const recordContinuation = (x: InputEntry): InputEntry | null => {
          const fieldKey = fields[fieldIndex][0]
          record[fieldKey] = x
          fieldIndex++

          if (fieldIndex < fields.length) {
            this.pointer = fields[fieldIndex][1]
            this.inputEntryCPs = recordContinuation;
            return null;
          } else {
            this.inputEntry = { tag: "record", value: record };
            return fatherCPs(this.inputEntry);
          }
        }

        this.inputEntryCPs = recordContinuation

        return this.go(input)
      }
    }

    return "TODO"
  }
}
