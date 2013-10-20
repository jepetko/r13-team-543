var mapApp = angular.module('mapApp', []);
mapApp.controller('OLMapCtrl', ['$scope', '$element', '$attrs', 'sharedService', '$window', '$timeout', function($scope, $element, $attrs, sharedService, $window, $timeout) {
    $scope.proxy =  {
        getURL : function(url) {
            return '/proxy?url=' + encodeURIComponent(url);
        }
    };

    $scope.map = null;

    /* projection is webmercator */
    $scope.projection = {
        projection: new OpenLayers.Projection("EPSG:102113"),
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339
    };

    $scope.DEFAULT_POINT_STYLE = {
        pointRadius: 6,
        fillColor: "#ffcc66",
        fillOpacity: 0.8,
        strokeColor: "#cc6633",
        strokeWidth: 2,
        strokeOpacity: 0.8
    };

    $scope.DRAW_EXTENT_LAYER_NAME = 'drawExtent';
    $scope.DRAW_MARKERS_LAYER_NAME = 'markers';

    $scope.mapEvents = {
        'moveend' : function() {
            var markers = $scope.map.getLayersBy('CLASS_NAME', 'OpenLayers.Layer.Markers');
            if( markers.length > 0 ) {
                $scope.hideMarkers(markers[0]);
            }
            return true;
        }
    };

    $scope.drawExtentHandlers = {
        /**
         * remove all rectangles from the layer when the control is deactivated
         */
        'deactivate' : function() {
            this.layer.destroyFeatures();
        },
        'featureadded' : function(evt) {
            var ids = [];
            var layer = $scope.map.getLayersByName('Events')[0];
            for(var i=0; i<layer.features.length; i++) {
                var f = layer.features[i];
                f = f.cluster ? f.cluster : [f];
                for(var j=0; j< f.length;j++) {
                    var subF = f[j];
                    if( evt.feature.geometry.intersects(subF.geometry) ) {
                        ids.push(subF.attributes['id']);
                    }
                }
            }
            sharedService.setMessage('features-selected', [ids]);
        }
    };

    $scope.selectFeatureHandlers = {
        /**
         * remove all bubbles (popups) from the map AND also unselect all features from the layer when
         * the layer is deactivated
         */
        'deactivate' : function() {
            while( $scope.map.popups.length > 0 ) {
                $scope.map.removePopup($scope.map.popups[0]);
            }
            this.unselectAll();
        }
    };

    $scope.wfsEventHandlers = {
        'featureselected': function (evt) {
            var feature = evt.feature;

            var info = '';
            for(var name in feature.attributes) {
                var value = feature.attributes[name];
                info += name + ': ' + value + '<br>';
            }

            // create own class which is autoSized per default and
            // defines a specific css class
            var clazz = OpenLayers.Class( OpenLayers.Popup.Anchored, {'autoSize': true});
            clazz.prototype.calculateRelativePosition = function(px) {
                var lonlat = this.map.getLonLatFromLayerPx(px);

                var extent = this.map.getExtent();
                var quadrant = extent.determineQuadrant(lonlat);

                var str = OpenLayers.Bounds.oppositeQuadrant(quadrant);

                //custom code
                var popover = $(this.div).find('.popover');
                popover.addClass('map-bubble-' + str);

                return str;
            };

            var content =   '<div class="map-bubble-root">\
                            <div class="popover fade in" style="display: block;">\
                            <h3 class="popover-title">Info</h3>\
                            <div class="popover-content">';
            content += info;
            content += '</div></div></div>';

            var popup = new clazz("popup",
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(400,200), //note: this will be affected by autoSize = true
                content,
                { size : new OpenLayers.Size(0,0), offset : new OpenLayers.Pixel(0,0) },
                false
            );
            feature.popup = popup;
            $scope.map.addPopup(popup);
        },
        'featureunselected': function (evt) {
            var feature = evt.feature;
            $scope.map.removePopup(feature.popup);
            feature.popup.destroy();
            feature.popup = null;
        },
        'loadend' : function(evt) {
            $scope.map.zoomToExtent(evt.object.getDataExtent());
            var results = [];
            var features = evt.response.features;
            $.each(features, function(idx,f) {
                results.push(f.attributes);
            });
            sharedService.setMessage('features-added', [results]);
        }
    };

    $scope.layerAdder = {
        base : function(layer) {
            var name = layer.name;
            var olLayer = $scope.map.getLayersByName(name);
            if( olLayer.length === 0 ) {
                var clazz = window['OpenLayers']['Layer'][layer.clazz];
                if( !clazz ) {
                    return; //TODO: throw Exception?
                }
                olLayer = new clazz( { name : name, type : layer.clazz_type, key : layer.key } )
                $scope.map.addLayer(olLayer);
            } else {
                olLayer = olLayer[0];
            }
            $scope.map.setBaseLayer(olLayer);
            olLayer.setVisibility(true);
        },
        wfs : function(layer,toggled) {

            var name = layer.name;
            var url = layer['url'];
            if(layer['use_proxy']) {
                url = '/proxy?url=' + encodeURIComponent(url);
            }
            var olLayer = $scope.map.getLayersByName(name);
            if( olLayer.length === 0 ) {
                var clazz = window['OpenLayers']['Layer'][layer.clazz];
                if( !clazz ) {
                    return; //TODO: throw Exception?
                }
                var strategies = [new OpenLayers.Strategy.Fixed()];
                var style = layer.style || $scope.DEFAULT_POINT_STYLE;
                var olStyle = null;
                if( layer.clustered ) {
                    strategies.push(new OpenLayers.Strategy.Cluster({threshold : 2}));
                    olStyle = new OpenLayers.Style(style, {
                        context: {
                            radius: function(feature) {
                                return Math.min(feature.attributes.count, 7) + 8;
                            },
                            label: function(feature) {
                                return feature.cluster ? feature.cluster.length : '';
                            },
                            icon: function(feature) {
                                return feature.cluster ? '' : MEETUP_LOGO_PATH;  //global variable supplied by Rails
                            }
                        }
                    });
                } else {
                    olStyle = new OpenLayers.Style(style);
                }
                olLayer = new clazz(layer.name, {
                    projection: "EPSG:4326",
                    strategies: strategies,
                    protocol: new OpenLayers.Protocol.HTTP({
                        url: url,
                        format: new OpenLayers.Format.GeoJSON()
                    }),
                    eventListeners : $scope.wfsEventHandlers,
                    styleMap : new OpenLayers.StyleMap( olStyle )
                });
                $scope.map.addLayer(olLayer);

                //raise the markers layer otherwise the markers cannot be clicked (because the lie below the other layers)
                var markers = $scope.map.getLayersByName($scope.DRAW_MARKERS_LAYER_NAME);
                if( markers.length > 0 ) {
                    $scope.map.setLayerIndex(markers[0], $scope.map.layers.length-1);
                }
            } else {
                olLayer = olLayer[0];
            }
            olLayer.setVisibility(toggled);
        }
    };

    $scope.toolAdder = {
        'selectFeature' : function() {
            var olLayers = $scope.map.getLayersBy('CLASS_NAME', 'OpenLayers.Layer.Vector');

            $.each(olLayers, function($idx,olLayer) {

                if( $scope.isDrawLayer(olLayer)) return;

                var controls = $scope.getToolsBy('layer', olLayer);

                if( controls.length == 0 ) {
                    var control = new OpenLayers.Control.SelectFeature(olLayer,{
                        autoActivate: true,
                        eventListeners : $scope.selectFeatureHandlers
                    });
                    $scope.map.addControl(control);
                } else {
                    $.each(controls, function(idx,control) {
                        control.activate();
                    });
                }
            });
        },
        'drawExtent' : function() {
            var name = $scope.DRAW_EXTENT_LAYER_NAME;
            var olLayer = $scope.map.getLayersByName(name);

            if( olLayer.length == 0 ) {
                olLayer = new OpenLayers.Layer.Vector(name);
                olLayer.preFeatureInsert = function() {
                    this.destroyFeatures();
                };
                $scope.map.addLayer(olLayer);
            } else {
                olLayer = olLayer[0];
            }

            var controls = $scope.getToolsBy('layer', olLayer);
            var createdControl = null;
            if( controls.length == 0) {
                var control = new OpenLayers.Control.DrawFeature(olLayer,
                    OpenLayers.Handler.RegularPolygon,
                    { handlerOptions: {sides:4, irregular: true},
                      autoActivate: true,
                      eventListeners : $scope.drawExtentHandlers
                    });
                $scope.map.addControl(control);
            } else {
                $.each(controls, function(idx,control) {
                    control.activate();
                });
                //Possible bug: could there be more than one control?
            }
            return $scope.getToolsBy('layer', olLayer)[0];
        }
    };

    $scope.init = function() {
        var options = {eventListeners: $scope.mapEvents, theme: null};
        $scope.map = new OpenLayers.Map($element.attr('id'), options);
        var markers = new OpenLayers.Layer.Markers( $scope.DRAW_MARKERS_LAYER_NAME );
        $scope.map.addLayer(markers);

        //$scope.map.addControl(new OpenLayers.Control.MousePosition());
    };

    $scope.addLayer = function(type,layer) {
        var adder = $scope.layerAdder[type];
        if(!adder) return;
        adder.call(this,layer);
    };

    $scope.toggleLayer = function(type,layer,toggled) {
        var adder = $scope.layerAdder[type];
        if(!adder) return;
        adder.call(this,layer,toggled);
    };

    $scope.changeTool = function(tool) {
        $scope.deactivateTools();
        if( tool ) {
            var adder = $scope.toolAdder[tool.type];
            if(!adder) return null;
            return adder.call(this,tool);
        }
        return null;
    };

    $scope.deactivateTools = function() {
        var arr = ['SelectFeature', 'DrawFeature'];
        var controls = $scope.map.controls;
        $.each(controls, function(idx,control) {
            var pos = control.CLASS_NAME.lastIndexOf('.');
            var subClazzName = control.CLASS_NAME.substr(pos+1);
            if($.inArray(subClazzName, arr) != -1 ) {
                control.deactivate();
            }
        });
    };

    $scope.getToolsBy = function(propertyName, value) {
        var controls = $scope.map.controls;
        var result = [];
        $.each(controls, function(idx,control) {
            if( control[propertyName] === value) {
                result.push(control);
            }
        });
        return result;
    };

    $scope.isDrawLayer = function(olLayer) {
        return $.inArray( olLayer.name, [$scope.DRAW_EXTENT_LAYER_NAME] ) != -1;
    };

    $scope.toWebMercator = function(lonLat) {
        if(!lonLat) return null;
        var webMercatorLonLat = lonLat.clone();  //otherwise watcher will complain
        var from = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
        var to   = $scope.map.getProjection(); //... to the current map projection
        return webMercatorLonLat.transform( from, to);
    };

    $scope.zoomTo = function(tgtPos) {
        var acc = 10;
        var lvl = $scope.map.numZoomLevels/acc*(acc-1);
        $scope.map.setCenter(tgtPos, lvl);
    };

    $scope.destroyMarkers = function(markers) {
        if(!markers) return;
        var list = markers.markers;
        $.each(list, function(idx,element) {
            if(element.icon.imageDiv) {
                $(element.icon.imageDiv).popover('destroy');
            }
        })
        markers.clearMarkers();
    };

    $scope.hideMarkers = function(markers) {
        if(!markers) return;
        var list = markers.markers;
        $.each(list, function(idx,element) {
            if(element.icon.imageDiv) {
                $(element.icon.imageDiv).popover('hide');
            }
        })
    };

    $scope.setMarker = function(tgtPos, content) {
        var size = new OpenLayers.Size(32,32);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon('/assets/marker.png',size,offset);
        var markers = this.map.getLayersBy('CLASS_NAME', 'OpenLayers.Layer.Markers');
        if( markers.length == 0 ) return;
        markers = markers[0];
        this.destroyMarkers(markers);

        var marker = new OpenLayers.Marker(tgtPos,icon);
        markers.addMarker(marker);

        var div = $(icon.imageDiv);
        div.attr('data-content', content);
        div.popover({trigger: 'click'}).popover('show');
        div.css('cursor', 'pointer');
    };

    $scope.flyToOwnLoc = function(callback) {
        function fly(geopos) {
            var coords = geopos.coords;
            var lonLat = new OpenLayers.LonLat(coords.longitude,coords.latitude);
            var tgtPos = $scope.toWebMercator(lonLat);
            $scope.zoomTo(tgtPos);
            if( callback ) {
                callback.apply(this, arguments);
            }
        };
        navigator.geolocation.getCurrentPosition(fly);
    };

    $scope.$on('handleBroadcast', function(evt,msg,obj) {
        switch(msg) {
            case 'tool-clicked':
                if( obj.id == 'zoom') {
                    $scope.flyToOwnLoc();
                }
                break;
            case 'tool-changed':
                $scope.changeTool(obj);
                break;
            case 'location-changed':
                var lon = obj['lon'];
                var lat = obj['lat'];
                var layer = $scope.map.getLayersByName('Events')[0];
                layer.protocol = new OpenLayers.Protocol.HTTP({
                    url: "/events.geojson?lon=" + lon + '&lat=' + lat,
                    format: new OpenLayers.Format.GeoJSON()
                });
                layer.refresh();
                break;
        }
    });

    $timeout( (function(scope,w) {
        return function() {
            scope.addLayer('base',{   "id" : "base_layer",
                "name" : "Bing Maps Aerial Labels",
                "key": "ArZbMKQ6_og3-twbH84sWXKVK4THYUy-DsGm60O2d_Ojd1DGyUcKt-VN230bO0fv",
                "clazz" : "Bing",
                "clazz_type": "AerialWithLabels",
                "label" : "Bing Aerial Layer with Labels",
                "type" : "base"} );
            scope.flyToOwnLoc( function(geopos) {
                var coords = geopos.coords;
                scope.toggleLayer('wfs', {   "id" : "events",
                    "name" : "Events",
                    "clazz" : "Vector",
                    "label" : "Events",
                    "type" : "wfs",
                    "url" : "/events.geojson?lon=" + coords.longitude + '&lat=' + coords.latitude,
                    "checked" : "checked",
                    "clustered" : true,
                    "use_proxy" : false,
                    "style" : {
                        "pointRadius": "${radius}",
                        "label": "${label}",
                        "fillColor": "#FEE0D2",
                        "fillOpacity": 0.8,
                        "strokeColor": "#DE2D26",
                        "fontColor": "#000000",
                        "strokeWidth": 4,
                        "strokeOpacity": 0.8,
                        //for not clustered features:
                        externalGraphic: "${icon}",
                        graphicWidth: 60,
                        graphicHeight: 44
                    }
                }, true);
            });
            var tool = scope.changeTool( {
                "id": "extent",
                "type": "drawExtent"
            });
            tool.handler.stopDown = false;
            tool.handler.stopUp = false;
        }
    })($scope, $window), 2000);

}]);