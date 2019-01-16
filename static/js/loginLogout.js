$('body').append('<div class="modal fade" id="up-modal" tabindex="-1" role="dialog" aria-labelledby="up-title"> \
<div class="modal-dialog" role="document"> \
  <div class="modal-content"> \
    <div class="modal-header"> \
      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> \
      <h4 class="modal-title" id="up-title">Enter Credentials</h4> \
    </div> \
    <div class="modal-body"> \
      <form id="authForm"> \
        <div class="form-group"> \
          <label for="username" class="control-label">Username:</label> \
          <input type="text" class="form-control" id="username" name="username"> \
        </div> \
        <div class="form-group"> \
          <label for="password" class="control-label">Password:</label> \
          <input type="password" class="form-control" id="password" name="password"> \
        </div> \
        <input type="hidden" id="auth-type" name="auth-type" value=""> \
      </form> \
    </div> \
    <div class="modal-footer"> \
      <button type="button" class="btn btn-default" data-dismiss="modal" id="up-cancel">Cancel</button> \
      <button type="button" class="btn btn-primary" id="up-login">Login</button> \
    </div> \
  </div> \
</div> \
</div>');

var $login = '<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#up-modal" data-ltype="Local Login">Local Login</button> \
<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#up-modal" data-ltype="LDAP Login">LDAP Login</button>';
var $logout = '<button type="button" class="btn btn-primary" id="up-logout">Logout</button>';
$('.navbar > .container-fluid').append('<span id="up-buttons" class="pull-right" style="margin-top: 9px"></span>');
$(function () {
var cooks = document.cookie;
if (cooks.match(/access_token=|current_user=/)) {
  $('#up-buttons').html($logout);
} else {
  $('#up-buttons').html($login);
}
});
$('#up-modal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var type = button.data('ltype');
    var modal = $(this);
    modal.find('.modal-title').text(type);
    var authType = (type.match(/LDAP/i)) ? 'ldap' : 'local';
    modal.find('#auth-type').val(authType);
});
$('#up-cancel').click(function () {
    $("#username").val("");
    $("#password").val("");
});

$(document).on("click", "#up-login", function (e) {
    e.preventDefault();
    var authUrl = ($("#auth-type").val() == "ldap") ? "/verso/auth/ldap" : "/verso/api/Users/login";
    $.ajax ({
        url: authUrl,
        type: "POST",
        data: JSON.stringify({
            username: $("#username").val(),
            password: $("#password").val()
        }),
        contentType: "application/json; charset=utf-8",
        error: function(x) {
            alert(JSON.parse(x.responseText).error.message);
            // alert('Login failed');
            $("#username").val("");
            $("#password").val("");
        },
        success: function() {
            if (!document.cookie.match(/access_token=|current_user=/)) {
                alert('Login failed');
                $("#username").val("");
                $("#password").val("");
            } else {
                $("#up-modal").modal('hide');
                $("#username").val("");
                $("#password").val("");
                $('#up-buttons').html($logout);
            }
        },
    });
});

$(document).on("click", "#up-logout", function (e) {
    e.preventDefault();
    $.ajax ({
    url: "/verso/api/Users/logout",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    error: function() {
        alert('Logout failed');
    },
    success: function() {
        $('#up-buttons').html($login);
    },
    });
});