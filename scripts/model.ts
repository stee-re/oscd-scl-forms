export type PrimitiveType = 'string' | 'number' | 'boolean' | 'date' | 'enum';

export type Occurs = { min: number; max: number | 'unbounded' };

export type AttributeModel = {
  name: string;
  type: PrimitiveType | string;
  use?: 'required' | 'optional' | 'prohibited';
  defaultValue?: string;
  fixedValue?: string;
  documentation?: string;
};

export type ElementModel = {
  name: string;
  documentation?: string;
  attributes: AttributeModel[];
  children: string[];
  occurs?: Record<string, Occurs>;
};

export type SchemaModel = {
  version: string;
  elements: ElementModel[];
};

export type OverrideControl =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'custom';

export type OverrideField = {
  label?: string;
  help?: string;
  order?: number;
  control?: OverrideControl;
  readonly?: boolean;
  hidden?: boolean;
  enumValues?: string[];
  sampleValue?: unknown;
};

export type OverrideElement = {
  label?: string;
  help?: string;
  order?: number;
  fields?: Record<string, OverrideField>;
  sample?: Record<string, unknown>;
};

export type OverrideConfig = {
  global?: OverrideElement;
  versions?: Record<string, Record<string, OverrideElement>>;
};
