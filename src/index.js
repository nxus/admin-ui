/* 
* @Author: Mike Reich
* @Date:   2016-02-04 18:40:18
* @Last Modified 2016-07-28
*/

'use strict';

import Promise from 'bluebird'
import fs from 'fs'
import _ from 'underscore'
import path from 'path'

import AdminBaseClass from './adminBase'

export var AdminBase = AdminBaseClass

const defaultOpts = {
  basePath: '/admin',
  adminTemplate: 'admin',
  limitToAdmin: true
}

/**
 * [![Build Status](https://travis-ci.org/nxus/admin-ui.svg?branch=master)](https://travis-ci.org/nxus/admin-ui)
 * 
 * An Admin UI Framework for Nxus Apps.
 * 
 * ## Installation
 * 
 *     > npm install nxus-admin-ui --save
 * 
 * ## Optional Module Configuration
 * There are two configuration options you can specify in your package.json file to change the way the admin-ui module
 * functions. All configuration should be under the `admin-ui` section of the `config` key.
 * 
 * -   **basePath**: the base path, defaults to /admin
 * -   **adminTemplate**: the admin template to use, defaults to 'admin'
 *
 * For example:
 *
 * ```
 * "config": {
 *   "admin-ui": {
 *     "basePath": "/otherRoute",
 *     "adminTemplate": "myAdmin"
 *   }
 * }
 * ```
 * 
 * ## Usage
 * 
 * The Admin Interface is made up of pages and routes. Pages are rendered content displayed in the Admin Interface. 
 * Routes are callbacks that don't render anything, but perform application logic (like a save handler).
 * 
 * ### Admin Pages
 * 
 * You can define pages in three ways using the `adminPage` provider. 
 * 
 * #### A partial
 * 
 * If you supply a valid filepath, the Admin interface will use that partial to render the page content for display.
 * 
 *     admin.adminPage('Page Title', '/partial', {iconClass: 'fa fa-file'}, __dirname+"/views/page.ejs")
 * 
 * #### A string
 * 
 * If you provide a string, the string will be passed to the admin page template as is.
 * 
 *     admin.adminPage('Page Title', '/content', {iconClass: 'fa fa-file'}, (req, res) => {
 *       return "this is handler content"
 *     })
 * 
 * #### A callback
 * 
 * If you provide a callback, the return should either a string or a Promise for a string.
 * 
 *     admin.adminPage('Page Title', '/function', (req, res) => {
 *       return Promise.resolve('Some text');
 *     })
 * 
 * #### Page Configuration Options
 * 
 * -   **class**: string
 * -   **iconClass**: string
 * -   **nav**: boolean
 * -   **order**: integer
 * 
 * ### Admin Routes
 * 
 * #### A handler function
 * 
 *     admin.adminRoute('get', '/redirect', (req, res) => {
 *       res.redirect('/admin')
 *     })
 *
 * ## Actions
 *
 * The Admin UI provides a set of convenience functions for defining administrative actions for models and model instances.
 * 
 * ### Instance Actions
 *
 * Use the `instanceAction` gatherer to define actions that relate to a specific instance. For example, `view` could defined as:
 *
 *    this.admin.instanceAction(this.model(), 'view', 'view', {iconClass:"fa fa-eye", suffixName: true})
 *
 * **Default Instance Actions**
 *
 * The Admin UI module provides the 'Edit' and 'Delete' instance action for you automatically.
 * 
 * ### Model Actions
 *
 * Use model actions to do something that applys to the entire class, or no specific instance.
 *
 *    this.admin.modelAction(this.model(), 'Delete All', 'deleteall', {iconClass:"fa fa-remove", suffixName: true})
 *
 * **Default Model Actions**
 * 
 * The Admin UI module provides the 'Create' model action for you automatically.
 * 
 * ## Model View helpers
 * 
 * The module provides a helper for generating list/detail views from a model:
 * 
 *     app.get('admin-ui').adminModel('user', {base: '/users', titleField: 'email'})
 * 
 * You may pass in an options object, as in this example, or subclass of ViewBase, or a string path to a subclass of ViewBase.
 * 
 *     import {AdminBase} from '@nxus/admin-ui'
 * 
 *     class UserView extends AdminBase {
 *       model() {
 *         return 'user'
 *       }
 *       base() {
 *         return '/users'
 *       }
 *       titleField() {
 *         return 'email
 *       }
 *     }
 * 
 *     app.get('admin-ui').adminModel(UserView)
 *     
 * ### Customizing
 * 
 * If you want to provide your own 404 or 500 page, define the relevant new template. Base-ui will use these to handle the routes above.
 * 
 * #### List and Detail View
 *
 * You can specify your own list view template to use instead of the default. The base-ui module looks for a template matching the following 
 * pattern: `admin-<model>-list` and `admin-<model>-detail`.
 *
 * Each template will be passed either a model instance (for detail view) or an array of models (for list view), using the model name.
 *
 * So using the examples above:
 *
 * ```
 * app.get('templater').templateFunction('admin-user-list', (opts) => {
 *   return app.get('renderer').render("ejs", "<% users.forEach(function(user){ .... }) %>", opts)
 * })
 * 
 * app.get('templater').template('admin-user-detail', 'ejs', () => {
 *   return app.get('renderer').render("ejs", "Email: <%= user.email %>", opts)
 * })
 * ```
 * @example
 *
 * app.get('admin-ui')
 * 
 * # API
 * ----- 
 * 
 */
class AdminUI {
  constructor(app) {
    this.app = app
    this.pages = {}
    this.nav = []
    this.modelActions = {'*': []}
    this.instanceActions = {'*': []}
    this.opts = Object.assign(defaultOpts, this.app.config.adminUI)

    this.users = this.app.get('users')
    this.router = this.app.get('router')
    this.renderer = this.app.get('renderer')
    this.templater = this.app.get('templater')

    this.app.get('admin-ui').use(this)
      .gather('adminPage')
      .gather('adminRoute')
      .gather('adminModel')
      .gather('modelAction')
      .gather('instanceAction')
      .respond('getModelActions')
      .respond('getInstanceActions')

    this._setupRoutes()

    this._addDefaultRoute()
  }

  _setupRoutes() {
    this.users.protectedRoute(this.opts.basePath)
    this.users.protectedRoute(this.opts.basePath+'/*')

    if(this.opts.limitToAdmin) {
      this.users.ensureAdmin(this.opts.basePath)
      this.users.ensureAdmin(this.opts.basePath+'/*')
    }
  }

  _addDefaultRoute() {
    this.app.log.debug('adding admin route')
    this.default().adminPage("Home", '', {nav: false}, (req, res) => {
      return "Welcome to Nxus Admin!"
    })
  }

  /**
   * Register an action for the model list page
   * @param {String} model The model identity to include this action, or '*'
   * @param {String} label The button label for this action
   * @param {String} subURL The url for this action (register this as an adminPage separately)
   * @param {object} opts  Additional options: class, iconClass, suffixName
   */
  modelAction(model, label, subURL, opts) {
    if (!this.modelActions[model]) {
      this.modelActions[model] = []
    }
    let action = Object.assign({label, subURL}, opts)
    this.modelActions[model].push(action)
  }

  /**
   * Register an action for the model detail page
   * @param {String} model The model identity to include this action, or '*'
   * @param {String} label The button label for this action
   * @param {String} subURL The url for this action (register this as an adminPage separately)
   * @param {object} opts  Additional options: class, iconClass, suffixName
   */
  instanceAction(model, label, subURL, opts) {
    if (!this.instanceActions[model]) {
      this.instanceActions[model] = []
    }
    let action = Object.assign({label, subURL}, opts)
    this.instanceActions[model].push(action)
  }

  /**
   * Get the registered actions for model
   * @param {String} model The model identity
   */
  getModelActions(model) {
    return _.compact([].concat(this.modelActions['*'], this.modelActions[model]))
  }

  /**
   * Get the registered actions for model instances
   * @param {String} model The model identity
   */
  getInstanceActions(model) {
    return _.compact([].concat(this.instanceActions['*'], this.instanceActions[model]))
  }
  
  /**
   * Register a page for inclusion in the admin site and navigation 
   *  Page template will receive (and can set in opts):
   *   - class: string
   *   - iconClass: string
   *   - nav: boolean
   *   - order: integer
   * @param {String} title The title of the page, and navigation link
   * @param {String} path  The url path for the page
   * @param {object} opts  Additional options for the rendering of this page
   * @param {string|template-partial|function} handler for rendering this page
   */
  adminPage(title, path, opts, handler) {
    if(!handler) {
      handler = opts
      opts = {}
    }
    if(path[0] != "/") path = "/"+path
    path = this.opts.basePath+path
    this.app.log('registering admin page', path)
    this.pages[path] = {title, handler, opts}
    this.router.route('get', path, this._renderPage.bind(this))
    if(opts && opts.nav != false) this.nav.push({title, path, opts})
  }

  /**
   * Register a raw route for inclusion in the admin site
   * @param {String} method The HTTP method to handle
   * @param {String} path  The url path for the page
   * @param {function} handler for rendering this page
   */
  adminRoute(method, path, handler) {
    if(!handler) {
      handler = path
      path = method
      method = 'post'
    }
    if(path[0] != "/") path = "/"+path
    path = this.opts.basePath+path
    this.app.log('registering admin route', path)
    //this.pages[path] = {handler}
    this.router.route(method, path, handler)
  }

  /**
   * Creates a CRUD UI for the specified model, including all routes and views.  You can pass in the following combinations:
   *   1. a model name and opts hash.
   *   1. a path to a file which is a subclass of AdminBase
   *   1. a class which is a subclass of AdminBase
   *
   * Routes created are:
   *   * `/admin/<base>`: list page 
   *   * `/admin/<base>/create`: create new instance 
   *   * `/admin/<base>/edit/:id`: edit existing instance 
   *   * `/admin/<base>/destroy/:id`: destroy existing instance 
   *
   * Views which can be overriden are:
   *   * `admin-<model>-form`: the create/edit form
   *   * `admin-<model>-list`: the list page view
   * 
   * The generated form for edit/create currently handles simple types (string, float, boolean, etc) and foreign key fields as a dropdown of all the related models.
   * 
   * Options available are:
   *   * `base`: the url at which the CRUD paths are created. For example, '/users'.
   *   * `iconClass`: the icon class to use in the Nav. Used in <i> tag.
   *   * `templatePrefix`: a custom prefix for generated templates. Defaults to `admin-<model>`.
   *   * `ignore`: an array of model fields to ignore in the UI. Defaults to `['id', 'createdAt', 'updatedAt']`
   *   * `templateDir`: a directory containing the list/form templates for the model. Defaults to none.
   *   * `displayName`: an alternate name to use for the display in the Admin UI. Defaults to `model`.
   *   
   * @param  {string|class} model Can either be a model name, a path to a file or an AdminBase Subclass.
   * @param  {Object} opts  An options hash, wich is used to configure the CRUD UI.
   */
  adminModel(model, opts={}) {
    var adminModel;
    opts = _.extend({}, opts, this.opts)
    if(_.isString(model) && model.indexOf(path.sep) == -1) {
      this.app.log.debug('Loading admin model', model)
      opts.model = model
      adminModel = new AdminBase(this.app, opts)
    } else if(_.isString(model) && model.indexOf(path.sep) > -1) {
      if(fs.existsSync(model)) {
        this.app.log.debug('Loading admin model file at', model)
        model = require(model);
        if(model.default) model = model.default
        adminModel = new model(this.app, opts)
      } else
        throw new Error('Class path '+model+' is not a valid file')
    } else if(_.isFunction(model)) {
      adminModel = new model(this.app, opts)
    }
  }

  _renderPage(req, res) {
    let route = req.route ? req.route.path : req.originalUrl
    if(!this.pages[route] || !this.pages[route].handler) return this.app.log.debug('No matching route', route)
    this.app.log.debug('Rendering admin route', route)
    let handler = this.pages[route].handler
    let title = this.pages[route].title
    let nav = this._getNav();
    
    if(typeof handler == 'string') {
      return this.templater.render(handler, {title, nav, opts: this.app.config, base: this.opts.basePath, req}).then(res.send.bind(res));
    } else {
      return Promise.try(() => { return handler(req, res)}).then((content) => {
        if (!content) return
        let opts = {
          title,
          nav,
          content,
          opts: this.app.config,
          base: this.opts.basePath,
          req
        }
        let template = this.opts.adminTemplate
        if (content.template) {
          opts.template = this.opts.adminTemplate
          template = content.template
          opts = Object.assign(opts, content.opts)
        }
        return this.templater.render(template, opts).then(res.send.bind(res))
        
      }).catch((e) => {
        console.log('Caught error rendering admin handler', e, e.stack)
      })
    }
  }

  _getNav() {
    let i = 0
    return _.sortBy(this.nav, (n) => {
      if(n.opts && n.opts.order) return n.opts.order
      i++;
      return i;
    })
  }
}

export default AdminUI
