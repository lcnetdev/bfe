bfe.define('src/bfe', ['require', 'exports', 'src/bfestore', 'src/bfelogging', 'src/bfeapi', 'src/lib/aceconfig'], function (require, exports) {
  var editorconfig = {};
  var bfestore = require('src/bfestore');
  var bfelog = require('src/bfelogging');
  var bfeapi = require('src/bfeapi');
  var bfeusertemplates = require('src/bfeusertemplates');
  var bfeliterallang = require('src/bfeliterallang');
  
  // By default, we will version the resource upon first save.
  // If the resource is new - meaning never added to the database - the version
  // preference is ignored in ldpjs.
  var createVersion = 1;

  // var store = new rdfstore.Store();
  var profiles = [];
  var resourceTemplates = [];
  var addFields = [];
  var addedProperties = [];
  // var startingPoints = [];
  // var formTemplates = [];
  // var lookups = [];
  
  // holds the last two weeks of data
  var twoWeeksOfData = [];
  // holds the rest of it
  var twoWeeksPlusOfData = [];
  var browseloaded = false;

  var dataTable = null;
  
  var tabIndices = 1;

    // Lint check
  //var loadtemplates = [];
  var loadtemplatesANDlookupsCount = 0;
  var loadtemplatesANDlookupsCounter = 0;

  // var lookupstore = [];
  // var lookupcache = [];

  var entryfunc = null;
  var editordiv;

  // var csrf;

  var forms = [];

  var lookups = {
    'http://id.loc.gov/authorities/names': {
      'name': 'LCNAF',
      'load': require('src/lookups/lcnames')
    },
    'http://id.loc.gov/rwo/agents': {
      'name': 'LC-Agents',
      'load': require('src/lookups/agents')
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
    /*
        Note: organizations and relators were commented out in postingchanges.
    */
    /*
    'http://id.loc.gov/vocabulary/organizations': {
      'name': 'Organizations',
      'load': require('src/lookups/lcorganizations')
    },
    'http://id.loc.gov/vocabulary/relators': {
      'name': 'Relators',
      'load': require('src/lookups/relators')
    },
    */
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
    },
    'https://lookup.ld4l.org/authorities/search/linked_data/getty_aat_ld4l_cache': {
      'name': 'QA-Getty',
      'load': require('src/lookups/qagetty')
    },
    'http://mlvlp04.loc.gov:3000/verso/api/configs?filter[where][configType]=noteTypes&filter[fields][json]=true': {
      'name': 'NoteType',
      'load': require('src/lookups/notetype')
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
      
        if (config.enableUserTemplates === undefined) {
            config.enableUserTemplates = true;
        }
        if (config.enableCloning === undefined) {
            config.enableCloning = true;
        }
        if (config.enableAddProperty === undefined) {
            config.enableAddProperty = true;
        }
        
    editorconfig = config;

    // Set up logging
    bfelog.init(editorconfig);
    
    // pass the config to the usertemplates so it can disable templates if localstorage is not available
    bfeusertemplates.setConfig(editorconfig);
    
    bfeliterallang.loadData(editorconfig);

    //setup callbacks
    editorconfig.api.forEach(function (apiName) {
      editorconfig[apiName] = {};
      editorconfig[apiName].callback = bfeapi[apiName];
    });

    /**
     * Profiles are expected to be in the form provided by Verso:
     * A JSON Array of objects with a "json" property that contains the profile proper
     **/
    for (var i = 0; i < config.profiles.length; i++) {
      var file = config.profiles[i];
      bfelog.addMsg(new Error(), 'DEBUG', 'Attempting to load profile: ' + file);
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
                }
                bfelog.addMsg(new Error(), 'INFO', 'Loaded profile: ' + data[j].name);
              }
                if (editorconfig.load) {
                    editorconfig.load.callback(config, bfestore, cbLoadTemplates);
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

    /*
    // This was active in postingchanges, but missing from decouplment.
    // Think it has been moved to bfeapi, but keep around just in case.
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
    */
  };

  exports.loadBrowseData = function($browsediv){
      
      createVersion = 1;
    
    var loadData = function(){
      if (browseloaded){
        return true;
      }

        browseloaded = true;

      $.get( config.url + '/api/list', function( data ) {
        $('#table_id td').html('<h4><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>&nbsp;&nbsp;Processing Data</span></h4>');
        
        twoWeeksOfData = [];
        twoWeeksPlusOfData = [];

        // Populate the table and save the data
        data.forEach(function(d){
            twoWeeksOfData.push(d);
            dataTable.row.add(d);
         });
        dataTable.draw(false);
        
        var $addDataStatusDiv = $("<div>").text("Only data from the last two weeks is displayed: ").attr('id','two-week-plus-div').addClass('pull-left').css({'padding-right':'20px','line-height':'26px'});
        var $addLastTwoWeeksDataButton = $("<button>").text("Show Last Two Weeks").addClass('btn btn-basic btn-xs');
        var $addTwoWeekPlusDataButton = $("<button>").text("Show Last Month of Descriptions").addClass('btn btn-basic btn-xs');
        var $addUnpostedDataButton = $("<button>").text("Unposted Only").addClass('btn btn-basic btn-xs');

        var lastTwoWeeksClick = function(){
          dataTable.clear().draw();
          $('#table_id td').html('<h4><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>&nbsp;&nbsp;Processing Data</span></h4>');
          $addDataStatusDiv.text("Loading...");
          window.setTimeout(function(){
            twoWeeksOfData.forEach(function(d){
              dataTable.row.add(d);
            });
            dataTable.draw(false);
            $addDataStatusDiv.text("Only data from the last two weeks is displayed:");
            $addDataStatusDiv.append($addUnpostedDataButton); 
            $addUnpostedDataButton.click(unpostedClick); 
            $addDataStatusDiv.append($("<span>").css({'margin':'0 .2em'}));
            $addDataStatusDiv.append($addTwoWeekPlusDataButton)
            $addTwoWeekPlusDataButton.click(lastTwoWeeksPlusClick);
          },500)
        }

        var lastTwoWeeksPlusClick = function(){
            dataTable.clear().draw();
            $addDataStatusDiv.text("Loading...");
            if (twoWeeksPlusOfData.length > 0) {
                window.setTimeout(function(){
                    twoWeeksPlusOfData.forEach(function(d){
                        dataTable.row.add(d);
                    });
                    dataTable.draw(false);
                    $addDataStatusDiv.text('All descriptions');
                    $addLastTwoWeeksDataButton.off('click');
                    $addLastTwoWeeksDataButton.click(lastTwoWeeksClick);
                    $addDataStatusDiv.append($addLastTwoWeeksDataButton);
                },500)
            } else {
                $('#table_id td').html('<h4><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>&nbsp;&nbsp;Loading Data</span></h4>');
                $.get( config.url + '/api/list?daysago=30', function( data ) {
                    data.forEach(function(d){
                        dataTable.row.add(d);
                        twoWeeksPlusOfData.push(d);
                    });
                    dataTable.draw(false);
                    $addDataStatusDiv.text('Viewing last 30 days of descriptions');
                    $addLastTwoWeeksDataButton.off('click');
                    $addLastTwoWeeksDataButton.click(lastTwoWeeksClick);
                    $addDataStatusDiv.append($addLastTwoWeeksDataButton);
                });
            }
        }

        var unpostedClick = function(){
          $addDataStatusDiv.text('Loading ...');
          dataTable.clear().draw();
          $('#table_id td').html('<h4><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>&nbsp;&nbsp;Processing Data</span></h4>');
          window.setTimeout(function(){
            twoWeeksOfData.concat(twoWeeksPlusOfData).forEach(function(d){
              //if(_.isEmpty(d.status) || d.status != 'success')
              if(d.status === 'published')
                dataTable.row.add(d);
            });
            dataTable.draw(false);
            $addDataStatusDiv.text("Only unposted displayed:");
            $addLastTwoWeeksDataButton.off('click');
            $addLastTwoWeeksDataButton.click(lastTwoWeeksClick);
            $addDataStatusDiv.append($addLastTwoWeeksDataButton); 
          },500)
        }

        ///verso/api/bfs?filter[where][status][nlike]=success
        
        $addUnpostedDataButton.click(unpostedClick); 
        $addTwoWeekPlusDataButton.click(lastTwoWeeksPlusClick);
        $addLastTwoWeeksDataButton.click(lastTwoWeeksClick);
        $addDataStatusDiv.append($addUnpostedDataButton); 
        $addDataStatusDiv.append($("<span>").css({'margin':'0 .2em'}));
        $addDataStatusDiv.append($addTwoWeekPlusDataButton);          
        $("#table_id_filter").append($addDataStatusDiv);

        $("#table_id_filter label").show();
        $('[type="search"]').prop("disabled", false);
        
        if (window.location.hash !== '') {
          $('#table_id').DataTable().search(window.location.hash.split('#')[1]).draw();
        }

      });
  
    }

      /* eslint-disable no-unused-vars */
    if (!$.fn.dataTable.isDataTable('#table_id')) {
      var $datatable = $('<table id="table_id" class="display" style="table-layout: fixed"><thead><tr><th>id</th><th>primary contribution</th><th>title</th><th>LCCN</th><th>Cataloger Id</th><th>modified</th><th>edit</th></tr></thead></table>');
      $(function () {
        dataTable = $('#table_id').DataTable({
          'initComplete': function (settings, json) {
              
            //disable the search box
            $('[type="search"]').prop("disabled", true);
            $("#table_id_filter label").hide()
            $('#table_id').DataTable().search

            var urlParams = new URLSearchParams(window.location.search)
            if (urlParams.has('action')) {
              var action = urlParams.get('action');
              var $actiontab = $('a[href="#' + action + '"]')
              $actiontab.tab('show');
              var url = urlParams.get('url');
              $('#bfeditor-' + action + 'uriInput').val(url)
            }
            $("#table_id_length > label > select").attr("class", "selectpicker");
            $("#table_id_length > label > select").attr("data-width", "fit");
          },
          'processing': true,
          'paging': true,
          // 'ajax': {
            // 'url': config.url + '/verso/api/bfs?filter[limit]=1',
            // 'dataSrc': '',
            // 'headers': {
              // 'Access-Control-Allow-Origin': '*',
              // // 'Content-Type': 'application/json',
              // //'Accept': 'application/json',
              // 'Access-Control-Allow-Methods': 'DELETE, HEAD, GET, OPTIONS, POST, PUT',
              // 'Access-Control-Allow-Headers': 'Content-Type, Content-Range, Content-Disposition, Content-Description',
              // 'Access-Control-Max-Age': '1728000'
            // }
          // },
          "order": [[5, "desc"]],
          // id
          'columns': [
            //{
            //  'data': 'id'
            //},
            // name
            {
              'data': 'name',
              'width': '85px',
              'className': 'column-identifier', 
              'render': function (data, type, full, meta) {
                try {
                  var retval = mintResource(data);

                  if (retval === 'eundefined') {
                    retval = data;
                  }
                } catch (e) {
                  retval = data;
                }

                return retval.substring(0,8);
              }
            },
            //contribution
            {
              'data': 'rdf',
              'className': 'column-contribution',
              'width': '15%',
              'render': function (data, type, full, meta) {
                return full.contribution;
              }
            },
            // title
            {
              'data': 'rdf',
              'className': 'column-title',
              'render': function (data, type, full, meta) {
                var retval;
                var altretval;
                return full.title;
              }
            },
            // lccn
            {
              'data': 'rdf',
              'width': '85px',
              'className': 'column-identifier', 
              'render': function (data, type, full, meta) {
                var text = full.lccn;
                var ldsanchor = text.trim();

                // console.log(full.id);
                if (full.status === 'published' || full.status === 'success') {
                  if(!_.isEmpty(config.basedbURI)){
                    //if(_.isEmpty(full.objid) || text !== 'N/A'){
                    //  full.objid  = 'loc.natlib.instances.e' + text.trim() + '0001';
                    //  if (text.trim().startsWith('n')) {
                    //    full.objid = 'loc.natlib.works.' + text.trim().replace(/\s+/g, '');//
                    //  }
                    //}
                    if (full.objid){
                        
                      if (full.objid.charAt(0)=='/'){
                        ldsanchor = '<a href="' + config.basedbURI + full.objid + '">' + text + '</a>';

                      }else{
                        ldsanchor = '<a href="' + config.basedbURI + '/' + full.objid + '">' + text + '</a>';
                        
                      }
                    }
                  } 

                  var table = new $.fn.dataTable.Api(meta.settings);
                  var cell = table.cell(meta.row, meta.col);
                  cell.node().innerHTML = ldsanchor;
                  if (full.status === 'success') {
                    $(cell.node()).css('background-color', 'lightgreen');
                  } else {
                    if (new Date(new Date(full.modified).getTime() + 120000) > new Date()) {
                      $(cell.node()).css('background-color', 'yellow');
                    } else {
                      $(cell.node()).css('background-color', 'lightcoral');
                    }
                  }
                }
                return text;
              }
            },
            //cataloger id
            {
              'data': 'rdf',
              'width': '85px',
              'className': 'column-identifier', 
              'render': function (data, type, full, meta) {
                return full.catalogerid.length > 60 ? full.catalogerid.substr(0, 58) + '...' : full.catalogerid;
              }
            },
            //modified
            {
              'data': 'modified',
              'className': 'column-modified',
              'width': '130px',
              'render': function (data, type, row) {
                if (type === 'display') {
                  return moment(data).format("M-DD-YYYY h:mm a");
                } else {
                  return parseInt(moment(data).format("YYYYMMDDHHmm"));
                }
              }
            },
            //edit
            {
              'data': 'name',
              'className': 'column-identifier',
              'width': '85px',
              'searchable': false,
              'filterable': false,
              'sortable': false,
              'render': function (td, cellData, rowData, row) {
                //             return '<a href="'+data+'">edit</a>';

                return '<div class="btn-group" id="retrieve-btn"><button id="bfeditor-retrieve' + rowData.name + '" type="button" class="btn btn-default"><span class="glyphicon glyphicon-pencil"></span></button> \
                               <button id="bfeditor-delete' + rowData.name + '"type="button" class="btn btn-danger" data-toggle="modal" data-target="#bfeditor-deleteConfirm' + rowData.name + '"><span class="glyphicon glyphicon-trash"></span></button> \
                               </div>';
              },
              'createdCell': function (td, cellData, rowData, row, col) {
                if (rowData.status === 'success' || rowData.status === 'published') { $(td).find('#bfeditor-delete' + rowData.name).attr('disabled', 'disabled'); }

                var useguid = shortUUID(guid());
                var loadtemplate = {};
                var tempstore = [];
                var spoints;
                //bfestore.store = [];
                //bfestore.loadtemplates = [];

                // default
                // var spoints = editorconfig.startingPoints[0].menuItems[0];

                //if (rowData.profile !== 'lc:RT:bf2:Load:Work' && rowData.profile !== 'lc:RT:bf2:IBC:Instance') {
                if ( _(editorconfig.startingPoints).chain().find({
                    menuItems: [{
                      useResourceTemplates: [rowData.profile]
                    }]
                  }).value() !== undefined ) {
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
                } else if (rowData.profile.endsWith('Work')) {
                  spoints = {
                    label: 'Loaded Work',
                    type: ['http://id.loc.gov/ontologies/bibframe/Work'],
                    useResourceTemplates: ['lc:RT:bf2:Monograph:Work']
                  };
                } else if (rowData.profile.endsWith('Instance')) {
                  spoints = {
                    label: 'IBC',
                    type: ['http://id.loc.gov/ontologies/bibframe/Instance'],
                    useResourceTemplates: ['lc:RT:bf2:Monograph:Instance']
                  };
                }

                var temptemplates = [];
                spoints.useResourceTemplates.forEach(function (l) {
                  var useguid = shortUUID(guid());
                  var loadtemplate = {};
                  loadtemplate.templateGUID = rowData.name;
                  loadtemplate.resourceTemplateID = l;
                  loadtemplate.embedType = 'page';
                  loadtemplate.data = [];
                  temptemplates.push(loadtemplate);
                });

                $(td).find('#bfeditor-retrieve' + rowData.name).click(function () {
                  if (editorconfig.retrieve !== undefined) {
                    // loadtemplates = temptemplates;
                    bfestore.loadtemplates = temptemplates;
                    // editorconfig.retrieve.callback(cellData,bfestore, bfelog, cbLoadTemplates);
                    bfestore.store = [];
                    bfestore.state = 'edit';
                    tempstore = bfeapi.getStoredJSONLD(config, rowData.name, bfestore.jsonld2store);
                    bfestore.name = rowData.name;
                    bfestore.created = rowData.created;
                    bfestore.url = rowData.url;
                    bfestore.profile = rowData.profile;

                    // Taking postingchanges here.  decouplement had just "(profiles, ..."
                    var parent = _.find(profiles, function (post) {
                      if (_.some(post.Profile.resourceTemplates, { id: bfestore.profile }))
                      { return post; }
                    });

                    if (!_.isEmpty(rowData.addedProperties))
                      addedProperties = rowData.addedproperties;

                    $('#profileLabel').text(parent.Profile.title + ' ' + _.last(bfestore.profile.split(':')));

                    bfe.exitButtons(editorconfig);
                    
                    cbLoadTemplates();
                    window.location.hash = mintResource(rowData.name).substring(0,8);
                  } else {
                    // retrieve disabled
                    addedProperties = [];
                  }
                });

                $(td).append($('<div class="modal fade" id="bfeditor-deleteConfirm' + rowData.name + '" role="dialog"><div class="modal-dialog modal-sm"><div class="modal-content"> \
                              <div class="modal-body"><h4>Delete?</h4></div>\
                              <div class="modal-footer"><button type="button" class="btn btn-default" id="bfeditor-modalCancel" data-dismiss="modal">Cancel</button> \
                              <button type="button" id="bfeditor-deleteConfirmButton' + rowData.name + '" class="btn btn-danger btn-ok" data-dismiss="modal">Delete</button></div></div></div></div></div>'));

                $(td).find('#bfeditor-deleteConfirmButton' + rowData.name).click(function () {
                  if (editorconfig.deleteId !== undefined) {
                    editorconfig.deleteId.callback(rowData.name, bfelog);
                    //var table = $('#table_id').DataTable();
                    // table.row($(this).parents('tr')).remove().draw();
                    bfestore.store = [];
                    // table.ajax.reload();
                  } else {
                    // delete disabled
                    $('#bfeditor-formdiv').empty();

                    // Taking postingchanges here.  decouplement had bfestore.store
                    bfeditor.bfestore.store = [];
                    exports.loadBrowseData()
                    var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-info' });
                    $messagediv.append('<span class="str"><h3>Delete disabled</h3></span>');
                    $messagediv.insertBefore('.nav-tabs');
                    $('#bfeditor-previewPanel').remove();
                    $('[href=\\#browse]').tab('show');
                  }
                });

                $(td).find('#bfeditor-deleteConfirm' + rowData.name).on('hidden.bs.modal', function () {
                  var table = $('#table_id').DataTable();
                  bfestore.store = [];
                  // table.ajax.reload();
                  exports.loadBrowseData();
                });
              }
            }
          ]
        });
        
        // the datatable is initialized add a status message
        $('#table_id td').html('<h4><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>&nbsp;&nbsp;Loading Data</span></h4>');
        loadData();
        browseloaded = false;
      });

      $browsediv.append($datatable);
    }else{
      // the table already exists, clear it out
      dataTable.clear();
      dataTable.draw(false);
      $('#table_id td').html('<h4><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span><span>&nbsp;&nbsp;Loading Data</span></h4>');
      $("#two-week-plus-div").remove();
      loadData();
      browseloaded = false;
      $("#table_id_filter label").hide();
    }
    /* eslint-enable no-unused-vars */
  
  }
  
  exports.exitButtons = function (editorconfig){

    //clear form
    $('[href=\\#create]').tab('show');
    $('#bfeditor-formdiv').show();
    $('#cloneButtonGroup').remove();
    $('#exitButtonGroup').remove();
    $('#bfeditor-previewPanel').remove();
    $('.alert').remove();
        
    //$('#bfeditor-formdiv').empty();
   
    var $exitButtonGroup = $('<div class="btn-group" id="exitButtonGroup"> \
                      <button id="bfeditor-exitcancel" type="button" class="btn btn-default">Cancel</button> \
                  </div>');

    if (editorconfig.save !== undefined) {
      $exitButtonGroup.append('<button id="bfeditor-exitsave" type="button" class="btn btn-primary">Save</button>');
    }

    if (editorconfig.publish !== undefined) {
      $exitButtonGroup.append('<button id="bfeditor-exitpublish" type="button" class="btn btn-danger">Post</button>');
    }

    $exitButtonGroup.append('<button id="bfeditor-preview" type="button" class="btn btn-warning">Preview</button>');

    $('#bfeditor-menudiv').append($exitButtonGroup);
  }

  exports.lcapplication = function (config, id) {
    entryfunc = "lcapplication";
    this.setConfig(config);
    editordiv = document.getElementById(id);
    var $containerdiv = $('<div class="container-fluid"><h2>Bibframe Editor Workspace</h2></div>');
    var $tabuldiv = $('<div class="tabs"></div>');
    var $tabul = $('<ul class="nav nav-tabs"></ul>');

/*
=== ====
  exports.fulleditor = function (config, id) {
    this.setConfig(config);
    editordiv = document.getElementById(id);
    var $containerdiv = $('<div class="container-fluid"></div>');
    var $tabuldiv = $('<div class="tabs "></div>');
    var $tabul = $('<ul class="nav nav-tabs"></ul>');

    var $tabcontentdiv = $('<div class="tab-content"></div>');
    var $browsediv = $('<div id="browse" class="tab-pane fade in active"><br></div>');
    var $creatediv = $('<div id="create" class="tab-pane fade"><br></div>');
    var $loadworkdiv = $('<div id="loadwork" class="tab-pane fade"><br></div>');
    var $loadibcdiv = $('<div id="loadibc" class="tab-pane fade"><br></div>');
    var $loadmarcdiv = $('<div id="loadmarc" class="tab-pane fade"><br></div>');
    var $loadmergediv = $('<div id="loadmerge" class="tab-pane fade"><br></div>');

    var $browseTab = $('<li class="active"><a data-toggle="tab" id="browsetab" href="#browse">Browse</a></li>');
    $browseTab.click(function(){
      exports.loadBrowseData();
    })

    $tabul.append($browseTab);
>>>> >>> aws
*/    
    var $browseTab = $('<li class="active"><a data-toggle="tab" id="browsetab" href="#browse">Browse</a></li>');
    $browseTab.click(function(){
      exports.loadBrowseData();
    })
    $tabul.append($browseTab);
    $tabul.append('<li><a data-toggle="tab" id="createtab" href="#create">Editor</a></li>');
    $tabul.append('<li><a data-toggle="tab" id="loadworktab" href="#loadwork">Load Work</a></li>');
    $tabul.append('<li><a data-toggle="tab" id="loadibctab" href="#loadibc">Load IBC</a></li>');
    if(editorconfig.enableLoadMarc) {
      $tabul.append('<li><a data-toggle="tab" id="loadmarctab" href="#loadmarc">Load MARC</a></li>');
      //$tabul.append('<li><a data-toggle="tab" id="loadmergetab" href="#loadmerge">Merge OCLC</a></li>');
    }
    if(!_.isEmpty(editorconfig.basedbURI)){
      $tabul.append('<ul class="nav navbar-nav navbar-right"><li class="divider"></li> \
        <a href="' + editorconfig.basedbURI + '">» Search BIBFRAME database</a> </ul>')
    }
    $tabuldiv.append($tabul);
    $containerdiv.append($tabuldiv);

    var $tabcontentdiv = $('<div class="tab-content"></div>');
    var $browsediv = $('<div id="browse" class="tab-pane fade in active"><br></div>');
    var $creatediv = $('<div id="create" class="tab-pane fade"><br></div>');
    var $loadworkdiv = $('<div id="loadwork" class="tab-pane fade"><br></div>');
    var $loadibcdiv = $('<div id="loadibc" class="tab-pane fade"><br></div>');
    var $loadmarcdiv = $('<div id="loadmarc" class="tab-pane fade"><br></div>');
    var $loadmergediv = $('<div id="loadmerge" class="tab-pane fade"><br></div>');
    
    exports.loadBrowseData($browsediv);
/*
=== ====
    var $menudiv = $('<div>', {
      id: 'bfeditor-menudiv',
      class: 'navbar navbar-expand-lg navbar-light bg-light col-md-10'
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

    $formdiv.append($loader);
    exports.loadBrowseData($browsediv);
    //$menudiv.append('<h3>Create Resource</h3>');
    $menudiv.append('<span id="profileLabel" style="display: none"></span>');

    var $createResourcediv = $('<div class="dropdown pull-left" style="padding-right: 10px">');
    var $createResourceButton = $('<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" data-target=".dropdown-collapse">\
    <span class="glyphicon glyphicon-plus"></span> Create Resource </span></button>');
    
    $createResourcediv.append($createResourceButton);
    $menudiv.append($createResourcediv);

    $rowdiv.append($menudiv);
    $rowdiv.append($formdiv);

    $creatediv.append($rowdiv);

    var $createResourcemenuul = $('<ul id="createResourcemenuul" class="dropdown-menu"></ul>');
>>> >>>> aws
*/

    var $loadworkform = $('<div class="container"> \
              <form role="form" method="get"> \
              <div class="form-group"> \
              <label for="url">URL for Bibframe JSON Work</label> \
              <input id="bfeditor-loadworkuriInput" class="form-control" placeholder="Enter URL for Bibframe" type="text" name="url" id="url"> \
              <div id="bfeditor-loadwork-dropdown" class="dropdown"><select id="bfeditor-loadwork-dropdownMenu" type="select" class="form-control">Select Profile</select> \
              </div></div> \
              <button id="bfeditor-loadworkuri" type="button" class="btn btn-primary" disabled=disabled>Submit URL</button> \
              </form></div>')

    var $loadibcform = $('<div class="container"> \
              <form role="form" method="get"> \
              <div class="form-group"> \
              <label for="url">URL for Bibframe JSON</label> \
              <input id="bfeditor-loadibcuriInput" class="form-control" placeholder="Enter URL for Bibframe" type="text" name="url" id="url"> \
              <div id="bfeditor-loadibc-dropdown" class="dropdown"><select id="bfeditor-loadibc-dropdownMenu" type="select" class="form-control">Select Profile</select> \
              </div></div> \
              <button id="bfeditor-loadibcuri" type="button" class="btn btn-primary" disabled=disabled>Submit URL</button> \
              </form></div>');

    // Can this be moved out of there somehow?  It's repeated in fulleditor too.
    editorconfig.setStartingPoints.callback(config, function () {
        var getProfileOptions = 
           function (jqObject, elementType) {
            for (var h = 0; h < editorconfig.startingPoints.length; h++) {
              var sp = editorconfig.startingPoints[h];
              var label = sp.menuGroup
              for (var i = 0; i < sp.menuItems.length; i++) {
                var $option = $('<option>', {
                  class: 'dropdown-item',
                  value: 'sp-' + h + '_' + i
                });
                if (sp.menuItems[i].type[0] === elementType) {
                  $option.html(label);
                  jqObject.append($option);
                }
              }
            }
          }
          $(function(){
            $('.dropdown-submenu>a').unbind('click').click(function(e){
              var $openmenu = $('#createresourcesubmenuul.open');
              $openmenu.hide();
              $openmenu.removeClass('open');
              var $dropdown = $(this).next('ul');
              $dropdown.addClass('open');
              $dropdown.toggle();
              e.stopPropagation();
              e.preventDefault();
            });
          });

/*
=== ====
    
    editorconfig.setStartingPoints.callback(config, function (config) {
      for (var h = 0; h < config.startingPoints.length; h++) {
        var sp = config.startingPoints[h];
        //var $menuul = $('<ul>', {
        //  class: 'nav nav-sidebar'
        //});
        
        //var $menuheadingul = null;
        var $createResourcesubmenuul = null;
        if (typeof sp.menuGroup !== undefined && sp.menuGroup !== '') {
          //var $menuheading = $('<li><a class="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">' + sp.menuGroup + '<span class="caret"></span></a></li>');
          var $createResourcesubmenu =  $('<li class="dropdown-submenu"><a class="test" href="#">' + sp.menuGroup + '<span class="caret-right"></span></a></li>');
          
          $createResourcesubmenuul = $('<ul id="createresourcesubmenuul" class="dropdown-menu"></ul>');
          //$menuheadingul = $('<ul class="dropdown-menu"></ul>');

          //$menuheading.append($menuheadingul);
          $createResourcesubmenu.append($createResourcesubmenuul);
          
          $createResourcemenuul.append($createResourcesubmenu)
          //$menuul.append($menuheading);
        }
        for (var i = 0; i < sp.menuItems.length; i++) {
          var $li = $('<li>');
          var $a = $('<a>', {
            href: '#',
            id: 'sp-' + h + '_' + i,
            class: "test",
            tabindex: "-1"
          });
          $a.html(sp.menuItems[i].label);
          $a.click(function (event) {
            var profile = $($(event.target.parentElement.parentElement.parentElement).contents()[0]).text();
            $('#createresourcesubmenuul.open').hide();
            $('#createresourcesubmenuul.open').removeClass('open');
            $('#profileLabel').text(profile + ":" + event.target.text);
            
            bfe.exitButtons(editorconfig);

            menuSelect(this.id);
          });
          $li.append($a);

          if ($createResourcesubmenuul !== null) {
            $createResourcesubmenuul.append($li)
          } else {
            $createResourcemenuul.append($li)
          }
        }
        $createResourcediv.append($createResourcemenuul);

      }

      var getProfileOptions = 
       function (jqObject, elementType) {
        for (var h = 0; h < config.startingPoints.length; h++) {
          var sp = config.startingPoints[h];
          var label = sp.menuGroup
          for (var i = 0; i < sp.menuItems.length; i++) {
            var $option = $('<option>', {
              class: 'dropdown-item',
              value: 'sp-' + h + '_' + i
            });
            if (sp.menuItems[i].type[0] === elementType) {
              $option.html(label);
              jqObject.append($option);
            }
          }
        }
      }
      $(function(){
        $('.dropdown-submenu>a').unbind('click').click(function(e){
          var $openmenu = $('#createresourcesubmenuul.open');
          $openmenu.hide();
          $openmenu.removeClass('open');
          var $dropdown = $(this).next('ul');
          $dropdown.addClass('open');
          $dropdown.toggle();
          e.stopPropagation();
          e.preventDefault();
        });
      });
>>> >>>> aws
*/

      getProfileOptions($loadworkform.find('#bfeditor-loadwork-dropdownMenu'), "http://id.loc.gov/ontologies/bibframe/Work");
      getProfileOptions($loadmarcdiv.find('#bfeditor-loadmarc-dropdownMenu'), "http://id.loc.gov/ontologies/bibframe/Work");
      getProfileOptions($loadibcform.find('#bfeditor-loadibc-dropdownMenu'), "http://id.loc.gov/ontologies/bibframe/Instance");
      getProfileOptions($loadmergediv.find('#bfeditor-loadmerge-dropdownMenu'), "http://id.loc.gov/ontologies/bibframe/Instance");

    });

    $loadworkdiv.append($loadworkform);

    $loadworkdiv.find('#bfeditor-loadworkuri').click(function () {
      // var loadtemplates = [];

      // var spoints = { label: 'Loaded Work',
      //   type: ['http://id.loc.gov/ontologies/bibframe/Work'],
      //   useResourceTemplates: ['profile:bf2:Monograph:Work']
      // };

      var spid = $(this.parentElement).find('#bfeditor-loadwork-dropdownMenu').val();
      var label = $(this.parentElement).find('#bfeditor-loadwork-dropdownMenu option:selected').text();
      $('#profileLabel').text(label + ":Work");

      var spnums = spid.replace('sp-', '').split('_');

      var spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];

      bfestore.store = [];
      bfestore.name = guid();
      bfestore.created = new Date().toUTCString();
      // Below is unused; harmless.
      bfestore.url = config.url + '/ldp/verso/resources/' + bfestore.name;
      bfestore.state = 'loaduri';
      bfestore.profile = spoints.useResourceTemplates[0];
/*
=== ====
      bfeditor.bfestore.store = [];
      bfeditor.bfestore.name = guid();
      bfeditor.bfestore.created = new Date().toUTCString();
      bfeditor.bfestore.url = config.url + '/verso/api/bfs?filter=%7B%22where%22%3A%20%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D%7D';
      bfeditor.bfestore.state = 'loaduri';
      bfeditor.bfestore.profile = spoints.useResourceTemplates[0];
>>>> >>> aws
*/

      var temptemplates = [];
      spoints.useResourceTemplates.forEach(function (l) {
        var useguid = guid();
        var loadtemplate = {};
        loadtemplate.templateGUID = shortUUID(useguid);
        loadtemplate.resourceTemplateID = l;
        loadtemplate.embedType = 'page';
        loadtemplate.data = [];
        temptemplates.push(loadtemplate);
      });

      if (editorconfig.retrieve !== undefined) {
        try {
          bfestore.loadtemplates = temptemplates;
          var url = $(this.parentElement).find('#bfeditor-loadworkuriInput').val();
          editorconfig.retrieve.callback(url, bfestore, bfestore.loadtemplates, function (result) {
            if (result instanceof Error){
              var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
              $messagediv.append('<strong>'+result.message+'</strong>');
              $messagediv.insertBefore('.tabs');
            } else {
              bfestore.cleanJSONLD('update work');

// <<<< <<< HEAD
              bfestore.loadtemplates.data = bfestore.store;

              // Copied this line up.
              bfe.exitButtons(editorconfig);
              
              // weird bnode prob
              _.each(bfestore.store, function (el) {
/*
=== ====
              bfestore.loadtemplates.data = bfeditor.bfestore.store;

              bfe.exitButtons(editorconfig);

              // weird bnode prob
              _.each(bfestore.store, function (el) {
>>>> >>> aws
*/
                if (el.o.startsWith('_:_:')) { el.o = '_:' + el.o.split('_:')[2]; }
              });

              cbLoadTemplates();
            }
          });
        } catch (e) {
          $(this.parentElement).find('#bfeditor-loadworkuriInput').val('An error occured: ' + e.message);
        }
      } else {
        // retrieve disabled
        $('#bfeditor-formdiv').empty();
//<<< <<<< HEAD
        bfestore.store = [];
//==== ===
//        bfeditor.bfestore.store = [];
//>>> >>>> aws
        // $('#table_id').DataTable().ajax.reload();
        exports.loadBrowseData();
        var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-info' });
        $messagediv.append('<strong>Retrieve disabled</strong>');
        $messagediv.insertBefore('.nav-tabs');
        $('#bfeditor-previewPanel').remove();
        $('.nav-tabs a[href="#browse"]').tab('show')
      }
    });

    $loadibcdiv.append($loadibcform);

// <<< <<<< HEAD
    $loadibcdiv.find('#bfeditor-loadibcuri').click(function () {
      // var loadtemplates = [];

      var spid = $(this.parentElement).find('#bfeditor-loadibc-dropdownMenu').val();
      var label = $(this.parentElement).find('#bfeditor-loadibc-dropdownMenu option:selected').text();
      $('#profileLabel').text(label + ":Instance");

      var spnums = spid.replace('sp-', '').split('_');

      var spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];

      bfestore.store = [];
      bfestore.name = guid();
      bfestore.created = new Date().toUTCString();
      bfestore.url = config.url + '/ldp/verso/resources/' + bfestore.name;
      bfestore.state = 'loaduri';
      bfestore.profile = spoints.useResourceTemplates[0];
/*
=== ====
    $loadmarcdiv.append($('<div class="container"> \
              <form role="form" method="get"> \
              <div class="form-group"> \
              <label for="marcdx">Identifier</label> \
              <div class="input-group"> \
              <div class="input-group-btn"> \
              <button type="button" id="marcdx" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Bib ID <span class="caret"></span></button> \
              <ul class="dropdown-menu"> \
              <li><a href="#" id="bibid">Bib ID</a></li> \
              <li><a href="#" id="lccn">LCCN</a></li> \
              <li><a href="#" id="oclc">OCLC</a></li> \
              </ul></div> \
              <input id="bfeditor-loadmarcterm" class="form-control" placeholder="Enter Bib ID, LCCN or OCLC number" type="text" name="url"></div> \
              <input type="hidden" id="loadmarc-uri"></hidden>\
              <label for="bfeditor-loadmarc-dropdown">Choose Profile</label> \
              <div id="bfeditor-loadmarc-dropdown" class="dropdown"><select id="bfeditor-loadmarc-dropdownMenu" type="select" class="form-control">Select Profile</select></div></div> \
              <button id="bfeditor-loadmarc" type="button" class="btn btn-primary">Submit</button> \
              </form></div>'));

    

    $loadmarcdiv.find('.dropdown-menu > li > a').click(function () {
      $('#marcdx').html($(this).text() + ' <span class="caret">');
    });
    $loadmarcdiv.find('#bfeditor-loadmarc').click(function () {
      var term = $('#bfeditor-loadmarcterm').val();
      var dx = 'rec.id';
      var url;

      if ($('#marcdx').text().match(/LCCN/i)) {
        dx = 'bath.lccn';
      }

      if ($('#marcdx').text().match(/OCLC/i)) {
        url = config.url + '/bfe/server/retrieveOCLC?oclcnum='+ term;
      } else {
        url = config.metaproxyURI + dx + '=' + term + '&recordSchema=bibframe2a&maximumRecords=1';
      }
      $('#loadmarc-uri').attr('value', url);
    });

    //merge
    $loadmergediv.append($('<div class="container"> \
              <form role="form" method="get"> \
              <div class="form-group"> \
              <label for="marcdx">Identifier</label> \
              <div class="input-group"> \
              <div class="input-group-btn"> \
              <button type="button" id="mergedx" class="btn btn-default dropdown-toggle" data-toggle="dropdown">OCLC<span class="caret"></span></button> \
              <ul class="dropdown-menu"> \
              <li><a href="#" id="oclc">OCLC</a></li> \
              <li><a href="#" id="bibid">Bib ID</a></li> \
              <li><a href="#" id="lccn">LCCN</a></li> \
              </ul></div> \
              <input id="bfeditor-loadmergeterm" class="form-control" placeholder="Enter OCLC, Bib ID or LCCN" type="text" name="url"></div> \
              <input type="hidden" id="loadmerge-uri"></hidden>\
              <label for="url">URL for Bibframe JSON</label> \
              <input id="bfeditor-loadibcuriInput" class="form-control" placeholder="Enter URL for Bibframe" type="text" name="url" id="url"> \
              <label for="bfeditor-loadmerge-dropdown">Choose Profile</label> \
              <div id="bfeditor-loadmerge-dropdown" class="dropdown"><select id="bfeditor-loadmerge-dropdownMenu" type="select" class="form-control">Select Profile</select></div></div> \
              <button id="bfeditor-loadmerge" type="button" class="btn btn-primary">Submit</button> \
              </form></div>'));

    

    $loadmergediv.find('.dropdown-menu > li > a').click(function () {
      $('#marcdx').html($(this).text() + ' <span class="caret">');
    });

    $loadmergediv.find('#bfeditor-loadmerge').click(function () {
      var term = $('#bfeditor-loadmergeterm').val();
      //var dx = 'rec.id';
      var url;

      //if ($('#mergedx').text().match(/LCCN/i)) {
      //  dx = 'bath.lccn';
      //}

      if ($('#mergedx').text().match(/OCLC/i)) {
        url = config.url + '/bfe/server/retrieveOCLC?oclcnum='+ term;
      } else {
        //url = 'http://lx2.loc.gov:210/LCDB?query=' + dx + '=' + term + '&recordSchema=bibframe2a&maximumRecords=1';
      }
      $('#loadmerge-uri').attr('value', url);
    });

    $tabcontentdiv.append($browsediv);
    $tabcontentdiv.append($creatediv);
    $tabcontentdiv.append($loadworkdiv);
    $tabcontentdiv.append($loadibcdiv);
    $tabcontentdiv.append($loadmarcdiv);
    $tabcontentdiv.append($loadmergediv);

    $tabcontentdiv.find('#bfeditor-loadibcuri, #bfeditor-loadmerge').click(function () {
      // var loadtemplates = [];

      if (this.id == 'bfeditor-loadmerge') {
        var spid = $(this.parentElement).find('#bfeditor-loadmerge-dropdownMenu').val();

        var label = $(this.parentElement).find('#bfeditor-loadmerge-dropdownMenu option:selected').text();
        $('#profileLabel').text(label + ":Instance");

        var spnums = spid.replace('sp-', '').split('_');
        spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
        bfeditor.bfestore.state = 'loadmarc';
      } else {
        spid = $(this.parentElement).find('#bfeditor-loadibc-dropdownMenu').val();
        label = $(this.parentElement).find('#bfeditor-loadibc-dropdownMenu option:selected').text();
        $('#profileLabel').text(label + ":Instance");
  
        spnums = spid.replace('sp-', '').split('_');
  
        var spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
        bfeditor.bfestore.state = 'loaduri';
      }

      bfeditor.bfestore.store = [];
      bfeditor.bfestore.name = guid();
      bfeditor.bfestore.created = new Date().toUTCString();
      bfeditor.bfestore.url = config.url + '/verso/api/bfs?filter=%7B%22where%22%3A%20%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D%7D';
      bfeditor.bfestore.profile = spoints.useResourceTemplates[0];
>>>> >>> aws
*/

      var temptemplates = [];
      spoints.useResourceTemplates.forEach(function (l) {
        var useguid = guid();
        var loadtemplate = {};
        loadtemplate.templateGUID = shortUUID(useguid);
        loadtemplate.resourceTemplateID = l;
        loadtemplate.embedType = 'page';
        loadtemplate.data = [];
        temptemplates.push(loadtemplate);
      });

      if (editorconfig.retrieveLDS !== undefined) {
        try {
          bfestore.loadtemplates = temptemplates;
          var url = $(this.parentElement).find('#bfeditor-loadibcuriInput').val();
          var oclcurl = $(this.parentElement).find('#loadmerge-uri').val();

          if (!url.trim().includes('instance')) {
            var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'main' });
            $messagediv.append('<div class="alert alert-danger" role="alert"><strong>Please choose an instance to load</strong></a></div>');
            $messagediv.insertBefore('.nav-tabs');
          } else {
            editorconfig.retrieveLDS.callback(url, bfestore, bfestore.loadtemplates, bfelog, function (result) {
              if (result instanceof Error){
                var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                $messagediv.append('<strong>'+result.message+'</strong>');
                $messagediv.insertBefore('.tabs');
              } else {
                if(!_.isEmpty(oclcurl)){
                  var tempstore = bfestore.store;
                  var recid = 'c019659532';
                  editorconfig.retrieve.callback(oclcurl, bfestore, bfestore.loadtemplates, recid, bfelog, function (result) {
                    if (result instanceof Error){
                      var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                      $messagediv.append('<strong>'+result.message+'</strong>');
                      $messagediv.insertBefore('.tabs');
                    } else {
                      bfestore.store = bfestore.store.concat(tempstore);
                      //bfestore.storeDedup();
                      bfestore.cleanJSONLD('update instance');
                      bfe.exitButtons(editorconfig);
                      cbLoadTemplates();
                    }
                  });
                } else {
                  bfestore.cleanJSONLD('update instance');
                  bfe.exitButtons(editorconfig);
                  cbLoadTemplates();
                }
              }
            });
          }
        } catch (e) {
          $(this.parentElement).find('#bfeditor-loadworkuriInput').val('An error occured: ' + e.message);
        }
      } else {
        // retrievelds disabled
        $('#bfeditor-formdiv').empty();
//<<<< <<< HEAD
        bfestore.store = [];
//=== ====
//        bfeditor.bfestore.store = [];
//>>> >>>> aws
        // $('#table_id').DataTable().ajax.reload();
        exports.loadBrowseData()
        $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-info' });
        $messagediv.append('<span class="str"><h3>Retrieve disabled</h3></span>');
        $messagediv.insertBefore('.nav-tabs');
        $('#bfeditor-previewPanel').remove();
        $('[href=\\#browse]').tab('show');
      }
    });

    $loadmarcdiv.append($('<div class="container"> \
              <form role="form" method="get"> \
              <div class="form-group"> \
              <label for="marcdx">Identifier</label> \
              <div class="input-group"> \
              <div class="input-group-btn"> \
              <button type="button" id="marcdx" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Bib ID <span class="caret"></span></button> \
              <ul class="dropdown-menu"> \
              <li><a href="#" id="bibid">Bib ID</a></li> \
              <li><a href="#" id="lccn">LCCN</a></li> \
              <li><a href="#" id="oclc">OCLC</a></li> \
              </ul></div> \
              <input id="bfeditor-loadmarcterm" class="form-control" placeholder="Enter Bib ID, LCCN or OCLC number" type="text" name="url"></div> \
              <input type="hidden" id="loadmarc-uri"></hidden>\
              <label for="bfeditor-loadmarc-dropdown">Choose Profile</label> \
              <div id="bfeditor-loadmarc-dropdown" class="dropdown"><select id="bfeditor-loadmarc-dropdownMenu" type="select" class="form-control">Select Profile</select></div></div> \
              <button id="bfeditor-loadmarc" type="button" class="btn btn-primary">Submit</button> \
              </form></div>'));

    

    $loadmarcdiv.find('.dropdown-menu > li > a').click(function () {
      $('#marcdx').html($(this).text() + ' <span class="caret">');
    });
    $loadmarcdiv.find('#bfeditor-loadmarc').click(function () {
      var term = $('#bfeditor-loadmarcterm').val();
      var dx = 'rec.id';
      var url;

      if ($('#marcdx').text().match(/LCCN/i)) {
        dx = 'bath.lccn';
      }

      if ($('#marcdx').text().match(/OCLC/i)) {
        url = config.url + '/bfe/server/retrieveOCLC?oclcnum='+ term;
      } else {
        url = 'http://lx2.loc.gov:210/LCDB?query=' + dx + '=' + term + '&recordSchema=bibframe2a&maximumRecords=1';
      }
      $('#loadmarc-uri').attr('value', url);
    });

    $tabcontentdiv.append($browsediv);
    $tabcontentdiv.append($creatediv);
    $tabcontentdiv.append($loadworkdiv);
    $tabcontentdiv.append($loadibcdiv);
    $tabcontentdiv.append($loadmarcdiv);

    $tabcontentdiv.find('#bfeditor-loaduri, #bfeditor-loadmarc').click(function () {
      var spoints = {};

      if (this.id == 'bfeditor-loadmarc') {
        var spid = $(this.parentElement).find('#bfeditor-loadmarc-dropdownMenu').val();

        var label = $(this.parentElement).find('#bfeditor-loadmarc-dropdownMenu option:selected').text();
        $('#profileLabel').text(label + ":Work");

        var spnums = spid.replace('sp-', '').split('_');
        spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
//<<<< <<< HEAD
        bfestore.state = 'loadmarc';
//=== ====
//        bfeditor.bfestore.state = 'loadmarc';
//>>> >>>> aws
      } else {
        spoints = {
          label: 'Loaded Work',
          type: ['http://id.loc.gov/ontologies/bibframe/Work'],
          useResourceTemplates: ['lc:RT:bf2:Monograph:Work']
        };
//<<<< <<< HEAD
        bfestore.state = 'loaduri';
      }

      bfestore.store = [];
      bfestore.name = guid();
      bfestore.created = new Date().toUTCString();
      bfestore.url = config.url + '/ldp/verso/resources/' + bfestore.name;
      // bfestore.state = 'loaduri';
      bfestore.profile = spoints.useResourceTemplates[0];
/*
==== ===
        bfeditor.bfestore.state = 'loaduri';
      }

      bfeditor.bfestore.store = [];
      bfeditor.bfestore.name = guid();
      bfeditor.bfestore.created = new Date().toUTCString();
      bfeditor.bfestore.url = config.url + '/verso/api/bfs?filter=%7B%22where%22%3A%20%7B%22name%22%3A%20%22' + bfeditor.bfestore.name + '%22%7D%7D';
      // bfeditor.bfestore.state = 'loaduri';
      bfeditor.bfestore.profile = spoints.useResourceTemplates[0];
>>>> >>> aws
*/

      var temptemplates = [];
      spoints.useResourceTemplates.forEach(function (l) {
        var useguid = guid();
        var loadtemplate = {};
        loadtemplate.templateGUID = shortUUID(useguid);
        loadtemplate.resourceTemplateID = l;
        loadtemplate.embedType = 'page';
        loadtemplate.data = [];
        temptemplates.push(loadtemplate);
      });

      if (editorconfig.retrieve.callback !== undefined) {
        try {
          bfestore.loadtemplates = temptemplates;
          var url = $(this.parentElement).find('#bfeditor-loaduriInput, #loadmarc-uri').val();
          editorconfig.retrieve.callback(url, bfestore, bfestore.loadtemplates, function (result) {
            if (result instanceof Error){
              var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
              $messagediv.append('<strong>'+result.message+'</strong>');
              $messagediv.insertBefore('.tabs');
            } else {
              bfestore.cleanJSONLD('external marc');           
              
// <<<<< << HEAD
              bfestore.loadtemplates.data = bfestore.store;
              
              // Copied up from below
              bfe.exitButtons(editorconfig);
              
              $('#bfeditor-formdiv').empty();

              // weird bnode prob
              _.each(bfestore.store, function (el) {
/*
==== ===
              bfestore.loadtemplates.data = bfeditor.bfestore.store;
              
              bfe.exitButtons(editorconfig);

              $('#bfeditor-formdiv').empty();

              // weird bnode prob
              _.each(bfestore.store, function (el) {
>>> >>>> aws
*/
                if (el.o !== undefined && el.o.startsWith('_:_:')) { el.o = '_:' + el.o.split('_:')[2]; }
              });

              cbLoadTemplates();
            }
          });
        } catch (e) {
          $(this.parentElement).find('#bfeditor-loaduriInput').val('An error occured: ' + e.message);
        }
// <<<< <<< HEAD
      } else {
        // retrieve disabled
        $(this.parentElement).find('#bfeditor-loaduriInput').val('This function has been disabled');
      }
    });


    $containerdiv.append($tabcontentdiv);

    $(editordiv).append($containerdiv);
    
    exports.fulleditor(config, "create");

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

    $('a[data-toggle="tab"]').click(function (e) {
      $('.alert').remove();
      bfelog.addMsg(new Error(), 'INFO', e.type + " " + e.target);
    });
    
    $(function(){
      $('#bfeditor-loadworkuri').prop('disabled', false);
      $('#bfeditor-loadibcuri').prop('disabled', false);
    });

    $(window).bind('beforeunload', function(){
      return 'Are you sure you want to leave?';
    });

    return {
      'profiles': profiles,
      'div': editordiv,
      'bfestore': bfestore,
      'bfelog': bfelog
    };
  };




  exports.fulleditor = function (config, id) {
    if (entryfunc === null) {
        entryfunc = "fulleditor";
    }
    this.setConfig(config);
    editordiv = document.getElementById(id);
    
    var $menudiv = $('<div>', {
      id: 'bfeditor-menudiv',
      class: 'navbar navbar-expand-lg navbar-light bg-light col-md-10'
    });
    var $formdiv = $('<div>', {
      id: 'bfeditor-formdiv',
      class: 'col-md-10 main'
    });
    var $rowdiv = $('<div>', {
      class: 'row'
    });

    var $loader = $('<div><br /><br /><h2>Loading...</h2><div class="progress progress-striped active">\
                          <div class="progress-bar progress-bar-info" id="bfeditor-loader" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 20%">\
                              <span class="sr-only">80% Complete</span>\
                          </div>\
                      </div>');

    $formdiv.append($loader);

    $menudiv.append('<span id="profileLabel" style="display: none"></span>');

    var $createResourcediv = $('<div class="dropdown pull-left" style="padding-right: 10px">');
    var $createResourceButton = $('<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" data-target=".dropdown-collapse">\
    <span class="glyphicon glyphicon-plus"></span> Create Resource </span></button>');
    
    $createResourcediv.append($createResourceButton);
    $menudiv.append($createResourcediv);

    $rowdiv.append($menudiv);
    $rowdiv.append($formdiv);

    if ( entryfunc == "fulleditor" ) {
        // Preview is dependent on a div with an id=create.
        var $creatediv = $('<div id="create"><br></div>');
        $creatediv.append($rowdiv);
        $(editordiv).append($creatediv);
    } else {
        $(editordiv).append($rowdiv);    
    }

    var $createResourcemenuul = $('<ul id="createResourcemenuul" class="dropdown-menu"></ul>');
    
    editorconfig.setStartingPoints.callback(config, function (config) {
      for (var h = 0; h < config.startingPoints.length; h++) {
        var sp = config.startingPoints[h];
        var $createResourcesubmenuul = null;
        if (typeof sp.menuGroup !== undefined && sp.menuGroup !== '') {
          var $createResourcesubmenu =  $('<li class="dropdown-submenu"><a class="test" href="#">' + sp.menuGroup + '<span class="caret-right"></span></a></li>');
          
          $createResourcesubmenuul = $('<ul id="createresourcesubmenuul" class="dropdown-menu"></ul>');
          $createResourcesubmenu.append($createResourcesubmenuul);
          $createResourcemenuul.append($createResourcesubmenu)
        }
        for (var i = 0; i < sp.menuItems.length; i++) {
          var $li = $('<li>');
          var $a = $('<a>', {
            href: '#',
            id: 'sp-' + h + '_' + i,
            class: "test",
            tabindex: "-1"
          });
          $a.html(sp.menuItems[i].label);
          $a.click(function (event) {
            var profile = $($(event.target.parentElement.parentElement.parentElement).contents()[0]).text();
            $('#createresourcesubmenuul.open').hide();
            $('#createresourcesubmenuul.open').removeClass('open');
            $('#profileLabel').text(profile + ":" + event.target.text);
            
            menuSelect(this.id);
          });
          $li.append($a);

          if ($createResourcesubmenuul !== null) {
            $createResourcesubmenuul.append($li)
          } else {
            $createResourcemenuul.append($li)
          }
        }
        $createResourcediv.append($createResourcemenuul);

      }

      // Commenting out 2020 Oct 19 to fix lint crap.
      /*
      var getProfileOptions = 
       function (jqObject, elementType) {
        for (var h = 0; h < config.startingPoints.length; h++) {
          var sp = config.startingPoints[h];
          var label = sp.menuGroup
          for (var i = 0; i < sp.menuItems.length; i++) {
            var $option = $('<option>', {
              class: 'dropdown-item',
              value: 'sp-' + h + '_' + i
            });
            if (sp.menuItems[i].type[0] === elementType) {
              $option.html(label);
              jqObject.append($option);
            }
          }
        }
      }
      */
      $(function(){
        $('.dropdown-submenu>a').unbind('click').click(function(e){
          var $openmenu = $('#createresourcesubmenuul.open');
          $openmenu.hide();
          $openmenu.removeClass('open');
          var $dropdown = $(this).next('ul');
          $dropdown.addClass('open');
          $dropdown.toggle();
          e.stopPropagation();
          e.preventDefault();
        });
      });

    });

/*
=== ====
      } else {
        // retrieve disabled
        $(this.parentElement).find('#bfeditor-loaduriInput').val('This function has been disabled');
      }
    });


    $containerdiv.append($tabcontentdiv);

    $(editordiv).append($containerdiv);

>>> >>>> aws
*/

    // Debug div
    if (editorconfig.logging !== undefined && editorconfig.logging.level !== undefined && editorconfig.logging.level == 'DEBUG') {
      var $debugdiv = $('<div id="bfeditor-debugdiv" class="col-md-12 main panel-group">\
                           <div class="panel panel-default"><div class="panel-heading">\
                           <h3 class="panel-title"><a role="button" data-toggle="collapse" href="#debuginfo">Debug output</a></h3></div>\
                           <div class="panel-collapse collapse in" id="debuginfo"><div class="panel-body"><pre id="bfeditor-debug"></pre></div></div></div>\
                           </div>');
      $(editordiv).append($debugdiv);

      $('#debuginfo').collapse();
      //var $debugpre = $('#bfeditor-debug');
      //$debugpre.html(JSON.stringify(profiles, undefined, ' '));

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
      $('.alert').remove();
      bfelog.addMsg(new Error(), 'INFO', e.type + " " + e.target);
    });
    
    $(function(){
      $('#bfeditor-loadworkuri').prop('disabled', false);
      $('#bfeditor-loadibcuri').prop('disabled', false);
    });

    $(window).bind('beforeunload', function(){
      return 'Are you sure you want to leave?';
    });

    //show create tab
    //$('.nav-tabs a[href="#create"]').tab('show');

    return {
      'profiles': profiles,
      'div': editordiv,
      'bfestore': bfestore,
      'bfelog': bfelog
    };
  };


  exports.editor = function (config, id) {
    entryfunc = "editor";
    this.setConfig(config);

    editordiv = document.getElementById(id);

    var $menudiv = $('<div>', {
      id: 'bfeditor-menudiv',
      class: 'navbar navbar-expand-lg navbar-light bg-light col-md-10'
    });
    var $formdiv = $('<div>', {
      id: 'bfeditor-formdiv',
      class: 'col-md-10 main'
    });
    
    var $rowdiv = $('<div>', {
      class: 'row'
    });

    $rowdiv.append($menudiv);
    $rowdiv.append($formdiv);
    
    var $creatediv = $('<div id="create"><br></div>');
    $creatediv.append($rowdiv);
    $(editordiv).append($creatediv);
    
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

  function setLookup(r) {
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

  var cbLoadTemplates = exports.cbLoadTemplates = function(propTemps) {
    //clear the URL params
    window.history.replaceState(null, null, window.location.pathname);
//<<<< <<< HEAD
    
    bfe.exitButtons(editorconfig);

    $('#bfeditor-loader').width($('#bfeditor-loader').width() + 5 + '%');
    loadtemplatesANDlookupsCounter++;
    var loadtemplates = bfestore.loadtemplates;
/*
=== ====

    $('#bfeditor-loader').width($('#bfeditor-loader').width() + 5 + '%');
    loadtemplatesANDlookupsCounter++;
    var loadtemplates = bfeditor.bfestore.loadtemplates;

    //        if (loadtemplates !== undefined && bfestore.loadtemplates[0].resourceTemplateID === "profile:bf2:Load:Work"){
    //            loadtemplates = bfeditor.bfestore.loadtemplates;
    //        }
>>>> >>> aws
*/

    if (loadtemplatesANDlookupsCounter >= loadtemplatesANDlookupsCount) {
      $('#bfeditor-formdiv').html('');
      if (loadtemplates.length > 0) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Loading selected template(s)', loadtemplates);
        var form = getForm(loadtemplates, propTemps);
        $('.typeahead', form.form).each(function () {
          setTypeahead(this);
        });
        
        $('<input>', {
          type: 'hidden',
          id: 'profile-id',
          value: loadtemplates[0].resourceTemplateID
        }).appendTo(form.form);

        var exitFunction = function () {

          document.body.style.cursor = 'default';
          $('#bfeditor-exitpublish').prop('disabled',false);
          $('#bfeditor-exitsave').prop('disabled',false);
          $('#bfeditor-exitcancel').text("Cancel");
          $("#bfeditor-formdiv").prop("style", "")

          $('#cloneButtonGroup').remove();
          $('#exitButtonGroup').remove();
          $('#bfeditor-previewPanel').remove();
          
          $('#bfeditor-formdiv').show();
/*
<<<< <<< HEAD
          $('#bfeditor-formdiv').empty();
          $('[href=\\#browse]').tab('show');
          window.location.hash = '';
          bfestore.store = [];
          $('#table_id').DataTable().search('').draw();
          exports.loadBrowseData();
==== ===
*/
          $('#bfeditor-formdiv').removeAttr('style');
          $('#bfeditor-formdiv').empty();
          //$('[href=\\#browse]').tab('show');
          window.location.hash = '';
          bfeditor.bfestore.store = [];
          $('#table_id').DataTable().search('').draw();
          exports.loadBrowseData();
// >>> >>>> aws
        }

        $('#bfeditor-exitcancel').click(function () {
          exitFunction();
        });

        var $messagediv;
               
        $('#bfeditor-exitsave').click(function () {
            if (editorconfig.save !== undefined ) {
                $('.alert').remove();
                $('#bfeditor-exitcancel').text("Close");
                $('#bfeditor-exitpublish').prop('disabled',true);
                $('#bfeditor-exitsave').prop('disabled',true);
    
                $('#resource-id-popover #savemessage').remove();
                $('#resource-id-popover #savingicon').remove();
    
                document.body.style.cursor = 'wait';

                var good_to_save = true;
                if (entryfunc == "lcapplication") {
                    // If there is no mainTitle OR the profile contains the word "test", then do not save.
                    if (_.some(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle' }) === false ) {
                            good_to_save = false;
                            // title required
                            $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                            $messagediv.append('<strong>Did not meet save/publish criteria.  No title found:</strong>' + mintResource(bfestore.name));
                            $messagediv.insertBefore('.nav-tabs');
                    }
                }
                if (good_to_save) {
                    
                    var $savingInfo = $('<span id="savingicon" style="color: black" class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>');
                    $('#bfeditor-exitcancel').text("Cancel");
                    $('#resource-id-popover').append($savingInfo);
            
                    bfestore.addedProperties = addedProperties;
                    editorconfig.save.callback({bfestore: bfestore, bfelog: bfelog, version: createVersion}, function (success, data) {
                        //alert(JSON.stringify(data));
                        if (data.status == "success") {
                            createVersion = 0;
                            bfelog.addMsg(new Error(), 'INFO', 'Saved: ' + data.save_name);
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                        
                            $messagediv = $('<div>', {id: "bfeditor-messagediv", class: 'alert alert-info' });
                            var decimaltranslator = window.ShortUUID("0123456789");
                            var resourceName = "e" + decimaltranslator.fromUUID(data.name);
                            var linkUrl = config.url + '/bfe/index.html#' + resourceName.substring(0,8);
                            $messagediv.append('<strong>Description saved:</strong><a href='+linkUrl+'>'+resourceName.substring(0,8)+'</a>');
                            $messagediv.append($('<button>', {onclick: "document.getElementById('bfeditor-messagediv').style.display='none'", class: 'close' }).append('<span>&times;</span>'));
                            $messagediv.insertBefore('.nav-tabs');
                        
                            $('#bfeditor-exitcancel').text("Cancel");
                        } else {
                            
                            var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                            $messagediv.append('<div class="alert alert-danger"><strong>Save Failed:</strong>' + data.errorThrown + '</span>');
                            $messagediv.insertBefore('.nav-tabs');
                            
                        }
                    });
                }

                document.body.style.cursor = 'default';
                $('#resource-id-popover #savingicon').remove();
                $('#bfeditor-exitpublish').prop('disabled',false);
                $('#bfeditor-exitsave').prop('disabled',false);
            } else {
                // save disabled
                // kefo note - not sure if disabling saving at this point is the way 
                // to go but keeping it for now.  Probably should not show the button
                // at all if there is no method.
                $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-info' });
                $messagediv.append('<span class="str"><h3>Save disabled</h3></span>');
                $messagediv.insertBefore('.nav-tabs');
            }
        });

        $('#bfeditor-exitpublish').click(function () {
            if (editorconfig.publish !== undefined) {
                bfeditor.bfestore.removeOrphans(bfestore.defaulturi);
                bfeditor.bfestore.addSerialTypes();
                document.body.style.cursor = 'wait';
                $('.alert').remove();
          
                $('#bfeditor-exitpublish').prop('disabled',true);
                $('#bfeditor-exitsave').prop('disabled',true);
                
                var good_to_publish = true;
                if (entryfunc == "lcapplication") {
                    // If there is no mainTitle OR the profile contains the word "test", then do not save.
                    if (_.some(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle' }) === false ) {
                            good_to_publish = false;
                            // title required
                            $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                            $messagediv.append('<strong>Did not meet save/publish criteria.  No title found:</strong>' + mintResource(bfestore.name));
                            $messagediv.insertBefore('.nav-tabs');
                    }
                }
                if (good_to_publish) {
                    $messagediv = $('<div>', {id: "bfeditor-messagediv",class: 'alert alert-warning' });
                    $messagediv.append('<strong>Saving description and posting description.  This takes a few seconds...');
                    $messagediv.insertBefore('.nav-tabs');
                    editorconfig.publish.callback({bfestore: bfestore, bfelog: bfelog, version: createVersion}, function (success, data) {
                        $('.alert').remove();
                        if (success) {
                            createVersion = 0;
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                            bfelog.addMsg(new Error(), "INFO", "Published " + data.name);
                            
                            var $messagediv = $('<div>', {id: "bfeditor-messagediv",class: 'alert alert-success' });
                            var displayText = data.lccn !== undefined ? data.lccn : data.objid;
                            $messagediv.append('<strong>Description posted: </strong><a href=' + config.basedbURI + data.objid+'>'+displayText+'</a>');
                            $messagediv.insertBefore('.nav-tabs');
                            
                            $('#bfeditor-formdiv').empty();
                            $('#save-btn').remove();
                            $('#bfeditor-previewPanel').remove();
                            $('.nav-tabs a[href="#browse"]').tab('show')
                            
                            bfestore.store = [];
                            window.location.hash = "";
                            
                            exitFunction();
                        } else {
                            $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                            $messagediv.append('<div class="alert alert-danger"><strong>Save/Publish Failed:</strong>' + data.errorThrown + ' (' + data.errorText + ')</span>');
                            $messagediv.insertBefore('.nav-tabs');
                            //$messagediv.insertBefore('#bfeditor-previewPanel');
                        }
                    });
                }
                
                document.body.style.cursor = 'default';
                $('#bfeditor-exitpublish').prop('disabled',false);
                $('#bfeditor-exitsave').prop('disabled',false);
            } else {
                // publish disabled
                // kefo note - not sure if disabling saving at this point is the way 
                // to go but keeping it for now.  Probably should not show the button
                // at all if there is no method.
                $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-info' });
                $messagediv.append('<strong>Publishing disabled</strong>');
                $messagediv.insertBefore('.nav-tabs');
            }     
        });

        $('#bfeditor-exitcancel').attr('tabindex', tabIndices++);
        
        bfeditor.bfestore.defaulturi = form.formobject.defaulturi;
        $('#bfeditor-preview').click(function () {
          $('#bfeditor-preview').hide();
          //remove orphans
          bfeditor.bfestore.removeOrphans(bfestore.defaulturi);
          bfeditor.bfestore.addSerialTypes();
          if (_.where(bfestore.store, {"p":"http://id.loc.gov/ontologies/bibframe/instanceOf"}).length == 2) {
            bfeditor.bfestore.removeInstanceOfs();
          }

          var jsonstr = bfeditor.bfestore.store2jsonldExpanded();

          // bfeditor.bfestore.store2turtle(jsonstr, humanizedPanel);
          bfeditor.bfestore.store2jsonldcompacted(jsonstr, jsonPanel);

          function humanizedPanel(data) {
            $('#humanized .panel-body pre').text(data);
          }

          function jsonPanel(data) {
            bfestore.store2turtle(data, humanizedPanel);

            $('#jsonld .panel-body pre').text(JSON.stringify(data, undefined, ' '));

            if (typeof d3 !== "undefined") {
                bfestore.store2jsonldnormalized(data, function (expanded) {
                    d3.jsonldVis(expanded, '#jsonld-vis .panel-body', {
                        w: 800,
                        h: 600,
                        maxLabelWidth: 250
                    });
                });
            }
          }

          document.body.scrollTop = document.documentElement.scrollTop = 0;
          var $backButton = $('<button id="bfeditor-exitback" type="button" class="btn btn-warning">&#9664;</button>');

          var $bfeditor = $('#create > .row');
          var $preview = $('<div id="bfeditor-previewPanel" class="col-md-10 main panel-group">\
                           <div class="panel panel-default"><div class="panel-heading">\
                           <h3 class="panel-title"><a role="button" data-toggle="collapse" href="#humanized">Preview</a></h3></div>\
                           <div class="panel-collapse collapse in" id="humanized"><div class="panel-body"><pre></pre></div></div>\
                           <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#jsonld">JSONLD</a></h3></div>\
                           <div class="panel-collapse collapse in" id="jsonld"><div class="panel-body"><pre>' + JSON.stringify(jsonstr, undefined, ' ') + '</pre></div></div>\
                           <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#rdfxml">RDF-XML</a></h3></div>\
                           <div class="panel-collapse collapse in" id="rdfxml"><div class="panel-body"><pre></pre></div></div>\
                           <div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><a role="button" data-toggle="collapse" href="#jsonld-vis">Visualize</a></h3</div></div>\
                           <div class="panel-collapse collapse in" id="jsonld-vis"><div class="panel-body"></div></div></div>\
                           </div>');

          $('#exitButtonGroup').append($backButton);

          $('#bfeditor-exitback').click(function () {
            $('#bfeditor-exitback').remove();
            $('#bfeditor-preview').show();
            $('#bfeditor-previewPanel').remove();
            $('#bfeditor-formdiv').show();
          });

          $('#bfeditor-formdiv').hide();
          $bfeditor.append($preview);
        });

        $('#bfeditor-exitpreview').attr('tabindex', tabIndices++);

        $('#bfeditor-formdiv').html('');
        $('#bfeditor-formdiv').append(form.form);
        $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
        $('#bfeditor-debug').html(JSON.stringify(bfelog.getLog(), undefined, ' '));

        bfestore.state = 'edit';
            
        // apply a user template if selected
        bfeusertemplates.checkActiveTemplate();
        
      }
    }
  }

    // store = new rdfstore.Store();
  function menuSelect(spid) {
    var spnums = spid.replace('sp-', '').split('_');
    var spoints = editorconfig.startingPoints[spnums[0]].menuItems[spnums[1]];
    addedProperties = [];

    bfestore.store = [];
    bfestore.name = guid();
    bfestore.templateGUID = guid();
    bfestore.created = new Date().toUTCString();
    bfestore.url = config.url + '/ldp/verso/resources/' + bfestore.name;
    bfestore.state = 'create';
    
    // Turn off edit mode of templates if they were in the middle of editing one
    bfeusertemplates.editMode = false;
    bfeusertemplates.editModeTemplate = false;

    var loadtemplates = [];

    spoints.useResourceTemplates.forEach(function (l) {
      var loadtemplate = {};
      var tempstore = [];
      loadtemplate.templateGUID = bfestore.templateGUID;
      loadtemplate.resourceTemplateID = l;
      loadtemplate.embedType = 'page';
      loadtemplate.data = tempstore;
      loadtemplates.push(loadtemplate);
      // cbLoadTemplates();
    });

    bfestore.loadtemplates = loadtemplates;

    //adminMetadata
    var rt_type = _.last(loadtemplates[0].resourceTemplateID.split(":")).toLowerCase();
    var procInfo = 'create ' + rt_type
    bfeditor.bfestore.profile = loadtemplates[0].resourceTemplateID;
    var defaulturi = editorconfig.baseURI + 'resources/' + rt_type + 's/' + mintResource(bfestore.templateGUID);
    var catalogerId;
    if (config.enableLoadMarc && !_.isEmpty(window.localStorage.bfeUser)){
      catalogerId = JSON.parse(window.localStorage.bfeUser)["bflc:catalogerId"];
    }
    bfeditor.bfestore.addAdminMetadata(defaulturi, procInfo, bfeditor.bfestore.profile, "", catalogerId);
    bfestore.loadtemplates.data = bfeditor.bfestore.store;

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
    function getForm(loadTemplates, pt) {
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
                            var worklist = _.filter(bfestore.store, function (s) { return s.s.indexOf(baseuri) !== -1; });
                            if (!_.isEmpty(worklist)) {
                                // check for type
                                var rtTypes = _.where(worklist, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: fobject.resourceTemplates[urt].resourceURI });
                                if (!_.isEmpty(rtTypes)) {
                                    fobject.resourceTemplates[urt].defaulturi = rtTypes[0].s;

                                    if (fobject.resourceTemplates[urt].embedType === "page") {
                                        // find uniq s, and look for one that has no o
                                        rtTypes.forEach(function (rtType){
                                            if(!_.some(bfestore.store, {o: rtType.s})){
                                                fobject.resourceTemplates[urt].defaulturi = rtType.s;
                                            }
                                        });
                                    }
                                } else {
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
                        }
                    );
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
        form.submit(function(e){
            e.preventDefault();
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

            // Show name of Profile being used.
            var $resourcedivheading = $('<div>');
            var $resourcedivheadingh4 = $('<h4 id="resource-title" class="pull-left" style="margin-right:5px">');
            $resourcedivheadingh4.text($('#profileLabel').text());

            // Create little 'i' icon with resource label and URI.
            if (rt.defaulturi.match(/^http/)) {
                var rid = rt.defaulturi;
                var rLabel = _.find(bfestore.store, {"s": rid, "p": "http://www.w3.org/2000/01/rdf-schema#label"});
                var $resourceInfo = $('<a><span class="glyphicon glyphicon-info-sign"></span></a>');
                $resourceInfo.attr('data-content', rid);
                $resourceInfo.attr('data-toggle', 'popover');
                $resourceInfo.attr('title', !_.isEmpty(rLabel)? rLabel.o : 'Resource ID');
                $resourceInfo.attr('id', 'resource-id-popover');
                $resourceInfo.popover({ trigger: "click hover" });
                $resourcedivheadingh4.append($resourceInfo);
            }
            if (rt.embedType != 'modal') {
                $resourcedivheading.append($resourcedivheadingh4);
            }

            
            // Clone the Work or Instance, because hoary practice.
            if (config.enableCloning) {
                // create an empty clone button
                var $clonebutton = $('<button type="button" class="pull-right btn btn-primary" data-toggle="modal" data-target="#clone-input"></button>');

                // populate the clone button for Instance or Work descriptions
                if (rt.id.match(/:Instance$/i)) {
                    $clonebutton.attr('id', 'clone-instance');
                    $clonebutton.html('<span class="glyphicon glyphicon-duplicate"></span> Clone Instance');
                    $clonebutton.data({ 'match': 'instances', 'label': 'Instance' });
                } else if (rt.id.match(/:Work$/i)) {
                    $clonebutton.attr('id', 'clone-work');
                    $clonebutton.html('<span class="glyphicon glyphicon-duplicate"></span> Clone Work');
                    $clonebutton.data({ 'match': 'works', 'label': 'Work' });
                }
    
                var $templateCloneButtonGroup;
          
                if ($('#cloneButtonGroup').length > 0){
                    $templateCloneButtonGroup = $('#cloneButtonGroup');
                    if (rt.id.match(/:Instance$/i)) {
                        $clonebutton = $('#clone-instance')
                    } else if (rt.id.match(/:Work$/i)) {
                        $clonebutton = $('#clone-work')
                    }
                } else {
                    $templateCloneButtonGroup = $('<div>', {
                        id: 'cloneButtonGroup',
                        class: 'pull-right'
                    });
                    $templateCloneButtonGroup.append($clonebutton);
                }
        
                // append to the resource heading if there is a clone button id and is not a modal window      
                if ($clonebutton.attr('id') && rt.embedType != 'modal') {
                    var newid = mintResource(guid());
    
                    // ask user to input custom id
                    var $cloneinput = $('<div id="clone-input" class="modal" tabindex="-1" role="dialog">\
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
            }
        
            // User templates.
            // add in the template select next to the clone button, pass the profile name, looks something like 'profile:bf2:Monograph:Work'
            if (editorconfig.enableUserTemplates) {
                if (!editorconfig.enableCloning) {
                    $templateCloneButtonGroup = $('<div>', { id: 'cloneButtonGroup', class: 'pull-right' });
                }
                var activeProfile = loadTemplates.map(function(t){ return t.resourceTemplateID}).join('-');
                $('.template-controls').remove();
                $templateCloneButtonGroup.append(bfeusertemplates.returnSelectHTML(activeProfile, editorconfig));
            }

            if ($templateCloneButtonGroup !== undefined) {
                $('#bfeditor-menudiv').append($templateCloneButtonGroup);
            }
      
            $resourcediv.append($resourcedivheading);

            $resourcediv.find('#clear-id').click(function () {
                $('#resource-id').attr('value', '');
                $('#resource-id').focus();
            });

            // the cloning starts here if clone button is clicked
            $resourcediv.find('#clone-save').click(function () {
                var rid = $('#resource-id').attr('value');
                $('#clone-input').modal('hide');
                var $msgnode = $('<div>', { id: "bfeditor-messagediv" });
                var olduri = rt.defaulturi;

                bfestore.name = guid();  // verso save name
                // var rid = mintResource(guid()); // new resource id
                var ctype = $clonebutton.data('label'); // get label for alert message
                var re = RegExp('(/' + $clonebutton.data('match') + '/)[^/]+?(#.+$|$)'); // match on part of uri ie. /works/ or /instances/

                // change all subjects in the triple store that match /instances/ or /works/ and assign new resource id
                bfestore.store.forEach(function (trip) {
                    trip.s = trip.s.replace(re, "$1" + rid + "$2");
                    trip.o = trip.o.replace(re, "$1" + rid + "$2");
                });

                //remove lccn
                var lccns = _.where(bfestore.store, { o: 'http://id.loc.gov/ontologies/bibframe/Lccn' });
                if (lccns !== undefined) {
                    lccns.forEach(function (lccn) {
                        bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, { s: lccn.s }));
                        bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, { o: lccn.s }));
                    });
                }

                _.each(_.where(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/adminMetadata' }), function (am) {
                    //delete old procInfo
                    bfestore.addProcInfo(am.o, 'clone ' + $clonebutton.data().label.toLowerCase());
                });

                // reload the newly created template
                cbLoadTemplates();

                // start checking for errors (basically check for remnants of old resource IDs)
                var errs = 0;
                bfestore.store.forEach(function (trip) {
                    if (trip.s == olduri) {
                        errs++;
                    }
                });

                //disable clone button
                $('#clone-work, #clone-instance').attr("disabled", "disabled");

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
            $resourcediv.append($formgroup);
            
            /*
            // Is any of the below used????
            var $saves = $('<div class="form-group row"><div class="btn-toolbar col-sm-12" role="toolbar"></div></div></div>');
            // var $label = $('<label for="' + rt.useguid + '" class="col-sm-3 control-label" title="'+ rt.defaulturi + '">Set label?</label>');
            var $resourceinput = $('<div class="col-sm-6"><input type="text" class="form-control" id="' + rt.useguid + '" tabindex="' + tabIndices++ + '"></div>');
            var $button = $('<div class="btn-group btn-group-md span1"><button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">&#10133;</button></div>');
            var $linkbutton = $('<button type="button" class="btn btn-default" tabindex="' + tabIndices++ + '">&#x1f517;</button></div>');
            var $linkmodal = $('<div class="modal fade" id="linkmodal' + rt.useguid + '" role="dialog"><div class="modal-dialog"><div class="modal-content"> \
                <div class="modal-header"><button type="button" class="close" data-dismiss="modal">x</button><h4 class="modal-title">Link</h4></div> \
                <div class="modal-body">' + rt.defaulturi + '</div></div></div></div>'
            );

            $button.click(function () {
                setRtLabel(fobject.id, rt.useguid, rt.useguid + ' input', rt);
            });

            $linkbutton.click(function () {
                $('#bfeditor').append($linkmodal);
                $('#linkmodal' + rt.useguid).modal();
                $('#linkmodal' + rt.useguid).on('show.bs.modal', function () {
                    $(this).css('z-index', 10000);
                });
            });

            var enterHandler = function (event) {
                if (event.keyCode == 13) {
                    setRtLabel(fobject.id, rt.useguid, property.guid);
                    if ($('#' + property.guid).parent().parent().next().find("input:not('.tt-hint')").length) {
                        $('#' + property.guid).parent().parent().next().find("input:not('.tt-hint')").focus();
                    } else if ($('#' + property.guid).parent().parent().next().find("button:not([class^='bfeditor-modalCancel'])").length) {
                        $('#' + property.guid).parent().parent().next().find("button").focus();
                    } else {
                        $('[id^=bfeditor-modalSave]').focus();
                    }
                }
            };

            $resourceinput.keyup(enterHandler);
            $resourceinput.append($saves);
            */
            
            var addPropsUsed = {};
            if (addedProperties !== undefined && rt.embedType == 'page' && !pt) {
                addedProperties.forEach(function (adata) {
                    rt.propertyTemplates.push(adata);
                });
            }

            // adding Admin Metadata to Work, instance, Item
            if (
                RegExp(/(:Work|:Instance|:Item)$/).test(rt.id) && 
                !_.some(rt.propertyTemplates, { "propertyURI": "http://id.loc.gov/ontologies/bibframe/adminMetadata" })
            ) {
                var adminProp = {
                "mandatory": "false",
                "repeatable": "false",
                "type": "resource",
                "resourceTemplates": [],
                "valueConstraint": {
                    "valueTemplateRefs": ["lc:RT:bf2:AdminMetadata:BFDB"],
                    "useValuesFrom": [],
                    "valueDataType": {},
                    "defaults": []
                },
                "propertyURI": "http://id.loc.gov/ontologies/bibframe/adminMetadata",
                "propertyLabel": "Administrative Metadata"
                };
                rt.propertyTemplates.push(adminProp);
            }

            rt.propertyTemplates.forEach(function (property) {
                // Each property needs to be uniquely identified, separate from
                // the resourceTemplate.
                var pguid = shortUUID(guid());
                property.guid = pguid;
                property.display = 'true';
                addPropsUsed[property.propertyURI] = 1;
                var $formgroup = $('<div>', {
                    class: 'form-group row template-property'
                });
   
                // add the uri to the data of the element
                $formgroup.data('uriLabel',property.propertyURI+'|'+property.propertyLabel);

                var $saves = $('<div class="form-group row" style="width:90%;"><div class="btn-toolbar col-sm-12" role="toolbar"></div></div></div>');
                var $label = $('<label for="' + property.guid + '" class="col-sm-2 control-label" title="' + ((property.remark) ? property.remark : "") + '"></label>');
            
                if (rt.embedType != 'modal') {
                    // add in the on/off switch for making templates, pass it the uri|label combo as well so it knows to set it on off flag
                    if (property.mandatory !== true && property.mandatory !== "true"){
                        $label.append(bfeusertemplates.returnToggleHTML(property.propertyURI+'|'+property.propertyLabel));
                    }         
                }
        
                if ((/^http/).test(property.remark)) {
                    $label.append('<a href="' + property.remark + '" target="_blank">' + property.propertyLabel + '</a>')
                } else {
                    $label.append("<span>"+ property.propertyLabel + "</span>")        
                }
                
                var $input;
                var $button;
                var $selectLang;
                var $literalCol;
                var $inputHolder;
                var $input_page;
            
                //default property type is literal
                //if ((property.type.startsWith('literal') && property.valueConstraint !== undefined && (_.isEmpty(property.valueConstraint.useValuesFrom)) || _.isEmpty(property.type))) {
                if (property.type == "literal" || property.type == "literal-lang") {
                    var vpattern = '';
                    if(_.has(property, "valueConstraint")) {
                        vpattern = (property.valueConstraint.validatePattern !== undefined) ? ' pattern="' + property.valueConstraint.validatePattern + '"' : '';
                    }
          
                    $literalCol = $('<div class="col-sm-10"></div>');
                    $inputHolder = $('<div class="input-group literal-input-group"></div>');
                    $input = $('<textarea rows="1" class="form-control literal-input" id="' + property.guid + '"' + vpattern + ' tabindex="' + tabIndices++ + '">');
                    $inputHolder.append($input);
                    $literalCol.append($inputHolder);  
             
                    if (property.type == 'literal-lang') {
                        var $buttonGroupHolder = $('<div class="input-group-btn" ></div>');
                        $selectLang = $('<select id="' + property.guid + '-lang" class="form-control literal-select"' + ' tabindex="' + tabIndices++ + '"><option>lang</option></select>');

                        // add in all the languages
                        bfeliterallang.iso6391.forEach(function(l){
                            $selectLang.append($('<option value="'+ l.code + '">'+ l.code + ' (' + l.name + ')' +'</option>'));
                        });
            
                        $inputHolder.append($selectLang);
                        var $selectScript = $('<select id="' + property.guid + '-script" class="form-control literal-select"' + ' tabindex="' + tabIndices++ + '"><option></option></select>');
                        // add in all the languages
                        bfeliterallang.iso15924.forEach(function(s){
                            $selectScript.append($('<option value="'+ s.alpha_4 + '">'+ s.alpha_4 + ' (' + s.name + ')' +'</option>'));
                        });
    
                        $inputHolder.append($selectScript);
            
                        // if they go to correct it remove 
                        $selectLang.on('click change',function(){$(this).removeClass('literal-select-error-start')});
                        $selectScript.on('click change',function(){$(this).removeClass('literal-select-error-start')});

                    } else {
                        // not building a literal lang input, need to float the + button over to the left
                        $buttonGroupHolder = $('<div class="input-group-btn pull-left" ></div>');
                    }
          
                    $plusButton = $('<button type="button"  class="btn btn-default" tabindex="' + tabIndices++ + '">&#10133;</button>');
                    $buttonGroupHolder.append($plusButton);
                    $inputHolder.append($buttonGroupHolder);
          
                    $plusButton.click(function () {
                        if (!document.getElementById(property.guid).checkValidity()) {
                            alert('Invalid Value!\nThe value should match: ' + property.valueConstraint.validatePattern);
                            return false;
                        } else {
            
                            // dont allow if the script or lang is blank
                            if (property.type == 'literal-lang') {
                                if ($('#' + property.guid).next().val() == 'lang') {
                                    $('#' + property.guid).next().addClass('literal-select-error-start');
                                    return false;
                                }                
                            }
                            setLiteral(fobject.id, rt.useguid, property.guid);
                            if (rt.embedType === 'page'){
                                bfe.saveNoExit();
                            }
                        }
                    });
          
                    // These actions are associated with keyup on the input field itself.
                    var enterHandler = function (event) {
                        if (event.keyCode == 13) {
                            // Enter key
                            event.target.value = event.target.value.trim();
                            if (!document.getElementById(property.guid).checkValidity()) {
                                alert('Invalid Value!\nThe value should match: ' + property.valueConstraint.validatePattern);
                                return false;
                            } else if (property.type == 'literal-lang') {
                                if ($('#' + property.guid).next().val() == 'lang') {
                                    $('#' + property.guid).next().addClass('literal-select-error-start');
                                    return false;
                                }
                            }
                            // this prevents the select boxs from open the dropdown on enter press
                            event.preventDefault();
                    
                            setLiteral(fobject.id, rt.useguid, property.guid);
                            if (rt.embedType === 'page'){
                                bfe.saveNoExit();
                            }
                            // this trys to auto select the next possible input like an input or button
                            if ($('#' + property.guid).parent().parent().parent().next().find("input:not('.tt-hint')").length) {
                                $('#' + property.guid).parent().parent().parent().next().find("input:not('.tt-hint')").focus();
                            } else if ($('#' + property.guid).parent().parent().parent().next().find("button:not([class^='bfeditor-modalCancel'])").length) {
                                $('#' + property.guid).parent().parent().parent().next().find("button").focus();
                            } else {
                                $('[id^=bfeditor-modalSave]').focus();
                            }
                        
                        } else if (event.keyCode == 54 && event.ctrlKey && event.altKey) {
                            // Copyright symbol
                            var text = this.value;
                            this.value = text + '\u00A9';
                        
                        } else if (event.keyCode == 53 && event.ctrlKey && event.altKey) {
                            // Published symbol
                            this.value = this.value + '\u2117';
                    
                        } else if (event.metaKey && event.altKey) {
                            var cursorPos = $(this).prop('selectionStart');
                            var v = $(this).val();
                            var textBefore = v.substring(0,  cursorPos);
                            var textAfter  = v.substring(cursorPos, v.length);
                  
                            $(this).val(textBefore + bfeliterallang.characterShortcuts(event.key) + textAfter);
                            //this.value = this.value + bfeliterallang.characterShortcuts(event.key);
                        } else if ($('#' + property.guid)[0].nodeName.toLowerCase() == 'input' || $('#' + property.guid)[0].nodeName.toLowerCase() == 'textarea'){
                            // send off the text to try to guess the lang or script
                            var results = bfeliterallang.identifyLangScript($(this).val());
                            // if we get results for either set them in the select boxes follow this input
                            if (results.iso6391){
                                $('#' + property.guid).next().val(results.iso6391)
                            }
                            if (results.script){
                                $('#' + property.guid).next().next().val(results.script)
                            }
                        }            
                    };
                    $input.keyup(enterHandler);
              
                    // also handle enter keys press on the select
                    if ($selectLang){
                        $selectLang.keypress(enterHandler);
                        $selectScript.keypress(enterHandler);
                    }
    
                    // this is where the added data shows up, so it will appear below the inputbox
                    $literalCol.append($saves);
            
                    $formgroup.append($label);
                    $formgroup.append($literalCol);
    
                }
        
                //else if ((property.type.startsWith('literal') && property.valueConstraint !== undefined && (!_.isEmpty(property.valueConstraint.useValuesFrom)) || !_.isEmpty(property.type))) {
                if (
                    property.type == "resource" || 
                    property.type == "lookup" || 
                    property.type == "target" || 
                    property.type == "list" 
                    ) {
              
                    if (_.has(property, 'valueConstraint')) {
                
                        if (_.has(property.valueConstraint, 'valueTemplateRefs') && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
                            // This property references other Resource Templates.
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
                                    var pid = property.guid;
                                    var newResourceURI = '_:bnode' + shortUUID(guid());
                                    $b.click({
                                        fobjectid: fobject.id,
                                        newResourceURI: newResourceURI,
                                        propertyguid: pid,
                                        template: vt
                                        }, function (event) {
                                            var theNewResourceURI = '_:bnode' + shortUUID(guid());
                                            openModal(event.data.fobjectid, event.data.template, theNewResourceURI, event.data.propertyguid, []);
                                            bfe.borderColor($(".modal-content:last")[0], event.data.template.id);
                                        }
                                    );
                                    $buttongrp.append($b);
                                }
                            }
                            $buttondiv.append($buttongrp);

                            $formgroup.append($label);
                            $buttondiv.append($saves);
                            $formgroup.append($buttondiv);
                            // $formgroup.append($saves);
                
                        } else if (_.has(property.valueConstraint, 'useValuesFrom')) {
                            // This property's object should come from a controlled list.
                        
                            // Let's supress the lookup unless it is in a modal for now.
                            if (rt.embedType != 'modal' && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                                forEachFirst = false;
                                return;
                            }

                            var $inputdiv = $('<div class="col-sm-8"></div>');
                            $input = $('<input type="text" class="typeahead form-control" data-propertyguid="' + property.guid + '" id="' + property.guid + '" tabindex="' + tabIndices++ + '">');
                            // Does this have a purpose.  Chasing the threads it seems unlikely.
                            $input_page = $('<input type="hidden" id="' + property.guid + '_page" class="typeaheadpage" value="1">');

                            $inputdiv.append($input);
                            $inputdiv.append($input_page);

                            // What is happenning here and why?  What is this meant to do?
                            $input.on('focus', function () {
                                if ($(this).val() === '') // you can also check for minLength
                                { $(this).data().ttTypeahead.input.trigger('queryChanged', ''); }
                            });

                            $formgroup.append($label);
                            $inputdiv.append($saves);
                            $formgroup.append($inputdiv);

                            if (rt.embedType == 'modal' && forEachFirst && property.propertyLabel.match(/lookup/i)) {
                                // This is the first propertty *and* it is a look up.
                                // Let's treat it special-like.
                                var $saveLookup = $('<div class="modal-savechanges"><button type="button" class="btn btn-primary" style="display:none" id="bfeditor-modalSaveLookup-' + fobject.id + '" tabindex="' + tabIndices++ + '">Save changes</button></div>');
                                var $spacer = $('<div class="modal-spacer"><span>OR</span></div>');
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
            if (rt.embedType == 'page' && bfeusertemplates.getEditMode() !== true) {
                var substringMatcher = function (strs) {
                    return function findMatches(q, cb) {
                        strs = _.sortBy(strs, 'display');
                        var matches, substrRegex;
                        matches = [];
                        substrRegex = new RegExp(q, 'i');
                        $.each(strs, function (index, str) {
                            if (substrRegex.test(str.display) && !addPropsUsed[str.uri]) {
                                matches.push({
                                    'value': str.display,
                                    'label': str.label,
                                    'uri': str.uri
                                });
                            }
                        });
                        cb(matches);
                    };
                };
                var $addpropdata = $('<div>', { class: 'col-sm-8' });
                var $addpropinput = $('<input>', { id: 'addproperty', type: 'text', class: 'form-control add-property-input', placeholder: 'Type for suggestions' });
                $addpropinput.click(function () {
                    if (addFields.length == 0) {
                        $addpropinput.prop('disabled', true);
                        $addpropinput.attr('placeholder', 'Loading field choices...');
                        $.ajax({
                            url: '/api/listconfigs?where=index.resourceType:ontology',
                            contentType: 'application/json',
                            dataType: "json",
                            success: function (data) {
                                if (data.length == 0) {
                                    $addpropinput.attr('placeholder', 'No ontologies defined...');
                                }
                                data.forEach(function (ont) {
                                    ont.json.url = ont.json.url.replace(/\.rdf$/, '.json');
                                    $.ajax({
                                        dataType: 'json',
                                        url: config.url + '/profile-edit/server/whichrt?uri=' + ont.json.url,
                                        success: function (ontdata) {
                                            ontdata.forEach(function (o) {
                                                var prop = o['@type'][0].match(/property$/i);
                                                if (
                                                    prop && 
                                                    o['http://www.w3.org/2000/01/rdf-schema#label'] !== undefined && 
                                                    o['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']
                                                ) {
                                                    var label = o['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value'];
                                                    label = label.replace(/\s+/g, ' ');
                                                    var uri = o['@id'];
                                                    addFields.push({
                                                        'label': label,
                                                        'uri': uri,
                                                        'display': label + ' (' + ont.json.label + ')'
                                                    });
                                                }
                                            });
                                        },
                                        error: function (err) {
                                            bfelog.addMsg(new Error(), 'INFO', err);
                                        },
                                        complete: function () {
                                            $addpropinput.prop('disabled', false);
                                            $addpropinput.attr('placeholder', 'Type for suggestions');
                                            $addpropinput.focus();
                                        }
                                    });
                                });
                            },
                            error: function (err) {
                                bfelog.addMsg(new Error(), 'INFO', err);
                            },
                        });
                    }
                });

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
                    var newproperty = {
                        'mandatory': 'false',
                        'repeatable': 'true',
                        'type': 'literal',
                        'resourceTemplates': [],
                        'valueConstraint': {
                            'valueTemplateRefs': [],
                            'useValuesFrom': [],
                            'valueDataType': {}
                        },
                        'propertyLabel': suggestion.label,
                        'propertyURI': suggestion.uri,
                        'display': 'true',
                        'guid': guid()
                    };
                    rt.propertyTemplates.push(newproperty);
                    addedProperties.push(newproperty);
                    cbLoadTemplates(rt.propertyTemplates);
                });
                var $addproplabel = $('<label class="col-sm-2 control-label">Add Property</label>');
                var $addprop = $('<div>', { class: 'form-group row' });
                $addprop.append($addproplabel);
                $addprop.append($addpropdata);
                $resourcediv.append($addprop);
            }
            form.append($resourcediv);
        });


        // OK now we need to populate the form with data, if appropriate.
        fobject.resourceTemplates.forEach(function (rt) {
            // check for match...maybe do this earlier

            if (_.where(bfestore.store, {'o': rt.resourceURI}).length > 0) {
                if (bfestore.state !== 'edit') {
                    _.where(bfestore.store, {'o': rt.resourceURI}).forEach(
                        function (triple) {
                            if (_.where(bfestore.store, {'o': triple.s}).length === 0) {
                                bfelog.addMsg(new Error(), 'INFO', triple.s);
                                rt.defaulturi = triple.s;
                            }
                        });
                    ///   LEFT OFF HERE /////
        } else {
          _.where(bfestore.store, {
            's': rt.defaulturi,
            'o': rt.resourceURI
          }).forEach(function (triple) {
            if (_.where(bfestore.store, {
              'o': triple.s
            }).length === 0) {
              bfelog.addMsg(new Error(), 'INFO', triple.s);
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
        //var id = guid();
        // var uri;
        // var uri = editorconfig.baseURI + rt.useguid;
        if (rt.defaulturi !== undefined && rt.defaulturi !== '') {
          fobject.defaulturi = rt.defaulturi;
        } else {
          fobject.defaulturi = editorconfig.baseURI + rt.useguid;
        }

        if (bfestore.state === 'edit' && _.some(bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': rt.resourceURI })) {
          // match the rt to the type triple
          triple = _.find(bfestore.store, { 'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'o': rt.resourceURI });
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
                if (fobject.resourceTemplateIDs.indexOf(vtrs) > -1 && vtrs != rt.id) {
                  var relatedTemplates = _.where(bfestore.store, {
                    rtID: vtrs
                  });
                  triple = {};
                  triple.guid = shortUUID(guid());
                  triple.s = fobject.defaulturi; //uri
                  triple.p = property.propertyURI;
                  triple.o = relatedTemplates[0].s;
                  triple.otype = 'uri';
                  fobject.store.push(triple);
                  bfestore.addTriple(triple);
                  property.display = 'false';
                }
              }
            }
          }
        });
/*
<<< <<<< HEAD
      } else { 
        fobject.defaulturi = rt.defaulturi;
        // the rt needs a type
        if (
            bfestore.state === 'create' && 
            _.where(bfestore.store, {
                's': rt.defaulturi,
                'o': rt.resourceURI
            }).length === 0
           ) {
=== ====
*/
      } else {
        fobject.defaulturi = rt.defaulturi;
        // the rt needs a type
        if (bfestore.state === 'create') {
//>>> >>>> aws
          triple = {};
          triple.guid = rt.useguid;
          triple.rtID = rt.id;
          triple.s = rt.defaulturi;
          triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
          triple.o = rt.resourceURI;
          triple.otype = 'uri';
          fobject.store.push(triple);
          
          //console.log('4');
          bfestore.addTriple(triple);
          rt.guid = rt.useguid;
        }

        // This will likely be insufficient - we'll need the entire
        // pre-loaded store in this 'first' form.
        rt.data.forEach(function (t) {
          var triple = {};
          triple = t;
          if (triple.guid === undefined) {
            triple.guid = shortUUID(guid());
          }
          fobject.store.push(triple);
        });
      }

      // Populate form with pre-loaded data.
      bfelog.addMsg(new Error(), 'DEBUG', 'Populating form with pre-loaded data, if any');
      rt.propertyTemplates.forEach(function (property) {
        if(!_.has(property, "valueConstraint")){
          property.valueConstraint = {};
        }
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

  function preloadData(property, rt, form, fobject) {

    var propsdata = _.where(bfestore.store, {
      's': rt.defaulturi,
      'p': property.propertyURI
    }); 

    if (propsdata.length > 0 && _.has(property, 'valueConstraint')) {
      if (_.has(property.valueConstraint, 'valueTemplateRefs') && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
        var parent = _.find(profiles, function (post) {
          for (var i = 0; i < property.valueConstraint.valueTemplateRefs.length; i++) {
            if (_.some(post.Profile.resourceTemplates, { id: property.valueConstraint.valueTemplateRefs[i] }))
            //                            return _.find(post.Profile.resourceTemplates, {id: property.valueConstraint.valueTemplateRefs[i]})
            { return post; }
          }
        });

        if (parent !== undefined) {
          
          var parent_nodes = [];
          var i = 0;
          do {
            if (_.some(parent.Profile.resourceTemplates, { id: property.valueConstraint.valueTemplateRefs[i] })) {
              var node_uri = _.find(parent.Profile.resourceTemplates, { id: property.valueConstraint.valueTemplateRefs[i] }).resourceURI;
              if (_.some(bfestore.store, { o: node_uri })) {
                parent_nodes.push(_.find(bfestore.store, { o: node_uri }));
              }
            }
            i++;
          } while (parent_nodes === undefined || i < property.valueConstraint.valueTemplateRefs.length);

          parent_nodes = _.unique(parent_nodes);

          if (!_.isEmpty(parent_nodes)){
            for (i in propsdata){
              bfelog.addMsg(new Error(), 'DEBUG', 'Matching ' + propsdata[i].o);
              if(!propsdata[i].o.startsWith('_:bnode') && !_.some(bfestore.store, {'s':propsdata[i].o})){
                //add type triple
                var triple = {};
                triple.s = propsdata[i].o;
                triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
                triple.o = parent_nodes[0].o;
                triple.otype = 'uri';
                triple.guid = propsdata[i].guid;
                bfestore.addTriple(triple);
        
                //add label
                bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + propsdata[i].o);
                whichLabel(propsdata[i].o, null, function (label) {
                  var labeltriple = {}
                  labeltriple.s = propsdata[i].o;
                  labeltriple.p = 'http://www.w3.org/2000/01/rdf-schema#label';
                  labeltriple.o = label;
                  labeltriple.otype = 'literal';
                  labeltriple.guid = propsdata[i].guid;
                  bfestore.addTriple(labeltriple);
                });
              }
            }
          }

          var tempprops = [];
          if (!_.isEmpty(parent_nodes)) {
            for (var j = 0; j < parent_nodes.length; j++) {
              // we only want the properties that have the subject which matches the parent node's characteristics
              var bnodes = _.where(bfestore.store, { p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: parent_nodes[j].o });

              for (var k = 0; k < propsdata.length; k++) {
                if (_.some(bnodes, { s: propsdata[k].o })) {
                  tempprops.push(propsdata[k]);
                }
              }
            }
            propsdata = tempprops;
          } else if (bfestore.state === 'loaduri' && propsdata[0].o.startsWith('http://id.loc.gov/resources/works')) {
            // try with id.loc.gov
            triple = {};
            triple.s = propsdata[0].s;
            triple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
            triple.o = 'http://id.loc.gov/ontologies/bibframe/Work';
            triple.otype = 'uri';
            triple.guid = shortUUID(guid());

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
        if (_.some(propsdata, { 's': fobject.resourceTemplates[0].defaulturi })) {
          propsdata.forEach(function (pd) {
            loadPropsdata(pd, property, form, fobject);
          });
        } else {
          bfelog.addMsg(new Error(), 'INFO', 'bnode not matched');
        }
      } else {
        propsdata.forEach(function (pd) {
          loadPropsdata(pd, property, form, fobject);
        });
      }
    } else if (_.has(property, 'valueConstraint')) {

      // we need to convert defaults from the old "defaults" model to the new.
      if (!_.has(property.valueConstraint, 'defaults')) {
        property.valueConstraint.defaults = [];
        var defaultsObj = {};
        if (!_.isEmpty(property.valueConstraint.defaultURI)) {
          defaultsObj.defaultURI = property.valueConstraint.defaultURI;
        }
        if (!_.isEmpty(property.valueConstraint.defaultLiteral)) {
          defaultsObj.defaultLiteral = property.valueConstraint.defaultLiteral;
        }
        if (!_.isEmpty(defaultsObj)) {
          property.valueConstraint.defaults.push(defaultsObj);
        }
      }

      // Otherwise - if the property is not found in the pre-loaded data
      // then do we have a default value?

      for (var d = 0; d < property.valueConstraint.defaults.length; d++) {
        if (!_.isEmpty(property.valueConstraint.defaults[d].defaultURI) || !_.isEmpty(property.valueConstraint.defaults[d].defaultLiteral)) {
          var data;
          var label;
          var displayguid;
          if (property.type.startsWith('literal') || _.isEmpty(property.type)) {
            //the default is the literal
            var literalTriple = {};
            literalTriple.guid = shortUUID(guid());
            if (rt.defaulturi !== undefined && rt.defaulturi !== '') {
              literalTriple.s = rt.defaulturi;
            } else {
              literalTriple.s = editorconfig.baseURI + rt.useguid;
            }
            literalTriple.p = property.propertyURI;
            literalTriple.o = property.valueConstraint.defaults[d].defaultLiteral;
            literalTriple.otype = 'literal';
            label = literalTriple;
            displayguid = literalTriple.guid;
            fobject.store.push(literalTriple);
            bfestore.addTriple(literalTriple);

          } else if (_.has(property.valueConstraint.defaults[d], 'defaultURI') && !_.isEmpty(property.valueConstraint.defaults[d].defaultURI)) {
            data = property.valueConstraint.defaults[d].defaultURI;
            bfelog.addMsg(new Error(), 'DEBUG', 'Setting default data for ' + property.propertyURI);
            var triples = [];
            // is there a type?
            if (_.has(property.valueConstraint.valueDataType, 'dataTypeURI')) {
              var typeTriple = {};              
              typeTriple.guid = shortUUID(guid());
              typeTriple.s = data;
              typeTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
              typeTriple.o = property.valueConstraint.valueDataType.dataTypeURI;
              typeTriple.otype = 'uri';
              fobject.store.push(typeTriple);
              bfestore.addTriple(typeTriple);
              triples.push(typeTriple)
            }

            // set the triples
            triple = {};
            triple.guid = shortUUID(guid());
            if (rt.defaulturi !== undefined && rt.defaulturi !== '') {
              triple.s = rt.defaulturi;
            } else {
              triple.s = editorconfig.baseURI + shortUUID(rt.useguid);
            }
            triple.p = property.propertyURI;
            triple.o = data;
            triple.otype = 'uri';
            fobject.store.push(triple);
            bfestore.addTriple(triple);
            triples.push(triple);

            // set the label
            label = {};
            label.guid = shortUUID(guid());
            if (triple) {
              label.s = triple.o;
            } else {
              label.s = rt.defaulturi;
            }
            displayguid = label.guid;
            label.otype = 'literal';
            label.p = 'http://www.w3.org/2000/01/rdf-schema#label';
            label.o = property.valueConstraint.defaults[d].defaultLiteral;
            fobject.store.push(label);
            bfestore.addTriple(label);
            triples.push(label);
          }

          // set the form
          var $formgroup = $('#' + property.guid, form).closest('.form-group');
          var $save = $formgroup.find('.btn-toolbar').eq(0);

          var displaydata = '';
          if (_.has(property.valueConstraint.defaults[d], 'defaultLiteral')) {
            displaydata = property.valueConstraint.defaults[d].defaultLiteral;
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
            'triples': triples
          };
          var $buttongroup = editDeleteButtonGroup(bgvars);
          $save.append($buttongroup);

//<<< <<<< HEAD
          if (property.repeatable === 'false' || property.valueConstraint.repeatable == 'false') {
//=== ====
//          if (property.repeatable === 'false') {
//>>>> >>> aws
            var $el = $('#' + property.guid, form);
            if ($el.is('input')) {
              $el.prop('disabled', true);
            } else {
              // console.log(property.propertyLabel);
              var $buttons = $('div.btn-group-md', $el).find('button');
              $buttons.each(function () {
                $(this).prop('disabled', true);
              });
            }
          }
        }
      }
    }
  }

  function loadPropsdata(pd, property, form, fobject) {
      bfelog.addMsg(new Error(), 'DEBUG', "loadPropsdata pd: ", pd);
      bfelog.addMsg(new Error(), 'DEBUG', "loadPropsdata property: ", property);
    var $formgroup = $('#' + property.guid, form).closest('.form-group');
    var $save = $formgroup.find('.btn-toolbar').eq(0);
    // console.log(formgroup);
    var displaydata = '';
    var triples = [];
    // console.log("pd.otype is " + pd.otype);
    var hasTemplate = true;

/*
<<< <<<< HEAD
    if (_.find(bfestore.store, {
      s: pd.o,
      p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    })) {
      var propsTemplateIds = _.where(resourceTemplates, {
==== ===
*/
    if (_.some(bfestore.store, {
      s: pd.o,
      p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    })) {
      var rts = [];
      _.where(bfestore.store, {
        s: pd.o,
        p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
      }).forEach (function(type) {    
        rts.concat(_.where(resourceTemplates, {resourceURI: type.o}));
      });

      var propsTemplateIds = [];
      rts.forEach(function (propTemplate){ 
        //var propTemplate = _.where(resourceTemplates, {resourceURI: t.o}); 
        propsTemplateIds.push(propTemplate)
      })
            
        /*var propsTemplateIds = _.where(resourceTemplates, {
// >>>> >>> aws
        resourceURI: _.find(bfestore.store, {
          s: pd.o,
          p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        }).o
<<<< <<< HEAD
      });
    }
    if (propsTemplateIds !== undefined && !_.isEmpty(propsTemplateIds) && bfestore.state !== 'edit') {
==== ===
      });*/
    }

    if (!_.isEmpty(propsTemplateIds) && bfestore.state !== 'edit') {
//>>> >>>> aws
      // if (_.indexOf(property.valueConstraint.valueTemplateRefs, propsTemplateId) < 0)
      var found = false;
      property.valueConstraint.valueTemplateRefs.forEach(function (valueTemplateId) {
        if (_.some(propsTemplateIds, {
          id: valueTemplateId
        })) {
          bfelog.addMsg(new Error(), 'INFO', property.propertyLabel + ' accepts ' + valueTemplateId);
          found = true;
        }
      });
      // kefo note - I added `property.type !== "lookup"``.
      // If the property is used with a resource template - that is, any resource template the editor has knowledge of - 
      // this block - from `if (propsTemplateIds...`` - assumes that the active profile uses 
      // one of those existing resource templates.  But there may be a time when 
      // the property is a simple 'lookup' and not a modal.  
      // My addition will filter based on it being a 'lookup.'
      // I really wanted to add this condition higher up.  For example, there is no 
      // reason to process this block of code at all if it is a lookup.  BUT, I'm 
      // not sure I can make that assumption so this represents a more conservative
      // change. 
      if (!found && property.type !== "lookup") {
        bfelog.addMsg(new Error(), 'INFO', property.propertyLabel + ' did not match' + pd.o);
        hasTemplate = false;
      }
    }

    if (pd.otype == 'uri' || pd.otype == 'list' && hasTemplate) {
      // _.find(resourceTemplates, {resourceURI: _.find(bfestore.store, {s:pd.o, p:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}).o}).id

      triples = _.where(bfestore.store, {
        's': pd.o
      });
      // displaydata = pd.o;
      // console.log("displaydata is " + displaydata);
      var rtype = '';
      //var rparent = '';
      // var fparent = fobject.resourceTemplates[0].defaulturi;
      if (triples.length > 0) {
        triples.forEach(function (t) {
          if (rtype === '' && t.p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
            rtype = t.o;
            //rparent = t.s;
          }
          // if "type" matches a resourceTemplate.resourceURI && one of the property.valueConstraint.templates equals that resource template id....
          var triplesResourceTemplateID = '';
          if (rtype !== '') {
            if (_.has(property, 'valueConstraint')) {
              if (_.has(property.valueConstraint, 'valueTemplateRefs') && !_.isEmpty(property.valueConstraint.valueTemplateRefs)) {
                if (!_.some(resourceTemplates, {'resourceURI': rtype})){
                  //try finding a different type to match
                  var rtypes = _.where(bfestore.store, {"s": t.s, "p":"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"});
                  for (var i=0;i<rtypes.length;i++){
                    if (rtypes[i].o !== rtype){
                      rtype = rtypes[i].o;
                    }
                  }
                }

                var resourceTs = _.where(resourceTemplates, {
                  'resourceURI': rtype
                });  

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
        });
        //label
        displaydata = exports.labelMaker(pd, property);
      }

      if (displaydata === undefined) {
        if (data !== undefined && data.o !== undefined) {
          displaydata = data.o;
        } else {
          //empty template
          hasTemplate = false;
          //displaydata = pd.o;
        }
      } else if (displaydata === '') {
        var labeldata = _.where(bfestore.store, {
          's': pd.o
        });
        
        var data = _.where(labeldata, {
          'otype': 'literal'
        });
        if (data.length > 0) {
          for (var i = 0; i < data.length; i++) {
            displaydata += data[i].o + ' ';
          }
        } else if (pd.p == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
            displaydata = pd.o;
        }
      } else {
        if (_.isArray(displaydata)) {
          _.first(displaydata).trim()
        } else {
          displaydata.trim();
        }
      }
    } else if (hasTemplate) {
      displaydata = pd.o;
    }

    //        if (displaydata == "") {
    //            displaydata = pd.s;
    //        }

    triples.push(pd);

    if (hasTemplate) {
/*
<<< <<<< HEAD
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
          var $buttons = $('div.btn-group-md', $el).find('button');
          $buttons.each(function () {
            $(this).prop('disabled', true);
          });
==== ===
*/
      if (!_.has(property.valueConstraint, "editable")) {
        property.valueConstraint.editable = true;
      }
      if (_.isEmpty(displaydata)){
        whichLabel(pd.o, null, function (label) {
          if (_.isEmpty(displaydata))
            displaydata = label;
        
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
          if (property.repeatable === 'false') {
            var $el = $('#' + property.guid, form);
            if ($el.is('input')) {
              $el.prop('disabled', true);
            } else {
              // console.log(property.propertyLabel);
              var $buttons = $('div.btn-group-md', $el).find('button');
              $buttons.each(function () {
                $(this).prop('disabled', true);
              });
            }
          }
        });
      } else {
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
        if (property.repeatable === 'false') {
          var $el = $('#' + property.guid, form);
          if ($el.is('input')) {
            $el.prop('disabled', true);
          } else {
            // console.log(property.propertyLabel);
            var $buttons = $('div.btn-group-md', $el).find('button');
            $buttons.each(function () {
              $(this).prop('disabled', true);
            });
          }
//>>> >>>> aws
        }
      }
    }
  }

  exports.labelMaker = function (pd, property){
    var displaydata;

    var labeldata = _.where(bfestore.store, {
      's': pd.o
    });

    var parent = _.find(bfestore.store, {'o': pd.o});
    var parentLabel = _.find(bfestore.store, {'s': parent.s, 'p':'http://www.w3.org/2000/01/rdf-schema#label'});

    if (labeldata.length === 1) {
      var tpreflabel;
      var t = labeldata[0];
      if (t.otype === 'uri' || pd.otype == 'list') {
        var tsearch = t.o;
        if (t.p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
          tsearch = t.s;
        }
        if (!tsearch.startsWith('_:b')) {
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + tsearch);
          whichLabel(tsearch, null, function (label) {
            tpreflabel = label;
          });
        }
        displaydata = tpreflabel;
      } else {
        displaydata = t.o;
      }

    } else {
        // labeldata is an array.
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
      
      var titleSortKey = _.find(labeldata, {
        p: 'http://id.loc.gov/ontologies/bflc/titleSortKey'
      });

      if (!_.isEmpty(tpreflabel)) {
        displaydata = tpreflabel;
          
      } else if (!_.isEmpty(tauthlabel)) {
        // Found an authoritative label'
        displaydata = tauthlabel.o;
          
      } else if (!_.isEmpty(tmainTitle)) {
        // Found a main title
        if (!_.isEmpty(titleSortKey))
          titleSortKey.o = tmainTitle.o;

        if (!_.isEmpty(parentLabel))
          parentLabel.o = tmainTitle.o;

        if (!_.isEmpty(tlabel)){
          tlabel.o = tmainTitle.o;
          displaydata = tmainTitle.o;
        } else {
          //create a new label
          displaydata = tmainTitle.o;
        }
          
      } else if (!_.isEmpty(tlabel)) {
        // found rdfs:label
        displaydata = tlabel.o;

      } else if (!_.isEmpty(tvalue)) {
        if (tvalue.o.startsWith('http')) {
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + tvalue.o);
          whichLabel(tvalue.o, null, function (label) {
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
          // No label was found, including an authoritativeLabel, rdfs:label,
          // rdf:value, or bf:mainTitle.
        displaydata = _.last(property.propertyURI.split('/'));
        
        //instance and works
        if (displaydata === 'instanceOf' || displaydata === 'hasInstance') {
          var titledata = _.where(bfestore.store, {
            's': pd.o,
            'p': 'http://id.loc.gov/ontologies/bibframe/title'
          });
          var aapdata = _.where(bfestore.store, {
            's': pd.o,
            'p': 'http://id.loc.gov/ontologies/bflc/aap'
          });
          var provisionActivityStatement = _.where(bfestore.store, {
            's': pd.o,
            'p': 'http://id.loc.gov/ontologies/bibframe/provisionActivityStatement'
          });
          if (!_.isEmpty(titledata)){
            _.each(titledata, function(title){
              if(_.some(bfestore.store, {s: title.o, o: 'http://id.loc.gov/ontologies/bibframe/Title'}))
              {
                displaydata = _.find(bfestore.store, {s: title.o, p: 'http://id.loc.gov/ontologies/bibframe/mainTitle'}).o
              }
            });

          } else if (!_.isEmpty(aapdata)) {
              displaydata = aapdata[0].o;
              
          } else if (!_.isEmpty(provisionActivityStatement)) {
              displaydata = provisionActivityStatement[0].o;
          }
        } else {
            // Not an Instance or Work.
          displaydata = exports.displayDataService(labeldata, displaydata)
        }
      }

      /*if (displaydata === undefined || _.isEmpty(displaydata)) {
        tlabel = _.find(_.where(bfestore.store, {
          's': labeldata[0].o
        }), {
            p: 'http://www.w3.org/2000/01/rdf-schema#label'
          });
        tvalue = _.find(_.where(bfestore.store, {
          's': labeldata[0].o
        }), {
            p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'
          });
        tmainTitle = _.find(_.where(bfestore.store, {
          's': labeldata[0].o
        }), {
            p: 'http://id.loc.gov/ontologies/bibframe/mainTitle'
          });
        if (!_.isEmpty(tlabel)) {
          displaydata = tlabel.o;
        } else if (!_.isEmpty(tmainTitle)) {
          displaydata = tmainTitle.o;
        } else if (!_.isEmpty(tvalue)) {
          displaydata = tvalue.o;
        }
      }*/

      //list, target & note
      if (displaydata === _.last(property.propertyURI.split('/'))) {
        displaydata = displaydata+'+';
        if(!_.isEmpty(labeldata)){
          var tsubject = labeldata[0].o;
          if (_.some(labeldata, {  p: "http://www.loc.gov/mads/rdf/v1#componentList" })) {
            var topics = _.where(labeldata, { p: "http://www.loc.gov/mads/rdf/v1#componentList" })
            var topicLabel;
            topics.forEach(function (t) {
              bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + t.o);
              whichLabel(t.o, null, function (label) {
                if (_.isEmpty(topicLabel)) {
                  topicLabel = label;
                } else {
                  topicLabel += '--' + label;
                }
              });
            });
          } 
          if(!_.isEmpty(tlabel)) {
            _.find(labeldata, {s: tlabel.s, p: "http://www.w3.org/2000/01/rdf-schema#label"}).o = topicLabel;
          } else {
            tlabel = {};
            tlabel.s = tsubject;
            tlabel.p = 'http://www.w3.org/2000/01/rdf-schema#label';
            tlabel.o = topicLabel;
            labeldata.push(tlabel);
          }
          displaydata = topicLabel;
          //update authoritativeLabel
          if (_.some(labeldata, { s: tlabel.s, p: "http://www.loc.gov/mads/rdf/v1#authoritativeLabel" })) {
            _.find(labeldata, { s: tlabel.s, p: "http://www.loc.gov/mads/rdf/v1#authoritativeLabel" }).o = topicLabel;
          }
        }
      }
    }

    return displaydata;

  }

  exports.borderColor = function (selector, bftype) {

    //Works sea green
    if (bftype.endsWith("Work")) {
      selector.style.border = "5px solid seagreen"
    //Instances DarkBlue
    } else if (bftype.endsWith("Instance")){
      selector.style.border = "5px solid DarkBlue"
    //Items SandyBrown
    } else if (bftype.endsWith("Item")) {
      selector.style.border = "5px solid SandyBrown"
    //No border
    } else {
      selector.style.border = "1px solid rgba(0,0,0,.2);"
    }

  }

  // callingformobjectid is as described
  // loadtemplate is the template objet to load.
  // resourceURI is the resourceURI to assign or to edit
  // inputID is the ID of hte DOM element within the loadtemplate form
  // triples is the base data.
  function openModal(callingformobjectid, loadtemplate, resourceURI, inputID, triples) {

    // Modals
    var modal = '<div class="modal fade" id="bfeditor-modal-modalID" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"> \
              <div class="modal-dialog modal-lg"> \
                  <div class="modal-content"> \
                      <div class="modal-header"> \
                          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                          <button type="button" class="btn btn-primary save" id="bfeditor-modalSaveHeader-modalID">Save changes</span></button> \
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
        if (RegExp(/(:Work|:Instance|:Item)$/).test(loadtemplate.id)){ 
          bfeditor.bfestore.addModalAdminMetadata(resourceURI, loadtemplate.id);
        }
        if (!_.isEmpty(properties[0] )) {
          var triplepassed = {};
          triplepassed.guid = shortUUID(guid());
          triplepassed.s = t.defaulturi;
          triplepassed.p = properties[0].propertyURI; // instanceOF
          triplepassed.o = resourceURI;
          triplepassed.otype = 'uri';
          if (properties[0].type === 'list') {
            triplepassed.otype = properties[0].type;
            if (_.has(properties[0].valueConstraint.valueDataType, 'dataTypeURI')) {
              var typeTriple = {};              
              typeTriple.guid = shortUUID(guid());
              typeTriple.s = t.defaulturi;
              typeTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
              typeTriple.o = properties[0].valueConstraint.valueDataType.dataTypeURI;
              typeTriple.otype = 'uri';
              triplespassed.push(typeTriple)
            }
          }
          triplespassed.push(triplepassed);

          triplepassed = {};
          triplepassed.guid = shortUUID(guid());
          triplepassed.s = resourceURI;
          triplepassed.rtID = loadtemplate.id;
          triplepassed.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
          triplepassed.o = loadtemplate.resourceURI;
          triplepassed.otype = 'uri';
          triplespassed.push(triplepassed);
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
    if (resourceURI.match(/^http/)) {
      var rid = resourceURI;
      var $resourceInfo = $('<a><span class="glyphicon glyphicon-info-sign"></span></a>');
      $resourceInfo.attr('data-content', rid);
      $resourceInfo.attr('data-toggle', 'popover');
      $resourceInfo.attr('title', 'Resource ID');
      $resourceInfo.attr('id', 'resource-id-popover');
      $resourceInfo.popover({ trigger: "click hover" });
      $('#bfeditor-modaltitle-' + form.formobject.id).append($resourceInfo);
    }   
    
    $('#bfeditor-form-' + form.formobject.id + ' > div > h3').remove();
    $('#bfeditor-modal-' + form.formobject.id).modal({backdrop: 'static'});
    $('#bfeditor-modal-' + form.formobject.id).modal('show');
    $('#bfeditor-modalCancel-' + form.formobject.id).attr('tabindex', tabIndices++);

    $('#bfeditor-modal-' + form.formobject.id).draggable({
      handle: ".modal-header"
    });

//<<< <<<< HEAD
//    $('#bfeditor-modalSave-' + form.formobject.id).click(function () {
//==== ===
    var saveChanges = function () {
// >>>> >>> aws
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
/*
<<< <<<< HEAD
        setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, form.formobject.defaulturi, inputID, _.uniq(form.formobject.store));
      }
    });
    $('#bfeditor-modalSave-' + form.formobject.id).attr('tabindex', tabIndices++);
    $('#bfeditor-modalSaveLookup-' + form.formobject.id).click(function () {
      triples.forEach(function (triple) {
        removeTriple(callingformobjectid, inputID, null, triple);
      });

      var data = form.formobject.store;

      setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, form.formobject.defaulturi, inputID, _.uniq(data));
    });
=== ====
*/

        setResourceFromModal(callingformobjectid, form.formobject.id, resourceURI, form.formobject.defaulturi, inputID, _.uniq(form.formobject.store));
        bfe.saveNoExit();
      }
    }
    $('#bfeditor-modalSave-' + form.formobject.id).click(saveChanges);
    $('#bfeditor-modalSaveHeader-' + form.formobject.id).click(saveChanges);
    $('#bfeditor-modalSave-' + form.formobject.id).attr('tabindex', tabIndices++);
    
// >>> >>>> aws
    $('#bfeditor-modal-' + form.formobject.id).on('hide.bs.modal', function () {
      $(this).empty();
    });

    $('.typeahead', form.form).each(function () {
      setTypeahead(this);
    });

    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
    $('#bfeditor-modal-' + form.formobject.id).on('shown.bs.modal', function () {
      $('input:visible:enabled:first', this).focus();
    });
  }

  exports.saveNoExit = function(){
    $('.alert').remove();
    $('#bfeditor-exitpublish').prop('disabled',true);
    $('#bfeditor-exitsave').prop('disabled',true);
    
    $('#resource-id-popover #savemessage').remove();
    $('#resource-id-popover #savingicon').remove();
        
    if (editorconfig.save !== undefined ) {
        var good_to_save = true;
        if (entryfunc == "lcapplication") {
            // If there is no mainTitle OR the profile contains the word "test", then do not save.
            if (
                    _.some(bfestore.store, { 'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle' }) === false || 
                    bfeditor.bfestore.profile.match(/[T|t]est/)
                ) {
                    good_to_save = false;
                    // title required
            }
        }
        if (good_to_save) {
        
            var $savingInfo = $('<span id="savingicon" style="color: black" class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>');
            $('#bfeditor-exitcancel').text("Cancel");
            $('#resource-id-popover').append($savingInfo);
            
            bfestore.addedProperties = addedProperties;
            editorconfig.save.callback( {bfestore: bfestore, bfelog: bfelog, version: createVersion} , function (success, data) {
                createVersion = 0;
                $('#resource-id-popover #savingicon').remove()
                $('#resource-id-popover #savemessage').remove();
                
                if (data.status == "success") {
                    bfelog.addMsg(new Error(), 'INFO', 'Saved: ' + data.name);
                    var $successInfo = $('<span id="savemessage" style="color: #228B22" class="glyphicon glyphicon-ok-circle"></span>');
                    $('#resource-id-popover').append($successInfo);
                } else {
                    var $failInfo = $('<span id="savemessage" style="color: red" class="glyphicon glyphicon-remove-circle"></span>');
                    $('#resource-id-popover').append($failInfo);
                    
                    var $messagediv = $('<div>', { id: 'bfeditor-messagediv', class: 'alert alert-danger', role: 'alert' });
                    $messagediv.append('<div class="alert alert-danger"><strong>Save Failed:</strong>' + data.errorThrown + '</span>');
                    $messagediv.insertBefore('.nav-tabs');
                }   
                $('#bfeditor-exitcancel').text("Close");
            });
        } else {
            // Not saved.
            $('#resource-id-popover #savemessage').remove();
            
            var $failInfo = $('<span id="savemessage" style="color: red" class="glyphicon glyphicon-remove-circle"></span>');
            $('#resource-id-popover').append($failInfo);
        }
        
        $('#bfeditor-exitpublish').prop('disabled',false);
        $('#bfeditor-exitsave').prop('disabled',false);
        
    }
  }

  function setResourceFromModal(formobjectID, modalformid, resourceID, resourceSubject, propertyguid, data) {
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

    var lookupLabel;
    var tsubject = resourceID;
    var callingformobject = _.where(forms, {
      'id': formobjectID
    });
    callingformobject = callingformobject[0];
    var resourcetemplate = _.find(_.find(forms, { 'id': modalformid }).resourceTemplates, { defaulturi: resourceID });

    // add the resourceType for the form
    var resourceType = {
      'guid': shortUUID(guid()),//propertyguid,
      's': resourceSubject,
      'otype': 'uri',
      'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
      'o': resourcetemplate.resourceURI
    };

    resourceType.rtID = _.where(callingformobject.resourceTemplates[0].propertyTemplates, {
      'guid': propertyguid
    })[0].valueConstraint.valueTemplateRefs[0];

    if( resourcetemplate.propertyTemplates[0].type === 'target'){
      //_.some(data, {'p': "http://id.loc.gov/ontologies/bflc/target"}) 
      //targets are converted to resources if they do not have additional properties
      var target = _.find(data, {'p': "http://id.loc.gov/ontologies/bflc/target"});
      //ignoring types, are there any other triples?
      var bnode = target.s;
      var bnodes = _.where(data, {s: bnode});
      var tcount = _.reject(bnodes, {p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}).length;
      if (tcount === 1){
        //convert to resource
        data = _.reject(data, {s: bnode});
        _.find(data, {o: bnode}).o = target.o;
        resourceType.s = target.o;
      } 
    } else if (resourcetemplate.propertyTemplates[0].type === 'lookup') {
      //var lookup = _.find(data, {p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: resourcetemplate.resourceURI});
      var lookup = _.find(data, {'p': resourcetemplate.resourceURI});
      if (!_.isEmpty(lookup)){
        lookupLabel = _.find(data, {s: lookup.s, p: "http://www.w3.org/2000/01/rdf-schema#label"});
        //bnode = lookup.s;
        bnode = resourceID;
        bnodes = _.where(data, {s: bnode});
        tcount = _.reject(bnodes, {p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}).length;
        if (tcount === 1 || lookup.o.match(/resource/)){
        //convert to resource
          data = _.reject(data, {s: bnode});
          if (_.some(data, {o: bnode})){
            _.find(data, {o: bnode}).o = lookup.o;
          }
          resourceType.s = lookup.o;
        } else {
          //stick with bnode
          data = _.reject(data, {s:lookup.o});
          data = _.reject(data, {p: resourcetemplate.resourceURI});
          bfestore.store = _.reject(bfestore.store, {s:lookup.o});
          bfestore.store = _.reject(bfestore.store, {p: resourcetemplate.resourceURI});
        }
      }
    }

    if(!_.some(data, {p: resourceType.p, o: resourceType.o}))
      data.push(resourceType);

    callingformobject.resourceTemplates.forEach(function (resourceTemplate) {
      var properties = _.where(resourceTemplate.propertyTemplates, {
        'guid': propertyguid
      });
      if (!_.isEmpty(properties[0])) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Data from modal: ', data);

        var $formgroup = $('#' + propertyguid, callingformobject.form).closest('.form-group');
        var save = $formgroup.find('.btn-toolbar')[0];

        bfelog.addMsg(new Error(), 'DEBUG', 'Selected property from calling form: ' + properties[0].propertyURI);
        var display = exports.labelMakerModal(tsubject, data, lookupLabel)

        data.forEach(function (triple) {
          callingformobject.store.push(triple);
          bfestore.addTriple(triple);
          // bfestore.store.push(t);
        });

        bfestore.storeDedup();

        var connector = _.where(data, {
          'p': properties[0].propertyURI
        });

        if((connector[0].p === 'http://id.loc.gov/ontologies/bibframe/title' || connector[0].p === 'http://id.loc.gov/ontologies/bibframe/instanceOf')  && resourceTemplate.embedType === 'page' ){
          //lookup bf:Title only
          var title = _.find(bfestore.store, {
            's': connector[0].o,
            'o': 'http://id.loc.gov/ontologies/bibframe/Title'
          });
          //if empty
          if(_.isEmpty(title)){
            var titles = _.where(bfestore.store, {
              's': connector[0].o,
              'p': 'http://id.loc.gov/ontologies/bibframe/title'
            });
            //work title
            for(var i=0;i<titles.length;i++){
              var searchTitle = titles[i];
              if (_.some(bfestore.store, {
                's': searchTitle.o,
                'o': 'http://id.loc.gov/ontologies/bibframe/Title'
              }) ) {
                title = _.find(bfestore.store, {
                  's': searchTitle.o,
                  'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle'
                });
              }
            }
          }
          //find bf:title/bf:Title/bf:mainTitle
          if (!_.isEmpty(title)) {
            var mainTitle = _.find(bfestore.store, {
              's': title.s,
              'p': 'http://id.loc.gov/ontologies/bibframe/mainTitle'
            });
            if (!_.isEmpty(mainTitle)) {
              display.displaydata = mainTitle.o;
              $('#resource-title>a').attr('data-original-title', mainTitle.o);
              $('#resource-title>a').attr('title', mainTitle.o);
              if(_.some(bfestore.store, {s: mainTitle.s, p: 'http://www.w3.org/2000/01/rdf-schema#label'})){
                _.find(bfestore.store, {s: mainTitle.s, p: 'http://www.w3.org/2000/01/rdf-schema#label'}).o = mainTitle.o;
              } else { 
                //add label triple
                var labelTriple = {};
                labelTriple.s = mainTitle.s;
                labelTriple.p = 'http://www.w3.org/2000/01/rdf-schema#label'
                labelTriple.o = mainTitle.o;
                labelTriple.guid = shortUUID(guid());
                labelTriple.otype = 'literal';
                bfestore.addTriple(labelTriple);
              }
            }
          }
        }
        var bgvars = {
          'tguid': connector[0].guid,
          'tlabelhover': display.displaydata,
          'tlabel': display.displaydata,
          'tlabelURI': display.displayuri,
          'fobjectid': formobjectID,
          'inputid': propertyguid,
          'editable': properties[0].valueConstraint.editable,
          'triples': data
        };
        var $buttongroup = editDeleteButtonGroup(bgvars);

        $(save).append($buttongroup);
        // $("#" + propertyguid, callingformobject.form).val("");
        if (properties[0].repeatable !== undefined && properties[0].repeatable == 'false') {
          //$('#' + propertyguid, callingformobject.form).attr('disabled', true);
          $('#' + propertyguid + ' div.btn-group-md button', callingformobject.form).attr('disabled', true);
        }
      }
    });
    // Remove the form?
    // forms = _.without(forms, _.findWhere(forms, {"id": formobjectID}));
    $('#bfeditor-modalSave-' + modalformid).off('click');
    $('#bfeditor-modal-' + modalformid).modal('hide');

    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  exports.labelMakerModal = function (tsubject, data, lookupLabel) {

    var parent = _.find(data, {'o': tsubject});
    var parentLabel;
    if (!_.isEmpty(parent)){
      parentLabel = _.find(bfestore.store, {'s': parent.s, 'p':'http://www.w3.org/2000/01/rdf-schema#label'});
    }
    var tauthlabel = _.find(data, {
      s: tsubject,
      p: 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
    });
    var tlabel = _.find(data, {
      s: tsubject,
      p: 'http://www.w3.org/2000/01/rdf-schema#label'
    });
    var tvalue = _.find(data, {
      s: tsubject,
      p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value'
    });
    var tmainTitle = _.find(data, {
      s: tsubject,
      p: 'http://id.loc.gov/ontologies/bibframe/mainTitle'
    });
    var titleSortKey = _.find(data, {
      s: tsubject,
      p: 'http://id.loc.gov/ontologies/bflc/titleSortKey'
    });

    //componentlist label
    if (_.some(data, { s: tsubject, p: "http://www.loc.gov/mads/rdf/v1#componentList" })) {
      var topics = _.where(data, { s: tsubject, p: "http://www.loc.gov/mads/rdf/v1#componentList" })
      var topicLabel;
      topics.forEach(function (t) {
        bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + t.o);
        whichLabel(t.o, data, function (label) {
          if (_.isEmpty(topicLabel)) {
            topicLabel = label;
          } else {
            topicLabel += '--' + label;
          }
        });
      });
      if(!_.isEmpty(tlabel)) {
        _.find(data, {s: tsubject, p: "http://www.w3.org/2000/01/rdf-schema#label"}).o = topicLabel;
      } else if(!_.some(data, {p: "http://www.w3.org/2000/01/rdf-schema#label", o: topicLabel})){
        tlabel = {};
        tlabel.guid = shortUUID(guid()),
        tlabel.otype = 'literal',
        tlabel.s = tsubject;
        tlabel.p = 'http://www.w3.org/2000/01/rdf-schema#label';
        tlabel.o = topicLabel;
        data.push(tlabel);
      }
      //update authoritativeLabel
      if (_.some(data, { s: tsubject, p: "http://www.loc.gov/mads/rdf/v1#authoritativeLabel" })) {
        _.find(data, { s: tsubject, p: "http://www.loc.gov/mads/rdf/v1#authoritativeLabel" }).o = topicLabel;
      }
    }
    // if there's a label, use it. Otherwise, create a label from the literals, and if no literals, use the uri.
    var displayuri = /[^/]*$/.exec(_.find(data, { p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' }).o)[0];
    var displaydata = '';
    if (!_.isEmpty(lookupLabel)){
      displaydata = lookupLabel.o;
      displayuri = lookupLabel.s;
    } else if (!_.isEmpty(tauthlabel)) {
      displaydata = tauthlabel.o;
      displayuri = tauthlabel.s;
    } else if (!_.isEmpty(tmainTitle)) {
      if (!_.isEmpty(titleSortKey))
        titleSortKey.o = tmainTitle.o;
      if (!_.isEmpty(parentLabel))
        parentLabel.o = tmainTitle.o;
      if (!_.isEmpty(tlabel)) {
        tlabel.o = tmainTitle.o;
        displaydata = tmainTitle.o;
        displayuri = tmainTitle.s;
      } else {
        //create a new label
        displaydata = tmainTitle.o;
        displayuri = tmainTitle.s;
      }
    } else if (!_.isEmpty(tlabel)) {
      displaydata = tlabel.o;
      displayuri = tlabel.s;
    } else if (!_.isEmpty(tvalue)) {
      displaydata = tvalue.o;
      displayuri = tvalue.s;
    } else if (!_.isEmpty(parent)){
        displayuri = parent.o;
        var relationship = _.last(parent.p.split('/'));
        //instance and works
        if (relationship === 'instanceOf' || relationship === 'hasInstance'){
          var titledata = _.where(data, {
            's': displayuri,
            'p': 'http://id.loc.gov/ontologies/bibframe/title'
          });
          if (!_.isEmpty(titledata)){
            _.each(titledata, function(title){
              if(_.some(data, {s: title.o, o: 'http://id.loc.gov/ontologies/bibframe/Title'}))
              {
                displaydata = _.find(data, {s: title.o, p: 'http://id.loc.gov/ontologies/bibframe/mainTitle'}).o
              }
            });
          }
        } else {
          displaydata = exports.displayDataService(data, relationship);
        }
    } else {
      displaydata = exports.displayDataService(data, relationship);
    }
    
    return {
      displayuri: displayuri,
      displaydata: displaydata
    }
  }

  exports.displayDataService = function(labeldata, displaydata){
    if (displaydata === 'adminMetadata') {
      var admindisplaydata = '';

      if(_.some(labeldata, { p: 'http://id.loc.gov/ontologies/bflc/catalogerId' })){
        admindisplaydata = _.find(labeldata, { p: 'http://id.loc.gov/ontologies/bflc/catalogerId' }).o
      }
      
      if(_.some(labeldata, { p: 'http://id.loc.gov/ontologies/bflc/profile' })){
        admindisplaydata += ' ' + _.find(labeldata, { p: 'http://id.loc.gov/ontologies/bflc/profile' }).o
      } 
      
      if(_.some(labeldata, { p: 'http://id.loc.gov/ontologies/bibframe/changeDate' })){
        admindisplaydata += ' ' +_.find(labeldata, { p: 'http://id.loc.gov/ontologies/bibframe/changeDate' }).o
      }

      if (!_.isEmpty(admindisplaydata))
        displaydata = admindisplaydata;

    } else if (displaydata === 'contribution') {
      // lookup agent and role;
      var role = _.find(labeldata, {
        'p': 'http://id.loc.gov/ontologies/bibframe/role'
      });
      var agent = _.find(labeldata, {
        'p': 'http://id.loc.gov/ontologies/bibframe/agent'
      });

      if (!_.isEmpty(agent)) {
        if (agent.o.match(/#Agent/) || agent.o.startsWith('_:b')) {
          var agentLabel = _.find(bfestore.store, {
            's': agent.o,
            'p': 'http://www.w3.org/2000/01/rdf-schema#label'
          });

          if (!_.isEmpty(agentLabel)) {
            displaydata = agentLabel.o;
          }
        } else {
          // try looking up
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + agent.o);
          whichLabel(agent.o, null, function (label) {
            if (!_.isEmpty(label)) 
              { displaydata = label; }
          });
        }
      }
      if (!_.isEmpty(role)) {
        if (role.o.match(/#Role/) || role.o.startsWith('_:b')) {
          var roleLabel = _.find(bfestore.store, {
            's': role.o,
            'p': 'http://www.w3.org/2000/01/rdf-schema#label'
          });

          if (!_.isEmpty(roleLabel) && displaydata !== 'contribution') {
            if (displaydata.endsWith(','))
              displaydata = displaydata + ' ' + roleLabel.o;
            else
              displaydata = displaydata + ', ' + roleLabel.o; 
          }
        } else {
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + role.o);
          whichLabel(role.o, null, function (label) {
            if (!_.isEmpty(label) && displaydata !== 'contribution') 
              { if (displaydata.endsWith(','))
                  displaydata = displaydata + ' ' + label; 
                else
                  displaydata = displaydata + ', ' + label; 
              }
          });
        }
      }
    } else if (displaydata === 'relationship') {
      // lookup agent and role;
      var relation = _.find(labeldata, {
        'p': 'http://id.loc.gov/ontologies/bflc/relation'
      });
      var relatedTo = _.find(labeldata, {
        'p': 'http://id.loc.gov/ontologies/bibframe/relatedTo'
      });

      if (!_.isEmpty(relatedTo)) {
        if (relatedTo.o.match(/#Work/) || relatedTo.o.startsWith('_:b')) {
          var workLabel = _.find(bfestore.store, {
            's': relatedTo.o,
            'p': 'http://www.w3.org/2000/01/rdf-schema#label'
          });

          if (!_.isEmpty(workLabel)) {
            displaydata = workLabel.o;
          } else {
            displaydata = relatedTo.o
          }
        } else {
          // try looking up
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + relatedTo.o);
          whichLabel(relatedTo.o, null, function (label) {
            if (!_.isEmpty(label)) 
              { displaydata = label; }
          });
        }
      }
      if (!_.isEmpty(relation)) {
        if (relation.o.match(/#Relation/) || relation.o.startsWith('_:b')) {
          var relationLabel = _.find(bfestore.store, {
            's': relation.o,
            'p': 'http://www.w3.org/2000/01/rdf-schema#label'
          });

          if (!_.isEmpty(relationLabel) && displaydata !== 'relationship') {
            displaydata = relationLabel.o + ' ' + displaydata;
          }
        } else {
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + relation.o);
          whichLabel(relation.o, null, function (label) {
            if (!_.isEmpty(label) && displaydata !== 'relationship') 
              { 
                  displaydata = label + ' ' + displaydata;
              }
          });
        }
      }

    } else if (displaydata === 'hasItem') {
      displaydata = "Item";
      if(_.some(labeldata, {
        'p': 'http://id.loc.gov/ontologies/bibframe/identifiedBy'
      })) {
        _.each(_.where(labeldata, {
          'p': 'http://id.loc.gov/ontologies/bibframe/identifiedBy'
        }), function(id) {
            if(_.some(bfestore.store, {s: id.o, p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", o: 'http://id.loc.gov/ontologies/bibframe/ShelfMarkLcc' })){
              var shelfmarkdata = _.where(bfestore.store, {s: id.o});
              //look for literals and concatenate them
              var literallabel = '';
              _.each(_.where(shelfmarkdata, {otype: 'literal'}), function(label){
                if(label.p === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#value')
                  //switch to rdfs.label
                  label.p = 'http://www.w3.org/2000/01/rdf-schema#label';
                literallabel += label.o + ' ';
              });
              if (!_.isEmpty(literallabel)){
                //add enumeration
                if(_.some(labeldata, {p: "http://id.loc.gov/ontologies/bibframe/enumerationAndChronology"})){
                  literallabel += ' ' + _.find(bfestore.store,{s: _.find(labeldata, {p: "http://id.loc.gov/ontologies/bibframe/enumerationAndChronology"}).o, otype: 'literal'}).o
                }
                displaydata = literallabel.trim();
              }
            }
        })
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
          var placeLabel = _.find(bfestore.store, {
            's': place.o,
            'p': 'http://www.w3.org/2000/01/rdf-schema#label'
          }).o;
        } else {
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + place.o);
          whichLabel(place.o, null, function (label) {
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
          });
          if (!_.isEmpty(agentLabel)) {
            agentLabel = agentLabel.o;
          }
        } else if (agent.o.startsWith('//mlvlp06.loc.gov')) {
          var newagent = agent.o.replace(/\/\/mlvlp06.loc.gov:8288\/bfentities/, 'http://id.loc.gov/entities');
          
          _.each(_.where(bfestore.store, {
            's': agent.o,
          }), function (entity){
            entity.s = newagent;
          });
          
          agent.o = newagent;

          agentLabel = _.find(bfestore.store, {
            's': agent.o,
            'p': 'http://www.w3.org/2000/01/rdf-schema#label'
          }).o;

        } else {
          bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + agent.o);
          whichLabel(agent.o, null, function (label) {
            agentLabel = label;
          });
        }
      }

      var date = _.find(labeldata, {
        'p': 'http://id.loc.gov/ontologies/bibframe/date'
      });
      if (!_.isEmpty(date)) { 
        var dateLabel = date.o; 
      }

      if (!_.isEmpty(placeLabel) && !_.isEmpty(agentLabel) && !_.isEmpty(dateLabel)) {
        displaydata = placeLabel  + ': ' + agentLabel + ', ' + dateLabel;
      } else if (!_.isEmpty(placeLabel) && !_.isEmpty(agentLabel) && _.isEmpty(dateLabel)) {
        displaydata = placeLabel + ': ' + agentLabel;
      } else if (_.isEmpty(placeLabel) && !_.isEmpty(agentLabel) && !_.isEmpty(dateLabel)) {
        displaydata = agentLabel + ', ' + dateLabel;
      } else if (!_.isEmpty(placeLabel) && _.isEmpty(agentLabel) && !_.isEmpty(dateLabel)) {
        displaydata = placeLabel + ', ' + dateLabel;
      }
    } else if (displaydata === 'v1#componentList' || displaydata === 'genreForm') {
      displaydata = "";
      _.forEach(labeldata, function (triple) {
        bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + triple.s);
        whichLabel(triple.s, null, function (label) {
          displaydata = label;
        });
      });
    }  else if (_.some(labeldata, { p: "http://id.loc.gov/ontologies/bflc/target" })) {
      //target
      var targets = _.where(labeldata, { p: "http://id.loc.gov/ontologies/bflc/target" })
      targets.forEach(function (t) {
        bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel from: ' + t.o);
        whichLabel(t.o, null, function (label) {
          displaydata = label;
        });
      });
    } else if (_.some(labeldata, { p: "http://id.loc.gov/ontologies/bibframe/note" })) {
      var notes = _.where(labeldata, { p: "http://id.loc.gov/ontologies/bibframe/note" })
      notes.forEach(function (n) {
        //null check?
        displaydata = displaydata + _.find(bfestore.store, {
          's': n.o,
          'p': 'http://www.w3.org/2000/01/rdf-schema#label'
        }).o;
      });
    } else {
      //look for literals and concatenate them
      var literallabel = '';
      _.each(_.where(labeldata, {otype: 'literal'}), function(label){
        literallabel += label.o + ' ';
      });
      if (!_.isEmpty(literallabel)){
        displaydata = literallabel.trim();
      }
    }

    return displaydata
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

    if (bgvars.editable === undefined || bgvars.editable === "true" || bgvars.editable === true) {
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
      bfe.saveNoExit();
    });
    $buttongroup.append($delbutton);

    return $buttongroup;
  }

  function setRtLabel(formobjectID, resourceID, inputID, rt) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    var data = $('#' + inputID).val();
    if (!_.isEmpty(data)) {
      var triple = {};
      triple.guid = shortUUID(guid());
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

  function setLiteral(formobjectID, resourceID, inputID) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    // console.log(inputID);
    var data = $('#' + inputID, formobject.form).val();
    if (!_.isEmpty(data)) {
      
      // check if there there assoicated lang and script values for this input
      var lang = null;
      var script = null;
      if ($('#' + inputID + '-lang') && $('#' + inputID + '-script')){
        lang = $('#' + inputID + '-lang').val()
        script = $('#' + inputID + '-script').val();
        
        if (script != ''){
          lang = lang + '-' + script
        }
        
        if (lang==='undefined-undefined' || lang==='undefined'){
          lang = null;
        }
        
        
      }
    
      var triple = {};
      triple.guid = shortUUID(guid());
      formobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': inputID
        });
        triple.rtID = t.id;
        if (!_.isEmpty(properties[0] )) {
          if (!_.isEmpty(t.defaulturi)) {
            triple.s = t.defaulturi;
          } else {
            // triple.s = editorconfig.baseURI + resourceID;
            triple.s = t.resouceURI;
          }
          triple.p = properties[0].propertyURI;
          triple.o = data;
          triple.otype = 'literal';
          if (lang){
            triple.olang = lang;
          }
          // triple.olang = "";

          
          // bfestore.store.push(triple);
          bfestore.addTriple(triple);
          formobject.store.push(triple);

          var formgroup = $('#' + inputID, formobject.form).closest('.form-group');
          var save = $(formgroup).find('.btn-toolbar')[0];
          var buttonLabel = data;
          if (lang){
            buttonLabel = buttonLabel + '@' + lang
          }
          var bgvars = {
            'tguid': triple.guid,
            'tlabel': buttonLabel,
            'tlabelhover': buttonLabel,
            'fobjectid': formobjectID,
            'inputid': inputID,
            'triples': [triple]
          };
          var $buttongroup = editDeleteButtonGroup(bgvars);

          $(save).append($buttongroup);
          $('#' + inputID, formobject.form).val('');
          $('#' + inputID + '-lang').val('lang');
          $('#' + inputID + '-script').val('');
          if (properties[0].repeatable !== undefined && properties[0].repeatable == 'false') {
            $('#' + inputID, formobject.form).attr('disabled', true);
          }
        }
      });
    }
    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function setResourceFromLabel(formobjectID, resourceID, inputID) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    formobject = formobject[0];
    // console.log(inputID);
    var data = $('#' + inputID, formobject.form).val();
    if (!_.isEmpty(data)) {
      var triple = {};
      triple.guid = shortUUID(guid());
      formobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': inputID
        });
        triple.rtID = t.id;
        if (!_.isEmpty(properties[0] )) {
          if (!_.isEmpty(t.defaulturi )) {
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

  function setTypeahead(input) {
    var lcshared = require('src/lookups/lcshared');

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
      if (!_.isEmpty(properties[0] )) {
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
      dshash.source = function (query, sync, async) {
        lu.load.source(query, sync, async, formobject);
      };
      dshash.limit = 50;
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
    
    var buildContextHTML = function(data){
      var html = '';
      
        if (data.variant.length > 0) {
          html = html + '<div class="context-sources-list">';
          html = html + '<h5>Variants</h5><ul>';
          data.variant.forEach(function (c) {
            html = html + '<li>' + c + '</li>';
          });
          html = html + '</ul>';
        }

        if (data.source.length > 0) {
          html = html + '<h5>Sources</h5><ul>';
          data.source.forEach(function (c) {
            html = html + '<li>' + c + '</li>';
          });
          html = html + '</ul>';
        }
        
        if (data.contributor.length > 0) {
          html = html + '<h5>Contributors</h5><ul>';
          data.contributor.forEach(function (c) {
            html = html + '<li>' + c + '</li>';
          });
          html = html + '</ul>';
        }
        
        if (data.title) {
          html = html + '<h5>Main Title</h5><ul>';
            html = html + '<li>' + data.title + '</li>';
          html = html + '</ul>';
        }
        if (data.date) {
          html = html + '<h5>Creation Date</h5><ul>';
            html = html + '<li>' + data.date + '</li>';
          html = html + '</ul>';
        }
        if (data.genreForm) {
          html = html + '<h5>Genre Form</h5><ul>';
            html = html + '<li>' + data.genreForm + '</li>';
          html = html + '</ul>';
        }
        
        

        if (data.nodeMap.birthDate && data.nodeMap.birthDate.length > 0) {
          html = html + '<h5>Birth Date</h5><ul>';
          data.nodeMap.birthDate.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }
        if (data.nodeMap.deathDate && data.nodeMap.deathDate.length > 0) {
          html = html + '<h5>Death Date</h5><ul>';
          data.nodeMap.deathDate.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }
        
        if (data.nodeMap.birthPlace && data.nodeMap.birthPlace.length > 0) {
          html = html + '<h5>Birth Place</h5><ul>';
          data.nodeMap.birthPlace.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }      
        if (data.nodeMap.associatedLocale && data.nodeMap.associatedLocale.length > 0) {
          html = html + '<h5>Associated Locale</h5><ul>';
          data.nodeMap.associatedLocale.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }  
        if (data.nodeMap.fieldOfActivity && data.nodeMap.fieldOfActivity.length > 0) {
          html = html + '<h5>Field Of Activity</h5><ul>';
          data.nodeMap.fieldOfActivity.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }  
        if (data.nodeMap.gender && data.nodeMap.gender.length > 0) {
          html = html + '<h5>Gender</h5><ul>';
          data.nodeMap.gender.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }  
        if (data.nodeMap.occupation && data.nodeMap.occupation.length > 0) {
          html = html + '<h5>Occupation</h5><ul>';
          data.nodeMap.occupation.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }  
        if (data.nodeMap.associatedLanguage && data.nodeMap.associatedLanguage.length > 0) {
          html = html + '<h5>Associated Language</h5><ul>';
          data.nodeMap.associatedLanguage.forEach(function (c) {
            html = html + '<li>' + c.replace(/^\([a-z]+\)\s/,'') + '</li>';
          });
          html = html + '</ul>';
        }  
        if (data.nodeMap.hasBroaderAuthority && data.nodeMap.hasBroaderAuthority.length > 0) {
          html = html + '<h5>Broader</h5><ul>';
          data.nodeMap.hasBroaderAuthority.forEach(function (c) {
            html = html + '<li>' + c + '</li>';
          });
          html = html + '</ul>';
        }  
        if (data.nodeMap.hasNarrowerAuthority && data.nodeMap.hasNarrowerAuthority.length > 0) {
          html = html + '<h5>Narrower</h5><ul>';
          data.nodeMap.hasNarrowerAuthority.forEach(function (c) {
            html = html + '<li>' + c + '</li>';
          });
          html = html + '</ul>';
        }  
        
        html = html + '</div><div style="text-align:right"><a target="_blank" href="' + data.uri + '">View on id.loc.gov</a></div>'
        return html;
      
    }
    
    $(input).on('typeahead:render', function (event, suggestions, asyncFlag, dataset) {
      bfelog.addMsg(new Error(), 'DEBUG', event, suggestions, asyncFlag, dataset);

      if (editorconfig.buildContext) {

        $('.tt-suggestion').each(function (i, v) {
          v = $(v);
          // already has been tooltipterized
          if (v.hasClass('tooltipstered')) {
            return true
          }

          // this grabs the URI for the typeahead and filters it on the url paths defined to have lookup information displayed, if it is > 0 then it passed the filter
          var shouldBuildContext = editorconfig.buildContextFor.filter(function (f) { return v.data().ttSelectableObject.uri.indexOf(f) > -1 });
          if (shouldBuildContext == 0) {
            return true
          }

          v.tooltipster({
            position: 'left',
            theme: 'tooltipster-shadow',
            contentAsHTML: true,
            animation: 'fade',
            updateAnimation: null,
            interactive: true,
            delay: [0, 300],
            content: '<strong>Loading...</strong>',
            // 'instance' is basically the tooltip. More details in the "Object-oriented Tooltipster" section.
            functionBefore: function (instance, helper) {
              // close anyone that are open
              $('.tt-suggestion').each(function (i, v) {
                v = $(v);
                if (v.hasClass('tooltipstered') && !v.tooltipster('status').destroyed) {
                  v.tooltipster('close')
                }
              });

              var $instance = $(instance._$origin[0]);
              var id = $instance.data('ttSelectableObject').id;
              var stored = sessionStorage.getItem(id);
              var $origin = $(helper.origin);

              // we set a variable so the data is only loaded once via Ajax, not every time the tooltip opens
              if ($origin.data('loaded') !== true) {

                if (stored) {
                  stored = JSON.parse(stored);
                  if (!instance.__destroyed)
                    instance.content(buildContextHTML(stored));

                } else {

                  var useUri = $instance.data('ttSelectableObject').uri;
                  if (useUri.indexOf('id.loc.gov/resources/works/') > -1 && !_.isEmpty(editorconfig.buildContextForWorksEndpoint)) {
                    useUri = useUri.replace('http://id.loc.gov/resources/works/', editorconfig.buildContextForWorksEndpoint);
                  }
                  lcshared.fetchContextData(useUri, function (data) {

                    // call the 'content' method to update the content of our tooltip with the returned data.
                    // note: this content update will trigger an update animation (see the updateAnimation option)
                    data = JSON.parse(data)
                    if (!instance.__destroyed)
                      instance.content(buildContextHTML(data));

                    // to remember that the data has been loaded
                    $origin.data('loaded', true);
                  });
                }
              }
            }
          });
        });

      }
    });

    $(input).on('typeahead:cursorchange', function () { //(event,selected,something)
           
      var v = $($(this).parent().find('.tt-cursor')[0]);
      if (!v.tooltipster('status').destroyed) {
        $('.tt-selectable').tooltipster('close');
        v.tooltipster('open');
      }
    });

    $(input).on('typeahead:selected', function (event, suggestionobject, datasetname) {
      bfelog.addMsg(new Error(), 'DEBUG', 'Typeahead selection made');
      var form = $('#' + event.target.id).closest('form').eq(0);
      bfelog.addMsg(new Error(), 'DEBUG', 'typeahead embededded in form: ', form);
      var formid = $('#' + event.target.id).closest('form').eq(0).attr('id');
      formid = formid.replace('bfeditor-form-', '');
      // reset page
      $(input).parent().siblings('.typeaheadpage').val(1);
      //var resourceid = $(form).children('div').eq(0).attr('id');
      var resourceURI = $(form).find('div[data-uri]').eq(0).attr('data-uri');

      var propertyguid = $('#' + event.target.id).attr('data-propertyguid');
      bfelog.addMsg(new Error(), 'DEBUG', 'propertyguid for typeahead input is ' + propertyguid);

      //var s = editorconfig.baseURI + resourceid;
      var p = '';
      var formobject = _.where(forms, {
        'id': formid
      });
      formobject = formobject[0];
      bfelog.addMsg(new Error(), 'DEBUG', 'typeahead formobject store: ', JSON.parse(JSON.stringify(formobject.store)));
      formobject.resourceTemplates.forEach(function (t) {
        var properties = _.where(t.propertyTemplates, {
          'guid': propertyguid
        });
        // console.log(properties);
        if (!_.isEmpty(properties[0])) {
          p = properties[0];
        }
      });
      bfelog.addMsg(new Error(), 'DEBUG', "Property to be set with typeahead:", p);

      var lups = _.where(lookups, {
        'name': datasetname
      });
      var lu;
      if (lups[0] !== undefined) {
        bfelog.addMsg(new Error(), 'DEBUG', 'Found lookup for datasetname: ' + datasetname, lups[0]);
        lu = lups[0].load;
      }

      // do we have new resourceURI?
      bfelog.addMsg(new Error(), 'DEBUG', "suggestobject before calling getResource:", suggestionobject);
      lu.getResource(resourceURI, p, suggestionobject, function (returntriples, property) {
        bfelog.addMsg(new Error(), 'DEBUG', "Triples returned from lookup's getResource func:", JSON.parse(JSON.stringify(returntriples)));
        bfelog.addMsg(new Error(), 'DEBUG', "Property returned from getResource func:", property);
        
        
        var tripleConnectingModalWithLookup = '';
        var replaceBnode = !!(property.propertyLabel === 'Lookup' || property.type === 'lookup');
        bfelog.addMsg(new Error(), 'DEBUG', "Replace bnode? " + replaceBnode);
        var target = !!(property.type === 'target');

        returntriples.forEach(function (t) {
          if (_.isEmpty(t.guid)) {
            t.guid = shortUUID(guid());
          }

          // if this is the resource, replace the blank node; otherwise push the label
          if (_.some(formobject.store, {s: t.s}) && t.p !== 'http://www.w3.org/2000/01/rdf-schema#label') {
            
            tripleConnectingModalWithLookup = _.find(formobject.store, {o: t.s});
            bfelog.addMsg(new Error(), 'DEBUG', 'tripleConnectingModalWithLookup from store for this typeahead resource: ', tripleConnectingModalWithLookup);
            
            bfelog.addMsg(new Error(), 'DEBUG', 'resourceTemplate in which typeahead is embedded: ', formobject.resourceTemplates[0]);
            if (!replaceBnode || _.isEmpty(tripleConnectingModalWithLookup)) {
              // push the triples
              if (formobject.resourceTemplates[0].embedType === 'modal'){
                formobject.store.push(t);
              } else {
                bfestore.addTriple(t);
              }
            } else {
                var resourceType = _.find(formobject.store, { p: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', o: formobject.resourceTemplates[0].resourceURI });
                bfelog.addMsg(new Error(), 'DEBUG', 'resourceType of this typeahead resourceTemplate: ', resourceType);
                if ( replaceBnode && p.propertyURI == "http://www.w3.org/2002/07/owl#sameAs") {
                    tripleConnectingModalWithLookup.o = t.o;
                    resourceType.s = t.o;
                    //formobject.store.push(resourceType);
                    
                } else if (
                    replaceBnode && 
                    formobject.resourceTemplates[0].embedType === 'modal' &&
                    resourceType.s == t.s
                    ) {
                    /* 
                        We have a situation where
                            1) we have a lookup
                            2) We're in a modal
                            3) the Subject of lookup results matches the 
                                Subject of the modal resource.
                        We do not want to replace the Object of the main resource
                        with the object of the found triple.
                    */
                    formobject.store.push(t);
                
                } else if (replaceBnode || target) {
                    tripleConnectingModalWithLookup.o = t.o;
                    resourceType.s = t.o;
                    formobject.store.push(resourceType);

                    formobject.defaulturi = t.o;
                    // find the bnode
                    formobject.store.push(tripleConnectingModalWithLookup);
                    if (!_.some(formobject.store, {"guid": tripleConnectingModalWithLookup.guid})){
                      formobject.store.push(tripleConnectingModalWithLookup);
                    }
                } else {
                    if (formobject.resourceTemplates[0].embedType === 'modal'){
                        formobject.store.push(t);
                    } else {
                        bfestore.addTriple(t);
                    }
                }
            }
          } else {
            if (formobject.resourceTemplates[0].embedType === 'modal'){
                formobject.store.push(t);
            } else {
                bfestore.addTriple(t);
            }
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
            if (!_.isEmpty(properties[0] )) {
              var property = properties[0];
              var pguid = property.guid;

              var $formgroup = $('#' + pguid, formobject.form).closest('.form-group');
              var save = $formgroup.find('.btn-toolbar')[0];

              // var tlabel = _.findt.o;
              var tlabel = _.find(returntriples, {
                p: 'http://www.w3.org/2000/01/rdf-schema#label'
              });

              if(_.isEmpty(tlabel)){
                //look for property
                tlabel = _.find(returntriples, {
                  p: property.propertyURI
                });
              }

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
                  typeTriple.guid = shortUUID(guid());
                  typeTriple.p = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'; // rdf:type
                  typeTriple.o = property.valueConstraint.valueDataType.dataTypeURI;
                  typeTriple.otype = 'uri';
                  if (formobject.resourceTemplates[0].embedType === 'modal'){
                    formobject.store.push(typeTriple);
                  } else {
                    bfestore.addTriple(typeTriple);
                    //bfestore.store.push(typeTriple);
                  }
                }
              }

              var bgvars = {
                'editable': editable,
                'tguid': returntriples[0].guid,
                'tlabel': tlabel.o,
                'tlabelhover': tlabel.o,
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

  function buildLookup(name) {
    var lcshared = require('src/lookups/lcshared');
    var cache = [];
    var lu = {};
    lu.name = name.substr(name.lastIndexOf('/') + 1);
    lu.load = {};
    lu.load.scheme = name;
    lu.load.source = function (query, processSync, processAsync) {
      return lcshared.simpleQuery(query, cache, name, processSync, processAsync);
    };

    lu.load.getResource = function (subjecturi, property, selected, process) {
      return lcshared.getResource(subjecturi, property, selected, process);
    };

    return lu;
  }

  function editTriple(formobjectID, inputID, t) {
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
    } else if ($el.is('input') || $el.is('textarea')) {
      $el.prop('disabled', false);
      $el.removeAttr('disabled');
      // el.css( "background-color", "transparent" );
    } else {
      var $buttons = $('div.btn-group', $el).find('button');
      $buttons.each(function () {
        $(this).prop('disabled', false);
      });
    }

    if (($el.is('input') || $el.is('textarea')) && t.otype == 'literal') {
      $el.val(t.o);
      // if the olang is populated try to split out the lang and script and populate the select fields that should exist
      if (t.olang && t.olang !== "" && t.olang.indexOf('-')>-1){
        var lang = t.olang.split('-')[0].toLowerCase();
        var script =  t.olang.split('-')[1].charAt(0).toUpperCase() + t.olang.split('-')[1].slice(1).toLowerCase();
        $('#' + inputID + '-lang').val(lang);
        $('#' + inputID + '-script').val(script);
      }else if (t.olang && t.olang !== "" && t.olang.indexOf('-')==-1){
        $('#' + inputID + '-lang').val(t.olang.toLowerCase());
        $('#' + inputID + '-script').val('');
      
      }
    }
    formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
      guid: t.guid
    }));
    bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
      guid: t.guid
    }));
    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function editTriples(formobjectID, inputID, tguid, triples) {
    bfelog.addMsg(new Error(), 'DEBUG', 'Editing triples', triples);
    var resourceTypes = _.where(triples, {
      'p': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    });
    var bnode = _.find(triples, {guid:tguid});

    if (resourceTypes[0] == undefined) {
      // try @type?
      resourceTypes = _.where(triples, {
        'p': '@type'
      });
    }
    bfelog.addMsg(new Error(), 'DEBUG', 'Triples represent these resourceTypes', resourceTypes);
    
    var thisResourceType = _.find(resourceTypes, {s: bnode.o})

   /* for (var i in resourceTypes){
      if (resourceTypes[i].rtID !== undefined){
        thisResourceType = resourceTypes[i];
      }
    }*/

    if (thisResourceType !== undefined && typeof thisResourceType !== undefined && thisResourceType.rtID !== undefined) {
      // function openModal(callingformobjectid, rtguid, propertyguid, template) {
      var callingformobject = _.where(forms, {
        'id': formobjectID
      });
      callingformobject = callingformobject[0];

      var templates = _.where(resourceTemplates, {
        'id': thisResourceType.rtID
      });
      if (templates[0] !== undefined) {
        // The subject of the resource matched with the "type"
        bfelog.addMsg(new Error(), 'DEBUG', 'Opening modal for editing', triples);
        openModal(callingformobject.id, templates[0], thisResourceType.s, inputID, triples);
        bfe.borderColor($(".modal-content:last")[0], thisResourceType.rtID);
      }
    } else if (_.some(triples, {p: "http://www.w3.org/2000/01/rdf-schema#label"})) {
      //edit like a literal
      var t = _.find(triples, {p: "http://www.w3.org/2000/01/rdf-schema#label"});
      removeTriples(formobjectID, inputID, tguid, triples);
      editTriple(formobjectID, inputID, t);
    } else {
      removeTriples(formobjectID, inputID, tguid, triples);
    }
  }

  function removeTriple(formobjectID, inputID, tguid, t) {
    var formobject = _.where(forms, {
      'id': formobjectID
    });
    
    formobject = formobject[0];
    if ($('#' + t.guid).length && t !== undefined) {
      bfelog.addMsg(new Error(), 'DEBUG', 'Removing triple: ' + t.guid, t);
      // $("#" + t.guid).empty();
      $('#' + t.guid).remove();
    } else if ($('#' + tguid).length){
    
      bfelog.addMsg(new Error(), 'DEBUG', 'Removing triple: ' + tguid, null);
      //$('#' + tguid).remove();
    }

    if (!_.isEmpty(t.guid)) {
      bfelog.addMsg(new Error(), 'DEBUG', 'Removing triple: ' + t.guid);
      formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
        guid: t.guid
      }));
      bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
        guid: t.guid
      }));
    } else {
      //no guid
      /*formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
        s: t.s, p: t.p, o: t.o
      }));
      bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
        s: t.s, p: t.p, o: t.o
      }));*/
      bfelog.addMsg(new Error(), 'DEBUG', 'Missing guid - formobjectID: ' + formobjectID + ' inputID: ' + inputID + ' tguid' + tguid, t);
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
    /*formobject.store = _.without(formobject.store, _.findWhere(formobject.store, {
      guid: t.guid
    }));
    bfestore.store = _.without(bfestore.store, _.findWhere(bfestore.store, {
      guid: t.guid
    }));*/

    $('#bfeditor-debug').html(JSON.stringify(bfestore.store, undefined, ' '));
  }

  function removeTriples(formobjectID, inputID, tID, triples) {
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
  function guid() {
    var translator = window.ShortUUID();
    return translator.uuid();
  }

  function shortUUID(uuid) {
    var translator = window.ShortUUID();
    return translator.fromUUID(uuid);
  }

  function mintResource(uuid) {
    var decimaltranslator = window.ShortUUID('0123456789');
    return 'e' + decimaltranslator.fromUUID(uuid);
  }

  function whichrt(rt, baseURI, callback) {
    // for resource templates, determine if they are works, instances, or other
    var uri;
    if (rt.resourceURI.startsWith('http://www.loc.gov/mads/rdf/v1#')) {
      uri = rt.resourceURI.replace('http://www.loc.gov/mads/rdf/v1#', config.url + '/bfe/static/v1.json#');
    } else if (rt.resourceURI.startsWith('http://id.loc.gov/resources' && !_.isEmpty(config.resourceURI))) {
      uri = rt.resourceURI.replace('http://id.loc.gov/resources', config.resourceURI) + '.json';
    } else if (rt.resourceURI.startsWith(config.rectobase +'/resources')) {
      return;
    } else if (rt.resourceURI == "http://id.loc.gov/ontologies/bflc/Hub") {
      var returnval = baseURI + 'resources/hubs/';
      return callback(returnval);
    } else if (rt.resourceURI.startsWith('http://id.loc.gov') && rt.resourceURI.match(/(authorities|vocabulary)/)) {
      uri = rt.resourceURI + '.madsrdf_raw.json';
    } else {
      uri = rt.resourceURI + '.json';
    }
	uri = uri.replace('http://', 'https://'); 
    $.ajax({
      type: 'GET',
      async: false,
      url: uri,
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

  function whichLabel(uri, store, callback) {

    uri = uri.replace(/^(https:)/,"http:");
    
    bfelog.addMsg(new Error(), 'DEBUG', 'whichLabel uri: ' + uri);
    
    if(_.isEmpty(store)){
      store = bfestore.store;
    }
    // for resource templates, determine if they are works, instances, or other
    var jsonuri = uri + '.json';
    // normalize
    if (uri.startsWith('http://id.loc.gov/resources/works') || uri.startsWith('http://id.loc.gov/resources/instances')&& !_.isEmpty(config.resourceURI)) {
      jsonuri = uri.replace('http://id.loc.gov/resources', config.resourceURI) + '.jsonld';
      jsonuri = jsonuri.replace(/^(http:)/,"https:");
    } else if (uri.startsWith('http://id.loc.gov') && uri.match(/(authorities|vocabulary)/)) {
      jsonuri = uri + '.madsrdf_raw.json';
      jsonuri = jsonuri.replace(/^(http:)/,"https:");
    }

    if (uri.endsWith('marcxml.xml')) {
      var returnval = /[^/]*$/.exec(uri)[0].split('.')[0];
      callback(returnval);
    } else if (uri.match(/[works|instances]\/\d+#\w+\d+-\d+/) || uri.match(/_:.*/g) ) {      //fake uris
      if(_.some(store, { s: uri, p: "http://www.w3.org/2000/01/rdf-schema#label"})){
        callback(_.find(store, { s: uri, p: "http://www.w3.org/2000/01/rdf-schema#label" }).o);  
      } else if(_.some(store, { s: uri, p: "http://www.loc.gov/mads/rdf/v1#authoritativeLabel"})){
        callback(_.find(store, { s: uri, p: "http://www.loc.gov/mads/rdf/v1#authoritativeLabel" }).o);
      } else if(_.some(store, { s: uri, p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value"})){
        callback(_.find(store, { s: uri, p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#value" }).o);
      } else if(_.some(store, { s: uri, p: "http://id.loc.gov/ontologies/bflc/aap"})){
        callback(_.find(store, { s: uri, p: "http://id.loc.gov/ontologies/bflc/aap" }).o);
      } else {
        callback("");
      }
    } else {
        bfelog.addMsg(new Error(), 'DEBUG', 'Making call to recto whichrt using: ' + jsonuri);
      $.ajax({
        type: 'GET',
        async: false,
        data: {
          uri: jsonuri
        },
        url: config.url + '/profile-edit/server/whichrt',
        success: function (data) {
          var returnval;
          var labelElements;
          var authoritativeLabelElements;
          var aapElements;
          if(_.some(_.find(data, { '@id': uri }))) {
            labelElements = _.find(data, { '@id': uri })['http://www.w3.org/2000/01/rdf-schema#label']
            authoritativeLabelElements = _.find(data, { '@id': uri })['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'];
            aapElements = _.find(data, { '@id': uri })['http://id.loc.gov/ontologies/bflc/aap'];
          } 
          if (!_.isEmpty(labelElements)) {
            returnval = labelElements[0]["@value"];
          } else if (!_.isEmpty(aapElements)) {
            returnval = aapElements[0]["@value"]
          } else if (!_.isEmpty(authoritativeLabelElements)) {
            returnval = authoritativeLabelElements[0]["@value"]
          } else {
            // look for a rdfslabel
            var labels = _.filter(data[2], function (prop) { if (prop[0] === 'rdfs:label') return prop; });
            returnval = uri;

            if (!_.isEmpty(labels)) {
              returnval = labels[0][2];
            } else if (_.has(data, "@graph")) {
                if (_.some(data["@graph"], {"@id": uri})) {
                  returnval = _.find(data["@graph"], {"@id": uri})["rdf-schema:label"]
                } else if ( _.some(data["@graph"], {"@type": ["http://id.loc.gov/ontologies/lclocal/Hub"]})) {
                  returnval = _.find(data["@graph"], {"@type": ["http://id.loc.gov/ontologies/lclocal/Hub"]})["rdf-schema:label"]
                }
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
