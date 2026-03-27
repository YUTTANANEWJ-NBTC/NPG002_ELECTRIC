document.addEventListener('DOMContentLoaded', () => {
    // Slight delay to ensure fonts/layout are fully rendered
    setTimeout(drawConnections, 500);
    window.addEventListener('resize', () => requestAnimationFrame(drawConnections));
});

function drawConnections() {
    const svg = document.getElementById('connections');
    if (!svg) return;
    svg.innerHTML = '';
    
    // Create Arrows
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    
    function createMarker(id, color) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', id);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        path.setAttribute('style', `fill: ${color};`);
        marker.appendChild(path);
        defs.appendChild(marker);
    }
    
    createMarker('arrow-gray', '#94a3b8');
    createMarker('arrow-blue', '#2563eb');

    const svgRect = svg.getBoundingClientRect();
    
    // Helper to get center left/right coordinates of elements relative to SVG
    const getPos = (el, side) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
            x: side === 'right' ? (rect.right - svgRect.left + 5) : (rect.left - svgRect.left - 5),
            y: rect.top + (rect.height / 2) - svgRect.top
        };
    };

    const gulfPlatform = document.getElementById('gulf-platform');
    const poolGas = document.getElementById('pool-gas') ? document.getElementById('pool-gas').querySelector('.map-circle') : null;
    const systemOp = document.getElementById('system-op') ? document.getElementById('system-op').querySelector('.op-graphic') : null;
    const peaBlock = document.getElementById('pea-block');
    const meaBlock = document.getElementById('mea-block');

    // 1. Gulf Nodes -> GULF GAS
    if (gulfPlatform) {
        const target = getPos(gulfPlatform.querySelector('.platform-image'), 'left');
        document.querySelectorAll('#gulf-nodes .data-node').forEach(node => {
            const start = getPos(node, 'right');
            if(start && target) drawPath(svg, start.x+5, start.y, target.x, target.y, 'flow-line', 'arrow-gray');
        });
    }

    // 2. LNG/Myanmar Nodes -> POOL GAS
    if (poolGas) {
        const target = getPos(poolGas, 'left');
        document.querySelectorAll('#lng-nodes .data-node').forEach(node => {
            const start = getPos(node, 'right');
            // Route them down to Pool Gas
            if(start && target) drawPath(svg, start.x+5, start.y, target.x, target.y - 20, 'flow-line flow-line-blue', 'arrow-blue', 0.6);
        });
    }

    // 3. GULF GAS -> POOL GAS
    if (gulfPlatform && poolGas) {
        const start = getPos(gulfPlatform.querySelector('.platform-image'), 'right');
        const target = getPos(poolGas, 'left');
        if(start && target) drawPath(svg, start.x-10, start.y, target.x, target.y + 20, 'flow-line flow-line-blue', 'arrow-blue', 0.2);
    }

    // 4. POOL GAS -> Power by Gas Nodes
    if (poolGas) {
        const start = getPos(poolGas, 'right');
        document.querySelectorAll('#power-by-gas .gen-node').forEach(node => {
            const target = getPos(node, 'left');
            if(start && target) drawPath(svg, start.x-5, start.y, target.x+5, target.y, 'flow-line flow-line-orange', '', 0.3);
        });
    }

    // 5. Power by Gas Nodes -> SYSTEM OPERATION
    if (systemOp) {
        const target = getPos(systemOp, 'left');
        document.querySelectorAll('#power-by-gas .gen-node').forEach(node => {
            const start = getPos(node, 'right');
            if(start && target) drawPath(svg, start.x, start.y, target.x, target.y-10, 'flow-line', 'arrow-gray', 0.8);
        });
        
        // Connect RE / Import Nodes to System Operation too
        document.querySelectorAll('#re-import-nodes .gen-node').forEach(node => {
            const start = getPos(node, 'right');
            if(start && target) drawPath(svg, start.x, start.y, target.x, target.y-40, 'flow-line', 'arrow-gray', 0.8);
        });
    }

    // 6. SYSTEM OPERATION -> PEA / MEA
    if (systemOp) {
        const start = getPos(systemOp, 'right');
        
        // To PEA
        if (peaBlock) {
            const target = getPos(peaBlock, 'left');
            if(start && target) drawPath(svg, start.x, start.y, target.x+10, target.y, 'flow-line flow-line-blue', 'arrow-blue', 0.5);
        }
        
        // To MEA
        if (meaBlock) {
            const target = getPos(meaBlock, 'left');
            if(start && target) drawPath(svg, start.x, start.y+20, target.x+10, target.y, 'flow-line flow-line-orange', 'arrow-orange', 0.5);
        }
    }
}

function drawPath(svg, startX, startY, targetX, targetY, classNames, markerId, curveBias = 0.4) {
    const controlPoint1X = startX + Math.abs(targetX - startX) * curveBias;
    const controlPoint1Y = startY;
    const controlPoint2X = targetX - Math.abs(targetX - startX) * curveBias;
    const controlPoint2Y = targetY;
    
    const d = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;
    
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', classNames);
    if(markerId) p.setAttribute('marker-end', `url(#${markerId})`);
    
    // Add hover effect
    p.style.transition = 'stroke-width 0.2s';
    p.addEventListener('mouseenter', () => p.style.strokeWidth = '4');
    p.addEventListener('mouseleave', () => p.style.strokeWidth = '');

    svg.appendChild(p);
}
