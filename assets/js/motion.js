/* Field Station 动效层：面板上电 / 滚动揭示 / 时间轴画线
 * 依赖：<html> 上由 head 内联脚本预先加好的 .js 门控类；
 * 任何异常都回退为 .motion-off（CSS 中据此强制显示全部内容）。
 */
(function () {
    var docEl = document.documentElement;
    function failSafe() { docEl.classList.add('motion-off'); }

    try {
        // 成功运行标记：default.html 的 3 秒兜底据此判断是否需要强制还原
        docEl.setAttribute('data-motion-on', '1');

        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced || !('IntersectionObserver' in window)) { failSafe(); return; }

        /* 1. 首页加载序列：[data-boot] 面板按 DOM 顺序依次"上电" */
        var bootEls = Array.prototype.slice.call(document.querySelectorAll('[data-boot]'));
        bootEls.forEach(function (el, i) {
            el.style.setProperty('--d', Math.min(i * 90, 450) + 'ms');
        });
        if (bootEls.length) {
            // 双 rAF：确保浏览器先渲染出隐藏初态，transition 才会触发
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    bootEls.forEach(function (el) { el.classList.add('is-booted'); });
                });
            });
        }

        /* 2. 滚动揭示：.reveal 元素进入视口后加入 .is-inview（只触发一次） */
        var revealEls = document.querySelectorAll('.reveal');
        if (revealEls.length) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-inview');
                        io.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
            revealEls.forEach(function (el) { io.observe(el); });
        }

        /* 3. Publications 时间轴：竖线随滚动向下绘制（--tl-progress 0→1） */
        var timeline = document.querySelector('.pub-timeline');
        if (timeline) {
            var ticking = false;
            var update = function () {
                ticking = false;
                var rect = timeline.getBoundingClientRect();
                var vh = window.innerHeight || document.documentElement.clientHeight;
                // 时间轴顶端越过视口 75% 线开始画，底端到达该线时画满
                var p = (vh * 0.75 - rect.top) / rect.height;
                p = Math.max(0, Math.min(1, p));
                timeline.style.setProperty('--tl-progress', p.toFixed(4));
            };
            var onScroll = function () {
                if (!ticking) { ticking = true; requestAnimationFrame(update); }
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            update();
        }
    } catch (e) {
        failSafe();
    }
})();
