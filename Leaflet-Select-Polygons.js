/*Style for layers*/

var stylelayer = {
    defecto: {
        color: "red",
        opacity: 1,
        fillcolor: "red",
        fillOpacity: 0.1,
        weight: 0.5
    },
    reset: {
        color: "red",
        opacity: 0.4,
        weight: 1
    },
    highlight: {
        weight: 5,
        color: '#0D8BE7',
        dashArray: '',
        fillOpacity: 0.7
    },
    selected: {
        color: "blue",
        opacity: 0.3,
        weight: 0.5
    }

}

/*Initial map and add layer for mapbox*/
var map = L.map('map').setView([51.666, 6.097], 7);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'my company',
    id: 'mapbox.light'
}).addTo(map);

/*declarando variables globales*/
var placenames = new Array();
var zipcodes = new Object();

$.each(statesData.features, function(index, feature) {
    var name = `${feature.properties.zipcode} ${feature.properties.municipality}  ( ${feature.properties.province} -  ${feature.properties.town})`
    placenames.push(name);
    zipcodes[name] = feature.properties.zipcode;
});

/* area de busqueda */
$('#places').typeahead({
    source: placenames,
    afterSelect: function(b) {
        redraw(b)
    }
});

var arrayBounds = [];
function redraw(b) {
    geojson.eachLayer(function(layer) {
        if (layer.feature.properties.zipcode == zipcodes[b]) {
            selectTypeaheadFeature(layer)
        }
    })
}

var geojson = L.geoJson(statesData, {
    style: stylelayer.defecto,
    onEachFeature: onEachFeature
}).addTo(map);

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
            //dblclick : selectFeature
    });
}

var popupLayer;
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle(stylelayer.highlight);
    info.update(layer.feature.properties);
}


function resetHighlight(e) {
    var layer = e.target;
    var feature = e.target.feature;
    if (checkExistsLayers(feature)) {
        setStyleLayer(layer, stylelayer.highlight)
    } else {
        setStyleLayer(layer, stylelayer.defecto)
    }
    /* Para agregar evento al la capa y mostrar detalles */
    /* popupLayer.on('mouseout', function(e) {
                this.closePopup();
            })*/
}

var featuresSelected = []
function zoomToFeature(e) {

    var layer = e.target;
    var feature = e.target.feature;

    if (checkExistsLayers(feature)) {
        removerlayers(feature, setStyleLayer, layer, stylelayer.defecto)
        removeBounds(layer)

    } else {
        addLayers(feature, setStyleLayer, layer, stylelayer.highlight)
        addBounds(layer)
    }
    map.fitBounds(arrayBounds);
    detailsselected.update(featuresSelected)

}


function selectTypeaheadFeature(layer) {
    var layer = layer;
    var feature = layer.feature;

    if (checkExistsLayers(feature)) {
        removerlayers(feature, setStyleLayer, layer, stylelayer.defecto)

        removeBounds(layer)

    } else {
        addLayers(feature, setStyleLayer, layer, stylelayer.highlight)
        addBounds(layer)
    }
    map.fitBounds(arrayBounds.length != 0 ? arrayBounds : initbounds)
    detailsselected.update(featuresSelected)

}

var corner1 = L.latLng(53.62, 2.931),
    corner2 = L.latLng(50.763, 7.182)
var initbounds = L.latLngBounds(corner1, corner2)
var arrayBounds = [];

function addBounds(layer) {
    arrayBounds.push(layer.getBounds())
}

function removeBounds(layer) {
    arrayBounds = arrayBounds.filter(bounds => bounds != layer.getBounds())
}

function setStyleLayer(layer, styleSelected) {
    layer.setStyle(styleSelected)
}

function removerlayers(feature, callback) {
    featuresSelected = featuresSelected.filter(obj => obj.zipcode != feature.properties.zipcode)
    callback(arguments[2], arguments[3])
}

function addLayers(feature, callback) {
    featuresSelected.push({
        zipcode: feature.properties.zipcode,
        feature: feature
    })
    callback(arguments[2], arguments[3])
}

function checkExistsLayers(feature) {
    var result = false
    for (var i = 0; i < featuresSelected.length; i++) {
        if (featuresSelected[i].zipcode == feature.properties.zipcode) {
            result = true;
            break;
        }

    };
    return result
}

/*show info layers*/
var info = L.control({
    position: 'bottomleft'
});

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function(properties) {
    this._div.innerHTML =

        '<h4>Properties</h4>' + (properties ?
            `
                Aantal: ${properties.amount}<br>
                Gemeente: ${properties.municipality}<br>
                Provincie:${properties.province}<br>
                Plaats:${properties.town}<br>
                Postcode:${properties.zipcode}
                
                    ` : 'Hover over a state');;
};

info.addTo(map);


var detailsselected = L.control();
detailsselected.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info scroler');
    this.update();
    return this._div;
};


var detailshow = function() {
    var result = ''
    var total = 0
    for (var i = 0; i < featuresSelected.length; i++) {

        var properties = featuresSelected[i].feature.properties
        result +=
            `
        Amout: ${properties.amount}<br>
        Municipality: ${properties.municipality}<br>
        Province:${properties.province}<br>
        zipcode:${properties.zipcode}
        <a href="#" onclick=dellayer(${properties.zipcode})>Delete</a>
        <hr>`;
        total += properties.amount


    }
    return {
        result: result,
        total: total
    };
}

detailsselected.update = function(arrayselected) {

    var details = detailshow()
    this._div.innerHTML = '<b>TOTAL: ' + details.total + '</b><br>' + details.result;
    $('#suma', window.parent.document).val(details.total);


};

detailsselected.addTo(map);

function dellayer(zipcode) {
    geojson.eachLayer(function(layer) {
        if (layer.feature.properties.zipcode == zipcode) {
            selectTypeaheadFeature(layer)
        }
    })
}
