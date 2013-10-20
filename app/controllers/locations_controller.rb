class LocationsController < ApplicationController

  def find
    g_result = Geocoder.search(params[:str])
    result = []
    g_result.each do |element|
      data = element.data
      geom = data['geometry']
      loc = geom['location']
      result << { lat: loc['lat'], lon: loc['lng'], address: data['formatted_address'] }
    end

    respond_to do |format|
      format.json { render json: result }
    end
  end

end