# Cordyceps

## General

Cordyceps is a little JS Framework that allows parts of the DOM to share some
state and react to changes in that state.

My intention was to encourage a React/Redux type of architecture, while, at the
same time making it easy for the developer to be a little sloppy and to easily
be able to use existing HTML and existing JS widgets, etc.

Cordyceps was created for use with jQuery and cannot be used without it.
(Although this could be easily changed.)

## Introduction

### Writing the HTML skeleton

```html
<div data-cordyceps-infected-by="hello-world">
    <h1 id="output"></h1>
    <button id="add-one">+1</button>
    <button id="randomize-color">Randomize color</button>
</div>
```

This is the HTML that will be affected. The element containing the
`data-cordyceps-infected-by` will be called the 'host' element.


### Inititalizing cordyceps and defining the initial state

```js
var app = cordyceps({
    count: 0,
    color: '#000000'
});
```


### Inititalizing cordyceps and defining the initial state

```js
app.newFungus('hello-world', {
    onInit: function ($host, state) {
        $host.find('#randomize-color').click(function () {
            app.updateState({ color: '#'+Math.floor(Math.random()*16777215).toString(16) })
        });

        $host.find('#add-one').click(function () {
            // Increase count by 1, compared to current state
            app.updateState({ count: app.getState().count + 1 })
        });

        this.updateOutput($host, state);
    },
    onStateChange: function ($host, state, prevState) {
        this.updateOutput($host, state)
    },
    updateOutput: function ($host, state) {
        var $output = $host.find('#output');
        $output.text(state.count);
        $output.css('color', state.color);
    }
});
```

This is the part that specifies the behavior of the 'infected' HTML. The
`onInit` function is called once, when cordyceps is started. Its arguments are
the `$host`, which is the infected DOM element as a jQuery object and the initial
`state`. This can be used to attach click and other event handlers to the DOM.

Whenever the state is changed via a call to `app.updateState` the
`onStateChange` function of every cordyceps fungus is called and passed the new
state and the previous state. Note that when calling `app.updateState` you only
need to specify the parts of the state that you want to change.


### Infect the host elements
```js
$(function () {
    // When the DOM is loaded, start cordyceps
    app.infectAll();
});
```

This starts cordyceps and calls the `onInit` function on every 'infected' element.


## Further remarks

### Omitting the `onInit` method
When no `onInit` method is specified cordyceps automatically calls
`onStateChange` instead and passes `undefined` as the `prevState` argument.

### Returning an element
The `onInit` and the `onStateChange` functions can both return jQuery objects.
In that case the `$host` is completely replaced by the returned jQuery element.
The returned element is then passed as the new `$host` on future calls of
`onStateChange`.

### Debug mode
Cordyceps has a debug mode:

```js
var app = cordyceps({
    // ...
}, true) // <-- This is the required argument
```

This will log state updates to the console.


### Deep updates
When `app.updateState` is called cordyceps performs a deep update. For example 
this will do what you think:

```js
var app = cordyceps({
    an: {
        object: null,
    },
    another: {
        random: {
            object: {
                a: 1,
                b: 2
            }
        }
    }
});

app.updateState({ another: { random: { object: { a: 3 }}}});
```

It will just change the value of `a` and keep all other values.

The resulting state will be

```js
var app = cordyceps({
    an: {
        object: null,
    },
    another: {
        random: {
            object: {
                a: 3,
                b: 2
            }
        }
    }
});
```


### Preventing deep updates of parts of the state

However, sometimes you just want cordyceps to replace an entire object and not
go into it. (Especially when an object contains cyclic references.) In that 
case you can wrap that object in a NoRecurseWrapper:

```js
var app = cordyceps({
    an: {
        object: null,
    },
    another: {
        random: new cordyceps.NoRecurseWrapper({object: {
                a: 1,
                b: 2
            })
        }
    }
});

app.updateState({ another: { random: { object: { a: 3 }}}});
```

The resulting state will be

```js
var app = cordyceps({
    an: {
        object: null,
    },
    another: {
        random: {
            object: {
                a: 3,
            }
        }
    }
});
```
