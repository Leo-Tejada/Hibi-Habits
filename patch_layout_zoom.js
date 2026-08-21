const fs = require('fs');
const file = 'src/components/habits/use-graph-layout.ts';
let content = fs.readFileSync(file, 'utf8');

// We need to add transformRef inside useGraphLayout
content = content.replace(
  "const draggedRef = useRef(false)",
  "const draggedRef = useRef(false)\n  const transformRef = useRef({ x: 0, y: 0, scale: 1 })"
);

// We need to update paint to apply the transform to the layer
content = content.replace(
  "function paint(container: HTMLElement, simulation: Simulation): void {",
  `function paint(container: HTMLElement, simulation: Simulation, transform: {x: number, y: number, scale: number} = {x:0, y:0, scale:1}): void {
  const layer = container.querySelector('[data-layer="graph"]') as HTMLElement;
  if (layer) {
    layer.style.transform = \`translate(\${transform.x}px, \${transform.y}px) scale(\${transform.scale})\`;
  }`
);

// Update step(simulation); paint(container, simulation); calls
content = content.replace(
  "paint(container, simulation)",
  "paint(container, simulation, transformRef.current)"
);
content = content.replace(
  "paint(container, simulation)",
  "paint(container, simulation, transformRef.current)"
);
content = content.replace(
  "paint(container, simulation)",
  "paint(container, simulation, transformRef.current)"
);

// We need to update toLocalX and toLocalY inside startDrag
content = content.replace(
  "const toLocalX = (clientX: number) => clientX - rect.left - simulation.frame.halfWidth",
  "const toLocalX = (clientX: number) => ((clientX - rect.left - simulation.frame.halfWidth) - transformRef.current.x) / transformRef.current.scale"
);
content = content.replace(
  "const toLocalY = (clientY: number) => clientY - rect.top - simulation.frame.halfHeight",
  "const toLocalY = (clientY: number) => ((clientY - rect.top - simulation.frame.halfHeight) - transformRef.current.y) / transformRef.current.scale"
);

// We need to add the zoom and pan handlers. We can attach them to container in useLayoutEffect.
const zoomPanLogic = `
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, t.scale * Math.exp(delta)), 5);
      
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;

      // Adjust x and y to zoom towards the mouse cursor
      t.x = cx - (cx - t.x) * (newScale / t.scale);
      t.y = cy - (cy - t.y) * (newScale / t.scale);
      t.scale = newScale;
      
      if (simulationRef.current) {
        paint(container, simulationRef.current, t);
      }
    };

    const handlePointerDown = (e: globalThis.PointerEvent) => {
      if ((e.target as Element).closest('[data-body]')) return; // handled by node startDrag
      
      let startX = e.clientX;
      let startY = e.clientY;
      const t = transformRef.current;
      draggedRef.current = false;
      
      const onMove = (me: globalThis.PointerEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          draggedRef.current = true;
        }
        t.x += dx;
        t.y += dy;
        startX = me.clientX;
        startY = me.clientY;
        if (simulationRef.current) {
          paint(container, simulationRef.current, t);
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [containerRef]);
`;

content = content.replace(
  "useLayoutEffect(() => {",
  zoomPanLogic + "\n  useLayoutEffect(() => {"
);

fs.writeFileSync(file, content);
