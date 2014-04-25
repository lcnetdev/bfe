var request = require('request');
var lodash = require("lodash");
var fs = require('fs');

var modifications = {
        "http://bibframe.org/vocab/Topic": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/subjects", "http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Place": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/subjects", "http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/GenreForm": {
            "_remark": "not currently used",
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/genreForms", "http://id.loc.gov/authorities/subjects"]
				}
            }
        },
        "http://bibframe.org/vocab/Temporal": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/subjects"]
				}
            }
        },
        "http://bibframe.org/vocab/Agent": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Person": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Family": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Jurisdiction": {
            "http://bibframe.org/vocab/Jurisdiction": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Meeting": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Organization": {
            "http://bibframe.org/vocab/hasAuthority": {
                "propertyLabel": "Lookup",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": ["http://id.loc.gov/authorities/names"]
				}
            }
        },
        "http://bibframe.org/vocab/Work": {
            "http://bibframe.org/vocab/sameWork": {
                "propertyURI": "http://bibframe.org/vocab/sameWork",
                "propertyLabel": "Lookup",
                "type": "resource",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": [
                        "http://id.loc.gov/resources/works"
                    ]
                },
            },
            "http://bibframe.org/vocab/agent": {
                "valueConstraint": {
                    "valueTemplateRefs": [
                        "profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction"
                    ]
				}
            },
            "http://bibframe.org/vocab/creator": {
                "valueConstraint": {
                    "valueTemplateRefs": [
                        "profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction"
                    ]
				}
            },
            "http://bibframe.org/vocab/contributor": {
                "valueConstraint": {
                    "valueTemplateRefs": [
                        "profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction" 
                    ]
				}
            }
        },
        "http://bibframe.org/vocab/Instance": {
            "http://bibframe.org/vocab/sameInstance": {
                "propertyURI": "http://bibframe.org/vocab/sameWork",
                "propertyLabel": "Lookup",
                "type": "resource",
                "valueConstraint": {
                    "repeatable": "false",
                    "useValuesFrom": [
                        "http://id.loc.gov/resources/works"
                    ]
                },
            },
            "http://bibframe.org/vocab/agent": {
                "valueConstraint": {
                    "valueTemplateRefs": [
                        "profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction"
                    ]
				}
            },
            "http://bibframe.org/vocab/creator": {
                "valueConstraint": {
                    "valueTemplateRefs": [
                        "profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction"
                    ]
				}
            },
            "http://bibframe.org/vocab/contributor": {
                "valueConstraint": {
                    "valueTemplateRefs": [
                        "profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction" 
                    ]
				}
            }
        }
    }

var profiles = [
    {
        "Profile": {
            "id": "profile:bf:WIA",
            "title": "Generic BIBFRAME Work, Instance, and HeldItem",
            "resourceTemplates": [
                {
                    "resourceURI": "http://bibframe.org/vocab/Work"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Instance"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/HeldItem"
                }
			]
        }
    },
    {
        "Profile": {
            "id": "profile:bf:Agents",
            "title": "BIBFRAME Agents",
            "resourceTemplates": [
                {
                    "resourceURI": "http://bibframe.org/vocab/Agent"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Person"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Family"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Jurisdiction"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Meeting"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Organization"
                }
			]
        }
    },
    {
        "Profile": {
            "id": "profile:bf:Authorities",
            "title": "BIBFRAME Agents",
            "resourceTemplates": [
                {
                    "resourceURI": "http://bibframe.org/vocab/Topic"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Place"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Temporal"
                }
			]
        }
    },
    {
        "Profile": {
            "id": "profile:bf:Annotations",
            "title": "BIBFRAME Agents",
            "_remark": "HeldItem included in Profile profile:bf:WIA.",
            "resourceTemplates": [
                {
                    "resourceURI": "http://bibframe.org/vocab/Annotation"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/CoverArt"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/HeldMaterial"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Review"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Summary"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/TableOfContents"
                }
			]
        }
    },
    {
        "Profile": {
            "id": "profile:bf:Entities",
            "title": "Various BIBFRAME Entities",
            "resourceTemplates": [
                {
                    "resourceURI": "http://bibframe.org/vocab/Arrangement"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Category"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Cartography"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Classification"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/DescriptionAdminInfo"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Event"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Identifier"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/IntendedAudience"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Language"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Provider"
                },
                {
                    "resourceURI": "http://bibframe.org/vocab/Title"
                }
			]
        }
    }
];

fs.readFile('bf-ordered.json', function(err, data) {
    var bfordered = JSON.parse(data);
    request.get("http://bibframe.org/vocab.json", function(error, response, body) {
        //console.log("Got response: " + response.statusCode);
        var resources = JSON.parse(response.body);
        processResourceInfo(resources, bfordered);
    });    
});

function processResourceInfo(resources, bfordered) {
    profiles.forEach(function(profile){
        var profileRTs = profile.Profile.resourceTemplates;
        profileRTs.forEach(function(rt){
            var bfclass = lodash.where(resources, {"@id": rt.resourceURI});
            if (rt.id === undefined) { 
                rt.id = rt.resourceURI.replace("http://bibframe.org/vocab/", "profile:bf:");
            }
            if (rt.resourceLabel === undefined) { 
                rt.resourceLabel = bfclass[0]["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
            }
            if (rt.propertyTemplates === undefined) {
                rt.propertyTemplates = [];
            }
            var chosenProps = bfordered[rt.resourceURI];
            chosenProps.forEach(function(cp){
                var pt = {};
                var p = lodash.where(resources, {"@id": cp});
                if (
                        p[0] === undefined && 
                        modifications[rt.resourceURI] !== undefined && 
                        modifications[rt.resourceURI][cp] !== undefined
                    ) {
                    // This property URI was not found in the vocabulary *but* it is accounted 
                    // for in the modifications.  So, use it.
                    pt = modifications[rt.resourceURI][cp];
                    rt.propertyTemplates.push(pt);
                } else {
                    p = p[0];
                    if (modifications[rt.resourceURI] !== undefined && modifications[rt.resourceURI][cp] !== undefined) {
                        pt = modifications[rt.resourceURI][cp];
                    }
                    if (pt.propertyURI === undefined) {
                        pt.propertyURI = p["@id"];
                    }
                    if (pt.propertyLabel === undefined) {
                        pt.propertyLabel = p["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
                    }   
                    pt.type = "literal";
                    if ( p["http://www.w3.org/2000/01/rdf-schema#range"] !== undefined && p["http://www.w3.org/2000/01/rdf-schema#range"][0]["@id"] != "http://www.w3.org/2000/01/rdf-schema#Literal" ) {
                            // Assume this is a resource for now
                        // Will likely be a problem in the future
                        pt.type = "resource";
                        if (
                                modifications[rt.resourceURI] !== undefined && 
                                modifications[rt.resourceURI][pt.propertyURI] !== undefined &&
                                modifications[rt.resourceURI][pt.propertyURI].valueConstraint !== undefined
                            ) {
                            pt.valueConstraint = modifications[rt.resourceURI][pt.propertyURI].valueConstraint; 
                        } else if (p["http://www.w3.org/2000/01/rdf-schema#range"][0]["@id"] == "http://bibframe.org/vocab/Resource" && rt.resourceURI.match(/Work|Instance/)) {
                            if (pt.valueConstraint === undefined) { 
                                pt.valueConstraint = { "valueTemplateRefs": [] };
                            } else if (pt.valueConstraint.valueTemplateRefs === undefined) { 
                                pt.valueConstraint.valueTemplateRefs = [];
                            }
                            pt.valueConstraint.valueTemplateRefs = [ rt.id ];
                        } else if (p["http://www.w3.org/2000/01/rdf-schema#range"][0]["@id"] != "http://bibframe.org/vocab/Resource") {
                            p["http://www.w3.org/2000/01/rdf-schema#range"].forEach(function(range) {
                                if (range["@id"] !== undefined && range["@id"].match("http://bibframe.org/vocab/")) {
                                    if (pt.valueConstraint === undefined) { 
                                        pt.valueConstraint = { "valueTemplateRefs": [] };
                                    } else if (pt.valueConstraint.valueTemplateRefs === undefined) { 
                                        pt.valueConstraint.valueTemplateRefs = [];
                                    }
                                    if ( range["@id"] == "http://bibframe.org/vocab/Agent" ) {
                                        pt.valueConstraint.valueTemplateRefs = ["profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction" ];
                                    } else {
                                        pt.valueConstraint.valueTemplateRefs.push(range["@id"].replace("http://bibframe.org/vocab/", "profile:bf:"));
                                    }
                                }
                            });
                        }
                    } else if ( p["http://www.w3.org/2000/01/rdf-schema#subPropertyOf"] !== undefined ) {
                        // This property is a sub property, and its superproperty might have a range.  oy.
                        var sp = p["http://www.w3.org/2000/01/rdf-schema#subPropertyOf"][0]["@id"];
                        var sps = lodash.where(resources, {"@id": sp})[0];
                        pt.type = "resource";
                        if (
                                modifications[rt.resourceURI] !== undefined && 
                                modifications[rt.resourceURI][pt.propertyURI] !== undefined &&
                                modifications[rt.resourceURI][pt.propertyURI].valueConstraint !== undefined
                            ) {
                            pt.valueConstraint = modifications[rt.resourceURI][pt.propertyURI].valueConstraint; 
                        } else if (sps["http://www.w3.org/2000/01/rdf-schema#range"][0]["@id"] == "http://bibframe.org/vocab/Resource" && rt.resourceURI.match(/Work|Instance/)) {
                            if (pt.valueConstraint === undefined) { 
                                pt.valueConstraint = { "valueTemplateRefs": [] };
                            } else if (pt.valueConstraint.valueTemplateRefs === undefined) { 
                                pt.valueConstraint.valueTemplateRefs = [];
                            }
                            pt.valueConstraint.valueTemplateRefs = [ rt.id ];
                        } else if (sps["http://www.w3.org/2000/01/rdf-schema#range"][0]["@id"] != "http://bibframe.org/vocab/Resource") {
                            sps["http://www.w3.org/2000/01/rdf-schema#range"].forEach(function(range) {
                                if (range["@id"] !== undefined && range["@id"].match("http://bibframe.org/vocab/")) {
                                    if (pt.valueConstraint === undefined) { 
                                        pt.valueConstraint = { "valueTemplateRefs": [] };
                                    } else if (pt.valueConstraint.valueTemplateRefs === undefined) { 
                                        pt.valueConstraint.valueTemplateRefs = [];
                                    }
                                    if ( range["@id"] == "http://bibframe.org/vocab/Agent" ) {
                                        pt.valueConstraint.valueTemplateRefs = ["profile:bf:Person", "profile:bf:Organization", "profile:bf:Family", "profile:bf:Meeting", "profile:bf:Jurisdiction" ];
                                    } else {
                                        pt.valueConstraint.valueTemplateRefs.push(range["@id"].replace("http://bibframe.org/vocab/", "profile:bf:"));
                                    }
                                }
                            });
                        }
                    }
                    rt.propertyTemplates.push(pt);
                }
            
            });
        });
        var fname = profile.Profile.id.replace("profile:bf:", "") + ".json";
        console.log("Writing: " + fname);
        fs.writeFile('../static/profiles/bibframe/' + fname, JSON.stringify(profile, undefined, " "));
        //console.log(JSON.stringify(profile, undefined, " "));
    });
}
