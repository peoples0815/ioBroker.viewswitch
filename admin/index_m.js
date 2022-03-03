let projectsReady = false;
//Test
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
    if ($('#visProj_').prop('checked')) {
        $('.tab-Views').hide();
    } else {
        $('.tab-Views').show();
    }
    $('#visProject').on('change', function () {
        if (projectsReady) {
            genViewList(settings, onChange);
        }
    }).trigger('change');
}

async function genViewList(settings, onChange) {
    if ($('#visProject').val()) {
        const visData = await getVisContent('views', settings);
        let arr = [];
        viewsTable = [];
        arr = visData.viewList;
        arr.sort();

        for (var i in arr) {
            const _arr = {
                viewName: arr[i],
                swSec: 60,
                isHomeView: false,
                isLockView: false,
                showIAV: false
            }
            i == 0 ? _arr.isHomeView = true : '';
            viewsTable.push(_arr);
        }
        values2table('viewsTable', viewsTable, onChange, tableOnReady);
    }
}

function tableOnReady() {
    var _views = table2values('viewsTable');
    for (var i = 0; i < _views.length; i++) {
        $('#viewsTable .values-input[data-name="viewName"][data-index="' + i + '"]').prop('disabled', true).trigger('change');
        $('#viewsTable .values-input[data-name="viewName"][data-index="' + i + '"]').addClass('nameBold').trigger('change');
    }
}

async function genProjectSelect(settings, onChange) {
    try {
        let id;
        let $sel = $('#visProject');
        let arr = [];

        const visData = await getVisContent('projects', settings);

        if (visData.projectList == '') {
            arr.push['main'];
        } else {
            arr = visData.projectList;
        }
        var notselected = false;
        arr.sort();
        if (!settings['visProject'] || settings['visProject'] == '') {
            $sel.html(`<option value="${arr[0]}" "selected">${arr[0]}</option>`);
            notselected = true;
        } else {
            $sel.html();
            id = settings['visProject'];
        }

        arr.forEach(function (val) {
            if ((notselected && val != arr[0]) || !notselected) {
                $('#visProject').append('<option value="' + val + '"' + (id === val ? ' selected' : '') + '>' + val + ' </option>');
            }
        });
        $sel.select();
        $('.progressBar').hide();
        //$('.firstStart').show();

        
        // Generate list if no view exists yet
        var _views = table2values('viewsTable');

        if (_views.length == 0) {
            genViewList(settings, onChange);
        }

        projectsReady = true;
    } catch (e) {
        console.log(e); // 30
    }
}

function getVisContent(dp, settings) {
    return new Promise(resolve => {
        var waitTime = settings.firstStart && dp == 'projects' ? 5000 : 100;

        setTimeout(async function () {
            sendTo(`${adapter}.${instance}`, dp, { config: { visProject: $('#visProject').val() || settings['visProject'] } }, (visData) => {
                resolve(visData);
            });
        }, waitTime);
    });
}

// This will be called by the admin adapter when the settings page loads
function load(settings, onChange) {
    $('.progressBar').hide();
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
    values2table('viewsTable', viewsTable, onChange, tableOnReady);

    showHideElements(settings, onChange);
    onChange(false);
    M.updateTextFields();

    // Aufruf Projektliste
    if(settings.firstStart === true)   $('.progressBar').show();
    //$('.firstStart').hide();
    
    genProjectSelect(settings, onChange);

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
    // set firstStart = false
    obj.firstStart = false;
    // Get edited table
    obj.viewsTable = table2values('viewsTable');
    callback(obj);
}

