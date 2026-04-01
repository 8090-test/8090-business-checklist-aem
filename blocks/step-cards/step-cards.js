export default async function decorate(block) {
  const response = await fetch('/content/step-cards.json');

  if (!response.ok) {
    block.innerHTML = `<p>Could not load step cards (HTTP ${response.status})</p>`;
    return;
  }

  const json = await response.json();
  const items = json.data || [];

  block.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'step-cards-container';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'step-card';

    const title = item.title || item.name || 'Untitled step';
    const agency = item.agency || '';
    const phase = item.phase || '';
    const condition = item.condition || '';
    const detailSteps = item.detailSteps || '';
    const fee = item.fee || '';
    const expiration = item.expiration || '';
    const description = item.description || '';

    // Links: expect either an array or a single URL
    let linksHtml = '';
    if (Array.isArray(item.links) && item.links.length > 0) {
      linksHtml = `
        <ul class="step-card-links">
          ${item.links
            .map(
              (link) =>
                `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label || link.url}</a></li>`,
            )
            .join('')}
        </ul>
      `;
    } else if (typeof item.links === 'string') {
      linksHtml = `
        <p class="step-card-links">
          <a href="${item.links}" target="_blank" rel="noopener noreferrer">Learn more</a>
        </p>
      `;
    }

    card.innerHTML = `
      <h3 class="step-card-title">${title}</h3>

      ${agency ? `<p class="step-card-agency"><strong>Agency:</strong> ${agency}</p>` : ''}
      ${phase ? `<p class="step-card-phase"><strong>Phase:</strong> ${phase}</p>` : ''}
      ${condition ? `<p class="step-card-condition"><strong>Condition:</strong> ${condition}</p>` : ''}
      ${fee ? `<p class="step-card-fee"><strong>Fee:</strong> ${fee}</p>` : ''}
