/**
 * @file engine.js
 * @description Lightweight HTML template engine for email rendering.
 *
 * Design decisions:
 * - File-based templates (HTML files) keep markup separate from logic
 * - Templates are cached after first load — no repeated disk I/O
 * - Simple but complete feature set: variable interpolation, conditionals, loops
 * - No external dependency (Handlebars, Mustache, etc.) — fewer supply chain risks
 * - `{{variable}}` syntax is familiar to anyone who has used any template engine
 *
 * Supported syntax:
 *   {{name}}               — simple value
 *   {{user.fullName}}      — nested property access
 *   {{#if condition}}...{{/if}}    — conditional block
 *   {{#each items}}{{this.name}}{{/each}}  — iteration
 *
 * To add Handlebars in the future (if templates grow complex):
 *   Replace the render() call — the rest of the system is unchanged.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateEngine {
  constructor() {
    // In-memory cache: templateName → raw HTML string
    // Cache is populated on first render and never invalidated (templates are static)
    this._cache = new Map();
  }

  /**
   * Load a template file from disk (or return cached version).
   * @param {string} templateName - Filename without .html extension
   * @returns {string} Raw HTML template string
   */
  _load(templateName) {
    if (this._cache.has(templateName)) {
      return this._cache.get(templateName);
    }

    const filePath = path.join(__dirname, `${templateName}.html`);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      this._cache.set(templateName, content);
      logger.debug({ message: `Template loaded: ${templateName}` });
      return content;
    } catch (error) {
      throw new Error(
        `TemplateEngine: Cannot find template '${templateName}.html' at ${filePath}. ` +
          `Original error: ${error.message}`,
      );
    }
  }

  /**
   * Resolve a dot-notation key against an object.
   * @param {string} key - e.g., "user.fullName" or "complaint.status"
   * @param {object} data - The data object to resolve against
   * @returns {*}
   */
  _resolve(key, data) {
    return key
      .trim()
      .split(".")
      .reduce((acc, part) => acc?.[part], data);
  }

  /**
   * Interpolate {{variable}} and {{object.property}} placeholders.
   */
  _interpolate(template, data) {
    // Matches {{anything}} that does NOT start with # or /
    return template.replace(/\{\{(?![#/])([^}]+)\}\}/g, (match, key) => {
      const value = this._resolve(key.trim(), data);
      return value !== undefined && value !== null ? String(value) : "";
    });
  }

  /**
   * Process {{#if key}}...{{/if}} conditional blocks.
   * Supports nested property access (e.g., {{#if complaint.isHighPriority}})
   */
  _processConditionals(template, data) {
    return template.replace(
      /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        const value = this._resolve(condition.trim(), data);
        // Truthy check: non-empty string, non-zero number, non-null object, true boolean
        return value ? content : "";
      },
    );
  }

  /**
   * Process {{#each arrayKey}}...{{/each}} loops.
   * Inside the loop, use {{this.property}} to access item properties.
   */
  _processLoops(template, data) {
    return template.replace(
      /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayKey, itemTemplate) => {
        const arr = this._resolve(arrayKey.trim(), data);
        if (!Array.isArray(arr) || arr.length === 0) return "";
        return arr
          .map((item, index) => {
            // Merge parent data with item + index so templates can access both
            const itemData = { ...data, this: item, "@index": index };
            // Recursively process item template (handles nested vars)
            return this._interpolate(
              this._processConditionals(itemTemplate, itemData),
              itemData,
            );
          })
          .join("");
      },
    );
  }

  /**
   * Render a named template with the provided data.
   *
   * @param {string} templateName - Template filename without .html (e.g., 'emailVerification')
   * @param {object} data - Variables to inject into the template
   * @returns {string} Rendered HTML string
   */
  render(templateName, data = {}) {
    let template = this._load(templateName);

    // Processing order matters:
    // 1. Conditionals first (may contain variable placeholders inside)
    // 2. Loops second (may contain variable placeholders inside)
    // 3. Simple interpolation last
    template = this._processConditionals(template, data);
    template = this._processLoops(template, data);
    template = this._interpolate(template, data);

    return template;
  }

  /**
   * Invalidate the template cache.
   * Useful in development — call on file change events to pick up edits.
   * @param {string} [templateName] - Specific template to invalidate, or all if omitted
   */
  clearCache(templateName) {
    if (templateName) {
      this._cache.delete(templateName);
    } else {
      this._cache.clear();
      logger.debug({ message: "Template cache cleared" });
    }
  }
}

// Export a single shared instance — all services use the same cache
export const templateEngine = new TemplateEngine();
