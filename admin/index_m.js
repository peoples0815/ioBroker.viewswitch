const Materialize = (typeof M !== 'undefined') ? M : Materialize,
        anime = (typeof M !== 'undefined') ? M.anime : anime,
        namespace = 'viewswitch.' + instance;
        /*
        Um einen Dialog zu öffnen
        if (typeof customPostOnSave !== 'undefined') {
     customPostOnSave.mydevices = function ($div, instance) {
          if (!$div.find('input[data-field="id"]').val()) {
                  return _('Please enter ID');
          }
     };
}
 */       

        // This will be called by the admin adapter when the settings page loads
        function load(settings, onChange) {
            // example: select elements with id=key and class=value and insert value
  //////////////////////////
            if (!settings) return;
            $('.value').each(function () {
                var $key = $(this);
                var id = $key.attr('id');
                if ($key.attr('type') === 'checkbox') {
                    // do not call onChange direct, because onChange could expect some arguments
                    $key.prop('checked', settings[id]).on('change', function () {
                        showHideSettings(settings);
                        onChange();
                    });
                } else {
                    var val = settings[id];
                    // do not call onChange direct, because onChange could expect some arguments
                    $key.val(val).on('change', function () {
                        onChange();
                    }).on('keyup', function () {
                        onChange();
                    });
                }
            });
            
            showHideSettings(settings);
            onChange(false);
            // function Materialize.updateTextFields(); to reinitialize all the Materialize labels on the page if you are dynamically adding inputs.
            M.updateTextFields();  

            function getVisContent(dp) {
                return new Promise(resolve => {
                    const mObj = new Object();
                    if(dp == 'projects'){
                        mObj.command = 'projects';
                    }
                    if(dp == 'views'){
                        mObj.command = 'views';
                    }
                        sendTo('viewswitch.0', mObj.command, mObj, (visData) => {
                            resolve(visData);
                        });
                });
            }
            
            
            /*Original
            nachstehende funktion liefert ergebnisse
            function getVisContent() {
                return new Promise(resolve => {
                    const mObj = new Object();
                    mObj.command = 'send';
                    mObj.message = 'getVisData';
                    sendTo('viewswitch.0', 'send', mObj, (visData) => {
                        resolve(visData);
                    });
                });
            }
            */


            async function genProjectSelect() {
                try{
                    let id;
                    let $sel = $('#visProject');
                    let result = '';
                    const visData = await getVisContent('projects');
                    const visDataProjects = visData.projectList;                    
                    let arr = [];
                    if(visData.projectList ==''){
                        arr.push['main'];
                    } else {
                       arr = visData.projectList;
                    }
                    if(!settings['visProject'] || settings['visProject'] == ''){
                        $sel.html('<option value="allProjects" "selected">' + _('Select first') + '</option>');
                    } else {
                        $sel.html();
                        id = settings['visProject'];
                    }
                    arr.sort();
                    arr.forEach(function(val) {
                             //$('#counties').append('<option value="' + val[0] + '"' + (id === val[0] ? ' selected' : '') + '>' + val[1] + '</option>');
                        $('#visProject').append('<option value="' + val + '"' + (id === val ? ' selected' : '') + '>'+val+' </option>');
                    });
                    $sel.select();
                    // Liste generieren
                    genViewList();
                }catch(e) {
                    console.log(e); // 30
                }
                
            } 
            genProjectSelect();


            /*
            // Original
            async function genProjectSelect() {
                try{
                    let id;
                    let $sel = $('#visProject');
                    let result = '';
                    const visData = await getVisContent();
                    const visDataProjects = visData.projectList;                    
                    let arr = [];
                    if(visData.projectList ==''){
                        arr.push['main'];
                    } else {
                       arr = visData.projectList;
                    }
                    if(!settings['visProject'] || settings['visProject'] == ''){
                        $sel.html('<option value="allProjects">' + _('Select first') + '</option>');
                    } else {
                        $sel.html();
                        id = settings['visProject'];
                    }
                    arr.sort();
                    arr.forEach(function(val) {
                             //$('#counties').append('<option value="' + val[0] + '"' + (id === val[0] ? ' selected' : '') + '>' + val[1] + '</option>');
                        $('#visProject').append('<option value="' + val + '"' + (id === val ? ' selected' : '') + '>'+val+' </option>');
                    });
                    $sel.select();
                    // Liste generieren
                    genViewList();
                }catch(e) {
                    console.log(e); // 30
                }
                
            } 
            */
            
            
           
            
            
            
            
            async function genViewList() {
                if(settings['visProject']){
                    const visData = await getVisContent('views');
                
                    let tableRow;
                    let $table = $('#viewsTable');
                    let arr = []
                    
                    
                    const viewList = visData.viewList;
                    if(viewList ==''){
                        //arr.push[''];
                    } else {
                        
                        arr = visData.viewList;
                        arr.sort();
                        arr.forEach(function(val) {

                            tableRow +='<tr>';
                            tableRow +='<td style="font-weight:bold">'+val+'</td>';
                            tableRow +='<td><label><input id="swSec'+val+'" type="number" class="value"></label></td>';
                            tableRow +='<td><label><input id="isHomeView'+val+'" type="checkbox" class="value" /><span></span></label></td>';
                            tableRow +='<td><label><input id="isLockView'+val+'" type="checkbox" class="value" /><span></span></label></td>';
                            tableRow +='<td><label><input id="showIAV'+val+'" type="checkbox" class="value" /><span></span></label></td>';
                            tableRow +='</tr>';
                        });
                        $('#viewsTable' + ' > table > tbody').append(tableRow);
                    }
                        
                    for (var key in settings) {
                        if (!settings.hasOwnProperty(key)) {
                            continue;
                        }
                        var $value = $('#' + key + '.value');
                        if ($value.attr('type') === 'checkbox') {
                            $value.prop('checked', settings[key]).on('change', function() {
                                onChange();
                            });
                        } else {
                            $value.val(settings[key]).on('change', function() {
                                onChange();
                            }).keyup(function() {
                                onChange();
                            });
                        }
                    }

                    onChange(false); 
                } 
            } 

            //genViewList()
            
            function showHideSettings(settings) {
                // Ein und Ausblenden des tabs -----------functioniert nicht
                if ($('#testCheckbox').prop('checked')) {
                    $('.tab_views').show();
                } else {
                    $('.tab_views').hide();
                }                     
            }     
    }
        
       
        // This will be called by the admin adapter when the user presses the save button
        function save(callback) {
            // example: select elements with class=value and build settings object
            var obj = {};
            $('.value').each(function () {
                var $this = $(this);
                if ($this.attr('type') === 'checkbox') {
                    obj[$this.attr('id')] = $this.prop('checked');
                } else {
                    obj[$this.attr('id')] = $this.val();
                }
            });
            callback(obj);
        }
        
        