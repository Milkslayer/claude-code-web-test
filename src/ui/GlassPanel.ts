export interface GlassPanelConfig {
  title: string;
  x: number;
  y: number;
  width: number;
  draggable?: boolean;
}

export class GlassPanel {
  private element: HTMLDivElement;
  private headerElement: HTMLDivElement;
  private contentElement: HTMLDivElement;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(config: GlassPanelConfig) {
    // Create main panel element
    this.element = document.createElement('div');
    this.element.className = 'glass-panel fixed scanlines';
    this.element.style.left = `${config.x}px`;
    this.element.style.top = `${config.y}px`;
    this.element.style.width = `${config.width}px`;
    this.element.style.padding = '24px';
    this.element.style.zIndex = '1000';

    const accentBar = document.createElement('div');
    accentBar.className = 'panel-accent-bar';
    this.element.appendChild(accentBar);

    // Create header
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'panel-header';
    if (config.draggable) {
      this.headerElement.className += ' drag-handle';
    }

    const title = document.createElement('h2');
    title.className = 'panel-title';
    title.textContent = config.title;

    const pulse = document.createElement('span');
    pulse.className = 'panel-header-pulse';

    const headerContent = document.createElement('div');
    headerContent.className = 'panel-header-content';
    headerContent.appendChild(title);
    headerContent.appendChild(pulse);

    this.headerElement.appendChild(headerContent);

    // Create content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'panel-content';

    this.element.appendChild(this.headerElement);
    this.element.appendChild(this.contentElement);

    // Setup drag functionality
    if (config.draggable) {
      this.setupDragging();
    }
  }

  private setupDragging(): void {
    this.headerElement.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragOffsetX = e.clientX - this.element.offsetLeft;
      this.dragOffsetY = e.clientY - this.element.offsetTop;
      this.element.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const x = e.clientX - this.dragOffsetX;
        const y = e.clientY - this.dragOffsetY;

        // Keep panel within viewport
        const maxX = window.innerWidth - this.element.offsetWidth;
        const maxY = window.innerHeight - this.element.offsetHeight;

        this.element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
        this.element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.element.style.cursor = 'auto';
      }
    });
  }

  addControl(label: string, control: HTMLElement): void {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'panel-control-group';

    const labelElement = document.createElement('label');
    labelElement.className = 'panel-control-label';
    labelElement.textContent = label;

    controlGroup.appendChild(labelElement);
    controlGroup.appendChild(control);

    this.contentElement.appendChild(controlGroup);
  }

  addButton(label: string, onClick: () => void, variant: 'cyan' | 'magenta' = 'cyan'): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = variant === 'cyan' ? 'btn-neon-cyan w-full' : 'btn-neon-magenta w-full';
    button.textContent = label;
    button.addEventListener('click', onClick);

    this.contentElement.appendChild(button);
    return button;
  }

  addSlider(
    label: string,
    min: number,
    max: number,
    value: number,
    step: number,
    onChange: (value: number) => void
  ): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = value.toString();
    slider.step = step.toString();
    slider.className = 'slider-cyber panel-slider';

    slider.addEventListener('input', () => {
      onChange(parseFloat(slider.value));
    });

    this.addControl(label, slider);
    return slider;
  }

  addDropdown(
    label: string,
    options: string[],
    selectedIndex: number,
    onChange: (index: number) => void
  ): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'panel-select';

    options.forEach((option, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = index.toString();
      optionElement.textContent = option;
      optionElement.selected = index === selectedIndex;
      select.appendChild(optionElement);
    });

    select.addEventListener('change', () => {
      onChange(parseInt(select.value));
    });

    this.addControl(label, select);
    return select;
  }

  addText(text: string, className = ''): HTMLParagraphElement {
    const p = document.createElement('p');
    p.className = `panel-text ${className}`;
    p.textContent = text;
    this.contentElement.appendChild(p);
    return p;
  }

  addSectionHeading(title: string, subtitle?: string): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'panel-section-heading';

    const heading = document.createElement('h3');
    heading.className = 'panel-section-title';
    heading.textContent = title;
    container.appendChild(heading);

    if (subtitle) {
      const sub = document.createElement('p');
      sub.className = 'panel-section-subtitle';
      sub.textContent = subtitle;
      container.appendChild(sub);
    }

    this.contentElement.appendChild(container);
    return container;
  }

  addList(items: string[], className = ''): HTMLUListElement {
    const list = document.createElement('ul');
    list.className = `panel-list ${className}`.trim();

    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'panel-list-item';
      li.textContent = item;
      list.appendChild(li);
    });

    this.contentElement.appendChild(list);
    return list;
  }

  addCustom<T extends HTMLElement>(element: T): T {
    this.contentElement.appendChild(element);
    return element;
  }

  addDivider(): void {
    const divider = document.createElement('div');
    divider.className = 'panel-divider';
    this.contentElement.appendChild(divider);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  unmount(): void {
    this.element.remove();
  }

  getElement(): HTMLDivElement {
    return this.element;
  }

  setPosition(x: number, y: number): void {
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  show(): void {
    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
  }
}
