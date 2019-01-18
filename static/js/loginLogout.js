$(function () {
    var cooks = document.cookie;
    if (cooks.match(/access_token=|current_user=/)) {
        var userEnc = cooks.replace(/.*?current_user=(.+?)(;|$).*/, "$1")
        var userDec = decodeURIComponent(userEnc);
        var user = JSON.parse(userDec);
        $('#login-logout').attr('href', "#");
        $('#login-logout').text('Logout ' + user.username);
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