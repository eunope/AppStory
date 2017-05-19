window.onbeforeunload = function() {
    window.scrollTo(0, 0);
};
$(document).ready(function() {
    if(history.pushState) {
        history.pushState('', document.title, window.location.pathname + window.location.search + '#home');
    } else location.hash = '';

    // nav 위치
    $('#snb').css('left', ($(document).width() - 110)+ 'px' );

    // nav 이벤트
    $('#snb .snb_menu').click(function(e) {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });

    // 포트폴리오 플리킹 init
    swiper_main = new Swiper('.swiper-main', {
        initialSlide: localStorage.getItem('appstory_swiper_current_index') || 0,
        nextButton: '.swiper-main-next',
        prevButton: '.swiper-main-prev',
        onInit: function (swiper) {
            localStorage.setItem('appstory_swiper_current_index', swiper.activeIndex);
        },
        onSlideChangeEnd: function (swiper) {
            localStorage.setItem('appstory_swiper_current_index', swiper.activeIndex);
        }
    });

    var modal_portfolio = $('#modal_portfolio');
    // 모달레이어 오픈
    $('section.portfolio .flick_item').click(function() {
        modal_portfolio.show();
    });
    // 모달레이어 숨김
    $('#modal_portfolio .modal_close').click(function() {
        modal_portfolio.hide();
    });
    modal_portfolio.on('show', function() {
        // 모달레이어 오픈 시
        $('body').addClass('disable_scroll');
        $(this).scrollTop = 0;
        $(this).scrollLeft = 0;
        swiper_main.destroy(true, true);
        setTimeout(function(){
            swiper_modal = new Swiper('.swiper-modal', {
                initialSlide: localStorage.getItem('appstory_swiper_current_index'),
                nextButton: '.swiper-modal-next',
                prevButton: '.swiper-modal-prev',
                onSlideChangeEnd: function (swiper) {
                    localStorage.setItem('appstory_swiper_current_index', swiper.activeIndex);
                }
            });
        }, 100);

    }).on('hide', function(){
        // 모달레이어 닫힘 시
        $('body').removeClass('disable_scroll');
        swiper_modal.destroy(true, true);
        setTimeout(function(){
            swiper_main = new Swiper('.swiper-main', {
                initialSlide: localStorage.getItem('appstory_swiper_current_index'),
                nextButton: '.swiper-main-next',
                prevButton: '.swiper-main-prev',
                onSlideChangeEnd: function (swiper) {
                    localStorage.setItem('appstory_swiper_current_index', swiper.activeIndex);
                }
            });
        }, 100);
    });

    //파일첨부 시
    $('input#file_uploader').change(function() {
        var filename =$(this)[0].files[0].name;
        var labelToInsertFilename = $('label[for="'+$(this).attr('id')+'"]')[1];
        labelToInsertFilename.innerText = filename;
    });
});

// SNB 스크롤
$(function () {
    var $document = $(document),
        left = 0,
        scrollTimer = 0;

    // Detect horizontal scroll start and stop.
    $document.on("scroll", function () {
        var docLeft = $document.scrollLeft();
        if(left !== docLeft) {
            var self = this, args = arguments;
            if(!scrollTimer) {
                // We've not yet (re)started the timer: It's the beginning of scrolling.
                startHScroll.apply(self, args);
            }
            window.clearTimeout(scrollTimer);
            scrollTimer = window.setTimeout(function () {
                scrollTimer = 0;
                // Our timer was never stopped: We've finished scrolling.
                stopHScroll.apply(self, args);
            }, 100);
            left = docLeft;
        }
    });

    // Horizontal scroll started - Make div's absolutely positioned.
    function startHScroll () {
        console.log("Scroll Start");
        $(".snb")
        // Clear out any left-positioning set by stopHScroll.
            .css("left","")
            .each(function () {
                var $this = $(this),
                    pos = $this.offset();
                    console.log('this :', this );
                    console.log('offset(pos) :', pos );
                // Preserve our current vertical position...
                $this.css("top", pos.top)
            })
            // ...before making it absolutely positioned.
            .css("position", "absolute");
    }

    // Horizontal scroll stopped - Make div's float again.
    function stopHScroll () {
        var leftScroll = $(window).scrollLeft();
        console.log("Scroll Stop");
        $(".snb")
        // Clear out any top-positioning set by startHScroll.
            .css("top","0")
            .each(function () {
                var $this = $(this),
                    pos = $this.position();
                // Preserve our current horizontal position, munus the scroll position...
                $this.css("left", pos.left-leftScroll);
            })
            // ...before making it fixed positioned.
            .css("position", "fixed");
    }
});

//The magic code to add show/hide custom event triggers
(function ($) {
    $.each(['show', 'hide'], function (i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function () {
            this.trigger(ev);
            return el.apply(this, arguments);
        };
    });
})(jQuery);