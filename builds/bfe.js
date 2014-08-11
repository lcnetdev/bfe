/*
    kefo: Copied from Ace editor repository.  This file is needed 
    to hook up the requirejs defines so they work with a defined 
    javascript bfe namespace since we use dryice to build and not requirejs.
    https://github.com/ajaxorg/ace/blob/master/build_support/mini_require.js
    
    Beyond the note above, it is not used in any other way.  It is only 
    invoked when building/minifying the code. 
*/

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
 * Get at functionality bfe.define()ed using the function above
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
bfe.define('src/bfe', ['require', 'exports', 'module' , 'src/lib/jquery-2.1.0.min', 'src/lib/json', 'src/lib/lodash.min', 'src/lib/bootstrap.min', 'src/lib/typeahead.jquery.min', 'src/bfestore', 'src/bfelogging', 'src/lookups/lcnames', 'src/lookups/lcsubjects', 'src/lookups/lcgenreforms', 'src/lookups/lcworks', 'src/lookups/lcinstances', 'src/lookups/lcorganizations', 'src/lookups/lccountries', 'src/lookups/lcgacs', 'src/lookups/lclanguages', 'src/lookups/lcidentifiers', 'src/lookups/lctargetaudiences', 'src/lookups/iso6391', 'src/lookups/iso6392', 'src/lookups/iso6395', 'src/lookups/rdacontenttypes', 'src/lookups/rdamediatypes', 'src/lookups/rdacarriers', 'src/lib/aceconfig'], function(require, exports, module) {
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
        var $formdiv = $('<div>', {id: "bfeditor-formdiv", class: "col-md-10"});
        //var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});
        var $rowdiv = $('<div>', {class: "row"});
        
        var $loader = $('<div><br /><br /><h2>Loading...</h2><div class="progress progress-striped active">\
                        <div class="progress-bar progress-bar-info" id="bfeditor-loader" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 20%">\
                            <span class="sr-only">80% Complete</span>\
                        </div>\
                    </div>');

        $formdiv.append($loader);
        $rowdiv.append($menudiv);
        $rowdiv.append($formdiv);
        //rowdiv.append(optiondiv);

        $(editordiv).append($rowdiv);
        
        this.setConfig(config);
        
        for (var h=0; h < config.startingPoints.length; h++) {
            var sp = config.startingPoints[h];
            var $menuul = $('<ul>', {class: "nav nav-stacked"});
            var menuheadingul = null;
            if (typeof sp.menuGroup !== undefined && sp.menuGroup !== "") {
                $menuheading = $('<li><h5 style="font-weight: bold">' + sp.menuGroup + '</h5></li>');
                $menuheadingul = $('<ul class="nav"></ul>');
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
            var $debugdiv = $('<div>', {class: "col-md-12"});
            $debugdiv.html("Debug output");
            var $debugpre = $('<pre>', {id: "bfeditor-debug"});
            $debugdiv.append($debugpre);
            $(editordiv).append($debugdiv);
            $debugpre.html(JSON.stringify(profiles, undefined, " "));
        }
        
        var $footer = $('<div>', {class: "col-md-12"});
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
                    <!-- <button id="bfeditor-exitsaveasnew" type="button" class="btn btn-primary">Save as new</button> --> \
                    <button id="bfeditor-exitsave" type="button" class="btn btn-primary">Save</button> \
                </div>');
                form.form.append($exitButtonGroup);
                
                $("#bfeditor-exitcancel", form.form).click(function(){
                    cbLoadTemplates();
                });
                $("#bfeditor-exitcancel", form.form).attr("tabindex", tabIndices++);
                
                //$("#bfeditor-exitsaveasnew", form.form).click(function(){
                //    cbLoadTemplates();
                //});
                
                $("#bfeditor-exitsave", form.form).click(function(){
                    editorconfig.return.callback(bfestore.store2jsonldExpanded());
                });
                $("#bfeditor-exitsave", form.form).attr("tabindex", tabIndices++);
                
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
            loadtemplate.resourceURI = editorconfig.baseURI + useguid;
            loadtemplate.embedType = "page";
            loadtemplate.data = tempstore;
            loadtemplates.push(loadtemplate);
            cbLoadTemplates();
        });
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
                    fobject.resourceTemplates[urt].defaulturi = editorconfig.baseURI + loadTemplates[urt].templateGUID;
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
                
                var $formgroup = $('<div>', {class: "form-group"});
                var $label = $('<label for="' + property.guid + '" class="col-sm-3 control-label">' + property.propertyLabel + '</label>');
                var $saves = $('<div class="form-group"><div class="col-sm-3"></div><div class="col-sm-8"><div class="btn-toolbar" role="toolbar"></div></div></div>');
                
                if (property.type == "literal") {
                    
                    var $input = $('<div class="col-sm-8"><input type="email" class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');
                    
                    $button = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button>');
                    $button.click(function(){
                        setLiteral(fobject.id, rt.guid, property.guid);
                    });
                    
                    $formgroup.append($label);
                    $formgroup.append($input);
                    $formgroup.append($button);
                    $formgroup.append($saves);
                }
                
                if (property.type == "resource") {
                    
                    if (_.has(property, "valueConstraint")) {
                        if (_.has(property.valueConstraint, "valueTemplateRefs")) {
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
                            $buttongrp = $('<div class="btn-group btn-group-sm"></div>');
                            var vtRefs = property.valueConstraint.valueTemplateRefs;
                            for ( var v=0; v < vtRefs.length; v++) {
                                var vtrs = vtRefs[v];
                                var valueTemplates = _.where(resourceTemplates, {"id": vtrs});
                                if (valueTemplates[0] !== undefined) {
                                    var vt = valueTemplates[0];
                                    //console.log(vt);
                                    var $b = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">' + vt.resourceLabel + '</button>');
                                    
                                    var fid = fobject.id;
                                    var rtid = rt.guid;
                                    var pid = property.guid;
                                    var newResourceURI = editorconfig.baseURI + guid();
                                    $b.click({fobjectid: fid, newResourceURI: newResourceURI, propertyguid: pid, template: vt}, function(event){
                                        //console.log(event.data.template);
                                        openModal(event.data.fobjectid, event.data.template, event.data.newResourceURI, event.data.propertyguid, []);
                                    });
                                    $buttongrp.append($b);
                                }
                            }
                            $buttondiv.append($buttongrp);
                            
                            $formgroup.append($label);
                            $formgroup.append($buttondiv);
                            $formgroup.append($saves);
                        } else if (_.has(property.valueConstraint, "useValuesFrom")) {
                            
                            // Let's supress the lookup unless it is in a modal for now.
                            if (rt.embedType != "modal" && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                                forEachFirst = false;
                                return;
                            }
                                
                            var $inputdiv = $('<div class="col-sm-8"></div>');
                            var $input = $('<input type="text" class="typeahead form-control" data-propertyguid="' + property.guid + '" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '">');
                            
                            $inputdiv.append($input);
                            
                            $formgroup.append($label);
                            $formgroup.append($inputdiv);
                            //formgroup.append(button);
                            $formgroup.append($saves);
                            
                            
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
                    
                            $button = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button>');
                            $button.click(function(){
                                setResourceFromLabel(fobject.id, rt.guid, property.guid);
                            });
                            
                            $formgroup.append($label);
                            $formgroup.append($input);
                            $formgroup.append($button);
                            $formgroup.append($saves);
                    
                        }
                    } else {
                        // Type is resource, so should be a URI, but there is
                        // no constraint for it so just create a label field.
                        var $input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');
                    
                        $button = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button>');
                            $button.click(function(){
                                setResourceFromLabel(fobject.id, rt.guid, property.guid);
                        });
                            
                        $formgroup.append($label);
                        $formgroup.append($input);
                        $formgroup.append($button);
                        $formgroup.append($saves);
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
                var uri = editorconfig.baseURI + rt.useguid;
                if (rt.defaulturi !== undefined && rt.defaulturi !== "") {
                    uri = rt.defaulturi;
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
                        if (_.has(property.valueConstraint, "valueTemplateRefs")) {
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
                                            if (_.has(property.valueConstraint, "valueTemplateRefs")) {
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
                                    if (t.p.match(/label/i)) {
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
                    if (_.has(property.valueConstraint, "defaultURI")) {
                        bfelog.addMsg(new Error(), "DEBUG", "Setting default data for " + property.propertyURI);
                        var data = property.valueConstraint.defaultURI;
                        // set the triple
                        var triple = {}
                        triple.guid = guid();
                        if (rt.defaulturi !== undefined && rt.defaulturi !== "") {
                            triple.s = rt.defaulturi;
                        } else {
                            triple.s = editorconfig.baseURI + rt.guid;
                        }
                        triple.p = property.propertyURI;
                        triple.o = data;
                        triple.otype = "uri";
                        fobject.store.push(triple);
                        bfestore.store.push(triple);
                        
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
                            "triples": [triple]
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
                        <button type="button" class="btn btn-default" id="bfeditor-modalCancel-modalID" data-dismiss="modal">Close</button> \
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
                removeTriple(callingformobjectid, inputID, triple);
            });
            setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, inputID, form.formobject.store);
        });
        $('#bfeditor-modalSave-' + form.formobject.id).attr("tabindex", tabIndices++);
        $('#bfeditor-modalSaveLookup-' + form.formobject.id).click(function(){
            triples.forEach(function(triple) {
                removeTriple(callingformobjectid, inputID, triple);
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
                tlabel = _.find(data, function(t){ if (t.p.match(/label|authorizedAccess|title/i)) return t.o; });
                displaydata = data[0].s;
                if ( tlabel !== undefined) {
                    displaydata = tlabel.o;
                }
                
                var connector = _.where(data, {"p": properties[0].propertyURI})
                var bgvars = { 
                        "tguid": connector[0].guid, 
                        "tlabelhover": displaydata,
                        "tlabel": displaydata,
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
        
        if (bgvars.tlabel.length > 15) {
            display = bgvars.tlabel.substr(0,15) + "...";
        } else {
            display = bgvars.tlabel;
        }
        var $displaybutton = $('<button type="button" class="btn btn-default" title="' + bgvars.tlabelhover + '">' + display +'</button>');
        $buttongroup.append($displaybutton);
        
        if ( bgvars.editable === undefined || bgvars.editable === true ) {
            var $editbutton = $('<button type="button" class="btn btn-warning">e</button>');
            $editbutton.click(function(){
                if (bgvars.triples.length === 1) {
                    editTriple(bgvars.fobjectid, bgvars.inputid, bgvars.triples[0]);
                } else {
                    editTriples(bgvars.fobjectid, bgvars.inputid, bgvars.triples);
                }
            });
            $buttongroup.append($editbutton);
    
            var $delbutton = $('<button type="button" class="btn btn-danger">x</button>');
            $delbutton.click(function(){
                if (bgvars.triples.length === 1) {
                    removeTriple(bgvars.fobjectid, bgvars.inputid, bgvars.triples[0]);
                } else {
                    removeTriples(bgvars.fobjectid, bgvars.inputid, bgvars.triples);
                }
            });
            $buttongroup.append($delbutton);
        }
        
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
        formid = formid.replace('bfeditor-form-', '');
        var formobject = _.where(forms, {"id": formid});
        formobject = formobject[0];
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
            dshash.templates =  { header: '<h3>' + lu.name + '</h3>' };
            dshash.displayKey = 'value';
            dshashes.push(dshash);
        });
        
        bfelog.addMsg(new Error(), "DEBUG", "Data source hashes", dshashes);
        var opts = {
            minLength: 1,
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
                                    var displaytriple = _.find(resourcedata, function(label) {
                                        return label.p.match(/label|title/i);
                                    });
                                    if (displaytriple !== undefined && displaytriple.o !== undefined) {
                                        tlabel = displaytriple.o;
                                    }
                                }
                            
                                var setTriples = [t];
                                if (resourcedata !== undefined && resourcedata[0] !== undefined) {
                                    setTriples = resourcedata;
                                }
                                var bgvars = { 
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
    
    function editTriples(formobjectID, inputID, triples) {
        bfelog.addMsg(new Error(), "DEBUG", "Editing triples", triples);
        var resourceTypes = _.where(triples, {p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"});
        bfelog.addMsg(new Error(), "DEBUG", "Triples represent these resourceTypes", resourceTypes);
        if (typeof resourceTypes[0] !== undefined && resourceTypes[0].rtID !== undefined) {
            // function openModal(callingformobjectid, rtguid, propertyguid, template) {
            var callingformobject = _.where(forms, {"id": formobjectID});
            callingformobject = callingformobject[0];
            
            var templates = _.where(resourceTemplates, {"id": resourceTypes[0].rtID});
            if (templates[0] !== undefined) {
                // The subject of the resource matched with the "type"
                bfelog.addMsg(new Error(), "DEBUG", "Opening modal for editing", triples);
                openModal(callingformobject.id, templates[0], resourceTypes[0].s, inputID, triples);
            }
        }
        
    }
    
    function removeTriple(formobjectID, inputID, t) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        bfelog.addMsg(new Error(), "DEBUG", "Removing triple: " + t.guid, t);
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
        formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {guid: t.guid}));
        bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {guid: t.guid}));
        $("#bfeditor-debug").html(JSON.stringify(bfestore.store, undefined, " "));
    }
    
    function removeTriples(formobjectID, inputID, triples) {
        bfelog.addMsg(new Error(), "DEBUG", "Removing triples for formobjectID: " + formobjectID + " and inputID: " + inputID, triples);
        triples.forEach(function(triple) {
            removeTriple(formobjectID, inputID, triple);
        });
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

    
});/*! jQuery v2.1.0 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k="".trim,l={},m=a.document,n="2.1.0",o=function(a,b){return new o.fn.init(a,b)},p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};o.fn=o.prototype={jquery:n,constructor:o,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=o.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return o.each(this,a,b)},map:function(a){return this.pushStack(o.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},o.extend=o.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||o.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(o.isPlainObject(d)||(e=o.isArray(d)))?(e?(e=!1,f=c&&o.isArray(c)?c:[]):f=c&&o.isPlainObject(c)?c:{},g[b]=o.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},o.extend({expando:"jQuery"+(n+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===o.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){return a-parseFloat(a)>=0},isPlainObject:function(a){if("object"!==o.type(a)||a.nodeType||o.isWindow(a))return!1;try{if(a.constructor&&!j.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(b){return!1}return!0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=o.trim(a),a&&(1===a.indexOf("use strict")?(b=m.createElement("script"),b.text=a,m.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=s(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":k.call(a)},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?o.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:g.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=s(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(c=a[b],b=a,a=c),o.isFunction(a)?(e=d.call(arguments,2),f=function(){return a.apply(b||this,e.concat(d.call(arguments)))},f.guid=a.guid=a.guid||o.guid++,f):void 0},now:Date.now,support:l}),o.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function s(a){var b=a.length,c=o.type(a);return"function"===c||o.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s="sizzle"+-new Date,t=a.document,u=0,v=0,w=eb(),x=eb(),y=eb(),z=function(a,b){return a===b&&(j=!0),0},A="undefined",B=1<<31,C={}.hasOwnProperty,D=[],E=D.pop,F=D.push,G=D.push,H=D.slice,I=D.indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]===a)return b;return-1},J="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",K="[\\x20\\t\\r\\n\\f]",L="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",M=L.replace("w","w#"),N="\\["+K+"*("+L+")"+K+"*(?:([*^$|!~]?=)"+K+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+M+")|)|)"+K+"*\\]",O=":("+L+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+N.replace(3,8)+")*)|.*)\\)|)",P=new RegExp("^"+K+"+|((?:^|[^\\\\])(?:\\\\.)*)"+K+"+$","g"),Q=new RegExp("^"+K+"*,"+K+"*"),R=new RegExp("^"+K+"*([>+~]|"+K+")"+K+"*"),S=new RegExp("="+K+"*([^\\]'\"]*?)"+K+"*\\]","g"),T=new RegExp(O),U=new RegExp("^"+M+"$"),V={ID:new RegExp("^#("+L+")"),CLASS:new RegExp("^\\.("+L+")"),TAG:new RegExp("^("+L.replace("w","w*")+")"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+K+"*(even|odd|(([+-]|)(\\d*)n|)"+K+"*(?:([+-]|)"+K+"*(\\d+)|))"+K+"*\\)|)","i"),bool:new RegExp("^(?:"+J+")$","i"),needsContext:new RegExp("^"+K+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+K+"*((?:-\\d)?\\d*)"+K+"*\\)|)(?=[^-]|$)","i")},W=/^(?:input|select|textarea|button)$/i,X=/^h\d$/i,Y=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,$=/[+~]/,_=/'|\\/g,ab=new RegExp("\\\\([\\da-f]{1,6}"+K+"?|("+K+")|.)","ig"),bb=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)};try{G.apply(D=H.call(t.childNodes),t.childNodes),D[t.childNodes.length].nodeType}catch(cb){G={apply:D.length?function(a,b){F.apply(a,H.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function db(a,b,d,e){var f,g,h,i,j,m,p,q,u,v;if((b?b.ownerDocument||b:t)!==l&&k(b),b=b||l,d=d||[],!a||"string"!=typeof a)return d;if(1!==(i=b.nodeType)&&9!==i)return[];if(n&&!e){if(f=Z.exec(a))if(h=f[1]){if(9===i){if(g=b.getElementById(h),!g||!g.parentNode)return d;if(g.id===h)return d.push(g),d}else if(b.ownerDocument&&(g=b.ownerDocument.getElementById(h))&&r(b,g)&&g.id===h)return d.push(g),d}else{if(f[2])return G.apply(d,b.getElementsByTagName(a)),d;if((h=f[3])&&c.getElementsByClassName&&b.getElementsByClassName)return G.apply(d,b.getElementsByClassName(h)),d}if(c.qsa&&(!o||!o.test(a))){if(q=p=s,u=b,v=9===i&&a,1===i&&"object"!==b.nodeName.toLowerCase()){m=ob(a),(p=b.getAttribute("id"))?q=p.replace(_,"\\$&"):b.setAttribute("id",q),q="[id='"+q+"'] ",j=m.length;while(j--)m[j]=q+pb(m[j]);u=$.test(a)&&mb(b.parentNode)||b,v=m.join(",")}if(v)try{return G.apply(d,u.querySelectorAll(v)),d}catch(w){}finally{p||b.removeAttribute("id")}}}return xb(a.replace(P,"$1"),b,d,e)}function eb(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function fb(a){return a[s]=!0,a}function gb(a){var b=l.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function hb(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function ib(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||B)-(~a.sourceIndex||B);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function jb(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function kb(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function lb(a){return fb(function(b){return b=+b,fb(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function mb(a){return a&&typeof a.getElementsByTagName!==A&&a}c=db.support={},f=db.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},k=db.setDocument=function(a){var b,e=a?a.ownerDocument||a:t,g=e.defaultView;return e!==l&&9===e.nodeType&&e.documentElement?(l=e,m=e.documentElement,n=!f(e),g&&g!==g.top&&(g.addEventListener?g.addEventListener("unload",function(){k()},!1):g.attachEvent&&g.attachEvent("onunload",function(){k()})),c.attributes=gb(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=gb(function(a){return a.appendChild(e.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Y.test(e.getElementsByClassName)&&gb(function(a){return a.innerHTML="<div class='a'></div><div class='a i'></div>",a.firstChild.className="i",2===a.getElementsByClassName("i").length}),c.getById=gb(function(a){return m.appendChild(a).id=s,!e.getElementsByName||!e.getElementsByName(s).length}),c.getById?(d.find.ID=function(a,b){if(typeof b.getElementById!==A&&n){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ab,bb);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ab,bb);return function(a){var c=typeof a.getAttributeNode!==A&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return typeof b.getElementsByTagName!==A?b.getElementsByTagName(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return typeof b.getElementsByClassName!==A&&n?b.getElementsByClassName(a):void 0},p=[],o=[],(c.qsa=Y.test(e.querySelectorAll))&&(gb(function(a){a.innerHTML="<select t=''><option selected=''></option></select>",a.querySelectorAll("[t^='']").length&&o.push("[*^$]="+K+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||o.push("\\["+K+"*(?:value|"+J+")"),a.querySelectorAll(":checked").length||o.push(":checked")}),gb(function(a){var b=e.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&o.push("name"+K+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||o.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),o.push(",.*:")})),(c.matchesSelector=Y.test(q=m.webkitMatchesSelector||m.mozMatchesSelector||m.oMatchesSelector||m.msMatchesSelector))&&gb(function(a){c.disconnectedMatch=q.call(a,"div"),q.call(a,"[s!='']:x"),p.push("!=",O)}),o=o.length&&new RegExp(o.join("|")),p=p.length&&new RegExp(p.join("|")),b=Y.test(m.compareDocumentPosition),r=b||Y.test(m.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},z=b?function(a,b){if(a===b)return j=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===e||a.ownerDocument===t&&r(t,a)?-1:b===e||b.ownerDocument===t&&r(t,b)?1:i?I.call(i,a)-I.call(i,b):0:4&d?-1:1)}:function(a,b){if(a===b)return j=!0,0;var c,d=0,f=a.parentNode,g=b.parentNode,h=[a],k=[b];if(!f||!g)return a===e?-1:b===e?1:f?-1:g?1:i?I.call(i,a)-I.call(i,b):0;if(f===g)return ib(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)k.unshift(c);while(h[d]===k[d])d++;return d?ib(h[d],k[d]):h[d]===t?-1:k[d]===t?1:0},e):l},db.matches=function(a,b){return db(a,null,null,b)},db.matchesSelector=function(a,b){if((a.ownerDocument||a)!==l&&k(a),b=b.replace(S,"='$1']"),!(!c.matchesSelector||!n||p&&p.test(b)||o&&o.test(b)))try{var d=q.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return db(b,l,null,[a]).length>0},db.contains=function(a,b){return(a.ownerDocument||a)!==l&&k(a),r(a,b)},db.attr=function(a,b){(a.ownerDocument||a)!==l&&k(a);var e=d.attrHandle[b.toLowerCase()],f=e&&C.call(d.attrHandle,b.toLowerCase())?e(a,b,!n):void 0;return void 0!==f?f:c.attributes||!n?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},db.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},db.uniqueSort=function(a){var b,d=[],e=0,f=0;if(j=!c.detectDuplicates,i=!c.sortStable&&a.slice(0),a.sort(z),j){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return i=null,a},e=db.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=db.selectors={cacheLength:50,createPseudo:fb,match:V,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ab,bb),a[3]=(a[4]||a[5]||"").replace(ab,bb),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||db.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&db.error(a[0]),a},PSEUDO:function(a){var b,c=!a[5]&&a[2];return V.CHILD.test(a[0])?null:(a[3]&&void 0!==a[4]?a[2]=a[4]:c&&T.test(c)&&(b=ob(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ab,bb).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=w[a+" "];return b||(b=new RegExp("(^|"+K+")"+a+"("+K+"|$)"))&&w(a,function(a){return b.test("string"==typeof a.className&&a.className||typeof a.getAttribute!==A&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=db.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),t=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&t){k=q[s]||(q[s]={}),j=k[a]||[],n=j[0]===u&&j[1],m=j[0]===u&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[u,n,m];break}}else if(t&&(j=(b[s]||(b[s]={}))[a])&&j[0]===u)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(t&&((l[s]||(l[s]={}))[a]=[u,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||db.error("unsupported pseudo: "+a);return e[s]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?fb(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=I.call(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:fb(function(a){var b=[],c=[],d=g(a.replace(P,"$1"));return d[s]?fb(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:fb(function(a){return function(b){return db(a,b).length>0}}),contains:fb(function(a){return function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:fb(function(a){return U.test(a||"")||db.error("unsupported lang: "+a),a=a.replace(ab,bb).toLowerCase(),function(b){var c;do if(c=n?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===m},focus:function(a){return a===l.activeElement&&(!l.hasFocus||l.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return X.test(a.nodeName)},input:function(a){return W.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:lb(function(){return[0]}),last:lb(function(a,b){return[b-1]}),eq:lb(function(a,b,c){return[0>c?c+b:c]}),even:lb(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:lb(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:lb(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:lb(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=jb(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=kb(b);function nb(){}nb.prototype=d.filters=d.pseudos,d.setFilters=new nb;function ob(a,b){var c,e,f,g,h,i,j,k=x[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=Q.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=R.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(P," ")}),h=h.slice(c.length));for(g in d.filter)!(e=V[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?db.error(a):x(a,i).slice(0)}function pb(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function qb(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=v++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[u,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[s]||(b[s]={}),(h=i[d])&&h[0]===u&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function rb(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function sb(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function tb(a,b,c,d,e,f){return d&&!d[s]&&(d=tb(d)),e&&!e[s]&&(e=tb(e,f)),fb(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||wb(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:sb(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=sb(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?I.call(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=sb(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):G.apply(g,r)})}function ub(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],i=g||d.relative[" "],j=g?1:0,k=qb(function(a){return a===b},i,!0),l=qb(function(a){return I.call(b,a)>-1},i,!0),m=[function(a,c,d){return!g&&(d||c!==h)||((b=c).nodeType?k(a,c,d):l(a,c,d))}];f>j;j++)if(c=d.relative[a[j].type])m=[qb(rb(m),c)];else{if(c=d.filter[a[j].type].apply(null,a[j].matches),c[s]){for(e=++j;f>e;e++)if(d.relative[a[e].type])break;return tb(j>1&&rb(m),j>1&&pb(a.slice(0,j-1).concat({value:" "===a[j-2].type?"*":""})).replace(P,"$1"),c,e>j&&ub(a.slice(j,e)),f>e&&ub(a=a.slice(e)),f>e&&pb(a))}m.push(c)}return rb(m)}function vb(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,i,j,k){var m,n,o,p=0,q="0",r=f&&[],s=[],t=h,v=f||e&&d.find.TAG("*",k),w=u+=null==t?1:Math.random()||.1,x=v.length;for(k&&(h=g!==l&&g);q!==x&&null!=(m=v[q]);q++){if(e&&m){n=0;while(o=a[n++])if(o(m,g,i)){j.push(m);break}k&&(u=w)}c&&((m=!o&&m)&&p--,f&&r.push(m))}if(p+=q,c&&q!==p){n=0;while(o=b[n++])o(r,s,g,i);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=E.call(j));s=sb(s)}G.apply(j,s),k&&!f&&s.length>0&&p+b.length>1&&db.uniqueSort(j)}return k&&(u=w,h=t),r};return c?fb(f):f}g=db.compile=function(a,b){var c,d=[],e=[],f=y[a+" "];if(!f){b||(b=ob(a)),c=b.length;while(c--)f=ub(b[c]),f[s]?d.push(f):e.push(f);f=y(a,vb(e,d))}return f};function wb(a,b,c){for(var d=0,e=b.length;e>d;d++)db(a,b[d],c);return c}function xb(a,b,e,f){var h,i,j,k,l,m=ob(a);if(!f&&1===m.length){if(i=m[0]=m[0].slice(0),i.length>2&&"ID"===(j=i[0]).type&&c.getById&&9===b.nodeType&&n&&d.relative[i[1].type]){if(b=(d.find.ID(j.matches[0].replace(ab,bb),b)||[])[0],!b)return e;a=a.slice(i.shift().value.length)}h=V.needsContext.test(a)?0:i.length;while(h--){if(j=i[h],d.relative[k=j.type])break;if((l=d.find[k])&&(f=l(j.matches[0].replace(ab,bb),$.test(i[0].type)&&mb(b.parentNode)||b))){if(i.splice(h,1),a=f.length&&pb(i),!a)return G.apply(e,f),e;break}}}return g(a,m)(f,b,!n,e,$.test(a)&&mb(b.parentNode)||b),e}return c.sortStable=s.split("").sort(z).join("")===s,c.detectDuplicates=!!j,k(),c.sortDetached=gb(function(a){return 1&a.compareDocumentPosition(l.createElement("div"))}),gb(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||hb("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&gb(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||hb("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),gb(function(a){return null==a.getAttribute("disabled")})||hb(J,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),db}(a);o.find=t,o.expr=t.selectors,o.expr[":"]=o.expr.pseudos,o.unique=t.uniqueSort,o.text=t.getText,o.isXMLDoc=t.isXML,o.contains=t.contains;var u=o.expr.match.needsContext,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^.[^:#\[\.,]*$/;function x(a,b,c){if(o.isFunction(b))return o.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return o.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(w.test(b))return o.filter(b,a,c);b=o.filter(b,a)}return o.grep(a,function(a){return g.call(b,a)>=0!==c})}o.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?o.find.matchesSelector(d,a)?[d]:[]:o.find.matches(a,o.grep(b,function(a){return 1===a.nodeType}))},o.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(o(a).filter(function(){for(b=0;c>b;b++)if(o.contains(e[b],this))return!0}));for(b=0;c>b;b++)o.find(a,e[b],d);return d=this.pushStack(c>1?o.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(x(this,a||[],!1))},not:function(a){return this.pushStack(x(this,a||[],!0))},is:function(a){return!!x(this,"string"==typeof a&&u.test(a)?o(a):a||[],!1).length}});var y,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=o.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||y).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof o?b[0]:b,o.merge(this,o.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:m,!0)),v.test(c[1])&&o.isPlainObject(b))for(c in b)o.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}return d=m.getElementById(c[2]),d&&d.parentNode&&(this.length=1,this[0]=d),this.context=m,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):o.isFunction(a)?"undefined"!=typeof y.ready?y.ready(a):a(o):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),o.makeArray(a,this))};A.prototype=o.fn,y=o(m);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};o.extend({dir:function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&o(a).is(c))break;d.push(a)}return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),o.fn.extend({has:function(a){var b=o(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(o.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=u.test(a)||"string"!=typeof a?o(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&o.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?o.unique(f):f)},index:function(a){return a?"string"==typeof a?g.call(o(a),this[0]):g.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(o.unique(o.merge(this.get(),o(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){while((a=a[b])&&1!==a.nodeType);return a}o.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return o.dir(a,"parentNode")},parentsUntil:function(a,b,c){return o.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return o.dir(a,"nextSibling")},prevAll:function(a){return o.dir(a,"previousSibling")},nextUntil:function(a,b,c){return o.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return o.dir(a,"previousSibling",c)},siblings:function(a){return o.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return o.sibling(a.firstChild)},contents:function(a){return a.contentDocument||o.merge([],a.childNodes)}},function(a,b){o.fn[a]=function(c,d){var e=o.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=o.filter(d,e)),this.length>1&&(C[a]||o.unique(e),B.test(a)&&e.reverse()),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return o.each(a.match(E)||[],function(a,c){b[c]=!0}),b}o.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):o.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(b=a.memory&&l,c=!0,g=e||0,e=0,f=h.length,d=!0;h&&f>g;g++)if(h[g].apply(l[0],l[1])===!1&&a.stopOnFalse){b=!1;break}d=!1,h&&(i?i.length&&j(i.shift()):b?h=[]:k.disable())},k={add:function(){if(h){var c=h.length;!function g(b){o.each(b,function(b,c){var d=o.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&g(c)})}(arguments),d?f=h.length:b&&(e=c,j(b))}return this},remove:function(){return h&&o.each(arguments,function(a,b){var c;while((c=o.inArray(b,h,c))>-1)h.splice(c,1),d&&(f>=c&&f--,g>=c&&g--)}),this},has:function(a){return a?o.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],f=0,this},disable:function(){return h=i=b=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,b||k.disable(),this},locked:function(){return!i},fireWith:function(a,b){return!h||c&&!i||(b=b||[],b=[a,b.slice?b.slice():b],d?i.push(b):j(b)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!c}};return k},o.extend({Deferred:function(a){var b=[["resolve","done",o.Callbacks("once memory"),"resolved"],["reject","fail",o.Callbacks("once memory"),"rejected"],["notify","progress",o.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return o.Deferred(function(c){o.each(b,function(b,f){var g=o.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&o.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?o.extend(a,d):d}},e={};return d.pipe=d.then,o.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&o.isFunction(a.promise)?e:0,g=1===f?a:o.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&o.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;o.fn.ready=function(a){return o.ready.promise().done(a),this},o.extend({isReady:!1,readyWait:1,holdReady:function(a){a?o.readyWait++:o.ready(!0)},ready:function(a){(a===!0?--o.readyWait:o.isReady)||(o.isReady=!0,a!==!0&&--o.readyWait>0||(H.resolveWith(m,[o]),o.fn.trigger&&o(m).trigger("ready").off("ready")))}});function I(){m.removeEventListener("DOMContentLoaded",I,!1),a.removeEventListener("load",I,!1),o.ready()}o.ready.promise=function(b){return H||(H=o.Deferred(),"complete"===m.readyState?setTimeout(o.ready):(m.addEventListener("DOMContentLoaded",I,!1),a.addEventListener("load",I,!1))),H.promise(b)},o.ready.promise();var J=o.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===o.type(c)){e=!0;for(h in c)o.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,o.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(o(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f};o.acceptData=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function K(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=o.expando+Math.random()}K.uid=1,K.accepts=o.acceptData,K.prototype={key:function(a){if(!K.accepts(a))return 0;var b={},c=a[this.expando];if(!c){c=K.uid++;try{b[this.expando]={value:c},Object.defineProperties(a,b)}catch(d){b[this.expando]=c,o.extend(a,b)}}return this.cache[c]||(this.cache[c]={}),c},set:function(a,b,c){var d,e=this.key(a),f=this.cache[e];if("string"==typeof b)f[b]=c;else if(o.isEmptyObject(f))o.extend(this.cache[e],b);else for(d in b)f[d]=b[d];return f},get:function(a,b){var c=this.cache[this.key(a)];return void 0===b?c:c[b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,o.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=this.key(a),g=this.cache[f];if(void 0===b)this.cache[f]={};else{o.isArray(b)?d=b.concat(b.map(o.camelCase)):(e=o.camelCase(b),b in g?d=[b,e]:(d=e,d=d in g?[d]:d.match(E)||[])),c=d.length;while(c--)delete g[d[c]]}},hasData:function(a){return!o.isEmptyObject(this.cache[a[this.expando]]||{})},discard:function(a){a[this.expando]&&delete this.cache[a[this.expando]]}};var L=new K,M=new K,N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(O,"-$1").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?o.parseJSON(c):c}catch(e){}M.set(a,b,c)}else c=void 0;return c}o.extend({hasData:function(a){return M.hasData(a)||L.hasData(a)},data:function(a,b,c){return M.access(a,b,c)},removeData:function(a,b){M.remove(a,b)},_data:function(a,b,c){return L.access(a,b,c)},_removeData:function(a,b){L.remove(a,b)}}),o.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=M.get(f),1===f.nodeType&&!L.get(f,"hasDataAttrs"))){c=g.length;
while(c--)d=g[c].name,0===d.indexOf("data-")&&(d=o.camelCase(d.slice(5)),P(f,d,e[d]));L.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){M.set(this,a)}):J(this,function(b){var c,d=o.camelCase(a);if(f&&void 0===b){if(c=M.get(f,a),void 0!==c)return c;if(c=M.get(f,d),void 0!==c)return c;if(c=P(f,d,void 0),void 0!==c)return c}else this.each(function(){var c=M.get(this,d);M.set(this,d,b),-1!==a.indexOf("-")&&void 0!==c&&M.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){M.remove(this,a)})}}),o.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=L.get(a,b),c&&(!d||o.isArray(c)?d=L.access(a,b,o.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=o.queue(a,b),d=c.length,e=c.shift(),f=o._queueHooks(a,b),g=function(){o.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return L.get(a,c)||L.access(a,c,{empty:o.Callbacks("once memory").add(function(){L.remove(a,[b+"queue",c])})})}}),o.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?o.queue(this[0],a):void 0===b?this:this.each(function(){var c=o.queue(this,a,b);o._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&o.dequeue(this,a)})},dequeue:function(a){return this.each(function(){o.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=o.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=L.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var Q=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,R=["Top","Right","Bottom","Left"],S=function(a,b){return a=b||a,"none"===o.css(a,"display")||!o.contains(a.ownerDocument,a)},T=/^(?:checkbox|radio)$/i;!function(){var a=m.createDocumentFragment(),b=a.appendChild(m.createElement("div"));b.innerHTML="<input type='radio' checked='checked' name='t'/>",l.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",l.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var U="undefined";l.focusinBubbles="onfocusin"in a;var V=/^key/,W=/^(?:mouse|contextmenu)|click/,X=/^(?:focusinfocus|focusoutblur)$/,Y=/^([^.]*)(?:\.(.+)|)$/;function Z(){return!0}function $(){return!1}function _(){try{return m.activeElement}catch(a){}}o.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,p,q,r=L.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=o.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return typeof o!==U&&o.event.triggered!==b.type?o.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(E)||[""],j=b.length;while(j--)h=Y.exec(b[j])||[],n=q=h[1],p=(h[2]||"").split(".").sort(),n&&(l=o.event.special[n]||{},n=(e?l.delegateType:l.bindType)||n,l=o.event.special[n]||{},k=o.extend({type:n,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&o.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[n])||(m=i[n]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(n,g,!1)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),o.event.global[n]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,p,q,r=L.hasData(a)&&L.get(a);if(r&&(i=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=Y.exec(b[j])||[],n=q=h[1],p=(h[2]||"").split(".").sort(),n){l=o.event.special[n]||{},n=(d?l.delegateType:l.bindType)||n,m=i[n]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||o.removeEvent(a,n,r.handle),delete i[n])}else for(n in i)o.event.remove(a,n+b[j],c,d,!0);o.isEmptyObject(i)&&(delete r.handle,L.remove(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,l,n,p=[d||m],q=j.call(b,"type")?b.type:b,r=j.call(b,"namespace")?b.namespace.split("."):[];if(g=h=d=d||m,3!==d.nodeType&&8!==d.nodeType&&!X.test(q+o.event.triggered)&&(q.indexOf(".")>=0&&(r=q.split("."),q=r.shift(),r.sort()),k=q.indexOf(":")<0&&"on"+q,b=b[o.expando]?b:new o.Event(q,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=r.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:o.makeArray(c,[b]),n=o.event.special[q]||{},e||!n.trigger||n.trigger.apply(d,c)!==!1)){if(!e&&!n.noBubble&&!o.isWindow(d)){for(i=n.delegateType||q,X.test(i+q)||(g=g.parentNode);g;g=g.parentNode)p.push(g),h=g;h===(d.ownerDocument||m)&&p.push(h.defaultView||h.parentWindow||a)}f=0;while((g=p[f++])&&!b.isPropagationStopped())b.type=f>1?i:n.bindType||q,l=(L.get(g,"events")||{})[b.type]&&L.get(g,"handle"),l&&l.apply(g,c),l=k&&g[k],l&&l.apply&&o.acceptData(g)&&(b.result=l.apply(g,c),b.result===!1&&b.preventDefault());return b.type=q,e||b.isDefaultPrevented()||n._default&&n._default.apply(p.pop(),c)!==!1||!o.acceptData(d)||k&&o.isFunction(d[q])&&!o.isWindow(d)&&(h=d[k],h&&(d[k]=null),o.event.triggered=q,d[q](),o.event.triggered=void 0,h&&(d[k]=h)),b.result}},dispatch:function(a){a=o.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(L.get(this,"events")||{})[a.type]||[],k=o.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=o.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(g.namespace))&&(a.handleObj=g,a.data=g.data,e=((o.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(a.result=e)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!==this;i=i.parentNode||this)if(i.disabled!==!0||"click"!==a.type){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?o(e,this).index(i)>=0:o.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||m,d=c.documentElement,e=c.body,a.pageX=b.clientX+(d&&d.scrollLeft||e&&e.scrollLeft||0)-(d&&d.clientLeft||e&&e.clientLeft||0),a.pageY=b.clientY+(d&&d.scrollTop||e&&e.scrollTop||0)-(d&&d.clientTop||e&&e.clientTop||0)),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},fix:function(a){if(a[o.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=W.test(e)?this.mouseHooks:V.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new o.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=m),3===a.target.nodeType&&(a.target=a.target.parentNode),g.filter?g.filter(a,f):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==_()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===_()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&o.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return o.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=o.extend(new o.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?o.event.trigger(e,null,b):o.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},o.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)},o.Event=function(a,b){return this instanceof o.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.getPreventDefault&&a.getPreventDefault()?Z:$):this.type=a,b&&o.extend(this,b),this.timeStamp=a&&a.timeStamp||o.now(),void(this[o.expando]=!0)):new o.Event(a,b)},o.Event.prototype={isDefaultPrevented:$,isPropagationStopped:$,isImmediatePropagationStopped:$,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=Z,a&&a.preventDefault&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=Z,a&&a.stopPropagation&&a.stopPropagation()},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=Z,this.stopPropagation()}},o.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){o.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!o.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),l.focusinBubbles||o.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){o.event.simulate(b,a.target,o.event.fix(a),!0)};o.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=L.access(d,b);e||d.addEventListener(a,c,!0),L.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=L.access(d,b)-1;e?L.access(d,b,e):(d.removeEventListener(a,c,!0),L.remove(d,b))}}}),o.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(g in a)this.on(g,b,c,a[g],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=$;else if(!d)return this;return 1===e&&(f=d,d=function(a){return o().off(a),f.apply(this,arguments)},d.guid=f.guid||(f.guid=o.guid++)),this.each(function(){o.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,o(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=$),this.each(function(){o.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){o.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?o.event.trigger(a,b,c,!0):void 0}});var ab=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bb=/<([\w:]+)/,cb=/<|&#?\w+;/,db=/<(?:script|style|link)/i,eb=/checked\s*(?:[^=]|=\s*.checked.)/i,fb=/^$|\/(?:java|ecma)script/i,gb=/^true\/(.*)/,hb=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ib={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ib.optgroup=ib.option,ib.tbody=ib.tfoot=ib.colgroup=ib.caption=ib.thead,ib.th=ib.td;function jb(a,b){return o.nodeName(a,"table")&&o.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function kb(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function lb(a){var b=gb.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function mb(a,b){for(var c=0,d=a.length;d>c;c++)L.set(a[c],"globalEval",!b||L.get(b[c],"globalEval"))}function nb(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(L.hasData(a)&&(f=L.access(a),g=L.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)o.event.add(b,e,j[e][c])}M.hasData(a)&&(h=M.access(a),i=o.extend({},h),M.set(b,i))}}function ob(a,b){var c=a.getElementsByTagName?a.getElementsByTagName(b||"*"):a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&o.nodeName(a,b)?o.merge([a],c):c}function pb(a,b){var c=b.nodeName.toLowerCase();"input"===c&&T.test(a.type)?b.checked=a.checked:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}o.extend({clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=o.contains(a.ownerDocument,a);if(!(l.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||o.isXMLDoc(a)))for(g=ob(h),f=ob(a),d=0,e=f.length;e>d;d++)pb(f[d],g[d]);if(b)if(c)for(f=f||ob(a),g=g||ob(h),d=0,e=f.length;e>d;d++)nb(f[d],g[d]);else nb(a,h);return g=ob(h,"script"),g.length>0&&mb(g,!i&&ob(a,"script")),h},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k=b.createDocumentFragment(),l=[],m=0,n=a.length;n>m;m++)if(e=a[m],e||0===e)if("object"===o.type(e))o.merge(l,e.nodeType?[e]:e);else if(cb.test(e)){f=f||k.appendChild(b.createElement("div")),g=(bb.exec(e)||["",""])[1].toLowerCase(),h=ib[g]||ib._default,f.innerHTML=h[1]+e.replace(ab,"<$1></$2>")+h[2],j=h[0];while(j--)f=f.lastChild;o.merge(l,f.childNodes),f=k.firstChild,f.textContent=""}else l.push(b.createTextNode(e));k.textContent="",m=0;while(e=l[m++])if((!d||-1===o.inArray(e,d))&&(i=o.contains(e.ownerDocument,e),f=ob(k.appendChild(e),"script"),i&&mb(f),c)){j=0;while(e=f[j++])fb.test(e.type||"")&&c.push(e)}return k},cleanData:function(a){for(var b,c,d,e,f,g,h=o.event.special,i=0;void 0!==(c=a[i]);i++){if(o.acceptData(c)&&(f=c[L.expando],f&&(b=L.cache[f]))){if(d=Object.keys(b.events||{}),d.length)for(g=0;void 0!==(e=d[g]);g++)h[e]?o.event.remove(c,e):o.removeEvent(c,e,b.handle);L.cache[f]&&delete L.cache[f]}delete M.cache[c[M.expando]]}}}),o.fn.extend({text:function(a){return J(this,function(a){return void 0===a?o.text(this):this.empty().each(function(){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&(this.textContent=a)})},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=jb(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=jb(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?o.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||o.cleanData(ob(c)),c.parentNode&&(b&&o.contains(c.ownerDocument,c)&&mb(ob(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(o.cleanData(ob(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return o.clone(this,a,b)})},html:function(a){return J(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!db.test(a)&&!ib[(bb.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(ab,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(o.cleanData(ob(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,o.cleanData(ob(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,k=this.length,m=this,n=k-1,p=a[0],q=o.isFunction(p);if(q||k>1&&"string"==typeof p&&!l.checkClone&&eb.test(p))return this.each(function(c){var d=m.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(k&&(c=o.buildFragment(a,this[0].ownerDocument,!1,this),d=c.firstChild,1===c.childNodes.length&&(c=d),d)){for(f=o.map(ob(c,"script"),kb),g=f.length;k>j;j++)h=c,j!==n&&(h=o.clone(h,!0,!0),g&&o.merge(f,ob(h,"script"))),b.call(this[j],h,j);if(g)for(i=f[f.length-1].ownerDocument,o.map(f,lb),j=0;g>j;j++)h=f[j],fb.test(h.type||"")&&!L.access(h,"globalEval")&&o.contains(i,h)&&(h.src?o._evalUrl&&o._evalUrl(h.src):o.globalEval(h.textContent.replace(hb,"")))}return this}}),o.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){o.fn[a]=function(a){for(var c,d=[],e=o(a),g=e.length-1,h=0;g>=h;h++)c=h===g?this:this.clone(!0),o(e[h])[b](c),f.apply(d,c.get());return this.pushStack(d)}});var qb,rb={};function sb(b,c){var d=o(c.createElement(b)).appendTo(c.body),e=a.getDefaultComputedStyle?a.getDefaultComputedStyle(d[0]).display:o.css(d[0],"display");return d.detach(),e}function tb(a){var b=m,c=rb[a];return c||(c=sb(a,b),"none"!==c&&c||(qb=(qb||o("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=qb[0].contentDocument,b.write(),b.close(),c=sb(a,b),qb.detach()),rb[a]=c),c}var ub=/^margin/,vb=new RegExp("^("+Q+")(?!px)[a-z%]+$","i"),wb=function(a){return a.ownerDocument.defaultView.getComputedStyle(a,null)};function xb(a,b,c){var d,e,f,g,h=a.style;return c=c||wb(a),c&&(g=c.getPropertyValue(b)||c[b]),c&&(""!==g||o.contains(a.ownerDocument,a)||(g=o.style(a,b)),vb.test(g)&&ub.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function yb(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d="padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",e=m.documentElement,f=m.createElement("div"),g=m.createElement("div");g.style.backgroundClip="content-box",g.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===g.style.backgroundClip,f.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",f.appendChild(g);function h(){g.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%",e.appendChild(f);var d=a.getComputedStyle(g,null);b="1%"!==d.top,c="4px"===d.width,e.removeChild(f)}a.getComputedStyle&&o.extend(l,{pixelPosition:function(){return h(),b},boxSizingReliable:function(){return null==c&&h(),c},reliableMarginRight:function(){var b,c=g.appendChild(m.createElement("div"));return c.style.cssText=g.style.cssText=d,c.style.marginRight=c.style.width="0",g.style.width="1px",e.appendChild(f),b=!parseFloat(a.getComputedStyle(c,null).marginRight),e.removeChild(f),g.innerHTML="",b}})}(),o.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var zb=/^(none|table(?!-c[ea]).+)/,Ab=new RegExp("^("+Q+")(.*)$","i"),Bb=new RegExp("^([+-])=("+Q+")","i"),Cb={position:"absolute",visibility:"hidden",display:"block"},Db={letterSpacing:0,fontWeight:400},Eb=["Webkit","O","Moz","ms"];function Fb(a,b){if(b in a)return b;var c=b[0].toUpperCase()+b.slice(1),d=b,e=Eb.length;while(e--)if(b=Eb[e]+c,b in a)return b;return d}function Gb(a,b,c){var d=Ab.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Hb(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=o.css(a,c+R[f],!0,e)),d?("content"===c&&(g-=o.css(a,"padding"+R[f],!0,e)),"margin"!==c&&(g-=o.css(a,"border"+R[f]+"Width",!0,e))):(g+=o.css(a,"padding"+R[f],!0,e),"padding"!==c&&(g+=o.css(a,"border"+R[f]+"Width",!0,e)));return g}function Ib(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=wb(a),g="border-box"===o.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=xb(a,b,f),(0>e||null==e)&&(e=a.style[b]),vb.test(e))return e;d=g&&(l.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Hb(a,b,c||(g?"border":"content"),d,f)+"px"}function Jb(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=L.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&S(d)&&(f[g]=L.access(d,"olddisplay",tb(d.nodeName)))):f[g]||(e=S(d),(c&&"none"!==c||!e)&&L.set(d,"olddisplay",e?c:o.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}o.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=xb(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=o.camelCase(b),i=a.style;return b=o.cssProps[h]||(o.cssProps[h]=Fb(i,h)),g=o.cssHooks[b]||o.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=Bb.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(o.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||o.cssNumber[h]||(c+="px"),l.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]="",i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=o.camelCase(b);return b=o.cssProps[h]||(o.cssProps[h]=Fb(a.style,h)),g=o.cssHooks[b]||o.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=xb(a,b,d)),"normal"===e&&b in Db&&(e=Db[b]),""===c||c?(f=parseFloat(e),c===!0||o.isNumeric(f)?f||0:e):e}}),o.each(["height","width"],function(a,b){o.cssHooks[b]={get:function(a,c,d){return c?0===a.offsetWidth&&zb.test(o.css(a,"display"))?o.swap(a,Cb,function(){return Ib(a,b,d)}):Ib(a,b,d):void 0},set:function(a,c,d){var e=d&&wb(a);return Gb(a,c,d?Hb(a,b,d,"border-box"===o.css(a,"boxSizing",!1,e),e):0)}}}),o.cssHooks.marginRight=yb(l.reliableMarginRight,function(a,b){return b?o.swap(a,{display:"inline-block"},xb,[a,"marginRight"]):void 0}),o.each({margin:"",padding:"",border:"Width"},function(a,b){o.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+R[d]+b]=f[d]||f[d-2]||f[0];return e}},ub.test(a)||(o.cssHooks[a+b].set=Gb)}),o.fn.extend({css:function(a,b){return J(this,function(a,b,c){var d,e,f={},g=0;if(o.isArray(b)){for(d=wb(a),e=b.length;e>g;g++)f[b[g]]=o.css(a,b[g],!1,d);return f}return void 0!==c?o.style(a,b,c):o.css(a,b)},a,b,arguments.length>1)},show:function(){return Jb(this,!0)},hide:function(){return Jb(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){S(this)?o(this).show():o(this).hide()})}});function Kb(a,b,c,d,e){return new Kb.prototype.init(a,b,c,d,e)}o.Tween=Kb,Kb.prototype={constructor:Kb,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(o.cssNumber[c]?"":"px")},cur:function(){var a=Kb.propHooks[this.prop];return a&&a.get?a.get(this):Kb.propHooks._default.get(this)},run:function(a){var b,c=Kb.propHooks[this.prop];return this.pos=b=this.options.duration?o.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Kb.propHooks._default.set(this),this}},Kb.prototype.init.prototype=Kb.prototype,Kb.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=o.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){o.fx.step[a.prop]?o.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[o.cssProps[a.prop]]||o.cssHooks[a.prop])?o.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Kb.propHooks.scrollTop=Kb.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},o.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},o.fx=Kb.prototype.init,o.fx.step={};var Lb,Mb,Nb=/^(?:toggle|show|hide)$/,Ob=new RegExp("^(?:([+-])=|)("+Q+")([a-z%]*)$","i"),Pb=/queueHooks$/,Qb=[Vb],Rb={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=Ob.exec(b),f=e&&e[3]||(o.cssNumber[a]?"":"px"),g=(o.cssNumber[a]||"px"!==f&&+d)&&Ob.exec(o.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,o.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function Sb(){return setTimeout(function(){Lb=void 0}),Lb=o.now()}function Tb(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=R[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ub(a,b,c){for(var d,e=(Rb[b]||[]).concat(Rb["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Vb(a,b,c){var d,e,f,g,h,i,j,k=this,l={},m=a.style,n=a.nodeType&&S(a),p=L.get(a,"fxshow");c.queue||(h=o._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,k.always(function(){k.always(function(){h.unqueued--,o.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[m.overflow,m.overflowX,m.overflowY],j=o.css(a,"display"),"none"===j&&(j=tb(a.nodeName)),"inline"===j&&"none"===o.css(a,"float")&&(m.display="inline-block")),c.overflow&&(m.overflow="hidden",k.always(function(){m.overflow=c.overflow[0],m.overflowX=c.overflow[1],m.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Nb.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(n?"hide":"show")){if("show"!==e||!p||void 0===p[d])continue;n=!0}l[d]=p&&p[d]||o.style(a,d)}if(!o.isEmptyObject(l)){p?"hidden"in p&&(n=p.hidden):p=L.access(a,"fxshow",{}),f&&(p.hidden=!n),n?o(a).show():k.done(function(){o(a).hide()}),k.done(function(){var b;L.remove(a,"fxshow");for(b in l)o.style(a,b,l[b])});for(d in l)g=Ub(n?p[d]:0,d,k),d in p||(p[d]=g.start,n&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function Wb(a,b){var c,d,e,f,g;for(c in a)if(d=o.camelCase(c),e=b[d],f=a[c],o.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=o.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function Xb(a,b,c){var d,e,f=0,g=Qb.length,h=o.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Lb||Sb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:o.extend({},b),opts:o.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:Lb||Sb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=o.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(Wb(k,j.opts.specialEasing);g>f;f++)if(d=Qb[f].call(j,a,k,j.opts))return d;return o.map(k,Ub,j),o.isFunction(j.opts.start)&&j.opts.start.call(a,j),o.fx.timer(o.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}o.Animation=o.extend(Xb,{tweener:function(a,b){o.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],Rb[c]=Rb[c]||[],Rb[c].unshift(b)},prefilter:function(a,b){b?Qb.unshift(a):Qb.push(a)}}),o.speed=function(a,b,c){var d=a&&"object"==typeof a?o.extend({},a):{complete:c||!c&&b||o.isFunction(a)&&a,duration:a,easing:c&&b||b&&!o.isFunction(b)&&b};return d.duration=o.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in o.fx.speeds?o.fx.speeds[d.duration]:o.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){o.isFunction(d.old)&&d.old.call(this),d.queue&&o.dequeue(this,d.queue)},d},o.fn.extend({fadeTo:function(a,b,c,d){return this.filter(S).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=o.isEmptyObject(a),f=o.speed(b,c,d),g=function(){var b=Xb(this,o.extend({},a),f);(e||L.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=o.timers,g=L.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Pb.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&o.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=L.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=o.timers,g=d?d.length:0;for(c.finish=!0,o.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),o.each(["toggle","show","hide"],function(a,b){var c=o.fn[b];o.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Tb(b,!0),a,d,e)}}),o.each({slideDown:Tb("show"),slideUp:Tb("hide"),slideToggle:Tb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){o.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),o.timers=[],o.fx.tick=function(){var a,b=0,c=o.timers;for(Lb=o.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||o.fx.stop(),Lb=void 0},o.fx.timer=function(a){o.timers.push(a),a()?o.fx.start():o.timers.pop()},o.fx.interval=13,o.fx.start=function(){Mb||(Mb=setInterval(o.fx.tick,o.fx.interval))},o.fx.stop=function(){clearInterval(Mb),Mb=null},o.fx.speeds={slow:600,fast:200,_default:400},o.fn.delay=function(a,b){return a=o.fx?o.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a=m.createElement("input"),b=m.createElement("select"),c=b.appendChild(m.createElement("option"));a.type="checkbox",l.checkOn=""!==a.value,l.optSelected=c.selected,b.disabled=!0,l.optDisabled=!c.disabled,a=m.createElement("input"),a.value="t",a.type="radio",l.radioValue="t"===a.value}();var Yb,Zb,$b=o.expr.attrHandle;o.fn.extend({attr:function(a,b){return J(this,o.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){o.removeAttr(this,a)})}}),o.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===U?o.prop(a,b,c):(1===f&&o.isXMLDoc(a)||(b=b.toLowerCase(),d=o.attrHooks[b]||(o.expr.match.bool.test(b)?Zb:Yb)),void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=o.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void o.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=o.propFix[c]||c,o.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)},attrHooks:{type:{set:function(a,b){if(!l.radioValue&&"radio"===b&&o.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),Zb={set:function(a,b,c){return b===!1?o.removeAttr(a,c):a.setAttribute(c,c),c}},o.each(o.expr.match.bool.source.match(/\w+/g),function(a,b){var c=$b[b]||o.find.attr;$b[b]=function(a,b,d){var e,f;
return d||(f=$b[b],$b[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,$b[b]=f),e}});var _b=/^(?:input|select|textarea|button)$/i;o.fn.extend({prop:function(a,b){return J(this,o.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[o.propFix[a]||a]})}}),o.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!o.isXMLDoc(a),f&&(b=o.propFix[b]||b,e=o.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){return a.hasAttribute("tabindex")||_b.test(a.nodeName)||a.href?a.tabIndex:-1}}}}),l.optSelected||(o.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null}}),o.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){o.propFix[this.toLowerCase()]=this});var ac=/[\t\r\n\f]/g;o.fn.extend({addClass:function(a){var b,c,d,e,f,g,h="string"==typeof a&&a,i=0,j=this.length;if(o.isFunction(a))return this.each(function(b){o(this).addClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ac," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=o.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0===arguments.length||"string"==typeof a&&a,i=0,j=this.length;if(o.isFunction(a))return this.each(function(b){o(this).removeClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ac," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?o.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(o.isFunction(a)?function(c){o(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=o(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===U||"boolean"===c)&&(this.className&&L.set(this,"__className__",this.className),this.className=this.className||a===!1?"":L.get(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(ac," ").indexOf(b)>=0)return!0;return!1}});var bc=/\r/g;o.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=o.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,o(this).val()):a,null==e?e="":"number"==typeof e?e+="":o.isArray(e)&&(e=o.map(e,function(a){return null==a?"":a+""})),b=o.valHooks[this.type]||o.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=o.valHooks[e.type]||o.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(bc,""):null==c?"":c)}}}),o.extend({valHooks:{select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(l.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&o.nodeName(c.parentNode,"optgroup"))){if(b=o(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=o.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=o.inArray(o(d).val(),f)>=0)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),o.each(["radio","checkbox"],function(){o.valHooks[this]={set:function(a,b){return o.isArray(b)?a.checked=o.inArray(o(a).val(),b)>=0:void 0}},l.checkOn||(o.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})}),o.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){o.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),o.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var cc=o.now(),dc=/\?/;o.parseJSON=function(a){return JSON.parse(a+"")},o.parseXML=function(a){var b,c;if(!a||"string"!=typeof a)return null;try{c=new DOMParser,b=c.parseFromString(a,"text/xml")}catch(d){b=void 0}return(!b||b.getElementsByTagName("parsererror").length)&&o.error("Invalid XML: "+a),b};var ec,fc,gc=/#.*$/,hc=/([?&])_=[^&]*/,ic=/^(.*?):[ \t]*([^\r\n]*)$/gm,jc=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,kc=/^(?:GET|HEAD)$/,lc=/^\/\//,mc=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,nc={},oc={},pc="*/".concat("*");try{fc=location.href}catch(qc){fc=m.createElement("a"),fc.href="",fc=fc.href}ec=mc.exec(fc.toLowerCase())||[];function rc(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(o.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function sc(a,b,c,d){var e={},f=a===oc;function g(h){var i;return e[h]=!0,o.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function tc(a,b){var c,d,e=o.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&o.extend(!0,a,d),a}function uc(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function vc(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}o.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:fc,type:"GET",isLocal:jc.test(ec[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":pc,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":o.parseJSON,"text xml":o.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?tc(tc(a,o.ajaxSettings),b):tc(o.ajaxSettings,a)},ajaxPrefilter:rc(nc),ajaxTransport:rc(oc),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=o.ajaxSetup({},b),l=k.context||k,m=k.context&&(l.nodeType||l.jquery)?o(l):o.event,n=o.Deferred(),p=o.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!f){f={};while(b=ic.exec(e))f[b[1].toLowerCase()]=b[2]}b=f[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?e:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return c&&c.abort(b),x(0,b),this}};if(n.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||fc)+"").replace(gc,"").replace(lc,ec[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=o.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(h=mc.exec(k.url.toLowerCase()),k.crossDomain=!(!h||h[1]===ec[1]&&h[2]===ec[2]&&(h[3]||("http:"===h[1]?"80":"443"))===(ec[3]||("http:"===ec[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=o.param(k.data,k.traditional)),sc(nc,k,b,v),2===t)return v;i=k.global,i&&0===o.active++&&o.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!kc.test(k.type),d=k.url,k.hasContent||(k.data&&(d=k.url+=(dc.test(d)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=hc.test(d)?d.replace(hc,"$1_="+cc++):d+(dc.test(d)?"&":"?")+"_="+cc++)),k.ifModified&&(o.lastModified[d]&&v.setRequestHeader("If-Modified-Since",o.lastModified[d]),o.etag[d]&&v.setRequestHeader("If-None-Match",o.etag[d])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+pc+"; q=0.01":""):k.accepts["*"]);for(j in k.headers)v.setRequestHeader(j,k.headers[j]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(j in{success:1,error:1,complete:1})v[j](k[j]);if(c=sc(oc,k,b,v)){v.readyState=1,i&&m.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,c.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,f,h){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),c=void 0,e=h||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,f&&(u=uc(k,v,f)),u=vc(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(o.lastModified[d]=w),w=v.getResponseHeader("etag"),w&&(o.etag[d]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?n.resolveWith(l,[r,x,v]):n.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,i&&m.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),i&&(m.trigger("ajaxComplete",[v,k]),--o.active||o.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return o.get(a,b,c,"json")},getScript:function(a,b){return o.get(a,void 0,b,"script")}}),o.each(["get","post"],function(a,b){o[b]=function(a,c,d,e){return o.isFunction(c)&&(e=e||d,d=c,c=void 0),o.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),o.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){o.fn[b]=function(a){return this.on(b,a)}}),o._evalUrl=function(a){return o.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},o.fn.extend({wrapAll:function(a){var b;return o.isFunction(a)?this.each(function(b){o(this).wrapAll(a.call(this,b))}):(this[0]&&(b=o(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return this.each(o.isFunction(a)?function(b){o(this).wrapInner(a.call(this,b))}:function(){var b=o(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=o.isFunction(a);return this.each(function(c){o(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){o.nodeName(this,"body")||o(this).replaceWith(this.childNodes)}).end()}}),o.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0},o.expr.filters.visible=function(a){return!o.expr.filters.hidden(a)};var wc=/%20/g,xc=/\[\]$/,yc=/\r?\n/g,zc=/^(?:submit|button|image|reset|file)$/i,Ac=/^(?:input|select|textarea|keygen)/i;function Bc(a,b,c,d){var e;if(o.isArray(b))o.each(b,function(b,e){c||xc.test(a)?d(a,e):Bc(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==o.type(b))d(a,b);else for(e in b)Bc(a+"["+e+"]",b[e],c,d)}o.param=function(a,b){var c,d=[],e=function(a,b){b=o.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=o.ajaxSettings&&o.ajaxSettings.traditional),o.isArray(a)||a.jquery&&!o.isPlainObject(a))o.each(a,function(){e(this.name,this.value)});else for(c in a)Bc(c,a[c],b,e);return d.join("&").replace(wc,"+")},o.fn.extend({serialize:function(){return o.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=o.prop(this,"elements");return a?o.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!o(this).is(":disabled")&&Ac.test(this.nodeName)&&!zc.test(a)&&(this.checked||!T.test(a))}).map(function(a,b){var c=o(this).val();return null==c?null:o.isArray(c)?o.map(c,function(a){return{name:b.name,value:a.replace(yc,"\r\n")}}):{name:b.name,value:c.replace(yc,"\r\n")}}).get()}}),o.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(a){}};var Cc=0,Dc={},Ec={0:200,1223:204},Fc=o.ajaxSettings.xhr();a.ActiveXObject&&o(a).on("unload",function(){for(var a in Dc)Dc[a]()}),l.cors=!!Fc&&"withCredentials"in Fc,l.ajax=Fc=!!Fc,o.ajaxTransport(function(a){var b;return l.cors||Fc&&!a.crossDomain?{send:function(c,d){var e,f=a.xhr(),g=++Cc;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)f.setRequestHeader(e,c[e]);b=function(a){return function(){b&&(delete Dc[g],b=f.onload=f.onerror=null,"abort"===a?f.abort():"error"===a?d(f.status,f.statusText):d(Ec[f.status]||f.status,f.statusText,"string"==typeof f.responseText?{text:f.responseText}:void 0,f.getAllResponseHeaders()))}},f.onload=b(),f.onerror=b("error"),b=Dc[g]=b("abort"),f.send(a.hasContent&&a.data||null)},abort:function(){b&&b()}}:void 0}),o.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return o.globalEval(a),a}}}),o.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),o.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(d,e){b=o("<script>").prop({async:!0,charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&e("error"===a.type?404:200,a.type)}),m.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Gc=[],Hc=/(=)\?(?=&|$)|\?\?/;o.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Gc.pop()||o.expando+"_"+cc++;return this[a]=!0,a}}),o.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Hc.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Hc.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=o.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Hc,"$1"+e):b.jsonp!==!1&&(b.url+=(dc.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||o.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Gc.push(e)),g&&o.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),o.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||m;var d=v.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=o.buildFragment([a],b,e),e&&e.length&&o(e).remove(),o.merge([],d.childNodes))};var Ic=o.fn.load;o.fn.load=function(a,b,c){if("string"!=typeof a&&Ic)return Ic.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=a.slice(h),a=a.slice(0,h)),o.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&o.ajax({url:a,type:e,dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?o("<div>").append(o.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,f||[a.responseText,b,a])}),this},o.expr.filters.animated=function(a){return o.grep(o.timers,function(b){return a===b.elem}).length};var Jc=a.document.documentElement;function Kc(a){return o.isWindow(a)?a:9===a.nodeType&&a.defaultView}o.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=o.css(a,"position"),l=o(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=o.css(a,"top"),i=o.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),o.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},o.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){o.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,o.contains(b,d)?(typeof d.getBoundingClientRect!==U&&(e=d.getBoundingClientRect()),c=Kc(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===o.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),o.nodeName(a[0],"html")||(d=a.offset()),d.top+=o.css(a[0],"borderTopWidth",!0),d.left+=o.css(a[0],"borderLeftWidth",!0)),{top:b.top-d.top-o.css(c,"marginTop",!0),left:b.left-d.left-o.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||Jc;while(a&&!o.nodeName(a,"html")&&"static"===o.css(a,"position"))a=a.offsetParent;return a||Jc})}}),o.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(b,c){var d="pageYOffset"===c;o.fn[b]=function(e){return J(this,function(b,e,f){var g=Kc(b);return void 0===f?g?g[c]:b[e]:void(g?g.scrollTo(d?a.pageXOffset:f,d?f:a.pageYOffset):b[e]=f)},b,e,arguments.length,null)}}),o.each(["top","left"],function(a,b){o.cssHooks[b]=yb(l.pixelPosition,function(a,c){return c?(c=xb(a,b),vb.test(c)?o(a).position()[b]+"px":c):void 0})}),o.each({Height:"height",Width:"width"},function(a,b){o.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){o.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return J(this,function(b,c,d){var e;return o.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?o.css(b,c,g):o.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),o.fn.size=function(){return this.length},o.fn.andSelf=o.fn.addBack,"function"==typeof define&&define.amd&&bfe.define("jquery",[],function(){return o});var Lc=a.jQuery,Mc=a.$;return o.noConflict=function(b){return a.$===o&&(a.$=Mc),b&&a.jQuery===o&&(a.jQuery=Lc),o},typeof b===U&&(a.jQuery=a.$=o),o});
/** @license
 * RequireJS plugin for loading JSON files
 * - depends on Text plugin and it was HEAVILY "inspired" by it as well.
 * Author: Miller Medeiros
 * Version: 0.3.2 (2013/08/17)
 * Released under the MIT license
 */
bfe.define(['src/lib/text'], function(text){

    var CACHE_BUST_QUERY_PARAM = 'bust',
        CACHE_BUST_FLAG = '!bust',
        jsonParse = (typeof JSON !== 'undefined' && typeof JSON.parse === 'function')? JSON.parse : function(val){
            return eval('('+ val +')'); //quick and dirty
        },
        buildMap = {};

    function cacheBust(url){
        url = url.replace(CACHE_BUST_FLAG, '');
        url += (url.indexOf('?') < 0)? '?' : '&';
        return url + CACHE_BUST_QUERY_PARAM +'='+ Math.round(2147483647 * Math.random());
    }

    //API
    return {

        load : function(name, req, onLoad, config) {
            if ( config.isBuild && (config.inlineJSON === false || name.indexOf(CACHE_BUST_QUERY_PARAM +'=') !== -1) ) {
                //avoid inlining cache busted JSON or if inlineJSON:false
                onLoad(null);
            } else {
                text.get(req.toUrl(name), function(data){
                    if (config.isBuild) {
                        buildMap[name] = data;
                        onLoad(data);
                    } else {
                        onLoad(jsonParse(data));
                    }
                },
                    onLoad.error, {
                        accept: 'application/json'
                    }
                );
            }
        },

        normalize : function (name, normalize) {
            // used normalize to avoid caching references to a "cache busted" request
            if (name.indexOf(CACHE_BUST_FLAG) !== -1) {
                name = cacheBust(name);
            }
            // resolve any relative paths
            return normalize(name);
        },

        //write method based on RequireJS official text plugin by James Burke
        //https://github.com/jrburke/requirejs/blob/master/text.js
        write : function(pluginName, moduleName, write){
            if(moduleName in buildMap){
                var content = buildMap[moduleName];
                write('bfe.define("'+ pluginName +'!'+ moduleName +'", function(){ return '+ content +';});\n');
            }
        }

    };
});
/*
 RequireJS text 1.0.8 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 Available via the MIT or new BSD license.
 see: http://github.com/jrburke/requirejs for details
*/
(function(){var k=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"],m=/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,n=/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,i=typeof location!=="undefined"&&location.href,o=i&&location.protocol&&location.protocol.replace(/\:/,""),p=i&&location.hostname,q=i&&(location.port||void 0),j=[];bfe.define(function(){var e,l;e={version:"1.0.8",strip:function(a){if(a){var a=a.replace(m,""),c=a.match(n);c&&(a=c[1])}else a="";return a},jsEscape:function(a){return a.replace(/(['\\])/g,
"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\n]/g,"\\n").replace(/[\t]/g,"\\t").replace(/[\r]/g,"\\r")},createXhr:function(){var a,c,b;if(typeof XMLHttpRequest!=="undefined")return new XMLHttpRequest;else if(typeof ActiveXObject!=="undefined")for(c=0;c<3;c++){b=k[c];try{a=new ActiveXObject(b)}catch(f){}if(a){k=[b];break}}return a},parseName:function(a){var c=!1,b=a.indexOf("."),f=a.substring(0,b),a=a.substring(b+1,a.length),b=a.indexOf("!");b!==-1&&(c=a.substring(b+1,a.length),
c=c==="strip",a=a.substring(0,b));return{moduleName:f,ext:a,strip:c}},xdRegExp:/^((\w+)\:)?\/\/([^\/\\]+)/,useXhr:function(a,c,b,f){var d=e.xdRegExp.exec(a),g;if(!d)return!0;a=d[2];d=d[3];d=d.split(":");g=d[1];d=d[0];return(!a||a===c)&&(!d||d===b)&&(!g&&!d||g===f)},finishLoad:function(a,c,b,f,d){b=c?e.strip(b):b;d.isBuild&&(j[a]=b);f(b)},load:function(a,c,b,f){if(f.isBuild&&!f.inlineText)b();else{var d=e.parseName(a),g=d.moduleName+"."+d.ext,h=c.toUrl(g),r=f&&f.text&&f.text.useXhr||e.useXhr;!i||r(h,
o,p,q)?e.get(h,function(c){e.finishLoad(a,d.strip,c,b,f)}):c([g],function(a){e.finishLoad(d.moduleName+"."+d.ext,d.strip,a,b,f)})}},write:function(a,c,b){if(j.hasOwnProperty(c)){var f=e.jsEscape(j[c]);b.asModule(a+"!"+c,"bfe.define(function () { return '"+f+"';});\n")}},writeFile:function(a,c,b,f,d){var c=e.parseName(c),g=c.moduleName+"."+c.ext,h=b.toUrl(c.moduleName+"."+c.ext)+".js";e.load(g,b,function(){var b=function(a){return f(h,a)};b.asModule=function(a,b){return f.asModule(a,h,b)};e.write(a,g,
b,d)},d)}};if(e.createXhr())e.get=function(a,c){var b=e.createXhr();b.open("GET",a,!0);b.onreadystatechange=function(){b.readyState===4&&c(b.responseText)};b.send(null)};else if(typeof process!=="undefined"&&process.versions&&process.versions.node)l=require.nodeRequire("fs"),e.get=function(a,c){var b=l.readFileSync(a,"utf8");b.indexOf("\ufeff")===0&&(b=b.substring(1));c(b)};else if(typeof Packages!=="undefined")e.get=function(a,c){var b=new java.io.File(a),f=java.lang.System.getProperty("line.separator"),
b=new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(b),"utf-8")),d,e,h="";try{d=new java.lang.StringBuffer;(e=b.readLine())&&e.length()&&e.charAt(0)===65279&&(e=e.substring(1));for(d.append(e);(e=b.readLine())!==null;)d.append(f),d.append(e);h=String(d.toString())}finally{b.close()}c(h)};return e})})();
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash modern -o ./dist/lodash.js`
 */
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
var Y=s();typeof define=="function"&&typeof define.amd=="object"&&define.amd?(G._=Y, bfe.define(function(){return Y})):H&&J?Q?(J.exports=Y)._=Y:H._=Y:G._=Y}).call(this);/*!
 * Bootstrap v3.1.1 (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

+function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype.close=function(b){function f(){e.trigger("closed.bs.alert").remove()}var c=a(this),d=c.attr("data-target");d||(d=c.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,""));var e=a(d);b&&b.preventDefault(),e.length||(e=c.hasClass("alert")?c:c.parent()),e.trigger(b=a.Event("close.bs.alert"));if(b.isDefaultPrevented())return;e.removeClass("in"),a.support.transition&&e.hasClass("fade")?e.one(a.support.transition.end,f).emulateTransitionEnd(150):f()};var d=a.fn.alert;a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("bs.alert");e||d.data("bs.alert",e=new c(this)),typeof b=="string"&&e[b].call(d)})},a.fn.alert.Constructor=c,a.fn.alert.noConflict=function(){return a.fn.alert=d,this},a(document).on("click.bs.alert.data-api",b,c.prototype.close)}(jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.isLoading=!1};b.DEFAULTS={loadingText:"loading..."},b.prototype.setState=function(b){var c="disabled",d=this.$element,e=d.is("input")?"val":"html",f=d.data();b+="Text",f.resetText||d.data("resetText",d[e]()),d[e](f[b]||this.options[b]),setTimeout(a.proxy(function(){b=="loadingText"?(this.isLoading=!0,d.addClass(c).attr(c,c)):this.isLoading&&(this.isLoading=!1,d.removeClass(c).removeAttr(c))},this),0)},b.prototype.toggle=function(){var a=!0,b=this.$element.closest('[data-toggle="buttons"]');if(b.length){var c=this.$element.find("input");c.prop("type")=="radio"&&(c.prop("checked")&&this.$element.hasClass("active")?a=!1:b.find(".active").removeClass("active")),a&&c.prop("checked",!this.$element.hasClass("active")).trigger("change")}a&&this.$element.toggleClass("active")};var c=a.fn.button;a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("bs.button"),f=typeof c=="object"&&c;e||d.data("bs.button",e=new b(this,f)),c=="toggle"?e.toggle():c&&e.setState(c)})},a.fn.button.Constructor=b,a.fn.button.noConflict=function(){return a.fn.button=c,this},a(document).on("click.bs.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle"),b.preventDefault()})}(jQuery),+function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b),this.$backdrop=this.isShown=null,this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};b.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},b.prototype.toggle=function(a){return this[this.isShown?"hide":"show"](a)},b.prototype.show=function(b){var c=this,d=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(d);if(this.isShown||d.isDefaultPrevented())return;this.isShown=!0,this.escape(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.backdrop(function(){var d=a.support.transition&&c.$element.hasClass("fade");c.$element.parent().length||c.$element.appendTo(document.body),c.$element.show().scrollTop(0),d&&c.$element[0].offsetWidth,c.$element.addClass("in").attr("aria-hidden",!1),c.enforceFocus();var e=a.Event("shown.bs.modal",{relatedTarget:b});d?c.$element.find(".modal-dialog").one(a.support.transition.end,function(){c.$element.focus().trigger(e)}).emulateTransitionEnd(300):c.$element.focus().trigger(e)})},b.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b);if(!this.isShown||b.isDefaultPrevented())return;this.isShown=!1,this.escape(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one(a.support.transition.end,a.proxy(this.hideModal,this)).emulateTransitionEnd(300):this.hideModal()},b.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){this.$element[0]!==a.target&&!this.$element.has(a.target).length&&this.$element.focus()},this))},b.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.bs.modal",a.proxy(function(a){a.which==27&&this.hide()},this)):this.isShown||this.$element.off("keyup.dismiss.bs.modal")},b.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden.bs.modal")})},b.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},b.prototype.backdrop=function(b){var c=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var d=a.support.transition&&c;this.$backdrop=a('<div class="modal-backdrop '+c+'" />').appendTo(document.body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(a){if(a.target!==a.currentTarget)return;this.options.backdrop=="static"?this.$element[0].focus.call(this.$element[0]):this.hide.call(this)},this)),d&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in");if(!b)return;d?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()):b&&b()};var c=a.fn.modal;a.fn.modal=function(c,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},b.DEFAULTS,e.data(),typeof c=="object"&&c);f||e.data("bs.modal",f=new b(this,g)),typeof c=="string"?f[c](d):g.show&&f.show(d)})},a.fn.modal.Constructor=b,a.fn.modal.noConflict=function(){return a.fn.modal=c,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());c.is("a")&&b.preventDefault(),e.modal(f,this).one("hide",function(){c.is(":visible")&&c.focus()})}),a(document).on("show.bs.modal",".modal",function(){a(document.body).addClass("modal-open")}).on("hidden.bs.modal",".modal",function(){a(document.body).removeClass("modal-open")})}(jQuery),+function(a){"use strict";var b=function(a,b){this.type=this.options=this.enabled=this.timeout=this.hoverState=this.$element=null,this.init("tooltip",a,b)};b.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1},b.prototype.init=function(b,c,d){this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d);var e=this.options.trigger.split(" ");for(var f=e.length;f--;){var g=e[f];if(g=="click")this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if(g!="manual"){var h=g=="hover"?"mouseenter":"focusin",i=g=="hover"?"mouseleave":"focusout";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&typeof b.delay=="number"&&(b.delay={show:b.delay,hide:b.delay}),b},b.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},b.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);clearTimeout(c.timeout),c.hoverState="in";if(!c.options.delay||!c.options.delay.show)return c.show();c.timeout=setTimeout(function(){c.hoverState=="in"&&c.show()},c.options.delay.show)},b.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);clearTimeout(c.timeout),c.hoverState="out";if(!c.options.delay||!c.options.delay.hide)return c.hide();c.timeout=setTimeout(function(){c.hoverState=="out"&&c.hide()},c.options.delay.hide)},b.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){this.$element.trigger(b);if(b.isDefaultPrevented())return;var c=this,d=this.tip();this.setContent(),this.options.animation&&d.addClass("fade");var e=typeof this.options.placement=="function"?this.options.placement.call(this,d[0],this.$element[0]):this.options.placement,f=/\s?auto?\s?/i,g=f.test(e);g&&(e=e.replace(f,"")||"top"),d.detach().css({top:0,left:0,display:"block"}).addClass(e),this.options.container?d.appendTo(this.options.container):d.insertAfter(this.$element);var h=this.getPosition(),i=d[0].offsetWidth,j=d[0].offsetHeight;if(g){var k=this.$element.parent(),l=e,m=document.documentElement.scrollTop||document.body.scrollTop,n=this.options.container=="body"?window.innerWidth:k.outerWidth(),o=this.options.container=="body"?window.innerHeight:k.outerHeight(),p=this.options.container=="body"?0:k.offset().left;e=e=="bottom"&&h.top+h.height+j-m>o?"top":e=="top"&&h.top-m-j<0?"bottom":e=="right"&&h.right+i>n?"left":e=="left"&&h.left-i<p?"right":e,d.removeClass(l).addClass(e)}var q=this.getCalculatedOffset(e,h,i,j);this.applyPlacement(q,e),this.hoverState=null;var r=function(){c.$element.trigger("shown.bs."+c.type)};a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,r).emulateTransitionEnd(150):r()}},b.prototype.applyPlacement=function(b,c){var d,e=this.tip(),f=e[0].offsetWidth,g=e[0].offsetHeight,h=parseInt(e.css("margin-top"),10),i=parseInt(e.css("margin-left"),10);isNaN(h)&&(h=0),isNaN(i)&&(i=0),b.top=b.top+h,b.left=b.left+i,a.offset.setOffset(e[0],a.extend({using:function(a){e.css({top:Math.round(a.top),left:Math.round(a.left)})}},b),0),e.addClass("in");var j=e[0].offsetWidth,k=e[0].offsetHeight;c=="top"&&k!=g&&(d=!0,b.top=b.top+g-k);if(/bottom|top/.test(c)){var l=0;b.left<0&&(l=b.left*-2,b.left=0,e.offset(b),j=e[0].offsetWidth,k=e[0].offsetHeight),this.replaceArrow(l-f+j,j,"left")}else this.replaceArrow(k-g,k,"top");d&&e.offset(b)},b.prototype.replaceArrow=function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},b.prototype.hide=function(){function e(){b.hoverState!="in"&&c.detach(),b.$element.trigger("hidden.bs."+b.type)}var b=this,c=this.tip(),d=a.Event("hide.bs."+this.type);this.$element.trigger(d);if(d.isDefaultPrevented())return;return c.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?c.one(a.support.transition.end,e).emulateTransitionEnd(150):e(),this.hoverState=null,this},b.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||typeof a.attr("data-original-title")!="string")&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},b.prototype.hasContent=function(){return this.getTitle()},b.prototype.getPosition=function(){var b=this.$element[0];return a.extend({},typeof b.getBoundingClientRect=="function"?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},b.prototype.getCalculatedOffset=function(a,b,c,d){return a=="bottom"?{top:b.top+b.height,left:b.left+b.width/2-c/2}:a=="top"?{top:b.top-d,left:b.left+b.width/2-c/2}:a=="left"?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},b.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||(typeof c.title=="function"?c.title.call(b[0]):c.title),a},b.prototype.tip=function(){return this.$tip=this.$tip||a(this.options.template)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},b.prototype.validate=function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},b.prototype.enable=function(){this.enabled=!0},b.prototype.disable=function(){this.enabled=!1},b.prototype.toggleEnabled=function(){this.enabled=!this.enabled},b.prototype.toggle=function(b){var c=b?a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type):this;c.tip().hasClass("in")?c.leave(c):c.enter(c)},b.prototype.destroy=function(){clearTimeout(this.timeout),this.hide().$element.off("."+this.type).removeData("bs."+this.type)};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f=typeof c=="object"&&c;if(!e&&c=="destroy")return;e||d.data("bs.tooltip",e=new b(this,f)),typeof c=="string"&&e[c]()})},a.fn.tooltip.Constructor=b,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}(jQuery)/*!
 * typeahead.js 0.10.2
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

!function(a){var b={isMsie:function(){return/(msie|trident)/i.test(navigator.userAgent)?navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2]:!1},isBlankString:function(a){return!a||/^\s*$/.test(a)},escapeRegExChars:function(a){return a.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")},isString:function(a){return"string"==typeof a},isNumber:function(a){return"number"==typeof a},isArray:a.isArray,isFunction:a.isFunction,isObject:a.isPlainObject,isUndefined:function(a){return"undefined"==typeof a},bind:a.proxy,each:function(b,c){function d(a,b){return c(b,a)}a.each(b,d)},map:a.map,filter:a.grep,every:function(b,c){var d=!0;return b?(a.each(b,function(a,e){return(d=c.call(null,e,a,b))?void 0:!1}),!!d):d},some:function(b,c){var d=!1;return b?(a.each(b,function(a,e){return(d=c.call(null,e,a,b))?!1:void 0}),!!d):d},mixin:a.extend,getUniqueId:function(){var a=0;return function(){return a++}}(),templatify:function(b){function c(){return String(b)}return a.isFunction(b)?b:c},defer:function(a){setTimeout(a,0)},debounce:function(a,b,c){var d,e;return function(){var f,g,h=this,i=arguments;return f=function(){d=null,c||(e=a.apply(h,i))},g=c&&!d,clearTimeout(d),d=setTimeout(f,b),g&&(e=a.apply(h,i)),e}},throttle:function(a,b){var c,d,e,f,g,h;return g=0,h=function(){g=new Date,e=null,f=a.apply(c,d)},function(){var i=new Date,j=b-(i-g);return c=this,d=arguments,0>=j?(clearTimeout(e),e=null,g=i,f=a.apply(c,d)):e||(e=setTimeout(h,j)),f}},noop:function(){}},c={wrapper:'<span class="twitter-typeahead"></span>',dropdown:'<span class="tt-dropdown-menu"></span>',dataset:'<div class="tt-dataset-%CLASS%"></div>',suggestions:'<span class="tt-suggestions"></span>',suggestion:'<div class="tt-suggestion"></div>'},d={wrapper:{position:"relative",display:"inline-block"},hint:{position:"absolute",top:"0",left:"0",borderColor:"transparent",boxShadow:"none"},input:{position:"relative",verticalAlign:"top",backgroundColor:"transparent"},inputWithNoHint:{position:"relative",verticalAlign:"top"},dropdown:{position:"absolute",top:"100%",left:"0",zIndex:"100",display:"none"},suggestions:{display:"block"},suggestion:{whiteSpace:"nowrap",cursor:"pointer"},suggestionChild:{whiteSpace:"normal"},ltr:{left:"0",right:"auto"},rtl:{left:"auto",right:" 0"}};b.isMsie()&&b.mixin(d.input,{backgroundImage:"url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"}),b.isMsie()&&b.isMsie()<=7&&b.mixin(d.input,{marginTop:"-1px"});var e=function(){function c(b){b&&b.el||a.error("EventBus initialized without el"),this.$el=a(b.el)}var d="typeahead:";return b.mixin(c.prototype,{trigger:function(a){var b=[].slice.call(arguments,1);this.$el.trigger(d+a,b)}}),c}(),f=function(){function a(a,b,c,d){var e;if(!c)return this;for(b=b.split(i),c=d?h(c,d):c,this._callbacks=this._callbacks||{};e=b.shift();)this._callbacks[e]=this._callbacks[e]||{sync:[],async:[]},this._callbacks[e][a].push(c);return this}function b(b,c,d){return a.call(this,"async",b,c,d)}function c(b,c,d){return a.call(this,"sync",b,c,d)}function d(a){var b;if(!this._callbacks)return this;for(a=a.split(i);b=a.shift();)delete this._callbacks[b];return this}function e(a){var b,c,d,e,g;if(!this._callbacks)return this;for(a=a.split(i),d=[].slice.call(arguments,1);(b=a.shift())&&(c=this._callbacks[b]);)e=f(c.sync,this,[b].concat(d)),g=f(c.async,this,[b].concat(d)),e()&&j(g);return this}function f(a,b,c){function d(){for(var d,e=0;!d&&e<a.length;e+=1)d=a[e].apply(b,c)===!1;return!d}return d}function g(){var a;return a=window.setImmediate?function(a){setImmediate(function(){a()})}:function(a){setTimeout(function(){a()},0)}}function h(a,b){return a.bind?a.bind(b):function(){a.apply(b,[].slice.call(arguments,0))}}var i=/\s+/,j=g();return{onSync:c,onAsync:b,off:d,trigger:e}}(),g=function(a){function c(a,c,d){for(var e,f=[],g=0;g<a.length;g++)f.push(b.escapeRegExChars(a[g]));return e=d?"\\b("+f.join("|")+")\\b":"("+f.join("|")+")",c?new RegExp(e):new RegExp(e,"i")}var d={node:null,pattern:null,tagName:"strong",className:null,wordsOnly:!1,caseSensitive:!1};return function(e){function f(b){var c,d;return(c=h.exec(b.data))&&(wrapperNode=a.createElement(e.tagName),e.className&&(wrapperNode.className=e.className),d=b.splitText(c.index),d.splitText(c[0].length),wrapperNode.appendChild(d.cloneNode(!0)),b.parentNode.replaceChild(wrapperNode,d)),!!c}function g(a,b){for(var c,d=3,e=0;e<a.childNodes.length;e++)c=a.childNodes[e],c.nodeType===d?e+=b(c)?1:0:g(c,b)}var h;e=b.mixin({},d,e),e.node&&e.pattern&&(e.pattern=b.isArray(e.pattern)?e.pattern:[e.pattern],h=c(e.pattern,e.caseSensitive,e.wordsOnly),g(e.node,f))}}(window.document),h=function(){function c(c){var e,f,g,i,j=this;c=c||{},c.input||a.error("input is missing"),e=b.bind(this._onBlur,this),f=b.bind(this._onFocus,this),g=b.bind(this._onKeydown,this),i=b.bind(this._onInput,this),this.$hint=a(c.hint),this.$input=a(c.input).on("blur.tt",e).on("focus.tt",f).on("keydown.tt",g),0===this.$hint.length&&(this.setHint=this.getHint=this.clearHint=this.clearHintIfInvalid=b.noop),b.isMsie()?this.$input.on("keydown.tt keypress.tt cut.tt paste.tt",function(a){h[a.which||a.keyCode]||b.defer(b.bind(j._onInput,j,a))}):this.$input.on("input.tt",i),this.query=this.$input.val(),this.$overflowHelper=d(this.$input)}function d(b){return a('<pre aria-hidden="true"></pre>').css({position:"absolute",visibility:"hidden",whiteSpace:"pre",fontFamily:b.css("font-family"),fontSize:b.css("font-size"),fontStyle:b.css("font-style"),fontVariant:b.css("font-variant"),fontWeight:b.css("font-weight"),wordSpacing:b.css("word-spacing"),letterSpacing:b.css("letter-spacing"),textIndent:b.css("text-indent"),textRendering:b.css("text-rendering"),textTransform:b.css("text-transform")}).insertAfter(b)}function e(a,b){return c.normalizeQuery(a)===c.normalizeQuery(b)}function g(a){return a.altKey||a.ctrlKey||a.metaKey||a.shiftKey}var h;return h={9:"tab",27:"esc",37:"left",39:"right",13:"enter",38:"up",40:"down"},c.normalizeQuery=function(a){return(a||"").replace(/^\s*/g,"").replace(/\s{2,}/g," ")},b.mixin(c.prototype,f,{_onBlur:function(){this.resetInputValue(),this.trigger("blurred")},_onFocus:function(){this.trigger("focused")},_onKeydown:function(a){var b=h[a.which||a.keyCode];this._managePreventDefault(b,a),b&&this._shouldTrigger(b,a)&&this.trigger(b+"Keyed",a)},_onInput:function(){this._checkInputValue()},_managePreventDefault:function(a,b){var c,d,e;switch(a){case"tab":d=this.getHint(),e=this.getInputValue(),c=d&&d!==e&&!g(b);break;case"up":case"down":c=!g(b);break;default:c=!1}c&&b.preventDefault()},_shouldTrigger:function(a,b){var c;switch(a){case"tab":c=!g(b);break;default:c=!0}return c},_checkInputValue:function(){var a,b,c;a=this.getInputValue(),b=e(a,this.query),c=b?this.query.length!==a.length:!1,b?c&&this.trigger("whitespaceChanged",this.query):this.trigger("queryChanged",this.query=a)},focus:function(){this.$input.focus()},blur:function(){this.$input.blur()},getQuery:function(){return this.query},setQuery:function(a){this.query=a},getInputValue:function(){return this.$input.val()},setInputValue:function(a,b){this.$input.val(a),b?this.clearHint():this._checkInputValue()},resetInputValue:function(){this.setInputValue(this.query,!0)},getHint:function(){return this.$hint.val()},setHint:function(a){this.$hint.val(a)},clearHint:function(){this.setHint("")},clearHintIfInvalid:function(){var a,b,c,d;a=this.getInputValue(),b=this.getHint(),c=a!==b&&0===b.indexOf(a),d=""!==a&&c&&!this.hasOverflow(),!d&&this.clearHint()},getLanguageDirection:function(){return(this.$input.css("direction")||"ltr").toLowerCase()},hasOverflow:function(){var a=this.$input.width()-2;return this.$overflowHelper.text(this.getInputValue()),this.$overflowHelper.width()>=a},isCursorAtEnd:function(){var a,c,d;return a=this.$input.val().length,c=this.$input[0].selectionStart,b.isNumber(c)?c===a:document.selection?(d=document.selection.createRange(),d.moveStart("character",-a),a===d.text.length):!0},destroy:function(){this.$hint.off(".tt"),this.$input.off(".tt"),this.$hint=this.$input=this.$overflowHelper=null}}),c}(),i=function(){function e(d){d=d||{},d.templates=d.templates||{},d.source||a.error("missing source"),d.name&&!j(d.name)&&a.error("invalid dataset name: "+d.name),this.query=null,this.highlight=!!d.highlight,this.name=d.name||b.getUniqueId(),this.source=d.source,this.displayFn=h(d.display||d.displayKey),this.templates=i(d.templates,this.displayFn),this.$el=a(c.dataset.replace("%CLASS%",this.name))}function h(a){function c(b){return b[a]}return a=a||"value",b.isFunction(a)?a:c}function i(a,c){function d(a){return"<p>"+c(a)+"</p>"}return{empty:a.empty&&b.templatify(a.empty),header:a.header&&b.templatify(a.header),footer:a.footer&&b.templatify(a.footer),suggestion:a.suggestion||d}}function j(a){return/^[_a-zA-Z0-9-]+$/.test(a)}var k="ttDataset",l="ttValue",m="ttDatum";return e.extractDatasetName=function(b){return a(b).data(k)},e.extractValue=function(b){return a(b).data(l)},e.extractDatum=function(b){return a(b).data(m)},b.mixin(e.prototype,f,{_render:function(e,f){function h(){return p.templates.empty({query:e,isEmpty:!0})}function i(){function h(b){var e;return e=a(c.suggestion).append(p.templates.suggestion(b)).data(k,p.name).data(l,p.displayFn(b)).data(m,b),e.children().each(function(){a(this).css(d.suggestionChild)}),e}var i,j;return i=a(c.suggestions).css(d.suggestions),j=b.map(f,h),i.append.apply(i,j),p.highlight&&g({node:i[0],pattern:e}),i}function j(){return p.templates.header({query:e,isEmpty:!o})}function n(){return p.templates.footer({query:e,isEmpty:!o})}if(this.$el){var o,p=this;this.$el.empty(),o=f&&f.length,!o&&this.templates.empty?this.$el.html(h()).prepend(p.templates.header?j():null).append(p.templates.footer?n():null):o&&this.$el.html(i()).prepend(p.templates.header?j():null).append(p.templates.footer?n():null),this.trigger("rendered")}},getRoot:function(){return this.$el},update:function(a){function b(b){c.canceled||a!==c.query||c._render(a,b)}var c=this;this.query=a,this.canceled=!1,this.source(a,b)},cancel:function(){this.canceled=!0},clear:function(){this.cancel(),this.$el.empty(),this.trigger("rendered")},isEmpty:function(){return this.$el.is(":empty")},destroy:function(){this.$el=null}}),e}(),j=function(){function c(c){var d,f,g,h=this;c=c||{},c.menu||a.error("menu is required"),this.isOpen=!1,this.isEmpty=!0,this.datasets=b.map(c.datasets,e),d=b.bind(this._onSuggestionClick,this),f=b.bind(this._onSuggestionMouseEnter,this),g=b.bind(this._onSuggestionMouseLeave,this),this.$menu=a(c.menu).on("click.tt",".tt-suggestion",d).on("mouseenter.tt",".tt-suggestion",f).on("mouseleave.tt",".tt-suggestion",g),b.each(this.datasets,function(a){h.$menu.append(a.getRoot()),a.onSync("rendered",h._onRendered,h)})}function e(a){return new i(a)}return b.mixin(c.prototype,f,{_onSuggestionClick:function(b){this.trigger("suggestionClicked",a(b.currentTarget))},_onSuggestionMouseEnter:function(b){this._removeCursor(),this._setCursor(a(b.currentTarget),!0)},_onSuggestionMouseLeave:function(){this._removeCursor()},_onRendered:function(){function a(a){return a.isEmpty()}this.isEmpty=b.every(this.datasets,a),this.isEmpty?this._hide():this.isOpen&&this._show(),this.trigger("datasetRendered")},_hide:function(){this.$menu.hide()},_show:function(){this.$menu.css("display","block")},_getSuggestions:function(){return this.$menu.find(".tt-suggestion")},_getCursor:function(){return this.$menu.find(".tt-cursor").first()},_setCursor:function(a,b){a.first().addClass("tt-cursor"),!b&&this.trigger("cursorMoved")},_removeCursor:function(){this._getCursor().removeClass("tt-cursor")},_moveCursor:function(a){var b,c,d,e;if(this.isOpen){if(c=this._getCursor(),b=this._getSuggestions(),this._removeCursor(),d=b.index(c)+a,d=(d+1)%(b.length+1)-1,-1===d)return void this.trigger("cursorRemoved");-1>d&&(d=b.length-1),this._setCursor(e=b.eq(d)),this._ensureVisible(e)}},_ensureVisible:function(a){var b,c,d,e;b=a.position().top,c=b+a.outerHeight(!0),d=this.$menu.scrollTop(),e=this.$menu.height()+parseInt(this.$menu.css("paddingTop"),10)+parseInt(this.$menu.css("paddingBottom"),10),0>b?this.$menu.scrollTop(d+b):c>e&&this.$menu.scrollTop(d+(c-e))},close:function(){this.isOpen&&(this.isOpen=!1,this._removeCursor(),this._hide(),this.trigger("closed"))},open:function(){this.isOpen||(this.isOpen=!0,!this.isEmpty&&this._show(),this.trigger("opened"))},setLanguageDirection:function(a){this.$menu.css("ltr"===a?d.ltr:d.rtl)},moveCursorUp:function(){this._moveCursor(-1)},moveCursorDown:function(){this._moveCursor(1)},getDatumForSuggestion:function(a){var b=null;return a.length&&(b={raw:i.extractDatum(a),value:i.extractValue(a),datasetName:i.extractDatasetName(a)}),b},getDatumForCursor:function(){return this.getDatumForSuggestion(this._getCursor().first())},getDatumForTopSuggestion:function(){return this.getDatumForSuggestion(this._getSuggestions().first())},update:function(a){function c(b){b.update(a)}b.each(this.datasets,c)},empty:function(){function a(a){a.clear()}b.each(this.datasets,a),this.isEmpty=!0},isVisible:function(){return this.isOpen&&!this.isEmpty},destroy:function(){function a(a){a.destroy()}this.$menu.off(".tt"),this.$menu=null,b.each(this.datasets,a)}}),c}(),k=function(){function f(c){var d,f,i;c=c||{},c.input||a.error("missing input"),this.isActivated=!1,this.autoselect=!!c.autoselect,this.minLength=b.isNumber(c.minLength)?c.minLength:1,this.$node=g(c.input,c.withHint),d=this.$node.find(".tt-dropdown-menu"),f=this.$node.find(".tt-input"),i=this.$node.find(".tt-hint"),f.on("blur.tt",function(a){var c,e,g;c=document.activeElement,e=d.is(c),g=d.has(c).length>0,b.isMsie()&&(e||g)&&(a.preventDefault(),a.stopImmediatePropagation(),b.defer(function(){f.focus()}))}),d.on("mousedown.tt",function(a){a.preventDefault()}),this.eventBus=c.eventBus||new e({el:f}),this.dropdown=new j({menu:d,datasets:c.datasets}).onSync("suggestionClicked",this._onSuggestionClicked,this).onSync("cursorMoved",this._onCursorMoved,this).onSync("cursorRemoved",this._onCursorRemoved,this).onSync("opened",this._onOpened,this).onSync("closed",this._onClosed,this).onAsync("datasetRendered",this._onDatasetRendered,this),this.input=new h({input:f,hint:i}).onSync("focused",this._onFocused,this).onSync("blurred",this._onBlurred,this).onSync("enterKeyed",this._onEnterKeyed,this).onSync("tabKeyed",this._onTabKeyed,this).onSync("escKeyed",this._onEscKeyed,this).onSync("upKeyed",this._onUpKeyed,this).onSync("downKeyed",this._onDownKeyed,this).onSync("leftKeyed",this._onLeftKeyed,this).onSync("rightKeyed",this._onRightKeyed,this).onSync("queryChanged",this._onQueryChanged,this).onSync("whitespaceChanged",this._onWhitespaceChanged,this),this._setLanguageDirection()}function g(b,e){var f,g,h,j;f=a(b),g=a(c.wrapper).css(d.wrapper),h=a(c.dropdown).css(d.dropdown),j=f.clone().css(d.hint).css(i(f)),j.val("").removeData().addClass("tt-hint").removeAttr("id name placeholder").prop("disabled",!0).attr({autocomplete:"off",spellcheck:"false"}),f.data(l,{dir:f.attr("dir"),autocomplete:f.attr("autocomplete"),spellcheck:f.attr("spellcheck"),style:f.attr("style")}),f.addClass("tt-input").attr({autocomplete:"off",spellcheck:!1}).css(e?d.input:d.inputWithNoHint);try{!f.attr("dir")&&f.attr("dir","auto")}catch(k){}return f.wrap(g).parent().prepend(e?j:null).append(h)}function i(a){return{backgroundAttachment:a.css("background-attachment"),backgroundClip:a.css("background-clip"),backgroundColor:a.css("background-color"),backgroundImage:a.css("background-image"),backgroundOrigin:a.css("background-origin"),backgroundPosition:a.css("background-position"),backgroundRepeat:a.css("background-repeat"),backgroundSize:a.css("background-size")}}function k(a){var c=a.find(".tt-input");b.each(c.data(l),function(a,d){b.isUndefined(a)?c.removeAttr(d):c.attr(d,a)}),c.detach().removeData(l).removeClass("tt-input").insertAfter(a),a.remove()}var l="ttAttrs";return b.mixin(f.prototype,{_onSuggestionClicked:function(a,b){var c;(c=this.dropdown.getDatumForSuggestion(b))&&this._select(c)},_onCursorMoved:function(){var a=this.dropdown.getDatumForCursor();this.input.setInputValue(a.value,!0),this.eventBus.trigger("cursorchanged",a.raw,a.datasetName)},_onCursorRemoved:function(){this.input.resetInputValue(),this._updateHint()},_onDatasetRendered:function(){this._updateHint()},_onOpened:function(){this._updateHint(),this.eventBus.trigger("opened")},_onClosed:function(){this.input.clearHint(),this.eventBus.trigger("closed")},_onFocused:function(){this.isActivated=!0,this.dropdown.open()},_onBlurred:function(){this.isActivated=!1,this.dropdown.empty(),this.dropdown.close()},_onEnterKeyed:function(a,b){var c,d;c=this.dropdown.getDatumForCursor(),d=this.dropdown.getDatumForTopSuggestion(),c?(this._select(c),b.preventDefault()):this.autoselect&&d&&(this._select(d),b.preventDefault())},_onTabKeyed:function(a,b){var c;(c=this.dropdown.getDatumForCursor())?(this._select(c),b.preventDefault()):this._autocomplete(!0)},_onEscKeyed:function(){this.dropdown.close(),this.input.resetInputValue()},_onUpKeyed:function(){var a=this.input.getQuery();this.dropdown.isEmpty&&a.length>=this.minLength?this.dropdown.update(a):this.dropdown.moveCursorUp(),this.dropdown.open()},_onDownKeyed:function(){var a=this.input.getQuery();this.dropdown.isEmpty&&a.length>=this.minLength?this.dropdown.update(a):this.dropdown.moveCursorDown(),this.dropdown.open()},_onLeftKeyed:function(){"rtl"===this.dir&&this._autocomplete()},_onRightKeyed:function(){"ltr"===this.dir&&this._autocomplete()},_onQueryChanged:function(a,b){this.input.clearHintIfInvalid(),b.length>=this.minLength?this.dropdown.update(b):this.dropdown.empty(),this.dropdown.open(),this._setLanguageDirection()},_onWhitespaceChanged:function(){this._updateHint(),this.dropdown.open()},_setLanguageDirection:function(){var a;this.dir!==(a=this.input.getLanguageDirection())&&(this.dir=a,this.$node.css("direction",a),this.dropdown.setLanguageDirection(a))},_updateHint:function(){var a,c,d,e,f,g;a=this.dropdown.getDatumForTopSuggestion(),a&&this.dropdown.isVisible()&&!this.input.hasOverflow()?(c=this.input.getInputValue(),d=h.normalizeQuery(c),e=b.escapeRegExChars(d),f=new RegExp("^(?:"+e+")(.+$)","i"),g=f.exec(a.value),g?this.input.setHint(c+g[1]):this.input.clearHint()):this.input.clearHint()},_autocomplete:function(a){var b,c,d,e;b=this.input.getHint(),c=this.input.getQuery(),d=a||this.input.isCursorAtEnd(),b&&c!==b&&d&&(e=this.dropdown.getDatumForTopSuggestion(),e&&this.input.setInputValue(e.value),this.eventBus.trigger("autocompleted",e.raw,e.datasetName))},_select:function(a){this.input.setQuery(a.value),this.input.setInputValue(a.value,!0),this._setLanguageDirection(),this.eventBus.trigger("selected",a.raw,a.datasetName),this.dropdown.close(),b.defer(b.bind(this.dropdown.empty,this.dropdown))},open:function(){this.dropdown.open()},close:function(){this.dropdown.close()},setVal:function(a){this.isActivated?this.input.setInputValue(a):(this.input.setQuery(a),this.input.setInputValue(a,!0)),this._setLanguageDirection()},getVal:function(){return this.input.getQuery()},destroy:function(){this.input.destroy(),this.dropdown.destroy(),k(this.$node),this.$node=null}}),f}();!function(){var c,d,f;c=a.fn.typeahead,d="ttTypeahead",f={initialize:function(c,f){function g(){var g,h,i=a(this);b.each(f,function(a){a.highlight=!!c.highlight}),h=new k({input:i,eventBus:g=new e({el:i}),withHint:b.isUndefined(c.hint)?!0:!!c.hint,minLength:c.minLength,autoselect:c.autoselect,datasets:f}),i.data(d,h)}return f=b.isArray(f)?f:[].slice.call(arguments,1),c=c||{},this.each(g)},open:function(){function b(){var b,c=a(this);(b=c.data(d))&&b.open()}return this.each(b)},close:function(){function b(){var b,c=a(this);(b=c.data(d))&&b.close()}return this.each(b)},val:function(b){function c(){var c,e=a(this);(c=e.data(d))&&c.setVal(b)}function e(a){var b,c;return(b=a.data(d))&&(c=b.getVal()),c}return arguments.length?this.each(c):e(this.first())},destroy:function(){function b(){var b,c=a(this);(b=c.data(d))&&(b.destroy(),c.removeData(d))}return this.each(b)}},a.fn.typeahead=function(a){return f[a]?f[a].apply(this,[].slice.call(arguments,1)):f.initialize.apply(this,arguments)},a.fn.typeahead.noConflict=function(){return a.fn.typeahead=c,this}}()}(window.jQuery);bfe.define('src/bfestore', ['require', 'exports', 'module' , 'src/lib/lodash.min'], function(require, exports, module) {
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
                //if (propertyURI == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                //    prop = "@type";
                //}
                j[prop] = [];
                groupedProperties[propertyURI].forEach(function(r) {
                    if (r.otype == "uri") {
                        j[prop].push({"@id": r.o});
                    } else {
                        var o = {}
                        if (r.olang !== undefined && r.olang !== "") {
                            o["@language"] = r.olang;
                        }
                        o["@value"] = r.o;
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
                    predata += nlindentindent + t["@id"];
                });
            }
            for (var t in resource) {
                if (t !== "@type" && t !== "@id") {
                    var prop = t.replace("http://bibframe.org/vocab/", "bf:");
                    prop = prop.replace("http://id.loc.gov/vocabulary/relators/", "relators:");
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
});bfe.define('src/bfelogging', ['require', 'exports', 'module' ], function(require, exports, module) {

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

});bfe.define('src/lookups/lcnames', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
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
            rdftype = "rdftype:FamilyName";
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
            if ( query.length > 2 ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q;
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
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        if (propertyuri.indexOf("http://bibframe.org/vocab/") > -1 || propertyuri.indexOf("http://id.loc.gov/vocabulary/relators/") > -1) {
            triple = {};
            triple.s = subjecturi
            triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
            triple.o = selected.value;
            triple.otype = "literal";
            triple.olang = "en";
            triples.push(triple);
        
            triple = {};
            triple.s = subjecturi
            triple.p = "http://bibframe.org/vocab/authoritySource";
            triple.o = selected.source;
            triple.otype = "uri";
            triples.push(triple);
        }
        
        process(triples);
        /*
        If you wanted/needed to make another call.
        */
        /*
        var u = selected.uri + ".jsonp";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                var triple = {};
                //triple.guid = guid();
                triple.s = subjecturi
                triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
                triple.o = selected.value;
                triple.otype = "literal";
                triple.olang = "en";
                triples.push(triple);
                process(triples);
            }
        });
        */
    
    }
    

});
bfe.define('src/lookups/lcshared', ['require', 'exports', 'module' ], function(require, exports, module) {

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

});bfe.define('src/lookups/lcsubjects', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
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
            rdftype = "rdftype:FamilyName";
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
            if ( query.length > 2 ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q;
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
    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        if (propertyuri.indexOf("http://bibframe.org/vocab/") > -1 || propertyuri.indexOf("http://id.loc.gov/vocabulary/relators/") > -1) {
            triple = {};
            triple.s = subjecturi
            triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
            triple.o = selected.value;
            triple.otype = "literal";
            triple.olang = "en";
            triples.push(triple);
        }
        
        process(triples);
        /*
        If you wanted/needed to make another call.
        */
        /*
        var u = selected.uri + ".jsonp";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                var triple = {};
                //triple.guid = guid();
                triple.s = subjecturi
                triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
                triple.o = selected.value;
                triple.otype = "literal";
                triple.olang = "en";
                triples.push(triple);
                process(triples);
            }
        });
        */
    
    }

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
                
        this.searching = setTimeout(function() {
            if ( query.length > 2 ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=10&q=" + q;
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
        
        process(triples);
        /*
        If you wanted/needed to make another call.
        */
        /*
        var u = selected.uri + ".jsonp";
        $.ajax({
            url: u,
            dataType: "jsonp",
            success: function (data) {
                var triple = {};
                //triple.guid = guid();
                triple.s = subjecturi
                triple.p = "http://bibframe.org/vocab/authorizedAccessPoint";
                triple.o = selected.value;
                triple.otype = "literal";
                triple.olang = "en";
                triples.push(triple);
                process(triples);
            }
        });
        */
    
    }

});
//bfe.define("lcnames", [], function() {
bfe.define('src/lookups/lcworks', ['require', 'exports', 'module' ], function(require, exports, module) {
    //require("staticjs/jquery-1.11.0.min");
    //require("lib/typeahead.jquery.min");

    // Using twitter's typeahead, store may be completely unnecessary
    var cache = [];
    
    exports.scheme = "http://id.loc.gov/resources/works";

    exports.source = function(query, process, formobject) {
        
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
        q = q + " " + query
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
        
        var scheme = "http://id.loc.gov/resources/instances";
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
        q = q + " " + query
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

});bfe.define('src/lookups/lcorganizations', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/organizations";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/organizations/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/organizations");
                console.log(u);
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
        
        triple = {};
        triple.s = subjecturi
        triple.p = "http://bibframe.org/vocab/authoritySource";
        triple.o = selected.source;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/lccountries', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/countries";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/countries/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/countries");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/lcgacs', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/geographicAreas";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/geographicAreas/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/geographicAreas");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/lclanguages', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/languages";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/languages/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/languages");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/lcidentifiers', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/identifiers";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/identifiers/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/identifiers");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/lctargetaudiences', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/targetAudiences";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/targetAudiences/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/targetAudiences");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/iso6391', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-1";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/iso639-1/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/iso639-1");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/iso6392', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-2";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/iso639-2/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/iso639-2");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/iso6395', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/iso639-5";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/iso639-5/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/iso639-5");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/rdacontenttypes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/contentTypes";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/contentTypes/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/contentTypes");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/rdamediatypes', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/mediaTypes";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/mediaTypes/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/mediaTypes");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
bfe.define('src/lookups/rdacarriers', ['require', 'exports', 'module' , 'src/lookups/lcshared'], function(require, exports, module) {
    var lcshared = require("src/lookups/lcshared");

    var cache = [];
    
    exports.scheme = "http://id.loc.gov/vocabulary/carriers";

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
            if ( query.length > 1 ) {
                u = "http://id.loc.gov/vocabulary/carriers/suggest/?q=" + q;
                $.ajax({
                    url: u,
                    dataType: "jsonp",
                    success: function (data) {
                        parsedlist = lcshared.processSuggestions(data, query);
                        cache[q] = parsedlist;
                        return process(parsedlist);
                    }
                });
            } else if ( query.length === 1 && query == "?" ) {
                u = "http://id.loc.gov/search/?format=jsonp&start=1&count=20&q=" + encodeURI("cs:http://id.loc.gov/vocabulary/carriers");
                console.log(u);
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
    

    exports.getResource = function(subjecturi, propertyuri, selected, process) {
        var triples = [];
        
        var triple = {};
        triple.s = subjecturi
        triple.p = propertyuri;
        triple.o = selected.uri;
        triple.otype = "uri";
        triples.push(triple);
        
        process(triples);
    }

});
/*
    kefo: The immediate function is copied from the Ace editor repository 
    and modified (mostly deletions) to work in this context.  This 
    file is needed to define the javascript bfe 
    namespace since we use dryice to build and not requirejs.
    From: https://github.com/ajaxorg/ace/blob/master/lib/ace/config.js
    
    Beyond the note above, it is not used in any other way.
*/

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
;
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
        