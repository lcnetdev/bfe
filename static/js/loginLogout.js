$(function () {
    var cooks = document.cookie;
    if (cooks.match(/access_token=|current_user=/)) {
    $('#login-logout').attr('href', "#");
    $('#login-logout').text('Logout');
    } else {
        $('#login-logout').text('Login')
    }
});

$(document).on("click", "#login-logout[href='#']", function (e) {
    e.preventDefault();
    $.ajax ({
        url: "/verso/api/Users/logout",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        error: function() {
            alert('Logout failed');
        },
        success: function() {
            $('#login-logout').text('Login');
            $('#login-logout').attr('href', "/login.html");
        }
    });
});