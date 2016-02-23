/* 
* @Author: Mike Reich
* @Date:   2016-02-05 15:38:26
* @Last Modified 2016-02-20
*/

'use strict';

import {HasModels} from '@nxus/storage'
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
    
    if(this.templateDir())
      this.templater.templateDir('ejs', this.templateDir(), this.templatePrefix())

    this.admin.adminPage(pluralize(this.displayName()), this.base(), {iconClass: this.iconClass()}, this.list.bind(this))
    this.admin.adminPage('New '+this.displayName(), this.base()+'/create', {nav: false}, this.create.bind(this))
    this.admin.adminPage('Edit '+this.displayName(), this.base()+'/edit/:id', {nav: false}, this.edit.bind(this)) 
    this.admin.adminRoute('get', this.base()+'/remove/:id', this.remove.bind(this))
    this.admin.adminRoute('post', this.base()+'/save', this.save.bind(this))

    this.templater.provideBefore('template', this.templatePrefix()+'-list', 'ejs', __dirname+"/../views/list.ejs")
    this.templater.provideBefore('template', this.templatePrefix()+'-form', 'ejs', __dirname+"/../views/form.ejs")
  }

  /**
   * Fields in the model to ignore in the UI
   * @return {string}
   */
  ignore() {
    return this.opts.ignore || ['id', 'createdAt', 'updatedAt']
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

  model_names () {
    let ret = {}
    ret[this.model()] = this.model()
    return ret;
  }
  
  _list (req, res, opts = {}) {
    let find = this.models[this.model()].find().where({})
    if (this.populate) {
      find = find.populate(...this.populate)
    }
    return Promise.all([
      find,
      this._getAttrs(this.models[this.model()], false)
    ]).spread((insts, attributes) => {
      opts = _.extend({
        req,
        base: req.adminOpts.basePath+this.base(),
        title: 'All '+this.constructor.name,
        name: this.displayName(),
        insts,
        attributes: attributes
      }, opts)
      if(!opts[pluralize(this.model())]) opts[pluralize(this.model())] = insts
      else opts.insts = opts[pluralize(this.model())]
      return this.templater.render(this.templatePrefix()+'-list', opts);
    }).catch((e) => {console.log('caught on find', e)})
  }

  _edit (req, res, opts = {}) {
    let find = this.models[this.model()].findOne().where(req.params.id)
    if (this.populate) {
      find = find.populate(...this.populate)
    }
    return Promise.all([
      find,
      this._getAttrs(this.models[this.model()])
    ]).spread((inst, attributes) => {
      opts = _.extend({
        req,
        base: req.adminOpts.basePath+this.base(),
        title: 'Edit '+this.constructor.name,
        inst,
        name: this.displayName(),
        attributes: attributes
      }, opts)
      if(!opts[this.model()]) opts[this.model()] = inst
      else opts.inst = opts[this.model()]
      return this.templater.render(this.templatePrefix()+'-form', opts)
    })
  }

  _create (req, res, opts = {}) {
    let inst = {}
    if(this.populate && this.populate.length > 0) 
      for (let pop of this.populate) inst[pop] = {}
    return Promise.all([
      this._getAttrs(this.models[this.model()])
    ]).spread((attributes) => {
      opts = _.extend({
        req,
        base: req.adminOpts.basePath+this.base(),
        title: 'New '+this.constructor.name,
        inst,
        name: this.displayName(),
        attributes: attributes
      }, opts)
      if(!opts[this.model()]) opts[this.model()] = inst
      else opts.inst = opts[this.model()]
      return this.templater.render(this.templatePrefix()+'-form', opts)
    })      
  }

  _remove (req, res, opts = {}) {
    return this.models[this.model()].destroy(req.params.id).then((inst) => {
      req.flash('info', this.displayName()+' deleted');
      res.redirect(req.adminOpts.basePath+this.base())
    })
  }

  remove(req, res, opts = {}) {
    return this._remove(req, res, opts)
  }

  create(req, res, opts = {}) {
    return this._create(req, res, opts)
  }

  edit(req, res, opts = {}) {
    return this._edit(req, res, opts)
  }

  list(req, res, opts = {}) {
    return this._list(req, res, opts)
  }

  save (req, res, opts = {}) {
    return this._save(req, res, opts)
  }

  _save (req, res, opts = {}) {
    let values
    if (opts[this.model()] === undefined)
      values = req.body
    else
      values = opts[this.model()]
    let promise = values.id
      ? this.models[this.model()].update(values.id, values)
      : this.models[this.model()].create(values)

    promise.then((u) => {req.flash('info', this.displayName()+' created'); res.redirect(req.adminOpts.basePath+this.base())})
  }

  _getAttrs(model, withRelated=true) {
    let ignore = this.ignore()
    let ignoreType = ['objectId']
    let related = []
    let attrs = _(model._attributes)
    .keys()
    .map((k, i) => {
      let ret = model._attributes[k]
      ret.name = k
      if(!ret.label) ret.label = this._sanitizeName(k)
      if(ret.model) {
        ret.type = 'related'
        related.push(ret)
      }
      return ret
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
        }).then((rel_insts) => {
          rel.instances = rel_insts
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
