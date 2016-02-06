/* 
* @Author: Mike Reich
* @Date:   2016-02-04 18:40:18
* @Last Modified 2016-02-05
*/

'use strict';

import Promise from 'bluebird'
import fs from 'fs'

import adminBase from './adminBase'

const defaultOpts = {
  basePath: '/admin',
  adminTemplate: 'admin'
}

export var AdminBase = adminBase

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

    this.app.get('admin-ui').gather('adminPage', this._registerPage.bind(this))
    this.app.get('admin-ui').gather('adminRoute', this._registerRoute.bind(this))

    this._setupRoutes()
  }

  _setupRoutes() {
    this.users.provide('protectedRoute', this.opts.basePath)
    this.users.provide('protectedRoute', this.opts.basePath+'/*')

    this.router.provide('route', 'GET', this.opts.basePath, (req, res) => {
      let content = "Welcome to the Nxus admin page";
      this.app.get('templater').request('render', this.opts.adminTemplate, {nav: this.nav, content, opts: this.app.config}).then(res.send.bind(res));
    })

    this.router.provide('middleware', 'use', this.opts.basePath+"/*", (req, res, next) => {
      req.adminOpts = this.opts;
      next()
    })
  }

  _registerPage(title, path, opts, handler) {
    if(!handler) {
      handler = opts
      opts = {}
    }
    if(path[0] != "/") path = "/"+path
    path = this.opts.basePath+path
    this.app.log('registering admin page', path)
    this.pages[path] = {title, handler, opts}
    this.router.provide('route', 'get', path, this._renderPage.bind(this))
    if(opts && opts.nav != false) this.nav.push({title, path, opts})
  }

  _registerRoute(method, path, handler) {
    if(!handler) {
      handler = path
      path = method
      method = 'post'
    }
    if(path[0] != "/") path = "/"+path
    this.app.log('registering admin page', path)
    path = this.opts.basePath+path
    this.pages[path] = {handler}
    this.router.provide('route', method, path, handler)
  }

  _renderPage(req, res) {
    let route = req.route ? req.route.path : req.originalUrl
    console.log('route', req.route)
    if(!this.pages[route] || !this.pages[route].handler) return
    let handler = this.pages[route].handler
    let title = this.pages[route].title
    
    if(typeof handler == 'string') {
      if(fs.existsSync(handler)) {
        return this.templater.request("renderPartial", handler, this.opts.adminTemplate, {title, nav: this.nav, opts: this.app.config}).then(res.send.bind(res));
      }
      return this.templater.request("render", this.opts.adminTemplate, {title, nav: this.nav, content: handler, opts: this.app.config}).then(res.send.bind(res));
    } else {
      return Promise.resolve(handler(req, res)).then((content) => {
        if(content) this.templater.request("render", this.opts.adminTemplate, {title, nav: this.nav, content, opts: this.app.config}).then(res.send.bind(res));
      }).catch((e) => {
        this.app.log('Caught error rendering admin handler', e)
      })
    }
  }
}