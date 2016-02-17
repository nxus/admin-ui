/* 
* @Author: Mike Reich
* @Date:   2016-02-04 18:40:18
* @Last Modified 2016-02-17
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
  adminTemplate: 'admin'
}

/**
 * The AdminUI module provides default templates and nav for an administrative section of your site.
 *  If the @nxus/users module is installed, the admin section will require admin-level authentication.
 * @example Configuration (defaults):
 *  {adminUI: {
 *    basePath: '/admin',    # urls registered for admin will start with this path
 *    adminTemplate: 'admin' # name of the main admin template to use
 *  }}
 */
export default class AdminUI {
  constructor(app) {
    this.app = app
    this.pages = {}
    this.nav = []
    this.opts = Object.assign(defaultOpts, this.app.config.adminUI)

    this.users = this.app.get('users')
    this.router = this.app.get('router')
    this.renderer = this.app.get('renderer')
    this.templater = this.app.get('templater')

    this.app.get('admin-ui').use(this)
      .gather('adminPage')
      .gather('adminRoute')
      .gather('adminModel')

    this._setupRoutes()

    this._addDefaultRoute()
  }

  _setupRoutes() {
    this.users.protectedRoute(this.opts.basePath)
    this.users.protectedRoute(this.opts.basePath+'/*')

    this.router.middleware('use', this.opts.basePath+"/*", (req, res, next) => {
      req.adminOpts = this.opts;
      next()
    })
  }

  _addDefaultRoute() {
    this.app.log('adding admin route')
    this.provideBefore('adminPage', "Home", '', {nav: false}, (req, res) => {
      return "Welcome to Nxus Admin!"
    })
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
   * @e
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
    this.pages[path] = {handler}
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
    if(_.isString(model) && model.indexOf(path.sep) == -1) {
      this.app.log.debug('Loading admin model', model)
      opts.model = model
      adminModel = new AdminBase(this.app, opts)
    } else if(_.isString(model) && model.indexOf(path.sep) > -1) {
      if(fs.existsSync(model)) {
        this.app.log.debug('Loading admin model file at', model)
        model = require(model);
        adminModel = new model(this.app)
      } else
        throw new Error('Class path '+model+' is not a valid file')
    } else if(_.isFunction(model)) {
      adminModel = new model(this.app)
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
      if(fs.existsSync(handler)) {
        return this.templater.renderPartial(handler, this.opts.adminTemplate, {title, nav, opts: this.app.config}).then(res.send.bind(res));
      }
      return this.templater.render(this.opts.adminTemplate, {title, nav, content: handler, opts: this.app.config}).then(res.send.bind(res));
    } else {
      return Promise.try(() => { return handler(req, res)}).then((content) => {
        return this.templater.render(this.opts.adminTemplate, {title, nav, content, opts: this.app.config}).then(res.send.bind(res))
      }).catch((e) => {
        console.log('Caught error rendering admin handler', e, e.stack)
      })
    }
  }

  _getNav() {
    return _.sortBy(this.nav, (n) => {
      if(n.opts && n.opts.order) return n.opts.order
      return 10000000;
    })
  }
}
