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
  if (!linksRaw) return [];

  // Array input (objects or strings)
  if (Array.isArray(linksRaw)) {
    return linksRaw
      .map((entry) => {
        if (!entry) return null;

        if (typeof entry === 'object') {
          const url = entry.url ? String(entry.url).trim() : '';
          const label = entry.label ? String(entry.label).trim() : '';
          if (!url) return null;
          return { label: label || url, url };
        }

        if (typeof entry === 'string') {
          const url = entry.trim();
          if (!url) return null;
          return { label: url, url };
        }

        return null;
      })
      .filter(Boolean);
  }

  // Single string input (best-effort parsing)
  if (typeof linksRaw === 'string') {
    const text = linksRaw.trim();
    if (!text) return [];

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    return lines
      .map((line) => {
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

        if (/^https?:\/\/\S+$/i.test(line)) {
          return { label: line, url: line };
        }

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

  const labelP = createEl('p', 'step-card-links-label');
  const strong = document.createElement('strong');
  strong.textContent = 'Links:';
  labelP.appendChild(strong);
  wrapper.appendChild(labelP);

  const ul = createEl('ul', 'step-card-links-list');

  links.forEach(({ label: linkLabel, url }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');

    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
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

    // Meta rows (Agency right after title, then Phase, etc.)
    const meta = createEl('div', 'step-card-meta');
    addLabeledRow(meta, 'Agency', agency, 'step-card-agency');
    addLabeledRow(meta, 'Phase', phase, 'step-card-phase');
    addLabeledRow(meta, 'Condition', condition, 'step-card-condition');
    addLabeledRow(meta, 'Fee', fee, 'step-card-fee');
    addLabeledRow(meta, 'Expiration', expiration, 'step-card-expiration');

    if (meta.childNodes.length > 0) {
      card.appendChild(meta);
    }

    if (description) {
      card.appendChild(createEl('p', 'step-card-desc', description));
    }
