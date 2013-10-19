class EventsController < ApplicationController

  def index

    [:lon,:lat].each do |val|
      if params[val].nil?
        @events = { error: 'You must submit :lon and :lat!'}
      end
    end

    @events = MeetupGrabber::Client.new.grab params

    respond_to do |format|
      format.json { render json: @events }
      format.geojson { }
    end
  end

end
