/*eslint no-console: 0*/
bfe.define('src/bfeusertemplates', ['require', 'exports' ], function(require, exports) {

    // these are global vars used by the functions below
    // the bfe config
    var config = {};
    // editmode means we are activly editing a template
    exports.editMode = false;
    // editModeTemplate is the name of the template we are editing
    exports.editModeTemplate = null;
    
    // the currently active profile and template being used
    exports.activeProfile = null;
    exports.activeTemplate = null;
    
    exports.getEditMode = function(){
      return exports.editMode
    }
    exports.setEditMode = function(val){
      if (val === true){
        exports.editMode = true
      }else if (val === false){
        exports.editMode = false
      }else{
        exports.editMode = false
      }     
    }
    // Passed the config obj from the bfe script, it checks to make sure local storage is there and setsup the keys if so, if not disables the feature in the config obj
    exports.setConfig = function(passedConfig){
      config = passedConfig;      
      // on startup initalize the storage if it is not there disable the feature
      if (!window.localStorage){
        config.enableUserTemplates = false;
      }
      // init the local storage if it doesn't yet exist
      if (config.enableUserTemplates){        
        var data = window.localStorage.getItem('bfeUserTemplates');
        if (!data){
          // one to store the profile on/off settings and one to store the current active template so it is automatically used on refresh
          window.localStorage.setItem('bfeUser','{}');
          window.localStorage.setItem('bfeUserTemplates','{}');
          window.localStorage.setItem('bfeUserTemplatesActive','{}');
        }      
      } 
    }

    // Saves the template in active edit mode
    exports.saveTemplate = function() {    
      var properties = {};      
      // first gather settings for each property
      $(".template-property ").each(function(i,el){        
        var data = $(el).data();
        var enabled = true;
        
        if (Object.keys(data).indexOf('templateEnabled')>-1){
          if (data['templateEnabled'] === false){
            enabled = false;
          }
        }        
        properties[data.uriLabel] = enabled;
      });  
      var data = JSON.parse(window.localStorage.getItem('bfeUserTemplates'));

      // if the current profile doesn't exist in the storage yet
      if (!data[exports.activeProfile]){
        data[exports.activeProfile] = {}
      }
      data[exports.activeProfile][exports.editModeTemplate] = properties;
      window.localStorage.setItem('bfeUserTemplates',JSON.stringify(data));
      
      // make it the active template
      var dataActive = JSON.parse(window.localStorage.getItem('bfeUserTemplatesActive'));
      dataActive[exports.activeProfile] = exports.editModeTemplate;
      window.localStorage.setItem('bfeUserTemplatesActive',JSON.stringify(dataActive));

      exports.activeTemplate = exports.editModeTemplate;
      exports.editModeTemplate = null;
      exports.editMode = false;
      // refresh
      bfe.cbLoadTemplates();      
      exports.checkActiveTemplate(); 
      
    }
    
    // Removes a template from the local storage, works on active template in edit mode
    exports.deleteTemplate = function() {    
      // can only delete active templates      
      var data = JSON.parse(window.localStorage.getItem('bfeUserTemplates'));
      var dataActive = JSON.parse(window.localStorage.getItem('bfeUserTemplatesActive'));
      
      if (data[exports.activeProfile] && data[exports.activeProfile][exports.activeTemplate]){
        delete data[exports.activeProfile][exports.activeTemplate];
      }      
      if (dataActive[exports.activeProfile] && dataActive[exports.activeProfile] == exports.activeTemplate){
        delete dataActive[exports.activeProfile]
      }
      window.localStorage.setItem('bfeUserTemplates',JSON.stringify(data));
      window.localStorage.setItem('bfeUserTemplatesActive',JSON.stringify(dataActive));
      
      // refresh
      exports.editMode = false;
      bfe.cbLoadTemplates();        
    } 
    
    // renders the little menu next to the template select, pass it the mode to display
    exports.renderActions = function(mode) {    
      var show = function(){        
        var tout = setInterval(function(){          
          var c = parseInt($("#template-controls-actions").css('right'));
          c = c + 5;
          $("#template-controls-actions").css('right', c + 'px')
          if (c > -20){
            clearInterval(tout);
          }          
        },10)      
      }
     
      var $actions = $('#template-controls-actions');
      $actions.css('right','-200px');
      
      if (mode === 'editing'){      
        var $saveAction = $('<button class="btn btn-default btn-xs" type="button" ><span class="fa fa-floppy-disk"></span> Save</button>');
        $saveAction.on('click',exports.saveTemplate);               
        var $deleteAction = $('<button class="btn btn-default btn-xs" type="button" ><span class="fa fa-trash"></span> Delete</button>');
        $deleteAction.on('click',exports.deleteTemplate);       
        $actions.html('');
        $actions.append($saveAction);
        $actions.append($deleteAction);        
        show();
      }
      
      if (mode === 'using'){      
        var $editAction = $('<button class="btn btn-default btn-xs" type="button" ><span class="fa fa-pencil"></span> Edit</button>');
        $editAction.on('click',exports.editTemplate);               
        var $unselectAction = $('<button class="btn btn-default btn-xs" type="button" ><span class="fa fa-stop"></span> Stop Using</button>');
        $unselectAction.on('click',exports.stopUsingTemplate);       
        $actions.html('');
        $actions.append($unselectAction);
        $actions.append($editAction);        
        show();
      }
      
      
    
    }
    
    // makes the active template into the edit template and get the display ready to be edited
    exports.editTemplate = function() {  

      exports.editMode = true;
      exports.editModeTemplate = exports.activeTemplate;
      exports.activeTemplate = null;
      
      // make fresh profile
      bfe.cbLoadTemplates();          
      // add in the highlight effect
      $('.template-property').addClass('template-property-hover');          
      $("#resource-title").text('Template for: ' + $("#resource-title").text())
      // disable cloning or preview
      $("#bfeditor-preview, #bfeditor-cancel, #clone-work").addClass('disabled');          
      // show the actions avaialble
      exports.renderActions('editing')    
      
      // turn off the opacity on the controls if the switch is marked to OFF
      $(".template-property ").each(function(i,el){        
        if ($(el).find('.btn-primary').text() === 'OFF'){
          $(el).find('span, a, .col-sm-8, .form-group, .btn-group-md').css('opacity',0.25);
          $(el).data('templateEnabled',false);
        }else{
          $(el).data('templateEnabled',true);
        }
      });
    }
    
    // clear the current template from the storage and the current var
    exports.stopUsingTemplate = function() {  
      var dataActive = JSON.parse(window.localStorage.getItem('bfeUserTemplatesActive'));
      if (dataActive[exports.activeProfile]){
        delete dataActive[exports.activeProfile];
      }
      window.localStorage.setItem('bfeUserTemplatesActive',JSON.stringify(dataActive));
      exports.activeTemplate = null;
      // reload the profile
      $('#cloneButtonGroup').remove();
      bfe.cbLoadTemplates();       
    }
    
    // builds the slect html code, is called in the getForm bef rendering process
    // this is being called whenever bfe.cbLoadTemplates();  is run 
    exports.returnSelectHTML = function(pt) {
      // set this has our current active profile
      exports.activeProfile = pt;
      var $templateSelect = $('<div class="template-controls">\
          <div id="template-controls-actions"><span class="fa fa-pencil"></span>Edit Profile</div>\
          <select class="form-control">\
          <option value="your-templates-ignore">Your Templates:</option>\
          </select>	  \
        </div> \
      ');     
      
      // add in any profiles found in the store
      var storedProfiles = JSON.parse(window.localStorage.getItem('bfeUserTemplates'));
      var storedProfilesActive = JSON.parse(window.localStorage.getItem('bfeUserTemplatesActive'));
      
      // if no template is active it is first load
      if (exports.activeTemplate === null){
        if (storedProfilesActive[exports.activeProfile]){
          exports.activeTemplate = storedProfilesActive[exports.activeProfile];      
        }
      }

      if (storedProfiles[exports.activeProfile]){
        Object.keys(storedProfiles[exports.activeProfile]).forEach(function(key){          
          if (key == exports.activeTemplate){
            $templateSelect.find('select').append($('<option value="'+key+'" selected>'+key+'</option>'));
          }else{
            $templateSelect.find('select').append($('<option value="'+key+'">'+key+'</option>'));
          }         
        })
        if (Object.keys(storedProfiles[exports.activeProfile]).length==0){
          $templateSelect.find('select').append($('<option value="your-templates-ignore" disabled="disabled">You have no templates for this profile.</option>'))
        }
      }else{
          $templateSelect.find('select').append($('<option value="your-templates-ignore" disabled="disabled">You have no templates for this profile.</option>'))
      }

      // if we are in edit mode then add in the new template name
      if (exports.editMode){
          // add it to the list and select it
          $templateSelect.find('select').append($('<option value="'+ exports.editModeTemplate +'" selected>'+exports.editModeTemplate+'</option>'));
      }
      
      // always add in the last "Add new" at the end
      $templateSelect.find('select').append($('<option value="your-templates-ignore" disabled="disabled">----------------------</option>'))
      $templateSelect.find('select').append($('<option value="create-new-template">Create New Template</option>'))
      if(config.enableLoadMarc) {
        $templateSelect.find('select').append($('<option value="add-catalogerid">Add Cataloger Id</option>'))
      }
      
      $templateSelect.on('change', function() {
        var value = $(this).find(":selected").val();
          
        if (value == 'your-templates-ignore'){ return true }

        if (value == 'add-catalogerid'){
          var catalogerIDobj = JSON.parse(window.localStorage.getItem('bfeUser'));

          var catalogerid = window.prompt("Please enter your cataloger id.");
          if (!_.isEmpty(catalogerid)){
            catalogerIDobj["bflc:catalogerId"] = catalogerid;
            window.localStorage.setItem('bfeUser',JSON.stringify(catalogerIDobj));
          }
        }

        if (value == 'create-new-template'){ 
          exports.editModeTemplate = window.prompt("Please enter a name for your new template.\n-Use the ON/OFF switches to remove fields.\n-Click the 'Save Template' link when done to start using your template.");
          
          // if they don't enter a name or cancel out set the optio back to "Your Templates" and exit
          if (exports.editModeTemplate === null || exports.editModeTemplate === "" || exports.editModeTemplate === 'null'){ 
            if (exports.editModeTemplate === ""){ alert("Template name cannot be empty");}
            var arrayOfOptions = $(this).find('option');
            $(arrayOfOptions[0]).attr('selected','selected');           
            return false;            
          }          
          exports.editMode = true;
          exports.activeTemplate = null;          
          // make fresh profile
          bfe.cbLoadTemplates();          
          // add in the highlight effect
          $('.template-property').addClass('template-property-hover');          
          $("#resource-title").text('Template for: ' + $("#resource-title").text())
          // disable cloning or preview
          $("#bfeditor-preview, #bfeditor-cancel, #clone-work").addClass('disabled');          
          // show the actions avaialble
          exports.renderActions('editing')        
          //$('.template-property').removeClass('template-property-hover');
        }else{
          // they picked a template to use, load the template
          // select it in the select dropdown
          exports.activeTemplate = value;
          // refresh the profile
          bfe.cbLoadTemplates();    
          exports.applyTemplate();
        }
      }); 
      return $templateSelect;
    }
    
    // this is the main hook into bfe it kicks off the template load on the editor profile load
    exports.checkActiveTemplate = function() {
      if (exports.editMode){
        return false;
      }
      var storedProfiles = JSON.parse(window.localStorage.getItem('bfeUserTemplates'));
      var storedProfilesActive = JSON.parse(window.localStorage.getItem('bfeUserTemplatesActive'));
      // if no template is active it is first load
      if (exports.activeTemplate === null){
        if (storedProfilesActive[exports.activeProfile]){
          exports.activeTemplate = storedProfilesActive[exports.activeProfile];      
        }
      }
      
      // see if we can find it
      if (storedProfiles[exports.activeProfile] && storedProfiles[exports.activeProfile][exports.activeTemplate]){
        exports.applyTemplate();
        exports.renderActions('using')  
      }      
    }
    
    // given a freshly rendered profile it will loop through and hide anything set to in the template
    exports.applyTemplate = function() {
      var storedProfiles = JSON.parse(window.localStorage.getItem('bfeUserTemplates'));
      // find all the properties and see if they are enabled in this template
      $(".template-property ").each(function(i,el){     
        el = $(el)
        //var enabled = true;
        var data = (el).data();
          
        if (storedProfiles[exports.activeProfile] && storedProfiles[exports.activeProfile][exports.activeTemplate] && typeof storedProfiles[exports.activeProfile][exports.activeTemplate][data.uriLabel] !== 'undefined'){
          (el).data('templateEnabled',storedProfiles[exports.activeProfile][exports.activeTemplate][data.uriLabel]);
          if (!storedProfiles[exports.activeProfile][exports.activeTemplate][data.uriLabel]){
            el.css('display','none');
          }
        }else{
          // it is probably a "add property" field that was added and is not in the list yet so make it visible
          (el).data('templateEnabled',true);         
        }
      });
      
      // make the currently selected profile the stored ative profile
      var dataActive = JSON.parse(window.localStorage.getItem('bfeUserTemplatesActive'));
      dataActive[exports.activeProfile] = exports.activeTemplate;
      window.localStorage.setItem('bfeUserTemplatesActive',JSON.stringify(dataActive));
    }
    
    // builds the on off switch displayed in edit mode
    exports.returnToggleHTML = function(uriLabel) {
      
      // if we are not in edit mode then we do not need to render these toggle controls
      if (!exports.editMode){
        return "";
      }
    
      // template controls
      var $templateSwitch = $('<div class="btn-group btn-toggle template-toggle"></div>');
      var $offButton = $('<button type="button" class="btn btn-xs">OFF</button>')
      var $onButton = $('<button type="button" class="btn btn-xs">ON</button>')
      var isEnabled = true;
      
      // check the storage to see if we have this template (that means we are editing this template)
      var storedProfiles = JSON.parse(window.localStorage.getItem('bfeUserTemplates'));
      if (storedProfiles[exports.activeProfile] && storedProfiles[exports.activeProfile][exports.editModeTemplate] && typeof storedProfiles[exports.activeProfile][exports.editModeTemplate][uriLabel] !== 'undefined'){
        isEnabled = storedProfiles[exports.activeProfile][exports.editModeTemplate][uriLabel];
      }else if (storedProfiles[exports.activeProfile] && storedProfiles[exports.activeProfile][exports.editModeTemplate] && typeof storedProfiles[exports.activeProfile][exports.editModeTemplate][uriLabel] === 'undefined'){
        // if it is an "add property" element we don't have it in our template so just mark it as enabled by default
        isEnabled = true;
      }

      if (isEnabled){
        $onButton.addClass('btn-primary');
        $offButton.addClass('btn-default');
        
      } else {
        $offButton.addClass('btn-primary');
        $onButton.addClass('btn-default');
      }
      
      $templateSwitch.append($offButton);
      $templateSwitch.append($onButton);
      
      // hide the toggles unless we are in edit mode      
      if (!exports.editMode){
        $templateSwitch.addClass('template-toggle-hide');        
      }

      // handles the toggling between on/off
      $templateSwitch.click(function() {
      
        //bfe.cbLoadTemplates();
        if ($(this).find('.btn-primary').size()>0) {
          $(this).find('.btn').toggleClass('btn-primary');
        }
        if ($(this).find('.btn-danger').size()>0) {
          $(this).find('.btn').toggleClass('btn-danger');
        }
        if ($(this).find('.btn-success').size()>0) {
          $(this).find('.btn').toggleClass('btn-success');
        }
        if ($(this).find('.btn-info').size()>0) {
          $(this).find('.btn').toggleClass('btn-info');
        }
        
        $(this).find('.btn').toggleClass('btn-default');
        
        // toggles opacity on click
        if ($(this).find('.btn-primary').text() == 'OFF'){
          $(this).parent().parent().find('span, a, .col-sm-8, .form-group, .btn-group-md').css('opacity',0.25);
          $(this).parent().parent().data('templateEnabled',false);
        }else{
          $(this).parent().parent().find('span, a, .col-sm-8, .form-group, .btn-group-md').css('opacity',1);
          $(this).parent().parent().data('templateEnabled',true);
        }
      });   
      return $templateSwitch;
    }
});
