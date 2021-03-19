
// Set up text editor for YAML input

var yaml_input = CodeMirror.fromTextArea(document.getElementById("yaml_input"), {
    mode: 'yaml',
    lineNumbers: true,
    indentWithTabs: 2,
    indentWithTabs: false
});
yaml_input.setOption("extraKeys", {
    Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces);
    }
});


// Set up text editor for showing the output (read-only)

var output = CodeMirror.fromTextArea(document.getElementById("output"), {
    mode: 'clike',
    readOnly: true,
});

function parse() {
    var str, obj;
  
    str = yaml_input.getValue();

    if (str === "") {
        document.getElementById("output_top").innerHTML = '<div class="alert alert-warning" role="alert">Input empty. Start typing in the field above.</div>'
        document.getElementById("output_block").style.display = "none"
        return;
    }
  
   try {
        obj = jsyaml.load(str);

        //menu = new MenuObject(null, obj, "LCDML_0", null)

        MenuObject.all_childs = []
        MenuObject.len = {}
        menu = new MenuObject(null, "", obj, "LCDML", 0)
        MenuObject.all_childs.shift()

        output.setValue(generateOutput());
    //try {

        //output.setValue(JSON.stringify(obj));

        document.getElementById("output_top").innerHTML = '<p><button type="button" id="copy-button" class="btn btn-primary btn-sm copy-button" data-bs-toggle="tooltip" data-bs-placement="top" title="Tooltip on top">Copy</button> and paste this into your .ino or .cpp file</p>'
        document.getElementById("output_block").style.display = "block"

        /*$('button').tooltip({
            trigger: 'click',
            placement: 'bottom'
        });
        
        clipboard.on('success', function(e) {
            var tooltip = new bootstrap.Tooltip(document.getElementById("copy-button"), {})
        });
        
        clipboard.on('error', function(e) {
            alert("error")
        });*/

    } catch (err) {
        document.getElementById("output_top").innerHTML = '<div class="alert alert-danger" role="alert">Couldn\'t parse the yaml. See for error below.</div>'
        output.setValue(err.message || String(err));
        document.getElementById("output_block").style.display = "block"
    }
}

var clipboard = new ClipboardJS('.copy-button', {
    text: function(trigger) {
        return output.getValue();
    }
});


function setTooltip(message) {
    document.getElementById("copy-button").title = message
    var tooltip = new bootstrap.Tooltip(document.getElementById("copy-button"), {})
    tooltip.show()
    setTimeout(function() {
        tooltip.disable()
        tooltip.hide()
    }, 1000);
}

clipboard.on('success', function(e) {
    setTooltip('Copied!');
});
  
clipboard.on('error', function(e) {
    setTooltip('Press ctrl + c to copy!');
});


const menuType = {
    simple_fast: 1,
    simple_detailed: 2,
    deeper: 3,
    advanced: 4
  };

class MenuObject {
    constructor(parent, key_name, child_obj, layer, index) {

        this.index = index
        this.layer = layer

        MenuObject.len.layer = MenuObject.len.layer ? (MenuObject.len.layer < layer.toString().length ? layer.toString().length : MenuObject.len.layer) : layer.toString().length
        MenuObject.all_childs ? MenuObject.all_childs.push(this) : MenuObject.all_childs = [this]

        
        //find out what type of item the object is
        if (child_obj == null || typeof child_obj == "string" || typeof child_obj =="number") {
            // simple menu item (fast method)
            this.type = menuType.simple_fast
        } else if (typeof child_obj == "object") {
            if (child_obj.content !== undefined || child_obj.callback !== undefined) {
                // menu item
                if (child_obj.condetion !== undefined || child_obj.param !== undefined || child_obj.settings !== undefined) {
                    // advanced menu item (detailed method)
                    this.type = menuType.advanced
                } else {
                    this.type = menuType.simple_detailed
                }
            } else {
                // menu goes deeper
                this.type = menuType.deeper
            }
        }

        if (this.type == menuType.simple_fast) { // if the item is the last on the chain we set all the variables here
            this.content = key_name
            this.callback = child_obj == undefined ? "NULL" : child_obj
        } else if (this.type == menuType.simple_detailed || this.type == menuType.advanced) {
            this.content = child_obj.content == undefined ? "" : child_obj.content
            this.callback = child_obj.callback == undefined ? "NULL" : child_obj.callback
            if (this.type == menuType.advanced) {
                this.condetion = child_obj.condetion == undefined ? "NULL" : child_obj.condetion
                MenuObject.len.condetion = MenuObject.len.condetion ? (MenuObject.len.condetion < this.condetion.toString().length ? this.condetion.toString().length : MenuObject.len.condetion) : this.condetion.toString().length
                
                this.param = child_obj.param == undefined ? "0" : child_obj.param
                MenuObject.len.param = MenuObject.len.param ? (MenuObject.len.param < this.param.toString().length ? this.param.toString().length : MenuObject.len.param) : this.param.toString().length

                this.settings = child_obj.settings == undefined ? "_LCDML_TYPE_default" : child_obj.settings
                MenuObject.len.settings = MenuObject.len.settings ? (MenuObject.len.settings < this.settings.toString().length ? this.settings.toString().length : MenuObject.len.settings) : this.settings.toString().length

            }
        } else if (this.type == menuType.deeper) { // if the menu goes deeper we call new object for the new levels
            this.content = key_name
            this.callback = "NULL"
            
            this.childs = []
            var counter = 1
            var next_layer = layer + "_" + index
            for (const [key, value] of Object.entries(child_obj)) {
                this.childs.push(new MenuObject(this, key, value, next_layer, counter))
                counter++
            }
        }

        MenuObject.len.content = MenuObject.len.content ? (MenuObject.len.content < this.content.toString().length ? this.content.toString().length : MenuObject.len.content) : this.content.toString().length
        MenuObject.len.callback = MenuObject.len.callback ? (MenuObject.len.callback < this.callback.toString().length ? this.callback.toString().length : MenuObject.len.callback) : this.callback.toString().length


        console.log(this, child_obj, layer, key_name)
    }

    //object
}

function getWithSpaces(max_len, curr_str, quotes=false) {
    if (max_len - curr_str.toString().length < 0) {
        console.log(curr_str)
    }
    return curr_str + (quotes ? '"' : '') + " ".repeat(max_len - curr_str.toString().length)
}

function generateOutput() {
    output_text =  "// -------------------------------------------\n"
    output_text += "// Config for Menulib2\n"
    output_text += "//  (https://github.com/Jomelo/LCDMenuLib2)\n"
    output_text += "// Created with Yaml to Menulib2 parser\n"
    output_text += "//  (https://github.com/annego15/yaml-menulib)\n"
    output_text += "// --------------------------------------------\n\n"

    for (i = 0; i < MenuObject.all_childs.length; i++) {
        current_item = MenuObject.all_childs[i]
        if (current_item.type <= 3) {
            output_text += `LCDML_add         (${getWithSpaces(MenuObject.all_childs.length.toString().length, i)}, `
            output_text += `${getWithSpaces(MenuObject.len.layer, current_item.layer)}, `
            output_text += `${getWithSpaces(MenuObject.len.index, current_item.index)}, `
            output_text += `"${getWithSpaces(MenuObject.len.content, current_item.content, true)}, `
            output_text += `${getWithSpaces(MenuObject.len.callback, current_item.callback)});\n`
        } else {
            output_text += `LCDML_addAdvanced (${getWithSpaces(MenuObject.all_childs.length.toString().length, i)}, `
            output_text += `${getWithSpaces(MenuObject.len.layer, current_item.layer)}, `
            output_text += `${getWithSpaces(MenuObject.len.index ,current_item.index)}, `
            output_text += `${getWithSpaces(MenuObject.len.condetion ,current_item.condetion)}, `
            output_text += `"${getWithSpaces(MenuObject.len.content ,current_item.content, true)}, `
            output_text += `${getWithSpaces(MenuObject.len.callback ,current_item.callback)}, `
            output_text += `${getWithSpaces(MenuObject.len.param ,current_item.param)}, `
            output_text += `${getWithSpaces(MenuObject.len.settings ,current_item.settings)});\n`
        }
    }

    output_text += `\n#define _LCDML_DISP_cnt    ${MenuObject.all_childs.length - 1}`

    return output_text

}


var timer;


yaml_input.on('change', function () {
    clearTimeout(timer);
    timer = setTimeout(parse, 500);
});

parse();


