import { DOMParser } from '@xmldom/xmldom';
import type { AttributeModel, ElementModel, SchemaModel } from './model.ts';

type TypeLookup = Map<string, AttributeModel[]>;

function collectAttributes(node: Element | Document): AttributeModel[] {
  const attrs: AttributeModel[] = [];
  const xsAttributes = Array.from(node.getElementsByTagName('xs:attribute'));
  xsAttributes.forEach(attrEl => {
    const attrDocs = attrEl.getElementsByTagName('xs:documentation');
    const attrDocumentation =
      attrDocs.length > 0
        ? attrDocs[0].textContent?.trim() || undefined
        : undefined;
    attrs.push({
      name: attrEl.getAttribute('name') ?? '',
      type: attrEl.getAttribute('type') ?? 'xs:string',
      use: (attrEl.getAttribute('use') as AttributeModel['use']) ?? undefined,
      defaultValue: attrEl.getAttribute('default') ?? undefined,
      fixedValue: attrEl.getAttribute('fixed') ?? undefined,
      documentation: attrDocumentation,
    });
  });
  return attrs;
}

function buildTypeLookup(doc: Document): TypeLookup {
  const map: TypeLookup = new Map();
  const complexTypes = Array.from(doc.getElementsByTagName('xs:complexType'));

  complexTypes.forEach(typeEl => {
    const name = typeEl.getAttribute('name');
    if (!name) {
      return;
    }
    const attrs = collectAttributes(typeEl);

    // Merge attributes from base types (extension) if present.
    const extensions = Array.from(typeEl.getElementsByTagName('xs:extension'));
    extensions.forEach(ext => {
      const base = ext.getAttribute('base');
      if (base && map.has(base)) {
        attrs.push(...(map.get(base) ?? []));
      }
    });

    map.set(name, attrs);
  });

  return map;
}

function dedupeAttributes(attributes: AttributeModel[]): AttributeModel[] {
  const byNameAttr = new Map<string, AttributeModel>();
  attributes.forEach(attr => {
    if (!attr.name) {
      return;
    }
    if (!byNameAttr.has(attr.name)) {
      byNameAttr.set(attr.name, attr);
    }
  });
  return Array.from(byNameAttr.values());
}

function collectElements(doc: Document): ElementModel[] {
  const byName = new Map<string, ElementModel>();
  const xsElements = Array.from(doc.getElementsByTagName('xs:element'));
  const typeLookup = buildTypeLookup(doc);

  xsElements.forEach(el => {
    const name = el.getAttribute('name');
    if (!name) {
      return;
    }

    const docs = el.getElementsByTagName('xs:documentation');
    const documentation =
      docs.length > 0 ? docs[0].textContent?.trim() || undefined : undefined;

    let attributes: AttributeModel[] = [];

    // Inline attributes on the element.
    attributes.push(...collectAttributes(el));

    // Attributes from inline complexType.
    const inlineType = el.getElementsByTagName('xs:complexType')[0];
    if (inlineType) {
      attributes.push(...collectAttributes(inlineType));
    }

    // Attributes from referenced named type.
    const typeRef = el.getAttribute('type');
    if (typeRef && typeLookup.has(typeRef)) {
      attributes.push(...(typeLookup.get(typeRef) ?? []));
    }

    attributes = dedupeAttributes(attributes);

    const occursByChild: Record<
      string,
      { min: number; max: number | 'unbounded' }
    > = {};
    const children = Array.from(el.getElementsByTagName('xs:sequence'))
      .flatMap(seq => Array.from(seq.getElementsByTagName('xs:element')))
      .map(childEl => {
        const ref = childEl.getAttribute('ref') ?? childEl.getAttribute('name');
        if (ref) {
          const min = Number(childEl.getAttribute('minOccurs') ?? '1');
          const maxAttr = childEl.getAttribute('maxOccurs');
          const max =
            maxAttr === 'unbounded' || maxAttr === undefined
              ? (maxAttr ?? 1)
              : Number(maxAttr);
          occursByChild[ref] = {
            min: Number.isNaN(min) ? 1 : min,
            max: max === 'unbounded' ? 'unbounded' : Number(max),
          };
        }
        return ref;
      })
      .filter((child): child is string => !!child);

    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, {
        name,
        documentation,
        attributes,
        children,
        occurs: occursByChild,
      });
    } else {
      if (!existing.documentation && documentation) {
        existing.documentation = documentation;
      }
      if (existing.attributes.length === 0 && attributes.length > 0) {
        existing.attributes = attributes;
      }
      if (existing.children.length === 0 && children.length > 0) {
        existing.children = children;
      }
    }
  });

  return Array.from(byName.values());
}

export function buildSchemaModel(version: string, xsd: string): SchemaModel {
  const doc = new DOMParser().parseFromString(xsd, 'application/xml');
  const elements = collectElements(doc);
  return { version, elements };
}
