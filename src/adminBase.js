/* 
* @Author: Mike Reich
* @Date:   2016-02-05 15:38:26
* @Last Modified 2016-02-15
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

  constructor(app, opts) {
    const _adminModelOpts = {
      iconClass: "fa fa-file"
    }

    super(app)

    opts = _(_adminModelOpts).extend(opts)

    this.app = app
    this.opts = opts
    this.admin = app.get('admin-ui')
    this.templater = app.get('templater')
    this.opts.template_prefix = "admin-"+this.opts.display_name.toLowerCase()

    if(opts.template_dir)
      this.templater.templateDir('ejs', opts.template_dir, opts.prefix)

    this.admin.adminPage(pluralize(opts.display_name), opts.base, {iconClass: opts.iconClass}, this._list.bind(this))
    this.admin.adminPage('New '+opts.display_name, opts.base+'/new', {nav: false}, this._new.bind(this))
    this.admin.adminPage('Edit '+opts.display_name, opts.base+'/edit/:id', {nav: false}, this._edit.bind(this)) 
    this.admin.adminRoute('get', opts.base+'/delete/:id', this._delete.bind(this))
    this.admin.adminRoute('post', opts.base+'/save', this.save.bind(this))

    this.app.log.debug('registering template', this.opts.template_prefix+'-list')
    this.templater.template(this.opts.template_prefix+'-list', 'ejs', __dirname+"/../views/list.ejs")
    this.templater.template(this.opts.template_prefix+'-form', 'ejs', __dirname+"/../views/form.ejs")
  }

  /**
   * Define the primary model for this admin module
   * @return {string} 
   */
  model_id () {
    return this.opts.model
  }

  /**
   * Define any populated relationships for the model
   * @return {array} 
   */
  model_populate () {
    return this.opts.model_populate
  }

  model_names () {
    let ret = {}
    ret[this.model_id()] = 'model'
    return ret;
  }
  
  _list (req, res) {
    let find = this.models.model.find().where({})
    if (this.populate) {
      find = find.populate(...this.populate)
    }
    return find.then((insts) => {
      return this.templater.render(this.opts.template_prefix+'-list', {
        req,
        base: req.adminOpts.basePath+this.opts.base,
        user: req.user,
        title: 'All '+this.constructor.name,
        insts,
        name: this.opts.display_name,
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
      return this.templater.render(this.opts.template_prefix+'-form', {
        req,
        base: req.adminOpts.basePath+this.opts.base,
        user: req.user,
        title: 'Edit '+this.constructor.name,
        inst,
        name: this.opts.display_name,
        attributes: this._getAttrs(this.models.model)
      })
    })
  }

  _new (req, res) {
    let inst = {}
    if(this.populate && this.populate.length > 0) 
      for (let pop of this.populate) inst[pop] = {}
    return this.templater.render(this.opts.template_prefix+'-form', {
      req,
      base: req.adminOpts.basePath+this.opts.base,
      user: req.user,
      title: 'New '+this.constructor.name,
      inst,
      name: this.opts.display_name,
      attributes: this._getAttrs(this.models.model)
    })
  }

  _delete (req, res) {
    return this.models.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.opts.display_name+' deleted');
      res.redirect(req.adminOpts.basePath+this.base)
    })
  }

  save (req, res) {
    if(this.opts.save) return this.opts.save(req, res, this)
    else return this._save(req, res)
  }

  _save (req, res, values) {
    if (values === undefined) {
      values = req.body
    }
    let promise = values.id
      ? this.models.model.update(values.id, values)
      : this.models.model.create(values)

    promise.then((u) => {req.flash('info', this.opts.display_name+' created');; res.redirect(req.adminOpts.basePath+this.base)})
  }

  _getAttrs(model) {
    let ignore = this.opts.ignore || ['id', 'createdAt', 'updatedAt']
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
