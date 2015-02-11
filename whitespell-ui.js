var C = myOwnWs.Cache;


var globals = [];


function UIDefinitions() {

    "use strict";

    var mem = C.addMemory("UIDefinitions");

    return {

        unique: { // ids


        },


        collective: { //classes


        }
    }
}

var DOM = {
    transform: function (element, name, value) {
        element.style[name] = value;
    }
}


function HistoryController() {

    "use strict";

    var mem = C.addMemory("HistoryController");

    var loadFunction = null;

    var pageStructures = [];

    var previousPages = [];


    HistoryController.Instance = function () {
        return this;
    }

    HistoryController.Instance.prototype = {

        initialize: function () {
        },

        setOnPageLoad: function (pageName, pageData, onLoad) {
            pageStructures[pageName] = pageData;

            if (loadFunction !== null) {
                return;
            }

            loadFunction = onLoad;
        },
        pushState: function (data, randomNotImportantVariable, url) {

            try {
                if (window.history !== undefined) {
                    history.pushState(data, randomNotImportantVariable, url);
                }
            } catch (e) {
                console.log(e.message);
            }

        },

        setStartState: function (data) {
            wsUI.history.pushState(data, "", "#home");
        },


        startHistory: function () {

            var toPut = {
                components: [],
                updates: [],
                active: []
            };
            for (var i in wsUI.config.components) {
                if (wsUI.config.components[i].active === true) {
                    toPut.active.push(i);
                }
                toPut.components.push(i);
                toPut.updates.push(i);
                // console.log("ADD ALL COMPONENTS AND DEVICE-SPECIFIC SUBCOMPONENTS AS IDS IN THE INTELLIGENCE FEED");
                for (var b in wsUI.config.components[i].remote_html) {
                    //console.log(i + "->" + b);
                }
                // todo create proper start state with new structure
            }
            console.log(toPut);
            this.setStartState(toPut);
        },

        restorePage: function (data, url) {

            if (url !== undefined) {
                // restore data from url todo
            }

            var toRestore = data;


            if (toRestore === undefined || toRestore === null) {
                return;
            }

            wsUI.layout.updatePage({
                components: toRestore.components,
                updates: toRestore.updates
            }, false);


        }


    }

    HistoryController.handleResponse = function (worker, response) {

        switch (worker) {

        }

    }


    return new HistoryController.Instance();
}

function DynamicStream(ViewDeclaration) {

    "use strict";

    /*
     * Recursively merge properties of two objects
     */

    function MergeRecursive(obj1, obj2) {

        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = MergeRecursive(obj1[p], obj2[p]);

                } else {
                    obj1[p] = obj2[p];

                }

            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];

            }
        }

        return obj1;
    }

    DynamicStream.Instance = function () {
        return this;
    };

    DynamicStream.Interaction = {

    }


    DynamicStream.Instance.prototype = {

        variables: [],
        templates: [],
        on: function (variable, functionToExecute) {
            // add queue to listen for variable and execute function when occcurs
        },

        fillTemplate: function (data, template) {
            for (var parts in data) {
                if (template.indexOf(parts) !== -1) {
                    template = template.replace(new RegExp("{" + parts + "}", 'g'), data[parts]);
                }
            }
            return template;
        },

        addTemplate: function (elementName, template) {
            this.templates[elementName] = template;
            return;
        },

        updateValue: function (variable, data, index, options) {

            try {
                if (this.variables[variable] === undefined) {
                    this.declareVariable(variable);
                }

                if (index === undefined || index === -1) {
                    index = 0;

                }
                var ref = null;
                if (options !== undefined) {
                    if (options.ref !== undefined) {
                        ref = data[options.ref];
                        this.variables[variable].refMap[ref] = index
                    }
                }

                this.variables[variable].values[index] = data;

                if (this.variables[variable].subElements.length > 0) {
                    for (var element in this.variables[variable].subElements) {
                        if (document.getElementById(this.variables[variable].subElements[element]) === null) {
                            this.clearSubElements(variable, element);
                            continue;
                        }
                        if (document.getElementById(this.variables[variable].subElements[element]).innerHTML === this.variables[variable].defaultValue) {
                            document.getElementById(this.variables[variable].subElements[element]).innerHTML =
                                this.fillTemplate(data, this.templates[this.variables[variable].subElements[element]]);
                        } else {

                            switch (this.variables[variable].vartype) {
                                case "revlist" :
                                {
                                    document.getElementById(this.variables[variable].subElements[element]).innerHTML =
                                        this.fillTemplate(data, this.templates[this.variables[variable].subElements[element]]) + document.getElementById(this.variables[variable].subElements[element]).innerHTML;
                                    break;
                                }
                                case "list" :
                                {
                                    /*

                                     a list can only be in view once per page, you can not define a list with the same name twice like you can with an object, this is due to heavier in-list targeting
                                     */
                                    this.updateList(variable, (this.variables[variable].subElements[element]), data, ref);
                                    /*}*/
                                    break;
                                }
                                case "obj" :
                                {
                                    document.getElementById(this.variables[variable].subElements[element]).innerHTML =
                                        this.fillTemplate(data, this.templates[this.variables[variable].subElements[element]]);
                                    break;
                                }
                                default:
                                {
                                    console.log("update not defined for var " + variable);
                                    break;
                                }
                            }
                        }

                    }

                }

                if (this.variables[variable].javascripted !== undefined) {
                    wsUI.ui.addGestures(this.variables[variable].javascripted);
                }
            } catch (e) {
                this.clearSubElements(variable, element);
                console.log(e);
            }
        },

        /*

         Updatelists finds the reference within DOM and merges the updated data with the existing data. ref is put last because I want to be able to go as deep as possible into lists later down the road, within a list element might be another list, and another.. etc.
         */

        updateList: function (listName, listElement, data, ref) {

            if (ref !== undefined) {

                var doc = document.getElementById(listName + "-" + ref);
                if (doc !== null) {
                    MergeRecursive(this.variables[listName].values[this.variables[listName].refMap[ref]], data);
                    doc.innerHTML =
                        this.fillTemplate(this.variables[listName].values[this.variables[listName].refMap[ref]], this.templates[listElement]);
                } else {
                    if (listElement !== null) {
                        document.getElementById(listElement).innerHTML += "<span id=\"" + listName + "-" + ref + "\">" +
                            this.fillTemplate(data, this.templates[listElement]) + "</span>";
                    }
                }
            }


        },

        declareVariable: function (varname) {
            if (this.variables[varname] === undefined) {
                this.variables[varname] = {
                    subElements: [],
                    vartype: null,
                    values: [],
                    template: undefined,
                    update: null,
                    linkTo: [],
                    defaultValue: null,
                    javascripted: undefined,
                    refMap: []

                };
            }


        },

        addSubElement: function (varname, idname) {
            if (this.variables[varname] !== undefined) {
                this.variables[varname].subElements.push(idname);
            }
        },
        clearSubElements: function (varname, idname) {
            if (this.variables[varname] !== undefined) {
                this.variables[varname].subElements[idname] = undefined;
            }
        },

        isset: function (varName) {
            return this.variables[varName].values.length > 0;
        },

        issetParam: function (varName, param) {
            return this.variables[varName][param] !== undefined;
        },

        getValues: function (varName) {
            return this.variables[varName].values;

        },

        getVarType: function (varName) {
            return this.variables[varName].vartype;

        },
        getTemplate: function (varName) {
            return this.variables[varName].template;

        },
        getType: function (varName) {
            return this.variables[varName].type;

        },

        pushVariable: function (varname, paramName, value) {
            if (this.variables[varname] !== undefined) {

                this.variables[varname][paramName] = value;
            }
        },

        removeVar: function (varname) {

        },

        clearPageVars: function (page) {

        },

        clearAllVars: function () {

        },

        generateUniqueId: function (varName) {

            if (this.variables[varName] === undefined || this.variables[varName].subElements.length == 0) {
                return 0;
            }
            return ((this.variables[varName].subElements.length + 1));
        }

    }


    return new DynamicStream.Instance();

}
var w$ = function (varname, data, index, options) {

    wsUI.d.updateValue(varname, data, index, options);


}

var w$list = function (data) {
    var jdata = JSON.parse(data);
    var varName = null;
    var ref = null;
    for (var objInd in jdata) {
        if (objInd.indexOf("$") !== -1) {
            varName = objInd;
        }
        else if (objInd.indexOf("ref") !== -1) {
            ref = jdata[objInd];
        }

    }

    for (var rows in jdata[varName]) {
        wsUI.d.updateValue(varName, jdata[varName][rows], rows, { "ref": ref});
    }
}

/*

 SEO
 http://blog.alexmaccaw.com/seo-in-js-web-apps

 */

var wsUI = {

    ui: null,
    layout: null,
    d: null,
    config: null,
    includedJavascript: [],


    initialize: function () {

        //C = myOwnWs.Cache;
        window.onbeforeunload = function () {
            return "Are you sure you wish to exit the application?";
        };


        try {
            window.addEventListener("popstate", function (e) {
                wsUI.history.restorePage(e.state, e.URL);
            }, false);
        } catch (er) {
            console.log(er.message);
        }

        wsUI.ui = new UIHandler(new UIDefinitions);
        wsUI.d = new DynamicStream();
        wsUI.layout = new Layout();
        wsUI.history = new HistoryController();
        wsUI.workers = myOwnWs.workerHandler;

        wsUI.workers.assign("Cors", {
            task: "request",
            params: {
                url: globalConfig.STATIC_CONTENT_URL + globalConfig.CONFIG_FILE, // load from json later
                parseData: {}
            }
        }, function (data) {
            try {
                wsUI.config = JSON.parse(wsUI.parseUrl(data));

                wsUI.config.dT = wsUI.parseUrl(wsUI.config.dT);

                wsUI.workers.assign("Cors", {
                    task: "request",
                    params: {
                        url: wsUI.config.dT,
                        parseData: {}
                    }

                }, function (data) {
                    wsUI.layout.addScriptsToDom("dT", data);
                    wsUI.ui.initialize();
                    wsUI.layout.initialize();
                });
            } catch (er) {
                console.log(er.message);
            }
        });

    },


    parseUrl: function (url) {
        return url.replace(new RegExp("{@this}", 'g'), globalConfig.STATIC_CONTENT_URL).replace(new RegExp("@this", 'g'), globalConfig.STATIC_CONTENT_URL);

    }
}
/*
 Copyright (c) Wilhelmus ("Pim") de Witte 2013 for the WhiteSpell Web Server Project (wsUI.com)
 */


function UIHandler(ViewDeclaration) {

    "use strict";

    var mem = C.addMemory("UIHandler");

    var d = ViewDeclaration;

    var isTouch = (typeof window.ontouchstart !== "undefined");

    var releaseId = (isTouch ? "touchend" : "mouseup");

    var cancelId = ("mouseout");
    var startId = (isTouch ? "touchstart" : "mousedown");

    var currentInterface = "home";

    var backButtonInterface = "home";

    var gesturesDefined = [];

    UIHandler.Instance = function () {
        return this;
    };

    UIHandler.Interaction = {


        bindActions: function (element, actions, flush) {


            if (element === null) {
                throw new Error("You have an element that is not initialized in the UI Definitions.");
            }

            if (flush === true) {
                var oldElement = element;
                var new_element = element.cloneNode(true);
                element.parentNode.replaceChild(new_element, oldElement);
                element = new_element;
            }

            if (element.getAttribute("gestures") === "1") {
                return;
            }

            element.style.cursor = "pointer";

            /* Hammer.JS support for cool gestures */

            if (actions.hammer !== undefined) {
                for (var gesture in actions.hammer) {
                    Hammer(element).on(gesture, function (ev) {
                        actions.hammer[gesture](ev, element);
                    });
                }
            }

            if (actions.touch === undefined) {
                actions.touch = UIHandler.defaultEffects.TouchEffectTask;
            }

            if (actions.after === undefined) {
                actions.after = UIHandler.defaultEffects.ReturnToDefault;
            }

            if (actions.release === undefined) {
            }


            var cancel = function (e) {
                e.preventDefault();
                actions.after(element);
                element.removeEventListener(releaseId, release);
            };


            var release = function (e) {

                if (C.get(mem, "TouchEvents", e) !== window.pageYOffset) {
                    e.preventDefault();
                    actions.after(element);
                    element.removeEventListener(cancelId, cancel);
                    return;
                }
                e.preventDefault();
                actions.release(element);
                actions.after(element);
                element.removeEventListener(cancelId, cancel);
            };

            var start = function (e) {

                //e.preventDefault();
                C.set(mem, "TouchEvents", e, window.pageYOffset);
                actions.touch(element);
                element.addEventListener(cancelId, cancel, false);
                element.addEventListener(releaseId, release, false);

            }

            if (window.attachEvent) {

                if (actions.release !== undefined) {
                    element.attachEvent('onclick', actions.release);

                } else if (actions.start !== undefined) {
                    element.attachEvent('onclick', actions.start);
                }
            } else {
                element.addEventListener(startId, start, false);
            }
            // element.setAttribute("gestures", "1");

        }


    }


    UIHandler.Instance.prototype = {



        getBackButtonInterface: function () {
            return backButtonInterface;
        },

        setCurrentInterface: function (str, cid, cat) {
            if (str !== currentInterface) {
                backButtonInterface = currentInterface;
            }
            document.body.scrollTop = document.documentElement.scrollTop = 0;

            currentInterface = str;
        },

        getIUValue: function (page, val) {

            var res = C.get(mem, "Select-" + page);
            if (res === undefined) {
                console.log(page);
                return "Invalid page specified or not declared";
            }

            var result = C.get(mem, "Select-" + page, val);

            if (result === undefined) {
                console.log(val);
                return "Invalid page specified or not declared";
            } else {
                result = result.selected;
            }

            if (result.indexOf("val:") !== -1) {
                result = document.getElementById(result.split(":")[1]).value;
            }

            return result;
        },

        handleIU: function (e) {

            var data = e.getAttribute("data-options").split(",");
            var c = C.get(mem, "Select-" + data[0]);
            if (c === undefined) {
                C.set(mem, "Select-" + data[0], data[1], {
                    selected: "none",
                    el: null
                });
            }

            var v = C.get(mem, "Select-" + data[0], data[1]);

            if (v === undefined) {
                C.set(mem, "Select-" + data[0], data[1], {
                    selected: "none",
                    el: null
                });
            }

            var p = C.get(mem, "Select-" + data[0], data[1])['el'];
            if (p != null && v.selected != data[2]) {
                p.style.background = "#ffffff"
                p.style.color = "#212121"
            }
            //C.get(mem, "Select-"+data[0],data[1]).el.style.background = "#ffffff";

            C.set(mem, "Select-" + data[0], data[1], {
                selected: data[2],
                el: e
            });


        },


        setRequestMode: function (str) {

            wsUI.mode = str;

        },

        initialize: function () {

            if (releaseId in window) {
                alert("alert");
            }


        },

        addGestures: function (name, gs) {
            /*

             todo: make it so elements that are added by WSIF are updated independently, currently the whole list gets re-initialized.
             */


            if (gesturesDefined[name] !== undefined) {
                if (gs === undefined) {
                    gs = gesturesDefined[name];
                }
            }

            gesturesDefined[name] = gs;

            if (gs === undefined) {
                return;
            }


            for (var element in gs.unique) {

                var targetElement = document.getElementById(element);

                UIHandler.gestures.add(UIHandler.Interaction.bindActions(targetElement, gs.unique[element], true));

            }

            for (var className in gs.collective) {


                var elements = document.getElementsByClassName ? document.getElementsByClassName(className) : document.querySelectorAll("." + className + "");

                for (var i = 0; i < elements.length; i++) {
                    UIHandler.gestures.add(name, UIHandler.Interaction.bindActions(elements[i], gs.collective[className], true));

                }

            }

        }
    }


    UIHandler.defaultEffects = {

        TouchEffectTask: function (e) {

            DOM.transform(e, "opacity", ".3");

        },

        ReturnToDefault: function (e) {

            DOM.transform(e, "opacity", "1");

        }


    };

    UIHandler.gestures = {

        container: [],

        add: function (name, task) {
            if (this.container[name] !== undefined) {
                this.container[name] = [];
            } else {
                this.container[name] = [];
            }
            this.container[name].push(task);
        }
    }

    UIHandler.DOMController = {

    }

    return new UIHandler.Instance();

}


function Collector(name) {

    "use strict";

    var parentElement = name;

    var mem = C.addMemory(parentElement + "Collector");

    var page = "No data";


    C.set(mem, "dynamic", "variables", []);


    Collector.Instance = function () {
        return this;
    };

    Collector.Interaction = {

    }


    Collector.Instance.prototype = {



        addStatic: function (input, javascripted) {


            // get variables out of content, put them in cache as separate indices, return page without variables but with default values
            input = wsUI.parseUrl(input);
            var result = retrieveVariables(input, javascripted, parentElement);
            C.set(mem, "static", parentElement, result);
            page = result;

        },

        getCurrentPage: function () {
            return page;
        }

    }


    return new Collector.Instance();

}


/**
 * RetrieveVariables is a recursive function that takes an input, and finds all the variables in the input. For each variable
 * RetrieveVariables generates a unique ID and places it in the DynamicStream Variables. The IDs are stored in a map and can be iterated
 * through when updating the variable by name. It also finds the variable template and defines the template for the variable, so that it
 * can be re-used when data comes in.
 *
 * @param input
 * @param javascripted
 * @param parentElement
 * @returns {*}
 */
var retrieveVariables = function (input, javascripted, parentElement) {

    if (input.indexOf("<var") === -1) {
        return input;
    }

    /*
     We position the next variable in the full input string
     */

    var declarationStart = input.indexOf("<var");
    var declarationEnd = input.indexOf("</var>");
    var completeVar = input.substring(declarationStart, declarationEnd + "</var>".length);
    var parameterString = completeVar.substring(0, ((completeVar.indexOf(">") + ">".length)));

    var varName = getParameterFromString("name", parameterString, true);

    var uid = wsUI.d.generateUniqueId(varName);

    var elementName = varName + "-" + uid;

    var defaultValue = getParameterFromString("default", parameterString, true);

    if (uid === 0) {
        wsUI.d.declareVariable(varName);
        wsUI.d.pushVariable(varName, "defaultValue", parameterString);
        var vtype = getParameterFromString("vartype", parameterString, true);
        if (vtype === undefined || vtype.length <= 0) {
            vtype = "obj";
        }
        wsUI.d.pushVariable(varName, "vartype", vtype);

        if (javascripted) {
            wsUI.d.pushVariable(varName, "javascripted", parentElement);
        }
    }

    wsUI.d.addTemplate(elementName, getTemplateFromString(completeVar));

    var currentOutput = "";

    if (wsUI.d.isset(varName)) {
        currentOutput += "<wsv id=\"" + elementName + "\">";
        var a = wsUI.d.getValues(varName);
        for (var single in a) {
            var temp = getTemplateFromString(completeVar);
            var fillIn = true;
            for (var b in a[single]) {
                if (temp.indexOf(b) !== -1) {
                    // we have found the value to display in the template and can proceed to check if other ones are in too
                } else {
                    console.log(b + " was not found in template" + temp);
                    console.log(a[single]);
                }
            }
            currentOutput += wsUI.d.fillTemplate(a[single], temp);

        }
        currentOutput += "</wsv>";
    } else {
        currentOutput = "<wsv id=\"" + elementName + "\">" + defaultValue + "</wsv>";
    }

    wsUI.d.clearSubElements(varName, elementName);
    wsUI.d.addSubElement(varName, elementName);


    input = input.replace(completeVar, currentOutput);


    return retrieveVariables(input, javascripted, parentElement);
}


window.retrieveVariables = retrieveVariables;


var getParameterFromString = function (parameter, input, replaceQuotes) {

    if (input.indexOf(parameter) === -1) {
        return "";
    }

    if (replaceQuotes) {
        if (input.indexOf('"') !== -1) {
            input = input.replace(/"/g, "");
        }
    }

    input = input.substr(input.indexOf(parameter + "="));

    if (input.indexOf(' ') > 0) {
        input = input.substr(0, input.indexOf(' '));
    } else {
        input = input.substr(0, input.indexOf(">"));
    }

    input = input.replace(parameter + "=", "");
    window.getParameterFromString = getParameterFromString;

    return input;
}

var getTemplateFromString = function (input) {
    var input = input.substr(input.indexOf(">") + 1);
    window.getTemplateFromString = getTemplateFromString;
    return input.substr(0, input.indexOf("</var>"));
}


function Layout() {
    "use strict";

    var structure = [];

    var pageStructures = []


    Layout.Instance = function () {
        return this;
    }

    Layout.Instance.prototype = {

        setPageStructure: function (component, data) {
            pageStructures[component] = data;
        },

        toggleVisibility: function (el) {
            var displayCSSValue = null;
            if (el.style.display === undefined || el.style.display.display === null || el.style.display.length < 1) {
                var style = window.getComputedStyle(el);
                displayCSSValue = style.getPropertyValue('top');
            } else {
                displayCSSValue = el.style.display;
            }

            return el.style.display = (displayCSSValue.indexOf("none") !== -1 ? "block" : "none");
        },
        switchBetween: function (el, property, value1, value2) {
            var displayCSSValue = null;
            if (el.style[property] === undefined || el.style[property] === null || el.style[property].length < 1) {
                var style = window.getComputedStyle(el);
                displayCSSValue = style.getPropertyValue(property);
            } else {
                displayCSSValue = el.style[property];
            }

            return el.style[property] = (displayCSSValue.indexOf(value1) !== -1 ? value2 : value1);
        },

        updatePage: function (data, history) {

            var urlBuilder = "";
            for (var i in data.components) {
                if (urlBuilder.length === 0) {
                    urlBuilder += data.components[i] + ":" + data.updates[i];
                } else {
                    urlBuilder += "," + data.components[i] + ":" + data.updates[i];
                }

                var type = "update";

                if (data.components[i] === data.updates[i]) {
                    type = "main";
                }

                structure[data.components[i]].destruct();


                var comp = new Component(type, data.updates[i], data.components[i]);
                document.getElementById(data.components[i]).innerHTML = comp.update; //wsUI.parseUrl(wsUI.config.updates[fillInName].remote_html)
                structure[data.components[i]] = comp;
            }

            if (history) {
                wsUI.history.pushState(data, "", "#" + urlBuilder);
                console.log("test");
            }

        },

        deactivateComponent: function (name) {
            // delete from dom
            wsUI.config.components[name].active = false;
            document.getElementById(wsUI.config.components[name].position).removeChild(document.getElementById(name));
            structure[name].destruct();
            structure[name] = null;
        },
        activateComponent: function (name) {
            wsUI.config.components[name].active = true;
            this.loadComponent(name);
        },

        toggleComponent: function (name) {
            if (wsUI.config.components[name].active === true) {
                this.deactivateComponent(name);
            } else {
                this.activateComponent(name);
            }
        },


        loadComponent: function (name) {
            var comp = new Component("main", name, name);
            document.getElementById(wsUI.config.components[name].position).innerHTML += comp.update;
            structure[name] = comp;
        },

        initialize: function () {

            for (var compz in wsUI.config.components) {
                if (wsUI.config.components[compz].active === true) {
                    this.loadComponent(compz);
                }
            }


        },

        newElement: function (name, attributes, content, parent) {

            if (parent !== undefined) {

            }
        },

        addScriptsToDom: function (name, content, mainComponent) {


            if (content === undefined || content.length <= 0) {
                return;
            }


            var fileref = document.createElement('script');
            var generatedId = "script" + Math.random() * 1000; // todo real algorithm
            fileref.setAttribute("id", generatedId);
            fileref.setAttribute("defer", "true");

            fileref.setAttribute("type", "text/javascript");

            fileref.text = content;
            //fileref.innerHTML = content; // t

            if (typeof fileref !== "undefined") {
                document.getElementsByTagName("head")[0].appendChild(fileref);
                if (structure[mainComponent] !== undefined && structure[mainComponent] !== null) {
                    structure[mainComponent].addRemovableChild("js", generatedId);
                }
            }


        },

        addStyleToDom: function (name, content, mainComponent) {


            if (content === undefined || content.length <= 0) {
                return;
            }


            var style = document.createElement('style');
            var generatedId = "style" + Math.random() * 1000; // todo real algorithm
            style.setAttribute("id", generatedId);
            style.type = 'text/css';

            if (style.styleSheet) {
                // IE
                style.styleSheet.cssText = content;
            } else {
                // Other browsers
                style.innerHTML = content;
            }


            if (typeof style !== "undefined") {
                document.getElementsByTagName("head")[0].appendChild(style);
                if (structure[mainComponent] !== undefined && structure[mainComponent] !== null) {
                    structure[mainComponent].addRemovableChild("css", generatedId);
                }
            }


        },

        getUrl: function (page) {
            if (wsUI.config === null) {
                return "Config is null";
            } else if (wsUI.config.components[page] === undefined) {
                return "Page is not defined in config";
            }

            return wsUI.config.components[page].remote_html;
        },
        getId: function (page) {
            if (wsUI.config === null) {
                return "Config is null";
            } else if (wsUI.config.components[page] === undefined) {
                return "Page is not defined in config";
            }

            return wsUI.config.domain[page].id;
        },

        curlCast: function (target, curl) {
            this.displaySpinner(target, "#e8e8e8");
            curl();
        },

        displaySpinner: function (target, color) {

            if (color === undefined) {
                color = "#e8e8e8";
            }
            var opts = {
                lines: 13, // The number of lines to draw
                length: 7, // The length of each line
                width: 4, // The line thickness
                radius: 10, // The radius of the inner circle
                rotate: 0, // The rotation offset
                color: color, // #rgb or #rrggbb
                speed: 1, // Rounds per second
                trail: 60, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: false, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                top: 'auto', // Top position relative to parent in px
                left: 'auto' // Left position relative to parent in px
            };

            var spinner = new Spinner(opts).spin(target);
        }

    }

    function getUrl(page) {

        if (wsUI.config === null) {
            return "Config is null";
        } else if (wsUI.config.components[page] === undefined) {
            return "Page is not defined in config";
        }

        return wsUI.config.components[page].remote_html;
    }

    function getId(page) {

        if (wsUI.config === null) {
            return "Config is null";
        } else if (wsUI.config.components[page] === undefined) {
            return "Page is not defined in config";
        }

        return wsUI.config.components[page].id;
    }


    return new Layout.Instance();
}


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function () {
        wsUI.initialize();
        //this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        wsUI.initialize();
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
    }
};

function Component(updateType, componentName, mainComponent) {

    "use strict"


    var url = updateType === "update" ? (wsUI.config.components[mainComponent].updates[componentName].remote_html[deviceType].src) : (wsUI.config.components[componentName].remote_html[deviceType].src);
    var incl_css = updateType === "update" ? (wsUI.config.components[mainComponent].updates[componentName].remote_css[deviceType].src) : (wsUI.config.components[componentName].remote_css[deviceType].src);
    var incl_js = updateType === "update" ? (wsUI.config.components[mainComponent].updates[componentName].remote_js[deviceType].src) : (wsUI.config.components[componentName].remote_js[deviceType].src);

    var constructedPage = false;
    var collects = {
        html_content: "",
        css_content: "",
        js_content: ""
    }


    var finishedJavascript = false;
    var finishedCSS = false;
    var finishedHTML = false;

    var childJavascript = [];
    var childCSS = [];

    var componentName = componentName; // has to be unique

    var incl_scripts = [];

    var checkStyle = updateType === "update" ? undefined : wsUI.config.components[componentName].defaultStyle;
    var defaultStyle = checkStyle !== undefined ? checkStyle[deviceType] : "";

    var content = "<div id=\"" + componentName + "\" style=\"" + defaultStyle + "\">Loading " + componentName + "</div>";

    var collector = new Collector(componentName);


    if (incl_js !== undefined) {
        var totalExpectedJS = incl_js.length;
        var receivedJS = 0;
        for (var i = 0; i < incl_js.length; i++) {
            wsUI.workers.assign("Cors", {
                task: "request",
                cacheResult: true,
                params: {
                    url: (incl_js[i]), // load from json later
                    parseData: {}
                }
            }, function (data) {

                collects.js_content += wsUI.parseUrl(data);
                receivedJS++;
                if (receivedJS === totalExpectedJS) {
                    finishedJavascript = true;
                    notifyReceival();

                }
            });
        }
    }
    if (incl_css !== undefined) {
        var totalExpectedCSS = incl_css.length;
        var receivedCSS = 0;
        for (var i = 0; i < incl_css.length; i++) {
            wsUI.workers.assign("Cors", {
                task: "request",
                cacheResult: true,
                params: {
                    url: (incl_css[i]), // load from json later
                    parseData: {}
                }
            }, function (data) {


                if (data.length <= 0) {
                    return;
                }

                collects.css_content += wsUI.parseUrl(data);
                receivedCSS++;

                if (receivedCSS === totalExpectedCSS) {
                    finishedCSS = true;
                    notifyReceival();

                }
            });
        }
    }
    wsUI.workers.assign("Cors", {
        task: "request",
        cacheResult: true,
        params: {
            url: url, // load from json later
            parseData: {}
        }
    }, function (data) {

        collects.html_content += data;
        notifyReceival();

    }, { element: document.getElementById("navigation"), type: "spinner" });

    function notifyReceival() {
        if (collects.html_content.length > 0
            && finishedJavascript === true
            && finishedCSS === true
            ) {
            if (!constructedPage) {
                constructedPage = true;
                constructPage();
            }
        }
    }

    function constructPage() {


        var z = function (data, compName, mainComponent) {

            wsUI.layout.addStyleToDom(mainComponent, collects.css_content, mainComponent);

            var javascripted = (incl_js !== undefined);

            if (collects.js_content.indexOf("{{componentName}}") !== -1) {
                collects.js_content = collects.js_content.replace(new RegExp("{{componentName}}", 'g'), compName);
            }
            collector.addStatic(data, javascripted);
            document.getElementById(compName).innerHTML = collector.getCurrentPage();

            if (javascripted) {
                wsUI.layout.addScriptsToDom(mainComponent, collects.js_content, mainComponent);
            }
        };

        //wsUI.history.setOnPageLoad(componentName, collects.html_content, z);

        z(collects.html_content, componentName, mainComponent);
    }

    return {

        addRemovableChild: function (type, id) {

            if (type === "css") {
                childCSS.push((id))
            } else if (type === "js") {
                childJavascript.push(id);
            }
        },

        destruct: function () {

            for (var i in childJavascript) {
                document.getElementsByTagName("head")[0].removeChild(document.getElementById(childJavascript[i]));
            }

            for (var i in childCSS) {
                document.getElementsByTagName("head")[0].removeChild(document.getElementById(childCSS[i]));
            }
        },

        update: content
    };
}


function base64_encode(data) {
    //  discuss at: http://phpjs.org/functions/base64_encode/
    // original by: Tyler Akins (http://rumkin.com)
    // improved by: Bayron Guevara
    // improved by: Thunder.m
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Rafał Kukawski (http://kukawski.pl)
    // bugfixed by: Pellentesque Malesuada
    //   example 1: base64_encode('Kevin van Zonneveld');
    //   returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
    //   example 2: base64_encode('a');
    //   returns 2: 'YQ=='
    //   example 3: base64_encode('✓ à la mode');
    //   returns 3: '4pyTIMOgIGxhIG1vZGU='

    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = '',
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data = unescape(encodeURIComponent(data));

    do {
        // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}
function base64_decode(data) {
    console.log(data);
    //  discuss at: http://phpjs.org/functions/base64_decode/
    // original by: Tyler Akins (http://rumkin.com)
    // improved by: Thunder.m
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //    input by: Aman Gupta
    //    input by: Brett Zamir (http://brett-zamir.me)
    // bugfixed by: Onno Marsman
    // bugfixed by: Pellentesque Malesuada
    // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
    //   returns 1: 'Kevin van Zonneveld'
    //   example 2: base64_decode('YQ===');
    //   returns 2: 'a'
    //   example 3: base64_decode('4pyTIMOgIGxhIG1vZGU=');
    //   returns 3: '✓ à la mode'

    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = '',
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do {
        // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');

    return decodeURIComponent(escape(dec.replace(/\0+$/, '')));
}

//URL ENCODE AND DECODE. > IS CAUSING PROBLEM