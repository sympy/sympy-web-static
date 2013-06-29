function makeTransition(elemId) {
    var elem = $(elemId + ' > .content');
    var visible = true;
    return (function() {
        if (!visible) {
            elem.addClass('clicked').slideDown();
            visible = true;
        }
        else {
            elem.removeClass('clicked').slideUp();
            visible = false;
        }
    });
}

$(document).ready(function(){
    $('.clickable_top').each(function(i, elem){
        var elem_id = $(elem).parents('div').first().attr('id');
        $(elem).click(makeTransition('#' + elem_id));
    });

    setTimeout(function() {
        if (window.location.hash) {
            $(window.location.hash).find('.clickable_top').click();
        }
    }, 1000);
});

function clear_searches(){
    var confirm_delete = confirm("Are you sure you want to clear your search history?");
    if (confirm_delete===true)
    {
        $.get((this.basePath || '') + '/delete',
              null,
              function(data) {
                  $('#saved_searches').html(data).delay(1000).fadeOut(500);
              });
    }
}
