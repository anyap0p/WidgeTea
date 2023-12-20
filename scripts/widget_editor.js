let widgetClass = {
    todo: false,
    weather: false,
    readingList: false
}

const columns = document.querySelectorAll('.widget_column');

function addTask(newTask) {
    chrome.storage.sync.get(["toDoTasks"]).then((result) => {
        let tasks = result.toDoTasks || [];
        tasks.push(newTask)
        chrome.storage.sync.set({toDoTasks: tasks}).then(() => {
            console.log(`Updated tasks to add ${newTask}`);
        });
    });
}

function removeTask(oldTask) {
    chrome.storage.sync.get(["toDoTasks"]).then((result) => {
        let tasks = result.toDoTasks || [];
        console.log(tasks);
        tasks = tasks.filter(function (task) {
                    return task !== oldTask;
                });
        console.log(tasks);
        chrome.storage.sync.set({toDoTasks: tasks}).then(() => {
            console.log(`Updated tasks to remove ${oldTask}`);
        });
    });
}

function renderTask(task) {
    if (task.trim() !== "") {

        var unfinishedTask = document.createElement("div");
        var taskText = document.createElement("div");
        var deleteButton = document.createElement("button");
        
        unfinishedTask.className = "unfinishedTask";
        taskText.className = "taskContent";
        
        taskText.innerText = task;
        deleteButton.innerText = "Delete";

        deleteButton.onclick = function() {
            unfinishedTask.remove();
            removeTask(task);
        };

        unfinishedTask.appendChild(taskText);
        unfinishedTask.appendChild(deleteButton);

        document.getElementById("task_list").appendChild(unfinishedTask);
        document.getElementById("new_task").value = "";

    }
}

function addAndRenderTask() {
    var newTask = document.getElementById("new_task").value;
    if (newTask.trim() !== ""){
        addTask(newTask);
        renderTask(newTask);
    };
}

function setupTodoWidget(widgetElement) {
    const addButton = widgetElement.querySelector('button');
    addButton.addEventListener('click', function() {
        addAndRenderTask();
    });    
    chrome.storage.sync.get(["toDoTasks"]).then((result) => {
        let tasks = result.toDoTasks || [];
        console.log(tasks);
        for (i in tasks){
            renderTask(tasks[i]);
        };
    });
}

function getWidgetHTML(widgetId){
    switch (widgetId){
        case 'todo':
            return '<h3>To Do</h3> <div id="task_list"></div> <div class="inputContainer"> <input type="text" id="new_task" placeholder="what next?" /> <button id="add_task_button">add</button> </div>'
        default:
            return '<h3>hi<h3>'
    }
}

function saveLayout() {
    let layout = {};
    columns.forEach((col) => {
        let columnWidgets = [];
        console.log(col);
        col.querySelectorAll('.widget').forEach(widget => {
            columnWidgets.push(widget.id);
        });
        layout[col.id] = columnWidgets;
    });
    console.log(layout);
    chrome.storage.sync.set({widgetLayout: layout});
}

function handleDragStart(e) {
    if (e.target === this) {
        e.dataTransfer.setData('text/plain', this.id);
        this.classList.add('dragging');
    } else {
        e.preventDefault();
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const draggedElement = document.getElementById(data);
    const target = e.target.closest('.widget_column, .widget');
    if (target) {
        if (target.classList.contains('widget')) {
            target.parentNode.insertBefore(draggedElement, target);
        } else if (target.classList.contains('widget_column')) {
            target.appendChild(draggedElement);
        }
    }
    saveLayout();
}

function createWidgetComponent(widgetId){

    if (document.getElementById(`${widgetId}`)) {
        console.log(`Cannot add ${widgetId} widget: already exists.`)
        return;
    }

    const widget = document.createElement('div');

    widget.className = 'widget';
    widget.id = widgetId;
    widget.setAttribute('draggable', true);
    widget.addEventListener('dragstart', handleDragStart);
    widget.addEventListener('dragend', handleDragEnd);
    widget.innerHTML = getWidgetHTML(widgetId);

    if (widgetId === 'todo') {
        console.log("setting up to do")
        setupTodoWidget(widget);
    }

    return widget;
}

function addNewWidget(widgetId){
    
    const widget = createWidgetComponent(widgetId);

    emptiestColumn = null;
    columns.forEach(col => {
        if (emptiestColumn === null || emptiestColumn.childElementCount > col.childElementCount){
            emptiestColumn = col;
        }
    });

    emptiestColumn.appendChild(widget);
    saveLayout();
}

function addExistingWidget(widgetId, columnId){
    const widget = createWidgetComponent(widgetId);
    let columnComponent = document.getElementById(columnId);
    console.log(columnComponent)
    columnComponent.appendChild(widget);
    saveLayout();
}

function removeWidgetFromPage(widgetId) {
    const widget = document.getElementById(`${widgetId}`);
    if (widget) {
        widget.remove();
        saveLayout();
    } else {
        console.log(`Widget with ID ${widgetId} not found.`);
    }
}

function updateWidgets(widgetId, add) {

    chrome.storage.sync.get(["widgets"]).then((result) => {

        let curWidgets = result.widgets || widgetClass;

        switch (widgetId){
            case 'todo':
                curWidgets.todo = add;
                break;
            case 'weather':
                curWidgets.weather = add;
                break;
            case 'readingList':
                curWidgets.readingList = add;
                break;
        }

        chrome.storage.sync.set({widgets: curWidgets}).then(() => {
            console.log(`Updated widgets to set ${widgetId} to ${add}`);
        });

        if (document.getElementById(`${widgetId}`)){
            if (add === false) {
                removeWidgetFromPage(widgetId);
            }
        }
        else {
            if (add === true) {
                addNewWidget(widgetId);
            }
        }
    });
}

function updateColorScheme(color) {
    chrome.storage.sync.set({colorscheme: color});
}

function loadColorScheme() {
    chrome.storage.sync.get(['colorscheme'], function(result) {
        if(result.colorscheme){
            document.documentElement.setAttribute('data-color-scheme', result.colorscheme);
        }
    });
}

function loadWidgets() {
    chrome.storage.sync.get(['widgetLayout'], function(result) {
        if(result.widgetLayout){
            for(let columnId in result.widgetLayout){
                result.widgetLayout[columnId].forEach(widgetId => {
                    if(widgetId){
                        addExistingWidget(widgetId, columnId);
                    }
                });
            }
        }
    });
}

function addColumnEventListeners() {
    columns.forEach(col => {
        col.addEventListener('dragover', handleDragOver);
        col.addEventListener('drop', handleDrop);
    });
}

function addDocumentEventListeners() {
    document.addEventListener('DOMContentLoaded', function () {

        var widgetEditButton = document.getElementById('widget_editor_button');
        var widgetPopupOverlay = document.getElementById('edit_widgets_overlay');
        var widgetEditor = document.getElementById('widget_editor');

        var settingsButton = document.getElementById('settings_button');
        var settingsPopupOverlay = document.getElementById('settings_overlay');
        var settingsPage = document.getElementById('settings');

        var input = document.getElementById('new_task');
        var addButton = document.getElementById('add_task_button');
        
        var addToDoList = document.getElementById('add_to_do_list_button');
        var removeToDoList = document.getElementById('remove_to_do_list_button');
        var addWeather = document.getElementById('add_weather_button');
        var removeWeather = document.getElementById('remove_weather_button');
        var addReadingList = document.getElementById('add_reading_list_button');
        var removeReadingList = document.getElementById('remove_reading_list_button');

        var pinkCSButton = document.getElementById('pink_color_scheme_button');
        var orangeCSButton = document.getElementById('orange_color_scheme_button');
        var yellowCSButton = document.getElementById('yellow_color_scheme_button');
        var greenCSButton = document.getElementById('green_color_scheme_button');
        var blueCSButton = document.getElementById('blue_color_scheme_button');
        var purpleCSButton = document.getElementById('purple_color_scheme_button');
        var darkGreenCSButton = document.getElementById('dark_green_color_scheme_button');
        var darkPurpleCSButton = document.getElementById('dark_purple_color_scheme_button');
        var coffeeCSButton = document.getElementById('coffee_color_scheme_button');
        var grayscaleCSButton = document.getElementById('grayscale_color_scheme_button');


        if(widgetEditButton){
            widgetEditButton.addEventListener('click', function() {
                widgetEditor.style.display = 'flex';
            });
        }

        if(widgetPopupOverlay){
            widgetPopupOverlay.addEventListener('click', function() {
                widgetEditor.style.display = 'none';
            });
        }

        if(settingsButton){
            settingsButton.addEventListener('click', function() {
                settingsPage.style.display = 'flex';
            });
        }

        if(settingsPopupOverlay){
            settingsPopupOverlay.addEventListener('click', function() {
                settingsPage.style.display = 'none';
            });
        }

        if (input) {
            input.addEventListener('keypress', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    addButton.click();
                }
            });
        }

        if(addToDoList){
            addToDoList.addEventListener('click', function() {
                updateWidgets('todo', true);
            });
        }

        if(removeToDoList){
            removeToDoList.addEventListener('click', function() {
                updateWidgets('todo', false);
            });
        }

        if(addWeather){
            addWeather.addEventListener('click', function() {
                updateWidgets('weather', true);
            });
        }

        if(removeWeather){
            removeWeather.addEventListener('click', function() {
                updateWidgets('weather', false);
            });
        }

        if(addReadingList){
            addReadingList.addEventListener('click', function() {
                updateWidgets('readingList', true);
            });
        }

        if(removeReadingList){
            removeReadingList.addEventListener('click', function() {
                updateWidgets('readingList', false);
            });
        }

        if(pinkCSButton){
            pinkCSButton.addEventListener('click', function() {
                updateColorScheme('pink');
                document.documentElement.setAttribute('data-color-scheme', 'pink');
            })
        }

        if(orangeCSButton){
            orangeCSButton.addEventListener('click', function() {
                updateColorScheme('orange');
                document.documentElement.setAttribute('data-color-scheme', 'orange');
            })
        }

        if(yellowCSButton){
            yellowCSButton.addEventListener('click', function() {
                updateColorScheme('yellow');
                document.documentElement.setAttribute('data-color-scheme', 'yellow');
            })
        }

        if(greenCSButton){
            greenCSButton.addEventListener('click', function() {
                updateColorScheme('green');
                document.documentElement.setAttribute('data-color-scheme', 'green');
            })
        }

        if(blueCSButton){
            blueCSButton.addEventListener('click', function() {
                updateColorScheme('blue');
                document.documentElement.setAttribute('data-color-scheme', 'blue');
            })
        }

        if(purpleCSButton){
            purpleCSButton.addEventListener('click', function() {
                updateColorScheme('purple');
                document.documentElement.setAttribute('data-color-scheme', 'purple');
            })
        }

        if(yellowCSButton){
            yellowCSButton.addEventListener('click', function() {
                updateColorScheme('yellow');
                document.documentElement.setAttribute('data-color-scheme', 'yellow');
            })
        }

        if(darkPurpleCSButton){
            darkPurpleCSButton.addEventListener('click', function() {
                updateColorScheme('dark purple');
                document.documentElement.setAttribute('data-color-scheme', 'dark purple');
            })
        }

        if(darkGreenCSButton){
            darkGreenCSButton.addEventListener('click', function() {
                updateColorScheme('dark green');
                document.documentElement.setAttribute('data-color-scheme', 'dark green');
            })
        }

        if(coffeeCSButton){
            coffeeCSButton.addEventListener('click', function() {
                updateColorScheme('coffee');
                document.documentElement.setAttribute('data-color-scheme', 'coffee');
            })
        }

        if(grayscaleCSButton){
            grayscaleCSButton.addEventListener('click', function() {
                updateColorScheme('grayscale');
                document.documentElement.setAttribute('data-color-scheme', 'grayscale');
            })
        }

    });
}

function initializeScript() {
    loadWidgets();
    loadColorScheme();
    addColumnEventListeners();
    addDocumentEventListeners();
}

initializeScript();