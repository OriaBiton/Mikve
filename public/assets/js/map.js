function initMap() {
  const mapDiv = byId('map');
  let map = new google.maps.Map(mapDiv, {
    center: {lat: 31.0461, lng: 34.8516},
    zoom: 7,
    disableDefaultUI: true,
    zoomControl: true,
  });
  let input = byId('address-input');
  const options = {
    fields: ['place_id', 'geometry', 'name'],
    componentRestrictions: {country: 'il'}
  };
  let autocomplete = new google.maps.places.Autocomplete(input, options);
  autocomplete.bindTo('bounds', map);

  let marker = new google.maps.Marker({map: map});

  autocomplete.addListener('place_changed', () => {
    let place = autocomplete.getPlace();
    mapDiv.dataset.name = place.name;
    if (!place.geometry) return;
    if (place.geometry.viewport)
      map.fitBounds(place.geometry.viewport);
    else {
      map.setCenter(place.geometry.location);
      //map.setZoom(3);
    }
    marker.setPlace({
      placeId: place.place_id,
      location: place.geometry.location
    });
    marker.setVisible(true);
    mapDiv.dataset.placeId = place.place_id;
  });
}
