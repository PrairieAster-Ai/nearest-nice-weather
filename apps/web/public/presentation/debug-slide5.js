// Advanced debugging script for slide 5 visibility issues
console.log('=== SLIDE 5 DEBUG ANALYSIS ===');

// 1. Check slide structure
const slides = document.querySelectorAll('.slide');
console.log(`Found ${slides.length} slides`);

// 2. Check slide 5 specifically (index 4)
const slide5 = slides[4];
if (!slide5) {
    console.error('SLIDE 5 NOT FOUND!');
} else {
    console.log('Slide 5 found:', slide5);
    
    // Check computed styles
    const style = window.getComputedStyle(slide5);
    console.log('Slide 5 computed styles:', {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        height: style.height,
        position: style.position,
        zIndex: style.zIndex
    });
    
    // Check if slide has active class
    console.log('Slide 5 classes:', slide5.className);
    console.log('Slide 5 has active class:', slide5.classList.contains('active'));
}

// 3. Check feature grid inside slide 5
const featureGrid = slide5?.querySelector('.feature-grid');
if (!featureGrid) {
    console.error('FEATURE GRID NOT FOUND in slide 5!');
} else {
    console.log('Feature grid found:', featureGrid);
    
    const gridStyle = window.getComputedStyle(featureGrid);
    console.log('Feature grid styles:', {
        display: gridStyle.display,
        gridTemplateColumns: gridStyle.gridTemplateColumns,
        gap: gridStyle.gap,
        visibility: gridStyle.visibility,
        height: gridStyle.height
    });
    
    // Check feature cards
    const cards = featureGrid.querySelectorAll('.feature-card');
    console.log(`Found ${cards.length} feature cards`);
    
    cards.forEach((card, index) => {
        const cardStyle = window.getComputedStyle(card);
        console.log(`Card ${index + 1}:`, {
            display: cardStyle.display,
            background: cardStyle.background,
            height: cardStyle.height,
            visibility: cardStyle.visibility
        });
    });
}

// 4. Check current slide index
console.log('Current slide index:', window.currentSlide || 'undefined');

// 5. Take element screenshots if possible
function highlightElement(element, color = 'red') {
    element.style.border = `3px solid ${color}`;
    element.style.boxShadow = `0 0 10px ${color}`;
}

if (slide5) {
    highlightElement(slide5, 'red');
    if (featureGrid) {
        highlightElement(featureGrid, 'blue');
    }
}

console.log('=== DEBUG COMPLETE ===');