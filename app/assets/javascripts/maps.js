angular.element(document).ready(function() {
    OpenLayers.ImgPath = "/assets/";
    angular.bootstrap($('#map-app'), ['mapApp', 'globalBroadcastServices']);
});