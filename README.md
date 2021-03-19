# YAML to Menulib2 parser
This is a webpage for parsing yaml in C++ configuration for the Menulib2 project

## YAML Structure

### Simple menu item (fast method)
For a simple menu item the key is the content (the displayed name) and the value is the callback function.
```yaml
Content: callback

# If your name contains spaces you may use quotes, but it also works without them
"Go back": mFunc_back
Without quotes: some_function

# If there is no callback, then put nothing after the double points
NoCallback:
```

### Simple menu item (detailed method)
Another option is to define the callback function and content with key-value pairs one level deeper. The name of top level is ignored, but it can't be used twice on the same level.
```yaml
Simple:
  content: "Menu name"
  callback: callback_function
```

### Sub-menu
Creating an item which is a entry into a sub-menu works by indenting the next item with two spaces (pressing tab also works)
```yaml
"Top item":
  "Sub item":
  Back: mFunc_back
```
### Advanced menu items
Advanced menu items are done by specifying them with key-value pairs indented one level deeper (order of the keys not important). The key on the top level is ignored but it can't be used twice on the same level. You can omit keys you don't need, the only requirement is that at least `content` or `callback` are there. You can also have keys without a value.
```yaml
# key-value pairs
Advanced:
  condetion: condention_function
  content: "Item name"
  callback: # no value is possible
  param: 0
  settings: _LCDML_TYPE_dynParam
```

## Limitations
It's not possible to create simple menu items with the name `content` or `callback` with the fast method. Use the detailed method instead.