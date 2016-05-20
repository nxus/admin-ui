/* 
* @Author: Mike Reich
* @Date:   2016-02-05 15:38:26
* @Last Modified 2016-05-20
*/

'use strict';

import {HasModels} from 'nxus-storage'
import pluralize from 'pluralize'
import _ from 'underscore'
import morph from 'morph'
import Promise from 'bluebird'

/**
 * The AdminBase class provides a set of helper CRUD classes for defining Admin-UI based admin pages.
 * 
 * @example class TodoAdmin extends AdminBase {
 *  base () {
 *     return '/todo'
 *   }
 *  model () {
 *     return 'todo'
 *   }
 *  templateDir () {
 *     return __dirname+'/views'
 *   }
 * }
 * 
 */
export default class AdminBase extends HasModels {
  constructor(app, opts={}) {
    super(app)

    this.app = app
    this.opts = opts
    this.admin = app.get('admin-ui')
    this.templater = app.get('templater')
    this.renderer = app.get('renderer')
    
    if(this.templateDir())
      this.templater.templateDir(this.templateDir())

    this.admin.modelAction(this.model(), 'Add', 'create', {iconClass:"fa fa-plus", suffixName: true})
    this.admin.instanceAction(this.model(), 'Edit', 'edit', {iconClass:"fa fa-edit", suffixName: true})
    this.admin.instanceAction(this.model(), 'Remove', 'remove', {iconClass:"fa fa-remove", suffixName: true, displayClass: "delete-confirm"})

    if(this.uploadType()) {
      this.app.get('data-loader').uploadPath(this.opts.basePath+this.base()+"/import", 'file')
      this.admin.adminRoute('POST', this.base()+'/import', this._saveImport.bind(this))
      this.admin.adminPage('Import '+pluralize(this.displayName()), this.base()+'/import', {nav: false}, this._import.bind(this))
      this.templater.default().template(__dirname+"/../views/import.ejs", null, this.templatePrefix()+'-import')
      this.admin.modelAction(this.model(), 'Import', 'import', {iconClass:"fa fa-plus", suffixName: true})
    }
    
    this.admin.adminPage(pluralize(this.displayName()), this.base(), {iconClass: this.iconClass()}, this._list.bind(this))
    this.admin.adminPage('New '+this.displayName(), this.base()+'/create', {nav: false}, this._create.bind(this))
    this.admin.adminPage('Edit '+this.displayName(), this.base()+'/:id/edit', {nav: false}, this._edit.bind(this)) 
    this.admin.adminRoute('get', this.base()+'/:id/remove', this._remove.bind(this))
    this.admin.adminRoute('post', this.base()+'/save', this._save.bind(this))

    this.templater.default().template(__dirname+"/../views/list.ejs", null, this.templatePrefix()+'-list')
    this.templater.default().template(__dirname+"/../views/form.ejs", null, this.templatePrefix()+'-form')
    
  }

  /**
   * Fields in the model to ignore in the UI
   * @return {string}
   */
  ignore() {
    return this.opts.ignore || ['id', 'createdAt', 'updatedAt']
  }

  /**
   * Fields in the model to show
   * @return {array}
   */
  display() {
    return this.opts.display || []
  }

  /**
   * The base url for the Admin CRUD UI. 
   * @return {string} Defaults to `/<models>`
   */
  base() {
   return this.opts.base || "/"+pluralize(this.model())
  }

  /**
   * The class to use for the nav icon.
   * @return {string} Defaults to `fa fa-file`
   */
  iconClass() {
    return this.opts.iconClass || "fa fa-file"
  }

  /**
   * The directory to find the templates.
   * @return {string} Defaults to null.
   */
  templateDir() {
    return null
  }

  /**
   * The prefix to use for the templates. Defaults to `admin-<model>-`
   * @return {string}
   */
  templatePrefix() {
    return this.opts.templatePrefix || "admin-"+morph.toDashed(this.model())
  }

  /**
   * The display name for the model to use in the Admin UI
   * @return {string} Defaults to `<model>`
   */
  displayName() {
    return this.opts.displayName || morph.toTitle(this.model())
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
  modelPopulate () {
    return this.opts.modelPopulate || []
  }

  /**
   * Returns a hash of currently used models.
   * @return {[type]} [description]
   */
  modelNames () {
    let ret = {}
    ret[this.model()] = this.model()
    return ret;
  }

  /**
   * Allow upload of models by this file type
   * @return {string} 
   * @example return 'csv'
   */
  uploadType() {
    return this.opts.uploadType || null
  }
  /**
   * Options for data-loader on upload
   * @return {string}
   * @example return {identityFields: ['name'], mapping: {Name: 'name'}}
   */
  uploadOptions() {
    return this.opts.uploadOptions || {}
  }
  
  _list (req, res, opts = {}) {
    let find = this.models[this.model()].find().where({})
    if (this.modelPopulate() && this.modelPopulate().length > 0) {
      find = find.populate(...this.modelPopulate())
    }
    return Promise.all([
      find,
      this._getAttrs(this.models[this.model()], false),
      this.admin.getModelActions(this.model()),
      this.admin.getInstanceActions(this.model()),
    ]).spread((insts, attributes, actions, instanceActions) => {
      opts = _.extend({
        req,
        base: this.opts.basePath+this.base(),
        title: 'All '+pluralize(this.displayName()),
        name: this.displayName(),
        insts,
        attributes: attributes,
        upload: this.uploadType(),
        actions,
        instanceActions
      }, opts)
      if(!opts[pluralize(this.model())]) opts[pluralize(this.model())] = insts
      else opts.insts = opts[pluralize(this.model())]
      return {template: this.templatePrefix()+'-list', opts}
    }).catch((e) => {this.app.log.error(e)})
  }

  _edit (req, res, opts = {}) {
    let find = this.models[this.model()].findOne().where(req.params.id)
    if (this.modelPopulate() && this.modelPopulate().length > 0) {
      find = find.populate(...this.modelPopulate())
    }
    return Promise.all([
      find,
      this._getAttrs(this.models[this.model()]),
      this.admin.getInstanceActions(this.model())
    ]).spread((inst, attributes, actions) => {
      opts = _.extend({
        req,
        base: this.opts.basePath+this.base(),
        title: 'Edit '+this.displayName(),
        inst,
        name: this.displayName(),
        attributes: attributes,
        actions
      }, opts)
      if(!opts[this.model()]) opts[this.model()] = inst
      else opts.inst = opts[this.model()]
      return {template: this.templatePrefix()+'-form', opts}
    })
  }

  _create (req, res, opts = {}) {
    let inst = {}
    if(this.modelPopulate() && this.modelPopulate().length > 0) 
      for (let pop of this.modelPopulate()) inst[pop] = {}
    return Promise.all([
      this._getAttrs(this.models[this.model()])
    ]).spread((attributes) => {
      opts = _.extend({
        req,
        base: this.opts.basePath+this.base(),
        title: 'New '+this.displayName(),
        inst,
        name: this.displayName(),
        attributes: attributes
      }, opts)
      if(!opts[this.model()]) opts[this.model()] = inst
      else opts.inst = opts[this.model()]
      return {template: this.templatePrefix()+'-form', opts}
    })      
  }

  _remove (req, res, opts = {}) {
    return this.models[this.model()].destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName()+' deleted');
      res.redirect(this.opts.basePath+this.base())
    })
  }

  _save (req, res, opts = {}) {
    let values
    if (opts[this.model()] === undefined)
      values = req.body
    else
      values = opts[this.model()]

    let attrs = this._getAttrs(this.models[this.model()], false)

    attrs.forEach((attr) => {
      if(attr.type == 'boolean') values[attr.name] = (typeof values[attr.name] != 'undefined')
      try {
        if(attr.type == 'json' || attr.type == 'mixed') values[attr.name] = JSON.parse(values[attr.name])
      } catch (e) {
        delete values[attr.name]
      }
    })

    let promise = values.id
      ? this.models[this.model()].update(values.id, values)
      : this.models[this.model()].create(values)

    promise.then((u) => {
      req.flash('info', this.displayName()+' saved')
      res.redirect(this.opts.basePath+this.base())
    }).catch((e) => {
      this.app.log.error(e)
      req.flash('error', 'Error saving '+this.displayName()+': '+e)
      if(values.id)
        res.redirect(this.opts.basePath+this.base()+"/"+values.id+"/edit")
      else
        res.redirect(this.opts.basePath+this.base()+"/create")
    })
  }

  _import (req, res) {
    let opts = {
      base: this.opts.basePath+this.base(),
      name: this.displayName(),
      upload: this.uploadType()
    }
    return this.templater.render(this.templatePrefix()+'-import', opts)
  }
  
  _saveImport (req, res) {
    let opts = this.uploadOptions()
    opts.type = this.uploadType()
    this.app.get('data-loader').importFileToModel(this.model(), req.file.path, opts)
      .then((insts) => {
        req.flash('info', 'Imported '+insts.length+ ' '+pluralize(this.displayName()))
        res.redirect(this.opts.basePath+this.base())
      })
  }

  _getAttrs(model, withRelated=true) {
    let ignore = this.ignore()
    let display = this.display()
    let ignoreType = ['objectId']
    let related = []
    let attrs = _(model._attributes)
    .keys()
    .map((k, i) => {
      let ret = model._attributes[k]
      ret.name = k
      if(!ret.label) ret.label = this._sanitizeName(k)
      if(ret.enum) {
        ret.type = 'enum'
        ret.opts = ret.enum
      }
      if(ret.model) {
        ret.type = 'related'
        related.push(ret)
      }
      return ret
    })    
    .filter((k) => {
      if(display.length > 0)
        return _(display).contains(k.name)
      else
        return true
    })
    .filter((k) => {
      let ret = _(ignore).contains(k.name) 
      if(!ret) ret = _(ignoreType).contains(k.type)
      return !ret
    })
    if (!withRelated || _.isEmpty(related)) {
      return attrs
    } else {
      return Promise.map(related, (rel) => {
        return this.app.get('storage').getModel(rel.model).then((m) => {
          return m.find()
        }).then((relInsts) => {
          rel.instances = relInsts
        })
      }).then(() => {
        return attrs
      })
    }
  }

  _sanitizeName(string) {
    return morph.toTitle(string)
  }
}
