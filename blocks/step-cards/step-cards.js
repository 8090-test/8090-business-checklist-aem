function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null && text !== '') {
    el.textContent = String(text);
  }
  return el;
}

function addLabeledRow(parent, label, value, valueClass) {
  if (!value) return;
  const row = createEl('p', valueClass || '');
  const strong = document.createElement('strong');
  strong.textContent = `${label}:`;
  row.appendChild(strong);
  row.appendChild(document.createTextNode(` ${value}`));
  parent.appendChild(row);
}

function buildDetailStepsAccordion(detailStepsText) {
  if (!detailStepsText) return null;

  // Split on line breaks and create bullets
  const lines = String(detailStepsText)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return null;

  const details = createEl('details', 'step-card-accordion');
  const summary = createEl('summary', 'step-card-accordion-summary', 'Detailed steps');
  details.appendChild(summary);

  const content = createEl('div', 'step-card-accordion-content');
  const ul = createEl('ul', 'step-card-steps');

  lines.forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    ul.appendChild(li);
  });

  content.appendChild(ul);
  details.appendChild(content);

  return details;
}

function normalizeLinks(linksRaw) {
  // Returns array of { label, url }
  if (!linksRaw) return [];

  // Case 1: Array input (objects or strings)
  if (Array.isArray(linksRaw)) {
    return linksRaw
      .map((entry) => {
        if (!entry) return null;

        // Object shape: { label, url }
        if (typeof entry === 'object') {
          const url = entry.url ? String(entry.url).trim() : '';
          const label = entry.label ? String(entry.label).trim() : '';
          if (!url) return null;
          return { label: label || url, url };
        }

        // String entry: treat as URL
        if (typeof entry === 'string') {
          const url = entry.trim();
          if (!url) return null;
          return { label: url, url };
        }

        return null;
      })
      .filter(Boolean);
  }

  // Case 2: Single string input
  if (typeof linksRaw === 'string') {
    const text = linksRaw.trim();
    if (!text) return [];

    // If multiple lines, try to parse each line
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    return lines
      .map((line) => {
        // Supported formats (best effort):
        // 1) "Label | https://url"
        // 2) "Label - https://url"
        // 3) "https://url"
        const pipeParts = line.split('|').map((p) => p.trim());
        if (pipeParts.length === 2) {
          const label = pipeParts[0];
          const url = pipeParts[1];
          if (!url) return null;
          return { label: label || url, url };
        }

        const dashMatch = line.match(/^(.*)\s+-\s+(https?:\/\/\S+)$/i);
        if (dashMatch) {
          const label = dashMatch[1].trim();
          const url = dashMatch[2].trim();
          if (!url) return null;
          return { label: label || url, url };
        }

        // If it looks like a URL, use it
        if (/^https?:\/\/\S+$/i.test(line)) {
          return { label: line, url: line };
        }

        // Otherwise treat as label-only (no usable URL)
        return null;
      })
      .filter(Boolean);
  }

  return [];
}

function buildLinksSection(linksRaw) {
  const links = normalizeLinks(linksRaw);
  if (!links.length) return null;

  const wrapper = createEl('div', 'step-card-links');
  const label = createEl('p', 'step-card-links-label');
  const strong = document.createElement('strong');
  strong.textContent = 'Links:';
  label.appendChild(strong);
  wrapper.appendChild(label);

  const ul = createEl('ul', 'step-card-links-list');

  links.forEach(({ label: linkLabel, url }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');

    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    // If label is missing, show the URL
    a.textContent = linkLabel || url;

    li.appendChild(a);
    ul.appendChild(li);
  });

  wrapper.appendChild(ul);
  return wrapper;
}

export default async function decorate(block) {
  const response = await fetch('/content/step-cards.json');

  if (!response.ok) {
    block.innerHTML = `<p>Could not load step cards (HTTP ${response.status})</p>`;
    return;
  }

  const json = await response.json();
  const items = Array.isArray(json.data) ? json.data : [];

  block.textContent = '';

  const container = createEl('div', 'step-cards-container');

  items.forEach((item) => {
    const card = createEl('div', 'step-card');

    const title = item.title || item.name || 'Untitled step';
    const agency = item.agency || '';
    const phase = item.phase || '';
    const condition = item.condition || '';
    const fee = item.fee || '';
    const expiration = item.expiration || '';
    const description = item.description || '';
    const detailSteps = item.detailSteps || '';

    // Title
    card.appendChild(createEl('h3', 'step-card-title', title));

    // Labeled fields (Agency right after title, same label style as Phase)
    const meta = createEl('div', 'step-card-meta');
    addLabeledRow(meta, 'Agency', agency, 'step-card-agency');
    addLabeledRow(meta, 'Phase', phase, 'step-card-phase');
    addLabeledRow(meta, 'Condition', condition, 'step-card-condition');
    addLabeledRow(meta, 'Fee', fee, 'step-card-fee');
    addLabeledRow(meta, 'Expiration', expiration, 'step-card-expiration');

    // Only append meta if it has content
    if (meta.childNodes.length > 0) {
      card.appendChild(meta);
    }

    // Description (optional)
    if (description) {
      // Preserve basic safety: treat as text
      const p = createEl('p', 'step-card-desc', description);
      card.appendChild(p);
    }

    // Accordion for detailed steps (plain text with line breaks -> bullets)
    const accordion = buildDetailStepsAccordion(detailSteps);
    if (accordion) {
      card.appendChild(accordion);
    }

    // Links (supports inconsistent formats)
    const linksSection = buildLinksSection(item.links);
    if (linksSection) {
      card.appendChild(linksSection);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
