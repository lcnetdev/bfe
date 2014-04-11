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
    
    var editorconfig = {};
    var store = [];
    var profiles = [];
    var resourceTemplates = [];
    var startingPoints = [];
    var formTemplates = [];
    var lookups = [];
    var currentModal = 0;
    
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
        var menuul = $('<ul>', {id: "bfeditor-menuul", class: "nav nav-sidebar"});
        for (var i=0; i < config.startingPoints.length; i++) {
            var li = $('<li>');
            var a = $('<a>', {href: "#", id: "sp-" + i});
            a.html(config.startingPoints[i].label);
            $(a).click(function(){
                menuSelect(this.id);
            });
            li = li.append(a);
            menuul.append(li);
            startingPoints[i] = config.startingPoints[i];
        }
        menudiv.append(menuul);
        
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
    
    function menuSelect (spid) {
        store = [];
        spnum = parseInt(spid.replace('sp-', ''));
        spoints = editorconfig.startingPoints[spnum];
        form = getForm(spoints.useResourceTemplates);
        $("#bfeditor-formdiv").html("");
        $("#bfeditor-formdiv").append(form.form);
        $("#bfeditor-debug").html(JSON.stringify(form.formobject.store, undefined, " "));
    }
    
    function getForm (loadResourceTemplatesWithIds) {
        
        var rt;
        var property;
        
        var fguid = guid();
        var fobject = {};
        fobject.id = fguid;
        fobject.store = [];
        fobject.resourceTemplates = [];
        fobject.resourceTemplateIDs = [];
        fobject.formTemplates = [];
        
        for (var urt=0; urt < loadResourceTemplatesWithIds.length; urt++) {
            var urtid = loadResourceTemplatesWithIds[urt];
            var rt = _.where(resourceTemplates, {"id": urtid})
            if ( rt !== undefined ) {
                fobject.resourceTemplates[urt] = JSON.parse(JSON.stringify(rt[0]));
                fobject.resourceTemplateIDs[urt] = rt[0].id;
            }
        }
        
        fobject.resourceTemplates.forEach(function(rt) {
            var id = guid();
            var uri = editorconfig.baseURI + id;
            var triple = {}
            triple.guid = id;
            triple.rtID = rt.id;
            triple.s = uri;
            triple.p = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
            triple.o = rt.resourceURI;
            triple.otype = "uri";
            fobject.store.push(triple);
            rt.guid = id;
            
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
        /*
        for ( var rtnum=0; rtnum < fobject.resourceTemplates.length; rtnum++ ) {
            var rt = fobject.resourceTemplates[rtnum];
            var id = guid();
            var uri = editorconfig.baseURI + id;
            var triple = {}
            triple.guid = id;
            triple.rtID = rt.id;
            triple.s = uri;
            triple.p = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
            triple.o = rt.resourceURI;
            triple.otype = "uri";
            fobject.store.push(triple);
            fobject.resourceTemplates[rtnum].guid = id;
            
            for ( var pnum=0; pnum < rt.propertyTemplates.length; pnum++ ) {
                var property = rt.propertyTemplates[pnum];
                var pguid = guid();
                fobject.resourceTemplates[rtnum].propertyTemplates[pnum].guid = pguid;
                fobject.resourceTemplates[rtnum].propertyTemplates[pnum].display = "true";
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
                                fobject.resourceTemplates[rtnum].propertyTemplates[pnum].display = "false";
                            }
                        }
                    }
                }
            };
        }
        */
        /*
        if (forms[0] === undefined) {
            console.log("after assignging property guids - 1st time");
            console.log("guid of has oether edition: " + fobject.resourceTemplates[0].propertyTemplates[13].guid);
        } else {
            console.log("after assignging property guids");
            console.log("guid of has oether edition: " + forms[0].resourceTemplates[0].propertyTemplates[13].guid);
        }
        console.log("form id: " + fobject.id);
        console.log(fobject);
        */
        //fobject.formTemplates = rts;
        
        // Let's create the form
        var form = $('<form>', {id: "bfeditor-form-" + fobject.id, class: "form-horizontal", role: "form"});
        fobject.resourceTemplates.forEach(function(rt) {
            var resourcediv = $('<div>', {id: rt.guid});
            rt.propertyTemplates.forEach(function(property) {
                
                var formgroup = $('<div>', {class: "form-group"});
                var label = $('<label for="' + fobject.id + property.guid + '" class="col-sm-3 control-label">' + property.propertyLabel + '</label>');
                var saves = $('<div class="form-group"><div class="col-sm-3"></div><div class="col-sm-8"><div class="btn-toolbar" role="toolbar"></div></div></div>');
                
                if (property.type == "literal") {
                    
                    var input = $('<div class="col-sm-8"><input type="email" class="form-control" id="' + fobject.id + property.guid + '" placeholder="' + property.propertyLabel + '"></div>');
                    
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
                            buttondiv = $('<div class="col-sm-8" id="' + fobject.id + property.guid +'"></div>');
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
                                        openModal(event.data.fobjectid, event.data.rtguid, event.data.propertyguid, event.data.template);
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
                            var input = $('<input type="text" class="typeahead form-control" data-propertyguid="' + property.guid + '" id="' + fobject.id + property.guid + '" placeholder="' + property.propertyLabel + '">');
                    
                            /*
                            input.css("z-index", 3000);
                            input.typeahead(
                                {
                                    minLength: 3,
                                    highlight: true,
                                    displayKey: 'value',
                                },
                                {
                                    matcher: function(item) {
                                        return true;
                                    },
                                    source: lcnames.source
                                }
                            );
                            */
                            /*
                            input.typeahead(
                                {
                                    minLength: 3,
                                    highlight: true,
                                    displayKey: 'value',
                                },
                                {
                                    matcher: function(item) {
                                        return true;
                                    },
                                    source: function(query, process){
                                        var p = process;
                                        // if in cache use cached value, if don't wanto use cache remove this if statement
                                        //parentid = $this.parent().attr("id");
                                        ///
                                        q = "lcnames-" + query;
                                        if(lookupcache[q]){
                                            p(lookupcache[q]);
                                            return;
                                        }
                                        if( typeof searching != "undefined") {
                                            clearTimeout(searching);
                                            p([]);
                                        }
                                        ///
                                        searching = setTimeout(function() {
                                            if ( query.length > 2 ) {
                                                lcnames.source(query, p);
                                            } else {
                                                return [];
                                            }
                                        }, 300); // 300 ms
                                    }
                                }
                            );
                            */
                            inputdiv.append(input);
                            
                            formgroup.append(label);
                            formgroup.append(inputdiv);
                            //formgroup.append(button);
                            formgroup.append(saves);
                        
                        } else {
                            // Type is resource, so should be a URI, but there is
                            // no template reference for it.  
                            // So, create label field
                            var input = $('<div class="col-sm-8"><input class="form-control" id="' + fobject.id + property.guid + '" placeholder="' + property.propertyLabel + '"></div>');
                    
                            button = $('<button type="button" class="btn btn-default">Set</button>');
                                $(button).click(function(){
                                    setResourceFromLabel(rt.guid, property.guid);
                            });
                            
                            formgroup.append(label);
                            formgroup.append(input);
                            formgroup.append(button);
                            formgroup.append(saves);
                    
                        }
                    }
                }
                
                resourcediv.append(formgroup);
            });
            form.append(resourcediv);
        });
        
        fobject.resourceTemplates.forEach(function(rt) {
            rt.propertyTemplates.forEach(function(property) {
                if (_.has(property, "valueConstraint")) {
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
                        var formgroup = $("#" + fobject.id + property.guid, form).closest(".form-group");
                        var save = $(formgroup).find(".btn-toolbar").eq(0);
                        //console.log(formgroup);
                    
                        var buttongroup = $('<div>', {id: triple.guid, class: "btn-group btn-group-xs"});
                        //console.log("tguid for div id " + triple.guid);
                        var display = "";
                        if (_.has(property.valueConstraint, "defaultLiteral")) {
                            display = property.valueConstraint.defaultLiteral;
                        }
                        if (display.length > 10) {
                            display = display.substr(0,10) + "...";
                        } else if (display === "") {
                            display = data.substr(0,10) + "...";
                        }
                        var displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
                        buttongroup.append(displaybutton);
                        
                        if (property.valueConstraint.editable === undefined || property.valueConstraint.editable == "true") {
                            //console.log(property.valueConstraint.editable);
                            var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                            $(delbutton).click(function(){
                                removeTriple(fobject.id, property.guid, triple);
                            });
                            buttongroup.append(delbutton);
                        }
                        
                        save.append(buttongroup);
                        if (property.valueConstraint.repeatable !== undefined && property.valueConstraint.repeatable == "false") {
                            var el = $("#" + fobject.id + property.guid, form);
                            if (el.is("input")) {
                                $(el).prop("disabled", true);
                            } else {
                                //console.log(property.propertyLabel);
                                var buttons = $("div.btn-group", el).find("button");
                                buttons.each(function() {
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
    
    function openModal(callingformobjectid, rtguid, propertyguid, template) {
        
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
        currentModal++;
        var form = getForm([template.id]);
        
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
        
        /*
        //alert(JSON.stringify(form.formobject.store, undefined, " "));
        var callingformobject2 = _.where(forms, {"id": callingformobjectid});
        callingformobject2 = callingformobject2[0];
        console.log("Just before serResourceFromModal");
        console.log("formobjectID is: " + callingformobjectid);
        console.log("propertyguid is: " + propertyguid);
        console.log(callingformobject2);
        */
            setResourceFromModal(callingformobjectid, form.formobject.id, rtguid, propertyguid, form.formobject.store);
        });
        $('#bfeditor-modal-' + form.formobject.id).on("hide.bs.modal", function(e) {
            $(this).empty();
        });
        
        $( ".typeahead", form.form ).each(function() {
            var form = $(this).closest("form").eq(0);
            var formid = $(this).closest("form").eq(0).attr("id");
            formid = formid.replace('bfeditor-form-', '');
            var formobject = _.where(forms, {"id": formid});
            formobject = formobject[0];
            //console.log(formid);
            
            var pguid = $(this).attr("data-propertyguid");
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
            
            $( this ).css("z-index", 3000);
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
                $( this ).typeahead(
                    opts,
                    dshashes[0]
                );
            } else if ( dshashes.length === 2) {
                $( this ).typeahead(
                    opts,
                    dshashes[0],
                    dshashes[1]
                );
            } else if ( dshashes.length === 3) {
                $( this ).typeahead(
                    opts,
                    dshashes[0],
                    dshashes[1],
                    dshashes[2]
                );
            } else if ( dshashes.length === 4) {
                $( this ).typeahead(
                    opts,
                    dshashes[0],
                    dshashes[1],
                    dshashes[2],
                    dshashes[3]
                );
            } else if ( dshashes.length === 5) {
                $( this ).typeahead(
                    opts,
                    dshashes[0],
                    dshashes[1],
                    dshashes[2],
                    dshashes[3],
                    dshashes[4]
                );
            } else if ( dshashes.length === 6) {
                $( this ).typeahead(
                    opts,
                    dshashes[0],
                    dshashes[1],
                    dshashes[2],
                    dshashes[3],
                    dshashes[4],
                    dshashes[5]
                );
            }
            
            $( this ).on("typeahead:selected", function(event, suggestionobject, datasetname) {
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
                
                /*
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
                */
                
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
                        console.log("iteration: " + c);
                        console.log(formobject.store);
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
                        
                                var formgroup = $("#" + formobject.id + pguid).closest(".form-group");
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
                                var displaybutton = $('<button type="button" class="btn btn-default" title="' + tlabel + '">' + display +'</button>');
                                var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                                $(delbutton).click(function(){
                                    removeTriple(formobject.id, pguid, [triples[0], triples]);
                                });
                            
                                buttongroup.append(displaybutton);
                                buttongroup.append(delbutton);
                            
                                $(save).append(buttongroup);
                    
                                $("#" + formobject.id + pguid).val("");
                                $("#" + formobject.id + pguid).typeahead('val', "");
                                $("#" + formobject.id + pguid).typeahead('close');
                    
                                    //console.log(triples);
                    
                                if (property.repeatable !== undefined && property.repeatable == "false") {
                                    $("#" + formobject.id + pguid).attr("disabled", true);
                                }     
                                
                            }
                        });
                    
                    });
                    //console.log(JSON.stringify(formobject.store));
                });
            });
        });
        /*
        $(".typeahead").css("z-index", 3000);
                                    $(".typeahead").typeahead(
                                {
                                    minLength: 3,
                                    highlight: true,
                                    displayKey: 'value',
                                },
                                {
                                    matcher: function(item) {
                                        return true;
                                    },
                                    source: lcnames.source

                                }
                            );
        */
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
                    
                callingformobject.store.push(triple);
                data.forEach(function(t) {
                    callingformobject.store.push(t);
                });
                    
                var formgroup = $("#" + formobjectID + propertyguid).closest(".form-group");
                var save = $(formgroup).find(".btn-toolbar")[0];
                //console.log(formgroup);
                
                console.log(properties[0].propertyURI);
                //console.log(data);
                tlabel = _.find(data, function(t){ if (t.p.match(/label|authorizedAccess/i)) return t.o; });
                    
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
                    removeTriples(formobjectID, propertyguid, [triple, data]);
                });
                    
                buttongroup.append(displaybutton);
                buttongroup.append(delbutton);
                    
                $(save).append(buttongroup);
                $("#" + formobjectID + propertyguid).val("");
                if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                    $("#" + formobjectID + propertyguid).attr("disabled", true);
                }
                    
            }
        });
        // Remove the form?
        //forms = _.without(forms, _.findWhere(forms, {"id": formobjectID}));
        $('#bfeditor-modalSave-' + modalformid).off('click');
        $('#bfeditor-modal-' + modalformid).modal('hide');
    
        $("#bfeditor-debug").html(JSON.stringify(callingformobject.store, undefined, " "));
    }
    
    function setLiteral(formobjectID, resourceID, inputID) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        //console.log(inputID);
        var data = $("#" + formobjectID + inputID).val();
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
                    
                    var formgroup = $("#" + formobjectID + inputID).closest(".form-group");
                    var save = $(formgroup).find(".btn-toolbar")[0];
                    
                    var buttongroup = $('<div>', {id: triple.guid, class: "btn-group btn-group-xs"});
                    if (data.length > 10) {
                        display = data.substr(0,10) + "...";
                    } else {
                        display = data;
                    }
                    var displaybutton = $('<button type="button" class="btn btn-default">' + display +'</button>');
                    var delbutton = $('<button type="button" class="btn btn-danger">x</button>');
                    $(delbutton).click(function(){
                        removeTriple(formobjectID, inputID, triple);
                    });
                    
                    buttongroup.append(displaybutton);
                    buttongroup.append(delbutton);
                    
                    $(save).append(buttongroup);
                    $("#" + formobjectID + inputID).val("");
                    if (properties[0].repeatable !== undefined && properties[0].repeatable == "false") {
                        $("#" + formobjectID + inputID).attr("disabled", true);
                    }
                    
                }
            });
        }
        $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
    }
    
    function removeTriple(formobjectID, inputID, t) {
        var formobject = _.where(forms, {"id": formobjectID});
        formobject = formobject[0];
        console.log("removing triple: " + t.guid);
        console.log($("#" + t.guid).attr("class"));
        $("#" + t.guid).empty();

        var el = $("#" + formobjectID + inputID);
        if (el.is("input")) {
            //$(el).attr("disabled", false);
            //$("#" + formobjectID + inputID).prop( "disabled", false );
            var inputs = $("#" + formobjectID + inputID).parent().find("input[data-propertyguid='" + inputID +"']");
            console.log(inputs);
            // is this a hack because something is broken?
            inputs.each(function() {
                $( this ).prop( "disabled", false );
                $( this ).removeAttr("disabled");
                $( this ).css( "background-color", "transparent" );
            });
            //el.removeAttr("disabled");
            //var inputclasses = $(el).attr("class");
            //console.log(inputclasses);
            //$(el).removeClass(inputclasses);
            //$(el).addClass(inputclasses);
        } else {
            //console.log(property.propertyLabel);
            var buttons = $("div.btn-group", el).find("button");
            buttons.each(function() {
                $( this ).prop( "disabled", false );
            });
        }
        //$("#" + inputID).attr("disabled", false);
        formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {guid: t.guid}));
        $("#bfeditor-debug").html(JSON.stringify(formobject.store, undefined, " "));
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