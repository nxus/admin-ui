/* 
* @Author: Mike Reich
* @Date:   2016-02-05 15:38:26
* @Last Modified 2016-02-05
*/

'use strict';

import {HasModels} from '@nxus/storage'
import pluralize from 'pluralize'

export default class AdminBase extends HasModels {

  constructor(app) {
    super(app)
    this.app = app
    this.router = app.get('router')
    this.admin = app.get('admin-ui')
    this.templater = app.get('templater')
    this.base = this.base_url()
    this.prefix = this.template_prefix()
    this.populate = this.model_populate()

    this.templater.provide('templateDir', 'ejs', this.template_dir(), this.prefix)
    this.admin.provide('adminPage', pluralize(this.display_name()), this.base, {iconClass: 'fa fa-users'}, this._list.bind(this))
    this.admin.provide('adminPage', 'New '+this.display_name(), this.base+'/new', {nav: false}, this._new.bind(this))
    this.admin.provide('adminPage', 'Edit '+this.display_name(), this.base+'/edit/:id', {nav: false}, this._edit.bind(this)) 
    this.admin.provide('adminRoute', 'get', this.base+'/delete/:id', this._delete.bind(this))
    this.admin.provide('adminRoute', this.base+'/save', this.save.bind(this))
  }

  /**
   * Define the base URL for this admin module
   * @return {string} 
   */
  base_url () {
    throw this.constructor.name+".base_url not implemented"
  }

  /**
   * Define the primary model for this admin module
   * @return {string} 
   */
  model_id () {
    throw this.constructor.name+".model_id not implemented"
  }

  /**
   * Render the display name for the model
   * @return {string} 
   */
  display_name () {
    var name = this.model_id()
    name = name[0].toUpperCase()+name.slice(1, name.length);
    return name;
  }

  /**
   * Define any populated relationships for the model
   * @return {array} 
   */
  model_populate () {
    return null
  }
  
  /**
   * Define the template dir - needs to be implemented for local __dirname
   * @return {string} 
   */
  template_dir () {
    throw this.constructor.name+".template_dir not implemented"
  }

  /**
   * Define the template prefix for this admin module
   * @return {string} 
   */
  template_prefix () {
    return "admin-"+pluralize(this.display_name()).toLowerCase()
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
      return this.templater.request('renderPartial', this.prefix+'-list', 'default', {
        req,
        base: req.adminOpts.basePath+this.base,
        user: req.user,
        title: 'All '+this.constructor.name,
        insts
      });
    })
  }

  _edit (req, res) {
    let find = this.models.model.findOne().where(req.params.id)
    if (this.populate) {
      find = find.populate(...this.populate)
    }
    return find.then((inst) => {
      return this.templater.request('renderPartial', this.prefix+'-form', 'default', {
        req,
        base: req.adminOpts.basePath+this.base,
        user: req.user,
        title: 'Edit '+this.constructor.name,
        inst
      })
    })
  }

  _new (req, res) {
    let inst = {}
    if(this.populate && this.populate.length > 0) 
      for (let pop of this.populate) inst[pop] = {}
    return this.templater.request('renderPartial', this.prefix+'-form', 'default', {
      req,
      base: req.adminOpts.basePath+this.base,
      user: req.user,
      title: 'New '+this.constructor.name,
      inst
    })
  }

  _delete (req, res) {
    return this.models.model.destroy(req.params.id).then((inst) => {
      req.flash('info', this.display_name()+' deleted');
      res.redirect(req.adminOpts.basePath+this.base)
    })
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

    promise.then((u) => {req.flash('info', this.display_name()+' created');; res.redirect(req.adminOpts.basePath+this.base)})
  }
}