﻿exports.Application = function() {
    this.navigation = {
        profile: {
            self: element(by.css('#userprofileform #profile')),
            email: element(by.name('email')),
            password: element(by.name('password')),
            signin: element(by.id('btn-signin')),
            profile: element(by.css('#userprofileform #btn-profile')),
            signout: element(by.css('#userprofileform #btn-signout'))
        },
        menu: {
            newTask: {
                self: element(by.id('nav-newtask'))
            },
            allTasks: {
                self: element(by.id('nav-alltasks'))
            },
            management: {
                self: element(by.id('nav-management')),
                users : element(by.id('nav-management-users'))
            }
        }
    };

    this.alerts = {
        danger: $('div .alert.alert-danger').$('p')
    };

    this.home = {
        search: {
            self: element(by.model('search.criteria'))
        }
    };
};

exports.User = function(app) {
    this.app = app;

    this.signin = function(email, password) {
        ///<summary>Sign in</summary>
        ///<param name="email">Email</param>
        ///<param name="password">Password</param>
        
        this.app.navigation.profile.email.sendKeys(email);
        this.app.navigation.profile.password.sendKeys(password);
        this.app.navigation.profile.signin.click();
    };

    this.signinAsAdmin = function() {
        return this.signin("admin@host.com", "a");
    };

    this.signinAsBusinessAnalyst = function() {
        return this.signin("businessanalyst@host.com", "a");
    };

    this.signout = function() {
        ///<summary>Sign out</summary>

        this.app.navigation.profile.self.click();
        return this.app.navigation.profile.signout.click();
    };
};