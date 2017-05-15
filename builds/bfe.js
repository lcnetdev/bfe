/* bfe 2015-10-26 *//* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Define a module along with a payload
 * @param module a name for the payload
 * @param payload a function to call with (require, exports, module) params
 */

(function() {

var ACE_NAMESPACE = "bfe";

var global = (function() {
    return this;
})();


if (!ACE_NAMESPACE && typeof requirejs !== "undefined")
    return;


var _define = function(module, deps, payload) {
    if (typeof module !== 'string') {
        if (_define.original)
            _define.original.apply(window, arguments);
        else {
            console.error('dropping module because define wasn\'t a string.');
            console.trace();
        }
        return;
    }

    if (arguments.length == 2)
        payload = deps;

    if (!_define.modules) {
        _define.modules = {};
        _define.payloads = {};
    }
    
    _define.payloads[module] = payload;
    _define.modules[module] = null;
};

/**
 * Get at functionality define()ed using the function above
 */
var _require = function(parentId, module, callback) {
    if (Object.prototype.toString.call(module) === "[object Array]") {
        var params = [];
        for (var i = 0, l = module.length; i < l; ++i) {
            var dep = lookup(parentId, module[i]);
            if (!dep && _require.original)
                return _require.original.apply(window, arguments);
            params.push(dep);
        }
        if (callback) {
            callback.apply(null, params);
        }
    }
    else if (typeof module === 'string') {
        var payload = lookup(parentId, module);
        if (!payload && _require.original)
            return _require.original.apply(window, arguments);

        if (callback) {
            callback();
        }

        return payload;
    }
    else {
        if (_require.original)
            return _require.original.apply(window, arguments);
    }
};

var normalizeModule = function(parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return normalizeModule(parentId, chunks[0]) + "!" + normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = base + "/" + moduleName;

        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            moduleName = moduleName.replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }

    return moduleName;
};

/**
 * Internal function to lookup moduleNames and resolve them by calling the
 * definition function if needed.
 */
var lookup = function(parentId, moduleName) {

    moduleName = normalizeModule(parentId, moduleName);

    var module = _define.modules[moduleName];
    if (!module) {
        module = _define.payloads[moduleName];
        if (typeof module === 'function') {
            var exports = {};
            var mod = {
                id: moduleName,
                uri: '',
                exports: exports,
                packaged: true
            };

            var req = function(module, callback) {
                return _require(moduleName, module, callback);
            };

            var returnValue = module(req, exports, mod);
            exports = returnValue || mod.exports;
            _define.modules[moduleName] = exports;
            delete _define.payloads[moduleName];
        }
        module = _define.modules[moduleName] = exports || module;
    }
    return module;
};

function exportAce(ns) {
    var require = function(module, callback) {
        return _require("", module, callback);
    };    

    var root = global;
    if (ns) {
        if (!global[ns])
            global[ns] = {};
        root = global[ns];
    }

    if (!root.define || !root.define.packaged) {
        _define.original = root.define;
        root.define = _define;
        root.define.packaged = true;
    }

    if (!root.require || !root.require.packaged) {
        _require.original = root.require;
        root.require = require;
        root.require.packaged = true;
    }
}

exportAce(ACE_NAMESPACE);

})();

bfe.define('src/bfe', ['require', 'exports', 'module' , 'src/lib/jquery-2.1.0.min', 'src/lib/json', 'src/lib/lodash.min', 'src/lib/bootstrap.min', 'src/lib/typeahead.jquery.min', 'src/bfestore', 'src/bfelogging', 'src/lookups/lcnames', 'src/lookups/lcsubjects', 'src/lookups/lcgenreforms', 'src/lookups/lcworks', 'src/lookups/lcinstances', 'src/lookups/lcorganizations', 'src/lookups/lccountries', 'src/lookups/lcgacs', 'src/lookups/lclanguages', 'src/lookups/lcidentifiers', 'src/lookups/lctargetaudiences', 'src/lookups/iso6391', 'src/lookups/iso6392', 'src/lookups/iso6395', 'src/lookups/rdacontenttypes', 'src/lookups/rdamediatypes', 'src/lookups/rdacarriers','src/lookups/rdamodeissue', 'src/lookups/lcrelators','src/lookups/lcperformanceMediums','src/lookups/rdamusnotation','src/lookups/rdaformatnotemus','src/lookups/rdaaspectratio', 'src/lookups/rdagenmopic', 'src/lib/aceconfig'], function(require, exports, module) {
    require("src/lib/jquery-2.1.0.min");
    require("src/lib/json");
    require("src/lib/lodash.min"); // collection/object/array manipulation
    require("src/lib/bootstrap.min"); // modals
    require("src/lib/typeahead.jquery.min");
    // require("lib/rdf_store_min");
    
    var editorconfig = {};
    var bfestore = require("src/bfestore");
    var bfelog = require("src/bfelogging");
    //var store = new rdfstore.Store();
    var profiles = [];
    var resourceTemplates = [];
    var startingPoints = [];
    var formTemplates = [];
    //var lookups = [];
    
    var tabIndices = 1;
    
    var loadtemplates = [];
    var loadtemplatesANDlookupsCount = 0;
    var loadtemplatesANDlookupsCounter = 0;
    
    var lookupstore = [];
    var lookupcache = [];
    
    var editordiv;
    
    var forms = [];

    var ms_ie = false;
    var ua = window.navigator.userAgent;
    var old_ie = ua.indexOf('MSIE ');
    var new_ie = ua.indexOf('Trident/');

    if ((old_ie > -1) || (new_ie > -1)) {
        ms_ie = true;
    }

    var lookups = {
        "http://id.loc.gov/authorities/names": {
            "name": "LCNAF",
            "load": require("src/lookups/lcnames")
        },
        "http://id.loc.gov/authorities/subjects": {
            "name": "LCSH",
            "load": require("src/lookups/lcsubjects")
        },
        "http://id.loc.gov/authorities/genreForms": {
            "name": "LCGFT",
            "load": require("src/lookups/lcgenreforms")
        },
        "http://id.loc.gov/resources/works": {
            "name": "LC-Works",
            "load": require("src/lookups/lcworks")
        },
        "http://id.loc.gov/resources/instances": {
            "name": "LC-Instances",
            "load": require("src/lookups/lcinstances")
        },
        "http://id.loc.gov/vocabulary/organizations": {
            "name": "Organizations",
            "load": require("src/lookups/lcorganizations")
        },
        "http://id.loc.gov/vocabulary/countries": {
            "name": "Countries",
            "load": require("src/lookups/lccountries")
        },
        "http://id.loc.gov/vocabulary/geographicAreas": {
            "name": "GeographicAreas",
            "load": require("src/lookups/lcgacs")
        },
        "http://id.loc.gov/vocabulary/languages": {
            "name": "Languages",
            "load": require("src/lookups/lclanguages")
        },
        "http://id.loc.gov/vocabulary/identifiers": {
            "name": "Identifiers",
            "load": require("src/lookups/lcidentifiers")
        },
        "http://id.loc.gov/vocabulary/targetAudiences": {
            "name": "Audiences",
            "load": require("src/lookups/lctargetaudiences")
        },
        "http://id.loc.gov/vocabulary/iso639-1": {
            "name": "ISO639-1",
            "load": require("src/lookups/iso6391")
        },
        "http://id.loc.gov/vocabulary/iso639-2": {
            "name": "ISO639-2",
            "load": require("src/lookups/iso6392")
        },
        "http://id.loc.gov/vocabulary/iso639-5": {
            "name": "ISO639-5",
            "load": require("src/lookups/iso6395")
        },
        "http://id.loc.gov/vocabulary/contentTypes": {
            "name": "RDA-Content-Types",
            "load": require("src/lookups/rdacontenttypes")
        },
        "http://id.loc.gov/vocabulary/mediaTypes": {
            "name": "RDA-Media-Types",
            "load": require("src/lookups/rdamediatypes")
        },
        "http://id.loc.gov/vocabulary/carriers": {
            "name": "RDA-Carriers",
            "load": require("src/lookups/rdacarriers")
        },
        "http://id.loc.gov/ml38281/vocabulary/rda/ModeIssue": {
            "name": "RDA-Mode-of-Issuance",
            "load": require("src/lookups/rdamodeissue")
        },
        "http://id.loc.gov/vocabulary/relators": {
            "name": "RDA-Relators",
            "load": require("src/lookups/lcrelators")
        },
        "http://id.loc.gov/authorities/performanceMediums": {
            "name": "Performance-Mediums",
            "load": require("src/lookups/lcperformanceMediums")
        },
        "http://id.loc.gov/ml38281/vocabulary/rda/MusNotation": {
            "name": "RDA-Form-Musical-Notation",
            "load": require("src/lookups/rdamusnotation")
        },
        "http://rdaregistry.info/termList/FormatNoteMus": {
            "name": "RDA-Format-Musical-Notation",
            "load": require("src/lookups/rdaformatnotemus")
        },
        "http://id.loc.gov/ml38281/vocabulary/rda/AspectRatio":{
            "name": "RDA-Aspect-Ratio",
            "load": require("src/lookups/rdaaspectratio")
        },
        "http://id.loc.gov/ml38281/vocabulary/rda/genMoPic":{
            "name": "RDA-Generation-of-Motion-Picture",
            "load": require("src/lookups/rdagenmopic")
        },
        "http://id.loc.gov/vocabulary/classSchemes":{
            "name": "Class-Schemes",
            "load": require("src/loookups/classschemes")
        }
    };
    
    /*
    The following two bits of code come from the Ace Editor code base.
    Included here to make 'building' work correctly.  See:
    https://github.com/ajaxorg/ace/blob/master/lib/ace/ace.js
    */
    exports.aceconfig = require("src/lib/aceconfig");
    /**
    * Provides access to require in packed noconflict mode
    * @param {String} moduleName
    * @returns {Object}
    *
    **/
    exports.require = require;
    
    exports.setConfig = function(config) {
                    
        editorconfig = config;
        
        // Set up logging
        bfelog.init(editorconfig);
        
        for (var i=0; i < config.profiles.length; i++) {
            file = config.profiles[i];
            bfelog.addMsg(new Error(), "INFO", "Loading profile: " + config.profiles[i]);
            $.ajax({
                type: "GET",
                dataType: "json",
                async: false,
                url: file,
                success: function(data) {
                    $("#bfeditor-loader").width($("#bfeditor-loader").width()+5+"%");
                    profiles.push(data);
                    for (var rt=0; rt < data.Profile.resourceTemplates.length; rt++) {
                        resourceTemplates.push(data.Profile.resourceTemplates[rt]);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) { 
                    bfelog.addMsg(new Error(), "ERROR", "FAILED to load profile: " + file);
                    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                }
            });
        }
        
        if (config.lookups !== undefined) {
            loadtemplatesANDlookupsCount = loadtemplatesANDlookupsCount + Object.keys(config.lookups).length;
            for (k in config.lookups) {
                var lu = config.lookups[k];
                bfelog.addMsg(new Error(), "INFO", "Loading lookup: " + lu.load);
                require([lu.load], function(r) {
                    setLookup(r);
                });
            }
        }
        if (editorconfig.baseURI === undefined) {
            editorconfig.baseURI = window.location.protocol + "//" + window.location.host + "/";
        }
        bfelog.addMsg(new Error(), "INFO", "baseURI is " + editorconfig.baseURI);
        
        if (config.load !== undefined) {
            loadtemplatesANDlookupsCount = loadtemplatesANDlookupsCount + config.load.length;
            config.load.forEach(function(l){
                var useguid = guid();
                var loadtemplate = {};
                var tempstore = [];
                loadtemplate.templateGUID = useguid;
                loadtemplate.resourceTemplateID = l.templateID;
                loadtemplate.resourceURI = l.defaulturi;
                loadtemplate.embedType = "page";
                loadtemplate.data = tempstore;
                loadtemplates.push(loadtemplate);
                if (l.source !== undefined && l.source.location !== undefined && l.source.requestType !== undefined) {
                    $.ajax({
                        url: l.source.location,
                        dataType: l.source.requestType,
                        success: function (data) {
                            bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + l.source.location);
                            bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
                            /*
                                OK, so I would /like/ to just use rdfstore here
                                but it is treating literals identified using @value
                                within JSON objects as resources.  It gives them blank nodes.
                                This does not seem right and I don't have time to
                                investigate.
                                So, will parse the JSONLD myself, dagnabbit. 
                                NOTE: it totally expects JSONLD expanded form.
                            */
                            tempstore = bfestore.jsonld2store(data);
                            tempstore.forEach(function(t){
                                if (t.p == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && t.otype == "uri" && t.s == l.defaulturi.replace('ml38281/', '')) {
                                    t.rtID = l.templateID;
                                }
                            });
                            loadtemplate.data = tempstore;
                            cbLoadTemplates();
                            /*
                            store.load('application/ld+json', data, function(success){
                                if (success) console.log("Loaded data for " + l.defaulturi);
                                var useguid = guid();
                                var loadtemplate = {};
                                var query = 'SELECT * WHERE { <' + l.defaulturi.replace('ml38281/', '') + '> ?p ?o}';
                                console.log("Query is " + query);
                                store.execute(query, function(success, results) {
                                    // process results
                                    if (success) {
                                        console.log(results);
                                        var tempstore = [];
                                        results.forEach(function(t){
                                            var tguid = guid();
                                            var triple = {};
                                            triple.guid = tguid;
                                            if (t.o.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                                                triple.rtID = rt.id;
                                            }
                                            triple.s = l.defaulturi.replace('ml38281/', '');
                                            triple.p = t.p.value;
                                            triple.o = t.o.value;
                                            if (t.o.token == "uri") {
                                                triple.otype = "uri";
                                            } else if (t.o.token == "blank") {
                                                triple.otype = "uri";
                                            } else {
                                                triple.otype = "literal";
                                                triple.olang = "en";
                                            }
                                            //console.log(triple);
                                            tempstore.push(triple);
                                        });
                                        loadtemplate.id = useguid;
                                        loadtemplate.rtID = l.templateID;
                                        loadtemplate.defaulturi = l.defaulturi.replace('ml38281/', '');
                                        loadtemplate.data = tempstore;
                                        loadtemplates.push(loadtemplate);
                                        console.log("finished query store");
                                        cbLoadTemplates();
                                    }
                                });
                            });
                            */
                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) { 
                            bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + l.source.location);
                            bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                        }
                    });
                } else {
                    cbLoadTemplates();
                }
            });
        }

    }
    
    exports.fulleditor = function (config, id) {
        
        editordiv = document.getElementById(id);

        var $menudiv = $('<div>', {id: "bfeditor-menudiv", class: "col-md-2 sidebar"});
        var $formdiv = $('<div>', {id: "bfeditor-formdiv", class: "col-md-10 main"});
        //var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});
        var $rowdiv = $('<div>', {class: "row"});
        
        var $loader = $('<div><br /><br /><h2>Loading...</h2><div class="progress progress-striped active">\
                        <div class="progress-bar progress-bar-info" id="bfeditor-loader" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 20%">\
                            <span class="sr-only">80% Complete</span>\
                        </div>\
                    </div>');
        $formdiv.append($loader);
        $menudiv.append("<h3>Create Resource</h3>");
        $rowdiv.append($menudiv);
        $formdiv.append("<h2>Dashboard</h2>", {class: "page-header"});
        $rowdiv.append($formdiv);
        //rowdiv.append(optiondiv);

        $(editordiv).append($rowdiv);
        
        this.setConfig(config);
        
        for (var h=0; h < config.startingPoints.length; h++) {
            var sp = config.startingPoints[h];
            var $menuul = $('<ul>', {class: "nav nav-sidebar"});
            var menuheadingul = null;
            if (typeof sp.menuGroup !== undefined && sp.menuGroup !== "") {
                $menuheading = $('<li><a class="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">' + sp.menuGroup + '<span class="caret"></span></a></li>');
                $menuheadingul = $('<ul class="dropdown-menu"></ul>');
                $menuheading.append($menuheadingul);
                $menuul.append($menuheading);
            }
            for (var i=0; i < sp.menuItems.length; i++) {
                var $li = $('<li>');
                var $a = $('<a>', {href: "#", id: "sp-" + h + "_" + i});
                $a.html(sp.menuItems[i].label);
                $a.click(function(){
                    menuSelect(this.id);
                });
                $li.append($a);
                if ( $menuheadingul !== null ) {
                    $menuheadingul.append($li);
                } else {
                    $menuul.append($li);
                }
            }
            $menudiv.append($menuul);
        }
    
        // Debug div
        if (editorconfig.logging !== undefined && editorconfig.logging.level !== undefined && editorconfig.logging.level == "DEBUG") {
            var $debugdiv = $('<div id="bfeditor-debugdiv" class="col-md-12 main panel-group">\
                         <div class="panel panel-default"><div class="panel-heading">\
                         <h3 class="panel-title"><a role="button" data-toggle="collapse" href="#debuginfo">Debug output</a></h3></div>\
                         <div class="panel-collapse collapse in" id="debuginfo"><div class="panel-body"><pre id="bfeditor-debug"></pre></div></div></div>\
                         </div>');
            $(editordiv).append($debugdiv);
            var $debugpre = $('#bfeditor-debug');
            $debugpre.html(JSON.stringify(profiles, undefined, " "));
        }
        
        var $footer = $('<footer>', {class: "footer"});
        $(editordiv).append($footer);
        
        if (loadtemplatesANDlookupsCount === 0) {
            // There was nothing to load, so we need to get rid of the loader.
            $formdiv.html("");
        }

        return {
            "profiles": profiles,
            "div": editordiv,
            "bfestore": bfestore,
            "bfelog": bfelog,
        };
    };
    
    exports.editor = function (config, id) {
        
        this.setConfig(config);
        
        editordiv = document.getElementById(id);
        
        var $formdiv = $('<div>', {id: "bfeditor-formdiv", class: "col-md-12"});
        
        //var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});
        
        var $rowdiv = $('<div>', {class: "row"});
        
        $rowdiv.append($formdiv);
        //rowdiv.append(optiondiv);

        $(editordiv).append($rowdiv);
    
        // Debug div
        if (editorconfig.logging !== undefined && editorconfig.logging.level !== undefined && editorconfig.logging.level == "DEBUG") {
            var $debugdiv = $('<div>', {class: "col-md-12"});
            $debugdiv.html("Debug output");
            var $debugpre = $('<pre>', {id: "bfeditor-debug"});
            $debugdiv.append($debugpre);
            $(editordiv).append($debugdiv);
            $debugpre.html(JSON.stringify(profiles, undefined, " "));
        }
        
        var $footer = $('<div>', {class: "col-md-12"});
        $(editordiv).append($footer);

        return {
            "profiles": profiles,
            "div": editordiv,
            "bfestore": bfestore,
            "bfelog": bfelog,
        };
    };
    
    function setLookup(r) {
        if (r.scheme !== undefined) {
            bfelog.addMsg(new Error(), "INFO", "Setting up scheme " + r.scheme);
            var lu = config.lookups[r.scheme];
            lookups[r.scheme] = {};
            lookups[r.scheme].name = lu.name;
            lookups[r.scheme].load = r;
        } else {
            bfelog.addMsg(new Error(), "WARN", "Loading lookup FAILED", r);
        }
        cbLoadTemplates();
    }
    

    // using jQuery
    function getCookie(name) {
        
        $.get("/api/");

        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        
        return cookieValue;
    }   
    
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function cbLoadTemplates() {
        $("#bfeditor-loader").width($("#bfeditor-loader").width()+5+"%");
        loadtemplatesANDlookupsCounter++;
        if (loadtemplatesANDlookupsCounter >= loadtemplatesANDlookupsCount) {
            $("#bfeditor-formdiv").html("");
            if (loadtemplates.length > 0) {
                bfelog.addMsg(new Error(), "DEBUG", "Loading selected template(s)", loadtemplates);
                var form = getForm(loadtemplates);
                $( ".typeahead", form.form ).each(function() {
                    setTypeahead(this);
                });
                var $exitButtonGroup = $('<div class="btn-group pull-right"> \
                    <button id="bfeditor-exitcancel" type="button" class="btn btn-default">Cancel</button> \
                    <button id="bfeditor-exitpreview" type="button" class="btn btn-primary">Preview</button> \
                </div>');
                form.form.append($exitButtonGroup);
                
                $("#bfeditor-exitcancel", form.form).click(function(){
                    $("#bfeditor > .row").remove();
                    $("#bfeditor > .footer").remove();
                    bfeditor = bfe.fulleditor(config, "bfeditor");
                    //cbLoadTemplates();
                });
                $("#bfeditor-exitcancel", form.form).attr("tabindex", tabIndices++);
                
                $("#bfeditor-exitpreview", form.form).click(function(){
                     var humanized = bfeditor.bfestore.store2text();
                     //var n3 = bfeditor.bfestore.store2n3();
                     var jsonld = bfeditor.bfestore.store2jsonldExpanded();
                     document.body.scrollTop = document.documentElement.scrollTop = 0;
                     var $saveButtonGroup = $('<div class="btn-group" id="save-btn"> \
                         <button id="bfeditor-exitback" type="button" class="btn btn-default">Back</button> \
                         <button id="bfeditor-exitsave" type="button" class="btn btn-primary">Save</button> \
                         </div>');

                     var $bfeditor = $('#bfeditor > .row');
                     var $preview = $('<div id="bfeditor-preview" class="col-md-10 main panel-group">\
                         <div class="panel panel-default"><div class="panel-heading">\
                         <h3 class="panel-title"><a role="button" data-toggle="collapse" href="#humanized">Preview</a></h3></div>\
                         <div class="panel-collapse collapse in" id="humanized"><div class="panel-body"><pre>' + humanized + '</pre></div></div>\
                         <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#jsonld">JSONLD-Expanded</a></h3></div>\
                         <div class="panel-collapse collapse in" id="jsonld"><div class="panel-body"><pre>' + JSON.stringify(jsonld, undefined, " ") + '</pre></div></div></div>\
                         </div>');

                     $bfeditor.append($saveButtonGroup);

                     $("#bfeditor-exitback").click(function(){
                        $('#save-btn').remove();
                        $('#bfeditor-preview').remove();
                        $('#bfeditor-formdiv').show();
                     });

                     $("#bfeditor-exitsave").click(function(){

                        if (editorconfig.save.callback !== undefined) {
                            editorconfig.save.callback(bfestore.store2jsonldExpanded(),getCookie('csrftoken') );
                        } else {
                            //save disabled
                           $("#bfeditor > .row").remove();
                           $("#bfeditor > .footer").remove();
                           $("#bfeditor-debugdiv").remove();
                           bfeditor = bfe.fulleditor(config, "bfeditor");
                           var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
                           $messagediv.append('<span class="str"><h3>Save disabled</h3></span>');
                           $('#bfeditor-formdiv').append($messagediv);
                        }
                    });


                $('#bfeditor-formdiv').hide();
                $bfeditor.append($preview);

                });
                $("#bfeditor-exitpreview", form.form).attr("tabindex", tabIndices++);
                
                $("#bfeditor-formdiv").html("");
                $("#bfeditor-formdiv").append(form.form);
                $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
                $("#bfeditor-debug").html(JSON.stringify(bfelog.getLog(), undefined, " "));
            }
        }
    }
    
    function menuSelect (spid) {
        //store = new rdfstore.Store();
        spnums = spid.replace('sp-', '').split("_");
        spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
        
        bfestore.store = [];
        loadtemplatesCounter = 0;
        loadtemplatesCount = spoints.useResourceTemplates.length;
        loadtemplates = [];

        spoints.useResourceTemplates.forEach(function(l){
            var useguid = guid();
            var loadtemplate = {};
            var tempstore = [];
            loadtemplate.templateGUID = useguid;
            loadtemplate.resourceTemplateID = l;
            //loadtemplate.resourceURI = whichrt(loadtemplate, editorconfig.baseURI) + loadTemplate.templateGUID;//editorconfig.baseURI + useguid;
            loadtemplate.embedType = "page";
            loadtemplate.data = tempstore;
            loadtemplates.push(loadtemplate);
            //cbLoadTemplates();
        });
        cbLoadTemplates();
    }
    
    /*
    loadTemplates is an array of objects, each with this structure:
        {
            templateguid=guid,
            resourceTemplateID=resourceTemplateID,
            resourceuri="",
            embedType=modal|page
            data=bfestore
        }
    */
    function getForm (loadTemplates) {
        
        var rt;
        var property;
        
        // Create the form object.
        var fguid = guid();
        var fobject = {};
        fobject.id = fguid;
        fobject.store = [];
        fobject.resourceTemplates = [];
        fobject.resourceTemplateIDs = [];
        fobject.formTemplates = [];
        
        // Load up the requested templates, add seed data.
        for (var urt=0; urt < loadTemplates.length; urt++) {
            //console.log(loadTemplates[urt]);
            var rt = _.where(resourceTemplates, {"id": loadTemplates[urt].resourceTemplateID})
            if ( rt !== undefined && rt[0] !== undefined) {
                fobject.resourceTemplates[urt] = JSON.parse(JSON.stringify(rt[0]));
                //console.log(loadTemplates[urt].data);
                fobject.resourceTemplates[urt].data = loadTemplates[urt].data;
                fobject.resourceTemplates[urt].defaulturi = loadTemplates[urt].resourceURI;
                fobject.resourceTemplates[urt].useguid = loadTemplates[urt].templateGUID;
                fobject.resourceTemplates[urt].embedType = loadTemplates[urt].embedType;
                // We need to make sure this resourceTemplate has a defaulturi
                if (fobject.resourceTemplates[urt].defaulturi === undefined) {
                    fobject.resourceTemplates[urt].defaulturi = whichrt(fobject.resourceTemplates[urt], editorconfig.baseURI) + loadTemplates[urt].templateGUID;
                } else {
                    //fobject.resourceTemplates[urt].defaulturi = whichrt(fobject.resourceTemplates[urt], editorconfig.baseURI) + loadTemplates[urt].templateGUID;
                }
                
                fobject.resourceTemplateIDs[urt] = rt[0].id;
            } else {
                bfelog.addMsg(new Error(), "WARN", "Unable to locate resourceTemplate. Verify the resourceTemplate ID is correct.");
            }
        }

        // Let's create the form
        var form = $('<form>', {id: "bfeditor-form-" + fobject.id, class: "form-horizontal", role: "form"});
        var forEachFirst = true;
        fobject.resourceTemplates.forEach(function(rt) {
            bfelog.addMsg(new Error(), "DEBUG", "Creating form for: " + rt.id, rt);
            var $resourcediv = $('<div>', {id: rt.useguid, "data-uri": rt.defaulturi}); // is data-uri used?
            var $resourcedivheading = $('<h3>' + rt.resourceLabel + '</h3>');
            $resourcediv.append($resourcedivheading);
            rt.propertyTemplates.forEach(function(property) {
                
                // Each property needs to be uniquely identified, separate from
                // the resourceTemplate.
                var pguid = guid();
                property.guid = pguid;
                property.display = "true";
                
                var $formgroup = $('<div>', {class: "form-group row"});
                var $saves = $('<div class="form-group row"><div class="btn-toolbar col-sm-12" role="toolbar"></div></div></div>');
                if ((/^http/).test(property.remark))
                    var $label = $('<label for="' + property.guid + '" class="col-sm-3 control-label" title="'+ property.remark + '"><a href="'+property.remark +'" target="_blank">' + property.propertyLabel + '</a></label>');
                else
                    var $label = $('<label for="' + property.guid + '" class="col-sm-3 control-label" title="'+ property.remark + '">' + property.propertyLabel +'</label>');

                
                if (property.type == "literal") {
                    
                    var $input = $('<div class="col-sm-8"><input type="text" class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');
        
                    $input.find("input").keyup(function(e) {
                        if (e.keyCode == 54 && e.ctrlKey && e.altKey){
                            var text = this.value;
                            this.value = text+"\u00A9";
                        } else if (e.keyCode == 53 && e.ctrlKey && e.altKey){
                            this.value = this.value + "\u2117";
                        }
                    });

                    $button = $('<div class="btn-group btn-group-md span1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">&#10133;</button></div>');

                    $button.click(function(){
                        setLiteral(fobject.id, rt.useguid, property.guid);                        
                    });
                    
                    var enterHandler = function(event){
                        if(event.keyCode == 13){
                            setLiteral(fobject.id, rt.useguid, property.guid);
                            if($("#"+property.guid).parent().parent().next().find("input:not('.tt-hint')").length){                                
                                $("#"+property.guid).parent().parent().next().find("input:not('.tt-hint')").focus();
                            } else {
                                $("[id^=bfeditor-modalSave]").focus();
                            }
                        }
                    };

                    $input.keyup(enterHandler);


                    $formgroup.append($label);
                    $input.append($saves);
                    $formgroup.append($input);
                    $formgroup.append($button);
                    //$formgroup.append($saves);
                }
                
                if (property.type == "resource") {
                    
                    if (_.has(property, "valueConstraint")) {
                        if (_.has(property.valueConstraint, "valueTemplateRefs") && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
                            /*
                            *  The below gives you a form like Z produced.   Keep for time being.
                            */
                            /*
                            button = $('<div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button></div>');
                            ul = $('<ul class="dropdown-menu" role="menu"></ul>');
                            vtRefs = property.valueConstraint.valueTemplateRefs;
                            for ( var v=0; v < vtRefs.length; v++) {
                                var vtrs = vtRefs[v];
                                valueTemplates = _.where(resourceTemplates, {"id": vtrs});
                                if (valueTemplates[0] !== undefined) {
                                    li = $('<li></li>');
                                    a = $('<a href="#">' + valueTemplates[0].resourceLabel + '</a>');
                                    $(a).click(function(){
                                        openModal(rt.guid, property.guid, valueTemplates[0]);
                                    });
                                    li.append(a);
                                    ul.append(li);
                                }
                            }
                            button.append(ul);
                            */
                            $buttondiv = $('<div class="col-sm-8" id="' + property.guid +'"></div>');
                            $buttongrp = $('<div class="btn-group btn-group-md"></div>');
                            var vtRefs = property.valueConstraint.valueTemplateRefs;
                            for ( var v=0; v < vtRefs.length; v++) {
                                var vtrs = vtRefs[v];
                                var valueTemplates = _.where(resourceTemplates, {"id": vtrs});
                                if (valueTemplates[0] !== undefined) {
                                    var vt = valueTemplates[0];
                                    //console.log(vt);
                                    var $b = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">' + vt.resourceLabel + '</button>');
                                    
                                    var fid = fobject.id;
                                    var rtid = rt.useguid;
                                    var pid = property.guid;
                                    //var newResourceURI = editorconfig.baseURI + guid();
                                    var newResourceURI = "_:bnode" + guid();
                                    $b.click({fobjectid: fid, newResourceURI: newResourceURI, propertyguid: pid, template: vt}, function(event){
                                        //console.log(event.data.template);
                                        var theNewResourceURI = "_:bnode" + guid();
                                        openModal(event.data.fobjectid, event.data.template, theNewResourceURI/*event.data.newResourceURI*/, event.data.propertyguid, []);
                                    });
                                    $buttongrp.append($b);
                                }
                            }
                            $buttondiv.append($buttongrp);
                            
                            $formgroup.append($label);
                            $buttondiv.append($saves);
                            $formgroup.append($buttondiv);
                            //$formgroup.append($saves);
                        } else if (_.has(property.valueConstraint, "useValuesFrom")) {
                            
                            // Let's supress the lookup unless it is in a modal for now.
                            if (rt.embedType != "modal" && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                                forEachFirst = false;
                                return;
                            }
                                
                            var $inputdiv = $('<div class="col-sm-8"></div>');
                            var $input = $('<input type="text" class="typeahead form-control" data-propertyguid="' + property.guid + '" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '">');
                            var $input_page = $('<input type="hidden" id="'+property.guid+'_page" class="typeaheadpage" value="1">')
                                
                            $inputdiv.append($input);
                            $inputdiv.append($input_page);


                            $input.on( 'focus', function() {
                            if($(this).val() === '') // you can also check for minLength
                                $(this).data().ttTypeahead.input.trigger('queryChanged', '');
                            });

                            $formgroup.append($label);
                            $inputdiv.append($saves);
                            $formgroup.append($inputdiv);
                            //formgroup.append(button);
                            //$formgroup.append($saves);
                            
                            
                            /*
                            // If the first conditional is active, is this even necessary?
                            if (rt.embedType == "modal" && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                                // This is the first propertty *and* it is a look up.
                                // Let's treat it special-like.
                                var $saveLookup = $('<div class="modal-header" style="text-align: right;"><button type="button" class="btn btn-primary" id="bfeditor-modalSaveLookup-' + fobject.id + '" tabindex="' + tabIndices++ + '">Save changes</button></div>');
                                var $spacer = $('<div class="modal-header" style="text-align: center;"><h2>OR</h2></div>');
                                $formgroup.append($saveLookup);
                                $formgroup.append($spacer);
                            } else {
                                // let's suppress it
                                $input.prop("disabled", true);
                            }
                            */
                            
                            if (rt.embedType == "modal" && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                                // This is the first propertty *and* it is a look up.
                                // Let's treat it special-like.
                                var $saveLookup = $('<div class="modal-header" style="text-align: right;"><button type="button" class="btn btn-primary" id="bfeditor-modalSaveLookup-' + fobject.id + '" tabindex="' + tabIndices++ + '">Save changes</button></div>');
                                var $spacer = $('<div class="modal-header" style="text-align: center;"><h2>OR</h2></div>');
                                $formgroup.append($saveLookup);
                                $formgroup.append($spacer);
                            }
                        
                            
                        } else {
                            // Type is resource, so should be a URI, but there is
                            // no "value template reference" or "use values from vocabularies" 
                            // reference for it so just create label field
                            var $input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');
                    
                            $button = $('<div class="col-sm-1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button></div>');
                            $button.click(function(){
                                setResourceFromLabel(fobject.id, rt.useguid, property.guid);
                            });
                            
                            $formgroup.append($label);
                            $input.append($saves);
                            $formgroup.append($input);
                            $formgroup.append($button);
                            //$formgroup.append($saves);
                    
                        }
                    } else {
                        // Type is resource, so should be a URI, but there is
                        // no constraint for it so just create a label field.
                        var $input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');
                    
                        $button = $('<div class="col-sm-1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button></div>');
                            $button.click(function(){
                                setResourceFromLabel(fobject.id, rt.useguid, property.guid);
                        });
                            
                        $formgroup.append($label);
                        $input.append($saves);
                        $formgroup.append($input);
                        $formgroup.append($button);
                        //$formgroup.append($saves);
                    }
                }
                
                $resourcediv.append($formgroup);
                forEachFirst = false;
            });
            form.append($resourcediv);
        });


        // OK now we need to populate the form with data, if appropriate.
        fobject.resourceTemplates.forEach(function(rt) {
            if (rt.data.length === 0) {
                // Assume a fresh form, no pre-loaded data.
                var id = guid();
                var uri;
                //var uri = editorconfig.baseURI + rt.useguid;
                if (rt.defaulturi !== undefined && rt.defaulturi !== "") {
                    uri = rt.defaulturi;
                } else {
                    uri = editorconfig.baseURI + rt.useguid;
                }
                var triple = {}
                triple.guid = rt.useguid;
                triple.rtID = rt.id;
                triple.s = uri;
                triple.p = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
                triple.o = rt.resourceURI;
                triple.otype = "uri";
                fobject.store.push(triple);
                bfestore.store.push(triple);
                rt.guid = rt.useguid;
                
                rt.propertyTemplates.forEach(function(property) {
                    if (_.has(property, "valueConstraint")) {
                        if (_.has(property.valueConstraint, "valueTemplateRefs") && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
                            var vtRefs = property.valueConstraint.valueTemplateRefs;
                            for ( var v=0; v < vtRefs.length; v++) {
                                var vtrs = vtRefs[v];
                                //console.log(rt.resourceURI);
                                //console.log(property.propertyURI);
                                //console.log(vtrs);
                                /*
                                    The following will be true, for example, when two 
                                    profiles are to be rendered in one form.  Say that 
                                    this "property" is "instanceOf" and this "rt" is 
                                    an Instance (e.g. "rt:Instance:ElectronicBook").  
                                    Also a Work (e.g. "rt:Work:EricBook") is to be displayed.
                                    This litle piece of code associates the Instance
                                    with the Work in the store.
                                    Question: if the store is pre-loaded with data,
                                    how do we dedup at this time?
                                */
                                if ( fobject.resourceTemplateIDs.indexOf(vtrs) > -1 && vtrs != rt.id ) {
                                    var relatedTemplates = _.where(bfestore.store, {rtID: vtrs});
                                    triple = {}
                                    triple.guid = guid();
                                    triple.s = uri;
                                    triple.p = property.propertyURI;
                                    triple.o = relatedTemplates[0].s;
                                    triple.otype = "uri";
                                    fobject.store.push(triple);
                                    bfestore.store.push(triple);
                                    property.display = "false";
                                }
                            }
                        }
                    }
                });                
            } else {
                // This will likely be insufficient - we'll need the entire 
                // pre-loaded store in this 'first' form.
                rt.data.forEach(function(t) {
                    var triple = {}
                    triple = t;
                    if ( triple.guid === undefined ) {
                        triple.guid = guid();
                    }
                    fobject.store.push(triple);
                });
            }
            
            // Populate form with pre-loaded data.
            bfelog.addMsg(new Error(), "DEBUG", "Populating form with pre-loaded data, if any");
            rt.propertyTemplates.forEach(function(property) {
                var propsdata = _.where(bfestore.store, {"s": rt.defaulturi, "p": property.propertyURI});
                if (propsdata[0] !== undefined) {
                    // If this property exists for this resource in the pre-loaded data
                    // then we need to make it appear.
                    bfelog.addMsg(new Error(), "DEBUG", "Found pre-loaded data for " + property.propertyURI);
                    propsdata.forEach(function(pd) {
                        var $formgroup = $("#" + property.guid, form).closest(".form-group");
                        var $save = $formgroup.find(".btn-toolbar").eq(0);
                        //console.log(formgroup);
                        var displaydata = "";
                        var triples = [];
                        //console.log("pd.otype is " + pd.otype);
                        if (pd.otype == "uri") {
                            var triples = _.where(bfestore.store, {"s": pd.o});
                            displaydata = pd.o;
                            //console.log("displaydata is " + displaydata);
                            var rtype = "";
                            if (triples.length > 0) {
                                triples.forEach(function(t) {
                                    if ( rtype == "" && t.p == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                                        rtype = t.o;
                                    }
                                    // if "type" matches a resourceTemplate.resourceURI && one of the property.valueConstraint.templates equals that resource template id....
                                    var triplesResourceTemplateID = "";
                                    if ( rtype != "" ) {
                                        if (_.has(property, "valueConstraint")) {
                                            if (_.has(property.valueConstraint, "valueTemplateRefs") && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
                                                var resourceTs = _.where(resourceTemplates, {"resourceURI": rtype });
                                                //console.log("Found resourcetemplates for " + rtype);
                                                //console.log(resourceTs);
                                                resourceTs.forEach(function(r) {
                                                    //console.log("Looking for a match with " + r.id);
                                                    if (triplesResourceTemplateID == "" && _.indexOf(property.valueConstraint.valueTemplateRefs, r.id) !== -1) {
                                                        bfelog.addMsg(new Error(), "DEBUG", "Assocating one resource with another from loaded templates");
                                                        //console.log("Found a match in");
                                                        //console.log(property.valueConstraint.valueTemplateRefs);
                                                        //console.log("Associating " + r.id);
                                                        triplesResourceTemplateID = r.id;
                                                        t.rtID = r.id;
                                                    }
                                                });
                                            }
                                        }
                                    }
                                    fobject.store.push(t);
                                    if (t.p.match(/label|authorizedAccessPoint/i)) {
                                        displaydata = t.o;
                                    }
                                });
                            }
                        } else {
                            displaydata = pd.o;
                        }
                        if (displaydata == "") {
                            displaydata = pd.s;
                        }
                        triples.push(pd);

                        var bgvars = { 
                            "tguid": pd.guid, 
                            "tlabelhover": displaydata,
                            "tlabel": displaydata,
                            "fobjectid": fobject.id,
                            "inputid": property.guid,
                            "triples": triples
                        };
                        var $buttongroup = editDeleteButtonGroup(bgvars);
                        
                        $save.append($buttongroup);
                        if (property.valueConstraint !== undefined && property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                            var $el = $("#" + property.guid, form);
                            if ($el.is("input")) {
                                $el.prop("disabled", true);
                            } else {
                                //console.log(property.propertyLabel);
                                var $buttons = $("div.btn-group", $el).find("button");
                                $buttons.each(function() {
                                    $( this ).prop("disabled", true);
                                });
                            }
                        }
                    });
                
                } else if (_.has(property, "valueConstraint")) {
                    // Otherwise - if the property is not found in the pre-loaded data
                    // then do we have a default value?
                    if (_.has(property.valueConstraint, "defaultURI") && !_.isEmpty(property.valueConstraint.defaultURI)) {
                        bfelog.addMsg(new Error(), "DEBUG", "Setting default data for " + property.propertyURI);
                        var data = property.valueConstraint.defaultURI;
                        // set the triples
                        var triple = {}
                        triple.guid = guid();
                        if (rt.defaulturi !== undefined && rt.defaulturi !== "") {
                            triple.s = rt.defaulturi;
                        } else {
                            triple.s = editorconfig.baseURI + rt.useguid;
                        }
                        triple.p = property.propertyURI;
                        triple.o = data;
                        triple.otype = "uri";
                        fobject.store.push(triple);
                        bfestore.store.push(triple);
                        
                        //set the label
                        var label = {}
                        label.s = triple.o //http://id.loc.gov/vocabulary/mediaTypes/n
                        label.otype = "literal";
                        label.p = "http://bibframe.org/vocab/label";
                        label.o =  property.valueConstraint.defaultLiteral
                        
                        fobject.store.push(label);
                        bfestore.store.push(label);

                        // set the form
                        var $formgroup = $("#" + property.guid, form).closest(".form-group");
                        var $save = $formgroup.find(".btn-toolbar").eq(0);
                        
                        var display = "";
                        if (_.has(property.valueConstraint, "defaultLiteral")) {
                            display = property.valueConstraint.defaultLiteral;
                        }
                        displaydata = display;
                        var editable = true;
                        if (property.valueConstraint.editable !== undefined && property.valueConstraint.editable === "false") {
                            editable = false;
                        }
                        var bgvars = {
                            "tguid": triple.guid , 
                            "tlabelhover": displaydata,
                            "tlabel": displaydata,
                            "fobjectid": fobject.id,
                            "inputid": property.guid,
                            "editable": editable,
                            "triples": [label]
                        };
                        var $buttongroup = editDeleteButtonGroup(bgvars);
                        $save.append($buttongroup);
                        
                        if (property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                            var $el = $("#" + property.guid, form);
                            if ($el.is("input")) {
                                $el.prop("disabled", true);
                            } else {
                                //console.log(property.propertyLabel);
                                var $buttons = $("div.btn-group", $el).find("button");
                                $buttons.each(function() {
                                    $( this ).prop("disabled", true);
                                });
                            }
                        }
                        
                    } else if(_.has(property.valueConstraint, "defaultLiteral") && _.isEmpty(property.valueConstraint.defaultURI)) {

                        bfelog.addMsg(new Error(), "DEBUG", "Setting default data for " + property.propertyURI);
                        var data = property.valueConstraint.defaultLiteral;
                        // set the triples
                        var triple = {}
                        triple.guid = guid();
                        triple.s = rt.defaulturi;
                        triple.p = property.propertyURI;
                        triple.o = data;
                        triple.otype = "literal";
                        fobject.store.push(triple);
                        bfestore.store.push(triple);
                        
                        //set the label
                        var label = {}
                        label.s = triple.s //http://id.loc.gov/vocabulary/mediaTypes/n
                        label.otype = "literal";
                        label.p = triple.p;
                        label.o =  data;
                        
                        fobject.store.push(label);
                        bfestore.store.push(label);

                        // set the form
                        var $formgroup = $("#" + property.guid, form).closest(".form-group");
                        var $save = $formgroup.find(".btn-toolbar").eq(0);
                        
                        displaydata = data;
                        var editable = true;
                        if (property.valueConstraint.editable !== undefined && property.valueConstraint.editable === "false") {
                            editable = false;
                        }
                        var bgvars = {
                            "tguid": triple.guid , 
                            "tlabelhover": displaydata,
                            "tlabel": displaydata,
                            "fobjectid": fobject.id,
                            "inputid": property.guid,
                            "editable": editable,
                            "triples": [label]
                        };
                        var $buttongroup = editDeleteButtonGroup(bgvars);
                        $save.append($buttongroup);
                        
                        if (property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                            var $el = $("#" + property.guid, form);
                            if ($el.is("input")) {
                                $el.prop("disabled", true);
                            } else {
                                //console.log(property.propertyLabel);
                                var $buttons = $("div.btn-group", $el).find("button");
                                $buttons.each(function() {
                                    $( this ).prop("disabled", true);
                                });
                            }
                        }

                    }
                }
            });
        });

        forms.push(fobject);

        bfelog.addMsg(new Error(), "DEBUG", "Newly created formobject.", fobject);
        return { formobject: fobject, form: form };
    }
    
    // callingformobjectid is as described
    // loadtemplate is the template objet to load.
    // resourceURI is the resourceURI to assign or to edit
    // inputID is the ID of hte DOM element within the loadtemplate form
    // triples is the base data.
    function openModal(callingformobjectid, loadtemplate, resourceURI, inputID, triples) {
        
        // Modals
        var modal = '<div class="modal fade" id="bfeditor-modal-modalID" tabindex="' + tabIndices++ + '" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"> \
            <div class="modal-dialog"> \
                <div class="modal-content"> \
                    <div class="modal-header"> \
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                        <h4 class="modal-title" id="bfeditor-modaltitle-modalID">Modal title</h4> \
                    </div> \
                    <div class="modal-body" id="bfeditor-modalbody-modalID"></div> \
                    <div class="modal-footer"> \
                        <button type="button" class="btn btn-default" id="bfeditor-modalCancel-modalID" data-dismiss="modal">Cancel</button> \
                        <button type="button" class="btn btn-primary" id="bfeditor-modalSave-modalID">Save changes</button> \
                    </div> \
                </div> \
            </div> \
        </div> '
        
        bfelog.addMsg(new Error(), "DEBUG", "Opening modal for resourceURI " + resourceURI);
        bfelog.addMsg(new Error(), "DEBUG", "inputID of DOM element / property when opening modal: " + inputID);
        bfelog.addMsg(new Error(), "DEBUG", "callingformobjectid when opening modal: " + callingformobjectid);
        
        var useguid = guid();
        var triplespassed = [];
        if (triples.length === 0) {
            // This is a fresh Modal, so we need to seed the data.
            // This happens when one is *not* editing data; it is fresh.
            var callingformobject = _.where(forms, {"id": callingformobjectid});
            callingformobject = callingformobject[0];
            callingformobject.resourceTemplates.forEach(function(t) {
                var properties = _.where(t.propertyTemplates, {"guid": inputID})
                if ( properties[0] !== undefined ) {
                    var triplepassed = {};
                    triplepassed.s = t.defaulturi;
                    triplepassed.p = properties[0].propertyURI; //instanceOF
                    triplepassed.o = resourceURI;
                    triplepassed.otype = "uri";
                    triplespassed.push(triplepassed);
                    
                    triplepassed = {};
                    triplepassed.s = resourceURI;
                    triplepassed.rtID = loadtemplate.id;
                    triplepassed.p = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"; //rdf:type
                    triplepassed.o = loadtemplate.resourceURI;
                    triplepassed.otype = "uri";
                    triplespassed.push(triplepassed);
                }
            });
        } else {
            // Just pass the triples on....
            triplespassed = triples;
        }
        bfelog.addMsg(new Error(), "DEBUG", "triplespassed within modal", triplespassed);
        var form = getForm([{
            templateGUID: useguid,
            resourceTemplateID: loadtemplate.id,
            resourceURI: resourceURI,
            embedType: "modal",
            data: triplespassed
        }]);
        
        var m = modal.replace(/modalID/g, form.formobject.id);
        m = $(m);
        $(editordiv).append(m);

        $('#bfeditor-modalbody-' + form.formobject.id).append(form.form);
        $('#bfeditor-modaltitle-' + form.formobject.id).html(loadtemplate.resourceLabel);
            
        $('#bfeditor-modal-' + form.formobject.id).modal('show');
        $('#bfeditor-modalCancel-' + form.formobject.id).attr("tabindex", tabIndices++);
            
        $('#bfeditor-modalSave-' + form.formobject.id).click(function(){
            triples.forEach(function(triple) {
                removeTriple(callingformobjectid, inputID, null, triple);
            });
            if (form.formobject.store.length <= 2){
                $('#bfeditor-modalSave-' + form.formobject.id).off('click');
                $('#bfeditor-modal-' + form.formobject.id).modal('hide');
            } else {
                setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, inputID, form.formobject.store);
            }
        });
        $('#bfeditor-modalSave-' + form.formobject.id).attr("tabindex", tabIndices++);
        $('#bfeditor-modalSaveLookup-' + form.formobject.id).click(function(){
            triples.forEach(function(triple) {
                removeTriple(callingformobjectid, inputID, null, triple);
            });
            setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, inputID, form.formobject.store);
        });
        $('#bfeditor-modal-' + form.formobject.id).on("hide.bs.modal", function(e) {
            $(this).empty();
        });
        
        $( ".typeahead", form.form ).each(function() {
            setTypeahead(this);
        });
                    
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));

        $('#bfeditor-modal-' + form.formobject.id).on('shown.bs.modal', function () {
            $("#bfeditor-form-" + form.formobject.id + " input:not('.tt-hint'):first").focus()
        })
    }
   
    function setResourceFromModal(formobjectID, modalformid, resourceID, propertyguid, data) {
        /*
        console.log("Setting resource from modal");
        console.log("guid of has oether edition: " + forms[0].resourceTemplates[0].propertyTemplates[13].guid);
        console.log("formobjectID is: " + formobjectID);
        console.log("modal form id is: " + modalformid);
        console.log("propertyguid is: " + propertyguid);
        console.log(forms);
        console.log(callingformobject);
        console.log(data);
        */
        bfelog.addMsg(new Error(), "DEBUG", "Setting resource from modal");
        bfelog.addMsg(new Error(), "DEBUG", "modal form id is: " + modalformid);
        var callingformobject = _.where(forms, {"id": formobjectID});
        callingformobject = callingformobject[0];
        callingformobject.resourceTemplates.forEach(function(t) {
            var properties = _.where(t.propertyTemplates, {"guid": propertyguid})
            if ( properties[0] !== undefined ) {

                bfelog.addMsg(new Error(), "DEBUG", "Data from modal: ", data);
                data.forEach(function(t) {
                    callingformobject.store.push(t);
                    bfestore.store.push(t);
                });
                
                bfestore.storeDedup();

                var $formgroup = $("#" + propertyguid, callingformobject.form).closest(".form-group");
                var save = $formgroup.find(".btn-toolbar")[0];
                //console.log(formgroup);
                
                bfelog.addMsg(new Error(), "DEBUG", "Selected property from calling form: " + properties[0].propertyURI);
                tlabel = _.find(data, function(t){ 
                    if (t.p.match(/label|authorizedAccessPoint|^title$|titleValue/i)){
                         return t.o; 
                    } 
                });
                //if there's a lable, use it. Otherwise, create a label fromt the literals, and if no literals, use the uri.
                if ( tlabel !== undefined) {
                    displaydata = tlabel.o;
                    displayuri = tlabel.s;
                } else {
                    for (i in data) {
                        var displaydata;
                        if (data[i].otype === "literal"){
                            if (displaydata === undefined) {
                                displaydata = "";
                            } 
                            displaydata += data[i].o + " ";
                        }
                    }
                    displayuri = data[0].s;
                    if (displaydata === undefined){
                        displaydata = data[0].s;
                    }
                        displaydata.trim();
                }
                
                var connector = _.where(data, {"p": properties[0].propertyURI})
                var bgvars = { 
                        "tguid": connector[0].guid, 
                        "tlabelhover": displaydata,
                        "tlabel": displaydata,
                        "tlabelURI":displayuri,
                        "fobjectid": formobjectID,
                        "inputid": propertyguid,
                        "triples": data
                    };
                var $buttongroup = editDeleteButtonGroup(bgvars);
                    
                $(save).append($buttongroup);
                //$("#" + propertyguid, callingformobject.form).val("");
                if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                    $("#" + propertyguid, callingformobject.form).attr("disabled", true);
                }
                    
            }
        });
        // Remove the form?
        //forms = _.without(forms, _.findWhere(forms, {"id": formobjectID}));
        $('#bfeditor-modalSave-' + modalformid).off('click');
        $('#bfeditor-modal-' + modalformid).modal('hide');
    
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
    }
    
    function editDeleteButtonGroup(bgvars) {
        /*
            vars should be an object, structured thusly:
            {
                "tguid": triple.guid,
                "tlabel": tlabel | data
                "fobjectid": formobject.id
                "inputid": inputid,
                triples: []
            }
        */
        
        var $buttongroup = $('<div>', {id: bgvars.tguid, class: "btn-group btn-group-xs"});
        if (!_.isUndefined(bgvars.tlabel)){
          if (bgvars.tlabel.length > 40) {
            display = bgvars.tlabel.substr(0,40) + "...";
          } else  {
            display = bgvars.tlabel;
          }
        } else {
            display = "example";
        }
        
        var $displaybutton = $('<button type="button" class="btn btn-default" title="' + bgvars.tlabelhover + '">'+display+'</button>')
        //check for non-blanknode
        if (bgvars.tlabelURI !== undefined && bgvars.tlabelURI.match("^!_:b")) {
            $displaybutton = $('<button type="button" class="btn btn-default" title="' + bgvars.tlabelhover + '"><a href="'+bgvars.tlabelURI+'">' + display +'</a></button>');
        }
        $buttongroup.append($displaybutton);
        
        if ( bgvars.editable === undefined || bgvars.editable === true ) {
            //var $editbutton = $('<button type="button" class="btn btn-warning">e</button>');
            if(ms_ie){
            var $editbutton = $('<button class="btn btn-warning" type="button"><span>&#9998;</span></button>');
            } else {
            var $editbutton = $('<button class="btn btn-warning" type="button"> <span class="glyphicon glyphicon-pencil"></span></button>');
            }
            $editbutton.click(function(){
                if (bgvars.triples.length === 1) {
                    editTriple(bgvars.fobjectid, bgvars.inputid, bgvars.triples[0]);
                } else {
                    editTriples(bgvars.fobjectid, bgvars.inputid, bgvars.tguid, bgvars.triples);
                }
            });
            $buttongroup.append($editbutton);
         }
            if(ms_ie){
                var $delbutton = $('<button class="btn btn-danger" type="button"><span>&#10005;</span></button>');
            } else {
                var $delbutton = $('<button class="btn btn-danger" type="button"><span class="glyphicon glyphicon-trash"></span> </button>');  
            }
//          var $delbutton = $('<button type="button" class="btn btn-danger">x</button>');
            $delbutton.click(function(){
                if (bgvars.triples.length === 1) {
                    removeTriple(bgvars.fobjectid, bgvars.inputid, bgvars.tguid, bgvars.triples[0]);
                } else {
                    removeTriples(bgvars.fobjectid, bgvars.inputid, bgvars.tguid, bgvars.triples);
                }
            });
            $buttongroup.append($delbutton);
        
        
        return $buttongroup;
    }
    
    function setLiteral(formobjectID, resourceID, inputID) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        //console.log(inputID);
        var data = $("#" + inputID, formobject.form).val();
        if (data !== undefined && data !== "") {
            var triple = {}
            triple.guid = guid();
            formobject.resourceTemplates.forEach(function(t) {
                var properties = _.where(t.propertyTemplates, {"guid": inputID})
                if ( properties[0] !== undefined ) {
                    if (t.defaulturi !== undefined && t.defaulturi !== "") {
                        triple.s = t.defaulturi;
                    } else {
                        triple.s = editorconfig.baseURI + resourceID;
                    }
                    triple.p = properties[0].propertyURI;
                    triple.o = data;
                    triple.otype = "literal";
                    //triple.olang = "";
                    
                    bfestore.store.push(triple);
                    formobject.store.push(triple);
                    
                    var formgroup = $("#" + inputID, formobject.form).closest(".form-group");
                    var save = $(formgroup).find(".btn-toolbar")[0];
                    
                    var bgvars = { 
                        "tguid": triple.guid, 
                        "tlabel": data,
                        "tlabelhover": data,
                        "fobjectid": formobjectID,
                        "inputid": inputID,
                        "triples": [triple]
                    };
                    var $buttongroup = editDeleteButtonGroup(bgvars);
                    
                    $(save).append($buttongroup);
                    $("#" + inputID, formobject.form).val("");
                    if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                        $("#" + inputID, formobject.form).attr("disabled", true);
                    }

                    
                }
            });
        }
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
    }
    
    function setResourceFromLabel(formobjectID, resourceID, inputID) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        //console.log(inputID);
        var data = $("#" + inputID, formobject.form).val();
        if (data !== undefined && data !== "") {
            var triple = {}
            triple.guid = guid();
            formobject.resourceTemplates.forEach(function(t) {
                var properties = _.where(t.propertyTemplates, {"guid": inputID})
                if ( properties[0] !== undefined ) {
                    if (t.defaulturi !== undefined && t.defaulturi !== "") {
                        triple.s = t.defaulturi;
                    } else {
                        triple.s = editorconfig.baseURI + resourceID;
                    }
                    triple.p = properties[0].propertyURI;
                    triple.o = data;
                    triple.otype = "uri";
                    
                    bfestore.store.push(triple);
                    formobject.store.push(triple);
                    
                    var $formgroup = $("#" + inputID, formobject.form).closest(".form-group");
                    var save = $formgroup.find(".btn-toolbar")[0];
                                
                    var bgvars = { 
                        "tguid": triple.guid, 
                        "tlabel": triple.o,
                        "tlabelhover": triple.o,
                        "fobjectid": formobjectID,
                        "inputid": inputID,
                        "triples": [triple]
                    };
                    var $buttongroup = editDeleteButtonGroup(bgvars);
                    
                    $(save).append($buttongroup);
                    $("#" + inputID, formobject.form).val("");
                    if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                        $("#" + inputID, formobject.form).attr("disabled", true);
                    }
                    
                }
            });
        }
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
    }
    
    function setTypeahead(input) {
        var form = $(input).closest("form").eq(0);
        var formid = $(input).closest("form").eq(0).attr("id");
        var pageid = $(input).siblings(".typeaheadpage").attr("id");
        formid = formid.replace('bfeditor-form-', '');
        var formobject = _.where(forms, {"id": formid});
        formobject = formobject[0];
        if (typeof(pageid) != "undefined"){
            formobject.pageid = pageid;
        }
        //console.log(formid);
            
        var pguid = $(input).attr("data-propertyguid");
        var p;
        formobject.resourceTemplates.forEach(function(t) {
            var properties = _.where(t.propertyTemplates, {"guid": pguid});
            //console.log(properties);
            if ( properties[0] !== undefined ) {
                p = properties[0];
            }
        });

        var uvfs = p.valueConstraint.useValuesFrom;
        var dshashes = [];
        uvfs.forEach(function(uvf){
        // var lups = _.where(lookups, {"scheme": uvf});
            var lu = lookups[uvf];

            bfelog.addMsg(new Error(), "DEBUG", "Setting typeahead scheme: " + uvf);
            bfelog.addMsg(new Error(), "DEBUG", "Lookup is", lu);
                    
            var dshash = {};
            dshash.name = lu.name;
            dshash.source = function(query, process) {
                lu.load.source(query, process, formobject);
            };
            dshash.templates = { header: '<h3>' + lu.name + '</h3>', footer: '<div id="dropdown-footer" class=".col-sm-1"></div>'};
            dshash.displayKey = 'value';
            dshashes.push(dshash);
        });
        
        bfelog.addMsg(new Error(), "DEBUG", "Data source hashes", dshashes);
        var opts = {
            minLength: 0,
            highlight: true,
            displayKey: 'value'
        };
        if ( dshashes.length === 1) {
            $( input ).typeahead(
                opts,
                dshashes[0]
            );
        } else if ( dshashes.length === 2) {
            $( input ).typeahead(
                opts,
                dshashes[0],
                dshashes[1]
            );
        } else if ( dshashes.length === 3) {
            $( input ).typeahead(
                opts,
                dshashes[0],
                dshashes[1],
                dshashes[2]
            );
        } else if ( dshashes.length === 4) {
            $( input ).typeahead(
                opts,
                dshashes[0],
                dshashes[1],
                dshashes[2],
                dshashes[3]
            );
        } else if ( dshashes.length === 5) {
            $( input ).typeahead(
                opts,
                dshashes[0],
                dshashes[1],
                dshashes[2],
                dshashes[3],
                dshashes[4]
            );
        } else if ( dshashes.length === 6) {
            $( input ).typeahead(
                opts,
                dshashes[0],
                dshashes[1],
                dshashes[2],
                dshashes[3],
                dshashes[4],
                dshashes[5]
            );
        }
        // Need more than 6?  That's crazy talk, man, crazy talk.
        $( input ).on("typeahead:selected", function(event, suggestionobject, datasetname) {            
            bfelog.addMsg(new Error(), "DEBUG", "Typeahead selection made");
            var form = $("#" + event.target.id).closest("form").eq(0);
            var formid = $("#" + event.target.id).closest("form").eq(0).attr("id");
            formid = formid.replace('bfeditor-form-', '');
            //reset page
            $(input).parent().siblings(".typeaheadpage").val(1);
            var resourceid = $(form).children("div").eq(0).attr("id");
            var resourceURI = $(form).find("div[data-uri]").eq(0).attr("data-uri");
                
            var propertyguid = $("#" + event.target.id).attr("data-propertyguid");
            bfelog.addMsg(new Error(), "DEBUG", "propertyguid for typeahead input is " + propertyguid);
                
            var s = editorconfig.baseURI + resourceid;
            var p = "";
            var formobject = _.where(forms, {"id": formid});
            formobject = formobject[0];
            formobject.resourceTemplates.forEach(function(t) {
                var properties = _.where(t.propertyTemplates, {"guid": propertyguid});
                //console.log(properties);
                if ( properties[0] !== undefined ) {
                    p = properties[0];
                }
            });
                
            var lups = _.where(lookups, {"name": datasetname});
            var lu;
            if ( lups[0] !== undefined ) {
                bfelog.addMsg(new Error(), "DEBUG", "Found lookup for datasetname: " + datasetname, lups[0]);
                lu = lups[0].load;
            }
            lu.getResource(resourceURI, p.propertyURI, suggestionobject, function(returntriples) {
                bfelog.addMsg(new Error(), "DEBUG", "Triples returned from lookup's getResource func:", returntriples);
                returntriples.forEach(function(t){
                    if (t.guid === undefined) {
                        var tguid = guid();
                        t.guid = tguid;
                    }
                    formobject.store.push(t);
                    bfestore.store.push(t);
                    
                    // We only want to show those properties that relate to
                    // *this* resource.
                    if (t.s == resourceURI) {
                        formobject.resourceTemplates.forEach(function(rt) {
                            var properties = _.where(rt.propertyTemplates, {"propertyURI": t.p});
                            if ( properties[0] !== undefined ) {
                                var property = properties[0];
                                var pguid = property.guid;
                    
                                var $formgroup = $("#" + pguid, formobject.form).closest(".form-group");
                                var save = $formgroup.find(".btn-toolbar")[0];
                            
                                var tlabel = t.o;
                                if (t.otype == "uri") {
                                    var resourcedata = _.where(returntriples, {"s": t.o});
                                    var bnodes = _.filter(returntriples, function(obj){ return obj.s.match("^_:b")});
                                    resourcedata = resourcedata.concat(bnodes);
                                    var displaytriple = _.find(resourcedata, function(label) {
                                        return label.p.match(/label|^title$|titleValue/i);
                                    });
                                    //check for blanknodes
                                    if (displaytriple !== undefined && displaytriple.o !== undefined && displaytriple.o.match("^_:b")) {
                                        var labelresourcedata = _.where(returntriples, {"s": t.s});
                                        var displaytriple = _.find(labelresourcedata, function(label) {
                                            return label.p.match(/label|authorizedAccessPoint/i);
                                        });
                                        tlabel = displaytriple.o;
                                    } else if (displaytriple !== undefined && displaytriple.o !== undefined) {
                                        tlabel = displaytriple.o;
                                    }

                                }
                            
                                var setTriples = [t];
                                if (resourcedata !== undefined && resourcedata[0] !== undefined) {
                                    setTriples = resourcedata;
                                }
                        



                                var editable = true;
                                if (property.valueConstraint.editable !== undefined && property.valueConstraint.editable === "false") {
                                    editable = false;
                                }
                                var bgvars = { 
                                    "editable": editable,
                                    "tguid": t.guid, 
                                    "tlabel": tlabel,
                                    "tlabelhover": tlabel,
                                    "fobjectid": formobject.id,
                                    "inputid": pguid,
                                    "triples": setTriples
                                };
                                var $buttongroup = editDeleteButtonGroup(bgvars);
                            
                                $(save).append($buttongroup);
                    
                                $("#" + pguid, formobject.form).val("");
                                $("#" + pguid, formobject.form).typeahead('val', "");
                                $("#" + pguid, formobject.form).typeahead('close');
                    
                                if (property.valueConstraint !== undefined && property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                                    var $el = $("#" + pguid, formobject.form)
                                    if ($el.is("input")) {
                                        $el.prop("disabled", true);
                                        $el.css( "background-color", "#EEEEEE" );
                                    } else {
                                        var $buttons = $("div.btn-group", $el).find("button");
                                        $buttons.each(function() {
                                            $( this ).prop("disabled", true);
                                       });
                                    }
                                }
                            }
                        });
                    }
                });
                bfestore.storeDedup();
                $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
            });
        });
    }
    
    function editTriple(formobjectID, inputID, t) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        bfelog.addMsg(new Error(), "DEBUG", "Editing triple: " + t.guid, t);
        $("#" + t.guid).empty();

        var $el = $("#" + inputID, formobject.form);
        if ($el.is("input") && $el.hasClass( "typeahead" )) {
            var $inputs = $("#" + inputID, formobject.form).parent().find("input[data-propertyguid='" + inputID +"']");
            // is this a hack because something is broken?
            $inputs.each(function() {
                $( this ).prop( "disabled", false );
                $( this ).removeAttr("disabled");
                $( this ).css( "background-color", "transparent" );
            });
        } else if ($el.is("input")) {
            $el.prop( "disabled", false );
            $el.removeAttr("disabled");
            //el.css( "background-color", "transparent" );
        } else {
            var $buttons = $("div.btn-group", $el).find("button");
            $buttons.each(function() {
                $( this ).prop( "disabled", false );
            });
        }

        if ($el.is("input") && t.otype == "literal") {
            $el.val(t.o);
        }
        formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {guid: t.guid}));
        bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {guid: t.guid}));
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
    }
    
    function editTriples(formobjectID, inputID, tguid, triples) {
        bfelog.addMsg(new Error(), "DEBUG", "Editing triples", triples);
        var resourceTypes = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"});
        if (resourceTypes[0] == undefined){
        //try @type?
            resourceTypes = _.where(triples, {"p": "@type"});
        }
        bfelog.addMsg(new Error(), "DEBUG", "Triples represent these resourceTypes", resourceTypes);
        if (resourceTypes[0] !== undefined && typeof resourceTypes[0] !== undefined && resourceTypes[0].rtID !== undefined) {
            // function openModal(callingformobjectid, rtguid, propertyguid, template) {
            var callingformobject = _.where(forms, {"id": formobjectID});
            callingformobject = callingformobject[0];
            
            var templates = _.where(resourceTemplates, {"id": resourceTypes[0].rtID});
            if (templates[0] !== undefined) {
                // The subject of the resource matched with the "type"
                bfelog.addMsg(new Error(), "DEBUG", "Opening modal for editing", triples);
                openModal(callingformobject.id, templates[0], resourceTypes[0].s, inputID, triples);
            }
        } else {
            removeTriples(formobjectID, inputID, tguid, triples);
        }
        
    }
    
    function removeTriple(formobjectID, inputID, tguid, t) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        if($("#" + t.guid).length && t !== undefined){
          bfelog.addMsg(new Error(), "DEBUG", "Removing triple: " + t.guid, t);
          //$("#" + t.guid).empty();
          $("#" + t.guid).remove();
        } else {
          bfelog.addMsg(new Error(), "DEBUG", "Removing triple: " + tguid);
          //$("#" + tguid).empty();
          $("#" + tguid).remove();
          formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {guid: tguid}));
          bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {guid: tguid}));
        }

        var $el = $("#" + inputID, formobject.form);
        if ($el.is("input") && $el.hasClass( "typeahead" )) {
            var $inputs = $("#" + inputID, formobject.form).parent().find("input[data-propertyguid='" + inputID +"']");
            // is this a hack because something is broken?
            $inputs.each(function() {
                $( this ).prop( "disabled", false );
                $( this ).removeAttr("disabled");
                $( this ).css( "background-color", "transparent" );
            });
        } else if ($el.is("input")) {
            $el.prop( "disabled", false );
            $el.removeAttr("disabled");
            //el.css( "background-color", "transparent" );
        } else {
            var $buttons = $("div.btn-group", $el).find("button");
            $buttons.each(function() {
                $( this ).prop( "disabled", false );
            });
        }
        formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {guid: t.guid}));
        bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {guid: t.guid}));
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
    }
    
    function removeTriples(formobjectID, inputID,tID, triples) {
        bfelog.addMsg(new Error(), "DEBUG", "Removing triples for formobjectID: " + formobjectID + " and inputID: " + inputID, triples);
        triples.forEach(function(triple) {
            removeTriple(formobjectID, inputID, tID, triple);
        });
    }

    /**
    * Generate string which matches python dirhash
    * @returns {String} the generated string
    * @example GCt1438871386
    *  
    */
    function guid() {
        function _randomChoice() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            for (var i = 0; i < 1; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }
        return _randomChoice() + _randomChoice() + _randomChoice() + parseInt(Date.now() / 1000);
    }

    function randomChoice() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        for (var i = 0; i < 1; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    function whichrt(rt, baseURI){
        //for resource templates, determine if they are works, instances, or other
        var returnval = "_:bnode";
        
        $.ajax({
            type: "GET",
            async: false,
            cache: true,
            dataType: "json",
            contentType: "application/json",
            url: rt.resourceURI + ".json",
            success: function(data) {
                data.some(function(resource){
                    if(resource["@id"] === rt.resourceURI){
                        if(resource["http://www.w3.org/2000/01/rdf-schema#subClassOf"][0]["@id"] === "http://bibframe.org/vocab/Work" || resource["@id"] === "http://bibframe.org/vocab/Work"){
                            returnval = baseURI + "resources/works/";
                            return returnval;
                        } else if (resource["http://www.w3.org/2000/01/rdf-schema#subClassOf"][0]["@id"] === "http://bibframe.org/vocab/Instance" || resource["@id"] === "http://bibframe.org/vocab/Instance") {
                            returnval = baseURI + "resources/instances/";
                            return returnval;
                        }
                    }
                });
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
            }
        });

        return returnval;

    }

    
});

;(function(){function n(n,t,e){e=(e||0)-1;for(var r=n?n.length:0;++e<r;)if(n[e]===t)return e;return-1}function t(t,e){var r=typeof e;if(t=t.l,"boolean"==r||null==e)return t[e]?0:-1;"number"!=r&&"string"!=r&&(r="object");var u="number"==r?e:m+e;return t=(t=t[r])&&t[u],"object"==r?t&&-1<n(t,e)?0:-1:t?0:-1}function e(n){var t=this.l,e=typeof n;if("boolean"==e||null==n)t[n]=true;else{"number"!=e&&"string"!=e&&(e="object");var r="number"==e?n:m+n,t=t[e]||(t[e]={});"object"==e?(t[r]||(t[r]=[])).push(n):t[r]=true
}}function r(n){return n.charCodeAt(0)}function u(n,t){for(var e=n.m,r=t.m,u=-1,o=e.length;++u<o;){var i=e[u],a=r[u];if(i!==a){if(i>a||typeof i=="undefined")return 1;if(i<a||typeof a=="undefined")return-1}}return n.n-t.n}function o(n){var t=-1,r=n.length,u=n[0],o=n[r/2|0],i=n[r-1];if(u&&typeof u=="object"&&o&&typeof o=="object"&&i&&typeof i=="object")return false;for(u=f(),u["false"]=u["null"]=u["true"]=u.undefined=false,o=f(),o.k=n,o.l=u,o.push=e;++t<r;)o.push(n[t]);return o}function i(n){return"\\"+U[n]
}function a(){return h.pop()||[]}function f(){return g.pop()||{k:null,l:null,m:null,"false":false,n:0,"null":false,number:null,object:null,push:null,string:null,"true":false,undefined:false,o:null}}function l(n){n.length=0,h.length<_&&h.push(n)}function c(n){var t=n.l;t&&c(t),n.k=n.l=n.m=n.object=n.number=n.string=n.o=null,g.length<_&&g.push(n)}function p(n,t,e){t||(t=0),typeof e=="undefined"&&(e=n?n.length:0);var r=-1;e=e-t||0;for(var u=Array(0>e?0:e);++r<e;)u[r]=n[t+r];return u}function s(e){function h(n,t,e){if(!n||!V[typeof n])return n;
t=t&&typeof e=="undefined"?t:tt(t,e,3);for(var r=-1,u=V[typeof n]&&Fe(n),o=u?u.length:0;++r<o&&(e=u[r],false!==t(n[e],e,n)););return n}function g(n,t,e){var r;if(!n||!V[typeof n])return n;t=t&&typeof e=="undefined"?t:tt(t,e,3);for(r in n)if(false===t(n[r],r,n))break;return n}function _(n,t,e){var r,u=n,o=u;if(!u)return o;for(var i=arguments,a=0,f=typeof e=="number"?2:i.length;++a<f;)if((u=i[a])&&V[typeof u])for(var l=-1,c=V[typeof u]&&Fe(u),p=c?c.length:0;++l<p;)r=c[l],"undefined"==typeof o[r]&&(o[r]=u[r]);
return o}function U(n,t,e){var r,u=n,o=u;if(!u)return o;var i=arguments,a=0,f=typeof e=="number"?2:i.length;if(3<f&&"function"==typeof i[f-2])var l=tt(i[--f-1],i[f--],2);else 2<f&&"function"==typeof i[f-1]&&(l=i[--f]);for(;++a<f;)if((u=i[a])&&V[typeof u])for(var c=-1,p=V[typeof u]&&Fe(u),s=p?p.length:0;++c<s;)r=p[c],o[r]=l?l(o[r],u[r]):u[r];return o}function H(n){var t,e=[];if(!n||!V[typeof n])return e;for(t in n)me.call(n,t)&&e.push(t);return e}function J(n){return n&&typeof n=="object"&&!Te(n)&&me.call(n,"__wrapped__")?n:new Q(n)
}function Q(n,t){this.__chain__=!!t,this.__wrapped__=n}function X(n){function t(){if(r){var n=p(r);be.apply(n,arguments)}if(this instanceof t){var o=nt(e.prototype),n=e.apply(o,n||arguments);return wt(n)?n:o}return e.apply(u,n||arguments)}var e=n[0],r=n[2],u=n[4];return $e(t,n),t}function Z(n,t,e,r,u){if(e){var o=e(n);if(typeof o!="undefined")return o}if(!wt(n))return n;var i=ce.call(n);if(!K[i])return n;var f=Ae[i];switch(i){case T:case F:return new f(+n);case W:case P:return new f(n);case z:return o=f(n.source,C.exec(n)),o.lastIndex=n.lastIndex,o
}if(i=Te(n),t){var c=!r;r||(r=a()),u||(u=a());for(var s=r.length;s--;)if(r[s]==n)return u[s];o=i?f(n.length):{}}else o=i?p(n):U({},n);return i&&(me.call(n,"index")&&(o.index=n.index),me.call(n,"input")&&(o.input=n.input)),t?(r.push(n),u.push(o),(i?St:h)(n,function(n,i){o[i]=Z(n,t,e,r,u)}),c&&(l(r),l(u)),o):o}function nt(n){return wt(n)?ke(n):{}}function tt(n,t,e){if(typeof n!="function")return Ut;if(typeof t=="undefined"||!("prototype"in n))return n;var r=n.__bindData__;if(typeof r=="undefined"&&(De.funcNames&&(r=!n.name),r=r||!De.funcDecomp,!r)){var u=ge.call(n);
De.funcNames||(r=!O.test(u)),r||(r=E.test(u),$e(n,r))}if(false===r||true!==r&&1&r[1])return n;switch(e){case 1:return function(e){return n.call(t,e)};case 2:return function(e,r){return n.call(t,e,r)};case 3:return function(e,r,u){return n.call(t,e,r,u)};case 4:return function(e,r,u,o){return n.call(t,e,r,u,o)}}return Mt(n,t)}function et(n){function t(){var n=f?i:this;if(u){var h=p(u);be.apply(h,arguments)}return(o||c)&&(h||(h=p(arguments)),o&&be.apply(h,o),c&&h.length<a)?(r|=16,et([e,s?r:-4&r,h,null,i,a])):(h||(h=arguments),l&&(e=n[v]),this instanceof t?(n=nt(e.prototype),h=e.apply(n,h),wt(h)?h:n):e.apply(n,h))
}var e=n[0],r=n[1],u=n[2],o=n[3],i=n[4],a=n[5],f=1&r,l=2&r,c=4&r,s=8&r,v=e;return $e(t,n),t}function rt(e,r){var u=-1,i=st(),a=e?e.length:0,f=a>=b&&i===n,l=[];if(f){var p=o(r);p?(i=t,r=p):f=false}for(;++u<a;)p=e[u],0>i(r,p)&&l.push(p);return f&&c(r),l}function ut(n,t,e,r){r=(r||0)-1;for(var u=n?n.length:0,o=[];++r<u;){var i=n[r];if(i&&typeof i=="object"&&typeof i.length=="number"&&(Te(i)||yt(i))){t||(i=ut(i,t,e));var a=-1,f=i.length,l=o.length;for(o.length+=f;++a<f;)o[l++]=i[a]}else e||o.push(i)}return o
}function ot(n,t,e,r,u,o){if(e){var i=e(n,t);if(typeof i!="undefined")return!!i}if(n===t)return 0!==n||1/n==1/t;if(n===n&&!(n&&V[typeof n]||t&&V[typeof t]))return false;if(null==n||null==t)return n===t;var f=ce.call(n),c=ce.call(t);if(f==D&&(f=q),c==D&&(c=q),f!=c)return false;switch(f){case T:case F:return+n==+t;case W:return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case z:case P:return n==oe(t)}if(c=f==$,!c){var p=me.call(n,"__wrapped__"),s=me.call(t,"__wrapped__");if(p||s)return ot(p?n.__wrapped__:n,s?t.__wrapped__:t,e,r,u,o);
if(f!=q)return false;if(f=n.constructor,p=t.constructor,f!=p&&!(dt(f)&&f instanceof f&&dt(p)&&p instanceof p)&&"constructor"in n&&"constructor"in t)return false}for(f=!u,u||(u=a()),o||(o=a()),p=u.length;p--;)if(u[p]==n)return o[p]==t;var v=0,i=true;if(u.push(n),o.push(t),c){if(p=n.length,v=t.length,(i=v==p)||r)for(;v--;)if(c=p,s=t[v],r)for(;c--&&!(i=ot(n[c],s,e,r,u,o)););else if(!(i=ot(n[v],s,e,r,u,o)))break}else g(t,function(t,a,f){return me.call(f,a)?(v++,i=me.call(n,a)&&ot(n[a],t,e,r,u,o)):void 0}),i&&!r&&g(n,function(n,t,e){return me.call(e,t)?i=-1<--v:void 0
});return u.pop(),o.pop(),f&&(l(u),l(o)),i}function it(n,t,e,r,u){(Te(t)?St:h)(t,function(t,o){var i,a,f=t,l=n[o];if(t&&((a=Te(t))||Pe(t))){for(f=r.length;f--;)if(i=r[f]==t){l=u[f];break}if(!i){var c;e&&(f=e(l,t),c=typeof f!="undefined")&&(l=f),c||(l=a?Te(l)?l:[]:Pe(l)?l:{}),r.push(t),u.push(l),c||it(l,t,e,r,u)}}else e&&(f=e(l,t),typeof f=="undefined"&&(f=t)),typeof f!="undefined"&&(l=f);n[o]=l})}function at(n,t){return n+he(Re()*(t-n+1))}function ft(e,r,u){var i=-1,f=st(),p=e?e.length:0,s=[],v=!r&&p>=b&&f===n,h=u||v?a():s;
for(v&&(h=o(h),f=t);++i<p;){var g=e[i],y=u?u(g,i,e):g;(r?!i||h[h.length-1]!==y:0>f(h,y))&&((u||v)&&h.push(y),s.push(g))}return v?(l(h.k),c(h)):u&&l(h),s}function lt(n){return function(t,e,r){var u={};e=J.createCallback(e,r,3),r=-1;var o=t?t.length:0;if(typeof o=="number")for(;++r<o;){var i=t[r];n(u,i,e(i,r,t),t)}else h(t,function(t,r,o){n(u,t,e(t,r,o),o)});return u}}function ct(n,t,e,r,u,o){var i=1&t,a=4&t,f=16&t,l=32&t;if(!(2&t||dt(n)))throw new ie;f&&!e.length&&(t&=-17,f=e=false),l&&!r.length&&(t&=-33,l=r=false);
var c=n&&n.__bindData__;return c&&true!==c?(c=p(c),c[2]&&(c[2]=p(c[2])),c[3]&&(c[3]=p(c[3])),!i||1&c[1]||(c[4]=u),!i&&1&c[1]&&(t|=8),!a||4&c[1]||(c[5]=o),f&&be.apply(c[2]||(c[2]=[]),e),l&&we.apply(c[3]||(c[3]=[]),r),c[1]|=t,ct.apply(null,c)):(1==t||17===t?X:et)([n,t,e,r,u,o])}function pt(n){return Be[n]}function st(){var t=(t=J.indexOf)===Wt?n:t;return t}function vt(n){return typeof n=="function"&&pe.test(n)}function ht(n){var t,e;return n&&ce.call(n)==q&&(t=n.constructor,!dt(t)||t instanceof t)?(g(n,function(n,t){e=t
}),typeof e=="undefined"||me.call(n,e)):false}function gt(n){return We[n]}function yt(n){return n&&typeof n=="object"&&typeof n.length=="number"&&ce.call(n)==D||false}function mt(n,t,e){var r=Fe(n),u=r.length;for(t=tt(t,e,3);u--&&(e=r[u],false!==t(n[e],e,n)););return n}function bt(n){var t=[];return g(n,function(n,e){dt(n)&&t.push(e)}),t.sort()}function _t(n){for(var t=-1,e=Fe(n),r=e.length,u={};++t<r;){var o=e[t];u[n[o]]=o}return u}function dt(n){return typeof n=="function"}function wt(n){return!(!n||!V[typeof n])
}function jt(n){return typeof n=="number"||n&&typeof n=="object"&&ce.call(n)==W||false}function kt(n){return typeof n=="string"||n&&typeof n=="object"&&ce.call(n)==P||false}function xt(n){for(var t=-1,e=Fe(n),r=e.length,u=Xt(r);++t<r;)u[t]=n[e[t]];return u}function Ct(n,t,e){var r=-1,u=st(),o=n?n.length:0,i=false;return e=(0>e?Ie(0,o+e):e)||0,Te(n)?i=-1<u(n,t,e):typeof o=="number"?i=-1<(kt(n)?n.indexOf(t,e):u(n,t,e)):h(n,function(n){return++r<e?void 0:!(i=n===t)}),i}function Ot(n,t,e){var r=true;t=J.createCallback(t,e,3),e=-1;
var u=n?n.length:0;if(typeof u=="number")for(;++e<u&&(r=!!t(n[e],e,n)););else h(n,function(n,e,u){return r=!!t(n,e,u)});return r}function Nt(n,t,e){var r=[];t=J.createCallback(t,e,3),e=-1;var u=n?n.length:0;if(typeof u=="number")for(;++e<u;){var o=n[e];t(o,e,n)&&r.push(o)}else h(n,function(n,e,u){t(n,e,u)&&r.push(n)});return r}function It(n,t,e){t=J.createCallback(t,e,3),e=-1;var r=n?n.length:0;if(typeof r!="number"){var u;return h(n,function(n,e,r){return t(n,e,r)?(u=n,false):void 0}),u}for(;++e<r;){var o=n[e];
if(t(o,e,n))return o}}function St(n,t,e){var r=-1,u=n?n.length:0;if(t=t&&typeof e=="undefined"?t:tt(t,e,3),typeof u=="number")for(;++r<u&&false!==t(n[r],r,n););else h(n,t);return n}function Et(n,t,e){var r=n?n.length:0;if(t=t&&typeof e=="undefined"?t:tt(t,e,3),typeof r=="number")for(;r--&&false!==t(n[r],r,n););else{var u=Fe(n),r=u.length;h(n,function(n,e,o){return e=u?u[--r]:--r,t(o[e],e,o)})}return n}function Rt(n,t,e){var r=-1,u=n?n.length:0;if(t=J.createCallback(t,e,3),typeof u=="number")for(var o=Xt(u);++r<u;)o[r]=t(n[r],r,n);
else o=[],h(n,function(n,e,u){o[++r]=t(n,e,u)});return o}function At(n,t,e){var u=-1/0,o=u;if(typeof t!="function"&&e&&e[t]===n&&(t=null),null==t&&Te(n)){e=-1;for(var i=n.length;++e<i;){var a=n[e];a>o&&(o=a)}}else t=null==t&&kt(n)?r:J.createCallback(t,e,3),St(n,function(n,e,r){e=t(n,e,r),e>u&&(u=e,o=n)});return o}function Dt(n,t,e,r){if(!n)return e;var u=3>arguments.length;t=J.createCallback(t,r,4);var o=-1,i=n.length;if(typeof i=="number")for(u&&(e=n[++o]);++o<i;)e=t(e,n[o],o,n);else h(n,function(n,r,o){e=u?(u=false,n):t(e,n,r,o)
});return e}function $t(n,t,e,r){var u=3>arguments.length;return t=J.createCallback(t,r,4),Et(n,function(n,r,o){e=u?(u=false,n):t(e,n,r,o)}),e}function Tt(n){var t=-1,e=n?n.length:0,r=Xt(typeof e=="number"?e:0);return St(n,function(n){var e=at(0,++t);r[t]=r[e],r[e]=n}),r}function Ft(n,t,e){var r;t=J.createCallback(t,e,3),e=-1;var u=n?n.length:0;if(typeof u=="number")for(;++e<u&&!(r=t(n[e],e,n)););else h(n,function(n,e,u){return!(r=t(n,e,u))});return!!r}function Bt(n,t,e){var r=0,u=n?n.length:0;if(typeof t!="number"&&null!=t){var o=-1;
for(t=J.createCallback(t,e,3);++o<u&&t(n[o],o,n);)r++}else if(r=t,null==r||e)return n?n[0]:v;return p(n,0,Se(Ie(0,r),u))}function Wt(t,e,r){if(typeof r=="number"){var u=t?t.length:0;r=0>r?Ie(0,u+r):r||0}else if(r)return r=zt(t,e),t[r]===e?r:-1;return n(t,e,r)}function qt(n,t,e){if(typeof t!="number"&&null!=t){var r=0,u=-1,o=n?n.length:0;for(t=J.createCallback(t,e,3);++u<o&&t(n[u],u,n);)r++}else r=null==t||e?1:Ie(0,t);return p(n,r)}function zt(n,t,e,r){var u=0,o=n?n.length:u;for(e=e?J.createCallback(e,r,1):Ut,t=e(t);u<o;)r=u+o>>>1,e(n[r])<t?u=r+1:o=r;
return u}function Pt(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=typeof t!="function"&&r&&r[t]===n?null:t,t=false),null!=e&&(e=J.createCallback(e,r,3)),ft(n,t,e)}function Kt(){for(var n=1<arguments.length?arguments:arguments[0],t=-1,e=n?At(Ve(n,"length")):0,r=Xt(0>e?0:e);++t<e;)r[t]=Ve(n,t);return r}function Lt(n,t){var e=-1,r=n?n.length:0,u={};for(t||!r||Te(n[0])||(t=[]);++e<r;){var o=n[e];t?u[o]=t[e]:o&&(u[o[0]]=o[1])}return u}function Mt(n,t){return 2<arguments.length?ct(n,17,p(arguments,2),null,t):ct(n,1,null,null,t)
}function Vt(n,t,e){function r(){c&&ve(c),i=c=p=v,(g||h!==t)&&(s=Ue(),a=n.apply(l,o),c||i||(o=l=null))}function u(){var e=t-(Ue()-f);0<e?c=_e(u,e):(i&&ve(i),e=p,i=c=p=v,e&&(s=Ue(),a=n.apply(l,o),c||i||(o=l=null)))}var o,i,a,f,l,c,p,s=0,h=false,g=true;if(!dt(n))throw new ie;if(t=Ie(0,t)||0,true===e)var y=true,g=false;else wt(e)&&(y=e.leading,h="maxWait"in e&&(Ie(t,e.maxWait)||0),g="trailing"in e?e.trailing:g);return function(){if(o=arguments,f=Ue(),l=this,p=g&&(c||!y),false===h)var e=y&&!c;else{i||y||(s=f);var v=h-(f-s),m=0>=v;
m?(i&&(i=ve(i)),s=f,a=n.apply(l,o)):i||(i=_e(r,v))}return m&&c?c=ve(c):c||t===h||(c=_e(u,t)),e&&(m=true,a=n.apply(l,o)),!m||c||i||(o=l=null),a}}function Ut(n){return n}function Gt(n,t,e){var r=true,u=t&&bt(t);t&&(e||u.length)||(null==e&&(e=t),o=Q,t=n,n=J,u=bt(t)),false===e?r=false:wt(e)&&"chain"in e&&(r=e.chain);var o=n,i=dt(o);St(u,function(e){var u=n[e]=t[e];i&&(o.prototype[e]=function(){var t=this.__chain__,e=this.__wrapped__,i=[e];if(be.apply(i,arguments),i=u.apply(n,i),r||t){if(e===i&&wt(i))return this;
i=new o(i),i.__chain__=t}return i})})}function Ht(){}function Jt(n){return function(t){return t[n]}}function Qt(){return this.__wrapped__}e=e?Y.defaults(G.Object(),e,Y.pick(G,A)):G;var Xt=e.Array,Yt=e.Boolean,Zt=e.Date,ne=e.Function,te=e.Math,ee=e.Number,re=e.Object,ue=e.RegExp,oe=e.String,ie=e.TypeError,ae=[],fe=re.prototype,le=e._,ce=fe.toString,pe=ue("^"+oe(ce).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),se=te.ceil,ve=e.clearTimeout,he=te.floor,ge=ne.prototype.toString,ye=vt(ye=re.getPrototypeOf)&&ye,me=fe.hasOwnProperty,be=ae.push,_e=e.setTimeout,de=ae.splice,we=ae.unshift,je=function(){try{var n={},t=vt(t=re.defineProperty)&&t,e=t(n,n,n)&&t
}catch(r){}return e}(),ke=vt(ke=re.create)&&ke,xe=vt(xe=Xt.isArray)&&xe,Ce=e.isFinite,Oe=e.isNaN,Ne=vt(Ne=re.keys)&&Ne,Ie=te.max,Se=te.min,Ee=e.parseInt,Re=te.random,Ae={};Ae[$]=Xt,Ae[T]=Yt,Ae[F]=Zt,Ae[B]=ne,Ae[q]=re,Ae[W]=ee,Ae[z]=ue,Ae[P]=oe,Q.prototype=J.prototype;var De=J.support={};De.funcDecomp=!vt(e.a)&&E.test(s),De.funcNames=typeof ne.name=="string",J.templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:N,variable:"",imports:{_:J}},ke||(nt=function(){function n(){}return function(t){if(wt(t)){n.prototype=t;
var r=new n;n.prototype=null}return r||e.Object()}}());var $e=je?function(n,t){M.value=t,je(n,"__bindData__",M)}:Ht,Te=xe||function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&ce.call(n)==$||false},Fe=Ne?function(n){return wt(n)?Ne(n):[]}:H,Be={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},We=_t(Be),qe=ue("("+Fe(We).join("|")+")","g"),ze=ue("["+Fe(Be).join("")+"]","g"),Pe=ye?function(n){if(!n||ce.call(n)!=q)return false;var t=n.valueOf,e=vt(t)&&(e=ye(t))&&ye(e);return e?n==e||ye(n)==e:ht(n)
}:ht,Ke=lt(function(n,t,e){me.call(n,e)?n[e]++:n[e]=1}),Le=lt(function(n,t,e){(me.call(n,e)?n[e]:n[e]=[]).push(t)}),Me=lt(function(n,t,e){n[e]=t}),Ve=Rt,Ue=vt(Ue=Zt.now)&&Ue||function(){return(new Zt).getTime()},Ge=8==Ee(d+"08")?Ee:function(n,t){return Ee(kt(n)?n.replace(I,""):n,t||0)};return J.after=function(n,t){if(!dt(t))throw new ie;return function(){return 1>--n?t.apply(this,arguments):void 0}},J.assign=U,J.at=function(n){for(var t=arguments,e=-1,r=ut(t,true,false,1),t=t[2]&&t[2][t[1]]===n?1:r.length,u=Xt(t);++e<t;)u[e]=n[r[e]];
return u},J.bind=Mt,J.bindAll=function(n){for(var t=1<arguments.length?ut(arguments,true,false,1):bt(n),e=-1,r=t.length;++e<r;){var u=t[e];n[u]=ct(n[u],1,null,null,n)}return n},J.bindKey=function(n,t){return 2<arguments.length?ct(t,19,p(arguments,2),null,n):ct(t,3,null,null,n)},J.chain=function(n){return n=new Q(n),n.__chain__=true,n},J.compact=function(n){for(var t=-1,e=n?n.length:0,r=[];++t<e;){var u=n[t];u&&r.push(u)}return r},J.compose=function(){for(var n=arguments,t=n.length;t--;)if(!dt(n[t]))throw new ie;
return function(){for(var t=arguments,e=n.length;e--;)t=[n[e].apply(this,t)];return t[0]}},J.constant=function(n){return function(){return n}},J.countBy=Ke,J.create=function(n,t){var e=nt(n);return t?U(e,t):e},J.createCallback=function(n,t,e){var r=typeof n;if(null==n||"function"==r)return tt(n,t,e);if("object"!=r)return Jt(n);var u=Fe(n),o=u[0],i=n[o];return 1!=u.length||i!==i||wt(i)?function(t){for(var e=u.length,r=false;e--&&(r=ot(t[u[e]],n[u[e]],null,true)););return r}:function(n){return n=n[o],i===n&&(0!==i||1/i==1/n)
}},J.curry=function(n,t){return t=typeof t=="number"?t:+t||n.length,ct(n,4,null,null,null,t)},J.debounce=Vt,J.defaults=_,J.defer=function(n){if(!dt(n))throw new ie;var t=p(arguments,1);return _e(function(){n.apply(v,t)},1)},J.delay=function(n,t){if(!dt(n))throw new ie;var e=p(arguments,2);return _e(function(){n.apply(v,e)},t)},J.difference=function(n){return rt(n,ut(arguments,true,true,1))},J.filter=Nt,J.flatten=function(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=typeof t!="function"&&r&&r[t]===n?null:t,t=false),null!=e&&(n=Rt(n,e,r)),ut(n,t)
},J.forEach=St,J.forEachRight=Et,J.forIn=g,J.forInRight=function(n,t,e){var r=[];g(n,function(n,t){r.push(t,n)});var u=r.length;for(t=tt(t,e,3);u--&&false!==t(r[u--],r[u],n););return n},J.forOwn=h,J.forOwnRight=mt,J.functions=bt,J.groupBy=Le,J.indexBy=Me,J.initial=function(n,t,e){var r=0,u=n?n.length:0;if(typeof t!="number"&&null!=t){var o=u;for(t=J.createCallback(t,e,3);o--&&t(n[o],o,n);)r++}else r=null==t||e?1:t||r;return p(n,0,Se(Ie(0,u-r),u))},J.intersection=function(){for(var e=[],r=-1,u=arguments.length,i=a(),f=st(),p=f===n,s=a();++r<u;){var v=arguments[r];
(Te(v)||yt(v))&&(e.push(v),i.push(p&&v.length>=b&&o(r?e[r]:s)))}var p=e[0],h=-1,g=p?p.length:0,y=[];n:for(;++h<g;){var m=i[0],v=p[h];if(0>(m?t(m,v):f(s,v))){for(r=u,(m||s).push(v);--r;)if(m=i[r],0>(m?t(m,v):f(e[r],v)))continue n;y.push(v)}}for(;u--;)(m=i[u])&&c(m);return l(i),l(s),y},J.invert=_t,J.invoke=function(n,t){var e=p(arguments,2),r=-1,u=typeof t=="function",o=n?n.length:0,i=Xt(typeof o=="number"?o:0);return St(n,function(n){i[++r]=(u?t:n[t]).apply(n,e)}),i},J.keys=Fe,J.map=Rt,J.mapValues=function(n,t,e){var r={};
return t=J.createCallback(t,e,3),h(n,function(n,e,u){r[e]=t(n,e,u)}),r},J.max=At,J.memoize=function(n,t){function e(){var r=e.cache,u=t?t.apply(this,arguments):m+arguments[0];return me.call(r,u)?r[u]:r[u]=n.apply(this,arguments)}if(!dt(n))throw new ie;return e.cache={},e},J.merge=function(n){var t=arguments,e=2;if(!wt(n))return n;if("number"!=typeof t[2]&&(e=t.length),3<e&&"function"==typeof t[e-2])var r=tt(t[--e-1],t[e--],2);else 2<e&&"function"==typeof t[e-1]&&(r=t[--e]);for(var t=p(arguments,1,e),u=-1,o=a(),i=a();++u<e;)it(n,t[u],r,o,i);
return l(o),l(i),n},J.min=function(n,t,e){var u=1/0,o=u;if(typeof t!="function"&&e&&e[t]===n&&(t=null),null==t&&Te(n)){e=-1;for(var i=n.length;++e<i;){var a=n[e];a<o&&(o=a)}}else t=null==t&&kt(n)?r:J.createCallback(t,e,3),St(n,function(n,e,r){e=t(n,e,r),e<u&&(u=e,o=n)});return o},J.omit=function(n,t,e){var r={};if(typeof t!="function"){var u=[];g(n,function(n,t){u.push(t)});for(var u=rt(u,ut(arguments,true,false,1)),o=-1,i=u.length;++o<i;){var a=u[o];r[a]=n[a]}}else t=J.createCallback(t,e,3),g(n,function(n,e,u){t(n,e,u)||(r[e]=n)
});return r},J.once=function(n){var t,e;if(!dt(n))throw new ie;return function(){return t?e:(t=true,e=n.apply(this,arguments),n=null,e)}},J.pairs=function(n){for(var t=-1,e=Fe(n),r=e.length,u=Xt(r);++t<r;){var o=e[t];u[t]=[o,n[o]]}return u},J.partial=function(n){return ct(n,16,p(arguments,1))},J.partialRight=function(n){return ct(n,32,null,p(arguments,1))},J.pick=function(n,t,e){var r={};if(typeof t!="function")for(var u=-1,o=ut(arguments,true,false,1),i=wt(n)?o.length:0;++u<i;){var a=o[u];a in n&&(r[a]=n[a])
}else t=J.createCallback(t,e,3),g(n,function(n,e,u){t(n,e,u)&&(r[e]=n)});return r},J.pluck=Ve,J.property=Jt,J.pull=function(n){for(var t=arguments,e=0,r=t.length,u=n?n.length:0;++e<r;)for(var o=-1,i=t[e];++o<u;)n[o]===i&&(de.call(n,o--,1),u--);return n},J.range=function(n,t,e){n=+n||0,e=typeof e=="number"?e:+e||1,null==t&&(t=n,n=0);var r=-1;t=Ie(0,se((t-n)/(e||1)));for(var u=Xt(t);++r<t;)u[r]=n,n+=e;return u},J.reject=function(n,t,e){return t=J.createCallback(t,e,3),Nt(n,function(n,e,r){return!t(n,e,r)
})},J.remove=function(n,t,e){var r=-1,u=n?n.length:0,o=[];for(t=J.createCallback(t,e,3);++r<u;)e=n[r],t(e,r,n)&&(o.push(e),de.call(n,r--,1),u--);return o},J.rest=qt,J.shuffle=Tt,J.sortBy=function(n,t,e){var r=-1,o=Te(t),i=n?n.length:0,p=Xt(typeof i=="number"?i:0);for(o||(t=J.createCallback(t,e,3)),St(n,function(n,e,u){var i=p[++r]=f();o?i.m=Rt(t,function(t){return n[t]}):(i.m=a())[0]=t(n,e,u),i.n=r,i.o=n}),i=p.length,p.sort(u);i--;)n=p[i],p[i]=n.o,o||l(n.m),c(n);return p},J.tap=function(n,t){return t(n),n
},J.throttle=function(n,t,e){var r=true,u=true;if(!dt(n))throw new ie;return false===e?r=false:wt(e)&&(r="leading"in e?e.leading:r,u="trailing"in e?e.trailing:u),L.leading=r,L.maxWait=t,L.trailing=u,Vt(n,t,L)},J.times=function(n,t,e){n=-1<(n=+n)?n:0;var r=-1,u=Xt(n);for(t=tt(t,e,1);++r<n;)u[r]=t(r);return u},J.toArray=function(n){return n&&typeof n.length=="number"?p(n):xt(n)},J.transform=function(n,t,e,r){var u=Te(n);if(null==e)if(u)e=[];else{var o=n&&n.constructor;e=nt(o&&o.prototype)}return t&&(t=J.createCallback(t,r,4),(u?St:h)(n,function(n,r,u){return t(e,n,r,u)
})),e},J.union=function(){return ft(ut(arguments,true,true))},J.uniq=Pt,J.values=xt,J.where=Nt,J.without=function(n){return rt(n,p(arguments,1))},J.wrap=function(n,t){return ct(t,16,[n])},J.xor=function(){for(var n=-1,t=arguments.length;++n<t;){var e=arguments[n];if(Te(e)||yt(e))var r=r?ft(rt(r,e).concat(rt(e,r))):e}return r||[]},J.zip=Kt,J.zipObject=Lt,J.collect=Rt,J.drop=qt,J.each=St,J.eachRight=Et,J.extend=U,J.methods=bt,J.object=Lt,J.select=Nt,J.tail=qt,J.unique=Pt,J.unzip=Kt,Gt(J),J.clone=function(n,t,e,r){return typeof t!="boolean"&&null!=t&&(r=e,e=t,t=false),Z(n,t,typeof e=="function"&&tt(e,r,1))
},J.cloneDeep=function(n,t,e){return Z(n,true,typeof t=="function"&&tt(t,e,1))},J.contains=Ct,J.escape=function(n){return null==n?"":oe(n).replace(ze,pt)},J.every=Ot,J.find=It,J.findIndex=function(n,t,e){var r=-1,u=n?n.length:0;for(t=J.createCallback(t,e,3);++r<u;)if(t(n[r],r,n))return r;return-1},J.findKey=function(n,t,e){var r;return t=J.createCallback(t,e,3),h(n,function(n,e,u){return t(n,e,u)?(r=e,false):void 0}),r},J.findLast=function(n,t,e){var r;return t=J.createCallback(t,e,3),Et(n,function(n,e,u){return t(n,e,u)?(r=n,false):void 0
}),r},J.findLastIndex=function(n,t,e){var r=n?n.length:0;for(t=J.createCallback(t,e,3);r--;)if(t(n[r],r,n))return r;return-1},J.findLastKey=function(n,t,e){var r;return t=J.createCallback(t,e,3),mt(n,function(n,e,u){return t(n,e,u)?(r=e,false):void 0}),r},J.has=function(n,t){return n?me.call(n,t):false},J.identity=Ut,J.indexOf=Wt,J.isArguments=yt,J.isArray=Te,J.isBoolean=function(n){return true===n||false===n||n&&typeof n=="object"&&ce.call(n)==T||false},J.isDate=function(n){return n&&typeof n=="object"&&ce.call(n)==F||false
},J.isElement=function(n){return n&&1===n.nodeType||false},J.isEmpty=function(n){var t=true;if(!n)return t;var e=ce.call(n),r=n.length;return e==$||e==P||e==D||e==q&&typeof r=="number"&&dt(n.splice)?!r:(h(n,function(){return t=false}),t)},J.isEqual=function(n,t,e,r){return ot(n,t,typeof e=="function"&&tt(e,r,2))},J.isFinite=function(n){return Ce(n)&&!Oe(parseFloat(n))},J.isFunction=dt,J.isNaN=function(n){return jt(n)&&n!=+n},J.isNull=function(n){return null===n},J.isNumber=jt,J.isObject=wt,J.isPlainObject=Pe,J.isRegExp=function(n){return n&&typeof n=="object"&&ce.call(n)==z||false
},J.isString=kt,J.isUndefined=function(n){return typeof n=="undefined"},J.lastIndexOf=function(n,t,e){var r=n?n.length:0;for(typeof e=="number"&&(r=(0>e?Ie(0,r+e):Se(e,r-1))+1);r--;)if(n[r]===t)return r;return-1},J.mixin=Gt,J.noConflict=function(){return e._=le,this},J.noop=Ht,J.now=Ue,J.parseInt=Ge,J.random=function(n,t,e){var r=null==n,u=null==t;return null==e&&(typeof n=="boolean"&&u?(e=n,n=1):u||typeof t!="boolean"||(e=t,u=true)),r&&u&&(t=1),n=+n||0,u?(t=n,n=0):t=+t||0,e||n%1||t%1?(e=Re(),Se(n+e*(t-n+parseFloat("1e-"+((e+"").length-1))),t)):at(n,t)
},J.reduce=Dt,J.reduceRight=$t,J.result=function(n,t){if(n){var e=n[t];return dt(e)?n[t]():e}},J.runInContext=s,J.size=function(n){var t=n?n.length:0;return typeof t=="number"?t:Fe(n).length},J.some=Ft,J.sortedIndex=zt,J.template=function(n,t,e){var r=J.templateSettings;n=oe(n||""),e=_({},e,r);var u,o=_({},e.imports,r.imports),r=Fe(o),o=xt(o),a=0,f=e.interpolate||S,l="__p+='",f=ue((e.escape||S).source+"|"+f.source+"|"+(f===N?x:S).source+"|"+(e.evaluate||S).source+"|$","g");n.replace(f,function(t,e,r,o,f,c){return r||(r=o),l+=n.slice(a,c).replace(R,i),e&&(l+="'+__e("+e+")+'"),f&&(u=true,l+="';"+f+";\n__p+='"),r&&(l+="'+((__t=("+r+"))==null?'':__t)+'"),a=c+t.length,t
}),l+="';",f=e=e.variable,f||(e="obj",l="with("+e+"){"+l+"}"),l=(u?l.replace(w,""):l).replace(j,"$1").replace(k,"$1;"),l="function("+e+"){"+(f?"":e+"||("+e+"={});")+"var __t,__p='',__e=_.escape"+(u?",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}":";")+l+"return __p}";try{var c=ne(r,"return "+l).apply(v,o)}catch(p){throw p.source=l,p}return t?c(t):(c.source=l,c)},J.unescape=function(n){return null==n?"":oe(n).replace(qe,gt)},J.uniqueId=function(n){var t=++y;return oe(null==n?"":n)+t
},J.all=Ot,J.any=Ft,J.detect=It,J.findWhere=It,J.foldl=Dt,J.foldr=$t,J.include=Ct,J.inject=Dt,Gt(function(){var n={};return h(J,function(t,e){J.prototype[e]||(n[e]=t)}),n}(),false),J.first=Bt,J.last=function(n,t,e){var r=0,u=n?n.length:0;if(typeof t!="number"&&null!=t){var o=u;for(t=J.createCallback(t,e,3);o--&&t(n[o],o,n);)r++}else if(r=t,null==r||e)return n?n[u-1]:v;return p(n,Ie(0,u-r))},J.sample=function(n,t,e){return n&&typeof n.length!="number"&&(n=xt(n)),null==t||e?n?n[at(0,n.length-1)]:v:(n=Tt(n),n.length=Se(Ie(0,t),n.length),n)
},J.take=Bt,J.head=Bt,h(J,function(n,t){var e="sample"!==t;J.prototype[t]||(J.prototype[t]=function(t,r){var u=this.__chain__,o=n(this.__wrapped__,t,r);return u||null!=t&&(!r||e&&typeof t=="function")?new Q(o,u):o})}),J.VERSION="2.4.1",J.prototype.chain=function(){return this.__chain__=true,this},J.prototype.toString=function(){return oe(this.__wrapped__)},J.prototype.value=Qt,J.prototype.valueOf=Qt,St(["join","pop","shift"],function(n){var t=ae[n];J.prototype[n]=function(){var n=this.__chain__,e=t.apply(this.__wrapped__,arguments);
return n?new Q(e,n):e}}),St(["push","reverse","sort","unshift"],function(n){var t=ae[n];J.prototype[n]=function(){return t.apply(this.__wrapped__,arguments),this}}),St(["concat","slice","splice"],function(n){var t=ae[n];J.prototype[n]=function(){return new Q(t.apply(this.__wrapped__,arguments),this.__chain__)}}),J}var v,h=[],g=[],y=0,m=+new Date+"",b=75,_=40,d=" \t\x0B\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000",w=/\b__p\+='';/g,j=/\b(__p\+=)''\+/g,k=/(__e\(.*?\)|\b__t\))\+'';/g,x=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,C=/\w*$/,O=/^\s*function[ \n\r\t]+\w/,N=/<%=([\s\S]+?)%>/g,I=RegExp("^["+d+"]*0+(?=.$)"),S=/($^)/,E=/\bthis\b/,R=/['\n\r\t\u2028\u2029\\]/g,A="Array Boolean Date Function Math Number Object RegExp String _ attachEvent clearTimeout isFinite isNaN parseInt setTimeout".split(" "),D="[object Arguments]",$="[object Array]",T="[object Boolean]",F="[object Date]",B="[object Function]",W="[object Number]",q="[object Object]",z="[object RegExp]",P="[object String]",K={};
K[B]=false,K[D]=K[$]=K[T]=K[F]=K[W]=K[q]=K[z]=K[P]=true;var L={leading:false,maxWait:0,trailing:false},M={configurable:false,enumerable:false,value:null,writable:false},V={"boolean":false,"function":true,object:true,number:false,string:false,undefined:false},U={"\\":"\\","'":"'","\n":"n","\r":"r","\t":"t","\u2028":"u2028","\u2029":"u2029"},G=V[typeof window]&&window||this,H=V[typeof exports]&&exports&&!exports.nodeType&&exports,J=V[typeof module]&&module&&!module.nodeType&&module,Q=J&&J.exports===H&&H,X=V[typeof global]&&global;!X||X.global!==X&&X.window!==X||(G=X);
var Y=s();typeof define=="function"&&typeof define.amd=="object"&&define.amd?(G._=Y, define(function(){return Y})):H&&J?Q?(J.exports=Y)._=Y:H._=Y:G._=Y}).call(this);
/*!
 * typeahead.js 0.10.2
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

!function(a){var b={isMsie:function(){return/(msie|trident)/i.test(navigator.userAgent)?navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2]:!1},isBlankString:function(a){return!a||/^\s*$/.test(a)},escapeRegExChars:function(a){return a.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")},isString:function(a){return"string"==typeof a},isNumber:function(a){return"number"==typeof a},isArray:a.isArray,isFunction:a.isFunction,isObject:a.isPlainObject,isUndefined:function(a){return"undefined"==typeof a},bind:a.proxy,each:function(b,c){function d(a,b){return c(b,a)}a.each(b,d)},map:a.map,filter:a.grep,every:function(b,c){var d=!0;return b?(a.each(b,function(a,e){return(d=c.call(null,e,a,b))?void 0:!1}),!!d):d},some:function(b,c){var d=!1;return b?(a.each(b,function(a,e){return(d=c.call(null,e,a,b))?!1:void 0}),!!d):d},mixin:a.extend,getUniqueId:function(){var a=0;return function(){return a++}}(),templatify:function(b){function c(){return String(b)}return a.isFunction(b)?b:c},defer:function(a){setTimeout(a,0)},debounce:function(a,b,c){var d,e;return function(){var f,g,h=this,i=arguments;return f=function(){d=null,c||(e=a.apply(h,i))},g=c&&!d,clearTimeout(d),d=setTimeout(f,b),g&&(e=a.apply(h,i)),e}},throttle:function(a,b){var c,d,e,f,g,h;return g=0,h=function(){g=new Date,e=null,f=a.apply(c,d)},function(){var i=new Date,j=b-(i-g);return c=this,d=arguments,0>=j?(clearTimeout(e),e=null,g=i,f=a.apply(c,d)):e||(e=setTimeout(h,j)),f}},noop:function(){}},c={wrapper:'<span class="twitter-typeahead"></span>',dropdown:'<span class="tt-dropdown-menu"></span>',dataset:'<div class="tt-dataset-%CLASS%"></div>',suggestions:'<span class="tt-suggestions"></span>',suggestion:'<div class="tt-suggestion"></div>'},d={wrapper:{position:"relative",display:"inline-block"},hint:{position:"absolute",top:"0",left:"0",borderColor:"transparent",boxShadow:"none"},input:{position:"relative",verticalAlign:"top",backgroundColor:"transparent"},inputWithNoHint:{position:"relative",verticalAlign:"top"},dropdown:{position:"absolute",top:"100%",left:"0",zIndex:"100",display:"none"},suggestions:{display:"block"},suggestion:{whiteSpace:"nowrap",cursor:"pointer"},suggestionChild:{whiteSpace:"normal"},ltr:{left:"0",right:"auto"},rtl:{left:"auto",right:" 0"}};b.isMsie()&&b.mixin(d.input,{backgroundImage:"url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"}),b.isMsie()&&b.isMsie()<=7&&b.mixin(d.input,{marginTop:"-1px"});var e=function(){function c(b){b&&b.el||a.error("EventBus initialized without el"),this.$el=a(b.el)}var d="typeahead:";return b.mixin(c.prototype,{trigger:function(a){var b=[].slice.call(arguments,1);this.$el.trigger(d+a,b)}}),c}(),f=function(){function a(a,b,c,d){var e;if(!c)return this;for(b=b.split(i),c=d?h(c,d):c,this._callbacks=this._callbacks||{};e=b.shift();)this._callbacks[e]=this._callbacks[e]||{sync:[],async:[]},this._callbacks[e][a].push(c);return this}function b(b,c,d){return a.call(this,"async",b,c,d)}function c(b,c,d){return a.call(this,"sync",b,c,d)}function d(a){var b;if(!this._callbacks)return this;for(a=a.split(i);b=a.shift();)delete this._callbacks[b];return this}function e(a){var b,c,d,e,g;if(!this._callbacks)return this;for(a=a.split(i),d=[].slice.call(arguments,1);(b=a.shift())&&(c=this._callbacks[b]);)e=f(c.sync,this,[b].concat(d)),g=f(c.async,this,[b].concat(d)),e()&&j(g);return this}function f(a,b,c){function d(){for(var d,e=0;!d&&e<a.length;e+=1)d=a[e].apply(b,c)===!1;return!d}return d}function g(){var a;return a=window.setImmediate?function(a){setImmediate(function(){a()})}:function(a){setTimeout(function(){a()},0)}}function h(a,b){return a.bind?a.bind(b):function(){a.apply(b,[].slice.call(arguments,0))}}var i=/\s+/,j=g();return{onSync:c,onAsync:b,off:d,trigger:e}}(),g=function(a){function c(a,c,d){for(var e,f=[],g=0;g<a.length;g++)f.push(b.escapeRegExChars(a[g]));return e=d?"\\b("+f.join("|")+")\\b":"("+f.join("|")+")",c?new RegExp(e):new RegExp(e,"i")}var d={node:null,pattern:null,tagName:"strong",className:null,wordsOnly:!1,caseSensitive:!1};return function(e){function f(b){var c,d;return(c=h.exec(b.data))&&(wrapperNode=a.createElement(e.tagName),e.className&&(wrapperNode.className=e.className),d=b.splitText(c.index),d.splitText(c[0].length),wrapperNode.appendChild(d.cloneNode(!0)),b.parentNode.replaceChild(wrapperNode,d)),!!c}function g(a,b){for(var c,d=3,e=0;e<a.childNodes.length;e++)c=a.childNodes[e],c.nodeType===d?e+=b(c)?1:0:g(c,b)}var h;e=b.mixin({},d,e),e.node&&e.pattern&&(e.pattern=b.isArray(e.pattern)?e.pattern:[e.pattern],h=c(e.pattern,e.caseSensitive,e.wordsOnly),g(e.node,f))}}(window.document),h=function(){function c(c){var e,f,g,i,j=this;c=c||{},c.input||a.error("input is missing"),e=b.bind(this._onBlur,this),f=b.bind(this._onFocus,this),g=b.bind(this._onKeydown,this),i=b.bind(this._onInput,this),this.$hint=a(c.hint),this.$input=a(c.input).on("blur.tt",e).on("focus.tt",f).on("keydown.tt",g),0===this.$hint.length&&(this.setHint=this.getHint=this.clearHint=this.clearHintIfInvalid=b.noop),b.isMsie()?this.$input.on("keydown.tt keypress.tt cut.tt paste.tt",function(a){h[a.which||a.keyCode]||b.defer(b.bind(j._onInput,j,a))}):this.$input.on("input.tt",i),this.query=this.$input.val(),this.$overflowHelper=d(this.$input)}function d(b){return a('<pre aria-hidden="true"></pre>').css({position:"absolute",visibility:"hidden",whiteSpace:"pre",fontFamily:b.css("font-family"),fontSize:b.css("font-size"),fontStyle:b.css("font-style"),fontVariant:b.css("font-variant"),fontWeight:b.css("font-weight"),wordSpacing:b.css("word-spacing"),letterSpacing:b.css("letter-spacing"),textIndent:b.css("text-indent"),textRendering:b.css("text-rendering"),textTransform:b.css("text-transform")}).insertAfter(b)}function e(a,b){return c.normalizeQuery(a)===c.normalizeQuery(b)}function g(a){return a.altKey||a.ctrlKey||a.metaKey||a.shiftKey}var h;return h={9:"tab",27:"esc",37:"left",39:"right",13:"enter",38:"up",40:"down"},c.normalizeQuery=function(a){return(a||"").replace(/^\s*/g,"").replace(/\s{2,}/g," ")},b.mixin(c.prototype,f,{_onBlur:function(){this.resetInputValue(),this.trigger("blurred")},_onFocus:function(){this.trigger("focused")},_onKeydown:function(a){var b=h[a.which||a.keyCode];this._managePreventDefault(b,a),b&&this._shouldTrigger(b,a)&&this.trigger(b+"Keyed",a)},_onInput:function(){this._checkInputValue()},_managePreventDefault:function(a,b){var c,d,e;switch(a){case"tab":d=this.getHint(),e=this.getInputValue(),c=d&&d!==e&&!g(b);break;case"up":case"down":c=!g(b);break;default:c=!1}c&&b.preventDefault()},_shouldTrigger:function(a,b){var c;switch(a){case"tab":c=!g(b);break;default:c=!0}return c},_checkInputValue:function(){var a,b,c;a=this.getInputValue(),b=e(a,this.query),c=b?this.query.length!==a.length:!1,b?c&&this.trigger("whitespaceChanged",this.query):this.trigger("queryChanged",this.query=a)},focus:function(){this.$input.focus()},blur:function(){this.$input.blur()},getQuery:function(){return this.query},setQuery:function(a){this.query=a},getInputValue:function(){return this.$input.val()},setInputValue:function(a,b){this.$input.val(a),b?this.clearHint():this._checkInputValue()},resetInputValue:function(){this.setInputValue(this.query,!0)},getHint:function(){return this.$hint.val()},setHint:function(a){this.$hint.val(a)},clearHint:function(){this.setHint("")},clearHintIfInvalid:function(){var a,b,c,d;a=this.getInputValue(),b=this.getHint(),c=a!==b&&0===b.indexOf(a),d=""!==a&&c&&!this.hasOverflow(),!d&&this.clearHint()},getLanguageDirection:function(){return(this.$input.css("direction")||"ltr").toLowerCase()},hasOverflow:function(){var a=this.$input.width()-2;return this.$overflowHelper.text(this.getInputValue()),this.$overflowHelper.width()>=a},isCursorAtEnd:function(){var a,c,d;return a=this.$input.val().length,c=this.$input[0].selectionStart,b.isNumber(c)?c===a:document.selection?(d=document.selection.createRange(),d.moveStart("character",-a),a===d.text.length):!0},destroy:function(){this.$hint.off(".tt"),this.$input.off(".tt"),this.$hint=this.$input=this.$overflowHelper=null}}),c}(),i=function(){function e(d){d=d||{},d.templates=d.templates||{},d.source||a.error("missing source"),d.name&&!j(d.name)&&a.error("invalid dataset name: "+d.name),this.query=null,this.highlight=!!d.highlight,this.name=d.name||b.getUniqueId(),this.source=d.source,this.displayFn=h(d.display||d.displayKey),this.templates=i(d.templates,this.displayFn),this.$el=a(c.dataset.replace("%CLASS%",this.name))}function h(a){function c(b){return b[a]}return a=a||"value",b.isFunction(a)?a:c}function i(a,c){function d(a){return"<p>"+c(a)+"</p>"}return{empty:a.empty&&b.templatify(a.empty),header:a.header&&b.templatify(a.header),footer:a.footer&&b.templatify(a.footer),suggestion:a.suggestion||d}}function j(a){return/^[_a-zA-Z0-9-]+$/.test(a)}var k="ttDataset",l="ttValue",m="ttDatum";return e.extractDatasetName=function(b){return a(b).data(k)},e.extractValue=function(b){return a(b).data(l)},e.extractDatum=function(b){return a(b).data(m)},b.mixin(e.prototype,f,{_render:function(e,f){function h(){return p.templates.empty({query:e,isEmpty:!0})}function i(){function h(b){var e;return e=a(c.suggestion).append(p.templates.suggestion(b)).data(k,p.name).data(l,p.displayFn(b)).data(m,b),e.children().each(function(){a(this).css(d.suggestionChild)}),e}var i,j;return i=a(c.suggestions).css(d.suggestions),j=b.map(f,h),i.append.apply(i,j),p.highlight&&g({node:i[0],pattern:e}),i}function j(){return p.templates.header({query:e,isEmpty:!o})}function n(){return p.templates.footer({query:e,isEmpty:!o})}if(this.$el){var o,p=this;this.$el.empty(),o=f&&f.length,!o&&this.templates.empty?this.$el.html(h()).prepend(p.templates.header?j():null).append(p.templates.footer?n():null):o&&this.$el.html(i()).prepend(p.templates.header?j():null).append(p.templates.footer?n():null),this.trigger("rendered")}},getRoot:function(){return this.$el},update:function(a){function b(b){c.canceled||a!==c.query||c._render(a,b)}var c=this;this.query=a,this.canceled=!1,this.source(a,b)},cancel:function(){this.canceled=!0},clear:function(){this.cancel(),this.$el.empty(),this.trigger("rendered")},isEmpty:function(){return this.$el.is(":empty")},destroy:function(){this.$el=null}}),e}(),j=function(){function c(c){var d,f,g,h=this;c=c||{},c.menu||a.error("menu is required"),this.isOpen=!1,this.isEmpty=!0,this.datasets=b.map(c.datasets,e),d=b.bind(this._onSuggestionClick,this),f=b.bind(this._onSuggestionMouseEnter,this),g=b.bind(this._onSuggestionMouseLeave,this),this.$menu=a(c.menu).on("click.tt",".tt-suggestion",d).on("mouseenter.tt",".tt-suggestion",f).on("mouseleave.tt",".tt-suggestion",g),b.each(this.datasets,function(a){h.$menu.append(a.getRoot()),a.onSync("rendered",h._onRendered,h)})}function e(a){return new i(a)}return b.mixin(c.prototype,f,{_onSuggestionClick:function(b){this.trigger("suggestionClicked",a(b.currentTarget))},_onSuggestionMouseEnter:function(b){this._removeCursor(),this._setCursor(a(b.currentTarget),!0)},_onSuggestionMouseLeave:function(){this._removeCursor()},_onRendered:function(){function a(a){return a.isEmpty()}this.isEmpty=b.every(this.datasets,a),this.isEmpty?this._hide():this.isOpen&&this._show(),this.trigger("datasetRendered")},_hide:function(){this.$menu.hide()},_show:function(){this.$menu.css("display","block")},_getSuggestions:function(){return this.$menu.find(".tt-suggestion")},_getCursor:function(){return this.$menu.find(".tt-cursor").first()},_setCursor:function(a,b){a.first().addClass("tt-cursor"),!b&&this.trigger("cursorMoved")},_removeCursor:function(){this._getCursor().removeClass("tt-cursor")},_moveCursor:function(a){var b,c,d,e;if(this.isOpen){if(c=this._getCursor(),b=this._getSuggestions(),this._removeCursor(),d=b.index(c)+a,d=(d+1)%(b.length+1)-1,-1===d)return void this.trigger("cursorRemoved");-1>d&&(d=b.length-1),this._setCursor(e=b.eq(d)),this._ensureVisible(e)}},_ensureVisible:function(a){var b,c,d,e;b=a.position().top,c=b+a.outerHeight(!0),d=this.$menu.scrollTop(),e=this.$menu.height()+parseInt(this.$menu.css("paddingTop"),10)+parseInt(this.$menu.css("paddingBottom"),10),0>b?this.$menu.scrollTop(d+b):c>e&&this.$menu.scrollTop(d+(c-e))},close:function(){this.isOpen&&(this.isOpen=!1,this._removeCursor(),this._hide(),this.trigger("closed"))},open:function(){this.isOpen||(this.isOpen=!0,!this.isEmpty&&this._show(),this.trigger("opened"))},setLanguageDirection:function(a){this.$menu.css("ltr"===a?d.ltr:d.rtl)},moveCursorUp:function(){this._moveCursor(-1)},moveCursorDown:function(){this._moveCursor(1)},getDatumForSuggestion:function(a){var b=null;return a.length&&(b={raw:i.extractDatum(a),value:i.extractValue(a),datasetName:i.extractDatasetName(a)}),b},getDatumForCursor:function(){return this.getDatumForSuggestion(this._getCursor().first())},getDatumForTopSuggestion:function(){return this.getDatumForSuggestion(this._getSuggestions().first())},update:function(a){function c(b){b.update(a)}b.each(this.datasets,c)},empty:function(){function a(a){a.clear()}b.each(this.datasets,a),this.isEmpty=!0},isVisible:function(){return this.isOpen&&!this.isEmpty},destroy:function(){function a(a){a.destroy()}this.$menu.off(".tt"),this.$menu=null,b.each(this.datasets,a)}}),c}(),k=function(){function f(c){var d,f,i;c=c||{},c.input||a.error("missing input"),this.isActivated=!1,this.autoselect=!!c.autoselect,this.minLength=b.isNumber(c.minLength)?c.minLength:1,this.$node=g(c.input,c.withHint),d=this.$node.find(".tt-dropdown-menu"),f=this.$node.find(".tt-input"),i=this.$node.find(".tt-hint"),f.on("blur.tt",function(a){var c,e,g;c=document.activeElement,e=d.is(c),g=d.has(c).length>0,b.isMsie()&&(e||g)&&(a.preventDefault(),a.stopImmediatePropagation(),b.defer(function(){f.focus()}))}),d.on("mousedown.tt",function(a){a.preventDefault()}),this.eventBus=c.eventBus||new e({el:f}),this.dropdown=new j({menu:d,datasets:c.datasets}).onSync("suggestionClicked",this._onSuggestionClicked,this).onSync("cursorMoved",this._onCursorMoved,this).onSync("cursorRemoved",this._onCursorRemoved,this).onSync("opened",this._onOpened,this).onSync("closed",this._onClosed,this).onAsync("datasetRendered",this._onDatasetRendered,this),this.input=new h({input:f,hint:i}).onSync("focused",this._onFocused,this).onSync("blurred",this._onBlurred,this).onSync("enterKeyed",this._onEnterKeyed,this).onSync("tabKeyed",this._onTabKeyed,this).onSync("escKeyed",this._onEscKeyed,this).onSync("upKeyed",this._onUpKeyed,this).onSync("downKeyed",this._onDownKeyed,this).onSync("leftKeyed",this._onLeftKeyed,this).onSync("rightKeyed",this._onRightKeyed,this).onSync("queryChanged",this._onQueryChanged,this).onSync("whitespaceChanged",this._onWhitespaceChanged,this),this._setLanguageDirection()}function g(b,e){var f,g,h,j;f=a(b),g=a(c.wrapper).css(d.wrapper),h=a(c.dropdown).css(d.dropdown),j=f.clone().css(d.hint).css(i(f)),j.val("").removeData().addClass("tt-hint").removeAttr("id name placeholder").prop("disabled",!0).attr({autocomplete:"off",spellcheck:"false"}),f.data(l,{dir:f.attr("dir"),autocomplete:f.attr("autocomplete"),spellcheck:f.attr("spellcheck"),style:f.attr("style")}),f.addClass("tt-input").attr({autocomplete:"off",spellcheck:!1}).css(e?d.input:d.inputWithNoHint);try{!f.attr("dir")&&f.attr("dir","auto")}catch(k){}return f.wrap(g).parent().prepend(e?j:null).append(h)}function i(a){return{backgroundAttachment:a.css("background-attachment"),backgroundClip:a.css("background-clip"),backgroundColor:a.css("background-color"),backgroundImage:a.css("background-image"),backgroundOrigin:a.css("background-origin"),backgroundPosition:a.css("background-position"),backgroundRepeat:a.css("background-repeat"),backgroundSize:a.css("background-size")}}function k(a){var c=a.find(".tt-input");b.each(c.data(l),function(a,d){b.isUndefined(a)?c.removeAttr(d):c.attr(d,a)}),c.detach().removeData(l).removeClass("tt-input").insertAfter(a),a.remove()}var l="ttAttrs";return b.mixin(f.prototype,{_onSuggestionClicked:function(a,b){var c;(c=this.dropdown.getDatumForSuggestion(b))&&this._select(c)},_onCursorMoved:function(){var a=this.dropdown.getDatumForCursor();this.input.setInputValue(a.value,!0),this.eventBus.trigger("cursorchanged",a.raw,a.datasetName)},_onCursorRemoved:function(){this.input.resetInputValue(),this._updateHint()},_onDatasetRendered:function(){this._updateHint()},_onOpened:function(){this._updateHint(),this.eventBus.trigger("opened")},_onClosed:function(){this.input.clearHint(),this.eventBus.trigger("closed")},_onFocused:function(){this.isActivated=!0,this.dropdown.open()},_onBlurred:function(){this.isActivated=!1,this.dropdown.empty(),this.dropdown.close()},_onEnterKeyed:function(a,b){var c,d;c=this.dropdown.getDatumForCursor(),d=this.dropdown.getDatumForTopSuggestion(),c?(this._select(c),b.preventDefault()):this.autoselect&&d&&(this._select(d),b.preventDefault())},_onTabKeyed:function(a,b){var c;(c=this.dropdown.getDatumForCursor())?(this._select(c),b.preventDefault()):this._autocomplete(!0)},_onEscKeyed:function(){this.dropdown.close(),this.input.resetInputValue()},_onUpKeyed:function(){var a=this.input.getQuery();this.dropdown.isEmpty&&a.length>=this.minLength?this.dropdown.update(a):this.dropdown.moveCursorUp(),this.dropdown.open()},_onDownKeyed:function(){var a=this.input.getQuery();this.dropdown.isEmpty&&a.length>=this.minLength?this.dropdown.update(a):this.dropdown.moveCursorDown(),this.dropdown.open()},_onLeftKeyed:function(){"rtl"===this.dir&&this._autocomplete()},_onRightKeyed:function(){"ltr"===this.dir&&this._autocomplete()},_onQueryChanged:function(a,b){this.input.clearHintIfInvalid(),b.length>=this.minLength?this.dropdown.update(b):this.dropdown.empty(),this.dropdown.open(),this._setLanguageDirection()},_onWhitespaceChanged:function(){this._updateHint(),this.dropdown.open()},_setLanguageDirection:function(){var a;this.dir!==(a=this.input.getLanguageDirection())&&(this.dir=a,this.$node.css("direction",a),this.dropdown.setLanguageDirection(a))},_updateHint:function(){var a,c,d,e,f,g;a=this.dropdown.getDatumForTopSuggestion(),a&&this.dropdown.isVisible()&&!this.input.hasOverflow()?(c=this.input.getInputValue(),d=h.normalizeQuery(c),e=b.escapeRegExChars(d),f=new RegExp("^(?:"+e+")(.+$)","i"),g=f.exec(a.value),g?this.input.setHint(c+g[1]):this.input.clearHint()):this.input.clearHint()},_autocomplete:function(a){var b,c,d,e;b=this.input.getHint(),c=this.input.getQuery(),d=a||this.input.isCursorAtEnd(),b&&c!==b&&d&&(e=this.dropdown.getDatumForTopSuggestion(),e&&this.input.setInputValue(e.value),this.eventBus.trigger("autocompleted",e.raw,e.datasetName))},_select:function(a){this.input.setQuery(a.value),this.input.setInputValue(a.value,!0),this._setLanguageDirection(),this.eventBus.trigger("selected",a.raw,a.datasetName),this.dropdown.close(),b.defer(b.bind(this.dropdown.empty,this.dropdown))},open:function(){this.dropdown.open()},close:function(){this.dropdown.close()},setVal:function(a){this.isActivated?this.input.setInputValue(a):(this.input.setQuery(a),this.input.setInputValue(a,!0)),this._setLanguageDirection()},getVal:function(){return this.input.getQuery()},destroy:function(){this.input.destroy(),this.dropdown.destroy(),k(this.$node),this.$node=null}}),f}();!function(){var c,d,f;c=a.fn.typeahead,d="ttTypeahead",f={initialize:function(c,f){function g(){var g,h,i=a(this);b.each(f,function(a){a.highlight=!!c.highlight}),h=new k({input:i,eventBus:g=new e({el:i}),withHint:b.isUndefined(c.hint)?!0:!!c.hint,minLength:c.minLength,autoselect:c.autoselect,datasets:f}),i.data(d,h)}return f=b.isArray(f)?f:[].slice.call(arguments,1),c=c||{},this.each(g)},open:function(){function b(){var b,c=a(this);(b=c.data(d))&&b.open()}return this.each(b)},close:function(){function b(){var b,c=a(this);(b=c.data(d))&&b.close()}return this.each(b)},val:function(b){function c(){var c,e=a(this);(c=e.data(d))&&c.setVal(b)}function e(a){var b,c;return(b=a.data(d))&&(c=b.getVal()),c}return arguments.length?this.each(c):e(this.first())},destroy:function(){function b(){var b,c=a(this);(b=c.data(d))&&(b.destroy(),c.removeData(d))}return this.each(b)}},a.fn.typeahead=function(a){return f[a]?f[a].apply(this,[].slice.call(arguments,1)):f.initialize.apply(this,arguments)},a.fn.typeahead.noConflict=function(){return a.fn.typeahead=c,this}}()}(window.jQuery);
bfe.define('src/bfestore', ['require', 'exports', 'module' , 'src/lib/lodash.min'], function(require, exports, module) {
    require("src/lib/lodash.min");

    exports.store = [];
    
    exports.storeDedup = function() {
        exports.store = _.uniq(exports.store, function(t) { 
            if (t.olang !== undefined) {
                return t.s + t.p + t.o + t.otype + t.olang
            } else if (t.odatatype !== undefined) {
                return t.s + t.p + t.o + t.otype + t.odatatype
            } else {
                return t.s + t.p + t.o + t.otype
            }
        });
        return exports.store;
    }
    
    exports.jsonld2store = function(jsonld) {
        jsonld.forEach(function(resource){
            var s = typeof resource["@id"] !== 'undefined' ? resource["@id"] : '_:b' + guid();
            for (var p in resource) {
                if (p !== "@id") {
                    resource[p].forEach(function(o) {
                        var tguid = guid();
                        var triple = {};
                        triple.guid = tguid;
                        triple.s = s;
                        triple.p = p;
                        if (o["@id"] !== undefined) {
                            triple.o = o["@id"];
                            triple.otype = "uri";
                        } else if (o["@value"] !== undefined) {
                            triple.o = o["@value"];
                            triple.otype = "literal";
                            if (o["@language"] !== undefined) {
                                triple.olang = o["@language"];
                            }
                        }
                        exports.store.push(triple);
                        });
                    }
                }
            // If a resource does not have a defined type, do we care?
        });
        return exports.store;
    }

    
    exports.store2jsonldExpanded = function() {
        var json = [];
        exports.storeDedup();
        groupedResources = _.groupBy(exports.store, function(t) { return t.s; });
        for (var resourceURI in groupedResources) {
            var j = {};
            j["@id"] = resourceURI;
            groupedProperties = _.groupBy(groupedResources[resourceURI], function(t) { return t.p; });
            for (var propertyURI in groupedProperties) {
                var prop = propertyURI;
                if (propertyURI == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    prop = "@type";
                }
                j[prop] = [];
                groupedProperties[propertyURI].forEach(function(r) {
                    if (prop == "@type" && r.otype == "uri") {
                        j[prop].push(r.o);
                    } else if (r.otype == "uri") {
                        j[prop].push({"@id": r.o});
                    } else {
                        var o = {}
                        if (r.olang !== undefined && r.olang !== "") {
                            o["@language"] = r.olang;
                        }
                        if (r.p=="@type"){
                          o = r.o;
                        } else {
                           o["@value"] = r.o;
                        }
                        j[prop].push(o);
                    }
                });
            }
            json.push(j);
        };
        return json;
    }
    
    exports.store2text = function() {
        var nl = "\n";
        var nlindent = nl + "\t";
        var nlindentindent = nl + "\t\t";
        var predata = "";
        var json = exports.store2jsonldExpanded();
        json.forEach(function(resource) {
            predata += nl + "ID: " + resource["@id"];
            if (resource["@type"] !== undefined) {
                predata += nlindent + "Type(s)";
                resource["@type"].forEach(function(t) {
                    //predata += nlindentindent + t["@id"];
                    if(t["@value"] !== undefined){
                        predata += nlindentindent + t["@value"];
                    } else {
                        predata += nlindentindent + t;
                    }
                });
            }
            for (var t in resource) {
                if (t !== "@type" && t !== "@id") {
                    var prop = t.replace("http://bibframe.org/vocab/", "bf:");
                    prop = prop.replace("http://id.loc.gov/vocabulary/relators/", "relators:");
                    prop = prop.replace("http://bibframe.org/vocab2/", "bf2:");
                    prop = prop.replace("http://rdaregistry.info/termList/", "rda");
                    predata += nlindent + prop;
                    resource[t].forEach(function(o) {
                        if (o["@id"] !== undefined) {
                            predata += nlindentindent + o["@id"];
                        } else {
                            predata += nlindentindent + o["@value"];
                        }
                    });
                }
            }
            predata += nl + nl;
        });
        return predata;
    }
    
    /**
    * Generates a GUID string.
    * @returns {String} The generated GUID.
    * @example GCt1438871386
    */
    function guid() {
        function _randomChoice() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            for (var i = 0; i < 1; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }
        return _randomChoice() + _randomChoice() + _randomChoice() + parseInt(Date.now() / 1000);
    }

});
bfe.define('src/bfelogging', ['require', 'exports', 'module' ], function(require, exports, module) {

    var level = "INFO";
    var toConsole = true;
    var domain = window.location.protocol + "//" + window.location.host + "/";
    
    exports.log = [];
    
    exports.getLog = function() {
        return exports.log;
    }
    
    exports.init = function(config) {
        if (config.logging !== undefined) {
            if (config.logging.level !== undefined && config.logging.level == "DEBUG") {
                level = config.logging.level;
            }
            if (config.logging.toConsole !== undefined && !config.logging.toConsole) {
                toConsole = config.logging.toConsole;
            }
        }
        var msg = "Logging instantiated: level is " + level + "; log to console is set to " + toConsole;
        exports.addMsg(new Error(), "INFO", msg);
        exports.addMsg(new Error(), "INFO", domain);
    };
    
    // acceptable ltypes are:  INFO, DEBUG, WARN, ERROR
    exports.addMsg = function(error, ltype, data, obj) {
        if (error.lineNumber === undefined && error.fileName === undefined) {
            // Not firefox, so let's try and see if it is chrome
            try {
                var stack = error.stack.split("\n");
                var fileinfo = stack[1].substring(stack[1].indexOf("(") + 1);
                fileinfo = fileinfo.replace(domain, "");
                var infoparts = fileinfo.split(":");
                error.fileName = infoparts[0];
                error.lineNumber = infoparts[1]; 
            } catch(e) {
                // Probably IE.
                error.fileName = "unknown";
                error.lineNumber = "?";     
                
            }
        }
        error.fileName = error.fileName.replace(domain, "");
        if (level == "INFO" && ltype.match(/INFO|WARN|ERROR/)) {
            setMsg(ltype, data, error, obj);
            consoleOut(ltype, data, error, obj);
        } else if (level == "DEBUG")  {
            setMsg(ltype, data, error, obj);
            consoleOut(ltype, data, error, obj);
        }
    };
    
    function consoleOut(ltype, data, error, obj) {
        if (toConsole) {
            console.log(error.fileName + ":" + error.lineNumber + " -> " + data);
            if (typeof data==="object" || data instanceof Array) {
                console.log(data);
            }
            if (obj !== undefined && (typeof obj==="object" || obj instanceof Array)) {
                console.log(obj);
            }
        }
    }
    
    function setMsg(ltype, data, error, obj) {
        var dateTime = new Date();
        var locale = dateTime.toJSON();
        var localestr = dateTime.toLocaleString();
        var entry = {};
        entry.dt = dateTime;
        entry.dtLocaleSort = locale;
        entry.dtLocaleReadable = localestr;
        entry.type = ltype;
        entry.fileName = error.fileName;
        entry.lineNumber = error.lineNumber;
        if (typeof data==="object" || data instanceof Array) {
            entry.msg = JSON.stringify(data);
        } else {
            entry.msg = data;
        }
        if (obj !== undefined && (typeof obj==="object" || obj instanceof Array)) {
            entry.obj = JSON.stringify(obj);
        }
        exports.log.push(entry);
    }

});
bfe.define('src/lookups/lcnames', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    
    var cache = [];
    
    // This var is required because it is used as an identifier.
    exports.scheme = "http://id.loc.gov/authorities/names";

    exports.source = function(query, process, formobject) {
        
        //console.log(JSON.stringify(formobject.store));
        
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/authorities/names";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                scheme = hits[0].o;
            }
        //console.log("scheme is " + scheme);
        
        var rdftype = "";
        if ( type == "http://bibframe.org/vocab/Person") {
            rdftype = "rdftype:PersonalName";
        } else if ( type == "http://bibframe.org/vocab/Topic") {
            rdftype = "(rdftype:Topic OR rdftype:ComplexSubject)";
        } else if ( type == "http://bibframe.org/vocab/Place") {
            rdftype = "rdftype:Geographic";
        } else if ( type == "http://bibframe.org/vocab/Organization") {
            rdftype = "rdftype:CorporateName";
        } else if ( type == "http://bibframe.org/vocab/Family") {
            //rdftype = "rdftype:FamilyName";
            rdftype = "rdftype:PersonalName";
        } else if ( type == "http://bibframe.org/vocab/Meeting") {
            rdftype = "rdftype:ConferenceName";
        } else if ( type == "http://bibframe.org/vocab/Jurisdiction") {
            rdftype = "rdftype:CorporateName";
        } else if ( type == "http://bibframe.org/vocab/GenreForm") {
            rdftype = "rdftype:GenreForm";
        }
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + ' AND ' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        if (q !== "") {
            q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
        } else {
            q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
        }
        //console.log('q is ' + q);
        q = encodeURI(q);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }
                
        this.searching = setTimeout(function() {
            if ( query.length > 2 && query.substr(0,1)!='?') {
                suggestquery = query;
                if (rdftype !== "")
                    suggestquery += "&rdftype=" + rdftype.replace("rdftype:", "")

                u = exports.scheme + "/suggest/?q=" + suggestquery + "&count=50";

                //u = exports.scheme + "/suggest/?q=" + query;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if (query.length > 2) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=" + q.replace("?", "");
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processATOM(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
    }
    
    /*
    
        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
    exports.getResource = lcshared.getResourceWithAAP;    

});
bfe.define('src/lookups/lcshared', ['require', 'exports', 'module' ], function(require, exports, module) {

    require('https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js');

    /*
        subjecturi propertyuri selected.uri
        selected.uri  bf:label selected.value
    */
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];

        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        selected.uri = selected.uri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);

        triple = {};
        triple.s = selected.uri;
        triple.p = "http://bibframe.org/vocab/label";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);

        return process(triples);
     }
    
    exports.getResourceWithAAP = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi;
        triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi;
        triple.p = "http://bibframe.org/vocab/label";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);

        process(triples);    
    }
    
    exports.getResourceLabelLookup = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
          //add label
        $.ajax({
            url: selected.uri + ".jsonp",
            dataType: "jsonp",
            success: function (data) {
                data.forEach(function(resource){
                    if (resource["@id"] === selected.uri){
                                var label = {};
                                label.s = selected.uri;
                                label.otype = "literal";
                                label.p = "http://bibframe.org/vocab/label";
                                label.o = resource["http://www.loc.gov/standards/mads/rdf/v1#authoritativeLabel"][0]["@value"];
                                triples.push(label);
                                return process(triples);
                    }
                });
            }
        });
    }

    exports.processJSONLDSuggestions = function (suggestions,query,scheme) {
        var typeahead_source = [];
        var schemewithslash = scheme + "/";
        if (suggestions['@graph'] !== undefined) {
            for (var s = 0; s < suggestions['@graph'].length; s++) {
                if(suggestions['@graph'][s]['skos:inScheme'] !==undefined){
                    if (suggestions['@graph'][s]['@type'] === 'skos:Concept' && (suggestions['@graph'][s]['skos:inScheme']['@id'] === scheme || suggestions['@graph'][s]['skos:inScheme']['@id'] === schemewithslash)){
                        if (suggestions['@graph'][s]['skos:prefLabel'].length !== undefined){
                            for (var i = 0; i < suggestions['@graph'][s]['skos:prefLabel'].length; i++) {
                                if (suggestions['@graph'][s]['skos:prefLabel'][i]['@language'] === "en") {
                                    var l = suggestions['@graph'][s]['skos:prefLabel'][i]['@value'];
                                    break;
                                }
                            }
                        } else {
                            var l = suggestions['@graph'][s]['skos:prefLabel']['@value'];
                        }
                        var u = suggestions['@graph'][s]['@id'];
                        typeahead_source.push({
                            uri: u,
                            value: l
                        });
                    }
                }
            }
        }
        if (typeahead_source.length === 0) {
            typeahead_source[0] = {
                uri: "",
                value: "[No suggestions found for " + query + ".]"
            };
        }
            return typeahead_source;
    }
    
    exports.processSuggestions = function(suggestions, query) {
        var typeahead_source = [];
        if ( suggestions[1] !== undefined ) {
            for (var s=0; s < suggestions[1].length; s++) {
                var l = suggestions[1][s];
                var u = suggestions[3][s];
                typeahead_source.push({ uri: u, value: l });
            }
        }
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        //$("#dropdown-footer").text('Total Results:' + suggestions.length);
        return typeahead_source;
    }
    
    exports.processATOM = function(atomjson, query) {
        var typeahead_source = [];
        for (var k in atomjson) {
            if (atomjson[k][0] == "atom:entry") {
                var t = "";
                var u = "";
                var source = "";
                for (var e in atomjson[k] ) {
                    if (atomjson[k][e][0] == "atom:title") {
                        t = atomjson[k][e][2];
                    }
                    if (atomjson[k][e][0] == "atom:link") {
                        u = atomjson[k][e][1].href;
                        source = u.substr(0, u.lastIndexOf('/'));
                    }
                    if ( t !== "" && u !== "") {
                        typeahead_source.push({ uri: u, source: source, value: t });
                        break;
                    }
                }
            }
        }
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        return typeahead_source;
    }

    exports.simpleQuery=function(query, cache, scheme, process) {
        console.log('q is ' + query);
        q = encodeURI(query);
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }
        this.searching = setTimeout(function() {
            
            if ( query === '' || query === ' ') {
                u = scheme + "/suggest/?count=100&q=";
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = exports.processSuggestions(data, "");
                        return process(parsedlist);
                    }
                });
            } else if ( query.length >= 1 ) {
                u = scheme + "/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = exports.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms

    }

});
bfe.define('src/lookups/lcsubjects', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    
    var cache = [];

    exports.scheme = "http://id.loc.gov/authorities/subjects";

    exports.source = function(query, process, formobject) {
        //console.log(JSON.stringify(formobject.store));
        
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/authorities/subjects";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                //console.log(hits[0]);
                scheme = hits[0].o;
            }
        //console.log("scheme is " + scheme);
        
        var rdftype = "";
        if ( type == "http://bibframe.org/vocab/Person") {
            rdftype = "rdftype:PersonalName";
        } else if ( type == "http://bibframe.org/vocab/Topic") {
            rdftype = "(rdftype:Topic OR rdftype:ComplexSubject)";
        } else if ( type == "http://bibframe.org/vocab/Place") {
            rdftype = "rdftype:Geographic";
        } else if ( type == "http://bibframe.org/vocab/Organization") {
            rdftype = "rdftype:CorporateName";
        } else if ( type == "http://bibframe.org/vocab/Family") {
            //rdftype = "rdftype:FamilyName";
            rdftype="rdftype:PersonalName";
        } else if ( type == "http://bibframe.org/vocab/Meeting") {
            rdftype = "rdftype:ConferenceName";
        } else if ( type == "http://bibframe.org/vocab/Jurisdiction") {
            rdftype = "rdftype:CorporateName";
        } else if ( type == "http://bibframe.org/vocab/GenreForm") {
            rdftype = "rdftype:GenreForm";
        }
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + ' AND ' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        if (q !== "") {
            q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
        } else {
            q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
        }
        //console.log('q is ' + q);
        q = encodeURI(q);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }
                
        this.searching = setTimeout(function() {
            if ( query.length > 2 && query.substr(0,1)!="?") {
                suggestquery = query;
                if (rdftype !== "")
                    suggestquery += "&rdftype=" + rdftype.replace("rdftype:", "")

                u = exports.scheme + "/suggest/?q=" + suggestquery;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if (query.length > 2) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q.replace("?", "");
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processATOM(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
    }
    
    /*
    
        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
    exports.getResource = lcshared.getResourceWithAAP;

});
bfe.define('src/lookups/lcgenreforms', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    
    var cache = [];

    exports.scheme = "http://id.loc.gov/authorities/genreForms";

    exports.source = function(query, process) {
        var scheme = "http://id.loc.gov/authorities/genreForms";
        var rdftype = "rdftype:GenreForm";
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + ' AND ' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        if (q !== "") {
            q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
        } else {
            q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
        }
        console.log('q is ' + q);
        q = encodeURI(q);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            console.log("searching defined");
            clearTimeout(this.searching);
            process([]);
        }
        //lcgft
        this.searching = setTimeout(function() {
            if ( query.length > 2 ) {
                suggestquery = query;
                if (rdftype !== "")
                    suggestquery += "&rdftype=" + rdftype.replace("rdftype:", "")

                u = scheme + "/suggest/?q=" + suggestquery;

                //u = "http://id.loc.gov/authorities/genreForms/suggest/?q=" + query;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }

                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
    }
    
    exports.getResource = lcshared.getResourceWithAAP;

});
bfe.define('src/lookups/lcworks', ['require', 'exports', 'module' ], function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/resources/works";

    exports.source = function(query, process, formobject) {
        
        var pageobj =  $('#'+formobject.pageid);
        var page = pageobj.val() != undefined ? parseInt(pageobj.val()) : 1;
        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/resources/works";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                scheme = hits[0].o;
            }
        //console.log("scheme is " + scheme);
        
        //var rdftype = "rdftype:Instance";
        var rdftype = "";
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + '&q=' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        //q = query + " " + q;
        q = q + "&q=scheme:/bibframe&q="+query;
        //console.log('q is ' + q);
        q = encodeURI(q);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }
        
        this.searching = setTimeout(function(formobject) {
            if ( query.length > 2 ) {
                //u = "http://id.loc.gov/ml38281/search/?format=jsonp&start="+page+"&count=50&q=" + q;
                u = "http://id.loc.gov/ml38281/search/?format=jsonp&start=1&count=50&q="+q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        pageobj.val(page+10);
                        //console.log(data);
                        //alert(data);
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        // only search if stop typing for 300ms aka fast typers
                        //console.log(parsedlist);
                        //process(parsedlist);
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        //return searching;
        
    }
    
    /*
    
        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi;
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi
        triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);
        
        triple = {};
        triple.s = selected.uri;
        triple.p = "http://bibframe.org/vocab/label";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);

//        process(triples);

        /*
        If you wanted/needed to make another call.
        */
        var u = selected.uri.replace(/gov\/resources/, 'gov/ml38281/resources') + ".bibframe_raw.jsonp";
        var primaryuri = "<" + selected.uri + ">";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                data.forEach(function(resource){
                    var s = resource["@id"];
                    for (var p in resource) {
                        if (p !== "@id") {
                            resource[p].forEach(function(o) {
                                //if ( s !== selected.uri && p !== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                                    var triple = {};
                                    triple.s = s;
                                    triple.p = p;
                                    if (o["@id"] !== undefined) {
                                        triple.o = o["@id"];
                                        triple.otype = "uri";
                                    } else if (o["@value"] !== undefined) {
                                        triple.o = o["@value"];
                                        triple.otype = "literal";
                                        if (o["@language"] !== undefined) {
                                            triple.olang = o["@language"];
                                        }
                                    } else {
                                        triple.o = o;
                                    }
                                    triples.push(triple);
                                //}
                            });
                        }
                    }
                });
                //console.log(triples);
                process(triples);
            }
        });
    }
    
    function processATOM(atomjson, query) {
        var typeahead_source = [];
        for (var k in atomjson) {
            if (atomjson[k][0] == "atom:entry") {
                var t = "";
                var u = "";
                var source = "";
                for (var e in atomjson[k] ) {
                    //alert(atomjson[k][e]);
                    if (atomjson[k][e][0] == "atom:title") {
                        //alert(atomjson[k][e][2]);
                        t = atomjson[k][e][2];
                    }
                    if (atomjson[k][e][0] == "atom:link") {
                        //alert(atomjson[k][e][2]);
                        u = atomjson[k][e][1].href;
                        source = u.substr(0, u.lastIndexOf('/'));
                    }
                    if ( t !== "" && u !== "") {
                        typeahead_source.push({ uri: u, source: source, value: t });
                        break;
                    }
                }
            }
        }
        //alert(suggestions);
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        return typeahead_source;
    }

});//bfe.define("lcnames", [], function() {
bfe.define('src/lookups/lcinstances', ['require', 'exports', 'module' ], function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/resources/instances";

    exports.source = function(query, process, formobject) {

        var triples = formobject.store;
        
        var type = "";
        var hits = _.where(triples, {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                type = hits[0].o;
            }
        //console.log("type is " + type);
        
        var scheme = "http://id.loc.gov/ml38281/resources/instances";
        hits = _.where(triples, {"p": "http://bibframe.org/vocab/authoritySource"})
        if ( hits[0] !== undefined ) {
                console.log(hits[0]);
                scheme = hits[0].o;
            }
        //console.log("scheme is " + scheme);
        
        //var rdftype = "rdftype:Instance";
        var rdftype = "";
                
        var q = "";
        if (scheme !== "" && rdftype !== "") {
            q = 'cs:' + scheme + '&q=' + rdftype;
        } else if (rdftype !== "") {
            q = rdftype;
        } else if (scheme !== "") {
            q = 'cs:' + scheme;
        }
        //q = q + " " + query
        q = q + "&q=scheme:/bibframe&q="+query;
        //console.log('q is ' + q);
        q = encodeURI(q);
        
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }
                
        this.searching = setTimeout(function() {
            if ( query.length > 2 ) {
                u = "http://id.loc.gov/ml38281/search/?format=jsonp&start=1&count=10&q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        //console.log(data);
                        //alert(data);
                        parsedlist = processATOM(data, query);
                        // save result to cache, remove next line if you don't want to use cache
                        cache[q] = parsedlist;
                        // only search if stop typing for 300ms aka fast typers
                        //console.log(parsedlist);
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
        
        //return searching;
        
    }
    
    /*
    
        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        triple = {};
        triple.s = subjecturi
        triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
        triple.o = selected.value;
        triple.otype = "literal";
        triple.olang = "en";
        triples.push(triple);
        
        /*
        If you wanted/needed to make another call.
        */
        var u = selected.uri.replace(/gov\/resources/, 'gov/ml38281/resources') + ".bibframe_raw.jsonp";
        var primaryuri = "<" + selected.uri + ">";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                data.forEach(function(resource){
                    var s = resource["@id"];
                    for (var p in resource) {
                        if (p !== "@id") {
                            resource[p].forEach(function(o) {
                                //if ( s !== selected.uri && p !== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                                    var triple = {};
                                    triple.s = s;
                                    triple.p = p;
                                    if (o["@id"] !== undefined) {
                                        triple.o = o["@id"];
                                        triple.otype = "uri";
                                    } else if (o["@value"] !== undefined) {
                                        triple.o = o["@value"];
                                        triple.otype = "literal";
                                        if (o["@language"] !== undefined) {
                                            triple.olang = o["@language"];
                                        }
                                    }
                                    triples.push(triple);
                                //}
                            });
                        }
                    }
                });
                console.log(triples);
                process(triples);
            }
        });
    }
    
    function processATOM(atomjson, query) {
        var typeahead_source = [];
        for (var k in atomjson) {
            if (atomjson[k][0] == "atom:entry") {
                var t = "";
                var u = "";
                var source = "";
                for (var e in atomjson[k] ) {
                    //alert(atomjson[k][e]);
                    if (atomjson[k][e][0] == "atom:title") {
                        //alert(atomjson[k][e][2]);
                        t = atomjson[k][e][2];
                    }
                    if (atomjson[k][e][0] == "atom:link") {
                        //alert(atomjson[k][e][2]);
                        u = atomjson[k][e][1].href;
                        source = u.substr(0, u.lastIndexOf('/'));
                    }
                    if ( t !== "" && u !== "") {
                        typeahead_source.push({ uri: u, source: source, value: t });
                        break;
                    }
                }
            }
        }
        //alert(suggestions);
        if (typeahead_source.length === 0) {
            typeahead_source[0] = { uri: "", value: "[No suggestions found for " + query + ".]" };
        }
        //console.log(typeahead_source);
        return typeahead_source;
    }

});
bfe.define('src/lookups/lcorganizations', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/organizations";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }
    
    exports.getResource = lcshared.getResourceWithAAP;

});
bfe.define('src/lookups/lccountries', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/countries";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcgacs', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/geographicAreas";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lclanguages', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/languages";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcidentifiers', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/identifiers";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lctargetaudiences', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/targetAudiences";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;
});
bfe.define('src/lookups/iso6391', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-1";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/iso6392', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-2";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/iso6395', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-5";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdacontenttypes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/contentTypes";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdamediatypes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/mediaTypes";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdacarriers', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/carriers";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }
    
    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdamodeissue', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    /*exports.scheme = "http://id.loc.gov/ml38281/vocabulary/rda/ModeIssue";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }    
//"[{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1004","value":"integrating resource"},{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1002","value":"multipart monograph"},{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1003","value":"serial"},{"uri":"http://id.loc.gov/vocabulary/rda/ModeIssue/1001","value":"single unit"}]"
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        selected.uri = selected.uri.replace("gov/", "gov/ml38281/");
        return lcshared.getResource(subjecturi,propertyuri,selected,process);
    }*/
    exports.scheme = "http://rdaregistry.info/termList/ModeIssue";

    exports.source = function(query, process) {

        console.log('q is ' + query);
        q = encodeURI(query);
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }

        this.searching = setTimeout(function() {
           if ( query === '' || query === ' ') {
                u = exports.scheme + ".json-ld";
                $.ajax({
                    url: u,
                    dataType: "json",
                    success: function (data) {
                        parsedlist = lcshared.processJSONLDSuggestions(data,query,exports.scheme);
                        return process(parsedlist);
                    }
                });
             } else if (query.length > 1) {
                u = exports.scheme + ".json-ld";
                console.log(u);
                $.ajax({
                    url: u,
                    dataType: "json",
                    success: function (data) {
                        parsedlist = lcshared.processJSONLDSuggestions(data,query,exports.scheme);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
    };

    exports.getResource = lcshared.getResource;



});
bfe.define('src/lookups/rdamusnotation', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];

    exports.scheme = "http://id.loc.gov/ml38281/vocabulary/rda/MusNotation";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        selected.uri = selected.uri.replace("gov/", "gov/ml38281/");
        return lcshared.getResource(subjecturi, propertyuri, selected, process);
    }

});
bfe.define('src/lookups/rdaformatnotemus', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    exports.scheme = "http://rdaregistry.info/termList/FormatNoteMus";

    exports.source = function(query, process) {

        console.log('q is ' + query);
        q = encodeURI(query);
        if(cache[q]){
            process(cache[q]);
            return;
        }
        if( typeof this.searching != "undefined") {
            clearTimeout(this.searching);
            process([]);
        }

        this.searching = setTimeout(function() {
           if ( query === '' || query === ' ') {
                u = exports.scheme + ".json-ld";
                $.ajax({
                    url: u,
                    dataType: "json",
                    success: function (data) {
                        parsedlist = lcshared.processJSONLDSuggestions(data,query,exports.scheme);
                        return process(parsedlist);
                    }
                });
             } else if (query.length > 1) {
                u = exports.scheme + ".json-ld";
                console.log(u);
                $.ajax({
                    url: u,
                    dataType: "json",
                    success: function (data) {
                        parsedlist = lcshared.processJSONLDSuggestions(data,query,exports.scheme);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else {
                return [];
            }
        }, 300); // 300 ms
    };

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcrelators', ['require', 'exports', 'module' , 'src/lookups/lcshared'],function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    exports.scheme = "http://id.loc.gov/vocabulary/relators";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/lcperformanceMediums', ['require', 'exports', 'module' , 'src/lookups/lcshared'],function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];
    exports.scheme = "http://id.loc.gov/authorities/performanceMediums";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});
bfe.define('src/lookups/rdaaspectratio', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];

    exports.scheme = "http://id.loc.gov/ml38281/vocabulary/rda/AspectRatio";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        selected.uri = selected.uri.replace("gov/", "gov/ml38281/");
        return lcshared.getResource(subjecturi, propertyuri, selected, process);
    }

});
bfe.define('src/lookups/rdagenmopic', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];

    exports.scheme = "http://id.loc.gov/ml38281/vocabulary/rda/genMoPic";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        selected.uri = selected.uri.replace("gov/", "gov/ml38281/");
        return lcshared.getResource(subjecturi, propertyuri, selected, process);
    }

});

bfe.define('src/lookups/classschemes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");
    var cache = [];

    exports.scheme = "http://id.loc.gov/vocabulary/classSchemes";

    exports.source = function(query, process){
        return lcshared.simpleQuery(query, cache, exports.scheme, process);
    }

    exports.getResource = lcshared.getResource;

});



/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */
bfe.define('src/lib/aceconfig', ['require', 'exports', 'module' ], function(require, exports, module) {

var global = (function() {
    return this;
})();

var options = {
    packaged: false,
    workerPath: null,
    modePath: null,
    themePath: null,
    basePath: "",
    suffix: ".js",
    $moduleUrls: {}
};

exports.set = function(key, value) {
    if (!options.hasOwnProperty(key))
        throw new Error("Unknown config key: " + key);

    options[key] = value;
};

// initialization
function init(packaged) {
    options.packaged = packaged || require.packaged || module.packaged || (global.define && define.packaged);

    if (!global.document)
        return "";

    var scriptOptions = {};
    var scriptUrl = "";

    var scripts = document.getElementsByTagName("script");
    for (var i=0; i<scripts.length; i++) {
        var script = scripts[i];

        var src = script.src || script.getAttribute("src");
        if (!src)
            continue;

        var attributes = script.attributes;
        for (var j=0, l=attributes.length; j < l; j++) {
            var attr = attributes[j];
            if (attr.name.indexOf("data-ace-") === 0) {
                scriptOptions[deHyphenate(attr.name.replace(/^data-ace-/, ""))] = attr.value;
            }
        }

        var m = src.match(/^(.*)\/ace(\-\w+)?\.js(\?|$)/);
        if (m)
            scriptUrl = m[1];
    }

    if (scriptUrl) {
        scriptOptions.base = scriptOptions.base || scriptUrl;
        scriptOptions.packaged = true;
    }

    scriptOptions.basePath = scriptOptions.base;
    scriptOptions.workerPath = scriptOptions.workerPath || scriptOptions.base;
    scriptOptions.modePath = scriptOptions.modePath || scriptOptions.base;
    scriptOptions.themePath = scriptOptions.themePath || scriptOptions.base;
    delete scriptOptions.base;

    for (var key in scriptOptions)
        if (typeof scriptOptions[key] !== "undefined")
            exports.set(key, scriptOptions[key]);
};

exports.init = init;

function deHyphenate(str) {
    return str.replace(/-(.)/g, function(m, m1) { return m1.toUpperCase(); });
}

});
/*
 * @deprecated v0.2.0
 */
(function() {
    bfe.require(["src/bfe"], function(a) {
        console.log(a);
        a && a.aceconfig.init();
        if (!window.bfe)
            window.bfe = {};
        for (var key in a) if (a.hasOwnProperty(key))
            bfe[key] = a[key];
    });
})();
