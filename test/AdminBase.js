'use strict';

import AdminBase from '../src/adminBase'

import TestApp from '@nxus/core/lib/test/support/TestApp';

class AdminTest extends AdminBase {
  base_url () {
    return "/test"
  }
  model_id () {
    return 'test_model'
  }
  template_dir () {
    return './views'
  }
}

describe("AdminBase", () => {
  var module;
  var app = new TestApp();
 
  beforeEach(() => {
    app = new TestApp();
  });
  
  describe("Load", () => {
    it("should not be null", () => AdminBase.should.not.be.null)

    it("should be instantiated", () => {
      module = new AdminTest(app);
      module.should.not.be.null;
    });
  });
  describe("Init", () => {
    beforeEach(() => {
      module = new AdminTest(app);
    });

    it("should have a base url", () => {
      module.base.should.equal('/test');
    });
    
    it("should have routes", () => {
      app.get('admin-ui').provide.calledWith('adminPage', 'Test_models', '/test').should.be.true;
      app.get('admin-ui').provide.calledWith('adminPage', 'New Test_model', '/test/new').should.be.true;
      app.get('admin-ui').provide.calledWith('adminPage', 'Edit Test_model', '/test/edit/:id').should.be.true;
      app.get('admin-ui').provide.calledWith('adminRoute', 'get', '/test/delete/:id').should.be.true;
      app.get('admin-ui').provide.calledWith('adminRoute', 'post', '/test/save').should.be.true;
    });
    
    it("should have a template prefix", () => {
      module.prefix.should.equal('admin-test_models');
    })
  });
});
