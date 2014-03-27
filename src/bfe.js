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
    
    var editorconfig = {};
    var store = {};
    var profiles = [];
    var resourceTemplates = [];
    var startingPoints = [];
    
    exports.setConfig = function(config) {
        editorconfig = config;
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
        
        editorconfig.baseURI = "http://example.org/";
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

        this.setConfig(config);
        
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
        /*
            [
                {
                    guid,
                    s,
                    p,
                    o
                }
            
            ]
        */
        var resources = [];
        for (var rt=0; rt < rts.length; rt++) {
            var uuid = guid();
            var uri = editorconfig.baseURI + uuid;
            var rdftype = {}
            rdftype["@id"] = rts[rt].resourceURI;
            var resource = {};
            resource["@id"] = uri;
            resource["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] = [];
            resource["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"].push(rdftype);
            resources.push(resource);
        }
        $("#bfeditor-formdiv").html(JSON.stringify(resources));
    }
    
    /**
    * Generates a GUID string.
    * @returns {String} The generated GUID.
    * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
    * @author Slavik Meltser (slavik@meltser.info).
    * @link http://slavik.meltser.info/?p=142
    */
    function guid() {
        function _p8(s) {
            var p = (Math.random().toString(16)+"000000000").substr(2,8);
            return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
        }
        return _p8() + _p8(true) + _p8(true) + _p8();
    }

    
});