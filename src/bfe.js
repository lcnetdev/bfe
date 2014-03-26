/*
function bfe() {}

bfe.prototype.editor = function(id) {
    div = document.getElementById(id);
    div.innerHTML = "Hello there";
}

var bfe = new bfe();
*/

define(function(require, exports, module) {
    require("jquery");
    require("json");
    
    var profiles = [];
    var resourceTemplates = [];
    var startingPoints = [];
    
    exports.config = function(config) {
        var files = [];
        for (var i=0; i < config.profiles.length; i++) {
            files[i] = "json!static/profiles/" + config.profiles[i] + ".json";
            file = "static/profiles/" + config.profiles[i] + ".json";
            $.ajax({
                type: "GET",
                dataType: "json",
                async: false,
                url: file,
                success: function(data) {
                    profiles.push(data);
                    for (var rt=0; rt < data.Profile.resourceTemplates.length; rt++) {
                        resourceTemplates.push(data.Profile.resourceTemplates[rt]);
                    }
                }
            });
        }
        //require([files], function(){
        //    console.log(JSON.stringify(json));
        //    return {};
        //});

        //    var p = "json!static/profiles/" + config.profiles[i] + ".json";
            //profiles[i] = require([p]);
            //require([p], function(json){
            //    profiles[i] = json; 
            //    console.log(JSON.stringify(json));
            //    return {};
            //});
            //var p = "static/profiles/" + config.profiles[i] + ".json";
            //$.getJSON(p, function( data ) {
            //    profiles[i] = data; 
            //});
    }
    
    exports.editor = function (config, id) {

        this.config(config);
        
        div = document.getElementById(id);
        
        var menudiv = $('<div>', {id: "bfeditor-menudiv", class: "col-md-2 sidebar"});
        var menuul = $('<ul>', {id: "bfeditor-menuul", class: "nav nav-sidebar"});
        for (var i=0; i < config.startingPoints.length; i++) {
            var li = $('<li>');
            var a = $('<a>', {href: "#", id: "sp-" + i});
            a.html(config.startingPoints[i].label);
            $(a).click(function(){
                loadForm(this.id);
            });
            li = li.append(a);
            menuul.append(li);
            startingPoints[i] = config.startingPoints[i];
        }
        menudiv.append(menuul);
        
        var formdiv = $('<div>', {id: "bfeditor-formdiv", class: "col-md-8"});
        formdiv.html(JSON.stringify(profiles));
        
        var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});
        
        var rowdiv = $('<div>', {class: "row"});
        
        rowdiv.append(menudiv);
        rowdiv.append(formdiv);
        rowdiv.append(optiondiv);

        $(div).append(rowdiv);
        
        return {
            "profiles": profiles,
            "div": div
        };
    };
    
    function loadForm (spid) {
        spnum = parseInt(spid.replace('sp-', ''));
        sp = startingPoints[spnum];
        var rts = [];
        for (var urt=0; urt < sp.useResourceTemplates.length; urt++) {
            var urtid = sp.useResourceTemplates[urt];
            for (var rt=0; rt < resourceTemplates.length; rt++) {
                if (resourceTemplates[rt].id == urtid) {
                    rts.push(resourceTemplates[rt]);
                }
            }
        }
        $("#bfeditor-formdiv").html(JSON.stringify(rts));
    }

    
});