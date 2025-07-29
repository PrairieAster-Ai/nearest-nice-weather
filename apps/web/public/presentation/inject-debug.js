// Direct diagnostic injection for slide 5
(function() {
    console.clear();
    console.log('🔍 SLIDE 5 DIAGNOSTIC INJECTION');
    
    // Navigate to slide 5 first
    if (typeof currentSlide !== 'undefined' && typeof showSlide === 'function') {
        currentSlide = 4; // Slide 5 is index 4
        showSlide(currentSlide);
        console.log('✅ Navigated to slide 5');
    } else {
        console.log('❌ Navigation functions not available');
    }
    
    setTimeout(() => {
        // Get all slides
        const slides = document.querySelectorAll('.slide');
        console.log(`📊 Found ${slides.length} slides total`);
        
        // Check slide 5 specifically
        const slide5 = slides[4];
        if (!slide5) {
            console.log('❌ CRITICAL: Slide 5 not found!');
            return;
        }
        
        // Check slide 5 properties
        const slide5Style = getComputedStyle(slide5);
        console.log('🎨 Slide 5 computed styles:', {
            display: slide5Style.display,
            visibility: slide5Style.visibility,
            opacity: slide5Style.opacity,
            position: slide5Style.position,
            zIndex: slide5Style.zIndex,
            height: slide5Style.height,
            width: slide5Style.width
        });
        
        console.log('🏷️ Slide 5 classes:', slide5.className);
        console.log('⭐ Slide 5 is active:', slide5.classList.contains('active'));
        
        // Check slide content
        const slideContent = slide5.querySelector('.slide-content');
        if (!slideContent) {
            console.log('❌ CRITICAL: .slide-content not found in slide 5!');
            return;
        }
        
        const contentStyle = getComputedStyle(slideContent);
        console.log('📝 Slide content styles:', {
            display: contentStyle.display,
            height: contentStyle.height,
            maxHeight: contentStyle.maxHeight,
            overflow: contentStyle.overflow,
            visibility: contentStyle.visibility
        });
        
        // Check feature grid
        const featureGrid = slideContent.querySelector('.feature-grid');
        if (!featureGrid) {
            console.log('❌ CRITICAL: .feature-grid not found in slide 5!');
            return;
        }
        
        const gridStyle = getComputedStyle(featureGrid);
        console.log('🎯 Feature grid styles:', {
            display: gridStyle.display,
            gridTemplateColumns: gridStyle.gridTemplateColumns,
            gap: gridStyle.gap,
            height: gridStyle.height,
            visibility: gridStyle.visibility
        });
        
        // Check feature cards
        const cards = featureGrid.querySelectorAll('.feature-card');
        console.log(`🃏 Found ${cards.length} feature cards`);
        
        cards.forEach((card, index) => {
            const cardStyle = getComputedStyle(card);
            console.log(`🎴 Card ${index + 1}:`, {
                display: cardStyle.display,
                height: cardStyle.height,
                visibility: cardStyle.visibility,
                background: cardStyle.background.substring(0, 50) + '...'
            });
        });
        
        // Visual debugging - add colored borders
        slide5.style.border = '5px solid red';
        slide5.style.outline = '3px solid yellow';
        slideContent.style.border = '3px solid green';
        featureGrid.style.border = '2px solid blue';
        
        console.log('🎨 Added visual debugging borders');
        console.log('🔍 DIAGNOSTIC COMPLETE - Check visual borders in presentation');
        
    }, 1000);
})();