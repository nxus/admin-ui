# @nxus/admin-ui

## 

[![Build Status](https://travis-ci.org/nxus/admin-ui.svg?branch=master)](https://travis-ci.org/nxus/admin-ui)

An Admin UI Framework for Nxus Apps.

### Installation

    > npm install @nxus/admin-ui --save

### Optional Module Configuration

There are two configuration options you can specify in your package.json file to change the way the admin-ui module
functions. All configuration should be under the `admin-ui` section of the `config` key.

-   **basePath**: the base path, defaults to /admin
-   **adminTemplate**: the admin template to use, defaults to 'admin'

For example:

    "config": {
      "admin-ui": {
        "basePath": "/otherRoute",
        "adminTemplate": "myAdmin"
      }
    }

### Usage

The Admin Interface is made up of pages and routes. Pages are rendered content displayed in the Admin Interface. 
Routes are callbacks that don't render anything, but perform application logic (like a save handler).

#### Admin Pages

You can define pages in three ways using the `adminPage` provider. 

##### A partial

If you supply a valid filepath, the Admin interface will use that partial to render the page content for display.

    admin.adminPage('Page Title', '/partial', {iconClass: 'fa fa-file'}, __dirname+"/views/page.ejs")

##### A string

If you provide a string, the string will be passed to the admin page template as is.

    admin.adminPage('Page Title', '/content', {iconClass: 'fa fa-file'}, (req, res) => {
      return "this is handler content"
    })

##### A callback

If you provide a callback, the return should either a string or a Promise for a string.

    admin.adminPage('Page Title', '/function', (req, res) => {
      return Promise.resolve('Some text');
    })

##### Page Configuration Options

-   **class**: string
-   **iconClass**: string
-   **nav**: boolean
-   **order**: integer

#### Admin Routes

##### A handler function

    admin.adminRoute('get', '/redirect', (req, res) => {
      res.redirect('/admin')
    })

### Model View helpers

The module provides a helper for generating list/detail views from a model:

    app.get('admin-ui').adminModel('user', {base: '/users', titleField: 'email'})

You may pass in an options object, as in this example, or subclass of ViewBase, or a string path to a subclass of ViewBase.

    import {AdminBase} from '@nxus/admin-ui'

    class UserView extends AdminBase {
      model() {
        return 'user'
      }
      base() {
        return '/users'
      }
      titleField() {
        return 'email
      }
    }

    app.get('admin-ui').adminModel(UserView)

#### Customizing

If you want to provide your own 404 or 500 page, define the relevant new template. Base-ui will use these to handle the routes above.

##### List and Detail View

You can specify your own list view template to use instead of the default. The base-ui module looks for a template matching the following 
pattern: `admin-<model>-list` and `admin-<model>-detail`.

Each template will be passed either a model instance (for detail view) or an array of models (for list view), using the model name.

So using the examples above:

    app.get('templater').templateFunction('admin-user-list', (opts) => {
      return app.get('renderer').render("ejs", "<% users.forEach(function(user){ .... }) %>", opts)
    })

    app.get('templater').template('admin-user-detail', 'ejs', () => {
      return app.get('renderer').render("ejs", "Email: <%= user.email %>", opts)
    })

## API

* * *

## AdminBase

The AdminBase class provides a set of helper CRUD classes for defining Admin-UI based admin pages.

**Examples**

```javascript
class TodoAdmin extends AdminBase {
 base () {
    return '/todo'
  }
 model () {
    return 'todo'
  }
 templateDir () {
    return __dirname+'/views'
  }
}
```

### base

The base url for the Admin CRUD UI.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to `/<models>`

### display

Fields in the model to show

Returns **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

### displayName

The display name for the model to use in the Admin UI

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to `<model>`

### iconClass

The class to use for the nav icon.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to `fa fa-file`

### ignore

Fields in the model to ignore in the UI

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### model

Define the primary model for this admin module

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### modelNames

Returns a hash of currently used models.

Returns **\[type]** [description]

### modelPopulate

Define any populated relationships for the model

Returns **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

### templateDir

The directory to find the templates.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to null.

### templatePrefix

The prefix to use for the templates. Defaults to `admin-<model>-`

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### uploadOptions

Options for data-loader on upload

**Examples**

```javascript
return {identityFields: ['name'], mapping: {Name: 'name'}}
```

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### uploadType

Allow upload of models by this file type

**Examples**

```javascript
return 'csv'
```

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## AdminUI

The AdminUI module provides default templates and nav for an administrative section of your site.
 If the @nxus/users module is installed, the admin section will require admin-level authentication.

**Examples**

```javascript
Configuration (defaults):
 {adminUI: {
   basePath: '/admin',    # urls registered for admin will start with this path
   adminTemplate: 'admin' # name of the main admin template to use
 }}
```

### adminModel

Creates a CRUD UI for the specified model, including all routes and views.  You can pass in the following combinations:

1.  a model name and opts hash.
2.  a path to a file which is a subclass of AdminBase
3.  a class which is a subclass of AdminBase

Routes created are:

-   `/admin/<base>`: list page 
-   `/admin/<base>/create`: create new instance 
-   `/admin/<base>/edit/:id`: edit existing instance 
-   `/admin/<base>/destroy/:id`: destroy existing instance 

Views which can be overriden are:

-   `admin-<model>-form`: the create/edit form
-   `admin-<model>-list`: the list page view

The generated form for edit/create currently handles simple types (string, float, boolean, etc) and foreign key fields as a dropdown of all the related models.

Options available are:

-   `base`: the url at which the CRUD paths are created. For example, '/users'.
-   `iconClass`: the icon class to use in the Nav. Used in <i> tag.
-   `templatePrefix`: a custom prefix for generated templates. Defaults to `admin-<model>`.
-   `ignore`: an array of model fields to ignore in the UI. Defaults to `['id', 'createdAt', 'updatedAt']`
-   `templateDir`: a directory containing the list/form templates for the model. Defaults to none.
-   `displayName`: an alternate name to use for the display in the Admin UI. Defaults to `model`.

**Parameters**

-   `model` **([string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)|class)** Can either be a model name, a path to a file or an AdminBase Subclass.
-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)=(default {})** An options hash, wich is used to configure the CRUD UI.

### adminPage

Register a page for inclusion in the admin site and navigation 
 Page template will receive (and can set in opts):

-   class: string
-   iconClass: string
-   nav: boolean
-   order: integer

**Parameters**

-   `title` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The title of the page, and navigation link
-   `path` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The url path for the page
-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Additional options for the rendering of this page
-   `handler` **([string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)|template-partial|[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function))** for rendering this page

### adminRoute

Register a raw route for inclusion in the admin site

**Parameters**

-   `method` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The HTTP method to handle
-   `path` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The url path for the page
-   `handler` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** for rendering this page

### getInstanceActions

Get the registered actions for model instances

**Parameters**

-   `model` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The model identity

### getModelActions

Get the registered actions for model

**Parameters**

-   `model` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The model identity

### instanceAction

Register an action for the model detail page

**Parameters**

-   `model` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The model identity to include this action, or '\*'
-   `label` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The button label for this action
-   `subURL` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The url for this action (register this as an adminPage separately)
-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Additional options: class, iconClass, suffixName

### modelAction

Register an action for the model list page

**Parameters**

-   `model` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The model identity to include this action, or '\*'
-   `label` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The button label for this action
-   `subURL` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The url for this action (register this as an adminPage separately)
-   `opts` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Additional options: class, iconClass, suffixName
