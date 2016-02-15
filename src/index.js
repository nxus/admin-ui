/* 
* @Author: Mike Reich
* @Date:   2016-02-04 18:40:18
* @Last Modified 2016-02-09
*/

'use strict';

import Promise from 'bluebird'
import fs from 'fs'
import _ from 'underscore'

import adminBase from './adminBase'

const defaultOpts = {
  basePath: '/admin',
  adminTemplate: 'admin'
}

export var AdminBase = adminBase
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
    this.provideAfter('adminPage', "Home", '', {iconClass: 'fa fa-home'}, (req, res) => {
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
    this.app.log('registering admin page', path)
    path = this.opts.basePath+path
    this.pages[path] = {handler}
    this.router.route(method, path, handler)
  }

  _renderPage(req, res) {
    let route = req.route ? req.route.path : req.originalUrl
    if(!this.pages[route] || !this.pages[route].handler) return
    let handler = this.pages[route].handler
    let title = this.pages[route].title
    let nav = this._getNav();
    
    if(typeof handler == 'string') {
      if(fs.existsSync(handler)) {
        return this.templater.renderPartial(handler, this.opts.adminTemplate, {title, nav, opts: this.app.config}).then(res.send.bind(res));
      }
      return this.templater.render(this.opts.adminTemplate, {title, nav, content: handler, opts: this.app.config}).then(res.send.bind(res));
    } else {
      return Promise.resolve(handler(req, res)).then((content) => {
        if(content) this.templater.render(this.opts.adminTemplate, {title, nav, content, opts: this.app.config}).then(res.send.bind(res));
      }).catch((e) => {
        this.app.log.error('Caught error rendering admin handler', e)
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
