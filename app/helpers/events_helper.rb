module EventsHelper

  def to_properties(event)
    { id: event['id'], event_url: event['event_url'], #desc: event['description'] }
      name: event['name'], group: event['group'], venue: event['name'], venue: event['address_1'] }
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
