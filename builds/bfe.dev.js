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
(function () {
  var ACE_NAMESPACE = 'bfe';

  var global = (function () {
    return this;
  })();

  if (!ACE_NAMESPACE && typeof requirejs !== 'undefined') { return; }

  var _define = function (module, deps, payload) {
    if (typeof module !== 'string') {
      if (_define.original) { _define.original.apply(window, arguments); } else {
        console.error('dropping module because define wasn\'t a string.');
        console.trace();
      }
      return;
    }

    if (arguments.length === 2) { payload = deps; }

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
  var _require = function (parentId, module, callback) {
    if (Object.prototype.toString.call(module) === '[object Array]') {
      var params = [];
      for (var i = 0, l = module.length; i < l; ++i) {
        var dep = lookup(parentId, module[i]);
        if (!dep && _require.original) { return _require.original.apply(window, arguments); }
        params.push(dep);
      }
      if (callback) {
        callback.apply(null, params);
      }
    } else if (typeof module === 'string') {
      var payload = lookup(parentId, module);
      if (!payload && _require.original) { return _require.original.apply(window, arguments); }

      if (callback) {
        callback();
      }

      return payload;
    } else {
      if (_require.original) { return _require.original.apply(window, arguments); }
    }
  };

  var normalizeModule = function (parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf('!') !== -1) {
      var chunks = moduleName.split('!');
      return normalizeModule(parentId, chunks[0]) + '!' + normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) === '.') {
      var base = parentId.split('/').slice(0, -1).join('/');
      moduleName = base + '/' + moduleName;

      while (moduleName.indexOf('.') !== -1 && previous !== moduleName) {
        var previous = moduleName;
        moduleName = moduleName.replace(/\/\.\//, '/').replace(/[^\/]+\/\.\.\//, '');
      }
    }

    return moduleName;
  };

    /**
     * Internal function to lookup moduleNames and resolve them by calling the
     * definition function if needed.
     */
  var lookup = function (parentId, moduleName) {
    moduleName = normalizeModule(parentId, moduleName);
    var exports;
    var module = _define.modules[moduleName];
    if (!module) {
      module = _define.payloads[moduleName];
      if (typeof module === 'function') {
        exports = {};
        var mod = {
          id: moduleName,
          uri: '',
          exports: exports,
          packaged: true
        };

        var req = function (module, callback) {
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

  function exportAce (ns) {
    var require = function (module, callback) {
      return _require('', module, callback);
    };

    var root = global;
    if (ns) {
      if (!global[ns]) { global[ns] = {}; }
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

bfe.define('src/bfe', ['require', 'exports', 'module', 'src/bfestore', 'src/bfelogging', 'src/lib/aceconfig'], function (require, exports, module) {
  var editorconfig = {};
  var bfestore = require('src/bfestore');
  var bfelog = require('src/bfelogging');
  // var store = new rdfstore.Store();
  var profiles = [];
  var resourceTemplates = [];
  var addFields = {};
  var addedProperties = [];
  // var startingPoints = [];
  // var formTemplates = [];
  // var lookups = [];

  var tabIndices = 1;

  // var loadtemplates = [];
  var loadtemplatesANDlookupsCount = 0;
  var loadtemplatesANDlookupsCounter = 0;

  // var lookupstore = [];
  // var lookupcache = [];

  var editordiv;

  // var csrf;

  var forms = [];

  var lookups = {
    'http://id.loc.gov/authorities/names': {
      'name': 'LCNAF',
      'load': require('src/lookups/lcnames')
    },
    'http://id.loc.gov/authorities/subjects': {
      'name': 'LCSH',
      'load': require('src/lookups/lcsubjects')
    },
    'http://id.loc.gov/authorities/genreForms': {
      'name': 'LCGFT',
      'load': require('src/lookups/lcgenreforms')
    },
    'http://id.loc.gov/resources/works': {
      'name': 'LC-Works',
      'load': require('src/lookups/lcworks')
    },
    'http://id.loc.gov/resources/instances': {
      'name': 'LC-Instances',
      'load': require('src/lookups/lcinstances')
    },
    'http://id.loc.gov/vocabulary/organizations': {
      'name': 'Organizations',
      'load': require('src/lookups/lcorganizations')
    },
    'http://id.loc.gov/vocabulary/relators': {
      'name': 'Relators',
      'load': require('src/lookups/relators')
    },
    'http://rdaregistry.info/termList/FormatNoteMus': {
      'name': 'RDA-Format-Musical-Notation',
      'load': require('src/lookups/rdaformatnotemus')
    },
    'http://rdaregistry.info/termList/RDAMediaType': {
      'name': 'RDA-Media-Type',
      'load': require('src/lookups/rdamediatype')
    },
    'http://rdaregistry.info/termList/ModeIssue': {
      'name': 'RDA-Mode-Issue',
      'load': require('src/lookups/rdamodeissue')
    },
    'http://rdaregistry.info/termList/RDACarrierType': {
      'name': 'RDA-Carrier-Type',
      'load': require('src/lookups/rdacarriertype')
    },
    'http://rdaregistry.info/termList/RDAContentType': {
      'name': 'RDA-Content-Type',
      'load': require('src/lookups/rdacontenttype')
    },
    'http://rdaregistry.info/termList/frequency': {
      'name': 'RDA-Frequency',
      'load': require('src/lookups/rdafrequency')
    },
    'http://www.rdaregistry.info/termList/AspectRatio': {
      'name': 'RDA-Aspect-Ratio',
      'load': require('src/lookups/rdaaspectration')
    },
    'http://www.rdaregistry.info/termList/RDAGeneration': {
      'name': 'RDA-Generation',
      'load': require('src/lookups/rdageneration')
    }
  };

    /*
    The following two bits of code come from the Ace Editor code base.
    Included here to make 'building' work correctly.  See:
    https://github.com/ajaxorg/ace/blob/master/lib/ace/ace.js
    */
  exports.aceconfig = require('src/lib/aceconfig');
  /**
     * Provides access to require in packed noconflict mode
     * @param {String} moduleName
     * @returns {Object}
     *
     **/
  exports.require = require;

  exports.setConfig = function (config) {
    editorconfig = config;

    // Set up logging
    bfelog.init(editorconfig);

    /**
     * Profiles are expected to be in the form provided by Verso:
     * A JSON Array of objects with a "json" property that contains the profile proper
     **/
    for (var i = 0; i < config.profiles.length; i++) {
      var file = config.profiles[i];
      $.ajax({
        type: 'GET',
        dataType: 'json',
        url: file,
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          bfelog.addMsg(new Error(), 'ERROR', 'FAILED to load profile: ' + file);
          bfelog.addMsg(new Error(), 'ERROR', 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
        },
        complete: function (jqXHR, textStatus) {
          if (textStatus == 'success') {
            var data = JSON.parse(jqXHR.responseText);
            $('#bfeditor-loader').width($('#bfeditor-loader').width() + 5 + '%');
            if (data.length > 0) {
              for (var j = 0; j < data.length; j++) {
                profiles.push(data[j].json);
                for (var rt = 0; rt < data[j].json.Profile.resourceTemplates.length; rt++) {
                  resourceTemplates.push(data[j].json.Profile.resourceTemplates[rt]);
                  // populate addFields hash with property templates for the "add property" function.
                  data[j].json.Profile.resourceTemplates[rt].propertyTemplates.forEach(function(ptemp) {
                    if (ptemp.type != 'resource') {
                      if (ptemp.propertyLabel !== undefined) {
                        var propKey = ptemp.propertyLabel;
                        propKey = propKey.replace(/^\d\w*\. /,'');
                        addFields[propKey] = ptemp;
                      }
                    }
                  })
                }
                bfelog.addMsg(new Error(), 'INFO', 'Loaded profile: ' + data[j].name);
              }
            } else {
              bfelog.addMsg(new Error(), 'ERROR', 'No profiles loaded from ' + this.url + ' (empty result set)');
            }
          }
        }
      });
    }

    if (config.lookups !== undefined) {
      loadtemplatesANDlookupsCount = loadtemplatesANDlookupsCount + Object.keys(config.lookups).length;
      config.lookups.foreach(function (lu) {
        bfelog.addMsg(new Error(), 'INFO', 'Loading lookup: ' + lu.load);
        require([lu.load], function (r) {
          setLookup(r);
        });
      });
    }
    if (editorconfig.baseURI === undefined) {
      editorconfig.baseURI = window.location.protocol + '//' + window.location.host + '/';
    }
    bfelog.addMsg(new Error(), 'INFO', 'baseURI is ' + editorconfig.baseURI);

    if (config.load !== undefined) {
      loadtemplatesANDlookupsCount = loadtemplatesANDlookupsCount + config.load.length;
      config.load.forEach(function (l) {
        var tempstore = [];
        l.templateID.forEach(function (lt) {
          var useguid = guid();
          var loadtemplate = {};
          loadtemplate.templateGUID = useguid;
          loadtemplate.resourceTemplateID = lt;
          loadtemplate.resourceURI = l.defaulturi;
          loadtemplate.embedType = 'page';
          loadtemplate.data = tempstore;
          loadtemplates.push(loadtemplate);
        });
        if (l.source !== undefined && l.source.location !== undefined && l.source.requestType !== undefined) {
          $.ajax({
            url: l.source.location,
            dataType: l.source.requestType,
            success: function (data) {
              bfelog.addMsg(new Error(), 'INFO', 'Fetched external source baseURI' + l.source.location);
              bfelog.addMsg(new Error(), 'DEBUG', 'Source data', data);

              tempstore = bfestore.jsonld2store(data);
              // loadtemplate.data = tempstore;
              cbLoadTemplates();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
              bfelog.addMsg(new Error(), 'ERROR', 'FAILED to load external source: ' + l.source.location);
              bfelog.addMsg(new Error(), 'ERROR', 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
            }
          });
        } else {
          cbLoadTemplates();
        }
      });
    }
  };

  exports.fulleditor = function (config, id) {
    editordiv = document.getElementById(id);
    var $containerdiv = $('<div class="container-fluid"><h2>Bibframe Editor Workspace</h2></div>');
    var $tabuldiv = $('<div class="tabs"></div>');
    var $tabul = $('<ul class="nav nav-tabs"></ul>');
    $tabul.append('<li class="active"><a data-toggle="tab" href="#browse">Browse</a></li>');
    $tabul.append('<li><a data-toggle="tab" href="#create">Editor</a></li>');
    $tabul.append('<li><a data-toggle="tab" href="#load">Load Work</a></li>');
    $tabul.append('<li><a data-toggle="tab" href="#loadibc">Load IBC</a></li>');
    $tabul.append('<li><a data-toggle="tab" href="#loadmarc">Load MARC</a></li>');

    $tabuldiv.append($tabul);
    $containerdiv.append($tabuldiv);

    var $tabcontentdiv = $('<div class="tab-content"></div>');
    var $browsediv = $('<div id="browse" class="tab-pane fade in active"><br></div>');
    var $creatediv = $('<div id="create" class="tab-pane fade"><br></div>');
    var $loaddiv = $('<div id="load" class="tab-pane fade"><br></div>');
    var $loadibcdiv = $('<div id="loadibc" class="tab-pane fade"><br></div>');
    var $loadmarcdiv = $('<div id="loadmarc" class="tab-pane fade"><br></div>');

    var $menudiv = $('<div>', {
      id: 'bfeditor-menudiv',
      class: 'col-md-2 sidebar'
    });
    var $formdiv = $('<div>', {
      id: 'bfeditor-formdiv',
      class: 'col-md-10 main'
    });
    // var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});
    var $rowdiv = $('<div>', {
      class: 'row'
    });

    var $loader = $('<div><br /><br /><h2>Loading...</h2><div class="progress progress-striped active">\
                        <div class="progress-bar progress-bar-info" id="bfeditor-loader" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 20%">\
                            <span class="sr-only">80% Complete</span>\
                        </div>\
                    </div>');
    var table = $('#table_id').DataTable();
    if (!$.fn.dataTable.isDataTable('#table_id')) {
      var $datatable = $('<table id="table_id" class="display"><thead><tr><th>id</th><th>name</th><th>title</th><th>LCCN</th><th>comment</th><th>modified</th><th>edit</th></tr></thead></table>');
      table = $(function () {
        $('#table_id').DataTable({
          'initComplete': function (settings, json) {
            if (window.location.hash !== '') {
              $('#table_id').DataTable().search(window.location.hash.split('#')[1]).draw();
            }
          },
          'processing': true,
          'paging': true,
          'ajax': {
            'url': config.url + '/verso/api/bfs',
            'dataSrc': '',
            'headers': {
              'Access-Control-Allow-Origin': '*',
              //'Content-Type': 'application/json',
              //'Accept': 'application/json',
              'Access-Control-Allow-Methods': 'DELETE, HEAD, GET, OPTIONS, POST, PUT',
              'Access-Control-Allow-Headers': 'Content-Type, Content-Range, Content-Disposition, Content-Description',
              'Access-Control-Max-Age': '1728000'
            }
          },
          // id
          'columns': [{
            'data': 'id'
          },
          // name
          {
            'data': 'name',
            'render': function (data, type, full, meta) {
              try {
                retval = mintResource(data);

                if (retval === 'eundefined') {
                  retval = data;
                }
              } catch (e) {
                retval = data;
              }

              return retval;
            }
          },
          // title
          {
            'data': 'rdf',
            'render': function (data, type, full, meta) {
              var retval = 'No Title';
              if (_.some(data, 'http://id.loc.gov/ontologies/bibframe/title')) {
                text = _.find(data, 'http://id.loc.gov/ontologies/bibframe/title')['http://id.loc.gov/ontologies/bibframe/title'];
                // return text["http://id.loc.gov/ontologies/bibframe/title"][0]["@value"];
                if (text !== undefined) {
                  _.each(text, function (el) {
                    if (el['@id'] !== undefined) {
                      id = el['@id'];
                      title = _.where(data, {
                        '@id': id
                      });

                      if (_.has(title[0], 'http://id.loc.gov/ontologies/bibframe/mainTitle')) { retval = title[0]['http://id.loc.gov/ontologies/bibframe/mainTitle'][0]['@value']; } else if (_.has(title[0], 'http://www.w3.org/2000/01/rdf-schema#label')) { retval = title[0]['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']; }
                    }
                  });
                }
              } else if (_.some(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')) {
                retval = _.find(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
                if (retval === undefined) { retval = _.find(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']; }
              } else {
                retval = 'No Title';
              }
              return retval;
            }
          },
          // lccn
          {
            'data': 'rdf',
            'render': function (data, type, full, meta) {
              var text = 'N/A';
              var lccns = _.filter(data, function (el) {
                if (!_.isEmpty(el['@type'])) {
                  if (el['@type'][0].match('^(http|https):\/\/id\.loc\.gov\/ontologies\/bibframe\/Lccn')) {
                    if (_.has(el, ['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'])) {
                      if (!_.isEmpty(el['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value'])) { return el['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value']; }
                    }
                  }
                }
              });
              if (!_.isEmpty(lccns)) {
                if (lccns.length === 1) {
                  text = lccns[0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value'];
                } else {
                  for (i = 0; i < lccns.length; i++) {
                    if (!lccns[i]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value'].startsWith('n')) { text = lccns[i]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value']; }
                  }
                }
              }
              // console.log(full.id);
              if (text !== 'N/A' && full.status === 'published' || full.status === 'success') {
                var ldsurl = config.basedbURI + '/loc.natlib.instances.e' + text.trim() + '0001';

                if (text.trim().startsWith('n')) {
                  ldsurl = config.basedbURI + '/loc.natlib.works.' + text.trim().replace(/\s+/g, '');
                }

                var lccn = text.trim();
                var table = new $.fn.dataTable.Api(meta.settings);
                var cell = table.cell(meta.row, meta.col);
                if (full.status === 'success') {
                  if (full.objid.includes('instances/e')){
                    cell.node().innerHTML = '<a href="' + ldsurl + '">' + lccn + '</a>';
                  } else {
                    cell.node().innerHTML = '<a href="' + config.basedbURI + '/' + full.objid + '">' + lccn + '</a>';
                  }
                  
                  $(cell.node()).css('background-color', 'lightgreen');
                } else {
                  if (new Date(new Date(full.modified).getTime() + 60000) > new Date()) {
                    $(cell.node()).css('background-color', 'yellow');
                  } else {
                    $(cell.node()).css('background-color', 'lightcoral');
                  }
                  /* $.ajax({
                                            type: "HEAD",
                                            async: true,
                                            data: { uri: ldsurl },
                                            url: config.url + "/profile-edit/server/checkuri",
                                        }).done(function(data){
                                            cell.node().innerHTML = "<a href=\""+ldsurl+"\">" + lccn + "</a>";
                                            $(cell.node()).css('background-color', 'lightgreen');
                                        }).fail(function(data, text){
                                            if (full.status === "published"){
                                                $(cell.node()).css('background-color', 'lightcoral');
                                            }
                                        }); */
                }
              } else {
                // $(cell.node()).css('background-color', 'lightcoral');
                // console.log(full.message);
                // bfelog.addMsg(new Error(), "INFO", full.message, text);
              }

              return text;
            }
          },
          //comment
          {
            'data': 'rdf',
            'render': function (data, type, full, meta) {
              var text = '';
              var mahttp = _.findKey(data, 'http://id.loc.gov/ontologies/bflc/metadataAssigner');
              var mahttps = _.findKey(data, 'https://id.loc.gov/ontologies/bflc/metadataAssigner');
              var cihttp = _.findKey(data, 'http://id.loc.gov/ontologies/bflc/catalogerId');
              var cihttps = _.findKey(data, 'https://id.loc.gov/ontologies/bflc/catalogerId');
              if (mahttps) {
                text = _.pluck(data[mahttps]['https://id.loc.gov/ontologies/bflc/metadataAssigner'], '@value')[0];
              } else if (mahttp) {
                text = _.pluck(data[mahttp]['http://id.loc.gov/ontologies/bflc/metadataAssigner'], '@value')[0];
              } else if (cihttps) {
                text = _.pluck(data[cihttps]['https://id.loc.gov/ontologies/bflc/catalogerId'], '@value')[0];
              } else if (cihttp) {
                text = _.pluck(data[cihttp]['http://id.loc.gov/ontologies/bflc/catalogerId'], '@value')[0];
              }
              //                                if (_.filter(data, function(el) {
              //                                        return el["http://id.loc.gov/ontologies/bflc/metadataAssigner"]
              //                                    }).length > 0)
              //                                    text = _.filter(data, function(el) {
              //                                        return el["http://id.loc.gov/ontologies/bflc/metadataAssigner"]
              //                                    })[0]["http://id.loc.gov/ontologies/bflc/metadataAssigner"][0]["@value"];
              return text.length > 60 ? text.substr(0, 58) + '...' : text;
            }
          },
          //modified
          {
            'data': 'modified',
            'width': '10%',
            'render': function (data, type, row) {
              var d = new Date(data);
              // Month first

              var hr = d.getHours();
              var min = d.getMinutes();
              var ampm = 'a';
              if (min < 10) { min = '0' + min; }
              if (hr >= 12) {
                ampm = 'p';
              }
              if (hr > 12) {
                hr -= 12;
              }
              return (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear() + ' ' + hr + ':' + min + ampm;
            }
          },
          //edit
          {
            'data': 'url',
            'width': '10%',
            'searchable': false,
            'filterable': false,
            'sortable': false,
            'render': function (td, cellData, rowData, row) {
              //             return '<a href="'+data+'">edit</a>';

              return '<div class="btn-group" id="retrieve-btn"><button id="bfeditor-retrieve' + rowData.id + '" type="button" class="btn btn-default">Edit</button> \
                             <button id="bfeditor-delete' + rowData.id + '"type="button" class="btn btn-danger" data-toggle="modal" data-target="#bfeditor-deleteConfirm' + rowData.id + '">Delete</button> \
                             </div>';
            },
            'createdCell': function (td, cellData, rowData, row, col) {
              if (rowData.status === 'success' || rowData.status === 'published') { $(td).find('#bfeditor-delete' + rowData.id).attr('disabled', 'disabled'); }

              var useguid = guid();
              var loadtemplate = {};
              var tempstore = [];
              var spoints;
              bfestore.store = [];
              bfestore.loadtemplates = [];

              // default
              // var spoints = editorconfig.startingPoints[0].menuItems[0];
              if (rowData.profile !== 'profile:bf2:Load:Work' && rowData.profile !== 'profile:bf2:IBC:Instance') {
                var menuIndex = _.findIndex(_(editorconfig.startingPoints).chain().find({
                  menuItems: [{
                    useResourceTemplates: [rowData.profile]
                  }]
                }).value().menuItems, {
                  useResourceTemplates: [rowData.profile]
                });
                spoints = _(editorconfig.startingPoints).chain().find({
                  menuItems: [{
                    useResourceTemplates: [rowData.profile]
                  }]
                }).value().menuItems[menuIndex];
              } else if (rowData.profile === 'profile:bf2:Load:Work') {
                spoints = { label: 'Loaded Work',
                  type: ['http://id.loc.gov/ontologies/bibframe/Work'],
                  useResourceTemplates: ['profile:bf2:Load:Work']
                };
              } else if (rowData.profile === 'profile:bf2:IBC:Instance') {
                spoints = { label: 'IBC',
                  type: ['http://id.loc.gov/ontologies/bibframe/Instance'],
                  useResourceTemplates: ['profile:bf2:IBC:Instance']
                };
              }

              var bTypes = [];
              var temptemplates = [];
              spoints.useResourceTemplates.forEach(function (l) {
                var useguid = guid();
                var loadtemplate = {};
                loadtemplate.templateGUID = rowData.name;
                loadtemplate.resourceTemplateID = l;
                // loadtemplate.resourceURI = cellData;
                // loadtemplate.resourceURI = whichrt(loadtemplate, editorconfig.baseURI) + loadTemplate.templateGUID;//editorconfig.baseURI + useguid;
                loadtemplate.embedType = 'page';
                loadtemplate.data = [];
                temptemplates.push(loadtemplate);
              });

              $(td).find('#bfeditor-retrieve' + rowData.id).click(function () {
                if (editorconfig.retrieve.callback !== undefined) {
                  // loadtemplates = temptemplates;
                  bfestore.loadtemplates = temptemplates;
                  // editorconfig.retrieve.callback(cellData,bfestore, bfelog, cbLoadTemplates);
                  bfestore.store = [];
                  bfestore.state = 'edit';
                  tempstore = bfestore.jsonld2store(rowData.rdf);
                  bfestore.name = rowData.name;
                  bfestore.created = rowData.created;
                  bfestore.url = rowData.url;
                  bfestore.profile = rowData.profile;
                  addedProperties = rowData.addedproperties;
                  $('[href=#create]').tab('show');
                  if ($('#bfeditor-messagediv').length) {
                    $('#bfeditor-messagediv').remove();
                    $('#bfeditor-formdiv').show();
                    $('#save-btn').remove();
                    $('#bfeditor-previewPanel').remove();
                  }
                  cbLoadTemplates();
                  window.location.hash = mintResource(rowData.name);
                } else {
                  // retrieve disabled
                  addedProperties = [];
                }
              });

              $(td).append($('<div class="modal fade" id="bfeditor-deleteConfirm' + rowData.id + '" role="dialog"><div class="modal-dialog modal-sm"><div class="modal-content"> \
                            <div class="modal-body"><h4>Delete?</h4></div>\
                            <div class="modal-footer"><button type="button" class="btn btn-default" id="bfeditor-modalCancel" data-dismiss="modal">Cancel</button> \
                            <button type="button" id="bfeditor-deleteConfirmButton' + rowData.id + '" class="btn btn-danger btn-ok" data-dismiss="modal">Delete</button></div></div></div></div></div>'));

              $(td).find('#bfeditor-deleteConfirmButton' + rowData.id).click(function () {
                if (editorconfig.deleteId.callback !== undefined) {
                  editorconfig.deleteId.callback(rowData.id, editorconfig.getCSRF.callback(), bfelog);
                  var table = $('#table_id').DataTable();
                  // table.row($(this).parents('tr')).remove().draw();
                  bfestore.store = [];
                  // table.ajax.reload();
                } else {
                  // delete disabled
                }
              });

              $(td).find('#bfeditor-deleteConfirm' + rowData.id).on('hidden.bs.modal', function () {
                var table = $('#table_id').DataTable();
                bfestore.store = [];
                table.ajax.reload();
              });
            }
          }
          ]
        });
      });
      $browsediv.append($datatable);
    }

    $formdiv.append($loader);

    $menudiv.append('<h3>Create Resource</h3>');
    $rowdiv.append($menudiv);
    $rowdiv.append($formdiv);
    // rowdiv.append(optiondiv);

    $creatediv.append($rowdiv);

    $loaddiv.append($('<div class="container"> \
            <form role="form" method="get"> \
            <div class="form-group"> \
            <label for="url">URL for Bibframe JSON</label> \
            <input id="bfeditor-loaduriInput" class="form-control" placeholder="Enter URL for Bibframe" type="text" name="url" id="url"></div> \
            <button id="bfeditor-loaduri" type="button" class="btn btn-primary">Submit URL</button> \
            </form></div>'));

    
    var getProfileOptions = function(jqObject) {
      for (var h = 0; h < config.startingPoints.length; h++) {
        var sp = config.startingPoints[h];
        var label = sp.menuGroup
        for (var i = 0; i < sp.menuItems.length; i++) {
          var $option = $('<option>', {
            class: 'dropdown-item',
            value: 'sp-' + h + '_' + i
          });
          if(sp.menuItems[i].type[0] === "http://id.loc.gov/ontologies/bibframe/Instance" || sp.menuItems[i].type[0] === "http://id.loc.gov/ontologies/bibframe/Serial"){
            //$a.html(sp.menuItems[i].label);
            $option.html(label);
            jqObject.append($option);
          }
        }      
      }
    }

    var $loadibcform = $('<div class="container"> \
            <form role="form" method="get"> \
            <div class="form-group"> \
            <label for="url">URL for Bibframe JSON</label> \
            <input id="bfeditor-loadibcuriInput" class="form-control" placeholder="Enter URL for Bibframe" type="text" name="url" id="url"> \
            <div id="bfeditor-loadibc-dropdown" class="dropdown"><select id="bfeditor-loadibc-dropdownMenu" type="select" class="form-control">Select Profile</select> \
            </div></div> \
            <button id="bfeditor-loadibcuri" type="button" class="btn btn-primary">Submit URL</button> \
            </form></div>');

    getProfileOptions($loadibcform.find('#bfeditor-loadibc-dropdownMenu'));

    $loadibcdiv.append($loadibcform);
            
    $loadibcdiv.find('#bfeditor-loadibcuri').click(function () {
      // var loadtemplates = [];

      var spid = $(this.parentElement).find('#bfeditor-loadibc-dropdownMenu').val();
      
      var spnums = spid.replace('sp-', '').split('_'); 
      
      var spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];

      if ($('#bfeditor-messagediv').length) {
        $('#bfeditor-messagediv').remove();
      }

      bfeditor.bfestore.store = [];
      bfeditor.bfestore.name = guid();
      bfeditor.bfestore.created = new Date().toUTCString();
      bfeditor.bfestore.url = config.url + '/verso/api/bfs?filter=%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D';
      bfeditor.bfestore.state = 'loaduri';
      bfeditor.bfestore.profile = spoints.useResourceTemplates[0];
      loadtemplatesCount = spoints.useResourceTemplates.length;

      var temptemplates = [];
      spoints.useResourceTemplates.forEach(function (l) {
        var useguid = guid();
        var loadtemplate = {};
        loadtemplate.templateGUID = useguid;
        loadtemplate.resourceTemplateID = l;
        loadtemplate.embedType = 'page';
        loadtemplate.data = [];
        temptemplates.push(loadtemplate);
      });

      if (editorconfig.retrieveLDS.callback !== undefined) {
        try {
          bfestore.loadtemplates = temptemplates;
          var url = $(this.parentElement).find('#bfeditor-loadibcuriInput').val();

          if (!url.trim().includes('instance')) {
            msg = 'Please choose an instance';
            var $messagediv = $('<div>', {id: 'bfeditor-messagediv', class: 'main'});
            $messagediv.append('<div class="alert alert-danger" role="alert"><strong>Please choose an instance to load</strong></a></div>');
            $messagediv.insertBefore('.nav-tabs');
          } else {
            editorconfig.retrieveLDS.callback(url, bfestore, bfestore.loadtemplates, bfelog, function (loadtemplates) {
              // converter uses bf:person intead of personal name
              _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Person'}), function (triple) {
                triple.o = 'http://www.loc.gov/mads/rdf/v1#PersonalName';
              });
              // converter uses bf:organization intead of corporate name
              _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Organization'}), function (triple) {
                triple.o = 'http://www.loc.gov/mads/rdf/v1#CorporateName';
              });
              // eliminate duplicate type bf:Contributor
              _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bflc/PrimaryContribution'}), function (triple) {
                var duplicateContribution = _.find(bfeditor.bfestore.store, {'s': triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Contribution'});
                if (!_.isEmpty(duplicateContribution)) {
                  bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, duplicateContribution);
                }
              });

              // eliminate duplicate type bf:ProvisionActivity
              _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Publication'}), function (triple) {
                var duplicateProvActivity = _.find(bfeditor.bfestore.store, {'s': triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/ProvisionActivity'});
                if (!_.isEmpty(duplicateProvActivity)) {
                  bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, duplicateProvActivity);
                }
              });

              // eliminate itemOf
              if (_.some(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bflc/itemOf'})) {
                var removeItem = _.find(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bflc/itemOf'});
                // if(!_.isEmpty(removeItem)){
                //    bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, removeItem);
                // }
              }

              _.each(_.where(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata'}), function (am) {
                var adminTriple = {};
                adminTriple.s = am.o;
                adminTriple.p = 'http://id.loc.gov/ontologies/bflc/profile';
                adminTriple.o = bfeditor.bfestore.profile;
                adminTriple.otype = 'literal';
                bfeditor.bfestore.store.push(adminTriple);

                adminTriple = {};
                adminTriple.s = am.o;
                adminTriple.p = 'http://id.loc.gov/ontologies/bflc/procInfo';
                adminTriple.o = 'ibc update';
                adminTriple.otype = 'literal';
                bfeditor.bfestore.store.push(adminTriple);
              });

              //                        _.each(_.where(bfeditor.bfestore.store, {"p":"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}), function(triple) {
              //                            _.each(_.where(bfeditor.bfestore.store, {"s":triple.s, "p":"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}), function (typeTriple){
              //                                console.log(typeTriple.s + typeTriple.o);
              //                            });
              //                        });

              bfestore.loadtemplates.data = bfeditor.bfestore.store;
              $('[href=#create]').tab('show');
              $('#bfeditor-formdiv').show();
              if ($('#bfeditor-messagediv').length) {
                $('#bfeditor-messagediv').remove();
              }
              // before loading the data, clean up the types

              cbLoadTemplates();
            });
          }
        } catch (e) {
          $(this.parentElement).find('#bfeditor-loaduriInput').val('An error occured: ' + e.message);
        }
      } else {
        // retrieve disabled
        $(this.parentElement).find('#bfeditor-loaduriInput').val('This function has been disabled');
      }
    });

    $loadmarcdiv.append($('<div class="container"> \
            <form role="form" method="get"> \
            <div class="form-group"> \
            <label for="marcdx">Bib ID or LCCN</label> \
            <div class="input-group"> \
            <div class="input-group-btn"> \
            <button type="button" id="marcdx" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Bib ID <span class="caret"></span></button> \
            <ul class="dropdown-menu"> \
            <li><a href="#" id="bibid">Bib ID</a></li> \
            <li><a href="#" id="lccn">LCCN</a></li> \
            </ul></div> \
            <input id="bfeditor-loadmarcterm" class="form-control" placeholder="Enter Bib ID or LCCN" type="text" name="url"></div> \
            <input type="hidden" id="loadmarc-uri"></hidden>\
            <label for="bfeditor-loadmarc-dropdown">Choose Profile</label> \
            <div id="bfeditor-loadmarc-dropdown" class="dropdown"><select id="bfeditor-loadmarc-dropdownMenu" type="select" class="form-control">Select Profile</select></div></div> \
            <button id="bfeditor-loadmarc" type="button" class="btn btn-primary">Submit</button> \
            </form></div>'));
    
    getProfileOptions($loadmarcdiv.find('#bfeditor-loadmarc-dropdownMenu'));
    
    $loadmarcdiv.find('.dropdown-menu > li > a').click(function() {
      $('#marcdx').html($(this).text() + ' <span class="caret">');
    });
    $loadmarcdiv.find('#bfeditor-loadmarc').click(function() {
      var term = $('#bfeditor-loadmarcterm').val();
      var dx = 'rec.id';
      if ($('#marcdx').text().match(/LCCN/i)) {
        dx = 'bath.lccn';
      }
      var url = 'http://lx2.loc.gov:210/LCDB?query=' + dx + '=' + term + '&recordSchema=bibframe2a&maximumRecords=1';
      $('#loadmarc-uri').attr('value', url);
    });
    
    $tabcontentdiv.append($browsediv);
    $tabcontentdiv.append($creatediv);
    $tabcontentdiv.append($loaddiv);
    $tabcontentdiv.append($loadibcdiv);
    $tabcontentdiv.append($loadmarcdiv);

    $tabcontentdiv.find('#bfeditor-loaduri, #bfeditor-loadmarc').click(function () {
      var spoints = {};

      if (this.id == 'bfeditor-loadmarc') {
        var spid = $(this.parentElement).find('#bfeditor-loadmarc-dropdownMenu').val();
        var spnums = spid.replace('sp-', '').split('_'); 
        spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
        bfeditor.bfestore.state = 'loadmarc';
      } else {
        spoints = { label: 'Loaded Work',
          type: ['http://id.loc.gov/ontologies/bibframe/Work'],
          useResourceTemplates: ['profile:bf2:Monograph:Work']
        };
        bfeditor.bfestore.state = 'loaduri';
      }
 
      bfeditor.bfestore.store = [];
      bfeditor.bfestore.name = guid();
      bfeditor.bfestore.created = new Date().toUTCString();
      bfeditor.bfestore.url = config.url + '/verso/api/bfs?filter=%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D';
      // bfeditor.bfestore.state = 'loaduri';
      bfeditor.bfestore.profile = spoints.useResourceTemplates[0];
      loadtemplatesCount = spoints.useResourceTemplates.length;

      var temptemplates = [];
      spoints.useResourceTemplates.forEach(function (l) {
        var useguid = guid();
        var loadtemplate = {};
        loadtemplate.templateGUID = useguid;
        loadtemplate.resourceTemplateID = l;
        loadtemplate.embedType = 'page';
        loadtemplate.data = [];
        temptemplates.push(loadtemplate);
      });

      if (editorconfig.retrieve.callback !== undefined) {
        try {
          bfestore.loadtemplates = temptemplates;
          var url = $(this.parentElement).find('#bfeditor-loaduriInput, #loadmarc-uri').val();
          editorconfig.retrieve.callback(url, bfestore, bfestore.loadtemplates, bfelog, function (loadtemplates) {
            // converter uses bf:person intead of personal name
            _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Person'}), function (triple) {
              triple.o = 'http://www.loc.gov/mads/rdf/v1#PersonalName';
            });
            // converter uses bf:organization intead of corporate name
            _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Organization'}), function (triple) {
              triple.o = 'http://www.loc.gov/mads/rdf/v1#CorporateName';
            });
            // eliminate duplicate type bf:Contributor
            _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bflc/PrimaryContribution'}), function (triple) {
              bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, _.find(bfeditor.bfestore.store, {'s': triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Contribution'}));
            });

            // Text to Work
            _.each(_.where(bfeditor.bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Text'}), function (triple) {
              bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, _.find(bfeditor.bfestore.store, {'s': triple.s, 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': 'http://id.loc.gov/ontologies/bibframe/Text'}));
            });

            bfestore.loadtemplates.data = bfeditor.bfestore.store;
            $('[href=#create]').tab('show');
            $('#bfeditor-formdiv').show();
            if ($('#bfeditor-messagediv').length) {
              $('#bfeditor-messagediv').remove();
            }

            // weird bnode prob
            _.each(bfeditor.bfestore.store, function (el) {
              if (el.o !== undefined && el.o.startsWith('_:_:')) { el.o = '_:' + el.o.split('_:')[2]; }
            });

            cbLoadTemplates();
          });
        } catch (e) {
          $(this.parentElement).find('#bfeditor-loaduriInput').val('An error occured: ' + e.message);
        }
      } else {
        // retrieve disabled
        $(this.parentElement).find('#bfeditor-loaduriInput').val('This function has been disabled');
      }
    });


    $containerdiv.append($tabcontentdiv);

    $(editordiv).append($containerdiv);

    this.setConfig(config);

    for (var h = 0; h < config.startingPoints.length; h++) {
      var sp = config.startingPoints[h];
      var $menuul = $('<ul>', {
        class: 'nav nav-sidebar'
      });
      var $menuheadingul = null;
      if (typeof sp.menuGroup !== undefined && sp.menuGroup !== '') {
        var $menuheading = $('<li><a class="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">' + sp.menuGroup + '<span class="caret"></span></a></li>');
        $menuheadingul = $('<ul class="dropdown-menu"></ul>');
        $menuheading.append($menuheadingul);
        $menuul.append($menuheading);
      }
      for (var i = 0; i < sp.menuItems.length; i++) {
        var $li = $('<li>');
        var $a = $('<a>', {
          href: '#',
          id: 'sp-' + h + '_' + i
        });
        $a.html(sp.menuItems[i].label);
        $a.click(function () {
          $('#bfeditor-messagediv').remove();
          $('#bfeditor-formdiv').show();
          $('#save-btn').remove();
          $('#bfeditor-previewPanel').remove();
          menuSelect(this.id);
        });
        $li.append($a);
        if ($menuheadingul !== null) {
          $menuheadingul.append($li);
        } else {
          $menuul.append($li);
        }
      }
      $menudiv.append($menuul);
    }

    // Debug div
    if (editorconfig.logging !== undefined && editorconfig.logging.level !== undefined && editorconfig.logging.level == 'DEBUG') {
      var $debugdiv = $('<div id="bfeditor-debugdiv" class="col-md-12 main panel-group">\
                         <div class="panel panel-default"><div class="panel-heading">\
                         <h3 class="panel-title"><a role="button" data-toggle="collapse" href="#debuginfo">Debug output</a></h3></div>\
                         <div class="panel-collapse collapse in" id="debuginfo"><div class="panel-body"><pre id="bfeditor-debug"></pre></div></div></div>\
                         </div>');
      $(editordiv).append($debugdiv);
      var $debugpre = $('#bfeditor-debug');
      $debugpre.html(JSON.stringify(profiles, undefined, ' '));
    }

    var $footer = $('<footer>', {
      class: 'footer'
    });
    $(editordiv).append($footer);

    if (loadtemplatesANDlookupsCount === 0) {
      // There was nothing to load, so we need to get rid of the loader.
      $formdiv.html('');
    }

    $('a[data-toggle="tab"]').click(function (e) {
      $('#bfeditor-messagediv').remove();
    });

    return {
      'profiles': profiles,
      'div': editordiv,
      'bfestore': bfestore,
      'bfelog': bfelog
    };
  };

  exports.editor = function (config, id) {
    this.setConfig(config);

    editordiv = document.getElementById(id);

    var $formdiv = $('<div>', {
      id: 'bfeditor-formdiv',
      class: 'col-md-12'
    });

    // var optiondiv = $('<div>', {id: "bfeditor-optiondiv", class: "col-md-2"});

    var $rowdiv = $('<div>', {
      class: 'row'
    });

    $rowdiv.append($formdiv);
    // rowdiv.append(optiondiv);

    $(editordiv).append($rowdiv);

    // Debug div
    if (editorconfig.logging !== undefined && editorconfig.logging.level !== undefined && editorconfig.logging.level == 'DEBUG') {
      var $debugdiv = $('<div>', {
        class: 'col-md-12'
      });
      $debugdiv.html('Debug output');
      var $debugpre = $('<pre>', {
        id: 'bfeditor-debug'
      });
      $debugdiv.append($debugpre);
      $(editordiv).append($debugdiv);
      $debugpre.html(JSON.stringify(profiles, undefined, ' '));
    }

    var $footer = $('<div>', {
      class: 'col-md-12'
    });
    $(editordiv).append($footer);

    return {
      'profiles': profiles,
      'div': editordiv,
      'bfestore': bfestore,
      'bfelog': bfelog
    };
  };

  function setLookup (r) {
    if (r.scheme !== undefined) {
      bfelog.addMsg(new Error(), 'INFO', 'Setting up scheme ' + r.scheme);
      var lu = this.config.lookups[r.scheme];
      lookups[r.scheme] = {};
      lookups[r.scheme].name = lu.name;
      lookups[r.scheme].load = r;
    } else {
      bfelog.addMsg(new Error(), 'WARN', 'Loading lookup FAILED', r);
    }
  }

  function cbLoadTemplates (propTemps) {
    $('#bfeditor-loader').width($('#bfeditor-loader').width() + 5 + '%');
    loadtemplatesANDlookupsCounter++;
    var loadtemplates = bfeditor.bfestore.loadtemplates;

    //        if (bfeditor.loadtemplates !== undefined && bfestore.loadtemplates[0].resourceTemplateID === "profile:bf2:Load:Work"){
    //            loadtemplates = bfeditor.bfestore.loadtemplates;
    //        }

    if (loadtemplatesANDlookupsCounter >= loadtemplatesANDlookupsCount) {
      $('#bfeditor-formdiv').html('');
      if (loadtemplates.length > 0) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Loading selected template(s)', loadtemplates);
        var form = getForm(loadtemplates, propTemps);
        $('.typeahead', form.form).each(function () {
          setTypeahead(this);
        });
        var $exitButtonGroup = $('<div class="btn-group pull-right"> \
                    <button id="bfeditor-cancel" type="button" class="btn btn-default">Cancel</button> \
                    <button id="bfeditor-preview" type="button" class="btn btn-primary">Preview</button> \
                </div>');
        form.form.append($exitButtonGroup);

        $('<input>', {
          type: 'hidden',
          id: 'profile-id',
          value: loadtemplates[0].resourceTemplateID
        }).appendTo(form.form);

        $('#bfeditor-cancel', form.form).click(function () {
          $('#bfeditor-formdiv').empty();
          $('[href=#browse]').tab('show');
          bfeditor.bfestore.store = [];
          window.location.hash = '';
          $('#table_id').DataTable().search('').draw();
          $('#table_id').DataTable().ajax.reload();
        });
        $('#bfeditor-cancel', form.form).attr('tabindex', tabIndices++);

        $('#bfeditor-preview', form.form).click(function () {
          var humanized = bfeditor.bfestore.store2text();
          var jsonstr = bfeditor.bfestore.store2jsonldExpanded();

          // bfeditor.bfestore.store2rdfxml(jsonstr, rdfxmlPanel);

          // bfeditor.bfestore.store2turtle(jsonstr, humanizedPanel);
          bfeditor.bfestore.store2jsonldcompacted(jsonstr, jsonPanel);

          function humanizedPanel (data) {
            $('#humanized .panel-body pre').text(data);
          }

          function rdfxmlPanel (rdfxml) {
            $('#rdfxml .panel-body pre').text(rdfxml);
          }

          function jsonPanel (data) {
            bfeditor.bfestore.store2turtle(data, humanizedPanel);
            //bfeditor.bfestore.store2rdfxml(data, rdfxmlPanel);
            $('#jsonld .panel-body pre').text(JSON.stringify(data, undefined, ' '));

            bfeditor.bfestore.store2jsonldnormalized(data, function (expanded) {
              d3.jsonldVis(expanded, '#jsonld-vis .panel-body', {
                w: 800,
                h: 600,
                maxLabelWidth: 250
              });
            });
          }

          document.body.scrollTop = document.documentElement.scrollTop = 0;
          var $saveButtonGroup = $('<div class="btn-group" id="save-btn"> \
                         <button id="bfeditor-exitback" type="button" class="btn btn-default">&#9664;</button> \
                         <button id="bfeditor-exitcancel" type="button" class="btn btn-default">Cancel</button> \
                         <button id="bfeditor-exitsave" type="button" class="btn btn-primary">Save</button> \
                         <button id="bfeditor-exitpublish" type="button" class="btn btn-danger">Post</button> \
                         </div>');

          var $bfeditor = $('#create > .row');
          var $preview = $('<div id="bfeditor-previewPanel" class="col-md-10 main panel-group">\
                         <div class="panel panel-default"><div class="panel-heading">\
                         <h3 class="panel-title"><a role="button" data-toggle="collapse" href="#humanized">Preview</a></h3></div>\
                         <div class="panel-collapse collapse in" id="humanized"><div class="panel-body"><pre>' + humanized + '</pre></div></div>\
                         <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#jsonld">JSONLD</a></h3></div>\
                         <div class="panel-collapse collapse in" id="jsonld"><div class="panel-body"><pre>' + JSON.stringify(jsonstr, undefined, ' ') + '</pre></div></div>\
                         <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#rdfxml">RDF-XML</a></h3></div>\
                         <div class="panel-collapse collapse in" id="rdfxml"><div class="panel-body"><pre></pre></div></div>\
                         <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#jsonld-vis">Visualize</a></h3</div></div>\
                         <div class="panel-collapse collapse in" id="jsonld-vis"><div class="panel-body"></div></div></div>\
                         </div>');
          var $messagediv;
          $bfeditor.append($saveButtonGroup);

          $('#bfeditor-exitback').click(function () {
            $('#save-btn').remove();
            $('#bfeditor-previewPanel').remove();
            $('#bfeditor-messagediv').remove();
            $('#bfeditor-formdiv').show();
          });
          $('#bfeditor-exitcancel, [href=#browse]').click(function () {
            $('#save-btn').remove();
            $('#bfeditor-previewPanel').remove();
            $('#bfeditor-messagediv').remove();
            $('#bfeditor-formdiv').show();
            $('#bfeditor-formdiv').empty();
            $('[href=#browse]').tab('show');
            window.location.hash = '';
            bfeditor.bfestore.store = [];
            $('#table_id').DataTable().ajax.reload();
          });

          $('#bfeditor-exitsave').click(function () {
            if (editorconfig.save.callback !== undefined) {
              //        to_json= {'name': dirhash,'dir' : savedir,'url' : jsonurl,'rdf' : jsonobj}
              // var dirhash = guid();
              var save_json = {};
              save_json.name = bfeditor.bfestore.name;
              save_json.profile = loadtemplates[0].resourceTemplateID;
              save_json.url = config.url + '/verso/api/bfs?filter=%7B%22where%22%3A%20%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D%7D';
              save_json.created = bfeditor.bfestore.created;
              save_json.modified = new Date().toUTCString();

              if (_.some(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata'})) {
                var modifiedDate = new Date(save_json.modified);
                var modifiedDateString = modifiedDate.toJSON().split(/\./)[0];

                if (_.some(bfeditor.bfestore.store, {p: 'http://id.loc.gov/ontologies/bibframe/changeDate'})) {
                  _.each(_.where(bfeditor.bfestore.store, {p: 'http://id.loc.gov/ontologies/bibframe/changeDate'}), function (cd) {
                    cd.o = modifiedDateString;
                  });
                } else {
                  var adminTriple = {};
                  adminTriple.s = _.find(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata'}).o;
                  adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/changeDate';
                  adminTriple.o = modifiedDateString;
                  adminTriple.otype = 'literal';
                  bfeditor.bfestore.store.push(adminTriple);
                }
              }

              save_json.rdf = bfeditor.bfestore.store2jsonldExpanded();
              save_json.addedproperties = addedProperties;

              if (_.some(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle'})) {
                editorconfig.save.callback(save_json, editorconfig.getCSRF.callback(), bfelog, function (save, save_name) {
                  console.log('Saved: ' + save_name);
                });
              } else {
                // title required
                $messagediv = $('<div>', {id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert'});
                $messagediv.append('<strong>No title found:</strong><a href=' + bfeditor.bfestore.url + '>' + mintResource(bfeditor.bfestore.name) + '</a>');
                $messagediv.insertBefore('.tabs');
              }
            } else {
              // save disabled
              $('#bfeditor-formdiv').empty();
              $('[href=#browse]').tab('show');
              bfeditor.bfestore.store = [];
              $('#table_id').DataTable().ajax.reload();

              $messagediv.append('<span class="str"><h3>Save disabled</h3></span>');
              $('#bfeditor-formdiv').append($messagediv);
            }
          });

          $('#bfeditor-exitpublish').click(function () {
            // remove problematic nodes
            // instanceOf
            if (_.some(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/instanceOf'})) {
              // remove cached work before publishing
              var work = _.find(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/instanceOf'}).o;
              // if (!_.isEmpty(work))
              // if(work.startsWith("http://id.loc.gov/resources/works/c"))
              // bfeditor.bfestore.store = _.reject(bfeditor.bfestore.store, {s:work});
            }

            if (editorconfig.publish.callback !== undefined) {
              if (_.some(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle'})) {
                //bfeditor.bfestore.store2rdfxml(bfeditor.bfestore.store2jsonldExpanded(), function (rdfxml) {
                  var rdfxml = $("#rdfxml .panel-body pre").text();
                  var save_json = {};
                  save_json.name = mintResource(bfeditor.bfestore.name);
                  save_json.profile = loadtemplates[0].resourceTemplateID;
                  save_json.url = bfeditor.bfestore.url;
                  save_json.created = bfeditor.bfestore.created;
                  save_json.modified = new Date().toUTCString();

                  if (_.some(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata'})) {
                    var modifiedDate = new Date(save_json.modified);
                    var modifiedDateString = modifiedDate.toJSON().split(/\./)[0];

                    if (_.some(bfeditor.bfestore.store, {p: 'http://id.loc.gov/ontologies/bibframe/changeDate'})) {
                      _.each(_.where(bfeditor.bfestore.store, {p: 'http://id.loc.gov/ontologies/bibframe/changeDate'}), function (cd) {
                        cd.o = modifiedDateString;
                      });
                    } else {
                      var adminTriple = {};
                      adminTriple.s = _.find(bfeditor.bfestore.store, {'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata'}).o;
                      adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/changeDate';
                      adminTriple.o = modifiedDateString;
                      adminTriple.otype = 'literal';
                      bfeditor.bfestore.store.push(adminTriple);
                    }
                  }

                  save_json.status = 'published';
                  save_json.objid = 'loc.natlib.instances.' + save_json.name + '0001';

                  var lccns = _.where(_.where(bfeditor.bfestore.store, {s: _.where(bfeditor.bfestore.store, {o: 'http://id.loc.gov/ontologies/bibframe/Lccn'})[0].s}), {p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'});

                  if (!_.isEmpty(lccns)) {
                    for (i = 0; i < lccns.length; i++) {
                      if (!lccns[i].o.trim().startsWith('n')) {
                        save_json.lccn = lccns[i].o.trim();
                        save_json.objid = 'loc.natlib.instances.e' + save_json.lccn + '0001';
                      }
                    }
                  }

                  save_json.rdf = bfeditor.bfestore.store2jsonldExpanded();
                  editorconfig.publish.callback(save_json, rdfxml, bfeditor.bfestore.name, bfelog, function (published, publish_name) {
                    console.log('Publish:' + published + ' ' + publish_name);
                  });
                //});
              } else {
                // title required
                $messagediv = $('<div>', {id: 'bfeditor-messagediv', class: 'col-md-10 main'});
                $messagediv.append('<div class="alert alert-error"><strong>No title found:</strong><a href=' + bfeditor.bfestore.url + '>' + mintResource(bfeditor.bfestore.name) + '</a></div>');
                $messagediv.insertBefore('.tabs');
              }
            } else {
              // save disabled
              $('#bfeditor-formdiv').empty();
              $('[href=#browse]').tab('show');
              bfeditor.bfestore.store = [];
              $('#table_id').DataTable().ajax.reload();

              $messagediv.append('<span class="str"><h3>Publishing disabled</h3></span>');
              $('#bfeditor-formdiv').append($messagediv);
            }
          });

          $('#bfeditor-formdiv').hide();
          $bfeditor.append($preview);
        });
        $('#bfeditor-exitpreview', form.form).attr('tabindex', tabIndices++);

        $('#bfeditor-formdiv').html('');
        $('#bfeditor-formdiv').append(form.form);
        $('#bfeditor-debug').html(JSON.stringify(bfeditor.bfestore.store, undefined, ' '));
        $('#bfeditor-debug').html(JSON.stringify(bfelog.getLog(), undefined, ' '));

        // set state to edit
        bfeditor.bfestore.state = 'edit';
      }
    }
  }

  function menuSelect (spid) {
    // store = new rdfstore.Store();
    var spnums = spid.replace('sp-', '').split('_');
    var spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
    addedProperties = [];

    bfeditor.bfestore.store = [];
    bfeditor.bfestore.name = guid();
    bfeditor.bfestore.created = new Date().toUTCString();
    bfeditor.bfestore.url = config.url + '/verso/api/bfs?filter=%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D';
    bfeditor.bfestore.state = 'create';
    loadtemplatesCounter = 0;
    loadtemplatesCount = spoints.useResourceTemplates.length;
    var loadtemplates = [];

    spoints.useResourceTemplates.forEach(function (l) {
      var useguid = guid();
      var loadtemplate = {};
      var tempstore = [];
      loadtemplate.templateGUID = useguid;
      loadtemplate.resourceTemplateID = l;
      // loadtemplate.resourceURI = whichrt(loadtemplate, editorconfig.baseURI) + loadTemplate.templateGUID;//editorconfig.baseURI + useguid;
      loadtemplate.embedType = 'page';
      loadtemplate.data = tempstore;
      loadtemplates.push(loadtemplate);
      // cbLoadTemplates();
    });

    bfeditor.bfestore.loadtemplates = loadtemplates;

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
  function getForm (loadTemplates, pt) {
    var rt, property;

    // Create the form object.
    var fguid = guid();
    var fobject = {};
    fobject.id = fguid;
    fobject.store = [];
    fobject.resourceTemplates = [];
    fobject.resourceTemplateIDs = [];
    fobject.formTemplates = [];

    // Load up the requested templates, add seed data.
    for (var urt = 0; urt < loadTemplates.length; urt++) {
      rt = _.where(resourceTemplates, {
        'id': loadTemplates[urt].resourceTemplateID
      });
      if (rt !== undefined && rt[0] !== undefined) {
        fobject.resourceTemplates[urt] = JSON.parse(JSON.stringify(rt[0]));
        // console.log(loadTemplates[urt]);
        fobject.resourceTemplates[urt].data = loadTemplates[urt].data;
        fobject.resourceTemplates[urt].defaulturi = loadTemplates[urt].resourceURI;
        fobject.resourceTemplates[urt].useguid = loadTemplates[urt].templateGUID;
        fobject.resourceTemplates[urt].embedType = loadTemplates[urt].embedType;
        // We need to make sure this resourceTemplate has a defaulturi
        if (fobject.resourceTemplates[urt].defaulturi === undefined) {
          // fobject.resourceTemplates[urt].defaulturi = whichrt(fobject.resourceTemplates[urt], editorconfig.baseURI) + shortUUID(loadTemplates[urt].templateGUID);
          whichrt(fobject.resourceTemplates[urt], editorconfig.baseURI,
            function (baseuri) {
              var worklist = _.filter(bfeditor.bfestore.store, function (s) { return s.s.indexOf(baseuri) !== -1; });
              if (!_.isEmpty(worklist)) {
                // check for type
                var rtType = _.where(worklist, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: fobject.resourceTemplates[urt].resourceURI});
                if (!_.isEmpty(rtType)) {
                  fobject.resourceTemplates[urt].defaulturi = rtType[0].s;
                } else {
                  // find uniq s, and look for one that has no o.

                  var rt = fobject.resourceTemplates[urt];
                  // add type
                  var triple = {};
                  triple.guid = rt.useguid;
                  triple.rtID = rt.id;
                  triple.s = worklist[0].s;
                  triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
                  triple.o = rt.resourceURI;
                  triple.otype = 'uri';
                  // fobject.store.push(triple);
                  bfestore.addTriple(triple);

                  fobject.resourceTemplates[urt].defaulturi = triple.s;
                }
              } else {
                fobject.resourceTemplates[urt].defaulturi = baseuri + mintResource(loadTemplates[urt].templateGUID);
              }
            });
        } else {
          // fobject.resourceTemplates[urt].defaulturi = whichrt(fobject.resourceTemplates[urt], editorconfig.baseURI) + loadTemplates[urt].templateGUID;
        }

        fobject.resourceTemplateIDs[urt] = rt[0].id;
      } else {
        bfelog.addMsg(new Error(), 'WARN', 'Unable to locate resourceTemplate. Verify the resourceTemplate ID is correct.');
      }
    }

    // Let's create the form
    var form = $('<form>', {
      id: 'bfeditor-form-' + fobject.id,
      class: 'form-horizontal',
      role: 'form'
    });
    var forEachFirst = true;
    if (pt) {
      fobject.resourceTemplates[0].propertyTemplates = pt;
    }

    fobject.resourceTemplates.forEach(function (rt) {
      bfelog.addMsg(new Error(), 'DEBUG', 'Creating form for: ' + rt.id, rt);
      var $resourcediv = $('<div>', {
        id: rt.useguid,
        'data-uri': rt.defaulturi
      }); // is data-uri used?
      
      // create a popover box to display resource ID of the thing.
      var $resourcedivheading = $('<h4>' + rt.resourceLabel + ' </h4>');
      if (rt.defaulturi.match(/^http/)) {
        var rid = rt.defaulturi;
        var $resourceInfo = $('<a><span class="glyphicon glyphicon-info-sign"></span></a>');
        $resourceInfo.attr('data-content', rid);
        $resourceInfo.attr('data-toggle','popover');
        $resourceInfo.attr('title','Resource ID');
        $resourceInfo.attr('id','resource-id-popover');
        $resourceInfo.popover({ trigger: "click hover" });
        $resourcedivheading.append($resourceInfo);
      }
      
      // create an empty clone button
      var $clonebutton = $('<button type="button" class="pull-right btn btn-primary" data-toggle="modal" data-target="#clone-input"><span class="glyphicon glyphicon-duplicate"></span></button>');

      // populate the clone button for Instance or Work descriptions
      if (rt.id.match(/:Instance$/i)) {
        $clonebutton.attr('id','clone-instance');
        $clonebutton.text(' Clone Instance');
        $clonebutton.data({'match':'instances','label':'Instance'});
      } else if (rt.id.match(/:Work$/i)) {
        $clonebutton.attr('id','clone-work');
        $clonebutton.text(' Clone Work');
        $clonebutton.data({'match':'works','label':'Work'});
      }

      // append to the resource heading if there is a clone button id and is not a modal window      
      if ($clonebutton.attr('id') && rt.embedType != 'modal') {
        var newid = mintResource(guid());
        $resourcedivheading.append($clonebutton);
        
        // ask user to input custom id
        $cloneinput = $('\
          <div id="clone-input" class="modal" tabindex="-1" role="dialog">\
            <div class="modal-dialog" role="document">\
              <div class="modal-content">\
                <div class="modal-header">\
                  <h4 class="modal-title">Clone ' + $clonebutton.data('label') + '</h4>\
                  <!-- <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button> -->\
                </div>\
                <div class="modal-body">\
                    <div class="input-group col-xs-12">\
                      <span class="input-group-addon">New Resource ID:</span>\
                      <input type="text" class="form-control" id="resource-id" value="' + newid + '">\
                      <span class="input-group-btn">\
                        <button class="btn btn-default" type="button" id="clear-id">Clear</button>\
                      </span>\
                    </div>\
                </div>\
                <div class="modal-footer">\
                  <button type="button" class="btn btn-primary" id="clone-save">Save</button>\
                  <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>\
                </div>\
              </div>\
            </div>\
          </div>');
        $resourcediv.append($cloneinput);
      }

      // append to the resource div
      $resourcediv.append($resourcedivheading);
      $resourcediv.find('#clear-id').click(function() {
        $('#resource-id').attr('value','');
        $('#resource-id').focus();
      });
      // the cloning starts here if clone button is clicked
      $resourcediv.find('#clone-save').click(function() {
        var rid = $('#resource-id').attr('value');
        $('#clone-input').modal('hide');
        var $msgnode = $('<div>', {id: "bfeditor-messagediv"});
        var olduri = rt.defaulturi;

        bfeditor.bfestore.name = guid();  // verso save name
        // var rid = mintResource(guid()); // new resource id
        var ctype = $clonebutton.data('label'); // get label for alert message
        var re = RegExp('(/' + $clonebutton.data('match') + '/)[^/]+?(#.+$|$)'); // match on part of uri ie. /works/ or /instances/

        // change all subjects in the triple store that match /instances/ or /works/ and assign new resource id
        bfeditor.bfestore.store.forEach( function(trip) {
          trip.s = trip.s.replace(re, "$1" + rid + "$2");
          trip.o = trip.o.replace(re, "$1" + rid + "$2");
        });

        // reload the newly created templage
        cbLoadTemplates();

        // start checking for errors (basically check for remnants of old resource IDs)
        var errs = 0;
        bfeditor.bfestore.store.forEach( function(trip) {
          if (trip.s == olduri) {        
             errs++;
          }
        });
        if (errs > 0) {
          $msgnode.append('<div class="alert alert-danger">Old ' + ctype + ' URIs found in cloned description. Clone failed!<button type="button" class="close" data-dismiss="alert"><span>&times; </span></button></div>');
        } else {         
          $msgnode.append('<div class="alert alert-info">' + ctype + ' cloned as ' + rid + '<button type="button" class="close" data-dismiss="alert"><span>&times; </span></button></div>');
        } 
        $msgnode.insertBefore('.nav-tabs');   
      });

      var $formgroup = $('<div>', {
        class: 'form-group row'
      });
      var $saves = $('<div class="form-group row"><div class="btn-toolbar col-sm-12" role="toolbar"></div></div></div>');
      // var $label = $('<label for="' + rt.useguid + '" class="col-sm-3 control-label" title="'+ rt.defaulturi + '">Set label?</label>');
      var $resourceinput = $('<div class="col-sm-6"><input type="text" class="form-control" id="' + rt.useguid + '" placeholder="' + rt.defaulturi + '" tabindex="' + tabIndices++ + '"></div>');
      var $button = $('<div class="btn-group btn-group-md span1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">&#10133;</button></div>');
      var $linkbutton = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">&#x1f517;</button></div>');
      var $linkmodal = $('<div class="modal fade" id="linkmodal' + rt.useguid + '" role="dialog"><div class="modal-dialog"><div class="modal-content"> \
      <div class="modal-header"><button type="button" class="close" data-dismiss="modal">x</button><h4 class="modal-title">Link</h4></div> \
      <div class="modal-body">' + rt.defaulturi + '</div></div></div></div>');

      $button.click(function () {
        setRtLabel(fobject.id, rt.useguid, rt.useguid + ' input', rt);
      });

      $linkbutton.click(function () {
        $('#bfeditor').append($linkmodal);
        $('#linkmodal' + rt.useguid).modal();
        $('#linkmodal' + rt.useguid).on('show.bs.modal', function (event) {
          $(this).css('z-index', 10000);
        });
      });

      var enterHandler = function (event) {
        if (event.keyCode == 13) {
          setRtLabel(fobject.id, rt.useguid, property.guid);
          if ($('#' + property.guid).parent().parent().next().find("input:not('.tt-hint')").length) {
            $('#' + property.guid).parent().parent().next().find("input:not('.tt-hint')").focus();
          } else {
            $('[id^=bfeditor-modalSave]').focus();
          }
        }
      };

      $resourceinput.keyup(enterHandler);
      $resourceinput.append($saves);
      $resourcediv.append($formgroup);
      var addPropsUsed = {};
      if (addedProperties !== undefined && rt.embedType == 'page' && !pt) {
        addedProperties.forEach(function(adata) {
          rt.propertyTemplates.push(adata);
        });
      }

      rt.propertyTemplates.forEach(function (property) {
        // Each property needs to be uniquely identified, separate from
        // the resourceTemplate.
        var pguid = guid();
        property.guid = pguid;
        property.display = 'true';
        addPropsUsed[property.propertyURI] = 1;

        var $formgroup = $('<div>', {
          class: 'form-group row'
        });
        var $saves = $('<div class="form-group row"><div class="btn-toolbar col-sm-12" role="toolbar"></div></div></div>');
        var $label = $('<label for="' + property.guid + '" class="col-sm-3 control-label" title="' + property.remark + '">' + property.propertyLabel + '</label>');

        if ((/^http/).test(property.remark)) {
          $label = $('<label for="' + property.guid + '" class="col-sm-3 control-label" title="' + property.remark + '"><a href="' + property.remark + '" target="_blank">' + property.propertyLabel + '</a></label>');
        }
        var $input;
        var $button;

        if (property.type == 'literal') {
          $input = $('<div class="col-sm-8"><input type="text" class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');

          $input.find('input').keyup(function (e) {
            if (e.keyCode == 54 && e.ctrlKey && e.altKey) {
              var text = this.value;
              this.value = text + '\u00A9';
            } else if (e.keyCode == 53 && e.ctrlKey && e.altKey) {
              this.value = this.value + '\u2117';
            }
          });

          $button = $('<div class="btn-group btn-group-md span1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">&#10133;</button></div>');

          $button.click(function () {
            setLiteral(fobject.id, rt.useguid, property.guid);
          });

          var enterHandler = function (event) {
            if (event.keyCode == 13) {
              setLiteral(fobject.id, rt.useguid, property.guid);
              if ($('#' + property.guid).parent().parent().next().find("input:not('.tt-hint')").length) {
                $('#' + property.guid).parent().parent().next().find("input:not('.tt-hint')").focus();
              } else {
                $('[id^=bfeditor-modalSave]').focus();
              }
            }
          };

          $input.keyup(enterHandler);

          $formgroup.append($label);
          $input.append($saves);
          $formgroup.append($input);
          $formgroup.append($button);
          // $formgroup.append($saves);
        }

        if (property.type === 'resource' || property.type === 'lookup' || property.type === 'target') {
          if (_.has(property, 'valueConstraint')) {
            if (_.has(property.valueConstraint, 'valueTemplateRefs') && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
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
              var $buttondiv = $('<div class="col-sm-8" id="' + property.guid + '"></div>');
              var $buttongrp = $('<div class="btn-group btn-group-md"></div>');
              var vtRefs = property.valueConstraint.valueTemplateRefs;
              for (var v = 0; v < vtRefs.length; v++) {
                var vtrs = vtRefs[v];
                var valueTemplates = _.where(resourceTemplates, {
                  'id': vtrs
                });
                if (valueTemplates[0] !== undefined) {
                  var vt = valueTemplates[0];
                  // console.log(vt);
                  var $b = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">' + vt.resourceLabel + '</button>');

                  var fid = fobject.id;
                  var rtid = rt.useguid;
                  var pid = property.guid;
                  // var mintedURI = editorconfig.baseURI + "resources/" + mintResource(guid());
                  var newResourceURI = '_:bnode' + shortUUID(guid());
                  $b.click({
                    fobjectid: fid,
                    newResourceURI: newResourceURI,
                    propertyguid: pid,
                    template: vt
                  }, function (event) {
                    // console.log(event.data.template);
                    var theNewResourceURI = '_:bnode' + shortUUID(guid());
                    // openModal(event.data.fobjectid, event.data.template, event.data.newResourceURI, event.data.propertyguid, []);
                    openModal(event.data.fobjectid, event.data.template, theNewResourceURI, event.data.propertyguid, []);
                  });
                  $buttongrp.append($b);
                }
              }
              $buttondiv.append($buttongrp);

              $formgroup.append($label);
              $buttondiv.append($saves);
              $formgroup.append($buttondiv);
              // $formgroup.append($saves);
            } else if (_.has(property.valueConstraint, 'useValuesFrom')) {
              // Let's supress the lookup unless it is in a modal for now.
              if (rt.embedType != 'modal' && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                forEachFirst = false;
                return;
              }

              var $inputdiv = $('<div class="col-sm-8"></div>');
              $input = $('<input type="text" class="typeahead form-control" data-propertyguid="' + property.guid + '" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '">');
              var $input_page = $('<input type="hidden" id="' + property.guid + '_page" class="typeaheadpage" value="1">');

              $inputdiv.append($input);
              $inputdiv.append($input_page);

              $input.on('focus', function () {
                if ($(this).val() === '') // you can also check for minLength
                { $(this).data().ttTypeahead.input.trigger('queryChanged', ''); }
              });

              $formgroup.append($label);
              $inputdiv.append($saves);
              $formgroup.append($inputdiv);
              // formgroup.append(button);
              // $formgroup.append($saves);

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

              if (rt.embedType == 'modal' && forEachFirst && property.propertyLabel.match(/lookup/i)) {
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
              $input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');

              $button = $('<div class="col-sm-1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button></div>');
              $button.click(function () {
                setResourceFromLabel(fobject.id, rt.useguid, property.guid);
              });

              $formgroup.append($label);
              $input.append($saves);
              $formgroup.append($input);
              $formgroup.append($button);
              // $formgroup.append($saves);
            }
          } else {
            // Type is resource, so should be a URI, but there is
            // no constraint for it so just create a label field.
            $input = $('<div class="col-sm-8"><input class="form-control" id="' + property.guid + '" placeholder="' + property.propertyLabel + '" tabindex="' + tabIndices++ + '"></div>');

            $button = $('<div class="col-sm-1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">Set</button></div>');
            $button.click(function () {
              setResourceFromLabel(fobject.id, rt.useguid, property.guid);
            });

            $formgroup.append($label);
            $input.append($saves);
            $formgroup.append($input);
            $formgroup.append($button);
            // $formgroup.append($saves);
          }       
        }
        
        $resourcediv.append($formgroup);
        forEachFirst = false;
      });
      // starting the "add property" stuff here
      if (rt.embedType == 'page') {
        var substringMatcher = function(strs) {
          return function findMatches(q, cb) {
            var matches, substrRegex;
            matches = [];
            substrRegex = new RegExp(q, 'i');
            $.each(strs, function(i, str) {
                if (substrRegex.test(str.propertyLabel) && !addPropsUsed[str.propertyURI]) {
                  matches.push({value: i});
                }
            });
            // console.log(matches);
            cb(matches);
          };
        };
        $addpropdata = $('<div>', { class: 'col-sm-8' });
        $addpropinput = $('<input>', { id: 'addproperty', type: 'text', class: 'form-control', placeholder: 'Type for suggestions' });
        $addpropinput.appendTo($addpropdata).typeahead(
          {
            highlight: true,        
          },
          {
            name: 'resources',
            displayKey: 'value',
            source: substringMatcher(addFields),
          }
        ).on('typeahead:selected', function (e, suggestion) {
          var newproperty = addFields[suggestion.value];
          console.log(newproperty);
          newproperty.display = 'true';
          newproperty.guid = guid();
          rt.propertyTemplates.push(newproperty);
          addedProperties.push(newproperty);
          cbLoadTemplates(rt.propertyTemplates);       
        });
        $addproplabel = $('<label class="col-sm-3 control-label">Add Property</label>');
        $addprop = $('<div>', { class: 'form-group row' });
        $addprop.append($addproplabel);
        $addprop.append($addpropdata);
        $resourcediv.append($addprop);
      }
      form.append($resourcediv);
    });

    // OK now we need to populate the form with data, if appropriate.
    fobject.resourceTemplates.forEach(function (rt) {
      // check for match...maybe do this earlier

      if (_.where(bfestore.store, {
        'o': rt.resourceURI
      }).length > 0) {
        //		if(_.where(bfestore.store,{"o":rt.resourceURI}).length > 1) {
        if (bfestore.state !== 'edit') {
          _.where(bfestore.store, {
            'o': rt.resourceURI
          }).forEach(function (triple) {
            if (_.where(bfestore.store, {
              'o': triple.s
            }).length === 0) {
              console.log(triple.s);
              rt.defaulturi = triple.s;
            }
          });
        } else {
          _.where(bfestore.store, {
            's': rt.defaulturi,
            'o': rt.resourceURI
          }).forEach(function (triple) {
            if (_.where(bfestore.store, {
              'o': triple.s
            }).length === 0) {
              console.log(triple.s);
              rt.defaulturi = triple.s;
            }
          });
        }
        //		} else {
        //                rt.defaulturi =  _.where(bfestore.store,{"o":rt.resourceURI})[0].s;
        //		}
      }
      var triple = {};
      if (bfestore.state !== 'create' && rt.data.length === 0 && _.where(bfestore.store, {
        's': rt.defaulturi,
        'o': rt.resourceURI
      }).length === 0) {
        // Assume a fresh form, no pre-loaded data.
        var id = guid();

        // var uri;
        // var uri = editorconfig.baseURI + rt.useguid;
        if (rt.defaulturi !== undefined && rt.defaulturi !== '') {
          fobject.defaulturi = rt.defaulturi;
        } else {
          fobject.defaulturi = editorconfig.baseURI + rt.useguid;
        }

        if (bfestore.state === 'edit' && _.some(bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': rt.resourceURI})) {
          // match the rt to the type triple
          triple = _.find(bfestore.store, {'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': rt.resourceURI});
          rt.defaulturi = triple.o;
          rt.guid = triple.guid;
          triple.rtID = rt.id;
        } else {
          triple = {};
          triple.guid = rt.useguid;
          triple.rtID = rt.id;
          triple.s = fobject.defaulturi;
          triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
          triple.o = rt.resourceURI;
          triple.otype = 'uri';
          fobject.store.push(triple);

          bfestore.addTriple(triple);
          // bfestore.store.push(triple);
          rt.guid = rt.useguid;
        }
        rt.propertyTemplates.forEach(function (property) {
          if (_.has(property, 'valueConstraint')) {
            if (_.has(property.valueConstraint, 'valueTemplateRefs') && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
              var vtRefs = property.valueConstraint.valueTemplateRefs;
              for (var v = 0; v < vtRefs.length; v++) {
                var vtrs = vtRefs[v];
                // console.log(rt.resourceURI);
                // console.log(property.propertyURI);
                // console.log(vtrs);
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
                if (fobject.resourceTemplateIDs.indexOf(vtrs) > -1 && vtrs != rt.id) {
                  var relatedTemplates = _.where(bfestore.store, {
                    rtID: vtrs
                  });
                  triple = {};
                  triple.guid = guid();
                  triple.s = uri;
                  triple.p = property.propertyURI;
                  triple.o = relatedTemplates[0].s;
                  triple.otype = 'uri';
                  fobject.store.push(triple);
                  console.log('3');
                  bfestore.addTriple(triple);
                  // bfestore.store.push(triple);
                  property.display = 'false';
                }
              }
            }
          }
        });
      } else {
        fobject.defaulturi = rt.defaulturi;
        // the rt needs a type
        if (bfestore.state === 'create') {
          triple = {};
          triple.guid = rt.useguid;
          triple.rtID = rt.id;
          triple.s = rt.defaulturi;
          triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
          triple.o = rt.resourceURI;
          triple.otype = 'uri';
          fobject.store.push(triple);
          console.log('4');
          bfestore.addTriple(triple);
          rt.guid = rt.useguid;
        }

        // This will likely be insufficient - we'll need the entire
        // pre-loaded store in this 'first' form.
        rt.data.forEach(function (t) {
          var triple = {};
          triple = t;
          if (triple.guid === undefined) {
            triple.guid = guid();
          }
          fobject.store.push(triple);
        });
      }

      // Populate form with pre-loaded data.
      bfelog.addMsg(new Error(), 'DEBUG', 'Populating form with pre-loaded data, if any');
      rt.propertyTemplates.forEach(function (property) {
        preloadData(property, rt, form, fobject);
      });
    });

    forms.push(fobject);

    bfelog.addMsg(new Error(), 'DEBUG', 'Newly created formobject.', fobject);
    return {
      formobject: fobject,
      form: form
    };
  }

  function preloadData (property, rt, form, fobject) {

    var propsdata = _.where(bfestore.store, {
      's': rt.defaulturi,
      'p': property.propertyURI
    });

    if (propsdata.length === 0) {
      // propsdata = _.where(bfestore.store, {"p":property.propertyURI});
    }

    if (propsdata.length > 0) {
      // find the right one
      if (property.valueConstraint.valueTemplateRefs[0] !== undefined) {
        var parent = _.find(bfeditor.profiles, function (post) {
          for (var i = 0; i < property.valueConstraint.valueTemplateRefs.length; i++) {
            if (_.some(post.Profile.resourceTemplates, {id: property.valueConstraint.valueTemplateRefs[i]}))
            //                            return _.find(post.Profile.resourceTemplates, {id: property.valueConstraint.valueTemplateRefs[i]})
            { return post; }
          }
        });

        if (parent !== undefined) {
          var parent_nodes = [];
          for (var i = 0; i < property.valueConstraint.valueTemplateRefs.length; i++) {
            if (_.some(parent.Profile.resourceTemplates, {id: property.valueConstraint.valueTemplateRefs[i]})) {
              var node_uri = _.find(parent.Profile.resourceTemplates, {id: property.valueConstraint.valueTemplateRefs[i]}).resourceURI;
              if (_.some(bfestore.store, {o: node_uri})) {
                parent_nodes.push(_.find(bfestore.store, {o: node_uri}));
              }
            }
          }
          var tempprops = [];
          if (!_.isEmpty(parent_nodes)) {
            for (var j = 0; j < parent_nodes.length; j++) {
              // we only want the properties that have the subject which matches the parent node's characteristics
              bnodes = _.where(bfestore.store, {p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: parent_nodes[j].o});

              for (var k = 0; k < propsdata.length; k++) {
                if (_.some(bnodes, {s: propsdata[k].o})) {
                  tempprops.push(propsdata[k]);
                }
              }
            }
            propsdata = tempprops;
          } else if (bfestore.state === 'loaduri' && propsdata[0].o.startsWith('http://id.loc.gov/resources/works')) {
            // try with id.loc.gov
            // var tempuri = rt.defaulturi.replace("mlvlp04.loc.gov:8230", "id.loc.gov");
            var triple = {};
            triple.s = propsdata[0].s;
            triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
            triple.o = 'http://id.loc.gov/ontologies/bibframe/Work';
            triple.otype = 'uri';
            triple.guid = guid();

            bfestore.addTriple(triple);
            tempprops = [];
            tempprops.push(triple);
            propsdata = tempprops;
          } else {
            // skip this one
            propsdata = [];
          }
        }
      }
    }

    if (propsdata[0] === undefined) {
      // log the resulttry again
      // console.log(property.propertyURI + ' not matched.');
    }
    if (propsdata[0] !== undefined) {
      // If this property exists for this resource in the pre-loaded data
      // then we need to make it appear.
      bfelog.addMsg(new Error(), 'DEBUG', 'Found pre-loaded data for ' + property.propertyURI);

      if (fobject.resourceTemplates[0].defaulturi.startsWith('_:bnode')) {
        if (_.some(propsdata, {'s': fobject.resourceTemplates[0].defaulturi})) {
          propsdata.forEach(function (pd) {
            loadPropsdata(pd, property, form, fobject);
          });
        } else {
          console.log('bnode not matched');
        }
      } else {
        propsdata.forEach(function (pd) {
          loadPropsdata(pd, property, form, fobject);
        });
      }
    } else if (_.has(property, 'valueConstraint') && (!_.isEmpty(property.valueConstraint.defaultURI) || !_.isEmpty(property.valueConstraint.defaultLiteral))) {
      // Otherwise - if the property is not found in the pre-loaded data
      // then do we have a default value?
      var data;
      if (_.has(property.valueConstraint, 'defaultURI') && !_.isEmpty(property.valueConstraint.defaultURI)) {
        data = property.valueConstraint.defaultURI;
      }

      if (data) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Setting default data for ' + property.propertyURI);

        // is there a type?
        if (_.has(property.valueConstraint.valueDataType, 'dataTypeURI')) {
          var typeTriple = {};
          typeTriple.guid = guid();
          typeTriple.s = data;
          typeTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
          typeTriple.o = property.valueConstraint.valueDataType.dataTypeURI;
          typeTriple.otype = 'uri';
          fobject.store.push(typeTriple);
          // bfestore.addTriple(typeTriple);
        }

        data = property.valueConstraint.defaultURI;
        // set the triples
        var triple = {};
        triple.guid = guid();
        if (rt.defaulturi !== undefined && rt.defaulturi !== '') {
          triple.s = rt.defaulturi;
        } else {
          triple.s = editorconfig.baseURI + rt.useguid;
        }
        triple.p = property.propertyURI;
        triple.o = data;
        triple.otype = 'uri';
        fobject.store.push(triple);
        //                bfestore.addTriple(triple);
      }
      // set the label
      var label = {};
      if (triple) {
        label.s = triple.o;
        displayguid = triple.guid;
      } else {
        label.s = rt.defaulturi;
        displayguid = guid();
      }

      label.otype = 'literal';
      label.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      label.o = property.valueConstraint.defaultLiteral;

      fobject.store.push(label);
      // bfestore.addTriple(label);

      // set the form
      var $formgroup = $('#' + property.guid, form).closest('.form-group');
      var $save = $formgroup.find('.btn-toolbar').eq(0);

      var displaydata = '';
      if (_.has(property.valueConstraint, 'defaultLiteral')) {
        displaydata = property.valueConstraint.defaultLiteral;
      }
      // displaydata = display;
      var editable = true;
      if (property.valueConstraint.editable !== undefined && property.valueConstraint.editable === 'false') {
        editable = false;
      }
      var bgvars = {
        'tguid': displayguid,
        'tlabelhover': displaydata,
        'tlabel': displaydata,
        'fobjectid': fobject.id,
        'inputid': property.guid,
        'editable': editable,
        'triples': [label]
      };
      var $buttongroup = editDeleteButtonGroup(bgvars);
      $save.append($buttongroup);

      if (property.repeatable === 'false' || property.valueConstraint.repeatable == 'false') {
        var $el = $('#' + property.guid, form);
        if ($el.is('input')) {
          $el.prop('disabled', true);
        } else {
          // console.log(property.propertyLabel);
          var $buttons = $('div.btn-group', $el).find('button');
          $buttons.each(function () {
            $(this).prop('disabled', true);
          });
        }
      }
    }
  }

  function loadPropsdata (pd, property, form, fobject) {
    var $formgroup = $('#' + property.guid, form).closest('.form-group');
    var $save = $formgroup.find('.btn-toolbar').eq(0);
    // console.log(formgroup);
    var displaydata = '';
    var triples = [];
    // console.log("pd.otype is " + pd.otype);
    var hasTemplate = true;

    if (_.find(bfestore.store, {
      s: pd.o,
      p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    })) {
      var propsTemplateIds = _.where(resourceTemplates, {
        resourceURI: _.find(bfestore.store, {
          s: pd.o,
          p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        }).o
      });
    }

    if (propsTemplateIds !== undefined && !_.isEmpty(propsTemplateIds) && bfestore.state !== 'edit') {
      // if (_.indexOf(property.valueConstraint.valueTemplateRefs, propsTemplateId) < 0)
      var found = false;
      property.valueConstraint.valueTemplateRefs.forEach(function (valueTemplateId) {
        if (_.some(propsTemplateIds, {
          id: valueTemplateId
        })) {
          console.log(property.propertyLabel + ' accepts ' + valueTemplateId);
          found = true;
        }
      });
      if (!found) {
        console.log(property.propertyLabel + ' did not match' + pd.o);
        hasTemplate = false;
      }
    }

    if (pd.otype == 'uri' && hasTemplate) {
      // _.find(resourceTemplates, {resourceURI: _.find(bfestore.store, {s:pd.o, p:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}).o}).id

      triples = _.where(bfestore.store, {
        's': pd.o
      });
      // displaydata = pd.o;
      // console.log("displaydata is " + displaydata);
      var rtype = '';
      var rparent = '';
      // var fparent = fobject.resourceTemplates[0].defaulturi;
      if (triples.length > 0) {
        triples.forEach(function (t) {
          if (rtype === '' && t.p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            rtype = t.o;
            rparent = t.s;
          }
          // if "type" matches a resourceTemplate.resourceURI && one of the property.valueConstraint.templates equals that resource template id....
          var triplesResourceTemplateID = '';
          if (rtype !== '') {
            if (_.has(property, 'valueConstraint')) {
              if (_.has(property.valueConstraint, 'valueTemplateRefs') && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
                var resourceTs = _.where(resourceTemplates, {
                  'resourceURI': rtype
                });
                // console.log("Found resourcetemplates for " + rtype);
                // console.log(resourceTs);
                resourceTs.forEach(function (r) {
                  // console.log("Looking for a match with " + r.id);
                  if (triplesResourceTemplateID === '' && _.indexOf(property.valueConstraint.valueTemplateRefs, r.id) !== -1) {
                    bfelog.addMsg(new Error(), 'DEBUG', 'Assocating one resource with another from loaded templates');
                    // console.log("Found a match in");
                    // console.log(property.valueConstraint.valueTemplateRefs);
                    // console.log("Associating " + r.id);
                    triplesResourceTemplateID = r.id;
                    t.rtID = r.id;
                  }
                });
              }
            }
          }

          fobject.store.push(t);
          var labeldata = _.where(bfestore.store, {
            's': pd.o
          });

          if (t.p.match(/label/i)) {
            displaydata = t.o;
          } else if (labeldata.length > 0) {
            var tpreflabel;

            if (t.otype === 'uri') {
              var tsearch = t.o;
              if (t.p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
                tsearch = t.s;
              }
              if (!tsearch.startsWith('_:b')) {
                whichLabel(tsearch, function (label) {
                  console.log(label);
                  tpreflabel = label;
                });
              }
            }

            if (tpreflabel !== undefined) {
              displaydata = tpreflabel;
            } else {
              var tauthlabel = _.find(labeldata, {
                p: 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
              });
              var tlabel = _.find(labeldata, {
                p: 'http://www.w3.org/2000/01/rdf-schema#label'
              });
              var tvalue = _.find(labeldata, {
                p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'
              });
              var tmainTitle = _.find(labeldata, {
                p: 'http://id.loc.gov/ontologies/bibframe/mainTitle'
              });

              if (tpreflabel !== undefined) {
                displaydata = tpreflabel;
              } else if (tauthlabel !== undefined) {
                displaydata = tauthlabel.o;
              } else if (tlabel !== undefined) {
                displaydata = tlabel.o;
              } else if (tmainTitle !== undefined) {
                displaydata = tmainTitle.o;
              } else if (tvalue !== undefined) {
                if (tvalue.o.startsWith('http')) {
                  whichLabel(tvalue.o, function (label) {
                    console.log(label);
                    displaydata = label;
                  });
                } else {
                  var qualifier = _.find(labeldata, {
                    s: tvalue.s,
                    p: 'http://id.loc.gov/ontologies/bibframe/qualifier'
                  });
                  if (!_.isEmpty(qualifier) && !_.isEmpty(qualifier.o)) {
                    displaydata = tvalue.o + ' ' + qualifier.o;
                  } else {
                    displaydata = tvalue.o;
                  }
                }
              } else {
                displaydata = _.last(property.propertyURI.split('/'));
                var agent;
                var role;
                var placeLabel, agentLabel, dateLabel;
                if (displaydata === 'contribution') {
                  // lookup agent and role;
                  role = _.find(labeldata, {
                    'p': 'http://id.loc.gov/ontologies/bibframe/role'
                  });
                  agent = _.find(labeldata, {
                    'p': 'http://id.loc.gov/ontologies/bibframe/agent'
                  });

                  if (!_.isEmpty(agent)) {
                    if (agent.o.match(/#Agent/) || agent.o.startsWith('_:b')) {
                      agentLabel = _.find(bfeditor.bfestore.store, {
                        's': agent.o,
                        'p': 'http://www.w3.org/2000/01/rdf-schema#label'
                      });

                      if (!_.isEmpty(agentLabel)) {
                        displaydata = agentLabel.o;
                      }
                    } else {
                      // try looking up
                      whichLabel(agent.o, function (label) {
                        if (!_.isEmpty(label)) { displaydata = label; }
                      });
                    }
                  }
                  if (!_.isEmpty(role)) {
                    whichLabel(role.o, function (label) {
                      if (!_.isEmpty(label) && displaydata !== 'contribution') { displaydata = displaydata + ', ' + label; }
                    });
                  }
                } else if (displaydata === 'classification') {
                  if (_.some(labeldata, {
                    'p': 'http://id.loc.gov/ontologies/bibframe/classificationPortion'
                  })) {
                    displaydata = _.find(labeldata, {
                      'p': 'http://id.loc.gov/ontologies/bibframe/classificationPortion'
                    }).o;
                  }
                } else if (displaydata === 'provisionActivity') {
                  var place = _.find(labeldata, {
                    'p': 'http://id.loc.gov/ontologies/bibframe/place'
                  });
                  if (!_.isEmpty(place)) {
                    if (place.o.startsWith('_:b')) {
                      placeLabel = _.find(bfestore.store, {
                        's': place.o,
                        'p': 'http://www.w3.org/2000/01/rdf-schema#label'
                      }).o;
                    } else {
                      whichLabel(place.o, function (label) {
                        placeLabel = label;
                      });
                    }
                  }
                  agent = _.find(labeldata, {
                    'p': 'http://id.loc.gov/ontologies/bibframe/agent'
                  });
                  if (!_.isEmpty(agent)) {
                    if (agent.o.startsWith('_:b')) {
                      agentLabel = _.find(bfestore.store, {
                        's': agent.o,
                        'p': 'http://www.w3.org/2000/01/rdf-schema#label'
                      }).o;
                    } else {
                      whichLabel(agent.o, function (label) {
                        agentLabel = label;
                      });
                    }
                  }

                  var date = _.find(labeldata, {
                    'p': 'http://id.loc.gov/ontologies/bibframe/date'
                  });
                  if (!_.isEmpty(date)) { dateLabel = date.o; }

                  if (!_.isEmpty(placeLabel) && !_.isEmpty(agentLabel) && !_.isEmpty(dateLabel)) {
                    displaydata = agentLabel + ': ' + placeLabel + ', ' + dateLabel;
                  } else if (!_.isEmpty(placeLabel) && !_.isEmpty(agentLabel) && _.isEmpty(dateLabel)) {
                    displaydata = agentLabel + ': ' + placeLabel;
                  } else if (_.isEmpty(placeLabel) && !_.isEmpty(agentLabel) && !_.isEmpty(dateLabel)) {
                    displaydata = agentLabel + ', ' + dateLabel;
                  } else if (!_.isEmpty(placeLabel) && _.isEmpty(agentLabel) && !_.isEmpty(dateLabel)) {
                    displaydata = placeLabel + ', ' + dateLabel;
                  }
                }
              }

              if (displaydata === undefined || _.isEmpty(displaydata)) {
                var tlabel = _.find(_.where(bfestore.store, {
                  's': labeldata[0].o
                }), {
                  p: 'http://www.w3.org/2000/01/rdf-schema#label'
                });
                var tvalue = _.find(_.where(bfestore.store, {
                  's': labeldata[0].o
                }), {
                  p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'
                });
                var tmainTitle = _.find(_.where(bfestore.store, {
                  's': labeldata[0].o
                }), {
                  p: 'http://id.loc.gov/ontologies/bibframe/mainTitle'
                });
                // nested titles
                if (_.has(bfestore.store, {
                  's': labeldata[0].s,
                  p: 'http://id.loc.gov/ontologies/bibframe/title'
                })) {
                  var workTitle = _.find(bfestore.store, {
                    's': _.where(bfestore.store, {
                      's': labeldata[0].s,
                      p: 'http://id.loc.gov/ontologies/bibframe/title'
                    })[0].o,
                    'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle'
                  });
                }
                if (tlabel !== undefined) {
                  displaydata = tlabel.o;
                } else if (tmainTitle !== undefined) {
                  displaydata = tmainTitle.o;
                } else if (tvalue !== undefined) {
                  displaydata = tvalue.o;
                } else if (tmainTitle === undefined && tlabel === undefined && tvalue === undefined && workTitle !== undefined) {
                  displaydata = workTitle.o;
                }
              }

              if (displaydata === undefined && data !== undefined && data.o !== undefined) {
                displaydata = data.o;
              }
            }
          }

          if (displaydata === '') {
            var data = _.where(labeldata, {
              'otype': 'literal'
            });
            if (data.length > 0) {
              for (var i = 0; i < data.length; i++) {
                displaydata += data[i].o + ' ';
              }
            }
          }
          displaydata.trim();
        });
      }
    } else if (hasTemplate) {
      displaydata = pd.o;
    }

    //        if (displaydata == "") {
    //            displaydata = pd.s;
    //        }

    triples.push(pd);

    if (hasTemplate) {
      var bgvars = {
        'tguid': pd.guid,
        'tlabelhover': displaydata,
        'tlabel': displaydata,
        'fobjectid': fobject.id,
        'inputid': property.guid,
        'editable': property.valueConstraint.editable,
        'triples': triples
      };
      var $buttongroup = editDeleteButtonGroup(bgvars);

      $save.append($buttongroup);
      if (property.repeatable === 'false' || property.valueConstraint.repeatable == 'false') {
        var $el = $('#' + property.guid, form);
        if ($el.is('input')) {
          $el.prop('disabled', true);
        } else {
          // console.log(property.propertyLabel);
          var $buttons = $('div.btn-group', $el).find('button');
          $buttons.each(function () {
            $(this).prop('disabled', true);
          });
        }
      }
    }
  }

  // callingformobjectid is as described
  // loadtemplate is the template objet to load.
  // resourceURI is the resourceURI to assign or to edit
  // inputID is the ID of hte DOM element within the loadtemplate form
  // triples is the base data.
  function openModal (callingformobjectid, loadtemplate, resourceURI, inputID, triples) {

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
        </div> ';

    bfelog.addMsg(new Error(), 'DEBUG', 'Opening modal for resourceURI ' + resourceURI);
    bfelog.addMsg(new Error(), 'DEBUG', 'inputID of DOM element / property when opening modal: ' + inputID);
    bfelog.addMsg(new Error(), 'DEBUG', 'callingformobjectid when opening modal: ' + callingformobjectid);

    var useguid = guid();
    var triplespassed = [];
    if (triples.length === 0) {
      // This is a fresh Modal, so we need to seed the data.
      // This happens when one is *not* editing data; it is fresh.
      var callingformobject = _.where(forms, {
        'id': callingformobjectid
      });
      callingformobject = callingformobject[0];
      callingformobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': inputID
        });
        if (properties[0] !== undefined) {
          var triplepassed = {};
          triplepassed.s = t.defaulturi;
          triplepassed.p = properties[0].propertyURI; // instanceOF
          triplepassed.o = resourceURI;
          triplepassed.otype = 'uri';
          triplespassed.push(triplepassed);

          triplepassed = {};
          triplepassed.s = resourceURI;
          triplepassed.rtID = loadtemplate.id;
          triplepassed.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
          triplepassed.o = loadtemplate.resourceURI;
          triplepassed.otype = 'uri';
          triplespassed.push(triplepassed);

          if (properties[0].propertyURI === 'http://id.loc.gov/ontologies/bibframe/adminMetadata') {
            // add name, id triples
            var mintedId = 'e' + window.ShortUUID('0123456789').fromUUID(bfeditor.bfestore.name);
            var mintedUri = config.url + '/resources/' + mintedId;
            var adminTriple = {};
            adminTriple.s = resourceURI;
            adminTriple.p = 'http://id.loc.gov/ontologies/bflc/profile';
            adminTriple.o = t.id;
            adminTriple.otype = 'literal';
            triplespassed.push(adminTriple);
            bfeditor.bfestore.store.push(adminTriple);

            adminTriple = {};
            adminTriple.s = resourceURI;
            adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/creationDate';
            var d = new Date(bfeditor.bfestore.created);
            adminTriple.o = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
            adminTriple.otype = 'literal';
            triplespassed.push(adminTriple);
            bfeditor.bfestore.store.push(adminTriple);

            adminTriple = {};
            adminTriple.s = resourceURI;
            adminTriple.p = 'http://id.loc.gov/ontologies/bibframe/identifiedBy';
            adminTriple.o = mintedUri;
            adminTriple.otype = 'uri';
            triplespassed.push(adminTriple);
            bfeditor.bfestore.store.push(adminTriple);

            adminTriple = {};
            adminTriple.s = mintedUri;
            adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
            adminTriple.o = 'http://id.loc.gov/ontologies/bibframe/Local';
            adminTriple.otype = 'uri';
            triplespassed.push(adminTriple);
            bfeditor.bfestore.store.push(adminTriple);

            adminTriple = {};
            adminTriple.s = mintedUri;
            adminTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value';
            adminTriple.o = mintedId;
            adminTriple.otype = 'literal';
            triplespassed.push(adminTriple);
            bfeditor.bfestore.store.push(adminTriple);
          }
        }
      });
    } else {
      // Just pass the triples on....
      triplespassed = triples;
    }
    bfelog.addMsg(new Error(), 'DEBUG', 'triplespassed within modal', triplespassed);
    var form = getForm([{
      templateGUID: useguid,
      resourceTemplateID: loadtemplate.id,
      resourceURI: resourceURI,
      embedType: 'modal',
      data: triplespassed
    }]);

    var m = $(modal.replace(/modalID/g, form.formobject.id));
    $(editordiv).append(m);

    $('#bfeditor-modalbody-' + form.formobject.id).append(form.form);
    $('#bfeditor-modaltitle-' + form.formobject.id).html(loadtemplate.resourceLabel);
    $('#bfeditor-form-' + form.formobject.id + ' > div > h3').remove();

    $('#bfeditor-modal-' + form.formobject.id).modal('show');
    $('#bfeditor-modalCancel-' + form.formobject.id).attr('tabindex', tabIndices++);

    $('#bfeditor-modalSave-' + form.formobject.id).click(function () {
      triples.forEach(function (triple) {
        removeTriple(callingformobjectid, inputID, null, triple);
      });
      if (form.formobject.store.length <= 2) {
        $('#bfeditor-modalSave-' + form.formobject.id).off('click');
        $('#bfeditor-modal-' + form.formobject.id).modal('hide');
      } else {
        // create label
        //		var triple = {
        //			"guid": guid(),
        //			"o": _.where(_.where(form.formobject.store, {"s": form.formobject.resourceTemplates[0].defaulturi}), {"p": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})[0].o,
        //			"otype":"literal",
        //			"p": "http://www.w3.org/2000/01/rdf-schema#label",
        //			"s": _.where(form.formobject.store, {"p": "http://www.w3.org/2000/01/rdf-schema#label"})[0].o.trim()
        //			}

        //	        form.formobject.store.push(triple);

        // Kirk note, at this point, some resources have a URI and others have a blank node that matches the defaulturi.

        setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, inputID, form.formobject.store);
      }
    });
    $('#bfeditor-modalSave-' + form.formobject.id).attr('tabindex', tabIndices++);
    $('#bfeditor-modalSaveLookup-' + form.formobject.id).click(function () {
      triples.forEach(function (triple) {
        removeTriple(callingformobjectid, inputID, null, triple);
      });

      //            form.formobject.store[0].o = form.formobject.store[2].o;
      //            form.formobject.store[1].s = form.formobject.store[2].o;
      //            form.formobject.store[3].s = form.formobject.store[2].o;
      //            form.formobject.store.splice(2, 1);

      var tlabel = _.find(form.formobject.store, {p: 'http://www.w3.org/2000/01/rdf-schema#label'});
      var ttype = _.find(form.formobject.store, {p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'});
      var tprop = _.find(form.formobject.store, {o: tlabel.s });

      // ttype.s = tprop.o;

      var data = form.formobject.store;

      setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, inputID, data);
    });
    $('#bfeditor-modal-' + form.formobject.id).on('hide.bs.modal', function () {
      $(this).empty();
    });

    $('.typeahead', form.form).each(function () {
      setTypeahead(this);
    });

    $('#bfeditor-debug').html(JSON.stringify(bfeditor.bfestore.store, undefined, ' '));
    $('#bfeditor-modal-' + form.formobject.id + " input:not('.tt-hint'):first").focus();
  }

  function setResourceFromModal (formobjectID, modalformid, resourceID, propertyguid, data) {
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

    bfelog.addMsg(new Error(), 'DEBUG', 'Setting resource from modal');
    bfelog.addMsg(new Error(), 'DEBUG', 'modal form id is: ' + modalformid);
    var callingformobject = _.where(forms, {
      'id': formobjectID
    });
    callingformobject = callingformobject[0];

    var resourceURI = _.find(_.find(forms, {'id': modalformid}).resourceTemplates, {defaulturi: resourceID}).resourceURI;

    // add the resourceType for the form
    var resourceType = { 'guid': guid(),
      's': resourceID,
      'otype': 'uri',
      'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
      'o': resourceURI
    };

    data.push(resourceType);

    callingformobject.resourceTemplates.forEach(function (t) {
      var properties = _.where(t.propertyTemplates, {
        'guid': propertyguid
      });
      if (properties[0] !== undefined) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Data from modal: ', data);

        var $formgroup = $('#' + propertyguid, callingformobject.form).closest('.form-group');
        var save = $formgroup.find('.btn-toolbar')[0];
        // console.log(formgroup);

        bfelog.addMsg(new Error(), 'DEBUG', 'Selected property from calling form: ' + properties[0].propertyURI);
        var temp = _.find(data, function (t) {
          // rdf-schema#value/i ???
          if (t.p.match(/rdf-schema#label/i)) {
            return t;
          } else if (t.p.match(/rdf-syntax-ns#value/i)) {
            return t;
          }
        });

        //                var tlabel = _.where(temp,{"s":properties[0].propertyURI});

        var tauthlabel = _.find(data, {
          p: 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
        });
        var tlabel = _.find(data, {
          p: 'http://www.w3.org/2000/01/rdf-schema#label'
        });
        var tvalue = _.find(data, {
          p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'
        });
        // if there's a label, use it. Otherwise, create a label from the literals, and if no literals, use the uri.
        var displayuri = /[^/]*$/.exec(_.find(data, {p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'}).o)[0];
        var displaydata = '';
        if (tauthlabel !== undefined) {
          displaydata = tauthlabel.o;
          displayuri = tauthlabel.s;
        } else if (tlabel !== undefined) {
          displaydata = tlabel.o;
          displayuri = tlabel.s;
        } else if (tvalue !== undefined) {
          displaydata = tvalue.o;
          displayuri = tvalue.s;
        } else {
          for (var i in data) {
            // if (data[i].p === "http://www.w3.org/2000/01/rdf-schema#label"){
            if (data[i].otype === 'literal' && !(/^\d/.test(data[i].o))) {
              displaydata += data[i].o + ' ';
              displayuri = data[i].s;
            }
          }
          // displayuri = data[0].s;
          if (displaydata === undefined || displaydata === '') {
            // create label
            displaydata = displayuri;
            var triple = {
              'guid': guid(),
              'o': displayuri,
              'otype': 'literal',
              'p': 'http://www.w3.org/2000/01/rdf-schema#label',
              's': displaydata.trim()
            };
            data.push(triple);
          }
        }

        data.forEach(function (t) {
          callingformobject.store.push(t);
          console.log('A');
          bfestore.addTriple(t);
          // bfestore.store.push(t);
        });

        bfestore.storeDedup();

        var connector = _.where(data, {
          'p': properties[0].propertyURI
        });
        var bgvars = {
          'tguid': connector[0].guid,
          'tlabelhover': displaydata,
          'tlabel': displaydata,
          'tlabelURI': displayuri,
          'fobjectid': formobjectID,
          'inputid': propertyguid,
          'triples': data
        };
        var $buttongroup = editDeleteButtonGroup(bgvars);

        $(save).append($buttongroup);
        // $("#" + propertyguid, callingformobject.form).val("");
        if (properties[0].repeatable !== undefined && properties[0].repeatable == 'false') {
          $('#' + propertyguid, callingformobject.form).attr('disabled', true);
        }
      }
    });
    // Remove the form?
    // forms = _.without(forms, _.findWhere(forms, {"id": formobjectID}));
    $('#bfeditor-modalSave-' + modalformid).off('click');
    $('#bfeditor-modal-' + modalformid).modal('hide');

    $('#bfeditor-debug').html(JSON.stringify(bfeditor.bfestore.store, undefined, ' '));
  }

  function editDeleteButtonGroup (bgvars) {
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

    var display, $buttongroup = $('<div>', {
      id: bgvars.tguid,
      class: 'btn-group btn-group-xs'
    });
    if (!_.isUndefined(bgvars.tlabel)) {
      if (bgvars.tlabel.length > 60) {
        display = bgvars.tlabel.substr(0, 58) + '...';
      } else {
        display = bgvars.tlabel;
      }
    } else {
      display = 'example';
    }

    var $displaybutton = $('<button type="button" class="btn btn-default" title="' + bgvars.tlabelhover + '">' + display + '</button>');
    // check for non-blanknode
    if (bgvars.tlabelURI !== undefined && bgvars.tlabelURI.match('^!_:b')) {
      $displaybutton = $('<button type="button" class="btn btn-default" title="' + bgvars.tlabelhover + '"><a href="' + bgvars.tlabelURI + '">' + display + '</a></button>');
    }
    $buttongroup.append($displaybutton);

    if (bgvars.editable === undefined || bgvars.editable === true) {
      // var $editbutton = $('<button type="button" class="btn btn-warning">e</button>');
      var $editbutton = $('<button class="btn btn-warning" type="button"> <span class="glyphicon glyphicon-pencil"></span></button>');
      $editbutton.click(function () {
        if (bgvars.triples.length === 1) {
          editTriple(bgvars.fobjectid, bgvars.inputid, bgvars.triples[0]);
        } else {
          editTriples(bgvars.fobjectid, bgvars.inputid, bgvars.tguid, bgvars.triples);
        }
      });
      $buttongroup.append($editbutton);
    }
    var $delbutton = $('<button class="btn btn-danger" type="button"><span class="glyphicon glyphicon-trash"></span> </button>');
    //          var $delbutton = $('<button type="button" class="btn btn-danger">x</button>');
    $delbutton.click(function () {
      if (bgvars.triples.length === 1) {
        removeTriple(bgvars.fobjectid, bgvars.inputid, bgvars.tguid, bgvars.triples[0]);
      } else {
        removeTriples(bgvars.fobjectid, bgvars.inputid, bgvars.tguid, bgvars.triples);
      }
    });
    $buttongroup.append($delbutton);

    return $buttongroup;
  }

  function setRtLabel (formobjectID, resourceID, inputID, rt) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    var data = $('#' + inputID).val();
    if (data !== undefined && data !== '') {
      var triple = {};
      triple.guid = guid();
      triple.s = rt.defaulturi;
      triple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
      triple.o = data;
      triple.otype = 'literal';
      triple.olang = 'en';
      bfestore.addTriple(triple);
      formobject.store.push(triple);

      var formgroup = $('#' + inputID, formobject.form).closest('.form-group');
      var save = $(formgroup).find('.btn-toolbar')[0];
      var bgvars = {
        'tguid': triple.guid,
        'tlabel': data,
        'tlabelhover': data,
        'fobjectid': formobjectID,
        'inputid': inputID,
        'triples': [triple]
      };
      var $buttongroup = editDeleteButtonGroup(bgvars);
      $(save).append($buttongroup);
      $('#' + inputID).val('');
    }
    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function setLiteral (formobjectID, resourceID, inputID) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    // console.log(inputID);
    var data = $('#' + inputID, formobject.form).val();
    if (data !== undefined && data !== '') {
      var triple = {};
      triple.guid = guid();
      formobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': inputID
        });
        triple.rtID = t.id;
        if (properties[0] !== undefined) {
          if (t.defaulturi !== undefined && t.defaulturi !== '') {
            triple.s = t.defaulturi;
          } else {
            // triple.s = editorconfig.baseURI + resourceID;
            triple.s = t.resouceURI;
          }
          triple.p = properties[0].propertyURI;
          triple.o = data;
          triple.otype = 'literal';
          // triple.olang = "";

          // bfestore.store.push(triple);
          bfestore.addTriple(triple);
          formobject.store.push(triple);

          var formgroup = $('#' + inputID, formobject.form).closest('.form-group');
          var save = $(formgroup).find('.btn-toolbar')[0];

          var bgvars = {
            'tguid': triple.guid,
            'tlabel': data,
            'tlabelhover': data,
            'fobjectid': formobjectID,
            'inputid': inputID,
            'triples': [triple]
          };
          var $buttongroup = editDeleteButtonGroup(bgvars);

          $(save).append($buttongroup);
          $('#' + inputID, formobject.form).val('');
          if (properties[0].repeatable !== undefined && properties[0].repeatable == 'false') {
            $('#' + inputID, formobject.form).attr('disabled', true);
          }
        }
      });
    }
    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function setResourceFromLabel (formobjectID, resourceID, inputID) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    // console.log(inputID);
    var data = $('#' + inputID, formobject.form).val();
    if (data !== undefined && data !== '') {
      var triple = {};
      triple.guid = guid();
      formobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': inputID
        });
        triple.rtID = t.id;
        if (properties[0] !== undefined) {
          if (t.defaulturi !== undefined && t.defaulturi !== '') {
            triple.s = t.defaulturi;
          } else {
            triple.s = editorconfig.baseURI + resourceID;
          }
          triple.p = properties[0].propertyURI;
          triple.o = data;
          triple.otype = 'uri';

          // bfestore.store.push(triple);
          bfestore.addTriple(triple);
          formobject.store.push(triple);

          var $formgroup = $('#' + inputID, formobject.form).closest('.form-group');
          var save = $formgroup.find('.btn-toolbar')[0];

          var bgvars = {
            'tguid': triple.guid,
            'tlabel': triple.o,
            'tlabelhover': triple.o,
            'fobjectid': formobjectID,
            'inputid': inputID,
            'triples': [triple]
          };
          var $buttongroup = editDeleteButtonGroup(bgvars);

          $(save).append($buttongroup);
          $('#' + inputID, formobject.form).val('');
          if (properties[0].repeatable !== undefined && properties[0].repeatable == 'false') {
            $('#' + inputID, formobject.form).attr('disabled', true);
          }
        }
      });
    }
    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function setTypeahead (input) {
    // var form = $(input).closest("form").eq(0);
    var formid = $(input).closest('form').eq(0).attr('id');
    var pageid = $(input).siblings('.typeaheadpage').attr('id');
    formid = formid.replace('bfeditor-form-', '');
    var formobject = _.where(forms, {
      'id': formid
    });
    formobject = formobject[0];
    if (typeof (pageid) !== 'undefined') {
      formobject.pageid = pageid;
    }
    // console.log(formid);

    var pguid = $(input).attr('data-propertyguid');
    var p;
    formobject.resourceTemplates.forEach(function (t) {
      var properties = _.where(t.propertyTemplates, {
        'guid': pguid
      });
      // console.log(properties);
      if (properties[0] !== undefined) {
        p = properties[0];
      }
    });

    var uvfs = p.valueConstraint.useValuesFrom;
    var dshashes = [];
    uvfs.forEach(function (uvf) {
      // var lups = _.where(lookups, {"scheme": uvf});
      var lu = lookups[uvf];

      if (lu === undefined) {
        lu = buildLookup(uvf);
        lookups[uvf] = lu;
      }

      bfelog.addMsg(new Error(), 'DEBUG', 'Setting typeahead scheme: ' + uvf);
      bfelog.addMsg(new Error(), 'DEBUG', 'Lookup is', lu);

      var dshash = {};
      dshash.name = lu.name;
      dshash.source = function (query, process) {
        lu.load.source(query, process, formobject);
      };
      dshash.templates = {
        header: '<h3>' + lu.name + '</h3>',
        footer: '<div id="dropdown-footer" class=".col-sm-1"></div>'
      };
      // dshash.displayKey = (dshash.name.match(/^LCNAF|^LCSH/)) ? 'display' : 'value';
      dshash.displayKey = 'display';
      dshashes.push(dshash);
    });

    bfelog.addMsg(new Error(), 'DEBUG', 'Data source hashes', dshashes);
    var opts = {
      minLength: 0,
      highlight: true,
      displayKey: 'value'
    };
    if (dshashes.length === 1) {
      $(input).typeahead(
        opts,
        dshashes[0]
      );
    } else if (dshashes.length === 2) {
      $(input).typeahead(
        opts,
        dshashes[0],
        dshashes[1]
      );
    } else if (dshashes.length === 3) {
      $(input).typeahead(
        opts,
        dshashes[0],
        dshashes[1],
        dshashes[2]
      );
    } else if (dshashes.length === 4) {
      $(input).typeahead(
        opts,
        dshashes[0],
        dshashes[1],
        dshashes[2],
        dshashes[3]
      );
    } else if (dshashes.length === 5) {
      $(input).typeahead(
        opts,
        dshashes[0],
        dshashes[1],
        dshashes[2],
        dshashes[3],
        dshashes[4]
      );
    } else if (dshashes.length === 6) {
      $(input).typeahead(
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
    $(input).on('typeahead:selected', function (event, suggestionobject, datasetname) {
      bfelog.addMsg(new Error(), 'DEBUG', 'Typeahead selection made');
      var form = $('#' + event.target.id).closest('form').eq(0);
      var formid = $('#' + event.target.id).closest('form').eq(0).attr('id');
      formid = formid.replace('bfeditor-form-', '');
      // reset page
      $(input).parent().siblings('.typeaheadpage').val(1);
      var resourceid = $(form).children('div').eq(0).attr('id');
      var resourceURI = $(form).find('div[data-uri]').eq(0).attr('data-uri');

      var propertyguid = $('#' + event.target.id).attr('data-propertyguid');
      bfelog.addMsg(new Error(), 'DEBUG', 'propertyguid for typeahead input is ' + propertyguid);

      var s = editorconfig.baseURI + resourceid;
      var p = '';
      var formobject = _.where(forms, {
        'id': formid
      });
      formobject = formobject[0];
      formobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': propertyguid
        });
        // console.log(properties);
        if (properties[0] !== undefined) {
          p = properties[0];
        }
      });

      var lups = _.where(lookups, {
        'name': datasetname
      });
      var lu;
      if (lups[0] !== undefined) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Found lookup for datasetname: ' + datasetname, lups[0]);
        lu = lups[0].load;
      }

      // do we have new resourceURI?

      lu.getResource(resourceURI, p, suggestionobject, function (returntriples, property) {
        bfelog.addMsg(new Error(), 'DEBUG', "Triples returned from lookup's getResource func:", returntriples);

        var resourceTriple = '';
        var replaceBnode = !!(property.propertyLabel === 'Lookup' || property.type === 'lookup');

        returntriples.forEach(function (t) {
          if (t.guid === undefined) {
            var tguid = guid();
            t.guid = tguid;
          }

          // if this is the resource, replace the blank node; otherwise push the label

          if (_.some(formobject.store, {
            s: t.s
          }) && t.p !== 'http://www.w3.org/2000/01/rdf-schema#label') {
            resourceTriple = _.find(formobject.store, {
              o: t.s
            });

            if (!replaceBnode || _.isEmpty(resourceTriple)) {
              // push the triples
              formobject.store.push(t);
              bfestore.addTriple(t);
            } else {
              var resourceType = _.find(formobject.store, {p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: formobject.resourceTemplates[0].resourceURI});

              resourceType.s = t.o;
              bfestore.addTriple(resourceType);

              if (replaceBnode) {
                resourceTriple.o = t.o;
                // find the bnode
                bfestore.addTriple(resourceTriple);
                formobject.store.push(resourceTriple);
              } else {
                formobject.store.push(t);
                bfestore.addTriple(t);
              }
            }
          } else {
            // I don't think this workst.s = resourceTriple.o;
            formobject.store.push(t);
            bfestore.addTriple(t);
          }
        });

        // We only want to show those properties that relate to
        // *this* resource.
        if (returntriples[0].s == resourceURI) {
          formobject.resourceTemplates.forEach(function (rt) {
            // change structure from b_node property object to

            var properties = _.where(rt.propertyTemplates, {
              'propertyURI': returntriples[0].p
            });
            if (properties[0] !== undefined) {
              var property = properties[0];
              var pguid = property.guid;

              var $formgroup = $('#' + pguid, formobject.form).closest('.form-group');
              var save = $formgroup.find('.btn-toolbar')[0];

              // var tlabel = _.findt.o;
              var tlabel = _.find(returntriples, {
                p: 'http://www.w3.org/2000/01/rdf-schema#label'
              }).o;

              var editable = true;
              if (property.valueConstraint.editable !== undefined && property.valueConstraint.editable === 'false') {
                editable = false;
              }

              // is there a type?
              if (_.has(property.valueConstraint.valueDataType, 'dataTypeURI')) {
                if (!_.isEmpty(property.valueConstraint.valueDataType.dataTypeURI)) {
                  var typeTriple = {};

                  typeTriple.s = _.find(returntriples, {
                    p: 'http://www.w3.org/2000/01/rdf-schema#label'
                  }).s;
                  typeTriple.guid = guid();
                  typeTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
                  typeTriple.o = property.valueConstraint.valueDataType.dataTypeURI;
                  typeTriple.otype = 'uri';
                  formobject.store.push(typeTriple);
                  bfeditor.bfestore.store.push(typeTriple);
                }
              }

              var bgvars = {
                'editable': editable,
                'tguid': guid(),
                'tlabel': tlabel,
                'tlabelhover': tlabel,
                'fobjectid': formobject.id,
                'inputid': pguid,
                'triples': returntriples
              };
              var $buttongroup = editDeleteButtonGroup(bgvars);

              $(save).append($buttongroup);

              $('#' + pguid, formobject.form).val('');
              $('#' + pguid, formobject.form).typeahead('val', '');
              $('#' + pguid, formobject.form).typeahead('close');

              if (property.repeatable === 'false' || property.valueConstraint.repeatable == 'false') {
                var $el = $('#' + pguid, formobject.form);
                if ($el.is('input')) {
                  $el.prop('disabled', true);
                  $el.css('background-color', '#EEEEEE');
                } else {
                  var $buttons = $('div.btn-group', $el).find('button');
                  $buttons.each(function () {
                    $(this).prop('disabled', true);
                  });
                }
              }
            }
          });
        }

        bfestore.storeDedup();
        $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
      });
    });
  }

  function buildLookup (name) {
    var lcshared = require('src/lookups/lcshared');
    var cache = [];
    var lu = {};
    lu.name = name.substr(name.lastIndexOf('/') + 1);
    var scheme = name;
    var source = function (query, process) {
      return lcshared.simpleQuery(query, cache, scheme, process);
    };

    var getResource = function (subjecturi, property, selected, process) {
      return lcshared.getResource(subjecturi, property, selected, process);
    };
    lu.load = {
      scheme,
      source,
      getResource
    };
    return lu;
  }

  function editTriple (formobjectID, inputID, t) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    bfelog.addMsg(new Error(), 'DEBUG', 'Editing triple: ' + t.guid, t);
    $('#' + t.guid).empty();

    var $el = $('#' + inputID, formobject.form);
    if ($el.is('input') && $el.hasClass('typeahead')) {
      var $inputs = $('#' + inputID, formobject.form).parent().find("input[data-propertyguid='" + inputID + "']");
      // is this a hack because something is broken?
      $inputs.each(function () {
        $(this).prop('disabled', false);
        $(this).removeAttr('disabled');
        $(this).css('background-color', 'transparent');
      });
    } else if ($el.is('input')) {
      $el.prop('disabled', false);
      $el.removeAttr('disabled');
      // el.css( "background-color", "transparent" );
    } else {
      var $buttons = $('div.btn-group', $el).find('button');
      $buttons.each(function () {
        $(this).prop('disabled', false);
      });
    }

    if ($el.is('input') && t.otype == 'literal') {
      $el.val(t.o);
    }
    formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
      guid: t.guid
    }));
    bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
      guid: t.guid
    }));
    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function editTriples (formobjectID, inputID, tguid, triples) {
    bfelog.addMsg(new Error(), 'DEBUG', 'Editing triples', triples);
    var resourceTypes = _.where(triples, {
      'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    });
    if (resourceTypes[0] == undefined) {
      // try @type?
      resourceTypes = _.where(triples, {
        'p': '@type'
      });
    }
    bfelog.addMsg(new Error(), 'DEBUG', 'Triples represent these resourceTypes', resourceTypes);
    if (resourceTypes[0] !== undefined && typeof resourceTypes[0] !== undefined && resourceTypes[0].rtID !== undefined) {
      // function openModal(callingformobjectid, rtguid, propertyguid, template) {
      var callingformobject = _.where(forms, {
        'id': formobjectID
      });
      callingformobject = callingformobject[0];

      var templates = _.where(resourceTemplates, {
        'id': resourceTypes[0].rtID
      });
      if (templates[0] !== undefined) {
        // The subject of the resource matched with the "type"
        bfelog.addMsg(new Error(), 'DEBUG', 'Opening modal for editing', triples);
        openModal(callingformobject.id, templates[0], resourceTypes[0].s, inputID, triples);
      }
    } else {
      removeTriples(formobjectID, inputID, tguid, triples);
    }
  }

  function removeTriple (formobjectID, inputID, tguid, t) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    if ($('#' + t.guid).length && t !== undefined) {
      bfelog.addMsg(new Error(), 'DEBUG', 'Removing triple: ' + t.guid, t);
      // $("#" + t.guid).empty();
      $('#' + t.guid).remove();
    } else {
      bfelog.addMsg(new Error(), 'DEBUG', 'Removing triple: ' + tguid);
      // $("#" + tguid).empty();
      $('#' + tguid).remove();
      formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
        guid: tguid
      }));
      bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
        guid: tguid
      }));
    }

    var $el = $('#' + inputID, formobject.form);
    if ($el.is('input') && $el.hasClass('typeahead')) {
      var $inputs = $('#' + inputID, formobject.form).parent().find("input[data-propertyguid='" + inputID + "']");
      // is this a hack because something is broken?
      $inputs.each(function () {
        $(this).prop('disabled', false);
        $(this).removeAttr('disabled');
        $(this).css('background-color', 'transparent');
      });
    } else if ($el.is('input')) {
      $el.prop('disabled', false);
      $el.removeAttr('disabled');
      // el.css( "background-color", "transparent" );
    } else {
      var $buttons = $('div.btn-group', $el).find('button');
      $buttons.each(function () {
        $(this).prop('disabled', false);
      });
    }
    formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
      guid: t.guid
    }));
    bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
      guid: t.guid
    }));
    /*        if (t.otype === "uri") {
        // check for a stub & delete it
           var t2 =  _.where(bfestore.store, {
                  s: t.o
           })

           if (t2 !== undefined && !_.isEmpty(t2) ){
               if (t2.length === 1) {
               //removeTriple(formobjectID, inputID, tguid, t2);
                   bfestore.store = _.without(bfestore.store, t2[0]);
               }
           }
        }
*/
    // remove any types
    // formobject.store = _.without(formobject.store, _.find(formobject.store, {s: t.s, p:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}));
    // bfestore.store = _.without(bfestore.store, _.find(bfestore.store, {s: t.s, p:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}));

    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function removeTriples (formobjectID, inputID, tID, triples) {
    bfelog.addMsg(new Error(), 'DEBUG', 'Removing triples for formobjectID: ' + formobjectID + ' and inputID: ' + inputID, triples);
    triples.forEach(function (triple) {
      removeTriple(formobjectID, inputID, tID, triple);
    });
  }

  /**
     * Generate string which matches python dirhash
     * @returns {String} the generated string
     * @example GCt1438871386
     *
     */
  function guid () {
    function _randomChoice () {
      var text = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      for (var i = 0; i < 1; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
      return text;
    }
    // return _randomChoice() + _randomChoice() + _randomChoice() + parseInt(Date.now() / 1000);
    var translator = window.ShortUUID();
    return translator.uuid();
  }

  function shortUUID (uuid) {
    var translator = window.ShortUUID();
    return translator.fromUUID(uuid);
  }

  function mintResource (uuid) {
    var decimaltranslator = window.ShortUUID('0123456789');
    return 'e' + decimaltranslator.fromUUID(uuid);
  }

  function randomChoice () {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (var i = 0; i < 1; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
    return text;
  }

  function whichrt (rt, baseURI, callback) {
    // for resource templates, determine if they are works, instances, or other

    if (rt.resourceURI.startsWith('http://www.loc.gov/mads/rdf/v1#')) {
      uri = rt.resourceURI.replace('http://www.loc.gov/mads/rdf/v1#', config.url + '/bfe/static/v1.json#');
    } else if (rt.resourceURI.startsWith('http://id.loc.gov/resources')) {
      uri = rt.resourceURI.replace('http://id.loc.gov/resources', config.resourceURI) + '.json';
    } else if (rt.resourceURI.startsWith('http://mlvlp04.loc.gov:3000/resources')) {
      return;
    } else {
      uri = rt.resourceURI + '.json';
    }
    $.ajax({
      type: 'GET',
      async: false,
      data: {
        uri: uri
      },
      url: config.url + '/profile-edit/server/whichrt',
      success: function (data) {
        var returnval = '_:bnode';
        var truthy = false;
        data.some(function (resource) {
          if (resource['@id'] === rt.resourceURI && !truthy) {
            if (resource['http://www.w3.org/2000/01/rdf-schema#subClassOf'] !== undefined) {
              if (resource['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]['@id'] === 'http://id.loc.gov/ontologies/bibframe/Work') {
                returnval = baseURI + 'resources/works/';
                truthy = true;
              } else if (resource['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]['@id'] === 'http://id.loc.gov/ontologies/bibframe/Instance') {
                returnval = baseURI + 'resources/instances/';
                truthy = true;
              } else if (resource['http://www.w3.org/2000/01/rdf-schema#subClassOf'][0]['@id'] === 'http://www.loc.gov/mads/rdf/v1#Name') {
                returnval = baseURI + 'resources/agents/';
                truthy = true;
              }
            } else if (resource['@id'] === 'http://id.loc.gov/ontologies/bibframe/Instance') {
              returnval = baseURI + 'resources/instances/';
              truthy = true;
            } else if (resource['@id'] === 'http://id.loc.gov/ontologies/bibframe/Work') {
              returnval = baseURI + 'resources/works/';
              truthy = true;
            }
          }
        });
        callback(returnval);
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        bfelog.addMsg(new Error(), 'ERROR', 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
      }
    });

    // return returnval;
  }

  function whichLabel (uri, callback) {
    // for resource templates, determine if they are works, instances, or other

    var thisuri = uri;

    // normalize
    if (uri.startsWith('http://id.loc.gov/resources')) {
      uri = uri.replace('http://id.loc.gov/resources', config.resourceURI);
    }

    if (uri.endsWith('marcxml.xml')) {
      returnval = /[^/]*$/.exec(uri)[0].split('.')[0];
      callback(returnval);
    } else {
      $.ajax({
        type: 'GET',
        async: false,
        data: {
          uri: uri + '.json'
        },
        url: config.url + '/profile-edit/server/whichrt',
        success: function (data) {
          var returnval;
          var labelelements = _.where(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel');

          if (labelelements !== undefined && !_.isEmpty(labelelements)) {
            returnval = _.find(data, {'@id': uri})['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
            // returnval = labelelement["http://www.loc.gov/mads/rdf/v1#authoritativeLabel"][0]["@value"]
          } else {
            // look for a rdfslabel
            var labels = _.filter(data[2], function (prop) { if (prop[0] === 'rdfs:label') return prop; });

            if (!_.isEmpty(labels)) {
              returnval = labels[0][2];
            } else {
              returnval = uri;
            }
          }

          callback(returnval);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          bfelog.addMsg(new Error(), 'ERROR', 'Request status: ' + textStatus + '; Error msg: ' + errorThrown);
        }
      });
    }

    // return returnval;
  }
});

bfe.define('src/bfestore', ['require', 'exports', 'module'], function (require, exports, module) {
  exports.n3store = N3.Store();

  exports.store = [];

  exports.rdfxml2store = function (rdf, loadtemplates, recid, callback) {
    var url = 'http://rdf-translator.appspot.com/convert/xml/json-ld/content';
    var bfestore = this;

    $.ajax({
      contentType: 'application/x-www-form-urlencoded',
      type: "POST",
      async: false,
      data: { content: rdf},
      url: url,
      success: function (data) {
        bfestore.store = bfestore.jsonldcompacted2store(data, function(expanded) {
          bfestore.store = [];
          tempstore = bfestore.jsonld2store(expanded);
          tempstore.forEach(function (nnode) {
            nnode.s = nnode.s.replace(/^_:N/, '_:bnode');
            nnode.s = nnode.s.replace(/bibframe.example.org\/.+#(Work|Topic).*/, 'id.loc.gov/resources/works/c' + recid);
            nnode.s = nnode.s.replace(/bibframe.example.org\/.+#Instance.*/, 'id.loc.gov/resources/instances/c' + recid + '0001');
            nnode.s = nnode.s.replace(/bibframe.example.org\/.+#Item.*/, 'id.loc.gov/resources/items/c' + recid + '0001');
            if (nnode.o !== undefined) {
              nnode.o = nnode.o.replace(/^_:N/, '_:bnode');
              nnode.o = nnode.o.replace(/bibframe.example.org\/.+#(Work|Topic).*/, 'id.loc.gov/resources/works/c' + recid);
              nnode.o = nnode.o.replace(/bibframe.example.org\/.+#Instance.*/, 'id.loc.gov/resources/instances/c' + recid + '0001');
              nnode.o = nnode.o.replace(/bibframe.example.org\/.+#Item.*/, 'id.loc.gov/resources/items/c' + recid + '0001');
            } 
            console.log(nnode);
          });
          callback(loadtemplates);
        });
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) { 
        bfelog.addMsg(new Error(), "ERROR", "FAILED to load external source: " + url);
        bfelog.addMsg(new Error(), "ERROR", "Request status: " + textStatus + "; Error msg: " + errorThrown);
      }
    });
  }

  exports.addTriple = function (triple) {
    exports.store.push(triple);
    if (triple.rtid !== undefined) { exports.n3store.addTriple(triple.s, triple.p, triple.o, triple.rtID); } else { exports.n3store.addTriple(triple.s, triple.p, triple.o); }
  };

  exports.storeDedup = function () {
    exports.store = _.uniq(exports.store, function (t) {
      if (t.olang !== undefined) {
        return t.s + t.p + t.o + t.otype + t.olang;
      } else if (t.odatatype !== undefined) {
        return t.s + t.p + t.o + t.otype + t.odatatype;
      } else if (t.rtID !== undefined) {
        return t.s + t.p + t.o + t.otype + t.rtID + t.guid;
      } else {
        return t.s + t.p + t.o + t.otype;
      }
    });
    return exports.store;
  };

  exports.store2rdfxml = function (jsonld, callback) {
    exports.store2jsonldnormalized(jsonld, function (expanded) {
      /*$.ajax({
        url: config.url + '/profile-edit/server/n3/rdfxml',
        type: 'POST',
        data: JSON.stringify(expanded),
        processData: false,
        contentType: 'application/json',
        success: function (rdfxml) {
          data = new XMLSerializer().serializeToString(rdfxml);
          callback(data);
        },
        error: function (XMLHttpRequest, status, err) {
          console.log(err);
        }
      });*/
      jsonld.toRDF(expanded, {
        format: 'application/nquads'
      }, function(err, nquads) {
        //json2turtle(nquads, callback);
        var parser = N3.Parser();
        var turtlestore = N3.Store();
        parser.parse(nquads, function(error, triple, theprefixes) {
            if (triple) {
                turtlestore.addTriple(triple);
            } else {
                turtlestore.addPrefixes(theprefixes);                
                var turtleWriter = N3.Writer({
                    prefixes: {
                        bf: 'http://id.loc.gov/ontologies/bibframe/',
                        bflc: 'http://id.loc.gov/ontologies/bflc/',
                        madsrdf: "http://www.loc.gov/mads/rdf/v1#",
                        pmo: 'http://performedmusicontology.org/ontology/',
                        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
                        xsd: "http://www.w3.org/2001/XMLSchema#"
                    }
                });
                turtleWriter.addTriples(turtlestore.getTriples(null, null, null));
                //turtleWriter.addTriples(exports.n3store.getTriples(null, null, null));
                turtleWriter.end(function(error, result) {                    
                var input = {};
                input.n3 = result;
                $.ajax({
                    url: config.url + "/profile-edit/server/n3/rdfxml",
                    type: "POST",
                    data: JSON.stringify(input),
                    processData: false,
                    contentType: "application/json",
                    success: function(rdfxml) {
                        var data = new XMLSerializer().serializeToString(rdfxml);
                        $("#rdfxml .panel-body pre").text(data);
                    },
                    error: function(XMLHttpRequest, status, err) {
                        console.log(err);
                    }
                });
              });
            }
          });
      });  
    });  
  };

  exports.n32store = function (n3, graph, tempstore, callback) {
    var parser = N3.Parser();
    var triples = parser.parse(n3);
    var writer = N3.Writer({
      format: 'N-Quads'
    });
    var store = N3.Store(triples);
    // writer.addTriples(store.getTriples(null, null, null, null));
    store.getTriples(null, null, null).forEach(function (triple) {
      writer.addTriple(triple.subject.replace('_bnode', ''), triple.predicate, triple.object.replace('_bnode', ''), graph);
    });
    // writer.addTriple("<http://one.example/subject1> <http://one.example/predicate1> <http://one.example/object1> <http://example.org/graph3>");
    writer.end(function (error, nquads) {
      jsonld.fromRDF(nquads, {
        format: 'application/nquads'
      }, function (err, result) {
        callback(exports.jsonld2store(result[0]['@graph']));
      });
    });
  };
  //
  //    exports.nquads2jsonld = function(nquads){
  //	jsonld.fromRDF(nquads, {format:'application/nquads'}, function(err, data) {
  //	 	try {
  //			return exports.jsonld2store(data);
  //		} catch (err){
  //			console.log(err);
  //		}
  //        });
  //    }

  exports.jsonld2store = function (jsonld) {
    jsonld.forEach(function (resource) {
      var s = typeof resource['@id'] !== 'undefined' ? resource['@id'] : '_:b' + guid();
      for (var p in resource) {
        if (p !== '@id') {
          if (p === '@type' && !_.isArray(resource[p])) {
            var tguid = guid();
            var triple = {};
            triple.guid = tguid;
            triple.s = s;
            triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
            triple.o = resource['@type'];
            triple.otype = 'uri';
            exports.store.push(triple);
          } else {
            resource[p].forEach(function (o) {
              var tguid = guid();
              var triple = {};
              triple.guid = tguid;
              if (p === '@type') {
                triple.s = s;
                triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
                if (o.indexOf('.html') > -1) {
                  triple.o = o.replace('.html', '');
                } else {
                  triple.o = o;
                }
                triple.otype = 'uri';
              } else {
                triple.s = s;
                if (p.indexOf('.html') > -1) {
                  triple.p = p.replace('.html', '');
                } else {
                  triple.p = p;
                }
                if (o['@id'] !== undefined) {
                  triple.o = o['@id'];
                  triple.otype = 'uri';
                } else if (o['@value'] !== undefined) {
                  triple.o = o['@value'];
                  triple.otype = 'literal';
                  if (o['@language'] !== undefined) {
                    triple.olang = o['@language'];
                  }
                }
              }
              exports.store.push(triple);
            });
          }
        }
      }
      // If a resource does not have a defined type, do we care?
    });
    return exports.store;
  };

  exports.store2jsonldExpanded = function () {
    var json = [];
    exports.storeDedup();
    var groupedResources = _.groupBy(exports.store, function (t) {
      return t.s;
    });
    for (var resourceURI in groupedResources) {
      var j = {};
      j['@id'] = resourceURI;
      var groupedProperties = _.groupBy(groupedResources[resourceURI], function (t) {
        return t.p;
      });
      for (var propertyURI in groupedProperties) {
        var prop = propertyURI;
        if (propertyURI == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
          prop = '@type';
        }
        j[prop] = [];
        groupedProperties[propertyURI].forEach(function (r) {
          if (prop == '@type' && r.otype == 'uri') {
            j[prop].push(r.o);
          } else if (r.otype == 'uri') {
            j[prop].push({
              '@id': r.o
            });
          } else {
            var o = {};
            if (r.olang !== undefined && r.olang !== '') {
              o['@language'] = r.olang;
            }
            if (r.p == '@type') {
              o = r.o;
            } else {
              o['@value'] = r.o;
            }
            j[prop].push(o);
          }
        });
      }
      // skip blank bnodes
      if (!((j['@id'].startsWith('_:b') || j['@id'].includes('loc.natlib')) && _.keys(j).length < 3)) { json.push(j); }
    }
    return json;
  };

  exports.store2turtle = function (jsonstr, callback) {
    jsonld.toRDF(jsonstr, {
      format: 'application/nquads'
    }, function(err, nquads) {
      //json2turtle(nquads, callback);
      var parser = N3.Parser();
      var turtlestore = N3.Store();
      parser.parse(nquads, function(error, triple, theprefixes) {
          if (triple) {
              turtlestore.addTriple(triple);
          } else {
              turtlestore.addPrefixes(theprefixes);                
              var turtleWriter = N3.Writer({
                  prefixes: {
                      bf: 'http://id.loc.gov/ontologies/bibframe/',
                      bflc: 'http://id.loc.gov/ontologies/bflc/',
                      madsrdf: "http://www.loc.gov/mads/rdf/v1#",
                      pmo: 'http://performedmusicontology.org/ontology/',
                      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
                      xsd: "http://www.w3.org/2001/XMLSchema#"
                  }
              });
              turtleWriter.addTriples(turtlestore.getTriples(null, null, null));
              //turtleWriter.addTriples(exports.n3store.getTriples(null, null, null));
              turtleWriter.end(function(error, result) {
                  callback(result);
              });
              var input = {};
              input.n3 = $("#humanized .panel-body pre").text();
              $.ajax({
                  url: config.url + "/profile-edit/server/n3/rdfxml",
                  type: "POST",
                  data: JSON.stringify(input),
                  processData: false,
                  contentType: "application/json",
                  success: function(rdfxml) {
                      var data = new XMLSerializer().serializeToString(rdfxml);
                      $("#rdfxml .panel-body pre").text(data);
                  },
                  error: function(XMLHttpRequest, status, err) {
                      console.log(err);
                  }
              });
          }
      });
    });
  };

  exports.store2jsonldcompacted = function (jsonstr, callback) {
    context = {
      'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',
      'bf': 'http://id.loc.gov/ontologies/bibframe/',
      'bflc': 'http://id.loc.gov/ontologies/bflc/',
      'madsrdf': 'http://www.loc.gov/mads/rdf/v1#',
      'pmo': 'http://performedmusicontology.org/ontology/',
    };

    jsonld.compact(jsonstr, context, function (err, compacted) {
      callback(compacted);
    });
  };

  exports.store2jsonldnormalized = function (jsonstr, callback) {
    jsonld.expand(jsonstr, context, function (err, jsonld) {
      callback(jsonld);
    });
  };

  exports.jsonldcompacted2store = function (json, callback) {
    jsonld.expand(json, function (err, expanded) {
      callback(expanded);
    });
  };

  exports.store2text = function () {
    var nl = '\n';
    var nlindent = nl + '\t';
    var nlindentindent = nl + '\t\t';
    var predata = '';
    var json = exports.store2jsonldExpanded();
    json.forEach(function (resource) {
      predata += nl + 'ID: ' + resource['@id'];
      if (resource['@type'] !== undefined) {
        predata += nlindent + 'Type(s)';
        resource['@type'].forEach(function (t) {
          // predata += nlindentindent + t["@id"];
          if (t['@value'] !== undefined) {
            predata += nlindentindent + t['@value'];
          } else {
            predata += nlindentindent + t;
          }
        });
      }
      for (var t in resource) {
        if (t !== '@type' && t !== '@id') {
          var prop = t.replace('http://id.loc.gov/ontologies/bibframe/', 'bf:');
          prop = prop.replace('http://id.loc.gov/vocabulary/relators/', 'relators:');
          prop = prop.replace('http://id.loc.gov/ontologies/bibframe-lc/', 'bflc:');
          prop = prop.replace('http://rdaregistry.info/termList/', 'rda');
          predata += nlindent + prop;
          resource[t].forEach(function (o) {
            if (o['@id'] !== undefined) {
              predata += nlindentindent + o['@id'];
            } else {
              predata += nlindentindent + o['@value'];
            }
          });
        }
      }
      predata += nl + nl;
    });
    return predata;
  };

  /**
     * Generates a GUID string.
     * @returns {String} The generated GUID.
     * @example GCt1438871386
     */
  function guid () {
    function _randomChoice () {
      var text = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      for (var i = 0; i < 1; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
      return text;
    }
    return _randomChoice() + _randomChoice() + _randomChoice() + parseInt(Date.now() / 1000);
  }
});
bfe.define('src/bfelogging', ['require', 'exports', 'module'], function (require, exports, module) {
  var level = 'INFO';
  var toConsole = true;
  var domain = window.location.protocol + '//' + window.location.host + '/';

  exports.log = [];

  exports.getLog = function () {
    return exports.log;
  };

  exports.init = function (config) {
    if (config.logging !== undefined) {
      if (config.logging.level !== undefined && config.logging.level == 'DEBUG') {
        level = config.logging.level;
      }
      if (config.logging.toConsole !== undefined && !config.logging.toConsole) {
        toConsole = config.logging.toConsole;
      }
    }
    var msg = 'Logging instantiated: level is ' + level + '; log to console is set to ' + toConsole;
    exports.addMsg(new Error(), 'INFO', msg);
    exports.addMsg(new Error(), 'INFO', domain);
  };

  // acceptable ltypes are:  INFO, DEBUG, WARN, ERROR
  exports.addMsg = function (error, ltype, data, obj) {
    if (error.lineNumber === undefined && error.fileName === undefined) {
      // Not firefox, so let's try and see if it is chrome
      try {
        var stack = error.stack.split('\n');
        var fileinfo = stack[1].substring(stack[1].indexOf('(') + 1);
        fileinfo = fileinfo.replace(domain, '');
        var infoparts = fileinfo.split(':');
        error.fileName = infoparts[0];
        error.lineNumber = infoparts[1];
      } catch (e) {
        // Probably IE.
        error.fileName = 'unknown';
        error.lineNumber = '?';
      }
    }
    error.fileName = error.fileName.replace(domain, '');
    if (level == 'INFO' && ltype.match(/INFO|WARN|ERROR/)) {
      setMsg(ltype, data, error, obj);
      consoleOut(ltype, data, error, obj);
    } else if (level == 'DEBUG') {
      setMsg(ltype, data, error, obj);
      consoleOut(ltype, data, error, obj);
    }
  };

  function consoleOut (ltype, data, error, obj) {
    if (toConsole) {
      console.log(error.fileName + ':' + error.lineNumber + ' -> ' + data);
      if (typeof data === 'object' || data instanceof Array) {
        console.log(data);
      }
      if (obj !== undefined && (typeof obj === 'object' || obj instanceof Array)) {
        console.log(obj);
      }
    }
  }

  function setMsg (ltype, data, error, obj) {
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
    if (typeof data === 'object' || data instanceof Array) {
      entry.msg = JSON.stringify(data);
    } else {
      entry.msg = data;
    }
    if (obj !== undefined && (typeof obj === 'object' || obj instanceof Array)) {
      entry.obj = JSON.stringify(obj);
    }
    exports.log.push(entry);
  }
});
bfe.define('src/lookups/lcnames', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');

  var cache = [];

  // This var is required because it is used as an identifier.
  exports.scheme = 'http://id.loc.gov/authorities/names';

  exports.source = function (query, process, formobject) {
    // console.log(JSON.stringify(formobject.store));

    var triples = formobject.store;

    var type = '';
    var hits = _.where(triples, {
      'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    });
    if (hits[0] !== undefined) {
      type = hits[0].o;
    }
    // console.log("type is " + type);

    var scheme = 'http://id.loc.gov/authorities/names';
    hits = _.where(triples, {
      'p': 'http://id.loc.gov/ontologies/bibframe/authoritySource'
    });
    if (hits[0] !== undefined) {
      console.log(hits[0]);
      scheme = hits[0].o;
    }
    // console.log("scheme is " + scheme);

    var rdftype = '';
    if (type == 'http://www.loc.gov/mads/rdf/v1#PersonalName') {
      rdftype = 'rdftype:PersonalName';
    } else if (type == 'http://id.loc.gov/ontologies/bibframe/Topic') {
      rdftype = '(rdftype:Topic OR rdftype:ComplexSubject)';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#place') {
      rdftype = 'rdftype:Geographic';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#organization') {
      rdftype = 'rdftype:CorporateName';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#family') {
      // rdftype = "rdftype:FamilyName";
      rdftype = 'rdftype:PersonalName';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#meeting') {
      rdftype = 'rdftype:ConferenceName';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#jurisdiction') {
      rdftype = 'rdftype:CorporateName';
    } else if (type == 'http://id.loc.gov/ontologies/bibframe/genreForm') {
      rdftype = 'rdftype:GenreForm';
    } else if (type == 'http://id.loc.gov/ontologies/bibframe/role') {
      rdftype = 'rdftype:Role';
    }

    var q = '';
    if (scheme !== '' && rdftype !== '') {
      q = 'cs:' + scheme + ' AND ' + rdftype;
    } else if (rdftype !== '') {
      q = rdftype;
    } else if (scheme !== '') {
      q = 'cs:' + scheme;
    }
    if (q !== '') {
      q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
    } else {
      q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
    }
    // console.log('q is ' + q);
    q = encodeURI(q);

    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query.length > 2 && query.substr(0, 1) != '?' && !query.match(/^[Nn][A-z]{0,1}\d/)) {
        suggestquery = query.normalize();
        console.log(query);
        if (rdftype !== '') { suggestquery += '&rdftype=' + rdftype.replace('rdftype:', ''); }

        u = exports.scheme + '/suggest/?q=' + suggestquery + '&count=50';

        $.ajax({
          url: u,
          dataType: 'jsonp',
          success: function (data) {
            parsedlist = lcshared.processSuggestions(data, query);
            cache[q] = parsedlist;
            return process(parsedlist);
          }
        });
      } else if (query.length > 2) {
        u = 'http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=' + q.replace('?', '');
        $.ajax({
          url: u,
          dataType: 'jsonp',
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
  };

  /*

        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
  exports.getResource = lcshared.getResourceWithAAP;
});
bfe.define('src/lookups/lcshared', ['require', 'exports', 'module'], function (require, exports, module) {
  // require('https://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js');

  /*
        subjecturi propertyuri selected.uri
        selected.uri  bf:label selected.value
    */

  exports.getResource = function (subjecturi, property, selected, process) {
    var triples = [];

    var triple = {};
    triple.s = subjecturi;
    triple.p = property.propertyURI;
    selected.uri = selected.uri;
    triple.o = selected.uri;
    triple.otype = 'uri';
    triples.push(triple);

    triple = {};
    triple.s = selected.uri;
    triple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
    triple.o = selected.value;
    triple.otype = 'literal';
    triple.olang = 'en';
    triples.push(triple);

    return process(triples, property);
  };

  exports.getResourceWithAAP = function (subjecturi, property, selected, process) {
    var triples = [];

    var triple = {};
    triple.s = subjecturi;
    triple.p = property.propertyURI;
    triple.o = selected.uri;
    triple.otype = 'uri';
    triples.push(triple);

    triple = {};
    triple.s = subjecturi;
    triple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
    triple.o = selected.value;
    triple.otype = 'literal';
    triple.olang = 'en';
    triples.push(triple);

    process(triples, property);
  };

  exports.getResourceLabelLookup = function (subjecturi, propertyuri, selected, process) {
    var triples = [];

    var triple = {};
    triple.s = subjecturi;
    triple.p = propertyuri;
    triple.o = selected.uri;
    triple.otype = 'uri';
    triples.push(triple);
    // add label
    $.ajax({
      url: selected.uri + '.jsonp',
      dataType: 'jsonp',
      success: function (data) {
        data.forEach(function (resource) {
          if (resource['@id'] === selected.uri) {
            var label = {};
            label.s = selected.uri;
            label.otype = 'literal';
            label.p = 'http://www.w3.org/2000/01/rdf-schema#label';
            label.o = resource['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
            triples.push(label);
            return process(triples);
          }
        });
      }
    });
  };

  exports.processJSONLDSuggestions = function (suggestions, query, scheme) {
    var typeahead_source = [];
    if (suggestions['@graph'] !== undefined) {
      for (var s = 0; s < suggestions['@graph'].length; s++) {
        if (suggestions['@graph'][s].inScheme !== undefined) {
          if (suggestions['@graph'][s]['@type'] === 'Concept' && suggestions['@graph'][s].inScheme === scheme) {
            if (suggestions['@graph'][s].prefLabel.en.length !== undefined) {
              var l = suggestions['@graph'][s].prefLabel.en;
              // break;
              // var l = suggestions['@graph'][s]['prefLabel']['@value'];
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
        uri: '',
        value: '[No suggestions found for ' + query + '.]'
      };
    }
    return typeahead_source;
  };

  exports.processSuggestions = function (suggestions, query) {
    var typeahead_source = [];
    if (suggestions[1] !== undefined) {
      for (var s = 0; s < suggestions[1].length; s++) {
        var l = suggestions[1][s];
        var u = suggestions[3][s];
        var id = u.replace(/.+\/(.+)/, '$1');
        var d = l + ' (' + id + ')';
        if (suggestions.length === 5) {
          var i = suggestions[4][s];
          var li = l + ' (' + i + ')';
        } else {
          var li = l;
        }

        typeahead_source.push({
          uri: u,
          value: li,
          display: d
        });
      }
    }
    if (typeahead_source.length === 0) {
      typeahead_source[0] = {
        uri: '',
        display: '[No suggestions found for ' + query + '.]'
      };
    }
    // console.log(typeahead_source);
    // $("#dropdown-footer").text('Total Results:' + suggestions.length);
    return typeahead_source;
  };

  exports.processATOM = function (atomjson, query) {
    var typeahead_source = [];
    for (var k in atomjson) {
      if (atomjson[k][0] == 'atom:entry') {
        var t = '';
        var u = '';
        var source = '';
        var d = '';
        for (var e in atomjson[k]) {
          if (atomjson[k][e][0] == 'atom:title') {
            t = atomjson[k][e][2];
          }
          if (atomjson[k][e][0] == 'atom:link') {
            u = atomjson[k][e][1].href;
            source = u.substr(0, u.lastIndexOf('/'));
            var id = u.replace(/.+\/(.+)/, '$1');
            d = t + ' (' + id + ')';
          }
          if (t !== '' && u !== '') {
            typeahead_source.push({
              uri: u,
              source: source,
              value: t, 
              display: d
            });
            break;
          }
          console.log(typeahead_source);
        }
      }
    }
    if (typeahead_source.length === 0) {
      typeahead_source[0] = {
        uri: '',
        display: '[No suggestions found for ' + query + '.]'
      };
    }
    // console.log(typeahead_source);
    return typeahead_source;
  };

  exports.simpleQuery = function (query, cache, scheme, process) {
    console.log('q is ' + query);
    q = encodeURI(query.normalize());
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }
    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = scheme + '/suggest/?count=100&q=';
        $.ajax({
          url: u,
          dataType: 'jsonp',
          success: function (data) {
            parsedlist = exports.processSuggestions(data, '');
            return process(parsedlist);
          }
        });
      } else if (query.length >= 1) {
        u = scheme + '/suggest/?count=50&q=' + q;
        $.ajax({
          url: u,
          dataType: 'jsonp',
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
  };
});
bfe.define('src/lookups/lcsubjects', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');

  var cache = [];

  exports.scheme = 'http://id.loc.gov/authorities/subjects';

  exports.source = function (query, process, formobject) {
    // console.log(JSON.stringify(formobject.store));

    var triples = formobject.store;

    var type = '';
    var hits = _.where(triples, {
      'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    });
    if (hits[0] !== undefined) {
      type = hits[0].o;
    }
    // console.log("type is " + type);

    var scheme = 'http://id.loc.gov/authorities/subjects';
    hits = _.where(triples, {
      'p': 'http://id.loc.gov/ontologies/bibframe/authoritySource'
    });
    if (hits[0] !== undefined) {
      // console.log(hits[0]);
      scheme = hits[0].o;
    }
    // console.log("scheme is " + scheme);

    var rdftype = '';
    if (type == 'http://www.loc.gov/mads/rdf/v1#Person') {
      rdftype = 'rdftype:PersonalName';
    } else if (type == 'http://id.loc.gov/ontologies/bibframe/Topic') {
      rdftype = '(rdftype:Topic OR rdftype:ComplexSubject)';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#Place') {
      rdftype = 'rdftype:Geographic';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#Organization') {
      rdftype = 'rdftype:CorporateName';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#Family') {
      // rdftype = "rdftype:FamilyName";
      rdftype = 'rdftype:PersonalName';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#Meeting') {
      rdftype = 'rdftype:ConferenceName';
    } else if (type == 'http://www.loc.gov/mads/rdf/v1#Jurisdiction') {
      rdftype = 'rdftype:CorporateName';
    } else if (type == 'http://id.loc.gov/ontologies/bibframe/GenreForm') {
      rdftype = 'rdftype:GenreForm';
    }

    var q = '';
    if (scheme !== '' && rdftype !== '') {
      q = 'cs:' + scheme + ' AND ' + rdftype;
    } else if (rdftype !== '') {
      q = rdftype;
    } else if (scheme !== '') {
      q = 'cs:' + scheme;
    }
    if (q !== '') {
      q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
    } else {
      q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
    }
    // console.log('q is ' + q);
    q = encodeURI(q);

    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query.length > 2 && query.substr(0, 1) != '?' && !query.match(/[Ss][A-z]{0,1}\d/)) {
        suggestquery = query.normalize();
        if (rdftype !== '') { suggestquery += '&rdftype=' + rdftype.replace('rdftype:', ''); }

        u = exports.scheme + '/suggest/?q=' + suggestquery;
        $.ajax({
          url: u,
          dataType: 'jsonp',
          success: function (data) {
            parsedlist = lcshared.processSuggestions(data, query);
            cache[q] = parsedlist;
            return process(parsedlist);
          }
        });
      } else if (query.length > 2) {
        u = 'http://id.loc.gov/search/?format=jsonp&start=1&count=50&q=' + q.replace('?', '');
        $.ajax({
          url: u,
          dataType: 'jsonp',
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
  };

  /*

        subjecturi hasAuthority selected.uri
        subjecturi  bf:label selected.value
    */
  exports.getResource = lcshared.getResourceWithAAP;
});
bfe.define('src/lookups/lcgenreforms', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');

  var cache = [];

  exports.scheme = 'http://id.loc.gov/authorities/genreForms';

  exports.source = function (query, process) {
    var scheme = 'http://id.loc.gov/authorities/genreForms';
    var rdftype = 'rdftype:GenreForm';

    var q = '';
    if (scheme !== '' && rdftype !== '') {
      q = 'cs:' + scheme + ' AND ' + rdftype;
    } else if (rdftype !== '') {
      q = rdftype;
    } else if (scheme !== '') {
      q = 'cs:' + scheme;
    }
    if (q !== '') {
      q = q + ' AND (' + query + ' OR ' + query + '* OR *' + query + '*)';
    } else {
      q = '(' + query + ' OR ' + query + '* OR *' + query + '*)';
    }
    console.log('q is ' + q);
    q = encodeURI(q);

    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      console.log('searching defined');
      clearTimeout(this.searching);
      process([]);
    }
    // lcgft
    this.searching = setTimeout(function () {
      if (query.length > 2 && !query.match(/[Gg][A-z]?\d/)) {
        suggestquery = query;
        if (rdftype !== '') { suggestquery += '&rdftype=' + rdftype.replace('rdftype:', ''); }

        u = scheme + '/suggest/?q=' + suggestquery;

        // u = "http://id.loc.gov/authorities/genreForms/suggest/?q=" + query;
        $.ajax({
          url: u,
          dataType: 'jsonp',
          success: function (data) {
            parsedlist = lcshared.processSuggestions(data, query);
            cache[q] = parsedlist;
            return process(parsedlist);
          }

        });
      } /* else if (query.length > 2 && query.match(/[Gg][A-z]?\d/)) {
        u = 'http://id.loc.gov/search/?q=cs:http://id.loc.gov/authorities/genreForms%20AND%20(' + query + ')&start=1&format=atom';
        $.ajax({
          url: u,
          dataType: 'jsonp',
          success: function (data) {
            parsedlist = lcshared.processATOM(data, query);
            cache[q] = parsedlist;
            return process(parsedlist);
          }
        });
      } */ else {
        return [];
      }
    }, 300); // 300 ms
  };

  exports.getResource = lcshared.getResourceWithAAP;
});

bfe.define('src/lookups/rdaformatnotemus', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/FormatNoteMus';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdamediatype', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/RDAMediaType';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdamodeissue', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/ModeIssue';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdacarriertype', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/RDACarrierType';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdacontenttype', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/RDAContentType';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdafrequency', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/frequency';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdaaspectration', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/AspectRatio';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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
bfe.define('src/lookups/rdageneration', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];
  exports.scheme = 'http://rdaregistry.info/termList/RDAGeneration';

  exports.source = function (query, process) {
    console.log('q is ' + query);
    q = encodeURI(query);
    if (cache[q]) {
      process(cache[q]);
      return;
    }
    if (typeof this.searching !== 'undefined') {
      clearTimeout(this.searching);
      process([]);
    }

    this.searching = setTimeout(function () {
      if (query === '' || query === ' ') {
        u = exports.scheme + '.json-ld';
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
            return process(parsedlist);
          }
        });
      } else if (query.length > 1) {
        u = exports.scheme + '.json-ld';
        console.log(u);
        $.ajax({
          url: u,
          dataType: 'json',
          success: function (data) {
            parsedlist = lcshared.processJSONLDSuggestions(data, query, exports.scheme);
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

bfe.define('src/lookups/lcorganizations', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];

  exports.scheme = 'http://id.loc.gov/vocabulary/organizations';

  exports.source = function (query, process) {
    return lcshared.simpleQuery(query, cache, exports.scheme, process);
  };

  exports.getResource = lcshared.getResourceWithAAP;
});

bfe.define('src/lookups/relators', ['require', 'exports', 'module', 'src/lookups/lcshared'], function (require, exports, module) {
  var lcshared = require('src/lookups/lcshared');
  var cache = [];

  exports.scheme = 'http://id.loc.gov/vocabulary/relators';

  exports.source = function (query, process) {
    return lcshared.simpleQuery(query, cache, exports.scheme, process);
  };

  exports.getResource = lcshared.getResource;
});

/* *
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
bfe.define('src/lib/aceconfig', ['require', 'exports', 'module'], function (require, exports, module) {
  var global = (function () {
    return this;
  })();

  var options = {
    packaged: false,
    workerPath: null,
    modePath: null,
    themePath: null,
    basePath: '',
    suffix: '.js',
    $moduleUrls: {}
  };

  exports.set = function (key, value) {
    if (!options.hasOwnProperty(key)) { throw new Error('Unknown config key: ' + key); }

    options[key] = value;
  };

  // initialization
  function init (packaged) {
    options.packaged = packaged || require.packaged || module.packaged || (global.define && define.packaged);

    if (!global.document) { return ''; }

    var scriptOptions = {};
    var scriptUrl = '';

    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];

      var src = script.src || script.getAttribute('src');
      if (!src) { continue; }

      var attributes = script.attributes;
      for (var j = 0, l = attributes.length; j < l; j++) {
        var attr = attributes[j];
        if (attr.name.indexOf('data-ace-') === 0) {
          scriptOptions[deHyphenate(attr.name.replace(/^data-ace-/, ''))] = attr.value;
        }
      }

      var m = src.match(/^(.*)\/ace(\-\w+)?\.js(\?|$)/);
      if (m) { scriptUrl = m[1]; }
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

    for (var key in scriptOptions) {
      if (typeof scriptOptions[key] !== 'undefined') { exports.set(key, scriptOptions[key]); }
    }
  }

  exports.init = init;

  function deHyphenate (str) {
    return str.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase();
    });
  }
});
/*
 * @deprecated v0.2.0
 */
(function () {
  bfe.require(['src/bfe'], function (a) {
    console.log(a);
    a && a.aceconfig.init();
    if (!window.bfe) { window.bfe = {}; }
    for (var key in a) {
      if (a.hasOwnProperty(key)) { bfe[key] = a[key]; }
    }
  });
})();
