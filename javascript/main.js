$(document).ready(function() {
    if (screen.width <= 767) {
        var el = $('#main-navigation ul');
        var visible = false;
        el.hide();

        $('#mobile-menu').click(function() {
            console.log(visible);
            if (visible) {
                el.height(0).css('opacity', 0);
                window.setTimeout(function() {
                    el.hide();
                    visible = false;
                }, 290);
            }
            else {
                var height = el.show().css('height', 'auto').height();
                el.hide();
                el.show().height(height).css('opacity', 1);
                visible = true;
            }
        });
    }
});
