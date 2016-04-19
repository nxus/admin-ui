'use strict';

import AdminUI from '../src/index'

import TestApp from '@nxus/core/lib/test/support/TestApp';

describe("AdminUI", () => {
  var module;
  var app = new TestApp();
 
  beforeEach(() => {
    app = new TestApp();
  });
  
  describe("Load", () => {
    it("should not be null", () => AdminUI.should.not.be.null)

    it("should be instantiated", () => {
      module = new AdminUI(app);
      module.should.not.be.null;
    });
  });
  describe("Init", () => {
    beforeEach(() => {
      module = new AdminUI(app);
    });

    it("should gather events", () => {
      app.get('admin-ui').gather.calledWith('adminPage')
      app.get('admin-ui').gather.calledWith('adminRoute')
      app.get('admin-ui').gather.calledWith('modelAction')
      app.get('admin-ui').gather.calledWith('instanceAction')
    });
    
    it("should have protected routes", () => {
      app.get('users').provide.calledWith('protectedRoute', '/admin').should.be.true
      app.get('users').provide.calledWith('protectedRoute', '/admin/*').should.be.true
    });
    
  });
});
