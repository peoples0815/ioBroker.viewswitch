let projectsReady = false;

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
function showHideElements(settings, onChange) {
    console.log(settings)
    // Ein und Ausblenden des tabs -----------functioniert nicht
    if ($('#visProj_').prop('checked')) {
        $('.tab-Views').show();
    } else {
        $('.tab-Views').hide();
    }
    $('#visProject').on('change', function () {
        if (projectsReady) {
            console.log('visProject changed')
            genViewList(settings, onChange);
            onChange();
        }
    }).trigger('change');
}

async function genViewList(settings, onChange) {
    if (settings['visProject']) {
        const visData = await getVisContent('views', settings);
        console.log('visData: ' + JSON.stringify(visData));
        console.log('visProject: ' + settings['visProject'])
        let tableRow;
        let $table = $('#viewsTable');
        let arr = []
        $("#viewsTable td").remove();
        const viewList = visData.viewList;
        if (viewList == '') {
            //arr.push[''];
        } else {

            arr = visData.viewList;
            arr.sort();
            arr.forEach(function (val) {

                tableRow += '<tr>';
                tableRow += '<td style="font-weight:bold">' + val + '</td>';
                tableRow += '<td><label><input id="swSec' + val + '" type="number" class="value"></label></td>';
                tableRow += '<td><label><input id="isHomeView' + val + '" type="checkbox" class="value" /><span></span></label></td>';
                tableRow += '<td><label><input id="isLockView' + val + '" type="checkbox" class="value" /><span></span></label></td>';
                tableRow += '<td><label><input id="showIAV' + val + '" type="checkbox" class="value" /><span></span></label></td>';
                tableRow += '</tr>';
            });
            $('#viewsTable' + ' > table > tbody').append(tableRow);
        }
        onChange();
    }
}

async function genProjectSelect(settings) {
    try {
        let id;
        let $sel = $('#visProject');
        let result = '';
        const visData = await getVisContent('projects', settings);
        const visDataProjects = visData.projectList;
        let arr = [];
        if (visData.projectList == '') {
            arr.push['main'];
        } else {
            arr = visData.projectList;
        }
        if (!settings['visProject'] || settings['visProject'] == '') {
            $sel.html('<option value="allProjects" "selected">' + _('Select first') + '</option>');
        } else {
            $sel.html();
            id = settings['visProject'];
        }
        arr.sort();
        arr.forEach(function (val) {
            //$('#counties').append('<option value="' + val[0] + '"' + (id === val[0] ? ' selected' : '') + '>' + val[1] + '</option>');
            $('#visProject').append('<option value="' + val + '"' + (id === val ? ' selected' : '') + '>' + val + ' </option>');
        });
        $sel.select();
        // Liste generieren
        //genViewList(settings);
        projectsReady = true;
    } catch (e) {
        console.log(e); // 30
    }
}

function getVisContent(dp, settings) {
    return new Promise(resolve => {
        const mObj = new Object();
        if (dp == 'projects') {
            mObj.command = 'projects';
        }
        if (dp == 'views') {
            mObj.command = 'views';
        }
        sendTo('viewswitch.0', mObj.command, { config: { visProject: $('#visProject').val() || settings['visProject'] } }, (visData) => {
            resolve(visData);
        });
    });
}

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
                showHideElements(settings, onChange);
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

    viewsTable = settings.viewsTable || [];
    values2table('viewsTable', viewsTable, onChange);

    showHideElements(settings, onChange);
    onChange(false);
    M.updateTextFields();

    // Aufruf Projektliste
    genProjectSelect(settings);

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
    // Get edited table
    obj.viewsTable = table2values('viewsTable');
    callback(obj);
}

