var mapView = new ol.View ({
    center: ol.proj.fromLonLat([12.33547, 7.3697]),
    zoom: 5.5,
    });
    
    var map = new ol.Map ({
        target: 'map',
        view: mapView,
        // enlever le control de zoom a la arte
        /*controls: []*/
    });
    
    /* Stamen Toner */
    var StamenToner = new ol.layer.Tile({
        title: 'Stamen Toner',
        preload: Infinity,
        source: new ol.source.Stamen({
            layer: 'toner',
        }),
        visible: false
    });
    
    map.addLayer(StamenToner);
    
    /* Stamen Watercolor */
    var StamenWatercolor = new ol.layer.Tile({
        title: 'Stamen Watercolor',
        preload: Infinity,
        source: new ol.source.Stamen({
            layer: 'watercolor',
        }),
        visible: false
    });
    
    map.addLayer(StamenWatercolor);
    
    /* Stamen Terrain */
    var StamenTerrain = new ol.layer.Tile({
        title: 'Stamen Terrain',
        preload: Infinity,
        source: new ol.source.Stamen({
            layer: 'terrain',
        }),
        visible: false
    });
    map.addLayer(StamenTerrain);
    
    /* pour sectionner les calque de couche en groupe(carte de base et thematiques)*/
    /*
    var noneTile = new ol.layer.Tile ({
        title: 'none',
        type: 'base',
        visible: false
    })
    */
    var osmTile = new ol.layer.Tile ({
      title: 'Open Street Map',
     // type: 'base',
      visible: true,
      source: new ol.source.OSM() 
    });
    
    map.addLayer(osmTile);
 
    
    // /* creation de la listes de calques */
    
     var layerSwitcher = new ol.control.LayerSwitcher({
       activationMode: 'click',
       startActive: false,
       groupSelectStyle: 'children'
     });
    
     map.addControl(layerSwitcher);
    /*
    function toggleLayer(eve) {
      var lyrname = eve.target.value;
      var checkedStatus = eve.target.checked;
      var lyrList = map.getLayers();
    
      lyrList.forEach(function(element){
        if (lyrname == element.get('title')){
            element.setVisible(checkedStatus);
        }
      });
    };
    */
    
    
    var mousePosition = new ol.control.MousePosition({
      className: 'mousePosition',
      projection: 'EPSG:4326',
      coordinateFormat: function(coordinate){return ol.coordinate.format(coordinate,'{x} , {y}',4);}
    });
    
    map.addControl(mousePosition);
    
    var scaleControl = new ol.control.ScaleLine({
      bar: true,
      text: true
      });
      
      map.addControl(scaleControl);
    
    
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');
    
    var popup = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250,
        },
    });
    
    map.addOverlay(popup);
    
    closer.onclick = function(){
        popup.setPosition(undefined);
        closer.blur();
        return false;
    };
    /*
    map.on('singleclick', function (evt) {
      var viewResolution = /** @type {number}  (view.getResolution());
      var feature = wmsSource.getGetFeatureInfoUrl(
        evt['coordinate'],
        viewResolution,
        'EPSG:32632',
        {'INFO_FORMAT': 'text/html'}
      )
    */
    map.on('singleclick', function (evt){
        content.innerHTML = '';
        var resolution = mapView.getResolution();
    
        var url = chaussee1Tile.getSource().getGetFeatureInfoUrl(evt.coordinate, resolution, 'EPSG:32632', {
            'INFO_FORMAT': 'application/json',
            'propertyName': 'ogc_fid,id_degradation,non,type_famille,niveau_de_severite,adresse_voie,image,date_temps'
        });
    
        if (url){
            $.getJSON(url, function (data){
                var feature = data.features[0];
                var props = feature.properties;
                content.innerHTML = "<h3> ogc_fid : </h3> <p>" + 
                props.ogc_fid.toUppperCase() +"</p> <br> <h3> id_degradation : </h3> <p>" 
                props.id_degradation.toUppperCase() + "</p> <br> <h3> non : </h3> <p>" + 
                props.non.toUppperCase() + "</p> <br> <h3> type_famille : </h3> <p>" + 
                props.type_famille.toUppperCase() + "</p> <br> <h3> niveau_de_severite : </h3> <p>" + 
                props.niveau_de_severite.toUppperCase() + "</p> <br> <h3> adresse_voie : </h3> <p>" + 
                props.adresse_voie.toUppperCase() + "</p> <br> <h3> image : </h3> <p>" + 
                props.image.toUppperCase() + "</p> <br> <h3> date_temps : </h3> <p>" + 
                props.date_temps.toUppperCase() + "</p>";
    
                popup.setPosition(evt.coordinate);
    
        })
      } 
      else {
        popup.setPosition(undefined);
      }
    });
    //demarre la fonctoin d'auto-localisation de l'utilisateur
    
    var intervalAutolocate;
    var posCurrent;
    
    var geolocation = new ol.Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
    },
      tracking: true,
      projection: mapView.getProjection()
    });
    
    var positionFeature = new ol.Feature();
    positionFeature.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: '#3399CC',
          }),  
          stroke: new ol.style.Stroke({ 
            color: "#fff",
             width: 2,
              }),
          }),
      })
    );
    var accuracyFeature = new ol.Feature();
    
    var currentPositionLayer = new ol.layer.Vector({
      map: map,
      source: new ol.source.Vector({
          features: [accuracyFeature, positionFeature],
      }),    
    });
    
    function startAutolocate() {
      var coordinates = geolocation.getPosition();
      positionFeature.setGeometry (coordinates ? new ol.geom.Point(coordinates) : null);
      mapView.setCenter(coordinates);
      mapView.setZoom(16); 
      accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
      intervalAutolocate = setInterval(function () {
        var coordinates = geolocation.getPosition();
        var accuracy = geolocation.getAccuracyGeometry()
        positionFeature.setGeometry (coordinates ? new ol.geom.Point(coordinates) : null);
        map.getView().setCenter(coordinates);
        mapView.setZoom(16);
        accuracyFeature.setGeometry(accuracy);
      }, 100000);
    
    }
          
    function stopAutolocate() {
      clearInterval(intervalAutolocate);
      positionFeature.setGeometry(null);
      accuracyFeature.setGeometry(null);
    }
    
    
    //bouton de localisation de l'utilisateur 
    
    $("#btnCrosshair").on("click", function (event) {
      $("#btnCrosshair").toggleClass("clicked");
      if ($("#btnCrosshair").hasClass("clicked")) {
        startAutolocate();
      }else {
        stopAutolocate();
      }
    });
    /*
    //ajouter un bouton de home
    var homeButton = document.createElement('button');
    homeButton.innerHTML = '<img src="resources/images/house.svg" alt="" style="width:20px;height:20px;filter:brightness(0) invert(2);vertical-align:niddle"></img>';
    homeButton.className ='myButton';
    
    var homeElement = document.createElement('div');
    homeElement.className ='homeButttonDiv';
    homeElement.appendChild(homeButton);
    
    var homeControl = new ol.control.Control({
      element: homeElement
    })
    
    homeButton.addEventListener("click", () =>{
      location.href = "index.html";
    })
    
    map.addControl(homeControl);*/

    
