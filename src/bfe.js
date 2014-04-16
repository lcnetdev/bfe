/*
function bfe() {}

bfe.prototype.editor = function(id) {
    div = document.getElementById(id);
    div.innerHTML = "Hello there";
}

var bfe = new bfe();
*/

define(function(require, exports, module) {
    require("staticjs/jquery-1.11.0.min");
    require("lib/json");
    require("lib/underscore-min");
    require("bootstrapjs");
    require("lib/typeahead.jquery.min");
    require("lib/rdf_store_min");
    
    var editorconfig = {};
    //var store = [];
    var store = new rdfstore.Store();
    var profiles = [];
    var resourceTemplates = [];
    var startingPoints = [];
    var formTemplates = [];
    var lookups = [];
    var currentModal = 0;
    
    var loadtemplates = [];
    var loadtemplatesCount = 0;
    var loadtemplatesCounter = 0;
    
    var lookupstore = [];
    var lookupcache = [];
    
    var editordiv;
    
    var forms = [];
    
    exports.setConfig = function(config) {
        editorconfig = config;
        var files = [];
        for (var i=0; i < config.profiles.length; i++) {
            files[i] = "json!static/profiles/" + config.profiles[i] + ".json";
            file = "static/profiles/" + config.profiles[i] + ".json";
            console.log("Loading profile: " + config.profiles[i]);
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
        
        for (var i=0; i < config.lookups.length; i++) {
            var lu = config.lookups[i];
            console.log("Loading " + lu.load);
            require([lu.load], function(r) {
                    setLookup(r);
                });
        }
        editorconfig.baseURI = "http://example.org/";
    }
    
    exports.editor = function (config, id) {
        
        this.setConfig(config);
        
        editordiv = div = document.getElementById(id);
        
        var menudiv = $('<div>', {id: "bfeditor-menudiv", class: "col-md-2 sidebar"});
        for (var h=0; h < config.startingPoints.length; h++) {
            var sp = config.startingPoints[h];
            var menuul = $('<ul>', {class: "nav nav-stacked"});
            var menuheadingul = null;
            if (typeof sp.menuGroup !== undefined && sp.menuGroup !== "") {
                menuheading = $('<li><h5 style="font-weight: bold">' + sp.menuGroup + '</h5></li>');
                menuheadingul = $('<ul class="nav"></ul>');
                menuheading.append(menuheadingul);
                menuul.append(menuheading);
            }
            for (var i=0; i < sp.menuItems.length; i++) {
                var li = $('<li>');
                var a = $('<a>', {href: "#", id: "sp-" + h + "_" + i});
                a.html(sp.menuItems[i].label);
                $(a).click(function(){
                    menuSelect(this.id);
                });
                li = li.append(a);
                if ( menuheadingul !== null ) {
                    menuheadingul.append(li);
                } else {
                    menuul.append(li);
                }
            }
            menudiv.append(menuul);
        }
        
        var formdiv = $('<div>', {id: "bfeditor-formdiv", class: "col-md-8"});
        
        var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});
        
        var rowdiv = $('<div>', {class: "row"});
        
        rowdiv.append(menudiv);
        rowdiv.append(formdiv);
        rowdiv.append(optiondiv);

        $(div).append(rowdiv);
    
        // Debug div
        var debugdiv = $('<div>', {class: "col-md-12"});
        debugdiv.html("Debug output");
        var debugpre = $('<pre>', {id: "bfeditor-debug"});
        debugdiv.append(debugpre);
        $(div).append(debugdiv);
        debugpre.html(JSON.stringify(profiles, undefined, " "));
        
        if (config.load !== undefined) {
            loadtemplatesCount = config.load.length;
            config.load.forEach(function(l){
                $.ajax({
                    url: l.defaulturi + '.bibframe_raw.jsonp',
                    dataType: "jsonp",
                    success: function (data) {
                        var ntriples = [];
                        for (var s in data) {
                            for (var p in data[s]) {
                                var triple = [];
                                triple.push(s);
                                triple.push(p);
                                data[s][p].forEach(function(o) {
                                    if (o.type == "uri") {
                                        triple.push('<' + o.value + '>');
                                    } else if (o.type == "bnode") {
                                        triple.push(o.value);
                                    } else {
                                        triple.push('"' + o.value + '"');
                                    }
                                    var ntriple = triple.join(" ") + ' . ';
                                    ntriples.push(ntriple);
                                });
                            }
                        }
                        ntriples = ntriples.join("\n");
                        //console.log(ntriples);
                        store.load('text/n3', ntriples, function(success){
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
                                        console.log(triple);
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
                    }
                });
            });
        }

        return {
            "profiles": profiles,
            "div": div
        };
    };
    
    function setLookup(r) {
        //console.log(r);
        console.log(r.scheme);
        for (var i=0; i < config.lookups.length; i++) {
            var lu = config.lookups[i];
            for (var j=0; j < lu.schemes.length; j++) {
                if (lu.schemes[j] == r.scheme) {
                    var luobject = {};
                    console.log("Setting scheme " + lu.schemes[j]);
                    luobject.name = lu.name;
                    luobject.scheme = lu.schemes[j];
                    luobject.load = r;
                    lookups.push(luobject);
                }
            }
        }
    }
    
    function cbLoadTemplates() {
        loadtemplatesCounter++;
        if (loadtemplatesCount == loadtemplatesCounter) {
            console.log("Got here");
            form = getForm(loadtemplates);
            $( ".typeahead", form.form ).each(function() {
                setTypeahead(this);
                });
            $("#bfeditor-formdiv").html("");
            $("#bfeditor-formdiv").append(form.form);
            $("#bfeditor-debug").html(JSON.stringify(form.formobject.store, undefined, " "));
        }
    }
    
    function menuSelect (spid) {
        store = new rdfstore.Store();
        spnums = spid.replace('sp-', '').split("_");
        spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
        var useguid = guid();
        form = getForm(spoints.useResourceTemplates, useguid);
        $( ".typeahead", form.form ).each(function() {
            setTypeahead(this);
        });
        $("#bfeditor-formdiv").html("");
        $("#bfeditor-formdiv").append(form.form);
        $("#bfeditor-debug").html(JSON.stringify(form.formobject.store, undefined, " "));
    }
    
    /*
    loadTemplates is an array of objects, each with this structure:
        {
            id=guid,
            rtID=resourceTemplateID,
            defaulturi="",
            data=bfestore
        }
    */
    function getForm (loadTemplates) {
        
        var rt;
        var property;
        
        var fguid = guid();
        var fobject = {};
        fobject.id = fguid;
        fobject.store = [];
        fobject.resourceTemplates = [];
        fobject.resourceTemplateIDs = [];
        fobject.formTemplates = [];
        
        for (var urt=0; urt < loadTemplates.length; urt++) {
            //console.log(loadTemplates[urt]);
            var urtid = loadTemplates[urt].rtID;
            var rt = _.where(resourceTemplates, {"id": urtid})
            if ( rt !== undefined ) {
                fobject.resourceTemplates[urt] = JSON.parse(JSON.stringify(rt[0]));
                //console.log(loadTemplates[urt].data);
                fobject.resourceTemplates[urt].data = loadTemplates[urt].data;
                fobject.resourceTemplates[urt].defaulturi = loadTemplates[urt].defaulturi;
                fobject.resourceTemplates[urt].useguid = loadTemplates[urt].id;
                fobject.resourceTemplateIDs[urt] = rt[0].id;
            }
        }
        
        fobject.resourceTemplates.forEach(function(rt) {
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
            rt.guid = rt.useguid;
            
            rt.propertyTemplates.forEach(function(property) {
                var pguid = guid();
                property.guid = pguid;
                property.display = "true";
                if (_.has(property, "valueConstraint")) {
                    if (_.has(property.valueConstraint, "valueTemplateRefs")) {
                        var vtRefs = property.valueConstraint.valueTemplateRefs;
                        for ( var v=0; v < vtRefs.length; v++) {
                            var vtrs = vtRefs[v];
                            if ( fobject.resourceTemplateIDs.indexOf(vtrs) > -1 && vtrs != rt.id ) {
                                var relatedTemplates = _.where(fobject.store, {rtID: vtrs});
                                triple = {}
                                triple.guid = guid();
                                triple.s = uri;
                                triple.p = property.propertyURI;
                                triple.o = relatedTemplates[0].s;
                                triple.otype = "uri";
                                fobject.store.push(triple);
                                property.display = "false";
                            }
                        }
                    }
                }
            });
        });
        
        // Let's create the form
        var form = $('<form>', {id: "bfeditor-form-" + fobject.id, class: "form-horizontal", role: "form"});
        var forEachFirst = true;
        fobject.resourceTemplates.forEach(function(rt) {
            var resourcediv = $('<div>', {id: rt.guid});
            rt.propertyTemplates.forEach(function(property) {
                
                var formgroup = $('<div>', {class: "form-group"});
                var label = $('<label for="' + property.guid + '" class="col-sm-3 control-label">' + property.propertyLabel + '</label>');
                var saves = $('<div class="form-group"><div class="col-sm-3"></div><div class="col-sm-8"><div class="btn-toolbar" role="toolbar"></div></div></div>');
                
                if (property.type == "literal") {
                    
                    var input = $('<div class="col-sm-8"><input type="email" class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '"></div>');
                    
                    button = $('<button type="button" class="btn btn-default">Set</button>');
                    $(button).click(function(){
                        setLiteral(fobject.id, rt.guid, property.guid);
                    });
                    
                    formgroup.append(label);
                    formgroup.append(input);
                    formgroup.append(button);
                    formgroup.append(saves);
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
                            buttondiv = $('<div class="col-sm-8" id="' + property.guid +'"></div>');
                            buttongrp = $('<div class="btn-group btn-group-sm"></div>');
                            var vtRefs = property.valueConstraint.valueTemplateRefs;
                            for ( var v=0; v < vtRefs.length; v++) {
                                var vtrs = vtRefs[v];
                                //console.log(vtrs);
                                var valueTemplates = _.where(resourceTemplates, {"id": vtrs});
                                if (valueTemplates[0] !== undefined) {
                                    var vt = valueTemplates[0];
                                    //console.log(vt);
                                    var b = $('<button type="button" class="btn btn-default">' + vt.resourceLabel + '</button>');
                                    
                                    var fid = fobject.id;
                                    var rtid = rt.guid;
                                    var pid = property.guid;
                                    if ( property.propertyLabel == "Has Other Edition") {
                                        console.log("form id: " + fobject.id);
                                        console.log("Other edition id: " + property.guid);
                                    }
                                    $(b).click({fobjectid: fid, rtguid: rtid, propertyguid: pid, template: vt}, function(event){
                                        //console.log(event.data.template);
                                        openModal(event.data.fobjectid, event.data.rtguid, event.data.propertyguid, event.data.template, []);
                                    });
                                    buttongrp.append(b);
                                }
                            }
                            buttondiv.append(buttongrp);
                            
                            formgroup.append(label);
                            formgroup.append(buttondiv);
                            formgroup.append(saves);
                        } else if (_.has(property.valueConstraint, "useValuesFrom")) {
                            
                            var inputdiv = $('<div class="col-sm-8"></div>');
                            var input = $('<input type="text" class="typeahead form-control" data-propertyguid="' + property.guid + '" id="' + property.guid + '" placeholder="' + property.propertyLabel + '">');
                            
                            inputdiv.append(input);
                            
                            formgroup.append(label);
                            formgroup.append(inputdiv);
                            //formgroup.append(button);
                            formgroup.append(saves);
                            
                            if (forEachFirst && property.propertyLabel.indexOf("Lookup") !== -1) {
                                // This is the first propertty *and* it is a look up.
                                // Let's treat it special-like.
                                var saveLookup = $('<div class="modal-header" style="text-align: right;"><button type="button" class="btn btn-primary" id="bfeditor-modalSaveLookup-' + fobject.id + '">Save changes</button></div>');
                                var spacer = $('<div class="modal-header" style="text-align: center;"><h2>OR</h2></div>');
                                formgroup.append(saveLookup);
                                formgroup.append(spacer);
                            }
                            
                        } else {
                            // Type is resource, so should be a URI, but there is
                            // no "value template reference" or "use values from vocabularies" 
                            // reference for it so just create label field
                            var input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '"></div>');
                    
                            button = $('<button type="button" class="btn btn-default">Set</button>');
                                $(button).click(function(){
                                    setResourceFromLabel(fobject.id, rt.guid, property.guid);
                            });
                            
                            formgroup.append(label);
                            formgroup.append(input);
                            formgroup.append(button);
                            formgroup.append(saves);
                    
                        }
                    } else {
                        // Type is resource, so should be a URI, but there is
                        // no constraint for it so just create a label field.
                        var input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '"></div>');
                    
                        button = $('<button type="button" class="btn btn-default">Set</button>');
                            $(button).click(function(){
                                setResourceFromLabel(fobject.id, rt.guid, property.guid);
                        });
                            
                        formgroup.append(label);
                        formgroup.append(input);
                        formgroup.append(button);
                        formgroup.append(saves);
                    }
                }
                
                resourcediv.append(formgroup);
                forEachFirst = false;
            });
            form.append(resourcediv);
        });
        
        fobject.resourceTemplates.forEach(function(rt) {
            rt.data.forEach(function(t) {
                var triple = {}
                triple = t;
                triple.guid = guid();
                fobject.store.push(triple);
            });
            rt.propertyTemplates.forEach(function(property) {
                console.log(rt.data);
                console.log(property.propertyURI);
                var propsdata = _.where(rt.data, {"p": property.propertyURI});
                if (propsdata[0] !== undefined) {
                    console.log(propsdata);
                    propsdata.forEach(function(pd) {
                        var $formgroup = $("#" + property.guid, form).closest(".form-group");
                        var $save = $formgroup.find(".btn-toolbar").eq(0);
                        //console.log(formgroup);
                        
                        displaydata = pd.s;
                        var bgvars = { 
                            "tguid": pd.guid, 
                            "tlabelhover": displaydata,
                            "tlabel": displaydata,
                            "fobjectid": fobject.id,
                            "inputid": pd.id,
                            "triples": propsdata
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
                    if (_.has(property.valueConstraint, "defaultURI")) {
                        var data = property.valueConstraint.defaultURI;
                        // set the triple
                        var triple = {}
                        triple.guid = guid();
                        //console.log("data is " + data);
                        //console.log("tguid " + triple.guid);
                        triple.s = editorconfig.baseURI + rt.guid;
                        triple.p = property.propertyURI;
                        triple.o = data;
                        triple.otype = "uri";
                        //store.push(triple);
                        fobject.store.push(triple);
                        
                            // set the form
                        var $formgroup = $("#" + property.guid, form).closest(".form-group");
                        var $save = $formgroup.find(".btn-toolbar").eq(0);
                        //console.log(formgroup);
                        
                        var display = "";
                        if (_.has(property.valueConstraint, "defaultLiteral")) {
                            display = property.valueConstraint.defaultLiteral;
                        }
                        displaydata = display;
                        var bgvars = { 
                            "tguid": triple.guid , 
                            "tlabelhover": displaydata,
                            "tlabel": displaydata,
                            "fobjectid": fobject.id,
                            "inputid": triple.guid,
                            "triples": triple
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
        /*
        if (forms[0] === undefined) {
            console.log("setting fobject to forms - 1st time");
            console.log("guid of has oether edition: " + fobject.resourceTemplates[0].propertyTemplates[13].guid);
        } else {
            console.log("setting fobject to forms");
            console.log("guid of has oether edition: " + forms[0].resourceTemplates[0].propertyTemplates[13].guid);
        }
        */
        forms.push(fobject);
        console.log(fobject);
        return { formobject: fobject, form: form };
    }
    
    function openModal(callingformobjectid, rtguid, propertyguid, template, triples) {
        
        console.log("rtguid is : " + rtguid);
        console.log("propertyguid when opening modal: " + propertyguid);
        console.log("callingformobjectid when opening modal: " + callingformobjectid);
        
        /*
        var callingformobject1 = _.where(forms, {"id": callingformobjectid});
        callingformobject1 = callingformobject1[0];
        console.log("Calling openModal");
        console.log("formobjectID is: " + callingformobjectid);
        console.log("propertyguid is: " + propertyguid);
        console.log(callingformobject1);
        console.log("guid of has oether edition: " + forms[0].resourceTemplates[0].propertyTemplates[13].guid);
        */
        var useguid = guid();
        var ts = _.where(triples, {s: rtguid});
        if ( ts[0] !== undefined ) {
            useguid = ts[0].o.substr(ts[0].o.lastIndexOf('/') + 1);
            console.log(useguid);
        }
        currentModal++;
        var form = getForm([template.id], useguid);
        
        // Modals
        var modal = '<div class="modal fade" id="bfeditor-modal-modalID" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"> \
            <div class="modal-dialog"> \
                <div class="modal-content"> \
                    <div class="modal-header"> \
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                        <h4 class="modal-title" id="bfeditor-modaltitle-modalID">Modal title</h4> \
                    </div> \
                    <div class="modal-body" id="bfeditor-modalbody-modalID"></div> \
                    <div class="modal-footer"> \
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> \
                        <button type="button" class="btn btn-primary" id="bfeditor-modalSave-modalID">Save changes</button> \
                    </div> \
                </div> \
            </div> \
        </div> '
        var m = modal.replace(/modalID/g, form.formobject.id);
        m = $(m);
        $(editordiv).append(m);

        /*
        console.log("Modal form created.");
        console.log("guid of has oether edition: " + forms[0].resourceTemplates[0].propertyTemplates[13].guid);
        */
        //console.log(JSON.stringify(template));
        //var m = $('#bfeditor-modal-' + currentModal);
        //$('#bfeditor-modalbody-' + form.formobject.id).empty();
        $('#bfeditor-modalbody-' + form.formobject.id).append(form.form);
        $('#bfeditor-modaltitle-' + form.formobject.id).html(template.resourceLabel);
            
        $('#bfeditor-modal-' + form.formobject.id).modal('show');
        $('#bfeditor-modalSave-' + form.formobject.id).click(function(){
            setResourceFromModal(callingformobjectid, form.formobject.id, rtguid, propertyguid, form.formobject.store);
        });
        $('#bfeditor-modalSaveLookup-' + form.formobject.id).click(function(){
            setResourceFromModal(callingformobjectid, form.formobject.id, rtguid, propertyguid, form.formobject.store);
        });
        $('#bfeditor-modal-' + form.formobject.id).on("hide.bs.modal", function(e) {
            $(this).empty();
        });
        
        $( ".typeahead", form.form ).each(function() {
            setTypeahead(this);
        });
        
        var formobject = form.formobject;
        triples.forEach(function(t){
                        //var tguid = guid();
                        //t.guid = tguid;
                        formobject.store.push(t);
                        //console.log("iteration: " + c);
                        //console.log(formobject.store);
                        /*
                        Can't think of why I wouldn't always want the object,
                        at least presently, before lunch.
                        tlabel = "";
                        if (t.p.match(/label|authorizedAccess/i)) { 
                            tlabel = t.o;
                        }
                        */
                        var tlabel = t.o;
                        //console.log(tlabel);

                        formobject.resourceTemplates.forEach(function(rt) {
                            var properties = _.where(rt.propertyTemplates, {"propertyURI": t.p});
                            //console.log(properties);
                            if ( properties[0] !== undefined ) {
                                var property = properties[0];
                                var pguid = property.guid;
                        
                                var formgroup = $("#" + pguid, formobject.form).closest(".form-group");
                                var save = $(formgroup).find(".btn-toolbar")[0];
                    
                                var buttongroup = $('<div>', {id: t.guid, class: "btn-group btn-group-xs"});
                                if ( tlabel !== "" ) {
                                    if (tlabel.length > 10) {
                                        display = tlabel.substr(0,10) + "...";
                                    } else {
                                        display = tlabel;
                                    }
                                } else {
                                    display = t.s.substr(0,10) + "...";
                                }
                                //console.log(display);
                                //console.log(pguid);
                                /*
                                var displaybutton = $('<button type="button" class="btn btn-default" title="' + tlabel + '">' + display +'</button>');
                                var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                                $(delbutton).click(function(){
                                    removeTriples(formobject.id, pguid, returntriples);
                                });
                            
                                buttongroup.append(displaybutton);
                                buttongroup.append(delbutton);
                                */
                                var $displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
                                buttongroup.append($displaybutton);
                    
                                var $editbutton = $('<button type="button" class="btn btn-warning">e</button>');
                                $editbutton.click(function(){
                                    editTriples(formobject.id, pguid, returntriples);
                                });
                                buttongroup.append($editbutton);
                                var $delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                                $delbutton.click(function(){
                                    removeTriples(formobject.id, pguid, returntriples);
                                });
                                buttongroup.append($delbutton);
                            
                                $(save).append(buttongroup);
                    
                                $("#" + pguid, formobject.form).val("");
                                $("#" + pguid, formobject.form).typeahead('val', "");
                                $("#" + pguid, formobject.form).typeahead('close');
                    
                                    //console.log(triples);
                    
                                //if (property.repeatable !== undefined && property.repeatable == "false") {
                                //    $("#" + pguid, formobject.form).attr("disabled", true);
                                //}
                                if (property.valueConstraint !== undefined && property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                                    console.log("prop is not repeatable");
                                    var $el = $("#" + pguid, formobject.form)
                                    if ($el.is("input")) {
                                        $el.prop("disabled", true);
                                        $el.css( "background-color", "#EEEEEE" );
                                    } else {
                                        //console.log(property.propertyLabel);
                                        var $buttons = $("div.btn-group", $el).find("button");
                                        $buttons.each(function() {
                                            $( this ).prop("disabled", true);
                                       });
                                    }
                                }
                                
                            }
                        });
                    });
                    
        $("#bfeditor-debug").html(JSON.stringify(form.formobject.store, undefined, " "));
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
        var callingformobject = _.where(forms, {"id": formobjectID});
        callingformobject = callingformobject[0];
        var triple = {}
        triple.guid = guid();
        triple.s = editorconfig.baseURI + resourceID;
        callingformobject.resourceTemplates.forEach(function(t) {
            var properties = _.where(t.propertyTemplates, {"guid": propertyguid})
            if ( properties[0] !== undefined ) {
                triple.p = properties[0].propertyURI;
                triple.o = data[0].s;
                triple.otype = "uri";
                    
                // callingformobject.store.push(triple);
                data.push(triple);
                console.log(data);
                data.forEach(function(t) {
                    callingformobject.store.push(t);
                });
                    
                var formgroup = $("#" + propertyguid, callingformobject.form).closest(".form-group");
                var save = $(formgroup).find(".btn-toolbar")[0];
                //console.log(formgroup);
                
                console.log(properties[0].propertyURI);
                //console.log(data);
                tlabel = _.find(data, function(t){ if (t.p.match(/label|authorizedAccess/i)) return t.o; });
                displaydata = data[0].s;
                if ( tlabel !== undefined) {
                    displaydata = tlabel.o;
                }
                
                var bgvars = { 
                        "tguid": triple.guid, 
                        "tlabelhover": displaydata,
                        "tlabel": displaydata,
                        "fobjectid": formobjectID,
                        "inputid": propertyguid,
                        "triples": data
                    };
                var $buttongroup = editDeleteButtonGroup(bgvars);
                    
                /*
                var buttongroup = $('<div>', {id: triple.guid, class: "btn-group btn-group-xs"});
                if ( tlabel !== undefined) {
                    if (tlabel.o.length > 10) {
                        display = tlabel.o.substr(0,10) + "...";
                    } else {
                        display = tlabel.o;
                    }
                } else {
                    tlabel = data[0].s;
                    display = data[0].s.substr(0,10) + "...";
                }
                var displaybutton = $('<button type="button" class="btn btn-default" title="' + tlabel + '">' + display +'</button>');
                var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                $(delbutton).click(function(){
                    removeTriples(formobjectID, propertyguid, data);
                });
                buttongroup.append(displaybutton);
                buttongroup.append(delbutton);
                */
                    
                $(save).append($buttongroup);
                $("#" + propertyguid, callingformobject.form).val("");
                if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                    $("#" + propertyguid, callingformobject.form).attr("disabled", true);
                }
                    
            }
        });
        // Remove the form?
        //forms = _.without(forms, _.findWhere(forms, {"id": formobjectID}));
        $('#bfeditor-modalSave-' + modalformid).off('click');
        $('#bfeditor-modal-' + modalformid).modal('hide');
    
        $("#bfeditor-debug").html(JSON.stringify(callingformobject.store, undefined, " "));
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
        
        if (bgvars.tlabel.length > 10) {
            display = bgvars.tlabel.substr(0,10) + "...";
        } else {
            display = bgvars.tlabel;
        }
        var $displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
        $buttongroup.append($displaybutton);
        
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
                removeTriple(bgvars.formobjectid, bgvars.inputid, bgvars.triples[0]);
            } else {
                removeTriples(bgvars.formobjectid, bgvars.inputid, bgvars.triples);
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
            triple.s = editorconfig.baseURI + resourceID;
            formobject.resourceTemplates.forEach(function(t) {
                var properties = _.where(t.propertyTemplates, {"guid": inputID})
                if ( properties[0] !== undefined ) {
                    triple.p = properties[0].propertyURI;
                    triple.o = data;
                    triple.otype = "literal";
                    triple.olang = "en";
                    
                    formobject.store.push(triple);
                    
                    var formgroup = $("#" + inputID, formobject.form).closest(".form-group");
                    var save = $(formgroup).find(".btn-toolbar")[0];
                    
                    var bgvars = { 
                        "tguid": triple.guid, 
                        "tlabel": data,
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
        $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
    }
    
    function setResourceFromLabel(formobjectID, resourceID, inputID) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        //console.log(inputID);
        var data = $("#" + inputID, formobject.form).val();
        if (data !== undefined && data !== "") {
            var triple = {}
            triple.guid = guid();
            triple.s = editorconfig.baseURI + resourceID;
            formobject.resourceTemplates.forEach(function(t) {
                var properties = _.where(t.propertyTemplates, {"guid": inputID})
                if ( properties[0] !== undefined ) {
                    triple.p = properties[0].propertyURI;
                    triple.o = data;
                    triple.otype = "uri";
                    
                    formobject.store.push(triple);
                    
                    var formgroup = $("#" + inputID, formobject.form).closest(".form-group");
                    var save = $(formgroup).find(".btn-toolbar")[0];
                    
                    var buttongroup = $('<div>', {id: triple.guid, class: "btn-group btn-group-xs"});
                    if (data.length > 10) {
                        display = data.substr(0,10) + "...";
                    } else {
                        display = data;
                    }
                    /*
                    var displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
                    var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                    $(delbutton).click(function(){
                        removeTriple(formobjectID, inputID, triple);
                    });
                    */
                    var $displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
                    buttongroup.append($displaybutton);
                    
                    var $editbutton = $('<button type="button" class="btn btn-warning">e</button>');
                    $editbutton.click(function(){
                        editTriple(formobjectID, inputID, triple);
                    });
                    buttongroup.append($editbutton);
                    var $delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                    $delbutton.click(function(){
                        removeTriple(formobjectID, inputID, triple);
                    });
                    buttongroup.append($delbutton);
                    
                    //buttongroup.append(displaybutton);
                    //buttongroup.append(delbutton);
                    
                    $(save).append(buttongroup);
                    $("#" + inputID, formobject.form).val("");
                    if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                        $("#" + inputID, formobject.form).attr("disabled", true);
                    }
                    
                }
            });
        }
        $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
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
            var uvf = p.valueConstraint.useValuesFrom[0];
            console.log("uvf is " + uvf);
            console.log(lookups);
            var lups = _.where(lookups, {"scheme": uvf});
            var lu;
            if ( lups[0] !== undefined ) {
                console.log(lups[0].scheme);
                lu = lups[0].load;
                console.log(lu);
            }
            
            //$( input ).css("z-index", 3000);
            var uvfs = p.valueConstraint.useValuesFrom;
            var dshashes = [];
            uvfs.forEach(function(uvf){
                var lups = _.where(lookups, {"scheme": uvf});
                var lu;
                if ( lups[0] !== undefined ) {
                    var lu = lups[0];
                    console.log(lu.scheme);
                    console.log(lu);
                    
                    var dshash = {};
                    dshash.name = lu.name;
                    //dshash.matcher = function(item) {
                    //    return true;
                    //};
                    dshash.source = function(query, process) {
                        lu.load.source(formobject, query, process);
                    };
                    dshash.templates =  { header: '<h3>' + lu.name + '</h3>' };
                    dshash.displayKey = 'value';
                    dshashes.push(dshash);
                }
            });
            console.log(dshashes);
            var opts = {
                minLength: 3,
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
            
            $( input ).on("typeahead:selected", function(event, suggestionobject, datasetname) {
                console.log("typeahead selection made");
                var form = $("#" + event.target.id).closest("form").eq(0);
                var formid = $("#" + event.target.id).closest("form").eq(0).attr("id");
                formid = formid.replace('bfeditor-form-', '');
                var resourceid = $(form).children("div").eq(0).attr("id");
                var propertyguid = $("#" + event.target.id).attr("data-propertyguid");
                console.log("propertyguid is " + propertyguid);
                
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
                    console.log(lups[0].scheme);
                    lu = lups[0].load;
                    console.log(lu);
                }
                lu.getResource(s, p.propertyURI, suggestionobject, function(returntriples) {
                    console.log(returntriples);
                    var c = 1;
                    returntriples.forEach(function(t){
                        var tguid = guid();
                        t.guid = tguid;
                        formobject.store.push(t);
                        //console.log("iteration: " + c);
                        //console.log(formobject.store);
                        c++;
                        /*
                        Can't think of why I wouldn't always want the object,
                        at least presently, before lunch.
                        tlabel = "";
                        if (t.p.match(/label|authorizedAccess/i)) { 
                            tlabel = t.o;
                        }
                        */
                        var tlabel = t.o;
                        //console.log(tlabel);

                        formobject.resourceTemplates.forEach(function(rt) {
                            var properties = _.where(rt.propertyTemplates, {"propertyURI": t.p});
                            //console.log(properties);
                            if ( properties[0] !== undefined ) {
                                var property = properties[0];
                                var pguid = property.guid;
                        
                                var formgroup = $("#" + pguid, formobject.form).closest(".form-group");
                                var save = $(formgroup).find(".btn-toolbar")[0];
                    
                                var buttongroup = $('<div>', {id: t.guid, class: "btn-group btn-group-xs"});
                                if ( tlabel !== "" ) {
                                    if (tlabel.length > 10) {
                                        display = tlabel.substr(0,10) + "...";
                                    } else {
                                        display = tlabel;
                                    }
                                } else {
                                    display = t.s.substr(0,10) + "...";
                                }
                                //console.log(display);
                                //console.log(pguid);
                                /*
                                var displaybutton = $('<button type="button" class="btn btn-default" title="' + tlabel + '">' + display +'</button>');
                                var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                                $(delbutton).click(function(){
                                    removeTriples(formobject.id, pguid, returntriples);
                                });
                            
                                buttongroup.append(displaybutton);
                                buttongroup.append(delbutton);
                                */
                                var $displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
                                buttongroup.append($displaybutton);
                    
                                var $editbutton = $('<button type="button" class="btn btn-warning">e</button>');
                                $editbutton.click(function(){
                                    editTriples(formobject.id, pguid, returntriples);
                                });
                                buttongroup.append($editbutton);
                                var $delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                                $delbutton.click(function(){
                                    removeTriples(formobject.id, pguid, returntriples);
                                });
                                buttongroup.append($delbutton);
                            
                                $(save).append(buttongroup);
                    
                                $("#" + pguid, formobject.form).val("");
                                $("#" + pguid, formobject.form).typeahead('val', "");
                                $("#" + pguid, formobject.form).typeahead('close');
                    
                                    //console.log(triples);
                    
                                //if (property.repeatable !== undefined && property.repeatable == "false") {
                                //    $("#" + pguid, formobject.form).attr("disabled", true);
                                //}
                                if (property.valueConstraint !== undefined && property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                                    console.log("prop is not repeatable");
                                    var $el = $("#" + pguid, formobject.form)
                                    if ($el.is("input")) {
                                        $el.prop("disabled", true);
                                        $el.css( "background-color", "#EEEEEE" );
                                    } else {
                                        //console.log(property.propertyLabel);
                                        var $buttons = $("div.btn-group", $el).find("button");
                                        $buttons.each(function() {
                                            $( this ).prop("disabled", true);
                                       });
                                    }
                                }
                                
                            }
                        });
                    });
                    $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
                    console.log(formobject.store);
                });
            });
    }
    
    function editTriple(formobjectID, inputID, t) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        console.log("editing triple: " + t.guid);
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
        $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
    }
    
    function editTriples(formobjectID, inputID, triples) {
        triples.forEach(function(triple) {
            // console.log(triple);
            editTriple(formobjectID, inputID, triple);
        });
        
        // Edit a modal-described resource
        var resourceTypes = _.where(triples, {p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"});
        if (typeof resourceTypes !== undefined && resourceTypes[0].rtID !== undefined) {
            // function openModal(callingformobjectid, rtguid, propertyguid, template) {
            var callingformobject = _.where(forms, {"id": formobjectID});
            callingformobject = callingformobject[0];
            
            var templates = _.where(resourceTemplates, {"id": resourceTypes[0].rtID});
            if (templates[0] !== undefined) {
                // in theory, the first triple in a form's store should be the URI for the origin resource.
                console.log(triples);
                openModal(callingformobject.id, callingformobject.store[0].guid, inputID, templates[0], triples);
            }
        }
        
    }
    
    function removeTriple(formobjectID, inputID, t) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        console.log("removing triple: " + t.guid);
        console.log($("#" + t.guid).attr("class"));
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
        $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
    }
    
    function removeTriples(formobjectID, inputID, triples) {
        triples.forEach(function(triple) {
            // console.log(triple);
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

    
});