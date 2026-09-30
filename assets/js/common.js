// aHR0cHM6Ly9naXRodWIuY29tL2x1b3N0MjYvYWNhZGVtaWMtaG9tZXBhZ2U=
$(function () {
    lazyLoadOptions = {
        scrollDirection: 'vertical',
        placeholder: "",
        onError: function(element) {
            console.log('[lazyload] Error loading ' + element.data('src'));
        },
        afterLoad: function(element) {
            if (element.is('img')) {
                // remove background-image style
                element.css('background-image', 'none');
                element.css('min-height', '0');
            } else if (element.is('div')) {
                // set the style to background-size: cover; 
                element.css('background-size', 'cover');
                element.css('background-position', 'center');
            }
        }
    }

    $('img.lazy, div.lazy:not(.always-load)').Lazy({visibleOnly: true, ...lazyLoadOptions});
    $('div.lazy.always-load').Lazy({visibleOnly: false, ...lazyLoadOptions});

    $('[data-toggle="tooltip"]').tooltip()

    var $grid = $('.grid').masonry({
        "percentPosition": true,
        "itemSelector": ".grid-item",
        "columnWidth": ".grid-sizer"
    });
    // layout Masonry after each image loads
    $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
    });

    $(".lazy").on("load", function () {
        $grid.masonry('layout');
    });

    // 修复：滚动到页面底部时，最后一个年份小节过短，无法把其顶部推过
    // scrollspy 的触发线，右侧年份导航会停留在上一个年份。此处强制激活
    // 最后一个年份链接；向上回滚时 Bootstrap scrollspy 会自动接管。
    var yearNav = document.getElementById('navbar-year');
    if (yearNav) {
        window.addEventListener('scroll', function () {
            var doc = document.documentElement;
            var atBottom = window.innerHeight + window.scrollY >= Math.max(doc.scrollHeight, document.body.scrollHeight) - 40;
            if (!atBottom) return;
            var links = yearNav.querySelectorAll('.nav-link');
            if (!links.length) return;
            links.forEach(function (l) { l.classList.remove('active'); });
            links[links.length - 1].classList.add('active');
        }, { passive: true });
    }
})
