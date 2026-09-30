const citationCountElements = document.querySelectorAll('[data-semantic-scholar-id]');
citationCountElements.forEach(element => {
    const id = element.getAttribute('data-semantic-scholar-id');
    if (id) {
        element.setAttribute('data-semantic-scholar-id', id.toLowerCase());
    }
});

const semanticScholarIds = new Set(Array.from(citationCountElements).map(element => element.getAttribute('data-semantic-scholar-id')).filter(id => id));

let uncachedSemanticScholarIds = [];
semanticScholarIds.forEach(id => {
    const cacheKey = `semanticScholarCitationCount:${id}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        const { _, timestamp } = JSON.parse(cachedData);
        // If cached data is older than 1 hour, consider it uncached
        if (Date.now() - timestamp > 1 * 60 * 60 * 1000) {
            uncachedSemanticScholarIds.push(id);
        }
    } else {
        uncachedSemanticScholarIds.push(id);
    }
});

let showSemanticScholarCitationCount = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 仪器读数：引用数徽章渲染时从 0 滚动到目标值（reduced-motion 直接显示）
    const countUp = (numEl, target) => {
        const duration = 700;
        const start = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3);
        (function frame(now) {
            const p = Math.min((now - start) / duration, 1);
            numEl.textContent = Math.round(target * ease(p)).toLocaleString();
            if (p < 1) requestAnimationFrame(frame);
        })(start);
    };
    // Update the DOM with the cached citation counts
    semanticScholarIds.forEach(id => {
        const cacheKey = `semanticScholarCitationCount:${id}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const { citationCount } = JSON.parse(cachedData);
            const elements = document.querySelectorAll(`[data-semantic-scholar-id="${id}"]`);
            elements.forEach(element => {
                const n = parseInt(citationCount);
                if (isNaN(n)) return;
                if (reducedMotion) {
                    element.innerHTML = `<a class="badge badge-pill badge-publication badge-info" href="https://www.semanticscholar.org/paper/${id}" target="_blank"><i class="ai ai-semantic-scholar"></i> ${n.toLocaleString()} citations</a>`;
                } else {
                    element.innerHTML = `<a class="badge badge-pill badge-publication badge-info" href="https://www.semanticscholar.org/paper/${id}" target="_blank"><i class="ai ai-semantic-scholar"></i> <span class="citation-count">0</span> citations</a>`;
                    const numEl = element.querySelector('.citation-count');
                    if (numEl) countUp(numEl, n);
                }
            });
        }
    });
};

if (uncachedSemanticScholarIds.length > 0) {
    fetch('https://api.semanticscholar.org/graph/v1/paper/batch?fields=citationCount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ids: Array.from(semanticScholarIds)
        })
    }).then(response => {
        return response.json();
    }).then(data => {
        data.forEach(paper => {
            console.log(paper);
            // Cache citation count data
            const cacheKey = `semanticScholarCitationCount:${paper.paperId}`;
            const cacheData = {
                citationCount: paper.citationCount,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        });
    }).catch(error => {
        console.error('Error fetching Semantic Scholar data:', error);
    }).finally(showSemanticScholarCitationCount);
} else {
    showSemanticScholarCitationCount();
}
