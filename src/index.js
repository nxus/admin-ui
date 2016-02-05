/* 
* @Author: Mike Reich
* @Date:   2016-02-04 18:40:18
* @Last Modified 2016-02-04
*/

'use strict';

import Promise from 'bluebird'
import fs from 'fs'

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

    this.app.get('admin-ui').gather('adminPage', this._registerPage.bind(this))

    this._setupRoutes()
  }

  _setupRoutes() {
    this.users.provide('protectedRoute', this.opts.basePath)
    this.users.provide('protectedRoute', this.opts.basePath+'/*')

    this.router.provide('route', 'GET', this.opts.basePath, (req, res) => {
      let content = "Hello Admin";
      this.app.get('templater').request('render', this.opts.adminTemplate, {nav: this.nav, content, opts: this.app.config}).then(res.send.bind(res));
    })
  }

  _registerPage(title, path, opts, handler) {
    if(!handler) {
      handler = opts
      opts = {}
    }
    if(path[0] != "/") path = "/"+path
    path = this.opts.basePath+path
    console.log('registering admin route', path)
    this.pages[path] = {title, handler, opts}
    this.router.provide('route', path, this._renderPage.bind(this))
    this.nav.push({title, path, opts})
  }

  _renderPage(req, res, next) {
    let route = req.route ? req.route.path : req.originalUrl
    console.log('route', route)
    let handler = this.pages[route].handler
    if(!handler) return next()
    console.log('handler', handler)
    if(typeof handler == 'string') {
      if(fs.existsSync(handler)) {
        return this.templater.request("renderPartial", handler, this.opts.adminTemplate, {nav: this.nav, opts: this.app.config}).then(res.send.bind(res));
      }
      return this.templater.request("render", this.opts.adminTemplate, {nav: this.nav, content: handler, opts: this.app.config}).then(res.send.bind(res));
    } else {
      return Promise.resolve(handler(req, res)).then((content) => {
        if(content) this.templater.request("render", this.opts.adminTemplate, {nav: this.nav, content, opts: this.app.config}).then(res.send.bind(res));
        else return next()
      })
    }
  }
}