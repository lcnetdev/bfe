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
        var config = {
            "logging": {
                "level": "DEBUG",
                "toConsole": true
            },
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
                "static/profiles/bibframe/WEI-Audio\ CD.json"
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
                        ]}

            ],
            "return": {
                "format": "jsonld-expanded",
                "callback": myCB
            }
        }
        var bfeditor = bfe.fulleditor(config, "bfeditor");
