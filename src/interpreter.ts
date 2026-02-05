import { InputEntry, AnaNode, Result, InputErr, Hint, isBaseTypeWrapper, PrimitiveTypeKey, Constraint, isIntString, Either } from './types.js';

export class Walker {
  private programRef: AnaNode;
  private pointer: AnaNode;
  private inputEntryCPs: (_ : InputEntry) => InputEntry | null;
  private inputEntry: InputEntry | null;
  private attribute: string[];

  constructor(pointer: AnaNode) {
    this.programRef = pointer;
    this.pointer = pointer;
    this.inputEntry = null;
    this.inputEntryCPs = x => x;
    this.attribute = [];
  }

  public hint(): Hint {
    switch (this.pointer.tag) {
        case "Sum":
            return { type: "Sum", hint: Object.keys(this.pointer.variants) };
        case "Tag":
            return { type: "Tag", hint: `${this.pointer.name}` };
        case "Record":
          if (isBaseTypeWrapper(this.pointer.fields)) {
            return { type: "Primitive", hint: this.pointer.fields}
          }
          return { type: "Attribute", hint: this.attribute.join(", ") };
    }
  }

  public step(input: any): Either<InputEntry, Result<InputErr, string>> {
    console.log(this.inputEntry)
    if (this.inputEntry !== null) {
      const result = this.inputEntry
      this.inputEntry = null
      this.pointer = this.programRef
      return { type: "Left", value: result }
    }

    const result = this.go(input)
    this.innerRecord()

    return { type: "Right", value: result };
  }

  private innerRecord() {
    if (!(this.pointer.tag === "Record" && !isBaseTypeWrapper(this.pointer.fields))) return;

    const fields = Object.entries(this.pointer.fields)
    const record : Record<string, InputEntry> = {}

    if (fields.length === 0) {
      this.inputEntryCPs = _x => ({ tag: "record", value: record })
      return { type: "Ok", value: "{}" };
    }

    let fieldIndex = 0;
    const fatherCPs = this.inputEntryCPs;

    this.pointer = fields[0][1]
    this.attribute.push(fields[0][0])

    const recordContinuation = (x: InputEntry): InputEntry | null => {
      const fieldKey = fields[fieldIndex][0]
      record[fieldKey] = x
      this.attribute.pop()
      fieldIndex++

      if (fieldIndex < fields.length) {
        this.pointer = fields[fieldIndex][1]
        this.attribute.push(fields[fieldIndex][0])
        this.inputEntryCPs = recordContinuation;
        return null;
      } else {
        this.inputEntry = { tag: "record", value: record };
        this.attribute.pop()
        return fatherCPs(this.inputEntry);
      }
    }

    this.inputEntryCPs = recordContinuation
    this.innerRecord()
  }

  private go(input: string): Result<InputErr, string> {
    switch (this.pointer.tag) {
      case "Tag": {
        if (input !== this.pointer.name) {
          return { type: "Err", value: { expected: `"${this.pointer.name}"`, actual: input } }
        }

        const fatherCPs = this.inputEntryCPs
        this.inputEntryCPs = x => fatherCPs({ tag: "tag", identifier: input, value: x })
        this.pointer = this.pointer.value;
        return { type: "Ok", value: input };
      }
      case "Sum": {
        const variants = Object.keys(this.pointer.variants)
        if (!variants.includes(input)) {
          return { type: "Err", value: { expected: `"${variants.join(" | ")}"`, actual: input } }
        }

        const fatherCPs = this.inputEntryCPs
        this.inputEntryCPs = x => fatherCPs({ tag: "tag", identifier: input, value: x })
        this.pointer = this.pointer.variants[input];
        return { type: "Ok", value: input };
      }
      case "Record": {
        // Match BaseType -> "Int" | "String" Constraint
        if (isBaseTypeWrapper(this.pointer.fields)) {
          console.log("hola")
          // TODO constraints
          const [[primitiveType, _constraints]] = Object.entries(this.pointer.fields) as [PrimitiveTypeKey, Constraint][]

          switch (primitiveType) {
            case "Int":
              if (isIntString(input)) {
                this.inputEntry = this.inputEntryCPs({ tag: "primitive", value: Number(input) })
                return { type: "Ok", value: input }
              } else {
                return { type: "Err", value: { expected: "Int", actual: input } }
              }
            case "String":
              this.inputEntry = this.inputEntryCPs({ tag: "primitive", value: input })
              console.log(this.inputEntry)
              return { type: "Ok", value: input }
          }
        } else {
          this.innerRecord();
          return this.go(input);
        }
      }

    }
  }
}
