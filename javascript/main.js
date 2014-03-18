// JavaScript for the main SymPy website. See /static/sympy-live/javascript
// for SymPy Live's code.
$(document).ready(function() {
    if (screen.width <= 767) {
        var el = $('#main-navigation ul');
        var visible = false;
        el.hide();

        $('#mobile-menu').click(function() {
            $(this).toggleClass('active');

            if (visible) {
                el.css('opacity', 0);
                setTimeout(function() {
                    el.hide();
                }, 300);
                visible = false;
            }
            else {
                el.show().css('opacity', 1);
                visible = true;
            }
        });
    }

    var examples = [
        "integrate(1 / (1 + x^2))",
        "isprime(42)",
        "0.[1357]",
        "factor(5*x**4/2 + 3*x**3 - 108*x**2/5 - 27*x - 81/10)",
        "solve(x**5 - 3*x**4 - 6*x**3 + 18*x**2 - 55*x + 165)",
        "integrate(log(x), (x, 1, a))",
        "integrate(x**a*exp(-x), (x, 0, oo))",
        "zeta(4)",
        "DiracDelta(x**2 + x - 2).simplify(x)"
    ];
    var gamma_input = $("#search-gamma input[type='text']")
        .attr('placeholder', examples[Math.floor(examples.length * Math.random())]);
    $("#search-gamma button").click(function() {
        if (gamma_input.val().length == 0) {
            gamma_input.val(gamma_input.attr('placeholder'));
        }
    });

    $('.dropdown').each(function() {
        var dropdown = $(this);
        dropdown.find('h3').click(function(e) {
            var opened = dropdown.is('.open');
            var content = dropdown.find('div');
            if (opened) {
                content.height(0);
                setTimeout(function() {
                    dropdown.toggleClass('open');
                    content.attr('style', '');
                }, 300);
            }
            else {
                dropdown.toggleClass('open');
                var height = content.height();
                content.height(0);
                content.height(height);
            }
        });
    });

    $('.gallery figure').click(function() {
        var margin = 30;

        if ($(window).width() < 1280) {
            margin = 0;
        }

        $('<div id="fade"/>').appendTo('body').css({
            zIndex: 500,
            background: '#000',
            opacity: 0,
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        }).animate({ opacity: 0.8 }, 300);

        var closeShow = function() {
            $('body').off('keyup', keyClose);
            $('#fade').fadeOut(300, function() { $(this).remove(); });
            $('#slideshow').fadeOut(200, function() { $(this).remove(); });
        }
        var keyClose = function(e) {
            if (e.keyCode == 27) {
                closeShow();
            }
        }
        $('body').on('keyup', keyClose);

        var container = $('<div id="slideshow"/>').appendTo('body');
        var close = $('<button><i class="icon-remove"></i></button>')
            .addClass('close')
            .appendTo(container)
            .click(closeShow);
        var image = $(this).find('img').clone().appendTo(container);
        var caption = $('<p>').html($(this).find('figcaption').html()).appendTo(container);
        var desc = $('<p>').html(image.attr('alt')).appendTo(container);
    });
});
