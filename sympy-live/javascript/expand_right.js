function makeTransition(elemId) {
    var elem = $(elemId + ' > .content');
    var visible = true;
    return (function() {
        if (!visible) {
            $(elemId).removeClass('closed');
            elem.addClass('clicked').slideDown();
            visible = true;
        }
        else {
            $(elemId).addClass('closed');
            elem.removeClass('clicked').slideUp();
            visible = false;
        }
    });
}

function makeExecutable(index, elem) {
    elem = $(elem);
    elem.attr('title', 'Click to execute in shell');
    elem.click(function() {
        $.each(utilities.extractStatements(elem), function(i, statement) {
            SymPy.SHELL_INSTANCE.queueStatement(statement);
        });
        SymPy.SHELL_INSTANCE.dequeueStatement();
        SymPy.SHELL_INSTANCE.evaluate();
    });
}

$(document).ready(function(){
    $('.clickable_top').each(function(i, elem){
        var elem_id = $(elem).parents('div').first().attr('id');
        $(elem).click(makeTransition('#' + elem_id));
    });

    $('.executable').each(makeExecutable);

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
