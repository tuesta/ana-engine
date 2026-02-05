import { InputEntry, AnaNode, Hint, isBaseTypeWrapper, PrimitiveTypeKey, Constraint, isIntString, StepRaw, Step } from './types.js';

export class Walker {
  private programRef: AnaNode;
  private pointer: AnaNode;
  private inputEntryCPs: (_ : InputEntry) => InputEntry | null;
  private inputEntry: InputEntry | null;
  private attribute: string[];

  private constructor(pointer: AnaNode) {
    this.programRef = pointer;
    this.pointer = pointer;
    this.inputEntry = null;
    this.inputEntryCPs = x => x;
    this.attribute = [];
  }

  private setState(pointer: AnaNode) {
    this.programRef = pointer;
    this.pointer = pointer;
    this.inputEntry = null;
    this.inputEntryCPs = x => x;
    this.attribute = [];
  }

  public static start(node: AnaNode): { walker: Walker, hint: Hint } {
    const walker = new Walker(node);

    return {
      walker,
      hint: walker.hint()
    };
  }

  private hint(): Hint {
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

  private isInputEntry(): InputEntry | null {
    if (this.inputEntry === null || this.attribute.length !== 0) return null;

    const result = this.inputEntry
    this.setState(this.programRef)

    return result;
  }

  public step(input: any): Step {
    const result = this.go(input)
    this.innerRecord()

    switch (result.type) {
      case "InputErr":
        return { type: "InputErr", value: result.value };
      case "inputAccepted":
        const inputEntry = this.isInputEntry()
        if (inputEntry) {
          return { type: "InputEntry", value: { inputEntry, nextHint: this.hint() } }
        }
        return { type: "inputAccepted", value: { input: result.value, nextHint: this.hint() } };
    }
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

  private go(input: string): StepRaw {
    switch (this.pointer.tag) {
      case "Tag": {
        if (input !== this.pointer.name) {
          return { type: "InputErr", value: { expected: `"${this.pointer.name}"`, actual: input } }
        }

        const fatherCPs = this.inputEntryCPs
        this.inputEntryCPs = x => fatherCPs({ tag: "tag", identifier: input, value: x })
        this.pointer = this.pointer.value;
        return { type: "inputAccepted", value: input }
      }
      case "Sum": {
        const variants = Object.keys(this.pointer.variants)
        if (!variants.includes(input)) {
          return { type: "InputErr", value: { expected: `"${variants.join(" | ")}"`, actual: input } }
        }

        const fatherCPs = this.inputEntryCPs
        this.inputEntryCPs = x => fatherCPs({ tag: "tag", identifier: input, value: x })
        this.pointer = this.pointer.variants[input];
        return { type: "inputAccepted", value: input };
      }
      case "Record": {
        // Match BaseType -> "Int" | "String" Constraint
        if (isBaseTypeWrapper(this.pointer.fields)) {
          // TODO constraints
          const [[primitiveType, _constraints]] = Object.entries(this.pointer.fields) as [PrimitiveTypeKey, Constraint][]

          switch (primitiveType) {
            case "Int":
              if (isIntString(input)) {
                this.inputEntry = this.inputEntryCPs({ tag: "primitive", value: Number(input) })
                return { type: "inputAccepted", value: input }
              } else {
                return { type: "InputErr", value: { expected: "Int", actual: input } }
              }
            case "String":
              this.inputEntry = this.inputEntryCPs({ tag: "primitive", value: input })
              return { type: "inputAccepted", value: input }
          }
        } else {
          this.innerRecord();
          return this.go(input);
        }
      }

    }
  }
}
