export default async function decorate(block) {
  // 1) Fetch your JSON from the AEM Preview domain path that you confirmed works
  const response = await fetch('/content/step-cards.json');

  // If the fetch fails, show a helpful message instead of a blank block
  if (!response.ok) {
    block.innerHTML = `<p>Could not load step cards (HTTP ${response.status}).</p>`;
    return;
  }

  const json = await response.json();

  // 2) Franklin JSON is typically { data: [...] }
  const items = json.data || [];

  // 3) Clear any placeholder content
  block.innerHTML = '';

  // 4) Build the card container
  const container = document.createElement('div');
  container.className = 'step-cards-container';

  // 5) Create one card per item
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'step-card';

    const title = item.title || item.name || 'Untitled step';
    const phase = item.phase || '';
    const description = item.description || item.summary || '';

    card.innerHTML = `
      <h3 class="step-card-title">${title}</h3>
      ${phase ? `<p class="step-card-phase"><strong>Phase:</strong> ${phase}</p>` : ''}
      ${description ? `<p class="step-card-desc">${description}</p>` : ''}
    `;

    container.appendChild(card);
  });

  // 6) Add cards to the block
  block.appendChild(container);
}
