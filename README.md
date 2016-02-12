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

### base\_url

[src/adminBase.js:35-37](https://github.com/nxus/admin-ui/blob/9f4131f2fc863ec6ff3ba4e2c2843871bee79745/src/adminBase.js#L35-L37 "Source code on GitHub")

Define the base URL for this admin module

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### display\_name

[src/adminBase.js:51-55](https://github.com/nxus/admin-ui/blob/9f4131f2fc863ec6ff3ba4e2c2843871bee79745/src/adminBase.js#L51-L55 "Source code on GitHub")

Render the display name for the model

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### model\_id

[src/adminBase.js:43-45](https://github.com/nxus/admin-ui/blob/9f4131f2fc863ec6ff3ba4e2c2843871bee79745/src/adminBase.js#L43-L45 "Source code on GitHub")

Define the primary model for this admin module

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### model\_populate

[src/adminBase.js:61-63](https://github.com/nxus/admin-ui/blob/9f4131f2fc863ec6ff3ba4e2c2843871bee79745/src/adminBase.js#L61-L63 "Source code on GitHub")

Define any populated relationships for the model

Returns **[array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

### template\_dir

[src/adminBase.js:69-71](https://github.com/nxus/admin-ui/blob/9f4131f2fc863ec6ff3ba4e2c2843871bee79745/src/adminBase.js#L69-L71 "Source code on GitHub")

Define the template dir - needs to be implemented for local \_\_dirname

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### template\_prefix

[src/adminBase.js:77-79](https://github.com/nxus/admin-ui/blob/9f4131f2fc863ec6ff3ba4e2c2843871bee79745/src/adminBase.js#L77-L79 "Source code on GitHub")

Define the template prefix for this admin module

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
