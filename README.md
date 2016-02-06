# Nxus Admin UI
An Admin UI Framework for Nxus Apps.

## Installation

```
> npm install @nxus/admin-ui --save
```

## Module Configuration

* basePath: the base path, defaults to /admin
* adminTemplate: the admin template to use, defaults to 'admin'

## Usage

The Admin Interface is made up of pages and routes. Pages are rendered content displayed in the Admin Interface. Routes are callbacks that don't render anything, but perform application logic (like a save handler).

### Admin Pages

You can define pages in three ways using the `adminPage` provider. 

#### A partial

If you supply a valid filepath, the Admin interface will use that partial to render the page content for display.

```
admin.provide('adminPage', 'Page Title', '/partial', {iconClass: 'fa fa-file'}, __dirname+"/views/page.ejs")
```

#### A string

If you provide a string, the string will be passed to the admin page template as is.

```
admin.provide('adminPage', 'Page Title', '/content', {iconClass: 'fa fa-file'}, (req, res) => {
  return "this is handler content"
})
```

#### A callback

If you provide a callback, the return should either a string or a Promise for a string.

```
admin.provide('adminPage', 'Page Title', '/function', (req, res) => {
  return Promise.resolve('Some text');
})
```

#### Page Configuration Options

- class: string
- iconClass: string
- nav: boolean
- order: integer

### Admin Routes

#### A handler function

```
admin.provide('adminRoute', 'get', '/redirect', (req, res) => {
  res.redirect('/admin')
})
```
