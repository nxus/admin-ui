# Nxus Admin UI

[![Build Status](https://travis-ci.org/nxus/admin-ui.svg?branch=master)](https://travis-ci.org/nxus/admin-ui)

An Admin UI Framework for Nxus Apps.

## Installation

    > npm install @nxus/admin-ui --save

## Module Configuration

-   basePath: the base path, defaults to /admin
-   adminTemplate: the admin template to use, defaults to 'admin'

## Usage

The Admin Interface is made up of pages and routes. Pages are rendered content displayed in the Admin Interface. Routes are callbacks that don't render anything, but perform application logic (like a save handler).

### Admin Pages

You can define pages in three ways using the `adminPage` provider. 

#### A partial

If you supply a valid filepath, the Admin interface will use that partial to render the page content for display.

    admin.adminPage('Page Title', '/partial', {iconClass: 'fa fa-file'}, __dirname+"/views/page.ejs")

#### A string

If you provide a string, the string will be passed to the admin page template as is.

    admin.adminPage('Page Title', '/content', {iconClass: 'fa fa-file'}, (req, res) => {
      return "this is handler content"
    })

#### A callback

If you provide a callback, the return should either a string or a Promise for a string.

    admin.adminPage('Page Title', '/function', (req, res) => {
      return Promise.resolve('Some text');
    })

#### Page Configuration Options

-   class: string
-   iconClass: string
-   nav: boolean
-   order: integer

### Admin Routes

#### A handler function

    admin.adminRoute('get', '/redirect', (req, res) => {
      res.redirect('/admin')
    })

## API

### AdminBase

[src/adminBase.js:30-238](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L30-L238 "Source code on GitHub")

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

#### base

[src/adminBase.js:64-66](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L64-L66 "Source code on GitHub")

The base url for the Admin CRUD UI.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to `/<models>`

#### displayName

[src/adminBase.js:96-98](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L96-L98 "Source code on GitHub")

The display name for the model to use in the Admin UI

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to `<model>`

#### iconClass

[src/adminBase.js:72-74](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L72-L74 "Source code on GitHub")

The class to use for the nav icon.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to `fa fa-file`

#### ignore

[src/adminBase.js:56-58](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L56-L58 "Source code on GitHub")

Fields in the model to ignore in the UI

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

#### model

[src/adminBase.js:104-107](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L104-L107 "Source code on GitHub")

Define the primary model for this admin module

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

#### model\_populate

[src/adminBase.js:113-115](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L113-L115 "Source code on GitHub")

Define any populated relationships for the model

Returns **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

#### templateDir

[src/adminBase.js:80-82](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L80-L82 "Source code on GitHub")

The directory to find the templates.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Defaults to null.

#### templatePrefix

[src/adminBase.js:88-90](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/adminBase.js#L88-L90 "Source code on GitHub")

The prefix to use for the templates. Defaults to `admin-<model>-`

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### AdminUI

[src/index.js:33-200](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/index.js#L33-L200 "Source code on GitHub")

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

#### adminModel

[src/index.js:154-170](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/index.js#L154-L170 "Source code on GitHub")

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

#### adminPage

[src/index.js:95-106](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/index.js#L95-L106 "Source code on GitHub")

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

#### adminRoute

[src/index.js:114-125](https://github.com/nxus/admin-ui/blob/78544627466ff7646d67e38bf687ab53422fa971/src/index.js#L114-L125 "Source code on GitHub")

Register a raw route for inclusion in the admin site

**Parameters**

-   `method` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The HTTP method to handle
-   `path` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The url path for the page
-   `handler` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** for rendering this page
