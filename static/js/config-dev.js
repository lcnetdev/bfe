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

        function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }

        function getCSRF(){
           //eventually you'll have to login       
           var cookieValue = null;
           if (document.cookie && document.cookie != '') {
               var cookies = document.cookie.split(';');
               for (var i = 0; i < cookies.length; i++) {
                   var cookie = jQuery.trim(cookies[i]);
                   var name = "csrftoken";
                   if (cookie.substring(0, name.length + 1) == (name + '=')) {
                       cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                       break;
                   }
                }
            }       
            return cookieValue;            
        }

        function setCSRF(xhr, settings, csrf) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrf);
            }
        }

        function save(data, csrf, bfelog){
            var $messagediv = $('<div>', {id: "bfeditor-messagediv", class:"col-md-10 main"});

            $.ajax({
               url: "/api/",
               type: "POST",
               data:JSON.stringify(data),
               csrf: csrf,
               dataType: "json",
               contentType: "application/json; charset=utf-8"
            }).done(function (data) {
                document.body.scrollTop = document.documentElement.scrollTop = 0;
                bfelog.addMsg(new Error(), "INFO", "Saved " + data.id);
                var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
                $messagediv.append('<div class="alert alert-success"><strong>Record Created:</strong><a href='+data.url+'>'+data.name+'</a></div>');
                $('#bfeditor-formdiv').empty();
                $('#save-btn').remove();
                $messagediv.insertBefore('#bfeditor-previewPanel');
                $('#bfeditor-previewPanel').remove();
                bfeditor.bfestore.store = [];
            }).fail(function (XMLHttpRequest, textStatus, errorThrown){
                bfelog.addMsg(new Error(), "ERROR", "FAILED to save");
                bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                $messagediv.append('<div class="alert alert-danger"><strong>Save Failed:</strong>'+errorThrown+'</span>');
                $messagediv.insertBefore('#bfeditor-previewPanel');
            }).always(function(){                       
                $('#table_id').DataTable().ajax.reload();
            });
        }

        function retrieve(url, bfestore, bfelog, callback){
            $.ajax({
                url: url,
                dataType: "json",
                success: function (data) {
                    bfelog.addMsg(new Error(), "INFO", "Fetched external source baseURI" + url);
                    bfelog.addMsg(new Error(), "DEBUG", "Source data", data);
                    bfestore.store = [];
                    tempstore = bfestore.jsonld2store(data);
                    callback();
                    },
                error: function(XMLHttpRequest, textStatus, errorThrown) { 
                    bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + url);
                    bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
                }
            });
        }

        function deleteId(id, csrf, bfelog){
            var url = "http://mlvlp04.loctest.gov:3000/api/" + id;

            //$.ajaxSetup({
            //    beforeSend: function(xhr, settings){getCSRF(xhr, settings, csrf);}
            //});

            $.ajax({
                type: "DELETE",                
                url: url,
                dataType: "json",
                csrf: csrf,
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
		"static/profiles/bibframe/BIBFRAME 2.0 Agents.json",
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
                "static/profiles/bibframe/WEI-Audio\ CD.json"
            ],
            "startingPoints": [
                        {"menuGroup": "Agents",
                        "menuItems": [
			   {
				label: "Person",
                                type: ["http://id.loc.gov/ontologies/bibframe/Person"],
                                useResourceTemplates: [ "profile:bf2:Agent:Person" ]
                            }
			
                        ]},
                        {"menuGroup": "Monograph",
                        "menuItems": [
                            {
                                label: "Instance",
                                type: ["http://bibframe.org/vocab/Monograph"],
                                useResourceTemplates: [ "profile:bf:Instance:Monograph" ]
                            },
                            {
                                label: "Work", 
                                type: ["http://bibframe.org/vocab/Text","http://bibframe.org/vocab/Work"],
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph" ]
                            },
                            {
                                label: "Work, Instance",
                                type: ["http://bibframe.org/vocab/Text","http://bibframe.org/vocab/Work","http://bibframe.org/vocab/Monograph"],
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph", "profile:bf:Instance:Monograph", "profile:bf:Annotation:AdminMeta" ]
                            }

                        ]},
                        {"menuGroup": "Notated Music",
                        "menuItems": [
                            {
                                label: "Instance",
                                type: ["http://bibframe.org/vocab/Instance"],
                                useResourceTemplates: [ "profile:bf:Instance:NotatedMusic" ]
                            },
                            {
                                label: "Work",
                                type: ["http://bibframe.org/vocab/NotatedMusic","http://bibframe.org/vocab/Work"],
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic" ]
                            },
                            {
                                label: "Work, Instance",
                                type: ["http://bibframe.org/vocab/NotatedMusic","http://bibframe.org/vocab/Work","http://bibframe.org/vocab/Instance"],
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic", "profile:bf:Instance:NotatedMusic", "profile:bf:Annotation:AdminMeta" ]
                            }


                        ]},
                        {"menuGroup": "Serial",
                        "menuItems": [
                            {
                                label: "Instance",
                                type: ["http://bibframe.org/vocab/Serial"],
                                useResourceTemplates: [ "profile:bf:Instance:Serial" ]
                            },
                            {
                                label: "Work",
                                type: ["http://bibframe.org/vocab/Text","http://bibframe.org/vocab/Work"],
                                useResourceTemplates: [ "profile:bf:Work:Serial", "profile:bf:RDAExpression:Serial" ]
                            },
                            {
                                label: "Work, Instance w/AdminMetadata",
                                type: ["http://bibframe.org/vocab/Text","http://bibframe.org/vocab/Work","http://bibframe.org/vocab/Serial"],
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic", "profile:bf:Instance:NotatedMusic", "profile:bf:Annotation:AdminMeta" ]
                            }

                        ]},
                        {"menuGroup": "Cartographic",
                        "menuItems": [
                            {
                                label: "Instance",
                                type: ["http://bibframe.org/vocab/Monograph"],
                                useResourceTemplates: [ "profile:bf:Instance:Cartography" ]
                            },
                            {
                                label: "Work",
                                type: ["http://bibframe.org/vocab/Cartography","http://bibframe.org/vocab/Work"],
                                useResourceTemplates: [ "profile:bf:Work:Cartography", "profile:bf:RDAExpression:Cartography" ]
                            },
                            {
                                label: "Work, Instance w/AdminMetadata",
                                type: ["http://bibframe.org/vocab/Cartography","http://bibframe.org/vocab/Work","http://bibframe.org/vocab/Monograph"],
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic", "profile:bf:Instance:NotatedMusic", "profile:bf:Annotation:AdminMeta" ]
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
                        ]}
            ],
            "save": {
                "callback": save
            },
            "retrieve": {
                "callback": retrieve
            },
            "deleteId": {
                "callback": deleteId
            },            
            "getCSRF":{
                "callback": getCSRF
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
