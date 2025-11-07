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
    this.element.style.padding = '20px';
    this.element.style.zIndex = '1000';

    // Create header
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'mb-4 pb-3 border-b border-white/20';
    if (config.draggable) {
      this.headerElement.className += ' drag-handle';
    }

    const title = document.createElement('h2');
    title.className = 'text-xl font-bold text-neon-cyan';
    title.textContent = config.title;
    this.headerElement.appendChild(title);

    // Create content container
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'space-y-4';

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
    controlGroup.className = 'flex flex-col gap-2';

    const labelElement = document.createElement('label');
    labelElement.className = 'text-sm text-white/80 font-medium';
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
    slider.className = 'slider-cyber w-full';

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
    select.className = 'w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white';
    select.className += ' focus:outline-none focus:border-cyber-cyan transition-colors';

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
    p.className = `text-white/80 text-sm ${className}`;
    p.textContent = text;
    this.contentElement.appendChild(p);
    return p;
  }

  addDivider(): void {
    const divider = document.createElement('div');
    divider.className = 'border-t border-white/20 my-4';
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
