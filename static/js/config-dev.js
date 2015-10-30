        var ie = (function(){
            var undef,
            v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');
            while (
                div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
                all[0]
            );
            return v > 4 ? v : undef;
        }());
        if (ie < 10) {
            $("#iealert").addClass("alert alert-danger");
            $("#iealert").html("Sorry, but the BIBFRAME Editor will not work in IE8 or IE9.")
        }
        function myCB(data) {
            document.body.scrollTop = document.documentElement.scrollTop = 0;
        }

        function save(data, csrf){

            $.post("/tools/bibframe/save",
               {     
                     json: JSON.stringify(data),
                     csrfmiddlewaretoken: csrf
               },
               function (data) {
                /*$.ajaxSetup({
                   beforeSend: function(xhr, settings) {
                         if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                             xhr.setRequestHeader("X-CSRFToken", csrf);
                         }                                
                     }                    
                });*/

                 $.ajax({
                  type:"POST",
                  url: "/api/",
                  data: data
                 }).done(function (data) {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    console.log("success");
                 }).fail(function (data){
                    console.log(data.responseText);
                 }).always(function(){                       
                    $("#bfeditor > .row").remove();
                    $("#bfeditor > .footer").remove();
                    bfeditor = bfe.fulleditor(config, "bfeditor");
                    var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
                    $messagediv.append('<span class="str"><h3>Record Created</h3><a href='+data.url+'>'+data.name+'</a></span>');
                    $('#bfeditor-formdiv').append($messagediv);
                 });
            });
        }

        function retrieve(url, bfestore, bfelog, callback){
            $.ajax({
                url: url,
                dataType: "json",
                success: function (data) {
                    bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + url);
                    bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
                    tempstore = bfestore.jsonld2store(data);
                    callback();
                    },
                error: function(XMLHttpRequest, textStatus, errorThrown) { 
                    bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + l.source.location);
                    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                }
            });
        }

        function deleteId(id, bfelog){
            var url = "http://bibframe.org:8283/api/" + id;
            $.ajax({
                type: "DELETE",                
                url: url,
                dataType: "json",
                success: function (data) {
                    bfelog.addMsg(new Error(), "INFO", "Deleted " + id);
                    },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    bfelog.addMsg(new Error(), "ERROR", "FAILED to delete: " + url);
                    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                }
            });

        }

        var config = {
/*            "logging": {
                "level": "DEBUG",
                "toConsole": true
            },*/
            "baseURI": "http://bibframe.org/",
            "profiles": [
                "static/profiles/bibframe/BIBFRAME Agents.json",
                "static/profiles/bibframe/BIBFRAME Annotations.json",
                "static/profiles/bibframe/BIBFRAME Authorities.json",
                "static/profiles/bibframe/BIBFRAME AgentsMono.json",
                "static/profiles/bibframe/BIBFRAME Entities.json",
                "static/profiles/bibframe/WEI-monograph.json",
                "static/profiles/bibframe/WEI-notated-music.json",
                "static/profiles/bibframe/WEI-serial.json",
                "static/profiles/bibframe/WEI-cartographic.json",
                "static/profiles/bibframe/WEI-BluRayDVD.json",
                "static/profiles/bibframe/WEI-Audio\ CD.json",
                "static/profiles/bibframe/dc-simple.json",
                "static/profiles/bibframe/lcsh-lcnaf.json"
            ],
            "startingPoints": [
                        {"menuGroup": "Monograph",
                        "menuItems": [
                            {
                                label: "Instance", 
                                useResourceTemplates: [ "profile:bf:Instance:Monograph" ]
                            },
                            {
                                label: "Work", 
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph" ]
                            },
                            {
                                label: "Work, Instance", 
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph", "profile:bf:Instance:Monograph" ]
                            },
                            {
                                label: "Work, Instance w/AdminMetadata",
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph", "profile:bf:Instance:Monograph", "profile:bf:Annotation:AdminMeta" ]
                            }

                        ]},
                        {"menuGroup": "Notated Music",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:NotatedMusic" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic", "profile:bf:Instance:NotatedMusic" ]
                            }
                        ]},
                        {"menuGroup": "Serial",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:Serial" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:Serial", "profile:bf:RDAExpression:Serial" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:Serial", "profile:bf:RDAExpression:Serial", "profile:bf:Instance:Serial" ]
                            }
                        ]},
                        {"menuGroup": "Cartographic",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:Cartography" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:Cartography", "profile:bf:RDAExpression:Cartography" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:Cartography", "profile:bf:RDAExpression:Cartography", "profile:bf:Instance:Cartography" ]
                            }
                        ]},
                        {"menuGroup": "BluRay DVD",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:BluRayDVD" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:BluRayDVD", "profile:bf:RDAExpression:BluRayDVD" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:BluRayDVD", "profile:bf:RDAExpression:BluRayDVD", "profile:bf:Instance:BluRayDVD" ]
                            }
                        ]},
                        {"menuGroup": "Audio CD",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:AudioCD" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:AudioCD", "profile:bf:RDAExpression:AudioCD" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:AudioCD", "profile:bf:RDAExpression:AudioCD", "profile:bf:Instance:AudioCD" ]
                            }
                        ]},
                        {"menuGroup": "Dublin Core",
                        "menuItems": [
                            {
                                label: "Simple, all literals", 
                                useResourceTemplates: [ "profile:dc:simple1" ]
                            },
                            {
                                label: "Simple, uses lookups", 
                                useResourceTemplates: [ "profile:dc:simple2" ]
                            }
                        ]},
                        {
                        "menuGroup": "SKOS",
                        "menuItems": [
                            {
                                label: "SKOS Concept Profile, for LCSH", 
                                useResourceTemplates: [ "profile:skos:concept:lcsh:base" ]
                            }
                        ]}

            ],
            "save": {
                //"callback": save
            },
            "retrieve": {
                "callback": retrieve
            },
            "deleteId": {
                "callback": deleteId
            },
/*            "load": [
                {
                    "templateID": ["profile:bf:Work:Monograph", "profile:bf:Instance:Monograph", "profile:bf:Annotation:AdminMeta"],
                    "defaulturi": "http://id.loc.gov/resources/bibs/5226",
                    "_remark": "Source must be JSONLD expanded, so only jsonp and json are possible requestTypes",
                    "source": {
                        "location": "http://id.loc.gov/resources/bibs/5226.bibframe_raw.jsonp",
                        "requestType": "jsonp",
                        "data": "UNUSED, BUT REMEMBER IT"
                    }
                }
            ],*/
            "return": {
                "format": "jsonld-expanded",
                "callback": myCB
            }
        }
        var bfeditor = bfe.fulleditor(config, "bfeditor");
