class EventsController < ApplicationController

  def index

    [:lon,:lat].each do |val|
      if params[val].nil?
        @data = { error: 'You must submit :lon and :lat!'}
      end
    end

    @data = { greeting: 'Hallo'} if @data.nil?

    respond_to do |format|
      format.json { render json: @data }
      #format.geojson { }
    end
  end

end
