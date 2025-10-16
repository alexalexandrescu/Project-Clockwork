import type { Entity, Component } from '../types/index.ts';
import { TypeRegistry } from './TypeRegistry.ts';

/**
 * Entity template definition
 */
export interface EntityTemplate {
  id: string;
  type: string;
  description?: string;
  extends?: string; // ID of parent template for inheritance
  components: Record<string, Component>;
}

/**
 * Entity creation options
 */
export interface CreateOptions {
  id?: string;
  overrides?: Partial<Entity>;
}

/**
 * Entity factory for creating entities from templates
 * Supports template inheritance and component composition
 */
export class EntityFactory {
  private templates: Map<string, EntityTemplate> = new Map();
  private typeRegistry?: TypeRegistry;
  private idCounter = 0;

  constructor(typeRegistry?: TypeRegistry) {
    this.typeRegistry = typeRegistry;
  }

  /**
   * Register a template
   */
  registerTemplate(template: EntityTemplate): void {
    if (!template.id) {
      throw new Error('Template must have an id');
    }

    if (!template.type) {
      throw new Error(`Template "${template.id}" must have a type`);
    }

    // Validate that parent template exists if extending
    if (template.extends && !this.templates.has(template.extends)) {
      throw new Error(
        `Template "${template.id}" extends "${template.extends}" which does not exist`
      );
    }

    this.templates.set(template.id, template);
  }

  /**
   * Register multiple templates from JSON
   */
  registerFromJSON(json: string | EntityTemplate[]): void {
    const templates = typeof json === 'string' ? JSON.parse(json) : json;

    if (!Array.isArray(templates)) {
      throw new Error('Templates must be an array');
    }

    // First pass: register templates without inheritance
    const withInheritance: EntityTemplate[] = [];
    for (const template of templates) {
      if (template.extends) {
        withInheritance.push(template);
      } else {
        this.registerTemplate(template);
      }
    }

    // Second pass: register templates with inheritance
    // Keep trying until all are registered or we can't make progress
    let previousCount = withInheritance.length;
    while (withInheritance.length > 0) {
      const template = withInheritance.shift()!;

      if (this.templates.has(template.extends!)) {
        this.registerTemplate(template);
      } else {
        // Parent not found yet, push to back of queue
        withInheritance.push(template);
      }

      // Check if we're stuck
      if (withInheritance.length === previousCount) {
        const missingParents = withInheritance
          .map(t => `"${t.id}" extends "${t.extends}"`)
          .join(', ');
        throw new Error(
          `Circular dependency or missing parent templates detected: ${missingParents}`
        );
      }
      previousCount = withInheritance.length;
    }
  }

  /**
   * Create entity from template
   */
  createFromTemplate(templateId: string, overrides?: Partial<Entity>): Entity {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    // Resolve template with inheritance
    const resolvedTemplate = this.resolveTemplate(template);

    // Create base entity
    const entity: Entity = {
      id: overrides?.id || this.generateId(),
      type: overrides?.type || resolvedTemplate.type,
      components: this.deepClone(resolvedTemplate.components),
    };

    // Apply overrides
    if (overrides) {
      if (overrides.components) {
        entity.components = this.mergeComponents(
          entity.components,
          overrides.components
        );
      }
    }

    // Validate if type registry is available
    if (this.typeRegistry) {
      const result = this.typeRegistry.validate(entity);
      if (!result.valid) {
        throw new Error(
          `Entity validation failed:\n${this.typeRegistry.formatErrors(result)}`
        );
      }
    }

    return entity;
  }

  /**
   * Create entity from type with components
   */
  createFromType(type: string, components: Record<string, Component>): Entity {
    // Validate type if registry is available
    if (this.typeRegistry && !this.typeRegistry.hasType(type)) {
      throw new Error(`Entity type "${type}" is not registered`);
    }

    const entity: Entity = {
      id: this.generateId(),
      type,
      components: this.deepClone(components),
    };

    // Validate if type registry is available
    if (this.typeRegistry) {
      const result = this.typeRegistry.validate(entity);
      if (!result.valid) {
        throw new Error(
          `Entity validation failed:\n${this.typeRegistry.formatErrors(result)}`
        );
      }
    }

    return entity;
  }

  /**
   * Clone an existing entity with a new ID
   */
  clone(entity: Entity, overrides?: Partial<Entity>): Entity {
    const cloned: Entity = {
      id: overrides?.id || this.generateId(),
      type: overrides?.type || entity.type,
      components: this.deepClone(entity.components),
    };

    // Apply component overrides
    if (overrides?.components) {
      cloned.components = this.mergeComponents(
        cloned.components,
        overrides.components
      );
    }

    // Validate if type registry is available
    if (this.typeRegistry) {
      const result = this.typeRegistry.validate(cloned);
      if (!result.valid) {
        throw new Error(
          `Cloned entity validation failed:\n${this.typeRegistry.formatErrors(result)}`
        );
      }
    }

    return cloned;
  }

  /**
   * Get all registered template IDs
   */
  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): EntityTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Remove a template
   */
  unregisterTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
  }

  /**
   * Set custom ID counter start value
   */
  setIdCounter(value: number): void {
    this.idCounter = value;
  }

  /**
   * Set custom ID generator
   */
  private customIdGenerator?: () => string;

  setIdGenerator(generator: () => string): void {
    this.customIdGenerator = generator;
  }

  // Private helper methods

  /**
   * Resolve template with inheritance chain
   */
  private resolveTemplate(template: EntityTemplate): EntityTemplate {
    if (!template.extends) {
      return template;
    }

    const parent = this.templates.get(template.extends);
    if (!parent) {
      throw new Error(
        `Parent template "${template.extends}" not found for "${template.id}"`
      );
    }

    // Recursively resolve parent
    const resolvedParent = this.resolveTemplate(parent);

    // Merge parent and child
    return {
      id: template.id,
      type: template.type || resolvedParent.type,
      description: template.description || resolvedParent.description,
      components: this.mergeComponents(
        resolvedParent.components,
        template.components
      ),
    };
  }

  /**
   * Deep merge components
   */
  private mergeComponents(
    base: Record<string, Component>,
    override: Record<string, Component>
  ): Record<string, Component> {
    const result: Record<string, Component> = this.deepClone(base);

    for (const [key, value] of Object.entries(override)) {
      if (result[key] && typeof value === 'object' && !Array.isArray(value)) {
        // Deep merge objects
        result[key] = this.deepMerge(result[key], value);
      } else {
        // Replace arrays and primitives
        result[key] = this.deepClone(value);
      }
    }

    return result;
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source;
    }

    if (Array.isArray(source)) {
      return this.deepClone(source);
    }

    const result = this.deepClone(target);

    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        result[key] = this.deepMerge(result[key] || {}, value);
      } else {
        result[key] = this.deepClone(value);
      }
    }

    return result;
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as any;
    }

    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deepClone(value);
    }

    return cloned;
  }

  /**
   * Generate unique entity ID
   */
  private generateId(): string {
    if (this.customIdGenerator) {
      return this.customIdGenerator();
    }

    // Use timestamp + counter for uniqueness
    const timestamp = Date.now();
    const counter = this.idCounter++;
    return `entity_${timestamp}_${counter}`;
  }
}
