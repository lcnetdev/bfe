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
               url: "/verso/api/bfs",
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
            var url = "http://mlvlp04.loc.gov:3000/verso/api/bfs/" + id;

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
            "baseURI": "http://id.loc.gov/",
            "profiles": [
		        "static/profiles/bibframe/BIBFRAME 2.0 Agents.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Agents Contribution.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Form.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Language.json",
			"static/profiles/bibframe/BIBFRAME 2.0 LCC.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Notated Music.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Place.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Publication, Distribution, Manufacturer Activity.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Related Works and Expressions.json",
			"static/profiles/bibframe/BIBFRAME 2.0 Topic.json",
	                "static/profiles/bibframe/BIBFRAME 2.0 Serial.json",
        	        "static/profiles/bibframe/BIBFRAME 2.0 Monograph.json",
			"static/profiles/bibframe/BIBFRAME 2.0 RWO.json"			

            		],
            "startingPoints": [
                        {"menuGroup": "Notated Music",
                        "menuItems": [
                            {
                                label: "Instance",
                                type: ["http://id.loc.gov/ontologies/bibframe/Instance"],
                                useResourceTemplates: [ "profile:bf2:NotatedMusic:Instance" ]
                            },
                            {
                                label: "Work", 
                                type: ["http://id.loc.gov/ontologies/bibframe/Work"],
                                useResourceTemplates: [ "profile:bf2:NotatedMusic:Work" ]
                            }

                        ]},
                        {"menuGroup": "Serial",
                        "menuItems": [
                            {
                                label: "Instance",
                                type: ["http://id.loc.gov/ontologies/bibframe/Serial"],
                                useResourceTemplates: [ "profile:bf2:Serial:Instance" ]
                            },
                            {
                                label: "Work",
                                type: ["http://id.loc.gov/ontologies/bibframe/Text"],
                                useResourceTemplates: [ "profile:bf2:Serial:Work" ]
                            }

                        ]},
                        {"menuGroup": "Authorities",
                        "menuItems": [
                            {
                                label: "Person",
                                type: ["http://www.loc.gov/standards/mads/rdf/v1.html#PersonalName"],
                                useResourceTemplates: [ "profile:bf2:Agent:Person" ]
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
