'use strict';

var locationFindersApp = angular.module('locationFindersApp', []);
locationFindersApp.controller('LocationFindersCtrl', ['$scope', '$element', '$attrs', '$timeout', 'sharedService', function($scope, $element, $attrs, $timeout, sharedService) {

    $scope.location = { str : '' };
    $scope.lastUpdated = -1;
    $scope.diff = 1000;
    $scope.running = false;
    $scope.lastLocationSent = null;

    $scope.init = function() {
        this.lastUpdated = this.now();
        $scope.$watch('location.str', $scope.strChanged);
    };

    $scope.strChanged = function(newValue, oldValue) {
        $scope.lastUpdated = $scope.now();
        $timeout( function timeoutedFind() {
            var flag = $scope.getPerformFindFlag();
            if( flag === 3 ) {
                $scope.doFind();
            } else {
                if( flag === 1 ) {
                    $timeout( timeoutedFind, $scope.diff );
                }
            }
        }, $scope.diff);
    };

    $scope.now = function() {
        return new Date().getTime();
    };

    $scope.doFind = function() {
        $.ajax({ url : '/locations/find.json', data : this.location })
            .done( function(response) {
                    if(!response) return;
                    if(response.length == 0) {
                        return;
                    }
                    var result = response[0];
                    var point = 'POINT(' + result['lon'] + ' ' + result['lat'] + ')';
                    sharedService.setMessage('location-changed', {address: result['address'], geom: point, lon: result['lon'], lat: result['lat']});
                })
            .always( function() {
                $scope.lastUpdated = $scope.now();
                $scope.running = false;
                $scope.$apply();
            });
        this.running = true;
        this.lastLocationSent = angular.copy(this.location,{});
    };

    /**
     *
     * @returns {Number} flags 0, 1 or 3
     * 0 = does nothing. There is no input for geolocation or request is running.
     * 1 = there is input for geolocation (which needs to be located) but the time gap hasn't been reached
     * 3 = there is input for geolocation (which needs to be located) and the time gap has been reached. Geocode!
     */
    $scope.getPerformFindFlag = function() {
        if(this.running) return 0;
        var flag = this.isInputGiven() ? 1 : 0;
        var now = this.now();
        var diff = now-this.lastUpdated;
        if( diff >= this.diff) {
            flag |= 2;
        }
        return flag;
    };

    $scope.isInputGiven = function() {
        if( angular.equals(this.location, this.lastLocationSent)) {
            return false;
        }
        return this.location['str'].length > 1;
    };
}]);