/* 
* @Author: Mike Reich
* @Date:   2016-02-05 15:38:26
* @Last Modified 2016-02-16
*/

'use strict';

import {HasModels} from '@nxus/storage'
import pluralize from 'pluralize'
import capitalize from 'capitalize'
import _ from 'underscore'
import morph from 'morph'

/**
 * The AdminBase class provides a set of helper CRUD classes for defining Admin-UI based admin pages.
 */
export default class AdminBase extends HasModels {
  constructor(app, opts={}) {
    super(app)

    this.app = app
    this.opts = opts
    this.admin = app.get('admin-ui')
    this.templater = app.get('templater')

    if(this.templateDir())
      this.templater.templateDir('ejs', this.templateDir(), this.prefix)

    this.admin.adminPage(pluralize(this.displayName()), this.base(), {iconClass: this.iconClass()}, this.list.bind(this))
    this.admin.adminPage('New '+this.displayName(), this.base()+'/create', {nav: false}, this.create.bind(this))
    this.admin.adminPage('Edit '+this.displayName(), this.base()+'/edit/:id', {nav: false}, this.edit.bind(this)) 
    this.admin.adminRoute('get', this.base()+'/remove/:id', this.remove.bind(this))
    this.admin.adminRoute('post', this.base()+'/save', this.save.bind(this))

    this.app.log.debug('registering template', this.templatePrefix()+'-list')
    this.templater.template(this.templatePrefix()+'-list', 'ejs', __dirname+"/../views/list.ejs")
    this.templater.template(this.templatePrefix()+'-form', 'ejs', __dirname+"/../views/form.ejs")
  }

  ignore() {
    return this.opts.ignore || ['id', 'createdAt', 'updatedAt']
  }

  base() {
   return this.opts.base || "/"+pluralize(this.model())
  }

  prefix() {
    return this.opts.prefix || this.model()
  }

  iconClass() {
    return this.opts.iconClass || "fa fa-file"
  }

  templateDir() {
    return null
  }

  templatePrefix() {
    return this.opts.templatePrefix || "admin-"+this.displayName().toLowerCase()
  }

  displayName() {
    return this.opts.displayName || capitalize(this.model())
  }

  /**
   * Define the primary model for this admin module
   * @return {string} 
   */
  model() {
    if(!this.opts.model) throw new Error(this.constructor.name+".model() not defined")
    return this.opts.model
  }

  /**
   * Define any populated relationships for the model
   * @return {array} 
   */
  model_populate () {
    return this.opts.modelPopulate
  }

  model_names () {
    let ret = {}
    ret[this.model()] = 'model'
    return ret;
  }
  
  _list (req, res) {
    let find = this.models.model.find().where({})
    if (this.populate) {
      find = find.populate(...this.populate)
    }
    return find.then((insts) => {
      return this.templater.render(this.templatePrefix()+'-list', {
        req,
        base: req.adminOpts.basePath+this.base(),
        user: req.user,
        title: 'All '+this.constructor.name,
        insts,
        name: this.displayName(),
        attributes: this._getAttrs(this.models.model)
      });
    }).catch((e) => {console.log('caught on find', e)})
  }

  _edit (req, res) {
    let find = this.models.model.findOne().where(req.params.id)
    if (this.populate) {
      find = find.populate(...this.populate)
    }
    return find.then((inst) => {
      return this.templater.render(this.templatePrefix()+'-form', {
        req,
        base: req.adminOpts.basePath+this.base(),
        user: req.user,
        title: 'Edit '+this.constructor.name,
        inst,
        name: this.displayName(),
        attributes: this._getAttrs(this.models.model)
      })
    })
  }

  _create (req, res) {
    let inst = {}
    if(this.populate && this.populate.length > 0) 
      for (let pop of this.populate) inst[pop] = {}
    return this.templater.render(this.templatePrefix()+'-form', {
      req,
      base: req.adminOpts.basePath+this.base(),
      user: req.user,
      title: 'New '+this.constructor.name,
      inst,
      name: this.displayName(),
      attributes: this._getAttrs(this.models.model)
    })
  }

  _remove (req, res) {
    return this.models.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName()+' deleted');
      res.redirect(req.adminOpts.basePath+this.base())
    })
  }

  remove(req, res) {
    return this._remove(req, res)
  }

  create(req, res) {
    return this._create(req, res)
  }

  edit(req, res) {
    return this._edit(req, res)
  }

  list(req, res) {
    return this._list(req, res)
  }

  save (req, res) {
    return this._save(req, res)
  }

  _save (req, res, values) {
    if (values === undefined) {
      values = req.body
    }
    let promise = values.id
      ? this.models.model.update(values.id, values)
      : this.models.model.create(values)

    promise.then((u) => {req.flash('info', this.displayName()+' created'); res.redirect(req.adminOpts.basePath+this.base())})
  }

  _getAttrs(model) {
    let ignore = this.ignore()
    let ignoreType = ['objectId']
    return _(model._attributes)
    .keys()
    .map((k) => {let ret = model._attributes[k]; ret.name = k; if(!ret.label) ret.label = this._sanitizeName(k); return ret})
    .filter((k) => {
      let ret = _(ignore).contains(k.name) 
      if(!ret) ret = _(ignoreType).contains(k.type)
      return !ret
    })
  }

  _sanitizeName(string) {
    return morph.toTitle(string)
  }
}
