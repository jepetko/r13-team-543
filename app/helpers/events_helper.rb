module EventsHelper

  def to_properties(event)
    props = { id: event['id'], event_url: event['event_url'], name: event['name'], group: event['group'] }
    if !event['venue'].nil?
      venue = event['venue']
      props['venue_name'] = venue['name']
      props['venue_address_1'] = venue['address_1']
      props['venue_city'] = venue['city']
    end
    props
  end

  def to_geojson(events)
    results = events['results']
    str = ''
    if !results.nil?
      results.each do |result|
        venue = result['venue']
        next if venue.nil?

        lon = venue['lon']
        lat = venue['lat']

        if str != ''
          str << ','
        end
        str << '{"type" : "Feature",'
        str << "\"id\": \"#{result['id']}\","
        str << "\"geometry\": {\"type\": \"Point\", \"coordinates\": [#{lon}, #{lat}]},"
        str << '"geometry_name" : "SHAPE",'
        str << "\"properties\" : #{to_properties(result).to_json}"
        str << '}'
      end
    end
    '{"type":"FeatureCollection","features":[' + str + ']}'
  end

end
