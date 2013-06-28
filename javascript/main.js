$(document).ready(function() {
    if (screen.width <= 767) {
        var el = $('#main-navigation ul');
        var height = el.height();
        var visible = false;
        el.hide();

        $('#mobile-menu').bind('touchstart', function() {
            if (visible) {
                el.height(0).css('opacity', 0);
                window.setTimeout(function() { el.hide() }, 290);
                visible = false;
            }
            else {
                el.show().height(height).css('opacity', 1);
                visible = true;
            }
        });
    }
});
