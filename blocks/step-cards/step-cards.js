function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null && text !== '') {
    el.textContent = String(text);
  }
  return el;
}

function addLabeledRow(parent, label, value) {
  if (!value) return;

  const row = createEl('p');
  const strong = document.createElement('strong');
  strong.textContent = `${label}:`;
  row.appendChild(strong);
  row.appendChild(document.createTextNode(` ${value}`));
  parent.appendChild(row);
}

function buildDetailStepsAccordion(text) {
  if (!text) return null;

  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const details = createEl('details', 'step-card-accordion');
  const summary = createEl('summary', 'step-card-accordion-summary', 'Detailed steps');
  details.appendChild(summary);

  const content = createEl('div', 'step-card-accordion-content');
  const ul = createEl('ul', 'step-card-steps');

  lines.forEach((line) => {
    const li = createEl('li', null, line);
    ul.appendChild(li);
  });

  content.appendChild(ul);
  details.appendChild(content);

  return details;
}

function normalizeLinks(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'object' && item.url) {
          return {
            label: item.label || item.url,
            url: item.url,
          };
        }
        if (typeof item === 'string') {
          return { label: item, url: item };
        }
        return null;
      })
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ label: url, url }));
  }

  return [];
}

function buildLinksSection(rawLinks) {
  const links = normalizeLinks(rawLinks);
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
    a.textContent = linkLabel;
    li.appendChild(a);
    ul.appendChild(li);
  });

  wrapper.appendChild(ul);
  return wrapper;
}

export default async function decorate(block) {
  const response = await fetch('/content/step-cards.json');

  if (!response.ok) {
    block.textContent = `Could not load step cards (HTTP ${response.status})`;
    return;
  }

  const json = await response.json();
  const items = Array.isArray(json.data) ? json.data : [];

  block.textContent = '';
  const container = createEl('div', 'step-cards-container');

  items.forEach((item) => {
    const card = createEl('div', 'step-card');

    card.appendChild(
      createEl('h3', 'step-card-title', item.title || 'Untitled step'),
    );

    const meta = createEl('div', 'step-card-meta');
    addLabeledRow(meta, 'Agency', item.agency);
    addLabeledRow(meta, 'Phase', item.phase);
    addLabeledRow(meta, 'Condition', item.condition);
    addLabeledRow(meta, 'Fee', item.fee);
    addLabeledRow(meta, 'Expiration', item.expiration);

    if (meta.childNodes.length) {
      card.appendChild(meta);
    }

    if (item.description) {
      card.appendChild(createEl('p', 'step-card-desc', item.description));
    }

    const accordion = buildDetailStepsAccordion(item.detailSteps);
    if (accordion) {
      card.appendChild(accordion);
    }

    const linksSection = buildLinksSection(item.links);
    if (linksSection) {
      card.appendChild(linksSection);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
