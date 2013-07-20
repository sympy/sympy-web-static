$(document).ready(function() {
    if (screen.width <= 767) {
        var el = $('#main-navigation ul');
        var visible = false;
        el.hide();

        $('#mobile-menu').click(function() {
            if (visible) {
                el.css('opacity', 0);
                visible = false;
                // window.setTimeout(function() {
                //     el.hide();
                //     visible = false;
                // }, 290);
            }
            else {
                // var height = el.show().css('height', 'auto').height();
                // el.hide();
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
});
