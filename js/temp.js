/*
     * GOOGLE LOGIN
     */
    (function() {
        var po = document.createElement('script');
        po.type = 'text/javascript'; 
        po.async = true;
        po.src = 'https://apis.google.com/js/client:plusone.js?onload=google_plus_sign_in_render';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(po, s);
    })();
    
    $scope.render = function() {
        gapi.signin.render('btn-google', {
            callback: function(authResult) {
                if (authResult['access_token']) {
                    $rootScope.google = authResult;
                    console.log($scope.google);
                    gapi.client.load('plus','v1', function(){
                        var request = gapi.client.plus.people.get({
                            'userId': 'me'
                        });
                        request.execute(function(resp) {
                            console.log(resp);
                        });
                    });
                    $scope.$apply();
                    //$state.go('home');
                    //$rootScope.$broadcast('auth:login-success', data);
                } else if (authResult['error']) {
                    // There was an error.
                    // Possible error codes:
                    //   "access_denied" - User denied access to your app
                    //   "immediate_failed" - Could not automatially log in the user
                    console.log('There was an error: ' + authResult['error']);
                }
                
            },
            clientid: '690094214896-9re2s54m6ifbg1p09s1kvbea3acasa67.apps.googleusercontent.com',
            cookiepolicy: "single_host_origin",
            // requestvisibleactions: "http://schemas.google.com/AddActivity",
            scope: "https://www.googleapis.com/auth/plus.login"
        });
    };
    
    /*
     * FACEBOOK LOGIN
     */
    $window.fbAsyncInit = function() {
        // Executed when the SDK is loaded
        FB.init({ 
            /* 
            The app id of the web app;
            To register a new app visit Facebook App Dashboard
            ( https://developers.facebook.com/apps/ ) 
            */
            appId: '849520311729195', 
            /* 
            Adding a Channel File improves the performance 
            of the javascript SDK, by addressing issues 
            with cross-domain communication in certain browsers. 
            */
            channelUrl: 'app/channel.html', 
            /* 
            Set if you want to check the authentication status
            at the start up of the app 
            */
            status: true, 
            /* 
            Enable cookies to allow the server to access 
            the session 
            */
            cookie: true, 
            /* Parse XFBML */
            xfbml: true 
        });
        //sAuth.watchAuthenticationStatusChange();
    
    
        FB.Event.subscribe('auth.authResponseChange', function(res) {
            if (res.status === 'connected') {
                /* 
                The user is already logged, 
                is possible retrieve his personal info
                */
                FB.api('/me', function(res) {
                    $rootScope.$apply(function() { 
                        $rootScope.user = res; 
                    });
                });
                /*
                This is also the point where you should create a 
                session for the current user.
                For this purpose you can use the data inside the 
                res.authResponse object.
                */
            } else {
                /*
                The user is not logged to the app, or into Facebook:
                destroy the session on the server.
                */
                console.log('error');
                console.log(res);
            }
        });
        
    };

    (function(d){
        // load the Facebook javascript SDK
        var js, 
        id = 'facebook-jssdk', 
        ref = d.getElementsByTagName('script')[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement('script'); 
        js.id = id; 
        js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        ref.parentNode.insertBefore(js, ref);
    }(document));