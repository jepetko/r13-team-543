require_relative '../../app/controllers/grabber/meetup_grabber'
require 'spec_helper'

describe MeetupGrabber::Client do

  before(:each) do
    @lonlat = { :lon => '', :lat => ''}
  end

  describe 'some basic configuration' do

    it 'should have couple of methods' do
      clazz = MeetupGrabber::Client
      [:setup, :url, :api_key, :version].each do |method|
        clazz.respond_to?(method).should be_true
      end
    end

  end

  describe 'grabbing open_events' do
    it 'should return couple of events if we pass lon/lat parameters' do

    end

  end

end

