/* 
* @Author: Mike Reich
* @Date:   2016-02-04 18:40:18
* @Last Modified 2016-02-15
*/

'use strict';

import Promise from 'bluebird'
import fs from 'fs'
import _ from 'underscore'
import pluralize from 'pluralize'
import capitalize from 'capitalize'

import AdminBase from './adminBase'

const defaultOpts = {
  basePath: '/admin',
  adminTemplate: 'admin'
}

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

  adminRoute(method, path, handler) {
    if(!handler) {
      handler = path
      path = method
      method = 'post'
    }
    if(path[0] != "/") path = "/"+path
    this.app.log('registering admin page', path)
    path = this.opts.basePath+path
    this.pages[path] = {handler}
    this.router.route(method, path, handler)
  }

  adminModel(model, opts={}) {
    this.app.log.debug('Setting admin crud', model, opts)
    opts.model = model
    opts.base = opts.base || "/"+pluralize(model)
    opts.prefix = opts.prefix || model
    opts.display_name = opts.display_name || capitalize(model)

    new AdminBase(this.app, opts)
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
