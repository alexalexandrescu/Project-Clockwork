import type { Entity, Component } from '../types/index.ts';

/**
 * Entity type definition schema
 */
export interface EntityTypeDefinition {
  type: string;
  description?: string;
  requiredComponents: string[];
  optionalComponents?: string[];
  componentSchemas?: Record<string, ComponentSchema>;
}

/**
 * Component schema for validation
 */
export interface ComponentSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, PropertySchema>;
  items?: PropertySchema;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
}

/**
 * Property schema for component fields
 */
export interface PropertySchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'any';
  required?: boolean;
  properties?: Record<string, PropertySchema>;
  items?: PropertySchema;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
  description?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  path: string;
  message: string;
  expected?: any;
  actual?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Entity type validation system
 * Loads and validates entity type definitions
 */
export class TypeRegistry {
  private types: Map<string, EntityTypeDefinition> = new Map();

  /**
   * Register a new entity type definition
   */
  register(typeDef: EntityTypeDefinition): void {
    if (!typeDef.type) {
      throw new Error('Type definition must have a "type" field');
    }

    if (!typeDef.requiredComponents || !Array.isArray(typeDef.requiredComponents)) {
      throw new Error(`Type "${typeDef.type}" must have a "requiredComponents" array`);
    }

    this.types.set(typeDef.type, typeDef);
  }

  /**
   * Register multiple type definitions from JSON
   */
  registerFromJSON(json: string | EntityTypeDefinition[]): void {
    const definitions = typeof json === 'string' ? JSON.parse(json) : json;

    if (!Array.isArray(definitions)) {
      throw new Error('Type definitions must be an array');
    }

    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Validate an entity against its type definition
   */
  validate(entity: Entity): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if entity has required fields
    if (!entity.id) {
      errors.push({
        path: 'id',
        message: 'Entity must have an id',
      });
    }

    if (!entity.type) {
      errors.push({
        path: 'type',
        message: 'Entity must have a type',
      });
    }

    if (!entity.components) {
      errors.push({
        path: 'components',
        message: 'Entity must have a components object',
      });
      return { valid: false, errors };
    }

    // Check if type is registered
    const typeDef = this.types.get(entity.type);
    if (!typeDef) {
      errors.push({
        path: 'type',
        message: `Entity type "${entity.type}" is not registered`,
      });
      return { valid: false, errors };
    }

    // Validate required components
    for (const requiredComponent of typeDef.requiredComponents) {
      if (!(requiredComponent in entity.components)) {
        errors.push({
          path: `components.${requiredComponent}`,
          message: `Required component "${requiredComponent}" is missing`,
        });
      }
    }

    // Validate component schemas if defined
    if (typeDef.componentSchemas) {
      for (const [componentName, schema] of Object.entries(typeDef.componentSchemas)) {
        const component = entity.components[componentName];

        // Skip if component is optional and not present
        if (!component && !typeDef.requiredComponents.includes(componentName)) {
          continue;
        }

        // Validate component against schema
        if (component) {
          const componentErrors = this.validateComponent(
            component,
            schema,
            `components.${componentName}`
          );
          errors.push(...componentErrors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get required components for a type
   */
  getRequiredComponents(type: string): string[] {
    const typeDef = this.types.get(type);
    if (!typeDef) {
      throw new Error(`Type "${type}" is not registered`);
    }
    return [...typeDef.requiredComponents];
  }

  /**
   * Get optional components for a type
   */
  getOptionalComponents(type: string): string[] {
    const typeDef = this.types.get(type);
    if (!typeDef) {
      throw new Error(`Type "${type}" is not registered`);
    }
    return typeDef.optionalComponents ? [...typeDef.optionalComponents] : [];
  }

  /**
   * Get all registered types
   */
  getTypes(): string[] {
    return Array.from(this.types.keys());
  }

  /**
   * Check if a type is registered
   */
  hasType(type: string): boolean {
    return this.types.has(type);
  }

  /**
   * Get type definition
   */
  getTypeDefinition(type: string): EntityTypeDefinition | undefined {
    return this.types.get(type);
  }

  /**
   * Remove a type definition
   */
  unregister(type: string): boolean {
    return this.types.delete(type);
  }

  /**
   * Clear all type definitions
   */
  clear(): void {
    this.types.clear();
  }

  /**
   * Get validation errors as formatted string
   */
  formatErrors(result: ValidationResult): string {
    if (result.valid) {
      return 'Entity is valid';
    }

    const lines = ['Entity validation failed:'];
    for (const error of result.errors) {
      lines.push(`  - ${error.path}: ${error.message}`);
      if (error.expected !== undefined) {
        lines.push(`    Expected: ${JSON.stringify(error.expected)}`);
      }
      if (error.actual !== undefined) {
        lines.push(`    Actual: ${JSON.stringify(error.actual)}`);
      }
    }
    return lines.join('\n');
  }

  // Private validation methods

  private validateComponent(
    component: Component,
    schema: ComponentSchema,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type check
    const actualType = Array.isArray(component) ? 'array' : typeof component;
    if (schema.type !== actualType && schema.type !== 'any') {
      errors.push({
        path,
        message: `Expected type "${schema.type}" but got "${actualType}"`,
        expected: schema.type,
        actual: actualType,
      });
      return errors;
    }

    // Validate based on type
    switch (schema.type) {
      case 'object':
        errors.push(...this.validateObject(component, schema, path));
        break;
      case 'array':
        errors.push(...this.validateArray(component as any[], schema, path));
        break;
      case 'string':
        errors.push(...this.validateString(component as string, schema, path));
        break;
      case 'number':
        errors.push(...this.validateNumber(component as number, schema, path));
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(component)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        expected: schema.enum,
        actual: component,
      });
    }

    return errors;
  }

  private validateObject(
    obj: Record<string, any>,
    schema: ComponentSchema,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in obj)) {
          errors.push({
            path: `${path}.${requiredProp}`,
            message: `Required property "${requiredProp}" is missing`,
          });
        }
      }
    }

    // Validate properties if schema defined
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const value = obj[propName];

        // Skip if optional and not present
        if (value === undefined && !propSchema.required) {
          continue;
        }

        if (value !== undefined) {
          errors.push(...this.validateProperty(value, propSchema, `${path}.${propName}`));
        }
      }
    }

    return errors;
  }

  private validateArray(
    arr: any[],
    schema: ComponentSchema,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Length validation
    if (schema.minLength !== undefined && arr.length < schema.minLength) {
      errors.push({
        path,
        message: `Array must have at least ${schema.minLength} items`,
        expected: `>= ${schema.minLength}`,
        actual: arr.length,
      });
    }

    if (schema.maxLength !== undefined && arr.length > schema.maxLength) {
      errors.push({
        path,
        message: `Array must have at most ${schema.maxLength} items`,
        expected: `<= ${schema.maxLength}`,
        actual: arr.length,
      });
    }

    // Validate items if schema defined
    if (schema.items) {
      for (let i = 0; i < arr.length; i++) {
        errors.push(...this.validateProperty(arr[i], schema.items, `${path}[${i}]`));
      }
    }

    return errors;
  }

  private validateString(
    str: string,
    schema: ComponentSchema,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.minLength !== undefined && str.length < schema.minLength) {
      errors.push({
        path,
        message: `String must be at least ${schema.minLength} characters`,
        expected: `>= ${schema.minLength}`,
        actual: str.length,
      });
    }

    if (schema.maxLength !== undefined && str.length > schema.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${schema.maxLength} characters`,
        expected: `<= ${schema.maxLength}`,
        actual: str.length,
      });
    }

    return errors;
  }

  private validateNumber(
    num: number,
    schema: ComponentSchema,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.min !== undefined && num < schema.min) {
      errors.push({
        path,
        message: `Number must be at least ${schema.min}`,
        expected: `>= ${schema.min}`,
        actual: num,
      });
    }

    if (schema.max !== undefined && num > schema.max) {
      errors.push({
        path,
        message: `Number must be at most ${schema.max}`,
        expected: `<= ${schema.max}`,
        actual: num,
      });
    }

    return errors;
  }

  private validateProperty(
    value: any,
    schema: PropertySchema,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type check
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (schema.type !== actualType && schema.type !== 'any') {
      errors.push({
        path,
        message: `Expected type "${schema.type}" but got "${actualType}"`,
        expected: schema.type,
        actual: actualType,
      });
      return errors;
    }

    // Validate based on type
    switch (schema.type) {
      case 'object':
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const nestedValue = value[propName];
            if (nestedValue !== undefined) {
              errors.push(...this.validateProperty(nestedValue, propSchema, `${path}.${propName}`));
            } else if (propSchema.required) {
              errors.push({
                path: `${path}.${propName}`,
                message: `Required property "${propName}" is missing`,
              });
            }
          }
        }
        break;
      case 'array':
        if (schema.items && Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            errors.push(...this.validateProperty(value[i], schema.items, `${path}[${i}]`));
          }
        }
        break;
      case 'string':
        if (typeof value === 'string') {
          if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
              path,
              message: `String must be at least ${schema.minLength} characters`,
              expected: `>= ${schema.minLength}`,
              actual: value.length,
            });
          }
          if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
              path,
              message: `String must be at most ${schema.maxLength} characters`,
              expected: `<= ${schema.maxLength}`,
              actual: value.length,
            });
          }
        }
        break;
      case 'number':
        if (typeof value === 'number') {
          if (schema.min !== undefined && value < schema.min) {
            errors.push({
              path,
              message: `Number must be at least ${schema.min}`,
              expected: `>= ${schema.min}`,
              actual: value,
            });
          }
          if (schema.max !== undefined && value > schema.max) {
            errors.push({
              path,
              message: `Number must be at most ${schema.max}`,
              expected: `<= ${schema.max}`,
              actual: value,
            });
          }
        }
        break;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        expected: schema.enum,
        actual: value,
      });
    }

    return errors;
  }
}
